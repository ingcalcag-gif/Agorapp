/* ======================= Ricerca per nome: accesso e portabilità (T-048) =======================
   Libro mastro: § 3.13 (accesso, art. 15: ricerca negli eventi attuali, nello storico e nei registri; portabilità,
   art. 20: i dati forniti, in un formato leggibile da una macchina, quando il trattamento si basa sul consenso); § 18.7
   (si cerca il nome negli eventi e nello storico, il codice P nei registri; si consegnano le voci trovate senza i dati
   di altre persone); cap. 26 (nel resoconto compare soltanto il codice della richiesta). Anagrafica, registro dei
   consensi e codici P stanno nei registri tenuti a mano, fuori dall'app. Decisioni del 26/11/2026, nn. 14 e 15.

   Accesso. La Redazione scrive il codice della richiesta (R-0001), le forme del nome (come in «Togli questo nome
   ovunque», sorgenti/moduli/nomi.js) e, se c'è, il codice P della persona. L'app cerca il nome negli eventi pubblicati,
   sospesi e nascosti di cui ha la password, nelle copie dello storico delle pubblicazioni (una alla volta, dalla più
   vecchia, con la lettura firmata «copia»), nelle schede preparate e nelle righe del registro delle fonti di questo
   dispositivo; cerca il codice P tra le fonti e i «Non pubblicati». Per ogni evento mostra quando è stato pubblicato
   con il nome, in quali campi e il brano attorno al nome, e la fonte (art. 15, par. 1, lett. g). L'app non sa che
   cosa sia un nome: i brani e le fonti si ripuliscono a mano dei dati di altre persone (art. 15, par. 4) prima di
   esportare; i recapiti li toglie l'app. Il resoconto esce in Excel, intestato con il solo codice della richiesta.

   Portabilità. La Redazione scrive i codici C del registro dei consensi: l'app trova le righe del registro delle fonti
   con quei codici (eventi nascosti; eventi pubblicati con un consenso diretto o esplicito) e i loro eventi, attuali o
   nello storico. Gli eventi nascosti già finiti non si leggono più, perché la password si cancella alla fine (§ 3.14).
   Escono due file: l'Excel con le colonne del modello d'importazione e il JSON nel formato degli eventi.

   Testi come testo (T-024): titoli, brani e fonti entrano nella pagina solo con esc(). */
const RN = {r:'', forme:'', p:'', lavoro:false, ferma:false, passo:'', errore:'', msg:'', righe:null, registri:null, illeggibili:0};
const RP = {r:'', c:'', lavoro:false, ferma:false, passo:'', errore:'', msg:'', eventi:null, illeggibili:0};
fogliPb.push('rn', 'rp');
const mascheraRecapiti = s => RECAPITI.reduce((t, re) => t.replace(re, '[recapito tolto]'), String(s||''));
const giornoRn = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(dloc(), {day:'numeric', month:'numeric', year:'numeric'}); };
/* un brano su una riga: il nome con il testo che ha intorno */
const branoRn = (p) => { if(p.collegamento) return tr('Collegamento alla pagina dell’evento: {u}',{u:p.testo}); const e = MODULI.nomi.estratto(p.testo, p.da, p.a, 100); return e.prima + e.nome + e.dopo; };
/* legge le copie dello storico dalla più vecchia; per ognuna chiama fai(copia). Si ferma con «Ferma». */
async function giroStorico(S, fai){
  const el = await SPORTELLO.chiedi({operazione:'storico'}), copie = (el.copie||[]).slice().reverse();
  for(let i = 0; i < copie.length && !S.ferma; i++){
    S.passo = tr('Leggo lo storico: copia {i} di {n}',{i:i+1, n:copie.length}); if(i % 5 === 0) ridisegnaPb();
    await fai(await leggiCopiaPb(copie[i].nome));
  }
  return copie.length;
}
/* gli eventi nascosti di una copia si aprono solo con una password ancora nella cassaforte */
async function nascostiDiCopia(k, cache){
  const out = [];
  for(const x of (k.nascosti||[]).concat(k.nascostiSospesi||[])){
    const chiave = x.id+'|'+JSON.stringify(x.file).length+'|'+x.impronta;
    if(!cache.has(chiave)){ const c = await apriVoceNascosta(x); cache.set(chiave, c ? c.ev : null); }
    const ev = cache.get(chiave); if(ev) out.push(ev); else out.illeggibili = (out.illeggibili||0) + 1;
  }
  return out;
}

