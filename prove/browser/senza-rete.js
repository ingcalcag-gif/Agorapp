/* Prova nel browser: l'app senza rete (voce T-029 del piano di adeguamento; libro mastro, § 2.2 e § 3.7; documento:
   docs/senza-rete.md). Qui il service worker è acceso, e l'app arriva da un server che la prova può cambiare.

   1. Prima apertura in rete: il service worker conserva la copia dell'app (tutti i file della versione, tranne quelli
      che si conservano solo quando servono), e nient'altro; i tasselli della mappa guardata e gli eventi della zona
      finiscono nelle loro voci della memoria per i file.
   2. Senza rete: l'app si riapre, con la mappa, gli eventi della zona, il calendario con l'Off-Grid, i contenuti
      d'esempio di Agorà e il PDF del calendario.
   3. Una versione con un file che non corrisponde alla sua impronta non parte: resta la versione di prima.
   4. Una versione nuova si prepara in silenzio: la pagina aperta resta quella di prima, alla riapertura c'è la nuova
      e i file della versione di prima sono cancellati.
   5. Interruttore d'emergenza: quando emergenza.json dice di scartare la versione, la copia si cancella, il service
      worker si toglie e l'app si ricarica dalla rete, senza riattivarlo.
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
  const s = await server('pubblica', { file: () => attuale, ritardo: k => lento && k === 'emergenza.json' && (letture++ % 2) ? 700 : 0 });
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
    await apriApp();
    if (!(await aspetta(async () => (await versioneSw()) === vA))) { err('il service worker non prende in carico la pagina alla prima apertura'); return e; }
    if (await versionePagina() !== vA) err('il numero di versione nella pagina non è quello dell\'app montata');
    const base = s.url, copiaA = copiaDi(A), pigri = pigriDi(A);
    const attesi = Object.keys(copiaA).filter(f => !pigri.includes(f));
    let chiavi = await nellaCopia();
    const fuori = chiavi.filter(u => !u.startsWith(base));
    if (fuori.length) err('nella copia dell\'app ci sono file di altri indirizzi: ' + fuori.slice(0, 3).join(', '));
    if (chiavi.length !== attesi.length) err(`nella copia dell'app ci sono ${chiavi.length} file, la versione ne ha ${attesi.length} da conservare subito`);
    for (const f of SEMPRE_DALLA_RETE) if (chiavi.some(u => u.split('?')[0] === base + f)) err(`«${f}» è finito nella copia dell'app: deve arrivare sempre dalla rete`);
    if (!pigri.length || chiavi.some(u => pigri.some(f => decodeURIComponent(u).includes(f)))) err('i file che servono solo all\'area riservata sono stati conservati subito');
    else { await p.evaluate(f => fetch(f).then(r => r.arrayBuffer()), pigri[0]);
      if (!(await aspetta(async () => (await nellaCopia()).some(u => decodeURIComponent(u).includes(pigri[0])), 8000))) err('un file che si conserva quando serve non è stato conservato dopo l\'uso'); }
    if (!(await eventiCaricati(p, 3))) err('in rete gli eventi della zona non arrivano');
    if (!(await aspetta(async () => (await p.evaluate(() => window.AGR.mappa().sulTelefono)).tasselli >= 4))) err('i tasselli della mappa guardata non si conservano sul telefono');
    const c1 = await casse();
    const estranee = Object.keys(c1).filter(n => !['dl_app', 'dl_mappa', 'dl_archivio'].includes(n));
    if (estranee.length) err('nella memoria per i file ci sono voci fuori elenco: ' + estranee.join(', '));
    e.note.push(`versione ${vA}: ${attesi.length} file nella copia dell'app; sul telefono anche ${c1.dl_mappa || 0} file della mappa e ${c1.dl_archivio || 0} dell'archivio degli eventi`);

    /* ---------- 2. senza rete ---------- */
    await ctx.setOffline(true);
    await p.reload();
    try { await p.waitForSelector('[data-az="elenco"]', { timeout: 15000 }); } catch (x) { err('senza rete l\'app non si apre'); return e; }
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
      if (await tocca(F + '[data-az="senza-rete"]', 'senza rete, guida') && !(await p.locator(F + '[data-legale="storage"]').count())) err('la guida «Senza connessione» non porta alla scheda «Dati locali»');
    }
    if (errori.length) err('senza rete la pagina ha dato errori: ' + [...new Set(errori)].slice(0, 3).join(' · '));
    e.note.push('senza rete: l\'app si riapre con mappa, eventi della zona, Off-Grid, PDF del calendario, contenuti d\'esempio di Agorà e guida');
    await ctx.setOffline(false);

    /* ---------- 3. una versione con un file che non è il suo non parte ---------- */
    /* si manomette un file che tra le due versioni cambia: quelli uguali il telefono li ha già, e non li riscarica */
    if (A['index.html'] === B['index.html']) err('le due versioni di prova hanno la stessa pagina');
    attuale = { ...B, 'index.html': B['index.html'] + '\n<!-- file manomesso dalla prova -->\n' };
    await apriApp(); await pausa(2500);
    await apriApp(); await pausa(1500);
    if (await versioneSw() !== vA) err('una versione con un file che non corrisponde alla sua impronta ha sostituito quella di prima');
    if (await versionePagina() !== vA) err('con una versione nuova non valida la pagina non è rimasta quella di prima');

    /* ---------- 4. una versione nuova, in silenzio ---------- */
    attuale = B;
    await apriApp();
    if (await versionePagina() !== vA) err('all\'arrivo di una versione nuova la pagina già aperta deve restare quella di prima');
    if (!(await aspetta(async () => (await versioneSw()) === vB))) err('la versione nuova non si è preparata da sola');
    await apriApp();
    if (await versionePagina() !== vB) err('alla riapertura non c\'è la versione nuova');
    const copiaB = copiaDi(B), buone = new Set(Object.entries(copiaB).map(([f, h]) => f + '?v=' + h));
    chiavi = await nellaCopia();
    const vecchie = chiavi.map(u => decodeURIComponent(u.slice(base.length))).filter(k => !buone.has(k));
    if (vecchie.length) err('dopo l\'aggiornamento restano nella copia file della versione di prima: ' + vecchie.slice(0, 3).join(', '));
    e.note.push(`aggiornamento da ${vA} a ${vB}: preparato a pagina aperta, in uso alla riapertura; i file di prima cancellati; una versione con un file manomesso è stata rifiutata`);

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
  } finally { await browser.close(); await s.chiudi(); }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
