#!/usr/bin/env node
/* Montaggio dell'app.
   Si lancia da qualunque cartella: `npm run build` (oppure `node sorgenti/build.js`).
   Legge soltanto i file di sorgenti/ e scrive due uscite:
     dist/pubblica/   l'app pubblica (la sola cartella che il sito pubblica)
     dist/redazione/  l'app della redazione (uguale alla pubblica fino al blocco 8 del piano)
   In ogni uscita JavaScript e CSS stanno in file propri, non dentro la pagina; i moduli separati di sorgenti/moduli/
   (testi come testo, memoria del telefono, formato degli eventi, quadranti, lettura dell'archivio) stanno in moduli.js,
   caricato prima dell'app.
   Ogni uscita contiene anche licenze/: titolari, licenze e testi integrali dei componenti di terzi
   (sorgenti/licenze.js, da COMPONENTI_DI_TERZI.md e licenze/), e lib/: librerie e caratteri di terzi
   a versione fissa, copiati da sorgenti/vendor/ con accanto il testo della loro licenza (T-007; dal blocco 3 anche
   lettore PMTiles, stili, icone e glifi della mappa, T-017), e anteprime/:
   i contenuti d'esempio di Agorà e Progetti, un file per lingua (sorgenti/contenuti_esempio.js, T-015).
   Alla fine controlla la sintassi di ogni file JavaScript prodotto (node --check).

   Nome, titolare, caselle, indirizzi e versioni dei testi vengono da sorgenti/config.js:
   il montaggio la scrive in ogni uscita come config.js (window.AGR_CONFIG) e ne inserisce i valori
   nella pagina e nei testi legali al posto dei segnaposto {nome}, {titolare}, {casella_contatto},
   {versione_legali} e {data_legali}.

   Opzioni:
     --uscita=<cartella>   cartella delle uscite, relativa alla radice del repository (predefinita: dist)
     --nome=<nome>         monta con un altro nome (copie di prova: npm run build:prova-nome)
     --solo=pubblica       scrive soltanto l'uscita pubblica
*/
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { fileLicenze } = require('./licenze.js');
const { fileAnteprime } = require('./contenuti_esempio.js');
const VENDOR = require('./vendor/elenco.js');

const SORGENTI = __dirname;
const RADICE = path.resolve(SORGENTI, '..');
const PARTI = path.join(SORGENTI, 'parti');
const MODULI = path.join(SORGENTI, 'moduli');
const DATI = path.join(SORGENTI, 'dati');

const opz = Object.fromEntries(process.argv.slice(2)
  .filter(a => a.startsWith('--'))
  .map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));

const leggi = (...p) => fs.readFileSync(path.join(...p), 'utf8');

/* ---------- Configurazione ---------- */
function configurazione() {
  const cfg = JSON.parse(JSON.stringify(require(path.join(SORGENTI, 'config.js'))));
  if (typeof opz.nome === 'string') cfg.nome = opz.nome;
  if (!cfg.nome || !String(cfg.nome).trim()) throw new Error('config.js: manca il nome del servizio');
  if (!cfg.titolare) throw new Error('config.js: manca il titolare');
  if (!cfg.caselle || !cfg.caselle.contatto) throw new Error('config.js: manca la casella di contatto');
  const li = cfg.testi && cfg.testi.legali_in_app;
  if (!li || !/^\d{4}-\d{2}$/.test(li.data || '')) throw new Error('config.js: testi.legali_in_app.data deve essere AAAA-MM');
  return cfg;
}

