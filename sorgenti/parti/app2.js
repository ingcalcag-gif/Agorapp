
/* ---------- Icone (dal mockup) ---------- */
const GLIFO_OG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="5.2" stroke="currentColor" stroke-width="1.8"/><circle cx="8" cy="8" r="1.9" fill="currentColor"/></svg>';
const ICO_ABITATIVO = '<svg viewBox="0 0 36 36" fill="none" aria-hidden="true"><rect x="24" y="6" width="3.6" height="8" rx=".6" fill="#A93226"/><polygon points="3,17.5 18,5 33,17.5" fill="#C0392B"/><rect x="7" y="16" width="22" height="16" rx="1.6" fill="#F1948A"/><rect x="15" y="22" width="6" height="10" rx="1" fill="#C0392B"/><rect x="9.5" y="19.5" width="4" height="4" rx=".6" fill="#FDFAF4"/><rect x="22.5" y="19.5" width="4" height="4" rx=".6" fill="#FDFAF4"/></svg>';
const MANO = s => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="9.2" y="5.5" width="3.6" height="13" rx="1.8" fill="var(--clay)"/><rect x="13.4" y="3" width="3.6" height="15" rx="1.8" fill="var(--clay)"/><rect x="17.6" y="4" width="3.6" height="14" rx="1.8" fill="var(--clay)"/><rect x="21.8" y="7" width="3.4" height="11.5" rx="1.7" fill="var(--clay)"/><rect x="3.6" y="13.6" width="3.6" height="10" rx="1.8" transform="rotate(-38 5.4 18.6)" fill="var(--clay)"/><path d="M9.2 15h16v4.5c0 5.2-3.9 9.5-8.8 9.5h-.8c-3.6 0-6.4-2.4-7.6-5.6L6.6 18.3 9.2 15Z" fill="var(--clay)"/></svg>`;
const BERSAGLIO = s => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="var(--ic)" stroke-width="1.8"/><circle cx="12" cy="12" r="6" stroke="var(--ic)" stroke-width="1.8"/><circle cx="12" cy="12" r="2.2" fill="var(--ic)"/></svg>`;
const freccia = '<svg class="freccia-dir" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M5.5 3 9.5 7l-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const frecciaSx = '<svg class="freccia-dir" width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M8.5 3 4.5 7l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const frecciaDx = '<svg class="freccia-dir" width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M5.5 3 9.5 7l-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const su = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 8.5 7 4.5l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const giu = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const giuPiccola = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const croce = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m5 5 8 8M13 5l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const spunta = (s=16) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const icoStrati = '<svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m9 2 7 4-7 4-7-4 7-4ZM2 9.5l7 4 7-4M2 12.5l7 4 7-4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
const icoCal = (s=16) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const icoElenco = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="4" cy="5" r="2.4" fill="#E91E8C"/><circle cx="4" cy="10" r="2.4" fill="var(--clay)"/><circle cx="4" cy="15" r="2.4" fill="#3A8FD8"/><path d="M9 5h8M9 10h6M9 15h7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
/* «Scegli i giorni»: un intervallo fra due tacche, diverso dal Calendario */
const icoGiorni = (s=16) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 3.5v9M14 3.5v9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M5 8h6M6.6 6.2 4.8 8l1.8 1.8M9.4 6.2 11.2 8l-1.8 1.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const icoCondividi = (s=16) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="12" cy="3.5" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="4" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12.5" r="2" stroke="currentColor" stroke-width="1.5"/><path d="m5.8 7 4.4-2.5M5.8 9l4.4 2.5" stroke="currentColor" stroke-width="1.5"/></svg>`;
const icoCalPieno = '<svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="1.5" y="3" width="13" height="11.5" rx="2" fill="currentColor"/><path d="M5 1v3.5M11 1v3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3.5 7.5h9" stroke="var(--verde)" stroke-width="1.4"/></svg>';
const icoPieno = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M2.5 6.5v-4h4M15.5 6.5v-4h-4M2.5 11.5v4h4M15.5 11.5v4h-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const icoRiduci = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M6.5 2.5v4h-4M11.5 2.5v4h4M6.5 15.5v-4h-4M11.5 15.5v-4h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const icoLucchetto = (s=10) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3" y="7" width="10" height="7.5" rx="1.5" fill="currentColor"/><path d="M5.2 7V5a2.8 2.8 0 0 1 5.6 0v2" stroke="currentColor" stroke-width="1.8"/></svg>`;
const icoOra = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.8V8l2.2 1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const icoLuogo = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 14.5s5-4.6 5-8.3A5 5 0 0 0 3 6.2c0 3.7 5 8.3 5 8.3Z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="6.3" r="1.8" stroke="currentColor" stroke-width="1.4"/></svg>';
const icoPrezzo = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 8.6V3a.5.5 0 0 1 .5-.5h5.6l5.2 5.2a1 1 0 0 1 0 1.4l-4.3 4.3a1 1 0 0 1-1.4 0L2.5 8.6Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="5.6" cy="5.6" r="1.1" fill="currentColor"/></svg>';
const icoLink = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6.5 9.5 9.5 6.5M7 4.5l1-1a3 3 0 0 1 4.2 4.2l-1 1M9 11.5l-1 1a3 3 0 0 1-4.2-4.2l1-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const icoPersone = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="5.5" cy="5.5" r="2.2" stroke="currentColor" stroke-width="1.4"/><circle cx="11" cy="5.5" r="2.2" stroke="currentColor" stroke-width="1.4"/><path d="M1.5 13.5c0-2.4 1.8-4 4-4s4 1.6 4 4M8.5 10c.7-.4 1.5-.6 2.5-.6 2.2 0 4 1.6 4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
const icoRipeti = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M12.5 6A5 5 0 0 0 3.6 4.4M3.5 10a5 5 0 0 0 8.9 1.6M12.8 2.5V6H9.3M3.2 13.5V10h3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const icoNote = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 2.5h10v11H3zM5.5 6h5M5.5 8.5h5M5.5 11h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const icoImporta = '<svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 2v7M4 6l3 3 3-3M2 12h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const icoEsporta = '<svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 9V2M4 5l3-3 3 3M2 12h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const icoDemo = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="2.5" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M5 6h6M5 8.5h6M5 11h3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

