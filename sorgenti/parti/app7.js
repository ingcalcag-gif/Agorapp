
/* ======================= Temi: ovali Strati e Temi trasversali, lenti di Agorapp e tre lenti tue (passo 2) ======================= */
const TEMI_VOC = ["Diritto all'abitare","Spazi autogestiti","Riuso e rigenerazione","Beni comuni","Aree verdi","Orti urbani","Mobilità dolce","Ciclabili","Sostenibilità","Clima","Inclusione","Accoglienza e migrazione","Accessibilità","Parità di genere","Diritti","Antirazzismo","Cultura libera","Educazione popolare","Memoria e territorio","Autoproduzione","Mutualismo","Salute di comunità","Infanzia e famiglie","Convivialità"];
const GLIFI = {
  casa:'<path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10v9h11v-9"/><path d="M10 19v-5h4v5"/>',
  respira:'<path d="M5 19c0-8 5-13 14-14 0 9-5 14-14 14Z"/><path d="M5 19c3-4 6-7 10-10"/>',
  porte:'<path d="M6 20V5.5A1.5 1.5 0 0 1 7.5 4h7A1.5 1.5 0 0 1 16 5.5V20"/><path d="M16 7l3 1v12"/><path d="M4 20h17"/><circle cx="13" cy="12.5" r=".8" fill="currentColor"/>',
  mani:'<path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 10V5a1.5 1.5 0 0 1 3 0v6"/><path d="M14 10.5V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.6-2.2L4 15a1.5 1.5 0 0 1 2.2-2L8 14.5V12"/>',
  tavola:'<path d="M3 11h18"/><path d="M5 11v8M19 11v8"/><path d="M8 11a4 4 0 0 1 8 0"/><path d="M12 5v2"/>',
  parola:'<path d="M4 10v4h3l6 4V6L7 10H4Z"/><path d="M16.5 9a4 4 0 0 1 0 6"/><path d="M19 6.5a7.5 7.5 0 0 1 0 11"/>',
  cura:'<path d="M12 20s-7-4.4-7-9.5A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.5C19 15.6 12 20 12 20Z"/>'
};
const LENTI_AG = [
  {id:'casa', nome:'Casa e quartiere', col:'#C2185B', motto:'Chi resta, chi arriva, chi tiene viva la via.', testo:'Per chi abita un quartiere e non vuole doverlo lasciare. Assemblee sugli affitti, cortili aperti, storie dei palazzi: tutto ciò che fa di una via un posto dove restare.', k:["t:Diritto all'abitare","t:Memoria e territorio","t:Beni comuni"]},
  {id:'respira', nome:'La città che respira', col:'#00838F', motto:'Alberi, biciclette, aria.', testo:'Per chi vuole attraversare la città a piedi o in bici, e trovare un’ombra lungo la strada. Parchi da curare, orti, pedalate, quello che si può fare per il clima vicino a casa.', k:['t:Aree verdi','t:Orti urbani','t:Clima','t:Sostenibilità','t:Mobilità dolce','t:Ciclabili']},
  {id:'porte', nome:'Porte aperte', col:'#AD1457', motto:'Qui nessuno è ospite.', testo:'Dove chi arriva da lontano, chi non sente, chi non vede bene o parla un’altra lingua trova posto senza doverlo chiedere. Scuole di italiano, cori, tamburi, sportelli.', k:['t:Inclusione','t:Accoglienza e migrazione','t:Antirazzismo','t:Accessibilità']},
  {id:'mani', nome:'Mani in pasta', col:'#8A6D0B', motto:'Si impara facendo.', testo:'Aggiustare una bici, cucire, costruire una cassetta per i libri, rimettere in piedi uno spazio vuoto. Per chi preferisce fare piuttosto che guardare.', k:['t:Autoproduzione','t:Riuso e rigenerazione','t:Spazi autogestiti','s:laboratori']},
  {id:'tavola', nome:'A tavola insieme', col:'#C2410C', motto:'Mangiare insieme è già fare comunità.', testo:'Merende in cortile, pranzi sociali, mercati di quartiere. Per chi pensa che una tavola lunga risolva più cose di quante sembri.', k:['t:Convivialità','s:cibo','s:mercati']},
  {id:'parola', nome:'Prendere parola', col:'#1565C0', motto:'Dove la città alza la mano.', testo:'Assemblee, cortei, tavoli delle istanze, scuole popolari: i posti dove si impara a dire la propria e a farla contare. Per chi pensa che le regole si possano cambiare.', k:['t:Diritti','t:Parità di genere','t:Educazione popolare','s:manifestazioni']},
  {id:'cura', nome:'Prendersi cura', col:'#455A64', motto:'Nessuno se la cava da solo.', testo:'Ambulatori diffusi, scambi di competenze, nonne che cucinano, chi dà una mano il sabato. Per chi sa che stare bene è una faccenda di quartiere.', k:['t:Mutualismo','t:Salute di comunità','t:Infanzia e famiglie','s:volontariato']}
];
const glifo = (id, s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLIFI[id]}</svg>`;
const ICT = {
  lente:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></svg>',
  strumenti:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h11M19 6h1M4 12h3M11 12h9M4 18h7M15 18h5"/><circle cx="17" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="13" cy="18" r="2"/></svg>',
  ora:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  occhio:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  segno:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4h12v16l-6-4-6 4V4Z"/></svg>',
  piu:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  cestino:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>',
  bussola:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15 9-2 5-4 1 2-5 4-1Z"/></svg>',
  croce:'<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  spunta:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
/* l'universo: 13 strati e 24 temi trasversali. Chiave "s:<id>" o "t:<tema>" */
const universo = () => [
  ...LAYERS.map(s => ({k:'s:'+s.id, label:tr(s.label), tipo:'strato', dot:s.pin, bg:s.bg, tx:s.text})),
  ...TEMI_VOC.map(t => { const c = temaCol(t); return {k:'t:'+t, label:tr(t), tipo:'tema', dot:c.dot, bg:c.bg, tx:c.tx}; })
];
const byK = k => universo().find(u => u.k===k);
/* le tre lenti di chi usa l'app: stessa chiave dell'app online (agorapp_temi_slots) */
function caricaLenti(){
  const a = LS.get('agorapp_temi_slots', null);
  const conv = s => { if(!s) return null; if(Array.isArray(s.k)) return {nome:s.nome||s.name||'', k:s.k};
    const k = (s.tags||[]).map(lb => { const l = LAYERS.find(x => x.label===lb); return l ? 's:'+l.id : (TEMI_VOC.includes(lb) ? 't:'+lb : null); }).filter(Boolean);
    return k.length ? {nome:s.name||'', k} : null; };
  return Array.isArray(a) && a.length===3 ? a.map(conv) : [null,null,null];
}
function salvaLenti(){ LS.set('agorapp_temi_slots', TM.lenti.map(l => l ? {name:l.nome, tags:l.k.map(k => k.startsWith('s:') ? (S[k.slice(2)]||{}).label : k.slice(2)), nome:l.nome, k:l.k} : null)); }
const TM = {vista:'esplora', scelti:[], tipo:'tutti', mostrati:6, mappaOn:true, q:'', strumenti:{terminati:false, nascosti:false}, lenti:caricaLenti(), lenteNome:null, lenteAg:null, salva:null, foglio:null};
const lenteAg = id => LENTI_AG.find(l => l.id===id);
const nomeLenteAg = l => tr(l.nome);

/* cosa porta i temi scelti */
const tagsEv = e => [...(S[e.strato] ? ['s:'+e.strato] : []), ...temiDi(e).map(t => 't:'+t)];
const colpisce = (keys, scelti) => keys.some(k => (scelti||TM.scelti).includes(k));
function quanti(chiavi){ return EV.filter(e => e.tipo!=='og' && !e.nascosto && !finito(e) && !sparito(e) && colpisce(tagsEv(e), chiavi)).length; }
function trovati(){
  return EV.filter(e => e.tipo!=='og')
    .filter(e => !e.nascosto || (TM.strumenti.nascosti && st.sbloccati.has(e.raw.hiddenPassword)))
    .filter(e => !sparito(e) && (TM.strumenti.terminati || !finito(e)))
    .filter(e => colpisce(tagsEv(e)))
    .sort((a,b) => (finito(a)-finito(b)) || (a.a-b.a));
}
function nelleSezioni(){
  if(!DEMO) return {prog:[], ist:[]};
  const TAG = (DEMO.temi && DEMO.temi.perOggetto) || {};
  const prog = ((DEMO.progetti && DEMO.progetti.elenco) || []).filter(p => colpisce([...p.strati.map(s => 's:'+s), ...(TAG[p.id]||[]).map(t => 't:'+t)]));
  const ist = ((DEMO.istanze && DEMO.istanze.lista) || []).filter(a => colpisce([...a.strati.map(s => 's:'+s), ...(TAG[a.id==='agorapp'?'agorapp-critica':a.id]||[]).map(t => 't:'+t)]));
  return {prog, ist};
}

/* pezzi */
function ovale(u, attr, piccolo){ const on = TM.scelti.includes(u.k); return `<button class="ovale${on?' sel':''}${piccolo?' p':''}" ${attr}="${esc(u.k)}" aria-pressed="${on}" style="--dot:${u.dot}"><span class="pallino"></span>${esc(u.label)}</button>`; }
function etichettaTema(k){ const u = byK(k); if(!u) return ''; return `<span class="etichetta${TM.scelti.includes(k)?' hit':''}" style="--dot:${u.dot};--bg:${u.bg};--tx:${u.tx}">${esc(u.label)}</span>`; }
function testataTemi(){
  const n = TM.scelti.length;
  return `<div class="t-testa"><div><div class="tipo">${tr('Temi')}</div><div class="t-sotto">${tr('le passerelle tra le sezioni')}</div></div>
    <div class="t-icone"><button class="t-icona" data-tz="lente" aria-label="${esc(tr('Lente: cerca e combina strati e temi'))}">${ICT.lente}${n?`<span class="t-badge">${n}</span>`:''}</button>
    <button class="t-icona" data-tz="strumenti" aria-label="${esc(tr('Strumenti e lenti salvate'))}">${ICT.strumenti}</button></div></div>`;
}
function barraScelta(){
  const n = TM.scelti.length; if(!n) return '';
  const k = trovati().length;
  return `<div class="t-barra vetro" role="region"><div class="t-barra-t"><b>${n===1?tr('1 scelto'):tr('{n} scelti',{n})}</b><span class="meta">${k===1?tr('1 cosa li porta'):tr('{n} cose li portano',{n:k})}</span></div>
    <button class="tasto sec" data-tz="pulisci">${tr('Pulisci')}</button><button class="tasto pri" data-tz="mostra">${tr('Mostra')} ${freccia}</button></div>`;
}
function vEsplora(){
  const U = universo(), mie = TM.lenti.map((l,i) => l ? Object.assign({i}, l) : null).filter(Boolean);
  const carta = l => { const n = quanti(l.k);
    return `<button class="t-lente" data-tz-ag="${l.id}" style="--lc:${l.col}"><span class="t-lente-g">${glifo(l.id,22)}</span><span class="t-lente-n">${esc(nomeLenteAg(l))}</span><span class="t-lente-m">${esc(tr(l.motto))}</span>
      <span class="t-lente-p">${l.k.map(k => { const u = byK(k); return `<span class="pallino" style="background:${u.dot}" title="${esc(u.label)}"></span>`; }).join('')}<span class="meta">${n===1?tr('1 cosa ora'):tr('{n} cose ora',{n})}</span></span></button>`; };
  return `${testataTemi()}
  <section class="stack"><h1>${tr('Esplora per tema')}</h1><p>${tr('Tutti gli strati e tutti i temi, nessuna classifica. Parti da una lente, o scegli tu uno o più strati e temi: poi vedi insieme gli eventi, le pratiche e le istanze che li portano.')}</p></section>
  <section class="stack-s"><div class="t-gruppo">${tr('Le lenti di Agorapp')}</div><div class="t-lenti" role="list">${LENTI_AG.map(carta).join('')}</div>
    <p class="meta">${tr('Le propone la redazione. Non scelgono per te: mostrano tutto ciò che porta quei temi, in ordine di tempo.')}</p></section>
  <section class="stack-s"><div class="t-gruppo">${tr('Le tue lenti')}</div>
    ${mie.length?`<div class="ovali">${mie.map(l => `<button class="ovale lente" data-tz-lente="${l.i}">${ICT.segno}${esc(l.nome)} <span class="meta">${l.k.length}</span></button>`).join('')}${mie.length<3?`<span class="meta t-ancora">${3-mie.length===1?tr('1 libera'):tr('{n} libere',{n:3-mie.length})}</span>`:''}</div>`
      :`<p class="meta">${tr('Puoi farne fino a tre: scegli strati e temi qui sotto, poi «Salva come lente».')}</p>`}</section>
  <section class="stack-s"><div class="t-gruppo">${tr('Strati')}</div><div class="ovali">${U.filter(u => u.tipo==='strato').map(u => ovale(u,'data-scegli')).join('')}</div></section>
  <section class="stack-s"><div class="t-gruppo">${tr('Temi trasversali')}</div><div class="ovali">${U.filter(u => u.tipo==='tema').map(u => ovale(u,'data-scegli')).join('')}</div></section>
  <div class="t-spiega"><span>${ICT.bussola}</span><div><div class="t">${tr('Un tema, tutte le sezioni insieme')}</div><div class="meta">${tr('Uno strato dice di che tipo è un evento; un tema dice di cosa parla. Eventi, pratiche e istanze che portano ciò che scegli appaiono mescolati, in ordine di tempo.')}</div></div></div>
  ${barraScelta()}`;
}
/* mini mappa stilizzata: i punti con le forme della mappa, su un foglio carta (la mappa vera si apre col tasto) */
function miniMappa(lista){
  const pts = lista.filter(e => e.suMappa), fuori = lista.length - pts.length;
  if(!TM.mappaOn) return `<button class="t-mappa-chiusa" data-tz="mappa-on">${ICT.occhio}<span>${tr('Mostra la mappa')} · <b>${tr('{n} punti',{n:pts.length})}</b></span></button>`;
  if(!pts.length) return '';
  const W = 340, H = 162, cosl = Math.cos(45*Math.PI/180);
  let la0 = Math.min(...pts.map(p => p.lat)), la1 = Math.max(...pts.map(p => p.lat)), ln0 = Math.min(...pts.map(p => p.lng)), ln1 = Math.max(...pts.map(p => p.lng));
  const cx = (ln0+ln1)/2, cy = (la0+la1)/2; let w = Math.max((ln1-ln0)*cosl, 0.01), h = Math.max(la1-la0, 0.006);
  if(w/h < W/H) w = h*W/H; else h = w*H/W; w *= 1.25; h *= 1.25;
  const X = ln => (((ln-cx)*cosl)/w + .5)*W, Y = la => (.5 - (la-cy)/h)*H;
  const fondo = citta==='torino' ? QUARTIERI.map(q => `<rect x="${X(q.ln[0]).toFixed(1)}" y="${Y(q.la[1]).toFixed(1)}" width="${(X(q.ln[1])-X(q.ln[0])).toFixed(1)}" height="${(Y(q.la[0])-Y(q.la[1])).toFixed(1)}" rx="6" fill="var(--mappa-edificio)" opacity=".55"/>`).join('') : '';
  const segni = pts.map(e => { const x = X(e.lng).toFixed(1), y = Y(e.lat).toFixed(1);
    if(e.tipo==='pratica') return `<circle cx="${x}" cy="${y}" r="7" fill="var(--superficie)" stroke="var(--clay)" stroke-width="2.4"/><circle cx="${x}" cy="${y}" r="3" fill="var(--clay)"/>`;
    if(e.tipo==='istanza') return `<rect x="${x-6.5}" y="${y-6.5}" width="13" height="13" rx="4" fill="${coloreIst(e.ist)}" stroke="var(--superficie)" stroke-width="2"/>`;
    return `<circle cx="${x}" cy="${y}" r="6.5" fill="${(S[e.strato]||{pin:'#888'}).pin}" stroke="var(--superficie)" stroke-width="2"/>`; }).join('');
  return `<div class="t-mappa"><button class="t-mappa-svg" data-tz="sulla-mappa" aria-label="${esc(tr('Apri questi {n} punti sulla mappa',{n:pts.length}))}"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${fondo}<g>${segni}</g></svg></button>
    <span class="t-mappa-lbl">${tr('{n} sulla mappa',{n:pts.length})}${fuori?' · '+tr('{n} in altre città',{n:fuori}):''}</span>
    <button class="t-mappa-x" data-tz="mappa-off" aria-label="${esc(tr('Nascondi la mappa'))}">${ICT.occhio}</button></div>`;
}
function cartaRisultato(e){
  const fin = finito(e), nome = {evento:tr('Evento'), pratica:tr('Pratica'), istanza:tr('Istanza')}[e.tipo];
  const chi = e.tipo==='pratica' ? e.raw.progetto : e.tipo==='istanza' ? e.raw.istanza : '';
  const d = dIso(e.giorno).toLocaleDateString(dloc(), {weekday:'short', day:'numeric', month:'long'});
  return `<button class="t-card${fin?' fin':''}" data-tev="${esc(e.id)}"><span class="t-angolo ${e.tipo}"${e.tipo==='istanza'?` style="--ic:${coloreIst(e.ist)}"`:''}>${nome}</span>
    <div class="t-quando">${forma(e.tipo,e.strato,18,e.ist)}${ICT.ora} ${fin?tr('appena finito'):esc(d+' · '+e.inizio)}${!e.suMappa&&e.citta?' · '+esc(e.citta):''}</div>
    <h3>${esc(e.titolo)}</h3>${chi?`<div class="meta">${esc(chi)}</div>`:''}
    <p class="t-desc">${esc(e.desc.slice(0,90))}${e.desc.length>90?'…':''}</p>
    <div class="t-etich">${tagsEv(e).map(etichettaTema).join('')}</div></button>`;
}
function vRisultati(){
  const tutti = trovati(), c = {tutti:tutti.length, evento:0, pratica:0, istanza:0};
  tutti.forEach(e => c[e.tipo]++);
  const lista = TM.tipo==='tutti' ? tutti : tutti.filter(e => e.tipo===TM.tipo), vis = lista.slice(0, TM.mostrati);
  const sez = nelleSezioni(), ag = lenteAg(TM.lenteAg);
  const titolo = TM.lenteNome || (TM.scelti.length===1 ? byK(TM.scelti[0]).label : tr('{n} strati e temi insieme',{n:TM.scelti.length}));
  const seg = [['tutti',tr('Tutti')],['evento',tr('Eventi')],['pratica',tr('Pratiche')],['istanza',tr('Istanze')]].map(([k,l]) => `<button data-ttipo="${k}" aria-pressed="${TM.tipo===k}">${l} ${c[k]}</button>`).join('');
  return `${testataTemi()}
  <button class="indietro" data-tz="esplora">${frecciaSx}${tr('Cambia la scelta')}</button>
  ${ag?`<section class="t-lente-testa" style="--lc:${ag.col}"><span class="t-lente-g">${glifo(ag.id,24)}</span><div class="stack-s"><div class="t-gruppo">${tr('Lente di Agorapp')}</div><h1>${esc(nomeLenteAg(ag))}</h1><p class="t-lente-motto">${esc(tr(ag.motto))}</p><p>${esc(tr(ag.testo))}</p></div></section>`:''}
  <section class="stack-s">${ag?`<div class="t-gruppo">${tr('Cosa guarda')}</div>`:`<h1>${esc(titolo)}</h1>`}
    <div class="ovali">${TM.scelti.map(k => { const u = byK(k); return `<button class="ovale sel p" data-togli="${esc(k)}" style="--dot:${u.dot}" aria-label="${esc(tr('Togli {t}',{t:u.label}))}"><span class="pallino"></span>${esc(u.label)}${ICT.croce}</button>`; }).join('')}</div>
    <div class="t-azioni"><button class="link" data-tz="salva">${ICT.segno}${ag?tr('Fanne una tua lente'):tr('Salva come lente')}</button><button class="link" data-tz="esplora">${tr('Aggiungi altri')}</button></div></section>
  <div class="seg" role="group">${seg}</div>
  ${miniMappa(lista)}
  <button class="tasto pri pieno" data-tz="sulla-mappa">${tr('Apri sulla mappa')} ${freccia}</button>
  ${sez.prog.length||sez.ist.length?`<section class="stack-s"><div class="t-gruppo">${tr('Nelle sezioni')}</div><div class="t-sezioni">
      ${sez.prog.map(p => `<button class="t-sez prog" data-tprog="${esc(p.id)}"><span class="t-sez-k">${tr('Progetto')}</span><span class="t">${esc(p.titolo)}</span></button>`).join('')}
      ${sez.ist.map(a => `<button class="t-sez c-${esc(a.id)}" data-tist="${esc(a.id)}"><span class="t-sez-k">${tr('Istanza')}</span><span class="t">${esc(a.titolo)}</span></button>`).join('')}</div></section>`:''}
  <section class="stack-s"><div class="meta">${lista.length===1?tr('1 elemento'):tr('{n} elementi',{n:lista.length})} · ${tr('in ordine di tempo, non di popolarità')}</div>
    ${vis.length ? vis.map(cartaRisultato).join('') : `<div class="t-vuoto">${TM.tipo!=='tutti'?tr('Niente con questi temi e questo tipo, per ora.'):tr('Niente con questi temi, per ora.')}</div>`}
    ${lista.length>TM.mostrati?`<button class="tasto sec pieno" data-tz="altri">${tr('Mostra altri {n}',{n:Math.min(6,lista.length-TM.mostrati)})}</button>`:''}</section>`;
}
/* fogli Lente e Strumenti */
function lenteDentro(){
  const U = universo(), q = norm(TM.q);
  const lista = (q.length>=3 ? U.filter(u => norm(u.label).includes(q)) : U).slice().sort((a,b) => a.label.localeCompare(b.label, dloc()));
  const corto = q.length>0 && q.length<3;
  return `<div class="meta">${corto?tr('Scrivi almeno 3 lettere: trova anche dentro la parola.'):q.length>=3?(lista.length?tr('{n} risultati',{n:lista.length}):tr('Nessuno strato o tema contiene «{q}».',{q:esc(TM.q)})):tr('Tutti gli strati e i temi · dalla A alla Z')}</div>
    ${TM.scelti.length?`<div class="ovali">${TM.scelti.map(k => { const u = byK(k); return `<button class="ovale sel p" data-togli="${esc(k)}" style="--dot:${u.dot}"><span class="pallino"></span>${esc(u.label)}${ICT.croce}</button>`; }).join('')}</div>`:''}
    ${corto?'':`<div class="ovali t-lista">${lista.map(u => ovale(u,'data-scegli',true)).join('')}</div>`}
    ${TM.scelti.length?`<div class="tasti"><button class="tasto sec" data-tz="pulisci">${tr('Pulisci')}</button><button class="tasto pri" data-tz="mostra">${TM.scelti.length===1?tr('Mostra 1 scelto'):tr('Mostra {n} scelti',{n:TM.scelti.length})}</button></div>`:''}`;
}
function fTemi(){
  const testa = `<div class="riga-titolo"><div><div class="tipo">${TM.foglio==='lente'?tr('Lente'):tr('Strumenti')}</div><h2>${TM.foglio==='lente'?tr('Cerca e combina'):TM.salva?tr('Salva come lente'):tr('Cosa vedere, e le tue lenti')}</h2></div>${chiudiBtn()}</div>`;
  if(TM.foglio==='lente') return foglio('forte alto sez-temi', testa + `<label class="campo">${ICT.lente}<input id="tz-q" value="${esc(TM.q)}" placeholder="${esc(tr('Cerca uno strato o un tema…'))}" autocomplete="off"></label>`, `<div id="tz-lente" class="stack-s">${lenteDentro()}</div>`);
  const n = TM.scelti.length, sv = TM.salva, sbl = st.sbloccati.size;
  const slot = (l,i) => l
    ? `<div class="t-slot pieno"><span class="t-slot-i">${ICT.segno}</span><div><div class="t">${esc(l.nome)}</div><div class="meta">${l.k.map(k => (byK(k)||{label:k}).label).map(esc).join(' · ')}</div></div><button class="link" data-tz-lente="${i}">${tr('Applica')}</button><button class="t-icona p" data-tz-via="${i}" aria-label="${esc(tr('Elimina la lente {n}',{n:l.nome}))}">${ICT.cestino}</button></div>`
    : `<button class="t-slot" data-tz-slot="${i}"><span class="t-slot-i">${ICT.piu}</span><div><div class="t">${tr('Lente {n} libera',{n:i+1})}</div><div class="meta">${n?tr('Tocca per salvarci la scelta di adesso'):tr('Vuota')}</div></div></button>`;
  let corpo;
  if(sv && sv.fase==='slot') corpo = `<p>${n===1?tr('Stai salvando 1 elemento. In quale lente?'):tr('Stai salvando {n} elementi. In quale lente?',{n})}</p>
    ${TM.lenti.map((l,i) => `<button class="t-slot${l?' pieno':''}" data-tz-slot="${i}"><span class="t-slot-i">${l?ICT.segno:ICT.piu}</span><div><div class="t">${l?esc(l.nome):tr('Lente {n}',{n:i+1})}</div><div class="meta">${l?tr('Occupata: la sovrascrivi'):tr('Libera')}</div></div></button>`).join('')}
    <button class="tasto sec pieno" data-tz="salva-annulla">${tr('Annulla')}</button>`;
  else if(sv && sv.fase==='nome') corpo = `<p>${TM.lenti[sv.i]?tr('La lente «{n}» viene sostituita.',{n:esc(TM.lenti[sv.i].nome)})+' ':''}${tr('Al massimo 16 caratteri.')}</p>
    <label class="campo"><input id="tz-nome" maxlength="16" placeholder="${esc(tr('es. Casa e verde'))}" value="${esc(TM.lenteNome||'')}" autocomplete="off"></label>
    <div class="tasti"><button class="tasto sec" data-tz="salva-annulla">${tr('Annulla')}</button><button class="tasto pri" data-tz="salva-ok">${TM.lenti[sv.i]?tr('Sovrascrivi'):tr('Salva')}</button></div>`;
  else corpo = `<button class="riga-int" data-tz-tool="terminati" aria-pressed="${TM.strumenti.terminati}"><span class="casella">${ICT.spunta}</span><div><span class="t">${tr('Mostra anche gli appena finiti')}</span><span class="meta">${tr('Quelli finiti da meno di tre ore, in grigio.')}</span></div></button>
    <button class="riga-int" data-tz-tool="nascosti" aria-pressed="${TM.strumenti.nascosti}"${sbl?'':' disabled'}><span class="casella">${ICT.spunta}</span><div><span class="t">${tr('Mostra i nascosti che hai sbloccato')}</span><span class="meta">${sbl?tr('{n} sbloccati su questo telefono.',{n:sbl}):tr('Nessuno sbloccato: si sbloccano dalla Cerca della mappa.')}</span></div></button>
    <div class="t-gruppo">${tr('Le tue lenti')}</div><p class="meta">${tr('Una lente è una combinazione di strati e temi da ritrovare con un tocco. Restano su questo telefono.')}</p>
    ${TM.lenti.map(slot).join('')}
    <button class="tasto ${n?'pri':'sec'} pieno" data-tz="salva"${n?'':' disabled'}>${n?tr('Salva la scelta di adesso come lente ({n})',{n}):tr('Scegli strati o temi per salvare una lente')}</button>`;
  return foglio('forte alto sez-temi', testa, corpo);
}
function disegnaTemi(){
  const p = $('pagina-temi'); if(!p || p.hidden) return;
  if(!TM.scelti.length) TM.vista = 'esplora';
  const sc = p.scrollTop;
  p.innerHTML = `<main class="pag-temi">${TM.vista==='risultati' ? vRisultati() : vEsplora()}</main>`;
  p.scrollTop = sc;
}
function cambiaTemi(){ disegnaTemi(); if(TM.foglio){ if(TM.foglio==='lente' && $('tz-lente')) $('tz-lente').innerHTML = lenteDentro(); else disegnaFoglio(); } }
function apriFoglioTemi(q){ TM.foglio = q; st.foglio = 'temi'; ultimoFoglio = null; disegnaFoglio(); setTimeout(() => { const i = $(q==='lente'?'tz-q':'tz-nome'); if(i && (q==='lente' || (TM.salva && TM.salva.fase==='nome'))){ i.focus(); } }, 40); }
function lenteCorrente(){ return {strati:TM.scelti.filter(k => k.startsWith('s:')).map(k => k.slice(2)), temi:TM.scelti.filter(k => k.startsWith('t:')).map(k => k.slice(2)), nome:TM.lenteNome || (TM.scelti.length===1 ? byK(TM.scelti[0]).label : tr('{n} temi',{n:TM.scelti.length})), tipo:TM.tipo, terminati:TM.strumenti.terminati, nascosti:TM.strumenti.nascosti}; }
/* una scelta vale anche come filtro della Mappa (la «lente»): chip col nome e ✕ */
function applicaLente(l, idSel){
  st.lente = l; st.tempo = 'tutto'; st.strati = new Set(LAYERS.map(s => s.id)); st.subOff.clear(); st.preset = 0;
  const tutti = l.tipo==='tutti'; st.tipi = {evento:tutti||l.tipo==='evento', pratica:tutti||l.tipo==='pratica', istanza:tutti||l.tipo==='istanza', og:tutti};
  st.prezzo = 'tutti'; st.salvatiSolo = false; st.finiti = !!l.terminati; if(l.nascosti) st.nascostiOn = true;
  TM.foglio = null; vaiSezione('mappa'); chiudi(); tutto();
  if(idSel){ selezionaEv(idSel); return; }
  requestAnimationFrame(() => inquadraTutti(visibili()));
}
function apriTemi(keys){ TM.scelti = keys.slice(); TM.lenteNome = null; TM.lenteAg = null; TM.vista = 'risultati'; TM.tipo = 'tutti'; TM.mostrati = 6; vaiSezione('temi'); $('pagina-temi').scrollTop = 0; }
function clickTemi(b){
  const d = b.dataset;
  if(d.scegli){ const i = TM.scelti.indexOf(d.scegli); if(i>=0) TM.scelti.splice(i,1); else TM.scelti.push(d.scegli); TM.lenteNome = null; TM.lenteAg = null; cambiaTemi(); return true; }
  if(d.togli){ TM.scelti = TM.scelti.filter(k => k!==d.togli); TM.lenteNome = null; TM.lenteAg = null; TM.mostrati = 6; cambiaTemi(); return true; }
  if(d.tzAg){ const l = lenteAg(d.tzAg); TM.scelti = l.k.slice(); TM.lenteNome = nomeLenteAg(l); TM.lenteAg = l.id; TM.vista = 'risultati'; TM.tipo = 'tutti'; TM.mostrati = 6; disegnaTemi(); $('pagina-temi').scrollTop = 0; return true; }
  if(d.ttipo){ TM.tipo = d.ttipo; TM.mostrati = 6; disegnaTemi(); return true; }
  if(d.tev){ const e = byId(d.tev); if(!e) return true; if(!e.suMappa){ vaiSezione('mappa'); apriCalendario('giornata', e.giorno); return true; } applicaLente(Object.assign(lenteCorrente(), {tipo:'tutti', terminati:finito(e)||TM.strumenti.terminati}), d.tev); return true; }
  if(d.tprog){ window.AGR.progetti.apri(d.tprog); return true; }
  if(d.tist){ window.AGR.agora.apriIstanza(d.tist); return true; }
  if(d.tzLente){ const l = TM.lenti[+d.tzLente]; TM.scelti = l.k.slice(); TM.lenteNome = l.nome; TM.lenteAg = null; TM.vista = 'risultati'; TM.tipo = 'tutti'; TM.mostrati = 6; TM.foglio = null; chiudi(); disegnaTemi(); $('pagina-temi').scrollTop = 0; return true; }
  if(d.tzVia){ TM.lenti[+d.tzVia] = null; salvaLenti(); cambiaTemi(); return true; }
  if(d.tzTool){ TM.strumenti[d.tzTool] = !TM.strumenti[d.tzTool]; cambiaTemi(); return true; }
  if(d.tzSlot){ if(!TM.scelti.length) return true; TM.salva = {fase:'nome', i:+d.tzSlot}; apriFoglioTemi('strumenti'); return true; }
  const z = d.tz; if(!z) return false;
  if(z==='lente' || z==='strumenti'){ TM.salva = null; apriFoglioTemi(z); }
  else if(z==='pulisci'){ TM.scelti = []; TM.lenteNome = null; TM.lenteAg = null; TM.vista = 'esplora'; cambiaTemi(); }
  else if(z==='mostra'){ TM.vista = 'risultati'; TM.tipo = 'tutti'; TM.mostrati = 6; if(TM.foglio){ TM.foglio = null; chiudi(); } disegnaTemi(); $('pagina-temi').scrollTop = 0; }
  else if(z==='esplora'){ TM.vista = 'esplora'; disegnaTemi(); $('pagina-temi').scrollTop = 0; }
  else if(z==='altri'){ TM.mostrati += 6; disegnaTemi(); }
  else if(z==='mappa-on' || z==='mappa-off'){ TM.mappaOn = z==='mappa-on'; disegnaTemi(); }
  else if(z==='sulla-mappa'){ applicaLente(lenteCorrente()); }
  else if(z==='salva'){ if(!TM.scelti.length) return true; const libera = TM.lenti.findIndex(l => !l); TM.salva = libera>=0 ? {fase:'nome', i:libera} : {fase:'slot'}; apriFoglioTemi('strumenti'); }
  else if(z==='salva-annulla'){ TM.salva = null; apriFoglioTemi('strumenti'); }
  else if(z==='salva-ok'){ const i = TM.salva.i, nm = (($('tz-nome')||{}).value||'').trim().slice(0,16) || tr('Lente {n}',{n:i+1}); TM.lenti[i] = {nome:nm, k:TM.scelti.slice()}; salvaLenti(); TM.lenteNome = nm; TM.lenteAg = null; TM.salva = null; apriFoglioTemi('strumenti'); disegnaTemi(); }
  return true;
}
