# Outliners — Notificador Crypto Alphas

Userscript para **Tampermonkey** que vigila el muro **Crypto Alphas** de [Outliners](https://app.outlinersclub.com) y avisa cuando aparece un mensaje nuevo:

- 🔔 Notificación de escritorio (autor + primera línea del post)
- 🔊 Sonido
- 📱 Opcional: el post completo por **Telegram**

No recarga la página: cada 60 s pide el muro en segundo plano y compara contra los posts ya vistos. Cada 30 min hace una recarga completa para mantener viva la sesión.

---

## Requisitos

- Google Chrome (o cualquier navegador basado en Chromium)
- Extensión [Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- Cuenta en Outliners con acceso a Crypto Alphas

## Instalación

1. Instalá **Tampermonkey** desde la Chrome Web Store.
2. Habilitá los scripts de usuario en Chrome:
   - Abrí `chrome://extensions`
   - Activá **Modo desarrollador** (arriba a la derecha)
   - Entrá a **Detalles** de Tampermonkey y activá **"Permitir secuencias de comandos del usuario"** (*Allow User Scripts*)
   > Sin este paso Tampermonkey muestra el aviso *"Please enable the Allow User Scripts extension setting"* y el script no corre.
3. Abrí [`outliners-crypto-alphas-notifier.user.js`](./outliners-crypto-alphas-notifier.user.js), hacé clic en **Raw** y Tampermonkey ofrecerá instalarlo. (Alternativa: Tampermonkey → *Create a new script* → pegar el código → `Ctrl+S`.)
4. Abrí `https://app.outlinersclub.com/es/muro?tab=alpha` y aceptá el permiso de notificaciones de Chrome.

El ícono de Tampermonkey debe mostrar un **1** en rojo en esa pestaña. La primera ejecución marca todos los posts existentes como vistos (no avisa de los viejos).

## Configurar Telegram (opcional)

1. **Crear el bot:** en Telegram hablale a [@BotFather](https://t.me/BotFather) → `/newbot` → te da un token tipo `7712345678:AAH...`.
2. **Habilitar el bot:** abrí el chat con tu bot y mandale cualquier mensaje (ej. `hola`). El bot no responde nada, es normal; esto solo le da permiso para escribirte.
3. **Obtener tu chat id:** abrí en el navegador (reemplazando `TU_TOKEN`):
   ```
   https://api.telegram.org/botTU_TOKEN/getUpdates
   ```
   Buscá `"chat":{"id":123456789,...}` — ese número es tu chat id.
   - Si sale `"result":[]`, mandale otro mensaje al bot y recargá.
   - Alternativa: hablale a [@userinfobot](https://t.me/userinfobot) y te dice tu Id.
4. **Probar el envío:**
   ```
   https://api.telegram.org/botTU_TOKEN/sendMessage?chat_id=TU_CHAT_ID&text=prueba
   ```
5. **Cargar los datos en el script** (en el editor de Tampermonkey):
   ```js
   const TELEGRAM_TOKEN   = '7712345678:AAH...';
   const TELEGRAM_CHAT_ID = '123456789';
   ```
6. La primera vez que envíe, Tampermonkey pide permiso para conectarse a `api.telegram.org` → elegí **Always allow domain**.

> ⚠️ El token de Telegram es como una contraseña de tu bot. No lo subas a un repo ni lo compartas.

## Configuración

Al principio del script:

| Variable | Default | Qué hace |
|---|---|---|
| `POLL_SECONDS` | `60` | Cada cuántos segundos revisa. Chrome limita las pestañas en segundo plano a ~1 vez/min, bajar de 60 no sirve. |
| `HARD_RELOAD_MIN` | `30` | Recarga completa cada X minutos para mantener la sesión. |
| `PLAY_SOUND` | `true` | Sonido al llegar un post. |
| `TELEGRAM_TOKEN` | `''` | Token del bot (opcional). |
| `TELEGRAM_CHAT_ID` | `''` | Tu chat id (opcional). |
| `TEST_ON_LOAD` | `false` | `true` = al cargar la página reenvía el último post como prueba. Volver a `false` después de probar. |

## Verificar que funciona

1. Poné `TEST_ON_LOAD = true`, guardá (`Ctrl+S`) y recargá la pestaña de Crypto Alphas.
2. Deberían llegar: notificación de escritorio `[PRUEBA] ...`, sonido y el mensaje en Telegram.
3. Volvé a `TEST_ON_LOAD = false` y guardá.

### Si no llega nada

1. **¿Corre el script?** El ícono de Tampermonkey debe mostrar un **1**. Si no, revisá el paso 2 de la instalación (*Allow User Scripts*).
2. **¿Corre pero no hay notificación?** Revisá que Chrome tenga permiso de notificaciones para el sitio y que Windows/macOS no esté en "No molestar".
3. **¿Llega la notificación pero no Telegram?** Revisá token/chat id y el permiso de `api.telegram.org` en Tampermonkey.

## Uso

- Dejá **una pestaña** de Crypto Alphas abierta (conviene fijarla: clic derecho → *Fijar*). Puede estar en segundo plano.
- Chrome tiene que estar abierto y la PC sin suspender.
- Si la sesión de Outliners vence, llega un aviso *"no encuentro posts"*: volvé a iniciar sesión.

## Limitaciones

- Depende del navegador abierto. Para 24/7 habría que portarlo a un script en un servidor/VPS con la cookie de sesión.
- Detecta posts por la estructura del HTML (header autor · badge "Experto" · fecha). Si Outliners cambia el diseño puede dejar de detectarlos; en ese caso avisa con *"no encuentro posts"* en lugar de fallar en silencio.
- Proyecto no oficial, sin relación con Outliners.

## Licencia

MIT
