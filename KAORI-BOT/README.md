# 🤖 Kaory Bot

Bot de Telegram modular en Node.js con ChatGPT, DALL·E 3, clima, descargas de YouTube y conversión de stickers. Preparado para desplegarse en Railway en menos de 5 minutos.

---

## ✨ Comandos

| Comando | Descripción | Requiere |
|---|---|---|
| `/start` | Bienvenida y lista de comandos | — |
| `/help` | Ayuda detallada (`/help ai` para un comando) | — |
| `/ai [texto]` | Respuesta de ChatGPT | OpenAI |
| `/imagen [descripción]` | Imagen generada con DALL·E 3 | OpenAI |
| `/traducir [texto]` | Traduce al español detectando el idioma | OpenAI |
| `/clima [ciudad]` | Clima actual | WeatherAPI |
| `/video [url o búsqueda]` | Descarga y envía un vídeo de YouTube | — |
| `/audio [url o búsqueda]` | Descarga y envía sólo el audio | — |
| `/sticker` | Convierte una imagen en sticker | — |
| `/ping` | Mide la latencia | — |
| `/info` | Datos técnicos del bot | — |
| `/status` | Estado de conexión y uptime | — |
| `/notificar [mensaje]` | Recordatorio a los 10 segundos | — |

---

## 🔑 Paso 1 — Consigue las claves

### Token de Telegram (obligatorio)
1. Abre Telegram y busca **@BotFather**.
2. Envía `/newbot` y sigue las instrucciones (nombre y usuario del bot).
3. Copia el token que te da, con este aspecto: `1234567890:AAH...`