/* istanze: icona e colore dalla demo (Agorà) */
const icoIst = id => (DEMO && DEMO.istanze && DEMO.istanze.icone && DEMO.istanze.icone[id]) || ICO_ABITATIVO;
const coloreIst = id => (DEMO && DEMO.istanze && DEMO.istanze.colori && DEMO.istanze.colori[id]) || 'var(--ic)';
const interno = svg => svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
function colorePin(e){ return e.tipo==='evento' ? (S[e.strato]||{pin:'#888'}).pin : e.tipo==='pratica' ? 'var(--clay)' : e.tipo==='istanza' ? coloreIst(e.ist) : 'var(--verde)'; }
function contenutoPin(e){ return e.tipo==='og' ? GLIFO_OG : e.tipo==='istanza' ? icoIst(e.ist) : icoPin(e.strato); }
function forma(tipo, strato, s, ist){
  s = s || 28;
  const apri = `<svg class="forma" width="${s}" height="${s}" viewBox="0 0 28 28" aria-hidden="true">`;
  if(tipo==='evento'){
    const c = strato && S[strato] ? S[strato].pin : 'var(--testo-2)';
    const dentro = strato && S[strato] ? `<svg x="4" y="4" width="20" height="20" viewBox="2 2 22 22">${interno(icoPin(strato))}</svg>` : `<circle cx="14" cy="14" r="4" fill="${c}"/>`;
    return `${apri}<circle cx="14" cy="14" r="12" fill="#fff" stroke="${c}" stroke-width="2.5"/>${dentro}</svg>`;
  }
  if(tipo==='pratica'){
    const dentro = strato && S[strato] ? `<svg x="8" y="8" width="12" height="12" viewBox="2 2 22 22">${interno(icoPin(strato))}</svg>` : `<circle cx="14" cy="14" r="3.5" fill="var(--clay)"/>`;
    return `${apri}<circle cx="14" cy="14" r="12" fill="#fff" stroke="var(--clay)" stroke-width="2.5"/><circle cx="14" cy="14" r="8.4" fill="none" stroke="var(--clay)" stroke-width="1.4"/>${dentro}</svg>`;
  }
  if(tipo==='istanza') return `${apri.replace('class="forma"', `class="forma c-${ist||'abitativo'}"`)}<rect x="2" y="2" width="24" height="24" rx="7" fill="var(--it)" stroke="var(--ic)" stroke-width="2.5"/><svg x="6" y="6" width="16" height="16" viewBox="0 0 36 36">${interno(icoIst(ist))}</svg></svg>`;
  return `${apri}<circle cx="14" cy="14" r="12" fill="var(--verde)" stroke="#fff" stroke-width="2"/><circle cx="14" cy="14" r="5.5" fill="none" stroke="var(--su-verde)" stroke-width="2"/><circle cx="14" cy="14" r="2" fill="var(--su-verde)"/></svg>`;
}

