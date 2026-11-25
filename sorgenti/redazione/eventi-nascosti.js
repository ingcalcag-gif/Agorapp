/* ======================= Eventi nascosti nell'app della redazione (T-045) =======================
   Libro mastro: § 2.3 (eventi nascosti); § 3.3, passo 4 (consenso dell'organizzatore, prima di pubblicare); § 3.11
   (cifratura sul dispositivo); § 3.14 (le password si cancellano quando l'evento finisce); § 9.2 (a che cosa servono:
   niente ritrovi privati né manifestazioni; i casi in luogo pubblico li valuta la Redazione); allegato A, A.2, punto 10;
   allegato C, C.2 (i due messaggi all'organizzatore). Documento: docs/eventi-nascosti.md.

   Il modulo dell'evento (pubblicazione.js) ha la casella «Evento nascosto». Accesa: l'app genera la password (cinque
   parole a caso, sorgenti/moduli/nascosti.js e parole-nascosti.js; decisione del 25/11/2026), chiede il codice C del
   consenso e ricorda le regole del § 9.2. «Pubblica» cifra l'evento su questo dispositivo, mette la password nella
   cassaforte (CHIAVI.cassaforte) e manda allo sportello soltanto il file illeggibile, con il nome che si ricava dalla
   password e il giorno in cui l'evento esce dalla mappa. Poi mostra la password con «Copia la password» e «Copia il
   messaggio di conferma» (il testo C.2), da mandare all'organizzatore sul canale del consenso. La password non va in
   nessun registro: nella riga del registro delle fonti c'è solo «Evento nascosto: sì».

   Lo sportello conosce gli eventi nascosti soltanto cifrati. Questo dispositivo li apre con le password della sua
   cassaforte (NR.chiari) per mostrarli nell'elenco, correggerli (stessa password), contarli nelle Misure (decisione del
   25/11/2026: come gli altri, con città e strato). Un evento nascosto di cui qui non c'è la password si può sospendere,
   riattivare o ritirare, non correggere. Nessun evento nascosto si importa da un file Excel (importa-excel.js).

   Testi come testo (T-024): titoli e password entrano nella pagina solo con esc(). */
const NR = {chiari:new Map(), fatto:null, copiato:''};

/* Apre con le password della cassaforte le voci nascoste lette dallo sportello: {id, impronta, giorno, file}. */
async function nrDecifra(voci){
  for(const x of voci || []){
    const v = JSON.stringify(x.file), c = NR.chiari.get(x.id);
    if(c && c.v===v) continue;
    let pw = null; try{ pw = await CHIAVI.cassaforte.leggi(x.id); }catch(e){ pw = null; }
    if(!pw){ NR.chiari.delete(x.id); continue; }
    try{ NR.chiari.set(x.id, {ev:await MODULI.nascosti.decifra(x.file, pw, null, x.impronta), pw, v}); }catch(e){ NR.chiari.delete(x.id); }
  }
}
const nrVoci = s => s ? (s.nascosti||[]).concat(s.nascostiSospesi||[]) : [];
/* Gli eventi nascosti pubblicati (non sospesi) che questo dispositivo sa aprire: per le Misure. */
function nrPerMisure(){
  if(typeof SPORTELLO==='undefined' || !SPORTELLO) return Promise.resolve([]);
  return SPORTELLO.chiedi({operazione:'stato'}).then(s => nrDecifra(s.nascosti).then(() => (s.nascosti||[]).map(x => NR.chiari.get(x.id)).filter(Boolean).map(c => c.ev)), () => []);
}

