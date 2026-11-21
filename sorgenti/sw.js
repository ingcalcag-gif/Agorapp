/* Service worker: l'app senza rete (voce T-029 del piano di adeguamento; documento: docs/senza-rete.md).

   Libro mastro, § 2.2 («L'uso senza rete») e § 3.7, riga «Copia dell'app»: il telefono conserva una copia dell'app, per
   aprirla e usarla senza rete, fino alla versione successiva, che la sostituisce.

   Che cosa fa.
   - Alla prima apertura scarica i file dell'app e li conserva nella memoria del browser per i file, nella voce
     «dl_app» dell'elenco chiuso (modulo memoria.js, montato qui sopra). Ogni file si conserva solo se è proprio quello
     di questa versione: se ne controlla l'impronta. Se un file non corrisponde, la versione nuova non parte e resta
     quella di prima.
   - Poi consegna quei file dalla copia, anche senza rete. Tutto il resto passa dalla rete com'è: gli eventi
     (li conserva il modulo archivio.js), la mappa (modulo mappa-locale.js), la ricerca degli indirizzi, gli avvisi e
     il file d'emergenza. Il service worker non conserva mai file di altri siti.
   - Una versione nuova si prepara in silenzio e sostituisce la precedente alla prossima apertura; i file della versione
     di prima si cancellano.
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
const INSIEME = 6;   // file scaricati insieme durante la preparazione

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

/* Scarica un file dell'app e lo mette nella copia, solo se è quello di questa versione. Restituisce la risposta pronta. */
async function prendi(c, p) {
  const r = await fetch(indirizzo(p), { cache: 'no-cache', credentials: 'omit', redirect: 'error' });
  if (!r.ok) throw new Error(p + ': ' + r.status);
  const dati = await r.arrayBuffer();
  if (await impronta(dati) !== COPIA[p]) throw new Error(p + ': non è il file di questa versione');
  const intestazioni = { 'content-type': tipo(p), 'content-length': String(dati.byteLength) };
  await c.put(chiave(p), new Response(dati.slice(0), { headers: intestazioni }));
  return new Response(dati, { headers: intestazioni });
}

self.addEventListener('install', ev => ev.waitUntil((async () => {
  const c = await copia();
  if (!c) throw new Error('questo browser non conserva file');
  const mancanti = [];
  for (const p of Object.keys(COPIA)) if (!PIGRI.includes(p) && !(await c.match(chiave(p)))) mancanti.push(p);
  for (let i = 0; i < mancanti.length; i += INSIEME) await Promise.all(mancanti.slice(i, i + INSIEME).map(p => prendi(c, p)));
  await self.skipWaiting();
})()));

self.addEventListener('activate', ev => ev.waitUntil((async () => {
  const c = await copia();
  if (c) {
    const buone = new Set(Object.keys(COPIA).map(chiave));
    /* via i file delle versioni precedenti di questa app; ciò che sta sotto altri indirizzi non si tocca */
    for (const r of await c.keys()) if (r.url.startsWith(BASE) && !buone.has(r.url)) await c.delete(r);
  }
  await self.clients.claim();
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

/* La pagina può chiedere la versione di chi la serve. */
self.addEventListener('message', ev => { if (ev.data === 'versione' && ev.ports && ev.ports[0]) ev.ports[0].postMessage(VERSIONE); });
