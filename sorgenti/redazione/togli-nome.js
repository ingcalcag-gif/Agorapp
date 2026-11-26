/* ======================= «Togli questo nome ovunque» (T-047) =======================
   Libro mastro: § 3.5 «La rimozione» (entro 48 ore, con un testo neutro, negli eventi pubblicati e nei documenti
   operativi); § 3.13, passi 3 e 4; § 2.4 «Lo storico e le copie di sicurezza» (lo storico conserva il nome per il solo
   termine del § 3.14; dopo un ripristino le rimozioni si ripetono); cap. 22 e cap. 26 (né il registro delle fonti né
   quello delle richieste si modificano). Decisioni del 26/11/2026, nn. 10-13. Il nome si trova con
   sorgenti/moduli/nomi.js.

   Si comincia dalla richiesta: una di quelle aperte nel registro delle richieste di rimozione delle Misure (Misure →
   Rete), una nuova (ricevuta e codice R, che va nel registro) oppure nessuna, per esempio per correggere un errore. Poi
   si scrivono le forme del nome e si sceglie il ruolo che prende il suo posto. L'app cerca:
   - negli eventi pubblicati e sospesi (lettura firmata «stato»);
   - negli eventi nascosti di cui questo dispositivo ha la password nella cassaforte, trattati come gli altri, in un
     gruppo dopo i visibili (decisione n. 12); di quelli senza password dice soltanto quanti sono;
   - nelle schede preparate del registro delle fonti (red_registro);
   - nell'importazione da Excel e nel calendario di un Comune aperti in questo momento (pagina, non memoria).
   Ogni punto ha la sua casella, già segnata. Alla conferma l'app sostituisce i punti segnati, ripubblica in un solo
   pacchetto firmato gli eventi corretti (operazione «scrivi»: i sospesi restano sospesi, i nascosti si cifrano di nuovo
   con la stessa password), corregge i documenti operativi e scrive nelle Misure l'ora in cui la richiesta è evasa,
   con l'ora dello sportello. Se restano eventi nascosti che qui non si leggono, la richiesta resta aperta.

   Dopo il ripristino di una copia (pubblicazione.js, «Ripristina una copia») lo stesso strumento lavora sugli eventi
   della copia, prima che si ripubblichi: una richiesta alla volta, con il nome ripreso dall'anagrafica.

   Testi come testo (T-024): titoli, brani e forme entrano nella pagina solo con esc(). */
const TN = {modo:'archivio', k:null, rich:null, nuova:null, forme:'', ruolo:MODULI.nomi.RUOLI[0], ris:null, lavoro:false, conferma:false, errore:'', msg:'', fatto:false};
const CODICE_RICHIESTA = 'R-0001';
fogliPb.push('tn');
/* i campi del modulo dell'evento (schede preparate, righe dell'importazione) con il nome del campo nel formato pubblico */
const CAMPI_MODULO_TN = [['titolo','titolo'], ['desc','descrizione'], ['organizzatore','organizzatore'], ['luogo','luogo'], ['indirizzo','indirizzo'], ['comeArrivare','descrizione_luogo'],
  ['prezzo','prezzo'], ['fonte','fonte.testo'], ['fonteLink','fonte.collegamento'], ['testoCal','']];
const etichettaTn = c => c==='' ? tr('Testo del calendario del Comune') : CAMPI_PB[c] ? tr(CAMPI_PB[c]) : tr('Colonna «{c}» del file',{c});
const scadenzaTn = iso => new Date(new Date(iso).getTime() + 48*36e5);
const adessoIso = () => new Date().toISOString().slice(0,19)+'Z';

function apriTn(modo, k){
  Object.assign(TN, {modo, k:modo==='copia' ? k : null, rich:null, nuova:null, forme:'', ruolo:MODULI.nomi.RUOLI[0], ris:null, lavoro:false, conferma:false, errore:'', msg:'', fatto:false});
  apri('tn');
}

