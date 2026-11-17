/* Prova nel browser: le richieste che il telefono fa davvero (voce T-007; libro mastro § 2.4 e § 2.5,
   principio 1). Apre l'app e le sue viste principali, stampa il PDF del calendario e cerca un indirizzo,
   annotando ogni richiesta verso un indirizzo diverso da quello dell'app (le richieste sono bloccate, quindi
   nessun servizio esterno riceve nulla). Sono ammessi solo gli indirizzi di sorgenti/config.js; ogni altro è uno
   scarto noto con la voce che lo toglie. Controlla anche che i caratteri e le librerie arrivino dall'app e che la
   ricerca degli indirizzi (T-008; § 3.8) parta solo mentre la persona scrive, senza referrer e con il solo testo
   scritto e parametri fissi: niente posizione, centro o zoom della mappa; e che la pressione prolungata (T-009) mostri
   soltanto le coordinate con «Copia», senza richieste e senza salvare nulla. */
'use strict';
const { esito, eseguiDaSola, confronta, config } = require('../comune.js');
const { playwright, server, apri, giorno, pausa } = require('./comune.js');
const { eventi } = require('./ostili.js');

async function prova() {
  const e = esito('Richieste del telefono (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const c = config();
  const ammessi = Object.values(c.indirizzi || {}).filter(Boolean).map(u => new URL(u).host);
  const ricerca = c.indirizzi && c.indirizzi.ricerca_indirizzi ? new URL(c.indirizzi.ricerca_indirizzi).host : '';
  const PARAMETRI_RICERCA = ['q', 'limit', 'bbox'];
  const cerche = [];
  const ev = eventi(false).map(x => ({ ...x, datetime: giorno(0) + 'T22:00', end: giorno(0) + 'T23:30' }));
  const s = await server('pubblica');
  const { browser, ctx } = await apri(pw, { agorapp_guida: '1', agorapp_layers: { musica: { on: true } }, agorapp_events: ev,
    agorapp_cal: { 'prova-ostile-1': true, 'prova-ostile-og': true } });
  const esterne = [], locali = new Set();
  ctx.on('request', r => {
    const u = new URL(r.url());
    if (u.protocol === 'data:' || u.protocol === 'blob:') return;
    if (/^127\.0\.0\.1(:\d+)?$/.test(u.host)) { locali.add(u.pathname); return; }
    esterne.push({ host: u.host, primo: u.pathname.split('/').filter(Boolean)[0] || '', momento: vista });
    if (u.host === ricerca) cerche.push({ momento: vista, parametri: [...u.searchParams.keys()], q: u.searchParams.get('q'), referer: r.headers().referer || '' });
  });
  let vista = 'apertura';
  try {
    const p = await ctx.newPage();
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(1500);
    const car = await p.evaluate(async () => { await document.fonts.ready; return { sans: document.fonts.check('16px "DM Sans"'), serif: document.fonts.check('16px "DM Serif Display"'), mappa: !!window.maplibregl }; });
    if (!car.sans || !car.serif) e.errori.push('caratteri non caricati dall\'app: DM Sans ' + car.sans + ', DM Serif Display ' + car.serif);
    if (!car.mappa) e.errori.push('MapLibre non caricato dall\'app');
    vista = 'elenco e scheda'; await p.click('[data-az="elenco"]'); await pausa(400);
    await p.locator('[data-ev="prova-ostile-1"]').first().click(); await pausa(500);
    vista = 'calendario e PDF'; await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="calendario"]'); await pausa(400);
    await p.click('[data-az="calendario"]'); await pausa(400); await p.click('[data-az="pdf"]'); await pausa(800);
    const [d] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('[data-az="scarica-pdf"]')]);
    if (!/\.pdf$/.test(d.suggestedFilename())) e.errori.push('PDF del calendario non creato: ' + d.suggestedFilename());
    vista = 'impostazioni'; await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="impostazioni"]'); await p.click('[data-az="impostazioni"]'); await pausa(400);
    // Pressione prolungata (T-009; § 2.2): coordinate calcolate sul telefono, il solo tasto «Copia», nulla salvato.
    vista = 'pressione prolungata'; await p.goto(s.url + 'index.html'); await p.waitForSelector('#map canvas', { state: 'attached' }); await pausa(300);
    const memoria = () => p.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
    const prima = await memoria();
    await p.click('#map canvas', { button: 'right', position: { x: 196, y: 420 } }); await pausa(500);
    const coord = ((await p.locator('#punto-testo').textContent().catch(() => '')) || '').trim();
    if (!/^-?\d{1,2}\.\d{4}, -?\d{1,3}\.\d{4}$/.test(coord)) e.errori.push('pressione prolungata: coordinate non mostrate nel formato «45.0703, 7.6869» (' + (coord || 'nessun foglio') + ')');
    const tasti = await p.locator('#foglio-slot .corpo button').evaluateAll(b => b.map(x => x.dataset.az));
    if (tasti.join() !== 'copia-punto') e.errori.push('pressione prolungata: nel foglio ci devono essere solo «Copia», trovati: ' + (tasti.join(', ') || 'nessuno'));
    if (coord) { await p.click('[data-az="copia-punto"]'); await pausa(400); }
    if (await memoria() !== prima) e.errori.push('la pressione prolungata ha salvato qualcosa nella memoria del telefono');
    vista = 'cerca'; await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="cerca"]'); await p.click('[data-az="cerca"]'); await pausa(300);
    await p.keyboard.type('via Po 1'); await pausa(1500);
  } finally {
    await browser.close(); await s.chiudi();
  }
  if (![...locali].some(x => x.includes('/lib/jspdf-'))) e.errori.push('jsPDF non è stato caricato dall\'app');
  // Ricerca degli indirizzi: solo in Cerca, solo il testo scritto e parametri fissi, senza referrer.
  if (ricerca) {
    if (!cerche.some(x => x.momento === 'cerca' && x.q === 'via Po 1')) e.errori.push('nessuna richiesta di ricerca per «via Po 1» scritto in Cerca');
    for (const x of cerche) {
      if (x.momento !== 'cerca') e.errori.push('ricerca degli indirizzi partita senza che la persona scrivesse (' + x.momento + ')');
      const altri = x.parametri.filter(k => !PARAMETRI_RICERCA.includes(k));
      if (altri.length) e.errori.push('la ricerca manda parametri in più: ' + altri.join(', '));
      if (x.referer) e.errori.push('la ricerca manda il referrer: ' + x.referer);
    }
    e.note.push('richieste di ricerca: ' + cerche.length + ', parametri ' + [...new Set(cerche.flatMap(x => x.parametri))].join(', '));
  }
  // Un caso per indirizzo, con i momenti in cui il telefono l'ha chiesto.
  const per = new Map();
  for (const x of esterne.filter(x => !ammessi.includes(x.host))) {
    const k = x.host + (x.primo ? '/' + x.primo : '');
    per.set(k, [...new Set((per.get(k) || []).concat(x.momento))]);
  }
  const trovati = [...per].map(([k, m]) => ({ chiave: k, dove: 'app', dettaglio: m.join(', ') }));
  confronta(e, 'richieste', trovati);
  const ok = esterne.filter(x => ammessi.includes(x.host)).map(x => x.host + ' (' + x.momento + ')');
  e.note.push('richieste ammesse dalla configurazione: ' + ([...new Set(ok)].join(', ') || 'nessuna'));
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
