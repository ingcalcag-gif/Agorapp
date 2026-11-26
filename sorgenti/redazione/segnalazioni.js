/* ======================= Segnalazioni: lettura e righe dei registri (T-052) =======================
   Libro mastro, § 7.5, misura 3, regole 6-8; cap. 25 (registro delle segnalazioni); cap. 26 (registro delle richieste);
   § 18.5 (le persone nei registri con il codice P dell'anagrafica); § 3.13 (rimozione entro 48 ore). Documento:
   docs/segnalazioni.md.

   L'app della redazione chiede allo sportello delle segnalazioni, con il pacchetto firmato, le buste depositate dal
   modulo «Segnala» (sportelli/segnalazioni.js, porta firmata), le apre sul dispositivo con la parte segreta di cifratura
   (CHIAVI.segretoSegnalazione) e le mostra. Le segnalazioni aperte vivono soltanto nella pagina: sul dispositivo non si
   scrive nulla.

   Per ognuna prepara, da copiare e incollare nel file del registro tenuto a mano (decisioni del 26/11/2026, dubbio 7):
   - la riga del registro delle segnalazioni (cap. 25), con il codice S scritto dalla Redazione (la numerazione è una
     sola anche per le segnalazioni arrivate per posta, dalla casella o dagli avvisi del fornitore) e il codice P
     dell'anagrafica al posto della persona: i recapiti non entrano mai nella riga;
   - se chiede di togliere il nome di chi scrive («Di chi è il nome?»: «Il mio»), anche la riga del registro delle
     richieste (cap. 26), con la scadenza delle 48 ore dall'arrivo, e il passaggio a «Togli questo nome ovunque» con il
     codice R, che annota la richiesta nel registro delle richieste di rimozione delle Misure.
   Il recapito si copia a parte, per l'anagrafica e per la conferma dalla casella per gli utenti.
   «Presa in carico» (due tocchi) toglie la segnalazione dallo sportello, che non ne tiene traccia (dubbio 8), e conta
   la segnalazione nelle Misure, nel giorno dell'arrivo. */
const SG = {lista:null, lavoro:false, errore:'', msg:'', aperta:null, campi:{}, conferma:false, copiata:''};
const MOTIVI_REG = {dati:'Dati errati', annullato:'Annullato o rinviato', nome:'Nome o dato personale da togliere', illecito:'Contenuto ritenuto illecito', altro:'Altro'};
const CHI_SEGNALA = ['Utente', 'Organizzatore', 'Persona nominata', 'Fornitore', 'Altro'];
const CANALE_SPORTELLO = 'Modulo con lo sportello';
/* le colonne, nell'ordine del cap. 25 (foglio «Segnalazioni») tra le colonne comuni del § 18.4 */
const COL_SEGN = ['Codice', 'Data di registrazione', 'Funzione che annota', 'Data e ora di ricevimento', 'Canale', 'Chi segnala', 'Segnalante', 'Evento', 'Motivo', 'Descrizione',
  'Dichiarazione di buona fede', 'Conferma di ricevimento', 'Richiesta sui propri dati', 'Errore su data, ora o luogo', 'Verifica', 'Esito e data della decisione', 'Esito al segnalante',
  'Motivazione', 'Esclusione collegata', 'Riesame chiesto', 'Pericolo per la vita o la sicurezza', 'Giorni fino alla decisione',
  'Rif. libro mastro', 'Collegamenti', 'Stato', 'Contestazione in corso', 'Scadenza della conservazione', 'Da cancellare al riesame', 'Rettifiche', 'Note'];
/* le colonne del cap. 26 (foglio «Richieste»), con le colonne comuni */
const COL_RICH = ['Codice', 'Data di registrazione', 'Funzione che annota', 'Data e ora di ricevimento', 'Canale', 'Richiedente', 'Per conto di', 'Diritto esercitato', 'Dati o eventi interessati',
  'Verifica dell’identità', 'Scadenza delle 48 ore', 'Esecuzione', 'Da ripetere in un ripristino', 'Scadenza di un mese', 'Proroga', 'Data della risposta; nel termine', 'Esito',
  'Rif. libro mastro', 'Collegamenti', 'Stato', 'Contestazione in corso', 'Scadenza della conservazione', 'Da cancellare al riesame', 'Rettifiche', 'Note'];
