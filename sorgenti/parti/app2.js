
/* ---------- Icone (dal mockup) ---------- */
const GLIFO_OG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="5.2" stroke="currentColor" stroke-width="1.8"/><circle cx="8" cy="8" r="1.9" fill="currentColor"/></svg>';
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
const icoOrg = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="6" cy="5.4" r="2.4" stroke="currentColor" stroke-width="1.5"/><path d="M1.8 13.2c.3-2.4 2-3.8 4.2-3.8s3.9 1.4 4.2 3.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10.6 3.3a2.3 2.3 0 0 1 0 4.2M12.2 9.8c1.2.5 1.9 1.6 2.1 3.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const icoRipeti = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M12.5 6A5 5 0 0 0 3.6 4.4M3.5 10a5 5 0 0 0 8.9 1.6M12.8 2.5V6H9.3M3.2 13.5V10h3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const icoNote = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 2.5h10v11H3zM5.5 6h5M5.5 8.5h5M5.5 11h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const icoImporta = '<svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 2v7M4 6l3 3 3-3M2 12h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const icoEsporta = '<svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 9V2M4 5l3-3 3 3M2 12h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* Il lucchetto degli eventi nascosti non parla da solo: accanto ha sempre un testo, visibile o letto dal lettore di schermo
   (T-025; libro mastro, § 11.3, regola 5). */
