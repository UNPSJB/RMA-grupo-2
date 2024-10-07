from pydantic import BaseModel
from datetime import datetime
#from typing import Optional
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
