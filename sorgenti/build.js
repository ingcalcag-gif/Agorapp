#!/usr/bin/env node
/* Montaggio dell'app.
   Si lancia da qualunque cartella: `npm run build` (oppure `node sorgenti/build.js`).
   Legge soltanto i file di sorgenti/ e scrive due uscite:
     dist/pubblica/   l'app pubblica (la sola cartella che il sito pubblica)
     dist/redazione/  l'app della redazione: lo stesso codice, con in più gli strumenti di sorgenti/redazione/ (T-033)
   Due app dallo stesso codice (libro mastro, § 2.4): nell'app pubblica non entra nessuna riga degli strumenti della
   Redazione. I pezzi comuni segnano i tratti di una sola app con tre segni, scritti ciascuno dentro un commento
   (di JavaScript e CSS, oppure di HTML): @red apre un tratto solo della redazione, @pub un tratto solo della pubblica,
   @fine lo chiude. Il montaggio toglie i tratti dell'altra app e i segni; i file di sorgenti/redazione/ entrano
   soltanto nell'app della redazione.
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
   nella pagina al posto dei segnaposto {nome}, {titolare} e {casella_contatto}.
   I quattro testi pubblicati (informativa, «Dati locali», note legali, condizioni d'uso; T-055) vengono da
   sorgenti/testi/<lingua>/ attraverso sorgenti/testi-pubblicati.js: modelli nella pagina dell'app e pagine di solo testo
   in testi/. L'app pubblica ha anche robots.txt e .well-known/tdmrep.json, la riserva dell'estrazione di testo e di dati
   leggibile dalle macchine (T-056; sorgenti/robots.txt e sorgenti/.well-known/tdmrep.json).

   Opzioni:
     --uscita=<cartella>   cartella delle uscite, relativa alla radice del repository (predefinita: dist)
     --nome=<nome>         monta con un altro nome (copie di prova: npm run build:prova-nome)
     --solo=pubblica       scrive soltanto l'uscita pubblica
     --leggibile           non compatta il codice (per cercare un errore; le prove vogliono le uscite compattate)

   Compattazione e controllo finale (T-060): app.js, moduli.js e sezioni.js escono compattati con terser (versione
   fissata in sorgenti/package.json; npm ci in sorgenti/), che toglie commenti e spazi e accorcia i nomi interni, lasciando
   i nomi globali e i commenti di licenza («/*!», @license, @preserve); app.css perde commenti e spazi. Prima di scrivere,
   il controllo finale rifiuta l'uscita se contiene un indirizzo esterno non ammesso da config.js o qualcosa che sembra una
   chiave (sorgenti/controllo-uscita.js). Il modello delle intestazioni di sicurezza sta in sorgenti/intestazioni.json.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { fileLicenze } = require('./licenze.js');
const { testiPubblicati, metaRiserva, politica } = require('./testi-pubblicati.js');
const { compattaJs, compattaCss, controlloFinale } = require('./controllo-uscita.js');
const { fileAnteprime } = require('./contenuti_esempio.js');
const VENDOR = require('./vendor/elenco.js');

const SORGENTI = __dirname;
const RADICE = path.resolve(SORGENTI, '..');
const PARTI = path.join(SORGENTI, 'parti');
const REDAZIONE = path.join(SORGENTI, 'redazione');
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
  if (!cfg.caselle.autorita) throw new Error('config.js: manca la casella per le autorità');
  return cfg;
}

const escH = require('./moduli/testo.js').esc;   // la stessa funzione dell'app (T-024)
const segnaposto = s => /^\[.*\]$/.test(String(s));
// Riempie i segnaposto della pagina con i valori della configurazione (già protetti per l'HTML).
function riempi(html, cfg) {
  const c = cfg.caselle.contatto;
  const v = {
    nome: escH(cfg.nome),
    titolare: escH(cfg.titolare),
    casella_contatto: segnaposto(c) ? `<span class="segnaposto">${escH(c)}</span>` : `<a href="mailto:${escH(c)}">${escH(c)}</a>`,
  };
  return html.replace(/\{(nome|titolare|casella_contatto)\}/g, (_, k) => v[k]);
}

/* ---------- Librerie e caratteri ospitati con l'app (T-007) ---------- */
const VENDOR_DIR = path.join(SORGENTI, 'vendor');
// I file di sorgenti/vendor/ in lib/, ciascuno controllato sull'impronta annotata in vendor/elenco.js.
// Un componente con «solo: 'redazione'» viaggia soltanto con quell'app (dal blocco 10 non ce ne sono: i file Excel li fa
// il modulo sorgenti/moduli/excel.js).
const delVendor = quale => VENDOR.filter(c => !c.solo || c.solo === quale);
function fileVendor(quale = 'pubblica') {
  const file = {};
  for (const c of delVendor(quale)) {
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

/* ---------- Due app dallo stesso codice (T-033) ---------- */
const APP = ['pubblica', 'redazione'];
const SEGNI = { red: 'redazione', pub: 'pubblica' };
// Toglie da un pezzo i tratti dell'altra app e tutti i segni. I tratti non si annidano.
function taglia(testo, quale, nome) {
  const re = /(?:\/\*|<!--)@(red|pub|fine)(?:\*\/|-->)/g;
  let out = '', i = 0, aperto = null, tieni = true, m;
  while ((m = re.exec(testo))) {
    const riga = testo.slice(0, m.index).split('\n').length;
    if (m[1] === 'fine') {
      if (!aperto) throw new Error(nome + ', riga ' + riga + ': @fine senza @red o @pub');
      if (tieni) out += testo.slice(i, m.index);
      aperto = null;
    } else {
      if (aperto) throw new Error(nome + ', riga ' + riga + ': @' + m[1] + ' dentro @' + aperto);
      out += testo.slice(i, m.index);
      aperto = m[1]; tieni = SEGNI[m[1]] === quale;
    }
    i = re.lastIndex;
  }
  if (aperto) throw new Error(nome + ': @' + aperto + ' senza @fine');
  return out + testo.slice(i);
}

/* ---------- Ordine dei pezzi ---------- */
// Moduli separati (QB-1), montati in moduli.js prima dell'app, nell'ordine in cui dipendono l'uno dall'altro:
// testi come testo (T-024), memoria del telefono (T-026), formato degli eventi (T-020), eventi nascosti (T-045, T-046),
// quadranti (T-021), lettura dell'archivio (T-022), mappa conservata sul telefono (T-029), avvisi delle novità (T-031),
// segnalazione di un evento con la busta chiusa e il piccolo compito (T-050-T-052).
// Nel browser stanno in window.AGR_MODULI.
const JS_MODULI = ['testo.js', 'memoria.js', 'eventi.js', 'nascosti.js', 'quadranti.js', 'archivio.js', 'mappa-locale.js', 'avvisi.js', 'segnalazione.js'];
// Solo nell'app della redazione: chiavi, cassaforte e marcatore (T-034, T-037); pacchetto firmato (T-038); file Excel
// letti e scritti con codice nostro (T-042, decisione del 24/11/2026: al posto di SheetJS); le parole delle password
// degli eventi nascosti (T-045, decisione del 25/11/2026); i nomi di persona nei testi degli eventi, per gli strumenti dei
// diritti delle persone (T-047-T-049).
// Dal blocco 14: il controllo dei file cifrati dell'archivio dei registri (T-053) e la copia di sicurezza degli eventi (T-054).
const JS_MODULI_RED = ['chiavi.js', 'pacchetto.js', 'excel.js', 'parole-nascosti.js', 'nomi.js', 'file-cifrati.js', 'copia-eventi.js'];
// Solo nell'app della redazione, finché non c'è Bunny (T-065): la logica dello sportello di pubblicazione, che lo sportello
// di prova fa girare nel browser (T-038), e i confini delle regioni che le servono per i numeri dell'indice.
// Dal blocco 14 anche la logica dello sportello dell'archivio dei registri (T-053).
const SPORTELLI_RED = ['pubblicazione.js', 'archivio.js'];
// In tutte e due le app: la logica dello sportello delle segnalazioni (T-051). Sul collegamento di prova l'app pubblica
// la fa girare nel browser per depositare (porta aperta) e l'app della redazione per leggere (porta firmata), sullo
// stesso archivio finto dello sportello di prova; altrove non si usa (decisione del 26/11/2026).
const SPORTELLI = ['segnalazioni.js'];
// Un solo modulo JavaScript, in quest'ordine (app1 apre, app6 chiude). Gli strumenti della Redazione (sorgenti/redazione/)
// entrano prima di app6, soltanto nell'app della redazione.
const JS_APP = ['app1.js', 'app2.js', 'app3.js', 'app4.js', 'app5.js', 'app7.js'];
// Gli strumenti dei diritti delle persone (blocco 12) vengono dopo gli altri, perché si aggiungono a ciò che quelli
// preparano (DIRITTI, FOGLI_RED, fogliPb, OP_STORICO). «Esporta per assistenza» (T-049) sta da solo nel suo file: con
// un no nella revisione finale del libro mastro si toglie da qui e dal disco, insieme alla sua prova. Le segnalazioni
// (blocco 13, T-052) stanno dopo «Togli questo nome ovunque», a cui passano la richiesta sul proprio nome. L'archivio dei
// registri e la copia di sicurezza degli eventi (blocco 14, T-053 e T-054) chiudono l'elenco: usano la pubblicazione.
const JS_RED = ['strumenti.js', 'chiavi-viste.js', 'sportello-prova.js', 'pubblicazione.js', 'registro-fonti.js', 'scheda-pubblicazione.js', 'eventi-nascosti.js', 'importa-excel.js', 'registro-excel.js', 'importa-calendari.js', 'misure_kpi.js', 'misure.js', 'storico.js',
  'togli-nome.js', 'ricerca-nome.js', 'esporta-assistenza.js', 'segnalazioni.js', 'archivio.js', 'copia-sicurezza.js'];
const JS_FINE = ['app6.js'];
const CSS = ['style.css', 'style2.css', 'style_temi.css', 'style_sezioni.css'];
const CSS_RED = ['style_redazione.css', 'style_misure.css'];

/* Le traduzioni dell'app pubblica: senza i testi che compaiono soltanto negli strumenti della Redazione. Un testo è
   «solo della redazione» se sta scritto nei file di sorgenti/redazione/ e in nessun pezzo dell'app pubblica. */
function traduzioniPubbliche(traduzioni, pubblici, redazione) {
  const m = traduzioni.match(/^([\s\S]*?window\.AGR_TR\s*=\s*)(\{[\s\S]*\})(;?\s*)$/);
  if (!m) throw new Error('traduzioni.js: non trovo window.AGR_TR = {…}');
  const tr = JSON.parse(m[2]);
  const scritto = (testo, k) => testo.includes(k) || testo.includes(k.replace(/'/g, "\\'"));
  for (const lingua of Object.keys(tr)) for (const k of Object.keys(tr[lingua]))
    if (scritto(redazione, k) && !scritto(pubblici, k)) delete tr[lingua][k];
  return m[1] + JSON.stringify(tr) + m[3];
}

/* ---------- Montaggio ---------- */
function monta(cfg, quale = 'pubblica', opzioni = {}) {
  const leggibile = !!(opzioni.leggibile || opz.leggibile);
  if (!APP.includes(quale)) throw new Error('monta: app sconosciuta «' + quale + '»');
  const red = quale === 'redazione';
  const pezzo = (cartella, f) => taglia(leggi(cartella, f), quale, path.relative(SORGENTI, path.join(cartella, f)));
  const caratteri = leggi(VENDOR_DIR, 'caratteri.css');
  const strati = leggi(DATI, 'strati.js').replace(/^\/\*[^\n]*\*\/\n/, '').replace(/\n$/, '');
  const { modelli } = testiPubblicati(cfg);

  let app = JS_APP.map(f => pezzo(PARTI, f)).concat(red ? JS_RED.map(f => pezzo(REDAZIONE, f)) : [], JS_FINE.map(f => pezzo(PARTI, f))).join('\n');
  for (const k of ['LAYERS', 'MAPPA_LIB']) if (!app.includes('/*@@' + k + '@@*/')) throw new Error('Segnaposto ' + k + ' mancante nei pezzi JavaScript');
  app = app.replace('/*@@LAYERS@@*/', () => strati).replace('/*@@MAPPA_LIB@@*/', () => mappaLib());

  const sezioni = pezzo(PARTI, 'sezioni.js');
  const corpo = pezzo(PARTI, 'body.html');
  let traduzioni = fs.existsSync(path.join(PARTI, 'traduzioni.js')) ? leggi(PARTI, 'traduzioni.js') : 'window.AGR_TR={};';
  if (!red) {
    const tutti = c => fs.readdirSync(c).filter(f => /\.(js|html|json)$/.test(f) && f !== 'traduzioni.js').map(f => leggi(c, f)).join('\n');
    // anche le pagine di solo testo dei testi pubblicati (testi-pubblicati.js), montate con le stesse traduzioni
    const pubblici = [app, sezioni, corpo, strati, leggi(SORGENTI, 'contenuti_esempio.js'), leggi(SORGENTI, 'testi-pubblicati.js'), tutti(DATI), tutti(MODULI), fs.existsSync(path.join(SORGENTI, 'anteprime')) ? tutti(path.join(SORGENTI, 'anteprime')) : ''].join('\n');
    traduzioni = traduzioniPubbliche(traduzioni, pubblici, tutti(REDAZIONE));
  }
  const css = CSS.map(f => pezzo(PARTI, f)).concat(red ? CSS_RED.map(f => pezzo(REDAZIONE, f)) : []).join('\n');
  const moduli = JS_MODULI.map(f => leggi(MODULI, f)).concat(red ? JS_MODULI_RED.map(f => leggi(MODULI, f)) : [], red ? SPORTELLI_RED.map(f => leggi(RADICE, 'sportelli', f)) : [],
    SPORTELLI.map(f => leggi(RADICE, 'sportelli', f)),
    red ? ['(window.AGR_MODULI = window.AGR_MODULI || {}).regioni = ' + JSON.stringify(JSON.parse(leggi(DATI, 'regioni.json')).regioni) + ';'] : []).join('\n');

  const file = {
    // gli interruttori degli strumenti della Redazione (funzioni, T-049) restano fuori dall'app pubblica
    'config.js': '/* Configurazione montata da sorgenti/config.js: non modificare qui. */\nwindow.AGR_CONFIG = ' + JSON.stringify(red ? cfg : Object.assign({}, cfg, { funzioni: undefined }), null, 1) + ';\n',
    'app.css': compattaCss(css, leggibile) + '\n',
    'traduzioni.js': traduzioni + '\n',
    'moduli.js': compattaJs(moduli, 'moduli.js', leggibile) + '\n',
    'app.js': compattaJs(app, 'app.js', leggibile) + '\n',
    'sezioni.js': compattaJs(sezioni, 'sezioni.js', leggibile) + '\n',
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
<meta name="referrer" content="no-referrer">${red ? '\n<meta name="robots" content="noindex, nofollow">' : ''}
${metaRiserva(cfg)}
<link rel="privacy-policy" href="testi/it/informativa.html">
<link rel="terms-of-service" href="testi/it/condizioni-uso.html">
<title>${escH(cfg.nome)}${red ? ' · Redazione' : ''} — Torino</title>
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icone/icona-180.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${escH(red ? 'Redazione' : cfg.nome)}">
<link rel="stylesheet" href="lib/caratteri/caratteri.css?v=${crypto.createHash('sha256').update(caratteri).digest('hex').slice(0, 10)}">
<link rel="stylesheet" href="${escH(lib('maplibre-gl.css'))}">
<link rel="stylesheet" href="app.css?v=${v('app.css')}">
</head>
<body>
${riempi(corpo, cfg)}
<!-- I quattro testi pubblicati (sorgenti/testi/, T-055): il foglio «Informazioni legali» li mostra da qui -->
${modelli}
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
const pigro = f => false;   // file da conservare solo al primo uso: dal blocco 10 nessuno (SheetJS è uscito con T-042)

/* ---------- Riserva dell'estrazione di testo e di dati leggibile dalle macchine (T-056; libro mastro, § 6.5, § 12.3) ----------
   Nell'app pubblica: robots.txt, che nega l'accesso ai programmi di raccolta dichiarati per l'addestramento di sistemi di
   intelligenza artificiale o per l'estrazione di dati (elenco in sorgenti/robots.txt, da rivedere a ogni riesame prima di
   un rilascio), e .well-known/tdmrep.json, la riserva secondo il protocollo TDMRep (W3C Community Group, 2024), con il
   rinvio alle condizioni d'uso (tdm-policy) quando l'indirizzo pubblico c'è. Valgono soltanto alla radice di un indirizzo.
   Le pagine portano gli stessi metadati (metaRiserva), i file degli eventi il campo «tdm-reservation» (T-020).
   Nessuno dei due file entra nella copia dell'app sul telefono: l'app non li legge. */
const PER_I_PROGRAMMI = ['robots.txt', '.well-known/tdmrep.json'];
function fileRiserva(cfg) {
  const robots = leggi(SORGENTI, 'robots.txt');
  const righe = robots.split('\n').map(r => r.trim()).filter(r => r && !r.startsWith('#'));
  for (const r of righe) if (!/^(User-agent|Disallow): ?[^\s]*$/.test(r)) throw new Error('sorgenti/robots.txt: riga non ammessa «' + r + '»');
  if (righe.slice(-2).join('\n') !== 'User-agent: *\nDisallow:') throw new Error('sorgenti/robots.txt: deve chiudere con «User-agent: *» e «Disallow:» (gli altri programmi sono ammessi)');
  const regole = JSON.parse(leggi(SORGENTI, '.well-known', 'tdmrep.json'));
  if (!Array.isArray(regole) || !regole.length || !regole.every(x => x && typeof x.location === 'string' && x.location.startsWith('/') && x['tdm-reservation'] === 1))
    throw new Error('sorgenti/.well-known/tdmrep.json: serve un elenco di regole {"location": "/…", "tdm-reservation": 1}');
  const p = politica(cfg);
  const tdm = regole.map(x => p && !x['tdm-policy'] ? Object.assign({}, x, { 'tdm-policy': p }) : x);
  return { 'robots.txt': robots, '.well-known/tdmrep.json': JSON.stringify(tdm, null, 1) + '\n' };
}

function completa(file, cfg, quale = 'pubblica') {
  file = { ...file };
  const red = quale === 'redazione';
  // L'app della redazione ha icona e manifest propri (T-033): un'altra icona sulla schermata Home, un altro nome.
  for (const n of ICONE) file[`icone/icona-${n}.png`] = fs.readFileSync(path.join(SORGENTI, 'icone', `${red ? 'redazione' : 'icona'}-${n}.png`));
  const a = cfg.aspetto || {};
  file['manifest.webmanifest'] = JSON.stringify({
    name: red ? cfg.nome + ' · Redazione' : cfg.nome, short_name: red ? 'Redazione' : cfg.nome, lang: 'it', start_url: './index.html', scope: './', display: 'standalone',
    background_color: a.colore_sfondo || '#F5F0E8', theme_color: a.colore_tema || '#FFFDF8',
    icons: [192, 512].map(n => ({ src: `icone/icona-${n}.png`, sizes: `${n}x${n}`, type: 'image/png', purpose: 'any maskable' })),
  }, null, 1) + '\n';
  // L'app della redazione chiede ai motori di ricerca di non essere indicizzata: nella pagina (monta) e con questo file,
  // che vale quando l'app sta alla radice del suo indirizzo (su Bunny, in Fase 2, si aggiunge l'intestazione).
  if (red) file['robots.txt'] = 'User-agent: *\nDisallow: /\n';
  else Object.assign(file, fileRiserva(cfg));

  const AVVISI = require('./moduli/avvisi.js'), avvisi = leggi(SORGENTI, 'testi', 'avvisi.json');
  const sbagli = AVVISI.errori(JSON.parse(avvisi));
  if (sbagli.length) throw new Error('sorgenti/testi/avvisi.json: ' + sbagli.join('; '));
  file['avvisi.json'] = avvisi;
  const emergenza = leggi(SORGENTI, 'emergenza.json'), em = JSON.parse(emergenza);
  if (!em || !Array.isArray(em.scarta) || !em.scarta.every(v => typeof v === 'string')) throw new Error('sorgenti/emergenza.json: serve {"scarta": [versioni]}');
  file['emergenza.json'] = emergenza;

  if (!file['index.html'].includes('@@VERSIONE@@')) throw new Error('index.html: manca il posto del numero di versione');
  const elenco = Object.keys(file).filter(f => !SEMPRE_DALLA_RETE.includes(f) && !PER_I_PROGRAMMI.includes(f)).sort();
  const versione = impronta(elenco.map(f => f + ' ' + impronta(file[f])).join('\n')).slice(0, 7);
  file['index.html'] = file['index.html'].split('@@VERSIONE@@').join(versione);
  const copia = Object.fromEntries(elenco.map(f => [f, impronta(file[f])]));

  let sw = leggi(SORGENTI, 'sw.js');
  for (const k of ['VERSIONE', 'COPIA', 'PIGRI']) if (!sw.includes('/*@@' + k + '@@*/')) throw new Error('sw.js: manca il segnaposto ' + k);
  sw = sw.replace("/*@@VERSIONE@@*/''", () => JSON.stringify(versione)).replace('/*@@COPIA@@*/{}', () => JSON.stringify(copia)).replace('/*@@PIGRI@@*/[]', () => JSON.stringify(elenco.filter(pigro)));
  // Il service worker resta leggibile (17 KB): le sue prime righe dicono versione e copia, e servono a capire un aggiornamento.
  file['sw.js'] = '/* Service worker montato da sorgenti/build.js (sorgenti/moduli/memoria.js e sorgenti/sw.js): non modificare qui. */\n' + leggi(MODULI, 'memoria.js') + '\n' + sw;
  return file;
}
// Tutti i file di un'uscita, come {percorso: testo o Buffer}.
/* opzioni.leggibile: senza compattazione (le prove che cercano nomi del codice usano questa forma, T-060) */
function uscita(cfg, quale = 'pubblica', opzioni = {}) {
  // la pagina delle licenze elenca i componenti che viaggiano con quell'app
  const fuori = VENDOR.filter(c => c.solo && c.solo !== quale).map(c => c.licenza);
  const file = completa({ ...monta(cfg, quale, opzioni), ...fileLicenze(cfg, fuori), ...testiPubblicati(cfg).file, ...fileVendor(quale) }, cfg, quale);
  controlloFinale(file, cfg, quale);   // si ferma se trova un indirizzo non ammesso o una chiave (T-060)
  return file;
}

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
  const uscite = opz.solo === 'pubblica' ? ['pubblica'] : APP;
  const fatte = [];
  for (const u of uscite) {
    const c = path.join(base, u), file = uscita(cfg, u);
    scrivi(c, file);
    controllaSintassi(c);
    fatte.push(path.relative(RADICE, c) + '/ (app.js ' + Math.round(file['app.js'].length / 1024) + ' KB)');
  }
  console.log('Montaggio riuscito: ' + fatte.join(', '));
}

if (require.main === module) {
  try { main(); } catch (e) { console.error(e.message); process.exit(1); }
}
module.exports = { monta, configurazione, riempi, fileVendor, completa, uscita, taglia, APP, SEMPRE_DALLA_RETE, PER_I_PROGRAMMI };
