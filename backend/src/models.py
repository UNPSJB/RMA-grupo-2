import datetime
from sqlalchemy import Integer, String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import func
from database import Base, engine

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
    

