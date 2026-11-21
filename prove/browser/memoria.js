/* Prova nel browser: sul telefono resta soltanto ciò che l'elenco chiuso prevede (voce T-026 del piano di adeguamento;
   libro mastro, § 3.7, § 30.1 scelta 2 e § 30.3, «che la tabella corrisponda a ciò che l'app salva davvero»; § 2.5,
   principio 4; § 4.1; documento: docs/dati-locali.md).

   1. Un telefono con i dati delle versioni precedenti: all'avvio i dati traslocano sotto i nomi nuovi e l'app li usa
      (lingua, tema, città, Modalità semplice, mezzo, Off-Grid, calendario); i nomi di prima, le chiavi delle funzioni
      tolte e i file con il nome di prima spariscono; ciò che appartiene ad altre pagine dello stesso indirizzo resta.
   2. Un telefono nuovo, dopo un giro completo nell'app (guida, strati e combinazioni, scheda e calendario, Off-Grid
      nuovo, giornata e PDF, ricerca, città, tema, lingua, Modalità semplice, Temi e lenti, Agorà e Progetti, testi
      legali): nella memoria del browser ci sono soltanto chiavi dell'elenco, e il giro le ha toccate tutte; niente
      nella memoria della scheda, nessun cookie, nessuna base di dati, nessun programma in sottofondo; nella memoria
      per i file solo le voci dell'elenco, ognuna con dentro solo i file suoi (gli eventi delle zone consultate, i
      tasselli della mappa); nessuna chiave della Redazione. La copia dell'app, che scrive il service worker, la
      controlla prove/browser/senza-rete.js: qui il service worker è spento, perché la prova usa risposte finte.
   3. Usare l'app non lascia tracce: riaprirla più volte, muovere la mappa, aprire schede, cercare eventi e indirizzi
      non cambia nulla nella memoria del browser (nessun contatore delle visite, nessun registro di ricerche o di
      spostamenti, nessun identificativo).
   4. Nell'area riservata compaiono le chiavi della Redazione, e soltanto quelle.
   Dati inventati; ogni richiesta verso l'esterno è bloccata. */
'use strict';
const { esito, eseguiDaSola } = require('../comune.js');
const { playwright, server, apri, giorno, pausa, eventiCaricati, ZONA_ARCHIVIO } = require('./comune.js');
const M = require('../../sorgenti/moduli/memoria.js');

const PUBBLICHE = M.chiavi(false, 'memoria'), REDAZIONE = M.ELENCO.filter(v => v.redazione).map(v => v.nome);
const FILE = M.chiavi(false, 'file');
/* Che cosa può stare in ogni voce della memoria per i file, e quali voci il giro deve riempire. */
const DENTRO = { dl_archivio: f => f.includes(ZONA_ARCHIVIO), dl_mappa: f => f.includes('/mappa/prova/sul-telefono/'), dl_app: f => f.includes('/dist/pubblica/') };
const NEL_GIRO = FILE.filter(n => n !== 'dl_app');
/* Un avviso delle novità inventato, per far scrivere al giro la chiave degli avvisi visti (T-031). */
const AVVISI = { formato: 'avvisi', versione: 1, avvisi: [{ id: 'prova-avviso-inventato', tipo: 'modifica', dal: giorno(-1), fino: giorno(30), testo: { it: 'Avviso inventato per la prova.' } }] };
const DI_PRIMA = Object.fromEntries(M.ELENCO.filter(v => v.prima).map(v => [v.nome, v.prima]));
const SEME = 'prova-seminata';   // il segno che le prove lasciano nella memoria della scheda (prove/browser/comune.js)

/* La risposta finta della ricerca degli indirizzi. */
const RICERCA = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [7.6869, 45.0703] },
  properties: { country: 'Italia', city: 'Torino', postcode: '10100', street: 'Via Inventata', housenumber: '5', type: 'house' } }] };

