/* Service worker: l'app senza rete (voce T-029 del piano di adeguamento; documento: docs/senza-rete.md).

   Libro mastro, § 2.2 («L'uso senza rete») e § 3.7, riga «Copia dell'app»: il telefono conserva una copia dell'app, per
   aprirla e usarla senza rete, fino alla versione successiva, che la sostituisce.

   Che cosa fa.
   - Alla prima apertura scarica i file dell'app e li conserva nella memoria del browser per i file, nella voce
     «dl_app» dell'elenco chiuso (modulo memoria.js, montato qui sopra). Ogni file si conserva solo se è proprio quello
     di questa versione: se ne controlla l'impronta. Un file che non arriva o non corrisponde si richiede fino a tre
     volte; se ancora non va, la versione nuova non parte e resta quella di prima. Mentre lavora, il service worker dice
     alla pagina a che punto è e, se non riesce, quale file e perché: la pagina lo mostra nella guida «Senza
     connessione». Sono messaggi interni al telefono: non escono.
   - Poi consegna quei file dalla copia, anche senza rete. Tutto il resto passa dalla rete com'è: gli eventi
     (li conserva il modulo archivio.js), la mappa (modulo mappa-locale.js), la ricerca degli indirizzi, gli avvisi e
     il file d'emergenza. Il service worker non conserva mai file di altri siti.
   - Una versione nuova si prepara in silenzio e aspetta: sostituisce la precedente quando l'app viene chiusa e riaperta,
     oppure prima, quando la pagina lo chiede perché in quel momento non disturba nessuno (messaggio «attiva»). Non
     prende mai il posto della versione di prima mentre la persona sta usando l'app. Poi i file di prima si cancellano.
   - Interruttore d'emergenza: a ogni apertura in rete legge il piccolo file emergenza.json. Se il file dice di scartare
     questa versione, cancella la copia, si toglie di mezzo e fa ricaricare la pagina dalla rete.

   Nessun identificativo, nessun conteggio: le richieste sono senza credenziali e senza parametri che dipendano dal telefono.

   Il montaggio (sorgenti/build.js) mette qui sopra il modulo della memoria e riempie i tre valori qui sotto. */
'use strict';
const VERSIONE = /*@@VERSIONE@@*/'';
const COPIA = /*@@COPIA@@*/{};      // {percorso: impronta} di ogni file dell'app
const PIGRI = /*@@PIGRI@@*/[];      // file che si conservano solo quando servono (strumenti dell'area riservata)

const BASE = new URL('./', self.location.href).href;
const PERCORSO_BASE = new URL(BASE).pathname;
const MEM = self.AGR_MODULI.memoria.crea({});
const INSIEME = 6;     // file scaricati insieme durante la preparazione
const TENTATIVI = 3;   // richieste per ogni file, prima di arrendersi

/* La copia: null se il browser non offre la memoria per i file. */
async function copia() {
  try { return MEM.file ? await MEM.file.open('dl_app') : null; } catch (e) { return null; }
}
const indirizzo = p => new URL(p.split('/').map(encodeURIComponent).join('/'), BASE).href;
const chiave = p => indirizzo(p) + '?v=' + COPIA[p];

async function impronta(dati) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', dati));
  return Array.from(h.subarray(0, 5), b => b.toString(16).padStart(2, '0')).join('');
}
const TIPI = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json', webmanifest: 'application/manifest+json',
  geojson: 'application/geo+json', txt: 'text/plain; charset=utf-8', png: 'image/png', svg: 'image/svg+xml', pbf: 'application/x-protobuf', woff2: 'font/woff2' };
const tipo = p => TIPI[p.slice(p.lastIndexOf('.') + 1)] || 'application/octet-stream';

/* Perché un file non è entrato nella copia: motivo «rete» (non arriva), «risposta» (il server risponde n), «impronta»
   (non è il file di questa versione), «altrove» (il server rimanda a un altro sito). */
function errore(file, motivo, n) { const e = new Error(file + ': ' + motivo + (n ? ' ' + n : '')); e.file = file; e.motivo = motivo; e.n = n || 0; return e; }
const pausa = ms => new Promise(ok => setTimeout(ok, ms));

/* Scarica un file dell'app e lo mette nella copia, solo se è quello di questa versione; se non va, riprova (la seconda
   e la terza volta senza passare dalla memoria del browser). Restituisce la risposta pronta. */
async function prendi(c, p) {
  let ultimo = null;
  for (let t = 0; t < TENTATIVI; t++) {
    if (t) await pausa(t * 1500);
    let r;
    try { r = await fetch(indirizzo(p), { cache: t ? 'reload' : 'no-cache', credentials: 'omit' }); } catch (e) { ultimo = errore(p, 'rete'); continue; }
    if (r.redirected && new URL(r.url).origin !== self.location.origin) throw errore(p, 'altrove');
    if (!r.ok) { ultimo = errore(p, 'risposta', r.status); continue; }
    let dati;
    try { dati = await r.arrayBuffer(); } catch (e) { ultimo = errore(p, 'rete'); continue; }
    if (await impronta(dati) !== COPIA[p]) { ultimo = errore(p, 'impronta'); continue; }
    const intestazioni = { 'content-type': tipo(p), 'content-length': String(dati.byteLength) };
    await c.put(chiave(p), new Response(dati.slice(0), { headers: intestazioni }));
    return new Response(dati, { headers: intestazioni });
  }
  throw ultimo;
}

