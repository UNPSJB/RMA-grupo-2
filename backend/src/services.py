from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src import schemas, models
from src.models import Usuario
from fastapi import HTTPException
from database import SessionLocal
import datetime



async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        

############################################################ TEMPERATURA ############################################################
async def crear_temperatura(db: AsyncSession, temperatura: schemas.TemperaturaCreate) -> schemas.TemperaturaCreate:
    new_temperatura = models.Temperatura(        
        nodo=temperatura.nodo,
        tipo=temperatura.tipo,
        dato=temperatura.dato,
        tiempo=temperatura.tiempo
    )
    print(f"{new_temperatura.dato}, {new_temperatura.nodo}, {new_temperatura.tiempo}, {new_temperatura.tipo}")
    try:
            db.add(new_temperatura)
            await db.commit()  
            await db.refresh(new_temperatura)
    except Exception as e:
            await db.rollback()  
            raise HTTPException(status_code=400, detail="Error al crear temperatura") from e
    return new_temperatura
## ----------------------- MEDICIONES
async def crear_medicion(db: AsyncSession, medicion: schemas.MedicionCreate) -> schemas.MedicionCreate:
    new_medicion = models.Medicion(        
        nodo=medicion.nodo,
        tipo=medicion.tipo,
        dato=medicion.dato,
        tiempo=medicion.tiempo,
        bateria=medicion.bateria
    )
    print("Medicion creada")
    try:
         db.add(new_medicion)
         await db.commit()
         await db.refresh(new_medicion)
    except Exception as errorEnBase:
         await db.rollback()
         raise HTTPException(status_code=400, detail="Error al crear una nueva medicion") from errorEnBase
    return new_medicion

## ----------------------- USUARIO
async def crear_usuario(db: AsyncSession, usuario: schemas.UsuarioCreate) -> schemas.UsuarioCreate:
    result = await db.execute(select(models.Usuario).filter(models.Usuario.email == usuario.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está en uso")
    result = await db.execute(select(models.Usuario).filter(models.Usuario.contrasena == usuario.contrasena))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="La contraseña ya está en uso")
    new_usuario = models.Usuario(
        nombre=usuario.nombre,
        email=usuario.email,
        contrasena=usuario.contrasena,
        fecha_registro=datetime.datetime.now(datetime.timezone.utc)
    )
    print(f"Nombre: {new_usuario.nombre}, Email: {new_usuario.email}, Fecha: {new_usuario.fecha_registro}")
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
    
async def eliminar_usuario(db: AsyncSession, usuario_id: int) -> dict:
    db_usuario = await leer_usuario(db, usuario_id)
    if db_usuario:
        await db.delete(db_usuario)
        await db.commit()
        return {"detail": "Usuario eliminado"}
    else:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

