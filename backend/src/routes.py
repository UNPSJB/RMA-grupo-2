import datetime
from os import getenv
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy import and_
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.src import schemas, services
from sqlalchemy.future import select
from backend.src.models import Medicion, Nodo, Usuario, Alarma, DatosSensores
from typing import List
from backend.src.auth import authenticate_user
import jwt
from jwt.exceptions import InvalidTokenError

router = APIRouter()


## ----------------------- MEDICIONES

@router.get("/medicion/", response_model=List[schemas.Medicion])
async def read_mdiciones(db: AsyncSession = Depends(get_db)):
    async with db.begin():
        result = await db.execute(select(Medicion))
        medicion = result.scalars().all()
    return medicion

@router.post("/medicion", response_model=schemas.MedicionCreate)
async def create_medicion(
    medicion: schemas.MedicionCreate, db: AsyncSession = Depends(get_db)
):
    try:
        return await services.crear_medicion(db, medicion)
    except HTTPException as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/medicion/filtrar", response_model=List[schemas.MedicionFiltrada])
async def leer_mediciones_filtro(
    filtros: schemas.MedicionFiltro, db: AsyncSession = Depends(get_db)
):
    try:
        return await services.leer_mediciones_filtro(db, filtros)
    except HTTPException as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.post("/medicioncsv", response_model=dict)
async def procesar_csv_medicion(
    archivo: UploadFile, db: AsyncSession = Depends(get_db)    
):
    try:
        return await services.procesar_csv_medicion(db, archivo)
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
    usuario_id: int, usuario: schemas.UsuarioUpdateRol, db: AsyncSession = Depends(get_db)
):
    return await services.modificar_usuario(db, usuario_id, usuario)


@router.delete("/usuario/{usuario_id}")
async def delete_usuario(usuario_id: int, db: AsyncSession = Depends(get_db)):
    return await services.eliminar_usuario(db, usuario_id)

@router.get("/usuarios/")
async def read_usuarios( db: AsyncSession = Depends(get_db)):
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

@router.get("/lista_nodos", response_model=List[schemas.Detalle])
async def get_lista_nodos(db: AsyncSession = Depends(get_db)):
    return await services.listar_nodos(db)

@router.get("/mediciones", response_model=List[schemas.Medicion])
async def get_mediciones(db:AsyncSession = Depends(get_db)):
    return await services.leer_mediciones(db)

@router.get("/mediciones/{type_id}", response_model=schemas.Medicion)
async def get_ultima_medicion(type_id: int, db:AsyncSession = Depends(get_db)):
    return await services.leer_ultima_medicion(db, type_id)

@router.get("/lista_tipo_medicion", response_model=List[schemas.Detalle])
async def get_lista_tipo_medicion(db: AsyncSession = Depends(get_db)):
    return await services.listar_tipos_medicion(db)
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

## ---------------------- ALARMA

@router.get("/verificar-token")
async def verificar_token(token: str, user_id: int, db: AsyncSession = Depends(get_db)):
    return await services.verificar_codigo(token, user_id, db)

@router.get("/verificar-vinculacion")
async def verificar_vinculacion(user_id: int, db: AsyncSession = Depends(get_db)):
    return await services.verificar_vinculacion(user_id, db)

@router.delete("/eliminar-vinculacion")
async def eliminar_vinculacion(user_id: int, db: AsyncSession = Depends(get_db)):
    return await services.eliminar_vinculacion(user_id, db)

##-----------datos Sensores----------------##


@router.post("/sensor", response_model=schemas.DatosSensoresResponse)
async def crear_sensor_endpoint(sensor: schemas.DatosSensoresCreate, db: AsyncSession = Depends(get_db)):
    return await services.crear_sensor(db, sensor)

@router.get("/sensor/{sensor_id}", response_model=schemas.DatosSensoresResponse)
async def leer_sensor_endpoint(sensor_id: int, db: AsyncSession = Depends(get_db)):
    return await services.leer_sensor(db, sensor_id)

