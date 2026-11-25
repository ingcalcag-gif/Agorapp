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
const MEM = MODULI.memoria.crea({redazione:/*@red*/true/*@fine*//*@pub*/false/*@fine*/});
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
/*@@LAYERS@@*/
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
function saveEvents(){ if(!MEM.scrivi('dl_eventi', events)) avviso(tr(/*@red*/'Spazio esaurito sul telefono: esporta un backup ed elimina qualche evento.'/*@fine*//*@pub*/'Spazio esaurito sul telefono: elimina qualche evento.'/*@fine*/), null, true); }
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
  pieno:false, sezione:'mappa', form:null, /*@red*/aform:null, /*@fine*/conferma:null, legale:'privacy', semplice:false,
  /*@red*/admin:true, eliminati:[], importa:null, msgAdmin:null, /*@fine*/guida:null, sblocco:null, togliNasc:null, lente:null, vuoti:false
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