fogliPb.push('rd-segn', 'rd-segn-una');

/* date come nei registri (§ 18.4): gg/mm/aaaa e, se c'è, l'ora */
const dataReg = (d, conOra) => { d = new Date(d); return isNaN(d) ? '' : pad2(d.getDate())+'/'+pad2(d.getMonth()+1)+'/'+d.getFullYear()+(conOra ? ' '+pad2(d.getHours())+':'+pad2(d.getMinutes()) : ''); };
const unMesePiu = iso => { const d = new Date(iso); d.setMonth(d.getMonth()+1); return d; };
/* una cella che si incolla: niente tabulazioni né a capo, che spezzerebbero la riga */
const cellaReg = x => String(x==null ? '' : x).replace(/[\t\r\n]+/g, ' ').trim();
const nomeMio = x => x && x.s && x.s.motivo==='nome' && x.s.chi==='mio';
const sgUna = () => (SG.lista || []).find(x => x.nome===SG.aperta) || null;
const campiSg = x => SG.campi[x.nome] || (SG.campi[x.nome] = {s:'', p:'', chiSegnala:nomeMio(x) ? 'Persona nominata' : 'Utente', desc:x.s ? x.s.descrizione : '', r:''});

/* ---------- Lo sportello: la porta firmata ---------- */
async function chiediSg(contenuto){
  const s = await CHIAVI.stato(); if(!s.ci_sono) throw Object.assign(new Error('chiavi'), {motivo:'chiavi'});
  const p = await MODULI.pacchetto.forma(contenuto, {firma:CHIAVI.firma, dispositivo:{nome:s.dispositivo, impronta:s.firma.impronta}});
  const r = await chiediSegnalazioni(JSON.stringify(p));
  if(r.stato!==200 || !r.corpo || r.corpo.esito!=='fatto') throw Object.assign(new Error('sportello'), {motivo:(r.corpo && r.corpo.motivo) || 'guasto'});
  return r.corpo;
}
const sgDisponibile = () => !!(segnVero() || sportelloSegnProva());
async function caricaSg(){
  if(SG.lavoro) return;
  SG.lavoro = true; SG.errore = ''; disegnaFoglio();
  try{
    const r = await chiediSg({operazione:'segnalazioni'}), lista = [];
    for(const x of r.segnalazioni || []){
      let s = null; try{ s = await MODULI.segnalazione.apri(x.busta, CHIAVI.segretoSegnalazione); }catch(e){ s = null; }
      lista.push({nome:x.nome, arrivo:x.arrivo, s});
    }
    SG.lista = lista;
  }catch(e){
    SG.errore = e.motivo==='chiavi' ? tr('Servono le chiavi di questo dispositivo: crea le chiavi o riprendile dalla copia di riserva (Strumenti della redazione → Chiavi).')
      : e.motivo==='sconosciuto' ? tr('Lo sportello non conosce ancora questo dispositivo: consegna le chiavi (Pubblicazione → «Consegna le chiavi allo sportello di prova»).')
      : e.motivo==='rete' ? tr('Lo sportello non risponde: controlla la connessione e riprova.') : tr('Lo sportello non ha consegnato le segnalazioni ({m}).',{m:e.motivo||'guasto'});
  }
  SG.lavoro = false; if(['rd-segn', 'rd-segn-una'].includes(st.foglio)) disegnaFoglio();
}
async function presaSg(x){
  if(SG.lavoro) return;
  SG.lavoro = true; SG.errore = ''; disegnaFoglio();
  try{
    await chiediSg({operazione:'presa', nomi:[x.nome]});
    const m = mz(), g = ymd(new Date(x.arrivo)); m.segnalazioni[g] = (m.segnalazioni[g]||0)+1; mzSalva();   // le segnalazioni nelle Misure, nel giorno dell'arrivo
    SG.lista = SG.lista.filter(y => y!==x); delete SG.campi[x.nome]; SG.aperta = null; SG.conferma = false;
    SG.msg = tr('Segnalazione presa in carico e tolta dallo sportello. Contata nelle Misure.');
    SG.lavoro = false; apri('rd-segn'); return;
  }catch(e){ SG.errore = tr('Lo sportello non ha tolto la segnalazione ({m}): riprova.',{m:e.motivo||'guasto'}); }
  SG.lavoro = false; disegnaFoglio();
}

