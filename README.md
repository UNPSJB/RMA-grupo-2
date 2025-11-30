# Red de Monitoreo Ambiental (RMA) - Grupo 2

## 📋 Descripción

**Red de Monitoreo Ambiental** es una plataforma integral para recopilar, procesar y monitorear datos de sensores ambientales distribuidos en diferentes nodos. El sistema incluye un backend robusto con API REST, almacenamiento en PostgreSQL, integración con Telegram para alertas en tiempo real, y un frontend web moderno para visualización de datos y generación de reportes.

---

## 👥 Equipo de Desarrollo

- **Patricio Zappellini**
- **Ash Pablovich**
- **Joan Miro**
- **Jeremy Rojas**
- **Federico Cabaña**

---

## 🏗️ Arquitectura

### Backend
- **FastAPI** con Uvicorn para la API REST
- **SQLAlchemy** ORM con PostgreSQL (asyncpg)
- **Aiogram** para integración de bot Telegram
- **MQTT** para recepción de datos de sensores
- **PyOTP** para autenticación de dos factores

### Frontend
- **React** con TypeScript
- **Tailwind CSS** para estilos
- **Vite** como bundler
- **ApexCharts** para gráficos
- **React-to-PDF** para exportación de reportes

### Base de Datos
- **PostgreSQL** con tablas para:
  - `medicion`: datos de sensores
  - `alarma`: configuraciones de alertas
  - `datos_sensores`: especificaciones de tipos de sensores
  - `nodo`: identificación de nodos
  - `usuario`: gestión de usuarios
  - `token`: tokens de vinculación Telegram

---

## 📦 Estructura del Proyecto

```
RMA-grupo-2/
├── backend/
│   ├── src/
│   │   ├── main.py              # Punto de entrada de la aplicación
│   │   ├── models.py            # Modelos SQLAlchemy
│   │   ├── schemas.py           # Esquemas Pydantic
│   │   ├── routes.py            # Endpoints de la API
│   │   ├── services.py          # Lógica de negocio
│   │   ├── auth.py              # Autenticación y autorización
│   │   ├── bot.py               # Bot Telegram (aiogram)
│   │   └── rma-generador/       # Generador MQTT
│   ├── database.py              # Configuración de BD
│   ├── pyproject.toml           # Dependencias Poetry
│   └── .env.example             # Variables de entorno
├── frontend/
│   ├── src/
│   │   ├── pages/               # Páginas React
│   │   │   └── Investigador/RMA.tsx  # Dashboard principal
│   │   ├── components/          # Componentes reutilizables
│   │   ├── hooks/               # Custom hooks
│   │   ├── types/               # Tipos TypeScript
│   │   ├── css/                 # Estilos globales
│   │   └── AuthContext.tsx      # Contexto de autenticación
│   ├── vite.config.js           # Configuración Vite
│   ├── package.json             # Dependencias npm
│   └── tsconfig.json            # Configuración TypeScript
└── README.md
```

---

## 🚀 Instalación y Configuración

### Requisitos Previos

- **Python 3.10+**
- **Node.js 18+** y npm
- **PostgreSQL 14+**
- **Git**

### Backend

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/UNPSJB/RMA-grupo-2.git
   cd RMA-grupo-2/backend
   ```

2. **Crear entorno virtual e instalar dependencias**
   ```bash
   python -m venv venv
   # En Windows:
   venv\Scripts\activate
   # En Linux/Mac:
   source venv/bin/activate
   
   pip install poetry
   poetry install
   ```

3. **Configurar variables de entorno**
   Crear un archivo `.env` en `backend/`:
   ```env
   DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/rma_db
   SECRET_KEY=your-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   
   # Telegram Bot
   TELEGRAM_BOT_TOKEN=your-bot-token-here
   TELEGRAM_CHANNEL_ID=-100123456789
   
   # MQTT (opcional)
   MQTT_BROKER=localhost
   MQTT_PORT=1883
   ```

4. **Crear base de datos**
   ```bash
   # Conectar a PostgreSQL
   psql -U postgres
   CREATE DATABASE rma_db;
   \q
   ```

5. **Iniciar servidor backend**
   ```bash
   uvicorn src.main:app --reload --port 8000
   ```
   Accesible en: `http://localhost:8000`
   Documentación interactiva: `http://localhost:8000/docs`

### Frontend

1. **Instalar dependencias**
   ```bash
   cd ../frontend
   npm install
   ```

2. **Configurar variables de entorno**
   Crear un archivo `.env.local` en `frontend/`:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

3. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```
   Accesible en: `http://localhost:5173`

4. **Construir para producción**
   ```bash
   npm run build
   ```

---

## 🤖 Bot Telegram

### Configuración

