/* Prova nel browser: l'app della redazione (voci T-033, T-034, T-035 e T-037 del piano di adeguamento).

   Apre dist/redazione/ con un archivio inventato (12 eventi a Torino, 3 a Venezia) e con Misure inventate, e controlla:
   1. l'app si apre con gli strumenti, senza password; chiede di non essere indicizzata; l'app pubblica non ha nulla
      di tutto questo;
   2. le chiavi: una frase corta è rifiutata; «Crea le chiavi» le crea; ricaricando la pagina restano; la copia di
      riserva è un file illeggibile, che non contiene la frase; le parti pubbliche si scaricano;
   3. un evento nuovo riceve l'identificativo con il marcatore; «Viene dal nostro archivio?» dice sì, e no se si
      cambia una lettera;
   4. le Misure contano gli eventi dell'archivio, non quelli del dispositivo; sotto i 5 casi il pannello scrive
      «meno di 5»; nel file esportato, sotto i 10 casi, «meno di 10»; le richieste di rimozione escono una per riga;
   5. lo storico registra le operazioni; la revoca toglie le chiavi dal dispositivo.
   Tutti i dati sono inventati; nessuna richiesta esce dal computer della prova. */
'use strict';
const fs = require('fs');
const path = require('path');
const { RADICE, esito, eseguiDaSola } = require('../comune.js');
const { playwright, server, apri, giorno, pausa, archivio, eventoProva, idProva, eventiCaricati } = require('./comune.js');
const CHIAVI = require('../../sorgenti/moduli/chiavi.js');

const FRASE = 'una frase inventata per la prova';
const RICERCA = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [7.6869, 45.0703] },
  properties: { country: 'Italia', city: 'Torino', postcode: '10100', street: 'Via Inventata', housenumber: '5', type: 'house' } }] };
/* 12 eventi a Torino e 3 a Venezia, nei prossimi giorni */
const LETTERE = 'abcdefghijklmnopqrstuvwxyz';
const EVENTI = Array.from({ length: 12 }, (_, i) => eventoProva('torino' + LETTERE[i], { titolo: 'Evento inventato a Torino ' + (i + 1), lat: +(45.05 + i * 0.004).toFixed(4), lng: +(7.66 + i * 0.003).toFixed(4), inizio: giorno(1 + (i % 5)) + 'T18:00', fine: giorno(1 + (i % 5)) + 'T20:00', prezzo: i % 2 ? 'Gratuito' : '5 €' }))
  .concat(Array.from({ length: 3 }, (_, i) => eventoProva('venezia' + LETTERE[i], { titolo: 'Evento inventato a Venezia ' + (i + 1), indirizzo: 'Calle Inventata 2, Venezia', lat: +(45.438 + i * 0.002).toFixed(4), lng: 12.3358, inizio: giorno(2) + 'T21:00', fine: giorno(2) + 'T23:00' })));
/* Misure inventate, con numeri piccoli: un giro di prova con 8 persone, tre richieste di rimozione, due segnalazioni */
const MISURE = { v: 1, giri: [{ d: giorno(-2), titolo: 'Giro inventato', n: 8, scoperto: 3, andato: 6, guida: 3, og: 2, cons: 8 }],
  rimozioni: [1, 2, 3].map(i => ({ ric: giorno(-3) + 'T10:0' + i, eva: giorno(-3) + 'T15:0' + i })), segnalazioni: { [giorno(-1)]: 2 }, richieste: { [giorno(-1)]: 340 },
  giorni: { [giorno(-1)]: { tot: 3, citta: { torino: 3 }, strati: { musica: 3 }, prov: { nd: 3 }, imp: 0, grat: 1 } } };

