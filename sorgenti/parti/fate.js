
/* ======================= Ordine delle Fate · funzione nascosta (Lorenzo, 4 ottobre) =======================
   Si accende scrivendo la formula nella barra degli eventi nascosti (Cerca). Da quel momento:
   - nel Calendario il tasto «PDF» diventa solo l'icona condividi, dorata e scintillante; fa scegliere tra PDF e pacchetto;
   - il pacchetto è un link con dentro gli Off-Grid scelti, cifrati (AES-GCM) con una chiave che sta dentro l'app:
     lo apre solo Agorapp. Nessun server: tutto sta nel link, dopo il #, che il browser non manda a nessuno;
   - al primo pacchetto si sceglie il «vero nome», che poi non si cambia più;
   - chi riceve il link lo apre o lo incolla nella stessa barra; se non ha ancora detto la formula, gliela chiede.
     Gli eventi ricevuti restano sul telefono come gli Off-Grid, ma nello strato «Ordine delle Fate»
     (nasce al primo pacchetto ricevuto), una sottocategoria per persona. Non si modificano, si cancellano.
     Un nuovo pacchetto della stessa persona prende il posto del precedente.
   - «Fatto il misfatto» spegne tutto: i dati restano sul telefono e tornano giurando di nuovo. */
const FATE_FRASE = 'giuro solennemente di avere buone intenzioni', FATE_FINE = 'fatto il misfatto';
const FATE_CHIAVE = 'qD5+boJsPMomJ9obW/jlHcR1azAC5FXiittpMr8Kx/k=';
const normFrase = s => String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
let fateAttiva = LS.s('agorapp_fate','0')==='1';
let FS = (function(){ const x = LS.get('agorapp_fate_strato', null); return (x && typeof x==='object') ? {nato:!!x.nato, on:x.on!==false, off:Array.isArray(x.off) ? x.off : []} : {nato:false, on:true, off:[]}; })();
const salvaFS = () => LS.set('agorapp_fate_strato', FS);
let FCHI = LS.get('agorapp_fate_chi', {}); if(!FCHI || typeof FCHI!=='object') FCHI = {};
const fataIo = () => { const x = LS.get('agorapp_fate_io', null); return (x && x.id && x.nome) ? x : null; };
const idCasuale = () => Array.from(crypto.getRandomValues(new Uint8Array(9)), b => (b<16?'0':'')+b.toString(16)).join('');
let fatePendente = null;

/* lo strato: non sta in LAYERS (niente admin, import, Temi, combinazioni), ma ha colore e icona come gli altri */
S.fate = {id:'fate', label:'Ordine delle Fate', pin:'#4A3A8C', bg:'#EDE9F8', text:'#2E2466', sub:[]};
ICO.fate = '<svg viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="12" fill="#EDE9F8"/><path d="M12 6.2l1.7 6.1 6.1 1.7-6.1 1.7L12 21.8l-1.7-6.1L4.2 14l6.1-1.7z" fill="#B8861B"/><path d="M19 3.6l.75 2.15L21.9 6.5l-2.15.75L19 9.4l-.75-2.15L16.1 6.5l2.15-.75z" fill="#4A3A8C"/><circle cx="6.5" cy="7.2" r="1.1" fill="#B8861B"/></svg>';
function fataVisibile(e){ return FS.on && !FS.off.includes(e.raw.fataDa); }
function personeFate(){
  const per = {}; events.forEach(ev => { if(ev.fata) (per[ev.fataDa] = per[ev.fataDa] || {id:ev.fataDa, label:ev.sublayer||'?'}); });
  return Object.values(per).sort((a,b) => a.label.localeCompare(b.label));
}

/* ---------- icone ---------- */
const STELLA = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 0l1.2 3.8L10 5 6.2 6.2 5 10 3.8 6.2 0 5l3.8-1.2z" fill="currentColor"/></svg>';
const STELLINA = c => `<span class="scintilla ${c}" aria-hidden="true">${STELLA}</span>`;
const icoOro = s => `<svg class="oro" width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" aria-hidden="true"><defs><linearGradient id="oro-g" x1="1" y1="1" x2="15" y2="15" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:var(--oro-1)"/><stop offset=".5" style="stop-color:var(--oro-2)"/><stop offset="1" style="stop-color:var(--oro-1)"/></linearGradient></defs><g stroke="url(#oro-g)" stroke-width="1.7"><circle cx="12" cy="3.5" r="2"/><circle cx="4" cy="8" r="2"/><circle cx="12" cy="12.5" r="2"/><path d="m5.8 7 4.4-2.5M5.8 9l4.4 2.5"/></g></svg>`;
const icoDoc = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M5 2.5h8l4 4v13H5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M13 2.5v4h4M8 11h6M8 14h6M8 17h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const eyebrowFate = t => `<div class="eyebrow fate-ink"><span class="stella-in">${STELLA}</span>${t}</div>`;

