/* Strumenti comuni alle prove automatiche (voce T-005 del piano di adeguamento).
   Le prove usano soltanto i file del repository e dati inventati: nessuna prova contatta servizi esterni. */
'use strict';
const fs = require('fs');
const path = require('path');

const RADICE = path.resolve(__dirname, '..');
const DIST = path.join(RADICE, 'dist');
const USCITE = ['pubblica', 'redazione'];

/* Tutti i file di una cartella, con il percorso relativo alla cartella (barre «/»); salta node_modules. */
function elencaFile(cartella, base = cartella) {
  if (!fs.existsSync(cartella)) return [];
  return fs.readdirSync(cartella, { withFileTypes: true }).filter(d => d.name !== 'node_modules').flatMap(d => {
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
  if (process.argv.includes('--dettagli') || require.main && require.main.filename === __filename) for (const x of e.scarti) console.log('    scarto noto: ' + x);
  for (const x of e.note) console.log('    nota: ' + x);
}

/* Confronta ciò che una prova ha trovato con gli scarti noti (prove/scarti-noti.js).
   trovati: [{chiave, dove, dettaglio}]; uscita: «pubblica» o «redazione» per le prove sulle uscite
   (uno scarto può valere per una sola uscita con uscite: ['pubblica']). Ogni gruppo chiave+dove deve avere uno scarto noto con lo stesso numero
   di casi; uno scarto noto che non trova più nulla è chiuso e va tolto dall'elenco, così l'elenco resta vero. */
function confronta(e, prova, trovati, uscita) {
  const SCARTI = require('./scarti-noti.js').filter(s => s.prova === prova && (!uscita || !s.uscite || s.uscite.includes(uscita)));
  const pre = uscita ? uscita + '/' : '';
  const gruppi = new Map();
  for (const t of trovati) {
    const k = t.chiave + ' @ ' + pre + t.dove;
    if (!gruppi.has(k)) gruppi.set(k, { chiave: t.chiave, dove: t.dove, casi: [] });
    gruppi.get(k).casi.push(t.dettaglio);
  }
  const usati = new Set();
  for (const [k, g] of gruppi) {
    const s = SCARTI.find(x => x.chiave === g.chiave && x.dove === g.dove);
    const esempi = g.casi.slice(0, 3).join(' · ') + (g.casi.length > 3 ? ' …' : '');
    if (!s) { e.errori.push(`${k}: ${g.casi.length} ${g.casi.length === 1 ? 'caso' : 'casi'} (${esempi})`); continue; }
    usati.add(s);
    if (s.volte !== g.casi.length) e.errori.push(`${k}: ${g.casi.length} casi, lo scarto noto ne prevede ${s.volte} (${s.voce}); correggi il codice o aggiorna prove/scarti-noti.js (${esempi})`);
    else e.scarti.push(`${k} ×${s.volte}: ${s.voce}, ${s.motivo}`);
  }
  for (const s of SCARTI) if (!usati.has(s)) e.errori.push(`${s.chiave} @ ${pre}${s.dove}: lo scarto noto (${s.voce}) non si trova più; se la voce l'ha chiuso, togli la riga da prove/scarti-noti.js`);
}

module.exports = { RADICE, DIST, USCITE, elencaFile, leggiUscita, config, riga, esito, eseguiDaSola, stampa, confronta };
