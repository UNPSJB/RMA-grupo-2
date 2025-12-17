import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..'))) #Ejecutar desde RMA-grupo-2
import paho.mqtt.client as paho
import asyncio
import logging
from dotenv import load_dotenv
from backend.src import services
from backend.src.schemas import MedicionCreate
from pydantic import BaseModel
from backend.database import SessionLocal
import uuid

# Configuración básica del logging para ver los mensajes de INFO y ERROR
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

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

# Cola global para encolar mensajes desde el callback MQTT
message_queue = None
loop = None

async def message_worker():
    """Worker que consume de la cola y persiste en la BD de forma secuencial."""
    global message_queue
    while True:
        try:
            # Esperar por el próximo payload en la cola
            payload = await message_queue.get()
            msg_id = uuid.uuid4().hex[:8]
            
            try:
                # Decodificar y validar
                print(f"[{msg_id}] Iniciando procesamiento...")
                mensaje = payload.replace("'", '"')
                m = Mensaje.model_validate_json(mensaje)
                med = MedicionCreate(
                    nodo=m.id, 
                    dato=m.data, 
                    tipo=m.type, 
                    tiempo=m.time, 
                    bateria=None, 
                    error=False
                )
                
                # Crear una sesión nueva para este mensaje
                print(f"[{msg_id}] Creando sesión BD...")
                async with SessionLocal() as db:
                    print(f"[{msg_id}] Llamando crear_medicion...")
                    await services.crear_medicion(db, med)
                    print(f"[{msg_id}] ✓ Datos Guardados (nodo={med.nodo}, tipo={med.tipo})")
                    
            except Exception as e:
                print(f"[{msg_id}] ✗ Error procesando mensaje: {type(e).__name__}: {e}")
                import traceback
                traceback.print_exc()
            finally:
                # Marcar la tarea como completada en la cola
                message_queue.task_done()
                
        except asyncio.CancelledError:
            # El worker fue cancelado (p. ej., al salir del programa)
            print("Worker cancelado.")
            break
        except Exception as e:
            print(f"Error fatal en worker: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()

def on_message(client, userdata, message):
    """Callback del MQTT: encola el payload sin bloquearse."""
    global message_queue
    try:
        payload = message.payload.decode('utf-8')
        # Enqueue the payload (non-blocking, runs in the asyncio loop context)
        loop.call_soon_threadsafe(message_queue.put_nowait, payload)
    except Exception as e:
        print(f"Error encolando mensaje: {e}")

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Suscriptor conectado!")
        client.subscribe(TOPIC, qos=1)
    else:
        print(f"Error de conexión al broker MQTT. Código de retorno: {rc}")
    
def on_subscribe(client, userdata, flags, rc):
    print(f"Suscrito a {TOPIC}!")

async def main():
    global loop, message_queue
    
    # Obtener el loop actual
    loop = asyncio.get_running_loop()
    
    # Crear la cola global
    message_queue = asyncio.Queue()
    
    # Iniciar el worker que consume la cola
    worker_task = asyncio.create_task(message_worker())
    
    # Configurar el cliente MQTT
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
        
        # Mantener el loop asyncio corriendo
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        print("\nDeteniendo suscriptor...")
    finally:
        client.loop_stop()
        client.disconnect()
        
        # Cancelar el worker
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass
        
        # Mostrar estadísticas finales
        print(f"Cola: {message_queue.qsize()} mensajes pendientes")
        print("Suscriptor desconectado.")

if __name__ == "__main__":
    asyncio.run(main())
