"""
Script de migración para actualizar la tabla variables_nodo.

Este script realiza los siguientes cambios:
1. Elimina la columna 'nombre' (si existe)
2. Elimina la columna 'valor_actual' (si existe)
3. Agrega la columna 'tipo_sensor_id' con FK a datos_sensores
4. Agrega índice en tipo_sensor_id
5. Agrega constraint UNIQUE en (nodo_id, tipo_sensor_id)

IMPORTANTE: Este script es idempotente - puede ejecutarse múltiples veces sin causar errores.
"""

import asyncio
from sqlalchemy import text
from backend.database import async_engine

async def migrate():
    async with async_engine.begin() as conn:
        print("🔧 Iniciando migración de variables_nodo...")

        # 1. Verificar si la columna tipo_sensor_id ya existe
        result = await conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'variables_nodo' AND column_name = 'tipo_sensor_id'
        """))
        existe_tipo_sensor_id = result.first() is not None

        if existe_tipo_sensor_id:
            print("✅ La columna tipo_sensor_id ya existe. Migración ya aplicada.")
            return

        print("📋 Aplicando migración...")

        # 2. Eliminar columna valor_actual si existe
        try:
            await conn.execute(text("""
                ALTER TABLE variables_nodo DROP COLUMN IF EXISTS valor_actual
            """))
            print("  ✓ Columna 'valor_actual' eliminada")
        except Exception as e:
            print(f"  ⚠ Error al eliminar valor_actual: {e}")

        # 3. Eliminar columna nombre si existe
        try:
            await conn.execute(text("""
                ALTER TABLE variables_nodo DROP COLUMN IF EXISTS nombre
            """))
            print("  ✓ Columna 'nombre' eliminada")
        except Exception as e:
            print(f"  ⚠ Error al eliminar nombre: {e}")

        # 4. Agregar columna tipo_sensor_id
        try:
            await conn.execute(text("""
                ALTER TABLE variables_nodo
                ADD COLUMN tipo_sensor_id INTEGER
            """))
            print("  ✓ Columna 'tipo_sensor_id' agregada")
        except Exception as e:
            print(f"  ❌ Error al agregar tipo_sensor_id: {e}")
            raise

        # 5. Agregar FK a datos_sensores
        try:
            await conn.execute(text("""
                ALTER TABLE variables_nodo
                ADD CONSTRAINT fk_tipo_sensor
                FOREIGN KEY (tipo_sensor_id)
                REFERENCES datos_sensores(tipo)
                ON DELETE RESTRICT
            """))
            print("  ✓ Foreign key agregada a datos_sensores")
        except Exception as e:
            print(f"  ❌ Error al agregar FK: {e}")
            raise

        # 6. Crear índice en tipo_sensor_id
        try:
            await conn.execute(text("""
                CREATE INDEX idx_variables_nodo_tipo_sensor
                ON variables_nodo(tipo_sensor_id)
            """))
            print("  ✓ Índice creado en tipo_sensor_id")
        except Exception as e:
            print(f"  ⚠ Error al crear índice: {e}")

        # 7. Agregar constraint UNIQUE
        try:
            await conn.execute(text("""
                ALTER TABLE variables_nodo
                ADD CONSTRAINT unique_tipo_sensor_por_nodo
                UNIQUE (nodo_id, tipo_sensor_id)
            """))
            print("  ✓ Constraint UNIQUE agregada")
        except Exception as e:
            print(f"  ⚠ Error al agregar constraint UNIQUE: {e}")

        print("✅ Migración completada exitosamente!")
        print("\nNOTA: La tabla variables_nodo ahora está vacía porque se eliminaron")
        print("las columnas 'nombre' y 'valor_actual'. Deberás volver a crear las variables")
        print("usando el nuevo sistema basado en tipo_sensor_id.")

if __name__ == "__main__":
    asyncio.run(migrate())
