/* Prova: sintassi di ogni file JavaScript e JSON dell'app montata e degli strumenti (voce T-005). */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { RADICE, DIST, elencaFile, esito, eseguiDaSola } = require('./comune.js');

function prova() {
  const e = esito('Sintassi');
  const js = [
    ...elencaFile(DIST).filter(f => /\.m?js$/.test(f)).map(f => path.join(DIST, f)),
    ...['sorgenti/build.js', 'sorgenti/licenze.js', 'sorgenti/config.js', 'sorgenti/dati/strati.js', 'sorgenti/vendor/elenco.js'].map(f => path.join(RADICE, f)),
    ...elencaFile(path.join(RADICE, 'sorgenti', 'moduli')).filter(f => f.endsWith('.js')).map(f => path.join(RADICE, 'sorgenti', 'moduli', f)),
    ...elencaFile(path.join(RADICE, 'strumenti')).filter(f => /\.m?js$/.test(f)).map(f => path.join(RADICE, 'strumenti', f)),
    ...elencaFile(__dirname).filter(f => f.endsWith('.js') && !f.startsWith('node_modules/')).map(f => path.join(__dirname, f)),
    ...elencaFile(path.join(RADICE, 'netlify')).filter(f => /\.m?js$/.test(f)).map(f => path.join(RADICE, 'netlify', f)),
  ];
  for (const f of js) {
    try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); }
    catch (err) { e.errori.push(path.relative(RADICE, f) + ': ' + String(err.stderr).split('\n').filter(Boolean).slice(0, 3).join(' | ')); }
  }
  /* L'app è un solo modulo montato da più file (sorgenti/build.js): due funzioni con lo stesso nome non danno errore di
     sintassi, ma l'ultima prende il posto della prima in silenzio. È successo nel blocco 10 (una funzione del registro
     delle fonti aveva il nome di quella che scrive la riga «Fonte:» della scheda, che nell'app della redazione non si
     apriva più): ora un nome doppio ferma la prova. */
  for (const app of ['pubblica', 'redazione']) {
    const f = path.join(DIST, app, 'app.js'); if (!fs.existsSync(f)) continue;
    const conti = {};
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/^(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/gm)) conti[m[1]] = (conti[m[1]] || 0) + 1;
    const doppi = Object.keys(conti).filter(k => conti[k] > 1);
    if (doppi.length) e.errori.push(`dist/${app}/app.js: funzioni con lo stesso nome in più file dei sorgenti (l'ultima prende il posto della prima): ${doppi.join(', ')}`);
  }
  const json = ['sorgenti/dati/legali_tradotti.json', 'sorgenti/dati/regioni.json', 'strumenti/archivio-prova.json', 'strumenti/package.json', 'package.json', 'prove/package.json'].filter(f => fs.existsSync(path.join(RADICE, f)));
  for (const f of json) { try { JSON.parse(fs.readFileSync(path.join(RADICE, f), 'utf8')); } catch (err) { e.errori.push(f + ': ' + err.message); } }
  e.note.push(`${js.length} file JavaScript, ${json.length} file JSON`);
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
