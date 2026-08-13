/** Traducción automática con detección de idioma mediante OpenAI. */
import { obtenerOpenAI, hayOpenAI, AVISO_SIN_OPENAI } from '../src/openai.js';
import { config } from '../src/config.js';
import { logger } from '../utils/logger.js';
import { responderLargo } from '../utils/helpers.js';

export default {
  name: 'traducir',
  aliases: ['tr', 'translate'],
  description: 'Traduce un texto al español (detecta el idioma automáticamente)',
  usage: '/traducir Hello, how are you?',

  async execute({ bot, chatId, msg, texto }) {
    if (!hayOpenAI()) {
      await bot.sendMessage(chatId, AVISO_SIN_OPENAI);
      return;
    }

    // También funciona respondiendo a un mensaje: /traducir sin argumentos
    const original = texto || msg.reply_to_message?.text || msg.reply_to_message?.caption || '';
    if (!original) {
      await bot.sendMessage(
        chatId,
        '🌐 Escribe el texto a traducir o responde a un mensaje con <code>/traducir</code>.',
        { parse_mode: 'HTML' }
      );
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
              'Eres un traductor profesional. Detecta el idioma del texto del usuario y tradúcelo al español neutro. ' +
              'Si el texto YA está en español, tradúcelo al inglés. ' +
              'Responde EXACTAMENTE con este formato y nada más:\n' +
              'Idioma detectado: <idioma>\n\n<traducción>'
          },
          { role: 'user', content: original }
        ],
        temperature: 0.2,
        max_tokens: 900
      });

      const contenido = respuesta.choices?.[0]?.message?.content?.trim();
      if (!contenido) throw new Error('Respuesta vacía del modelo');

      await responderLargo(bot, chatId, `🌐 ${contenido}`, { reply_to_message_id: msg.message_id });
    } catch (error) {
      logger.error(`/traducir falló: ${error.message}`);
      await bot.sendMessage(chatId, '❌ No pude traducir ese texto. Inténtalo de nuevo.');
    }
  }
};