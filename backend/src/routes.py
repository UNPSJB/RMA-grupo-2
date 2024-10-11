from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db 
from src import schemas, services

router = APIRouter()

@router.post("/temperatura", response_model=schemas.TemperaturaCreate)
async def create_temperatura(temperatura: schemas.TemperaturaCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await services.crear_temperatura(db, temperatura)
    except HTTPException as e:
        raise HTTPException(status_code=400, detail=str(e))
    
############################################################  ROUTER PRODUCTO ############################################################