/* ---------- Calendario: il tasto condividi ---------- */
function tastoCondividiCal(){
  if(!fateAttiva) return `<button class="tasto sec tasto-pdf" style="flex:none;min-height:44px" data-az="pdf" aria-label="${esc(tr('PDF: scarica o condividi'))}">PDF ${icoCondividi()}</button>`;
  return `<button class="tasto tasto-oro" data-az="condividi-scegli" aria-label="${esc(tr('Condividi: PDF o pacchetto dei tuoi eventi'))}">${icoOro(20)}${STELLINA('s1')}${STELLINA('s2')}${STELLINA('s3')}</button>`;
}
function fCondividi(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Condividi')}</h2><p class="meta">${tr('Cosa vuoi mandare?')}</p></div>${chiudiBtn('indietro-cal')}</div>`;
  const corpo = `<div class="stack-s">
    <button class="riga-int scelta-cond" data-az="pdf"><span class="cond-ico">${icoDoc}</span><div><span class="t">PDF</span><span class="meta">${tr('Il calendario da stampare o da mandare come file.')}</span></div>${freccia}</button>
    <button class="riga-int scelta-cond oro" data-az="pacchetto"><span class="cond-ico oro">${STELLA}</span><div><span class="t">${tr('Il pacchetto dei tuoi eventi')}</span><span class="meta">${tr('Un link che solo Agorapp sa aprire. Dentro, gli Off-Grid che scegli tu.')}</span></div>${freccia}</button></div>`;
  return foglio('forte', testa, corpo);
}

