/**
 * Logger con dos modos:
 *  - Desarrollo: salida bonita y coloreada con chalk.
 *  - Producción (LOG_JSON=true): salida estructurada JSON con pino.
 * Lee las variables directamente de process.env para evitar dependencias circulares.
 */
import chalk from 'chalk';
import pino from 'pino';

const usarJson = String(process.env.LOG_JSON).toLowerCase() === 'true';

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime
});

const hora = () =>
  new Date().toLocaleTimeString('es-ES', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

function imprimir(nivelPino, etiqueta, color, mensaje) {
  if (usarJson) {
    pinoLogger[nivelPino](mensaje);
    return;
  }
  console.log(`${chalk.gray(hora())} ${color(etiqueta)} ${mensaje}`);
}

export const logger = {
  info: (mensaje) => imprimir('info', 'ℹ  INFO   ', chalk.cyan, mensaje),
  success: (mensaje) => imprimir('info', '✔  OK     ', chalk.green.bold, mensaje),
  warn: (mensaje) => imprimir('warn', '⚠  AVISO  ', chalk.yellow, mensaje),
  error: (mensaje) => imprimir('error', '✖  ERROR  ', chalk.red.bold, mensaje),
  debug: (mensaje) => imprimir('debug', '⚙  DEBUG  ', chalk.magenta, mensaje),

  /** Log específico para la ejecución de comandos. */
  command: (comando, usuario) =>
    imprimir('info', '➜  CMD    ', chalk.blue.bold, `${chalk.white(comando)} ${chalk.gray(`por ${usuario}`)}`),

  /** Cartel de arranque. */
  banner: (titulo) => {
    if (usarJson) {
      pinoLogger.info(titulo);
      return;
    }
    const linea = '─'.repeat(titulo.length + 8);
    console.log(chalk.magenta(`\n┌${linea}┐`));
    console.log(chalk.magenta('│    ') + chalk.white.bold(titulo) + chalk.magenta('    │'));
    console.log(chalk.magenta(`└${linea}┘\n`));
  }
};