### Clave de OpenAI (opcional)
1. Entra en [platform.openai.com](https://platform.openai.com/api-keys)
2. Crea una clave nueva y cópiala (empieza por `sk-`).
3. Necesitas saldo en la cuenta para que `/ai`, `/imagen` y `/traducir` funcionen.

### Clave de WeatherAPI (opcional, gratis)
1. Regístrate en [weatherapi.com](https://www.weatherapi.com/)
2. Copia la API key del panel. El plan gratuito es más que suficiente.

---

## 💻 Paso 2 — Ejecutar en tu ordenador

Necesitas **Node.js 20 o superior** (comprueba con `node -v`).

```bash
# 1. Clona o descarga el proyecto y entra en la carpeta
cd kaory-bot

# 2. Instala las dependencias
npm install

# 3. Crea tu archivo .env a partir del ejemplo
cp .env.example .env

# 4. Abre .env y pega tus claves

# 5. Arranca el bot
npm start
```

Si todo va bien verás en la terminal algo como:

```
✔  OK      13 comandos cargados correctamente
✔  OK      Bot conectado como @MiBot (id: 1234567890)
ℹ  INFO    Escuchando mensajes vía long polling...
```

Ahora abre Telegram, busca tu bot y envía `/start`.

---

## ☁️ Paso 3 — Desplegar en Railway

### 3.1 Sube el código a GitHub
1. Crea un repositorio nuevo en [github.com](https://github.com/new) (puede ser privado).
2. Desde la carpeta del proyecto:

```bash
git init
git add .
git commit -m "Primer commit"
git branch -M main
git remote add origin [github.com](https://github.com/TU_USUARIO/kaory-bot.git)
git push -u origin main
```

> ⚠️ El archivo `.env` **no se sube** (está en `.gitignore`). Es intencionado: las claves se configuran directamente en Railway.

### 3.2 Crea el proyecto en Railway
1. Entra en [railway.app](https://railway.app) y regístrate con tu cuenta de GitHub.
2. Pulsa **New Project → Deploy from GitHub repo**.
3. Autoriza a Railway a acceder a tus repositorios y selecciona `kaory-bot`.
4. Railway detecta Node.js automáticamente (Nixpacks) y empieza a construir.

### 3.3 Añade las variables de entorno
1. En tu proyecto, abre la pestaña **Variables**.
2. Pulsa **New Variable** y añade una a una (o usa **Raw Editor** para pegarlas todas):

```
TELEGRAM_BOT_TOKEN=tu_token_aqui
OPENAI_API_KEY=tu_clave_aqui
OPENAI_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=dall-e-3
WEATHER_API_KEY=tu_clave_aqui
BOT_NAME=Kaory Bot
BOT_VERSION=1.0.0
ECHO_ENABLED=false
REMINDER_DELAY_MS=10000
MAX_FILE_SIZE_MB=48
MAX_VIDEO_SECONDS=900
LOG_LEVEL=info
LOG_JSON=false
SHOW_QR=false
```

3. Al guardar, Railway redesplegará el servicio automáticamente.

### 3.4 Comprueba que funciona
1. Abre la pestaña **Deployments → View Logs**.
2. Busca la línea `Bot conectado como @tu_bot`.
3. Escribe `/ping` en Telegram. Si responde, ya está en producción.

### 3.5 Notas importantes sobre Railway
- **No necesitas exponer ningún puerto ni generar un dominio.** El bot usa long polling, no webhooks. Si Railway te pide un dominio, ignóralo.
- **No ejecutes el bot localmente y en Railway a la vez** con el mismo token: Telegram devolverá el error `409 Conflict`. Detén uno de los dos.
- **Sin sistema de archivos persistente.** Los recordatorios de `/notificar` se guardan en memoria y se pierden en cada redespliegue.

---

## 🧩 Cómo añadir un comando nuevo

Crea un archivo en `/commands`. El cargador lo detecta solo al arrancar; no hay que registrar nada a mano.

```js
// commands/hola.js
export default {
  name: 'hola',
  aliases: ['saludo'],          // opcional
  description: 'Te saluda',
  usage: '/hola',

  async execute({ bot, chatId, msg, texto, args, comandos, estado }) {
    await bot.sendMessage(chatId, `¡Hola, ${msg.from.first_name}!`);
  }
};
```

El objeto `ctx` que recibe `execute` contiene:

| Propiedad | Qué es |
|---|---|
| `bot` | Instancia de `node-telegram-bot-api` |
| `msg` | Mensaje completo de Telegram |
| `chatId` | ID del chat |
| `texto` | Argumentos como una sola cadena |
| `args` | Argumentos como array |
| `comandos` | Mapa con todos los comandos cargados |
| `estado` | `{ iniciadoEn, me, bot, comandos }` |

---

## 🛠 Solución de problemas

| Síntoma | Causa y solución |
|---|---|
| `409 Conflict` en los logs | Hay dos instancias con el mismo token. Cierra la local o borra el despliegue duplicado. |
| `401 Unauthorized` | Token mal copiado. Revisa `TELEGRAM_BOT_TOKEN` (sin espacios ni comillas). |
| `/ai` responde que falta la clave | Falta `OPENAI_API_KEY` o la cuenta no tiene saldo. |
| `/video` y `/audio` fallan | YouTube cambia su sistema con frecuencia. Actualiza con `npm i @distube/ytdl-core@latest` y redespliega. |
| El bot no responde nada | Mira los logs en Railway; casi siempre es una variable de entorno mal escrita. |
| Archivo demasiado grande | Los bots de Telegram sólo suben hasta 50 MB. Es un límite de la API, no del código. |

---

## 📦 Dependencias

| Paquete | Para qué |
|---|---|
| `node-telegram-bot-api` | Cliente de la API de Telegram |
| `openai` | ChatGPT y DALL·E 3 |
| `axios` | Peticiones HTTP (WeatherAPI) |
| `dotenv` | Variables de entorno |
| `@distube/ytdl-core` | Descargas de YouTube (fork mantenido de `ytdl-core`) |
| `yt-search` | Búsqueda de vídeos |
| `node-fetch` | Descarga de imágenes generadas |
| `sharp` | Conversión a WebP para los stickers |
| `pino` | Logs estructurados en producción |
| `chalk` | Logs coloreados en desarrollo |
| `qrcode-terminal` | QR de depuración con el enlace del bot |

---

## 📄 Licencia

MIT — úsalo y modifícalo libremente.