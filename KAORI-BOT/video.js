/**
 * Descarga un vídeo de YouTube (por URL o por búsqueda) y lo envía al chat.
 * Nota: los bots de Telegram sólo pueden subir archivos de hasta 50 MB.
 */
import { createWriteStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import os from 'node:os';
import path from 'node:path';

import ytdl from '@distube/ytdl-core';
import ytSearch from 'yt-search';

import { config } from '../src/config.js';
import { logger } from '../utils/logger.js';
import { esUrlYoutube, formatearDuracion, formatearBytes, limpiarArchivo, escaparHtml } from '../utils/helpers.js';

export default {
  name: 'video',
  aliases: ['yt'],
  description: 'Descarga un vídeo de YouTube por URL o búsqueda',
  usage: '/video lofi hip hop  |  /video [youtu.be](https://youtu.be/xxxx)',

  async execute({ bot, chatId, msg, texto }) {
    if (!texto) {
      await bot.sendMessage(chatId, '🎬 Escribe una búsqueda o pega una URL de YouTube.\nEjemplo: <code>/video coldplay yellow</code>', {
        parse_mode: 'HTML'
      });
      return;
    }

    let aviso;
    let rutaTemporal;

    try {
      aviso = await bot.sendMessage(chatId, '🔎 Buscando el vídeo...');
      await bot.sendChatAction(chatId, 'upload_video');

      // 1. Resolvemos la URL (búsqueda o enlace directo)
      let url = texto.trim();
      if (!esUrlYoutube(url)) {
        const resultados = await ytSearch(url);
        const primero = resultados.videos?.[0];
        if (!primero) {
          await bot.editMessageText('🔍 No encontré ningún vídeo con esa búsqueda.', {
            chat_id: chatId,
            message_id: aviso.message_id
          });
          return;
        }
        url = primero.url;
      }

      // 2. Obtenemos la información del vídeo
      const info = await ytdl.getInfo(url);
      const detalles = info.videoDetails;
      const duracion = Number(detalles.lengthSeconds);

      if (duracion > config.maxVideoDuracion) {
        await bot.editMessageText(
          `⏱ El vídeo dura ${formatearDuracion(duracion)} y el límite es ${formatearDuracion(config.maxVideoDuracion)}.\n\n${url}`,
          { chat_id: chatId, message_id: aviso.message_id }
        );
        return;
      }

      // 3. Elegimos un formato MP4 con vídeo + audio (compatible con Telegram)
      const formato =
        ytdl.chooseFormat(info.formats, { quality: '18' }) ||
        ytdl.chooseFormat(info.formats, { filter: (f) => f.hasVideo && f.hasAudio && f.container === 'mp4' });

      if (!formato) throw new Error('No hay ningún formato mp4 combinado disponible');

      const tamanoEstimado = Number(formato.contentLength || 0);
      const limiteBytes = config.maxFileSizeMb * 1024 * 1024;
      if (tamanoEstimado && tamanoEstimado > limiteBytes) {
        await bot.editMessageText(
          `📦 El vídeo pesa ${formatearBytes(tamanoEstimado)} y Telegram sólo permite ${config.maxFileSizeMb} MB para bots.\n\n` +
            `Míralo aquí: ${url}`,
          { chat_id: chatId, message_id: aviso.message_id, disable_web_page_preview: false }
        );
        return;
      }

      // 4. Descargamos a un archivo temporal
      await bot.editMessageText(`⬇️ Descargando: ${detalles.title}`, {
        chat_id: chatId,
        message_id: aviso.message_id
      });

      rutaTemporal = path.join(os.tmpdir(), `video_${Date.now()}.mp4`);
      await pipeline(ytdl.downloadFromInfo(info, { format: formato }), createWriteStream(rutaTemporal));

      const { size } = await stat(rutaTemporal);
      if (size > limiteBytes) {
        await bot.editMessageText(
          `📦 El archivo final pesa ${formatearBytes(size)}, por encima del límite de Telegram.\n\n${url}`,
          { chat_id: chatId, message_id: aviso.message_id }
        );
        return;
      }

      // 5. Enviamos el vídeo
      await bot.editMessageText('⬆️ Subiendo a Telegram...', { chat_id: chatId, message_id: aviso.message_id });
      await bot.sendChatAction(chatId, 'upload_video');

      await bot.sendVideo(
        chatId,
        rutaTemporal,
        {
          caption:
            `🎬 <b>${escaparHtml(detalles.title)}</b>\n` +
            `👤 ${escaparHtml(detalles.author?.name || 'Desconocido')}\n` +
            `⏱ ${formatearDuracion(duracion)} · 📦 ${formatearBytes(size)}`,
          parse_mode: 'HTML',
          duration: duracion,
          reply_to_message_id: msg.message_id,
          supports_streaming: true
        },
        { filename: 'video.mp4', contentType: 'video/mp4' }
      );
    } catch (error) {
      logger.error(`/video falló: ${error.message}`);
      await bot.sendMessage(
        chatId,
        '❌ No pude descargar ese vídeo.\n\nPosibles causas: el vídeo es privado o con restricción de edad, ' +
          'o YouTube cambió su sistema de descarga. Prueba con otro enlace.'
      );
    } finally {
      if (aviso) await bot.deleteMessage(chatId, aviso.message_id).catch(() => {});
      if (rutaTemporal) await limpiarArchivo(rutaTemporal);
    }
  }
};