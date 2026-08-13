/** Estado de salud del bot: conexión, latencia y tiempo activo. */
import { comandosUnicos } from '../src/loader.js';
import { formatearUptime, formatearBytes } from '../utils/helpers.js';

export default {
  name: 'status',
  aliases: ['estado'],
  description: 'Estado de salud y conexión del bot',
  usage: '/status',

  async execute({ bot, chatId, comandos, estado }) {
    try {
      await bot.sendChatAction(chatId, 'typing');

      // Comprobamos la conexión real midiendo una llamada a la API
      const inicio = Date.now();
      let conectado = true;
      try {
        await bot.getMe();
      } catch {
        conectado = false;
      }
      const latencia = Date.now() - inicio;

      const salud = !conectado ? '🔴 Sin conexión' : latencia < 400 ? '🟢 Excelente' : latencia < 1200 ? '🟡 Aceptable' : '🟠 Lenta';

      const mensaje =
        `📡 <b>Estado del bot</b>\n\n` +
        `• Conexión: ${conectado ? '✅ conectado' : '❌ desconectado'}\n` +
        `• Salud: ${salud} (${latencia} ms)\n` +
        `• Polling activo: ${bot.isPolling() ? '✅ sí' : '❌ no'}\n` +
        `• Uptime: ${formatearUptime((Date.now() - estado.iniciadoEn) / 1000)}\n` +
        `• Comandos cargados: ${comandosUnicos(comandos).length}\n` +
        `• Memoria: ${formatearBytes(process.memoryUsage().rss)}\n` +
        `• PID: ${process.pid}`;

      await bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
    } catch (error) {
      await bot.sendMessage(chatId, '❌ No pude obtener el estado del bot.');
    }
  }
};