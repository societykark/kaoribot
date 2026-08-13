/** Consulta del clima actual usando WeatherAPI.com. */
import axios from 'axios';

import { config } from '../src/config.js';
import { logger } from '../utils/logger.js';
import { escaparHtml } from '../utils/helpers.js';

export default {
  name: 'clima',
  aliases: ['tiempo', 'weather'],
  description: 'Clima actual de una ciudad',
  usage: '/clima Madrid',

  async execute({ bot, chatId, texto }) {
    if (!config.weatherApiKey) {
      await bot.sendMessage(
        chatId,
        '🔑 Este comando necesita una clave gratuita de WeatherAPI.\nRegístrate en weatherapi.com y añade WEATHER_API_KEY al .env'
      );
      return;
    }

    if (!texto) {
      await bot.sendMessage(chatId, '🌍 Indica una ciudad.\nEjemplo: <code>/clima Buenos Aires</code>', {
        parse_mode: 'HTML'
      });
      return;
    }

    try {
      await bot.sendChatAction(chatId, 'typing');

      const { data } = await axios.get('[api.weatherapi.com](https://api.weatherapi.com/v1/current.json)', {
        params: { key: config.weatherApiKey, q: texto, lang: 'es', aqi: 'no' },
        timeout: 15_000
      });

      const { location: lugar, current: actual } = data;

      const mensaje =
        `🌤 <b>Clima en ${escaparHtml(lugar.name)}, ${escaparHtml(lugar.country)}</b>\n\n` +
        `${escaparHtml(actual.condition.text)}\n\n` +
        `🌡 <b>Temperatura:</b> ${actual.temp_c} °C (sensación ${actual.feelslike_c} °C)\n` +
        `💧 <b>Humedad:</b> ${actual.humidity} %\n` +
        `💨 <b>Viento:</b> ${actual.wind_kph} km/h ${escaparHtml(actual.wind_dir)}\n` +
        `☁️ <b>Nubosidad:</b> ${actual.cloud} %\n` +
        `🔆 <b>Índice UV:</b> ${actual.uv}\n` +
        `👁 <b>Visibilidad:</b> ${actual.vis_km} km\n\n` +
        `🕒 Hora local: ${escaparHtml(lugar.localtime)}`;

      await bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
    } catch (error) {
      logger.error(`/clima falló: ${error.message}`);
      if (error.response?.status === 400) {
        await bot.sendMessage(chatId, `🔍 No encontré la ciudad "${escaparHtml(texto)}". Revisa el nombre.`, {
          parse_mode: 'HTML'
        });
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        await bot.sendMessage(chatId, '🔑 La clave de WeatherAPI no es válida o ha caducado.');
      } else {
        await bot.sendMessage(chatId, '❌ No pude consultar el clima ahora mismo. Intenta más tarde.');
      }
    }
  }
};