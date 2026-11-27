
/* ======================= Fogli ======================= */
let ultimoFoglio = null;
function apri(f, extra){ st.foglio = f; Object.assign(st, extra||{}); disegnaFoglio(); disegnaPins(); posizioni(); }
function chiudi(){ st.espanso = false; TM.foglio = null; TM.salva = null; st.foglio = null; st.sel = null; st.punto = null; st.copiato = null; st.gruppo = null; st.form = null; /*@red*/st.aform = null; /*@fine*/st.conferma = null; st.pdf = null; st.segn = null; disegnaFoglio(); disegnaPins(); posizioni(); disegnaChips(); }
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
  /*@red*/Object.assign(F, FOGLI_RED);   /* i fogli degli strumenti della Redazione (sorgenti/redazione/) *//*@fine*/
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
        <button class="tasto sec" data-az="togli-nascosto" data-id="${esc(e.id)}">${st.togliNasc===e.id ? tr('Tocca ancora: per rivederlo servirà di nuovo la password') : tr('Togli dal telefono')}</button></div>` : ''}/*@red*/${boxAdmin(e)}/*@fine*/`;
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
  ? (segnProva || (segnProva = MODULI.segnalazioniSportello.crea({deposito:depositoProva()/*@red*/, pacchetto:MODULI.pacchetto/*@fine*/}))) : null;
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
    <p class="meta">${esc(tr('Puoi scrivere anche a {casella}.',{casella:'\u0001'})).split('\u0001').join(casella)} <button class="link" data-legale="informativa">${tr('Informativa sulla privacy')}</button></p>
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
