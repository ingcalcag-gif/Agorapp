/* Prova nel browser: i testi degli eventi si mostrano sempre come testo, mai come codice (voce T-005;
   la completa T-024 con tutte le viste e il PDF). Libro mastro, § 3.11.

   Mette nella memoria del telefono un evento pubblico e un Off-Grid inventati, con testi ostili in ogni campo:
   pezzi di HTML che, se la pagina li scrivesse come codice, creerebbero elementi con l'attributo data-ostile o
   eseguirebbero window.__ostile. Apre le viste principali e controlla che non sia successo nulla, e che nessun
   collegamento javascript: arrivi nella pagina. */
'use strict';
const { esito, eseguiDaSola, confronta } = require('../comune.js');
const { playwright, server, apri, giorno, pausa } = require('./comune.js');

const O_ = n => `<img src=x data-ostile="${n}" onerror="window.__ostile='${n}'"><b data-ostile="${n}">prova</b>`;
const ATTR_ = n => `" data-ostile="${n}-a" x="' data-ostile='${n}-b' y='`;

/* Gli eventi inventati della prova; con ostili = false gli stessi eventi senza testi ostili. */
function eventi(ostili = true) {
  const g = giorno(1);
  const O = ostili ? O_ : () => '', ATTR = ostili ? ATTR_ : () => '', JS = t => ostili ? t : '';
  const ev = { id: 'prova-ostile-1', title: 'Concerto ' + ATTR('titolo') + O('titolo'), category: 'musica', sublayer: '',
    description: 'Descrizione ' + O('descrizione'), datetime: g + 'T18:00', end: g + 'T20:00', price: '5 ' + O('prezzo'),
    lat: 45.0703, lng: 7.6869, address: 'Via Inventata 1 ' + ATTR('indirizzo') + O('indirizzo'), source: 'Fonte inventata ' + O('fonte'),
    tema: '', hidden: false, offgrid: false, link: JS("javascript:window.__ostile='link'") };
  const og = { id: 'prova-ostile-og', personal: true, offgrid: true, title: 'Cena ' + ATTR('og-titolo') + O('og-titolo'),
    address: 'Via Finta 2 ' + O('og-indirizzo'), addressFull: 'Via Finta 2, Torino ' + O('og-indfull'), addrPrecision: 'exact', addrNum: '2',
    notes: 'Note ' + O('og-note'), description: 'Descr ' + O('og-descr'),
    links: ostili ? ["javascript:window.__ostile='og-link'", 'https://esempio.invalid/" data-ostile="og-href'] : [], link: '',
    category: '', sublayer: '', datetime: g + 'T20:00', end: g + 'T22:00', lat: 45.072, lng: 7.69, hidden: false, price: '' };
  return [ev, og];
}

async function prova() {
  const e = esito('Testi ostili mostrati come testo (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const s = await server('pubblica');
  const { browser, ctx } = await apri(pw, { agorapp_guida: '1', agorapp_layers: { musica: { on: true } }, agorapp_events: eventi(),
    agorapp_cal: { 'prova-ostile-1': true, 'prova-ostile-og': true } });
  const trovati = [];
  try {
    const p = await ctx.newPage();
    p.on('pageerror', err => e.note.push('errore nella pagina: ' + err.message));
    const controlla = async vista => {
      const r = await p.evaluate(() => ({ eseguito: window.__ostile || null,
        elementi: [...document.querySelectorAll('[data-ostile]')].map(x => x.getAttribute('data-ostile')),
        js: [...document.querySelectorAll('a[href]')].filter(a => /^\s*javascript:/i.test(a.getAttribute('href'))).length }));
      if (r.eseguito) trovati.push({ chiave: 'testo eseguito come codice', dove: vista, dettaglio: r.eseguito });
      for (const x of r.elementi) trovati.push({ chiave: 'testo diventato elemento', dove: vista, dettaglio: x });
      if (r.js) trovati.push({ chiave: 'collegamento javascript:', dove: vista, dettaglio: r.js + ' collegamenti' });
    };
    const avvia = async () => { await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(400); };
    const tocca = async (sel, vista) => {
      const l = p.locator(sel).first();
      if (!(await l.count())) { e.errori.push(`${vista}: non trovo ${sel}`); return false; }
      await l.click(); await pausa(400); return true;
    };

    await avvia(); await controlla('avvio');
    if (await tocca('[data-az="elenco"]', 'elenco')) {
      await controlla('elenco');
      if (await tocca('[data-ev="prova-ostile-1"]', 'scheda evento')) await controlla('scheda evento');
    }
    await avvia();
    if (await tocca('[data-az="elenco"]', 'elenco') && await tocca('[data-ev="prova-ostile-og"]', 'scheda Off-Grid')) await controlla('scheda Off-Grid');
    await avvia();
    if (await tocca('[data-az="calendario"]', 'calendario') && await tocca('[data-vista="agenda"]', 'calendario, agenda')) await controlla('calendario, agenda');
    await avvia();
    if (await tocca('[data-az="cerca"]', 'cerca')) { await p.keyboard.type('Concerto'); await pausa(600); await controlla('cerca'); }
  } finally {
    await browser.close(); await s.chiudi();
  }
  confronta(e, 'ostili', trovati);
  e.note.push('viste: elenco, scheda evento, scheda Off-Grid, calendario, cerca; il PDF lo aggiunge T-024');
  return e;
}

module.exports = { prova, eventi };
eseguiDaSola(module, prova);