1. **Crear bot con BotFather** en Telegram
   - Guardar el token en `TELEGRAM_BOT_TOKEN`

2. **Obtener ID del canal**
   - Para canales privados: usar el ID numérico con prefijo `-100`
   - Ejemplo: `-100123456789`

3. **Ejecutar el bot**
   ```bash
   cd backend
   python -m src.bot
   ```

### Funcionalidades

- **OTP de Vinculación**: usuario inicia chat, bot genera código de un solo uso
- **Alertas de Alarma**: notificaciones cuando mediciones violan umbrales
- **Chat Privado**: mensajes directos al usuario (si `alarma.chat_id` está configurado)
- **Canal Grupal**: mensajes al canal por defecto (si no hay `chat_id`)

---

## 📊 Endpoints Principales

### Mediciones
- `POST /medicion` - Crear nueva medición
- `GET /mediciones` - Listar mediciones
- `GET /mediciones/{nodo_id}` - Mediciones por nodo

### Alarmas
- `POST /alarma` - Crear alarma
- `GET /alarmas` - Listar alarmas
- `PUT /alarma/{id}` - Actualizar alarma
- `DELETE /alarma/{id}` - Eliminar alarma

### Vinculación Telegram
- `POST /codigo` - Generar OTP para vinculación
- `POST /verificar-token` - Validar OTP y vincular usuario
- `POST /eliminar-vinculacion` - Desvincular usuario

### Autenticación
- `POST /login` - Iniciar sesión
- `POST /registro` - Registrar usuario

---

## 📈 Características Principales

### Dashboard (Investigador)
- **Filtro Global de Nodos**: seleccionar nodo para visualizar datos
- **Gráfico de Temperatura**: último mes de mediciones
- **Gráfico de Altura**: agregación semanal
- **Tabla de Errores**: historial de mediciones erróneas
- **Generación de Reportes PDF**: exportar datos y gráficos

### Gestión de Alarmas
- Crear alarmas para rangos específicos de valores
- Alertas en tiempo real vía Telegram
- Vinculación de usuario a chat privado de Telegram
- Historial de alarmas disparadas

### Visualización
- Gráficos interactivos con ApexCharts
- Tablas con datos filtrados
- Exportación PDF con encabezados y metadatos

---

## 🔐 Autenticación

El sistema usa **JWT (JSON Web Tokens)** para autenticación:

1. Usuario se registra o inicia sesión
2. Backend retorna `access_token`
3. Frontend incluye token en headers: `Authorization: Bearer <token>`
4. Rutas protegidas validan el token

---

## 🧪 Testing

### Backend
```bash
cd backend
# Ejecutar pruebas (si existen)
pytest
```

### Frontend
```bash
cd frontend
npm run test
```

---

## 📝 Variables de Entorno

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/rma_db

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABCDefGHIjklmnoPQRstUVWxyz
TELEGRAM_CHANNEL_ID=-100123456789

# MQTT (si se utiliza)
MQTT_BROKER=localhost
MQTT_PORT=1883
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8000
```

---

## 🐛 Troubleshooting

### "ModuleNotFoundError" al ejecutar bot
```bash
# Asegurarse de estar en la carpeta backend
cd backend
# Usar python -m para ejecutar módulos
python -m src.bot
```

### Base de datos no conecta
- Verificar PostgreSQL esté ejecutándose
- Verificar `DATABASE_URL` en `.env` es correcta
- Crear la base de datos: `CREATE DATABASE rma_db;`

### Telegram no recibe mensajes
- Verificar bot es **admin** del canal (si es grupo)
- Usar ID numérico del canal con prefijo `-100` para canales privados
- Verificar `TELEGRAM_BOT_TOKEN` es válido

### Errores CORS en frontend
- Verificar `VITE_API_URL` apunta al backend correcto
- Backend debe incluir CORS headers

---

## 📚 Documentación Adicional

- **FastAPI Docs**: http://localhost:8000/docs (Swagger UI)
- **React Docs**: https://react.dev
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org
- **Aiogram Docs**: https://aiogram.dev

---

## 🔄 Flujo de Desarrollo

1. **Crear rama**: `git checkout -b feature/nombre-feature`
2. **Realizar cambios** en backend y/o frontend
3. **Testear** localmente
4. **Commit**: `git commit -m "descripción clara del cambio"`
5. **Push**: `git push origin feature/nombre-feature`
6. **Pull Request** para revisión

---

## 📄 Licencia

Este proyecto es parte de la materia **Desarrollo de Software** de la UNPSJB.

---

## 📞 Contacto

Para preguntas o sugerencias, contactar a los integrantes del grupo o abrir un issue en el repositorio.

---

**Última actualización**: Noviembre 2025

