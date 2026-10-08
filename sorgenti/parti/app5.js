
/* ======================= Impostazioni, documenti, città ======================= */
/*@@LEGALI@@*/
function fImpostazioni(){
  const scuro = temaAttuale()==='dark';
  const testa = `<div class="riga-titolo"><h2>${tr('Impostazioni')}</h2>${chiudiBtn()}</div>`;
  const corpo = `
    <section class="sezione"><div class="tipo">${tr('Aspetto')}</div><div class="seg" role="group"><button data-tema-set="light" aria-pressed="${!scuro}">${tr('Chiaro')}</button><button data-tema-set="dark" aria-pressed="${scuro}">${tr('Scuro')}</button></div>
      <button class="riga-int" data-az="semplice" aria-pressed="${st.semplice}"><div><span class="t">${tr('Modalità semplice')}</span><span class="meta">${tr('Testi più grandi e meno comandi: niente sottocategorie e combinazioni.')}</span></div><span class="interr" aria-hidden="true"></span></button></section>
    <section class="sezione" id="sez-demo"><div class="tipo">${tr('Prova Agorapp')}</div>${bloccoDemo()}</section>
    <section class="sezione"><div class="tipo">${tr('Lingua')}</div><div class="seg" role="group">${['it','en','es','fr','ar'].map(l => `<button data-lingua="${l}" aria-pressed="${lang===l}" lang="${l}">${l.toUpperCase()}</button>`).join('')}</div></section>
    <section class="sezione"><div class="tipo">${tr('Aiuto')}</div><div class="menu-lista"><button class="menu-r" data-az="guida">${icoNote}<div><span class="t">${tr('Rivedi la guida')}</span><span class="meta">${tr('I cartellini che compaiono alla prima apertura')}</span></div>${freccia}</button><button class="menu-r" data-az="aiuto-og">${GLIFO_OG}<div><span class="t">${tr('Che cos’è un evento Off-Grid?')}</span></div>${freccia}</button></div></section>
    <section class="sezione"><div class="tipo">${tr('Documenti')}</div><div class="menu-lista">
      <button class="menu-r" data-legale="privacy"><div><span class="t">${tr('Informativa sulla privacy')}</span><span class="meta">${tr('Conforme GDPR · v1.2 · marzo 2026')}</span></div>${freccia}</button>
      <button class="menu-r" data-legale="storage"><div><span class="t">${tr('Dati locali')}</span><span class="meta">${tr('Cosa resta su questo telefono')}</span></div>${freccia}</button>
      <button class="menu-r" data-legale="disclaimer"><div><span class="t">${tr('Note legali')}</span><span class="meta">${tr('Accuratezza, manifestazioni, responsabilità')}</span></div>${freccia}</button></div>
      <p class="meta">${tr('Scrivici')}: <a class="mail" href="mailto:info@agorapp.it">info@agorapp.it</a></p></section>
    <section class="sezione"><div class="tipo">${tr('Area riservata')}</div>
      ${st.admin ? `<button class="riga-int" data-az="admin"><div><span class="t">${tr('Sei in modalità admin')}</span><span class="meta">${tr('Eventi on-grid, importa ed esporta in Excel, esci')}</span></div>${freccia}</button>`
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
    <p class="meta">${tr('La città scelta resta su questo telefono. Il logo Agorapp riporta sempre alla vista della città.')}</p>
    ${bloccoCittaVoglio()}`;
  return foglio('forte alto', testa, corpo);
}
function applicaCitta(id, anima){
  citta = CITTA.find(x => x.id===id) ? id : 'torino'; LS.set('agorapp_city', citta);
  $('cittaLbl').innerHTML = esc(cittaObj().n)+' '+giuPiccola; document.title = 'Agorapp — '+cittaObj().n;
  vaiCitta(anima);
}

