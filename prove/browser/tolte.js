/* Prova nel browser: le funzioni tolte nel blocco 2 del piano di adeguamento non lasciano tracce
   (criterio d'ordine 6: pulizia completa e subito; libro mastro, § 1.3, regola 2, e § 3.7).
   - T-010: niente pulsanti volontari in Città, Agorà e Progetti; nessuna richiesta a /api/; la chiave
     agorapp_interesse, se il telefono l'aveva, sparisce all'avvio.
   Dati inventati; ogni richiesta verso l'esterno è bloccata. */
'use strict';
const { esito, eseguiDaSola } = require('../comune.js');
const { playwright, server, apri, pausa } = require('./comune.js');

/* Chiavi delle funzioni tolte, con un valore inventato: all'avvio l'app le deve cancellare senza leggerle. */
const CHIAVI_TOLTE = { agorapp_interesse: { agora: '2026-10-10', citta: 'Comune inventato (XX)' } };

async function prova() {
  const e = esito('Funzioni tolte senza tracce (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const s = await server('pubblica');
  const { browser, ctx } = await apri(pw, Object.assign({ agorapp_guida: '1' }, CHIAVI_TOLTE));
  const api = [];
  ctx.on('request', r => { const u = new URL(r.url()); if (u.pathname.startsWith('/api/')) api.push(u.pathname); });
  try {
    const p = await ctx.newPage();
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="citta"]'); await pausa(500);
    const rimaste = await p.evaluate(k => k.filter(x => localStorage.getItem(x) != null), Object.keys(CHIAVI_TOLTE));
    if (rimaste.length) e.errori.push('chiavi di funzioni tolte ancora nella memoria del telefono dopo l\'avvio: ' + rimaste.join(', '));
    const viste = [['Città', async () => { await p.click('[data-az="citta"]'); }],
      ['Agorà', async () => { await p.click('button[data-sez="agora"]'); }],
      ['Progetti', async () => { await p.click('button[data-sez="progetti"]'); }]];
    for (const [nome, vai] of viste) {
      await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="citta"]'); await pausa(300);
      await vai(); await pausa(500);
      const n = await p.locator('[data-interesse], [data-int-box], #int-citta-q').count();
      if (n) e.errori.push(nome + ': ' + n + ' elementi dei pulsanti volontari');
      const testo = await p.evaluate(() => document.body.innerText);
      for (const t of ['Mi interessa', 'Ti interessa?', 'La tua città non c’è?']) if (testo.includes(t)) e.errori.push(nome + ': compare ancora «' + t + '»');
    }
  } finally {
    await browser.close(); await s.chiudi();
  }
  if (api.length) e.errori.push('richieste a ' + [...new Set(api)].join(', '));
  e.note.push('viste: Città, Agorà, Progetti; chiavi tolte controllate: ' + Object.keys(CHIAVI_TOLTE).join(', '));
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