/* ---------- Le righe dei registri ---------- */
function rigaSegnalazione(x){
  const s = x.s, c = campiSg(x), mio = nomeMio(x);
  const v = {'Codice':c.s, 'Data di registrazione':dataReg(new Date()), 'Funzione che annota':'Relazioni con gli utenti', 'Data e ora di ricevimento':dataReg(x.arrivo, true), 'Canale':CANALE_SPORTELLO,
    'Chi segnala':c.chiSegnala, 'Segnalante':c.p, 'Evento':s.evento.id, 'Motivo':MOTIVI_REG[s.motivo], 'Descrizione':c.desc, 'Dichiarazione di buona fede':s.motivo==='illecito' ? (s.buonaFede ? 'Sì' : 'No') : '',
    'Richiesta sui propri dati':mio ? c.r : '', 'Rif. libro mastro':'§ 7.5, misura 3', 'Collegamenti':mio ? c.r : '', 'Stato':'Aperta', 'Contestazione in corso':'No'};
  return COL_SEGN.map(k => cellaReg(v[k])).join('\t');
}
function rigaRichiesta(x){
  const c = campiSg(x);
  const v = {'Codice':c.r, 'Data di registrazione':dataReg(new Date()), 'Funzione che annota':'Referente privacy', 'Data e ora di ricevimento':dataReg(x.arrivo, true), 'Canale':CANALE_SPORTELLO,
    'Richiedente':c.p, 'Per conto di':'Sé stesso', 'Diritto esercitato':'Cancellazione (art. 17)', 'Dati o eventi interessati':x.s.evento.id, 'Scadenza delle 48 ore':dataReg(scadenzaTn(x.arrivo), true),
    'Scadenza di un mese':dataReg(unMesePiu(x.arrivo)), 'Rif. libro mastro':'§ 3.13; § 7.5, misura 3', 'Collegamenti':[c.s, c.p].filter(Boolean).join(' '), 'Stato':'Aperta', 'Contestazione in corso':'No'};
  return COL_RICH.map(k => cellaReg(v[k])).join('\t');
}