/* ---------- Accesso ---------- */
async function cercaAccesso(){
  const N = MODULI.nomi, forme = N.forme(RN.forme), P = RN.p.trim().toUpperCase();
  RN.errore = ''; RN.msg = '';
  if(!forme.length && !P){ RN.errore = tr('Scrivi il nome, in una o più forme, oppure il codice P della persona.'); disegnaFoglio(); return; }
  if(P && !CODICE_P.test(P)){ RN.errore = tr('Il codice della persona si scrive come «P-0001».'); disegnaFoglio(); return; }
  RN.lavoro = true; RN.ferma = false; RN.righe = null; RN.registri = null; RN.illeggibili = 0; RN.passo = tr('Cerco negli eventi attuali…'); disegnaFoglio();
  const trovati = new Map(), visti = new Map(), cache = new Map();
  /* ogni evento con il nome: dove sta oggi, in quante copie compare, prima e ultima copia, brani distinti */
  const guarda = (ev, dove, quando) => {
    if(!forme.length || !ev || !ev.id) return;
    const firma = ev.id+'|'+(ev.modificato||'')+'|'+JSON.stringify(ev).length;
    let punti = visti.get(firma); if(!punti){ punti = N.puntiEvento(ev, forme).map(p => Object.assign(p, {testo:N.leggiCampo(ev, p.campo)})); visti.set(firma, punti); }
    if(!punti.length) return;
    const x = trovati.get(ev.id) || {id:ev.id, inizio:ev.inizio, dove:'', copie:0, primo:'', ultimo:'', brani:new Map(), fonte:''};
    if(dove) x.dove = dove; if(quando){ x.copie++; if(!x.primo) x.primo = quando; x.ultimo = quando; }
    x.inizio = ev.inizio; x.fonte = (ev.fonte||{}).testo || '';
    punti.forEach(p => { const b = branoRn(p), k = p.campo+'|'+b; if(!x.brani.has(k)) x.brani.set(k, {campo:p.campo, brano:b}); });
    trovati.set(ev.id, x);
  };
  try{
    const s = await SPORTELLO.chiedi({operazione:'stato'}); PB.stato = s; await nrDecifra(nrVoci(s));
    s.eventi.forEach(ev => guarda(ev, tr('Pubblicato'))); s.sospesi.forEach(ev => guarda(ev, tr('Sospeso')));
    nrVoci(s).forEach(x => { const c = NR.chiari.get(x.id); if(c) guarda(c.ev, tr('Nascosto')); else RN.illeggibili++; });
    /* le copie dello storico: gli eventi in chiaro, e i nascosti di cui la cassaforte ha ancora la password */
    if(forme.length) await giroStorico(RN, async k => { k.eventi.concat(k.sospesi).forEach(ev => guarda(ev, '', k.quando)); (await nascostiDiCopia(k, cache)).forEach(ev => guarda(ev, '', k.quando)); });
    await regApri();
    const righe = [...trovati.values()].map(x => ({dove:x.dove || tr('Solo nello storico'), inizio:x.inizio, copie:x.copie, primo:x.primo, ultimo:x.dove ? '' : x.ultimo, fonte:mascheraRecapiti(x.fonte),
      brani:[...x.brani.values()].map(b => ({campo:b.campo, brano:mascheraRecapiti(b.brano)})), id:x.id, on:true}));
    if(REG.stato==='aperto' && forme.length){
      REG.dati.preparati.forEach(p => { const pt = puntiModulo(p.dati||{}, forme); if(pt.length) righe.push({dove:tr('Scheda preparata {c}',{c:p.codice}), meta:tr('Scheda non pubblicata, solo su questo dispositivo'), inizio:(p.dati||{}).inizio||'', copie:0, primo:'', ultimo:'', fonte:mascheraRecapiti((p.dati||{}).fonte),
        brani:pt.map(q => ({campo:q.campo, brano:mascheraRecapiti(branoRn(q))})), on:true}); });
      REG.dati.eventi.forEach(r => { const pt = [['titolo', r.titolo], ['fonte.testo', r.testoFonte]].flatMap(([c, t]) => (t ? N.trova(t, forme) : []).map(q => Object.assign(q, {campo:c, testo:t})));
        if(pt.length) righe.push({dove:tr('Registro delle fonti, riga {c}',{c:r.codice||r.id}), meta:tr('Riga del registro delle fonti su questo dispositivo: il registro non si modifica (cap. 22)'), inizio:'', copie:0, primo:r.quando||'', ultimo:'', fonte:'', brani:pt.map(q => ({campo:q.campo, brano:mascheraRecapiti(branoRn(q))})), on:true}); });
    }
    RN.righe = righe;
    RN.registri = !P || REG.stato!=='aperto' ? [] : registriDiP(P);
  }catch(e){ RN.errore = e && e.motivo ? errorePb(e) : tr('Non sono riuscito a leggere gli eventi o lo storico: riprova.'); }
  RN.lavoro = false; RN.passo = ''; disegnaFoglio();
}
/* il codice P nei registri del dispositivo: fonti che sono la persona, righe degli eventi da quelle fonti, «Non pubblicati» */
function registriDiP(P){
  const d = REG.dati, fonti = d.fonti.filter(f => f.nome===P), cod = new Set(fonti.map(f => f.codice)), out = [];
  fonti.forEach(f => { const ev = d.eventi.filter(r => r.g && r.g.fonte===f.codice);
    out.push([tr('Registro delle fonti'), f.codice, tr((tipoFonte(f.tipo)||[])[1]||''), tr('Righe degli eventi con questa fonte: {n}',{n:ev.length})+(ev.length ? ' ('+ev.map(r => r.codice||'').filter(Boolean).join(', ')+')' : '')]); });
  d.nonPubblicati.filter(x => x.organizzatore===P).forEach(x => out.push([tr('Non pubblicati'), x.codice, x.registrata||'', x.motivo||'']));
  return out;
}
function fRn(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Cerca un nome: diritto di accesso')}</h2><p class="meta">${tr('Art. 15 GDPR · §§ 3.13 e 18.7')}</p></div>${chiudiBtn('admin')}</div>`;
  const campi = `<div class="due"><div class="stack-s"><label class="etich" for="rn-r">${tr('Codice della richiesta')}</label><div class="campo"><input id="rn-r" data-rn="r" maxlength="12" value="${esc(RN.r)}" placeholder="${CODICE_RICHIESTA}" autocomplete="off"></div></div>
      <div class="stack-s"><label class="etich" for="rn-p">${tr('Codice della persona')} <span class="fac">${tr('facoltativo')}</span></label><div class="campo"><input id="rn-p" data-rn="p" maxlength="12" value="${esc(RN.p)}" placeholder="P-0001" autocomplete="off"></div></div></div>
    <label class="etich" for="rn-forme">${tr('Il nome, in tutte le forme in cui può comparire')}</label>
    <div class="campo"><textarea id="rn-forme" data-rn="forme" maxlength="1200" placeholder="${esc(tr('Una forma per riga: nome e cognome, il solo cognome, il nome d’arte'))}">${esc(RN.forme)}</textarea></div>
    <span class="meta">${tr('Si cerca negli eventi attuali, nelle copie dello storico delle pubblicazioni, nelle schede preparate e nel registro delle fonti di questo dispositivo; il codice P tra le fonti e i «Non pubblicati». Anagrafica, registro dei consensi ed elenco dei contatti si cercano a mano (§ 18.7).')}</span>
    <div class="tasti"><button class="tasto pri" data-az="rn-cerca" ${RN.lavoro ? 'disabled' : ''}>${tr('Cerca')}</button>${RN.lavoro ? `<button class="tasto sec" data-az="rn-ferma">${tr('Ferma')}</button>` : ''}</div>`;
  const stato = `${RN.errore ? `<p class="err" role="alert">${esc(RN.errore)}</p>` : ''}${RN.msg ? `<p class="meta" role="status" style="color:var(--testo)">${esc(RN.msg)}</p>` : ''}${RN.lavoro ? `<p class="caricamento">${esc(RN.passo)}</p>` : ''}`;
  return foglio('forte alto', testa, `${campi}${stato}${RN.righe ? risultatiRnHtml() : ''}`);
}
function risultatiRnHtml(){
  const R = RN.righe, scelte = R.filter(x => x.on).length;
  const ill = RN.illeggibili ? `<p class="meta">${tr('{n} eventi nascosti attuali non si leggono su questo dispositivo: la loro password non è nella sua cassaforte.',{n:RN.illeggibili})}</p>` : '';
  const reg = (RN.registri||[]).length ? `<p class="etich">${tr('Nei registri, con il codice della persona')} · ${RN.registri.length}</p><div class="imp-righe">${RN.registri.map(r => `<div>${r.map(esc).join(' · ')}</div>`).join('')}</div>` : '';
  if(!R.length) return `${ill}<p class="meta" role="status">${tr('Il nome non compare negli eventi né nello storico.')}</p>${reg}${(RN.registri||[]).length ? esportaRnHtml(0) : ''}`;
  return `<div class="red-riquadro g-avviso" role="note"><b>${tr('Prima di esportare, togli i dati di altre persone')}</b><span class="meta">${tr('L’app non sa riconoscere i nomi: leggi ogni brano e ogni fonte e cancella i nomi e i dettagli di altre persone (art. 15, par. 4). I recapiti li ha già tolti l’app.')}</span></div>
    ${ill}<p class="etich">${tr('Eventi in cui compare')} · ${R.length}</p>
    ${R.map((x, i) => `<div class="red-riquadro tn-voce">
      <button class="riga-int" data-rnp="${i}" aria-pressed="${x.on}"><span class="casella" aria-hidden="true"></span><div><span class="t">${esc(x.dove)}${x.inizio ? ' · '+tr('evento del {g}',{g:esc(giornoRn(x.inizio.slice(0,10)))}) : ''}</span>
        <span class="meta">${x.copie ? tr('In {n} copie dello storico, dal {a} al {b}',{n:x.copie, a:esc(giornoRn(x.primo)), b:esc(giornoRn(x.ultimo || x.primo))}) : esc(x.meta || tr('Non è nello storico delle pubblicazioni'))}</span></div></button>
      ${x.brani.map((b, j) => `<label class="etich" for="rn-b-${i}-${j}">${esc(etichettaTn(b.campo))}</label><div class="campo"><textarea id="rn-b-${i}-${j}" data-rnb="${i}.${j}">${esc(b.brano)}</textarea></div>`).join('')}
      <label class="etich" for="rn-f-${i}">${tr('Fonte')}</label><div class="campo"><input id="rn-f-${i}" data-rnf="${i}" value="${esc(x.fonte)}" autocomplete="off"></div></div>`).join('')}
    ${reg}${esportaRnHtml(scelte)}`;
}
const esportaRnHtml = n => `<div class="tasti"><button class="tasto pri" data-az="rn-esporta">${n ? tr('Esporta il resoconto in Excel ({n} eventi)',{n}) : tr('Esporta il resoconto in Excel')}</button></div>
  <p class="meta">${tr('Il file è intestato con il solo codice della richiesta, senza nome. Non ha password: consegnalo sul canale della richiesta e cancella la copia dal dispositivo.')}</p>`;
