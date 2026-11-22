/* Prova nel browser: la lettura degli eventi a quadranti nell'app pubblica (voce T-022; libro mastro § 2.4, «La lettura
   degli eventi»; § 2.2; § 3.7; § 11.3, regola 3).

   Con l'archivio di prova del repository (prova/archivio/, eventi inventati):
   - a Torino compaiono gli eventi di Torino, e il telefono chiede soltanto l'indice e i quadranti di Torino che hanno
     eventi; nessuna richiesta all'archivio porta cookie o parametri;
   - da lontano non ci sono segnaposto di eventi pubblici ma i numeri per regione, con l'invito ad avvicinarsi nella barra
     in basso e nell'elenco vuoto; toccando il numero della Lombardia si arriva a Milano e compaiono i suoi eventi;
   - un evento salvato nel calendario resta nel calendario dopo aver riaperto l'app, anche con la mappa su un'altra città
     (gli eventi delle zone consultate restano sul telefono, § 3.7).
   Con un archivio inventato dalla prova:
   - i quadranti si scaricano solo quando la mappa resta ferma: passando da Roma senza fermarsi, Roma non si scarica;
   - un evento finito da più di tre ore non compare, uno finito da meno sì (tra gli «appena finiti»);
   - gli Off-Grid restano quelli del telefono e un evento pubblico rimasto nella memoria del telefono non va sulla mappa;
   - al ritorno nell'app l'indice si ricontrolla solo dopo più di trenta minuti, e allora arriva l'evento nuovo;
   - senza mappa (il telefono non riesce a disegnarla) l'elenco mostra comunque gli eventi della città scelta. */
'use strict';
const { esito, eseguiDaSola } = require('../comune.js');
const { playwright, server, apri, giorno, pausa, archivio, eventoProva, eventiCaricati, ZONA_ARCHIVIO, EVF } = require('./comune.js');

const TUTTI = Object.fromEntries(['musica', 'arte', 'sport', 'sociale', 'cibo', 'teatro', 'cinema', 'conferenze', 'laboratori', 'manifestazioni', 'mercati', 'benessere', 'volontariato'].map(k => [k, { on: true }]));
const spia = () => {   // tiene da parte la mappa che l'app crea, per guardarla dall'esterno
  let ml; Object.defineProperty(window, 'maplibregl', { configurable: true, get() { return ml; },
    set(v) { const M = v.Map; v.Map = function (...a) { const m = new M(...a); window.__mappaProva = m; return m; }; v.Map.prototype = M.prototype; ml = v; } });
};
const stato = p => p.evaluate(() => window.AGR.archivio());
const vai = (p, lng, lat, zoom) => p.evaluate(([lng, lat, zoom]) => window.__mappaProva.jumpTo({ center: [lng, lat], zoom }), [lng, lat, zoom]);
const oraRoma = ms => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(ms)).replace(' ', 'T');

