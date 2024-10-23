from pydantic import BaseModel, EmailStr, field_validator
#from datetime import datetime
from typing import Optional
import datetime

class TemperaturaBase(BaseModel):
    nodo: int
    tipo: str
    dato: float
    tiempo: datetime.datetime

class Temperatura(TemperaturaBase):
    id: int
    nodo: int
    tipo: str
    dato: float
    tiempo: datetime.datetime

    class Config:
        orm_config = True

class TemperaturaCreate(TemperaturaBase):
    pass

## ----------------------- MEDICIONES
class MedicionBase(BaseModel):
    id:int
    nodo:int
    tipo: str
    dato: float
    tiempo: datetime.datetime
    bateria: Optional[int]

class Medicion(BaseModel):
    id:int
    nodo:int
    tipo: str
    dato: float
    tiempo: datetime.datetime
    bateria: Optional[int]
    class Config:
        orm_config = True
        
class MedicionCreate(MedicionBase):
    pass

## ----------------------- USUARIO
class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr  # Validación del formato del email
    contrasena: str

    # Validación de la contraseña utilizando field_validator
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
    
##--------NODO

class NodoBase(BaseModel):
    id: int
    posicionX: int
    posicionY: int


class Nodo(NodoBase):
    id: int
    posicionX: int
    posicionY: int
        
    class Config:
        orm_mode = True

class NodoCreate(NodoBase):
    pass

class NodoUpdate(BaseModel):
    id: int
    posicionX: int
    posicionY: int
