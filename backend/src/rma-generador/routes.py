from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db 
from backend.src import schemas, services
from sqlalchemy.future import select
from backend.src.models import Medicion
from typing import List


router = APIRouter()

## ----------------------- MEDICIONES

@router.post("/medicion", response_model=schemas.MedicionCreate)
async def create_medicion(medicion: schemas.MedicionCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await services.crear_medicion(db, medicion)
    except HTTPException as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/medicion/", response_model=List[schemas.MedicionCreate])
async def read_mediciones(db: AsyncSession = Depends(get_db)):
    async with db.begin():
        result = await db.execute(select(Medicion))
        medicion = result.scalars().all()
    return medicion
## ----------------------- USUARIO
@router.post("/usuario", response_model=schemas.UsuarioCreate)
async def create_usuario(usuario: schemas.UsuarioCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await services.crear_usuario(db, usuario)
    except HTTPException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/usuario/{usuario_id}", response_model=schemas.Usuario)
async def get_usuario(usuario_id: int, db: AsyncSession = Depends(get_db)):
    return await services.leer_usuario(db, usuario_id)

@router.put("/usuario/{usuario_id}", response_model=schemas.Usuario)
async def update_usuario(usuario_id: int, usuario: schemas.UsuarioUpdate, db: AsyncSession = Depends(get_db)):
    return await services.modificar_usuario(db, usuario_id, usuario)

@router.delete("/usuario/{usuario_id}")
async def delete_usuario(usuario_id: int, db: AsyncSession = Depends(get_db)):
    return await services.eliminar_usuario(db, usuario_id)
