import os
import sys
import time
import random
import threading
import paho.mqtt.client as paho
from paho.mqtt.client import CallbackAPIVersion
from typing import Optional
from datetime import datetime
from dataclasses import dataclass, field
from generatorMqtt import TipoMensaje
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

class Mensaje(BaseModel):
    id: int
    type: int
    data: str
    time: str

@dataclass
class Nodo:
    id: int
    stop_event: threading.Event
    frecuencia: int = 5  # cada cuantos segundos publica mensajes?
    cliente: paho.Client = field(default_factory=lambda: paho.Client(CallbackAPIVersion.VERSION1))

    def publicar(
        self,
        topic: str,
        tipo: TipoMensaje,
        message: str = "",
        qos: int = 1,
    ) -> None:
        try:
            if not self.cliente.is_connected():
                host = "localhost"
                port = 1883
                keepalive = 60
                self.conectar(host, port, keepalive)

            while not self.stop_event.is_set():
                try:
                    if len(message) == 0:
                        message = str(random.uniform(12.0, 70.0))
                    mensaje = self.formatear_mensaje(
                        topic,
                        tipo,
                        message,
                    )

                    result = self.cliente.publish(
                        topic,
                        mensaje,
                        qos,
                    )
                    
                    # Verificar si la publicación fue exitosa
                    if result.rc != paho.MQTT_ERR_SUCCESS:
                        print(f"Error publicando: {result.rc}")
                    else:
                        print(f"[Nodo {self.id}] {mensaje}")
                    
                    time.sleep(self.frecuencia)
                    message = ""
                except Exception as e:
                    print(f"Error en loop de publicación: {e}")
                    time.sleep(1)  # Esperar antes de reintentar

        except Exception as e:
            print(f"Error fatal en publicar: {e}")
        finally:
            try:
                self.desconectar()
            except:
                pass

    def conectar(self, host: str, port: int = 1883, keepalive: int = 60) -> None:
        try:
            result = self.cliente.connect(host, port, keepalive)
            if result != paho.MQTT_ERR_SUCCESS:
                print(f"Error conectando: {result}")
            else:
                print(f"[Nodo {self.id}] Conectado al broker MQTT!")
                self.cliente.loop_start()  # Iniciar loop en este cliente
        except Exception as e:
            print(f"Error al conectar: {e}")

    def desconectar(self):
        try:
            if self.cliente.is_connected():
                self.cliente.loop_stop()
                self.cliente.disconnect()
        except Exception as e:
            print(f"Error al desconectar: {e}")

    def formatear_mensaje(self, topic: str, tipo: TipoMensaje, mensaje: str) -> str:
        mensaje_obj = Mensaje(
            id=self.id, type=tipo.value, data=str(mensaje), time=str(datetime.now())
        )
        return str(mensaje_obj.model_dump())
