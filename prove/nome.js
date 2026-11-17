/* Prova: il nome del servizio compare scritto soltanto nella configurazione (voci T-002 e T-005).

   1. Nei sorgenti (sorgenti/, tranne config.js e i testi .md) non c'è «agorapp», in nessuna forma.
   2. Nell'app montata con un altro nome («Nomeprova», solo in memoria) non resta «agorapp» da nessuna parte.
   Sono ammesse soltanto le chiavi interne della memoria del telefono (agorapp_…), che non si vedono e
   restano come sono (T-002). Ogni altro caso è un errore o uno scarto noto con la voce che lo chiude. */
'use strict';
const fs = require('fs');
const path = require('path');
const { RADICE, elencaFile, riga, esito, eseguiDaSola, confronta } = require('./comune.js');
const { monta, configurazione } = require('../sorgenti/build.js');
const { fileLicenze } = require('../sorgenti/licenze.js');

const NOME = /agorapp/gi;
// Chiavi della memoria del telefono: agorapp_ seguito da un nome che non finisce con «_», oppure agorapp_* nei commenti.
const CHIAVE = /^agorapp_(?:[a-z][a-z_]*[a-z]|[a-z]|\*)/i;

function cerca(testo, dove, trovati) {
  for (const m of testo.matchAll(NOME)) {
    const resto = testo.slice(m.index, m.index + 60);
    if (CHIAVE.test(resto)) continue;
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
  const file = { ...monta(cfg), ...fileLicenze(cfg) };
  const uscita = [];
  for (const [f, testo] of Object.entries(file)) cerca(testo, 'Nomeprova/' + f, uscita);
  confronta(e, 'nome', sorgenti.concat(uscita));
  if (!file['index.html'].includes('<title>Nomeprova')) e.errori.push('Nomeprova/index.html: il titolo della pagina non prende il nome dalla configurazione');
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