const escH = require('./moduli/testo.js').esc;   // la stessa funzione dell'app (T-024)
const segnaposto = s => /^\[.*\]$/.test(String(s));
// «2026-03» → «Marzo 2026» (italiano), «March 2026» (inglese)…
function meseAnno(aaaamm, lingua) {
  const [a, m] = aaaamm.split('-').map(Number);
  const t = new Intl.DateTimeFormat(lingua, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(a, m - 1, 1)));
  return t.charAt(0).toLocaleUpperCase(lingua) + t.slice(1);
}
// Riempie i segnaposto di un testo HTML con i valori della configurazione (già protetti per l'HTML).
function riempi(html, cfg, lingua) {
  const c = cfg.caselle.contatto;
  const v = {
    nome: escH(cfg.nome),
    titolare: escH(cfg.titolare),
    casella_contatto: segnaposto(c) ? `<span class="segnaposto">${escH(c)}</span>` : `<a href="mailto:${escH(c)}">${escH(c)}</a>`,
    versione_legali: escH(cfg.testi.legali_in_app.versione),
    data_legali: escH(meseAnno(cfg.testi.legali_in_app.data, lingua)),
  };
  return html.replace(/\{(nome|titolare|casella_contatto|versione_legali|data_legali)\}/g, (_, k) => v[k]);
}

/* ---------- Librerie e caratteri ospitati con l'app (T-007) ---------- */
const VENDOR_DIR = path.join(SORGENTI, 'vendor');
// I file di sorgenti/vendor/ in lib/, ciascuno controllato sull'impronta annotata in vendor/elenco.js.
function fileVendor() {
  const file = {};
  for (const c of VENDOR) {
    for (const [f, impronta] of Object.entries(c.file)) {
      const dati = fs.readFileSync(path.join(VENDOR_DIR, c.cartella, f));
      if (crypto.createHash('sha256').update(dati).digest('hex') !== impronta)
        throw new Error('sorgenti/vendor/' + c.cartella + '/' + f + ': il file non corrisponde all\'impronta annotata in vendor/elenco.js');
      file['lib/' + c.cartella + '/' + f] = dati;
    }
    file['lib/' + c.cartella + '/' + (c.nomeLicenza || 'LICENSE.txt')] = fs.readFileSync(path.join(RADICE, 'licenze', c.licenza), 'utf8');
  }
  file['lib/caratteri/caratteri.css'] = leggi(VENDOR_DIR, 'caratteri.css');
  return file;
}
// Percorso di un file di libreria nell'uscita, a partire dal nome del file (es. «maplibre-gl.js»).
function lib(nome) {
  const c = VENDOR.find(x => nome in x.file);
  if (!c) throw new Error('vendor/elenco.js: manca ' + nome);
  return 'lib/' + c.cartella + '/' + nome;
}

// Percorso di una cartella di terzi nell'uscita, a partire dall'inizio del suo nome (es. «pmtiles-»).
function cartellaLib(inizio) {
  const c = VENDOR.filter(x => x.cartella.startsWith(inizio));
  if (c.length !== 1) throw new Error('vendor/elenco.js: serve una sola cartella che comincia con ' + inizio);
  return 'lib/' + c[0].cartella + '/';
}
// Percorsi di stili, icone e glifi della mappa (T-017), resi assoluti nel browser: MapLibre li vuole così.
function mappaLib() {
  const m = { stili: cartellaLib('protomaps-basemaps-'), icone: cartellaLib('protomaps-icone-'), glifi: cartellaLib('caratteri-mappa/') };
  return 'const MAPPA_LIB = Object.fromEntries(Object.entries(' + JSON.stringify(m) + ').map(([k, v]) => [k, new URL(v, location.href).href]));';
}