const segnoNascosto = (s=12) => `${icoLucchetto(s)}<span class="solo-voce">${tr('Evento nascosto')}: </span>`;
const interno = svg => svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
function colorePin(e){ return e.tipo==='evento' ? (S[e.strato]||{pin:'#888'}).pin : 'var(--verde)'; }
function contenutoPin(e){ return e.tipo==='og' ? GLIFO_OG : icoPin(e.strato); }
function forma(tipo, strato, s){
  s = s || 28;
  const apri = `<svg class="forma" width="${s}" height="${s}" viewBox="0 0 28 28" aria-hidden="true">`;
  if(tipo==='evento'){
    const c = strato && S[strato] ? S[strato].pin : 'var(--testo-2)';
    const dentro = strato && S[strato] ? `<svg x="4" y="4" width="20" height="20" viewBox="2 2 22 22">${interno(icoPin(strato))}</svg>` : `<circle cx="14" cy="14" r="4" fill="${c}"/>`;
    return `${apri}<circle cx="14" cy="14" r="12" fill="#fff" stroke="${c}" stroke-width="2.5"/>${dentro}</svg>`;
  }
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
let citta = (function(){ const c = MEM.testo('dl_citta','torino'); return CITTA.find(x=>x.id===c) ? c : 'torino'; })();
const cittaObj = () => CITTA.find(x => x.id===citta) || CITTA[0];

/* ---------- Mappa vera: file nostro (Protomaps) disegnato da MapLibre, tinta carta chiara e scura (T-017) ----------
   La mappa è un file proprio, costruito con Protomaps dai dati di OpenStreetMap (libro mastro § 2.4, «La mappa»): il telefono
   ne legge i soli tasselli che servono e non contatta altri servizi di mappe.
   Dove sta: all'indirizzo della mappa nella configurazione (indirizzi.mappa, su Bunny con T-065); finché è vuoto, l'app aperta
   dal repository (githack, prove automatiche) usa la mappa di prova di Torino in mappa/prova/; altrove resta il solo fondo.
   Lì il piccolo file mappa.json dice quale file usare (T-019). Il file unico .pmtiles si legge a pezzi; se il server non lo
   consente, si passa da sé alla cartella di tasselli. Stili, icone e caratteri della mappa viaggiano con l'app, in lib/
   (percorsi in MAPPA_LIB, scritti dal montaggio da sorgenti/vendor/elenco.js).
   Senza rete (T-029; § 2.2 e § 3.7): ogni tassello disegnato si conserva sul telefono, fino a 50 MB, e accanto sta la copia
   di mappa.json (sorgenti/moduli/mappa-locale.js). Per questo i tasselli passano da un protocollo dell'app, «agrmappa»,
   che guarda prima sul telefono e poi scarica, dal file unico o dalla cartella.
   I numeri civici si vedono solo mentre si sceglie un punto sulla mappa (decisione di Lorenzo del 19/11/2026). */
/*@@MAPPA_LIB@@*/
const MAPPA_DOVE = (() => {
  const u = (CFG.indirizzi||{}).mappa;
  try{ if(u) return new URL(u.replace(/\/?$/,'/'), location.href).href; }catch(e){ return ''; }
  /* mappa di prova: l'app aperta dal repository (githack, prove automatiche) sta in …/dist/<uscita>/ */
  const i = location.pathname.lastIndexOf('/dist/');
  return i>=0 ? location.origin + location.pathname.slice(0, i) + '/mappa/prova/' : '';
})();
const temaAttuale = () => document.documentElement.getAttribute('data-theme')==='dark' ? 'dark' : 'light';
let map = null, mappaOk = false;
const MAPPA = {indice:null, fonte:'file', fileOk:false, file:null, protocollo:false, stili:{}, tema:null};
const MAPPA_LOCALE = MODULI.mappaLocale && MAPPA_DOVE ? MODULI.mappaLocale.crea({casse:MEM.file, nomeCassa:'dl_mappa', dove:MAPPA_DOVE}) : null;
const FONDO_MAPPA = {light:'#ECE6D9', dark:'#1C1915'};
function stileVuoto(t){ return {version:8, sources:{}, layers:[{id:'sfondo', type:'background', paint:{'background-color':FONDO_MAPPA[t]}}]}; }
/* Un tassello dalla rete: dal file unico, letto a pezzi; se il server non lo consente (e dal file non è mai arrivato
   nulla) si passa alla cartella di tasselli. Un errore di rete non fa cambiare strada: senza rete si aspetta. */
async function scaricaTassello(z, x, y, segnale){
  const i = MAPPA.indice;
  if(MAPPA.fonte==='file' && !window.pmtiles) MAPPA.fonte = 'tasselli';
  if(MAPPA.fonte==='file'){
    try{
      MAPPA.file = MAPPA.file || new pmtiles.PMTiles(MAPPA_DOVE+i.file);
      const r = await MAPPA.file.getZxy(z, x, y, segnale); MAPPA.fileOk = true;
      return r && r.data ? r.data : null;
    }catch(e){
      if(MAPPA.fileOk || e instanceof TypeError || (e && e.name==='AbortError') || navigator.onLine===false) throw e;
      MAPPA.fonte = 'tasselli';
    }
  }
  const r = await fetch(MAPPA_DOVE+i.tasselli+z+'/'+x+'/'+y+'.pbf', {credentials:'omit', signal:segnale});
  if(r.status===404) return null;
  if(!r.ok) throw new Error('tassello '+r.status);
  return r.arrayBuffer();
}
function preparaProtocollo(){
  if(MAPPA.protocollo) return;
  try{
    maplibregl.addProtocol('agrmappa', async (richiesta, annulla) => {
      const m = /^agrmappa:\/\/t\/(\d+)\/(\d+)\/(\d+)$/.exec(richiesta.url); if(!m) throw new Error('tassello sconosciuto');
      const z = +m[1], x = +m[2], y = +m[3], scarica = () => scaricaTassello(z, x, y, annulla && annulla.signal);
      const dati = MAPPA_LOCALE ? await MAPPA_LOCALE.tassello(versioneMappa(), z, x, y, scarica) : await scarica();
      return {data: dati || new ArrayBuffer(0)};
    });
    MAPPA.protocollo = true;
  }catch(e){}
}
const versioneMappa = () => String((MAPPA.indice||{}).versione || (MAPPA.indice||{}).file || '0');
/* mappa.json: {versione, file: "<nome>.pmtiles", tasselli: "<cartella>/", zoom_max, riquadro: [ovest, sud, est, nord]} */
const indiceValido = j => j && /^[\w.-]+\.pmtiles$/.test(j.file||'') && /^[\w.-]+\/$/.test(j.tasselli||'');
async function indiceMappa(){
  if(MAPPA.indice) return MAPPA.indice;
  if(!MAPPA_DOVE) throw new Error('indirizzo della mappa mancante');
  let testo = null;
  try{ const r = await fetch(MAPPA_DOVE+'mappa.json', {cache:'no-cache', credentials:'omit'}); if(r.ok) testo = await r.text(); }catch(e){}
  let j = null; try{ j = testo && JSON.parse(testo); }catch(e){}
  if(indiceValido(j)){
    MAPPA.indice = j;
    /* la copia per l'uso senza rete; i tasselli di una versione precedente della mappa si tolgono */
    if(MAPPA_LOCALE) MAPPA_LOCALE.ricorda(testo).then(() => MAPPA_LOCALE.soloVersione(versioneMappa())).catch(() => {});
    return j;
  }
  /* senza rete: l'indice che il telefono conserva */
  try{ j = MAPPA_LOCALE && JSON.parse(await MAPPA_LOCALE.ricordato()); }catch(e){ j = null; }
  if(!indiceValido(j)) throw new Error('mappa.json non disponibile');
  return MAPPA.indice = j;
}
function fonteMappa(){
  const i = MAPPA.indice;
  const f = {type:'vector', tiles:['agrmappa://t/{z}/{x}/{y}'], minzoom:0, maxzoom:i.zoom_max||15};
  if(Array.isArray(i.riquadro) && i.riquadro.length===4) f.bounds = i.riquadro;
  return f;
}
async function stileMappa(t){
  const n = t==='dark' ? 'scuro' : 'chiaro';
  if(!MAPPA.stili[n]){ const r = await fetch(MAPPA_LIB.stili+'stile-carta-'+n+'.json'); if(!r.ok) throw new Error('stile '+r.status); MAPPA.stili[n] = await r.json(); }
  return MAPPA.stili[n];
}
/* ---------- Strato delle correzioni e delle aggiunte (T-018; libro mastro § 6.6, regola e tabella; § 2.4) ----------
   I dati di OpenStreetMap non si modificano: correzioni e aggiunte stanno in mappa/correzioni.geojson, che viaggia con l'app.
   «nascondi»: un oggetto sbagliato, indicato dal livello del file della mappa e dal suo numero (id_mappa), non si disegna;
   «aggiunta»: un punto con il nome, disegnato sopra la mappa in corsivo. Quando ce n'è almeno una, l'avviso di provenienza
   aggiunge «correzioni di {nome}»: i contenuti del servizio restano distinti da quelli di OpenStreetMap. Formato in mappa/LEGGIMI.md. */
const LIVELLI_MAPPA = ['earth','landcover','landuse','water','roads','transit','buildings','pois','places','boundaries'];
const CORREZIONI = {pronte:null, nascondi:{}, aggiunte:[]};
function caricaCorrezioni(){
  if(CORREZIONI.pronte) return CORREZIONI.pronte;
  return CORREZIONI.pronte = fetch('mappa/correzioni.geojson', {cache:'no-cache'}).then(r => r.ok ? r.json() : null).then(j => {
    if(!j || j.type!=='FeatureCollection' || !Array.isArray(j.features)) return;
    for(const f of j.features){
      const p = (f && f.properties) || {}, g = f && f.geometry;
      if(p.correzione==='nascondi' && LIVELLI_MAPPA.includes(p.livello) && Number.isSafeInteger(p.id_mappa)) (CORREZIONI.nascondi[p.livello] = CORREZIONI.nascondi[p.livello] || []).push(p.id_mappa);
      else if(p.correzione==='aggiunta' && g && g.type==='Point' && Array.isArray(g.coordinates) && g.coordinates.slice(0,2).every(Number.isFinite) && typeof p.nome==='string' && p.nome.trim())
        CORREZIONI.aggiunte.push({type:'Feature', geometry:{type:'Point', coordinates:g.coordinates.slice(0,2)}, properties:{nome:p.nome.trim().slice(0,80)}});
    }
  }).catch(() => {}).then(avvisoCorrezioni);
}
const quanteCorrezioni = () => CORREZIONI.aggiunte.length + Object.values(CORREZIONI.nascondi).reduce((n,a) => n+a.length, 0);
function conCorrezioni(livelli){
  return livelli.map(l => {
    const ids = CORREZIONI.nascondi[l['source-layer']]; if(!ids || !ids.length) return l;
    const via = ['!', ['in', ['id'], ['literal', ids]]];
    return Object.assign({}, l, {filter: l.filter===undefined ? via : ['all', l.filter, via]});
  });
}
const COLORI_AGGIUNTE = {light:{testo:'#2D5A3D', alone:'#F3EEE4'}, dark:{testo:'#9CC8A8', alone:'#16130F'}};
function aggiungiCorrezioni(){
  if(!CORREZIONI.aggiunte.length || map.getSource('agr-correzioni')) return;
  const C = COLORI_AGGIUNTE[temaAttuale()];
  try{
    map.addSource('agr-correzioni', {type:'geojson', data:{type:'FeatureCollection', features:CORREZIONI.aggiunte}});
    map.addLayer({id:'agr-correzioni-punti', type:'circle', source:'agr-correzioni', minzoom:13, paint:{'circle-radius':3.5, 'circle-color':C.testo, 'circle-stroke-color':C.alone, 'circle-stroke-width':1.5}});
    map.addLayer({id:'agr-correzioni-nomi', type:'symbol', source:'agr-correzioni', minzoom:15,
      layout:{'text-field':['get','nome'], 'text-font':['DM Sans Italic'], 'text-size':12, 'text-anchor':'top', 'text-offset':[0,0.6], 'text-max-width':9},
      paint:{'text-color':C.testo, 'text-halo-color':C.alone, 'text-halo-width':1.2}});
  }catch(e){}
}
function tingiCorrezioni(){
  const C = COLORI_AGGIUNTE[temaAttuale()];
  try{ if(map.getLayer('agr-correzioni-punti')){ map.setPaintProperty('agr-correzioni-punti','circle-color',C.testo); map.setPaintProperty('agr-correzioni-punti','circle-stroke-color',C.alone); map.setPaintProperty('agr-correzioni-nomi','text-color',C.testo); map.setPaintProperty('agr-correzioni-nomi','text-halo-color',C.alone); } }catch(e){}
}
function avvisoCorrezioni(){
  const a = $('attrib-correzioni'); if(!a) return;
  const n = quanteCorrezioni(); a.hidden = !n; a.textContent = n ? ' · ' + tr('correzioni di {nome}') : '';
}

async function caricaMappa(){
  if(!map) return;
  try{
    await Promise.all([indiceMappa(), caricaCorrezioni()]); preparaProtocollo();
    const t = temaAttuale(), livelli = await stileMappa(t);
    MAPPA.tema = t;
    map.setStyle({version:8, glyphs:MAPPA_LIB.glifi+'{fontstack}/{range}.pbf', sprite:MAPPA_LIB.icone+(t==='dark'?'dark':'light'),
      sources:{protomaps:fonteMappa()}, layers:conCorrezioni(livelli)}, {diff:false});
  }catch(e){}
}
/* Cambio di tema: solo i colori e le icone, senza ricaricare la mappa (i tasselli restano). */
async function tingiMappa(){
  if(!map || !mappaOk) return;
  const t = temaAttuale();
  if(!map.getSource('protomaps')){ try{ map.setPaintProperty('sfondo', 'background-color', FONDO_MAPPA[t]); }catch(e){} return; }
  if(MAPPA.tema===t) return;
  let livelli; try{ livelli = await stileMappa(t); }catch(e){ return; }
  if(temaAttuale()!==t || !mappaOk) return; MAPPA.tema = t;
  for(const l of livelli){ if(!map.getLayer(l.id)) continue; for(const [k,v] of Object.entries(l.paint||{})) try{ map.setPaintProperty(l.id, k, v); }catch(e){} }
  try{ map.setSprite(MAPPA_LIB.icone+(t==='dark'?'dark':'light')); }catch(e){}
  tingiCorrezioni();
}
/* Numeri civici: accesi solo mentre si sceglie un punto sulla mappa («Scegli sulla mappa»). */
function civiciMappa(){
  if(!map || !mappaOk) return;
  try{ if(map.getLayer('address_label')) map.setLayoutProperty('address_label', 'visibility', st.posa ? 'visible' : 'none'); }catch(e){}
}
/* ---------- Eventi dell'archivio, a quadranti (T-022; libro mastro § 2.4, «La lettura degli eventi») ----------
   L'archivio sta all'indirizzo degli eventi nella configurazione (indirizzi.eventi, su Bunny con T-065); finché è vuoto,
   l'app aperta dal repository (githack, prove automatiche) legge l'archivio di prova in prova/archivio/, con soli eventi
   inventati; altrove nessun evento pubblico. Quando la mappa resta ferma per mezzo secondo e la zona inquadrata sta
   dentro il quadrante del centro e gli otto intorno, si caricano quei nove quadranti; da più lontano si vedono soltanto
   i numeri per regione, con l'invito ad avvicinarsi. All'apertura e al ritorno nell'app dopo più di trenta minuti si
   controlla se l'archivio è cambiato. Nessuna richiesta porta con sé identificativi, cookie o credenziali. */
const ARCHIVIO_DOVE = (() => {
  const u = (CFG.indirizzi||{}).eventi;
  try{ if(u) return new URL(u.replace(/\/?$/,'/'), location.href).href; }catch(e){ return ''; }
  const i = location.pathname.lastIndexOf('/dist/');
  return i>=0 ? location.origin + location.pathname.slice(0, i) + '/prova/archivio/' : '';
})();
function avviaArchivio(){
  if(!ARCHIVIO_DOVE || !MODULI.archivio || !FORMATO || !QUAD || !window.fetch) return;
  ARCHIVIO = MODULI.archivio.crea({dove:ARCHIVIO_DOVE, vocabolario:FORMATO.vocabolario(LAYERS, TEMI_VOC), fetch:window.fetch.bind(window),
    casse:MEM.file, nomeCassa:'dl_archivio'});
  ARCHIVIO.apri().then(dopoControllo);
  document.addEventListener('visibilitychange', () => { if(document.visibilityState==='visible' && ARCHIVIO) ARCHIVIO.forseControlla().then(c => { if(c) dopoControllo(); }); });
}
function dopoControllo(){ pulisciCalendarioArchivio(); ricostruisci(); aggiornaZona(true); }
/* Dal calendario escono gli eventi dell'archivio che non ci sono più (ritirati o usciti dalla mappa); solo se le zone
   consultate restano sul telefono e l'indice è appena arrivato, così un evento non sparisce perché non è caricato. */
function pulisciCalendarioArchivio(){
  if(!ARCHIVIO || !ARCHIVIO.persistente() || !ARCHIVIO.ultimoControllo()) return;
  const vivi = new Set(ARCHIVIO.eventi().map(x => x.ev.id)), locali = new Set(events.map(e => e.id));
  const via = Object.keys(calEvents).filter(id => FORMATO.ID.test(id) && !vivi.has(id) && !locali.has(id));
  if(via.length){ via.forEach(id => delete calEvents[id]); saveCal(); }
}
let zonaT = 0;
function programmaZona(){ clearTimeout(zonaT); zonaT = setTimeout(() => aggiornaZona(false), 500); }
/* Il quadrante del centro, se la zona inquadrata sta tutta dentro di lui e degli otto intorno; altrimenti null.
   Se il telefono non riesce a disegnare la mappa, la zona è quella della città scelta: elenco e agenda restano utili (§ 11.3). */
function zonaVicina(){
  if(!map){ const k = cittaObj(), c = k.center ? {lat:k.center[0], lng:k.center[1]} : {lat:(k.bounds[0][1]+k.bounds[1][1])/2, lng:(k.bounds[0][0]+k.bounds[1][0])/2}; return QUAD.quadrante(c.lat, c.lng); }
  const c = map.getCenter(), q = QUAD.quadrante(c.lat, c.lng); if(!q) return null;
  const k = QUAD.confini(q), G = QUAD.GRIGLIA, b = map.getBounds();
  return b.getWest() >= k.ovest - G.passo_lng && b.getEast() <= k.est + G.passo_lng && b.getSouth() >= k.sud - G.passo_lat && b.getNorth() <= k.nord + G.passo_lat ? q : null;
}
function aggiornaZona(forza){
  if(!QUAD) return;
  const q = zonaVicina(), ids = q ? QUAD.intorno(q) : [], lontano = !q;
  const cambiata = [...ZONA.ids].sort().join() !== ids.slice().sort().join() || lontano !== ZONA.lontano;
  ZONA.ids = new Set(ids); ZONA.lontano = lontano;
  if(cambiata || forza){ ricostruisci(); tutto(); }
  if(ARCHIVIO && ids.length) ARCHIVIO.carica(ids).then(nuovi => { if(nuovi && ZONA.ids.has(ids[0])){ ricostruisci(); tutto(); } });
}
/* Da lontano: un numero per regione, nel punto della regione; toccandolo ci si avvicina a dove sono gli eventi. */
function disegnaRegioni(){
  if(!ZONA.lontano || !ARCHIVIO) return;
  ARCHIVIO.regioni().forEach(r => {
    const lab = r.eventi===1 ? tr('1 evento in {r}: avvicinati per vederlo',{r:r.nome}) : tr('{n} eventi in {r}: avvicinati per vederli',{n:r.eventi, r:r.nome});
    mettiSegnaposto(`<button class="pin regione" data-regione="${esc(r.vai.join(','))}" aria-label="${esc(lab)}"><span class="f"><span>${esc(r.eventi)}</span></span></button>`, r.punto[0], r.punto[1]);
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
      container:'map', style:stileVuoto(temaAttuale()), center: c.center ? [c.center[1], c.center[0]] : [7.6869,45.0703], zoom: c.zoom || 12,
      attributionControl:false, dragRotate:false, pitchWithRotate:false, touchPitch:false, maxPitch:0, boxZoom:false,
      fadeDuration:0, renderWorldCopies:false, minZoom:4, maxZoom:19, pixelRatio:Math.min(window.devicePixelRatio||1, 2)
    });
  }catch(e){ $('map').innerHTML = `<p class="meta" style="padding:120px 24px;text-align:center">${tr('Questo browser non riesce a disegnare la mappa. Elenco e calendario funzionano lo stesso.')}</p>`; return; }
  if(c.bounds) try{ map.fitBounds(c.bounds, {padding:40, duration:0}); }catch(e){}
  try{ map.touchZoomRotate.disableRotation(); map.keyboard.disableRotation(); }catch(e){}
  /* Anche senza file della mappa (indirizzo vuoto, rete assente) il fondo regge segnaposto e livelli dell'app;
     quando arriva lo stile vero, style.load li rimette. */
  map.on('style.load', () => { if(map.getSource('protomaps')) aggiungiCorrezioni(); aggiungiLivelli(); mappaOk = true; civiciMappa(); tingiMappa(); disegnaPins(); });
  map.on('error', () => {});   /* un tassello che non arriva (senza rete, fuori dalla mappa) non è un errore da mostrare */
  caricaMappa();
  map.once('load', programmaZona);
  map.on('movestart', () => { $('app').classList.add('muove'); annullaLungo(); clearTimeout(zonaT); });
  map.on('moveend', () => { $('app').classList.remove('muove'); aggiornaZoomBtn(); programmaZona(); });
  map.on('zoomend', () => { if(!modoGiornata()) disegnaPins(); });
  map.on('click', ev => {
    const t = ev.originalEvent && ev.originalEvent.target;
    if(t && t.closest && t.closest('.mk')) return;
    if(st.foglio && ['strati','elenco','gruppo','scheda','punto'].includes(st.foglio)) chiudi();
  });
  map.on('contextmenu', ev => {
    if(st.posa || Date.now()-ultimaLunga < 1500) return;
    annullaLungo(); ultimaLunga = Date.now();
    mostraPunto({lat:ev.lngLat.lat, lng:ev.lngLat.lng});
  });
  installaLunga();
}
function aggiornaZoomBtn(){ if(!map) return; const z = map.getZoom(); $('zPiu').disabled = z >= map.getMaxZoom()-0.01; $('zMeno').disabled = z <= map.getMinZoom()+0.01; }

