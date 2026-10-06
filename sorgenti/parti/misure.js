/* ======================= Misure (solo admin): si misura la città, non le persone =======================
   Tranche 1 (6 ottobre 2026). Tutto resta sul telefono dell'admin, nella chiave agorapp_misure:
   - totali del giorno calcolati dagli eventi on-grid (mai copia degli eventi: l'informativa promette che spariscono 3 ore dopo la fine);
   - numeri inseriti a mano (richieste da Netlify, azioni di comunicazione, rimozioni, segnalazioni, test, interviste);
   - soglie, stato delle decisioni, decisioni sul catalogo delle 50 domande.
   Nessun dato degli utenti, nessuna rete: la seconda tranche (pulsanti volontari «Mi interessa») richiede un punto di raccolta e l'informativa aggiornata. */
const MZ_KEY = 'agorapp_misure';
let MZ = null;
function mz(){
  if(MZ) return MZ;
  const d = LS.get(MZ_KEY, null) || {};
  MZ = Object.assign({v:1, giorni:{}, visti:{}, creati:{}, richieste:{}, azioni:[], rimozioni:[], segnalazioni:{}, correzioni:{}, versioni:[], prove:[], giri:[], rete:{},
    soglie:{}, stati:{}, mie:{}}, d);
  MZ.soglie = Object.assign({zona:2, nuovi:50, carico:3, interesse:100}, MZ.soglie||{});
  return MZ;
}
function mzSalva(){ if(!LS.set(MZ_KEY, MZ)) avviso(tr('Spazio esaurito sul telefono: esporta le misure in Excel.'), null, true); }
const MS = {scheda:'panoramica', periodo:30, ambito:'tutte', demo:false, filtroCat:'tutti', vista:{}};

/* ---------- quale evento conta ---------- */
const mzReale = e => e && typeof e==='object' && !e.personal && !e.offgrid && !e.fata && e.datetime && isFinite(+e.lat) && isFinite(+e.lng);
function mzEventi(){ return events.filter(e => mzReale(e) && (MS.demo || !e.demo)).filter(e => MS.ambito==='tutte' || cittaDi(e)===citta); }
function cittaDi(e){
  let best = 'altro', bd = 1e9; const la = +e.lat, ln = +e.lng;
  CITTA.forEach(c => {
    if(c.bounds){ const [[w,s],[E,n]] = c.bounds; if(ln>=w && ln<=E && la>=s && la<=n){ bd = 0; best = c.id; } return; }
    const d = Math.hypot(la-c.center[0], (ln-c.center[1])*Math.cos(c.center[0]*Math.PI/180))*111;
    if(d<bd){ bd = d; best = c.id; }
  });
  return bd<=35 ? best : 'altro';
}
const nomeCitta = id => (CITTA.find(c => c.id===id)||{n:tr('Altrove')}).n;
const zonaDi = e => (QUARTIERI.find(q => +e.lat>=q.la[0] && +e.lat<q.la[1] && +e.lng>=q.ln[0] && +e.lng<q.ln[1])||{}).n || null;
function creatoDi(e){
  if(e.creato){ const t = Date.parse(e.creato); if(!isNaN(t)) return t; }
  const id = String(e.id||''); let m;
  if(/^\d{12,14}$/.test(id)) return +id;
  if((m = id.match(/^x([0-9a-z]{8})/))){ const t = parseInt(m[1],36); if(t>1.5e12 && t<4e12) return t; }
  return null;
}
const gratuitoMz = e => /^(gratuit|gratis|free|ingresso libero|libero|offerta libera|0\s*€?$)/i.test(String(e.price||'').trim());
const FASCE_MZ = [['mattina','Mattina',6,12],['pomeriggio','Pomeriggio',12,18],['sera','Sera',18,23],['notte','Notte',23,30]];
const fasciaDi = h => (FASCE_MZ.find(f => (h>=f[2] && h<f[3]) || (h+24>=f[2] && h+24<f[3]))||FASCE_MZ[3])[0];

/* ---------- la fotografia del giorno: solo totali ---------- */
function mzFotografa(){
  const m = mz(), g = oggi(), L = events.filter(e => mzReale(e) && !e.demo);
  const per = f => { const o = {}; L.forEach(e => { const k = f(e); if(k!=null) o[k] = (o[k]||0)+1; }); return o; };
  m.giorni[g] = {tot:L.length, citta:per(cittaDi), strati:per(e => e.category||'?'), prov:per(e => e.provenienza||'nd'), imp:L.filter(e => e.importato).length, grat:L.filter(gratuitoMz).length};
  L.forEach(e => { if(m.visti[e.id]) return; const c = creatoDi(e), gc = c ? ymd(new Date(c)) : g; m.visti[e.id] = gc; m.creati[gc] = (m.creati[gc]||0)+1; });
  const lim = piuGiorni(g,-120); Object.keys(m.visti).forEach(id => { if(m.visti[id]<lim) delete m.visti[id]; });
  const limG = piuGiorni(g,-400); Object.keys(m.giorni).forEach(k => { if(k<limG) delete m.giorni[k]; });
  mzSalva();
}
function misureConta(tipo){ if(!st.admin) return; const m = mz(), g = oggi(); m.correzioni[g] = m.correzioni[g]||{c:0, r:0}; m.correzioni[g][tipo==='rimossi'?'r':'c']++; mzSalva(); }

/* ---------- periodi ---------- */
const mzGiorni = n => { const out = [], g = oggi(); for(let i=n-1;i>=0;i--) out.push(piuGiorni(g,-i)); return out; };
const somma = (o, giorni, f) => giorni.reduce((s,g) => s + (o[g]!=null ? (f ? f(o[g]) : o[g]) : 0), 0);
const nf = n => n==null ? '–' : Number(n).toLocaleString('it-IT');
const n1 = x => String(Math.round(x*10)/10).replace('.',',');
const brevD = s => dIso(s).toLocaleDateString(dloc(), {day:'numeric', month:'short'}).replace('.','');
const lungD = s => dIso(s).toLocaleDateString(dloc(), {weekday:'short', day:'numeric', month:'short'}).replace(/\./g,'');
function nuoviIn(giorni){ return somma(mz().creati, giorni); }
function serieAttivi(giorni){ const m = mz(); return giorni.map(g => { const x = m.giorni[g]; if(!x) return null; return MS.ambito==='tutte' ? x.tot : (x.citta||{})[citta]||0; }); }

/* ---------- indicatori ---------- */
function zoneConteggio(L){
  const da = Date.now(), a = da + 7*864e5, o = {}; QUARTIERI.forEach(q => o[q.n] = 0);
  L.forEach(e => { const t = new Date(e.datetime).getTime(); if(t<da-864e5 || t>a) return; const z = zonaDi(e); if(z) o[z]++; });
  return o;
}
function mzStato(){
  const m = mz(), L = mzEventi(), g7 = mzGiorni(7), gP = mzGiorni(MS.periodo);
  const torino = L.filter(e => cittaDi(e)==='torino');
  const zone = zoneConteggio(torino), sotto = QUARTIERI.filter(q => zone[q.n] < m.soglie.zona);
  const prov = {consenso:0, pubblica:0, nd:0}; L.forEach(e => prov[e.provenienza==='consenso'?'consenso':e.provenienza==='pubblica'?'pubblica':'nd']++);
  const conCreato = L.map(e => [e, creatoDi(e)]).filter(x => x[1]);
  const anticipo = conCreato.length ? conCreato.reduce((s,[e,c]) => s + Math.max(0, new Date(e.datetime).getTime()-c), 0)/conCreato.length/864e5 : null;
  const nuovi7 = nuoviIn(g7), nuoviP = nuoviIn(gP);
  const corr = somma(m.correzioni, gP, x => (x.c||0)+(x.r||0));
  const ric = gP.map(g => m.richieste[g]).filter(v => v!=null);
  return {L, zone, sotto, prov, anticipo, nuovi7, nuoviP, corr, ric, mediaRic: ric.length ? Math.round(ric.reduce((a,b)=>a+b,0)/ric.length) : null,
    qualita: nuoviP ? corr/nuoviP*100 : null, segn: somma(m.segnalazioni, gP), grat: L.length ? Math.round(L.filter(gratuitoMz).length/L.length*100) : null,
    imp: L.filter(e => e.importato).length, perCitta: CITTA.map(c => [c.n, events.filter(e => mzReale(e) && (MS.demo || !e.demo) && cittaDi(e)===c.id).length])};
}
function effettoAzione(a){
  const m = mz(), media = arr => { const v = arr.filter(x => x!=null); return v.length>=2 ? v.reduce((p,q)=>p+q,0)/v.length : null; };
  const prima = media([1,2,3].map(k => m.richieste[piuGiorni(a.d,-k)])), dopo = media([0,1,2].map(k => m.richieste[piuGiorni(a.d,k)]));
  return prima && dopo ? Math.round((dopo/prima-1)*100) : null;
}
const oreTra = (a,b) => { const x = Date.parse(a), y = Date.parse(b); return isNaN(x)||isNaN(y) ? null : Math.max(0, Math.round((y-x)/36e5)); };

