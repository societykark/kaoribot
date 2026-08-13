/** Ayuda detallada: muestra descripción y ejemplo de uso de cada comando. */
import { comandosUnicos } from '../src/loader.js';
import { escaparHtml, responderLargo } from '../utils/helpers.js';

export default {
  name: 'help',
  aliases: ['ayuda'],
  description: 'Muestra la ayuda de todos los comandos',
  usage: '/help  |  /help ai',

  async execute({ bot, chatId, comandos, texto }) {
    try {
      await bot.sendChatAction(chatId, 'typing');

      // Ayuda de un comando concreto: /help ai
      if (texto) {
        const buscado = comandos.get(texto.replace('/', '').toLowerCase());
        if (!buscado) {
          await bot.sendMessage(chatId, `❓ No existe el comando <b>${escaparHtml(texto)}</b>.`, {
            parse_mode: 'HTML'
          });
          return;
        }
        await bot.sendMessage(
          chatId,
          `<b>/${buscado.name}</b>\n\n` +
            `${escaparHtml(buscado.description || 'Sin descripción')}\n\n` +
            `<b>Uso:</b>\n<code>${escaparHtml(buscado.usage || `/${buscado.name}`)}</code>`,
          { parse_mode: 'HTML' }
        );
        return;
      }

      // Ayuda general
      const bloques = comandosUnicos(comandos)
        .map(
          (c) =>
            `<b>/${c.name}</b> — ${escaparHtml(c.description || '')}\n` +
            `   <code>${escaparHtml(c.usage || `/${c.name}`)}</code>`
        )
        .join('\n\n');

      await responderLargo(
        bot,
        chatId,
        `<b>📖 Guía rápida de comandos</b>\n\n${bloques}\n\n` +
          `ℹ️ Usa <code>/help nombre</code> para ver un comando en detalle.`,
        { parse_mode: 'HTML', disable_web_page_preview: true }
      );
    } catch (error) {
      await bot.sendMessage(chatId, '❌ No pude generar la ayuda. Intenta de nuevo.');
    }
  }
};