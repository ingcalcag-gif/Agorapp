
/* ======================= Indirizzi (OG 1.1–1.2: Photon mentre scrivi, Nominatim una volta per il civico) ======================= */
const cacheGeo = {};
let _nomiUltimo = 0;
function nomiGate(){ const w = Math.max(0, _nomiUltimo + 1100 - Date.now()); _nomiUltimo = Date.now() + w; return new Promise(r => setTimeout(r, w)); }
function getJ(u, sig){
  if(cacheGeo[u]) return Promise.resolve(cacheGeo[u]);
  const go = u.indexOf('nominatim.openstreetmap.org')>=0 ? nomiGate() : Promise.resolve();
  return go.then(() => fetch(u, {signal:sig, headers:{'Accept-Language':'it'}})).then(r => { if(!r.ok) throw 0; return r.json(); }).then(j => { cacheGeo[u] = j; return j; });
}
function centro(){ try{ const c = map.getCenter(); return {lat:c.lat, lng:c.lng, z:Math.round(map.getZoom())}; }catch(e){ const c = cittaObj(); return {lat:(c.center||[45.07])[0], lng:(c.center||[0,7.69])[1], z:12}; } }
function vbox(){ try{ const b = map.getBounds(); return '&viewbox='+encodeURIComponent(b.getWest()+','+b.getNorth()+','+b.getEast()+','+b.getSouth()); }catch(e){ return ''; } }
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
const provOf = a => { const m = ((a && a['ISO3166-2-lvl6'])||'').match(/^IT-([A-Z]{2})$/); return m ? m[1] : ''; };
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
function fromNomi(d){
  const a = d.address||{}, street = a.road||a.pedestrian||a.square||a.footway||a.path||'';
  const r = {lat:+d.lat, lng:+d.lon, name:'', street, hn:a.house_number||'', postcode:a.postcode||'', city:a.city||a.town||a.village||a.municipality||'', prov:provOf(a), county:a.county||''};
  const cls = d.class||'', typ = d.type||'';
  if(r.hn && (cls==='place'&&typ==='house' || cls==='building' || !d.name)) r.kind = 'house';
  else if(cls==='highway' || typ==='square') r.kind = 'street';
  else if(cls==='place' || cls==='boundary') r.kind = 'place';
  else { r.kind = 'poi'; r.name = d.name || (d.display_name||'').split(',')[0]; }
  return r;
}
function photon(q, sig){ const c = centro();
  return getJ('https://photon.komoot.io/api/?q='+encodeURIComponent(q)+'&limit=8&lat='+c.lat.toFixed(4)+'&lon='+c.lng.toFixed(4)+'&zoom='+c.z+'&bbox=6.6,36.6,18.6,47.1', sig)
    .then(j => (j.features||[]).map(fromPhoton).filter(Boolean)).catch(() => []); }
