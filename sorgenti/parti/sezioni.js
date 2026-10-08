/* ===== Progetti, Agorà e Proposte in anteprima: dal mockup unico, dati dalla demo ===== */
(function(){
'use strict';
const T = (s,v) => window.AGR.tr(s,v), IT = () => window.AGR.lingua()==="it";
const icoInfo = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.3" stroke="currentColor" stroke-width="1.4"/><path d="M8 7.2v4M8 4.8v.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
/* Lorenzo, 4 ottobre: senza demo la sezione non deve sembrare un buco. Invito alla demo, poi l'avviso sulle proposte e il tasto Proponi */
function vuotoDemo(cosa, proponi){ return `<section class="stack" style="padding-top:12px"><div class="tipo">${cosa}</div><h1>${T("Ancora niente qui")}</h1>
  <p>${T("Questa sezione si riempie quando aprono le iscrizioni.")}</p>
  <div class="invito-demo"><div style="font-weight:600">${T("Vuoi vedere come funziona?")}</div><p class="meta" style="color:var(--testo)">${T("Carica la demo: progetti, istanze, tavoli ed eventi d’esempio, anche sulla mappa. Resta solo su questo telefono e la togli quando vuoi dalle Impostazioni.")}</p>
    <button class="tasto pri" data-az="carica-demo-sez">${T("Carica la demo")}</button><p class="meta" id="msg-demo-sez" role="status"></p></div></section>
  ${proponi}`; }
function avvisoProposte(){ return `<div class="avviso-proposte" role="note">${icoInfo}<span>${T("Stiamo lavorando alla ricezione delle proposte: è prevista per la prima metà del 2027. Intanto puoi vedere com’è fatto il modulo.")}</span></div>`; }
function caricaDemoSez(b){ b.disabled = true; b.textContent = T("Carico la demo…"); window.AGR.caricaDemo(); }
(function(){
/* ===== Agorà: tutte le istanze con la struttura di «Diritto abitativo» (dati in window.IST) ===== */
const STRATI = {
  sociale:{label:"Sociale e community",pp:"#E91E8C",pb:"#FCE4EC",pt:"#880E4F"},
  manifestazioni:{label:"Manifestazioni",pp:"#E53935",pb:"#FFEBEE",pt:"#B71C1C"},
  conferenze:{label:"Conferenze e talk",pp:"#009688",pb:"#E0F2F1",pt:"#004D40"},
  benessere:{label:"Benessere e meditazione",pp:"#7CB342",pb:"#F1F8E9",pt:"#1A5C28"},
  arte:{label:"Arte e cultura",pp:"#3A8FD8",pb:"#EAF2FB",pt:"#0B3D6B"},
  teatro:{label:"Teatro e danza",pp:"#7B52D4",pb:"#EDE7F6",pt:"#311B92"},
  laboratori:{label:"Laboratori e workshop",pp:"#FFC107",pb:"#FFF8E1",pt:"#7A5C00"},
  volontariato:{label:"Volontariato",pp:"#388E3C",pb:"#E8F5E9",pt:"#1A4D2A"}
};
const A = window.AGR; let ICONE = {};
const bersaglio = s => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="var(--ic)" stroke-width="1.8"/><circle cx="12" cy="12" r="6" stroke="var(--ic)" stroke-width="1.8"/><circle cx="12" cy="12" r="2.2" fill="var(--ic)"/></svg>`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const freccia = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M5.5 3 9.5 7l-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const frecciaSx = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M8.5 3 4.5 7l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const spunta = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const icoPdf = '<svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 1.5v8M3.8 6.3 7 9.5l3.2-3.2M2 12h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ---- date ---- */
const maiu = s => s.charAt(0).toUpperCase()+s.slice(1), minu = s => IT() ? s.charAt(0).toLowerCase()+s.slice(1) : s;
const dIso = s => { const [y,m,d] = s.split("-").map(Number); return new Date(y,m-1,d); };
const loc = () => window.AGR.dloc();
const dataLunga = iso => maiu(dIso(iso).toLocaleDateString(loc(), {weekday:"long", day:"numeric", month:"long"}));
const dataCorta = iso => dIso(iso).toLocaleDateString(loc(), {day:"numeric", month:"long"});
const meseAnno = ym => { const [y,m] = ym.split("-").map(Number); return new Date(y,m-1,1).toLocaleDateString(loc(), {month:"long", year:"numeric"}); };
const piu = (iso,n) => { const d = dIso(iso); d.setDate(d.getDate()+n); return d.toLocaleDateString(loc(), {day:"numeric", month:"long"}); };

/* ---- dati: passi, date e firme dei rendiconti si calcolano ---- */
let ISTANZE = [], _pronto = null;
function prepara(){
  const D = A.demo(); if(!D || !D.istanze){ ISTANZE = []; _pronto = null; return false; }
  if(_pronto===D.caricata+window.AGR.lingua()) return true; _pronto = D.caricata+window.AGR.lingua();
  const IST = JSON.parse(JSON.stringify(D.istanze)); ICONE = IST.icone;
  ISTANZE = IST.lista.slice().sort((x,y)=>x.da.localeCompare(y.da));
ISTANZE.forEach(a => a.tavoli.forEach(t => {
  t.incontri.forEach((i,k) => {
    i.p = k+1; i.data = dataLunga(i.iso); i.dove = i.zona ? `${i.citta}, ${i.zona}` : i.citta;
    i.pubblicato = i.pubblicato || piu(i.iso,3);
    const s = t.soggetti[i.di||0]; i.scritto = `${s[0]} (${s[2]})`;
    i.presenti = T("{a} su {b}",{a:t.soggetti.length, b:t.soggetti.length});
  });
  const pr = t.prossimo;
  if(pr){ pr.p = t.incontri.length+1; pr.data = dataLunga(pr.iso); pr.dove = pr.zona ? `${pr.citta}, ${pr.zona}` : pr.citta; pr.prov = IST.citta[pr.citta][2]; }
}));
  IS = ISTANZE[0]; TAVOLI = IS.tavoli; return true;
}
const STATI_PARTE = ["Da iniziare","Domanda scritta","Dati in raccolta","Prima bozza della regola","Testo pronto"];
const livello = t => STATI_PARTE.indexOf(t.statoParte);
function fase(a){
  const inc = a.tavoli.reduce((n,t)=>n+t.incontri.length,0), media = a.tavoli.reduce((n,t)=>n+livello(t),0)/a.tavoli.length;
  if(a.conclusa) return {k:"fine", t:T("Portata a termine")};
  if(a.permanente) return {k:"perm", t:T("Permanente")};
  if(!inc) return {k:"inizio", t:T("Sta per cominciare")};
  if(media>=3) return {k:"avanti", t:T("Molto avanzata")};
  if(inc<=2) return {k:"appena", t:T("Appena cominciata")};
  return {k:"corso", t:T("In corso")};
}
const idEv = (a,t) => `demo-istanza-${a.id}-t${t.n}`;        /* gli id degli eventi Istanza della Mappa */
const idFine = a => `demo-istanza-${a.id}-fine`;

const salvati = A.salvati;   /* lo stesso Calendario della Mappa */
let filtro = "tutte";   /* filtro per strato dell'elenco, come nell'app online */
let pila = [], stato = {v:"tutte"}, IS = null, TAVOLI = [];
const $s = document.getElementById("pag-agora"), $p = document.getElementById("pagina-agora");
function usa(id){ IS = ISTANZE.find(x=>x.id===id) || ISTANZE[0]; TAVOLI = IS.tavoli; }

/* ---- pezzi ---- */
function piatto(n, posti, size){
  size = size || 64; let s = "";
  for(let i=0;i<posti;i++){ const a = -Math.PI/2 + i*2*Math.PI/posti; s += `<circle cx="${(32+26*Math.cos(a)).toFixed(1)}" cy="${(32+26*Math.sin(a)).toFixed(1)}" r="5" fill="var(--ic)"/>`; }
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" aria-hidden="true" style="flex-shrink:0"><circle cx="32" cy="32" r="17" fill="var(--it)" stroke="var(--ic)" stroke-width="2"/>${s}${n?`<text x="32" y="38" text-anchor="middle" font-family="DM Serif Display, Georgia, serif" font-size="18" fill="var(--ic)">${n}</text>`:""}</svg>`;
}
function camminoCorto(t){
  const k = t.incontri.length; let h = "";
  for(let i=0;i<k;i++){ h += '<span class="pt"></span>' + (i<k-1 ? '<span class="tr"></span>' : ""); }
  if(t.prossimo) h += (k?'<span class="tr futuro"></span>':"") + '<span class="pt vuoto"></span>' + (k?"":'<span style="flex:1"></span>');
  else h += '<span class="tr"></span><span class="pt fine">' + spunta + '</span>';
  return `<div class="cammino" aria-hidden="true">${h}</div>`;
}
function strati(ids, attivi){
  return `<div class="strati">${ids.map(id=>{const s=STRATI[id];return `<${attivi?'button class="strato" data-strato="'+id+'"':'span class="strato"'} style="--pp:${s.pp};--pb:${s.pb};--pt:${s.pt}"><span>${T(s.label)}</span></${attivi?"button":"span"}>`;}).join("")}</div>`;
}
const cittaDi = t => [...new Set(t.soggetti.map(s=>s[2]))].join(" · ");
const iniziali = nome => nome.split(" ").filter(w=>w.length>2).slice(0,2).map(w=>w[0]).join("").toUpperCase();
const tacche = t => { const liv = livello(t); return `<span class="tacche" aria-label="${T(t.statoParte)}: ${T("passo {a} di {b}",{a:liv, b:STATI_PARTE.length-1})}">${STATI_PARTE.slice(1).map((_,i)=>`<span class="tacca${i<liv?" piena":""}"></span>`).join("")}</span>`; };
const pillFase = a => { const f = fase(a); return `<span class="fase fase-${f.k}">${f.k==="fine"?spunta:""}${f.t}</span>`; };
function prossimoDi(a){ return a.tavoli.map(t=>t.prossimo).filter(Boolean).sort((x,y)=>x.iso.localeCompare(y.iso))[0]; }

function metaIstanza(){
  const sogg = TAVOLI.reduce((n,t)=>n+t.soggetti.length,0);
  const citta = new Set(TAVOLI.flatMap(t=>t.soggetti.map(s=>s[2]))).size;
  const inc = TAVOLI.reduce((n,t)=>n+t.incontri.length,0);
  const nInc = inc===1 ? T("1 incontro fatto") : T("{n} incontri fatti",{n:inc});
  const da = IS.conclusa ? T("Aperta a {a}, conclusa a {b}",{a:meseAnno(IS.da), b:meseAnno(IS.conclusa.iso.slice(0,7))}) : inc ? T("Aperta da {a}",{a:meseAnno(IS.da)}) : T("Si apre a {a}",{a:meseAnno(IS.da)});
  const dove = citta===1 ? T("{n} soggetti, tutti a {c}",{n:sogg, c:TAVOLI[0].soggetti[0][2]}) : T("{n} soggetti in {c} città",{n:sogg, c:citta});
  return `${da} · ${T("{n} tavoli",{n:TAVOLI.length})} · ${dove}${inc?` · ${nInc}`:""}`;
}
function obiettivoBox(){
  const righe = TAVOLI.map(t=>`<button class="parte-riga" data-tavolo="${t.n}"><span class="num s">${t.n}</span>
      <span class="parte-t"><span class="t">${esc(maiu(t.parte.replace(/^Scrive /,"").replace(/\.$/,"")))}</span><span class="meta">${T(t.statoParte)}</span></span>${tacche(t)}</button>`).join("");
  return `<section class="obiettivo">${bersaglio(28)}<div class="stack-s" style="min-width:0;flex:1"><div class="eyebrow">${IS.conclusa?T("Obiettivo raggiunto: la proposta è scritta e consegnata"):T("Obiettivo comune a tutti i tavoli")}</div>
    <div class="testo-ob">${esc(IS.obiettivo)}</div><p class="meta" style="color:var(--testo)">${esc(IS.obiettivoSpiega)}</p>
    <div class="parti"><div class="meta" style="font-weight:600;color:var(--testo)">${T("Le parti della proposta")}</div>${righe}
    <div class="meta">${T("Ogni parte passa per:")} ${STATI_PARTE.slice(1).map(x=>T(x)).join(" → ")}.</div></div></div></section>`;
}
function tastoSalva(id){
  return salvati.has(id) ? `<button class="tasto fatto" data-salva="${id}" aria-pressed="true">${spunta}${T("Nel calendario")}</button>`
                         : `<button class="tasto pri" data-salva="${id}" aria-pressed="false">${T("Salva in calendario")}</button>`;
}
/* Portata a termine: cosa è stato consegnato, a chi, e cosa succede adesso */
function esitoBox(){
  const c = IS.conclusa, r = c.restituzione;
  const tappe = c.tappe.map(([s,t,q,d])=>`<div class="esito-p ${s}"><span class="pallino">${s==="fatto"?spunta:""}</span><div><div class="t">${esc(t)} <span class="meta">· ${esc(q)}</span></div><div class="meta">${esc(d)}</div></div></div>`).join("");
  return `<section class="esito"><div class="intesta"><span class="sigillo">${spunta}</span><div><div class="eyebrow">${T("Portata a termine")} · ${dataCorta(c.iso)} ${c.iso.slice(0,4)}</div><h2>${T("La proposta è consegnata")}</h2></div></div>
    <p>${IT() ? `${esc(c.come)} al ${esc(c.a)}, con ${c.firme} firme. ${esc(c.norma)}` : `${esc(c.come)} · ${esc(c.a)} · ${T("{n} firme",{n:c.firme})}. ${esc(c.norma)}`}</p>
    <div class="esito-passi">${tappe}</div>
    <div class="tasti"><button class="tasto sec" data-az="proposta">${T("Leggi la proposta")} ${freccia}</button></div></section>
  <section class="stack" style="gap:8px"><h2>${T("L’ultimo incontro")}</h2>
    <article class="incontro prossimo"><div class="eyebrow">${T("Evento Istanza · restituzione")}</div>
      <h3>${dataLunga(r.iso)}, Torino</h3><div class="meta">${r.ora} · ${esc(r.posto)}</div>
      <div>${T("In programma:")} ${esc(r.programma)}</div>
      <div class="tasti"><button class="tasto sec" data-mappa-ev="${idFine(IS)}">${T("Vedi sulla mappa")}</button>${tastoSalva(idFine(IS))}</div></article></section>`;
}
function tuttiIPassi(){ return TAVOLI.flatMap(t=>t.incontri.map(i=>({...i, t}))).sort((a,b)=>b.iso.localeCompare(a.iso)); }
function camminoIstanza(){
  const tutti = tuttiIPassi(), quanti = stato.mostra||4, vis = tutti.slice(0,quanti), c = IS.conclusa;
  const testa = c ? `<div class="passo"><div class="rail"><span class="num fine">${spunta}</span><span class="filo"></span></div>
      <article class="incontro"><div class="eyebrow">${T("L’istanza · consegna")}</div><div style="font-weight:600">${dataLunga(c.iso)}, Torino</div>
        <div>${IT() ? `La proposta è depositata al ${esc(c.a)}, con ${c.firme} firme.` : `${T("La proposta è depositata")}: ${esc(c.a)} · ${T("{n} firme",{n:c.firme})}.`}</div><button class="link" data-az="proposta">${T("Leggi la proposta")} ${freccia}</button></article></div>` : "";
  const righe = vis.map((i,idx)=>`
    <div class="passo"><div class="rail"><span class="num">${i.t.n}</span>${idx<vis.length-1||quanti<tutti.length?'<span class="filo"></span>':""}</div>
      <article class="incontro"><div class="eyebrow">${T("Tavolo {n}",{n:i.t.n})} · ${esc(i.t.titolo)} · ${T("passo {n}",{n:i.p})}</div>
        <div style="font-weight:600">${i.data}, ${i.dove}</div><div>${esc(i.avanti)}</div>
        <button class="link" data-rend="${i.t.n}-${i.p}">${T("Leggi il rendiconto")} ${freccia}</button></article></div>`).join("");
  const resto = tutti.length - quanti;
  if(!tutti.length){
    const pr = prossimoDi(IS), t = TAVOLI.find(x=>x.prossimo===pr);
    return `<section class="stack"><div class="stack-s"><h2>${T("Il cammino dell’istanza")}</h2></div>
      <div class="vuoto-box">${T("Il cammino comincia {d} a {c}, con il primo incontro del Tavolo {n}. Dopo ogni incontro, qui compare il passo avanti.",{d:minu(pr.data), c:pr.citta, n:t.n})}</div></section>`;
  }
  return `<section class="stack"><div class="stack-s"><h2>${T("Il cammino dell’istanza")}</h2>
    <p class="meta">${T("Tutti i passi avanti dei tavoli, dal più recente. Il numero nel cerchio è il tavolo.")}</p></div>
    <div>${testa}${righe}</div>
    ${resto>0?`<button class="tasto sec" style="flex:none" data-az="altri">${T("Mostra altri {n} passi avanti",{n:Math.min(4,resto)})}</button>`:`<p class="nota">${T("Hai visto tutti i {n} passi avanti.",{n:tutti.length})}</p>`}</section>`;
}

function vai(nuovo){ pila.push(stato); stato = nuovo; disegna(); $p.scrollTop = 0; }
function indietro(){ stato = pila.pop() || {v:"tutte"}; disegna(); $p.scrollTop = 0; }

/* ---- viste ---- */
function vIstanza(){
  const card = t => {
    const k = t.incontri.length, u = t.incontri[k-1], pr = t.prossimo;
    const riga = pr ? (k ? `${k===1?T("1 incontro fatto"):T("{n} incontri fatti",{n:k})} · ${T("prossimo {d}",{d:minu(pr.data)})}, ${pr.citta}` : `${T("Il tavolo si sta apparecchiando")} · ${T("primo incontro {d}",{d:minu(pr.data)})}, ${pr.citta}`)
                    : IS.conclusa ? T("{n} incontri · la sua parte è nella proposta consegnata",{n:k}) : T("{n} incontri fatti · parte pronta, aspetta gli altri tavoli",{n:k});
    return `<button class="card" data-tavolo="${t.n}">
      <div class="testa">${piatto(t.n, t.soggetti.length)}<div>
        <div class="eyebrow">${T("Tavolo {n}",{n:t.n})} · ${T("{n} soggetti",{n:t.soggetti.length})}</div>
        <h3>${esc(t.titolo)}</h3><div class="meta">${esc(cittaDi(t))}</div></div></div>
      <div class="parte">${bersaglio(16)}<span><strong>${T("Per l’obiettivo:")}</strong> ${esc(minu(t.parte))}</span></div>
      <div class="stack-s">${camminoCorto(t)}<div class="meta">${riga}</div></div>
      ${k ? `<div class="ultimo"><div class="eyebrow">${T("Ultimo passo avanti")} · ${dataCorta(u.iso)}, ${u.dove}</div><div>${esc(u.avanti)}</div></div>`
          : `<div class="vuoto-box">${T("Ancora nessun rendiconto: il primo arriverà dopo l’incontro di {c}.",{c:pr.citta})}</div>`}
      ${t.cerca ? `<div class="cerca-posto"><strong>${T("Al tavolo c’è ancora posto")}</strong> ${IT()?"per ":"· "}${esc(t.cerca)}</div>` : ""}
      <div class="apri">${T("Apri il tavolo")} ${freccia}</div>
    </button>`;
  };
  const come = IS.permanente
    ? T("Ogni tavolo affronta una parte dell’obiettivo e si incontra di persona. Ogni incontro è un <strong>evento Istanza</strong>, visibile sulla mappa; dopo, il tavolo pubblica il <strong>rendiconto</strong>. Quando una parte è pronta diventa una regola di Agorapp, e il tavolo riparte.")
    : T("Ogni tavolo affronta una parte dell’obiettivo. Chi siede al tavolo si incontra di persona, ogni volta in un luogo diverso. Ogni incontro è un <strong>evento Istanza</strong>, visibile sulla mappa. Dopo, il tavolo pubblica il <strong>rendiconto</strong>: di cosa si è parlato e quale passo avanti si è fatto verso l’obiettivo.");
  return `<button class="indietro" data-az="tutte">${frecciaSx}${T("Tutte le istanze")}</button>
  <section class="stack">
    <div class="intesta"><div class="tile">${ICONE[IS.id]}</div><div><div class="tipo">${IS.permanente?T("Istanza permanente"):T("Istanza")}</div><h1>${esc(IS.titolo)}</h1></div></div>
    <div>${pillFase(IS)}</div>
    <p>${esc(IS.descrizione)}</p>
    <div class="meta">${metaIstanza()}</div>
    ${strati(IS.strati, true)}
  </section>
  ${obiettivoBox()}
  ${IS.conclusa ? esitoBox() : ""}
  <section class="come">${piatto(0,4,40)}<div class="stack-s"><div style="font-weight:600">${T("Come funzionano i tavoli")}</div><p>${come}</p></div></section>
  <section class="stack"><h2>${T("I tavoli")}</h2>${TAVOLI.map(card).join("")}
  <p class="nota">${T("I tavoli sono in ordine di apertura, non di popolarità.")}</p></section>
  ${camminoIstanza()}`;
}

function vTavolo(n){
  const t = TAVOLI.find(x=>x.n===n), pr = t.prossimo, k = t.incontri.length;
  const passati = t.incontri.slice().reverse().map((i,idx)=>`
    <div class="passo"><div class="rail"><span class="num">${i.p}</span>${idx<k-1?'<span class="filo"></span>':""}</div>
      <article class="incontro"><div style="font-weight:600">${i.data}, ${i.dove}</div>
        <div class="meta">${T("Passo avanti")}</div><div>${esc(i.avanti)}</div>
        <button class="link" data-rend="${t.n}-${i.p}">${T("Leggi il rendiconto")} ${freccia}</button></article></div>`).join("");
  const testa = pr
    ? `<div class="passo"><div class="rail"><span class="num vuoto">${pr.p}</span>${k?'<span class="filo futuro"></span>':""}</div>
      <article class="incontro prossimo"><div class="eyebrow">${k?T("Prossimo incontro"):T("Primo incontro")} · ${T("evento Istanza")}</div>
        <h3>${pr.data}, ${pr.dove}</h3><div class="meta">${pr.ora} · ${pr.posto?esc(pr.posto)+" · ":""}[INDIRIZZO CON CIVICO], ${pr.citta} (${pr.prov})</div>
        <div>${T("In programma:")} ${esc(pr.programma)}</div>
        <div class="tasti"><button class="tasto sec" data-mappa="${t.n}">${T("Vedi sulla mappa")}</button>${tastoSalva(idEv(IS,t))}</div></article></div>`
    : `<div class="passo"><div class="rail"><span class="num fine">${spunta}</span>${k?'<span class="filo"></span>':""}</div>
      <article class="incontro chiuso"><div class="eyebrow">${IS.conclusa?T("Il tavolo ha finito il suo lavoro"):T("La parte è pronta")}</div>
        <div>${IS.conclusa?(IT()?`La sua parte è nella proposta consegnata il ${dataCorta(IS.conclusa.iso)} al ${esc(IS.conclusa.a)}.`:T("La sua parte è nella proposta consegnata il {d}.",{d:dataCorta(IS.conclusa.iso)})):esc(t.attesa||"")}</div>
        ${IS.conclusa?`<button class="link" data-az="proposta">${T("Leggi la proposta")} ${freccia}</button>`:""}</article></div>`;
  return `<button class="indietro" data-az="indietro">${frecciaSx}${esc(IS.titolo)}</button>
  <section style="display:flex;gap:12px;align-items:flex-start">${piatto(t.n,t.soggetti.length)}
    <div class="stack-s" style="min-width:0"><div class="eyebrow">${T("Tavolo {n}",{n:t.n})} · ${T("aperto da {d}",{d:t.da})}</div><h1>${esc(t.titolo)}</h1><p>${esc(t.domanda)}</p></div></section>
  <section class="richiamo">${bersaglio(18)}<div class="stack-s" style="gap:2px"><div class="meta">${T("Obiettivo dell’istanza")}</div><div style="font-weight:600">${esc(IS.obiettivo)}</div><div>${T("La parte di questo tavolo:")} ${esc(minu(t.parte))}</div>
    <div class="meta" style="display:flex;gap:8px;align-items:center;margin-top:2px">${tacche(t)}${T(t.statoParte)}</div></div></section>
  ${t.finale ? `<section class="avanti"><h3>${T("La parte scritta")}</h3><p class="testo-lungo">${esc(t.finale)}</p></section>` : ""}
  <section class="stack" style="gap:8px"><h2>${T("Al tavolo")}</h2>
    <div class="lista">${t.soggetti.map(s=>`<div class="riga"><span class="ini">${iniziali(s[0])}</span><div style="min-width:0"><div class="t">${esc(s[0])}</div><div class="meta">${s[1]} · ${s[2]}</div></div></div>`).join("")}
    ${t.cerca?`<div class="riga"><span class="ini vuoto">+</span><div style="min-width:0"><div class="t">${T("C’è ancora posto")}</div><div class="meta">${T("Il tavolo cerca:")} ${esc(t.cerca)}</div></div></div>`:""}</div></section>
  <section class="stack"><h2>${T("Il cammino del tavolo")}</h2>
    ${testa}
    ${k? passati : `<div class="vuoto-box">${T("Nessun incontro ancora. Dopo il primo, qui compariranno i passi avanti e i rendiconti.")}</div>`}
  </section>`;
}

function vRendiconto(n,p){
  const t = TAVOLI.find(x=>x.n===n), i = t.incontri.find(x=>x.p===p), succ = t.incontri.find(x=>x.p===p+1), pr = t.prossimo;
  const dopo = succ ? {num:succ.p, vuoto:false, data:`${succ.data}, ${succ.dove}`, riga:T("già svolto · leggi il rendiconto"), az:`data-sost="${n}-${succ.p}"`}
             : pr ? {num:pr.p, vuoto:true, data:`${pr.data}, ${pr.dove}`, riga:`${pr.ora} · ${pr.programma}`, az:`data-az="indietro"`}
             : IS.conclusa ? {num:spunta, vuoto:false, data:T("La proposta consegnata il {d}",{d:dataCorta(IS.conclusa.iso)}), riga:T("leggi la proposta"), az:`data-az="proposta"`}
             : {num:spunta, vuoto:false, data:T("La parte è pronta"), riga:t.attesa||"", az:`data-az="indietro"`};
  return `<button class="indietro" data-az="indietro">${frecciaSx}${T("Tavolo {n}",{n})} · ${esc(t.titolo)}</button>
  <section class="stack" style="gap:8px"><div class="eyebrow">${T("Rendiconto")} · ${T("passo {n}",{n:p})}</div>
    <h1>${T("Incontro di {d}",{d:minu(i.data)})}, ${i.dove}</h1>
    <div class="meta">${T("Evento Istanza")} · ${i.ora} · [INDIRIZZO CON CIVICO], ${i.citta}</div>
    <div class="meta">${T("Presenti {p} soggetti · scritto da {s} per il tavolo · pubblicato il {d}",{p:i.presenti, s:esc(i.scritto), d:i.pubblicato})}</div></section>
  <section class="richiamo">${bersaglio(18)}<div class="stack-s" style="gap:2px"><div class="meta">${T("Obiettivo dell’istanza")} · ${esc(IS.titolo)}</div><div style="font-weight:600">${esc(IS.obiettivo)}</div></div></section>
  <section class="stack" style="gap:8px"><h3>${T("Di cosa si è parlato")}</h3><p class="testo-lungo">${esc(i.parlato)}</p></section>
  <section class="avanti"><h3>${T("Il passo avanti verso l’obiettivo")}</h3><p class="testo-lungo">${esc(i.avantiLungo||i.avanti)}</p></section>
  <section class="stack" style="gap:8px"><h3>${T("Cosa resta aperto")}</h3><p class="testo-lungo">${esc(i.aperto)}</p></section>
  <section class="stack" style="gap:8px"><h3>${succ?T("Chi fa cosa prima dell’incontro successivo"):pr?T("Chi fa cosa prima del prossimo incontro"):T("Chi fa cosa adesso")}</h3>
    <div class="lista">${(i.compiti||[]).map(c=>`<div class="riga compito"><span class="ini">${c[0]==="Tutti i soggetti"?"T":iniziali(c[0])}</span><div style="min-width:0"><div class="t">${esc(c[0])}</div><div>${esc(c[1])}</div></div></div>`).join("")}</div></section>
  <section class="stack" style="gap:8px"><h3>${succ?T("Incontro successivo"):pr?T("Prossimo incontro"):T("E poi")}</h3>
    <button class="prossimo-link" ${dopo.az}><span class="num ${dopo.vuoto?"vuoto":""}">${dopo.num}</span><div><div style="font-weight:600">${dopo.data}</div><div class="meta">${esc(dopo.riga)}</div></div><span style="color:var(--verde)">${freccia}</span></button>
    ${p>1?`<button class="link" data-sost="${n}-${p-1}">${frecciaSx}${T("Rendiconto del passo {n}",{n:p-1})}</button>`:""}</section>
  <button class="tasto sec" style="flex:none" data-az="pdf">${icoPdf}${T("PDF del rendiconto")}</button>`;
}

function vTutte(){
  const card = a => {
    const pr = prossimoDi(a), f = fase(a);
    const sotto = a.conclusa ? `${T("Proposta consegnata il {d}",{d:dataCorta(a.conclusa.iso)})} · ${T("ultimo incontro {d}",{d:minu(dataLunga(a.conclusa.restituzione.iso))})}, Torino`
                : pr ? `${f.k==="inizio"?T("Primo incontro"):T("Prossimo incontro")} ${minu(pr.data)}, ${pr.citta}` : "";
    return `<button class="ist c-${a.id}" data-ist="${a.id}">
      <div class="intesta"><div class="tile s">${ICONE[a.id]}</div><div><h3>${esc(a.titolo)}</h3></div></div>
      <div>${pillFase(a)}</div>
      <p>${esc(a.descrizione)}</p>
      <div class="ob"><strong>${T("Obiettivo:")}</strong> ${esc(a.obiettivo)}</div>
      <div class="avanzamento"><span class="meta">${T("Le parti")}</span>${a.tavoli.map(tacche).join('<span class="sep"></span>')}</div>
      <div class="meta">${sotto}</div>
      ${strati(a.strati,false)}
      <div class="apri">${T("{n} tavoli",{n:a.tavoli.length})} · ${T("apri l’istanza")} ${freccia}</div></button>`;
  };
  const presenti = Object.keys(STRATI).filter(id => ISTANZE.some(a=>a.strati.includes(id)));
  const lista = ISTANZE.filter(a => filtro==="tutte" || a.strati.includes(filtro));
  const filtri = `<button class="pill tutti" data-filtro="tutte" aria-pressed="${filtro==="tutte"}"><span>${T("Tutte")}</span></button>`
    + presenti.map(id=>{const s=STRATI[id];return `<button class="pill dot" data-filtro="${id}" aria-pressed="${filtro===id}" style="--pp:${s.pp};--pb:${s.pb};--pt:${s.pt}"><span>${T(s.label)}</span></button>`;}).join("");
  return `<section class="stack"><div class="tipo">${T("Agorà")}</div><h1>${T("Istanze civiche dal basso")}</h1>
    <p>${T("Le istanze che vedi qui non sono petizioni. Sono ipotesi di trasformazione nate dal basso: dagli eventi, dalle assemblee, dalle conversazioni nei cortili. Ogni istanza ha un obiettivo, e tavoli che ci lavorano. Ognuna è a un punto diverso del suo cammino.")}</p></section>
    <div class="filtri" role="group" aria-label="${T("Filtra per strato")}">${filtri}</div>
    <section class="stack">${lista.map(card).join("")}${lista.length?"":`<p class="nota">${T("Nessuna istanza in questo strato.")}</p>`}</section>
    <p class="nota">${T("Le istanze sono in ordine di apertura, non di popolarità.")}</p>
    ${tastoProponi()}`;
}
function tastoProponi(){
  return `${window.AGR.bloccoInteresse ? window.AGR.bloccoInteresse("agora") : ""}${avvisoProposte()}<button class="proponi" data-az="proponi"><span class="piu">+</span><span><b>${T("Proponi una nuova istanza")}</b><span class="meta">${T("Un obiettivo comune e un primo tavolo da apparecchiare")}</span></span></button>`;
}

/* ---- fogli ---- */
function foglio(html){ A.foglio(html, "sez-agora c-"+IS.id); }
function chiudiFoglio(){ A.chiudi(); }
const rigaCarta = (k,v) => `<div class="pr" style="grid-template-columns:84px 1fr"><b>${k}</b><span>${esc(v)}</span></div>`;
function pdfRendiconto(n,p){
  const t = TAVOLI.find(x=>x.n===n), i = t.incontri.find(x=>x.p===p);
  return `<div class="eyebrow">${T("PDF del rendiconto")}</div><h3>${T("Anteprima")}</h3>
    <div class="carta"><div class="cm">Agorapp · Agorà · ${esc(IS.titolo)}</div><div class="ct">${T("Tavolo {n}",{n})} · ${esc(t.titolo)}</div>
      <div class="cm" style="text-transform:none;letter-spacing:0;font-weight:500">${T("Rendiconto del passo {n}",{n:p})} · ${i.data}, ${i.dove} · ${i.ora}</div>
      ${rigaCarta(T("Obiettivo"), IS.obiettivo)}${rigaCarta(T("Di cosa"), i.parlato)}${rigaCarta(T("Passo avanti"), i.avantiLungo||i.avanti)}${rigaCarta(T("Resta aperto"), i.aperto)}
      ${rigaCarta(T("Chi fa cosa"), (i.compiti||[]).map(c=>c[0]+": "+c[1]).join(" · "))}
      <div class="cp">${T("Scritto da {s} per il tavolo · pubblicato il {d} · presenti {p}.",{s:esc(i.scritto), d:i.pubblicato, p:i.presenti})}</div></div>
    <button class="tasto pri" style="flex:none" data-stampa-carta="1">${T("Scarica il PDF")}</button>`;
}
function pdfProposta(){
  const c = IS.conclusa;
  return `<div class="eyebrow">${T("La proposta consegnata")}</div><h3>${esc(IS.obiettivo)}</h3>
    <div class="carta"><div class="cm">Agorapp · Agorà · ${esc(IS.titolo)}</div><div class="ct">${esc(c.come)}</div>
      <div class="cm" style="text-transform:none;letter-spacing:0;font-weight:500">${IT()?`Al ${esc(c.a)}`:esc(c.a)} · ${T("depositata il {d}",{d:dataCorta(c.iso)+" "+c.iso.slice(0,4)})} · ${T("{n} firme",{n:c.firme})}</div>
      ${TAVOLI.map(t=>rigaCarta(T("Parte {n}",{n:t.n}), `${t.titolo}. ${t.finale}`)).join("")}
      <div class="cp">${T("Scritta da {s} soggetti in {t} tavoli e {i} incontri. Ogni rendiconto è nell’Agorà.",{s:TAVOLI.reduce((n,t)=>n+t.soggetti.length,0), t:TAVOLI.length, i:TAVOLI.reduce((n,t)=>n+t.incontri.length,0)})}</div></div>
    <button class="tasto pri" style="flex:none" data-stampa-carta="1">${T("Scarica il PDF")}</button>`;
}
function mappaDi(t){
  const pr = t.prossimo;
  return `<div class="eyebrow">${T("Evento Istanza")} · ${esc(IS.titolo)} · ${T("Tavolo {n}",{n:t.n})}, ${T("passo {n}",{n:pr.p})}</div>
    <h3>${pr.data}, ${pr.citta}</h3><div class="meta">${pr.ora} · [INDIRIZZO CON CIVICO], ${pr.citta} (${pr.prov})</div>
    <div class="mappa"><svg viewBox="0 0 360 180" role="img" aria-label="${T("Anteprima della mappa con il segnaposto dell’incontro")}">
      <rect width="360" height="180" fill="var(--mappa-terra)"/>
      <rect x="20" y="20" width="80" height="50" rx="4" fill="var(--mappa-edificio)"/><rect x="120" y="20" width="90" height="50" rx="4" fill="var(--mappa-edificio)"/>
      <rect x="230" y="20" width="110" height="50" rx="4" fill="var(--mappa-parco)"/><rect x="20" y="100" width="130" height="60" rx="4" fill="var(--mappa-edificio)"/>
      <rect x="230" y="100" width="110" height="60" rx="4" fill="var(--mappa-edificio)"/>
      <path d="M0 85h360M110 0v180M220 0v180" stroke="var(--mappa-strada)" stroke-width="12"/>
      <path d="M0 172c60-10 120 6 180-4s120-8 180 2" stroke="var(--mappa-acqua)" stroke-width="10" fill="none"/>
      <rect x="146" y="99" width="38" height="38" rx="11" fill="var(--it)" stroke="var(--ic)" stroke-width="2.5"/>
      <g transform="translate(152 105) scale(.72)">${ICONE[IS.id].replace('aria-hidden="true"','width="36" height="36"')}</g>
    </svg></div>
    <p class="meta">${T("Sulla mappa l’incontro porta l’icona e il colore della sua istanza. Nell’app si apre la mappa di {c}, centrata sull’incontro.",{c:pr.citta})}</p>`;
}
function foglioAnteprima(){
  return `<div class="tipo">${T("Anteprima")}</div><h3>${T("Tutto pronto, iscrizioni in arrivo")}</h3>
    <p>${T("Progetti e Agorà partiranno quando potremo accogliere chi vi partecipa. Intanto puoi vedere com’è fatto tutto: le bacheche dei progetti, le persone che ci tengono, i tavoli delle istanze, gli eventi sulla mappa.")}</p>
    <p>${T("Le istanze sono quelle dell’app. Obiettivi, tavoli, soggetti e rendiconti sono d’esempio; ogni istanza è messa a un punto diverso del cammino, per vedere come appare dall’inizio alla fine.")}</p>
    <p class="meta">${T("Vuoi proporre un tavolo? Scrivi a")} <span class="mail">info@agorapp.it</span>.</p>`;
}

function disegna(){
  if(!prepara()){ $s.innerHTML = vuotoDemo(T("Agorà"), tastoProponi()); return; }
  if(stato.id) usa(stato.id);
  $p.classList.remove(...[...$p.classList].filter(c=>c.startsWith("c-")));
  $p.classList.add("c-"+(stato.v==="tutte" ? "abitativo" : IS.id));
  let h = "";
  if(stato.v==="istanza") h = vIstanza();
  else if(stato.v==="tavolo") h = vTavolo(stato.n);
  else if(stato.v==="rend") h = vRendiconto(stato.n, stato.p);
  else h = vTutte();
  $s.innerHTML = h;
  $s.style.animation = "none"; void $s.offsetWidth; $s.style.animation = "";
}

document.addEventListener("click", e => {
  const b = e.target.closest("button"); if(!b || !b.closest(".sez-agora")) return;
  if(b.dataset.tavolo){ vai({v:"tavolo", id:IS.id, n:+b.dataset.tavolo}); return; }
  if(b.dataset.rend){ const [n,p] = b.dataset.rend.split("-").map(Number); vai({v:"rend", id:IS.id, n, p}); return; }
  if(b.dataset.sost){ const [n,p] = b.dataset.sost.split("-").map(Number); stato = {v:"rend", id:IS.id, n, p}; disegna(); $p.scrollTop = 0; return; }
  if(b.dataset.filtro){ filtro = b.dataset.filtro; disegna(); return; }
  if(b.dataset.ist){ vai({v:"istanza", id:b.dataset.ist}); return; }
  if(b.dataset.salva){ const id = b.dataset.salva; if(salvati.has(id)) salvati.delete(id); else salvati.add(id); A.aggiorna(); disegna(); return; }
  if(b.dataset.mappa){ const t = TAVOLI.find(x=>x.n===+b.dataset.mappa); if(t.prossimo.citta==="Torino") A.vaiMappa(idEv(IS,t)); else foglio(mappaDi(t)); return; }
  if(b.dataset.mappaEv){ A.vaiMappa(b.dataset.mappaEv); return; }
  if(b.dataset.strato){ A.passerellaStrato(b.dataset.strato); return; }
  const az = b.dataset.az;
  if(az==="proponi"){ A.proponi("istanza"); return; }
  if(az==="carica-demo-sez"){ caricaDemoSez(b); return; }
  if(az==="anteprima"){ foglio(foglioAnteprima()); return; }
  if(az==="indietro"){ indietro(); return; }
  if(az==="tutte"){ vai({v:"tutte"}); return; }
  if(az==="altri"){ stato.mostra = (stato.mostra||4) + 4; disegna(); return; }
  if(az==="pdf"){ foglio(pdfRendiconto(stato.n, stato.p)); return; }
  if(az==="proposta"){ foglio(pdfProposta()); return; }
});

A.agora = {
  ridisegna: disegna,
  home(){ pila = []; stato = {v:"tutte"}; disegna(); $p.scrollTop = 0; },
  apriIstanza(id){ pila = [{v:"tutte"}]; stato = {v:"istanza", id}; A.vaiSezione("agora"); disegna(); $p.scrollTop = 0; },
  apriTavolo(id, n){ pila = [{v:"tutte"},{v:"istanza", id}]; stato = {v:"tavolo", id, n}; A.vaiSezione("agora"); disegna(); $p.scrollTop = 0; }
};

})();
})();
(function(){
'use strict';
const T = (s,v) => window.AGR.tr(s,v), IT = () => window.AGR.lingua()==="it";
const icoInfo = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.3" stroke="currentColor" stroke-width="1.4"/><path d="M8 7.2v4M8 4.8v.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
function vuotoDemo(cosa, proponi){ return `<section class="stack" style="padding-top:12px"><div class="tipo">${cosa}</div><h1>${T("Ancora niente qui")}</h1>
  <p>${T("Questa sezione si riempie quando aprono le iscrizioni.")}</p>
  <div class="invito-demo"><div style="font-weight:600">${T("Vuoi vedere come funziona?")}</div><p class="meta" style="color:var(--testo)">${T("Carica la demo: progetti, istanze, tavoli ed eventi d’esempio, anche sulla mappa. Resta solo su questo telefono e la togli quando vuoi dalle Impostazioni.")}</p>
    <button class="tasto pri" data-az="carica-demo-sez">${T("Carica la demo")}</button><p class="meta" id="msg-demo-sez" role="status"></p></div></section>
  ${proponi}`; }
function avvisoProposte(){ return `<div class="avviso-proposte" role="note">${icoInfo}<span>${T("Stiamo lavorando alla ricezione delle proposte: è prevista per la prima metà del 2027. Intanto puoi vedere com’è fatto il modulo.")}</span></div>`; }
function caricaDemoSez(b){ b.disabled = true; b.textContent = T("Carico la demo…"); window.AGR.caricaDemo(); }
/* ===== Progetti ===== */

(function(){


/* Colori degli strati: LAYERS dell'app online */
const STRATI = {
  musica:{label:"Musica",pp:"#E8A020",pb:"#FAF0D7",pt:"#7A4F00"},
  sociale:{label:"Sociale e community",pp:"#E91E8C",pb:"#FCE4EC",pt:"#880E4F"},
  conferenze:{label:"Conferenze e talk",pp:"#009688",pb:"#E0F2F1",pt:"#004D40"},
  manifestazioni:{label:"Manifestazioni",pp:"#E53935",pb:"#FFEBEE",pt:"#B71C1C"},
  laboratori:{label:"Laboratori e workshop",pp:"#FFC107",pb:"#FFF8E1",pt:"#7A5C00"},
  cibo:{label:"Cibo e ristorazione",pp:"#D84315",pb:"#FBE9E7",pt:"#8B2A00"},
  sport:{label:"Sport",pp:"#43A047",pb:"#E8F5E9",pt:"#1B5E20"},
  teatro:{label:"Teatro e danza",pp:"#7B52D4",pb:"#EDE7F6",pt:"#311B92"},
  benessere:{label:"Benessere e meditazione",pp:"#7CB342",pb:"#F1F8E9",pt:"#1A5C28"}
};
/* Le tre etichette di presenza di Agorapp, con i colori dell'app online */
let TIPO = {}, PROGETTI = [], BACHECHE = {}, _pronto = null;
function prepara(){
  const D = window.AGR.demo(); if(!D || !D.progetti){ PROGETTI = []; _pronto = null; return false; }
  if(_pronto===D.caricata) return true; _pronto = D.caricata;
  TIPO = D.progetti.tipi; PROGETTI = D.progetti.elenco; BACHECHE = D.progetti.bacheche;
  usa(PROGETTI.some(p=>p.id==="cortile") ? "cortile" : PROGETTI[0].id); return true;
}
/* Ogni progetto ha la sua bacheca (window.BACHECHE), con la stessa struttura di quella del Cortile Comune */
let CORTILE, PROSSIMA, POSTI, ANCORE, FATE, VORREBBERO, io, B;
const IO = {}, CAL = {};
function usa(id){
  CORTILE = PROGETTI.find(x=>x.id===id); B = BACHECHE[id];
  const a = B.app, [y,m,d] = a.giorno.split("-").map(Number), dt = new Date(y,m-1,d), L = window.AGR.dloc(), f = o => dt.toLocaleDateString(L, o), lunga = f({weekday:"long", day:"numeric", month:"long"});
  PROSSIMA = {data:lunga.charAt(0).toUpperCase()+lunga.slice(1), corta:f({weekday:"short", day:"numeric", month:"long"}), giorno:f({day:"numeric", month:"long"}), breve:f({day:"numeric", month:"short"}),
    ora:`${a.inizio}–${a.fine}`, luogo:a.posto, civico:a.civico, stato:a.stato, programma:a.programma};
  POSTI = B.mano.posti; ANCORE = B.ancore; FATE = B.fate; VORREBBERO = B.vorrebbero;
  io = IO[id] || (IO[id] = {vengo:false, compagnia:false});
}

let calModo = null;
/* Calendario unico: salvare l'appuntamento = salvare l'evento Pratica della Mappa (stesso id del progetto) */
function syncCal(){ const S = window.AGR.salvati, id = "demo-pratica-"+CORTILE.id; calModo = S.has(id) ? (CAL[id] || "volta") : null; }
let pila = [];
let stato = {v:"tutti"};
let filtro = "tutti", mostrati = 10;   /* paginazione esplicita, 10 alla volta, come nell'app online */
const $s = document.getElementById("pag-progetti"), $p = document.getElementById("pagina-progetti");
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const freccia = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M5.5 3 9.5 7l-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const frecciaSx = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M8.5 3 4.5 7l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const spunta = (s=16) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const piu = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 3v8M3 7h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
/* La mano aperta: il segno di "Vuoi dare una mano?" */
const mano = (s, col) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" aria-hidden="true">
  <rect x="9.2" y="5.5" width="3.6" height="13" rx="1.8" fill="${col||"var(--pin)"}"/>
  <rect x="13.4" y="3" width="3.6" height="15" rx="1.8" fill="${col||"var(--pin)"}"/>
  <rect x="17.6" y="4" width="3.6" height="14" rx="1.8" fill="${col||"var(--pin)"}"/>
  <rect x="21.8" y="7" width="3.4" height="11.5" rx="1.7" fill="${col||"var(--pin)"}"/>
  <rect x="3.6" y="13.6" width="3.6" height="10" rx="1.8" transform="rotate(-38 5.4 18.6)" fill="${col||"var(--pin)"}"/>
  <path d="M9.2 15h16v4.5c0 5.2-3.9 9.5-8.8 9.5h-.8c-3.6 0-6.4-2.4-7.6-5.6L6.6 18.3 9.2 15Z" fill="${col||"var(--pin)"}"/>
</svg>`;
/* Bollini dei ruoli */
const glifo = {
  ancora:'<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="3.2" r="1.7" stroke="currentColor" stroke-width="1.6"/><path d="M8 5v9M5 7.6h6M2.8 9.6a5.2 5.2 0 0 0 10.4 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  fata:'<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.2 9.7 6.3 14.8 8 9.7 9.7 8 14.8 6.3 9.7 1.2 8 6.3 6.3Z" fill="currentColor"/></svg>',
  compagnia:'<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="5.2" cy="5" r="2.2" fill="currentColor"/><circle cx="10.8" cy="5" r="2.2" fill="currentColor"/><path d="M1.5 13.5c0-2.6 1.7-4.2 3.7-4.2s3.7 1.6 3.7 4.2M7.1 13.5c0-2.6 1.7-4.2 3.7-4.2s3.7 1.6 3.7 4.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
};
/* Segnaposto dell'evento Pratica sulla mappa: doppio cerchio color clay */
const pinPratica = (x,y,r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="var(--superficie)" stroke="var(--pin)" stroke-width="2.5"/><circle cx="${x}" cy="${y}" r="${r*0.48}" fill="var(--pin)"/>`;
const icoPin = s => `<svg width="${s}" height="${s}" viewBox="0 0 36 36" fill="none" aria-hidden="true">${pinPratica(18,18,14)}</svg>`;

function pill(s, extra){ return `<span class="pill${extra||""}" style="--pp:${s.pp};--pb:${s.pb};--pt:${s.pt}"><span>${esc(T(s.label))}</span></span>`; }
function pills(ids){ return `<div class="pill-row">${ids.map(id=>pill(STRATI[id]," dot")).join("")}</div>`; }
function vai(nuovo){ pila.push(stato); stato = nuovo; disegna(); $p.scrollTop = 0; }
function indietro(){ stato = pila.pop() || {v:"tutti"}; disegna(); $p.scrollTop = 0; }
function temaBtn(){ return ""; }

/* ------------ Persone ------------ */
function avatar(p, ruolo, grande){
  const b = ruolo==="vorrebbe" ? (p.compagnia ? `<span class="bollino compagnia" aria-hidden="true">${glifo.compagnia}</span>` : "")
                               : `<span class="bollino ${ruolo}" aria-hidden="true">${glifo[ruolo]}</span>`;
  return `<span class="av${p.tipo==="collettivo"?" coll":""}${grande?" grande":""}${p.tu?" tu":""}">${esc(p.sigla)}${b}</span>`;
}
function volto(p, ruolo){
  const lab = ruolo==="ancora" ? T("Ancora") : ruolo==="fata" ? T("Fata") : (p.compagnia ? T("Vorrebbe venire, cerca compagnia") : T("Vorrebbe venire"));
  return `<button class="volto" data-persona="${ruolo}:${p.id}" aria-label="${esc(p.nome)}, ${lab}">${avatar(p, ruolo)}<span class="n">${esc(p.corto||p.nome)}</span></button>`;
}
function vorrebberoTutti(){
  const lista = VORREBBERO.slice();
  if(io.vengo) lista.unshift({id:"tu",sigla:T("Tu"),nome:T("Tu"),tipo:"persona",tu:true,compagnia:io.compagnia});
  return lista;
}
function chiCiTiene(){
  const gruppo = (segno, titolo, sotto, persone, ruolo, extra) => `
    <div class="gruppo">
      <div class="gruppo-testa"><span class="segno ${segno}" aria-hidden="true">${glifo[segno]}</span><div><h3>${titolo}</h3><p class="meta">${sotto}</p></div></div>
      <div class="volti">${persone.map(p=>volto(p, ruolo)).join("")}</div>${extra||""}
    </div>`;
  return `<section class="stack">
    <div class="stack-s"><h2>${T("Chi ci tiene")}</h2><p class="meta">${IT()?`Le persone legate ${B.a}.`:T("Le persone legate al progetto.")} ${T("Il bollino ti dice chi sono e a chi puoi scrivere.")}</p></div>
    ${gruppo("ancora",T("Le Ancore"),IT()?`Reggono il progetto. Scrivi a loro ${B.ancoreScopo}.`:T("Reggono il progetto. Scrivi a loro per organizzarti."),ANCORE,"ancora")}
    ${gruppo("fata",IT()?`Le Fate ${B.di}`:T("Le Fate"),T("Ci tengono e ci sono spesso. Puoi scrivere a loro per sapere com’è, prima di venire."),FATE,"fata")}
    ${gruppo("compagnia",T("Vorrebbero venire il {d}",{d:PROSSIMA.giorno}),T("Solo chi ha scelto di farlo sapere. Con il bollino, chi cerca qualcuno con cui andare."),vorrebberoTutti(),"vorrebbe",
      `<button class="tasto ${io.vengo?"fatto":"sec"} pieno" data-az="vengo">${io.vengo?spunta()+T("Ci sei anche tu"):T("Vorrei venire anch’io")}</button>`)}
  </section>`;
}

/* ------------ La bacheca del progetto ------------ */
function tastoCal(){
  if(!calModo) return `<button class="tasto pri" data-az="cal">${T("Salva in calendario")}</button>`;
  return `<button class="tasto fatto" data-az="cal" aria-pressed="true">${spunta()}${calModo==="serie"?T("Tutti salvati"):T("Nel calendario")}</button>`;
}
function mappaCortili(){
  /* Crocetta stilizzata: i punti indicano la via, non il portone */
  const punti = B.luoghi.punti;
  return `<div class="mappa"><svg viewBox="0 0 360 200" role="img" aria-label="${T("Mappa stilizzata con i luoghi già toccati dal progetto e quello del prossimo appuntamento")}">
    <rect width="360" height="200" fill="var(--mappa-terra)"/>
    <rect x="12" y="12" width="88" height="30" rx="4" fill="var(--mappa-edificio)"/><rect x="118" y="12" width="104" height="30" rx="4" fill="var(--mappa-edificio)"/><rect x="240" y="12" width="108" height="30" rx="4" fill="var(--mappa-edificio)"/>
    <rect x="12" y="76" width="88" height="38" rx="4" fill="var(--mappa-edificio)"/><rect x="118" y="76" width="104" height="38" rx="4" fill="var(--mappa-parco)"/><rect x="240" y="88" width="108" height="34" rx="4" fill="var(--mappa-edificio)"/>
    <rect x="12" y="146" width="62" height="42" rx="4" fill="var(--mappa-edificio)"/><rect x="118" y="164" width="70" height="24" rx="4" fill="var(--mappa-edificio)"/><rect x="240" y="156" width="108" height="32" rx="4" fill="var(--mappa-edificio)"/>
    <path d="M0 58h360M0 134h360M109 0v200M231 0v200" stroke="var(--mappa-strada)" stroke-width="10"/>
    ${punti.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="7" fill="var(--pin)"/><text x="${p.x+11}" y="${p.y+4}" font-family="DM Sans, system-ui, sans-serif" font-size="11" font-weight="600" fill="var(--testo)">${p.m}</text>`).join("")}
    ${pinPratica(300,134,11)}<text x="300" y="112" text-anchor="middle" font-family="DM Sans, system-ui, sans-serif" font-size="11" font-weight="700" fill="var(--ic)">${PROSSIMA.breve}</text>
  </svg></div>`;
}
function vBacheca(){
  const p = CORTILE, t = TIPO[p.tipo];
  const liberi = POSTI.filter(x=>!x.coperto).length;
  return `<button class="indietro" data-az="tutti">${frecciaSx}${T("Tutti i progetti")}</button>
  <section class="stack">
    <div class="stack-s"><div class="pill-row">${pill(t)}</div>
      <div class="tipo">${T("Progetto")} · ${esc(p.zona)}</div><h1>${esc(p.titolo)}</h1></div>
    <p>${esc(p.descrizione)}</p>
    <div class="meta">${T("Da {d}",{d:B.da})} · ${esc(p.stato.toLowerCase())}</div>
    ${pillsMappa(p.strati)}
  </section>

  <section class="prossima" aria-labelledby="t-prossima">
    <div class="eyebrow" id="t-prossima">${T("Il prossimo appuntamento · evento Pratica")}</div>
    <div class="quando">${PROSSIMA.data}, ${PROSSIMA.ora}</div>
    <div><strong>${PROSSIMA.luogo}</strong> <span class="meta">${PROSSIMA.civico}</span></div>
    <span class="stato-volta">${PROSSIMA.stato==="Confermato"?spunta(14):""}${T(PROSSIMA.stato)}</span>
    <div>${PROSSIMA.programma}</div>
    <div class="tasti"><button class="tasto sec" data-az="mappa">${T("Vedi sulla mappa")}</button>${tastoCal()}</div>
  </section>

  <section class="stack">
    <div class="mano-titolo">${mano(34)}<div class="stack-s" style="gap:2px;min-width:0"><h2>${T("Vuoi dare una mano?")}</h2>
      <p class="meta">${T("Ecco cosa serve perché il {d} succeda.",{d:PROSSIMA.giorno})} ${liberi===1?T("1 posto ancora libero"):T("{n} posti ancora liberi",{n:liberi})}.</p></div></div>
    <div class="lista">${POSTI.map(x=>`<div class="riga">
      <span class="posto-ico ${x.coperto?"coperto":"libero"}">${x.coperto?spunta():piu}</span>
      <div><div class="t">${esc(x.t)}</div><div class="meta">${esc(x.d)}</div></div>
      <span class="chip ${x.coperto?"coperto":"libero"}">${x.coperto?T("Coperto"):esc(x.chip)}</span></div>`).join("")}</div>
    <div class="sotto-lista"><span class="meta">${esc(B.mano.grande)}</span><button class="link" data-persona="ancora:${ANCORE[0].id}">${T("Scrivi alle Ancore")} ${freccia}</button></div>
  </section>

  ${chiCiTiene()}

  <section class="come">${icoPin(30)}<div class="stack-s"><div style="font-weight:600">${T("Come funziona un progetto")}</div>
    <p>${T("Ogni appuntamento del progetto è un <strong>evento Pratica</strong> sulla mappa e porta il nome del progetto. Prima di ogni appuntamento la bacheca dice cosa serve. Qui non c’è una chat: per organizzarvi scrivete alle Ancore o alle Fate, e la conversazione resta nei vostri canali.")}</p></div></section>

  <section class="stack">
    <div class="stack-s"><h2>${esc(B.luoghi.titolo)}</h2><p class="meta">${esc(B.luoghi.meta)}</p></div>
    ${mappaCortili()}
    <button class="link" data-az="mappa">${esc(B.luoghi.link)} ${freccia}</button>
  </section>

  <button class="tasto sec pieno" data-az="stampa"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4.5 6V2.5h7V6M4.5 11.5H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1h-1.5M4.5 9.5h7v4h-7z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>${esc(B.stampa.bottone)}</button>
  ${temaBtn()}`;
}

/* ------------ Elenco dei progetti ------------ */
function vTutti(){
  const presenti = Object.keys(STRATI).filter(id => PROGETTI.some(p=>p.strati.includes(id)));
  const lista = PROGETTI.filter(p => filtro==="tutti" || p.strati.includes(filtro));
  const filtri = `<button class="pill tutti" data-filtro="tutti" aria-pressed="${filtro==="tutti"}"><span>${T("Tutti")}</span></button>`
    + presenti.map(id=>{const s=STRATI[id];return `<button class="pill dot" data-filtro="${id}" aria-pressed="${filtro===id}" style="--pp:${s.pp};--pb:${s.pb};--pt:${s.pt}"><span>${T(s.label)}</span></button>`;}).join("");
  return `<section class="stack"><div class="tipo">${T("Progetti")}</div><h1>${T("Pratiche collettive nel tessuto urbano")}</h1>
    <p>${T("La produzione culturale non avviene dove viene riconosciuta. Avviene nei cortili, nei presidi, nelle assemblee informali. Questi progetti esistono indipendentemente da Agorapp: la piattaforma rende visibile ciò che era già in atto.")}</p></section>
  <section class="stack" style="gap:10px">
    <div class="filtri" role="group" aria-label="${T("Filtra per strato")}">${filtri}</div>
  </section>
  <section class="stack" style="gap:8px">
    <div class="tipo">${T("Cosa vogliono dire le etichette")}</div>
    <div class="etichette">${Object.keys(TIPO).map(k=>`<div class="etichetta">${`<div class="pill-row">${pill(TIPO[k])}</div>`}<p>${T(TIPO[k].nota)}</p></div>`).join("")}</div>
  </section>
  <section class="stack">${lista.slice(0,mostrati).map(p=>{
    const t = TIPO[p.tipo];
    return `<button class="prog" data-prog="${p.id}">
      <div class="pill-row">${pill(t)}</div>
      <div class="stack-s" style="gap:2px"><h3>${esc(p.titolo)}</h3><span class="meta">${esc(p.zona)} · ${esc(p.stato)}</span></div>
      <p class="desc">${esc(p.descrizione)}</p>
      ${pills(p.strati)}
      <div class="cerca"><b>${T("Cosa serve:")}</b> ${esc(p.cerca)}</div>
      <div class="apri">${(()=>{ const e = window.AGR.prossimaPratica(p.titolo); return e?`<span class="prossima-mini">${T("Prossimo appuntamento:")} ${window.AGR.breve(e)}</span>`:"<span></span>"; })()}<span style="display:inline-flex;align-items:center;gap:4px">${T("Apri")} ${freccia}</span></div>
    </button>`;}).join("")}
    ${lista.length?"":`<p class="nota">${T("Nessun progetto in questo strato.")}</p>`}${lista.length>mostrati?`<button class="tasto sec" style="flex:none" data-az="carica">${T("Carica altri {n}",{n:Math.min(10,lista.length-mostrati)})}</button>`:lista.length?`<p class="nota">${lista.length===1?T("Hai visto tutto: 1 progetto."):T("Hai visto tutto: {n} progetti.",{n:lista.length})}</p>`:""}</section>
  <p class="nota">${T("I progetti sono nell’ordine in cui sono arrivati, non di popolarità.")}</p>
  ${tastoProponi()}
  ${temaBtn()}`;
}
function tastoProponi(){
  return `${window.AGR.bloccoInteresse ? window.AGR.bloccoInteresse("progetti") : ""}${avvisoProposte()}<button class="proponi" data-az="proponi"><span class="piu">+</span><span><b>${T("Proponi un nuovo progetto")}</b><span class="meta">${T("Qualcosa che esiste già o sta per partire, nel tuo quartiere")}</span></span></button>`;
}

function pillsMappa(ids){ return `<div class="pill-row">${ids.map(id=>{ const s = STRATI[id]; return `<button class="pill dot" data-strato-mappa="${id}" style="--pp:${s.pp};--pb:${s.pb};--pt:${s.pt};cursor:pointer"><span>${esc(T(s.label))}</span></button>`; }).join("")}</div>`; }
/* Gli altri progetti dell'app: la stessa bacheca, con il prossimo appuntamento preso dalla Mappa e "Cosa serve" come mani da dare */
function vLeggera(id){
  const p = PROGETTI.find(x=>x.id===id), t = TIPO[p.tipo], A = window.AGR, e = A.prossimaPratica(p.titolo);
  const cerca = p.cerca.split(",").map(x=>x.trim()).filter(Boolean), maiu = s => s.charAt(0).toUpperCase()+s.slice(1);
  const salvato = e && A.salvati.has(e.id);
  return `<button class="indietro" data-az="indietro">${frecciaSx}${T("Tutti i progetti")}</button>
  <section class="stack">
    <div class="stack-s"><div class="pill-row">${pill(t)}</div><div class="tipo">${T("Progetto")} · ${esc(p.zona)}</div><h1>${esc(p.titolo)}</h1></div>
    <p>${esc(p.descrizione)}</p>
    <div class="meta">${esc(p.stato)}</div>
    ${pillsMappa(p.strati)}
  </section>
  ${e ? `<section class="prossima"><div class="eyebrow">${T("Il prossimo appuntamento · evento Pratica")}</div>
      <div class="quando">${A.quando(e)}</div><div><strong>${esc(e.luogo)}</strong></div><div>${esc(e.desc)}</div>
      <div class="tasti"><button class="tasto sec" data-mappa-ev="${e.id}">${T("Vedi sulla mappa")}</button>${salvato?`<button class="tasto fatto" data-salva-ev="${e.id}" aria-pressed="true">${spunta()}${T("Nel calendario")}</button>`:`<button class="tasto pri" data-salva-ev="${e.id}">${T("Salva in calendario")}</button>`}</div></section>`
    : `<section class="iscrizioni"><div class="tipo">${T("Il prossimo appuntamento")}</div><p>${T("Nessun appuntamento fissato per ora. Quando c’è, compare qui e sulla mappa.")}</p></section>`}
  <section class="stack">
    <div class="mano-titolo">${mano(34)}<div class="stack-s" style="gap:2px;min-width:0"><h2>${T("Vuoi dare una mano?")}</h2><p class="meta">${T("Quello che il progetto cerca adesso.")}</p></div></div>
    <div class="lista">${cerca.map(c=>`<div class="riga"><span class="posto-ico libero">${piu}</span><div><div class="t">${esc(maiu(c))}</div></div><span class="chip libero">${T("Cercasi")}</span></div>`).join("")}</div>
  </section>
  <section class="come">${icoPin(30)}<div class="stack-s"><div style="font-weight:600">${T("Come funziona un progetto")}</div>
    <p>${T("Ogni appuntamento del progetto è un <strong>evento Pratica</strong> sulla mappa e porta il nome del progetto. Prima di ogni appuntamento la bacheca dice cosa serve. Qui non c’è una chat: per organizzarvi scrivete alle Ancore, e la conversazione resta nei vostri canali.")}</p></div></section>`;
}

function disegna(){
  if(!prepara()){ $s.innerHTML = vuotoDemo(T("Progetti"), tastoProponi()); return; }
  syncCal();
  $s.innerHTML = stato.v==="bacheca" ? (usa(stato.id||"cortile"), syncCal(), vBacheca()) : vTutti();
  $s.style.animation = "none"; void $s.offsetWidth; $s.style.animation = "";
}

let tt;
function avviso(){ /* le spiegazioni andranno nella modalità tutorial */ }
function foglio(html){ window.AGR.foglio(html, "sez-progetti"); }
function chiudiFoglio(){ window.AGR.chiudi(); }

function foglioMappa(){
  return `<div class="eyebrow">${T("Evento Pratica")} · ${CORTILE.titolo}</div>
    <h3>${PROSSIMA.data}, ${PROSSIMA.ora}</h3><div class="meta">${PROSSIMA.luogo} ${PROSSIMA.civico}, Torino</div>
    <div class="mappa"><svg viewBox="0 0 360 170" role="img" aria-label="${T("Anteprima della mappa con il segnaposto dell’evento Pratica")}">
      <rect width="360" height="170" fill="var(--mappa-terra)"/>
      <rect x="16" y="16" width="86" height="48" rx="4" fill="var(--mappa-edificio)"/><rect x="122" y="16" width="96" height="48" rx="4" fill="var(--mappa-edificio)"/>
      <rect x="238" y="16" width="106" height="48" rx="4" fill="var(--mappa-parco)"/><rect x="16" y="98" width="130" height="56" rx="4" fill="var(--mappa-edificio)"/>
      <rect x="238" y="98" width="106" height="56" rx="4" fill="var(--mappa-edificio)"/>
      <path d="M0 81h360M112 0v170M228 0v170" stroke="var(--mappa-strada)" stroke-width="12"/>
      ${pinPratica(186,120,15)}
    </svg></div>
    <p class="meta">${T("Il segnaposto dell’evento Pratica ha il doppio cerchio, e il popup porta alla bacheca del progetto. Il civico compare dal giorno prima, con il consenso del condominio. A ogni appuntamento il segnaposto si sposta sul cortile che ospita.")}</p>`;
}
function foglioCal(){
  syncCal();
  const s = id => calModo===id;
  return `<div class="eyebrow">${T("Salva in calendario")}</div><h3>${T("Cosa vuoi salvare?")}</h3>
    <button class="scelta" data-cal="volta" aria-pressed="${s("volta")}"><div><div class="t">${T("Solo il {d}",{d:PROSSIMA.giorno})}</div><div class="meta">${PROSSIMA.ora} · ${PROSSIMA.luogo}</div></div>${s("volta")?`<span class="spunta">${spunta(18)}</span>`:""}</button>
    <button class="scelta" data-cal="serie" aria-pressed="${s("serie")}"><div><div class="t">${T("Tutti gli appuntamenti del progetto")}</div><div class="meta">${T("Compaiono nel calendario man mano che vengono fissati")}</div></div>${s("serie")?`<span class="spunta">${spunta(18)}</span>`:""}</button>
    ${calModo?`<button class="link" data-cal="togli">${T("Togli dal calendario")}</button>`:""}
    <p class="meta">${T("Se un appuntamento viene annullato, lo vedi quando riapri il calendario: Agorapp non manda notifiche. Si elimina come gli altri eventi ricorrenti: solo questo giorno o tutta la serie.")}</p>`;
}
function foglioPersona(ruolo, id){
  const fonte = ruolo==="ancora" ? ANCORE : ruolo==="fata" ? FATE : vorrebberoTutti();
  const p = fonte.find(x=>x.id===id); if(!p) return "";
  if(p.tu) return foglioVengo();
  const chi = p.tipo==="collettivo" ? T("Collettivo") : T("Persona");
  const titolo = ruolo==="ancora" ? (IT() ? `Ancora ${B.di} da ${p.da}` : T("Ancora da {d}",{d:p.da}))
               : ruolo==="fata" ? (IT() ? `Fata ${B.di} da ${p.da}` : T("Fata da {d}",{d:p.da}))
               : T("Vorrebbe venire {d}",{d:PROSSIMA.data.toLowerCase()});
  const fatti = p.fatti ? `<div class="stack-s"><div style="font-weight:600">${IT()?B.nel:T("Nel progetto")}</div><ul class="fatti">${p.fatti.map(f=>`<li>${esc(f)}</li>`).join("")}</ul></div>` : "";
  const nota = p.nota ? `<p>${esc(p.nota)}</p>` : "";
  const comp = p.compagnia ? `<div class="stato-volta">${glifo.compagnia}${T("Cerca qualcuno con cui andare")}</div>` : "";
  const scrivi = ruolo==="vorrebbe" ? (p.compagnia ? T("Scrivi per andarci insieme") : "") : T("Scrivi per allearti");
  return `<div class="profilo-testa">${avatar(p, ruolo, true)}<div><div class="tipo">${chi}</div><h3>${esc(p.nome)}</h3><div class="eyebrow">${titolo}</div></div></div>
    ${comp}${nota}${fatti}
    ${scrivi?`<div class="recapito"><div class="meta">${T("Il recapito che ha scelto di rendere pubblico")}</div><div style="font-weight:600">[${T("email o telefono")}]</div></div>
    <button class="tasto pri pieno" data-az="scrivi">${scrivi}</button>`:`<p class="meta">${T("Ha scelto di farsi vedere, ma non di essere contattato.")}</p>`}
    <p class="meta">${T("Il profilo mostra solo ciò che ha fatto apparire nel progetto: niente seguaci, niente contatori.")}</p>`;
}
function foglioVengo(){
  return `<div class="eyebrow">${PROSSIMA.data}, ${PROSSIMA.luogo}</div><h3>${T("Vorrei venire anch’io")}</h3>
    <button class="scelta" data-io="vengo" aria-pressed="${io.vengo}"><span class="casella">${io.vengo?spunta(14):""}</span><div><div class="t">${T("Fammi vedere tra chi vorrebbe venire")}</div><div class="meta">${T("Il tuo nome compare nella bacheca fino all’appuntamento, poi sparisce.")}</div></div></button>
    <button class="scelta" data-io="compagnia" aria-pressed="${io.compagnia}"><span class="casella">${io.compagnia?spunta(14):""}</span><div><div class="t">${T("Cerco qualcuno con cui andare")}</div><div class="meta">${T("Accanto al tuo nome compare il bollino. Chi vuole può scriverti.")}</div></div></button>
    <p class="meta">${T("Anteprima: con le iscrizioni aperte servirà un profilo. Qui puoi provare come apparirebbe.")}</p>`;
}
function foglioStampa(){
  const liberi = POSTI.filter(x=>!x.coperto);
  return `<div class="eyebrow">${esc(B.stampa.dove)}</div><h3>${T("La bacheca stampata")}</h3>
    <div class="carta">
      <div class="cm">${T("Progetto")} · ${esc(CORTILE.zona)}</div>
      <div class="ct">${CORTILE.titolo}</div>
      <div class="cq">${PROSSIMA.data}, ${PROSSIMA.ora}</div>
      <div style="font-size:13px;line-height:19px">${PROSSIMA.luogo}${PROSSIMA.civico?", [civico]":""}. ${PROSSIMA.programma}</div>
      <div style="font-weight:700;font-size:14px">${esc(B.stampa.invito)}</div>
      <div class="mano-c">${mano(22,"#C8743E")}${T("Vuoi dare una mano?")}</div>
      <ul>${liberi.map(x=>`<li>${esc(x.t.toLowerCase())}</li>`).join("")}</ul>
      <div class="cr">${T("Le Ancore: {n}, [recapito]. Questa bacheca è anche su Agorapp, sezione Progetti.",{n:ANCORE.map(a=>a.nome).join(", ")})}</div>
    </div>
    <button class="tasto pri pieno" data-stampa-carta="1">${T("Scarica il PDF")}</button>
    <p class="meta">${T("Nell’app si scarica in PDF, come il PDF della giornata. Così il progetto arriva anche a chi non usa lo smartphone e non è nei gruppi di chat.")}</p>`;
}
function foglioAnteprima(){
  return `<div class="tipo">${T("Anteprima")}</div><h3>${T("Tutto pronto, iscrizioni in arrivo")}</h3>
    <p>${T("Progetti e Agorà partiranno quando potremo accogliere chi vi partecipa. Intanto puoi vedere com’è fatto tutto: le bacheche dei progetti, le persone che ci tengono, i tavoli delle istanze, gli eventi sulla mappa.")}</p>
    <p>${T("I progetti in elenco sono quelli dell’app. Date, persone e cortili del Cortile Comune sono d’esempio.")}</p>
    <p class="meta">${T("Vuoi portare il tuo progetto? Scrivi a")} <span class="mail">info@agorapp.it</span>.</p>`;
}

document.addEventListener("click", e => {
  const b = e.target.closest("button"); if(!b || !b.closest(".sez-progetti")) return;
  if(b.dataset.stratoMappa){ window.AGR.passerellaStrato(b.dataset.stratoMappa); return; }
  if(b.dataset.mappaEv){ window.AGR.vaiMappa(b.dataset.mappaEv); return; }
  if(b.dataset.salvaEv){ const S = window.AGR.salvati, id = b.dataset.salvaEv; if(S.has(id)) S.delete(id); else S.add(id); window.AGR.aggiorna(); disegna(); return; }
  if(b.id==="chiudi"){ chiudiFoglio(); return; }
  if(b.dataset.cal){
    const c = b.dataset.cal, S = window.AGR.salvati;
    calModo = c==="togli" ? null : c;
    CAL[CORTILE.id] = calModo; if(calModo) S.add("demo-pratica-"+CORTILE.id); else S.delete("demo-pratica-"+CORTILE.id);
    window.AGR.aggiorna(); chiudiFoglio(); disegna(); return;
  }
  if(b.dataset.io){
    const k = b.dataset.io;
    io[k] = !io[k];
    if(k==="compagnia" && io.compagnia) io.vengo = true;
    if(k==="vengo" && !io.vengo) io.compagnia = false;
    foglio(foglioVengo()); disegna(); return;
  }
  if(b.dataset.persona){ const [r,id] = b.dataset.persona.split(":"); foglio(foglioPersona(r,id)); return; }
  if(b.dataset.prog){
    const p = PROGETTI.find(x=>x.id===b.dataset.prog);
    vai({v:"bacheca", id:p.id});
    return;
  }
  if(b.dataset.filtro){ filtro = b.dataset.filtro; mostrati = 10; disegna(); return; }
  if(b.dataset.az==="carica"){ mostrati += 10; disegna(); return; }
  if(b.dataset.az==="proponi"){ window.AGR.proponi("progetto"); return; }
  if(b.dataset.az==="carica-demo-sez"){ caricaDemoSez(b); return; }
  const az = b.dataset.az;
  if(az==="indietro"){ indietro(); return; }
  if(az==="tutti"){ vai({v:"tutti"}); return; }
  if(az==="mappa"){ window.AGR.vaiMappa("demo-pratica-"+CORTILE.id); return; }
  if(az==="cal"){ foglio(foglioCal()); return; }
  if(az==="vengo"){ foglio(foglioVengo()); return; }
  if(az==="scrivi"){ if(!b.nextElementSibling || !b.nextElementSibling.classList.contains("nota-scrivi")) b.insertAdjacentHTML("afterend", `<p class="meta nota-scrivi">${T("Con le iscrizioni aperte si apre il tuo programma di posta, con il recapito già scritto. Agorapp non ha una chat.")}</p>`); return; }
  if(az==="stampa"){ foglio(foglioStampa()); return; }
  if(az==="anteprima"){ foglio(foglioAnteprima()); return; }
});


window.AGR.progetti = {
  ridisegna: disegna,
  get elenco(){ prepara(); return PROGETTI; },
  home(){ pila = []; stato = {v:"tutti"}; disegna(); $p.scrollTop = 0; },
  apri(id){ if(!prepara()) return; pila = [{v:"tutti"}]; stato = {v:"bacheca", id}; window.AGR.vaiSezione("progetti"); disegna(); $p.scrollTop = 0; }
};
})();
})();
(function(){
'use strict';
(function(){
/* ===== Proponi un progetto / Proponi un'istanza (Anteprima: tutto pronto, iscrizioni ancora chiuse) ===== */
const A = window.AGR, D = A.dati;
const esc = s => String(s==null?"":s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const spunta = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const MIN = 30, MAXTEMI = 3;
const T = (s,v) => A.tr(s,v);
let tipo = null;

const ovali = (gruppo, voci) => `<div class="ovali" data-gruppo="${gruppo}">${voci.map(v=>`<button type="button" class="ovale p" data-voce="${esc(v.k)}" aria-pressed="false" style="--dot:${v.dot}"><span class="pallino"></span>${esc(v.label)}</button>`).join("")}</div>`;
const STRATI_V = () => D.strati.map(s=>({k:s.id, label:T(s.label), dot:s.pin}));
const TEMI_V = () => D.temiVoc.map(t=>({k:t, label:T(t), dot:D.temaCol(t).dot}));
const campo = (id, etich, nota, html) => `<div class="stack-s p-campo" data-campo="${id}"><label class="etich" for="p-${id}">${etich}${nota?` <span class="p-nota">${nota}</span>`:""}</label>${html}<div class="p-err" hidden></div></div>`;
const input = (id, ph, extra) => `<div class="campo"><input id="p-${id}" placeholder="${esc(ph)}" autocomplete="off" ${extra||""}></div>`;
const area = (id, ph) => `<div class="campo"><textarea id="p-${id}" rows="3" placeholder="${esc(ph)}" data-conta="${id}"></textarea></div><div class="meta p-conta" id="conta-${id}">${T("{n} caratteri · almeno {m}",{n:0, m:MIN})}</div>`;
const scelta = (id, voci) => `<div class="chips-in" data-gruppo="${id}" role="group">${voci.map(v=>`<button type="button" class="chip-in" data-voce="${esc(v)}" data-uno="1" aria-pressed="false">${esc(T(v))}</button>`).join("")}</div>`;

function form(){
  const prog = tipo==="progetto";
  const testa = prog
    ? `<div class="tipo">${T("Progetti · proposta")}</div><h3>${T("Proponi un nuovo progetto")}</h3><p>${T("Un progetto è qualcosa che esiste già o sta per partire: un cortile aperto, un coro, una sartoria. Agorapp lo rende visibile, non lo gestisce.")}</p>`
    : `<div class="tipo">${T("Agorà · proposta")}</div><h3>${T("Proponi una nuova istanza")}</h3><p>${T("Un’istanza è un’ipotesi di trasformazione con un obiettivo comune. Si apre con un primo tavolo: soggetti che si incontrano di persona e scrivono una parte della proposta.")}</p>`;
  const avviso = `<div class="avviso-proposte verde" role="note"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.3" stroke="currentColor" stroke-width="1.4"/><path d="M8 7.2v4M8 4.8v.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><span>${T("Stiamo lavorando alla ricezione delle proposte: è prevista per la prima metà del 2027. Per ora il modulo è un’anteprima: non invia e non salva niente.")}</span></div>`;
  const campi = prog ? [
    campo("titolo",T("Come si chiama"),"",input("titolo",T("es. Il Cortile Comune"))),
    campo("zona",T("Dove"),T("quartiere o zona"),input("zona",T("es. Crocetta, oppure Tutta la città"))),
    campo("descr",T("Cosa fa"),"",area("descr",T("Racconta il progetto: cosa succede, ogni quanto, per chi."))),
    campo("strati",T("Strati"),T("uno o più"),ovali("strati",STRATI_V())),
    campo("temi",T("Temi"),T("fino a 3"),ovali("temi",TEMI_V())),
    campo("cerca",T("Cosa serve adesso"),T("facoltativo"),input("cerca",T("es. un cortile, mani per la merenda, sedie"))),
    campo("etich",T("Come vuoi esserci"),"",scelta("etich",["Indipendente","Accompagnato da Agorapp"]) + `<div class="meta">${T("Indipendente: il progetto fa tutto da sé. Accompagnato: Agorapp aiuta a partire, poi si fa da parte.")}</div>`),
    campo("chi",T("Chi lo regge"),T("una persona di riferimento, un’Ancora"),input("chi",T("Nome, anche solo di battesimo"))),
    campo("mail",T("Dove risponderti"),"",input("mail",T("nome@esempio.it"),'type="email" inputmode="email"'))
  ] : [
    campo("titolo",T("Come si chiama"),"",input("titolo",T("es. Diritto abitativo"))),
    campo("descr",T("Cosa vuole cambiare"),"",area("descr",T("La tensione da cui nasce e cosa dovrebbe cambiare."))),
    campo("ob",T("L’obiettivo, in una frase"),T("tutti i tavoli lavoreranno per questo"),input("ob",T("es. Nuove regole urbane per gli affitti"))),
    campo("parte",T("Il primo tavolo: da quale parte cominciare"),T("facoltativo"),input("parte",T("es. un tetto agli affitti, zona per zona"))),
    campo("strati",T("Strati"),T("uno o più"),ovali("strati",STRATI_V())),
    campo("temi",T("Temi"),T("fino a 3"),ovali("temi",TEMI_V())),
    campo("sogg",T("Chi propone"),T("il soggetto che si siede al primo tavolo"),input("sogg",T("es. Assemblea inquilini Vanchiglia")) + scelta("forma",["Collettivo","Associazione","Comitato di quartiere","Assemblea","Sportello","Rete"])),
    campo("citta",T("In che città"),"",input("citta",T("es. Torino"))),
    campo("mail",T("Dove risponderti"),"",input("mail",T("nome@esempio.it"),'type="email" inputmode="email"'))
  ];
  return `<div class="sez-proposta-in stack">${avviso}${testa}${campi.join("")}
    <div class="p-privacy meta">${T("Agorapp non ha una chat: la redazione ti risponderà per email. L’indirizzo servirà solo per questa proposta.")} [INFORMATIVA PRIVACY DELLE PROPOSTE DA SCRIVERE]</div>
    <button class="tasto pri pieno" data-pz="invia">${T("Prova a inviare")}</button></div>`;
}
function fatto(dati){
  const prog = tipo==="progetto";
  return `<div class="stack p-fatto"><span class="p-sigillo">${spunta}</span><div class="tipo">${T("Anteprima")}</div><h3>${T("Il modulo funziona così")}</h3>
    <p>${T("«{t}» è scritta, ma per ora non parte: la ricezione delle proposte è prevista per la prima metà del 2027. Allora arriverà alla redazione di Agorapp, che ti scriverà all’indirizzo che hai dato.",{t:esc(dati.titolo)})}</p>
    <p class="meta">${T("Non abbiamo salvato né inviato niente: né la proposta né l’email.")}</p>
    <p class="meta">${prog?T("Se il progetto entra, avrà la sua bacheca e i suoi appuntamenti sulla mappa come eventi Pratica."):T("Se l’istanza si apre, il primo tavolo avrà la sua pagina nell’Agorà e i suoi incontri sulla mappa come eventi Istanza.")}</p>
    <button class="tasto sec pieno" data-pz="chiudi">${T("Chiudi")}</button></div>`;
}
function errore(id, msg){ const c = document.querySelector(`.sez-proposta [data-campo="${id}"]`); if(!c) return; const e = c.querySelector(".p-err"); e.textContent = msg; e.hidden = !msg; const box = c.querySelector(".campo"); if(box) box.classList.toggle("errore", !!msg); }
function val(id){ const el = document.getElementById("p-"+id); return el ? el.value.trim() : ""; }
function scelte(g){ return [...document.querySelectorAll(`.sez-proposta [data-gruppo="${g}"] [aria-pressed="true"]`)].map(b=>b.dataset.voce); }
function invia(){
  const obbl = tipo==="progetto" ? ["titolo","zona","chi"] : ["titolo","ob","sogg","citta"];
  let ok = true, primo = null;
  const segna = (id,msg) => { errore(id,msg); if(msg){ ok = false; primo = primo || id; } };
  obbl.forEach(id => segna(id, val(id) ? "" : T("Manca questo")));
  segna("descr", val("descr").length>=MIN ? "" : T("Servono almeno {n} caratteri",{n:MIN}));
  segna("strati", scelte("strati").length ? "" : T("Scegli almeno uno strato"));
  if(tipo==="progetto") segna("etich", scelte("etich").length ? "" : T("Scegli come vuoi esserci"));
  segna("mail", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val("mail")) ? "" : T("Scrivi un indirizzo email valido"));
  if(!ok){ const c = document.querySelector(`.sez-proposta [data-campo="${primo}"]`); if(c) c.scrollIntoView({block:"center", behavior:"smooth"}); return; }
  A.foglio(fatto({titolo:val("titolo"), mail:val("mail")}), "sez-proposta");
}

document.addEventListener("click", ev => {
  const b = ev.target.closest("button"); if(!b || !b.closest(".sez-proposta")) return;
  if(b.dataset.voce){
    const g = b.closest("[data-gruppo]"), on = b.getAttribute("aria-pressed")!=="true";
    if(b.dataset.uno) g.querySelectorAll("[data-voce]").forEach(x=>x.setAttribute("aria-pressed","false"));
    if(on && g.dataset.gruppo==="temi" && g.querySelectorAll('[aria-pressed="true"]').length>=MAXTEMI){ errore("temi", T("Al massimo {n} temi",{n:MAXTEMI})); return; }
    b.setAttribute("aria-pressed", String(on)); b.classList.toggle("sel", on);
    const c = b.closest("[data-campo]"); if(c) errore(c.dataset.campo, "");
    return;
  }
  if(b.dataset.pz==="invia"){ invia(); return; }
  if(b.dataset.pz==="chiudi"){ A.chiudi(); return; }
});
document.addEventListener("input", ev => {
  const t = ev.target; if(!t.closest || !t.closest(".sez-proposta")) return;
  if(t.dataset.conta){ const n = t.value.trim().length, el = document.getElementById("conta-"+t.dataset.conta); if(el){ el.textContent = n>=MIN ? T("{n} caratteri",{n}) : T("{n} caratteri · almeno {m}",{n, m:MIN}); el.classList.toggle("ok", n>=MIN); } }
  const c = t.closest("[data-campo]"); if(c) errore(c.dataset.campo, "");
});
A.proponi = t => { tipo = t; A.foglio(form(), "sez-proposta"); };
})();
})();