/* ---------- Il pacchetto: vero nome, scelta, link ---------- */
function apriPacchetto(){
  st.pk = {fase: fataIo() ? 'scegli' : 'nome', nome:'', tolti:new Set(), link:'', n:0, err:'', copiato:false, lavoro:false};
  apri('pacchetto');
  if(st.pk.fase==='nome') setTimeout(() => { const i = $('fate-nome'); if(i) i.focus(); }, 120);
}
function gruppiPacchetto(){
  const l = EV.filter(e => e.tipo==='og' && !finito(e)).sort((a,b) => a.a-b.a), g = new Map();
  l.forEach(e => { const k = e.serie || e.id; if(!g.has(k)) g.set(k, []); g.get(k).push(e); });
  return [...g.entries()].map(([k, v]) => ({k, v}));
}
function fPacchetto(){
  const pk = st.pk || {fase:'nome', tolti:new Set()}, io = fataIo(), indietro = chiudiBtn('indietro-cal');
  const errore = pk.err ? `<span class="err" role="alert">${esc(pk.err)}</span>` : '';
  if(pk.fase==='nome'){
    const testa = `<div class="riga-titolo"><div>${eyebrowFate(tr('Ordine delle Fate'))}<h2>${tr('Qual è il tuo vero nome?')}</h2></div>${indietro}</div>`;
    const corpo = `<p class="meta" style="color:var(--testo)">${tr('Con questo nome ti riconosceranno le persone a cui mandi i tuoi eventi. Una volta scelto, non si cambia più.')}</p>
      <div class="campo${pk.err?' errore':''}"><input id="fate-nome" maxlength="40" value="${esc(pk.nome)}" placeholder="${esc(tr('Il tuo vero nome'))}" autocomplete="off" autocapitalize="words" spellcheck="false" enterkeyhint="done"></div>${errore}
      <button class="tasto pri pieno" data-az="fate-nome">${tr('Questo è il mio vero nome')}</button>
      <p class="meta">${tr('Resta su questo telefono e viaggia solo dentro i pacchetti che mandi tu.')}</p>`;
    return foglio('forte', testa, corpo);
  }
  if(pk.fase==='conferma-nome'){
    const testa = `<div class="riga-titolo"><div>${eyebrowFate(tr('Ordine delle Fate'))}<h2>${tr('«{n}», per sempre?',{n:esc(pk.nome)})}</h2></div>${indietro}</div>`;
    const corpo = `<p class="meta" style="color:var(--testo)">${tr('Non potrai più cambiarlo: è il nome con cui ti riconosceranno.')}</p>
      <div class="tasti"><button class="tasto sec" data-az="fate-nome-cambia">${tr('Cambia')}</button><button class="tasto pri" data-az="fate-nome-ok">${tr('Sì, per sempre')}</button></div>`;
    return foglio('forte', testa, corpo);
  }
  if(pk.fase==='pronto'){
    const testa = `<div class="riga-titolo"><div>${eyebrowFate(tr('Ordine delle Fate'))}<h2>${tr('Il pacchetto è pronto')}</h2><p class="meta">${pk.n===1 ? tr('1 evento') : tr('{n} eventi',{n:pk.n})} · ${tr('firmato {n}',{n:esc(io ? io.nome : '')})}</p></div>${indietro}</div>`;
    const corpo = `<div class="fate-link" id="fate-link">${esc(pk.link)}</div>
      <div class="tasti"><button class="tasto pri" data-az="fate-copia">${pk.copiato ? spunta()+tr('Copiato') : tr('Copia il link')}</button>${navigator.share ? `<button class="tasto sec" data-az="fate-manda">${icoCondividi()}${tr('Mandalo')}</button>` : ''}</div>${errore}
      <div class="fonte"><span class="meta">${tr('Chi lo riceve lo apre, o lo incolla in Cerca, nella barra degli eventi nascosti. Per aprirlo gli servirà la formula.')}</span>
        <span class="meta">${tr('Dentro ci sono i tuoi eventi di adesso. Se cambiano, manda un nuovo pacchetto: prenderà il posto di questo.')}</span></div>
      <button class="link" data-az="indietro-cal">${tr('Torna al calendario')}</button>`;
    return foglio('forte alto', testa, corpo);
  }
  /* scegli */
  const G = gruppiPacchetto(), n = G.filter(g => !pk.tolti.has(g.k)).reduce((s,g) => s + g.v.length, 0);
  const riga = g => { const e = g.v[0], on = !pk.tolti.has(g.k);
    const meta = g.v.length>1 ? `${esc(repLabel(e.raw.rep && e.raw.rep.freq, e.giorno))} · ${tr('{n} date',{n:g.v.length})} · ${tr('dal {d}',{d:esc(dIso(e.giorno).toLocaleDateString(dloc(),{day:'numeric',month:'long'}))})}`
      : `${esc(maiusc(titoloGiorno(e.giorno)))} · ${e.inizio}${e.fine?'–'+e.fine:''}`;
    return `<button class="menu-r" data-fpk="${esc(g.k)}" aria-pressed="${on}"><span class="casella">${on?spunta(14):''}</span><div><span class="t">${esc(e.titolo)}</span><span class="meta">${meta}</span></div></button>`; };
  const testa = `<div class="riga-titolo"><div>${eyebrowFate(tr('Firmato {n}',{n:esc(io ? io.nome : '')}))}<h2>${tr('Il pacchetto dei tuoi eventi')}</h2><p class="meta">${tr('Togli quello che non vuoi mandare.')}</p></div>${indietro}</div>`;
  const corpo = G.length ? `<div class="lista">${G.map(riga).join('')}</div>
      <button class="tasto pri pieno" data-az="fate-crea" ${n && !pk.lavoro ? '' : 'disabled'}>${pk.lavoro ? tr('Preparo il link…') : n ? (n===1 ? tr('Crea il link · 1 evento') : tr('Crea il link · {n} eventi',{n})) : tr('Scegli almeno un evento')}</button>${errore}
      <p class="meta">${tr('Entrano solo i tuoi Off-Grid. Gli eventi della città salvati nel calendario restano fuori: sono già sulla mappa di tutti.')}</p>`
    : `<div class="fatti"><div class="dato">${icoCal()}<div><span class="t">${tr('Niente da mettere nel pacchetto')}</span><span class="meta">${tr('Il pacchetto porta i tuoi Off-Grid in arrivo, e adesso non ne hai.')}</span></div></div></div>
      <button class="tasto pri pieno" data-az="nuovo">${tr('+ Aggiungi un Off-Grid')}</button>`;
  return foglio('forte alto', testa, corpo);
}

