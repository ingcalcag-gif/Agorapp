/* Prova: la memoria del telefono passa da un solo modulo e da un elenco chiuso (voce T-026 del piano di adeguamento;
   libro mastro, § 3.7, § 30.1 scelta 2, § 2.5 principio 4, § 4.1; documento: docs/dati-locali.md).

   Qui stanno i controlli che si possono fare leggendo il codice e provando il modulo con una memoria finta; ciò che il
   telefono contiene davvero dopo un giro completo nell'app lo controlla prove/browser/memoria.js.

   1. L'elenco chiuso è ben formato: nomi unici, senza il nome del servizio, ognuno in una riga della scheda «Dati
      locali» oppure tra gli strumenti della Redazione; le chiavi delle funzioni tolte non sono nell'elenco.
   2. Il modulo fa ciò che deve: una chiave fuori elenco non si legge e non si scrive; all'avvio i dati salvati con i
      nomi di prima traslocano sotto i nomi nuovi, così come sono, e i nomi di prima spariscono; le chiavi delle
      funzioni tolte si cancellano senza essere lette; le chiavi di altre pagine non si toccano; senza spazio il nome di
      prima resta; un'app senza area riservata cancella le chiavi della Redazione senza leggerle.
   3. Nessun altro file dei sorgenti, e nessun file dell'app montata oltre a moduli.js, usa gli strumenti del browser
      che salvano sul telefono (memoria del browser, memoria della scheda, base di dati, memoria per i file, cookie).
   4. Ogni lettura e ogni scrittura dell'app nomina una chiave dell'elenco, con la forma giusta; ogni chiave
      dell'elenco è usata.
   5. Il documento docs/dati-locali.md elenca le stesse chiavi del modulo. */
'use strict';
const fs = require('fs');
const path = require('path');
const { RADICE, DIST, USCITE, elencaFile, esito, eseguiDaSola, riga, config } = require('./comune.js');

const SORGENTI = path.join(RADICE, 'sorgenti');
const MODULO = 'moduli/memoria.js';
const M = require(path.join(SORGENTI, MODULO));

/* Una memoria finta, come quella del browser; annota le chiavi lette, per controllare che cosa non si legge.
   piena(k): true se scrivere la chiave k deve fallire per mancanza di spazio. */
function memoriaFinta(inizio = {}, piena = () => false) {
  const dati = new Map(Object.entries(inizio)), lette = [];
  return { dati, lette,
    getItem: k => { lette.push(k); return dati.has(k) ? dati.get(k) : null; },
    setItem: (k, v) => { if (piena(k)) throw new Error('spazio esaurito'); dati.set(k, String(v)); },
    removeItem: k => { dati.delete(k); } };
}
function casseFinte() {
  const aperte = [], cancellate = [];
  return { aperte, cancellate, open: async n => { aperte.push(n); return { nome: n }; }, delete: async n => { cancellate.push(n); return true; } };
}
const oggetto = m => Object.fromEntries([...m.dati.entries()].sort());
const uguali = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function lancia(f) { try { f(); return false; } catch (e) { return /elenco chiuso/.test(String(e && e.message)); } }

