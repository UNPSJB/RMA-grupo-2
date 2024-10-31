import sys
import argparse
import threading
import signal
import random
import paho.mqtt.client as paho
from generatorMqtt import TipoMensaje
from generatorMqtt.pub import Nodo


def signal_handler(sig, frame):
    print("Deteniendo nodos...")
    stop_event.set()

if __name__ == "__main__":

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-n",
        "--nodos",
        type=int,
        default=5,
        help="Cantidad de nodos para la cual generar datos. (default=1)",
    )

    stop_event = threading.Event()
    signal.signal(signal.SIGINT, signal_handler)
    
    args = parser.parse_args()
    lista_nodos = [
        Nodo(i, frecuencia=random.randint(5, 10), stop_event=stop_event)
        for i in range(args.nodos)
    ]
    print(f"{len(lista_nodos)} nodo/s creado/s. Publicando...")
    
    # Visualizar tipos
    #for tipo in TipoMensaje:
    #    print(tipo.name, tipo.value)
    
## ------------------- TEMPERATURA    
    
    for nodo in lista_nodos:
        t_temp = [TipoMensaje.TEMP_T,TipoMensaje.TEMP_T,TipoMensaje.TEMP_T]
        for tipo in  t_temp:
            thread = threading.Thread(
                target=nodo.publicar,
                args=("test_topic",tipo,),
            )
            thread.start()
## ------------------- ALTURA

    for nodo in lista_nodos:
        t_alt = [TipoMensaje.WATER_HEIGHT,TipoMensaje.WATER_HEIGHT,TipoMensaje.WATER_HEIGHT]
        for tipo in  t_alt:
            thread = threading.Thread(
                target=nodo.publicar,
                args=("test_topic",tipo,),
            )
            thread.start()

## ------------------- LATITUD
    '''
    for nodo in lista_nodos:
        t_gps_lat = [TipoMensaje.LATITUDE_T,TipoMensaje.LATITUDE_T,TipoMensaje.VOLTAGE_T]
        for tipo in  t_gps_lat:
            thread = threading.Thread(
                target=nodo.publicar,
                args=("test_topic",tipo,),
            )
            thread.start()
    '''
## ------------------- LONGITUD
    '''
    for nodo in lista_nodos:
        t_gps_long = [TipoMensaje.LATITUDE_T,TipoMensaje.WATER_HEIGHT,TipoMensaje.VOLTAGE_T]
        for tipo in  t_gps_long:
            thread = threading.Thread(
                target=nodo.publicar,
                args=("test_topic",tipo,),
            )
            thread.start()
    '''
