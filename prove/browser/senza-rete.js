/* Prova nel browser: l'app senza rete (voce T-029 del piano di adeguamento; libro mastro, § 2.2 e § 3.7; documento:
   docs/senza-rete.md). Qui il service worker è acceso, e l'app arriva da un server che la prova può cambiare.

   1. Prima apertura in rete: il service worker conserva la copia dell'app (tutti i file della versione, tranne quelli
      che si conservano solo quando servono), e nient'altro; un file che risponde una volta con un errore si richiede
      e la copia si completa lo stesso; la guida «Senza connessione» dice a che punto è («si sta preparando», poi
      «è pronta»); i tasselli della mappa guardata e gli eventi della zona finiscono nelle loro voci della memoria per i
      file.
   2. Senza rete: l'app si riapre, con la mappa, gli eventi della zona, il calendario con l'Off-Grid, i contenuti
      d'esempio di Agorà e il PDF del calendario.
   3. Una versione con un file che non corrisponde alla sua impronta non parte: resta la versione di prima.
   4. Una versione nuova si prepara in silenzio e aspetta: finché l'app è in uso (anche dopo una ricarica, anche con
      un foglio aperto) resta quella di prima; entra in uso da sé quando l'app non è in vista e non c'è nulla di
      aperto, e allora i file della versione di prima sono cancellati.
   5. Interruttore d'emergenza: quando emergenza.json dice di scartare la versione, la copia si cancella, il service
      worker si toglie e l'app si ricarica dalla rete, senza riattivarlo.
   6. Un telefono nuovo a cui arriva un file che non è quello della versione: la copia non si fa e la guida «Senza
      connessione» dice che non è riuscita, con il nome del file e il motivo.
   Dati inventati; ogni richiesta verso l'esterno è bloccata. */
'use strict';
const { esito, eseguiDaSola } = require('../comune.js');
const { playwright, server, apri, giorno, pausa, eventiCaricati } = require('./comune.js');
const { uscita, configurazione, SEMPRE_DALLA_RETE } = require('../../sorgenti/build.js');

