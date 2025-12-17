#!/usr/bin/env python3
"""
Script de diagnóstico y prueba del sistema de alarmas MQTT
Verifica configuración y crea alarmas de prueba
"""
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

import asyncio
import requests
from backend.database import SessionLocal
from sqlalchemy import text

# Colores para output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text:^80}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")

async def check_database():
    """Verificar conexión a base de datos y obtener información"""
    print_header("1. VERIFICACIÓN DE BASE DE DATOS")

    try:
        async with SessionLocal() as db:
            # Verificar nodos
            result = await db.execute(text('SELECT id, nombre FROM nodo ORDER BY id'))
            nodos = result.fetchall()

            if nodos:
                print_success(f"Encontrados {len(nodos)} nodos en la base de datos:")
                for nodo in nodos:
                    print(f"  - ID {nodo[0]:2d}: {nodo[1]}")
            else:
                print_error("No hay nodos en la base de datos")
                return None, None

            # Verificar tipos de sensores
            result = await db.execute(text('SELECT tipo, descripcion, min, max FROM datos_sensores ORDER BY tipo'))
            sensores = result.fetchall()

            if sensores:
                print_success(f"\nEncontrados {len(sensores)} tipos de sensores:")
                for sensor in sensores:
                    print(f"  - Tipo {sensor[0]:2d}: {sensor[1]:30s} | Rango: [{sensor[2]:6.1f}, {sensor[3]:6.1f}]")
            else:
                print_error("No hay tipos de sensores en la base de datos")
                return nodos, None

            # Verificar alarmas existentes
            result = await db.execute(text('SELECT id, nombre, nodo, tipo, valor_min, valor_max, chat_id FROM alarma ORDER BY id'))
            alarmas = result.fetchall()

            if alarmas:
                print_success(f"\nEncontradas {len(alarmas)} alarmas existentes:")
                for alarma in alarmas:
                    destino = "Grupal" if alarma[6] is None else f"Personal ({alarma[6]})"
                    print(f"  - Alarma {alarma[0]:2d}: '{alarma[1]}' | Nodo {alarma[2]} | Tipo {alarma[3]} | Rango: [{alarma[4]}, {alarma[5]}] | Destino: {destino}")
            else:
                print_warning("\nNo hay alarmas creadas todavía")

            return nodos, sensores

    except Exception as e:
        print_error(f"Error al conectar con la base de datos: {e}")
        return None, None

def check_mqtt_publisher_config():
    """Verificar configuración del publicador MQTT"""
    print_header("2. VERIFICACIÓN DEL PUBLICADOR MQTT")

    pub_path = "/home/fefe/Universidad/Desarrollo/RMA-grupo-2/backend/src/rma-generador/main.py"

    try:
        with open(pub_path, 'r') as f:
            content = f.read()

        if 'for i in range(args.nodos)' in content:
            print_warning("El publicador genera nodos con ID empezando en 0")
            print_info("  Los IDs generados serán: 0, 1, 2, 3, ...")
            return True
        else:
            print_success("El publicador está configurado correctamente")
            return True

    except Exception as e:
        print_error(f"Error al leer el publicador: {e}")
        return False

