/** Información técnica del bot: versión, entorno, memoria y comandos cargados. */
import os from 'node:os';

import { comandosUnicos } from '../src/loader.js';
import { config } from '../src/config.js';
import { formatearUptime, formatearBytes, escaparHtml } from '../utils/helpers.js';

export default {
  name: 'info',
  description: 'Información técnica del bot',
  usage: '/info',

  async execute({ bot, chatId, comandos, estado }) {
    try {
      await bot.sendChatAction(chatId, 'typing');

      const uptime = formatearUptime((Date.now() - estado.iniciadoEn) / 1000);
      const memoria = process.memoryUsage();
      const total = comandosUnicos(comandos).length;

      const mensaje =
        `🤖 <b>${escaparHtml(config.botName)}</b>\n\n` +
        `<b>📌 General</b>\n` +
        `• Usuario: @${escaparHtml(estado.me.username)}\n` +
        `• Versión: ${config.version}\n` +
        `• Comandos cargados: ${total}\n` +
        `• Modo: long polling\n\n` +
        `<b>⚙️ Entorno</b>\n` +
        `• Node.js: ${process.version}\n` +
        `• Plataforma: ${process.platform} (${process.arch})\n` +
        `• CPUs: ${os.cpus().length}\n\n` +
        `<b>📊 Recursos</b>\n` +
        `• Uptime: ${uptime}\n` +
        `• Memoria usada: ${formatearBytes(memoria.rss)}\n` +
        `• Heap: ${formatearBytes(memoria.heapUsed)} / ${formatearBytes(memoria.heapTotal)}\n\n` +
        `<b>🔌 Integraciones</b>\n` +
        `• OpenAI: ${config.openaiApiKey ? `✅ ${config.openaiModel}` : '❌ no configurada'}\n` +
        `• WeatherAPI: ${config.weatherApiKey ? '✅ activa' : '❌ no configurada'}\n` +
        `• Eco de texto: ${config.echoEnabled ? '✅' : '❌'}`;

      await bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
    } catch (error) {
      await bot.sendMessage(chatId, '❌ No pude recopilar la información del bot.');
    }
  }
};