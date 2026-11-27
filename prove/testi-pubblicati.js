/* Prova: i testi pubblicati (voce T-055) e la riserva dell'estrazione leggibile dalle macchine (voce T-056).
   Libro mastro: Parte VI (capp. 29-32); § 7.5, misura 1; § 10.6; § 31.1; § 32.1, scelta 4; § 6.5; § 12.3.
   Documento: docs/testi-pubblicati.md.

   1. I quattro file di sorgenti/testi/it/ passano il controllo del montaggio e sono coerenti con la configurazione
      (in preparazione = segnaposto); il controllo rifiuta i casi sbagliati: elementi e attributi non ammessi, script,
      gestori, collegamenti non https, caselle mancanti o fuori posto, casella per le autorità senza la parte in
      inglese, informativa senza riquadro dell'opposizione o senza «Dove stanno i dati», indirizzo postale, segnaposto
      sconosciuti, testo con versione ma ancora segnaposto e il contrario.
   2. Nelle uscite: le quattro pagine di solo testo, senza script, con lingua, titolare accanto al nome, versione e
      riserva dell'estrazione; i quattro modelli nella pagina dell'app; i rimandi per i programmi (privacy-policy,
      terms-of-service); nulla dei testi v1.2. La casella per le autorità compare soltanto nelle note legali.
   3. robots.txt dell'app pubblica: un gruppo per ogni programma escluso, che nega tutto; gli altri ammessi, i motori
      di ricerca compresi; i programmi principali dichiarati per l'addestramento ci sono. L'app della redazione nega
      tutto a tutti.
   4. .well-known/tdmrep.json: regola «/*» con la riserva e il rinvio alle condizioni d'uso; metadati della riserva
      nella pagina dell'app, nelle pagine di testo e nella pagina delle licenze. */
'use strict';
const { USCITE, leggiUscita, config, esito, eseguiDaSola } = require('./comune.js');
const TP = require('../sorgenti/testi-pubblicati.js');

/* Un testo d'esempio che passa, da cui la prova toglie o aggiunge un pezzo per volta. */
const BUONE = {
  'informativa': '<p class="segnaposto">[x]</p><p>{titolare} {casella_contatto}</p><section class="opposizione"><h3>Opposizione</h3><p>x</p></section><h3 id="dove-stanno-i-dati">Dove</h3><p>x</p>',
  'note-legali': '<p class="segnaposto">[x]</p><p>{titolare} {casella_contatto} {casella_autorita}</p><p lang="en">Authorities: {casella_autorita}</p><p>{licenze}</p>',
  'condizioni-uso': '<p class="segnaposto">[x]</p><p>{casella_contatto}</p>',
  'dati-locali': '<p class="segnaposto">[x]</p>',
};