function esportaAccesso(){
  const R = RN.r.trim().toUpperCase();
  if(!CODICE_R.test(R)){ RN.errore = tr('Scrivi il codice della richiesta come «{c}».',{c:CODICE_RICHIESTA}); disegnaFoglio(); return; }
  const righe = (RN.righe||[]).filter(x => x.on), oggiIt = giornoRn(new Date().toISOString());
  const testa = [tr('Luogo'), tr('Evento del'), tr('Copie dello storico'), tr('Pubblicato dal'), tr('Pubblicato fino al'), tr('Campo'), tr('Brano'), tr('Fonte')];
  const dati = righe.flatMap(x => x.brani.map((b, j) => [x.dove, x.inizio ? giornoRn(x.inizio.slice(0,10)) : '', x.copie||'', x.primo ? giornoRn(x.primo) : '', x.ultimo ? giornoRn(x.ultimo) : x.copie ? tr('ancora pubblicato') : '', etichettaTn(b.campo), mascheraRecapiti(b.brano), j ? '' : mascheraRecapiti(x.fonte)]));
  const fogli = [['Resoconto', [[tr('Richiesta {r} · dati trovati per il diritto di accesso (art. 15 GDPR)',{r:R})], [tr('Preparato il {g}. Dai brani sono tolti i dati di altre persone e i recapiti.',{g:oggiIt})], [], testa].concat(dati.length ? dati : [[tr('Il nome non compare negli eventi né nello storico delle pubblicazioni.')]]), [26,12,10,13,15,22,70,30], {testa:3}]];
  if((RN.registri||[]).length) fogli.push(['Registri', [[tr('Richiesta {r} · voci dei registri con il codice della persona',{r:R})], [], [], [tr('Registro'), tr('Codice'), tr('Tipo o data'), tr('Dettaglio')]].concat(RN.registri), [22,12,26,60], {testa:3}]);
  const nome = 'accesso-'+R+'-'+oggi()+'.xlsx';
  fileExcel(fogli, nome).then(() => { registra('accesso-esporta', {n:righe.length}); RN.errore = ''; RN.msg = tr('Resoconto esportato: {f}.',{f:nome}); disegnaFoglio(); },
    () => { RN.errore = tr('Non sono riuscito a preparare il file Excel.'); disegnaFoglio(); });
}

