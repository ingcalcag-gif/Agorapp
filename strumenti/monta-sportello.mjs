// Monta per Bunny, in un file solo, lo sportello di pubblicazione (voce T-038), quello delle segnalazioni (voce T-051) o
// quello dell'archivio dei registri (voce T-053); si usa con l'allacciamento (T-065). Uso, dalla radice del repository:
//   node strumenti/monta-sportello.mjs > /tmp/sportello-pubblicazione.js
//   node strumenti/monta-sportello.mjs segnalazioni > /tmp/sportello-segnalazioni.js
//   node strumenti/monta-sportello.mjs archivio > /tmp/sportello-archivio.js
// Il file prodotto non entra nel repository né nelle uscite dell'app: lo carica su Bunny il fattorino (T-061, T-065).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { vocabolarioApp } from './genera-archivio-prova.mjs';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leggi = (...p) => fs.readFileSync(path.join(RADICE, ...p), 'utf8');

export function montaSportello(quale = 'pubblicazione') {
  if (quale === 'segnalazioni') {
    const moduli = ['sorgenti/moduli/segnalazione.js', 'sorgenti/moduli/pacchetto.js', 'sportelli/segnalazioni.js'].map(f => leggi(f)).join('\n');
    const t = leggi('sportelli', 'bunny-segnalazioni.js');
    if (!t.includes('/*@@MODULI@@*/')) throw new Error('sportelli/bunny-segnalazioni.js: manca il segnaposto MODULI');
    return t.replace('/*@@MODULI@@*/', () => moduli);
  }
  if (quale === 'archivio') {
    const moduli = ['sorgenti/moduli/pacchetto.js', 'sorgenti/moduli/file-cifrati.js', 'sportelli/archivio.js'].map(f => leggi(f)).join('\n');
    const t = leggi('sportelli', 'bunny-archivio.js');
    for (const k of ['MODULI', 'NOME']) if (!t.includes('/*@@' + k + '@@*/')) throw new Error('sportelli/bunny-archivio.js: manca il segnaposto ' + k);
    /* il nome del servizio, con cui cominciano i nomi dei registri (§ 18.4): dalla configurazione, come per l'app */
    const nome = createRequire(import.meta.url)(path.join(RADICE, 'sorgenti', 'config.js')).nome;
    return t.replace('/*@@MODULI@@*/', () => moduli).replace("/*@@NOME@@*/''", () => JSON.stringify(nome));
  }
  if (quale !== 'pubblicazione') throw new Error('monta-sportello: sportello sconosciuto «' + quale + '»');
  const moduli = ['sorgenti/moduli/eventi.js', 'sorgenti/moduli/nascosti.js', 'sorgenti/moduli/quadranti.js', 'sorgenti/moduli/pacchetto.js', 'sportelli/pubblicazione.js'].map(f => leggi(f)).join('\n');
  let t = leggi('sportelli', 'bunny-pubblicazione.js');
  for (const k of ['MODULI', 'REGIONI', 'VOCABOLARIO']) if (!t.includes('/*@@' + k + '@@*/')) throw new Error('sportelli/bunny-pubblicazione.js: manca il segnaposto ' + k);
  return t.replace('/*@@MODULI@@*/', () => moduli)
    .replace('/*@@REGIONI@@*/[]', () => JSON.stringify(JSON.parse(leggi('sorgenti', 'dati', 'regioni.json')).regioni))
    .replace('/*@@VOCABOLARIO@@*/null', () => JSON.stringify(vocabolarioApp()));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.stdout.write(montaSportello(process.argv[2] || 'pubblicazione'));
