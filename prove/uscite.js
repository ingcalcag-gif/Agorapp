/* Prova: le uscite in dist/ sono quelle che i sorgenti producono, e il sito pubblica soltanto dist/pubblica/
   (voci T-001 e T-003). Le uscite stanno nel repository perché githack e il sito le leggono così come sono:
   se qualcuno cambia un sorgente senza rimontare, o tocca un'uscita a mano, la prova se ne accorge. */
'use strict';
const fs = require('fs');
const path = require('path');
const { RADICE, leggiUscita, esito, eseguiDaSola } = require('./comune.js');
const { configurazione, uscita } = require('../sorgenti/build.js');

function confrontaUscita(e, nome, atteso) {
  const reale = leggiUscita(nome);
  if (!Object.keys(reale).length) { e.errori.push(`dist/${nome}/ manca: lancia npm run build`); return; }
  for (const f of Object.keys(atteso)) {
    if (!(f in reale)) e.errori.push(`dist/${nome}/${f} manca: rimonta con npm run build`);
    else if (!(Buffer.isBuffer(atteso[f]) ? atteso[f].equals(Buffer.isBuffer(reale[f]) ? reale[f] : Buffer.from(reale[f], 'utf8')) : reale[f] === atteso[f])) e.errori.push(`dist/${nome}/${f} è diverso da ciò che producono i sorgenti: rimonta con npm run build (le uscite non si modificano a mano)`);
  }
  for (const f of Object.keys(reale)) if (!(f in atteso)) e.errori.push(`dist/${nome}/${f}: file che il montaggio non produce; toglilo`);
}

function prova() {
  const e = esito('Uscite e pubblicazione');
  const cfg = configurazione();
  // Due app dallo stesso codice (T-033): ogni uscita è quella che il montaggio produce per quella app.
  confrontaUscita(e, 'pubblica', uscita(cfg, 'pubblica'));
  confrontaUscita(e, 'redazione', uscita(cfg, 'redazione'));
  if (fs.existsSync(path.join(RADICE, 'dist', 'prova-nome'))) {
    const c2 = { ...cfg, nome: 'Nomeprova' };
    confrontaUscita(e, 'prova-nome/pubblica', uscita(c2, 'pubblica'));
  }

  // Nessuna copia dell'app fuori da dist/: il vecchio index.html alla radice è uscito il 17/11/2026.
  if (fs.existsSync(path.join(RADICE, 'index.html'))) e.errori.push('index.html alla radice: l\'app sta solo in dist/, toglilo');

  // Il sito pubblica soltanto dist/pubblica/ (T-003).
  const toml = fs.readFileSync(path.join(RADICE, 'netlify.toml'), 'utf8');
  const pub = (toml.match(/^\s*publish\s*=\s*"([^"]*)"/m) || [])[1];
  if (pub !== 'dist/pubblica') e.errori.push(`netlify.toml pubblica «${pub}» invece di «dist/pubblica»`);
  for (const f of Object.keys(leggiUscita('pubblica')))
    if (/^(versioni|demo|dati|sorgenti|prove|netlify|licenze\/.*\.md)\b/.test(f) || /\.(md|xlsx?|csv|geojson)$/.test(f) && f !== 'mappa/correzioni.geojson') e.errori.push(`dist/pubblica/${f}: non deve andare sul sito`); // lo strato delle correzioni (T-018) sì
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
