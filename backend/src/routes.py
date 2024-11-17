import datetime
from os import getenv
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.src import schemas, services
from sqlalchemy.future import select
from backend.src.models import Medicion, Nodo, Usuario, Alarma
from typing import List
from backend.src.auth import authenticate_user
import jwt
from jwt.exceptions import InvalidTokenError

router = APIRouter()


## ----------------------- MEDICIONES


@router.post("/medicion", response_model=schemas.MedicionCreate)
async def create_medicion(
    medicion: schemas.MedicionCreate, db: AsyncSession = Depends(get_db)
):
    try:
        return await services.crear_medicion(db, medicion)
    except HTTPException as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/medicion/", response_model=List[schemas.MedicionCreate])
async def read_mdiciones(db: AsyncSession = Depends(get_db)):
    async with db.begin():
        result = await db.execute(select(Medicion))
        medicion = result.scalars().all()
    return medicion

@router.get("/medicion/filtrar", response_model=dict[str, list])
async def leer_mediciones_filtro(filtros: schemas.MedicionFiltro, db: AsyncSession = Depends(get_db)):
    try:
        return await services.leer_mediciones_filtro(db, filtros)
    except HTTPException as e:
        raise HTTPException(status_code=400, detail=str(e))

## ----------------------- LOGIN

@router.post("/login", response_model=schemas.Token)
async def login(usuario: schemas.UsuarioLogin, db: AsyncSession = Depends(get_db)):
    # Autentica al usuario
    user = await authenticate_user(db, usuario.email, usuario.contrasena)
    # Genera el token JWT con el rol incluido en el payload
    token_data = {"sub": user.email, "id": user.id, "role": user.rol}
    token = jwt.encode(token_data, getenv("SECRET_KEY"), algorithm='HS256')
    print(" Y EL TOKEN ES ", token_data)
    return {"access_token": token, "token_type": "bearer"}


## ----------------------- USUARIO


@router.post("/usuario", response_model=schemas.UsuarioCreate)
async def create_usuario(
    usuario: schemas.UsuarioCreate, db: AsyncSession = Depends(get_db)
):
    try:
        return await services.crear_usuario(db, usuario)
    except HTTPException as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/usuario/{usuario_id}", response_model=schemas.Usuario)
async def get_usuario(usuario_id: int, db: AsyncSession = Depends(get_db)):
    return await services.leer_usuario(db, usuario_id)


@router.put("/usuario/{usuario_id}", response_model=schemas.Usuario)
async def update_usuario(
    usuario_id: int, usuario: schemas.UsuarioUpdate, db: AsyncSession = Depends(get_db)
):
    return await services.modificar_usuario(db, usuario_id, usuario)


@router.delete("/usuario/{usuario_id}")
async def delete_usuario(usuario_id: int, db: AsyncSession = Depends(get_db)):
    return await services.eliminar_usuario(db, usuario_id)


## ---------------------- NODO


@router.post("/nodo", response_model=schemas.NodoCreate)
async def create_nodo(nodo: schemas.NodoCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await services.crear_nodo(db, nodo)
    except HTTPException as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/nodo/{nodo_id}", response_model=schemas.Nodo)
async def get_nodo(nodo_id: int, db: AsyncSession = Depends(get_db)):
    return await services.leer_nodo(db, nodo_id)


@router.put("/nodo/{nodo_id}", response_model=schemas.Nodo)
async def update_nodo(
    nodo_id: int, nodo: schemas.NodoUpdate, db: AsyncSession = Depends(get_db)
):
    return await services.modificar_nodo(db, nodo_id, nodo)


@router.delete("/nodo/{nodo_id}")
async def delete_nodo(nodo_id: int, db: AsyncSession = Depends(get_db)):
    return await services.eliminar_nodo(db, nodo_id)


@router.get("/nodos", response_model=List[schemas.Nodo])
async def get_nodos(db: AsyncSession = Depends(get_db)):
    return await services.leer_todos_los_nodos(db)

@router.get("/lista_nodos", response_model=List[schemas.NodoList])
async def get_lista_nodos(db: AsyncSession = Depends(get_db)):
    return await services.listar_nodos(db)

@router.get("/mediciones", response_model=List[schemas.Medicion])
async def get_mediciones(db:AsyncSession = Depends(get_db)):
    return await services.leer_mediciones(db)

## ---------------------- ALARMA
@router.post("/alarma", response_model=schemas.AlarmaCreate)
async def crear_alarma(alarma: schemas.AlarmaCreate, db: AsyncSession = Depends(get_db)):
    try:
        alarma = await services.crear_alarma(db, alarma)
        return alarma
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/alarma/{alarma_id}", response_model=schemas.Alarma)
async def get_alarma(alarma_id: int, db: AsyncSession = Depends(get_db)):
    return await services.leer_alarma(db, alarma_id)


@router.put("/alarma/{alarma_id}", response_model=schemas.Alarma)
async def update_alarma(
    alarma_id: int, alarma: schemas.AlarmaUpdate, db: AsyncSession = Depends(get_db)
):
    return await services.modificar_alarma(db, alarma_id, alarma)


@router.delete("/alarma/{alarma_id}")
async def delete_alarma(alarma_id: int, db: AsyncSession = Depends(get_db)):
    return await services.eliminar_alarma(db, alarma_id)


@router.get("/alarmas", response_model=List[schemas.Alarma])
async def get_alarmas(db: AsyncSession = Depends(get_db)):
    return await services.leer_todas_las_alarmas(db)