/* ---------- Le schermate ---------- */
function fSg(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Segnalazioni')}</h2><p class="meta">${tr('Arrivate con il modulo «Segnala» della scheda degli eventi')}</p></div>${chiudiBtn()}</div>`;
  if(!sgDisponibile()) return foglio('forte alto', testa, `<p class="meta">${tr('Lo sportello delle segnalazioni non è ancora allacciato: per ora le segnalazioni arrivano per posta alla casella per gli utenti.')}</p>`);
  const L = SG.lista;
  const riga = x => `<button class="riga-int" data-az="sg-apri" data-n="${esc(x.nome)}"><div><span class="t">${x.s ? esc(x.s.evento.titolo || x.s.evento.id) : tr('Segnalazione che non si apre')}</span>
    <span class="meta">${esc(quandoPb(x.arrivo))}${x.s ? ' · '+esc(MOTIVI_REG[x.s.motivo]) : ''}${nomeMio(x) ? ' · <strong>'+esc(tr('il suo nome: entro il {q}',{q:quandoPb(scadenzaTn(x.arrivo).toISOString())}))+'</strong>' : ''}</span></div>${freccia}</button>`;
  const corpo = `${SG.msg ? `<p class="meta" role="status" style="color:var(--testo)">${esc(SG.msg)}</p>` : ''}${SG.errore ? `<p class="err" role="alert">${esc(SG.errore)}</p>` : ''}
    ${SG.lavoro ? `<p class="caricamento">${tr('Chiedo le segnalazioni allo sportello…')}</p>` : ''}
    ${L ? (L.length ? `<div class="menu-lista">${L.map(riga).join('')}</div>` : `<p class="meta">${tr('Nessuna segnalazione in attesa.')}</p>`) : ''}
    <div class="tasti"><button class="tasto sec" data-az="sg-carica" ${SG.lavoro ? 'disabled' : ''}>${tr('Chiedi di nuovo allo sportello')}</button></div>
    <p class="meta">${tr('Le segnalazioni si aprono su questo dispositivo e restano soltanto in questa pagina. Il recapito di chi scrive va nell’anagrafica (§ 18.5), mai nei registri.')}</p>`;
  return foglio('forte alto', testa, corpo);
}
function fSgUna(){
  const x = sgUna(); if(!x){ st.foglio = 'rd-segn'; return fSg(); }
  const testa = `<div class="riga-titolo"><div><h2>${tr('Segnalazione')}</h2><p class="meta">${tr('Arrivata il {q}',{q:esc(quandoPb(x.arrivo))})}</p></div>${chiudiBtn()}</div>`;
  const indietro = `<button class="link" data-az="sg-indietro">${frecciaSx} ${tr('Tutte le segnalazioni')}</button>`;
  if(!x.s) return foglio('forte alto', testa, `${indietro}<p class="err">${tr('Questa segnalazione non si apre con le chiavi di questo dispositivo: è rovinata o è stata chiusa per altre chiavi.')}</p>
    ${presaHtml()}`);
  const s = x.s, c = campiSg(x), mio = nomeMio(x);
  const dato = (t, v) => v ? `<div class="stack-s"><span class="etich">${t}</span><span style="white-space:pre-wrap;color:var(--testo)">${esc(v)}</span></div>` : '';
  const campo = (id, k, t, ph, aiuto) => `<div class="stack-s"><label class="etich" for="sg-${id}">${t}</label><div class="campo"><input id="sg-${id}" data-sg="${k}" maxlength="12" autocomplete="off" value="${esc(c[k])}" placeholder="${esc(ph)}"></div>${aiuto ? `<span class="meta">${aiuto}</span>` : ''}</div>`;
  const recapito = [s.nome, s.email].filter(Boolean).join(' · ');
  const corpo = `${indietro}${SG.errore ? `<p class="err" role="alert">${esc(SG.errore)}</p>` : ''}
    ${mio ? `<div class="red-riquadro" role="note"><strong>${tr('Chiede di togliere il suo nome: entro il {q}',{q:esc(quandoPb(scadenzaTn(x.arrivo).toISOString()))})}</strong>
      <span class="meta">${tr('È anche una richiesta sui propri dati: una riga anche nel registro delle richieste (cap. 26) e la rimozione con «Togli questo nome ovunque» (§ 3.13).')}</span></div>` : ''}
    ${dato(tr('Evento'), (s.evento.titolo ? s.evento.titolo+'\n' : '')+s.evento.id)}
    ${dato(tr('Motivo'), MOTIVI_REG[s.motivo])}
    ${s.motivo==='nome' ? dato(tr('Di chi è il nome'), s.chi==='mio' ? tr('Il suo') : tr('Di un’altra persona')) : ''}
    ${s.motivo==='illecito' ? dato(tr('Dichiarazione di buona fede'), s.buonaFede ? tr('Sì') : tr('No')) : ''}
    ${dato(tr('Descrizione'), s.descrizione || '—')}
    ${recapito ? `<div class="stack-s"><span class="etich">${tr('Recapito')}</span><span style="color:var(--testo)">${esc(recapito)}</span>
      <span class="meta">${tr('Per l’anagrafica (codice P) e per la conferma dalla casella per gli utenti: non entra nei registri.')}</span>
      <div class="tasti"><button class="tasto sec" data-az="sg-copia" data-che="recapito">${SG.copiata==='recapito' ? tr('Copiato') : tr('Copia il recapito')}</button></div></div>` : `<p class="meta">${tr('Nessun recapito: niente conferma né esito da mandare.')}</p>`}
    <p class="etich">${tr('Per il registro')}</p>
    <div class="due">${campo('s', 's', tr('Codice S'), 'S-0001', '')}${campo('p', 'p', tr('Codice P'), 'P-0001', recapito ? '' : tr('Solo se ha lasciato un recapito'))}</div>
    <div class="stack-s"><label class="etich" for="sg-chi">${tr('Chi segnala')}</label><div class="campo"><select id="sg-chi" data-sg="chiSegnala">${CHI_SEGNALA.map(v => `<option ${c.chiSegnala===v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></div></div>
    <div class="stack-s"><label class="etich" for="sg-desc">${tr('Descrizione per il registro')}</label><div class="campo"><textarea id="sg-desc" data-sg="desc" maxlength="2000">${esc(c.desc)}</textarea></div>
      <span class="meta">${tr('Una sintesi, senza dati di altre persone che non servono (cap. 25).')}</span></div>
    ${mio ? campo('r', 'r', tr('Codice R'), CODICE_RICHIESTA, tr('Il codice della voce nel registro delle richieste (cap. 26).')) : ''}
    <div class="tasti"><button class="tasto pri" data-az="sg-copia" data-che="segnalazione">${SG.copiata==='segnalazione' ? tr('Copiata') : tr('Copia la riga del registro delle segnalazioni')}</button></div>
    ${mio ? `<div class="tasti"><button class="tasto sec" data-az="sg-copia" data-che="richiesta">${SG.copiata==='richiesta' ? tr('Copiata') : tr('Copia la riga del registro delle richieste')}</button></div>
      <div class="tasti"><button class="tasto sec" data-az="sg-togli">${tr('Togli questo nome ovunque')}</button></div>` : ''}
    <details class="meta"><summary>${tr('Le colonne delle righe')}</summary><p>${esc(COL_SEGN.join(' · '))}</p>${mio ? `<p>${esc(COL_RICH.join(' · '))}</p>` : ''}</details>
    ${presaHtml()}`;
  return foglio('forte alto', testa, corpo);
}
const presaHtml = () => `<div class="tasti"><button class="tasto pericolo pieno" data-az="sg-presa" ${SG.lavoro ? 'disabled' : ''}>${SG.conferma ? tr('Tocca ancora: la segnalazione esce dallo sportello') : tr('Presa in carico')}</button></div>
  <p class="meta">${tr('Prima copia la riga e il recapito: dopo, la segnalazione non si può più leggere.')}</p>`;
Object.assign(FOGLI_RED, {'rd-segn':fSg, 'rd-segn-una':fSgUna});

/* ---------- Le interazioni ---------- */
function azioneSg(az, t){
  switch(az){
    case 'segnalazioni': Object.assign(SG, {aperta:null, msg:'', errore:'', conferma:false, copiata:''}); apri('rd-segn'); if(sgDisponibile()) caricaSg(); return true;
    case 'sg-carica': SG.msg = ''; caricaSg(); return true;
    case 'sg-apri': SG.aperta = t.dataset.n; SG.conferma = false; SG.copiata = ''; SG.errore = ''; SG.msg = ''; apri('rd-segn-una'); return true;
    case 'sg-indietro': SG.aperta = null; SG.conferma = false; apri('rd-segn'); return true;
    case 'sg-copia': {
      const x = sgUna(); if(!x || !x.s) return true;
      const che = t.dataset.che, testo = che==='recapito' ? [x.s.nome, x.s.email].filter(Boolean).join(' <')+(x.s.nome && x.s.email ? '>' : '') : che==='richiesta' ? rigaRichiesta(x) : rigaSegnalazione(x);
      copiaTesto(testo).then(ok => { SG.copiata = ok ? che : ''; if(!ok) SG.errore = tr('Copia non riuscita: riprova.'); if(st.foglio==='rd-segn-una') disegnaFoglio(); });
      return true; }
    case 'sg-togli': {
      const x = sgUna(); if(!x || !x.s) return true;
      const c = campiSg(x); apriTn('archivio');
      TN.rich = 'nuova'; TN.nuova = {ric:dtLocal(new Date(x.arrivo)), r:c.r};
      TN.daSegn = tr('Dalla segnalazione {s} sull’evento «{t}» ({id})',{s:c.s || tr('senza codice S'), t:x.s.evento.titolo, id:x.s.evento.id});
      disegnaFoglio(); return true; }
    case 'sg-presa': {
      const x = sgUna(); if(!x) return true;
      if(!SG.conferma){ SG.conferma = true; disegnaFoglio(); return true; }
      presaSg(x); return true; }
  }
  return false;
}
function inputSg(el){
  const k = el.dataset.sg; if(!k) return false;
  const x = sgUna(); if(!x) return true;
  campiSg(x)[k] = el.value; SG.copiata = '';
  return true;
}
