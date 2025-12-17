#!/usr/bin/env python3
"""
Script simplificado para crear alarmas de prueba usando solo requests
"""
import requests
import json

# Colores
class C:
    G = '\033[92m'  # Green
    Y = '\033[93m'  # Yellow
    R = '\033[91m'  # Red
    B = '\033[94m'  # Blue
    C = '\033[96m'  # Cyan
    E = '\033[0m'   # End
    BOLD = '\033[1m'

print(f"\n{C.B}{C.BOLD}{'='*80}")
print(f"{'CONFIGURACIÓN RÁPIDA DE ALARMAS PARA PRUEBAS':^80}")
print(f"{'='*80}{C.E}\n")

# 1. Obtener nodos
print(f"{C.BOLD}1. Obteniendo nodos del sistema...{C.E}")
try:
    response = requests.get('http://localhost:8000/nodos')
    nodos = response.json()

    if not nodos:
        print(f"{C.R}✗ No hay nodos en el sistema. Crea al menos un nodo primero.{C.E}")
        exit(1)

    print(f"{C.G}✓ Encontrados {len(nodos)} nodos:{C.E}")
    for nodo in nodos[:5]:  # Mostrar solo primeros 5
        print(f"  - ID {nodo['id']:2d}: {nodo['nombre']}")

    if len(nodos) > 5:
        print(f"  ... y {len(nodos) - 5} más")

except Exception as e:
    print(f"{C.R}✗ Error al obtener nodos: {e}{C.E}")
    exit(1)

# 2. Obtener tipos de sensores
print(f"\n{C.BOLD}2. Obteniendo tipos de sensores...{C.E}")
try:
    response = requests.get('http://localhost:8000/sensores')
    sensores = response.json()

    if not sensores:
        print(f"{C.R}✗ No hay tipos de sensores configurados{C.E}")
        exit(1)

    print(f"{C.G}✓ Encontrados {len(sensores)} tipos de sensores:{C.E}")

    # Mapeo de tipos MQTT a IDs de base de datos
    # TEMP_T, WATER_HEIGHT, LATITUDE_T, VOLTAGE_T son los que publica el generador
    tipos_mqtt = {
        "TEMP_T": 2,
        "WATER_HEIGHT": 31,
        "LATITUDE_T": 27,
        "VOLTAGE_T": 22
    }

    sensor_compatible = None
    for sensor in sensores:
        tipo_id = sensor['tipo']
        desc = sensor['desc']
        print(f"  - Tipo {tipo_id:2d}: {desc}")

        # Buscar uno compatible con MQTT
        if tipo_id in tipos_mqtt.values():
            sensor_compatible = sensor
            print(f"    {C.G}→ ¡Compatible con publicador MQTT!{C.E}")

    if not sensor_compatible:
        print(f"\n{C.Y}⚠ No se encontró un tipo compatible con el publicador MQTT{C.E}")
        print(f"{C.Y}  Se usará el primero disponible: Tipo {sensores[0]['tipo']} ({sensores[0]['desc']}){C.E}")
        sensor_compatible = sensores[0]

except Exception as e:
    print(f"{C.R}✗ Error al obtener sensores: {e}{C.E}")
    exit(1)

# 3. Verificar alarmas existentes
print(f"\n{C.BOLD}3. Verificando alarmas existentes...{C.E}")
try:
    response = requests.get('http://localhost:8000/alarmas/')
    alarmas = response.json() if response.text else []

    if alarmas:
        print(f"{C.G}✓ Hay {len(alarmas)} alarma(s) existente(s):{C.E}")
        for alarma in alarmas:
            print(f"  - ID {alarma['id']}: {alarma['nombre']} | Nodo {alarma['nodo']} | Tipo {alarma['tipo']} | Rango [{alarma['valor_min']}, {alarma['valor_max']}]")
    else:
        print(f"{C.Y}⚠ No hay alarmas creadas{C.E}")

except Exception as e:
    print(f"{C.Y}⚠ No se pudieron obtener alarmas existentes{C.E}")
    alarmas = []

# 4. Crear alarma de prueba
print(f"\n{C.BOLD}4. ¿Deseas crear una alarma de prueba?{C.E}")
print(f"{C.C}Esto creará una alarma con rango [30.0, 40.0] para facilitar las pruebas.{C.E}")
print(f"{C.C}El publicador MQTT genera valores entre 12.0 y 70.0, por lo que se dispararán alarmas.{C.E}")

respuesta = input(f"\n{C.BOLD}Escribe 'si' para crear: {C.E}").strip().lower()

