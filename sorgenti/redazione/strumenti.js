/* ======================= Strumenti della Redazione (T-033) =======================
   Questo file e gli altri di sorgenti/redazione/ entrano soltanto nell'app della redazione (dist/redazione/): il
   montaggio li mette dentro lo stesso modulo dell'app, prima delle interazioni (app6.js). L'app pubblica non ne
   contiene una riga (libro mastro, § 2.4, «Due app dallo stesso codice»; § 3.11).

   L'app della redazione si apre già con gli strumenti: non c'è più una password scritta nel codice. Chi può aprirla
   lo decide l'indirizzo protetto (Fase 2); chi può pubblicare lo decide la firma (T-034, blocco 9).

   I pezzi comuni chiamano da qui, dentro i tratti riservati all'app della redazione: FOGLI_RED (i fogli), clickRed, azioneRed, inputRed,
   cambioRed (le interazioni), boxAdmin (il riquadro nella scheda). */
const CHIAVI = MODULI.chiavi.crea({deposito:MEM.base});   /* chiavi, cassaforte e marcatore (sorgenti/moduli/chiavi.js) */
/* il riquadro della Redazione nella scheda di un evento: dal blocco 9 gli eventi pubblicati si correggono e si ritirano da «Pubblicazione» */
const boxAdmin = e => '';
function fAdmin(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Strumenti della redazione')}</h2><p class="meta">${tr('Solo per chi pubblica gli eventi raccolti')}</p></div>${chiudiBtn()}</div>`;
  const ch = CH.stato, statoChiavi = !ch ? tr('Un attimo…') : ch.ci_sono ? tr('Dispositivo: {d}',{d:esc(ch.dispositivo)}) : ch.revocata ? tr('Revocate su questo dispositivo') : tr('Da creare: servono per salvare e pubblicare gli eventi');
  const corpo = `<button class="riga-int mz-voce" data-az="admin-misure"><span class="mz-tondo-v" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2.5 15.5h13M4.5 13V9M8 13V4.5M11.5 13V7M15 13V10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></span><div><span class="t">${tr('Misure')}</span><span class="meta">${tr('Il polso della città: offerta, rete, accessi, qualità. Senza guardare le persone.')}</span></div>${freccia}</button>
    <div class="menu-lista">
      <button class="menu-r" data-az="pubblica">${icoCal()}<div><span class="t">${tr('Pubblicazione')}</span><span class="meta">${tr('Eventi pubblicati, nuovo evento, correzione, sospensione, ritiro e storico')}</span></div>${freccia}</button>
      <button class="menu-r" data-az="admin-importa">${icoImporta}<div><span class="t">${tr('Importa eventi da Excel')}</span><span class="meta">${tr('File .xlsx (vanno bene anche .ods e .csv): una riga per evento')}</span></div>${freccia}</button>
      <button class="menu-r" data-az="admin-modello">${icoNote}<div><span class="t">${tr('Scarica il modello Excel')}</span><span class="meta">${tr('Le colonne giuste, una riga d’esempio e l’elenco degli strati')}</span></div>${freccia}</button>
      <button class="menu-r" data-az="admin-esporta">${icoEsporta}<div><span class="t">${tr('Esporta in Excel')}</span><span class="meta">${tr('Gli eventi on-grid di questo dispositivo')}</span></div>${freccia}</button></div>
    <div class="menu-lista">
      <button class="menu-r" data-az="chiavi">${icoLucchetto(16)}<div><span class="t">${tr('Chiavi')}</span><span class="meta">${statoChiavi}</span></div>${freccia}</button>
      <button class="menu-r" data-az="verifica">${icoNote}<div><span class="t">${tr('Viene dal nostro archivio?')}</span><span class="meta">${tr('Controlla un identificativo o un file copiato')}</span></div>${freccia}</button></div>
    <button class="riga-int" data-az="admin-storico"><div><span class="t">${tr('Storico delle operazioni')}</span><span class="meta">${(n => n ? (n===1 ? tr('1 operazione registrata su questo dispositivo') : tr('{n} operazioni registrate su questo dispositivo',{n:nf(n)})) : tr('Cosa hai fatto e quando, su questo dispositivo'))(storico().length)}</span></div>${freccia}</button>
    <p class="meta">${tr('Per una copia completa, con i tuoi Off-Grid:')} <button class="link" style="min-height:32px" data-az="admin-esporta-json">${tr('esporta in JSON')}</button></p>
    ${st.msgAdmin?`<p class="meta" role="status" style="color:var(--testo)">${esc(st.msgAdmin)}</p>`:''}
    ${st.ultimoId?`<p class="meta">${tr('Identificativo')}: <code class="red-id">${esc(st.ultimoId)}</code> <button class="link" style="min-height:32px" data-az="copia-id">${st.idCopiato?tr('Copiato'):tr('Copia')}</button></p>`:''}
    ${st.eliminati.length?`<p class="meta">${tr('Eliminati in questa sessione: {n}.',{n:st.eliminati.length})} <button class="link" style="min-height:32px" data-az="ripristina">${tr('Ripristina')}</button></p>`:''}`;
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
   La libreria (SheetJS) viaggia soltanto con l'app della redazione e si carica solo quando serve. */
const URL_XLSX = 'lib/sheetjs-0.18.5/xlsx.full.min.js';
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
      : I.fase==='salvo' ? `<p class="caricamento">${tr('Salvo gli eventi…')}</p>`
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
/* ======================= Agganci dai pezzi comuni ======================= */
const FOGLI_RED = {admin:fAdmin, importa:fImporta, aform:fEventoForm, chiavi:fChiavi, verifica:fVerifica, pubblica:fPubblica, 'pb-evento':fPbEvento, 'pb-storico':fPbStorico, 'pb-copia':fPbCopia};
/* un tocco: true se era per gli strumenti della Redazione */
function clickRed(t){
  if(t.dataset.mz!=null && clickMisure(t)) return true;
  if(clickPubblica(t)) return true;
  return false;
}
function azioneRed(az, t){
  if(azioneChiavi(az, t)) return;
  if(azionePubblica(az, t)) return;
  switch(az){
    case 'scegli-mappa-a': iniziaPosa('aform'); break;
    case 'copia-id': if(st.ultimoId) copiaTesto(st.ultimoId).then(ok => { st.idCopiato = !!ok; if(st.foglio==='admin') disegnaFoglio(); }); break;
    case 'admin': st.importa = null; st.aform = null; if(st.sezione!=='mappa') vaiSezione('mappa'); apri('admin'); break;
    case 'admin-misure': apriMisure(); break;
    case 'admin-modello': scaricaModello(); break;
    case 'admin-esporta-json': esporta(); registra('esporta-json'); break;
    case 'admin-storico': SH.filtro = 'tutte'; SH.mostrati = 60; SH.conferma = false; foglioStorico(); break;
    case 'admin-importa': $('fileImporta').click(); break;
    case 'importa-annulla': st.importa = null; apri('admin'); break;
    case 'importa-ok': { const I = st.importa; if(!I || I.fase!=='pronto') break;
      /* gli eventi nuovi ricevono l'identificativo con il marcatore (T-037); gli Off-Grid di una copia in JSON tengono il loro */
      I.fase = 'salvo'; disegnaFoglio();
      Promise.all(I.ok.map(ev => ev.personal || ev.offgrid || MODULI.chiavi.ID.test(String(ev.id)) ? null : CHIAVI.nuovoId().then(id => { ev.id = id; }))).then(() => { if(st.importa!==I) return;
        const n = I.ok.length; registra('importa', {n}); events = events.concat(I.ok); saveEvents(); ricostruisci(); st.importa = null; st.msgAdmin = tr('Importati {n} nuovi eventi.',{n}); apri('admin'); tutto();
      }).catch(() => { if(st.importa!==I) return; st.importa = null; st.msgAdmin = tr('Per salvare un evento servono le chiavi della Redazione: Strumenti della redazione → Chiavi.'); apri('admin'); });
      break; }
    case 'admin-esporta': esportaExcel(); break;
    case 'ripristina': if(st.eliminati.length){ registra('ripristina', {n:st.eliminati.length}); st.eliminati.forEach(x => { events.push(x.raw); if(x.cal) calEvents[x.raw.id] = true; }); st.eliminati = []; saveEvents(); saveCal(); ricostruisci(); $('toast').hidden = true; tutto(); if(st.foglio==='admin') disegnaFoglio(); } break;
  }
}
/* un campo dei moduli della Redazione: true se era suo */
function inputRed(el){
  if(inputChiavi(el)) return true;
  if(inputPubblica(el)) return true;
  return false;
}
function cambioRed(el){ return cambioPubblica(el); }
$('fileImporta').addEventListener('change', function(){ const f = this.files && this.files[0]; if(f) leggiImport(f); this.value = ''; });
