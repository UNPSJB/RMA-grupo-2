from os import getenv
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db 
from backend.src import schemas, services
from sqlalchemy.future import select
from backend.src.models import Medicion, Nodo, Usuario
from typing import List
from passlib.context import CryptContext
import jwt

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

## ----------------------- MEDICIONES

@router.post("/medicion", response_model=schemas.MedicionCreate)
async def create_medicion(medicion: schemas.MedicionCreate, db: AsyncSession = Depends(get_db)):
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

## ----------------------- LOGIN

@router.post("/login", response_model=schemas.Usuario)
async def login(usuario: schemas.UsuarioLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario).where(Usuario.email == usuario.email))
    user = result.scalar_one_or_none()   
    if user is None or not pwd_context.verify(usuario.contrasena, user.contrasena):
        raise HTTPException(status_code=401, detail="Correo electronico o contraseña incorrectos.")
    token = jwt.encode(user, getenv("TOKEN_KEY"), algorithm='HS256')
    return token

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

@router.get("/usuarios", response_model=List[schemas.Usuario])
async def get_usuarios(db: AsyncSession = Depends(get_db)):
    return await services.leer_todos_los_usuarios(db)

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
async def update_nodo(nodo_id: int, nodo: schemas.NodoUpdate, db: AsyncSession = Depends(get_db)):
    return await services.modificar_nodo(db, nodo_id, nodo)

@router.delete("/nodo/{nodo_id}")
async def delete_nodo(nodo_id: int, db: AsyncSession = Depends(get_db)):
    return await services.eliminar_nodo(db, nodo_id)

@router.get("/nodos", response_model=List[schemas.Nodo])
async def get_nodos(db: AsyncSession = Depends(get_db)):
    return await services.leer_todos_los_nodos(db)