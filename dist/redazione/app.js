(function(){
'use strict';
/* =====================================================================
   App della mappa degli eventi — restyling (ramo restyling-app)
   Stile, struttura e comportamenti dal mockup unico approvato (2 ottobre 2026).
   Funzioni vere dall'app online OG 1.7: mappa (dal blocco 3 la mappa propria, T-017), indirizzi Photon,
   GPS, Off-Grid OG 1.0–1.7, Giornata/Mese/Agenda, PDF, nascosti, città,
   5 lingue, testi legali v1.2. I dati sul telefono passano dal modulo della memoria (T-026).
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
/* numero di versione dell'app montata (T-029): lo scrive il montaggio nella pagina */
const VERSIONE = document.documentElement.getAttribute('data-versione') || '';
/* nome dei file scaricati: il nome del servizio in minuscolo, senza spazi né accenti */
const nomeFile = () => NOME.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app';
/* la casella di contatto: un collegamento se esiste, il segnaposto come testo finché non esiste */
const casellaHtml = (classe, oggetto) => segnaposto(CASELLA) || !CASELLA
  ? `<span class="${classe}">${esc(CASELLA)}</span>`
  : `<a class="${classe}" href="mailto:${esc(CASELLA)}${oggetto ? '?subject=' + encodeURIComponent(oggetto) : ''}">${esc(CASELLA)}</a>`;
const EXPIRE_MS = 3*36e5, OG_KEEP_MS = 92*864e5, DESC_MIN = 30, TITLE_MAX = 100;

/* ---------- Memoria del telefono (T-026; libro mastro, § 3.7 e cap. 30; docs/dati-locali.md) ----------
   Tutto ciò che l'app salva sul telefono passa da MEM, che conosce soltanto le chiavi dell'elenco chiuso
   (sorgenti/moduli/memoria.js): leggi e scrivi per i valori in JSON, testo per i testi, togli per cancellare.
   Le due app montate dallo stesso codice (T-033) aprono la memoria in modo diverso: l'app pubblica conosce soltanto le
   righe della scheda «Dati locali»; l'app della redazione anche le chiavi dei suoi strumenti.
   avvia(), prima di ogni lettura: i dati salvati con i nomi delle versioni precedenti traslocano sotto i nomi nuovi e
   le chiavi delle funzioni tolte dall'app si cancellano senza leggerle; nell'app pubblica si cancellano così anche le
   chiavi degli strumenti della Redazione rimaste sul telefono da quando l'area riservata stava in questa app. */
const MEM = MODULI.memoria.crea({redazione:true});
MEM.avvia();

/* ---------- Lingue ---------- */
let lang = MEM.testo('dl_lingua','it'); if(!['it','en','es','fr','ar'].includes(lang)) lang = 'it';
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
let events = MEM.leggi('dl_eventi', []); if(!Array.isArray(events)) events = [];
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
  /* niente contatori «Ci vado / Sono qui» (la loro chiave la cancella MEM.avvia) */
  let tolti = false; events.forEach(e => { if('going' in e || 'here' in e){ delete e.going; delete e.here; tolti = true; } });
  /* nessuna immagine negli eventi (T-011; libro mastro, § 6.2): il campo si toglie dai dati */
  events.forEach(e => { if('image' in e){ delete e.image; tolti = true; } });
  if(events.length!==n || tolti) MEM.scrivi('dl_eventi', events);
  return fate.concat(demo);
})();
let calEvents = MEM.leggi('dl_calendario', {}); if(!calEvents || typeof calEvents!=='object') calEvents = {};
/* dal calendario escono gli eventi tolti qui sopra e ogni voce d'esempio della demo (demo-…), anche senza evento */
(function(){ const via = Object.keys(calEvents).filter(id => IDS_TOLTI.includes(id) || /^demo-/.test(id));
  if(via.length){ via.forEach(id => delete calEvents[id]); MEM.scrivi('dl_calendario', calEvents); } })();
function saveEvents(){ if(!MEM.scrivi('dl_eventi', events)) avviso(tr('Spazio esaurito sul telefono: esporta un backup ed elimina qualche evento.'), null, true); }
function saveCal(){ MEM.scrivi('dl_calendario', calEvents); }
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
   Off-Grid soltanto dalla memoria del telefono. Gli eventi che la Redazione prepara nella sua app restano nella memoria
   del suo dispositivo e non vanno sulla mappa finché non si pubblicano (blocchi 9-10).
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
/* Un evento nascosto sbloccato (T-046; libro mastro § 2.3): lo stesso formato pubblico, decifrato su questo telefono
   con la password. Non appartiene a un quadrante: sta nell'elenco e sulla mappa ovunque sia, finché il comando degli
   strati «Nascosti che hai sbloccato» lo mostra. */
function vistaNascosto(x){ const v = vistaArchivio({ev:x.evento, q:null}); if(!v) return null; v.archivio = false; v.nascosto = true; return v; }
/* Gli eventi nascosti sbloccati su questo telefono (voce dl_nascosti, riga «Gli eventi nascosti che hai sbloccato» della
   scheda «Dati locali»): per ognuno la password come la persona l'ha scritta (solo le parole), l'impronta, l'evento
   decifrato, un segno del file (v) e se il file c'è ancora. Restano fino a tre ore dopo la fine dell'evento, poi si
   cancellano da soli (§ 3.7); se il file non c'è più (evento sospeso o ritirato) l'evento non si mostra ma resta fino a
   quel momento, e ricompare se il file torna (decisione del 25/11/2026). Lo sblocco è in app2.js. */
const NASC = {voci:[]};
function leggiNascosti(){
  const d = MEM.leggi('dl_nascosti', null), t = Date.now();
  const voci = (d && Array.isArray(d.voci) ? d.voci : []).filter(x => x && typeof x.password==='string' && typeof x.impronta==='string' && x.evento &&
    FORMATO.valido(x.evento) && FORMATO.uscitaMs(x.evento) > t);
  NASC.voci = voci;
  if(d && (!Array.isArray(d.voci) || d.voci.length!==voci.length)) salvaNascosti();
}
function salvaNascosti(){ if(NASC.voci.length) MEM.scrivi('dl_nascosti', {v:1, voci:NASC.voci}); else MEM.togli('dl_nascosti'); }
const nascostiVisti = () => NASC.voci.filter(x => !x.assente && FORMATO.uscitaMs(x.evento) > Date.now());
leggiNascosti();
let EV = [];
let ARCHIVIO = null;                             /* lettore dell'archivio (app2.js) */
const ZONA = {ids:new Set(), lontano:false};     /* quadranti della zona inquadrata; lontano = mappa troppo lontana per gli eventi */
function ricostruisci(){
  const og = events.filter(e => e && (e.personal || e.offgrid)).map(vista).filter(Boolean);
  const pub = ARCHIVIO ? ARCHIVIO.eventi().map(vistaArchivio).filter(Boolean) : [];
  const nas = nascostiVisti().map(vistaNascosto).filter(Boolean);
  EV = og.concat(pub, nas);
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
  admin:true, eliminati:[], msgAdmin:null, guida:null, sblocco:null, togliNasc:null, lente:null, vuoti:false
};
(function(){ const m = MEM.testo('dl_mezzo','piedi'); if(['piedi','bici','mezzi'].includes(m)) st.cal.mezzo = m; })();
st.semplice = MEM.testo('dl_semplice','0')==='1';

/* strati: alla prima apertura sono tutti spenti (come online); il pannellino invita ad accenderli */
function caricaStrati(){
  const s = MEM.leggi('dl_strati', null);
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
function salvaStrati(){ MEM.scrivi('dl_strati', istantanea()); }
caricaStrati();
/* combinazioni Mappa 1/2/3 */
const PRESET_BASE = [null, ['sociale','manifestazioni','conferenze','volontariato'], ['musica','arte','teatro','cinema']];
let presets = (function(){ const p = MEM.leggi('dl_combinazioni', null); return (p && Array.isArray(p.data)) ? p.data.slice(0,3) : [null,null,null]; })();
while(presets.length<3) presets.push(null);
function strategiaPreset(i){
  if(presets[i]) return presets[i];
  const base = PRESET_BASE[i]; const o = {};
  LAYERS.forEach(l => { o[l.id] = {on: base ? base.includes(l.id) : true, subs:Object.fromEntries(l.sub.map(su=>[su.id,true]))}; });
  return o;
}
function salvaPresets(){ const p = MEM.leggi('dl_combinazioni', null) || {}; MEM.scrivi('dl_combinazioni', {data:presets, names:(p.names||['Mappa 1','Mappa 2','Mappa 3'])}); }

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
/* gli eventi nascosti sbloccati non dipendono dagli strati: li mostra o li nasconde il loro comando (T-046) */
function nelloStrato(e){ if(e.tipo==='og' || e.nascosto) return true; if(!st.strati.has(e.strato)) return false; return !st.subOff.has(e.strato+'|'+e.sub); }
const gratuito = p => /^(gratuito|gratis|free|ingresso libero|libero|0\s*€?)$/i.test(String(p||'').trim());
function nelPrezzo(e){ if(e.tipo==='og' || st.prezzo==='tutti' || !e.prezzo) return true; return st.prezzo==='gratis' ? gratuito(e.prezzo) : !gratuito(e.prezzo); }
function nascostoOk(e){ return !e.nascosto || st.nascostiOn; }
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
/* Lo sportello di prova (T-038). Sul collegamento di prova l'app della redazione e l'app pubblica stanno allo stesso
   indirizzo e hanno la stessa memoria: quando lo sportello di prova della redazione ha pubblicato qualcosa, il suo
   archivio finto sta nella memoria del browser per i file, e l'app pubblica di prova legge quello al posto dell'archivio
   del repository. Così il giro intero (pubblica, correggi, sospendi, ritira) si prova sul telefono senza Bunny. Con
   l'indirizzo degli eventi nella configurazione (T-065) questo tratto non fa più nulla. */
const SPORTELLO_PROVA_DOVE = !(CFG.indirizzi||{}).eventi && ARCHIVIO_DOVE ? ARCHIVIO_DOVE.replace(/prova\/archivio\/$/, 'prova/sportello/') : '';
/* Il deposito dello sportello di prova: i percorsi diventano indirizzi finti sotto prova/sportello/, nella memoria del
   browser per i file (voce prova_sportello), che nessuno chiede alla rete. Lo usano lo sportello di pubblicazione di prova
   dell'app della redazione (T-038) e lo sportello delle segnalazioni di prova (T-051), in tutte e due le app. La memoria si
   apre a ogni passo: dopo «Svuota lo sportello di prova» non resta in mano una memoria cancellata. */
function depositoProva(){
  const base = SPORTELLO_PROVA_DOVE, cassa = () => MEM.file.open('prova_sportello');
  return {
    leggi: async p => { const r = await (await cassa()).match(base + p); return r ? r.text() : null; },
    scrivi: async (p, t) => { await (await cassa()).put(base + p, new Response(t, {headers:{'content-type':'application/json'}})); },
    togli: async p => { await (await cassa()).delete(base + p); },
    elenca: async pre => (await (await cassa()).keys()).map(r => r.url).filter(u => u.startsWith(base + pre)).map(u => u.slice(base.length))
  };
}
async function sorgenteArchivio(){
  const vera = {dove:ARCHIVIO_DOVE, fetch:window.fetch.bind(window), finto:false};
  if(!SPORTELLO_PROVA_DOVE || !MEM.file) return vera;
  try{
    if(!(await MEM.file.has('prova_sportello'))) return vera;
    const c = await MEM.file.open('prova_sportello'), dove = SPORTELLO_PROVA_DOVE+'pubblico/';
    if(!(await c.match(dove+'indice.json'))) return vera;
    return {dove, finto:true, fetch:async u => (await c.match(String(u))) || new Response('', {status:404})};
  }catch(e){ return vera; }
}
let ARCHIVIO_FINTO = false;
const nuovoArchivio = s => { ARCHIVIO_FINTO = s.finto;
  ARCHIVIO = MODULI.archivio.crea({dove:s.dove, vocabolario:FORMATO.vocabolario(LAYERS, TEMI_VOC), fetch:s.fetch, casse:MEM.file, nomeCassa:'dl_archivio'}); ARCHIVIO.dove = s.dove; return ARCHIVIO.apri(); };
function avviaArchivio(){
  if(!ARCHIVIO_DOVE || !MODULI.archivio || !FORMATO || !QUAD || !window.fetch) return;
  sorgenteArchivio().then(nuovoArchivio).then(dopoControllo).then(() => controllaNascosti());
  document.addEventListener('visibilitychange', () => { if(document.visibilityState!=='visible' || !ARCHIVIO) return;
    ARCHIVIO.forseControlla().then(c => { if(c) dopoControllo(); });
    if(Date.now() - NASC.ultimo > MODULI.archivio.TRENTA_MINUTI) controllaNascosti(); });
}
function dopoControllo(){ pulisciCalendarioArchivio(); ricostruisci(); aggiornaZona(true); }
/* Sul collegamento di prova, dopo una pubblicazione (o lo svuotamento) dello sportello di prova: la pagina rilegge da sé
   l'archivio giusto, quello finto o quello del repository, senza ricaricarla. Serve all'app della redazione, che fino al
   blocco 10 restava sull'archivio con cui si era aperta (riscontro di Lorenzo del 26/11/2026: un evento nascosto appena
   pubblicato non si sbloccava nella stessa pagina). */
function riapriArchivio(){
  if(!ARCHIVIO_DOVE || !MODULI.archivio || !ARCHIVIO) return Promise.resolve(false);
  return sorgenteArchivio().then(s => s.dove===ARCHIVIO.dove ? ARCHIVIO.controllaNovita() : nuovoArchivio(s).then(() => true))
    .then(() => { dopoControllo(); return controllaNascosti(); }).catch(() => false);
}
/* Dal calendario escono gli eventi dell'archivio che non ci sono più (ritirati o usciti dalla mappa); solo se le zone
   consultate restano sul telefono e l'indice è appena arrivato, così un evento non sparisce perché non è caricato. */
function pulisciCalendarioArchivio(){
  if(!ARCHIVIO || !ARCHIVIO.persistente() || !ARCHIVIO.ultimoControllo()) return;
  const vivi = new Set(ARCHIVIO.eventi().map(x => x.ev.id).concat(NASC.voci.map(x => x.evento.id))), locali = new Set(events.map(e => e.id));
  const via = Object.keys(calEvents).filter(id => FORMATO.ID.test(id) && !vivi.has(id) && !locali.has(id));
  if(via.length){ via.forEach(id => delete calEvents[id]); saveCal(); }
}
/* ======================= Eventi nascosti: lo sblocco (T-046) =======================
   Libro mastro § 2.3: il telefono di chi scrive la password nella barra dei nascosti (in Cerca) calcola l'impronta,
   scarica il file con quel nome e lo decifra (sorgenti/moduli/nascosti.js; docs/eventi-nascosti.md). Il file sta
   nell'archivio degli eventi, sotto nascosti/ (sul collegamento di prova, nell'archivio dello sportello di prova
   quando c'è). La richiesta non porta cookie né credenziali; il suo nome è l'impronta, non la password, che non lascia
   mai il telefono. Evento e password restano nella voce dl_nascosti (app1.js) fino a tre ore dopo la fine.
   Al controllo delle novità (all'apertura e al ritorno dopo trenta minuti) il telefono riguarda i file degli eventi
   sbloccati: se il file è cambiato (correzione, stessa password) l'evento si aggiorna; se non c'è più (sospeso o
   ritirato) l'evento non si mostra, ma resta fino a tre ore dopo la fine e ricompare se il file torna (decisione del
   25/11/2026). Un errore di rete non cambia nulla. */
const RICH_NASCOSTO = {credentials:'omit', cache:'no-cache', redirect:'error', referrerPolicy:'no-referrer'};
NASC.ultimo = 0;
/* l'archivio si sceglie a ogni richiesta: sul collegamento di prova può essere nato da poco quello dello sportello di prova */
async function fileNascosto(imp){
  const s = ARCHIVIO_DOVE ? await sorgenteArchivio() : null; if(!s || !s.dove) return {stato:'manca'};
  let r; try{ r = await s.fetch(s.dove+'nascosti/'+imp+'.json', RICH_NASCOSTO); }catch(e){ return {stato:'rete'}; }
  if(r.status===404) return {stato:'manca'};
  if(!r.ok) return {stato:'rete'};
  try{ return {stato:'ok', testo:await r.text()}; }catch(e){ return {stato:'rete'}; }
}
async function apriFileNascosto(testo, pw, imp){
  const ev = await MODULI.nascosti.decifra(testo, pw, null, imp);
  if(!FORMATO.valido(ev, {vocabolario:FORMATO.vocabolario(LAYERS, TEMI_VOC)})) throw new Error('formato');
  return ev;
}
/* sbloccaNascosto(testo scritto) → {esito: 'fatto' | 'manca' | 'rete' | 'finito', id} */
async function sbloccaNascosto(testo){
  const N = MODULI.nascosti, pw = N.forma(testo);
  if(!N.lunga(pw)) return {esito:'manca'};
  let imp; try{ imp = await N.impronta(pw); }catch(e){ return {esito:'manca'}; }
  const f = await fileNascosto(imp);
  if(f.stato!=='ok') return {esito:f.stato};
  let ev; try{ ev = await apriFileNascosto(f.testo, pw, imp); }catch(e){ return {esito:'manca'}; }
  if(FORMATO.uscitaMs(ev) <= Date.now()) return {esito:'finito'};
  NASC.voci = NASC.voci.filter(x => x.impronta!==imp && x.evento.id!==ev.id).concat([{password:pw, impronta:imp, evento:ev, v:QUAD.impronta(f.testo), assente:false}]);
  salvaNascosti(); ricostruisci();
  return {esito:'fatto', id:ev.id};
}
let nascostiInCorso = null;
function controllaNascosti(){
  if(nascostiInCorso) return nascostiInCorso;
  nascostiInCorso = (async () => {
    let cambiato = false; const prima = NASC.voci.length;
    NASC.voci = NASC.voci.filter(x => FORMATO.uscitaMs(x.evento) > Date.now()); if(NASC.voci.length!==prima) cambiato = true;
    for(const x of NASC.voci.slice()){
      const f = await fileNascosto(x.impronta);
      if(f.stato==='rete') continue;
      const v = f.stato==='ok' ? QUAD.impronta(f.testo) : null;
      if(f.stato==='ok' && v!==x.v){
        try{ x.evento = await apriFileNascosto(f.testo, x.password, x.impronta); x.v = v; x.assente = false; cambiato = true; continue; }
        catch(e){ /* un file che non si apre più vale come un file che non c'è */ }
      }
      const assente = f.stato!=='ok' || v!==x.v;
      if(!!x.assente!==assente){ x.assente = assente; cambiato = true; }
    }
    NASC.ultimo = Date.now();
    if(cambiato){
      salvaNascosti(); ricostruisci();
      let chiusa = false; if(st.sel && !byId(st.sel)){ st.sel = null; if(st.foglio==='scheda'){ st.foglio = null; chiusa = true; } }
      tutto(); if(chiusa) disegnaFoglio();
    }
    return cambiato;
  })().finally(() => { nascostiInCorso = null; });
  return nascostiInCorso;
}
/* «Togli dal telefono»: evento e password se ne vanno subito (§ 3.7: «Dall'app»). */
function togliNascosto(id){
  NASC.voci = NASC.voci.filter(x => x.evento.id!==id); salvaNascosti();
  if(calEvents[id]){ delete calEvents[id]; saveCal(); }
  ricostruisci(); st.sel = null; st.foglio = null; tutto(); disegnaFoglio();
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
  /* sul solo collegamento di prova: l'app legge l'archivio finto dello sportello di prova di questo browser (testo approvato da Lorenzo il 25/11/2026) */
  if(ARCHIVIO_FINTO) extra.push(tr('archivio dello sportello di prova di questo browser'));
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
function chiudi(){ st.espanso = false; TM.foglio = null; TM.salva = null; st.foglio = null; st.sel = null; st.punto = null; st.copiato = null; st.gruppo = null; st.form = null; st.aform = null; st.conferma = null; st.pdf = null; st.segn = null; disegnaFoglio(); disegnaPins(); posizioni(); disegnaChips(); }
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
    scheda:() => fScheda(byId(st.sel)), segnala:fSegnala, punto:fPunto, cerca:fCerca, date:fDate, calendario:fCalendario, pdf:fPdf, form:fForm, conferma:fConferma,
    impostazioni:fImpostazioni, senzarete:fSenzaRete, legale:fLegale, citta:fCitta, temi:fTemi,
    html:() => foglio('forte alto', `<div class="riga-titolo"><div></div>${chiudiBtn()}</div>`, `<div class="${esc(st.fScope)}">${st.fHtml}</div>`)
  };
  Object.assign(F, FOGLI_RED);   /* i fogli degli strumenti della Redazione (sorgenti/redazione/) */
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
      ${nascostiVisti().length ? `<button class="riga-int" data-az="nascosti-on" aria-pressed="${st.nascostiOn}"><span class="casella" style="background:var(--testo);border-color:var(--testo);color:var(--fondo)">${icoLucchetto(12)}</span><div><span class="t">${tr('Nascosti che hai sbloccato')} · ${nascostiVisti().length}</span><span class="meta">${tr('Li vedi perché hai la password.')}</span></div><span class="interr" aria-hidden="true"></span></button>` : ''}
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
const hostDi = u => u.replace(/^https?:\/\/(www\.)?/i,'').replace(/\/$/,'');
/* ---------- Scheda dell'evento pubblico (T-023; libro mastro, §§ 5.2, 5.3 e 11.3) ----------
   Tutto ciò che serve per andare all'evento sta qui, in forma di testo: nome del luogo e indirizzo su righe proprie, la
   descrizione del luogo per gli eventi collocati a mano, l'organizzatore quando è noto, il prezzo come lo indica la fonte.
   In fondo «Fonte:» e, accanto, l'avviso breve del § 5.2. Nessun collegamento separato al sito di chi organizza: il
   collegamento è quello della fonte. Sotto «Fonte:» il comando «Segnala» (T-050, qui sotto). */
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
        <span class="meta avviso-fonte">${avvisoFonte(e)}</span></div>
      ${MODULI.segnalazione && MODULI.segnalazione.ID.test(e.id) ? `<div class="tasti tasti-segnala"><button class="tasto sec" data-az="segnala" data-id="${esc(e.id)}">${tr('Segnala')}</button></div>` : ''}
      ${e.nascosto ? `<div class="fonte nascosto-togli"><span class="meta">${tr('Lo vedi perché hai la password. L’evento e la sua password restano su questo telefono fino a tre ore dopo la fine.')}</span>
        <button class="tasto sec" data-az="togli-nascosto" data-id="${esc(e.id)}">${st.togliNasc===e.id ? tr('Tocca ancora: per rivederlo servirà di nuovo la password') : tr('Togli dal telefono')}</button></div>` : ''}${boxAdmin(e)}`;
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

/* ======================= Segnala (T-050, T-051; libro mastro § 7.5, misura 3; docs/segnalazioni.md) =======================
   «Segnala», sotto il riquadro «Fonte:» della scheda di un evento pubblico, apre il modulo: l'evento è già indicato con il
   suo identificativo (regola 1); il motivo tra i cinque del libro mastro, con «Di chi è il nome?» obbligatoria per il nome
   da togliere e la dichiarazione di buona fede proposta per i contenuti illeciti; la descrizione libera, con l'avvertenza
   di non scrivere dati di altre persone (regola 2) e con l'aiuto per chi ha difficoltà a usare l'app (§ 11.4); email e
   nome facoltativi, solo per conferma ed esito (regola 3); accanto, la casella per gli utenti e l'informativa.
   Due modi d'invio (decisioni del 26/11/2026). Con lo sportello il telefono chiede il lucchetto e il piccolo compito,
   chiude la segnalazione nella busta, risolve il compito e la deposita (sorgenti/moduli/segnalazione.js,
   sportelli/segnalazioni.js). Con la posta (il ponte) il modulo prepara il messaggio già compilato verso la casella per
   gli utenti, e lo manda la persona dalla sua app di posta. Sul sito vero si usa la posta finché segnalazioni.sportello
   non si accende (T-071); sul collegamento di prova lo sportello di prova, quando ha il lucchetto, altrimenti la posta.
   Se lo sportello rifiuta o non risponde, il modulo propone la posta.
   Nulla resta sul telefono (regola 4): il modulo vive soltanto in st.segn, nella pagina aperta; chiudi() lo toglie, e dopo
   l'invio restano solo evento e titolo per il messaggio di conferma. Nessun identificativo del telefono, nessuna
   memoria scritta, i campi senza completamento automatico. La richiesta allo sportello non porta cookie né referrer. */
const MOTIVI_SEGN = {dati:'Dati dell’evento errati', annullato:'Annullato o rinviato', nome:'Nome o altro dato personale da togliere', illecito:'Contenuto che ritieni illecito', altro:'Altro'};
const BUONA_FEDE = 'Confermo di ritenere in buona fede che le informazioni e le affermazioni di questa segnalazione siano esatte e complete.';
const casellaUtenti = () => String((CFG.caselle||{}).contatto || '');
const segnVero = () => (CFG.indirizzi||{}).sportello_segnalazioni || '';
let segnProva = null;
/* lo sportello delle segnalazioni di prova: la stessa logica dello sportello vero, sull'archivio finto dello sportello di prova;
   l'app pubblica usa soltanto la porta aperta, la redazione anche quella firmata (con il pacchetto) */
const sportelloSegnProva = () => SPORTELLO_PROVA_DOVE && MEM.file && MODULI.segnalazioniSportello
  ? (segnProva || (segnProva = MODULI.segnalazioniSportello.crea({deposito:depositoProva(), pacchetto:MODULI.pacchetto}))) : null;
/* una richiesta allo sportello delle segnalazioni (testo) → {stato, corpo} */
async function chiediSegnalazioni(testo){
  const vero = segnVero();
  if(vero){
    let r; try{ r = await fetch(vero, {method:'POST', body:testo, headers:{'content-type':'application/json'}, credentials:'omit', cache:'no-store', redirect:'error', referrerPolicy:'no-referrer'}); }catch(e){ return {stato:0, corpo:{motivo:'rete'}}; }
    let c = null; try{ c = await r.json(); }catch(e){ c = null; }
    return {stato:r.status, corpo:c||{}};
  }
  const p = sportelloSegnProva(); if(!p) return {stato:0, corpo:{motivo:'assente'}};
  return p.ricevi(testo);
}
/* come parte la segnalazione: «sportello» (vero), «prova» (sportello di prova con il lucchetto) o «posta» */
async function modoSegnalazione(){
  if(segnVero()) return (CFG.segnalazioni||{}).sportello ? 'sportello' : 'posta';
  const p = sportelloSegnProva();
  if(p){ try{ if(await MEM.file.has('prova_sportello') && await p.lucchetto()) return 'prova'; }catch(e){} }
  return 'posta';
}
function apriSegnala(id){
  const e = byId(id); if(!e || e.tipo!=='evento') return;
  const s = st.segn = {id:e.id, titolo:e.titolo, motivo:'', chi:'', buona:false, desc:'', email:'', nome:'', err:{}, fase:'modulo', modo:null};
  apri('segnala');
  modoSegnalazione().then(m => { if(st.segn===s){ s.modo = m; if(st.foglio==='segnala') disegnaFoglio(); } });
}
function erroriSegn(s, posta){
  const e = {};
  if(!s.motivo) e.motivo = 1;
  if(s.motivo==='nome' && !s.chi) e.chi = 1;
  if((s.motivo==='illecito' || s.motivo==='altro') && !s.desc.trim()) e.desc = 1;
  if(!posta && s.email.trim() && !MODULI.segnalazione.EMAIL.test(s.email.trim())) e.email = 1;
  return e;
}
function fuocoErrore(){ const x = document.querySelector('#foglio-slot .errore input, #foglio-slot .errore textarea'); if(x) x.focus(); }
/* il messaggio di posta già compilato (strada b): destinatario, oggetto, identificativo dell'evento e testo */
function mailtoSegn(s){
  const r = [tr('Segnalazione dall’app {nome}'), tr('Evento: {titolo}',{titolo:s.titolo}), tr('Codice dell’evento: {codice}',{codice:s.id}), tr('Motivo: {motivo}',{motivo:s.motivo ? tr(MOTIVI_SEGN[s.motivo]) : ''})];
  if(s.motivo==='nome' && s.chi) r.push(tr('Di chi è il nome: {risposta}',{risposta:s.chi==='mio' ? tr('Il mio') : tr('Di un’altra persona')}));
  if(s.motivo==='illecito' && s.buona) r.push(tr(BUONA_FEDE));
  r.push('', tr('Descrizione:'), s.desc.trim());
  if(s.nome.trim()) r.push('', tr('Nome: {persona}',{persona:s.nome.trim()}));
  return 'mailto:'+encodeURIComponent(casellaUtenti())+'?subject='+encodeURIComponent(tr('Segnalazione: {titolo}',{titolo:s.titolo}))+'&body='+encodeURIComponent(r.join('\r\n'));
}
function fSegnala(){
  const s = st.segn; if(!s) return '';
  const testa = `<div class="riga-titolo"><h2>${tr('Segnala questo evento')}</h2>${chiudiBtn()}</div>
    <p class="meta segn-evento"><span class="t">${esc(s.titolo)}</span><span>${esc(tr('Codice dell’evento: {codice}',{codice:s.id}))}</span></p>`;
  const casella = `<span dir="ltr" translate="no">${esc(casellaUtenti())}</span>`, chiudi_ = `<div class="tasti"><button class="tasto pri" data-az="chiudi">${tr('Chiudi')}</button></div>`;
  if(s.fase==='inviata') return foglio('forte alto', testa, `<p class="segn-esito" role="status">${tr('Segnalazione inviata. Se hai lasciato un indirizzo email, riceverai una conferma.')}</p>${chiudi_}`);
  if(s.fase==='posta') return foglio('forte alto', testa, `<p class="segn-esito" role="status">${esc(tr('Si è aperta la tua app di posta con il messaggio pronto: la segnalazione parte quando lo invii tu. Se non si è aperta nessuna app, scrivi a {casella}.',{casella:'\u0001'})).split('\u0001').join(casella)}</p>${chiudi_}`);
  /* con lo sportello che rifiuta o non risponde restano «Invia la segnalazione» (per riprovare) e, sotto, la posta */
  const err = s.err || {}, lavoro = s.fase==='lavoro', sportello = s.modo==='sportello' || s.modo==='prova', posta = s.modo==='posta' || s.fase==='troppe' || s.fase==='errore';
  const scelta = (k, v, t, sel) => `<label class="segn-scelta"><input type="radio" name="s-${k}" value="${v}" data-segn-scelta="${k}"${sel===v?' checked':''}${lavoro?' disabled':''}><span>${t}</span></label>`;
  const gruppo = (k, titolo, righe, errore) => `<fieldset class="segn-gruppo${err[k]?' errore':''}"${err[k]?` aria-describedby="s-err-${k}"`:''}><legend class="etich">${titolo}</legend>${righe}${err[k]?`<span class="err" id="s-err-${k}">${errore}</span>`:''}</fieldset>`;
  const corpo = `
    ${gruppo('motivo', tr('Motivo'), Object.entries(MOTIVI_SEGN).map(([v, t]) => scelta('motivo', v, tr(t), s.motivo)).join(''), tr('Scegli un motivo.'))}
    ${s.motivo==='nome' ? gruppo('chi', tr('Di chi è il nome?'), scelta('chi', 'mio', tr('Il mio'), s.chi)+scelta('chi', 'altro', tr('Di un’altra persona'), s.chi), tr('Scegli di chi è il nome.')) : ''}
    ${s.motivo==='illecito' ? `<label class="segn-scelta segn-buona"><input type="checkbox" data-segn-scelta="buona"${s.buona?' checked':''}${lavoro?' disabled':''}><span>${tr(BUONA_FEDE)}</span></label>` : ''}
    <div class="stack-s"><label class="etich" for="s-desc">${tr('Descrizione')}</label><div class="campo${err.desc?' errore':''}"><textarea id="s-desc" data-segn="desc" maxlength="${MODULI.segnalazione.MAX_DESCRIZIONE}" autocomplete="off" aria-describedby="s-desc-aiuto${err.desc?' s-err-desc':''}"${lavoro?' disabled':''}>${esc(s.desc)}</textarea></div>
      <span class="meta" id="s-desc-aiuto">${tr('Scrivi che cosa non va. Non inserire dati di altre persone che non servono. Puoi scrivere anche se hai difficoltà a usare l’app.')}</span>${err.desc?`<span class="err" id="s-err-desc">${tr('Scrivi una descrizione.')}</span>`:''}</div>
    ${sportello ? `<div class="stack-s"><label class="etich" for="s-email">${tr('Email (facoltativa)')}</label><div class="campo${err.email?' errore':''}"><input id="s-email" type="email" inputmode="email" autocomplete="off" data-segn="email" maxlength="${MODULI.segnalazione.MAX_EMAIL}" value="${esc(s.email)}"${err.email?' aria-describedby="s-err-email"':''}${lavoro?' disabled':''}></div>${err.email?`<span class="err" id="s-err-email">${tr('Controlla l’indirizzo email.')}</span>`:''}</div>` : ''}
    <div class="stack-s"><label class="etich" for="s-nome">${tr('Nome (facoltativo)')}</label><div class="campo"><input id="s-nome" autocomplete="off" data-segn="nome" maxlength="${MODULI.segnalazione.MAX_NOME}" value="${esc(s.nome)}"${lavoro?' disabled':''}></div>
      <span class="meta">${sportello ? tr('Servono solo per mandarti la conferma e l’esito.') : tr('La conferma e l’esito arriveranno all’indirizzo da cui invii il messaggio.')}</span></div>
    ${s.fase==='troppe' ? `<p class="err" role="alert">${tr('In questo momento arrivano troppe segnalazioni. Riprova più tardi, oppure mandala per posta.')}</p>` : ''}
    ${s.fase==='errore' ? `<p class="err" role="alert">${tr('Non riesco a inviare la segnalazione. Controlla la connessione e riprova, oppure mandala per posta.')}</p>` : ''}
    <p class="meta">${esc(tr('Puoi scrivere anche a {casella}.',{casella:'\u0001'})).split('\u0001').join(casella)} <button class="link" data-legale="privacy">${tr('Informativa sulla privacy')}</button></p>
    <p class="meta" role="status" aria-live="polite">${lavoro ? tr('Preparo l’invio…') : ''}</p>
    ${sportello ? `<button class="tasto pri pieno" data-az="segnala-invia"${lavoro?' disabled aria-busy="true"':''}>${lavoro ? tr('Preparo l’invio…') : tr('Invia la segnalazione')}</button>` : ''}
    ${s.modo && posta ? `<a class="tasto ${sportello ? 'sec' : 'pri'} pieno" id="s-posta" data-segn-posta href="${esc(mailtoSegn(s))}">${tr('Prepara il messaggio di posta')}</a>` : ''}`;
  return foglio('forte alto', testa, corpo);
}
/* l'invio con lo sportello: lucchetto e compito, busta, compito risolto, deposito */
async function inviaSegnalazione(){
  const s = st.segn; if(!s || s.fase==='lavoro' || !(s.modo==='sportello' || s.modo==='prova')) return;
  s.err = erroriSegn(s, false);
  if(Object.keys(s.err).length){ disegnaFoglio(); fuocoErrore(); return; }
  s.fase = 'lavoro'; disegnaFoglio();
  const fine = f => {
    if(st.segn!==s) return;
    if(f==='inviata') st.segn = {id:s.id, titolo:s.titolo, fase:'inviata', err:{}};   // dopo l'invio non resta nulla di ciò che la persona ha scritto
    else s.fase = f;
    if(st.foglio==='segnala') disegnaFoglio();
  };
  try{
    const SG = MODULI.segnalazione;
    const l = await chiediSegnalazioni(JSON.stringify({porta:'aperta', operazione:'lucchetto'}));
    const c = l.corpo && l.corpo.compito;
    if(l.stato!==200 || !l.corpo.lucchetto || !c || !Number.isInteger(c.bit) || c.bit<0 || c.bit>24) return fine(l.stato===429 ? 'troppe' : 'errore');
    const busta = await SG.cifra(SG.prepara({id:s.id, titolo:s.titolo, motivo:s.motivo, chi:s.chi, buonaFede:s.buona, descrizione:s.desc, email:s.email, nome:s.nome}), l.corpo.lucchetto.pubblica);
    const compito = await SG.risolvi(busta, c.quando, c.bit, () => st.segn!==s);
    const r = await chiediSegnalazioni(JSON.stringify({porta:'aperta', operazione:'deposita', busta, compito}));
    fine(r.stato===200 ? 'inviata' : r.stato===429 ? 'troppe' : 'errore');
  }catch(e){ fine('errore'); }
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
/* il prezzo di un evento pubblico si scrive com'è nella fonte, senza ritocchi, anche nel PDF (T-023; § 5.1, regola 2) */
const prezzoDi = e => e.archivio ? e.prezzo : formatPrice(e.prezzo);
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
      const extra = [e.luogo, sottotitoloEv(e) + (e.prezzo ? ' · ' + prezzoDi(e) : '')].filter(Boolean).join('\n');
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
    `<tr><td class="tm">${e.inizio}${e.fine?'–'+e.fine:''}</td><td class="tt">${esc(e.titolo)}${e.tipo==='og'&&e.desc?`<div class="nt">${esc(e.desc)}</div>`:''}</td><td>${esc(e.luogo)}<div class="nt">${esc(sottotitoloEv(e))}${e.prezzo?' · '+esc(prezzoDi(e)):''}</div></td></tr>`).join('')).join('');
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
  const sbl = EV.filter(e => e.nascosto && !sparito(e)).sort((a,b) => a.a-b.a);
  const corpo = `<div id="risultati" class="stack">${risultatiEventi()}</div><div id="risultati-luoghi" class="stack"></div>
    <div class="fonte avanzato"><span class="meta"><strong style="color:var(--testo)">${tr('Ricerca avanzata')}</strong>: ${tr('periodo, prezzo e strati sono i filtri sopra la mappa, e valgono anche qui.')}</span>
      <div class="tasti"><button class="tasto sec" data-az="date">${icoGiorni()}${tr('Periodo')}</button><button class="tasto sec" data-az="strati">${icoStrati}${tr('Prezzo e strati')}</button></div></div>
    <div class="fonte"><span class="meta"><strong style="color:var(--testo)">${tr('Ti hanno dato la password di un evento nascosto?')}</strong> ${tr('Inseriscila qui: l’evento compare sulla mappa solo per te.')}</span>
      <div style="display:flex;gap:8px"><label class="campo" style="flex:1"><input id="pw" type="text" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="${esc(tr('Password dell’evento'))}" autocomplete="off"></label><button class="tasto sec" style="flex:none" data-az="sblocca">${icoLucchetto(14)}${tr('Sblocca')}</button></div>
      <span class="${st.sblocco==='lavoro'?'meta':'err'}" id="pw-err" role="status"${st.sblocco?'':' hidden'}>${testoSblocco()}</span>
      ${sbl.length?`<div class="lista">${sbl.map(rigaEv).join('')}</div>`:''}</div>`;
  return foglio('forte alto', testa, corpo);
}
/* Lo stato dello sblocco di un evento nascosto (T-046), sotto la barra: si aggiorna senza ridisegnare il foglio, così
   la password scritta resta nel campo. */
const testoSblocco = () => ({lavoro:tr('Sblocco l’evento…'), manca:tr('Nessun evento nascosto con questa password.'),
  rete:tr('Non riesco a controllare la password: controlla la connessione e riprova.'), finito:tr('Questo evento nascosto è già finito.')})[st.sblocco] || '';
function mostraSblocco(){ const el = $('pw-err'); if(!el) return; el.hidden = !st.sblocco; el.className = st.sblocco==='lavoro' ? 'meta' : 'err'; el.textContent = testoSblocco(); }
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
    ${!mod?`<button class="link" data-az="admin-ongrid">${tr('Redazione: crea invece un evento on-grid completo')} ${freccia}</button>`:''}`;
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
  const f = st[chi]; if(!f) return;   /* chi: il nome del modulo aperto nello stato, che è anche il nome del suo foglio */
  st.posa = chi; st.foglio = null; disegnaFoglio(); disegnaPins(); disegnaPosa(); posizioni();
  if(f.pos && map) map.jumpTo({center:[f.pos.lng, f.pos.lat], zoom:Math.max(map.getZoom(), 17), padding:{top:0,bottom:0,left:0,right:0}});
}
function finePosa(ok){
  const chi = st.posa, f = st[chi]; st.posa = null; disegnaPosa();
  if(ok && f && map){
    const c = map.getCenter(); f.pos = {lat:c.lat, lng:c.lng}; f.precision = 'map'; if(f.err) f.err.indirizzo = 0;
    /* nessuna ricerca inversa (T-008): resta ciò che la persona ha scritto, altrimenti «Punto scelto sulla mappa» */
    if(!String(f.indirizzo||'').trim()) f.indirizzo = tr('Punto scelto sulla mappa');
    f.addrFull = f.indirizzo;
  }
  st.foglio = chi; disegnaFoglio(); posizioni();
}


/* ======================= Impostazioni, documenti, città ======================= */
const LEGALI = {"en":{"privacy":"<span class=\"legal-badge\">Version 1.2 · March 2026</span><p style=\"font-size:.7rem;opacity:.6;margin:0 0 8px;\">Courtesy translation — the Italian version is the binding one.</p><h3>1. Data controller</h3><p><strong>Agorapp</strong>, a project by <strong>Lorenzo Calcagno</strong>, Turin<br>Contact: <span class=\"segnaposto\">[casella di contatto]</span></p><h3>2. What data we process and why</h3><p>Agorapp is an interactive map of urban events in Turin. <strong>It does not collect personal data from users browsing the map</strong>: no accounts, no profiling cookies, no tracking systems.</p><p>The only data processed concerns <strong>event organizers</strong> who request publication: title, location, time, description, and possibly a stage name or the organization's name.</p><p>We also process event information from <strong>publicly accessible sources</strong> (websites, public social pages), where the organizer knowingly chose to make it public.</p><h3>3. Legal basis for processing</h3><ul><li><strong>Explicit consent (art. 6(1)(a) GDPR)</strong> — for organizers who contact us directly. Consent is documented and stored.</li><li><strong>Legitimate interest (art. 6(1)(f) GDPR)</strong> — for events from public sources. The balancing test is documented internally. You may object at any time by writing to <span class=\"segnaposto\">[casella di contatto]</span>.</li></ul><h3>4. How long we keep data</h3><p>Each event's data is <strong>automatically deleted 3 hours after the event ends</strong>. There is no historical archive. Consent records are kept for a maximum of 3 years from the event date.</p><h3>5. Who can see the data</h3><p>Event information is visible to anyone visiting Agorapp. <strong>No data is transferred, sold or disclosed to third parties</strong> for commercial or marketing purposes.</p><h3>6. Data transfer outside the EU</h3><p>Agorapp does not transfer personal data to non-EU countries. The map display uses <strong>CartoDB/Carto</strong> for geographic imagery. That service may record the user's IP address under its privacy policy available at <a href=\"https://carto.com/privacy\" target=\"_blank\" rel=\"noopener noreferrer\" referrerpolicy=\"no-referrer\">carto.com/privacy</a>. Carto Inc. operates under Standard Contractual Clauses approved by the European Commission.</p><h3>7. Your rights (arts. 15–21 GDPR)</h3><p>You may exercise the rights of access, rectification, erasure, restriction, objection and portability at any time. Event removal requests are carried out within <strong>48 hours</strong>. Write to <span class=\"segnaposto\">[casella di contatto]</span> — we reply within 30 days.</p><h3>8. Complaint to the supervisory authority</h3><p>You may lodge a complaint with the Italian Data Protection Authority: <a href=\"https://www.garanteprivacy.it\" target=\"_blank\" rel=\"noopener noreferrer\" referrerpolicy=\"no-referrer\">garanteprivacy.it</a> · Piazza Venezia 11, 00187 Rome</p><h3>9. Automated decisions</h3><p>Agorapp performs no profiling or automated decision-making.</p>","storage":"<span class=\"legal-badge\">Only on your device · No server</span><p style=\"font-size:.7rem;opacity:.6;margin:0 0 8px;\">Courtesy translation — the Italian version is the binding one.</p><h3>What is saved on your device</h3><p>Agorapp uses only local technical storage. <strong>No data is ever transmitted to external servers</strong> by these tools.</p><h3>localStorage</h3><p>Stores on your device:</p><ul><li>The events shown on the map</li><li>The chosen theme (Light / Dark)</li><li>Your personal calendar of saved events</li><li>The per-layer filter state</li></ul><p>Data in localStorage remains until it is cleared manually or until events expire automatically.</p><h3>Legal basis</h3><p>These tools are equivalent to <strong>technical cookies</strong> under the Italian DPA measure of 10 June 2021 and are <strong>exempt from prior consent</strong>.</p><p>No profiling cookies, analytics cookies or third-party tracking tools are used.</p><h3>Third-party map services</h3><p>The map display uses two external services that receive the user's IP address each time geographic imagery loads:</p><ul><li><strong>CartoDB/Carto</strong> — provides the map imagery. Privacy policy: <a href=\"https://carto.com/privacy\" target=\"_blank\" rel=\"noopener noreferrer\" referrerpolicy=\"no-referrer\">carto.com/privacy</a>. Operates under EU Standard Contractual Clauses.</li><li><strong>OpenStreetMap</strong> — open-source base map. Privacy policy: <a href=\"https://osmfoundation.org/wiki/Privacy_Policy\" target=\"_blank\" rel=\"noopener noreferrer\" referrerpolicy=\"no-referrer\">osmfoundation.org/wiki/Privacy_Policy</a>.</li></ul><p>Agorapp has no access to and does not control this data.</p><h3>How to clear local data</h3><p>You can clear all of Agorapp local data at any time from your browser settings (Settings → Privacy → Clear browsing data → Site data).</p>","disclaimer":"<span class=\"legal-badge\">Important notices</span><p style=\"font-size:.7rem;opacity:.6;margin:0 0 8px;\">Courtesy translation — the Italian version is the binding one.</p><h3>Accuracy of information</h3><p>Event information from external public sources <strong>may not be up to date</strong>. <strong>We recommend always checking with the organizer</strong> before setting out.</p><p>To report an event that is no longer valid: <span class=\"segnaposto\">[casella di contatto]</span> — we remove it within 48 hours.</p><h3>Responsibility for content</h3><p>Agorapp aggregates already publicly available information without altering it. For events loaded from public sources, Agorapp is not liable for changes, deletions or inaccuracies relative to the original source at the time of acquisition.</p><h3>Political events, demonstrations and pickets</h3><p>For events of a political nature, demonstrations, marches and pickets, <strong>preliminary verification with the organizer is essential</strong> before setting out. Agorapp assumes no responsibility for consequences arising from presence at locations indicated on the map in relation to events of this kind.</p><h3>Regulatory compliance of events</h3><p>Agorapp <strong>does not verify the compliance of events</strong> with public-entertainment regulations, occupancy permits or licenses required by law. Responsibility for an event's lawfulness lies solely with the organizer.</p><h3>Intellectual property</h3><p>Event texts and descriptions belong to their respective organizers. Agorapp claims no rights over the content of published events.</p><h3>Contacts</h3><p>For any legal request: <span class=\"segnaposto\">[casella di contatto]</span><br>Data controller: Lorenzo Calcagno, Turin</p>"},"es":{"privacy":"","storage":"","disclaimer":""},"fr":{"privacy":"","storage":"","disclaimer":""},"ar":{"privacy":"","storage":"","disclaimer":""}};
function fImpostazioni(){
  const scuro = temaAttuale()==='dark';
  const testa = `<div class="riga-titolo"><h2>${tr('Impostazioni')}</h2>${chiudiBtn()}</div>`;
  const corpo = `
    <section class="sezione"><div class="tipo">${tr('Aspetto')}</div><div class="seg" role="group"><button data-tema-set="light" aria-pressed="${!scuro}">${tr('Chiaro')}</button><button data-tema-set="dark" aria-pressed="${scuro}">${tr('Scuro')}</button></div>
      <button class="riga-int" data-az="semplice" aria-pressed="${st.semplice}"><div><span class="t">${tr('Modalità semplice')}</span><span class="meta">${tr('Testi più grandi e meno comandi: niente sottocategorie e combinazioni.')}</span></div><span class="interr" aria-hidden="true"></span></button></section>
    <section class="sezione"><div class="tipo">${tr('Lingua')}</div><div class="seg" role="group">${['it','en','es','fr','ar'].map(l => `<button data-lingua="${l}" aria-pressed="${lang===l}" lang="${l}">${l.toUpperCase()}</button>`).join('')}</div></section>
    <section class="sezione"><div class="tipo">${tr('Aiuto')}</div><div class="menu-lista"><button class="menu-r" data-az="guida">${icoNote}<div><span class="t">${tr('Rivedi la guida')}</span><span class="meta">${tr('I cartellini che compaiono alla prima apertura')}</span></div>${freccia}</button><button class="menu-r" data-az="aiuto-og">${GLIFO_OG}<div><span class="t">${tr('Che cos’è un evento Off-Grid?')}</span></div>${freccia}</button><button class="menu-r" data-az="senza-rete">${icoNote}<div><span class="t">${tr('Senza connessione')}</span><span class="meta">${tr('Cosa funziona senza rete e come aggiungere l’app alla schermata Home')}</span></div>${freccia}</button></div></section>
    <section class="sezione"><div class="tipo">${tr('Documenti')}</div><div class="menu-lista">
      <button class="menu-r" data-legale="privacy"><div><span class="t">${tr('Informativa sulla privacy')}</span><span class="meta">${tr('Quali dati, perché, i tuoi diritti')}</span></div>${freccia}</button>
      <button class="menu-r" data-legale="storage"><div><span class="t">${tr('Dati locali')}</span><span class="meta">${tr('Cosa resta su questo telefono')}</span></div>${freccia}</button>
      <button class="menu-r" data-legale="disclaimer"><div><span class="t">${tr('Note legali')}</span><span class="meta">${tr('Accuratezza, manifestazioni, responsabilità')}</span></div>${freccia}</button>
      <a class="menu-r" href="licenze/index.html" target="_blank" rel="noopener noreferrer"><div><span class="t">${tr('Licenze dei componenti')}</span><span class="meta">${tr('Mappa, librerie e caratteri: testi integrali')}</span></div>${freccia}</a></div>
      <p class="meta">${tr('Scrivici')}: ${casellaHtml('mail')}</p></section>
    <section class="sezione"><div class="tipo">${tr('Redazione')}</div><button class="riga-int" data-az="admin"><div><span class="t">${tr('Strumenti della redazione')}</span><span class="meta">${tr('Eventi, Excel, Misure, storico, chiavi')}</span></div>${freccia}</button></section>
    ${VERSIONE ? `<p class="meta" id="versione-app">${tr('Versione {v}',{v:esc(VERSIONE)})}</p>` : ''}`;
  return foglio('forte alto', testa, corpo);
}
/* ---------- «Senza connessione» (T-030) e invito alla schermata Home (T-028) ----------
   Il testo è quello del documento di architettura (cap. 7, «Senza rete: come lo spieghiamo agli utenti»); l'avvertenza
   per iPhone ha la forma prudente del libro mastro (§ 30.1, scelta 5, e § 30.2). Da qui si apre la scheda «Dati locali».
   L'invito è discreto: sta qui e nell'ultimo cartellino della guida; nessuno conta chi aggiunge l'app. */
let invitoInstalla = null;
window.addEventListener('beforeinstallprompt', ev => { ev.preventDefault(); invitoInstalla = ev; if(st.foglio==='senzarete') disegnaFoglio(); });
window.addEventListener('appinstalled', () => { invitoInstalla = null; if(st.foglio==='senzarete') disegnaFoglio(); });
/* A che punto è la copia per l'uso senza rete su questo telefono (T-029): lo dice il service worker con i suoi messaggi
   (app6.js, avviaCopia). stato: '' (non si sa ancora), preparazione, pronta, errore. Resta solo finché l'app è aperta. */
const COPIA_STATO = {stato:'', fatti:0, totale:0, file:'', motivo:'', n:0};
const MOTIVI_COPIA = {rete:() => tr('rete assente'), risposta:n => tr('risposta {n} del server',{n}), impronta:() => tr('il file non corrisponde a questa versione'),
  altrove:() => tr('il server rimanda a un altro sito'), memoria:() => tr('questo browser non conserva file')};
function rigaCopia(){
  if(!('serviceWorker' in navigator) || !window.isSecureContext || !VERSIONE) return '';
  const s = COPIA_STATO;
  if(s.stato==='pronta') return `<p class="copia-stato pronta" id="copia-stato" role="status">${tr('Su questo telefono {nome} è pronta per l’uso senza rete.')}</p>`;
  if(s.stato==='errore'){
    const m = (MOTIVI_COPIA[s.motivo] || MOTIVI_COPIA.rete)(Number(s.n) || 0);
    return `<p class="copia-stato errore" id="copia-stato" role="status">${tr('La preparazione per l’uso senza rete non è riuscita ({file}: {motivo}). Riapri l’app con la rete per riprovare.',{file:esc(s.file || '—'), motivo:esc(m)})}</p>`;
  }
  const conto = s.totale > 0 ? ' ' + tr('{n} file su {t}.',{n:Number(s.fatti) || 0, t:Number(s.totale) || 0}) : '';
  return `<p class="copia-stato" id="copia-stato" role="status">${tr('{nome} si sta preparando per l’uso senza rete.')}${conto} ${tr('Tienila aperta con la rete finché questa riga non dice che è pronta.')}</p>`;
}
function fSenzaRete(){
  const testa = `<div class="riga-titolo"><h2>${tr('{nome} senza connessione')}</h2>${chiudiBtn('indietro-impostazioni')}</div>`;
  const corpo = `${rigaCopia()}<div class="legale">
      <p>${tr('{nome} funziona anche senza rete. Gli eventi delle zone che hai già aperto restano consultabili, e la mappa delle zone che hai già guardato si vede anche offline (c’è spazio per circa un’intera città).')}</p>
      <p>${tr('Il tuo calendario e i tuoi eventi Off-Grid ci sono sempre, perché vivono sul tuo telefono.')}</p>
      <p>${tr('Senza rete non vedi gli eventi nuovi o le modifiche dell’ultimo momento, e non puoi cercare un indirizzo. Appena torni online l’app si aggiorna da sola.')}</p>
      <h3>${tr('Aggiungi {nome} alla schermata Home')}</h3>
      <p>${tr('Così si apre come un’app, anche senza rete.')}</p>
      <p>${tr('Su iPhone: se non aggiungi {nome} alla schermata Home, il telefono può cancellare i dati che l’app conserva quando non la apri per alcuni giorni. Per conservarli, apri {nome} in Safari, tocca Condividi e poi «Aggiungi alla schermata Home».')}</p>
      <p>${tr('Su Android: apri il menu del browser e scegli «Installa app» oppure «Aggiungi a schermata Home».')}</p>
      ${invitoInstalla ? `<button class="tasto pri" data-az="installa">${tr('Installa')}</button>` : ''}
    </div>
    <div class="menu-lista"><button class="menu-r" data-legale="storage"><div><span class="t">${tr('Dati locali: cosa resta su questo telefono')}</span></div>${freccia}</button></div>`;
  return foglio('forte alto', testa, corpo);
}
/* ---------- Avvisi delle novità (T-031; sorgenti/moduli/avvisi.js) ----------
   All'apertura l'app legge avvisi.json, pubblicato con l'app: se c'è un avviso di questi giorni che il telefono non ha
   ancora visto, lo mostra in basso, senza coprire l'app. «Leggi» apre il testo, «Ho capito» lo chiude: in tutti e due i
   casi il telefono ricorda di averlo visto (chiave dl_avvisi). Non è un banner di consenso: non chiede nulla. */
const NOVITA = {file:null, avviso:null};
function cercaNovita(){
  if(!MODULI.avvisi || !window.fetch) return;
  fetch('avvisi.json', {cache:'no-cache', credentials:'omit'}).then(r => r.ok ? r.json() : null).then(j => { NOVITA.file = j; mostraNovita(); }).catch(() => {});
}
function mostraNovita(){
  const slot = $('novita-slot'); if(!slot) return;
  const a = NOVITA.avviso = NOVITA.file && st.guida==null ? MODULI.avvisi.daMostrare(NOVITA.file, {oggi:oggi(), visti:MEM.leggi('dl_avvisi', []), lingua:lang}) : null;
  if(!a){ slot.innerHTML = ''; return; }
  const titolo = a.tipo==='violazione' ? tr('Comunicazione sui dati') : tr('Novità nei testi');
  slot.innerHTML = `<div class="novita vetro" role="region" aria-label="${esc(titolo)}"><div class="eyebrow">${esc(titolo)}</div><p lang="${esc(a.lingua)}">${esc(a.testo)}</p>
    <div class="tasti">${a.apre && $('leg-'+a.apre) ? `<button class="tasto sec" data-az="novita-leggi">${tr('Leggi')}</button>` : ''}<button class="tasto pri" data-az="novita-ok">${tr('Ho capito')}</button></div></div>`;
}
function novitaVista(apri_){
  const a = NOVITA.avviso; if(!a) return;
  MEM.scrivi('dl_avvisi', MODULI.avvisi.conVisto(NOVITA.file, MEM.leggi('dl_avvisi', []), a.id));
  mostraNovita();
  if(apri_ && a.apre && $('leg-'+a.apre)){ st.legale = a.apre; apri('legale'); }
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
  citta = CITTA.find(x => x.id===id) ? id : 'torino'; MEM.scrivi('dl_citta', citta);
  $('cittaLbl').innerHTML = esc(cittaObj().n)+' '+giuPiccola; document.title = NOME+' — '+cittaObj().n;
  vaiCitta(anima);
  if(!map) aggiornaZona(true);   /* senza mappa la zona degli eventi segue la città scelta (T-022) */
}

/* ======================= Guida alla prima apertura ======================= */
const GUIDA = () => [
  {t:tr('Benvenuto su {nome}'), d:tr('La mappa degli eventi della città. Il cerchio è un evento, il verde pieno un tuo appuntamento. Qui li accendi e spegni.'), el:'tipiMappa'},
  {t:tr('Scegli cosa vedere'), d:tr('Gli Strati sono in fondo alla mappa, i giorni in alto: quello che cambi lo vedi subito sui segnaposto.'), el:'peek'},
  {t:tr('I tuoi appuntamenti'), d:tr('Con «+ Off-Grid» aggiungi un tuo evento: resta solo su questo telefono. Tenendo premuto un punto della mappa ne vedi le coordinate, da copiare.'), el:'btnNuovo'},
  {t:tr('Anche senza rete'), d:tr('Aggiungi {nome} alla schermata Home: si apre come un’app e funziona anche senza connessione. Come fare è scritto in Impostazioni, alla voce «Senza connessione».'), el:'btnImpo'}
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

/* ======================= Avvisi brevi in basso: un'azione da annullare e gli errori veri ======================= */
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
  document.documentElement.setAttribute('data-theme', t); MEM.scrivi('dl_tema', t);
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
function applicaLingua(l){ lang = l; MEM.scrivi('dl_lingua', l); testiFissi(); ricostruisci(); tutto(); mostraNovita(); disegnaFoglio(); if(st.sezione!=='mappa') vaiSezione(st.sezione); }


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
/* le tre lenti di chi usa l'app (chiave dl_lenti; i dati dell'app online traslocano all'avvio, T-026) */
function caricaLenti(){
  const a = MEM.leggi('dl_lenti', null);
  /* dalla memoria del telefono si tengono solo strati e temi che l'app conosce, e un nome di 16 caratteri al massimo (T-024) */
  const nome = x => String(x==null ? '' : x).slice(0, 16);
  const conv = s => { if(!s || typeof s!=='object') return null;
    const k = Array.isArray(s.k) ? s.k.filter(x => typeof x==='string' && byK(x))
      : (Array.isArray(s.tags) ? s.tags : []).map(lb => { const l = LAYERS.find(x => x.label===lb); return l ? 's:'+l.id : (TEMI_VOC.includes(lb) ? 't:'+lb : null); }).filter(Boolean);
    return k.length ? {nome:nome(s.nome||s.name), k} : null; };
  return Array.isArray(a) && a.length===3 ? a.map(conv) : [null,null,null];
}
function salvaLenti(){ MEM.scrivi('dl_lenti', TM.lenti.map(l => l ? {name:l.nome, tags:l.k.map(k => k.startsWith('s:') ? (S[k.slice(2)]||{}).label : k.slice(2)), nome:l.nome, k:l.k} : null)); }
const TM = {vista:'esplora', scelti:[], mostrati:6, mappaOn:true, q:'', strumenti:{terminati:false, nascosti:false}, lenti:caricaLenti(), lenteNome:null, lenteAg:null, salva:null, foglio:null};
const lenteAg = id => LENTI_AG.find(l => l.id===id);
const nomeLenteAg = l => tr(l.nome);

/* cosa porta i temi scelti */
const tagsEv = e => [...(S[e.strato] ? ['s:'+e.strato] : []), ...temiDi(e).map(t => 't:'+t)];
const colpisce = (keys, scelti) => keys.some(k => (scelti||TM.scelti).includes(k));
function quanti(chiavi){ return EV.filter(e => e.tipo!=='og' && !e.nascosto && !finito(e) && !sparito(e) && colpisce(tagsEv(e), chiavi)).length; }
function trovati(){
  return EV.filter(e => e.tipo!=='og')
    .filter(e => !e.nascosto || TM.strumenti.nascosti)
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
  const n = TM.scelti.length, sv = TM.salva, sbl = nascostiVisti().length;
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

/* ======================= Strumenti della Redazione (T-033) =======================
   Questo file e gli altri di sorgenti/redazione/ entrano soltanto nell'app della redazione (dist/redazione/): il
   montaggio li mette dentro lo stesso modulo dell'app, prima delle interazioni (app6.js). L'app pubblica non ne
   contiene una riga (libro mastro, § 2.4, «Due app dallo stesso codice»; § 3.11).

   L'app della redazione si apre già con gli strumenti: non c'è più una password scritta nel codice. Chi può aprirla
   lo decide l'indirizzo protetto (Fase 2); chi può pubblicare lo decide la firma (T-034, blocco 9).

   I pezzi comuni chiamano da qui, dentro i tratti riservati all'app della redazione: FOGLI_RED (i fogli), clickRed, azioneRed, inputRed,
   cambioRed (le interazioni), boxAdmin (il riquadro nella scheda). */
const CHIAVI = MODULI.chiavi.crea({deposito:MEM.base});   /* chiavi, cassaforte e marcatore (sorgenti/moduli/chiavi.js) */
/* Gli strumenti dei diritti delle persone (blocco 12: togli-nome.js, ricerca-nome.js, esporta-assistenza.js). Ogni file
   ne aggiunge uno con DIRITTI.push({voce, azione, click, input, cambio}) e mette i suoi fogli in FOGLI_RED: togliere un
   file dall'elenco del montaggio toglie lo strumento senza toccare altro. */
const DIRITTI = [];
/* il riquadro della Redazione nella scheda di un evento: dal blocco 9 gli eventi pubblicati si correggono e si ritirano da «Pubblicazione» */
const boxAdmin = e => '';
function fAdmin(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Strumenti della redazione')}</h2><p class="meta">${tr('Solo per chi pubblica gli eventi raccolti')}</p></div>${chiudiBtn()}</div>`;
  const ch = CH.stato, statoChiavi = !ch ? tr('Un attimo…') : ch.ci_sono ? tr('Dispositivo: {d}',{d:esc(ch.dispositivo)}) : ch.revocata ? tr('Revocate su questo dispositivo') : tr('Da creare: servono per salvare e pubblicare gli eventi');
  const corpo = `<button class="riga-int mz-voce" data-az="admin-misure"><span class="mz-tondo-v" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2.5 15.5h13M4.5 13V9M8 13V4.5M11.5 13V7M15 13V10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></span><div><span class="t">${tr('Misure')}</span><span class="meta">${tr('Il polso della città: offerta, rete, accessi, qualità. Senza guardare le persone.')}</span></div>${freccia}</button>
    <div class="menu-lista">
      <button class="menu-r" data-az="pubblica">${icoCal()}<div><span class="t">${tr('Pubblicazione')}</span><span class="meta">${tr('Eventi pubblicati, nuovo evento, correzione, sospensione, ritiro e storico')}</span></div>${freccia}</button>
      <button class="menu-r" data-az="segnalazioni">${icoNote}<div><span class="t">${tr('Segnalazioni')}</span><span class="meta">${tr('Arrivate con il modulo «Segnala»: lettura e righe dei registri')}</span></div>${freccia}</button>
      <button class="menu-r" data-az="admin-importa">${icoImporta}<div><span class="t">${tr('Importa eventi da Excel')}</span><span class="meta">${tr('File .xlsx o .csv: una riga per evento')}</span></div>${freccia}</button>
      <button class="menu-r" data-az="admin-modello">${icoNote}<div><span class="t">${tr('Scarica il modello Excel')}</span><span class="meta">${tr('Le colonne del file degli eventi, i valori ammessi e l’elenco degli strati')}</span></div>${freccia}</button></div>
    <div class="menu-lista">
      <button class="menu-r" data-az="chiavi">${icoLucchetto(16)}<div><span class="t">${tr('Chiavi')}</span><span class="meta">${statoChiavi}</span></div>${freccia}</button>
      <button class="menu-r" data-az="verifica">${icoNote}<div><span class="t">${tr('Viene dal nostro archivio?')}</span><span class="meta">${tr('Controlla un identificativo o un file copiato')}</span></div>${freccia}</button></div>
    ${DIRITTI.length ? `<p class="etich">${tr('Diritti delle persone')}</p><div class="menu-lista">${DIRITTI.map(d => d.voce()).join('')}</div>` : ''}
    <button class="riga-int" data-az="admin-storico"><div><span class="t">${tr('Storico delle operazioni')}</span><span class="meta">${(n => n ? (n===1 ? tr('1 operazione registrata su questo dispositivo') : tr('{n} operazioni registrate su questo dispositivo',{n:nf(n)})) : tr('Cosa hai fatto e quando, su questo dispositivo'))(storico().length)}</span></div>${freccia}</button>
    ${st.msgAdmin?`<p class="meta" role="status" style="color:var(--testo)">${esc(st.msgAdmin)}</p>`:''}
    ${st.ultimoId?`<p class="meta">${tr('Identificativo')}: <code class="red-id">${esc(st.ultimoId)}</code> <button class="link" style="min-height:32px" data-az="copia-id">${st.idCopiato?tr('Copiato'):tr('Copia')}</button></p>`:''}
    ${st.eliminati.length?`<p class="meta">${tr('Eliminati in questa sessione: {n}.',{n:st.eliminati.length})} <button class="link" style="min-height:32px" data-az="ripristina">${tr('Ripristina')}</button></p>`:''}`;
  return foglio('forte alto', testa, corpo);
}
/* ======================= Excel: importa e modello ======================= */
/* Il formato è .xlsx (Office Open XML): lo aprono e lo creano Excel, LibreOffice, Google Fogli e Numbers. Dal blocco 10
   i file si leggono e si scrivono con codice nostro (sorgenti/moduli/excel.js, T-042), senza librerie di terzi e senza
   rete; un file .ods va prima salvato come .xlsx.
   Dal blocco 12 non ci sono più gli strumenti del modello di prima, quando gli eventi stavano sul dispositivo:
   l'esportazione in Excel e in JSON degli eventi del dispositivo e l'importazione da JSON (decisione del 26/11/2026:
   nessuna esportazione in blocco degli eventi). */
const normT = x => String(x==null?'':x).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
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
function leggiImport(file){ return importaExcel(file); }   /* dal blocco 10 (T-042) il file Excel o CSV va all'importazione con anteprima (importa-excel.js) */
function fileExcel(fogli, nome){
  return Promise.resolve().then(() => {
    const blob = new Blob([MODULI.excel.scrivi(fogli)], {type:MODULI.excel.MIME});
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  });
}
/* Il modello del file degli eventi da importare (T-042): le colonne del file «Eventi da importare» del
   13/11/2026, senza quelle da lasciare vuote (Immagine, Nascosto, Password) e senza «Provenienza», che l'importazione
   non usa; in più «Luogo» e «Come arrivare», facoltative. Solo le intestazioni: nessun evento d'esempio. */
const MODELLO = [['Titolo',34],['Strato',15],['Sottostrato',16],['Descrizione',50],['Data',12],['Ora inizio',10],['Ora fine',10],['Durata',10],['Prezzo',12],
  ['Luogo',28],['Indirizzo',34],['Come arrivare',30],['Latitudine',11],['Longitudine',11],['Link',34],['Fonte',30],['Organizzatore',26],
  ['Fonte (codice FS)',12],['Data di consultazione',13],['Post leggibile senza account',18],['Dieci domande',18],['Domande e correzioni',26],['Nomi ripresi',16],
  ['Evento politico o religioso',11],['Prova del consenso (codice C)',12],['Recapito dell’organizzatore per l’avviso (codice K)',14]];
function scaricaModello(){
  const strati = [['Strato','Sottostrato']].concat(...LAYERS.map(l => l.sub.map((x, i) => [i ? '' : l.label, x.label])));
  const valori = [['Colonna','Valori ammessi'],['Post leggibile senza account','Sì, verificato senza accedere · Non pertinente'],['Dieci domande','Tutte superate · Correzione applicata · Consenso diretto chiesto'],
    ['Nomi ripresi','Nessun nome · Sì, con il solo ruolo'],['Evento politico o religioso','Sì · No']];
  const istr = [['Come compilare il file'],[''],
    ['Una riga per evento, nel foglio «Eventi». Non cambiare i nomi delle colonne.'],
    ['Per pubblicare servono: Titolo, Strato, Data, Ora inizio, Descrizione riscritta con parole proprie, Indirizzo (oppure Latitudine e Longitudine), Fonte.'],
    ['Luogo: il nome del luogo (per esempio «Sala del quartiere»). Se manca, l’app usa l’indirizzo e chiede di controllarlo.'],
    ['Come arrivare: facoltativo; utile quando il punto è messo a mano.'],
    ['Strato e Sottostrato: scrivili come nel foglio «Strati». Data: 05/11/2026. Ora inizio e Ora fine: 18:30.'],
    ['Colonne del registro delle fonti: il codice FS deve essere nell’elenco delle fonti dell’app (Pubblicazione → Fonti); i valori ammessi sono nel foglio «Valori».'],
    ['Niente immagini, password o eventi nascosti in questo file.'],
    ['Nell’app ogni riga si guarda prima di pubblicarla. Il file non si conserva nell’app.'],
    ['Il file si apre e si salva con Excel, LibreOffice, Google Fogli o Numbers: salvalo in formato .xlsx (non .ods).']];
  fileExcel([['Eventi', [MODELLO.map(x => x[0])], MODELLO.map(x => x[1])], ['Valori', valori, [30,70]], ['Strati', strati, [26,30]], ['Istruzioni', istr, [120]]], nomeFile()+'-eventi-da-importare.xlsx')
    .then(() => { st.msgAdmin = tr('Modello scaricato: {f}',{f:nomeFile()+'-eventi-da-importare.xlsx'}); disegnaFoglio(); })
    .catch(() => { st.msgAdmin = tr('Non sono riuscito a preparare il file Excel.'); disegnaFoglio(); });
}
/* ======================= Agganci dai pezzi comuni ======================= */
const FOGLI_RED = {admin:fAdmin, aform:fEventoForm, 'pb-importa':fPbImporta, chiavi:fChiavi, verifica:fVerifica, pubblica:fPubblica, 'pb-evento':fPbEvento, 'pb-storico':fPbStorico, 'pb-copia':fPbCopia, 'pb-fonti':fPbFonti, 'pb-fonte':fPbFonte,
  'pb-registro':fPbRegistro, 'pb-np':fPbNp, 'pb-np-riga':fPbNpRiga, 'pb-regimporta':fPbRegImporta, 'pb-confronto':fPbConfronto, 'pb-calendario':fPbCalendario};
/* un tocco: true se era per gli strumenti della Redazione */
function clickRed(t){
  if(t.dataset.mz!=null && clickMisure(t)) return true;
  if(DIRITTI.some(d => d.click && d.click(t))) return true;
  if(clickPubblica(t)) return true;
  return false;
}
function azioneRed(az, t){
  if(azioneChiavi(az, t)) return;
  if(azioneSg(az, t)) return;   /* le segnalazioni (segnalazioni.js, T-052) */
  if(DIRITTI.some(d => d.azione && d.azione(az, t))) return;
  if(azionePubblica(az, t)) return;
  switch(az){
    case 'scegli-mappa-a': iniziaPosa('aform'); break;
    case 'copia-id': if(st.ultimoId) copiaTesto(st.ultimoId).then(ok => { st.idCopiato = !!ok; if(st.foglio==='admin') disegnaFoglio(); }); break;
    case 'admin': st.aform = null; if(st.sezione!=='mappa') vaiSezione('mappa'); apri('admin'); break;
    case 'admin-misure': apriMisure(); break;
    case 'admin-modello': scaricaModello(); break;
    case 'admin-storico': SH.filtro = 'tutte'; SH.mostrati = 60; SH.conferma = false; foglioStorico(); break;
    case 'admin-importa': $('fileImporta').click(); break;
    case 'ripristina': if(st.eliminati.length){ registra('ripristina', {n:st.eliminati.length}); st.eliminati.forEach(x => { events.push(x.raw); if(x.cal) calEvents[x.raw.id] = true; }); st.eliminati = []; saveEvents(); saveCal(); ricostruisci(); $('toast').hidden = true; tutto(); if(st.foglio==='admin') disegnaFoglio(); } break;
  }
}
/* un campo dei moduli della Redazione: true se era suo */
function inputRed(el){
  if(inputChiavi(el)) return true;
  if(inputSg(el)) return true;
  if(DIRITTI.some(d => d.input && d.input(el))) return true;
  if(inputPubblica(el)) return true;
  return false;
}
function cambioRed(el){ return DIRITTI.some(d => d.cambio && d.cambio(el)) || cambioPubblica(el); }
$('fileImporta').addEventListener('change', function(){ const f = this.files && this.files[0]; if(f) leggiImport(f); this.value = ''; });

/* ======================= Chiavi della Redazione: le schermate (T-034, T-037) =======================
   La schermata «Chiavi» e lo strumento «Viene dal nostro archivio?». Le chiavi le fa e le tiene il modulo
   sorgenti/moduli/chiavi.js; qui ci sono soltanto ciò che si vede e i comandi.
   Nulla di segreto passa da qui tranne la frase mentre la si scrive: non si salva, e si dimentica appena è servita. */
const CH = {stato:null, vista:'', modulo:{nome:'', frase:'', ripeti:''}, copia:null, errore:'', lavoro:false, msg:'', revoca:false, avviso:null,
  cassaforte:null, scopo:'', ver:{testo:'', esito:null, errore:''}};
const ERRORI_CHIAVI = {
  'frase-corta':() => tr('La frase deve avere almeno {n} caratteri.',{n:MODULI.chiavi.FRASE_MIN}),
  'frase-diversa':() => tr('Le due frasi non sono uguali.'),
  nome:() => tr('Dai un nome al dispositivo (al massimo {n} caratteri).',{n:MODULI.chiavi.NOME_MAX}),
  frase:() => tr('La frase non apre questa copia: controlla la frase e il file.'),
  file:() => tr('Il file non è quello giusto: serve la copia fatta da questa app.'),
  browser:() => tr('Questo browser non può conservare le chiavi: prova con un altro browser, non in navigazione privata.'),
  'ci-sono':() => tr('Su questo dispositivo le chiavi ci sono già.'),
  mancano:() => tr('Prima crea le chiavi.')
};
const erroreChiavi = e => (ERRORI_CHIAVI[e && e.motivo] || (() => tr('Non è riuscito: riprova.')))();
function aggiornaChiavi(){
  return CHIAVI.stato().then(s => { CH.stato = s; }, e => { CH.stato = {ci_sono:false, guasto:true, revocata:null}; })
    .then(() => CH.stato.ci_sono ? CHIAVI.cassaforte.pulisci().then(r => { CH.cassaforte = r; }, () => { CH.cassaforte = null; }) : null)
    .then(() => { if(st.foglio==='chiavi' || st.foglio==='admin') disegnaFoglio(); });
}
function scaricaTesto(testo, nome){ scaricaBlob(new Blob([testo], {type:'application/json'}), nome); }
const dataChiavi = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(dloc(), {day:'numeric', month:'long', year:'numeric'}); };

function fChiavi(){
  const s = CH.stato, m = CH.modulo;
  const testa = `<div class="riga-titolo"><div><h2>${tr('Chiavi')}</h2><p class="meta">${tr('Firma, cifratura, marcatore e cassaforte della Redazione')}</p></div>${chiudiBtn('admin')}</div>`;
  const err = CH.errore ? `<p class="err" role="alert">${esc(CH.errore)}</p>` : '';
  const msg = CH.msg ? `<p class="meta" role="status" style="color:var(--testo)">${esc(CH.msg)}</p>` : '';
  const campo = (id, lab, html, nota) => `<div class="stack-s"><label class="etich" for="${id}">${lab}</label>${html}${nota?`<span class="meta">${nota}</span>`:''}</div>`;
  const cNome = campo('ch-nome', tr('Nome di questo dispositivo'), `<div class="campo"><input id="ch-nome" data-ch="nome" maxlength="${MODULI.chiavi.NOME_MAX}" value="${esc(m.nome)}" placeholder="${esc(tr('es. Portatile della redazione'))}" autocomplete="off"></div>`, tr('Serve a riconoscerlo quando lo si revoca.'));
  const cFrase = (id, c, lab, nota) => campo(id, lab, `<div class="campo"><input id="${id}" data-ch="${c}" type="password" value="${esc(m[c])}" autocomplete="off" autocapitalize="off" spellcheck="false"></div>`, nota);
  let corpo;
  if(!s) corpo = `<p class="caricamento">${tr('Un attimo…')}</p>`;
  else if(s.guasto) corpo = `<p class="err" role="alert">${ERRORI_CHIAVI.browser()}</p>`;
  else if(CH.lavoro) corpo = `<p class="caricamento">${tr('Preparo le chiavi: ci vuole qualche secondo…')}</p>`;
  else if(!s.ci_sono && CH.vista==='copia'){
    corpo = `<p>${tr('Scegli il file della copia di riserva delle chiavi e scrivi la frase con cui è stata cifrata.')}</p>
      <button class="tasto sec pieno" data-az="chiavi-file">${CH.copia ? tr('File scelto: {f}',{f:esc(CH.copia.nome)}) : tr('Scegli il file della copia')}</button>
      ${cFrase('ch-frase', 'frase', tr('Frase della copia'))}
      ${err}
      <button class="tasto pri pieno" data-az="chiavi-ripristina">${tr('Ripristina su questo dispositivo')}</button>
      <p class="meta">${tr('Per quando il dispositivo di prima è perso o cambiato: qui tornano le stesse chiavi, firma compresa.')}</p>
      ${cNome}
      <button class="tasto sec pieno" data-az="chiavi-aggiungi">${tr('Aggiungi come dispositivo in più')}</button>
      <p class="meta">${tr('Per lavorare da due dispositivi: questo riceve le chiavi comuni e una firma sua, che si può revocare da sola.')}</p>
      <button class="link" data-az="chiavi-vista-crea">${tr('‹ Crea chiavi nuove')}</button>`;
  }
  else if(!s.ci_sono){
    const rev = s.revocata ? `<div class="red-riquadro" role="note"><b>${tr('Le chiavi di questo dispositivo sono revocate.')}</b><span class="meta">${tr('Dispositivo «{d}», firma {i}, revocata il {g}. Consegna l’avviso di revoca allo sportello: da quel momento la firma non vale più.',{d:esc(s.revocata.dispositivo), i:esc(s.revocata.impronta), g:esc(dataChiavi(s.revocata.quando))})}</span>
        <div class="tasti"><button class="tasto sec" data-az="chiavi-revoca-file">${tr('Scarica l’avviso di revoca')}</button></div></div>` : '';
    corpo = `${rev}${msg}
      <p>${tr('Le chiavi nascono su questo dispositivo e la loro parte segreta non ne esce. Servono per salvare gli eventi con l’identificativo giusto, per firmare ciò che si pubblica e per leggere le segnalazioni.')}</p>
      ${cNome}
      ${cFrase('ch-frase', 'frase', tr('Frase della Redazione'), tr('Almeno {n} caratteri: per esempio quattro o cinque parole a caso. Protegge la copia di riserva. Non si salva da nessuna parte: se la dimentichi, la copia non si apre più.',{n:MODULI.chiavi.FRASE_MIN}))}
      ${cFrase('ch-ripeti', 'ripeti', tr('Ripeti la frase'))}
      ${err}
      <button class="tasto pri pieno" data-az="chiavi-crea">${tr('Crea le chiavi')}</button>
      <button class="link" data-az="chiavi-vista-copia">${tr('Ho già una copia di riserva')} ${freccia}</button>`;
  }
  else {
    const cas = CH.cassaforte, nCas = cas ? cas.restano : 0;
    const noti = (s.noti||[]).map((n, i) => `<div class="red-riga"><div><span class="t">${esc(n.dispositivo)}</span><span class="meta">${tr('Firma {i}',{i:esc(n.impronta)})}</span></div><button class="link" data-az="chiavi-revoca-altro" data-i="${i}">${tr('Avviso di revoca')}</button></div>`).join('');
    corpo = `${msg}
      <div class="red-riquadro"><b>${esc(s.dispositivo)}</b><span class="meta">${tr('Chiavi create il {g}',{g:esc(dataChiavi(s.creato))})}</span>
        <span class="meta">${tr('Firma')}: <code class="red-id">${esc(s.firma.impronta)}</code></span><span class="meta">${tr('Cifratura')}: <code class="red-id">${esc(s.cifratura.impronta)}</code></span></div>
      <section class="sezione"><div class="tipo">${tr('Parti pubbliche')}</div>
        <p class="meta">${tr('Sono ciò che si consegna agli sportelli: servono a riconoscere la firma e a cifrare le segnalazioni. Non contengono nulla di segreto.')}</p>
        <div class="tasti"><button class="tasto sec" data-az="chiavi-pubbliche-copia">${CH.copiato ? tr('Copiate') : tr('Copia')}</button><button class="tasto sec" data-az="chiavi-pubbliche-file">${tr('Scarica')}</button></div></section>
      <section class="sezione"><div class="tipo">${tr('Copia di riserva')}</div>
        <p class="meta">${tr('Un file cifrato con la frase della Redazione: senza la frase è illeggibile. Tienilo fuori da questo dispositivo, su un supporto cifrato; mai in una chat o nella posta.')}</p>
        <button class="tasto sec pieno" data-az="chiavi-copia">${tr('Scarica la copia di riserva')}</button>
        <p class="meta">${tr('Per riaprirla serve questa app: su un dispositivo senza chiavi, Chiavi → «Ho già una copia di riserva», poi il file e la frase.')}</p></section>
      <section class="sezione"><div class="tipo">${tr('Cassaforte degli eventi nascosti')}</div>
        <p class="meta">${nCas===1 ? tr('1 password conservata, cifrata.') : tr('{n} password conservate, cifrate.',{n:nCas})} ${tr('Ogni password si cancella da sola quando il suo evento finisce.')}</p>
        <div class="tasti"><button class="tasto sec" data-az="cassaforte-copia">${tr('Scarica la copia')}</button><button class="tasto sec" data-az="cassaforte-file">${tr('Riporta da una copia')}</button></div></section>
      ${noti ? `<section class="sezione"><div class="tipo">${tr('Altri dispositivi della Redazione')}</div>${noti}</section>` : ''}
      ${err}
      <section class="sezione"><div class="tipo">${tr('Revoca')}</div>
      ${CH.revoca ? `<div class="red-riquadro" role="alert"><b>${tr('Revocare questo dispositivo?')}</b><span class="meta">${tr('Le chiavi si cancellano da qui e non si possono più usare: per continuare servirà la copia di riserva con la frase, oppure chiavi nuove. Poi va consegnato allo sportello l’avviso di revoca.')}</span>
          <div class="tasti"><button class="tasto sec" data-az="chiavi-revoca-no">${tr('Annulla')}</button><button class="tasto pericolo" data-az="chiavi-revoca-ok">${tr('Sì, revoca')}</button></div></div>`
        : `<button class="link" style="color:var(--rosso,#B3261E)" data-az="chiavi-revoca">${tr('Revoca questo dispositivo')}</button>`}</section>`;
  }
  return foglio('forte alto', testa, corpo);
}

/* «Viene dal nostro archivio?» (T-037): un identificativo, oppure un testo o un file copiato. */
function fVerifica(){
  const V = CH.ver, e = V.esito;
  const testa = `<div class="riga-titolo"><div><h2>${tr('Viene dal nostro archivio?')}</h2><p class="meta">${tr('Il marcatore negli identificativi degli eventi lo riconosce solo chi ha la chiave')}</p></div>${chiudiBtn('admin')}</div>`;
  const elenco = l => l.slice(0, 20).map(x => `<code class="red-id">${esc(x)}</code>`).join(' ') + (l.length > 20 ? ' …' : '');
  const esito = !e ? '' : !e.trovati ? `<div class="red-riquadro" role="status"><b>${tr('Nessun identificativo nel testo.')}</b><span class="meta">${tr('Un identificativo è fatto di 16 caratteri, un trattino e altri 8.')}</span></div>`
    : `<div class="red-riquadro" role="status"><b>${e.trovati===1 ? (e.nostri.length ? tr('Sì: viene dal nostro archivio.') : tr('No: non viene dal nostro archivio.')) : tr('{n} identificativi: {s} vengono dal nostro archivio, {a} no.',{n:e.trovati, s:e.nostri.length, a:e.altri.length})}</b>
        ${e.trovati>1 && e.nostri.length ? `<span class="meta">${tr('Dal nostro archivio')}: ${elenco(e.nostri)}</span>` : ''}${e.trovati>1 && e.altri.length ? `<span class="meta">${tr('Non nostri')}: ${elenco(e.altri)}</span>` : ''}
        <span class="meta">${tr('Vale per gli identificativi creati con le chiavi di questa Redazione.')}</span></div>`;
  const corpo = `<div class="stack-s"><label class="etich" for="ver-testo">${tr('Identificativo o testo copiato')}</label><div class="campo"><textarea id="ver-testo" data-ch="verifica" rows="4" autocomplete="off" spellcheck="false">${esc(V.testo)}</textarea></div></div>
    ${V.errore ? `<p class="err" role="alert">${esc(V.errore)}</p>` : ''}
    <div class="tasti"><button class="tasto sec" data-az="verifica-file">${tr('Apri un file')}</button><button class="tasto pri" data-az="verifica-ok">${tr('Controlla')}</button></div>
    ${esito}`;
  return foglio('forte alto', testa, corpo);
}
function controllaVerifica(){
  const V = CH.ver; V.errore = ''; V.esito = null;
  CHIAVI.controllaTesto(V.testo).then(r => { V.esito = r; }, e => { V.errore = erroreChiavi(e); }).then(() => { if(st.foglio==='verifica') disegnaFoglio(); });
}

function scegliFileRed(scopo){ CH.scopo = scopo; $('fileRed').click(); }
$('fileRed').addEventListener('change', function(){
  const f = this.files && this.files[0], scopo = CH.scopo; this.value = ''; if(!f) return;
  if(f.size > 20e6){ CH.errore = tr('Il file è troppo grande.'); CH.ver.errore = CH.errore; disegnaFoglio(); return; }
  const r = new FileReader();
  r.onload = () => {
    const testo = String(r.result||'');
    if(scopo==='chiavi'){ CH.copia = {nome:f.name, testo}; CH.errore = ''; disegnaFoglio(); }
    else if(scopo==='cassaforte'){ CH.errore = ''; CH.msg = '';
      CHIAVI.cassaforte.ripristina(testo).then(x => { CH.msg = tr('Cassaforte: {n} password riportate, {s} scartate.',{n:x.rientrate, s:x.scartate}); registra('cassaforte-riporta', {n:x.rientrate}); }, e => { CH.errore = erroreChiavi(e); }).then(aggiornaChiavi); }
    else if(scopo==='verifica'){ CH.ver.testo = testo.slice(0, 2e6); if(st.foglio==='verifica') disegnaFoglio(); controllaVerifica(); }
  };
  r.onerror = () => { CH.errore = tr('Il file non si legge.'); disegnaFoglio(); };
  r.readAsText(f);
});

/* i comandi delle due schermate: true se il comando era loro */
function azioneChiavi(az, t){
  const m = CH.modulo, pulito = () => { m.frase = ''; m.ripeti = ''; };
  const lavora = p => { CH.lavoro = true; CH.errore = ''; CH.msg = ''; disegnaFoglio();
    return p.then(msg => { pulito(); CH.copia = null; CH.vista = ''; CH.msg = msg; MEM.tieni(); }, e => { CH.errore = erroreChiavi(e); }).then(() => { CH.lavoro = false; return aggiornaChiavi(); }); };
  switch(az){
    case 'chiavi': CH.errore = ''; CH.msg = ''; CH.revoca = false; CH.copiato = false; apri('chiavi'); aggiornaChiavi(); break;
    case 'chiavi-vista-copia': CH.vista = 'copia'; CH.errore = ''; disegnaFoglio(); break;
    case 'chiavi-vista-crea': CH.vista = ''; CH.errore = ''; disegnaFoglio(); break;
    case 'chiavi-crea': lavora(CHIAVI.genera(m.frase, m.ripeti, m.nome).then(() => { registra('chiavi-crea'); return tr('Chiavi create. Scarica subito la copia di riserva e conservala fuori da questo dispositivo.'); })); break;
    case 'chiavi-file': scegliFileRed('chiavi'); break;
    case 'chiavi-ripristina': case 'chiavi-aggiungi': {
      if(!CH.copia){ CH.errore = tr('Scegli prima il file della copia.'); disegnaFoglio(); break; }
      const modo = az==='chiavi-aggiungi' ? 'aggiungi' : 'ripristina';
      lavora(CHIAVI.daCopia(CH.copia.testo, m.frase, modo, m.nome).then(() => { registra('chiavi-'+modo); return modo==='aggiungi' ? tr('Dispositivo aggiunto: consegna allo sportello le sue parti pubbliche e scarica la sua copia di riserva.') : tr('Chiavi ripristinate su questo dispositivo.'); }));
      break; }
    case 'chiavi-copia': CHIAVI.copia().then(c => { scaricaTesto(c.testo, c.nome); registra('chiavi-copia'); CH.msg = tr('Copia di riserva scaricata: {f}',{f:c.nome}); }, e => { CH.errore = erroreChiavi(e); }).then(() => disegnaFoglio()); break;
    case 'chiavi-pubbliche-copia': CHIAVI.pubbliche().then(p => copiaTesto(JSON.stringify(p, null, 1))).then(ok => { CH.copiato = !!ok; if(!ok) CH.errore = tr('Non riesco a copiare: usa «Scarica».'); }, e => { CH.errore = erroreChiavi(e); }).then(() => disegnaFoglio()); break;
    case 'chiavi-pubbliche-file': CHIAVI.pubbliche().then(p => scaricaTesto(JSON.stringify(p, null, 1)+'\n', 'chiavi-pubbliche-'+p.creato.slice(0,10)+'.json'), e => { CH.errore = erroreChiavi(e); disegnaFoglio(); }); break;
    case 'chiavi-revoca': CH.revoca = true; disegnaFoglio(); break;
    case 'chiavi-revoca-no': CH.revoca = false; disegnaFoglio(); break;
    case 'chiavi-revoca-ok': CH.revoca = false; CHIAVI.revoca().then(a => { CH.avviso = a; registra('chiavi-revoca'); CH.msg = '';
      /* allo sportello di prova l'avviso arriva subito; allo sportello vero lo consegna chi amministra Bunny */
      if(SPORTELLO.diProva()) return SPORTELLO.prova.revoca(a).catch(() => {}); }, e => { CH.errore = erroreChiavi(e); }).then(aggiornaChiavi); break;
    case 'chiavi-revoca-file': { const a = CH.stato && CH.stato.revocata; if(a) scaricaTesto(JSON.stringify(a, null, 1)+'\n', 'revoca-'+String(a.quando).slice(0,10)+'.json'); break; }
    case 'chiavi-revoca-altro': { const n = CH.stato && (CH.stato.noti||[])[+(t && t.dataset.i)];
      if(n){ const a = CHIAVI.avvisoRevoca(n.dispositivo, n.impronta); scaricaTesto(JSON.stringify(a, null, 1)+'\n', 'revoca-'+a.quando.slice(0,10)+'.json'); } break; }
    case 'cassaforte-copia': CHIAVI.cassaforte.copia().then(c => { scaricaTesto(c.testo, c.nome); registra('cassaforte-copia'); CH.msg = tr('Copia della cassaforte scaricata: {f}',{f:c.nome}); }, e => { CH.errore = erroreChiavi(e); }).then(() => disegnaFoglio()); break;
    case 'cassaforte-file': scegliFileRed('cassaforte'); break;
    case 'verifica': CH.ver.errore = ''; apri('verifica'); break;
    case 'verifica-ok': controllaVerifica(); break;
    case 'verifica-file': scegliFileRed('verifica'); break;
    default: return false;
  }
  return true;
}
function inputChiavi(el){
  const c = el.dataset.ch; if(!c) return false;
  if(c==='verifica') CH.ver.testo = el.value; else CH.modulo[c] = el.value;
  return true;
}
/* all'apertura: lo stato delle chiavi e la pulizia della cassaforte (le password degli eventi finiti si cancellano) */
aggiornaChiavi();

/* ======================= Lo sportello: l'invio dei pacchetti e lo sportello di prova (T-038) =======================
   Da qui l'app della redazione parla con lo sportello di pubblicazione: forma il pacchetto, lo firma con la chiave del
   dispositivo (sorgenti/moduli/pacchetto.js, sorgenti/moduli/chiavi.js) e lo consegna.

   Dove lo consegna. Quando la configurazione ha l'indirizzo dello sportello (Bunny, T-065), il pacchetto parte per
   quell'indirizzo. Finché l'indirizzo è vuoto c'è lo «sportello di prova»: la stessa logica dello sportello vero
   (sportelli/pubblicazione.js) gira qui, dentro il browser, con un archivio finto tenuto nella memoria del browser per
   i file. Sul collegamento di prova l'app pubblica sta allo stesso indirizzo e legge quell'archivio (app2.js): così il
   giro intero si prova sul telefono senza Bunny, con soli eventi inventati. Nulla esce dal dispositivo.

   Le chiavi ammesse dallo sportello non viaggiano mai in un pacchetto: allo sportello vero le consegna il Responsabile
   infrastruttura con i file della schermata «Chiavi»; allo sportello di prova le consegna il comando qui sotto. */
const SPORTELLO = (() => {
  const vero = (CFG.indirizzi||{}).sportello_pubblicazione || '';
  const base = SPORTELLO_PROVA_DOVE;
  const diProva = () => !vero && !!base && !!MEM.file && !!MODULI.sportello;
  let logica = null;
  /* il deposito dello sportello di prova (app2.js): lo stesso dello sportello delle segnalazioni di prova (T-051) */
  const deposito = depositoProva();
  const sportello = () => logica || (logica = MODULI.sportello.crea({deposito, regioni:MODULI.regioni, vocabolario:FORMATO.vocabolario(LAYERS, TEMI_VOC)}));
  function errore(motivo, corpo){ const e = new Error('sportello: '+motivo); e.motivo = motivo; e.corpo = corpo||null; return e; }

  async function consegna(testo){
    if(vero){
      let r; try{ r = await fetch(vero, {method:'POST', body:testo, headers:{'content-type':'application/json'}, credentials:'omit', cache:'no-store', redirect:'error', referrerPolicy:'no-referrer'}); }catch(e){ throw errore('rete'); }
      let corpo = null; try{ corpo = await r.json(); }catch(e){ corpo = null; }
      return {stato:r.status, corpo:corpo||{}};
    }
    if(!diProva()) throw errore('assente');
    return sportello().ricevi(testo);
  }
  async function firmato(contenuto){
    let s; try{ s = await CHIAVI.stato(); }catch(e){ throw errore('chiavi'); }
    if(!s.ci_sono) throw errore('chiavi');
    return MODULI.pacchetto.forma(contenuto, {firma:CHIAVI.firma, dispositivo:{nome:s.dispositivo, impronta:s.firma.impronta}});
  }
  /* chiedi(contenuto) → ciò che lo sportello risponde. Un rifiuto diventa un errore con il motivo dello sportello. */
  async function chiedi(contenuto){
    const r = await consegna(JSON.stringify(await firmato(contenuto)));
    if(r.stato!==200 || !r.corpo || r.corpo.esito!=='fatto') throw errore((r.corpo && r.corpo.motivo) || 'guasto', r.corpo);
    return r.corpo;
  }

  /* ---------- Solo per lo sportello di prova ---------- */
  const prova = {
    /* questo dispositivo è tra quelli ammessi? e quanti sono */
    async stato(){
      const k = await sportello().chiavi(); let s = null; try{ s = await CHIAVI.stato(); }catch(e){ s = null; }
      const mia = s && s.ci_sono ? s.firma.impronta : '';
      return {ammessi:k.ammesse.length, revocati:k.revocate.length, chiavi:!!mia, ammesso:!!mia && k.ammesse.some(x => x.impronta===mia), revocato:!!mia && k.revocate.some(x => x.impronta===mia)};
    },
    async consegnaChiavi(){ return sportello().ammetti(await CHIAVI.pubbliche()); },
    revoca: avviso => sportello().revoca(avviso),
    /* un pacchetto cambiato dopo la firma: lo sportello lo deve rifiutare */
    async firmaSbagliata(){
      const p = await firmato({operazione:'stato'}); p.contenuto = JSON.stringify({operazione:'storico'});
      return consegna(JSON.stringify(p));
    },
    /* gli eventi inventati dell'archivio di prova del repository, letti dalla rete */
    async eventiDelRepository(){
      const A = MODULI.archivio.crea({dove:ARCHIVIO_DOVE, vocabolario:FORMATO.vocabolario(LAYERS, TEMI_VOC), fetch:window.fetch.bind(window)});
      await A.controllaNovita(); if(!A.pronto()) throw errore('rete');
      await A.carica(A.quadranti());
      return A.eventi().map(x => x.ev);
    },
    async svuota(){ logica = null; await MEM.file.delete('prova_sportello'); }
  };
  return {chiedi, diProva, vero:() => vero, prova};
})();

/* ======================= Pubblicazione: le schermate (T-038, T-039, T-040) =======================
   «Pubblicazione» negli strumenti della redazione: l'elenco degli eventi pubblicati e sospesi, come li tiene lo
   sportello; il modulo dell'evento con i campi del formato pubblico (docs/formato-eventi.md), che serve a pubblicare un
   evento nuovo e a correggerne uno; sospendere, riattivare e ritirare prima della fine con il motivo; lo storico delle
   pubblicazioni con il confronto tra due copie e il ripristino.

   Ogni cosa che cambia l'archivio parte come pacchetto firmato (sportello-prova.js): qui non si scrive nulla
   nell'archivio. Dal blocco 10 (T-041) il modulo dell'evento è la scheda di pubblicazione: le dieci domande, le
   colonne di giudizio del registro delle fonti, i controlli prima di pubblicare e gli eventi preparati stanno in
   scheda-pubblicazione.js; le fonti e le righe del registro in registro-fonti.js. Senza le colonne di giudizio
   «Pubblica» resta spento (cap. 22, regola 1).

   Testi come testo (T-024): titoli, luoghi, nomi dei dispositivi e risposte dello sportello vengono da fuori e
   entrano nella pagina solo con esc(). */
const PB = {stato:null, prova:null, carico:false, lavoro:false, errore:'', msg:'', sel:null, ritiro:null, svuota:false,
  copie:null, scelte:[], confronto:null, ripr:null, fonte:null, togliPrep:null};
const MOTIVI_RITIRO = {annullato:'Annullato', errore:'Errore non verificabile in tempo', esclusione:'Esclusione (X)', richiesta:'Richiesta (R)', segnalazione:'Segnalazione (S)', ordine:'Ordine di un’autorità (A)'};
const oraPb = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleTimeString(dloc(), {hour:'2-digit', minute:'2-digit'}); };
const quandoPb = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(dloc(), {day:'numeric', month:'long', year:'numeric'})+', '+oraPb(iso); };
const giornoOra = v => { const g = String(v||'').split('T'); return g[0] ? dIso(g[0]).toLocaleDateString(dloc(), {weekday:'short', day:'numeric', month:'short'})+' · '+(g[1]||'') : ''; };
const quandoEv = ev => giornoOra(ev.inizio);
function errorePb(e){
  const c = (e && e.corpo) || {};
  const T = {
    chiavi:() => tr('Per pubblicare servono le chiavi della Redazione: Strumenti della redazione → Chiavi.'),
    sconosciuto:() => SPORTELLO.diProva() ? tr('Lo sportello di prova non conosce ancora questo dispositivo: tocca «Consegna le chiavi allo sportello di prova».') : tr('Lo sportello non conosce questo dispositivo: vanno consegnate le sue chiavi pubbliche.'),
    revocata:() => tr('La firma di questo dispositivo è revocata: lo sportello non la accetta più.'),
    firma:() => tr('Lo sportello ha rifiutato la firma.'),
    fermo:() => tr('Troppe firme sbagliate: lo sportello non risponde a questo dispositivo fino alle {o}.',{o:oraPb(c.fino)}),
    tempo:() => tr('Lo sportello ha rifiutato il pacchetto perché l’ora non corrisponde: controlla data e ora di questo dispositivo.'),
    ripetuto:() => tr('Lo sportello aveva già ricevuto questo pacchetto: riprova.'),
    evento:() => tr('Lo sportello ha rifiutato un evento: {d}',{d:(c.dettagli||[]).map(x => (x.errori||[]).join('; ')).join(' · ')}),
    passato:() => tr('L’evento è già finito da più di tre ore: non si pubblica.'),
    manca:() => tr('L’evento non c’è più nell’archivio: aggiorna l’elenco.'),
    copia:() => tr('Lo sportello non trova questa copia.'),
    impronta:() => tr('Lo sportello ha rifiutato la password: è già usata da un altro evento nascosto, oppure non è quella dell’evento da correggere.'),
    nascosto:() => tr('Lo sportello ha rifiutato l’evento nascosto: il file cifrato non è nella forma attesa, oppure un evento nascosto e uno pubblico hanno lo stesso identificativo.'),
    rete:() => tr('Lo sportello non risponde: controlla la connessione e riprova.'),
    assente:() => tr('Su questo indirizzo non c’è uno sportello a cui consegnare i pacchetti.')
  };
  return (T[e && e.motivo] || (() => tr('Non è riuscito: riprova.')))();
}
const fogliPb = ['pubblica', 'pb-evento', 'pb-storico', 'pb-copia', 'pb-fonti', 'pb-fonte', 'pb-importa', 'pb-registro', 'pb-np', 'pb-np-riga', 'pb-regimporta', 'pb-confronto', 'pb-calendario', 'aform'];
const ridisegnaPb = () => { if(!fogliPb.includes(st.foglio)) return;
  /* il modulo dell'evento non si ridisegna mentre si scrive in un campo: si perderebbe il punto in cui si scrive */
  const a = document.activeElement; if(st.foglio==='aform' && a && a.closest && a.closest('#foglio-slot') && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
  disegnaFoglio(); };
function aggiornaPb(){
  PB.carico = true; ridisegnaPb();
  const prova = SPORTELLO.diProva() ? SPORTELLO.prova.stato().then(s => { PB.prova = s; }, () => { PB.prova = null; }) : Promise.resolve();
  /* allo sportello di prova che non conosce ancora le chiavi di questo dispositivo (per esempio appena svuotato) l'elenco
     non si chiede: risponderebbe con un rifiuto in rosso, mentre il riquadro lo dice già, con «Consegna le chiavi» */
  const nonAmmesso = () => SPORTELLO.diProva() && PB.prova && PB.prova.chiavi && !PB.prova.ammesso && !PB.prova.revocato;
  return prova.then(() => nonAmmesso() ? (PB.stato = null) : SPORTELLO.chiedi({operazione:'stato'}).then(s => { PB.stato = s; PB.errore = ''; }, e => { PB.stato = null; PB.errore = errorePb(e); }))
    .then(() => { PB.carico = false; ridisegnaPb(); if(SPORTELLO.diProva()) riapriArchivio(); return PB.stato ? nrDecifra(nrVoci(PB.stato)).then(ridisegnaPb) : null; });
}
/* manda un pacchetto che scrive; poi rilegge l'elenco e torna alla schermata «Pubblicazione» */
function scriviPb(contenuto, fatto, torna){
  if(PB.lavoro) return Promise.resolve(false);
  PB.lavoro = true; PB.errore = ''; PB.msg = ''; ridisegnaPb();
  return SPORTELLO.chiedi(contenuto).then(r => { PB.lavoro = false; PB.msg = fatto(r); PB.sel = null; PB.ritiro = null; st.foglio = torna || 'pubblica'; return aggiornaPb().then(() => true); },
    e => { PB.lavoro = false; PB.errore = errorePb(e); ridisegnaPb(); return false; });
}
/* un evento dell'elenco: pubblico, oppure nascosto (T-045: ev c'è solo se questo dispositivo ne ha la password) */
const evPb = id => { const s = PB.stato; if(!s) return null; const e = s.eventi.find(x => x.id===id); if(e) return {ev:e, sospeso:false}; const z = s.sospesi.find(x => x.id===id); if(z) return {ev:z, sospeso:true};
  const n = (s.nascosti||[]).find(x => x.id===id), m = n ? null : (s.nascostiSospesi||[]).find(x => x.id===id), v = n || m;
  return v ? {ev:(NR.chiari.get(id)||{}).ev || null, voce:v, sospeso:!!m, nascosto:true} : null; };
/* le righe degli eventi nascosti nell'elenco */
function nascostiPbHtml(s){
  const l = (s.nascosti||[]).map(x => [x, false]).concat((s.nascostiSospesi||[]).map(x => [x, true]));
  if(!l.length) return '';
  return `<p class="etich">${tr('Nascosti')} · ${l.length}</p><div class="menu-lista">${l.map(([x, sos]) => { const c = NR.chiari.get(x.id);
    return c ? rigaEvPb(c.ev, 'data-pbev', sos ? tr('nascosto, sospeso: fuori dall’archivio') : tr('nascosto'))
      : `<button class="menu-r" data-pbev="${esc(x.id)}">${icoCal()}<div><span class="t">${tr('Evento nascosto')}</span><span class="meta">${tr('La password non è su questo dispositivo')} · ${tr('esce dall’archivio dopo il {g}',{g:esc(x.giorno)})}${sos?' · '+tr('sospeso'):''}</span></div>${freccia}</button>`; }).join('')}</div>`;
}
const rigaEvPb = (ev, attr, nota) => `<button class="menu-r" ${attr}="${esc(ev.id)}">${icoCal()}<div><span class="t">${esc(ev.titolo)}</span><span class="meta">${esc(quandoEv(ev))} · ${esc(ev.luogo)}${nota?' · '+esc(nota):''}</span></div>${freccia}</button>`;
const statoPb = () => `${PB.errore?`<p class="err" role="alert">${esc(PB.errore)}</p>`:''}${PB.msg?`<p class="meta" role="status" style="color:var(--testo)">${esc(PB.msg)}</p>`:''}${PB.lavoro?`<p class="caricamento">${tr('Firmo e consegno allo sportello…')}</p>`:''}`;

function fPubblica(){
  const s = PB.stato, P = PB.prova, diProva = SPORTELLO.diProva();
  const testa = `<div class="riga-titolo"><div><h2>${tr('Pubblicazione')}</h2><p class="meta">${diProva ? tr('Sportello di prova: archivio finto su questo dispositivo') : tr('Pacchetti firmati allo sportello')}</p></div>${chiudiBtn('admin')}</div>`;
  const prova = !diProva ? '' : `<div class="red-riquadro" role="note"><b>${tr('Sportello di prova')}</b>
      <span class="meta">${tr('Fa le stesse cose dello sportello vero, ma dentro questo browser: l’app pubblica di prova aperta su questo dispositivo legge il suo archivio (dopo una pubblicazione, ricaricala). Solo eventi inventati.')}</span>
      <span class="meta">${!P ? tr('Un attimo…') : P.revocato ? tr('La firma di questo dispositivo è revocata.') : P.ammesso ? tr('Questo dispositivo è tra quelli che lo sportello di prova accetta ({n}).',{n:P.ammessi}) : tr('Lo sportello di prova non conosce ancora questo dispositivo.')}</span>
      ${P && !P.ammesso && !P.revocato ? `<div class="tasti"><button class="tasto pri" data-az="pb-consegna">${tr('Consegna le chiavi allo sportello di prova')}</button></div>` : ''}
      <button class="link" style="min-height:32px" data-az="pb-venti">${tr('Porta qui gli eventi inventati dell’archivio di prova')}</button>
      <button class="link" style="min-height:32px" data-az="pb-falsa">${tr('Prova a consegnare un pacchetto con la firma sbagliata')}</button>
      <button class="link" style="min-height:32px" data-az="pb-svuota">${PB.svuota ? tr('Tocca ancora per svuotare: l’app pubblica di prova torna all’archivio del repository') : tr('Svuota lo sportello di prova')}</button></div>`;
  const elenco = !s ? (PB.carico ? `<p class="caricamento">${tr('Chiedo l’elenco allo sportello…')}</p>` : '')
    : `<p class="etich">${tr('Pubblicati')} · ${s.eventi.length}</p>
      ${s.eventi.length ? `<div class="menu-lista">${s.eventi.slice().sort((a,b) => a.inizio<b.inizio?-1:1).map(ev => rigaEvPb(ev, 'data-pbev')).join('')}</div>` : `<p class="meta">${tr('Nessun evento pubblicato.')}</p>`}
      ${s.sospesi.length ? `<p class="etich">${tr('Sospesi')} · ${s.sospesi.length}</p><div class="menu-lista">${s.sospesi.map(ev => rigaEvPb(ev, 'data-pbev', tr('fuori dalla mappa'))).join('')}</div>` : ''}
      ${nascostiPbHtml(s)}
      <p class="meta">${s.aggiornato ? tr('Ultima pubblicazione: {q}.',{q:esc(quandoPb(s.aggiornato))}) : tr('Non è ancora stato pubblicato nulla.')} ${tr('Gli eventi finiti da più di tre ore escono da soli.')}</p>`;
  const corpo = `${prova}${nrFattoHtml()}${statoPb()}
    <div class="tasti"><button class="tasto pri" data-az="pb-nuovo">${tr('Nuovo evento')}</button><button class="tasto sec" data-az="ix-file">${tr('Importa da Excel')}</button><button class="tasto sec" data-az="pb-registro">${tr('Registro delle fonti')}</button><button class="tasto sec" data-az="pb-storico">${tr('Storico delle pubblicazioni')}</button></div>
    <p class="meta"><button class="link" style="min-height:32px" data-az="pb-calendari">${tr('Importa un calendario aperto di un Comune')}</button>${IX.stato ? ' · <button class="link" style="min-height:32px" data-az="ix-torna">'+tr('Torna all’importazione in corso')+'</button>' : ''}</p>
    ${preparatiHtml()}
    ${elenco}
    <button class="link" data-az="pb-aggiorna">${tr('Aggiorna l’elenco')}</button>`;
  return foglio('forte alto', testa, corpo);
}

function fPbEvento(){
  const x = evPb(PB.sel);
  const testa = `<div class="riga-titolo"><div><h2>${x ? (x.ev ? esc(x.ev.titolo) : tr('Evento nascosto')) : tr('Evento')}</h2><p class="meta">${x ? (x.nascosto ? tr('Evento nascosto')+' · ' : '')+(x.sospeso ? tr('Sospeso: fuori dalla mappa finché non si riattiva') : tr('Pubblicato')) : ''}</p></div>${chiudiBtn('pubblica')}</div>`;
  if(!x) return foglio('forte', testa, `<p class="meta">${tr('L’evento non c’è più nell’archivio: aggiorna l’elenco.')}</p>`);
  const ev = x.ev || {id:PB.sel, titolo:'', luogo:'', indirizzo:'', inizio:'', fonte:{}}, R = PB.ritiro, chiaro = x.nascosto ? NR.chiari.get(PB.sel) : null;
  const ritiro = !R ? '' : `<div class="red-riquadro"><b>${tr('Ritiro prima della fine')}</b>
      <label class="etich" for="pb-motivo">${tr('Motivo')}</label><div class="campo"><select id="pb-motivo" data-pbritiro="motivo"><option value="">${tr('— Scegli —')}</option>${Object.keys(MOTIVI_RITIRO).map(k => `<option value="${k}" ${R.motivo===k?'selected':''}>${esc(tr(MOTIVI_RITIRO[k]))}</option>`).join('')}</select></div>
      <label class="etich" for="pb-rif">${tr('Voce del registro')} <span class="fac">${tr('facoltativo')}</span></label><div class="campo"><input id="pb-rif" data-pbritiro="riferimento" maxlength="40" value="${esc(R.riferimento)}" autocomplete="off"></div>
      <span class="meta">${tr('Il motivo resta nella copia datata dello storico e passerà al registro delle fonti.')}</span>
      <div class="tasti"><button class="tasto sec" data-az="pb-ritira-no">${tr('Annulla')}</button><button class="tasto pericolo" data-az="pb-ritira-ok">${tr('Ritira l’evento')}</button></div></div>`;
  const corpo = `${x.ev ? `<p class="meta">${esc(quandoEv(ev))}${ev.fine?' → '+esc(giornoOra(ev.fine)):''}<br>${esc(ev.luogo)} · ${esc(ev.indirizzo)}<br>${tr('Fonte')}: ${esc(ev.fonte && ev.fonte.testo)}</p>`
      : `<p class="meta">${tr('La password di questo evento non è nella cassaforte di questo dispositivo: lo sportello lo conosce solo cifrato. Si può sospendere, riattivare o ritirare, non correggere. Esce dall’archivio dopo il {g}.',{g:esc(x.voce.giorno)})}</p>`}
    <p class="meta">${tr('Identificativo')}: <code class="red-id">${esc(ev.id)}</code></p>
    ${chiaro ? riquadroPassword(ev.id, ev.titolo, chiaro.pw, tr('Password dell’evento nascosto')) : ''}
    ${statoPb()}
    <div class="tasti">${x.ev ? `<button class="tasto sec" data-az="pb-correggi">${tr('Correggi')}</button>` : ''}${x.sospeso ? `<button class="tasto pri" data-az="pb-riattiva">${tr('Riattiva')}</button>` : `<button class="tasto sec" data-az="pb-sospendi">${tr('Sospendi')}</button>`}</div>
    <p class="meta">${x.sospeso ? tr('Riattivato, torna sulla mappa con una nuova pubblicazione firmata.') : tr('Sospeso, esce dalla mappa finché una verifica è in corso; resta nell’elenco riservato dello sportello e si può riattivare.')}</p>
    ${R ? ritiro : `<button class="tasto pericolo pieno" data-az="pb-ritira">${tr('Ritira prima della fine')}</button>`}`;
  return foglio('forte alto', testa, corpo);
}

/* ---------- Il modulo dell'evento: i campi del formato pubblico ---------- */
function apriEventoForm(ev, per, nasc){
  st.aform = ev ? {per, id:ev.id, titolo:ev.titolo||'', strato:ev.strato||'', sub:ev.sottostrato||'', tema:ev.tema||'', inizio:ev.inizio||'', fine:ev.fine||(ev.durata && FORMATO.fineMs(ev)!=null ? dtLocal(new Date(FORMATO.fineMs(ev))) : ''),
      luogo:ev.luogo||'', indirizzo:ev.indirizzo||'', addrFull:ev.indirizzo||'', pos:{lat:ev.lat, lng:ev.lng}, precision:ev.collocazione==='a_mano'?'map':'exact', hn:'', comeArrivare:ev.descrizione_luogo||'', organizzatore:ev.organizzatore||'',
      desc:ev.descrizione||'', prezzo:ev.prezzo||'', fonte:(ev.fonte||{}).testo||'', fonteLink:(ev.fonte||{}).collegamento||'', err:{}, errori:[]}
    : {per, id:null, titolo:'', strato:'', sub:'', tema:'', inizio:'', fine:'', luogo:'', indirizzo:'', addrFull:'', pos:null, precision:'', hn:'', comeArrivare:'', organizzatore:'', desc:'', prezzo:'', fonte:'', fonteLink:'', err:{}, errori:[]};
  /* le colonne di giudizio: vuote per un evento nuovo; per una correzione, quelle della riga già scritta nel registro
     di questo dispositivo, se c'è */
  const f = st.aform; f.g = giudizioNuovo(); f.prep = null;
  /* un evento nascosto da correggere arriva con la sua password (T-045): resta la stessa */
  f.nascosto = nasc ? '1' : ''; f.pw = nasc ? nasc.pw : '';
  st.sel = null; st.form = null; apri('aform');
  if(per!=='ripristino') regApri().then(() => { if(st.aform!==f) return; const r = f.id ? regRiga(f.id) : null; if(r) f.g = giudizioInForma(r.g); if(st.foglio==='aform') disegnaFoglio(); });
}
const dtLocal = d => ymd(d)+'T'+hm(d);
function fEventoForm(){
  const f = st.aform, E = f.err, l = S[f.strato], ripr = f.per==='ripristino', imp = f.per==='importa';
  const campo = (id, lab, html, err, fac) => `<div class="stack-s"><label class="etich" for="${id}">${lab}${fac?` <span class="fac">${fac}</span>`:''}</label>${html}${err?`<span class="err">${err}</span>`:''}</div>`;
  const riga = (id, c, lab, max, segna, fac, tipo) => campo(id, lab, `<div class="campo${E[c]?' errore':''}"><input id="${id}" data-acampo="${c}" maxlength="${max}" value="${esc(f[c])}" placeholder="${esc(segna||'')}" autocomplete="off"${tipo?` type="${tipo}" inputmode="${tipo}"`:''}></div>`, '', fac);
  const fac = tr('facoltativo');
  const testa = `<div class="riga-titolo"><div><h2>${imp ? tr('Riga {r} del file',{r:f.imp}) : f.id ? tr('Correggi l’evento') : tr('Nuovo evento')}</h2><p class="meta">${ripr ? tr('Nella copia da ripristinare: si pubblica con la copia') : imp ? tr('Dall’importazione: si pubblica con le altre righe segnate') : tr('Redazione · si pubblica con la firma di questo dispositivo')}</p></div>${chiudiBtn(ripr ? 'pb-copia' : imp ? 'ix-torna' : 'pubblica')}</div>`;
  const corpo = `
    ${f.per==='pubblica' ? casellaNascosto(f) : ''}
    ${riga('a-titolo', 'titolo', tr('Titolo'), 100, tr('Nome dell’evento'))}
    <div class="due">${campo('a-strato', tr('Strato'), `<div class="campo${E.strato?' errore':''}"><select id="a-strato" data-acampo="strato"><option value="">${tr('— Scegli —')}</option>${LAYERS.map(x => `<option value="${x.id}" ${f.strato===x.id?'selected':''}>${esc(tr(x.label))}</option>`).join('')}</select></div>`)}
      ${campo('a-sub', tr('Sottostrato'), `<div class="campo${l?'':' spento'}"><select id="a-sub" data-acampo="sub" ${l?'':'disabled'}><option value="">${tr('— Nessuno —')}</option>${l?l.sub.map(s => `<option value="${s.id}" ${f.sub===s.id?'selected':''}>${esc(tr(s.label))}</option>`).join(''):''}</select></div>`, '', fac)}</div>
    ${campo('a-tema', tr('Tema'), `<div class="campo"><select id="a-tema" data-acampo="tema"><option value="">${tr('— Nessuno —')}</option>${TEMI_VOC.map(t => `<option value="${esc(t)}" ${f.tema===t?'selected':''}>${esc(tr(t))}</option>`).join('')}</select></div>`, '', fac)}
    <div class="due">${campo('a-inizio', tr('Inizio'), `<div class="campo${E.inizio?' errore':''}"><input id="a-inizio" type="datetime-local" data-acampo="inizio" value="${esc(f.inizio)}"></div>`)}
      ${campo('a-fine', tr('Fine'), `<div class="campo${E.fine?' errore':''}"><input id="a-fine" type="datetime-local" data-acampo="fine" value="${esc(f.fine)}"></div>`, '', fac)}</div>
    <p class="meta">${tr('Ora italiana, come la legge chi va all’evento.')}</p>
    ${riga('a-luogo', 'luogo', tr('Luogo'), 120, tr('Nome del luogo, es. Sala del quartiere'))}
    ${campo('a-indirizzo', tr('Indirizzo'), `<div class="campo${E.indirizzo?' errore':''}">${icoLuogo}<input id="a-indirizzo" data-acampo="indirizzo" maxlength="200" value="${esc(f.indirizzo)}" placeholder="${esc(tr('Via e numero civico, città'))}" autocomplete="off"></div><div id="a-sugg"></div><div id="a-punto">${boxPunto(f)}</div><button class="link" data-az="scegli-mappa-a">${tr('Scegli sulla mappa')}</button>`,
      E.indirizzo===2 ? tr('Indirizzo non trovato: correggilo o scegli il punto sulla mappa') : E.indirizzo ? tr('Scrivi l’indirizzo o scegli il punto sulla mappa') : '')}
    ${campo('a-come', tr('Come arrivare'), `<div class="campo${E.comeArrivare?' errore':''}"><textarea id="a-come" data-acampo="comeArrivare" maxlength="300" placeholder="${esc(tr('Come si raggiunge il luogo, a parole'))}">${esc(f.comeArrivare)}</textarea></div>`, '', fac)}
    ${riga('a-org', 'organizzatore', tr('Organizza'), 120, '', fac)}
    ${campo('a-desc', tr('Descrizione'), `<div class="campo${E.desc?' errore':''}"><textarea id="a-desc" data-acampo="desc" maxlength="2000" placeholder="${esc(tr('Descrivi l’evento…'))}">${esc(f.desc)}</textarea></div>`)}
    ${riga('a-prezzo', 'prezzo', tr('Prezzo indicato dalla fonte'), 80, tr('Gratuito / 10 €'), fac)}
    ${f.testoCal ? `<details class="g-regole" open><summary>${tr('Il testo del calendario del Comune: da riscrivere, non si pubblica')}</summary><p class="meta ix-testo-cal">${esc(f.testoCal)}</p></details>` : ''}
    ${riga('a-fonte', 'fonte', tr('Fonte'), 160, tr('Da dove viene l’informazione'))}
    ${riga('a-fonte-link', 'fonteLink', tr('Collegamento alla pagina dell’evento'), 500, 'https://', fac, 'url')}
    ${ripr ? '' : schedaGiudizio(f)}
    ${f.errori.length ? `<div class="red-riquadro pb-errori" role="alert"><b>${f.errori.length===1 ? tr('Prima di pubblicare manca una cosa:') : tr('Prima di pubblicare mancano {n} cose:',{n:f.errori.length})}</b>${f.errori.map(x => `<span class="err">${esc(x)}</span>`).join('')}</div>` : ''}
    ${statoPb()}
    <div class="tasti"><button class="tasto sec" data-az="${ripr ? 'pb-copia' : imp ? 'ix-torna' : 'pubblica'}">${tr('Annulla')}</button>${ripr || f.id ? '' : `<button class="tasto sec" data-az="g-prepara">${tr('Salva tra i preparati')}</button>`}<button class="tasto pri" data-az="a-pubblica" ${!ripr && giudizioManca(f).length ? 'disabled' : ''}>${ripr ? tr('Tieni nella copia') : imp ? tr('Tieni nell’importazione') : f.id ? tr('Pubblica la correzione') : tr('Pubblica')}</button></div>
    ${ripr ? '' : spiaHtml(f)}`;
  return foglio('forte alto', testa, corpo);
}
const sei = x => Math.round(x*1e6)/1e6;
function eventoDalForm(f, id){
  const ev = {id, titolo:f.titolo.trim(), strato:f.strato}, se = (k, v) => { v = String(v||'').trim(); if(v) ev[k] = v; };
  se('sottostrato', f.sub); se('tema', f.tema); ev.inizio = f.inizio; se('fine', f.fine);
  ev.luogo = f.luogo.trim(); ev.indirizzo = String(f.addrFull||f.indirizzo).trim().slice(0, 200); ev.collocazione = f.precision==='map' ? 'a_mano' : 'indirizzo';
  se('descrizione_luogo', f.comeArrivare); ev.lat = sei(f.pos.lat); ev.lng = sei(f.pos.lng); se('organizzatore', f.organizzatore);
  ev.descrizione = f.desc.trim(); se('prezzo', f.prezzo);
  ev.fonte = {testo:f.fonte.trim()}; if(f.fonteLink.trim()) ev.fonte.collegamento = f.fonteLink.trim();
  ev.modificato = new Date().toISOString().slice(0,19)+'Z';
  return ev;
}
/* un errore del controllo del formato, con il nome del campo come lo vede la Redazione al posto del nome tecnico */
const CAMPI_PB = {titolo:'Titolo', strato:'Strato', sottostrato:'Sottostrato', tema:'Tema', inizio:'Inizio', fine:'Fine', luogo:'Luogo', indirizzo:'Indirizzo',
  descrizione_luogo:'Come arrivare', organizzatore:'Organizza', descrizione:'Descrizione', prezzo:'Prezzo indicato dalla fonte', 'fonte.testo':'Fonte', 'fonte.collegamento':'Collegamento alla pagina dell’evento', 'lat e lng':'Punto sulla mappa'};
const erroreCampoPb = x => { const m = String(x).match(/^([a-z_.]+(?: e [a-z]+)?): (.*)$/); return m && CAMPI_PB[m[1]] ? tr(CAMPI_PB[m[1]])+': '+m[2] : String(x); };
/* porta in vista l'elenco degli errori, accanto a «Pubblica» */
function mostraErroriPb(){ const c = document.querySelector('#foglio-slot .pb-errori') || document.querySelector('#foglio-slot .errore'); if(c && c.scrollIntoView) c.scrollIntoView({block:'center', behavior:'smooth'}); }
function pubblicaForm(){
  const f = st.aform; if(!f || PB.lavoro) return;
  f.err = {}; f.errori = []; PB.errore = '';
  const voc = {vocabolario:FORMATO.vocabolario(LAYERS, TEMI_VOC)};
  /* prima i controlli con parole semplici, campo per campo: il campo sbagliato si colora e il messaggio dice che cosa scrivere */
  const vuoto = c => !String(f[c]||'').trim(), metti = (c, msg) => { f.err[c] = 1; f.errori.push(msg); };
  if(vuoto('titolo')) metti('titolo', tr('Titolo: scrivi il nome dell’evento.'));
  if(!f.strato) metti('strato', tr('Strato: scegline uno.'));
  if(vuoto('inizio')) metti('inizio', tr('Inizio: scegli il giorno e l’ora.'));
  else if(f.fine && f.fine <= f.inizio) metti('fine', tr('Fine: deve venire dopo l’inizio (oppure lasciala vuota).'));
  if(vuoto('luogo')) metti('luogo', tr('Luogo: scrivi il nome del luogo, per esempio «Sala del quartiere».'));
  if(vuoto('desc')) metti('desc', tr('Descrizione: scrivi di che cosa si tratta.'));
  if(vuoto('fonte')) metti('fonte', tr('Fonte: scrivi da dove viene l’informazione, per esempio il nome del sito o di chi organizza.'));
  if(!vuoto('fonteLink') && !/^https:\/\//i.test(f.fonteLink.trim())) metti('fonteLink', tr('Collegamento alla pagina dell’evento: deve cominciare con https:// (oppure lascialo vuoto).'));
  if(!f.pos && f.indirizzo.trim().length<3) metti('indirizzo', tr('Indirizzo: scrivilo e scegli uno dei suggerimenti, oppure scegli il punto con «Scegli sulla mappa».'));
  if(f.errori.length){ disegnaFoglio(); mostraErroriPb(); return; }
  if(!f.pos){
    const q = f.indirizzo.trim();
    const b = $('a-punto'); if(b) b.innerHTML = `<p class="caricamento">${tr('Cerco l’indirizzo…')}</p>`;
    lookup(parseAddr(q).city ? q : q+', '+cittaObj().n).then(res => { if(st.aform!==f) return;
      if(res.list.length){ const r = res.list[0]; f.indirizzo = testoRisultato(r); f.addrFull = f.indirizzo; f.precision = r.precision||'exact'; f.hn = r.hn||''; f.pos = {lat:r.lat, lng:r.lng}; f.errori = [tr('Ho trovato l’indirizzo: controlla il punto e tocca di nuovo «Pubblica».')]; }
      else f.err.indirizzo = 2;
      disegnaFoglio(); });
    return;
  }
  const con = id => {
    const ev = eventoDalForm(f, id), errori = FORMATO.controlla(ev, voc).map(erroreCampoPb);
    if(!errori.length && FORMATO.uscitaMs(ev) <= Date.now()) errori.push(tr('L’evento è già finito da più di tre ore: non si pubblica.'));
    if(errori.length){ f.errori = errori; disegnaFoglio(); mostraErroriPb(); return; }
    /* senza le colonne di giudizio non si pubblica (cap. 22, regola 1): il tasto è spento, e qui si ricontrolla */
    if(f.per!=='ripristino'){ const manca = giudizioManca(f); if(manca.length){ f.errori = [testoSpia(manca)]; disegnaFoglio(); mostraErroriPb(); return; } }
    if(f.per==='importa'){ tieniNellImportazione(f); return; }
    if(f.per==='ripristino'){ const R = PB.ripr; if(R){ const i = R.eventi.findIndex(x => x.id===ev.id), j = R.sospesi.findIndex(x => x.id===ev.id); if(i>=0) R.eventi[i] = ev; else if(j>=0) R.sospesi[j] = ev; R.corretti++; } st.aform = null; apri('pb-copia'); return; }
    if(f.nascosto){ pubblicaNascosto(f, ev); return; }   /* evento nascosto: cifrato su questo dispositivo (eventi-nascosti.js) */
    const nuovo = !f.id, g = f.g, prepScheda = f.prep;
    /* la riga del registro delle fonti parte cifrata nello stesso pacchetto dell'evento (§ 3.4; cap. 22): se lo sportello
       rifiuta, la riga non nasce */
    regPrepara([{ev, g, titolo:g.nomi==='si' && g.titoloReg.trim() ? g.titoloReg.trim() : ev.titolo, canale:'singolo', correzione:!nuovo}]).then(rp =>
      scriviPb(conRegistro({operazione:'scrivi', pubblica:[ev]}, rp), r => { st.aform = null; st.ultimoId = ev.id; registra(nuovo ? 'pubblica' : 'correggi', {id:ev.id, s:ev.strato}); if(!nuovo) misureConta('corretti');
        const codici = (r.registro||{}).codici, codice = (codici||{})[ev.id] || '';
        regConferma(rp, codici).then(() => prepScheda ? togliPreparato(prepScheda) : null)
          .catch(() => { PB.errore = tr('L’evento è pubblicato e la riga {c} è allo sportello, ma non sono riuscito a salvarla nel registro di questo dispositivo.',{c:codice}); ridisegnaPb(); });
        return (nuovo ? tr('Pubblicato alle {o} (ora dello sportello).',{o:oraPb(r.quando)}) : tr('Correzione pubblicata alle {o} (ora dello sportello).',{o:oraPb(r.quando)}))
          + (codice ? ' '+tr('Riga {c} nel registro delle fonti.',{c:codice}) : ''); }),
      () => { f.errori = [tr('Non sono riuscito a preparare la riga del registro delle fonti: non pubblico.')]; disegnaFoglio(); });
  };
  if(f.id) con(f.id);
  else if(f.per==='importa') con(ID_PROVVISORIO);   /* l'identificativo vero nasce alla pubblicazione delle righe segnate */
  else CHIAVI.nuovoId().then(id => { if(st.aform===f) con(id); }, () => { if(st.aform===f){ f.errori = [tr('Per pubblicare servono le chiavi della Redazione: Strumenti della redazione → Chiavi.')]; disegnaFoglio(); } });
}

/* ---------- Storico delle pubblicazioni: elenco, confronto, ripristino (T-039) ---------- */
function riepilogoPb(x){
  if(x.operazione==='ripristina') return tr('Ripristino di una copia');
  const r = x.riepilogo||{}, n = k => Array.isArray(r[k]) ? r[k].length : (r[k]||0);
  const p = [[n('pubblicati'), tr('pubblicati')], [n('corretti'), tr('corretti')], [n('sospesi'), tr('sospesi')], [n('riattivati'), tr('riattivati')], [n('ritirati'), tr('ritirati')]].filter(y => y[0]).map(y => y[0]+' '+y[1]);
  return p.join(', ') || tr('Nessuna modifica');
}
function apriStoricoPb(){
  PB.copie = null; PB.scelte = []; PB.confronto = null; PB.errore = ''; PB.msg = ''; apri('pb-storico');
  SPORTELLO.chiedi({operazione:'storico'}).then(r => { PB.copie = r.copie||[]; }, e => { PB.copie = []; PB.errore = errorePb(e); }).then(ridisegnaPb);
}
function fPbStorico(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Storico delle pubblicazioni')}</h2><p class="meta">${tr('Una copia datata per ogni pubblicazione')}</p></div>${chiudiBtn('pubblica')}</div>`;
  const C = PB.confronto;
  const gruppo = (tit, l) => l.length ? `<p class="etich">${tit} · ${l.length}</p><div class="imp-righe">${l.map(x => `<div>${esc(x.e.titolo)} · ${esc(quandoEv(x.e))}${x.sos?' · '+tr('sospeso'):''}</div>`).join('')}</div>` : '';
  const confronto = !C ? '' : `<div class="red-riquadro"><b>${tr('Dalla copia del {a} a quella del {b}',{a:esc(quandoPb(C.a.quando)), b:esc(quandoPb(C.b.quando))})}</b>
      ${gruppo(tr('Aggiunti'), C.aggiunti)}${gruppo(tr('Tolti'), C.tolti)}${gruppo(tr('Cambiati'), C.cambiati)}
      ${C.aggiunti.length+C.tolti.length+C.cambiati.length ? '' : `<span class="meta">${tr('Le due copie hanno gli stessi eventi.')}</span>`}</div>`;
  const corpo = `${statoPb()}
    ${!PB.copie ? `<p class="caricamento">${tr('Chiedo lo storico allo sportello…')}</p>` : !PB.copie.length ? `<p class="meta">${tr('Non c’è ancora nessuna copia: nasce con la prima pubblicazione.')}</p>`
      : `<p class="meta">${tr('Tocca una copia per ripristinarla, due per confrontarle.')}</p><div class="menu-lista">${PB.copie.map(x => `<button class="menu-r" data-pbcopia="${esc(x.nome)}" aria-pressed="${PB.scelte.includes(x.nome)}"><span class="casella" aria-hidden="true"></span><div><span class="t">${esc(quandoPb(x.quando))}</span><span class="meta">${esc(riepilogoPb(x))} · ${tr('{n} eventi',{n:x.eventi})} · ${esc((x.dispositivo||{}).nome||'')}${x.scaduta?' · '+tr('più di cinque anni'):''}</span></div></button>`).join('')}</div>`}
    <div class="tasti"><button class="tasto sec" data-az="pb-confronta" ${PB.scelte.length===2?'':'disabled'}>${tr('Confronta')}</button><button class="tasto sec" data-az="pb-ripristina" ${PB.scelte.length===1?'':'disabled'}>${tr('Ripristina…')}</button></div>
    ${confronto}`;
  return foglio('forte alto', testa, corpo);
}
function confrontaCopie(a, b){
  /* gli eventi nascosti si confrontano sul file cifrato; il titolo si vede se questo dispositivo ne ha la password */
  const nas = (x, sos) => { const c = NR.chiari.get(x.id); return [x.id, {e:{id:x.id, titolo:c ? c.ev.titolo : tr('Evento nascosto'), inizio:c ? c.ev.inizio : '', file:x.file}, sos}]; };
  const m = k => new Map(k.eventi.map(e => [e.id, {e, sos:false}]).concat(k.sospesi.map(e => [e.id, {e, sos:true}]), (k.nascosti||[]).map(x => nas(x, false)), (k.nascostiSospesi||[]).map(x => nas(x, true))));
  const A = m(a), B = m(b), solo = (X, Y) => [...X].filter(([id]) => !Y.has(id)).map(([, x]) => x);
  return {a, b, tolti:solo(A, B), aggiunti:solo(B, A), cambiati:[...B].filter(([id, x]) => A.has(id) && (JSON.stringify(A.get(id).e)!==JSON.stringify(x.e) || A.get(id).sos!==x.sos)).map(([, x]) => x)};
}
const leggiCopiaPb = nome => SPORTELLO.chiedi({operazione:'copia', nome}).then(r => r.copia);
/* le richieste di rimozione registrate nelle Misure (scheda «Rete») dopo la data della copia: date, ore e codice R della
   richiesta, senza nomi (§ 3.13, passo 4; decisione del 26/11/2026, n. 13: i nomi si riprendono dall'anagrafica) */
const rimozioniDopo = iso => (mz().rimozioni||[]).filter(r => r && r.ric && new Date(r.ric).getTime() > Date.parse(iso)).map(r => ({ric:r.ric, r:r.r||''})).sort((a, b) => a.ric<b.ric?-1:1);
/* le richieste dopo la copia non ancora segnate come ripetute: finché ce n'è una, la copia non si ripubblica */
const riprMancano = R => R.rimozioni.some((x, k) => !R.fatte[k]);
function fPbCopia(){
  const R = PB.ripr;
  const testa = `<div class="riga-titolo"><div><h2>${tr('Ripristina una copia')}</h2><p class="meta">${R ? tr('Copia del {q}',{q:esc(quandoPb(R.copia.quando))}) : ''}</p></div>${chiudiBtn('pb-storico')}</div>`;
  if(!R) return foglio('forte', testa, `<p class="caricamento">${tr('Leggo la copia…')}</p>${statoPb()}`);
  const rim = R.rimozioni;
  const promemoria = rim.length ? `<div class="red-riquadro" role="note"><b>${rim.length===1 ? tr('Dopo questa copia è stata chiesta 1 rimozione.') : tr('Dopo questa copia sono state chieste {n} rimozioni.',{n:rim.length})}</b>
      <span class="meta">${tr('Prima di ripubblicare vanno ripetute in questa copia, una per una. Per togliere un nome: «Togli il nome da questa copia», con il nome che trovi nell’anagrafica sotto il codice della richiesta. Per togliere un evento: «Togli» nell’elenco qui sotto. Poi segna la richiesta come ripetuta.')}</span>
      ${rim.map((x, k) => `<div class="pb-ripr-rich"><span class="t">${x.r ? esc(x.r)+' · ' : ''}${tr('ricevuta il {q}',{q:esc(quandoPb(x.ric))})}</span>
        <button class="link" data-az="tn-copia" data-k="${k}">${tr('Togli il nome da questa copia')}</button>
        <button class="riga-int" data-az="pb-ripr-fatto" data-k="${k}" aria-pressed="${!!R.fatte[k]}"><span class="casella" aria-hidden="true"></span><div><span class="t">${tr('Ripetuta in questa copia')}</span></div></button></div>`).join('')}</div>`
    : `<p class="meta">${tr('Nel registro delle richieste di rimozione (Misure → Rete) non ce ne sono dopo la data di questa copia. Se ne hai ricevute e non le hai registrate, ripetile prima di ripubblicare.')}</p>`;
  const righe = (l, nota) => l.map(ev => `<div class="menu-r" style="cursor:default"><div><span class="t">${esc(ev.titolo)}</span><span class="meta">${esc(quandoEv(ev))} · ${esc(ev.luogo)}${nota?' · '+nota:''}</span></div><button class="link" data-az="pb-ripr-correggi" data-id="${esc(ev.id)}">${tr('Correggi')}</button><button class="link" data-az="pb-ripr-togli" data-id="${esc(ev.id)}">${tr('Togli')}</button></div>`).join('');
  const corpo = `<p>${tr('L’archivio torna com’era in questa copia: {n} eventi ancora da svolgere{s}. Quelli già finiti non tornano ({f}).',{n:R.eventi.length, s:R.sospesi.length ? ', '+tr('più {k} sospesi',{k:R.sospesi.length}) : '', f:R.finiti})}</p>
    ${promemoria}
    ${R.eventi.length+R.sospesi.length ? `<div class="menu-lista">${righe(R.eventi)}${righe(R.sospesi, tr('sospeso'))}</div>` : ''}
    ${R.nascosti.length+R.nascostiSospesi.length ? `<p class="etich">${tr('Nascosti')} · ${R.nascosti.length+R.nascostiSospesi.length}</p>
      <p class="meta">${tr('Tornano così come sono nella copia, cifrati: si possono soltanto togliere. Se uno porta un nome di cui è stata chiesta la rimozione, toglilo qui e correggilo dopo il ripristino.')}</p>
      <div class="menu-lista">${R.nascosti.map(x => [x, false]).concat(R.nascostiSospesi.map(x => [x, true])).map(([x, sos]) => { const c = NR.chiari.get(x.id);
        return `<div class="menu-r" style="cursor:default"><div><span class="t">${c ? esc(c.ev.titolo) : tr('Evento nascosto')}</span><span class="meta">${c ? esc(quandoEv(c.ev))+' · ' : ''}${tr('nascosto')}${sos?' · '+tr('sospeso'):''}</span></div><button class="link" data-az="pb-ripr-togli" data-id="${esc(x.id)}">${tr('Togli')}</button></div>`; }).join('')}</div>` : ''}
    ${statoPb()}
    <div class="tasti"><button class="tasto sec" data-az="pb-storico">${tr('Annulla')}</button><button class="tasto pri" data-az="pb-ripr-ok" ${riprMancano(R) ? 'disabled' : ''}>${tr('Ripubblica questa copia')}</button></div>`;
  return foglio('forte alto', testa, corpo);
}

/* ---------- Tocchi e comandi ---------- */
function clickPubblica(t){
  const d = t.dataset;
  if(clickScheda(t) || clickRegistro(t)) return true;
  if(d.pbev){ PB.sel = d.pbev; PB.ritiro = null; PB.errore = ''; PB.msg = ''; apri('pb-evento'); return true; }
  if(d.pbcopia){ const i = PB.scelte.indexOf(d.pbcopia); if(i>=0) PB.scelte.splice(i, 1); else { PB.scelte.push(d.pbcopia); if(PB.scelte.length>2) PB.scelte.shift(); } PB.confronto = null; disegnaFoglio(); return true; }
  return false;
}
function azionePubblica(az, t){
  const x = PB.sel ? evPb(PB.sel) : null, prova = SPORTELLO.prova;
  const esito = (p, bene) => { PB.lavoro = true; PB.errore = ''; PB.msg = ''; ridisegnaPb(); return p.then(r => { PB.lavoro = false; PB.msg = bene(r); }, e => { PB.lavoro = false; PB.errore = errorePb(e); }).then(aggiornaPb); };
  switch(az){
    case 'pubblica': st.aform = null; PB.svuota = false; PB.togliPrep = null; if(st.sezione!=='mappa') vaiSezione('mappa'); apri('pubblica'); aggiornaPb(); regApri().then(ridisegnaPb); break;
    case 'pb-aggiorna': PB.msg = ''; aggiornaPb(); break;
    case 'pb-nuovo': PB.errore = ''; PB.msg = ''; apriEventoForm(null, 'pubblica'); break;
    case 'a-pubblica': pubblicaForm(); break;
    case 'pb-consegna': esito(prova.consegnaChiavi(), () => tr('Chiavi consegnate: lo sportello di prova ora accetta la firma di questo dispositivo.')); break;
    case 'pb-venti': esito(prova.eventiDelRepository().then(ev => SPORTELLO.chiedi({operazione:'scrivi', pubblica:ev})), r => tr('Portati {n} eventi inventati, pubblicati alle {o}.',{n:r.riepilogo.pubblicati.length+r.riepilogo.corretti.length, o:oraPb(r.quando)})); break;
    case 'pb-falsa': esito(prova.firmaSbagliata().then(r => r), r => r.stato===200 ? tr('Attenzione: lo sportello ha accettato un pacchetto con la firma sbagliata.') : r.corpo.motivo==='fermo' ? tr('Rifiutato: troppe firme sbagliate, lo sportello non risponde a questo dispositivo fino alle {o}.',{o:oraPb(r.corpo.fino)}) : tr('Rifiutato dallo sportello (motivo: {m}). Dopo cinque firme sbagliate in un quarto d’ora smette di rispondere a questo dispositivo per quindici minuti.',{m:r.corpo.motivo})); break;
    case 'pb-svuota': if(!PB.svuota){ PB.svuota = true; disegnaFoglio(); break; } PB.svuota = false; PB.stato = null; esito(prova.svuota(), () => tr('Sportello di prova svuotato.')); break;
    case 'pb-correggi': if(x && x.ev){ PB.errore = ''; PB.msg = ''; apriEventoForm(x.ev, 'pubblica', x.nascosto ? {pw:NR.chiari.get(PB.sel).pw} : null); } break;
    case 'pb-sospendi': if(x) scriviPb({operazione:'scrivi', sospendi:[PB.sel]}, r => { registra('sospendi', {id:PB.sel, s:(x.ev||{}).strato||''}); return tr('Sospeso alle {o}: non è più sulla mappa.',{o:oraPb(r.quando)}); }); break;
    case 'pb-riattiva': if(x) scriviPb({operazione:'scrivi', riattiva:[PB.sel]}, r => { registra('riattiva', {id:PB.sel, s:(x.ev||{}).strato||''}); return tr('Riattivato alle {o}: è di nuovo sulla mappa.',{o:oraPb(r.quando)}); }); break;
    case 'pb-ritira': PB.ritiro = {motivo:'', riferimento:''}; PB.errore = ''; disegnaFoglio(); break;
    case 'pb-ritira-no': PB.ritiro = null; PB.errore = ''; disegnaFoglio(); break;
    case 'pb-ritira-ok': { const R = PB.ritiro; if(!x || !R) break;
      if(!MOTIVI_RITIRO[R.motivo]){ PB.errore = tr('Scegli il motivo del ritiro.'); disegnaFoglio(); break; }
      const rit = {id:PB.sel, motivo:R.motivo}; if(R.riferimento.trim()) rit.riferimento = R.riferimento.trim();
      /* data e motivo del ritiro passano alla riga del registro delle fonti, se sta su questo dispositivo (cap. 22,
         «Ritiro prima della fine»), nello stesso pacchetto; il motivo resta comunque nella copia datata dello storico */
      regApri().then(() => REG.stato==='aperto' ? regPrepara([{id:rit.id, ritiro:rit.motivo, riferimento:rit.riferimento}]) : null).catch(() => null).then(rp => {
        const c = conRegistro({operazione:'scrivi', ritira:[rit]}, rp);
        scriviPb(c, r => { registra('ritira', {id:rit.id, s:(x.ev||{}).strato||'', m:R.motivo}); misureConta('rimossi'); regConferma(rp, (r.registro||{}).codici).catch(() => {});
          return tr('Ritirato alle {o}.',{o:oraPb(r.quando)}); }); }); break; }
    case 'pb-storico': apriStoricoPb(); break;
    case 'pb-confronta': { if(PB.scelte.length!==2) break; PB.errore = '';
      Promise.all(PB.scelte.map(leggiCopiaPb)).then(k => { k.sort((a,b) => a.quando<b.quando?-1:1); PB.confronto = confrontaCopie(k[0], k[1]); }, e => { PB.errore = errorePb(e); }).then(ridisegnaPb); break; }
    case 'pb-ripristina': { if(PB.scelte.length!==1) break; PB.ripr = null; PB.errore = ''; PB.msg = ''; apri('pb-copia');
      leggiCopiaPb(PB.scelte[0]).then(k => { const vivo = e => FORMATO.uscitaMs(e) > Date.now(), ordine = (x, y) => x.inizio<y.inizio?-1:1, ev = k.eventi.filter(vivo).sort(ordine), sos = k.sospesi.filter(vivo).sort(ordine);
        /* gli eventi nascosti della copia tornano così come sono, cifrati (T-045): si possono soltanto togliere */
        const vivoN = x => MODULI.nascosti.vivo(x.giorno, Date.now()), nas = (k.nascosti||[]).filter(vivoN), nsos = (k.nascostiSospesi||[]).filter(vivoN);
        PB.ripr = {copia:k, eventi:ev, sospesi:sos, nascosti:nas, nascostiSospesi:nsos, finiti:k.eventi.length+k.sospesi.length-ev.length-sos.length, rimozioni:rimozioniDopo(k.quando), fatte:[], corretti:0};
        return nrDecifra(nas.concat(nsos)); }, e => { PB.errore = errorePb(e); }).then(ridisegnaPb); break; }
    case 'pb-copia': st.aform = null; apri('pb-copia'); break;
    case 'pb-ripr-fatto': { const R = PB.ripr, k = +t.dataset.k; if(R && R.rimozioni[k]){ R.fatte[k] = !R.fatte[k]; disegnaFoglio(); } break; }
    case 'pb-ripr-correggi': { const R = PB.ripr, ev = R && R.eventi.concat(R.sospesi).find(e => e.id===t.dataset.id); if(ev) apriEventoForm(ev, 'ripristino'); break; }
    case 'pb-ripr-togli': { const R = PB.ripr, via = x => x.id!==t.dataset.id; if(R){ R.eventi = R.eventi.filter(via); R.sospesi = R.sospesi.filter(via); R.nascosti = R.nascosti.filter(via); R.nascostiSospesi = R.nascostiSospesi.filter(via); disegnaFoglio(); } break; }
    case 'pb-ripr-ok': { const R = PB.ripr; if(!R || riprMancano(R)) break;
      scriviPb({operazione:'ripristina', da:R.copia.nome, eventi:R.eventi, sospesi:R.sospesi, nascosti:R.nascosti, nascostiSospesi:R.nascostiSospesi}, r => { registra('ripristina-copia', {n:r.eventi}); PB.ripr = null; return tr('Copia ripristinata e pubblicata alle {o}: {n} eventi.',{o:oraPb(r.quando), n:r.eventi}) + (r.nascosti ? ' '+tr('Più {k} eventi nascosti.',{k:r.nascosti}) : ''); }); break; }
    case 'ix-torna': st.aform = null; apri('pb-importa'); break;
    default: return azioneNascosti(az, t) || azioneScheda(az, t) || azioneImporta(az, t) || azioneRegistro(az, t) || azioneCalendari(az, t);
  }
  return true;
}
/* i campi del modulo dell'evento e del ritiro: true se il campo era loro */
function inputPubblica(el){
  const d = el.dataset;
  if(inputScheda(el)) return true;
  if(d.pbritiro && PB.ritiro){ PB.ritiro[d.pbritiro] = el.value; return true; }
  if(d.acampo && st.aform){
    const c = d.acampo, f = st.aform; f[c] = el.value;
    if(c==='indirizzo'){ f.pos = null; f.precision = ''; f.addrFull = ''; $('a-punto').innerHTML = ''; chiediSuggerimenti(el.value, 'a', 'a-sugg'); }
    if(f.err[c] && String(el.value).trim()){ f.err[c] = 0; const k = el.closest('.campo'); if(k) k.classList.remove('errore'); }
    aggiornaSpia();
    return true;
  }
  return false;
}
function cambioPubblica(el){
  if(cambioCalendari(el) || cambioScheda(el)) return true;
  if(el.dataset.acampo==='strato' && st.aform){ st.aform.strato = el.value; st.aform.sub = ''; disegnaFoglio(); return true; }
  if(el.dataset.acampo && st.aform && el.tagName==='SELECT'){ st.aform[el.dataset.acampo] = el.value; return true; }
  if(el.dataset.pbritiro && PB.ritiro){ PB.ritiro[el.dataset.pbritiro] = el.value; return true; }
  return false;
}

/* ======================= Registro delle fonti sul dispositivo della redazione (T-041, T-043) =======================
   Libro mastro, cap. 22: il registro prova che ogni evento pubblicato ha un'origine lecita e verificabile. La riga la
   scrive l'app nel momento in cui la Redazione pubblica (§ 3.4), con le colonne di fatto che l'app conosce e con le
   colonne di giudizio compilate nella scheda di pubblicazione (scheda-pubblicazione.js).

   Qui sta ciò che il registro tiene sul dispositivo, in una sola voce cifrata (red_registro, nella base di dati del
   browser): le fonti (foglio «Fonti», codici FS: decisione del 24/11/2026, l'elenco lo tiene l'app), le righe degli
   eventi (foglio «Eventi»; i codici F li dà lo sportello) e gli eventi preparati e non ancora pubblicati. La voce è una busta cifrata con
   la chiave del registro, diversa dalla firma (la legge e la scrive il modulo delle chiavi, sorgenti/moduli/chiavi.js): senza quella chiave non si legge nulla, e
   in chiaro il registro esiste soltanto nella memoria della pagina, finché l'app è aperta.

   Nel registro le persone fisiche non compaiono con il nome (§ 18.5): una fonte che è una persona si scrive con il
   codice P, e il titolo di un evento si annota con il ruolo al posto del nome. I codici non si riusano mai. Per ora
   l'elenco delle fonti sta sul solo dispositivo che lo scrive: con un secondo dispositivo le fonti si riportano con
   l'importazione del registro (T-043).

   Testi come testo (T-024): nomi delle fonti, titoli e note entrano nella pagina solo con esc(). */
const TIPI_FONTE = [['organizzatore', 'Organizzatore che scrive alla Redazione', '1'], ['sito', 'Sito dell’organizzatore', '2'], ['social', 'Pagina ufficiale su un social network', '2'],
  ['istituzionale', 'Sito istituzionale', '3'], ['calendario', 'Calendario in dati aperti', '3'], ['testata', 'Testata o comunicato', '4']];
const GRADI_FONTE = {'1':'Grado 1', '2':'Grado 2', '3':'Grado 3', '4':'Grado 4', esclusa:'Esclusa'};
const ESITI_FONTE = {ammessa:'Ammessa', attribuzione:'Ammessa con attribuzione', vietata:'Non ammessa: vieta il riuso, si cerca l’organizzatore', esclusa:'Esclusa'};
const CODICE_P = /^P-\d{4,}$/, CODICE_C = /^C-\d{4,}$/, CODICE_K = /^K-\d{4,}$/, CODICE_R = /^R-\d{4,}$/;   /* R: registro delle richieste (cap. 26) */
/* Licenza del calendario (cap. 22, foglio «Fonti»; § 6.4, punti 2 e 3): solo per i calendari in dati aperti */
const LICENZE_CAL = {aperta:'Licenza aperta che consente il riuso', nessuna:'Nessuna licenza (art. 52, c. 2, CAD)', condivisione:'Licenza a condivisione alle stesse condizioni (solo inserimento a mano)'};
/* I sette punti da verificare prima della prima importazione da ciascun Comune (§ 6.4), con la data del controllo */
const SETTE_PUNTI = [[1, 'Pubblicato dal Comune o nel catalogo AgID'], [2, 'Licenza o assenza di licenza verificata'], [3, 'Condizioni della licenza rispettate'],
  [4, 'Nomi trattati secondo i §§ 3.4-3.6'], [5, 'Testi riscritti, nessuna immagine'], [6, 'File scaricato dal dispositivo e importato con anteprima'], [7, 'Aggiornamenti ripassati dalla revisione']];
const STATI_FONTE = {uso:'In uso', non:'Non più in uso'};
const REG = {dati:null, stato:'', attesa:null};   /* stato: '' (da aprire), 'aperto', 'chiavi' (mancano le chiavi), 'illeggibile' (scritto con altre chiavi) */
const regVuoto = () => ({v:1, fonti:[], eventi:[], preparati:[], nonPubblicati:[], prossimi:{fs:1, p:1, np:1}});
const testoReg = (x, max) => typeof x==='string' ? x.slice(0, max||500) : '';
const giornoReg = x => typeof x==='string' && /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : '';
/* le colonne comuni di una voce portata dal file tenuto a mano, come erano scritte (funzione, rif., collegamenti, contestazione) */
const extraInForma = x => { if(!x || typeof x!=='object') return undefined; const o = {}; ['funzione', 'rif', 'collegamenti', 'contestazione'].forEach(k => { if(typeof x[k]==='string' && x[k]) o[k] = x[k].slice(0, 200); }); return Object.keys(o).length ? o : undefined; };
const rettificheInForma = l => Array.isArray(l) ? l.filter(x => x && typeof x==='object').slice(-200).map(x => ({data:testoReg(x.data, 30), testo:testoReg(x.testo, 400)})) : [];
/* ciò che esce dalla busta si rimette in forma: elenchi veri, testi veri, contatori che non tornano mai indietro */
function regInForma(d){
  const o = regVuoto(); if(!d || typeof d!=='object') return o;
  ['fonti', 'eventi', 'preparati', 'nonPubblicati'].forEach(k => { if(Array.isArray(d[k])) o[k] = d[k].filter(x => x && typeof x==='object'); });
  o.fonti.forEach(f => { ['codice', 'nome', 'tipo', 'grado', 'indirizzo', 'lette', 'esito', 'licenza', 'attribuzione', 'note', 'registrata', 'aggiornata'].forEach(k => { f[k] = testoReg(f[k]); });
    f.licenzaTipo = LICENZE_CAL[f.licenzaTipo] ? f.licenzaTipo : ''; f.stato = STATI_FONTE[f.stato] ? f.stato : 'uso';
    const p = f.punti && typeof f.punti==='object' ? f.punti : {}; f.punti = {}; SETTE_PUNTI.forEach(([n]) => { if(giornoReg(p[n])) f.punti[n] = p[n]; });
    f.rettifiche = rettificheInForma(f.rettifiche); f.invio = !!f.invio; f.extra = extraInForma(f.extra);
    /* la corrispondenza delle colonne del calendario di questa fonte (T-044) */
    if(f.mappa && typeof f.mappa==='object'){ const m = {}; Object.keys(f.mappa).slice(0, 20).forEach(k => { if(typeof f.mappa[k]==='string') m[k] = f.mappa[k].slice(0, 120); }); f.mappa = m; } else delete f.mappa; });
  o.eventi.forEach(r => { r.rettifiche = rettificheInForma(r.rettifiche); });
  o.nonPubblicati.forEach(x => { ['codice', 'registrata', 'richiesta', 'organizzatore', 'evento', 'motivo', 'motivazioneData', 'motivazioneCanale', 'chiusa', 'note', 'aggiornata'].forEach(k => { x[k] = testoReg(x[k]); });
    x.rettifiche = rettificheInForma(x.rettifiche); x.invio = !!x.invio; x.extra = extraInForma(x.extra); });
  const p = d.prossimi||{}, num = (pre, l) => l.reduce((m, x) => { const n = parseInt(String(x.codice||'').replace(pre, ''), 10); return n>=m ? n+1 : m; }, 1);
  o.prossimi = {fs:Math.max(+p.fs||1, num('FS-', o.fonti)), p:Math.max(+p.p||1, num('PR-', o.preparati)), np:Math.max(+p.np||1, num('NP-', o.nonPubblicati))};
  return o;
}
/* § 18.4, regola 5: una voce non si riscrive. Quando la Redazione corregge una fonte, una riga o un «Non pubblicato»,
   la voce prende i valori nuovi e la correzione resta annotata, con la data, nella colonna «Rettifiche»: che cosa era
   scritto prima e che cosa c'è ora. */
function rettifica(voce, prima, dopo, etichette){
  const cambi = Object.keys(etichette).filter(k => String(prima[k]==null ? '' : prima[k]) !== String(dopo[k]==null ? '' : dopo[k]))
    .map(k => `${etichette[k]}: «${String(prima[k]==null ? '' : prima[k]).slice(0, 80)}» → «${String(dopo[k]==null ? '' : dopo[k]).slice(0, 80)}»`);
  if(cambi.length){ voce.rettifiche = (voce.rettifiche||[]).concat([{data:new Date().toISOString(), testo:cambi.join('; ').slice(0, 400)}]).slice(-200); }
  return cambi.length;
}
/* apre il registro una volta sola; chi arriva mentre si apre aspetta la stessa lettura */
function regApri(){
  if(REG.stato==='aperto') return Promise.resolve(REG.dati);
  if(REG.attesa) return REG.attesa;
  REG.attesa = CHIAVI.registro.leggi().then(t => t==null ? regVuoto() : regInForma(JSON.parse(t)))
    .then(d => { REG.dati = d; REG.stato = 'aperto'; return d; }, e => { REG.dati = null; REG.stato = e && e.motivo==='mancano' ? 'chiavi' : 'illeggibile'; return null; })
    .then(d => { REG.attesa = null; return d; });
  return REG.attesa;
}
/* cifra e scrive; un registro che non si è riusciti a leggere non si sovrascrive mai */
function regSalva(){
  if(REG.stato!=='aperto' || !REG.dati) return Promise.reject(new Error('registro'));
  return CHIAVI.registro.scrivi(JSON.stringify(REG.dati));
}
const regCodice = (pre, n, cifre) => pre+'-'+String(n).padStart(cifre, '0');
const regFonte = c => REG.dati ? REG.dati.fonti.find(f => f.codice===c) || null : null;
const regRiga = id => REG.dati ? REG.dati.eventi.find(r => r.id===id) || null : null;
const tipoFonte = t => TIPI_FONTE.find(x => x[0]===t) || null;
/* il prossimo controllo delle condizioni: dodici mesi dopo l'ultimo (cap. 22, foglio «Fonti») */
const prossimoControllo = f => /^\d{4}-\d{2}-\d{2}$/.test(f.lette||'') ? (+f.lette.slice(0,4)+1)+f.lette.slice(4) : '';
const fonteAmmessa = f => !!f && (f.esito==='ammessa' || f.esito==='attribuzione') && f.grado!=='esclusa';
const fonteDaRicontrollare = f => { const p = prossimoControllo(f); return !!p && p <= oggi(); };
const etichettaFonte = f => f.codice+' · '+f.nome+(GRADI_FONTE[f.grado] ? ' · '+tr(GRADI_FONTE[f.grado]).toLowerCase() : '');
const statoRegistro = () => REG.stato==='chiavi' ? tr('Per il registro delle fonti servono le chiavi della Redazione: Strumenti della redazione → Chiavi.')
  : REG.stato==='illeggibile' ? tr('Il registro delle fonti su questo dispositivo è scritto con altre chiavi e non si legge: ripristina le chiavi dalla copia di riserva (Strumenti della redazione → Chiavi). Finché non si legge, non si tocca.')
  : REG.stato==='aperto' ? '' : tr('Apro il registro delle fonti…');

/* ---------- Le fonti (foglio «Fonti», codici FS) ---------- */
function fPbFonti(){
  const torna = st.aform ? 'aform' : 'pubblica';
  const testa = `<div class="riga-titolo"><div><h2>${tr('Fonti')}</h2><p class="meta">${tr('Registro delle fonti · una riga per sito, pagina o calendario')}</p></div>${chiudiBtn(torna==='aform' ? 'g-torna' : 'pb-registro')}</div>`;
  const s = statoRegistro(); if(s) return foglio('forte', testa, `<p class="meta" role="status">${esc(s)}</p>`);
  const F = REG.dati.fonti;
  const nota = f => !fonteAmmessa(f) ? tr('non ammessa') : fonteDaRicontrollare(f) ? tr('condizioni da rileggere') : tr('condizioni lette il {d}',{d:f.lette ? dIso(f.lette).toLocaleDateString(dloc(), {day:'numeric', month:'short', year:'numeric'}) : '–'});
  const corpo = `${statoPb()}
    <p class="meta">${tr('Prima di usare un sito se ne leggono le condizioni, le note legali o la licenza: se vieta il riuso non si usa, e si cerca l’organizzatore. Qui si annota l’esito, una volta per fonte; nella scheda dell’evento si sceglie la fonte da questo elenco.')}</p>
    <div class="tasti"><button class="tasto pri" data-az="pb-fonte-nuova">${tr('Nuova fonte')}</button></div>
    ${F.length ? `<div class="menu-lista">${F.map(f => `<button class="menu-r" data-pbfonte="${esc(f.codice)}"><div><span class="t">${esc(f.codice)} · ${esc(f.nome)}</span><span class="meta">${esc(tr((tipoFonte(f.tipo)||['', '—'])[1]))} · ${esc(tr(GRADI_FONTE[f.grado]||'—').toLowerCase())} · ${esc(nota(f))}</span></div>${freccia}</button>`).join('')}</div>`
      : `<p class="meta">${tr('Non c’è ancora nessuna fonte: la prima nasce con «Nuova fonte» e prende il codice FS-0001.')}</p>`}`;
  return foglio('forte alto', testa, corpo);
}
function apriFonte(codice){
  const f = codice ? regFonte(codice) : null;
  PB.fonte = Object.assign({codice:null, nome:'', tipo:'', grado:'', indirizzo:'', lette:oggi(), esito:'', licenzaTipo:'', licenza:'', attribuzione:'', punti:{}, stato:'uso', note:'', errori:[]}, f ? JSON.parse(JSON.stringify(f)) : {}, {errori:[]});
  PB.errore = ''; PB.msg = ''; apri('pb-fonte');
}
function fPbFonte(){
  const f = PB.fonte, testa = `<div class="riga-titolo"><div><h2>${f && f.codice ? esc(f.codice) : tr('Nuova fonte')}</h2><p class="meta">${tr('Registro delle fonti, foglio «Fonti»')}</p></div>${chiudiBtn('pb-fonti')}</div>`;
  if(!f) return foglio('forte', testa, '');
  const fac = tr('facoltativo'), campo = (id, lab, html, nota) => `<div class="stack-s"><label class="etich" for="${id}">${lab}</label>${html}${nota?`<span class="meta">${nota}</span>`:''}</div>`;
  const testo = (id, c, lab, max, segna, nota, tipo) => campo(id, lab, `<div class="campo"><input id="${id}" data-fcampo="${c}" maxlength="${max}" value="${esc(f[c])}" placeholder="${esc(segna||'')}" autocomplete="off"${tipo?` type="${tipo}"`:''}></div>`, nota);
  const scelta = (id, c, lab, voci, nota) => campo(id, lab, `<div class="campo"><select id="${id}" data-fcampo="${c}"><option value="">${tr('— Scegli —')}</option>${voci.map(([v, t]) => `<option value="${esc(v)}" ${f[c]===v?'selected':''}>${esc(tr(t))}</option>`).join('')}</select></div>`, nota);
  const corpo = `
    ${testo('fo-nome', 'nome', tr('Nome della fonte'), 120, tr('Ente, organizzatore o testata'), tr('Una persona fisica non si scrive con il nome: si scrive il suo codice P dell’anagrafica dei registri, per esempio «P-0007».'))}
    ${scelta('fo-tipo', 'tipo', tr('Tipo'), TIPI_FONTE.map(x => [x[0], x[1]]))}
    ${scelta('fo-grado', 'grado', tr('Grado'), Object.entries(GRADI_FONTE), tr('1: l’organizzatore che chiede la pubblicazione · 2: il suo sito o la sua pagina ufficiale · 3: il sito istituzionale dell’ente · 4: testate e comunicati · esclusi: aggregatori, gruppi, contenuti leggibili solo con un account, storie, segnalazioni di privati.'))}
    ${testo('fo-indirizzo', 'indirizzo', `${tr('Indirizzo')} <span class="fac">${fac}</span>`, 500, 'https://', tr('Il collegamento alla fonte. Per un organizzatore che scrive alla Redazione può mancare.'), 'url')}
    ${testo('fo-lette', 'lette', tr('Condizioni lette il'), 10, '', tr('Il giorno in cui hai letto le condizioni, le note legali o la licenza del sito. Dopo dodici mesi l’app chiede di rileggerle.'), 'date')}
    ${scelta('fo-esito', 'esito', tr('Esito'), Object.entries(ESITI_FONTE))}
    ${f.tipo==='calendario' ? scelta('fo-lictipo', 'licenzaTipo', tr('Licenza del calendario'), Object.entries(LICENZE_CAL), tr('Se il Comune non indica nessuna licenza, il calendario è un dato aperto per legge, salvo che le condizioni del sito ne vietino il riuso. Una licenza a condivisione alle stesse condizioni ammette soltanto l’inserimento a mano, evento per evento (§ 6.4).')) : ''}
    ${testo('fo-licenza', 'licenza', `${tr('Nome della licenza')} <span class="fac">${fac}</span>`, 120, tr('Per esempio CC BY 4.0'), tr('Solo per i calendari in dati aperti e per i siti con una licenza dei contenuti.'))}
    ${testo('fo-attr', 'attribuzione', `${tr('Attribuzione richiesta')} <span class="fac">${fac}</span>`, 160, '', tr('Il testo che la licenza chiede di mostrare: va nel campo «Fonte:» dell’evento.'))}
    ${f.tipo==='calendario' ? `<fieldset class="g-punti"><legend class="etich">${tr('I sette punti, prima della prima importazione')}</legend><p class="meta">${tr('Per ogni punto, il giorno del controllo (§ 6.4). Senza tutti e sette, il calendario non si importa.')}</p>
      ${SETTE_PUNTI.map(([n, t]) => `<div class="stack-s"><label class="etich" for="fo-p${n}">${n}. ${esc(tr(t))}</label><div class="campo"><input id="fo-p${n}" type="date" data-fpunto="${n}" value="${esc(f.punti[n]||'')}"></div></div>`).join('')}</fieldset>` : ''}
    ${f.codice ? scelta('fo-stato', 'stato', tr('Stato'), Object.entries(STATI_FONTE), tr('«Non più in uso» quando la fonte non si usa più: per una persona fisica la riga si conserva cinque anni dall’ultimo evento collegato (§ 18.6).')) : ''}
    ${testo('fo-note', 'note', `${tr('Note')} <span class="fac">${fac}</span>`, 300, '', '')}
    ${f.errori.length ? `<div class="red-riquadro pb-errori" role="alert"><b>${tr('Per salvare la fonte:')}</b>${f.errori.map(x => `<span class="err">${esc(x)}</span>`).join('')}</div>` : ''}
    ${statoPb()}
    <div class="tasti"><button class="tasto sec" data-az="pb-fonti">${tr('Annulla')}</button><button class="tasto pri" data-az="pb-fonte-salva">${f.codice ? tr('Salva la fonte') : tr('Aggiungi la fonte')}</button></div>
    <p class="meta">${tr('Una fonte non si cancella: il suo codice resta legato agli eventi pubblicati. Se un sito non si può più usare, cambia l’esito in «Non ammessa» o «Esclusa».')}</p>`;
  return foglio('forte alto', testa, corpo);
}
function salvaFonte(){
  const f = PB.fonte; if(!f || PB.lavoro) return;
  const e = [], nome = f.nome.trim(), ind = f.indirizzo.trim();
  if(!nome) e.push(tr('Nome della fonte: scrivilo.'));
  if(!tipoFonte(f.tipo)) e.push(tr('Tipo: scegline uno.'));
  if(!GRADI_FONTE[f.grado]) e.push(tr('Grado: scegline uno.'));
  if(ind && !MODULI.testo.collegamento(ind)) e.push(tr('Indirizzo: deve cominciare con https:// (oppure lascialo vuoto).'));
  if(!ind && f.tipo && f.tipo!=='organizzatore') e.push(tr('Indirizzo: per questo tipo di fonte serve il collegamento.'));
  if(!/^\d{4}-\d{2}-\d{2}$/.test(f.lette) || f.lette > oggi()) e.push(tr('Condizioni lette il: scegli il giorno, non nel futuro.'));
  if(!ESITI_FONTE[f.esito]) e.push(tr('Esito: scegline uno.'));
  if(f.grado==='esclusa' && f.esito!=='esclusa' && ESITI_FONTE[f.esito]) e.push(tr('Una fonte di grado «Esclusa» ha l’esito «Esclusa».'));
  if(f.tipo==='calendario' && !LICENZE_CAL[f.licenzaTipo]) e.push(tr('Licenza del calendario: scegline una.'));
  SETTE_PUNTI.forEach(([n]) => { const p = f.punti[n]; if(p && (!giornoReg(p) || p > oggi())) e.push(tr('Punto {n}: scegli il giorno, non nel futuro (oppure lascialo vuoto).',{n})); });
  f.errori = e; if(e.length){ disegnaFoglio(); return; }
  const d = REG.dati, cal = f.tipo==='calendario', punti = {};
  if(cal) SETTE_PUNTI.forEach(([n]) => { if(f.punti[n]) punti[n] = f.punti[n]; });
  const v = {nome, tipo:f.tipo, grado:f.grado, indirizzo:ind, lette:f.lette, esito:f.esito, licenzaTipo:cal ? f.licenzaTipo : '', licenza:f.licenza.trim(), attribuzione:f.attribuzione.trim(),
    punti, stato:STATI_FONTE[f.stato] ? f.stato : 'uso', note:f.note.trim(), aggiornata:new Date().toISOString(), invio:true};
  let x = f.codice ? regFonte(f.codice) : null, prima = x ? JSON.parse(JSON.stringify(x)) : null;
  if(x){
    const piatta = o => Object.assign({}, o, {punti:SETTE_PUNTI.map(([n]) => (o.punti||{})[n]||'').join(' ')});
    rettifica(x, piatta(x), piatta(v), {nome:'Nome', tipo:'Tipo', grado:'Grado', indirizzo:'Indirizzo', lette:'Condizioni lette il', esito:'Esito', licenzaTipo:'Licenza del calendario', licenza:'Nome della licenza', attribuzione:'Attribuzione', punti:'Sette punti', stato:'Stato', note:'Note'});
    Object.assign(x, v);
  } else { x = Object.assign({codice:regCodice('FS', d.prossimi.fs++, 4), registrata:oggi(), rettifiche:[]}, v); d.fonti.push(x); }
  PB.lavoro = true; disegnaFoglio();
  regSalva().then(() => { PB.lavoro = false; registra(f.codice ? 'fonte-corretta' : 'fonte-nuova', {c:x.codice}); PB.fonte = null;
      /* dalla scheda di un evento: la fonte appena aggiunta è già scelta */
      if(st.aform && st.aform.g && !f.codice){ st.aform.g.fonte = x.codice; fonteScelta(st.aform); }
      PB.msg = tr('Fonte {c} salvata.',{c:x.codice}); apri('pb-fonti'); },
    () => { PB.lavoro = false; if(!f.codice){ d.fonti.pop(); d.prossimi.fs--; } else if(prima){ Object.keys(x).forEach(k => { delete x[k]; }); Object.assign(x, prima); } PB.errore = tr('Non sono riuscito a salvare il registro delle fonti su questo dispositivo.'); disegnaFoglio(); });
}

/* ---------- Le righe degli eventi (foglio «Eventi», codici F) ----------
   Le righe di una pubblicazione si preparano prima di partire: viaggiano cifrate nello stesso pacchetto firmato
   dell'evento (decisione del 24/11/2026), lo sportello le conserva nel riservato senza poterle leggere e dà a ogni
   evento nuovo il suo codice F. Diventano del registro di questo dispositivo solo quando lo sportello accetta: se
   rifiuta, la riga non nasce. Una correzione aggiorna le colonne di giudizio e lascia la data della prima
   pubblicazione; un ritiro prima della fine annota data e motivo. Se l'evento era stato pubblicato da un altro
   dispositivo, qui la riga nasce senza la data della prima pubblicazione: la ritrova l'importazione delle righe
   dallo sportello (T-043). */
const CINQUE_ANNI = 5;
const scadenzaRiga = iso => { const d = new Date(iso); if(!iso || isNaN(d)) return ''; d.setFullYear(d.getFullYear()+CINQUE_ANNI); return ymd(d); };   /* il giorno del dispositivo, ora italiana */
/* Che cosa del registro di questo dispositivo lo sportello non ha ancora (T-043): le fonti aggiunte o corrette, le
   righe «Non pubblicati» e le righe portate dal file tenuto a mano. Viaggiano nella busta della pubblicazione seguente,
   insieme alle sue righe (decisione del 24/11/2026: il registro arriva insieme all'evento), così un secondo
   dispositivo le ritrova con «Confronta con lo sportello». Si mandano una volta sola: dopo il sì dello sportello il
   segno «da mandare» si toglie. */
const daMandare = d => ({fonti:d.fonti.filter(f => f.invio), nonPubblicati:d.nonPubblicati.filter(x => x.invio), mano:d.eventi.filter(r => r.mano && r.invio)});
const numeroF = c => { const m = /^F-(\d{5,})$/.exec(String(c||'')); return m ? +m[1] : 0; };
const ETICHETTE_RIGA = {titolo:'Titolo', testoFonte:'Testo del campo «Fonte:»', collegamento:'Collegamento', fonte:'Fonte', consultazione:'Data di consultazione', dieci:'Dieci domande',
  elementi:'Elementi ripresi', nomi:'Nomi ripresi', politico:'Evento politico o religioso', avviso:'Avviso all’organizzatore', consenso:'Prova del consenso'};
/* le colonne di una riga come le legge una persona, per annotare la rettifica di una correzione */
const rigaPerRettifica = r => { const g = r.g||{}; return {titolo:r.titolo, testoFonte:r.testoFonte, collegamento:r.collegamento, fonte:g.fonte, consultazione:g.consultazione,
  dieci:g.domFile || DIECI_DOMANDE.map(([n]) => g.dom && g.dom[n] || '-').join(''), elementi:ELEMENTI_RIPRESI.filter(([k]) => g.elementi && g.elementi[k]).map(x => x[0]).join(' '),
  nomi:(g.nomi||'')+(g.ruoli ? ' '+g.ruoli : ''), politico:g.politico, avviso:[g.avviso, g.avvisoData, g.avvisoCanale, g.k].filter(Boolean).join(' '), consenso:g.consenso}; };
/* cambi: [{ev, g, titolo, canale, nascosto}] per pubblicare o correggere (nascosto: un evento nascosto, T-045, colonna «Evento nascosto»); [{id, ritiro, riferimento}] per un ritiro. → {busta, nuovo, quando, minimo} o null */
function regPrepara(cambi){
  if(REG.stato!=='aperto' || !REG.dati) return Promise.reject(new Error('registro'));
  const nuovo = JSON.parse(JSON.stringify(REG.dati)), quando = new Date().toISOString(), righe = [], fonti = new Map();
  for(const c of cambi){
    if(c.ev){
      const ev = c.ev, fine = FORMATO.fineMs(ev), fatti = {titolo:testoReg(c.titolo||ev.titolo, 200), testoFonte:ev.fonte.testo, collegamento:ev.fonte.collegamento||'', g:JSON.parse(JSON.stringify(c.g)), fine:fine==null ? '' : new Date(fine).toISOString()};
      if(c.chiave) fatti.chiave = testoReg(c.chiave, 200);   /* l'identificativo dell'evento nel calendario del Comune (T-044) */
      let r = nuovo.eventi.find(x => x.id===ev.id);
      if(r){ rettifica(r, rigaPerRettifica(r), rigaPerRettifica(fatti), ETICHETTE_RIGA); Object.assign(r, fatti, {corretto:quando}); }
      else { r = Object.assign({codice:'', id:ev.id, quando:c.correzione ? '' : quando, corretto:c.correzione ? quando : '', nascosto:!!c.nascosto, canale:c.canale||'singolo', funzione:'Redazione eventi', ritiro:null, scadenza:c.correzione ? '' : scadenzaRiga(quando), rettifiche:[]}, fatti); nuovo.eventi.push(r); }
      righe.push(r);
      const fo = nuovo.fonti.find(f => f.codice===c.g.fonte); if(fo) fonti.set(fo.codice, fo);
    } else if(c.ritiro){
      const r = nuovo.eventi.find(x => x.id===c.id); if(!r) continue;
      r.ritiro = Object.assign({data:quando, motivo:c.ritiro}, c.riferimento ? {riferimento:testoReg(c.riferimento, 40)} : {}); righe.push(r);
    }
  }
  if(!righe.length) return Promise.resolve(null);
  /* nella busta: le righe di questa pubblicazione, le fonti che citano, com'erano in quel momento, e ciò che lo
     sportello non ha ancora (daMandare) */
  const m = daMandare(nuovo);
  m.fonti.forEach(f => fonti.set(f.codice, f));
  const pulita = x => { const y = Object.assign({}, x); delete y.invio; return y; };
  const contenuto = {v:1, quando, righe:righe.concat(m.mano.filter(r => !righe.includes(r))).map(pulita), fonti:[...fonti.values()].map(pulita), nonPubblicati:m.nonPubblicati.map(pulita)};
  /* il primo codice F che lo sportello può dare: dopo quelli scritti a mano (i codici non si riusano, § 18.4) */
  const minimo = nuovo.eventi.reduce((x, r) => r.mano ? Math.max(x, numeroF(r.codice)+1) : x, 1);
  return CHIAVI.registro.cifra(JSON.stringify(contenuto)).then(busta => ({busta, nuovo, quando, minimo, mandati:{fonti:m.fonti.map(f => f.codice), np:m.nonPubblicati.map(x => x.codice), mano:m.mano.map(r => r.id)}}));
}
/* il contenuto del pacchetto con il registro: la busta e, se ci sono righe scritte a mano, il primo codice F libero */
const conRegistro = (c, rp) => { if(rp){ c.registro = rp.busta; if(rp.minimo>1) c.registroDa = rp.minimo; } return c; };
/* lo sportello ha accettato: i codici F che ha dato entrano nelle righe, il segno «da mandare» si toglie da ciò che è
   partito, e il registro del dispositivo diventa quello nuovo */
function regConferma(prep, codici){
  if(!prep) return Promise.resolve();
  Object.entries(codici||{}).forEach(([id, c]) => { const r = prep.nuovo.eventi.find(x => x.id===id); if(r && /^F-\d{5,}$/.test(c)) r.codice = c; });
  const M = prep.mandati||{};
  prep.nuovo.fonti.forEach(f => { if((M.fonti||[]).includes(f.codice)) f.invio = false; });
  prep.nuovo.nonPubblicati.forEach(x => { if((M.np||[]).includes(x.codice)) x.invio = false; });
  prep.nuovo.eventi.forEach(r => { if(r.mano && (M.mano||[]).includes(r.id)) r.invio = false; });
  REG.dati = prep.nuovo; return regSalva();
}

/* ======================= Scheda di pubblicazione dell'evento singolo (T-041) =======================
   Libro mastro: § 2.2, canale 1; § 3.4 (le dieci domande); §§ 3.5-3.6; §§ 5.1-5.4; § 11.3; cap. 22, regola 1 («Senza
   le colonne di giudizio l'app non pubblica»); § 12.1, regola 1 (le decisioni restano alle persone: qui non c'è nessun
   aiuto di intelligenza artificiale); allegato A, A.2.

   Il modulo dell'evento (pubblicazione.js) porta i campi pubblici; questa parte gli aggiunge:
   - le colonne di giudizio del registro delle fonti: la fonte (codice FS, scelta dall'elenco delle fonti), la data
     di consultazione, il post leggibile senza account, l'esito delle dieci domande, gli elementi ripresi e i nomi
     con il solo ruolo, l'evento politico o religioso, l'avviso all'organizzatore, la prova del consenso;
   - i controlli prima di pubblicare: recapiti nei testi (chiocciola, «+39», «tel.», numeri lunghi), parole da non
     usare per eventi soltanto ripresi, immagini, evento già cominciato. Un avviso non decide nulla: chiede a chi
     pubblica di guardare e di confermare;
   - gli eventi preparati: una scheda si può salvare e riprendere più tardi; resta nel registro cifrato del
     dispositivo finché non si pubblica o non si toglie.
   Finché le colonne di giudizio non sono complete «Pubblica» resta spento, e sotto il tasto c'è scritto che cosa manca.

   Le colonne di giudizio non entrano mai nell'evento pubblico (il formato non ha un campo per loro): vanno nella riga
   del registro, che nasce quando lo sportello accetta la pubblicazione (registro-fonti.js).

   Testi come testo (T-024): ciò che viene dal registro o dal modulo entra nella pagina solo con esc(). */
const DIECI_DOMANDE = [
  [1, 'La fonte è verificabile ora, con un collegamento funzionante?', ['stop']],
  [2, 'La fonte è accessibile senza registrazione o accesso riservato?', ['stop']],
  [3, 'La fonte è stabile, e non un contenuto destinato a sparire in poche ore?', ['stop']],
  [4, 'La fonte è dell’organizzatore, di un ente o di una testata?', ['stop']],
  [5, 'Si riprendono solo informazioni sull’evento, e non sulle persone?', ['stop']],
  [6, 'Le persone nominate agiscono in una veste pubblica (relatori, artisti) e nessuna è un minore?', ['omesso', 'consenso']],
  [7, 'Il testo è riscritto con parole proprie e senza immagini altrui?', ['riscritto', 'stop']],
  [8, 'Mancano recapiti personali?', ['tolti', 'stop']],
  [9, 'L’organizzatore ha scelto di rendere pubblico l’evento?', ['consenso', 'stop']],
  [10, 'Il luogo è pubblico o aperto al pubblico, e nulla nella fonte indica che l’evento si svolga in modo irregolare?', ['consenso', 'stop']]];
const RISPOSTE_DOMANDA = {si:'Sì', stop:'No: non si pubblica', omesso:'No: ho omesso il nome (sempre, se è un minore)', consenso:'No: c’è il consenso diretto', riscritto:'No: ora l’ho riscritto', tolti:'No: ora li ho tolti'};
const CORREZIONI_DOMANDA = {omesso:'nome omesso', consenso:'consenso diretto', riscritto:'testo riscritto', tolti:'recapiti tolti'};
const ELEMENTI_RIPRESI = [['titolo', 'Titolo'], ['data', 'Data'], ['ora', 'Ora'], ['luogo', 'Luogo'], ['descrizione', 'Descrizione riscritta']];
const AVVISI_ORG = {nessuno:'Nessun recapito di lavoro noto', dopo:'Recapito noto: l’avviso parte dopo la pubblicazione', inviato:'Avviso già inviato'};
const giudizioNuovo = () => ({fonte:'', consultazione:oggi(), post:'', dom:{}, elementi:{titolo:1, data:1, ora:1, luogo:1, descrizione:1}, nomi:'', ruoli:'', titoloReg:'', politico:'', avviso:'', avvisoData:'', avvisoCanale:'', k:'', consenso:'', visti:{}});
/* un giudizio letto dal registro o da una scheda preparata torna nella forma di giudizioNuovo() */
function giudizioInForma(g){
  const o = giudizioNuovo(); if(!g || typeof g!=='object') return o;
  ['fonte', 'consultazione', 'post', 'nomi', 'ruoli', 'titoloReg', 'politico', 'avviso', 'avvisoData', 'avvisoCanale', 'k', 'consenso'].forEach(k => { if(typeof g[k]==='string') o[k] = g[k].slice(0, 200); });
  DIECI_DOMANDE.forEach(([n, , no]) => { const v = g.dom && g.dom[n]; if(v==='si' || no.includes(v)) o.dom[n] = v; });
  if(g.elementi && typeof g.elementi==='object') ELEMENTI_RIPRESI.forEach(([k]) => { o.elementi[k] = g.elementi[k] ? 1 : 0; });
  if(g.visti && typeof g.visti==='object') Object.keys(g.visti).slice(0, 8).forEach(k => { if(typeof g.visti[k]==='string') o.visti[k] = g.visti[k].slice(0, 400); });
  if(typeof g.domFile==='string' && g.domFile) o.domFile = g.domFile.slice(0, 200);
  if(g.daFile) o.daFile = true;
  return o;
}
/* l'esito delle dieci domande come lo vuole la colonna del registro */
function esitoDomande(g){
  if(g.domFile) return g.domFile;   /* una riga del file d'importazione: l'esito com'è scritto nel file */
  const no = DIECI_DOMANDE.filter(([n]) => g.dom[n] && g.dom[n]!=='si');
  return no.length ? no.map(([n]) => n+': '+(CORREZIONI_DOMANDA[g.dom[n]]||'non si pubblica')).join('; ') : 'Tutte superate';
}
const serveConsenso = g => DIECI_DOMANDE.some(([n]) => g.dom[n]==='consenso') || g.domFile==='Consenso diretto chiesto' || (g.politico==='si' && g.nomi==='si');

/* ---------- Controlli prima di pubblicare (§ 5.2; allegato A, A.2) ---------- */
const TESTI_SCHEDA = f => [f.titolo, f.desc, f.comeArrivare, f.organizzatore, f.luogo, f.prezzo, f.fonte].map(x => String(x||''));
const RECAPITI = [/[^\s@]*@[^\s@]*/g, /\+\s?39[\d .\-]*/g, /\b(?:tel|cell|telefono|whatsapp)\b\.?:?\s*[\d .\-+]*/gi, /\b\d(?:[ .\-]?\d){8,}\b/g];
const PAROLE_DA_EVITARE = /\b(?:verificat[oaie]|ufficial[ei]|autorizzat[oaie]|in regola|sicur[oaie]|a norma)\b/gi;
const IMMAGINI = /data:image|\bhttps?:\/\/\S+\.(?:jpe?g|png|gif|webp|svg|avif)\b/i;
const corrispondenze = (testi, regole) => { const o = []; testi.forEach(t => regole.forEach(r => { (t.match(r)||[]).forEach(x => { x = x.trim(); if(x && !o.includes(x)) o.push(x); }); })); return o; };
/* gli avvisi di questa scheda: ognuno con la sua firma, cioè le parole che l'hanno fatto nascere. La conferma vale
   finché la firma resta la stessa: se il testo cambia e l'avviso con lui, va guardato di nuovo. */
function avvisiScheda(f){
  const a = [], testi = TESTI_SCHEDA(f);
  const rec = corrispondenze(testi, RECAPITI);
  if(rec.length) a.push({k:'recapiti', firma:rec.join(' | '), tit:tr('Nei testi sembra esserci un recapito'), testo:tr('Trovato: {l}. I recapiti personali non si pubblicano mai (§ 3.5): toglili. Il recapito di una biglietteria o di un ente può restare.',{l:rec.slice(0, 6).join(' · ')}), ok:tr('Ho controllato: non è un recapito personale')});
  const par = corrispondenze([f.titolo, f.desc, f.comeArrivare].map(x => String(x||'')), [PAROLE_DA_EVITARE]).map(x => x.toLowerCase()).filter((x, i, l) => l.indexOf(x)===i);
  if(par.length) a.push({k:'parole', firma:par.join(' | '), tit:tr('Parole da non usare per un evento soltanto ripreso'), testo:tr('Trovato: {l}. Queste parole promettono un controllo che la Redazione non ha fatto (§ 5.2; § 9.4): riscrivi la frase. Possono restare solo se fanno parte del nome dell’evento o del luogo.',{l:par.map(x => '«'+x+'»').join(', ')}), ok:tr('Ho controllato: è il nome dell’evento o del luogo')});
  const ini = f.inizio ? FORMATO.istante(f.inizio) : null;
  if(ini!=null && ini < Date.now()) a.push({k:'cominciato', firma:f.inizio, tit:tr('L’evento è già cominciato'), testo:tr('L’inizio è nel passato. Va bene per una mostra o una rassegna ancora in corso; altrimenti controlla la data.'), ok:tr('Ho controllato: è ancora in corso')});
  return a;
}
const avvisoVisto = (f, x) => f.g.visti[x.k]===x.firma;

/* ---------- Che cosa manca per accendere «Pubblica» ---------- */
function giudizioManca(f){
  const g = f.g, m = [], fo = regFonte(g.fonte);
  if(REG.stato!=='aperto') return [statoRegistro()];
  if(!fo) m.push(tr('la fonte nel registro'));
  else {
    if(!fonteAmmessa(fo)) m.push(tr('una fonte ammessa: {c} non lo è',{c:fo.codice}));
    if(fo.tipo!=='organizzatore' && !String(f.fonteLink||'').trim()) m.push(tr('il collegamento alla pagina dell’evento'));
    if(fo.tipo==='social' && g.post!=='si') m.push(tr('il post aperto senza accedere'));
    if(fo.attribuzione && !String(f.fonte||'').includes(fo.attribuzione.trim())) m.push(tr('nel campo «Fonte» l’attribuzione chiesta dalla licenza'));
  }
  if(!/^\d{4}-\d{2}-\d{2}$/.test(g.consultazione) || g.consultazione > oggi()) m.push(tr('la data di consultazione'));
  const senza = DIECI_DOMANDE.filter(([n]) => !g.dom[n]).length, stop = DIECI_DOMANDE.filter(([n]) => g.dom[n]==='stop').map(x => x[0]);
  if(senza && !g.domFile) m.push(senza===10 ? tr('le dieci domande') : tr('{n} delle dieci domande',{n:senza}));
  if(stop.length) m.push(tr('un evento che si può pubblicare: alla domanda {n} hai risposto che non si pubblica',{n:stop.join(', ')}));
  if(!ELEMENTI_RIPRESI.some(([k]) => g.elementi[k])) m.push(tr('gli elementi ripresi'));
  if(g.nomi!=='no' && g.nomi!=='si') m.push(tr('i nomi di persone: sì o no'));
  else if(g.nomi==='si' && !g.ruoli.trim() && !g.daFile) m.push(tr('il ruolo delle persone nominate'));
  if(g.politico!=='no' && g.politico!=='si') m.push(tr('evento politico o religioso: sì o no'));
  if(!AVVISI_ORG[g.avviso]) m.push(tr('l’avviso all’organizzatore'));
  else if(g.avviso==='inviato' && (!/^\d{4}-\d{2}-\d{2}$/.test(g.avvisoData) || !g.avvisoCanale.trim())) m.push(tr('data e canale dell’avviso'));
  if(g.k.trim() && !CODICE_K.test(g.k.trim())) m.push(tr('un codice K scritto come «K-0001»'));
  /* un evento nascosto si pubblica solo con il consenso dell'organizzatore (§ 3.3, passo 4; allegato C, C.2) e non è mai una
     manifestazione (§ 9.2, regola 2) */
  if((serveConsenso(g) || f.nascosto) && !CODICE_C.test(g.consenso.trim())) m.push(g.politico==='si' && g.nomi==='si' ? tr('il codice C del consenso esplicito (evento politico o religioso con nomi)')
    : f.nascosto ? tr('il codice C del consenso dell’organizzatore all’evento nascosto') : tr('il codice C del consenso diretto'));
  else if(g.consenso.trim() && !CODICE_C.test(g.consenso.trim())) m.push(tr('un codice C scritto come «C-0001»'));
  if(f.nascosto && f.strato==='manifestazioni') m.push(tr('un altro strato: un evento nascosto non è mai una manifestazione (§ 9.2)'));
  if(IMMAGINI.test(TESTI_SCHEDA(f).join('\n'))) m.push(tr('un testo senza immagini: nei testi c’è il collegamento a un’immagine'));
  const daVedere = avvisiScheda(f).filter(x => !avvisoVisto(f, x)).length;
  if(daVedere) m.push(daVedere===1 ? tr('la conferma di un avviso') : tr('la conferma di {n} avvisi',{n:daVedere}));
  return m;
}
const testoSpia = m => m.length ? tr('«Pubblica» è spento. Manca: {l}.',{l:m.join('; ')}) : tr('Alla scheda non manca nulla: «Pubblica» è acceso.');
const avvisiHtml = f => avvisiScheda(f).map(x => `<div class="red-riquadro g-avviso" role="note"><b>${esc(x.tit)}</b><span class="meta">${esc(x.testo)}</span>
  <button class="riga-int" data-az="g-visto" data-k="${x.k}" aria-pressed="${avvisoVisto(f, x)}"><span class="casella" aria-hidden="true"></span><div><span class="t">${esc(x.ok)}</span></div></button></div>`).join('');
/* dopo ogni tasto: la spia sotto «Pubblica», il tasto, e gli avvisi se sono cambiati (senza ridisegnare il modulo, che farebbe perdere il punto in cui si scrive) */
function aggiornaSpia(){
  const f = st.aform; if(!f || !f.g || f.per==='ripristino') return;
  const m = giudizioManca(f), spia = $('g-spia'), tasto = document.querySelector('#foglio-slot [data-az="a-pubblica"]'), box = $('g-avvisi');
  if(spia) spia.textContent = testoSpia(m);
  if(tasto) tasto.disabled = m.length>0;
  const firma = avvisiScheda(f).map(x => x.k+':'+x.firma).join('\n');
  if(box && box.dataset.firma!==firma){ box.innerHTML = avvisiHtml(f); box.dataset.firma = firma; }
}

/* ---------- La parte della scheda con le colonne di giudizio ---------- */
function fonteScelta(f){
  const fo = regFonte(f.g.fonte); if(!fo) return;
  /* il campo «Fonte» vuoto, o ancora con il nome messo qui per la fonte scelta prima, prende quello della fonte nuova
     (l'attribuzione chiesta dalla licenza, se c'è); un testo scritto dalla Redazione non si tocca */
  const att = String(f.fonte||'').trim();
  if(!att || att===f.fonteAuto){ f.fonte = (fo.attribuzione || (CODICE_P.test(fo.nome) ? '' : fo.nome)).slice(0, 160); f.fonteAuto = f.fonte; }
  if(fo.tipo!=='social') f.g.post = 'np'; else if(f.g.post==='np') f.g.post = '';
}
function schedaGiudizio(f){
  const g = f.g, s = statoRegistro();
  const testa = `<h3 class="g-tit">${tr('Per il registro delle fonti')}</h3><p class="meta">${tr('Queste risposte non si pubblicano: vanno nella riga del registro delle fonti, che nasce insieme alla pubblicazione. Senza, «Pubblica» resta spento.')}</p>`;
  if(s) return `<div class="g-scheda">${testa}<p class="meta" role="status">${esc(s)}</p></div>`;
  const fo = regFonte(g.fonte), fac = tr('facoltativo');
  const campo = (id, lab, html, nota) => `<div class="stack-s"><label class="etich" for="${id}">${lab}</label>${html}${nota?`<span class="meta">${nota}</span>`:''}</div>`;
  const scelta = (id, c, lab, voci, nota) => campo(id, lab, `<div class="campo"><select id="${id}" data-gcampo="${c}"><option value="">${tr('— Scegli —')}</option>${voci.map(([v, t]) => `<option value="${esc(v)}" ${g[c]===v?'selected':''}>${esc(t)}</option>`).join('')}</select></div>`, nota);
  const testo = (id, c, lab, max, segna, nota, tipo) => campo(id, lab, `<div class="campo"><input id="${id}" data-gcampo="${c}" maxlength="${max}" value="${esc(g[c])}" placeholder="${esc(segna||'')}" autocomplete="off"${tipo?` type="${tipo}"`:''}></div>`, nota);
  const notaFonte = !fo ? tr('La fonte si sceglie dall’elenco del registro. Se è nuova, prima si leggono le condizioni del sito e si aggiunge all’elenco.')
    : !fonteAmmessa(fo) ? tr('Questa fonte non è ammessa: non si usa. Cerca l’organizzatore.')
    : fonteDaRicontrollare(fo) ? tr('Le condizioni di questa fonte sono state lette più di dodici mesi fa: rileggile e aggiorna la data nell’elenco delle fonti.')
    : tr('{t} · condizioni lette il {d}',{t:tr((tipoFonte(fo.tipo)||['', ''])[1]), d:fo.lette})
      + (fo.attribuzione ? ' · '+tr('la licenza chiede questa attribuzione nel campo «Fonte»: {a}',{a:fo.attribuzione}) : '');
  const domande = DIECI_DOMANDE.map(([n, q, no]) => `<div class="g-domanda${g.dom[n]==='stop'?' stop':''}"><label for="g-d${n}"><b>${n}.</b> ${esc(tr(q))}</label>
    <div class="campo"><select id="g-d${n}" data-gdom="${n}" aria-label="${esc(tr('Domanda {n}',{n}))}"><option value="">${tr('— Rispondi —')}</option>${['si'].concat(no).map(v => `<option value="${v}" ${g.dom[n]===v?'selected':''}>${esc(tr(RISPOSTE_DOMANDA[v]))}</option>`).join('')}</select></div></div>`).join('');
  return `<div class="g-scheda">${testa}
    ${campo('g-fonte', tr('Fonte nel registro'), `<div class="campo"><select id="g-fonte" data-gcampo="fonte"><option value="">${tr('— Scegli —')}</option>${REG.dati.fonti.map(x => `<option value="${esc(x.codice)}" ${g.fonte===x.codice?'selected':''}>${esc(etichettaFonte(x))}</option>`).join('')}</select></div>`, esc(notaFonte))}
    <button class="link" data-az="g-fonti">${tr('Apri l’elenco delle fonti')}</button>
    ${testo('g-cons', 'consultazione', tr('Data di consultazione'), 10, '', tr('Il giorno in cui hai letto la pagina dell’evento.'), 'date')}
    ${fo && fo.tipo==='social' ? scelta('g-post', 'post', tr('Post leggibile senza account'), [['si', tr('Sì: l’ho aperto senza accedere e si legge')]], tr('Valgono solo i post che si leggono senza account, nemmeno con quello del progetto; le storie non sono mai fonte (§ 6.4).')) : ''}
    <h3 class="g-tit">${tr('Le dieci domande')}</h3>
    <p class="meta">${tr('Si risponde a tutte, prima di pubblicare (§ 3.4). Basta un no per fermarsi: secondo la domanda si corregge l’evento, serve il consenso diretto, oppure l’evento non si pubblica.')}</p>
    ${g.domFile ? `<div class="red-riquadro" role="note"><b>${tr('Dal file: «{e}»',{e:esc(g.domFile)})}</b><span class="meta">${tr('È l’esito scritto nel file. Se rispondi qui a una domanda, vale la risposta domanda per domanda.')}</span></div>` : ''}
    <div class="g-domande">${domande}</div>
    <details class="g-regole"><summary>${tr('Le regole di scrittura, a portata di mano')}</summary>
      <ul><li>${tr('Il testo riporta fatti: che cosa, dove, quando, chi organizza, come si partecipa. Nessun giudizio su persone ed enti.')}</li>
      <li>${tr('La descrizione si riscrive con parole proprie, anche quando arriva dall’organizzatore; nessun brano di testi altrui, nessuna immagine.')}</li>
      <li>${tr('Gratuità, accessibilità del luogo, età minima: solo se la fonte le dichiara, e attribuite alla fonte («secondo l’organizzatore»).')}</li>
      <li>${tr('Un nome di persona solo se serve a partecipare e solo nel suo ruolo (relatore, artista, referente). Mai recapiti personali, mai i nomi di chi partecipa, mai il nome di un minore.')}</li>
      <li>${tr('Eventi politici e religiosi: attribuiti all’ente, senza nomi di persone fisiche, salvo consenso esplicito.')}</li>
      <li>${tr('Mai «verificato» o «ufficiale» per un evento soltanto ripreso; mai «autorizzato», «in regola», «sicuro», «a norma».')}</li>
      <li>${tr('Il campo «Fonte:» indica la fonte reale, quella di grado più alto, non un passaggio intermedio né chi ha segnalato l’evento.')}</li>
      <li>${tr('Se le fonti non concordano su data, ora o luogo e il contrasto non si risolve, l’evento non si pubblica.')}</li></ul></details>
    <h3 class="g-tit">${tr('Che cosa hai ripreso')}</h3>
    <div class="g-elementi" role="group" aria-label="${esc(tr('Elementi ripresi'))}">${ELEMENTI_RIPRESI.map(([k, t]) => `<button class="chip-in" data-az="g-elemento" data-k="${k}" aria-pressed="${!!g.elementi[k]}">${esc(tr(t))}</button>`).join('')}</div>
    ${scelta('g-nomi', 'nomi', tr('Nomi di persone'), [['no', tr('Nessun nome')], ['si', tr('Sì, con il solo ruolo')]])}
    ${g.nomi==='si' ? testo('g-ruoli', 'ruoli', tr('Ruolo delle persone nominate'), 120, tr('relatore, artista, referente'), tr('Qui si scrive il ruolo, mai il nome: nel registro i nomi non si copiano.'))
      + testo('g-titoloreg', 'titoloReg', `${tr('Titolo per il registro')} <span class="fac">${fac}</span>`, 100, tr('Concerto di [artista]'), tr('Solo se il titolo contiene il nome di una persona: riscrivilo con il ruolo al posto del nome. Vuoto, vale il titolo dell’evento.')) : ''}
    ${scelta('g-politico', 'politico', tr('Evento politico o religioso'), [['no', tr('No')], ['si', tr('Sì')]], tr('Conta lo scopo dell’evento, non il luogo: un concerto in una chiesa non è un evento religioso. Se sì, l’evento si attribuisce all’ente e i nomi di persone fisiche compaiono solo con il consenso esplicito.'))}
    ${scelta('g-avviso', 'avviso', tr('Avviso all’organizzatore'), Object.entries(AVVISI_ORG).map(([v, t]) => [v, tr(t)]), tr('All’organizzatore di cui si conosce un recapito di lavoro si manda l’avviso di pubblicazione (§ 3.3). Data e canale si annotano nel registro.'))}
    ${g.avviso==='inviato' ? `<div class="due">${testo('g-avvdata', 'avvisoData', tr('Avviso inviato il'), 10, '', '', 'date')}${testo('g-avvcanale', 'avvisoCanale', tr('Canale'), 40, tr('posta, messaggio…'))}</div>` : ''}
    ${g.avviso==='dopo' || g.avviso==='inviato' ? testo('g-k', 'k', `${tr('Recapito dell’organizzatore (codice K)')} <span class="fac">${fac}</span>`, 12, 'K-0001', tr('Il codice dell’elenco dei contatti: nel registro il recapito non si copia.')) : ''}
    ${serveConsenso(g) || g.consenso || f.nascosto ? testo('g-consenso', 'consenso', tr('Prova del consenso (codice C)'), 12, 'C-0001', tr('Il codice della riga del registro dei consensi dove sta la prova.')) : ''}
    <div id="g-avvisi" data-firma="${esc(avvisiScheda(f).map(x => x.k+':'+x.firma).join('\n'))}">${avvisiHtml(f)}</div></div>`;
}
/* il tasto «Pubblica» e la spia sotto, per il modulo dell'evento */
const spiaHtml = f => `<p class="meta g-spia" id="g-spia" role="status">${esc(testoSpia(giudizioManca(f)))}</p>`;

/* ---------- Gli eventi preparati ---------- */
/* «nascosto» resta tra i preparati, la password no: non va in nessun registro (§ 18.4), e alla ripresa l'app ne genera una nuova */
const CAMPI_PREPARATI = ['id', 'titolo', 'strato', 'sub', 'tema', 'inizio', 'fine', 'luogo', 'indirizzo', 'addrFull', 'precision', 'hn', 'comeArrivare', 'organizzatore', 'desc', 'prezzo', 'fonte', 'fonteLink', 'testoCal', 'nascosto'];
function preparaScheda(){
  const f = st.aform; if(!f || f.per==='ripristino' || PB.lavoro) return;
  if(REG.stato!=='aperto'){ f.errori = [statoRegistro()]; disegnaFoglio(); return; }
  if(!String(f.titolo||'').trim()){ f.err = {titolo:1}; f.errori = [tr('Titolo: per salvare la scheda tra i preparati serve almeno il titolo.')]; disegnaFoglio(); mostraErroriPb(); return; }
  const d = REG.dati, dati = {}; CAMPI_PREPARATI.forEach(k => { dati[k] = f[k]==null ? '' : f[k]; });
  dati.pos = f.pos ? {lat:f.pos.lat, lng:f.pos.lng} : null;
  let p = f.prep ? d.preparati.find(x => x.codice===f.prep) : null;
  if(!p){ p = {codice:regCodice('PR', d.prossimi.p++, 4), canale:'singolo'}; d.preparati.push(p); }
  Object.assign(p, {salvato:new Date().toISOString(), dati, g:JSON.parse(JSON.stringify(f.g))});
  PB.lavoro = true; disegnaFoglio();
  regSalva().then(() => { PB.lavoro = false; st.aform = null; PB.msg = tr('Scheda salvata tra i preparati: resta su questo dispositivo, cifrata, finché non la pubblichi o non la togli.');
      if(f.per==='importa'){ rigaPreparata(f.imp); apri('pb-importa'); return; }
      st.foglio = 'pubblica'; aggiornaPb(); },
    () => { PB.lavoro = false; f.errori = [tr('Non sono riuscito a salvare il registro delle fonti su questo dispositivo.')]; disegnaFoglio(); });
}
function apriPreparato(codice){
  const p = REG.dati && REG.dati.preparati.find(x => x.codice===codice); if(!p) return;
  apriEventoForm(null, 'pubblica');
  const f = st.aform, dati = p.dati||{};
  CAMPI_PREPARATI.forEach(k => { if(k==='id') f.id = typeof dati.id==='string' && dati.id ? dati.id : null; else f[k] = typeof dati[k]==='string' ? dati[k] : ''; });
  f.pos = dati.pos && isFinite(dati.pos.lat) && isFinite(dati.pos.lng) ? {lat:+dati.pos.lat, lng:+dati.pos.lng} : null;
  f.g = giudizioInForma(p.g); f.prep = p.codice; disegnaFoglio();
}
function togliPreparato(codice){
  const d = REG.dati; if(!d) return Promise.resolve();
  d.preparati = d.preparati.filter(x => x.codice!==codice); return regSalva().catch(() => {});
}
const preparatiHtml = () => {
  if(REG.stato!=='aperto') return REG.stato ? `<p class="meta" role="status">${esc(statoRegistro())}</p>` : '';
  const P = REG.dati.preparati; if(!P.length) return '';
  return `<p class="etich">${tr('Preparati, non ancora pubblicati')} · ${P.length}</p><div class="menu-lista">${P.map(p => { const d = p.dati||{};
    return `<div class="menu-r" style="cursor:default"><button class="g-prep" data-pbprep="${esc(p.codice)}"><span class="t">${esc(d.titolo||tr('Senza titolo'))}</span><span class="meta">${esc(d.inizio ? giornoOra(d.inizio) : tr('senza data'))}${d.luogo ? ' · '+esc(d.luogo) : ''}</span></button><button class="link" data-az="g-prep-togli" data-c="${esc(p.codice)}">${PB.togliPrep===p.codice ? tr('Tocca ancora per togliere') : tr('Togli')}</button></div>`; }).join('')}</div>
    <p class="meta">${tr('Le schede preparate stanno solo su questo dispositivo, cifrate con la chiave del registro. Nessuna è sulla mappa.')}</p>`;
};

/* ---------- Tocchi e campi ---------- */
function clickScheda(t){
  const d = t.dataset;
  if(d.pbfonte){ apriFonte(d.pbfonte); return true; }
  if(d.pbprep){ PB.togliPrep = null; apriPreparato(d.pbprep); return true; }
  return false;
}
function azioneScheda(az, t){
  const f = st.aform;
  switch(az){
    case 'pb-fonti': PB.fonte = null; PB.errore = ''; regApri().then(ridisegnaPb); apri('pb-fonti'); break;
    case 'g-fonti': PB.fonte = null; PB.errore = ''; PB.msg = ''; apri('pb-fonti'); break;
    case 'g-torna': apri(st.aform ? 'aform' : 'pubblica'); break;
    case 'pb-fonte-nuova': apriFonte(null); break;
    case 'pb-fonte-salva': salvaFonte(); break;
    case 'g-elemento': if(f && f.g){ f.g.elementi[t.dataset.k] = f.g.elementi[t.dataset.k] ? 0 : 1; t.setAttribute('aria-pressed', String(!!f.g.elementi[t.dataset.k])); aggiornaSpia(); } break;
    case 'g-visto': if(f && f.g){ const x = avvisiScheda(f).find(y => y.k===t.dataset.k); if(x){ if(avvisoVisto(f, x)) delete f.g.visti[x.k]; else f.g.visti[x.k] = x.firma; t.setAttribute('aria-pressed', String(avvisoVisto(f, x))); aggiornaSpia(); } } break;
    case 'g-prepara': preparaScheda(); break;
    case 'g-prep-togli': { const c = t.dataset.c; if(PB.togliPrep!==c){ PB.togliPrep = c; disegnaFoglio(); break; }
      PB.togliPrep = null; togliPreparato(c).then(() => { PB.msg = tr('Scheda tolta dai preparati.'); ridisegnaPb(); }); break; }
    default: return false;
  }
  return true;
}
function inputScheda(el){
  const d = el.dataset;
  if(d.fcampo && PB.fonte){ PB.fonte[d.fcampo] = el.value; return true; }
  if(d.fpunto && PB.fonte){ PB.fonte.punti[d.fpunto] = el.value; return true; }
  if(inputRegistro(el)) return true;
  if(d.gcampo && st.aform && st.aform.g && el.tagName!=='SELECT'){ st.aform.g[d.gcampo] = el.value; aggiornaSpia(); return true; }
  return false;
}
function cambioScheda(el){
  const d = el.dataset, f = st.aform;
  if(d.fcampo && PB.fonte){ PB.fonte[d.fcampo] = el.value;
    /* scelto il tipo, il grado di partenza è quello dell'ordine delle fonti (§ 5.4): si può cambiare */
    if(d.fcampo==='tipo'){ const t = tipoFonte(el.value); if(t && !PB.fonte.grado) PB.fonte.grado = t[2]; disegnaFoglio(); }
    return true; }
  if(d.fpunto && PB.fonte){ PB.fonte.punti[d.fpunto] = el.value; return true; }
  if(cambioRegistro(el)) return true;
  if(!f || !f.g) return false;
  if(d.gdom){ if(el.value) f.g.dom[d.gdom] = el.value; else delete f.g.dom[d.gdom]; delete f.g.domFile; disegnaFoglio(); return true; }
  if(d.gcampo){ f.g[d.gcampo] = el.value; if(d.gcampo==='fonte') fonteScelta(f); if(el.tagName==='SELECT') disegnaFoglio(); else aggiornaSpia(); return true; }
  return false;
}

/* ======================= Eventi nascosti nell'app della redazione (T-045) =======================
   Libro mastro: § 2.3 (eventi nascosti); § 3.3, passo 4 (consenso dell'organizzatore, prima di pubblicare); § 3.11
   (cifratura sul dispositivo); § 3.14 (le password si cancellano quando l'evento finisce); § 9.2 (a che cosa servono:
   niente ritrovi privati né manifestazioni; i casi in luogo pubblico li valuta la Redazione); allegato A, A.2, punto 10;
   allegato C, C.2 (i due messaggi all'organizzatore). Documento: docs/eventi-nascosti.md.

   Il modulo dell'evento (pubblicazione.js) ha la casella «Evento nascosto». Accesa: l'app genera la password (cinque
   parole a caso, sorgenti/moduli/nascosti.js e parole-nascosti.js; decisione del 25/11/2026), chiede il codice C del
   consenso e ricorda le regole del § 9.2. «Pubblica» cifra l'evento su questo dispositivo, mette la password nella
   cassaforte (CHIAVI.cassaforte) e manda allo sportello soltanto il file illeggibile, con il nome che si ricava dalla
   password e il giorno in cui l'evento esce dalla mappa. Poi mostra la password con «Copia la password» e «Copia il
   messaggio di conferma» (il testo C.2), da mandare all'organizzatore sul canale del consenso. La password non va in
   nessun registro: nella riga del registro delle fonti c'è solo «Evento nascosto: sì».

   Lo sportello conosce gli eventi nascosti soltanto cifrati. Questo dispositivo li apre con le password della sua
   cassaforte (NR.chiari) per mostrarli nell'elenco, correggerli (stessa password), contarli nelle Misure (decisione del
   25/11/2026: come gli altri, con città e strato). Un evento nascosto di cui qui non c'è la password si può sospendere,
   riattivare o ritirare, non correggere. Nessun evento nascosto si importa da un file Excel (importa-excel.js).

   Testi come testo (T-024): titoli e password entrano nella pagina solo con esc(). */
const NR = {chiari:new Map(), fatto:null, copiato:''};

/* Apre con le password della cassaforte le voci nascoste lette dallo sportello: {id, impronta, giorno, file}. */
async function nrDecifra(voci){
  for(const x of voci || []){
    const v = JSON.stringify(x.file), c = NR.chiari.get(x.id);
    if(c && c.v===v) continue;
    let pw = null; try{ pw = await CHIAVI.cassaforte.leggi(x.id); }catch(e){ pw = null; }
    if(!pw){ NR.chiari.delete(x.id); continue; }
    try{ NR.chiari.set(x.id, {ev:await MODULI.nascosti.decifra(x.file, pw, null, x.impronta), pw, v}); }catch(e){ NR.chiari.delete(x.id); }
  }
}
const nrVoci = s => s ? (s.nascosti||[]).concat(s.nascostiSospesi||[]) : [];
/* Gli eventi nascosti pubblicati (non sospesi) che questo dispositivo sa aprire: per le Misure. */
function nrPerMisure(){
  if(typeof SPORTELLO==='undefined' || !SPORTELLO) return Promise.resolve([]);
  return SPORTELLO.chiedi({operazione:'stato'}).then(s => nrDecifra(s.nascosti).then(() => (s.nascosti||[]).map(x => NR.chiari.get(x.id)).filter(Boolean).map(c => c.ev)), () => []);
}

/* Il messaggio di conferma del modello C.2, con titolo e password. */
const messaggioC2 = (titolo, pw) => tr('Grazie! Abbiamo pubblicato «{t}» come evento nascosto. La password è {p}: condividila soltanto con chi vuoi invitare. Per togliere l’evento basta scriverci.',{t:titolo, p:pw});
/* Password e tasti per copiarla, dopo la pubblicazione e nella scheda dell'evento. */
function riquadroPassword(id, titolo, pw, testa, altro){
  return `<div class="red-riquadro nr-consegna" role="note"><b>${testa}</b>
    <p class="nr-password"><code>${esc(pw)}</code></p>
    <span class="meta">${tr('Si consegna all’organizzatore con il messaggio di conferma (allegato C, C.2), sul canale del consenso. Resta nella cassaforte di questo dispositivo fino alla fine dell’evento, poi si cancella da sola. Non va scritta in nessun registro.')}</span>
    <div class="tasti"><button class="tasto sec" data-az="nr-copia-pw" data-id="${esc(id)}">${NR.copiato==='pw|'+id ? tr('Password copiata') : tr('Copia la password')}</button><button class="tasto sec" data-az="nr-copia-msg" data-id="${esc(id)}">${NR.copiato==='msg|'+id ? tr('Messaggio copiato') : tr('Copia il messaggio di conferma')}</button>${altro||''}</div></div>`;
}
/* Dopo la pubblicazione di un evento nascosto, in cima alla schermata «Pubblicazione». */
const nrFattoHtml = () => !NR.fatto ? '' : riquadroPassword(NR.fatto.id, NR.fatto.titolo, NR.fatto.pw, tr('Evento nascosto pubblicato: «{t}». Ecco la password',{t:esc(NR.fatto.titolo)}),
  `<button class="tasto pri" data-az="nr-fatto-ok">${tr('Fatto')}</button>`);

/* La casella e il riquadro del modulo dell'evento. */
function casellaNascosto(f){
  if(f.id && !f.nascosto) return '';
  const on = !!f.nascosto;
  if(on && !f.pw) f.pw = MODULI.nascosti.genera(MODULI.paroleNascosti);
  const riquadro = !on ? '' : `<div class="red-riquadro nr-regole" role="note"><b>${tr('Evento nascosto')}</b>
      <span class="meta">${tr('Leggibile solo da chi ha la password (§ 2.3). Si usa per eventi socioculturali di dimensioni contenute, annunciati altrove dall’organizzatore, di cui si tiene riservato il luogo o un altro dettaglio. Mai per ritrovi privati, che restano Off-Grid, né per cortei, presidi o manifestazioni (§ 9.2).')}</span>
      <span class="meta">${tr('Se si svolge in luogo pubblico, valuta caso per caso se può essere una riunione in luogo pubblico e se custodirne il luogo farebbe di noi il suo canale riservato; annota la valutazione e le sue ragioni nelle note della voce del registro dei consensi.')}</span>
      <span class="meta">${tr('Prima di pubblicare serve il consenso dell’organizzatore (messaggio C.2), con il suo codice C qui sotto. La password si consegna dopo la pubblicazione, con il messaggio di conferma.')}</span>
      <span class="etich">${tr('Password generata dall’app')}</span><p class="nr-password"><code>${esc(f.pw)}</code></p>
      ${f.id ? `<span class="meta">${tr('Una correzione tiene la stessa password: chi ha già sbloccato l’evento vede la correzione.')}</span>` : `<button class="link" data-az="nr-altra">${tr('Generane un’altra')}</button>`}</div>`;
  return `${f.id ? '' : `<button class="riga-int" data-az="nr-nascosto" aria-pressed="${on}"><span class="casella" aria-hidden="true"></span><div><span class="t">${tr('Evento nascosto')}</span><span class="meta">${tr('Leggibile solo con la password: il contenuto si cifra su questo dispositivo.')}</span></div></button>`}${riquadro}`;
}

/* «Pubblica» per un evento nascosto: ev è già nel formato pubblico e controllato (pubblicazione.js). */
function pubblicaNascosto(f, ev){
  const N = MODULI.nascosti, nuovo = !f.id, g = f.g, prepScheda = f.prep, pw = N.forma(f.pw), titolo = ev.titolo;
  if(PB.lavoro) return;
  PB.lavoro = true; PB.errore = ''; ridisegnaPb();
  (async () => {
    const imp = await N.impronta(pw);
    /* la password non deve essere già usata da un altro evento nascosto (§ 2.3): lo sportello lo controlla comunque */
    if(nuovo){ const s = await SPORTELLO.chiedi({operazione:'stato'}); if(nrVoci(s).some(x => x.impronta===imp)) throw Object.assign(new Error('impronta'), {motivo:'impronta'}); }
    const {file} = await N.cifra(ev, pw, null, imp);
    /* la password entra nella cassaforte prima di partire: se lo sportello rifiuta, per un evento nuovo si toglie */
    if(nuovo) await CHIAVI.cassaforte.metti(ev.id, pw, FORMATO.fineMs(ev));
    const rp = await regPrepara([{ev, g, titolo:g.nomi==='si' && g.titoloReg.trim() ? g.titoloReg.trim() : titolo, canale:'singolo', correzione:!nuovo, nascosto:true}]);
    return {voce:{id:ev.id, impronta:imp, giorno:N.giornoUscita(ev), file}, rp, file};
  })().then(({voce, rp, file}) => { PB.lavoro = false;
    return scriviPb(conRegistro({operazione:'scrivi', nascosti:[voce]}, rp), r => {
      st.aform = null; st.ultimoId = ev.id; registra(nuovo ? 'pubblica' : 'correggi', {id:ev.id, s:ev.strato}); if(!nuovo) misureConta('corretti');
      NR.chiari.set(ev.id, {ev, pw, v:JSON.stringify(file)}); NR.fatto = nuovo ? {id:ev.id, titolo, pw} : null; NR.copiato = '';
      if(!nuovo) CHIAVI.cassaforte.metti(ev.id, pw, FORMATO.fineMs(ev)).catch(() => {});
      const codice = ((r.registro||{}).codici||{})[ev.id] || '';
      regConferma(rp, (r.registro||{}).codici).then(() => prepScheda ? togliPreparato(prepScheda) : null)
        .catch(() => { PB.errore = tr('L’evento è pubblicato e la riga {c} è allo sportello, ma non sono riuscito a salvarla nel registro di questo dispositivo.',{c:codice}); ridisegnaPb(); });
      return (nuovo ? tr('Evento nascosto pubblicato alle {o} (ora dello sportello).',{o:oraPb(r.quando)}) : tr('Correzione dell’evento nascosto pubblicata alle {o} (ora dello sportello).',{o:oraPb(r.quando)}))
        + (codice ? ' '+tr('Riga {c} nel registro delle fonti.',{c:codice}) : '');
    }).then(ok => { if(!ok && nuovo) CHIAVI.cassaforte.togli(ev.id).catch(() => {}); });
  }, e => {
    PB.lavoro = false; if(nuovo) CHIAVI.cassaforte.togli(ev.id).catch(() => {});
    if(st.aform!==f) return;
    f.errori = [e && e.motivo==='impronta' ? tr('Questa password è già usata da un altro evento nascosto: tocca «Generane un’altra» e riprova.')
      : e && e.motivo ? errorePb(e) : tr('Non sono riuscito a cifrare l’evento o a preparare la riga del registro delle fonti: non pubblico.')];
    disegnaFoglio(); mostraErroriPb();
  });
}

/* ---------- Tocchi ---------- */
function azioneNascosti(az, t){
  const f = st.aform, id = t && t.dataset ? t.dataset.id : '';
  const chiaro = id ? (NR.fatto && NR.fatto.id===id ? {ev:{titolo:NR.fatto.titolo}, pw:NR.fatto.pw} : NR.chiari.get(id)) : null;
  const copia = (k, testo) => copiaTesto(testo).then(ok => { NR.copiato = ok ? k+'|'+id : ''; ridisegnaPb(); });
  switch(az){
    case 'nr-nascosto': if(f && !f.id){ f.nascosto = f.nascosto ? '' : '1'; f.pw = ''; disegnaFoglio(); aggiornaSpia(); } return true;
    case 'nr-altra': if(f && !f.id && f.nascosto){ f.pw = MODULI.nascosti.genera(MODULI.paroleNascosti); disegnaFoglio(); } return true;
    case 'nr-copia-pw': if(chiaro) copia('pw', chiaro.pw); return true;
    case 'nr-copia-msg': if(chiaro) copia('msg', messaggioC2(chiaro.ev.titolo, chiaro.pw)); return true;
    case 'nr-fatto-ok': NR.fatto = null; NR.copiato = ''; disegnaFoglio(); return true;
  }
  return false;
}

/* ======================= Importazione dal file Excel degli eventi (T-042) =======================
   Libro mastro: § 2.2, canale 2 (anteprima, esclusione singola, indirizzi non trovati in un elenco a parte, punto
   messo a mano); § 5.2 («negli eventi importati in blocco ogni riga sia vista nell'anteprima»: decisione del
   24/11/2026, un segno per riga); §§ 3.4-3.6; § 5.3 (la fonte di ogni evento, mai il nome del file); § 6.2.

   Il file è quello «Eventi da importare» consegnato il 13/11/2026 (o un .csv con le stesse intestazioni): foglio «Eventi»,
   colonne blu (l'evento) e verdi (il registro delle fonti), riconosciute dal nome dell'intestazione. Si legge con il
   modulo nostro dei file Excel (sorgenti/moduli/excel.js) e non si conserva: le righe stanno nella memoria della
   pagina finché questa schermata è aperta.

   Ogni riga finisce in uno di quattro gruppi:
   - rifiutate, con il motivo, come nel foglio «Controllo» del file: immagine o password compilate, «Nascosto» diverso
     da «No», titolo, strato, data o ora mancanti o illeggibili, evento già finito o già pubblicato. Si correggono nel
     file e si importa di nuovo;
   - da sistemare: manca qualcosa che si può scrivere qui (descrizione, fonte, codice FS che non è nell'elenco delle
     fonti, colonne di giudizio, conferma di un avviso sui recapiti o sulle parole): «Correggi» apre la scheda di
     pubblicazione con la riga, e «Tieni nell'importazione» la riporta qui;
   - indirizzi non trovati: la ricerca (Photon, dal dispositivo della redazione, uno al secondo: T-008) non li trova;
     «Metti il punto» apre la scheda, dove si sceglie il punto sulla mappa e si può scrivere «Come arrivare»;
   - pronte: si guardano una per una e si segnano «L'ho vista: pubblicala». Una riga non segnata resta fuori.
   «Pubblica» manda in un solo pacchetto firmato le righe segnate, con le loro righe del registro delle fonti (canale
   «file Excel»). Nessuna pubblicazione automatica.

   Testi come testo (T-024): ogni testo del file entra nella pagina solo con esc(). */
const IX = {stato:null};   /* {nome, fase: 'leggo'|'cerco'|'pronto', righe, fatti, daCercare, lavoro, errore, msg} */
const COLONNE_FILE = {
  'titolo':'titolo', 'strato':'strato', 'sottostrato':'sub', 'descrizione':'desc', 'data':'data', 'ora inizio':'oraInizio', 'ora fine':'oraFine', 'durata':'durata',
  'prezzo':'prezzo', 'indirizzo':'indirizzo', 'latitudine':'lat', 'longitudine':'lng', 'link':'link', 'immagine':'immagine', 'nascosto':'nascosto', 'password':'password',
  'provenienza':'provenienza', 'fonte':'fonte', 'organizzatore':'organizzatore', 'luogo':'luogo', 'nome del luogo':'luogo', 'come arrivare':'comeArrivare',
  'fonte codice fs':'fs', 'data di consultazione':'consultazione', 'post leggibile senza account':'post', 'dieci domande':'dieci', 'domande e correzioni':'correzioni',
  'nomi ripresi':'nomi', 'evento politico o religioso':'politico', 'prova del consenso codice c':'consenso', 'recapito dell organizzatore per l avviso codice k':'k'};
const ID_PROVVISORIO = 'importazioneprov-aaaaaaaa';   /* solo per il controllo del formato: l'identificativo vero nasce alla pubblicazione */
const cellaTesto = v => v==null ? '' : typeof v==='number' ? String(v) : String(v).trim();
const minutiDurata = v => { const t = cellaTesto(v).toLowerCase().replace(',', '.'); let m;
  if(typeof v==='number' && v>0 && v<1) return Math.round(v*1440);
  if((m = t.match(/^(\d+)[:.](\d{2})$/))) return +m[1]*60 + +m[2];
  if((m = t.match(/^(\d+(?:\.\d+)?)\s*(h|ore|ora)?\s*(?:(\d+)\s*(m|min|minuti)?)?$/))) return m[2] || !m[4] && +m[1]<=12 ? Math.round(+m[1]*60) + (+m[3]||0) : +m[1];
  if((m = t.match(/^(\d+)\s*(m|min|minuti)$/))) return +m[1];
  return null; };

/* ---------- Dalla riga del file alla scheda ---------- */
function rigaDalFile(o){
  const R = {riga:o.__riga, stato:'', motivi:[], note:[], vista:false, f:null}, no = m => { R.stato = 'rifiutata'; R.motivi.push(m); };
  const t = k => cellaTesto(o[k]);
  /* le colonne che il file deve lasciare vuote (§§ 2.3, 2.4, 6.2) */
  if(t('immagine')) no(tr('colonna «Immagine» compilata: le immagini non si pubblicano'));
  if(t('password')) no(tr('colonna «Password» compilata: nessuna password in un file'));
  if(t('nascosto') && normT(t('nascosto'))!=='no') no(tr('«Nascosto» diverso da «No»: gli eventi nascosti non si importano da file'));
  const titolo = t('titolo'); if(!titolo) no(tr('manca il titolo'));
  const l = trovaStrato(o.strato); if(!l) no(t('strato') ? tr('strato «{s}» non riconosciuto',{s:t('strato').slice(0, 80)}) : tr('manca lo strato'));
  const g = leggiData(o.data); if(!g) no(t('data') ? tr('data non leggibile') : tr('manca la data'));
  const h = leggiOra(o.oraInizio); if(!h) no(t('oraInizio') ? tr('ora di inizio non leggibile') : tr('manca l’ora di inizio'));
  if(R.stato) return R;
  const inizio = g+'T'+h, hf = leggiOra(o.oraFine);
  let fine = ''; if(o.fineIso && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(o.fineIso) && o.fineIso > inizio) fine = o.fineIso;   /* un calendario dei Comuni: la fine in un altro giorno (T-044) */
  else if(hf){ fine = g+'T'+hf; if(fine<=inizio) fine = piuGiorni(g,1)+'T'+hf; }
  else { const m = minutiDurata(o.durata); if(m && m>0 && m<=1440) fine = new Date(Date.parse(inizio+':00Z') + m*6e4).toISOString().slice(0, 16); }   /* ora italiana più i minuti, come sull'orologio */
  if(FORMATO.uscitaMs({inizio, fine:fine||undefined}) <= Date.now()) { no(tr('l’evento è già finito')); return R; }
  const sub = trovaSub(l, o.sub);
  if(t('sub') && !sub) R.note.push(tr('sottostrato «{s}» non riconosciuto: lasciato vuoto',{s:t('sub').slice(0, 80)}));
  const lat = numero(o.lat), lng = numero(o.lng), coord = lat!=null && lng!=null && (lat || lng);
  const indirizzo = t('indirizzo').slice(0, 200);
  if(!coord && indirizzo.length<3){ no(tr('manca l’indirizzo (o latitudine e longitudine)')); return R; }
  /* la scheda: gli stessi campi del modulo dell'evento (pubblicazione.js), più il giudizio dalle colonne verdi */
  const f = {per:'importa', id:null, titolo:titolo.slice(0, 100), strato:l.id, sub:sub ? sub.id : '', tema:'', inizio, fine, luogo:(t('luogo') || indirizzo).slice(0, 120), luogoDaIndirizzo:!t('luogo'),
    indirizzo, addrFull:indirizzo, pos:coord ? {lat:Math.round(lat*1e6)/1e6, lng:Math.round(lng*1e6)/1e6} : null, precision:coord ? 'map' : '', hn:'', comeArrivare:t('comeArrivare').slice(0, 300),
    organizzatore:t('organizzatore').slice(0, 120), desc:t('desc').slice(0, 2000), prezzo:t('prezzo').slice(0, 80), fonte:t('fonte').slice(0, 160), fonteLink:t('link').slice(0, 500), err:{}, errori:[], imp:R.riga};
  const gi = giudizioNuovo(); gi.daFile = true;
  gi.fonte = t('fs').toUpperCase().replace(/\s+/g, '');
  const dc = leggiData(o.consultazione); if(dc) gi.consultazione = dc; else gi.consultazione = '';
  const post = normT(t('post')); gi.post = /^si/.test(post) ? 'si' : post ? 'np' : '';
  const dieci = normT(t('dieci'));
  if(dieci==='tutte superate') DIECI_DOMANDE.forEach(([n]) => { gi.dom[n] = 'si'; });
  else if(dieci==='correzione applicata') gi.domFile = ('Correzione applicata: '+t('correzioni')).slice(0, 200);
  else if(dieci==='consenso diretto chiesto') gi.domFile = 'Consenso diretto chiesto';
  const nomi = normT(t('nomi')); gi.nomi = nomi==='nessun nome' ? 'no' : /^si/.test(nomi) ? 'si' : '';
  const pol = normT(t('politico')); gi.politico = pol==='no' ? 'no' : pol==='si' ? 'si' : '';
  gi.consenso = t('consenso').toUpperCase().replace(/\s+/g, '').slice(0, 12);
  gi.k = t('k').toUpperCase().replace(/\s+/g, '').slice(0, 12); gi.avviso = gi.k ? 'dopo' : 'nessuno';
  f.g = gi; R.f = f;
  return R;
}
/* lo stato di una riga che non è rifiutata: indirizzo da trovare, da sistemare o pronta */
function valutaRiga(R){
  if(R.stato==='rifiutata' || R.stato==='pubblicata' || R.stato==='preparata') return;
  const f = R.f; R.motivi = [];
  if(!f.pos){ R.stato = 'indirizzo'; R.motivi.push(tr('indirizzo non trovato: metti il punto sulla mappa')); return; }
  const ev = eventoDalForm(f, ID_PROVVISORIO), formato = FORMATO.controlla(ev, {vocabolario:FORMATO.vocabolario(LAYERS, TEMI_VOC)}).map(erroreCampoPb);
  const manca = giudizioManca(f);
  R.motivi = formato.concat(manca.length ? [testoSpia(manca)] : []);
  if(!R.motivi.length && !f.id && PB.stato && PB.stato.eventi.concat(PB.stato.sospesi).some(e => normT(e.titolo)===normT(ev.titolo) && e.inizio===ev.inizio)){ R.stato = 'rifiutata'; R.motivi = [tr('c’è già tra i pubblicati, con lo stesso titolo e lo stesso inizio')]; return; }
  R.stato = R.motivi.length ? 'sistemare' : 'pronta';
  if(R.stato!=='pronta') R.vista = false;
}

/* ---------- Leggere il file ---------- */
function importaExcel(file){
  const nome = String(file.name||'');
  IX.stato = {nome, fase:'leggo', righe:[], fatti:0, daCercare:0, lavoro:false, errore:'', msg:''};
  const I = IX.stato; PB.errore = ''; PB.msg = '';
  if(st.sezione!=='mappa') vaiSezione('mappa'); apri('pb-importa');
  Promise.all([file.arrayBuffer().then(b => MODULI.excel.leggi(b, nome)), regApri(), PB.stato ? null : aggiornaPb().catch(() => null)]).then(([wb]) => {
    if(IX.stato!==I) return;
    const foglioE = wb.fogli.find(x => normT(x.nome)==='eventi') || wb.fogli[0], righe = foglioE.righe;
    const iTesta = righe.findIndex(r => (r||[]).filter(c => COLONNE_FILE[normT(c)]).length >= 3);
    if(iTesta<0){ I.fase = 'pronto'; I.errore = tr('Nel file non trovo le colonne del foglio «Eventi»: parti dal file «Eventi da importare» o dal modello.'); ridisegnaIx(); return; }
    const mappa = righe[iTesta].map(c => COLONNE_FILE[normT(c)] || null);
    righe.slice(iTesta+1).forEach((r, k) => {
      if(!(r||[]).some(c => cellaTesto(c))) return;
      const o = {__riga:iTesta+k+2}; mappa.forEach((c, j) => { if(c) o[c] = (r||[])[j]; });
      I.righe.push(rigaDalFile(o));
    });
    if(!I.righe.length){ I.fase = 'pronto'; I.errore = tr('Nel foglio «Eventi» non ci sono righe compilate.'); ridisegnaIx(); return; }
    cercaEValuta(I);
  }).catch(e => { if(IX.stato!==I) return; I.fase = 'pronto';
    I.errore = e && e.motivo==='righe' ? tr('Il file ha più di 10.000 righe: dividilo in più file.') : tr('Il file non si legge: controlla che sia un foglio .xlsx o .csv (un file .ods va prima salvato come .xlsx).'); ridisegnaIx(); });
}
const ridisegnaIx = () => { if(st.foglio==='pb-importa') disegnaFoglio(); };
/* le righe senza coordinate cercano l'indirizzo, uno al secondo (T-008); le altre si valutano subito. Serve anche ai calendari dei Comuni (T-044). */
function cercaEValuta(I){
  I.righe.forEach(R => { if(R.stato==='pubblicata') return; if(R.stato!=='rifiutata' && R.f && !R.f.pos) R.daCercare = true; else valutaRiga(R); });
  const daCercare = I.righe.filter(R => R.daCercare); I.daCercare = daCercare.length; I.fase = daCercare.length ? 'cerco' : 'pronto'; ridisegnaIx();
  (async () => {
    for(const R of daCercare){
      if(IX.stato!==I) return;
      const q = R.f.indirizzo, pa = parseAddr(q);
      let x = null; try{ const res = await lookup(pa.city ? q : q+', '+cittaObj().n); x = res.list[0]; }catch(e){ x = null; }
      if(IX.stato!==I) return;
      if(x){ R.f.pos = {lat:x.lat, lng:x.lng}; R.f.addrFull = testoRisultato(x); R.f.precision = x.precision||'exact'; R.f.hn = x.hn||''; }
      delete R.daCercare; valutaRiga(R); I.fatti++; ridisegnaIx();
      await new Promise(ok => setTimeout(ok, 1000));
    }
    if(IX.stato!==I) return;
    I.fase = 'pronto'; ridisegnaIx();
  })();
}

/* ---------- La schermata ---------- */
function fPbImporta(){
  const I = IX.stato;
  const testa = `<div class="riga-titolo"><div><h2>${I && I.canale==='calendario' ? tr('Calendario del Comune') : tr('Importa da Excel')}</h2><p class="meta">${I ? esc(I.nome)+(I.fonte ? ' · '+esc(I.fonte) : '') : ''}</p></div>${chiudiBtn('ix-chiudi')}</div>`;
  if(!I) return foglio('forte', testa, '');
  if(I.fase==='leggo') return foglio('forte', testa, `<p class="caricamento">${tr('Leggo il file…')}</p>`);
  const gruppi = {pronta:[], sistemare:[], indirizzo:[], rifiutata:[], pubblicata:[], preparata:[]};
  I.righe.forEach(R => { if(R.daCercare) return; (gruppi[R.stato]||gruppi.rifiutata).push(R); });
  const segnate = gruppi.pronta.filter(R => R.vista).length;
  const quando = f => esc(giornoOra(f.inizio))+(f.fine ? ' → '+esc(giornoOra(f.fine)) : '');
  const pronta = R => { const f = R.f, fo = regFonte(f.g.fonte);
    return `<div class="ix-riga"><details><summary><span class="t">${tr('Riga {r}',{r:R.riga})} · ${esc(f.titolo)}${f.id ? ' · '+tr('correzione') : ''}</span><span class="meta">${quando(f)} · ${esc(f.luogo)}</span></summary>
      <dl class="ix-dati"><dt>${tr('Indirizzo')}</dt><dd>${esc(f.addrFull||f.indirizzo)}${f.precision==='map' ? ' · '+tr('punto messo a mano') : ''}</dd>
      ${f.comeArrivare ? `<dt>${tr('Come arrivare')}</dt><dd>${esc(f.comeArrivare)}</dd>` : ''}${f.organizzatore ? `<dt>${tr('Organizza')}</dt><dd>${esc(f.organizzatore)}</dd>` : ''}
      <dt>${tr('Descrizione')}</dt><dd>${esc(f.desc)}</dd>${f.prezzo ? `<dt>${tr('Prezzo indicato dalla fonte')}</dt><dd>${esc(f.prezzo)}</dd>` : ''}
      <dt>${tr('Fonte')}</dt><dd>${esc(f.fonte)}${f.fonteLink ? ' · '+esc(f.fonteLink) : ''}</dd>
      <dt>${tr('Registro')}</dt><dd>${esc(fo ? etichettaFonte(fo) : f.g.fonte)} · ${esc(esitoDomande(f.g))}</dd></dl>
      ${R.note.map(x => `<p class="meta">${esc(x)}</p>`).join('')}${f.luogoDaIndirizzo ? `<p class="meta">${tr('Il file non ha la colonna «Luogo»: il nome del luogo è l’indirizzo. Se il luogo ha un nome, correggilo.')}</p>` : ''}
      <button class="link" data-az="ix-correggi" data-r="${R.riga}">${tr('Correggi')}</button></details>
      <button class="riga-int" data-az="ix-vista" data-r="${R.riga}" aria-pressed="${R.vista}"><span class="casella" aria-hidden="true"></span><div><span class="t">${tr('L’ho vista: pubblicala')}</span></div></button></div>`; };
  const altra = (R, tasto, az) => `<div class="menu-r" style="cursor:default"><div><span class="t">${tr('Riga {r}',{r:R.riga})}${R.f ? ' · '+esc(R.f.titolo) : ''}</span><span class="meta">${R.motivi.concat(R.note).map(esc).join(' · ')}</span></div>${tasto ? `<button class="link" data-az="${az}" data-r="${R.riga}">${tasto}</button>` : ''}</div>`;
  const sezione = (tit, l, html) => l.length ? `<p class="etich">${tit} · ${l.length}</p>${html}` : '';
  const corpo = `${I.errore ? `<p class="err" role="alert">${esc(I.errore)}</p>` : ''}${I.msg ? `<p class="meta" role="status" style="color:var(--testo)">${esc(I.msg)}</p>` : ''}${statoPb()}
    ${I.fase==='cerco' ? `<p class="caricamento">${tr('Cerco gli indirizzi senza coordinate: {k} di {n}…',{k:I.fatti, n:I.daCercare})}</p><p class="meta">${tr('Uno al secondo, come chiede il servizio delle mappe. Le righe già pronte si possono guardare.')}</p>` : ''}
    <p class="meta">${tr('Ogni riga va guardata prima di pubblicarla (§ 5.2): aprila, controlla, e segnala con «L’ho vista: pubblicala». Una riga non segnata non si pubblica. Il file non si conserva: chiudendo questa schermata, le righe non pubblicate si perdono (dalla scheda di una riga si può salvarla tra i preparati).')}</p>
    ${sezione(tr('Pronte'), gruppi.pronta, `<div class="ix-lista">${gruppi.pronta.map(pronta).join('')}</div>`)}
    ${sezione(tr('Da sistemare'), gruppi.sistemare, `<div class="menu-lista">${gruppi.sistemare.map(R => altra(R, tr('Correggi'), 'ix-correggi')).join('')}</div>`)}
    ${sezione(tr('Indirizzi non trovati'), gruppi.indirizzo, `<div class="menu-lista">${gruppi.indirizzo.map(R => altra(R, tr('Metti il punto'), 'ix-correggi')).join('')}</div>`)}
    ${sezione(tr('Rifiutate: si correggono nel file'), gruppi.rifiutata, `<div class="imp-righe">${gruppi.rifiutata.map(R => `<div class="no">${tr('Riga {r}',{r:R.riga})}: ${esc(R.motivi.join('; '))}</div>`).join('')}</div>`)}
    ${I.tolti && I.tolti.length ? `<p class="etich">${tr('Tolti dal Comune: da ritirare')} · ${I.tolti.length}</p><p class="meta">${tr('Erano nel calendario e sono ancora sulla mappa, ma nel file nuovo non ci sono più: aprili e ritirali prima della fine, con il motivo (§ 6.4, punto 7; § 5.2).')}</p>
      <div class="menu-lista">${I.tolti.map(x => `<button class="menu-r" data-pbev="${esc(x.id)}"><div><span class="t">${esc(x.titolo)}</span><span class="meta">${esc(giornoOra(x.inizio))}${x.codice ? ' · '+esc(x.codice) : ''}</span></div>${freccia}</button>`).join('')}</div>` : ''}
    ${I.saltati && (I.saltati.finiti || I.saltati.senzaOra) ? `<p class="meta">${tr('Non entrano nell’anteprima: {f} eventi già finiti, {o} eventi senza l’ora di inizio (si inseriscono a mano, se servono).',{f:I.saltati.finiti, o:I.saltati.senzaOra})}</p>` : ''}
    ${sezione(tr('Già pubblicate'), gruppi.pubblicata, `<div class="imp-righe">${gruppi.pubblicata.map(R => `<div>${tr('Riga {r}',{r:R.riga})}: ${esc(R.f.titolo)} · ${esc(R.codice||'')}</div>`).join('')}</div>`)}
    ${sezione(tr('Salvate tra i preparati'), gruppi.preparata, `<div class="imp-righe">${gruppi.preparata.map(R => `<div>${tr('Riga {r}',{r:R.riga})}: ${esc(R.f.titolo)}</div>`).join('')}</div>`)}
    <div class="tasti"><button class="tasto sec" data-az="ix-chiudi">${tr('Chiudi')}</button><button class="tasto pri" data-az="ix-pubblica" ${segnate && !PB.lavoro ? '' : 'disabled'}>${segnate===1 ? tr('Pubblica la riga segnata') : tr('Pubblica le {n} righe segnate',{n:segnate})}</button></div>`;
  return foglio('forte alto', testa, corpo);
}

/* ---------- Correggere una riga nella scheda, e riportarla qui ---------- */
const rigaIx = n => IX.stato ? IX.stato.righe.find(R => R.riga===+n) || null : null;
function correggiRiga(n){
  const R = rigaIx(n); if(!R || !R.f) return;
  st.aform = JSON.parse(JSON.stringify(R.f)); st.aform.err = {}; st.aform.errori = [];
  st.sel = null; st.form = null; apri('aform');
}
/* dalla scheda: «Tieni nell'importazione» (l'evento è già passato dal controllo del formato e dal giudizio) */
function tieniNellImportazione(f){
  const R = rigaIx(f.imp); if(!R) return;
  R.f = JSON.parse(JSON.stringify(f)); R.f.err = {}; R.f.errori = []; R.f.luogoDaIndirizzo = false;
  R.stato = ''; valutaRiga(R); st.aform = null; apri('pb-importa');
}
function rigaPreparata(n){ const R = rigaIx(n); if(R){ R.stato = 'preparata'; R.vista = false; } }

/* ---------- Pubblicare le righe segnate: un solo pacchetto, con le righe del registro ---------- */
function pubblicaImportazione(){
  const I = IX.stato; if(!I || PB.lavoro) return;
  const scelte = I.righe.filter(R => R.stato==='pronta' && R.vista);
  if(!scelte.length) return;
  scelte.forEach(valutaRiga);
  const ancora = scelte.filter(R => R.stato==='pronta' && R.vista);
  if(ancora.length!==scelte.length){ I.errore = tr('Alcune righe nel frattempo non sono più pronte: controllale.'); ridisegnaIx(); return; }
  I.errore = ''; I.msg = '';
  /* un evento di un calendario già pubblicato e cambiato si ripubblica come correzione, con il suo identificativo (T-044) */
  Promise.all(ancora.map(R => R.f.id ? R.f.id : CHIAVI.nuovoId())).then(ids => {
    const cambi = ancora.map((R, i) => { const ev = eventoDalForm(R.f, ids[i]); R.idNuovo = ev.id;
      return {ev, g:R.f.g, titolo:R.f.g.nomi==='si' && R.f.g.titoloReg.trim() ? R.f.g.titoloReg.trim() : ev.titolo, canale:I.canale || 'excel', chiave:R.chiave, correzione:!!R.f.id}; });
    return regPrepara(cambi).then(rp => scriviPb(conRegistro({operazione:'scrivi', pubblica:cambi.map(c => c.ev)}, rp), r => {
      const codici = (r.registro||{}).codici||{};
      ancora.forEach(R => { R.stato = 'pubblicata'; R.vista = false; R.codice = codici[R.idNuovo]||''; });
      registra('importa', {n:ancora.length});
      regConferma(rp, codici).catch(() => { PB.errore = tr('Gli eventi sono pubblicati e le righe del registro sono allo sportello, ma non sono riuscito a salvarle nel registro di questo dispositivo.'); ridisegnaIx(); });
      I.msg = ancora.length===1 ? tr('Pubblicata 1 riga alle {o} (ora dello sportello).',{o:oraPb(r.quando)}) : tr('Pubblicate {n} righe alle {o} (ora dello sportello).',{n:ancora.length, o:oraPb(r.quando)});
      return ''; }, 'pb-importa'));
  }).catch(() => { I.errore = tr('Per pubblicare servono le chiavi della Redazione: Strumenti della redazione → Chiavi.'); ridisegnaIx(); });
}

/* ---------- Tocchi ---------- */
function azioneImporta(az, t){
  const I = IX.stato;
  switch(az){
    case 'ix-file': $('fileImporta').click(); break;
    case 'ix-vista': { const R = rigaIx(t.dataset.r); if(R && R.stato==='pronta'){ R.vista = !R.vista; disegnaFoglio(); } break; }
    case 'ix-correggi': correggiRiga(t.dataset.r); break;
    case 'ix-pubblica': pubblicaImportazione(); break;
    case 'ix-chiudi': {
      const aperte = I ? I.righe.filter(R => R.stato==='pronta' || R.stato==='sistemare' || R.stato==='indirizzo').length : 0;
      if(aperte && !I.chiudi){ I.chiudi = true; I.msg = aperte===1 ? tr('Una riga non è pubblicata e andrà persa: tocca ancora «Chiudi» per uscire.') : tr('{n} righe non sono pubblicate e andranno perse: tocca ancora «Chiudi» per uscire.',{n:aperte}); disegnaFoglio(); break; }
      IX.stato = null; apri('pubblica'); aggiornaPb(); break; }
    default: return false;
  }
  return true;
}

/* ======================= Il registro delle fonti: Excel, «Non pubblicati», confronto con lo sportello (T-043) =======================
   Libro mastro, cap. 22 («Come l'app della redazione scrive il registro», regole 3, 4 e 5; foglio «Non pubblicati»;
   conservazione); § 18.4 (un file per registro, fogli comuni, colonne comuni, nessuna voce riscritta, date gg/mm/aaaa);
   § 18.3 (il file sta cifrato); §§ 7.5, caso 2, e 8.5, passo 1 (richieste non accolte per ragioni di fatto).

   La schermata «Registro delle fonti» (Pubblicazione → «Registro delle fonti») raccoglie:
   - le fonti (registro-fonti.js) e le richieste «Non pubblicati» (qui), che si scrivono nell'app;
   - l'esportazione in Excel con le colonne e l'ordine del modello del registro delle fonti del 13/11/2026: fogli
     «Istruzioni», «Fonti», «Eventi», «Non pubblicati», «Riepilogo», «Valori» e «Versioni», intestazioni alla riga 4,
     date gg/mm/aaaa (cap. 22, regola 3). Il file esportato non ha password: lo dice l'app, e la Redazione lo salva con
     la password del registro prima di tenerlo (§ 18.3);
   - l'importazione del file tenuto a mano (regola 5, «Il passaggio»): fonti, righe degli eventi e «Non pubblicati»
     entrano con i loro codici, che non si rinumerano; ciò che c'è già non si tocca, ciò che è in contrasto si mostra;
   - il confronto con lo sportello (regola 4): le righe del periodo contro gli eventi pubblicati la prima volta nello
     stesso periodo, secondo lo storico dello sportello; e, per un secondo dispositivo, le righe, le fonti e i «Non
     pubblicati» che lo sportello conserva nelle sue buste e che qui mancano.
   «Togli questo nome ovunque» non tocca il registro (cap. 22, conservazione; § 3.13): il registro non è un documento
   operativo e non copia i nomi delle persone.

   Testi come testo (T-024): ciò che viene dal file o dalle buste entra nella pagina solo con esc(). */
const RX = {imp:null, conf:null, np:null, scopo:''};

/* ---------- I valori dei menu, come nel foglio «Valori» del modello ---------- */
const V_TIPO = {organizzatore:'Organizzatore che scrive alla Redazione', sito:"Sito dell'organizzatore", social:'Pagina ufficiale su un social network', istituzionale:'Sito istituzionale', calendario:'Calendario in dati aperti', testata:'Testata o comunicato'};
const V_ESITO = {ammessa:'Ammessa', attribuzione:'Ammessa con attribuzione', vietata:"Non ammessa: vieta il riuso (si cerca l'organizzatore)", esclusa:'Esclusa'};
const V_LICENZA = {aperta:'Licenza aperta che consente il riuso', nessuna:'Nessuna licenza (art. 52, c. 2, CAD)', condivisione:'Licenza a condivisione alle stesse condizioni (solo inserimento a mano)', np:'Non pertinente'};
const V_CANALE = {singolo:'Evento singolo', excel:'File Excel', calendario:'Calendario in dati aperti'};
const V_RITIRO = {annullato:'Annullato o rinviato', errore:'Errore non verificabile in tempo', esclusione:'Esclusione editoriale (X)', richiesta:"Richiesta dell'interessato (R)", segnalazione:'Segnalazione (S)', ordine:"Ordine di un'autorità (A)"};
const V_MOTIVO_NP = {domanda:'Una delle dieci domande non superata', nonpubblico:'Evento non ancora pubblico altrove', contrasto:'Contrasto tra fonti non risolto', fonte:'Fonte non ammessa', altro:'Altro motivo di fatto'};
const V_CANALI = ['Casella di contatto', 'App di messaggistica', 'Social network', 'Telefono', 'Di persona', "Modulo o tasto dell'app"];
const FUNZIONI_REG = ['Direzione', 'Referente privacy', 'Redazione eventi', 'Relazioni con gli utenti', 'Responsabile infrastruttura', 'Amministrazione', 'Collaudo', 'Sviluppo', 'Etica'];

/* ---------- Le colonne, nell'ordine del modello (cap. 22; § 18.4, regola 4) ---------- */
const PUNTO_COL = n => 'Punto '+n+': '+SETTE_PUNTI[n-1][1].charAt(0).toLowerCase()+SETTE_PUNTI[n-1][1].slice(1);
const COL_FONTI = ['Codice', 'Data di registrazione', 'Funzione che annota', 'Nome della fonte', 'Tipo', 'Grado', 'Indirizzo', 'Persona fisica', 'Condizioni lette il', 'Esito',
  'Licenza del calendario', 'Nome della licenza', 'Attribuzione richiesta', ...SETTE_PUNTI.map(([n]) => PUNTO_COL(n)), 'Prossimo controllo', 'Ultimo evento collegato',
  'Rif. libro mastro', 'Collegamenti', 'Stato', 'Contestazione in corso', 'Scadenza della conservazione', 'Da cancellare al riesame', 'Rettifiche', 'Note'];
const COL_EVENTI = ['Codice', 'Data di registrazione', 'Funzione che annota', 'Data e ora di pubblicazione', "Identificativo dell'evento", 'Titolo (senza nomi di persone)', 'Evento nascosto',
  'Canale di immissione', 'Fonte (codice FS)', 'Grado della fonte', "Fonte diversa dall'organizzatore", "Collegamento alla pagina dell'evento", 'Data di consultazione', 'Funzione che ha consultato',
  'Post leggibile senza account', 'Testo del campo «Fonte:»', 'Dieci domande', 'Domande e correzioni', 'Elementi ripresi', 'Nomi ripresi', 'Evento politico o religioso',
  "Avviso all'organizzatore: data", 'Avviso: canale', 'Prova del consenso (codice C)', 'Ritiro prima della fine: data', 'Motivo del ritiro',
  'Rif. libro mastro', 'Collegamenti', 'Stato', 'Contestazione in corso', 'Scadenza della conservazione', 'Da cancellare al riesame', 'Rettifiche', 'Note'];
const COL_NP = ['Codice', 'Data di registrazione', 'Funzione che annota', 'Data della richiesta', 'Organizzatore (denominazione o codice P)', 'Evento richiesto (senza nomi)', 'Motivo',
  'Motivazione inviata: data', 'Motivazione: canale', 'Rif. libro mastro', 'Collegamenti', 'Stato', 'Data di chiusura', 'Contestazione in corso', 'Scadenza della conservazione',
  'Da cancellare al riesame', 'Rettifiche', 'Note'];
/* le colonne con una data (o con data e ora) nei tre fogli */
const COL_DATA = new Set(['Data di registrazione', 'Condizioni lette il', ...SETTE_PUNTI.map(([n]) => PUNTO_COL(n)), 'Prossimo controllo', 'Ultimo evento collegato', 'Data di consultazione',
  "Avviso all'organizzatore: data", 'Ritiro prima della fine: data', 'Data della richiesta', 'Motivazione inviata: data', 'Data di chiusura']);
const COL_ORA = new Set(['Data e ora di pubblicazione']);
const LARG_FONTI = [12,13,18,26,24,9,30,10,13,26,26,16,26,13,13,13,13,13,13,13,13,13,13,18,14,12,14,12,30,30];
const LARG_EVENTI = [12,13,18,15,18,30,10,18,12,9,12,30,13,16,18,24,18,26,26,16,11,13,20,12,13,22,13,18,14,12,14,12,30,30];
const LARG_NP = [12,13,18,13,22,28,26,13,18,13,18,14,13,12,14,12,30,30];

/* ---------- Dalle voci del dispositivo alle righe del file ---------- */
const giornoD = x => giornoReg(x) ? dIso(x) : '';
/* un numero di serie di Excel (giorni dal 30/12/1899, con le ore dopo la virgola) come data e ora del dispositivo */
const daSeriale = v => new Date(1899, 11, 30 + Math.floor(v), 0, Math.round((v - Math.floor(v))*1440));
const istanteD = x => { const d = new Date(x); return x && !isNaN(d) ? {data:d, ora:true} : ''; };
const piuAnni = (g, n) => giornoReg(g) ? (+g.slice(0,4)+n)+g.slice(4) : '';
const siNo = b => b ? 'Sì' : 'No';
const testoRettifiche = l => (l||[]).map(x => { const d = new Date(x.data); return (isNaN(d) ? x.data : d.toLocaleDateString('it-IT')+' '+d.toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'}))+': '+x.testo; }).join('\n');
const fsRiga = r => r.mano ? r.fs||'' : ((r.g||{}).fonte||'');
const giornoRiga = r => { const d = new Date(r.quando||''); return r.quando && !isNaN(d) ? ymd(d) : ''; };   /* il giorno della pubblicazione, ora del dispositivo */
/* le fonti di grado 3 e 4 sono «diverse dall'organizzatore» (§ 6.3, regola 3) */
const gradoDi = c => { const f = regFonte(c); return f ? (f.grado==='esclusa' ? 'Esclusa' : f.grado) : ''; };
const diversaDi = gr => gr==='3' || gr==='4' ? 'Sì' : gr==='1' || gr==='2' ? 'No' : '';
const ultimoEvento = c => REG.dati.eventi.filter(r => fsRiga(r)===c && r.quando).reduce((m, r) => giornoRiga(r) > m ? giornoRiga(r) : m, '');
function rigaFonteReg(f){
  const persona = CODICE_P.test(f.nome), lette = f.lette, ultimo = ultimoEvento(f.codice), x = f.extra||{};
  const stato = f.esito==='esclusa' || f.grado==='esclusa' ? 'Esclusa' : STATI_FONTE[f.stato] || 'In uso';
  const scad = persona ? (ultimo ? giornoD(piuAnni(ultimo, CINQUE_ANNI)) : '') : 'Durata del servizio';
  const daCanc = scad instanceof Date && scad < dIso(oggi()) ? 'Sì' : '';
  return [f.codice, giornoD(f.registrata), x.funzione || 'Redazione eventi', f.nome, V_TIPO[f.tipo]||'', f.grado==='esclusa' ? 'Esclusa' : f.grado, f.indirizzo, siNo(persona),
    giornoD(lette), V_ESITO[f.esito]||'', f.tipo==='calendario' ? V_LICENZA[f.licenzaTipo]||'' : V_LICENZA.np, f.licenza, f.attribuzione,
    ...SETTE_PUNTI.map(([n]) => giornoD((f.punti||{})[n])), giornoD(prossimoControllo(f)), giornoD(ultimo), x.rif || '§ 5.4', x.collegamenti || '', stato, x.contestazione || '', scad, daCanc,
    testoRettifiche(f.rettifiche), f.note||''];
}
/* l'esito delle dieci domande nei due valori del modello: il valore del menu e le domande con la correzione */
function dieciPerFile(g){
  if(g.domFile){ const m = g.domFile.match(/^Correzione applicata:?\s*(.*)$/); return m ? ['Correzione applicata', m[1]] : [g.domFile, '']; }
  const no = DIECI_DOMANDE.filter(([n]) => g.dom && g.dom[n] && g.dom[n]!=='si');
  if(!no.length) return ['Tutte superate', ''];
  return [no.some(([n]) => g.dom[n]==='consenso') ? 'Consenso diretto chiesto' : 'Correzione applicata', esitoDomande(g)];
}
function elementiPerFile(g){
  const e = g.elementi||{}, base = ['titolo', 'data', 'ora', 'luogo'].filter(k => e[k]).map(k => tr(ELEMENTI_RIPRESI.find(x => x[0]===k)[1]).toLowerCase());
  let t = base.join(', '); if(t) t = t.charAt(0).toUpperCase()+t.slice(1);
  if(e.descrizione) t += (t ? '; ' : '')+'descrizione riscritta';
  if(g.nomi==='si' && g.ruoli) t += (t ? '; ' : '')+'ruoli: '+g.ruoli;
  return t;
}
function rigaEventoReg(r){
  /* una riga portata dal file tenuto a mano esce com'era scritta, con le date di nuovo come date */
  if(r.mano) return COL_EVENTI.map(c => { const v = (r.colonne||{})[c]; return v==null ? '' : typeof v!=='number' ? v : COL_ORA.has(c) ? {data:daSeriale(v), ora:true} : COL_DATA.has(c) ? daSeriale(Math.floor(v)) : v; });
  const g = r.g||{}, gr = gradoDi(g.fonte), [dieci, corr] = dieciPerFile(g), pub = giornoRiga(r), scad = r.scadenza || piuAnni(pub, CINQUE_ANNI);
  const finito = r.fine && Date.parse(r.fine) < Date.now(), rit = r.ritiro;
  const note = [!r.quando ? 'Prima pubblicazione da un altro dispositivo o prima del registro nell’app' : '', g.avviso==='dopo' ? 'Avviso all’organizzatore da inviare dopo la pubblicazione' : ''].filter(Boolean).join('; ');
  return [r.codice, giornoD(pub) || giornoD(giornoRiga({quando:r.corretto})), r.funzione || 'Redazione eventi', istanteD(r.quando), r.id, r.titolo, siNo(r.nascosto),
    V_CANALE[r.canale]||'', g.fonte||'', gr, diversaDi(gr), r.collegamento||'', giornoD(g.consultazione), r.funzione || 'Redazione eventi',
    g.post==='si' ? 'Sì, verificato senza accedere' : 'Non pertinente', r.testoFonte||'', dieci, corr, elementiPerFile(g), g.nomi==='si' ? 'Sì, con il solo ruolo' : g.nomi==='no' ? 'Nessun nome' : '',
    g.politico==='si' ? 'Sì' : g.politico==='no' ? 'No' : '', g.avviso==='inviato' ? giornoD(g.avvisoData) : '', g.avviso==='nessuno' ? 'Nessun recapito di lavoro noto' : g.avviso==='inviato' ? g.avvisoCanale||'' : '',
    g.consenso||'', rit ? giornoD(giornoReg(rit.data) || giornoRiga({quando:rit.data})) : '', rit ? V_RITIRO[rit.motivo]||'' : '', '§§ 3.4 e 5.3',
    [g.k, g.consenso, rit && rit.riferimento].filter(Boolean).join('; '), rit ? 'Ritirato prima della fine' : finito ? 'Concluso' : 'Pubblicato', '', giornoD(scad),
    giornoReg(scad) && scad < oggi() ? 'Sì' : '', testoRettifiche(r.rettifiche), note];
}
function rigaNpReg(x){
  const scad = x.chiusa ? piuAnni(x.chiusa, CINQUE_ANNI) : '', e = x.extra||{};
  return [x.codice, giornoD(x.registrata), e.funzione || 'Redazione eventi', giornoD(x.richiesta), x.organizzatore, x.evento, V_MOTIVO_NP[x.motivo]||'', giornoD(x.motivazioneData), x.motivazioneCanale,
    e.rif || '§ 7.5', e.collegamenti || '', x.chiusa ? 'Chiusa' : 'Aperta', giornoD(x.chiusa), e.contestazione || '', giornoD(scad), giornoReg(scad) && scad < oggi() ? 'Sì' : '', testoRettifiche(x.rettifiche), x.note||''];
}

/* ---------- Il riepilogo dell'anno (foglio «Riepilogo»: § 6.3, regola 3; § 18.8) ---------- */
function riepilogoAnno(anno){
  const d = REG.dati, nell = r => giornoRiga(r).slice(0, 4)===String(anno);
  const righe = d.eventi.filter(nell), conGrado = righe.map(r => ({r, gr:gradoDi(fsRiga(r))}));
  const org = conGrado.filter(x => diversaDi(x.gr)==='No').length, div = conGrado.filter(x => diversaDi(x.gr)==='Sì').length;
  const np = d.nonPubblicati.filter(x => String(x.richiesta).slice(0, 4)===String(anno)).length;
  const scaduti = d.fonti.filter(f => fonteDaRicontrollare(f)).length, inUso = d.fonti.filter(f => f.stato!=='non' && f.esito!=='esclusa' && f.grado!=='esclusa').length;
  const canc = (righe, col) => righe.filter(x => x[col.indexOf('Da cancellare al riesame')]==='Sì').length;
  const daCanc = canc(d.eventi.map(rigaEventoReg), COL_EVENTI) + canc(d.fonti.map(rigaFonteReg), COL_FONTI) + canc(d.nonPubblicati.map(rigaNpReg), COL_NP);
  const rap = n => n>0 && n<5 ? 'meno di 5' : n;
  const per = {}; conGrado.forEach(({r, gr}) => { const c = fsRiga(r)||'—'; per[c] = per[c] || {n:0, gr}; per[c].n++; });
  return {anno, righe:righe.length, org, div, quota:righe.length ? Math.round(div/righe.length*1000)/10 : '', nascosti:righe.filter(r => r.nascosto).length,
    ritirati:righe.filter(r => r.ritiro).length, inUso, scaduti, np, npRap:rap(np), daCanc, mano:righe.filter(r => r.mano).length,
    gradi:['1', '2', '3', '4'].map(g => [g, conGrado.filter(x => x.gr===g).length]), perFonte:Object.entries(per).sort((a, b) => b[1].n - a[1].n)};
}

/* ---------- L'esportazione in Excel (cap. 22, regola 3) ---------- */
const nomeRegistroFile = () => (String(NOME).replace(/[^A-Za-z0-9]+/g, '') || 'Registro')+'_Reg22_Fonti_esportato_'+oggi()+'.xlsx';
function fogliRegistro(dispositivo){
  const d = REG.dati, anno = +oggi().slice(0, 4), R = riepilogoAnno(anno), titolo = (t, s) => [[t], [s], []];
  const ordine = (a, b) => a.codice < b.codice ? -1 : a.codice > b.codice ? 1 : 0;
  const eventi = d.eventi.slice().sort((a, b) => (a.codice||'~') < (b.codice||'~') ? -1 : (a.codice||'~') > (b.codice||'~') ? 1 : String(a.quando) < String(b.quando) ? -1 : 1);
  const istr = [['Registro delle fonti'], ['Libro mastro legale, cap. 22 · lo tiene la Redazione eventi · righe degli eventi conservate cinque anni dalla pubblicazione'], [],
    ['Esportato dall’app della redazione il '+new Date().toLocaleDateString('it-IT')+' alle '+new Date().toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'})+(dispositivo ? ', dal dispositivo «'+dispositivo+'»' : '')+'.'],
    ['Le colonne e il loro ordine sono quelli del modello del 13/11/2026 (cap. 22; § 18.4). Le colonne calcolate del modello (grado della fonte, prossimo controllo, scadenza, da cancellare) qui hanno già il valore.'], [],
    ['I fogli'], ['Fonti (FS-0001): una riga per sito, pagina o calendario usato come fonte.'], ['Eventi (F-00001): una riga per ogni evento pubblicato; i codici F li dà lo sportello di pubblicazione, uno dopo l’altro.'],
    ['Non pubblicati (NP-0001): le richieste di pubblicazione non accolte per ragioni di fatto (§ 7.5, caso 2; § 8.5, passo 1).'], ['Riepilogo: eventi dell’anno per fonte e per grado, quota di eventi da fonti diverse dagli organizzatori (§ 6.3, regola 3; § 18.8).'], [],
    ['Regole'], ['Nessuna voce si riscrive: le correzioni sono nella colonna «Rettifiche», con la data (§ 18.4, regola 5).'], ['Nessun nome di persona: le persone fisiche con il codice P; nei titoli il ruolo al posto del nome (§ 5.3; § 18.5).'],
    ['Lo strumento «Togli questo nome ovunque» non modifica il registro (§ 3.13; cap. 22, conservazione).'], [],
    ['Dove sta il file'], ['Questo file non ha password. Si apre con il programma installato sul dispositivo della redazione, si salva con la password del registro e si cancella la copia senza password (§ 18.3). Mai sulla piattaforma del codice, presso strumenti di intelligenza artificiale o nel gestionale.']];
  const fonti = titolo('Fonti valutate', 'Una riga per sito, pagina o calendario · §§ 5.4, 6.3 e 6.4').concat([COL_FONTI], d.fonti.slice().sort(ordine).map(rigaFonteReg));
  const ev = titolo('Eventi pubblicati', 'Una riga per evento, al momento della pubblicazione · §§ 3.4 e 5.3').concat([COL_EVENTI], eventi.map(rigaEventoReg));
  const np = titolo('Richieste di pubblicazione non accolte per ragioni di fatto', '§ 7.5, caso 2; § 8.5, passo 1 · cinque anni dalla chiusura').concat([COL_NP], d.nonPubblicati.slice().sort(ordine).map(rigaNpReg));
  const rie = titolo('Riepilogo', 'Calcolato dall’app al momento dell’esportazione. Sotto i cinque casi il valore per il rapporto compare come «meno di 5» (§ 4.4; § 18.8)').concat([
    ['Voce', 'Valore', 'Per il rapporto interno'], ['Anno del riepilogo', anno, ''], ['Eventi pubblicati nell’anno'], ['Eventi pubblicati', R.righe, '—'], ['da fonti degli organizzatori (gradi 1 e 2)', R.org, '—'],
    ['da fonti diverse dagli organizzatori (gradi 3 e 4)', R.div, '—'], ['Quota da fonti diverse dagli organizzatori (%)', R.quota, '—'], ['Eventi nascosti', R.nascosti, '—'], ['Eventi ritirati prima della fine', R.ritirati, '—'],
    ['Fonti e richieste'], ['Fonti in uso', R.inUso, '—'], ['Fonti con il controllo delle condizioni scaduto', R.scaduti, '—'], ['Richieste di pubblicazione non accolte nell’anno', R.np, R.npRap],
    ['Conservazione'], ['Voci da cancellare al prossimo riesame (tutti i fogli)', R.daCanc, '—'], [],
    ['Eventi dell’anno per grado della fonte'], ...R.gradi.map(([g, n]) => ['Grado '+g, n, '—']), [],
    ['Eventi dell’anno per fonte'], ['Fonte (codice FS)', 'Eventi', 'Grado'], ...R.perFonte.map(([c, x]) => [c, x.n, x.gr || ''])]);
  const valori = titolo('Valori dei menu a tendina', 'Si modificano soltanto con una modifica del modello annotata nel foglio «Versioni» (§ 18.4, regola 9)');
  const liste = [['Funzioni', FUNZIONI_REG], ['SiNo', ['Sì', 'No']], ['TipoFonte', Object.values(V_TIPO)], ['Grado', ['1', '2', '3', '4', 'Esclusa']], ['EsitoFonte', Object.values(V_ESITO)],
    ['Licenza', Object.values(V_LICENZA)], ['StatoFonte', ['In uso', 'Non più in uso', 'Esclusa']], ['CanaleImmissione', Object.values(V_CANALE)], ['Leggibile', ['Sì, verificato senza accedere', 'Non pertinente']],
    ['DieciDomande', ['Tutte superate', 'Correzione applicata', 'Consenso diretto chiesto']], ['Nomi', ['Nessun nome', 'Sì, con il solo ruolo']], ['CanaleAvviso', V_CANALI.slice(0, 5).concat(['Nessun recapito di lavoro noto'])],
    ['MotivoRitiro', Object.values(V_RITIRO)], ['StatoEvento', ['Pubblicato', 'Concluso', 'Ritirato prima della fine']], ['MotivoNP', Object.values(V_MOTIVO_NP)], ['CanaleComun', V_CANALI], ['Pratica', ['Aperta', 'Chiusa']]];
  valori.push(liste.map(x => x[0]));
  for(let i = 0, n = Math.max(...liste.map(x => x[1].length)); i < n; i++) valori.push(liste.map(x => x[1][i] || ''));
  const versioni = titolo('Versioni del modello', 'Ogni modifica del modello si annota qui (§ 18.4, regola 9)').concat([['Versione', 'Data', 'Modifica', 'Decisione (codice D)'],
    ['1.0', dIso('2026-11-13'), 'Prima versione del modello, secondo il cap. 18 e il cap. 22 del libro mastro (testo del 13/11/2026).', '']]);
  return [['Istruzioni', istr, [125]], ['Fonti', fonti, LARG_FONTI, {testa:3}], ['Eventi', ev, LARG_EVENTI, {testa:3}], ['Non pubblicati', np, LARG_NP, {testa:3}],
    ['Riepilogo', rie, [70, 14, 20], {testa:3}], ['Valori', valori, liste.map(x => Math.max(18, Math.min(45, Math.max(...x[1].map(v => v.length), x[0].length)+2))), {testa:3}], ['Versioni', versioni, [10, 12, 90, 16], {testa:3}]];
}
function esportaRegistro(){
  if(REG.stato!=='aperto') { PB.errore = statoRegistro(); disegnaFoglio(); return; }
  PB.errore = ''; PB.msg = '';
  CHIAVI.stato().catch(() => null).then(s => fileExcel(fogliRegistro(s && s.ci_sono ? s.dispositivo : ''), nomeRegistroFile())).then(() => {
    const d = REG.dati; registra('registro-esporta', {n:d.eventi.length});
    PB.msg = tr('Registro esportato: {f} ({e} righe degli eventi, {s} fonti, {p} non pubblicati). Il file non ha password: aprilo con il programma del dispositivo, salvalo con la password del registro (§ 18.3) e cancella questa copia.',{f:nomeRegistroFile(), e:d.eventi.length, s:d.fonti.length, p:d.nonPubblicati.length});
    disegnaFoglio(); }, () => { PB.errore = tr('Non sono riuscito a preparare il file Excel.'); disegnaFoglio(); });
}

/* ---------- La schermata «Registro delle fonti» ---------- */
function fPbRegistro(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Registro delle fonti')}</h2><p class="meta">${tr('Cifrato su questo dispositivo con la chiave del registro · cap. 22')}</p></div>${chiudiBtn('pubblica')}</div>`;
  const s = statoRegistro(); if(s) return foglio('forte', testa, `<p class="meta" role="status">${esc(s)}</p>`);
  const d = REG.dati, rilegg = d.fonti.filter(fonteDaRicontrollare).length, aperte = d.nonPubblicati.filter(x => !x.chiusa).length, m = daMandare(d), attesa = m.fonti.length + m.nonPubblicati.length + m.mano.length;
  const corpo = `${statoPb()}
    <p class="meta">${tr('Sul dispositivo: {e} righe degli eventi, {f} fonti, {n} richieste non pubblicate.',{e:d.eventi.length, f:d.fonti.length, n:d.nonPubblicati.length})}${attesa ? ' '+tr('{n} voci partiranno per lo sportello con la prossima pubblicazione.',{n:attesa}) : ''}</p>
    <div class="menu-lista">
      <button class="menu-r" data-az="pb-fonti">${icoNote}<div><span class="t">${tr('Fonti')}</span><span class="meta">${tr('{n} fonti',{n:d.fonti.length})}${rilegg ? ' · '+tr('{n} con le condizioni da rileggere',{n:rilegg}) : ''}</span></div>${freccia}</button>
      <button class="menu-r" data-az="rx-np">${icoNote}<div><span class="t">${tr('Non pubblicati')}</span><span class="meta">${tr('Richieste di pubblicazione non accolte per ragioni di fatto')}${aperte ? ' · '+tr('{n} aperte',{n:aperte}) : ''}</span></div>${freccia}</button>
      <button class="menu-r" data-az="rx-confronta">${icoCal()}<div><span class="t">${tr('Confronta con lo sportello')}</span><span class="meta">${tr('Righe del periodo contro gli eventi pubblicati nello storico; righe e fonti scritte da un altro dispositivo')}</span></div>${freccia}</button></div>
    <div class="menu-lista">
      <button class="menu-r" data-az="rx-esporta">${icoEsporta}<div><span class="t">${tr('Esporta il registro in Excel')}</span><span class="meta">${tr('Le colonne e l’ordine del cap. 22, per il riesame, il rapporto interno o una richiesta')}</span></div>${freccia}</button>
      <button class="menu-r" data-az="rx-importa">${icoImporta}<div><span class="t">${tr('Importa il registro tenuto a mano')}</span><span class="meta">${tr('Il file Excel del registro delle fonti: fonti, righe degli eventi e non pubblicati')}</span></div>${freccia}</button></div>
    <p class="meta">${tr('Il registro non è un documento operativo: «Togli questo nome ovunque» non lo modifica, e i nomi delle persone non vi si copiano (§ 3.13; § 5.3).')}</p>`;
  return foglio('forte alto', testa, corpo);
}

/* ---------- «Non pubblicati» (NP-0001) ---------- */
function fPbNp(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Non pubblicati')}</h2><p class="meta">${tr('Registro delle fonti, foglio «Non pubblicati»')}</p></div>${chiudiBtn('pb-registro')}</div>`;
  const s = statoRegistro(); if(s) return foglio('forte', testa, `<p class="meta" role="status">${esc(s)}</p>`);
  const L = REG.dati.nonPubblicati.slice().reverse();
  const corpo = `${statoPb()}
    <p class="meta">${tr('Una riga per ogni richiesta di pubblicazione di un organizzatore che non si accoglie per ragioni di fatto: una delle dieci domande non superata, l’evento non ancora pubblico altrove, un contrasto tra fonti non risolto. Non è un’esclusione editoriale (§ 8.5, passo 1). La riga prova la motivazione inviata (§ 7.5, caso 2) e si conserva cinque anni dalla chiusura.')}</p>
    <div class="tasti"><button class="tasto pri" data-az="rx-np-nuovo">${tr('Nuova richiesta non pubblicata')}</button></div>
    ${L.length ? `<div class="menu-lista">${L.map(x => `<button class="menu-r" data-rxnp="${esc(x.codice)}"><div><span class="t">${esc(x.codice)} · ${esc(x.evento||tr('senza descrizione'))}</span><span class="meta">${esc(x.organizzatore)} · ${esc(tr(V_MOTIVO_NP[x.motivo]||'—'))} · ${x.chiusa ? tr('chiusa') : tr('aperta')}</span></div>${freccia}</button>`).join('')}</div>`
      : `<p class="meta">${tr('Nessuna richiesta non pubblicata.')}</p>`}`;
  return foglio('forte alto', testa, corpo);
}
function apriNp(codice){
  const x = codice ? REG.dati.nonPubblicati.find(y => y.codice===codice) : null;
  RX.np = Object.assign({codice:null, richiesta:oggi(), organizzatore:'', evento:'', motivo:'', motivazioneData:'', motivazioneCanale:'', chiusa:'', note:''}, x ? JSON.parse(JSON.stringify(x)) : {}, {errori:[]});
  PB.errore = ''; PB.msg = ''; apri('pb-np-riga');
}
function fPbNpRiga(){
  const x = RX.np, testa = `<div class="riga-titolo"><div><h2>${x && x.codice ? esc(x.codice) : tr('Nuova richiesta non pubblicata')}</h2><p class="meta">${tr('Registro delle fonti, foglio «Non pubblicati»')}</p></div>${chiudiBtn('rx-np')}</div>`;
  if(!x) return foglio('forte', testa, '');
  const fac = tr('facoltativo'), campo = (id, lab, html, nota) => `<div class="stack-s"><label class="etich" for="${id}">${lab}</label>${html}${nota?`<span class="meta">${nota}</span>`:''}</div>`;
  const testo = (id, c, lab, max, segna, nota, tipo) => campo(id, lab, `<div class="campo"><input id="${id}" data-npcampo="${c}" maxlength="${max}" value="${esc(x[c])}" placeholder="${esc(segna||'')}" autocomplete="off"${tipo?` type="${tipo}"`:''}></div>`, nota);
  const scelta = (id, c, lab, voci, nota) => campo(id, lab, `<div class="campo"><select id="${id}" data-npcampo="${c}"><option value="">${tr('— Scegli —')}</option>${voci.map(([v, t]) => `<option value="${esc(v)}" ${x[c]===v?'selected':''}>${esc(tr(t))}</option>`).join('')}</select></div>`, nota);
  const corpo = `
    ${testo('np-ric', 'richiesta', tr('Data della richiesta'), 10, '', '', 'date')}
    ${testo('np-org', 'organizzatore', tr('Organizzatore'), 120, tr('Ente o associazione'), tr('La denominazione dell’ente; una persona fisica non si scrive con il nome, ma con il suo codice P, per esempio «P-0007».'))}
    ${testo('np-ev', 'evento', tr('Evento richiesto'), 160, '', tr('Che evento chiedeva di pubblicare, senza nomi di persone.'))}
    ${scelta('np-mot', 'motivo', tr('Motivo'), Object.entries(V_MOTIVO_NP), tr('Ragioni di fatto: non è un’esclusione editoriale, che va nel registro delle esclusioni.'))}
    <div class="due">${testo('np-mdata', 'motivazioneData', `${tr('Motivazione inviata il')} <span class="fac">${fac}</span>`, 10, '', '', 'date')}
      ${scelta('np-mcan', 'motivazioneCanale', `${tr('Canale')} <span class="fac">${fac}</span>`, V_CANALI.map(v => [v, v]))}</div>
    ${testo('np-chiusa', 'chiusa', `${tr('Chiusa il')} <span class="fac">${fac}</span>`, 10, '', tr('Dalla chiusura la riga si conserva cinque anni.'), 'date')}
    ${testo('np-note', 'note', `${tr('Note')} <span class="fac">${fac}</span>`, 300, '', '')}
    ${x.errori.length ? `<div class="red-riquadro pb-errori" role="alert"><b>${tr('Per salvare la riga:')}</b>${x.errori.map(e => `<span class="err">${esc(e)}</span>`).join('')}</div>` : ''}
    ${statoPb()}
    <div class="tasti"><button class="tasto sec" data-az="rx-np">${tr('Annulla')}</button><button class="tasto pri" data-az="rx-np-salva">${x.codice ? tr('Salva la riga') : tr('Aggiungi la riga')}</button></div>
    <p class="meta">${tr('Una riga non si cancella: le correzioni restano annotate, con la data, nella colonna «Rettifiche» (§ 18.4).')}</p>`;
  return foglio('forte alto', testa, corpo);
}
function salvaNp(){
  const x = RX.np; if(!x || PB.lavoro) return;
  const e = [], giorno = (v, lab, serve) => { if(!v){ if(serve) e.push(tr('{c}: scegli il giorno.',{c:lab})); return; } if(!giornoReg(v) || v > oggi()) e.push(tr('{c}: scegli il giorno, non nel futuro.',{c:lab})); };
  giorno(x.richiesta, tr('Data della richiesta'), true);
  if(!x.organizzatore.trim()) e.push(tr('Organizzatore: scrivi la denominazione o il codice P.'));
  if(!x.evento.trim()) e.push(tr('Evento richiesto: scrivi di che evento si tratta, senza nomi.'));
  if(!V_MOTIVO_NP[x.motivo]) e.push(tr('Motivo: scegline uno.'));
  giorno(x.motivazioneData, tr('Motivazione inviata il')); giorno(x.chiusa, tr('Chiusa il'));
  if(x.motivazioneData && !x.motivazioneCanale) e.push(tr('Canale: scegli come hai inviato la motivazione.'));
  x.errori = e; if(e.length){ disegnaFoglio(); return; }
  const d = REG.dati, v = {richiesta:x.richiesta, organizzatore:x.organizzatore.trim(), evento:x.evento.trim(), motivo:x.motivo, motivazioneData:x.motivazioneData, motivazioneCanale:x.motivazioneCanale, chiusa:x.chiusa, note:x.note.trim(), aggiornata:new Date().toISOString(), invio:true};
  let y = x.codice ? d.nonPubblicati.find(z => z.codice===x.codice) : null; const prima = y ? JSON.parse(JSON.stringify(y)) : null;
  if(y){ rettifica(y, prima, v, {richiesta:'Data della richiesta', organizzatore:'Organizzatore', evento:'Evento richiesto', motivo:'Motivo', motivazioneData:'Motivazione inviata', motivazioneCanale:'Canale', chiusa:'Chiusura', note:'Note'}); Object.assign(y, v); }
  else { y = Object.assign({codice:regCodice('NP', d.prossimi.np++, 4), registrata:oggi(), rettifiche:[]}, v); d.nonPubblicati.push(y); }
  PB.lavoro = true; disegnaFoglio();
  regSalva().then(() => { PB.lavoro = false; registra(x.codice ? 'np-corretto' : 'np-nuovo', {c:y.codice}); RX.np = null; PB.msg = tr('Riga {c} salvata.',{c:y.codice}); apri('pb-np'); },
    () => { PB.lavoro = false; if(!x.codice){ d.nonPubblicati.pop(); d.prossimi.np--; } else if(prima){ Object.keys(y).forEach(k => { delete y[k]; }); Object.assign(y, prima); }
      PB.errore = tr('Non sono riuscito a salvare il registro delle fonti su questo dispositivo.'); disegnaFoglio(); });
}

/* ---------- L'importazione del registro tenuto a mano (cap. 22, regola 5) ---------- */
const PREFISSI = {fonti:/^FS-\d{4,}$/, eventi:/^F-\d{5,}$/, np:/^NP-\d{4,}$/};
const COL_PER = {fonti:COL_FONTI, eventi:COL_EVENTI, np:COL_NP};
/* le righe di un foglio del file, come oggetti {intestazione del modello: valore}; l'intestazione si riconosce dal nome */
function righeDelFoglio(fogli, nome, tipo){
  const f = fogli.find(x => normT(x.nome)===normT(nome)); if(!f) return null;
  const note = new Map(COL_PER[tipo].map(c => [normT(c), c]));
  const i = f.righe.findIndex(r => (r||[]).some(c => normT(c)==='codice') && (r||[]).filter(c => note.has(normT(c))).length >= 3);
  if(i<0) return null;
  const mappa = f.righe[i].map(c => note.get(normT(c)) || null), out = [];
  f.righe.slice(i+1).forEach((r, k) => { if(!(r||[]).some(c => cellaTesto(c))) return;
    const o = {__riga:i+k+2}; mappa.forEach((c, j) => { if(c && o[c]===undefined) o[c] = (r||[])[j]; }); out.push(o); });
  return out;
}
const daEtichetta = (diz, v) => { const n = normT(v); return Object.keys(diz).find(k => normT(diz[k])===n) || ''; };
const daEtichettaInizio = (diz, v) => { const n = normT(v); return n ? Object.keys(diz).find(k => normT(diz[k])===n || normT(diz[k]).startsWith(n) || n.startsWith(normT(diz[k]).split(' ').slice(0, 2).join(' '))) || '' : ''; };
function fonteDalFile(o){
  const t = k => cellaTesto(o[k]), punti = {}, problemi = [];
  SETTE_PUNTI.forEach(([n]) => { const g = leggiData(o[PUNTO_COL(n)]); if(g) punti[n] = g; });
  const tipo = daEtichetta(V_TIPO, t('Tipo')), gr = normT(t('Grado')), grado = /^[1-4]$/.test(gr) ? gr : gr==='esclusa' ? 'esclusa' : '';
  const esito = daEtichettaInizio(V_ESITO, t('Esito')), lic = daEtichetta(V_LICENZA, t('Licenza del calendario')), st = normT(t('Stato'));
  if(!tipo) problemi.push(tr('tipo non riconosciuto'));
  if(!grado) problemi.push(tr('grado non riconosciuto'));
  if(!esito) problemi.push(tr('esito non riconosciuto'));
  const f = {codice:t('Codice').toUpperCase(), nome:t('Nome della fonte').slice(0, 120), tipo, grado, indirizzo:t('Indirizzo').slice(0, 500), lette:leggiData(o['Condizioni lette il'])||'', esito,
    licenzaTipo:lic==='np' ? '' : lic, licenza:t('Nome della licenza').slice(0, 120), attribuzione:t('Attribuzione richiesta').slice(0, 160), punti, stato:st==='non piu in uso' ? 'non' : 'uso',
    note:t('Note').slice(0, 300), registrata:leggiData(o['Data di registrazione'])||'', aggiornata:new Date().toISOString(), invio:true,
    rettifiche:t('Rettifiche') ? [{data:'', testo:t('Rettifiche').slice(0, 400)}] : [],
    extra:{funzione:t('Funzione che annota').slice(0, 60), rif:t('Rif. libro mastro').slice(0, 60), collegamenti:t('Collegamenti').slice(0, 200), contestazione:t('Contestazione in corso').slice(0, 10)}};
  return {f, problemi};
}
function rigaDalRegistro(o){
  const t = k => cellaTesto(o[k]), colonne = {};
  COL_EVENTI.forEach(c => { const v = o[c]; if(v!=null && v!=='') colonne[c] = typeof v==='number' ? v : String(v).slice(0, 400); });
  const q = o['Data e ora di pubblicazione'], g = leggiData(q), h = leggiOra(typeof q==='number' ? q : String(q||'').split(/\s+/)[1]);
  const quando = g ? new Date(dIso(g).getTime() + (h ? (+h.slice(0,2)*60 + +h.slice(3))*6e4 : 0)).toISOString() : '';
  const rit = leggiData(o['Ritiro prima della fine: data']);
  return {codice:t('Codice').toUpperCase(), id:t("Identificativo dell'evento").slice(0, 60), quando, corretto:'', nascosto:normT(t('Evento nascosto'))==='si', canale:daEtichetta(V_CANALE, t('Canale di immissione')) || 'singolo',
    funzione:t('Funzione che annota') || 'Redazione eventi', titolo:t('Titolo (senza nomi di persone)').slice(0, 200), testoFonte:t('Testo del campo «Fonte:»').slice(0, 160), collegamento:t("Collegamento alla pagina dell'evento").slice(0, 500),
    fs:t('Fonte (codice FS)').toUpperCase(), ritiro:rit ? {data:rit, motivo:daEtichetta(V_RITIRO, t('Motivo del ritiro'))} : null, scadenza:leggiData(o['Scadenza della conservazione']) || (g ? piuAnni(g, CINQUE_ANNI) : ''),
    rettifiche:[], mano:true, invio:true, colonne};
}
function npDalFile(o){
  const t = k => cellaTesto(o[k]);
  return {codice:t('Codice').toUpperCase(), registrata:leggiData(o['Data di registrazione'])||'', richiesta:leggiData(o['Data della richiesta'])||'', organizzatore:t('Organizzatore (denominazione o codice P)').slice(0, 120),
    evento:t('Evento richiesto (senza nomi)').slice(0, 160), motivo:daEtichetta(V_MOTIVO_NP, t('Motivo')), motivazioneData:leggiData(o['Motivazione inviata: data'])||'', motivazioneCanale:t('Motivazione: canale').slice(0, 40),
    chiusa:leggiData(o['Data di chiusura']) || (normT(t('Stato'))==='chiusa' ? leggiData(o['Data di registrazione'])||'' : ''), note:t('Note').slice(0, 300), aggiornata:new Date().toISOString(), invio:true,
    rettifiche:t('Rettifiche') ? [{data:'', testo:t('Rettifiche').slice(0, 400)}] : [], extra:{funzione:t('Funzione che annota').slice(0, 60), rif:t('Rif. libro mastro').slice(0, 60), collegamenti:t('Collegamenti').slice(0, 200), contestazione:t('Contestazione in corso').slice(0, 10)}};
}
const stessaFonte = (a, b) => normT(a.nome)===normT(b.nome) && normT(a.indirizzo)===normT(b.indirizzo);
function importaRegistro(file){
  const nome = String(file.name||'');
  RX.imp = {nome, fase:'leggo', errore:'', fonti:[], righe:[], np:[], scarti:[]}; PB.errore = ''; PB.msg = ''; apri('pb-regimporta');
  const I = RX.imp;
  Promise.all([file.arrayBuffer().then(b => MODULI.excel.leggi(b, nome)), regApri()]).then(([wb]) => {
    if(RX.imp!==I) return;
    if(REG.stato!=='aperto'){ I.fase = 'pronto'; I.errore = statoRegistro(); disegnaFoglio(); return; }
    const d = REG.dati, F = righeDelFoglio(wb.fogli, 'Fonti', 'fonti'), E = righeDelFoglio(wb.fogli, 'Eventi', 'eventi'), N = righeDelFoglio(wb.fogli, 'Non pubblicati', 'np');
    if(!F && !E && !N){ I.fase = 'pronto'; I.errore = tr('Nel file non trovo i fogli «Fonti», «Eventi» e «Non pubblicati» del registro delle fonti, con le intestazioni del modello.'); disegnaFoglio(); return; }
    const esempio = o => normT(o.Codice)==='esempio' || !cellaTesto(o.Codice);
    const visti = new Set();
    (F||[]).filter(o => !esempio(o)).forEach(o => { const {f, problemi} = fonteDalFile(o), qui = regFonte(f.codice);
      if(!PREFISSI.fonti.test(f.codice) || visti.has(f.codice)){ I.scarti.push(tr('Fonti, riga {r}: codice «{c}» non valido o ripetuto',{r:o.__riga, c:f.codice.slice(0, 20)})); return; } visti.add(f.codice);
      if(!f.nome){ I.scarti.push(tr('Fonti, riga {r}: manca il nome della fonte',{r:o.__riga})); return; }
      I.fonti.push({f, riga:o.__riga, problemi, esito:!qui ? 'nuova' : stessaFonte(qui, f) ? 'presente' : 'contrasto', qui}); });
    (E||[]).filter(o => !esempio(o)).forEach(o => { const r = rigaDalRegistro(o);
      if(!PREFISSI.eventi.test(r.codice) || visti.has(r.codice)){ I.scarti.push(tr('Eventi, riga {r}: codice «{c}» non valido o ripetuto',{r:o.__riga, c:r.codice.slice(0, 20)})); return; } visti.add(r.codice);
      if(!r.id || !r.quando){ I.scarti.push(tr('Eventi, riga {r}: mancano l’identificativo o la data di pubblicazione',{r:o.__riga})); return; }
      const qui = d.eventi.find(x => x.codice===r.codice || x.id===r.id);
      I.righe.push({r, riga:o.__riga, esito:!qui ? 'nuova' : qui.codice===r.codice && qui.id===r.id ? 'presente' : 'contrasto'}); });
    (N||[]).filter(o => !esempio(o)).forEach(o => { const x = npDalFile(o);
      if(!PREFISSI.np.test(x.codice) || visti.has(x.codice)){ I.scarti.push(tr('Non pubblicati, riga {r}: codice «{c}» non valido o ripetuto',{r:o.__riga, c:x.codice.slice(0, 20)})); return; } visti.add(x.codice);
      const qui = d.nonPubblicati.find(y => y.codice===x.codice);
      I.np.push({x, riga:o.__riga, esito:!qui ? 'nuova' : normT(qui.evento)===normT(x.evento) && qui.richiesta===x.richiesta ? 'presente' : 'contrasto'}); });
    I.fase = 'pronto'; disegnaFoglio();
  }).catch(e => { if(RX.imp!==I) return; I.fase = 'pronto';
    I.errore = e && e.motivo==='protetto' ? tr('Il file si apre con una password: l’app non lo legge così. Aprilo con il programma del dispositivo, salvane una copia senza password solo per l’importazione, importala e poi cancellala.')
      : tr('Il file non si legge: controlla che sia il file .xlsx del registro delle fonti.'); disegnaFoglio(); });
}
function fPbRegImporta(){
  const I = RX.imp, testa = `<div class="riga-titolo"><div><h2>${tr('Importa il registro tenuto a mano')}</h2><p class="meta">${I ? esc(I.nome) : ''}</p></div>${chiudiBtn('pb-registro')}</div>`;
  if(!I) return foglio('forte', testa, '');
  if(I.fase==='leggo') return foglio('forte', testa, `<p class="caricamento">${tr('Leggo il file…')}</p>`);
  const conta = (l, e) => l.filter(x => x.esito===e).length, nuove = conta(I.fonti, 'nuova')+conta(I.righe, 'nuova')+conta(I.np, 'nuova');
  const contrasti = I.fonti.filter(x => x.esito==='contrasto').map(x => tr('{c}: nel file «{a}», sul dispositivo «{b}»',{c:x.f.codice, a:x.f.nome, b:x.qui.nome}))
    .concat(I.righe.filter(x => x.esito==='contrasto').map(x => tr('{c}: il codice o l’identificativo c’è già, con un’altra riga',{c:x.r.codice})), I.np.filter(x => x.esito==='contrasto').map(x => tr('{c}: c’è già un’altra richiesta con questo codice',{c:x.x.codice})));
  const problemi = I.fonti.filter(x => x.esito==='nuova' && x.problemi.length).map(x => tr('{c}: {p} (correggila nell’elenco delle fonti prima di usarla)',{c:x.f.codice, p:x.problemi.join(', ')}));
  const gruppo = (tit, l) => l.length ? `<p class="etich">${tit} · ${l.length}</p><div class="imp-righe">${l.map(x => `<div>${esc(x)}</div>`).join('')}</div>` : '';
  const corpo = `${I.errore ? `<p class="err" role="alert">${esc(I.errore)}</p>` : ''}${statoPb()}
    ${I.errore ? '' : `<p>${tr('Nel file: {f} fonti, {e} righe degli eventi, {n} non pubblicati.',{f:I.fonti.length, e:I.righe.length, n:I.np.length})}</p>
    <p class="meta">${tr('Entrano con i loro codici, che non si rinumerano. Ciò che c’è già sul dispositivo non si tocca; ciò che è in contrasto resta fuori e si sistema a mano. Le voci importate partono per lo sportello con la prossima pubblicazione, insieme al primo codice F che lo sportello può dare dopo quelli scritti a mano.')}</p>
    ${gruppo(tr('Da importare'), [[conta(I.fonti, 'nuova'), tr('fonti')], [conta(I.righe, 'nuova'), tr('righe degli eventi')], [conta(I.np, 'nuova'), tr('non pubblicati')]].filter(x => x[0]).map(x => x[0]+' '+x[1]))}
    ${gruppo(tr('Già sul dispositivo'), [[conta(I.fonti, 'presente'), tr('fonti')], [conta(I.righe, 'presente'), tr('righe degli eventi')], [conta(I.np, 'presente'), tr('non pubblicati')]].filter(x => x[0]).map(x => x[0]+' '+x[1]))}
    ${gruppo(tr('In contrasto: restano fuori'), contrasti)}${gruppo(tr('Da controllare dopo l’importazione'), problemi)}${gruppo(tr('Scartate'), I.scarti)}`}
    <div class="tasti"><button class="tasto sec" data-az="pb-registro">${tr('Annulla')}</button><button class="tasto pri" data-az="rx-importa-ok" ${nuove && !PB.lavoro && !I.errore ? '' : 'disabled'}>${tr('Importa')}</button></div>`;
  return foglio('forte alto', testa, corpo);
}
function confermaImportRegistro(){
  const I = RX.imp; if(!I || PB.lavoro || REG.stato!=='aperto') return;
  const d = REG.dati, prima = JSON.stringify(d);
  I.fonti.filter(x => x.esito==='nuova').forEach(x => d.fonti.push(x.f));
  I.righe.filter(x => x.esito==='nuova').forEach(x => d.eventi.push(x.r));
  I.np.filter(x => x.esito==='nuova').forEach(x => d.nonPubblicati.push(x.x));
  const n = I.fonti.filter(x => x.esito==='nuova').length + I.righe.filter(x => x.esito==='nuova').length + I.np.filter(x => x.esito==='nuova').length;
  REG.dati = regInForma(d);
  PB.lavoro = true; disegnaFoglio();
  regSalva().then(() => { PB.lavoro = false; registra('registro-importa', {n}); RX.imp = null; PB.msg = tr('Importate {n} voci del registro tenuto a mano.',{n}); apri('pb-registro'); },
    () => { PB.lavoro = false; REG.dati = regInForma(JSON.parse(prima)); PB.errore = tr('Non sono riuscito a salvare il registro delle fonti su questo dispositivo.'); disegnaFoglio(); });
}

/* ---------- Il confronto con lo sportello (cap. 22, regola 4; un secondo dispositivo) ---------- */
function apriConfronto(){
  const a = oggi(); RX.conf = RX.conf || {da:a.slice(0, 4)+'-01-01', a, fase:'', esito:null, errore:''};
  RX.conf.esito = null; RX.conf.errore = ''; PB.errore = ''; PB.msg = ''; apri('pb-confronto');
}
/* tutte le buste dello sportello, a blocchi di 500, e gli eventi pubblicati la prima volta nel periodo (con un giorno in più per parte, perché l'ora della riga è quella del dispositivo e quella della copia è dello sportello) */
async function leggiSportelloRegistro(da, a){
  const buste = []; let pubblicati = [], dopo, giri = 0;
  for(;;){
    const c = {operazione:'registro'}; if(dopo) c.dopo = dopo; if(!giri){ c.da = piuGiorni(da, -1); c.a = piuGiorni(a, 1); }
    const r = await SPORTELLO.chiedi(c); buste.push(...(r.buste||[])); if(!giri) pubblicati = r.pubblicati||[];
    if(!r.altre || !(r.buste||[]).length || ++giri > 40) break;
    dopo = r.buste[r.buste.length-1].nome;
  }
  return {buste, pubblicati};
}
async function confronta(){
  const C = RX.conf; if(!C || C.fase==='lavoro') return;
  if(!giornoReg(C.da) || !giornoReg(C.a) || C.da > C.a){ C.errore = tr('Scegli un periodo: il primo giorno e l’ultimo, in quest’ordine.'); disegnaFoglio(); return; }
  C.fase = 'lavoro'; C.errore = ''; C.esito = null; disegnaFoglio();
  try{
    await regApri(); if(REG.stato!=='aperto') throw Object.assign(new Error('registro'), {motivo:'registro'});
    const {buste, pubblicati} = await leggiSportelloRegistro(C.da, C.a);
    const aperte = []; let chiuse = 0;
    for(const b of buste.sort((x, y) => x.nome < y.nome ? -1 : 1)){
      try{ const x = JSON.parse(await CHIAVI.registro.decifra(b.busta)); aperte.push({b, x}); }catch(e){ chiuse++; }
    }
    const d = REG.dati, righe = new Map(d.eventi.map(r => [r.id, r]));
    /* che cosa c'è nelle buste e manca qui: righe (con il codice F dato dallo sportello), fonti e «Non pubblicati» */
    const daSportello = new Map(), fonti = new Map(), np = new Map(), contrasti = [];
    aperte.forEach(({b, x}) => {
      (Array.isArray(x.righe) ? x.righe : []).forEach(r => { if(!r || typeof r.id!=='string') return; const prec = daSportello.get(r.id);
        const y = Object.assign({}, r, {codice:(b.codici||{})[r.id] || r.codice || (prec||{}).codice || '', quando:(prec && prec.quando) || r.quando || '', agg:b.quando});
        daSportello.set(r.id, y); });
      (Array.isArray(x.fonti) ? x.fonti : []).forEach(f => { if(f && PREFISSI.fonti.test(f.codice)) fonti.set(f.codice, f); });
      (Array.isArray(x.nonPubblicati) ? x.nonPubblicati : []).forEach(y => { if(y && PREFISSI.np.test(y.codice)) np.set(y.codice, y); });
    });
    const cmp = r => JSON.stringify([r.g, r.titolo, r.ritiro && r.ritiro.motivo, r.testoFonte, r.collegamento, r.colonne]);
    const nuoveRighe = [...daSportello.values()].filter(r => { const q = righe.get(r.id); return !q || (!q.codice && r.codice) || (!q.quando && r.quando) || String(r.agg) > String(q.agg || q.corretto || q.quando || '') && cmp(r)!==cmp(q); });
    const nuoveFonti = [...fonti.values()].filter(f => { const q = regFonte(f.codice); if(!q) return true; if(!stessaFonte(q, f)){ contrasti.push(tr('{c}: sullo sportello «{a}», qui «{b}»',{c:f.codice, a:f.nome, b:q.nome})); return false; } return String(f.aggiornata||'') > String(q.aggiornata||''); });
    const nuoviNp = [...np.values()].filter(y => { const q = d.nonPubblicati.find(z => z.codice===y.codice); return !q || String(y.aggiornata||'') > String(q.aggiornata||''); });
    /* la corrispondenza nel periodo: gli eventi pubblicati la prima volta, secondo lo storico, contro le righe */
    const tutte = new Map([...righe].concat([...daSportello].filter(([id]) => !righe.has(id))));
    const nel = (g, x) => g >= C.da && g <= C.a, idPub = new Set(pubblicati.map(p => p.id));
    const pubNel = pubblicati.filter(p => nel(giornoRiga(p))), righeNel = [...tutte.values()].filter(r => !r.mano && r.quando && nel(giornoRiga(r)));
    const senzaRiga = pubNel.filter(p => !tutte.has(p.id)), senzaEvento = righeNel.filter(r => !idPub.has(r.id));
    C.esito = {pubblicati:pubNel.length, righe:righeNel.length, mano:[...tutte.values()].filter(r => r.mano && nel(giornoRiga(r))).length, senzaRiga, senzaEvento, chiuse, buste:buste.length,
      nuoveRighe, nuoveFonti, nuoviNp, contrasti};
    registra('registro-confronta', {n:pubNel.length});
  }catch(e){ C.errore = e && e.motivo==='registro' ? statoRegistro() : errorePb(e); }
  C.fase = ''; if(st.foglio==='pb-confronto') disegnaFoglio();
}
function riprendiDalloSportello(){
  const C = RX.conf, E = C && C.esito; if(!E || PB.lavoro || REG.stato!=='aperto') return;
  const d = REG.dati, prima = JSON.stringify(d);
  E.nuoveRighe.forEach(r => { const q = d.eventi.find(x => x.id===r.id), y = Object.assign({}, r); delete y.invio;
    if(!q){ y.invio = false; d.eventi.push(y); return; }
    const quando = q.quando || y.quando, codice = q.codice || y.codice;
    if(String(y.agg) > String(q.agg || q.corretto || q.quando || '')) Object.assign(q, y); q.quando = quando; q.codice = codice; q.invio = false; });
  E.nuoveFonti.forEach(f => { const q = regFonte(f.codice), y = Object.assign({}, f, {invio:false}); if(q) Object.assign(q, y); else d.fonti.push(y); });
  E.nuoviNp.forEach(x => { const q = d.nonPubblicati.find(z => z.codice===x.codice), y = Object.assign({}, x, {invio:false}); if(q) Object.assign(q, y); else d.nonPubblicati.push(y); });
  const n = E.nuoveRighe.length + E.nuoveFonti.length + E.nuoviNp.length;
  REG.dati = regInForma(d); PB.lavoro = true; disegnaFoglio();
  regSalva().then(() => { PB.lavoro = false; registra('registro-riprendi', {n}); PB.msg = tr('Riprese dallo sportello {n} voci del registro.',{n}); C.esito = null; disegnaFoglio(); },
    () => { PB.lavoro = false; REG.dati = regInForma(JSON.parse(prima)); PB.errore = tr('Non sono riuscito a salvare il registro delle fonti su questo dispositivo.'); disegnaFoglio(); });
}
function fPbConfronto(){
  const C = RX.conf, testa = `<div class="riga-titolo"><div><h2>${tr('Confronta con lo sportello')}</h2><p class="meta">${tr('Registro delle fonti · cap. 22, regola 4')}</p></div>${chiudiBtn('pb-registro')}</div>`;
  if(!C) return foglio('forte', testa, '');
  const E = C.esito, giorno = x => esc(dIso(x).toLocaleDateString(dloc(), {day:'numeric', month:'short', year:'numeric'}));
  const lista = (tit, l, f) => l.length ? `<p class="etich">${tit} · ${l.length}</p><div class="imp-righe">${l.slice(0, 200).map(x => `<div>${f(x)}</div>`).join('')}${l.length>200 ? `<div>${tr('… e altre {n}',{n:l.length-200})}</div>` : ''}</div>` : '';
  const esito = !E ? '' : `<div class="red-riquadro" role="status"><b>${E.pubblicati===E.righe && !E.senzaRiga.length && !E.senzaEvento.length ? tr('Le righe corrispondono agli eventi pubblicati: {n}.',{n:E.pubblicati}) : tr('Eventi pubblicati la prima volta nel periodo, secondo lo storico: {p} · righe del registro nel periodo: {r}.',{p:E.pubblicati, r:E.righe})}</b>
      <span class="meta">${tr('Una differenza è uno scarto da spiegare e correggere prima del rilascio (§ 18.8). Le righe scritte a mano ({m} nel periodo) non si confrontano: quegli eventi non sono passati dallo sportello.',{m:E.mano})}${E.chiuse ? ' '+tr('{n} buste dello sportello non si aprono con la chiave del registro di questo dispositivo.',{n:E.chiuse}) : ''}</span></div>
    ${lista(tr('Pubblicati senza una riga del registro'), E.senzaRiga, p => `<code class="red-id">${esc(p.id)}</code> · ${esc(quandoPb(p.quando))}${p.codice ? ' · '+esc(p.codice) : ''}`)}
    ${lista(tr('Righe senza un evento pubblicato nello storico'), E.senzaEvento, r => `${esc(r.codice||'—')} · ${esc(r.titolo)} · ${esc(quandoPb(r.quando))}`)}
    ${lista(tr('Fonti in contrasto: stesso codice, fonte diversa'), E.contrasti, x => esc(x))}
    ${E.nuoveRighe.length + E.nuoveFonti.length + E.nuoviNp.length ? `<div class="red-riquadro"><b>${tr('Sullo sportello ci sono voci che qui mancano o sono più vecchie')}</b>
      <span class="meta">${tr('{r} righe degli eventi, {f} fonti, {n} non pubblicati: le ha scritte un altro dispositivo, oppure questo prima di un ripristino.',{r:E.nuoveRighe.length, f:E.nuoveFonti.length, n:E.nuoviNp.length})}</span>
      <div class="tasti"><button class="tasto pri" data-az="rx-riprendi" ${PB.lavoro ? 'disabled' : ''}>${tr('Riprendile su questo dispositivo')}</button></div></div>`
      : `<p class="meta">${tr('Su questo dispositivo ci sono già tutte le voci che lo sportello conserva ({b} buste).',{b:E.buste})}</p>`}`;
  const corpo = `<p class="meta">${tr('Nel riesame il numero di righe del periodo deve corrispondere al numero di eventi pubblicati, ricavato dallo storico delle pubblicazioni. Lo sportello restituisce le sue buste del registro, chiuse: si aprono qui, con la chiave del registro.')}</p>
    <div class="due"><div class="stack-s"><label class="etich" for="rx-da">${tr('Dal')}</label><div class="campo"><input id="rx-da" type="date" data-rxcampo="da" value="${esc(C.da)}"></div></div>
      <div class="stack-s"><label class="etich" for="rx-a">${tr('Al')}</label><div class="campo"><input id="rx-a" type="date" data-rxcampo="a" value="${esc(C.a)}"></div></div></div>
    ${C.errore ? `<p class="err" role="alert">${esc(C.errore)}</p>` : ''}${statoPb()}
    <div class="tasti"><button class="tasto pri" data-az="rx-confronta-ok" ${C.fase==='lavoro' ? 'disabled' : ''}>${C.fase==='lavoro' ? tr('Chiedo allo sportello…') : tr('Confronta')}</button></div>
    ${C.fase==='lavoro' ? `<p class="caricamento">${tr('Chiedo allo sportello le buste del registro e lo storico del periodo…')}</p>` : ''}
    ${C.da && C.a && E ? `<p class="meta">${tr('Periodo: dal {a} al {b}.',{a:giorno(C.da), b:giorno(C.a)})}</p>` : ''}${esito}`;
  return foglio('forte alto', testa, corpo);
}

/* ---------- Tocchi, campi e file ---------- */
function scegliFileRegistro(scopo){ RX.scopo = scopo; $('fileRegistro').click(); }
$('fileRegistro').addEventListener('change', function(){
  const f = this.files && this.files[0], scopo = RX.scopo || (st.foglio==='pb-calendario' ? 'calendario' : 'registro'); RX.scopo = ''; this.value = ''; if(!f) return;
  if(scopo==='registro') importaRegistro(f);
  else if(scopo==='calendario' && typeof importaCalendario==='function') importaCalendario(f);
});
function clickRegistro(t){
  if(t.dataset.rxnp){ apriNp(t.dataset.rxnp); return true; }
  return false;
}
function azioneRegistro(az){
  switch(az){
    case 'pb-registro': PB.fonte = null; RX.np = null; PB.errore = ''; apri('pb-registro'); regApri().then(ridisegnaPb); break;
    case 'rx-np': RX.np = null; PB.errore = ''; apri('pb-np'); regApri().then(ridisegnaPb); break;
    case 'rx-np-nuovo': apriNp(null); break;
    case 'rx-np-salva': salvaNp(); break;
    case 'rx-esporta': regApri().then(esportaRegistro); break;
    case 'rx-importa': scegliFileRegistro('registro'); break;
    case 'rx-importa-ok': confermaImportRegistro(); break;
    case 'rx-confronta': apriConfronto(); break;
    case 'rx-confronta-ok': confronta(); break;
    case 'rx-riprendi': riprendiDalloSportello(); break;
    default: return false;
  }
  return true;
}
function inputRegistro(el){
  const d = el.dataset;
  if(d.npcampo && RX.np){ RX.np[d.npcampo] = el.value; return true; }
  if(d.rxcampo && RX.conf){ RX.conf[d.rxcampo] = el.value; return true; }
  return false;
}
const cambioRegistro = inputRegistro;

/* ======================= Importazione dei calendari aperti dei Comuni (T-044) =======================
   Libro mastro: § 2.2, canale 3; § 5.4 (si importano in blocco soltanto i calendari che i Comuni pubblicano come dati
   aperti); § 6.4 (i sette punti, prima della prima importazione da ciascun Comune; licenze; testi riscritti, nessuna
   immagine; ogni aggiornamento ripassa dalla revisione e un evento tolto dal Comune si toglie anche dalla mappa); § 6.6
   (attribuzione chiesta dalla licenza; le licenze a condivisione alle stesse condizioni non si importano in blocco);
   cap. 22 (canale «calendario in dati aperti»; i sette punti e la licenza nella riga FS).

   Il calendario è un file che la Redazione scarica dal sito o dal portale dei dati aperti del Comune, con il dispositivo
   della redazione (punto 6): l'app non lo chiede alla rete. Formati: CSV (o .xlsx), JSON, iCalendar (.ics).
   1. Si sceglie la fonte del registro (tipo «calendario in dati aperti»): l'importazione resta chiusa finché mancano la
      licenza o la data di uno dei sette punti, o se l'esito non è «ammessa»; con una licenza a condivisione alle stesse
      condizioni resta chiusa sempre: quegli eventi si inseriscono a mano, uno per uno.
   2. Si legge il file e si dice quale colonna (o quale campo) porta il titolo, l'inizio, il luogo e il resto: l'app
      propone una corrispondenza dai nomi, la Redazione la conferma o la cambia, e l'app la ricorda per quella fonte.
      Nei file iCalendar i campi sono quelli dello standard (SUMMARY, DTSTART, DTEND, LOCATION, GEO, URL, UID…).
   3. Le righe passano dalla stessa anteprima del file Excel (importa-excel.js, T-042), con il canale «calendario»: il
      campo «Fonte:» porta l'attribuzione chiesta dalla licenza; la descrizione del Comune non si pubblica (punto 5): si
      vede nella scheda della riga come testo da riscrivere, e la riga resta «da sistemare» finché la Redazione non
      scrive la sua. Gli strati sono quelli dell'app (§ 6.3, regola 1): uno per tutto il calendario, da correggere riga
      per riga. Dieci domande, nomi, evento politico e avviso si scelgono una volta per l'importazione, e ogni riga si
      guarda e si segna comunque «L'ho vista: pubblicala».
   4. Un aggiornamento dello stesso calendario: gli eventi già pubblicati e uguali restano dove sono; quelli cambiati
      tornano come correzioni, con la descrizione già riscritta; quelli che il Comune ha tolto e che sono ancora sulla
      mappa si elencano «da ritirare» (§ 6.4, punto 7; § 5.2). L'evento si riconosce dall'identificativo che il
      calendario gli dà (UID nei file iCalendar); se il calendario non ne ha, da titolo, giorno e ora.

   Testi come testo (T-024): ogni testo del calendario entra nella pagina solo con esc(). */
const CAL = {stato:null};   /* {fonte, nome, fase: 'scegli'|'leggo'|'mappa', record, colonne, mappa, scelte, errore} */
const CAMPI_CAL = [['titolo', 'Titolo', true], ['inizio', 'Inizio (giorno, o giorno e ora)', true], ['oraInizio', 'Ora di inizio, se è in una colonna a parte'], ['fine', 'Fine (giorno, o giorno e ora)'],
  ['oraFine', 'Ora di fine, se è in una colonna a parte'], ['luogo', 'Nome del luogo'], ['indirizzo', 'Indirizzo'], ['lat', 'Latitudine'], ['lng', 'Longitudine'], ['link', 'Collegamento alla pagina dell’evento'],
  ['organizzatore', 'Organizzatore'], ['prezzo', 'Prezzo'], ['strato', 'Categoria (per lo strato dell’app)'], ['testo', 'Descrizione del Comune (si riscrive, non si pubblica)'], ['chiave', 'Identificativo dell’evento nel calendario']];
/* nomi frequenti delle colonne, per la corrispondenza proposta */
const SINONIMI_CAL = {titolo:['titolo', 'title', 'nome', 'nome evento', 'denominazione', 'evento', 'summary', 'name', 'oggetto'],
  inizio:['data inizio', 'inizio', 'data', 'start', 'start date', 'startdate', 'dtstart', 'data evento', 'dal', 'data di inizio', 'datainizio'],
  oraInizio:['ora inizio', 'ora', 'orario', 'start time', 'ora di inizio', 'orainizio', 'orario inizio'], fine:['data fine', 'fine', 'end', 'end date', 'enddate', 'dtend', 'al', 'data di fine', 'datafine'],
  oraFine:['ora fine', 'end time', 'ora di fine', 'orafine', 'orario fine'], luogo:['luogo', 'sede', 'location name', 'nome luogo', 'venue', 'struttura'],
  indirizzo:['indirizzo', 'address', 'via', 'location', 'indirizzo esteso', 'street address'], lat:['lat', 'latitudine', 'latitude', 'y'], lng:['lng', 'lon', 'long', 'longitudine', 'longitude', 'x'],
  link:['link', 'url', 'sito', 'collegamento', 'pagina', 'web', 'scheda'], organizzatore:['organizzatore', 'organizer', 'ente organizzatore', 'promotore', 'a cura di'],
  prezzo:['prezzo', 'costo', 'biglietto', 'ingresso', 'price', 'tariffa'], strato:['categoria', 'tipologia', 'tipo', 'category', 'genere', 'tema'],
  testo:['descrizione', 'description', 'testo', 'abstract', 'dettagli', 'sommario'], chiave:['id', 'uid', 'identificativo', 'codice', 'id evento', 'identifier']};

/* ---------- Leggere il file: righe come oggetti {colonna: valore} ---------- */
/* iCalendar (RFC 5545): righe ripiegate, parametri, testi con \n \, \; */
function leggiIcs(testo){
  const righe = String(testo).replace(/\r\n[ \t]|\n[ \t]/g, '').split(/\r?\n/), out = []; let ev = null;
  const testoIcs = v => v.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1');
  for(const r of righe){
    if(/^BEGIN:VEVENT$/i.test(r)){ ev = {}; continue; }
    if(/^END:VEVENT$/i.test(r)){ if(ev) out.push(ev); ev = null; if(out.length > MODULI.excel.MAX_RIGHE) throw Object.assign(new Error('righe'), {motivo:'righe'}); continue; }
    if(!ev) continue;
    const m = r.match(/^([A-Za-z-]+)((?:;[^:]*)?):(.*)$/); if(!m) continue;
    const nome = m[1].toUpperCase(), par = m[2], v = m[3];
    if(nome==='DTSTART' || nome==='DTEND'){ const tz = (par.match(/TZID=([^;:]+)/i)||[])[1] || ''; ev[nome] = {v, tz, giorno:/VALUE=DATE(?!-)/i.test(par) || /^\d{8}$/.test(v)}; }
    else if(nome==='GEO'){ const [la, lo] = v.split(/[;,]/).map(Number); if(isFinite(la) && isFinite(lo)){ ev.LAT = la; ev.LNG = lo; } }
    else if(nome==='ORGANIZER'){ ev.ORGANIZER = testoIcs((par.match(/CN=("[^"]*"|[^;:]*)/i)||[])[1]||'').replace(/^"|"$/g, ''); }
    else if(['SUMMARY', 'LOCATION', 'DESCRIPTION', 'URL', 'UID', 'CATEGORIES', 'STATUS'].includes(nome)) ev[nome] = testoIcs(v).slice(0, 4000);
  }
  return out;
}
/* l'istante di un DTSTART o DTEND come giorno e ora italiani */
function quandoIcs(x){
  if(!x || !x.v) return null;
  const m = x.v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/); if(!m) return null;
  if(!m[4]) return {data:m[1]+'-'+m[2]+'-'+m[3], ora:''};
  if(m[7]) return oraItaliana(Date.UTC(+m[1], +m[2]-1, +m[3], +m[4], +m[5], +(m[6]||0)));
  return {data:m[1]+'-'+m[2]+'-'+m[3], ora:m[4]+':'+m[5], fuso:x.tz && !/^Europe\/Rome$/i.test(x.tz) ? x.tz : ''};
}
const oraItaliana = ms => { const t = new Date(ms).toLocaleString('sv-SE', {timeZone:'Europe/Rome', hour12:false}); return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(t) ? {data:t.slice(0, 10), ora:t.slice(11, 16)} : null; };
/* JSON: un elenco di oggetti, anche dentro una proprietà (events, eventi, items, data, records, @graph, features); i campi annidati si appiattiscono (luogo.indirizzo) */
function leggiJsonCal(testo){
  const d = JSON.parse(testo);
  const elenco = Array.isArray(d) ? d : (['eventi', 'events', 'items', 'data', 'records', 'result', '@graph', 'features'].map(k => d && d[k]).find(Array.isArray) || Object.values(d||{}).find(v => Array.isArray(v) && v.some(x => x && typeof x==='object')) || []);
  const piatto = (o, pre, out, liv) => { Object.entries(o||{}).forEach(([k, v]) => { const n = pre ? pre+'.'+k : k;
    if(v && typeof v==='object' && !Array.isArray(v) && liv < 3) piatto(v, n, out, liv+1);
    else if(Array.isArray(v)) { if(n==='geometry.coordinates' && v.length>=2 && isFinite(v[0]) && isFinite(v[1])){ out['geometry.lng'] = v[0]; out['geometry.lat'] = v[1]; } else out[n] = v.filter(x => x==null || typeof x!=='object').join(', '); }
    else if(v!=null) out[n] = typeof v==='string' ? v.slice(0, 4000) : v; }); return out; };
  return elenco.filter(x => x && typeof x==='object').slice(0, MODULI.excel.MAX_RIGHE).map(x => piatto(x, '', {}, 0));
}
async function leggiCalendario(file){
  const nome = String(file.name||'').toLowerCase(), b = await file.arrayBuffer();
  if(b.byteLength > MODULI.excel.MAX_FILE) throw Object.assign(new Error('file'), {motivo:'file'});
  if(/\.ics$/.test(nome)) return {tipo:'ics', record:leggiIcs(new TextDecoder().decode(b))};
  if(/\.json$/.test(nome)) return {tipo:'json', record:leggiJsonCal(new TextDecoder().decode(b))};
  const wb = await MODULI.excel.leggi(b, nome), righe = (wb.fogli[0]||{righe:[]}).righe;
  const i = righe.findIndex(r => (r||[]).filter(c => cellaTesto(c)).length >= 2); if(i<0) return {tipo:'tabella', record:[]};
  const testa = righe[i].map((c, j) => cellaTesto(c) || 'Colonna '+(j+1));
  return {tipo:'tabella', record:righe.slice(i+1).filter(r => (r||[]).some(c => cellaTesto(c))).map(r => Object.fromEntries(testa.map((c, j) => [c, (r||[])[j]==null ? '' : r[j]])))};
}
/* la corrispondenza proposta: per ogni campo, la prima colonna che ha un nome noto */
function mappaProposta(colonne, salvata){
  const m = {}, usate = new Set();
  CAMPI_CAL.forEach(([k]) => { if(salvata && salvata[k] && colonne.includes(salvata[k])){ m[k] = salvata[k]; usate.add(salvata[k]); } });
  CAMPI_CAL.forEach(([k]) => { if(m[k]) return; const c = colonne.find(x => !usate.has(x) && SINONIMI_CAL[k].includes(normT(x.split('.').pop())) ) || colonne.find(x => !usate.has(x) && SINONIMI_CAL[k].includes(normT(x)));
    if(c){ m[k] = c; usate.add(c); } });
  return m;
}
const MAPPA_ICS = {titolo:'SUMMARY', inizio:'DTSTART', fine:'DTEND', indirizzo:'LOCATION', lat:'LAT', lng:'LNG', link:'URL', organizzatore:'ORGANIZER', strato:'CATEGORIES', testo:'DESCRIPTION', chiave:'UID'};

/* ---------- Un valore di giorno e ora da una colonna del calendario ---------- */
function giornoOraCal(v){
  if(v==null || v==='') return null;
  if(typeof v==='object' && v.v) return quandoIcs(v);
  if(typeof v==='number') return {data:leggiData(v), ora:v % 1 ? leggiOra(v) : ''};
  const t = String(v).trim();
  /* un istante con il fuso (2026-12-04T17:30:00Z, +01:00): in ora italiana */
  if(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/i.test(t)){ const ms = Date.parse(t.replace(' ', 'T')); return isNaN(ms) ? null : oraItaliana(ms); }
  const [g, h] = t.split(/[T ]+/), data = leggiData(g); if(!data) return null;
  return {data, ora:h ? leggiOra(h.slice(0, 5)) || '' : ''};
}

/* ---------- Dal calendario alle righe dell'anteprima (importa-excel.js) ---------- */
const chiaveCal = (o, x) => (x.chiave ? 'id:'+String(x.chiave).slice(0, 180) : 'tdo:'+normT(o.titolo)+'|'+o.data+'|'+o.oraInizio);
function righeDalCalendario(C){
  const fo = regFonte(C.fonte), m = C.tipo==='ics' ? MAPPA_ICS : C.mappa, S = C.scelte, v = (r, k) => m[k] ? r[m[k]] : undefined;
  const stratoDef = LAYERS.find(l => l.id===S.strato), righe = [], saltati = {finiti:0, senzaOra:0};
  C.record.forEach((r, i) => {
    if(C.tipo==='ics' && String(r.STATUS||'').toUpperCase()==='CANCELLED') return;   /* un evento annullato nel calendario non entra; se era pubblicato, risulta tra i tolti */
    const a = giornoOraCal(v(r, 'inizio')), b = giornoOraCal(v(r, 'fine'));
    const oraA = a && (a.ora || leggiOra(v(r, 'oraInizio'))), oraB = b ? (b.ora || leggiOra(v(r, 'oraFine')) || '') : leggiOra(v(r, 'oraFine')) || '';
    const o = {__riga:i+1, titolo:cellaTesto(v(r, 'titolo')).slice(0, 100), strato:trovaStrato(v(r, 'strato')) ? v(r, 'strato') : (stratoDef ? stratoDef.id : ''), data:a ? a.data : '', oraInizio:oraA || '', oraFine:'',
      luogo:cellaTesto(v(r, 'luogo')), indirizzo:cellaTesto(v(r, 'indirizzo')), lat:v(r, 'lat'), lng:v(r, 'lng'), link:/^https:\/\//i.test(cellaTesto(v(r, 'link'))) ? cellaTesto(v(r, 'link')) : '',
      organizzatore:cellaTesto(v(r, 'organizzatore')), prezzo:cellaTesto(v(r, 'prezzo')), desc:'', fonte:(fo.attribuzione || fo.nome).slice(0, 160), fs:fo.codice, consultazione:oggi(),
      post:'Non pertinente', dieci:S.dieci==='tutte' ? 'Tutte superate' : '', nomi:S.nomi==='si' ? 'Sì, con il solo ruolo' : S.nomi==='no' ? 'Nessun nome' : '', politico:S.politico==='si' ? 'Sì' : S.politico==='no' ? 'No' : ''};
    /* la fine: un giorno diverso, o un'ora sola */
    if(b && b.data && oraB){ if(b.data===o.data) o.oraFine = oraB; else o.fineIso = b.data+'T'+oraB; }
    else if(oraB) o.oraFine = oraB;
    if(a && !a.ora && !oraA){ saltati.senzaOra++; return; }   /* eventi di tutto il giorno, senza ora: si inseriscono a mano */
    const R = rigaDalFile(o);
    if(R.stato==='rifiutata' && R.motivi.some(x => /già finito/.test(x))){ saltati.finiti++; return; }
    R.chiave = chiaveCal(o, {chiave:v(r, 'chiave')});
    if(a && a.fuso) R.note.push(tr('ora nel fuso «{f}»: controllala',{f:a.fuso}));
    if(R.f){ R.f.testoCal = cellaTesto(v(r, 'testo')).slice(0, 4000); if(!o.link && fo.indirizzo) R.f.fonteLink = fo.indirizzo; R.f.g.avviso = AVVISI_ORG[S.avviso] ? S.avviso : ''; }
    righe.push(R);
  });
  return {righe, saltati};
}
/* un aggiornamento: righe già pubblicate (uguali o cambiate) e eventi tolti dal Comune */
function confrontaAggiornamento(C, righe){
  const vivi = PB.stato ? new Map(PB.stato.eventi.concat(PB.stato.sospesi).map(e => [e.id, e])) : new Map();
  const mie = REG.dati.eventi.filter(r => r.canale==='calendario' && fsRiga(r)===C.fonte && !r.ritiro && r.chiave);
  const perChiave = new Map(mie.map(r => [r.chiave, r])), nelFile = new Set(righe.map(R => R.chiave));
  righe.forEach(R => { const r = perChiave.get(R.chiave), ev = r && vivi.get(r.id); if(!ev || !R.f) return;
    const nuovo = R.f, uguale = ev.titolo===nuovo.titolo.trim() && ev.inizio===nuovo.inizio && (ev.fine||'')===(nuovo.fine||'') && (ev.luogo||'')===nuovo.luogo.trim() && (!nuovo.pos || (Math.abs(ev.lat-nuovo.pos.lat)<1e-5 && Math.abs(ev.lng-nuovo.pos.lng)<1e-5));
    if(uguale){ R.stato = 'pubblicata'; R.codice = r.codice; R.motivi = []; return; }
    /* cambiato nel calendario: torna come correzione, con ciò che la Redazione aveva già scritto */
    Object.assign(nuovo, {id:ev.id, desc:ev.descrizione||'', strato:ev.strato, sub:ev.sottostrato||'', tema:ev.tema||'', comeArrivare:ev.descrizione_luogo||'', organizzatore:nuovo.organizzatore || ev.organizzatore || ''});
    nuovo.g = giudizioInForma(r.g); R.correzione = true; R.note.push(tr('già pubblicato: nel calendario è cambiato, si pubblica come correzione'));
  });
  return mie.filter(r => !nelFile.has(r.chiave) && vivi.has(r.id)).map(r => ({id:r.id, codice:r.codice, titolo:vivi.get(r.id).titolo, inizio:vivi.get(r.id).inizio}));
}

/* ---------- Le schermate ---------- */
/* che cosa manca a una fonte per importarne il calendario (§ 6.4) */
function calendarioChiuso(fo){
  if(!fo) return [tr('scegli la fonte del calendario nel registro')];
  if(fo.tipo!=='calendario') return [tr('la fonte non è di tipo «calendario in dati aperti»')];
  if(fo.licenzaTipo==='condivisione') return [tr('la licenza impone di condividere alle stesse condizioni: questo calendario non si importa in blocco, i suoi eventi si inseriscono a mano, uno per uno (§ 6.4, punto 3)')];
  const m = [];
  if(!fonteAmmessa(fo)) m.push(tr('una fonte ammessa: {c} non lo è',{c:fo.codice}));
  if(!LICENZE_CAL[fo.licenzaTipo]) m.push(tr('la licenza del calendario'));
  const senza = SETTE_PUNTI.filter(([n]) => !(fo.punti||{})[n]).map(x => x[0]);
  if(senza.length) m.push(senza.length===1 ? tr('la data del punto {l} dei sette',{l:senza[0]}) : tr('la data dei punti {l} dei sette',{l:senza.join(', ')}));
  if(fonteDaRicontrollare(fo)) m.push(tr('condizioni del sito rilette negli ultimi dodici mesi'));
  return m;
}
function apriCalendari(){
  CAL.stato = {fase:'scegli', fonte:'', errore:''}; PB.errore = ''; PB.msg = ''; apri('pb-calendario');
  Promise.all([regApri(), PB.stato ? null : aggiornaPb().catch(() => null)]).then(() => { if(st.foglio==='pb-calendario') disegnaFoglio(); });
}
function fPbCalendario(){
  const C = CAL.stato, testa = `<div class="riga-titolo"><div><h2>${tr('Calendari dei Comuni')}</h2><p class="meta">${tr('Calendari pubblicati come dati aperti · § 6.4')}</p></div>${chiudiBtn('pubblica')}</div>`;
  if(!C) return foglio('forte', testa, '');
  const s = statoRegistro(); if(s) return foglio('forte', testa, `<p class="meta" role="status">${esc(s)}</p>`);
  const cal = REG.dati.fonti.filter(f => f.tipo==='calendario'), fo = regFonte(C.fonte), chiuso = calendarioChiuso(fo);
  if(C.fase==='leggo') return foglio('forte', testa, `<p class="caricamento">${tr('Leggo il calendario…')}</p>`);
  if(C.fase==='mappa') return foglio('forte alto', testa, mappaHtml(C, fo));
  const corpo = `${C.errore ? `<p class="err" role="alert">${esc(C.errore)}</p>` : ''}${statoPb()}
    <p class="meta">${tr('Si importano in blocco soltanto i calendari che i Comuni pubblicano come dati aperti. Il file si scarica dal sito o dal portale del Comune con questo dispositivo, in formato CSV, JSON o iCalendar (.ics): l’app non lo chiede alla rete. Ogni evento passa poi dall’anteprima, come le righe del file Excel.')}</p>
    ${cal.length ? `<div class="stack-s"><label class="etich" for="cal-fonte">${tr('Fonte del calendario nel registro')}</label><div class="campo"><select id="cal-fonte" data-calcampo="fonte"><option value="">${tr('— Scegli —')}</option>${cal.map(f => `<option value="${esc(f.codice)}" ${C.fonte===f.codice?'selected':''}>${esc(etichettaFonte(f))}</option>`).join('')}</select></div></div>`
      : `<p class="meta">${tr('Nel registro non c’è ancora nessuna fonte di tipo «calendario in dati aperti». Aggiungila dall’elenco delle fonti, con la licenza e i sette punti.')}</p>`}
    ${fo && chiuso.length ? `<div class="red-riquadro pb-errori" role="alert"><b>${tr('L’importazione è chiusa. Manca:')}</b>${chiuso.map(x => `<span class="err">${esc(x)}</span>`).join('')}<button class="link" data-pbfonte="${esc(fo.codice)}">${tr('Apri la fonte {c}',{c:fo.codice})}</button></div>` : ''}
    ${fo && !chiuso.length ? `<p class="meta">${tr('Nel campo «Fonte:» di ogni evento: «{a}».',{a:esc(fo.attribuzione || fo.nome)})}</p>` : ''}
    <div class="tasti"><button class="tasto sec" data-az="pb-fonti">${tr('Fonti')}</button><button class="tasto pri" data-az="cal-file" ${fo && !chiuso.length ? '' : 'disabled'}>${tr('Scegli il file del calendario')}</button></div>`;
  return foglio('forte alto', testa, corpo);
}
function leggiFileCalendario(file){
  const C = CAL.stato; if(!C) return;
  C.fase = 'leggo'; C.errore = ''; C.nome = String(file.name||''); apri('pb-calendario');
  leggiCalendario(file).then(x => {
    if(CAL.stato!==C) return;
    if(!x.record.length){ C.fase = 'scegli'; C.errore = tr('Nel file non trovo eventi: controlla che sia il calendario in formato CSV, JSON o iCalendar.'); disegnaFoglio(); return; }
    const fo = regFonte(C.fonte);
    C.tipo = x.tipo; C.record = x.record; C.colonne = [...new Set(x.record.slice(0, 200).flatMap(r => Object.keys(r)))].slice(0, 200);
    C.mappa = x.tipo==='ics' ? Object.assign({}, MAPPA_ICS) : mappaProposta(C.colonne, fo && fo.mappa);
    C.scelte = {strato:'', dieci:'', nomi:'', politico:'', avviso:''}; C.fase = 'mappa'; disegnaFoglio();
  }).catch(e => { if(CAL.stato!==C) return; C.fase = 'scegli';
    C.errore = e && e.motivo==='protetto' ? tr('Il file si apre con una password: salvalo senza password e riprova.') : e && e.motivo==='righe' ? tr('Il calendario ha più di 10.000 eventi: dividilo in più file.') : tr('Il file non si legge: controlla che sia un calendario in formato CSV, JSON o iCalendar (.ics).');
    disegnaFoglio(); });
}
function mappaHtml(C, fo){
  const ics = C.tipo==='ics', r0 = C.record[0]||{}, val = k => { const c = C.mappa[k]; if(!c) return ''; const v = r0[c]; return v && typeof v==='object' ? v.v : v==null ? '' : String(v); };
  const mappa = ics ? `<p class="meta">${tr('File iCalendar: i campi sono quelli dello standard (titolo da SUMMARY, inizio e fine da DTSTART e DTEND, luogo da LOCATION, punto da GEO, collegamento da URL, identificativo da UID).')}</p>`
    : `<p class="meta">${tr('Per ogni campo, la colonna del file che lo porta. L’app propone una corrispondenza dai nomi delle colonne e la ricorda per questa fonte. Accanto, il valore del primo evento.')}</p>
      ${CAMPI_CAL.map(([k, lab, serve]) => `<div class="stack-s"><label class="etich" for="cal-m-${k}">${esc(tr(lab))}${serve ? '' : ` <span class="fac">${tr('facoltativo')}</span>`}</label><div class="campo"><select id="cal-m-${k}" data-calmappa="${k}"><option value="">${tr('— Nessuna —')}</option>${C.colonne.map(c => `<option value="${esc(c)}" ${C.mappa[k]===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div>${C.mappa[k] ? `<span class="meta">${tr('Primo evento: {v}',{v:esc(val(k).slice(0, 120) || '—')})}</span>` : ''}</div>`).join('')}`;
  const S = C.scelte, sel = (id, k, lab, voci, nota) => `<div class="stack-s"><label class="etich" for="${id}">${lab}</label><div class="campo"><select id="${id}" data-calscelta="${k}"><option value="">${tr('— Scegli —')}</option>${voci.map(([v, t]) => `<option value="${esc(v)}" ${S[k]===v?'selected':''}>${esc(t)}</option>`).join('')}</select></div>${nota ? `<span class="meta">${nota}</span>` : ''}</div>`;
  const manca = (ics ? [] : CAMPI_CAL.filter(x => x[2] && !C.mappa[x[0]]).map(x => tr(x[1]))).concat(!S.strato ? [tr('lo strato')] : [], !S.dieci ? [tr('le dieci domande')] : [], !S.nomi ? [tr('i nomi di persone')] : [], !S.politico ? [tr('evento politico o religioso')] : [], !S.avviso ? [tr('l’avviso all’organizzatore')] : []);
  return `${statoPb()}<p>${tr('{n} eventi nel file «{f}».',{n:C.record.length, f:esc(C.nome)})}</p>${mappa}
    <h3 class="g-tit">${tr('Per tutte le righe di questa importazione')}</h3>
    <p class="meta">${tr('Valgono per ogni riga, che poi si guarda una per una e si segna «L’ho vista: pubblicala». Una riga diversa dalle altre si corregge nella sua scheda prima di segnarla.')}</p>
    ${sel('cal-strato', 'strato', tr('Strato'), LAYERS.map(l => [l.id, tr(l.label)]), tr('Le categorie della mappa sono gli strati dell’app, non quelle del calendario (§ 6.3). Se la colonna della categoria porta il nome di uno strato, vale quello.'))}
    ${sel('cal-dieci', 'dieci', tr('Le dieci domande'), [['tutte', tr('Tutte superate, salvo correzioni nella scheda di una riga')], ['riga', tr('Rispondo nella scheda di ogni riga')]])}
    ${sel('cal-nomi', 'nomi', tr('Nomi di persone'), [['no', tr('Nessun nome')], ['si', tr('Sì, con il solo ruolo')]])}
    ${sel('cal-politico', 'politico', tr('Evento politico o religioso'), [['no', tr('No')], ['si', tr('Sì')]])}
    ${sel('cal-avviso', 'avviso', tr('Avviso all’organizzatore'), Object.entries(AVVISI_ORG).filter(([v]) => v!=='inviato').map(([v, t]) => [v, tr(t)]))}
    <p class="meta">${tr('La descrizione del Comune non si pubblica: nella scheda di ogni riga si vede come testo da riscrivere con parole proprie (§ 6.4, punto 5).')}</p>
    ${manca.length ? `<p class="meta" role="status">${tr('Per passare all’anteprima manca: {l}.',{l:esc(manca.join('; '))})}</p>` : ''}
    <div class="tasti"><button class="tasto sec" data-az="cal-annulla">${tr('Annulla')}</button><button class="tasto pri" data-az="cal-anteprima" ${manca.length || PB.lavoro ? 'disabled' : ''}>${tr('Passa all’anteprima')}</button></div>`;
}
function anteprimaCalendario(){
  const C = CAL.stato, fo = C && regFonte(C.fonte); if(!C || !fo || calendarioChiuso(fo).length) return;
  if(C.tipo!=='ics' && JSON.stringify(fo.mappa||{})!==JSON.stringify(C.mappa)){ fo.mappa = Object.assign({}, C.mappa); regSalva().catch(() => {}); }
  const {righe, saltati} = righeDalCalendario(C);
  IX.stato = {nome:C.nome, fase:'cerco', righe, fatti:0, daCercare:0, lavoro:false, errore:'', msg:'', canale:'calendario', fonte:fo.codice, saltati, tolti:confrontaAggiornamento(C, righe)};
  CAL.stato = null; registra('calendario-importa', {n:righe.length, c:fo.codice});
  cercaEValuta(IX.stato);
  apri('pb-importa');
}

/* ---------- Tocchi e campi ---------- */
function azioneCalendari(az){
  switch(az){
    case 'pb-calendari': apriCalendari(); break;
    case 'cal-file': scegliFileRegistro('calendario'); break;
    case 'cal-annulla': apriCalendari(); break;
    case 'cal-anteprima': anteprimaCalendario(); break;
    default: return false;
  }
  return true;
}
function cambioCalendari(el){
  const d = el.dataset, C = CAL.stato; if(!C) return false;
  if(d.calcampo){ C[d.calcampo] = el.value; C.errore = ''; disegnaFoglio(); return true; }
  if(d.calmappa){ if(el.value) C.mappa[d.calmappa] = el.value; else delete C.mappa[d.calmappa]; disegnaFoglio(); return true; }
  if(d.calscelta){ C.scelte[d.calscelta] = el.value; disegnaFoglio(); return true; }
  return false;
}
const importaCalendario = leggiFileCalendario;

/* Le 50 domande della tabella «KPI di misurazione senza tracciamento» (file Excel di Lorenzo) (6 ottobre 2026): stato, conformità UE e IT, obblighi.
   Valutazioni di Claude, non parere legale.
   lor/lorD/lorNota: decisione e note di Lorenzo (file restituito il 6 ottobre 2026); risposta: risposte di Claude alle note. Standard: dove UE e Italia divergono vale la regola UE. */
const MZ_KPI = [{"n": 1, "area": "A · Offerta di eventi", "q": "Quanti eventi sono attivi sulla mappa ogni giorno?", "calc": "Conteggio giornaliero degli eventi non scaduti, preso dall'admin alla stessa ora.", "dec": "Se una città ha abbastanza offerta per essere promossa o va prima riempita.", "ut": "Alta", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena: misura la città, non le persone.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "È il KPI più solido che hai: dipende solo da te.", "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "Trasformiamo la narrarativa di nessun archivio storico in \"nessun tipo di profilazione, raccolti solo dati tecnici aggregati\"; sostenere questo con degli esempi già nell'informativa", "risposta": "Annotato per l’informativa che faremo dopo l’MVP. I totali delle Misure sono già solo numeri aggregati, senza dati sulle persone."}, {"n": 2, "area": "A · Offerta di eventi", "q": "Quanti eventi nuovi entrano ogni settimana?", "calc": "Somma settimanale degli inserimenti (manuali + import).", "dec": "Quanto tempo dedicare alla raccolta; se serve aiuto o automazione.", "ut": "Alta", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Misura il tuo carico di lavoro: utile anche per il Business Plan (costo operativo per città).", "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "Rendere chiaro che si tratta del contatore di nuovi eventi inseriti da {nome} (in questo caso da me), e non dai nuovi utenti", "risposta": "Fatto: l’indicatore ora dice «eventi nuovi inseriti da te ({nome})», non nuovi utenti."}, {"n": 3, "area": "A · Offerta di eventi", "q": "Come si distribuiscono gli eventi tra le città?", "calc": "Eventi attivi per città, settimanale.", "dec": "Quali città sono 'vuote' (task Release MVP) e dove concentrare la raccolta.", "ut": "Alta", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Risponde alla voce 'città vuote di eventi' del piano MVP.", "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "", "risposta": ""}, {"n": 4, "area": "A · Offerta di eventi", "q": "Come si distribuiscono gli eventi per categoria/strato?", "calc": "Eventi attivi per strato, settimanale.", "dec": "Su quali tipi di fonte cercare per bilanciare l'offerta.", "ut": "Media", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena: dà visibilità a ciò che è sottorappresentato (orizzontalità).", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": null, "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "", "risposta": ""}, {"n": 5, "area": "A · Offerta di eventi", "q": "In quali quartieri ci sono più o meno eventi?", "calc": "Eventi per circoscrizione/quartiere, mensile, dalle coordinate degli eventi.", "dec": "Dove la città è 'invisibile'; base del Report della Città.", "ut": "Alta", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena: è la mission (asimmetria informativa) resa misurabile.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Il Report della Città può poggiare sull'offerta (cosa succede) invece che sulla domanda (chi guarda): zero rischio.", "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Come faccio a decidere i quartieri di ogni città? Segnare i limiti dei vari quartieri e circoscrizioni è un lavoraccio che va moltitplicato per il numero di città. Quello che farei è mantenere l'impostazione dei vuoti e avere delle heat-map della densità di eventi, tali densità suddivise anche per strato. Per ora la domanda rimane in fase di studio: capire a livello tecnico cosa è fattibile.", "risposta": "Fattibile senza backend: la libreria della mappa (MapLibre) ha uno strato «mappa di densità» che colora dove ci sono più eventi, calcolato sul telefono, anche per strato; nessun confine di quartiere da disegnare. Per vedere l’andamento nel tempo basterebbe salvare ogni giorno, nei totali dell’admin, una griglia di densità a celle di circa 500 m. Da decidere: solo nelle Misure o anche sulla mappa pubblica, accanto ai vuoti."}, {"n": 6, "area": "A · Offerta di eventi", "q": "Quanti eventi arrivano da consenso diretto e quanti da fonti pubbliche?", "calc": "Quota Flusso A / Flusso B sul totale, mensile.", "dec": "Quanto spingere il contatto diretto con gli organizzatori (base giuridica più solida).", "ut": "Alta", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Dati degli organizzatori già trattati; si conta solo il flusso.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Indicatore di rischio legale: più Flusso A = meno esposizione.", "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "Aggiungere un campo nel menù di inserimento on-grid dell'admin riguardo se l'evento che si sta inserendo deriva da un contatto diretto oppure no.", "risposta": ""}, {"n": 7, "area": "A · Offerta di eventi", "q": "Quanti eventi sono gratuiti?", "calc": "Quota di eventi con ingresso libero (se il campo esiste).", "dec": "Coerenza con il principio di accesso libero; argomento per i bandi.", "ut": "Media", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Più avanti", "fase": "MVP", "um": "No", "note": "Solo se l'evento ha già un campo prezzo; non aggiungerlo apposta.", "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "non mi sembra un valore giocabile ai bandi, anzi: io ad un bando mi vanterei di riuscire a portare avanti eventi culturali a pagamento. Ciò dimostra che si può vivere d'arte etc etc", "risposta": "D’accordo, resta in studio. Si può rovesciare la lettura: la quota di eventi a pagamento come segno che la cultura riesce a sostenersi."}, {"n": 8, "area": "A · Offerta di eventi", "q": "In quali giorni e fasce orarie ci sono eventi?", "calc": "Distribuzione degli eventi per giorno della settimana e fascia oraria.", "dec": "Fasce scoperte da segnalare nel Report della Città o alle istituzioni.", "ut": "Media", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Più avanti", "fase": "MVP", "um": "No", "note": null, "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "Perché Claude valuta di farlo più in la?", "risposta": "Nessun motivo legale: l’avevo messa più avanti solo per priorità. Ora è operativa (Offerta → Quando ci sono eventi)."}, {"n": 9, "area": "A · Offerta di eventi", "q": "Con quanto anticipo vengono pubblicati gli eventi?", "calc": "Giorni medi tra inserimento e inizio evento.", "dec": "Se l'app serve a pianificare o solo all'ultimo minuto; frequenza di aggiornamento.", "ut": "Media", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Più avanti", "fase": "MVP", "um": "No", "note": "Richiede di salvare la data di inserimento come campo dell'evento (si cancella con l'evento).", "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Richiede un backend?", "risposta": "No, niente backend: si calcola dalla data di inserimento che l’app salva sugli eventi nuovi (campo «creato») sul telefono dell’admin. Per gli eventi inseriti prima del 6 ottobre la data si ricava, quando possibile, dal codice dell’evento."}, {"n": 10, "area": "A · Offerta di eventi", "q": "Quanti eventi arrivano dall'import dei siti comunali?", "calc": "Eventi importati via Excel / totale, per Comune.", "dec": "Se estendere l'import ad altri Comuni (test Empoli).", "ut": "Alta", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Lega il KPI al lavoro di import già avviato.", "soglia": "No", "lor": "studio", "lorD": "in fase di studio", "lorNota": "Lo spirito della domanda va bene ma va affinata la domanda: non \"da siti comunali\" ma \"eventi istituzionali\" robe del comune e delle istituzioni in generale. Studiare definizione di questo tipo di eventi per avere un KPI chiaro", "risposta": "Proposta per lo studio: un campo «Promotore» nell’evento (istituzionale: Comune, Regione, scuole, biblioteche e musei pubblici, altri enti pubblici · associazione o terzo settore · privato). Il KPI diventa «quota di eventi istituzionali». L’elenco preciso va definito insieme."}, {"n": 11, "area": "A · Offerta di eventi", "q": "Quanti eventi vengono corretti o rimossi dopo la pubblicazione?", "calc": "Conteggio mensile di modifiche/rimozioni fatte dall'admin.", "dec": "Affidabilità delle fonti; quali fonti abbandonare.", "ut": "Media", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti; si tiene solo il contatore, non l'evento.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Più avanti", "fase": "MVP", "um": "No", "note": "Non tenere copia degli eventi rimossi: l'informativa promette che spariscono 3 ore dopo la fine.", "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "", "risposta": ""}, {"n": 12, "area": "A · Offerta di eventi", "q": "Quante fonti monitori e quanti eventi rende ognuna?", "calc": "Elenco fonti con eventi pubblicati per fonte, mensile.", "dec": "Quali fonti tenere nella lista di raccolta.", "ut": "Media", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Fonti = enti/siti. Se una fonte è una persona fisica, aggregare.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": null, "soglia": "No", "lor": "sospeso", "lorD": "Sospesa", "lorNota": "Tale domanda non rappresenta un KPI possibile od una domanda che genera delle statistiche. Tale elenco rimane in mano a me in maniera privata", "risposta": "D’accordo: l’elenco delle fonti resta tuo, fuori dalle Misure."}, {"n": 13, "area": "B · Organizzatori e luoghi", "q": "Quanti organizzatori distinti pubblicano tramite consenso diretto?", "calc": "Conteggio mensile degli organizzatori Flusso A.", "dec": "Dimensione della rete; potenziale per 'Rete dei Luoghi Vivi' (B2B).", "ut": "Alta", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Organizzatori già trattati per il consenso; si usa solo il conteggio.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": null, "soglia": "No", "lor": "rimandato", "lorD": "Rimandata a Fase 2", "lorNota": "", "risposta": ""}, {"n": 14, "area": "B · Organizzatori e luoghi", "q": "Quanti organizzatori tornano a pubblicare?", "calc": "Organizzatori con almeno 2 eventi in 3 mesi / totale.", "dec": "Fidelizzazione della rete; prova per il modello B2B.", "ut": "Media", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Sì: collega lo stesso organizzatore nel tempo.", "eu": "Giallo", "euM": "Riuso di dati degli organizzatori per una finalità statistica: compatibilità ex art. 6(4) e art. 89 GDPR; informativa art. 13(3).", "it": "Giallo", "itM": "Come UE; nessuna norma italiana più restrittiva nota.", "obl": "Aggiungere la finalità statistica all'informativa per gli organizzatori.", "coer": "Buona, se resta interno e aggregato.", "par": "Più avanti", "fase": "MVP", "um": "Sì", "note": "Usare dati raccolti come prova del consenso per una statistica è un nuovo fine: va verificata la compatibilità (art. 6(4) GDPR) e scritta nell'informativa.", "soglia": "No", "lor": "rimandato", "lorD": "Rimandata a Fase 2", "lorNota": "", "risposta": ""}, {"n": 15, "area": "B · Organizzatori e luoghi", "q": "Quante richieste di rimozione o opposizione ricevi, e in quanto tempo le evadi?", "calc": "Registro semplice: data richiesta, data evasione (≤ 48 h promesse).", "dec": "Se la promessa delle 48 h regge; prova di accountability.", "ut": "Alta", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Sì, chi fa la richiesta: già trattato per gestirla.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno di nuovo: è già un obbligo di accountability.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "È di fatto un obbligo: dimostrare che rispetti i diritti (art. 5(2), art. 12 GDPR).", "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "", "risposta": ""}, {"n": 16, "area": "B · Organizzatori e luoghi", "q": "Quante segnalazioni di eventi non validi arrivano?", "calc": "Email ricevute su {casella} per evento errato, mensile.", "dec": "Qualità dei dati; quali fonti sono inaffidabili.", "ut": "Media", "met": "LV · Invio volontario dell'utente (tocco esplicito)", "dati": "Sì, l'email di chi segnala (già prevista dall'informativa).", "eu": "Verde", "euM": "Art. 5(3): esenzione per il servizio esplicitamente richiesto (l'utente sceglie di inviare). GDPR: l'IP transita su Netlify; informativa art. 13 sul nuovo invio; nessun dato oltre il +1.", "it": "Verde", "itM": "Art. 122: invio richiesto dall'utente. Basta aggiornare l'informativa (oggi dice 'Nessun server').", "obl": "Nessuno: il canale è già nell'informativa.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Canale già dichiarato nelle Note legali: non serve niente di nuovo.", "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "", "risposta": ""}, {"n": 17, "area": "B · Organizzatori e luoghi", "q": "Quanti luoghi/spazi distinti compaiono sulla mappa?", "calc": "Conteggio mensile dei luoghi unici con almeno un evento.", "dec": "Lista dei potenziali clienti 'Rete dei Luoghi Vivi'.", "ut": "Alta", "met": "L0 · Dati sul contenuto (nessun utente)", "dati": "Nessuno degli utenti.", "eu": "Verde", "euM": "Nessun dato degli utenti: GDPR non riguarda gli utenti; art. 5(3) Dir. 2002/58/CE non coinvolto (nessun accesso al dispositivo). Eventuali dati degli organizzatori sono già coperti da consenso (art. 6(1)(a)) o legittimo interesse (art. 6(1)(f), Balancing test).", "it": "Verde", "itM": "Art. 122 Codice Privacy non coinvolto; nessun nuovo trattamento sugli utenti.", "obl": "Nessuno. Consigliata una frase in informativa: si tengono solo conteggi aggregati, non i dati degli eventi (oggi dice 'nessun archivio storico').", "coer": "Piena: nessuna visibilità a pagamento, solo censimento.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": null, "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Nota importante: finora {nome} parla di eventi ma non parla di luoghi. ", "risposta": "Giusto: oggi un «luogo» è solo l’indirizzo di un evento. Prima di contarli bisogna decidere se i luoghi diventano un oggetto dell’app, che è anche la base della «Rete dei Luoghi Vivi»."}, {"n": 18, "area": "C · Adozione", "q": "Quante richieste riceve il sito ogni giorno?", "calc": "Richieste/banda dal pannello Netlify, annotate ogni giorno (Free = 24 h).", "dec": "Se il lancio funziona; dato per Smart&Start.", "ut": "Alta", "met": "L1 · Totali aggregati dell'hosting (Netlify)", "dati": "IP trattati da Netlify, mai visti da te.", "eu": "Giallo", "euM": "Netlify tratta già gli IP per servire il sito (IP = dato personale, CGUE C-582/14 Breyer). Leggere solo totali aggregati non crea un dato personale nelle tue mani (CGUE C-413/23 P, 4.9.2025), ma Netlify va dichiarato come responsabile (art. 28) con base per il trasferimento extra-UE. La richiesta della pagina è necessaria alla trasmissione: art. 5(3) esente.", "it": "Giallo", "itM": "Stesso quadro UE. Oggi l'informativa non nomina Netlify tra i servizi che ricevono l'IP: da aggiungere.", "obl": "Dichiarare Netlify nell'informativa; verificare DPA di Netlify e base del trasferimento USA (DPF o SCC). Sul piano Free i dati restano 24 ore: annotarli a mano o passare a un piano a pagamento.", "coer": "Buona: è un totale, non un comportamento.", "par": "Misurare ora", "fase": "MVP", "um": "Sì", "note": "Richieste ≠ persone: una visita fa molte richieste. Va presentato come indice, non come 'utenti'. Verificare cosa esattamente mostra il widget Free.", "soglia": "No", "lor": "segnaposto", "lorD": "Implementare vuoto", "lorNota": "Da capire bene: il KPI è fondamentale ma forse non compliant. La mia scelta definita è: implementiamo il KPI lasciandolo vuoto; avremo cosi lo spazio già pronto per quando saremo pronti a renderlo operativo. Spiegare sulla piattaforma, brevemente, perché è in fase di studio", "risposta": "Spazio pronto e vuoto, come hai chiesto. Perché è in studio: i numeri di Netlify vengono dai registri delle richieste, che contengono gli indirizzi IP dei visitatori. Leggerne solo i totali è probabilmente lecito, ma va verificato cosa registra Netlify e per quanto, e va scritto nell’informativa."}, {"n": 19, "area": "C · Adozione", "q": "Quanta banda consuma il sito e quando ci sono picchi?", "calc": "Banda giornaliera e picchi dal pannello Netlify.", "dec": "Capacità e costi (prova di carico del piano MVP).", "ut": "Media", "met": "L1 · Totali aggregati dell'hosting (Netlify)", "dati": "IP trattati da Netlify, mai visti da te.", "eu": "Giallo", "euM": "Netlify tratta già gli IP per servire il sito (IP = dato personale, CGUE C-582/14 Breyer). Leggere solo totali aggregati non crea un dato personale nelle tue mani (CGUE C-413/23 P, 4.9.2025), ma Netlify va dichiarato come responsabile (art. 28) con base per il trasferimento extra-UE. La richiesta della pagina è necessaria alla trasmissione: art. 5(3) esente.", "it": "Giallo", "itM": "Stesso quadro UE. Oggi l'informativa non nomina Netlify tra i servizi che ricevono l'IP: da aggiungere.", "obl": "Dichiarare Netlify nell'informativa; verificare DPA di Netlify e base del trasferimento USA (DPF o SCC). Sul piano Free i dati restano 24 ore: annotarli a mano o passare a un piano a pagamento.", "coer": "Piena.", "par": "Più avanti", "fase": "MVP", "um": "No", "note": null, "soglia": "No", "lor": "segnaposto", "lorD": "Implementare vuoto", "lorNota": "Da capire bene: il KPI è fondamentale ma forse non compliant. La mia scelta definita è: implementiamo il KPI lasciandolo vuoto; avremo cosi lo spazio già pronto per quando saremo pronti a renderlo operativo. Spiegare sulla piattaforma, brevemente, perché è in fase di studio", "risposta": "Spazio pronto e vuoto, come hai chiesto. Stesso motivo della riga 18: la banda viene dagli stessi registri di Netlify."}, {"n": 20, "area": "C · Adozione", "q": "Le azioni di comunicazione fanno salire gli accessi?", "calc": "Confronto delle richieste giornaliere prima e dopo un post, un volantino o un incontro.", "dec": "Quali canali di comunicazione funzionano.", "ut": "Alta", "met": "L1 · Totali aggregati dell'hosting (Netlify)", "dati": "IP trattati da Netlify, mai visti da te.", "eu": "Giallo", "euM": "Netlify tratta già gli IP per servire il sito (IP = dato personale, CGUE C-582/14 Breyer). Leggere solo totali aggregati non crea un dato personale nelle tue mani (CGUE C-413/23 P, 4.9.2025), ma Netlify va dichiarato come responsabile (art. 28) con base per il trasferimento extra-UE. La richiesta della pagina è necessaria alla trasmissione: art. 5(3) esente.", "it": "Giallo", "itM": "Stesso quadro UE. Oggi l'informativa non nomina Netlify tra i servizi che ricevono l'IP: da aggiungere.", "obl": "Dichiarare Netlify nell'informativa; verificare DPA di Netlify e base del trasferimento USA (DPF o SCC). Sul piano Free i dati restano 24 ore: annotarli a mano o passare a un piano a pagamento.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "Sì", "note": "Non usare parametri UTM o link diversi per canale: per l'EDPB il tracciamento via URL rientra nell'art. 5(3). Basta il confronto per data.", "soglia": "No", "lor": "segnaposto", "lorD": "Implementare vuoto", "lorNota": "Da capire bene: il KPI è fondamentale ma forse non compliant. La mia scelta definita è: implementiamo il KPI lasciandolo vuoto; avremo cosi lo spazio già pronto per quando saremo pronti a renderlo operativo. Spiegare sulla piattaforma, brevemente, perché è in fase di studio", "risposta": "Spazio pronto e vuoto, come hai chiesto. Dipende dalla riga 18: senza i numeri delle richieste non si vede l’effetto delle azioni di comunicazione."}, {"n": 21, "area": "C · Adozione", "q": "Quanti visitatori unici ci sono al giorno?", "calc": "Richiede di distinguere le persone (hash di IP + browser con 'sale' giornaliero).", "dec": "Nessuna in più rispetto alle richieste totali.", "ut": "Bassa", "met": "L3 · Analytics cookieless di terzi", "dati": "Sì: l'hash resta un dato personale per chi lo calcola.", "eu": "Arancio", "euM": "Come L2, più un nuovo responsabile art. 28 (DPA) che tratta IP/hash giornalieri: restano dati personali per il fornitore (C-413/23 P). A livello UE probabile consenso.", "it": "Giallo", "itM": "Garante 2021: senza consenso solo se il terzo maschera almeno il 4° ottetto dell'IP e non incrocia/cede i dati; nuovo fornitore in informativa.", "obl": "Nuovo fornitore + DPA + informativa; a livello UE probabile consenso: OLTRE SOGLIA.", "coer": "Debole: serve a contare persone, non città.", "par": "Non misurare", "fase": "Mai", "um": "Sì", "note": "Il guadagno informativo rispetto alle richieste totali non vale l'esposizione.", "soglia": "Sì", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Perché non è in linea con i nostri principi?", "risposta": "Il problema non è il fine ma il metodo: per contare persone «uniche» bisogna riconoscere lo stesso telefono da un giorno all’altro, con un’impronta calcolata da IP e browser. È un identificativo, anche se temporaneo: per questo è oltre la tua soglia (dato personale e accesso al dispositivo per l’EDPB)."}, {"n": 22, "area": "C · Adozione", "q": "Da quale paese o regione arrivano le visite?", "calc": "Geolocalizzazione dell'IP.", "dec": "Nessuna: la città scelta nell'app (riga 32) è più utile.", "ut": "Bassa", "met": "L3 · Analytics cookieless di terzi", "dati": "Sì, IP.", "eu": "Arancio", "euM": "Come L2, più un nuovo responsabile art. 28 (DPA) che tratta IP/hash giornalieri: restano dati personali per il fornitore (C-413/23 P). A livello UE probabile consenso.", "it": "Giallo", "itM": "Garante 2021: senza consenso solo se il terzo maschera almeno il 4° ottetto dell'IP e non incrocia/cede i dati; nuovo fornitore in informativa.", "obl": "Nuovo fornitore + DPA + informativa; a livello UE probabile consenso: OLTRE SOGLIA.", "coer": "Debole.", "par": "Non misurare", "fase": "Mai", "um": "No", "note": "Sostituita da 'città selezionata nell'app'.", "soglia": "Sì", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Credo che potrebbe essere importante, faccio un esempio: si scopre che molte persone di zone rurali dove non c'è niente guardano cosa c'è in città e partecipano ad eventi nelle città vicine diminuendo cosi il loro carico di solitudine legato alla vita in una zona rurale. E' difficile sapere di eventi stando fuori dal loro contesto, {nome} potrebbe risolvere il problema.", "risposta": "L’esempio è forte e coerente con la missione. Due strade: geolocalizzare l’IP (dato personale e accesso al dispositivo: oltre soglia) oppure chiederlo in modo volontario, per esempio «da dove vieni?» con il comune scelto dall’elenco, insieme alle altre misure volontarie."}, {"n": 23, "area": "C · Adozione", "q": "Da quali siti arrivano le visite?", "calc": "Intestazione 'referrer' delle richieste.", "dec": "Quali siti partner mandano persone.", "ut": "Media", "met": "L3 · Analytics cookieless di terzi", "dati": "Indiretti: il referrer può contenere URL con dati.", "eu": "Arancio", "euM": "Come L2, più un nuovo responsabile art. 28 (DPA) che tratta IP/hash giornalieri: restano dati personali per il fornitore (C-413/23 P). A livello UE probabile consenso.", "it": "Giallo", "itM": "Garante 2021: senza consenso solo se il terzo maschera almeno il 4° ottetto dell'IP e non incrocia/cede i dati; nuovo fornitore in informativa.", "obl": "Nuovo fornitore + DPA + informativa; a livello UE probabile consenso: OLTRE SOGLIA.", "coer": "Accettabile se aggregato.", "par": "Più avanti", "fase": "Dopo società / on-grid", "um": "Sì", "note": "Netlify Free non lo mostra; servirebbe uno strumento di terzi.", "soglia": "Sì", "lor": "rimandato", "lorD": "Rimandata a Fase 2", "lorNota": "Non ho capito cosa misura ed a cosa serve", "risposta": "Il «referrer» è l’indirizzo della pagina da cui una persona arriva su {nome}, per esempio un link sul sito di un’associazione. Servirebbe a sapere quali siti ci mandano persone. Lo invia il browser da solo; leggerlo richiede comunque i registri di Netlify."}, {"n": 24, "area": "C · Adozione", "q": "Quante visite arrivano da telefono e quante da computer?", "calc": "Lettura dello user-agent.", "dec": "Poco: l'app è già pensata per il telefono.", "ut": "Bassa", "met": "L3 · Analytics cookieless di terzi", "dati": "Sì, lo user-agent contribuisce all'impronta del dispositivo.", "eu": "Arancio", "euM": "Come L2, più un nuovo responsabile art. 28 (DPA) che tratta IP/hash giornalieri: restano dati personali per il fornitore (C-413/23 P). A livello UE probabile consenso.", "it": "Giallo", "itM": "Garante 2021: senza consenso solo se il terzo maschera almeno il 4° ottetto dell'IP e non incrocia/cede i dati; nuovo fornitore in informativa.", "obl": "Nuovo fornitore + DPA + informativa; a livello UE probabile consenso: OLTRE SOGLIA.", "coer": "Debole.", "par": "Non misurare", "fase": "Mai", "um": "No", "note": "Vicino al fingerprinting: non serve.", "soglia": "Sì", "lor": "sospeso", "lorD": "Sospesa", "lorNota": "", "risposta": ""}, {"n": 25, "area": "C · Adozione", "q": "Quante persone installano {nome} sulla schermata home?", "calc": "Evento 'installazione' della PWA inviato da script.", "dec": "Se investire nell'esperienza da app.", "ut": "Bassa", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "IP in transito.", "eu": "Arancio", "euM": "EDPB Linee guida 2/2023 (v2, ott. 2024): uno script che fa inviare un segnale al browser è 'accesso' al dispositivo → art. 5(3). Nella lettura EDPB la misura d'audience non è 'strettamente necessaria' → consenso, salvo esenzioni nazionali (CNIL in Francia: da verificare). Standard UE più severo di quello italiano.", "it": "Giallo", "itM": "Garante, provv. n. 231 del 10.6.2021 (GU 9.7.2021): analytics usati solo per statistiche aggregate su un solo sito, senza identificazione, assimilati ai tecnici → nessun consenso, solo informativa.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Neutra.", "par": "Non misurare", "fase": "Dopo società / on-grid", "um": "No", "note": null, "soglia": "Sì", "lor": "sospeso", "lorD": "Sospesa", "lorNota": "", "risposta": ""}, {"n": 26, "area": "D · Uso delle sezioni", "q": "Quante volte viene aperta Agorà (demo)?", "calc": "+1 aggregato inviato da script a ogni apertura, senza identificativo.", "dec": "Se c'è interesse sufficiente per aprire l'on-grid.", "ut": "Alta", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "IP in transito sul fornitore.", "eu": "Arancio", "euM": "EDPB Linee guida 2/2023 (v2, ott. 2024): uno script che fa inviare un segnale al browser è 'accesso' al dispositivo → art. 5(3). Nella lettura EDPB la misura d'audience non è 'strettamente necessaria' → consenso, salvo esenzioni nazionali (CNIL in Francia: da verificare). Standard UE più severo di quello italiano.", "it": "Giallo", "itM": "Garante, provv. n. 231 del 10.6.2021 (GU 9.7.2021): analytics usati solo per statistiche aggregate su un solo sito, senza identificazione, assimilati ai tecnici → nessun consenso, solo informativa.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Accettabile se solo totali giornalieri.", "par": "Più avanti", "fase": "Dopo società / on-grid", "um": "Sì", "note": "Alternativa preferibile ora: il pulsante volontario della riga 27.", "soglia": "Sì", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Davvero non si riesce ad avvicinarsi alla compliance  in nessun modo per avere questo dato?", "risposta": "Una strada esiste: se il contenuto di Agorà si scaricasse dal sito solo quando la persona apre Agorà, quella richiesta sarebbe necessaria al servizio che ha chiesto (esenzione dell’art. 5(3)), e contarla sul server senza salvare l’IP sarebbe un conteggio di richieste già necessarie. Rischio: se il contenuto si separa apposta per contare, un’autorità può leggerlo come un aggiramento. Da valutare con un professionista."}, {"n": 27, "area": "D · Uso delle sezioni", "q": "Quante persone premono 'Mi interessa, apritela' nella demo di Agorà?", "calc": "Pulsante volontario: un tocco invia solo '+1 Agorà'. Nessuna email, nessun ID.", "dec": "Quando e se aprire le iscrizioni all'on-grid.", "ut": "Alta", "met": "LV · Invio volontario dell'utente (tocco esplicito)", "dati": "IP in transito su Netlify.", "eu": "Verde", "euM": "Art. 5(3): esenzione per il servizio esplicitamente richiesto (l'utente sceglie di inviare). GDPR: l'IP transita su Netlify; informativa art. 13 sul nuovo invio; nessun dato oltre il +1.", "it": "Verde", "itM": "Art. 122: invio richiesto dall'utente. Basta aggiornare l'informativa (oggi dice 'Nessun server').", "obl": "Un endpoint (Netlify Forms o Function): primo pezzo 'server'. Aggiornare l'informativa. Non chiedere email.", "coer": "Piena: è un gesto esplicito, non sorveglianza.", "par": "Misurare ora", "fase": "MVP", "um": "Sì", "note": "Il KPI migliore per le sezioni demo. Non trasformarlo in lista d'attesa con email (oltre soglia). Limitare a un tocco per dispositivo senza salvare nulla è difficile: accettare qualche doppione.", "soglia": "No", "lor": "eliminato", "lorD": "Eliminata: pulsanti tolti dal sito", "lorNota": "", "risposta": "17/11/2026: i pulsanti volontari sono stati tolti dal sito con la voce T-010 del piano di adeguamento (libro mastro, § 2.4; decisioni del 29 e del 30/10/2026)."}, {"n": 28, "area": "D · Uso delle sezioni", "q": "Quante persone premono 'Mi interessa' nella demo di Progetti?", "calc": "Come riga 27, per Progetti.", "dec": "Priorità tra Agorà e Progetti.", "ut": "Alta", "met": "LV · Invio volontario dell'utente (tocco esplicito)", "dati": "IP in transito su Netlify.", "eu": "Verde", "euM": "Art. 5(3): esenzione per il servizio esplicitamente richiesto (l'utente sceglie di inviare). GDPR: l'IP transita su Netlify; informativa art. 13 sul nuovo invio; nessun dato oltre il +1.", "it": "Verde", "itM": "Art. 122: invio richiesto dall'utente. Basta aggiornare l'informativa (oggi dice 'Nessun server').", "obl": "Un endpoint (Netlify Forms o Function): primo pezzo 'server'. Aggiornare l'informativa. Non chiedere email.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "Sì", "note": "Stesso endpoint della riga 27.", "soglia": "No", "lor": "eliminato", "lorD": "Eliminata: pulsanti tolti dal sito", "lorNota": "", "risposta": "17/11/2026: i pulsanti volontari sono stati tolti dal sito con la voce T-010 del piano di adeguamento (libro mastro, § 2.4; decisioni del 29 e del 30/10/2026)."}, {"n": 29, "area": "D · Uso delle sezioni", "q": "Quali strati/categorie vengono accesi?", "calc": "+1 aggregato per strato acceso, giornaliero.", "dec": "Quali categorie curare di più.", "ut": "Media", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "IP in transito.", "eu": "Arancio", "euM": "EDPB Linee guida 2/2023 (v2, ott. 2024): uno script che fa inviare un segnale al browser è 'accesso' al dispositivo → art. 5(3). Nella lettura EDPB la misura d'audience non è 'strettamente necessaria' → consenso, salvo esenzioni nazionali (CNIL in Francia: da verificare). Standard UE più severo di quello italiano.", "it": "Giallo", "itM": "Garante, provv. n. 231 del 10.6.2021 (GU 9.7.2021): analytics usati solo per statistiche aggregate su un solo sito, senza identificazione, assimilati ai tecnici → nessun consenso, solo informativa.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Accettabile se aggregato; i gusti dei singoli non devono mai esistere.", "par": "Più avanti", "fase": "Dopo società / on-grid", "um": "Sì", "note": null, "soglia": "Sì", "lor": "studio", "lorD": "in fase di studio", "lorNota": "Io lo implementerei, non capisco perché devo usare l'IP. Mi interessa che viene premuto il tasto mica aggregare il comportamento di un utente. E poi anche in caso, perché è oltre soglia? Mi pare che stiamo tenendo i KPI di dati aggregati", "risposta": "L’IP non lo usiamo noi: viaggia con qualunque messaggio che un telefono manda a un server, come il mittente su una busta. Il nodo è la norma europea sull’accesso al dispositivo (art. 5(3) ePrivacy): se l’app fa partire da sola un messaggio quando tocchi un tasto che serve ad altro (accendere uno strato, aprire il calendario), serve il consenso, anche se poi teniamo solo totali. L’aggregazione risolve il GDPR (nessun dato personale salvato), non l’ePrivacy. Nel «Mi interessa» invece il tocco è proprio la richiesta di mandarci il +1, e vale l’esenzione. In Italia il Garante tratta le statistiche aggregate come strumenti tecnici; a livello UE l’EDPB no: con lo standard UE che hai scelto resta oltre soglia."}, {"n": 30, "area": "D · Uso delle sezioni", "q": "Quanto si usano il calendario e 'La mia giornata'?", "calc": "+1 aggregato all'apertura.", "dec": "Se la vista giornata merita altro sviluppo.", "ut": "Media", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "IP in transito.", "eu": "Arancio", "euM": "EDPB Linee guida 2/2023 (v2, ott. 2024): uno script che fa inviare un segnale al browser è 'accesso' al dispositivo → art. 5(3). Nella lettura EDPB la misura d'audience non è 'strettamente necessaria' → consenso, salvo esenzioni nazionali (CNIL in Francia: da verificare). Standard UE più severo di quello italiano.", "it": "Giallo", "itM": "Garante, provv. n. 231 del 10.6.2021 (GU 9.7.2021): analytics usati solo per statistiche aggregate su un solo sito, senza identificazione, assimilati ai tecnici → nessun consenso, solo informativa.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Accettabile.", "par": "Più avanti", "fase": "Dopo società / on-grid", "um": "Sì", "note": "Ora si può capire meglio con test sul campo (riga 44-47).", "soglia": "Sì", "lor": "studio", "lorD": "in fase di studio", "lorNota": "Io lo implementerei, non capisco perché devo usare l'IP. Mi interessa che viene premuto il tasto mica aggregare il comportamento di un utente. E poi anche in caso, perché è oltre soglia? Mi pare che stiamo tenendo i KPI di dati aggregati", "risposta": "L’IP non lo usiamo noi: viaggia con qualunque messaggio che un telefono manda a un server, come il mittente su una busta. Il nodo è la norma europea sull’accesso al dispositivo (art. 5(3) ePrivacy): se l’app fa partire da sola un messaggio quando tocchi un tasto che serve ad altro (accendere uno strato, aprire il calendario), serve il consenso, anche se poi teniamo solo totali. L’aggregazione risolve il GDPR (nessun dato personale salvato), non l’ePrivacy. Nel «Mi interessa» invece il tocco è proprio la richiesta di mandarci il +1, e vale l’esenzione. In Italia il Garante tratta le statistiche aggregate come strumenti tecnici; a livello UE l’EDPB no: con lo standard UE che hai scelto resta oltre soglia."}, {"n": 31, "area": "D · Uso delle sezioni", "q": "Cosa cercano le persone nella barra di ricerca?", "calc": "Testi digitati nella ricerca luoghi/indirizzi.", "dec": "Nessuna che giustifichi il rischio.", "ut": "Bassa", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "Sì: un indirizzo cercato può essere casa propria.", "eu": "Rosso", "euM": "Il contenuto della ricerca può essere un dato personale (indirizzo); art. 5(3) + art. 6 senza base adeguata.", "it": "Rosso", "itM": "Come UE.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Contraria: rivela interessi e luoghi personali.", "par": "Non misurare", "fase": "Mai", "um": "No", "note": "Nota a margine: oggi quei testi vanno già a Photon (komoot) e Nominatim, non dichiarati nell'informativa.", "soglia": "Sì", "lor": "sospeso", "lorD": "Sospesa", "lorNota": "Ricordarsi di mettere nell'informativa la roba di Photon etc", "risposta": "Annotato per la prossima informativa: Photon, Nominatim, Google Fonts, unpkg e cdnjs ricevono l’IP e vanno elencati."}, {"n": 32, "area": "D · Uso delle sezioni", "q": "Quale città scelgono le persone nell'app?", "calc": "+1 aggregato per città selezionata, giornaliero.", "dec": "In quali città promuovere e raccogliere eventi.", "ut": "Alta", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "IP in transito.", "eu": "Arancio", "euM": "EDPB Linee guida 2/2023 (v2, ott. 2024): uno script che fa inviare un segnale al browser è 'accesso' al dispositivo → art. 5(3). Nella lettura EDPB la misura d'audience non è 'strettamente necessaria' → consenso, salvo esenzioni nazionali (CNIL in Francia: da verificare). Standard UE più severo di quello italiano.", "it": "Giallo", "itM": "Garante, provv. n. 231 del 10.6.2021 (GU 9.7.2021): analytics usati solo per statistiche aggregate su un solo sito, senza identificazione, assimilati ai tecnici → nessun consenso, solo informativa.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Buona: misura la domanda per città, non le persone.", "par": "Più avanti", "fase": "Dopo società / on-grid", "um": "Sì", "note": "Meglio della geolocalizzazione IP. Nell'MVP si può approssimare con il pulsante 'Vorrei {nome} nella mia città' (volontario).", "soglia": "Sì", "lor": "studio", "lorD": "in fase di studio", "lorNota": "Io lo implementerei, non capisco perché devo usare l'IP. Mi interessa che viene premuto il tasto mica aggregare il comportamento di un utente. E poi anche in caso, perché è oltre soglia? Mi pare che stiamo tenendo i KPI di dati aggregati", "risposta": "Vale la risposta della riga 29. Il pulsante volontario «Vorrei {nome} qui» resta: è una richiesta esplicita della persona, non un conteggio automatico. 17/11/2026: il pulsante è stato tolto dal sito con la voce T-010."}, {"n": 33, "area": "D · Uso delle sezioni", "q": "Quali lingue vengono usate?", "calc": "+1 aggregato per lingua selezionata.", "dec": "Su quali traduzioni investire.", "ut": "Media", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "IP in transito.", "eu": "Arancio", "euM": "EDPB Linee guida 2/2023 (v2, ott. 2024): uno script che fa inviare un segnale al browser è 'accesso' al dispositivo → art. 5(3). Nella lettura EDPB la misura d'audience non è 'strettamente necessaria' → consenso, salvo esenzioni nazionali (CNIL in Francia: da verificare). Standard UE più severo di quello italiano.", "it": "Giallo", "itM": "Garante, provv. n. 231 del 10.6.2021 (GU 9.7.2021): analytics usati solo per statistiche aggregate su un solo sito, senza identificazione, assimilati ai tecnici → nessun consenso, solo informativa.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Accettabile.", "par": "Più avanti", "fase": "Dopo società / on-grid", "um": "Sì", "note": null, "soglia": "Sì", "lor": "studio", "lorD": "in fase di studio", "lorNota": "Io lo implementerei, non capisco perché devo usare l'IP. Mi interessa che viene premuto il tasto mica aggregare il comportamento di un utente. E poi anche in caso, perché è oltre soglia? Mi pare che stiamo tenendo i KPI di dati aggregati", "risposta": "L’IP non lo usiamo noi: viaggia con qualunque messaggio che un telefono manda a un server, come il mittente su una busta. Il nodo è la norma europea sull’accesso al dispositivo (art. 5(3) ePrivacy): se l’app fa partire da sola un messaggio quando tocchi un tasto che serve ad altro (accendere uno strato, aprire il calendario), serve il consenso, anche se poi teniamo solo totali. L’aggregazione risolve il GDPR (nessun dato personale salvato), non l’ePrivacy. Nel «Mi interessa» invece il tocco è proprio la richiesta di mandarci il +1, e vale l’esenzione. In Italia il Garante tratta le statistiche aggregate come strumenti tecnici; a livello UE l’EDPB no: con lo standard UE che hai scelto resta oltre soglia."}, {"n": 34, "area": "D · Uso delle sezioni", "q": "Quante persone usano la modalità semplice?", "calc": "+1 aggregato all'attivazione.", "dec": "Investimento in accessibilità.", "ut": "Media", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "IP in transito.", "eu": "Arancio", "euM": "EDPB Linee guida 2/2023 (v2, ott. 2024): uno script che fa inviare un segnale al browser è 'accesso' al dispositivo → art. 5(3). Nella lettura EDPB la misura d'audience non è 'strettamente necessaria' → consenso, salvo esenzioni nazionali (CNIL in Francia: da verificare). Standard UE più severo di quello italiano.", "it": "Giallo", "itM": "Garante, provv. n. 231 del 10.6.2021 (GU 9.7.2021): analytics usati solo per statistiche aggregate su un solo sito, senza identificazione, assimilati ai tecnici → nessun consenso, solo informativa.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Accettabile; da non usare per inferire caratteristiche delle persone.", "par": "Più avanti", "fase": "Dopo società / on-grid", "um": "Sì", "note": null, "soglia": "Sì", "lor": "studio", "lorD": "in fase di studio", "lorNota": "Io lo implementerei, non capisco perché devo usare l'IP. Mi interessa che viene premuto il tasto mica aggregare il comportamento di un utente. E poi anche in caso, perché è oltre soglia? Mi pare che stiamo tenendo i KPI di dati aggregati", "risposta": "L’IP non lo usiamo noi: viaggia con qualunque messaggio che un telefono manda a un server, come il mittente su una busta. Il nodo è la norma europea sull’accesso al dispositivo (art. 5(3) ePrivacy): se l’app fa partire da sola un messaggio quando tocchi un tasto che serve ad altro (accendere uno strato, aprire il calendario), serve il consenso, anche se poi teniamo solo totali. L’aggregazione risolve il GDPR (nessun dato personale salvato), non l’ePrivacy. Nel «Mi interessa» invece il tocco è proprio la richiesta di mandarci il +1, e vale l’esenzione. In Italia il Garante tratta le statistiche aggregate come strumenti tecnici; a livello UE l’EDPB no: con lo standard UE che hai scelto resta oltre soglia."}, {"n": 35, "area": "D · Uso delle sezioni", "q": "Quante persone completano la guida iniziale?", "calc": "Aperture della guida vs arrivi all'ultima schermata.", "dec": "Se rifare la guida/tutorial.", "ut": "Media", "met": "L0Q · Ricerca qualitativa volontaria", "dati": "Dei partecipanti ai test.", "eu": "Verde", "euM": "Partecipazione volontaria e informata: consenso art. 6(1)(a) + informativa art. 13 GDPR; nessun accesso al dispositivo dell'utente.", "it": "Verde", "itM": "Consenso e informativa (artt. 13 GDPR, Codice Privacy); conservare i consensi.", "obl": "Informativa e modulo di consenso per i partecipanti; conservare i consensi; non registrare audio se non indispensabile.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Meglio osservarlo in test sul campo con 5-8 persone che contarlo da remoto.", "soglia": "No", "lor": "operativo", "lorD": "Implementare", "lorNota": "", "risposta": "Operativa come misura dei test sul campo: registri quante persone, in un giro di prova, completano la guida senza aiuto. Nessun dato dalle app degli utenti."}, {"n": 36, "area": "E · Off-Grid e PDF", "q": "Quanti eventi Off-Grid vengono creati?", "calc": "+1 aggregato alla conferma, mai il contenuto dell'evento.", "dec": "Se il percorso del tasto + è capito e usato.", "ut": "Alta", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "IP in transito; il contenuto resta sul dispositivo.", "eu": "Arancio", "euM": "EDPB Linee guida 2/2023 (v2, ott. 2024): uno script che fa inviare un segnale al browser è 'accesso' al dispositivo → art. 5(3). Nella lettura EDPB la misura d'audience non è 'strettamente necessaria' → consenso, salvo esenzioni nazionali (CNIL in Francia: da verificare). Standard UE più severo di quello italiano.", "it": "Giallo", "itM": "Garante, provv. n. 231 del 10.6.2021 (GU 9.7.2021): analytics usati solo per statistiche aggregate su un solo sito, senza identificazione, assimilati ai tecnici → nessun consenso, solo informativa.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Accettabile solo come totale.", "par": "Più avanti", "fase": "Dopo società / on-grid", "um": "Sì", "note": "Per l'MVP: test sul campo. Il contenuto Off-Grid non deve mai lasciare il telefono.", "soglia": "Sì", "lor": "studio", "lorD": "in fase di studio", "lorNota": "Io lo implementerei, non capisco perché devo usare l'IP. Mi interessa che viene premuto il tasto mica aggregare il comportamento di un utente. E poi anche in caso, perché è oltre soglia? Mi pare che stiamo tenendo i KPI di dati aggregati", "risposta": "L’IP non lo usiamo noi: viaggia con qualunque messaggio che un telefono manda a un server, come il mittente su una busta. Il nodo è la norma europea sull’accesso al dispositivo (art. 5(3) ePrivacy): se l’app fa partire da sola un messaggio quando tocchi un tasto che serve ad altro (accendere uno strato, aprire il calendario), serve il consenso, anche se poi teniamo solo totali. L’aggregazione risolve il GDPR (nessun dato personale salvato), non l’ePrivacy. Nel «Mi interessa» invece il tocco è proprio la richiesta di mandarci il +1, e vale l’esenzione. In Italia il Garante tratta le statistiche aggregate come strumenti tecnici; a livello UE l’EDPB no: con lo standard UE che hai scelto resta oltre soglia."}, {"n": 37, "area": "E · Off-Grid e PDF", "q": "Quante persone abbandonano la creazione di un evento?", "calc": "Avviati vs completati, aggregati.", "dec": "Dove semplificare il form.", "ut": "Media", "met": "L0Q · Ricerca qualitativa volontaria", "dati": "Dei partecipanti ai test.", "eu": "Verde", "euM": "Partecipazione volontaria e informata: consenso art. 6(1)(a) + informativa art. 13 GDPR; nessun accesso al dispositivo dell'utente.", "it": "Verde", "itM": "Consenso e informativa (artt. 13 GDPR, Codice Privacy); conservare i consensi.", "obl": "Informativa e modulo di consenso per i partecipanti; conservare i consensi; non registrare audio se non indispensabile.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Un funnel remoto (L2) a livello UE è Arancio; nei test sul campo lo vedi meglio e senza rischi.", "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Tutte le misure volontarie vanno aggregate; teniamole tutte in fase di studio in modo tale da proporle coerentemente", "risposta": "D’accordo: in studio, da proporre insieme alle altre misure volontarie in un’unica richiesta coerente."}, {"n": 38, "area": "E · Off-Grid e PDF", "q": "Quante volte si stampa la giornata in PDF?", "calc": "+1 aggregato alla generazione del PDF.", "dec": "Se mantenere/migliorare la stampa.", "ut": "Bassa", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "IP in transito.", "eu": "Arancio", "euM": "EDPB Linee guida 2/2023 (v2, ott. 2024): uno script che fa inviare un segnale al browser è 'accesso' al dispositivo → art. 5(3). Nella lettura EDPB la misura d'audience non è 'strettamente necessaria' → consenso, salvo esenzioni nazionali (CNIL in Francia: da verificare). Standard UE più severo di quello italiano.", "it": "Giallo", "itM": "Garante, provv. n. 231 del 10.6.2021 (GU 9.7.2021): analytics usati solo per statistiche aggregate su un solo sito, senza identificazione, assimilati ai tecnici → nessun consenso, solo informativa.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Neutra.", "par": "Non misurare", "fase": "Dopo società / on-grid", "um": "No", "note": "Nessuna decisione imminente dipende da questo numero.", "soglia": "Sì", "lor": "studio", "lorD": "in fase di studio", "lorNota": "Io lo implementerei, non capisco perché devo usare l'IP. Mi interessa che viene premuto il tasto mica aggregare il comportamento di un utente. E poi anche in caso, perché è oltre soglia? Mi pare che stiamo tenendo i KPI di dati aggregati", "risposta": "L’IP non lo usiamo noi: viaggia con qualunque messaggio che un telefono manda a un server, come il mittente su una busta. Il nodo è la norma europea sull’accesso al dispositivo (art. 5(3) ePrivacy): se l’app fa partire da sola un messaggio quando tocchi un tasto che serve ad altro (accendere uno strato, aprire il calendario), serve il consenso, anche se poi teniamo solo totali. L’aggregazione risolve il GDPR (nessun dato personale salvato), non l’ePrivacy. Nel «Mi interessa» invece il tocco è proprio la richiesta di mandarci il +1, e vale l’esenzione. In Italia il Garante tratta le statistiche aggregate come strumenti tecnici; a livello UE l’EDPB no: con lo standard UE che hai scelto resta oltre soglia."}, {"n": 39, "area": "E · Off-Grid e PDF", "q": "Quanto si usa l'Ordine delle Fate (link #fate)?", "calc": "Conteggio dei link aperti.", "dec": "Nessuna prima del check legale della funzione.", "ut": "Bassa", "met": "L2 · Contatore aggregato via script (senza ID)", "dati": "Il link contiene un evento cifrato: qualunque conteggio toccherebbe il contenuto.", "eu": "Arancio", "euM": "Non valutabile prima del check legale sulla funzione di condivisione.", "it": "Arancio", "itM": "Come UE.", "obl": "Backend minimo; informativa; valutare registro (art. 30(5) GDPR: esonero solo per trattamenti occasionali). A livello UE probabile banner: OLTRE SOGLIA.", "coer": "Da valutare.", "par": "Non misurare", "fase": "Dopo società / on-grid", "um": "Sì", "note": "Prima serve il check legale da zero sulla funzione (nota infrastruttura, sezione 8).", "soglia": "Sì", "lor": "sospeso", "lorD": "Sospesa", "lorNota": "Fuori dai nostri scopi di ora", "risposta": "D’accordo: sospesa."}, {"n": 40, "area": "F · Qualità tecnica", "q": "Quanto ci mette l'app a caricarsi?", "calc": "Lighthouse/WebPageTest su telefono di prova, a ogni versione.", "dec": "Se alleggerire file, librerie e mappa.", "ut": "Alta", "met": "L0T · Test interno (nessun utente reale)", "dati": "Nessuno.", "eu": "Verde", "euM": "Misura fatta su dispositivi propri, senza utenti: fuori da GDPR e da art. 5(3).", "it": "Verde", "itM": "Nessun interessato coinvolto.", "obl": "Nessuno.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Il file è 0,5-0,7 MB: va tenuto d'occhio a ogni rilascio.", "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Voglio capire come è realizzato questo test ", "risposta": "Si usa Lighthouse, lo strumento dentro Chrome (F12 → Lighthouse): carica la pagina simulando un telefono di fascia media su rete 4G lenta e misura dopo quanti secondi compare il primo contenuto. Lo fai tu o lo faccio io sui nostri telefoni: nessun utente coinvolto."}, {"n": 41, "area": "F · Qualità tecnica", "q": "Quanti errori JavaScript capitano agli utenti?", "calc": "Invio automatico degli errori a un servizio (tipo Sentry).", "dec": "Correggere bug che non vedi.", "ut": "Media", "met": "L3 · Analytics cookieless di terzi", "dati": "Sì: IP, browser, a volte dati della pagina.", "eu": "Arancio", "euM": "Come L2, più un nuovo responsabile art. 28 (DPA) che tratta IP/hash giornalieri: restano dati personali per il fornitore (C-413/23 P). A livello UE probabile consenso.", "it": "Giallo", "itM": "Garante 2021: senza consenso solo se il terzo maschera almeno il 4° ottetto dell'IP e non incrocia/cede i dati; nuovo fornitore in informativa.", "obl": "Nuovo fornitore + DPA + informativa; a livello UE probabile consenso: OLTRE SOGLIA.", "coer": "Debole.", "par": "Non misurare", "fase": "Dopo società / on-grid", "um": "No", "note": "Ora: test interni su più telefoni + segnalazioni volontarie (riga 16).", "soglia": "Sì", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Non ho capito cosa misura ed a cosa serve", "risposta": "Misura i guasti del codice che capitano sui telefoni degli utenti (una funzione che si blocca). Servirebbe a correggere bug che noi non vediamo. Richiede un servizio esterno che riceve dati dai telefoni: oltre soglia."}, {"n": 42, "area": "F · Qualità tecnica", "q": "Quante volte la mappa non si carica?", "calc": "Prove periodiche da reti diverse + segnalazioni volontarie.", "dec": "Se cambiare fornitore di mappe o ospitare le librerie in casa.", "ut": "Media", "met": "L0T · Test interno (nessun utente reale)", "dati": "Nessuno.", "eu": "Verde", "euM": "Misura fatta su dispositivi propri, senza utenti: fuori da GDPR e da art. 5(3).", "it": "Verde", "itM": "Nessun interessato coinvolto.", "obl": "Nessuno.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Ospitare in casa font e librerie (oggi da Google Fonts e unpkg) riduce sia i guasti sia gli IP mandati a terzi.", "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Non ho capito cosa misura ed a cosa serve", "risposta": "Misura se la mappa riesce a caricarsi su reti e telefoni diversi: le librerie della mappa arrivano da server esterni che alcune reti bloccano. Serve a decidere se ospitare quelle librerie dentro il sito. Si fa con prove nostre."}, {"n": 43, "area": "F · Qualità tecnica", "q": "L'app funziona con rete lenta o assente?", "calc": "Test con throttling del browser.", "dec": "Priorità alla modalità offline.", "ut": "Media", "met": "L0T · Test interno (nessun utente reale)", "dati": "Nessuno.", "eu": "Verde", "euM": "Misura fatta su dispositivi propri, senza utenti: fuori da GDPR e da art. 5(3).", "it": "Verde", "itM": "Nessun interessato coinvolto.", "obl": "Nessuno.", "coer": "Piena: accessibilità.", "par": "Più avanti", "fase": "MVP", "um": "No", "note": null, "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Non ho capito cosa misura ed a cosa serve", "risposta": "Verifica se l’app funziona con connessione lenta o assente, per esempio in metropolitana. Calendario e Off-Grid funzionano già senza rete perché stanno sul telefono; mappa e PDF no. Serve a decidere se investire in una modalità senza rete. Prove nostre."}, {"n": 44, "area": "G · Impatto e qualitativo", "q": "Le persone scoprono eventi che non conoscevano?", "calc": "Domanda in interviste o in un sondaggio volontario anonimo.", "dec": "Prova della mission (asimmetria informativa); argomento per Smart&Start.", "ut": "Alta", "met": "L0Q · Ricerca qualitativa volontaria", "dati": "Dei partecipanti, con consenso.", "eu": "Verde", "euM": "Partecipazione volontaria e informata: consenso art. 6(1)(a) + informativa art. 13 GDPR; nessun accesso al dispositivo dell'utente.", "it": "Verde", "itM": "Consenso e informativa (artt. 13 GDPR, Codice Privacy); conservare i consensi.", "obl": "Informativa e modulo di consenso per i partecipanti; conservare i consensi; non registrare audio se non indispensabile.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Hai già un metodo (interviste trascritte e analizzate): ripeterlo dopo il lancio.", "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Tutte le misure volontarie vanno aggregate; teniamole tutte in fase di studio in modo tale da proporle coerentemente", "risposta": "D’accordo: in studio, da proporre insieme alle altre misure volontarie."}, {"n": 45, "area": "G · Impatto e qualitativo", "q": "Le persone sono andate davvero a un evento trovato su {nome}?", "calc": "Domanda in intervista o sondaggio volontario.", "dec": "Impatto reale sulla partecipazione.", "ut": "Alta", "met": "L0Q · Ricerca qualitativa volontaria", "dati": "Dei partecipanti, con consenso.", "eu": "Verde", "euM": "Partecipazione volontaria e informata: consenso art. 6(1)(a) + informativa art. 13 GDPR; nessun accesso al dispositivo dell'utente.", "it": "Verde", "itM": "Consenso e informativa (artt. 13 GDPR, Codice Privacy); conservare i consensi.", "obl": "Informativa e modulo di consenso per i partecipanti; conservare i consensi; non registrare audio se non indispensabile.", "coer": "Piena.", "par": "Misurare ora", "fase": "MVP", "um": "No", "note": "Non reintrodurre 'Ci vado' nell'app: era stato tolto per motivi legali.", "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Tutte le misure volontarie vanno aggregate; teniamole tutte in fase di studio in modo tale da proporle coerentemente", "risposta": "D’accordo: in studio, da proporre insieme alle altre misure volontarie."}, {"n": 46, "area": "G · Impatto e qualitativo", "q": "{nome} riduce la sensazione di solitudine?", "calc": "Questionario validato (es. scala breve sulla solitudine), prima/dopo.", "dec": "Impatto sociale per bandi e Report della Città.", "ut": "Alta", "met": "L0Q · Ricerca qualitativa volontaria", "dati": "Sì, e potenzialmente dati sulla salute (benessere psicologico).", "eu": "Arancio", "euM": "Possibili dati di categoria particolare (art. 9 GDPR): consenso esplicito, garanzie, probabile DPIA.", "it": "Arancio", "itM": "Come UE; Codice Privacy e regole deontologiche per la ricerca scientifica.", "obl": "Consenso esplicito art. 9(2)(a), DPIA probabile, partner di ricerca.", "coer": "Piena come fine, delicata come mezzo.", "par": "Più avanti", "fase": "Dopo società / on-grid", "um": "Sì", "note": "Un questionario sulla solitudine può toccare dati sulla salute (art. 9 GDPR). Da fare con un partner universitario e il suo comitato etico.", "soglia": "Sì", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Tutte le misure volontarie vanno aggregate; teniamole tutte in fase di studio in modo tale da proporle coerentemente", "risposta": "D’accordo: in studio. In più qui servono il consenso esplicito e un partner di ricerca (possibili dati sulla salute, art. 9 GDPR)."}, {"n": 47, "area": "G · Impatto e qualitativo", "q": "Le persone consiglierebbero {nome}?", "calc": "Domanda 0-10 in sondaggio volontario.", "dec": "Qualità percepita; confronto tra versioni.", "ut": "Media", "met": "L0Q · Ricerca qualitativa volontaria", "dati": "Dei partecipanti, con consenso.", "eu": "Verde", "euM": "Partecipazione volontaria e informata: consenso art. 6(1)(a) + informativa art. 13 GDPR; nessun accesso al dispositivo dell'utente.", "it": "Verde", "itM": "Consenso e informativa (artt. 13 GDPR, Codice Privacy); conservare i consensi.", "obl": "Informativa e modulo di consenso per i partecipanti; conservare i consensi; non registrare audio se non indispensabile.", "coer": "Piena.", "par": "Più avanti", "fase": "MVP", "um": "No", "note": null, "soglia": "No", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Tutte le misure volontarie vanno aggregate; teniamole tutte in fase di studio in modo tale da proporle coerentemente", "risposta": "D’accordo: in studio, da proporre insieme alle altre misure volontarie."}, {"n": 48, "area": "H · Esclusi per principio", "q": "Quanto tempo passano le persone nell'app?", "calc": "Durata delle sessioni.", "dec": "Nessuna compatibile con {nome}.", "ut": "Bassa", "met": "L3 · Analytics cookieless di terzi", "dati": "Sì.", "eu": "Arancio", "euM": "Come L2, più un nuovo responsabile art. 28 (DPA) che tratta IP/hash giornalieri: restano dati personali per il fornitore (C-413/23 P). A livello UE probabile consenso.", "it": "Giallo", "itM": "Garante 2021: senza consenso solo se il terzo maschera almeno il 4° ottetto dell'IP e non incrocia/cede i dati; nuovo fornitore in informativa.", "obl": "Nuovo fornitore + DPA + informativa; a livello UE probabile consenso: OLTRE SOGLIA.", "coer": "Contraria al principio anti-dipendenza: premierebbe il design che trattiene.", "par": "Non misurare", "fase": "Mai", "um": "No", "note": "{nome} funziona se le persone escono e vanno all'evento, non se restano sullo schermo.", "soglia": "Sì", "lor": "studio", "lorD": "In fase di studio", "lorNota": "Proprio per evitare che le persone stiano molto tempo nell'app, bisogna capire quanto tempo passano dentro l'app", "risposta": "Ottimo punto, coerente con l’anti-dipendenza: misurare per tenere basso il tempo. Due strade: solo sul telefono, mostrato alla persona come il «Tempo di utilizzo» di Android (nessun invio, utile anche a lei); oppure totali per noi, con lo stesso nodo ePrivacy delle misure automatiche. Per lo studio propongo la prima, più eventualmente una risposta volontaria."}, {"n": 49, "area": "H · Esclusi per principio", "q": "Quante volte la stessa persona torna (retention, DAU/MAU)?", "calc": "Richiede un identificativo persistente per persona.", "dec": "Nessuna compatibile.", "ut": "Bassa", "met": "L4 · Tracciamento individuale", "dati": "Sì: identificativo persistente.", "eu": "Rosso", "euM": "Identificativo persistente o profilazione: consenso art. 5(3) e art. 6(1)(a), probabile DPIA art. 35, registro art. 30. Escluso.", "it": "Rosso", "itM": "Consenso con banner a pulsanti paritari (Garante 2021), registro, DPIA. Escluso.", "obl": "Consenso, banner, registro, DPIA: ESCLUSO.", "coer": "Contraria: metrica di engagement.", "par": "Non misurare", "fase": "Mai", "um": "No", "note": null, "soglia": "Sì", "lor": "sospeso", "lorD": "Sospesa", "lorNota": "", "risposta": ""}, {"n": 50, "area": "H · Esclusi per principio", "q": "Dove cliccano le persone sulla mappa (heatmap)?", "calc": "Coordinate di ogni tocco inviate al server.", "dec": "Nessuna che giustifichi il rischio.", "ut": "Bassa", "met": "L4 · Tracciamento individuale", "dati": "Sì: i punti toccati rivelano interessi e luoghi personali.", "eu": "Rosso", "euM": "Identificativo persistente o profilazione: consenso art. 5(3) e art. 6(1)(a), probabile DPIA art. 35, registro art. 30. Escluso.", "it": "Rosso", "itM": "Consenso con banner a pulsanti paritari (Garante 2021), registro, DPIA. Escluso.", "obl": "Consenso, banner, registro, DPIA: ESCLUSO.", "coer": "Contraria: profilazione geografica.", "par": "Non misurare", "fase": "Mai", "um": "No", "note": "Già escluso nello studio DEV 3.", "soglia": "Sì", "lor": "sospeso", "lorD": "Sospesa", "lorNota": "", "risposta": ""}];
/* nome e casella dalla configurazione */
MZ_KPI.forEach(k => Object.keys(k).forEach(c => { if(typeof k[c]==='string') k[c] = k[c].split('{nome}').join(NOME).split('{casella}').join(CASELLA); }));

/* ======================= Misure (app della redazione): si misura la città, non le persone =======================
   Voce T-035 del piano di adeguamento; libro mastro, cap. 4 (§§ 4.1, 4.2, 4.4). Stanno sul dispositivo della redazione,
   nella chiave red_misure:
   - totali del giorno calcolati dagli eventi dell'archivio pubblicato, letti dall'indice e dai quadranti (mai una copia
     degli eventi: restano solo i conteggi);
   - totali del giorno ricavati dallo storico delle pubblicazioni dello sportello (letture firmate «storico» e «copia»):
     eventi presenti, pubblicati, corretti, sospesi, riattivati e ritirati per motivo, da tutti i dispositivi della
     Redazione (decisione del 23/11/2026; anche qui restano solo i conteggi);
   - numeri inseriti a mano (richieste al sito, azioni di comunicazione, rimozioni, segnalazioni, test, interviste);
   - soglie, stato delle decisioni, decisioni sul catalogo delle 50 domande.
   Nessun dato degli utenti. Soglie minime (§ 4.4): nel pannello un valore sotto i 5 casi compare come «meno di 5»,
   anche nei grafici; nel file che si esporta, e che può uscire dal progetto, un valore sotto i 10 casi compare come
   «meno di 10». I totali del fornitore si aggiungono in Fase 2 (T-069), senza chiavi dell'account nell'app. */
let MZ = null;
function mz(){
  if(MZ) return MZ;
  const d = MEM.leggi('red_misure', null) || {};
  MZ = Object.assign({v:1, giorni:{}, visti:{}, creati:{}, richieste:{}, azioni:[], rimozioni:[], segnalazioni:{}, correzioni:{}, versioni:[], prove:[], giri:[], rete:{},
    soglie:{}, stati:{}, mie:{}}, d);
  MZ.soglie = Object.assign({zona:2, nuovi:50, carico:3}, MZ.soglie||{}); delete MZ.soglie.interesse;   /* soglia dei pulsanti volontari, tolta con T-010 */
  /* le soglie sono numeri positivi: un valore diverso nella memoria del telefono torna a quello di partenza (T-024) */
  Object.entries({zona:2, nuovi:50, carico:3}).forEach(([k,v]) => { const n = Number(MZ.soglie[k]); MZ.soglie[k] = isFinite(n) && n>0 ? n : v; });
  return MZ;
}
function mzSalva(){ if(!MEM.scrivi('red_misure', MZ)) avviso(tr('Spazio esaurito sul telefono: esporta le misure in Excel.'), null, true); }
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

/* ---------- quale evento conta ----------
   Le Misure contano gli eventi dell'archivio pubblicato, non quelli nella memoria del dispositivo (T-035; § 4.2). Li
   legge un lettore suo (sorgenti/moduli/archivio.js), che non conserva nulla: l'indice e tutti i quadranti che
   l'indice nomina. Di ogni evento tiene, finché il pannello è aperto, soltanto ciò che serve ai conteggi. Lo storico
   delle pubblicazioni si legge più sotto (mzLeggiStorico). */
let MZ_EVENTI = [];
const MZ_ARCH = {stato:'', quadranti:0, quando:null, lettore:null, nascosti:0};
const daArchivioMz = ev => ({id:ev.id, category:ev.strato, datetime:new Date(FORMATO.istante(ev.inizio)).toISOString(), lat:ev.lat, lng:ev.lng,
  price:ev.prezzo||'', address:ev.indirizzo||'', addressFull:[ev.luogo, ev.indirizzo].filter(Boolean).join(' · ')});
function mzLeggiArchivio(){
  if(!ARCHIVIO_DOVE || !MODULI.archivio || !window.fetch){ MZ_ARCH.stato = 'assente'; return Promise.resolve(false); }
  if(!MZ_ARCH.quando) MZ_ARCH.stato = 'leggo';
  let A;
  /* gli eventi nascosti contano come gli altri, con città e strato (decisione del 25/11/2026): quelli che questo
     dispositivo sa aprire con le password della sua cassaforte (eventi-nascosti.js); mai nei numeri pubblici per regione */
  let nas = [];
  /* sul collegamento di prova l'archivio può essere quello finto dello sportello di prova (sorgenteArchivio, app2.js) */
  return sorgenteArchivio().then(s => {
    if(!MZ_ARCH.lettore || MZ_ARCH.dove!==s.dove){ MZ_ARCH.lettore = MODULI.archivio.crea({dove:s.dove, vocabolario:FORMATO.vocabolario(LAYERS, TEMI_VOC), fetch:s.fetch}); MZ_ARCH.dove = s.dove; }
    A = MZ_ARCH.lettore; return A.controllaNovita();
  }).then(() => { if(!A.pronto()) throw new Error('indice'); return A.carica(A.quadranti()); }).then(() => nrPerMisure().then(l => { nas = l; }, () => {})).then(() => regApri().catch(() => null)).then(() => {
    /* «Da import Excel» (T-043): gli eventi che nel registro delle fonti del dispositivo hanno il canale «file Excel» o
       «calendario in dati aperti»; senza le chiavi il registro non si legge e il conteggio resta a zero */
    const imp = new Set(REG.stato==='aperto' ? REG.dati.eventi.filter(r => r.canale==='excel' || r.canale==='calendario').map(r => r.id) : []);
    MZ_EVENTI = A.eventi().map(x => x.ev).concat(nas).map(ev => Object.assign(daArchivioMz(ev), imp.has(ev.id) ? {importato:true} : {})); MZ_ARCH.nascosti = nas.length; MZ_ARCH.quadranti = A.quadrantiConservati().length; MZ_ARCH.quando = new Date(); MZ_ARCH.stato = 'letto'; return true;
  }).catch(() => { MZ_ARCH.stato = MZ_ARCH.quando ? 'vecchio' : 'errore'; return false; });
}
function mzEventi(){ return MZ_EVENTI.filter(e => MS.ambito==='tutte' || cittaDi(e)===citta); }
/* una riga che dice da dove vengono i numeri degli eventi e a quando sono aggiornati */
function rigaArchivioMz(){
  const t = {leggo:tr('Leggo l’archivio degli eventi…'), assente:tr('Nessun archivio degli eventi da leggere: i conteggi degli eventi restano vuoti.'),
    errore:tr('L’archivio degli eventi non risponde: i conteggi degli eventi restano vuoti finché non torna la rete.'),
    vecchio:tr('L’archivio degli eventi non risponde: i conteggi sono quelli dell’ultima lettura.')}[MZ_ARCH.stato];
  return `<p class="meta mz-archivio" role="status">${t || tr('Eventi letti dall’archivio pubblicato: {n}, in {q} quadranti · lettura delle {o}',{n:nfm(MZ_EVENTI.length), q:MZ_ARCH.quadranti, o:MZ_ARCH.quando ? hm(MZ_ARCH.quando) : '–'})
    + (MZ_ARCH.nascosti ? ' · '+tr('di cui {k} nascosti, aperti con le password di questo dispositivo',{k:nfm(MZ_ARCH.nascosti)}) : '')}</p>`;
}
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
  if(MZ_ARCH.stato!=='letto') return;   /* senza una lettura riuscita dell'archivio non c'è nulla da fotografare */
  const m = mz(), g = oggi(), L = MZ_EVENTI;
  const per = f => { const o = {}; L.forEach(e => { const k = f(e); if(k!=null) o[k] = (o[k]||0)+1; }); return o; };
  m.giorni[g] = {tot:L.length, citta:per(cittaDi), strati:per(e => e.category||'?'), prov:per(e => e.provenienza||'nd'), imp:L.filter(e => e.importato).length, grat:L.filter(gratuitoMz).length};
  L.forEach(e => { if(m.visti[e.id]) return; const c = creatoDi(e), gc = c ? ymd(new Date(c)) : g; m.visti[e.id] = gc; m.creati[gc] = (m.creati[gc]||0)+1; });
  const lim = piuGiorni(g,-120); Object.keys(m.visti).forEach(id => { if(m.visti[id]<lim) delete m.visti[id]; });
  const limG = piuGiorni(g,-400); Object.keys(m.giorni).forEach(k => { if(k<limG) delete m.giorni[k]; });
  mzSalva();
}
/* ---------- lo storico delle pubblicazioni: solo totali (blocco 10; decisione del 23/11/2026; § 4.2) ----------
   Lo sportello tiene una copia datata per ogni pubblicazione, di qualunque dispositivo della Redazione. Da lì, per ogni
   giorno degli ultimi cento: quanti eventi erano presenti nell'archivio (quelli dell'ultima copia fino a quel giorno,
   non ancora usciti all'inizio del giorno), quanti pubblicati, corretti, sospesi, riattivati e ritirati, e i ritiri
   per motivo. Le letture sono firmate come le altre; delle copie non resta nulla, solo i conteggi nella voce
   red_misure (pubbl: giorno → n presenti, p pubblicati, c corretti, s sospesi, a riattivati, r ritirati, m ritiri
   per motivo, rip ripristini, da nome dell'ultima copia usata). Un giorno finito si calcola una volta sola, finché
   l'ultima copia che lo riguarda resta la stessa. */
const MZ_STOR = {stato:'', quando:null};
const MOTIVI_MZ = ['annullato', 'errore', 'esclusione', 'richiesta', 'segnalazione', 'ordine'];
function mzLeggiStorico(){
  if(typeof SPORTELLO==='undefined' || !SPORTELLO){ MZ_STOR.stato = 'assente'; return Promise.resolve(false); }
  if(!MZ_STOR.quando) MZ_STOR.stato = 'leggo';
  const lette = {}, leggi = nome => lette[nome] || (lette[nome] = SPORTELLO.chiedi({operazione:'copia', nome}).then(r => r.copia));
  return SPORTELLO.chiedi({operazione:'storico'}).then(async r => {
    const m = mz(), g = oggi(), copie = (r.copie||[]).filter(x => x && typeof x.nome==='string' && !isNaN(Date.parse(x.quando))).sort((a,b) => Date.parse(a.quando)-Date.parse(b.quando));
    const P = {}, prima = m.pubbl||{};
    for(let d = piuGiorni(g,-100); d<=g; d = piuGiorni(d,1)){
      const inizio = dIso(d).getTime(), fine = dIso(piuGiorni(d,1)).getTime(), ultima = copie.filter(x => Date.parse(x.quando)<fine).pop();
      if(!ultima) continue;
      if(d<g && prima[d] && prima[d].da===ultima.nome){ P[d] = prima[d]; continue; }
      const v = {n:0, p:0, c:0, s:0, a:0, r:0, rip:0, m:{}, da:ultima.nome}, k = await leggi(ultima.nome);
      v.n = (k.eventi||[]).filter(e => FORMATO.uscitaMs(e) > inizio).length + (k.nascosti||[]).filter(x => x && typeof x.giorno==='string' && x.giorno >= d).length;   /* i nascosti fino al giorno di uscita */
      for(const x of copie.filter(y => { const t = Date.parse(y.quando); return t>=inizio && t<fine; })){
        const q = x.riepilogo||{}, num = c => Array.isArray(q[c]) ? q[c].length : numMz(q[c]);
        if(x.operazione==='ripristina') v.rip++;
        v.p += num('pubblicati'); v.c += num('corretti'); v.s += num('sospesi'); v.a += num('riattivati'); v.r += num('ritirati');
        if(num('ritirati')){ const z = ((await leggi(x.nome)).riepilogo||{}).ritirati; (Array.isArray(z) ? z : []).forEach(y => { if(y && MOTIVI_MZ.includes(y.motivo)) v.m[y.motivo] = (v.m[y.motivo]||0)+1; }); }
      }
      P[d] = v;
    }
    /* i giorni più vecchi di cento restano come sono, fino a 400 giorni; se lo storico è vuoto non resta nulla */
    if(copie.length){ const lim = piuGiorni(g,-400), cento = piuGiorni(g,-100); Object.keys(prima).forEach(d => { if(d<cento && d>=lim) P[d] = prima[d]; }); }
    m.pubbl = P; mzSalva(); MZ_STOR.stato = 'letto'; MZ_STOR.quando = new Date(); return true;
  }).catch(e => { const mot = e && e.motivo; MZ_STOR.stato = mot==='chiavi' || mot==='sconosciuto' || mot==='revocata' || mot==='assente' ? mot : MZ_STOR.quando ? 'vecchio' : 'errore'; return false; });
}
const pubblMz = g => (mz().pubbl||{})[g] || null;
function seriePresenti(giorni){ return giorni.map(g => { const v = pubblMz(g); return v ? numMz(v.n) : null; }); }
function sommaPubbl(giorni){
  const t = {p:0, c:0, s:0, a:0, r:0, rip:0, m:{}, giorni:0};
  giorni.forEach(g => { const v = pubblMz(g); if(!v) return; t.giorni++; ['p','c','s','a','r','rip'].forEach(k => { t[k] += numMz(v[k]); }); Object.keys(v.m||{}).forEach(k => { if(MOTIVI_MZ.includes(k)) t.m[k] = (t.m[k]||0)+numMz(v.m[k]); }); });
  return t;
}
/* una riga che dice da dove vengono i numeri dello storico */
function rigaStoricoMz(){
  const t = {leggo:tr('Leggo lo storico delle pubblicazioni…'), assente:tr('Su questo indirizzo non c’è uno sportello: i numeri dello storico restano vuoti.'),
    chiavi:tr('Per leggere lo storico delle pubblicazioni servono le chiavi della Redazione: Strumenti della redazione → Chiavi.'),
    sconosciuto:tr('Lo sportello non conosce ancora questo dispositivo: i numeri dello storico restano quelli dell’ultima lettura.'),
    revocata:tr('La firma di questo dispositivo è revocata: lo sportello non fa leggere lo storico.'),
    errore:tr('Lo sportello non risponde: i numeri dello storico restano vuoti finché non torna la rete.'),
    vecchio:tr('Lo sportello non risponde: i numeri dello storico sono quelli dell’ultima lettura.')}[MZ_STOR.stato];
  return `<p class="meta mz-storico" role="status">${t || tr('Dallo storico delle pubblicazioni dello sportello, tutti i dispositivi · lettura delle {o}',{o:MZ_STOR.quando ? hm(MZ_STOR.quando) : '–'})}</p>`;
}
function storicoMz(g){
  const T = sommaPubbl(g), pres = seriePresenti(g);
  const motivi = MOTIVI_MZ.filter(k => T.m[k]).map(k => [tr(MOTIVI_RITIRO[k]), T.m[k]]);
  const numeri = [[tr('Pubblicati'), T.p], [tr('Corretti'), T.c], [tr('Sospesi'), T.s], [tr('Riattivati'), T.a], [tr('Ritirati'), T.r]];
  return `${rigaStoricoMz()}
    ${lineaMz('presenti', [{nome:tr('Eventi presenti'), v:pres, col:'var(--verde)'}], g, {vuoto:tr('Lo storico nasce con la prima pubblicazione: finché non c’è, qui non c’è nulla.')})}
    <div class="mz-legenda mz-numeri">${numeri.map(x => `<span><b>${nfm(x[1])}</b> ${esc(x[0].toLowerCase())}</span>`).join('')}</div>
    <p class="meta"><b>${tr('Ritiri prima della fine, per motivo')}</b></p>
    ${motivi.length ? hbarMz(motivi) : vuotoMz(tr('Nessun ritiro nel periodo.'))}
    <p class="meta">${tr('«Presenti» sono gli eventi dell’archivio che in quel giorno non erano ancora usciti. A differenza degli «eventi attivi» qui sopra, lo storico non ha buchi nei giorni in cui le Misure non si aprono.')}</p>`;
}
function tabStoricoMz(g){
  const c = v => v==null ? `<span class="meta">${tr('nessun dato')}</span>` : nfm(numMz(v));
  return `<div class="mz-scorri" style="max-height:280px"><table class="mz-tab"><tr><th>${tr('Giorno')}</th><th class="n">${tr('Presenti')}</th><th class="n">${tr('Pubblicati')}</th><th class="n">${tr('Corretti')}</th><th class="n">${tr('Sospesi')}</th><th class="n">${tr('Ritirati')}</th></tr>${g.map(d => { const v = pubblMz(d); return `<tr><td>${lungD(d)}</td><td class="n">${c(v&&v.n)}</td><td class="n">${c(v&&v.p)}</td><td class="n">${c(v&&v.c)}</td><td class="n">${c(v&&v.s)}</td><td class="n">${c(v&&v.r)}</td></tr>`; }).join('')}</table></div>`;
}
function misureConta(tipo){ const m = mz(), g = oggi(); m.correzioni[g] = m.correzioni[g]||{c:0, r:0}; m.correzioni[g][tipo==='rimossi'?'r':'c']++; mzSalva(); }

/* ---------- periodi ---------- */
const mzGiorni = n => { const out = [], g = oggi(); for(let i=n-1;i>=0;i--) out.push(piuGiorni(g,-i)); return out; };
/* i conteggi sono numeri: un valore della memoria del telefono che non lo è vale zero (T-024) */
const numMz = x => { const n = Number(x); return isFinite(n) ? n : 0; };
const somma = (o, giorni, f) => giorni.reduce((s,g) => s + (o && o[g]!=null ? numMz(f ? f(o[g]) : o[g]) : 0), 0);
const nf = n => n==null ? '–' : Number(n).toLocaleString('it-IT');
/* Soglie minime (libro mastro, § 4.4; decisione del 31/10/2026): 5 casi per ciò che resta interno, 10 per ciò che esce. */
const SOGLIA_INTERNA = 5, SOGLIA_ESTERNA = 10;
const sottoSoglia = (n, s) => typeof n==='number' && n>0 && n<s;
const nfm = n => n==null ? '–' : sottoSoglia(Number(n), SOGLIA_INTERNA) ? tr('meno di 5') : nf(n);   /* un conteggio nel pannello */
const vm = v => sottoSoglia(v, SOGLIA_INTERNA) ? SOGLIA_INTERNA/2 : v;                             /* lo stesso conteggio in un grafico */
const fuoriMz = n => sottoSoglia(n, SOGLIA_ESTERNA) ? tr('meno di 10') : n;                         /* un conteggio nel file esportato */
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
  /* correzioni e ritiri: dallo storico dello sportello, che li conta da tutti i dispositivi; se lo storico non si è mai letto, dal contatore di questo dispositivo */
  const TP = sommaPubbl(gP), corr = TP.giorni ? TP.c+TP.r : somma(m.correzioni, gP, x => (x.c||0)+(x.r||0));
  const ric = gP.map(g => m.richieste[g]).filter(v => v!=null);
  return {L, zone, sotto, prov, anticipo, nuovi7, nuoviP, corr, ric, mediaRic: ric.length ? Math.round(ric.reduce((a,b)=>a+b,0)/ric.length) : null,
    qualita: nuoviP>=SOGLIA_INTERNA ? corr/nuoviP*100 : null, segn: somma(m.segnalazioni, gP), grat: L.length>=SOGLIA_INTERNA ? Math.round(L.filter(gratuitoMz).length/L.length*100) : null,
    imp: L.filter(e => e.importato).length, perCitta: CITTA.map(c => [c.n, MZ_EVENTI.filter(e => cittaDi(e)===c.id).length]).concat([[tr('Fuori dalle città'), MZ_EVENTI.filter(e => cittaDi(e)==='altro').length]])};
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
    perche: S.sotto.slice(0,8).map(q => q.n+' ('+nfm(S.zone[q.n])+')').join(', ')+(S.sotto.length>8?'…':'')+'. '+tr('Lì la mappa sembra vuota: è l’asimmetria informativa che {nome} vuole ridurre.'),
    azione: tr('Cerca fonti in quelle zone: biblioteche, circoli, parrocchie, spazi associativi.'), kpi:[5,12]});
  const vuote = MZ_ARCH.stato==='letto' ? CITTA.filter(c => !MZ_EVENTI.some(e => cittaDi(e)===c.id)) : [];
  if(vuote.length) out.push({id:firma('citta', vuote.map(c=>c.id).join(',')), liv:'warn', st:tr('Da valutare'), tit: tr('Città senza eventi: {c}',{c:vuote.map(c=>c.n).join(', ')}),
    perche: tr('Chi sceglie una di queste città trova la mappa vuota.'), azione: tr('Scegli la prossima città da riempire, anche con l’import dai siti dei Comuni.'), kpi:[3,10]});
  if(S.nuovi7 < m.soglie.nuovi) out.push({id:firma('ritmo', oggi()), liv:'warn', st:tr('Sotto obiettivo'), tit: tr('{n} eventi nuovi negli ultimi 7 giorni (obiettivo {o})',{n:nfm(S.nuovi7), o:m.soglie.nuovi}),
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
const FONTI_MZ = {ev:'Dagli eventi', stor:'Dallo storico delle pubblicazioni', man:'Da Netlify, a mano', test:'Test interno', int:'Interviste', mail:'Dalla posta', reg:'Registro a mano'};
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
  const max = Math.max(1, ...items.map(x => vm(x[1])));
  return `<div class="mz-hbar">${items.map(([k,v]) => `<span class="mz-nome">${esc(k)}</span><span class="mz-riga"><span class="mz-barra${v===0?' zero':''}" style="width:${v===0?0:Math.max(2,vm(v)/max*78)}%;${col?'background:'+col:''}"></span><span class="mz-v${v===0?' vuota':''}">${v===0?tr('vuota'):nfm(v)}</span></span>`).join('')}</div>`;
}
const LINEE_MZ = {};
function niceStepMz(mx){ const raw = Math.max(1,mx)/4, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw/p; return Math.max(1,(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p); }
function lineaMz(id, serie, giorni, opt){
  opt = opt||{};
  const W = 360, H = 190, pl = 44, pr = 10, pt = 14, pb = 24, n = giorni.length;
  const vals = serie.flatMap(s => s.v).filter(v => v!=null);
  if(!vals.length) return vuotoMz(opt.vuoto || tr('Ancora nessun dato in questo periodo.'));
  const step = niceStepMz(Math.max(...vals)), mx = Math.ceil(Math.max(...vals)/step)*step || step;
  const x = i => pl + (W-pl-pr)*(n===1 ? .5 : i/(n-1)), y = v => pt + (H-pt-pb)*(1 - v/mx), yp = v => y(vm(v));   /* yp: un conteggio sotto soglia sta a mezza soglia */
  LINEE_MZ[id] = {serie, giorni, W, H, pl, pr, pt, x, azioni:opt.azioni||[]};
  let o = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(serie.map(s => s.nome).join(', '))}" data-mzline="${id}" style="touch-action:pan-y">`;
  for(let v=0; v<=mx; v+=step) o += `<line x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}" class="mz-griglia"/><text x="${pl-6}" y="${y(v)+4}" text-anchor="end">${nf(v)}</text>`;
  const tick = n<=8 ? 1 : n<=31 ? 7 : 21;
  for(let i=n-1; i>=0; i-=tick) o += `<text x="${x(i)}" y="${H-6}" text-anchor="${i===n-1?'end':i===0?'start':'middle'}">${brevD(giorni[i])}</text>`;
  (opt.azioni||[]).forEach(a => { o += `<line x1="${x(a.i)}" x2="${x(a.i)}" y1="${pt}" y2="${H-pb}" class="mz-az"/><circle cx="${x(a.i)}" cy="${pt}" r="4" class="mz-az-p"/>`; });
  serie.forEach(s => {
    let d = '', pen = false; s.v.forEach((v,i) => { if(v==null){ pen = false; return; } d += `${pen?'L':'M'}${x(i).toFixed(1)},${yp(v).toFixed(1)}`; pen = true; });
    if(serie.length===1 && !s.v.some(v => v==null) && n>1) o += `<path d="M${x(0)},${y(0)}L${s.v.map((v,i) => x(i).toFixed(1)+','+yp(v).toFixed(1)).join('L')}L${x(n-1)},${y(0)}Z" fill="${s.col}" opacity=".1"/>`;
    o += `<path d="${d}" fill="none" stroke="${s.col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    s.v.forEach((v,i) => { const solo = v!=null && (i===0 || s.v[i-1]==null) && (i===n-1 || s.v[i+1]==null); if(solo) o += `<circle cx="${x(i)}" cy="${yp(v)}" r="3" fill="${s.col}"/>`; });
    let li = s.v.length-1; while(li>0 && s.v[li]==null) li--;
    if(s.v[li]!=null) o += `<circle cx="${x(li)}" cy="${yp(s.v[li])}" r="4" fill="${s.col}" class="mz-anello"/>`;
  });
  o += `<line class="mz-mirino" x1="0" x2="0" y1="${pt}" y2="${H-pb}" opacity="0"/><rect x="${pl}" y="${pt}" width="${W-pl-pr}" height="${H-pt-pb}" fill="transparent"/></svg>`;
  return o;
}
function tabLineaMz(serie, giorni){
  return `<div class="mz-scorri" style="max-height:280px"><table class="mz-tab"><tr><th>${tr('Giorno')}</th>${serie.map(s => `<th class="n">${esc(s.nome)}</th>`).join('')}</tr>${giorni.map((g,i) => `<tr><td>${lungD(g)}</td>${serie.map(s => `<td class="n">${s.v[i]==null?`<span class="meta">${tr('nessun dato')}</span>`:nfm(s.v[i])}</td>`).join('')}</tr>`).reverse().join('')}</table></div>`;
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
      <div class="mz-barra-t"><button class="mz-icona" data-mz="esci" aria-label="${esc(tr('Torna agli strumenti della redazione'))}">${mzIco.indietro}</button><h1>${tr('Misure')}</h1>
        <button class="mz-chip" data-mz="ambito" aria-label="${esc(tr('Cambia ambito: {a}',{a:ambito}))}"><span>${esc(ambito)}</span></button>
        <button class="mz-icona" data-mz="fonti" aria-label="${esc(tr('Da dove vengono i numeri'))}">${mzIco.info}</button></div>
      ${conFiltri?`<div class="seg mz-periodo" role="group" aria-label="${esc(tr('Periodo'))}">${[7,30,90].map(p => `<button data-mz="periodo" data-v="${p}" aria-pressed="${MS.periodo===p}">${tr(PER_MZ[p])}</button>`).join('')}</div>`:''}
      <nav class="mz-schede" aria-label="${esc(tr('Sezioni delle misure'))}">${SCHEDE_MZ.map(([k,t]) => `<button data-mz="scheda" data-v="${k}" aria-pressed="${MS.scheda===k}"><span>${tr(t)}</span></button>`).join('')}</nav>
    </div>
    <div class="mz-corpo">
      ${MS.scheda==='libreria' ? '' : rigaArchivioMz()}
      ${({panoramica:vPanoramicaMz, offerta:vOffertaMz, rete:vReteMz, accessi:vAccessiMz, qualita:vQualitaMz, impatto:vImpattoMz, libreria:vLibreriaMz})[MS.scheda]()}
      <p class="meta mz-piede">${tr('Le misure restano su questo dispositivo (chiave red_misure) e si esportano in Excel: nel file i valori sotto i 10 casi compaiono come «meno di 10». Nessun dato sulle persone che usano l’app.')}</p>
      <button class="tasto sec pieno" data-mz="esporta">${tr('Esporta le misure in Excel')}</button>
    </div>`;
  el.scrollTop = y;
  const a = el.querySelector('.mz-schede [aria-pressed="true"]'); if(a && a.scrollIntoView) a.scrollIntoView({inline:'nearest', block:'nearest'});
}

function vPanoramicaMz(){
  const m = mz(), S = mzStato(), g = mzGiorni(MS.periodo), att = serieAttivi(g);
  const oggiN = S.L.length, prima = att[Math.max(0, att.length-8)];
  const zTot = QUARTIERI.length, zOk = zTot - S.sotto.length;
  const totP = S.prov.consenso+S.prov.pubblica+S.prov.nd, quotaCons = totP>=SOGLIA_INTERNA ? Math.round(S.prov.consenso/totP*100) : null;   /* niente percentuali su meno di 5 casi */
  const rimP = m.rimozioni.filter(r => (r.ric||'').slice(0,10) >= g[0]), rimOk = rimP.filter(r => { const h = oreTra(r.ric, r.eva); return h!=null && h<=48; }).length;
  const decs = decisioniMz(S).filter(d => on(d.kpi[0]));
  const sp = att.filter(v => v!=null);
  return `<h2 class="mz-h1">${tr('Il polso della città')}</h2>
    <p class="meta">${tr('Si misura la città, non le persone.')} ${esc(MS.ambito==='tutte'?tr('Tutte le città'):nomeCitta(citta))} · ${tr('ultimi {p}',{p:tr(PER_MZ[MS.periodo])})} · ${tr('aggiornato adesso')}</p>
    ${on(1)?`<div class="mz-card mz-hero"><div><div class="mz-lab">${tr('Eventi attivi oggi')}</div><div class="mz-num">${nfm(oggiN)}</div>
      ${prima!=null?`<span class="mz-delta ${oggiN>=prima?'su':'giu'}">${oggiN>=prima?mzIco.su:mzIco.giu} ${oggiN>=prima?'+':'−'}${nfm(Math.abs(oggiN-prima))} ${tr('rispetto a 7 giorni fa')}</span>`:`<span class="meta">${tr('Il confronto arriva dopo qualche giorno di misure.')}</span>`}</div>
      ${sp.length>1?`<div class="mz-spark">${sparkMz(sp)}</div>`:''}<div>${fonteMz('ev')}</div></div>`:''}
    <h2 class="mz-h2">${tr('Indicatori')}</h2><p class="meta">${tr('Ognuno riassume più domande della libreria. Toccali per vedere quali; accendi e spegni le misure dalla libreria.')}</p>
    <div class="mz-griglia2">
      ${mzTile(tr('Copertura delle zone'), `${zOk}<small> ${tr('su {n}',{n:zTot})}</small>`, tr('zone di Torino con almeno {s} eventi nei prossimi 7 giorni',{s:m.soglie.zona}), 'ev', zOk/zTot, zOk<zTot, [5,3])}
      ${mzTile(tr('Ritmo di raccolta'), `${nfm(S.nuovi7)}<small> / ${tr('sett.')}</small>`, tr('eventi nuovi inseriti da te ({nome}), non nuovi utenti · obiettivo {o}',{o:m.soglie.nuovi}), 'ev', S.nuovi7/m.soglie.nuovi, S.nuovi7<m.soglie.nuovi, [2,10,12])}
      ${mzTile(tr('Solidità delle fonti'), quotaCons==null?'–':`${quotaCons}<small> %</small>`, tr('eventi con consenso diretto')+(rimP.length?' · '+tr('rimozioni entro 48 h: {a} su {b}',{a:nfm(rimOk), b:nfm(rimP.length)}):''), 'ev', quotaCons==null?null:quotaCons/100, false, [6,15,13])}
      ${mzTile(tr('Richieste al sito'), S.mediaRic==null?'–':`${nfm(S.mediaRic)}<small> / ${tr('giorno')}</small>`, S.mediaRic==null?tr('copia i numeri da Netlify in «Accessi»'):tr('media del periodo · un indice, non persone'), 'man', null, false, [18,20])}
      ${mzTile(tr('Qualità dei dati'), S.qualita==null?'–':`${n1(S.qualita)}<small> %</small>`, tr('eventi corretti o rimossi sui nuovi · {n} segnalazioni',{n:nfm(S.segn)}), 'ev', null, false, [11,16])}
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
function sparkMz(v){ v = v.map(vm); const W = 150, H = 48, mn = Math.min(...v), mx = Math.max(...v); const x = i => i/(v.length-1)*(W-8)+4, y = a => H-5-(a-mn)/((mx-mn)||1)*(H-12);
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
    ${mzBox('pubbl', tr('Pubblicazioni, giorno per giorno'), storicoMz(g), tabStoricoMz(g), 'stor', [11,1])}
    <div class="mz-griglia2">
      ${mzTile(tr('Nuovi nel periodo'), nfm(S.nuoviP), tr('inseriti da te ({nome}), non nuovi utenti · ultimi 7 giorni: {n}',{n:S.nuovi7}), 'ev', null, false, [2])}
      ${mzTile(tr('Anticipo medio'), S.anticipo==null?'–':`${n1(S.anticipo)}<small> ${tr('giorni')}</small>`, tr('tra pubblicazione e inizio'), 'ev', null, false, [9])}
      ${mzTile(tr('Gratuiti'), S.grat==null?'–':`${S.grat}<small> %</small>`, tr('eventi con ingresso libero'), 'ev', null, false, [7])}
      ${mzTile(tr('Da import Excel'), nfm(S.imp), tr('eventi attivi arrivati da un file o da un calendario dei Comuni, secondo il registro delle fonti di questo dispositivo'), 'ev', null, false, [10])}
    </div>
    ${mzBox('citta', tr('Eventi attivi per città'), hbarMz(S.perCitta)+`<p class="meta">${tr('«Fuori dalle città» sono gli eventi a più di 35 km da tutte le città dell’app: con questa riga le città sommano al totale.')}</p>`, null, 'ev', [3])}
    ${mzBox('zone', tr('Zone di Torino · eventi nei prossimi 7 giorni'), zoneMz(S), `<table class="mz-tab"><tr><th>${tr('Zona')}</th><th class="n">${tr('Eventi')}</th></tr>${QUARTIERI.map(q => `<tr><td>${esc(q.n)}</td><td class="n">${nfm(S.zone[q.n])}</td></tr>`).join('')}</table>`, 'ev', [5])}
    ${mzBox('strati', tr('Eventi attivi per strato'), hbarMz(strati)+`<p class="meta">${tr('Gli strati più sottili sono quelli da cercare.')}</p>`, null, 'ev', [4])}
    ${mzBox('prov', tr('Da dove arrivano gli eventi'), tot ? `<div class="mz-stack" role="img" aria-label="${esc(fa.map(f => f[0]+' '+nfm(f[1])).join(', '))}">${fa.filter(f => f[1]).map(f => `<i style="width:${f[1]/tot*100}%;background:${f[2]}" data-mztip="<b>${esc(f[0])}</b><br>${nfm(f[1])} ${tr('eventi')}${tot>=SOGLIA_INTERNA?' · '+Math.round(f[1]/tot*100)+' %':''}"></i>`).join('')}</div>
      <div class="mz-legenda">${fa.map(f => `<span><i style="background:${f[2]}"></i>${esc(f[0])}${tot>=SOGLIA_INTERNA?' · '+Math.round(f[1]/tot*100)+' %':''}</span>`).join('')}</div><p class="meta">${tr('Più consenso diretto = base giuridica più solida (art. 6(1)(a) GDPR). La provenienza si indica nel form dell’evento o nella colonna «Provenienza» dell’Excel.')}</p>` : vuotoMz(tr('Nessun evento attivo.')),
      `<table class="mz-tab"><tr><th>${tr('Provenienza')}</th><th class="n">${tr('Eventi')}</th></tr>${fa.map(f => `<tr><td>${esc(f[0])}</td><td class="n">${nfm(f[1])}</td></tr>`).join('')}</table>`, 'ev', [6])}
    ${mzBox('heat', tr('Quando ci sono eventi'), `<div class="mz-heat"><span></span>${ordine.map(d => `<span class="mz-h c">${esc(GG[(d+6)%7])}</span>`).join('')}${FASCE_MZ.map((f,r) => `<span class="mz-h">${tr(f[1])}</span>${ordine.map(d => { const c = (d+6)%7, v = heat[r][c], lv = v ? Math.min(5, Math.ceil(v/hmax*5)) : 0; return `<button style="background:var(--mz-s${lv});color:${lv>=4?'var(--su-verde)':'var(--testo)'}" data-mztip="<b>${esc(GG[c])} · ${tr(f[1])}</b><br>${v} ${tr('eventi')}" aria-label="${esc(GG[c]+' '+tr(f[1])+': '+v)}">${v||''}</button>`; }).join('')}`).join('')}</div>
      <div class="mz-scala"><span>0</span><span class="mz-rampa">${[0,1,2,3,4,5].map(i => `<i style="background:var(--mz-s${i})"></i>`).join('')}</span><span>${hmax}</span></div>`,
      `<div class="mz-scorri"><table class="mz-tab"><tr><th></th>${ordine.map(d => `<th class="n">${esc(GG[(d+6)%7])}</th>`).join('')}</tr>${FASCE_MZ.map((f,r) => `<tr><td>${tr(f[1])}</td>${ordine.map(d => `<td class="n">${heat[r][(d+6)%7]}</td>`).join('')}</tr>`).join('')}</table></div>`, 'ev', [8])}
    ${bloccataMz(12, tr('Le fonti che rendono di più'), tr('Servirebbe un campo «fonte» per ogni evento: da decidere insieme, è una domanda «più avanti».'))}
    ${studioSezioneMz('offerta')}`;
}
function zoneMz(S){
  const max = Math.max(1, ...Object.values(S.zone)), s = mz().soglie.zona;
  return `<div class="mz-zone">${QUARTIERI.map(q => { const v = S.zone[q.n], sotto = v < s, lv = sotto ? 0 : Math.min(5, Math.max(1, Math.ceil(v/max*5)));
    return `<button class="${sotto?'sotto':''}" style="background:var(--mz-s${lv});color:${lv>=4?'var(--su-verde)':'var(--testo)'}" data-mztip="<b>${esc(q.n)}</b><br>${nfm(v)} ${tr('eventi')}${sotto?' · '+tr('sotto soglia'):''}" aria-label="${esc(q.n+': '+nfm(v)+(sotto?', '+tr('sotto soglia'):''))}"><span class="mz-zn">${esc(q.n)}</span><span class="mz-zv">${nfm(v)}${sotto?` <small>· ${tr('sotto soglia')}</small>`:''}</span></button>`; }).join('')}</div>
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
      ${mzTile(tr('Eventi con consenso diretto'), nfm(S.prov.consenso), tr('organizzatori che pubblicano con te'), 'ev', null, false, [13])}
      ${mzTile(tr('Luoghi sulla mappa'), nfm(luoghi), tr('indirizzi distinti degli eventi attivi'), 'ev', null, false, [17])}
      ${mzTile(tr('Segnalazioni ricevute'), nfm(segnP), tr('eventi non validi, nel periodo'), 'mail', null, false, [16])}
      ${mzTile(tr('Richieste di rimozione'), nfm(m.rimozioni.length), tr('registrate in tutto'), 'reg', null, false, [15])}
    </div>
    ${on(16)?`<div class="mz-card"><h3>${tr('Una segnalazione arrivata')}</h3><p class="meta">${tr('Un evento non valido segnalato su {casella}. Si conta solo il numero, non chi scrive.',{casella:CASELLA})}</p>
      <div class="tasti"><button class="tasto sec" data-mz="segn-meno" ${m.segnalazioni[oggi()]?'':'disabled'}>${tr('Togli l’ultima')}</button><button class="tasto pri" data-mz="segn-piu">${tr('+1 oggi')}${m.segnalazioni[oggi()]?' · '+m.segnalazioni[oggi()]:''}</button></div></div>`:''}
    ${mzBox('rimoz', tr('Registro delle richieste di rimozione'), `<form class="mz-form" data-mzform="rimozione"><div class="due"><label class="mz-etich">${tr('Ricevuta')}<span class="campo"><input type="datetime-local" name="ric" required></span></label><label class="mz-etich">${tr('Evasa')}<span class="campo"><input type="datetime-local" name="eva"></span></label></div><label class="mz-etich">${tr('Codice della richiesta')} <span class="fac">${tr('facoltativo')}</span><span class="campo"><input name="r" maxlength="12" placeholder="R-0001" autocomplete="off"></span></label><button class="tasto sec pieno" type="submit">${tr('Aggiungi al registro')}</button></form>
      ${rim.length ? `<div class="mz-scorri"><table class="mz-tab"><tr><th>${tr('Codice')}</th><th>${tr('Ricevuta')}</th><th>${tr('Evasa')}</th><th class="n">${tr('Ore')}</th><th>${tr('Entro 48 h')}</th><th></th></tr>${rim.map(r => { const h = oreTra(r.ric, r.eva), i = m.rimozioni.indexOf(r);
        return `<tr><td>${esc(r.r||'–')}</td><td>${esc(fmtDt(r.ric))}</td><td>${r.eva?esc(fmtDt(r.eva)):`<button class="link" data-mz="rim-evasa" data-i="${i}">${tr('Evasa ora')}</button>`}</td><td class="n">${h==null?'–':h}</td><td>${h==null?(oreTra(r.ric,new Date().toISOString())>48?`<span class="mz-stato crit">${tr('Scaduta')}</span>`:`<span class="mz-stato neu">${tr('Aperta')}</span>`):h<=48?`<span class="mz-stato ok">${tr('Sì')}</span>`:`<span class="mz-stato crit">${tr('No')}</span>`}</td><td><button class="mz-icona piccola" data-mz="rim-togli" data-i="${i}" aria-label="${esc(tr('Togli dal registro'))}">${mzIco.x}</button></td></tr>`; }).join('')}</table></div>` : vuotoMz(tr('Nessuna richiesta registrata.'))}
      <p class="meta">${tr('Solo date, ore e il codice della richiesta (R-0001, cap. 26): niente nomi. Serve a dimostrare che rispetti i diritti (artt. 5(2) e 12 GDPR) e a ripetere le rimozioni dopo il ripristino di una copia. «Togli questo nome ovunque» scrive da sé l’ora in cui la richiesta è evasa.')}</p>`, null, 'reg', [15])}
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
  const fr = (t, v, tot, k) => !on(k) ? '' : `<button class="mz-tile" data-mz="kpiset" data-k="${k}" data-l="${esc(t)}"><span class="mz-fr"><span>${t}</span><b>${nfm(v)} ${tr('su')} ${nfm(tot)}</b></span>${sottoSoglia(v, SOGLIA_INTERNA) || sottoSoglia(tot-v, SOGLIA_INTERNA) || tot<SOGLIA_INTERNA ? '' : `<span class="mz-barre" aria-hidden="true">${Array.from({length:Math.min(tot,30)}, (_,i) => `<i class="${i<Math.round(v/tot*Math.min(tot,30))?'on':''}"></i>`).join('')}</span>`}</button>`;
  if(![35,37,44,45,47].some(on)) return `<h2 class="mz-h1">${tr('Impatto')}</h2>${studioSezioneMz('impatto')}`;
  return `<h2 class="mz-h1">${tr('Impatto')}</h2><p class="meta">${tr('Si chiede alle persone, con il loro consenso. Con pochi partecipanti si mostrano i conteggi, non le percentuali.')}</p>
    ${u ? `<div class="mz-card"><div class="mz-lab">${esc(brevD(u.d))}</div><h3>${esc(u.titolo||tr('Giro di interviste'))} · ${tr('{n} persone',{n:nfm(u.n)})}</h3><div class="mz-pila">
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
    <div><dt>${tr('Dove restano')}</dt><dd>${tr('Su questo telefono, nella chiave red_misure, come il resto dell’admin. Si esportano in Excel. Cancellando i dati di Chrome si perdono: esporta ogni tanto.')}</dd></div>
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
  const G = [[tr('Giorno'), tr('Eventi attivi'), ...CITTA.map(c => c.n), tr('Fuori dalle città'), tr('Da import'), tr('Gratuiti'), tr('Consenso diretto'), tr('Fonte pubblica'), tr('Provenienza non indicata'), tr('Nuovi creati'), tr('Corretti'), tr('Rimossi'), tr('Richieste (Netlify)'), tr('Segnalazioni'), tr('Azioni di comunicazione')]]
    .concat(giorni.map(g => { const x = m.giorni[g]||{}, c = m.correzioni[g]||{}; return [dIso(g), x.tot!=null?x.tot:'', ...cit.map(id => x.citta ? (x.citta[id]||0) : ''), x.citta ? (x.citta.altro||0) : '', x.imp!=null?x.imp:'', x.grat!=null?x.grat:'',
      x.prov?(x.prov.consenso||0):'', x.prov?(x.prov.pubblica||0):'', x.prov?(x.prov.nd||0):'', m.creati[g]||0, c.c||0, c.r||0, m.richieste[g]!=null?m.richieste[g]:'', m.segnalazioni[g]||0].map((v, i) => i ? fuoriMz(v) : v).concat([m.azioni.filter(a => a.d===g).map(a => a.t).join(' · ')]); }));
  /* le richieste di rimozione escono una per riga, con i soli momenti (ricevuta, evasa) e le ore: nessun nome. È il
     registro di lavoro della Redazione, che lo scarica quando vuole (decisione di Lorenzo del 22/11/2026) */
  /* lo storico delle pubblicazioni: un giorno per riga, solo conteggi */
  const Pu = [[tr('Giorno'), tr('Eventi presenti'), tr('Pubblicati'), tr('Corretti'), tr('Sospesi'), tr('Riattivati'), tr('Ritirati'), ...MOTIVI_MZ.map(k => tr('Ritirati') + ': ' + tr(MOTIVI_RITIRO[k])), tr('Ripristini di una copia')]]
    .concat(Object.keys(m.pubbl||{}).sort().map(g => { const v = m.pubbl[g]; return [dIso(g), v.n, v.p, v.c, v.s, v.a, v.r, ...MOTIVI_MZ.map(k => (v.m||{})[k]||0), v.rip||0].map((x, i) => i ? fuoriMz(numMz(x)) : x); }));
  const R = [[tr('Codice'), tr('Ricevuta'), tr('Evasa'), tr('Ore')]].concat(m.rimozioni.map(r => [r.r||'', r.ric, r.eva||'', oreTra(r.ric, r.eva)==null?'':oreTra(r.ric, r.eva)]));
  const V = [[tr('Versione'), tr('Data'), tr('Secondi')]].concat(m.versioni.map(v => [v.v, dIso(v.d), v.s]));
  const P = [[tr('Data'), tr('Rete e telefono'), tr('Esito'), tr('Nota')]].concat(m.prove.map(p => [dIso(p.d), p.rete, p.ok?tr('Caricata'):tr('Non caricata'), p.nota||'']));
  const I = [[tr('Data'), tr('Giro'), tr('Persone'), tr('Scoperto eventi nuovi'), tr('Andati a un evento'), tr('Guida senza aiuto'), tr('Off-Grid al primo tentativo'), tr('Mediana consiglio')]].concat(m.giri.map(x => { const p = Number(x.n), c = v => p<SOGLIA_ESTERNA ? '' : fuoriMz(Number(v)); return [dIso(x.d), x.titolo||'', fuoriMz(p), c(x.scoperto), c(x.andato), c(x.guida), c(x.og), p<SOGLIA_ESTERNA || x.cons==null ? '' : x.cons]; }));
  const C = [['N.', tr('Domanda'), tr('Sezione'), tr('Stato'), tr('Nella sezione'), tr('Decisione di Lorenzo'), tr('Note di Lorenzo'), tr('Risposta di Claude'), tr('Appunti di studio'), tr('Data appunti'), tr('Ultimo cambio di stato'), tr('UE'), tr('IT')]]
    .concat(MZ_KPI.map(k => { const x = (m.lib||{})[k.n]||{}, s = libStato(k.n); return [k.n, k.q, tr(NOMI_SEZ[sezioneKpi(k)]), tr(STATI_LIB[s]), s==='operativo' ? (HA_PANNELLO.has(k.n) ? (libVisibile(k.n)?tr('Visibile'):tr('Nascosta')) : tr('Pannello da costruire')) : '', k.lorD||'', k.lorNota||'', k.risposta||'', x.appunti||'', x.appuntiD?dIso(x.appuntiD):'', x.stato?dIso(x.agg):'', k.eu, k.it]; }));
  const Sg = [[tr('Soglia'), tr('Valore')], [tr('Eventi per zona nei prossimi 7 giorni'), m.soglie.zona], [tr('Obiettivo nuovi a settimana'), m.soglie.nuovi], [tr('Tempo massimo di caricamento (s)'), m.soglie.carico]];
  fileExcel([[tr('Giorni'), G, [12,12,...CITTA.map(() => 12),14,10,10,12,12,14,10,10,10,14,12,40]], [tr('Pubblicazioni'), Pu, [12,12,12,10,10,12,10,...MOTIVI_MZ.map(() => 18),14]], [tr('Rimozioni'), R, [20,20,8]], [tr('Versioni'), V, [20,12,10]], [tr('Prove mappa'), P, [12,24,14,40]], [tr('Interviste'), I, [12,20,10,14,14,14,16,14]], [tr('Libreria'), C, [6,60,18,14,16,18,50,60,50,12,14,8,8]], [tr('Soglie'), Sg, [44,10]]], nomeFile()+'_misure_'+oggi()+'.xlsx')
    .then(() => { registra('esporta-misure'); avviso(tr('Misure esportate: {f}',{f:nomeFile()+'_misure_'+oggi()+'.xlsx'}), null, true); })
    .catch(() => avviso(tr('Non sono riuscito a preparare il file Excel.'), null, true));
}

/* ---------- apertura e interazioni ---------- */
function apriMisure(){
  vaiSezione('misure'); const el = $('pagina-misure'); if(el) el.scrollTop = 0;
  mzLeggiArchivio().then(() => { mzFotografa(); if(st.sezione==='misure') disegnaMisure(); });
  mzLeggiStorico().then(() => { if(st.sezione==='misure') disegnaMisure(); });
}
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
  else if(k==='rimozione'){ if(!D.ric) return; const r = String(D.r||'').trim().toUpperCase();
    if(r && !CODICE_R.test(r)){ avviso(tr('Il codice della richiesta si scrive come «R-0001».'), null, true); return; }
    m.rimozioni.push(Object.assign({ric:D.ric, eva:D.eva||''}, r ? {r} : {})); }
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
      mostraTipMz(`<b>${esc(lungD(L.giorni[i]))}</b>${L.serie.map(s => `<br>${esc(s.nome)}: ${s.v[i]==null?tr('nessun dato'):nfm(s.v[i])}`).join('')}${az}`, r.left + xx/L.W*r.width, r.top + 10); return; }
    const t = ev.target.closest && ev.target.closest('[data-mztip]');
    if(t){ const r = t.getBoundingClientRect(); mostraTipMz(t.dataset.mztip, r.left + r.width/2, r.top); } else nascondiTipMz();
  });
  el.addEventListener('pointerleave', () => { nascondiTipMz(); el.querySelectorAll('.mz-mirino').forEach(m => m.setAttribute('opacity', 0)); });
  el.addEventListener('pointerdown', ev => { const t = ev.target.closest && ev.target.closest('[data-mztip]'); if(t){ const r = t.getBoundingClientRect(); mostraTipMz(t.dataset.mztip, r.left + r.width/2, r.top); } });
  el.addEventListener('scroll', nascondiTipMz, {passive:true});
  $('foglio-slot').addEventListener('input', ev => { const s = ev.target.dataset && ev.target.dataset.mzs; if(!s) return; const m = mz(); m.soglie[s] = +ev.target.value; mzSalva(); const o = $('mzo-'+s); if(o) o.textContent = (s==='carico'?n1(m.soglie[s]):m.soglie[s])+(s==='carico'?' s':''); if(st.sezione==='misure') disegnaMisure(); });
})();

/* ======================= Storico delle operazioni della Redazione (6 ottobre 2026; nell'app della redazione da T-035) =======================
   Dove sta: su questo dispositivo, nella memoria del browser (chiave red_storico), come gli eventi
   e le Misure. L'app lo legge da lì: non va su nessun server e un altro telefono non lo vede.
   Cosa tiene: il tipo di operazione, giorno e ora, quanti eventi e il codice dell'evento. Il titolo NON viene salvato:
   lo storico lo legge dall'evento finché l'evento è sulla mappa. Quando l'evento sparisce (3 ore dopo la fine),
   nello storico resta solo «evento non più sulla mappa», così lo storico non diventa un archivio degli eventi.
   Si tengono le ultime 1.000 operazioni e al massimo 12 mesi. */
const STORICO_MAX = 1000, STORICO_GIORNI = 365;
const OP_STORICO = {
  /* «entra» ed «esci» sono di quando l'area riservata stava nell'app pubblica: restano per leggere le voci vecchie */
  entra:['accessi','Entrata nell’area riservata'], esci:['accessi','Uscita dall’area riservata'],
  'chiavi-crea':['accessi','Chiavi create'], 'chiavi-ripristina':['accessi','Chiavi ripristinate da una copia'], 'chiavi-aggiungi':['accessi','Dispositivo aggiunto da una copia'],
  'chiavi-copia':['accessi','Copia di riserva delle chiavi scaricata'], 'chiavi-revoca':['accessi','Chiavi di questo dispositivo revocate'],
  'cassaforte-copia':['accessi','Copia della cassaforte scaricata'], 'cassaforte-riporta':['accessi','Cassaforte riportata da una copia'],
  crea:['eventi','Evento creato'], modifica:['eventi','Evento modificato'], elimina:['eventi','Evento eliminato'], ripristina:['eventi','Eventi ripristinati'],
  pubblica:['eventi','Evento pubblicato'], correggi:['eventi','Correzione pubblicata'], sospendi:['eventi','Evento sospeso'], riattiva:['eventi','Evento riattivato'], ritira:['eventi','Evento ritirato prima della fine'],
  'ripristina-copia':['eventi','Copia dello storico ripristinata'], 'fonte-nuova':['eventi','Fonte aggiunta al registro delle fonti'], 'fonte-corretta':['eventi','Fonte del registro corretta'],
  'np-nuovo':['eventi','Richiesta non pubblicata annotata nel registro delle fonti'], 'np-corretto':['eventi','Richiesta non pubblicata corretta'],
  'registro-esporta':['file','Registro delle fonti esportato in Excel'], 'calendario-importa':['file','Calendario aperto di un Comune letto per l’anteprima'], 'registro-importa':['file','Registro delle fonti tenuto a mano importato'],
  'registro-confronta':['eventi','Registro delle fonti confrontato con lo sportello'], 'registro-riprendi':['eventi','Voci del registro delle fonti riprese dallo sportello'],
  /* «esporta-excel», «esporta-json» e «importa» sono degli strumenti tolti nel blocco 12: restano per leggere le voci vecchie */
  importa:['file','Eventi importati da Excel'], 'esporta-excel':['file','Eventi esportati in Excel'], 'esporta-json':['file','Copia completa esportata in JSON'],
  'esporta-misure':['file','Misure esportate in Excel'], 'esporta-storico':['file','Storico esportato in Excel'],
  'togli-nome':['eventi','Nome tolto su richiesta (Togli questo nome ovunque)'], 'accesso-esporta':['file','Resoconto per una richiesta di accesso esportato'],
  'portabilita-esporta':['file','Dati per la portabilità esportati'],
  misura:['misure','Libreria delle misure'], svuota:['accessi','Storico svuotato']
};
const GRUPPI_STORICO = [['tutte','Tutte'], ['eventi','Eventi'], ['file','Import ed export'], ['misure','Misure'], ['accessi','Chiavi e accessi']];
const SH = {filtro:'tutte', mostrati:60, conferma:false};
function storico(){
  const l = MEM.leggi('red_storico', []); if(!Array.isArray(l)) return [];
  const limite = Date.now() - STORICO_GIORNI*864e5;
  return l.filter(x => x && OP_STORICO[x.op] && Date.parse(x.t) >= limite);
}
function registra(op, extra){
  if(!OP_STORICO[op]) return;
  const voce = Object.assign({t:new Date().toISOString(), op}, extra||{});
  Object.keys(voce).forEach(k => { if(voce[k]==null || voce[k]==='') delete voce[k]; });
  const l = storico(); l.push(voce);
  MEM.scrivi('red_storico', l.slice(-STORICO_MAX));
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
    <button class="link sh-indietro" data-az="admin">${tr('‹ Strumenti della redazione')}</button>
    <h2>${tr('Storico delle operazioni')}</h2>
    <p class="meta">${tr('Resta solo su questo telefono, nella memoria del browser (chiave red_storico): l’app lo legge da lì e non lo manda a nessun server. Un altro telefono ha il suo storico, o nessuno.')}</p>
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
    .catch(() => avviso(tr('Non sono riuscito a preparare il file Excel.'), null, true));
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
  else if(a==='svuota-ok'){ const n = storico().length; MEM.scrivi('red_storico', []); SH.conferma = false; registra('svuota', {x:tr('{n} operazioni cancellate',{n})}); avviso(tr('Storico svuotato'), null, true); }
  foglioStorico();
}, true);

/* ======================= «Togli questo nome ovunque» (T-047) =======================
   Libro mastro: § 3.5 «La rimozione» (entro 48 ore, con un testo neutro, negli eventi pubblicati e nei documenti
   operativi); § 3.13, passi 3 e 4; § 2.4 «Lo storico e le copie di sicurezza» (lo storico conserva il nome per il solo
   termine del § 3.14; dopo un ripristino le rimozioni si ripetono); cap. 22 e cap. 26 (né il registro delle fonti né
   quello delle richieste si modificano). Decisioni del 26/11/2026, nn. 10-13. Il nome si trova con
   sorgenti/moduli/nomi.js.

   Si comincia dalla richiesta: una di quelle aperte nel registro delle richieste di rimozione delle Misure (Misure →
   Rete), una nuova (ricevuta e codice R, che va nel registro) oppure nessuna, per esempio per correggere un errore. Poi
   si scrivono le forme del nome e si sceglie il ruolo che prende il suo posto. L'app cerca:
   - negli eventi pubblicati e sospesi (lettura firmata «stato»);
   - negli eventi nascosti di cui questo dispositivo ha la password nella cassaforte, trattati come gli altri, in un
     gruppo dopo i visibili (decisione n. 12); di quelli senza password dice soltanto quanti sono;
   - nelle schede preparate del registro delle fonti (red_registro);
   - nell'importazione da Excel e nel calendario di un Comune aperti in questo momento (pagina, non memoria).
   Ogni punto ha la sua casella, già segnata. Alla conferma l'app sostituisce i punti segnati, ripubblica in un solo
   pacchetto firmato gli eventi corretti (operazione «scrivi»: i sospesi restano sospesi, i nascosti si cifrano di nuovo
   con la stessa password), corregge i documenti operativi e scrive nelle Misure l'ora in cui la richiesta è evasa,
   con l'ora dello sportello. Se restano eventi nascosti che qui non si leggono, la richiesta resta aperta.

   Dopo il ripristino di una copia (pubblicazione.js, «Ripristina una copia») lo stesso strumento lavora sugli eventi
   della copia, prima che si ripubblichi: una richiesta alla volta, con il nome ripreso dall'anagrafica.

   Testi come testo (T-024): titoli, brani e forme entrano nella pagina solo con esc(). */
/* daSegn: quando si arriva da una segnalazione (segnalazioni.js, T-052), da quale e su quale evento */
const TN = {modo:'archivio', k:null, rich:null, nuova:null, forme:'', ruolo:MODULI.nomi.RUOLI[0], ris:null, lavoro:false, conferma:false, errore:'', msg:'', fatto:false, daSegn:''};
const CODICE_RICHIESTA = 'R-0001';
fogliPb.push('tn');
/* i campi del modulo dell'evento (schede preparate, righe dell'importazione) con il nome del campo nel formato pubblico */
const CAMPI_MODULO_TN = [['titolo','titolo'], ['desc','descrizione'], ['organizzatore','organizzatore'], ['luogo','luogo'], ['indirizzo','indirizzo'], ['comeArrivare','descrizione_luogo'],
  ['prezzo','prezzo'], ['fonte','fonte.testo'], ['fonteLink','fonte.collegamento'], ['testoCal','']];
const etichettaTn = c => c==='' ? tr('Testo del calendario del Comune') : CAMPI_PB[c] ? tr(CAMPI_PB[c]) : tr('Colonna «{c}» del file',{c});
const scadenzaTn = iso => new Date(new Date(iso).getTime() + 48*36e5);
const adessoIso = () => new Date().toISOString().slice(0,19)+'Z';

function apriTn(modo, k){
  Object.assign(TN, {modo, k:modo==='copia' ? k : null, rich:null, nuova:null, forme:'', ruolo:MODULI.nomi.RUOLI[0], ris:null, lavoro:false, conferma:false, errore:'', msg:'', fatto:false, daSegn:''});
  apri('tn');
}

/* ---------- La richiesta ---------- */
function richiestaTnHtml(){
  const m = mz(), aperte = m.rimozioni.map((r, i) => [r, i]).filter(([r]) => r && r.ric && !r.eva).sort((a, b) => a[0].ric<b[0].ric?-1:1);
  const scelta = (v, t, meta) => `<button class="riga-int" data-az="tn-rich" data-v="${esc(v)}" aria-pressed="${String(TN.rich)===String(v)}"><span class="casella" aria-hidden="true"></span><div><span class="t">${t}</span>${meta ? `<span class="meta">${meta}</span>` : ''}</div></button>`;
  const quando = iso => { const s = scadenzaTn(iso); return s.getTime() < Date.now() ? `<span class="err">${tr('Scaduta: le 48 ore sono finite il {q}',{q:esc(quandoPb(s.toISOString()))})}</span>` : tr('Da evadere entro il {q}',{q:esc(quandoPb(s.toISOString()))}); };
  const N = TN.nuova || {};
  return `<p class="etich">${tr('La richiesta')}</p>
    ${aperte.map(([r, i]) => scelta(i, `${r.r ? esc(r.r)+' · ' : ''}${tr('ricevuta il {q}',{q:esc(quandoPb(r.ric))})}`, quando(r.ric))).join('')}
    ${scelta('nuova', tr('Una richiesta nuova'), tr('La aggiungo al registro delle richieste di rimozione delle Misure'))}
    ${TN.rich==='nuova' ? `<div class="red-riquadro"><div class="due"><div class="stack-s"><label class="etich" for="tn-ric">${tr('Ricevuta')}</label><div class="campo"><input id="tn-ric" type="datetime-local" data-tn="ric" value="${esc(N.ric||'')}"></div></div>
      <div class="stack-s"><label class="etich" for="tn-r">${tr('Codice della richiesta')}</label><div class="campo"><input id="tn-r" data-tn="r" maxlength="12" value="${esc(N.r||'')}" placeholder="${CODICE_RICHIESTA}" autocomplete="off"></div></div></div>
      <span class="meta">${tr('Il codice è quello della voce nel registro delle richieste (cap. 26): il nome della persona resta nell’anagrafica, mai qui.')}</span>${N.ric ? `<span class="meta">${quando(N.ric)}</span>` : ''}</div>` : ''}
    ${scelta('nessuna', tr('Senza richiesta'), tr('Per esempio per correggere un errore: nel registro non si scrive nulla'))}`;
}

/* ---------- La ricerca ---------- */
function puntiTesto(testo, forme, campo, link){
  const N = MODULI.nomi; if(!testo || typeof testo!=='string') return [];
  if(link){ let d = testo; try{ d = decodeURIComponent(testo); }catch(e){ d = testo; } return N.trova(d, forme).length ? [{campo, da:0, a:testo.length, testo, collegamento:true, on:true}] : []; }
  return N.trova(testo, forme).map(p => Object.assign({campo, testo, on:true}, p));
}
function puntiModulo(f, forme){ return CAMPI_MODULO_TN.flatMap(([k, campo]) => puntiTesto(f[k], forme, campo, k==='fonteLink').map(p => Object.assign(p, {k}))); }
function puntiRecord(r, forme){ return Object.keys(r||{}).flatMap(k => { const v = r[k], t = typeof v==='string' ? v : v && typeof v.v==='string' ? v.v : ''; return puntiTesto(t, forme, k, false).map(p => Object.assign(p, {k})); }); }
/* un evento nascosto della copia da ripristinare: si apre con la password della cassaforte, se c'è */
async function apriVoceNascosta(x){
  let pw = null; try{ pw = await CHIAVI.cassaforte.leggi(x.id); }catch(e){ pw = null; }
  if(!pw) return null;
  try{ return {ev:await MODULI.nascosti.decifra(x.file, pw, null, x.impronta), pw}; }catch(e){ return null; }
}

async function cercaTn(){
  const N = MODULI.nomi, forme = N.forme(TN.forme);
  TN.errore = ''; TN.conferma = false;
  if(TN.modo!=='copia'){
    if(TN.rich==null){ TN.errore = tr('Scegli la richiesta, oppure «Senza richiesta».'); disegnaFoglio(); return; }
    if(TN.rich==='nuova'){ const n = TN.nuova||{};
      if(!n.ric){ TN.errore = tr('Scrivi giorno e ora in cui è arrivata la richiesta.'); disegnaFoglio(); return; }
      if(!CODICE_R.test(String(n.r||'').trim().toUpperCase())){ TN.errore = tr('Scrivi il codice della richiesta come «{c}».',{c:CODICE_RICHIESTA}); disegnaFoglio(); return; } }
  }
  if(!forme.length){ TN.errore = tr('Scrivi almeno una forma del nome, una per riga.'); disegnaFoglio(); return; }
  TN.lavoro = true; TN.ris = null; disegnaFoglio();
  const voci = []; let illeggibili = 0;
  const evento = (tipo, ev, extra) => { const punti = N.puntiEvento(ev, forme).map(p => Object.assign(p, {testo:N.leggiCampo(ev, p.campo), on:true})); if(punti.length) voci.push(Object.assign({tipo, id:ev.id, ev, punti}, extra)); };
  try{
    if(TN.modo==='copia'){
      const R = PB.ripr; if(!R) throw new Error('copia');
      R.eventi.forEach(ev => evento('evento', ev, {lista:'eventi'})); R.sospesi.forEach(ev => evento('evento', ev, {lista:'sospesi', sospeso:true}));
      for(const [lista, l] of [['nascosti', R.nascosti], ['nascostiSospesi', R.nascostiSospesi]]) for(const x of l){
        const c = await apriVoceNascosta(x); if(!c){ illeggibili++; continue; }
        evento('nascosto', c.ev, {lista, voce:x, pw:c.pw, sospeso:lista==='nascostiSospesi'}); }
    } else {
      const s = await SPORTELLO.chiedi({operazione:'stato'}); PB.stato = s;
      await nrDecifra(nrVoci(s));
      s.eventi.forEach(ev => evento('evento', ev, {})); s.sospesi.forEach(ev => evento('evento', ev, {sospeso:true}));
      nrVoci(s).forEach(x => { const c = NR.chiari.get(x.id); if(!c){ illeggibili++; return; } evento('nascosto', c.ev, {voce:x, pw:c.pw, sospeso:(s.nascostiSospesi||[]).includes(x)}); });
      await regApri();
      if(REG.stato==='aperto') REG.dati.preparati.forEach(p => { const punti = puntiModulo(p.dati||{}, forme); if(punti.length) voci.push({tipo:'preparato', codice:p.codice, f:p.dati, punti}); });
      if(IX.stato) (IX.stato.righe||[]).forEach(R => { if(!R.f) return; const punti = puntiModulo(R.f, forme); if(punti.length) voci.push({tipo:'riga', riga:R, f:R.f, punti}); });
      if(CAL.stato && Array.isArray(CAL.stato.record)) CAL.stato.record.forEach((r, i) => { const punti = puntiRecord(r, forme); if(punti.length) voci.push({tipo:'record', i, r, punti}); });
    }
    TN.ris = {voci, illeggibili, forme:forme.map(x => x.forma)};
  }catch(e){ TN.errore = e && e.motivo ? errorePb(e) : tr('Non sono riuscito a leggere gli eventi: riprova.'); }
  TN.lavoro = false; disegnaFoglio();
}

/* ---------- I risultati ---------- */
const GRUPPI_TN = [['evento', 'Eventi pubblicati e sospesi'], ['nascosto', 'Eventi nascosti'], ['preparato', 'Schede preparate'], ['riga', 'Importazione da Excel in corso'], ['record', 'Calendario del Comune in lettura']];
function titoloVoceTn(v){
  if(v.tipo==='evento' || v.tipo==='nascosto') return [esc(v.ev.titolo), esc(quandoEv(v.ev))+(v.sospeso ? ' · '+tr('sospeso') : '')+(v.tipo==='nascosto' ? ' · '+tr('nascosto') : '')];
  if(v.tipo==='preparato') return [esc((v.f||{}).titolo || tr('Senza titolo')), esc(v.codice)];
  if(v.tipo==='riga') return [esc(v.f.titolo || tr('Senza titolo')), tr('Riga {r} del file',{r:v.riga.riga})];
  return [tr('Evento {n} del calendario',{n:v.i+1}), ''];
}
function branoTn(p){
  if(p.collegamento) return `<span class="tn-brano">${esc(p.testo)}</span><span class="meta">${tr('Il collegamento contiene il nome: si toglie, perché un indirizzo cambiato non porterebbe più alla pagina (il collegamento è facoltativo).')}</span>`;
  const e = MODULI.nomi.estratto(p.testo, p.da, p.a);
  return `<span class="tn-brano">${esc(e.prima)}<mark>${esc(e.nome)}</mark>${esc(e.dopo)}</span>`;
}
function risultatiTnHtml(){
  const R = TN.ris, copia = TN.modo==='copia', segnati = R.voci.reduce((n, v) => n + v.punti.filter(p => p.on).length, 0), tutti = R.voci.reduce((n, v) => n + v.punti.length, 0);
  const illeggibili = !R.illeggibili ? '' : `<div class="red-riquadro g-avviso" role="note"><b>${R.illeggibili===1 ? tr('1 evento nascosto non si legge su questo dispositivo.') : tr('{n} eventi nascosti non si leggono su questo dispositivo.',{n:R.illeggibili})}</b>
      <span class="meta">${tr('La loro password non è nella cassaforte di questo dispositivo, quindi qui non si sa se contengono il nome. Riprendi la copia della cassaforte (Strumenti della redazione → Chiavi) oppure ripeti la ricerca dal dispositivo che ha le loro password.')}${copia ? '' : ' '+tr('Finché non li hai controllati, la richiesta resta aperta nelle Misure.')}</span></div>`;
  if(!R.voci.length) return `${illeggibili}<p class="meta" role="status">${tr('Il nome non compare in nessun punto.')}</p>
    ${!copia && TN.rich!=null && TN.rich!=='nessuna' && !R.illeggibili ? `<div class="tasti"><button class="tasto sec" data-az="tn-evasa">${tr('Segna la richiesta come evasa')}</button></div>` : ''}
    ${copia ? `<div class="tasti"><button class="tasto sec" data-az="tn-copia-fatta">${tr('Segna la richiesta come ripetuta in questa copia')}</button></div>` : ''}`;
  const gruppi = GRUPPI_TN.map(([tipo, tit]) => { const l = R.voci.map((v, i) => [v, i]).filter(([v]) => v.tipo===tipo); if(!l.length) return '';
    return `<p class="etich">${tr(tit)} · ${l.length}</p>${l.map(([v, i]) => { const [t, meta] = titoloVoceTn(v);
      return `<div class="red-riquadro tn-voce"><div><span class="t">${t}</span>${meta ? `<span class="meta"> · ${meta}</span>` : ''}</div>
        ${v.punti.map((p, j) => `<button class="riga-int tn-punto" data-tnp="${i}.${j}" aria-pressed="${p.on}"><span class="casella" aria-hidden="true"></span><div><span class="meta">${esc(etichettaTn(p.campo))}</span>${branoTn(p)}</div></button>`).join('')}</div>`; }).join('')}`; }).join('');
  return `<p class="meta" role="status">${tr('Trovato in {p} punti. Togli il segno ai punti che non riguardano la persona, per esempio una via o un teatro con lo stesso nome.',{p:tutti})}</p>
    ${illeggibili}${gruppi}
    <p class="meta">${copia ? tr('Si corregge soltanto la copia da ripristinare: si pubblica con la copia.') : tr('Lo storico delle pubblicazioni e il registro delle fonti non si toccano: lo storico conserva il nome, fuori dall’uso quotidiano, per il solo termine del § 3.14.')}</p>
    <div class="tasti"><button class="tasto pericolo pieno" data-az="tn-togli" ${segnati && !TN.lavoro ? '' : 'disabled'}>${TN.conferma
      ? (copia ? tr('Tocca ancora: sostituisco {p} punti con «{r}» nella copia',{p:segnati, r:esc(TN.ruolo)}) : tr('Tocca ancora: sostituisco {p} punti con «{r}» e ripubblico con la firma di questo dispositivo',{p:segnati, r:esc(TN.ruolo)}))
      : tr('Togli il nome dai {p} punti segnati',{p:segnati})}</button></div>`;
}

function fTn(){
  const copia = TN.modo==='copia', rc = copia && PB.ripr ? PB.ripr.rimozioni[TN.k] : null;
  const testa = `<div class="riga-titolo"><div><h2>${copia ? tr('Togli il nome da questa copia') : tr('Togli questo nome ovunque')}</h2><p class="meta">${copia ? (rc ? (rc.r ? esc(rc.r)+' · ' : '')+tr('ricevuta il {q}',{q:esc(quandoPb(rc.ric))}) : '') : tr('Entro 48 ore dalla richiesta (§§ 3.5 e 3.13)')}</p></div>${chiudiBtn(copia ? 'pb-copia' : 'admin')}</div>${TN.daSegn ? `<p class="meta">${esc(TN.daSegn)}</p>` : ''}`;
  const avviso = `${TN.errore ? `<p class="err" role="alert">${esc(TN.errore)}</p>` : ''}${TN.lavoro ? `<p class="caricamento">${TN.ris ? tr('Correggo e consegno allo sportello…') : tr('Cerco il nome…')}</p>` : ''}`;
  if(TN.fatto) return foglio('forte alto', testa, `<p role="status">${esc(TN.msg)}</p>
    <div class="tasti"><button class="tasto sec" data-az="tn">${tr('Togli un altro nome')}</button><button class="tasto pri" data-az="pubblica">${tr('Vai a «Pubblicazione»')}</button></div>`);
  const nome = `<label class="etich" for="tn-forme">${tr('Il nome, in tutte le forme in cui può comparire')}</label>
    <div class="campo"><textarea id="tn-forme" data-tn="forme" maxlength="1200" placeholder="${esc(tr('Una forma per riga: nome e cognome, il solo cognome, il nome d’arte'))}">${esc(TN.forme)}</textarea></div>
    <span class="meta">${tr('Maiuscole, accenti e apostrofi non contano; si cercano soltanto parole intere. Ogni punto trovato si guarda prima di toglierlo.')}</span>
    <label class="etich" for="tn-ruolo">${tr('Al suo posto')}</label>
    <div class="campo"><select id="tn-ruolo" data-tn="ruolo">${MODULI.nomi.RUOLI.map(x => `<option value="${esc(x)}" ${TN.ruolo===x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
    <span class="meta">${tr('Il ruolo che la persona ha negli eventi; vale per tutti i punti. Se ha ruoli diversi in eventi diversi, fai due passate.')}</span>
    <div class="tasti"><button class="tasto pri" data-az="tn-cerca" ${TN.lavoro ? 'disabled' : ''}>${tr('Cerca')}</button></div>`;
  const corpo = `${copia ? `<p class="meta">${tr('Il nome si riprende dall’anagrafica, con il codice della richiesta. Si corregge soltanto questa copia, prima di ripubblicarla.')}</p>` : richiestaTnHtml()}
    ${nome}${avviso}${TN.ris ? risultatiTnHtml() : ''}`;
  return foglio('forte alto', testa, corpo);
}

/* ---------- La correzione ---------- */
/* un evento con i punti segnati sostituiti; il collegamento che contiene il nome si toglie */
function eventoTn(v){
  const N = MODULI.nomi, on = v.punti.filter(p => p.on); let ev = v.ev;
  for(const campo of [...new Set(on.map(p => p.campo))]){
    const qui = on.filter(p => p.campo===campo);
    ev = qui.some(p => p.collegamento) ? N.conCampo(ev, campo, '') : N.conCampo(ev, campo, N.sostituisci(N.leggiCampo(v.ev, campo), qui, TN.ruolo));
  }
  ev.modificato = adessoIso();
  return ev;
}
/* una scheda preparata, una riga dell'importazione o un evento del calendario: si correggono sul posto */
function moduloTn(v){
  const on = v.punti.filter(p => p.on), N = MODULI.nomi;
  for(const k of [...new Set(on.map(p => p.k))]){
    const qui = on.filter(p => p.k===k);
    if(v.tipo==='record'){ const x = v.r[k]; if(typeof x==='string') v.r[k] = N.sostituisci(x, qui, TN.ruolo); else if(x && typeof x.v==='string') x.v = N.sostituisci(x.v, qui, TN.ruolo); continue; }
    const f = v.f, prima = f[k];
    f[k] = qui.some(p => p.collegamento) ? '' : N.sostituisci(prima, qui, TN.ruolo);
    if(k==='indirizzo' && f.addrFull) f.addrFull = f.addrFull===prima ? f.indirizzo : N.sostituisci(f.addrFull, N.trova(f.addrFull, TN.ris.forme.join('\n')), TN.ruolo);
  }
}
async function togliTn(){
  const R = TN.ris; if(!R || TN.lavoro) return;
  const scelte = R.voci.filter(v => v.punti.some(p => p.on)); if(!scelte.length) return;
  if(!TN.conferma){ TN.conferma = true; disegnaFoglio(); return; }
  TN.conferma = false; TN.lavoro = true; TN.errore = ''; disegnaFoglio();
  const NS = MODULI.nascosti, voc = {vocabolario:FORMATO.vocabolario(LAYERS, TEMI_VOC)};
  try{
    /* prima si preparano tutti gli eventi corretti: se uno non supera il controllo del formato non parte nulla */
    const pubblici = [], nascosti = [], errori = [];
    for(const v of scelte.filter(x => x.tipo==='evento' || x.tipo==='nascosto')){
      const ev = eventoTn(v), e = FORMATO.controlla(ev, voc).map(erroreCampoPb);
      if(e.length){ errori.push('«'+v.ev.titolo+'»: '+e.join('; ')); continue; }
      if(v.tipo==='evento') pubblici.push([v, ev]);
      else { const {file} = await NS.cifra(ev, v.pw, null, v.voce.impronta); nascosti.push([v, ev, {id:ev.id, impronta:v.voce.impronta, giorno:NS.giornoUscita(ev), file}]); }
    }
    if(errori.length){ TN.lavoro = false; TN.errore = tr('Con il testo neutro un evento non supera il controllo del formato, e non ho cambiato nulla: {e}',{e:errori.join(' · ')}); disegnaFoglio(); return; }
    const locali = scelte.filter(x => x.tipo!=='evento' && x.tipo!=='nascosto');
    if(TN.modo==='copia') return finisciCopiaTn(pubblici, nascosti);
    let quando = null;
    if(pubblici.length + nascosti.length){
      const c = {operazione:'scrivi'}; if(pubblici.length) c.pubblica = pubblici.map(x => x[1]); if(nascosti.length) c.nascosti = nascosti.map(x => x[2]);
      const r = await SPORTELLO.chiedi(c); quando = r.quando;
      nascosti.forEach(([v, ev, voce]) => NR.chiari.set(ev.id, {ev, pw:v.pw, v:JSON.stringify(voce.file)}));
      pubblici.concat(nascosti).forEach(() => misureConta('corretti'));
    }
    locali.forEach(moduloTn);
    const prep = locali.filter(x => x.tipo==='preparato').length;
    if(prep) await regSalva();
    registra('togli-nome', {n:pubblici.length + nascosti.length});
    TN.msg = finisciRichiestaTn(quando, pubblici.length + nascosti.length, prep, locali.filter(x => x.tipo==='riga').length, locali.filter(x => x.tipo==='record').length);
    TN.lavoro = false; TN.fatto = true; disegnaFoglio();
    aggiornaPb();
  }catch(e){ TN.lavoro = false; TN.errore = e && e.motivo ? errorePb(e) : tr('Non è riuscito: non ho cambiato nulla. Riprova.'); disegnaFoglio(); }
}
/* nelle Misure: la richiesta è evasa all'ora dello sportello, se non restano eventi nascosti da controllare */
function finisciRichiestaTn(quando, ev, prep, righe, cal){
  const ora = dtLocal(quando ? new Date(quando) : new Date()), m = mz(), aperta = !!TN.ris.illeggibili;
  const parti = [ev ? tr('Nome tolto alle {o} (ora dello sportello): {n} eventi corretti e ripubblicati con la firma di questo dispositivo.',{o:oraPb(quando), n:ev}) : tr('Nessun evento da ripubblicare.')];
  if(prep) parti.push(tr('Schede preparate corrette: {n}.',{n:prep}));
  if(righe) parti.push(tr('Righe dell’importazione in corso corrette: {n}.',{n:righe}));
  if(cal) parti.push(tr('Eventi del calendario in lettura corretti: {n}.',{n:cal}));
  if(TN.rich==='nessuna') return parti.join(' ');
  let voce = null;
  if(TN.rich==='nuova'){ voce = {ric:TN.nuova.ric, eva:'', r:String(TN.nuova.r).trim().toUpperCase()}; m.rimozioni.push(voce); }
  else voce = m.rimozioni[+TN.rich] || null;
  if(voce && !aperta) voce.eva = ora;
  mzSalva();
  const c = voce && voce.r ? voce.r : '';
  parti.push(!voce ? '' : aperta ? (c ? tr('La richiesta {c} resta aperta nelle Misure: mancano gli eventi nascosti che questo dispositivo non legge.',{c}) : tr('La richiesta resta aperta nelle Misure: mancano gli eventi nascosti che questo dispositivo non legge.'))
    : c ? tr('Richiesta {c} segnata come evasa nelle Misure ({o}).',{c, o:fmtDt(ora)}) : tr('Richiesta segnata come evasa nelle Misure ({o}).',{o:fmtDt(ora)}));
  return parti.filter(Boolean).join(' ');
}
function finisciCopiaTn(pubblici, nascosti){
  const R = PB.ripr;
  for(const [v, ev] of pubblici){ const l = R[v.lista], i = l.findIndex(x => x.id===ev.id); if(i>=0) l[i] = ev; }
  for(const [v, , voce] of nascosti){ const l = R[v.lista], i = l.findIndex(x => x.id===voce.id); if(i>=0) l[i] = voce; }
  R.corretti += pubblici.length + nascosti.length; R.fatte[TN.k] = !TN.ris.illeggibili;
  PB.msg = tr('Nome tolto da {n} eventi della copia.',{n:pubblici.length + nascosti.length}) + ' ' + (TN.ris.illeggibili ? tr('Restano eventi nascosti che questo dispositivo non legge: la richiesta non è segnata come ripetuta.') : tr('Richiesta segnata come ripetuta in questa copia.'));
  PB.errore = ''; TN.lavoro = false; apri('pb-copia');
}

/* ---------- Tocchi e campi ---------- */
DIRITTI.push({
  voce:() => `<button class="menu-r" data-az="tn">${icoNote}<div><span class="t">${tr('Togli questo nome ovunque')}</span><span class="meta">${tr('Rimozione di un nome su richiesta: eventi pubblicati, nascosti, schede preparate e importazioni aperte')}</span></div>${freccia}</button>`,
  click(t){ const d = t.dataset.tnp; if(d==null || !TN.ris) return false; const [i, j] = d.split('.').map(Number), p = (TN.ris.voci[i]||{punti:[]}).punti[j]; if(p){ p.on = !p.on; TN.conferma = false; disegnaFoglio(); } return true; },
  azione(az, t){
    switch(az){
      case 'tn': apriTn('archivio'); return true;
      case 'tn-copia': if(PB.ripr) apriTn('copia', +t.dataset.k); return true;
      case 'tn-rich': TN.rich = t.dataset.v==='nuova' || t.dataset.v==='nessuna' ? t.dataset.v : +t.dataset.v; if(TN.rich==='nuova' && !TN.nuova) TN.nuova = {ric:dtLocal(new Date()), r:''}; TN.ris = null; TN.errore = ''; disegnaFoglio(); return true;
      case 'tn-cerca': cercaTn(); return true;
      case 'tn-togli': togliTn(); return true;
      case 'tn-evasa': TN.ris = TN.ris || {voci:[], illeggibili:0, forme:[]}; TN.msg = finisciRichiestaTn(null, 0, 0, 0, 0); TN.fatto = true; disegnaFoglio(); return true;
      case 'tn-copia-fatta': if(PB.ripr){ PB.ripr.fatte[TN.k] = true; PB.msg = tr('Richiesta segnata come ripetuta in questa copia.'); apri('pb-copia'); } return true;
    }
    return false;
  },
  input(el){ const k = el.dataset.tn; if(!k) return false;
    if(k==='forme'){ TN.forme = el.value; TN.conferma = false; }
    else if(k==='ric' || k==='r'){ TN.nuova = TN.nuova || {ric:'', r:''}; TN.nuova[k] = el.value; }
    return true; },
  cambio(el){ if(el.dataset.tn!=='ruolo') return false; TN.ruolo = MODULI.nomi.RUOLI.includes(el.value) ? el.value : MODULI.nomi.RUOLI[0]; TN.conferma = false; return true; }
});
Object.assign(FOGLI_RED, {tn:fTn});

/* ======================= Ricerca per nome: accesso e portabilità (T-048) =======================
   Libro mastro: § 3.13 (accesso, art. 15: ricerca negli eventi attuali, nello storico e nei registri; portabilità,
   art. 20: i dati forniti, in un formato leggibile da una macchina, quando il trattamento si basa sul consenso); § 18.7
   (si cerca il nome negli eventi e nello storico, il codice P nei registri; si consegnano le voci trovate senza i dati
   di altre persone); cap. 26 (nel resoconto compare soltanto il codice della richiesta). Anagrafica, registro dei
   consensi e codici P stanno nei registri tenuti a mano, fuori dall'app. Decisioni del 26/11/2026, nn. 14 e 15.

   Accesso. La Redazione scrive il codice della richiesta (R-0001), le forme del nome (come in «Togli questo nome
   ovunque», sorgenti/moduli/nomi.js) e, se c'è, il codice P della persona. L'app cerca il nome negli eventi pubblicati,
   sospesi e nascosti di cui ha la password, nelle copie dello storico delle pubblicazioni (una alla volta, dalla più
   vecchia, con la lettura firmata «copia»), nelle schede preparate e nelle righe del registro delle fonti di questo
   dispositivo; cerca il codice P tra le fonti e i «Non pubblicati». Per ogni evento mostra quando è stato pubblicato
   con il nome, in quali campi e il brano attorno al nome, e la fonte (art. 15, par. 1, lett. g). L'app non sa che
   cosa sia un nome: i brani e le fonti si ripuliscono a mano dei dati di altre persone (art. 15, par. 4) prima di
   esportare; i recapiti li toglie l'app. Il resoconto esce in Excel, intestato con il solo codice della richiesta.

   Portabilità. La Redazione scrive i codici C del registro dei consensi: l'app trova le righe del registro delle fonti
   con quei codici (eventi nascosti; eventi pubblicati con un consenso diretto o esplicito) e i loro eventi, attuali o
   nello storico. Gli eventi nascosti già finiti non si leggono più, perché la password si cancella alla fine (§ 3.14).
   Escono due file: l'Excel con le colonne del modello d'importazione e il JSON nel formato degli eventi.

   Testi come testo (T-024): titoli, brani e fonti entrano nella pagina solo con esc(). */
const RN = {r:'', forme:'', p:'', lavoro:false, ferma:false, passo:'', errore:'', msg:'', righe:null, registri:null, illeggibili:0};
const RP = {r:'', c:'', lavoro:false, ferma:false, passo:'', errore:'', msg:'', eventi:null, illeggibili:0};
fogliPb.push('rn', 'rp');
const mascheraRecapiti = s => RECAPITI.reduce((t, re) => t.replace(re, '[recapito tolto]'), String(s||''));
const giornoRn = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(dloc(), {day:'numeric', month:'numeric', year:'numeric'}); };
/* un brano su una riga: il nome con il testo che ha intorno */
const branoRn = (p) => { if(p.collegamento) return tr('Collegamento alla pagina dell’evento: {u}',{u:p.testo}); const e = MODULI.nomi.estratto(p.testo, p.da, p.a, 100); return e.prima + e.nome + e.dopo; };
/* legge le copie dello storico dalla più vecchia; per ognuna chiama fai(copia). Si ferma con «Ferma». */
async function giroStorico(S, fai){
  const el = await SPORTELLO.chiedi({operazione:'storico'}), copie = (el.copie||[]).slice().reverse();
  for(let i = 0; i < copie.length && !S.ferma; i++){
    S.passo = tr('Leggo lo storico: copia {i} di {n}',{i:i+1, n:copie.length}); if(i % 5 === 0) ridisegnaPb();
    await fai(await leggiCopiaPb(copie[i].nome));
  }
  return copie.length;
}
/* gli eventi nascosti di una copia si aprono solo con una password ancora nella cassaforte */
async function nascostiDiCopia(k, cache){
  const out = [];
  for(const x of (k.nascosti||[]).concat(k.nascostiSospesi||[])){
    const chiave = x.id+'|'+JSON.stringify(x.file).length+'|'+x.impronta;
    if(!cache.has(chiave)){ const c = await apriVoceNascosta(x); cache.set(chiave, c ? c.ev : null); }
    const ev = cache.get(chiave); if(ev) out.push(ev); else out.illeggibili = (out.illeggibili||0) + 1;
  }
  return out;
}

/* ---------- Accesso ---------- */
async function cercaAccesso(){
  const N = MODULI.nomi, forme = N.forme(RN.forme), P = RN.p.trim().toUpperCase();
  RN.errore = ''; RN.msg = '';
  if(!forme.length && !P){ RN.errore = tr('Scrivi il nome, in una o più forme, oppure il codice P della persona.'); disegnaFoglio(); return; }
  if(P && !CODICE_P.test(P)){ RN.errore = tr('Il codice della persona si scrive come «P-0001».'); disegnaFoglio(); return; }
  RN.lavoro = true; RN.ferma = false; RN.righe = null; RN.registri = null; RN.illeggibili = 0; RN.passo = tr('Cerco negli eventi attuali…'); disegnaFoglio();
  const trovati = new Map(), visti = new Map(), cache = new Map();
  /* ogni evento con il nome: dove sta oggi, in quante copie compare, prima e ultima copia, brani distinti */
  const guarda = (ev, dove, quando) => {
    if(!forme.length || !ev || !ev.id) return;
    const firma = ev.id+'|'+(ev.modificato||'')+'|'+JSON.stringify(ev).length;
    let punti = visti.get(firma); if(!punti){ punti = N.puntiEvento(ev, forme).map(p => Object.assign(p, {testo:N.leggiCampo(ev, p.campo)})); visti.set(firma, punti); }
    if(!punti.length) return;
    const x = trovati.get(ev.id) || {id:ev.id, inizio:ev.inizio, dove:'', copie:0, primo:'', ultimo:'', brani:new Map(), fonte:''};
    if(dove) x.dove = dove; if(quando){ x.copie++; if(!x.primo) x.primo = quando; x.ultimo = quando; }
    x.inizio = ev.inizio; x.fonte = (ev.fonte||{}).testo || '';
    punti.forEach(p => { const b = branoRn(p), k = p.campo+'|'+b; if(!x.brani.has(k)) x.brani.set(k, {campo:p.campo, brano:b}); });
    trovati.set(ev.id, x);
  };
  try{
    const s = await SPORTELLO.chiedi({operazione:'stato'}); PB.stato = s; await nrDecifra(nrVoci(s));
    s.eventi.forEach(ev => guarda(ev, tr('Pubblicato'))); s.sospesi.forEach(ev => guarda(ev, tr('Sospeso')));
    nrVoci(s).forEach(x => { const c = NR.chiari.get(x.id); if(c) guarda(c.ev, tr('Nascosto')); else RN.illeggibili++; });
    /* le copie dello storico: gli eventi in chiaro, e i nascosti di cui la cassaforte ha ancora la password */
    if(forme.length) await giroStorico(RN, async k => { k.eventi.concat(k.sospesi).forEach(ev => guarda(ev, '', k.quando)); (await nascostiDiCopia(k, cache)).forEach(ev => guarda(ev, '', k.quando)); });
    await regApri();
    const righe = [...trovati.values()].map(x => ({dove:x.dove || tr('Solo nello storico'), inizio:x.inizio, copie:x.copie, primo:x.primo, ultimo:x.dove ? '' : x.ultimo, fonte:mascheraRecapiti(x.fonte),
      brani:[...x.brani.values()].map(b => ({campo:b.campo, brano:mascheraRecapiti(b.brano)})), id:x.id, on:true}));
    if(REG.stato==='aperto' && forme.length){
      REG.dati.preparati.forEach(p => { const pt = puntiModulo(p.dati||{}, forme); if(pt.length) righe.push({dove:tr('Scheda preparata {c}',{c:p.codice}), meta:tr('Scheda non pubblicata, solo su questo dispositivo'), inizio:(p.dati||{}).inizio||'', copie:0, primo:'', ultimo:'', fonte:mascheraRecapiti((p.dati||{}).fonte),
        brani:pt.map(q => ({campo:q.campo, brano:mascheraRecapiti(branoRn(q))})), on:true}); });
      REG.dati.eventi.forEach(r => { const pt = [['titolo', r.titolo], ['fonte.testo', r.testoFonte]].flatMap(([c, t]) => (t ? N.trova(t, forme) : []).map(q => Object.assign(q, {campo:c, testo:t})));
        if(pt.length) righe.push({dove:tr('Registro delle fonti, riga {c}',{c:r.codice||r.id}), meta:tr('Riga del registro delle fonti su questo dispositivo: il registro non si modifica (cap. 22)'), inizio:'', copie:0, primo:r.quando||'', ultimo:'', fonte:'', brani:pt.map(q => ({campo:q.campo, brano:mascheraRecapiti(branoRn(q))})), on:true}); });
    }
    RN.righe = righe;
    RN.registri = !P || REG.stato!=='aperto' ? [] : registriDiP(P);
  }catch(e){ RN.errore = e && e.motivo ? errorePb(e) : tr('Non sono riuscito a leggere gli eventi o lo storico: riprova.'); }
  RN.lavoro = false; RN.passo = ''; disegnaFoglio();
}
/* il codice P nei registri del dispositivo: fonti che sono la persona, righe degli eventi da quelle fonti, «Non pubblicati» */
function registriDiP(P){
  const d = REG.dati, fonti = d.fonti.filter(f => f.nome===P), cod = new Set(fonti.map(f => f.codice)), out = [];
  fonti.forEach(f => { const ev = d.eventi.filter(r => r.g && r.g.fonte===f.codice);
    out.push([tr('Registro delle fonti'), f.codice, tr((tipoFonte(f.tipo)||[])[1]||''), tr('Righe degli eventi con questa fonte: {n}',{n:ev.length})+(ev.length ? ' ('+ev.map(r => r.codice||'').filter(Boolean).join(', ')+')' : '')]); });
  d.nonPubblicati.filter(x => x.organizzatore===P).forEach(x => out.push([tr('Non pubblicati'), x.codice, x.registrata||'', x.motivo||'']));
  return out;
}
function fRn(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Cerca un nome: diritto di accesso')}</h2><p class="meta">${tr('Art. 15 GDPR · §§ 3.13 e 18.7')}</p></div>${chiudiBtn('admin')}</div>`;
  const campi = `<div class="due"><div class="stack-s"><label class="etich" for="rn-r">${tr('Codice della richiesta')}</label><div class="campo"><input id="rn-r" data-rn="r" maxlength="12" value="${esc(RN.r)}" placeholder="${CODICE_RICHIESTA}" autocomplete="off"></div></div>
      <div class="stack-s"><label class="etich" for="rn-p">${tr('Codice della persona')} <span class="fac">${tr('facoltativo')}</span></label><div class="campo"><input id="rn-p" data-rn="p" maxlength="12" value="${esc(RN.p)}" placeholder="P-0001" autocomplete="off"></div></div></div>
    <label class="etich" for="rn-forme">${tr('Il nome, in tutte le forme in cui può comparire')}</label>
    <div class="campo"><textarea id="rn-forme" data-rn="forme" maxlength="1200" placeholder="${esc(tr('Una forma per riga: nome e cognome, il solo cognome, il nome d’arte'))}">${esc(RN.forme)}</textarea></div>
    <span class="meta">${tr('Si cerca negli eventi attuali, nelle copie dello storico delle pubblicazioni, nelle schede preparate e nel registro delle fonti di questo dispositivo; il codice P tra le fonti e i «Non pubblicati». Anagrafica, registro dei consensi ed elenco dei contatti si cercano a mano (§ 18.7).')}</span>
    <div class="tasti"><button class="tasto pri" data-az="rn-cerca" ${RN.lavoro ? 'disabled' : ''}>${tr('Cerca')}</button>${RN.lavoro ? `<button class="tasto sec" data-az="rn-ferma">${tr('Ferma')}</button>` : ''}</div>`;
  const stato = `${RN.errore ? `<p class="err" role="alert">${esc(RN.errore)}</p>` : ''}${RN.msg ? `<p class="meta" role="status" style="color:var(--testo)">${esc(RN.msg)}</p>` : ''}${RN.lavoro ? `<p class="caricamento">${esc(RN.passo)}</p>` : ''}`;
  return foglio('forte alto', testa, `${campi}${stato}${RN.righe ? risultatiRnHtml() : ''}`);
}
function risultatiRnHtml(){
  const R = RN.righe, scelte = R.filter(x => x.on).length;
  const ill = RN.illeggibili ? `<p class="meta">${tr('{n} eventi nascosti attuali non si leggono su questo dispositivo: la loro password non è nella sua cassaforte.',{n:RN.illeggibili})}</p>` : '';
  const reg = (RN.registri||[]).length ? `<p class="etich">${tr('Nei registri, con il codice della persona')} · ${RN.registri.length}</p><div class="imp-righe">${RN.registri.map(r => `<div>${r.map(esc).join(' · ')}</div>`).join('')}</div>` : '';
  if(!R.length) return `${ill}<p class="meta" role="status">${tr('Il nome non compare negli eventi né nello storico.')}</p>${reg}${(RN.registri||[]).length ? esportaRnHtml(0) : ''}`;
  return `<div class="red-riquadro g-avviso" role="note"><b>${tr('Prima di esportare, togli i dati di altre persone')}</b><span class="meta">${tr('L’app non sa riconoscere i nomi: leggi ogni brano e ogni fonte e cancella i nomi e i dettagli di altre persone (art. 15, par. 4). I recapiti li ha già tolti l’app.')}</span></div>
    ${ill}<p class="etich">${tr('Eventi in cui compare')} · ${R.length}</p>
    ${R.map((x, i) => `<div class="red-riquadro tn-voce">
      <button class="riga-int" data-rnp="${i}" aria-pressed="${x.on}"><span class="casella" aria-hidden="true"></span><div><span class="t">${esc(x.dove)}${x.inizio ? ' · '+tr('evento del {g}',{g:esc(giornoRn(x.inizio.slice(0,10)))}) : ''}</span>
        <span class="meta">${x.copie ? tr('In {n} copie dello storico, dal {a} al {b}',{n:x.copie, a:esc(giornoRn(x.primo)), b:esc(giornoRn(x.ultimo || x.primo))}) : esc(x.meta || tr('Non è nello storico delle pubblicazioni'))}</span></div></button>
      ${x.brani.map((b, j) => `<label class="etich" for="rn-b-${i}-${j}">${esc(etichettaTn(b.campo))}</label><div class="campo"><textarea id="rn-b-${i}-${j}" data-rnb="${i}.${j}">${esc(b.brano)}</textarea></div>`).join('')}
      <label class="etich" for="rn-f-${i}">${tr('Fonte')}</label><div class="campo"><input id="rn-f-${i}" data-rnf="${i}" value="${esc(x.fonte)}" autocomplete="off"></div></div>`).join('')}
    ${reg}${esportaRnHtml(scelte)}`;
}
const esportaRnHtml = n => `<div class="tasti"><button class="tasto pri" data-az="rn-esporta">${n ? tr('Esporta il resoconto in Excel ({n} eventi)',{n}) : tr('Esporta il resoconto in Excel')}</button></div>
  <p class="meta">${tr('Il file è intestato con il solo codice della richiesta, senza nome. Non ha password: consegnalo sul canale della richiesta e cancella la copia dal dispositivo.')}</p>`;
function esportaAccesso(){
  const R = RN.r.trim().toUpperCase();
  if(!CODICE_R.test(R)){ RN.errore = tr('Scrivi il codice della richiesta come «{c}».',{c:CODICE_RICHIESTA}); disegnaFoglio(); return; }
  const righe = (RN.righe||[]).filter(x => x.on), oggiIt = giornoRn(new Date().toISOString());
  const testa = [tr('Luogo'), tr('Evento del'), tr('Copie dello storico'), tr('Pubblicato dal'), tr('Pubblicato fino al'), tr('Campo'), tr('Brano'), tr('Fonte')];
  const dati = righe.flatMap(x => x.brani.map((b, j) => [x.dove, x.inizio ? giornoRn(x.inizio.slice(0,10)) : '', x.copie||'', x.primo ? giornoRn(x.primo) : '', x.ultimo ? giornoRn(x.ultimo) : x.copie ? tr('ancora pubblicato') : '', etichettaTn(b.campo), mascheraRecapiti(b.brano), j ? '' : mascheraRecapiti(x.fonte)]));
  const fogli = [['Resoconto', [[tr('Richiesta {r} · dati trovati per il diritto di accesso (art. 15 GDPR)',{r:R})], [tr('Preparato il {g}. Dai brani sono tolti i dati di altre persone e i recapiti.',{g:oggiIt})], [], testa].concat(dati.length ? dati : [[tr('Il nome non compare negli eventi né nello storico delle pubblicazioni.')]]), [26,12,10,13,15,22,70,30], {testa:3}]];
  if((RN.registri||[]).length) fogli.push(['Registri', [[tr('Richiesta {r} · voci dei registri con il codice della persona',{r:R})], [], [], [tr('Registro'), tr('Codice'), tr('Tipo o data'), tr('Dettaglio')]].concat(RN.registri), [22,12,26,60], {testa:3}]);
  const nome = 'accesso-'+R+'-'+oggi()+'.xlsx';
  fileExcel(fogli, nome).then(() => { registra('accesso-esporta', {n:righe.length}); RN.errore = ''; RN.msg = tr('Resoconto esportato: {f}.',{f:nome}); disegnaFoglio(); },
    () => { RN.errore = tr('Non sono riuscito a preparare il file Excel.'); disegnaFoglio(); });
}

/* ---------- Portabilità ---------- */
async function cercaPortabilita(){
  const codici = [...new Set(RP.c.toUpperCase().split(/[\s,;]+/).filter(Boolean))];
  RP.errore = ''; RP.msg = '';
  if(!codici.length || codici.some(c => !CODICE_C.test(c))){ RP.errore = tr('Scrivi uno o più codici del registro dei consensi, come «C-0001».'); disegnaFoglio(); return; }
  RP.lavoro = true; RP.ferma = false; RP.eventi = null; RP.illeggibili = 0; RP.passo = tr('Cerco nel registro delle fonti…'); disegnaFoglio();
  try{
    await regApri(); if(REG.stato!=='aperto') throw Object.assign(new Error('registro'), {testo:statoRegistro()});
    const righe = REG.dati.eventi.filter(r => r.g && codici.includes(String(r.g.consenso||'').trim().toUpperCase()));
    const ids = new Set(righe.map(r => r.id)), presi = new Map(), cache = new Map();
    const s = await SPORTELLO.chiedi({operazione:'stato'}); PB.stato = s; await nrDecifra(nrVoci(s));
    s.eventi.concat(s.sospesi).forEach(ev => { if(ids.has(ev.id)) presi.set(ev.id, {ev, dove:tr('Attuale')}); });
    nrVoci(s).forEach(x => { if(!ids.has(x.id)) return; const c = NR.chiari.get(x.id); if(c) presi.set(x.id, {ev:c.ev, dove:tr('Attuale, nascosto')}); });
    const mancano = () => [...ids].filter(id => !presi.has(id) || presi.get(id).vecchio);
    /* gli eventi che non ci sono più: l'ultima versione nello storico; i nascosti solo con la password ancora nella cassaforte */
    const prendi = (ev, dove) => { if(ids.has(ev.id) && (!presi.has(ev.id) || presi.get(ev.id).vecchio)) presi.set(ev.id, {ev, dove, vecchio:true}); };
    if(mancano().length) await giroStorico(RP, async k => { k.eventi.concat(k.sospesi).forEach(ev => prendi(ev, tr('Nello storico')));
      if((k.nascosti||[]).concat(k.nascostiSospesi||[]).some(x => ids.has(x.id))) (await nascostiDiCopia(k, cache)).forEach(ev => prendi(ev, tr('Nello storico, nascosto'))); });
    RP.illeggibili = [...ids].filter(id => !presi.has(id)).length;
    RP.eventi = [...presi.values()].map(x => Object.assign(x, {on:true})).sort((a, b) => a.ev.inizio<b.ev.inizio?-1:1);
  }catch(e){ RP.errore = e && e.testo ? e.testo : e && e.motivo ? errorePb(e) : tr('Non sono riuscito a leggere gli eventi o lo storico: riprova.'); }
  RP.lavoro = false; RP.passo = ''; disegnaFoglio();
}
function fRp(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Portabilità dei dati forniti con il consenso')}</h2><p class="meta">${tr('Art. 20 GDPR · § 3.13')}</p></div>${chiudiBtn('admin')}</div>`;
  const campi = `<p class="meta">${tr('Vale solo per i trattamenti basati sul consenso: gli eventi nascosti e gli eventi pubblicati con un consenso diretto o esplicito. Gli eventi pubblici mandati da un organizzatore si basano sul legittimo interesse (§ 3.3); un ente non ha questo diritto.')}</p>
    <div class="due"><div class="stack-s"><label class="etich" for="rp-r">${tr('Codice della richiesta')}</label><div class="campo"><input id="rp-r" data-rp="r" maxlength="12" value="${esc(RP.r)}" placeholder="${CODICE_RICHIESTA}" autocomplete="off"></div></div>
      <div class="stack-s"><label class="etich" for="rp-c">${tr('Codici del consenso')}</label><div class="campo"><input id="rp-c" data-rp="c" maxlength="200" value="${esc(RP.c)}" placeholder="C-0001" autocomplete="off"></div></div></div>
    <div class="tasti"><button class="tasto pri" data-az="rp-cerca" ${RP.lavoro ? 'disabled' : ''}>${tr('Cerca')}</button>${RP.lavoro ? `<button class="tasto sec" data-az="rp-ferma">${tr('Ferma')}</button>` : ''}</div>`;
  const stato = `${RP.errore ? `<p class="err" role="alert">${esc(RP.errore)}</p>` : ''}${RP.msg ? `<p class="meta" role="status" style="color:var(--testo)">${esc(RP.msg)}</p>` : ''}${RP.lavoro ? `<p class="caricamento">${esc(RP.passo)}</p>` : ''}`;
  const E = RP.eventi, n = E ? E.filter(x => x.on).length : 0;
  const lista = !E ? '' : `${RP.illeggibili ? `<p class="meta">${tr('{n} eventi di questi consensi non si leggono più: erano nascosti e la loro password si è cancellata alla fine dell’evento (§ 3.14). Il resoconto lo dice.',{n:RP.illeggibili})}</p>` : ''}
    ${E.length ? `<p class="etich">${tr('Eventi trovati')} · ${E.length}</p>${E.map((x, i) => `<button class="riga-int" data-rpe="${i}" aria-pressed="${x.on}"><span class="casella" aria-hidden="true"></span><div><span class="t">${esc(x.ev.titolo)}</span><span class="meta">${esc(quandoEv(x.ev))} · ${esc(x.dove)}</span></div></button>`).join('')}` : `<p class="meta" role="status">${tr('Nessun evento con questi codici nel registro delle fonti di questo dispositivo.')}</p>`}
    <div class="tasti"><button class="tasto sec" data-az="rp-excel" ${n || RP.illeggibili ? '' : 'disabled'}>${tr('Scarica l’Excel')}</button><button class="tasto sec" data-az="rp-json" ${n || RP.illeggibili ? '' : 'disabled'}>${tr('Scarica il JSON')}</button></div>
    <p class="meta">${tr('Excel: le colonne del modello con cui gli organizzatori mandano gli eventi. JSON: il formato degli eventi del nostro archivio. I file non hanno password: consegnali sul canale della richiesta e cancella le copie dal dispositivo.')}</p>`;
  return foglio('forte alto', testa, `${campi}${stato}${lista}`);
}
/* una riga del modello d'importazione (MODELLO, strumenti.js): le colonne dell'evento, senza quelle del registro */
const COLONNE_PORTABILITA = MODELLO.slice(0, 17);
function rigaModello(ev){
  const l = LAYERS.find(x => x.id===ev.strato), sub = l && ev.sottostrato ? l.sub.find(x => x.id===ev.sottostrato) : null;
  const [g, h] = String(ev.inizio||'').split('T'), fine = ev.fine ? String(ev.fine).split('T') : null;
  return [ev.titolo, l ? l.label : ev.strato, sub ? sub.label : '', ev.descrizione||'', g ? dIso(g) : '', h||'', fine ? fine[1] : '', ev.durata||'', ev.prezzo||'',
    ev.luogo||'', ev.indirizzo||'', ev.descrizione_luogo||'', ev.lat, ev.lng, (ev.fonte||{}).collegamento||'', (ev.fonte||{}).testo||'', ev.organizzatore||''];
}
function esportaPortabilita(tipo){
  const R = RP.r.trim().toUpperCase();
  if(!CODICE_R.test(R)){ RP.errore = tr('Scrivi il codice della richiesta come «{c}».',{c:CODICE_RICHIESTA}); disegnaFoglio(); return; }
  const ev = (RP.eventi||[]).filter(x => x.on).map(x => x.ev), nota = RP.illeggibili ? tr('{n} eventi nascosti non si leggono più: la loro password si è cancellata alla fine dell’evento.',{n:RP.illeggibili}) : '';
  const fatto = f => { registra('portabilita-esporta', {n:ev.length}); RP.errore = ''; RP.msg = tr('Scaricato: {f}.',{f}); disegnaFoglio(); };
  if(tipo==='json'){
    const nome = 'portabilita-'+R+'-'+oggi()+'.json';
    const d = Object.assign({formato:'eventi', versione:1, richiesta:R, creato:oggi(), eventi:ev}, nota ? {nota} : {});
    scaricaBlob(new Blob([JSON.stringify(d, null, 1)], {type:'application/json'}), nome); fatto(nome); return;
  }
  const nome = 'portabilita-'+R+'-'+oggi()+'.xlsx';
  const fogli = [['Eventi', [COLONNE_PORTABILITA.map(x => x[0])].concat(ev.map(rigaModello)), COLONNE_PORTABILITA.map(x => x[1])],
    ['Istruzioni', [[tr('Richiesta {r} · dati forniti con il consenso (art. 20 GDPR)',{r:R})], [tr('Una riga per evento, con le colonne del modello per mandare gli eventi.')]].concat(nota ? [[nota]] : []), [100]]];
  fileExcel(fogli, nome).then(() => fatto(nome), () => { RP.errore = tr('Non sono riuscito a preparare il file Excel.'); disegnaFoglio(); });
}

/* ---------- Tocchi e campi ---------- */
DIRITTI.push({
  voce:() => `<button class="menu-r" data-az="rn">${icoNote}<div><span class="t">${tr('Cerca un nome: diritto di accesso')}</span><span class="meta">${tr('Eventi attuali, storico e registri del dispositivo; resoconto in Excel')}</span></div>${freccia}</button>
    <button class="menu-r" data-az="rp">${icoEsporta}<div><span class="t">${tr('Portabilità dei dati forniti con il consenso')}</span><span class="meta">${tr('Gli eventi di un codice C, in Excel e in JSON')}</span></div>${freccia}</button>`,
  click(t){ const d = t.dataset;
    if(d.rnp!=null && RN.righe){ const x = RN.righe[+d.rnp]; if(x){ x.on = !x.on; disegnaFoglio(); } return true; }
    if(d.rpe!=null && RP.eventi){ const x = RP.eventi[+d.rpe]; if(x){ x.on = !x.on; disegnaFoglio(); } return true; }
    return false; },
  azione(az){
    switch(az){
      case 'rn': Object.assign(RN, {r:'', forme:'', p:'', lavoro:false, ferma:false, errore:'', msg:'', righe:null, registri:null, illeggibili:0}); apri('rn'); return true;
      case 'rn-cerca': if(!RN.lavoro) cercaAccesso(); return true;
      case 'rn-ferma': RN.ferma = true; return true;
      case 'rn-esporta': esportaAccesso(); return true;
      case 'rp': Object.assign(RP, {r:'', c:'', lavoro:false, ferma:false, errore:'', msg:'', eventi:null, illeggibili:0}); apri('rp'); return true;
      case 'rp-cerca': if(!RP.lavoro) cercaPortabilita(); return true;
      case 'rp-ferma': RP.ferma = true; return true;
      case 'rp-excel': esportaPortabilita('excel'); return true;
      case 'rp-json': esportaPortabilita('json'); return true;
    }
    return false;
  },
  input(el){ const d = el.dataset;
    if(d.rn){ RN[d.rn] = el.value; return true; }
    if(d.rp){ RP[d.rp] = el.value; return true; }
    if(d.rnb && RN.righe){ const [i, j] = d.rnb.split('.').map(Number), b = (RN.righe[i]||{brani:[]}).brani[j]; if(b) b.brano = el.value; return true; }
    if(d.rnf && RN.righe){ const x = RN.righe[+d.rnf]; if(x) x.fonte = el.value; return true; }
    return false; }
});
Object.assign(FOGLI_RED, {rn:fRn, rp:fRp});

/* ======================= «Esporta per assistenza» (T-049) =======================
   Libro mastro: § 2.6 «L'assistente di intelligenza artificiale» (copie con i nomi sostituiti, anteprima, tabella di
   corrispondenza sul dispositivo; se una copia non si può rendere irriconoscibile, non si fa); § 3.5 «L'assistenza
   tecnica»; § 12.5, regola 1. L'eccezione aspetta il sì nella revisione finale del libro mastro (sezione 6 del piano):
   la voce si costruisce ma si usa soltanto dopo il sì. Decisione del 26/11/2026, n. 16.

   Serve in un caso solo: dopo il lancio, un guasto che si vede soltanto con eventi veri. Sta solo nell'app della
   redazione. La Redazione sceglie a mano da 1 a 10 eventi pubblicati (mai i nascosti, mai le password) e, se vuole,
   scrive i nomi delle persone che vi compaiono, una persona per riga. Di ogni evento parte soltanto strato, città e
   mese, e quali persone contiene come Persona_1, Persona_2…: nessun testo dell'evento, nessuna data precisa, nessun
   luogo né recapito, nessun identificativo. Tutti gli eventi sono pubblici, quindi chi riceve la copia potrebbe
   cercarli nell'app: un evento parte solo se nell'archivio ci sono almeno 5 eventi con la stessa città, lo stesso mese
   e lo stesso strato (regola dei cinque); altrimenti non parte, e se non ne parte nessuno la copia non si fa.
   L'anteprima mostra esattamente il file; la tabella di corrispondenza (Evento_1 = quale evento, Persona_1 = quale
   nome) si vede soltanto nella pagina aperta e non si salva.

   Con lo sportello di prova funziona, sugli eventi inventati. Con lo sportello vero «Esporta» resta spento finché
   funzioni.esporta_assistenza di sorgenti/config.js non diventa true, con un commit dopo il sì. Il file è isolato:
   con un no si toglie da JS_RED di sorgenti/build.js e dal disco, con prove/browser/assistenza.js e il valore della
   configurazione, senza toccare altro.

   Testi come testo (T-024): titoli e nomi entrano nella pagina solo con esc(). */
const PA = {eventi:null, sel:[], nomi:'', anteprima:null, lavoro:false, errore:'', msg:''};
const ASSISTENZA_MAX = 10, ASSISTENZA_SOGLIA = 5;
fogliPb.push('pa');
OP_STORICO['assistenza-esporta'] = ['file', 'Copia per l’assistenza esportata'];
const assistenzaAccesa = () => SPORTELLO.diProva() || (CFG.funzioni||{}).esporta_assistenza === true;
const cittaAssistenza = ev => { const c = cittaDi(ev); return c==='altro' ? tr('Fuori dalle città') : nomeCitta(c); };
const meseAssistenza = ev => String(ev.inizio||'').slice(0, 7);
const gruppoAssistenza = ev => ev.strato+'|'+cittaAssistenza(ev)+'|'+meseAssistenza(ev);

function apriAssistenza(){
  Object.assign(PA, {eventi:null, sel:[], nomi:'', anteprima:null, lavoro:true, errore:'', msg:''}); apri('pa');
  SPORTELLO.chiedi({operazione:'stato'}).then(s => { PA.eventi = s.eventi.slice().sort((a, b) => a.inizio<b.inizio?-1:1); }, e => { PA.eventi = []; PA.errore = errorePb(e); })
    .then(() => { PA.lavoro = false; ridisegnaPb(); });
}
/* le persone: una per riga; più forme della stessa persona sulla stessa riga, separate da «/» */
const personeAssistenza = () => PA.nomi.split(/\r?\n/).map(r => MODULI.nomi.forme(r.split('/').join('\n'))).filter(f => f.length).slice(0, 20);
function preparaAssistenza(){
  const N = MODULI.nomi, persone = personeAssistenza(), tutti = PA.eventi||[], conta = new Map();
  tutti.forEach(ev => { const g = gruppoAssistenza(ev); conta.set(g, (conta.get(g)||0) + 1); });
  const testi = ev => N.CAMPI.map(c => { const v = N.leggiCampo(ev, c); try{ return c==='fonte.collegamento' ? decodeURIComponent(v) : v; }catch(e){ return v; } }).join('\n');
  let n = 0;
  const righe = PA.sel.map(id => tutti.find(ev => ev.id===id)).filter(Boolean).map(ev => {
    const quanti = conta.get(gruppoAssistenza(ev))||0, parte = quanti >= ASSISTENZA_SOGLIA, t = testi(ev);
    return {ev, parte, quanti, nome:parte ? 'Evento_'+(++n) : '', persone:persone.map((f, k) => N.contiene(t, f) ? 'Persona_'+(k+1) : '').filter(Boolean)};
  });
  const copia = {tipo:'copia-per-assistenza', versione:1, nota:'Strato, città e mese di eventi pubblici scelti dalla Redazione; nessun testo degli eventi, nessun nome, nessun recapito.',
    eventi:righe.filter(r => r.parte).map(r => Object.assign({evento:r.nome, strato:r.ev.strato, citta:cittaAssistenza(r.ev), mese:meseAssistenza(r.ev)}, r.persone.length ? {persone:r.persone} : {}))};
  PA.anteprima = {righe, persone, copia, testo:JSON.stringify(copia, null, 1)};
}
function fPa(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Esporta per assistenza')}</h2><p class="meta">${tr('Una copia senza nomi per l’assistente di intelligenza artificiale (§ 2.6)')}</p></div>${chiudiBtn('admin')}</div>`;
  const acceso = assistenzaAccesa(), A = PA.anteprima;
  const spiega = `<div class="red-riquadro" role="note"><b>${tr('Solo per un guasto che si vede con eventi veri')}</b>
      <span class="meta">${tr('Di ogni evento scelto parte soltanto strato, città e mese, e quali persone contiene come Persona_1, Persona_2… Nessun titolo, descrizione, luogo, indirizzo, data precisa o recapito; mai eventi nascosti né password.')}</span>
      <span class="meta">${tr('Un evento parte solo se nell’archivio ci sono almeno {n} eventi con la stessa città, lo stesso mese e lo stesso strato: così chi riceve la copia non può capire quale sia.',{n:ASSISTENZA_SOGLIA})}</span>
      ${acceso ? (SPORTELLO.diProva() ? `<span class="meta">${tr('Sportello di prova: funziona sugli eventi inventati. Con lo sportello vero resta spento fino al sì nella revisione finale del libro mastro.')}</span>` : '')
        : `<span class="err">${tr('In attesa del sì nella revisione finale del libro mastro: «Esporta» è spento (sezione 6 del piano).')}</span>`}</div>`;
  const stato = `${PA.errore ? `<p class="err" role="alert">${esc(PA.errore)}</p>` : ''}${PA.msg ? `<p class="meta" role="status" style="color:var(--testo)">${esc(PA.msg)}</p>` : ''}${PA.lavoro ? `<p class="caricamento">${tr('Chiedo l’elenco allo sportello…')}</p>` : ''}`;
  const E = PA.eventi;
  const scelta = !E ? '' : !E.length ? `<p class="meta">${tr('Nessun evento pubblicato.')}</p>` : `<p class="etich">${tr('Gli eventi del guasto')} · ${PA.sel.length}/${ASSISTENZA_MAX}</p>
    <div class="menu-lista pa-scelta">${E.map(ev => `<button class="riga-int" data-pae="${esc(ev.id)}" aria-pressed="${PA.sel.includes(ev.id)}"><span class="casella" aria-hidden="true"></span><div><span class="t">${esc(ev.titolo)}</span><span class="meta">${esc(quandoEv(ev))} · ${esc(ev.luogo)}</span></div></button>`).join('')}</div>
    <label class="etich" for="pa-nomi">${tr('Le persone che compaiono in questi eventi')} <span class="fac">${tr('facoltativo')}</span></label>
    <div class="campo"><textarea id="pa-nomi" data-pa="nomi" maxlength="1200" placeholder="${esc(tr('Una persona per riga; più forme della stessa persona separate da /'))}">${esc(PA.nomi)}</textarea></div>
    <span class="meta">${tr('I nomi non partono: servono solo a dire «contiene Persona_1».')}</span>
    <div class="tasti"><button class="tasto pri" data-az="pa-anteprima" ${PA.sel.length ? '' : 'disabled'}>${tr('Prepara l’anteprima')}</button></div>`;
  const parte = A ? A.copia.eventi.length : 0;
  const anteprima = !A ? '' : `${A.righe.filter(r => !r.parte).map(r => `<p class="meta">${tr('«{t}» non parte: nell’archivio ci sono {q} eventi con la stessa città, lo stesso mese e lo stesso strato, ne servono almeno {n}.',{t:esc(r.ev.titolo), q:r.quanti, n:ASSISTENZA_SOGLIA})}</p>`).join('')}
    ${parte ? `<p class="etich">${tr('Ciò che parte, esattamente')}</p><pre class="pa-anteprima">${esc(A.testo)}</pre>`
      : `<p class="err" role="status">${tr('Nessun evento si può rendere irriconoscibile: la copia non si fa (§ 2.6). Descrivi il guasto a parole.')}</p>`}
    <p class="etich">${tr('Tabella di corrispondenza: resta qui, non parte e non si salva')}</p>
    <div class="imp-righe">${A.righe.filter(r => r.parte).map(r => `<div>${esc(r.nome)} = ${esc(r.ev.titolo)} · ${esc(quandoEv(r.ev))}</div>`).join('')}${A.persone.map((f, k) => `<div>Persona_${k+1} = ${esc(f.map(x => x.forma).join(' / '))}</div>`).join('')}</div>
    <div class="tasti"><button class="tasto pri" data-az="pa-esporta" ${parte && acceso ? '' : 'disabled'}>${tr('Esporta la copia')}</button></div>
    <p class="meta">${tr('Il file resta su questo dispositivo: decidi tu se darlo all’assistente. Le schermate e i messaggi degli utenti non si girano: se ne descrive il problema.')}</p>`;
  return foglio('forte alto', testa, `${spiega}${stato}${scelta}${anteprima}`);
}
function esportaAssistenza(){
  const A = PA.anteprima; if(!A || !A.copia.eventi.length || !assistenzaAccesa()) return;
  const nome = 'assistenza-'+oggi()+'.json';
  scaricaBlob(new Blob([A.testo], {type:'application/json'}), nome);
  registra('assistenza-esporta', {n:A.copia.eventi.length}); PA.msg = tr('Copia esportata: {f}.',{f:nome}); disegnaFoglio();
}

DIRITTI.push({
  voce:() => `<button class="menu-r" data-az="pa">${icoEsporta}<div><span class="t">${tr('Esporta per assistenza')}</span><span class="meta">${assistenzaAccesa() ? tr('Una copia senza nomi per capire un guasto, da 1 a 10 eventi') : tr('In attesa del sì nella revisione finale del libro mastro')}</span></div>${freccia}</button>`,
  click(t){ const id = t.dataset.pae; if(id==null) return false;
    const i = PA.sel.indexOf(id); if(i>=0) PA.sel.splice(i, 1); else if(PA.sel.length < ASSISTENZA_MAX) PA.sel.push(id); else PA.msg = tr('Al massimo {n} eventi.',{n:ASSISTENZA_MAX});
    PA.anteprima = null; disegnaFoglio(); return true; },
  azione(az){
    switch(az){
      case 'pa': apriAssistenza(); return true;
      case 'pa-anteprima': if(PA.sel.length){ PA.msg = ''; preparaAssistenza(); disegnaFoglio(); } return true;
      case 'pa-esporta': esportaAssistenza(); return true;
    }
    return false;
  },
  input(el){ if(el.dataset.pa!=='nomi') return false; PA.nomi = el.value; return true; }   /* l'anteprima cambia solo con «Prepara l'anteprima»: è sempre il file che parte */
});
Object.assign(FOGLI_RED, {pa:fPa});

/* ======================= Segnalazioni: lettura e righe dei registri (T-052) =======================
   Libro mastro, § 7.5, misura 3, regole 6-8; cap. 25 (registro delle segnalazioni); cap. 26 (registro delle richieste);
   § 18.5 (le persone nei registri con il codice P dell'anagrafica); § 3.13 (rimozione entro 48 ore). Documento:
   docs/segnalazioni.md.

   L'app della redazione chiede allo sportello delle segnalazioni, con il pacchetto firmato, le buste depositate dal
   modulo «Segnala» (sportelli/segnalazioni.js, porta firmata), le apre sul dispositivo con la parte segreta di cifratura
   (CHIAVI.segretoSegnalazione) e le mostra. Le segnalazioni aperte vivono soltanto nella pagina: sul dispositivo non si
   scrive nulla.

   Per ognuna prepara, da copiare e incollare nel file del registro tenuto a mano (decisioni del 26/11/2026, dubbio 7):
   - la riga del registro delle segnalazioni (cap. 25), con il codice S scritto dalla Redazione (la numerazione è una
     sola anche per le segnalazioni arrivate per posta, dalla casella o dagli avvisi del fornitore) e il codice P
     dell'anagrafica al posto della persona: i recapiti non entrano mai nella riga;
   - se chiede di togliere il nome di chi scrive («Di chi è il nome?»: «Il mio»), anche la riga del registro delle
     richieste (cap. 26), con la scadenza delle 48 ore dall'arrivo, e il passaggio a «Togli questo nome ovunque» con il
     codice R, che annota la richiesta nel registro delle richieste di rimozione delle Misure.
   Il recapito si copia a parte, per l'anagrafica e per la conferma dalla casella per gli utenti.
   «Presa in carico» (due tocchi) toglie la segnalazione dallo sportello, che non ne tiene traccia (dubbio 8), e conta
   la segnalazione nelle Misure, nel giorno dell'arrivo. */
const SG = {lista:null, lavoro:false, errore:'', msg:'', aperta:null, campi:{}, conferma:false, copiata:''};
const MOTIVI_REG = {dati:'Dati errati', annullato:'Annullato o rinviato', nome:'Nome o dato personale da togliere', illecito:'Contenuto ritenuto illecito', altro:'Altro'};
const CHI_SEGNALA = ['Utente', 'Organizzatore', 'Persona nominata', 'Fornitore', 'Altro'];
const CANALE_SPORTELLO = 'Modulo con lo sportello';
/* le colonne, nell'ordine del cap. 25 (foglio «Segnalazioni») tra le colonne comuni del § 18.4 */
const COL_SEGN = ['Codice', 'Data di registrazione', 'Funzione che annota', 'Data e ora di ricevimento', 'Canale', 'Chi segnala', 'Segnalante', 'Evento', 'Motivo', 'Descrizione',
  'Dichiarazione di buona fede', 'Conferma di ricevimento', 'Richiesta sui propri dati', 'Errore su data, ora o luogo', 'Verifica', 'Esito e data della decisione', 'Esito al segnalante',
  'Motivazione', 'Esclusione collegata', 'Riesame chiesto', 'Pericolo per la vita o la sicurezza', 'Giorni fino alla decisione',
  'Rif. libro mastro', 'Collegamenti', 'Stato', 'Contestazione in corso', 'Scadenza della conservazione', 'Da cancellare al riesame', 'Rettifiche', 'Note'];
/* le colonne del cap. 26 (foglio «Richieste»), con le colonne comuni */
const COL_RICH = ['Codice', 'Data di registrazione', 'Funzione che annota', 'Data e ora di ricevimento', 'Canale', 'Richiedente', 'Per conto di', 'Diritto esercitato', 'Dati o eventi interessati',
  'Verifica dell’identità', 'Scadenza delle 48 ore', 'Esecuzione', 'Da ripetere in un ripristino', 'Scadenza di un mese', 'Proroga', 'Data della risposta; nel termine', 'Esito',
  'Rif. libro mastro', 'Collegamenti', 'Stato', 'Contestazione in corso', 'Scadenza della conservazione', 'Da cancellare al riesame', 'Rettifiche', 'Note'];
fogliPb.push('rd-segn', 'rd-segn-una');

/* date come nei registri (§ 18.4): gg/mm/aaaa e, se c'è, l'ora */
const dataReg = (d, conOra) => { d = new Date(d); return isNaN(d) ? '' : pad2(d.getDate())+'/'+pad2(d.getMonth()+1)+'/'+d.getFullYear()+(conOra ? ' '+pad2(d.getHours())+':'+pad2(d.getMinutes()) : ''); };
const unMesePiu = iso => { const d = new Date(iso); d.setMonth(d.getMonth()+1); return d; };
/* una cella che si incolla: niente tabulazioni né a capo, che spezzerebbero la riga */
const cellaReg = x => String(x==null ? '' : x).replace(/[\t\r\n]+/g, ' ').trim();
const nomeMio = x => x && x.s && x.s.motivo==='nome' && x.s.chi==='mio';
const sgUna = () => (SG.lista || []).find(x => x.nome===SG.aperta) || null;
const campiSg = x => SG.campi[x.nome] || (SG.campi[x.nome] = {s:'', p:'', chiSegnala:nomeMio(x) ? 'Persona nominata' : 'Utente', desc:x.s ? x.s.descrizione : '', r:''});

/* ---------- Lo sportello: la porta firmata ---------- */
async function chiediSg(contenuto){
  const s = await CHIAVI.stato(); if(!s.ci_sono) throw Object.assign(new Error('chiavi'), {motivo:'chiavi'});
  const p = await MODULI.pacchetto.forma(contenuto, {firma:CHIAVI.firma, dispositivo:{nome:s.dispositivo, impronta:s.firma.impronta}});
  const r = await chiediSegnalazioni(JSON.stringify(p));
  if(r.stato!==200 || !r.corpo || r.corpo.esito!=='fatto') throw Object.assign(new Error('sportello'), {motivo:(r.corpo && r.corpo.motivo) || 'guasto'});
  return r.corpo;
}
const sgDisponibile = () => !!(segnVero() || sportelloSegnProva());
async function caricaSg(){
  if(SG.lavoro) return;
  SG.lavoro = true; SG.errore = ''; disegnaFoglio();
  try{
    const r = await chiediSg({operazione:'segnalazioni'}), lista = [];
    for(const x of r.segnalazioni || []){
      let s = null; try{ s = await MODULI.segnalazione.apri(x.busta, CHIAVI.segretoSegnalazione); }catch(e){ s = null; }
      lista.push({nome:x.nome, arrivo:x.arrivo, s});
    }
    SG.lista = lista;
  }catch(e){
    SG.errore = e.motivo==='chiavi' ? tr('Servono le chiavi di questo dispositivo: crea le chiavi o riprendile dalla copia di riserva (Strumenti della redazione → Chiavi).')
      : e.motivo==='sconosciuto' ? tr('Lo sportello non conosce ancora questo dispositivo: consegna le chiavi (Pubblicazione → «Consegna le chiavi allo sportello di prova»).')
      : e.motivo==='rete' ? tr('Lo sportello non risponde: controlla la connessione e riprova.') : tr('Lo sportello non ha consegnato le segnalazioni ({m}).',{m:e.motivo||'guasto'});
  }
  SG.lavoro = false; if(['rd-segn', 'rd-segn-una'].includes(st.foglio)) disegnaFoglio();
}
async function presaSg(x){
  if(SG.lavoro) return;
  SG.lavoro = true; SG.errore = ''; disegnaFoglio();
  try{
    await chiediSg({operazione:'presa', nomi:[x.nome]});
    const m = mz(), g = ymd(new Date(x.arrivo)); m.segnalazioni[g] = (m.segnalazioni[g]||0)+1; mzSalva();   // le segnalazioni nelle Misure, nel giorno dell'arrivo
    SG.lista = SG.lista.filter(y => y!==x); delete SG.campi[x.nome]; SG.aperta = null; SG.conferma = false;
    SG.msg = tr('Segnalazione presa in carico e tolta dallo sportello. Contata nelle Misure.');
    SG.lavoro = false; apri('rd-segn'); return;
  }catch(e){ SG.errore = tr('Lo sportello non ha tolto la segnalazione ({m}): riprova.',{m:e.motivo||'guasto'}); }
  SG.lavoro = false; disegnaFoglio();
}

/* ---------- Le righe dei registri ---------- */
function rigaSegnalazione(x){
  const s = x.s, c = campiSg(x), mio = nomeMio(x);
  const v = {'Codice':c.s, 'Data di registrazione':dataReg(new Date()), 'Funzione che annota':'Relazioni con gli utenti', 'Data e ora di ricevimento':dataReg(x.arrivo, true), 'Canale':CANALE_SPORTELLO,
    'Chi segnala':c.chiSegnala, 'Segnalante':c.p, 'Evento':s.evento.id, 'Motivo':MOTIVI_REG[s.motivo], 'Descrizione':c.desc, 'Dichiarazione di buona fede':s.motivo==='illecito' ? (s.buonaFede ? 'Sì' : 'No') : '',
    'Richiesta sui propri dati':mio ? c.r : '', 'Rif. libro mastro':'§ 7.5, misura 3', 'Collegamenti':mio ? c.r : '', 'Stato':'Aperta', 'Contestazione in corso':'No'};
  return COL_SEGN.map(k => cellaReg(v[k])).join('\t');
}
function rigaRichiesta(x){
  const c = campiSg(x);
  const v = {'Codice':c.r, 'Data di registrazione':dataReg(new Date()), 'Funzione che annota':'Referente privacy', 'Data e ora di ricevimento':dataReg(x.arrivo, true), 'Canale':CANALE_SPORTELLO,
    'Richiedente':c.p, 'Per conto di':'Sé stesso', 'Diritto esercitato':'Cancellazione (art. 17)', 'Dati o eventi interessati':x.s.evento.id, 'Scadenza delle 48 ore':dataReg(scadenzaTn(x.arrivo), true),
    'Scadenza di un mese':dataReg(unMesePiu(x.arrivo)), 'Rif. libro mastro':'§ 3.13; § 7.5, misura 3', 'Collegamenti':[c.s, c.p].filter(Boolean).join(' '), 'Stato':'Aperta', 'Contestazione in corso':'No'};
  return COL_RICH.map(k => cellaReg(v[k])).join('\t');
}

/* ---------- Le schermate ---------- */
function fSg(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Segnalazioni')}</h2><p class="meta">${tr('Arrivate con il modulo «Segnala» della scheda degli eventi')}</p></div>${chiudiBtn()}</div>`;
  if(!sgDisponibile()) return foglio('forte alto', testa, `<p class="meta">${tr('Lo sportello delle segnalazioni non è ancora allacciato: per ora le segnalazioni arrivano per posta alla casella per gli utenti.')}</p>`);
  const L = SG.lista;
  const riga = x => `<button class="riga-int" data-az="sg-apri" data-n="${esc(x.nome)}"><div><span class="t">${x.s ? esc(x.s.evento.titolo || x.s.evento.id) : tr('Segnalazione che non si apre')}</span>
    <span class="meta">${esc(quandoPb(x.arrivo))}${x.s ? ' · '+esc(MOTIVI_REG[x.s.motivo]) : ''}${nomeMio(x) ? ' · <strong>'+esc(tr('il suo nome: entro il {q}',{q:quandoPb(scadenzaTn(x.arrivo).toISOString())}))+'</strong>' : ''}</span></div>${freccia}</button>`;
  const corpo = `${SG.msg ? `<p class="meta" role="status" style="color:var(--testo)">${esc(SG.msg)}</p>` : ''}${SG.errore ? `<p class="err" role="alert">${esc(SG.errore)}</p>` : ''}
    ${SG.lavoro ? `<p class="caricamento">${tr('Chiedo le segnalazioni allo sportello…')}</p>` : ''}
    ${L ? (L.length ? `<div class="menu-lista">${L.map(riga).join('')}</div>` : `<p class="meta">${tr('Nessuna segnalazione in attesa.')}</p>`) : ''}
    <div class="tasti"><button class="tasto sec" data-az="sg-carica" ${SG.lavoro ? 'disabled' : ''}>${tr('Chiedi di nuovo allo sportello')}</button></div>
    <p class="meta">${tr('Le segnalazioni si aprono su questo dispositivo e restano soltanto in questa pagina. Il recapito di chi scrive va nell’anagrafica (§ 18.5), mai nei registri.')}</p>`;
  return foglio('forte alto', testa, corpo);
}
function fSgUna(){
  const x = sgUna(); if(!x){ st.foglio = 'rd-segn'; return fSg(); }
  const testa = `<div class="riga-titolo"><div><h2>${tr('Segnalazione')}</h2><p class="meta">${tr('Arrivata il {q}',{q:esc(quandoPb(x.arrivo))})}</p></div>${chiudiBtn()}</div>`;
  const indietro = `<button class="link" data-az="sg-indietro">${frecciaSx} ${tr('Tutte le segnalazioni')}</button>`;
  if(!x.s) return foglio('forte alto', testa, `${indietro}<p class="err">${tr('Questa segnalazione non si apre con le chiavi di questo dispositivo: è rovinata o è stata chiusa per altre chiavi.')}</p>
    ${presaHtml()}`);
  const s = x.s, c = campiSg(x), mio = nomeMio(x);
  const dato = (t, v) => v ? `<div class="stack-s"><span class="etich">${t}</span><span style="white-space:pre-wrap;color:var(--testo)">${esc(v)}</span></div>` : '';
  const campo = (id, k, t, ph, aiuto) => `<div class="stack-s"><label class="etich" for="sg-${id}">${t}</label><div class="campo"><input id="sg-${id}" data-sg="${k}" maxlength="12" autocomplete="off" value="${esc(c[k])}" placeholder="${esc(ph)}"></div>${aiuto ? `<span class="meta">${aiuto}</span>` : ''}</div>`;
  const recapito = [s.nome, s.email].filter(Boolean).join(' · ');
  const corpo = `${indietro}${SG.errore ? `<p class="err" role="alert">${esc(SG.errore)}</p>` : ''}
    ${mio ? `<div class="red-riquadro" role="note"><strong>${tr('Chiede di togliere il suo nome: entro il {q}',{q:esc(quandoPb(scadenzaTn(x.arrivo).toISOString()))})}</strong>
      <span class="meta">${tr('È anche una richiesta sui propri dati: una riga anche nel registro delle richieste (cap. 26) e la rimozione con «Togli questo nome ovunque» (§ 3.13).')}</span></div>` : ''}
    ${dato(tr('Evento'), (s.evento.titolo ? s.evento.titolo+'\n' : '')+s.evento.id)}
    ${dato(tr('Motivo'), MOTIVI_REG[s.motivo])}
    ${s.motivo==='nome' ? dato(tr('Di chi è il nome'), s.chi==='mio' ? tr('Il suo') : tr('Di un’altra persona')) : ''}
    ${s.motivo==='illecito' ? dato(tr('Dichiarazione di buona fede'), s.buonaFede ? tr('Sì') : tr('No')) : ''}
    ${dato(tr('Descrizione'), s.descrizione || '—')}
    ${recapito ? `<div class="stack-s"><span class="etich">${tr('Recapito')}</span><span style="color:var(--testo)">${esc(recapito)}</span>
      <span class="meta">${tr('Per l’anagrafica (codice P) e per la conferma dalla casella per gli utenti: non entra nei registri.')}</span>
      <div class="tasti"><button class="tasto sec" data-az="sg-copia" data-che="recapito">${SG.copiata==='recapito' ? tr('Copiato') : tr('Copia il recapito')}</button></div></div>` : `<p class="meta">${tr('Nessun recapito: niente conferma né esito da mandare.')}</p>`}
    <p class="etich">${tr('Per il registro')}</p>
    <div class="due">${campo('s', 's', tr('Codice S'), 'S-0001', '')}${campo('p', 'p', tr('Codice P'), 'P-0001', recapito ? '' : tr('Solo se ha lasciato un recapito'))}</div>
    <div class="stack-s"><label class="etich" for="sg-chi">${tr('Chi segnala')}</label><div class="campo"><select id="sg-chi" data-sg="chiSegnala">${CHI_SEGNALA.map(v => `<option ${c.chiSegnala===v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></div></div>
    <div class="stack-s"><label class="etich" for="sg-desc">${tr('Descrizione per il registro')}</label><div class="campo"><textarea id="sg-desc" data-sg="desc" maxlength="2000">${esc(c.desc)}</textarea></div>
      <span class="meta">${tr('Una sintesi, senza dati di altre persone che non servono (cap. 25).')}</span></div>
    ${mio ? campo('r', 'r', tr('Codice R'), CODICE_RICHIESTA, tr('Il codice della voce nel registro delle richieste (cap. 26).')) : ''}
    <div class="tasti"><button class="tasto pri" data-az="sg-copia" data-che="segnalazione">${SG.copiata==='segnalazione' ? tr('Copiata') : tr('Copia la riga del registro delle segnalazioni')}</button></div>
    ${mio ? `<div class="tasti"><button class="tasto sec" data-az="sg-copia" data-che="richiesta">${SG.copiata==='richiesta' ? tr('Copiata') : tr('Copia la riga del registro delle richieste')}</button></div>
      <div class="tasti"><button class="tasto sec" data-az="sg-togli">${tr('Togli questo nome ovunque')}</button></div>` : ''}
    <details class="meta"><summary>${tr('Le colonne delle righe')}</summary><p>${esc(COL_SEGN.join(' · '))}</p>${mio ? `<p>${esc(COL_RICH.join(' · '))}</p>` : ''}</details>
    ${presaHtml()}`;
  return foglio('forte alto', testa, corpo);
}
const presaHtml = () => `<div class="tasti"><button class="tasto pericolo pieno" data-az="sg-presa" ${SG.lavoro ? 'disabled' : ''}>${SG.conferma ? tr('Tocca ancora: la segnalazione esce dallo sportello') : tr('Presa in carico')}</button></div>
  <p class="meta">${tr('Prima copia la riga e il recapito: dopo, la segnalazione non si può più leggere.')}</p>`;
Object.assign(FOGLI_RED, {'rd-segn':fSg, 'rd-segn-una':fSgUna});

/* ---------- Le interazioni ---------- */
function azioneSg(az, t){
  switch(az){
    case 'segnalazioni': Object.assign(SG, {aperta:null, msg:'', errore:'', conferma:false, copiata:''}); apri('rd-segn'); if(sgDisponibile()) caricaSg(); return true;
    case 'sg-carica': SG.msg = ''; caricaSg(); return true;
    case 'sg-apri': SG.aperta = t.dataset.n; SG.conferma = false; SG.copiata = ''; SG.errore = ''; SG.msg = ''; apri('rd-segn-una'); return true;
    case 'sg-indietro': SG.aperta = null; SG.conferma = false; apri('rd-segn'); return true;
    case 'sg-copia': {
      const x = sgUna(); if(!x || !x.s) return true;
      const che = t.dataset.che, testo = che==='recapito' ? [x.s.nome, x.s.email].filter(Boolean).join(' <')+(x.s.nome && x.s.email ? '>' : '') : che==='richiesta' ? rigaRichiesta(x) : rigaSegnalazione(x);
      copiaTesto(testo).then(ok => { SG.copiata = ok ? che : ''; if(!ok) SG.errore = tr('Copia non riuscita: riprova.'); if(st.foglio==='rd-segn-una') disegnaFoglio(); });
      return true; }
    case 'sg-togli': {
      const x = sgUna(); if(!x || !x.s) return true;
      const c = campiSg(x); apriTn('archivio');
      TN.rich = 'nuova'; TN.nuova = {ric:dtLocal(new Date(x.arrivo)), r:c.r};
      TN.daSegn = tr('Dalla segnalazione {s} sull’evento «{t}» ({id})',{s:c.s || tr('senza codice S'), t:x.s.evento.titolo, id:x.s.evento.id});
      disegnaFoglio(); return true; }
    case 'sg-presa': {
      const x = sgUna(); if(!x) return true;
      if(!SG.conferma){ SG.conferma = true; disegnaFoglio(); return true; }
      presaSg(x); return true; }
  }
  return false;
}
function inputSg(el){
  const k = el.dataset.sg; if(!k) return false;
  const x = sgUna(); if(!x) return true;
  campiSg(x)[k] = el.value; SG.copiata = '';
  return true;
}


/* ======================= Interazioni ======================= */
$('app').addEventListener('click', ev => {
  const t = ev.target.closest('button,[data-az]');
  if(!t || t.disabled) return;
  if(t.tagName==='A') return;
  if(t.closest('.sez-temi') && clickTemi(t)) return;
  if(t.closest('.sez-agora,.sez-progetti,.sez-proposta')) return;
  if(clickRed(t)) return;   /* strumenti della Redazione (sorgenti/redazione/) */
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
    /* pre: «f» per il modulo Off-Grid; nell'app della redazione anche «a» per il modulo degli eventi */
    const pre = sugg.dove==='a' ? 'a' : 'f', r = sugg.lista[i], f = pre==='a' ? st.aform : st.form; if(!r || !f) return;
    f.indirizzo = testoRisultato(r); f.addrFull = f.indirizzo; f.precision = r.precision||'exact'; f.hn = r.hn||''; f.pos = {lat:r.lat, lng:r.lng}; if(f.err) f.err.indirizzo = 0;
    const inp = $(pre+'-indirizzo'); if(inp) inp.value = f.indirizzo;
    const box = $(pre+'-sugg'); if(box) box.innerHTML = ''; sugg.lista = [];
    const pb = $(pre+'-punto'); if(pb) pb.innerHTML = boxPunto(f);
    return; }
  if(d.copiaIndirizzo){ copiaIndirizzo(d.copiaIndirizzo); return; }
  if(d.giorno){ if(!st.da || st.a){ st.da = d.giorno; st.a = null; } else if(d.giorno < st.da){ st.da = d.giorno; } else { st.a = d.giorno; } disegnaFoglio(); return; }
  if(d.vista){ st.cal.vista = d.vista; disegnaFoglio(); disegnaPins(); posizioni(); if(modoGiornata()) requestAnimationFrame(() => inquadraTutti(giornata(st.cal.giorno).vive)); return; }
  if(d.giornoCal){ st.cal.giorno = d.giornoCal; st.cal.vista = 'giornata'; const g = dIso(d.giornoCal); st.cal.y = g.getFullYear(); st.cal.m = g.getMonth(); disegnaFoglio(); disegnaPins(); posizioni(); requestAnimationFrame(() => inquadraTutti(giornata(st.cal.giorno).vive)); return; }
  if(d.mese){ const [y,m] = d.mese.split('-').map(Number); st.cal.y = y; st.cal.m = m; disegnaFoglio(); return; }
  if(d.mezzo){ st.cal.mezzo = d.mezzo; MEM.scrivi('dl_mezzo', d.mezzo); disegnaFoglio(); disegnaPins(); return; }
  if(d.giornata){ apriCalendario('giornata', d.giornata); return; }
  if(d.aggiungi){ const [g,o] = d.aggiungi.split('|'); apriForm(null, o ? {giorno:g, inizio:o, fine:autoFine(o)} : {giorno:g}); return; }
  if(d.pdf){ st.pdf.tolti.has(d.pdf) ? st.pdf.tolti.delete(d.pdf) : st.pdf.tolti.add(d.pdf); disegnaFoglio(); return; }
  if(d.modifica){ const r = rawById(d.modifica); if(r) apriForm(r); return; }
  if(d.elimina){ st.conferma = {id:d.elimina}; st.foglio = 'conferma'; disegnaFoglio(); return; }
  if(d.eliminaOk){ elimina(st.conferma.id, d.eliminaOk); return; }
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
    case 'sblocca': { if(st.sblocco==='lavoro') break;
      const testo = $('pw') ? $('pw').value : ''; st.sblocco = 'lavoro'; mostraSblocco();
      sbloccaNascosto(testo).then(r => {
        if(r.esito!=='fatto'){ st.sblocco = r.esito; mostraSblocco(); return; }
        st.sblocco = null; st.nascostiOn = true; selezionaEv(r.id);
      }, () => { st.sblocco = 'manca'; mostraSblocco(); }); break; }
    case 'togli-nascosto': if(st.togliNasc===d.id){ st.togliNasc = null; togliNascosto(d.id); }
      else { st.togliNasc = d.id; disegnaFoglio(); } break;
    case 'segnala': apriSegnala(d.id); break;
    case 'segnala-invia': inviaSegnalazione(); break;
    case 'citta': apri('citta'); break;
    case 'impostazioni': st.sel = null; st.msgAdmin = null; apri('impostazioni'); break;
    case 'indietro-impostazioni': apri('impostazioni'); break;
    case 'semplice': st.semplice = !st.semplice; MEM.scrivi('dl_semplice', st.semplice ? '1' : '0'); $('app').classList.toggle('semplice', st.semplice); disegnaFoglio(); tutto(); break;
    case 'guida': chiudi(); vaiSezione('mappa'); st.guida = 0; disegnaGuida(); posizioni(); break;
    case 'guida-avanti': st.guida++; disegnaGuida(); break;
    case 'guida-salta': st.guida = null; disegnaGuida(); MEM.scrivi('dl_guida','1'); posizioni(); mostraNovita(); break;
    case 'senza-rete': apri('senzarete'); break;
    case 'installa': if(invitoInstalla){ const inv = invitoInstalla; invitoInstalla = null; try{ inv.prompt(); }catch(e){} disegnaFoglio(); } break;
    case 'novita-ok': novitaVista(false); break;
    case 'novita-leggi': novitaVista(true); break;
    case 'aiuto-og': apriForm(null, {aiuto:true}); break;
    default: azioneRed(d.az, t);
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
/* campi: aggiornano lo stato senza ridisegnare il foglio (il cursore resta dov'è) */
$('foglio-slot').addEventListener('input', ev => {
  const el = ev.target;
  if(el.id==='tz-q'){ TM.q = el.value; const d = $('tz-lente'); if(d) d.innerHTML = lenteDentro(); return; }
  if(el.id==='q'){ st.q = el.value; $('risultati').innerHTML = risultatiEventi(); chiediSuggerimenti(el.value, 'cerca', 'risultati-luoghi'); return; }
  /* il modulo «Segnala» (T-050): il messaggio di posta si tiene sempre al passo con ciò che si scrive */
  if(el.dataset.segn && st.segn){ st.segn[el.dataset.segn] = el.value; const a = $('s-posta'); if(a) a.href = mailtoSegn(st.segn); return; }
  if(inputRed(el)) return;
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
  /* «Segnala»: motivo, «Di chi è il nome?» e buona fede ridisegnano il modulo; il fuoco torna sulla scelta fatta */
  if(el.dataset.segnScelta && st.segn){
    const s = st.segn, k = el.dataset.segnScelta;
    if(k==='buona') s.buona = el.checked;
    else { s[k] = el.value; if(k==='motivo' && el.value!=='nome') s.chi = ''; if(s.err) s.err[k] = 0; }
    disegnaFoglio();
    const x = document.querySelector(k==='buona' ? '#foglio-slot [data-segn-scelta="buona"]' : `#foglio-slot [data-segn-scelta="${k}"][value="${el.value}"]`); if(x) x.focus();
    return;
  }
  if(cambioRed(el)) return;
  if(!st.form) return;
  const c = el.dataset.campo;
  if(c==='rep' || c==='giorno' || c==='fino'){ st.form[c] = el.value; if(c==='giorno' && el.value && (!st.form.fino || st.form.fino < el.value)) st.form.fino = piuMesi(el.value,3); disegnaFoglio(); }
});
/* «Prepara il messaggio di posta» è un collegamento vero (mailto): se il modulo non è completo non si apre; se lo è,
   parte il messaggio aggiornato e il modulo dice che cosa succede, senza tenere nulla di ciò che si è scritto */
$('foglio-slot').addEventListener('click', ev => {
  const a = ev.target.closest && ev.target.closest('[data-segn-posta]'); if(!a || !st.segn) return;
  const s = st.segn; s.err = erroriSegn(s, true);
  if(Object.keys(s.err).length){ ev.preventDefault(); disegnaFoglio(); fuocoErrore(); return; }
  a.href = mailtoSegn(s);
  setTimeout(() => { if(st.segn===s){ st.segn = {id:s.id, titolo:s.titolo, fase:'posta', err:{}}; if(st.foglio==='segnala') disegnaFoglio(); } }, 0);
});
$('foglio-slot').addEventListener('keydown', ev => {
  if(ev.key!=='Enter') return;
  if(ev.target.id==='tz-nome'){ ev.preventDefault(); const b = document.querySelector('[data-tz="salva-ok"]'); if(b) b.click(); return; }
  if(ev.target.id==='pw'){ ev.preventDefault(); document.querySelector('[data-az="sblocca"]').click(); }
  else if(ev.target.id==='q'){ ev.preventDefault(); clearTimeout(sugg.t); cercaInvio(); }
  else if(ev.target.id==='f-indirizzo' || ev.target.id==='a-indirizzo'){ ev.preventDefault(); const b = document.querySelector('#'+ev.target.id.charAt(0)+'-sugg [data-si]'); if(b) b.click(); }
});
document.addEventListener('keydown', ev => { if(ev.key==='Escape'){
  if(st.pieno && !st.foglio){ $('btnPieno').click(); return; }
  if(st.guida!=null){ st.guida = null; disegnaGuida(); } else if(st.posa){ finePosa(false); } else if(st.foglio) chiudi(); } });
window.addEventListener('resize', () => { if(map) map.resize(); });

/* ======================= La copia dell'app per l'uso senza rete (T-029) =======================
   Il service worker (sorgenti/sw.js) conserva la copia dell'app e la consegna anche senza rete. Prima di avviarlo si legge
   il piccolo file d'emergenza: se dice di scartare questa versione, il service worker non parte e quello che c'è si toglie.
   Il service worker si avvia solo dopo aver letto davvero il file: se la lettura non riesce (senza rete, o perché la pagina
   si sta ricaricando proprio per l'interruttore d'emergenza) non si fa nulla, e quello che c'era resta com'è. */
/* Una versione nuova si prepara in silenzio e aspetta. Entra in uso quando l'app viene chiusa e riaperta; oppure prima, se
   c'è un momento in cui non disturba: l'app non è in vista da qualche secondo e la persona non ha nulla di aperto (un
   foglio, un modulo, la guida). Allora la pagina dice alla versione nuova di entrare in uso e si ricarica. Mentre la
   persona usa l'app non cambia nulla. */
let registrazione = null, paginaInUscita = false;
/* Una pagina che si sta chiudendo o che sta andando altrove diventa «non in vista» per un attimo: non è il momento di
   ricaricarla. Per questo si aspetta qualche secondo e si ricontrolla: se la pagina se n'è andata, non succede nulla. */
window.addEventListener('pagehide', () => { paginaInUscita = true; });
window.addEventListener('pageshow', () => { paginaInUscita = false; });
const versioneInAttesa = () => registrazione && registrazione.waiting && navigator.serviceWorker.controller ? registrazione.waiting : null;
const nonDisturba = () => !paginaInUscita && document.visibilityState==='hidden' && !st.foglio && !st.form && !st.aform && !st.posa && st.guida==null && st.sezione==='mappa';
function passaAllaVersioneNuova(){
  if(versioneInAttesa() && nonDisturba()) setTimeout(() => { const w = versioneInAttesa(); if(w && nonDisturba()){ try{ w.postMessage('attiva'); }catch(e){} } }, 3000);
}
/* Interruttore d'emergenza, dal lato della pagina: il service worker fa lo stesso da sé (sorgenti/sw.js), ma basta che ci
   riesca uno dei due. Si toglie il service worker, se c'è ancora, e si cancella la copia dei file di questa app. Se la
   pagina è ancora servita dal service worker, si ricarica dalla rete: una volta sola, perché una pagina già ricaricata
   non si ricarica di nuovo. Dopo, il service worker non c'è più. */
async function scartaCopia(){
  try{ const r = await navigator.serviceWorker.getRegistration(); if(r) await r.unregister(); }catch(e){}
  try{
    const c = MEM.file ? await MEM.file.open('dl_app') : null, base = new URL('./', location.href).href;
    if(c) for(const k of await c.keys()) if(k.url.startsWith(base)) await c.delete(k);
  }catch(e){}
  if(!navigator.serviceWorker.controller) return;
  let ricaricata = false;
  try{ const n = performance.getEntriesByType('navigation')[0]; ricaricata = n ? n.type==='reload' : !!(performance.navigation && performance.navigation.type===1); }catch(e){}
  if(!ricaricata) location.reload();
}
/* Lo stato della copia, dalla registrazione del service worker e dai suoi messaggi (riga in «Senza connessione», app5.js).
   Se c'è un service worker attivo l'app si apre senza rete, anche mentre si prepara una versione più nuova. */
function leggiStatoCopia(){
  const r = registrazione; if(!r) return;
  if(r.active) Object.assign(COPIA_STATO, {stato:'pronta'});
  else if((r.installing || r.waiting) && COPIA_STATO.stato!=='errore') COPIA_STATO.stato = 'preparazione';
  if(st.foglio==='senzarete') disegnaFoglio();
}
function seguiRegistrazione(r){
  if(!r || registrazione===r) return;
  registrazione = r;
  const segui = w => { if(w) w.addEventListener('statechange', () => {
    if(w.state==='redundant' && !r.active && COPIA_STATO.stato!=='errore') Object.assign(COPIA_STATO, {stato:'errore', file:'', motivo:'rete'});
    leggiStatoCopia(); }); };
  segui(r.installing); r.addEventListener('updatefound', () => { segui(r.installing); leggiStatoCopia(); });
  leggiStatoCopia();
}
function avviaCopia(){
  if(!('serviceWorker' in navigator) || !window.isSecureContext || !VERSIONE) return;
  navigator.serviceWorker.addEventListener('message', ev => {
    const d = ev.data; if(!d || d.copia!==true) return;
    const attivo = registrazione && registrazione.active;
    if(d.stato==='preparazione' || d.stato==='installata'){ if(!attivo) Object.assign(COPIA_STATO, {stato:'preparazione', fatti:d.fatti, totale:d.totale}); }
    else if(d.stato==='pronta') COPIA_STATO.stato = 'pronta';
    else if(d.stato==='errore' && !attivo) Object.assign(COPIA_STATO, {stato:'errore', file:String(d.file||''), motivo:String(d.motivo||''), n:d.n});
    if(st.foglio==='senzarete') disegnaFoglio();
  });
  try{ navigator.serviceWorker.startMessages(); }catch(e){}
  /* anche senza rete, se c'è già un service worker lo si legge */
  navigator.serviceWorker.getRegistration().then(seguiRegistrazione).catch(() => {});
  let servita = !!navigator.serviceWorker.controller;   /* alla prima apertura il service worker arriva a pagina aperta: non è una versione nuova */
  /* la versione nuova è entrata in uso (l'ha chiesto questa pagina, in un momento che non disturba): la pagina si ricarica */
  navigator.serviceWorker.addEventListener('controllerchange', () => { if(servita && !paginaInUscita) location.reload(); servita = true; });
  document.addEventListener('visibilitychange', passaAllaVersioneNuova);
  fetch('emergenza.json', {cache:'no-store', credentials:'omit'}).then(r => r.ok ? r.json() : null).then(j => {
    if(!j || !Array.isArray(j.scarta)) return;
    if(j.scarta.includes(VERSIONE) || j.scarta.includes('*')) return scartaCopia();
    return navigator.serviceWorker.register('sw.js').then(seguiRegistrazione);
  }).catch(() => {});
}

/* ======================= Avvio ======================= */
(function avvio(){
  const tema = MEM.testo('dl_tema', null)==='dark' ? 'dark' : 'light';   /* al primo accesso sempre chiaro (Lorenzo, 4 ottobre) */
  document.documentElement.setAttribute('data-theme', tema);
  const m = document.querySelector('meta[name="theme-color"]'); if(m) m.setAttribute('content', tema==='dark' ? '#211D18' : '#FFFDF8');
  if(st.semplice) $('app').classList.add('semplice');
  testiFissi(); purgeExpired(); ricostruisci();
  st.cal.giorno = oggi();
  initMappa(); avviaArchivio(); tutto();
  if(MEM.testo('dl_guida','0')!=='1'){ st.guida = 0; setTimeout(disegnaGuida, 500); }
  cercaNovita(); avviaCopia();
  setInterval(() => { const p = purgeExpired(); ricostruisci(); if(st.sezione==='mappa') { disegnaChips(); disegnaPins(); disegnaPeek(); } if(p && st.foglio && ['elenco','calendario'].includes(st.foglio)) disegnaFoglio(); }, 60000);
  window.AGR = Object.assign(window.AGR || {}, {versione:'restyling-3', stato:st, eventi:() => events,
    archivio:() => ({zona:[...ZONA.ids].sort(), lontano:ZONA.lontano, conservati:ARCHIVIO ? ARCHIVIO.quadrantiConservati().sort() : [], pubblici:EV.filter(e => e.archivio).length, finto:ARCHIVIO_FINTO}),
    nascosti:{conta:() => ({voci:NASC.voci.length, visti:nascostiVisti().length, sullaMappa:EV.filter(e => e.nascosto && visibile(e)).length}), controlla:() => controllaNascosti()},
    tr, dloc, lingua:() => lang, versione:VERSIONE, mappa:() => ({fonte:MAPPA.fonte, sulTelefono:MAPPA_LOCALE ? MAPPA_LOCALE.stato() : Promise.resolve(null)}),
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

