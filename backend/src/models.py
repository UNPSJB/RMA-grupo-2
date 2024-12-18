import datetime
from sqlalchemy import Integer, Boolean, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
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
    error: Mapped[bool] = mapped_column(Boolean, nullable=False)

## ----------------------- DATOS SENSORES
class DatosSensores(Base):
    __tablename__ = 'datos_sensores'

    tipo: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    min: Mapped[float] = mapped_column(Float)
    max: Mapped[float] = mapped_column(Float)
    descripcion: Mapped[str] = mapped_column(String)

    alarma: Mapped[list["Alarma"]] = relationship("Alarma", back_populates="tipo_sensor")

## ----------------------- ALARMAS
class Alarma(Base):
    __tablename__ = "alarma"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String, nullable=False)
    descripcion: Mapped[str] = mapped_column(String, nullable=False)
    tipo: Mapped[int] = mapped_column(Integer, ForeignKey('datos_sensores.tipo'), nullable=False)
    nodo: Mapped[int] = mapped_column(Integer, ForeignKey('nodo.id'), nullable=False)
    valor_min: Mapped[float] = mapped_column(Float, nullable=False)
    valor_max: Mapped[float] = mapped_column(Float, nullable=False)
    chat_id: Mapped[str] = mapped_column(String, nullable=True)

    tipo_sensor: Mapped["DatosSensores"] = relationship("DatosSensores", back_populates="alarma")
    nodo_info: Mapped["Nodo"] = relationship("Nodo", back_populates="alarma")

## ----------------------- TOKENALARMAS
class TokenAlarma(Base):
    __tablename__ = "token"

    secret: Mapped[str] = mapped_column(String, primary_key=True, nullable=False)
    usuario_id: Mapped[int] = mapped_column(Integer, nullable=True)
    chat_id: Mapped[str] = mapped_column(String, nullable=False)
    otp: Mapped[str] = mapped_column(String, nullable=False)

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

    alarma: Mapped[list["Alarma"]] = relationship("Alarma", back_populates="nodo_info", cascade="all, delete-orphan")

    ##----------------DATOS SENSORES-------------##