/* ---------- La richiesta ---------- */
function richiestaTnHtml(){
  const m = mz(), aperte = m.rimozioni.map((r, i) => [r, i]).filter(([r]) => r && r.ric && !r.eva).sort((a, b) => a[0].ric<b[0].ric?-1:1);
  const scelta = (v, t, meta) => `<button class="riga-int" data-az="tn-rich" data-v="${esc(v)}" aria-pressed="${String(TN.rich)===String(v)}"><span class="casella" aria-hidden="true"></span><div><span class="t">${t}</span>${meta ? `<span class="meta">${meta}</span>` : ''}</div></button>`;
  const quando = iso => { const s = scadenzaTn(iso); return s.getTime() < Date.now() ? `<span class="err">${tr('Scaduta: le 48 ore sono finite il {q}',{q:esc(quandoPb(s.toISOString()))})}</span>` : tr('Da evadere entro il {q}',{q:esc(quandoPb(s.toISOString()))}); };
  const N = TN.nuova || {};
  return `<p class="etich">${tr('La richiesta')}</p>
    ${aperte.map(([r, i]) => scelta(i, `${r.r ? esc(r.r)+' · ' : ''}${tr('ricevuta il {q}',{q:esc(quandoPb(r.ric))})}`, quando(r.ric))).join('')}
    ${scelta('nuova', tr('Una richiesta nuova'), tr('La aggiungo al registro delle richieste di rimozione delle Misure'))}
    ${TN.rich==='nuova' ? `<div class="red-riquadro"><div class="due"><div class="stack-s"><label class="etich" for="tn-ric">${tr('Ricevuta')}</label><div class="campo"><input id="tn-ric" type="datetime-local" data-tn="ric" value="${esc(N.ric||'')}"></div></div>
      <div class="stack-s"><label class="etich" for="tn-r">${tr('Codice della richiesta')}</label><div class="campo"><input id="tn-r" data-tn="r" maxlength="12" value="${esc(N.r||'')}" placeholder="${CODICE_RICHIESTA}" autocomplete="off"></div></div></div>
      <span class="meta">${tr('Il codice è quello della voce nel registro delle richieste (cap. 26): il nome della persona resta nell’anagrafica, mai qui.')}</span>${N.ric ? `<span class="meta">${quando(N.ric)}</span>` : ''}</div>` : ''}
    ${scelta('nessuna', tr('Senza richiesta'), tr('Per esempio per correggere un errore: nel registro non si scrive nulla'))}`;
}

/* ---------- La ricerca ---------- */
function puntiTesto(testo, forme, campo, link){
  const N = MODULI.nomi; if(!testo || typeof testo!=='string') return [];
  if(link){ let d = testo; try{ d = decodeURIComponent(testo); }catch(e){ d = testo; } return N.trova(d, forme).length ? [{campo, da:0, a:testo.length, testo, collegamento:true, on:true}] : []; }
  return N.trova(testo, forme).map(p => Object.assign({campo, testo, on:true}, p));
}
function puntiModulo(f, forme){ return CAMPI_MODULO_TN.flatMap(([k, campo]) => puntiTesto(f[k], forme, campo, k==='fonteLink').map(p => Object.assign(p, {k}))); }
function puntiRecord(r, forme){ return Object.keys(r||{}).flatMap(k => { const v = r[k], t = typeof v==='string' ? v : v && typeof v.v==='string' ? v.v : ''; return puntiTesto(t, forme, k, false).map(p => Object.assign(p, {k})); }); }
/* un evento nascosto della copia da ripristinare: si apre con la password della cassaforte, se c'è */
async function apriVoceNascosta(x){
  let pw = null; try{ pw = await CHIAVI.cassaforte.leggi(x.id); }catch(e){ pw = null; }
  if(!pw) return null;
  try{ return {ev:await MODULI.nascosti.decifra(x.file, pw, null, x.impronta), pw}; }catch(e){ return null; }
}

