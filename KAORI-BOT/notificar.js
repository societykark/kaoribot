/**
 * Recordatorio simple en memoria.
 * IMPORTANTE: los recordatorios se pierden si el bot se reinicia (Railway reinicia
 * el contenedor en cada despliegue). Para persistencia real haría falta una base de datos.
 */
import { config } from '../src/config.js';
import { logger } from '../utils/logger.js';
import { escaparHtml, truncar } from '../utils/helpers.js';

// Mapa en memoria: chatId -> array de recordatorios pendientes
const recordatorios = new Map();

export default {
  name: 'notificar',
  aliases: ['recordar', 'remind'],
  description: 'Te reenvía un mensaje pasados unos segundos',
  usage: '/notificar sacar la pizza del horno',

  async execute({ bot, chatId, msg, texto }) {
    // Sin argumentos: mostramos los recordatorios pendientes
    if (!texto) {
      const pendientes = recordatorios.get(chatId) ?? [];
      if (pendientes.length === 0) {
        await bot.sendMessage(
          chatId,
          `⏰ Escribe qué quieres recordar.\nEjemplo: <code>/notificar llamar a mamá</code>\n\n` +
            `Te lo reenviaré en ${Math.round(config.recordatorioMs / 1000)} segundos.`,
          { parse_mode: 'HTML' }
        );
        return;
      }
      const lista = pendientes.map((r, i) => `${i + 1}. ${escaparHtml(truncar(r.mensaje, 60))}`).join('\n');
      await bot.sendMessage(chatId, `⏰ <b>Recordatorios pendientes (${pendientes.length})</b>\n\n${lista}`, {
        parse_mode: 'HTML'
      });
      return;
    }

    try {
      const segundos = Math.round(config.recordatorioMs / 1000);
      const registro = { mensaje: texto, creadoEn: Date.now() };

      if (!recordatorios.has(chatId)) recordatorios.set(chatId, []);
      recordatorios.get(chatId).push(registro);

      await bot.sendMessage(
        chatId,
        `✅ Anotado. Te lo recordaré en <b>${segundos} segundos</b>.`,
        { parse_mode: 'HTML', reply_to_message_id: msg.message_id }
      );

      // Programamos el envío diferido
      const temporizador = setTimeout(async () => {
        try {
          await bot.sendMessage(chatId, `🔔 <b>Recordatorio</b>\n\n${escaparHtml(texto)}`, { parse_mode: 'HTML' });
        } catch (error) {
          logger.warn(`No pude entregar el recordatorio a ${chatId}: ${error.message}`);
        } finally {
          // Limpiamos el registro del mapa
          const lista = recordatorios.get(chatId) ?? [];
          const indice = lista.indexOf(registro);
          if (indice !== -1) lista.splice(indice, 1);
          if (lista.length === 0) recordatorios.delete(chatId);
        }
      }, config.recordatorioMs);

      // unref evita que el temporizador impida cerrar el proceso limpiamente
      temporizador.unref?.();
      registro.temporizador = temporizador;
    } catch (error) {
      logger.error(`/notificar falló: ${error.message}`);
      await bot.sendMessage(chatId, '❌ No pude programar ese recordatorio.');
    }
  }
};