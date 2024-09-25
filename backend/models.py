from sqlalchemy import update, select
from sqlalchemy.orm import declarative_base
from sqlalchemy.ext.asyncio import AsyncSession

Base = declarative_base

#keyvalgen(obj)
'''
    Esta función genera pares clave-valor de los atributos de un objeto, excluyendo los que pertenecen 
    a SQLAlchemy (como _sa_adapter y _sa_instance_state). Sirve para limpiar y mostrar solo los atributos relevantes del modelo 
    cuando se genera una representación de texto.
'''
def keyvalgen(obj):

    excl = ("_sa_adapter", "_sa_instance_state")
    for k, v in vars(obj).items():
        if not k.startswith("_") and not any(hasattr(v, a) for a in excl):
            yield k, v

class BaseModel(Base):

    __abstract__=True

    #save()
    '''
         Guarda una instancia del modelo en la base de datos. 
         Agrega la instancia a la sesión y la confirma si commit es True. 
         Luego, actualiza los datos de la instancia (refresh) desde la base de datos para reflejar los cambios recientes.
    '''
    async def save(self, db: AsyncSession, commit: bool = True):
        db.add(self)
        if commit:
            await db.commit()
            await db.refresh(self)
        return self

    async def delete(self, db: AsyncSession, commit:bool = True):
        await db.delete(self)
        if commit: 
            await db.commit
        return self
    
    #update()
    '''
        Actualiza los valores de una instancia en la base de datos usando los argumentos proporcionados (kwargs). 
        Crea una sentencia de actualización SQL con los nuevos valores y ejecuta la operación.
    '''
    async def update(self, db: AsyncSession, **kwargs):
        primary_key = self.id
        stmt = (
            update(self.__class__)
            .where(self.__class__.id == primary_key)
            .values(**kwargs)
        )
        try:
            await db.execute(stmt)
            # Confirmar la transacción
            await db.commit()
            # Opcional: Volver a cargar el objeto actualizado
            updated_stmt = select(self.__class__).where(self.__class__.id == primary_key)
            result = await db.execute(updated_stmt)
            updated_instance = result.scalar_one_or_none()
            return updated_instance
        except Exception as e:
            # Deshacer cambios si hay un error
            await db.rollback()
            raise e
    
    @classmethod
    async def create(cls, db: AsyncSession, commit: bool = True, **kwargs):
        instance = cls(**kwargs)
        return await instance.save(db, commit=commit)

    @classmethod
    async def get(cls, db: AsyncSession, id: int):
        stmt = select(cls).filter(cls.id == id)
        result = await db.execute(stmt)
        return result.scalars().first()

    @classmethod
    async def get_all(cls, db: AsyncSession):
        stmt = select(cls)
        result = await db.execute(stmt)
        return result.scalars().all()

    @classmethod
    async def filter(cls, db: AsyncSession, **kwargs):
        stmt = select(cls)
        for key, value in kwargs.items():
            if hasattr(cls, key):
                stmt = stmt.filter(getattr(cls, key) == value)
        result = await db.execute(stmt)
        return result.scalars().all()
    
    def __repr__(self):
        # Define un formato de representacion como cadena para el modelo base.
        params = ", ".join(f"{k}={v}" for k, v in keyvalgen(self))
        return f"{self.__class__.__name__}({params})"