/** Mide la latencia de ida y vuelta con los servidores de Telegram. */
export default {
  name: 'ping',
  description: 'Mide la latencia de respuesta del bot',
  usage: '/ping',

  async execute({ bot, chatId, msg }) {
    try {
      const inicio = Date.now();
      const enviado = await bot.sendMessage(chatId, '🏓 Midiendo latencia...');
      const latenciaEnvio = Date.now() - inicio;

      // Segunda medición: llamada directa a la API de Telegram
      const inicioApi = Date.now();
      await bot.getMe();
      const latenciaApi = Date.now() - inicioApi;

      // Retraso entre que el usuario envió el mensaje y el bot lo procesó
      const retrasoMensaje = Math.max(0, Math.round(Date.now() / 1000 - msg.date));

      await bot.editMessageText(
        `🏓 <b>Pong!</b>\n\n` +
          `📤 Envío de mensaje: <b>${latenciaEnvio} ms</b>\n` +
          `🌐 API de Telegram: <b>${latenciaApi} ms</b>\n` +
          `⏱ Retraso de recepción: <b>${retrasoMensaje} s</b>`,
        { chat_id: chatId, message_id: enviado.message_id, parse_mode: 'HTML' }
      );
    } catch (error) {
      await bot.sendMessage(chatId, '❌ No pude medir la latencia en este momento.');
    }
  }
};