/* Il messaggio di conferma del modello C.2, con titolo e password. */
const messaggioC2 = (titolo, pw) => tr('Grazie! Abbiamo pubblicato «{t}» come evento nascosto. La password è {p}: condividila soltanto con chi vuoi invitare. Per togliere l’evento basta scriverci.',{t:titolo, p:pw});
/* Password e tasti per copiarla, dopo la pubblicazione e nella scheda dell'evento. */
function riquadroPassword(id, titolo, pw, testa, altro){
  return `<div class="red-riquadro nr-consegna" role="note"><b>${testa}</b>
    <p class="nr-password"><code>${esc(pw)}</code></p>
    <span class="meta">${tr('Si consegna all’organizzatore con il messaggio di conferma (allegato C, C.2), sul canale del consenso. Resta nella cassaforte di questo dispositivo fino alla fine dell’evento, poi si cancella da sola. Non va scritta in nessun registro.')}</span>
    <div class="tasti"><button class="tasto sec" data-az="nr-copia-pw" data-id="${esc(id)}">${NR.copiato==='pw|'+id ? tr('Password copiata') : tr('Copia la password')}</button><button class="tasto sec" data-az="nr-copia-msg" data-id="${esc(id)}">${NR.copiato==='msg|'+id ? tr('Messaggio copiato') : tr('Copia il messaggio di conferma')}</button>${altro||''}</div></div>`;
}
/* Dopo la pubblicazione di un evento nascosto, in cima alla schermata «Pubblicazione». */
const nrFattoHtml = () => !NR.fatto ? '' : riquadroPassword(NR.fatto.id, NR.fatto.titolo, NR.fatto.pw, tr('Evento nascosto pubblicato: «{t}». Ecco la password',{t:esc(NR.fatto.titolo)}),
  `<button class="tasto pri" data-az="nr-fatto-ok">${tr('Fatto')}</button>`);

/* La casella e il riquadro del modulo dell'evento. */
function casellaNascosto(f){
  if(f.id && !f.nascosto) return '';
  const on = !!f.nascosto;
  if(on && !f.pw) f.pw = MODULI.nascosti.genera(MODULI.paroleNascosti);
  const riquadro = !on ? '' : `<div class="red-riquadro nr-regole" role="note"><b>${tr('Evento nascosto')}</b>
      <span class="meta">${tr('Leggibile solo da chi ha la password (§ 2.3). Si usa per eventi socioculturali di dimensioni contenute, annunciati altrove dall’organizzatore, di cui si tiene riservato il luogo o un altro dettaglio. Mai per ritrovi privati, che restano Off-Grid, né per cortei, presidi o manifestazioni (§ 9.2).')}</span>
      <span class="meta">${tr('Se si svolge in luogo pubblico, valuta caso per caso se può essere una riunione in luogo pubblico e se custodirne il luogo farebbe di noi il suo canale riservato; annota la valutazione e le sue ragioni nelle note della voce del registro dei consensi.')}</span>
      <span class="meta">${tr('Prima di pubblicare serve il consenso dell’organizzatore (messaggio C.2), con il suo codice C qui sotto. La password si consegna dopo la pubblicazione, con il messaggio di conferma.')}</span>
      <span class="etich">${tr('Password generata dall’app')}</span><p class="nr-password"><code>${esc(f.pw)}</code></p>
      ${f.id ? `<span class="meta">${tr('Una correzione tiene la stessa password: chi ha già sbloccato l’evento vede la correzione.')}</span>` : `<button class="link" data-az="nr-altra">${tr('Generane un’altra')}</button>`}</div>`;
  return `${f.id ? '' : `<button class="riga-int" data-az="nr-nascosto" aria-pressed="${on}"><span class="casella" aria-hidden="true"></span><div><span class="t">${tr('Evento nascosto')}</span><span class="meta">${tr('Leggibile solo con la password: il contenuto si cifra su questo dispositivo.')}</span></div></button>`}${riquadro}`;
}

