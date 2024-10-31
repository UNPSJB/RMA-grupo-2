from pydantic import BaseModel, EmailStr, field_validator
# from datetime import datetime
from typing import Optional
import datetime

## ----------------------- MEDICIONES
class MedicionBase(BaseModel):
    nodo:int
    tipo: int
    dato: float
    tiempo: datetime.datetime
    bateria: Optional[int]
    error: bool

class Medicion(MedicionBase):
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

class Usuario(BaseModel):
    id: Optional[int]  # Hacer que id sea opcional
    nombre: str
    email: EmailStr  # Validación del formato del email
    contrasena: str
    fecha_registro: datetime.datetime
    rol: str

    # class Config:
    #     orm_mode = True # esto ya no se hace así. https://docs.pydantic.dev/latest/migration/#changes-to-dataclasses
    model_config = {"from_attributes": True} # ahora se usa así (la opción tiene otro nombre)

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
        
    class Config:
        orm_mode = True # TODO: modificar para que quede como el schema Usuario 

class NodoCreate(NodoBase):
    pass

class NodoUpdate(BaseModel):
    posicionx: float
    posiciony: float
    nombre: str
    descripcion: str

class Token(BaseModel):
    access_token: str