/* ---------- Sigillo: JSON → compresso → AES-GCM → base64url ---------- */
const b64u = u8 => { let s = ''; for(let i=0; i<u8.length; i+=0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i+0x8000)); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); };
const deb64u = s => { s = s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4) s += '='; const b = atob(s), u = new Uint8Array(b.length); for(let i=0; i<b.length; i++) u[i] = b.charCodeAt(i); return u; };
let chiaveFate = null;
const chiaveSigillo = () => chiaveFate || (chiaveFate = crypto.subtle.importKey('raw', deb64u(FATE_CHIAVE), 'AES-GCM', false, ['encrypt','decrypt']));
const puoComprimere = () => typeof CompressionStream==='function' && typeof DecompressionStream==='function';
async function flusso(u8, comprimi){
  const cs = comprimi ? new CompressionStream('deflate-raw') : new DecompressionStream('deflate-raw');
  return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(cs)).arrayBuffer());
}
async function sigilla(obj){
  let dati = new TextEncoder().encode(JSON.stringify(obj)), flag = 0;
  if(puoComprimere()){ try{ dati = await flusso(dati, true); flag = 1; }catch(e){} }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv, additionalData:new Uint8Array([1, flag])}, await chiaveSigillo(), dati));
  const out = new Uint8Array(14 + ct.length); out[0] = 1; out[1] = flag; out.set(iv, 2); out.set(ct, 14);
  return b64u(out);
}
async function apriSigillo(s){
  const u = deb64u(s); if(u.length < 31 || u[0]!==1) throw new Error('formato');
  const flag = u[1];
  let dati = new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM', iv:u.slice(2,14), additionalData:new Uint8Array([1, flag])}, await chiaveSigillo(), u.slice(14)));
  if(flag===1){ if(!puoComprimere()) throw new Error('browser'); dati = await flusso(dati, false); }
  return JSON.parse(new TextDecoder().decode(dati));
}
function contenutoPacchetto(){
  const io = fataIo(), scelti = [];
  gruppiPacchetto().forEach(g => { if(!st.pk.tolti.has(g.k)) g.v.forEach(e => scelti.push(e.raw)); });
  return {v:1, da:{i:io.id, n:io.nome}, c:new Date().toISOString(), e:scelti.map(x => {
    const o = {o:x.id, t:x.title||'', s:x.datetime||'', y:Math.round(+x.lat*1e6)/1e6, x:Math.round(+x.lng*1e6)/1e6};
    if(x.end) o.f = x.end;
    if(x.addressFull || x.address) o.a = x.addressFull || x.address;
    if(x.addrPrecision && x.addrPrecision!=='exact') o.p = x.addrPrecision;
    if(x.notes) o.n = x.notes;
    const l = (x.links && x.links.length ? x.links : (x.link ? [x.link] : [])).filter(Boolean); if(l.length) o.l = l;
    if(x.seriesId){ o.r = x.seriesId; if(x.rep) o.q = {f:x.rep.freq, u:x.rep.until}; }
    return o; })};
}
async function creaLinkPacchetto(){
  const pk = st.pk; if(!pk || pk.lavoro) return;
  if(!(window.crypto && crypto.subtle)){ pk.err = tr('Questo browser non sa sigillare il pacchetto: prova con Chrome aggiornato.'); disegnaFoglio(); return; }
  pk.lavoro = true; pk.err = ''; disegnaFoglio();
  try{
    const dati = contenutoPacchetto(); pk.n = dati.e.length;
    pk.link = location.origin + location.pathname + '#fate=' + await sigilla(dati);
    pk.fase = 'pronto'; pk.copiato = false;
  }catch(e){ pk.err = tr('Il link non si è creato. Riprova.'); }
  pk.lavoro = false; if(st.foglio==='pacchetto') disegnaFoglio();
}
async function copiaLink(){
  const pk = st.pk, l = pk && pk.link; if(!l) return; let ok = false;
  try{ if(navigator.clipboard && window.isSecureContext){ await navigator.clipboard.writeText(l); ok = true; } }catch(e){}
  if(!ok){ const ta = document.createElement('textarea'); ta.value = l; ta.setAttribute('readonly',''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(ta); ta.select(); try{ ok = document.execCommand('copy'); }catch(e){} ta.remove(); }
  pk.copiato = ok; pk.err = ok ? '' : tr('Non riesco a copiarlo: tieni premuto sul link e copialo a mano.'); disegnaFoglio();
}
async function mandaLink(){
  const l = st.pk && st.pk.link; if(!l || !navigator.share) return;
  try{ await navigator.share({title:'Agorapp', text:tr('Un pacchetto di eventi per te, da aprire con Agorapp.'), url:l}); }catch(e){}
}

/* ---------- La formula ---------- */
function attivaFate(on){
  fateAttiva = on; LS.set('agorapp_fate', on ? '1' : '0');
  ricostruisci(); tutto(); if(st.foglio) disegnaFoglio();
}
const estraiPacchetto = s => { const m = String(s||'').match(/[#&?]fate=([A-Za-z0-9_-]{20,})/); return m ? m[1] : null; };
/* dalla barra degli eventi nascosti: true se quello che è stato scritto era per le Fate */
function sbloccaFate(v){
  const n = normFrase(v), pk = estraiPacchetto(v);
  if(n===normFrase(FATE_FRASE)){ st.fateMsg = fateAttiva ? 'gia' : 'si'; attivaFate(true); return true; }
  if(n===normFrase(FATE_FINE) && fateAttiva){ st.fateMsg = 'fine'; attivaFate(false); return true; }
  if(pk){ st.fateMsg = null; riceviPacchetto(pk); return true; }
  return false;
}
function msgFateCerca(){
  const m = {si:tr('Giuramento accettato. Nel Calendario il tasto condividi ora è d’oro: da lì mandi i tuoi eventi in un pacchetto.'),
    gia:tr('Lo hai già giurato: il condividi d’oro ti aspetta nel Calendario.'),
    fine:tr('Fatto il misfatto. Il condividi torna normale e l’Ordine delle Fate sparisce dalla mappa. Per riaprirlo, giura di nuovo.')}[st.fateMsg];
  return m ? `<p class="fate-msg" role="status">${m}</p>` : '';
}
function fFormula(){
  const testa = `<div class="riga-titolo"><div>${eyebrowFate(tr('Ordine delle Fate'))}<h2>${tr('Un pacchetto sigillato')}</h2><p class="meta">${tr('Qualcuno ti ha affidato i suoi eventi. Per aprirlo, scrivi la formula.')}</p></div>${chiudiBtn('fate-formula-no')}</div>`;
  const corpo = `<div style="display:flex;gap:8px"><label class="campo" style="flex:1"><input id="fate-formula" type="text" placeholder="${esc(tr('La formula'))}" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="go"></label><button class="tasto pri" style="flex:none;padding:0 18px" data-az="fate-formula">${tr('Apri')}</button></div>
    <span class="err" id="fate-formula-err" hidden>${tr('Non è la formula.')}</span>
    <p class="meta">${tr('Chi te l’ha mandato sa qual è.')}</p>`;
  return foglio('forte', testa, corpo);
}
function provaFormula(){
  const v = ($('fate-formula') || {}).value || '';
  if(normFrase(v)!==normFrase(FATE_FRASE)){ const e = $('fate-formula-err'); if(e) e.hidden = false; return; }
  const s = fatePendente; fatePendente = null; attivaFate(true);
  if(s) riceviPacchetto(s); else chiudi();
}

/* ---------- Ricevere ---------- */
async function riceviPacchetto(s){
  if(!fateAttiva){ fatePendente = s; apri('formula'); setTimeout(() => { const i = $('fate-formula'); if(i) i.focus(); }, 150); return; }
  if(st.sezione!=='mappa') vaiSezione('mappa');
  st.fArr = {carico:true}; st.sel = null; apri('fate');
  let p;
  try{ if(!(window.crypto && crypto.subtle)) throw new Error('crypto'); p = await apriSigillo(s); }
  catch(e){ st.fArr = {errore: e && e.message==='browser' ? tr('Il browser è troppo vecchio per aprire questo pacchetto: aggiorna Chrome.') : tr('Questo pacchetto non si apre: forse il link si è tagliato. Chiedi di rimandarlo intero.')}; if(st.foglio==='fate') disegnaFoglio(); return; }
  st.fArr = spacchetta(p); tutto(); if(st.foglio==='fate') disegnaFoglio();
}
function spacchetta(p){
  const rotto = {errore:tr('Questo pacchetto non si apre: forse il link si è tagliato. Chiedi di rimandarlo intero.')};
  if(!p || p.v!==1 || !p.da || typeof p.da.i!=='string' || typeof p.da.n!=='string' || !Array.isArray(p.e)) return rotto;
  const sid = p.da.i.replace(/[^\w-]/g,'').slice(0,40), nome = p.da.n.replace(/\s+/g,' ').trim().slice(0,40) || '?';
  if(!sid) return rotto;
  const io = fataIo(); if(io && io.id===sid) return {errore:tr('È un tuo pacchetto: questi eventi li hai già.')};
  /* stesso nome di un'altra persona: «Nome (2)», così le sottocategorie restano distinte */
  let label = (FCHI[sid] && FCHI[sid].label) || nome;
  if(!FCHI[sid]){ const usati = new Set(Object.keys(FCHI).map(i => FCHI[i].label)); let k = 2; while(usati.has(label)) label = nome+' ('+(k++)+')'; }
  const quando = Date.parse(p.c) || Date.now();
  if(FCHI[sid] && FCHI[sid].c && quando < FCHI[sid].c) return {errore:tr('Hai già un pacchetto più recente di {n}: questo è vecchio e non lo apro.',{n:label})};
  const dt = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, nuovi = [], visti = new Set();
  p.e.slice(0, 800).forEach(o => {
    if(!o || typeof o!=='object') return;
    const lat = +o.y, lng = +o.x, s = String(o.s||''), oid = String(o.o||'').replace(/[^\w-]/g,'').slice(0,60);
    if(!oid || visti.has(oid) || !dt.test(s) || !isFinite(lat) || !isFinite(lng) || Math.abs(lat)>90 || Math.abs(lng)>180) return;
    visti.add(oid);
    const fine = dt.test(String(o.f||'')) ? o.f : '', note = String(o.n||'').slice(0,1000), luogo = String(o.a||'').slice(0,300);
    const links = (Array.isArray(o.l) ? o.l : []).slice(0,5).map(normLink).filter(Boolean);
    const ev = {id:'fata-'+sid+'-'+oid, title:String(o.t||'').slice(0,TITLE_MAX) || tr('Senza titolo'), address:luogo, addressFull:luogo, addrPrecision:['map','street','nonum'].includes(o.p) ? o.p : 'exact', addrNum:'',
      lat, lng, datetime:s, end:fine, duration:'', notes:note, description:note, links, link:links[0]||'',
      offgrid:false, personal:false, fata:true, fataDa:sid, category:'fate', sublayer:label, hidden:false, hiddenPassword:'', price:'', image:'', createdAt:new Date().toISOString()};
    if(o.r){ ev.seriesId = 'fata-'+sid+'-'+String(o.r).replace(/[^\w-]/g,'').slice(0,40); if(o.q && typeof o.q==='object') ev.rep = {freq:String(o.q.f||'none'), until:String(o.q.u||'')}; }
    if(!isGone(ev)) nuovi.push(ev);
  });
  /* un nuovo pacchetto della stessa persona prende il posto del precedente */
  const vecchi = events.filter(x => x.fata && x.fataDa===sid), primo = !FS.nato, tieni = new Set(nuovi.map(x => x.id));
  vecchi.forEach(x => { if(!tieni.has(x.id)) delete calEvents[x.id]; });
  events = events.filter(x => !(x.fata && x.fataDa===sid)).concat(nuovi);
  FCHI[sid] = {nome, label, c:quando}; LS.set('agorapp_fate_chi', FCHI);
  FS.nato = true; FS.on = true; FS.off = FS.off.filter(x => x!==sid); salvaFS();
  saveEvents(); saveCal(); ricostruisci();
  st.tipi.evento = true;
  return {nome:label, ids:nuovi.map(x => x.id), prima:vecchi.length, primo};
}
function fFateArrivo(){
  const a = st.fArr || {};
  const testa = (h, sotto) => `<div class="riga-titolo"><div>${eyebrowFate(tr('Ordine delle Fate'))}<h2>${h}</h2>${sotto ? `<p class="meta">${sotto}</p>` : ''}</div>${chiudiBtn()}</div>`;
  if(a.carico) return foglio('forte', testa(tr('Apro il pacchetto…')), `<p class="caricamento">${tr('Un momento.')}</p>`);
  if(a.errore) return foglio('forte', testa(tr('Il pacchetto non si apre')), `<p class="meta" style="color:var(--testo)">${esc(a.errore)}</p><button class="tasto sec pieno" data-az="chiudi">${tr('Chiudi')}</button>`);
  const ids = a.ids || [], l = ids.map(byId).filter(Boolean).sort((x,y) => x.a-y.a), n = ids.length;
  const h = n===1 ? tr('{n} ti ha affidato 1 evento',{n:esc(a.nome)}) : tr('{n} ti ha affidato {k} eventi',{n:esc(a.nome), k:n});
  const corpo = `${a.primo ? `<p class="fate-msg">${tr('È nato lo strato Ordine delle Fate. Lo trovi in Strati: puoi spegnerlo tutto, o una persona sola.')}</p>` : ''}
    ${a.prima ? `<p class="meta">${a.prima===1 ? tr('Prende il posto dell’evento che ti aveva mandato prima.') : tr('Prendono il posto dei {m} che ti aveva mandato prima.',{m:a.prima})}</p>` : ''}
    ${l.length ? perGiorni(l) + `<button class="tasto pri pieno" data-az="fate-mappa">${tr('Vedili sulla mappa')}</button>` : `<p class="meta" style="color:var(--testo)">${tr('Il pacchetto è vuoto, o i suoi eventi sono già passati.')}</p>`}
    <p class="meta">${tr('Restano solo su questo telefono. Non si possono modificare; si cancellano dalla loro scheda.')}</p>`;
  return foglio('forte alto', testa(h), corpo);
}
function controllaLinkFate(){
  const s = estraiPacchetto(location.hash); if(!s) return false;
  try{ history.replaceState(null, '', location.pathname + location.search); }catch(e){}
  setTimeout(() => riceviPacchetto(s), 300);
  return true;
}
window.addEventListener('hashchange', controllaLinkFate);

/* ---------- Strati, scheda, eliminazione ---------- */
function bloccoFate(){
  if(!fateAttiva || !FS.nato) return '';
  const per = nelPeriodo().filter(e => e.strato==='fate'), chi = personeFate(), s = S.fate;
  const accesi = per.filter(e => !FS.off.includes(e.raw.fataDa)).length;
  return `<section class="sezione"><div class="sez-testa"><div class="tipo fate-ink">${tr('Ordine delle Fate')}</div><span class="meta">${tr('Eventi che ti hanno affidato')}</span></div>
    <button class="riga-int" data-az="fate-strato" aria-pressed="${FS.on}">${forma('evento','fate',30)}<div><span class="t">${tr('Ordine delle Fate')} · ${accesi}</span><span class="meta">${chi.length ? tr('Una sottocategoria per ogni persona. Solo su questo telefono.') : tr('Nessun evento: arriveranno col prossimo pacchetto.')}</span></div><span class="interr" aria-hidden="true"></span></button>
    ${chi.length && FS.on ? `<div class="sub fate-sub" style="--pc:${s.pin};--pb:${s.bg};--pt:${s.text};--pp:${s.pin}">${chi.map(p => `<button data-fata-chi="${esc(p.id)}" aria-pressed="${!FS.off.includes(p.id)}">${esc(p.label)} · ${per.filter(e => e.raw.fataDa===p.id).length}</button>`).join('')}</div>` : ''}</section>`;
}
function fSchedaFata(e){
  const x = e.raw, chi = esc(e.sub), serie = e.serie ? EV.filter(y => y.serie===e.serie) : null;
  const links = (x.links || []).map(safeUrl).filter(Boolean);
  const repTesto = serie && x.rep ? `${repLabel(x.rep.freq, e.giorno)}${x.rep.until ? ' · '+tr('fino al {d}',{d:dIso(x.rep.until).toLocaleDateString(dloc(),{day:'numeric',month:'long'})}) : ''} · ${tr('{n} date',{n:serie.length})}` : '';
  const testa = `<div class="riga-titolo"><div class="pill-row">${pillStrato(e)}</div>${chiudiBtn()}</div>
    <div class="scheda-testa"><span style="${finito(e)?'filter:grayscale(1);opacity:.6':''}">${forma('evento','fate',40)}</span><div>${eyebrowFate(tr('Evento di {n}',{n:chi}))}<h2>${esc(e.titolo)}</h2></div></div>
    ${finito(e) ? '' : `<div class="tasti tasti-testa">${tastoSalva(e)}${tastoIndicazioni(e)}</div>`}`;
  const corpo = `<div class="fatti">${quando(e)}
      ${serie ? `<div class="dato">${icoRipeti}<div><span class="t">${tr('Si ripete')}</span><span class="meta">${esc(repTesto)}. ${tr('Sulla mappa vedi solo la prossima data.')}</span></div></div>` : ''}
      ${e.luogo ? `<div class="dato">${icoLuogo}<div><span class="t">${esc(e.luogo)}</span></div></div>` : ''}
      ${e.desc ? `<div class="dato">${icoNote}<div><span style="white-space:pre-wrap">${esc(e.desc)}</span></div></div>` : ''}
      ${links.map(l => `<div class="dato">${icoLink}<div><a href="${esc(l)}" target="_blank" rel="noopener">${esc(hostDi(l))}</a></div></div>`).join('')}</div>
    <div class="fate-box"><span class="stella-in">${STELLA}</span><span class="meta" style="color:var(--testo)">${tr('Te l’ha affidato {n} con un pacchetto. Vive solo su questo telefono e non si modifica: se cambia, chiedi un nuovo pacchetto.',{n:chi})}</span></div>
    <button class="tasto pericolo pieno" data-elimina="${esc(e.id)}">${tr('Elimina')}</button>`;
  return foglio('forte medio', testa, corpo);
}
function fConfermaFata(raw){
  const serie = raw.seriesId ? serieDi(raw) : null, suoi = events.filter(x => x.fata && x.fataDa===raw.fataDa), chi = esc(raw.sublayer || '');
  const testa = `<div class="riga-titolo"><h2>${serie && serie.length>1 || suoi.length>1 ? tr('Cosa vuoi eliminare?') : tr('Eliminare «{t}»?',{t:esc(raw.title)})}</h2>${chiudiBtn('annulla-conferma')}</div>`;
  const corpo = (serie && serie.length>1 || suoi.length>1)
    ? `<button class="tasto pericolo pieno col" data-elimina-ok="una">${tr('Solo questo')}<small>${esc(nomeGiorno((raw.datetime||'').slice(0,10)))}</small></button>
      ${serie && serie.length>1 ? `<button class="tasto pericolo pieno" data-elimina-ok="serie">${tr('Tutta la serie ({n} date)',{n:serie.length})}</button>` : ''}
      ${suoi.length>1 ? `<button class="tasto pericolo-pieno tasto pieno" data-elimina-ok="persona">${tr('Tutti gli eventi di {n} · {k}',{n:chi, k:suoi.length})}</button>` : ''}
      <p class="meta">${tr('Spariscono da questo telefono. Se {n} ti manda un nuovo pacchetto, tornano quelli che ci sono dentro.',{n:chi})}</p>
      <button class="tasto sec pieno" data-az="annulla-conferma">${tr('Annulla')}</button>`
    : `<p class="meta">${tr('Sparisce dalla mappa e dal calendario di questo telefono.')}</p><div class="tasti"><button class="tasto sec" data-az="annulla-conferma">${tr('Annulla')}</button><button class="tasto pericolo-pieno" data-elimina-ok="una">${tr('Elimina')}</button></div>`;
  return foglio('forte', testa, corpo);
}

/* ---------- Tasti ---------- */
function clickFate(t, d){
  if(d.fataChi){ const i = FS.off.indexOf(d.fataChi); if(i<0) FS.off.push(d.fataChi); else FS.off.splice(i,1); salvaFS(); tutto(); return true; }
  if(d.fpk){ if(!st.pk) return true; const s = st.pk.tolti; s.has(d.fpk) ? s.delete(d.fpk) : s.add(d.fpk); disegnaFoglio(); return true; }
  switch(d.az){
    case 'condividi-scegli': st.sel = null; apri('condividi'); return true;
    case 'pacchetto': apriPacchetto(); return true;
    case 'fate-nome': { const v = (($('fate-nome') || {}).value || '').replace(/\s+/g,' ').trim(); st.pk.nome = v;
      if(v.length<2){ st.pk.err = tr('Scrivi il tuo vero nome.'); disegnaFoglio(); return true; }
      st.pk.err = ''; st.pk.fase = 'conferma-nome'; disegnaFoglio(); return true; }
    case 'fate-nome-cambia': st.pk.fase = 'nome'; disegnaFoglio(); setTimeout(() => { const i = $('fate-nome'); if(i) i.focus(); }, 60); return true;
    case 'fate-nome-ok': if(!fataIo()) LS.set('agorapp_fate_io', {id:idCasuale(), nome:st.pk.nome, dal:new Date().toISOString()}); st.pk.fase = 'scegli'; disegnaFoglio(); return true;
    case 'fate-crea': creaLinkPacchetto(); return true;
    case 'fate-copia': copiaLink(); return true;
    case 'fate-manda': mandaLink(); return true;
    case 'fate-strato': FS.on = !FS.on; salvaFS(); tutto(); return true;
    case 'fate-formula': provaFormula(); return true;
    case 'fate-formula-no': fatePendente = null; chiudi(); return true;
    case 'fate-mappa': { const ids = (st.fArr && st.fArr.ids) || [];
      st.tempo = 'tutto'; st.tipi.evento = true; st.salvatiSolo = false; st.lente = null; st.prezzo = 'tutti'; FS.on = true; salvaFS();
      chiudi(); tutto(); requestAnimationFrame(() => { const l = EV.filter(e => ids.includes(e.id) && visibile(e)); if(l.length) inquadraTutti(l); });
      return true; }
  }
  return false;
}
