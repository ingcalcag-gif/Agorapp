/* Strumenti comuni alle prove nel browser (voce T-005).

   Ogni prova apre l'app montata (dist/pubblica/) da un piccolo server locale, in un Chromium senza finestra
   con le misure di un telefono. Tutte le richieste verso indirizzi diversi dal server locale sono bloccate:
   le prove non contattano nessun servizio esterno e si comportano allo stesso modo qui e su GitHub Actions.
   Dal blocco 3 la mappa è la mappa di prova di Torino del repository (T-017). I dati sono sempre inventati. */
'use strict';
/* Le prove ragionano con l'ora italiana, come il browser che aprono (timezoneId qui sotto): così «domani» è lo stesso
   giorno per la prova e per l'app anche quando in Italia è già passata la mezzanotte e sul server non ancora. */
process.env.TZ = 'Europe/Rome';
const fs = require('fs');
const http = require('http');
const path = require('path');
const { DIST, RADICE } = require('../comune.js');

/* Playwright sta in prove/node_modules (npm ci in prove/); se manca, la prova si salta in locale. */
function playwright() {
  try { return require('playwright'); } catch (e) { return null; }
}

const TIPI = { '.webmanifest': 'application/manifest+json', '.geojson': 'application/geo+json', '.pbf': 'application/x-protobuf', '.pmtiles': 'application/octet-stream', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };

/* Server statico con la stessa disposizione del repository che githack serve: l'app sta in /dist/<uscita>/, la mappa di
   prova di Torino in /mappa/prova/ (T-017) e l'archivio di prova degli eventi in /prova/archivio/ (T-021), dove l'app li
   cerca. Nient'altro del repository è raggiungibile.
   Come githack in molti casi, non accetta le richieste a pezzi: l'app deve passare da sé alla cartella di tasselli. */
