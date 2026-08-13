/**
 * Carga y centraliza toda la configuración leída desde variables de entorno.
 * Ningún token debe escribirse directamente en el código.
 */
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

export const config = {
  // --- Identidad del bot ---
  botName: process.env.BOT_NAME || 'Kaory Bot',
  version: process.env.BOT_VERSION || '1.0.0',

  // --- Claves obligatorias ---
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',

  // --- Claves opcionales (el bot arranca sin ellas, sólo se desactivan comandos) ---
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  openaiImageModel: process.env.OPENAI_IMAGE_MODEL || 'dall-e-3',
  weatherApiKey: process.env.WEATHER_API_KEY || '',

  // --- Comportamiento ---
  echoEnabled: String(process.env.ECHO_ENABLED).toLowerCase() === 'true',
  recordatorioMs: Number(process.env.REMINDER_DELAY_MS || 10000),
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 48),
  maxVideoDuracion: Number(process.env.MAX_VIDEO_SECONDS || 900),

  // --- Depuración ---
  mostrarQr: String(process.env.SHOW_QR).toLowerCase() === 'true',
  logLevel: process.env.LOG_LEVEL || 'info',
  logJson: String(process.env.LOG_JSON).toLowerCase() === 'true'
};

/**
 * Comprueba las variables imprescindibles y avisa de las opcionales que falten.
 * Termina el proceso si falta el token de Telegram (sin él no hay bot posible).
 */
export function validarConfig() {
  if (!config.telegramToken) {
    logger.error('Falta TELEGRAM_BOT_TOKEN en las variables de entorno.');
    logger.error('Consíguelo en Telegram hablando con @BotFather y añádelo a tu archivo .env');
    process.exit(1);
  }

  if (!config.openaiApiKey) {
    logger.warn('OPENAI_API_KEY no definida: /ai, /imagen y /traducir quedarán desactivados.');
  }
  if (!config.weatherApiKey) {
    logger.warn('WEATHER_API_KEY no definida: /clima quedará desactivado.');
  }

  logger.info(`Modo eco de texto sin comando: ${config.echoEnabled ? 'ACTIVADO' : 'desactivado'}`);
}
