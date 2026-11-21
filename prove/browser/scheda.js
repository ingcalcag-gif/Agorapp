/* Prova nel browser: la scheda dell'evento pubblico (voce T-023; libro mastro, §§ 5.2, 5.3 e 11.3).

   Serve quattro eventi inventati nel formato pubblico e apre la scheda di ciascuno:
   - completo: «Fonte:» con il nome e il collegamento (solo al tocco, senza referrer), l'avviso breve del § 5.2 accanto,
     organizzatore, nome del luogo e indirizzo su righe proprie, prezzo così come lo indica la fonte;
   - collocato a mano: la descrizione del luogo;
   - corteo: il testo dell'avviso per cortei e presidi;
   - minimo: senza organizzatore, prezzo e collegamento, la scheda non lascia righe vuote e «Fonte:» resta come testo.
   In nessuna scheda ci sono il collegamento separato al sito di chi organizza, la segnalazione per posta, immagini o
   altri collegamenti verso l'esterno. I testi nuovi hanno la traduzione nelle quattro lingue. */
'use strict';
const fs = require('fs');
const path = require('path');
const { esito, eseguiDaSola, RADICE } = require('../comune.js');
const { playwright, server, apri, pausa, archivio, eventoProva, idProva, eventiCaricati } = require('./comune.js');

const AVVISO = 'Informazioni riprese dalla fonte indicata: verifica con l’organizzatore prima di andare.';
const AVVISO_CORTEI = 'Per cortei e presidi verifica sempre con chi organizza prima di andare: luogo e orario possono cambiare.';
const TESTI_NUOVI = [AVVISO, AVVISO_CORTEI, 'Come arrivare', 'Organizza', 'Prezzo indicato dalla fonte', 'Fonte'];
const TESTI_TOLTI = ['Sito di chi organizza', 'Non è più valido? Segnalalo', 'Evento non più valido'];

const EVENTI = () => [
  eventoProva('schedacompleto', { titolo: 'Concerto inventato', luogo: 'Sala Inventata', indirizzo: 'Via Inventata 1, Torino', organizzatore: 'Circolo Inventato',
    prezzo: '10', fonte: { testo: 'Circolo Inventato, sito', collegamento: 'https://circolo.esempio.invalid/concerto' } }),
  eventoProva('schedaamano', { titolo: 'Passeggiata inventata', strato: 'arte', luogo: 'Giardino Inventato', indirizzo: 'Giardino Inventato, Torino', collocazione: 'a_mano',
    descrizione_luogo: 'Ritrovo alla fontana, entrando dal cancello verde.', lat: 45.0722, lng: 7.6841 }),
  eventoProva('schedacorteo', { titolo: 'Corteo inventato', strato: 'manifestazioni', luogo: 'Piazza Inventata', indirizzo: 'Piazza Inventata, Torino', organizzatore: 'Comitato Inventato', lat: 45.0689, lng: 7.6902 }),
  eventoProva('schedaminimo', { titolo: 'Incontro inventato', strato: 'sociale', luogo: 'Cortile Inventato', indirizzo: 'Via Finta 3, Torino', lat: 45.0741, lng: 7.6815 }),
];
const STRATI = { musica: { on: true }, arte: { on: true }, manifestazioni: { on: true }, sociale: { on: true } };