/* pressione lunga sulla mappa = coordinate del punto, con il solo tasto «Copia» (T-009; § 2.2) */
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
      mostraPunto({lat:ll.lat, lng:ll.lng});
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
/* Ciò che il lettore di schermo dice di un segnaposto: strato (oppure «Off-Grid»), titolo e data, poi ciò che sulla mappa si
   vede solo dal colore o da un segno: nascosto, in corso, finito, salvato nel calendario (T-025; § 11.3, regola 5). */
function etichettaPin(e){
  const n = ora(), chi = e.tipo==='og' ? tr('Off-Grid') : (nomeStrato(e.strato) || tr('Evento'));
  return [chi + ': ' + e.titolo, dataBreve(e), e.nascosto ? tr('evento nascosto') : '', e.a<=n && e.b>n ? tr('in corso') : finito(e) ? tr('finito') : '',
    inCal(e.id) && e.tipo!=='og' ? tr('nel calendario') : ''].filter(Boolean).join(', ');
}
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
      const e = g.el[0], cls = {evento:'ev', og:'og'}[e.tipo];
      const inCorso = e.a<=n && e.b>n, fin = finito(e);
      const h = `<button class="pin ${cls}${inCorso?' ora':''}${fin?' finito':''}${st.sel===e.id?' sel':''}" style="--pc:${colorePin(e)}" data-ev="${esc(e.id)}" aria-label="${esc(etichettaPin(e))}"><span class="f">${contenutoPin(e)}${inCal(e.id)&&e.tipo!=='og'?`<span class="salvato">${icoCalPieno}</span>`:''}${e.nascosto?`<span class="lucchetto">${icoLucchetto(9)}</span>`:''}</span></button>`;
      mettiSegnaposto(h, e.lng, e.lat, st.sel===e.id ? 'alto' : '');
    } else {
      const col = [...new Set(g.el.map(colorePin))], passo = 360/col.length;
      const anello = `conic-gradient(${col.map((c,k) => `${c} ${(k*passo).toFixed(1)}deg ${((k+1)*passo).toFixed(1)}deg`).join(',')})`;
      mettiSegnaposto(`<button class="pin gruppo" style="--anello:${anello}" data-gruppo="${esc(g.el.map(e=>e.id).join(','))}" aria-label="${esc(tr('{n} cose qui vicino',{n:g.el.length}))}"><span class="f"><span>${g.el.length}</span></span></button>`, ll.lng, ll.lat);
    }
  });
  disegnaRegioni();
  if(st.tuQui) mettiSegnaposto(`<span class="tu-qui" aria-label="${esc(tr('Sei qui'))}"></span>`, st.tuQui.lng, st.tuQui.lat, 'mk-tu');
  if(st.cercaQui) mettiSegnaposto('<span class="cerca-qui"></span>', st.cercaQui.lng, st.cercaQui.lat, 'mk-q');
  if(st.punto && st.foglio==='punto') mettiSegnaposto('<span class="cerca-qui"></span>', st.punto.lng, st.punto.lat, 'mk-q');
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
  $('btnPieno').innerHTML = st.pieno ? icoRiduci : icoPieno;
  $('btnPieno').setAttribute('aria-pressed', st.pieno); $('btnPieno').setAttribute('aria-label', st.pieno ? tr('Esci dallo schermo intero') : tr('Mappa a schermo intero'));
  const per = nelPeriodo();
  $('tipiMappa').innerHTML = [['evento',tr('Eventi')]].map(([t,l]) => {
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
  /* da lontano (T-022): l'invito ad avvicinarsi, accanto ai numeri per regione sulla mappa */
  if(ZONA.lontano && ARCHIVIO && ARCHIVIO.pronto()) extra.push(tr('avvicinati a una città per vedere gli eventi'));
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
