/** Generación de imágenes con DALL·E 3. */
import { obtenerOpenAI, hayOpenAI, AVISO_SIN_OPENAI } from '../src/openai.js';
import { config } from '../src/config.js';
import { logger } from '../utils/logger.js';
import { descargarBuffer, truncar } from '../utils/helpers.js';

export default {
  name: 'imagen',
  aliases: ['img', 'dalle'],
  description: 'Genera una imagen con DALL·E 3',
  usage: '/imagen un gato astronauta en acuarela',

  async execute({ bot, chatId, msg, texto }) {
    if (!hayOpenAI()) {
      await bot.sendMessage(chatId, AVISO_SIN_OPENAI);
      return;
    }

    if (!texto) {
      await bot.sendMessage(chatId, '🎨 Describe la imagen que quieres.\nEjemplo: <code>/imagen un faro al atardecer</code>', {
        parse_mode: 'HTML'
      });
      return;
    }

    let aviso;
    try {
      aviso = await bot.sendMessage(chatId, '🎨 Generando tu imagen, esto tarda unos segundos...');
      await bot.sendChatAction(chatId, 'upload_photo');

      const openai = obtenerOpenAI();
      const resultado = await openai.images.generate({
        model: config.openaiImageModel,
        prompt: texto,
        n: 1,
        size: '1024x1024',
        quality: 'standard'
      });

      const url = resultado.data?.[0]?.url;
      if (!url) throw new Error('La API no devolvió ninguna imagen');

      // Descargamos el archivo: las URLs de DALL·E caducan rápido y Telegram
      // a veces no llega a tiempo si le pasamos sólo el enlace.
      const buffer = await descargarBuffer(url);

      await bot.sendPhoto(
        chatId,
        buffer,
        { caption: `🖼 ${truncar(texto, 900)}`, reply_to_message_id: msg.message_id },
        { filename: 'imagen.png', contentType: 'image/png' }
      );
    } catch (error) {
      logger.error(`/imagen falló: ${error.message}`);
      const rechazado = /safety|content policy|rejected/i.test(error.message);
      await bot.sendMessage(
        chatId,
        rechazado
          ? '🚫 Esa descripción fue rechazada por las políticas de contenido de OpenAI. Prueba con otra idea.'
          : '❌ No pude generar la imagen. Inténtalo de nuevo con otra descripción.'
      );
    } finally {
      if (aviso) await bot.deleteMessage(chatId, aviso.message_id).catch(() => {});
    }
  }
};