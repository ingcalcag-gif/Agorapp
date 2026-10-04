
/* ======================= Interazioni ======================= */
$('app').addEventListener('click', ev => {
  const t = ev.target.closest('button,[data-az]');
  if(!t || t.disabled) return;
  if(t.tagName==='A') return;
  if(t.closest('.sez-temi') && clickTemi(t)) return;
  if(t.closest('.sez-agora,.sez-progetti,.sez-proposta')) return;   /* Progetti, Agorà e proposte gestiscono i propri tasti */
  const d = t.dataset;
  if(d.tema){ apriTemi(['t:'+d.tema]); return; }
  if(d.sez){ vaiSezione(d.sez, true); return; }
  if(d.progetto){ window.AGR.progetti.apri(d.progetto); return; }
  if(d.apriTavolo){ const [i,n] = d.apriTavolo.split(':'); window.AGR.agora.apriTavolo(i, +n); return; }
  if(d.apriIstanza){ window.AGR.agora.apriIstanza(d.apriIstanza); return; }
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
    if(r.precision==='street' && r.hn){ const pa = {street:r.street, num:r.hn, city:r.city}, mio = f.pos;
      nomiStructured(pa).then(nm => { if(f.pos!==mio) return; const b2 = build(nm, pa).list.filter(x => x.precision==='exact')[0]; if(b2){ f.indirizzo = testoRisultato(b2); f.addrFull = f.indirizzo; f.precision = 'exact'; f.hn = b2.hn||''; f.pos = {lat:b2.lat, lng:b2.lng}; if(inp) inp.value = f.indirizzo; if(pb) pb.innerHTML = boxPunto(f); } }); }
    return; }
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
  if(d.eliminaAdmin){ const r = rawById(d.eliminaAdmin); if(!r) return; st.eliminati.push({raw:r, cal:inCal(r.id)}); events = events.filter(x => x!==r); delete calEvents[r.id]; saveEvents(); saveCal(); ricostruisci(); chiudi(); tutto(); avviso(tr('Evento eliminato dalla mappa'), {az:'ripristina', l:tr('Annulla')}); return; }
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
    case 'impostazioni': st.sel = null; st.demoMsg = null; st.adminPw = false; st.adminErr = false; apri('impostazioni'); break;
    case 'indietro-impostazioni': apri('impostazioni'); break;
    case 'semplice': st.semplice = !st.semplice; LS.set('agorapp_simple', st.semplice ? '1' : '0'); $('app').classList.toggle('semplice', st.semplice); disegnaFoglio(); tutto(); break;
    case 'guida': chiudi(); vaiSezione('mappa'); st.guida = 0; disegnaGuida(); posizioni(); break;
    case 'guida-avanti': st.guida++; disegnaGuida(); break;
    case 'guida-salta': st.guida = null; disegnaGuida(); LS.set('agorapp_guida','1'); posizioni(); break;
    case 'aiuto-og': apriForm(null, {aiuto:true}); break;
    case 'mostra-admin': st.adminPw = true; st.adminErr = false; disegnaFoglio(); setTimeout(() => { const i = $('adminpw'); if(i) i.focus(); }, 60); break;
    case 'entra-admin': { const v = ($('adminpw')||{}).value||''; if(v===ADMIN_PW){ st.admin = true; st.adminPw = false; st.adminErr = false; st.demoMsg = null; disegnaChips(); apri('admin'); tutto(); } else { st.adminErr = true; disegnaFoglio(); } break; }
    case 'admin': st.importa = null; st.aform = null; apri('admin'); break;
    case 'esci-admin': st.admin = false; st.demoMsg = null; chiudi(); tutto(); break;
    case 'carica-demo': caricaDemo(); break;
    case 'demo': if(DEMO || events.some(e => e.demo)) togliDemo(); else caricaDemo(); break;
    case 'admin-modello': scaricaModello(); break;
    case 'admin-esporta-json': esporta(); break;
    case 'togli-demo': togliDemo(); break;
    case 'admin-ongrid': apriAdminForm(null); break;
    case 'admin-importa': $('fileImporta').click(); break;
    case 'importa-annulla': st.importa = null; apri('admin'); break;
    case 'importa-ok': { if(!st.importa || st.importa.fase!=='pronto') break; const n = st.importa.ok.length; events = events.concat(st.importa.ok); saveEvents(); ricostruisci(); st.importa = null; st.demoMsg = tr('Importati {n} nuovi eventi.',{n}); apri('admin'); tutto(); break; }
    case 'admin-esporta': esportaExcel(); break;
    case 'a-nascosto': st.aform.nascosto = !st.aform.nascosto; disegnaFoglio(); break;
    case 'a-salva': salvaAdmin(); break;
    case 'ripristina': if(st.eliminati.length){ st.eliminati.forEach(x => { events.push(x.raw); if(x.cal) calEvents[x.raw.id] = true; }); st.eliminati = []; saveEvents(); saveCal(); ricostruisci(); $('toast').hidden = true; tutto(); if(st.foglio==='admin') disegnaFoglio(); } break;
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
  initMappa(); tutto();
  if(LS.s('agorapp_guida','0')!=='1'){ st.guida = 0; setTimeout(disegnaGuida, 500); }
  setInterval(() => { const p = purgeExpired(); ricostruisci(); if(st.sezione==='mappa') { disegnaChips(); disegnaPins(); disegnaPeek(); } if(p && st.foglio && ['elenco','calendario'].includes(st.foglio)) disegnaFoglio(); }, 60000);
  window.AGR = Object.assign(window.AGR || {}, {versione:'restyling-3', stato:st, eventi:() => events,
    demo:() => DEMO,
    tr, dloc, lingua:() => lang,
    caricaDemo(){ return caricaDemo(); },
    salvati:{has:id => inCal(id), add:id => { calEvents[id] = true; saveCal(); }, delete:id => { delete calEvents[id]; saveCal(); }},
    foglio(html, scope){ st.foglio = 'html'; st.fHtml = html; st.fScope = scope||''; ultimoFoglio = null; disegnaFoglio(); posizioni(); },
    chiudi(){ chiudi(); },
    aggiorna(){ disegnaChips(); disegnaPeek(); },
    vaiSezione,
    vaiMappa(id){ vaiSezione('mappa'); selezionaEv(id); },
    passerellaStrato(id){ st.strati = new Set([id]); st.subOff.clear(); st.preset = -1; st.tempo = 'tutto'; st.lente = null; st.tipi = {evento:true, pratica:true, istanza:true, og:true}; vaiSezione('mappa'); tutto(); requestAnimationFrame(() => inquadraTutti(visibili())); },
    prossimaPratica(titolo){ return EV.filter(e => e.tipo==='pratica' && e.raw.progetto===titolo && !finito(e)).sort((a,b) => a.a-b.a)[0]; },
    quando(e){ return maiusc(titoloGiorno(e.giorno))+', '+e.inizio+(e.fine?'–'+e.fine:''); },
    breve(e){ return dIso(e.giorno).toLocaleDateString(dloc(), {weekday:'short', day:'numeric', month:'long'}); },
    dati:{strati:LAYERS.map(l => ({id:l.id, label:l.label, pin:l.pin})), temaCol, temiVoc:TEMI_VOC}
  });
  /* «Scarica il PDF» nei fogli di Progetti e Agorà: stampa la carta in anteprima */
  document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-stampa-carta]'); if(!b) return; const c = b.closest('.corpo') && b.closest('.corpo').querySelector('.carta'); if(!c) return;
    const html = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>Agorapp</title><style>body{font-family:Helvetica,Arial,sans-serif;max-width:720px;margin:24px auto;padding:0 16px;color:#1c1712;font-size:13px;line-height:19px}.cm{text-transform:uppercase;letter-spacing:.06em;font-size:11px;color:#5c5246;font-weight:600}.ct{font-family:Georgia,serif;font-size:24px;line-height:30px;margin:4px 0}.pr{display:grid;grid-template-columns:96px 1fr;gap:8px;border-top:1px solid #ddd;padding:6px 0}.cp,.cr{font-size:11px;color:#5c5246;border-top:1px solid #ddd;padding-top:8px;margin-top:6px}svg{max-width:22px}</style></head><body>${c.innerHTML}</body></html>`;
    const url = URL.createObjectURL(new Blob([html], {type:'text/html'})), w = window.open(url, '_blank'); if(w) setTimeout(() => { try{ w.print(); }catch(e){} }, 700); setTimeout(() => URL.revokeObjectURL(url), 60000); });
})();
})();
