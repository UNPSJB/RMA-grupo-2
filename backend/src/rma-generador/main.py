import sys
import argparse
import threading
import signal
import random
import time
import paho.mqtt.client as paho
from generatorMqtt import TipoMensaje
from generatorMqtt.pub import Nodo

threads = []
stop_event = None

def signal_handler(sig, frame):
    global stop_event
    print("\n\nDeteniendo nodos...")
    stop_event.set()
    # Esperar a que terminen los threads
    for t in threads:
        t.join(timeout=5)
    print("Publicador detenido.")
    sys.exit(0)

if __name__ == "__main__":

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-n",
        "--nodos",
        type=int,
        default=5,
        help="Cantidad de nodos para la cual generar datos. (default=5)",
    )
    parser.add_argument(
        "-t",
        "--threads-por-tipo",
        type=int,
        default=3,
        help="Cantidad de threads por tipo de sensor por nodo. (default=3)",
    )
    parser.add_argument(
        "-d",
        "--duracion",
        type=int,
        default=0,
        help="Duración en segundos. 0 = indefinido hasta CTRL+C (default=0)",
    )
    parser.add_argument(
        "-f",
        "--frecuencia-min-max",
        type=str,
        default="5,10",
        help="Rango de frecuencia en segundos (min,max). ej: 5,10 (default=5,10)",
    )

    stop_event = threading.Event()
    signal.signal(signal.SIGINT, signal_handler)
    
    args = parser.parse_args()
    
    # Parsear rango de frecuencia
    freq_min, freq_max = map(int, args.frecuencia_min_max.split(","))
    if freq_min > freq_max:
        freq_min, freq_max = freq_max, freq_min
    
    lista_nodos = [
        Nodo(i, frecuencia=random.randint(freq_min, freq_max), stop_event=stop_event)
        for i in range(args.nodos)
    ]
    print(f"{len(lista_nodos)} nodo/s creado/s. Publicando...")
    print(f"Threads por tipo de sensor: {args.threads_por_tipo}")
    print(f"Frecuencia (segundos): {freq_min}-{freq_max}")
    print("Presione CTRL+C para detener.")
    
    # Definir tipos de sensor
    tipos_sensores = [
        TipoMensaje.TEMP_T,
        TipoMensaje.WATER_HEIGHT,
        TipoMensaje.LATITUDE_T,
        TipoMensaje.VOLTAGE_T,
    ]
    
    # Crear threads: N threads por tipo de sensor por nodo
    # Esto simula N sensores del mismo tipo en cada nodo
    for nodo in lista_nodos:
        for tipo in tipos_sensores:
            for sensor_id in range(args.threads_por_tipo):
                thread = threading.Thread(
                    target=nodo.publicar,
                    args=("test_topic", tipo,),
                    name=f"Nodo{nodo.id}-{tipo.name}-{sensor_id}",
                    daemon=False,
                )
                thread.start()
                threads.append(thread)
                # Pequeño delay entre inicio de threads para evitar sincronización
                time.sleep (0.05)
    
    total_threads = len(threads)
    print(f"Se crearon {total_threads} threads de publicación.")
    print(f"Configuración: {args.nodos} nodos × {len(tipos_sensores)} tipos × {args.threads_por_tipo} threads/tipo = {total_threads} threads")
    
    if args.duracion > 0:
        print(f"Publicando durante {args.duracion} segundos...")
        time.sleep(args.duracion)
        signal_handler(None, None)
    else:
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            signal_handler(None, None)
    