function prova() {
  const e = esito('Testi pubblicati e riserva dell\'estrazione');
  const err = x => e.errori.push(x);
  const cfg = config();

  /* ---------- 1. i sorgenti e il controllo ---------- */
  let testi;
  try { testi = TP.leggiTesti(); } catch (x) { err(x.message); return e; }
  for (const [l, gruppo] of Object.entries(testi)) for (const [id, s] of Object.entries(gruppo)) {
    const voce = cfg.testi[TP.TESTI.find(x => x.id === id).voce];
    for (const x of TP.errori(s, id, l, voce)) err(x);
  }
  for (const [id, s] of Object.entries(BUONE)) { const x = TP.errori(s, id, 'it', null); if (x.length) err(`il testo d'esempio di ${id} è rifiutato: ${x.join('; ')}`); }
  const versione = { versione: '1.0', data: '2027-01-15' };
  const casi = [
    ['informativa', s => s + '<script>alert(1)</script>', 'script'],
    ['informativa', s => s + '<p onclick="x()">a</p>', 'gestore'],
    ['informativa', s => s + '<p style="color:red">a</p>', 'stile'],
    ['informativa', s => s + '<img src="https://esempio.example/a.png">', 'immagine'],
    ['informativa', s => s + '<a href="javascript:alert(1)">a</a>', 'javascript:'],
    ['informativa', s => s + '<a href="http://esempio.example/">a</a>', 'http'],
    ['informativa', s => s + '<iframe></iframe>', 'iframe'],
    ['informativa', s => s + '<p>a <b>b</p>', 'elemento non ammesso'],
    ['informativa', s => s + '<p>non chiuso', 'non chiuso'],
    ['informativa', s => s + '<p>1 < 2</p>', '< fuori da un elemento'],
    ['informativa', s => s.replace('{casella_contatto}', ''), 'casella per gli utenti mancante'],
    ['informativa', s => s.replace('{titolare}', ''), 'titolare mancante'],
    ['informativa', s => s + '<p>{casella_autorita}</p>', 'casella per le autorità fuori dalle note legali'],
    ['informativa', s => s.replace('class="opposizione"', ''), 'senza riquadro dell\'opposizione'],
    ['informativa', s => s.replace(' id="dove-stanno-i-dati"', ''), 'senza «Dove stanno i dati»'],
    ['informativa', s => s + '<p>Via Inventata 1, 10100 Torino</p>', 'indirizzo postale'],
    ['informativa', s => s + '<p>{indirizzo}</p>', 'segnaposto sconosciuto'],
    ['note-legali', s => s.replace('<p lang="en">Authorities: {casella_autorita}</p>', ''), 'casella per le autorità senza parte in inglese'],
    ['note-legali', s => s.replace('{licenze}', ''), 'senza licenze'],
    ['condizioni-uso', s => s.replace('{casella_contatto}', ''), 'condizioni senza casella'],
    ['dati-locali', s => s + '<p>{casella_autorita}</p>', 'casella per le autorità nella scheda «Dati locali»'],
  ];
  for (const [id, cambia, che] of casi) if (!TP.errori(cambia(BUONE[id]), id, 'it', null).length) err(`il controllo dei testi accetta: ${che} (${id})`);
  if (!TP.errori(BUONE['dati-locali'], 'dati-locali', 'it', versione).length) err('il controllo accetta un segnaposto con una versione nella configurazione');
  if (!TP.errori('<p>Testo vero.</p>', 'dati-locali', 'it', null).length) err('il controllo accetta un testo senza segnaposto e senza versione');
  if (TP.errori('<p>Testo vero.</p>', 'dati-locali', 'it', versione).length) err('il controllo rifiuta un testo con la sua versione');
  if (TP.errori(BUONE['note-legali'].replace(' lang="en"', ''), 'note-legali', 'en', null).length) err('il testo inglese delle note legali non ha bisogno di lang="en"');

  /* ---------- 2. le uscite ---------- */
  const autorita = cfg.caselle.autorita;
  for (const u of USCITE) {
    const f = leggiUscita(u), pagina = f['index.html'] || '';
    for (const x of TP.TESTI) {
      const t = f[`testi/it/${x.id}.html`];
      if (!t) { err(`dist/${u}/testi/it/${x.id}.html manca`); continue; }
      if (/<script/i.test(t) || /\son[a-z]+\s*=/i.test(t)) err(`dist/${u}/testi/it/${x.id}.html: la pagina di testo contiene script o gestori`);
      if (!/<html lang="it"/.test(t) || !t.includes(cfg.nome + ', progetto di ' + cfg.titolare)) err(`dist/${u}/testi/it/${x.id}.html: lingua o titolare accanto al nome mancanti`);
      if (!/<meta name="tdm-reservation" content="1">/.test(t)) err(`dist/${u}/testi/it/${x.id}.html: manca la riserva dell'estrazione nei metadati`);
      const voce = cfg.testi[x.voce];
      if (!voce && (!/<p class="versione">In preparazione<\/p>/.test(t) || !/<meta name="robots" content="noindex">/.test(t))) err(`dist/${u}/testi/it/${x.id}.html: un testo in preparazione lo dice e non si fa indicizzare`);
      if (!new RegExp(`<template id="leg-${x.id}" lang="it">`).test(pagina)) err(`dist/${u}/index.html: manca il modello del testo ${x.id}`);
      if (autorita && x.id !== 'note-legali' && t.includes(autorita)) err(`dist/${u}/testi/it/${x.id}.html: la casella per le autorità sta soltanto nelle note legali`);
    }
    // nella pagina dell'app la casella per le autorità sta soltanto nel modello delle note legali
    if (autorita) {
      const senza = pagina.replace(/<template id="leg-note-legali[^"]*"[\s\S]*?<\/template>/g, '');
      if (senza.includes(autorita)) err(`dist/${u}/index.html: la casella per le autorità compare fuori dalle note legali`);
      if (f['app.js'] && f['app.js'].includes(autorita)) err(`dist/${u}/app.js: la casella per le autorità scritta nel codice dell'app`);
    }
    if (!/<link rel="privacy-policy" href="testi\/it\/informativa\.html">/.test(pagina) || !/<link rel="terms-of-service" href="testi\/it\/condizioni-uso\.html">/.test(pagina)) err(`dist/${u}/index.html: mancano i rimandi per i programmi all'informativa e alle condizioni d'uso`);
    if (!/id="btnLegali"[^>]*data-legale="note-legali"|data-legale="note-legali"[^>]*id="btnLegali"/.test(pagina)) err(`dist/${u}/index.html: manca il tasto «Note legali» in alto`);
    if (!/id="attrib"[\s\S]{0,600}data-legale="note-legali"/.test(pagina)) err(`dist/${u}/index.html: l'angolo della mappa non porta alle note legali`);
    if (/legal-badge">Versione 1\.2|carto\.com|osmfoundation|LEGALI\b/.test(pagina + (f['app.js'] || ''))) err(`dist/${u}: restano pezzi dei testi legali v1.2`);
    for (const g of ['index.html', 'licenze/index.html']) if (!/<meta name="tdm-reservation" content="1">/.test(f[g] || '')) err(`dist/${u}/${g}: manca la riserva dell'estrazione nei metadati`);
  }

  /* ---------- 3. robots.txt ---------- */
  const pub = leggiUscita('pubblica'), red = leggiUscita('redazione');
  const gruppi = [], righe = String(pub['robots.txt'] || '').split('\n').map(r => r.replace(/#.*$/, '').trim()).filter(Boolean);
  for (const r of righe) {
    const [k, ...v] = r.split(':'), val = v.join(':').trim();
    if (/^user-agent$/i.test(k)) { if (!gruppi.length || gruppi[gruppi.length - 1].regole.length) gruppi.push({ chi: [], regole: [] }); gruppi[gruppi.length - 1].chi.push(val.toLowerCase()); }
    else if (/^(dis)?allow$/i.test(k) && gruppi.length) gruppi[gruppi.length - 1].regole.push(k.toLowerCase() + ':' + val);
    else err('robots.txt: riga non ammessa «' + r + '»');
  }
  const esclusi = new Set(gruppi.filter(g => g.regole.join() === 'disallow:/').flatMap(g => g.chi));
  const tutti = gruppi.find(g => g.chi.includes('*'));
  if (!tutti || tutti.regole.join() !== 'disallow:') err('robots.txt: gli altri programmi devono restare ammessi («User-agent: *» con «Disallow:» vuoto)');
  for (const g of gruppi) if (!g.chi.includes('*') && g.regole.join() !== 'disallow:/') err('robots.txt: il gruppo di ' + g.chi.join(', ') + ' non nega tutto');
  for (const n of ['gptbot', 'claudebot', 'google-extended', 'applebot-extended', 'ccbot', 'meta-externalagent', 'bytespider', 'perplexitybot', 'oai-searchbot']) if (!esclusi.has(n)) err('robots.txt: manca ' + n);
  for (const n of ['googlebot', 'bingbot', 'applebot', '*']) if (esclusi.has(n)) err('robots.txt: ' + n + ' non è un programma dichiarato per l\'addestramento o l\'estrazione di dati: resta ammesso');
  if (!/^User-agent: \*\nDisallow: \/\n$/.test(red['robots.txt'] || '')) err('dist/redazione/robots.txt: l\'app della redazione nega tutto a tutti');

  /* ---------- 4. TDMRep ---------- */
  let tdm = null;
  try { tdm = JSON.parse(pub['.well-known/tdmrep.json']); } catch (x) { err('dist/pubblica/.well-known/tdmrep.json manca o non è JSON'); }
  if (tdm) {
    const r = Array.isArray(tdm) && tdm.find(x => x.location === '/*');
    if (!r || r['tdm-reservation'] !== 1) err('tdmrep.json: manca la regola «/*» con «tdm-reservation»: 1');
    const politica = TP.politica(cfg);
    if (politica && (!r || r['tdm-policy'] !== politica)) err('tdmrep.json: il rinvio alle condizioni d\'uso (tdm-policy) deve essere ' + politica);
    if (politica && !pub['index.html'].includes(`<meta name="tdm-policy" content="${politica}">`)) err('index.html: manca il rinvio alle condizioni d\'uso nei metadati');
  }
  if (red['.well-known/tdmrep.json']) err('dist/redazione: tdmrep.json è dell\'app pubblica');
  e.note.push(`testi: ${Object.entries(testi).map(([l, g]) => l + ' ' + Object.keys(g).length).join(', ')}; ${casi.length + 3} casi sbagliati rifiutati; robots.txt: ${esclusi.size} programmi esclusi; tdmrep.json con rinvio ${TP.politica(cfg) ? 'alle condizioni d\'uso' : 'assente (manca l\'indirizzo pubblico)'}`);
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