async function cercaTn(){
  const N = MODULI.nomi, forme = N.forme(TN.forme);
  TN.errore = ''; TN.conferma = false;
  if(TN.modo!=='copia'){
    if(TN.rich==null){ TN.errore = tr('Scegli la richiesta, oppure «Senza richiesta».'); disegnaFoglio(); return; }
    if(TN.rich==='nuova'){ const n = TN.nuova||{};
      if(!n.ric){ TN.errore = tr('Scrivi giorno e ora in cui è arrivata la richiesta.'); disegnaFoglio(); return; }
      if(!CODICE_R.test(String(n.r||'').trim().toUpperCase())){ TN.errore = tr('Scrivi il codice della richiesta come «{c}».',{c:CODICE_RICHIESTA}); disegnaFoglio(); return; } }
  }
  if(!forme.length){ TN.errore = tr('Scrivi almeno una forma del nome, una per riga.'); disegnaFoglio(); return; }
  TN.lavoro = true; TN.ris = null; disegnaFoglio();
  const voci = []; let illeggibili = 0;
  const evento = (tipo, ev, extra) => { const punti = N.puntiEvento(ev, forme).map(p => Object.assign(p, {testo:N.leggiCampo(ev, p.campo), on:true})); if(punti.length) voci.push(Object.assign({tipo, id:ev.id, ev, punti}, extra)); };
  try{
    if(TN.modo==='copia'){
      const R = PB.ripr; if(!R) throw new Error('copia');
      R.eventi.forEach(ev => evento('evento', ev, {lista:'eventi'})); R.sospesi.forEach(ev => evento('evento', ev, {lista:'sospesi', sospeso:true}));
      for(const [lista, l] of [['nascosti', R.nascosti], ['nascostiSospesi', R.nascostiSospesi]]) for(const x of l){
        const c = await apriVoceNascosta(x); if(!c){ illeggibili++; continue; }
        evento('nascosto', c.ev, {lista, voce:x, pw:c.pw, sospeso:lista==='nascostiSospesi'}); }
    } else {
      const s = await SPORTELLO.chiedi({operazione:'stato'}); PB.stato = s;
      await nrDecifra(nrVoci(s));
      s.eventi.forEach(ev => evento('evento', ev, {})); s.sospesi.forEach(ev => evento('evento', ev, {sospeso:true}));
      nrVoci(s).forEach(x => { const c = NR.chiari.get(x.id); if(!c){ illeggibili++; return; } evento('nascosto', c.ev, {voce:x, pw:c.pw, sospeso:(s.nascostiSospesi||[]).includes(x)}); });
      await regApri();
      if(REG.stato==='aperto') REG.dati.preparati.forEach(p => { const punti = puntiModulo(p.dati||{}, forme); if(punti.length) voci.push({tipo:'preparato', codice:p.codice, f:p.dati, punti}); });
      if(IX.stato) (IX.stato.righe||[]).forEach(R => { if(!R.f) return; const punti = puntiModulo(R.f, forme); if(punti.length) voci.push({tipo:'riga', riga:R, f:R.f, punti}); });
      if(CAL.stato && Array.isArray(CAL.stato.record)) CAL.stato.record.forEach((r, i) => { const punti = puntiRecord(r, forme); if(punti.length) voci.push({tipo:'record', i, r, punti}); });
    }
    TN.ris = {voci, illeggibili, forme:forme.map(x => x.forma)};
  }catch(e){ TN.errore = e && e.motivo ? errorePb(e) : tr('Non sono riuscito a leggere gli eventi: riprova.'); }
  TN.lavoro = false; disegnaFoglio();
}

