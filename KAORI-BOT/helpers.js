/**
 * Funciones auxiliares reutilizables por los comandos.
 */
import { unlink } from 'node:fs/promises';
import fetch from 'node-fetch';

/** Convierte segundos a un texto legible: "2d 4h 13m 07s". */
export function formatearUptime(segundos) {
  const total = Math.floor(segundos);
  const dias = Math.floor(total / 86400);
  const horas = Math.floor((total % 86400) / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segs = total % 60;

  const partes = [];
  if (dias) partes.push(`${dias}d`);
  if (horas || dias) partes.push(`${horas}h`);
  if (minutos || horas || dias) partes.push(`${minutos}m`);
  partes.push(`${String(segs).padStart(2, '0')}s`);
  return partes.join(' ');
}

/** Convierte segundos a formato mm:ss o hh:mm:ss. */
export function formatearDuracion(segundos) {
  const total = Math.floor(segundos);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const dosDigitos = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${dosDigitos(m)}:${dosDigitos(s)}` : `${m}:${dosDigitos(s)}`;
}

/** Convierte bytes a una cadena legible (KB, MB, GB). */
export function formatearBytes(bytes) {
  const numero = Number(bytes) || 0;
  if (numero === 0) return '0 B';
  const unidades = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(numero) / Math.log(1024)), unidades.length - 1);
  return `${(numero / 1024 ** i).toFixed(1)} ${unidades[i]}`;
}

/** Detecta si un texto es una URL de YouTube. */
export function esUrlYoutube(texto = '') {
  return /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com\/(watch\?v=|shorts\/|live\/|embed\/)|youtu\.be\/)[\w-]{6,}/i.test(
    texto.trim()
  );
}

/** Escapa caracteres reservados de HTML para usar parse_mode: 'HTML' sin romper el mensaje. */
export function escaparHtml(texto = '') {
  return String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Recorta un texto añadiendo puntos suspensivos. */
export function truncar(texto = '', maximo = 200) {
  const limpio = String(texto);
  return limpio.length > maximo ? `${limpio.slice(0, maximo - 1)}…` : limpio;
}

/**
 * Divide un texto largo en trozos que quepan en un mensaje de Telegram (límite 4096).
 * Intenta cortar por saltos de línea para no partir frases.
 */
export function dividirMensaje(texto = '', maximo = 3800) {
  const limpio = String(texto);
  if (limpio.length <= maximo) return [limpio];

  const partes = [];
  let restante = limpio;

  while (restante.length > maximo) {
    let corte = restante.lastIndexOf('\n', maximo);
    if (corte < maximo * 0.5) corte = restante.lastIndexOf(' ', maximo);
    if (corte < maximo * 0.5) corte = maximo;
    partes.push(restante.slice(0, corte));
    restante = restante.slice(corte).trimStart();
  }
  if (restante) partes.push(restante);
  return partes;
}

/** Descarga una URL y devuelve su contenido como Buffer (usa node-fetch). */
export async function descargarBuffer(url) {
  const respuesta = await fetch(url, { timeout: 60_000 });
  if (!respuesta.ok) {
    throw new Error(`No se pudo descargar el archivo (HTTP ${respuesta.status})`);
  }
  return Buffer.from(await respuesta.arrayBuffer());
}

/** Borra un archivo temporal sin lanzar error si ya no existe. */
export async function limpiarArchivo(ruta) {
  try {
    await unlink(ruta);
  } catch {
    /* el archivo ya no existe: no pasa nada */
  }
}

/** Envía varios mensajes respetando el límite de longitud de Telegram. */
export async function responderLargo(bot, chatId, texto, opciones = {}) {
  for (const parte of dividirMensaje(texto)) {
    await bot.sendMessage(chatId, parte, opciones);
  }
}