async function prova() {
  const e = esito('App della redazione: strumenti, chiavi, marcatore, Misure (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const err = x => e.errori.push(x);
  const F = '#foglio-slot ';

  /* ---------- l'app pubblica: niente di tutto questo ---------- */
  {
    const s = await server('pubblica'), { browser, ctx } = await apri(pw, { dl_guida: '1' });
    try {
      const p = await ctx.newPage(); await archivio(ctx, EVENTI);
      await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(500);
      if (await p.locator('#badgeRed, #pagina-misure, #fileImporta, #fileRed').count()) err('app pubblica: nella pagina ci sono pezzi degli strumenti della Redazione');
      if (await p.locator('meta[name="robots"]').count()) err('app pubblica: chiede di non essere indicizzata');
      await p.click('[data-az="impostazioni"]'); await pausa(400);
      const testo = await p.locator(F).innerText();
      if (/admin|riservat|redazione/i.test(testo)) err('app pubblica: le Impostazioni nominano ancora un accesso riservato');
      if (await p.evaluate(() => !!(window.AGR_MODULI && window.AGR_MODULI.chiavi))) err('app pubblica: contiene il modulo delle chiavi');
    } finally { await browser.close(); await s.chiudi(); }
  }

  /* ---------- l'app della redazione ---------- */
  const s = await server('redazione'), { browser, ctx } = await apri(pw, { dl_guida: '1', red_misure: MISURE });
  try {
    await archivio(ctx, EVENTI);
    await ctx.route(u => u.hostname === 'photon.komoot.io', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(RICERCA) }));
    const p = await ctx.newPage();
    p.on('pageerror', x => err('errore nella pagina: ' + x.message));
    const avvia = async () => { await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await eventiCaricati(p, 1); await pausa(400); };
    const tocca = async (sel, dove) => { const l = p.locator(sel).first(); if (!(await l.count())) { err(`${dove}: non trovo ${sel}`); return false; }
      try { await l.click({ timeout: 15000 }); } catch (x) { err(`${dove}: non riesco a toccare ${sel}`); return false; } await pausa(350); return true; };
    const strumenti = async () => { await avvia(); return tocca('#badgeRed', 'strumenti'); };
    const scarica = async (sel, dove) => { try { const [d] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), p.locator(sel).first().click()]); return { nome: d.suggestedFilename(), dati: fs.readFileSync(await d.path()) }; } catch (x) { err(dove + ': il file non si scarica'); return null; } };

    /* 1 */
    await avvia();
    if (!/Redazione/.test(await p.title())) err('il titolo della pagina non dice che è l\'app della redazione');
    if (await p.locator('meta[name="robots"]').getAttribute('content') !== 'noindex, nofollow') err('la pagina non chiede di non essere indicizzata');
    if (!(await tocca('#badgeRed', 'strumenti'))) return e;
    if (!/Strumenti della redazione/.test(await p.locator(F + 'h2').innerText())) err('toccando «Redazione» non si aprono gli strumenti');
    if (await p.locator('input[type="password"]').count()) err('gli strumenti chiedono una password: l\'accesso non passa più da una password nel codice');
    await tocca(F + '[data-az="chiudi"]', 'strumenti, chiudi');
    if (await tocca('[data-az="impostazioni"]', 'impostazioni') && !(await p.locator(F + '[data-az="admin"]').count())) err('nelle Impostazioni manca la voce degli strumenti della redazione');

    /* 2 */
    if (await strumenti() && await tocca(F + '[data-az="chiavi"]', 'chiavi')) {
      await pausa(400);
      await p.fill('#ch-nome', 'Portatile di prova'); await p.fill('#ch-frase', 'corta'); await p.fill('#ch-ripeti', 'corta');
      await tocca(F + '[data-az="chiavi-crea"]', 'chiavi, frase corta'); await pausa(600);
      if (!/almeno 20 caratteri/.test(await p.locator(F + '.err').first().innerText().catch(() => ''))) err('chiavi: una frase corta deve essere rifiutata con il motivo');
      await p.fill('#ch-frase', FRASE); await p.fill('#ch-ripeti', FRASE + '!');
      await tocca(F + '[data-az="chiavi-crea"]', 'chiavi, frasi diverse'); await pausa(600);
      if (!/non sono uguali/.test(await p.locator(F + '.err').first().innerText().catch(() => ''))) err('chiavi: due frasi diverse devono essere rifiutate');
      await p.fill('#ch-ripeti', FRASE);
      await tocca(F + '[data-az="chiavi-crea"]', 'chiavi, crea');
      try { await p.waitForSelector(F + '[data-az="chiavi-copia"]', { timeout: 20000 }); } catch (x) { err('chiavi: «Crea le chiavi» non porta alla schermata delle chiavi'); }
      const riquadro = await p.locator(F + '.red-riquadro').first().innerText().catch(() => '');
      if (!/Portatile di prova/.test(riquadro) || !/([0-9a-f]{4} ){3}[0-9a-f]{4}/.test(riquadro)) err('chiavi: la schermata non mostra il dispositivo e le impronte');
      const copia = await scarica(F + '[data-az="chiavi-copia"]', 'copia di riserva');
      if (copia) {
        const t = copia.dati.toString('utf8'); let j = null; try { j = JSON.parse(t); } catch (x) { /* sotto */ }
        if (!j || j.tipo !== CHIAVI.TIPO_COPIA || !j.dati || j.dati.length < 200) err('copia di riserva: non è il file atteso');
        if (t.includes(FRASE) || /pkcs|PRIVATE|"firma"|"marcatore"/i.test(t)) err('copia di riserva: il file contiene qualcosa di leggibile');
        /* si apre soltanto con la frase: lo controlla il modulo, qui in Node */
        const D = () => { const m = new Map(); return { leggi: async k => m.get(k), scrivi: async (k, v) => { m.set(k, v); }, togli: async k => { m.delete(k); } }; };
        let aperta = false; try { await CHIAVI.crea({ deposito: D() }).daCopia(t, 'un’altra frase inventata, sbagliata', 'ripristina'); aperta = true; } catch (x) { /* giusto */ }
        if (aperta) err('copia di riserva: si apre con una frase sbagliata');
        try { await CHIAVI.crea({ deposito: D() }).daCopia(t, FRASE, 'ripristina'); } catch (x) { err('copia di riserva: con la frase giusta non si apre'); }
      }
      const pub = await scarica(F + '[data-az="chiavi-pubbliche-file"]', 'parti pubbliche');
      if (pub) { let j = null; try { j = JSON.parse(pub.dati.toString('utf8')); } catch (x) { /* sotto */ }
        if (!j || j.tipo !== CHIAVI.TIPO_PUBBLICHE || !j.firma || !j.firma.pubblica || !j.cifratura || Object.keys(j).some(k => !['tipo', 'v', 'dispositivo', 'creato', 'firma', 'cifratura'].includes(k))) err('parti pubbliche: il file non è quello atteso'); }
      /* ricaricando la pagina le chiavi restano */
      if (await strumenti() && !/Dispositivo: Portatile di prova/.test(await p.locator(F + '[data-az="chiavi"] .meta').innerText())) err('chiavi: ricaricando la pagina le chiavi non ci sono più');
    }

    /* 3 */
    let id = '';
    if (await tocca(F + '[data-az="admin-ongrid"]', 'modulo degli eventi')) {
      await p.fill('#a-titolo', 'Evento inventato della redazione'); await p.selectOption('#a-strato', 'musica'); await pausa(300);
      await p.selectOption('#a-sub', { index: 1 }); await p.fill('#a-desc', 'Una descrizione inventata, lunga quanto serve per la prova.');
      await p.fill('#a-dt', giorno(3) + 'T18:00'); await p.fill('#a-durata', '2 ore'); await p.fill('#a-prezzo', 'Gratuito');
      await p.fill('#a-indirizzo', 'Via Inventata 5, Torino'); await pausa(1300);
      await tocca('#a-sugg [data-si="0"]', 'modulo, suggerimento');
      await tocca(F + '[data-az="a-salva"]', 'modulo, salva'); await pausa(800);
      id = (await p.locator(F + '.red-id').first().innerText().catch(() => '')).trim();
      if (!CHIAVI.ID.test(id)) err('evento nuovo: dopo il salvataggio non compare un identificativo nella forma attesa («' + id + '»)');
      const conta = await p.evaluate(i => ({ locali: window.AGR.eventi().filter(x => !x.personal && !x.offgrid).map(x => x.id), sullaMappa: !!document.querySelector('[data-ev="' + i + '"]') }), id);
      if (conta.locali.join() !== id || conta.sullaMappa) err('evento nuovo: deve restare sul dispositivo, con il suo identificativo, e non andare sulla mappa');
    }
    if (id && await tocca(F + '[data-az="verifica"]', 'verifica')) {
      const chiedi = async t => { await p.fill('#ver-testo', t); await tocca(F + '[data-az="verifica-ok"]', 'verifica, controlla'); await pausa(500); return p.locator(F + '.red-riquadro b').first().innerText().catch(() => ''); };
      if (!/^Sì/.test(await chiedi(id))) err('«Viene dal nostro archivio?»: l\'identificativo appena creato non viene riconosciuto');
      const cambiato = id.slice(0, 5) + (id[5] === 'a' ? 'b' : 'a') + id.slice(6);
      if (!/^No/.test(await chiedi(cambiato))) err('«Viene dal nostro archivio?»: con una lettera cambiata deve dire di no');
      if (!/^No/.test(await chiedi(idProva('torinoa')))) err('«Viene dal nostro archivio?»: un identificativo fatto senza la chiave deve dare no');
      if (!/3 identificativi: 1 /.test(await chiedi('copiato: ' + id + ', ' + cambiato + ' e ' + idProva('veneziaa')))) err('«Viene dal nostro archivio?»: su un testo copiato i conti non tornano');
      if (!/Nessun identificativo/.test(await chiedi('un testo senza identificativi'))) err('«Viene dal nostro archivio?»: un testo senza identificativi deve dirlo');
    }

    /* 4 */
    if (await strumenti() && await tocca(F + '[data-az="admin-misure"]', 'Misure')) {
      try { await p.waitForFunction(() => /dall’archivio pubblicato: 15/.test((document.querySelector('.mz-archivio') || {}).textContent || ''), null, { timeout: 20000 }); }
      catch (x) { err('Misure: non leggono i 15 eventi dell\'archivio («' + (await p.locator('.mz-archivio').innerText().catch(() => '')) + '»)'); }
      if ((await p.locator('.mz-hero .mz-num').innerText().catch(() => '')).trim() !== '15') err('Misure: «Eventi attivi oggi» non conta gli eventi dell\'archivio');
      const piccoli = async dove => { const v = await p.evaluate(() => [...document.querySelectorAll('.mz-v, .mz-zv, td.n, .mz-num, .mz-fr b')].map(x => x.textContent.trim()).filter(t => /^[1-4]( su .*)?$/.test(t) || /^\d+ su [1-4]$/.test(t)));
        if (v.length) err(`Misure, ${dove}: valori sotto i 5 casi scritti per esteso (${v.slice(0, 4).join(' · ')})`); };
      await piccoli('panoramica');
      if (await tocca('.mz-schede [data-mz="scheda"][data-v="offerta"]', 'Misure, offerta')) {
        const citta = await p.evaluate(() => { const o = {}; const b = [...document.querySelectorAll('.mz-hbar')][0]; if (!b) return o; const n = b.querySelectorAll('.mz-nome'), v = b.querySelectorAll('.mz-v'); n.forEach((x, i) => { o[x.textContent.trim()] = v[i].textContent.trim(); }); return o; });
        if (citta.Torino !== '12') err('Misure: Torino deve contare 12 eventi dell\'archivio (trovato «' + citta.Torino + '»)');
        if (citta.Venezia !== 'meno di 5') err('Misure: i 3 eventi di Venezia devono comparire come «meno di 5» (trovato: ' + JSON.stringify(citta) + ')');
        await piccoli('offerta');
      }
      for (const v of ['rete', 'accessi', 'qualita']) if (await tocca('.mz-schede [data-mz="scheda"][data-v="' + v + '"]', 'Misure, ' + v)) await piccoli(v);
      if (await tocca('.mz-schede [data-mz="scheda"][data-v="impatto"]', 'Misure, impatto')) {
        const giro = await p.locator('.mz-fr b').allInnerTexts();
        if (giro.length && !giro.some(t => /meno di 5 su 8/.test(t))) err('Misure, impatto: «3 su 8» deve comparire come «meno di 5 su 8» (' + giro.join(' · ') + ')');
        await piccoli('impatto');
      }
      await tocca('.mz-schede [data-mz="scheda"][data-v="panoramica"]', 'Misure, panoramica');
      const xl = await scarica('[data-mz="esporta"]', 'esportazione delle Misure');
      if (xl) {
        const XLSX = require(path.join(RADICE, 'sorgenti', 'vendor', 'sheetjs-0.18.5', 'xlsx.full.min.js'));
        const wb = XLSX.read(xl.dati, { type: 'buffer' }), fogli = Object.fromEntries(wb.SheetNames.map(n => [n, XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true })]));
        if (!fogli.Rimozioni) err('esportazione: manca il foglio «Rimozioni»');
        for (const n of ['Giorni', 'Interviste']) {
          if (!fogli[n]) { err('esportazione: manca il foglio «' + n + '»'); continue; }
          for (const riga of fogli[n].slice(1)) riga.forEach((c, i) => { if (i > 0 && typeof c === 'number' && c > 0 && c < 10 && !(n === 'Interviste' && i === 7)) err(`esportazione, foglio «${n}»: un valore sotto i 10 casi è scritto per esteso (${c})`); });
        }
        /* le richieste di rimozione: una per riga, con ricevuta, evasa e ore (decisione del 22/11/2026) */
        const rim = (fogli.Rimozioni || []).slice(1);
        if (rim.length !== 3 || !rim.every(r => /T\d\d:\d\d/.test(String(r[0])) && /T\d\d:\d\d/.test(String(r[1])) && r[2] === 5)) err('esportazione: le tre richieste di rimozione devono uscire una per riga, con ricevuta, evasa e ore (' + JSON.stringify(rim).slice(0, 120) + ')');
        const giro = (fogli.Interviste || [])[1];
        if (!giro || giro[2] !== 'meno di 10') err('esportazione: un giro con 8 persone deve uscire come «meno di 10»');
      }
    }

    /* 5 */
    if (await strumenti() && await tocca(F + '[data-az="admin-storico"]', 'storico')) {
      await pausa(400);
      const voci = await p.locator('.sh-voce b').allInnerTexts();
      for (const v of ['Chiavi create', 'Copia di riserva delle chiavi scaricata', 'Evento creato', 'Misure esportate in Excel']) if (!voci.includes(v)) err('storico: manca «' + v + '» (' + voci.join(' · ') + ')');
    }
    if (await strumenti() && await tocca(F + '[data-az="chiavi"]', 'chiavi') && await tocca(F + '[data-az="chiavi-revoca"]', 'revoca')) {
      await tocca(F + '[data-az="chiavi-revoca-ok"]', 'revoca, conferma'); await pausa(800);
      if (!/revocate/.test(await p.locator(F + '.red-riquadro').first().innerText().catch(() => ''))) err('revoca: la schermata non dice che le chiavi sono revocate');
      const avviso = await scarica(F + '[data-az="chiavi-revoca-file"]', 'avviso di revoca');
      if (avviso) { let j = null; try { j = JSON.parse(avviso.dati.toString('utf8')); } catch (x) { /* sotto */ } if (!j || j.tipo !== CHIAVI.TIPO_REVOCA || !j.impronta) err('revoca: l\'avviso non è il file atteso'); }
      const resta = await p.evaluate(() => new Promise(ok => { const r = indexedDB.open('red_strumenti'); r.onsuccess = () => { const q = r.result.transaction('voci').objectStore('voci').get('red_chiavi'); q.onsuccess = () => { r.result.close(); ok(Object.keys(q.result || {})); }; }; }));
      if (resta.includes('chiavi') || resta.includes('copia')) err('revoca: sul dispositivo restano le chiavi o la loro copia (' + resta.join(', ') + ')');
      if (await strumenti() && await tocca(F + '[data-az="admin-ongrid"]', 'modulo degli eventi dopo la revoca')) {
        await p.fill('#a-titolo', 'Evento inventato senza chiavi'); await p.selectOption('#a-strato', 'musica'); await pausa(300); await p.selectOption('#a-sub', { index: 1 });
        await p.fill('#a-desc', 'Una descrizione inventata, lunga quanto serve per la prova.'); await p.fill('#a-dt', giorno(3) + 'T18:00'); await p.fill('#a-durata', '2 ore'); await p.fill('#a-prezzo', 'Gratuito');
        await p.fill('#a-indirizzo', 'Via Inventata 5, Torino'); await pausa(1300); await tocca('#a-sugg [data-si="0"]', 'modulo, suggerimento');
        await tocca(F + '[data-az="a-salva"]', 'modulo, salva senza chiavi'); await pausa(800);
        if (!/servono le chiavi/.test(await p.locator(F + '.err[role="alert"]').innerText().catch(() => ''))) err('senza chiavi un evento nuovo non si deve poter salvare, e l\'app deve dire perché');
      }
    }
    e.note.push('strumenti senza password; chiavi create, copia di riserva illeggibile senza la frase, parti pubbliche, revoca');
    e.note.push('evento nuovo con identificativo ' + (id ? 'marcato e riconosciuto; una lettera cambiata: no' : 'non creato'));
    e.note.push('Misure dai 15 eventi dell\'archivio inventato: Torino 12, Venezia «meno di 5»; nel file esportato i valori sotto 10 escono come «meno di 10»');
  } finally { await browser.close(); await s.chiudi(); }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
