import datetime
from sqlalchemy import Integer, String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import func
from backend.database import Base, engine

Base = declarative_base()

class BaseModel(Base):
    __abstract__ = True

class Temperatura(Base):
    __tablename__ = "temperatura"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    nodo: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    tipo: Mapped[str] = mapped_column(String, index=True, nullable=False)
    dato: Mapped[float] = mapped_column(Float, index=True, nullable=False)
    tiempo:Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now()
    )

## ----------------------- MEDICIONES
class Medicion(Base):
    __tablename__ = "medicion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    nodo: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    tipo: Mapped[str] = mapped_column(String, index=True, nullable=False)
    dato: Mapped[float] = mapped_column(Float, index=True, nullable=False)
    tiempo:Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now()
    )
    bateria: Mapped[int] = mapped_column(Integer, nullable=True)

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

## ----------------------- Nodo
class Nodo(Base):
    __tablename__ = "nodo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String, index=True, nullable=False)