// Strato delle correzioni e delle aggiunte della mappa (T-018): mappa/correzioni.geojson, controllato prima di montare.
// Ogni voce dice che cosa fa (nascondi | aggiunta), quando (data) e perché (motivo); il formato è in mappa/LEGGIMI.md.
const LIVELLI_MAPPA = ['earth', 'landcover', 'landuse', 'water', 'roads', 'transit', 'buildings', 'pois', 'places', 'boundaries'];
function correzioniMappa() {
  const testo = fs.readFileSync(path.join(RADICE, 'mappa', 'correzioni.geojson'), 'utf8');
  const j = JSON.parse(testo), no = m => { throw new Error('mappa/correzioni.geojson: ' + m); };
  if (j.type !== 'FeatureCollection' || !Array.isArray(j.features)) no('serve una FeatureCollection con features');
  j.features.forEach((f, i) => {
    const p = (f && f.properties) || {}, g = f && f.geometry, n = 'voce ' + (i + 1) + ': ';
    if (!f || f.type !== 'Feature') no(n + 'non è una Feature');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.data || '') || !String(p.motivo || '').trim()) no(n + 'servono data (AAAA-MM-GG) e motivo');
    if (p.correzione === 'nascondi') {
      if (!LIVELLI_MAPPA.includes(p.livello) || !Number.isSafeInteger(p.id_mappa)) no(n + '«nascondi» vuole livello (' + LIVELLI_MAPPA.join(', ') + ') e id_mappa numerico');
    } else if (p.correzione === 'aggiunta') {
      if (!g || g.type !== 'Point' || !Array.isArray(g.coordinates) || !g.coordinates.slice(0, 2).every(Number.isFinite) || !String(p.nome || '').trim()) no(n + '«aggiunta» vuole un punto e il nome');
    } else no(n + 'correzione deve essere «nascondi» o «aggiunta»');
  });
  return testo;
}

/* ---------- Ordine dei pezzi ---------- */
// Moduli separati (QB-1), montati in moduli.js prima dell'app, nell'ordine in cui dipendono l'uno dall'altro:
// testi come testo (T-024), memoria del telefono (T-026), formato degli eventi (T-020), quadranti (T-021), lettura
// dell'archivio (T-022), mappa conservata sul telefono (T-029), avvisi delle novità (T-031).
// Nel browser stanno in window.AGR_MODULI.
const JS_MODULI = ['testo.js', 'memoria.js', 'eventi.js', 'quadranti.js', 'archivio.js', 'mappa-locale.js', 'avvisi.js'];
// Un solo modulo JavaScript, in quest'ordine (app1 apre, app6 chiude).
const JS_APP = ['app1.js', 'app2.js', 'app3.js', 'app4.js', 'app5.js', 'app7.js',
  'misure_kpi.js', 'misure.js', 'storico.js', 'app6.js'];
const CSS = ['style.css', 'style2.css', 'style_temi.css', 'style_sezioni.css', 'style_misure.css'];

