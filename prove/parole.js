/* Prova: parole vietate nei testi dell'interfaccia (voci T-005 e T-013).

   Libro mastro: § 2.5, principio 7 (nessuna frase che prometta più del vero); § 5.2 (nessun «verificato»
   o «ufficiale» riferito agli eventi); § 8.3; § 10.3; § 11.1 (nessuna dichiarazione di conformità non
   dimostrata); § 1.3 e § 2.4 (nessuna versione anticipata o abbreviata della frase sui dati).

   Si cercano le parole nei testi dei sorgenti (commenti esclusi), nelle traduzioni e nei testi legali tradotti,
   lingua per lingua, arabo compreso. Molte di queste parole hanno anche usi innocui («schermo intero», «copia
   completa»): ogni caso è stato rivisto con T-013 e, se resta, è nell'elenco AMMESSI qui sotto con la frase esatta
   e il motivo. Un caso nuovo fa fallire la prova finché non si toglie o non si aggiunge, motivato, all'elenco. I casi
   che una voce successiva toglie stanno in prove/scarti-noti.js. */
'use strict';
const fs = require('fs');
const path = require('path');
const { RADICE, elencaFile, riga, esito, eseguiDaSola, confronta } = require('./comune.js');

const p = src => new RegExp('(?<![\\p{L}\\p{N}_])(?:' + src + ')(?![\\p{L}\\p{N}_])', 'giu');
/* arabo: la stessa regola, con i prefissi uniti alla parola e le terminazioni del femminile e del plurale */
const pas = src => '[وبلفك]?(?:ال)?(?:' + src + ')(?:ة|ات|ون|ين|ان)?';
const pa = src => p(pas(src));
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
    'frase sui dati abbreviata': p('données[^.<"\'`]{0,60}(?:ne quittent|restent|demeurent)[^.<"\'`]{0,30}(?:Europe|UE|Union)'),
  },
  /* arabo: prefissi uniti alla parola (و ب ل ف ك e l'articolo ال) e terminazioni comuni */
  ar: {
    'متوافق': pa('متوافق|مطابق'), 'موثق': p(pas('موثق|موثوق') + '|تم التحقق'), 'رسمي': pa('رسمي'), 'مرخص': pa('مرخص|مصرح'),
    'آمن': pa('آمن|مأمون'), 'محايد': pa('محايد'), 'غير متحيز': p('غير متحيز[ةين]*|نزيه[ةين]*'), 'جميع الفعاليات': p('(?:جميع|كل|كافة) الفعاليات'),
    'كامل': pa('كامل|مكتمل|شامل'),
    'frase sui dati abbreviata': p('بيانات[^.<"\'`]{0,60}(?:لا تغادر|تبقى|تظل)[^.<"\'`]{0,30}(?:أوروبا|الاتحاد)'),
  },
};
PAROLE.es['frase sui dati abbreviata'] = p('datos[^.<"\'`]{0,60}(?:no salen|se quedan|permanecen)[^.<"\'`]{0,30}(?:Europa|UE|Unión)');

/* Casi ammessi dopo la revisione di T-013: la parola compare dentro la frase indicata, che non è riferita agli eventi
   né alla mappa e non dichiara una conformità. Ogni riga: lingua, frase esatta (o un suo pezzo), motivo. */