/* ---------- Portabilità ---------- */
async function cercaPortabilita(){
  const codici = [...new Set(RP.c.toUpperCase().split(/[\s,;]+/).filter(Boolean))];
  RP.errore = ''; RP.msg = '';
  if(!codici.length || codici.some(c => !CODICE_C.test(c))){ RP.errore = tr('Scrivi uno o più codici del registro dei consensi, come «C-0001».'); disegnaFoglio(); return; }
  RP.lavoro = true; RP.ferma = false; RP.eventi = null; RP.illeggibili = 0; RP.passo = tr('Cerco nel registro delle fonti…'); disegnaFoglio();
  try{
    await regApri(); if(REG.stato!=='aperto') throw Object.assign(new Error('registro'), {testo:statoRegistro()});
    const righe = REG.dati.eventi.filter(r => r.g && codici.includes(String(r.g.consenso||'').trim().toUpperCase()));
    const ids = new Set(righe.map(r => r.id)), presi = new Map(), cache = new Map();
    const s = await SPORTELLO.chiedi({operazione:'stato'}); PB.stato = s; await nrDecifra(nrVoci(s));
    s.eventi.concat(s.sospesi).forEach(ev => { if(ids.has(ev.id)) presi.set(ev.id, {ev, dove:tr('Attuale')}); });
    nrVoci(s).forEach(x => { if(!ids.has(x.id)) return; const c = NR.chiari.get(x.id); if(c) presi.set(x.id, {ev:c.ev, dove:tr('Attuale, nascosto')}); });
    const mancano = () => [...ids].filter(id => !presi.has(id) || presi.get(id).vecchio);
    /* gli eventi che non ci sono più: l'ultima versione nello storico; i nascosti solo con la password ancora nella cassaforte */
    const prendi = (ev, dove) => { if(ids.has(ev.id) && (!presi.has(ev.id) || presi.get(ev.id).vecchio)) presi.set(ev.id, {ev, dove, vecchio:true}); };
    if(mancano().length) await giroStorico(RP, async k => { k.eventi.concat(k.sospesi).forEach(ev => prendi(ev, tr('Nello storico')));
      if((k.nascosti||[]).concat(k.nascostiSospesi||[]).some(x => ids.has(x.id))) (await nascostiDiCopia(k, cache)).forEach(ev => prendi(ev, tr('Nello storico, nascosto'))); });
    RP.illeggibili = [...ids].filter(id => !presi.has(id)).length;
    RP.eventi = [...presi.values()].map(x => Object.assign(x, {on:true})).sort((a, b) => a.ev.inizio<b.ev.inizio?-1:1);
  }catch(e){ RP.errore = e && e.testo ? e.testo : e && e.motivo ? errorePb(e) : tr('Non sono riuscito a leggere gli eventi o lo storico: riprova.'); }
  RP.lavoro = false; RP.passo = ''; disegnaFoglio();
}
function fRp(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Portabilità dei dati forniti con il consenso')}</h2><p class="meta">${tr('Art. 20 GDPR · § 3.13')}</p></div>${chiudiBtn('admin')}</div>`;
  const campi = `<p class="meta">${tr('Vale solo per i trattamenti basati sul consenso: gli eventi nascosti e gli eventi pubblicati con un consenso diretto o esplicito. Gli eventi pubblici mandati da un organizzatore si basano sul legittimo interesse (§ 3.3); un ente non ha questo diritto.')}</p>
    <div class="due"><div class="stack-s"><label class="etich" for="rp-r">${tr('Codice della richiesta')}</label><div class="campo"><input id="rp-r" data-rp="r" maxlength="12" value="${esc(RP.r)}" placeholder="${CODICE_RICHIESTA}" autocomplete="off"></div></div>
      <div class="stack-s"><label class="etich" for="rp-c">${tr('Codici del consenso')}</label><div class="campo"><input id="rp-c" data-rp="c" maxlength="200" value="${esc(RP.c)}" placeholder="C-0001" autocomplete="off"></div></div></div>
    <div class="tasti"><button class="tasto pri" data-az="rp-cerca" ${RP.lavoro ? 'disabled' : ''}>${tr('Cerca')}</button>${RP.lavoro ? `<button class="tasto sec" data-az="rp-ferma">${tr('Ferma')}</button>` : ''}</div>`;
  const stato = `${RP.errore ? `<p class="err" role="alert">${esc(RP.errore)}</p>` : ''}${RP.msg ? `<p class="meta" role="status" style="color:var(--testo)">${esc(RP.msg)}</p>` : ''}${RP.lavoro ? `<p class="caricamento">${esc(RP.passo)}</p>` : ''}`;
  const E = RP.eventi, n = E ? E.filter(x => x.on).length : 0;
  const lista = !E ? '' : `${RP.illeggibili ? `<p class="meta">${tr('{n} eventi di questi consensi non si leggono più: erano nascosti e la loro password si è cancellata alla fine dell’evento (§ 3.14). Il resoconto lo dice.',{n:RP.illeggibili})}</p>` : ''}
    ${E.length ? `<p class="etich">${tr('Eventi trovati')} · ${E.length}</p>${E.map((x, i) => `<button class="riga-int" data-rpe="${i}" aria-pressed="${x.on}"><span class="casella" aria-hidden="true"></span><div><span class="t">${esc(x.ev.titolo)}</span><span class="meta">${esc(quandoEv(x.ev))} · ${esc(x.dove)}</span></div></button>`).join('')}` : `<p class="meta" role="status">${tr('Nessun evento con questi codici nel registro delle fonti di questo dispositivo.')}</p>`}
    <div class="tasti"><button class="tasto sec" data-az="rp-excel" ${n || RP.illeggibili ? '' : 'disabled'}>${tr('Scarica l’Excel')}</button><button class="tasto sec" data-az="rp-json" ${n || RP.illeggibili ? '' : 'disabled'}>${tr('Scarica il JSON')}</button></div>
    <p class="meta">${tr('Excel: le colonne del modello con cui gli organizzatori mandano gli eventi. JSON: il formato degli eventi del nostro archivio. I file non hanno password: consegnali sul canale della richiesta e cancella le copie dal dispositivo.')}</p>`;
  return foglio('forte alto', testa, `${campi}${stato}${lista}`);
}
/* una riga del modello d'importazione (MODELLO, strumenti.js): le colonne dell'evento, senza quelle del registro */
const COLONNE_PORTABILITA = MODELLO.slice(0, 17);
function rigaModello(ev){
  const l = LAYERS.find(x => x.id===ev.strato), sub = l && ev.sottostrato ? l.sub.find(x => x.id===ev.sottostrato) : null;
  const [g, h] = String(ev.inizio||'').split('T'), fine = ev.fine ? String(ev.fine).split('T') : null;
  return [ev.titolo, l ? l.label : ev.strato, sub ? sub.label : '', ev.descrizione||'', g ? dIso(g) : '', h||'', fine ? fine[1] : '', ev.durata||'', ev.prezzo||'',
    ev.luogo||'', ev.indirizzo||'', ev.descrizione_luogo||'', ev.lat, ev.lng, (ev.fonte||{}).collegamento||'', (ev.fonte||{}).testo||'', ev.organizzatore||''];
}
function esportaPortabilita(tipo){
  const R = RP.r.trim().toUpperCase();
  if(!CODICE_R.test(R)){ RP.errore = tr('Scrivi il codice della richiesta come «{c}».',{c:CODICE_RICHIESTA}); disegnaFoglio(); return; }
  const ev = (RP.eventi||[]).filter(x => x.on).map(x => x.ev), nota = RP.illeggibili ? tr('{n} eventi nascosti non si leggono più: la loro password si è cancellata alla fine dell’evento.',{n:RP.illeggibili}) : '';
  const fatto = f => { registra('portabilita-esporta', {n:ev.length}); RP.errore = ''; RP.msg = tr('Scaricato: {f}.',{f}); disegnaFoglio(); };
  if(tipo==='json'){
    const nome = 'portabilita-'+R+'-'+oggi()+'.json';
    const d = Object.assign({formato:'eventi', versione:1, richiesta:R, creato:oggi(), eventi:ev}, nota ? {nota} : {});
    scaricaBlob(new Blob([JSON.stringify(d, null, 1)], {type:'application/json'}), nome); fatto(nome); return;
  }
  const nome = 'portabilita-'+R+'-'+oggi()+'.xlsx';
  const fogli = [['Eventi', [COLONNE_PORTABILITA.map(x => x[0])].concat(ev.map(rigaModello)), COLONNE_PORTABILITA.map(x => x[1])],
    ['Istruzioni', [[tr('Richiesta {r} · dati forniti con il consenso (art. 20 GDPR)',{r:R})], [tr('Una riga per evento, con le colonne del modello per mandare gli eventi.')]].concat(nota ? [[nota]] : []), [100]]];
  fileExcel(fogli, nome).then(() => fatto(nome), () => { RP.errore = tr('Non sono riuscito a preparare il file Excel.'); disegnaFoglio(); });
}

