/* Prova nel browser: le funzioni tolte nel blocco 2 del piano di adeguamento non lasciano tracce
   (criterio d'ordine 6: pulizia completa e subito; libro mastro, § 1.3, regola 2, e § 3.7).
   - T-010: niente pulsanti volontari in Città, Agorà e Progetti; nessuna richiesta a /api/; la chiave
     agorapp_interesse, se il telefono l'aveva, sparisce all'avvio.
   - T-011: un evento con un'immagine nei dati la perde all'avvio; la scheda non mostra immagini e il telefono
     non chiede nulla al sito dell'immagine (§ 6.2; § 2.5, principio 1).
   - T-014: le quattro chiavi dell'Ordine delle Fate e gli eventi ricevuti con i pacchetti spariscono all'avvio, anche
     dal calendario; la vecchia formula nella barra dei nascosti è una password come le altre; niente strato delle
     Fate, niente tasto dorato nel Calendario (§ 1.3; § 2.4; § 3.7).
   Dati inventati; ogni richiesta verso l'esterno è bloccata. */
'use strict';
const { esito, eseguiDaSola } = require('../comune.js');
const { playwright, server, apri, giorno, pausa } = require('./comune.js');

/* Chiavi delle funzioni tolte, con un valore inventato: all'avvio l'app le deve cancellare senza leggerle. */
const CHIAVI_TOLTE = { agorapp_interesse: { agora: '2026-10-10', citta: 'Comune inventato (XX)' },
  agorapp_fate: '1', agorapp_fate_io: { id: 'abc123', nome: 'Nome Inventato', dal: '2026-10-10T10:00:00Z' },
  agorapp_fate_strato: { nato: true, on: true, off: [] }, agorapp_fate_chi: { def456: 'Persona Inventata' } };
const VECCHIA_FORMULA = 'giuro solennemente di avere buone intenzioni';   // formula delle Fate, tolte con T-014

async function prova() {
  const e = esito('Funzioni tolte senza tracce (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const s = await server('pubblica');
  const g = giorno(1), IMG = 'https://immagini.esempio.invalid/locandina.png';
  const ev = { id: 'prova-immagine', title: 'Concerto inventato', category: 'musica', sublayer: '', description: 'Evento inventato per la prova.',
    datetime: g + 'T18:00', end: g + 'T20:00', price: '', lat: 45.0703, lng: 7.6869, address: 'Via Inventata 1', hidden: false, offgrid: false, link: '', image: IMG };
  const fata = { id: 'prova-fata', fata: true, fataDa: 'def456', personal: true, offgrid: true, title: 'Cena inventata', category: 'fate', sublayer: 'Persona Inventata',
    datetime: g + 'T20:00', end: g + 'T22:00', lat: 45.072, lng: 7.69, address: 'Via Finta 2', hidden: false, price: '' };
  const { browser, ctx } = await apri(pw, Object.assign({ agorapp_guida: '1', agorapp_layers: { musica: { on: true } }, agorapp_events: [ev, fata],
    agorapp_cal: { 'prova-fata': true } }, CHIAVI_TOLTE));
  const api = [], immagini = [];
  ctx.on('request', r => { const u = new URL(r.url()); if (u.pathname.startsWith('/api/')) api.push(u.pathname); if (r.url() === IMG) immagini.push(r.url()); });
  try {
    const p = await ctx.newPage();
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="citta"]'); await pausa(500);
    const rimaste = await p.evaluate(k => k.filter(x => localStorage.getItem(x) != null), Object.keys(CHIAVI_TOLTE));
    if (rimaste.length) e.errori.push('chiavi di funzioni tolte ancora nella memoria del telefono dopo l\'avvio: ' + rimaste.join(', '));
    const dati = await p.evaluate(() => ({ ev: JSON.parse(localStorage.getItem('agorapp_events') || '[]'), cal: JSON.parse(localStorage.getItem('agorapp_cal') || '{}') }));
    const conImmagine = dati.ev.filter(x => 'image' in x).length;
    if (conImmagine) e.errori.push(conImmagine + ' eventi conservano il campo dell\'immagine dopo l\'avvio');
    if (dati.ev.some(x => x.fata)) e.errori.push('gli eventi ricevuti con i pacchetti delle Fate restano nella memoria del telefono');
    if ('prova-fata' in dati.cal) e.errori.push('un evento delle Fate resta nel calendario');
    if (!dati.ev.some(x => x.id === 'prova-immagine')) e.errori.push('la pulizia ha tolto anche un evento che doveva restare');
    await p.click('[data-az="elenco"]'); await pausa(400);
    const riga = p.locator('[data-ev="prova-immagine"]').first();
    if (!(await riga.count())) e.errori.push('elenco: non trovo l\'evento di prova');
    else {
      await riga.click(); await pausa(600);
      const img = await p.locator('#foglio-slot img').count();
      if (img) e.errori.push('scheda dell\'evento: ' + img + ' immagini');
    }
    // La vecchia formula delle Fate è una password come le altre.
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="cerca"]'); await pausa(300);
    await p.click('[data-az="cerca"]'); await pausa(300); await p.fill('#pw', VECCHIA_FORMULA); await p.click('[data-az="sblocca"]'); await pausa(300);
    const errPw = await p.locator('#pw-err').isVisible().catch(() => false);
    if (!errPw) e.errori.push('Cerca: la vecchia formula delle Fate non risponde «Nessun evento nascosto con questa password»');
    if (await p.locator('.fate-msg').count()) e.errori.push('Cerca: compare ancora un messaggio delle Fate');
    // Calendario e Strati: niente tasto dorato, niente strato delle Fate.
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="calendario"]'); await pausa(300);
    await p.click('[data-az="calendario"]'); await pausa(400);
    if (!(await p.locator('#foglio-slot [data-az="pdf"]').count())) e.errori.push('Calendario: manca il tasto PDF');
    if (await p.locator('.tasto-oro, [data-az="condividi-scegli"]').count()) e.errori.push('Calendario: c\'è ancora il tasto dorato');
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="strati"]'); await pausa(300);
    await p.click('[data-az="strati"]'); await pausa(400);
    if ((await p.evaluate(() => document.body.innerText)).includes('Ordine delle Fate')) e.errori.push('Strati: c\'è ancora l\'Ordine delle Fate');
    const viste = [['Città', async () => { await p.click('[data-az="citta"]'); }],
      ['Agorà', async () => { await p.click('button[data-sez="agora"]'); }],
      ['Progetti', async () => { await p.click('button[data-sez="progetti"]'); }]];
    for (const [nome, vai] of viste) {
      await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="citta"]'); await pausa(300);
      await vai(); await pausa(500);
      const n = await p.locator('[data-interesse], [data-int-box], #int-citta-q').count();
      if (n) e.errori.push(nome + ': ' + n + ' elementi dei pulsanti volontari');
      const testo = await p.evaluate(() => document.body.innerText);
      for (const t of ['Mi interessa', 'Ti interessa?', 'La tua città non c’è?']) if (testo.includes(t)) e.errori.push(nome + ': compare ancora «' + t + '»');
    }
  } finally {
    await browser.close(); await s.chiudi();
  }
  if (api.length) e.errori.push('richieste a ' + [...new Set(api)].join(', '));
  if (immagini.length) e.errori.push('il telefono ha chiesto l\'immagine dell\'evento al suo sito');
  e.note.push('viste: scheda evento, Cerca, Calendario, Strati, Città, Agorà, Progetti; chiavi tolte controllate: ' + Object.keys(CHIAVI_TOLTE).join(', '));
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