/* ---------- Città e zone (v104) ---------- */
const CITTA = [
  {id:'torino', n:'Torino', center:[45.0703,7.6869], zoom:13.3},
  {id:'venezia', n:'Venezia', center:[45.4380,12.3358], zoom:13.3},
  {id:'fipili', n:'Fi-Pi-Li', h:'Firenze · Pisa · Livorno', bounds:[[10.28,43.52],[11.30,43.83]]},
  {id:'bologna', n:'Bologna', center:[44.4939,11.3428], zoom:13.3},
  {id:'parmerina', n:'Piazza Armerina', center:[37.3847,14.3686], zoom:14.3}
];
let citta = (function(){ const c = LS.s('agorapp_city','torino'); return CITTA.find(x=>x.id===c) ? c : 'torino'; })();
const cittaObj = () => CITTA.find(x => x.id===citta) || CITTA[0];

/* ---------- Mappa vera: CARTO vettoriale con MapLibre, tinta con i colori carta ---------- */
const STILE_CARTO = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
const PALETTE = {
  light:{terra:'#ECE6D9', terra2:'#E5DECF', strada:'#FBF8F1', bordo:'#D9CFBD', edificio:'#E0D8C8', acqua:'#C9DCE4', acquaT:'#5E7E8A', parco:'#D2E2C8', testo:'#5C5246', alone:'#F3EEE4', confine:'#A89F90', ferrovia:'#CFC6B4'},
  dark:{terra:'#1C1915', terra2:'#211D18', strada:'#36302A', bordo:'#2A251F', edificio:'#28231D', acqua:'#1D2E36', acquaT:'#86A9B5', parco:'#1F2C1E', testo:'#B5A998', alone:'#16130F', confine:'#6A6054', ferrovia:'#3A342C'}
};
const temaAttuale = () => document.documentElement.getAttribute('data-theme')==='dark' ? 'dark' : 'light';
let map = null, mappaOk = false;
function sp(id, p, v){ try{ map.setPaintProperty(id, p, v); }catch(e){} }
function tingi(){
  if(!map) return; let stile; try{ stile = map.getStyle(); }catch(e){ return; } if(!stile || !stile.layers) return;
  const C = PALETTE[temaAttuale()];
  stile.layers.forEach(l => {
    const id = l.id, k = id.toLowerCase(); if(k.startsWith('agr-')) return;
    if(l.type==='background') return sp(id,'background-color',C.terra);
    if(l.type==='fill'){
      if(/water|ocean|sea|lake|river/.test(k)) return sp(id,'fill-color',C.acqua);
      if(/park|wood|grass|forest|nature|cemetery|garden|green|pitch|landcover|golf|recreation/.test(k)) return sp(id,'fill-color',C.parco);
      if(/building/.test(k)){ sp(id,'fill-color',C.edificio); return sp(id,'fill-outline-color',C.bordo); }
      if(/aeroway|runway|taxiway/.test(k)) return sp(id,'fill-color',C.terra2);
      return sp(id,'fill-color',C.terra2);
    }
    if(l.type==='fill-extrusion') return sp(id,'fill-extrusion-color',C.edificio);
    if(l.type==='line'){
      if(/water|river|stream|canal|ditch|drain/.test(k)) return sp(id,'line-color',C.acqua);
      if(/boundary|admin|border/.test(k)) return sp(id,'line-color',C.confine);
      if(/rail|train|tram|transit/.test(k)) return sp(id,'line-color',C.ferrovia);
      if(/case|casing|outline/.test(k)) return sp(id,'line-color',C.bordo);
      if(/road|street|motorway|trunk|primary|secondary|tertiary|minor|service|path|bridge|tunnel|highway|track|aeroway|pedestrian|footway|cycle/.test(k)) return sp(id,'line-color',C.strada);
      return;
    }
    if(l.type==='symbol'){
      const acq = /water|ocean|sea|lake|river|marine/.test(k);
      sp(id,'text-color', acq ? C.acquaT : C.testo); sp(id,'text-halo-color', C.alone); sp(id,'text-halo-width', 1.2);
      if(/poi|icon|shield/.test(k)) sp(id,'icon-opacity', .55);
    }
  });
}
/* «I vuoti»: i quartieri dove, nel periodo scelto, non succede niente. Per ora rettangoli (come nel mockup), solo a Torino */
const QUARTIERI = [
  {n:'Centro',la:[45.0640,45.0760],ln:[7.6720,7.6920]},{n:'Vanchiglia',la:[45.0680,45.0790],ln:[7.6920,7.7040]},
  {n:'Aurora',la:[45.0760,45.0850],ln:[7.6760,7.6950]},{n:'Barriera di Milano',la:[45.0850,45.0990],ln:[7.6800,7.7080]},
  {n:'Borgo Po',la:[45.0540,45.0680],ln:[7.6980,7.7140]},{n:'San Salvario',la:[45.0500,45.0640],ln:[7.6760,7.6920]},
  {n:'Crocetta',la:[45.0540,45.0640],ln:[7.6600,7.6760]},{n:'San Donato',la:[45.0640,45.0800],ln:[7.6540,7.6720]},
  {n:'Pozzo Strada',la:[45.0560,45.0760],ln:[7.6280,7.6540]},{n:'Madonna di Campagna',la:[45.0800,45.0990],ln:[7.6280,7.6800]},
  {n:'Santa Rita',la:[45.0340,45.0540],ln:[7.6380,7.6600]},{n:'Nizza Millefonti',la:[45.0340,45.0500],ln:[7.6600,7.6880]},
  {n:'Cenisia',la:[45.0560,45.0640],ln:[7.6540,7.6600]}
];
const vuotiAttivi = () => st.vuoti && !st.semplice && citta==='torino';
function quartieriVuoti(lista){ return QUARTIERI.filter(q => !lista.some(e => e.lat>=q.la[0] && e.lat<q.la[1] && e.lng>=q.ln[0] && e.lng<q.ln[1])); }
function immagineTratteggio(){
  const s = 12, c = document.createElement('canvas'); c.width = c.height = s*2; const g = c.getContext('2d');
  g.strokeStyle = temaAttuale()==='dark' ? 'rgba(242,235,224,.30)' : 'rgba(92,82,70,.32)'; g.lineWidth = 2;
  for(let k=-s*2;k<=s*2;k+=s){ g.beginPath(); g.moveTo(k,0); g.lineTo(k+s*2,s*2); g.stroke(); }
  return g.getImageData(0,0,s*2,s*2);
}
function disegnaVuoti(lista){
  if(!map || !mappaOk) return;
  const src = map.getSource('agr-vuoti'); if(!src) return;
  const vuoti = vuotiAttivi() && !modoGiornata() ? quartieriVuoti(lista) : [];
  src.setData({type:'FeatureCollection', features:vuoti.map(q => ({type:'Feature', properties:{}, geometry:{type:'Polygon', coordinates:[[[q.ln[0],q.la[0]],[q.ln[1],q.la[0]],[q.ln[1],q.la[1]],[q.ln[0],q.la[1]],[q.ln[0],q.la[0]]]]}}))});
  const vt = etichettaTempo().vuoto;
  vuoti.forEach(q => mettiSegnaposto(`<span class="vuoto-lbl"><b>${esc(q.n)}</b><span>${esc(vt)}</span></span>`, (q.ln[0]+q.ln[1])/2, (q.la[0]+q.la[1])/2, 'mk-lbl mk-vuoto'));
}
function aggiungiLivelli(){
  if(!map || map.getSource('agr-percorso')) return;
  try{
    try{ map.addImage('agr-tratteggio', immagineTratteggio(), {pixelRatio:2}); }catch(e){}
    map.addSource('agr-vuoti', {type:'geojson', data:{type:'FeatureCollection', features:[]}});
    map.addLayer({id:'agr-vuoti', type:'fill', source:'agr-vuoti', paint:{'fill-pattern':'agr-tratteggio', 'fill-opacity':.9}});
    map.addLayer({id:'agr-vuoti-bordo', type:'line', source:'agr-vuoti', paint:{'line-color':temaAttuale()==='dark'?'#B5A998':'#5C5246', 'line-width':1.5, 'line-dasharray':[3,2.5], 'line-opacity':.7}});
    map.addSource('agr-percorso', {type:'geojson', data:{type:'FeatureCollection', features:[]}});
    map.addLayer({id:'agr-percorso', type:'line', source:'agr-percorso', layout:{'line-cap':'round','line-join':'round'},
      paint:{'line-color':['get','c'], 'line-width':3.5, 'line-dasharray':[1.6,1.6]}});
  }catch(e){}
}
function initMappa(){
  const c = cittaObj();
  if(!window.maplibregl){ $('map').innerHTML = `<p class="meta" style="padding:120px 24px;text-align:center">${tr('La mappa non si è caricata. Controlla la connessione e riapri la pagina.')}</p>`; return; }
  try{
    map = new maplibregl.Map({
      container:'map', style:STILE_CARTO, center: c.center ? [c.center[1], c.center[0]] : [7.6869,45.0703], zoom: c.zoom || 12,
      attributionControl:false, dragRotate:false, pitchWithRotate:false, touchPitch:false, maxPitch:0, boxZoom:false,
      fadeDuration:0, renderWorldCopies:false, minZoom:4, maxZoom:19, pixelRatio:Math.min(window.devicePixelRatio||1, 2)
    });
  }catch(e){ $('map').innerHTML = `<p class="meta" style="padding:120px 24px;text-align:center">${tr('Questo browser non riesce a disegnare la mappa.')}</p>`; return; }
  if(c.bounds) try{ map.fitBounds(c.bounds, {padding:40, duration:0}); }catch(e){}
  try{ map.touchZoomRotate.disableRotation(); map.keyboard.disableRotation(); }catch(e){}
  map.on('style.load', () => { tingi(); aggiungiLivelli(); mappaOk = true; disegnaPins(); });
  map.on('error', () => {});
  map.on('movestart', () => { $('app').classList.add('muove'); annullaLungo(); });
  map.on('moveend', () => { $('app').classList.remove('muove'); aggiornaZoomBtn(); });
  map.on('zoomend', () => { if(!modoGiornata()) disegnaPins(); });
  map.on('click', ev => {
    const t = ev.originalEvent && ev.originalEvent.target;
    if(t && t.closest && t.closest('.mk')) return;
    if(st.foglio && ['strati','elenco','gruppo','scheda'].includes(st.foglio)) chiudi();
  });
  map.on('contextmenu', ev => {
    if(st.posa || Date.now()-ultimaLunga < 1500) return;
    annullaLungo(); ultimaLunga = Date.now();
    apriFormPunto({lat:ev.lngLat.lat, lng:ev.lngLat.lng});
  });
  installaLunga();
}
function aggiornaZoomBtn(){ if(!map) return; const z = map.getZoom(); $('zPiu').disabled = z >= map.getMaxZoom()-0.01; $('zMeno').disabled = z <= map.getMinZoom()+0.01; }