if respuesta in ['si', 's', 'yes', 'y']:
    # Usar el primer nodo
    nodo_id = nodos[0]['id']
    tipo_id = sensor_compatible['tipo']
    tipo_desc = sensor_compatible['desc']

    alarm_data = {
        "nombre": f"TEST - Alarma Nodo {nodo_id}",
        "descripcion": f"Alarma de prueba para {tipo_desc} en nodo {nodo_id}. Rango estrecho para testing.",
        "tipo": tipo_id,
        "nodo": nodo_id,
        "valor_min": 30.0,
        "valor_max": 40.0,
        "chat_id": None  # Chat grupal
    }

    try:
        response = requests.post('http://localhost:8000/alarma', json=alarm_data)

        if response.status_code == 200:
            alarma_creada = response.json()
            print(f"\n{C.G}✓ Alarma de prueba creada exitosamente!{C.E}")
            print(f"  ID: {alarma_creada.get('id')}")
            print(f"  Nodo: {nodo_id} ({nodos[0]['nombre']})")
            print(f"  Tipo: {tipo_id} ({tipo_desc})")
            print(f"  Rango: [30.0, 40.0]")
            print(f"  Destino: Chat grupal")

            print(f"\n{C.B}{C.BOLD}{'='*80}")
            print(f"{'PASOS SIGUIENTES PARA PROBAR EL SISTEMA':^80}")
            print(f"{'='*80}{C.E}\n")

            print(f"{C.BOLD}PASO A: Modificar el publicador MQTT para usar el nodo correcto{C.E}")
            print(f"{C.Y}⚠ IMPORTANTE: El publicador genera nodos con ID 0, 1, 2...{C.E}")
            print(f"{C.Y}  Pero tu nodo real tiene ID {nodo_id}{C.E}")
            print(f"\n{C.C}Edita el archivo: backend/src/rma-generador/main.py{C.E}")
            print(f"{C.C}Cambia la línea 66-68:{C.E}")
            print(f"  {C.R}ANTES:{C.E}")
            print(f"    lista_nodos = [")
            print(f"        Nodo(i, frecuencia=..., stop_event=stop_event)")
            print(f"        for i in range(args.nodos)")
            print(f"    ]")
            print(f"\n  {C.G}DESPUÉS:{C.E}")
            print(f"    lista_nodos = [")
            print(f"        Nodo({nodo_id}, frecuencia=random.randint(freq_min, freq_max), stop_event=stop_event)")
            print(f"    ]")

            print(f"\n{C.BOLD}PASO B: Verificar que el bot de Telegram esté corriendo{C.E}")
            print(f"  Terminal 1:")
            print(f"  {C.C}cd /home/fefe/Universidad/Desarrollo/RMA-grupo-2{C.E}")
            print(f"  {C.C}python3 -m backend.src.bot{C.E}")

            print(f"\n{C.BOLD}PASO C: Iniciar el suscriptor MQTT{C.E}")
            print(f"  Terminal 2:")
            print(f"  {C.C}cd /home/fefe/Universidad/Desarrollo/RMA-grupo-2{C.E}")
            print(f"  {C.C}python3 -m backend.src.rma-generador.generatorMqtt.sub{C.E}")
            print(f"  Deberías ver: 'Suscriptor conectado!' y 'Suscrito a test_topic!'")

            print(f"\n{C.BOLD}PASO D: Iniciar el publicador MQTT (después de modificarlo){C.E}")
            print(f"  Terminal 3:")
            print(f"  {C.C}cd /home/fefe/Universidad/Desarrollo/RMA-grupo-2/backend/src/rma-generador{C.E}")
            print(f"  {C.C}python3 main.py -n 1 -t 1 -f 3,5{C.E}")
            print(f"  Verás mensajes como: [Nodo {nodo_id}] {{'id': {nodo_id}, 'type': {tipo_id}, ...}}")

            print(f"\n{C.BOLD}PASO E: Observar las alarmas{C.E}")
            print(f"  - En Terminal 2 (suscriptor) verás: '✓ Datos Guardados (nodo={nodo_id}, tipo={tipo_id})'")
            print(f"  - En Telegram (canal grupal @RMAgrupo2) verás alarmas cuando el valor esté fuera de [30.0, 40.0]")
            print(f"  - Como el publicador genera valores 12.0-70.0, habrá muchas alarmas!")

            print(f"\n{C.G}{C.BOLD}✓ ¡Todo listo! Sigue los pasos anteriores.{C.E}\n")

        else:
            print(f"\n{C.R}✗ Error al crear alarma: {response.status_code}{C.E}")
            print(f"  {response.text}")

    except Exception as e:
        print(f"\n{C.R}✗ Error al crear alarma: {e}{C.E}")
else:
    print(f"\n{C.Y}No se creó alarma de prueba{C.E}")
    print(f"{C.C}Puedes crear alarmas manualmente desde el panel web{C.E}")