async def create_test_alarm(nodo_id, tipo_sensor_id, tipo_sensor_desc):
    """Crear una alarma de prueba"""
    print_header("3. CREACIÓN DE ALARMA DE PRUEBA")

    # Configurar rango estrecho para garantizar disparos
    valor_min = 30.0
    valor_max = 40.0

    alarm_data = {
        "nombre": f"TEST - Alarma Nodo {nodo_id}",
        "descripcion": f"Alarma de prueba para {tipo_sensor_desc} en nodo {nodo_id}. Rango estrecho para testing.",
        "tipo": tipo_sensor_id,
        "nodo": nodo_id,
        "valor_min": valor_min,
        "valor_max": valor_max,
        "chat_id": None  # Chat grupal
    }

    try:
        response = requests.post('http://localhost:8000/alarma', json=alarm_data)

        if response.status_code == 200:
            alarma_creada = response.json()
            print_success(f"Alarma de prueba creada exitosamente (ID: {alarma_creada.get('id')})")
            print_info(f"  Nodo: {nodo_id}")
            print_info(f"  Tipo: {tipo_sensor_id} ({tipo_sensor_desc})")
            print_info(f"  Rango: [{valor_min}, {valor_max}]")
            print_info(f"  Destino: Chat grupal")
            return True
        else:
            print_error(f"Error al crear alarma: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print_error(f"Error al crear alarma: {e}")
        return False

def print_next_steps(nodo_id, tipo_sensor_id):
    """Imprimir pasos siguientes"""
    print_header("4. PASOS SIGUIENTES PARA PROBAR EL SISTEMA")

    print(f"{Colors.BOLD}Paso A: Iniciar el Suscriptor MQTT{Colors.ENDC}")
    print("  Terminal 1:")
    print(f"  {Colors.OKCYAN}cd /home/fefe/Universidad/Desarrollo/RMA-grupo-2{Colors.ENDC}")
    print(f"  {Colors.OKCYAN}python3 -m backend.src.rma-generador.generatorMqtt.sub{Colors.ENDC}")

    print(f"\n{Colors.BOLD}Paso B: Iniciar el Publicador MQTT (EN OTRA TERMINAL){Colors.ENDC}")
    print("  Terminal 2:")
    print(f"  {Colors.OKCYAN}cd /home/fefe/Universidad/Desarrollo/RMA-grupo-2/backend/src/rma-generador{Colors.ENDC}")

    # Mapeo de tipos de sensor a TipoMensaje
    tipo_map = {
        2: "TEMP_T",
        22: "VOLTAGE_T",
        27: "LATITUDE_T",
        31: "WATER_HEIGHT"
    }

    tipo_mqtt = tipo_map.get(tipo_sensor_id, "TEMP_T")

    print(f"  {Colors.WARNING}IMPORTANTE: Debes modificar main.py para que publique el nodo ID {nodo_id}{Colors.ENDC}")
    print(f"  {Colors.WARNING}y el tipo de sensor {tipo_sensor_id} ({tipo_mqtt}){Colors.ENDC}")
    print(f"  {Colors.OKCYAN}python3 main.py -n 1 -t 1 -f 3,5{Colors.ENDC}")

    print(f"\n{Colors.BOLD}Paso C: Observar las Alarmas{Colors.ENDC}")
    print("  - En la terminal del suscriptor verás: '✓ Datos Guardados'")
    print("  - En Telegram (canal grupal) verás las alarmas cuando el valor esté fuera del rango [30.0, 40.0]")
    print("  - El publicador genera valores entre 12.0 y 70.0, así que habrá alarmas")

    print(f"\n{Colors.BOLD}Paso D: Verificar que el Bot de Telegram esté corriendo{Colors.ENDC}")
    print("  Terminal 3 (si no está corriendo):")
    print(f"  {Colors.OKCYAN}cd /home/fefe/Universidad/Desarrollo/RMA-grupo-2{Colors.ENDC}")
    print(f"  {Colors.OKCYAN}python3 -m backend.src.bot{Colors.ENDC}")

async def main():
    print(f"{Colors.BOLD}{Colors.HEADER}")
    print("╔════════════════════════════════════════════════════════════════════════════╗")
    print("║        DIAGNÓSTICO DEL SISTEMA DE ALARMAS MQTT - RMA Grupo 2             ║")
    print("╚════════════════════════════════════════════════════════════════════════════╝")
    print(f"{Colors.ENDC}")

    # Verificar base de datos
    nodos, sensores = await check_database()

    if not nodos or not sensores:
        print_error("\n❌ No se puede continuar sin nodos y sensores en la base de datos")
        return

    # Verificar configuración del publicador
    check_mqtt_publisher_config()

    # Preguntar si crear alarma de prueba
    print(f"\n{Colors.BOLD}¿Deseas crear una alarma de prueba?{Colors.ENDC}")
    print("Esto creará una alarma con rango estrecho [30.0, 40.0] para facilitar las pruebas.")

    respuesta = input("Escribe 'si' para crear alarma de prueba: ").strip().lower()

    if respuesta in ['si', 's', 'yes', 'y']:
        # Usar el primer nodo disponible
        nodo_id = nodos[0][0]

        # Buscar tipo de sensor compatible con el publicador
        # El publicador usa: TEMP_T=2, WATER_HEIGHT=31, LATITUDE_T=27, VOLTAGE_T=22
        tipos_compatibles = {2, 22, 27, 31}
        sensor_encontrado = None

        for sensor in sensores:
            if sensor[0] in tipos_compatibles:
                sensor_encontrado = sensor
                break

        if not sensor_encontrado:
            # Usar cualquier sensor disponible
            sensor_encontrado = sensores[0]
            print_warning(f"No se encontró un tipo compatible con el publicador MQTT.")
            print_warning(f"Se usará el tipo {sensor_encontrado[0]} ({sensor_encontrado[1]})")
            print_warning(f"Deberás modificar el publicador para usar este tipo.")

        await create_test_alarm(nodo_id, sensor_encontrado[0], sensor_encontrado[1])
        print_next_steps(nodo_id, sensor_encontrado[0])
    else:
        print_info("No se creó alarma de prueba")

    print(f"\n{Colors.OKGREEN}{Colors.BOLD}✓ Diagnóstico completado{Colors.ENDC}")

if __name__ == "__main__":
    asyncio.run(main())