/* pressione lunga sulla mappa = nuovo Off-Grid in quel punto */
let lungo = null, ultimaLunga = 0;
function annullaLungo(){ if(lungo){ clearTimeout(lungo.t1); clearTimeout(lungo.t2); if(lungo.segno) lungo.segno.remove(); lungo = null; } }
function installaLunga(){
  const can = map.getCanvasContainer(), area = $('area');
  $('map').addEventListener('contextmenu', e => e.preventDefault());
  can.addEventListener('touchstart', ev => {
    annullaLungo();
    if(ev.touches.length!==1 || st.posa || (ev.target.closest && ev.target.closest('.mk'))) return;
    const t = ev.touches[0], r = area.getBoundingClientRect(), x = t.clientX - r.left, y = t.clientY - r.top;
    const L = lungo = {x0:t.clientX, y0:t.clientY};
    L.t1 = setTimeout(() => { const s = document.createElement('span'); s.className = 'pressione'; s.style.left = x+'px'; s.style.top = y+'px'; area.appendChild(s); L.segno = s; }, 150);
    L.t2 = setTimeout(() => {
      if(lungo!==L) return; annullaLungo();
      if(Date.now()-ultimaLunga < 1500) return; ultimaLunga = Date.now();
      const mr = $('map').getBoundingClientRect(), ll = map.unproject([t.clientX - mr.left, t.clientY - mr.top]);
      apriFormPunto({lat:ll.lat, lng:ll.lng});
    }, 650);
  }, {passive:true});
  can.addEventListener('touchmove', ev => { if(!lungo) return; const t = ev.touches[0]; if(ev.touches.length>1 || Math.hypot(t.clientX-lungo.x0, t.clientY-lungo.y0) > 8) annullaLungo(); }, {passive:true});
  ['touchend','touchcancel'].forEach(n => can.addEventListener(n, annullaLungo, {passive:true}));
}

