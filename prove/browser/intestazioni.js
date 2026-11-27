/* Prova nel browser: le due app compattate funzionano con le intestazioni di sicurezza del modello (voce T-060; libro
   mastro, § 2.4, «Il codice»; § 3.11; documento: docs/montaggio.md).

   Il server di prova risponde con le intestazioni di sorgenti/intestazioni.json (tolta soltanto «upgrade-insecure-
   requests», perché il server di prova è http). Si usano le schermate principali delle due app, il PDF del calendario
   compreso, e la prova fallisce a ogni violazione della politica dei contenuti (Content-Security-Policy) o errore nella
   pagina. Dati inventati; nessuna richiesta esterna. */
'use strict';
const { esito, eseguiDaSola, config } = require('../comune.js');
const { playwright, server, apri, pausa, archivio, eventoProva } = require('./comune.js');
const { intestazioni } = require('../../sorgenti/controllo-uscita.js');

const EV = eventoProva('intestazioni', { titolo: 'Evento inventato per le intestazioni' });

async function prova() {
  const e = esito('App compattate con le intestazioni di sicurezza (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const cfg = config();
  const err = x => e.errori.push(x);
  const F = '#foglio-slot ';
  let viste = 0;

  for (const quale of ['pubblica', 'redazione']) {
    const s = await server(quale);
    const int = intestazioni(cfg, quale);
    int['Content-Security-Policy'] = int['Content-Security-Policy'].replace(/;\s*upgrade-insecure-requests/, '');
    const { browser, ctx } = await apri(pw, { dl_guida: '1', dl_strati: { musica: { on: true } } });
    try {
      await archivio(ctx, [EV]);
      /* ogni risposta del server di prova con le intestazioni del modello */
      await ctx.route(u => u.hostname === '127.0.0.1' && !u.pathname.startsWith('/prova/archivio/'), async r => {
        const res = await r.fetch();
        await r.fulfill({ response: res, headers: Object.assign({}, res.headers(), int) });
      });
      await ctx.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', v => window.__csp.push(v.effectiveDirective + ' ' + (v.blockedURI || '') + ' ' + (v.sourceFile || '').split('/').pop() + ':' + v.lineNumber)); });
      const p = await ctx.newPage();
      p.on('pageerror', x => err(`${quale}: errore nella pagina: ${x.message}`));
      const tocca = async sel => { const l = p.locator(sel).first(); if (!(await l.count())) return false; try { await l.click({ timeout: 5000 }); } catch (x) { return false; } await pausa(400); viste++; return true; };
      const r = await p.goto(s.url + 'index.html');
      if (!r || !(r.headers()['content-security-policy'] || '').includes("script-src 'self'")) err(quale + ': il server di prova non ha dato le intestazioni');
      await p.waitForSelector('[data-az="elenco"]');
      await p.waitForFunction(() => window.AGR && window.AGR.archivio && window.AGR.archivio().pubblici >= 1, null, { timeout: 20000 }).catch(() => {});
      await pausa(1500);   // la mappa e i suoi lavoratori
      if (await tocca('#btnElenco')) { await tocca(`${F}[data-ev="${EV.id}"]`); await tocca(`${F}[data-salva="${EV.id}"]`); await p.keyboard.press('Escape'); await pausa(200); }
      if (await tocca('#btnCal')) {
        /* il PDF del calendario (jsPDF) */
        if (await tocca(`${F}[data-az="pdf"]`) || await tocca(`${F}[data-az*="pdf"]`)) {
          const scarico = p.waitForEvent('download', { timeout: 8000 }).catch(() => null);
          await tocca(`${F}[data-az="scarica-pdf"]`) || await tocca(`${F}.tasto.pri`);
          await scarico;
        }
        await p.keyboard.press('Escape'); await pausa(200); await p.keyboard.press('Escape'); await pausa(200);
      }
      for (const c of ['#btnImpo', '#btnLegali', '#btnCerca']) { await tocca(c); await p.keyboard.press('Escape'); await pausa(200); }
      for (const sez of ['agora', 'progetti', 'temi', 'mappa']) await tocca(`#navBassa [data-sez="${sez}"]`);
      if (quale === 'redazione' && await tocca('#badgeRed')) {
        for (const az of ['chiavi', 'pubblica', 'misure', 'storico']) { const b = p.locator(`${F}[data-az*="${az}"]`).first(); if (await b.count()) { await b.click().catch(() => {}); await pausa(400); viste++; } }
      }
      const v = await p.evaluate(() => window.__csp || []);
      for (const x of [...new Set(v)]) err(`${quale}: violazione della politica dei contenuti: ${x}`);
    } finally { await browser.close(); await s.chiudi(); }
  }
  e.note.push(`schermate e azioni provate con le intestazioni: ${viste}; app compattate`);
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