/* ---------- Montaggio ---------- */
function monta(cfg) {
  const caratteri = leggi(VENDOR_DIR, 'caratteri.css');
  const strati = leggi(DATI, 'strati.js').replace(/^\/\*[^\n]*\*\/\n/, '').replace(/\n$/, '');
  const leg = JSON.parse(leggi(DATI, 'legali_tradotti.json'));
  for (const l of Object.keys(leg)) for (const k of Object.keys(leg[l])) leg[l][k] = riempi(leg[l][k], cfg, l);
  const legali = 'const LEGALI = ' + JSON.stringify(leg) + ';';
  const legaliIt = riempi(leggi(PARTI, 'legali_it.html').replace(/\n$/, ''), cfg, 'it');

  let app = JS_APP.map(f => leggi(PARTI, f)).join('\n');
  for (const k of ['LAYERS', 'LEGALI', 'MAPPA_LIB']) if (!app.includes('/*@@' + k + '@@*/')) throw new Error('Segnaposto ' + k + ' mancante nei pezzi JavaScript');
  app = app.replace('/*@@LAYERS@@*/', () => strati).replace('/*@@LEGALI@@*/', () => legali).replace('/*@@MAPPA_LIB@@*/', () => mappaLib());

  const traduzioni = fs.existsSync(path.join(PARTI, 'traduzioni.js')) ? leggi(PARTI, 'traduzioni.js') : 'window.AGR_TR={};';
  const css = CSS.map(f => leggi(PARTI, f)).join('\n');
  const sezioni = leggi(PARTI, 'sezioni.js');
  const moduli = JS_MODULI.map(f => leggi(MODULI, f)).join('\n');

  const file = {
    'config.js': '/* Configurazione montata da sorgenti/config.js: non modificare qui. */\nwindow.AGR_CONFIG = ' + JSON.stringify(cfg, null, 1) + ';\n',
    'app.css': css + '\n',
    'traduzioni.js': traduzioni + '\n',
    'moduli.js': moduli + '\n',
    'app.js': app + '\n',
    'sezioni.js': sezioni + '\n',
  };
  // Il numero di versione nei collegamenti cambia quando cambia il file: il telefono non tiene copie vecchie.
  const v = f => crypto.createHash('sha256').update(file[f]).digest('hex').slice(0, 10);

  file['index.html'] = `<!DOCTYPE html>
<!-- App montata da sorgenti/build.js: non modificare questo file, si cambia nei sorgenti. -->
<html lang="it" data-theme="light" data-versione="@@VERSIONE@@">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="${escH((cfg.aspetto || {}).colore_tema || '#FFFDF8')}">
<meta name="referrer" content="no-referrer">
<title>${escH(cfg.nome)} — Torino</title>
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icone/icona-180.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${escH(cfg.nome)}">
<link rel="stylesheet" href="lib/caratteri/caratteri.css?v=${crypto.createHash('sha256').update(caratteri).digest('hex').slice(0, 10)}">
<link rel="stylesheet" href="${escH(lib('maplibre-gl.css'))}">
<link rel="stylesheet" href="app.css?v=${v('app.css')}">
</head>
<body>
${riempi(leggi(PARTI, 'body.html'), cfg, 'it')}
<!-- Testi legali: quelli dell'app online OG 1.7 (v1.2), invariati -->
${legaliIt}
<script src="${escH(lib('maplibre-gl.js'))}"></script>
<script src="${escH(lib('pmtiles.js'))}"></script>
<script src="config.js?v=${v('config.js')}"></script>
<script src="traduzioni.js?v=${v('traduzioni.js')}"></script>
<script src="moduli.js?v=${v('moduli.js')}"></script>
<script src="app.js?v=${v('app.js')}"></script>
<script src="sezioni.js?v=${v('sezioni.js')}"></script>
</body>
</html>
`;
  file['mappa/correzioni.geojson'] = correzioniMappa();
  // Contenuti d'esempio di Agorà e Progetti, un file per lingua (T-015): l'app li scarica quando servono.
  Object.assign(file, fileAnteprime(cfg));
  return file;
}

/* ---------- App installabile e senza rete (T-028, T-029, T-031) ----------
   A un'uscita completa (app, licenze, librerie) si aggiungono: le icone e il manifest, che rendono l'app installabile;
   avvisi.json, il piccolo file degli avvisi delle novità; emergenza.json, l'interruttore d'emergenza; il numero di
   versione, ricavato dal contenuto di tutti i file; e sw.js, il service worker, con l'elenco dei file dell'app e la
   loro impronta. avvisi.json ed emergenza.json non stanno nella copia dell'app: il telefono li chiede sempre alla rete. */