function server(uscita = 'pubblica', opzioni = {}) {
  const radici = [['/dist/' + uscita + '/', path.join(DIST, uscita)], ['/mappa/prova/', path.join(RADICE, 'mappa', 'prova')],
    ['/prova/archivio/', path.join(RADICE, 'prova', 'archivio')]];
  /* opzioni.file: una funzione che dà i file dell'app come {percorso: testo o Buffer}, al posto di quelli di dist/: serve
     alle prove che cambiano versione dell'app o un suo file (service worker, T-029). Le intestazioni sono quelle di un
     server vero: i file si possono tenere, ma vanno ricontrollati. */
  const s = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (opzioni.file && u.startsWith(radici[0][0])) {
      const k = u.slice(radici[0][0].length) || 'index.html', dati = opzioni.file()[k];
      if (dati == null) { res.writeHead(404); res.end('non trovato'); return; }
      /* opzioni.ritardo(percorso): millisecondi di attesa prima di rispondere, per provare le risposte lente */
      const rispondi = () => { res.writeHead(200, { 'content-type': TIPI[path.extname(k)] || 'application/octet-stream', 'cache-control': 'no-cache' }); res.end(dati); };
      const attesa = opzioni.ritardo ? opzioni.ritardo(k) : 0;
      if (attesa > 0) setTimeout(rispondi, attesa); else rispondi();
      return;
    }
    const r = radici.find(([pre]) => u.startsWith(pre));
    let f = r && path.normalize(path.join(r[1], u.slice(r[0].length) || 'index.html'));
    if (f && u.endsWith('/')) f = path.join(f, 'index.html');
    if (!f || !f.startsWith(r[1]) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('non trovato'); return; }
    res.writeHead(200, { 'content-type': TIPI[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(ok => s.listen(0, '127.0.0.1', () => ok({ url: `http://127.0.0.1:${s.address().port}/dist/${uscita}/`, chiudi: () => new Promise(r => s.close(r)) })));
}

/* Un browser con un contesto da telefono. memoria: chiavi e valori da mettere nella memoria del telefono
   prima dell'apertura (una volta sola per contesto); opzioni: altre impostazioni del contesto (per esempio userAgent). */
async function apri(pw, memoria = {}, opzioni = {}) {
  // WebGL in software (SwiftShader): dal blocco 3 la mappa si disegna davvero anche nelle prove.
  const browser = await pw.chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  /* Il service worker (T-029) resta spento, salvo nelle prove che lo provano (serviceWorkers: 'allow'): con il service
     worker acceso le risposte finte di una prova (archivio, ricerca degli indirizzi) potrebbero non arrivare alla pagina. */
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'it-IT', timezoneId: 'Europe/Rome', serviceWorkers: 'block' }, opzioni));
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

/* ---------- Archivio degli eventi nelle prove (T-022) ----------
   L'app aperta dal server di prova legge l'archivio di prova del repository (prova/archivio/). Una prova può sostituirlo
   con un archivio suo, di eventi inventati, scritto con lo stesso modulo dello sportello: archivio(ctx, eventi, grezzi).
   grezzi sono eventi aggiunti ai file così come sono, anche non validi, per provare che l'app li scarta. */
const EVF = require('../../sorgenti/moduli/eventi.js');
const QUAD = require('../../sorgenti/moduli/quadranti.js');
const REGIONI = require('../../sorgenti/dati/regioni.json').regioni;
const ZONA_ARCHIVIO = '/prova/archivio/';
/* Un identificativo nella forma del formato: 16 lettere dalla chiave, un trattino, «provaaaa». */
const idProva = chiave => (String(chiave).toLowerCase().replace(/[^a-z]/g, '') + 'aaaaaaaaaaaaaaaa').slice(0, 16) + '-provaaaa';
/* Un evento valido del formato pubblico (docs/formato-eventi.md), domani a Torino, con i campi cambiati da «campi». */
function eventoProva(chiave, campi = {}) {
  return Object.assign({ id: idProva(chiave), titolo: 'Evento inventato', strato: 'musica', inizio: giorno(1) + 'T18:00', fine: giorno(1) + 'T20:00',
    luogo: 'Sala inventata', indirizzo: 'Via Inventata 1, Torino', collocazione: 'indirizzo', lat: 45.0703, lng: 7.6869,
    descrizione: 'Evento inventato per la prova.', fonte: { testo: 'Fonte inventata' }, modificato: new Date().toISOString().slice(0, 19) + 'Z' }, campi);
}
function fileArchivio(eventi, grezzi = []) {
  const { file, indice } = QUAD.costruisci(eventi, { adesso: Date.now(), regioni: REGIONI });
  const per = {};
  for (const g of grezzi) { const q = QUAD.quadrante(g.lat, g.lng); (per[q] = per[q] || []).push(g); }
  for (const [q, lista] of Object.entries(per)) {
    const prima = indice.quadranti[q], valide = prima ? JSON.parse(file[prima.file]).eventi : [];
    if (prima) delete file[prima.file];
    const tutti = valide.concat(lista);
    const testo = '{"formato":"eventi-quadrante","versione":1,"tdm-reservation":1,"quadrante":"' + q + '","eventi":[\n' + tutti.map(x => JSON.stringify(x)).join(',\n') + '\n]}\n';
    const v = QUAD.impronta(testo), f = 'quadranti/' + q + '-' + v + '.json';
    file[f] = testo; indice.quadranti[q] = { file: f, v, eventi: tutti.length };
  }
  file['indice.json'] = JSON.stringify(indice) + '\n';
  return file;
}
async function archivio(ctx, eventi, grezzi = []) {
  const file = fileArchivio(eventi, grezzi);
  await ctx.route(u => u.pathname.includes(ZONA_ARCHIVIO), r => {
    const k = new URL(r.request().url()).pathname.split(ZONA_ARCHIVIO)[1];
    return k in file ? r.fulfill({ status: 200, contentType: 'application/json', body: file[k] }) : r.fulfill({ status: 404, body: 'non trovato' });
  });
  return file;
}
/* Aspetta che l'app abbia caricato almeno n eventi dell'archivio. */
async function eventiCaricati(p, n = 1, ms = 20000) {
  try { await p.waitForFunction(k => window.AGR && window.AGR.archivio && window.AGR.archivio().pubblici >= k, n, { timeout: ms }); return true; } catch (e) { return false; }
}

module.exports = { playwright, server, apri, giorno, pausa, archivio, fileArchivio, eventoProva, idProva, eventiCaricati, ZONA_ARCHIVIO, EVF, QUAD };