function decisioniMz(S){
  const m = mz(), out = [];
  const firma = (id, s) => id+'|'+s;
  if(S.L.some(e => cittaDi(e)==='torino') && S.sotto.length) out.push({id:firma('zone', S.sotto.map(q=>q.n).join(',')), liv:'crit', st:tr('Da fare'),
    tit: S.sotto.length===1 ? tr('Una zona di Torino resta sotto {s} eventi nei prossimi 7 giorni',{s:m.soglie.zona}) : tr('{n} zone di Torino restano sotto {s} eventi nei prossimi 7 giorni',{n:S.sotto.length, s:m.soglie.zona}),
    perche: S.sotto.slice(0,8).map(q => q.n+' ('+S.zone[q.n]+')').join(', ')+(S.sotto.length>8?'…':'')+'. '+tr('Lì la mappa sembra vuota: è l’asimmetria informativa che Agorapp vuole ridurre.'),
    azione: tr('Cerca fonti in quelle zone: biblioteche, circoli, parrocchie, spazi associativi.'), kpi:[5,12]});
  const vuote = CITTA.filter(c => !events.some(e => mzReale(e) && !e.demo && cittaDi(e)===c.id));
  if(vuote.length) out.push({id:firma('citta', vuote.map(c=>c.id).join(',')), liv:'warn', st:tr('Da valutare'), tit: tr('Città senza eventi: {c}',{c:vuote.map(c=>c.n).join(', ')}),
    perche: tr('Chi sceglie una di queste città trova la mappa vuota.'), azione: tr('Scegli la prossima città da riempire, anche con l’import dai siti dei Comuni.'), kpi:[3,10]});
  if(S.nuovi7 < m.soglie.nuovi) out.push({id:firma('ritmo', oggi()), liv:'warn', st:tr('Sotto obiettivo'), tit: tr('{n} eventi nuovi negli ultimi 7 giorni (obiettivo {o})',{n:S.nuovi7, o:m.soglie.nuovi}),
    perche: tr('Il ritmo di raccolta decide quanto la mappa resta viva.'), azione: tr('Riprendi la lista delle fonti o prova un nuovo import.'), kpi:[2,10]});
  const tot = S.prov.consenso+S.prov.pubblica+S.prov.nd;
  if(tot && S.prov.nd/tot > .5) out.push({id:firma('prov', String(Math.round(S.prov.nd/tot*10))), liv:'warn', st:tr('Da fare'), tit: tr('Per {p} % degli eventi manca la provenienza',{p:Math.round(S.prov.nd/tot*100)}),
    perche: tr('Senza provenienza non si vede quanta parte dell’offerta ha il consenso diretto dell’organizzatore, la base giuridica più solida.'), azione: tr('Indica la provenienza nel form dell’evento o nella colonna «Provenienza» dell’Excel.'), kpi:[6]});
  const lente = m.rimozioni.filter(r => { const h = oreTra(r.ric, r.eva); return h!=null && h>48; });
  if(lente.length) out.push({id:firma('48h', lente.length), liv:'crit', st:tr('Da fare'), tit: tr('{n} richieste di rimozione evase dopo 48 ore',{n:lente.length}),
    perche: tr('L’informativa promette la rimozione entro 48 ore.'), azione: tr('Controlla la casella info@agorapp.it più spesso.'), kpi:[15]});
  if(m.richieste[oggi()]==null) out.push({id:firma('netlify', oggi()), liv:'neu', st:tr('Promemoria'), tit: tr('Manca il numero di oggi da Netlify'),
    perche: tr('Sul piano gratuito Netlify tiene i numeri solo 24 ore: un giorno saltato resta un buco.'), azione: tr('Copialo in «Accessi».'), kpi:[18], vai:'accessi'});
  const v = m.versioni[m.versioni.length-1];
  if(v && v.s > m.soglie.carico) out.push({id:firma('peso', v.v), liv:'warn', st:tr('Da fare'), tit: tr('{v} carica in {s} s (obiettivo {o} s)',{v:v.v, s:n1(v.s), o:n1(m.soglie.carico)}),
    perche: tr('Pesano font e librerie caricati da fuori.'), azione: tr('Ospita in casa font e librerie: più veloce, e nessun IP mandato a Google o unpkg.'), kpi:[40,42]});
  const az = m.azioni.slice().reverse().find(a => effettoAzione(a)!=null);
  if(az){ const e = effettoAzione(az); out.push({id:firma('az', az.d+az.t), liv: e>=10 ? 'ok' : 'neu', st: e>=10 ? tr('Funziona') : tr('Effetto debole'),
    tit: tr('«{t}» del {d}: richieste {e} %',{t:az.t, d:brevD(az.d), e:(e>=0?'+':'')+e}), perche: tr('Confronto per data: tre giorni prima e tre giorni dopo. Nessun link tracciato, nessun parametro nell’indirizzo.'),
    azione: e>=10 ? tr('Ripeti il canale e confronta di nuovo.') : tr('Prova un canale diverso.'), kpi:[20]}); }
  const I = totInteresse();
  if(I && I.agora+I.progetti >= m.soglie.interesse) out.push({id:firma('ongrid', m.soglie.interesse), liv:'warn', st:tr('Soglia superata'), tit: tr('{n} «Mi interessa» per Agorà e Progetti (soglia {s})',{n:I.agora+I.progetti, s:m.soglie.interesse}),
    perche: tr('Agorà {a} · Progetti {p}. L’apertura dell’on-grid resta legata alla costituzione della società, che deve gestire i dati degli utenti.',{a:I.agora, p:I.progetti}), azione: tr('Metti in calendario la costituzione della società e l’informativa per gli utenti.'), kpi:[27,28]});
  return out.filter(d => mz().stati[d.id]!=='fatto');
}

/* ---------- pezzi grafici ---------- */
const mzIco = {
  indietro:'<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M11 3 5 9l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  info:'<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M9 8v4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="5.6" r=".9" fill="currentColor"/></svg>',
  lucchetto:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" stroke-width="1.4"/></svg>',
  avviso:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2 1.5 13.5h13L8 2Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 6.5v3.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.6" r=".85" fill="currentColor"/></svg>',
  su:'<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1.5 9 7.5H1Z" fill="currentColor"/></svg>',
  giu:'<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 8.5 1 2.5h8Z" fill="currentColor"/></svg>',
  avanti:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 3 5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x:'<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="m3.5 3.5 7 7M10.5 3.5l-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
};
const FONTI_MZ = {ev:'Dagli eventi', man:'Da Netlify, a mano', vol:'Pulsante volontario', test:'Test interno', int:'Interviste', mail:'Dalla posta', reg:'Registro a mano'};
const fonteMz = k => `<span class="mz-fonte mz-f-${k}">${tr(FONTI_MZ[k])}</span>`;
const righeBtn = (k, l) => `<button class="mz-fonte" data-mz="kpiset" data-k="${k.join(',')}" data-l="${esc(l)}">${k.length>1?tr('righe'):tr('riga')} ${k.join(', ')}</button>`;
function mzTile(lab, val, det, fonte, metro, warn, kpi){
  return `<button class="mz-tile" data-mz="kpiset" data-k="${kpi.join(',')}" data-l="${esc(lab)}"><span class="mz-lab">${lab}</span><span class="mz-val">${val}</span>${metro!=null?`<span class="mz-metro${warn?' warn':''}" aria-hidden="true"><i style="width:${metro>0?Math.max(2,Math.round(Math.min(1,metro)*100)):0}%"></i></span>`:''}<span class="mz-det">${det}</span>${fonteMz(fonte)}</button>`;
}
function mzBox(id, tit, corpo, tab, fonte, kpi){
  const t = MS.vista[id]==='tab' && tab;
  return `<section class="mz-box" aria-labelledby="mzg-${id}"><div class="mz-btesta"><div><div class="mz-btit" id="mzg-${id}">${tit}</div><div class="mz-etich">${fonteMz(fonte)}${righeBtn(kpi, tit)}</div></div>${tab?`<button class="mz-vista" data-mz="vista" data-v="${id}">${t?tr('Grafico'):tr('Tabella')}</button>`:''}</div>${t?tab:corpo}</section>`;
}
const bloccataMz = (n, t, why) => `<button class="mz-bloccata" data-mz="kpi" data-n="${n}"><span class="mz-tondo">${mzIco.lucchetto}</span><span><b>${t}</b><span class="meta">${why}</span><span class="meta mz-sottolineato">${tr('Riga {n} del catalogo',{n})}</span></span></button>`;
const vuotoMz = t => `<p class="mz-nota">${t}</p>`;
function hbarMz(items, col){
  const max = Math.max(1, ...items.map(x => x[1]));
  return `<div class="mz-hbar">${items.map(([k,v]) => `<span class="mz-nome">${esc(k)}</span><span class="mz-riga"><span class="mz-barra${v===0?' zero':''}" style="width:${v===0?0:Math.max(2,v/max*78)}%;${col?'background:'+col:''}"></span><span class="mz-v${v===0?' vuota':''}">${v===0?tr('vuota'):nf(v)}</span></span>`).join('')}</div>`;
}
const LINEE_MZ = {};
function niceStepMz(mx){ const raw = Math.max(1,mx)/4, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw/p; return Math.max(1,(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p); }
function lineaMz(id, serie, giorni, opt){
  opt = opt||{};
  const W = 360, H = 190, pl = 44, pr = 10, pt = 14, pb = 24, n = giorni.length;
  const vals = serie.flatMap(s => s.v).filter(v => v!=null);
  if(!vals.length) return vuotoMz(opt.vuoto || tr('Ancora nessun dato in questo periodo.'));
  const step = niceStepMz(Math.max(...vals)), mx = Math.ceil(Math.max(...vals)/step)*step || step;
  const x = i => pl + (W-pl-pr)*(n===1 ? .5 : i/(n-1)), y = v => pt + (H-pt-pb)*(1 - v/mx);
  LINEE_MZ[id] = {serie, giorni, W, H, pl, pr, pt, x, azioni:opt.azioni||[]};
  let o = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(serie.map(s => s.nome).join(', '))}" data-mzline="${id}" style="touch-action:pan-y">`;
  for(let v=0; v<=mx; v+=step) o += `<line x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}" class="mz-griglia"/><text x="${pl-6}" y="${y(v)+4}" text-anchor="end">${nf(v)}</text>`;
  const tick = n<=8 ? 1 : n<=31 ? 7 : 21;
  for(let i=n-1; i>=0; i-=tick) o += `<text x="${x(i)}" y="${H-6}" text-anchor="${i===n-1?'end':i===0?'start':'middle'}">${brevD(giorni[i])}</text>`;
  (opt.azioni||[]).forEach(a => { o += `<line x1="${x(a.i)}" x2="${x(a.i)}" y1="${pt}" y2="${H-pb}" class="mz-az"/><circle cx="${x(a.i)}" cy="${pt}" r="4" class="mz-az-p"/>`; });
  serie.forEach(s => {
    let d = '', pen = false; s.v.forEach((v,i) => { if(v==null){ pen = false; return; } d += `${pen?'L':'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`; pen = true; });
    if(serie.length===1 && !s.v.some(v => v==null) && n>1) o += `<path d="M${x(0)},${y(0)}L${s.v.map((v,i) => x(i).toFixed(1)+','+y(v).toFixed(1)).join('L')}L${x(n-1)},${y(0)}Z" fill="${s.col}" opacity=".1"/>`;
    o += `<path d="${d}" fill="none" stroke="${s.col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    s.v.forEach((v,i) => { const solo = v!=null && (i===0 || s.v[i-1]==null) && (i===n-1 || s.v[i+1]==null); if(solo) o += `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${s.col}"/>`; });
    let li = s.v.length-1; while(li>0 && s.v[li]==null) li--;
    if(s.v[li]!=null) o += `<circle cx="${x(li)}" cy="${y(s.v[li])}" r="4" fill="${s.col}" class="mz-anello"/>`;
  });
  o += `<line class="mz-mirino" x1="0" x2="0" y1="${pt}" y2="${H-pb}" opacity="0"/><rect x="${pl}" y="${pt}" width="${W-pl-pr}" height="${H-pt-pb}" fill="transparent"/></svg>`;
  return o;
}
function tabLineaMz(serie, giorni){
  return `<div class="mz-scorri" style="max-height:280px"><table class="mz-tab"><tr><th>${tr('Giorno')}</th>${serie.map(s => `<th class="n">${esc(s.nome)}</th>`).join('')}</tr>${giorni.map((g,i) => `<tr><td>${lungD(g)}</td>${serie.map(s => `<td class="n">${s.v[i]==null?`<span class="meta">${tr('nessun dato')}</span>`:nf(s.v[i])}</td>`).join('')}</tr>`).reverse().join('')}</table></div>`;
}
const decCls = l => ({crit:'crit', warn:'warn', ok:'ok', neu:'neu'})[l]||'neu';

