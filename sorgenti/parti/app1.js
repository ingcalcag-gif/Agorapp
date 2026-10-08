(function(){
'use strict';
/* =====================================================================
   Agorapp — restyling (ramo restyling-app)
   Stile, struttura e comportamenti dal mockup unico approvato (2 ottobre 2026).
   Funzioni vere dall'app online OG 1.7: mappa CARTO, indirizzi Photon/Nominatim,
   GPS, Off-Grid OG 1.0–1.7, Giornata/Mese/Agenda, PDF, nascosti, admin, città,
   5 lingue, testi legali v1.2. Stessi dati sul telefono (chiavi agorapp_*).
   ===================================================================== */
const $ = id => document.getElementById(id);
const esc = s => String(s==null?"":s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ADMIN_PW = 'agorapp2024', EXPIRE_MS = 3*36e5, OG_KEEP_MS = 92*864e5, DESC_MIN = 30, TITLE_MAX = 100;

/* ---------- Memoria del telefono ---------- */
const LS = {
  get(k,d){ try{ const v = localStorage.getItem(k); return v==null ? d : JSON.parse(v); }catch(e){ return d; } },
  s(k,d){ try{ const v = localStorage.getItem(k); return v==null ? d : v; }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(k, typeof v==='string' ? v : JSON.stringify(v)); return true; }catch(e){ return false; } },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};

/* ---------- Lingue ---------- */
let lang = LS.s('agorapp_lang','it'); if(!['it','en','es','fr','ar'].includes(lang)) lang = 'it';
const dloc = () => ({it:'it-IT',en:'en-GB',es:'es-ES',fr:'fr-FR',ar:'ar'})[lang] || 'it-IT';
const TR = window.AGR_TR || {};
function tr(s, v){
  let x = (lang!=='it' && TR[lang] && TR[lang][s]) || s;
  if(v) Object.keys(v).forEach(k => { x = x.split('{'+k+'}').join(v[k]); });
  return x;
}

/* ---------- Strati e icone (dall'app online) ---------- */
/*@@LAYERS@@*/
const S = Object.fromEntries(LAYERS.map(l => [l.id, l]));
const ICO = LAYER_ICONS;
const icoPin = id => (ICO[id]||'').replace(/<circle cx="13" cy="13" r="12"[^>]*\/>/,'').replace('viewBox="0 0 26 26"','viewBox="2 2 22 22"');
const nomeStrato = id => S[id] ? tr(S[id].label) : '';

/* ---------- Dati sul telefono ---------- */
let events = LS.get('agorapp_events', []); if(!Array.isArray(events)) events = [];
(function pulizia(){
  const n = events.length;
  /* gli eventi demo che l'app online rimetteva da sola non ci sono più: l'app parte vuota */
  events = events.filter(e => e && typeof e==='object' && !e.isDemo);
  /* niente contatori «Ci vado / Sono qui» */
  let tolti = false; events.forEach(e => { if('going' in e || 'here' in e){ delete e.going; delete e.here; tolti = true; } });
  if(events.length!==n || tolti) LS.set('agorapp_events', events);
  try{ sessionStorage.removeItem('agorapp_votes'); }catch(e){}
})();
let calEvents = LS.get('agorapp_cal', {}); if(!calEvents || typeof calEvents!=='object') calEvents = {};
let DEMO = LS.get('agorapp_demo', null);
function saveEvents(){ if(!LS.set('agorapp_events', events)) avviso(tr('Spazio esaurito sul telefono: esporta un backup ed elimina qualche evento.'), null, true); }
function saveCal(){ LS.set('agorapp_cal', calEvents); }
const inCal = id => !!calEvents[id];

/* ---------- Tempo ---------- */
const pad = n => (n<10?'0':'')+n;
const ymd = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const hm = d => pad(d.getHours())+':'+pad(d.getMinutes());
const dIso = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d,0,0,0,0); };
const piuGiorni = (s,n) => { const d = dIso(s); d.setDate(d.getDate()+n); return ymd(d); };
const ora = () => new Date();
const oggi = () => ymd(ora());
const domani = () => piuGiorni(oggi(),1);
const maiusc = s => s ? s.charAt(0).toUpperCase()+s.slice(1) : s;
function nomeGiorno(s){ return dIso(s).toLocaleDateString(dloc(), {weekday:'long', day:'numeric', month:'long'}); }
function titoloGiorno(s){
  const b = nomeGiorno(s);
  return s===oggi() ? tr('Oggi, {g}',{g:b}) : s===domani() ? tr('Domani, {g}',{g:b}) : b;
}
const nomeMese = (y,m) => new Date(y,m,1).toLocaleDateString(dloc(), {month:'long', year:'numeric'});
const nomeSettimana = s => dIso(s).toLocaleDateString(dloc(), {weekday:'long'});
const giorniBrevi = () => { const b = new Date(2024,0,1); return [0,1,2,3,4,5,6].map(i => new Date(b.getTime()+i*864e5).toLocaleDateString(dloc(),{weekday:'short'}).replace('.','')); };
const durata = min => { min = Math.round(min); if(min<60) return tr('{n} min',{n:min}); const h = Math.floor(min/60), m = min%60; return h+' h'+(m?' '+pad(m):''); };
const km = k => k<1 ? Math.round(k*1000)+' m' : k.toFixed(1).replace('.',',')+' km';