const copiaDi = file => JSON.parse(file['sw.js'].match(/const COPIA = (\{[^;]*\});/)[1]);
const versioneDi = file => JSON.parse(file['sw.js'].match(/const VERSIONE = ("[^"]*");/)[1]);
const pigriDi = file => JSON.parse(file['sw.js'].match(/const PIGRI = (\[[^;]*\]);/)[1]);

async function prova() {
  const e = esito('L\'app senza rete (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const err = x => e.errori.push(x);
  const cfg = configurazione();
  const A = uscita(cfg), B = uscita({ ...cfg, aspetto: { ...cfg.aspetto, colore_tema: '#FFFDF7' } });   // due versioni dell'app
  const vA = versioneDi(A), vB = versioneDi(B);
  if (vA === vB) err('le due versioni di prova hanno lo stesso numero');
  let attuale = A, lento = false, letture = 0;
  /* quando «lento» è acceso, una lettura su due del file d'emergenza arriva in ritardo: così la pagina lo sta ancora
     aspettando quando il service worker la fa ricaricare (su una macchina lenta succede da sé) */
  /* alla prima apertura un file arriva lento (si vede la preparazione) e uno risponde una volta 503 (si deve riprovare) */
  const LENTO = 'licenze/index.html', CAPRICCIOSO = 'licenze/odbl-1.0.txt';
  let primaVolta = true, richiesteCapriccioso = 0;
  const s = await server('pubblica', { file: () => attuale,
    ritardo: k => (primaVolta && k === LENTO) ? 9000 : (lento && k === 'emergenza.json' && (letture++ % 2)) ? 700 : 0,
    stato: k => k === CAPRICCIOSO && ++richiesteCapriccioso === 1 ? 503 : 0 });
  const F = '#foglio-slot ';
  const g = giorno(1);
  const og = { id: 'prova-og-senza-rete', personal: true, offgrid: true, title: 'Cena inventata', datetime: g + 'T20:00', end: g + 'T22:00', lat: 45.071, lng: 7.688, address: 'Via Finta 3', hidden: false, price: '' };
  const { browser, ctx } = await apri(pw, { dl_guida: '1', dl_strati: { musica: { on: true }, arte: { on: true } }, dl_eventi: [og], dl_calendario: { [og.id]: true } }, { serviceWorkers: 'allow' });
  try {
    const p = await ctx.newPage();
    const errori = []; p.on('pageerror', x => errori.push(x.message));
    p.setDefaultNavigationTimeout(60000);   // su una macchina lenta la prima apertura dopo un aggiornamento può richiedere tempo
    await p.addInitScript(() => { let ml; Object.defineProperty(window, 'maplibregl', { configurable: true, get() { return ml; },
      set(v) { const C = v.Map; v.Map = function (...a) { const m = new C(...a); window.__mappaProva = m; return m; }; v.Map.prototype = C.prototype; ml = v; } }); });
    const apriApp = async () => { await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); };
    const tocca = async (sel, dove) => {
      const l = p.locator(sel).first();
      if (!(await l.count())) { err(`${dove}: non trovo ${sel}`); return false; }
      try { await l.click({ timeout: 5000 }); } catch (x) { try { await l.dispatchEvent('click'); } catch (y) { err(`${dove}: non riesco a toccare ${sel}`); return false; } }
      await pausa(350); return true;
    };
    /* la versione del service worker che serve la pagina ('' se non c'è) e quella scritta nella pagina */
    const versioneSw = () => p.evaluate(() => new Promise(ok => { const c = navigator.serviceWorker && navigator.serviceWorker.controller; if (!c) return ok('');
      const m = new MessageChannel(); m.port1.onmessage = x => ok(String(x.data)); c.postMessage('versione', [m.port2]); setTimeout(() => ok(''), 2000); }));
    const versionePagina = () => p.evaluate(() => document.documentElement.getAttribute('data-versione'));
    /* mentre la pagina si ricarica una domanda può cadere nel vuoto: si riprova */
    const aspetta = async (fn, ms = 25000) => { const fine = Date.now() + ms; for (;;) { let ok = false; try { ok = await fn(); } catch (x) { ok = false; } if (ok) return true; if (Date.now() > fine) return false; await pausa(300); } };
    const nellaCopia = () => p.evaluate(async () => (await (await caches.open('dl_app')).keys()).map(r => r.url));
    const casse = () => p.evaluate(async () => { const o = {}; for (const n of await caches.keys()) o[n] = (await (await caches.open(n)).keys()).length; return o; });

    /* ---------- 1. prima apertura in rete ---------- */
    const statoCopia = async () => ((await p.locator('#copia-stato').textContent().catch(() => '')) || '').trim();
    await apriApp();
    if (await tocca('[data-az="impostazioni"]', 'impostazioni') && await tocca(F + '[data-az="senza-rete"]', 'guida «Senza connessione»')) {
      if (!(await aspetta(async () => /si sta preparando per l’uso senza rete\. \d+ file su \d+\./.test(await statoCopia()), 15000))) err('durante la preparazione la guida non dice a che punto è: «' + (await statoCopia()) + '»');
      if (!(await aspetta(async () => /è pronta per l’uso senza rete/.test(await statoCopia()), 45000))) err('a preparazione finita la guida non dice che l\'app è pronta: «' + (await statoCopia()) + '»');
    }
    primaVolta = false;
    if (richiesteCapriccioso < 2) err('il file che ha risposto 503 non è stato richiesto di nuovo');
    if (!(await aspetta(async () => (await versioneSw()) === vA))) { err('il service worker non prende in carico la pagina alla prima apertura'); await s.chiudi(); return e; }
    if (await versionePagina() !== vA) err('il numero di versione nella pagina non è quello dell\'app montata');
    const base = s.url, copiaA = copiaDi(A), pigri = pigriDi(A);
    const attesi = Object.keys(copiaA).filter(f => !pigri.includes(f));
    let chiavi = await nellaCopia();
    const fuori = chiavi.filter(u => !u.startsWith(base));
    if (fuori.length) err('nella copia dell\'app ci sono file di altri indirizzi: ' + fuori.slice(0, 3).join(', '));
    if (chiavi.length !== attesi.length) err(`nella copia dell'app ci sono ${chiavi.length} file, la versione ne ha ${attesi.length} da conservare subito`);
    for (const f of SEMPRE_DALLA_RETE) if (chiavi.some(u => u.split('?')[0] === base + f)) err(`«${f}» è finito nella copia dell'app: deve arrivare sempre dalla rete`);
    /* dal blocco 8 (T-033) i file che si conservano solo quando servono (la libreria di Excel) sono soltanto dell'app della redazione: sezione 6 */
    if (pigri.length) err('app pubblica: non deve avere file che si conservano solo quando servono: ' + pigri.join(', '));
    if (!(await eventiCaricati(p, 3))) err('in rete gli eventi della zona non arrivano');
    if (!(await aspetta(async () => (await p.evaluate(() => window.AGR.mappa().sulTelefono)).tasselli >= 4))) err('i tasselli della mappa guardata non si conservano sul telefono');
    const c1 = await casse();
    const estranee = Object.keys(c1).filter(n => !['dl_app', 'dl_mappa', 'dl_archivio'].includes(n));
    if (estranee.length) err('nella memoria per i file ci sono voci fuori elenco: ' + estranee.join(', '));
    e.note.push(`versione ${vA}: ${attesi.length} file nella copia dell'app (un file richiesto ${richiesteCapriccioso} volte dopo un 503); la guida ha mostrato la preparazione e poi «pronta»; sul telefono anche ${c1.dl_mappa || 0} file della mappa e ${c1.dl_archivio || 0} dell'archivio degli eventi`);

    /* ---------- 2. senza rete ---------- */
    await ctx.setOffline(true);
    await p.reload();
    try { await p.waitForSelector('[data-az="elenco"]', { timeout: 15000 }); } catch (x) { err('senza rete l\'app non si apre'); await s.chiudi(); return e; }
    if (!(await eventiCaricati(p, 3))) err('senza rete gli eventi delle zone già aperte non si vedono');
    if (!(await aspetta(() => p.evaluate(() => { const m = window.__mappaProva; return !!m && m.isStyleLoaded() && m.querySourceFeatures('protomaps', { sourceLayer: 'roads' }).length > 0; }), 15000))) err('senza rete la mappa delle zone già guardate non si disegna');
    if (await tocca('[data-az="elenco"]', 'senza rete, elenco')) {
      const righe = await p.locator(F + '[data-ev]').count();
      if (righe < 2) err('senza rete l\'elenco non mostra gli eventi della zona e l\'Off-Grid');
      if (!(await p.locator(F + '[data-ev="' + og.id + '"]').count())) err('senza rete manca l\'Off-Grid della persona');
    }
    await p.reload(); await p.waitForSelector('[data-az="elenco"]');
    if (await tocca('[data-az="calendario"]', 'senza rete, calendario') && await tocca(F + '[data-vista="agenda"]', 'senza rete, agenda') && await tocca(F + '[data-az="pdf"]', 'senza rete, PDF')) {
      const scarico = p.waitForEvent('download', { timeout: 20000 }).catch(() => null);
      if (await tocca(F + '[data-az="scarica-pdf"]', 'senza rete, scarica il PDF') && !(await scarico)) err('senza rete il PDF del calendario non si crea');
    }
    await p.reload(); await p.waitForSelector('[data-az="elenco"]');
    if (await tocca('[data-sez="agora"]', 'senza rete, Agorà')) {
      if (!(await aspetta(() => p.evaluate(() => document.querySelectorAll('#pag-agora button, #pag-agora article').length > 3), 8000))) err('senza rete i contenuti d\'esempio di Agorà non si caricano');
    }
    await p.reload(); await p.waitForSelector('[data-az="elenco"]');
    if (await tocca('[data-az="impostazioni"]', 'senza rete, impostazioni')) {
      if (!((await p.locator('#versione-app').textContent().catch(() => '')) || '').includes(vA)) err('le Impostazioni non mostrano il numero di versione');
      if (await tocca(F + '[data-az="senza-rete"]', 'senza rete, guida') && !(await p.locator(F + '[data-legale="dati-locali"]').count())) err('la guida «Senza connessione» non porta alla scheda «Dati locali»');
    }
    if (errori.length) err('senza rete la pagina ha dato errori: ' + [...new Set(errori)].slice(0, 3).join(' · '));
    e.note.push('senza rete: l\'app si riapre con mappa, eventi della zona, Off-Grid, PDF del calendario, contenuti d\'esempio di Agorà e guida');
    await ctx.setOffline(false);

    /* ---------- 3. una versione con un file che non è il suo non parte ---------- */
    const inAttesa = () => p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return !!(r && r.waiting); });
    /* si manomette un file che tra le due versioni cambia: quelli uguali il telefono li ha già, e non li riscarica */
    if (A['index.html'] === B['index.html']) err('le due versioni di prova hanno la stessa pagina');
    attuale = { ...B, 'index.html': B['index.html'] + '\n<!-- file manomesso dalla prova -->\n' };
    await apriApp(); await pausa(2500);
    await apriApp(); await pausa(1500);
    if (await inAttesa()) err('una versione con un file che non corrisponde alla sua impronta è stata accettata');
    if (await versioneSw() !== vA || await versionePagina() !== vA) err('con una versione nuova non valida non è rimasta in uso quella di prima');

    /* ---------- 4. una versione nuova, in silenzio ---------- */
    attuale = B;
    await apriApp();
    if (!(await aspetta(inAttesa))) err('la versione nuova non si è preparata da sola');
    if (await versionePagina() !== vA || await versioneSw() !== vA) err('la versione nuova è entrata in uso mentre l\'app era aperta');
    await apriApp(); await pausa(800);
    if (await versionePagina() !== vA) err('la versione nuova è entrata in uso a una semplice ricarica, con l\'app ancora aperta');
    /* entra in uso da sé solo quando non disturba: app non in vista e nulla di aperto */
    const nonInVista = () => p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
    if (await tocca('[data-az="elenco"]', 'elenco')) {
      await nonInVista(); await pausa(4500);
      if (await versionePagina() !== vA) err('la versione nuova è entrata in uso mentre la persona aveva un foglio aperto');
      else { await tocca(F + '[data-az="chiudi"]', 'elenco, chiudi'); await nonInVista();
        if (!(await aspetta(async () => (await versionePagina()) === vB && (await versioneSw()) === vB, 30000))) err('con l\'app non in vista e nulla di aperto la versione nuova non è entrata in uso da sé'); }
    }
    await pausa(1000);
    await apriApp();
    if (await versionePagina() !== vB) err('alla riapertura non c\'è la versione nuova');
    const copiaB = copiaDi(B), buone = new Set(Object.entries(copiaB).map(([f, h]) => f + '?v=' + h));
    chiavi = await nellaCopia();
    const vecchie = chiavi.map(u => decodeURIComponent(u.slice(base.length))).filter(k => !buone.has(k));
    if (vecchie.length) err('dopo l\'aggiornamento restano nella copia file della versione di prima: ' + vecchie.slice(0, 3).join(', '));
    e.note.push(`aggiornamento da ${vA} a ${vB}: preparato a pagina aperta, in attesa finché l'app è in uso, entrato in uso da sé con l'app non in vista; i file di prima cancellati; una versione con un file manomesso è stata rifiutata`);

    /* ---------- 5. interruttore d'emergenza ---------- */
    attuale = { ...B, 'emergenza.json': JSON.stringify({ scarta: [vB] }) }; lento = true;
    await apriApp();
    if (!(await aspetta(() => p.evaluate(async () => !(await navigator.serviceWorker.getRegistration()) && !navigator.serviceWorker.controller), 30000))) {
      const come = await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(), c = navigator.serviceWorker.controller;
        return 'registrazione ' + (r ? 'presente (attivo: ' + !!r.active + ', in attesa: ' + !!r.waiting + ', in preparazione: ' + !!r.installing + ')' : 'assente') + ', pagina ' + (c ? 'servita dal service worker' : 'non servita') + ', versione della pagina ' + document.documentElement.getAttribute('data-versione'); }).catch(x => 'pagina non raggiungibile: ' + x.message);
      err('con l\'interruttore d\'emergenza il service worker non si è tolto: ' + come);
    }
    await pausa(1200);
    try { await p.waitForSelector('[data-az="elenco"]', { timeout: 15000 }); } catch (x) { err('dopo l\'interruttore d\'emergenza l\'app non si riapre dalla rete'); }
    lento = false;
    const rimasti = (await nellaCopia()).filter(u => u.startsWith(base));
    if (rimasti.length) err('dopo l\'interruttore d\'emergenza restano ' + rimasti.length + ' file nella copia dell\'app');
    await apriApp(); await pausa(1500);
    if (await p.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()))) err('con l\'interruttore d\'emergenza acceso la pagina ha riattivato il service worker');
    const dati = await p.evaluate(() => ({ og: window.AGR.eventi().length, cal: window.AGR.salvati.has('prova-og-senza-rete') }));
    if (dati.og !== 1 || !dati.cal) err('l\'interruttore d\'emergenza ha toccato gli Off-Grid o il calendario della persona');
    e.note.push('interruttore d\'emergenza: copia cancellata, service worker tolto, app ricaricata dalla rete; Off-Grid e calendario intatti');
  } finally { await browser.close(); }

  /* ---------- 6. un telefono nuovo, con un file sbagliato ---------- */
  const SBAGLIATO = 'anteprime/fr.json';
  attuale = { ...A, [SBAGLIATO]: A[SBAGLIATO] + '\n' };
  const nuovo = await apri(pw, { dl_guida: '1' }, { serviceWorkers: 'allow' });
  try {
    const p = await nuovo.ctx.newPage();
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="impostazioni"]'); await pausa(500);
    await p.locator('[data-az="impostazioni"]').first().click(); await pausa(400);
    await p.locator(F + '[data-az="senza-rete"]').first().click();
    const fine = Date.now() + 40000; let testo = '';
    while (Date.now() < fine) { testo = ((await p.locator('#copia-stato').textContent().catch(() => '')) || '').trim(); if (/non è riuscita/.test(testo)) break; await pausa(400); }
    if (!/non è riuscita \(anteprime\/fr\.json: il file non corrisponde a questa versione\)/.test(testo)) err('con un file sbagliato la guida non dice che la preparazione non è riuscita, con il file e il motivo: «' + testo + '»');
    if (await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return !!(r && r.active); })) err('con un file sbagliato il service worker è entrato in uso');
    e.note.push('telefono nuovo con un file sbagliato: copia non fatta, la guida dice «' + testo.slice(0, 90) + '…»');
  } finally { await nuovo.browser.close(); await s.chiudi(); }

  /* ---------- 6. l'app della redazione (T-033): anche lei si apre senza rete; la libreria di Excel si conserva quando serve ---------- */
  const R = uscita(cfg, 'redazione'), sr = await server('redazione', { file: () => R });
  const red = await apri(pw, { dl_guida: '1' }, { serviceWorkers: 'allow' });
  try {
    const p = await red.ctx.newPage();
    p.on('pageerror', x => err('app della redazione, errore nella pagina: ' + x.message));
    const aspetta = async (fn, ms = 45000) => { const fine = Date.now() + ms; for (;;) { let ok = false; try { ok = await fn(); } catch (x) { ok = false; } if (ok) return true; if (Date.now() > fine) return false; await pausa(300); } };
    const nellaCopia = () => p.evaluate(async () => (await (await caches.open('dl_app')).keys()).map(r => decodeURIComponent(r.url)));
    await p.goto(sr.url + 'index.html'); await p.waitForSelector('#badgeRed', { timeout: 15000 });
    const pigri = pigriDi(R), subito = Object.keys(copiaDi(R)).filter(f => !pigri.includes(f));
    /* dal blocco 10 i file Excel li fa codice nostro (T-042): nessun file da conservare solo al primo uso */
    if (pigri.length) err('app della redazione: non devono esserci file da conservare solo quando servono (trovati: ' + pigri.join(', ') + ')');
    if (!(await aspetta(async () => (await nellaCopia()).length === subito.length))) err(`app della redazione: nella copia ci sono ${(await nellaCopia()).length} file, da conservare subito sono ${subito.length}`);
    let copia = await nellaCopia();
    if (copia.some(u => !u.startsWith(sr.url))) err('app della redazione: nella sua copia ci sono file di altri indirizzi');
    /* senza rete: si riapre, con gli strumenti */
    await aspetta(async () => !!(await p.evaluate(() => navigator.serviceWorker.controller)), 15000);
    await red.ctx.setOffline(true);
    await p.reload().catch(() => {});
    try { await p.waitForSelector('#badgeRed', { timeout: 15000 }); await p.click('#badgeRed'); await p.waitForSelector('#foglio-slot [data-az="chiavi"]', { timeout: 5000 }); }
    catch (x) { err('app della redazione: senza rete non si riapre con gli strumenti'); }
    await red.ctx.setOffline(false);
    e.note.push(`app della redazione: ${subito.length} file nella copia, tutti subito; senza rete si riapre con gli strumenti`);
  } finally { await red.browser.close(); await sr.chiudi(); }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
