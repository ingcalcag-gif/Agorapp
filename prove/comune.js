/* Strumenti comuni alle prove automatiche (voce T-005 del piano di adeguamento).
   Le prove usano soltanto i file del repository e dati inventati: nessuna prova contatta servizi esterni. */
'use strict';
const fs = require('fs');
const path = require('path');

const RADICE = path.resolve(__dirname, '..');
const DIST = path.join(RADICE, 'dist');
const USCITE = ['pubblica', 'redazione'];

/* Tutti i file di una cartella, con il percorso relativo alla cartella (barre «/»). */
function elencaFile(cartella, base = cartella) {
  if (!fs.existsSync(cartella)) return [];
  return fs.readdirSync(cartella, { withFileTypes: true }).flatMap(d => {
    const p = path.join(cartella, d.name);
    return d.isDirectory() ? elencaFile(p, base) : [path.relative(base, p).split(path.sep).join('/')];
  });
}

/* I file di un'uscita montata, come {percorso: testo}. */
function leggiUscita(nome = 'pubblica') {
  const c = path.join(DIST, nome);
  return Object.fromEntries(elencaFile(c).map(f => [f, fs.readFileSync(path.join(c, f), 'utf8')]));
}

/* La configurazione, letta come la legge il montaggio. */
const config = () => JSON.parse(JSON.stringify(require(path.join(RADICE, 'sorgenti', 'config.js'))));

/* Numero di riga di una posizione in un testo. */
const riga = (testo, i) => testo.slice(0, i).split('\n').length;

/* Un esito di prova: errori (la prova fallisce), scarti noti (eccezioni con la voce che le chiude), note. */
function esito(nome) {
  return { nome, errori: [], scarti: [], note: [] };
}

/* Esecuzione diretta di un file di prova: stampa l'esito ed esce con 1 se ci sono errori. */
function eseguiDaSola(modulo, prova) {
  if (require.main !== modulo) return;
  Promise.resolve(prova()).then(e => {
    stampa(e);
    process.exit(e.errori.length ? 1 : 0);
  }).catch(err => { console.error(err); process.exit(1); });
}

function stampa(e) {
  for (const k of ['errori', 'scarti', 'note']) e[k] = [...new Set(e[k])];
  const stato = e.errori.length ? 'NON SUPERATA' : 'superata';
  console.log(`${e.errori.length ? '✗' : '✓'} ${e.nome}: ${stato}` + (e.scarti.length ? ` (${e.scarti.length} scarti noti)` : ''));
  for (const x of e.errori) console.log('    errore: ' + x);
  for (const x of e.scarti) console.log('    scarto noto: ' + x);
  for (const x of e.note) console.log('    nota: ' + x);
}

module.exports = { RADICE, DIST, USCITE, elencaFile, leggiUscita, config, riga, esito, eseguiDaSola, stampa };
