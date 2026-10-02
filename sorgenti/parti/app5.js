
/* ======================= Impostazioni, documenti, città ======================= */
/*@@LEGALI@@*/
function fImpostazioni(){
  const scuro = temaAttuale()==='dark';
  const testa = `<div class="riga-titolo"><h2>${tr('Impostazioni')}</h2>${chiudiBtn()}</div>`;
  const corpo = `
    <section class="sezione"><div class="tipo">${tr('Aspetto')}</div><div class="seg" role="group"><button data-tema-set="light" aria-pressed="${!scuro}">${tr('Chiaro')}</button><button data-tema-set="dark" aria-pressed="${scuro}">${tr('Scuro')}</button></div>
      <button class="riga-int" data-az="semplice" aria-pressed="${st.semplice}"><div><span class="t">${tr('Modalità semplice')}</span><span class="meta">${tr('Testi più grandi e meno comandi: niente sottocategorie e combinazioni.')}</span></div><span class="interr" aria-hidden="true"></span></button></section>
    <section class="sezione"><div class="tipo">${tr('Lingua')}</div><div class="seg" role="group">${['it','en','es','fr','ar'].map(l => `<button data-lingua="${l}" aria-pressed="${lang===l}" lang="${l}">${l.toUpperCase()}</button>`).join('')}</div></section>
    <section class="sezione"><div class="tipo">${tr('Aiuto')}</div><div class="menu-lista"><button class="menu-r" data-az="guida">${icoNote}<div><span class="t">${tr('Rivedi la guida')}</span><span class="meta">${tr('I tre passi che compaiono alla prima apertura')}</span></div>${freccia}</button><button class="menu-r" data-az="aiuto-og">${GLIFO_OG}<div><span class="t">${tr('Che cos’è un evento Off-Grid?')}</span></div>${freccia}</button></div></section>
    <section class="sezione"><div class="tipo">${tr('Documenti')}</div><div class="menu-lista">
      <button class="menu-r" data-legale="privacy"><div><span class="t">${tr('Informativa sulla privacy')}</span><span class="meta">${tr('Conforme GDPR · v1.2 · marzo 2026')}</span></div>${freccia}</button>
      <button class="menu-r" data-legale="storage"><div><span class="t">${tr('Dati locali')}</span><span class="meta">${tr('Cosa resta su questo telefono')}</span></div>${freccia}</button>
      <button class="menu-r" data-legale="disclaimer"><div><span class="t">${tr('Note legali')}</span><span class="meta">${tr('Accuratezza, manifestazioni, responsabilità')}</span></div>${freccia}</button></div>
      <p class="meta">${tr('Scrivici')}: <a class="mail" href="mailto:info@agorapp.it">info@agorapp.it</a></p></section>
    <section class="sezione"><div class="tipo">${tr('Area riservata')}</div>
      ${st.admin ? `<button class="riga-int" data-az="admin"><div><span class="t">${tr('Sei in modalità admin')}</span><span class="meta">${tr('Demo, eventi on-grid, importa, esporta, esci')}</span></div>${freccia}</button>`
        : st.adminPw ? `<div style="display:flex;gap:8px"><label class="campo${st.adminErr?' errore':''}" style="flex:1"><input id="adminpw" type="password" placeholder="${esc(tr('Password admin'))}" autocomplete="off"></label><button class="tasto sec" style="flex:none" data-az="entra-admin">${tr('Entra')}</button></div>${st.adminErr?`<span class="err">${tr('Password non riconosciuta.')}</span>`:''}`
        : `<button class="link" data-az="mostra-admin">${tr('Accesso admin')}</button>`}</section>`;
  return foglio('forte alto', testa, corpo);
}
function fLegale(){
  const T = {privacy:tr('Informativa privacy'), storage:tr('Dati locali'), disclaimer:tr('Note legali')};
  const testo = (lang!=='it' && LEGALI[lang] && LEGALI[lang][st.legale]) || ($('leg-'+st.legale) ? $('leg-'+st.legale).innerHTML : '');
  const testa = `<div class="riga-titolo"><div><h2>${tr('Documenti legali')}</h2><p class="meta">Agorapp · Torino · Lorenzo Calcagno · <a class="mail" href="mailto:info@agorapp.it">info@agorapp.it</a></p></div>${chiudiBtn('indietro-impostazioni')}</div>
    <div class="seg" role="tablist">${Object.entries(T).map(([k,l]) => `<button data-legale="${k}" aria-pressed="${st.legale===k}" role="tab">${l}</button>`).join('')}</div>`;
  const corpo = `<div class="legale">${testo}</div>
    <p class="meta">Ai sensi degli artt. 12–13 Reg. UE 2016/679 (GDPR) · D.Lgs. 196/2003 mod. D.Lgs. 101/2018 · Provvedimento Garante 10 giugno 2021 · v1.2 · Marzo 2026</p>`;
  return foglio('forte alto', testa, corpo);
}
function fCitta(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Città e zone')}</h2><p class="meta">${tr('Zone con più eventi sulla mappa')}</p></div>${chiudiBtn()}</div>`;
  const corpo = `<div class="menu-lista">${CITTA.map(c => `<button class="menu-r${c.id===citta?' on':''}" data-citta="${c.id}"><div><span class="t">${esc(c.n)}</span>${c.h?`<span class="meta">${esc(c.h)}</span>`:''}</div>${c.id===citta?`<span style="color:var(--verde)">${spunta()}</span>`:''}</button>`).join('')}</div>
    <p class="meta">${tr('La città scelta resta su questo telefono. Il logo Agorapp riporta sempre alla vista della città.')}</p>`;
  return foglio('forte', testa, corpo);
}
function applicaCitta(id, anima){
  citta = CITTA.find(x => x.id===id) ? id : 'torino'; LS.set('agorapp_city', citta);
  $('cittaLbl').innerHTML = esc(cittaObj().n)+' '+giuPiccola; document.title = 'Agorapp — '+cittaObj().n;
  vaiCitta(anima);
}

