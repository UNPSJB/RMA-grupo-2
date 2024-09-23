import datetime
from sqlalchemy import Integer, String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import func
from database import Base, engine


Base = declarative_base()

class BaseModel(Base):
    __abstract__ = True

class Producto(Base):
    __tablename__ = "producto"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String, index=True, nullable=False)
    precio: Mapped[float] = mapped_column(Float, index=True, nullable=False)
    descripcion: Mapped[str] = mapped_column(String, nullable=False)
    fecha_creacion: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now()
    )
    fecha_modificacion: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        onupdate=func.now()
    )



#Compra: ForeyingKey cliente, producto

#Cliente