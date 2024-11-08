from pydantic import BaseModel, EmailStr, field_validator
#from datetime import datetime
from typing import Optional
import datetime
import enum
from sqlalchemy import Enum

class RolEnum(enum.Enum):
    admin = "admin"
    default = "default"
    investigador = "investigador"

## ----------------------- MEDICIONES
class MedicionBase(BaseModel):
    nodo:int
    tipo: int
    dato: float
    tiempo: datetime.datetime
    bateria: Optional[int]
    error: bool

class Medicion(MedicionBase):
    id: int
    nodo:int
    tipo: int
    dato: float
    tiempo: datetime.datetime
    bateria: Optional[int]
    error: bool

    class Config:
        orm_config = True
        
class MedicionCreate(MedicionBase):
    pass

class MedicionFiltro():
    nodo: int
    tipo: int
    fechaDesde: datetime.datetime
    fechaHasta: datetime.datetime

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
    rol: RolEnum

class UsuarioLogin(BaseModel):
    email: EmailStr
    contrasena: str

##--------NODO

class NodoBase(BaseModel):
    posicionx: float
    posiciony: float
    nombre: str
    descripcion: str
    

class Nodo(NodoBase):
    id: Optional[int]
    posicionx: float
    posiciony: float
    nombre: str
    descripcion: str
    bateria: Optional[float]

    class Config:
        orm_mode = True

class NodoCreate(NodoBase):
    pass

class NodoUpdate(NodoBase):
    posicionx: float
    posiciony: float
    nombre: str
    descripcion: str    


