#!/usr/bin/env node
/* Esegue le prove automatiche (voce T-005 del piano di adeguamento). Vedi prove/LEGGIMI.md.

     node prove/esegui.js              tutte le prove; quelle nel browser si saltano se Playwright manca
     node prove/esegui.js --statiche   solo le prove senza browser (le lancia npm run build a ogni montaggio)
     node prove/esegui.js --tutte      tutte, e fallisce se le prove nel browser non si possono eseguire
                                       (così le lancia GitHub Actions)
   Esce con 1 se una prova non è superata. */
'use strict';
const { stampa } = require('./comune.js');

const STATICHE = ['./sintassi.js', './uscite.js', './componenti.js', './nome.js', './indirizzi.js', './collegamenti.js', './chiavi.js', './parole.js', './anteprime.js', './eventi.js', './quadranti.js', './archivio.js', './testi.js'];
const BROWSER = ['./browser/ostili.js', './browser/richieste.js', './browser/tolte.js', './browser/anteprime.js', './browser/accessibilita.js', './browser/mappa.js', './browser/archivio.js', './browser/scheda.js'];

async function main() {
  const opz = new Set(process.argv.slice(2));
  const elenco = opz.has('--statiche') ? STATICHE : STATICHE.concat(BROWSER);
  let falliti = 0, saltate = 0;
  for (const f of elenco) {
    let e;
    try { e = await require(f).prova(); }
    catch (err) { e = { nome: f, errori: ['la prova si è interrotta: ' + (err && err.stack || err)], scarti: [], note: [] }; }
    if (e.saltata) {
      saltate++;
      if (opz.has('--tutte')) e.errori.push('prova nel browser non eseguita: con --tutte deve girare');
    }
    stampa(e);
    if (e.errori.length) falliti++;
  }
  console.log(falliti ? `\n${falliti} prove su ${elenco.length} non superate.` : `\nProve superate: ${elenco.length - saltate} su ${elenco.length}` + (saltate ? ` (${saltate} saltate: manca Playwright)` : '') + '.');
  process.exit(falliti ? 1 : 0);
}
main();
