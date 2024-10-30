import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..'))) #Ejecutar desde RMA-grupo-2
import paho.mqtt.client as paho
import asyncio
from dotenv import load_dotenv
from backend.src import services
from backend.src.schemas import MedicionCreate
from pydantic import BaseModel
from backend.database import *

class Mensaje(BaseModel):
    id: int
    type: int
    data: str
    time: str
load_dotenv()

MQTT_HOST = "localhost"
MQTT_PORT = 1883
MQTT_KEEPALIVE = 60
TOPIC = "test_topic"

async def message_handling(client, userdata, message):
    mensaje = message.payload.decode('utf-8').replace("\'", "\"")
    #timport pdb; pdb.set_trace()
    try:
        m = Mensaje.model_validate_json(mensaje)
        med = MedicionCreate(nodo=m.id, dato=m.data,tipo=m.type, tiempo=m.time, bateria=None, error=False)
        # print(f"Guardando en la base de datos {med.nodo}--{med.tipo}--{med.dato}--{med.bateria}--{med.error}")
        # Abrir una nueva sesión de la base de datos en cada mensaje
        async for db in get_db():  # Crear nueva sesión
            await services.crear_medicion(db, med)
            print("Datos Guardados...")
    except Exception as e:
        print(e)
        print("Error al guardar en la base de datos")

def on_message(client, userdata, message):
    # Ejecutar la coroutine en el loop de eventos actual usando run_coroutine_threadsafe
    asyncio.run_coroutine_threadsafe(message_handling(client, userdata, message), loop)

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Suscriptor conectado!")
        client.subscribe(TOPIC, qos=1)
    else:
        print(f"Error de conexión al broker MQTT. Código de retorno: {rc}")
    
def on_subscribe(client, userdata, flags, rc):
    print(f"Suscrito a {TOPIC}!")

async def main():
    global loop  # Necesitamos una referencia global al loop para que on_message lo use
    loop = asyncio.get_running_loop()

    client = paho.Client()
    client.on_message = on_message
    client.on_connect = on_connect
    client.on_subscribe = on_subscribe

    host = "localhost"
    port = 1883
    keepalive = 60
    if client.connect(host, port, keepalive) != 0:
        print("Ha ocurrido un problema al conectar con el broker MQTT")
        sys.exit(1)

    try:
        print("Presione CTRL+C para salir...")
        client.loop_start()  # Iniciar el loop en un hilo separado
        while True:
            await asyncio.sleep(1)  # Mantener el loop asyncio corriendo
    except KeyboardInterrupt:
        print("Desconectando del broker MQTT")
    finally:
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
