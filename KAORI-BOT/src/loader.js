/**
 * Cargador dinámico de comandos.
 * Escanea la carpeta /commands y registra todo archivo .js que exporte
 * por defecto un objeto con la forma { name, execute }.
 */
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { logger } from '../utils/logger.js';

const rutaActual = path.dirname(fileURLToPath(import.meta.url));
const CARPETA_COMANDOS = path.join(rutaActual, '..', 'commands');

/**
 * @returns {Promise<Map<string, object>>} Mapa nombre/alias -> comando
 */
export async function cargarComandos() {
  const comandos = new Map();

  let archivos = [];
  try {
    archivos = (await readdir(CARPETA_COMANDOS)).filter((f) => f.endsWith('.js'));
  } catch (error) {
    logger.error(`No se pudo leer la carpeta /commands: ${error.message}`);
    return comandos;
  }

  for (const archivo of archivos.sort()) {
    const rutaCompleta = path.join(CARPETA_COMANDOS, archivo);
    try {
      // pathToFileURL es obligatorio para que los imports dinámicos funcionen en Windows
      const modulo = await import(pathToFileURL(rutaCompleta).href);
      const comando = modulo.default ?? modulo.command;

      if (!comando || typeof comando !== 'object') {
        logger.warn(`${archivo}: no exporta un objeto por defecto. Ignorado.`);
        continue;
      }
      if (!comando.name || typeof comando.execute !== 'function') {
        logger.warn(`${archivo}: falta "name" o "execute". Ignorado.`);
        continue;
      }

      comandos.set(comando.name.toLowerCase(), comando);
      for (const alias of comando.aliases ?? []) {
        comandos.set(String(alias).toLowerCase(), comando);
      }

      logger.info(`Comando registrado: /${comando.name}`);
    } catch (error) {
      logger.error(`Error cargando ${archivo}: ${error.message}`);
    }
  }

  return comandos;
}

/** Devuelve sólo los comandos reales (sin duplicar los alias). */
export function comandosUnicos(comandos) {
  const vistos = new Set();
  const salida = [];
  for (const comando of comandos.values()) {
    if (vistos.has(comando.name)) continue;
    vistos.add(comando.name);
    salida.push(comando);
  }
  return salida.sort((a, b) => a.name.localeCompare(b.name));
}
