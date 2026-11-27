/* Prova nel browser: avvisi delle novità, guida «Senza connessione» e invito alla schermata Home (voci T-031, T-030 e
   T-028 del piano di adeguamento; libro mastro, §§ 29.1, 32.1, 3.12 e allegato C.13; § 30.1; documento: docs/senza-rete.md).

   1. Con un file di prova che annuncia una modifica dei testi e uno che contiene una comunicazione di violazione
      inventata, l'avviso compare all'apertura: prima la violazione, poi la modifica; non copre l'app e non chiede
      consensi; «Ho capito» lo chiude, «Leggi» apre il testo; il telefono ricorda gli avvisi visti e non li ripropone.
   2. Alla prima apertura l'avviso aspetta la fine della guida, che ha un ultimo cartellino sulla schermata Home.
   3. Avvisi passati o futuri, file sbagliati o mancanti: nessun avviso e nessun errore.
   4. Impostazioni → Aiuto → «Senza connessione»: il testo, l'avvertenza per iPhone, il tasto «Installa» quando il
      browser lo consente, e da lì la scheda «Dati locali».
   Dati inventati; ogni richiesta verso l'esterno è bloccata. */
'use strict';
const { esito, eseguiDaSola } = require('../comune.js');
const { playwright, server, apri, giorno, pausa } = require('./comune.js');

const avviso = (id, tipo, dal, fino, altro) => Object.assign({ id, tipo, dal: giorno(dal), fino: giorno(fino), testo: { it: 'Avviso inventato: ' + id + '.', en: 'Made-up notice: ' + id + '.' } }, altro || {});
const file = (...a) => ({ formato: 'avvisi', versione: 1, avvisi: a });