const ICONE = [180, 192, 512];
const SEMPRE_DALLA_RETE = ['avvisi.json', 'emergenza.json', 'sw.js'];
const impronta = dati => crypto.createHash('sha256').update(dati).digest('hex').slice(0, 10);
const pigro = f => /^lib\/sheetjs-[^/]+\/.*\.js$/.test(f);   // serve solo all'area riservata: si conserva quando la si usa
function completa(file, cfg) {
  file = { ...file };
  for (const n of ICONE) file[`icone/icona-${n}.png`] = fs.readFileSync(path.join(SORGENTI, 'icone', `icona-${n}.png`));
  const a = cfg.aspetto || {};
  file['manifest.webmanifest'] = JSON.stringify({
    name: cfg.nome, short_name: cfg.nome, lang: 'it', start_url: './index.html', scope: './', display: 'standalone',
    background_color: a.colore_sfondo || '#F5F0E8', theme_color: a.colore_tema || '#FFFDF8',
    icons: [192, 512].map(n => ({ src: `icone/icona-${n}.png`, sizes: `${n}x${n}`, type: 'image/png', purpose: 'any maskable' })),
  }, null, 1) + '\n';

  const AVVISI = require('./moduli/avvisi.js'), avvisi = leggi(SORGENTI, 'testi', 'avvisi.json');
  const sbagli = AVVISI.errori(JSON.parse(avvisi));
  if (sbagli.length) throw new Error('sorgenti/testi/avvisi.json: ' + sbagli.join('; '));
  file['avvisi.json'] = avvisi;
  const emergenza = leggi(SORGENTI, 'emergenza.json'), em = JSON.parse(emergenza);
  if (!em || !Array.isArray(em.scarta) || !em.scarta.every(v => typeof v === 'string')) throw new Error('sorgenti/emergenza.json: serve {"scarta": [versioni]}');
  file['emergenza.json'] = emergenza;

  if (!file['index.html'].includes('@@VERSIONE@@')) throw new Error('index.html: manca il posto del numero di versione');
  const elenco = Object.keys(file).filter(f => !SEMPRE_DALLA_RETE.includes(f)).sort();
  const versione = impronta(elenco.map(f => f + ' ' + impronta(file[f])).join('\n')).slice(0, 7);
  file['index.html'] = file['index.html'].split('@@VERSIONE@@').join(versione);
  const copia = Object.fromEntries(elenco.map(f => [f, impronta(file[f])]));

  let sw = leggi(SORGENTI, 'sw.js');
  for (const k of ['VERSIONE', 'COPIA', 'PIGRI']) if (!sw.includes('/*@@' + k + '@@*/')) throw new Error('sw.js: manca il segnaposto ' + k);
  sw = sw.replace("/*@@VERSIONE@@*/''", () => JSON.stringify(versione)).replace('/*@@COPIA@@*/{}', () => JSON.stringify(copia)).replace('/*@@PIGRI@@*/[]', () => JSON.stringify(elenco.filter(pigro)));
  file['sw.js'] = '/* Service worker montato da sorgenti/build.js (sorgenti/moduli/memoria.js e sorgenti/sw.js): non modificare qui. */\n' + leggi(MODULI, 'memoria.js') + '\n' + sw;
  return file;
}
// Tutti i file di un'uscita, come {percorso: testo o Buffer}.
function uscita(cfg) { return completa({ ...monta(cfg), ...fileLicenze(cfg), ...fileVendor() }, cfg); }

/* ---------- Scrittura delle uscite ---------- */
function scrivi(cartella, file) {
  const dentro = path.relative(RADICE, cartella);
  if (!dentro || dentro.startsWith('..') || path.isAbsolute(dentro)) throw new Error('Uscita fuori dal repository: ' + cartella);
  fs.rmSync(cartella, { recursive: true, force: true });
  fs.mkdirSync(cartella, { recursive: true });
  for (const [nome, testo] of Object.entries(file)) {
    fs.mkdirSync(path.dirname(path.join(cartella, nome)), { recursive: true });
    fs.writeFileSync(path.join(cartella, nome), testo);
  }
}

function controllaSintassi(cartella) {
  for (const f of fs.readdirSync(cartella).filter(f => f.endsWith('.js'))) {
    try { execFileSync(process.execPath, ['--check', path.join(cartella, f)], { stdio: 'pipe' }); }
    catch (e) { throw new Error('Errore di sintassi in ' + path.join(cartella, f) + '\n' + e.stderr); }
  }
}

function main() {
  const base = path.resolve(RADICE, typeof opz.uscita === 'string' ? opz.uscita : 'dist');
  const cfg = configurazione();
  const file = uscita(cfg);
  const uscite = opz.solo === 'pubblica' ? ['pubblica'] : ['pubblica', 'redazione'];
  for (const u of uscite) {
    const c = path.join(base, u);
    scrivi(c, file);
    controllaSintassi(c);
  }
  console.log('Montaggio riuscito: ' + uscite.map(u => path.relative(RADICE, path.join(base, u)) + '/').join(', ') +
    ' (index.html ' + Math.round(file['index.html'].length / 1024) + ' KB, app.js ' + Math.round(file['app.js'].length / 1024) + ' KB)');
}

if (require.main === module) {
  try { main(); } catch (e) { console.error(e.message); process.exit(1); }
}
module.exports = { monta, configurazione, riempi, fileVendor, completa, uscita, SEMPRE_DALLA_RETE };
