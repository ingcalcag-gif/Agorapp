/* Prova nel browser: Agorà e Progetti in forma dimostrativa (voce T-015; QB-3, QB-10; libro mastro, §§ 2.2, 2.4, 3.7).

   Su un telefono nuovo, senza demo e senza nulla in memoria:
   - le due sezioni sono piene (tutte le istanze e tutti i progetti dei contenuti d'esempio) e hanno la striscia «Demo»;
   - ogni foglio aperto dalle sezioni e ogni PDF porta la striscia;
   - «Vedi sulla mappa» apre la mappa disegnata; «Salva in calendario» cambia il tasto ma non scrive nel Calendario;
   - «Scrivi alle Ancore», «Scrivi per allearti» e i moduli «Proponi» funzionano e non inviano nulla: nessun campo email,
     nessun recapito, nessun collegamento mailto, nessuna finestra aperta verso la posta;
   - in Temi, «Nelle sezioni» mostra progetti e istanze d'esempio con il bollino «Demo»;
   - alla fine la memoria del telefono è identica all'inizio, la mappa e il Calendario non hanno eventi d'esempio,
     e il telefono ha chiesto soltanto file dell'app (il file degli esempi della sua lingua compreso).
   Ogni richiesta verso l'esterno è bloccata. */
'use strict';
const { esito, eseguiDaSola } = require('../comune.js');
const { playwright, server, apri, pausa } = require('./comune.js');
const C = require('../../sorgenti/contenuti_esempio.js');