async function prova() {
  const e = esito('Eventi a quadranti nell\'app (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const s = await server('pubblica');
  const indice = require('../../prova/archivio/indice.json');
  /* Gli eventi dell'archivio di prova che l'app deve mostrare oggi: quelli dei quadranti non ancora finiti (l'archivio di
     prova conta i giorni dalla data in cui è stato scritto, quindi i primi eventi escono man mano). Un evento finito da
     meno di tre ore non è nell'elenco finché non si accende «Appena finiti»: contarlo faceva fallire la prova nelle tre
     ore dopo la fine di un evento (GitHub Actions, 22/11/2026). */
  const visibili = q => { const f = (indice.quadranti[q] || {}).file; if (!f) return 0;
    return require('../../prova/archivio/' + f).eventi.filter(ev => { const fm = EVF.fineMs(ev); return fm != null && Date.now() < fm; }).length; };
  const nTorino = visibili('q21-01') + visibili('q21-02'), nMilano = visibili('q22-04');

  // ---------------- Archivio di prova del repository ----------------
  const { browser, ctx } = await apri(pw, { dl_guida: '1', dl_strati: TUTTI });
  await ctx.addInitScript(spia);
  await ctx.addCookies([{ name: 'prova', value: 'biscotto', domain: '127.0.0.1', path: '/' }]);
  const richieste = [];
  ctx.on('request', async r => { if (r.url().includes(ZONA_ARCHIVIO)) richieste.push({ u: r.url().split(ZONA_ARCHIVIO)[1], h: await r.allHeaders() }); });
  try {
    const p = await ctx.newPage();
    await p.goto(s.url + 'index.html');
    if (!(await eventiCaricati(p, nTorino))) e.errori.push(`a Torino non arrivano i ${nTorino} eventi dell'archivio di prova (${JSON.stringify(await stato(p))})`);
    await pausa(800);
    const pin = await p.locator('.pin.ev, .pin.gruppo').count();
    if (!pin) e.errori.push('a Torino nessun segnaposto di eventi');
    const elenco = ((await p.locator('#btnElenco .conta').textContent()) || '').trim();
    if (+elenco !== nTorino) e.errori.push(`l'elenco di Torino conta ${elenco} eventi invece di ${nTorino}`);
    const chiesti = richieste.map(x => x.u.replace(/^quadranti\//, '').slice(0, 6)).sort();
    if (chiesti.join() !== 'indice,q21-01,q21-02') e.errori.push('a Torino il telefono ha chiesto: ' + chiesti.join(', '));
    for (const x of richieste) {
      if (x.h.cookie) e.errori.push('richiesta all\'archivio con i cookie: ' + x.u);
      if (/[?#]/.test(x.u)) e.errori.push('richiesta all\'archivio con parametri: ' + x.u);
    }
    e.note.push(`Torino: ${nTorino} eventi, richieste ${chiesti.join(', ')}, senza cookie né parametri`);

    // Salvo un evento di Torino nel calendario (per dopo).
    await p.click('[data-az="elenco"]'); await pausa(400);
    const primo = await p.locator('#foglio-slot .riga-ev').first().getAttribute('data-ev');
    await p.locator('#foglio-slot .riga-ev').first().click(); await pausa(500);
    await p.locator('#foglio-slot [data-salva]').first().click(); await pausa(300);
    await p.click('[data-az="chiudi"]').catch(() => {}); await pausa(300);

    // Da lontano: numeri per regione e invito ad avvicinarsi.
    await vai(p, 8.8, 44.9, 6.3); await pausa(1500);   // il Nord Italia, da lontano
    const lontano = await stato(p);
    if (!lontano.lontano) e.errori.push('visto il Nord Italia, l\'app non si considera lontana');
    if (await p.locator('.pin.ev').count()) e.errori.push('da lontano restano segnaposto di eventi pubblici');
    const bolle = await p.locator('.pin.regione').evaluateAll(b => b.map(x => x.getAttribute('aria-label')));
    for (const r of indice.regioni) if (!bolle.some(t => t.startsWith(r.eventi + ' eventi in ' + r.nome))) e.errori.push(`da lontano manca il numero di ${r.nome} (${bolle.join(' | ')})`);
    const peek = (await p.locator('#peek').textContent()) || '';
    if (!/avvicinati a una città per vedere gli eventi/.test(peek)) e.errori.push('da lontano la barra in basso non invita ad avvicinarsi: ' + peek);
    await p.click('[data-az="elenco"]'); await pausa(400);
    const vuoto = (await p.locator('#foglio-slot').textContent()) || '';
    if (!/Da lontano vedi solo quanti eventi/.test(vuoto)) e.errori.push('da lontano l\'elenco non spiega perché è vuoto');
    await p.click('[data-az="chiudi"]').catch(() => {}); await pausa(300);
    e.note.push('da lontano: ' + bolle.join(' | '));

    // Toccando la Lombardia si arriva a Milano.
    await p.locator('.pin.regione[aria-label*="Lombardia"]').click(); await pausa(3000);
    const milano = await stato(p);
    if (!milano.zona.includes('q22-04')) e.errori.push('dopo il tocco sulla Lombardia la zona non comprende Milano: ' + milano.zona.join(', '));
    const pinMilano = await p.evaluate(() => [...document.querySelectorAll('.pin.ev')].length);
    if (!pinMilano) e.errori.push('a Milano nessun segnaposto');
    const contaMilano = ((await p.locator('#btnElenco .conta').textContent()) || '').trim();
    if (+contaMilano !== nMilano) e.errori.push(`l'elenco di Milano conta ${contaMilano} eventi invece di ${nMilano}`);

    // Riaprendo l'app, l'evento salvato resta nel calendario anche con la mappa a Milano.
    await p.goto(s.url + 'index.html'); await eventiCaricati(p, 1); await pausa(800);
    await vai(p, 9.19, 45.4642, 13); await pausa(1500);
    const conservati = (await stato(p)).conservati;
    if (!conservati.includes('q21-01')) e.errori.push('riaprendo l\'app, il telefono non conserva più i quadranti di Torino: ' + conservati.join(', '));
    await p.click('[data-az="calendario"]'); await pausa(400); await p.click('[data-vista="agenda"]'); await pausa(400);
    if (!(await p.locator(`#foglio-slot [data-ev="${primo}"]`).count())) e.errori.push('riaprendo l\'app con la mappa a Milano, l\'evento di Torino salvato non è più nel calendario');
  } finally { await browser.close(); }

  // ---------------- Archivio inventato dalla prova ----------------
  const ora = Date.now();
  const torino = eventoProva('quadrantitorino', { titolo: 'Evento di Torino' });
  const roma = eventoProva('quadrantiroma', { titolo: 'Evento di Roma', lat: 41.9028, lng: 12.4964, indirizzo: 'Via Inventata 1, Roma' });
  const milano = eventoProva('quadrantimilano', { titolo: 'Evento di Milano', lat: 45.4642, lng: 9.19, indirizzo: 'Via Inventata 1, Milano' });
  const finito2 = eventoProva('finitodaduore', { titolo: 'Finito da due ore', inizio: oraRoma(ora - 4 * 36e5), fine: oraRoma(ora - 2 * 36e5) });
  const finito4 = eventoProva('finitodaquattro', { titolo: 'Finito da quattro ore', inizio: oraRoma(ora - 6 * 36e5), fine: oraRoma(ora - 4 * 36e5) });
  const og = { id: 'prova-og-quadranti', personal: true, offgrid: true, title: 'Off-Grid inventato', datetime: giorno(1) + 'T20:00', end: giorno(1) + 'T21:00', lat: 45.072, lng: 7.69, address: 'Via Finta 2', hidden: false, price: '' };
  const vecchio = { id: 'prova-pubblico-locale', title: 'Pubblico rimasto nel telefono', category: 'musica', datetime: giorno(1) + 'T18:00', end: giorno(1) + 'T20:00', lat: 45.0705, lng: 7.687, address: 'Via Inventata 2', hidden: false, offgrid: false };
  const B = await apri(pw, { dl_guida: '1', dl_strati: TUTTI, dl_eventi: [og, vecchio] });
  await B.ctx.addInitScript(spia);
  await archivio(B.ctx, [torino, roma, milano, finito2], [finito4]);
  const chiesti = [];
  B.ctx.on('request', r => { if (r.url().includes(ZONA_ARCHIVIO)) chiesti.push(r.url().split(ZONA_ARCHIVIO)[1]); });
  try {
    const p = await B.ctx.newPage();
    await p.goto(s.url + 'index.html'); await eventiCaricati(p, 2); await pausa(800);
    // Tre ore dopo la fine.
    await p.click('[data-az="strati"]'); await pausa(300);
    const finiti = p.locator('[data-az="finiti"]'); if (await finiti.count()) { await finiti.first().click(); await pausa(300); }
    await p.click('[data-az="chiudi"]').catch(() => {}); await pausa(200);
    await p.click('[data-az="elenco"]'); await pausa(400);
    const testo = (await p.locator('#foglio-slot').textContent()) || '';
    if (!testo.includes('Finito da due ore')) e.errori.push('un evento finito da due ore non compare tra gli appena finiti');
    if (testo.includes('Finito da quattro ore')) e.errori.push('un evento finito da più di tre ore compare ancora');
    // Off-Grid dal telefono, eventi pubblici solo dall'archivio.
    if (!testo.includes('Off-Grid inventato')) e.errori.push('l\'Off-Grid del telefono non compare');
    if (testo.includes('Pubblico rimasto nel telefono')) e.errori.push('un evento pubblico rimasto nella memoria del telefono va ancora sulla mappa');
    if (!testo.includes('Evento di Torino')) e.errori.push('l\'evento di Torino dell\'archivio non compare');
    await p.click('[data-az="chiudi"]').catch(() => {}); await pausa(300);

    // Mappa che non si ferma: passando da Roma senza fermarsi, Roma non si scarica.
    const n0 = chiesti.length;
    // I due spostamenti partono dentro la pagina, a 150 millisecondi l'uno dall'altro: con il disegno della mappa in
    // software i tempi visti da fuori non sono affidabili, quelli della pagina sì.
    await p.evaluate(() => new Promise(ok => { const m = window.__mappaProva; m.jumpTo({ center: [12.4964, 41.9028], zoom: 12 });
      setTimeout(() => { m.jumpTo({ center: [9.19, 45.4642], zoom: 12 }); ok(); }, 150); }));
    await pausa(2500);
    const dopo = chiesti.slice(n0).map(u => u.slice(10, 16));
    if (dopo.includes('q14-09')) e.errori.push('il telefono ha scaricato Roma senza che la mappa si fermasse lì');
    if (!dopo.includes('q22-04')) e.errori.push('fermandosi a Milano il telefono non ha scaricato Milano: ' + dopo.join(', '));

    // Ritorno nell'app: prima dei trenta minuti nessun controllo, dopo sì, e arriva l'evento nuovo.
    const nuovo = eventoProva('nuovoamilano', { titolo: 'Evento nuovo a Milano', lat: 45.47, lng: 9.2, indirizzo: 'Via Inventata 3, Milano' });
    await B.ctx.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {});
    await B.ctx.route(r => !/^https?:\/\/127\.0\.0\.1(:\d+)?\//.test(r.href), r => r.abort());
    await archivio(B.ctx, [torino, roma, milano, finito2, nuovo]);
    const ritorno = () => p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); });
    const n1 = chiesti.length;
    await ritorno(); await pausa(800);
    if (chiesti.slice(n1).some(u => u === 'indice.json')) e.errori.push('al ritorno dopo pochi secondi l\'indice si ricontrolla');
    await p.evaluate(() => { const vero = Date.now; Date.now = () => vero() + 31 * 6e4; });
    await ritorno(); await pausa(2000);
    if (!chiesti.slice(n1).some(u => u === 'indice.json')) e.errori.push('al ritorno dopo più di trenta minuti l\'indice non si ricontrolla');
    const nomi = await p.evaluate(() => window.AGR.archivio().pubblici);
    if (nomi < 4) e.errori.push('dopo il controllo delle novità l\'evento nuovo di Milano non è arrivato');
  } finally { await B.browser.close(); }

  // ---------------- Senza mappa ----------------
  const C = await apri(pw, { dl_guida: '1', dl_strati: TUTTI });
  await C.ctx.addInitScript(() => { Object.defineProperty(window, 'maplibregl', { configurable: true, get() { return undefined; }, set() {} }); });
  try {
    const p = await C.ctx.newPage();
    await p.goto(s.url + 'index.html');
    if (!(await eventiCaricati(p, nTorino))) e.errori.push('senza mappa l\'elenco non riceve gli eventi della città scelta');
  } finally { await C.browser.close(); }

  // ---------------- Il browser non ha lo strumento grafico della mappa (WebGL spento) ----------------
  // È il caso di un computer con l'accelerazione grafica spenta: la mappa non si disegna, l'app lo dice e il resto funziona.
  const D = await apri(pw, { dl_guida: '1', dl_strati: TUTTI });
  await D.ctx.addInitScript(() => { const vera = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (tipo, ...a) { return /webgl/i.test(String(tipo)) ? null : vera.call(this, tipo, ...a); }; });
  try {
    const p = await D.ctx.newPage();
    p.on('pageerror', x => e.errori.push('senza WebGL, errore nella pagina: ' + x.message));
    await p.goto(s.url + 'index.html');
    if (!(await eventiCaricati(p, nTorino))) e.errori.push('senza WebGL l\'elenco non riceve gli eventi della città scelta');
    const testo = ((await p.locator('#map').textContent().catch(() => '')) || '').trim();
    if (testo !== 'Questo browser non riesce a disegnare la mappa. Elenco e calendario funzionano lo stesso.') e.errori.push('senza WebGL l\'app non dice che la mappa non si disegna e che il resto funziona: «' + testo + '»');
    await p.click('[data-az="elenco"]'); await pausa(500);
    const righe = await p.locator('#foglio-slot [data-ev]').count();
    if (righe < nTorino) e.errori.push(`senza WebGL l'elenco mostra ${righe} eventi invece di ${nTorino}`);
    await p.click('[data-az="chiudi"]').catch(() => {}); await p.click('[data-az="calendario"]'); await pausa(500);
    if (!(await p.locator('#foglio-slot .foglio').count())) e.errori.push('senza WebGL il calendario non si apre');
    e.note.push('senza WebGL: la pagina dice che la mappa non si disegna; elenco con ' + righe + ' eventi e calendario funzionano');
  } finally { await D.browser.close(); await s.chiudi(); }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
