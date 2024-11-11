import datetime
from sqlalchemy import Integer, Boolean, String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import func
from backend.database import Base, engine




Base = declarative_base()

class BaseModel(Base):
    __abstract__ = True



## ----------------------- MEDICIONES
class Medicion(Base):
    __tablename__ = "medicion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    nodo: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    tipo: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    dato: Mapped[float] = mapped_column(Float, index=True, nullable=False)
    tiempo:Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now()
    )
    bateria: Mapped[int] = mapped_column(Integer, nullable=True)
    error: Mapped[bool] = mapped_column(Boolean, nullable=False)

## ----------------------- Usuario
class Usuario(Base):
    __tablename__ = "usuario"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    contrasena: Mapped[str] = mapped_column(String, nullable=False)
    fecha_registro: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now()
    )
    rol: Mapped[str] = mapped_column(String, index=True, nullable=False)

## ------------------- NODOS

class Nodo(Base):
    __tablename__ = "nodo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre : Mapped[str] = mapped_column(String, index=True, nullable=False)
    descripcion : Mapped[str] = mapped_column(String, index=True, nullable=True)
    posicionx : Mapped[float] = mapped_column(Float, index=True, nullable=False)
    posiciony : Mapped[float] = mapped_column(Float, index=True, nullable=False)
    bateria: Mapped[float] = mapped_column(Float, index=True, nullable=True)