/* ---------- I risultati ---------- */
const GRUPPI_TN = [['evento', 'Eventi pubblicati e sospesi'], ['nascosto', 'Eventi nascosti'], ['preparato', 'Schede preparate'], ['riga', 'Importazione da Excel in corso'], ['record', 'Calendario del Comune in lettura']];
function titoloVoceTn(v){
  if(v.tipo==='evento' || v.tipo==='nascosto') return [esc(v.ev.titolo), esc(quandoEv(v.ev))+(v.sospeso ? ' · '+tr('sospeso') : '')+(v.tipo==='nascosto' ? ' · '+tr('nascosto') : '')];
  if(v.tipo==='preparato') return [esc((v.f||{}).titolo || tr('Senza titolo')), esc(v.codice)];
  if(v.tipo==='riga') return [esc(v.f.titolo || tr('Senza titolo')), tr('Riga {r} del file',{r:v.riga.riga})];
  return [tr('Evento {n} del calendario',{n:v.i+1}), ''];
}
function branoTn(p){
  if(p.collegamento) return `<span class="tn-brano">${esc(p.testo)}</span><span class="meta">${tr('Il collegamento contiene il nome: si toglie, perché un indirizzo cambiato non porterebbe più alla pagina (il collegamento è facoltativo).')}</span>`;
  const e = MODULI.nomi.estratto(p.testo, p.da, p.a);
  return `<span class="tn-brano">${esc(e.prima)}<mark>${esc(e.nome)}</mark>${esc(e.dopo)}</span>`;
}
function risultatiTnHtml(){
  const R = TN.ris, copia = TN.modo==='copia', segnati = R.voci.reduce((n, v) => n + v.punti.filter(p => p.on).length, 0), tutti = R.voci.reduce((n, v) => n + v.punti.length, 0);
  const illeggibili = !R.illeggibili ? '' : `<div class="red-riquadro g-avviso" role="note"><b>${R.illeggibili===1 ? tr('1 evento nascosto non si legge su questo dispositivo.') : tr('{n} eventi nascosti non si leggono su questo dispositivo.',{n:R.illeggibili})}</b>
      <span class="meta">${tr('La loro password non è nella cassaforte di questo dispositivo, quindi qui non si sa se contengono il nome. Riprendi la copia della cassaforte (Strumenti della redazione → Chiavi) oppure ripeti la ricerca dal dispositivo che ha le loro password.')}${copia ? '' : ' '+tr('Finché non li hai controllati, la richiesta resta aperta nelle Misure.')}</span></div>`;
  if(!R.voci.length) return `${illeggibili}<p class="meta" role="status">${tr('Il nome non compare in nessun punto.')}</p>
    ${!copia && TN.rich!=null && TN.rich!=='nessuna' && !R.illeggibili ? `<div class="tasti"><button class="tasto sec" data-az="tn-evasa">${tr('Segna la richiesta come evasa')}</button></div>` : ''}
    ${copia ? `<div class="tasti"><button class="tasto sec" data-az="tn-copia-fatta">${tr('Segna la richiesta come ripetuta in questa copia')}</button></div>` : ''}`;
  const gruppi = GRUPPI_TN.map(([tipo, tit]) => { const l = R.voci.map((v, i) => [v, i]).filter(([v]) => v.tipo===tipo); if(!l.length) return '';
    return `<p class="etich">${tr(tit)} · ${l.length}</p>${l.map(([v, i]) => { const [t, meta] = titoloVoceTn(v);
      return `<div class="red-riquadro tn-voce"><div><span class="t">${t}</span>${meta ? `<span class="meta"> · ${meta}</span>` : ''}</div>
        ${v.punti.map((p, j) => `<button class="riga-int tn-punto" data-tnp="${i}.${j}" aria-pressed="${p.on}"><span class="casella" aria-hidden="true"></span><div><span class="meta">${esc(etichettaTn(p.campo))}</span>${branoTn(p)}</div></button>`).join('')}</div>`; }).join('')}`; }).join('');
  return `<p class="meta" role="status">${tr('Trovato in {p} punti. Togli il segno ai punti che non riguardano la persona, per esempio una via o un teatro con lo stesso nome.',{p:tutti})}</p>
    ${illeggibili}${gruppi}
    <p class="meta">${copia ? tr('Si corregge soltanto la copia da ripristinare: si pubblica con la copia.') : tr('Lo storico delle pubblicazioni e il registro delle fonti non si toccano: lo storico conserva il nome, fuori dall’uso quotidiano, per il solo termine del § 3.14.')}</p>
    <div class="tasti"><button class="tasto pericolo pieno" data-az="tn-togli" ${segnati && !TN.lavoro ? '' : 'disabled'}>${TN.conferma
      ? (copia ? tr('Tocca ancora: sostituisco {p} punti con «{r}» nella copia',{p:segnati, r:esc(TN.ruolo)}) : tr('Tocca ancora: sostituisco {p} punti con «{r}» e ripubblico con la firma di questo dispositivo',{p:segnati, r:esc(TN.ruolo)}))
      : tr('Togli il nome dai {p} punti segnati',{p:segnati})}</button></div>`;
}

