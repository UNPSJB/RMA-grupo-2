from sqlalchemy.ext.asyncio import AsyncSession
#from sqlalchemy.future import select
from src import schemas, models
from fastapi import HTTPException
from database import SessionLocal



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

'''
async def leer_producto(db:AsyncSession, producto_id:int) -> schemas.Producto:
     async with db.begin():
        result = await db.execute(select(Producto).filter(Producto.id == producto_id))
        db_producto = result.scalar_one_or_none()
        if db_producto is None:
              raise HTTPException(status_code=404, detail="Producto no encontrado")
        return db_producto

async def modificar_producto(db: AsyncSession, producto_id: int, producto:schemas.ProductoUpdate) -> schemas.ProductoUpdate:
    
    db_producto = await leer_producto(db, producto_id)
    
    if db_producto:
        db_producto.nombre = producto.nombre
        db_producto.precio = producto.precio
        db_producto.descripcion = producto.descripcion
        await db.commit()

        return {"detail": "Producto eliminado"}
        
async def eliminar_producto(db:AsyncSession, producto_id:int) -> schemas.ProductoDelete:
    
    db_producto = await leer_producto(db, producto_id)
    if db_producto:
        await db.delete(db_producto)
        await db.commit()
        return {"detail": "Producto eliminado"} 
    else:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
'''