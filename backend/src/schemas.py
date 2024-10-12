from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import datetime

class TemperaturaBase(BaseModel):
    id:int
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