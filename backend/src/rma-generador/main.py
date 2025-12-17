import sys
import argparse
import threading
import signal
import random
import time
import paho.mqtt.client as paho
from generatorMqtt import TipoMensaje
from generatorMqtt.pub import Nodo
import requests
import json

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

def fetch_nodos_from_api(api_url="http://localhost:8000/nodos"):
    """Obtiene la lista de nodos desde la API del backend."""
    try:
        response = requests.get(api_url, timeout=5)
        response.raise_for_status()  # Lanza una excepción para códigos de error HTTP
        nodos_data = response.json()
        print(f"✓ Obtenidos {len(nodos_data)} nodos desde la API.")
        return [nodo['id'] for nodo in nodos_data]
    except requests.exceptions.RequestException as e:
        print(f"✗ Error al conectar con la API: {e}")
        return None

if __name__ == "__main__":

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-n",
        "--nodos",
        type=int,
        default=5,
        help="Cantidad de nodos para la cual generar datos si falla la API. (default=5)",
    )
    parser.add_argument(
        "-t",
        "--threads-por-tipo",
        type=int,
        default=2,
        help="Cantidad de threads por tipo de sensor por nodo. (default=2)",
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
    
    # Obtener nodos desde la API
    node_ids = fetch_nodos_from_api()
    
    # Si falla la API, usar el método anterior como fallback
    if node_ids is None:
        print(f"Usando {args.nodos} nodos de fallback.")
        node_ids = range(1, args.nodos + 1) # Empezar desde 1 para evitar ID 0

    lista_nodos = [
        Nodo(node_id, frecuencia=random.randint(freq_min, freq_max), stop_event=stop_event)
        for node_id in node_ids
    ]

    if not lista_nodos:
        print("✗ No hay nodos para simular. Saliendo.")
        sys.exit(0)
        
    print(f"{len(lista_nodos)} nodo/s creados. Publicando...")
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
    