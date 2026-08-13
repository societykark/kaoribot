/** Conversación con ChatGPT mediante la API de OpenAI. */
import { obtenerOpenAI, hayOpenAI, AVISO_SIN_OPENAI } from '../src/openai.js';
import { config } from '../src/config.js';
import { logger } from '../utils/logger.js';
import { responderLargo } from '../utils/helpers.js';

export default {
  name: 'ai',
  aliases: ['gpt', 'chat'],
  description: 'Pregúntale cualquier cosa a ChatGPT',
  usage: '/ai explícame la relatividad en 3 líneas',

  async execute({ bot, chatId, msg, texto }) {
    if (!hayOpenAI()) {
      await bot.sendMessage(chatId, AVISO_SIN_OPENAI);
      return;
    }

    // Permite usar el comando respondiendo a otro mensaje
    const pregunta = texto || msg.reply_to_message?.text || '';
    if (!pregunta) {
      await bot.sendMessage(chatId, '✏️ Escribe tu pregunta.\nEjemplo: <code>/ai ¿qué es un agujero negro?</code>', {
        parse_mode: 'HTML'
      });
      return;
    }

    try {
      await bot.sendChatAction(chatId, 'typing');

      const openai = obtenerOpenAI();
      const respuesta = await openai.chat.completions.create({
        model: config.openaiModel,
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente útil, directo y conciso dentro de un bot de Telegram. ' +
              'Responde en el idioma del usuario. Evita el formato Markdown complejo: usa texto plano y emojis con moderación.'
          },
          { role: 'user', content: pregunta }
        ],
        max_tokens: 900,
        temperature: 0.7
      });

      const contenido = respuesta.choices?.[0]?.message?.content?.trim();
      if (!contenido) {
        await bot.sendMessage(chatId, '🤔 El modelo no devolvió respuesta. Reformula la pregunta.');
        return;
      }

      await responderLargo(bot, chatId, contenido, { reply_to_message_id: msg.message_id });
    } catch (error) {
      logger.error(`/ai falló: ${error.message}`);
      const esCuota = error.status === 429 || /quota|rate limit/i.test(error.message);
      await bot.sendMessage(
        chatId,
        esCuota
          ? '⏳ Se alcanzó el límite de peticiones de OpenAI. Espera un momento e inténtalo de nuevo.'
          : '❌ No pude contactar con ChatGPT ahora mismo. Prueba en unos segundos.'
      );
    }
  }
};