/* ---------- schede ---------- */
const SCHEDE_MZ = [['panoramica','Panoramica'],['offerta','Offerta'],['rete','Rete'],['accessi','Accessi e interesse'],['qualita','Qualità'],['impatto','Impatto'],['catalogo','Catalogo · 50']];
const PER_MZ = {7:'7 giorni', 30:'30 giorni', 90:'3 mesi'};
function disegnaMisure(){
  const el = $('pagina-misure'); if(!el) return;
  const y = el.scrollTop;
  const conFiltri = MS.scheda!=='catalogo';
  const ambito = MS.ambito==='tutte' ? tr('Tutte le città') : nomeCitta(citta);
  const soloDemo = !events.some(e => mzReale(e) && !e.demo) && events.some(e => mzReale(e) && e.demo);
  el.innerHTML = `<div class="mz-testa">
      <div class="mz-barra-t"><button class="mz-icona" data-mz="esci" aria-label="${esc(tr('Torna all’admin'))}">${mzIco.indietro}</button><h1>${tr('Misure')}</h1>
        <button class="mz-chip" data-mz="ambito" aria-label="${esc(tr('Cambia ambito: {a}',{a:ambito}))}"><span>${esc(ambito)}</span></button>
        <button class="mz-icona" data-mz="fonti" aria-label="${esc(tr('Da dove vengono i numeri'))}">${mzIco.info}</button></div>
      ${conFiltri?`<div class="seg mz-periodo" role="group" aria-label="${esc(tr('Periodo'))}">${[7,30,90].map(p => `<button data-mz="periodo" data-v="${p}" aria-pressed="${MS.periodo===p}">${tr(PER_MZ[p])}</button>`).join('')}</div>`:''}
      <nav class="mz-schede" aria-label="${esc(tr('Sezioni delle misure'))}">${SCHEDE_MZ.map(([k,t]) => `<button data-mz="scheda" data-v="${k}" aria-pressed="${MS.scheda===k}"><span>${tr(t)}</span></button>`).join('')}</nav>
    </div>
    <div class="mz-corpo">
      ${soloDemo || MS.demo ? `<div class="mz-avviso">${mzIco.avviso}<p>${MS.demo ? tr('Stai guardando anche gli eventi della demo: i numeri di oggi li includono, gli andamenti nel tempo no.') : tr('Su questo telefono ci sono solo eventi della demo, e le misure contano solo gli eventi veri.')} <button class="link" data-mz="demo">${MS.demo?tr('Togli la demo dalle misure'):tr('Guarda la demo nelle misure')}</button></p></div>` : ''}
      ${({panoramica:vPanoramicaMz, offerta:vOffertaMz, rete:vReteMz, accessi:vAccessiMz, qualita:vQualitaMz, impatto:vImpattoMz, catalogo:vCatalogoMz})[MS.scheda]()}
      <p class="meta mz-piede">${tr('Le misure restano su questo telefono (chiave agorapp_misure) e si esportano in Excel. Nessun dato sulle persone che usano l’app.')}</p>
      <button class="tasto sec pieno" data-mz="esporta">${tr('Esporta le misure in Excel')}</button>
    </div>`;
  el.scrollTop = y;
  const a = el.querySelector('.mz-schede [aria-pressed="true"]'); if(a && a.scrollIntoView) a.scrollIntoView({inline:'nearest', block:'nearest'});
}