/* A che punto è la preparazione, per tutte le pagine di questa app aperte sul telefono (anche quelle che il service
   worker non serve ancora). */
async function annuncia(msg) {
  try { for (const cl of await self.clients.matchAll({ type: 'window', includeUncontrolled: true })) cl.postMessage(Object.assign({ copia: true, versione: VERSIONE }, msg)); } catch (e) { /* niente da fare */ }
}

self.addEventListener('install', ev => ev.waitUntil((async () => {
  const c = await copia();
  if (!c) { await annuncia({ stato: 'errore', motivo: 'memoria' }); throw new Error('questo browser non conserva file'); }
  const tutti = Object.keys(COPIA).filter(p => !PIGRI.includes(p)), mancanti = [];
  for (const p of tutti) if (!(await c.match(chiave(p)))) mancanti.push(p);
  const totale = tutti.length;
  let fatti = totale - mancanti.length, prossimo = 0, fermo = false;
  await annuncia({ stato: 'preparazione', fatti, totale });
  /* sei file alla volta: appena uno è finito, parte il successivo */
  const lavora = async () => {
    while (!fermo && prossimo < mancanti.length) {
      const p = mancanti[prossimo++];
      await prendi(c, p);
      annuncia({ stato: 'preparazione', fatti: ++fatti, totale });
    }
  };
  try { await Promise.all(Array.from({ length: INSIEME }, lavora)); }
  catch (e) { fermo = true; await annuncia({ stato: 'errore', file: e.file || '', motivo: e.motivo || 'rete', n: e.n || 0 }); throw e; }
  await annuncia({ stato: 'installata', fatti, totale });
})()));

self.addEventListener('activate', ev => ev.waitUntil((async () => {
  const c = await copia();
  if (c) {
    const buone = new Set(Object.keys(COPIA).map(chiave));
    /* via i file delle versioni precedenti di questa app; ciò che sta sotto altri indirizzi non si tocca */
    for (const r of await c.keys()) if (r.url.startsWith(BASE) && !buone.has(r.url)) await c.delete(r);
  }
  await self.clients.claim();
  await annuncia({ stato: 'pronta' });
})()));

/* Il percorso di una richiesta dentro l'app ('' fuori dall'app); la cartella dell'app vale index.html. */
function percorso(u) {
  if (u.origin !== self.location.origin || !u.pathname.startsWith(PERCORSO_BASE)) return '';
  let p;
  try { p = decodeURIComponent(u.pathname.slice(PERCORSO_BASE.length)); } catch (e) { return ''; }
  if (p === '') return 'index.html';
  return p.endsWith('/') ? p + 'index.html' : p;
}

let spento = false;   // dopo l'interruttore d'emergenza non si consegna e non si conserva più nulla
self.addEventListener('fetch', ev => {
  const r = ev.request;
  if (spento || r.method !== 'GET') return;
  const p = percorso(new URL(r.url));
  if (!p || !(p in COPIA)) return;   // non è un file dell'app: passa dalla rete com'è
  ev.respondWith((async () => {
    const c = await copia();
    const pronta = c && await c.match(chiave(p));
    if (pronta) return pronta;
    if (c) { try { return await prendi(c, p); } catch (e) { /* si prova la rete così com'è */ } }
    return fetch(r);
  })());
  if (r.mode === 'navigate') ev.waitUntil(emergenza());
});

/* ---------- Interruttore d'emergenza ----------
   emergenza.json: {"scarta": ["<versione>", …]}; «*» vale per tutte le versioni. */
async function daScartare() {
  try {
    const r = await fetch(indirizzo('emergenza.json'), { cache: 'no-store', credentials: 'omit', redirect: 'error' });
    if (!r.ok) return false;
    const j = await r.json();
    return !!j && Array.isArray(j.scarta) && (j.scarta.includes(VERSIONE) || j.scarta.includes('*'));
  } catch (e) { return false; }   // senza rete non si scarta nulla
}
async function emergenza() {
  if (!(await daScartare())) return;
  spento = true;
  const c = await copia();
  if (c) for (const r of await c.keys()) if (r.url.startsWith(BASE)) await c.delete(r);
  await self.registration.unregister();
  for (const cl of await self.clients.matchAll({ type: 'window' })) { try { await cl.navigate(cl.url); } catch (e) { /* la pagina si ricaricherà da sé */ } }
}

/* La pagina può chiedere la versione di chi la serve e, quando non disturba, dire alla versione nuova di entrare in uso. */
self.addEventListener('message', ev => {
  if (ev.data === 'versione' && ev.ports && ev.ports[0]) ev.ports[0].postMessage(VERSIONE);
  else if (ev.data === 'attiva') ev.waitUntil(self.skipWaiting());
});