const AMMESSI = [
  ['it', 'Sì, verificato senza accedere', 'importazione Excel (T-042): valore ammesso della colonna «Post leggibile senza account» del file degli eventi del 13/11/2026: dice che il post si legge senza account, non che l\'evento è verificato'],
  // scheda di pubblicazione e registro delle fonti (T-041, solo nell'app della redazione): le parole sono nominate per dire a chi scrive un evento di non usarle, o descrivono una pagina e non un evento
  ['it', 'Mai «verificato» o «ufficiale» per un evento soltanto ripreso; mai «autorizzato», «in regola», «sicuro», «a norma».', 'scheda di pubblicazione: la regola di scrittura dell\'allegato A, A.2, che nomina le parole da non usare'],
  ['it', 'in regola|sicur[oaie]|a norma', 'scheda di pubblicazione: l\'elenco delle parole che l\'app segnala a chi scrive un evento'],
  ['it', 'Licenza o assenza di licenza verificata', 'registro delle fonti (T-043): il punto 2 del § 6.4, nome della colonna «Punto 2» del modello del cap. 22; dice che la Redazione ha controllato la licenza del calendario, non che un evento è verificato'],
  ['it', 'Pagina ufficiale su un social network', 'registro delle fonti: tipo di fonte del cap. 22; «ufficiale» è la pagina dell\'organizzatore, non un evento'],
  ['it', 'il suo sito o la sua pagina ufficiale', 'registro delle fonti: ordine delle fonti del § 5.4; «ufficiale» è la pagina dell\'organizzatore, non un evento'],
  ['it', 'crea invece un evento on-grid completo', 'amministrazione: «completo» è il modulo, non la mappa'],
  ['it', 'come farlo restando conformi', 'Misure (amministrazione): intenzione di rispettare le regole, non dichiarazione di conformità'],
  ['it', 'Scheda completa: calcolo, metodo, conformità', 'Misure (amministrazione): scheda di una misura'],
  ['it', 'va verificata la compatibilità', 'Misure (amministrazione): catalogo delle misure, non riferito agli eventi'],
  ['it', 'va verificato cosa registra Netlify', 'Misure (amministrazione): catalogo delle misure, non riferito agli eventi'],
  ['it', 'Copia completa esportata in JSON', 'storico delle operazioni: copia di sicurezza'],
  ['en', 'Regulatory compliance of events', 'testi legali v1.2: titolo dell\'avvertenza che nega il controllo (T-080 li sostituisce)'],
  ['en', 'does not verify the compliance of events', 'testi legali v1.2: avvertenza che nega il controllo (T-080 li sostituisce)'],
  ['es', 'pantalla completa', '«schermo intero»'],
  ['es', 'evento on-grid completo', 'amministrazione: «completo» è il modulo, non la mappa'],
  ['es', 'Formulario completo', 'amministrazione: «completo» è il modulo, non la mappa'],
  ['es', 'textos completos', 'testi integrali delle licenze'],
  ['ar', 'كيوم كامل', '«come giornata intera»'],
  ['ar', 'فعالية on-grid كاملة', 'amministrazione: «completo» è il modulo, non la mappa'],
  ['ar', 'نموذج كامل', 'amministrazione: «completo» è il modulo, non la mappa'],
  ['ar', 'الاجتماعات غير الرسمية', '«غير الرسمية» vuol dire «non ufficiali»: contenuto d\'esempio di Progetti'],
  ['ar', 'النصوص الكاملة', 'testi integrali delle licenze'],
  // contenuti d'esempio di Agorà (T-015): parole riferite alla proposta di un'istanza o a uno spazio, non agli eventi né alla mappa
  ['it', 'Con questa parte la proposta è completa', 'Agorà, contenuto d\'esempio: la bozza della proposta di un\'istanza'],
  ['it', 'completa le schede di Torino', 'Agorà, contenuto d\'esempio: «completare» come verbo'],
  ['it', 'completa quelle di Bologna', 'Agorà, contenuto d\'esempio: «completare» come verbo'],
  ['it', 'completa la raccolta a Palermo', 'Agorà, contenuto d\'esempio: «completare» come verbo'],
  ['it', 'Come rendere sicuro uno spazio', 'Agorà, contenuto d\'esempio: la sicurezza di uno spazio autogestito, non degli eventi'],
  ['en', 'How to make a space safe', 'Agorà, contenuto d\'esempio: la sicurezza di uno spazio autogestito, non degli eventi'],
];

/* Toglie i commenti da un testo JavaScript o CSS, lasciando le righe al loro posto (per i numeri di riga).
   È una pulizia semplice: basta per cercare parole, non per capire il codice. */
