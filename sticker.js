/**
 * Convierte una imagen en sticker.
 * Telegram sólo acepta .webp en sendSticker, así que usamos sharp para convertir.
 * Uso: responde con /sticker a una foto (o envía la foto con /sticker como pie).
 */
import sharp from 'sharp';

import { logger } from '../utils/logger.js';

/** Extrae el file_id de la mejor imagen disponible en un mensaje. */
function obtenerFileId(mensaje) {
  if (!mensaje) return null;
  if (mensaje.photo?.length) return mensaje.photo[mensaje.photo.length - 1].file_id; // la mayor resolución
  if (mensaje.sticker && !mensaje.sticker.is_animated && !mensaje.sticker.is_video) return mensaje.sticker.file_id;
  if (mensaje.document?.mime_type?.startsWith('image/')) return mensaje.document.file_id;
  return null;
}

export default {
  name: 'sticker',
  aliases: ['s'],
  description: 'Convierte una imagen en sticker (responde a la foto)',
  usage: 'Responde a una foto con /sticker',

  async execute({ bot, chatId, msg }) {
    // Buscamos la imagen en el propio mensaje o en el mensaje respondido
    const fileId = obtenerFileId(msg) || obtenerFileId(msg.reply_to_message);

    if (!fileId) {
      // Aviso explícito si intenta convertir un vídeo
      const esVideo = msg.video || msg.reply_to_message?.video || msg.reply_to_message?.animation;
      await bot.sendMessage(
        chatId,
        esVideo
          ? '🎥 Los stickers animados requieren conversión de vídeo con ffmpeg, que no está incluida.\nPor ahora sólo convierto imágenes.'
          : '🖼 Responde a una foto con <code>/sticker</code>, o envía la foto poniendo <code>/sticker</code> como pie de imagen.',
        { parse_mode: 'HTML' }
      );
      return;
    }

    try {
      await bot.sendChatAction(chatId, 'upload_photo');

      // 1. Descargamos el archivo desde Telegram como stream
      const flujo = bot.getFileStream(fileId);
      const trozos = [];
      for await (const trozo of flujo) trozos.push(trozo);
      const original = Buffer.concat(trozos);

      // 2. Convertimos a WebP 512x512 con fondo transparente (formato oficial de sticker)
      const webp = await sharp(original)
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 90 })
        .toBuffer();

      // 3. Enviamos el sticker
      await bot.sendSticker(
        chatId,
        webp,
        { reply_to_message_id: msg.message_id },
        { filename: 'sticker.webp', contentType: 'image/webp' }
      );
    } catch (error) {
      logger.error(`/sticker falló: ${error.message}`);
      await bot.sendMessage(chatId, '❌ No pude convertir esa imagen en sticker. Prueba con otra foto.');
    }
  }
};