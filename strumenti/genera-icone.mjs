#!/usr/bin/env node
/* Icona provvisoria dell'app (voce T-028 del piano di adeguamento): un quadrato del verde dell'app con un anello chiaro,
   senza marchio. Quella definitiva arriva con il nome (T-077).

     node strumenti/genera-icone.mjs

   Scrive sorgenti/icone/icona-180.png (iPhone), icona-192.png e icona-512.png (Android e computer) e, per l'app della
   redazione (T-033), redazione-180.png, redazione-192.png e redazione-512.png: lo stesso anello chiaro su un fondo scuro,
   color inchiostro, così sulla schermata Home le due app non si confondono. Il disegno riempie
   tutto il quadrato e l'anello sta nella zona centrale, così l'icona regge anche il ritaglio rotondo dei telefoni.
   I file stanno nel repository: il montaggio li copia così come sono, senza ridisegnarli. Nessuna libreria esterna. */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const USCITA = path.join(RADICE, 'sorgenti', 'icone');
const VERDE = [0x2D, 0x5A, 0x3D], INCHIOSTRO = [0x1F, 0x24, 0x20], SEGNO = [0xFF, 0xFD, 0xF8];   // verde dell'app, inchiostro, carta chiara
const ESTERNO = 0.27, INTERNO = 0.165;                         // raggi dell'anello, in parti del lato

const TAVOLA = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = b => { let c = 0xFFFFFFFF; for (const x of b) c = TAVOLA[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function pezzo(tipo, dati) {
  const t = Buffer.from(tipo, 'latin1'), l = Buffer.alloc(4), c = Buffer.alloc(4);
  l.writeUInt32BE(dati.length); c.writeUInt32BE(crc(Buffer.concat([t, dati])));
  return Buffer.concat([l, t, dati, c]);
}
function icona(lato, FONDO) {
  const N = 4, righe = Buffer.alloc(lato * (1 + lato * 3));   // ogni punto si calcola su 4 × 4 campioni, per bordi morbidi
  for (let y = 0; y < lato; y++) {
    const o = y * (1 + lato * 3); righe[o] = 0;
    for (let x = 0; x < lato; x++) {
      let dentro = 0;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const dx = (x + (i + 0.5) / N) / lato - 0.5, dy = (y + (j + 0.5) / N) / lato - 0.5, d = Math.hypot(dx, dy);
        if (d <= ESTERNO && d >= INTERNO) dentro++;
      }
      const a = dentro / (N * N);
      for (let k = 0; k < 3; k++) righe[o + 1 + x * 3 + k] = Math.round(FONDO[k] + (SEGNO[k] - FONDO[k]) * a);
    }
  }
  const testa = Buffer.alloc(13); testa.writeUInt32BE(lato, 0); testa.writeUInt32BE(lato, 4); testa[8] = 8; testa[9] = 2;   // 8 bit, RGB
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), pezzo('IHDR', testa), pezzo('IDAT', zlib.deflateSync(righe, { level: 9 })), pezzo('IEND', Buffer.alloc(0))]);
}

fs.mkdirSync(USCITA, { recursive: true });
for (const [nome, fondo] of [['icona', VERDE], ['redazione', INCHIOSTRO]]) for (const lato of [180, 192, 512]) {
  const f = path.join(USCITA, `${nome}-${lato}.png`);
  fs.writeFileSync(f, icona(lato, fondo));
  console.log(path.relative(RADICE, f), fs.statSync(f).size + ' byte');
}