/* ---------- Fine, scadenza (come online) ---------- */
function getEnd(ev){
  if(!ev.datetime) return null;
  try{
    if(ev.end){ const e = new Date(ev.end).getTime(); if(!isNaN(e)) return e; }
    const s = new Date(ev.datetime).getTime(); if(!ev.duration) return s;
    const d2 = ev.duration.replace(/un[ao]?\s+po'?\s+di/i,'1').replace(/paio/i,'2').replace(/quarto d'ora/i,'15 min').replace(/mez(?:z)?ora/i,'30 min');
    const m = d2.match(/(\d+(?:[.,]\d+)?)\s*(h|ora|ore|min|minut)?/i); if(!m) return s;
    const n = parseFloat(m[1].replace(',','.')), u = (m[2]||'h').toLowerCase();
    return s + (u.startsWith('m') ? n*6e4 : n*36e5);
  }catch(e){ return null; }
}
function isGone(ev){ const e = getEnd(ev); return e!==null && Date.now() > e + EXPIRE_MS; }
function shouldDelete(ev){ const e = getEnd(ev); if(e===null) return false; return Date.now() > e + ((ev.personal || ev.fata) ? OG_KEEP_MS : EXPIRE_MS); }
function purgeExpired(){
  const n = events.length; events = events.filter(ev => !shouldDelete(ev));
  if(events.length!==n){ Object.keys(calEvents).forEach(id => { if(!events.some(e=>e.id===id)) delete calEvents[id]; }); saveEvents(); saveCal(); return true; }
  return false;
}
const safeUrl = u => { if(!u) return ''; const s = String(u).trim(); return /^https?:\/\//i.test(s) ? s : ''; };
const normLink = u => { u = (u||'').trim(); if(!u) return ''; if(!/^https?:\/\//i.test(u) && /^[\w-]+(\.[\w-]+)+/.test(u)) u = 'https://'+u; return safeUrl(u); };
const formatPrice = p => { if(!p) return p; const s = String(p).trim(); if(/^(gratuito|gratis|free|ingresso libero|libero|offerta libera)$/i.test(s)) return s; if(s.includes('€')||/euro/i.test(s)) return s; if(/^\d+([.,]\d+)?$/.test(s)) return s+' €'; return s; };

/* ---------- Vista degli eventi: un oggetto per tipo, come nel mockup ---------- */
function tipoDi(ev){ if(ev.personal || ev.offgrid) return 'og'; if(ev.parentType==='pratica') return 'pratica'; if(ev.parentType==='istanza') return 'istanza'; return 'evento'; }
function vista(ev){
  const a = new Date(ev.datetime); if(isNaN(a) || !isFinite(+ev.lat) || !isFinite(+ev.lng)) return null;
  const em = getEnd(ev), b = new Date(em!=null && em>a.getTime() ? em : a.getTime());
  const conFine = b>a;
  return {id:ev.id, raw:ev, tipo:tipoDi(ev), strato:ev.category||'', sub:ev.sublayer||'', titolo:ev.title||'', luogo:ev.addressFull||ev.address||'',
    lat:+ev.lat, lng:+ev.lng, a, b, giorno:ymd(a), inizio:hm(a), fine:conFine?hm(b):'', prezzo:ev.price||'',
    desc:(ev.personal ? ev.notes : ev.description)||'', nascosto:!!ev.hidden, serie:ev.seriesId||null, suMappa:ev.suMappa!==false, citta:ev.citta||'', ist:ev.parentType==='istanza'?ev.parentId:null};
}
let EV = [];
function ricostruisci(){ EV = events.filter(ev => fateAttiva || !ev.fata).map(vista).filter(Boolean); }   /* Ordine delle Fate: senza la formula non si vede */
const byId = id => EV.find(e => e.id===id);
const rawById = id => events.find(e => e.id===id);

/* ---------- Stato ---------- */
const st = {
  tempo:'tutto', da:null, a:null, salvatiSolo:false, prezzo:'tutti', finiti:false, nascostiOn:true,
  tipi:{evento:true, pratica:true, istanza:true, og:true},
  strati:new Set(), subOff:new Set(), aperto:null, preset:0,
  sel:null, foglio:null, gruppo:null, q:'', descAperta:false, posa:null, tuQui:null, cercaQui:null,
  cal:{vista:'giornata', giorno:null, y:0, m:0, mezzo:'piedi'}, pdf:null,
  pieno:false, sezione:'mappa', form:null, aform:null, conferma:null, legale:'privacy', semplice:false,
  admin:false, adminPw:false, adminErr:false, guida:null, sbloccati:new Set(), eliminati:[], importa:null, demoMsg:null, lente:null, vuoti:false
};
(function(){ const m = LS.s('agorapp_day_mode','piedi'); if(['piedi','bici','mezzi'].includes(m)) st.cal.mezzo = m; })();
st.semplice = LS.s('agorapp_simple','0')==='1';

/* strati: alla prima apertura sono tutti spenti (come online); il pannellino invita ad accenderli */
function caricaStrati(){
  const s = LS.get('agorapp_layers', null);
  st.strati = new Set(); st.subOff = new Set();
  LAYERS.forEach(l => {
    const x = s && s[l.id];
    if(x && x.on) st.strati.add(l.id);
    const subs = (x && x.subs) || {}, tuttiSpenti = l.sub.every(su => !subs[su.id]);
    l.sub.forEach(su => { if(x && !tuttiSpenti && !subs[su.id]) st.subOff.add(l.id+'|'+su.label); });
  });
}
function istantanea(){ const o = {}; LAYERS.forEach(l => { o[l.id] = {on:st.strati.has(l.id), subs:Object.fromEntries(l.sub.map(su => [su.id, !st.subOff.has(l.id+'|'+su.label)]))}; }); return o; }
function applicaIstantanea(o){ st.strati = new Set(); st.subOff = new Set(); LAYERS.forEach(l => { const x = o[l.id]; if(x && x.on) st.strati.add(l.id); if(x && x.subs) l.sub.forEach(su => { if(x.subs[su.id]===false) st.subOff.add(l.id+'|'+su.label); }); }); }
function salvaStrati(){ LS.set('agorapp_layers', istantanea()); }
caricaStrati();
/* combinazioni Mappa 1/2/3 */
const PRESET_BASE = [null, ['sociale','manifestazioni','conferenze','volontariato'], ['musica','arte','teatro','cinema']];
let presets = (function(){ const p = LS.get('agorapp_presets', null); return (p && Array.isArray(p.data)) ? p.data.slice(0,3) : [null,null,null]; })();
while(presets.length<3) presets.push(null);
function strategiaPreset(i){
  if(presets[i]) return presets[i];
  const base = PRESET_BASE[i]; const o = {};
  LAYERS.forEach(l => { o[l.id] = {on: base ? base.includes(l.id) : true, subs:Object.fromEntries(l.sub.map(su=>[su.id,true]))}; });
  return o;
}
function salvaPresets(){ const p = LS.get('agorapp_presets', null) || {}; LS.set('agorapp_presets', {data:presets, names:(p.names||['Mappa 1','Mappa 2','Mappa 3'])}); }

/* ---------- Filtri ---------- */
const finito = e => e.b <= ora();
const sparito = e => isGone(e.raw);
const appenaFinito = e => finito(e) && !sparito(e);
function weekend(){
  const n = ora(), g = new Date(n.getFullYear(), n.getMonth(), n.getDate()), w = g.getDay();
  const sab = new Date(g); if(w===0) sab.setDate(g.getDate()-1); else if(w!==6) sab.setDate(g.getDate()+(6-w));
  const lun = new Date(sab); lun.setDate(sab.getDate()+2);
  return [w===0 ? g : sab, lun];
}
function finestra(){
  const n = ora(), g0 = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const piu = k => new Date(g0.getFullYear(), g0.getMonth(), g0.getDate()+k);
  switch(st.tempo){
    case 'adesso': return [n, new Date(n.getTime()+2*36e5)];
    case 'oggi': return [g0, piu(1)];
    case 'domani': return [piu(1), piu(2)];
    case 'weekend': return weekend();
    case 'date': if(!st.da) return null; { const a = dIso(st.da), b = dIso(st.a||st.da); b.setDate(b.getDate()+1); return [a,b]; }
    default: return null;
  }
}
function nelTempo(e){
  if(sparito(e)) return false;
  if(finito(e) && !(st.finiti && ['tutto','oggi','adesso'].includes(st.tempo))) return false;
  const f = finestra(); if(!f) return true;
  if(st.tempo==='adesso') return e.a <= f[1];
  return e.a < f[1] && (e.b > f[0] || e.a >= f[0]);
}
function nelloStrato(e){ if(e.tipo==='og') return true; if(e.strato==='fate') return fataVisibile(e); if(!st.strati.has(e.strato)) return false; return !st.subOff.has(e.strato+'|'+e.sub); }
const gratuito = p => /^(gratuito|gratis|free|ingresso libero|libero|0\s*€?)$/i.test(String(p||'').trim());
function nelPrezzo(e){ if(e.tipo==='og' || st.prezzo==='tutti' || !e.prezzo) return true; return st.prezzo==='gratis' ? gratuito(e.prezzo) : !gratuito(e.prezzo); }
function nascostoOk(e){ return !e.nascosto || (st.sbloccati.has(e.raw.hiddenPassword) && st.nascostiOn); }
function serieOk(e){ if(!e.serie) return true; return !EV.some(x => x.serie===e.serie && x.id!==e.id && !sparito(x) && x.a < e.a); }
function temaOk(e){ if(!st.lente) return true; const L = st.lente; return (L.strati||[]).includes(e.strato) || temiDi(e).some(t => (L.temi||[]).includes(t)); }
function temiDi(e){
  const T = (DEMO && DEMO.temi && DEMO.temi.perOggetto) || {};
  let l = e.tipo==='pratica' ? (T[e.raw.parentId]||[]) : e.tipo==='istanza' ? (T[e.raw.parentId==='agorapp'?'agorapp-critica':e.raw.parentId]||[]) : [];
  if(e.raw.tema && !l.includes(e.raw.tema)) l = l.concat([e.raw.tema]);
  return l;
}
const base = e => e.suMappa && temaOk(e) && nelTempo(e) && nelPrezzo(e) && nascostoOk(e) && serieOk(e) && (!st.salvatiSolo || inCal(e.id) || e.tipo==='og');
const visibile = e => base(e) && st.tipi[e.tipo] && nelloStrato(e);
const visibili = () => EV.filter(visibile).sort((x,y) => x.a-y.a);
const nelPeriodo = () => EV.filter(base);
const miei = () => EV.filter(e => e.tipo==='og' || inCal(e.id));
