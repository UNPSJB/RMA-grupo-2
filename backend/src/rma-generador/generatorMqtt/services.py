from sqlalchemy.ext.asyncio import AsyncSession
#from sqlalchemy.future import select
from ...import schemas, models
from .....fastapi import HTTPException
from .database import SessionLocal



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