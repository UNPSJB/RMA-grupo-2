from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Enum
from sqlalchemy.future import select
from sqlalchemy import and_
from backend.src import schemas, models
from backend.src.models import Usuario, Nodo, Medicion, Alarma
from fastapi import HTTPException
from backend.database import SessionLocal
import datetime
from backend.src.auth import pwd_context

async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
## ----------------------- MEDICIONES
async def crear_medicion(db: AsyncSession, medicion: schemas.MedicionCreate) -> schemas.MedicionCreate:
    result = await db.execute(select(models.DatosSensores).filter(models.DatosSensores.type == medicion.tipo))
    sensor_data = result.scalars().first()

    if not sensor_data:
        raise ValueError(f"Tipo de dato {medicion.tipo} no encontrado en la base de datos.")
    
    result_alarmas = await db.execute(
        select(models.Alarma).filter(models.Alarma.tipo == medicion.tipo, models.Alarma.nodo == medicion.nodo)
    )
    alarmas = result_alarmas.scalars().all()
    mError = not (sensor_data.min <= medicion.dato <= sensor_data.max)

    for alarma in alarmas:
        if alarma.valor_min <= medicion.dato <= alarma.valor_max:
            # me falta poner el bot, aqui enviare el mensaje.
            break

    new_medicion = models.Medicion(
        nodo=medicion.nodo,
        tipo=medicion.tipo,
        dato=medicion.dato,
        tiempo=medicion.tiempo,
        bateria=medicion.bateria,
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

async def leer_mediciones_filtro(db: AsyncSession, filtros: schemas.MedicionFiltro):
    query = select(Medicion).where(
        and_(
            Medicion.tipo == filtros.tipo,
            Medicion.nodo == filtros.nodo,
            Medicion.fecha >= filtros.fechaDesde,
            Medicion.fecha <= filtros.fechaHasta
        )
    )
    result = await db.execute(select(query))
    datos = {
        "valores": [medicion.valor for medicion in result],
        "fechas": [medicion.fecha for medicion in result]
    }
    return datos


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

## ----------------------- ALARMA
async def create_alarma(db: AsyncSession, alarma: schemas.AlarmaCreate):
    query_tipo = select(schemas.DatosSensores).filter(schemas.DatosSensores.tipo == alarma.tipo)
    result_tipo = await db.execute(query_tipo)
    tipo = result_tipo.scalars().first()
    if not tipo:
        raise ValueError(f"El tipo de dato con ID {alarma.tipo} no existe.")
    
    query_nodo = select(schemas.Nodo).filter(schemas.Nodo.id == alarma.nodo)
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
        valor_max=alarma.valor_max
    )
    db.add(new_alarma)
    await db.commit()
    await db.refresh(new_alarma)
    return new_alarma