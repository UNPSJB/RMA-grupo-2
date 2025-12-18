import datetime
from sqlalchemy import Integer, Boolean, String, Float, DateTime, ForeignKey, JSON
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
    """
    Catálogo global de tipos de sensores.

    MEJORA ARQUITECTÓNICA:
    - Este catálogo es ahora DINÁMICO y configurable desde la aplicación
    - No requiere modificar el código para agregar nuevos tipos de sensores
    - El campo 'tipo' se genera automáticamente (autoincremental)

    Campos:
    - tipo: ID único del tipo de sensor (PK, autoincremental)
    - descripcion: Nombre del tipo (ej: "Temperatura", "Conductividad Eléctrica")
    - min/max: Rangos globales válidos para este tipo de sensor
    - unidad: Unidad de medida por defecto (ej: "°C", "µS/cm", "hPa")
    """
    __tablename__ = 'datos_sensores'

    tipo: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    descripcion: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    min: Mapped[float] = mapped_column(Float, nullable=False)
    max: Mapped[float] = mapped_column(Float, nullable=False)
    unidad: Mapped[str] = mapped_column(String(20), nullable=True)  # NUEVO: Unidad por defecto

    # Relaciones
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
    telefono: Mapped[str] = mapped_column(String(20), nullable=True)
    username: Mapped[str] = mapped_column(String(50), nullable=True)
    bio: Mapped[str] = mapped_column(String, nullable=True)
    foto: Mapped[str] = mapped_column(String, nullable=True)

## ------------------- CUENCA

class Cuenca(Base):
    __tablename__ = "cuenca"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String, index=True, nullable=False, unique=True)
    descripcion: Mapped[str] = mapped_column(String, nullable=True)
    poligono: Mapped[dict] = mapped_column(JSON, nullable=False)  # GeoJSON polygon coordinates

    # Relación con nodos
    nodos: Mapped[list["Nodo"]] = relationship("Nodo", back_populates="cuenca_info", cascade="all, delete-orphan")

## ------------------- NODOS

class Nodo(Base):
    __tablename__ = "nodo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre : Mapped[str] = mapped_column(String, index=True, nullable=False)
    descripcion : Mapped[str] = mapped_column(String, index=True, nullable=True)
    posicionx : Mapped[float] = mapped_column(Float, index=True, nullable=False)
    posiciony : Mapped[float] = mapped_column(Float, index=True, nullable=False)
    cuenca_id: Mapped[int] = mapped_column(Integer, ForeignKey('cuenca.id'), nullable=True)
    es_movil: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    alarma: Mapped[list["Alarma"]] = relationship("Alarma", back_populates="nodo_info", cascade="all, delete-orphan")
    cuenca_info: Mapped["Cuenca"] = relationship("Cuenca", back_populates="nodos")
    historial_posiciones: Mapped[list["HistorialPosiciones"]] = relationship("HistorialPosiciones", back_populates="nodo", cascade="all, delete-orphan")
    variables: Mapped[list["VariableNodo"]] = relationship("VariableNodo", back_populates="nodo", cascade="all, delete-orphan")

## ------------------- HISTORIAL POSICIONES
class HistorialPosiciones(Base):
    __tablename__ = "historial_posiciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    nodo_id: Mapped[int] = mapped_column(Integer, ForeignKey('nodo.id'), nullable=False, index=True)
    latitud: Mapped[float] = mapped_column(Float, nullable=False)
    longitud: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        index=True
    )

    nodo: Mapped["Nodo"] = relationship("Nodo", back_populates="historial_posiciones")

## ------------------- VARIABLES NODO
class VariableNodo(Base):
    """
    Modelo que representa las variables configurables que mide cada nodo.

    Este modelo vincula cada nodo con los tipos de sensores del catálogo global (datos_sensores),
    permitiendo que cada nodo tenga rangos de medición personalizados para cada tipo de sensor.

    Cumple con el requisito del profesor:
    - nombre: Se obtiene de la relación con DatosSensores (tipo_sensor.descripcion)
    - unidad_medida: Personalizable por nodo (ej: °C vs °F)
    - rango_min/rango_max: Rango aceptable específico del nodo

    Ejemplo:
    - Catálogo global: "Temperatura" existe con rangos generales 0-100°C
    - Nodo 1: Mide "Temperatura" con rango específico 10-40°C, unidad °C
    - Nodo 2: Mide "Temperatura" con rango específico 50-104°F, unidad °F
    """
    __tablename__ = "variables_nodo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    nodo_id: Mapped[int] = mapped_column(Integer, ForeignKey('nodo.id'), nullable=False, index=True)

    # Foreign key al catálogo de tipos de sensores
    # Esto vincula la variable del nodo con un tipo de sensor del sistema
    tipo_sensor_id: Mapped[int] = mapped_column(Integer, ForeignKey('datos_sensores.tipo'), nullable=False, index=True)

    # Unidad de medida personalizada por nodo (puede diferir del sensor global)
    # Ejemplo: Un nodo puede usar °C y otro °F para el mismo tipo de sensor "Temperatura"
    unidad_medida: Mapped[str] = mapped_column(String(20), nullable=True)

    # Rango aceptable de medición específico para este nodo
    # Pueden ser más restrictivos que los rangos globales del tipo de sensor
    rango_min: Mapped[float] = mapped_column(Float, nullable=True)
    rango_max: Mapped[float] = mapped_column(Float, nullable=True)

    # Permite activar/desactivar variables sin eliminarlas
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Timestamps para auditoría
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        onupdate=func.now()
    )

    # Relaciones
    nodo: Mapped["Nodo"] = relationship("Nodo", back_populates="variables")
    tipo_sensor: Mapped["DatosSensores"] = relationship("DatosSensores")

    ##----------------DATOS SENSORES-------------##