@router.put("/sensor/{sensor_id}", response_model=schemas.DatosSensoresResponse)
async def modificar_sensor_endpoint(sensor_id: int, sensor: schemas.DatosSensoresUpdate, db: AsyncSession = Depends(get_db)):
    # Llamamos al servicio para actualizar el sensor
    updated_sensor = await services.modificar_sensor(db, sensor_id, sensor)

    if not updated_sensor:
        raise HTTPException(status_code=404, detail="Sensor no encontrado")

    return updated_sensor

@router.delete("/sensor/{sensor_id}")
async def eliminar_sensor_endpoint(sensor_id: int, db: AsyncSession = Depends(get_db)):
    return await services.eliminar_sensor(db, sensor_id)

@router.get("/sensores", response_model=List[schemas.DatosSensoresResponse])
async def leer_todos_los_sensores_endpoint(db: AsyncSession = Depends(get_db)):
    return await services.leer_todos_los_sensores(db)

@router.get("/sensores/select-options", response_model=List[schemas.Detalle])
async def listar_sensores_endpoint(db: AsyncSession = Depends(get_db)):
    return await services.listar_sensores(db)

## ---------------------- CUENCA

@router.post("/cuenca", response_model=schemas.Cuenca)
async def crear_cuenca_endpoint(cuenca: schemas.CuencaCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await services.crear_cuenca(db, cuenca)
    except HTTPException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/cuenca/{cuenca_id}", response_model=schemas.CuencaWithNodos)
async def get_cuenca_endpoint(cuenca_id: int, db: AsyncSession = Depends(get_db)):
    return await services.leer_cuenca_con_nodos(db, cuenca_id)

@router.put("/cuenca/{cuenca_id}", response_model=schemas.Cuenca)
async def update_cuenca_endpoint(
    cuenca_id: int, cuenca: schemas.CuencaUpdate, db: AsyncSession = Depends(get_db)
):
    return await services.modificar_cuenca(db, cuenca_id, cuenca)

@router.delete("/cuenca/{cuenca_id}")
async def delete_cuenca_endpoint(cuenca_id: int, db: AsyncSession = Depends(get_db)):
    return await services.eliminar_cuenca(db, cuenca_id)

@router.get("/cuencas", response_model=List[schemas.CuencaWithNodos])
async def get_cuencas_endpoint(db: AsyncSession = Depends(get_db)):
    return await services.leer_todas_las_cuencas(db)

@router.get("/cuencas/select-options", response_model=List[schemas.Detalle])
async def listar_cuencas_endpoint(db: AsyncSession = Depends(get_db)):
    return await services.listar_cuencas(db)

@router.post("/cuenca/{cuenca_id}/nodos")
async def asignar_nodos_endpoint(cuenca_id: int, nodo_ids: List[int], db: AsyncSession = Depends(get_db)):
    return await services.asignar_nodos_a_cuenca(db, cuenca_id, nodo_ids)

## ---------------------- HISTORIAL POSICIONES

@router.post("/historial-posiciones", response_model=schemas.HistorialPosiciones)
async def crear_posicion_historial_endpoint(
    posicion: schemas.HistorialPosicionesCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Crea una nueva entrada en el historial de posiciones para un nodo móvil.
    Si no se proporciona timestamp, se usa la fecha y hora actual.
    """
    try:
        return await services.crear_posicion_historial(db, posicion)
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=str(e.detail))

@router.post("/historial-posiciones/filtrar", response_model=List[schemas.HistorialPosiciones])
async def leer_historial_filtrado_endpoint(
    filtro: schemas.HistorialPosicionesFiltro,
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene el historial de posiciones de un nodo en un rango de fechas específico.
    Útil para visualizar la trayectoria del nodo en un período determinado.
    """
    try:
        return await services.leer_historial_posiciones_por_nodo(db, filtro)
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=str(e.detail))

@router.get("/historial-posiciones/nodo/{nodo_id}", response_model=List[schemas.HistorialPosiciones])
async def leer_todo_historial_endpoint(
    nodo_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene todo el historial de posiciones de un nodo (sin filtro de fecha).
    """
    try:
        return await services.leer_todo_historial_nodo(db, nodo_id)
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=str(e.detail))

@router.delete("/historial-posiciones/nodo/{nodo_id}")
async def eliminar_historial_endpoint(
    nodo_id: int,
    fecha_hasta: datetime.datetime = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Elimina el historial de posiciones de un nodo.
    Si se proporciona fecha_hasta, solo elimina registros hasta esa fecha.
    Si no se proporciona, elimina todo el historial del nodo.
    """
    try:
        return await services.eliminar_historial_nodo(db, nodo_id, fecha_hasta)
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=str(e.detail))

## ---------------------- VARIABLES NODO
##
## Endpoints para gestionar las variables configurables de cada nodo.
## Las variables vinculan nodos con tipos de sensores del catálogo (datos_sensores).
##

@router.post("/nodos/{nodo_id}/variables", response_model=schemas.VariableNodo)
async def crear_variable_nodo_endpoint(
    nodo_id: int,
    variable: schemas.VariableNodoCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Crea una nueva variable configurable para un nodo específico.

    La variable vincula el nodo con un tipo de sensor del catálogo global (datos_sensores),
    permitiendo configurar rangos y unidades de medida personalizados.

    Body esperado:
    {
        "tipo_sensor_id": 1,              # ID del tipo de sensor (datos_sensores.tipo)
        "unidad_medida": "°C",            # Opcional: Unidad personalizada
        "rango_min": 10.0,                # Opcional: Rango mínimo específico del nodo
        "rango_max": 40.0,                # Opcional: Rango máximo específico del nodo
        "activo": true                    # Opcional: Por defecto true
    }

    Ejemplo: Para medir Temperatura en un nodo
    - tipo_sensor_id = 1 (supongamos que 1 = Temperatura en datos_sensores)
    - unidad_medida = "°C"
    - rango_min = 10, rango_max = 40 (este nodo acepta 10-40°C)
    """
    try:
        return await services.crear_variable_nodo(db, nodo_id, variable)
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=str(e.detail))

@router.get("/nodos/{nodo_id}/variables", response_model=List[schemas.VariableNodo])
async def leer_variables_nodo_endpoint(
    nodo_id: int,
    solo_activas: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene todas las variables configuradas para un nodo.

    Query params:
    - solo_activas: Si es true, devuelve solo variables con activo=true

    La respuesta incluye información del tipo de sensor mediante la relación.
    Para acceder al nombre del sensor: variable.tipo_sensor.descripcion
    """
    try:
        if solo_activas:
            return await services.leer_variables_activas_por_nodo(db, nodo_id)
        else:
            return await services.leer_variables_por_nodo(db, nodo_id)
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=str(e.detail))

@router.get("/variables/{variable_id}", response_model=schemas.VariableNodo)
async def leer_variable_endpoint(
    variable_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene una variable específica por su ID.
    """
    try:
        return await services.leer_variable_nodo(db, variable_id)
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=str(e.detail))

@router.put("/variables/{variable_id}", response_model=schemas.VariableNodo)
async def modificar_variable_endpoint(
    variable_id: int,
    variable_update: schemas.VariableNodoUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Modifica una variable existente.

    Campos modificables:
    - unidad_medida: Cambiar unidad de medida
    - rango_min/rango_max: Ajustar rangos aceptables
    - activo: Activar/desactivar la variable

    NO se puede cambiar tipo_sensor_id. Para cambiar el tipo de sensor,
    elimina la variable y crea una nueva.

    Body ejemplo:
    {
        "unidad_medida": "°F",  # Cambiar de °C a °F
        "rango_min": 50,
        "rango_max": 104,
        "activo": true
    }
    """
    try:
        return await services.modificar_variable_nodo(db, variable_id, variable_update)
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=str(e.detail))

@router.delete("/variables/{variable_id}")
async def eliminar_variable_endpoint(
    variable_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Elimina una variable de un nodo.

    Esto NO elimina el tipo de sensor del catálogo global (datos_sensores),
    solo desvincula el nodo de ese tipo de sensor.
    """
    try:
        return await services.eliminar_variable_nodo(db, variable_id)
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=str(e.detail))
