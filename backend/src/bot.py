from aiogram import Bot, Dispatcher, html
from aiogram.types import Message
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart
from backend.src.models import TokenAlarma
from backend.database import SessionLocal
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
import pyotp, sys, logging, asyncio, os
from dotenv import load_dotenv

load_dotenv()

API_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
CHANNEL_ID = os.getenv('TELEGRAM_CHANNEL_ID')

if not API_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN no está configurado en el archivo .env")
if not CHANNEL_ID:
    raise ValueError("TELEGRAM_CHANNEL_ID no está configurado en el archivo .env")

bot = Bot(token=API_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp = Dispatcher(bot=bot)

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    level=logging.INFO)
logger = logging.getLogger(__name__)

from aiogram.exceptions import TelegramRetryAfter

async def send_alarm_to_channel(message: str, chat_id: str):
    # Se instancia un nuevo objeto Bot aquí para asegurar que la sesión
    # se maneja correctamente dentro del loop de eventos del proceso que llama (el subscriptor MQTT).
    bot_sender = Bot(token=API_TOKEN)
    try:
        await bot_sender.send_message(chat_id=chat_id, text=message, parse_mode="Markdown")
        logger.info(f"Mensaje de alarma enviado al chat_id {chat_id}")
    except TelegramRetryAfter as e:
        logger.warning(f"Límite de flood excedido. Reintentando en {e.retry_after} segundos...")
        await asyncio.sleep(e.retry_after)
        await send_alarm_to_channel(message, chat_id) # Reintento recursivo
    except Exception as e:
        logger.error(f"Error enviando el mensaje de alarma al chat_id {chat_id}: {e}")
    finally:
        # Es crucial cerrar la sesión del bot para liberar recursos.
        await bot_sender.session.close()

@dp.message(CommandStart())
async def command_start_handler(message: Message) -> None:
    await message.answer(f"Hola, {html.bold(message.from_user.full_name)}!, usa /codigo para generar tu token.")

@dp.message(Command(commands=["codigo"]))
async def generate_code_handler(message: Message, db: AsyncSession = None) -> None:
    chat_id = str(message.from_user.id)
    async with SessionLocal() as db:
        async with db.begin():
            result = await db.execute(select(TokenAlarma).filter(TokenAlarma.chat_id == chat_id))
            token_data = result.scalar_one_or_none()

        if token_data:
            secret = token_data.secret
        else:
            secret = pyotp.random_base32()
            token_data = TokenAlarma(chat_id=chat_id, secret=secret)
            db.add(token_data)

        totp = pyotp.TOTP(secret, interval=60)
        otp = totp.now()

        token_data.otp = otp
        await db.commit()
        await db.refresh(token_data)

        await message.answer(
            f"Tu código de verificación es: {html.bold(otp)}\n"
            f"Ingresa este código en nuestra página web para vincular tu cuenta.\n"
            f"El código es válido por 60 segundos."
        )

async def main() -> None:
    try:
        await dp.start_polling(bot, skip_updates=True)
    except Exception as e:
        logger.error(f"Error iniciando el bot: {e}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, stream=sys.stdout)
    asyncio.run(main())
