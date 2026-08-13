/**
 * Punto de entrada principal del bot.
 * Se encarga de: validar configuración, cargar comandos, arrancar el bot
 * y registrar los manejadores de eventos.
 */
import qrcode from 'qrcode-terminal';

import { config, validarConfig } from './src/config.js';
import { crearBot } from './src/bot.js';
import { cargarComandos, comandosUnicos } from './src/loader.js';
import { registrarManejadores } from './src/handlers.js';
import { logger } from './utils/logger.js';

// Estado global compartido con todos los comandos (uptime, comandos cargados, etc.)
const estado = {
  iniciadoEn: Date.now(),
  comandos: null,
  me: null,
  bot: null
};

async function main() {
  logger.banner(`${config.botName} v${config.version}`);

  // 1. Validamos que existan las variables de entorno obligatorias
  validarConfig();

  // 2. Cargamos dinámicamente todos los comandos de /commands
  const comandos = await cargarComandos();
  estado.comandos = comandos;
  logger.success(`${comandosUnicos(comandos).length} comandos cargados correctamente`);

  // 3. Creamos la instancia del bot (polling)
  const bot = crearBot();
  estado.bot = bot;

  // 4. Obtenemos los datos del propio bot (necesario para comandos tipo /ai@MiBot)
  const me = await bot.getMe();
  estado.me = me;

  // 5. Registramos los listeners de mensajes
  registrarManejadores({ bot, comandos, estado });

  // 6. Publicamos el menú de comandos dentro de Telegram (el botón "/" del chat)
  try {
    await bot.setMyCommands(
      comandosUnicos(comandos).map((c) => ({
        command: c.name,
        description: (c.description || 'Sin descripción').slice(0, 256)
      }))
    );
    logger.info('Menú de comandos publicado en Telegram');
  } catch (error) {
    logger.warn(`No se pudo publicar el menú de comandos: ${error.message}`);
  }

  // 7. QR opcional de depuración con el enlace directo al bot
  if (config.mostrarQr) {
    logger.info(`Enlace del bot: [t.me](https://t.me/${me.username})`);
    qrcode.generate(`[t.me](https://t.me/${me.username})`, { small: true });
  }

  logger.success(`Bot conectado como @${me.username} (id: ${me.id})`);
  logger.info('Escuchando mensajes vía long polling...');
}

/** Cierre ordenado: detiene el polling para no dejar sesiones colgadas (error 409). */
function apagar(senal) {
  logger.warn(`Señal ${senal} recibida. Cerrando el bot...`);
  const cierre = estado.bot ? estado.bot.stopPolling({ cancel: true }) : Promise.resolve();
  cierre
    .catch(() => {})
    .finally(() => {
      logger.info('Polling detenido. Adiós 👋');
      process.exit(0);
    });
}

process.on('SIGINT', () => apagar('SIGINT'));
process.on('SIGTERM', () => apagar('SIGTERM'));

// Evitamos que una promesa rechazada tumbe el proceso en producción
process.on('unhandledRejection', (razon) => {
  logger.error(`Promesa no gestionada: ${razon?.message || razon}`);
});
process.on('uncaughtException', (error) => {
  logger.error(`Excepción no capturada: ${error.message}`);
});

main().catch((error) => {
  logger.error(`Fallo crítico al iniciar: ${error.message}`);
  process.exit(1);
});