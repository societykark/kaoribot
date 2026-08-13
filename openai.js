/**
 * Cliente único (singleton) de OpenAI.
 * Se crea de forma perezosa para que el bot pueda arrancar aunque no haya API key.
 */
import OpenAI from 'openai';

import { config } from './config.js';

let cliente = null;

/** ¿Está configurada la API de OpenAI? */
export function hayOpenAI() {
  return Boolean(config.openaiApiKey);
}

/** Devuelve el cliente de OpenAI (lanza error si no hay clave configurada). */
export function obtenerOpenAI() {
  if (!config.openaiApiKey) {
    throw new Error('OPENAI_API_KEY no está configurada en el archivo .env');
  }
  if (!cliente) {
    cliente = new OpenAI({ apiKey: config.openaiApiKey, timeout: 90_000 });
  }
  return cliente;
}

/** Mensaje estándar cuando falta la clave de OpenAI. */
export const AVISO_SIN_OPENAI =
  '🔑 Este comando necesita una clave de OpenAI.\nAñade OPENAI_API_KEY en las variables de entorno y reinicia el bot.';