/* Ciò che la scheda aperta mostra, letto dalla pagina. */
const leggi = p => p.evaluate(() => {
  const f = document.querySelector('#foglio-slot .foglio'); if (!f) return null;
  const t = sel => { const x = f.querySelector(sel); return x ? x.textContent.replace(/\s+/g, ' ').trim() : null; };
  const fonte = f.querySelector('.fonte');
  const a = fonte && fonte.querySelector('a');
  const segue = (x, y) => !!(x && y && (x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING));
  return {
    titolo: t('h2'), nome: t('.dato-luogo .nome-luogo'), indirizzo: t('.dato-luogo .indirizzo'), comeArrivare: t('.dato-luogo .come-arrivare'),
    righeDiverse: (() => { const n = f.querySelector('.dato-luogo .nome-luogo'), i = f.querySelector('.dato-luogo .indirizzo'); return !!(n && i && n !== i && n.getBoundingClientRect().bottom <= i.getBoundingClientRect().top + 1); })(),
    organizzatore: t('.dato-organizzatore .t'), organizzatoreEtichetta: t('.dato-organizzatore .meta'),
    prezzo: t('.dato-prezzo .t'), prezzoEtichetta: t('.dato-prezzo .meta'),
    fonte: fonte ? fonte.querySelector('.meta').textContent.replace(/\s+/g, ' ').trim() : null,
    avviso: t('.fonte .avviso-fonte'), avvisoDopoFonte: fonte ? segue(fonte.querySelector('.meta'), fonte.querySelector('.avviso-fonte')) : false,
    attenzione: !!(fonte && fonte.classList.contains('attenzione')),
    collegamento: a ? { href: a.getAttribute('href'), testo: a.textContent, target: a.getAttribute('target'), rel: a.getAttribute('rel'), referrer: a.getAttribute('referrerpolicy') } : null,
    esterni: [...f.querySelectorAll('a[href]')].map(x => x.getAttribute('href')).filter(h => !/^geo:/.test(h)),
    posta: f.querySelectorAll('a[href^="mailto:"]').length,
    incorporati: f.querySelectorAll('img, iframe, embed, object, video, audio').length,
    vuote: [...f.querySelectorAll('.dato')].filter(d => !d.textContent.trim()).length,
    testo: f.textContent.replace(/\s+/g, ' '),
  };
});

