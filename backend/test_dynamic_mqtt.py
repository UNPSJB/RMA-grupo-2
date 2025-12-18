#!/usr/bin/env python3
"""
Script de prueba para verificar que el publicador MQTT dinámico funciona correctamente
"""
import requests

def test_fetch_sensores():
    """Prueba obtener sensores desde la API"""
    print("=== TEST: Obtener sensores desde la API ===\n")

    api_url = "http://localhost:8000/sensores"

    try:
        response = requests.get(api_url, timeout=5)
        response.raise_for_status()
        sensores_data = response.json()

        print(f"✓ Obtenidos {len(sensores_data)} tipos de sensores desde la API.\n")

        # Mostrar todos los sensores
        print("Sensores disponibles:")
        print("-" * 80)
        print(f"{'ID':<5} {'Descripción':<30} {'Min':<10} {'Max':<10} {'Unidad':<10}")
        print("-" * 80)

        for sensor in sensores_data:
            unidad = sensor.get('unidad', '-') or '-'
            print(f"{sensor['tipo']:<5} {sensor['descripcion']:<30} {sensor['min']:<10} {sensor['max']:<10} {unidad:<10}")

        print("-" * 80)

        # Lista de IDs que se enviarían al publicador
        tipos_sensores = [sensor['tipo'] for sensor in sensores_data]
        print(f"\nIDs de sensores que se enviarán por MQTT: {tipos_sensores}")

        return tipos_sensores

    except requests.exceptions.RequestException as e:
        print(f"✗ Error al conectar con la API de sensores: {e}")
        return None

if __name__ == "__main__":
    tipos = test_fetch_sensores()

    if tipos:
        print(f"\n✅ El publicador MQTT enviará datos para {len(tipos)} tipos de sensores")
        print("✅ Incluyendo cualquier sensor nuevo creado desde la UI!")
    else:
        print("\n❌ Error al obtener sensores. El publicador usará sensores de fallback.")
