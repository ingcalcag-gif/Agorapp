// Genera gli stili della mappa Agorapp da @protomaps/basemaps.
// Uso: npm i @protomaps/basemaps@5.7.2  →  node genera-stili.mjs <cartella-uscita>
// «carta» = i colori carta di Agorapp (gli stessi della vecchia tinta su CARTO), chiaro e scuro.
// Gli altri sono i gusti standard di Protomaps, tenuti per il confronto.
import { layers, namedFlavor } from '@protomaps/basemaps';
import fs from 'fs';

const PALETTE = {
  chiaro: {terra:'#ECE6D9', terra2:'#E5DECF', strada:'#FBF8F1', bordo:'#D9CFBD', edificio:'#E0D8C8', acqua:'#C9DCE4', acquaT:'#5E7E8A', parco:'#D2E2C8', testo:'#5C5246', alone:'#F3EEE4', confine:'#A89F90', ferrovia:'#CFC6B4'},
  scuro:  {terra:'#1C1915', terra2:'#211D18', strada:'#36302A', bordo:'#2A251F', edificio:'#28231D', acqua:'#1D2E36', acquaT:'#86A9B5', parco:'#1F2C1E', testo:'#B5A998', alone:'#16130F', confine:'#6A6054', ferrovia:'#3A342C'},
};

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

const gusti = {
  'carta-chiaro': carta('light', PALETTE.chiaro),
  'carta-scuro': carta('dark', PALETTE.scuro),
  light: namedFlavor('light'), dark: namedFlavor('dark'),
  white: namedFlavor('white'), grayscale: namedFlavor('grayscale'), black: namedFlavor('black'),
};
// I caratteri Noto di Protomaps sostituiti con DM Sans (i nostri, in mappa/caratteri)
const font = s => s.replace(/Noto Sans Devanagari Regular v1|Noto Sans Regular/g,'DM Sans Regular')
                   .replace(/Noto Sans Medium/g,'DM Sans Medium').replace(/Noto Sans Italic/g,'DM Sans Italic');
const out = process.argv[2] || '.';
for (const [nome, g] of Object.entries(gusti)) {
  fs.writeFileSync(`${out}/stile-${nome}.json`, font(JSON.stringify(layers('protomaps', g, {lang:'it'}))));
  console.log('stile-'+nome+'.json');
}