function vPanoramicaMz(){
  const m = mz(), S = mzStato(), g = mzGiorni(MS.periodo), att = serieAttivi(g);
  const oggiN = S.L.length, prima = att[Math.max(0, att.length-8)];
  const zTot = QUARTIERI.length, zOk = zTot - S.sotto.length;
  const totP = S.prov.consenso+S.prov.pubblica+S.prov.nd, quotaCons = totP ? Math.round(S.prov.consenso/totP*100) : null;
  const rimP = m.rimozioni.filter(r => (r.ric||'').slice(0,10) >= g[0]), rimOk = rimP.filter(r => { const h = oreTra(r.ric, r.eva); return h!=null && h<=48; }).length;
  const decs = decisioniMz(S);
  const sp = att.filter(v => v!=null);
  return `<h2 class="mz-h1">${tr('Il polso della città')}</h2>
    <p class="meta">${tr('Si misura la città, non le persone.')} ${esc(MS.ambito==='tutte'?tr('Tutte le città'):nomeCitta(citta))} · ${tr('ultimi {p}',{p:tr(PER_MZ[MS.periodo])})} · ${tr('aggiornato adesso')}</p>
    <div class="mz-card mz-hero"><div><div class="mz-lab">${tr('Eventi attivi oggi')}</div><div class="mz-num">${nf(oggiN)}</div>
      ${prima!=null?`<span class="mz-delta ${oggiN>=prima?'su':'giu'}">${oggiN>=prima?mzIco.su:mzIco.giu} ${oggiN>=prima?'+':'−'}${Math.abs(oggiN-prima)} ${tr('rispetto a 7 giorni fa')}</span>`:`<span class="meta">${tr('Il confronto arriva dopo qualche giorno di misure.')}</span>`}</div>
      ${sp.length>1?`<div class="mz-spark">${sparkMz(sp)}</div>`:''}<div>${fonteMz('ev')}</div></div>
    <h2 class="mz-h2">${tr('Sei indicatori')}</h2><p class="meta">${tr('Ognuno riassume più domande del catalogo. Toccali per vedere quali.')}</p>
    <div class="mz-griglia2">
      ${mzTile(tr('Copertura delle zone'), `${zOk}<small> ${tr('su {n}',{n:zTot})}</small>`, tr('zone di Torino con almeno {s} eventi nei prossimi 7 giorni',{s:m.soglie.zona}), 'ev', zOk/zTot, zOk<zTot, [5,3])}
      ${mzTile(tr('Ritmo di raccolta'), `${nf(S.nuovi7)}<small> / ${tr('sett.')}</small>`, tr('eventi nuovi · obiettivo {o}',{o:m.soglie.nuovi}), 'ev', S.nuovi7/m.soglie.nuovi, S.nuovi7<m.soglie.nuovi, [2,10,12])}
      ${mzTile(tr('Solidità delle fonti'), quotaCons==null?'–':`${quotaCons}<small> %</small>`, tr('eventi con consenso diretto')+(rimP.length?' · '+tr('rimozioni entro 48 h: {a} su {b}',{a:rimOk, b:rimP.length}):''), 'ev', quotaCons==null?null:quotaCons/100, false, [6,15,13])}
      ${tileInteresseMz()}
      ${mzTile(tr('Richieste al sito'), S.mediaRic==null?'–':`${nf(S.mediaRic)}<small> / ${tr('giorno')}</small>`, S.mediaRic==null?tr('copia i numeri da Netlify in «Accessi»'):tr('media del periodo · un indice, non persone'), 'man', null, false, [18,20])}
      ${mzTile(tr('Qualità dei dati'), S.qualita==null?'–':`${n1(S.qualita)}<small> %</small>`, tr('eventi corretti o rimossi sui nuovi · {n} segnalazioni',{n:S.segn}), 'ev', null, false, [11,16])}
    </div>
    <h2 class="mz-h2">${tr('Cosa decidere adesso')}</h2><p class="meta">${tr('Ogni misura serve a una decisione. Le soglie le scegli tu.')}</p>
    <div class="mz-pila">${decs.length ? decs.map(d => `<article class="mz-dec"><span class="mz-stato ${decCls(d.liv)}">${d.liv==='crit'||d.liv==='warn'?mzIco.avviso:''}${d.st}</span><h3>${esc(d.tit)}</h3><p class="mz-perche">${esc(d.perche)}</p><p class="mz-azione">${esc(d.azione)}</p>
      <div class="mz-azioni"><button data-mz="dec" data-id="${esc(d.id)}">${tr('Fatto')}</button>${d.vai?`<button data-mz="scheda" data-v="${d.vai}">${tr('Vai')}</button>`:''}<button data-mz="kpiset" data-k="${d.kpi.join(',')}" data-l="${esc(d.tit)}">${d.kpi.length>1?tr('Righe'):tr('Riga')} ${d.kpi.join(', ')}</button></div></article>`).join('') : vuotoMz(tr('Niente da decidere adesso.'))}</div>
    ${Object.values(m.stati).some(v => v==='fatto')?`<button class="link" data-mz="rimetti">${tr('Rimetti le decisioni segnate come fatte')}</button>`:''}
    <button class="tasto sec pieno" data-mz="soglie">${tr('Cambia le soglie')}</button>
    <h2 class="mz-h2">${tr('Cosa non vedrai mai qui')}</h2>
    <p class="mz-nota">${tr('Quanto tempo le persone restano nell’app, quante volte tornano, dove toccano la mappa, cosa cercano, chi sono. Sono misure escluse per principio o per legge: le trovi nel Catalogo, con il motivo.')}</p>
    <button class="tasto sec pieno" data-mz="scheda" data-v="catalogo" data-f="escluso">${tr('Vedi le misure escluse')}</button>`;
}
function tileInteresseMz(){
  const I = totInteresse(), m = mz();
  if(!I) return `<button class="mz-tile mz-tile-attesa" data-mz="kpiset" data-k="27,28" data-l="${esc(tr('Interesse per l’on-grid'))}"><span class="mz-lab">${tr('Interesse per l’on-grid')}</span><span class="mz-val">–</span><span class="mz-det">${MS.int && MS.int.stato==='carico' ? tr('Leggo i totali…') : tr('Totali non raggiungibili: il contatore è attivo solo sul sito pubblicato.')}</span>${fonteMz('vol')}</button>`;
  const tot = I.agora + I.progetti;
  return mzTile(tr('Interesse per l’on-grid'), nf(tot), tr('«Mi interessa» · Agorà {a} · Progetti {p} · soglia {s}',{a:I.agora, p:I.progetti, s:m.soglie.interesse}), 'vol', tot/m.soglie.interesse, false, [27,28]);
}
function sparkMz(v){ const W = 150, H = 48, mn = Math.min(...v), mx = Math.max(...v); const x = i => i/(v.length-1)*(W-8)+4, y = a => H-5-(a-mn)/((mx-mn)||1)*(H-12);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" aria-hidden="true"><path d="${v.map((a,i) => `${i?'L':'M'}${x(i).toFixed(1)},${y(a).toFixed(1)}`).join('')}" fill="none" class="mz-spark-l" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${x(v.length-1)}" cy="${y(v[v.length-1])}" r="4" class="mz-spark-p"/></svg>`; }

function vOffertaMz(){
  const m = mz(), S = mzStato(), g = mzGiorni(MS.periodo), att = serieAttivi(g);
  const strati = LAYERS.map(l => [tr(l.label), S.L.filter(e => e.category===l.id).length]).sort((a,b) => b[1]-a[1]);
  const tot = S.prov.consenso+S.prov.pubblica+S.prov.nd;
  const fa = [[tr('Consenso diretto'), S.prov.consenso, 'var(--mz-c1)'], [tr('Fonte pubblica'), S.prov.pubblica, 'var(--mz-c2)'], [tr('Non indicata'), S.prov.nd, 'var(--mz-nd)']];
  const heat = FASCE_MZ.map(() => [0,0,0,0,0,0,0]); S.L.forEach(e => { const d = new Date(e.datetime); if(isNaN(d)) return; heat[FASCE_MZ.findIndex(f => f[0]===fasciaDi(d.getHours()))][(d.getDay()+6)%7]++; });
  const hmax = Math.max(1, ...heat.flat()), GG = giorniBrevi(), ordine = [1,2,3,4,5,6,0];
  return `<h2 class="mz-h1">${tr('Offerta di eventi')}</h2><p class="meta">${tr('Calcolato dagli eventi che pubblichi: nessun utente coinvolto. Si conservano solo i totali del giorno, non gli eventi.')}</p>
    ${mzBox('attivi', tr('Eventi attivi ogni giorno'), lineaMz('attivi', [{nome:tr('Eventi attivi'), v:att, col:'var(--verde)'}], g, {vuoto:tr('Il grafico si riempie un giorno alla volta: ogni volta che apri le Misure si salva il totale del giorno.')})+`<p class="meta">${tr('Un giorno in cui l’admin non apre le Misure resta un buco.')}</p>`, tabLineaMz([{nome:tr('Eventi attivi'), v:att}], g), 'ev', [1])}
    <div class="mz-griglia2">
      ${mzTile(tr('Nuovi nel periodo'), nf(S.nuoviP), tr('negli ultimi 7 giorni: {n}',{n:S.nuovi7}), 'ev', null, false, [2])}
      ${mzTile(tr('Anticipo medio'), S.anticipo==null?'–':`${n1(S.anticipo)}<small> ${tr('giorni')}</small>`, tr('tra pubblicazione e inizio'), 'ev', null, false, [9])}
      ${mzTile(tr('Gratuiti'), S.grat==null?'–':`${S.grat}<small> %</small>`, tr('eventi con ingresso libero'), 'ev', null, false, [7])}
      ${mzTile(tr('Da import Excel'), nf(S.imp), tr('eventi attivi arrivati da un file'), 'ev', null, false, [10])}
    </div>
    ${mzBox('citta', tr('Eventi attivi per città'), hbarMz(S.perCitta), null, 'ev', [3])}
    ${mzBox('zone', tr('Zone di Torino · eventi nei prossimi 7 giorni'), zoneMz(S), `<table class="mz-tab"><tr><th>${tr('Zona')}</th><th class="n">${tr('Eventi')}</th></tr>${QUARTIERI.map(q => `<tr><td>${esc(q.n)}</td><td class="n">${S.zone[q.n]}</td></tr>`).join('')}</table>`, 'ev', [5])}
    ${mzBox('strati', tr('Eventi attivi per strato'), hbarMz(strati)+`<p class="meta">${tr('Gli strati più sottili sono quelli da cercare.')}</p>`, null, 'ev', [4])}
    ${mzBox('prov', tr('Da dove arrivano gli eventi'), tot ? `<div class="mz-stack" role="img" aria-label="${esc(fa.map(f => f[0]+' '+f[1]).join(', '))}">${fa.filter(f => f[1]).map(f => `<i style="width:${f[1]/tot*100}%;background:${f[2]}" data-mztip="<b>${esc(f[0])}</b><br>${f[1]} ${tr('eventi')} · ${Math.round(f[1]/tot*100)} %"></i>`).join('')}</div>
      <div class="mz-legenda">${fa.map(f => `<span><i style="background:${f[2]}"></i>${esc(f[0])} · ${Math.round(f[1]/tot*100)} %</span>`).join('')}</div><p class="meta">${tr('Più consenso diretto = base giuridica più solida (art. 6(1)(a) GDPR). La provenienza si indica nel form dell’evento o nella colonna «Provenienza» dell’Excel.')}</p>` : vuotoMz(tr('Nessun evento attivo.')),
      `<table class="mz-tab"><tr><th>${tr('Provenienza')}</th><th class="n">${tr('Eventi')}</th></tr>${fa.map(f => `<tr><td>${esc(f[0])}</td><td class="n">${f[1]}</td></tr>`).join('')}</table>`, 'ev', [6])}
    ${mzBox('heat', tr('Quando ci sono eventi'), `<div class="mz-heat"><span></span>${ordine.map(d => `<span class="mz-h c">${esc(GG[(d+6)%7])}</span>`).join('')}${FASCE_MZ.map((f,r) => `<span class="mz-h">${tr(f[1])}</span>${ordine.map(d => { const c = (d+6)%7, v = heat[r][c], lv = v ? Math.min(5, Math.ceil(v/hmax*5)) : 0; return `<button style="background:var(--mz-s${lv});color:${lv>=4?'var(--su-verde)':'var(--testo)'}" data-mztip="<b>${esc(GG[c])} · ${tr(f[1])}</b><br>${v} ${tr('eventi')}" aria-label="${esc(GG[c]+' '+tr(f[1])+': '+v)}">${v||''}</button>`; }).join('')}`).join('')}</div>
      <div class="mz-scala"><span>0</span><span class="mz-rampa">${[0,1,2,3,4,5].map(i => `<i style="background:var(--mz-s${i})"></i>`).join('')}</span><span>${hmax}</span></div>`,
      `<div class="mz-scorri"><table class="mz-tab"><tr><th></th>${ordine.map(d => `<th class="n">${esc(GG[(d+6)%7])}</th>`).join('')}</tr>${FASCE_MZ.map((f,r) => `<tr><td>${tr(f[1])}</td>${ordine.map(d => `<td class="n">${heat[r][(d+6)%7]}</td>`).join('')}</tr>`).join('')}</table></div>`, 'ev', [8])}
    ${bloccataMz(12, tr('Le fonti che rendono di più'), tr('Servirebbe un campo «fonte» per ogni evento: da decidere insieme, è una domanda «più avanti».'))}`;
}
function zoneMz(S){
  const max = Math.max(1, ...Object.values(S.zone)), s = mz().soglie.zona;
  return `<div class="mz-zone">${QUARTIERI.map(q => { const v = S.zone[q.n], sotto = v < s, lv = sotto ? 0 : Math.min(5, Math.max(1, Math.ceil(v/max*5)));
    return `<button class="${sotto?'sotto':''}" style="background:var(--mz-s${lv});color:${lv>=4?'var(--su-verde)':'var(--testo)'}" data-mztip="<b>${esc(q.n)}</b><br>${v} ${tr('eventi')}${sotto?' · '+tr('sotto soglia'):''}" aria-label="${esc(q.n+': '+v+(sotto?', '+tr('sotto soglia'):''))}"><span class="mz-zn">${esc(q.n)}</span><span class="mz-zv">${v}${sotto?` <small>· ${tr('sotto soglia')}</small>`:''}</span></button>`; }).join('')}</div>
    <div class="mz-scala"><span>${tr('meno')}</span><span class="mz-rampa">${[0,1,2,3,4,5].map(i => `<i style="background:var(--mz-s${i})"></i>`).join('')}</span><span>${tr('più')}</span><span style="margin-left:auto">${tr('tratteggio = sotto soglia ({s})',{s})}</span></div>
    <p class="meta">${tr('Sono le zone dei «vuoti» della mappa: rettangoli provvisori, i confini veri delle circoscrizioni sono rimandati.')}</p>`;
}

function vReteMz(){
  const m = mz(), S = mzStato(), g = mzGiorni(MS.periodo);
  const luoghi = new Set(S.L.map(e => normT(e.addressFull||e.address||'') || (+e.lat).toFixed(4)+','+(+e.lng).toFixed(4))).size;
  const segnP = somma(m.segnalazioni, g);
  const rim = m.rimozioni.slice().sort((a,b) => (b.ric||'').localeCompare(a.ric||''));
  return `<h2 class="mz-h1">${tr('Rete di organizzatori e luoghi')}</h2><p class="meta">${tr('Conteggi su ciò che gestisci già. Niente nomi.')}</p>
    <div class="mz-griglia2">
      ${mzTile(tr('Eventi con consenso diretto'), nf(S.prov.consenso), tr('organizzatori che pubblicano con te'), 'ev', null, false, [13])}
      ${mzTile(tr('Luoghi sulla mappa'), nf(luoghi), tr('indirizzi distinti degli eventi attivi'), 'ev', null, false, [17])}
      ${mzTile(tr('Segnalazioni ricevute'), nf(segnP), tr('eventi non validi, nel periodo'), 'mail', null, false, [16])}
      ${mzTile(tr('Richieste di rimozione'), nf(m.rimozioni.length), tr('registrate in tutto'), 'reg', null, false, [15])}
    </div>
    <div class="mz-card"><h3>${tr('Una segnalazione arrivata')}</h3><p class="meta">${tr('Un evento non valido segnalato su info@agorapp.it. Si conta solo il numero, non chi scrive.')}</p>
      <div class="tasti"><button class="tasto sec" data-mz="segn-meno" ${m.segnalazioni[oggi()]?'':'disabled'}>${tr('Togli l’ultima')}</button><button class="tasto pri" data-mz="segn-piu">${tr('+1 oggi')}${m.segnalazioni[oggi()]?' · '+m.segnalazioni[oggi()]:''}</button></div></div>
    ${mzBox('rimoz', tr('Registro delle richieste di rimozione'), `<form class="mz-form" data-mzform="rimozione"><div class="due"><label class="mz-etich">${tr('Ricevuta')}<span class="campo"><input type="datetime-local" name="ric" required></span></label><label class="mz-etich">${tr('Evasa')}<span class="campo"><input type="datetime-local" name="eva"></span></label></div><button class="tasto sec pieno" type="submit">${tr('Aggiungi al registro')}</button></form>
      ${rim.length ? `<div class="mz-scorri"><table class="mz-tab"><tr><th>${tr('Ricevuta')}</th><th>${tr('Evasa')}</th><th class="n">${tr('Ore')}</th><th>${tr('Entro 48 h')}</th><th></th></tr>${rim.map(r => { const h = oreTra(r.ric, r.eva), i = m.rimozioni.indexOf(r);
        return `<tr><td>${esc(fmtDt(r.ric))}</td><td>${r.eva?esc(fmtDt(r.eva)):`<button class="link" data-mz="rim-evasa" data-i="${i}">${tr('Evasa ora')}</button>`}</td><td class="n">${h==null?'–':h}</td><td>${h==null?(oreTra(r.ric,new Date().toISOString())>48?`<span class="mz-stato crit">${tr('Scaduta')}</span>`:`<span class="mz-stato neu">${tr('Aperta')}</span>`):h<=48?`<span class="mz-stato ok">${tr('Sì')}</span>`:`<span class="mz-stato crit">${tr('No')}</span>`}</td><td><button class="mz-icona piccola" data-mz="rim-togli" data-i="${i}" aria-label="${esc(tr('Togli dal registro'))}">${mzIco.x}</button></td></tr>`; }).join('')}</table></div>` : vuotoMz(tr('Nessuna richiesta registrata.'))}
      <p class="meta">${tr('Solo date e ore, niente nomi. Serve a dimostrare che rispetti i diritti (artt. 5(2) e 12 GDPR).')}</p>`, null, 'reg', [15])}
    ${bloccataMz(14, tr('Organizzatori che tornano a pubblicare'), tr('Prima va aggiunta la finalità statistica all’informativa per gli organizzatori (art. 6(4) GDPR).'))}`;
}
const fmtDt = s => { const d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString(dloc(), {day:'numeric', month:'short'}).replace('.','')+' '+hm(d); };

function vAccessiMz(){
  const m = mz(), g = mzGiorni(MS.periodo), r = g.map(x => m.richieste[x]!=null ? m.richieste[x] : null);
  const az = m.azioni.map(a => ({i:g.indexOf(a.d), t:a.t})).filter(a => a.i>=0);
  const mancanti = r.filter(v => v==null).length;
  const elenco = m.azioni.slice().sort((a,b) => b.d.localeCompare(a.d)).slice(0,8);
  return `<h2 class="mz-h1">${tr('Accessi e interesse')}</h2><p class="meta">${tr('I totali di Netlify, che copi a mano ogni giorno, e le azioni di comunicazione segnate per data.')}</p>
    ${mzBox('rich', tr('Richieste al sito ogni giorno'), lineaMz('rich', [{nome:tr('Richieste'), v:r, col:'var(--verde)'}], g, {azioni:az, vuoto:tr('Copia qui sotto il numero di oggi da Netlify: il grafico parte da lì.')})+`<div class="mz-legenda"><span><i class="mz-l-az"></i>${tr('azione di comunicazione')}</span><span>${tr('giorni senza dato: {n}',{n:mancanti})}</span></div>`, tabLineaMz([{nome:tr('Richieste'), v:r}], g), 'man', [18,20])}
    <div class="mz-avviso">${mzIco.avviso}<p><strong>${tr('Richieste, non persone.')}</strong> ${tr('Una visita fa molte richieste. Netlify non sa da che città arrivano: il filtro città qui non vale. Sul piano gratuito i numeri restano solo 24 ore: vanno copiati ogni giorno.')}</p></div>
    <div class="mz-card"><h3>${tr('Il numero di oggi')}</h3><p class="meta">${tr('Da Netlify → il progetto → riquadro delle richieste delle ultime 24 ore.')}</p>
      <form class="mz-riga-f" data-mzform="richieste"><label class="sr-only" for="mz-ric">${tr('Richieste di oggi')}</label><span class="campo"><input id="mz-ric" name="n" type="number" inputmode="numeric" min="0" placeholder="${esc(tr('es. 640'))}" value="${m.richieste[oggi()]!=null?m.richieste[oggi()]:''}"></span><button class="tasto pri" type="submit">${tr('Salva')}</button></form>
      <form class="mz-riga-f" data-mzform="azione"><label class="sr-only" for="mz-az">${tr('Azione di comunicazione di oggi')}</label><span class="campo"><input id="mz-az" name="t" type="text" maxlength="60" placeholder="${esc(tr('Azione di oggi, es. un volantino'))}"></span><button class="tasto sec" type="submit">${tr('Segna')}</button></form>
      ${elenco.length?`<div class="mz-elenco">${elenco.map(a => { const e = effettoAzione(a); return `<div><span>${esc(brevD(a.d))} · ${esc(a.t)}</span><span class="meta">${e==null?tr('effetto: servono i numeri di 3 giorni prima e dopo'):tr('effetto: {e} %',{e:(e>=0?'+':'')+e})}</span><button class="mz-icona piccola" data-mz="az-togli" data-i="${m.azioni.indexOf(a)}" aria-label="${esc(tr('Togli'))}">${mzIco.x}</button></div>`; }).join('')}</div>`:''}
      <p class="meta">${tr('Niente link tracciati o parametri nell’indirizzo: per l’EDPB anche il tracciamento via URL rientra nell’art. 5(3) ePrivacy. Basta il confronto per data.')}</p></div>
    <h2 class="mz-h2">${tr('Interesse, solo se le persone lo dicono')}</h2>
    <p class="meta">${tr('Pulsanti «Mi interessa» nelle anteprime di Agorà e Progetti e «Vorrei Agorapp qui» nella scelta della città: un tocco invia solo +1. Niente nomi, niente email, niente IP salvati.')}</p>
    ${interesseMz(g)}
    <h2 class="mz-h2">${tr('In attesa')}</h2><p class="meta">${tr('Misure utili che oggi superano la tua soglia: a livello UE chiederebbero il consenso.')}</p>
    ${bloccataMz(26, tr('Aperture di Agorà, Progetti, calendario'), tr('Contatore automatico via script: per l’EDPB (Linee guida 2/2023) è «accesso» al dispositivo.'))}
    ${bloccataMz(36, tr('Eventi Off-Grid creati'), tr('Il contenuto non lascerebbe mai il telefono; resta comunque un segnale automatico.'))}
    ${bloccataMz(33, tr('Lingue e modalità semplice'), tr('Stesso motivo. Ora: chiedilo nei test sul campo.'))}`;
}

function interesseMz(g){
  const I = totInteresse();
  if(!I) return vuotoMz(MS.int && MS.int.stato==='carico' ? tr('Leggo i totali…') : tr('Totali non raggiungibili. Il contatore funziona solo quando la funzione è pubblicata sul sito (main) e il telefono è in rete.'));
  const a = serieInteresse(g, 'agora'), p = serieInteresse(g, 'progetti');
  return mzBox('inter', tr('«Mi interessa» accumulati'), lineaMz('inter', [{nome:tr('Agorà'), v:a, col:'var(--mz-c1)'}, {nome:tr('Progetti'), v:p, col:'var(--mz-c2)'}], g, {})+`<div class="mz-legenda"><span><i class="mz-l-linea" style="background:var(--mz-c1)"></i>${tr('Agorà')} · ${I.agora}</span><span><i class="mz-l-linea" style="background:var(--mz-c2)"></i>${tr('Progetti')} · ${I.progetti}</span><span>${tr('soglia: {s} in totale',{s:mz().soglie.interesse})}</span></div>`,
      tabLineaMz([{nome:tr('Agorà'), v:a}, {nome:tr('Progetti'), v:p}], g), 'vol', [27,28])
    + mzBox('voglio', tr('«Vorrei Agorapp qui»'), I.citta.length ? hbarMz(I.citta, 'var(--mz-c2)')+`<p class="meta">${tr('La persona sceglie la città da un elenco: nessuna geolocalizzazione dell’IP.')}</p>` : vuotoMz(tr('Ancora nessuna città segnalata.')), null, 'vol', [32])
    + `<p class="meta">${tr('I numeri sono indicativi: senza identificare nessuno non si possono escludere i tocchi ripetuti da telefoni diversi.')}</p>`;
}
function vQualitaMz(){
  const m = mz(), V = m.versioni.slice(-6), soglia = m.soglie.carico;
  const W = 360, H = 170, pl = 28, pb = 26, pt = 16, mx = Math.max(soglia+1, ...V.map(v => v.s))+.5, n = Math.max(1,V.length);
  const bw = Math.min(24, (W-pl)/n*.5), x = i => pl + (W-pl)/n*(i+.5), y = v => pt + (H-pt-pb)*(1 - v/mx);
  const col = V.length ? `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(tr('Secondi per versione'))}">${Array.from({length:Math.floor(mx)+1}, (_,v) => `<line x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="mz-griglia"/><text x="${pl-6}" y="${y(v)+4}" text-anchor="end">${v}</text>`).join('')}
    <line x1="${pl}" x2="${W}" y1="${y(soglia)}" y2="${y(soglia)}" class="mz-soglia"/>
    ${V.map((v,i) => { const top = y(v.s), bot = y(0), sopra = v.s>soglia; return `<path d="M${x(i)-bw/2},${bot} V${top+4} q0,-4 4,-4 h${bw-8} q4,0 4,4 V${bot} Z" class="${sopra?'mz-col-sopra':'mz-col'}"/><text x="${x(i)}" y="${top-6}" text-anchor="middle" class="mz-t-forte">${n1(v.s)}</text><text x="${x(i)}" y="${H-8}" text-anchor="middle">${esc(v.v.slice(0,10))}</text><rect x="${x(i)-22}" y="${pt}" width="44" height="${H-pt-pb}" fill="transparent" data-mztip="<b>${esc(v.v)}</b><br>${n1(v.s)} s · ${esc(brevD(v.d))}"/>`; }).join('')}</svg>
    <div class="mz-legenda"><span><i class="mz-l-soglia"></i>${tr('obiettivo {s} s',{s:n1(soglia)})}</span><span><i style="background:var(--verde)"></i>${tr('entro l’obiettivo')}</span><span><i style="background:var(--mz-c3)"></i>${tr('oltre')}</span></div>` : vuotoMz(tr('Nessuna misura ancora.'));
  const RL = [['mappa3g', tr('Mappa con rete 3G')], ['cal', tr('Calendario senza rete')], ['pdf', tr('PDF senza rete')]];
  const ES = {'':tr('da provare'), ok:tr('funziona'), no:tr('non funziona')};
  return `<h2 class="mz-h1">${tr('Qualità tecnica')}</h2><p class="meta">${tr('Misurata sui tuoi telefoni, non su quelli degli utenti.')}</p>
    ${mzBox('vers', tr('Primo contenuto visibile, per versione'), col+`<form class="mz-form" data-mzform="versione"><div class="due"><label class="mz-etich">${tr('Versione')}<span class="campo"><input name="v" maxlength="24" required placeholder="${esc(tr('es. Restyling 4.3'))}"></span></label><label class="mz-etich">${tr('Secondi')}<span class="campo"><input name="s" type="number" step="0.1" min="0" required placeholder="3,2"></span></label></div><button class="tasto sec pieno" type="submit">${tr('Aggiungi la misura')}</button></form>
      <p class="meta">${tr('Lighthouse o WebPageTest, telefono simulato, rete 4G lenta. Una misura a ogni rilascio.')}</p>${V.length?`<button class="link" data-mz="vers-togli">${tr('Togli l’ultima misura')}</button>`:''}`,
      V.length?`<table class="mz-tab"><tr><th>${tr('Versione')}</th><th>${tr('Data')}</th><th class="n">${tr('Secondi')}</th></tr>${m.versioni.map(v => `<tr><td>${esc(v.v)}</td><td>${esc(brevD(v.d))}</td><td class="n">${n1(v.s)}</td></tr>`).join('')}</table>`:null, 'test', [40])}
    ${mzBox('prove', tr('Prove della mappa'), `<form class="mz-form" data-mzform="prova"><div class="due"><label class="mz-etich">${tr('Rete e telefono')}<span class="campo"><input name="rete" maxlength="40" required placeholder="${esc(tr('es. 4G, Realme'))}"></span></label><label class="mz-etich">${tr('Esito')}<span class="campo"><select name="ok"><option value="1">${tr('Caricata')}</option><option value="0">${tr('Non caricata')}</option></select></span></label></div><label class="mz-etich">${tr('Nota')}<span class="campo"><input name="nota" maxlength="80" placeholder="${esc(tr('es. caricata in 2,1 s'))}"></span></label><button class="tasto sec pieno" type="submit">${tr('Aggiungi la prova')}</button></form>
      ${m.prove.length?`<div class="mz-scorri"><table class="mz-tab"><tr><th>${tr('Data')}</th><th>${tr('Rete')}</th><th>${tr('Esito')}</th><th></th></tr>${m.prove.slice().reverse().map(p => `<tr><td>${esc(brevD(p.d))}</td><td>${esc(p.rete)}</td><td>${p.ok?`<span class="mz-stato ok">${tr('Ok')}</span>`:`<span class="mz-stato crit">${tr('No')}</span>`} <span class="meta">${esc(p.nota||'')}</span></td><td><button class="mz-icona piccola" data-mz="prova-togli" data-i="${m.prove.indexOf(p)}" aria-label="${esc(tr('Togli'))}">${mzIco.x}</button></td></tr>`).join('')}</table></div>`:''}`, null, 'test', [42])}
    <div class="mz-avviso">${mzIco.avviso}<p><strong>${tr('Font e librerie vengono da fuori.')}</strong> ${tr('Google Fonts, unpkg e cdnjs: ospitandoli nel sito l’app si carica anche su reti che li bloccano, e nessun IP va a terzi non dichiarati.')}</p></div>
    <div class="mz-card"><h3>${tr('Rete lenta o assente')}</h3><p class="meta">${tr('Tocca per cambiare lo stato.')}</p><div class="mz-pila">${RL.map(([k,l]) => `<button class="riga-int" data-mz="rete" data-k="${k}"><div><span class="t">${l}</span></div><span class="mz-stato ${m.rete[k]==='ok'?'ok':m.rete[k]==='no'?'crit':'neu'}">${ES[m.rete[k]||'']}</span></button>`).join('')}</div></div>
    ${bloccataMz(41, tr('Errori JavaScript sui telefoni degli utenti'), tr('Servirebbe un servizio esterno (tipo Sentry): nuovo fornitore, IP e dati del browser.'))}`;
}

function vImpattoMz(){
  const m = mz(), G = m.giri.slice().reverse(), u = G[0];
  const fr = (t, v, tot, k) => `<button class="mz-tile" data-mz="kpiset" data-k="${k}" data-l="${esc(t)}"><span class="mz-fr"><span>${t}</span><b>${v} ${tr('su')} ${tot}</b></span><span class="mz-barre" aria-hidden="true">${Array.from({length:Math.min(tot,30)}, (_,i) => `<i class="${i<Math.round(v/tot*Math.min(tot,30))?'on':''}"></i>`).join('')}</span></button>`;
  return `<h2 class="mz-h1">${tr('Impatto')}</h2><p class="meta">${tr('Si chiede alle persone, con il loro consenso. Con pochi partecipanti si mostrano i conteggi, non le percentuali.')}</p>
    ${u ? `<div class="mz-card"><div class="mz-lab">${esc(brevD(u.d))}</div><h3>${esc(u.titolo||tr('Giro di interviste'))} · ${tr('{n} persone',{n:u.n})}</h3><div class="mz-pila">
      ${fr(tr('Hanno scoperto eventi che non conoscevano'), u.scoperto, u.n, 44)}${fr(tr('Sono andate davvero a un evento trovato qui'), u.andato, u.n, 45)}${fr(tr('Hanno completato la guida iniziale senza aiuto'), u.guida, u.n, 35)}${fr(tr('Hanno creato un Off-Grid al primo tentativo'), u.og, u.n, 37)}</div>
      ${u.cons!=null&&u.cons!==''?`<p class="meta">${tr('Lo consiglierebbero: mediana {c} su 10.',{c:u.cons})}</p>`:''}${fonteMz('int')}</div>` : vuotoMz(tr('Nessun giro di interviste registrato. Dopo il lancio: 8–10 persone, stessa traccia di domande, così i giri si confrontano.'))}
    <div class="mz-card"><h3>${tr('Registra un giro')}</h3><form class="mz-form" data-mzform="giro">
      <label class="mz-etich">${tr('Nome del giro')}<span class="campo"><input name="titolo" maxlength="40" placeholder="${esc(tr('es. Dopo il lancio'))}"></span></label>
      <div class="due"><label class="mz-etich">${tr('Persone')}<span class="campo"><input name="n" type="number" min="1" max="200" required></span></label><label class="mz-etich">${tr('Hanno scoperto eventi nuovi')}<span class="campo"><input name="scoperto" type="number" min="0" required></span></label></div>
      <div class="due"><label class="mz-etich">${tr('Sono andate a un evento')}<span class="campo"><input name="andato" type="number" min="0" required></span></label><label class="mz-etich">${tr('Guida senza aiuto')}<span class="campo"><input name="guida" type="number" min="0" required></span></label></div>
      <div class="due"><label class="mz-etich">${tr('Off-Grid al primo tentativo')}<span class="campo"><input name="og" type="number" min="0" required></span></label><label class="mz-etich">${tr('Lo consiglierebbero (mediana 0–10)')}<span class="campo"><input name="cons" type="number" min="0" max="10" step="0.5"></span></label></div>
      <button class="tasto sec pieno" type="submit">${tr('Salva il giro')}</button></form>${G.length>1?`<p class="meta">${tr('Giri precedenti: {g}',{g:G.slice(1).map(x => (x.titolo||brevD(x.d))+' ('+x.n+')').join(' · ')})}</p>`:''}${u?`<button class="link" data-mz="giro-togli">${tr('Togli l’ultimo giro')}</button>`:''}</div>
    ${bloccataMz(46, tr('Agorapp riduce la solitudine?'), tr('Domande sul benessere possono essere dati sulla salute (art. 9 GDPR): solo con un partner universitario e il suo comitato etico.'))}`;
}

const statoKpiMz = k => k.par==='Misurare ora' ? 'attivo' : k.par==='Più avanti' ? 'attesa' : 'escluso';
const STATO_L = {attivo:'Attiva', attesa:'In attesa', escluso:'Esclusa'};
function vCatalogoMz(){
  const m = mz(), f = MS.filtroCat;
  const passa = (k, x) => x==='tutti' || (x==='oltre' ? k.soglia==='Sì' : x==='mie' ? !!m.mie[k.n] : statoKpiMz(k)===x);
  const F = [['tutti','Tutte'],['attivo','Attive'],['attesa','In attesa'],['escluso','Escluse'],['oltre','Oltre soglia'],['mie','Decise da te']];
  const lista = MZ_KPI.filter(k => passa(k, f));
  return `<h2 class="mz-h1">${tr('Catalogo delle misure')}</h2><p class="meta">${tr('Le 50 domande della tabella, con stato e conformità. Toccane una per i dettagli e per segnare la tua decisione.')}</p>
    <div class="mz-legenda"><span><span class="mz-pall g-Verde"></span>${tr('Verde')}</span><span><span class="mz-pall g-Giallo"></span>${tr('Giallo')}</span><span><span class="mz-pall g-Arancio"></span>${tr('Arancio')}</span><span><span class="mz-pall g-Rosso"></span>${tr('Rosso')}</span><span>UE · IT</span></div>
    <nav class="mz-schede mz-filtri" aria-label="${esc(tr('Filtra'))}">${F.map(([k,t]) => `<button data-mz="filtro" data-v="${k}" aria-pressed="${f===k}"><span>${tr(t)} · ${MZ_KPI.filter(x => passa(x,k)).length}</span></button>`).join('')}</nav>
    <div class="mz-pila">${lista.map(k => { const s = statoKpiMz(k), mia = m.mie[k.n];
      return `<button class="mz-kpi" data-mz="kpi" data-n="${k.n}"><span class="mz-nn">${k.n}</span><span class="mz-q"><b>${esc(k.q)}</b><span class="mz-chips"><span class="mz-stato ${s==='attivo'?'ok':s==='attesa'?'neu':'crit'}">${tr(STATO_L[s])}</span><span class="mz-comp"><span class="mz-pall g-${k.eu}"></span>UE ${tr(k.eu)}</span><span class="mz-comp"><span class="mz-pall g-${k.it}"></span>IT ${tr(k.it)}</span>${mia?`<span class="mz-stato warn">${tr('Tu: {d}',{d:tr(mia)})}</span>`:''}</span></span>${mzIco.avanti}</button>`; }).join('') || vuotoMz(tr('Nessuna domanda con questo filtro.'))}</div>`;
}

/* ---------- fogli sopra le Misure (usano il foglio dell'app) ---------- */
function foglioMz(html){ window.AGR.foglio(`<div class="mz-foglio">${html}</div>`, 'sez-misure'); }
function foglioKpiMz(n){
  const k = MZ_KPI.find(x => x.n==n); if(!k) return; const s = statoKpiMz(k), mia = mz().mie[k.n];
  foglioMz(`<div class="meta" style="font-weight:600">${tr('Riga {n}',{n:k.n})} · ${esc(k.area)}</div><h2>${esc(k.q)}</h2>
    <div class="mz-chips"><span class="mz-stato ${s==='attivo'?'ok':s==='attesa'?'neu':'crit'}">${tr('Parere: {p}',{p:tr(k.par)})}</span><span class="mz-comp">${tr('Utilità {u}',{u:tr(k.ut)})}</span><span class="mz-comp">${esc(k.fase)}</span>${k.soglia==='Sì'?`<span class="mz-stato crit">${tr('Oltre la tua soglia')}</span>`:''}</div>
    <dl class="mz-dl">
      <div><dt>${tr('Decisione che ne dipende')}</dt><dd>${esc(k.dec)}</dd></div>
      <div><dt>${tr('Come si calcola')}</dt><dd>${esc(k.calc)}</dd></div>
      <div><dt>${tr('Metodo')}</dt><dd>${esc(k.met)}</dd></div>
      <div><dt>${tr('Dati personali')}</dt><dd>${esc(k.dati)}</dd></div>
      <div><dt><span class="mz-pall g-${k.eu}"></span> ${tr('Unione europea')} · ${tr(k.eu)}</dt><dd>${esc(k.euM)}</dd></div>
      <div><dt><span class="mz-pall g-${k.it}"></span> ${tr('Italia')} · ${tr(k.it)}</dt><dd>${esc(k.itM)}</dd></div>
      <div><dt>${tr('Obblighi nuovi')}</dt><dd>${esc(k.obl)}</dd></div>
      <div><dt>${tr('Principi Agorapp')}</dt><dd>${esc(k.coer)}</dd></div>
      ${k.note?`<div><dt>${tr('Note')}</dt><dd>${esc(k.note)}</dd></div>`:''}
      <div><dt>${tr('Serve un parere umano?')}</dt><dd>${tr(k.um)}</dd></div>
    </dl>
    <h3>${tr('La tua decisione')}</h3>
    <div class="seg mz-seg2">${['Misurare ora','Più avanti','Non misurare','Da discutere'].map(x => `<button data-mz="mia" data-n="${k.n}" data-v="${x}" aria-pressed="${mia===x}">${tr(x)}</button>`).join('')}</div>
    <p class="meta">${tr('Resta su questo telefono e finisce nell’export Excel delle misure.')}</p>`);
}
function foglioSetMz(ks, l){
  const lista = ks.map(n => MZ_KPI.find(k => k.n==n)).filter(Boolean);
  foglioMz(`<div class="meta" style="font-weight:600">${tr('Domande dietro questo numero')}</div><h2>${esc(l)}</h2><div class="mz-pila">${lista.map(k => `<button class="mz-kpi" data-mz="kpi" data-n="${k.n}"><span class="mz-nn">${k.n}</span><span class="mz-q"><b>${esc(k.q)}</b><span class="mz-chips"><span class="mz-comp"><span class="mz-pall g-${k.eu}"></span>UE ${tr(k.eu)}</span><span class="mz-comp"><span class="mz-pall g-${k.it}"></span>IT ${tr(k.it)}</span><span class="mz-comp">${esc(k.met.split(' · ')[0])}</span></span></span>${mzIco.avanti}</button>`).join('')}</div>`);
}
function foglioFontiMz(){
  foglioMz(`<h2>${tr('Da dove vengono i numeri')}</h2><dl class="mz-dl">
    <div><dt>${fonteMz('ev')}</dt><dd>${tr('Calcolati dagli eventi on-grid di questo telefono. Ogni volta che apri le Misure si salva il totale del giorno (per esempio «143 eventi attivi»), mai gli eventi: l’informativa promette che spariscono 3 ore dopo la fine.')}</dd></div>
    <div><dt>${fonteMz('man')}</dt><dd>${tr('Copiati da te dal pannello di Netlify. Sul piano gratuito restano 24 ore: un giorno saltato resta un buco nel grafico.')}</dd></div>
    <div><dt>${fonteMz('mail')} ${fonteMz('reg')}</dt><dd>${tr('Contati da te: segnalazioni arrivate per email e richieste di rimozione, con solo date e ore.')}</dd></div>
    <div><dt>${fonteMz('test')}</dt><dd>${tr('Misure fatte da te sui tuoi telefoni: velocità, mappa, rete lenta.')}</dd></div>
    <div><dt>${fonteMz('int')}</dt><dd>${tr('Interviste e test sul campo, con il consenso dei partecipanti.')}</dd></div>
    <div><dt>${fonteMz('vol')}</dt><dd>${tr('Un tocco della persona invia +1, niente altro. La funzione sul sito somma i tocchi e non salva l’indirizzo IP; i totali stanno in un archivio Netlify nell’Unione europea (Francoforte).')}</dd></div>
    <div><dt>${tr('Dove restano')}</dt><dd>${tr('Su questo telefono, nella chiave agorapp_misure, come il resto dell’admin. Si esportano in Excel. Cancellando i dati di Chrome si perdono: esporta ogni tanto.')}</dd></div>
    <div><dt>${tr('Cosa non c’è')}</dt><dd>${tr('Nessun dato sulle persone che usano l’app: niente identificativi, cookie, IP, posizione, cronologia.')}</dd></div></dl>`);
}
function foglioSoglieMz(){
  const s = mz().soglie;
  const sl = (k, t, mn, mx, st0, suf) => `<div class="mz-slider"><div class="mz-sr"><label for="mzs-${k}">${t}</label><output id="mzo-${k}">${k==='carico'?n1(s[k]):s[k]}${suf}</output></div><input id="mzs-${k}" data-mzs="${k}" type="range" min="${mn}" max="${mx}" step="${st0}" value="${s[k]}"></div>`;
  foglioMz(`<h2>${tr('Le tue soglie')}</h2><p class="meta">${tr('Decidono quando una misura diventa «da fare».')}</p>
    ${sl('zona', tr('Eventi per zona nei prossimi 7 giorni'), 1, 15, 1, '')}${sl('nuovi', tr('Obiettivo di eventi nuovi a settimana'), 5, 200, 5, '')}${sl('carico', tr('Tempo massimo di caricamento'), 1.5, 6, .1, ' s')}${sl('interesse', tr('«Mi interessa» per pensare all’on-grid'), 20, 500, 10, '')}`);
}

/* ---------- export Excel ---------- */
function esportaMisure(){
  const m = mz(), giorni = Object.keys(Object.assign({}, m.giorni, m.richieste, m.creati, m.segnalazioni, m.correzioni)).sort();
  const cit = CITTA.map(c => c.id);
  const G = [[tr('Giorno'), tr('Eventi attivi'), ...CITTA.map(c => c.n), tr('Da import'), tr('Gratuiti'), tr('Consenso diretto'), tr('Fonte pubblica'), tr('Provenienza non indicata'), tr('Nuovi creati'), tr('Corretti'), tr('Rimossi'), tr('Richieste (Netlify)'), tr('Segnalazioni'), tr('Azioni di comunicazione')]]
    .concat(giorni.map(g => { const x = m.giorni[g]||{}, c = m.correzioni[g]||{}; return [dIso(g), x.tot!=null?x.tot:'', ...cit.map(id => x.citta ? (x.citta[id]||0) : ''), x.imp!=null?x.imp:'', x.grat!=null?x.grat:'',
      x.prov?(x.prov.consenso||0):'', x.prov?(x.prov.pubblica||0):'', x.prov?(x.prov.nd||0):'', m.creati[g]||0, c.c||0, c.r||0, m.richieste[g]!=null?m.richieste[g]:'', m.segnalazioni[g]||0, m.azioni.filter(a => a.d===g).map(a => a.t).join(' · ')]; }));
  const R = [[tr('Ricevuta'), tr('Evasa'), tr('Ore')]].concat(m.rimozioni.map(r => [r.ric, r.eva||'', oreTra(r.ric, r.eva)==null?'':oreTra(r.ric, r.eva)]));
  const V = [[tr('Versione'), tr('Data'), tr('Secondi')]].concat(m.versioni.map(v => [v.v, dIso(v.d), v.s]));
  const P = [[tr('Data'), tr('Rete e telefono'), tr('Esito'), tr('Nota')]].concat(m.prove.map(p => [dIso(p.d), p.rete, p.ok?tr('Caricata'):tr('Non caricata'), p.nota||'']));
  const I = [[tr('Data'), tr('Giro'), tr('Persone'), tr('Scoperto eventi nuovi'), tr('Andati a un evento'), tr('Guida senza aiuto'), tr('Off-Grid al primo tentativo'), tr('Mediana consiglio')]].concat(m.giri.map(x => [dIso(x.d), x.titolo||'', x.n, x.scoperto, x.andato, x.guida, x.og, x.cons==null?'':x.cons]));
  const C = [['N.', tr('Domanda'), tr('Parere di Claude'), tr('UE'), tr('IT'), tr('La tua decisione')]].concat(MZ_KPI.map(k => [k.n, k.q, k.par, k.eu, k.it, m.mie[k.n]||'']));
  const TI = totInteresse(), Ig = TI ? Object.keys(TI.giorni).sort() : [];
  const IN = [[tr('Giorno'), tr('Agorà'), tr('Progetti'), tr('Città')]].concat(Ig.map(g => { const x = TI.giorni[g]||{}; return [dIso(g), x.agora||0, x.progetti||0, Object.keys(x).filter(k => k.startsWith('citta:')).map(k => k.slice(6)+' '+x[k]).join(' · ')]; }));
  const Sg = [[tr('Soglia'), tr('Valore')], [tr('Eventi per zona nei prossimi 7 giorni'), m.soglie.zona], [tr('Obiettivo nuovi a settimana'), m.soglie.nuovi], [tr('Tempo massimo di caricamento (s)'), m.soglie.carico], [tr('«Mi interessa» per l’on-grid'), m.soglie.interesse]];
  fileExcel([[tr('Giorni'), G, [12,12,...CITTA.map(() => 12),10,10,12,12,14,10,10,10,14,12,40]], [tr('Rimozioni'), R, [20,20,8]], [tr('Versioni'), V, [20,12,10]], [tr('Prove mappa'), P, [12,24,14,40]], [tr('Interviste'), I, [12,20,10,14,14,14,16,14]], [tr('Catalogo'), C, [6,70,16,10,10,18]], [tr('Interesse'), IN, [12,10,10,50]], [tr('Soglie'), Sg, [44,10]]], 'agorapp_misure_'+oggi()+'.xlsx')
    .then(() => avviso(tr('Misure esportate: agorapp_misure_{d}.xlsx',{d:oggi()}), null, true))
    .catch(() => avviso(tr('Serve la connessione per preparare il file Excel.'), null, true));
}

/* ---------- apertura e interazioni ---------- */
function apriMisure(){ mzFotografa(); MS.demo = false; caricaInteresse(); vaiSezione('misure'); const el = $('pagina-misure'); if(el) el.scrollTop = 0; }
function clickMisure(t){
  const d = t.dataset, m = mz(), a = d.mz; if(!a) return false;
  nascondiTipMz();
  switch(a){
    case 'esci': vaiSezione('mappa'); apri('admin'); break;
    case 'scheda': MS.scheda = d.v; if(d.f) MS.filtroCat = d.f; chiudi(); disegnaMisure(); $('pagina-misure').scrollTop = 0; break;
    case 'periodo': MS.periodo = +d.v; disegnaMisure(); break;
    case 'ambito': MS.ambito = MS.ambito==='tutte' ? 'citta' : 'tutte'; disegnaMisure(); break;
    case 'demo': MS.demo = !MS.demo; disegnaMisure(); break;
    case 'fonti': foglioFontiMz(); break;
    case 'soglie': foglioSoglieMz(); break;
    case 'vista': MS.vista[d.v] = MS.vista[d.v]==='tab' ? 'g' : 'tab'; disegnaMisure(); break;
    case 'kpi': foglioKpiMz(d.n); break;
    case 'kpiset': foglioSetMz(d.k.split(','), d.l); break;
    case 'mia': m.mie[d.n] = m.mie[d.n]===d.v ? undefined : d.v; if(!m.mie[d.n]) delete m.mie[d.n]; mzSalva(); foglioKpiMz(d.n); disegnaMisure(); break;
    case 'filtro': MS.filtroCat = d.v; disegnaMisure(); break;
    case 'dec': m.stati[d.id] = 'fatto'; mzSalva(); disegnaMisure(); break;
    case 'rimetti': m.stati = {}; mzSalva(); disegnaMisure(); break;
    case 'segn-piu': m.segnalazioni[oggi()] = (m.segnalazioni[oggi()]||0)+1; mzSalva(); disegnaMisure(); break;
    case 'segn-meno': if(m.segnalazioni[oggi()]){ m.segnalazioni[oggi()]--; if(!m.segnalazioni[oggi()]) delete m.segnalazioni[oggi()]; mzSalva(); disegnaMisure(); } break;
    case 'rim-evasa': { const r = m.rimozioni[+d.i]; if(r){ r.eva = dtLocal(new Date()); mzSalva(); disegnaMisure(); } break; }
    case 'rim-togli': m.rimozioni.splice(+d.i, 1); mzSalva(); disegnaMisure(); break;
    case 'az-togli': m.azioni.splice(+d.i, 1); mzSalva(); disegnaMisure(); break;
    case 'prova-togli': m.prove.splice(+d.i, 1); mzSalva(); disegnaMisure(); break;
    case 'vers-togli': m.versioni.pop(); mzSalva(); disegnaMisure(); break;
    case 'giro-togli': m.giri.pop(); mzSalva(); disegnaMisure(); break;
    case 'rete': { const c = m.rete[d.k]||''; m.rete[d.k] = c==='' ? 'ok' : c==='ok' ? 'no' : ''; mzSalva(); disegnaMisure(); break; }
    case 'esporta': esportaMisure(); break;
    default: return false;
  }
  return true;
}
function inviaFormMz(f){
  const m = mz(), D = Object.fromEntries(new FormData(f).entries()), k = f.dataset.mzform, num = v => { const n = parseFloat(String(v==null?'':v).replace(',','.')); return isFinite(n) ? n : null; };
  if(k==='richieste'){ const n = num(D.n); if(n==null || n<0){ avviso(tr('Scrivi un numero'), null, true); return; } m.richieste[oggi()] = Math.round(n); avviso(tr('Salvato per oggi: {n} richieste',{n:nf(Math.round(n))}), null, true); }
  else if(k==='azione'){ const t = String(D.t||'').trim(); if(!t){ avviso(tr('Scrivi cosa hai fatto oggi'), null, true); return; } m.azioni.push({d:oggi(), t}); avviso(tr('Segnata sul grafico'), null, true); }
  else if(k==='rimozione'){ if(!D.ric) return; m.rimozioni.push({ric:D.ric, eva:D.eva||''}); }
  else if(k==='versione'){ const s = num(D.s); if(!D.v || s==null) return; m.versioni.push({v:String(D.v).trim(), s, d:oggi()}); }
  else if(k==='prova'){ if(!D.rete) return; m.prove.push({d:oggi(), rete:String(D.rete).trim(), ok:D.ok==='1', nota:String(D.nota||'').trim()}); }
  else if(k==='giro'){ const n = num(D.n); if(!n) return; const c = x => Math.max(0, Math.min(n, Math.round(num(x)||0)));
    m.giri.push({d:oggi(), titolo:String(D.titolo||'').trim(), n:Math.round(n), scoperto:c(D.scoperto), andato:c(D.andato), guida:c(D.guida), og:c(D.og), cons:num(D.cons)}); }
  mzSalva(); disegnaMisure();
}

/* ---------- tooltip dei grafici ---------- */
let tipMz = null;
function mostraTipMz(html, x, y){
  if(!tipMz){ tipMz = document.createElement('div'); tipMz.className = 'mz-tip'; tipMz.setAttribute('role','status'); document.body.appendChild(tipMz); }
  tipMz.innerHTML = html; tipMz.style.opacity = 1;
  const r = tipMz.getBoundingClientRect(); let L = Math.max(8, Math.min(innerWidth - r.width - 8, x - r.width/2)), T = y - r.height - 12; if(T<8) T = y + 16;
  tipMz.style.left = L+'px'; tipMz.style.top = T+'px';
}
function nascondiTipMz(){ if(tipMz) tipMz.style.opacity = 0; }
(function collegaMisure(){
  const el = $('pagina-misure'); if(!el) return;
  el.addEventListener('submit', ev => { const f = ev.target.closest('[data-mzform]'); if(!f) return; ev.preventDefault(); inviaFormMz(f); });
  el.addEventListener('pointermove', ev => {
    const svg = ev.target.closest && ev.target.closest('svg[data-mzline]');
    if(svg){ const L = LINEE_MZ[svg.dataset.mzline]; if(!L) return; const r = svg.getBoundingClientRect(), px = (ev.clientX - r.left)/r.width*L.W, n = L.giorni.length;
      let i = Math.round((px - L.pl)/(L.W - L.pl - L.pr)*(n-1)); i = Math.max(0, Math.min(n-1, i));
      const mi = svg.querySelector('.mz-mirino'), xx = L.x(i); mi.setAttribute('x1', xx); mi.setAttribute('x2', xx); mi.setAttribute('opacity', .5);
      const az = L.azioni.filter(a => a.i===i).map(a => `<br>● ${esc(a.t)}`).join('');
      mostraTipMz(`<b>${esc(lungD(L.giorni[i]))}</b>${L.serie.map(s => `<br>${esc(s.nome)}: ${s.v[i]==null?tr('nessun dato'):nf(s.v[i])}`).join('')}${az}`, r.left + xx/L.W*r.width, r.top + 10); return; }
    const t = ev.target.closest && ev.target.closest('[data-mztip]');
    if(t){ const r = t.getBoundingClientRect(); mostraTipMz(t.dataset.mztip, r.left + r.width/2, r.top); } else nascondiTipMz();
  });
  el.addEventListener('pointerleave', () => { nascondiTipMz(); el.querySelectorAll('.mz-mirino').forEach(m => m.setAttribute('opacity', 0)); });
  el.addEventListener('pointerdown', ev => { const t = ev.target.closest && ev.target.closest('[data-mztip]'); if(t){ const r = t.getBoundingClientRect(); mostraTipMz(t.dataset.mztip, r.left + r.width/2, r.top); } });
  el.addEventListener('scroll', nascondiTipMz, {passive:true});
  $('foglio-slot').addEventListener('input', ev => { const s = ev.target.dataset && ev.target.dataset.mzs; if(!s) return; const m = mz(); m.soglie[s] = +ev.target.value; mzSalva(); const o = $('mzo-'+s); if(o) o.textContent = (s==='carico'?n1(m.soglie[s]):m.soglie[s])+(s==='carico'?' s':''); if(st.sezione==='misure') disegnaMisure(); });
})();
