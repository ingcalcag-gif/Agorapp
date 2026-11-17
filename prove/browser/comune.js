/* Strumenti comuni alle prove nel browser (voce T-005).

   Ogni prova apre l'app montata (dist/pubblica/) da un piccolo server locale, in un Chromium senza finestra
   con le misure di un telefono. Tutte le richieste verso indirizzi diversi dal server locale sono bloccate:
   le prove non contattano nessun servizio esterno e si comportano allo stesso modo qui e su GitHub Actions
   (la mappa, che oggi viene da servizi esterni, non si carica: è previsto). I dati sono sempre inventati. */
'use strict';
const fs = require('fs');
const http = require('http');
const path = require('path');
const { DIST } = require('../comune.js');

/* Playwright sta in prove/node_modules (npm ci in prove/); se manca, la prova si salta in locale. */
function playwright() {
  try { return require('playwright'); } catch (e) { return null; }
}

const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };

/* Server statico della cartella di un'uscita, su una porta libera. */
function server(uscita = 'pubblica') {
  const base = path.join(DIST, uscita);
  const s = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let f = path.normalize(path.join(base, u.endsWith('/') ? u + 'index.html' : u));
    if (!f.startsWith(base) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('non trovato'); return; }
    res.writeHead(200, { 'content-type': TIPI[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(ok => s.listen(0, '127.0.0.1', () => ok({ url: `http://127.0.0.1:${s.address().port}/`, chiudi: () => new Promise(r => s.close(r)) })));
}

/* Un browser con un contesto da telefono. memoria: chiavi e valori da mettere nella memoria del telefono
   prima dell'apertura (una volta sola per contesto); opzioni: altre impostazioni del contesto (per esempio userAgent). */
async function apri(pw, memoria = {}, opzioni = {}) {
  const browser = await pw.chromium.launch();
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'it-IT', timezoneId: 'Europe/Rome' }, opzioni));
  await ctx.route(r => !/^https?:\/\/127\.0\.0\.1(:\d+)?\//.test(r.href), r => r.abort());
  await ctx.addInitScript(m => {
    if (sessionStorage.getItem('prova-seminata')) return;
    for (const [k, v] of Object.entries(m)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    sessionStorage.setItem('prova-seminata', '1');
  }, memoria);
  return { browser, ctx };
}

/* Data locale AAAA-MM-GG tra n giorni. */
function giorno(n) {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

const pausa = ms => new Promise(r => setTimeout(r, ms));

module.exports = { playwright, server, apri, giorno, pausa };
