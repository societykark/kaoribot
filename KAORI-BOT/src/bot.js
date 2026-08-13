/**
 * Creación y configuración de la instancia de node-telegram-bot-api.
 * Usamos long polling (no webhooks) para simplificar el despliegue en Railway:
 * así no necesitamos exponer ningún puerto HTTP.
 */
import TelegramBot from 'node-telegram-bot-api';

import { config } from './config.js';
import { logger } from '../utils/logger.js';

export function crearBot() {
  const bot = new TelegramBot(config.telegramToken, {
    polling: {
      interval: 300,           // ms entre peticiones
      autoStart: true,
      params: { timeout: 30 }  // long polling de 30s (menos peticiones, menos consumo)
    },
    // Evita que la librería intente cancelar promesas con librerías externas
    filepath: false
  });

  // Errores de polling: el más típico es el 409 (dos instancias con el mismo token)
  bot.on('polling_error', (error) => {
    const mensaje = error?.message || String(error);
    if (mensaje.includes('409')) {
      logger.error('Conflicto 409: hay OTRA instancia del bot corriendo con el mismo token.');
      logger.error('Detén el bot local o elimina el despliegue duplicado en Railway.');
    } else if (mensaje.includes('401')) {
      logger.error('Token inválido (401). Revisa TELEGRAM_BOT_TOKEN.');
    } else {
      logger.warn(`Error de polling: ${mensaje}`);
    }
  });

  bot.on('webhook_error', (error) => logger.warn(`Error de webhook: ${error.message}`));
  bot.on('error', (error) => logger.error(`Error general del bot: ${error.message}`));

  return bot;
}
