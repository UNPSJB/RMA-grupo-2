from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Enum
from sqlalchemy.future import select
from backend.src import schemas, models
from backend.src.models import Usuario, Nodo, Medicion
from fastapi import HTTPException
from backend.database import SessionLocal
from backend.src.datos import datos
from passlib.context import CryptContext
import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") #para encriptar pass
async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
## ----------------------- MEDICIONES
async def crear_medicion(db: AsyncSession, medicion: schemas.MedicionCreate) -> schemas.MedicionCreate:
    mError = not (datos[medicion.tipo][0] <= medicion.dato <= datos[medicion.tipo][1])
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
    async with db.begin:
        result = await db.execute(select(Medicion).filter(Medicion.id == medicion_id))
        db_medicion = result.scalar_one_or_none()
        if db_medicion is None:
            raise HTTPException(status_code=404, detail="Medicion no existe")
        return db_medicion

async def leer_mediciones(db: AsyncSession):
    result = await db.execute(select(Medicion))  
    return result.scalars().all() 

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
        fecha_registro=datetime.datetime.now(datetime.timezone.utc)
    )

    try:
        db.add(new_usuario)
        await db.commit()
        await db.refresh(new_usuario)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Error al crear usuario") from e

    return new_usuario

async def leer_usuario(db: AsyncSession, usuario_id: int) -> schemas.Usuario:
    async with db.begin:
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
        db_usuario.rol = usuario.rol.value
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
        raise HTTPException(status_code=400, detail="Error al crear nodo") from e
    return new_nodo

async def leer_nodo(db: AsyncSession, nodo_id: int) -> schemas.Nodo:
    async with db.begin():
        result = await db.execute(select(Nodo).filter(Nodo.id == nodo_id))
        db_nodo = result.scalar_one_or_none()
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