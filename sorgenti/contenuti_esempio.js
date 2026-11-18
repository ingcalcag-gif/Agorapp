/* Contenuti d'esempio di Agorà e Progetti (voce T-015 del piano di adeguamento).

   I contenuti stanno in sorgenti/anteprime/: agora.json e progetti.json, in italiano, e in lingue/ le
   traduzioni (en.json, es.json, fr.json, ar.json: testo italiano → testo tradotto, come traduzioni.js).
   Il montaggio scrive in ogni uscita anteprime/<lingua>.json, con i testi della lingua e il nome del
   servizio al posto di {nome}; un testo senza traduzione resta in italiano (la prova prove/anteprime.js lo
   segnala). L'app scarica il file della sua lingua solo quando si apre Agorà, Progetti o «Nelle sezioni» di Temi.

   Nei testi possono stare, oltre a {nome}, i segnaposto delle date, che l'app sposta in avanti come le date
   degli appuntamenti (decisione del 18/11/2026): {mese:AAAA-MM-GG} (il nome del mese), {data:AAAA-MM-GG}
   (giorno, mese e anno) e {mesi:AAAA-MM-GG/AAAA-MM-GG} (da un mese all'altro). Ogni traduzione li conserva.

   Che cosa non si traduce: identificativi, date, orari, strati e temi (li traduce l'app), vie e città,
   nomi e sigle delle persone e dei collettivi, le forme italiane «di», «a», «nel», lo stato dei passi e
   lo stato dell'appuntamento (li traduce l'app). */
'use strict';
const fs = require('fs');
const path = require('path');

const CARTELLA = path.join(__dirname, 'anteprime');
const LINGUE = ['en', 'es', 'fr', 'ar'];
const SEZIONI = ['agora', 'progetti'];

const CHIAVI_FISSE = new Set(['id', 'tipo', 'iso', 'giorno', 'inizio', 'fine', 'ora', 'da', 'quando', 'strati', 'temi', 'citta',
  'prov', 'via', 'sigla', 'nome', 'corto', 'di', 'a', 'nel', 'aPrep', 'statoParte', 'firme', 'ancora', 'icone', 'pp', 'pb', 'pt']);

/* Vero se il testo a questo percorso si traduce. percorso: elenco di chiavi e posizioni dalla radice. */
function siTraduce(percorso) {
  const k = percorso[percorso.length - 1], su = percorso[percorso.length - 2];
  if (percorso.includes('icone') || percorso.includes('citta')) return false;   // icone; sigle delle città
  if (typeof k === 'number') {
    if (su === 'soggetti' || percorso[percorso.length - 3] === 'soggetti') return k === 1;          // [nome, tipo, città]
    if (percorso[percorso.length - 3] === 'tappe') return k > 0;                                    // [stato, titolo, quando, che cosa]
    if (percorso[percorso.length - 3] === 'compiti') return k === 1;                                 // [chi, che cosa]
    return !CHIAVI_FISSE.has(su);
  }
  if (CHIAVI_FISSE.has(k)) return false;
  if (k === 'stato' && su === 'app') return false;   // «Confermato», «Da confermare»: li traduce l'app
  return true;
}

/* Chiama f(testo, percorso) per ogni testo che si traduce; con sostituisci, mette al suo posto il valore di f. */
function visita(x, f, percorso = [], sostituisci = false) {
  if (Array.isArray(x)) return x.map((v, i) => visita(v, f, percorso.concat(i), sostituisci));
  if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, visita(v, f, percorso.concat(k), sostituisci)]));
  if (typeof x === 'string' && siTraduce(percorso)) { const r = f(x, percorso); return sostituisci ? r : x; }
  return x;
}

const leggiJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));
function sorgenti() { return Object.fromEntries(SEZIONI.map(s => [s, leggiJson(path.join(CARTELLA, s + '.json'))])); }
function traduzioni() {
  return Object.fromEntries(LINGUE.map(l => { const f = path.join(CARTELLA, 'lingue', l + '.json'); return [l, fs.existsSync(f) ? leggiJson(f) : {}]; }));
}
/* Tutti i testi da tradurre, senza doppioni, nell'ordine in cui compaiono. */
function testi(dati = sorgenti()) {
  const visti = new Set();
  for (const s of SEZIONI) visita(dati[s], t => { visti.add(t); });
  return [...visti];
}
const SEGNAPOSTO = /\{(?:nome|mese:\d{4}-\d{2}-\d{2}|data:\d{4}-\d{2}-\d{2}|mesi:\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2})\}/g;

/* I file dell'uscita: anteprime/it.json e uno per lingua, con il nome del servizio. */
function fileAnteprime(cfg) {
  const dati = sorgenti(), tr = traduzioni(), file = {};
  const nome = t => t.split('{nome}').join(cfg.nome);
  const scrivi = (l, f) => { file['anteprime/' + l + '.json'] = JSON.stringify(Object.fromEntries(SEZIONI.map(s => [s, visita(dati[s], f, [], true)]))) + '\n'; };
  scrivi('it', t => nome(t));
  for (const l of LINGUE) scrivi(l, t => nome(Object.prototype.hasOwnProperty.call(tr[l], t) ? tr[l][t] : t));
  return file;
}

module.exports = { fileAnteprime, sorgenti, traduzioni, testi, visita, siTraduce, SEGNAPOSTO, LINGUE, CARTELLA };
