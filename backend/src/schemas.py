from pydantic import BaseModel, EmailStr, field_validator
#from datetime import datetime
from typing import Optional, List, Dict, Any
import datetime



## ----------------------- MEDICIONES
class MedicionBase(BaseModel):
    nodo:int
    tipo: int
    dato: float
    tiempo: datetime.datetime
    error: bool

class Medicion(MedicionBase):
    id: int
    nodo:int
    tipo: int
    dato: float
    tiempo: datetime.datetime
    error: bool

    class Config:
        from_attributes = True
        
class MedicionCreate(MedicionBase):
    pass

class MedicionFiltro(BaseModel):
    nodo: int
    tipo: int
    fechaDesde: datetime.datetime
    fechaHasta: datetime.datetime

class MedicionFiltrada(BaseModel):
    dato: float
    tiempo: datetime.datetime



## ----------------------- USUARIO
class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr  # Validación del formato del email
    contrasena: str

    # Validación de la contraseña utilizando field_validator
    # (ESTO NO SE PUEDE HACER EN EL FRONT?, PARA NO ENVIAR CREACIONES QUE SE SABE QUE VAN A FALLAR)
    @field_validator('contrasena')
    def validar_contrasena(cls, contrasena):
        if len(contrasena) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres.')
        if not any(char.isdigit() for char in contrasena):
            raise ValueError('La contraseña debe contener al menos un número.')
        if not any(char.islower() for char in contrasena):
            raise ValueError('La contraseña debe contener al menos una letra minúscula.')
        if not any(char.isupper() for char in contrasena):
            raise ValueError('La contraseña debe contener al menos una letra mayúscula.')
        return contrasena

class Usuario(UsuarioBase):
    id: Optional[int]  # Hacer que id sea opcional
    nombre: str
    email: EmailStr
    contrasena: str
    fecha_registro: datetime.datetime
    rol: str
    telefono: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    foto: Optional[str] = None

    class Config:
        orm_mode = True

class UsuarioCreate(UsuarioBase):
    pass

class UsuarioUpdate(BaseModel):
    nombre: str
    email: EmailStr
    telefono: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    contrasena: Optional[str] = None

    @field_validator('contrasena')
    def validar_contrasena(cls, contrasena):
        # Solo validar si se proporciona una contraseña
        if contrasena is not None and contrasena.strip() != '':
            if len(contrasena) < 8:
                raise ValueError('La contraseña debe tener al menos 8 caracteres.')
            if not any(char.isdigit() for char in contrasena):
                raise ValueError('La contraseña debe contener al menos un número.')
            if not any(char.islower() for char in contrasena):
                raise ValueError('La contraseña debe contener al menos una letra minúscula.')
            if not any(char.isupper() for char in contrasena):
                raise ValueError('La contraseña debe contener al menos una letra mayúscula.')
        return contrasena

class UsuarioUpdateRol(BaseModel):
    rol: str

class UsuarioLogin(BaseModel):
    email: EmailStr
    contrasena: str

## ----------------------- CUENCA

class CuencaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    poligono: Dict[str, Any]  # GeoJSON format: {"type": "Polygon", "coordinates": [[[lon, lat], ...]]}

class Cuenca(CuencaBase):
    id: int

    class Config:
        from_attributes = True

class CuencaCreate(CuencaBase):
    pass

class CuencaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    poligono: Optional[Dict[str, Any]] = None

class CuencaWithNodos(Cuenca):
    nodos: List["Nodo"] = []

    class Config:
        from_attributes = True

##--------NODO

class Detalle(BaseModel):
    value: int
    label: str

class NodoBase(BaseModel):
    posicionx: float
    posiciony: float
    nombre: str
    descripcion: Optional[str]
    cuenca_id: Optional[int] = None
    es_movil: bool = False


class Nodo(NodoBase):

    id: int
    nombre: str
    descripcion: Optional[str]
    posicionx: float
    posiciony: float
    cuenca_id: Optional[int] = None
    es_movil: bool = False

    class Config:
        orm_mode = True

class NodoCreate(NodoBase):
    pass

class NodoUpdate(NodoBase):
    posicionx: float
    posiciony: float
    nombre: str
    descripcion: Optional[str]
    cuenca_id: Optional[int] = None
    es_movil: bool = False

## ----------------------- HISTORIAL POSICIONES

class HistorialPosicionesBase(BaseModel):
    nodo_id: int
    latitud: float
    longitud: float
    timestamp: datetime.datetime

class HistorialPosiciones(HistorialPosicionesBase):
    id: int

    class Config:
        from_attributes = True

class HistorialPosicionesCreate(BaseModel):
    nodo_id: int
    latitud: float
    longitud: float
    timestamp: Optional[datetime.datetime] = None  # Si no se proporciona, se usa la fecha actual

class HistorialPosicionesFiltro(BaseModel):
    nodo_id: int
    fecha_desde: datetime.datetime
    fecha_hasta: datetime.datetime

class Token(BaseModel):
    access_token: str
    token_type: str

## ----------------------- TOKEN ALARMA
class TokenAlarma(BaseModel):
    secret: str
    user_id: int
    chat_id: str
    otp: str