async function prova() {
  const e = esito('Agorà e Progetti in forma dimostrativa (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const D = C.sorgenti();
  const s = await server('pubblica');
  const { browser, ctx } = await apri(pw, { agorapp_guida: '1' });
  const richieste = [];
  ctx.on('request', r => richieste.push(r.url()));
  const p = await ctx.newPage();
  p.setDefaultTimeout(5000);
  const errori = [];
  p.on('pageerror', x => errori.push(x.message));
  // finestre aperte dall'app: ammesse solo quelle dei PDF (blob:), mai la posta
  await p.addInitScript(() => { window.__aperte = []; window.open = u => { window.__aperte.push(String(u)); return null; }; });
  const testo = sel => p.locator(sel).innerText();
  const foglio = () => testo('#foglio-slot');
  const chiudi = async () => { await p.keyboard.press('Escape'); await pausa(120); };
  const conStriscia = async dove => {
    if (!(await p.locator('#foglio-slot .striscia-f').count())) e.errori.push(dove + ': il foglio non ha la striscia «Demo · contenuti d\'esempio»');
  };
  const memoria = () => p.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
  try {
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="citta"]'); await pausa(400);
    const prima = await memoria();

    // ---------------- Agorà ----------------
    await p.click('button[data-sez="agora"]'); await p.waitForSelector('#pag-agora [data-ist]', { timeout: 8000 }).catch(() => {});
    const striscia = await testo('#pagina-agora .anteprima').catch(() => '');
    if (!/demo/i.test(striscia) || !/contenuti d’esempio/.test(striscia)) e.errori.push('Agorà: manca la striscia «Demo · contenuti d\'esempio»');
    const nIst = await p.locator('#pag-agora [data-ist]').count();
    if (nIst !== D.agora.istanze.length) e.errori.push(`Agorà: ${nIst} istanze invece di ${D.agora.istanze.length}`);
    await p.click('#pagina-agora .anteprima [data-az="anteprima"]'); await pausa(200);
    if (!/esempi inventati/.test(await foglio())) e.errori.push('Agorà: il foglio «Cosa vuol dire» non dice che i contenuti sono esempi inventati');
    await conStriscia('Agorà, «Cosa vuol dire»'); await chiudi();
    // istanza conclusa: restituzione, mappa disegnata, calendario dentro la demo, proposta in PDF
    const conclusa = D.agora.istanze.find(a => a.conclusa);
    await p.click(`#pag-agora [data-ist="${conclusa.id}"]`); await pausa(200);
    await p.click('#pag-agora [data-mappa-fine]'); await pausa(200);
    if (!(await p.locator('#foglio-slot .mappa svg').count())) e.errori.push('Agorà, restituzione: «Vedi sulla mappa» non apre la mappa disegnata');
    await conStriscia('Agorà, mappa della restituzione'); await chiudi();
    if (await p.evaluate(() => document.getElementById('area').hidden === false)) e.errori.push('Agorà: «Vedi sulla mappa» ha aperto la mappa vera');
    await p.click('#pag-agora [data-salva-fine]'); await pausa(150);
    if ((await p.locator('#pag-agora [data-salva-fine]').getAttribute('aria-pressed')) !== 'true') e.errori.push('Agorà, restituzione: «Salva in calendario» non cambia stato');
    await p.click('#pag-agora [data-az="proposta"] >> nth=0'); await pausa(200);
    if (!(await p.locator('#foglio-slot .carta .cs').count())) e.errori.push('Agorà: il PDF della proposta non ha la striscia in testa');
    await conStriscia('Agorà, proposta consegnata'); await chiudi();
    await p.click('#pag-agora [data-az="tutte"]'); await pausa(150);
    // un tavolo con il prossimo incontro: mappa, calendario con la scelta, rendiconto in PDF
    const ist = D.agora.istanze.find(a => a.tavoli.some(t => t.prossimo && t.incontri.length));
    const tav = ist.tavoli.find(t => t.prossimo && t.incontri.length);
    await p.click(`#pag-agora [data-ist="${ist.id}"]`); await pausa(150);
    await p.click(`#pag-agora .card[data-tavolo="${tav.n}"]`); await pausa(150);
    const tTav = await testo('#pag-agora');
    if (!tTav.includes(tav.prossimo.via)) e.errori.push('Agorà, tavolo: il prossimo incontro non mostra la via');
    await p.click('#pag-agora [data-mappa]'); await pausa(200);
    if (!(await p.locator('#foglio-slot .mappa svg').count())) e.errori.push('Agorà, tavolo: «Vedi sulla mappa» non apre la mappa disegnata');
    await chiudi();
    await p.click('#pag-agora [data-cal-tavolo]'); await pausa(200);
    if ((await p.locator('#foglio-slot [data-calt]').count()) < 2) e.errori.push('Agorà, tavolo: «Salva in calendario» non offre la scelta tra una volta e tutta la serie');
    await conStriscia('Agorà, salva in calendario');
    await p.click('#foglio-slot [data-calt="serie"]'); await pausa(200);
    if (!/Tutti salvati/.test(await testo('#pag-agora [data-cal-tavolo]'))) e.errori.push('Agorà, tavolo: dopo «Tutti gli incontri del tavolo» il tasto non cambia');
    await p.click(`#pag-agora [data-rend="${tav.n}-1"]`); await pausa(150);
    await p.click('#pag-agora [data-az="pdf"]'); await pausa(200);
    if (!(await p.locator('#foglio-slot .carta .cs').count())) e.errori.push('Agorà: il PDF del rendiconto non ha la striscia in testa');
    await p.click('#foglio-slot [data-stampa-carta]'); await pausa(300);
    await chiudi();
    // Proponi una nuova istanza
    await p.click('#pag-agora [data-az="indietro"]'); await pausa(100); await p.click('#pag-agora [data-az="indietro"]'); await pausa(100);
    await p.click('#pag-agora [data-az="tutte"]').catch(() => {}); await pausa(100);
    await p.click('#pag-agora [data-az="proponi"]'); await pausa(200);
    await conStriscia('Agorà, Proponi');
    if (await p.locator('#foglio-slot input[type="email"], #foglio-slot #p-mail').count()) e.errori.push('Agorà, Proponi: il modulo chiede ancora un indirizzo email');
    await p.click('#foglio-slot [data-pz="invia"]'); await pausa(150);
    if (!(await p.locator('#foglio-slot .p-err:not([hidden])').count())) e.errori.push('Agorà, Proponi: i campi obbligatori non segnalano nulla');
    await p.fill('#p-titolo', 'Istanza inventata per la prova'); await p.fill('#p-ob', 'Un obiettivo inventato');
    await p.fill('#p-descr', 'Una descrizione inventata lunga abbastanza per la prova.'); await p.fill('#p-sogg', 'Collettivo inventato'); await p.fill('#p-citta', 'Città inventata');
    await p.click('#foglio-slot [data-gruppo="strati"] [data-voce] >> nth=0'); await p.click('#foglio-slot [data-pz="invia"]'); await pausa(200);
    if (!/Il modulo funziona così/.test(await foglio())) e.errori.push('Agorà, Proponi: dopo «Prova a inviare» non compare «Il modulo funziona così»');
    await conStriscia('Agorà, Proponi inviato'); await chiudi();

    // ---------------- Progetti ----------------
    await p.click('button[data-sez="progetti"]'); await p.waitForSelector('#pag-progetti [data-prog]', { timeout: 8000 }).catch(() => {});
    if (!/demo/i.test(await testo('#pagina-progetti .anteprima').catch(() => ''))) e.errori.push('Progetti: manca la striscia «Demo · contenuti d\'esempio»');
    while (await p.locator('#pag-progetti [data-az="carica"]').count()) { await p.click('#pag-progetti [data-az="carica"]'); await pausa(100); }
    const nProg = await p.locator('#pag-progetti [data-prog]').count();
    if (nProg !== D.progetti.progetti.length) e.errori.push(`Progetti: ${nProg} progetti invece di ${D.progetti.progetti.length}`);
    if ((await p.locator('#pag-progetti .prossima-mini').count()) !== nProg) e.errori.push('Progetti: non tutti i progetti mostrano il prossimo appuntamento');
    for (const pr of D.progetti.progetti) {
      await p.click('button[data-sez="progetti"]'); await pausa(80);
      while (await p.locator('#pag-progetti [data-az="carica"]').count()) { await p.click('#pag-progetti [data-az="carica"]'); await pausa(60); }
      await p.click(`#pag-progetti [data-prog="${pr.id}"]`); await pausa(120);
      const t = await testo('#pag-progetti');
      if (!t.includes(pr.bacheca.app.posto) || !(await p.locator('#pag-progetti .prossima').count())) e.errori.push(`Progetti, ${pr.titolo}: la bacheca non ha il prossimo appuntamento`);
      if (/\[[^\]]*\]|undefined|NaN|\{/.test(t)) e.errori.push(`Progetti, ${pr.titolo}: segnaposto o valori mancanti nella bacheca`);
    }
    // l'ultima bacheca aperta: mappa, calendario, scrivere, profili, «Vorrei venire», stampa
    await p.click('#pag-progetti [data-az="mappa"] >> nth=0'); await pausa(200);
    if (!(await p.locator('#foglio-slot .mappa svg').count())) e.errori.push('Progetti: «Vedi sulla mappa» non apre la mappa disegnata');
    await conStriscia('Progetti, mappa'); await chiudi();
    await p.click('#pag-progetti [data-az="cal"]'); await pausa(200);
    await conStriscia('Progetti, salva in calendario');
    await p.click('#foglio-slot [data-cal="volta"]'); await pausa(200);
    if ((await p.locator('#pag-progetti [data-az="cal"]').getAttribute('aria-pressed')) !== 'true') e.errori.push('Progetti: «Salva in calendario» non cambia stato');
    await p.click('#pag-progetti [data-scrivi="ancore"]'); await pausa(200);
    await conStriscia('Progetti, scrivi alle Ancore');
    await p.click('#foglio-slot [data-az="scrivi-invia"]'); await pausa(120);
    if (!(await p.locator('#foglio-slot .p-err:not([hidden])').count())) e.errori.push('Progetti, scrivi: il messaggio vuoto non segnala nulla');
    await p.fill('#s-msg', 'Messaggio inventato per la prova'); await p.click('#foglio-slot [data-az="scrivi-invia"]'); await pausa(200);
    if (!/Il messaggio funziona così/.test(await foglio())) e.errori.push('Progetti, scrivi: dopo «Prova a inviare» non compare «Il messaggio funziona così»');
    await chiudi();
    const persone = await p.$$eval('#pag-progetti [data-persona]', b => b.map(x => x.dataset.persona));
    for (const k of persone) {
      await p.click(`#pag-progetti [data-persona="${k}"]`); await pausa(120);
      const f = await foglio();
      if (/@|\[|recapito/i.test(f)) e.errori.push(`Progetti, profilo ${k}: mostra un recapito o un segnaposto`);
      if (await p.locator('#foglio-slot [data-scrivi]').count()) {
        await p.click('#foglio-slot [data-scrivi]'); await pausa(120);
        await p.fill('#s-msg', 'Messaggio inventato'); await p.click('#foglio-slot [data-az="scrivi-invia"]'); await pausa(150);
        if (!/Il messaggio funziona così/.test(await foglio())) e.errori.push(`Progetti, profilo ${k}: il messaggio non si prova`);
      }
      await chiudi();
    }
    await p.click('#pag-progetti [data-az="vengo"]'); await pausa(150);
    await p.click('#foglio-slot [data-io="compagnia"]'); await pausa(150); await chiudi();
    await p.click('#pag-progetti [data-az="stampa"]'); await pausa(200);
    if (!(await p.locator('#foglio-slot .carta .cs').count())) e.errori.push('Progetti: la bacheca stampata non ha la striscia in testa');
    if (/\[|@/.test(await foglio())) e.errori.push('Progetti: la bacheca stampata ha un segnaposto o un recapito');
    await p.click('#foglio-slot [data-stampa-carta]'); await pausa(300); await chiudi();
    // Proponi un nuovo progetto
    await p.click('#pag-progetti [data-az="tutti"]'); await pausa(150);
    await p.click('#pag-progetti [data-az="proponi"]'); await pausa(200);
    if (await p.locator('#foglio-slot input[type="email"], #foglio-slot #p-mail').count()) e.errori.push('Progetti, Proponi: il modulo chiede ancora un indirizzo email');
    await p.fill('#p-titolo', 'Progetto inventato'); await p.fill('#p-zona', 'Zona inventata'); await p.fill('#p-chi', 'Nome inventato');
    await p.fill('#p-descr', 'Una descrizione inventata lunga abbastanza per la prova.');
    await p.click('#foglio-slot [data-gruppo="strati"] [data-voce] >> nth=0'); await p.click('#foglio-slot [data-gruppo="etich"] [data-voce] >> nth=0');
    await p.click('#foglio-slot [data-pz="invia"]'); await pausa(200);
    if (!/Il modulo funziona così/.test(await foglio())) e.errori.push('Progetti, Proponi: dopo «Prova a inviare» non compare «Il modulo funziona così»');
    await chiudi();

    // ---------------- Temi: «Nelle sezioni» con il bollino ----------------
    const tema = D.progetti.progetti[0].temi[0];
    await p.click('button[data-sez="temi"]'); await pausa(300);
    await p.click(`#pagina-temi [data-scegli="t:${tema}"]`); await pausa(150); await p.click('#pagina-temi [data-tz="mostra"]'); await pausa(400);
    const sez = await p.locator('#pagina-temi .t-sez').count(), bollini = await p.locator('#pagina-temi .t-sez .t-sez-demo').count();
    if (!sez) e.errori.push('Temi: «Nelle sezioni» non mostra i progetti e le istanze d\'esempio');
    if (bollini !== sez) e.errori.push('Temi: non tutte le schede di «Nelle sezioni» hanno il bollino «Demo»');

    // ---------------- Nulla fuori dalla demo ----------------
    await p.click('button[data-sez="mappa"]'); await pausa(300);
    const dopo = await memoria();
    const cambiate = [...new Set(Object.keys(prima).concat(Object.keys(dopo)))].filter(k => prima[k] !== dopo[k]);
    if (cambiate.length) e.errori.push('memoria del telefono cambiata dopo aver usato le due sezioni: ' + cambiate.join(', '));
    const ev = await p.evaluate(() => window.AGR.eventi().length);
    if (ev) e.errori.push(`la mappa ha ${ev} eventi dopo aver usato le due sezioni`);
    if (await p.locator('#btnCal .num').count()) e.errori.push('il Calendario conta eventi dopo «Salva in calendario» nelle due sezioni');
    const mailto = await p.evaluate(() => document.querySelectorAll('a[href^="mailto:"]').length);
    const aperte = await p.evaluate(() => window.__aperte);
    if (aperte.some(u => !u.startsWith('blob:'))) e.errori.push('l\'app ha aperto una finestra che non è un PDF: ' + aperte.filter(u => !u.startsWith('blob:')).join(', '));
    if (aperte.filter(u => u.startsWith('blob:')).length < 2) e.errori.push('«Scarica il PDF» non ha preparato il PDF del rendiconto e della bacheca');
    e.note.push(`istanze ${nIst}, progetti ${nProg}, profili provati ${persone.length}, collegamenti mailto nella pagina ${mailto} (quelli delle sezioni non ci sono)`);
  } catch (err) {
    e.errori.push('la prova si è interrotta: ' + String(err && err.message || err).split('\n')[0]);
  } finally {
    await browser.close(); await s.chiudi();
  }
  const esterne = richieste.filter(u => !u.startsWith(s.url) && !u.startsWith('blob:') && !u.startsWith('data:'));
  const conosciute = esterne.filter(u => /basemaps\.cartocdn\.com/.test(u));   // mappa CARTO fino a T-017 (scarto della prova delle richieste)
  if (esterne.length > conosciute.length) e.errori.push('richieste fuori dall\'app: ' + [...new Set(esterne.filter(u => !conosciute.includes(u)))].join(', '));
  const esempi = richieste.filter(u => /\/anteprime\/[a-z]{2}\.json/.test(u));
  if (!esempi.length) e.errori.push('il telefono non ha chiesto il file degli esempi');
  if (esempi.some(u => !/\/anteprime\/it\.json/.test(u))) e.errori.push('in italiano il telefono ha chiesto anche il file di un\'altra lingua');
  for (const x of errori) e.errori.push('errore nella pagina: ' + x);
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