/* Tutto ciò che il telefono conserva per l'indirizzo dell'app. */
const inventario = () => (async () => {
  const mem = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); mem[k] = localStorage.getItem(k); }
  const ses = []; for (let i = 0; i < sessionStorage.length; i++) ses.push(sessionStorage.key(i));
  const casse = {};
  if (window.caches) for (const n of await caches.keys()) casse[n] = (await (await caches.open(n)).keys()).map(r => new URL(r.url).pathname).sort();
  const basi = window.indexedDB && indexedDB.databases ? (await indexedDB.databases()).map(d => d.name) : [];
  const sw = navigator.serviceWorker ? (await navigator.serviceWorker.getRegistrations()).length : 0;
  return { mem, ses, casse, basi, sw, cookie: document.cookie };
})();

async function prova() {
  const e = esito('Sul telefono solo l\'elenco chiuso (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const s = await server('pubblica');
  const err = x => e.errori.push(x);
  const F = '#foglio-slot ';

  const strumenti = async (ctx, p) => {
    await ctx.route(u => /\/avvisi\.json$/.test(u.pathname), r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AVVISI) }));
    await ctx.route(u => u.hostname === 'photon.komoot.io', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(RICERCA) }));
    p.on('pageerror', x => err('errore nella pagina: ' + x.message));
    /* la mappa che l'app crea si tiene da parte, per spostarla */
    await p.addInitScript(() => { let ml; Object.defineProperty(window, 'maplibregl', { configurable: true, get() { return ml; },
      set(v) { const C = v.Map; v.Map = function (...a) { const m = new C(...a); window.__mappaProva = m; return m; }; v.Map.prototype = C.prototype; ml = v; } }); });
    const avvia = async (n = 1) => { await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]');
      if (n && !(await eventiCaricati(p, n))) err('gli eventi dell\'archivio non arrivano'); await pausa(400); };
    const tocca = async (sel, dove, facoltativo) => {
      const l = p.locator(sel).first();
      if (!(await l.count())) { if (!facoltativo) err(`${dove}: non trovo ${sel}`); return false; }
      try { await l.click({ timeout: 5000 }); } catch (x) { try { await l.dispatchEvent('click'); } catch (y) { err(`${dove}: non riesco a toccare ${sel}`); return false; } }
      await pausa(350); return true;
    };
    return { avvia, tocca, conta: () => p.evaluate(inventario) };
  };
  /* i controlli comuni a ogni inventario: che cosa non deve esserci mai */
  const maiNiente = (dove, inv, ammesse) => {
    const fuori = Object.keys(inv.mem).filter(k => !ammesse.includes(k));
    if (fuori.length) err(`${dove}: nella memoria del browser ci sono chiavi fuori elenco: ${fuori.join(', ')}`);
    const scheda = inv.ses.filter(k => k !== SEME);
    if (scheda.length) err(`${dove}: l'app usa la memoria della scheda: ${scheda.join(', ')}`);
    if (inv.cookie) err(`${dove}: l'app ha scritto un cookie`);
    if (inv.basi.length) err(`${dove}: l'app ha creato una base di dati nel browser: ${inv.basi.join(', ')}`);
    const casse = Object.keys(inv.casse).filter(n => !FILE.includes(n));
    if (casse.length) err(`${dove}: nella memoria per i file ci sono voci fuori elenco: ${casse.join(', ')}`);
    for (const n of FILE) { const fuoriPosto = (inv.casse[n] || []).filter(f => !DENTRO[n] || !DENTRO[n](f));
      if (fuoriPosto.length) err(`${dove}: nella memoria per i file «${n}» ci sono ${fuoriPosto.length} file che non sono suoi, per esempio ${fuoriPosto[0]}`); }
  };

  try {
    /* ---------- 1. un telefono con i dati di prima ---------- */
    {
      const g = giorno(1);
      const og = { id: 'prova-og-di-prima', personal: true, offgrid: true, title: 'Cena inventata di prima', datetime: g + 'T20:00', end: g + 'T22:00', lat: 45.071, lng: 7.688, address: 'Via Finta 3', hidden: false, price: '' };
      const prima = { agorapp_events: [og], agorapp_cal: { 'prova-og-di-prima': true }, agorapp_lang: 'en', agorapp_theme: 'dark', agorapp_layers: { musica: { on: true } },
        agorapp_city: 'venezia', agorapp_simple: '1', agorapp_day_mode: 'bici', agorapp_presets: { data: [null, { musica: { on: true } }, null], names: ['Mappa 1', 'Mappa 2', 'Mappa 3'] },
        agorapp_temi_slots: [{ nome: 'Lente inventata', k: ['s:musica'] }, null, null], agorapp_guida: '1' };
      const tolte = Object.fromEntries(M.TOLTE.filter(t => t.dove === 'memoria').map(t => [t.nome, { inventato: true }]));
      const altre = { altra_pagina: 'di un\'altra pagina dello stesso indirizzo', agorapp_sconosciuta: 'x' };
      const mancano = Object.keys(DI_PRIMA).filter(k => PUBBLICHE.includes(k) && !(DI_PRIMA[k] in prima));
      if (mancano.length) err('la prova del trasloco non semina tutte le chiavi di prima: ' + mancano.join(', '));
      const { browser, ctx } = await apri(pw, { ...prima, ...tolte, ...altre });
      try {
        const p = await ctx.newPage(); const { avvia, conta } = await strumenti(ctx, p);
        /* prima dell'app: una pagina dello stesso indirizzo che non è l'app, per preparare la memoria della scheda e dei file */
        await p.goto(s.url + 'licenze/index.html');
        await p.evaluate(async nomi => { for (const n of nomi) sessionStorage.setItem(n, '{"inventato":true}');
          for (const n of ['agorapp_archivio', 'altra_cassa']) await (await caches.open(n)).put('/vecchio-file-inventato.json', new Response('{}')); },
        M.TOLTE.filter(t => t.dove === 'sessione').map(t => t.nome));
        await avvia(0); await pausa(1500);
        const inv = await conta();
        for (const [nuova, vecchia] of Object.entries(DI_PRIMA)) {
          if (!(vecchia in prima)) continue;
          if (vecchia in inv.mem) err(`trasloco: il nome di prima «${vecchia}» resta sul telefono`);
          const atteso = typeof prima[vecchia] === 'string' ? prima[vecchia] : JSON.stringify(prima[vecchia]);
          if (inv.mem[nuova] !== atteso) err(`trasloco: «${nuova}» non contiene ciò che c'era in «${vecchia}» (${String(inv.mem[nuova]).slice(0, 60)})`);
        }
        for (const k of Object.keys(tolte)) if (k in inv.mem) err(`trasloco: la chiave della funzione tolta «${k}» resta sul telefono`);
        for (const [k, v] of Object.entries(altre)) if (inv.mem[k] !== v) err(`trasloco: la chiave «${k}», che non è dell'app, è stata toccata`);
        for (const t of M.TOLTE.filter(x => x.dove === 'sessione')) if (inv.ses.includes(t.nome)) err(`trasloco: «${t.nome}» resta nella memoria della scheda`);
        if ('agorapp_archivio' in inv.casse) err('trasloco: i file con il nome di prima («agorapp_archivio») restano sul telefono');
        if (!('altra_cassa' in inv.casse)) err('trasloco: sono stati cancellati file che non sono dell\'app');
        const stato = await p.evaluate(() => ({ lingua: window.AGR.lingua(), tema: document.documentElement.getAttribute('data-theme'), semplice: window.AGR.stato.semplice,
          mezzo: window.AGR.stato.cal.mezzo, og: window.AGR.eventi().map(x => x.id), salvato: window.AGR.salvati.has('prova-og-di-prima'), citta: (document.querySelector('[data-az="citta"]') || {}).textContent || '' }));
        if (stato.lingua !== 'en') err('trasloco: l\'app non riparte nella lingua scelta prima');
        if (stato.tema !== 'dark') err('trasloco: l\'app non riparte con il tema scelto prima');
        if (!stato.semplice) err('trasloco: l\'app non riparte in Modalità semplice');
        if (stato.mezzo !== 'bici') err('trasloco: l\'app non ricorda il mezzo della giornata');
        if (!stato.og.includes('prova-og-di-prima') || !stato.salvato) err('trasloco: l\'Off-Grid di prima non c\'è più, o non è nel calendario');
        if (!/venezia/i.test(stato.citta)) err('trasloco: l\'app non riparte dalla città scelta prima (' + stato.citta.trim().slice(0, 30) + ')');
        e.note.push('trasloco: ' + Object.keys(prima).length + ' chiavi di prima passate ai nomi nuovi; ' + (Object.keys(tolte).length + 1) + ' chiavi di funzioni tolte e i file di prima cancellati; le chiavi e i file di altre pagine intatti');
      } finally { await browser.close(); }
    }

    /* ---------- 2 e 3. un telefono nuovo: il giro completo, poi l'uso senza tracce ---------- */
    {
      const { browser, ctx } = await apri(pw, {});
      try {
        const p = await ctx.newPage(); const { avvia, tocca, conta } = await strumenti(ctx, p);
        await avvia(); await pausa(700);
        const subito = await conta();
        if (Object.keys(subito.mem).length) err('telefono nuovo: all\'apertura, prima di ogni scelta, l\'app ha già scritto: ' + Object.keys(subito.mem).join(', '));
        /* la guida */
        if (!(await tocca('[data-az="guida-salta"]', 'guida'))) err('telefono nuovo: la guida non compare');
        /* l'avviso delle novità, che compare chiusa la guida */
        if (!(await tocca('[data-az="novita-ok"]', 'avviso delle novità'))) err('telefono nuovo: l\'avviso delle novità non compare');
        /* strati e combinazioni */
        if (await tocca('[data-az="strati"]', 'strati')) { await tocca(F + '[data-az="tutti-strati"]', 'strati, tutti'); await tocca(F + '[data-az="salva-preset"]', 'strati, salva la combinazione'); }
        /* un evento della città: scheda, calendario */
        await avvia();
        if (await tocca('[data-az="elenco"]', 'elenco') && await tocca(F + '[data-ev]', 'scheda')) await tocca(F + '[data-salva]', 'scheda, salva nel calendario');
        /* un Off-Grid nuovo, con la ricerca dell'indirizzo */
        await avvia();
        for (const [titolo, ora] of [['Colazione inventata', '10:00'], ['Cena inventata', '20:00']]) {   // due appuntamenti domani: la giornata ha un percorso
          if (!(await tocca('[data-az="nuovo"]', 'Off-Grid nuovo'))) break;
          await tocca(F + '[data-fgiorno="' + giorno(1) + '"]', 'Off-Grid nuovo, domani');
          await p.locator('#f-titolo').fill(titolo); await p.locator('#f-inizio').fill(ora);
          await p.locator('#f-indirizzo').fill('Via Inventata 5, Torino'); await pausa(1200);
          await tocca('#f-sugg [data-si="0"]', 'Off-Grid nuovo, indirizzo');
          await tocca(F + '[data-salva-form="una"]', 'Off-Grid nuovo, salva'); await pausa(500);
          await avvia();
        }
        if ((await p.evaluate(() => window.AGR.eventi().length)) !== 2) err('telefono nuovo: i due Off-Grid non si sono salvati, il giro non è completo');
        /* calendario: mezzo della giornata, PDF */
        if (await tocca('[data-az="calendario"]', 'calendario')) {
          await p.evaluate(g => { window.AGR.stato.cal.giorno = g; }, giorno(1));
          await tocca(F + '[data-vista="giornata"]', 'calendario, giornata'); await tocca(F + '[data-mezzo="bici"]', 'calendario, mezzo');
          if (await tocca(F + '[data-az="pdf"]', 'calendario, PDF')) { const scarico = p.waitForEvent('download', { timeout: 20000 }).catch(() => null);
            if (await tocca(F + '[data-az="scarica-pdf"]', 'calendario, scarica il PDF') && !(await scarico)) err('telefono nuovo: il PDF non si scarica, il giro non è completo'); }
        }
        /* ricerca di eventi e di indirizzi */
        await avvia();
        if (await tocca('[data-az="cerca"]', 'cerca')) { await p.locator('#q').fill('Via Inventata 5'); await pausa(1200); await tocca('#risultati-luoghi [data-si="0"]', 'cerca, luogo', true); }
        /* città: un'altra, e ritorno */
        await avvia();
        if (await tocca('[data-az="citta"]', 'città')) await tocca(F + '[data-citta="venezia"]', 'città, Venezia');
        if (await tocca('[data-az="citta"]', 'città')) await tocca(F + '[data-citta="torino"]', 'città, Torino');
        /* impostazioni: tema, lingua, Modalità semplice, testi legali */
        await avvia(0);
        if (await tocca('[data-az="impostazioni"]', 'impostazioni')) {
          await tocca(F + '[data-tema-set="dark"]', 'impostazioni, tema'); await tocca(F + '[data-lingua="en"]', 'impostazioni, lingua'); await tocca(F + '[data-lingua="it"]', 'impostazioni, lingua');
          await tocca(F + '[data-az="semplice"]', 'impostazioni, Modalità semplice'); await tocca(F + '[data-az="semplice"]', 'impostazioni, Modalità semplice');
          await tocca(F + '[data-legale="storage"]', 'impostazioni, Dati locali');
        }
        /* Temi: una lente salvata */
        await avvia(0);
        if (await tocca('[data-sez="temi"]', 'Temi')) { await pausa(500);
          if (await tocca('[data-scegli]', 'Temi, scelta') && await tocca('[data-tz="mostra"]', 'Temi, mostra') && await tocca('[data-tz="salva"]', 'Temi, salva la lente')) { await p.locator('#tz-nome').fill('Lente inventata').catch(() => {}); await tocca('[data-tz="salva-ok"]', 'Temi, conferma'); } }
        /* Agorà e Progetti (Demo) */
        for (const sez of ['agora', 'progetti']) { await avvia(0); if (await tocca('[data-sez="' + sez + '"]', sez)) await pausa(1200); }
        await avvia(0); await pausa(1200);

        const dopo = await conta();
        maiNiente('dopo il giro completo', dopo, PUBBLICHE);
        const nonToccate = PUBBLICHE.filter(k => !(k in dopo.mem));
        if (nonToccate.length) err('il giro non è completo: non ha fatto scrivere ' + nonToccate.join(', '));
        const red = REDAZIONE.filter(k => k in dopo.mem);
        if (red.length) err('senza entrare nell\'area riservata sul telefono ci sono chiavi della Redazione: ' + red.join(', '));
        if (!(dopo.casse.dl_archivio || []).some(f => /indice\.json$/.test(f))) err('dopo il giro completo: nella memoria per i file manca l\'indice dell\'archivio');
        if ((dopo.casse.dl_mappa || []).length < 4) err('dopo il giro completo: nella memoria per i file mancano i tasselli della mappa guardata');
        const vuote = NEL_GIRO.filter(n => !(dopo.casse[n] || []).length);
        if (vuote.length) err('il giro non è completo: non ha riempito ' + vuote.join(', '));
        e.note.push('dopo un giro completo, nella memoria del browser: ' + Object.keys(dopo.mem).sort().join(', '));
        e.note.push('nella memoria per i file: ' + Object.entries(dopo.casse).map(([n, f]) => `${n} (${f.length} file)`).join(', ') + '; nessun cookie, nessuna base di dati, niente nella memoria della scheda');

        /* ---------- 3. usare l'app non lascia tracce ---------- */
        const primaUso = JSON.stringify(dopo.mem);
        for (let i = 0; i < 3; i++) { await avvia(); }
        /* la mappa va a Milano e torna: il telefono scarica gli eventi di un'altra zona, ma non annota dove si è andati */
        const file0 = (dopo.casse.dl_archivio || []).length;
        const zone0 = await p.evaluate(() => window.AGR.archivio().conservati.length);
        if (!(await p.evaluate(() => { if (!window.__mappaProva) return false; window.__mappaProva.jumpTo({ center: [9.19, 45.4642], zoom: 13.3 }); return true; }))) err('dopo l\'uso: la prova non riesce a spostare la mappa');
        try { await p.waitForFunction(n => window.AGR.archivio().conservati.length > n, zone0, { timeout: 15000 }); } catch (x) { err('dopo l\'uso: a Milano gli eventi della zona non arrivano'); }
        await p.evaluate(() => window.__mappaProva.jumpTo({ center: [7.6869, 45.0703], zoom: 13.3 })); await pausa(1200);
        if (await tocca('[data-az="elenco"]', 'elenco') && await tocca(F + '[data-ev]', 'scheda')) await pausa(300);
        await avvia();
        if (await tocca('[data-az="cerca"]', 'cerca')) { await p.locator('#q').fill('Concerto'); await pausa(900); await p.locator('#q').fill('Via Inventata 9'); await pausa(1200); await tocca('#risultati-luoghi [data-si="0"]', 'cerca, luogo', true); }
        await avvia();
        if (await tocca('[data-az="calendario"]', 'calendario')) await tocca(F + '[data-vista="mese"]', 'calendario, mese');
        await avvia(); await pausa(800);
        const dopoUso = await conta();
        maiNiente('dopo l\'uso', dopoUso, PUBBLICHE);
        if ((dopoUso.casse.dl_archivio || []).length <= file0) err('dopo l\'uso: gli eventi della zona di Milano non sono nella memoria per i file');
        if (JSON.stringify(dopoUso.mem) !== primaUso) {
          const diverse = Object.keys({ ...dopo.mem, ...dopoUso.mem }).filter(k => dopo.mem[k] !== dopoUso.mem[k]);
          err('usare l\'app (riaprirla, muovere la mappa, aprire schede, cercare) ha cambiato la memoria del browser: ' + diverse.join(', '));
        }
        e.note.push('tre riaperture, mappa portata a Milano e ritorno, schede aperte, ricerche di eventi e di indirizzi: la memoria del browser non cambia di un carattere');
      } finally { await browser.close(); }
    }

    /* ---------- 4. l'area riservata ---------- */
    {
      const pwAdmin = require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'sorgenti', 'parti', 'app1.js'), 'utf8').match(/ADMIN_PW = '([^']+)'/);
      if (!pwAdmin) e.note.push('area riservata: la password non è più nel codice; le chiavi della Redazione vanno provate nell\'app della redazione (blocco 8)');
      else {
        const { browser, ctx } = await apri(pw, { dl_guida: '1' });
        try {
          const p = await ctx.newPage(); const { avvia, tocca, conta } = await strumenti(ctx, p);
          await avvia();
          if (await tocca('[data-az="impostazioni"]', 'impostazioni') && await tocca(F + '[data-az="mostra-admin"]', 'accesso riservato')) {
            await p.locator('#adminpw').fill(pwAdmin[1]);
            if (await tocca(F + '[data-az="entra-admin"]', 'area riservata')) {
              await pausa(500);
              const inv = await conta();
              maiNiente('nell\'area riservata', inv, PUBBLICHE.concat(REDAZIONE));
              const mancanti = REDAZIONE.filter(k => !(k in inv.mem));
              if (mancanti.length) err('area riservata: entrando non compaiono le chiavi della Redazione ' + mancanti.join(', '));
              else e.note.push('entrando nell\'area riservata compaiono ' + REDAZIONE.join(' e ') + ', e nient\'altro');
            }
          }
        } finally { await browser.close(); }
      }
    }
  } finally { await s.chiudi(); }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
