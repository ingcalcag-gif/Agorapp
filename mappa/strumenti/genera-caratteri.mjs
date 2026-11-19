// Genera i glifi della mappa (DM Sans nel formato dei glifi di MapLibre) dai file di DM Sans dell'app (voce T-017).
//
// Uso, dalla cartella mappa/strumenti:  npm ci  →  pip install fonttools==4.67.0 brotli  →  node genera-caratteri.mjs
// Scrive sorgenti/vendor/caratteri-mappa/dm-sans-v17/<stile>/<inizio>-<fine>.pbf;
// dopo ogni rigenerazione si aggiornano le impronte in sorgenti/vendor/elenco.js (lo dice la prova dei componenti).
//
// Fonte: DM Sans v17 (versione 4.004 del carattere), dal pacchetto @fontsource-variable/dm-sans 5.3.0: gli stessi
// file che l'app usa per l'interfaccia (sorgenti/vendor/caratteri/dm-sans-v17/), più quelli corsivi.
// Il carattere è variabile: per la mappa se ne ricavano tre istanze fisse con fontTools (dimensione ottica 12,
// la misura delle scritte sulla mappa), poi fontnik le converte in campi di distanza, a blocchi di 256 caratteri.
// Licenza: SIL Open Font License 1.1 (licenze/dm-sans.txt). Il carattere convertito è una versione modificata
// ammessa dalla licenza (condizioni 2 e 3: licenza unita ai file; DM Sans non ha nomi riservati).
import fontnik from 'fontnik';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const QUI = path.dirname(fileURLToPath(import.meta.url));
const USCITA = path.resolve(QUI, '../../sorgenti/vendor/caratteri-mappa/dm-sans-v17');
const FONTI = path.join(QUI, 'node_modules/@fontsource-variable/dm-sans/files');
const SUBSET = ['latin', 'latin-ext'];
const STILI = [
  { nome: 'DM Sans Regular', file: 'normal', wght: 400 },
  { nome: 'DM Sans Medium', file: 'normal', wght: 500 },
  { nome: 'DM Sans Italic', file: 'italic', wght: 400 },
];
const OPSZ = 12;

const p = f => (...a) => new Promise((ok, no) => f(...a, (e, r) => e ? no(e) : ok(r)));
const carica = p(fontnik.load), blocco = p(fontnik.range), unisci = p(fontnik.composite);

// Istanza fissa di un carattere variabile, in TrueType (fontTools, eseguito senza leggere moduli dalla cartella).
function istanza(woff2, wght, uscita) {
  execFileSync('python3', ['-I', '-c', `
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
f = TTFont(sys.argv[1])
f = instancer.instantiateVariableFont(f, {"wght": float(sys.argv[2]), "opsz": float(sys.argv[3])})
f.flavor = None
f.save(sys.argv[4])
`, woff2, String(wght), String(OPSZ), uscita], { stdio: 'inherit' });
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'glifi-'));
fs.rmSync(USCITA, { recursive: true, force: true });
for (const s of STILI) {
  const facce = [];
  for (const sub of SUBSET) {
    const ttf = path.join(tmp, `${sub}-${s.file}-${s.wght}.ttf`);
    istanza(path.join(FONTI, `dm-sans-${sub}-opsz-${s.file}.woff2`), s.wght, ttf);
    const dati = fs.readFileSync(ttf);
    const [faccia] = await carica(dati);
    facce.push({ dati, punti: new Set(faccia.points) });
  }
  // Solo i blocchi da 256 che contengono almeno un carattere.
  const blocchi = new Set();
  for (const f of facce) for (const c of f.punti) blocchi.add(Math.floor(c / 256));
  fs.mkdirSync(path.join(USCITA, s.nome), { recursive: true });
  for (const b of [...blocchi].sort((x, y) => x - y)) {
    const inizio = b * 256, fine = inizio + 255;
    const parti = [];
    for (const f of facce) if ([...f.punti].some(c => c >= inizio && c <= fine)) parti.push(await blocco({ font: f.dati, start: inizio, end: fine }));
    const pbf = parti.length > 1 ? await unisci(parti) : parti[0];
    fs.writeFileSync(path.join(USCITA, s.nome, `${inizio}-${fine}.pbf`), pbf);
  }
  console.log(s.nome + ': ' + blocchi.size + ' blocchi');
}
fs.rmSync(tmp, { recursive: true, force: true });
