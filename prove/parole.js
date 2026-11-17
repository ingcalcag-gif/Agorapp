/* Prova: parole vietate nei testi dell'interfaccia (voce T-005; l'elenco lo completa T-013).

   Libro mastro: § 2.5, principio 7 (nessuna frase che prometta più del vero); § 5.2 (nessun «verificato»
   o «ufficiale» riferito agli eventi); § 8.3; § 10.3; § 11.1 (nessuna dichiarazione di conformità non
   dimostrata); § 1.3 e § 2.4 (nessuna versione anticipata o abbreviata della frase sui dati).

   Si cercano le parole nei testi dei sorgenti (commenti esclusi) e nelle traduzioni, lingua per lingua.
   Molte di queste parole hanno anche usi innocui («Sei sicuro?»): T-013 rivede ogni caso, lo toglie o lo
   dichiara ammesso; fino ad allora ogni caso trovato oggi è uno scarto noto, contato per file. */
'use strict';
const fs = require('fs');
const path = require('path');
const { RADICE, elencaFile, riga, esito, eseguiDaSola, confronta } = require('./comune.js');

const p = src => new RegExp('(?<![\\p{L}\\p{N}_])(?:' + src + ')(?![\\p{L}\\p{N}_])', 'giu');
const PAROLE = {
  it: {
    'conforme': p('conform[ei]'), 'verificato': p('verificat[oaie]'), 'ufficiale': p('ufficial[ei]'),
    'autorizzato': p('autorizzat[oaie]'), 'in regola': p('in regola'), 'sicuro': p('sicur[oaie]'), 'a norma': p('a norma'),
    'neutrale': p('neutral[ei]'), 'imparziale': p('imparzial[ei]'), 'tutti gli eventi': p('tutti gli eventi'), 'completo': p('complet[oaie]'),
    'frase sui dati abbreviata': p('dati[^.<"\'`]{0,60}(?:non escono|restano|rimangono)[^.<"\'`]{0,30}(?:Europa|UE|Unione)'),
  },
  en: {
    'compliant': p('compliant|compliance'), 'verified': p('verified'), 'official': p('official(?:ly)?'), 'authorised': p('authori[sz]ed'),
    'safe': p('safe|secure'), 'neutral': p('neutral'), 'impartial': p('impartial'), 'all events': p('all (?:the )?events'), 'complete': p('complete'),
    'data stays in Europe': p('data[^.<"\'`]{0,60}(?:never leaves?|stays?|remains?)[^.<"\'`]{0,30}(?:Europe|EU|Union)'),
  },
  es: {
    'conforme': p('conformes?'), 'verificado': p('verificad[oa]s?'), 'oficial': p('oficial(?:es)?'), 'autorizado': p('autorizad[oa]s?'),
    'seguro': p('segur[oa]s?'), 'neutral': p('neutral(?:es)?'), 'imparcial': p('imparcial(?:es)?'), 'todos los eventos': p('todos los eventos'), 'completo': p('complet[oa]s?'),
  },
  fr: {
    'conforme': p('conformes?'), 'vérifié': p('vérifiée?s?'), 'officiel': p('officiel(?:le)?s?'), 'autorisé': p('autorisée?s?'),
    'sûr': p('sûre?s?|sécurisée?s?'), 'neutre': p('neutres?'), 'impartial': p('impartiale?s?|impartiaux'), 'tous les événements': p('tous les événements'), 'complet': p('complète?s?'),
  },
};

/* Toglie i commenti da un testo JavaScript o CSS, lasciando le righe al loro posto (per i numeri di riga).
   È una pulizia semplice: basta per cercare parole, non per capire il codice. */
function senzaCommenti(t) {
  const vuoto = s => s.replace(/[^\n]/g, ' ');
  return t.replace(/\/\*[\s\S]*?\*\//g, vuoto).replace(/(^|[^:\\'"`\w])\/\/[^\n]*/g, (m, a) => a + vuoto(m.slice(a.length)));
}
const senzaCommentiHtml = t => t.replace(/<!--[\s\S]*?-->/g, s => s.replace(/[^\n]/g, ' '));

function cercaIn(testo, lingua, dove, trovati) {
  for (const [nome, re] of Object.entries(PAROLE[lingua])) for (const m of testo.matchAll(re))
    trovati.push({ chiave: `${lingua}: ${nome}`, dove, dettaglio: `riga ${riga(testo, m.index)}: «${m[0]}»` });
}

function prova() {
  const e = esito('Parole vietate');
  const trovati = [];
  const PARTI = path.join(RADICE, 'sorgenti', 'parti');
  for (const f of elencaFile(PARTI)) {
    if (f === 'traduzioni.js' || f === 'css_mock.css' || /\.css$/.test(f)) continue;
    const t = fs.readFileSync(path.join(PARTI, f), 'utf8');
    cercaIn(f.endsWith('.html') ? senzaCommentiHtml(t) : senzaCommenti(t), 'it', 'sorgenti/parti/' + f, trovati);
  }
  const TR = JSON.parse(fs.readFileSync(path.join(PARTI, 'traduzioni.js'), 'utf8').replace(/^window\.AGR_TR=/, '').replace(/;\s*$/, ''));
  for (const l of ['en', 'es', 'fr']) cercaIn(Object.values(TR[l]).join('\n'), l, 'traduzioni.js:' + l, trovati);
  const LEG = JSON.parse(fs.readFileSync(path.join(RADICE, 'sorgenti', 'dati', 'legali_tradotti.json'), 'utf8'));
  for (const l of Object.keys(LEG)) if (PAROLE[l]) cercaIn(Object.values(LEG[l]).join('\n'), l, 'legali_tradotti.json:' + l, trovati);
  confronta(e, 'parole', trovati);
  e.note.push('arabo non ancora controllato: lo aggiunge T-013');
  return e;
}

module.exports = { prova, PAROLE };
eseguiDaSola(module, prova);
