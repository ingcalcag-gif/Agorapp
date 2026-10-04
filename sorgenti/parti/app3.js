
/* ======================= Fogli ======================= */
let ultimoFoglio = null;
function apri(f, extra){ st.foglio = f; Object.assign(st, extra||{}); disegnaFoglio(); disegnaPins(); posizioni(); }
function chiudi(){ st.espanso = false; TM.foglio = null; TM.salva = null; st.foglio = null; st.sel = null; st.gruppo = null; st.form = null; st.aform = null; st.conferma = null; st.pdf = null; st.importa = null; disegnaFoglio(); disegnaPins(); posizioni(); disegnaChips(); }
function foglio(cls, testa, corpo){
  const esp = st.espanso;
  return `<section class="foglio vetro ${cls}${esp?' espanso':''}" role="dialog" aria-modal="false"><div class="testa-f"><button class="maniglia-btn" data-az="espandi-foglio" aria-expanded="${esp}" aria-label="${esc(esp ? tr('Riduci il pannello') : tr('Allarga il pannello'))}"><span class="maniglia" aria-hidden="true"></span></button>${testa}</div><div class="corpo">${corpo}</div></section>`;
}
/* il trattino: allarga e riduce il pannello (tocco, o trascinamento in su e in giù) */
function espandiFoglio(v){
  st.espanso = v==null ? !st.espanso : !!v;
  const f = document.querySelector('#foglio-slot .foglio'); if(!f) return;
  f.classList.toggle('espanso', st.espanso); f.style.animation = 'none';
  const b = f.querySelector('.maniglia-btn'); if(b){ b.setAttribute('aria-expanded', st.espanso); b.setAttribute('aria-label', st.espanso ? tr('Riduci il pannello') : tr('Allarga il pannello')); }
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
    scheda:() => fScheda(byId(st.sel)), cerca:fCerca, date:fDate, calendario:fCalendario, pdf:fPdf, form:fForm, aform:fAdminForm, conferma:fConferma,
    impostazioni:fImpostazioni, legale:fLegale, citta:fCitta, admin:fAdmin, importa:fImporta, temi:fTemi,
    html:() => foglio('forte alto', `<div class="riga-titolo"><div></div>${chiudiBtn()}</div>`, `<div class="${esc(st.fScope)}">${st.fHtml}</div>`)
  };
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
    return `<div class="strato-r"><div class="strato-riga">
      <button class="strato-on" data-strato="${s.id}" aria-pressed="${on}" style="--pc:${s.pin}"><span class="ico">${ICO[s.id]}</span><div><span class="t">${esc(tr(s.label))}</span><span class="meta">${n ? (n===1 ? tr('1 in questo periodo') : tr('{n} in questo periodo',{n})) : tr('niente in questo periodo')}</span></div><span class="interr" aria-hidden="true"></span></button>
      <button class="espandi avanzato" data-espandi="${s.id}" aria-expanded="${esp}" aria-label="${esc(tr('Sottocategorie di {s}',{s:tr(s.label)}))}">${giu}</button></div>${subs}</div>`;
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
      ${st.sbloccati.size ? `<button class="riga-int" data-az="nascosti-on" aria-pressed="${st.nascostiOn}"><span class="casella" style="background:var(--testo);border-color:var(--testo);color:var(--fondo)">${icoLucchetto(12)}</span><div><span class="t">${tr('Nascosti che hai sbloccato')} · ${st.sbloccati.size}</span><span class="meta">${tr('Li vedi perché hai la password.')}</span></div><span class="interr" aria-hidden="true"></span></button>` : ''}
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
  return e.tipo==='og' ? (e.serie ? tr('Off-Grid · si ripete') : tr('Off-Grid · tuo'))
    : e.tipo==='pratica' ? tr('Pratica · {p}',{p:e.raw.progetto||''})
    : e.tipo==='istanza' ? tr('Istanza · {i}',{i:e.raw.istanza||''}) : nomeStrato(e.strato);
}
const luogoBreve = e => (e.citta && e.citta!=='Torino' && e.tipo==='istanza') ? e.citta : (e.luogo||'').split(/[·,]/)[0].trim();
function rigaEv(e){
  const n = ora(), inCorso = e.a<=n && e.b>n, fin = finito(e);
  const meta = [luogoBreve(e), sottotitoloEv(e)].filter(Boolean).join(' · ');
  return `<button class="riga-ev" data-ev="${esc(e.id)}"><span class="ora${inCorso?' adesso':''}${fin?' fin':''}">${fin ? tr('finito') : inCorso ? tr('ora') : e.inizio}</span><span style="${fin?'filter:grayscale(1);opacity:.55':''}">${forma(e.tipo,e.strato,28,e.ist)}</span><div><span class="t">${e.nascosto?icoLucchetto(12)+' ':''}${esc(e.titolo)}</span><span class="meta">${esc(meta)}</span></div>${inCal(e.id)&&e.tipo!=='og'?`<span class="sv" aria-label="${esc(tr('Nel calendario'))}">${icoCal()}</span>`:''}</button>`;
}
function perGiorni(lista){ const giorni = [...new Set(lista.map(e => e.giorno))]; return giorni.map(g => `<div class="giorno">${esc(titoloGiorno(g))}</div><div class="lista">${lista.filter(e => e.giorno===g).map(rigaEv).join('')}</div>`).join(''); }
function fElenco(lista, titolo, nota, conCal){
  const corpo = lista.length ? perGiorni(lista) + `<p class="nota">${nota}</p>`
    : `<div class="fatti"><div class="dato">${icoOra}<div><span class="t">${tr('Niente da mostrare')}</span><span class="meta">${EV.length ? tr('Prova un altro periodo o riaccendi qualche strato.') : tr('La mappa è vuota: qui compaiono gli eventi della città e i tuoi Off-Grid.')}</span></div></div></div>`;
  const testa = `<div class="riga-titolo"><div class="stack-s" style="gap:2px"><h2>${esc(titolo)}</h2><p class="meta">${lista.length===1 ? tr('1 cosa') : tr('{n} cose',{n:lista.length})}${conCal ? ' '+tr('sulla mappa') : ''}</p></div>${chiudiBtn()}</div>`;
  return foglio('medio', testa, corpo + (conCal ? `<button class="tasto sec pieno" data-az="calendario">${icoCal()}${tr('Apri il Calendario')}</button>` : ''));
}