async function prova() {
  const e = esito('Avvisi delle novità e guida senza connessione (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const s = await server('pubblica');
  const err = x => e.errori.push(x);
  const F = '#foglio-slot ', N = '#novita-slot ';

  const sessione = async (memoria, risposta, fn) => {
    const { browser, ctx } = await apri(pw, memoria);
    try {
      await ctx.route(u => /\/avvisi\.json$/.test(u.pathname), r => risposta === null ? r.fulfill({ status: 404, body: 'non trovato' }) : r.fulfill({ status: 200, contentType: 'application/json', body: typeof risposta === 'string' ? risposta : JSON.stringify(risposta) }));
      const p = await ctx.newPage();
      p.on('pageerror', x => err('errore nella pagina: ' + x.message));
      const avvia = async () => { await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(900); };
      const tocca = async (sel, dove) => {
        const l = p.locator(sel).first();
        if (!(await l.count())) { err(`${dove}: non trovo ${sel}`); return false; }
        try { await l.click({ timeout: 5000 }); } catch (x) { try { await l.dispatchEvent('click'); } catch (y) { err(`${dove}: non riesco a toccare ${sel}`); return false; } }
        await pausa(350); return true;
      };
      const testo = async () => (await p.locator(N).textContent() || '').trim();
      const visti = () => p.evaluate(() => JSON.parse(localStorage.getItem('dl_avvisi') || '[]'));
      await fn({ p, avvia, tocca, testo, visti });
    } finally { await browser.close(); }
  };

  try {
    /* ---------- 1. una violazione e una modifica ---------- */
    const DUE = file(avviso('modifica-inventata', 'modifica', -2, 20, { apre: 'informativa' }), avviso('violazione-inventata', 'violazione', -1, 10), avviso('modifica-scaduta', 'modifica', -40, -10), avviso('modifica-futura', 'modifica', 5, 30));
    await sessione({ dl_guida: '1' }, DUE, async ({ p, avvia, tocca, testo, visti }) => {
      await avvia();
      let t = await testo();
      if (!t.includes('violazione-inventata') || !t.includes('Comunicazione sui dati')) err('la comunicazione di violazione non compare per prima all\'apertura: «' + t.slice(0, 80) + '»');
      if (/consens|accett|rifiut|cookie/i.test(t)) err('l\'avviso sembra un banner di consenso: «' + t.slice(0, 120) + '»');
      if (await p.locator(N + '[data-az="novita-leggi"]').count()) err('un avviso senza testo da aprire non deve avere «Leggi»');
      /* non copre l'app: con l'avviso aperto l'elenco si apre lo stesso */
      if (await tocca('[data-az="elenco"]', 'elenco con l\'avviso aperto') && !(await p.locator(F + '.foglio').count())) err('con l\'avviso aperto l\'app non si usa');
      await avvia();
      if (!(await tocca(N + '[data-az="novita-ok"]', 'avviso, «Ho capito»'))) return;
      t = await testo();
      if (!t.includes('modifica-inventata') || !t.includes('Novità nei testi')) err('dopo la violazione non compare l\'avviso della modifica: «' + t.slice(0, 80) + '»');
      if (await tocca(N + '[data-az="novita-leggi"]', 'avviso, «Leggi»')) {
        if (await p.evaluate(() => window.AGR.stato.foglio + '/' + window.AGR.stato.legale) !== 'legale/informativa') err('«Leggi» non apre il testo indicato dall\'avviso');
        if (await testo()) err('dopo «Leggi» l\'avviso resta aperto');
      }
      const v = (await visti()).slice().sort().join();
      if (v !== 'modifica-inventata,violazione-inventata') err('il telefono non ricorda gli avvisi visti (o ricorda altro): ' + v);
      await avvia();
      if (await testo()) err('un avviso già visto ricompare alla riapertura');
      /* nella lingua della persona */
      await p.evaluate(() => { localStorage.removeItem('dl_avvisi'); localStorage.setItem('dl_lingua', 'en'); });
      await avvia(); t = await testo();
      if (!t.includes('Made-up notice') || !t.includes('Notice about data') || !t.includes('Got it')) err('in inglese l\'avviso non è tradotto: «' + t.slice(0, 100) + '»');
    });

    /* ---------- 2. alla prima apertura: prima la guida, con il cartellino della schermata Home ---------- */
    await sessione({}, file(avviso('modifica-inventata', 'modifica', -2, 20)), async ({ p, avvia, tocca, testo }) => {
      await avvia();
      if (await testo()) err('alla prima apertura l\'avviso compare sopra la guida');
      const passi = await p.locator('#guida-slot .passi span').count();
      for (let i = 1; i < passi; i++) await tocca('#guida-slot [data-az="guida-avanti"]', 'guida, avanti');
      const ultimo = (await p.locator('#guida-slot .guida').textContent() || '');
      if (passi !== 4 || !/schermata Home/.test(ultimo) || !/Senza connessione/.test(ultimo)) err('l\'ultimo cartellino della guida non invita ad aggiungere l\'app alla schermata Home: «' + ultimo.slice(0, 100) + '»');
      if (await tocca('#guida-slot [data-az="guida-salta"]', 'guida, fine') && !(await testo()).includes('modifica-inventata')) err('chiusa la guida l\'avviso non compare');
    });

    /* ---------- 3. niente da mostrare ---------- */
    const NIENTE = [['solo avvisi passati o futuri', file(avviso('modifica-scaduta', 'modifica', -40, -10), avviso('modifica-futura', 'modifica', 5, 30))], ['nessun avviso', file()],
      ['un campo sconosciuto', file(avviso('modifica-inventata', 'modifica', -2, 20, { collegamento: 'https://esempio.example/' }))], ['un file che non è JSON', '<html>non sono avvisi</html>'], ['il file mancante', null]];
    for (const [nome, risposta] of NIENTE) await sessione({ dl_guida: '1' }, risposta, async ({ avvia, testo }) => { await avvia(); if (await testo()) err(`con ${nome} compare un avviso`); });

    /* ---------- 4. «Senza connessione» ---------- */
    await sessione({ dl_guida: '1' }, file(), async ({ p, avvia, tocca }) => {
      await avvia();
      if (!(await tocca('[data-az="impostazioni"]', 'impostazioni') && await tocca(F + '[data-az="senza-rete"]', 'impostazioni, «Senza connessione»'))) return;
      const t = await p.locator(F).textContent() || '';
      for (const [che, re] of [['che cosa funziona senza rete', /funziona anche senza rete/], ['che cosa non funziona', /non puoi cercare un indirizzo/], ['l\'avvertenza per iPhone', /Su iPhone: se non aggiungi .* il telefono può cancellare/], ['le istruzioni per Android', /Su Android/]])
        if (!re.test(t)) err('guida «Senza connessione»: manca ' + che);
      if (/così il telefono non cancella/i.test(t)) err('guida «Senza connessione»: l\'avvertenza per iPhone promette più di quanto il libro mastro consente (§ 30.1, scelta 5)');
      if (await p.locator(F + '[data-az="installa"]').count()) err('il tasto «Installa» compare anche quando il browser non lo consente');
      await p.evaluate(() => { const ev = new Event('beforeinstallprompt', { cancelable: true }); ev.prompt = () => { window.__chiesto = true; }; window.dispatchEvent(ev); });
      await pausa(300);
      if (await tocca(F + '[data-az="installa"]', '«Installa»')) {
        if (!(await p.evaluate(() => window.__chiesto === true))) err('«Installa» non chiede al browser di installare l\'app');
        if (await p.locator(F + '[data-az="installa"]').count()) err('dopo la richiesta il tasto «Installa» resta');
      }
      const prima = await p.evaluate(() => JSON.stringify(Object.keys(localStorage).sort()));
      await p.evaluate(() => window.dispatchEvent(new Event('appinstalled'))); await pausa(300);
      if (await p.evaluate(() => JSON.stringify(Object.keys(localStorage).sort())) !== prima) err('all\'installazione l\'app annota qualcosa sul telefono');
      if (await tocca(F + '[data-legale="dati-locali"]', 'guida, «Dati locali»') && await p.evaluate(() => window.AGR.stato.foglio + '/' + window.AGR.stato.legale) !== 'legale/dati-locali') err('dalla guida «Senza connessione» non si arriva alla scheda «Dati locali»');
    });
    e.note.push('avvisi: violazione prima della modifica, «Leggi» e «Ho capito», visti ricordati, dopo la guida, in inglese; cinque casi senza nulla da mostrare');
    e.note.push('guida «Senza connessione»: testo, avvertenza per iPhone, «Installa» solo quando il browser lo consente, scheda «Dati locali»');
  } finally { await s.chiudi(); }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
