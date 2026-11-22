
/* ======================= Impostazioni, documenti, città ======================= */
/*@@LEGALI@@*/
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
    /*@red*/<section class="sezione"><div class="tipo">${tr('Redazione')}</div><button class="riga-int" data-az="admin"><div><span class="t">${tr('Strumenti della redazione')}</span><span class="meta">${tr('Eventi, Excel, Misure, storico, chiavi')}</span></div>${freccia}</button></section>/*@fine*/
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
  if(st.foglio || st.posa){ st.posa = null; disegnaPosa(); st.foglio = null; st.sel = null; st.gruppo = null; st.form = null; /*@red*/st.aform = null; /*@fine*/st.conferma = null; st.pdf = null; }
  disegnaFoglio();
  st.sezione = s; $('app').dataset.sez = s;
  $('area').hidden = s!=='mappa';
  ['progetti','agora','temi'/*@red*/,'misure'/*@fine*/].forEach(k => { $('pagina-'+k).hidden = s!==k; });
  /*@red*/if(s==='misure') disegnaMisure();/*@fine*/
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
