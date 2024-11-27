from pydantic import BaseModel, EmailStr, field_validator
#from datetime import datetime
from typing import Optional
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
        orm_config = True
        
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
    email: EmailStr  # Validación del formato del email
    contrasena: str
    fecha_registro: datetime.datetime
    rol: str
        
    class Config:
        orm_mode = True

class UsuarioCreate(UsuarioBase):
    pass

class UsuarioUpdate(BaseModel):
    nombre: str
    email: EmailStr
    contrasena: str

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
    
class UsuarioUpdateRol(BaseModel):
    rol: str
class UsuarioLogin(BaseModel):
    email: EmailStr
    contrasena: str

##--------NODO

class Detalle(BaseModel):
    value: int
    label: str

class NodoBase(BaseModel):
    posicionx: float
    posiciony: float
    nombre: str
    descripcion: Optional[str]
    

class Nodo(NodoBase):

    id: int
    nombre: str
    descripcion: Optional[str]
    posicionx: float
    posiciony: float

    class Config:
        orm_mode = True

class NodoCreate(NodoBase):
    pass

class NodoUpdate(NodoBase):
    posicionx: float
    posiciony: float
    nombre: str
    descripcion: Optional[str]    


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
    nombre: str
    descripcion: str
    tipo: int
    nodo: int
    valor_min: float
    valor_max: float
    chat_id: Optional[str]

class Alarma(AlarmaBase):
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
    tipo: int
    min: float
    max: float
    descripcion: str
    
    class Config:
        orm_mode = True

class DatosSensoresCreate(DatosSensoresBase):
    pass

class DatosSensoresUpdate(BaseModel):
    min: float
    max: float

    class Config:
        orm_mode = True

class DatosSensoresResponse(DatosSensoresBase):
    pass