/* --- Scheda --- */
function quando(e){
  let stato = ''; const n = ora();
  if(finito(e)){ const sparisce = new Date((getEnd(e.raw)||e.b.getTime()) + EXPIRE_MS); stato = `<span class="stato grigio">${e.fine ? tr('Terminato alle {f}',{f:e.fine}) : tr('Iniziato alle {i}',{i:e.inizio})} · ${tr('sparisce dalla mappa alle {h}',{h:hm(sparisce)})}</span>`; }
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
const indicazioni = e => `https://www.openstreetmap.org/directions?route=%3B${(+e.lat).toFixed(5)}%2C${(+e.lng).toFixed(5)}`;
const tastoIndicazioni = e => `<a class="tasto sec" href="${indicazioni(e)}" target="_blank" rel="noopener">${tr('Indicazioni')}</a>`;
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
const boxAdmin = e => st.admin && e.tipo!=='og' ? `<div class="admin-box"><span class="tipo">Admin</span><div class="tasti"><button class="tasto sec" data-modifica-admin="${esc(e.id)}">${tr('Modifica')}</button><button class="tasto pericolo" data-elimina-admin="${esc(e.id)}">${tr('Elimina')}</button></div></div>` : '';
const hostDi = u => u.replace(/^https?:\/\/(www\.)?/i,'').replace(/\/$/,'');
function fScheda(e){
  if(!e) return '';
  let testa, corpo; const x = e.raw;
  if(e.tipo==='evento'){
    const man = e.strato==='manifestazioni', link = safeUrl(x.link), img = safeUrl(x.image);
    testa = `<div class="riga-titolo"><div class="pill-row">${pillStrato(e)}${pillTema(e)}</div>${chiudiBtn()}</div>
      <div class="scheda-testa"><span style="${finito(e)?'filter:grayscale(1);opacity:.6':''}">${forma('evento',e.strato,40)}</span><div><div class="eyebrow" style="color:var(--testo-2)">${e.nascosto ? icoLucchetto(12)+' '+tr('Evento nascosto, sbloccato con la password') : tr('Evento')}</div><h2>${esc(e.titolo)}</h2></div></div>`;
    corpo = `${img?`<img class="scheda-img" src="${esc(img)}" alt="" loading="lazy" onerror="this.remove()">`:''}<div class="fatti">${quando(e)}
        ${e.luogo?`<div class="dato">${icoLuogo}<div><span class="t">${esc(e.luogo)}</span></div></div>`:''}
        ${e.prezzo?`<div class="dato">${icoPrezzo}<div><span class="t">${esc(formatPrice(e.prezzo))}</span></div></div>`:''}
        ${link?`<div class="dato">${icoLink}<div><a href="${esc(link)}" target="_blank" rel="noopener">${tr('Sito di chi organizza')}</a><span class="meta">${esc(hostDi(link))}</span></div></div>`:''}</div>
      ${descrizione(e)}
      ${finito(e)?'':`<div class="tasti">${tastoIndicazioni(e)}${tastoSalva(e)}</div>`}
      <div class="fonte${man?' attenzione':''}">${x.source?`<span class="meta"><strong style="color:var(--testo)">${tr('Fonte')}:</strong> ${esc(tr(x.source))}</span>`:''}
        <span class="meta">${man ? tr('Per cortei e presidi verifica sempre con chi organizza prima di andare: luogo e orario possono cambiare.') : tr('Le informazioni raccolte possono cambiare: verifica con chi organizza prima di andare.')}</span></div>
      <a class="link" href="mailto:info@agorapp.it?subject=${encodeURIComponent(tr('Evento non più valido')+': '+e.titolo)}">${tr('Non è più valido? Segnalalo')}</a>${boxAdmin(e)}`;
  } else if(e.tipo==='pratica'){
    const b = DEMO && DEMO.progetti && DEMO.progetti.bacheche && DEMO.progetti.bacheche[x.parentId];
    const liberi = b ? b.mano.posti.filter(p => !p.coperto).length : 0;
    testa = `<div class="riga-titolo"><div class="pill-row">${x.etichetta?`<span class="pillola dot" style="--pp:var(--clay);--pb:var(--clay-tenue);--pt:var(--clay-ink)">${esc(tr(x.etichetta))}</span>`:''}${pillTema(e)}</div>${chiudiBtn()}</div>
      <div class="scheda-testa">${forma('pratica',e.strato,40)}<div><div class="eyebrow" style="color:var(--clay-ink)">${tr('Evento Pratica · {p}',{p:esc(x.progetto||'')})}</div><h2>${esc(e.titolo)}</h2></div></div>`;
    corpo = `<div class="fatti">${quando(e)}
        <div class="dato">${icoLuogo}<div><span class="t">${esc(e.luogo)}</span>${x.addrNum?`<span class="meta">${esc(x.addrNum)}</span>`:''}</div></div>
        ${e.prezzo?`<div class="dato">${icoPrezzo}<div><span class="t">${esc(formatPrice(e.prezzo))}</span></div></div>`:''}</div>
      ${descrizione(e)}
      ${b?`<div class="pratica-box">${MANO(34)}<div><span style="font-weight:600">${tr('Vuoi dare una mano?')}</span><span class="meta">${liberi===1 ? tr('1 posto libero per {g}',{g:nomeSettimana(e.giorno)}) : tr('{n} posti liberi per {g}',{n:liberi, g:nomeSettimana(e.giorno)})}</span></div></div>`:''}
      <div class="tasti">${b?`<button class="tasto sec" data-progetto="${esc(x.parentId)}">${tr('Bacheca')} ${freccia}</button>`:tastoIndicazioni(e)}${finito(e)?'':tastoSalva(e)}</div>
      <p class="meta">${tr('È un appuntamento di un progetto: lo cura chi porta avanti il progetto, non Agorapp.')}</p>${boxAdmin(e)}`;
  } else if(e.tipo==='istanza'){
    testa = `<div class="riga-titolo"><div class="pill-row"><span class="pillola dot" style="--pp:var(--ic);--pb:var(--it);--pt:var(--ic)">${tr('Istanza · {i}',{i:esc(x.istanza||'')})}</span>${pillTema(e)}</div>${chiudiBtn()}</div>
      <div class="scheda-testa">${forma('istanza',null,40,e.ist)}<div><div class="eyebrow" style="color:var(--ic)">${x.restituzione ? tr('Evento Istanza · restituzione') : tr('Evento Istanza · passo {n}',{n:x.passo||1})}</div><h2>${esc(e.titolo)}</h2></div></div>`;
    corpo = `${x.obiettivo?`<div class="richiamo">${BERSAGLIO(18)}<div class="stack-s" style="gap:2px"><span class="meta">${x.restituzione?tr('Obiettivo raggiunto: la proposta è consegnata'):tr('Obiettivo dell’istanza')}</span><span style="font-weight:600">${esc(x.obiettivo)}</span></div></div>`:''}
      <div class="fatti">${quando(e)}
        <div class="dato">${icoLuogo}<div><span class="t">${esc(e.luogo)}</span>${e.citta?`<span class="meta">${esc(e.citta)}</span>`:''}</div></div>
        ${x.soggetti?`<div class="dato">${icoPersone}<div><span class="t">${x.restituzione?tr('Chi la cura'):tr('Al tavolo')}</span><span class="meta">${esc(x.soggetti)}</span></div></div>`:''}</div>
      ${descrizione(e)}
      <div class="tasti">${DEMO?(x.restituzione?`<button class="tasto sec" data-apri-istanza="${esc(x.parentId)}">${tr('L’istanza')} ${freccia}</button>`:`<button class="tasto sec" data-apri-tavolo="${esc(x.parentId)}:${x.tavolo}">${tr('Il tavolo')} ${freccia}</button>`):tastoIndicazioni(e)}${finito(e)?'':tastoSalva(e)}</div>
      <div class="fonte"><span class="meta"><strong style="color:var(--testo)">${tr('Chi può venire')}:</strong> ${x.restituzione ? tr('tutte e tutti. È l’incontro in cui l’istanza racconta alla città la proposta consegnata.') : tr('[DA DECIDERE]. È un incontro di lavoro del tavolo; dopo, il tavolo pubblica il rendiconto nell’Agorà.')}</span></div>${boxAdmin(e)}`;
  } else {
    const serie = e.serie ? EV.filter(y => y.serie===e.serie) : null, links = (x.links && x.links.length ? x.links : (x.link ? [x.link] : [])).map(safeUrl).filter(Boolean);
    const repTesto = serie && x.rep ? `${repLabel(x.rep.freq, e.giorno)}${x.rep.until?' · '+tr('fino al {d}',{d:dIso(x.rep.until).toLocaleDateString(dloc(),{day:'numeric',month:'long'})}):''} · ${tr('{n} date',{n:serie.length})}` : '';
    const prec = {map:tr('Punto scelto da te sulla mappa'), street:tr('Civico non in mappa: punto sulla via'), nonum:tr('Senza numero civico')}[x.addrPrecision] || '';
    testa = `<div class="riga-titolo"><div class="pill-row"><span class="pillola dot" style="--pp:var(--verde);--pb:var(--verde-tenue);--pt:var(--verde)">${tr('Off-Grid · lo vedi solo tu')}</span></div>${chiudiBtn()}</div>
      <div class="scheda-testa">${forma('og',null,40)}<div><div class="eyebrow" style="color:var(--verde)">${tr('Il tuo evento')}</div><h2>${esc(e.titolo)}</h2></div></div>`;
    corpo = `<div class="fatti">${quando(e)}
        ${serie?`<div class="dato">${icoRipeti}<div><span class="t">${tr('Si ripete')}</span><span class="meta">${esc(repTesto)}. ${tr('Sulla mappa vedi solo la prossima data, le altre sono nel calendario.')}</span></div></div>`:''}
        ${e.luogo?`<div class="dato">${icoLuogo}<div><span class="t">${esc(e.luogo)}</span>${prec?`<span class="meta">${prec}</span>`:''}</div></div>`:''}
        ${e.desc?`<div class="dato">${icoNote}<div><span style="white-space:pre-wrap">${esc(e.desc)}</span></div></div>`:''}
        ${links.map(l => `<div class="dato">${icoLink}<div><a href="${esc(l)}" target="_blank" rel="noopener">${esc(hostDi(l))}</a></div></div>`).join('')}</div>
      <div class="tasti">${tastoIndicazioni(e)}<button class="tasto sec" data-giornata="${e.giorno}">${icoCal()}${tr('La mia giornata')}</button></div>
      <div class="tasti"><button class="tasto sec" data-modifica="${esc(e.id)}">${tr('Modifica')}</button><button class="tasto pericolo" data-elimina="${esc(e.id)}">${tr('Elimina')}</button></div>
      <div class="og-box">${GLIFO_OG}<span class="meta" style="color:var(--testo)">${tr('Vive solo nella memoria di questo telefono: non passa da nessun server. È già nel tuo calendario e sparisce dalla mappa tre ore dopo la fine; nel calendario resta per tre mesi.')}</span></div>`;
  }
  return foglio('forte medio'+(e.tipo==='istanza' ? ' c-'+e.ist : ''), testa, corpo);
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
    celle += `<button data-giorno-cal="${s}" class="${s===oggi()?'oggi':''}${s<oggi()?' passato':''}" aria-label="${esc(titoloGiorno(s))}">${d}<span class="punti">${og?'<span class="punto og"></span>':''}${sv?'<span class="punto sv"></span>':''}</span></button>`;
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
function basePdf(){ return st.pdf.giornata ? giornata(st.pdf.giornata).vive : miei().filter(e => !sparito(e)).sort((a,b) => a.a-b.a); }
function fPdf(){
  const base = basePdf(), scelti = base.filter(e => !st.pdf.tolti.has(e.id));
  const titolo = st.pdf.giornata ? tr('La mia giornata') : tr('Il mio calendario');
  const sotto = st.pdf.giornata ? maiusc(titoloGiorno(st.pdf.giornata)) : tr('Dal {d}',{d:dIso(oggi()).toLocaleDateString(dloc(),{day:'numeric',month:'long'})});
  const giorni = [...new Set(scelti.map(e => e.giorno))];
  const testa = `<div class="riga-titolo"><div><h2>${tr('Anteprima PDF')}</h2><p class="meta">${tr('Togli quello che non vuoi stampare.')}</p></div>${chiudiBtn('indietro-cal')}</div>`;
  const corpo = base.length ? `<div class="lista">${base.map(e => `<button class="menu-r" data-pdf="${esc(e.id)}" aria-pressed="${!st.pdf.tolti.has(e.id)}"><span class="casella">${!st.pdf.tolti.has(e.id)?spunta(14):''}</span><div><span class="t">${esc(e.titolo)}</span><span class="meta">${st.pdf.giornata?'':esc(titoloGiorno(e.giorno))+' · '}${e.inizio}${e.fine?'–'+e.fine:''}</span></div></button>`).join('')}</div>
    <div class="carta"><div class="cm">Agorapp · ${esc(cittaObj().n)}</div><div class="ct">${titolo}</div><div class="cm" style="text-transform:none;letter-spacing:0;font-weight:500">${esc(sotto)}</div>
      ${giorni.map(g => `${st.pdf.giornata?'':`<div class="cm" style="margin-top:4px">${esc(titoloGiorno(g))}</div>`}${scelti.filter(e => e.giorno===g).map(e => `<div class="pr"><b>${e.inizio}</b><span><strong>${esc(e.titolo)}</strong>${e.luogo?'<br>'+esc(e.luogo):''}${e.tipo==='og'&&e.desc?`<span class="nt">${esc(e.desc)}</span>`:''}</span></div>`).join('')}`).join('')}
      <div class="cp">${tr('Stampato da Agorapp. Verifica orari e luoghi con chi organizza.')}</div></div>
    <button class="tasto pri pieno tasto-pdf" style="justify-content:center" data-az="scarica-pdf" ${scelti.length?'':'disabled'}>${icoCondividi()}${tr('Condividi o scarica il PDF · {n}',{n:scelti.length})}</button>
    <button class="link" data-az="stampa-pdf" ${scelti.length?'':'disabled'}>${tr('Oppure stampalo')}</button>
    <p class="meta">${tr('Niente link: il PDF è un file, lo mandi tu a chi vuoi con le app del telefono.')}</p>`
    : `<p class="meta">${tr('Niente da stampare.')}</p>`;
  return foglio('forte alto', testa, corpo);
}
/* librerie caricate solo quando servono (il telefono non le scarica all'apertura) */
const SCRIPT = {};
function caricaScript(url){ return SCRIPT[url] || (SCRIPT[url] = new Promise((ok, no) => { const x = document.createElement('script'); x.src = url; x.async = true; x.onload = () => ok(); x.onerror = () => { delete SCRIPT[url]; no(new Error('script')); }; document.head.appendChild(x); })); }
const URL_JSPDF = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const URL_XLSX = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
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
  riga('AGORAPP · ' + cittaObj().n.toUpperCase(), 'helvetica', 'bold', 8, '#5C5246', X, W); y += 8;
  y += riga(titolo, 'times', 'bold', 22, '#1C1712', X, W) + 1;
  y += riga(sotto, 'helvetica', 'normal', 11, '#5C5246', X, W) + 4;
  const giorni = [...new Set(scelti.map(e => e.giorno))];
  giorni.forEach(g => {
    if(!st.pdf.giornata){ spazio(16); y += 3; doc.setDrawColor('#D8CFC2'); doc.line(X, y - 4, X + W, y - 4); y += riga(maiusc(titoloGiorno(g)).toUpperCase(), 'helvetica', 'bold', 8.5, '#5C5246', X, W) + 2; }
    scelti.filter(e => e.giorno===g).forEach(e => {
      const extra = [e.luogo, sottotitoloEv(e) + (e.prezzo ? ' · ' + formatPrice(e.prezzo) : '')].filter(Boolean).join('\n');
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
  riga(tr('Stampato da Agorapp. Verifica orari e luoghi con chi organizza.'), 'helvetica', 'normal', 8.5, '#5C5246', X, W);
  return doc.output('blob');
}
/* «Condividi o scarica»: sul telefono si apre il foglio delle app (WhatsApp, posta…); altrimenti il file si scarica */
async function condividiPdf(){
  const scelti = basePdf().filter(e => !st.pdf.tolti.has(e.id)); if(!scelti.length) return;
  if(lang==='ar') return stampaPdf();   /* i font standard del PDF non hanno l'arabo: si stampa dal browser */
  try{ await preparaPdf(); }catch(e){ return stampaPdf(); }
  let blob; try{ blob = creaPdf(scelti); }catch(e){ return stampaPdf(); }
  const nome = (st.pdf.giornata ? 'agorapp-giornata-' + st.pdf.giornata : 'agorapp-calendario-' + oggi()) + '.pdf';
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
    `<tr><td class="tm">${e.inizio}${e.fine?'–'+e.fine:''}</td><td class="tt">${esc(e.titolo)}${e.tipo==='og'&&e.desc?`<div class="nt">${esc(e.desc)}</div>`:''}</td><td>${esc(e.luogo)}<div class="nt">${esc(sottotitoloEv(e))}${e.prezzo?' · '+esc(formatPrice(e.prezzo)):''}</div></td></tr>`).join('')).join('');
  const html = `<!DOCTYPE html><html lang="${lang}" dir="${lang==='ar'?'rtl':'ltr'}"><head><meta charset="UTF-8"><title>${esc(titolo)} · Agorapp</title><style>body{font-family:Georgia,serif;max-width:760px;margin:24px auto;color:#1c1712;padding:0 16px}h1{font-size:24px;margin:0 0 2px;font-weight:400}p{font-size:12px;color:#5c5246;margin:0 0 18px;font-family:Helvetica,Arial,sans-serif}.m{text-transform:uppercase;letter-spacing:.08em;font-size:11px}table{width:100%;border-collapse:collapse;font-family:Helvetica,Arial,sans-serif}td{padding:8px 10px;border-bottom:1px solid #e3ddd0;font-size:12px;vertical-align:top}td.day{background:#f5f0e8;font-weight:700;font-size:13px;border-top:2px solid #cfc6b4}td.tm{white-space:nowrap;color:#5c5246;font-weight:700}td.tt{font-weight:600}.nt{font-weight:400;color:#5c5246;font-size:11px;margin-top:2px;white-space:pre-wrap}.f{margin-top:18px;font-size:11px;color:#5c5246;font-family:Helvetica,Arial,sans-serif}</style></head><body><p class="m">Agorapp · ${esc(cittaObj().n)}</p><h1>${esc(titolo)}</h1><p>${esc(sotto)}</p><table><tbody>${righe}</tbody></table><p class="f">${tr('Stampato da Agorapp. Verifica orari e luoghi con chi organizza.')}</p></body></html>`;
  const url = URL.createObjectURL(new Blob([html], {type:'text/html'}));
  const w = window.open(url, '_blank');
  if(w){ setTimeout(() => { try{ w.print(); }catch(e){} }, 700); setTimeout(() => URL.revokeObjectURL(url), 60000); }
  else { const a = document.createElement('a'); a.href = url; a.download = 'agorapp-calendario.html'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
}