/* ---------- Segnaposto ---------- */
let segnaposti = [];
function pulisciSegnaposti(){ segnaposti.forEach(m => m.remove()); segnaposti = []; }
function mettiSegnaposto(html, lng, lat, cls){
  const el = document.createElement('div'); el.className = 'mk'+(cls?' '+cls:''); el.innerHTML = html;
  const m = new maplibregl.Marker({element:el, anchor:'center'}).setLngLat([lng,lat]).addTo(map);
  segnaposti.push(m); return m;
}
function raggruppa(lista){
  const R = 30, g = [];
  lista.forEach(e => {
    const p = map.project([e.lng, e.lat]);
    if(e.id===st.sel){ g.push({p, el:[e], fisso:true}); return; }
    const x = g.find(q => !q.fisso && Math.hypot(q.p.x-p.x, q.p.y-p.y) < R);
    if(x){ x.el.push(e); const n = x.el.length; x.p = {x:(x.p.x*(n-1)+p.x)/n, y:(x.p.y*(n-1)+p.y)/n}; }
    else g.push({p, el:[e]});
  });
  return g;
}
const modoGiornata = () => st.foglio==='calendario' && st.cal.vista==='giornata';
function svuotaPercorso(){ try{ const s = map && map.getSource('agr-percorso'); if(s) s.setData({type:'FeatureCollection', features:[]}); }catch(e){} }
function dataBreve(e){ return (e.giorno===oggi() ? tr('oggi') : e.giorno===domani() ? tr('domani') : nomeGiorno(e.giorno)) + ' ' + tr('alle {o}',{o:e.inizio}); }
function disegnaPins(){
  if(!map || !mappaOk) return;
  pulisciSegnaposti();
  if(modoGiornata()){ disegnaGiornataMappa(); return; }
  svuotaPercorso();
  const n = ora(), lista = visibili();
  disegnaVuoti(lista);
  raggruppa(lista).forEach(g => {
    const ll = map.unproject([g.p.x, g.p.y]);
    if(g.el.length===1){
      const e = g.el[0], cls = {evento:'ev', pratica:'pr', istanza:'is', og:'og'}[e.tipo] + (e.tipo==='istanza' ? ' c-'+e.ist : '');
      const inCorso = e.a<=n && e.b>n, fin = finito(e);
      const h = `<button class="pin ${cls}${inCorso?' ora':''}${fin?' finito':''}${st.sel===e.id?' sel':''}" style="--pc:${colorePin(e)}" data-ev="${esc(e.id)}" aria-label="${esc(e.titolo+', '+dataBreve(e))}"><span class="f">${contenutoPin(e)}${inCal(e.id)&&e.tipo!=='og'?`<span class="salvato">${icoCalPieno}</span>`:''}${e.nascosto?`<span class="lucchetto">${icoLucchetto(9)}</span>`:''}</span></button>`;
      mettiSegnaposto(h, e.lng, e.lat, st.sel===e.id ? 'alto' : '');
    } else {
      const col = [...new Set(g.el.map(colorePin))], passo = 360/col.length;
      const anello = `conic-gradient(${col.map((c,k) => `${c} ${(k*passo).toFixed(1)}deg ${((k+1)*passo).toFixed(1)}deg`).join(',')})`;
      mettiSegnaposto(`<button class="pin gruppo" style="--anello:${anello}" data-gruppo="${esc(g.el.map(e=>e.id).join(','))}" aria-label="${esc(tr('{n} cose qui vicino',{n:g.el.length}))}"><span class="f"><span>${g.el.length}</span></span></button>`, ll.lng, ll.lat);
    }
  });
  if(st.tuQui) mettiSegnaposto(`<span class="tu-qui" aria-label="${esc(tr('Sei qui'))}"></span>`, st.tuQui.lng, st.tuQui.lat, 'mk-tu');
  if(st.cercaQui) mettiSegnaposto('<span class="cerca-qui"></span>', st.cercaQui.lng, st.cercaQui.lat, 'mk-q');
}

