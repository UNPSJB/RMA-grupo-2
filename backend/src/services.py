from fastapi.datastructures import FormData
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Enum
from sqlalchemy.future import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import and_, desc, asc
from sqlalchemy.orm import selectinload
from backend.src import schemas, models
from backend.src.models import Usuario, Nodo, Medicion, Alarma, DatosSensores, TokenAlarma, Cuenca, HistorialPosiciones, VariableNodo
from fastapi import File, HTTPException, UploadFile
from backend.database import SessionLocal
import datetime
from backend.src.auth import pwd_context
from backend.src.bot import send_alarm_to_channel
from backend.src.bot import CHANNEL_ID
import pyotp
import csv
import io

async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
## ----------------------- MEDICIONES
# El cambio que realice fue primero guardar la medicíon, despues 
async def crear_medicion(db: AsyncSession, medicion: schemas.MedicionCreate) -> schemas.MedicionCreate:
    result = await db.execute(select(models.DatosSensores).filter(models.DatosSensores.tipo == medicion.tipo))
    sensor_data = result.scalars().first()

    mError = not (sensor_data.min <= medicion.dato <= sensor_data.max)

    if not sensor_data:
        raise ValueError(f"Tipo de dato {medicion.tipo} no encontrado en la base de datos.")
  
    new_medicion = models.Medicion(
        nodo=medicion.nodo,
        tipo=medicion.tipo,
        dato=medicion.dato,
        tiempo=medicion.tiempo,
        error=mError
    )

    try:
        db.add(new_medicion)
        await db.commit()
        # NO usar refresh aquí: abre transacción implícita que luego hace ROLLBACK
        # El objeto new_medicion ya tiene el ID asignado por el DB (RETURNING en INSERT)
    except Exception as errorEnBase:
        await db.rollback()
        print(f"Error en la base de datos: {errorEnBase}")
        raise HTTPException(status_code=400, detail="Error al crear una nueva medicion") from errorEnBase
    
    # Procesar alarmas en una sesión separada (no afecta a la transacción principal)
    try:
        async with SessionLocal() as db_alarmas:
            async with db_alarmas.begin():
                result_alarmas = await db_alarmas.execute(
                    select(models.Alarma).filter(models.Alarma.tipo == medicion.tipo, models.Alarma.nodo == medicion.nodo)
                )
                alarmas = result_alarmas.scalars().all()

                if mError is False:
                    for alarma in alarmas:
                        # Verificar si el valor está fuera del rango permitido
                        if medicion.dato < alarma.valor_min or medicion.dato > alarma.valor_max:
                            alarma_message = f"🚨¡ALERTA! Se ha disparado una alarma para el nodo {medicion.nodo} " \
                                            f"con el valor {medicion.dato} para el tipo de dato {sensor_data.descripcion}. "
                            # Enviar al canal grupal o chat personal según configuración
                            destino = alarma.chat_id if alarma.chat_id else CHANNEL_ID
                            await send_alarm_to_channel(alarma_message, destino)
    except Exception as e:
        print(f"Error al procesar alarmas: {e}")

    return new_medicion
    



async def leer_medicion(db: AsyncSession, medicion_id: int) -> schemas.Medicion:
    async with db.begin():
        result = await db.execute(select(Medicion).filter(Medicion.id == medicion_id))
        db_medicion = result.scalar_one_or_none()
        if db_medicion is None:
            raise HTTPException(status_code=404, detail="Medicion no existe")
        return db_medicion

async def leer_mediciones(db: AsyncSession):
    result = await db.execute(select(Medicion)) 
    return result.scalars().all() 

async def leer_ultima_medicion(db: AsyncSession, type_id: int) -> schemas.Medicion:
    result = await db.execute(select(Medicion).filter(Medicion.tipo == type_id).order_by(desc(Medicion.tiempo)).limit(1)) 
    return result.scalars().first()

async def leer_mediciones_filtro(db: AsyncSession, filtros: schemas.MedicionFiltro):
    result = await db.execute(select(Medicion.dato, Medicion.tiempo)
                              .filter(Medicion.tipo == filtros.tipo,
                                      Medicion.nodo == filtros.nodo,
                                      Medicion.tiempo >= filtros.fechaDesde,
                                      Medicion.tiempo <= filtros.fechaHasta)
                                      .order_by(asc(Medicion.tiempo)))
    datos_procesados = []
    for dato in result.fetchall():  # `.fetchall()` obtiene todas las filas como tuplas.
        datos_procesados.append(
            schemas.MedicionFiltrada(dato=dato[0], tiempo=dato[1])  # Crea un objeto con el esquema correcto.
        )
    return datos_procesados
async def listar_tipos_medicion(db: AsyncSession):
    result = await db.execute(select(Medicion.tipo, DatosSensores.descripcion)
                              .join(DatosSensores, Medicion.tipo == DatosSensores.tipo)
                              .group_by(Medicion.tipo, DatosSensores.descripcion))
    return [{"value": data.tipo, "label": data.descripcion} for data in result.all()]

