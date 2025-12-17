#!/usr/bin/env python3
"""
Script de prueba para verificar el flujo completo de alarmas
"""
import sys
import asyncio
sys.path.insert(0, '/home/fefe/Universidad/Desarrollo/RMA-grupo-2')

from backend.database import SessionLocal
from backend.src import services
from backend.src.schemas import MedicionCreate
import datetime

async def test_alarm_flow():
    print("=== TEST DEL FLUJO DE ALARMAS ===\n")

    # Crear una medición de prueba que DEBE disparar la alarma
    # Alarma ID 5: Nodo 8, Tipo 1 (Temperatura), Rango: 20.0 - 30.0
    test_medicion = MedicionCreate(
        nodo=8,
        tipo=1,  # Temperatura
        dato=35.0,  # Fuera del rango 20-30, debe disparar alarma
        tiempo=datetime.datetime.now(datetime.timezone.utc),
        bateria=None,
        error=False
    )

    print(f"Creando medición de prueba:")
    print(f"  Nodo: {test_medicion.nodo}")
    print(f"  Tipo: {test_medicion.tipo} (Temperatura)")
    print(f"  Valor: {test_medicion.dato} °C")
    print(f"  Esperado: Debe disparar alarma (valor > 30.0)\n")

    try:
        async with SessionLocal() as db:
            print("Llamando a crear_medicion()...")
            resultado = await services.crear_medicion(db, test_medicion)
            print(f"✓ Medición creada con ID: {resultado.id}")
            print("\nSi la alarma funcionó, deberías recibir un mensaje en Telegram.")
            print("Revisa el canal @RMAgrupo2\n")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_alarm_flow())
