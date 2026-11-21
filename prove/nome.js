/* Prova: il nome del servizio compare scritto soltanto nella configurazione (voci T-002 e T-005).

   1. Nei sorgenti (sorgenti/, tranne config.js e i testi .md) non c'è «agorapp», in nessuna forma.
   2. Nell'app montata con un altro nome («Nomeprova», solo in memoria) non resta «agorapp» da nessuna parte.
   Dal blocco 6 (T-026) le chiavi della memoria del telefono non contengono più il nome. Restano ammessi soltanto i
   nomi che le chiavi avevano prima (agorapp_…), scritti una volta sola nel modulo della memoria
   (sorgenti/moduli/memoria.js, montato in moduli.js), che li usa per traslocare i dati e per cancellare le chiavi delle
   funzioni tolte. Ogni altro caso è un errore o uno scarto noto con la voce che lo chiude. */
'use strict';
const fs = require('fs');
const path = require('path');
const { RADICE, elencaFile, riga, esito, eseguiDaSola, confronta } = require('./comune.js');
const { configurazione, uscita: fileUscita } = require('../sorgenti/build.js');

const NOME = /agorapp/gi;
// I nomi di prima delle chiavi della memoria del telefono, presi dal modulo: ammessi solo lì e in moduli.js.
const MEMORIA = require('../sorgenti/moduli/memoria.js');
const NOMI_DI_PRIMA = new Set(MEMORIA.ELENCO.map(v => v.prima).filter(Boolean).concat(MEMORIA.TOLTE.map(t => t.nome)));
const DOVE_AMMESSI = /(^|\/)(sorgenti\/moduli\/memoria\.js|moduli\.js|sw\.js)$/;

function cerca(testo, dove, trovati) {
  for (const m of testo.matchAll(NOME)) {
    const resto = testo.slice(m.index, m.index + 60);
    if (DOVE_AMMESSI.test(dove) && NOMI_DI_PRIMA.has(resto.match(/^[\w]*/)[0])) continue;
    const parola = (testo.slice(Math.max(0, m.index - 12), m.index).match(/[\w.$-]*$/)[0] + resto.match(/^[\w.$-]*/)[0]);
    trovati.push({ chiave: parola, dove, dettaglio: `riga ${riga(testo, m.index)}` });
  }
}

function prova() {
  const e = esito('Nome solo nella configurazione');
  const sorgenti = [];
  for (const f of elencaFile(path.join(RADICE, 'sorgenti'))) {
    if (f === 'config.js' || f.endsWith('.md')) continue;
    cerca(fs.readFileSync(path.join(RADICE, 'sorgenti', f), 'utf8'), 'sorgenti/' + f, sorgenti);
  }

  const cfg = { ...configurazione(), nome: 'Nomeprova' };
  const file = Object.fromEntries(Object.entries(fileUscita(cfg)).filter(([f, x]) => typeof x === 'string' && !f.startsWith('lib/')));
  const uscita = [];
  for (const [f, testo] of Object.entries(file)) cerca(testo, 'Nomeprova/' + f, uscita);
  confronta(e, 'nome', sorgenti.concat(uscita));
  if (!file['index.html'].includes('<title>Nomeprova')) e.errori.push('Nomeprova/index.html: il titolo della pagina non prende il nome dalla configurazione');
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
