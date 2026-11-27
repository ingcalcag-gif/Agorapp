/* Prova: linguaggio semplice nei testi dell'interfaccia dell'app pubblica (voce T-059; libro mastro, § 11.1, riga «I testi
   dell'interfaccia sono scritti in linguaggio semplice»; documento: docs/accessibilita.md).

   Misura: l'indice Gulpease, pensato per l'italiano (89 + (300 × frasi − 10 × lettere) / parole): sotto 80 un testo è
   difficile per chi ha la licenza elementare, sotto 60 per chi ha la licenza media. La prova misura ogni testo italiano
   dell'interfaccia pubblica di almeno 10 parole (dalle traduzioni dell'uscita pubblica, senza i tag) e fallisce se uno
   scende sotto SOGLIA, salvo le frasi in AMMESSI, con il motivo. L'indice è un minimo, non basta da solo: la rilettura
   con persone vere resta da fare (scarto annotato nel registro dell'accessibilità, docs/accessibilita.md). */
'use strict';
const { leggiUscita, esito, eseguiDaSola } = require('./comune.js');

const SOGLIA = 60;
const AMMESSI = [
  ['Confermo di ritenere in buona fede che le informazioni e le affermazioni di questa segnalazione siano esatte e complete.', 'modulo «Segnala»: la dichiarazione di buona fede ripete le parole dell\'art. 16, par. 2, lett. d, DSA (testo approvato il 26/11/2026)'],
];

function gulpease(s) {
  const t = s.replace(/<br\s*\/?>|<\/p>|<\/li>/g, '. ').replace(/<[^>]+>/g, ' ').replace(/\{[a-z]+\}/g, 'X');
  const parole = t.match(/[A-Za-zÀ-ÿ’']+|\d+/g) || [];
  if (!parole.length) return null;
  const lettere = parole.reduce((n, p) => n + p.replace(/[’']/g, '').length, 0);
  const frasi = Math.max(1, (t.trim() + ' ').match(/[.!?:;]+\s/g) ? (t.trim() + ' ').match(/[.!?:;]+\s/g).length : 0);
  return { indice: 89 + (300 * frasi - 10 * lettere) / parole.length, parole: parole.length };
}

function prova() {
  const e = esito('Linguaggio semplice (indice Gulpease)');
  const pub = leggiUscita('pubblica')['traduzioni.js'] || '';
  if (!pub) { e.errori.push('dist/pubblica/traduzioni.js manca: lancia npm run build'); return e; }
  const TR = JSON.parse(pub.slice(pub.indexOf('{'), pub.lastIndexOf('}') + 1));
  const misure = [];
  for (const k of Object.keys(TR.en)) {
    const g = gulpease(k);
    if (!g || g.parole < 10) continue;
    misure.push(g.indice);
    if (g.indice < SOGLIA && !AMMESSI.some(([f]) => f === k)) e.errori.push(`indice ${Math.round(g.indice)} (sotto ${SOGLIA}): «${k.slice(0, 120)}» — frasi più brevi e parole più comuni`);
  }
  for (const [f] of AMMESSI) if (!(f in TR.en)) e.errori.push(`frase ammessa che non c'è più: «${f.slice(0, 60)}»: toglila da AMMESSI`);
  const media = misure.reduce((a, b) => a + b, 0) / (misure.length || 1);
  e.note.push(`${misure.length} testi di almeno 10 parole; indice medio ${Math.round(media)}, minimo ${Math.round(Math.min(...misure))}; soglia ${SOGLIA}`);
  return e;
}

module.exports = { prova, gulpease };
eseguiDaSola(module, prova);