/* ---------- Tocchi e campi ---------- */
DIRITTI.push({
  voce:() => `<button class="menu-r" data-az="rn">${icoNote}<div><span class="t">${tr('Cerca un nome: diritto di accesso')}</span><span class="meta">${tr('Eventi attuali, storico e registri del dispositivo; resoconto in Excel')}</span></div>${freccia}</button>
    <button class="menu-r" data-az="rp">${icoEsporta}<div><span class="t">${tr('Portabilità dei dati forniti con il consenso')}</span><span class="meta">${tr('Gli eventi di un codice C, in Excel e in JSON')}</span></div>${freccia}</button>`,
  click(t){ const d = t.dataset;
    if(d.rnp!=null && RN.righe){ const x = RN.righe[+d.rnp]; if(x){ x.on = !x.on; disegnaFoglio(); } return true; }
    if(d.rpe!=null && RP.eventi){ const x = RP.eventi[+d.rpe]; if(x){ x.on = !x.on; disegnaFoglio(); } return true; }
    return false; },
  azione(az){
    switch(az){
      case 'rn': Object.assign(RN, {r:'', forme:'', p:'', lavoro:false, ferma:false, errore:'', msg:'', righe:null, registri:null, illeggibili:0}); apri('rn'); return true;
      case 'rn-cerca': if(!RN.lavoro) cercaAccesso(); return true;
      case 'rn-ferma': RN.ferma = true; return true;
      case 'rn-esporta': esportaAccesso(); return true;
      case 'rp': Object.assign(RP, {r:'', c:'', lavoro:false, ferma:false, errore:'', msg:'', eventi:null, illeggibili:0}); apri('rp'); return true;
      case 'rp-cerca': if(!RP.lavoro) cercaPortabilita(); return true;
      case 'rp-ferma': RP.ferma = true; return true;
      case 'rp-excel': esportaPortabilita('excel'); return true;
      case 'rp-json': esportaPortabilita('json'); return true;
    }
    return false;
  },
  input(el){ const d = el.dataset;
    if(d.rn){ RN[d.rn] = el.value; return true; }
    if(d.rp){ RP[d.rp] = el.value; return true; }
    if(d.rnb && RN.righe){ const [i, j] = d.rnb.split('.').map(Number), b = (RN.righe[i]||{brani:[]}).brani[j]; if(b) b.brano = el.value; return true; }
    if(d.rnf && RN.righe){ const x = RN.righe[+d.rnf]; if(x) x.fonte = el.value; return true; }
    return false; }
});
Object.assign(FOGLI_RED, {rn:fRn, rp:fRp});
