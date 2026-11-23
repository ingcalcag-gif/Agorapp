// Monta lo sportello di pubblicazione per Bunny in un file solo (voce T-038; si usa con l'allacciamento, T-065).
// Uso, dalla radice del repository:  node strumenti/monta-sportello.mjs > /tmp/sportello-pubblicazione.js
// Il file prodotto non entra nel repository né nelle uscite dell'app: lo carica su Bunny il fattorino (T-061, T-065).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { vocabolarioApp } from './genera-archivio-prova.mjs';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leggi = (...p) => fs.readFileSync(path.join(RADICE, ...p), 'utf8');

export function montaSportello() {
  const moduli = ['sorgenti/moduli/eventi.js', 'sorgenti/moduli/quadranti.js', 'sorgenti/moduli/pacchetto.js', 'sportelli/pubblicazione.js'].map(f => leggi(f)).join('\n');
  let t = leggi('sportelli', 'bunny-pubblicazione.js');
  for (const k of ['MODULI', 'REGIONI', 'VOCABOLARIO']) if (!t.includes('/*@@' + k + '@@*/')) throw new Error('sportelli/bunny-pubblicazione.js: manca il segnaposto ' + k);
  return t.replace('/*@@MODULI@@*/', () => moduli)
    .replace('/*@@REGIONI@@*/[]', () => JSON.stringify(JSON.parse(leggi('sorgenti', 'dati', 'regioni.json')).regioni))
    .replace('/*@@VOCABOLARIO@@*/null', () => JSON.stringify(vocabolarioApp()));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.stdout.write(montaSportello());