function fTn(){
  const copia = TN.modo==='copia', rc = copia && PB.ripr ? PB.ripr.rimozioni[TN.k] : null;
  const testa = `<div class="riga-titolo"><div><h2>${copia ? tr('Togli il nome da questa copia') : tr('Togli questo nome ovunque')}</h2><p class="meta">${copia ? (rc ? (rc.r ? esc(rc.r)+' · ' : '')+tr('ricevuta il {q}',{q:esc(quandoPb(rc.ric))}) : '') : tr('Entro 48 ore dalla richiesta (§§ 3.5 e 3.13)')}</p></div>${chiudiBtn(copia ? 'pb-copia' : 'admin')}</div>`;
  const avviso = `${TN.errore ? `<p class="err" role="alert">${esc(TN.errore)}</p>` : ''}${TN.lavoro ? `<p class="caricamento">${TN.ris ? tr('Correggo e consegno allo sportello…') : tr('Cerco il nome…')}</p>` : ''}`;
  if(TN.fatto) return foglio('forte alto', testa, `<p role="status">${esc(TN.msg)}</p>
    <div class="tasti"><button class="tasto sec" data-az="tn">${tr('Togli un altro nome')}</button><button class="tasto pri" data-az="pubblica">${tr('Vai a «Pubblicazione»')}</button></div>`);
  const nome = `<label class="etich" for="tn-forme">${tr('Il nome, in tutte le forme in cui può comparire')}</label>
    <div class="campo"><textarea id="tn-forme" data-tn="forme" maxlength="1200" placeholder="${esc(tr('Una forma per riga: nome e cognome, il solo cognome, il nome d’arte'))}">${esc(TN.forme)}</textarea></div>
    <span class="meta">${tr('Maiuscole, accenti e apostrofi non contano; si cercano soltanto parole intere. Ogni punto trovato si guarda prima di toglierlo.')}</span>
    <label class="etich" for="tn-ruolo">${tr('Al suo posto')}</label>
    <div class="campo"><select id="tn-ruolo" data-tn="ruolo">${MODULI.nomi.RUOLI.map(x => `<option value="${esc(x)}" ${TN.ruolo===x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
    <span class="meta">${tr('Il ruolo che la persona ha negli eventi; vale per tutti i punti. Se ha ruoli diversi in eventi diversi, fai due passate.')}</span>
    <div class="tasti"><button class="tasto pri" data-az="tn-cerca" ${TN.lavoro ? 'disabled' : ''}>${tr('Cerca')}</button></div>`;
  const corpo = `${copia ? `<p class="meta">${tr('Il nome si riprende dall’anagrafica, con il codice della richiesta. Si corregge soltanto questa copia, prima di ripubblicarla.')}</p>` : richiestaTnHtml()}
    ${nome}${avviso}${TN.ris ? risultatiTnHtml() : ''}`;
  return foglio('forte alto', testa, corpo);
}

/* ---------- La correzione ---------- */
/* un evento con i punti segnati sostituiti; il collegamento che contiene il nome si toglie */
function eventoTn(v){
  const N = MODULI.nomi, on = v.punti.filter(p => p.on); let ev = v.ev;
  for(const campo of [...new Set(on.map(p => p.campo))]){
    const qui = on.filter(p => p.campo===campo);
    ev = qui.some(p => p.collegamento) ? N.conCampo(ev, campo, '') : N.conCampo(ev, campo, N.sostituisci(N.leggiCampo(v.ev, campo), qui, TN.ruolo));
  }
  ev.modificato = adessoIso();
  return ev;
}
/* una scheda preparata, una riga dell'importazione o un evento del calendario: si correggono sul posto */
function moduloTn(v){
  const on = v.punti.filter(p => p.on), N = MODULI.nomi;
  for(const k of [...new Set(on.map(p => p.k))]){
    const qui = on.filter(p => p.k===k);
    if(v.tipo==='record'){ const x = v.r[k]; if(typeof x==='string') v.r[k] = N.sostituisci(x, qui, TN.ruolo); else if(x && typeof x.v==='string') x.v = N.sostituisci(x.v, qui, TN.ruolo); continue; }
    const f = v.f, prima = f[k];
    f[k] = qui.some(p => p.collegamento) ? '' : N.sostituisci(prima, qui, TN.ruolo);
    if(k==='indirizzo' && f.addrFull) f.addrFull = f.addrFull===prima ? f.indirizzo : N.sostituisci(f.addrFull, N.trova(f.addrFull, TN.ris.forme.join('\n')), TN.ruolo);
  }
}
async function togliTn(){
  const R = TN.ris; if(!R || TN.lavoro) return;
  const scelte = R.voci.filter(v => v.punti.some(p => p.on)); if(!scelte.length) return;
  if(!TN.conferma){ TN.conferma = true; disegnaFoglio(); return; }
  TN.conferma = false; TN.lavoro = true; TN.errore = ''; disegnaFoglio();
  const NS = MODULI.nascosti, voc = {vocabolario:FORMATO.vocabolario(LAYERS, TEMI_VOC)};
  try{
    /* prima si preparano tutti gli eventi corretti: se uno non supera il controllo del formato non parte nulla */
    const pubblici = [], nascosti = [], errori = [];
    for(const v of scelte.filter(x => x.tipo==='evento' || x.tipo==='nascosto')){
      const ev = eventoTn(v), e = FORMATO.controlla(ev, voc).map(erroreCampoPb);
      if(e.length){ errori.push('«'+v.ev.titolo+'»: '+e.join('; ')); continue; }
      if(v.tipo==='evento') pubblici.push([v, ev]);
      else { const {file} = await NS.cifra(ev, v.pw, null, v.voce.impronta); nascosti.push([v, ev, {id:ev.id, impronta:v.voce.impronta, giorno:NS.giornoUscita(ev), file}]); }
    }
    if(errori.length){ TN.lavoro = false; TN.errore = tr('Con il testo neutro un evento non supera il controllo del formato, e non ho cambiato nulla: {e}',{e:errori.join(' · ')}); disegnaFoglio(); return; }
    const locali = scelte.filter(x => x.tipo!=='evento' && x.tipo!=='nascosto');
    if(TN.modo==='copia') return finisciCopiaTn(pubblici, nascosti);
    let quando = null;
    if(pubblici.length + nascosti.length){
      const c = {operazione:'scrivi'}; if(pubblici.length) c.pubblica = pubblici.map(x => x[1]); if(nascosti.length) c.nascosti = nascosti.map(x => x[2]);
      const r = await SPORTELLO.chiedi(c); quando = r.quando;
      nascosti.forEach(([v, ev, voce]) => NR.chiari.set(ev.id, {ev, pw:v.pw, v:JSON.stringify(voce.file)}));
      pubblici.concat(nascosti).forEach(() => misureConta('corretti'));
    }
    locali.forEach(moduloTn);
    const prep = locali.filter(x => x.tipo==='preparato').length;
    if(prep) await regSalva();
    registra('togli-nome', {n:pubblici.length + nascosti.length});
    TN.msg = finisciRichiestaTn(quando, pubblici.length + nascosti.length, prep, locali.filter(x => x.tipo==='riga').length, locali.filter(x => x.tipo==='record').length);
    TN.lavoro = false; TN.fatto = true; disegnaFoglio();
    aggiornaPb();
  }catch(e){ TN.lavoro = false; TN.errore = e && e.motivo ? errorePb(e) : tr('Non è riuscito: non ho cambiato nulla. Riprova.'); disegnaFoglio(); }
}
/* nelle Misure: la richiesta è evasa all'ora dello sportello, se non restano eventi nascosti da controllare */
function finisciRichiestaTn(quando, ev, prep, righe, cal){
  const ora = dtLocal(quando ? new Date(quando) : new Date()), m = mz(), aperta = !!TN.ris.illeggibili;
  const parti = [ev ? tr('Nome tolto alle {o} (ora dello sportello): {n} eventi corretti e ripubblicati con la firma di questo dispositivo.',{o:oraPb(quando), n:ev}) : tr('Nessun evento da ripubblicare.')];
  if(prep) parti.push(tr('Schede preparate corrette: {n}.',{n:prep}));
  if(righe) parti.push(tr('Righe dell’importazione in corso corrette: {n}.',{n:righe}));
  if(cal) parti.push(tr('Eventi del calendario in lettura corretti: {n}.',{n:cal}));
  if(TN.rich==='nessuna') return parti.join(' ');
  let voce = null;
  if(TN.rich==='nuova'){ voce = {ric:TN.nuova.ric, eva:'', r:String(TN.nuova.r).trim().toUpperCase()}; m.rimozioni.push(voce); }
  else voce = m.rimozioni[+TN.rich] || null;
  if(voce && !aperta) voce.eva = ora;
  mzSalva();
  const c = voce && voce.r ? voce.r : '';
  parti.push(!voce ? '' : aperta ? (c ? tr('La richiesta {c} resta aperta nelle Misure: mancano gli eventi nascosti che questo dispositivo non legge.',{c}) : tr('La richiesta resta aperta nelle Misure: mancano gli eventi nascosti che questo dispositivo non legge.'))
    : c ? tr('Richiesta {c} segnata come evasa nelle Misure ({o}).',{c, o:fmtDt(ora)}) : tr('Richiesta segnata come evasa nelle Misure ({o}).',{o:fmtDt(ora)}));
  return parti.filter(Boolean).join(' ');
}
function finisciCopiaTn(pubblici, nascosti){
  const R = PB.ripr;
  for(const [v, ev] of pubblici){ const l = R[v.lista], i = l.findIndex(x => x.id===ev.id); if(i>=0) l[i] = ev; }
  for(const [v, , voce] of nascosti){ const l = R[v.lista], i = l.findIndex(x => x.id===voce.id); if(i>=0) l[i] = voce; }
  R.corretti += pubblici.length + nascosti.length; R.fatte[TN.k] = !TN.ris.illeggibili;
  PB.msg = tr('Nome tolto da {n} eventi della copia.',{n:pubblici.length + nascosti.length}) + ' ' + (TN.ris.illeggibili ? tr('Restano eventi nascosti che questo dispositivo non legge: la richiesta non è segnata come ripetuta.') : tr('Richiesta segnata come ripetuta in questa copia.'));
  PB.errore = ''; TN.lavoro = false; apri('pb-copia');
}

/* ---------- Tocchi e campi ---------- */
DIRITTI.push({
  voce:() => `<button class="menu-r" data-az="tn">${icoNote}<div><span class="t">${tr('Togli questo nome ovunque')}</span><span class="meta">${tr('Rimozione di un nome su richiesta: eventi pubblicati, nascosti, schede preparate e importazioni aperte')}</span></div>${freccia}</button>`,
  click(t){ const d = t.dataset.tnp; if(d==null || !TN.ris) return false; const [i, j] = d.split('.').map(Number), p = (TN.ris.voci[i]||{punti:[]}).punti[j]; if(p){ p.on = !p.on; TN.conferma = false; disegnaFoglio(); } return true; },
  azione(az, t){
    switch(az){
      case 'tn': apriTn('archivio'); return true;
      case 'tn-copia': if(PB.ripr) apriTn('copia', +t.dataset.k); return true;
      case 'tn-rich': TN.rich = t.dataset.v==='nuova' || t.dataset.v==='nessuna' ? t.dataset.v : +t.dataset.v; if(TN.rich==='nuova' && !TN.nuova) TN.nuova = {ric:dtLocal(new Date()), r:''}; TN.ris = null; TN.errore = ''; disegnaFoglio(); return true;
      case 'tn-cerca': cercaTn(); return true;
      case 'tn-togli': togliTn(); return true;
      case 'tn-evasa': TN.ris = TN.ris || {voci:[], illeggibili:0, forme:[]}; TN.msg = finisciRichiestaTn(null, 0, 0, 0, 0); TN.fatto = true; disegnaFoglio(); return true;
      case 'tn-copia-fatta': if(PB.ripr){ PB.ripr.fatte[TN.k] = true; PB.msg = tr('Richiesta segnata come ripetuta in questa copia.'); apri('pb-copia'); } return true;
    }
    return false;
  },
  input(el){ const k = el.dataset.tn; if(!k) return false;
    if(k==='forme'){ TN.forme = el.value; TN.conferma = false; }
    else if(k==='ric' || k==='r'){ TN.nuova = TN.nuova || {ric:'', r:''}; TN.nuova[k] = el.value; }
    return true; },
  cambio(el){ if(el.dataset.tn!=='ruolo') return false; TN.ruolo = MODULI.nomi.RUOLI.includes(el.value) ? el.value : MODULI.nomi.RUOLI[0]; TN.conferma = false; return true; }
});
Object.assign(FOGLI_RED, {tn:fTn});
