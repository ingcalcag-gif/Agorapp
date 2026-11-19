// Cartella di tasselli separati, ricavata dal file unico (voce T-019): è il ripiego che l'app usa se il server
// non accetta le richieste a pezzi (T-017; da verificare su Bunny con T-066).
//
// Uso:  node cartella-tasselli.mjs <file.pmtiles> <cartella>
// Scrive <cartella>/<z>/<x>/<y>.pbf, tasselli non compressi, solo quelli che il file contiene.
import { PMTiles } from 'pmtiles';
import fs from 'fs';
import path from 'path';

const [file, uscita] = process.argv.slice(2);
if (!file || !uscita) { console.error('uso: node cartella-tasselli.mjs <file.pmtiles> <cartella>'); process.exit(2); }

class Fonte {
  constructor(p) { this.fd = fs.openSync(p, 'r'); this.p = p; }
  getKey() { return this.p; }
  async getBytes(o, l) { const b = Buffer.alloc(l); const n = fs.readSync(this.fd, b, 0, l, o); return { data: b.buffer.slice(b.byteOffset, b.byteOffset + n) }; }
}

const m = new PMTiles(new Fonte(file));
const h = await m.getHeader();
const lon2x = (lon, z) => Math.floor((lon + 180) / 360 * 2 ** z);
const lat2y = (lat, z) => Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * 2 ** z);
let n = 0;
for (let z = h.minZoom; z <= h.maxZoom; z++) {
  const max = 2 ** z - 1, c = v => Math.min(max, Math.max(0, v));
  for (let x = c(lon2x(h.minLon, z)); x <= c(lon2x(h.maxLon, z)); x++)
    for (let y = c(lat2y(h.maxLat, z)); y <= c(lat2y(h.minLat, z)); y++) {
      const t = await m.getZxy(z, x, y);
      if (!t) continue;
      fs.mkdirSync(path.join(uscita, String(z), String(x)), { recursive: true });
      fs.writeFileSync(path.join(uscita, String(z), String(x), y + '.pbf'), Buffer.from(t.data));
      n++;
    }
}
console.log(n + ' tasselli in ' + uscita);
