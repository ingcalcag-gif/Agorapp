#!/usr/bin/env node
/* Montaggio dell'app.
   Si lancia da qualunque cartella: `npm run build` (oppure `node sorgenti/build.js`).
   Legge soltanto i file di sorgenti/ e scrive due uscite:
     dist/pubblica/   l'app pubblica (la sola cartella che il sito pubblica)
     dist/redazione/  l'app della redazione (uguale alla pubblica fino al blocco 8 del piano)
   In ogni uscita JavaScript e CSS stanno in file propri, non dentro la pagina.
   Alla fine controlla la sintassi di ogni file JavaScript prodotto (node --check).

   Opzioni:
     --uscita=<cartella>   cartella delle uscite, relativa alla radice del repository (predefinita: dist)
*/
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const SORGENTI = __dirname;
const RADICE = path.resolve(SORGENTI, '..');
const PARTI = path.join(SORGENTI, 'parti');
const DATI = path.join(SORGENTI, 'dati');

const opz = Object.fromEntries(process.argv.slice(2)
  .filter(a => a.startsWith('--'))
  .map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));

const leggi = (...p) => fs.readFileSync(path.join(...p), 'utf8');

/* ---------- Ordine dei pezzi ---------- */
// Un solo modulo JavaScript: app1 apre, app6 chiude.
const JS_APP = ['app1.js', 'app2.js', 'app3.js', 'app4.js', 'app5.js', 'app7.js', 'fate.js',
  'misure_kpi.js', 'misure.js', 'interesse.js', 'storico.js', 'app6.js'];
const CSS = ['style.css', 'style2.css', 'style_temi.css', 'style_sezioni.css', 'style_fate.css', 'style_misure.css'];

/* ---------- Montaggio ---------- */
function monta() {
  const strati = leggi(DATI, 'strati.js').replace(/^\/\*[^\n]*\*\/\n/, '').replace(/\n$/, '');
  const legali = 'const LEGALI = ' + JSON.stringify(JSON.parse(leggi(DATI, 'legali_tradotti.json'))) + ';';
  const legaliIt = leggi(PARTI, 'legali_it.html').replace(/\n$/, '');

  let app = JS_APP.map(f => leggi(PARTI, f)).join('\n');
  if (!app.includes('/*@@LAYERS@@*/') || !app.includes('/*@@LEGALI@@*/')) throw new Error('Segnaposto LAYERS o LEGALI mancante nei pezzi JavaScript');
  app = app.replace('/*@@LAYERS@@*/', () => strati).replace('/*@@LEGALI@@*/', () => legali);

  const traduzioni = fs.existsSync(path.join(PARTI, 'traduzioni.js')) ? leggi(PARTI, 'traduzioni.js') : 'window.AGR_TR={};';
  const css = CSS.map(f => leggi(PARTI, f)).join('\n');
  const sezioni = leggi(PARTI, 'sezioni.js');

  const file = {
    'app.css': css + '\n',
    'traduzioni.js': traduzioni + '\n',
    'app.js': app + '\n',
    'sezioni.js': sezioni + '\n',
  };
  // Il numero di versione nei collegamenti cambia quando cambia il file: il telefono non tiene copie vecchie.
  const v = f => crypto.createHash('sha256').update(file[f]).digest('hex').slice(0, 10);

  file['index.html'] = `<!DOCTYPE html>
<!-- App montata da sorgenti/build.js: non modificare questo file, si cambia nei sorgenti. -->
<html lang="it" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#FFFDF8">
<title>Agorapp — Torino</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Serif+Display&display=swap">
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css">
<link rel="stylesheet" href="app.css?v=${v('app.css')}">
</head>
<body>
${leggi(PARTI, 'body.html')}
<!-- Testi legali: quelli dell'app online OG 1.7 (v1.2), invariati -->
${legaliIt}
<script src="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js"></script>
<script src="traduzioni.js?v=${v('traduzioni.js')}"></script>
<script src="app.js?v=${v('app.js')}"></script>
<script src="sezioni.js?v=${v('sezioni.js')}"></script>
</body>
</html>
`;
  return file;
}

/* ---------- Scrittura delle uscite ---------- */
function scrivi(cartella, file) {
  const dentro = path.relative(RADICE, cartella);
  if (!dentro || dentro.startsWith('..') || path.isAbsolute(dentro)) throw new Error('Uscita fuori dal repository: ' + cartella);
  fs.rmSync(cartella, { recursive: true, force: true });
  fs.mkdirSync(cartella, { recursive: true });
  for (const [nome, testo] of Object.entries(file)) fs.writeFileSync(path.join(cartella, nome), testo);
}

function controllaSintassi(cartella) {
  for (const f of fs.readdirSync(cartella).filter(f => f.endsWith('.js'))) {
    try { execFileSync(process.execPath, ['--check', path.join(cartella, f)], { stdio: 'pipe' }); }
    catch (e) { throw new Error('Errore di sintassi in ' + path.join(cartella, f) + '\n' + e.stderr); }
  }
}

function main() {
  const base = path.resolve(RADICE, typeof opz.uscita === 'string' ? opz.uscita : 'dist');
  const file = monta();
  const uscite = ['pubblica', 'redazione'];
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
module.exports = { monta };