async function prova() {
  const e = esito('Scheda dell\'evento (browser)');
  /* le traduzioni: i testi della scheda ci sono in tutte le lingue, quelli tolti non ci sono più */
  const sorg = fs.readFileSync(path.join(RADICE, 'sorgenti', 'parti', 'traduzioni.js'), 'utf8');
  const TR = JSON.parse(sorg.slice(sorg.indexOf('{'), sorg.lastIndexOf('}') + 1));
  for (const l of Object.keys(TR)) {
    for (const k of TESTI_NUOVI) if (!TR[l][k] || TR[l][k] === k) e.errori.push(`traduzioni, ${l}: manca «${k}»`);
    for (const k of TESTI_TOLTI) if (k in TR[l]) e.errori.push(`traduzioni, ${l}: c'è ancora «${k}», tolto dalla scheda`);
  }
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const s = await server('pubblica');
  const { browser, ctx } = await apri(pw, { dl_guida: '1', dl_strati: STRATI });
  await archivio(ctx, EVENTI());
  try {
    const p = await ctx.newPage();
    p.on('pageerror', err => e.errori.push('errore nella pagina: ' + err.message));
    const scheda = async chiave => {
      await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]');
      if (!(await eventiCaricati(p, 4))) { e.errori.push('gli eventi dell\'archivio non arrivano'); return null; }
      await p.locator('[data-az="elenco"]').first().click(); await pausa(300);
      const r = p.locator('#foglio-slot [data-ev="' + idProva(chiave) + '"]').first();
      if (!(await r.count())) { e.errori.push(chiave + ': l\'evento non è nell\'elenco'); return null; }
      await r.click(); await pausa(400);
      return leggi(p);
    };
    const uguale = (dove, che, ho, atteso) => { if (ho !== atteso) e.errori.push(`${dove}: ${che} «${ho}», atteso «${atteso}»`); };
    const comune = (dove, x) => {
      if (!x) return;
      for (const k of TESTI_TOLTI) if (x.testo.includes(k)) e.errori.push(`${dove}: la scheda mostra ancora «${k}»`);
      if (x.posta) e.errori.push(`${dove}: la scheda ha un collegamento di posta (la segnalazione arriva con T-050)`);
      if (x.incorporati) e.errori.push(`${dove}: la scheda ha immagini o contenuti incorporati`);
      if (x.vuote) e.errori.push(`${dove}: la scheda ha ${x.vuote} righe vuote`);
      if (!x.fonte || !/^Fonte: \S/.test(x.fonte)) e.errori.push(`${dove}: manca «Fonte:» con il nome della fonte (${x.fonte})`);
      if (!x.avvisoDopoFonte) e.errori.push(`${dove}: l'avviso non sta accanto a «Fonte:»`);
      if (!x.nome || !x.indirizzo || !x.righeDiverse) e.errori.push(`${dove}: nome del luogo e indirizzo non stanno su righe proprie (${x.nome} / ${x.indirizzo})`);
    };

    let x = await scheda('schedacompleto'); comune('evento completo', x);
    if (x) {
      uguale('evento completo', 'nome del luogo', x.nome, 'Sala Inventata'); uguale('evento completo', 'indirizzo', x.indirizzo, 'Via Inventata 1, Torino');
      uguale('evento completo', 'organizzatore', x.organizzatore, 'Circolo Inventato'); uguale('evento completo', 'etichetta dell\'organizzatore', x.organizzatoreEtichetta, 'Organizza');
      uguale('evento completo', 'prezzo', x.prezzo, '10'); uguale('evento completo', 'etichetta del prezzo', x.prezzoEtichetta, 'Prezzo indicato dalla fonte');
      uguale('evento completo', 'fonte', x.fonte, 'Fonte: Circolo Inventato, sito'); uguale('evento completo', 'avviso', x.avviso, AVVISO);
      if (x.attenzione) e.errori.push('evento completo: il riquadro della fonte ha il colore dell\'avviso per cortei e presidi');
      const c = x.collegamento;
      if (!c) e.errori.push('evento completo: «Fonte:» non ha il collegamento');
      else {
        uguale('evento completo', 'collegamento della fonte', c.href, 'https://circolo.esempio.invalid/concerto'); uguale('evento completo', 'testo del collegamento', c.testo, 'Circolo Inventato, sito');
        if (c.target !== '_blank' || !/\bnoopener\b/.test(c.rel || '') || !/\bnoreferrer\b/.test(c.rel || '') || c.referrer !== 'no-referrer') e.errori.push('evento completo: il collegamento della fonte non si apre a parte e senza referrer');
      }
      if (x.esterni.length !== 1) e.errori.push('evento completo: la scheda ha altri collegamenti oltre a quello della fonte: ' + x.esterni.join(', '));
      if (x.comeArrivare) e.errori.push('evento completo: compare la descrizione del luogo, che l\'evento non ha');
    }
    x = await scheda('schedaamano'); comune('evento collocato a mano', x);
    if (x) {
      uguale('evento collocato a mano', 'descrizione del luogo', x.comeArrivare, 'Come arrivare: Ritrovo alla fontana, entrando dal cancello verde.');
      uguale('evento collocato a mano', 'avviso', x.avviso, AVVISO);
    }
    x = await scheda('schedacorteo'); comune('corteo', x);
    if (x) {
      uguale('corteo', 'avviso', x.avviso, AVVISO_CORTEI);
      if (!x.attenzione) e.errori.push('corteo: il riquadro della fonte non è in evidenza');
      uguale('corteo', 'organizzatore', x.organizzatore, 'Comitato Inventato');
    }
    x = await scheda('schedaminimo'); comune('evento minimo', x);
    if (x) {
      if (x.organizzatore !== null || x.prezzo !== null) e.errori.push('evento minimo: compaiono organizzatore o prezzo, che l\'evento non ha');
      if (x.collegamento || x.esterni.length) e.errori.push('evento minimo: la scheda ha un collegamento, ma la fonte non ne ha');
      uguale('evento minimo', 'fonte', x.fonte, 'Fonte: Fonte inventata');
    }
    /* in un'altra lingua l'avviso non resta in italiano */
    await p.evaluate(() => localStorage.setItem('dl_lingua', 'en'));
    x = await scheda('schedacompleto');
    if (x) { uguale('inglese', 'avviso', x.avviso, TR.en[AVVISO]); uguale('inglese', 'etichetta dell\'organizzatore', x.organizzatoreEtichetta, TR.en.Organizza); uguale('inglese', 'etichetta del prezzo', x.prezzoEtichetta, TR.en['Prezzo indicato dalla fonte']); }
  } finally {
    await browser.close(); await s.chiudi();
  }
  e.note.push('schede aperte: evento completo, collocato a mano, corteo, minimo, e l\'evento completo in inglese');
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
