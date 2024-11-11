from os import getenv
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db 
from backend.src import schemas, services
from sqlalchemy.future import select
from backend.src.models import Medicion, Nodo, Usuario
from typing import List
from backend.src.auth import authenticate_user
from jose import jwt, JWTError

router = APIRouter()


## ----------------------- MEDICIONES

@router.post("/medicion", response_model=schemas.MedicionCreate)
async def create_medicion(medicion: schemas.MedicionCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await services.crear_medicion(db, medicion)
    except HTTPException as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/medicion/{medicion_id}", response_model=schemas.Medicion)
async def read_medicion(medicion_id: int, db: AsyncSession = Depends(get_db)):
    return await services.leer_medicion(db, medicion_id)

@router.get("/mediciones", response_model=List[schemas.Medicion])
async def get_mediciones(db:AsyncSession = Depends(get_db)):
    return await services.leer_mediciones(db)
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
async def create_usuario(usuario: schemas.UsuarioCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await services.crear_usuario(db, usuario)
    except HTTPException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/usuario/{usuario_id}", response_model=schemas.Usuario)
async def get_usuario(usuario_id: int, db: AsyncSession = Depends(get_db)):
    return await services.leer_usuario(db, usuario_id)

@router.put("/usuario/{usuario_id}/update", response_model=schemas.Usuario)
async def update_usuario(usuario_id: int, usuario: schemas.UsuarioUpdate, db: AsyncSession = Depends(get_db)):
    return await services.modificar_usuario(db, usuario_id, usuario)

@router.put("/usuario/{usuario_id}", response_model=schemas.Usuario)
async def update_usuario(usuario_id: int, usuario: schemas.UsuarioUpdateRol, db: AsyncSession = Depends(get_db)):
    return await services.modificar_rol_usuario(db, usuario_id, usuario)

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

@router.get("/mediciones", response_model=List[schemas.Medicion])
async def get_mediciones(db:AsyncSession = Depends(get_db)):
    return await services.leer_mediciones(db)