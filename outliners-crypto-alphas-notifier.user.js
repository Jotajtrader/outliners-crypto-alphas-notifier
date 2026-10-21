// ==UserScript==
// @name         Outliners — Notificador Crypto Alphas
// @namespace    jorge.outliners
// @version      1.1
// @description  Revisa el muro Crypto Alphas cada N segundos (sin recargar) y avisa con notificación de escritorio, sonido y opcionalmente Telegram.
// @match        https://app.outlinersclub.com/*/muro*
// @grant        GM_notification
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      api.telegram.org
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ===================== CONFIG =====================
  const POLL_SECONDS     = 60;   // cada cuánto revisa (Chrome limita tabs en 2º plano a ~1/min)
  const HARD_RELOAD_MIN  = 30;   // recarga completa cada X min para mantener la sesión viva
  const PLAY_SOUND       = true;
  const TELEGRAM_TOKEN   = '';   // opcional: token de tu bot (@BotFather)
  const TELEGRAM_CHAT_ID = '';   // opcional: tu chat id (@userinfobot)
  const TEST_ON_LOAD     = false; // true = al cargar la página reenvía el último post como prueba
  // ==================================================

  const FEED_URL = location.pathname.replace(/\/muro.*/, '/muro') + '?tab=alpha';
  const SEEN_KEY = 'outliners_alpha_seen';
  const MAX_SEEN = 300;

  // Cada post tiene un header con 3 hijos: autor · badge "Experto" · fecha.
  // La fecha cambia de zona horaria entre server y cliente, así que la huella es autor + inicio del texto.
  function extractPosts(root) {
    const badges = [...root.querySelectorAll('span,div')].filter(
      (e) => e.children.length === 0 && e.textContent.trim().toLowerCase() === 'experto'
    );
    return badges.map((b) => {
      let h = b;
      while (h && h.children.length < 3) h = h.parentElement;
      if (!h || !h.parentElement) return null;
      const author = h.children[0].textContent.trim();
      const body = h.parentElement.textContent.slice(h.textContent.length).trim();
      return { id: author + '|' + body.slice(0, 120), author, body };
    }).filter(Boolean);
  }

  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [880, 1320].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.2);
        o.start(ctx.currentTime + i * 0.2); o.stop(ctx.currentTime + i * 0.2 + 0.15);
      });
    } catch (_) {}
  }

  function telegram(text) {
    if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
    GM_xmlhttpRequest({
      method: 'POST',
      url: `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
    });
  }

  function notify(post) {
    const firstLine = post.body.split('\n')[0].slice(0, 120);
    GM_notification({
      title: `Crypto Alphas · ${post.author}`,
      text: firstLine || 'Nuevo mensaje',
      timeout: 0,
      onclick: () => { window.focus(); location.href = FEED_URL; },
    });
    if (PLAY_SOUND) beep();
    telegram(`🧠 Crypto Alphas · ${post.author}\n\n${post.body.slice(0, 3500)}\n\n${location.origin}${FEED_URL}`);
  }

  let sessionAlerted = false;
  let emptyStreak = 0;               // revisiones seguidas sin posts

  async function check() {
    try {
      const res = await fetch(FEED_URL, { cache: 'no-store', credentials: 'include' });
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      // Outliners a veces envía la página "en streaming": <main> llega vacío y los posts
      // vienen en un bloque oculto aparte. Por eso se busca en todo el body (y se deduplica).
      const posts = extractPosts(doc.body).filter((p, i, a) => a.findIndex((q) => q.id === p.id) === i);

      if (!posts.length) {               // login vencido o cambió el HTML
        emptyStreak++;
        if (emptyStreak >= 3 && !sessionAlerted) {   // avisa solo tras 3 fallos seguidos (~3 min)
          GM_notification({ title: 'Outliners notifier', text: 'No encuentro posts: ¿sesión vencida? Revisá la pestaña.', timeout: 0 });
          telegram('⚠️ Outliners notifier: no encuentro posts (¿sesión vencida?).');
          sessionAlerted = true;
        }
        return;
      }
      sessionAlerted = false;
      emptyStreak = 0;

      if (TEST_ON_LOAD && !window.__alphasTested) {
        window.__alphasTested = true;
        notify({ ...posts[0], author: '[PRUEBA] ' + posts[0].author });
      }

      let seen = GM_getValue(SEEN_KEY, null);
      if (seen === null) {               // primera ejecución: marca todo como visto, sin avisar
        GM_setValue(SEEN_KEY, posts.map((p) => p.id));
        console.log('[Alphas] inicializado con', posts.length, 'posts');
        return;
      }
      const fresh = posts.filter((p) => !seen.includes(p.id));
      fresh.reverse().forEach(notify);   // del más viejo al más nuevo
      if (fresh.length) {
        seen = [...posts.map((p) => p.id), ...seen].filter((v, i, a) => a.indexOf(v) === i).slice(0, MAX_SEEN);
        GM_setValue(SEEN_KEY, seen);
      }
      document.title = (fresh.length ? `(${fresh.length}) ` : '') + document.title.replace(/^\(\d+\)\s*/, '');
    } catch (e) {
      console.warn('[Alphas] error en check', e);
    }
  }

  check();
  setInterval(check, POLL_SECONDS * 1000);
  // Vuelve siempre a Crypto Alphas (aunque hayas navegado a otra sección en esta pestaña)
  setTimeout(() => { location.href = FEED_URL; }, HARD_RELOAD_MIN * 60 * 1000);
  console.log(`[Alphas] notificador activo: cada ${POLL_SECONDS}s`);
})();
