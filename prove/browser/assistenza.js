/* Prova nel browser: «Esporta per assistenza» (voce T-049; libro mastro § 2.6; decisione del 26/11/2026, n. 16).

   Con lo sportello di prova e 12 eventi inventati serviti dalla prova (eventoProva: 11 di musica, uno d'arte, tutti a
   Torino nello stesso mese), portati con «Porta qui gli eventi inventati»; uno ha la descrizione approvata con
   «Persona di prova». La voce è isolata: con un no nella revisione finale del libro mastro questa prova si toglie
   insieme a sorgenti/redazione/esporta-assistenza.js.

   1. Si scelgono al massimo 10 eventi; l'undicesimo non entra.
   2. L'anteprima non contiene nessun testo degli eventi (titolo, descrizione, luogo, indirizzo, fonte, prezzo,
      organizzatore), nessun identificativo, nessun recapito, nessun nome scritto per le persone: soltanto strato, città,
      mese ed eventuali Persona_1…; ogni evento scelto o parte o è detto «non parte».
   3. Parte solo un evento con almeno 5 eventi pubblicati della stessa città, mese e strato (regola dei cinque): quelli
      di musica partono, quello d'arte no; l'evento con il nome dice soltanto «Persona_1».
   4. Il file esportato è esattamente l'anteprima.
   Un titolo ostile resta testo nell'elenco e nella tabella di corrispondenza (T-024). */
'use strict';
const fs = require('fs');
const path = require('path');
const { esito, eseguiDaSola, RADICE } = require('../comune.js');
const { playwright, server, apri, pausa, archivio, eventoProva } = require('./comune.js');

const FRASE = 'una frase inventata per la prova';
const CHIAVI_AMMESSE = ['evento', 'strato', 'citta', 'mese', 'persone'];

const DESC = 'Persona di prova racconta il laboratorio di quartiere. Ingresso libero; informazioni a prova@esempio.invalid.';
/* un titolo ostile (T-024): nell'elenco e nella tabella di corrispondenza deve restare testo */
const OSTILE = '<img src=x data-ostile="assistenza" onerror="window.__ostile=1">';
const EVENTI = Array.from({ length: 11 }, (_, i) => eventoProva('assmus' + 'abcdefghijk'[i], i === 3 ? { descrizione: DESC } : i === 0 ? { titolo: 'Evento inventato ' + OSTILE } : {})).concat([eventoProva('assarte', { strato: 'arte' })]);

