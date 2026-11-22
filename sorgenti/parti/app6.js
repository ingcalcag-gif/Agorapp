
/* ======================= Interazioni ======================= */
$('app').addEventListener('click', ev => {
  const t = ev.target.closest('button,[data-az]');
  if(!t || t.disabled) return;
  if(t.tagName==='A') return;
  if(t.closest('.sez-temi') && clickTemi(t)) return;
  if(t.closest('.sez-agora,.sez-progetti,.sez-proposta')) return;
  /*@red*/if(clickRed(t)) return;   /* strumenti della Redazione (sorgenti/redazione/) *//*@fine*/
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
    const pre = /*@red*/sugg.dove==='a' ? 'a' : /*@fine*/'f', r = sugg.lista[i], f = /*@red*/pre==='a' ? st.aform : /*@fine*/st.form; if(!r || !f) return;
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
    case 'sblocca': { const pw = ($('pw').value||'').trim(); const e = pw && events.find(x => x.hidden && x.hiddenPassword===pw);
      if(e){ st.sbloccati.add(pw); st.nascostiOn = true; $('pw').value = ''; disegnaFoglio(); tutto(); } else { const er = $('pw-err'); if(er) er.hidden = false; } break; }
    case 'citta': apri('citta'); break;
    case 'impostazioni': st.sel = null; /*@red*/st.msgAdmin = null; /*@fine*/apri('impostazioni'); break;
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
    /*@red*/default: azioneRed(d.az, t);/*@fine*/
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
  /*@red*/if(inputRed(el)) return;/*@fine*/
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
  /*@red*/if(cambioRed(el)) return;/*@fine*/
  if(!st.form) return;
  const c = el.dataset.campo;
  if(c==='rep' || c==='giorno' || c==='fino'){ st.form[c] = el.value; if(c==='giorno' && el.value && (!st.form.fino || st.form.fino < el.value)) st.form.fino = piuMesi(el.value,3); disegnaFoglio(); }
});
$('foglio-slot').addEventListener('keydown', ev => {
  if(ev.key!=='Enter') return;
  if(ev.target.id==='tz-nome'){ ev.preventDefault(); const b = document.querySelector('[data-tz="salva-ok"]'); if(b) b.click(); return; }
  if(ev.target.id==='pw'){ ev.preventDefault(); document.querySelector('[data-az="sblocca"]').click(); }
  else if(ev.target.id==='q'){ ev.preventDefault(); clearTimeout(sugg.t); cercaInvio(); }
  else if(ev.target.id==='f-indirizzo'/*@red*/ || ev.target.id==='a-indirizzo'/*@fine*/){ ev.preventDefault(); const b = document.querySelector('#'+ev.target.id.charAt(0)+'-sugg [data-si]'); if(b) b.click(); }
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
const nonDisturba = () => !paginaInUscita && document.visibilityState==='hidden' && !st.foglio && !st.form && /*@red*/!st.aform && /*@fine*/!st.posa && st.guida==null && st.sezione==='mappa';
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
    archivio:() => ({zona:[...ZONA.ids].sort(), lontano:ZONA.lontano, conservati:ARCHIVIO ? ARCHIVIO.quadrantiConservati().sort() : [], pubblici:EV.filter(e => e.archivio).length}),
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
