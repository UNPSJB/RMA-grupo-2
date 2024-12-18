from fastapi.datastructures import FormData
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Enum
from sqlalchemy.future import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import and_, desc, asc
from backend.src import schemas, models
from backend.src.models import Usuario, Nodo, Medicion, Alarma, DatosSensores, TokenAlarma
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
async def crear_medicion(db: AsyncSession, medicion: schemas.MedicionCreate) -> schemas.MedicionCreate:
    result = await db.execute(select(models.DatosSensores).filter(models.DatosSensores.tipo == medicion.tipo))
    sensor_data = result.scalars().first()

    if not sensor_data:
        raise ValueError(f"Tipo de dato {medicion.tipo} no encontrado en la base de datos.")
    
    result_alarmas = await db.execute(
        select(models.Alarma).filter(models.Alarma.tipo == medicion.tipo, models.Alarma.nodo == medicion.nodo)
    )
    alarmas = result_alarmas.scalars().all()
    mError = not (sensor_data.min <= medicion.dato <= sensor_data.max)

    if mError is False:
        for alarma in alarmas:
            if alarma.chat_id is None:
                if medicion.dato < alarma.valor_min or medicion.dato > alarma.valor_max:
                    alarma_message = f"🚨¡ALERTA! Se ha disparado una alarma para el nodo {medicion.nodo} " \
                                    f"con el valor {medicion.dato} para el tipo de dato {sensor_data.descripcion}. "
                    await send_alarm_to_channel(alarma_message, CHANNEL_ID)
            else:
                if medicion.dato < alarma.valor_min or medicion.dato > alarma.valor_max:
                    alarma_message = f"🚨¡ALERTA! Se ha disparado una alarma para el nodo {medicion.nodo} " \
                                    f"con el valor {medicion.dato} para el tipo de dato {sensor_data.descripcion}. "
                    await send_alarm_to_channel(alarma_message, alarma.chat_id)

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
         await db.refresh(new_medicion)
    except Exception as errorEnBase:
         await db.rollback()
         print(f"Error en la base de datos: {errorEnBase}")
         raise HTTPException(status_code=400, detail="Error al crear una nueva medicion") from errorEnBase
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
        db_nodo.posicionx = nodo.posicionx
        db_nodo.posiciony = nodo.posiciony
        db_nodo.nombre = nodo.nombre
        db_nodo.descripcion = nodo.descripcion
        await db.commit()
        await db.refresh(db_nodo)
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