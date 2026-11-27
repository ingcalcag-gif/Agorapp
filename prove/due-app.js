/* Prova: due app dallo stesso codice (voce T-033 del piano di adeguamento).

   Libro mastro, § 2.4: dallo stesso codice sorgente si producono l'app pubblica e l'app della redazione, che ha in più
   gli strumenti di lavoro, sta a un indirizzo separato, non è collegata dall'app pubblica ed è sottratta
   all'indicizzazione dei motori di ricerca. § 3.11: nessuna chiave nel codice; la vecchia password è uscita.

   1. I segni del montaggio (@red, @pub, @fine) fanno ciò che devono, e i tratti sbagliati fermano il montaggio.
   2. L'app pubblica montata non contiene nessuna riga degli strumenti della Redazione: accesso, importazione,
      esportazione, Misure, storico, chiavi, libreria di Excel, traduzioni dei loro testi.
   3. L'app della redazione montata ha gli strumenti, il manifest e l'icona propri, e chiede di non essere indicizzata.
   4. L'app pubblica non porta all'app della redazione.
   5. Ogni file di sorgenti/redazione/ entra nel montaggio (nessun file dimenticato), e nei pezzi comuni non resta
      nulla della vecchia area riservata. */
'use strict';
const fs = require('fs');
const path = require('path');
const { RADICE, DIST, leggiUscita, config, esito, eseguiDaSola } = require('./comune.js');
const { taglia } = require('../sorgenti/build.js');