function nomiStructured(pa, sig){
  if(!pa.num || !pa.street) return Promise.resolve([]);
  let u = 'https://nominatim.openstreetmap.org/search?street='+encodeURIComponent(pa.num+' '+pa.street)+(pa.city?'&city='+encodeURIComponent(pa.city):'')+'&countrycodes=it&format=json&addressdetails=1&limit=4';
  if(!pa.city) u += vbox();
  return getJ(u, sig).then(d => (d||[]).map(fromNomi)).catch(() => []);
}
function nomiFree(q, sig){ return getJ('https://nominatim.openstreetmap.org/search?q='+encodeURIComponent(q)+'&format=json&addressdetails=1&limit=5&countrycodes=it'+vbox(), sig).then(d => (d||[]).map(fromNomi)).catch(() => []); }
const streetMatches = (r, pa) => { const a = norm(pa.street), b = norm(r.street||r.name); return !!a && !!b && (a===b || b.indexOf(a)>=0 || a.indexOf(b)>=0); };
const cityMatches = (r, pa) => { if(!pa.city) return true; const a = norm(pa.city), b = norm(r.city); return !b || a===b || b.indexOf(a)>=0 || a.indexOf(b)>=0; };
function lookup(q, sig, preciso){
  const pa = parseAddr(q);
  return photon(q, sig).then(ph => {
    if(!preciso) return build(ph, pa);
    return nomiStructured(pa, sig).then(nm => { const all = nm.concat(ph); if(!all.length) return nomiFree(q, sig).then(r => build(r, pa)); return build(all, pa); });
  });
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
function reverseGeo(p){ return getJ('https://nominatim.openstreetmap.org/reverse?lat='+p.lat.toFixed(6)+'&lon='+p.lng.toFixed(6)+'&format=json&zoom=18&addressdetails=1')
  .then(d => { if(!d || !d.address) return ''; return fullLine(fromNomi(d)) || (d.display_name||'').split(',').slice(0,3).join(','); }).catch(() => ''); }
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
  const ev = EV.filter(e => e.suMappa && !sparito(e) && nascostoOk(e) && serieOk(e) && norm([e.titolo, e.luogo, e.desc, e.sub, nomeStrato(e.strato), e.raw.progetto, e.raw.istanza, e.raw.tema].join(' ')).includes(q)).sort((a,b) => a.a-b.a);
  return ev.length ? `<div class="giorno">${tr('Eventi · {n}',{n:ev.length})}</div><div class="lista">${ev.slice(0,12).map(rigaEv).join('')}</div>` : `<p class="meta">${tr('Nessun evento con «{q}».',{q:esc(st.q)})}</p>`;
}
function fCerca(){
  const testa = `<div class="riga-titolo"><h2>${tr('Cerca')}</h2>${chiudiBtn()}</div>
    <label class="campo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="2"/><path d="m20 20-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><input id="q" type="search" enterkeyhint="search" placeholder="${esc(tr('Eventi, luoghi, indirizzi'))}" value="${esc(st.q)}" autocomplete="off"></label>`;
  const sbl = EV.filter(e => e.nascosto && st.sbloccati.has(e.raw.hiddenPassword));
  const corpo = `<div id="risultati" class="stack">${risultatiEventi()}</div><div id="risultati-luoghi" class="stack"></div>
    <div class="fonte avanzato"><span class="meta"><strong style="color:var(--testo)">${tr('Ricerca avanzata')}</strong>: ${tr('periodo, prezzo e strati sono i filtri sopra la mappa, e valgono anche qui.')}</span>
      <div class="tasti"><button class="tasto sec" data-az="date">${icoCal()}${tr('Periodo')}</button><button class="tasto sec" data-az="strati">${icoStrati}${tr('Prezzo e strati')}</button></div></div>
    <div class="fonte"><span class="meta"><strong style="color:var(--testo)">${tr('Ti hanno dato la password di un evento nascosto?')}</strong> ${tr('Inseriscila qui: l’evento compare sulla mappa solo per te.')}</span>
      <div style="display:flex;gap:8px"><label class="campo" style="flex:1"><input id="pw" type="password" placeholder="${esc(tr('Password dell’evento'))}" autocomplete="off"></label><button class="tasto sec" style="flex:none" data-az="sblocca">${icoLucchetto(14)}${tr('Sblocca')}</button></div>
      <span class="err" id="pw-err" hidden>${tr('Nessun evento nascosto con questa password.')}</span>
      ${sbl.length?`<div class="lista">${sbl.map(rigaEv).join('')}</div>`:''}</div>`;
  return foglio('forte alto', testa, corpo);
}
function cercaInvio(){
  const q = st.q.trim(); if(q.length<3) return;
  if(sugg.lista.length && sugg.dove==='cerca') return scegliLuogo(0);
  const el = $('risultati-luoghi'); if(el) el.innerHTML = `<p class="caricamento">${tr('Cerco…')}</p>`;
  lookup(q, null, true).then(res => { if(!$('risultati-luoghi')) return; sugg.lista = res.list; sugg.dove = 'cerca';
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
const AIUTO = () => tr('<p><b>Che cos’è un evento Off-Grid?</b><br>È un tuo appuntamento: vive solo nella memoria di questo dispositivo, non passa da nessun server e nessuno oltre a te può vederlo. Ti serve per organizzare la giornata sulla mappa e nel calendario, accanto agli eventi della città.</p><p><b>Perché non posso ancora pubblicarlo per tutti?</b><br>Pubblicare un evento <i>on-grid</i> vuol dire affidarci i dati tuoi e di chi lo organizza. Oggi Agorapp è un progetto indipendente, senza ancora una società alle spalle in grado di custodirli con le garanzie che meritano: preferiamo non raccoglierli piuttosto che raccoglierli male.</p><p><b>Presto sarà possibile.</b> Ci stiamo lavorando: quando potrai pubblicare i tuoi eventi per tutta la città, sarai tra i primi a saperlo.</p>');
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
function apriFormPunto(p){
  if(st.sezione!=='mappa') return;
  apriForm(null, {pos:p});
  reverseGeo(p).then(a => { if(!st.form || st.form.raw || st.form.pos!==p) return; st.form.indirizzo = a || tr('Punto scelto sulla mappa'); st.form.addrFull = st.form.indirizzo; const el = $('f-indirizzo'); if(el && !el.value) el.value = st.form.indirizzo; aggiornaPunto(); });
}
function boxPunto(f){
  if(!f.pos) return '';
  const T = {exact:[tr('Registriamo questo punto'), tr('Numero civico trovato sulla mappa.'), false],
    street:[tr('Registriamo questo punto · verifica'), tr('Il civico {n} non è presente sulla mappa: il punto è sulla via. Tocca «Scegli sulla mappa» per spostarlo sul portone giusto.',{n:f.hn}), true],
    nonum:[tr('Registriamo questo punto · verifica'), tr('Nessun numero civico: il punto è al centro della via o del luogo. Aggiungi il civico o scegli sulla mappa per essere precisi.'), true],
    map:[tr('Registriamo questo punto'), tr('Punto scelto da te sulla mappa.'), false]}[f.precision||'map'] || [tr('Registriamo questo punto'),'',false];
  return `<div class="punto-ok${T[2]?' avviso':''}"><span style="font-weight:600">${T[0]}</span><span class="meta" style="color:var(--testo)">${T[1]}</span>${f.addrFull||f.indirizzo?`<span class="meta">${esc(f.addrFull||f.indirizzo)}</span>`:''}</div>`;
}
function aggiornaPunto(){ const b = $('f-punto'); if(b && st.form) b.innerHTML = boxPunto(st.form); }
function notaFine(f){
  if(!f.inizio || !f.fine) return '';
  if(f.fine===f.inizio) return `<span class="err">${tr('L’orario di fine coincide con l’inizio: cambialo')}</span>`;
  if(f.fine < f.inizio) return `<span class="stato grigio">${tr('Finisce il giorno dopo: {g} alle {o}',{g:esc(nomeGiorno(piuGiorni(f.giorno,1))), o:f.fine})}</span>`;
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
    <div class="stack-s"><span class="etich">${tr('Giorno')}</span><div class="chips-in"><button class="chip-in" data-fgiorno="${oggi()}" aria-pressed="${f.giorno===oggi()}">${tr('Oggi')}</button><button class="chip-in" data-fgiorno="${domani()}" aria-pressed="${f.giorno===domani()}">${tr('Domani')}</button><label class="campo" style="flex:1;min-height:36px;min-width:150px"><input id="f-giorno" type="date" data-campo="giorno" value="${f.giorno}" aria-label="${esc(tr('Giorno'))}"></label></div></div>
    <div class="stack-s"><div class="due"><div class="stack-s"><label class="etich" for="f-inizio">${tr('Inizio')}</label><div class="campo${f.err.inizio?' errore':''}"><input id="f-inizio" type="time" step="300" data-campo="inizio" value="${f.inizio}"></div></div>
      <div class="stack-s"><label class="etich" for="f-fine">${tr('Fine')}</label><div class="campo"><input id="f-fine" type="time" step="300" data-campo="fine" value="${f.fine}"></div></div></div>
      ${f.err.inizio?`<span class="err">${tr('Indica almeno giorno e orario di inizio')}</span>`:''}<div id="f-fine-nota">${notaFine(f)}</div></div>
    ${!mod?`<div class="stack-s"><label class="etich" for="f-rep">${tr('Ripetizione')}</label><div class="campo"><select id="f-rep" data-campo="rep">${['none','daily','weekdays','weekly','biweekly','monthly'].map(r => `<option value="${r}" ${f.rep===r?'selected':''}>${esc(repLabel(r,f.giorno))}</option>`).join('')}</select></div>
      <div class="due" style="align-items:center"><label class="etich" for="f-fino">${tr('Fino al')}</label><div class="campo${f.rep==='none'?' spento':''}"><input id="f-fino" type="date" data-campo="fino" value="${f.fino}" min="${f.giorno}" max="${piuMesi(f.giorno,12)}" ${f.rep==='none'?'disabled':''}></div></div>
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
    lookup(q, null, true).then(res => { if(st.form!==f) return;
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
    datetime:sdt, end:edt, duration:'', notes:f.note.trim(), description:f.note.trim(), links, link:links[0]||'', offgrid:true, personal:true, category:'', sublayer:'', hidden:false, hiddenPassword:'', price:'', image:''};
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
  const slot = $('posa-slot');
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
    const c = map.getCenter(), p = {lat:c.lat, lng:c.lng}; f.pos = p; f.precision = 'map'; if(f.err) f.err.indirizzo = 0;
    const tenere = f.indirizzo && parseAddr(f.indirizzo).num;
    reverseGeo(p).then(a => { if(f.pos!==p) return; if(!tenere){ f.indirizzo = a || tr('Punto scelto sulla mappa'); } f.addrFull = f.indirizzo; const el = $(chi==='aform'?'a-indirizzo':'f-indirizzo'); if(el) el.value = f.indirizzo; if(chi==='form') aggiornaPunto(); else { const b = $('a-punto'); if(b) b.innerHTML = boxPunto(f); } });
  }
  st.foglio = chi; disegnaFoglio(); posizioni();
}
