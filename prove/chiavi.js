/* Prova: nessuna chiave, password o formula segreta nel codice (voce T-005; libro mastro § 2.4, «Le chiavi»;
   § 3.11). Il codice dell'app lo legge chiunque la apra: una chiave scritta lì non protegge nulla.

   Si controllano sorgenti/, le funzioni in netlify/, i file di configurazione alla radice e .github/.
   Le uscite in dist/ sono copie dei sorgenti (lo garantisce prove/uscite.js). prove/ non si controlla:
   contiene, per le prove, testi ostili inventati. Neppure sorgenti/vendor/: librerie di terzi a impronta fissa. */
'use strict';
const fs = require('fs');
const path = require('path');
const { RADICE, elencaFile, riga, esito, eseguiDaSola, confronta } = require('./comune.js');

const REGOLE = [
  { nome: 'chiave privata', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { nome: 'gettone di un servizio', re: /\b(?:sk-(?:ant-|proj-|live_|test_)?[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|xox[abprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35})\b/g },
  // Un nome che dice «password», «segreto», «chiave», «formula»… assegnato a un testo scritto nel codice
  // (vedi segreto() qui sotto: conta il nome a pezzi, così «confine» non è «fine»).
  { nome: 'segreto assegnato a un testo', re: /\b([A-Za-z_$][\w$]*)\s*[:=]\s*(['"`])[^'"`\n]{8,}\2/g, filtro: m => segreto(m[1]) },
];
// Pezzi di nome che indicano un segreto. FINE e FRASE sono le formule delle Fate (T-014).
const PEZZI = new Set(['pass', 'password', 'passwd', 'pw', 'pwd', 'secret', 'segreto', 'segreti', 'token', 'apikey', 'chiave', 'chiavi', 'key', 'frase', 'formula', 'salt', 'sale', 'fine']);
// I pezzi di un nome: «FATE_FRASE» → fate, frase; «adminPw» → admin, pw; «api_key» → api, key, apikey.
function segreto(nome) {
  const p = nome.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase().split(/[_$]+/).filter(Boolean);
  return p.some((x, i) => PEZZI.has(x) || PEZZI.has(x + (p[i + 1] || '')));
}
const CARTELLE = ['sorgenti', 'netlify', '.github'];
const RADICE_FILE = ['netlify.toml', 'package.json'];

function prova() {
  const e = esito('Nessuna chiave nel codice');
  const file = [
    ...CARTELLE.flatMap(c => elencaFile(path.join(RADICE, c)).map(f => c + '/' + f)).filter(f => !f.startsWith('sorgenti/vendor/')),
    ...RADICE_FILE.filter(f => fs.existsSync(path.join(RADICE, f))),
  ].filter(f => /\.(m?js|html|css|json|toml|ya?ml)$/.test(f));
  const trovati = [];
  for (const f of file) {
    const testo = fs.readFileSync(path.join(RADICE, f), 'utf8');
    for (const r of REGOLE) for (const m of testo.matchAll(r.re)) {
      if (r.filtro && !r.filtro(m)) continue;
      const nome = (m[0].match(/^[A-Za-z_$][\w$]*/) || [r.nome])[0];
      trovati.push({ chiave: r.nome + ': ' + nome, dove: f, dettaglio: `riga ${riga(testo, m.index)}` });
    }
  }
  confronta(e, 'chiavi', trovati);
  e.note.push(`${file.length} file controllati`);
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
