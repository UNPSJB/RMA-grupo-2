from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db 
from backend.src import schemas, services
from sqlalchemy.future import select
from backend.src.models import Temperatura, Medicion, Nodo
from typing import List


router = APIRouter()

## ----------------------- TEMPERATURA

@router.post("/temperatura", response_model=schemas.TemperaturaCreate)
async def create_temperatura(temperatura: schemas.TemperaturaCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await services.crear_temperatura(db, temperatura)
    except HTTPException as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/temperatura/", response_model=List[schemas.TemperaturaCreate])
async def read_temperaturas(db: AsyncSession = Depends(get_db)):
    async with db.begin():
        result = await db.execute(select(Temperatura))
        temperaturas = result.scalars().all()
    return temperaturas
## ----------------------- MEDICIONES

@router.post("/medicion", response_model=schemas.MedicionCreate)
async def create_temperatura(medicion: schemas.MedicionCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await services.crear_medicion(db, medicion)
    except HTTPException as e:
        raise HTTPException(status_code=400, detail=str(e))

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

## ---------------------- NODO

@router.post("/nodo", response_model=schemas.NodoCreate)
async def create_nodo(nodo: schemas.NodoCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await services.crear_usuario(db, nodo)
    except HTTPException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/nodo/{nodo_id}", response_model=schemas.Nodo)
async def get_nodo(nodo_id: int, db: AsyncSession = Depends(get_db)):
    return await services.leer_nodo(db, nodo_id)

@router.put("/nodo/{nodo_id}", response_model=schemas.Nodo)
async def update_nodo(nodo_id: int, nodo: schemas.NodoUpdate, db: AsyncSession = Depends(get_db)):
    return await services.modificar_nodo(db, nodo_id, nodo)

@router.delete("/nodo/{nodo_id}")
async def delete_nodo(nodo_id: int, db: AsyncSession = Depends(get_db)):
    return await services.eliminar_nodo(db, nodo_id)
