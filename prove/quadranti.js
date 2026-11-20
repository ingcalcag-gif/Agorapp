/* Prova: quadranti, indice e archivio di prova (voce T-021; docs/formato-eventi.md; libro mastro § 2.4, «La lettura
   degli eventi»; § 2.6).

   1. La griglia: Torino, Milano, le isole e gli angoli dell'Italia cadono nel quadrante giusto; i punti sul bordo vanno
      sempre nello stesso quadrante; il quadrante e gli otto intorno; un punto fuori dall'Italia non ha quadrante.
   2. Le regioni (sorgenti/dati/regioni.json, da Natural Earth): venti, ciascuna con il suo capoluogo dentro e il punto
      interno nella regione; le isole minori vanno alla loro regione.
   3. L'archivio di prova in prova/archivio/ è esattamente ciò che lo strumento produce dalla data scritta nell'indice
      (nessuno lo ha modificato a mano); l'indice è valido; ogni evento è valido e sta nel suo quadrante; i conteggi per
      quadrante e per regione tornano; i collegamenti portano solo al dominio riservato .example.
   4. L'archivio di prova è l'unico: nessun file di quadranti nell'app montata né altrove nel repository.
   5. Un indice o un quadrante manomessi (altra griglia, percorso con «..», evento di un altro quadrante) non si usano.
   Gli eventi sono inventati (strumenti/archivio-prova.json, approvati da Lorenzo il 20/11/2026). */
'use strict';
const fs = require('fs');
const path = require('path');
const { RADICE, DIST, elencaFile, esito, eseguiDaSola } = require('./comune.js');
const E = require('../sorgenti/moduli/eventi.js');
const Q = require('../sorgenti/moduli/quadranti.js');

const ARCHIVIO = path.join(RADICE, 'prova', 'archivio');
const CAPOLUOGHI = { Piemonte: [45.0703, 7.6869], "Valle d'Aosta": [45.7372, 7.3206], Lombardia: [45.4642, 9.19], 'Trentino-Alto Adige': [46.0679, 11.1211],
  Veneto: [45.438, 12.3358], 'Friuli-Venezia Giulia': [45.6495, 13.7768], Liguria: [44.4056, 8.9463], 'Emilia-Romagna': [44.4949, 11.3426],
  Toscana: [43.7696, 11.2558], Umbria: [43.1107, 12.3908], Marche: [43.6158, 13.5189], Lazio: [41.9028, 12.4964], Abruzzo: [42.3498, 13.3995],
  Molise: [41.5603, 14.6627], Campania: [40.8518, 14.2681], Puglia: [41.1171, 16.8719], Basilicata: [40.6404, 15.8056], Calabria: [38.9098, 16.5877],
  Sicilia: [38.1157, 13.3615], Sardegna: [39.2238, 9.1217] };
const ISOLE = [['Lampedusa', 35.5, 12.6, 'Sicilia'], ['Pantelleria', 36.83, 11.94, 'Sicilia'], ['Ponza', 40.896, 12.958, 'Lazio'], ['Capri', 40.5532, 14.2222, 'Campania'],
  ['Elba', 42.78, 10.25, 'Toscana'], ['Tremiti', 42.12, 15.5, 'Puglia'], ['La Maddalena', 41.2135, 9.4069, 'Sardegna'], ['Lido di Venezia', 45.41, 12.37, 'Veneto']];