/* Strumenti del browser che salvano sul telefono, scritti come li scrive il codice. */
const USI = [
  [/\b(?:localStorage|sessionStorage|indexedDB)\s*[.\[]/g, 'memoria o base di dati del browser'],
  [/\b(?:window|self|globalThis)\s*\.\s*(?:localStorage|sessionStorage|indexedDB|caches|cookieStore)\b/g, 'strumento del browser che salva sul telefono'],
  [/\[\s*['"`](?:localStorage|sessionStorage|indexedDB|caches|cookie|cookieStore)['"`]\s*\]/g, 'strumento del browser che salva sul telefono'],
  [/(?<![\w.$])caches\s*\.\s*(?:open|delete|keys|match|has)\b/g, 'memoria del browser per i file'],
  [/\bdocument\s*\.\s*cookie\b/g, 'cookie'],
  [/\bcookieStore\b/g, 'cookie'],
  [/\bnavigator\s*\.\s*storage\b/g, 'spazio del browser'],
  [/\bopenDatabase\s*\(/g, 'base di dati del browser'],
];
/* Nei sorgenti, fuori dal modulo, questi nomi non compaiono nemmeno nei commenti. */
const NOMI = /\b(?:localStorage|sessionStorage|indexedDB|IndexedDB|cookieStore)\b/g;

function prova() {
  const e = esito('Memoria del telefono: un modulo e un elenco chiuso');
  const err = s => e.errori.push(s);
  const nomeServizio = String(config().nome || '').toLowerCase();

  /* ---------- 1. l'elenco ---------- */
  const nomi = M.ELENCO.map(v => v.nome), prime = M.ELENCO.map(v => v.prima).filter(Boolean);
  if (new Set(nomi).size !== nomi.length) err('elenco: una chiave compare due volte');
  if (new Set(prime).size !== prime.length) err('elenco: un nome di prima compare due volte');
  for (const v of M.ELENCO) {
    if (!/^(?:dl|red)_[a-z]+$/.test(v.nome)) err(`elenco: «${v.nome}» non ha la forma dl_… o red_…`);
    if (nomeServizio && v.nome.toLowerCase().includes(nomeServizio)) err(`elenco: «${v.nome}» contiene il nome del servizio`);
    if (!['memoria', 'file'].includes(v.dove)) err(`elenco: «${v.nome}» ha un «dove» sconosciuto`);
    if (v.dove === 'memoria' && !['json', 'testo'].includes(v.forma)) err(`elenco: «${v.nome}» non dice se è un testo o un valore in JSON`);
    if (!v.cosa) err(`elenco: «${v.nome}» non dice che cosa contiene`);
    if (v.redazione) { if (!v.nome.startsWith('red_') || v.riga) err(`elenco: «${v.nome}» è della Redazione: si chiama red_… e non sta nella scheda`); }
    else if (!v.nome.startsWith('dl_') || !M.RIGHE[v.riga]) err(`elenco: «${v.nome}» deve chiamarsi dl_… e rientrare in una riga della scheda «Dati locali»`);
    if (v.prima && nomi.includes(v.prima)) err(`elenco: il nome di prima «${v.prima}» è anche una chiave di oggi`);
  }
  for (const t of M.TOLTE) {
    if (nomi.includes(t.nome) || prime.includes(t.nome)) err(`chiavi tolte: «${t.nome}» è anche nell'elenco`);
    if (!['memoria', 'sessione'].includes(t.dove)) err(`chiavi tolte: «${t.nome}» ha un «dove» sconosciuto`);
  }
  if (!uguali(M.chiavi(false).filter(k => k.startsWith('red_')), [])) err('chiavi(false) comprende chiavi della Redazione');

  /* ---------- 2. il modulo ---------- */
  const inMemoria = M.ELENCO.filter(v => v.dove === 'memoria');
  const vecchi = {};   // valori di prima: testi, JSON, e un valore che non è JSON dove l'app si aspetta JSON
  inMemoria.forEach((v, i) => { vecchi[v.prima] = v.forma === 'testo' ? 'valore ' + i : i === 0 ? '{rotto' : JSON.stringify({ n: i, t: 'àè €' }); });
  const tolteMem = Object.fromEntries(M.TOLTE.filter(t => t.dove === 'memoria').map(t => [t.nome, 'da non leggere']));
  const tolteSes = Object.fromEntries(M.TOLTE.filter(t => t.dove === 'sessione').map(t => [t.nome, 'da non leggere']));
  const ALTRE = { altra_pagina: 'di un\'altra pagina', agorapp_sconosciuta: 'non è nostra', dl_sconosciuta: 'nemmeno questa' };

  {  // trasloco completo, con l'area riservata
    const mem = memoriaFinta({ ...vecchi, ...tolteMem, ...ALTRE }), ses = memoriaFinta({ ...tolteSes, altra: 'x' }), cas = casseFinte();
    const A = M.crea({ redazione: true, memoria: mem, sessione: ses, casse: cas });
    const fatto = A.avvia();
    const atteso = { ...ALTRE }; inMemoria.forEach(v => { atteso[v.nome] = vecchi[v.prima]; });
    if (!uguali(oggetto(mem), Object.fromEntries(Object.entries(atteso).sort()))) err('trasloco: la memoria dopo l\'avvio non è quella attesa: ' + JSON.stringify(oggetto(mem)));
    if (!uguali(fatto.traslocate.slice().sort(), inMemoria.map(v => v.nome).sort())) err('trasloco: avvia() non dice tutte le chiavi traslocate');
    if (!uguali(oggetto(ses), { altra: 'x' })) err('trasloco: la memoria della scheda non è stata ripulita, o è stata toccata una chiave di altri');
    const letteVietate = mem.lette.concat(ses.lette).filter(k => k in tolteMem || k in tolteSes || k in ALTRE);
    if (letteVietate.length) err('trasloco: lette chiavi che andavano solo cancellate o lasciate stare: ' + [...new Set(letteVietate)].join(', '));
    const fileDiPrima = M.ELENCO.filter(v => v.dove === 'file' && v.prima).map(v => v.prima);
    if (!uguali(cas.cancellate.slice().sort(), fileDiPrima.slice().sort())) err('trasloco: i file con il nome di prima non sono stati cancellati (o è stato cancellato altro): ' + cas.cancellate.join(', '));
    if (A.avvia().traslocate.length) err('trasloco: il secondo avvio trasloca di nuovo');
    if (A.leggi('dl_eventi', 'ripiego') !== 'ripiego') err('leggi: un valore che non è JSON deve dare il valore di ripiego');
    if (A.testo('dl_tema', 'x') !== vecchi.agorapp_theme) err('testo: non restituisce il valore traslocato');
    if (!A.scrivi('dl_calendario', { a: true }) || mem.dati.get('dl_calendario') !== '{"a":true}') err('scrivi: un oggetto si scrive come JSON');
    if (!A.scrivi('dl_lingua', 'en') || mem.dati.get('dl_lingua') !== 'en') err('scrivi: un testo si scrive così com\'è');
    A.togli('dl_lingua'); if (mem.dati.has('dl_lingua') || A.testo('dl_lingua', 'it') !== 'it') err('togli: la chiave resta');
    for (const [nome, f] of [['leggi', () => A.leggi('altra_pagina')], ['testo', () => A.testo('agorapp_events')], ['scrivi', () => A.scrivi('visite', 1)], ['togli', () => A.togli('altra_pagina')],
      ['leggi di una voce dei file', () => A.leggi('dl_archivio')], ['file.open', () => A.file.open('altro')], ['file.open di una voce della memoria', () => A.file.open('dl_eventi')]])
      if (!lancia(f)) err(`${nome}: una chiave fuori elenco deve fermare il modulo con un errore`);
    if (mem.dati.has('visite')) err('scrivi: una chiave fuori elenco è stata scritta');
    if (mem.dati.get('altra_pagina') !== ALTRE.altra_pagina) err('una chiave di un\'altra pagina è stata toccata');
  }
  {  // il nome nuovo c'è già: vale quello
    const mem = memoriaFinta({ agorapp_lang: 'fr', dl_lingua: 'es' });
    M.crea({ redazione: true, memoria: mem, sessione: null, casse: null }).avvia();
    if (!uguali(oggetto(mem), { dl_lingua: 'es' })) err('trasloco: se il nome nuovo c\'è già deve valere quello, e il nome di prima sparire');
  }
  {  // senza spazio il nome di prima resta, e al prossimo avvio si riprova
    let piena = true;   // non c'è posto per le chiavi nuove; ciò che c'era può tornare al suo posto
    const mem = memoriaFinta({ agorapp_events: '[1]' }, k => piena && k.startsWith('dl_'));
    const A = M.crea({ redazione: true, memoria: mem, sessione: null, casse: null });
    if (A.avvia().traslocate.length || !uguali(oggetto(mem), { agorapp_events: '[1]' })) err('trasloco senza spazio: il dato di prima deve restare dov\'è');
    if (A.scrivi('dl_tema', 'dark') !== false) err('scrivi: senza spazio deve rispondere false');
    piena = false;
    if (!uguali(A.avvia().traslocate, ['dl_eventi']) || !uguali(oggetto(mem), { dl_eventi: '[1]' })) err('trasloco: tornato lo spazio, il dato deve traslocare');
  }
  {  // un telefono quasi pieno: il trasloco non occupa mai, nemmeno per un momento, più spazio di prima
    const grande = 'x'.repeat(1000);
    let massimo = 0;
    const mem = memoriaFinta({ agorapp_events: grande });
    const scrivi = mem.setItem;
    mem.setItem = (k, v) => { scrivi(k, v); massimo = Math.max(massimo, [...mem.dati.values()].reduce((n, x) => n + x.length, 0)); };
    M.crea({ redazione: true, memoria: mem, sessione: null, casse: null }).avvia();
    if (mem.dati.get('dl_eventi') !== grande || massimo > grande.length) err('trasloco: su un telefono quasi pieno il dato deve passare al nome nuovo senza occupare spazio in più');
  }
  {  // un'app senza area riservata: le chiavi della Redazione si cancellano senza leggerle
    const red = M.ELENCO.filter(v => v.redazione);
    const semi = {}; red.forEach(v => { semi[v.nome] = '1'; semi[v.prima] = '2'; });
    const mem = memoriaFinta({ ...semi, agorapp_lang: 'en' }), cas = casseFinte();
    const P = M.crea({ redazione: false, memoria: mem, sessione: null, casse: cas });
    P.avvia();
    if (!uguali(oggetto(mem), { dl_lingua: 'en' })) err('app senza area riservata: le chiavi della Redazione restano sul telefono: ' + JSON.stringify(oggetto(mem)));
    if (mem.lette.some(k => k in semi)) err('app senza area riservata: le chiavi della Redazione sono state lette prima di cancellarle');
    for (const v of red) if (!lancia(() => P.leggi(v.nome)) || !lancia(() => P.scrivi(v.nome, 1))) err(`app senza area riservata: «${v.nome}» si può ancora usare`);
  }
  {  // un browser che non offre la memoria: l'app lavora senza salvare
    const N = M.crea({ redazione: true, memoria: null, sessione: null, casse: null });
    let ok = true;
    try { N.avvia(); ok = N.leggi('dl_eventi', 7) === 7 && N.testo('dl_tema', 'x') === 'x' && N.scrivi('dl_tema', 'dark') === false && N.file === null; N.togli('dl_tema'); } catch (x) { ok = false; }
    if (!ok) err('senza memoria del browser il modulo deve dare i valori di ripiego e non fermarsi');
  }

  /* ---------- 3. nessun altro usa gli strumenti che salvano ---------- */
  const sorgenti = elencaFile(SORGENTI).filter(f => /\.(js|html)$/.test(f) && !f.startsWith('vendor/') && f !== MODULO);
  const testi = {};
  for (const f of sorgenti) {
    const t = testi[f] = fs.readFileSync(path.join(SORGENTI, f), 'utf8');
    for (const [re, che] of USI) for (const m of t.matchAll(re)) err(`sorgenti/${f}, riga ${riga(t, m.index)}: ${che} usato fuori dal modulo della memoria («${m[0].trim()}»)`);
    if (f.endsWith('.js')) for (const m of t.matchAll(NOMI)) err(`sorgenti/${f}, riga ${riga(t, m.index)}: «${m[0]}» nominato fuori dal modulo della memoria`);
  }
  let montati = 0;
  for (const u of USCITE) for (const f of elencaFile(path.join(DIST, u))) {
    if (!/\.(js|html)$/.test(f) || f.startsWith('lib/') || f === 'moduli.js') continue;
    montati++;
    const t = fs.readFileSync(path.join(DIST, u, f), 'utf8');
    for (const [re, che] of USI) for (const m of t.matchAll(re)) err(`dist/${u}/${f}: ${che} usato fuori da moduli.js («${m[0].trim()}»)`);
  }

  /* ---------- 4. ogni uso nomina una chiave dell'elenco ---------- */
  const usate = new Map();
  const FORME = { leggi: ['json'], testo: ['testo'], scrivi: ['json', 'testo'], togli: ['json', 'testo'] };
  let usi = 0;
  for (const [f, t] of Object.entries(testi)) {
    for (const m of t.matchAll(/\bMEM\s*\.\s*([A-Za-z_$][\w$]*)\s*(\(\s*([^,)]*))?/g)) {
      const dove = `sorgenti/${f}, riga ${riga(t, m.index)}`;
      if (m[1] === 'file' || m[1] === 'avvia') continue;
      if (!FORME[m[1]]) { err(`${dove}: MEM.${m[1]} non è una funzione della memoria`); continue; }
      const lit = (m[3] || '').trim().match(/^'([^'\\]*)'$/);
      if (!lit) { err(`${dove}: MEM.${m[1]}(…) deve nominare la chiave per esteso, tra apici`); continue; }
      const v = M.ELENCO.find(x => x.nome === lit[1]);
      if (!v || v.dove !== 'memoria') { err(`${dove}: «${lit[1]}» non è nell'elenco chiuso`); continue; }
      if (!FORME[m[1]].includes(v.forma)) err(`${dove}: «${lit[1]}» è ${v.forma === 'json' ? 'un valore in JSON: si legge con MEM.leggi' : 'un testo: si legge con MEM.testo'}`);
      usate.set(v.nome, (usate.get(v.nome) || 0) + 1); usi++;
    }
    for (const m of t.matchAll(/\bnomeCassa\s*:\s*([^,})]+)/g)) {
      const lit = m[1].trim().match(/^'([^'\\]*)'$/), v = lit && M.ELENCO.find(x => x.nome === lit[1]);
      if (!v || v.dove !== 'file') err(`sorgenti/${f}, riga ${riga(t, m.index)}: la memoria per i file deve avere un nome dell'elenco, tra apici`);
      else { usate.set(v.nome, (usate.get(v.nome) || 0) + 1); usi++; }
    }
    for (const m of t.matchAll(/\bmemoria\s*\.\s*crea\s*\(/g)) if (!/^parti\/app1\.js$/.test(f)) err(`sorgenti/${f}, riga ${riga(t, m.index)}: la memoria si crea una volta sola, in app1.js`);
  }
  for (const v of M.ELENCO) if (!usate.has(v.nome)) err(`elenco: «${v.nome}» non è usata da nessun file dei sorgenti: una voce in più è uno scarto`);
  const moduli = fs.readFileSync(path.join(SORGENTI, 'build.js'), 'utf8').match(/const JS_MODULI = \[([^\]]*)\]/);
  if (!moduli || !moduli[1].includes('\'memoria.js\'')) err('sorgenti/build.js: memoria.js non è tra i moduli montati');

  /* ---------- 5. il documento ---------- */
  const DOC = path.join(RADICE, 'docs', 'dati-locali.md');
  if (!fs.existsSync(DOC)) err('manca docs/dati-locali.md');
  else {
    const d = fs.readFileSync(DOC, 'utf8');
    const tabella = titolo => { const i = d.indexOf(titolo); if (i < 0) return null; const resto = d.slice(i + titolo.length); const fine = resto.search(/\n## /); return fine < 0 ? resto : resto.slice(0, fine); };
    const prime = s => s == null ? null : [...s.matchAll(/^\| `([^`]+)` \|/gm)].map(m => m[1]).sort();
    const confronta = (titolo, attese) => {
      const trovate = prime(tabella(titolo));
      if (!trovate) return err(`docs/dati-locali.md: manca la sezione «${titolo}»`);
      if (!uguali(trovate, attese.slice().sort())) err(`docs/dati-locali.md, «${titolo}»: le chiavi del documento (${trovate.join(', ') || 'nessuna'}) non sono quelle del modulo (${attese.slice().sort().join(', ')})`);
    };
    confronta('## L\'elenco chiuso', M.chiavi(false));
    confronta('## Strumenti della Redazione', M.ELENCO.filter(v => v.redazione).map(v => v.nome));
    confronta('## Chiavi tolte', M.TOLTE.map(t => t.nome));
    for (const v of M.ELENCO) if (v.prima && !d.includes('`' + v.prima + '`')) err(`docs/dati-locali.md: non dice che «${v.nome}» prima si chiamava «${v.prima}»`);
    for (const r of Object.values(M.RIGHE)) if (!d.includes(r)) err(`docs/dati-locali.md: manca la riga della scheda «${r}»`);
  }

  e.note.push(`chiavi nell'elenco: ${M.chiavi(false).length} della scheda «Dati locali», ${M.ELENCO.filter(v => v.redazione).length} della Redazione; chiavi tolte: ${M.TOLTE.length}; usi nei sorgenti: ${usi}`);
  e.note.push(`${sorgenti.length} file dei sorgenti e ${montati} file montati controllati: nessuno usa da sé gli strumenti che salvano sul telefono`);
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