async function prova() {
  const e = esito('Esporta per assistenza: copia senza nomi, regola dei cinque (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const err = x => e.errori.push(x);
  const F = '#foglio-slot ';
  const s = await server('redazione'), { browser, ctx } = await apri(pw, { dl_guida: '1' });
  try {
    await archivio(ctx, EVENTI);
    const p = await ctx.newPage();
    p.on('pageerror', y => err('errore nella pagina: ' + y.message));
    const tocca = async (sel, dove) => { const l = p.locator(sel).first();
      /* l'elemento può arrivare dopo una lettura dello sportello: si aspetta, anche con più prove insieme */
      try { await l.waitFor({ timeout: 20000 }); } catch (x) { err(`${dove}: non trovo ${sel}`); return false; }
      try { await l.click({ timeout: 15000 }); } catch (x) { err(`${dove}: non riesco a toccare ${sel}`); return false; } await pausa(300); return true; };
    const aspetta = async (re, dove) => { try { await p.waitForFunction(r => new RegExp(r, 'i').test((document.querySelector('#foglio-slot') || {}).innerText || ''), re.source, { timeout: 30000 }); return true; }
      catch (x) { err(dove + ': atteso «' + re.source + '», letto «' + ((await p.locator(F).innerText().catch(() => '')) || '').replace(/\s+/g, ' ').slice(-500) + '»'); return false; } };

    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(400);
    if (!(await tocca('#badgeRed', 'strumenti')) || !(await tocca(F + '[data-az="chiavi"]', 'chiavi'))) return e;
    await pausa(400); await p.fill('#ch-nome', 'Portatile di prova'); await p.fill('#ch-frase', FRASE); await p.fill('#ch-ripeti', FRASE);
    await tocca(F + '[data-az="chiavi-crea"]', 'chiavi, crea');
    try { await p.waitForSelector(F + '[data-az="chiavi-copia"]', { timeout: 20000 }); } catch (x) { err('le chiavi non si creano'); return e; }
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(300);
    if (!(await tocca('#badgeRed', 'strumenti')) || !(await tocca(F + '[data-az="pubblica"]', 'pubblicazione'))) return e;
    await tocca(F + '[data-az="pb-consegna"]', 'consegna delle chiavi'); await aspetta(/Pubblicati · 0/, 'elenco vuoto');
    await tocca(F + '[data-az="pb-venti"]', 'porta qui gli eventi inventati'); await aspetta(/Portati \d+ eventi inventati/, 'eventi inventati');
    await p.evaluate(() => window.AGR.chiudi()); await pausa(250); await tocca('#badgeRed', 'strumenti');
    if (!(await tocca(F + '[data-az="pa"]', 'esporta per assistenza'))) return e;
    if (!(await aspetta(/Gli eventi del guasto · 0\/10/, 'elenco degli eventi'))) return e;

    /* 1 */
    const righe = p.locator(F + '[data-pae]'), n = await righe.count();
    for (let i = 0; i < Math.min(n, 11); i++) { await righe.nth(i).click(); await pausa(120); }
    if (n >= 11 && !(await aspetta(/Al massimo 10 eventi[\s\S]*· 10\/10/, 'limite di 10 eventi'))) return e;
    await p.fill('#pa-nomi', 'Persona di prova'); await tocca(F + '[data-az="pa-anteprima"]', 'prepara l\'anteprima');
    await pausa(300);

    const ostili = await p.evaluate(() => document.querySelectorAll('[data-ostile]').length + (window.__ostile ? 1 : 0));
    if (ostili) err('un titolo ostile è diventato codice nella pagina (elenco o tabella di corrispondenza)');
    /* 2 */
    const vista = await p.locator(F).innerText(), pre = (await p.locator(F + '.pa-anteprima').textContent().catch(() => '')) || '';
    const ev = EVENTI, testi = ev.flatMap(x => [x.titolo, x.descrizione, x.luogo, x.indirizzo, x.descrizione_luogo, x.organizzatore, x.prezzo, (x.fonte || {}).testo, (x.fonte || {}).collegamento, x.id].filter(t => t && String(t).length > 3));
    const dentro = testi.filter(t => pre.includes(t));
    if (dentro.length) err('anteprima: contiene testi degli eventi: ' + dentro.slice(0, 3).join(' · '));
    if (/@|Persona di prova|T\d{2}:\d{2}/.test(pre)) err('anteprima: niente recapiti, nomi scritti per le persone o ore: ' + pre.slice(0, 300));
    const nonParte = (vista.match(/non parte: nell’archivio ci sono/g) || []).length;
    let copia = null;
    if (pre) {
      try { copia = JSON.parse(pre); } catch (x) { err('anteprima: deve essere il file JSON che parte: ' + pre.slice(0, 200)); }
      if (copia) {
        if (copia.tipo !== 'copia-per-assistenza' || !Array.isArray(copia.eventi)) err('anteprima: forma del file: ' + pre.slice(0, 200));
        for (const x of copia.eventi || []) if (Object.keys(x).some(k => !CHIAVI_AMMESSE.includes(k)) || !/^Evento_\d+$/.test(x.evento) || !/^\d{4}-\d{2}$/.test(x.mese)) err('anteprima: un evento con dati non ammessi: ' + JSON.stringify(x));
        /* 3 */
        for (const x of copia.eventi || []) {
          const simili = ev.filter(y => y.strato === x.strato && String(y.inizio).slice(0, 7) === x.mese).length;
          if (simili < 5) err('regola dei cinque: ' + x.evento + ' è partito con meno di 5 eventi dello stesso strato e mese');
        }
      }
    }
    if ((copia ? copia.eventi.length : 0) + nonParte !== 10) err('ogni evento scelto deve partire o essere detto «non parte»: partiti ' + (copia ? copia.eventi.length : 0) + ', non partiti ' + nonParte);
    if (!copia || copia.eventi.length < 9 || copia.eventi.some(x => x.strato !== 'musica' || x.citta !== 'Torino') || nonParte > 1) err('regola dei cinque: i 9 o 10 eventi di musica scelti devono partire, quello d\'arte no: ' + pre.slice(0, 300));
    if (copia && copia.eventi.some(x => x.persone && JSON.stringify(x.persone) !== '["Persona_1"]')) err('le persone si dicono soltanto come Persona_1: ' + pre.slice(0, 300));

    /* 4 */
    if (copia && copia.eventi.length) {
      try {
        const [d] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), p.locator(F + '[data-az="pa-esporta"]').first().click()]);
        const t = fs.readFileSync(await d.path(), 'utf8');
        if (t !== pre || !/^assistenza-\d{4}-\d{2}-\d{2}\.json$/.test(d.suggestedFilename())) err('il file esportato deve essere esattamente l\'anteprima: ' + d.suggestedFilename());
      } catch (x) { err('esporta: il file non si scarica (' + x.message + ')'); }
    } else if (!(await p.locator(F + '[data-az="pa-esporta"][disabled]').count())) err('senza eventi che partono «Esporta la copia» deve restare spento');
    e.note.push(`10 eventi scelti su ${n}: ${copia ? copia.eventi.length : 0} partono, ${nonParte} no (regola dei cinque)`);
  } finally { await browser.close(); await s.chiudi(); }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