## ----------------------- ALARMA
class AlarmaBase(BaseModel):
    id: Optional[int]
    nombre: str
    descripcion: str
    tipo: int
    nodo: int
    valor_min: float
    valor_max: float
    chat_id: Optional[str]

class Alarma(AlarmaBase):
    id: Optional[int]
    nombre: str
    descripcion: str
    tipo: int
    nodo: int
    valor_min: float
    valor_max: float
    chat_id: Optional[str]

    class Config:
        orm_mode = True

class AlarmaCreate(AlarmaBase):
    pass

class AlarmaUpdate(AlarmaBase):
    nombre: str
    descripcion: str
    tipo: int
    nodo: int
    valor_min: float
    valor_max: float  


##------------DATOS SENSORES ---------##

class DatosSensoresBase(BaseModel):
    """
    Schema base para tipos de sensores.
    Representa el catálogo global de tipos de sensores disponibles.
    """
    tipo: int
    min: float
    max: float
    descripcion: str

    class Config:
        from_attributes = True  # Actualizado de orm_mode

class DatosSensoresCreate(BaseModel):
    """
    Schema para crear un nuevo tipo de sensor.

    CAMBIO ARQUITECTÓNICO:
    - El campo 'tipo' (ID) ahora es OPCIONAL
    - Si no se proporciona, se genera automáticamente (autoincremental)
    - Esto permite crear tipos de sensores dinámicamente desde el frontend
    - Sin necesidad de modificar el código (enum TipoMensaje)

    Ejemplo de uso:
    {
      "descripcion": "Conductividad Eléctrica",
      "min": 0,
      "max": 5000,
      "unidad": "µS/cm"
    }
    """
    tipo: Optional[int] = None  # Ahora es opcional, se genera automático
    descripcion: str
    min: float
    max: float
    unidad: Optional[str] = None  # NUEVO: Unidad de medida por defecto

    class Config:
        from_attributes = True

class DatosSensoresUpdate(BaseModel):
    """
    Schema para actualizar un tipo de sensor existente.
    Todos los campos son opcionales para permitir actualizaciones parciales.
    """
    descripcion: Optional[str] = None
    min: Optional[float] = None
    max: Optional[float] = None
    unidad: Optional[str] = None

    class Config:
        from_attributes = True

class DatosSensoresResponse(DatosSensoresBase):
    """Schema de respuesta con todos los campos del sensor."""
    unidad: Optional[str] = None

    class Config:
        from_attributes = True

## ----------------------- VARIABLES NODO

class VariableNodoBase(BaseModel):
    """
    Schema base para variables de nodo.

    Cambios respecto a la versión anterior:
    - Se eliminó 'nombre' (ahora viene de tipo_sensor.descripcion)
    - Se eliminó 'valor_actual' (no estaba en el requisito del profesor)
    - Se agregó 'tipo_sensor_id' (vincula con el catálogo de datos_sensores)
    """
    nodo_id: int
    tipo_sensor_id: int  # ID del tipo de sensor del catálogo global
    unidad_medida: Optional[str] = None
    rango_min: Optional[float] = None
    rango_max: Optional[float] = None
    activo: bool = True

class VariableNodo(VariableNodoBase):
    """
    Schema completo de variable de nodo (para respuestas de la API).

    Incluye todos los campos de la base de datos más información
    del tipo de sensor asociado.
    """
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class VariableNodoCreate(BaseModel):
    """
    Schema para crear una nueva variable de nodo.

    Campos requeridos:
    - tipo_sensor_id: Tipo de sensor del catálogo (datos_sensores)

    Campos opcionales:
    - unidad_medida: Unidad específica para este nodo (ej: °C, °F, psi, bar)
    - rango_min: Valor mínimo aceptable para este nodo
    - rango_max: Valor máximo aceptable para este nodo
    - activo: Si la variable está activa (default: True)
    """
    tipo_sensor_id: int
    unidad_medida: Optional[str] = None
    rango_min: Optional[float] = None
    rango_max: Optional[float] = None
    activo: bool = True

class VariableNodoUpdate(BaseModel):
    """
    Schema para actualizar una variable de nodo existente.

    Todos los campos son opcionales. Solo se actualizarán
    los campos que se proporcionen en la petición.

    Nota: No se permite cambiar tipo_sensor_id una vez creada la variable.
          Para cambiar el tipo de sensor, elimina y crea una nueva variable.
    """
    unidad_medida: Optional[str] = None
    rango_min: Optional[float] = None
    rango_max: Optional[float] = None
    activo: Optional[bool] = None

class VariableNodoConTipoSensor(VariableNodo):
    """
    Schema extendido que incluye información del tipo de sensor.

    Útil para respuestas de API donde se necesita mostrar:
    - ID y nombre del tipo de sensor
    - Rangos globales del tipo de sensor
    - Configuración específica del nodo
    """
    tipo_sensor_descripcion: str  # Nombre del tipo de sensor (ej: "Temperatura")
    tipo_sensor_min_global: float  # Rango mínimo global del tipo de sensor
    tipo_sensor_max_global: float  # Rango máximo global del tipo de sensor