/* ======================= Admin ======================= */
function fAdmin(){
  const nDemo = events.filter(e => e.demo).length;
  const testa = `<div class="riga-titolo"><div><h2>${tr('Modalità admin')}</h2><p class="meta">${tr('Solo per chi pubblica gli eventi raccolti')}</p></div>${chiudiBtn()}</div>`;
  const corpo = `<div class="menu-lista">
      <button class="menu-r" data-az="carica-demo">${icoDemo}<div><span class="t">${tr('Carica Demo')}</span><span class="meta">${tr('Eventi, pratiche, istanze, Off-Grid, progetti e temi d’esempio, con le date spostate a oggi')}</span></div>${freccia}</button>
      ${DEMO||nDemo?`<button class="menu-r" data-az="togli-demo">${croce}<div><span class="t">${tr('Togli la demo')}</span><span class="meta">${tr('{n} eventi d’esempio su questo telefono · i tuoi restano',{n:nDemo})}</span></div>${freccia}</button>`:''}
      <button class="menu-r" data-az="admin-ongrid">${icoCal()}<div><span class="t">${tr('Nuovo evento on-grid')}</span><span class="meta">${tr('Form completo, con strato, sottocategoria, prezzo e indirizzo')}</span></div>${freccia}</button>
      <button class="menu-r" data-az="admin-importa">${icoImporta}<div><span class="t">${tr('Importa eventi')}</span><span class="meta">${tr('File JSON')}</span></div>${freccia}</button>
      <button class="menu-r" data-az="admin-esporta">${icoEsporta}<div><span class="t">${tr('Esporta eventi')}</span><span class="meta">${tr('Gli eventi di questo telefono in un file JSON, senza la demo')}</span></div>${freccia}</button></div>
    ${st.demoMsg?`<p class="meta" role="status" style="color:var(--testo)">${esc(st.demoMsg)}</p>`:''}
    ${st.eliminati.length?`<p class="meta">${tr('Eliminati in questa sessione: {n}.',{n:st.eliminati.length})} <button class="link" style="min-height:32px" data-az="ripristina">${tr('Ripristina')}</button></p>`:''}
    <p class="meta">${tr('In modalità admin ogni scheda evento ha «Modifica» ed «Elimina».')}</p>
    <button class="tasto sec pieno" data-az="esci-admin">${tr('Esci dalla modalità admin')}</button>`;
  return foglio('forte alto', testa, corpo);
}
/* Carica Demo: il file demo/agorapp-demo.json, con le date spostate di settimane intere vicino a oggi */
async function caricaDemo(){
  st.demoMsg = tr('Carico la demo…'); disegnaFoglio();
  let d;
  try{ const r = await fetch('demo/agorapp-demo.json', {cache:'no-store'}); if(!r.ok) throw 0; d = await r.json(); if(d.formato!=='agorapp-demo') throw 0; }
  catch(e){ st.demoMsg = tr('Non trovo il file della demo (demo/agorapp-demo.json).'); disegnaFoglio(); return; }
  togliDemo(true);
  const anc = dIso(d.ancora.slice(0,10)), g = dIso(oggi());
  const giorni = Math.round((g - anc)/(7*864e5))*7;
  const sposta = s => { const t = s.indexOf('T'); const dd = t<0 ? s : s.slice(0,t); return piuGiorni(dd, giorni) + (t<0 ? '' : s.slice(t)); };
  const dd = JSON.parse(JSON.stringify(d), (k,v) => (typeof v==='string' && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(v)) ? sposta(v) : v);
  const nuovi = dd.eventi.concat(dd.offgrid).filter(e => !events.some(x => x.id===e.id));
  events = events.concat(nuovi);
  (dd.calendario||[]).concat(dd.offgrid.map(e => e.id)).forEach(id => { calEvents[id] = true; });
  DEMO = {caricata:new Date().toISOString(), giorni, progetti:dd.progetti, istanze:dd.istanze, temi:dd.temi, collegamenti:dd.collegamenti};
  if(!LS.set('agorapp_demo', DEMO)) { /* se manca spazio, la demo resta per questa sessione */ }
  purgeExpired(); saveEvents(); saveCal(); ricostruisci();
  st.demoMsg = tr('Demo caricata: {n} eventi e {o} Off-Grid. Date spostate di {g} giorni.',{n:dd.eventi.length, o:dd.offgrid.length, g:giorni});
  tutto(); disegnaFoglio();
}
function togliDemo(silenzio){
  const ids = new Set(events.filter(e => e.demo).map(e => e.id));
  events = events.filter(e => !e.demo); ids.forEach(id => delete calEvents[id]);
  LS.del('agorapp_demo'); DEMO = null; saveEvents(); saveCal(); ricostruisci();
  if(!silenzio){ st.demoMsg = tr('Demo tolta: {n} eventi d’esempio cancellati.',{n:ids.size}); tutto(); disegnaFoglio(); }
}
function esporta(){
  const dati = events.filter(e => !e.demo);
  const blob = new Blob([JSON.stringify({events:dati, exportedAt:new Date().toISOString()}, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'agorapp_'+oggi()+'.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  st.demoMsg = tr('Esportati {n} eventi.',{n:dati.length}); disegnaFoglio();
}
function leggiImport(file){
  const r = new FileReader();
  r.onload = e => {
    try{ const d = JSON.parse(e.target.result), imp = Array.isArray(d) ? d : (d.events||[]); const ids = new Set(events.map(x => x.id));
      const ok = imp.filter(x => x && !ids.has(x.id) && typeof x.lat==='number' && typeof x.lng==='number' && x.lat>=-90 && x.lat<=90 && x.lng>=-180 && x.lng<=180 && x.title && x.datetime);
      st.importa = {tot:imp.length, ok}; apri('importa');
    }catch(err){ st.demoMsg = tr('Il file non si legge: controlla che sia un JSON di Agorapp.'); apri('admin'); }
  };
  r.readAsText(file);
}
function fImporta(){
  const I = st.importa;
  const testa = `<div class="riga-titolo"><h2>${tr('Importare {n} eventi?',{n:I.ok.length})}</h2>${chiudiBtn('admin')}</div>`;
  const corpo = `<p class="meta">${I.ok.length===I.tot ? tr('Nel file ci sono {n} eventi nuovi.',{n:I.tot}) : tr('Nel file ci sono {t} eventi: {n} sono nuovi e validi, gli altri ci sono già o mancano di dati.',{t:I.tot, n:I.ok.length})}</p>
    <div class="tasti"><button class="tasto sec" data-az="admin">${tr('Annulla')}</button><button class="tasto pri" data-az="importa-ok" ${I.ok.length?'':'disabled'}>${tr('Importa')}</button></div>`;
  return foglio('forte', testa, corpo);
}
/* form on-grid dell'admin (stessi campi e controlli dell'app online) */
const maxDt = () => { const d = new Date(); d.setMonth(d.getMonth()+20); return d; };
const dtLocal = d => ymd(d)+'T'+hm(d);
function apriAdminForm(raw){
  const sub = raw && S[raw.category] ? (S[raw.category].sub.find(s => s.label===raw.sublayer)||{}).id||'' : '';
  st.aform = raw ? {id:raw.id, raw, titolo:raw.title||'', strato:raw.category||'', sub, desc:raw.description||'', dt:raw.datetime||'', durata:raw.duration||'', prezzo:raw.price||'', link:raw.link||'', img:raw.image||'', indirizzo:raw.address||'', addrFull:raw.addressFull||raw.address||'', pos:{lat:+raw.lat, lng:+raw.lng}, precision:raw.addrPrecision||'exact', hn:raw.addrNum||'', nascosto:!!raw.hidden, pw:raw.hiddenPassword||'', err:{}}
    : {id:null, raw:null, titolo:'', strato:'', sub:'', desc:'', dt:'', durata:'', prezzo:'', link:'', img:'', indirizzo:'', addrFull:'', pos:null, precision:'', hn:'', nascosto:false, pw:'', err:{}};
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
    ${campo('a-img', tr('Immagine'), `<div class="campo"><input id="a-img" type="url" inputmode="url" data-acampo="img" value="${esc(f.img)}" placeholder="https://"></div>`, '', tr('facoltativo'))}
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
    lookup(parseAddr(q).city ? q : q+', '+cittaObj().n, null, true).then(res => { if(st.aform!==f) return;
      if(res.list.length){ const r = res.list[0]; f.indirizzo = testoRisultato(r); f.addrFull = f.indirizzo; f.precision = r.precision||'exact'; f.hn = r.hn||''; f.pos = {lat:r.lat, lng:r.lng}; disegnaFoglio(); }
      else { f.err.indirizzo = 2; disegnaFoglio(); } });
    return;
  }
  if(!f.pos) E.indirizzo = 1;
  if(Object.keys(E).length){ disegnaFoglio(); const c = document.querySelector('#foglio-slot .errore'); if(c && c.scrollIntoView) c.scrollIntoView({block:'center', behavior:'smooth'}); return; }
  const l = S[f.strato], sublayer = (l.sub.find(s => s.id===f.sub)||{}).label||'';
  const campi = {title:t, category:f.strato, sublayer, description:f.desc.trim(), datetime:f.dt, duration:f.durata.trim(), end:'', price:f.prezzo.trim(), link:f.link.trim(), image:f.img.trim(),
    hidden:f.nascosto, hiddenPassword:f.nascosto ? f.pw.trim() : '', offgrid:false, address:f.indirizzo.trim(), addressFull:f.addrFull||f.indirizzo.trim(), addrPrecision:f.precision||'exact', addrNum:f.hn||'', lat:f.pos.lat, lng:f.pos.lng};
  let id = f.id;
  if(f.id){ const ev = rawById(f.id); if(ev) Object.assign(ev, campi); }
  else { id = Date.now().toString(); events.push(Object.assign({id}, campi)); }
  if(campi.hidden) st.sbloccati.add(campi.hiddenPassword);
  saveEvents(); ricostruisci(); st.aform = null;
  const e = byId(id); if(e && !visibile(e)){ st.tempo = 'tutto'; st.salvatiSolo = false; if(e.strato) st.strati.add(e.strato); st.tipi.evento = true; }
  selezionaEv(id);
}

/* ======================= Guida alla prima apertura ======================= */
const GUIDA = () => [
  {t:tr('Benvenuto su Agorapp'), d:tr('La mappa degli eventi della città. Il cerchio è un evento, il doppio cerchio una pratica, il quadrato un incontro di un’istanza, il verde pieno un tuo appuntamento. Qui li accendi e spegni.'), el:'tipiMappa'},
  {t:tr('Scegli cosa vedere'), d:tr('Gli Strati sono in fondo alla mappa, i giorni in alto: quello che cambi lo vedi subito sui segnaposto.'), el:'peek'},
  {t:tr('I tuoi appuntamenti'), d:tr('Con «+ Off-Grid», o tenendo premuto un punto della mappa, aggiungi un tuo evento. Resta solo su questo telefono.'), el:'btnNuovo'}
];
function disegnaGuida(){
  document.querySelectorAll('.evidenzia').forEach(x => x.classList.remove('evidenzia'));
  const slot = $('guida-slot');
  if(st.guida==null){ slot.innerHTML = ''; return; }
  const G = GUIDA(), g = G[st.guida];
  if(g.el && $(g.el)) $(g.el).classList.add('evidenzia');
  slot.innerHTML = `<div class="guida vetro" role="dialog" aria-label="${esc(tr('Guida'))}"><div class="passi">${G.map((_,i) => `<span class="${i===st.guida?'on':''}"></span>`).join('')}</div><h3>${g.t}</h3><p>${g.d}</p>
    <div class="tasti"><button class="tasto sec" data-az="guida-salta">${st.guida===G.length-1?tr('Chiudi'):tr('Salta')}</button>${st.guida<G.length-1?`<button class="tasto pri" data-az="guida-avanti">${tr('Avanti')}</button>`:`<button class="tasto pri" data-az="guida-salta">${tr('Inizia')}</button>`}</div></div>`;
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
  if(!e.suMappa){ if(e.tipo==='istanza' && window.AGR.agora && DEMO) window.AGR.agora.apriTavolo(e.raw.parentId, e.raw.tavolo); else apriCalendario('giornata', e.giorno); return; }
  if(!visibile(e) && !modoGiornata()){
    if(!finito(e)) st.tempo = 'tutto'; else st.finiti = true; st.salvatiSolo = false; st.tipi[e.tipo] = true;
    if(e.strato && S[e.strato]) st.strati.add(e.strato); st.subOff.delete(e.strato+'|'+e.sub); st.preset = -1; st.prezzo = 'tutti'; st.lente = null;
    if(e.nascosto) st.nascostiOn = true;
  }
  st.sel = id; st.foglio = 'scheda'; st.cercaQui = null; st.descAperta = false;
  tutto(); disegnaFoglio();
  requestAnimationFrame(() => inquadra(e.lat, e.lng, 14));
}
function apriCalendario(vista, giorno){
  st.cal.vista = vista || st.cal.vista; if(giorno){ st.cal.giorno = giorno; }
  if(!st.cal.giorno) st.cal.giorno = oggi();
  const d = dIso(st.cal.giorno); st.cal.y = d.getFullYear(); st.cal.m = d.getMonth();
  st.sel = null; apri('calendario'); requestAnimationFrame(() => { if(modoGiornata()) inquadraTutti(giornata(st.cal.giorno).vive); });
}

/* ======================= Sezioni (Progetti, Agorà, Temi arrivano nei prossimi passi) ======================= */
function paginaVuota(k){
  const T = {progetti:[tr('Progetti'), tr('Le pratiche collettive della città, con le loro bacheche.')], agora:[tr('Agorà'), tr('Le istanze dal basso, con i loro tavoli.')], temi:[tr('Temi'), tr('Le passerelle tra le sezioni: strati, temi e lenti.')]}[k];
  return `${k!=='temi'?`<div class="anteprima" role="note"><b>${tr('Anteprima')}</b><span>${tr('Iscrizioni non ancora aperte: i contenuti sono d’esempio.')}</span></div>`:''}<div class="pagina-vuota"><h1>${T[0]}</h1><p class="meta">${T[1]}</p><p class="meta">${tr('Questa sezione arriva nei prossimi passi del restyling.')}</p></div>`;
}
function vaiSezione(s, daNav){
  if(st.pieno) return;
  const stessa = st.sezione===s;
  if(st.foglio || st.posa){ st.posa = null; disegnaPosa(); st.foglio = null; st.sel = null; st.gruppo = null; st.form = null; st.aform = null; st.conferma = null; st.pdf = null; }
  disegnaFoglio();
  st.sezione = s; $('app').dataset.sez = s;
  $('area').hidden = s!=='mappa';
  ['progetti','agora','temi'].forEach(k => { $('pagina-'+k).hidden = s!==k; });
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
  tingi(); if(map && mappaOk){ try{ map.updateImage('agr-tratteggio', immagineTratteggio()); map.setPaintProperty('agr-vuoti-bordo','line-color', t==='dark'?'#B5A998':'#5C5246'); }catch(e){} }
  if(modoGiornata()) disegnaPins();
}
function testiFissi(){
  document.documentElement.lang = lang; document.documentElement.dir = lang==='ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = tr(el.getAttribute('data-t')); });
  $('cercaLbl').textContent = tr('Cerca eventi, luoghi, indirizzi');
  $('btnHome').setAttribute('aria-label', tr('Agorapp: torna alla vista della città'));
  $('btnCitta').setAttribute('aria-label', tr('Scegli città o zona'));
  $('btnImpo').setAttribute('aria-label', tr('Impostazioni'));
  $('btnGps').setAttribute('aria-label', tr('Mostra dove sono'));
  $('btnNuovo').setAttribute('aria-label', tr('Nuovo evento Off-Grid'));
  $('zPiu').setAttribute('aria-label', tr('Avvicina')); $('zMeno').setAttribute('aria-label', tr('Allontana'));
  $('chips').setAttribute('aria-label', tr('Quando')); $('tipiMappa').setAttribute('aria-label', tr('Che cosa vedi sulla mappa'));
  $('navBassa').setAttribute('aria-label', tr('Navigazione principale'));
  $('cittaLbl').innerHTML = esc(cittaObj().n)+' '+giuPiccola;
}
function applicaLingua(l){ lang = l; LS.set('agorapp_lang', l); testiFissi(); ricostruisci(); tutto(); disegnaFoglio(); if(st.sezione!=='mappa') vaiSezione(st.sezione); }