function senzaCommenti(t) {
  const vuoto = s => s.replace(/[^\n]/g, ' ');
  return t.replace(/\/\*[\s\S]*?\*\//g, vuoto).replace(/(^|[^:\\'"`\w])\/\/[^\n]*/g, (m, a) => a + vuoto(m.slice(a.length)));
}
const senzaCommentiHtml = t => t.replace(/<!--[\s\S]*?-->/g, s => s.replace(/[^\n]/g, ' '));

/* Vero se il caso alla posizione i (lunghezza n) sta dentro una delle frasi ammesse per quella lingua. */
function ammesso(testo, lingua, i, n) {
  for (const [l, frase] of AMMESSI) {
    if (l !== lingua) continue;
    for (let k = testo.indexOf(frase); k >= 0; k = testo.indexOf(frase, k + 1)) if (i >= k && i + n <= k + frase.length) return true;
  }
  return false;
}
function cercaIn(testo, lingua, dove, trovati) {
  for (const [nome, re] of Object.entries(PAROLE[lingua])) for (const m of testo.matchAll(re)) {
    if (ammesso(testo, lingua, m.index, m[0].length)) continue;
    trovati.push({ chiave: `${lingua}: ${nome}`, dove, dettaglio: `riga ${riga(testo, m.index)}: «${m[0]}»` });
  }
}

function prova() {
  const e = esito('Parole vietate');
  const trovati = [];
  const PARTI = path.join(RADICE, 'sorgenti', 'parti'), REDAZIONE = path.join(RADICE, 'sorgenti', 'redazione');
  /* i pezzi dell'app e, dal blocco 8, gli strumenti della Redazione (sorgenti/redazione/, T-033) */
  for (const [cartella, nome] of [[PARTI, 'sorgenti/parti/'], [REDAZIONE, 'sorgenti/redazione/']]) for (const f of elencaFile(cartella)) {
    if (f === 'traduzioni.js' || f === 'css_mock.css' || /\.css$/.test(f)) continue;
    const t = fs.readFileSync(path.join(cartella, f), 'utf8');
    cercaIn(f.endsWith('.html') ? senzaCommentiHtml(t) : senzaCommenti(t), 'it', nome + f, trovati);
  }
  const TR = JSON.parse(fs.readFileSync(path.join(PARTI, 'traduzioni.js'), 'utf8').replace(/^window\.AGR_TR=/, '').replace(/;\s*$/, ''));
  for (const l of ['en', 'es', 'fr', 'ar']) cercaIn(Object.values(TR[l]).join('\n'), l, 'traduzioni.js:' + l, trovati);
  // contenuti d'esempio di Agorà e Progetti (T-015), in italiano e tradotti
  const AC = require('../sorgenti/contenuti_esempio.js'), ATR = AC.traduzioni(), ATESTI = AC.testi();
  cercaIn(ATESTI.join('\n'), 'it', 'sorgenti/anteprime', trovati);
  for (const l of AC.LINGUE) cercaIn(Object.values(ATR[l]).join('\n'), l, 'sorgenti/anteprime/lingue/' + l + '.json', trovati);
  const LEG = JSON.parse(fs.readFileSync(path.join(RADICE, 'sorgenti', 'dati', 'legali_tradotti.json'), 'utf8'));
  for (const l of Object.keys(LEG)) if (PAROLE[l]) cercaIn(Object.values(LEG[l]).join('\n'), l, 'legali_tradotti.json:' + l, trovati);
  confronta(e, 'parole', trovati);
  // Una frase ammessa che non si trova più va tolta dall'elenco, così l'elenco resta vero.
  for (const [l, frase] of AMMESSI) {
    const dove = l === 'it' ? elencaFile(PARTI).filter(f => f !== 'traduzioni.js').map(f => fs.readFileSync(path.join(PARTI, f), 'utf8')).concat(elencaFile(REDAZIONE).map(f => fs.readFileSync(path.join(REDAZIONE, f), 'utf8'))).join('\n') + '\n' + ATESTI.join('\n')
      : Object.values(TR[l] || {}).join('\n') + '\n' + Object.values(LEG[l] || {}).join('\n') + '\n' + Object.values(ATR[l] || {}).join('\n');
    if (!dove.includes(frase)) e.errori.push(`frase ammessa che non c'è più (${l}): «${frase}»: toglila da AMMESSI in prove/parole.js`);
  }
  e.note.push('lingue: it, en, es, fr, ar; frasi ammesse dopo la revisione: ' + AMMESSI.length);
  return e;
}

module.exports = { prova, PAROLE };
eseguiDaSola(module, prova);
