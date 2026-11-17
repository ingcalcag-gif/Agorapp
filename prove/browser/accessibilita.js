/* Prova nel browser: controllo automatico dell'accessibilità delle schermate principali (voce T-005;
   libro mastro § 11.1, verifica tecnica con uno strumento automatico; allegato A, A.7).

   Lo strumento è axe-core, libero (licenza MPL 2.0), usato solo nelle prove e mai consegnato con l'app.
   Si controllano le regole WCAG 2.1 di livello A e AA: contrasti, etichette, struttura della pagina.
   Ogni violazione di oggi è uno scarto noto, contato per schermata e per regola, che i blocchi 2-16
   (soprattutto T-057, T-058, T-059) chiudono; una violazione nuova fa fallire la prova. Il controllo
   automatico non basta da solo: le prove con tastiera, testo ingrandito e lettore di schermo restano (T-059). */
'use strict';
const fs = require('fs');
const { esito, eseguiDaSola, confronta } = require('../comune.js');
const { playwright, server, apri, pausa } = require('./comune.js');
const { eventi } = require('./ostili.js');   // gli stessi eventi inventati, senza testi ostili

const REGOLE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];


async function prova() {
  const e = esito('Accessibilità delle schermate principali (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  const s = await server('pubblica');
  const { browser, ctx } = await apri(pw, { agorapp_guida: '1', agorapp_layers: { musica: { on: true } }, agorapp_events: eventi(false),
    agorapp_cal: { 'prova-ostile-1': true, 'prova-ostile-og': true } });
  const trovati = [];
  try {
    const p = await ctx.newPage();
    const analizza = async schermata => {
      await p.addScriptTag({ content: axe });
      const r = await p.evaluate(async regole => {
        const x = await window.axe.run(document, { runOnly: { type: 'tag', values: regole }, resultTypes: ['violations'] });
        return x.violations.map(v => ({ id: v.id, impatto: v.impact, nodi: v.nodes.map(n => n.target.join(' ')) }));
      }, REGOLE);
      for (const v of r) for (const n of v.nodi) trovati.push({ chiave: v.id, dove: schermata, dettaglio: `${v.impatto}: ${n}` });
    };
    const avvia = async () => { await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(500); };
    const tocca = async (sel, schermata) => {
      const l = p.locator(sel).first();
      if (!(await l.count())) { e.errori.push(`${schermata}: non trovo ${sel}`); return false; }
      await l.click(); await pausa(500); return true;
    };
    await avvia(); await analizza('mappa');
    if (await tocca('[data-az="elenco"]', 'elenco')) {
      await analizza('elenco');
      if (await tocca('[data-ev="prova-ostile-1"]', 'scheda evento')) await analizza('scheda evento');
    }
    await avvia(); if (await tocca('[data-az="calendario"]', 'calendario')) await analizza('calendario');
    await avvia(); if (await tocca('[data-az="cerca"]', 'cerca')) await analizza('cerca');
    await avvia(); if (await tocca('[data-az="impostazioni"]', 'impostazioni')) await analizza('impostazioni');
  } finally {
    await browser.close(); await s.chiudi();
  }
  confronta(e, 'accessibilita', trovati);
  e.note.push('schermate: mappa, elenco, scheda evento, calendario, cerca, impostazioni; regole ' + REGOLE.join(', '));
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
