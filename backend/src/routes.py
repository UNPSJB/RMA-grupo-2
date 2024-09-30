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
@router.post("/producto", response_model=schemas.Producto)
async def create_producto(producto: schemas.ProductoCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await services.crear_producto(db, producto)
    except HTTPException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/producto/{producto_id}", response_model=schemas.Producto)
async def read_producto(producto_id: int, db:AsyncSession = Depends(get_db)):
    try: 
        return await services.leer_producto(db, producto_id)
    except HTTPException as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.put("/producto/{producto_id}", response_model=dict)
async def update_producto(producto_id: int, producto:schemas.ProductoUpdate, db:AsyncSession=Depends(get_db)):
        try: 
            return await services.modificar_producto(db, producto_id, producto)
        except HTTPException as e:
            raise HTTPException(status_code=400, detail=str(e))
  
@router.delete("/producto/{producto_id}", response_model=dict)
async def delete_producto(producto_id: int, db: AsyncSession = Depends(get_db)):
    try:
        return await services.eliminar_producto(db, producto_id)
    except HTTPException as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    