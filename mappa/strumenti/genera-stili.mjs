// Genera i due stili della mappa (tinta carta, chiaro e scuro) da @protomaps/basemaps (voce T-017).
//
// Uso, dalla cartella mappa/strumenti:  npm ci  →  node genera-stili.mjs
// Scrive sorgenti/vendor/protomaps-basemaps-5.7.2/stile-carta-chiaro.json e stile-carta-scuro.json;
// dopo ogni rigenerazione si aggiornano le impronte in sorgenti/vendor/elenco.js (lo dice la prova dei componenti).
//
// Che cosa cambia rispetto agli stili di Protomaps (libro mastro § 2.4, «La mappa»; § 6.6):
// - i colori: la tinta carta dell'app, la stessa che prima si dava agli stili di CARTO;
// - gli oggetti della mappa (punti d'interesse): per ora si vedono TUTTE le categorie dei dati, attività commerciali
//   comprese, ciascuna dal suo zoom minimo (decisione di Lorenzo del 20/11/2026: tutte per ora, da sfoltire prima della
//   pubblicazione). L'elenco definitivo è «decisione aperta» della Direzione (§ 2.4): per sfoltire si scrive l'elenco
//   in OGGETTI_VISIBILI, si rigenera e si rimonta. Le categorie senza icona tra quelle di Protomaps si vedono con il
//   solo nome; i nomi delle vie hanno la precedenza sui nomi degli oggetti. I dati non si toccano;
// - i numeri civici (livello «address_label») sono spenti: l'app li accende soltanto mentre si sceglie sulla mappa
//   il punto di un Off-Grid (decisione di Lorenzo del 19/11/2026);
// - i nomi: quelli locali (il campo «name» di OpenStreetMap), non le traduzioni (piano, sezione 7);
// - i caratteri: DM Sans al posto di Noto Sans (glifi in sorgenti/vendor/caratteri-mappa/dm-sans-v17/);
// - i filtri: tutti nella forma delle espressioni (convertiti con @maplibre/maplibre-gl-style-spec, la versione che
//   usa MapLibre 5.24.0), così l'app può aggiungere a ogni livello la regola dello strato delle correzioni (T-018).
// Il disegno degli stili di Protomaps è CC0, il codice BSD a tre clausole (licenze/protomaps-basemaps.txt).
import { layers, namedFlavor } from '@protomaps/basemaps';
import { convertFilter, validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const QUI = path.dirname(fileURLToPath(import.meta.url));
const USCITA = path.resolve(QUI, '../../sorgenti/vendor/protomaps-basemaps-5.7.2');

// I colori carta dell'app.
const PALETTE = {
  chiaro: {terra:'#ECE6D9', terra2:'#E5DECF', strada:'#FBF8F1', bordo:'#D9CFBD', edificio:'#E0D8C8', acqua:'#C9DCE4', acquaT:'#5E7E8A', parco:'#D2E2C8', testo:'#5C5246', alone:'#F3EEE4', confine:'#A89F90', ferrovia:'#CFC6B4'},
  scuro:  {terra:'#1C1915', terra2:'#211D18', strada:'#36302A', bordo:'#2A251F', edificio:'#28231D', acqua:'#1D2E36', acquaT:'#86A9B5', parco:'#1F2C1E', testo:'#B5A998', alone:'#16130F', confine:'#6A6054', ferrovia:'#3A342C'},
};

// Categorie degli oggetti della mappa che si vedono. null = tutte (decisione del 20/11/2026, da sfoltire prima della
// pubblicazione). Per sfoltire: un elenco di categorie («kind» dei dati di Protomaps); quelle fuori elenco, e ogni
// categoria nuova nei dati, restano nascoste. Fino al 20/11/2026 valeva l'elenco del ramo mappa-protomaps (12/10/2026),
// senza attività commerciali:
//   ['park','garden','forest','beach','marina','peak','zoo','animal','station','bus_stop','ferry_terminal','aerodrome',
//    'stadium','university','library','school','townhall','post_office','museum','theatre','attraction','artwork','building',
//    'toilets','drinking_water','bench']
export const OGGETTI_VISIBILI = null;

// Icone che le categorie possono usare: quelle dei punti d'interesse nel foglio di icone di Protomaps che viaggia con l'app
// (fuori gli scudi delle strade e i simboli delle località). Una categoria senza icona si scrive con il solo nome, senza
// chiedere a MapLibre un'immagine che non c'è.
const ICONE = Object.keys(JSON.parse(fs.readFileSync(path.resolve(QUI, '../../sorgenti/vendor/protomaps-icone-v4/light.json'), 'utf8')))
  .filter(k => /^[a-z_]+$/.test(k) && !['arrow', 'capital', 'townspot', 'station'].includes(k));

function carta(base, C){
  const f = structuredClone(namedFlavor(base));
  for (const k of Object.keys(f)) {
    if (typeof f[k] !== 'string') continue;
    if (/_halo$/.test(k)) f[k] = C.alone;
    else if (/label/.test(k)) f[k] = k==='ocean_label' ? C.acquaT : C.testo;
    else if (/casing/.test(k)) f[k] = C.bordo;
    else if (/^tunnel_/.test(k)) f[k] = C.terra2;
    else if (/^(park|wood|scrub)_|^zoo$/.test(k)) f[k] = C.parco;
    else if (/^(other|minor|link|major|highway|bridges_|runway)/.test(k)) f[k] = C.strada;
  }
  Object.assign(f, {background:C.terra, earth:C.terra, water:C.acqua, buildings:C.edificio, railway:C.ferrovia, boundaries:C.confine,
    hospital:C.terra2, industrial:C.terra2, school:C.terra2, pedestrian:C.terra2, aerodrome:C.terra2, military:C.terra2,
    sand:C.terra2, beach:C.terra2, glacier:C.terra, pier:C.terra2});
  f.landcover = {grassland:C.parco, farmland:C.parco, scrub:C.parco, forest:C.parco, barren:C.terra2, urban_area:C.terra2, glacier:C.terra};
  return f;
}

// Caratteri: Noto Sans di Protomaps → DM Sans; nomi: traduzione italiana → nome locale.
const ritocca = s => s
  .replace(/Noto Sans Devanagari Regular v1|Noto Sans Regular/g, 'DM Sans Regular')
  .replace(/Noto Sans Medium/g, 'DM Sans Medium').replace(/Noto Sans Italic/g, 'DM Sans Italic')
  .replace(/"name:it"/g, '"name"');

// Come in MapLibre (feature_filter): vero se il filtro è già un'espressione.
function espressione(f){
  if (f === true || f === false) return true;
  if (!Array.isArray(f) || !f.length) return false;
  switch (f[0]) {
    case 'has': return f.length >= 2 && f[1] !== '$id' && f[1] !== '$type';
    case 'in': return f.length >= 3 && (typeof f[1] !== 'string' || Array.isArray(f[2]));
    case '!in': case '!has': case 'none': return false;
    case '==': case '!=': case '>': case '>=': case '<': case '<=': return f.length !== 3 || Array.isArray(f[1]) || Array.isArray(f[2]);
    case 'any': case 'all': return f.slice(1).every(x => typeof x === 'boolean' || espressione(x));
    default: return true;
  }
}

function stile(gusto){
  const livelli = JSON.parse(ritocca(JSON.stringify(layers('protomaps', gusto, {lang:'it'}))));
  for (const l of livelli) {
    if (l.filter !== undefined && !espressione(l.filter)) l.filter = convertFilter(l.filter);
    if (l.id === 'pois') {
      const zoom = ['>=', ['zoom'], ['get','min_zoom']];
      l.filter = OGGETTI_VISIBILI ? ['all', ['in', ['get','kind'], ['literal', OGGETTI_VISIBILI]], zoom] : zoom;
      const ii = l.layout && l.layout['icon-image'];
      if (JSON.stringify(ii) !== JSON.stringify(['match', ['get','kind'], 'station', 'train_station', ['get','kind']]))
        throw new Error('icona dei punti d\'interesse diversa dal previsto: controlla la versione di @protomaps/basemaps');
      l.layout = Object.assign({}, l.layout, {'icon-image': ['match', ['get','kind'], 'station', 'train_station', ICONE, ['get','kind'], '']});
    }
    if (l.id === 'address_label') l.layout = Object.assign({}, l.layout, {visibility:'none'});
  }
  // Nomi delle vie prima degli oggetti: MapLibre dà la precedenza alle scritte dei livelli più in alto, e con tutte le
  // categorie i nomi dei negozi coprirebbero quelli delle vie (in centro a Torino, a zoom 16, Via Roma e quasi tutte le vie
  // resterebbero senza nome). Il livello degli oggetti scende quindi sotto i nomi delle vie: gli oggetti riempiono lo
  // spazio che resta. Nomi delle località e dei paesi restano sopra, come in Protomaps.
  const iPois = livelli.findIndex(l => l.id === 'pois'), iVie = livelli.findIndex(l => l.id === 'roads_labels_minor');
  if (iPois < 0 || iVie < 0 || iVie > iPois) throw new Error('ordine dei livelli diverso dal previsto: controlla la versione di @protomaps/basemaps');
  livelli.splice(iVie, 0, livelli.splice(iPois, 1)[0]);
  if (!livelli.some(l => l.id === 'address_label')) throw new Error('manca il livello address_label: controlla la versione di @protomaps/basemaps');
  if (livelli.some(l => JSON.stringify(l).includes('Noto'))) throw new Error('è rimasto un carattere Noto');
  const errori = validateStyleMin({version:8, glyphs:'https://x/{fontstack}/{range}.pbf', sprite:'https://x/s', sources:{protomaps:{type:'vector', url:'https://x/t.json'}}, layers:livelli});
  if (errori.length) throw new Error('stile non valido: ' + errori.map(e => e.message).join('; '));
  return livelli;
}

fs.mkdirSync(USCITA, {recursive:true});
for (const [nome, base, C] of [['carta-chiaro','light',PALETTE.chiaro], ['carta-scuro','dark',PALETTE.scuro]]) {
  const f = path.join(USCITA, `stile-${nome}.json`);
  fs.writeFileSync(f, JSON.stringify(stile(carta(base, C))) + '\n');
  console.log(path.relative(process.cwd(), f));
}
