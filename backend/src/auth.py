import os, asyncio, sys, subprocess
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../'))) #Ejecutar desde RMA-grupo-2
from dotenv import load_dotenv
from backend.src.models import Usuario
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.database import get_db 
from datetime import datetime, timedelta
from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"]) #, deprecated="auto") #para encriptar pass


load_dotenv()#.env
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Obtener el usuario desde la base de datos por email
async def get_user_by_email(db: AsyncSession, email: str) -> Usuario:
    result = await db.execute(select(Usuario).where(Usuario.email == email))
    return result.scalar_one_or_none()

# Función de autenticación

async def authenticate_user(db: AsyncSession, email: str, password: str) -> Usuario:
    # Busca al usuario usando la función get_user_by_email
    user = await get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=401, detail="Correo electrónico o contraseña incorrectos.")
    
    # Verifica la contraseña
    if not pwd_context.verify(password, user.contrasena):
        raise HTTPException(status_code=401, detail="Correo electrónico o contraseña incorrectos.")
    
    # Retorna el usuario si la autenticación es exitosa
    return user

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt 

async def get_current_user(token: str, db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id")
        role: str = payload.get("role")
        if user_id is None or role is None:
            raise credentials_exception
        return {"user_id": user_id, "role": role}
    except JWTError:
        raise credentials_exception

def role_required(required_role: str):
    async def role_dependency(user: dict = Depends(get_current_user)):
        if user["role"] != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para acceder a esta ruta.",
            )
        return user
    return role_dependency