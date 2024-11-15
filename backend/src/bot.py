from aiogram import Bot, Dispatcher
import logging

API_TOKEN = '7609847784:AAFmy1uIAsqlUovuGaThPD8oiZPk528srSI'
CHANNEL_ID = '@RMAgrupo2'

bot = Bot(token=API_TOKEN)
dp = Dispatcher(bot=bot)

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    level=logging.INFO)
logger = logging.getLogger(__name__)

# Función para enviar un mensaje al canal
async def send_alarm_to_channel(message: str):
    try:
        await bot.send_message(chat_id=CHANNEL_ID, text=message, parse_mode="Markdown")
        logger.info(f"Mensaje enviado al canal: {message}")
    except Exception as e:
        logger.error(f"Error enviando el mensaje al canal: {e}")

async def start_bot():
    try:
        await send_alarm_to_channel("¡El bot está listo y funcionando!")

        from aiogram import executor
        await executor.start_polling(dp, skip_updates=True)
    except Exception as e:
        logger.error(f"Error iniciando el bot: {e}")