/* ---------- Inquadrare ---------- */
function bandaVisibile(){
  const sopra = $('sopra'), f = document.querySelector('#foglio-slot .foglio'), H = $('area').clientHeight;
  const alto = sopra.hidden ? 8 : sopra.offsetHeight + 16;
  const basso = f ? f.offsetTop : H - 80;
  return [alto, Math.max(alto+60, basso), H];
}
function inquadra(lat, lng, zoomMin){
  if(!map) return; const [alto, basso, H] = bandaVisibile();
  map.easeTo({center:[lng,lat], zoom:Math.max(map.getZoom(), zoomMin||14), padding:{top:alto, bottom:Math.max(0, H-basso), left:16, right:16}, duration:450});
}
function inquadraTutti(punti){
  if(!map || !punti.length) return;
  if(punti.length===1) return inquadra(punti[0].lat, punti[0].lng, 15);
  const [alto, basso, H] = bandaVisibile(); let b = new maplibregl.LngLatBounds();
  punti.forEach(p => b.extend([p.lng, p.lat]));
  map.fitBounds(b, {padding:{top:alto+30, bottom:Math.max(30, H-basso+30), left:50, right:50}, maxZoom:16, duration:450});
}
function vaiCitta(anima){
  const c = cittaObj(); if(!map) return;
  const pad = {top:0, bottom:0, left:0, right:0};
  if(c.bounds) map.fitBounds(c.bounds, {padding:40, duration:anima?800:0});
  else if(anima) map.flyTo({center:[c.center[1],c.center[0]], zoom:c.zoom, padding:pad, duration:900});
  else map.jumpTo({center:[c.center[1],c.center[0]], zoom:c.zoom, padding:pad});
}

