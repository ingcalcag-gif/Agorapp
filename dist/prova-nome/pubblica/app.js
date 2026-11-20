(function(){
'use strict';
/* =====================================================================
   App della mappa degli eventi — restyling (ramo restyling-app)
   Stile, struttura e comportamenti dal mockup unico approvato (2 ottobre 2026).
   Funzioni vere dall'app online OG 1.7: mappa (dal blocco 3 la mappa propria, T-017), indirizzi Photon,
   GPS, Off-Grid OG 1.0–1.7, Giornata/Mese/Agenda, PDF, nascosti, admin, città,
   5 lingue, testi legali v1.2. Stessi dati sul telefono (chiavi agorapp_*).
   ===================================================================== */
const $ = id => document.getElementById(id);
/* Moduli separati (sorgenti/moduli/, QB-1): testi come testo (T-024), formato degli eventi (T-020), quadranti (T-021),
   lettura dell'archivio (T-022). */
const MODULI = window.AGR_MODULI || {};
const FORMATO = MODULI.eventi, QUAD = MODULI.quadranti;
/* L'unica funzione che protegge i caratteri speciali: ogni testo che arriva da fuori entra nella pagina passando di qui
   (T-024; libro mastro, § 3.11; sorgenti/moduli/testo.js). */
const esc = MODULI.testo.esc;
/* ---------- Configurazione (sorgenti/config.js, caricata prima dell'app) ---------- */
const CFG = window.AGR_CONFIG || {};
const NOME = CFG.nome || '';
const CASELLA = (CFG.caselle || {}).contatto || '';
const segnaposto = s => /^\[.*\]$/.test(String(s || ''));
/* nome dei file scaricati: il nome del servizio in minuscolo, senza spazi né accenti */
const nomeFile = () => NOME.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app';
/* la casella di contatto: un collegamento se esiste, il segnaposto come testo finché non esiste */
const casellaHtml = (classe, oggetto) => segnaposto(CASELLA) || !CASELLA
  ? `<span class="${classe}">${esc(CASELLA)}</span>`
  : `<a class="${classe}" href="mailto:${esc(CASELLA)}${oggetto ? '?subject=' + encodeURIComponent(oggetto) : ''}">${esc(CASELLA)}</a>`;
const ADMIN_PW = 'agorapp2024', EXPIRE_MS = 3*36e5, OG_KEEP_MS = 92*864e5, DESC_MIN = 30, TITLE_MAX = 100;

/* ---------- Memoria del telefono ---------- */
const LS = {
  get(k,d){ try{ const v = localStorage.getItem(k); return v==null ? d : JSON.parse(v); }catch(e){ return d; } },
  s(k,d){ try{ const v = localStorage.getItem(k); return v==null ? d : v; }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(k, typeof v==='string' ? v : JSON.stringify(v)); return true; }catch(e){ return false; } },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};
/* Pulizia una tantum: chiavi di funzioni tolte dall'app (piano di adeguamento). Se il telefono le ha ancora,
   si cancellano all'avvio senza leggerle. */
const CHIAVI_TOLTE = [
  'agorapp_interesse',   // pulsanti volontari «Mi interessa» e «Vorrei … qui» (T-010)
  'agorapp_fate', 'agorapp_fate_io', 'agorapp_fate_strato', 'agorapp_fate_chi',   // Ordine delle Fate (T-014)
  'agorapp_demo',        // demo degli eventi, con progetti e istanze d'esempio (T-015)
];
CHIAVI_TOLTE.forEach(k => LS.del(k));

/* ---------- Lingue ---------- */
let lang = LS.s('agorapp_lang','it'); if(!['it','en','es','fr','ar'].includes(lang)) lang = 'it';
const dloc = () => ({it:'it-IT',en:'en-GB',es:'es-ES',fr:'fr-FR',ar:'ar'})[lang] || 'it-IT';
const TR = window.AGR_TR || {};
function tr(s, v){
  const d = lang!=='it' && TR[lang];
  /* un testo che arriva dai dati con il nome già scritto si traduce con la chiave che ha {nome} */
  let x = (d && (d[s] || (NOME && String(s).includes(NOME) && d[String(s).split(NOME).join('{nome}')]))) || s;
  x = String(x).split('{nome}').join(NOME);
  if(v) Object.keys(v).forEach(k => { x = x.split('{'+k+'}').join(v[k]); });
  return x;
}

/* ---------- Strati e icone (dall'app online) ---------- */
const LAYER_ICONS={
  musica:'<svg viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="12" fill="#FFF3CC"/><rect x="10" y="7" width="2.5" height="10" rx="1.2" fill="#E8A020"/><rect x="14" y="5" width="2.5" height="12" rx="1.2" fill="#C47800"/><ellipse cx="9" cy="17.5" rx="3" ry="2" fill="#E8A020"/><ellipse cx="13" cy="18.5" rx="3" ry="2" fill="#C47800"/></svg>',
  arte:'<svg viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="12" fill="#E0EEFA"/><circle cx="9" cy="10" r="2.5" fill="#3A8FD8"/><circle cx="17" cy="10" r="2.5" fill="#C0392B"/><circle cx="13" cy="17" r="2.5" fill="#F5A623"/><circle cx="13" cy="13" r="2" fill="#1a5a8a"/></svg>',
  sport:'<svg viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="12" fill="#E4F5E4"/><circle cx="13" cy="13" r="6" stroke="#43A047" stroke-width="2" fill="none"/><line x1="13" y1="7" x2="13" y2="19" stroke="#43A047" stroke-width="1.5"/><line x1="7" y1="13" x2="19" y2="13" stroke="#43A047" stroke-width="1.5"/></svg>',
  sociale:'<svg viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="12" fill="#FCE8F2"/><circle cx="9.5" cy="11" r="3" fill="#E91E8C"/><circle cx="16.5" cy="11" r="3" fill="#C2185B"/><path d="M5 20Q9.5 15 14 18Q16 16 21 20" stroke="#E91E8C" stroke-width="1.5" fill="none"/></svg>',
  cibo:'<svg viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="12" fill="#FDE8E0"/><path d="M9 8L9 14Q9 17 13 17Q17 17 17 14L17 8" stroke="#D84315" stroke-width="1.8" fill="none" stroke-linecap="round"/><line x1="13" y1="17" x2="13" y2="20" stroke="#D84315" stroke-width="1.8" stroke-linecap="round"/></svg>',
  teatro:'<svg viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="12" fill="#EDE0FA"/><circle cx="10" cy="12" r="4.5" fill="#7B52D4"/><circle cx="16" cy="12" r="4.5" fill="#4527A0"/><path d="M7 12Q10 16 13 12Q16 16 19 12" stroke="white" stroke-width="1.3" fill="none"/></svg>',
  cinema:'<svg viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="12" fill="#ECEFF1"/><rect x="7" y="9" width="12" height="8" rx="1.5" fill="#607D8B"/><polygon points="11,10.5 11,17.5 18,14" fill="white"/></svg>',
  conferenze:'<svg viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="12" fill="#E0F5F2"/><rect x="8" y="8" width="10" height="7" rx="1.5" fill="#009688"/><line x1="10" y1="11" x2="16" y2="11" stroke="white" stroke-width="1.2" stroke-linecap="round"/><line x1="10" y1="13" x2="14" y2="13" stroke="white" stroke-width="1.2" stroke-linecap="round"/></svg>',
  laboratori:'<svg viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="12" fill="#FFFDE0"/><path d="M11 7L11 14L8 19L18 19L15 14L15 7Z" stroke="#F9A825" stroke-width="1.5" fill="#FFF9C4"/><line x1="11" y1="7" x2="15" y2="7" stroke="#F9A825" stroke-width="1.5" stroke-linecap="round"/></svg>',
  manifestazioni:'<svg viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="12" fill="#FFEBEE"/><line x1="13" y1="18" x2="13" y2="8" stroke="#E53935" stroke-width="1.8" stroke-linecap="round"/><polygon points="13,8 19,11 13,14" fill="#E53935"/><line x1="7" y1="18" x2="19" y2="18" stroke="#B71C1C" stroke-width="1.5" stroke-linecap="round"/></svg>',
  mercati:'<svg viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="12" fill="#FFF3E0"/><path d="M7 11Q10 8 13 11Q16 8 19 11L19 18L7 18Z" fill="#FB8C00"/><rect x="9" y="13" width="3" height="5" rx="0.8" fill="#E65100"/><rect x="14" y="13" width="3" height="5" rx="0.8" fill="#E65100"/></svg>',
  benessere:'<svg viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="12" fill="#E8F5E9"/><path d="M13 19Q7 15 7 11Q7 8 10 8Q12 8 13 10Q14 8 16 8Q19 8 19 11Q19 15 13 19Z" fill="#7CB342"/></svg>',
  volontariato:'<svg viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="12" fill="#E8F5E9"/><path d="M13 8L14.5 11.5L18.5 12L15.5 15L16.5 19L13 17L9.5 19L10.5 15L7.5 12L11.5 11.5Z" fill="#388E3C" stroke="#1B5E20" stroke-width="0.8"/></svg>',
};
const LAYERS=[
  {id:'musica',label:'Musica',pin:'#E8A020',bg:'#FAF0D7',text:'#7A4F00',sub:[{id:'jazz',label:'Jazz'},{id:'rock',label:'Rock e pop'},{id:'classica',label:'Classica'},{id:'elettronica',label:'Elettronica'},{id:'hiphop',label:'Hip-hop e rap'},{id:'folk',label:'Folk e world music'}]},
  {id:'arte',label:'Arte e cultura',pin:'#3A8FD8',bg:'#EAF2FB',text:'#0B3D6B',sub:[{id:'mostre',label:'Mostre'},{id:'installazioni',label:'Installazioni'},{id:'street-art',label:'Street art'},{id:'letteratura',label:'Letteratura'}]},
  {id:'sport',label:'Sport',pin:'#43A047',bg:'#E8F5E9',text:'#1B5E20',sub:[{id:'calcio',label:'Calcio'},{id:'running',label:'Running'},{id:'ciclismo',label:'Ciclismo'},{id:'altri-sport',label:'Altri sport'}]},
  {id:'sociale',label:'Sociale e community',pin:'#E91E8C',bg:'#FCE4EC',text:'#880E4F',sub:[{id:'assemblee',label:'Assemblee'},{id:'inclusione',label:'Inclusione'},{id:'giovani',label:'Giovani'},{id:'anziani',label:'Anziani'}]},
  {id:'cibo',label:'Cibo e ristorazione',pin:'#D84315',bg:'#FBE9E7',text:'#8B2A00',sub:[{id:'street-food',label:'Street food'},{id:'degustazioni',label:'Degustazioni'},{id:'corsi-cucina',label:'Corsi di cucina'}]},
  {id:'teatro',label:'Teatro e danza',pin:'#7B52D4',bg:'#EDE7F6',text:'#311B92',sub:[{id:'prosa',label:'Prosa'},{id:'danza-classica',label:'Danza classica'},{id:'danza-contemp',label:'Danza contemporanea'},{id:'cabaret',label:'Cabaret'}]},
  {id:'cinema',label:'Cinema e proiezioni',pin:'#607D8B',bg:'#ECEFF1',text:'#263238',sub:[{id:'cinema-aperto',label:"Cinema all'aperto"},{id:'documentari',label:'Documentari'},{id:'cortometraggi',label:'Cortometraggi'}]},
  {id:'conferenze',label:'Conferenze e talk',pin:'#009688',bg:'#E0F2F1',text:'#004D40',sub:[{id:'tecnologia',label:'Tecnologia'},{id:'ambiente',label:'Ambiente'},{id:'politica',label:'Politica'},{id:'scienze',label:'Scienze'}]},
  {id:'laboratori',label:'Laboratori e workshop',pin:'#FFC107',bg:'#FFF8E1',text:'#7A5C00',sub:[{id:'artigianato',label:'Artigianato'},{id:'digitale',label:'Digitale'},{id:'creativi',label:'Creativi'}]},
  {id:'manifestazioni',label:'Manifestazioni',pin:'#E53935',bg:'#FFEBEE',text:'#B71C1C',sub:[{id:'cortei',label:'Cortei'},{id:'presidi',label:'Presidi'},{id:'flash-mob',label:'Flash mob'}]},
  {id:'mercati',label:'Mercati e fiere',pin:'#FB8C00',bg:'#FFF3E0',text:'#7A3B00',sub:[{id:'antiquariato',label:'Antiquariato'},{id:'biologico',label:'Biologico'},{id:'artigianato-m',label:'Artigianato'}]},
  {id:'benessere',label:'Benessere e meditazione',pin:'#7CB342',bg:'#F1F8E9',text:'#1A5C28',sub:[{id:'yoga',label:'Yoga'},{id:'meditazione',label:'Meditazione'},{id:'pilates',label:'Pilates'}]},
  {id:'volontariato',label:'Volontariato',pin:'#388E3C',bg:'#E8F5E9',text:'#1A4D2A',sub:[{id:'ambiente-v',label:'Ambiente'},{id:'sociale-v',label:'Sociale'},{id:'animali',label:'Animali'}]},
];
const S = Object.fromEntries(LAYERS.map(l => [l.id, l]));
const ICO = LAYER_ICONS;
const icoPin = id => (ICO[id]||'').replace(/<circle cx="13" cy="13" r="12"[^>]*\/>/,'').replace('viewBox="0 0 26 26"','viewBox="2 2 22 22"');
const nomeStrato = id => S[id] ? tr(S[id].label) : '';

/* ---------- Dati sul telefono ---------- */
let events = LS.get('agorapp_events', []); if(!Array.isArray(events)) events = [];
const IDS_TOLTI = (function pulizia(){
  const n = events.length;
  /* eventi ricevuti con i pacchetti dell'Ordine delle Fate, tolto con T-014: si cancellano, anche dal calendario */
  const fate = events.filter(e => e && typeof e==='object' && e.fata).map(e => e.id);
  events = events.filter(e => !(e && typeof e==='object' && e.fata));
  /* gli eventi demo che l'app online rimetteva da sola non ci sono più: l'app parte vuota */
  events = events.filter(e => e && typeof e==='object' && !e.isDemo);
  /* demo degli eventi, tolta con T-015: i suoi eventi e Off-Grid d'esempio si cancellano, anche dal calendario */
  const demo = events.filter(e => e.demo || /^demo-/.test(String(e.id))).map(e => e.id);
  events = events.filter(e => !(e.demo || /^demo-/.test(String(e.id))));
  /* niente contatori «Ci vado / Sono qui» */
  let tolti = false; events.forEach(e => { if('going' in e || 'here' in e){ delete e.going; delete e.here; tolti = true; } });
  /* nessuna immagine negli eventi (T-011; libro mastro, § 6.2): il campo si toglie dai dati */
  events.forEach(e => { if('image' in e){ delete e.image; tolti = true; } });
  if(events.length!==n || tolti) LS.set('agorapp_events', events);
  try{ sessionStorage.removeItem('agorapp_votes'); }catch(e){}
  return fate.concat(demo);
})();
let calEvents = LS.get('agorapp_cal', {}); if(!calEvents || typeof calEvents!=='object') calEvents = {};
/* dal calendario escono gli eventi tolti qui sopra e ogni voce d'esempio della demo (demo-…), anche senza evento */
(function(){ const via = Object.keys(calEvents).filter(id => IDS_TOLTI.includes(id) || /^demo-/.test(id));
  if(via.length){ via.forEach(id => delete calEvents[id]); LS.set('agorapp_cal', calEvents); } })();
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
function shouldDelete(ev){ const e = getEnd(ev); if(e===null) return false; return Date.now() > e + (ev.personal ? OG_KEEP_MS : EXPIRE_MS); }
/* Toglie dal telefono gli eventi propri scaduti e, dal calendario, solo le loro voci: le voci degli eventi dell'archivio
   si tolgono dopo il controllo delle novità (pulisciCalendarioArchivio, app2). */
function purgeExpired(){
  const via = events.filter(ev => shouldDelete(ev)).map(ev => ev.id);
  if(!via.length) return false;
  events = events.filter(ev => !shouldDelete(ev)); via.forEach(id => delete calEvents[id]); saveEvents(); saveCal(); return true;
}
/* Collegamenti: nella pagina solo https (T-024). Un indirizzo scritto senza lo schema, o con http, si porta a https;
   tutto ciò che non è un indirizzo https valido non diventa un collegamento. */
const safeUrl = u => MODULI.testo.collegamento(u==null ? '' : String(u));
const normLink = u => { u = String(u==null?'':u).trim(); if(!u) return ''; u = u.replace(/^http:\/\//i, 'https://'); if(!/^https:\/\//i.test(u) && /^[\w-]+(\.[\w-]+)+/.test(u)) u = 'https://'+u; return safeUrl(u); };
const formatPrice = p => { if(!p) return p; const s = String(p).trim(); if(/^(gratuito|gratis|free|ingresso libero|libero|offerta libera)$/i.test(s)) return s; if(s.includes('€')||/euro/i.test(s)) return s; if(/^\d+([.,]\d+)?$/.test(s)) return s+' €'; return s; };

/* ---------- Vista degli eventi: un oggetto per tipo, come nel mockup ---------- */
/* Due provenienze, separate (T-022): gli eventi pubblici arrivano soltanto dall'archivio comune, a quadranti; gli
   Off-Grid soltanto dalla memoria del telefono. Gli eventi creati o importati qui dall'area riservata restano nella
   memoria di questo telefono ma non vanno più sulla mappa: si pubblicheranno dall'app della redazione (blocchi 8-10).
   Pratiche e Istanze non vanno sulla mappa finché Progetti e Agorà non aprono (T-015). */
function tipoDi(ev){ return (ev.personal || ev.offgrid) ? 'og' : 'evento'; }
function vista(ev){
  const a = new Date(ev.datetime); if(isNaN(a) || !isFinite(+ev.lat) || !isFinite(+ev.lng)) return null;
  const em = getEnd(ev), b = new Date(em!=null && em>a.getTime() ? em : a.getTime());
  const conFine = b>a;
  return {id:ev.id, raw:ev, tipo:tipoDi(ev), strato:ev.category||'', sub:ev.sublayer||'', titolo:ev.title||'', luogo:ev.addressFull||ev.address||'',
    lat:+ev.lat, lng:+ev.lng, a, b, giorno:ymd(a), inizio:hm(a), fine:conFine?hm(b):'', prezzo:ev.price||'',
    desc:(ev.personal ? ev.notes : ev.description)||'', nascosto:!!ev.hidden, serie:ev.seriesId||null, suMappa:ev.suMappa!==false, citta:ev.citta||'', fineMs:em};
}
/* Un evento dell'archivio (formato pubblico, docs/formato-eventi.md) nella stessa vista. Le ore sono quelle italiane;
   q è il quadrante da cui arriva. «luogo» è la riga breve di elenchi, calendario e PDF (nome del luogo e indirizzo); la
   scheda li mostra su righe proprie, con l'organizzatore e la descrizione del luogo (T-023; libro mastro, § 11.3). */
const nomeSub = (s, id) => { const l = S[s], x = l && l.sub.find(z => z.id===id); return x ? x.label : ''; };
function vistaArchivio(x){
  const ev = x.ev, ia = FORMATO.istante(ev.inizio), fm = FORMATO.fineMs(ev); if(ia==null || fm==null) return null;
  const a = new Date(ia), b = new Date(Math.max(fm, ia)), conFine = b>a;
  return {id:ev.id, raw:ev, archivio:true, q:x.q, tipo:'evento', strato:ev.strato, sub:nomeSub(ev.strato, ev.sottostrato), titolo:ev.titolo,
    luogo:[ev.luogo, ev.indirizzo].filter(Boolean).join(' · '), lat:ev.lat, lng:ev.lng, a, b, giorno:ymd(a), inizio:hm(a), fine:conFine?hm(b):'',
    nomeLuogo:ev.luogo||'', indirizzo:ev.indirizzo||'', descLuogo:ev.descrizione_luogo||'', aMano:ev.collocazione==='a_mano', organizzatore:ev.organizzatore||'',
    prezzo:ev.prezzo||'', desc:ev.descrizione||'', nascosto:false, serie:null, suMappa:true, citta:'', fineMs:fm, fonte:ev.fonte};
}
let EV = [];
let ARCHIVIO = null;                             /* lettore dell'archivio (app2.js) */
const ZONA = {ids:new Set(), lontano:false};     /* quadranti della zona inquadrata; lontano = mappa troppo lontana per gli eventi */
function ricostruisci(){
  const og = events.filter(e => e && (e.personal || e.offgrid)).map(vista).filter(Boolean);
  const pub = ARCHIVIO ? ARCHIVIO.eventi().map(vistaArchivio).filter(Boolean) : [];
  EV = og.concat(pub);
}
const byId = id => EV.find(e => e.id===id);
const rawById = id => events.find(e => e.id===id);

/* ---------- Stato ---------- */
const st = {
  tempo:'tutto', da:null, a:null, salvatiSolo:false, prezzo:'tutti', finiti:false, nascostiOn:true,
  tipi:{evento:true, og:true},
  strati:new Set(), subOff:new Set(), aperto:null, preset:0,
  sel:null, foglio:null, gruppo:null, q:'', descAperta:false, posa:null, tuQui:null, cercaQui:null, punto:null, puntoCopiato:false, copiato:null,
  cal:{vista:'giornata', giorno:null, y:0, m:0, mezzo:'piedi'}, pdf:null,
  pieno:false, sezione:'mappa', form:null, aform:null, conferma:null, legale:'privacy', semplice:false,
  admin:false, adminPw:false, adminErr:false, guida:null, sbloccati:new Set(), eliminati:[], importa:null, msgAdmin:null, lente:null, vuoti:false
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
const sparito = e => e.fineMs!=null && Date.now() > e.fineMs + EXPIRE_MS;   /* esce da mappa e agenda tre ore dopo la fine (§ 2.2) */
/* Gli eventi dell'archivio stanno sulla mappa e nell'elenco solo se il loro quadrante è nella zona inquadrata (§ 2.4);
   nel calendario e nei Temi restano quelli delle zone già consultate. */
const nellaZona = e => !e.archivio || ZONA.ids.has(e.q) || e.id===st.sel;   /* l'evento aperto resta, mentre la mappa ci va */
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
function nelloStrato(e){ if(e.tipo==='og') return true; if(!st.strati.has(e.strato)) return false; return !st.subOff.has(e.strato+'|'+e.sub); }
const gratuito = p => /^(gratuito|gratis|free|ingresso libero|libero|0\s*€?)$/i.test(String(p||'').trim());
function nelPrezzo(e){ if(e.tipo==='og' || st.prezzo==='tutti' || !e.prezzo) return true; return st.prezzo==='gratis' ? gratuito(e.prezzo) : !gratuito(e.prezzo); }
function nascostoOk(e){ return !e.nascosto || (st.sbloccati.has(e.raw.hiddenPassword) && st.nascostiOn); }
function serieOk(e){ if(!e.serie) return true; return !EV.some(x => x.serie===e.serie && x.id!==e.id && !sparito(x) && x.a < e.a); }
function temaOk(e){ if(!st.lente) return true; const L = st.lente; return (L.strati||[]).includes(e.strato) || temiDi(e).some(t => (L.temi||[]).includes(t)); }
function temiDi(e){ return e.raw.tema ? [e.raw.tema] : []; }
const base = e => e.suMappa && nellaZona(e) && temaOk(e) && nelTempo(e) && nelPrezzo(e) && nascostoOk(e) && serieOk(e) && (!st.salvatiSolo || inCal(e.id) || e.tipo==='og');
const visibile = e => base(e) && st.tipi[e.tipo] && nelloStrato(e);
const visibili = () => EV.filter(visibile).sort((x,y) => x.a-y.a);
const nelPeriodo = () => EV.filter(base);
const miei = () => EV.filter(e => e.tipo==='og' || inCal(e.id));


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
let citta = (function(){ const c = LS.s('agorapp_city','torino'); return CITTA.find(x=>x.id===c) ? c : 'torino'; })();
const cittaObj = () => CITTA.find(x => x.id===citta) || CITTA[0];

/* ---------- Mappa vera: file nostro (Protomaps) disegnato da MapLibre, tinta carta chiara e scura (T-017) ----------
   La mappa è un file proprio, costruito con Protomaps dai dati di OpenStreetMap (libro mastro § 2.4, «La mappa»): il telefono
   ne legge i soli tasselli che servono e non contatta altri servizi di mappe.
   Dove sta: all'indirizzo della mappa nella configurazione (indirizzi.mappa, su Bunny con T-065); finché è vuoto, l'app aperta
   dal repository (githack, prove automatiche) usa la mappa di prova di Torino in mappa/prova/; altrove resta il solo fondo.
   Lì il piccolo file mappa.json dice quale file usare (T-019). Il file unico .pmtiles si legge a pezzi; se il server non lo
   consente, si passa da sé alla cartella di tasselli. Stili, icone e caratteri della mappa viaggiano con l'app, in lib/
   (percorsi in MAPPA_LIB, scritti dal montaggio da sorgenti/vendor/elenco.js).
   I numeri civici si vedono solo mentre si sceglie un punto sulla mappa (decisione di Lorenzo del 19/11/2026). */
const MAPPA_LIB = Object.fromEntries(Object.entries({"stili":"lib/protomaps-basemaps-5.7.2/","icone":"lib/protomaps-icone-v4/","glifi":"lib/caratteri-mappa/dm-sans-v17/"}).map(([k, v]) => [k, new URL(v, location.href).href]));
const MAPPA_DOVE = (() => {
  const u = (CFG.indirizzi||{}).mappa;
  try{ if(u) return new URL(u.replace(/\/?$/,'/'), location.href).href; }catch(e){ return ''; }
  /* mappa di prova: l'app aperta dal repository (githack, prove automatiche) sta in …/dist/<uscita>/ */
  const i = location.pathname.lastIndexOf('/dist/');
  return i>=0 ? location.origin + location.pathname.slice(0, i) + '/mappa/prova/' : '';
})();
const temaAttuale = () => document.documentElement.getAttribute('data-theme')==='dark' ? 'dark' : 'light';
let map = null, mappaOk = false;
const MAPPA = {indice:null, fonte:'file', fileOk:false, pmtiles:false, stili:{}, tema:null};
const FONDO_MAPPA = {light:'#ECE6D9', dark:'#1C1915'};
function stileVuoto(t){ return {version:8, sources:{}, layers:[{id:'sfondo', type:'background', paint:{'background-color':FONDO_MAPPA[t]}}]}; }
function preparaPmtiles(){
  if(MAPPA.pmtiles || !window.pmtiles) return;
  try{ maplibregl.addProtocol('pmtiles', new pmtiles.Protocol().tile); MAPPA.pmtiles = true; }catch(e){}
}
/* mappa.json: {versione, file: "<nome>.pmtiles", tasselli: "<cartella>/", zoom_max, riquadro: [ovest, sud, est, nord]} */
async function indiceMappa(){
  if(MAPPA.indice) return MAPPA.indice;
  if(!MAPPA_DOVE) throw new Error('indirizzo della mappa mancante');
  const r = await fetch(MAPPA_DOVE+'mappa.json', {cache:'no-cache', credentials:'omit'});
  if(!r.ok) throw new Error('mappa.json '+r.status);
  const j = await r.json();
  if(!/^[\w.-]+\.pmtiles$/.test(j.file||'') || !/^[\w.-]+\/$/.test(j.tasselli||'')) throw new Error('mappa.json non valido');
  return MAPPA.indice = j;
}
function fonteMappa(){
  const i = MAPPA.indice;
  if(MAPPA.fonte==='file' && MAPPA.pmtiles) return {type:'vector', url:'pmtiles://'+MAPPA_DOVE+i.file};
  MAPPA.fonte = 'tasselli';
  const f = {type:'vector', tiles:[MAPPA_DOVE+i.tasselli+'{z}/{x}/{y}.pbf'], minzoom:0, maxzoom:i.zoom_max||15};
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
    await Promise.all([indiceMappa(), caricaCorrezioni()]); preparaPmtiles();
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
    caches:(window.isSecureContext && window.caches) || null, nomeCache:'agorapp_archivio'});
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
  }catch(e){ $('map').innerHTML = `<p class="meta" style="padding:120px 24px;text-align:center">${tr('Questo browser non riesce a disegnare la mappa.')}</p>`; return; }
  if(c.bounds) try{ map.fitBounds(c.bounds, {padding:40, duration:0}); }catch(e){}
  try{ map.touchZoomRotate.disableRotation(); map.keyboard.disableRotation(); }catch(e){}
  /* Anche senza file della mappa (indirizzo vuoto, rete assente) il fondo regge segnaposto e livelli dell'app;
     quando arriva lo stile vero, style.load li rimette. */
  map.on('style.load', () => { if(map.getSource('protomaps')) aggiungiCorrezioni(); aggiungiLivelli(); mappaOk = true; civiciMappa(); tingiMappa(); disegnaPins(); });
  map.on('sourcedata', ev => { if(ev && ev.sourceId==='protomaps' && ev.tile && MAPPA.fonte==='file') MAPPA.fileOk = true; });
  map.on('error', ev => {
    /* il file unico non si legge a pezzi su questo server: si passa alla cartella di tasselli,
       solo se dal file non è mai arrivato un tassello (un errore di rete dopo non basta) */
    if(MAPPA.fonte==='file' && !MAPPA.fileOk && ev && ev.sourceId==='protomaps'){ MAPPA.fonte = 'tasselli'; caricaMappa(); }
  });
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
  $('badgeAdmin').hidden = !st.admin;
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


/* ======================= Fogli ======================= */
let ultimoFoglio = null;
function apri(f, extra){ st.foglio = f; Object.assign(st, extra||{}); disegnaFoglio(); disegnaPins(); posizioni(); }
function chiudi(){ st.espanso = false; TM.foglio = null; TM.salva = null; st.foglio = null; st.sel = null; st.punto = null; st.copiato = null; st.gruppo = null; st.form = null; st.aform = null; st.conferma = null; st.pdf = null; st.importa = null; disegnaFoglio(); disegnaPins(); posizioni(); disegnaChips(); }
function foglio(cls, testa, corpo){
  const esp = st.espanso;
  return `<section class="foglio vetro ${cls}${esp?' espanso':''}" role="dialog" aria-modal="false"><div class="testa-f"><button class="maniglia-btn" data-az="espandi-foglio" aria-expanded="${esp}" aria-label="${esc(esp ? tr('Riduci il pannello') : tr('Allarga il pannello'))}"><span class="maniglia" aria-hidden="true"></span></button>${testa}</div><div class="corpo">${corpo}</div></section>`;
}
/* il trattino: il pannello scorre su e giù. Tocco = allarga o riduce con un'animazione; trascinando segue il dito e si ferma dove è più vicino.
   Allargato perde la trasparenza; ridotto la riprende (regola del 4 ottobre). */
const ANIMA_MS = 280, CURVA = 'cubic-bezier(.2,.8,.2,1)';
const fAttuale = () => document.querySelector('#foglio-slot .foglio');
function hMassima(f){ return (f.offsetParent ? f.offsetParent.clientHeight : window.innerHeight) - 8; }
function hRidotta(f){
  const css = f.style.cssText, e = f.classList.contains('espanso');
  f.style.transition = 'none'; f.style.height = ''; f.style.maxHeight = ''; f.classList.remove('espanso');
  const h = f.getBoundingClientRect().height;
  if(e) f.classList.add('espanso'); f.style.cssText = css; return h;
}
function altezza(f, h){ f.style.height = h + 'px'; f.style.maxHeight = h + 'px'; }
function animaFoglio(f, da, a){
  f.style.animation = 'none'; f.style.transition = 'none'; altezza(f, da); void f.offsetHeight;
  f.style.transition = `height ${ANIMA_MS}ms ${CURVA}, max-height ${ANIMA_MS}ms ${CURVA}, background-color .2s`;
  altezza(f, a);
  clearTimeout(f._fine); f._fine = setTimeout(() => { f.style.transition = ''; f.style.height = ''; f.style.maxHeight = ''; }, ANIMA_MS + 40);
}
function segnaManiglia(f){
  const b = f.querySelector('.maniglia-btn'); if(!b) return;
  b.setAttribute('aria-expanded', st.espanso); b.setAttribute('aria-label', st.espanso ? tr('Riduci il pannello') : tr('Allarga il pannello'));
}
function espandiFoglio(v, daAltezza){
  const f = fAttuale(); if(!f) return;
  const verso = v==null ? !st.espanso : !!v;
  const da = daAltezza!=null ? daAltezza : f.getBoundingClientRect().height, rid = hRidotta(f), max = hMassima(f);
  st.espanso = verso; f.classList.toggle('espanso', verso); segnaManiglia(f);
  animaFoglio(f, da, verso ? max : rid);
}
/* trascinamento: il pannello segue il dito */
const presa = {y:null, f:null, h0:0, min:0, max:0, mosso:false, quando:0};
function presaGiu(ev){
  const b = ev.target.closest && ev.target.closest('.maniglia-btn'); if(!b) return;
  const f = b.closest('.foglio'); if(!f) return;
  Object.assign(presa, {y:ev.clientY, f, h0:f.getBoundingClientRect().height, min:hRidotta(f), max:hMassima(f), mosso:false});
}
function presaMuovi(ev){
  if(presa.y==null) return;
  const dy = ev.clientY - presa.y; if(!presa.mosso && Math.abs(dy) < 6) return;
  presa.mosso = true; const f = presa.f;
  f.style.animation = 'none'; f.style.transition = 'none';
  altezza(f, Math.max(presa.min, Math.min(presa.max, presa.h0 - dy)));
}
function presaSu(){
  if(presa.y==null) return; presa.y = null;
  if(!presa.mosso) return;
  presa.quando = Date.now();
  const f = presa.f, h = f.getBoundingClientRect().height, corsa = Math.max(1, presa.max - presa.min);
  /* basta un quarto di corsa per cambiare stato */
  const verso = st.espanso ? (presa.max - h) < corsa*0.25 : (h - presa.min) > corsa*0.25;
  espandiFoglio(verso, h);
}
const chiudiBtn = az => `<button class="chiudi" data-az="${az||'chiudi'}" aria-label="${esc(tr('Chiudi'))}">${croce}</button>`;
function disegnaFoglio(){
  const slot = $('foglio-slot');
  if(!st.foglio){ slot.innerHTML = ''; ultimoFoglio = null; st.espanso = false; return; }
  const chiave = st.foglio + '|' + (st.sel||'') + (st.gruppo ? st.gruppo.join() : '') + (st.foglio==='calendario' ? st.cal.vista : '');
  if(ultimoFoglio && ultimoFoglio.split('|')[0]!==st.foglio) st.espanso = false;
  const stesso = chiave===ultimoFoglio, vecchio = slot.querySelector('.corpo'), scroll = stesso && vecchio ? vecchio.scrollTop : 0;
  ultimoFoglio = chiave;
  const F = {
    strati:fStrati,
    elenco:() => fElenco(visibili(), etichettaTempo().t, tr('In ordine di orario, non di popolarità.'), true),
    gruppo:() => { const l = st.gruppo.map(byId).filter(Boolean).sort((a,b) => a.a-b.a); return fElenco(l, tr('Qui vicino · {n}',{n:l.length}), tr('Tocca per aprire la scheda.'), false); },
    scheda:() => fScheda(byId(st.sel)), punto:fPunto, cerca:fCerca, date:fDate, calendario:fCalendario, pdf:fPdf, form:fForm, aform:fAdminForm, conferma:fConferma,
    impostazioni:fImpostazioni, legale:fLegale, citta:fCitta, admin:fAdmin, importa:fImporta, temi:fTemi,
    html:() => foglio('forte alto', `<div class="riga-titolo"><div></div>${chiudiBtn()}</div>`, `<div class="${esc(st.fScope)}">${st.fHtml}</div>`)
  };
  const fn = F[st.foglio]; if(!fn){ st.foglio = null; slot.innerHTML = ''; return; }
  slot.innerHTML = fn();
  if(stesso){ const f = slot.querySelector('.foglio'); if(f) f.style.animation = 'none'; const c = slot.querySelector('.corpo'); if(c) c.scrollTop = scroll; }
  if(st.foglio==='cerca' && !stesso){ const i = $('q'); if(i) setTimeout(() => i.focus(), 60); }
}

/* --- Strati --- */
function fStrati(){
  const per = nelPeriodo();
  const conta = t => per.filter(e => e.tipo===t && (t==='og' || nelloStrato(e))).length;
  const righe = LAYERS.map(s => {
    const n = per.filter(e => e.strato===s.id && e.tipo!=='og' && st.tipi[e.tipo]).length, on = st.strati.has(s.id), esp = st.aperto===s.id && !st.semplice;
    const subs = esp ? `<div class="sub" style="--pc:${s.pin};--pb:${s.bg};--pt:${s.text};--pp:${s.pin}">${s.sub.map(x => `<button data-sub="${s.id}|${esc(x.label)}" aria-pressed="${!st.subOff.has(s.id+'|'+x.label)}">${esc(tr(x.label))}</button>`).join('')}</div>` : '';
    /* la freccina delle sottocategorie sta subito dopo il nome dello strato; l'interruttore resta a destra (tutta la riga accende e spegne) */
    return `<div class="strato-r"><div class="strato-riga">
      <button class="strato-on" data-strato="${s.id}" aria-pressed="${on}" style="--pc:${s.pin}"><span class="ico">${ICO[s.id]}</span><div><span class="t">${esc(tr(s.label))}</span><span class="meta">${n ? (n===1 ? tr('1 in questo periodo') : tr('{n} in questo periodo',{n})) : tr('niente in questo periodo')}</span></div></button>
      <button class="espandi avanzato" data-espandi="${s.id}" aria-expanded="${esp}" aria-label="${esc(tr('Sottocategorie di {s}',{s:tr(s.label)}))}">${giu}</button>
      <button class="strato-int" data-strato="${s.id}" aria-pressed="${on}" style="--pc:${s.pin}" tabindex="-1" aria-hidden="true"><span class="interr"></span></button></div>${subs}</div>`;
  }).join('');
  const nFiniti = EV.filter(e => appenaFinito(e) && e.suMappa && st.tipi[e.tipo]).length;
  const testa = `<div class="riga-titolo"><div class="stack-s" style="gap:2px"><h2>${tr('Strati')}</h2><p class="meta">${tr('Cosa vedi sulla mappa')} · ${esc(etichettaTempo().t.toLowerCase())}</p></div>${chiudiBtn()}</div>`;
  const corpo = `
    <section class="sezione"><div class="sez-testa"><div class="tipo">${tr('Quanto costa')}</div></div>
      <div class="seg" role="group">${[['tutti',tr('Tutti')],['gratis',tr('Gratuiti')],['pagamento',tr('A pagamento')]].map(([k,l]) => `<button data-prezzo="${k}" aria-pressed="${st.prezzo===k}">${l}</button>`).join('')}</div></section>
    <section class="sezione"><div class="sez-testa"><div class="tipo">${tr('Di che strato')}</div><span><button class="link" style="min-height:32px" data-az="tutti-strati">${tr('Tutti')}</button> · <button class="link" style="min-height:32px" data-az="nessuno-strato">${tr('Nessuno')}</button></span></div>
      <div class="strati-lista">${righe}</div></section>
    <section class="sezione"><div class="sez-testa"><div class="tipo">${tr('Mostra anche')}</div><span class="meta">${tr('Eventi, pratiche e istanze si scelgono sulla mappa')}</span></div>
      <button class="riga-int" data-tipo="og" aria-pressed="${st.tipi.og}">${forma('og',null,30)}<div><span class="t">${tr('I tuoi Off-Grid')} · ${conta('og')}</span><span class="meta">${tr('Solo su questo telefono.')}</span></div><span class="interr" aria-hidden="true"></span></button>
      <button class="riga-int" data-az="finiti" aria-pressed="${st.finiti}"><span class="forma" style="filter:grayscale(1);opacity:.55">${forma('evento','arte',30)}</span><div><span class="t">${tr('Appena finiti')} · ${nFiniti}</span><span class="meta">${tr('Grigi, fino a tre ore dopo la fine. Poi spariscono dalla mappa.')}</span></div><span class="interr" aria-hidden="true"></span></button>
      ${st.sbloccati.size ? `<button class="riga-int" data-az="nascosti-on" aria-pressed="${st.nascostiOn}"><span class="casella" style="background:var(--testo);border-color:var(--testo);color:var(--fondo)">${icoLucchetto(12)}</span><div><span class="t">${tr('Nascosti che hai sbloccato')} · ${st.sbloccati.size}</span><span class="meta">${tr('Li vedi perché hai la password.')}</span></div><span class="interr" aria-hidden="true"></span></button>` : ''}
    </section>
    ${citta==='torino'?`<section class="sezione avanzato"><div class="sez-testa"><div class="tipo">${tr('Leggere la città')}</div></div>
      <button class="riga-int" data-az="vuoti" aria-pressed="${st.vuoti}" style="--pc:var(--testo-2)"><svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><defs><pattern id="tratteggio-l" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="var(--testo-2)" stroke-width="2" opacity=".45"/></pattern></defs><rect x="2" y="2" width="30" height="30" rx="8" fill="url(#tratteggio-l)" stroke="var(--testo-2)" stroke-width="1.5" stroke-dasharray="4 3"/></svg>
        <div><span class="t">${tr('Mostra i vuoti')}</span><span class="meta">${tr('I quartieri dove, nel periodo scelto, non succede niente. Anche un vuoto è un dato.')}</span></div><span class="interr" aria-hidden="true"></span></button></section>`:''}
    <section class="sezione avanzato"><div class="sez-testa"><div class="tipo">${tr('Le tue combinazioni')}</div><span class="meta">${tr('Restano su questo telefono')}</span></div>
      <div class="seg" role="group">${[0,1,2].map(i => `<button data-preset="${i}" aria-pressed="${st.preset===i}">${tr('Mappa {n}',{n:i+1})}</button>`).join('')}</div>
      <p class="meta">${presets.some(Boolean) ? tr('Ogni combinazione ricorda gli strati che ci hai salvato.') : tr('Mappa 1: tutti gli strati · Mappa 2: Sociale, Manifestazioni, Conferenze, Volontariato · Mappa 3: Musica, Arte, Teatro, Cinema.')}</p>
      <button class="link" data-az="salva-preset">${tr('Salva gli strati di adesso in Mappa {n}',{n:st.preset>=0?st.preset+1:1})}</button></section>`;
  return foglio('leggero', testa, corpo);
}

/* --- Elenco --- */
function sottotitoloEv(e){
  return e.tipo==='og' ? (e.serie ? tr('Off-Grid · si ripete') : tr('Off-Grid · tuo')) : nomeStrato(e.strato);
}
const luogoBreve = e => (e.luogo||'').split(/[·,]/)[0].trim();
function rigaEv(e){
  const n = ora(), inCorso = e.a<=n && e.b>n, fin = finito(e);
  const meta = [luogoBreve(e), sottotitoloEv(e)].filter(Boolean).join(' · ');
  return `<button class="riga-ev" data-ev="${esc(e.id)}"><span class="ora${inCorso?' adesso':''}${fin?' fin':''}">${fin ? tr('finito') : inCorso ? tr('ora') : e.inizio}</span><span style="${fin?'filter:grayscale(1);opacity:.55':''}">${forma(e.tipo,e.strato,28)}</span><div><span class="t">${e.nascosto?segnoNascosto(12)+' ':''}${esc(e.titolo)}</span><span class="meta">${esc(meta)}</span></div>${inCal(e.id)&&e.tipo!=='og'?`<span class="sv" aria-label="${esc(tr('Nel calendario'))}">${icoCal()}</span>`:''}</button>`;
}
function perGiorni(lista){ const giorni = [...new Set(lista.map(e => e.giorno))]; return giorni.map(g => `<div class="giorno">${esc(titoloGiorno(g))}</div><div class="lista">${lista.filter(e => e.giorno===g).map(rigaEv).join('')}</div>`).join(''); }
function fElenco(lista, titolo, nota, conCal){
  const corpo = lista.length ? perGiorni(lista) + `<p class="nota">${nota}</p>`
    : `<div class="fatti"><div class="dato">${icoOra}<div><span class="t">${tr('Niente da mostrare')}</span><span class="meta">${ZONA.lontano && ARCHIVIO ? tr('Da lontano vedi solo quanti eventi ci sono in ogni regione. Avvicinati a una città, o sceglila dal menu delle città.') : EV.length ? tr('Prova un altro periodo o riaccendi qualche strato.') : tr('La mappa è vuota: qui compaiono gli eventi della città e i tuoi Off-Grid.')}</span></div></div></div>`;
  const testa = `<div class="riga-titolo"><div class="stack-s" style="gap:2px"><h2>${esc(titolo)}</h2><p class="meta">${lista.length===1 ? tr('1 cosa') : tr('{n} cose',{n:lista.length})}${conCal ? ' '+tr('sulla mappa') : ''}</p></div>${chiudiBtn()}</div>`;
  return foglio('medio', testa, corpo + (conCal ? `<button class="tasto sec pieno" data-az="calendario">${icoCal()}${tr('Apri il Calendario')}</button>` : ''));
}

/* --- Scheda --- */
function quando(e){
  let stato = ''; const n = ora();
  if(finito(e)){ const sparisce = new Date((e.fineMs!=null ? e.fineMs : e.b.getTime()) + EXPIRE_MS); stato = `<span class="stato grigio">${e.fine ? tr('Terminato alle {f}',{f:e.fine}) : tr('Iniziato alle {i}',{i:e.inizio})} · ${tr('sparisce dalla mappa alle {h}',{h:hm(sparisce)})}</span>`; }
  else if(e.a<=n && e.b>n) stato = `<span class="stato">${tr('In corso · finisce alle {f}',{f:e.fine})}</span>`;
  else if(e.giorno===oggi()){ const min = Math.round((e.a-n)/6e4); stato = `<span class="stato grigio">${min<60 ? tr('Tra {n} minuti',{n:min}) : (Math.round(min/60)===1 ? tr('Tra un’ora') : tr('Tra {n} ore',{n:Math.round(min/60)}))}</span>`; }
  const notte = e.fine && ymd(e.b)!==e.giorno ? ` · <strong>${tr('finisce il giorno dopo')}</strong>` : '';
  const orario = e.fine ? `${e.inizio}–${e.fine}` : tr('dalle {i}',{i:e.inizio}) + (e.raw.duration ? ' · '+esc(e.raw.duration) : '');
  return `<div class="dato">${icoOra}<div><span class="t">${esc(maiusc(titoloGiorno(e.giorno)))}</span><span><bdi dir="ltr">${orario}</bdi>${notte}</span>${stato?`<div style="margin-top:4px">${stato}</div>`:''}</div></div>`;
}
function tastoSalva(e){
  return inCal(e.id) ? `<button class="tasto fatto-ok" data-salva="${esc(e.id)}" aria-pressed="true">${spunta()}${tr('Nel calendario')}</button>`
                     : `<button class="tasto pri" data-salva="${esc(e.id)}" aria-pressed="false">${tr('Salva in calendario')}</button>`;
}
/* «Apri nelle mappe del telefono» (T-016; QB-4; § 2.5, principio 1): un collegamento geo: con le sole coordinate passa
   il punto all'app di mappe che la persona ha sul telefono, senza che l'app contatti nessuno. Dove il telefono non apre
   i collegamenti geo: (iPhone, computer) c'è «Copia indirizzo». */
const APRE_GEO = /Android/i.test(navigator.userAgent || '');
const geoLink = e => { const c = (+e.lat).toFixed(6) + ',' + (+e.lng).toFixed(6); return 'geo:' + c + '?q=' + c; };
const testoIndirizzo = e => e.luogo || ((+e.lat).toFixed(4) + ', ' + (+e.lng).toFixed(4));
const tastoMappe = e => APRE_GEO ? `<a class="tasto sec" href="${esc(geoLink(e))}">${tr('Apri nelle mappe del telefono')}</a>`
  : `<button class="tasto sec" data-copia-indirizzo="${esc(e.id)}">${st.copiato===e.id ? tr('Copiato') : tr('Copia indirizzo')}</button>`;
function pillStrato(e){ const s = S[e.strato]; if(!s) return ''; return `<span class="pillola" style="--pp:${s.pin};--pb:${s.bg};--pt:${s.text}"><span class="mini">${ICO[s.id]}</span>${esc(tr(s.label))}${e.sub?' · '+esc(tr(e.sub)):''}</span>`; }
const TEMA_PAL = {blue:{bg:'#E3F2FD',tx:'#1565C0',dot:'#1E88E5'},cyan:{bg:'#E0F7FA',tx:'#00838F',dot:'#00ACC1'},teal:{bg:'#E0F2F1',tx:'#00695C',dot:'#00897B'},rose:{bg:'#FCE4EC',tx:'#AD1457',dot:'#D81B60'},gold:{bg:'#FBF4DD',tx:'#8A6D0B',dot:'#C9A227'},slate:{bg:'#ECEFF1',tx:'#455A64',dot:'#607D8B'}};
const TEMA_FAM = {"Mobilità dolce":"blue","Ciclabili":"blue","Diritti":"blue","Educazione popolare":"blue","Sostenibilità":"cyan","Clima":"cyan","Aree verdi":"cyan","Orti urbani":"cyan","Beni comuni":"teal","Spazi autogestiti":"teal","Riuso e rigenerazione":"teal","Autoproduzione":"teal","Diritto all'abitare":"rose","Inclusione":"rose","Accoglienza e migrazione":"rose","Antirazzismo":"rose","Cultura libera":"gold","Memoria e territorio":"gold","Convivialità":"gold","Infanzia e famiglie":"gold","Accessibilità":"slate","Parità di genere":"slate","Mutualismo":"slate","Salute di comunità":"slate"};
const temaCol = t => TEMA_PAL[TEMA_FAM[t]] || TEMA_PAL.slate;
function pillTema(e){ const t = e.raw.tema; if(!t) return ''; const c = temaCol(t); return `<button class="pillola dot" data-tema="${esc(t)}" style="--pp:${c.dot};--pb:${c.bg};--pt:${c.tx}">${esc(tr(t))} ${freccia}</button>`; }
function descrizione(e){
  if(!e.desc) return '';
  const lungo = e.desc.length > 170;
  return `<p class="desc${lungo&&!st.descAperta?' chiusa':''}">${esc(e.desc)}</p>${lungo?`<button class="link" style="min-height:32px;margin-top:-10px" data-az="leggi">${st.descAperta?tr('Mostra meno'):tr('Leggi tutto')}</button>`:''}`;
}
const boxAdmin = e => st.admin && e.tipo!=='og' && !e.archivio ? `<div class="admin-box"><span class="tipo">Admin</span><div class="tasti"><button class="tasto sec" data-modifica-admin="${esc(e.id)}">${tr('Modifica')}</button><button class="tasto pericolo" data-elimina-admin="${esc(e.id)}">${tr('Elimina')}</button></div></div>` : '';
const hostDi = u => u.replace(/^https?:\/\/(www\.)?/i,'').replace(/\/$/,'');
/* ---------- Scheda dell'evento pubblico (T-023; libro mastro, §§ 5.2, 5.3 e 11.3) ----------
   Tutto ciò che serve per andare all'evento sta qui, in forma di testo: nome del luogo e indirizzo su righe proprie, la
   descrizione del luogo per gli eventi collocati a mano, l'organizzatore quando è noto, il prezzo come lo indica la fonte.
   In fondo «Fonte:» e, accanto, l'avviso breve del § 5.2. Nessun collegamento separato al sito di chi organizza: il
   collegamento è quello della fonte. La segnalazione arriva con il modulo «Segnala» (T-050). */
/* «Fonte:» (§ 5.3): il nome della fonte e, se c'è, il collegamento, che si apre solo al tocco e senza referrer (regola 3);
   se il collegamento manca o non è https, resta il nome (regola 4). */
function rigaFonte(f){
  if(!f || !f.testo) return '';
  const u = safeUrl(f.collegamento);
  return `<span class="meta"><strong style="color:var(--testo)">${tr('Fonte')}:</strong> ${u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">${esc(f.testo)}</a>` : esc(f.testo)}</span>`;
}
/* L'avviso breve accanto a «Fonte:»: il testo del § 5.2 e, per lo strato delle manifestazioni, quello per cortei e presidi. */
const avvisoFonte = e => e.strato==='manifestazioni'
  ? tr('Per cortei e presidi verifica sempre con chi organizza prima di andare: luogo e orario possono cambiare.')
  : tr('Informazioni riprese dalla fonte indicata: verifica con l’organizzatore prima di andare.');
function rigaLuogo(e){
  const nome = e.nomeLuogo || '', ind = e.indirizzo || (nome ? '' : e.luogo || '');
  if(!nome && !ind && !e.descLuogo) return '';
  return `<div class="dato dato-luogo">${icoLuogo}<div>${nome?`<span class="t nome-luogo">${esc(nome)}</span>`:''}${ind?`<span class="indirizzo">${esc(ind)}</span>`:''}${e.descLuogo?`<span class="come-arrivare"><strong>${tr('Come arrivare')}:</strong> ${esc(e.descLuogo)}</span>`:''}</div></div>`;
}
function fScheda(e){
  if(!e) return '';
  let testa, corpo; const x = e.raw;
  if(e.tipo==='evento'){
    const man = e.strato==='manifestazioni';
    testa = `<div class="riga-titolo"><div class="pill-row">${pillStrato(e)}${pillTema(e)}</div>${chiudiBtn()}</div>
      <div class="scheda-testa"><span style="${finito(e)?'filter:grayscale(1);opacity:.6':''}">${forma('evento',e.strato,40)}</span><div><div class="eyebrow" style="color:var(--testo-2)">${e.nascosto ? icoLucchetto(12)+' '+tr('Evento nascosto, sbloccato con la password') : tr('Evento')}</div><h2>${esc(e.titolo)}</h2></div></div>
      ${finito(e)?'':`<div class="tasti tasti-testa">${tastoSalva(e)}${tastoMappe(e)}</div>`}`;
    corpo = `<div class="fatti">${quando(e)}
        ${rigaLuogo(e)}
        ${e.organizzatore?`<div class="dato dato-organizzatore">${icoOrg}<div><span class="meta">${tr('Organizza')}</span><span class="t">${esc(e.organizzatore)}</span></div></div>`:''}
        ${e.prezzo?`<div class="dato dato-prezzo">${icoPrezzo}<div><span class="t">${esc(e.prezzo)}</span><span class="meta">${tr('Prezzo indicato dalla fonte')}</span></div></div>`:''}</div>
      ${descrizione(e)}
      <div class="fonte${man?' attenzione':''}">${rigaFonte(e.fonte)}
        <span class="meta avviso-fonte">${avvisoFonte(e)}</span></div>${boxAdmin(e)}`;
  } else {
    const serie = e.serie ? EV.filter(y => y.serie===e.serie) : null, links = (x.links && x.links.length ? x.links : (x.link ? [x.link] : [])).map(normLink).filter(Boolean);
    const repTesto = serie && x.rep ? `${repLabel(x.rep.freq, e.giorno)}${x.rep.until?' · '+tr('fino al {d}',{d:dIso(x.rep.until).toLocaleDateString(dloc(),{day:'numeric',month:'long'})}):''} · ${tr('{n} date',{n:serie.length})}` : '';
    const prec = {map:tr('Punto scelto da te sulla mappa'), street:tr('Civico non in mappa: punto sulla via'), nonum:tr('Senza numero civico')}[x.addrPrecision] || '';
    testa = `<div class="riga-titolo"><div class="pill-row"><span class="pillola dot" style="--pp:var(--verde);--pb:var(--verde-tenue);--pt:var(--verde)">${tr('Off-Grid · lo vedi solo tu')}</span></div>${chiudiBtn()}</div>
      <div class="scheda-testa">${forma('og',null,40)}<div><div class="eyebrow" style="color:var(--verde)">${tr('Il tuo evento')}</div><h2>${esc(e.titolo)}</h2></div></div>`;
    corpo = `<div class="fatti">${quando(e)}
        ${serie?`<div class="dato">${icoRipeti}<div><span class="t">${tr('Si ripete')}</span><span class="meta">${esc(repTesto)}. ${tr('Sulla mappa vedi solo la prossima data, le altre sono nel calendario.')}</span></div></div>`:''}
        ${e.luogo?`<div class="dato">${icoLuogo}<div><span class="t">${esc(e.luogo)}</span>${prec?`<span class="meta">${prec}</span>`:''}</div></div>`:''}
        ${e.desc?`<div class="dato">${icoNote}<div><span style="white-space:pre-wrap">${esc(e.desc)}</span></div></div>`:''}
        ${links.map(l => `<div class="dato">${icoLink}<div><a href="${esc(l)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">${esc(hostDi(l))}</a></div></div>`).join('')}</div>
      <div class="tasti">${tastoMappe(e)}<button class="tasto sec" data-giornata="${e.giorno}">${icoCal()}${tr('La mia giornata')}</button></div>
      <div class="tasti"><button class="tasto sec" data-modifica="${esc(e.id)}">${tr('Modifica')}</button><button class="tasto pericolo" data-elimina="${esc(e.id)}">${tr('Elimina')}</button></div>
      <div class="og-box">${GLIFO_OG}<span class="meta" style="color:var(--testo)">${tr('Vive solo nella memoria di questo telefono: non passa da nessun server. È già nel tuo calendario e sparisce dalla mappa tre ore dopo la fine; nel calendario resta per tre mesi.')}</span></div>`;
  }
  return foglio('forte medio', testa, corpo);
}

/* ======================= Calendario: Giornata · Mese · Agenda (OG 1.3–1.4) ======================= */
const MEZZI = {piedi:{l:'a piedi', v:4.8, att:0}, bici:{l:'in bici', v:14, att:2}, mezzi:{l:'con i mezzi', v:16, att:8}};
function distKm(a,b){ const R = 6371, r = Math.PI/180, dLa = (b.lat-a.lat)*r, dLn = (b.lng-a.lng)*r; const h = Math.sin(dLa/2)**2 + Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLn/2)**2; return 2*R*Math.asin(Math.sqrt(h))*1.4; }
function minuti(k, m){ const M = MEZZI[m]; return k<0.05 ? 0 : Math.max(1, Math.round(M.att + k/M.v*60)); }
function giornata(g){
  const tutte = miei().filter(e => e.giorno===g).sort((a,b) => a.a-b.a);
  const vive = tutte.filter(e => !sparito(e));
  const tratti = vive.slice(1).map((t,i) => {
    const p = vive[i], k = distKm(p,t), min = minuti(k, st.cal.mezzo);
    const parte = p.b>p.a ? p.b.getTime() : p.a.getTime()+36e5, arriva = parte + min*6e4, margine = Math.round((t.a - arriva)/6e4);
    const sovrapp = t.a.getTime() < parte;
    const alt = Object.keys(MEZZI).filter(m => m!==st.cal.mezzo).map(m => ({m, min:minuti(k,m)})).filter(x => parte + x.min*6e4 <= t.a.getTime());
    const libero = (t.a.getTime() - min*6e4) - parte;
    const stato = sovrapp ? 'sovrapp' : margine < 0 ? 'stretto' : libero >= 36e5 ? 'buco' : 'ok';
    return {k, min, margine, arriva, parte, libero, alt, stato, da:p, a:t};
  });
  return {tutte, vive, tratti};
}
function disegnaGiornataMappa(){
  const d = giornata(st.cal.giorno), feats = [];
  d.tratti.forEach(t => {
    feats.push({type:'Feature', properties:{c: t.stato==='stretto'||t.stato==='sovrapp' ? '#B4541C' : (temaAttuale()==='dark'?'#86B795':'#2D5A3D')}, geometry:{type:'LineString', coordinates:[[t.da.lng,t.da.lat],[t.a.lng,t.a.lat]]}});
    const etich = t.stato==='sovrapp' ? tr('si sovrappone') : durata(t.min) + (t.stato==='stretto' ? ' · '+tr('stretto') : '');
    mettiSegnaposto(`<span class="tratto-lbl ${t.stato==='stretto'?'stretto':t.stato==='sovrapp'?'sovrapp':''}">${esc(etich)}</span>`, (t.da.lng+t.a.lng)/2, (t.da.lat+t.a.lat)/2, 'mk-lbl');
  });
  try{ const s = map.getSource('agr-percorso'); if(s) s.setData({type:'FeatureCollection', features:feats}); }catch(e){}
  d.vive.forEach((t,i) => mettiSegnaposto(`<button class="tappa${t.tipo==='og'?' og':''}" style="--pc:${colorePin(t)}" data-ev="${esc(t.id)}" aria-label="${esc(tr('Tappa {n}: {t}',{n:i+1,t:t.titolo}))}">${i+1}</button>`, t.lng, t.lat, 'mk-tappa alto'));
}
function rigaTappa(t, i){
  const fin = sparito(t);
  return `<button class="tappa-r" data-ev="${esc(t.id)}"><span class="n${t.tipo==='og'?' og':''}" style="--pc:${colorePin(t)}${fin?';opacity:.5':''}">${fin?spunta(14):i+1}</span><div><span class="t">${esc(t.titolo)}</span><span class="meta"><bdi dir="ltr">${t.inizio}${t.fine?'–'+t.fine:''}</bdi>${t.luogo?' · '+esc(t.luogo):''}</span><span class="meta">${esc(sottotitoloEv(t))}${fin?' · '+tr('concluso'):''}</span></div></button>`;
}
function vGiornata(){
  const g = st.cal.giorno, d = giornata(g);
  const tot = d.tratti.reduce((s,t) => s+t.k, 0), mov = d.tratti.reduce((s,t) => s+t.min, 0);
  let lista = '', n = 0;
  d.tutte.forEach(t => {
    const viva = !sparito(t);
    if(viva && n>0){ const x = d.tratti[n-1];
      const avv = x.stato==='sovrapp' ? `<span class="avviso-r sovrapp">${tr('Si sovrappone alla tappa {n}',{n})}</span>`
        : x.stato==='stretto' ? `<span class="avviso-r stretto">${tr('Tempo stretto: arrivi {m} dopo l’inizio',{m:durata(-x.margine)})}${x.alt.length?' · '+esc(x.alt.map(a => tr(maiusc(MEZZI[a.m].l))+' '+durata(a.min)).join(', ')):''}</span>`
        : x.stato==='buco' ? `<span class="avviso-r buco">${tr('Libero {d}',{d:durata(x.libero/6e4)})}</span><button class="link" style="min-height:32px" data-aggiungi="${g}|${hm(new Date(Math.ceil(x.parte/3e5)*3e5))}">${tr('+ Aggiungi qui')}</button>` : `<span>${tr('{m} di margine',{m:durata(x.margine)})}</span>`;
      lista += `<div class="tratto-r"><span><b>${durata(x.min)}</b> ${tr(MEZZI[st.cal.mezzo].l)} · ${km(x.k)}</span>${avv}</div>`; }
    lista += rigaTappa(t, n); if(viva) n++;
  });
  const conc = d.tutte.length - d.vive.length;
  return `<div class="giro"><button class="frc" data-giorno-cal="${piuGiorni(g,-1)}" aria-label="${esc(tr('Giorno prima'))}">${frecciaSx}</button><div><strong>${esc(maiusc(titoloGiorno(g)))}</strong><span class="meta">${d.vive.length ? `${d.vive.length===1?tr('1 tappa'):tr('{n} tappe',{n:d.vive.length})}${d.tratti.length?` · ${km(tot)} · ${tr('{d} in movimento',{d:durata(mov)})}`:''}` : tr('Nessuna tappa')}${conc?' · '+tr('{n} concluse',{n:conc}):''}</span>${g!==oggi()?`<button class="link" style="min-height:28px;align-self:center;margin:0 auto" data-giorno-cal="${oggi()}">${tr('Torna a oggi')}</button>`:''}</div><button class="frc" data-giorno-cal="${piuGiorni(g,1)}" aria-label="${esc(tr('Giorno dopo'))}">${frecciaDx}</button></div>
    ${d.vive.length>1?`<div class="seg" role="group">${Object.entries(MEZZI).map(([k,m]) => `<button data-mezzo="${k}" aria-pressed="${st.cal.mezzo===k}">${tr(maiusc(m.l))}</button>`).join('')}</div>`:''}
    ${d.tutte.length?`<div class="lista" style="padding:4px 0">${lista}</div>${d.vive.length>1?`<p class="meta">${tr('Tempi stimati in linea d’aria per 1,4: non tengono conto di traffico e orari dei mezzi. La mappa sopra mostra il percorso numerato.')}</p>`:''}<button class="tasto pri pieno" data-aggiungi="${g}|">${tr('+ Aggiungi un Off-Grid')}</button>`
      :`<div class="fatti"><div class="dato">${icoCal()}<div><span class="t">${tr('Niente in questo giorno')}</span><span class="meta">${tr('Salva un evento dalla mappa o aggiungi un tuo Off-Grid.')}</span></div></div></div><button class="tasto pri pieno" data-aggiungi="${g}|">${tr('+ Aggiungi un Off-Grid')}</button>`}`;
}
function vMese(){
  const y = st.cal.y, m = st.cal.m, primo = new Date(y,m,1), off = (primo.getDay()+6)%7, giorniMese = new Date(y,m+1,0).getDate();
  const gb = giorniBrevi();
  let celle = gb.map(g => `<span class="gs">${esc(g)}</span>`).join('');
  for(let i=0;i<off;i++) celle += `<button class="vuota" tabindex="-1" aria-hidden="true"></button>`;
  const tuttiMiei = miei();
  for(let d=1; d<=giorniMese; d++){
    const s = ymd(new Date(y,m,d)), mm = tuttiMiei.filter(e => e.giorno===s);
    const og = mm.filter(e => e.tipo==='og').length, sv = mm.length-og;
    /* i due pallini dicono che cosa c'è nel giorno: il lettore di schermo lo dice a parole (T-025) */
    const cosa = [og ? (og===1 ? tr('1 Off-Grid') : tr('{n} Off-Grid',{n:og})) : '', sv ? (sv===1 ? tr('1 evento salvato') : tr('{n} eventi salvati',{n:sv})) : ''].filter(Boolean);
    celle += `<button data-giorno-cal="${s}" class="${s===oggi()?'oggi':''}${s<oggi()?' passato':''}" aria-label="${esc([titoloGiorno(s)].concat(cosa).join(', '))}">${d}<span class="punti">${og?'<span class="punto og"></span>':''}${sv?'<span class="punto sv"></span>':''}</span></button>`;
  }
  const prima = new Date(y,m-1,1), dopo = new Date(y,m+1,1);
  return `<div class="giro"><button class="frc" data-mese="${prima.getFullYear()}-${prima.getMonth()}" aria-label="${esc(tr('Mese prima'))}">${frecciaSx}</button><div><strong>${esc(maiusc(nomeMese(y,m)))}</strong></div><button class="frc" data-mese="${dopo.getFullYear()}-${dopo.getMonth()}" aria-label="${esc(tr('Mese dopo'))}">${frecciaDx}</button></div>
    <div class="cal">${celle}</div>
    <div class="pill-row"><span class="meta" style="display:inline-flex;align-items:center;gap:6px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--verde)"></span>${tr('tuoi Off-Grid')}</span><span class="meta" style="display:inline-flex;align-items:center;gap:6px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;border:1.5px solid var(--verde)"></span>${tr('dalla città')}</span></div>
    <p class="meta">${tr('Tocca un giorno per vederlo come giornata. Gli Off-Grid passati restano qui per tre mesi.')}</p>`;
}
function vAgenda(){
  const l = miei().filter(e => !sparito(e)).sort((a,b) => a.a-b.a);
  return l.length ? perGiorni(l) : `<div class="fatti"><div class="dato">${icoCal()}<div><span class="t">${tr('Il calendario è vuoto')}</span><span class="meta">${tr('Tocca «Salva in calendario» su un evento della mappa, o aggiungi un tuo Off-Grid.')}</span></div></div></div>`;
}
function fCalendario(){
  const v = st.cal.vista;
  const testa = `<div class="riga-titolo"><div><h2>${tr('Il mio Calendario')}</h2><p class="meta">${tr('Eventi salvati dalla città e tuoi Off-Grid · solo su questo telefono')}</p></div>${chiudiBtn()}</div>
    <div style="display:flex;gap:8px"><div class="seg" style="flex:1" role="group">${[['giornata',tr('Giornata')],['mese',tr('Mese')],['agenda',tr('Agenda')]].map(([k,l]) => `<button data-vista="${k}" aria-pressed="${v===k}">${l}</button>`).join('')}</div><button class="tasto sec tasto-pdf" style="flex:none;min-height:44px" data-az="pdf" aria-label="${esc(tr('PDF: scarica o condividi'))}">PDF ${icoCondividi()}</button></div>`;
  return foglio('forte medio', testa, v==='giornata' ? vGiornata() : v==='mese' ? vMese() : vAgenda());
}
function basePdf(){ return st.pdf.giornata ? giornata(st.pdf.giornata).vive : miei().filter(e => !sparito(e)).sort((a,b) => a.a-b.a); }
function fPdf(){
  const base = basePdf(), scelti = base.filter(e => !st.pdf.tolti.has(e.id));
  const titolo = st.pdf.giornata ? tr('La mia giornata') : tr('Il mio calendario');
  const sotto = st.pdf.giornata ? maiusc(titoloGiorno(st.pdf.giornata)) : tr('Dal {d}',{d:dIso(oggi()).toLocaleDateString(dloc(),{day:'numeric',month:'long'})});
  const giorni = [...new Set(scelti.map(e => e.giorno))];
  const testa = `<div class="riga-titolo"><div><h2>${tr('Anteprima PDF')}</h2><p class="meta">${tr('Togli quello che non vuoi stampare.')}</p></div>${chiudiBtn('indietro-cal')}</div>`;
  const corpo = base.length ? `<div class="lista">${base.map(e => `<button class="menu-r" data-pdf="${esc(e.id)}" aria-pressed="${!st.pdf.tolti.has(e.id)}"><span class="casella">${!st.pdf.tolti.has(e.id)?spunta(14):''}</span><div><span class="t">${esc(e.titolo)}</span><span class="meta">${st.pdf.giornata?'':esc(titoloGiorno(e.giorno))+' · '}${e.inizio}${e.fine?'–'+e.fine:''}</span></div></button>`).join('')}</div>
    <div class="carta"><div class="cm">${esc(NOME)} · ${esc(cittaObj().n)}</div><div class="ct">${titolo}</div><div class="cm" style="text-transform:none;letter-spacing:0;font-weight:500">${esc(sotto)}</div>
      ${giorni.map(g => `${st.pdf.giornata?'':`<div class="cm" style="margin-top:4px">${esc(titoloGiorno(g))}</div>`}${scelti.filter(e => e.giorno===g).map(e => `<div class="pr"><b>${e.inizio}</b><span><strong>${esc(e.titolo)}</strong>${e.luogo?'<br>'+esc(e.luogo):''}${e.tipo==='og'&&e.desc?`<span class="nt">${esc(e.desc)}</span>`:''}</span></div>`).join('')}`).join('')}
      <div class="cp">${tr('Stampato da {nome}. Verifica orari e luoghi con chi organizza.')}</div></div>
    <button class="tasto pri pieno tasto-pdf" style="justify-content:center" data-az="scarica-pdf" ${scelti.length?'':'disabled'}>${icoCondividi()}${tr('Condividi o scarica il PDF · {n}',{n:scelti.length})}</button>
    <button class="link" data-az="stampa-pdf" ${scelti.length?'':'disabled'}>${tr('Oppure stampalo')}</button>
    <p class="meta">${tr('Niente link: il PDF è un file, lo mandi tu a chi vuoi con le app del telefono.')}</p>`
    : `<p class="meta">${tr('Niente da stampare.')}</p>`;
  return foglio('forte alto', testa, corpo);
}
/* librerie caricate solo quando servono (il telefono non le scarica all'apertura) */
const SCRIPT = {};
function caricaScript(url){ return SCRIPT[url] || (SCRIPT[url] = new Promise((ok, no) => { const x = document.createElement('script'); x.src = url; x.async = true; x.onload = () => ok(); x.onerror = () => { delete SCRIPT[url]; no(new Error('script')); }; document.head.appendChild(x); })); }
/* Librerie ospitate con l'app, a versione fissa (T-007; sorgenti/vendor/): nessuna richiesta a servizi esterni. */
const URL_JSPDF = 'lib/jspdf-2.5.1/jspdf.umd.min.js';
const URL_XLSX = 'lib/sheetjs-0.18.5/xlsx.full.min.js';
function preparaPdf(){ return lang==='ar' ? Promise.resolve() : caricaScript(URL_JSPDF); }
function scaricaBlob(blob, nome){ const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
/* i caratteri dei font standard del PDF (latino): il resto si toglie */
const WINANSI = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
const pulisci = t => String(t==null?'':t).replace(/[\u2009\u202F\u00A0]/g,' ').replace(/[\u2010-\u2012]/g,'-').split('').filter(c => c.charCodeAt(0) < 256 || WINANSI.includes(c)).join('');
function creaPdf(scelti){
  const {jsPDF} = window.jspdf; const doc = new jsPDF({unit:'mm', format:'a4'});
  const titolo = st.pdf.giornata ? tr('La mia giornata') : tr('Il mio calendario');
  const sotto = st.pdf.giornata ? maiusc(titoloGiorno(st.pdf.giornata)) : tr('Dal {d}',{d:dIso(oggi()).toLocaleDateString(dloc(),{day:'numeric',month:'long'})});
  const X = 16, W = 178, COL = 34; let y = 18;
  const riga = (t, font, stile, size, col, x, w) => { doc.setFont(font, stile); doc.setFontSize(size); doc.setTextColor(col); const l = doc.splitTextToSize(pulisci(t), w); doc.text(l, x, y); return l.length * size * 0.42; };
  const spazio = h => { if(y + h > 282){ doc.addPage(); y = 18; } };
  riga(NOME.toUpperCase() + ' · ' + cittaObj().n.toUpperCase(), 'helvetica', 'bold', 8, '#5C5246', X, W); y += 8;
  y += riga(titolo, 'times', 'bold', 22, '#1C1712', X, W) + 1;
  y += riga(sotto, 'helvetica', 'normal', 11, '#5C5246', X, W) + 4;
  const giorni = [...new Set(scelti.map(e => e.giorno))];
  giorni.forEach(g => {
    if(!st.pdf.giornata){ spazio(16); y += 3; doc.setDrawColor('#D8CFC2'); doc.line(X, y - 4, X + W, y - 4); y += riga(maiusc(titoloGiorno(g)).toUpperCase(), 'helvetica', 'bold', 8.5, '#5C5246', X, W) + 2; }
    scelti.filter(e => e.giorno===g).forEach(e => {
      const extra = [e.luogo, sottotitoloEv(e) + (e.prezzo ? ' · ' + formatPrice(e.prezzo) : '')].filter(Boolean).join('\n');
      doc.setFontSize(9.5); const hExtra = doc.splitTextToSize(pulisci(extra), W - COL).length * 4 + (e.tipo==='og' && e.desc ? doc.splitTextToSize(pulisci(e.desc), W - COL).length * 4 : 0);
      spazio(8 + hExtra);
      const y0 = y; riga(e.inizio + (e.fine ? '–' + e.fine : ''), 'helvetica', 'bold', 11, '#2F5D46', X, COL - 2);
      y += riga(e.titolo, 'helvetica', 'bold', 11, '#1C1712', X + COL, W - COL) + 0.5;
      if(extra) y += riga(extra, 'helvetica', 'normal', 9.5, '#5C5246', X + COL, W - COL);
      if(e.tipo==='og' && e.desc) y += riga(e.desc, 'helvetica', 'italic', 9.5, '#5C5246', X + COL, W - COL);
      y = Math.max(y, y0 + 6) + 4;
    });
  });
  spazio(12); doc.setDrawColor('#D8CFC2'); doc.line(X, y, X + W, y); y += 5;
  riga(tr('Stampato da {nome}. Verifica orari e luoghi con chi organizza.'), 'helvetica', 'normal', 8.5, '#5C5246', X, W);
  return doc.output('blob');
}
/* «Condividi o scarica»: sul telefono si apre il foglio delle app (WhatsApp, posta…); altrimenti il file si scarica */
async function condividiPdf(){
  const scelti = basePdf().filter(e => !st.pdf.tolti.has(e.id)); if(!scelti.length) return;
  if(lang==='ar') return stampaPdf();   /* i font standard del PDF non hanno l'arabo: si stampa dal browser */
  try{ await preparaPdf(); }catch(e){ return stampaPdf(); }
  let blob; try{ blob = creaPdf(scelti); }catch(e){ return stampaPdf(); }
  const nome = (st.pdf.giornata ? nomeFile() + '-giornata-' + st.pdf.giornata : nomeFile() + '-calendario-' + oggi()) + '.pdf';
  const file = typeof File==='function' ? new File([blob], nome, {type:'application/pdf'}) : null;
  if(file && navigator.canShare && navigator.canShare({files:[file]})){
    try{ await navigator.share({files:[file], title:nome}); }catch(e){ if(e && e.name!=='AbortError') scaricaBlob(blob, nome); }
  } else scaricaBlob(blob, nome);
}
function stampaPdf(){
  const scelti = basePdf().filter(e => !st.pdf.tolti.has(e.id)); if(!scelti.length) return;
  const titolo = st.pdf.giornata ? tr('La mia giornata') : tr('Il mio calendario');
  const sotto = st.pdf.giornata ? maiusc(titoloGiorno(st.pdf.giornata)) : '';
  const giorni = [...new Set(scelti.map(e => e.giorno))];
  const righe = giorni.map(g => `<tr><td colspan="3" class="day">${esc(maiusc(titoloGiorno(g)))}</td></tr>` + scelti.filter(e => e.giorno===g).map(e =>
    `<tr><td class="tm">${e.inizio}${e.fine?'–'+e.fine:''}</td><td class="tt">${esc(e.titolo)}${e.tipo==='og'&&e.desc?`<div class="nt">${esc(e.desc)}</div>`:''}</td><td>${esc(e.luogo)}<div class="nt">${esc(sottotitoloEv(e))}${e.prezzo?' · '+esc(formatPrice(e.prezzo)):''}</div></td></tr>`).join('')).join('');
  const html = `<!DOCTYPE html><html lang="${lang}" dir="${lang==='ar'?'rtl':'ltr'}"><head><meta charset="UTF-8"><title>${esc(titolo)} · ${esc(NOME)}</title><style>body{font-family:Georgia,serif;max-width:760px;margin:24px auto;color:#1c1712;padding:0 16px}h1{font-size:24px;margin:0 0 2px;font-weight:400}p{font-size:12px;color:#5c5246;margin:0 0 18px;font-family:Helvetica,Arial,sans-serif}.m{text-transform:uppercase;letter-spacing:.08em;font-size:11px}table{width:100%;border-collapse:collapse;font-family:Helvetica,Arial,sans-serif}td{padding:8px 10px;border-bottom:1px solid #e3ddd0;font-size:12px;vertical-align:top}td.day{background:#f5f0e8;font-weight:700;font-size:13px;border-top:2px solid #cfc6b4}td.tm{white-space:nowrap;color:#5c5246;font-weight:700}td.tt{font-weight:600}.nt{font-weight:400;color:#5c5246;font-size:11px;margin-top:2px;white-space:pre-wrap}.f{margin-top:18px;font-size:11px;color:#5c5246;font-family:Helvetica,Arial,sans-serif}</style></head><body><p class="m">${esc(NOME)} · ${esc(cittaObj().n)}</p><h1>${esc(titolo)}</h1><p>${esc(sotto)}</p><table><tbody>${righe}</tbody></table><p class="f">${tr('Stampato da {nome}. Verifica orari e luoghi con chi organizza.')}</p></body></html>`;
  const url = URL.createObjectURL(new Blob([html], {type:'text/html'}));
  const w = window.open(url, '_blank');
  if(w){ setTimeout(() => { try{ w.print(); }catch(e){} }, 700); setTimeout(() => URL.revokeObjectURL(url), 60000); }
  else { const a = document.createElement('a'); a.href = url; a.download = nomeFile() + '-calendario.html'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
}


/* ======================= Indirizzi: solo Photon, solo il testo scritto (T-008) =======================
   La ricerca parte soltanto quando la persona scrive in Cerca o nel campo indirizzo (Off-Grid; modulo e
   importazione della redazione). A Photon arriva il testo scritto, con parametri fissi uguali per tutti:
   niente posizione, niente centro o zoom della mappa, niente città scelta (libro mastro, §§ 2.2 e 3.8;
   informativa, sezione 3). Le proposte vicine alla città scelta si mettono prima qui, sul telefono.
   L'indirizzo del servizio viene da config.js; le richieste partono senza credenziali e senza referrer. */
const RICERCA = ((CFG.indirizzi || {}).ricerca_indirizzi || '').replace(/\/+$/, '');
const cacheGeo = {};
function getJ(u, sig){
  if(cacheGeo[u]) return Promise.resolve(cacheGeo[u]);
  return fetch(u, {signal:sig, credentials:'omit', referrerPolicy:'no-referrer', headers:{'Accept-Language':'it'}})
    .then(r => { if(!r.ok) throw 0; return r.json(); }).then(j => { cacheGeo[u] = j; return j; });
}
/* Vicino alla città scelta: dentro i suoi confini o entro 25 km dal centro. Calcolo solo sul telefono. */
function vicinoCitta(r){
  const c = cittaObj();
  if(c.bounds){ const [[o,s],[e,n]] = c.bounds; return r.lng>=o-0.1 && r.lng<=e+0.1 && r.lat>=s-0.1 && r.lat<=n+0.1; }
  const [la,lo] = c.center || [45.0703,7.6869], dy = (r.lat-la)*111, dx = (r.lng-lo)*111*Math.cos(la*Math.PI/180);
  return dx*dx + dy*dy < 25*25;
}
const norm = x => (x||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
function parseAddr(q){
  const parts = q.split(',').map(x => x.trim()).filter(Boolean);
  const first = (parts[0]||'').replace(/\b(n\.?|n°|nr\.?|civico)\s*(?=\d)/ig,'');
  let num = '', street = first, m;
  if((m = first.match(/^(.*?\D)\s+(\d+\s?[a-zA-Z]?(?:\/\s?[a-zA-Z0-9]+)?)$/))){ street = m[1].trim(); num = m[2].replace(/\s/g,''); }
  else if((m = first.match(/^(\d+[a-zA-Z]?)\s+(.+)$/))){ num = m[1]; street = m[2]; }
  let rest = parts.slice(1);
  if(!num && rest.length && /^\d+\s?[a-zA-Z]?(\/[a-zA-Z0-9]+)?$/.test(rest[0])){ num = rest[0].replace(/\s/g,''); rest = rest.slice(1); }
  const city = rest.join(', ').replace(/\b\d{5}\b/g,'').replace(/\(\s*[A-Z]{2}\s*\)|\b[A-Z]{2}\b$/g,'').replace(/\s{2,}/g,' ').replace(/^[\s,]+|[\s,]+$/g,'');
  return {street, num, city};
}
function fullLine(r){
  const l1 = r.street ? (r.street + (r.hn ? ' '+r.hn : '')) : '';
  const l2 = ((r.postcode ? r.postcode+' ' : '') + (r.city||'')).trim() + (r.prov ? ' ('+r.prov+')' : '');
  return [l1, l2].filter(Boolean).join(', ');
}
function fromPhoton(f){
  const p = f.properties||{}, g = f.geometry && f.geometry.coordinates; if(!g) return null;
  const type = p.type||'', isStreet = type==='street' || p.osm_key==='highway' || (p.osm_key==='place' && p.osm_value==='square');
  const r = {lat:g[1], lng:g[0], name:'', street:p.street||'', hn:p.housenumber||'', postcode:p.postcode||'', city:p.city||p.town||p.village||p.locality||'', prov:'', county:p.county||''};
  if(isStreet){ r.street = r.street || p.name || ''; r.kind = 'street'; }
  else if(['city','town','village','locality','district','county','state'].includes(type)){ r.kind = 'place'; r.name = p.name||''; }
  else if(p.name){ r.kind = 'poi'; r.name = p.name; }
  else r.kind = 'house';
  return r;
}
/* Parametri fissi: testo, numero di proposte e riquadro dell'Italia, uguali per chiunque cerchi. */
function photon(q, sig){
  if(!RICERCA) return Promise.resolve([]);
  return getJ(RICERCA+'/api/?q='+encodeURIComponent(q)+'&limit=15&bbox=6.6,36.6,18.6,47.1', sig)
    .then(j => { const tutte = (j.features||[]).map(fromPhoton).filter(Boolean);
      return tutte.filter(vicinoCitta).concat(tutte.filter(r => !vicinoCitta(r))); })
    .catch(() => []); }
const streetMatches = (r, pa) => { const a = norm(pa.street), b = norm(r.street||r.name); return !!a && !!b && (a===b || b.indexOf(a)>=0 || a.indexOf(b)>=0); };
const cityMatches = (r, pa) => { if(!pa.city) return true; const a = norm(pa.city), b = norm(r.city); return !b || a===b || b.indexOf(a)>=0 || a.indexOf(b)>=0; };
function lookup(q, sig){
  const pa = parseAddr(q);
  return photon(q, sig).then(ph => build(ph, pa));
}
function build(all, pa){
  const out = [], seen = {};
  const push = r => { const k = (fullLine(r)+'|'+(r.name||'')).toLowerCase(); if(seen[k]) return; seen[k] = 1; out.push(r); };
  if(pa.num){
    const want = norm(pa.num);
    const exact = all.filter(r => r.hn && norm(r.hn)===want && streetMatches(r,pa) && cityMatches(r,pa));
    exact.forEach(r => { r.precision = 'exact'; push(r); });
    if(!exact.length){
      const st0 = all.filter(r => (r.kind==='street'||r.kind==='house'||r.street) && streetMatches(r,pa) && cityMatches(r,pa))[0];
      if(st0){ const syn = {lat:st0.lat, lng:st0.lng, name:'', street:st0.street||st0.name, hn:pa.num, postcode:st0.postcode, city:st0.city||pa.city, prov:st0.prov, kind:'street', precision:'street'};
        const near = all.filter(r => r.hn && streetMatches(r,pa) && cityMatches(r,pa)).sort((a,b) => Math.abs(parseInt(a.hn)-parseInt(pa.num)) - Math.abs(parseInt(b.hn)-parseInt(pa.num)))[0];
        if(near){ syn.lat = near.lat; syn.lng = near.lng; syn.postcode = syn.postcode || near.postcode; }
        push(syn); }
    }
  }
  all.forEach(r => { if(!r.precision) r.precision = r.hn ? 'exact' : (r.kind==='poi' ? 'exact' : 'nonum'); push(r); });
  return {list:out.slice(0,7), pa};
}
const testoRisultato = r => { const full = fullLine(r); return (r.kind==='poi' && r.name) ? (r.name + (full ? ', '+full : '')) : (full || r.name || r.city || ''); };
function htmlRisultato(r){
  const full = fullLine(r);
  if(r.kind==='poi' && r.name) return `<div class="m">${esc(r.name)}</div>${full?`<div class="s">${esc(full)}</div>`:''}`;
  if(r.kind==='place') return `<div class="m">${esc(r.name||r.city)}</div><div class="s">${esc(r.county||'')}</div>`;
  return `<div class="m">${esc(full||r.name)}</div>${r.precision==='street'?`<div class="w">${tr('Civico non in mappa · punto sulla via')}</div>`:''}`;
}
/* suggerimenti condivisi da Cerca, form Off-Grid e form admin */
const sugg = {t:null, ctrl:null, lista:[], dove:null};
function chiediSuggerimenti(testo, dove, box){
  clearTimeout(sugg.t); testo = (testo||'').trim();
  if(testo.length<3){ sugg.lista = []; if($(box)) $(box).innerHTML = ''; return; }
  sugg.t = setTimeout(() => {
    if(sugg.ctrl) try{ sugg.ctrl.abort(); }catch(e){}
    sugg.ctrl = window.AbortController ? new AbortController() : null;
    lookup(testo, sugg.ctrl && sugg.ctrl.signal).then(res => {
      const el = $(box); if(!el) return; sugg.lista = res.list; sugg.dove = dove;
      if(dove==='cerca'){ el.innerHTML = res.list.length ? `<div class="giorno">${tr('Luoghi e indirizzi')}</div><div class="lista">${res.list.map((r,i) => `<button class="luogo-r" data-si="${i}">${icoLuogo}<div>${htmlRisultato(r)}</div>${freccia}</button>`).join('')}</div>` : ''; return; }
      const piede = (!res.pa.num && res.list.some(r => r.kind==='street')) ? `<div class="sugg-foot">${tr('Aggiungi il numero civico per un punto preciso')}</div>` : '';
      el.innerHTML = res.list.length ? `<div class="sugg">${res.list.map((r,i) => `<button data-si="${i}">${icoLuogo}<div style="flex:1;min-width:0">${htmlRisultato(r)}</div></button>`).join('')}${piede}</div>`
        : `<div class="sugg"><button disabled><div class="meta">${tr('Nessun risultato: prova solo via e città')}</div></button></div>`;
    }).catch(() => {});
  }, 300);
}

/* ======================= Cerca ======================= */
function risultatiEventi(){
  const q = norm(st.q); if(q.length<2) return '';
  const ev = EV.filter(e => e.suMappa && !sparito(e) && nascostoOk(e) && serieOk(e) && norm([e.titolo, e.luogo, e.desc, e.sub, nomeStrato(e.strato), e.raw.tema].join(' ')).includes(q)).sort((a,b) => a.a-b.a);
  return ev.length ? `<div class="giorno">${tr('Eventi · {n}',{n:ev.length})}</div><div class="lista">${ev.slice(0,12).map(rigaEv).join('')}</div>` : `<p class="meta">${tr('Nessun evento con «{q}».',{q:esc(st.q)})}</p>`;
}
function fCerca(){
  const testa = `<div class="riga-titolo"><h2>${tr('Cerca')}</h2>${chiudiBtn()}</div>
    <label class="campo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="2"/><path d="m20 20-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><input id="q" type="search" enterkeyhint="search" placeholder="${esc(tr('Eventi, luoghi, indirizzi'))}" value="${esc(st.q)}" autocomplete="off"></label>`;
  const sbl = EV.filter(e => e.nascosto && st.sbloccati.has(e.raw.hiddenPassword));
  const corpo = `<div id="risultati" class="stack">${risultatiEventi()}</div><div id="risultati-luoghi" class="stack"></div>
    <div class="fonte avanzato"><span class="meta"><strong style="color:var(--testo)">${tr('Ricerca avanzata')}</strong>: ${tr('periodo, prezzo e strati sono i filtri sopra la mappa, e valgono anche qui.')}</span>
      <div class="tasti"><button class="tasto sec" data-az="date">${icoGiorni()}${tr('Periodo')}</button><button class="tasto sec" data-az="strati">${icoStrati}${tr('Prezzo e strati')}</button></div></div>
    <div class="fonte"><span class="meta"><strong style="color:var(--testo)">${tr('Ti hanno dato la password di un evento nascosto?')}</strong> ${tr('Inseriscila qui: l’evento compare sulla mappa solo per te.')}</span>
      <div style="display:flex;gap:8px"><label class="campo" style="flex:1"><input id="pw" type="text" autocapitalize="none" spellcheck="false" placeholder="${esc(tr('Password dell’evento'))}" autocomplete="off"></label><button class="tasto sec" style="flex:none" data-az="sblocca">${icoLucchetto(14)}${tr('Sblocca')}</button></div>
      <span class="err" id="pw-err" hidden>${tr('Nessun evento nascosto con questa password.')}</span>
      ${sbl.length?`<div class="lista">${sbl.map(rigaEv).join('')}</div>`:''}</div>`;
  return foglio('forte alto', testa, corpo);
}
function cercaInvio(){
  const q = st.q.trim(); if(q.length<3) return;
  if(sugg.lista.length && sugg.dove==='cerca') return scegliLuogo(0);
  const el = $('risultati-luoghi'); if(el) el.innerHTML = `<p class="caricamento">${tr('Cerco…')}</p>`;
  lookup(q).then(res => { if(!$('risultati-luoghi')) return; sugg.lista = res.list; sugg.dove = 'cerca';
    if(res.list.length===1) return scegliLuogo(0);
    $('risultati-luoghi').innerHTML = res.list.length ? `<div class="giorno">${tr('Luoghi e indirizzi')}</div><div class="lista">${res.list.map((r,i) => `<button class="luogo-r" data-si="${i}">${icoLuogo}<div>${htmlRisultato(r)}</div>${freccia}</button>`).join('')}</div>` : `<p class="meta">${tr('Nessun indirizzo trovato. Prova a scrivere solo via e città.')}</p>`; });
}
function scegliLuogo(i){
  const r = sugg.lista[i]; if(!r) return;
  st.cercaQui = {lat:r.lat, lng:r.lng}; st.foglio = null; disegnaFoglio(); disegnaPins(); posizioni();
  if(map) map.flyTo({center:[r.lng, r.lat], zoom:Math.max(map.getZoom(), 16.5), padding:{top:0,bottom:0,left:0,right:0}, duration:800});
}

/* ======================= Scegli i giorni ======================= */
function fDate(){
  const g0 = dIso(oggi()), lun = new Date(g0); lun.setDate(g0.getDate() - ((g0.getDay()+6)%7));
  let celle = giorniBrevi().map(g => `<span class="gs">${esc(g)}</span>`).join('');
  for(let i=0;i<35;i++){
    const d = new Date(lun.getFullYear(), lun.getMonth(), lun.getDate()+i), s = ymd(d), passato = s < oggi();
    const ha = EV.some(e => e.suMappa && e.giorno===s && !finito(e) && nascostoOk(e));
    const a = st.da, b = st.a || st.da, estremo = s===a || s===b, dentro = a && s>a && s<b;
    celle += `<button data-giorno="${s}" ${passato?'disabled':''} class="${estremo?'estremo':dentro?'dentro':''}${s===oggi()?' oggi':''}" aria-label="${esc(titoloGiorno(s))}">${d.getDate()}${d.getDate()===1||i===0?`<small>${esc(d.toLocaleDateString(dloc(),{month:'short'}))}</small>`:''}<span class="punti">${ha&&!passato?'<span class="punto"></span>':''}</span></button>`;
  }
  const n = st.da ? EV.filter(e => e.suMappa && !finito(e) && nascostoOk(e) && e.giorno>=st.da && e.giorno<=(st.a||st.da)).length : 0;
  const testa = `<div class="riga-titolo"><div class="stack-s" style="gap:2px"><h2>${tr('Scegli i giorni')}</h2><p class="meta">${tr('Tocca il primo giorno, poi l’ultimo. Il puntino dice che quel giorno c’è qualcosa.')}</p></div>${chiudiBtn()}</div>`;
  const corpo = `<div class="cal">${celle}</div><button class="tasto pri pieno" data-az="mostra-date" ${st.da?'':'disabled'}>${st.da ? tr('Mostra {g} sulla mappa · {n}',{g:esc(intervallo()), n}) : tr('Scegli almeno un giorno')}</button>`;
  return foglio('forte', testa, corpo);
}

/* ======================= Form Off-Grid (OG 1.0–1.6) ======================= */
const AIUTO = () => tr('<p><b>Che cos’è un evento Off-Grid?</b><br>È un tuo appuntamento: vive solo nella memoria di questo dispositivo, non passa da nessun server e nessuno oltre a te può vederlo. Ti serve per organizzare la giornata sulla mappa e nel calendario, accanto agli eventi della città.</p><p><b>Perché non posso ancora pubblicarlo per tutti?</b><br>Pubblicare un evento <i>on-grid</i> vuol dire affidarci i dati tuoi e di chi lo organizza. Oggi {nome} è un progetto indipendente, senza ancora una società alle spalle in grado di custodirli con le garanzie che meritano: preferiamo non raccoglierli piuttosto che raccoglierli male.</p>');
function repLabel(freq, giorno){
  const d = dIso(giorno||oggi()), gs = d.toLocaleDateString(dloc(),{weekday:'long'});
  return {none:tr('Non si ripete'), daily:tr('Ogni giorno'), weekdays:tr('Dal lunedì al venerdì'), weekly:tr('Ogni {g}',{g:gs}), biweekly:tr('Ogni 2 settimane, di {g}',{g:gs}), monthly:tr('Ogni mese, il giorno {n}',{n:d.getDate()})}[freq||'none'];
}
function repDates(first, freq, until){
  const out = []; if(!freq || freq==='none') return [first];
  let d = dIso(first); const end = dIso(until), day0 = d.getDate(); let i = 0;
  while(d<=end && out.length<400 && i<2000){ i++;
    const dow = d.getDay();
    if(freq==='daily') out.push(ymd(d));
    else if(freq==='weekdays'){ if(dow>=1 && dow<=5) out.push(ymd(d)); }
    else if(freq==='weekly' || freq==='biweekly'){ out.push(ymd(d)); d = new Date(d.getFullYear(), d.getMonth(), d.getDate()+(freq==='weekly'?7:14)); continue; }
    else if(freq==='monthly'){ const y = d.getFullYear(), mo = d.getMonth(), nd = new Date(y,mo,day0); if(nd.getMonth()===mo && nd>=dIso(first) && nd<=end) out.push(ymd(nd)); d = new Date(y,mo+1,1); continue; }
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate()+1);
  }
  return out;
}
const serieDi = raw => raw && raw.seriesId ? events.filter(x => x.seriesId===raw.seriesId).sort((a,b) => (a.datetime||'').localeCompare(b.datetime||'')) : (raw ? [raw] : []);
const autoFine = t => { const p = t.split(':'); const x = ((+p[0])*60 + (+p[1]) + 60) % 1440; return pad(Math.floor(x/60))+':'+pad(x%60); };
const piuMesi = (s,n) => { const d = dIso(s); d.setMonth(d.getMonth()+n); return ymd(d); };
function apriForm(raw, preset){
  preset = preset || {};
  const n = new Date(); n.setSeconds(0,0); const m = n.getMinutes(); n.setMinutes(m + ((15 - m%15)%15 || 15));
  const f = {id:null, raw:null, titolo:'', indirizzo:'', addrFull:'', pos:null, precision:'', hn:'', giorno:preset.giorno||ymd(n), inizio:preset.inizio||hm(n), fine:'', fineToccata:false, rep:'none', fino:'', note:'', links:[''], err:{}, aiuto:!!preset.aiuto};
  if(raw){ Object.assign(f, {id:raw.id, raw, titolo:raw.title||'', indirizzo:raw.address||'', addrFull:raw.addressFull||raw.address||'', pos:{lat:+raw.lat, lng:+raw.lng}, precision:raw.addrPrecision||'exact', hn:raw.addrNum||'',
    giorno:(raw.datetime||'').slice(0,10), inizio:(raw.datetime||'').slice(11,16), fine:(raw.end||'').slice(11,16), fineToccata:true, note:raw.notes||'', links:(raw.links&&raw.links.length?raw.links.slice():(raw.link?[raw.link]:[''])) }); }
  else { if(preset.fine){ f.fine = preset.fine; f.fineToccata = true; } else f.fine = autoFine(f.inizio); }
  if(preset.pos){ f.pos = preset.pos; f.precision = 'map'; }
  f.fino = piuMesi(f.giorno, 3);
  st.form = f; st.sel = null; st.posa = null; disegnaPosa(); apri('form');
  if(!raw && !preset.pos && !preset.aiuto) setTimeout(() => { const t = $('f-titolo'); if(t) t.focus(); }, 80);
}
/* Pressione prolungata (T-009; libro mastro, § 2.2): le coordinate del punto, calcolate qui, con il solo tasto
   «Copia». Nessuna richiesta a servizi, nessun salvataggio: il punto vive solo finché il foglio resta aperto.
   Formato universale: latitudine prima, punto decimale, quattro decimali («45.0703, 7.6869»). */
const testoPunto = p => p.lat.toFixed(4) + ', ' + p.lng.toFixed(4);
function mostraPunto(p){
  if(st.sezione!=='mappa' || (st.foglio && !['strati','elenco','gruppo','scheda','punto'].includes(st.foglio))) return;
  st.punto = p; st.sel = null; st.puntoCopiato = false; apri('punto');
}
function fPunto(){
  const p = st.punto; if(!p) return '';
  const testa = `<div class="riga-titolo"><h2>${tr('Punto sulla mappa')}</h2>${chiudiBtn()}</div>`;
  const corpo = `<div class="stack-s"><span class="etich">${tr('Latitudine, longitudine')}</span>
      <p class="coordinate" id="punto-testo" dir="ltr" translate="no">${testoPunto(p)}</p></div>
    <div class="tasti"><button class="tasto pri" data-az="copia-punto">${st.puntoCopiato ? tr('Copiato') : tr('Copia')}</button></div>
    <p class="meta" id="punto-esito" role="status" aria-live="polite">${st.puntoCopiato===null ? esc(tr('Copia non riuscita: tieni premuto sul testo per selezionarlo.')) : ''}</p>`;
  return foglio('forte', testa, corpo);
}
/* Copia un testo negli appunti del telefono; se il browser non lo consente, prova la via vecchia. Promessa di vero o falso. */
function copiaTesto(t){
  const aMano = () => { try{ const a = document.createElement('textarea'); a.value = t; a.setAttribute('readonly',''); a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); const ok = document.execCommand('copy'); a.remove(); return ok; }catch(e){ return false; } };
  if(navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(() => true, () => aMano());
  return Promise.resolve(aMano());
}
function copiaPunto(){
  const p = st.punto; if(!p) return;
  copiaTesto(testoPunto(p)).then(ok => { if(st.punto!==p) return; st.puntoCopiato = ok ? true : null; disegnaFoglio(); });
}
function copiaIndirizzo(id){
  const e = byId(id); if(!e) return; const t = testoIndirizzo(e);
  copiaTesto(t).then(ok => { if(ok){ st.copiato = id; if(st.foglio==='scheda') disegnaFoglio(); } else avviso(tr('Non riesco a copiare. L’indirizzo è: {a}',{a:t}), null, true); });
}
function boxPunto(f){
  if(!f.pos) return '';
  const T = {exact:[tr('Registriamo questo punto'), tr('Numero civico trovato sulla mappa.'), false],
    street:[tr('Registriamo questo punto · verifica'), tr('Il civico {n} non è presente sulla mappa: il punto è sulla via. Tocca «Scegli sulla mappa» per spostarlo sul portone giusto.',{n:esc(f.hn)}), true],
    nonum:[tr('Registriamo questo punto · verifica'), tr('Nessun numero civico: il punto è al centro della via o del luogo. Aggiungi il civico o scegli sulla mappa per essere precisi.'), true],
    map:[tr('Registriamo questo punto'), tr('Punto scelto da te sulla mappa.'), false]}[f.precision||'map'] || [tr('Registriamo questo punto'),'',false];
  return `<div class="punto-ok${T[2]?' avviso':''}"><span style="font-weight:600">${T[0]}</span><span class="meta" style="color:var(--testo)">${T[1]}</span>${f.addrFull||f.indirizzo?`<span class="meta">${esc(f.addrFull||f.indirizzo)}</span>`:''}</div>`;
}
function aggiornaPunto(){ const b = $('f-punto'); if(b && st.form) b.innerHTML = boxPunto(st.form); }
function notaFine(f){
  if(!f.inizio || !f.fine) return '';
  if(f.fine===f.inizio) return `<span class="err">${tr('L’orario di fine coincide con l’inizio: cambialo')}</span>`;
  if(f.fine < f.inizio) return `<span class="stato grigio">${tr('Finisce il giorno dopo: {g} alle {o}',{g:esc(nomeGiorno(piuGiorni(f.giorno,1))), o:esc(f.fine)})}</span>`;
  return '';
}
function notaRep(f){ if(f.rep==='none') return ''; if(!f.fino || f.fino < f.giorno) return `<span class="err">${tr('La data di fine ripetizione deve essere dopo il primo giorno')}</span>`; if(f.fino > piuMesi(f.giorno,12)) return `<span class="err">${tr('Al massimo un anno di ripetizioni')}</span>`; return tr('{n} date in calendario',{n:repDates(f.giorno,f.rep,f.fino).length}); }
function fForm(){
  const f = st.form, mod = !!f.id, serie = mod && f.raw.seriesId ? serieDi(f.raw) : null;
  const testa = `<div class="riga-titolo"><div style="display:flex;gap:10px;align-items:center"><h2>${mod?tr('Modifica evento Off-Grid'):tr('Nuovo evento Off-Grid')}</h2><button class="aiuto-btn" data-az="aiuto" aria-expanded="${f.aiuto}" aria-label="${esc(tr('Che cos’è un evento Off-Grid?'))}">?</button></div>${chiudiBtn()}</div>
    <p class="meta">${tr('Solo su questo dispositivo · lo vedi solo tu')}</p>${f.aiuto?`<div class="bolla" role="note">${AIUTO()}</div>`:''}`;
  const corpo = `
    <div class="stack-s"><label class="etich" for="f-titolo">${tr('Titolo')}</label><div class="campo${f.err.titolo?' errore':''}"><input id="f-titolo" data-campo="titolo" maxlength="100" value="${esc(f.titolo)}" placeholder="${esc(tr('es. Caffè con Giulia'))}" autocomplete="off"></div>${f.err.titolo?`<span class="err">${tr('Dai un nome al tuo appuntamento')}</span>`:''}</div>
    <div class="stack-s"><label class="etich" for="f-indirizzo">${tr('Indirizzo')}</label><div class="campo${f.err.indirizzo?' errore':''}">${icoLuogo}<input id="f-indirizzo" data-campo="indirizzo" value="${esc(f.indirizzo)}" placeholder="${esc(tr('Via e numero civico, città'))}" autocomplete="off"></div>
      <div id="f-sugg"></div>${f.err.indirizzo?`<span class="err">${esc(f.err.indirizzo===2?tr('Indirizzo non trovato: scegline uno dai suggerimenti o usa la mappa.'):tr('Scegli un indirizzo dai suggerimenti o dalla mappa'))}</span>`:''}
      <div id="f-punto">${boxPunto(f)}</div>
      <button class="link" data-az="scegli-mappa">${icoLuogo} ${tr('Scegli sulla mappa')}</button></div>
    <div class="stack-s"><span class="etich">${tr('Giorno')}</span><div class="chips-in"><button class="chip-in" data-fgiorno="${oggi()}" aria-pressed="${f.giorno===oggi()}">${tr('Oggi')}</button><button class="chip-in" data-fgiorno="${domani()}" aria-pressed="${f.giorno===domani()}">${tr('Domani')}</button><label class="campo" style="flex:1;min-height:36px;min-width:150px"><input id="f-giorno" type="date" data-campo="giorno" value="${esc(f.giorno)}" aria-label="${esc(tr('Giorno'))}"></label></div></div>
    <div class="stack-s"><div class="due"><div class="stack-s"><label class="etich" for="f-inizio">${tr('Inizio')}</label><div class="campo${f.err.inizio?' errore':''}"><input id="f-inizio" type="time" step="300" data-campo="inizio" value="${esc(f.inizio)}"></div></div>
      <div class="stack-s"><label class="etich" for="f-fine">${tr('Fine')}</label><div class="campo"><input id="f-fine" type="time" step="300" data-campo="fine" value="${esc(f.fine)}"></div></div></div>
      ${f.err.inizio?`<span class="err">${tr('Indica almeno giorno e orario di inizio')}</span>`:''}<div id="f-fine-nota">${notaFine(f)}</div></div>
    ${!mod?`<div class="stack-s"><label class="etich" for="f-rep">${tr('Ripetizione')}</label><div class="campo"><select id="f-rep" data-campo="rep">${['none','daily','weekdays','weekly','biweekly','monthly'].map(r => `<option value="${r}" ${f.rep===r?'selected':''}>${esc(repLabel(r,f.giorno))}</option>`).join('')}</select></div>
      <div class="due" style="align-items:center"><label class="etich" for="f-fino">${tr('Fino al')}</label><div class="campo${f.rep==='none'?' spento':''}"><input id="f-fino" type="date" data-campo="fino" value="${esc(f.fino)}" min="${esc(f.giorno)}" max="${esc(piuMesi(f.giorno,12))}" ${f.rep==='none'?'disabled':''}></div></div>
      <span class="meta" id="f-rep-nota">${notaRep(f)}</span></div>`
      : serie && serie.length>1 ? `<div class="fonte"><span class="meta"><strong style="color:var(--testo)">${tr('Fa parte di una serie: {r} · {n} date',{r:esc(repLabel(f.raw.rep&&f.raw.rep.freq,(f.raw.datetime||'').slice(0,10))), n:serie.length})}</strong> ${tr('Scegli in fondo se salvare le modifiche solo per questa data o per tutta la serie.')}</span></div>` : ''}
    <div class="stack-s"><label class="etich" for="f-note">${tr('Note')} <span class="fac">${tr('facoltativo')}</span></label><div class="campo"><textarea id="f-note" data-campo="note" maxlength="1000" placeholder="${esc(tr('Cosa portare, con chi, promemoria…'))}">${esc(f.note)}</textarea></div></div>
    <div class="stack-s"><span class="etich">${tr('Link utili')} <span class="fac">${tr('facoltativo')}</span></span>
      ${f.links.map((l,i) => `<div class="campo">${icoLink}<input data-link="${i}" type="url" inputmode="url" value="${esc(l)}" placeholder="https://" autocomplete="off" aria-label="${esc(tr('Link {n}',{n:i+1}))}">${f.links.length>1?`<button class="chiudi" style="margin:0" data-togli-link="${i}" aria-label="${esc(tr('Togli il link'))}">${croce}</button>`:''}</div>`).join('')}
      ${f.links.length<5?`<button class="link" data-az="aggiungi-link">${tr('+ Aggiungi un link')}</button>`:''}</div>
    ${serie && serie.length>1 ? `<div class="stack-s"><button class="tasto pri pieno col" data-salva-form="una">${tr('Salva solo questa data')}<small>${esc(nomeGiorno(f.giorno))}</small></button><button class="tasto sec pieno col" data-salva-form="serie">${tr('Salva tutta la serie')}<small>${tr('{n} date, ognuna nel suo giorno',{n:serie.length})}</small></button></div>`
      : `<div class="tasti"><button class="tasto sec" data-az="chiudi">${tr('Annulla')}</button><button class="tasto pri" data-salva-form="una">${mod?tr('Salva modifiche'):tr('Salva sulla mappa')}</button></div>`}
    ${mod?`<button class="tasto pericolo pieno" data-elimina="${esc(f.id)}">${tr('Elimina')}</button>`:''}
    ${st.admin&&!mod?`<button class="link" data-az="admin-ongrid">${tr('Admin: crea invece un evento on-grid completo')} ${freccia}</button>`:''}`;
  return foglio('forte alto', testa, corpo);
}
function salvaForm(modo){
  const f = st.form; if(!f) return; f.err = {};
  if(!f.titolo.trim()) f.err.titolo = 1;
  if(!f.giorno || !f.inizio) f.err.inizio = 1;
  if(f.fine && f.fine===f.inizio) f.err.fine = 1;
  if(!f.id && f.rep!=='none' && (!f.fino || f.fino<f.giorno || f.fino>piuMesi(f.giorno,12))) f.err.rep = 1;
  if(!f.pos && !f.err.titolo && !f.err.inizio){
    const q = f.indirizzo.trim();
    if(q.length<3){ f.err.indirizzo = 1; disegnaFoglio(); return; }
    const b = $('f-punto'); if(b) b.innerHTML = `<p class="caricamento">${tr('Cerco l’indirizzo…')}</p>`;
    lookup(q).then(res => { if(st.form!==f) return;
      if(res.list.length){ const r = res.list[0]; f.indirizzo = testoRisultato(r); f.addrFull = f.indirizzo; f.precision = r.precision||'exact'; f.hn = r.hn||''; f.pos = {lat:r.lat, lng:r.lng}; disegnaFoglio(); const p = $('f-punto'); if(p && p.scrollIntoView) p.scrollIntoView({block:'center', behavior:'smooth'}); }
      else { f.err.indirizzo = 2; disegnaFoglio(); } });
    return;
  }
  if(!f.pos) f.err.indirizzo = 1;
  if(Object.keys(f.err).length){ disegnaFoglio(); return; }
  const date = f.giorno, start = f.inizio, end = f.fine;
  const sdt = date+'T'+start; let edt = '';
  if(end){ if(end<start) edt = piuGiorni(date,1)+'T'+end; else edt = date+'T'+end; }
  const endOff = edt ? Math.round((dIso(edt.slice(0,10)) - dIso(date))/864e5) : 0;
  const links = f.links.map(normLink).filter(Boolean);
  const campi = {title:f.titolo.trim(), address:f.indirizzo.trim(), addressFull:f.addrFull||f.indirizzo.trim(), addrPrecision:f.precision||'exact', addrNum:f.hn||'', lat:f.pos.lat, lng:f.pos.lng,
    datetime:sdt, end:edt, duration:'', notes:f.note.trim(), description:f.note.trim(), links, link:links[0]||'', offgrid:true, personal:true, category:'', sublayer:'', hidden:false, hiddenPassword:'', price:''};
  let primo;
  if(f.id){
    const ev = rawById(f.id);
    if(ev && modo==='serie' && ev.seriesId){
      serieDi(ev).forEach(x => { const dd = x.id===ev.id ? date : (x.datetime||'').slice(0,10), f2 = Object.assign({}, campi); f2.datetime = dd+'T'+start; f2.end = end ? piuGiorni(dd,endOff)+'T'+end : ''; Object.assign(x, f2); });
    } else if(ev) Object.assign(ev, campi);
    primo = f.id;
  } else {
    const dates = repDates(date, f.rep, f.rep==='none' ? date : f.fino), sid = f.rep!=='none' ? 'ser'+Date.now().toString(36) : '', b = Date.now().toString(36);
    dates.forEach((dd,k) => {
      const f2 = Object.assign({}, campi); f2.datetime = dd+'T'+start; if(end) f2.end = piuGiorni(dd,endOff)+'T'+end;
      const nid = 'og'+b+(dates.length>1 ? '-'+k : ''); if(!k) primo = nid;
      const obj = Object.assign({id:nid, createdAt:new Date().toISOString()}, f2);
      if(sid){ obj.seriesId = sid; obj.rep = {freq:f.rep, until:f.fino}; }
      events.push(obj); calEvents[nid] = true;
    });
    saveCal();
  }
  saveEvents(); ricostruisci(); st.form = null; st.tipi.og = true;
  const e = byId(primo); if(e && !visibile(e)){ st.tempo = 'tutto'; st.salvatiSolo = false; }
  selezionaEv(primo);
}
/* --- Conferma eliminazione (Off-Grid: solo questo giorno o tutta la serie) --- */
function fConferma(){
  const raw = rawById(st.conferma.id); if(!raw) return '';
  const serie = raw.seriesId ? serieDi(raw) : null;
  const testa = `<div class="riga-titolo"><h2>${serie&&serie.length>1 ? tr('Questo evento si ripete. Cosa vuoi eliminare?') : tr('Eliminare «{t}»?',{t:esc(raw.title)})}</h2>${chiudiBtn('annulla-conferma')}</div>`;
  const corpo = serie && serie.length>1
    ? `<button class="tasto pericolo pieno col" data-elimina-ok="una">${tr('Solo questo giorno')}<small>${esc(nomeGiorno((raw.datetime||'').slice(0,10)))}</small></button><button class="tasto pericolo-pieno tasto pieno" data-elimina-ok="serie">${tr('Tutta la serie ({n} date)',{n:serie.length})}</button><button class="tasto sec pieno" data-az="annulla-conferma">${tr('Annulla')}</button>`
    : `<p class="meta">${tr('Sparisce dalla mappa e dal calendario di questo telefono.')}</p><div class="tasti"><button class="tasto sec" data-az="annulla-conferma">${tr('Annulla')}</button><button class="tasto pericolo-pieno" data-elimina-ok="una">${tr('Elimina')}</button></div>`;
  return foglio('forte', testa, corpo);
}
function elimina(id, modo){
  const raw = rawById(id); if(!raw) return;
  const via = modo==='serie' && raw.seriesId ? serieDi(raw) : [raw], ids = new Set(via.map(x => x.id));
  events = events.filter(x => !ids.has(x.id)); ids.forEach(i => delete calEvents[i]);
  saveEvents(); saveCal(); ricostruisci();
  st.conferma = null; st.foglio = null; st.sel = null; st.form = null; disegnaFoglio(); tutto();
}

/* ======================= Posa del segnaposto (Scegli sulla mappa) ======================= */
function disegnaPosa(){
  const slot = $('posa-slot'); civiciMappa();
  if(!st.posa){ slot.innerHTML = ''; return; }
  slot.innerHTML = `<span class="posa-ombra"></span><svg class="posa-croce" width="40" height="52" viewBox="0 0 30 38" aria-hidden="true"><path d="M15 36.5C15 36.5 2 23.5 2 14.2 2 7 7.8 1.5 15 1.5S28 7 28 14.2C28 23.5 15 36.5 15 36.5Z" fill="var(--verde)" stroke="#fff" stroke-width="2"/><circle cx="15" cy="14" r="5.2" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="15" cy="14" r="1.8" fill="#fff"/></svg>
    <div class="vetro posa-testa" role="status"><div style="font-weight:600">${tr('Sposta la mappa sul punto')}</div><div class="meta">${tr('Il segno resta fermo al centro: trascina la mappa sotto.')}</div></div>
    <div class="posa-barra vetro"><div class="tasti"><button class="tasto sec" data-az="posa-annulla">${tr('Annulla')}</button><button class="tasto pri" data-az="posa-ok">${tr('Conferma')}</button></div></div>`;
}
function iniziaPosa(chi){
  const f = chi==='aform' ? st.aform : st.form; if(!f) return;
  st.posa = chi; st.foglio = null; disegnaFoglio(); disegnaPins(); disegnaPosa(); posizioni();
  if(f.pos && map) map.jumpTo({center:[f.pos.lng, f.pos.lat], zoom:Math.max(map.getZoom(), 17), padding:{top:0,bottom:0,left:0,right:0}});
}
function finePosa(ok){
  const chi = st.posa, f = chi==='aform' ? st.aform : st.form; st.posa = null; disegnaPosa();
  if(ok && f && map){
    const c = map.getCenter(); f.pos = {lat:c.lat, lng:c.lng}; f.precision = 'map'; if(f.err) f.err.indirizzo = 0;
    /* nessuna ricerca inversa (T-008): resta ciò che la persona ha scritto, altrimenti «Punto scelto sulla mappa» */
    if(!String(f.indirizzo||'').trim()) f.indirizzo = tr('Punto scelto sulla mappa');
    f.addrFull = f.indirizzo;
  }
  st.foglio = chi; disegnaFoglio(); posizioni();
}


/* ======================= Impostazioni, documenti, città ======================= */
const LEGALI = {"en":{"privacy":"<span class=\"legal-badge\">Version 1.2 · March 2026</span><p style=\"font-size:.7rem;opacity:.6;margin:0 0 8px;\">Courtesy translation — the Italian version is the binding one.</p><h3>1. Data controller</h3><p><strong>Nomeprova</strong>, a project by <strong>Lorenzo Calcagno</strong>, Turin<br>Contact: <span class=\"segnaposto\">[casella di contatto]</span></p><h3>2. What data we process and why</h3><p>Nomeprova is an interactive map of urban events in Turin. <strong>It does not collect personal data from users browsing the map</strong>: no accounts, no profiling cookies, no tracking systems.</p><p>The only data processed concerns <strong>event organizers</strong> who request publication: title, location, time, description, and possibly a stage name or the organization's name.</p><p>We also process event information from <strong>publicly accessible sources</strong> (websites, public social pages), where the organizer knowingly chose to make it public.</p><h3>3. Legal basis for processing</h3><ul><li><strong>Explicit consent (art. 6(1)(a) GDPR)</strong> — for organizers who contact us directly. Consent is documented and stored.</li><li><strong>Legitimate interest (art. 6(1)(f) GDPR)</strong> — for events from public sources. The balancing test is documented internally. You may object at any time by writing to <span class=\"segnaposto\">[casella di contatto]</span>.</li></ul><h3>4. How long we keep data</h3><p>Each event's data is <strong>automatically deleted 3 hours after the event ends</strong>. There is no historical archive. Consent records are kept for a maximum of 3 years from the event date.</p><h3>5. Who can see the data</h3><p>Event information is visible to anyone visiting Nomeprova. <strong>No data is transferred, sold or disclosed to third parties</strong> for commercial or marketing purposes.</p><h3>6. Data transfer outside the EU</h3><p>Nomeprova does not transfer personal data to non-EU countries. The map display uses <strong>CartoDB/Carto</strong> for geographic imagery. That service may record the user's IP address under its privacy policy available at <a href=\"https://carto.com/privacy\" target=\"_blank\" rel=\"noopener noreferrer\" referrerpolicy=\"no-referrer\">carto.com/privacy</a>. Carto Inc. operates under Standard Contractual Clauses approved by the European Commission.</p><h3>7. Your rights (arts. 15–21 GDPR)</h3><p>You may exercise the rights of access, rectification, erasure, restriction, objection and portability at any time. Event removal requests are carried out within <strong>48 hours</strong>. Write to <span class=\"segnaposto\">[casella di contatto]</span> — we reply within 30 days.</p><h3>8. Complaint to the supervisory authority</h3><p>You may lodge a complaint with the Italian Data Protection Authority: <a href=\"https://www.garanteprivacy.it\" target=\"_blank\" rel=\"noopener noreferrer\" referrerpolicy=\"no-referrer\">garanteprivacy.it</a> · Piazza Venezia 11, 00187 Rome</p><h3>9. Automated decisions</h3><p>Nomeprova performs no profiling or automated decision-making.</p>","storage":"<span class=\"legal-badge\">Only on your device · No server</span><p style=\"font-size:.7rem;opacity:.6;margin:0 0 8px;\">Courtesy translation — the Italian version is the binding one.</p><h3>What is saved on your device</h3><p>Nomeprova uses only local technical storage. <strong>No data is ever transmitted to external servers</strong> by these tools.</p><h3>localStorage</h3><p>Stores on your device:</p><ul><li>The events shown on the map</li><li>The chosen theme (Light / Dark)</li><li>Your personal calendar of saved events</li><li>The per-layer filter state</li></ul><p>Data in localStorage remains until it is cleared manually or until events expire automatically.</p><h3>Legal basis</h3><p>These tools are equivalent to <strong>technical cookies</strong> under the Italian DPA measure of 10 June 2021 and are <strong>exempt from prior consent</strong>.</p><p>No profiling cookies, analytics cookies or third-party tracking tools are used.</p><h3>Third-party map services</h3><p>The map display uses two external services that receive the user's IP address each time geographic imagery loads:</p><ul><li><strong>CartoDB/Carto</strong> — provides the map imagery. Privacy policy: <a href=\"https://carto.com/privacy\" target=\"_blank\" rel=\"noopener noreferrer\" referrerpolicy=\"no-referrer\">carto.com/privacy</a>. Operates under EU Standard Contractual Clauses.</li><li><strong>OpenStreetMap</strong> — open-source base map. Privacy policy: <a href=\"https://osmfoundation.org/wiki/Privacy_Policy\" target=\"_blank\" rel=\"noopener noreferrer\" referrerpolicy=\"no-referrer\">osmfoundation.org/wiki/Privacy_Policy</a>.</li></ul><p>Nomeprova has no access to and does not control this data.</p><h3>How to clear local data</h3><p>You can clear all of Nomeprova local data at any time from your browser settings (Settings → Privacy → Clear browsing data → Site data).</p>","disclaimer":"<span class=\"legal-badge\">Important notices</span><p style=\"font-size:.7rem;opacity:.6;margin:0 0 8px;\">Courtesy translation — the Italian version is the binding one.</p><h3>Accuracy of information</h3><p>Event information from external public sources <strong>may not be up to date</strong>. <strong>We recommend always checking with the organizer</strong> before setting out.</p><p>To report an event that is no longer valid: <span class=\"segnaposto\">[casella di contatto]</span> — we remove it within 48 hours.</p><h3>Responsibility for content</h3><p>Nomeprova aggregates already publicly available information without altering it. For events loaded from public sources, Nomeprova is not liable for changes, deletions or inaccuracies relative to the original source at the time of acquisition.</p><h3>Political events, demonstrations and pickets</h3><p>For events of a political nature, demonstrations, marches and pickets, <strong>preliminary verification with the organizer is essential</strong> before setting out. Nomeprova assumes no responsibility for consequences arising from presence at locations indicated on the map in relation to events of this kind.</p><h3>Regulatory compliance of events</h3><p>Nomeprova <strong>does not verify the compliance of events</strong> with public-entertainment regulations, occupancy permits or licenses required by law. Responsibility for an event's lawfulness lies solely with the organizer.</p><h3>Intellectual property</h3><p>Event texts and descriptions belong to their respective organizers. Nomeprova claims no rights over the content of published events.</p><h3>Contacts</h3><p>For any legal request: <span class=\"segnaposto\">[casella di contatto]</span><br>Data controller: Lorenzo Calcagno, Turin</p>"},"es":{"privacy":"","storage":"","disclaimer":""},"fr":{"privacy":"","storage":"","disclaimer":""},"ar":{"privacy":"","storage":"","disclaimer":""}};
function fImpostazioni(){
  const scuro = temaAttuale()==='dark';
  const testa = `<div class="riga-titolo"><h2>${tr('Impostazioni')}</h2>${chiudiBtn()}</div>`;
  const corpo = `
    <section class="sezione"><div class="tipo">${tr('Aspetto')}</div><div class="seg" role="group"><button data-tema-set="light" aria-pressed="${!scuro}">${tr('Chiaro')}</button><button data-tema-set="dark" aria-pressed="${scuro}">${tr('Scuro')}</button></div>
      <button class="riga-int" data-az="semplice" aria-pressed="${st.semplice}"><div><span class="t">${tr('Modalità semplice')}</span><span class="meta">${tr('Testi più grandi e meno comandi: niente sottocategorie e combinazioni.')}</span></div><span class="interr" aria-hidden="true"></span></button></section>
    <section class="sezione"><div class="tipo">${tr('Lingua')}</div><div class="seg" role="group">${['it','en','es','fr','ar'].map(l => `<button data-lingua="${l}" aria-pressed="${lang===l}" lang="${l}">${l.toUpperCase()}</button>`).join('')}</div></section>
    <section class="sezione"><div class="tipo">${tr('Aiuto')}</div><div class="menu-lista"><button class="menu-r" data-az="guida">${icoNote}<div><span class="t">${tr('Rivedi la guida')}</span><span class="meta">${tr('I cartellini che compaiono alla prima apertura')}</span></div>${freccia}</button><button class="menu-r" data-az="aiuto-og">${GLIFO_OG}<div><span class="t">${tr('Che cos’è un evento Off-Grid?')}</span></div>${freccia}</button></div></section>
    <section class="sezione"><div class="tipo">${tr('Documenti')}</div><div class="menu-lista">
      <button class="menu-r" data-legale="privacy"><div><span class="t">${tr('Informativa sulla privacy')}</span><span class="meta">${tr('Quali dati, perché, i tuoi diritti')}</span></div>${freccia}</button>
      <button class="menu-r" data-legale="storage"><div><span class="t">${tr('Dati locali')}</span><span class="meta">${tr('Cosa resta su questo telefono')}</span></div>${freccia}</button>
      <button class="menu-r" data-legale="disclaimer"><div><span class="t">${tr('Note legali')}</span><span class="meta">${tr('Accuratezza, manifestazioni, responsabilità')}</span></div>${freccia}</button>
      <a class="menu-r" href="licenze/index.html" target="_blank" rel="noopener noreferrer"><div><span class="t">${tr('Licenze dei componenti')}</span><span class="meta">${tr('Mappa, librerie e caratteri: testi integrali')}</span></div>${freccia}</a></div>
      <p class="meta">${tr('Scrivici')}: ${casellaHtml('mail')}</p></section>
    <section class="sezione"><div class="tipo">${tr('Area riservata')}</div>
      ${st.admin ? `<button class="riga-int" data-az="admin"><div><span class="t">${tr('Sei in modalità admin')}</span><span class="meta">${tr('Eventi on-grid, importa ed esporta in Excel, esci')}</span></div>${freccia}</button>`
        : st.adminPw ? `<div style="display:flex;gap:8px"><label class="campo${st.adminErr?' errore':''}" style="flex:1"><input id="adminpw" type="password" placeholder="${esc(tr('Password admin'))}" autocomplete="off"></label><button class="tasto sec" style="flex:none" data-az="entra-admin">${tr('Entra')}</button></div>${st.adminErr?`<span class="err">${tr('Password non riconosciuta.')}</span>`:''}`
        : `<button class="link" data-az="mostra-admin">${tr('Accesso admin')}</button>`}</section>`;
  return foglio('forte alto', testa, corpo);
}
function fLegale(){
  const T = {privacy:tr('Informativa privacy'), storage:tr('Dati locali'), disclaimer:tr('Note legali')};
  const testo = (lang!=='it' && LEGALI[lang] && LEGALI[lang][st.legale]) || ($('leg-'+st.legale) ? $('leg-'+st.legale).innerHTML : '');
  const testa = `<div class="riga-titolo"><div><h2>${tr('Documenti legali')}</h2><p class="meta">${esc(NOME)} · Torino · ${esc(CFG.titolare || '')} · ${casellaHtml('mail')}</p></div>${chiudiBtn('indietro-impostazioni')}</div>
    <div class="seg" role="tablist">${Object.entries(T).map(([k,l]) => `<button data-legale="${k}" aria-pressed="${st.legale===k}" role="tab">${l}</button>`).join('')}</div>`;
  const corpo = `<div class="legale">${testo}</div>`;
  return foglio('forte alto', testa, corpo);
}
function fCitta(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Città e zone')}</h2><p class="meta">${tr('Zone con più eventi sulla mappa')}</p></div>${chiudiBtn()}</div>`;
  const corpo = `<div class="menu-lista">${CITTA.map(c => `<button class="menu-r${c.id===citta?' on':''}" data-citta="${c.id}"><div><span class="t">${esc(c.n)}</span>${c.h?`<span class="meta">${esc(c.h)}</span>`:''}</div>${c.id===citta?`<span style="color:var(--verde)">${spunta()}</span>`:''}</button>`).join('')}</div>
    <p class="meta">${tr('La città scelta resta su questo telefono. Il logo {nome} riporta sempre alla vista della città.')}</p>`;
  return foglio('forte alto', testa, corpo);
}
function applicaCitta(id, anima){
  citta = CITTA.find(x => x.id===id) ? id : 'torino'; LS.set('agorapp_city', citta);
  $('cittaLbl').innerHTML = esc(cittaObj().n)+' '+giuPiccola; document.title = NOME+' — '+cittaObj().n;
  vaiCitta(anima);
  if(!map) aggiornaZona(true);   /* senza mappa la zona degli eventi segue la città scelta (T-022) */
}

/* ======================= Admin ======================= */
function fAdmin(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Modalità admin')}</h2><p class="meta">${tr('Solo per chi pubblica gli eventi raccolti')}</p></div>${chiudiBtn()}</div>`;
  const corpo = `<button class="riga-int mz-voce" data-az="admin-misure"><span class="mz-tondo-v" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2.5 15.5h13M4.5 13V9M8 13V4.5M11.5 13V7M15 13V10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></span><div><span class="t">${tr('Misure')}</span><span class="meta">${tr('Il polso della città: offerta, rete, accessi, qualità. Senza guardare le persone.')}</span></div>${freccia}</button>
    <div class="menu-lista">
      <button class="menu-r" data-az="admin-ongrid">${icoCal()}<div><span class="t">${tr('Nuovo evento on-grid')}</span><span class="meta">${tr('Form completo, con strato, sottocategoria, prezzo e indirizzo')}</span></div>${freccia}</button>
      <button class="menu-r" data-az="admin-importa">${icoImporta}<div><span class="t">${tr('Importa eventi da Excel')}</span><span class="meta">${tr('File .xlsx (vanno bene anche .ods e .csv): una riga per evento')}</span></div>${freccia}</button>
      <button class="menu-r" data-az="admin-modello">${icoNote}<div><span class="t">${tr('Scarica il modello Excel')}</span><span class="meta">${tr('Le colonne giuste, una riga d’esempio e l’elenco degli strati')}</span></div>${freccia}</button>
      <button class="menu-r" data-az="admin-esporta">${icoEsporta}<div><span class="t">${tr('Esporta in Excel')}</span><span class="meta">${tr('Gli eventi on-grid di questo telefono')}</span></div>${freccia}</button></div>
    <button class="riga-int" data-az="admin-storico"><div><span class="t">${tr('Storico delle operazioni')}</span><span class="meta">${(n => n ? (n===1 ? tr('1 operazione registrata su questo telefono') : tr('{n} operazioni registrate su questo telefono',{n:nf(n)})) : tr('Cosa hai fatto e quando, su questo telefono'))(storico().length)}</span></div>${freccia}</button>
    <p class="meta">${tr('Per una copia completa, con i tuoi Off-Grid:')} <button class="link" style="min-height:32px" data-az="admin-esporta-json">${tr('esporta in JSON')}</button></p>
    ${st.msgAdmin?`<p class="meta" role="status" style="color:var(--testo)">${esc(st.msgAdmin)}</p>`:''}
    ${st.eliminati.length?`<p class="meta">${tr('Eliminati in questa sessione: {n}.',{n:st.eliminati.length})} <button class="link" style="min-height:32px" data-az="ripristina">${tr('Ripristina')}</button></p>`:''}
    <p class="meta">${tr('In modalità admin ogni scheda evento ha «Modifica» ed «Elimina».')}</p>
    <button class="tasto sec pieno" data-az="esci-admin">${tr('Esci dalla modalità admin')}</button>`;
  return foglio('forte alto', testa, corpo);
}
function esporta(){
  const dati = events;
  const blob = new Blob([JSON.stringify({events:dati, exportedAt:new Date().toISOString()}, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = nomeFile()+'_'+oggi()+'.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  st.msgAdmin = tr('Esportati {n} eventi.',{n:dati.length}); disegnaFoglio();
}
/* ======================= Excel: importa, modello, esporta ======================= */
/* Il formato è .xlsx (Office Open XML): lo aprono e lo creano Excel, LibreOffice, Google Fogli e Numbers.
   La libreria (SheetJS) si scarica solo quando l'admin la usa. */
const COLONNE = ['Titolo','Strato','Sottostrato','Descrizione','Data','Ora inizio','Ora fine','Durata','Prezzo','Indirizzo','Latitudine','Longitudine','Link','Nascosto','Password','Provenienza'];
/* colonne che non si importano: si riconoscono solo per rifiutare la riga che le compila (T-011; § 6.2) */
const COLONNE_RIFIUTATE = ['Immagine'];
const ALIAS = {titolo:['title','nome','evento'], strato:['category','categoria','layer'], sottostrato:['sublayer','sottocategoria'], descrizione:['description','descr'], data:['date','giorno'],
  'ora inizio':['ora','inizio','orario','time','start'], 'ora fine':['fine','end'], durata:['duration'], prezzo:['price','costo'], indirizzo:['address','luogo','dove'],
  latitudine:['lat','latitude'], longitudine:['lng','lon','long','longitude'], link:['url','sito'], immagine:['image','img','foto'], nascosto:['hidden'], password:['parola segreta'], provenienza:['fonte','origine','source','flusso']};
const normT = x => String(x==null?'':x).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
function chiaveColonna(h){
  const n = normT(h); if(!n) return null;
  for(const c of COLONNE.concat(COLONNE_RIFIUTATE)){ const k = c.toLowerCase(); if(n===normT(c) || (ALIAS[k]||[]).some(a => normT(a)===n)) return k; }
  return null;
}
const pad2 = n => String(n).padStart(2,'0');
function leggiData(v){
  if(v==null || v==='') return null;
  if(v instanceof Date && !isNaN(v)) return v.getFullYear()+'-'+pad2(v.getMonth()+1)+'-'+pad2(v.getDate());
  if(typeof v==='number' && v>20000){ const d = new Date(Math.round((Math.floor(Math.round(v*1440)/1440) - 25569)*864e5)); return d.getUTCFullYear()+'-'+pad2(d.getUTCMonth()+1)+'-'+pad2(d.getUTCDate()); }
  const t = String(v).trim(); let m;
  if((m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return m[1]+'-'+pad2(m[2])+'-'+pad2(m[3]);
  if((m = t.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/))){ const y = m[3].length===2 ? '20'+m[3] : m[3]; return y+'-'+pad2(m[2])+'-'+pad2(m[1]); }
  return null;
}
function leggiOra(v){
  if(v==null || v==='') return null;
  if(v instanceof Date && !isNaN(v)) return pad2(v.getHours())+':'+pad2(v.getMinutes());
  if(typeof v==='number'){ const f = v - Math.floor(v); if(v>=1 && f===0) return v<24 ? pad2(v)+':00' : null; const min = Math.round(f*1440) % 1440; return pad2(Math.floor(min/60))+':'+pad2(min%60); }
  const m = String(v).trim().match(/^(\d{1,2})(?:[:.h,](\d{2}))?$/i); if(!m || +m[1]>23 || (m[2] && +m[2]>59)) return null;
  return pad2(m[1])+':'+(m[2]||'00');
}
const numero = v => { if(typeof v==='number') return v; const n = parseFloat(String(v==null?'':v).replace(',','.')); return isFinite(n) ? n : null; };
const leggiProv = v => { const n = normT(v); return /consens|diretto|^a$|flusso a/.test(n) ? 'consenso' : /pubblic|^b$|flusso b/.test(n) ? 'pubblica' : ''; };
const siNo = v => /^(si|sì|s|yes|y|x|1|true|vero)$/i.test(String(v==null?'':v).trim());
/* strato e sottostrato si riconoscono anche scritti a metà («Conferenze», «conferenze talk») o in un'altra lingua dell'app */
const parole = x => normT(x).split(' ').filter(w => w && !['e','ed','and','y','et','di','de','of'].includes(w));
function trova(lista, v, nomi){
  const n = parole(v); if(!n.length) return null;
  const forme = x => nomi(x).filter(Boolean).map(parole);
  const esatto = lista.filter(x => forme(x).some(f => f.join(' ')===n.join(' ')));
  if(esatto.length) return esatto[0];
  const parziale = lista.filter(x => forme(x).some(f => n.every(w => f.some(k => k.startsWith(w)))));
  return parziale.length===1 ? parziale[0] : null;
}
const nomiIn = (x, lab) => [x.id, lab].concat(['en','es','fr','ar'].map(g => TR[g] && TR[g][lab]));
function trovaStrato(v){ return trova(LAYERS, v, l => nomiIn(l, l.label)); }
function trovaSub(l, v){ return l ? trova(l.sub, v, x => nomiIn(x, x.label)) : null; }
function leggiImport(file){
  const nome = (file.name||'').toLowerCase();
  if(nome.endsWith('.json')) return leggiImportJson(file);
  st.importa = {fase:'leggo', tot:0, ok:[], scarti:[], avvisi:[], fatti:0, daCercare:0}; apri('importa');
  const I = st.importa;
  Promise.all([caricaScript(URL_XLSX), file.arrayBuffer()]).then(([_, buf]) => {
    if(st.importa!==I) return;
    const wb = XLSX.read(buf, {type:'array', raw:nome.endsWith('.csv')});
    const ws = wb.Sheets[wb.SheetNames.find(n => normT(n)==='eventi') || wb.SheetNames[0]];
    const righe = XLSX.utils.sheet_to_json(ws, {header:1, raw:true, defval:''});
    const iTesta = righe.findIndex(r => r.filter(c => chiaveColonna(c)).length >= 3);
    if(iTesta<0){ st.importa = null; st.msgAdmin = tr('Nel file non trovo le colonne: scarica il modello Excel e parti da lì.'); apri('admin'); return; }
    const mappa = righe[iTesta].map(chiaveColonna);
    const dati = righe.slice(iTesta+1).map((r, k) => { const o = {riga:iTesta+k+2}; mappa.forEach((c, j) => { if(c) o[c] = r[j]; }); return o; })
      .filter(o => COLONNE.concat(COLONNE_RIFIUTATE).some(c => String(o[c.toLowerCase()]==null?'':o[c.toLowerCase()]).trim()));
    I.tot = dati.length;
    const chiavi = new Set(events.map(e => normT(e.title)+'|'+e.datetime));
    const daCercare = [];
    dati.forEach((o, k) => {
      const no = motivo => I.scarti.push({riga:o.riga, motivo});
      const titolo = String(o.titolo==null?'':o.titolo).trim().slice(0, TITLE_MAX);
      if(!titolo) return no(tr('manca il titolo'));
      if(String(o.immagine==null?'':o.immagine).trim()) return no(tr('colonna «Immagine» compilata: {nome} non pubblica immagini, svuotala e importa di nuovo'));
      const l = trovaStrato(o.strato); if(!l) return no(o.strato ? tr('strato «{s}» non riconosciuto',{s:o.strato}) : tr('manca lo strato'));
      const g = leggiData(o.data); if(!g) return no(o.data ? tr('data non leggibile') : tr('manca la data'));
      const h = leggiOra(o['ora inizio']) || (typeof o.data==='number' && o.data%1 ? leggiOra(o.data) : null); if(!h) return no(tr('manca l’ora di inizio'));
      const datetime = g+'T'+h, hf = leggiOra(o['ora fine']);
      let fine = hf ? g+'T'+hf : ''; if(fine && fine<=datetime) fine = piuGiorni(g,1)+'T'+hf;
      if(new Date(fine||datetime).getTime() < Date.now()) return no(tr('è già passato'));
      if(chiavi.has(normT(titolo)+'|'+datetime)) return no(tr('c’è già'));
      chiavi.add(normT(titolo)+'|'+datetime);
      const sub = trovaSub(l, o.sottostrato); if(o.sottostrato && !sub) I.avvisi.push({riga:o.riga, motivo:tr('sottostrato «{s}» non riconosciuto: lasciato vuoto',{s:o.sottostrato})});
      const lat = numero(o.latitudine), lng = numero(o.longitudine), coord = lat!=null && lng!=null && Math.abs(lat)<=90 && Math.abs(lng)<=180 && (lat || lng);
      const indirizzo = String(o.indirizzo==null?'':o.indirizzo).trim();
      if(!coord && indirizzo.length<3) return no(tr('manca l’indirizzo'));
      const nascosto = siNo(o.nascosto), pw = String(o.password==null?'':o.password).trim();
      if(nascosto && !pw) return no(tr('evento nascosto senza password'));
      const ev = {id:'x'+Date.now().toString(36)+k, title:titolo, category:l.id, sublayer:sub?sub.label:'', description:String(o.descrizione==null?'':o.descrizione).trim().slice(0,500),
        datetime, end:fine, duration:String(o.durata==null?'':o.durata).trim(), price:String(o.prezzo==null?'':o.prezzo).trim(), link:normLink(String(o.link==null?'':o.link)),
        hidden:nascosto, hiddenPassword:nascosto?pw:'', offgrid:false, address:indirizzo, addressFull:indirizzo, addrPrecision:coord?'exact':'', addrNum:'', lat:coord?lat:null, lng:coord?lng:null, importato:true, creato:new Date().toISOString(), provenienza:leggiProv(o.provenienza)};
      if(coord) I.ok.push(ev); else daCercare.push({ev, riga:o.riga});
    });
    I.daCercare = daCercare.length; I.fase = daCercare.length ? 'cerco' : 'pronto'; disegnaFoglio();
    /* gli indirizzi senza coordinate si cercano con Photon uno alla volta, uno al secondo (T-008) */
    (async () => {
      for(const x of daCercare){
        if(st.importa!==I) return;
        const q = x.ev.address, pa = parseAddr(q);
        let r = null; try{ const res = await lookup(pa.city ? q : q+', '+cittaObj().n); r = res.list[0]; }catch(e){}
        await new Promise(ok => setTimeout(ok, 1000));
        if(st.importa!==I) return;
        if(r){ x.ev.lat = r.lat; x.ev.lng = r.lng; x.ev.addressFull = testoRisultato(r); x.ev.addrPrecision = r.precision||'exact'; x.ev.addrNum = r.hn||''; I.ok.push(x.ev); }
        else I.scarti.push({riga:x.riga, motivo:tr('indirizzo non trovato: aggiungi latitudine e longitudine')});
        I.fatti++; if(st.foglio==='importa') disegnaFoglio();
      }
      if(st.importa!==I) return;
      I.fase = 'pronto'; I.scarti.sort((a,b) => a.riga-b.riga); if(st.foglio==='importa') disegnaFoglio();
    })();
  }).catch(() => { if(st.importa!==I) return; st.importa = null; st.msgAdmin = tr('Il file non si legge: controlla che sia un foglio .xlsx, .ods o .csv (serve la connessione per aprirlo).'); apri('admin'); });
}
function leggiImportJson(file){
  const r = new FileReader();
  r.onload = e => {
    try{ const d = JSON.parse(e.target.result), imp = Array.isArray(d) ? d : (d.events||[]); const ids = new Set(events.map(x => x.id));
      const scarti = [], conImmagine = x => x && typeof x.image==='string' && x.image.trim();
      imp.forEach((x, i) => { if(conImmagine(x)) scarti.push({riga:i+1, motivo:tr('evento con un’immagine: {nome} non pubblica immagini, toglila dal file e importa di nuovo')}); });
      const ok = imp.filter(x => x && !conImmagine(x) && !ids.has(x.id) && typeof x.lat==='number' && typeof x.lng==='number' && x.lat>=-90 && x.lat<=90 && x.lng>=-180 && x.lng<=180 && x.title && x.datetime)
        .map(x => { const y = Object.assign({}, x); delete y.image; return y; });
      st.importa = {fase:'pronto', tot:imp.length, ok, scarti, avvisi:[], json:true}; apri('importa');
    }catch(err){ st.msgAdmin = tr('Il file non si legge: controlla che sia un JSON di {nome}.'); apri('admin'); }
  };
  r.readAsText(file);
}
function fImporta(){
  const I = st.importa;
  if(I.fase!=='pronto'){
    const testa = `<div class="riga-titolo"><h2>${tr('Importa eventi da Excel')}</h2>${chiudiBtn('importa-annulla')}</div>`;
    const corpo = I.fase==='leggo' ? `<p class="caricamento">${tr('Leggo il file…')}</p>`
      : `<p class="caricamento">${tr('Cerco gli indirizzi senza coordinate: {k} di {n}…',{k:I.fatti, n:I.daCercare})}</p><p class="meta">${tr('Uno al secondo, come chiede il servizio delle mappe. Puoi aspettare qui.')}</p>
        <button class="tasto sec pieno" data-az="importa-annulla">${tr('Annulla')}</button>`;
    return foglio('forte', testa, corpo);
  }
  const elenco = (l, cls) => l.map(x => `<div class="${cls}">${tr('Riga {r}',{r:x.riga})}: ${esc(x.motivo)}</div>`).join('');
  const testa = `<div class="riga-titolo"><h2>${tr('Importare {n} eventi?',{n:I.ok.length})}</h2>${chiudiBtn('importa-annulla')}</div>`;
  const corpo = `<p class="meta">${I.ok.length===I.tot ? tr('Nel file ci sono {n} eventi nuovi.',{n:I.tot}) : tr('Nel file ci sono {t} eventi: {n} sono nuovi e validi, gli altri ci sono già o mancano di dati.',{t:I.tot, n:I.ok.length})}</p>
    ${I.scarti.length||I.avvisi.length?`<div class="imp-righe">${elenco(I.scarti,'no')}${elenco(I.avvisi,'')}</div>`:''}
    <div class="tasti"><button class="tasto sec" data-az="importa-annulla">${tr('Annulla')}</button><button class="tasto pri" data-az="importa-ok" ${I.ok.length?'':'disabled'}>${tr('Importa')}</button></div>`;
  return foglio('forte alto', testa, corpo);
}
const ESEMPIO = () => { const d = new Date(); d.setDate(d.getDate()+7); const m = LAYERS.find(l => l.id==='musica') || LAYERS[0];
  return ['Concerto nel cortile', m.label, (m.sub[0]||{}).label||'', 'Un pomeriggio di musica dal vivo nel cortile, aperto a tutto il quartiere.', d, '18:30', '20:00', '', 'Gratuito', 'Via Giuseppe Mazzini 10, Torino', '', '', 'https://esempio.it', 'no', '', 'Fonte pubblica']; };
function fileExcel(fogli, nome){
  return caricaScript(URL_XLSX).then(() => {
    const wb = XLSX.utils.book_new();
    fogli.forEach(([n, righe, larg]) => {
      /* le date come numero di serie di Excel con formato gg/mm/aaaa: niente sorprese di fuso orario */
      const date = [];
      const r2 = righe.map((r, i) => r.map((c, j) => { if(c instanceof Date){ date.push([i, j]); return (Date.UTC(c.getFullYear(), c.getMonth(), c.getDate()) - Date.UTC(1899, 11, 30))/864e5; } return c; }));
      const ws = XLSX.utils.aoa_to_sheet(r2);
      date.forEach(([i, j]) => { const c = ws[XLSX.utils.encode_cell({r:i, c:j})]; if(c){ c.t = 'n'; c.z = 'dd/mm/yyyy'; } });
      if(larg) ws['!cols'] = larg.map(w => ({wch:w})); XLSX.utils.book_append_sheet(wb, ws, n); });
    XLSX.writeFile(wb, nome, {compression:true});
  });
}
const LARG = [28,22,24,48,12,10,10,10,12,34,12,12,26,10,14,20];
function scaricaModello(){
  const strati = [['Strato','Sottostrato']].concat(...LAYERS.map(l => l.sub.map((x, i) => [i ? '' : l.label, x.label])));
  const istr = [['Come compilare il file'],[''],
    ['Una riga per evento, nel foglio «Eventi». Non cambiare i nomi delle colonne.'],
    ['Obbligatori: Titolo, Strato, Data, Ora inizio, e Indirizzo oppure Latitudine e Longitudine.'],
    ['Strato e Sottostrato: scrivili come nel foglio «Strati».'],
    ['Data: una data (05/11/2026). Ora inizio e Ora fine: 18:30.'],
    ['Indirizzo: via, numero civico e città. Se mancano le coordinate, '+NOME+' cerca l’indirizzo da sé (uno al secondo).'],
    ['Nascosto: sì o no. Se sì, serve la Password per sbloccarlo.'],
    ['Provenienza (facoltativa): «Consenso diretto» se l’organizzatore ti ha dato il consenso, «Fonte pubblica» se l’evento viene da un sito o una pagina pubblica. Serve alle Misure.'],
    ['Gli eventi già passati, o che ci sono già, non vengono importati.'],
    ['Il file si apre e si salva con Excel, LibreOffice, Google Fogli o Numbers: salvalo in formato .xlsx.']];
  fileExcel([['Eventi', [COLONNE, ESEMPIO()], LARG], ['Strati', strati, [26,30]], ['Istruzioni', istr, [110]]], nomeFile()+'-modello-eventi.xlsx')
    .then(() => { st.msgAdmin = tr('Modello scaricato: {f}',{f:nomeFile()+'-modello-eventi.xlsx'}); disegnaFoglio(); })
    .catch(() => { st.msgAdmin = tr('Serve la connessione per preparare il file Excel.'); disegnaFoglio(); });
}
function esportaExcel(){
  const dati = events.filter(e => !e.personal && !e.offgrid);
  const riga = e => { const [g, h] = String(e.datetime||'').split('T'); const S = LAYERS.find(l => l.id===e.category);
    return [e.title||'', S ? S.label : (e.category||''), e.sublayer||'', e.description||'', g ? dIso(g) : '', h||'', e.end ? String(e.end).split('T')[1]||'' : '', e.duration||'', e.price||'', e.addressFull||e.address||'', +e.lat, +e.lng, e.link||'', e.hidden?'sì':'no', e.hidden?(e.hiddenPassword||''):'', e.provenienza==='consenso'?'Consenso diretto':e.provenienza==='pubblica'?'Fonte pubblica':'']; };
  fileExcel([['Eventi', [COLONNE].concat(dati.map(riga)), LARG]], nomeFile()+'_'+oggi()+'.xlsx')
    .then(() => { registra('esporta-excel', {n:dati.length}); st.msgAdmin = tr('Esportati {n} eventi.',{n:dati.length}); disegnaFoglio(); })
    .catch(() => { st.msgAdmin = tr('Serve la connessione per preparare il file Excel.'); disegnaFoglio(); });
}
/* form on-grid dell'admin (stessi campi e controlli dell'app online) */
const maxDt = () => { const d = new Date(); d.setMonth(d.getMonth()+20); return d; };
const dtLocal = d => ymd(d)+'T'+hm(d);
function apriAdminForm(raw){
  const sub = raw && S[raw.category] ? (S[raw.category].sub.find(s => s.label===raw.sublayer)||{}).id||'' : '';
  st.aform = raw ? {id:raw.id, raw, titolo:raw.title||'', strato:raw.category||'', sub, desc:raw.description||'', dt:raw.datetime||'', durata:raw.duration||'', prezzo:raw.price||'', link:raw.link||'', indirizzo:raw.address||'', addrFull:raw.addressFull||raw.address||'', pos:{lat:+raw.lat, lng:+raw.lng}, precision:raw.addrPrecision||'exact', hn:raw.addrNum||'', nascosto:!!raw.hidden, pw:raw.hiddenPassword||'', prov:raw.provenienza||'', err:{}}
    : {id:null, raw:null, titolo:'', strato:'', sub:'', desc:'', dt:'', durata:'', prezzo:'', link:'', indirizzo:'', addrFull:'', pos:null, precision:'', hn:'', nascosto:false, pw:'', prov:'', err:{}};
  st.sel = null; st.form = null; apri('aform');
}
function contaDesc(f){ const n = f.desc.trim().length; return `<span class="conta-car${n>=DESC_MIN?' ok':''}" id="a-conta">${n>=DESC_MIN ? tr('perfetta') : tr('almeno {n} caratteri',{n:DESC_MIN})} · ${n} / 500</span>`; }
function fAdminForm(){
  const f = st.aform, E = f.err, l = S[f.strato];
  const campo = (id, lab, html, err, fac) => `<div class="stack-s"><label class="etich" for="${id}">${lab}${fac?` <span class="fac">${fac}</span>`:''}</label>${html}${err?`<span class="err">${err}</span>`:''}</div>`;
  const testa = `<div class="riga-titolo"><div><h2>${f.id?tr('Modifica evento on-grid'):tr('Nuovo evento on-grid')}</h2><p class="meta">${tr('Admin · pubblicato sulla mappa di questo telefono')}</p></div>${chiudiBtn('admin')}</div>`;
  const corpo = `
    ${campo('a-titolo', tr('Titolo'), `<div class="campo${E.titolo?' errore':''}"><input id="a-titolo" data-acampo="titolo" maxlength="100" value="${esc(f.titolo)}" placeholder="${esc(tr('Nome dell’evento'))}" autocomplete="off"></div>`, E.titolo&&tr('Dai un nome all’evento'))}
    <div class="due">${campo('a-strato', tr('Strato'), `<div class="campo${E.strato?' errore':''}"><select id="a-strato" data-acampo="strato"><option value="">${tr('— Scegli —')}</option>${LAYERS.map(x => `<option value="${x.id}" ${f.strato===x.id?'selected':''}>${esc(tr(x.label))}</option>`).join('')}</select></div>`, E.strato&&tr('Scegli lo strato'))}
      ${campo('a-sub', tr('Sottostrato'), `<div class="campo${E.sub?' errore':''}${l?'':' spento'}"><select id="a-sub" data-acampo="sub" ${l?'':'disabled'}><option value="">${tr('— Scegli —')}</option>${l?l.sub.map(s => `<option value="${s.id}" ${f.sub===s.id?'selected':''}>${esc(tr(s.label))}</option>`).join(''):''}</select></div>`, E.sub&&tr('Scegli il sottostrato'))}</div>
    ${campo('a-desc', tr('Descrizione'), `<div class="campo${E.desc?' errore':''}"><textarea id="a-desc" data-acampo="desc" maxlength="500" placeholder="${esc(tr('Descrivi l’evento…'))}">${esc(f.desc)}</textarea></div>${contaDesc(f)}`, E.desc&&tr('Servono almeno 30 caratteri'))}
    <div class="due">${campo('a-dt', tr('Data e ora'), `<div class="campo${E.dt?' errore':''}"><input id="a-dt" type="datetime-local" data-acampo="dt" value="${esc(f.dt)}" max="${dtLocal(maxDt())}"></div>`, E.dt&&tr('Serve una data futura'))}
      ${campo('a-durata', tr('Durata'), `<div class="campo${E.durata?' errore':''}"><input id="a-durata" data-acampo="durata" value="${esc(f.durata)}" placeholder="${esc(tr('es. 2 ore'))}"></div>`, E.durata&&tr('Indica la durata'))}</div>
    <div class="due">${campo('a-prezzo', tr('Prezzo'), `<div class="campo${E.prezzo?' errore':''}"><input id="a-prezzo" data-acampo="prezzo" value="${esc(f.prezzo)}" placeholder="${esc(tr('Gratuito / 10 €'))}"></div>`, E.prezzo&&tr('Indica il prezzo'))}
      ${campo('a-link', tr('Link'), `<div class="campo"><input id="a-link" type="url" inputmode="url" data-acampo="link" value="${esc(f.link)}" placeholder="https://"></div>`, '', tr('facoltativo'))}</div>
    ${campo('a-prov', tr('Provenienza'), `<div class="campo"><select id="a-prov" data-acampo="prov"><option value="">${tr('— Non indicata —')}</option><option value="consenso" ${f.prov==='consenso'?'selected':''}>${tr('Consenso diretto dell’organizzatore')}</option><option value="pubblica" ${f.prov==='pubblica'?'selected':''}>${tr('Fonte pubblica')}</option></select></div><span class="meta">${tr('Serve alle Misure: quanta offerta ha il consenso diretto (Flusso A) e quanta viene da fonti pubbliche (Flusso B).')}</span>`, '', tr('facoltativo'))}
    ${campo('a-indirizzo', tr('Indirizzo'), `<div class="campo${E.indirizzo?' errore':''}">${icoLuogo}<input id="a-indirizzo" data-acampo="indirizzo" value="${esc(f.indirizzo)}" placeholder="${esc(tr('Via e numero civico, città'))}" autocomplete="off"></div><div id="a-sugg"></div><div id="a-punto">${boxPunto(f)}</div><button class="link" data-az="scegli-mappa-a">${icoLuogo} ${tr('Scegli sulla mappa')}</button>`, E.indirizzo&&(E.indirizzo===2?tr('Indirizzo non trovato: scegline uno dai suggerimenti o usa la mappa.'):tr('Scegli un indirizzo dai suggerimenti o dalla mappa')))}
    <button class="riga-int" data-az="a-nascosto" aria-pressed="${f.nascosto}"><span class="casella" style="background:var(--testo);border-color:var(--testo);color:var(--fondo)">${icoLucchetto(12)}</span><div><span class="t">${tr('Evento nascosto')}</span><span class="meta">${tr('Visibile solo a chi ha la password')}</span></div><span class="interr" aria-hidden="true"></span></button>
    ${f.nascosto?campo('a-pw', tr('Password per sbloccarlo'), `<div class="campo${E.pw?' errore':''}"><input id="a-pw" data-acampo="pw" value="${esc(f.pw)}" placeholder="${esc(tr('Una parola segreta'))}" autocomplete="off"></div>`, E.pw&&tr('Scegli una password')):''}
    <div class="tasti"><button class="tasto sec" data-az="admin">${tr('Annulla')}</button><button class="tasto pri" data-az="a-salva">${tr('Salva evento')}</button></div>
    ${f.id?`<button class="tasto pericolo pieno" data-elimina-admin="${esc(f.id)}">${tr('Elimina')}</button>`:''}`;
  return foglio('forte alto', testa, corpo);
}
function salvaAdmin(){
  const f = st.aform, E = f.err = {};
  const durOk = v => { if(!v.trim()) return false; const d2 = v.replace(/un[ao]?\s+po'?\s+di/i,'1').replace(/paio/i,'2').replace(/quarto d'ora/i,'15 min').replace(/mez(?:z)?ora/i,'30 min'); return /(\d+(?:[.,]\d+)?)\s*(h|ora|ore|min|minut)?/i.test(d2); };
  const t = f.titolo.trim(); if(!t || t.length>TITLE_MAX) E.titolo = 1;
  if(!f.strato) E.strato = 1; if(!f.sub) E.sub = 1;
  if(f.desc.trim().length<DESC_MIN) E.desc = 1;
  const tm = f.dt ? new Date(f.dt).getTime() : NaN; if(!f.dt || isNaN(tm) || (!f.id && tm < Date.now()-3e5) || tm > maxDt().getTime()) E.dt = 1;
  if(!durOk(f.durata)) E.durata = 1; if(!f.prezzo.trim()) E.prezzo = 1;
  if(f.nascosto && !f.pw.trim()) E.pw = 1;
  if(!f.pos && !Object.keys(E).length){
    const q = f.indirizzo.trim(); if(q.length<3){ E.indirizzo = 1; disegnaFoglio(); return; }
    const b = $('a-punto'); if(b) b.innerHTML = `<p class="caricamento">${tr('Cerco l’indirizzo…')}</p>`;
    lookup(parseAddr(q).city ? q : q+', '+cittaObj().n).then(res => { if(st.aform!==f) return;
      if(res.list.length){ const r = res.list[0]; f.indirizzo = testoRisultato(r); f.addrFull = f.indirizzo; f.precision = r.precision||'exact'; f.hn = r.hn||''; f.pos = {lat:r.lat, lng:r.lng}; disegnaFoglio(); }
      else { f.err.indirizzo = 2; disegnaFoglio(); } });
    return;
  }
  if(!f.pos) E.indirizzo = 1;
  if(Object.keys(E).length){ disegnaFoglio(); const c = document.querySelector('#foglio-slot .errore'); if(c && c.scrollIntoView) c.scrollIntoView({block:'center', behavior:'smooth'}); return; }
  const l = S[f.strato], sublayer = (l.sub.find(s => s.id===f.sub)||{}).label||'';
  const campi = {title:t, category:f.strato, sublayer, description:f.desc.trim(), datetime:f.dt, duration:f.durata.trim(), end:'', price:f.prezzo.trim(), link:f.link.trim(),
    hidden:f.nascosto, hiddenPassword:f.nascosto ? f.pw.trim() : '', offgrid:false, address:f.indirizzo.trim(), addressFull:f.addrFull||f.indirizzo.trim(), addrPrecision:f.precision||'exact', addrNum:f.hn||'', lat:f.pos.lat, lng:f.pos.lng, provenienza:f.prov||''};
  let id = f.id;
  if(f.id){ const ev = rawById(f.id); if(ev){ Object.assign(ev, campi); delete ev.image; } misureConta('corretti'); registra('modifica', {id:f.id, s:campi.category}); }
  else { id = Date.now().toString(); events.push(Object.assign({id, creato:new Date().toISOString()}, campi)); registra('crea', {id, s:campi.category}); }
  if(campi.hidden) st.sbloccati.add(campi.hiddenPassword);
  saveEvents(); ricostruisci(); st.aform = null; mzFotografa();
  const e = byId(id); if(e && !visibile(e)){ st.tempo = 'tutto'; st.salvatiSolo = false; if(e.strato) st.strati.add(e.strato); st.tipi.evento = true; }
  selezionaEv(id);
}

/* ======================= Guida alla prima apertura ======================= */
const GUIDA = () => [
  {t:tr('Benvenuto su {nome}'), d:tr('La mappa degli eventi della città. Il cerchio è un evento, il verde pieno un tuo appuntamento. Qui li accendi e spegni.'), el:'tipiMappa'},
  {t:tr('Scegli cosa vedere'), d:tr('Gli Strati sono in fondo alla mappa, i giorni in alto: quello che cambi lo vedi subito sui segnaposto.'), el:'peek'},
  {t:tr('I tuoi appuntamenti'), d:tr('Con «+ Off-Grid» aggiungi un tuo evento: resta solo su questo telefono. Tenendo premuto un punto della mappa ne vedi le coordinate, da copiare.'), el:'btnNuovo'}
];
/* ombra su tutto tranne la parte di cui parla il cartellino: un buco con un'ombra enorme intorno */
function ombraGuida(){
  const o = $('guidaOmbra'); if(!o) return;
  const g = st.guida!=null && GUIDA()[st.guida], el = g && g.el && $(g.el);
  if(!el || el.hidden || !el.offsetParent){ Object.assign(o.style,{left:'50%',top:'50%',width:'0px',height:'0px'}); return; }
  const r = el.getBoundingClientRect(), m = 6, rad = parseFloat(getComputedStyle(el).borderTopLeftRadius)||12;
  Object.assign(o.style,{left:(r.left-m)+'px', top:(r.top-m)+'px', width:(r.width+2*m)+'px', height:(r.height+2*m)+'px', borderRadius:(rad+m)+'px'});
}
window.addEventListener('resize', () => { if(st.guida!=null) ombraGuida(); });
function disegnaGuida(){
  document.querySelectorAll('.evidenzia').forEach(x => x.classList.remove('evidenzia'));
  const slot = $('guida-slot');
  if(st.guida==null){ slot.innerHTML = ''; return; }
  const G = GUIDA(), g = G[st.guida];
  if(g.el && $(g.el)) $(g.el).classList.add('evidenzia');
  slot.innerHTML = `<div class="guida-ombra" id="guidaOmbra" aria-hidden="true"></div><div class="guida vetro" role="dialog" aria-label="${esc(tr('Guida'))}"><div class="passi">${G.map((_,i) => `<span class="${i===st.guida?'on':''}"></span>`).join('')}</div><h3>${g.t}</h3><p>${g.d}</p>
    <div class="tasti">${st.guida===G.length-1 ? `<button class="tasto pri" data-az="guida-salta">${tr('Inizia')}</button>` : `<button class="tasto sec" data-az="guida-salta">${tr('Salta')}</button><button class="tasto pri" data-az="guida-avanti">${tr('Avanti')}</button>`}</div></div>`;
  ombraGuida();
}

/* ======================= Avvisi: solo «Annulla» dopo un'eliminazione admin e gli errori veri ======================= */
let tt;
function avviso(msg, azione, errore){
  if(!azione && !errore) return;   /* le spiegazioni andranno nella modalità tutorial */
  const el = $('toast'), so = $('sopra'); el.style.top = (so.hidden ? 12 : so.offsetHeight + 14) + 'px';
  el.innerHTML = `<span>${esc(msg)}</span>${azione?`<button data-az="${azione.az}">${esc(azione.l)}</button>`:''}`; el.hidden = false;
  clearTimeout(tt); tt = setTimeout(() => { el.hidden = true; }, azione ? 5200 : 4200);
}

/* ======================= Aggiorna ======================= */
function tutto(){ disegnaChips(); disegnaPins(); disegnaPeek(); if(st.foglio && ['strati','elenco','gruppo','scheda','calendario','date'].includes(st.foglio)) disegnaFoglio(); posizioni(); }
function selezionaEv(id){
  const e = byId(id); if(!e) return;
  if(st.sezione!=='mappa') vaiSezione('mappa');
  if(!e.suMappa){ apriCalendario('giornata', e.giorno); return; }
  st.sel = id;   /* prima del controllo: un evento di un'altra zona già consultata conta come visibile (T-022) */
  if(!visibile(e) && !modoGiornata()){
    if(!finito(e)) st.tempo = 'tutto'; else st.finiti = true; st.salvatiSolo = false; st.tipi[e.tipo] = true;
    if(e.strato && S[e.strato]) st.strati.add(e.strato); st.subOff.delete(e.strato+'|'+e.sub); st.preset = -1; st.prezzo = 'tutti'; st.lente = null;
    if(e.nascosto) st.nascostiOn = true;
  }
  st.sel = id; st.foglio = 'scheda'; st.cercaQui = null; st.descAperta = false; st.copiato = null;
  tutto(); disegnaFoglio();
  requestAnimationFrame(() => inquadra(e.lat, e.lng, 14));
}
function apriCalendario(vista, giorno){
  st.cal.vista = vista || st.cal.vista; if(giorno){ st.cal.giorno = giorno; }
  if(!st.cal.giorno) st.cal.giorno = oggi();
  const d = dIso(st.cal.giorno); st.cal.y = d.getFullYear(); st.cal.m = d.getMonth();
  st.sel = null; apri('calendario'); requestAnimationFrame(() => { if(modoGiornata()) inquadraTutti(giornata(st.cal.giorno).vive); });
}

/* ======================= Sezioni ======================= */
function vaiSezione(s, daNav){
  if(st.pieno) return;
  const stessa = st.sezione===s;
  if(st.foglio || st.posa){ st.posa = null; disegnaPosa(); st.foglio = null; st.sel = null; st.gruppo = null; st.form = null; st.aform = null; st.conferma = null; st.pdf = null; }
  disegnaFoglio();
  st.sezione = s; $('app').dataset.sez = s;
  $('area').hidden = s!=='mappa';
  ['progetti','agora','temi','misure'].forEach(k => { $('pagina-'+k).hidden = s!==k; });
  if(s==='misure') disegnaMisure();
  if(s==='temi'){ if(stessa && daNav){ TM.vista = 'esplora'; $('pagina-temi').scrollTop = 0; } disegnaTemi(); }
  const mod = s==='agora' ? window.AGR.agora : s==='progetti' ? window.AGR.progetti : null;
  if(mod){ if(stessa && daNav) mod.home(); else mod.ridisegna(); }
  document.querySelectorAll('nav.bassa [data-sez]').forEach(b => { if(b.dataset.sez===s) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
  if(s!=='mappa' && st.guida!=null){ st.guida = null; disegnaGuida(); }
  if(s==='mappa'){ tutto(); if(map) requestAnimationFrame(() => map.resize()); }
  posizioni();
}

/* ======================= Tema e lingua ======================= */
function applicaTema(t){
  document.documentElement.setAttribute('data-theme', t); LS.set('agorapp_theme', t);
  const m = document.querySelector('meta[name="theme-color"]'); if(m) m.setAttribute('content', t==='dark' ? '#211D18' : '#FFFDF8');
  tingiMappa(); if(map && mappaOk){ try{ map.updateImage('agr-tratteggio', immagineTratteggio()); map.setPaintProperty('agr-vuoti-bordo','line-color', t==='dark'?'#B5A998':'#5C5246'); }catch(e){} }
  if(modoGiornata()) disegnaPins();
}
function testiFissi(){
  document.documentElement.lang = lang; document.documentElement.dir = lang==='ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = tr(el.getAttribute('data-t')); });
  $('cercaLbl').textContent = tr('Cerca eventi, luoghi, indirizzi');
  $('btnHome').setAttribute('aria-label', tr('{nome}: torna alla vista della città'));
  $('btnCitta').setAttribute('aria-label', tr('Scegli città o zona'));
  $('btnImpo').setAttribute('aria-label', tr('Impostazioni'));
  $('btnGps').setAttribute('aria-label', tr('Mostra dove sono'));
  $('btnNuovo').setAttribute('aria-label', tr('Nuovo evento Off-Grid'));
  $('zPiu').setAttribute('aria-label', tr('Avvicina')); $('zMeno').setAttribute('aria-label', tr('Allontana'));
  $('chips').setAttribute('aria-label', tr('Quando')); $('chipsAvanti').setAttribute('aria-label', tr('Altri tempi')); $('tipiMappa').setAttribute('aria-label', tr('Che cosa vedi sulla mappa'));
  $('navBassa').setAttribute('aria-label', tr('Navigazione principale'));
  avvisoCorrezioni();
  $('cittaLbl').innerHTML = esc(cittaObj().n)+' '+giuPiccola;
}
function applicaLingua(l){ lang = l; LS.set('agorapp_lang', l); testiFissi(); ricostruisci(); tutto(); disegnaFoglio(); if(st.sezione!=='mappa') vaiSezione(st.sezione); }


/* ======================= Temi: ovali Strati e Temi trasversali, lenti dell'app e tre lenti tue (passo 2) ======================= */
const TEMI_VOC = ["Diritto all'abitare","Spazi autogestiti","Riuso e rigenerazione","Beni comuni","Aree verdi","Orti urbani","Mobilità dolce","Ciclabili","Sostenibilità","Clima","Inclusione","Accoglienza e migrazione","Accessibilità","Parità di genere","Diritti","Antirazzismo","Cultura libera","Educazione popolare","Memoria e territorio","Autoproduzione","Mutualismo","Salute di comunità","Infanzia e famiglie","Convivialità"];
const GLIFI = {
  casa:'<path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10v9h11v-9"/><path d="M10 19v-5h4v5"/>',
  respira:'<path d="M5 19c0-8 5-13 14-14 0 9-5 14-14 14Z"/><path d="M5 19c3-4 6-7 10-10"/>',
  porte:'<path d="M6 20V5.5A1.5 1.5 0 0 1 7.5 4h7A1.5 1.5 0 0 1 16 5.5V20"/><path d="M16 7l3 1v12"/><path d="M4 20h17"/><circle cx="13" cy="12.5" r=".8" fill="currentColor"/>',
  mani:'<path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 10V5a1.5 1.5 0 0 1 3 0v6"/><path d="M14 10.5V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.6-2.2L4 15a1.5 1.5 0 0 1 2.2-2L8 14.5V12"/>',
  tavola:'<path d="M3 11h18"/><path d="M5 11v8M19 11v8"/><path d="M8 11a4 4 0 0 1 8 0"/><path d="M12 5v2"/>',
  parola:'<path d="M4 10v4h3l6 4V6L7 10H4Z"/><path d="M16.5 9a4 4 0 0 1 0 6"/><path d="M19 6.5a7.5 7.5 0 0 1 0 11"/>',
  cura:'<path d="M12 20s-7-4.4-7-9.5A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.5C19 15.6 12 20 12 20Z"/>'
};
const LENTI_AG = [
  {id:'casa', nome:'Casa e quartiere', col:'#C2185B', motto:'Chi resta, chi arriva, chi tiene viva la via.', testo:'Per chi abita un quartiere e non vuole doverlo lasciare. Assemblee sugli affitti, cortili aperti, storie dei palazzi: tutto ciò che fa di una via un posto dove restare.', k:["t:Diritto all'abitare","t:Memoria e territorio","t:Beni comuni"]},
  {id:'respira', nome:'La città che respira', col:'#00838F', motto:'Alberi, biciclette, aria.', testo:'Per chi vuole attraversare la città a piedi o in bici, e trovare un’ombra lungo la strada. Parchi da curare, orti, pedalate, quello che si può fare per il clima vicino a casa.', k:['t:Aree verdi','t:Orti urbani','t:Clima','t:Sostenibilità','t:Mobilità dolce','t:Ciclabili']},
  {id:'porte', nome:'Porte aperte', col:'#AD1457', motto:'Qui nessuno è ospite.', testo:'Dove chi arriva da lontano, chi non sente, chi non vede bene o parla un’altra lingua trova posto senza doverlo chiedere. Scuole di italiano, cori, tamburi, sportelli.', k:['t:Inclusione','t:Accoglienza e migrazione','t:Antirazzismo','t:Accessibilità']},
  {id:'mani', nome:'Mani in pasta', col:'#8A6D0B', motto:'Si impara facendo.', testo:'Aggiustare una bici, cucire, costruire una cassetta per i libri, rimettere in piedi uno spazio vuoto. Per chi preferisce fare piuttosto che guardare.', k:['t:Autoproduzione','t:Riuso e rigenerazione','t:Spazi autogestiti','s:laboratori']},
  {id:'tavola', nome:'A tavola insieme', col:'#C2410C', motto:'Mangiare insieme è già fare comunità.', testo:'Merende in cortile, pranzi sociali, mercati di quartiere. Per chi pensa che una tavola lunga risolva più cose di quante sembri.', k:['t:Convivialità','s:cibo','s:mercati']},
  {id:'parola', nome:'Prendere parola', col:'#1565C0', motto:'Dove la città alza la mano.', testo:'Assemblee, cortei, tavoli delle istanze, scuole popolari: i posti dove si impara a dire la propria e a farla contare. Per chi pensa che le regole si possano cambiare.', k:['t:Diritti','t:Parità di genere','t:Educazione popolare','s:manifestazioni']},
  {id:'cura', nome:'Prendersi cura', col:'#455A64', motto:'Nessuno se la cava da solo.', testo:'Ambulatori diffusi, scambi di competenze, nonne che cucinano, chi dà una mano il sabato. Per chi sa che stare bene è una faccenda di quartiere.', k:['t:Mutualismo','t:Salute di comunità','t:Infanzia e famiglie','s:volontariato']}
];
const glifo = (id, s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLIFI[id]}</svg>`;
const ICT = {
  lente:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></svg>',
  strumenti:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h11M19 6h1M4 12h3M11 12h9M4 18h7M15 18h5"/><circle cx="17" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="13" cy="18" r="2"/></svg>',
  ora:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  occhio:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  segno:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4h12v16l-6-4-6 4V4Z"/></svg>',
  piu:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  cestino:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>',
  bussola:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15 9-2 5-4 1 2-5 4-1Z"/></svg>',
  croce:'<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  spunta:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
/* l'universo: 13 strati e 24 temi trasversali. Chiave "s:<id>" o "t:<tema>" */
const universo = () => [
  ...LAYERS.map(s => ({k:'s:'+s.id, label:tr(s.label), tipo:'strato', dot:s.pin, bg:s.bg, tx:s.text})),
  ...TEMI_VOC.map(t => { const c = temaCol(t); return {k:'t:'+t, label:tr(t), tipo:'tema', dot:c.dot, bg:c.bg, tx:c.tx}; })
];
const byK = k => universo().find(u => u.k===k);
/* le tre lenti di chi usa l'app: stessa chiave dell'app online (agorapp_temi_slots) */
function caricaLenti(){
  const a = LS.get('agorapp_temi_slots', null);
  /* dalla memoria del telefono si tengono solo strati e temi che l'app conosce, e un nome di 16 caratteri al massimo (T-024) */
  const nome = x => String(x==null ? '' : x).slice(0, 16);
  const conv = s => { if(!s || typeof s!=='object') return null;
    const k = Array.isArray(s.k) ? s.k.filter(x => typeof x==='string' && byK(x))
      : (Array.isArray(s.tags) ? s.tags : []).map(lb => { const l = LAYERS.find(x => x.label===lb); return l ? 's:'+l.id : (TEMI_VOC.includes(lb) ? 't:'+lb : null); }).filter(Boolean);
    return k.length ? {nome:nome(s.nome||s.name), k} : null; };
  return Array.isArray(a) && a.length===3 ? a.map(conv) : [null,null,null];
}
function salvaLenti(){ LS.set('agorapp_temi_slots', TM.lenti.map(l => l ? {name:l.nome, tags:l.k.map(k => k.startsWith('s:') ? (S[k.slice(2)]||{}).label : k.slice(2)), nome:l.nome, k:l.k} : null)); }
const TM = {vista:'esplora', scelti:[], mostrati:6, mappaOn:true, q:'', strumenti:{terminati:false, nascosti:false}, lenti:caricaLenti(), lenteNome:null, lenteAg:null, salva:null, foglio:null};
const lenteAg = id => LENTI_AG.find(l => l.id===id);
const nomeLenteAg = l => tr(l.nome);

/* cosa porta i temi scelti */
const tagsEv = e => [...(S[e.strato] ? ['s:'+e.strato] : []), ...temiDi(e).map(t => 't:'+t)];
const colpisce = (keys, scelti) => keys.some(k => (scelti||TM.scelti).includes(k));
function quanti(chiavi){ return EV.filter(e => e.tipo!=='og' && !e.nascosto && !finito(e) && !sparito(e) && colpisce(tagsEv(e), chiavi)).length; }
function trovati(){
  return EV.filter(e => e.tipo!=='og')
    .filter(e => !e.nascosto || (TM.strumenti.nascosti && st.sbloccati.has(e.raw.hiddenPassword)))
    .filter(e => !sparito(e) && (TM.strumenti.terminati || !finito(e)))
    .filter(e => colpisce(tagsEv(e)))
    .sort((a,b) => (finito(a)-finito(b)) || (a.a-b.a));
}
/* progetti e istanze d'esempio di Agorà e Progetti che portano i temi scelti, segnati «Demo» (T-015; decisione del 18/11/2026).
   I contenuti arrivano con il file della lingua: se non c'è ancora, lo chiede e ridisegna quando arriva. */
function nelleSezioni(){
  const X = window.AGR.anteprime, D = X && X.dati();
  if(!D){ if(X && !X.errore()) X.carica().then(d => { if(d && st.sezione==='temi') disegnaTemi(); }); return {prog:[], ist:[]}; }
  const tocca = x => colpisce([...x.strati.map(s => 's:'+s), ...(x.temi||[]).map(t => 't:'+t)]);
  return {prog:D.progetti.progetti.filter(tocca), ist:D.agora.istanze.filter(tocca)};
}

/* pezzi */
function ovale(u, attr, piccolo){ const on = TM.scelti.includes(u.k); return `<button class="ovale${on?' sel':''}${piccolo?' p':''}" ${attr}="${esc(u.k)}" aria-pressed="${on}" style="--dot:${u.dot}"><span class="pallino"></span>${esc(u.label)}</button>`; }
function etichettaTema(k){ const u = byK(k); if(!u) return ''; return `<span class="etichetta${TM.scelti.includes(k)?' hit':''}" style="--dot:${u.dot};--bg:${u.bg};--tx:${u.tx}">${esc(u.label)}</span>`; }
function testataTemi(){
  const n = TM.scelti.length;
  return `<div class="t-testa"><div><div class="tipo">${tr('Temi')}</div><div class="t-sotto">${tr('le passerelle tra le sezioni')}</div></div>
    <div class="t-icone"><button class="t-icona" data-tz="lente" aria-label="${esc(tr('Lente: cerca e combina strati e temi'))}">${ICT.lente}${n?`<span class="t-badge">${n}</span>`:''}</button>
    <button class="t-icona" data-tz="strumenti" aria-label="${esc(tr('Strumenti e lenti salvate'))}">${ICT.strumenti}</button></div></div>`;
}
function barraScelta(){
  const n = TM.scelti.length; if(!n) return '';
  const k = trovati().length;
  return `<div class="t-barra vetro" role="region"><div class="t-barra-t"><b>${n===1?tr('1 scelto'):tr('{n} scelti',{n})}</b><span class="meta">${k===1?tr('1 cosa li porta'):tr('{n} cose li portano',{n:k})}</span></div>
    <button class="tasto sec" data-tz="pulisci">${tr('Pulisci')}</button><button class="tasto pri" data-tz="mostra">${tr('Mostra')} ${freccia}</button></div>`;
}
function vEsplora(){
  const U = universo(), mie = TM.lenti.map((l,i) => l ? Object.assign({i}, l) : null).filter(Boolean);
  const carta = l => { const n = quanti(l.k);
    return `<button class="t-lente" data-tz-ag="${l.id}" style="--lc:${l.col}"><span class="t-lente-g">${glifo(l.id,22)}</span><span class="t-lente-n">${esc(nomeLenteAg(l))}</span><span class="t-lente-m">${esc(tr(l.motto))}</span>
      <span class="t-lente-p">${l.k.map(k => { const u = byK(k); return `<span class="pallino" style="background:${u.dot}" title="${esc(u.label)}"></span>`; }).join('')}<span class="meta">${n===1?tr('1 cosa ora'):tr('{n} cose ora',{n})}</span></span></button>`; };
  return `${testataTemi()}
  <section class="stack"><h1>${tr('Esplora per tema')}</h1><p>${tr('Tutti gli strati e tutti i temi, nessuna classifica. Parti da una lente, o scegli tu uno o più strati e temi: poi vedi insieme gli eventi, le pratiche e le istanze che li portano.')}</p></section>
  <section class="stack-s"><div class="t-gruppo">${tr('Le lenti di {nome}')}</div><div class="t-lenti" role="list">${LENTI_AG.map(carta).join('')}</div>
    <p class="meta">${tr('Le propone la redazione. Non scelgono per te: mostrano tutto ciò che porta quei temi, in ordine di tempo.')}</p></section>
  <section class="stack-s"><div class="t-gruppo">${tr('Le tue lenti')}</div>
    ${mie.length?`<div class="ovali">${mie.map(l => `<button class="ovale lente" data-tz-lente="${l.i}">${ICT.segno}${esc(l.nome)} <span class="meta">${l.k.length}</span></button>`).join('')}${mie.length<3?`<span class="meta t-ancora">${3-mie.length===1?tr('1 libera'):tr('{n} libere',{n:3-mie.length})}</span>`:''}</div>`
      :`<p class="meta">${tr('Puoi farne fino a tre: scegli strati e temi qui sotto, poi «Salva come lente».')}</p>`}</section>
  <section class="stack-s"><div class="t-gruppo">${tr('Strati')}</div><div class="ovali">${U.filter(u => u.tipo==='strato').map(u => ovale(u,'data-scegli')).join('')}</div></section>
  <section class="stack-s"><div class="t-gruppo">${tr('Temi trasversali')}</div><div class="ovali">${U.filter(u => u.tipo==='tema').map(u => ovale(u,'data-scegli')).join('')}</div></section>
  <div class="t-spiega"><span>${ICT.bussola}</span><div><div class="t">${tr('Un tema, tutte le sezioni insieme')}</div><div class="meta">${tr('Uno strato dice di che tipo è un evento; un tema dice di cosa parla. Eventi, pratiche e istanze che portano ciò che scegli appaiono mescolati, in ordine di tempo.')}</div></div></div>
  ${barraScelta()}`;
}
/* mini mappa stilizzata: i punti con le forme della mappa, su un foglio carta (la mappa vera si apre col tasto) */
function miniMappa(lista){
  const pts = lista.filter(e => e.suMappa), fuori = lista.length - pts.length;
  if(!TM.mappaOn) return `<button class="t-mappa-chiusa" data-tz="mappa-on">${ICT.occhio}<span>${tr('Mostra la mappa')} · <b>${tr('{n} punti',{n:pts.length})}</b></span></button>`;
  if(!pts.length) return '';
  const W = 340, H = 162, cosl = Math.cos(45*Math.PI/180);
  let la0 = Math.min(...pts.map(p => p.lat)), la1 = Math.max(...pts.map(p => p.lat)), ln0 = Math.min(...pts.map(p => p.lng)), ln1 = Math.max(...pts.map(p => p.lng));
  const cx = (ln0+ln1)/2, cy = (la0+la1)/2; let w = Math.max((ln1-ln0)*cosl, 0.01), h = Math.max(la1-la0, 0.006);
  if(w/h < W/H) w = h*W/H; else h = w*H/W; w *= 1.25; h *= 1.25;
  const X = ln => (((ln-cx)*cosl)/w + .5)*W, Y = la => (.5 - (la-cy)/h)*H;
  const fondo = citta==='torino' ? QUARTIERI.map(q => `<rect x="${X(q.ln[0]).toFixed(1)}" y="${Y(q.la[1]).toFixed(1)}" width="${(X(q.ln[1])-X(q.ln[0])).toFixed(1)}" height="${(Y(q.la[0])-Y(q.la[1])).toFixed(1)}" rx="6" fill="var(--mappa-edificio)" opacity=".55"/>`).join('') : '';
  const segni = pts.map(e => { const x = X(e.lng).toFixed(1), y = Y(e.lat).toFixed(1);
    return `<circle cx="${x}" cy="${y}" r="6.5" fill="${(S[e.strato]||{pin:'#888'}).pin}" stroke="var(--superficie)" stroke-width="2"/>`; }).join('');
  return `<div class="t-mappa"><button class="t-mappa-svg" data-tz="sulla-mappa" aria-label="${esc(tr('Apri questi {n} punti sulla mappa',{n:pts.length}))}"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${fondo}<g>${segni}</g></svg></button>
    <span class="t-mappa-lbl">${tr('{n} sulla mappa',{n:pts.length})}${fuori?' · '+tr('{n} in altre città',{n:fuori}):''}</span>
    <button class="t-mappa-x" data-tz="mappa-off" aria-label="${esc(tr('Nascondi la mappa'))}">${ICT.occhio}</button></div>`;
}
function cartaRisultato(e){
  const fin = finito(e);
  const d = dIso(e.giorno).toLocaleDateString(dloc(), {weekday:'short', day:'numeric', month:'long'});
  return `<button class="t-card${fin?' fin':''}" data-tev="${esc(e.id)}"><span class="t-angolo evento">${tr('Evento')}</span>
    <div class="t-quando">${forma(e.tipo,e.strato,18)}${ICT.ora} ${fin?tr('appena finito'):esc(d+' · '+e.inizio)}${!e.suMappa&&e.citta?' · '+esc(e.citta):''}</div>
    <h3>${esc(e.titolo)}</h3>
    <p class="t-desc">${esc(e.desc.slice(0,90))}${e.desc.length>90?'…':''}</p>
    <div class="t-etich">${tagsEv(e).map(etichettaTema).join('')}</div></button>`;
}
function vRisultati(){
  const lista = trovati(), vis = lista.slice(0, TM.mostrati);
  const sez = nelleSezioni(), ag = lenteAg(TM.lenteAg);
  const titolo = TM.lenteNome || (TM.scelti.length===1 ? byK(TM.scelti[0]).label : tr('{n} strati e temi insieme',{n:TM.scelti.length}));
  return `${testataTemi()}
  <button class="indietro" data-tz="esplora">${frecciaSx}${tr('Cambia la scelta')}</button>
  ${ag?`<section class="t-lente-testa" style="--lc:${ag.col}"><span class="t-lente-g">${glifo(ag.id,24)}</span><div class="stack-s"><div class="t-gruppo">${tr('Lente di {nome}')}</div><h1>${esc(nomeLenteAg(ag))}</h1><p class="t-lente-motto">${esc(tr(ag.motto))}</p><p>${esc(tr(ag.testo))}</p></div></section>`:''}
  <section class="stack-s">${ag?`<div class="t-gruppo">${tr('Cosa guarda')}</div>`:`<h1>${esc(titolo)}</h1>`}
    <div class="ovali">${TM.scelti.map(k => { const u = byK(k); return `<button class="ovale sel p" data-togli="${esc(k)}" style="--dot:${u.dot}" aria-label="${esc(tr('Togli {t}',{t:u.label}))}"><span class="pallino"></span>${esc(u.label)}${ICT.croce}</button>`; }).join('')}</div>
    <div class="t-azioni"><button class="link" data-tz="salva">${ICT.segno}${ag?tr('Fanne una tua lente'):tr('Salva come lente')}</button><button class="link" data-tz="esplora">${tr('Aggiungi altri')}</button></div></section>
  ${miniMappa(lista)}
  <button class="tasto pri pieno" data-tz="sulla-mappa">${tr('Apri sulla mappa')} ${freccia}</button>
  ${sez.prog.length||sez.ist.length?`<section class="stack-s"><div class="t-gruppo">${tr('Nelle sezioni')}</div><div class="t-sezioni">
      ${sez.prog.map(p => `<button class="t-sez prog" data-tprog="${esc(p.id)}"><span class="t-sez-k">${tr('Progetto')} <span class="t-sez-demo">${tr('Demo')}</span></span><span class="t">${esc(p.titolo)}</span></button>`).join('')}
      ${sez.ist.map(a => `<button class="t-sez c-${esc(a.id)}" data-tist="${esc(a.id)}"><span class="t-sez-k">${tr('Istanza')} <span class="t-sez-demo">${tr('Demo')}</span></span><span class="t">${esc(a.titolo)}</span></button>`).join('')}</div></section>`:''}
  <section class="stack-s"><div class="meta">${lista.length===1?tr('1 elemento'):tr('{n} elementi',{n:lista.length})} · ${tr('in ordine di tempo, non di popolarità')}</div>
    ${vis.length ? vis.map(cartaRisultato).join('') : `<div class="t-vuoto">${tr('Niente con questi temi, per ora.')}</div>`}
    ${lista.length>TM.mostrati?`<button class="tasto sec pieno" data-tz="altri">${tr('Mostra altri {n}',{n:Math.min(6,lista.length-TM.mostrati)})}</button>`:''}</section>`;
}
/* fogli Lente e Strumenti */
function lenteDentro(){
  const U = universo(), q = norm(TM.q);
  const lista = (q.length>=3 ? U.filter(u => norm(u.label).includes(q)) : U).slice().sort((a,b) => a.label.localeCompare(b.label, dloc()));
  const corto = q.length>0 && q.length<3;
  return `<div class="meta">${corto?tr('Scrivi almeno 3 lettere: trova anche dentro la parola.'):q.length>=3?(lista.length?tr('{n} risultati',{n:lista.length}):tr('Nessuno strato o tema contiene «{q}».',{q:esc(TM.q)})):tr('Tutti gli strati e i temi · dalla A alla Z')}</div>
    ${TM.scelti.length?`<div class="ovali">${TM.scelti.map(k => { const u = byK(k); return `<button class="ovale sel p" data-togli="${esc(k)}" style="--dot:${u.dot}"><span class="pallino"></span>${esc(u.label)}${ICT.croce}</button>`; }).join('')}</div>`:''}
    ${corto?'':`<div class="ovali t-lista">${lista.map(u => ovale(u,'data-scegli',true)).join('')}</div>`}
    ${TM.scelti.length?`<div class="tasti"><button class="tasto sec" data-tz="pulisci">${tr('Pulisci')}</button><button class="tasto pri" data-tz="mostra">${TM.scelti.length===1?tr('Mostra 1 scelto'):tr('Mostra {n} scelti',{n:TM.scelti.length})}</button></div>`:''}`;
}
function fTemi(){
  const testa = `<div class="riga-titolo"><div><div class="tipo">${TM.foglio==='lente'?tr('Lente'):tr('Strumenti')}</div><h2>${TM.foglio==='lente'?tr('Cerca e combina'):TM.salva?tr('Salva come lente'):tr('Cosa vedere, e le tue lenti')}</h2></div>${chiudiBtn()}</div>`;
  if(TM.foglio==='lente') return foglio('forte alto sez-temi', testa + `<label class="campo">${ICT.lente}<input id="tz-q" value="${esc(TM.q)}" placeholder="${esc(tr('Cerca uno strato o un tema…'))}" autocomplete="off"></label>`, `<div id="tz-lente" class="stack-s">${lenteDentro()}</div>`);
  const n = TM.scelti.length, sv = TM.salva, sbl = st.sbloccati.size;
  const slot = (l,i) => l
    ? `<div class="t-slot pieno"><span class="t-slot-i">${ICT.segno}</span><div><div class="t">${esc(l.nome)}</div><div class="meta">${l.k.map(k => (byK(k)||{label:k}).label).map(esc).join(' · ')}</div></div><button class="link" data-tz-lente="${i}">${tr('Applica')}</button><button class="t-icona p" data-tz-via="${i}" aria-label="${esc(tr('Elimina la lente {n}',{n:l.nome}))}">${ICT.cestino}</button></div>`
    : `<button class="t-slot" data-tz-slot="${i}"><span class="t-slot-i">${ICT.piu}</span><div><div class="t">${tr('Lente {n} libera',{n:i+1})}</div><div class="meta">${n?tr('Tocca per salvarci la scelta di adesso'):tr('Vuota')}</div></div></button>`;
  let corpo;
  if(sv && sv.fase==='slot') corpo = `<p>${n===1?tr('Stai salvando 1 elemento. In quale lente?'):tr('Stai salvando {n} elementi. In quale lente?',{n})}</p>
    ${TM.lenti.map((l,i) => `<button class="t-slot${l?' pieno':''}" data-tz-slot="${i}"><span class="t-slot-i">${l?ICT.segno:ICT.piu}</span><div><div class="t">${l?esc(l.nome):tr('Lente {n}',{n:i+1})}</div><div class="meta">${l?tr('Occupata: la sovrascrivi'):tr('Libera')}</div></div></button>`).join('')}
    <button class="tasto sec pieno" data-tz="salva-annulla">${tr('Annulla')}</button>`;
  else if(sv && sv.fase==='nome') corpo = `<p>${TM.lenti[sv.i]?tr('La lente «{n}» viene sostituita.',{n:esc(TM.lenti[sv.i].nome)})+' ':''}${tr('Al massimo 16 caratteri.')}</p>
    <label class="campo"><input id="tz-nome" maxlength="16" placeholder="${esc(tr('es. Casa e verde'))}" value="${esc(TM.lenteNome||'')}" autocomplete="off"></label>
    <div class="tasti"><button class="tasto sec" data-tz="salva-annulla">${tr('Annulla')}</button><button class="tasto pri" data-tz="salva-ok">${TM.lenti[sv.i]?tr('Sovrascrivi'):tr('Salva')}</button></div>`;
  else corpo = `<button class="riga-int" data-tz-tool="terminati" aria-pressed="${TM.strumenti.terminati}"><span class="casella">${ICT.spunta}</span><div><span class="t">${tr('Mostra anche gli appena finiti')}</span><span class="meta">${tr('Quelli finiti da meno di tre ore, in grigio.')}</span></div></button>
    <button class="riga-int" data-tz-tool="nascosti" aria-pressed="${TM.strumenti.nascosti}"${sbl?'':' disabled'}><span class="casella">${ICT.spunta}</span><div><span class="t">${tr('Mostra i nascosti che hai sbloccato')}</span><span class="meta">${sbl?tr('{n} sbloccati su questo telefono.',{n:sbl}):tr('Nessuno sbloccato: si sbloccano dalla Cerca della mappa.')}</span></div></button>
    <div class="t-gruppo">${tr('Le tue lenti')}</div><p class="meta">${tr('Una lente è una combinazione di strati e temi da ritrovare con un tocco. Restano su questo telefono.')}</p>
    ${TM.lenti.map(slot).join('')}
    <button class="tasto ${n?'pri':'sec'} pieno" data-tz="salva"${n?'':' disabled'}>${n?tr('Salva la scelta di adesso come lente ({n})',{n}):tr('Scegli strati o temi per salvare una lente')}</button>`;
  return foglio('forte alto sez-temi', testa, corpo);
}
function disegnaTemi(){
  const p = $('pagina-temi'); if(!p || p.hidden) return;
  if(!TM.scelti.length) TM.vista = 'esplora';
  const sc = p.scrollTop;
  p.innerHTML = `<main class="pag-temi">${TM.vista==='risultati' ? vRisultati() : vEsplora()}</main>`;
  p.scrollTop = sc;
}
function cambiaTemi(){ disegnaTemi(); if(TM.foglio){ if(TM.foglio==='lente' && $('tz-lente')) $('tz-lente').innerHTML = lenteDentro(); else disegnaFoglio(); } }
function apriFoglioTemi(q){ TM.foglio = q; st.foglio = 'temi'; ultimoFoglio = null; disegnaFoglio(); setTimeout(() => { const i = $(q==='lente'?'tz-q':'tz-nome'); if(i && (q==='lente' || (TM.salva && TM.salva.fase==='nome'))){ i.focus(); } }, 40); }
function lenteCorrente(){ return {strati:TM.scelti.filter(k => k.startsWith('s:')).map(k => k.slice(2)), temi:TM.scelti.filter(k => k.startsWith('t:')).map(k => k.slice(2)), nome:TM.lenteNome || (TM.scelti.length===1 ? byK(TM.scelti[0]).label : tr('{n} temi',{n:TM.scelti.length})), terminati:TM.strumenti.terminati, nascosti:TM.strumenti.nascosti}; }
/* una scelta vale anche come filtro della Mappa (la «lente»): chip col nome e ✕ */
function applicaLente(l, idSel){
  st.lente = l; st.tempo = 'tutto'; st.strati = new Set(LAYERS.map(s => s.id)); st.subOff.clear(); st.preset = 0;
  st.tipi = {evento:true, og:false};
  st.prezzo = 'tutti'; st.salvatiSolo = false; st.finiti = !!l.terminati; if(l.nascosti) st.nascostiOn = true;
  TM.foglio = null; vaiSezione('mappa'); chiudi(); tutto();
  if(idSel){ selezionaEv(idSel); return; }
  requestAnimationFrame(() => inquadraTutti(visibili()));
}
function apriTemi(keys){ TM.scelti = keys.slice(); TM.lenteNome = null; TM.lenteAg = null; TM.vista = 'risultati'; TM.mostrati = 6; vaiSezione('temi'); $('pagina-temi').scrollTop = 0; }
function clickTemi(b){
  const d = b.dataset;
  if(d.scegli){ const i = TM.scelti.indexOf(d.scegli); if(i>=0) TM.scelti.splice(i,1); else TM.scelti.push(d.scegli); TM.lenteNome = null; TM.lenteAg = null; cambiaTemi(); return true; }
  if(d.togli){ TM.scelti = TM.scelti.filter(k => k!==d.togli); TM.lenteNome = null; TM.lenteAg = null; TM.mostrati = 6; cambiaTemi(); return true; }
  if(d.tzAg){ const l = lenteAg(d.tzAg); TM.scelti = l.k.slice(); TM.lenteNome = nomeLenteAg(l); TM.lenteAg = l.id; TM.vista = 'risultati'; TM.mostrati = 6; disegnaTemi(); $('pagina-temi').scrollTop = 0; return true; }
  if(d.tev){ const e = byId(d.tev); if(!e) return true; if(!e.suMappa){ vaiSezione('mappa'); apriCalendario('giornata', e.giorno); return true; } applicaLente(Object.assign(lenteCorrente(), {terminati:finito(e)||TM.strumenti.terminati}), d.tev); return true; }
  if(d.tprog){ window.AGR.progetti.apri(d.tprog); return true; }
  if(d.tist){ window.AGR.agora.apriIstanza(d.tist); return true; }
  if(d.tzLente){ const l = TM.lenti[+d.tzLente]; TM.scelti = l.k.slice(); TM.lenteNome = l.nome; TM.lenteAg = null; TM.vista = 'risultati'; TM.mostrati = 6; TM.foglio = null; chiudi(); disegnaTemi(); $('pagina-temi').scrollTop = 0; return true; }
  if(d.tzVia){ TM.lenti[+d.tzVia] = null; salvaLenti(); cambiaTemi(); return true; }
  if(d.tzTool){ TM.strumenti[d.tzTool] = !TM.strumenti[d.tzTool]; cambiaTemi(); return true; }
  if(d.tzSlot){ if(!TM.scelti.length) return true; TM.salva = {fase:'nome', i:+d.tzSlot}; apriFoglioTemi('strumenti'); return true; }
  const z = d.tz; if(!z) return false;
  if(z==='lente' || z==='strumenti'){ TM.salva = null; apriFoglioTemi(z); }
  else if(z==='pulisci'){ TM.scelti = []; TM.lenteNome = null; TM.lenteAg = null; TM.vista = 'esplora'; cambiaTemi(); }
  else if(z==='mostra'){ TM.vista = 'risultati'; TM.mostrati = 6; if(TM.foglio){ TM.foglio = null; chiudi(); } disegnaTemi(); $('pagina-temi').scrollTop = 0; }
  else if(z==='esplora'){ TM.vista = 'esplora'; disegnaTemi(); $('pagina-temi').scrollTop = 0; }
  else if(z==='altri'){ TM.mostrati += 6; disegnaTemi(); }
  else if(z==='mappa-on' || z==='mappa-off'){ TM.mappaOn = z==='mappa-on'; disegnaTemi(); }
  else if(z==='sulla-mappa'){ applicaLente(lenteCorrente()); }
  else if(z==='salva'){ if(!TM.scelti.length) return true; const libera = TM.lenti.findIndex(l => !l); TM.salva = libera>=0 ? {fase:'nome', i:libera} : {fase:'slot'}; apriFoglioTemi('strumenti'); }
  else if(z==='salva-annulla'){ TM.salva = null; apriFoglioTemi('strumenti'); }
  else if(z==='salva-ok'){ const i = TM.salva.i, nm = (($('tz-nome')||{}).value||'').trim().slice(0,16) || tr('Lente {n}',{n:i+1}); TM.lenti[i] = {nome:nm, k:TM.scelti.slice()}; salvaLenti(); TM.lenteNome = nm; TM.lenteAg = null; TM.salva = null; apriFoglioTemi('strumenti'); disegnaTemi(); }
  return true;
}

/* Le 50 domande della tabella «KPI di misurazione senza tracciamento» (file Excel di Lorenzo) (6 ottobre 2026): stato, conformità UE e IT, obblighi.
   Valutazioni di Claude, non parere legale.
   lor/lorD/lorNota: decisione e note di Lorenzo (file restituito il 6 ottobre 2026); risposta: risposte di Claude alle note. Standard: dove UE e Italia divergono vale la regola UE. */
const MZ_KPI = [{"n": 1, "area": "A · Offerta di eventi", "q": "Quanti eventi sono attivi sulla mappa ogni giorno?", "calc": "Conteggio giornaliero degli eventi non scaduti, preso dall'admin alla stessa ora.", "dec": "Se una città ha abbastanza offerta per essere promossa o va prima riempita.", "ut": "Alta", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena: misura la città, non le persone.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "È il KPI più solido che hai: dipende solo da te.", "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "Trasformiamo la narrarativa di nessun archivio storico in \"nessun tipo di profilazione, raccolti solo dati tecnici aggregati\"; sostenere questo con degli esempi già nell'informativa", "risposta": "Annotato per l’informativa che faremo dopo l’MVP. I totali delle Misure sono già solo numeri aggregati, senza dati sulle persone."}, {"n": 2, "area": "A · Offerta di eventi", "q": "Quanti eventi nuovi entrano ogni settimana?", "calc": "Somma settimanale degli inserimenti (manuali + import).", "dec": "Quanto tempo dedicare alla raccolta; se serve aiuto o automazione.", "ut": "Alta", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Misura il tuo carico di lavoro: utile anche per il Business Plan (costo operativo per città).", "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "Rendere chiaro che si tratta del contatore di nuovi eventi inseriti da {nome} (in questo caso da me), e non dai nuovi utenti", "risposta": "Fatto: l’indicatore ora dice «eventi nuovi inseriti da te ({nome})», non nuovi utenti."}, {"n": 3, "area": "A · Offerta di eventi", "q": "Come si distribuiscono gli eventi tra le città?", "calc": "Eventi attivi per città, settimanale.", "dec": "Quali città sono 'vuote' (task Release MVP) e dove concentrare la raccolta.", "ut": "Alta", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Risponde alla voce 'città vuote di eventi' del piano MVP.", "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "", "risposta": ""}, {"n": 4, "area": "A · Offerta di eventi", "q": "Come si distribuiscono gli eventi per categoria/strato?", "calc": "Eventi attivi per strato, settimanale.", "dec": "Su quali tipi di fonte cercare per bilanciare l'offerta.", "ut": "Media", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena: dà visibilità a ciò che è sottorappresentato (orizzontalità).", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": null, "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "", "risposta": ""}, {"n": 5, "area": "A · Offerta di eventi", "q": "In quali quartieri ci sono più o meno eventi?", "calc": "Eventi per circoscrizione/quartiere, mensile, dalle coordinate degli eventi.", "dec": "Dove la città è 'invisibile'; base del Report della Città.", "ut": "Alta", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena: è la mission (asimmetria informativa) resa misurabile.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Il Report della Città può poggiare sull'offerta (cosa succede) invece che sulla domanda (chi guarda): zero rischio.", "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Come faccio a decidere i quartieri di ogni città? Segnare i limiti dei vari quartieri e circoscrizioni è un lavoraccio che va moltitplicato per il numero di città. Quello che farei è mantenere l'impostazione dei vuoti e avere delle heat-map della densità di eventi, tali densità suddivise anche per strato. Per ora la domanda rimane in fase di studio: capire a livello tecnico cosa è fattibile.", "risposta": "Fattibile senza backend: la libreria della mappa (MapLibre) ha uno strato «mappa di densità» che colora dove ci sono più eventi, calcolato sul telefono, anche per strato; nessun confine di quartiere da disegnare. Per vedere l’andamento nel tempo basterebbe salvare ogni giorno, nei totali dell’admin, una griglia di densità a celle di circa 500 m. Da decidere: solo nelle Misure o anche sulla mappa pubblica, accanto ai vuoti."}, {"n": 6, "area": "A · Offerta di eventi", "q": "Quanti eventi arrivano da consenso diretto e quanti da fonti pubbliche?", "calc": "Quota Flusso A / Flusso B sul totale, mensile.", "dec": "Quanto spingere il contatto diretto con gli organizzatori (base giuridica più solida).", "ut": "Alta", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Dati degli organizzatori già trattati; si conta solo il flusso.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Indicatore di rischio legale: più Flusso A = meno esposizione.", "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "Aggiungere un campo nel menù di inserimento on-grid dell'admin riguardo se l'evento che si sta inserendo deriva da un contatto diretto oppure no.", "risposta": ""}, {"n": 7, "area": "A · Offerta di eventi", "q": "Quanti eventi sono gratuiti?", "calc": "Quota di eventi con ingresso libero (se il campo esiste).", "dec": "Coerenza con il principio di accesso libero; argomento per i bandi.", "ut": "Media", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Più avanti", "fase": "MVP", "um": "No", "note": "Solo se l'evento ha già un campo prezzo; non aggiungerlo apposta.", "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "non mi sembra un valore giocabile ai bandi, anzi: io ad un bando mi vanterei di riuscire a portare avanti eventi culturali a pagamento. Ciò dimostra che si può vivere d'arte etc etc", "risposta": "D’accordo, resta in studio. Si può rovesciare la lettura: la quota di eventi a pagamento come segno che la cultura riesce a sostenersi."}, {"n": 8, "area": "A · Offerta di eventi", "q": "In quali giorni e fasce orarie ci sono eventi?", "calc": "Distribuzione degli eventi per giorno della settimana e fascia oraria.", "dec": "Fasce scoperte da segnalare nel Report della Città o alle istituzioni.", "ut": "Media", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Più avanti", "fase": "MVP", "um": "No", "note": null, "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "Perché Claude valuta di farlo più in la?", "risposta": "Nessun motivo legale: l’avevo messa più avanti solo per priorità. Ora è operativa (Offerta → Quando ci sono eventi)."}, {"n": 9, "area": "A · Offerta di eventi", "q": "Con quanto anticipo vengono pubblicati gli eventi?", "calc": "Giorni medi tra inserimento e inizio evento.", "dec": "Se l'app serve a pianificare o solo all'ultimo minuto; frequenza di aggiornamento.", "ut": "Media", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Più avanti", "fase": "MVP", "um": "No", "note": "Richiede di salvare la data di inserimento come campo dell'evento (si cancella con l'evento).", "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Richiede un backend?", "risposta": "No, niente backend: si calcola dalla data di inserimento che l’app salva sugli eventi nuovi (campo «creato») sul telefono dell’admin. Per gli eventi inseriti prima del 6 ottobre la data si ricava, quando possibile, dal codice dell’evento."}, {"n": 10, "area": "A · Offerta di eventi", "q": "Quanti eventi arrivano dall'import dei siti comunali?", "calc": "Eventi importati via Excel / totale, per Comune.", "dec": "Se estendere l'import ad altri Comuni (test Empoli).", "ut": "Alta", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Lega il KPI al lavoro di import già avviato.", "soglia": "No", "lor": "studio", "lorD": "in fase di studio", "lorNota": "Lo spirito della domanda va bene ma va affinata la domanda: non \"da siti comunali\" ma \"eventi istituzionali\" robe del comune e delle istituzioni in generale. Studiare definizione di questo tipo di eventi per avere un KPI chiaro", "risposta": "Proposta per lo studio: un campo «Promotore» nell’evento (istituzionale: Comune, Regione, scuole, biblioteche e musei pubblici, altri enti pubblici · associazione o terzo settore · privato). Il KPI diventa «quota di eventi istituzionali». L’elenco preciso va definito insieme."}, {"n": 11, "area": "A · Offerta di eventi", "q": "Quanti eventi vengono corretti o rimossi dopo la pubblicazione?", "calc": "Conteggio mensile di modifiche/rimozioni fatte dall'admin.", "dec": "Affidabilità delle fonti; quali fonti abbandonare.", "ut": "Media", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti; si tiene solo il contatore, non l'evento.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Più avanti", "fase": "MVP", "um": "No", "note": "Non tenere copia degli eventi rimossi: l'informativa promette che spariscono 3 ore dopo la fine.", "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "", "risposta": ""}, {"n": 12, "area": "A · Offerta di eventi", "q": "Quante fonti monitori e quanti eventi rende ognuna?", "calc": "Elenco fonti con eventi pubblicati per fonte, mensile.", "dec": "Quali fonti tenere nella lista di raccolta.", "ut": "Media", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Fonti = enti/siti. Se una fonte è una persona fisica, aggregare.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": null, "soglia": "No", "lor": "sospeso", "lorD": "Sospesa", "lorNota": "Tale domanda non rappresenta un KPI possibile od una domanda che genera delle statistiche. Tale elenco rimane in mano a me in maniera privata", "risposta": "D’accordo: l’elenco delle fonti resta tuo, fuori dalle Misure."}, {"n": 13, "area": "B · Organizzatori e luoghi", "q": "Quanti organizzatori distinti pubblicano tramite consenso diretto?", "calc": "Conteggio mensile degli organizzatori Flusso A.", "dec": "Dimensione della rete; potenziale per 'Rete dei Luoghi Vivi' (B2B).", "ut": "Alta", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Organizzatori già trattati per il consenso; si usa solo il conteggio.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": null, "soglia": "No", "lor": "rimandato", "lorD": "Rimandata a Fase 2", "lorNota": "", "risposta": ""}, {"n": 14, "area": "B · Organizzatori e luoghi", "q": "Quanti organizzatori tornano a pubblicare?", "calc": "Organizzatori con almeno 2 eventi in 3 mesi / totale.", "dec": "Fidelizzazione della rete; prova per il modello B2B.", "ut": "Media", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Sì: collega lo stesso organizzatore nel tempo.", "eu": "Giallo", "euM": "Riuso di dati degli organizzatori per una finalità statistica: compatibilità ex art. 6(4) e art. 89 GDPR; informativa art. 13(3).", "it": "Giallo", "itM": "Come UE; nessuna norma italiana più restrittiva nota.", "obl": "Aggiungere la finalità statistica all'informativa per gli organizzatori.", "coer": "Buona, se resta interno e aggregato.", "par": "Più avanti", "fase": "MVP", "um": "Sì", "note": "Usare dati raccolti come prova del consenso per una statistica è un nuovo fine: va verificata la compatibilità (art. 6(4) GDPR) e scritta nell'informativa.", "soglia": "No", "lor": "rimandato", "lorD": "Rimandata a Fase 2", "lorNota": "", "risposta": ""}, {"n": 15, "area": "B · Organizzatori e luoghi", "q": "Quante richieste di rimozione o opposizione ricevi, e in quanto tempo le evadi?", "calc": "Registro semplice: data richiesta, data evasione (≤ 48 h promesse).", "dec": "Se la promessa delle 48 h regge; prova di accountability.", "ut": "Alta", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Sì, chi fa la richiesta: già trattato per gestirla.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno di nuovo: è già un obbligo di accountability.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "È di fatto un obbligo: dimostrare che rispetti i diritti (art. 5(2), art. 12 GDPR).", "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "", "risposta": ""}, {"n": 16, "area": "B · Organizzatori e luoghi", "q": "Quante segnalazioni di eventi non validi arrivano?", "calc": "Email ricevute su {casella} per evento errato, mensile.", "dec": "Qualità dei dati; quali fonti sono inaffidabili.", "ut": "Media", "met": "LV · Invio volontario dell'utente (tocco esplicito)", "dati": "Sì, l'email di chi segnala (già prevista dall'informativa).", "eu": "Verde", "euM": "Art. 5(3): esenzione per il servizio esplicitamente richiesto (l'utente sceglie di inviare). GDPR: l'IP transita su Netlify; informativa art. 13 sul nuovo invio; nessun dato oltre il +1.", "it": "Verde", "itM": "Art. 122: invio richiesto dall'utente. Basta aggiornare l'informativa (oggi dice 'Nessun server').", "obl": "Nessuno: il canale è già nell'informativa.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Canale già dichiarato nelle Note legali: non serve niente di nuovo.", "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "", "risposta": ""}, {"n": 17, "area": "B · Organizzatori e luoghi", "q": "Quanti luoghi/spazi distinti compaiono sulla mappa?", "calc": "Conteggio mensile dei luoghi unici con almeno un evento.", "dec": "Lista dei potenziali clienti 'Rete dei Luoghi Vivi'.", "ut": "Alta", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena: nessuna visibilità a pagamento, solo censimento.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": null, "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Nota importante: finora {nome} parla di eventi ma non parla di luoghi. ", "risposta": "Giusto: oggi un «luogo» è solo l’indirizzo di un evento. Prima di contarli bisogna decidere se i luoghi diventano un oggetto dell’app, che è anche la base della «Rete dei Luoghi Vivi»."}, {"n": 18, "area": "C · Adozione", "q": "Quante richieste riceve il sito ogni giorno?", "calc": "Richieste/banda dal pannello Netlify, annotate ogni giorno (Free = 24 h).", "dec": "Se il lancio funziona; dato per Smart&Start.", "ut": "Alta", "met": "L1 · Totali aggregati dell'hosting (Netlify)", "dati": "IP trattati da Netlify, mai visti da te.", "eu": "Giallo", "euM": "Netlify tratta già gli IP per servire il sito (IP = dato personale, CGUE C-582/14 Breyer). Leggere solo totali aggregati non crea un dato personale nelle tue mani (CGUE C-413/23 P, 4.9.2025), ma Netlify va dichiarato come responsabile (art. 28) con base per il trasferimento extra-UE. La richiesta della pagina è necessaria alla trasmissione: art. 5(3) esente.", "it": "Giallo", "itM": "Stesso quadro UE. Oggi l'informativa non nomina Netlify tra i servizi che ricevono l'IP: da aggiungere.", "obl": "Dichiarare Netlify nell'informativa; verificare DPA di Netlify e base del trasferimento USA (DPF o SCC). Sul piano Free i dati restano 24 ore: annotarli a mano o passare a un piano a pagamento.", "coer": "Buona: è un totale, non un comportamento.", "par": "Misurare ora", "fase": "MVP", "um": "Sì", "note": "Richieste ≠ persone: una visita fa molte richieste. Va presentato come indice, non come 'utenti'. Verificare cosa esattamente mostra il widget Free.", "soglia": "No", "lor": "segnaposto", "lorD": "Implementare vuoto", "lorNota": "Da capire bene: il KPI è fondamentale ma forse non compliant. La mia scelta definita è: implementiamo il KPI lasciandolo vuoto; avremo cosi lo spazio già pronto per quando saremo pronti a renderlo operativo. Spiegare sulla piattaforma, brevemente, perché è in fase di studio", "risposta": "Spazio pronto e vuoto, come hai chiesto. Perché è in studio: i numeri di Netlify vengono dai registri delle richieste, che contengono gli indirizzi IP dei visitatori. Leggerne solo i totali è probabilmente lecito, ma va verificato cosa registra Netlify e per quanto, e va scritto nell’informativa."}, {"n": 19, "area": "C · Adozione", "q": "Quanta banda consuma il sito e quando ci sono picchi?", "calc": "Banda giornaliera e picchi dal pannello Netlify.", "dec": "Capacità e costi (prova di carico del piano MVP).", "ut": "Media", "met": "L1 · Totali aggregati dell'hosting (Netlify)", "dati": "IP trattati da Netlify, mai visti da te.", "eu": "Giallo", "euM": "Netlify tratta già gli IP per servire il sito (IP = dato personale, CGUE C-582/14 Breyer). Leggere solo totali aggregati non crea un dato personale nelle tue mani (CGUE C-413/23 P, 4.9.2025), ma Netlify va dichiarato come responsabile (art. 28) con base per il trasferimento extra-UE. La richiesta della pagina è necessaria alla trasmissione: art. 5(3) esente.", "it": "Giallo", "itM": "Stesso quadro UE. Oggi l'informativa non nomina Netlify tra i servizi che ricevono l'IP: da aggiungere.", "obl": "Dichiarare Netlify nell'informativa; verificare DPA di Netlify e base del trasferimento USA (DPF o SCC). Sul piano Free i dati restano 24 ore: annotarli a mano o passare a un piano a pagamento.", "coer": "Piena.", "par": "Più avanti", "fase": "MVP", "um": "No", "note": null, "soglia": "No", "lor": "segnaposto", "lorD": "Implementare vuoto", "lorNota": "Da capire bene: il KPI è fondamentale ma forse non compliant. La mia scelta definita è: implementiamo il KPI lasciandolo vuoto; avremo cosi lo spazio già pronto per quando saremo pronti a renderlo operativo. Spiegare sulla piattaforma, brevemente, perché è in fase di studio", "risposta": "Spazio pronto e vuoto, come hai chiesto. Stesso motivo della riga 18: la banda viene dagli stessi registri di Netlify."}, {"n": 20, "area": "C · Adozione", "q": "Le azioni di comunicazione fanno salire gli accessi?", "calc": "Confronto delle richieste giornaliere prima e dopo un post, un volantino o un incontro.", "dec": "Quali canali di comunicazione funzionano.", "ut": "Alta", "met": "L1 · Totali aggregati dell'hosting (Netlify)", "dati": "IP trattati da Netlify, mai visti da te.", "eu": "Giallo", "euM": "Netlify tratta già gli IP per servire il sito (IP = dato personale, CGUE C-582/14 Breyer). Leggere solo totali aggregati non crea un dato personale nelle tue mani (CGUE C-413/23 P, 4.9.2025), ma Netlify va dichiarato come responsabile (art. 28) con base per il trasferimento extra-UE. La richiesta della pagina è necessaria alla trasmissione: art. 5(3) esente.", "it": "Giallo", "itM": "Stesso quadro UE. Oggi l'informativa non nomina Netlify tra i servizi che ricevono l'IP: da aggiungere.", "obl": "Dichiarare Netlify nell'informativa; verificare DPA di Netlify e base del trasferimento USA (DPF o SCC). Sul piano Free i dati restano 24 ore: annotarli a mano o passare a un piano a pagamento.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "Sì", "note": "Non usare parametri UTM o link diversi per canale: per l'EDPB il tracciamento via URL rientra nell'art. 5(3). Basta il confronto per data.", "soglia": "No", "lor": "segnaposto", "lorD": "Implementare vuoto", "lorNota": "Da capire bene: il KPI è fondamentale ma forse non compliant. La mia scelta definita è: implementiamo il KPI lasciandolo vuoto; avremo cosi lo spazio già pronto per quando saremo pronti a renderlo operativo. Spiegare sulla piattaforma, brevemente, perché è in fase di studio", "risposta": "Spazio pronto e vuoto, come hai chiesto. Dipende dalla riga 18: senza i numeri delle richieste non si vede l’effetto delle azioni di comunicazione."}, {"n": 21, "area": "C · Adozione", "q": "Quanti visitatori unici ci sono al giorno?", "calc": "Richiede di distinguere le persone (hash di IP + browser con 'sale' giornaliero).", "dec": "Nessuna in più rispetto alle richieste totali.", "ut": "Bassa", "met": "L3 · Analytics cookieless di terzi", "dati": "Sì: l'hash resta un dato personale per chi lo calcola.", "eu": "Arancio", "euM": "Come L2, più un nuovo responsabile art. 28 (DPA) che tratta IP/hash giornalieri: restano dati personali per il fornitore (C-413/23 P). A livello UE probabile consenso.", "it": "Giallo", "itM": "Garante 2021: senza consenso solo se il terzo maschera almeno il 4° ottetto dell'IP e non incrocia/cede i dati; nuovo fornitore in informativa.", "obl": "Nuovo fornitore + DPA + informativa; a livello UE probabile consenso: OLTRE SOGLIA.", "coer": "Debole: serve a contare persone, non città.", "par": "Non misurare", "fase": "Mai", "um": "Sì", "note": "Il guadagno informativo rispetto alle richieste totali non vale l'esposizione.", "soglia": "Sì", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Perché non è in linea con i nostri principi?", "risposta": "Il problema non è il fine ma il metodo: per contare persone «uniche» bisogna riconoscere lo stesso telefono da un giorno all’altro, con un’impronta calcolata da IP e browser. È un identificativo, anche se temporaneo: per questo è oltre la tua soglia (dato personale e accesso al dispositivo per l’EDPB)."}, {"n": 22, "area": "C · Adozione", "q": "Da quale paese o regione arrivano le visite?", "calc": "Geolocalizzazione dell'IP.", "dec": "Nessuna: la città scelta nell'app (riga 32) è più utile.", "ut": "Bassa", "met": "L3 · Analytics cookieless di terzi", "dati": "Sì, IP.", "eu": "Arancio", "euM": "Come L2, più un nuovo responsabile art. 28 (DPA) che tratta IP/hash giornalieri: restano dati personali per il fornitore (C-413/23 P). A livello UE probabile consenso.", "it": "Giallo", "itM": "Garante 2021: senza consenso solo se il terzo maschera almeno il 4° ottetto dell'IP e non incrocia/cede i dati; nuovo fornitore in informativa.", "obl": "Nuovo fornitore + DPA + informativa; a livello UE probabile consenso: OLTRE SOGLIA.", "coer": "Debole.", "par": "Non misurare", "fase": "Mai", "um": "No", "note": "Sostituita da 'città selezionata nell'app'.", "soglia": "Sì", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Credo che potrebbe essere importante, faccio un esempio: si scopre che molte persone di zone rurali dove non c'è niente guardano cosa c'è in città e partecipano ad eventi nelle città vicine diminuendo cosi il loro carico di solitudine legato alla vita in una zona rurale. E' difficile sapere di eventi stando fuori dal loro contesto, {nome} potrebbe risolvere il problema.", "risposta": "L’esempio è forte e coerente con la missione. Due strade: geolocalizzare l’IP (dato personale e accesso al dispositivo: oltre soglia) oppure chiederlo in modo volontario, per esempio «da dove vieni?» con il comune scelto dall’elenco, insieme alle altre misure volontarie."}, {"n": 23, "area": "C · Adozione", "q": "Da quali siti arrivano le visite?", "calc": "Intestazione 'referrer' delle richieste.", "dec": "Quali siti partner mandano persone.", "ut": "Media", "met": "L3 · Analytics cookieless di terzi", "dati": "Indiretti: il referrer può contenere URL con dati.", "eu": "Arancio", "euM": "Come L2, più un nuovo responsabile art. 28 (DPA) che tratta IP/hash giornalieri: restano dati personali per il fornitore (C-413/23 P). A livello UE probabile consenso.", "it": "Giallo", "itM": "Garante 2021: senza consenso solo se il terzo maschera almeno il 4° ottetto dell'IP e non incrocia/cede i dati; nuovo fornitore in informativa.", "obl": "Nuovo fornitore + DPA + informativa; a livello UE probabile consenso: OLTRE SOGLIA.", "coer": "Accettabile se aggregato.", "par": "Più avanti", "fase": "Dopo società / on-grid", "um": "Sì", "note": "Netlify Free non lo mostra; servirebbe uno strumento di terzi.", "soglia": "Sì", "lor": "rimandato", "lorD": "Rimandata a Fase 2", "lorNota": "Non ho capito cosa misura ed a cosa serve", "risposta": "Il «referrer» è l’indirizzo della pagina da cui una persona arriva su {nome}, per esempio un link sul sito di un’associazione. Servirebbe a sapere quali siti ci mandano persone. Lo invia il browser da solo; leggerlo richiede comunque i registri di Netlify."}, {"n": 24, "area": "C · Adozione", "q": "Quante visite arrivano da telefono e quante da computer?", "calc": "Lettura dello user-agent.", "dec": "Poco: l'app è già pensata per il telefono.", "ut": "Bassa", "met": "L3 · Analytics cookieless di terzi", "dati": "Sì, lo user-agent contribuisce all'impronta del dispositivo.", "eu": "Arancio", "euM": "Come L2, più un nuovo responsabile art. 28 (DPA) che tratta IP/hash giornalieri: restano dati personali per il fornitore (C-413/23 P). A livello UE probabile consenso.", "it": "Giallo", "itM": "Garante 2021: senza consenso solo se il terzo maschera almeno il 4° ottetto dell'IP e non incrocia/cede i dati; nuovo fornitore in informativa.", "obl": "Nuovo fornitore + DPA + informativa; a livello UE probabile consenso: OLTRE SOGLIA.", "coer": "Debole.", "par": "Non misurare", "fase": "Mai", "um": "No", "note": "Vicino al fingerprinting: non serve.", "soglia": "Sì", "lor": "sospeso", "lorD": "Sospesa", "lorNota": "", "risposta": ""}, {"n": 25, "area": "C · Adozione", "q": "Quante persone installano {nome} sulla schermata home?", "calc": "Evento 'installazione' della PWA inviato da script.", "dec": "Se investire nell'esperienza da app.", "ut": "Bassa", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "IP in transito.", "eu": "Arancio", "euM": "EDPB Linee guida 2/2023 (v2, ott. 2024): uno script che fa inviare un segnale al browser è 'accesso' al dispositivo → art. 5(3). Nella lettura EDPB la misura d'audience non è 'strettamente necessaria' → consenso, salvo esenzioni nazionali (CNIL in Francia: da verificare). Standard UE più severo di quello italiano.", "it": "Giallo", "itM": "Garante, provv. n. 231 del 10.6.2021 (GU 9.7.2021): analytics usati solo per statistiche aggregate su un solo sito, senza identificazione, assimilati ai tecnici → nessun consenso, solo informativa.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Neutra.", "par": "Non misurare", "fase": "Dopo società / on-grid", "um": "No", "note": null, "soglia": "Sì", "lor": "sospeso", "lorD": "Sospesa", "lorNota": "", "risposta": ""}, {"n": 26, "area": "D · Uso delle sezioni", "q": "Quante volte viene aperta Agorà (demo)?", "calc": "+1 aggregato inviato da script a ogni apertura, senza identificativo.", "dec": "Se c'è interesse sufficiente per aprire l'on-grid.", "ut": "Alta", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "IP in transito sul fornitore.", "eu": "Arancio", "euM": "EDPB Linee guida 2/2023 (v2, ott. 2024): uno script che fa inviare un segnale al browser è 'accesso' al dispositivo → art. 5(3). Nella lettura EDPB la misura d'audience non è 'strettamente necessaria' → consenso, salvo esenzioni nazionali (CNIL in Francia: da verificare). Standard UE più severo di quello italiano.", "it": "Giallo", "itM": "Garante, provv. n. 231 del 10.6.2021 (GU 9.7.2021): analytics usati solo per statistiche aggregate su un solo sito, senza identificazione, assimilati ai tecnici → nessun consenso, solo informativa.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Accettabile se solo totali giornalieri.", "par": "Più avanti", "fase": "Dopo società / on-grid", "um": "Sì", "note": "Alternativa preferibile ora: il pulsante volontario della riga 27.", "soglia": "Sì", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Davvero non si riesce ad avvicinarsi alla compliance  in nessun modo per avere questo dato?", "risposta": "Una strada esiste: se il contenuto di Agorà si scaricasse dal sito solo quando la persona apre Agorà, quella richiesta sarebbe necessaria al servizio che ha chiesto (esenzione dell’art. 5(3)), e contarla sul server senza salvare l’IP sarebbe un conteggio di richieste già necessarie. Rischio: se il contenuto si separa apposta per contare, un’autorità può leggerlo come un aggiramento. Da valutare con un professionista."}, {"n": 27, "area": "D · Uso delle sezioni", "q": "Quante persone premono 'Mi interessa, apritela' nella demo di Agorà?", "calc": "Pulsante volontario: un tocco invia solo '+1 Agorà'. Nessuna email, nessun ID.", "dec": "Quando e se aprire le iscrizioni all'on-grid.", "ut": "Alta", "met": "LV · Invio volontario dell'utente (tocco esplicito)", "dati": "IP in transito su Netlify.", "eu": "Verde", "euM": "Art. 5(3): esenzione per il servizio esplicitamente richiesto (l'utente sceglie di inviare). GDPR: l'IP transita su Netlify; informativa art. 13 sul nuovo invio; nessun dato oltre il +1.", "it": "Verde", "itM": "Art. 122: invio richiesto dall'utente. Basta aggiornare l'informativa (oggi dice 'Nessun server').", "obl": "Un endpoint (Netlify Forms o Function): primo pezzo 'server'. Aggiornare l'informativa. Non chiedere email.", "coer": "Piena: è un gesto esplicito, non sorveglianza.", "par": "Misurare ora", "fase": "MVP", "um": "Sì", "note": "Il KPI migliore per le sezioni demo. Non trasformarlo in lista d'attesa con email (oltre soglia). Limitare a un tocco per dispositivo senza salvare nulla è difficile: accettare qualche doppione.", "soglia": "No", "lor": "eliminato", "lorD": "Eliminata: pulsanti tolti dal sito", "lorNota": "", "risposta": "17/11/2026: i pulsanti volontari sono stati tolti dal sito con la voce T-010 del piano di adeguamento (libro mastro, § 2.4; decisioni del 29 e del 30/10/2026)."}, {"n": 28, "area": "D · Uso delle sezioni", "q": "Quante persone premono 'Mi interessa' nella demo di Progetti?", "calc": "Come riga 27, per Progetti.", "dec": "Priorità tra Agorà e Progetti.", "ut": "Alta", "met": "LV · Invio volontario dell'utente (tocco esplicito)", "dati": "IP in transito su Netlify.", "eu": "Verde", "euM": "Art. 5(3): esenzione per il servizio esplicitamente richiesto (l'utente sceglie di inviare). GDPR: l'IP transita su Netlify; informativa art. 13 sul nuovo invio; nessun dato oltre il +1.", "it": "Verde", "itM": "Art. 122: invio richiesto dall'utente. Basta aggiornare l'informativa (oggi dice 'Nessun server').", "obl": "Un endpoint (Netlify Forms o Function): primo pezzo 'server'. Aggiornare l'informativa. Non chiedere email.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "Sì", "note": "Stesso endpoint della riga 27.", "soglia": "No", "lor": "eliminato", "lorD": "Eliminata: pulsanti tolti dal sito", "lorNota": "", "risposta": "17/11/2026: i pulsanti volontari sono stati tolti dal sito con la voce T-010 del piano di adeguamento (libro mastro, § 2.4; decisioni del 29 e del 30/10/2026)."}, {"n": 29, "area": "D · Uso delle sezioni", "q": "Quali strati/categorie vengono accesi?", "calc": "+1 aggregato per strato acceso, giornaliero.", "dec": "Quali categorie curare di più.", "ut": "Media", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "IP in transito.", "eu": "Arancio", "euM": "EDPB Linee guida 2/2023 (v2, ott. 2024): uno script che fa inviare un segnale al browser è 'accesso' al dispositivo → art. 5(3). Nella lettura EDPB la misura d'audience non è 'strettamente necessaria' → consenso, salvo esenzioni nazionali (CNIL in Francia: da verificare). Standard UE più severo di quello italiano.", "it": "Giallo", "itM": "Garante, provv. n. 231 del 10.6.2021 (GU 9.7.2021): analytics usati solo per statistiche aggregate su un solo sito, senza identificazione, assimilati ai tecnici → nessun consenso, solo informativa.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Accettabile se aggregato; i gusti dei singoli non devono mai esistere.", "par": "Più avanti", "fase": "Dopo società / on-grid", "um": "Sì", "note": null, "soglia": "Sì", "lor": "studio", "lorD": "in fase di studio", "lorNota": "Io lo implementerei, non capisco perché devo usare l'IP. Mi interessa che viene premuto il tasto mica aggregare il comportamento di un utente. E poi anche in caso, perché è oltre soglia? Mi pare che stiamo tenendo i KPI di dati aggregati", "risposta": "L’IP non lo usiamo noi: viaggia con qualunque messaggio che un telefono manda a un server, come il mittente su una busta. Il nodo è la norma europea sull’accesso al dispositivo (art. 5(3) ePrivacy): se l’app fa partire da sola un messaggio quando tocchi un tasto che serve ad altro (accendere uno strato, aprire il calendario), serve il consenso, anche se poi teniamo solo totali. L’aggregazione risolve il GDPR (nessun dato personale salvato), non l’ePrivacy. Nel «Mi interessa» invece il tocco è proprio la richiesta di mandarci il +1, e vale l’esenzione. In Italia il Garante tratta le statistiche aggregate come strumenti tecnici; a livello UE l’EDPB no: con lo standard UE che hai scelto resta oltre soglia."}, {"n": 30, "area": "D · Uso delle sezioni", "q": "Quanto si usano il calendario e 'La mia giornata'?", "calc": "+1 aggregato all'apertura.", "dec": "Se la vista giornata merita altro sviluppo.", "ut": "Media", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "IP in transito.", "eu": "Arancio", "euM": "EDPB Linee guida 2/2023 (v2, ott. 2024): uno script che fa inviare un segnale al browser è 'accesso' al dispositivo → art. 5(3). Nella lettura EDPB la misura d'audience non è 'strettamente necessaria' → consenso, salvo esenzioni nazionali (CNIL in Francia: da verificare). Standard UE più severo di quello italiano.", "it": "Giallo", "itM": "Garante, provv. n. 231 del 10.6.2021 (GU 9.7.2021): analytics usati solo per statistiche aggregate su un solo sito, senza identificazione, assimilati ai tecnici → nessun consenso, solo informativa.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Accettabile.", "par": "Più avanti", "fase": "Dopo società / on-grid", "um": "Sì", "note": "Ora si può capire meglio con test sul campo (riga 44-47).", "soglia": "Sì", "lor": "studio", "lorD": "in fase di studio", "lorNota": "Io lo implementerei, non capisco perché devo usare l'IP. Mi interessa che viene premuto il tasto mica aggregare il comportamento di un utente. E poi anche in caso, perché è oltre soglia? Mi pare che stiamo tenendo i KPI di dati aggregati", "risposta": "L’IP non lo usiamo noi: viaggia con qualunque messaggio che un telefono manda a un server, come il mittente su una busta. Il nodo è la norma europea sull’accesso al dispositivo (art. 5(3) ePrivacy): se l’app fa partire da sola un messaggio quando tocchi un tasto che serve ad altro (accendere uno strato, aprire il calendario), serve il consenso, anche se poi teniamo solo totali. L’aggregazione risolve il GDPR (nessun dato personale salvato), non l’ePrivacy. Nel «Mi interessa» invece il tocco è proprio la richiesta di mandarci il +1, e vale l’esenzione. In Italia il Garante tratta le statistiche aggregate come strumenti tecnici; a livello UE l’EDPB no: con lo standard UE che hai scelto resta oltre soglia."}, {"n": 31, "area": "D · Uso delle sezioni", "q": "Cosa cercano le persone nella barra di ricerca?", "calc": "Testi digitati nella ricerca luoghi/indirizzi.", "dec": "Nessuna che giustifichi il rischio.", "ut": "Bassa", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "Sì: un indirizzo cercato può essere casa propria.", "eu": "Rosso", "euM": "Il contenuto della ricerca può essere un dato personale (indirizzo); art. 5(3) + art. 6 senza base adeguata.", "it": "Rosso", "itM": "Come UE.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Contraria: rivela interessi e luoghi personali.", "par": "Non misurare", "fase": "Mai", "um": "No", "note": "Nota a margine: oggi quei testi vanno già a Photon (komoot) e Nominatim, non dichiarati nell'informativa.", "soglia": "Sì", "lor": "sospeso", "lorD": "Sospesa", "lorNota": "Ricordarsi di mettere nell'informativa la roba di Photon etc", "risposta": "Annotato per la prossima informativa: Photon, Nominatim, Google Fonts, unpkg e cdnjs ricevono l’IP e vanno elencati."}, {"n": 32, "area": "D · Uso delle sezioni", "q": "Quale città scelgono le persone nell'app?", "calc": "+1 aggregato per città selezionata, giornaliero.", "dec": "In quali città promuovere e raccogliere eventi.", "ut": "Alta", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "IP in transito.", "eu": "Arancio", "euM": "EDPB Linee guida 2/2023 (v2, ott. 2024): uno script che fa inviare un segnale al browser è 'accesso' al dispositivo → art. 5(3). Nella lettura EDPB la misura d'audience non è 'strettamente necessaria' → consenso, salvo esenzioni nazionali (CNIL in Francia: da verificare). Standard UE più severo di quello italiano.", "it": "Giallo", "itM": "Garante, provv. n. 231 del 10.6.2021 (GU 9.7.2021): analytics usati solo per statistiche aggregate su un solo sito, senza identificazione, assimilati ai tecnici → nessun consenso, solo informativa.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Buona: misura la domanda per città, non le persone.", "par": "Più avanti", "fase": "Dopo società / on-grid", "um": "Sì", "note": "Meglio della geolocalizzazione IP. Nell'MVP si può approssimare con il pulsante 'Vorrei {nome} nella mia città' (volontario).", "soglia": "Sì", "lor": "studio", "lorD": "in fase di studio", "lorNota": "Io lo implementerei, non capisco perché devo usare l'IP. Mi interessa che viene premuto il tasto mica aggregare il comportamento di un utente. E poi anche in caso, perché è oltre soglia? Mi pare che stiamo tenendo i KPI di dati aggregati", "risposta": "Vale la risposta della riga 29. Il pulsante volontario «Vorrei {nome} qui» resta: è una richiesta esplicita della persona, non un conteggio automatico. 17/11/2026: il pulsante è stato tolto dal sito con la voce T-010."}, {"n": 33, "area": "D · Uso delle sezioni", "q": "Quali lingue vengono usate?", "calc": "+1 aggregato per lingua selezionata.", "dec": "Su quali traduzioni investire.", "ut": "Media", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "IP in transito.", "eu": "Arancio", "euM": "EDPB Linee guida 2/2023 (v2, ott. 2024): uno script che fa inviare un segnale al browser è 'accesso' al dispositivo → art. 5(3). Nella lettura EDPB la misura d'audience non è 'strettamente necessaria' → consenso, salvo esenzioni nazionali (CNIL in Francia: da verificare). Standard UE più severo di quello italiano.", "it": "Giallo", "itM": "Garante, provv. n. 231 del 10.6.2021 (GU 9.7.2021): analytics usati solo per statistiche aggregate su un solo sito, senza identificazione, assimilati ai tecnici → nessun consenso, solo informativa.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Accettabile.", "par": "Più avanti", "fase": "Dopo società / on-grid", "um": "Sì", "note": null, "soglia": "Sì", "lor": "studio", "lorD": "in fase di studio", "lorNota": "Io lo implementerei, non capisco perché devo usare l'IP. Mi interessa che viene premuto il tasto mica aggregare il comportamento di un utente. E poi anche in caso, perché è oltre soglia? Mi pare che stiamo tenendo i KPI di dati aggregati", "risposta": "L’IP non lo usiamo noi: viaggia con qualunque messaggio che un telefono manda a un server, come il mittente su una busta. Il nodo è la norma europea sull’accesso al dispositivo (art. 5(3) ePrivacy): se l’app fa partire da sola un messaggio quando tocchi un tasto che serve ad altro (accendere uno strato, aprire il calendario), serve il consenso, anche se poi teniamo solo totali. L’aggregazione risolve il GDPR (nessun dato personale salvato), non l’ePrivacy. Nel «Mi interessa» invece il tocco è proprio la richiesta di mandarci il +1, e vale l’esenzione. In Italia il Garante tratta le statistiche aggregate come strumenti tecnici; a livello UE l’EDPB no: con lo standard UE che hai scelto resta oltre soglia."}, {"n": 34, "area": "D · Uso delle sezioni", "q": "Quante persone usano la modalità semplice?", "calc": "+1 aggregato all'attivazione.", "dec": "Investimento in accessibilità.", "ut": "Media", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "IP in transito.", "eu": "Arancio", "euM": "EDPB Linee guida 2/2023 (v2, ott. 2024): uno script che fa inviare un segnale al browser è 'accesso' al dispositivo → art. 5(3). Nella lettura EDPB la misura d'audience non è 'strettamente necessaria' → consenso, salvo esenzioni nazionali (CNIL in Francia: da verificare). Standard UE più severo di quello italiano.", "it": "Giallo", "itM": "Garante, provv. n. 231 del 10.6.2021 (GU 9.7.2021): analytics usati solo per statistiche aggregate su un solo sito, senza identificazione, assimilati ai tecnici → nessun consenso, solo informativa.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Accettabile; da non usare per inferire caratteristiche delle persone.", "par": "Più avanti", "fase": "Dopo società / on-grid", "um": "Sì", "note": null, "soglia": "Sì", "lor": "studio", "lorD": "in fase di studio", "lorNota": "Io lo implementerei, non capisco perché devo usare l'IP. Mi interessa che viene premuto il tasto mica aggregare il comportamento di un utente. E poi anche in caso, perché è oltre soglia? Mi pare che stiamo tenendo i KPI di dati aggregati", "risposta": "L’IP non lo usiamo noi: viaggia con qualunque messaggio che un telefono manda a un server, come il mittente su una busta. Il nodo è la norma europea sull’accesso al dispositivo (art. 5(3) ePrivacy): se l’app fa partire da sola un messaggio quando tocchi un tasto che serve ad altro (accendere uno strato, aprire il calendario), serve il consenso, anche se poi teniamo solo totali. L’aggregazione risolve il GDPR (nessun dato personale salvato), non l’ePrivacy. Nel «Mi interessa» invece il tocco è proprio la richiesta di mandarci il +1, e vale l’esenzione. In Italia il Garante tratta le statistiche aggregate come strumenti tecnici; a livello UE l’EDPB no: con lo standard UE che hai scelto resta oltre soglia."}, {"n": 35, "area": "D · Uso delle sezioni", "q": "Quante persone completano la guida iniziale?", "calc": "Aperture della guida vs arrivi all'ultima schermata.", "dec": "Se rifare la guida/tutorial.", "ut": "Media", "met": "L0Q · Ricerca qualitativa volontaria", "dati": "Dei partecipanti ai test.", "eu": "Verde", "euM": "Partecipazione volontaria e informata: consenso art. 6(1)(a) + informativa art. 13 GDPR; nessun accesso al dispositivo dell'utente.", "it": "Verde", "itM": "Consenso e informativa (artt. 13 GDPR, Codice Privacy); conservare i consensi.", "obl": "Informativa e modulo di consenso per i partecipanti; conservare i consensi; non registrare audio se non indispensabile.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Meglio osservarlo in test sul campo con 5-8 persone che contarlo da remoto.", "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "", "risposta": "Operativa come misura dei test sul campo: registri quante persone, in un giro di prova, completano la guida senza aiuto. Nessun dato dalle app degli utenti."}, {"n": 36, "area": "E · Off-Grid e PDF", "q": "Quanti eventi Off-Grid vengono creati?", "calc": "+1 aggregato alla conferma, mai il contenuto dell'evento.", "dec": "Se il percorso del tasto + è capito e usato.", "ut": "Alta", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "IP in transito; il contenuto resta sul dispositivo.", "eu": "Arancio", "euM": "EDPB Linee guida 2/2023 (v2, ott. 2024): uno script che fa inviare un segnale al browser è 'accesso' al dispositivo → art. 5(3). Nella lettura EDPB la misura d'audience non è 'strettamente necessaria' → consenso, salvo esenzioni nazionali (CNIL in Francia: da verificare). Standard UE più severo di quello italiano.", "it": "Giallo", "itM": "Garante, provv. n. 231 del 10.6.2021 (GU 9.7.2021): analytics usati solo per statistiche aggregate su un solo sito, senza identificazione, assimilati ai tecnici → nessun consenso, solo informativa.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Accettabile solo come totale.", "par": "Più avanti", "fase": "Dopo società / on-grid", "um": "Sì", "note": "Per l'MVP: test sul campo. Il contenuto Off-Grid non deve mai lasciare il telefono.", "soglia": "Sì", "lor": "studio", "lorD": "in fase di studio", "lorNota": "Io lo implementerei, non capisco perché devo usare l'IP. Mi interessa che viene premuto il tasto mica aggregare il comportamento di un utente. E poi anche in caso, perché è oltre soglia? Mi pare che stiamo tenendo i KPI di dati aggregati", "risposta": "L’IP non lo usiamo noi: viaggia con qualunque messaggio che un telefono manda a un server, come il mittente su una busta. Il nodo è la norma europea sull’accesso al dispositivo (art. 5(3) ePrivacy): se l’app fa partire da sola un messaggio quando tocchi un tasto che serve ad altro (accendere uno strato, aprire il calendario), serve il consenso, anche se poi teniamo solo totali. L’aggregazione risolve il GDPR (nessun dato personale salvato), non l’ePrivacy. Nel «Mi interessa» invece il tocco è proprio la richiesta di mandarci il +1, e vale l’esenzione. In Italia il Garante tratta le statistiche aggregate come strumenti tecnici; a livello UE l’EDPB no: con lo standard UE che hai scelto resta oltre soglia."}, {"n": 37, "area": "E · Off-Grid e PDF", "q": "Quante persone abbandonano la creazione di un evento?", "calc": "Avviati vs completati, aggregati.", "dec": "Dove semplificare il form.", "ut": "Media", "met": "L0Q · Ricerca qualitativa volontaria", "dati": "Dei partecipanti ai test.", "eu": "Verde", "euM": "Partecipazione volontaria e informata: consenso art. 6(1)(a) + informativa art. 13 GDPR; nessun accesso al dispositivo dell'utente.", "it": "Verde", "itM": "Consenso e informativa (artt. 13 GDPR, Codice Privacy); conservare i consensi.", "obl": "Informativa e modulo di consenso per i partecipanti; conservare i consensi; non registrare audio se non indispensabile.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Un funnel remoto (L2) a livello UE è Arancio; nei test sul campo lo vedi meglio e senza rischi.", "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Tutte le misure volontarie vanno aggregate; teniamole tutte in fase di studio in modo tale da proporle coerentemente", "risposta": "D’accordo: in studio, da proporre insieme alle altre misure volontarie in un’unica richiesta coerente."}, {"n": 38, "area": "E · Off-Grid e PDF", "q": "Quante volte si stampa la giornata in PDF?", "calc": "+1 aggregato alla generazione del PDF.", "dec": "Se mantenere/migliorare la stampa.", "ut": "Bassa", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "IP in transito.", "eu": "Arancio", "euM": "EDPB Linee guida 2/2023 (v2, ott. 2024): uno script che fa inviare un segnale al browser è 'accesso' al dispositivo → art. 5(3). Nella lettura EDPB la misura d'audience non è 'strettamente necessaria' → consenso, salvo esenzioni nazionali (CNIL in Francia: da verificare). Standard UE più severo di quello italiano.", "it": "Giallo", "itM": "Garante, provv. n. 231 del 10.6.2021 (GU 9.7.2021): analytics usati solo per statistiche aggregate su un solo sito, senza identificazione, assimilati ai tecnici → nessun consenso, solo informativa.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Neutra.", "par": "Non misurare", "fase": "Dopo società / on-grid", "um": "No", "note": "Nessuna decisione imminente dipende da questo numero.", "soglia": "Sì", "lor": "studio", "lorD": "in fase di studio", "lorNota": "Io lo implementerei, non capisco perché devo usare l'IP. Mi interessa che viene premuto il tasto mica aggregare il comportamento di un utente. E poi anche in caso, perché è oltre soglia? Mi pare che stiamo tenendo i KPI di dati aggregati", "risposta": "L’IP non lo usiamo noi: viaggia con qualunque messaggio che un telefono manda a un server, come il mittente su una busta. Il nodo è la norma europea sull’accesso al dispositivo (art. 5(3) ePrivacy): se l’app fa partire da sola un messaggio quando tocchi un tasto che serve ad altro (accendere uno strato, aprire il calendario), serve il consenso, anche se poi teniamo solo totali. L’aggregazione risolve il GDPR (nessun dato personale salvato), non l’ePrivacy. Nel «Mi interessa» invece il tocco è proprio la richiesta di mandarci il +1, e vale l’esenzione. In Italia il Garante tratta le statistiche aggregate come strumenti tecnici; a livello UE l’EDPB no: con lo standard UE che hai scelto resta oltre soglia."}, {"n": 39, "area": "E · Off-Grid e PDF", "q": "Quanto si usa l'Ordine delle Fate (link #fate)?", "calc": "Conteggio dei link aperti.", "dec": "Nessuna prima del check legale della funzione.", "ut": "Bassa", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "Il link contiene un evento cifrato: qualunque conteggio toccherebbe il contenuto.", "eu": "Arancio", "euM": "Non valutabile prima del check legale sulla funzione di condivisione.", "it": "Arancio", "itM": "Come UE.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Da valutare.", "par": "Non misurare", "fase": "Dopo società / on-grid", "um": "Sì", "note": "Prima serve il check legale da zero sulla funzione (nota infrastruttura, sezione 8).", "soglia": "Sì", "lor": "sospeso", "lorD": "Sospesa", "lorNota": "Fuori dai nostri scopi di ora", "risposta": "D’accordo: sospesa."}, {"n": 40, "area": "F · Qualità tecnica", "q": "Quanto ci mette l'app a caricarsi?", "calc": "Lighthouse/WebPageTest su telefono di prova, a ogni versione.", "dec": "Se alleggerire file, librerie e mappa.", "ut": "Alta", "met": "L0T · Test interno (nessun utente reale)", "dati": "Nessuno.", "eu": "Verde", "euM": "Misura fatta su dispositivi propri, senza utenti: fuori da GDPR e da art. 5(3).", "it": "Verde", "itM": "Nessun interessato coinvolto.", "obl": "Nessuno.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Il file è 0,5-0,7 MB: va tenuto d'occhio a ogni rilascio.", "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Voglio capire come è realizzato questo test ", "risposta": "Si usa Lighthouse, lo strumento dentro Chrome (F12 → Lighthouse): carica la pagina simulando un telefono di fascia media su rete 4G lenta e misura dopo quanti secondi compare il primo contenuto. Lo fai tu o lo faccio io sui nostri telefoni: nessun utente coinvolto."}, {"n": 41, "area": "F · Qualità tecnica", "q": "Quanti errori JavaScript capitano agli utenti?", "calc": "Invio automatico degli errori a un servizio (tipo Sentry).", "dec": "Correggere bug che non vedi.", "ut": "Media", "met": "L3 · Analytics cookieless di terzi", "dati": "Sì: IP, browser, a volte dati della pagina.", "eu": "Arancio", "euM": "Come L2, più un nuovo responsabile art. 28 (DPA) che tratta IP/hash giornalieri: restano dati personali per il fornitore (C-413/23 P). A livello UE probabile consenso.", "it": "Giallo", "itM": "Garante 2021: senza consenso solo se il terzo maschera almeno il 4° ottetto dell'IP e non incrocia/cede i dati; nuovo fornitore in informativa.", "obl": "Nuovo fornitore + DPA + informativa; a livello UE probabile consenso: OLTRE SOGLIA.", "coer": "Debole.", "par": "Non misurare", "fase": "Dopo società / on-grid", "um": "No", "note": "Ora: test interni su più telefoni + segnalazioni volontarie (riga 16).", "soglia": "Sì", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Non ho capito cosa misura ed a cosa serve", "risposta": "Misura i guasti del codice che capitano sui telefoni degli utenti (una funzione che si blocca). Servirebbe a correggere bug che noi non vediamo. Richiede un servizio esterno che riceve dati dai telefoni: oltre soglia."}, {"n": 42, "area": "F · Qualità tecnica", "q": "Quante volte la mappa non si carica?", "calc": "Prove periodiche da reti diverse + segnalazioni volontarie.", "dec": "Se cambiare fornitore di mappe o ospitare le librerie in casa.", "ut": "Media", "met": "L0T · Test interno (nessun utente reale)", "dati": "Nessuno.", "eu": "Verde", "euM": "Misura fatta su dispositivi propri, senza utenti: fuori da GDPR e da art. 5(3).", "it": "Verde", "itM": "Nessun interessato coinvolto.", "obl": "Nessuno.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Ospitare in casa font e librerie (oggi da Google Fonts e unpkg) riduce sia i guasti sia gli IP mandati a terzi.", "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Non ho capito cosa misura ed a cosa serve", "risposta": "Misura se la mappa riesce a caricarsi su reti e telefoni diversi: le librerie della mappa arrivano da server esterni che alcune reti bloccano. Serve a decidere se ospitare quelle librerie dentro il sito. Si fa con prove nostre."}, {"n": 43, "area": "F · Qualità tecnica", "q": "L'app funziona con rete lenta o assente?", "calc": "Test con throttling del browser.", "dec": "Priorità alla modalità offline.", "ut": "Media", "met": "L0T · Test interno (nessun utente reale)", "dati": "Nessuno.", "eu": "Verde", "euM": "Misura fatta su dispositivi propri, senza utenti: fuori da GDPR e da art. 5(3).", "it": "Verde", "itM": "Nessun interessato coinvolto.", "obl": "Nessuno.", "coer": "Piena: accessibilità.", "par": "Più avanti", "fase": "MVP", "um": "No", "note": null, "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Non ho capito cosa misura ed a cosa serve", "risposta": "Verifica se l’app funziona con connessione lenta o assente, per esempio in metropolitana. Calendario e Off-Grid funzionano già senza rete perché stanno sul telefono; mappa e PDF no. Serve a decidere se investire in una modalità senza rete. Prove nostre."}, {"n": 44, "area": "G · Impatto e qualitativo", "q": "Le persone scoprono eventi che non conoscevano?", "calc": "Domanda in interviste o in un sondaggio volontario anonimo.", "dec": "Prova della mission (asimmetria informativa); argomento per Smart&Start.", "ut": "Alta", "met": "L0Q · Ricerca qualitativa volontaria", "dati": "Dei partecipanti, con consenso.", "eu": "Verde", "euM": "Partecipazione volontaria e informata: consenso art. 6(1)(a) + informativa art. 13 GDPR; nessun accesso al dispositivo dell'utente.", "it": "Verde", "itM": "Consenso e informativa (artt. 13 GDPR, Codice Privacy); conservare i consensi.", "obl": "Informativa e modulo di consenso per i partecipanti; conservare i consensi; non registrare audio se non indispensabile.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Hai già un metodo (interviste trascritte e analizzate): ripeterlo dopo il lancio.", "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Tutte le misure volontarie vanno aggregate; teniamole tutte in fase di studio in modo tale da proporle coerentemente", "risposta": "D’accordo: in studio, da proporre insieme alle altre misure volontarie."}, {"n": 45, "area": "G · Impatto e qualitativo", "q": "Le persone sono andate davvero a un evento trovato su {nome}?", "calc": "Domanda in intervista o sondaggio volontario.", "dec": "Impatto reale sulla partecipazione.", "ut": "Alta", "met": "L0Q · Ricerca qualitativa volontaria", "dati": "Dei partecipanti, con consenso.", "eu": "Verde", "euM": "Partecipazione volontaria e informata: consenso art. 6(1)(a) + informativa art. 13 GDPR; nessun accesso al dispositivo dell'utente.", "it": "Verde", "itM": "Consenso e informativa (artt. 13 GDPR, Codice Privacy); conservare i consensi.", "obl": "Informativa e modulo di consenso per i partecipanti; conservare i consensi; non registrare audio se non indispensabile.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Non reintrodurre 'Ci vado' nell'app: era stato tolto per motivi legali.", "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Tutte le misure volontarie vanno aggregate; teniamole tutte in fase di studio in modo tale da proporle coerentemente", "risposta": "D’accordo: in studio, da proporre insieme alle altre misure volontarie."}, {"n": 46, "area": "G · Impatto e qualitativo", "q": "{nome} riduce la sensazione di solitudine?", "calc": "Questionario validato (es. scala breve sulla solitudine), prima/dopo.", "dec": "Impatto sociale per bandi e Report della Città.", "ut": "Alta", "met": "L0Q · Ricerca qualitativa volontaria", "dati": "Sì, e potenzialmente dati sulla salute (benessere psicologico).", "eu": "Arancio", "euM": "Possibili dati di categoria particolare (art. 9 GDPR): consenso esplicito, garanzie, probabile DPIA.", "it": "Arancio", "itM": "Come UE; Codice Privacy e regole deontologiche per la ricerca scientifica.", "obl": "Consenso esplicito art. 9(2)(a), DPIA probabile, partner di ricerca.", "coer": "Piena come fine, delicata come mezzo.", "par": "Più avanti", "fase": "Dopo società / on-grid", "um": "Sì", "note": "Un questionario sulla solitudine può toccare dati sulla salute (art. 9 GDPR). Da fare con un partner universitario e il suo comitato etico.", "soglia": "Sì", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Tutte le misure volontarie vanno aggregate; teniamole tutte in fase di studio in modo tale da proporle coerentemente", "risposta": "D’accordo: in studio. In più qui servono il consenso esplicito e un partner di ricerca (possibili dati sulla salute, art. 9 GDPR)."}, {"n": 47, "area": "G · Impatto e qualitativo", "q": "Le persone consiglierebbero {nome}?", "calc": "Domanda 0-10 in sondaggio volontario.", "dec": "Qualità percepita; confronto tra versioni.", "ut": "Media", "met": "L0Q · Ricerca qualitativa volontaria", "dati": "Dei partecipanti, con consenso.", "eu": "Verde", "euM": "Partecipazione volontaria e informata: consenso art. 6(1)(a) + informativa art. 13 GDPR; nessun accesso al dispositivo dell'utente.", "it": "Verde", "itM": "Consenso e informativa (artt. 13 GDPR, Codice Privacy); conservare i consensi.", "obl": "Informativa e modulo di consenso per i partecipanti; conservare i consensi; non registrare audio se non indispensabile.", "coer": "Piena.", "par": "Più avanti", "fase": "MVP", "um": "No", "note": null, "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Tutte le misure volontarie vanno aggregate; teniamole tutte in fase di studio in modo tale da proporle coerentemente", "risposta": "D’accordo: in studio, da proporre insieme alle altre misure volontarie."}, {"n": 48, "area": "H · Esclusi per principio", "q": "Quanto tempo passano le persone nell'app?", "calc": "Durata delle sessioni.", "dec": "Nessuna compatibile con {nome}.", "ut": "Bassa", "met": "L3 · Analytics cookieless di terzi", "dati": "Sì.", "eu": "Arancio", "euM": "Come L2, più un nuovo responsabile art. 28 (DPA) che tratta IP/hash giornalieri: restano dati personali per il fornitore (C-413/23 P). A livello UE probabile consenso.", "it": "Giallo", "itM": "Garante 2021: senza consenso solo se il terzo maschera almeno il 4° ottetto dell'IP e non incrocia/cede i dati; nuovo fornitore in informativa.", "obl": "Nuovo fornitore + DPA + informativa; a livello UE probabile consenso: OLTRE SOGLIA.", "coer": "Contraria al principio anti-dipendenza: premierebbe il design che trattiene.", "par": "Non misurare", "fase": "Mai", "um": "No", "note": "{nome} funziona se le persone escono e vanno all'evento, non se restano sullo schermo.", "soglia": "Sì", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Proprio per evitare che le persone stiano molto tempo nell'app, bisogna capire quanto tempo passano dentro l'app", "risposta": "Ottimo punto, coerente con l’anti-dipendenza: misurare per tenere basso il tempo. Due strade: solo sul telefono, mostrato alla persona come il «Tempo di utilizzo» di Android (nessun invio, utile anche a lei); oppure totali per noi, con lo stesso nodo ePrivacy delle misure automatiche. Per lo studio propongo la prima, più eventualmente una risposta volontaria."}, {"n": 49, "area": "H · Esclusi per principio", "q": "Quante volte la stessa persona torna (retention, DAU/MAU)?", "calc": "Richiede un identificativo persistente per persona.", "dec": "Nessuna compatibile.", "ut": "Bassa", "met": "L4 · Tracciamento individuale", "dati": "Sì: identificativo persistente.", "eu": "Rosso", "euM": "Identificativo persistente o profilazione: consenso art. 5(3) e art. 6(1)(a), probabile DPIA art. 35, registro art. 30. Escluso.", "it": "Rosso", "itM": "Consenso con banner a pulsanti paritari (Garante 2021), registro, DPIA. Escluso.", "obl": "Consenso, banner, registro, DPIA: ESCLUSO.", "coer": "Contraria: metrica di engagement.", "par": "Non misurare", "fase": "Mai", "um": "No", "note": null, "soglia": "Sì", "lor": "sospeso", "lorD": "Sospesa", "lorNota": "", "risposta": ""}, {"n": 50, "area": "H · Esclusi per principio", "q": "Dove cliccano le persone sulla mappa (heatmap)?", "calc": "Coordinate di ogni tocco inviate al server.", "dec": "Nessuna che giustifichi il rischio.", "ut": "Bassa", "met": "L4 · Tracciamento individuale", "dati": "Sì: i punti toccati rivelano interessi e luoghi personali.", "eu": "Rosso", "euM": "Identificativo persistente o profilazione: consenso art. 5(3) e art. 6(1)(a), probabile DPIA art. 35, registro art. 30. Escluso.", "it": "Rosso", "itM": "Consenso con banner a pulsanti paritari (Garante 2021), registro, DPIA. Escluso.", "obl": "Consenso, banner, registro, DPIA: ESCLUSO.", "coer": "Contraria: profilazione geografica.", "par": "Non misurare", "fase": "Mai", "um": "No", "note": "Già escluso nello studio DEV 3.", "soglia": "Sì", "lor": "sospeso", "lorD": "Sospesa", "lorNota": "", "risposta": ""}];
/* nome e casella dalla configurazione */
MZ_KPI.forEach(k => Object.keys(k).forEach(c => { if(typeof k[c]==='string') k[c] = k[c].split('{nome}').join(NOME).split('{casella}').join(CASELLA); }));

/* ======================= Misure (solo admin): si misura la città, non le persone =======================
   Tranche 1 (6 ottobre 2026). Tutto resta sul telefono dell'admin, nella chiave agorapp_misure:
   - totali del giorno calcolati dagli eventi on-grid (mai copia degli eventi: l'informativa promette che spariscono 3 ore dopo la fine);
   - numeri inseriti a mano (richieste da Netlify, azioni di comunicazione, rimozioni, segnalazioni, test, interviste);
   - soglie, stato delle decisioni, decisioni sul catalogo delle 50 domande.
   Nessun dato degli utenti, nessuna rete. I pulsanti volontari «Mi interessa» della seconda tranche sono stati tolti con T-010. */
const MZ_KEY = 'agorapp_misure';
let MZ = null;
function mz(){
  if(MZ) return MZ;
  const d = LS.get(MZ_KEY, null) || {};
  MZ = Object.assign({v:1, giorni:{}, visti:{}, creati:{}, richieste:{}, azioni:[], rimozioni:[], segnalazioni:{}, correzioni:{}, versioni:[], prove:[], giri:[], rete:{},
    soglie:{}, stati:{}, mie:{}}, d);
  MZ.soglie = Object.assign({zona:2, nuovi:50, carico:3}, MZ.soglie||{}); delete MZ.soglie.interesse;   /* soglia dei pulsanti volontari, tolta con T-010 */
  /* le soglie sono numeri positivi: un valore diverso nella memoria del telefono torna a quello di partenza (T-024) */
  Object.entries({zona:2, nuovi:50, carico:3}).forEach(([k,v]) => { const n = Number(MZ.soglie[k]); MZ.soglie[k] = isFinite(n) && n>0 ? n : v; });
  return MZ;
}
function mzSalva(){ if(!LS.set(MZ_KEY, MZ)) avviso(tr('Spazio esaurito sul telefono: esporta le misure in Excel.'), null, true); }
const MS = {scheda:'panoramica', periodo:30, ambito:'tutte', filtroCat:'operativo', sezLib:'', vista:{}};

/* ---------- Libreria delle misure: ogni domanda del catalogo ha uno stato e, se operativa, si accende e spegne ----------
   stati: operativo (si vede nella sua sezione se è accesa) · studio · sospeso · eliminato */
const HA_PANNELLO = new Set([1,2,3,4,5,6,7,8,9,10,11,13,15,16,17,18,20,35,37,40,42,43,44,45,47]);   /* 27, 28 e 32 (pulsanti volontari) tolti con T-010 */
const SEZ_DI_AREA = {A:'offerta', B:'rete', C:'accessi', D:'accessi', E:'accessi', F:'qualita', G:'impatto', H:'panoramica'};
const SEZ_KPI = {35:'impatto', 37:'impatto'};   /* misure dei test sul campo: il loro pannello sta in Impatto */
const sezioneKpi = k => SEZ_KPI[k.n] || SEZ_DI_AREA[(k.area||'').trim().charAt(0)] || 'panoramica';
const STATI_LIB = {operativo:'Operativa', segnaposto:'Spazio pronto', studio:'In studio', rimandato:'Fase 2', sospeso:'Sospesa', eliminato:'Eliminata'};
const STATO_CLS = {operativo:'ok', segnaposto:'warn', studio:'neu', rimandato:'neu', sospeso:'crit', eliminato:'crit'};
const statoDaDecisione = d => d==='Misurare ora' ? 'operativo' : d==='Più avanti' ? 'studio' : d==='Non misurare' ? 'eliminato' : d==='Da discutere' ? 'sospeso' : null;
function libStato(n){
  const m = mz(), x = (m.lib||{})[n]; if(x && x.stato) return x.stato;
  const k = MZ_KPI.find(y => y.n==n); if(!k) return 'studio';
  return k.lor || statoDaDecisione(k.par) || 'studio';   /* decisione di Lorenzo nel file del 6 ottobre */
}
const libVisibile = n => { const x = (mz().lib||{})[n]; return !x || x.visibile!==false; };
const on = n => libStato(n)==='operativo' && libVisibile(n) && HA_PANNELLO.has(n);
const pronto = n => libStato(n)==='segnaposto' && libVisibile(n);
const kpiDi = n => MZ_KPI.find(k => k.n==n);
function perchePronto(n){ const k = kpiDi(n); return k && k.risposta ? k.risposta.replace(/^Spazio pronto e vuoto, come hai chiesto\. /,'') : tr('In studio: si accende quando sarà chiaro come farlo restando conformi.'); }
function libSet(n, campi){ const m = mz(); m.lib = m.lib||{}; m.lib[n] = Object.assign({}, m.lib[n]||{}, campi, {agg:oggi()}); mzSalva(); }

/* ---------- quale evento conta ---------- */
const mzReale = e => e && typeof e==='object' && !e.personal && !e.offgrid && e.datetime && isFinite(+e.lat) && isFinite(+e.lng);
function mzEventi(){ return events.filter(e => mzReale(e)).filter(e => MS.ambito==='tutte' || cittaDi(e)===citta); }
function cittaDi(e){
  let best = 'altro', bd = 1e9; const la = +e.lat, ln = +e.lng;
  CITTA.forEach(c => {
    if(c.bounds){ const [[w,s],[E,n]] = c.bounds; if(ln>=w && ln<=E && la>=s && la<=n){ bd = 0; best = c.id; } return; }
    const d = Math.hypot(la-c.center[0], (ln-c.center[1])*Math.cos(c.center[0]*Math.PI/180))*111;
    if(d<bd){ bd = d; best = c.id; }
  });
  return bd<=35 ? best : 'altro';
}
const nomeCitta = id => (CITTA.find(c => c.id===id)||{n:tr('Altrove')}).n;
const zonaDi = e => (QUARTIERI.find(q => +e.lat>=q.la[0] && +e.lat<q.la[1] && +e.lng>=q.ln[0] && +e.lng<q.ln[1])||{}).n || null;
function creatoDi(e){
  if(e.creato){ const t = Date.parse(e.creato); if(!isNaN(t)) return t; }
  const id = String(e.id||''); let m;
  if(/^\d{12,14}$/.test(id)) return +id;
  if((m = id.match(/^x([0-9a-z]{8})/))){ const t = parseInt(m[1],36); if(t>1.5e12 && t<4e12) return t; }
  return null;
}
const gratuitoMz = e => /^(gratuit|gratis|free|ingresso libero|libero|offerta libera|0\s*€?$)/i.test(String(e.price||'').trim());
const FASCE_MZ = [['mattina','Mattina',6,12],['pomeriggio','Pomeriggio',12,18],['sera','Sera',18,23],['notte','Notte',23,30]];
const fasciaDi = h => (FASCE_MZ.find(f => (h>=f[2] && h<f[3]) || (h+24>=f[2] && h+24<f[3]))||FASCE_MZ[3])[0];

/* ---------- la fotografia del giorno: solo totali ---------- */
function mzFotografa(){
  const m = mz(), g = oggi(), L = events.filter(e => mzReale(e));
  const per = f => { const o = {}; L.forEach(e => { const k = f(e); if(k!=null) o[k] = (o[k]||0)+1; }); return o; };
  m.giorni[g] = {tot:L.length, citta:per(cittaDi), strati:per(e => e.category||'?'), prov:per(e => e.provenienza||'nd'), imp:L.filter(e => e.importato).length, grat:L.filter(gratuitoMz).length};
  L.forEach(e => { if(m.visti[e.id]) return; const c = creatoDi(e), gc = c ? ymd(new Date(c)) : g; m.visti[e.id] = gc; m.creati[gc] = (m.creati[gc]||0)+1; });
  const lim = piuGiorni(g,-120); Object.keys(m.visti).forEach(id => { if(m.visti[id]<lim) delete m.visti[id]; });
  const limG = piuGiorni(g,-400); Object.keys(m.giorni).forEach(k => { if(k<limG) delete m.giorni[k]; });
  mzSalva();
}
function misureConta(tipo){ if(!st.admin) return; const m = mz(), g = oggi(); m.correzioni[g] = m.correzioni[g]||{c:0, r:0}; m.correzioni[g][tipo==='rimossi'?'r':'c']++; mzSalva(); }

/* ---------- periodi ---------- */
const mzGiorni = n => { const out = [], g = oggi(); for(let i=n-1;i>=0;i--) out.push(piuGiorni(g,-i)); return out; };
/* i conteggi sono numeri: un valore della memoria del telefono che non lo è vale zero (T-024) */
const numMz = x => { const n = Number(x); return isFinite(n) ? n : 0; };
const somma = (o, giorni, f) => giorni.reduce((s,g) => s + (o && o[g]!=null ? numMz(f ? f(o[g]) : o[g]) : 0), 0);
const nf = n => n==null ? '–' : Number(n).toLocaleString('it-IT');
const n1 = x => String(Math.round(x*10)/10).replace('.',',');
const brevD = s => dIso(s).toLocaleDateString(dloc(), {day:'numeric', month:'short'}).replace('.','');
const lungD = s => dIso(s).toLocaleDateString(dloc(), {weekday:'short', day:'numeric', month:'short'}).replace(/\./g,'');
function nuoviIn(giorni){ return somma(mz().creati, giorni); }
function serieAttivi(giorni){ const m = mz(); return giorni.map(g => { const x = m.giorni[g]; if(!x) return null; return MS.ambito==='tutte' ? x.tot : (x.citta||{})[citta]||0; }); }

/* ---------- indicatori ---------- */
function zoneConteggio(L){
  const da = Date.now(), a = da + 7*864e5, o = {}; QUARTIERI.forEach(q => o[q.n] = 0);
  L.forEach(e => { const t = new Date(e.datetime).getTime(); if(t<da-864e5 || t>a) return; const z = zonaDi(e); if(z) o[z]++; });
  return o;
}
function mzStato(){
  const m = mz(), L = mzEventi(), g7 = mzGiorni(7), gP = mzGiorni(MS.periodo);
  const torino = L.filter(e => cittaDi(e)==='torino');
  const zone = zoneConteggio(torino), sotto = QUARTIERI.filter(q => zone[q.n] < m.soglie.zona);
  const prov = {consenso:0, pubblica:0, nd:0}; L.forEach(e => prov[e.provenienza==='consenso'?'consenso':e.provenienza==='pubblica'?'pubblica':'nd']++);
  const conCreato = L.map(e => [e, creatoDi(e)]).filter(x => x[1]);
  const anticipo = conCreato.length ? conCreato.reduce((s,[e,c]) => s + Math.max(0, new Date(e.datetime).getTime()-c), 0)/conCreato.length/864e5 : null;
  const nuovi7 = nuoviIn(g7), nuoviP = nuoviIn(gP);
  const corr = somma(m.correzioni, gP, x => (x.c||0)+(x.r||0));
  const ric = gP.map(g => m.richieste[g]).filter(v => v!=null);
  return {L, zone, sotto, prov, anticipo, nuovi7, nuoviP, corr, ric, mediaRic: ric.length ? Math.round(ric.reduce((a,b)=>a+b,0)/ric.length) : null,
    qualita: nuoviP ? corr/nuoviP*100 : null, segn: somma(m.segnalazioni, gP), grat: L.length ? Math.round(L.filter(gratuitoMz).length/L.length*100) : null,
    imp: L.filter(e => e.importato).length, perCitta: CITTA.map(c => [c.n, events.filter(e => mzReale(e) && cittaDi(e)===c.id).length])};
}
function effettoAzione(a){
  const m = mz(), media = arr => { const v = arr.filter(x => x!=null); return v.length>=2 ? v.reduce((p,q)=>p+q,0)/v.length : null; };
  const prima = media([1,2,3].map(k => m.richieste[piuGiorni(a.d,-k)])), dopo = media([0,1,2].map(k => m.richieste[piuGiorni(a.d,k)]));
  return prima && dopo ? Math.round((dopo/prima-1)*100) : null;
}
const oreTra = (a,b) => { const x = Date.parse(a), y = Date.parse(b); return isNaN(x)||isNaN(y) ? null : Math.max(0, Math.round((y-x)/36e5)); };

function decisioniMz(S){
  const m = mz(), out = [];
  const firma = (id, s) => id+'|'+s;
  if(S.L.some(e => cittaDi(e)==='torino') && S.sotto.length) out.push({id:firma('zone', S.sotto.map(q=>q.n).join(',')), liv:'crit', st:tr('Da fare'),
    tit: S.sotto.length===1 ? tr('Una zona di Torino resta sotto {s} eventi nei prossimi 7 giorni',{s:m.soglie.zona}) : tr('{n} zone di Torino restano sotto {s} eventi nei prossimi 7 giorni',{n:S.sotto.length, s:m.soglie.zona}),
    perche: S.sotto.slice(0,8).map(q => q.n+' ('+S.zone[q.n]+')').join(', ')+(S.sotto.length>8?'…':'')+'. '+tr('Lì la mappa sembra vuota: è l’asimmetria informativa che {nome} vuole ridurre.'),
    azione: tr('Cerca fonti in quelle zone: biblioteche, circoli, parrocchie, spazi associativi.'), kpi:[5,12]});
  const vuote = CITTA.filter(c => !events.some(e => mzReale(e) && cittaDi(e)===c.id));
  if(vuote.length) out.push({id:firma('citta', vuote.map(c=>c.id).join(',')), liv:'warn', st:tr('Da valutare'), tit: tr('Città senza eventi: {c}',{c:vuote.map(c=>c.n).join(', ')}),
    perche: tr('Chi sceglie una di queste città trova la mappa vuota.'), azione: tr('Scegli la prossima città da riempire, anche con l’import dai siti dei Comuni.'), kpi:[3,10]});
  if(S.nuovi7 < m.soglie.nuovi) out.push({id:firma('ritmo', oggi()), liv:'warn', st:tr('Sotto obiettivo'), tit: tr('{n} eventi nuovi negli ultimi 7 giorni (obiettivo {o})',{n:S.nuovi7, o:m.soglie.nuovi}),
    perche: tr('Il ritmo di raccolta decide quanto la mappa resta viva.'), azione: tr('Riprendi la lista delle fonti o prova un nuovo import.'), kpi:[2,10]});
  const tot = S.prov.consenso+S.prov.pubblica+S.prov.nd;
  if(tot && S.prov.nd/tot > .5) out.push({id:firma('prov', String(Math.round(S.prov.nd/tot*10))), liv:'warn', st:tr('Da fare'), tit: tr('Per {p} % degli eventi manca la provenienza',{p:Math.round(S.prov.nd/tot*100)}),
    perche: tr('Senza provenienza non si vede quanta parte dell’offerta ha il consenso diretto dell’organizzatore, la base giuridica più solida.'), azione: tr('Indica la provenienza nel form dell’evento o nella colonna «Provenienza» dell’Excel.'), kpi:[6]});
  const lente = m.rimozioni.filter(r => { const h = oreTra(r.ric, r.eva); return h!=null && h>48; });
  if(lente.length) out.push({id:firma('48h', lente.length), liv:'crit', st:tr('Da fare'), tit: tr('{n} richieste di rimozione evase dopo 48 ore',{n:lente.length}),
    perche: tr('L’informativa promette la rimozione entro 48 ore.'), azione: tr('Controlla la casella {casella} più spesso.',{casella:CASELLA}), kpi:[15]});
  if(m.richieste[oggi()]==null) out.push({id:firma('netlify', oggi()), liv:'neu', st:tr('Promemoria'), tit: tr('Manca il numero di oggi da Netlify'),
    perche: tr('Sul piano gratuito Netlify tiene i numeri solo 24 ore: un giorno saltato resta un buco.'), azione: tr('Copialo in «Accessi».'), kpi:[18], vai:'accessi'});
  const v = m.versioni[m.versioni.length-1];
  if(v && v.s > m.soglie.carico) out.push({id:firma('peso', v.v), liv:'warn', st:tr('Da fare'), tit: tr('{v} carica in {s} s (obiettivo {o} s)',{v:v.v, s:n1(v.s), o:n1(m.soglie.carico)}),
    perche: tr('Pesano font e librerie caricati da fuori.'), azione: tr('Ospita in casa font e librerie: più veloce, e nessun IP mandato a Google o unpkg.'), kpi:[40,42]});
  const az = m.azioni.slice().reverse().find(a => effettoAzione(a)!=null);
  if(az){ const e = effettoAzione(az); out.push({id:firma('az', az.d+az.t), liv: e>=10 ? 'ok' : 'neu', st: e>=10 ? tr('Funziona') : tr('Effetto debole'),
    tit: tr('«{t}» del {d}: richieste {e} %',{t:az.t, d:brevD(az.d), e:(e>=0?'+':'')+e}), perche: tr('Confronto per data: tre giorni prima e tre giorni dopo. Nessun link tracciato, nessun parametro nell’indirizzo.'),
    azione: e>=10 ? tr('Ripeti il canale e confronta di nuovo.') : tr('Prova un canale diverso.'), kpi:[20]}); }
  return out.filter(d => mz().stati[d.id]!=='fatto');
}

/* ---------- pezzi grafici ---------- */
const mzIco = {
  indietro:'<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M11 3 5 9l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  info:'<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M9 8v4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="5.6" r=".9" fill="currentColor"/></svg>',
  lucchetto:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" stroke-width="1.4"/></svg>',
  avviso:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2 1.5 13.5h13L8 2Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 6.5v3.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.6" r=".85" fill="currentColor"/></svg>',
  su:'<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1.5 9 7.5H1Z" fill="currentColor"/></svg>',
  giu:'<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 8.5 1 2.5h8Z" fill="currentColor"/></svg>',
  avanti:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 3 5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x:'<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="m3.5 3.5 7 7M10.5 3.5l-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
};
const FONTI_MZ = {ev:'Dagli eventi', man:'Da Netlify, a mano', test:'Test interno', int:'Interviste', mail:'Dalla posta', reg:'Registro a mano'};
const fonteMz = k => `<span class="mz-fonte mz-f-${k}">${tr(FONTI_MZ[k])}</span>`;
const righeBtn = (k, l) => `<button class="mz-fonte" data-mz="kpiset" data-k="${k.join(',')}" data-l="${esc(l)}">${k.length>1?tr('righe'):tr('riga')} ${k.join(', ')}</button>`;
function mzTile(lab, val, det, fonte, metro, warn, kpi){
  if(pronto(kpi[0])) return `<button class="mz-tile mz-tile-attesa" data-mz="kpi" data-n="${kpi[0]}"><span class="mz-lab">${lab}</span><span class="mz-val">–</span><span class="mz-det">${tr('Spazio pronto, in studio. Tocca per sapere perché.')}</span><span class="mz-stato warn">${tr('Spazio pronto')}</span></button>`;
  if(!on(kpi[0])) return '';
  return `<button class="mz-tile" data-mz="kpiset" data-k="${kpi.join(',')}" data-l="${esc(lab)}"><span class="mz-lab">${lab}</span><span class="mz-val">${val}</span>${metro!=null?`<span class="mz-metro${warn?' warn':''}" aria-hidden="true"><i style="width:${metro>0?Math.max(2,Math.round(Math.min(1,metro)*100)):0}%"></i></span>`:''}<span class="mz-det">${det}</span>${fonteMz(fonte)}</button>`;
}
function mzBox(id, tit, corpo, tab, fonte, kpi){
  if(pronto(kpi[0])) return `<section class="mz-box mz-pronto"><div class="mz-btesta"><div><div class="mz-btit">${tit}</div><div class="mz-etich"><span class="mz-stato warn">${tr('Spazio pronto · in studio')}</span>${righeBtn(kpi.slice(0,1), tit)}</div></div></div><p class="mz-perche">${esc(perchePronto(kpi[0]))}</p></section>`;
  if(!on(kpi[0])) return '';
  const t = MS.vista[id]==='tab' && tab;
  return `<section class="mz-box" aria-labelledby="mzg-${id}"><div class="mz-btesta"><div><div class="mz-btit" id="mzg-${id}">${tit}</div><div class="mz-etich">${fonteMz(fonte)}${righeBtn(kpi, tit)}</div></div>${tab?`<button class="mz-vista" data-mz="vista" data-v="${id}">${t?tr('Grafico'):tr('Tabella')}</button>`:''}</div>${t?tab:corpo}</section>`;
}
const bloccataMzVecchia = (n, t, why) => `<button class="mz-bloccata" data-mz="kpi" data-n="${n}"><span class="mz-tondo">${mzIco.lucchetto}</span><span><b>${t}</b><span class="meta">${why}</span><span class="meta mz-sottolineato">${tr('Riga {n} del catalogo',{n})}</span></span></button>`;
const bloccataMz = () => '';
function studioSezioneMz(sez){
  const L = MZ_KPI.filter(k => sezioneKpi(k)===sez), st0 = L.filter(k => ['studio','sospeso','rimandato'].includes(libStato(k.n))).length, spente = L.filter(k => libStato(k.n)==='operativo' && HA_PANNELLO.has(k.n) && !libVisibile(k.n)).length;
  if(!st0 && !spente) return '';
  return `<button class="mz-bloccata" data-mz="scheda" data-v="libreria" data-f="${st0?'studio':'operativo'}" data-sez="${sez}"><span class="mz-tondo">${mzIco.lucchetto}</span><span><b>${[st0?(st0===1?tr('1 misura di questa sezione è in studio, sospesa o in Fase 2'):tr('{n} misure di questa sezione sono in studio, sospese o in Fase 2',{n:st0})):'', spente?(spente===1?tr('1 operativa nascosta da te'):tr('{n} operative nascoste da te',{n:spente})):''].filter(Boolean).join(' · ')}</b><span class="meta mz-sottolineato">${tr('Apri la libreria')}</span></span></button>`;
}
const vuotoMz = t => `<p class="mz-nota">${t}</p>`;
function hbarMz(items, col){
  const max = Math.max(1, ...items.map(x => x[1]));
  return `<div class="mz-hbar">${items.map(([k,v]) => `<span class="mz-nome">${esc(k)}</span><span class="mz-riga"><span class="mz-barra${v===0?' zero':''}" style="width:${v===0?0:Math.max(2,v/max*78)}%;${col?'background:'+col:''}"></span><span class="mz-v${v===0?' vuota':''}">${v===0?tr('vuota'):nf(v)}</span></span>`).join('')}</div>`;
}
const LINEE_MZ = {};
function niceStepMz(mx){ const raw = Math.max(1,mx)/4, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw/p; return Math.max(1,(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p); }
function lineaMz(id, serie, giorni, opt){
  opt = opt||{};
  const W = 360, H = 190, pl = 44, pr = 10, pt = 14, pb = 24, n = giorni.length;
  const vals = serie.flatMap(s => s.v).filter(v => v!=null);
  if(!vals.length) return vuotoMz(opt.vuoto || tr('Ancora nessun dato in questo periodo.'));
  const step = niceStepMz(Math.max(...vals)), mx = Math.ceil(Math.max(...vals)/step)*step || step;
  const x = i => pl + (W-pl-pr)*(n===1 ? .5 : i/(n-1)), y = v => pt + (H-pt-pb)*(1 - v/mx);
  LINEE_MZ[id] = {serie, giorni, W, H, pl, pr, pt, x, azioni:opt.azioni||[]};
  let o = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(serie.map(s => s.nome).join(', '))}" data-mzline="${id}" style="touch-action:pan-y">`;
  for(let v=0; v<=mx; v+=step) o += `<line x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}" class="mz-griglia"/><text x="${pl-6}" y="${y(v)+4}" text-anchor="end">${nf(v)}</text>`;
  const tick = n<=8 ? 1 : n<=31 ? 7 : 21;
  for(let i=n-1; i>=0; i-=tick) o += `<text x="${x(i)}" y="${H-6}" text-anchor="${i===n-1?'end':i===0?'start':'middle'}">${brevD(giorni[i])}</text>`;
  (opt.azioni||[]).forEach(a => { o += `<line x1="${x(a.i)}" x2="${x(a.i)}" y1="${pt}" y2="${H-pb}" class="mz-az"/><circle cx="${x(a.i)}" cy="${pt}" r="4" class="mz-az-p"/>`; });
  serie.forEach(s => {
    let d = '', pen = false; s.v.forEach((v,i) => { if(v==null){ pen = false; return; } d += `${pen?'L':'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`; pen = true; });
    if(serie.length===1 && !s.v.some(v => v==null) && n>1) o += `<path d="M${x(0)},${y(0)}L${s.v.map((v,i) => x(i).toFixed(1)+','+y(v).toFixed(1)).join('L')}L${x(n-1)},${y(0)}Z" fill="${s.col}" opacity=".1"/>`;
    o += `<path d="${d}" fill="none" stroke="${s.col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    s.v.forEach((v,i) => { const solo = v!=null && (i===0 || s.v[i-1]==null) && (i===n-1 || s.v[i+1]==null); if(solo) o += `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${s.col}"/>`; });
    let li = s.v.length-1; while(li>0 && s.v[li]==null) li--;
    if(s.v[li]!=null) o += `<circle cx="${x(li)}" cy="${y(s.v[li])}" r="4" fill="${s.col}" class="mz-anello"/>`;
  });
  o += `<line class="mz-mirino" x1="0" x2="0" y1="${pt}" y2="${H-pb}" opacity="0"/><rect x="${pl}" y="${pt}" width="${W-pl-pr}" height="${H-pt-pb}" fill="transparent"/></svg>`;
  return o;
}
function tabLineaMz(serie, giorni){
  return `<div class="mz-scorri" style="max-height:280px"><table class="mz-tab"><tr><th>${tr('Giorno')}</th>${serie.map(s => `<th class="n">${esc(s.nome)}</th>`).join('')}</tr>${giorni.map((g,i) => `<tr><td>${lungD(g)}</td>${serie.map(s => `<td class="n">${s.v[i]==null?`<span class="meta">${tr('nessun dato')}</span>`:nf(s.v[i])}</td>`).join('')}</tr>`).reverse().join('')}</table></div>`;
}
const decCls = l => ({crit:'crit', warn:'warn', ok:'ok', neu:'neu'})[l]||'neu';

/* ---------- schede ---------- */
const SCHEDE_MZ = [['panoramica','Panoramica'],['offerta','Offerta'],['rete','Rete'],['accessi','Accessi'],['qualita','Qualità'],['impatto','Impatto'],['libreria','Libreria · 50']];
const PER_MZ = {7:'7 giorni', 30:'30 giorni', 90:'3 mesi'};
function disegnaMisure(){
  const el = $('pagina-misure'); if(!el) return;
  const y = el.scrollTop;
  const conFiltri = MS.scheda!=='libreria';
  const ambito = MS.ambito==='tutte' ? tr('Tutte le città') : nomeCitta(citta);
  el.innerHTML = `<div class="mz-testa">
      <div class="mz-barra-t"><button class="mz-icona" data-mz="esci" aria-label="${esc(tr('Torna all’admin'))}">${mzIco.indietro}</button><h1>${tr('Misure')}</h1>
        <button class="mz-chip" data-mz="ambito" aria-label="${esc(tr('Cambia ambito: {a}',{a:ambito}))}"><span>${esc(ambito)}</span></button>
        <button class="mz-icona" data-mz="fonti" aria-label="${esc(tr('Da dove vengono i numeri'))}">${mzIco.info}</button></div>
      ${conFiltri?`<div class="seg mz-periodo" role="group" aria-label="${esc(tr('Periodo'))}">${[7,30,90].map(p => `<button data-mz="periodo" data-v="${p}" aria-pressed="${MS.periodo===p}">${tr(PER_MZ[p])}</button>`).join('')}</div>`:''}
      <nav class="mz-schede" aria-label="${esc(tr('Sezioni delle misure'))}">${SCHEDE_MZ.map(([k,t]) => `<button data-mz="scheda" data-v="${k}" aria-pressed="${MS.scheda===k}"><span>${tr(t)}</span></button>`).join('')}</nav>
    </div>
    <div class="mz-corpo">
      ${({panoramica:vPanoramicaMz, offerta:vOffertaMz, rete:vReteMz, accessi:vAccessiMz, qualita:vQualitaMz, impatto:vImpattoMz, libreria:vLibreriaMz})[MS.scheda]()}
      <p class="meta mz-piede">${tr('Le misure restano su questo telefono (chiave agorapp_misure) e si esportano in Excel. Nessun dato sulle persone che usano l’app.')}</p>
      <button class="tasto sec pieno" data-mz="esporta">${tr('Esporta le misure in Excel')}</button>
    </div>`;
  el.scrollTop = y;
  const a = el.querySelector('.mz-schede [aria-pressed="true"]'); if(a && a.scrollIntoView) a.scrollIntoView({inline:'nearest', block:'nearest'});
}

function vPanoramicaMz(){
  const m = mz(), S = mzStato(), g = mzGiorni(MS.periodo), att = serieAttivi(g);
  const oggiN = S.L.length, prima = att[Math.max(0, att.length-8)];
  const zTot = QUARTIERI.length, zOk = zTot - S.sotto.length;
  const totP = S.prov.consenso+S.prov.pubblica+S.prov.nd, quotaCons = totP ? Math.round(S.prov.consenso/totP*100) : null;
  const rimP = m.rimozioni.filter(r => (r.ric||'').slice(0,10) >= g[0]), rimOk = rimP.filter(r => { const h = oreTra(r.ric, r.eva); return h!=null && h<=48; }).length;
  const decs = decisioniMz(S).filter(d => on(d.kpi[0]));
  const sp = att.filter(v => v!=null);
  return `<h2 class="mz-h1">${tr('Il polso della città')}</h2>
    <p class="meta">${tr('Si misura la città, non le persone.')} ${esc(MS.ambito==='tutte'?tr('Tutte le città'):nomeCitta(citta))} · ${tr('ultimi {p}',{p:tr(PER_MZ[MS.periodo])})} · ${tr('aggiornato adesso')}</p>
    ${on(1)?`<div class="mz-card mz-hero"><div><div class="mz-lab">${tr('Eventi attivi oggi')}</div><div class="mz-num">${nf(oggiN)}</div>
      ${prima!=null?`<span class="mz-delta ${oggiN>=prima?'su':'giu'}">${oggiN>=prima?mzIco.su:mzIco.giu} ${oggiN>=prima?'+':'−'}${Math.abs(oggiN-prima)} ${tr('rispetto a 7 giorni fa')}</span>`:`<span class="meta">${tr('Il confronto arriva dopo qualche giorno di misure.')}</span>`}</div>
      ${sp.length>1?`<div class="mz-spark">${sparkMz(sp)}</div>`:''}<div>${fonteMz('ev')}</div></div>`:''}
    <h2 class="mz-h2">${tr('Indicatori')}</h2><p class="meta">${tr('Ognuno riassume più domande della libreria. Toccali per vedere quali; accendi e spegni le misure dalla libreria.')}</p>
    <div class="mz-griglia2">
      ${mzTile(tr('Copertura delle zone'), `${zOk}<small> ${tr('su {n}',{n:zTot})}</small>`, tr('zone di Torino con almeno {s} eventi nei prossimi 7 giorni',{s:m.soglie.zona}), 'ev', zOk/zTot, zOk<zTot, [5,3])}
      ${mzTile(tr('Ritmo di raccolta'), `${nf(S.nuovi7)}<small> / ${tr('sett.')}</small>`, tr('eventi nuovi inseriti da te ({nome}), non nuovi utenti · obiettivo {o}',{o:m.soglie.nuovi}), 'ev', S.nuovi7/m.soglie.nuovi, S.nuovi7<m.soglie.nuovi, [2,10,12])}
      ${mzTile(tr('Solidità delle fonti'), quotaCons==null?'–':`${quotaCons}<small> %</small>`, tr('eventi con consenso diretto')+(rimP.length?' · '+tr('rimozioni entro 48 h: {a} su {b}',{a:rimOk, b:rimP.length}):''), 'ev', quotaCons==null?null:quotaCons/100, false, [6,15,13])}
      ${mzTile(tr('Richieste al sito'), S.mediaRic==null?'–':`${nf(S.mediaRic)}<small> / ${tr('giorno')}</small>`, S.mediaRic==null?tr('copia i numeri da Netlify in «Accessi»'):tr('media del periodo · un indice, non persone'), 'man', null, false, [18,20])}
      ${mzTile(tr('Qualità dei dati'), S.qualita==null?'–':`${n1(S.qualita)}<small> %</small>`, tr('eventi corretti o rimossi sui nuovi · {n} segnalazioni',{n:S.segn}), 'ev', null, false, [11,16])}
    </div>
    <h2 class="mz-h2">${tr('Cosa decidere adesso')}</h2><p class="meta">${tr('Ogni misura serve a una decisione. Le soglie le scegli tu.')}</p>
    <div class="mz-pila">${decs.length ? decs.map(d => `<article class="mz-dec"><span class="mz-stato ${decCls(d.liv)}">${d.liv==='crit'||d.liv==='warn'?mzIco.avviso:''}${d.st}</span><h3>${esc(d.tit)}</h3><p class="mz-perche">${esc(d.perche)}</p><p class="mz-azione">${esc(d.azione)}</p>
      <div class="mz-azioni"><button data-mz="dec" data-id="${esc(d.id)}">${tr('Fatto')}</button>${d.vai?`<button data-mz="scheda" data-v="${d.vai}">${tr('Vai')}</button>`:''}<button data-mz="kpiset" data-k="${d.kpi.join(',')}" data-l="${esc(d.tit)}">${d.kpi.length>1?tr('Righe'):tr('Riga')} ${d.kpi.join(', ')}</button></div></article>`).join('') : vuotoMz(tr('Niente da decidere adesso.'))}</div>
    ${Object.values(m.stati).some(v => v==='fatto')?`<button class="link" data-mz="rimetti">${tr('Rimetti le decisioni segnate come fatte')}</button>`:''}
    <button class="tasto sec pieno" data-mz="soglie">${tr('Cambia le soglie')}</button>
    <h2 class="mz-h2">${tr('Cosa non vedrai mai qui')}</h2>
    <p class="mz-nota">${tr('Quanto tempo le persone restano nell’app, quante volte tornano, dove toccano la mappa, cosa cercano, chi sono. Sono misure escluse per principio o per legge: le trovi nel Catalogo, con il motivo.')}</p>
    <button class="tasto sec pieno" data-mz="scheda" data-v="libreria" data-f="eliminato">${tr('Vedi le misure eliminate')}</button>
    ${studioSezioneMz('panoramica')}`;
}
function sparkMz(v){ const W = 150, H = 48, mn = Math.min(...v), mx = Math.max(...v); const x = i => i/(v.length-1)*(W-8)+4, y = a => H-5-(a-mn)/((mx-mn)||1)*(H-12);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" aria-hidden="true"><path d="${v.map((a,i) => `${i?'L':'M'}${x(i).toFixed(1)},${y(a).toFixed(1)}`).join('')}" fill="none" class="mz-spark-l" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${x(v.length-1)}" cy="${y(v[v.length-1])}" r="4" class="mz-spark-p"/></svg>`; }

function vOffertaMz(){
  const m = mz(), S = mzStato(), g = mzGiorni(MS.periodo), att = serieAttivi(g);
  const strati = LAYERS.map(l => [tr(l.label), S.L.filter(e => e.category===l.id).length]).sort((a,b) => b[1]-a[1]);
  const tot = S.prov.consenso+S.prov.pubblica+S.prov.nd;
  const fa = [[tr('Consenso diretto'), S.prov.consenso, 'var(--mz-c1)'], [tr('Fonte pubblica'), S.prov.pubblica, 'var(--mz-c2)'], [tr('Non indicata'), S.prov.nd, 'var(--mz-nd)']];
  const heat = FASCE_MZ.map(() => [0,0,0,0,0,0,0]); S.L.forEach(e => { const d = new Date(e.datetime); if(isNaN(d)) return; heat[FASCE_MZ.findIndex(f => f[0]===fasciaDi(d.getHours()))][(d.getDay()+6)%7]++; });
  const hmax = Math.max(1, ...heat.flat()), GG = giorniBrevi(), ordine = [1,2,3,4,5,6,0];
  return `<h2 class="mz-h1">${tr('Offerta di eventi')}</h2><p class="meta">${tr('Calcolato dagli eventi che pubblichi: nessun utente coinvolto. Si conservano solo i totali del giorno, non gli eventi.')}</p>
    ${mzBox('attivi', tr('Eventi attivi ogni giorno'), lineaMz('attivi', [{nome:tr('Eventi attivi'), v:att, col:'var(--verde)'}], g, {vuoto:tr('Il grafico si riempie un giorno alla volta: ogni volta che apri le Misure si salva il totale del giorno.')})+`<p class="meta">${tr('Un giorno in cui l’admin non apre le Misure resta un buco.')}</p>`, tabLineaMz([{nome:tr('Eventi attivi'), v:att}], g), 'ev', [1])}
    <div class="mz-griglia2">
      ${mzTile(tr('Nuovi nel periodo'), nf(S.nuoviP), tr('inseriti da te ({nome}), non nuovi utenti · ultimi 7 giorni: {n}',{n:S.nuovi7}), 'ev', null, false, [2])}
      ${mzTile(tr('Anticipo medio'), S.anticipo==null?'–':`${n1(S.anticipo)}<small> ${tr('giorni')}</small>`, tr('tra pubblicazione e inizio'), 'ev', null, false, [9])}
      ${mzTile(tr('Gratuiti'), S.grat==null?'–':`${S.grat}<small> %</small>`, tr('eventi con ingresso libero'), 'ev', null, false, [7])}
      ${mzTile(tr('Da import Excel'), nf(S.imp), tr('eventi attivi arrivati da un file'), 'ev', null, false, [10])}
    </div>
    ${mzBox('citta', tr('Eventi attivi per città'), hbarMz(S.perCitta), null, 'ev', [3])}
    ${mzBox('zone', tr('Zone di Torino · eventi nei prossimi 7 giorni'), zoneMz(S), `<table class="mz-tab"><tr><th>${tr('Zona')}</th><th class="n">${tr('Eventi')}</th></tr>${QUARTIERI.map(q => `<tr><td>${esc(q.n)}</td><td class="n">${S.zone[q.n]}</td></tr>`).join('')}</table>`, 'ev', [5])}
    ${mzBox('strati', tr('Eventi attivi per strato'), hbarMz(strati)+`<p class="meta">${tr('Gli strati più sottili sono quelli da cercare.')}</p>`, null, 'ev', [4])}
    ${mzBox('prov', tr('Da dove arrivano gli eventi'), tot ? `<div class="mz-stack" role="img" aria-label="${esc(fa.map(f => f[0]+' '+f[1]).join(', '))}">${fa.filter(f => f[1]).map(f => `<i style="width:${f[1]/tot*100}%;background:${f[2]}" data-mztip="<b>${esc(f[0])}</b><br>${f[1]} ${tr('eventi')} · ${Math.round(f[1]/tot*100)} %"></i>`).join('')}</div>
      <div class="mz-legenda">${fa.map(f => `<span><i style="background:${f[2]}"></i>${esc(f[0])} · ${Math.round(f[1]/tot*100)} %</span>`).join('')}</div><p class="meta">${tr('Più consenso diretto = base giuridica più solida (art. 6(1)(a) GDPR). La provenienza si indica nel form dell’evento o nella colonna «Provenienza» dell’Excel.')}</p>` : vuotoMz(tr('Nessun evento attivo.')),
      `<table class="mz-tab"><tr><th>${tr('Provenienza')}</th><th class="n">${tr('Eventi')}</th></tr>${fa.map(f => `<tr><td>${esc(f[0])}</td><td class="n">${f[1]}</td></tr>`).join('')}</table>`, 'ev', [6])}
    ${mzBox('heat', tr('Quando ci sono eventi'), `<div class="mz-heat"><span></span>${ordine.map(d => `<span class="mz-h c">${esc(GG[(d+6)%7])}</span>`).join('')}${FASCE_MZ.map((f,r) => `<span class="mz-h">${tr(f[1])}</span>${ordine.map(d => { const c = (d+6)%7, v = heat[r][c], lv = v ? Math.min(5, Math.ceil(v/hmax*5)) : 0; return `<button style="background:var(--mz-s${lv});color:${lv>=4?'var(--su-verde)':'var(--testo)'}" data-mztip="<b>${esc(GG[c])} · ${tr(f[1])}</b><br>${v} ${tr('eventi')}" aria-label="${esc(GG[c]+' '+tr(f[1])+': '+v)}">${v||''}</button>`; }).join('')}`).join('')}</div>
      <div class="mz-scala"><span>0</span><span class="mz-rampa">${[0,1,2,3,4,5].map(i => `<i style="background:var(--mz-s${i})"></i>`).join('')}</span><span>${hmax}</span></div>`,
      `<div class="mz-scorri"><table class="mz-tab"><tr><th></th>${ordine.map(d => `<th class="n">${esc(GG[(d+6)%7])}</th>`).join('')}</tr>${FASCE_MZ.map((f,r) => `<tr><td>${tr(f[1])}</td>${ordine.map(d => `<td class="n">${heat[r][(d+6)%7]}</td>`).join('')}</tr>`).join('')}</table></div>`, 'ev', [8])}
    ${bloccataMz(12, tr('Le fonti che rendono di più'), tr('Servirebbe un campo «fonte» per ogni evento: da decidere insieme, è una domanda «più avanti».'))}
    ${studioSezioneMz('offerta')}`;
}
function zoneMz(S){
  const max = Math.max(1, ...Object.values(S.zone)), s = mz().soglie.zona;
  return `<div class="mz-zone">${QUARTIERI.map(q => { const v = S.zone[q.n], sotto = v < s, lv = sotto ? 0 : Math.min(5, Math.max(1, Math.ceil(v/max*5)));
    return `<button class="${sotto?'sotto':''}" style="background:var(--mz-s${lv});color:${lv>=4?'var(--su-verde)':'var(--testo)'}" data-mztip="<b>${esc(q.n)}</b><br>${v} ${tr('eventi')}${sotto?' · '+tr('sotto soglia'):''}" aria-label="${esc(q.n+': '+v+(sotto?', '+tr('sotto soglia'):''))}"><span class="mz-zn">${esc(q.n)}</span><span class="mz-zv">${v}${sotto?` <small>· ${tr('sotto soglia')}</small>`:''}</span></button>`; }).join('')}</div>
    <div class="mz-scala"><span>${tr('meno')}</span><span class="mz-rampa">${[0,1,2,3,4,5].map(i => `<i style="background:var(--mz-s${i})"></i>`).join('')}</span><span>${tr('più')}</span><span style="margin-left:auto">${tr('tratteggio = sotto soglia ({s})',{s})}</span></div>
    <p class="meta">${tr('Sono le zone dei «vuoti» della mappa: rettangoli provvisori, i confini veri delle circoscrizioni sono rimandati.')}</p>`;
}

function vReteMz(){
  const m = mz(), S = mzStato(), g = mzGiorni(MS.periodo);
  const luoghi = new Set(S.L.map(e => normT(e.addressFull||e.address||'') || (+e.lat).toFixed(4)+','+(+e.lng).toFixed(4))).size;
  const segnP = somma(m.segnalazioni, g);
  const rim = m.rimozioni.slice().sort((a,b) => (b.ric||'').localeCompare(a.ric||''));
  return `<h2 class="mz-h1">${tr('Rete di organizzatori e luoghi')}</h2><p class="meta">${tr('Conteggi su ciò che gestisci già. Niente nomi.')}</p>
    <div class="mz-griglia2">
      ${mzTile(tr('Eventi con consenso diretto'), nf(S.prov.consenso), tr('organizzatori che pubblicano con te'), 'ev', null, false, [13])}
      ${mzTile(tr('Luoghi sulla mappa'), nf(luoghi), tr('indirizzi distinti degli eventi attivi'), 'ev', null, false, [17])}
      ${mzTile(tr('Segnalazioni ricevute'), nf(segnP), tr('eventi non validi, nel periodo'), 'mail', null, false, [16])}
      ${mzTile(tr('Richieste di rimozione'), nf(m.rimozioni.length), tr('registrate in tutto'), 'reg', null, false, [15])}
    </div>
    ${on(16)?`<div class="mz-card"><h3>${tr('Una segnalazione arrivata')}</h3><p class="meta">${tr('Un evento non valido segnalato su {casella}. Si conta solo il numero, non chi scrive.',{casella:CASELLA})}</p>
      <div class="tasti"><button class="tasto sec" data-mz="segn-meno" ${m.segnalazioni[oggi()]?'':'disabled'}>${tr('Togli l’ultima')}</button><button class="tasto pri" data-mz="segn-piu">${tr('+1 oggi')}${m.segnalazioni[oggi()]?' · '+m.segnalazioni[oggi()]:''}</button></div></div>`:''}
    ${mzBox('rimoz', tr('Registro delle richieste di rimozione'), `<form class="mz-form" data-mzform="rimozione"><div class="due"><label class="mz-etich">${tr('Ricevuta')}<span class="campo"><input type="datetime-local" name="ric" required></span></label><label class="mz-etich">${tr('Evasa')}<span class="campo"><input type="datetime-local" name="eva"></span></label></div><button class="tasto sec pieno" type="submit">${tr('Aggiungi al registro')}</button></form>
      ${rim.length ? `<div class="mz-scorri"><table class="mz-tab"><tr><th>${tr('Ricevuta')}</th><th>${tr('Evasa')}</th><th class="n">${tr('Ore')}</th><th>${tr('Entro 48 h')}</th><th></th></tr>${rim.map(r => { const h = oreTra(r.ric, r.eva), i = m.rimozioni.indexOf(r);
        return `<tr><td>${esc(fmtDt(r.ric))}</td><td>${r.eva?esc(fmtDt(r.eva)):`<button class="link" data-mz="rim-evasa" data-i="${i}">${tr('Evasa ora')}</button>`}</td><td class="n">${h==null?'–':h}</td><td>${h==null?(oreTra(r.ric,new Date().toISOString())>48?`<span class="mz-stato crit">${tr('Scaduta')}</span>`:`<span class="mz-stato neu">${tr('Aperta')}</span>`):h<=48?`<span class="mz-stato ok">${tr('Sì')}</span>`:`<span class="mz-stato crit">${tr('No')}</span>`}</td><td><button class="mz-icona piccola" data-mz="rim-togli" data-i="${i}" aria-label="${esc(tr('Togli dal registro'))}">${mzIco.x}</button></td></tr>`; }).join('')}</table></div>` : vuotoMz(tr('Nessuna richiesta registrata.'))}
      <p class="meta">${tr('Solo date e ore, niente nomi. Serve a dimostrare che rispetti i diritti (artt. 5(2) e 12 GDPR).')}</p>`, null, 'reg', [15])}
    ${bloccataMz(14, tr('Organizzatori che tornano a pubblicare'), tr('Prima va aggiunta la finalità statistica all’informativa per gli organizzatori (art. 6(4) GDPR).'))}
    ${studioSezioneMz('rete')}`;
}
const fmtDt = s => { const d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString(dloc(), {day:'numeric', month:'short'}).replace('.','')+' '+hm(d); };

function vAccessiMz(){
  const m = mz(), g = mzGiorni(MS.periodo), r = g.map(x => m.richieste[x]!=null ? m.richieste[x] : null);
  const az = m.azioni.map(a => ({i:g.indexOf(a.d), t:a.t})).filter(a => a.i>=0);
  const mancanti = r.filter(v => v==null).length;
  const elenco = m.azioni.slice().sort((a,b) => b.d.localeCompare(a.d)).slice(0,8);
  return `<h2 class="mz-h1">${tr('Accessi')}</h2><p class="meta">${on(18)?tr('I totali di Netlify, che copi a mano ogni giorno, e le azioni di comunicazione segnate per data.'):tr('Il traffico del sito è in studio: gli spazi sono pronti e vuoti.')}</p>
    ${mzBox('rich', tr('Richieste al sito ogni giorno'), lineaMz('rich', [{nome:tr('Richieste'), v:r, col:'var(--verde)'}], g, {azioni:az, vuoto:tr('Copia qui sotto il numero di oggi da Netlify: il grafico parte da lì.')})+`<div class="mz-legenda"><span><i class="mz-l-az"></i>${tr('azione di comunicazione')}</span><span>${tr('giorni senza dato: {n}',{n:mancanti})}</span></div>`, tabLineaMz([{nome:tr('Richieste'), v:r}], g), 'man', [18,20])}
    ${mzBox('banda', tr('Banda consumata e picchi'), '', null, 'man', [19])}
    ${on(18)?`<div class="mz-avviso">${mzIco.avviso}<p><strong>${tr('Richieste, non persone.')}</strong> ${tr('Una visita fa molte richieste. Netlify non sa da che città arrivano: il filtro città qui non vale. Sul piano gratuito i numeri restano solo 24 ore: vanno copiati ogni giorno.')}</p></div>`:''}
    ${mzBox('azioni', tr('Effetto delle azioni di comunicazione'), '', null, 'man', [20])}
    ${on(18)||on(20)?`<div class="mz-card"><h3>${tr('Il numero di oggi')}</h3><p class="meta">${tr('Da Netlify → il progetto → riquadro delle richieste delle ultime 24 ore.')}</p>
      <form class="mz-riga-f" data-mzform="richieste"><label class="sr-only" for="mz-ric">${tr('Richieste di oggi')}</label><span class="campo"><input id="mz-ric" name="n" type="number" inputmode="numeric" min="0" placeholder="${esc(tr('es. 640'))}" value="${m.richieste[oggi()]!=null?m.richieste[oggi()]:''}"></span><button class="tasto pri" type="submit">${tr('Salva')}</button></form>
      <form class="mz-riga-f" data-mzform="azione"><label class="sr-only" for="mz-az">${tr('Azione di comunicazione di oggi')}</label><span class="campo"><input id="mz-az" name="t" type="text" maxlength="60" placeholder="${esc(tr('Azione di oggi, es. un volantino'))}"></span><button class="tasto sec" type="submit">${tr('Segna')}</button></form>
      ${elenco.length?`<div class="mz-elenco">${elenco.map(a => { const e = effettoAzione(a); return `<div><span>${esc(brevD(a.d))} · ${esc(a.t)}</span><span class="meta">${e==null?tr('effetto: servono i numeri di 3 giorni prima e dopo'):tr('effetto: {e} %',{e:(e>=0?'+':'')+e})}</span><button class="mz-icona piccola" data-mz="az-togli" data-i="${m.azioni.indexOf(a)}" aria-label="${esc(tr('Togli'))}">${mzIco.x}</button></div>`; }).join('')}</div>`:''}
      <p class="meta">${tr('Niente link tracciati o parametri nell’indirizzo: per l’EDPB anche il tracciamento via URL rientra nell’art. 5(3) ePrivacy. Basta il confronto per data.')}</p></div>`:''}
    ${studioSezioneMz('accessi')}
    ${bloccataMz(26, tr('Aperture di Agorà, Progetti, calendario'), tr('Contatore automatico via script: per l’EDPB (Linee guida 2/2023) è «accesso» al dispositivo.'))}
    ${bloccataMz(36, tr('Eventi Off-Grid creati'), tr('Il contenuto non lascerebbe mai il telefono; resta comunque un segnale automatico.'))}
    ${bloccataMz(33, tr('Lingue e modalità semplice'), tr('Stesso motivo. Ora: chiedilo nei test sul campo.'))}`;
}

function vQualitaMz(){
  const m = mz(), V = m.versioni.slice(-6), soglia = m.soglie.carico;
  const W = 360, H = 170, pl = 28, pb = 26, pt = 16, mx = Math.max(soglia+1, ...V.map(v => v.s))+.5, n = Math.max(1,V.length);
  const bw = Math.min(24, (W-pl)/n*.5), x = i => pl + (W-pl)/n*(i+.5), y = v => pt + (H-pt-pb)*(1 - v/mx);
  const col = V.length ? `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(tr('Secondi per versione'))}">${Array.from({length:Math.floor(mx)+1}, (_,v) => `<line x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="mz-griglia"/><text x="${pl-6}" y="${y(v)+4}" text-anchor="end">${v}</text>`).join('')}
    <line x1="${pl}" x2="${W}" y1="${y(soglia)}" y2="${y(soglia)}" class="mz-soglia"/>
    ${V.map((v,i) => { const top = y(v.s), bot = y(0), sopra = v.s>soglia; return `<path d="M${x(i)-bw/2},${bot} V${top+4} q0,-4 4,-4 h${bw-8} q4,0 4,4 V${bot} Z" class="${sopra?'mz-col-sopra':'mz-col'}"/><text x="${x(i)}" y="${top-6}" text-anchor="middle" class="mz-t-forte">${n1(v.s)}</text><text x="${x(i)}" y="${H-8}" text-anchor="middle">${esc(v.v.slice(0,10))}</text><rect x="${x(i)-22}" y="${pt}" width="44" height="${H-pt-pb}" fill="transparent" data-mztip="<b>${esc(v.v)}</b><br>${n1(v.s)} s · ${esc(brevD(v.d))}"/>`; }).join('')}</svg>
    <div class="mz-legenda"><span><i class="mz-l-soglia"></i>${tr('obiettivo {s} s',{s:n1(soglia)})}</span><span><i style="background:var(--verde)"></i>${tr('entro l’obiettivo')}</span><span><i style="background:var(--mz-c3)"></i>${tr('oltre')}</span></div>` : vuotoMz(tr('Nessuna misura ancora.'));
  const RL = [['mappa3g', tr('Mappa con rete 3G')], ['cal', tr('Calendario senza rete')], ['pdf', tr('PDF senza rete')]];
  const ES = {'':tr('da provare'), ok:tr('funziona'), no:tr('non funziona')};
  if(![40,42,43].some(on)) return `<h2 class="mz-h1">${tr('Qualità tecnica')}</h2><p class="meta">${tr('Misurata sui tuoi telefoni, non su quelli degli utenti.')}</p>${studioSezioneMz('qualita')}`;
  return `<h2 class="mz-h1">${tr('Qualità tecnica')}</h2><p class="meta">${tr('Misurata sui tuoi telefoni, non su quelli degli utenti.')}</p>
    ${mzBox('vers', tr('Primo contenuto visibile, per versione'), col+`<form class="mz-form" data-mzform="versione"><div class="due"><label class="mz-etich">${tr('Versione')}<span class="campo"><input name="v" maxlength="24" required placeholder="${esc(tr('es. Restyling 4.3'))}"></span></label><label class="mz-etich">${tr('Secondi')}<span class="campo"><input name="s" type="number" step="0.1" min="0" required placeholder="3,2"></span></label></div><button class="tasto sec pieno" type="submit">${tr('Aggiungi la misura')}</button></form>
      <p class="meta">${tr('Lighthouse o WebPageTest, telefono simulato, rete 4G lenta. Una misura a ogni rilascio.')}</p>${V.length?`<button class="link" data-mz="vers-togli">${tr('Togli l’ultima misura')}</button>`:''}`,
      V.length?`<table class="mz-tab"><tr><th>${tr('Versione')}</th><th>${tr('Data')}</th><th class="n">${tr('Secondi')}</th></tr>${m.versioni.map(v => `<tr><td>${esc(v.v)}</td><td>${esc(brevD(v.d))}</td><td class="n">${n1(v.s)}</td></tr>`).join('')}</table>`:null, 'test', [40])}
    ${mzBox('prove', tr('Prove della mappa'), `<form class="mz-form" data-mzform="prova"><div class="due"><label class="mz-etich">${tr('Rete e telefono')}<span class="campo"><input name="rete" maxlength="40" required placeholder="${esc(tr('es. 4G, Realme'))}"></span></label><label class="mz-etich">${tr('Esito')}<span class="campo"><select name="ok"><option value="1">${tr('Caricata')}</option><option value="0">${tr('Non caricata')}</option></select></span></label></div><label class="mz-etich">${tr('Nota')}<span class="campo"><input name="nota" maxlength="80" placeholder="${esc(tr('es. caricata in 2,1 s'))}"></span></label><button class="tasto sec pieno" type="submit">${tr('Aggiungi la prova')}</button></form>
      ${m.prove.length?`<div class="mz-scorri"><table class="mz-tab"><tr><th>${tr('Data')}</th><th>${tr('Rete')}</th><th>${tr('Esito')}</th><th></th></tr>${m.prove.slice().reverse().map(p => `<tr><td>${esc(brevD(p.d))}</td><td>${esc(p.rete)}</td><td>${p.ok?`<span class="mz-stato ok">${tr('Ok')}</span>`:`<span class="mz-stato crit">${tr('No')}</span>`} <span class="meta">${esc(p.nota||'')}</span></td><td><button class="mz-icona piccola" data-mz="prova-togli" data-i="${m.prove.indexOf(p)}" aria-label="${esc(tr('Togli'))}">${mzIco.x}</button></td></tr>`).join('')}</table></div>`:''}`, null, 'test', [42])}
    ${on(43)?`<div class="mz-card"><h3>${tr('Rete lenta o assente')}</h3><p class="meta">${tr('Tocca per cambiare lo stato.')}</p><div class="mz-pila">${RL.map(([k,l]) => `<button class="riga-int" data-mz="rete" data-k="${k}"><div><span class="t">${l}</span></div><span class="mz-stato ${m.rete[k]==='ok'?'ok':m.rete[k]==='no'?'crit':'neu'}">${ES[m.rete[k]||'']}</span></button>`).join('')}</div></div>`:''}
    ${bloccataMz(41, tr('Errori JavaScript sui telefoni degli utenti'), tr('Servirebbe un servizio esterno (tipo Sentry): nuovo fornitore, IP e dati del browser.'))}
    ${studioSezioneMz('qualita')}`;
}

function vImpattoMz(){
  const m = mz(), G = m.giri.slice().reverse(), u = G[0];
  const fr = (t, v, tot, k) => !on(k) ? '' : `<button class="mz-tile" data-mz="kpiset" data-k="${k}" data-l="${esc(t)}"><span class="mz-fr"><span>${t}</span><b>${v} ${tr('su')} ${tot}</b></span><span class="mz-barre" aria-hidden="true">${Array.from({length:Math.min(tot,30)}, (_,i) => `<i class="${i<Math.round(v/tot*Math.min(tot,30))?'on':''}"></i>`).join('')}</span></button>`;
  if(![35,37,44,45,47].some(on)) return `<h2 class="mz-h1">${tr('Impatto')}</h2>${studioSezioneMz('impatto')}`;
  return `<h2 class="mz-h1">${tr('Impatto')}</h2><p class="meta">${tr('Si chiede alle persone, con il loro consenso. Con pochi partecipanti si mostrano i conteggi, non le percentuali.')}</p>
    ${u ? `<div class="mz-card"><div class="mz-lab">${esc(brevD(u.d))}</div><h3>${esc(u.titolo||tr('Giro di interviste'))} · ${tr('{n} persone',{n:u.n})}</h3><div class="mz-pila">
      ${fr(tr('Hanno scoperto eventi che non conoscevano'), u.scoperto, u.n, 44)}${fr(tr('Sono andate davvero a un evento trovato qui'), u.andato, u.n, 45)}${fr(tr('Hanno completato la guida iniziale senza aiuto'), u.guida, u.n, 35)}${fr(tr('Hanno creato un Off-Grid al primo tentativo'), u.og, u.n, 37)}</div>
      ${on(47)&&u.cons!=null&&u.cons!==''?`<p class="meta">${tr('Lo consiglierebbero: mediana {c} su 10.',{c:u.cons})}</p>`:''}${fonteMz('int')}</div>` : vuotoMz(tr('Nessun giro di interviste registrato. Dopo il lancio: 8–10 persone, stessa traccia di domande, così i giri si confrontano.'))}
    <div class="mz-card"><h3>${tr('Registra un giro di prova sul campo')}</h3><form class="mz-form" data-mzform="giro">
      <label class="mz-etich">${tr('Nome del giro')}<span class="campo"><input name="titolo" maxlength="40" placeholder="${esc(tr('es. Dopo il lancio'))}"></span></label>
      <div class="due">${[['n',tr('Persone'),0,'min="1" max="200" required'],['scoperto',tr('Hanno scoperto eventi nuovi'),44,'min="0"'],['andato',tr('Sono andate a un evento'),45,'min="0"'],['guida',tr('Guida completata senza aiuto'),35,'min="0"'],['og',tr('Off-Grid al primo tentativo'),37,'min="0"'],['cons',tr('Lo consiglierebbero (mediana 0–10)'),47,'min="0" max="10" step="0.5"']].filter(x => !x[2] || on(x[2])).map(x => `<label class="mz-etich">${x[1]}<span class="campo"><input name="${x[0]}" type="number" ${x[3]}></span></label>`).join('')}</div>
      <button class="tasto sec pieno" type="submit">${tr('Salva il giro')}</button></form>${G.length>1?`<p class="meta">${tr('Giri precedenti: {g}',{g:esc(G.slice(1).map(x => (x.titolo||brevD(x.d))+' ('+x.n+')').join(' · '))})}</p>`:''}${u?`<button class="link" data-mz="giro-togli">${tr('Togli l’ultimo giro')}</button>`:''}</div>
    ${bloccataMz(46, tr('{nome} riduce la solitudine?'), tr('Domande sul benessere possono essere dati sulla salute (art. 9 GDPR): solo con un partner universitario e il suo comitato etico.'))}
    ${studioSezioneMz('impatto')}`;
}

const NOMI_SEZ = Object.fromEntries([['panoramica','Panoramica'],['offerta','Offerta'],['rete','Rete'],['accessi','Accessi'],['qualita','Qualità'],['impatto','Impatto']]);
const ORDINE_LIB = ['operativo','segnaposto','studio','rimandato','sospeso','eliminato'];
const statoChip = n => { const s = libStato(n); return `<span class="mz-stato ${STATO_CLS[s]}">${tr(STATI_LIB[s])}</span>`; };
const interruttoreMz = n => { const v = libVisibile(n); return `<button class="mz-switch" role="switch" aria-checked="${v}" data-mz="lib-vis" data-n="${n}" aria-label="${esc(tr('Mostra la riga {n} nella sua sezione',{n}))}"><i aria-hidden="true"></i><span>${v?tr('Visibile'):tr('Nascosta')}</span></button>`; };
const perInformativa = () => MZ_KPI.filter(k => /informativa/i.test(k.lorNota||''));
function vLibreriaMz(){
  const m = mz(), f = MS.filtroCat, sz = MS.sezLib||'';
  const passa = (k, x) => (x==='tutti' || libStato(k.n)===x) && (!sz || sezioneKpi(k)===sz);
  const lista = MZ_KPI.filter(k => passa(k, f));
  const conAppunti = MZ_KPI.filter(k => ((m.lib||{})[k.n]||{}).appunti).length;
  return `<h2 class="mz-h1">${tr('Libreria delle misure')}</h2>
    <p class="meta">${tr('Le 50 domande, con la tua decisione. Le operative compaiono nella loro sezione: spegnile qui se non ti servono. Le altre restano qui con il loro studio, finché non le rendi operative o le elimini.')}</p>
    <nav class="mz-schede mz-filtri" aria-label="${esc(tr('Filtra per stato'))}">${ORDINE_LIB.concat('tutti').map(k => `<button data-mz="filtro" data-v="${k}" aria-pressed="${f===k}"><span>${tr(k==='tutti'?'Tutte':STATI_LIB[k])} · ${MZ_KPI.filter(x => passa(x,k)).length}</span></button>`).join('')}</nav>
    ${sz?`<p class="meta">${tr('Solo la sezione «{s}».',{s:tr(NOMI_SEZ[sz])})} <button class="link" data-mz="lib-sez" data-v="">${tr('Mostra tutte le sezioni')}</button></p>`:''}
    <p class="meta">${f==='operativo'?tr('L’interruttore mostra o nasconde la misura nella sua sezione. Non cambia la decisione.'):f==='segnaposto'?tr('Lo spazio c’è già nella sezione, vuoto: si riempie quando lo studio è chiuso.'):f==='studio'?tr('Toccane una per leggere la tua nota, la mia risposta e scrivere gli appunti di studio.'):f==='rimandato'?tr('Rimandate alla Fase 2 del progetto.'):f==='sospeso'?tr('Ferme: non servono adesso. Puoi riprenderle in studio quando vuoi.'):f==='eliminato'?tr('Escluse. Restano qui solo per ricordare perché.'):''}${conAppunti?' '+tr('Misure con appunti: {n}.',{n:conAppunti}):''}</p>
    <div class="mz-pila">${lista.map(k => { const s = libStato(k.n), x = (m.lib||{})[k.n]||{};
      const nota = s==='operativo' && !HA_PANNELLO.has(k.n) ? `<span class="mz-stato warn">${tr('Pannello da costruire')}</span>` : '';
      return `<div class="mz-librow${s==='operativo'&&!libVisibile(k.n)?' spenta':''}"><button class="mz-kpi" data-mz="kpi" data-n="${k.n}"><span class="mz-nn">${k.n}</span><span class="mz-q"><b>${esc(k.q)}</b><span class="mz-chips">${statoChip(k.n)}<span class="mz-comp">${tr(NOMI_SEZ[sezioneKpi(k)])}</span><span class="mz-comp" title="${esc(tr('Unione europea {e} · Italia {i}',{e:tr(k.eu), i:tr(k.it)}))}"><span class="mz-pall g-${k.eu}"></span><span class="mz-pall g-${k.it}"></span>UE · IT</span>${x.appunti?`<span class="mz-comp">${tr('Appunti')}</span>`:''}${nota}</span></span>${mzIco.avanti}</button>${s==='operativo'&&HA_PANNELLO.has(k.n)?interruttoreMz(k.n):''}</div>`; }).join('') || vuotoMz(tr('Nessuna misura con questo filtro.'))}</div>
    <section class="mz-card mz-info-prossima"><h3>${tr('Per la prossima informativa')}</h3><p class="meta">${tr('Da scrivere dopo l’MVP, quando lo deciderai tu. Qui ci sono solo i promemoria: l’informativa sull’app non è stata toccata.')}</p>
      <ul class="mz-lista">${perInformativa().map(k => `<li><button class="link" data-mz="kpi" data-n="${k.n}">${tr('Riga {n}',{n:k.n})}</button> · ${esc(k.lorNota)}</li>`).join('')}
        <li>${tr('I pulsanti volontari «Mi interessa» e «Vorrei {nome} qui» (righe 27 e 28): il +1 passa da una funzione Netlify. Vanno descritti prima di metterli sul sito pubblico.')}</li></ul></section>`;
}

/* ---------- fogli sopra le Misure (usano il foglio dell'app) ---------- */
function foglioMz(html){ window.AGR.foglio(`<div class="mz-foglio">${html}</div>`, 'sez-misure'); }
function foglioKpiMz(n){
  const k = MZ_KPI.find(x => x.n==n); if(!k) return;
  const s = libStato(k.n), x = (mz().lib||{})[k.n]||{}, pan = HA_PANNELLO.has(k.n), cambiato = !!x.stato && x.stato!==k.lor;
  const AZ = [['operativo','Rendi operativa'],['segnaposto','Spazio pronto'],['studio','In studio'],['rimandato','Fase 2'],['sospeso','Sospendi'],['eliminato','Elimina']];
  foglioMz(`<div class="meta" style="font-weight:600">${tr('Riga {n}',{n:k.n})} · ${esc(k.area)} · ${tr('sezione {s}',{s:tr(NOMI_SEZ[sezioneKpi(k)])})}</div><h2>${esc(k.q)}</h2>
    <div class="mz-chips">${statoChip(k.n)}<span class="mz-comp"><span class="mz-pall g-${k.eu}"></span>UE ${tr(k.eu)}</span><span class="mz-comp"><span class="mz-pall g-${k.it}"></span>IT ${tr(k.it)}</span><span class="mz-comp">${tr('Utilità {u}',{u:tr(k.ut)})}</span></div>
    ${s==='operativo'?(pan?`<div class="mz-riga-sw"><span>${tr('Mostrala nella sezione «{s}»',{s:tr(NOMI_SEZ[sezioneKpi(k)])})}</span>${interruttoreMz(k.n)}</div>`:`<p class="mz-avviso-p">${tr('Operativa, ma il suo pannello non esiste ancora: va costruito nel codice. Chiedimelo quando vuoi.')}</p>`):''}
    ${s==='segnaposto'&&!pan?`<p class="mz-avviso-p">${tr('Questa misura non ha ancora uno spazio nelle sezioni: va costruito nel codice.')}</p>`:''}
    <dl class="mz-dl">
      <div><dt>${tr('La tua decisione')}</dt><dd>${esc(k.lorD||tr('Nessuna'))}${cambiato?` · ${tr('poi cambiata in «{s}» il {d}',{s:tr(STATI_LIB[x.stato]), d:brevD(x.agg)})}`:''}</dd></div>
      ${k.lorNota?`<div><dt>${tr('La tua nota')}</dt><dd>${esc(k.lorNota)}</dd></div>`:''}
      ${k.risposta?`<div><dt>${tr('La risposta di Claude')}</dt><dd>${esc(k.risposta)}</dd></div>`:''}
      ${s!=='operativo'?`<div><dt>${tr('Cosa servirebbe per renderla operativa')}</dt><dd>${esc(k.obl)}${k.um==='Sì'?' '+tr('Serve anche un parere umano (avvocato o DPO).'):''}</dd></div>`:''}
      <div><dt>${tr('Decisione che ne dipende')}</dt><dd>${esc(k.dec)}</dd></div>
    </dl>
    <h3>${tr('Appunti di studio')}</h3>
    <label class="campo mz-appunti"><span class="sr-only">${tr('Appunti di studio')}</span><textarea id="mz-app-${k.n}" rows="4" maxlength="2000" placeholder="${esc(tr('Cosa hai scoperto, cosa manca, chi sentire…'))}">${esc(x.appunti||'')}</textarea></label>
    <div class="mz-riga-sw"><span class="meta">${x.appuntiD?tr('Ultimo salvataggio: {d}',{d:lungD(x.appuntiD)}):tr('Restano su questo telefono e finiscono nell’export Excel.')}</span><button class="tasto sec" data-mz="lib-appunti" data-n="${k.n}">${tr('Salva gli appunti')}</button></div>
    <h3>${tr('Cambia lo stato')}</h3>
    <div class="seg mz-seg3" role="group" aria-label="${esc(tr('Stato della misura'))}">${AZ.map(([v,t]) => `<button data-mz="lib-stato" data-n="${k.n}" data-v="${v}" aria-pressed="${s===v}">${tr(t)}</button>`).join('')}</div>
    ${cambiato?`<button class="link" data-mz="lib-stato" data-n="${k.n}" data-v="">${tr('Torna alla decisione del file ({s})',{s:tr(STATI_LIB[k.lor])})}</button>`:''}
    <details class="mz-dett"><summary>${tr('Scheda completa: calcolo, metodo, conformità')}</summary><dl class="mz-dl">
      <div><dt>${tr('Come si calcola')}</dt><dd>${esc(k.calc)}</dd></div>
      <div><dt>${tr('Metodo')}</dt><dd>${esc(k.met)}</dd></div>
      <div><dt>${tr('Dati personali')}</dt><dd>${esc(k.dati)}</dd></div>
      <div><dt><span class="mz-pall g-${k.eu}"></span> ${tr('Unione europea')} · ${tr(k.eu)}</dt><dd>${esc(k.euM)}</dd></div>
      <div><dt><span class="mz-pall g-${k.it}"></span> ${tr('Italia')} · ${tr(k.it)}</dt><dd>${esc(k.itM)}</dd></div>
      <div><dt>${tr('Obblighi nuovi')}</dt><dd>${esc(k.obl)}</dd></div>
      <div><dt>${tr('Principi {nome}')}</dt><dd>${esc(k.coer)}</dd></div>
      <div><dt>${tr('Parere iniziale di Claude')}</dt><dd>${tr(k.par)} · ${esc(k.fase)}${k.note?' · '+esc(k.note):''}</dd></div>
    </dl></details>`);
}
function foglioSetMz(ks, l){
  const lista = ks.map(n => MZ_KPI.find(k => k.n==n)).filter(Boolean);
  foglioMz(`<div class="meta" style="font-weight:600">${tr('Domande dietro questo numero')}</div><h2>${esc(l)}</h2><div class="mz-pila">${lista.map(k => `<button class="mz-kpi" data-mz="kpi" data-n="${k.n}"><span class="mz-nn">${k.n}</span><span class="mz-q"><b>${esc(k.q)}</b><span class="mz-chips"><span class="mz-comp"><span class="mz-pall g-${k.eu}"></span>UE ${tr(k.eu)}</span><span class="mz-comp"><span class="mz-pall g-${k.it}"></span>IT ${tr(k.it)}</span><span class="mz-comp">${esc(k.met.split(' · ')[0])}</span></span></span>${mzIco.avanti}</button>`).join('')}</div>`);
}
function foglioFontiMz(){
  foglioMz(`<h2>${tr('Da dove vengono i numeri')}</h2><dl class="mz-dl">
    <div><dt>${fonteMz('ev')}</dt><dd>${tr('Calcolati dagli eventi on-grid di questo telefono. Ogni volta che apri le Misure si salva il totale del giorno (per esempio «143 eventi attivi»), mai gli eventi: l’informativa promette che spariscono 3 ore dopo la fine.')}</dd></div>
    <div><dt>${fonteMz('man')}</dt><dd>${tr('Copiati da te dal pannello di Netlify. Sul piano gratuito restano 24 ore: un giorno saltato resta un buco nel grafico.')}</dd></div>
    <div><dt>${fonteMz('mail')} ${fonteMz('reg')}</dt><dd>${tr('Contati da te: segnalazioni arrivate per email e richieste di rimozione, con solo date e ore.')}</dd></div>
    <div><dt>${fonteMz('test')}</dt><dd>${tr('Misure fatte da te sui tuoi telefoni: velocità, mappa, rete lenta.')}</dd></div>
    <div><dt>${fonteMz('int')}</dt><dd>${tr('Interviste e test sul campo, con il consenso dei partecipanti.')}</dd></div>
    <div><dt>${tr('Dove restano')}</dt><dd>${tr('Su questo telefono, nella chiave agorapp_misure, come il resto dell’admin. Si esportano in Excel. Cancellando i dati di Chrome si perdono: esporta ogni tanto.')}</dd></div>
    <div><dt>${tr('Cosa non c’è')}</dt><dd>${tr('Nessun dato sulle persone che usano l’app: niente identificativi, cookie, IP, posizione, cronologia.')}</dd></div></dl>`);
}
function foglioSoglieMz(){
  const s = mz().soglie;
  const sl = (k, t, mn, mx, st0, suf) => `<div class="mz-slider"><div class="mz-sr"><label for="mzs-${k}">${t}</label><output id="mzo-${k}">${k==='carico'?n1(s[k]):s[k]}${suf}</output></div><input id="mzs-${k}" data-mzs="${k}" type="range" min="${mn}" max="${mx}" step="${st0}" value="${s[k]}"></div>`;
  foglioMz(`<h2>${tr('Le tue soglie')}</h2><p class="meta">${tr('Decidono quando una misura diventa «da fare».')}</p>
    ${sl('zona', tr('Eventi per zona nei prossimi 7 giorni'), 1, 15, 1, '')}${sl('nuovi', tr('Obiettivo di eventi nuovi a settimana'), 5, 200, 5, '')}${sl('carico', tr('Tempo massimo di caricamento'), 1.5, 6, .1, ' s')}`);
}

/* ---------- export Excel ---------- */
function esportaMisure(){
  const m = mz(), giorni = Object.keys(Object.assign({}, m.giorni, m.richieste, m.creati, m.segnalazioni, m.correzioni)).sort();
  const cit = CITTA.map(c => c.id);
  const G = [[tr('Giorno'), tr('Eventi attivi'), ...CITTA.map(c => c.n), tr('Da import'), tr('Gratuiti'), tr('Consenso diretto'), tr('Fonte pubblica'), tr('Provenienza non indicata'), tr('Nuovi creati'), tr('Corretti'), tr('Rimossi'), tr('Richieste (Netlify)'), tr('Segnalazioni'), tr('Azioni di comunicazione')]]
    .concat(giorni.map(g => { const x = m.giorni[g]||{}, c = m.correzioni[g]||{}; return [dIso(g), x.tot!=null?x.tot:'', ...cit.map(id => x.citta ? (x.citta[id]||0) : ''), x.imp!=null?x.imp:'', x.grat!=null?x.grat:'',
      x.prov?(x.prov.consenso||0):'', x.prov?(x.prov.pubblica||0):'', x.prov?(x.prov.nd||0):'', m.creati[g]||0, c.c||0, c.r||0, m.richieste[g]!=null?m.richieste[g]:'', m.segnalazioni[g]||0, m.azioni.filter(a => a.d===g).map(a => a.t).join(' · ')]; }));
  const R = [[tr('Ricevuta'), tr('Evasa'), tr('Ore')]].concat(m.rimozioni.map(r => [r.ric, r.eva||'', oreTra(r.ric, r.eva)==null?'':oreTra(r.ric, r.eva)]));
  const V = [[tr('Versione'), tr('Data'), tr('Secondi')]].concat(m.versioni.map(v => [v.v, dIso(v.d), v.s]));
  const P = [[tr('Data'), tr('Rete e telefono'), tr('Esito'), tr('Nota')]].concat(m.prove.map(p => [dIso(p.d), p.rete, p.ok?tr('Caricata'):tr('Non caricata'), p.nota||'']));
  const I = [[tr('Data'), tr('Giro'), tr('Persone'), tr('Scoperto eventi nuovi'), tr('Andati a un evento'), tr('Guida senza aiuto'), tr('Off-Grid al primo tentativo'), tr('Mediana consiglio')]].concat(m.giri.map(x => [dIso(x.d), x.titolo||'', x.n, x.scoperto, x.andato, x.guida, x.og, x.cons==null?'':x.cons]));
  const C = [['N.', tr('Domanda'), tr('Sezione'), tr('Stato'), tr('Nella sezione'), tr('Decisione di Lorenzo'), tr('Note di Lorenzo'), tr('Risposta di Claude'), tr('Appunti di studio'), tr('Data appunti'), tr('Ultimo cambio di stato'), tr('UE'), tr('IT')]]
    .concat(MZ_KPI.map(k => { const x = (m.lib||{})[k.n]||{}, s = libStato(k.n); return [k.n, k.q, tr(NOMI_SEZ[sezioneKpi(k)]), tr(STATI_LIB[s]), s==='operativo' ? (HA_PANNELLO.has(k.n) ? (libVisibile(k.n)?tr('Visibile'):tr('Nascosta')) : tr('Pannello da costruire')) : '', k.lorD||'', k.lorNota||'', k.risposta||'', x.appunti||'', x.appuntiD?dIso(x.appuntiD):'', x.stato?dIso(x.agg):'', k.eu, k.it]; }));
  const Sg = [[tr('Soglia'), tr('Valore')], [tr('Eventi per zona nei prossimi 7 giorni'), m.soglie.zona], [tr('Obiettivo nuovi a settimana'), m.soglie.nuovi], [tr('Tempo massimo di caricamento (s)'), m.soglie.carico]];
  fileExcel([[tr('Giorni'), G, [12,12,...CITTA.map(() => 12),10,10,12,12,14,10,10,10,14,12,40]], [tr('Rimozioni'), R, [20,20,8]], [tr('Versioni'), V, [20,12,10]], [tr('Prove mappa'), P, [12,24,14,40]], [tr('Interviste'), I, [12,20,10,14,14,14,16,14]], [tr('Libreria'), C, [6,60,18,14,16,18,50,60,50,12,14,8,8]], [tr('Soglie'), Sg, [44,10]]], nomeFile()+'_misure_'+oggi()+'.xlsx')
    .then(() => { registra('esporta-misure'); avviso(tr('Misure esportate: {f}',{f:nomeFile()+'_misure_'+oggi()+'.xlsx'}), null, true); })
    .catch(() => avviso(tr('Serve la connessione per preparare il file Excel.'), null, true));
}

/* ---------- apertura e interazioni ---------- */
function apriMisure(){ mzFotografa(); vaiSezione('misure'); const el = $('pagina-misure'); if(el) el.scrollTop = 0; }
function salvaAppuntiMz(n){ const ta = $('mz-app-'+n), x = (mz().lib||{})[n]||{}; if(ta && ta.value.trim()!==(x.appunti||'')) libSet(n, {appunti:ta.value.trim(), appuntiD:oggi()}); }
function clickMisure(t){
  const d = t.dataset, m = mz(), a = d.mz; if(!a) return false;
  nascondiTipMz();
  switch(a){
    case 'esci': vaiSezione('mappa'); apri('admin'); break;
    case 'scheda': MS.scheda = d.v; if(d.f) MS.filtroCat = d.f; MS.sezLib = d.sez||''; chiudi(); disegnaMisure(); $('pagina-misure').scrollTop = 0; break;
    case 'periodo': MS.periodo = +d.v; disegnaMisure(); break;
    case 'ambito': MS.ambito = MS.ambito==='tutte' ? 'citta' : 'tutte'; disegnaMisure(); break;
    case 'fonti': foglioFontiMz(); break;
    case 'soglie': foglioSoglieMz(); break;
    case 'vista': MS.vista[d.v] = MS.vista[d.v]==='tab' ? 'g' : 'tab'; disegnaMisure(); break;
    case 'kpi': foglioKpiMz(d.n); break;
    case 'kpiset': foglioSetMz(d.k.split(','), d.l); break;
    case 'lib-vis': { const n = +d.n; salvaAppuntiMz(n); libSet(n, {visibile:!libVisibile(n)}); registra('misura', {r:n, x:libVisibile(n) ? tr('mostrata nella sezione') : tr('nascosta dalla sezione')}); if($('mz-app-'+n)) foglioKpiMz(n); disegnaMisure(); break; }
    case 'lib-stato': { const n = +d.n, x = (m.lib||{})[n]||{};
      if(!d.v){ delete x.stato; m.lib[n] = x; mzSalva(); } else libSet(n, {stato:d.v, visibile:true});
      registra('misura', {r:n, x:tr('stato: {s}',{s:tr(STATI_LIB[libStato(n)])})+(d.v?'':' · '+tr('come nel file'))});
      salvaAppuntiMz(n);
      avviso(tr('Riga {n}: {s}',{n, s:tr(STATI_LIB[libStato(n)])}), null, true); foglioKpiMz(n); disegnaMisure(); break; }
    case 'lib-appunti': { const ta = $('mz-app-'+d.n); if(!ta) break; libSet(+d.n, {appunti:ta.value.trim(), appuntiD:oggi()}); registra('misura', {r:+d.n, x:tr('appunti salvati')}); avviso(tr('Appunti salvati'), null, true); foglioKpiMz(d.n); disegnaMisure(); break; }
    case 'lib-sez': MS.sezLib = d.v||''; disegnaMisure(); break;
    case 'filtro': MS.filtroCat = d.v; disegnaMisure(); break;
    case 'dec': m.stati[d.id] = 'fatto'; mzSalva(); disegnaMisure(); break;
    case 'rimetti': m.stati = {}; mzSalva(); disegnaMisure(); break;
    case 'segn-piu': m.segnalazioni[oggi()] = (m.segnalazioni[oggi()]||0)+1; mzSalva(); disegnaMisure(); break;
    case 'segn-meno': if(m.segnalazioni[oggi()]){ m.segnalazioni[oggi()]--; if(!m.segnalazioni[oggi()]) delete m.segnalazioni[oggi()]; mzSalva(); disegnaMisure(); } break;
    case 'rim-evasa': { const r = m.rimozioni[+d.i]; if(r){ r.eva = dtLocal(new Date()); mzSalva(); disegnaMisure(); } break; }
    case 'rim-togli': m.rimozioni.splice(+d.i, 1); mzSalva(); disegnaMisure(); break;
    case 'az-togli': m.azioni.splice(+d.i, 1); mzSalva(); disegnaMisure(); break;
    case 'prova-togli': m.prove.splice(+d.i, 1); mzSalva(); disegnaMisure(); break;
    case 'vers-togli': m.versioni.pop(); mzSalva(); disegnaMisure(); break;
    case 'giro-togli': m.giri.pop(); mzSalva(); disegnaMisure(); break;
    case 'rete': { const c = m.rete[d.k]||''; m.rete[d.k] = c==='' ? 'ok' : c==='ok' ? 'no' : ''; mzSalva(); disegnaMisure(); break; }
    case 'esporta': esportaMisure(); break;
    default: return false;
  }
  return true;
}
function inviaFormMz(f){
  const m = mz(), D = Object.fromEntries(new FormData(f).entries()), k = f.dataset.mzform, num = v => { const n = parseFloat(String(v==null?'':v).replace(',','.')); return isFinite(n) ? n : null; };
  if(k==='richieste'){ const n = num(D.n); if(n==null || n<0){ avviso(tr('Scrivi un numero'), null, true); return; } m.richieste[oggi()] = Math.round(n); avviso(tr('Salvato per oggi: {n} richieste',{n:nf(Math.round(n))}), null, true); }
  else if(k==='azione'){ const t = String(D.t||'').trim(); if(!t){ avviso(tr('Scrivi cosa hai fatto oggi'), null, true); return; } m.azioni.push({d:oggi(), t}); avviso(tr('Segnata sul grafico'), null, true); }
  else if(k==='rimozione'){ if(!D.ric) return; m.rimozioni.push({ric:D.ric, eva:D.eva||''}); }
  else if(k==='versione'){ const s = num(D.s); if(!D.v || s==null) return; m.versioni.push({v:String(D.v).trim(), s, d:oggi()}); }
  else if(k==='prova'){ if(!D.rete) return; m.prove.push({d:oggi(), rete:String(D.rete).trim(), ok:D.ok==='1', nota:String(D.nota||'').trim()}); }
  else if(k==='giro'){ const n = num(D.n); if(!n) return; const c = x => Math.max(0, Math.min(n, Math.round(num(x)||0)));
    m.giri.push({d:oggi(), titolo:String(D.titolo||'').trim(), n:Math.round(n), scoperto:c(D.scoperto), andato:c(D.andato), guida:c(D.guida), og:c(D.og), cons:num(D.cons)}); }
  mzSalva(); disegnaMisure();
}

/* ---------- tooltip dei grafici ---------- */
let tipMz = null;
function mostraTipMz(html, x, y){
  if(!tipMz){ tipMz = document.createElement('div'); tipMz.className = 'mz-tip'; tipMz.setAttribute('role','status'); document.body.appendChild(tipMz); }
  tipMz.innerHTML = html; tipMz.style.opacity = 1;
  const r = tipMz.getBoundingClientRect(); let L = Math.max(8, Math.min(innerWidth - r.width - 8, x - r.width/2)), T = y - r.height - 12; if(T<8) T = y + 16;
  tipMz.style.left = L+'px'; tipMz.style.top = T+'px';
}
function nascondiTipMz(){ if(tipMz) tipMz.style.opacity = 0; }
(function collegaMisure(){
  const el = $('pagina-misure'); if(!el) return;
  el.addEventListener('submit', ev => { const f = ev.target.closest('[data-mzform]'); if(!f) return; ev.preventDefault(); inviaFormMz(f); });
  el.addEventListener('pointermove', ev => {
    const svg = ev.target.closest && ev.target.closest('svg[data-mzline]');
    if(svg){ const L = LINEE_MZ[svg.dataset.mzline]; if(!L) return; const r = svg.getBoundingClientRect(), px = (ev.clientX - r.left)/r.width*L.W, n = L.giorni.length;
      let i = Math.round((px - L.pl)/(L.W - L.pl - L.pr)*(n-1)); i = Math.max(0, Math.min(n-1, i));
      const mi = svg.querySelector('.mz-mirino'), xx = L.x(i); mi.setAttribute('x1', xx); mi.setAttribute('x2', xx); mi.setAttribute('opacity', .5);
      const az = L.azioni.filter(a => a.i===i).map(a => `<br>● ${esc(a.t)}`).join('');
      mostraTipMz(`<b>${esc(lungD(L.giorni[i]))}</b>${L.serie.map(s => `<br>${esc(s.nome)}: ${s.v[i]==null?tr('nessun dato'):nf(s.v[i])}`).join('')}${az}`, r.left + xx/L.W*r.width, r.top + 10); return; }
    const t = ev.target.closest && ev.target.closest('[data-mztip]');
    if(t){ const r = t.getBoundingClientRect(); mostraTipMz(t.dataset.mztip, r.left + r.width/2, r.top); } else nascondiTipMz();
  });
  el.addEventListener('pointerleave', () => { nascondiTipMz(); el.querySelectorAll('.mz-mirino').forEach(m => m.setAttribute('opacity', 0)); });
  el.addEventListener('pointerdown', ev => { const t = ev.target.closest && ev.target.closest('[data-mztip]'); if(t){ const r = t.getBoundingClientRect(); mostraTipMz(t.dataset.mztip, r.left + r.width/2, r.top); } });
  el.addEventListener('scroll', nascondiTipMz, {passive:true});
  $('foglio-slot').addEventListener('input', ev => { const s = ev.target.dataset && ev.target.dataset.mzs; if(!s) return; const m = mz(); m.soglie[s] = +ev.target.value; mzSalva(); const o = $('mzo-'+s); if(o) o.textContent = (s==='carico'?n1(m.soglie[s]):m.soglie[s])+(s==='carico'?' s':''); if(st.sezione==='misure') disegnaMisure(); });
})();

/* ======================= Storico delle operazioni dell'admin (6 ottobre 2026) =======================
   Dove sta: in questo telefono, nella memoria del browser (localStorage, chiave agorapp_storico), come gli eventi
   e le Misure. L'app lo legge da lì: non va su nessun server e un altro telefono non lo vede.
   Cosa tiene: il tipo di operazione, giorno e ora, quanti eventi e il codice dell'evento. Il titolo NON viene salvato:
   lo storico lo legge dall'evento finché l'evento è sulla mappa. Quando l'evento sparisce (3 ore dopo la fine),
   nello storico resta solo «evento non più sulla mappa», così lo storico non diventa un archivio degli eventi.
   Si tengono le ultime 1.000 operazioni e al massimo 12 mesi. */
const STORICO_MAX = 1000, STORICO_GIORNI = 365;
const OP_STORICO = {
  entra:['accessi','Entrata in modalità admin'], esci:['accessi','Uscita dalla modalità admin'],
  crea:['eventi','Evento creato'], modifica:['eventi','Evento modificato'], elimina:['eventi','Evento eliminato'], ripristina:['eventi','Eventi ripristinati'],
  importa:['file','Eventi importati da Excel'], 'esporta-excel':['file','Eventi esportati in Excel'], 'esporta-json':['file','Copia completa esportata in JSON'],
  'esporta-misure':['file','Misure esportate in Excel'], 'esporta-storico':['file','Storico esportato in Excel'],
  misura:['misure','Libreria delle misure'], svuota:['accessi','Storico svuotato']
};
const GRUPPI_STORICO = [['tutte','Tutte'], ['eventi','Eventi'], ['file','Import ed export'], ['misure','Misure'], ['accessi','Accessi']];
const SH = {filtro:'tutte', mostrati:60, conferma:false};
function storico(){
  const l = LS.get('agorapp_storico', []); if(!Array.isArray(l)) return [];
  const limite = Date.now() - STORICO_GIORNI*864e5;
  return l.filter(x => x && OP_STORICO[x.op] && Date.parse(x.t) >= limite);
}
function registra(op, extra){
  if(!OP_STORICO[op]) return;
  const voce = Object.assign({t:new Date().toISOString(), op}, extra||{});
  Object.keys(voce).forEach(k => { if(voce[k]==null || voce[k]==='') delete voce[k]; });
  const l = storico(); l.push(voce);
  LS.set('agorapp_storico', l.slice(-STORICO_MAX));
}
function descriviVoce(x){
  const ev = x.id ? rawById(x.id) : null, strato = x.s && S[x.s] ? tr(S[x.s].label) : '';
  const parti = [];
  if(x.id) parti.push(ev ? `«${esc(ev.title||'')}»` : `<span class="sh-via">${tr('evento non più sulla mappa')}</span>`);
  if(strato) parti.push(esc(strato));
  if(x.n!=null) parti.push(x.n===1 ? tr('1 evento') : tr('{n} eventi',{n:nf(x.n)}));
  if(x.r!=null) parti.push(tr('riga {n}',{n:esc(x.r)}));
  if(x.x) parti.push(esc(x.x));
  return parti.join(' · ');
}
function foglioStorico(){
  const tutte = storico().reverse(), f = SH.filtro;
  const lista = tutte.filter(x => f==='tutte' || OP_STORICO[x.op][0]===f), vis = lista.slice(0, SH.mostrati);
  let giorno = '', righe = '';
  vis.forEach(x => { const d = new Date(x.t), g = x.t.slice(0,10);
    if(g!==giorno){ giorno = g; righe += `<h3 class="sh-giorno">${esc(lungD(oggiDi(d)))}</h3>`; }
    righe += `<div class="sh-voce sh-${OP_STORICO[x.op][0]}"><span class="sh-ora">${hm(d)}</span><div><b>${tr(OP_STORICO[x.op][1])}</b>${descriviVoce(x)?`<span class="meta">${descriviVoce(x)}</span>`:''}</div></div>`; });
  window.AGR.foglio(`<div class="mz-foglio sh">
    <button class="link sh-indietro" data-az="admin">${tr('‹ Modalità admin')}</button>
    <h2>${tr('Storico delle operazioni')}</h2>
    <p class="meta">${tr('Resta solo su questo telefono, nella memoria del browser (chiave agorapp_storico): l’app lo legge da lì e non lo manda a nessun server. Un altro telefono ha il suo storico, o nessuno.')}</p>
    <nav class="mz-schede mz-filtri" aria-label="${esc(tr('Filtra lo storico'))}">${GRUPPI_STORICO.map(([k,t]) => `<button data-sh="filtro" data-v="${k}" aria-pressed="${f===k}"><span>${tr(t)} · ${tutte.filter(x => k==='tutte' || OP_STORICO[x.op][0]===k).length}</span></button>`).join('')}</nav>
    ${righe || `<p class="mz-nota">${tr('Nessuna operazione registrata. Lo storico parte da oggi: le operazioni fatte prima non ci sono.')}</p>`}
    ${lista.length > vis.length ? `<button class="tasto sec pieno" data-sh="altre">${tr('Mostra le precedenti ({n})',{n:lista.length - vis.length})}</button>` : ''}
    <p class="meta">${tr('Il titolo degli eventi non si salva: si legge dall’evento finché è sulla mappa. Si tengono le ultime 1.000 operazioni, per al massimo 12 mesi.')}</p>
    ${tutte.length ? `<button class="tasto sec pieno" data-sh="esporta">${tr('Esporta lo storico in Excel')}</button>
    ${SH.conferma ? `<div class="sh-conferma" role="alert"><p>${tr('Cancello tutte le {n} operazioni da questo telefono? Non si possono recuperare.',{n:tutte.length})}</p><div class="tasti"><button class="tasto sec" data-sh="annulla">${tr('Annulla')}</button><button class="tasto pri" data-sh="svuota-ok">${tr('Sì, svuota')}</button></div></div>`
      : `<button class="link sh-svuota" data-sh="svuota">${tr('Svuota lo storico')}</button>`}` : ''}
  </div>`, 'sez-misure');
}
const oggiDi = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function esportaStorico(){
  const R = [[tr('Giorno'), tr('Ora'), tr('Tipo'), tr('Operazione'), tr('Evento (se ancora sulla mappa)'), tr('Strato'), tr('Quanti'), tr('Riga delle Misure'), tr('Dettaglio')]]
    .concat(storico().map(x => { const d = new Date(x.t), ev = x.id ? rawById(x.id) : null;
      return [dIso(oggiDi(d)), hm(d), tr(GRUPPI_STORICO.find(g => g[0]===OP_STORICO[x.op][0])[1]), tr(OP_STORICO[x.op][1]), x.id ? (ev ? ev.title : tr('non più sulla mappa')) : '', x.s && S[x.s] ? tr(S[x.s].label) : '', x.n==null ? '' : x.n, x.r==null ? '' : x.r, x.x||'']; }));
  fileExcel([[tr('Storico'), R, [12,8,16,32,40,18,8,10,30]]], nomeFile()+'_storico_'+oggi()+'.xlsx')
    .then(() => { registra('esporta-storico'); avviso(tr('Storico esportato: {f}',{f:nomeFile()+'_storico_'+oggi()+'.xlsx'}), null, true); foglioStorico(); })
    .catch(() => avviso(tr('Serve la connessione per preparare il file Excel.'), null, true));
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-sh]'); if(!b) return;
  ev.preventDefault(); ev.stopPropagation();
  const a = b.dataset.sh;
  if(a==='filtro'){ SH.filtro = b.dataset.v; SH.mostrati = 60; }
  else if(a==='altre') SH.mostrati += 100;
  else if(a==='esporta'){ esportaStorico(); return; }
  else if(a==='svuota') SH.conferma = true;
  else if(a==='annulla') SH.conferma = false;
  else if(a==='svuota-ok'){ const n = storico().length; LS.set('agorapp_storico', []); SH.conferma = false; registra('svuota', {x:tr('{n} operazioni cancellate',{n})}); avviso(tr('Storico svuotato'), null, true); }
  foglioStorico();
}, true);


/* ======================= Interazioni ======================= */
$('app').addEventListener('click', ev => {
  const t = ev.target.closest('button,[data-az]');
  if(!t || t.disabled) return;
  if(t.tagName==='A') return;
  if(t.closest('.sez-temi') && clickTemi(t)) return;
  if(t.closest('.sez-agora,.sez-progetti,.sez-proposta')) return;
  if(t.dataset.mz!=null && clickMisure(t)) return;   /* Misure dell'admin */
  const d = t.dataset;
  if(d.tema){ apriTemi(['t:'+d.tema]); return; }
  if(d.regione){ const [lng, lat] = d.regione.split(',').map(Number); if(map && isFinite(lng) && isFinite(lat)) map.flyTo({center:[lng, lat], zoom:12, duration:800}); return; }
  if(d.sez){ vaiSezione(d.sez, true); return; }
  if(d.ev){ if(st.foglio==='calendario' && !modoGiornata()) st.foglio = null; selezionaEv(d.ev); return; }
  if(d.gruppo){ st.sel = null; apri('gruppo', {gruppo:d.gruppo.split(',')}); const e = byId(st.gruppo[0]); if(e) requestAnimationFrame(() => inquadra(e.lat, e.lng)); return; }
  if(d.tempo){ st.tempo = d.tempo; if(['scheda','gruppo'].includes(st.foglio)){ st.foglio = null; st.sel = null; } tutto(); disegnaFoglio(); return; }
  if(d.tipo){ st.tipi[d.tipo] = !st.tipi[d.tipo]; tutto(); return; }
  if(d.prezzo){ st.prezzo = d.prezzo; tutto(); return; }
  if(d.strato){ st.strati.has(d.strato) ? st.strati.delete(d.strato) : st.strati.add(d.strato); st.preset = -1; salvaStrati(); tutto(); return; }
  if(d.espandi){ st.aperto = st.aperto===d.espandi ? null : d.espandi; disegnaFoglio(); return; }
  if(d.sub){ st.subOff.has(d.sub) ? st.subOff.delete(d.sub) : st.subOff.add(d.sub); salvaStrati(); tutto(); return; }
  if(d.preset){ const i = +d.preset; st.preset = i; applicaIstantanea(strategiaPreset(i)); salvaStrati(); tutto(); return; }
  if(d.salva){ if(inCal(d.salva)) delete calEvents[d.salva]; else calEvents[d.salva] = true; saveCal(); tutto(); if(st.foglio==='scheda') disegnaFoglio(); return; }
  if(d.si!=null){ const i = +d.si;
    if(sugg.dove==='cerca') return scegliLuogo(i);
    const r = sugg.lista[i], f = sugg.dove==='a' ? st.aform : st.form; if(!r || !f) return;
    f.indirizzo = testoRisultato(r); f.addrFull = f.indirizzo; f.precision = r.precision||'exact'; f.hn = r.hn||''; f.pos = {lat:r.lat, lng:r.lng}; if(f.err) f.err.indirizzo = 0;
    const inp = $(sugg.dove==='a' ? 'a-indirizzo' : 'f-indirizzo'); if(inp) inp.value = f.indirizzo;
    const box = $(sugg.dove==='a' ? 'a-sugg' : 'f-sugg'); if(box) box.innerHTML = ''; sugg.lista = [];
    const pb = $(sugg.dove==='a' ? 'a-punto' : 'f-punto'); if(pb) pb.innerHTML = boxPunto(f);
    return; }
  if(d.copiaIndirizzo){ copiaIndirizzo(d.copiaIndirizzo); return; }
  if(d.giorno){ if(!st.da || st.a){ st.da = d.giorno; st.a = null; } else if(d.giorno < st.da){ st.da = d.giorno; } else { st.a = d.giorno; } disegnaFoglio(); return; }
  if(d.vista){ st.cal.vista = d.vista; disegnaFoglio(); disegnaPins(); posizioni(); if(modoGiornata()) requestAnimationFrame(() => inquadraTutti(giornata(st.cal.giorno).vive)); return; }
  if(d.giornoCal){ st.cal.giorno = d.giornoCal; st.cal.vista = 'giornata'; const g = dIso(d.giornoCal); st.cal.y = g.getFullYear(); st.cal.m = g.getMonth(); disegnaFoglio(); disegnaPins(); posizioni(); requestAnimationFrame(() => inquadraTutti(giornata(st.cal.giorno).vive)); return; }
  if(d.mese){ const [y,m] = d.mese.split('-').map(Number); st.cal.y = y; st.cal.m = m; disegnaFoglio(); return; }
  if(d.mezzo){ st.cal.mezzo = d.mezzo; LS.set('agorapp_day_mode', d.mezzo); disegnaFoglio(); disegnaPins(); return; }
  if(d.giornata){ apriCalendario('giornata', d.giornata); return; }
  if(d.aggiungi){ const [g,o] = d.aggiungi.split('|'); apriForm(null, o ? {giorno:g, inizio:o, fine:autoFine(o)} : {giorno:g}); return; }
  if(d.pdf){ st.pdf.tolti.has(d.pdf) ? st.pdf.tolti.delete(d.pdf) : st.pdf.tolti.add(d.pdf); disegnaFoglio(); return; }
  if(d.modifica){ const r = rawById(d.modifica); if(r) apriForm(r); return; }
  if(d.elimina){ st.conferma = {id:d.elimina}; st.foglio = 'conferma'; disegnaFoglio(); return; }
  if(d.eliminaOk){ elimina(st.conferma.id, d.eliminaOk); return; }
  if(d.modificaAdmin){ const r = rawById(d.modificaAdmin); if(r) apriAdminForm(r); return; }
  if(d.eliminaAdmin){ const r = rawById(d.eliminaAdmin); if(!r) return; st.eliminati.push({raw:r, cal:inCal(r.id)}); events = events.filter(x => x!==r); delete calEvents[r.id]; saveEvents(); saveCal(); ricostruisci(); chiudi(); tutto(); misureConta('rimossi'); registra('elimina', {id:r.id, s:r.category}); avviso(tr('Evento eliminato dalla mappa'), {az:'ripristina', l:tr('Annulla')}); return; }
  if(d.salvaForm){ salvaForm(d.salvaForm); return; }
  if(d.fgiorno){ st.form.giorno = d.fgiorno; if(st.form.fino < d.fgiorno) st.form.fino = piuMesi(d.fgiorno,3); disegnaFoglio(); return; }
  if(d.togliLink!=null){ st.form.links.splice(+d.togliLink,1); if(!st.form.links.length) st.form.links = ['']; disegnaFoglio(); return; }
  if(d.legale){ st.legale = d.legale; apri('legale'); return; }
  if(d.temaSet){ applicaTema(d.temaSet); disegnaFoglio(); return; }
  if(d.lingua){ applicaLingua(d.lingua); return; }
  if(d.citta){ applicaCitta(d.citta, true); chiudi(); return; }
  switch(d.az){
    case 'strati': st.sel = null; apri('strati'); break;
    case 'elenco': st.sel = null; apri('elenco'); break;
    case 'copia-punto': copiaPunto(); break;
    case 'cerca': st.sel = null; sugg.lista = []; apri('cerca'); break;
    case 'date': if(!st.da){ st.da = oggi(); st.a = null; } apri('date'); break;
    case 'mostra-date': if(st.da){ st.tempo = 'date'; chiudi(); tutto(); } break;
    case 'chiudi': chiudi(); break;
    case 'salvati': st.salvatiSolo = !st.salvatiSolo; tutto(); break;
    case 'tutti-strati': st.strati = new Set(LAYERS.map(s => s.id)); st.subOff.clear(); st.preset = 0; salvaStrati(); tutto(); break;
    case 'nessuno-strato': st.strati.clear(); st.preset = -1; salvaStrati(); tutto(); break;
    case 'finiti': st.finiti = !st.finiti; tutto(); break;
    case 'vuoti': st.vuoti = !st.vuoti; tutto(); break;
    case 'nascosti-on': st.nascostiOn = !st.nascostiOn; tutto(); break;
    case 'salva-preset': { const i = st.preset>=0 ? st.preset : 0; presets[i] = istantanea(); st.preset = i; salvaPresets(); tutto(); break; }
    case 'leggi': st.descAperta = !st.descAperta; disegnaFoglio(); break;
    case 'posizione':
      if(!navigator.geolocation){ avviso(tr('Posizione non disponibile su questo dispositivo.'), null, true); break; }
      $('btnGps').setAttribute('aria-busy','true');
      navigator.geolocation.getCurrentPosition(p => { $('btnGps').removeAttribute('aria-busy'); st.tuQui = {lat:p.coords.latitude, lng:p.coords.longitude}; disegnaPins(); if(map) map.flyTo({center:[st.tuQui.lng, st.tuQui.lat], zoom:Math.max(map.getZoom(),16), padding:{top:0,bottom:0,left:0,right:0}, duration:800}); },
        () => { $('btnGps').removeAttribute('aria-busy'); avviso(tr('Non riesco a trovare la tua posizione. Controlla i permessi del browser.'), null, true); }, {enableHighAccuracy:true, timeout:12000, maximumAge:60000});
      break;
    case 'pieno': st.pieno = !st.pieno; $('app').classList.toggle('pieno', st.pieno); disegnaChips(); posizioni(); if(map) requestAnimationFrame(() => map.resize()); break;
    case 'togli-lente': st.lente = null; tutto(); break;
    case 'zoom-piu': if(map) map.zoomIn({duration:250}); break;
    case 'zoom-meno': if(map) map.zoomOut({duration:250}); break;
    case 'home': vaiSezione('mappa'); st.foglio = null; st.sel = null; st.cercaQui = null; disegnaFoglio(); tutto(); vaiCitta(true); break;
    case 'nuovo': apriForm(null); break;
    case 'scegli-mappa': iniziaPosa('form'); break;
    case 'scegli-mappa-a': iniziaPosa('aform'); break;
    case 'posa-annulla': finePosa(false); break;
    case 'posa-ok': finePosa(true); break;
    case 'aiuto': st.form.aiuto = !st.form.aiuto; disegnaFoglio(); break;
    case 'aggiungi-link': if(st.form.links.length<5){ st.form.links.push(''); disegnaFoglio(); const ins = document.querySelectorAll('[data-link]'); if(ins.length) ins[ins.length-1].focus(); } break;
    case 'annulla-conferma': { const id = st.conferma.id; st.conferma = null; selezionaEv(id); break; }
    case 'calendario': apriCalendario(); break;
    case 'pdf': st.pdf = {giornata: st.cal.vista==='giornata' ? st.cal.giorno : null, tolti:new Set()}; apri('pdf'); preparaPdf().catch(() => {}); break;
    case 'espandi-foglio': if(Date.now() - presa.quando > 400) espandiFoglio(); break;
    case 'chips-avanti': { const c = $('chips'), dir = lang==='ar' ? -1 : 1; c.scrollBy({left:dir*c.clientWidth*0.7, behavior:'smooth'}); break; }
    case 'indietro-cal': st.pdf = null; apriCalendario(); break;
    case 'scarica-pdf': condividiPdf(); break;
    case 'stampa-pdf': stampaPdf(); break;
    case 'sblocca': { const pw = ($('pw').value||'').trim(); const e = pw && events.find(x => x.hidden && x.hiddenPassword===pw);
      if(e){ st.sbloccati.add(pw); st.nascostiOn = true; $('pw').value = ''; disegnaFoglio(); tutto(); } else { const er = $('pw-err'); if(er) er.hidden = false; } break; }
    case 'citta': apri('citta'); break;
    case 'impostazioni': st.sel = null; st.msgAdmin = null; st.adminPw = false; st.adminErr = false; apri('impostazioni'); break;
    case 'indietro-impostazioni': apri('impostazioni'); break;
    case 'semplice': st.semplice = !st.semplice; LS.set('agorapp_simple', st.semplice ? '1' : '0'); $('app').classList.toggle('semplice', st.semplice); disegnaFoglio(); tutto(); break;
    case 'guida': chiudi(); vaiSezione('mappa'); st.guida = 0; disegnaGuida(); posizioni(); break;
    case 'guida-avanti': st.guida++; disegnaGuida(); break;
    case 'guida-salta': st.guida = null; disegnaGuida(); LS.set('agorapp_guida','1'); posizioni(); break;
    case 'aiuto-og': apriForm(null, {aiuto:true}); break;
    case 'mostra-admin': st.adminPw = true; st.adminErr = false; disegnaFoglio(); setTimeout(() => { const i = $('adminpw'); if(i) i.focus(); }, 60); break;
    case 'entra-admin': { const v = ($('adminpw')||{}).value||''; if(v===ADMIN_PW){ registra('entra'); st.admin = true; st.adminPw = false; st.adminErr = false; st.msgAdmin = null; disegnaChips(); apri('admin'); tutto(); mzFotografa(); } else { st.adminErr = true; disegnaFoglio(); } break; }
    case 'admin': st.importa = null; st.aform = null; apri('admin'); break;
    case 'admin-misure': apriMisure(); break;
    case 'esci-admin': registra('esci'); st.admin = false; st.msgAdmin = null; chiudi(); if(st.sezione==='misure') vaiSezione('mappa'); tutto(); break;
    case 'admin-modello': scaricaModello(); break;
    case 'admin-esporta-json': esporta(); registra('esporta-json'); break;
    case 'admin-storico': SH.filtro = 'tutte'; SH.mostrati = 60; SH.conferma = false; foglioStorico(); break;
    case 'admin-ongrid': apriAdminForm(null); break;
    case 'admin-importa': $('fileImporta').click(); break;
    case 'importa-annulla': st.importa = null; apri('admin'); break;
    case 'importa-ok': { if(!st.importa || st.importa.fase!=='pronto') break; const n = st.importa.ok.length; registra('importa', {n}); events = events.concat(st.importa.ok); saveEvents(); ricostruisci(); st.importa = null; st.msgAdmin = tr('Importati {n} nuovi eventi.',{n}); apri('admin'); tutto(); mzFotografa(); break; }
    case 'admin-esporta': esportaExcel(); break;
    case 'a-nascosto': st.aform.nascosto = !st.aform.nascosto; disegnaFoglio(); break;
    case 'a-salva': salvaAdmin(); break;
    case 'ripristina': if(st.eliminati.length){ registra('ripristina', {n:st.eliminati.length}); st.eliminati.forEach(x => { events.push(x.raw); if(x.cal) calEvents[x.raw.id] = true; }); st.eliminati = []; saveEvents(); saveCal(); ricostruisci(); $('toast').hidden = true; tutto(); if(st.foglio==='admin') disegnaFoglio(); } break;
  }
});
/* il trattino si trascina: il pannello segue il dito */
$('app').addEventListener('pointerdown', presaGiu);
window.addEventListener('pointermove', presaMuovi, {passive:true});
window.addEventListener('pointerup', presaSu);
window.addEventListener('pointercancel', presaSu);
/* tempi: un ovale o si vede tutto o non si vede (Lorenzo, 4 ottobre). Si aggancia all'inizio e sfuma quello tagliato */
let chipsRaf = 0;
function bordiChips(){
  chipsRaf = 0; const c = $('chips'), av = $('chipsAvanti'); if(!c) return;
  const rtl = lang==='ar', resto = c.scrollWidth - Math.abs(c.scrollLeft) - c.clientWidth > 2;
  if(av) av.hidden = !resto;
  const r = c.getBoundingClientRect(); let sx = r.left, dx = r.right;
  /* la freccina occupa il suo posto: un ovale sotto di lei conta come tagliato */
  if(resto && av){ const a = av.getBoundingClientRect(); if(rtl) sx = a.right + 4; else dx = a.left - 4; }
  [...c.children].forEach(x => { const q = x.getBoundingClientRect(); x.classList.toggle('fuori', q.left < sx - 1 || q.right > dx + 1); });
}
$('chips').addEventListener('scroll', () => { if(!chipsRaf) chipsRaf = requestAnimationFrame(bordiChips); }, {passive:true});
window.addEventListener('resize', () => { if(!chipsRaf) chipsRaf = requestAnimationFrame(bordiChips); });
$('fileImporta').addEventListener('change', function(){ const f = this.files && this.files[0]; if(f) leggiImport(f); this.value = ''; });
/* campi: aggiornano lo stato senza ridisegnare il foglio (il cursore resta dov'è) */
$('foglio-slot').addEventListener('input', ev => {
  const el = ev.target;
  if(el.id==='tz-q'){ TM.q = el.value; const d = $('tz-lente'); if(d) d.innerHTML = lenteDentro(); return; }
  if(el.id==='q'){ st.q = el.value; $('risultati').innerHTML = risultatiEventi(); chiediSuggerimenti(el.value, 'cerca', 'risultati-luoghi'); return; }
  if(el.dataset.acampo && st.aform){
    const c = el.dataset.acampo, f = st.aform; f[c] = el.type==='checkbox' ? el.checked : el.value;
    if(c==='indirizzo'){ f.pos = null; f.precision = ''; f.addrFull = ''; $('a-punto').innerHTML = ''; chiediSuggerimenti(el.value, 'a', 'a-sugg'); }
    if(c==='desc'){ const x = $('a-conta'); if(x) x.outerHTML = contaDesc(f); }
    if(f.err && f.err[c] && String(el.value).trim()){ f.err[c] = 0; el.closest('.campo') && el.closest('.campo').classList.remove('errore'); }
    return;
  }
  if(!st.form) return;
  if(el.dataset.link!=null){ st.form.links[+el.dataset.link] = el.value; return; }
  const c = el.dataset.campo; if(!c) return;
  st.form[c] = el.value;
  if(c==='indirizzo'){ st.form.pos = null; st.form.precision = ''; st.form.addrFull = ''; $('f-punto').innerHTML = ''; chiediSuggerimenti(el.value, 'f', 'f-sugg'); }
  if(c==='fine') st.form.fineToccata = true;
  if(c==='inizio' && !st.form.fineToccata && el.value){ st.form.fine = autoFine(el.value); const fi = $('f-fine'); if(fi) fi.value = st.form.fine; }
  if(c==='inizio' || c==='fine'){ $('f-fine-nota').innerHTML = notaFine(st.form); }
  if(c==='titolo' && st.form.err.titolo && el.value.trim()){ st.form.err.titolo = 0; el.parentNode.classList.remove('errore'); }
});
$('foglio-slot').addEventListener('change', ev => {
  const el = ev.target;
  if(el.dataset.acampo==='strato' && st.aform){ st.aform.strato = el.value; st.aform.sub = ''; disegnaFoglio(); return; }
  if(el.dataset.acampo==='sub' && st.aform){ st.aform.sub = el.value; return; }
  if(!st.form) return;
  const c = el.dataset.campo;
  if(c==='rep' || c==='giorno' || c==='fino'){ st.form[c] = el.value; if(c==='giorno' && el.value && (!st.form.fino || st.form.fino < el.value)) st.form.fino = piuMesi(el.value,3); disegnaFoglio(); }
});
$('foglio-slot').addEventListener('keydown', ev => {
  if(ev.key!=='Enter') return;
  if(ev.target.id==='tz-nome'){ ev.preventDefault(); const b = document.querySelector('[data-tz="salva-ok"]'); if(b) b.click(); return; }
  if(ev.target.id==='pw'){ ev.preventDefault(); document.querySelector('[data-az="sblocca"]').click(); }
  else if(ev.target.id==='adminpw'){ ev.preventDefault(); document.querySelector('[data-az="entra-admin"]').click(); }
  else if(ev.target.id==='q'){ ev.preventDefault(); clearTimeout(sugg.t); cercaInvio(); }
  else if(ev.target.id==='f-indirizzo' || ev.target.id==='a-indirizzo'){ ev.preventDefault(); const b = document.querySelector('#'+(ev.target.id==='f-indirizzo'?'f':'a')+'-sugg [data-si]'); if(b) b.click(); }
});
document.addEventListener('keydown', ev => { if(ev.key==='Escape'){
  if(st.pieno && !st.foglio){ $('btnPieno').click(); return; }
  if(st.guida!=null){ st.guida = null; disegnaGuida(); } else if(st.posa){ finePosa(false); } else if(st.foglio) chiudi(); } });
window.addEventListener('resize', () => { if(map) map.resize(); });

/* ======================= Avvio ======================= */
(function avvio(){
  const tema = LS.s('agorapp_theme', null)==='dark' ? 'dark' : 'light';   /* al primo accesso sempre chiaro (Lorenzo, 4 ottobre) */
  document.documentElement.setAttribute('data-theme', tema);
  const m = document.querySelector('meta[name="theme-color"]'); if(m) m.setAttribute('content', tema==='dark' ? '#211D18' : '#FFFDF8');
  if(st.semplice) $('app').classList.add('semplice');
  testiFissi(); purgeExpired(); ricostruisci();
  st.cal.giorno = oggi();
  initMappa(); avviaArchivio(); tutto();
  if(LS.s('agorapp_guida','0')!=='1'){ st.guida = 0; setTimeout(disegnaGuida, 500); }
  setInterval(() => { const p = purgeExpired(); ricostruisci(); if(st.sezione==='mappa') { disegnaChips(); disegnaPins(); disegnaPeek(); } if(p && st.foglio && ['elenco','calendario'].includes(st.foglio)) disegnaFoglio(); }, 60000);
  window.AGR = Object.assign(window.AGR || {}, {versione:'restyling-3', stato:st, eventi:() => events,
    archivio:() => ({zona:[...ZONA.ids].sort(), lontano:ZONA.lontano, conservati:ARCHIVIO ? ARCHIVIO.quadrantiConservati().sort() : [], pubblici:EV.filter(e => e.archivio).length}),
    tr, dloc, lingua:() => lang,
    salvati:{has:id => inCal(id), add:id => { calEvents[id] = true; saveCal(); }, delete:id => { delete calEvents[id]; saveCal(); }},
    foglio(html, scope){ st.foglio = 'html'; st.fHtml = html; st.fScope = scope||''; ultimoFoglio = null; disegnaFoglio(); posizioni(); },
    chiudi(){ chiudi(); },
    aggiorna(){ disegnaChips(); disegnaPeek(); },
    vaiSezione,
    vaiMappa(id){ vaiSezione('mappa'); selezionaEv(id); },
    passerellaStrato(id){ st.strati = new Set([id]); st.subOff.clear(); st.preset = -1; st.tempo = 'tutto'; st.lente = null; st.tipi = {evento:true, og:true}; vaiSezione('mappa'); tutto(); requestAnimationFrame(() => inquadraTutti(visibili())); },
    dati:{strati:LAYERS.map(l => ({id:l.id, label:l.label, pin:l.pin})), temaCol, temiVoc:TEMI_VOC}
  });
  /* «Scarica il PDF» nei fogli di Progetti e Agorà: stampa la carta in anteprima */
  document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-stampa-carta]'); if(!b) return; const c = b.closest('.corpo') && b.closest('.corpo').querySelector('.carta'); if(!c) return;
    const html = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>${esc(NOME)}</title><style>body{font-family:Helvetica,Arial,sans-serif;max-width:720px;margin:24px auto;padding:0 16px;color:#1c1712;font-size:13px;line-height:19px}.cm{text-transform:uppercase;letter-spacing:.06em;font-size:11px;color:#5c5246;font-weight:600}.ct{font-family:Georgia,serif;font-size:24px;line-height:30px;margin:4px 0}.pr{display:grid;grid-template-columns:96px 1fr;gap:8px;border-top:1px solid #ddd;padding:6px 0}.cp,.cr{font-size:11px;color:#5c5246;border-top:1px solid #ddd;padding-top:8px;margin-top:6px}.cs{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#5c5246;border:1px dashed #5c5246;border-radius:6px;padding:2px 8px;margin-bottom:8px}svg{max-width:22px}</style></head><body>${c.innerHTML}</body></html>`;
    const url = URL.createObjectURL(new Blob([html], {type:'text/html'})), w = window.open(url, '_blank'); if(w) setTimeout(() => { try{ w.print(); }catch(e){} }, 700); setTimeout(() => URL.revokeObjectURL(url), 60000); });
})();
})();

