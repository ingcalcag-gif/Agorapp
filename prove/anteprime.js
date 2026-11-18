/* Prova: i contenuti d'esempio di Agorà e Progetti (voce T-015; QB-3, QB-9, QB-10; allegato del 18/11/2026).

   1. Forma: ogni istanza ha icona, tavoli e incontri; ogni progetto ha la sua bacheca completa con il prossimo appuntamento.
   2. Date: gli appuntamenti vengono almeno un giorno dopo l'àncora e gli incontri passati almeno una settimana prima,
      così l'app, che sposta l'àncora tra oggi e sei giorni da oggi, non mostra mai un appuntamento passato.
   3. Niente di reale (QB-9): nessun nome della colonna «Oggi» dell'allegato, nessun atto attribuito a istituzioni reali,
      nessun segnaposto tra parentesi quadre, nessun recapito o indirizzo web, nessuna coordinata (niente va sulla mappa).
   4. Segnaposto: solo {nome}, {mese:…}, {data:…}, {mesi:…/…}, con date valide; ogni traduzione conserva gli stessi.
   5. Traduzioni: ogni testo ha la sua traduzione in inglese, spagnolo, francese e arabo; nessuna traduzione in più.
      I testi senza traduzione sono scarti noti finché il passo 3 di T-015 non li chiude. */
'use strict';
const fs = require('fs');
const path = require('path');
const { RADICE, esito, eseguiDaSola, confronta } = require('./comune.js');
const C = require('../sorgenti/contenuti_esempio.js');

/* Colonna «Oggi» dell'allegato (§§ 2-6) e altri riferimenti a realtà esistenti tolti con T-015. */
const VIETATI = ['Tambures', 'Cori di Porta Palazzo', 'Radio Barriera', 'Orchestra degli Spazi', 'Cantiere Aperto', 'Biblioteche di Strada',
  'Cortile Comune', 'Nonne Senza Confini', 'Calcio di Quartiere', 'Teatro dei Margini', 'Compagnia dei Margini', 'Storie di Portone',
  'Giornale di Strada', 'Mercato delle Competenze', 'Sartoria Condivisa', 'Ambulatorio di Quartiere', 'Spazio Neutro', 'Nonni Digitali',
  'Ricerca Barriera', 'Centro d’incontro Mirafiori Nord', 'Coordinamento di vicinato', 'Unione sportiva Vanchiglia', 'Redazione Giovani Barriera',
  'Casa del quartiere Aurora', 'Rete Solidale Mirafiori', 'via Monterosa', 'via Cottolengo', 'Foroni', 'via Cuneo', 'via Saluzzo', 'via Vespucci',
  'San Gioacchino', 'lungo Dora', 'via Frejus', 'via Garibaldi', 'Chiesa della Salute', 'Borgo Dora', 'via Andreis', 'via Saccarelli', 'via Plava',
  'corso Casale', 'parrocchi', 'corso Novara', 'via Belfiore', 'via Caboto', 'via Marco Polo', 'via Magellano', 'via Po ', 'dal Comune', 'Dal Comune',
  'Consiglio comunale', 'Statuto', 'Parlamento', 'alla Camera', 'n. 391', 'beni comuni urbani', 'ex Ingest',
  'Assemblea Aurora', 'Assemblea Esquilino', 'Assemblea Oltrarno', 'Assemblea Parco Dora', 'Assemblea Pendolari Lunghi', 'Assemblea Sanità',
  'Assemblea Spazi Liberi', 'Spazio Ex Mercato', 'Assemblea Vallette', 'Assemblea inquilini', 'Botteghe di Porta Palazzo', 'Caregiver Insieme',
  'Casa dello studente', 'Ciclofficina Borgo Vittoria', 'Collettivo Portello', 'Sordi in Città', 'Collettivo Tempo Libero', 'Comitato Albergheria',
  'Comitato Bolognina', 'Ex Scalo', 'Inquilini Falchera', 'Comitato Is Mirrionis', 'Comitato Isola', 'Comitato Monti', 'Comitato San Donato',
  'Spazi Sicuri', 'Verde Barriera', 'Educatori di strada', 'Lavanderia Collettiva', 'Genitori Scuole', 'Alberi San Donato', 'Lettura Facile',
  'Inquilini San Salvario', 'Culturale Navile', 'Mediatrici di San Berillo', 'Orti Mirafiori Sud', 'Osservatorio Pigneto', 'Suolo Libero',
  'Popolare Corvetto', 'Residenti Castello', 'Rete Case Vuote', 'Fuorisede Sud', 'NoLo Abitanti', 'Periferie Sud', 'Rete Quartieri Spagnoli',
  'Solidale San Giacomo', 'Spazi Sociali Torino', 'Stagionali della Riviera', 'Prove Popolare Aurora', 'italiano Porta Palazzo',
  'Popolare Borgo San Paolo', 'Abitare Pigneto', 'Casa Bolognina', 'Digitale Barriera', 'Lavoro Mobile', 'Migranti Ballarò', 'Sfratti Sampierdarena',
  'Fuorisede Torino', 'Psicologia in Rete', 'fuori sede Città Studi', 'Tirocinanti in Rete', 'Agorapp', 'agorapp'];