/* ---------- Barre sopra la mappa ---------- */
function etichettaTempo(){
  const m = {tutto:[tr('Tutto in arrivo')], adesso:[tr('Adesso')], oggi:[tr('Oggi')], domani:[tr('Domani')], weekend:[tr('Questo weekend')]};
  const v = {tutto:tr('niente in arrivo'), adesso:tr('niente adesso'), oggi:tr('niente oggi'), domani:tr('niente domani'), weekend:tr('niente nel weekend')};
  if(st.tempo==='date') return {t:intervallo(), vuoto:tr('niente in quei giorni')};
  return {t:m[st.tempo][0], vuoto:v[st.tempo]};
}
function intervallo(){
  if(!st.da) return tr('Scegli i giorni');
  const f = s => dIso(s).toLocaleDateString(dloc(), {day:'numeric', month:'long'});
  const a = st.da, b = st.a || st.da;
  if(a===b) return f(a);
  return f(a)+' – '+f(b);
}
function contaMiei(){ return miei().filter(e => !finito(e) && serieOk(e)).length; }
function disegnaChips(){
  const c = (id, lab) => `<button class="chipt vetro" data-tempo="${id}" aria-pressed="${st.tempo===id}">${lab}</button>`;
  const n = contaMiei();
  /* «Il tuo calendario» sta fermo; scorrono solo i tempi */
  $('chipCal').innerHTML = `<button class="chipt vetro chip-cal" data-az="salvati" aria-pressed="${st.salvatiSolo}">${icoCal()}${tr('Il tuo calendario')} <span class="n">${n}</span></button>`;
  $('chips').innerHTML = (st.lente ? `<button class="chipt vetro" data-az="togli-lente" aria-pressed="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></svg>${esc(st.lente.nome)} ${croce}</button>` : '')
    + c('tutto', tr('Tutto')) + c('adesso', tr('Adesso')) + c('oggi', tr('Oggi')) + c('domani', tr('Domani')) + c('weekend', tr('Weekend'))
    + `<button class="chipt vetro" data-az="date" aria-pressed="${st.tempo==='date'}">${icoGiorni()}${st.tempo==='date'&&st.da ? esc(intervallo()) : tr('Scegli i giorni')}</button>`;
  $('btnElenco').innerHTML = `${icoElenco}${tr('Elenco')}<span class="conta">${visibili().length}</span>`;
  $('btnCal').innerHTML = `<span class="cal-lbl">${tr('Calendario')}</span>${n?`<span class="num">${n}</span>`:''}`;
  requestAnimationFrame(() => { if(typeof bordiChips==='function') bordiChips(); });
  $('btnCal').setAttribute('aria-label', tr('Il mio Calendario'));
  $('badgeAdmin').hidden = !st.admin;
  $('btnPieno').innerHTML = st.pieno ? icoRiduci : icoPieno;
  $('btnPieno').setAttribute('aria-pressed', st.pieno); $('btnPieno').setAttribute('aria-label', st.pieno ? tr('Esci dallo schermo intero') : tr('Mappa a schermo intero'));
  const per = nelPeriodo();
  $('tipiMappa').innerHTML = [['evento',tr('Eventi')],['pratica',tr('Pratiche')],['istanza',tr('Istanze')]].map(([t,l]) => {
    const k = per.filter(e => e.tipo===t && nelloStrato(e)).length;
    return `<button class="tipo-p" data-tipo="${t}" aria-pressed="${st.tipi[t]}">${forma(t,null,24)}<span class="l">${l}</span><span class="n">${k}</span></button>`;
  }).join('');
}
function disegnaPeek(){
  const extra = [];
  if(st.prezzo==='gratis') extra.push(tr('solo gratuiti')); else if(st.prezzo==='pagamento') extra.push(tr('solo a pagamento'));
  if(st.lente) extra.push(tr('lente «{n}»',{n:st.lente.nome}));
  if(st.finiti) extra.push(tr('anche appena finiti'));
  if(!st.tipi.og) extra.push(tr('senza i tuoi Off-Grid'));
  if(vuotiAttivi()){ const v = quartieriVuoti(visibili()).length; if(v) extra.push(v===1 ? tr('1 quartiere vuoto') : tr('{n} quartieri vuoti',{n:v})); }
  const N = LAYERS.length, k = st.strati.size;
  const accesi = k===N ? tr('Tutti i {n} strati accesi',{n:N}) : k===1 ? tr('1 strato su {n} acceso',{n:N}) : k ? tr('{k} strati su {n} accesi',{k, n:N}) : tr('Nessuno strato acceso');
  $('peek').innerHTML = `<span class="maniglia" aria-hidden="true"></span><div><strong>${tr('Strati')}</strong><span class="meta">${accesi}${extra.length?' · '+esc(extra.join(' · ')):''}</span></div><span class="apri-el">${tr('Scegli')} ${su}</span>`;
}
/* pannellino (chiesto da Lorenzo): con tutti gli strati spenti la mappa non mostra gli eventi della città */
function disegnaAvvisoStrati(){
  const el = $('avvisoStrati'); if(!el) return;
  const mostra = st.sezione==='mappa' && st.strati.size===0 && !st.foglio && !st.posa && !st.pieno && st.guida==null && !modoGiornata();
  el.hidden = !mostra; if(!mostra) return;
  el.style.top = ($('sopra').offsetHeight + 10) + 'px';   /* sotto i tempi: in basso restano liberi Calendario e Off-Grid */
  el.innerHTML = `<div class="stack-s" style="gap:2px"><strong>${tr('Accendi gli strati per vedere gli eventi')}</strong><span class="meta">${tr('Gli strati sono i tipi di evento: musica, sport, assemblee… Sono tutti spenti, per questo la mappa è vuota. Accendi quelli che ti interessano: restano scelti su questo telefono.')}</span></div>
    <div class="tasti"><button class="tasto sec" data-az="strati">${icoStrati}${tr('Scegli gli strati')}</button><button class="tasto pri" data-az="tutti-strati">${tr('Accendili tutti')}</button></div>`;
}
function posizioni(){
  const aperto = !!st.foglio || !!st.posa;
  disegnaAvvisoStrati();
  $('peek').hidden = aperto; $('lato').hidden = aperto; $('tipiMappa').hidden = aperto;
  $('attrib').style.bottom = aperto || st.pieno ? '8px' : '72px';
  $('sopra').hidden = !!st.posa || modoGiornata();
}
