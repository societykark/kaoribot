/** Mensaje de bienvenida con la lista completa de comandos disponibles. */
import { comandosUnicos } from '../src/loader.js';
import { config } from '../src/config.js';
import { escaparHtml } from '../utils/helpers.js';

export default {
  name: 'start',
  description: 'Mensaje de bienvenida y lista de comandos',
  usage: '/start',

  async execute({ bot, chatId, msg, comandos }) {
    try {
      await bot.sendChatAction(chatId, 'typing');

      const nombre = escaparHtml(msg.from?.first_name || 'humano');
      const lista = comandosUnicos(comandos)
        .map((c) => `• <b>/${c.name}</b> — ${escaparHtml(c.description || '')}`)
        .join('\n');

      const mensaje =
        `👋 <b>¡Hola, ${nombre}!</b>\n\n` +
        `Soy <b>${escaparHtml(config.botName)}</b> v${config.version}, tu asistente multiusos en Telegram.\n\n` +
        `<b>📋 Comandos disponibles</b>\n${lista}\n\n` +
        `💡 Escribe <code>/help</code> para ver ejemplos de uso de cada comando.`;

      await bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML', disable_web_page_preview: true });
    } catch (error) {
      await bot.sendMessage(chatId, '❌ No pude mostrar el mensaje de bienvenida. Intenta de nuevo.');
    }
  }
};