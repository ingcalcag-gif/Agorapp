/* Prova nel browser: controllo automatico dell'accessibilità delle schermate principali (voce T-005;
   libro mastro § 11.1, verifica tecnica con uno strumento automatico; allegato A, A.7).

   Lo strumento è axe-core, libero (licenza MPL 2.0), usato solo nelle prove e mai consegnato con l'app.
   Si controllano le regole WCAG 2.1 di livello A e AA: contrasti, etichette, struttura della pagina.
   Dal blocco 16 (T-057) nessuna violazione è ammessa: una violazione nuova fa fallire la prova. Il controllo
   automatico non basta da solo: tastiera, preferenze del telefono, misure e testo ingrandito li prova
   prove/browser/accessibilita-uso.js (T-057-T-059); il lettore di schermo del telefono resta una prova a mano. */
'use strict';
const fs = require('fs');
const { esito, eseguiDaSola, confronta } = require('../comune.js');
const { playwright, server, apri, pausa, archivio, eventiCaricati } = require('./comune.js');
const { pubblici, offgrid, ID_EV, ID_OG } = require('./ostili.js');   // gli stessi eventi inventati, senza testi ostili

const REGOLE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];


async function prova() {
  const e = esito('Accessibilità delle schermate principali (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  const s = await server('pubblica');
  const { browser, ctx } = await apri(pw, { dl_guida: '1', dl_strati: { musica: { on: true } }, dl_eventi: offgrid(false),
    dl_calendario: { [ID_EV]: true, [ID_OG]: true } });
  // Evento senza collegamento della fonte: così la scheda resta senza collegamenti, come capita a molti eventi (la regione
  // scorrevole deve restare raggiungibile con la tastiera anche così).
  await archivio(ctx, pubblici(false).map(x => ({ ...x, fonte: { testo: x.fonte.testo } })));
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
    const avvia = async () => { await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await eventiCaricati(p); await pausa(500); };
    const tocca = async (sel, schermata) => {
      const l = p.locator(sel).first();
      if (!(await l.count())) { e.errori.push(`${schermata}: non trovo ${sel}`); return false; }
      await l.click(); await pausa(500); return true;
    };
    await avvia(); await analizza('mappa');
    if (await tocca('[data-az="elenco"]', 'elenco')) {
      await analizza('elenco');
      if (await tocca('#foglio-slot [data-ev="' + ID_EV + '"]', 'scheda evento')) {
        await analizza('scheda evento');
        /* il modulo «Segnala» (T-050), anche con gli errori in vista (il messaggio di posta non parte senza motivo) */
        if (await tocca('#foglio-slot [data-az="segnala"]', 'segnala')) {
          await p.waitForSelector('#foglio-slot #s-posta, #foglio-slot [data-az="segnala-invia"]', { timeout: 15000 }).catch(() => {});
          await analizza('segnala');
          if (await tocca('#foglio-slot #s-posta', 'segnala, errori')) await analizza('segnala, errori');
        }
      }
    }
    await avvia(); if (await tocca('[data-az="calendario"]', 'calendario')) await analizza('calendario');
    await avvia(); if (await tocca('[data-az="cerca"]', 'cerca')) await analizza('cerca');
    await avvia(); if (await tocca('[data-az="impostazioni"]', 'impostazioni')) await analizza('impostazioni');
    /* le sezioni, con i contenuti d'esempio (T-057: struttura con un solo contenuto principale) */
    for (const sez of ['agora', 'progetti', 'temi']) { await avvia(); if (await tocca(`#navBassa [data-sez="${sez}"]`, sez)) { await pausa(500); await analizza(sez); } }
  } finally {
    await browser.close(); await s.chiudi();
  }
  confronta(e, 'accessibilita', trovati);
  e.note.push('schermate: mappa, elenco, scheda evento, modulo «Segnala» (anche con gli errori), calendario, cerca, impostazioni, Agorà, Progetti, Temi; regole ' + REGOLE.join(', '));
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