/* ======================= Admin ======================= */
function fAdmin(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Modalità admin')}</h2><p class="meta">${tr('Solo per chi pubblica gli eventi raccolti')}</p></div>${chiudiBtn()}</div>`;
  const corpo = `<button class="riga-int mz-voce" data-az="admin-misure"><span class="mz-tondo-v" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2.5 15.5h13M4.5 13V9M8 13V4.5M11.5 13V7M15 13V10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></span><div><span class="t">${tr('Misure')}</span><span class="meta">${tr('Il polso della città: offerta, rete, accessi, qualità. Senza guardare le persone.')}</span></div>${freccia}</button>
    <div class="menu-lista">
      <button class="menu-r" data-az="admin-ongrid">${icoCal()}<div><span class="t">${tr('Nuovo evento on-grid')}</span><span class="meta">${tr('Form completo, con strato, sottocategoria, prezzo e indirizzo')}</span></div>${freccia}</button>
      <button class="menu-r" data-az="admin-importa">${icoImporta}<div><span class="t">${tr('Importa eventi da Excel')}</span><span class="meta">${tr('File .xlsx (vanno bene anche .ods e .csv): una riga per evento')}</span></div>${freccia}</button>
      <button class="menu-r" data-az="admin-modello">${icoNote}<div><span class="t">${tr('Scarica il modello Excel')}</span><span class="meta">${tr('Le colonne giuste, una riga d’esempio e l’elenco degli strati')}</span></div>${freccia}</button>
      <button class="menu-r" data-az="admin-esporta">${icoEsporta}<div><span class="t">${tr('Esporta in Excel')}</span><span class="meta">${tr('Gli eventi on-grid di questo telefono, senza la demo')}</span></div>${freccia}</button></div>
    <button class="riga-int" data-az="admin-storico"><div><span class="t">${tr('Storico delle operazioni')}</span><span class="meta">${(n => n ? (n===1 ? tr('1 operazione registrata su questo telefono') : tr('{n} operazioni registrate su questo telefono',{n:nf(n)})) : tr('Cosa hai fatto e quando, su questo telefono'))(storico().length)}</span></div>${freccia}</button>
    <p class="meta">${tr('Per una copia completa, con i tuoi Off-Grid:')} <button class="link" style="min-height:32px" data-az="admin-esporta-json">${tr('esporta in JSON')}</button></p>
    <p class="meta">${tr('La demo ora è per tutti: Impostazioni → Prova Agorapp.')}</p>
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
  /* con la demo si vede qualcosa: se gli strati sono tutti spenti, si accendono */
  if(!st.strati.size){ LAYERS.forEach(l => st.strati.add(l.id)); st.preset = -1; salvaStrati(); }
  st.demoMsg = tr('Demo caricata: {n} eventi e {o} Off-Grid. Date spostate di {g} giorni.',{n:dd.eventi.length, o:dd.offgrid.length, g:giorni});
  tutto(); disegnaFoglio(); ridisegnaSezioni();
}
function ridisegnaSezioni(){
  const mod = st.sezione==='agora' ? window.AGR.agora : st.sezione==='progetti' ? window.AGR.progetti : null;
  if(mod) mod.ridisegna(); if(st.sezione==='temi') disegnaTemi();
}
/* il blocco della demo nelle Impostazioni: un solo tasto, Carica o Togli */
function bloccoDemo(){
  const nDemo = events.filter(e => e.demo).length, on = !!(DEMO || nDemo);
  return `<p class="meta">${on ? tr('{n} eventi d’esempio su questo telefono, con progetti e istanze. I tuoi eventi restano.',{n:nDemo}) : tr('Eventi, pratiche, istanze, progetti e Off-Grid d’esempio, con le date spostate a oggi: per vedere come funziona Agorapp. Restano solo su questo telefono.')}</p>
    <button class="tasto ${on?'sec':'pri'} pieno" data-az="demo">${on ? croce + tr('Togli la demo') : icoDemo + tr('Carica la demo')}</button>
    ${st.demoMsg?`<p class="meta" role="status" style="color:var(--testo)">${esc(st.demoMsg)}</p>`:''}`;
}
function togliDemo(silenzio){
  const ids = new Set(events.filter(e => e.demo).map(e => e.id));
  events = events.filter(e => !e.demo); ids.forEach(id => delete calEvents[id]);
  LS.del('agorapp_demo'); DEMO = null; saveEvents(); saveCal(); ricostruisci();
  if(!silenzio){ st.demoMsg = tr('Demo tolta: {n} eventi d’esempio cancellati.',{n:ids.size}); tutto(); disegnaFoglio(); ridisegnaSezioni(); }
}
function esporta(){
  const dati = events.filter(e => !e.demo && !e.fata);   /* gli eventi ricevuti con un pacchetto non escono dal telefono */
  const blob = new Blob([JSON.stringify({events:dati, exportedAt:new Date().toISOString()}, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'agorapp_'+oggi()+'.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  st.demoMsg = tr('Esportati {n} eventi.',{n:dati.length}); disegnaFoglio();
}
/* ======================= Excel: importa, modello, esporta ======================= */
/* Il formato è .xlsx (Office Open XML): lo aprono e lo creano Excel, LibreOffice, Google Fogli e Numbers.
   La libreria (SheetJS) si scarica solo quando l'admin la usa. */
const COLONNE = ['Titolo','Strato','Sottostrato','Descrizione','Data','Ora inizio','Ora fine','Durata','Prezzo','Indirizzo','Latitudine','Longitudine','Link','Immagine','Nascosto','Password','Provenienza'];
const ALIAS = {titolo:['title','nome','evento'], strato:['category','categoria','layer'], sottostrato:['sublayer','sottocategoria'], descrizione:['description','descr'], data:['date','giorno'],
  'ora inizio':['ora','inizio','orario','time','start'], 'ora fine':['fine','end'], durata:['duration'], prezzo:['price','costo'], indirizzo:['address','luogo','dove'],
  latitudine:['lat','latitude'], longitudine:['lng','lon','long','longitude'], link:['url','sito'], immagine:['image','img','foto'], nascosto:['hidden'], password:['parola segreta'], provenienza:['fonte','origine','source','flusso']};
const normT = x => String(x==null?'':x).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
function chiaveColonna(h){
  const n = normT(h); if(!n) return null;
  for(const c of COLONNE){ const k = c.toLowerCase(); if(n===normT(c) || (ALIAS[k]||[]).some(a => normT(a)===n)) return k; }
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
    if(iTesta<0){ st.importa = null; st.demoMsg = tr('Nel file non trovo le colonne: scarica il modello Excel e parti da lì.'); apri('admin'); return; }
    const mappa = righe[iTesta].map(chiaveColonna);
    const dati = righe.slice(iTesta+1).map((r, k) => { const o = {riga:iTesta+k+2}; mappa.forEach((c, j) => { if(c) o[c] = r[j]; }); return o; })
      .filter(o => COLONNE.some(c => String(o[c.toLowerCase()]==null?'':o[c.toLowerCase()]).trim()));
    I.tot = dati.length;
    const chiavi = new Set(events.map(e => normT(e.title)+'|'+e.datetime));
    const daCercare = [];
    dati.forEach((o, k) => {
      const no = motivo => I.scarti.push({riga:o.riga, motivo});
      const titolo = String(o.titolo==null?'':o.titolo).trim().slice(0, TITLE_MAX);
      if(!titolo) return no(tr('manca il titolo'));
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
        datetime, end:fine, duration:String(o.durata==null?'':o.durata).trim(), price:String(o.prezzo==null?'':o.prezzo).trim(), link:normLink(String(o.link==null?'':o.link)), image:safeUrl(o.immagine),
        hidden:nascosto, hiddenPassword:nascosto?pw:'', offgrid:false, address:indirizzo, addressFull:indirizzo, addrPrecision:coord?'exact':'', addrNum:'', lat:coord?lat:null, lng:coord?lng:null, importato:true, creato:new Date().toISOString(), provenienza:leggiProv(o.provenienza)};
      if(coord) I.ok.push(ev); else daCercare.push({ev, riga:o.riga});
    });
    I.daCercare = daCercare.length; I.fase = daCercare.length ? 'cerco' : 'pronto'; disegnaFoglio();
    /* gli indirizzi senza coordinate si cercano uno alla volta (Nominatim chiede calma) */
    (async () => {
      for(const x of daCercare){
        if(st.importa!==I) return;
        const q = x.ev.address, pa = parseAddr(q);
        let r = null; try{ const res = await lookup(pa.city ? q : q+', '+cittaObj().n, null, true); r = res.list[0]; }catch(e){}
        if(st.importa!==I) return;
        if(r){ x.ev.lat = r.lat; x.ev.lng = r.lng; x.ev.addressFull = testoRisultato(r); x.ev.addrPrecision = r.precision||'exact'; x.ev.addrNum = r.hn||''; I.ok.push(x.ev); }
        else I.scarti.push({riga:x.riga, motivo:tr('indirizzo non trovato: aggiungi latitudine e longitudine')});
        I.fatti++; if(st.foglio==='importa') disegnaFoglio();
      }
      if(st.importa!==I) return;
      I.fase = 'pronto'; I.scarti.sort((a,b) => a.riga-b.riga); if(st.foglio==='importa') disegnaFoglio();
    })();
  }).catch(() => { if(st.importa!==I) return; st.importa = null; st.demoMsg = tr('Il file non si legge: controlla che sia un foglio .xlsx, .ods o .csv (serve la connessione per aprirlo).'); apri('admin'); });
}
function leggiImportJson(file){
  const r = new FileReader();
  r.onload = e => {
    try{ const d = JSON.parse(e.target.result), imp = Array.isArray(d) ? d : (d.events||[]); const ids = new Set(events.map(x => x.id));
      const ok = imp.filter(x => x && !ids.has(x.id) && typeof x.lat==='number' && typeof x.lng==='number' && x.lat>=-90 && x.lat<=90 && x.lng>=-180 && x.lng<=180 && x.title && x.datetime);
      st.importa = {fase:'pronto', tot:imp.length, ok, scarti:[], avvisi:[], json:true}; apri('importa');
    }catch(err){ st.demoMsg = tr('Il file non si legge: controlla che sia un JSON di Agorapp.'); apri('admin'); }
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
  return ['Concerto nel cortile', m.label, (m.sub[0]||{}).label||'', 'Un pomeriggio di musica dal vivo nel cortile, aperto a tutto il quartiere.', d, '18:30', '20:00', '', 'Gratuito', 'Via Giuseppe Mazzini 10, Torino', '', '', 'https://esempio.it', '', 'no', '', 'Fonte pubblica']; };
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
const LARG = [28,22,24,48,12,10,10,10,12,34,12,12,26,26,10,14,20];
function scaricaModello(){
  const strati = [['Strato','Sottostrato']].concat(...LAYERS.map(l => l.sub.map((x, i) => [i ? '' : l.label, x.label])));
  const istr = [['Come compilare il file'],[''],
    ['Una riga per evento, nel foglio «Eventi». Non cambiare i nomi delle colonne.'],
    ['Obbligatori: Titolo, Strato, Data, Ora inizio, e Indirizzo oppure Latitudine e Longitudine.'],
    ['Strato e Sottostrato: scrivili come nel foglio «Strati».'],
    ['Data: una data (05/11/2026). Ora inizio e Ora fine: 18:30.'],
    ['Indirizzo: via, numero civico e città. Se mancano le coordinate, Agorapp cerca l’indirizzo da sé (uno al secondo).'],
    ['Nascosto: sì o no. Se sì, serve la Password per sbloccarlo.'],
    ['Provenienza (facoltativa): «Consenso diretto» se l’organizzatore ti ha dato il consenso, «Fonte pubblica» se l’evento viene da un sito o una pagina pubblica. Serve alle Misure.'],
    ['Gli eventi già passati, o che ci sono già, non vengono importati.'],
    ['Il file si apre e si salva con Excel, LibreOffice, Google Fogli o Numbers: salvalo in formato .xlsx.']];
  fileExcel([['Eventi', [COLONNE, ESEMPIO()], LARG], ['Strati', strati, [26,30]], ['Istruzioni', istr, [110]]], 'agorapp-modello-eventi.xlsx')
    .then(() => { st.demoMsg = tr('Modello scaricato: agorapp-modello-eventi.xlsx'); disegnaFoglio(); })
    .catch(() => { st.demoMsg = tr('Serve la connessione per preparare il file Excel.'); disegnaFoglio(); });
}
function esportaExcel(){
  const dati = events.filter(e => !e.demo && !e.personal && !e.offgrid && !e.fata);
  const riga = e => { const [g, h] = String(e.datetime||'').split('T'); const S = LAYERS.find(l => l.id===e.category);
    return [e.title||'', S ? S.label : (e.category||''), e.sublayer||'', e.description||'', g ? dIso(g) : '', h||'', e.end ? String(e.end).split('T')[1]||'' : '', e.duration||'', e.price||'', e.addressFull||e.address||'', +e.lat, +e.lng, e.link||'', e.image||'', e.hidden?'sì':'no', e.hidden?(e.hiddenPassword||''):'', e.provenienza==='consenso'?'Consenso diretto':e.provenienza==='pubblica'?'Fonte pubblica':'']; };
  fileExcel([['Eventi', [COLONNE].concat(dati.map(riga)), LARG]], 'agorapp_'+oggi()+'.xlsx')
    .then(() => { registra('esporta-excel', {n:dati.length}); st.demoMsg = tr('Esportati {n} eventi.',{n:dati.length}); disegnaFoglio(); })
    .catch(() => { st.demoMsg = tr('Serve la connessione per preparare il file Excel.'); disegnaFoglio(); });
}
/* form on-grid dell'admin (stessi campi e controlli dell'app online) */
const maxDt = () => { const d = new Date(); d.setMonth(d.getMonth()+20); return d; };
const dtLocal = d => ymd(d)+'T'+hm(d);
function apriAdminForm(raw){
  const sub = raw && S[raw.category] ? (S[raw.category].sub.find(s => s.label===raw.sublayer)||{}).id||'' : '';
  st.aform = raw ? {id:raw.id, raw, titolo:raw.title||'', strato:raw.category||'', sub, desc:raw.description||'', dt:raw.datetime||'', durata:raw.duration||'', prezzo:raw.price||'', link:raw.link||'', img:raw.image||'', indirizzo:raw.address||'', addrFull:raw.addressFull||raw.address||'', pos:{lat:+raw.lat, lng:+raw.lng}, precision:raw.addrPrecision||'exact', hn:raw.addrNum||'', nascosto:!!raw.hidden, pw:raw.hiddenPassword||'', prov:raw.provenienza||'', err:{}}
    : {id:null, raw:null, titolo:'', strato:'', sub:'', desc:'', dt:'', durata:'', prezzo:'', link:'', img:'', indirizzo:'', addrFull:'', pos:null, precision:'', hn:'', nascosto:false, pw:'', prov:'', err:{}};
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
    hidden:f.nascosto, hiddenPassword:f.nascosto ? f.pw.trim() : '', offgrid:false, address:f.indirizzo.trim(), addressFull:f.addrFull||f.indirizzo.trim(), addrPrecision:f.precision||'exact', addrNum:f.hn||'', lat:f.pos.lat, lng:f.pos.lng, provenienza:f.prov||''};
  let id = f.id;
  if(f.id){ const ev = rawById(f.id); if(ev) Object.assign(ev, campi); misureConta('corretti'); registra('modifica', {id:f.id, s:campi.category}); }
  else { id = Date.now().toString(); events.push(Object.assign({id, creato:new Date().toISOString()}, campi)); registra('crea', {id, s:campi.category}); }
  if(campi.hidden) st.sbloccati.add(campi.hiddenPassword);
  saveEvents(); ricostruisci(); st.aform = null; mzFotografa();
  const e = byId(id); if(e && !visibile(e)){ st.tempo = 'tutto'; st.salvatiSolo = false; if(e.strato) st.strati.add(e.strato); st.tipi.evento = true; }
  selezionaEv(id);
}

/* ======================= Guida alla prima apertura ======================= */
const GUIDA = () => [
  {t:tr('Benvenuto su Agorapp'), d:tr('La mappa degli eventi della città. Il cerchio è un evento, il doppio cerchio una pratica, il quadrato un incontro di un’istanza, il verde pieno un tuo appuntamento. Qui li accendi e spegni.'), el:'tipiMappa'},
  {t:tr('Scegli cosa vedere'), d:tr('Gli Strati sono in fondo alla mappa, i giorni in alto: quello che cambi lo vedi subito sui segnaposto.'), el:'peek'},
  {t:tr('I tuoi appuntamenti'), d:tr('Con «+ Off-Grid», o tenendo premuto un punto della mappa, aggiungi un tuo evento. Resta solo su questo telefono.'), el:'btnNuovo'},
  {t:tr('Prova la demo'), d:tr('La demo riempie Agorapp di eventi, pratiche, istanze, progetti e Off-Grid d’esempio, con le date spostate a oggi: serve a vedere come funziona. Gli eventi della demo sono tutti a Torino. Restano solo su questo telefono e i tuoi eventi non si toccano.')+' '+tr('Si accende e si spegne quando vuoi da Impostazioni → Prova Agorapp.'), el:'btnImpo', demo:true}
];
/* ultimo cartellino: la demo, con la scelta subito */
function tastiGuidaDemo(){
  const on = !!(DEMO || events.some(e => e.demo));
  return on
    ? `<button class="tasto sec" data-az="guida-demo-togli">${tr('Spegni la demo')}</button><button class="tasto pri" data-az="guida-salta">${tr('Tienila accesa')}</button>`
    : `<button class="tasto sec" data-az="guida-salta">${tr('No, grazie')}</button><button class="tasto pri" data-az="guida-demo">${tr('Accendi la demo')}</button>`;
}
function disegnaGuida(){
  document.querySelectorAll('.evidenzia').forEach(x => x.classList.remove('evidenzia'));
  const slot = $('guida-slot');
  if(st.guida==null){ slot.innerHTML = ''; return; }
  const G = GUIDA(), g = G[st.guida];
  if(g.el && $(g.el)) $(g.el).classList.add('evidenzia');
  slot.innerHTML = `<div class="guida vetro" role="dialog" aria-label="${esc(tr('Guida'))}"><div class="passi">${G.map((_,i) => `<span class="${i===st.guida?'on':''}"></span>`).join('')}</div><h3>${g.t}</h3><p>${g.d}</p>
    <div class="tasti">${g.demo ? tastiGuidaDemo() : `<button class="tasto sec" data-az="guida-salta">${tr('Salta')}</button><button class="tasto pri" data-az="guida-avanti">${tr('Avanti')}</button>`}</div></div>`;
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
    if(e.strato==='fate'){ FS.on = true; FS.off = FS.off.filter(x => x!==e.raw.fataDa); salvaFS(); } else { if(e.strato && S[e.strato]) st.strati.add(e.strato); st.subOff.delete(e.strato+'|'+e.sub); } st.preset = -1; st.prezzo = 'tutti'; st.lente = null;
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
  $('chips').setAttribute('aria-label', tr('Quando')); $('chipsAvanti').setAttribute('aria-label', tr('Altri tempi')); $('tipiMappa').setAttribute('aria-label', tr('Che cosa vedi sulla mappa'));
  $('navBassa').setAttribute('aria-label', tr('Navigazione principale'));
  $('cittaLbl').innerHTML = esc(cittaObj().n)+' '+giuPiccola;
}
function applicaLingua(l){ lang = l; LS.set('agorapp_lang', l); testiFissi(); ricostruisci(); tutto(); disegnaFoglio(); if(st.sezione!=='mappa') vaiSezione(st.sezione); }
