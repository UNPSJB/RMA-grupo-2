import os, asyncio, sys, subprocess
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../'))) #Ejecutar desde RMA-grupo-2
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from backend.database import engine, Base
#from src.models import Producto
from backend.src.routes import router as routers
from sqlalchemy.future import select
from fastapi.middleware.cors import CORSMiddleware

async def proc1():
    await subprocess.run(['python', 'src/rma-generador/main.py'])
async def proc2():
    await subprocess.run(['python', 'src/rma-generador/generatorMqtt/sub.py'])

load_dotenv()#.env
DATABASE_URL = os.getenv("DB_URL")
ENV = os.getenv("ENV", "DEV")
ROOT_PATH = os.getenv(f"ROOT_PATH_{ENV.upper()}", "")


app = FastAPI(root_path=ROOT_PATH)
app.include_router(routers)

#Montar frontend al servidor
app.mount("/frontend", StaticFiles(directory="../frontend"), name="frontend")

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all) # Crear todas las tablas

#Conexion con el frontend
'''
origins = [
    "http://localhost:5173"
]
'''

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir el origen de tu frontend
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos HTTP
    allow_headers=["*"],  # Permitir todos los headers
)


async def main():
    await asyncio.gather(
        init_db(),
        proc1(),
        proc2() 
    )

if __name__ == "__main__":
    asyncio.run(main())