const SEGNO = /\{[^}]*\}/g;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const giorni = (a, b) => Math.round((Date.UTC(...b.split('-').map((x, i) => i === 1 ? x - 1 : +x)) - Date.UTC(...a.split('-').map((x, i) => i === 1 ? x - 1 : +x))) / 864e5);
const dataValida = s => ISO.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;

function tuttiITesti(x, f, p = []) {
  if (Array.isArray(x)) x.forEach((v, i) => tuttiITesti(v, f, p.concat(i)));
  else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) { f(k, v, p.concat(k)); tuttiITesti(v, f, p.concat(k)); }
  else if (typeof x === 'string') f(null, x, p);
}

function prova() {
  const e = esito('Contenuti d\'esempio di Agorà e Progetti');
  let D;
  try { D = C.sorgenti(); } catch (err) { e.errori.push('sorgenti/anteprime: JSON non valido: ' + err.message); return e; }
  const { agora, progetti } = D;

  // 1. Forma
  for (const [nome, x] of [['agora', agora], ['progetti', progetti]]) if (!dataValida(x.ancora || '')) e.errori.push(nome + '.json: manca l\'àncora delle date (AAAA-MM-GG)');
  if (!Array.isArray(agora.istanze) || !agora.istanze.length) e.errori.push('agora.json: nessuna istanza');
  for (const a of agora.istanze || []) {
    if (!agora.icone || !agora.icone[a.id]) e.errori.push(`istanza ${a.id}: manca l'icona`);
    if (!a.tavoli || !a.tavoli.length) e.errori.push(`istanza ${a.id}: nessun tavolo`);
    for (const t of a.tavoli || []) for (const i of (t.incontri || []).concat(t.prossimo ? [t.prossimo] : [])) {
      if (!i.via) e.errori.push(`istanza ${a.id}, tavolo ${t.n}: un incontro senza via`);
      if (!agora.citta[i.citta]) e.errori.push(`istanza ${a.id}, tavolo ${t.n}: città senza sigla (${i.citta})`);
    }
  }
  if (!Array.isArray(progetti.progetti) || !progetti.progetti.length) e.errori.push('progetti.json: nessun progetto');
  for (const p of progetti.progetti || []) {
    const b = p.bacheca || {};
    if (!progetti.tipi[p.tipo]) e.errori.push(`progetto ${p.id}: etichetta sconosciuta (${p.tipo})`);
    for (const k of ['giorno', 'inizio', 'fine', 'posto', 'via', 'stato', 'programma']) if (!(b.app || {})[k]) e.errori.push(`progetto ${p.id}: il prossimo appuntamento non ha «${k}»`);
    for (const k of ['mano', 'ancore', 'fate', 'vorrebbero', 'luoghi', 'stampa', 'di', 'a', 'nel', 'da']) if (!b[k]) e.errori.push(`progetto ${p.id}: la bacheca non ha «${k}»`);
    if (!(b.ancore || []).length) e.errori.push(`progetto ${p.id}: nessuna Ancora`);
  }

  // 2. Date: futuri almeno un giorno dopo l'àncora, passati almeno una settimana prima
  const futuro = (d, dove) => { if (giorni(agora.ancora, d) < 1) e.errori.push(`${dove}: ${d} non viene almeno un giorno dopo l'àncora ${agora.ancora}`); };
  const passato = (d, dove) => { if (giorni(d, agora.ancora) < 7) e.errori.push(`${dove}: ${d} non viene almeno una settimana prima dell'àncora ${agora.ancora}`); };
  for (const a of agora.istanze || []) {
    for (const t of a.tavoli || []) {
      // «aperto da»: non dopo il primo incontro; se ci sono già incontri, nel passato
      const primo = (t.incontri || []).length ? t.incontri[0].iso : (t.prossimo || {}).iso;
      if (primo && t.da > primo) e.errori.push(`istanza ${a.id}, tavolo ${t.n}: aperto da ${t.da}, dopo il primo incontro ${primo}`);
      if ((t.incontri || []).length) passato(t.da, `istanza ${a.id}, tavolo ${t.n}`);
      if (a.da > t.da) e.errori.push(`istanza ${a.id}: aperta da ${a.da}, dopo il tavolo ${t.n} (${t.da})`);
      (t.incontri || []).forEach((i, k) => { passato(i.iso, `istanza ${a.id}, tavolo ${t.n}, incontro ${k + 1}`); if (k && i.iso <= t.incontri[k - 1].iso) e.errori.push(`istanza ${a.id}, tavolo ${t.n}: incontri non in ordine di data`); });
      if (t.prossimo) futuro(t.prossimo.iso, `istanza ${a.id}, tavolo ${t.n}, prossimo incontro`);
    }
    if (a.conclusa) { passato(a.conclusa.iso, `istanza ${a.id}, consegna`); futuro(a.conclusa.restituzione.iso, `istanza ${a.id}, restituzione`); }
  }
  for (const p of progetti.progetti || []) {
    const b = p.bacheca || {};
    if (b.app) futuro(b.app.giorno, `progetto ${p.id}, prossimo appuntamento`);
    passato(b.da, `progetto ${p.id}`);
    for (const x of [].concat(b.ancore || [], b.fate || [])) passato(x.da, `progetto ${p.id}, ${x.nome}`);
    for (const x of (b.luoghi || {}).punti || []) passato(x.quando, `progetto ${p.id}, luoghi toccati`);
  }

  // 3. Niente di reale, niente segnaposto, recapiti o coordinate; 4. segnaposto ammessi
  const fileTesti = [['sorgenti/anteprime/agora.json', agora], ['sorgenti/anteprime/progetti.json', progetti]];
  const TR = C.traduzioni();
  for (const l of C.LINGUE) fileTesti.push(['sorgenti/anteprime/lingue/' + l + '.json', TR[l]]);
  for (const [dove, dati] of fileTesti) {
    const testoIntero = JSON.stringify(dati);
    for (const v of VIETATI) if (testoIntero.includes(v)) e.errori.push(`${dove}: compare «${v}» (QB-9: nomi e luoghi reali sostituiti con l'allegato)`);
    tuttiITesti(dati, (k, v, p) => {
      if (k === 'lat' || k === 'lng') e.errori.push(`${dove}: coordinate in ${p.join('.')}: niente va sulla mappa`);
      if (typeof v !== 'string' || p.includes('icone')) return;
      if (/\[[^\]]*\]/.test(v)) e.errori.push(`${dove}: segnaposto tra parentesi quadre in ${p.join('.')}: «${v.slice(0, 60)}»`);
      if (/@|mailto:|https?:\/\/|www\./i.test(v)) e.errori.push(`${dove}: recapito o indirizzo web in ${p.join('.')}: «${v.slice(0, 60)}»`);
      for (const s of v.match(SEGNO) || []) {
        const m = s.match(/^\{(?:nome|mese:(.{10})|data:(.{10})|mesi:(.{10})\/(.{10}))\}$/);
        if (!m) e.errori.push(`${dove}: segnaposto sconosciuto ${s} in ${p.join('.')}`);
        else for (const d of m.slice(1).filter(Boolean)) if (!dataValida(d)) e.errori.push(`${dove}: data non valida ${d} in ${s}`);
      }
    });
  }

  // 5. Traduzioni
  const testi = C.testi(D), insieme = new Set(testi), trovati = [];
  for (const l of C.LINGUE) {
    for (const t of testi) {
      if (!Object.prototype.hasOwnProperty.call(TR[l], t)) { trovati.push({ chiave: 'testo senza traduzione', dove: 'sorgenti/anteprime/lingue/' + l + '.json', dettaglio: '«' + t.slice(0, 40) + '»' }); continue; }
      const a = (t.match(SEGNO) || []).sort().join(' '), b = (String(TR[l][t]).match(SEGNO) || []).sort().join(' ');
      if (a !== b) e.errori.push(`lingue/${l}.json: la traduzione di «${t.slice(0, 50)}» non ha gli stessi segnaposto (${a || 'nessuno'} → ${b || 'nessuno'})`);
      if (!String(TR[l][t]).trim()) e.errori.push(`lingue/${l}.json: traduzione vuota per «${t.slice(0, 50)}»`);
    }
    for (const k of Object.keys(TR[l])) if (!insieme.has(k)) e.errori.push(`lingue/${l}.json: traduzione di un testo che non c'è più: «${k.slice(0, 60)}»; toglila`);
  }
  confronta(e, 'anteprime', trovati);

  e.note.push(`${(agora.istanze || []).length} istanze, ${(progetti.progetti || []).length} progetti, ${testi.length} testi da tradurre in ${C.LINGUE.join(', ')}`);
  return e;
}

module.exports = { prova, VIETATI };
eseguiDaSola(module, prova);