/* «Pubblica» per un evento nascosto: ev è già nel formato pubblico e controllato (pubblicazione.js). */
function pubblicaNascosto(f, ev){
  const N = MODULI.nascosti, nuovo = !f.id, g = f.g, prepScheda = f.prep, pw = N.forma(f.pw), titolo = ev.titolo;
  if(PB.lavoro) return;
  PB.lavoro = true; PB.errore = ''; ridisegnaPb();
  (async () => {
    const imp = await N.impronta(pw);
    /* la password non deve essere già usata da un altro evento nascosto (§ 2.3): lo sportello lo controlla comunque */
    if(nuovo){ const s = await SPORTELLO.chiedi({operazione:'stato'}); if(nrVoci(s).some(x => x.impronta===imp)) throw Object.assign(new Error('impronta'), {motivo:'impronta'}); }
    const {file} = await N.cifra(ev, pw, null, imp);
    /* la password entra nella cassaforte prima di partire: se lo sportello rifiuta, per un evento nuovo si toglie */
    if(nuovo) await CHIAVI.cassaforte.metti(ev.id, pw, FORMATO.fineMs(ev));
    const rp = await regPrepara([{ev, g, titolo:g.nomi==='si' && g.titoloReg.trim() ? g.titoloReg.trim() : titolo, canale:'singolo', correzione:!nuovo, nascosto:true}]);
    return {voce:{id:ev.id, impronta:imp, giorno:N.giornoUscita(ev), file}, rp, file};
  })().then(({voce, rp, file}) => { PB.lavoro = false;
    return scriviPb(conRegistro({operazione:'scrivi', nascosti:[voce]}, rp), r => {
      st.aform = null; st.ultimoId = ev.id; registra(nuovo ? 'pubblica' : 'correggi', {id:ev.id, s:ev.strato}); if(!nuovo) misureConta('corretti');
      NR.chiari.set(ev.id, {ev, pw, v:JSON.stringify(file)}); NR.fatto = nuovo ? {id:ev.id, titolo, pw} : null; NR.copiato = '';
      if(!nuovo) CHIAVI.cassaforte.metti(ev.id, pw, FORMATO.fineMs(ev)).catch(() => {});
      const codice = ((r.registro||{}).codici||{})[ev.id] || '';
      regConferma(rp, (r.registro||{}).codici).then(() => prepScheda ? togliPreparato(prepScheda) : null)
        .catch(() => { PB.errore = tr('L’evento è pubblicato e la riga {c} è allo sportello, ma non sono riuscito a salvarla nel registro di questo dispositivo.',{c:codice}); ridisegnaPb(); });
      return (nuovo ? tr('Evento nascosto pubblicato alle {o} (ora dello sportello).',{o:oraPb(r.quando)}) : tr('Correzione dell’evento nascosto pubblicata alle {o} (ora dello sportello).',{o:oraPb(r.quando)}))
        + (codice ? ' '+tr('Riga {c} nel registro delle fonti.',{c:codice}) : '');
    }).then(ok => { if(!ok && nuovo) CHIAVI.cassaforte.togli(ev.id).catch(() => {}); });
  }, e => {
    PB.lavoro = false; if(nuovo) CHIAVI.cassaforte.togli(ev.id).catch(() => {});
    if(st.aform!==f) return;
    f.errori = [e && e.motivo==='impronta' ? tr('Questa password è già usata da un altro evento nascosto: tocca «Generane un’altra» e riprova.')
      : e && e.motivo ? errorePb(e) : tr('Non sono riuscito a cifrare l’evento o a preparare la riga del registro delle fonti: non pubblico.')];
    disegnaFoglio(); mostraErroriPb();
  });
}

/* ---------- Tocchi ---------- */
function azioneNascosti(az, t){
  const f = st.aform, id = t && t.dataset ? t.dataset.id : '';
  const chiaro = id ? (NR.fatto && NR.fatto.id===id ? {ev:{titolo:NR.fatto.titolo}, pw:NR.fatto.pw} : NR.chiari.get(id)) : null;
  const copia = (k, testo) => copiaTesto(testo).then(ok => { NR.copiato = ok ? k+'|'+id : ''; ridisegnaPb(); });
  switch(az){
    case 'nr-nascosto': if(f && !f.id){ f.nascosto = f.nascosto ? '' : '1'; f.pw = ''; disegnaFoglio(); aggiornaSpia(); } return true;
    case 'nr-altra': if(f && !f.id && f.nascosto){ f.pw = MODULI.nascosti.genera(MODULI.paroleNascosti); disegnaFoglio(); } return true;
    case 'nr-copia-pw': if(chiaro) copia('pw', chiaro.pw); return true;
    case 'nr-copia-msg': if(chiaro) copia('msg', messaggioC2(chiaro.ev.titolo, chiaro.pw)); return true;
    case 'nr-fatto-ok': NR.fatto = null; NR.copiato = ''; disegnaFoglio(); return true;
  }
  return false;
}
