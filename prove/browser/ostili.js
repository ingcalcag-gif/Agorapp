/* Prova nel browser: i testi degli eventi si mostrano sempre come testo, mai come codice (voce T-005;
   la completa T-024 con tutte le viste e il PDF). Libro mastro, § 3.11.

   Dal blocco 4 (T-022) gli eventi pubblici arrivano dall'archivio: la prova ne serve uno inventato con testi ostili in
   ogni campo, nel formato pubblico (docs/formato-eventi.md), e mette nella memoria del telefono un Off-Grid inventato con
   testi ostili. I testi sono pezzi di HTML che, se la pagina li scrivesse come codice, creerebbero elementi con
   l'attributo data-ostile o eseguirebbero window.__ostile. Apre le viste principali e controlla che non sia successo
   nulla, e che nessun collegamento javascript: arrivi nella pagina; un evento dell'archivio con un collegamento
   javascript: non deve comparire affatto (il formato accetta solo https). */
'use strict';
const { esito, eseguiDaSola, confronta } = require('../comune.js');
const { playwright, server, apri, giorno, pausa, archivio, eventoProva, eventiCaricati } = require('./comune.js');

const O_ = n => `<img src=x data-ostile="${n}" onerror="window.__ostile='${n}'"><b data-ostile="${n}">prova</b>`;
const ATTR_ = n => `" data-ostile="${n}-a" x="' data-ostile='${n}-b' y='`;
const B_ = n => `<b data-ostile="${n}">x</b>`;   // breve, per i campi corti

const ID_EV = 'provaostileevent-provaaaa', ID_TITOLO = 'provaostiletitol-provaaaa', ID_JS = 'provaostilelinkj-provaaaa', ID_OG = 'prova-ostile-og';

/* Gli eventi pubblici inventati della prova, nel formato dell'archivio; con ostili = false gli stessi senza testi ostili. */
function pubblici(ostili = true, g = giorno(1), ore = ['18:00', '20:00']) {
  const O = ostili ? O_ : () => '', ATTR = ostili ? ATTR_ : () => '', B = ostili ? B_ : () => '';
  const ev = eventoProva(ID_EV, { titolo: 'Concerto ' + ATTR('titolo'), inizio: g + 'T' + ore[0], fine: g + 'T' + ore[1],
    luogo: 'Sala ' + O('luogo'), indirizzo: 'Via Inventata 1 ' + ATTR('indirizzo') + O('indirizzo'), organizzatore: 'Gruppo ' + O('org'),
    descrizione: 'Descrizione ' + O('descrizione'), prezzo: '5 ' + B('prezzo'), fonte: { testo: 'Fonte inventata ' + O('fonte'), collegamento: 'https://organizzatore.esempio.invalid/evento' } });
  const titolo = eventoProva(ID_TITOLO, { titolo: O_('titolo'), inizio: g + 'T' + ore[0], fine: g + 'T' + ore[1], lat: 45.0712, lng: 7.6845 });
  return ostili ? [ev, titolo] : [ev];
}
/* Un evento con un collegamento javascript: e una password: il formato lo rifiuta, l'app non lo mostra. */
const RIFIUTATO = () => eventoProva(ID_JS, { titolo: 'Evento con collegamento javascript', fonte: { testo: 'Fonte', collegamento: "javascript:window.__ostile='link'" }, password: 'x' });

/* L'Off-Grid inventato della prova, nella memoria del telefono. */
function offgrid(ostili = true, g = giorno(1)) {
  const O = ostili ? O_ : () => '', ATTR = ostili ? ATTR_ : () => '';
  return [{ id: ID_OG, personal: true, offgrid: true, title: 'Cena ' + ATTR('og-titolo') + O('og-titolo'),
    address: 'Via Finta 2 ' + O('og-indirizzo'), addressFull: 'Via Finta 2, Torino ' + O('og-indfull'), addrPrecision: 'exact', addrNum: '2',
    notes: 'Note ' + O('og-note'), description: 'Descr ' + O('og-descr'),
    links: ostili ? ["javascript:window.__ostile='og-link'", 'https://esempio.invalid/" data-ostile="og-href'] : [], link: '',
    category: '', sublayer: '', datetime: g + 'T20:00', end: g + 'T22:00', lat: 45.072, lng: 7.69, hidden: false, price: '' }];
}

async function prova() {
  const e = esito('Testi ostili mostrati come testo (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const s = await server('pubblica');
  const { browser, ctx } = await apri(pw, { agorapp_guida: '1', agorapp_layers: { musica: { on: true } }, agorapp_events: offgrid(),
    agorapp_cal: { [ID_EV]: true, [ID_OG]: true } });
  await archivio(ctx, pubblici(), [RIFIUTATO()]);
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
    const avvia = async () => { await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]');
      if (!(await eventiCaricati(p, 2))) e.errori.push('gli eventi dell\'archivio non arrivano'); await pausa(400); };
    const tocca = async (sel, vista) => {
      const l = p.locator(sel).first();
      if (!(await l.count())) { e.errori.push(`${vista}: non trovo ${sel}`); return false; }
      await l.click(); await pausa(400); return true;
    };

    await avvia(); await controlla('avvio');
    if (await tocca('[data-az="elenco"]', 'elenco')) {
      await controlla('elenco');
      // dall'elenco: dal blocco 3 la mappa si carica e lo stesso evento ha anche il segnaposto, coperto dal foglio
      if (await p.locator('#foglio-slot [data-ev="' + ID_JS + '"]').count()) e.errori.push('elenco: compare l\'evento con il collegamento javascript:, che il formato rifiuta');
      if (!(await p.locator('#foglio-slot [data-ev="' + ID_TITOLO + '"]').count())) e.errori.push('elenco: non trovo l\'evento con il titolo ostile');
      if (await tocca('#foglio-slot [data-ev="' + ID_EV + '"]', 'scheda evento')) await controlla('scheda evento');
    }
    await avvia();
    if (await tocca('[data-az="elenco"]', 'elenco') && await tocca('#foglio-slot [data-ev="' + ID_TITOLO + '"]', 'scheda evento, titolo')) await controlla('scheda evento, titolo');
    await avvia();
    if (await tocca('[data-az="elenco"]', 'elenco') && await tocca('#foglio-slot [data-ev="' + ID_OG + '"]', 'scheda Off-Grid')) await controlla('scheda Off-Grid');
    await avvia();
    if (await tocca('[data-az="calendario"]', 'calendario') && await tocca('[data-vista="agenda"]', 'calendario, agenda')) await controlla('calendario, agenda');
    await avvia();
    if (await tocca('[data-az="cerca"]', 'cerca')) { await p.keyboard.type('Concerto'); await pausa(600); await controlla('cerca'); }
  } finally {
    await browser.close(); await s.chiudi();
  }
  confronta(e, 'ostili', trovati);
  e.note.push('viste: elenco, scheda evento (due eventi dell\'archivio), scheda Off-Grid, calendario, cerca; il PDF lo aggiunge T-024');
  return e;
}

module.exports = { prova, pubblici, offgrid, ID_EV, ID_OG };
eseguiDaSola(module, prova);