/* Ciò che nell'app pubblica non deve comparire, in nessun file suo (le librerie di terzi non si guardano). */
const VIETATI = [
  [/agorapp2024|ADMIN_PW|adminpw|mostra-admin|entra-admin|esci-admin/, 'accesso con la password'],
  [/\bst\.admin\b|badgeAdmin|badgeRed|badge-red|badge-admin|admin-box|data-az="admin|data-modifica-admin|data-elimina-admin/, 'area riservata'],
  [/\bfAdmin\b|\bfImporta\b|fAdminForm|\baform\b|st\.importa|msgAdmin|fileImporta|leggiImport|esportaExcel|scaricaModello/, 'importazione ed esportazione'],
  [/XLSX|sheetjs|SheetJS|File Excel letti e scritti|MODULI\.excel|AGR_MODULI\)?\.excel/, 'file Excel della Redazione'],
  [/\bmz[A-Z]\w*|data-mz|clickMisure|misureConta|apriMisure|pagina-misure|sez-misure|MZ_KPI/, 'Misure'],
  [/foglioStorico|\bregistra\(|OP_STORICO|data-sh=/, 'storico delle operazioni'],
  [/FOGLI_RED|clickRed|azioneRed|inputRed|cambioRed|\bCHIAVI\b|fChiavi|fVerifica|fileRed|AGR_MODULI\)?\.chiavi|MODULI\.chiavi/, 'chiavi e strumenti della Redazione'],
  [/\bSPORTELLO\b|\bPB\b|fPubblica|fEventoForm|azionePubblica|clickPubblica|data-az="pb-|data-pbev|MODULI\.(?:sportello|pacchetto|regioni)|AGR_MODULI\)?\.(?:sportello|pacchetto|regioni)|pacchetto-redazione|copia-pubblicazione/, 'pubblicazione firmata e sportello'],
  [/@red\b|@pub\b|@fine\b/, 'segni del montaggio rimasti'],
];
const SUOI = /^(index\.html|app\.js|app\.css|sezioni\.js|config\.js|traduzioni\.js|moduli\.js|sw\.js|manifest\.webmanifest)$/;

function prova() {
  const e = esito('Due app dallo stesso codice');
  const err = s => e.errori.push(s);
  const cfg = config();

  /* ---------- 1. i segni ---------- */
  const T = 'a/*@red*/R/*@fine*/b/*@pub*/P/*@fine*/c<!--@red-->H<!--@fine-->d';
  if (taglia(T, 'pubblica', 'prova') !== 'abPcd') err('taglia: l\'app pubblica deve tenere solo i tratti comuni e quelli @pub');
  if (taglia(T, 'redazione', 'prova') !== 'aRbcHd') err('taglia: l\'app della redazione deve tenere solo i tratti comuni e quelli @red');
  for (const [t, perche] of [['/*@red*/a', 'un tratto non chiuso'], ['a/*@fine*/', 'una chiusura senza apertura'], ['/*@red*/a/*@pub*/b/*@fine*//*@fine*/', 'un tratto dentro un altro']]) {
    let fermato = false; try { taglia(t, 'pubblica', 'prova'); } catch (x) { fermato = true; }
    if (!fermato) err('taglia: ' + perche + ' deve fermare il montaggio');
  }

  /* ---------- 2. l'app pubblica ---------- */
  const pub = leggiUscita('pubblica'), red = leggiUscita('redazione');
  if (!Object.keys(pub).length || !Object.keys(red).length) { err('uscite mancanti: lancia npm run build'); return e; }
  for (const [f, t] of Object.entries(pub)) {
    if (!SUOI.test(f) || typeof t !== 'string') continue;
    for (const [re, che] of VIETATI) { const m = t.match(re); if (m) err(`dist/pubblica/${f}: contiene «${m[0]}» (${che}): nell'app pubblica non entra nessuna riga degli strumenti della Redazione`); }
  }
  for (const f of Object.keys(pub)) if (/^lib\/sheetjs|^licenze\/sheetjs/.test(f)) err(`dist/pubblica/${f}: questo file è solo dell'app della redazione`);
  // il robots.txt dell'app pubblica (T-056) esclude soltanto i programmi di raccolta elencati, non tutti
  if (/User-agent: \*\s*\nDisallow: \/\s*(\n|$)/.test(pub['robots.txt'] || '')) err('dist/pubblica/robots.txt: l\'app pubblica non chiede a tutti i programmi di non leggerla');
  if (/<meta name="robots"/.test(pub['index.html'])) err('dist/pubblica/index.html: l\'app pubblica non chiede di non essere indicizzata');
  /* le traduzioni: stesse voci in ogni lingua, e nessuna voce che compare solo negli strumenti della Redazione */
  const leggiTr = t => JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
  const trP = leggiTr(pub['traduzioni.js']), trR = leggiTr(red['traduzioni.js']);
  const sorgentiRed = fs.readdirSync(path.join(RADICE, 'sorgenti', 'redazione')).filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(RADICE, 'sorgenti', 'redazione', f), 'utf8')).join('\n');
  const tolte = Object.keys(trR.en).filter(k => !(k in trP.en));
  for (const l of Object.keys(trR)) if (Object.keys(trP[l]).length + tolte.length !== Object.keys(trR[l]).length) err(`traduzioni (${l}): l'app pubblica non ha le stesse voci nelle diverse lingue`);
  for (const k of tolte) if (!sorgentiRed.includes(k)) err(`traduzioni: «${k.slice(0, 50)}» è stata tolta dall'app pubblica ma non è un testo degli strumenti della Redazione`);
  for (const k of ['Importa eventi da Excel', 'Storico delle operazioni']) if (k in trP.en) err(`traduzioni: «${k}» è un testo degli strumenti della Redazione e sta ancora nell'app pubblica`);
  for (const k of ['Impostazioni', 'Salva in calendario', 'Spazio esaurito sul telefono: elimina qualche evento.']) if (!(k in trP.en)) err(`traduzioni: manca «${k}» nell'app pubblica`);

  /* ---------- 3. l'app della redazione ---------- */
  for (const [re, che] of [[/FOGLI_RED/, 'gli strumenti'], [/function fChiavi/, 'la schermata delle chiavi'], [/function disegnaMisure/, 'le Misure'], [/function foglioStorico/, 'lo storico']])
    if (!re.test(red['app.js'])) err('dist/redazione/app.js: mancano ' + che);
  if (!/AGR_MODULI \|\| \{\}\)\.chiavi/.test(red['moduli.js'])) err('dist/redazione/moduli.js: manca il modulo delle chiavi');
  if (/@red\b|@pub\b|@fine\b/.test(red['app.js'] + red['index.html'] + red['app.css'])) err('dist/redazione: sono rimasti i segni del montaggio');
  if (/agorapp2024|ADMIN_PW|adminpw/.test(red['app.js'] + red['index.html'])) err('dist/redazione: c\'è ancora la password scritta nel codice');
  if (!/<meta name="robots" content="noindex, nofollow">/.test(red['index.html'])) err('dist/redazione/index.html: non chiede ai motori di ricerca di non essere indicizzata');
  if (red['robots.txt'] !== 'User-agent: *\nDisallow: /\n') err('dist/redazione/robots.txt: manca o non vieta tutto');
  const mP = JSON.parse(pub['manifest.webmanifest']), mR = JSON.parse(red['manifest.webmanifest']);
  if (mP.name !== cfg.nome) err('dist/pubblica/manifest: il nome non è quello della configurazione');
  if (mR.name === mP.name || mR.short_name === mP.short_name) err('dist/redazione/manifest: il nome deve distinguersi da quello dell\'app pubblica');
  for (const n of [180, 192, 512]) { const a = pub[`icone/icona-${n}.png`], b = red[`icone/icona-${n}.png`]; if (!a || !b || a.equals(b)) err(`icona da ${n}: l'app della redazione deve avere un'icona propria`); }
  if (!/File Excel letti e scritti/.test(red['moduli.js'] || '')) err('dist/redazione/moduli.js: manca il modulo dei file Excel (T-042)');

  /* ---------- 4. nessun collegamento dall'app pubblica all'app della redazione ---------- */
  for (const [f, t] of Object.entries(pub)) if (typeof t === 'string' && !f.startsWith('lib/') && /(?:\.\.\/|dist\/|\/)redazione\//.test(t)) err(`dist/pubblica/${f}: porta verso l'app della redazione`);

  /* ---------- 5. i sorgenti ---------- */
  const build = fs.readFileSync(path.join(RADICE, 'sorgenti', 'build.js'), 'utf8');
  for (const f of fs.readdirSync(path.join(RADICE, 'sorgenti', 'redazione'))) if (!build.includes('\'' + f + '\'')) err(`sorgenti/redazione/${f}: il montaggio non lo nomina (file dimenticato)`);
  const parti = path.join(RADICE, 'sorgenti', 'parti');
  for (const f of fs.readdirSync(parti).filter(f => /\.(js|html|css)$/.test(f) && f !== 'traduzioni.js')) {
    const t = fs.readFileSync(path.join(parti, f), 'utf8');
    const m = t.match(/agorapp2024|ADMIN_PW|adminpw|mostra-admin|entra-admin|\bXLSX\b/);
    if (m) err(`sorgenti/parti/${f}: «${m[0]}» è rimasto nei pezzi comuni`);
  }
  e.note.push(`app.js: pubblica ${Math.round(pub['app.js'].length / 1024)} KB, redazione ${Math.round(red['app.js'].length / 1024)} KB; traduzioni tolte dall'app pubblica: ${tolte.length} voci per lingua`);
  e.note.push('app della redazione: manifest «' + mR.name + '», icona propria, noindex nella pagina e robots.txt');
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
