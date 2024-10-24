from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.src import schemas, models
from backend.src.models import Usuario, Nodo
from fastapi import HTTPException
from backend.database import SessionLocal
from backend.database import SessionLocal
import datetime

async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        

## ----------------------- TEMPERATURA
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
            #print(f"Error al crear temperatura: {e}")  # Imprimir el error
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

##------------------NODO

async def crear_nodo(db: AsyncSession, nodo: schemas.NodoCreate) -> schemas.NodoCreate:
    result = await db.execute(select(models.Nodo).filter(models.Nodo.id == nodo.id))
    existing_nodo = result.scalars().first()
    if existing_nodo:
        raise HTTPException(status_code=400, detail="Ya existe ese nodo")
    new_nodo = models.Nodo(
        id = nodo.id,
        posicionX = nodo.posicionX,
        posicionY = nodo.posicionY
    )
    print(f"Id: {new_nodo.id}, X: {new_nodo.posicionX}, Y: {new_nodo.posicionY}")
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
        db_nodo.id = nodo.id
        db_nodo.posicionX = nodo.posicionX
        db_nodo.posicionY = nodo.posicionY
        await db.commit()
        await db.refresh(db_nodo)
        return db_nodo
    else:
        raise HTTPException(status_code=404, detail="Nodo no encontrado")
    
async def eliminar_nodo(db: AsyncSession, nodo_id: int) -> dict:
    db_nodo = await leer_usuario(db, nodo_id)
    if db_nodo:
        await db.delete(db_nodo)
        await db.commit()
        return {"detail": "Nodo eliminado"}
    else:
        raise HTTPException(status_code=404, detail="Nodo no encontrado")