async def procesar_csv_medicion(db:AsyncSession, archivo: UploadFile = File(...)):
    # Crear un archivo en memoria a partir del string
    # Leer el contenido del archivo y decodificarlo
        contenido = (await archivo.read()).decode('utf-8')  # Decodifica a string
        
        # Crear un archivo en memoria con el contenido decodificado
        archivo_virtual = io.StringIO(contenido)
        
        # Leer el archivo como CSV
        reader = csv.DictReader(archivo_virtual)
        # Usar csv.DictReader para leer las filas
        for fila in reader:
            try:
                # Convertir y validar los datos de la fila
                medicion = schemas.MedicionCreate(
                    nodo=int(fila["nodo"]),
                    tipo=int(fila["tipo"]),
                    dato=float(fila["dato"]),
                    tiempo=datetime.datetime.fromisoformat(fila["tiempo"]),
                    error=fila["error"].lower() == "true"
                )
                await crear_medicion(db, medicion)
            except ValidationError as e:
                print(f"Error de validación en la fila {fila}: {e}")
            except KeyError as e:
                print(f"Columna faltante en la fila {fila}: {e}")
        return {"msg": "ok"}

## ----------------------- USUARIO
async def crear_usuario(db: AsyncSession, usuario: schemas.UsuarioCreate) -> schemas.UsuarioCreate:
    result = await db.execute(select(models.Usuario).filter(models.Usuario.email == usuario.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está en uso")
    hashed_password = pwd_context.hash(usuario.contrasena) #encripte la pass
    new_usuario = models.Usuario(
        nombre=usuario.nombre,
        email=usuario.email,
        contrasena=hashed_password, #Guardar la contraseña encriptada
        fecha_registro=datetime.datetime.now(datetime.timezone.utc),
        rol="default"
    )
    #print("VALORES: ", new_usuario.nombre, " ", new_usuario.email, " ", new_usuario.contrasena, " ", new_usuario.rol)
    try:
        db.add(new_usuario)
        await db.commit()
        await db.refresh(new_usuario)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Error al crear usuario") from e

    return new_usuario

async def leer_usuario(db: AsyncSession, usuario_id: int) -> schemas.Usuario:
    async with db.begin():
        print("BUSCA USUARIO", usuario_id)
        result = await db.execute(select(Usuario).filter(Usuario.id == usuario_id))
        db_usuario = result.scalar_one_or_none()
        if db_usuario is None:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        return db_usuario
'''   
async def modificar_usuario(db: AsyncSession, usuario_id: int, usuario: schemas.UsuarioUpdate) -> schemas.Usuario:
    db_usuario = await leer_usuario(db, usuario_id)
    
    if db_usuario:
        db_usuario.nombre = usuario.nombre
        db_usuario.email = usuario.email
        db_usuario.contrasena = usuario.contrasena  # Asegúrate de manejar la contraseña de manera segura
        await db.commit()
        await db.refresh(db_usuario)
        return db_usuario
    else:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
'''    
async def modificar_usuario(db: AsyncSession, usuario_id: int, usuario: schemas.UsuarioUpdateRol) -> schemas.Usuario:
    db_usuario = await leer_usuario(db, usuario_id)
    if db_usuario:
        db_usuario.rol = usuario.rol
        await db.commit()
        await db.refresh(db_usuario)
        return db_usuario
    else:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
 

async def modificar_rol_usuario(db: AsyncSession, usuario_id: int, usuario: schemas.UsuarioUpdateRol) -> schemas.Usuario:
    db_usuario = await leer_usuario(db, usuario_id)
    
    if db_usuario:
        db_usuario.rol = usuario.rol
        await db.commit()
        await db.refresh(db_usuario)
        return db_usuario
    else:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

async def eliminar_usuario(db: AsyncSession, usuario_id: int) -> dict:
    db_usuario = await leer_usuario(db, usuario_id)
    if db_usuario:
        await db.delete(db_usuario)
        await db.commit()
        return {"detail": "Usuario eliminado"}
    else:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

async def login_usuario(db: AsyncSession, usuario: schemas.UsuarioLogin):
    result = await db.execute(select(Usuario).where(Usuario.email == usuario.email))
    user = result.scalar_one_or_none()   
    if user is None or not pwd_context.verify(usuario.contrasena, user.contrasena):
        raise HTTPException(status_code=401, detail="Correo electronico o contraseña incorrectos.")
    return user

async def leer_todos_los_usuarios(db: AsyncSession):
    result = await db.execute(select(Usuario))  
    return result.scalars().all() 
##------------------NODO

async def crear_nodo(db: AsyncSession, nodo: schemas.NodoCreate) -> schemas.NodoCreate:
    new_nodo = models.Nodo(
        posicionx = nodo.posicionx,
        posiciony = nodo.posiciony,
        nombre = nodo.nombre,
        descripcion = nodo.descripcion,
        cuenca_id = nodo.cuenca_id,
        es_movil = nodo.es_movil,
    )
    try:
        db.add(new_nodo)
        await db.commit()
        await db.refresh(new_nodo)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al crear nodo: {str(e)}") from e
    return new_nodo

async def leer_nodo(db: AsyncSession, nodo_id: int) -> schemas.Nodo:
    async with db.begin():
        result = await db.execute(select(Nodo).filter(Nodo.id == nodo_id))
        db_nodo = result.scalar_one_or_none()
        print("LLEGA AKI CON RESULTADO ", db_nodo)
        if db_nodo is None:
            raise HTTPException(status_code=404, detail="Nodo no encontrado")
        return db_nodo
    
async def modificar_nodo(db: AsyncSession, nodo_id: int, nodo: schemas.NodoUpdate) -> schemas.Nodo:
    db_nodo = await leer_nodo(db, nodo_id)

    if db_nodo:
        # Guardar posición anterior para detectar cambios
        posicion_cambio = (db_nodo.posicionx != nodo.posicionx or db_nodo.posiciony != nodo.posiciony)

        db_nodo.posicionx = nodo.posicionx
        db_nodo.posiciony = nodo.posiciony
        db_nodo.nombre = nodo.nombre
        db_nodo.descripcion = nodo.descripcion
        db_nodo.cuenca_id = nodo.cuenca_id
        db_nodo.es_movil = nodo.es_movil

        await db.commit()
        await db.refresh(db_nodo)

        # Si el nodo es móvil y cambió de posición, guardar en historial
        if db_nodo.es_movil and posicion_cambio:
            historial_entry = HistorialPosiciones(
                nodo_id=nodo_id,
                latitud=nodo.posicionx,
                longitud=nodo.posiciony,
                timestamp=datetime.datetime.now(datetime.timezone.utc)
            )
            db.add(historial_entry)
            await db.commit()

        return db_nodo
    else:
        raise HTTPException(status_code=404, detail="Nodo no encontrado")
    
async def eliminar_nodo(db: AsyncSession, nodo_id: int) -> dict:
    db_nodo = await leer_nodo(db, nodo_id)
    if db_nodo:
        await db.delete(db_nodo)
        await db.commit()
        return {"detail": "Nodo eliminado"}
    else:
        raise HTTPException(status_code=404, detail="Nodo no encontrado")
    
async def leer_todos_los_nodos(db: AsyncSession):
    result = await db.execute(select(Nodo))  
    return result.scalars().all() 

async def listar_nodos(db: AsyncSession):
    result = await db.execute(select(Nodo))
    return [{"value": nodo.id, "label": nodo.nombre} for nodo in result.scalars().all()]
## ----------------------- ALARMA
async def crear_alarma(db: AsyncSession, alarma: schemas.AlarmaCreate):
    query_tipo = select(DatosSensores).filter(DatosSensores.tipo == alarma.tipo)
    result_tipo = await db.execute(query_tipo)
    tipo = result_tipo.scalars().first()
    if not tipo:
        raise ValueError(f"El tipo de dato con ID {alarma.tipo} no existe.")
    
    query_nodo = select(Nodo).filter(Nodo.id == alarma.nodo)
    result_nodo = await db.execute(query_nodo)
    nodo = result_nodo.scalars().first()
    if not nodo:
        raise ValueError(f"El nodo con ID {alarma.nodo} no existe.")

    new_alarma = Alarma(
        nombre=alarma.nombre,
        descripcion=alarma.descripcion,
        tipo=alarma.tipo,
        nodo=alarma.nodo,
        valor_min=alarma.valor_min,
        valor_max=alarma.valor_max,
        chat_id=alarma.chat_id
    )
    db.add(new_alarma)
    await db.commit()
    await db.refresh(new_alarma)
    return new_alarma

async def leer_alarma(db: AsyncSession, alarma_id: int) -> schemas.Alarma:
    async with db.begin():
        result = await db.execute(select(Alarma).filter(Alarma.id == alarma_id))
        db_alarma = result.scalar_one_or_none()
        if db_alarma is None:
            raise HTTPException(status_code=404, detail="Alarma no encontrada")
        return db_alarma
    
async def modificar_alarma(db: AsyncSession, alarma_id: int, alarma: schemas.AlarmaUpdate) -> schemas.Alarma:
    db_alarma = await leer_alarma(db, alarma_id)
    
    if db_alarma:
        db_alarma.nombre = alarma.nombre
        db_alarma.descripcion = alarma.descripcion
        db_alarma.tipo = alarma.tipo
        db_alarma.nodo = alarma.nodo
        db_alarma.valor_min = alarma.valor_min
        db_alarma.valor_max = alarma.valor_max
        db_alarma.chat_id = alarma.chat_id
        await db.commit()
        await db.refresh(db_alarma)
        return db_alarma
    else:
        raise HTTPException(status_code=404, detail="alarma no encontrada")
    
async def eliminar_alarma(db: AsyncSession, alarma_id: int) -> dict:
    db_alarma = await leer_alarma(db, alarma_id)
    if db_alarma:
        await db.delete(db_alarma)
        await db.commit()
        return {"detail": "Alarma eliminada"}
    else:
        raise HTTPException(status_code=404, detail="Alarma no encontrada")
    
async def leer_todas_las_alarmas(db: AsyncSession):
    result = await db.execute(select(Alarma))  
    return result.scalars().all() 

## ----------------------- TOKEN ALARMA
async def eliminar_vinculacion(usuario_id: int, db: AsyncSession):
    query = await db.execute(select(TokenAlarma).where(TokenAlarma.usuario_id == usuario_id))
    token_alarma = query.scalar_one_or_none()
    
    if not token_alarma:
        raise HTTPException(status_code=404, detail="Vinculación no encontrada")
    
    alarmas_query = await db.execute(select(Alarma).where(Alarma.chat_id == token_alarma.chat_id))
    alarmas = alarmas_query.scalars().all()

    for alarma in alarmas:
        await db.delete(alarma)
    
    await db.delete(token_alarma)
    await db.commit()
    
    return {"detail": "Vinculación y alarmas asociadas eliminadas"}

async def verificar_vinculacion(usuario_id: int, db: AsyncSession):
    query = await db.execute(select(TokenAlarma).where(TokenAlarma.usuario_id == usuario_id))
    data = query.scalar_one_or_none()
    
    if data is None:
        return {"status": False}
    else:
        return {"status": True, "chat_id": data.chat_id }

async def verificar_codigo(token: str, usuario_id: int, db: AsyncSession):
    token_query = await db.execute(
        select(TokenAlarma).where(TokenAlarma.otp == str(token))
    )
    data = token_query.scalar_one_or_none()

    if not data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    totp = pyotp.TOTP(data.secret, interval=60)
    if not totp.verify(token):
        raise HTTPException(status_code=401, detail="Token expirado")

    data.usuario_id = usuario_id
    await db.commit()
    await db.refresh(data)

    return {"status": "success", "message": "Token validado y usuario vinculado correctamente"}

##-----------------datos sensores---------------------##

# Crear un sensor
async def crear_sensor(db: AsyncSession, sensor: schemas.DatosSensoresCreate) -> models.DatosSensores:
    try:
        nuevo_sensor = models.DatosSensores(
            tipo=sensor.tipo,
            min=sensor.min,
            max=sensor.max,
            descripcion=sensor.descripcion
        )
        db.add(nuevo_sensor)
        await db.commit()
        await db.refresh(nuevo_sensor)
        return nuevo_sensor
    except SQLAlchemyError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al crear sensor: {str(e)}") from e

# Leer un sensor por ID
async def leer_sensor(db: AsyncSession, sensor_id: int) -> models.DatosSensores:
    result = await db.execute(select(models.DatosSensores).filter(models.DatosSensores.tipo == sensor_id))
    sensor = result.scalar_one_or_none()
    if sensor is None:
        raise HTTPException(status_code=404, detail="Sensor no encontrado")
    return sensor

async def modificar_sensor(db: AsyncSession, sensor_id: int, sensor: schemas.DatosSensoresUpdate) -> models.DatosSensores | None:
    # Buscar el sensor por ID
    result = await db.execute(select(models.DatosSensores).filter(models.DatosSensores.tipo == sensor_id))
    db_sensor = result.scalar_one_or_none()

    if db_sensor is None:
        return None  # Si no se encuentra el sensor, retorna None

    # Solo actualizamos 'min' y 'max'
    db_sensor.min = sensor.min
    db_sensor.max = sensor.max

    try:
        # Guardar cambios
        await db.commit()
        await db.refresh(db_sensor)
        return db_sensor
    except SQLAlchemyError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al modificar sensor: {str(e)}")


# Eliminar un sensor
async def eliminar_sensor(db: AsyncSession, sensor_id: int) -> dict:
    db_sensor = await leer_sensor(db, sensor_id)
    try:
        await db.delete(db_sensor)
        await db.commit()
        return {"detail": "Sensor eliminado"}
    except SQLAlchemyError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al eliminar sensor: {str(e)}") from e

# Leer todos los sensores
async def leer_todos_los_sensores(db: AsyncSession) -> list[models.DatosSensores]:
    result = await db.execute(select(models.DatosSensores))
    return result.scalars().all()

# Listar sensores con formato para select-options
async def listar_sensores(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(models.DatosSensores))
    return [{"value": sensor.tipo, "label": sensor.descripcion} for sensor in result.scalars().all()]

## ----------------------- CUENCA

# Crear una nueva cuenca
def poligonos_se_superponen(poligono1: dict, poligono2: dict) -> bool:
    """
    Verifica si dos polígonos GeoJSON se superponen.

    Utiliza el algoritmo de separación de ejes (SAT - Separating Axis Theorem)
    simplificado para verificar si hay intersección entre los polígonos.

    Args:
        poligono1: Polígono en formato GeoJSON {"type": "Polygon", "coordinates": [[[lon, lat], ...]]}
        poligono2: Polígono en formato GeoJSON

    Returns:
        True si los polígonos se superponen, False en caso contrario
    """
    try:
        # Extraer coordenadas (primer anillo de cada polígono)
        coords1 = poligono1.get('coordinates', [[]])[0]
        coords2 = poligono2.get('coordinates', [[]])[0]

        if not coords1 or not coords2:
            return False

        # Función auxiliar para verificar si un punto está dentro de un polígono (Ray casting algorithm)
        def punto_en_poligono(punto, poligono_coords):
            x, y = punto[0], punto[1]
            n = len(poligono_coords)
            dentro = False

            j = n - 1
            for i in range(n):
                xi, yi = poligono_coords[i][0], poligono_coords[i][1]
                xj, yj = poligono_coords[j][0], poligono_coords[j][1]

                if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
                    dentro = not dentro

                j = i

            return dentro

        # Verificar si algún vértice de poligono1 está dentro de poligono2
        for punto in coords1:
            if punto_en_poligono(punto, coords2):
                return True

        # Verificar si algún vértice de poligono2 está dentro de poligono1
        for punto in coords2:
            if punto_en_poligono(punto, coords1):
                return True

        # Verificar intersección de bordes (simplificado)
        # Si los polígonos se cruzan pero ningún vértice está dentro del otro
        def segmentos_se_cruzan(p1, p2, p3, p4):
            def ccw(A, B, C):
                return (C[1]-A[1]) * (B[0]-A[0]) > (B[1]-A[1]) * (C[0]-A[0])

            return ccw(p1,p3,p4) != ccw(p2,p3,p4) and ccw(p1,p2,p3) != ccw(p1,p2,p4)

        for i in range(len(coords1) - 1):
            for j in range(len(coords2) - 1):
                if segmentos_se_cruzan(coords1[i], coords1[i+1], coords2[j], coords2[j+1]):
                    return True

        return False

    except Exception as e:
        print(f"Error al verificar superposición de polígonos: {e}")
        return False

async def crear_cuenca(db: AsyncSession, cuenca: schemas.CuencaCreate) -> models.Cuenca:
    """
    Crea una nueva cuenca validando que no se superponga con cuencas existentes.

    Validaciones:
    - El nombre no debe estar duplicado
    - El polígono no debe superponerse con ninguna cuenca existente

    Args:
        db: Sesión de base de datos asíncrona
        cuenca: Datos de la cuenca a crear

    Returns:
        La cuenca creada

    Raises:
        HTTPException 400: Si el nombre está duplicado o hay superposición de polígonos
    """
    try:
        # Verificar que el nombre no esté duplicado
        result = await db.execute(select(models.Cuenca).filter(models.Cuenca.nombre == cuenca.nombre))
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="Ya existe una cuenca con ese nombre")

        # Verificar que el polígono no se superponga con cuencas existentes
        result_cuencas = await db.execute(select(models.Cuenca))
        cuencas_existentes = result_cuencas.scalars().all()

        for cuenca_existente in cuencas_existentes:
            if poligonos_se_superponen(cuenca.poligono, cuenca_existente.poligono):
                raise HTTPException(
                    status_code=400,
                    detail=f"El polígono de la cuenca se superpone con la cuenca '{cuenca_existente.nombre}'"
                )

        # Crear la nueva cuenca
        new_cuenca = models.Cuenca(
            nombre=cuenca.nombre,
            descripcion=cuenca.descripcion,
            poligono=cuenca.poligono
        )
        db.add(new_cuenca)
        await db.commit()
        await db.refresh(new_cuenca)
        return new_cuenca
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al crear cuenca: {str(e)}") from e

# Leer una cuenca por ID
async def leer_cuenca(db: AsyncSession, cuenca_id: int) -> models.Cuenca:
    result = await db.execute(select(models.Cuenca).filter(models.Cuenca.id == cuenca_id))
    cuenca = result.scalars().first()
    if not cuenca:
        raise HTTPException(status_code=404, detail="Cuenca no encontrada")
    return cuenca

# Leer una cuenca con sus nodos asociados
async def leer_cuenca_con_nodos(db: AsyncSession, cuenca_id: int) -> models.Cuenca:
    result = await db.execute(
        select(models.Cuenca)
        .filter(models.Cuenca.id == cuenca_id)
        .options(selectinload(models.Cuenca.nodos))
    )
    cuenca = result.scalars().first()
    if not cuenca:
        raise HTTPException(status_code=404, detail="Cuenca no encontrada")
    return cuenca

# Modificar una cuenca
async def modificar_cuenca(db: AsyncSession, cuenca_id: int, cuenca_update: schemas.CuencaUpdate) -> models.Cuenca:
    """
    Modifica una cuenca existente validando superposición de polígonos.

    Si se actualiza el polígono, verifica que no se superponga con otras cuencas.

    Args:
        db: Sesión de base de datos asíncrona
        cuenca_id: ID de la cuenca a modificar
        cuenca_update: Datos a actualizar

    Returns:
        La cuenca actualizada

    Raises:
        HTTPException 404: Si la cuenca no existe
        HTTPException 400: Si el nombre está duplicado o hay superposición de polígonos
    """
    try:
        result = await db.execute(select(models.Cuenca).filter(models.Cuenca.id == cuenca_id))
        db_cuenca = result.scalars().first()

        if not db_cuenca:
            raise HTTPException(status_code=404, detail="Cuenca no encontrada")

        # Verificar nombre duplicado si se está cambiando
        if cuenca_update.nombre and cuenca_update.nombre != db_cuenca.nombre:
            result_check = await db.execute(select(models.Cuenca).filter(models.Cuenca.nombre == cuenca_update.nombre))
            if result_check.scalars().first():
                raise HTTPException(status_code=400, detail="Ya existe una cuenca con ese nombre")

        # Verificar superposición de polígonos si se está actualizando el polígono
        if cuenca_update.poligono is not None:
            result_cuencas = await db.execute(
                select(models.Cuenca).filter(models.Cuenca.id != cuenca_id)
            )
            otras_cuencas = result_cuencas.scalars().all()

            for otra_cuenca in otras_cuencas:
                if poligonos_se_superponen(cuenca_update.poligono, otra_cuenca.poligono):
                    raise HTTPException(
                        status_code=400,
                        detail=f"El polígono actualizado se superpone con la cuenca '{otra_cuenca.nombre}'"
                    )

        # Actualizar campos
        if cuenca_update.nombre is not None:
            db_cuenca.nombre = cuenca_update.nombre
        if cuenca_update.descripcion is not None:
            db_cuenca.descripcion = cuenca_update.descripcion
        if cuenca_update.poligono is not None:
            db_cuenca.poligono = cuenca_update.poligono

        await db.commit()
        await db.refresh(db_cuenca)
        return db_cuenca
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al modificar cuenca: {str(e)}") from e

# Eliminar una cuenca
async def eliminar_cuenca(db: AsyncSession, cuenca_id: int):
    try:
        result = await db.execute(select(models.Cuenca).filter(models.Cuenca.id == cuenca_id))
        db_cuenca = result.scalars().first()

        if not db_cuenca:
            raise HTTPException(status_code=404, detail="Cuenca no encontrada")

        await db.delete(db_cuenca)
        await db.commit()
        return {"detail": "Cuenca eliminada"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al eliminar cuenca: {str(e)}") from e

# Leer todas las cuencas
async def leer_todas_las_cuencas(db: AsyncSession) -> list[models.Cuenca]:
    result = await db.execute(
        select(models.Cuenca).options(selectinload(models.Cuenca.nodos))
    )
    return result.scalars().all()

# Listar cuencas con formato para select-options
async def listar_cuencas(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(models.Cuenca))
    return [{"value": cuenca.id, "label": cuenca.nombre} for cuenca in result.scalars().all()]

# Asignar nodos a una cuenca
async def asignar_nodos_a_cuenca(db: AsyncSession, cuenca_id: int, nodo_ids: list[int]) -> models.Cuenca:
    try:
        # Verificar que la cuenca existe
        result = await db.execute(select(models.Cuenca).filter(models.Cuenca.id == cuenca_id))
        cuenca = result.scalars().first()
        if not cuenca:
            raise HTTPException(status_code=404, detail="Cuenca no encontrada")

        # Actualizar los nodos
        for nodo_id in nodo_ids:
            result_nodo = await db.execute(select(models.Nodo).filter(models.Nodo.id == nodo_id))
            nodo = result_nodo.scalars().first()
            if nodo:
                nodo.cuenca_id = cuenca_id

        await db.commit()
        await db.refresh(cuenca)
        return cuenca
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al asignar nodos a cuenca: {str(e)}") from e

## ----------------------- HISTORIAL POSICIONES

# Crear una nueva entrada en el historial de posiciones
async def crear_posicion_historial(db: AsyncSession, posicion: schemas.HistorialPosicionesCreate) -> models.HistorialPosiciones:
    try:
        # Verificar que el nodo existe
        result = await db.execute(select(models.Nodo).filter(models.Nodo.id == posicion.nodo_id))
        nodo = result.scalars().first()
        if not nodo:
            raise HTTPException(status_code=404, detail="Nodo no encontrado")

        # Si no se proporciona timestamp, usar la fecha actual
        timestamp = posicion.timestamp if posicion.timestamp else datetime.datetime.now(datetime.timezone.utc)

        new_posicion = models.HistorialPosiciones(
            nodo_id=posicion.nodo_id,
            latitud=posicion.latitud,
            longitud=posicion.longitud,
            timestamp=timestamp
        )
        db.add(new_posicion)
        await db.commit()
        await db.refresh(new_posicion)
        return new_posicion
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al crear posición en historial: {str(e)}") from e

# Leer el historial de posiciones de un nodo en un rango de fechas
async def leer_historial_posiciones_por_nodo(
    db: AsyncSession,
    filtro: schemas.HistorialPosicionesFiltro
) -> list[models.HistorialPosiciones]:
    try:
        result = await db.execute(
            select(models.HistorialPosiciones)
            .filter(
                models.HistorialPosiciones.nodo_id == filtro.nodo_id,
                models.HistorialPosiciones.timestamp >= filtro.fecha_desde,
                models.HistorialPosiciones.timestamp <= filtro.fecha_hasta
            )
            .order_by(asc(models.HistorialPosiciones.timestamp))
        )
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al leer historial de posiciones: {str(e)}") from e

# Leer todo el historial de posiciones de un nodo (sin filtro de fecha)
async def leer_todo_historial_nodo(db: AsyncSession, nodo_id: int) -> list[models.HistorialPosiciones]:
    try:
        result = await db.execute(
            select(models.HistorialPosiciones)
            .filter(models.HistorialPosiciones.nodo_id == nodo_id)
            .order_by(asc(models.HistorialPosiciones.timestamp))
        )
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al leer historial de posiciones: {str(e)}") from e

# Eliminar historial de posiciones de un nodo (útil para limpiar datos antiguos)
async def eliminar_historial_nodo(db: AsyncSession, nodo_id: int, fecha_hasta: datetime.datetime = None) -> dict:
    try:
        if fecha_hasta:
            # Eliminar solo registros hasta una fecha específica
            result = await db.execute(
                select(models.HistorialPosiciones)
                .filter(
                    models.HistorialPosiciones.nodo_id == nodo_id,
                    models.HistorialPosiciones.timestamp <= fecha_hasta
                )
            )
        else:
            # Eliminar todo el historial del nodo
            result = await db.execute(
                select(models.HistorialPosiciones)
                .filter(models.HistorialPosiciones.nodo_id == nodo_id)
            )

        posiciones = result.scalars().all()
        for posicion in posiciones:
            await db.delete(posicion)

        await db.commit()
        return {"detail": f"Se eliminaron {len(posiciones)} registros del historial"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al eliminar historial: {str(e)}") from e

## ----------------------- VARIABLES NODO

async def crear_variable_nodo(db: AsyncSession, nodo_id: int, variable: schemas.VariableNodoCreate) -> models.VariableNodo:
    """
    Crea una nueva variable configurable para un nodo específico.

    Esta función vincula un nodo con un tipo de sensor del catálogo global (datos_sensores),
    permitiendo configurar rangos y unidades de medida específicos para ese nodo.

    Args:
        db: Sesión de base de datos asíncrona
        nodo_id: ID del nodo al que se asignará la variable
        variable: Datos de la variable (tipo_sensor_id, unidad_medida, rangos, etc.)

    Returns:
        La variable creada con todos sus campos

    Raises:
        HTTPException 404: Si el nodo no existe
        HTTPException 404: Si el tipo de sensor no existe en el catálogo
        HTTPException 400: Si el nodo ya tiene una variable de ese tipo de sensor
        HTTPException 400: Si rango_min > rango_max
    """
    try:
        # 1. Verificar que el nodo existe
        result = await db.execute(select(models.Nodo).filter(models.Nodo.id == nodo_id))
        nodo = result.scalars().first()
        if not nodo:
            raise HTTPException(status_code=404, detail="Nodo no encontrado")

        # 2. Verificar que el tipo de sensor existe en el catálogo
        result_sensor = await db.execute(
            select(models.DatosSensores).filter(models.DatosSensores.tipo == variable.tipo_sensor_id)
        )
        tipo_sensor = result_sensor.scalars().first()
        if not tipo_sensor:
            raise HTTPException(
                status_code=404,
                detail=f"Tipo de sensor con ID {variable.tipo_sensor_id} no encontrado en el catálogo"
            )

        # 3. Verificar que el nodo no tenga ya una variable de este tipo de sensor
        # (Un nodo no puede medir el mismo tipo de sensor dos veces)
        result_check = await db.execute(
            select(models.VariableNodo).filter(
                models.VariableNodo.nodo_id == nodo_id,
                models.VariableNodo.tipo_sensor_id == variable.tipo_sensor_id
            )
        )
        if result_check.scalars().first():
            raise HTTPException(
                status_code=400,
                detail=f"El nodo ya tiene una variable del tipo '{tipo_sensor.descripcion}'"
            )

        # 4. Validar que rango_min <= rango_max si ambos están definidos
        if variable.rango_min is not None and variable.rango_max is not None:
            if variable.rango_min > variable.rango_max:
                raise HTTPException(status_code=400, detail="El rango mínimo no puede ser mayor que el rango máximo")

        # 5. Crear la nueva variable
        new_variable = models.VariableNodo(
            nodo_id=nodo_id,
            tipo_sensor_id=variable.tipo_sensor_id,
            unidad_medida=variable.unidad_medida,
            rango_min=variable.rango_min,
            rango_max=variable.rango_max,
            activo=variable.activo
        )
        db.add(new_variable)
        await db.commit()
        await db.refresh(new_variable)
        return new_variable
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al crear variable: {str(e)}") from e

# Leer una variable específica por ID
async def leer_variable_nodo(db: AsyncSession, variable_id: int) -> models.VariableNodo:
    result = await db.execute(select(models.VariableNodo).filter(models.VariableNodo.id == variable_id))
    variable = result.scalars().first()
    if not variable:
        raise HTTPException(status_code=404, detail="Variable no encontrada")
    return variable

async def leer_variables_por_nodo(db: AsyncSession, nodo_id: int) -> list[models.VariableNodo]:
    """
    Obtiene todas las variables configuradas para un nodo específico.

    La consulta incluye un JOIN con datos_sensores para tener acceso
    a la información del tipo de sensor (nombre, rangos globales).

    Args:
        db: Sesión de base de datos asíncrona
        nodo_id: ID del nodo

    Returns:
        Lista de variables del nodo ordenadas por el nombre del tipo de sensor

    Raises:
        HTTPException 404: Si el nodo no existe
    """
    try:
        # 1. Verificar que el nodo existe
        result_nodo = await db.execute(select(models.Nodo).filter(models.Nodo.id == nodo_id))
        nodo = result_nodo.scalars().first()
        if not nodo:
            raise HTTPException(status_code=404, detail="Nodo no encontrado")

        # 2. Obtener todas las variables del nodo con la relación tipo_sensor cargada
        # Esto permite acceder a tipo_sensor.descripcion en la respuesta
        result = await db.execute(
            select(models.VariableNodo)
            .options(selectinload(models.VariableNodo.tipo_sensor))  # Carga la relación
            .filter(models.VariableNodo.nodo_id == nodo_id)
            .order_by(asc(models.VariableNodo.tipo_sensor_id))
        )
        return result.scalars().all()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al leer variables del nodo: {str(e)}") from e

async def leer_variables_activas_por_nodo(db: AsyncSession, nodo_id: int) -> list[models.VariableNodo]:
    """
    Obtiene solo las variables activas de un nodo.

    Útil para mostrar únicamente las variables que están actualmente en uso.

    Args:
        db: Sesión de base de datos asíncrona
        nodo_id: ID del nodo

    Returns:
        Lista de variables activas ordenadas por tipo de sensor
    """
    try:
        result = await db.execute(
            select(models.VariableNodo)
            .options(selectinload(models.VariableNodo.tipo_sensor))
            .filter(
                models.VariableNodo.nodo_id == nodo_id,
                models.VariableNodo.activo == True
            )
            .order_by(asc(models.VariableNodo.tipo_sensor_id))
        )
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al leer variables activas: {str(e)}") from e

async def modificar_variable_nodo(
    db: AsyncSession,
    variable_id: int,
    variable_update: schemas.VariableNodoUpdate
) -> models.VariableNodo:
    """
    Modifica una variable existente de un nodo.

    Permite actualizar: unidad_medida, rangos (min/max), y estado activo.
    NO permite cambiar el tipo_sensor_id (para eso se debe eliminar y crear una nueva).

    Args:
        db: Sesión de base de datos asíncrona
        variable_id: ID de la variable a modificar
        variable_update: Campos a actualizar

    Returns:
        La variable actualizada

    Raises:
        HTTPException 404: Si la variable no existe
        HTTPException 400: Si rango_min > rango_max
    """
    try:
        result = await db.execute(select(models.VariableNodo).filter(models.VariableNodo.id == variable_id))
        db_variable = result.scalars().first()

        if not db_variable:
            raise HTTPException(status_code=404, detail="Variable no encontrada")

        # Actualizar campos permitidos
        if variable_update.unidad_medida is not None:
            db_variable.unidad_medida = variable_update.unidad_medida
        if variable_update.rango_min is not None:
            db_variable.rango_min = variable_update.rango_min
        if variable_update.rango_max is not None:
            db_variable.rango_max = variable_update.rango_max
        if variable_update.activo is not None:
            db_variable.activo = variable_update.activo

        # Validar rangos después de la actualización
        if db_variable.rango_min is not None and db_variable.rango_max is not None:
            if db_variable.rango_min > db_variable.rango_max:
                raise HTTPException(status_code=400, detail="El rango mínimo no puede ser mayor que el rango máximo")

        await db.commit()
        await db.refresh(db_variable)
        return db_variable
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al modificar variable: {str(e)}") from e

async def eliminar_variable_nodo(db: AsyncSession, variable_id: int) -> dict:
    """
    Elimina una variable de un nodo.

    Args:
        db: Sesión de base de datos asíncrona
        variable_id: ID de la variable a eliminar

    Returns:
        Mensaje de confirmación

    Raises:
        HTTPException 404: Si la variable no existe
    """
    try:
        result = await db.execute(select(models.VariableNodo).filter(models.VariableNodo.id == variable_id))
        db_variable = result.scalars().first()

        if not db_variable:
            raise HTTPException(status_code=404, detail="Variable no encontrada")

        await db.delete(db_variable)
        await db.commit()
        return {"detail": "Variable eliminada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al eliminar variable: {str(e)}") from e