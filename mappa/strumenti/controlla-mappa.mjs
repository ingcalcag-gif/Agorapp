// Controllo della licenza e dell'avviso a ogni ricostruzione della mappa, e indice mappa.json (voce T-019).
//
// Uso:  node controlla-mappa.mjs <file.pmtiles> <versione> [area]
// Legge le informazioni del file appena costruito e si ferma con un errore se:
// - l'attribuzione non è quella di OpenStreetMap, con il collegamento alla pagina dei diritti (licenza ODbL);
// - nei file entrano fonti diverse da OpenStreetMap e Natural Earth (pubblico dominio): una fonte nuova va letta
//   prima di usarla (libro mastro § 6.6, regola 1; § 31.3);
// - lo schema dei livelli non è il 4, quello per cui sono fatti gli stili (@protomaps/basemaps 5.7.2);
// - il file non è di tasselli vettoriali fino allo zoom 15, o non copre l'area chiesta;
// - l'app montata non ha più l'avviso «© OpenStreetMap» con il collegamento alla pagina dei diritti (§ 6.6, regola 5).
// Se tutto va, scrive accanto al file l'indice mappa.json che l'app legge (formato in mappa/LEGGIMI.md).
import { PMTiles } from 'pmtiles';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const QUI = path.dirname(fileURLToPath(import.meta.url));
const [file, versione, area] = process.argv.slice(2);
if (!file || !/^[\w.-]+$/.test(versione || '')) { console.error('uso: node controlla-mappa.mjs <file.pmtiles> <versione> [area]'); process.exit(2); }

class Fonte {
  constructor(p) { this.fd = fs.openSync(p, 'r'); this.p = p; }
  getKey() { return this.p; }
  async getBytes(o, l) { const b = Buffer.alloc(l); const n = fs.readSync(this.fd, b, 0, l, o); return { data: b.buffer.slice(b.byteOffset, b.byteOffset + n) }; }
}

const errori = [];
const m = new PMTiles(new Fonte(file));
const h = await m.getHeader();
const info = await m.getMetadata();

if (!/openstreetmap\.org\/copyright/.test(info.attribution || '') || !/OpenStreetMap/.test(info.attribution || ''))
  errori.push('attribuzione diversa da quella di OpenStreetMap: ' + info.attribution);
const fonti = String(info.description || '').replace(/Basemap layers derived from/i, '').split(/,|\band\b/).map(s => s.trim()).filter(Boolean);
for (const f of fonti) if (!/^(OpenStreetMap|Natural Earth)$/i.test(f)) errori.push('fonte nuova nei file della mappa, da leggere prima di usarla: ' + f);
if (!fonti.some(f => /^OpenStreetMap$/i.test(f))) errori.push('le informazioni del file non dicono che i dati vengono da OpenStreetMap: ' + info.description);
if (!/^4\./.test(info.version || '')) errori.push('schema dei livelli ' + info.version + ': gli stili sono fatti per lo schema 4');
if (h.tileType !== 1) errori.push('il file non contiene tasselli vettoriali');
if (h.maxZoom !== 15) errori.push('zoom massimo ' + h.maxZoom + ' invece di 15');

// L'area chiesta (riquadro dei contorni in mappa/aree/, se c'è) deve stare dentro i confini del file.
if (area && fs.existsSync(path.join(QUI, '../aree', area + '.geojson'))) {
  const g = JSON.parse(fs.readFileSync(path.join(QUI, '../aree', area + '.geojson'), 'utf8'));
  const punti = JSON.stringify(g).match(/-?\d+\.\d+,\s*-?\d+\.\d+/g).map(s => s.split(',').map(Number));
  const r = [Math.min(...punti.map(p => p[0])), Math.min(...punti.map(p => p[1])), Math.max(...punti.map(p => p[0])), Math.max(...punti.map(p => p[1]))];
  const t = 0.05;
  if (r[0] < h.minLon - t || r[1] < h.minLat - t || r[2] > h.maxLon + t || r[3] > h.maxLat + t) errori.push(`il file copre ${[h.minLon, h.minLat, h.maxLon, h.maxLat]}, l'area ${area} chiede ${r}`);
}

// L'avviso nell'app montata.
const pagina = path.resolve(QUI, '../../dist/pubblica/index.html');
if (fs.existsSync(pagina)) {
  const html = fs.readFileSync(pagina, 'utf8');
  const avviso = (html.match(/<div class="attrib[^"]*" id="attrib">([\s\S]*?)<\/div>/) || [])[1] || '';
  if (!/©\s*<a href="https:\/\/www\.openstreetmap\.org\/copyright"[^>]*>OpenStreetMap<\/a>/.test(avviso)) errori.push('nell\'app montata manca l\'avviso «© OpenStreetMap» con il collegamento alla pagina dei diritti');
} else errori.push('app montata non trovata (dist/pubblica/index.html): impossibile controllare l\'avviso');

if (errori.length) { for (const e of errori) console.error('ERRORE: ' + e); process.exit(1); }

const dataOsm = String(info['planetiler:osm:osmosisreplicationtime'] || '').slice(0, 10);
const indice = {
  versione,
  file: path.basename(file),
  tasselli: versione + '/',
  zoom_max: h.maxZoom,
  riquadro: [h.minLon, h.minLat, h.maxLon, h.maxLat].map(x => Math.round(x * 1e4) / 1e4),
  dati: `© OpenStreetMap, licenza ODbL 1.0; Natural Earth (pubblico dominio). Elaborazione Protomaps, schema ${info.version}, dati OpenStreetMap del ${dataOsm.split('-').reverse().join('/')}.`,
};
fs.writeFileSync(path.join(path.dirname(file), 'mappa.json'), JSON.stringify(indice, null, 2) + '\n');
console.log('Controllo superato: ' + JSON.stringify(indice));