async function prova() {
  const e = esito('Quadranti e archivio di prova');

  // 1. Griglia.
  const attesi = [['Torino', 45.0703, 7.6869, 'q21-01'], ['Borgo Po, Torino', 45.0612, 7.7052, 'q21-02'], ['Milano', 45.4642, 9.19, 'q22-04'],
    ['Roma', 41.9028, 12.4964, 'q14-09'], ['Palermo', 38.1157, 13.3615, 'q06-11'], ['Lampedusa', 35.5, 12.6, 'q00-10'], ['Vetta d\'Italia', 47.0923, 12.1866, 'q25-09'],
    ['Otranto', 40.1439, 18.4911, 'q10-19'], ['bordo sud-ovest di q21-01', 44.85, 7.1, 'q21-01'], ['appena sotto', 44.849999, 7.099999, 'q20-00']];
  for (const [n, la, lo, q] of attesi) if (Q.quadrante(la, lo) !== q) e.errori.push(`quadrante di ${n}: ${Q.quadrante(la, lo)}, atteso ${q}`);
  for (const [n, la, lo] of [['Parigi', 48.8566, 2.3522], ['Atene', 37.98, 23.73], ['Vienna', 48.2, 16.37]]) if (Q.quadrante(la, lo)) e.errori.push(`${n} ha un quadrante: ${Q.quadrante(la, lo)}`);
  if (Q.intorno('q21-01').length !== 9 || Q.intorno('q00-00').length !== 4 || Q.intorno('q26-20').length !== 4) e.errori.push('il quadrante e gli otto intorno non tornano');
  const c = Q.confini('q21-01');
  if (Math.abs(c.ovest - 7.1) > 1e-9 || Math.abs(c.sud - 44.85) > 1e-9 || Math.abs(c.est - 7.7) > 1e-9 || Math.abs(c.nord - 45.3) > 1e-9) e.errori.push('confini di q21-01: ' + JSON.stringify(c));

  // 2. Regioni.
  const REG = require('../sorgenti/dati/regioni.json').regioni;
  if (REG.length !== 20) e.errori.push(`regioni: ${REG.length} invece di 20`);
  for (const [r, [la, lo]] of Object.entries(CAPOLUOGHI)) if (Q.regione(la, lo, REG) !== r) e.errori.push(`il capoluogo di ${r} cade in ${Q.regione(la, lo, REG)}`);
  for (const r of REG) if (Q.regione(r.punto[1], r.punto[0], REG) !== r.nome) e.errori.push(`il punto interno di ${r.nome} cade in ${Q.regione(r.punto[1], r.punto[0], REG)}`);
  for (const [n, la, lo, r] of ISOLE) if (Q.regione(la, lo, REG) !== r) e.errori.push(`${n} cade in ${Q.regione(la, lo, REG)}, attesa ${r}`);

  // 3. Archivio di prova.
  if (!fs.existsSync(path.join(ARCHIVIO, 'indice.json'))) { e.errori.push('manca prova/archivio/indice.json'); return e; }
  const indice = JSON.parse(fs.readFileSync(path.join(ARCHIVIO, 'indice.json'), 'utf8'));
  const errIndice = Q.controllaIndice(indice);
  if (errIndice.length) e.errori.push('indice dell\'archivio di prova: ' + errIndice.join('; '));
  const da = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date(indice.generato));
  const strumento = await import('../strumenti/genera-archivio-prova.mjs');
  const atteso = strumento.archivioProva(da).file;
  const presenti = elencaFile(ARCHIVIO);
  for (const f of presenti) if (!(f in atteso)) e.errori.push(`prova/archivio/${f}: lo strumento non lo produce (rigenera con node strumenti/genera-archivio-prova.mjs --da=${da})`);
  for (const [f, t] of Object.entries(atteso)) {
    if (!presenti.includes(f)) e.errori.push(`prova/archivio/${f}: manca (rigenera con --da=${da})`);
    else if (fs.readFileSync(path.join(ARCHIVIO, f), 'utf8') !== t) e.errori.push(`prova/archivio/${f}: diverso da ciò che produce lo strumento (modificato a mano? rigenera con --da=${da})`);
  }
  const voc = strumento.vocabolarioApp();
  let totale = 0;
  for (const [q, x] of Object.entries(indice.quadranti || {})) {
    const p = path.join(ARCHIVIO, x.file); if (!fs.existsSync(p)) continue;
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    const letti = Q.eventiDelQuadrante(j, q, { vocabolario: voc });
    if (letti.scartati) e.errori.push(`${x.file}: ${letti.scartati} eventi non validi o fuori dal quadrante`);
    if (letti.eventi.length !== x.eventi) e.errori.push(`${x.file}: ${letti.eventi.length} eventi, l'indice ne dice ${x.eventi}`);
    if (Q.impronta(fs.readFileSync(p, 'utf8')) !== x.v) e.errori.push(`${x.file}: la versione nell'indice non corrisponde al contenuto`);
    if (j['tdm-reservation'] !== 1) e.errori.push(`${x.file}: manca la riserva dell'estrazione`);
    for (const ev of letti.eventi) {
      totale++;
      if (ev.fonte.collegamento && !/^https:\/\/[a-z0-9-]+\.example\//.test(ev.fonte.collegamento)) e.errori.push(`evento ${ev.id}: collegamento fuori dal dominio .example`);
    }
  }
  const perRegione = (indice.regioni || []).reduce((n, r) => n + r.eventi, 0);
  if (perRegione !== totale) e.errori.push(`eventi per regione ${perRegione}, nei quadranti ${totale}`);
  const regioni = Object.fromEntries((indice.regioni || []).map(r => [r.nome, r.eventi]));
  if (!regioni.Piemonte || !regioni.Lombardia) e.errori.push('l\'archivio di prova non ha eventi in Piemonte e in Lombardia: ' + JSON.stringify(regioni));
  if (indice['tdm-reservation'] !== 1) e.errori.push('indice senza la riserva dell\'estrazione');
  const fine = Math.max(...Object.values(atteso).filter(t => t.includes('"eventi-quadrante"')).flatMap(t => JSON.parse(t).eventi.map(E.uscitaMs)));
  const giorniRestanti = Math.floor((fine - Date.now()) / 864e5);
  e.note.push(`archivio di prova del ${da}: ${totale} eventi in ${Object.keys(indice.quadranti || {}).length} quadranti; ${Object.entries(regioni).map(([k, v]) => k + ' ' + v).join(', ')}; l'ultimo evento esce tra ${giorniRestanti} giorni`);
  if (giorniRestanti < 7) e.note.push('l\'archivio di prova è quasi finito: rigeneralo con node strumenti/genera-archivio-prova.mjs');

  // 4. Un solo archivio.
  const fuori = elencaFile(RADICE).filter(f => /(^|\/)quadranti\/q\d{2}-\d{2}/.test(f) && !f.startsWith('prova/archivio/') && !f.includes('node_modules/'));
  if (fuori.length) e.errori.push('file di quadranti fuori da prova/archivio/: ' + fuori.slice(0, 5).join(', '));
  if (elencaFile(DIST).some(f => /indice\.json$|quadranti\//.test(f))) e.errori.push('l\'app montata contiene file dell\'archivio');

  // 5. Indice e quadranti manomessi.
  const rotto = (cambia) => { const j = JSON.parse(JSON.stringify(indice)); cambia(j); return Q.controllaIndice(j).length > 0; };
  if (!rotto(j => { j.griglia.passo_lat = 0.5; })) e.errori.push('accettato un indice con un\'altra griglia');
  if (!rotto(j => { const q = Object.keys(j.quadranti)[0]; j.quadranti[q].file = '../../segreti.json'; })) e.errori.push('accettato un indice con un percorso che esce dalla cartella');
  if (!rotto(j => { j.quadranti['q99-99'] = { file: 'quadranti/x.json', v: 'x', eventi: 1 }; })) e.errori.push('accettato un quadrante inesistente');
  if (!rotto(j => { j.versione = 2; })) e.errori.push('accettato un indice di un\'altra versione');
  const q0 = Object.keys(indice.quadranti || {})[0];
  if (q0) {
    const j = JSON.parse(fs.readFileSync(path.join(ARCHIVIO, indice.quadranti[q0].file), 'utf8'));
    const altro = Object.keys(indice.quadranti).find(q => q !== q0);
    if (altro && Q.eventiDelQuadrante(j, altro).eventi.length) e.errori.push('accettati eventi dichiarati di un altro quadrante');
    j.eventi.push(Object.assign({}, j.eventi[0], { id: 'aaaaaaaaaaaaaaaa-aaaaaaaa', lat: 41.9, lng: 12.5 }));
    j.eventi.push(Object.assign({}, j.eventi[0], { id: 'bbbbbbbbbbbbbbbb-bbbbbbbb', immagine: 'https://esempio.example/x.jpg' }));
    if (Q.eventiDelQuadrante(j, q0).scartati !== 2) e.errori.push('non scartati un evento di Roma in un quadrante del Nord e un evento con l\'immagine');
  }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
