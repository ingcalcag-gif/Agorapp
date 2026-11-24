/* ======================= Pubblicazione: le schermate (T-038, T-039, T-040) =======================
   «Pubblicazione» negli strumenti della redazione: l'elenco degli eventi pubblicati e sospesi, come li tiene lo
   sportello; il modulo dell'evento con i campi del formato pubblico (docs/formato-eventi.md), che serve a pubblicare un
   evento nuovo e a correggerne uno; sospendere, riattivare e ritirare prima della fine con il motivo; lo storico delle
   pubblicazioni con il confronto tra due copie e il ripristino.

   Ogni cosa che cambia l'archivio parte come pacchetto firmato (sportello-prova.js): qui non si scrive nulla
   nell'archivio. Dal blocco 10 (T-041) il modulo dell'evento è la scheda di pubblicazione: le dieci domande, le
   colonne di giudizio del registro delle fonti, i controlli prima di pubblicare e gli eventi preparati stanno in
   scheda-pubblicazione.js; le fonti e le righe del registro in registro-fonti.js. Senza le colonne di giudizio
   «Pubblica» resta spento (cap. 22, regola 1).

   Testi come testo (T-024): titoli, luoghi, nomi dei dispositivi e risposte dello sportello vengono da fuori e
   entrano nella pagina solo con esc(). */
const PB = {stato:null, prova:null, carico:false, lavoro:false, errore:'', msg:'', sel:null, ritiro:null, svuota:false,
  copie:null, scelte:[], confronto:null, ripr:null, fonte:null, togliPrep:null};
const MOTIVI_RITIRO = {annullato:'Annullato', errore:'Errore non verificabile in tempo', esclusione:'Esclusione (X)', richiesta:'Richiesta (R)', segnalazione:'Segnalazione (S)', ordine:'Ordine di un’autorità (A)'};
const oraPb = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleTimeString(dloc(), {hour:'2-digit', minute:'2-digit'}); };
const quandoPb = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(dloc(), {day:'numeric', month:'long', year:'numeric'})+', '+oraPb(iso); };
const giornoOra = v => { const g = String(v||'').split('T'); return g[0] ? dIso(g[0]).toLocaleDateString(dloc(), {weekday:'short', day:'numeric', month:'short'})+' · '+(g[1]||'') : ''; };
const quandoEv = ev => giornoOra(ev.inizio);
function errorePb(e){
  const c = (e && e.corpo) || {};
  const T = {
    chiavi:() => tr('Per pubblicare servono le chiavi della Redazione: Strumenti della redazione → Chiavi.'),
    sconosciuto:() => SPORTELLO.diProva() ? tr('Lo sportello di prova non conosce ancora questo dispositivo: tocca «Consegna le chiavi allo sportello di prova».') : tr('Lo sportello non conosce questo dispositivo: vanno consegnate le sue chiavi pubbliche.'),
    revocata:() => tr('La firma di questo dispositivo è revocata: lo sportello non la accetta più.'),
    firma:() => tr('Lo sportello ha rifiutato la firma.'),
    fermo:() => tr('Troppe firme sbagliate: lo sportello non risponde a questo dispositivo fino alle {o}.',{o:oraPb(c.fino)}),
    tempo:() => tr('Lo sportello ha rifiutato il pacchetto perché l’ora non corrisponde: controlla data e ora di questo dispositivo.'),
    ripetuto:() => tr('Lo sportello aveva già ricevuto questo pacchetto: riprova.'),
    evento:() => tr('Lo sportello ha rifiutato un evento: {d}',{d:(c.dettagli||[]).map(x => (x.errori||[]).join('; ')).join(' · ')}),
    passato:() => tr('L’evento è già finito da più di tre ore: non si pubblica.'),
    manca:() => tr('L’evento non c’è più nell’archivio: aggiorna l’elenco.'),
    copia:() => tr('Lo sportello non trova questa copia.'),
    rete:() => tr('Lo sportello non risponde: controlla la connessione e riprova.'),
    assente:() => tr('Su questo indirizzo non c’è uno sportello a cui consegnare i pacchetti.')
  };
  return (T[e && e.motivo] || (() => tr('Non è riuscito: riprova.')))();
}
const fogliPb = ['pubblica', 'pb-evento', 'pb-storico', 'pb-copia', 'pb-fonti', 'pb-fonte', 'pb-importa', 'pb-registro', 'pb-np', 'pb-np-riga', 'pb-regimporta', 'pb-confronto', 'pb-calendario', 'aform'];
const ridisegnaPb = () => { if(!fogliPb.includes(st.foglio)) return;
  /* il modulo dell'evento non si ridisegna mentre si scrive in un campo: si perderebbe il punto in cui si scrive */
  const a = document.activeElement; if(st.foglio==='aform' && a && a.closest && a.closest('#foglio-slot') && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
  disegnaFoglio(); };
function aggiornaPb(){
  PB.carico = true; ridisegnaPb();
  const prova = SPORTELLO.diProva() ? SPORTELLO.prova.stato().then(s => { PB.prova = s; }, () => { PB.prova = null; }) : Promise.resolve();
  return prova.then(() => SPORTELLO.chiedi({operazione:'stato'})).then(s => { PB.stato = s; PB.errore = ''; }, e => { PB.stato = null; PB.errore = errorePb(e); })
    .then(() => { PB.carico = false; ridisegnaPb(); });
}
/* manda un pacchetto che scrive; poi rilegge l'elenco e torna alla schermata «Pubblicazione» */
function scriviPb(contenuto, fatto, torna){
  if(PB.lavoro) return Promise.resolve(false);
  PB.lavoro = true; PB.errore = ''; PB.msg = ''; ridisegnaPb();
  return SPORTELLO.chiedi(contenuto).then(r => { PB.lavoro = false; PB.msg = fatto(r); PB.sel = null; PB.ritiro = null; st.foglio = torna || 'pubblica'; return aggiornaPb().then(() => true); },
    e => { PB.lavoro = false; PB.errore = errorePb(e); ridisegnaPb(); return false; });
}
const evPb = id => { const s = PB.stato; if(!s) return null; const e = s.eventi.find(x => x.id===id); if(e) return {ev:e, sospeso:false}; const z = s.sospesi.find(x => x.id===id); return z ? {ev:z, sospeso:true} : null; };
const rigaEvPb = (ev, attr, nota) => `<button class="menu-r" ${attr}="${esc(ev.id)}">${icoCal()}<div><span class="t">${esc(ev.titolo)}</span><span class="meta">${esc(quandoEv(ev))} · ${esc(ev.luogo)}${nota?' · '+esc(nota):''}</span></div>${freccia}</button>`;
const statoPb = () => `${PB.errore?`<p class="err" role="alert">${esc(PB.errore)}</p>`:''}${PB.msg?`<p class="meta" role="status" style="color:var(--testo)">${esc(PB.msg)}</p>`:''}${PB.lavoro?`<p class="caricamento">${tr('Firmo e consegno allo sportello…')}</p>`:''}`;

function fPubblica(){
  const s = PB.stato, P = PB.prova, diProva = SPORTELLO.diProva();
  const testa = `<div class="riga-titolo"><div><h2>${tr('Pubblicazione')}</h2><p class="meta">${diProva ? tr('Sportello di prova: archivio finto su questo dispositivo') : tr('Pacchetti firmati allo sportello')}</p></div>${chiudiBtn('admin')}</div>`;
  const prova = !diProva ? '' : `<div class="red-riquadro" role="note"><b>${tr('Sportello di prova')}</b>
      <span class="meta">${tr('Fa le stesse cose dello sportello vero, ma dentro questo browser: l’app pubblica di prova aperta su questo dispositivo legge il suo archivio (dopo una pubblicazione, ricaricala). Solo eventi inventati.')}</span>
      <span class="meta">${!P ? tr('Un attimo…') : P.revocato ? tr('La firma di questo dispositivo è revocata.') : P.ammesso ? tr('Questo dispositivo è tra quelli che lo sportello di prova accetta ({n}).',{n:P.ammessi}) : tr('Lo sportello di prova non conosce ancora questo dispositivo.')}</span>
      ${P && !P.ammesso && !P.revocato ? `<div class="tasti"><button class="tasto pri" data-az="pb-consegna">${tr('Consegna le chiavi allo sportello di prova')}</button></div>` : ''}
      <button class="link" style="min-height:32px" data-az="pb-venti">${tr('Porta qui gli eventi inventati dell’archivio di prova')}</button>
      <button class="link" style="min-height:32px" data-az="pb-falsa">${tr('Prova a consegnare un pacchetto con la firma sbagliata')}</button>
      <button class="link" style="min-height:32px" data-az="pb-svuota">${PB.svuota ? tr('Tocca ancora per svuotare: l’app pubblica di prova torna all’archivio del repository') : tr('Svuota lo sportello di prova')}</button></div>`;
  const elenco = !s ? (PB.carico ? `<p class="caricamento">${tr('Chiedo l’elenco allo sportello…')}</p>` : '')
    : `<p class="etich">${tr('Pubblicati')} · ${s.eventi.length}</p>
      ${s.eventi.length ? `<div class="menu-lista">${s.eventi.slice().sort((a,b) => a.inizio<b.inizio?-1:1).map(ev => rigaEvPb(ev, 'data-pbev')).join('')}</div>` : `<p class="meta">${tr('Nessun evento pubblicato.')}</p>`}
      ${s.sospesi.length ? `<p class="etich">${tr('Sospesi')} · ${s.sospesi.length}</p><div class="menu-lista">${s.sospesi.map(ev => rigaEvPb(ev, 'data-pbev', tr('fuori dalla mappa'))).join('')}</div>` : ''}
      <p class="meta">${s.aggiornato ? tr('Ultima pubblicazione: {q}.',{q:esc(quandoPb(s.aggiornato))}) : tr('Non è ancora stato pubblicato nulla.')} ${tr('Gli eventi finiti da più di tre ore escono da soli.')}</p>`;
  const corpo = `${prova}${statoPb()}
    <div class="tasti"><button class="tasto pri" data-az="pb-nuovo">${tr('Nuovo evento')}</button><button class="tasto sec" data-az="ix-file">${tr('Importa da Excel')}</button><button class="tasto sec" data-az="pb-registro">${tr('Registro delle fonti')}</button><button class="tasto sec" data-az="pb-storico">${tr('Storico delle pubblicazioni')}</button></div>
    ${preparatiHtml()}
    ${elenco}
    <button class="link" data-az="pb-aggiorna">${tr('Aggiorna l’elenco')}</button>`;
  return foglio('forte alto', testa, corpo);
}

function fPbEvento(){
  const x = evPb(PB.sel);
  const testa = `<div class="riga-titolo"><div><h2>${x ? esc(x.ev.titolo) : tr('Evento')}</h2><p class="meta">${x ? (x.sospeso ? tr('Sospeso: fuori dalla mappa finché non si riattiva') : tr('Pubblicato')) : ''}</p></div>${chiudiBtn('pubblica')}</div>`;
  if(!x) return foglio('forte', testa, `<p class="meta">${tr('L’evento non c’è più nell’archivio: aggiorna l’elenco.')}</p>`);
  const ev = x.ev, R = PB.ritiro;
  const ritiro = !R ? '' : `<div class="red-riquadro"><b>${tr('Ritiro prima della fine')}</b>
      <label class="etich" for="pb-motivo">${tr('Motivo')}</label><div class="campo"><select id="pb-motivo" data-pbritiro="motivo"><option value="">${tr('— Scegli —')}</option>${Object.keys(MOTIVI_RITIRO).map(k => `<option value="${k}" ${R.motivo===k?'selected':''}>${esc(tr(MOTIVI_RITIRO[k]))}</option>`).join('')}</select></div>
      <label class="etich" for="pb-rif">${tr('Voce del registro')} <span class="fac">${tr('facoltativo')}</span></label><div class="campo"><input id="pb-rif" data-pbritiro="riferimento" maxlength="40" value="${esc(R.riferimento)}" autocomplete="off"></div>
      <span class="meta">${tr('Il motivo resta nella copia datata dello storico e passerà al registro delle fonti.')}</span>
      <div class="tasti"><button class="tasto sec" data-az="pb-ritira-no">${tr('Annulla')}</button><button class="tasto pericolo" data-az="pb-ritira-ok">${tr('Ritira l’evento')}</button></div></div>`;
  const corpo = `<p class="meta">${esc(quandoEv(ev))}${ev.fine?' → '+esc(giornoOra(ev.fine)):''}<br>${esc(ev.luogo)} · ${esc(ev.indirizzo)}<br>${tr('Fonte')}: ${esc(ev.fonte && ev.fonte.testo)}</p>
    <p class="meta">${tr('Identificativo')}: <code class="red-id">${esc(ev.id)}</code></p>
    ${statoPb()}
    <div class="tasti"><button class="tasto sec" data-az="pb-correggi">${tr('Correggi')}</button>${x.sospeso ? `<button class="tasto pri" data-az="pb-riattiva">${tr('Riattiva')}</button>` : `<button class="tasto sec" data-az="pb-sospendi">${tr('Sospendi')}</button>`}</div>
    <p class="meta">${x.sospeso ? tr('Riattivato, torna sulla mappa con una nuova pubblicazione firmata.') : tr('Sospeso, esce dalla mappa finché una verifica è in corso; resta nell’elenco riservato dello sportello e si può riattivare.')}</p>
    ${R ? ritiro : `<button class="tasto pericolo pieno" data-az="pb-ritira">${tr('Ritira prima della fine')}</button>`}`;
  return foglio('forte alto', testa, corpo);
}

/* ---------- Il modulo dell'evento: i campi del formato pubblico ---------- */
function apriEventoForm(ev, per){
  st.aform = ev ? {per, id:ev.id, titolo:ev.titolo||'', strato:ev.strato||'', sub:ev.sottostrato||'', tema:ev.tema||'', inizio:ev.inizio||'', fine:ev.fine||(ev.durata && FORMATO.fineMs(ev)!=null ? dtLocal(new Date(FORMATO.fineMs(ev))) : ''),
      luogo:ev.luogo||'', indirizzo:ev.indirizzo||'', addrFull:ev.indirizzo||'', pos:{lat:ev.lat, lng:ev.lng}, precision:ev.collocazione==='a_mano'?'map':'exact', hn:'', comeArrivare:ev.descrizione_luogo||'', organizzatore:ev.organizzatore||'',
      desc:ev.descrizione||'', prezzo:ev.prezzo||'', fonte:(ev.fonte||{}).testo||'', fonteLink:(ev.fonte||{}).collegamento||'', err:{}, errori:[]}
    : {per, id:null, titolo:'', strato:'', sub:'', tema:'', inizio:'', fine:'', luogo:'', indirizzo:'', addrFull:'', pos:null, precision:'', hn:'', comeArrivare:'', organizzatore:'', desc:'', prezzo:'', fonte:'', fonteLink:'', err:{}, errori:[]};
  /* le colonne di giudizio: vuote per un evento nuovo; per una correzione, quelle della riga già scritta nel registro
     di questo dispositivo, se c'è */
  const f = st.aform; f.g = giudizioNuovo(); f.prep = null;
  st.sel = null; st.form = null; apri('aform');
  if(per!=='ripristino') regApri().then(() => { if(st.aform!==f) return; const r = f.id ? regRiga(f.id) : null; if(r) f.g = giudizioInForma(r.g); if(st.foglio==='aform') disegnaFoglio(); });
}
const dtLocal = d => ymd(d)+'T'+hm(d);
function fEventoForm(){
  const f = st.aform, E = f.err, l = S[f.strato], ripr = f.per==='ripristino', imp = f.per==='importa';
  const campo = (id, lab, html, err, fac) => `<div class="stack-s"><label class="etich" for="${id}">${lab}${fac?` <span class="fac">${fac}</span>`:''}</label>${html}${err?`<span class="err">${err}</span>`:''}</div>`;
  const riga = (id, c, lab, max, segna, fac, tipo) => campo(id, lab, `<div class="campo${E[c]?' errore':''}"><input id="${id}" data-acampo="${c}" maxlength="${max}" value="${esc(f[c])}" placeholder="${esc(segna||'')}" autocomplete="off"${tipo?` type="${tipo}" inputmode="${tipo}"`:''}></div>`, '', fac);
  const fac = tr('facoltativo');
  const testa = `<div class="riga-titolo"><div><h2>${imp ? tr('Riga {r} del file',{r:f.imp}) : f.id ? tr('Correggi l’evento') : tr('Nuovo evento')}</h2><p class="meta">${ripr ? tr('Nella copia da ripristinare: si pubblica con la copia') : imp ? tr('Dall’importazione: si pubblica con le altre righe segnate') : tr('Redazione · si pubblica con la firma di questo dispositivo')}</p></div>${chiudiBtn(ripr ? 'pb-copia' : imp ? 'ix-torna' : 'pubblica')}</div>`;
  const corpo = `
    ${riga('a-titolo', 'titolo', tr('Titolo'), 100, tr('Nome dell’evento'))}
    <div class="due">${campo('a-strato', tr('Strato'), `<div class="campo${E.strato?' errore':''}"><select id="a-strato" data-acampo="strato"><option value="">${tr('— Scegli —')}</option>${LAYERS.map(x => `<option value="${x.id}" ${f.strato===x.id?'selected':''}>${esc(tr(x.label))}</option>`).join('')}</select></div>`)}
      ${campo('a-sub', tr('Sottostrato'), `<div class="campo${l?'':' spento'}"><select id="a-sub" data-acampo="sub" ${l?'':'disabled'}><option value="">${tr('— Nessuno —')}</option>${l?l.sub.map(s => `<option value="${s.id}" ${f.sub===s.id?'selected':''}>${esc(tr(s.label))}</option>`).join(''):''}</select></div>`, '', fac)}</div>
    ${campo('a-tema', tr('Tema'), `<div class="campo"><select id="a-tema" data-acampo="tema"><option value="">${tr('— Nessuno —')}</option>${TEMI_VOC.map(t => `<option value="${esc(t)}" ${f.tema===t?'selected':''}>${esc(tr(t))}</option>`).join('')}</select></div>`, '', fac)}
    <div class="due">${campo('a-inizio', tr('Inizio'), `<div class="campo${E.inizio?' errore':''}"><input id="a-inizio" type="datetime-local" data-acampo="inizio" value="${esc(f.inizio)}"></div>`)}
      ${campo('a-fine', tr('Fine'), `<div class="campo${E.fine?' errore':''}"><input id="a-fine" type="datetime-local" data-acampo="fine" value="${esc(f.fine)}"></div>`, '', fac)}</div>
    <p class="meta">${tr('Ora italiana, come la legge chi va all’evento.')}</p>
    ${riga('a-luogo', 'luogo', tr('Luogo'), 120, tr('Nome del luogo, es. Sala del quartiere'))}
    ${campo('a-indirizzo', tr('Indirizzo'), `<div class="campo${E.indirizzo?' errore':''}">${icoLuogo}<input id="a-indirizzo" data-acampo="indirizzo" maxlength="200" value="${esc(f.indirizzo)}" placeholder="${esc(tr('Via e numero civico, città'))}" autocomplete="off"></div><div id="a-sugg"></div><div id="a-punto">${boxPunto(f)}</div><button class="link" data-az="scegli-mappa-a">${tr('Scegli sulla mappa')}</button>`,
      E.indirizzo===2 ? tr('Indirizzo non trovato: correggilo o scegli il punto sulla mappa') : E.indirizzo ? tr('Scrivi l’indirizzo o scegli il punto sulla mappa') : '')}
    ${campo('a-come', tr('Come arrivare'), `<div class="campo${E.comeArrivare?' errore':''}"><textarea id="a-come" data-acampo="comeArrivare" maxlength="300" placeholder="${esc(tr('Come si raggiunge il luogo, a parole'))}">${esc(f.comeArrivare)}</textarea></div>`, '', fac)}
    ${riga('a-org', 'organizzatore', tr('Organizza'), 120, '', fac)}
    ${campo('a-desc', tr('Descrizione'), `<div class="campo${E.desc?' errore':''}"><textarea id="a-desc" data-acampo="desc" maxlength="2000" placeholder="${esc(tr('Descrivi l’evento…'))}">${esc(f.desc)}</textarea></div>`)}
    ${riga('a-prezzo', 'prezzo', tr('Prezzo indicato dalla fonte'), 80, tr('Gratuito / 10 €'), fac)}
    ${riga('a-fonte', 'fonte', tr('Fonte'), 160, tr('Da dove viene l’informazione'))}
    ${riga('a-fonte-link', 'fonteLink', tr('Collegamento alla pagina dell’evento'), 500, 'https://', fac, 'url')}
    ${ripr ? '' : schedaGiudizio(f)}
    ${f.errori.length ? `<div class="red-riquadro pb-errori" role="alert"><b>${f.errori.length===1 ? tr('Prima di pubblicare manca una cosa:') : tr('Prima di pubblicare mancano {n} cose:',{n:f.errori.length})}</b>${f.errori.map(x => `<span class="err">${esc(x)}</span>`).join('')}</div>` : ''}
    ${statoPb()}
    <div class="tasti"><button class="tasto sec" data-az="${ripr ? 'pb-copia' : imp ? 'ix-torna' : 'pubblica'}">${tr('Annulla')}</button>${ripr || f.id ? '' : `<button class="tasto sec" data-az="g-prepara">${tr('Salva tra i preparati')}</button>`}<button class="tasto pri" data-az="a-pubblica" ${!ripr && giudizioManca(f).length ? 'disabled' : ''}>${ripr ? tr('Tieni nella copia') : imp ? tr('Tieni nell’importazione') : f.id ? tr('Pubblica la correzione') : tr('Pubblica')}</button></div>
    ${ripr ? '' : spiaHtml(f)}`;
  return foglio('forte alto', testa, corpo);
}
const sei = x => Math.round(x*1e6)/1e6;
function eventoDalForm(f, id){
  const ev = {id, titolo:f.titolo.trim(), strato:f.strato}, se = (k, v) => { v = String(v||'').trim(); if(v) ev[k] = v; };
  se('sottostrato', f.sub); se('tema', f.tema); ev.inizio = f.inizio; se('fine', f.fine);
  ev.luogo = f.luogo.trim(); ev.indirizzo = String(f.addrFull||f.indirizzo).trim().slice(0, 200); ev.collocazione = f.precision==='map' ? 'a_mano' : 'indirizzo';
  se('descrizione_luogo', f.comeArrivare); ev.lat = sei(f.pos.lat); ev.lng = sei(f.pos.lng); se('organizzatore', f.organizzatore);
  ev.descrizione = f.desc.trim(); se('prezzo', f.prezzo);
  ev.fonte = {testo:f.fonte.trim()}; if(f.fonteLink.trim()) ev.fonte.collegamento = f.fonteLink.trim();
  ev.modificato = new Date().toISOString().slice(0,19)+'Z';
  return ev;
}
/* un errore del controllo del formato, con il nome del campo come lo vede la Redazione al posto del nome tecnico */
const CAMPI_PB = {titolo:'Titolo', strato:'Strato', sottostrato:'Sottostrato', tema:'Tema', inizio:'Inizio', fine:'Fine', luogo:'Luogo', indirizzo:'Indirizzo',
  descrizione_luogo:'Come arrivare', organizzatore:'Organizza', descrizione:'Descrizione', prezzo:'Prezzo indicato dalla fonte', 'fonte.testo':'Fonte', 'fonte.collegamento':'Collegamento alla pagina dell’evento', 'lat e lng':'Punto sulla mappa'};
const erroreCampoPb = x => { const m = String(x).match(/^([a-z_.]+(?: e [a-z]+)?): (.*)$/); return m && CAMPI_PB[m[1]] ? tr(CAMPI_PB[m[1]])+': '+m[2] : String(x); };
/* porta in vista l'elenco degli errori, accanto a «Pubblica» */
function mostraErroriPb(){ const c = document.querySelector('#foglio-slot .pb-errori') || document.querySelector('#foglio-slot .errore'); if(c && c.scrollIntoView) c.scrollIntoView({block:'center', behavior:'smooth'}); }
function pubblicaForm(){
  const f = st.aform; if(!f || PB.lavoro) return;
  f.err = {}; f.errori = []; PB.errore = '';
  const voc = {vocabolario:FORMATO.vocabolario(LAYERS, TEMI_VOC)};
  /* prima i controlli con parole semplici, campo per campo: il campo sbagliato si colora e il messaggio dice che cosa scrivere */
  const vuoto = c => !String(f[c]||'').trim(), metti = (c, msg) => { f.err[c] = 1; f.errori.push(msg); };
  if(vuoto('titolo')) metti('titolo', tr('Titolo: scrivi il nome dell’evento.'));
  if(!f.strato) metti('strato', tr('Strato: scegline uno.'));
  if(vuoto('inizio')) metti('inizio', tr('Inizio: scegli il giorno e l’ora.'));
  else if(f.fine && f.fine <= f.inizio) metti('fine', tr('Fine: deve venire dopo l’inizio (oppure lasciala vuota).'));
  if(vuoto('luogo')) metti('luogo', tr('Luogo: scrivi il nome del luogo, per esempio «Sala del quartiere».'));
  if(vuoto('desc')) metti('desc', tr('Descrizione: scrivi di che cosa si tratta.'));
  if(vuoto('fonte')) metti('fonte', tr('Fonte: scrivi da dove viene l’informazione, per esempio il nome del sito o di chi organizza.'));
  if(!vuoto('fonteLink') && !/^https:\/\//i.test(f.fonteLink.trim())) metti('fonteLink', tr('Collegamento alla pagina dell’evento: deve cominciare con https:// (oppure lascialo vuoto).'));
  if(!f.pos && f.indirizzo.trim().length<3) metti('indirizzo', tr('Indirizzo: scrivilo e scegli uno dei suggerimenti, oppure scegli il punto con «Scegli sulla mappa».'));
  if(f.errori.length){ disegnaFoglio(); mostraErroriPb(); return; }
  if(!f.pos){
    const q = f.indirizzo.trim();
    const b = $('a-punto'); if(b) b.innerHTML = `<p class="caricamento">${tr('Cerco l’indirizzo…')}</p>`;
    lookup(parseAddr(q).city ? q : q+', '+cittaObj().n).then(res => { if(st.aform!==f) return;
      if(res.list.length){ const r = res.list[0]; f.indirizzo = testoRisultato(r); f.addrFull = f.indirizzo; f.precision = r.precision||'exact'; f.hn = r.hn||''; f.pos = {lat:r.lat, lng:r.lng}; f.errori = [tr('Ho trovato l’indirizzo: controlla il punto e tocca di nuovo «Pubblica».')]; }
      else f.err.indirizzo = 2;
      disegnaFoglio(); });
    return;
  }
  const con = id => {
    const ev = eventoDalForm(f, id), errori = FORMATO.controlla(ev, voc).map(erroreCampoPb);
    if(!errori.length && FORMATO.uscitaMs(ev) <= Date.now()) errori.push(tr('L’evento è già finito da più di tre ore: non si pubblica.'));
    if(errori.length){ f.errori = errori; disegnaFoglio(); mostraErroriPb(); return; }
    /* senza le colonne di giudizio non si pubblica (cap. 22, regola 1): il tasto è spento, e qui si ricontrolla */
    if(f.per!=='ripristino'){ const manca = giudizioManca(f); if(manca.length){ f.errori = [testoSpia(manca)]; disegnaFoglio(); mostraErroriPb(); return; } }
    if(f.per==='importa'){ tieniNellImportazione(f); return; }
    if(f.per==='ripristino'){ const R = PB.ripr; if(R){ const i = R.eventi.findIndex(x => x.id===ev.id), j = R.sospesi.findIndex(x => x.id===ev.id); if(i>=0) R.eventi[i] = ev; else if(j>=0) R.sospesi[j] = ev; R.corretti++; } st.aform = null; apri('pb-copia'); return; }
    const nuovo = !f.id, g = f.g, prepScheda = f.prep;
    /* la riga del registro delle fonti parte cifrata nello stesso pacchetto dell'evento (§ 3.4; cap. 22): se lo sportello
       rifiuta, la riga non nasce */
    regPrepara([{ev, g, titolo:g.nomi==='si' && g.titoloReg.trim() ? g.titoloReg.trim() : ev.titolo, canale:'singolo', correzione:!nuovo}]).then(rp =>
      scriviPb(conRegistro({operazione:'scrivi', pubblica:[ev]}, rp), r => { st.aform = null; st.ultimoId = ev.id; registra(nuovo ? 'pubblica' : 'correggi', {id:ev.id, s:ev.strato}); if(!nuovo) misureConta('corretti');
        const codici = (r.registro||{}).codici, codice = (codici||{})[ev.id] || '';
        regConferma(rp, codici).then(() => prepScheda ? togliPreparato(prepScheda) : null)
          .catch(() => { PB.errore = tr('L’evento è pubblicato e la riga {c} è allo sportello, ma non sono riuscito a salvarla nel registro di questo dispositivo.',{c:codice}); ridisegnaPb(); });
        return (nuovo ? tr('Pubblicato alle {o} (ora dello sportello).',{o:oraPb(r.quando)}) : tr('Correzione pubblicata alle {o} (ora dello sportello).',{o:oraPb(r.quando)}))
          + (codice ? ' '+tr('Riga {c} nel registro delle fonti.',{c:codice}) : ''); }),
      () => { f.errori = [tr('Non sono riuscito a preparare la riga del registro delle fonti: non pubblico.')]; disegnaFoglio(); });
  };
  if(f.id) con(f.id);
  else if(f.per==='importa') con(ID_PROVVISORIO);   /* l'identificativo vero nasce alla pubblicazione delle righe segnate */
  else CHIAVI.nuovoId().then(id => { if(st.aform===f) con(id); }, () => { if(st.aform===f){ f.errori = [tr('Per pubblicare servono le chiavi della Redazione: Strumenti della redazione → Chiavi.')]; disegnaFoglio(); } });
}

/* ---------- Storico delle pubblicazioni: elenco, confronto, ripristino (T-039) ---------- */
function riepilogoPb(x){
  if(x.operazione==='ripristina') return tr('Ripristino di una copia');
  const r = x.riepilogo||{}, n = k => Array.isArray(r[k]) ? r[k].length : (r[k]||0);
  const p = [[n('pubblicati'), tr('pubblicati')], [n('corretti'), tr('corretti')], [n('sospesi'), tr('sospesi')], [n('riattivati'), tr('riattivati')], [n('ritirati'), tr('ritirati')]].filter(y => y[0]).map(y => y[0]+' '+y[1]);
  return p.join(', ') || tr('Nessuna modifica');
}
function apriStoricoPb(){
  PB.copie = null; PB.scelte = []; PB.confronto = null; PB.errore = ''; PB.msg = ''; apri('pb-storico');
  SPORTELLO.chiedi({operazione:'storico'}).then(r => { PB.copie = r.copie||[]; }, e => { PB.copie = []; PB.errore = errorePb(e); }).then(ridisegnaPb);
}
function fPbStorico(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Storico delle pubblicazioni')}</h2><p class="meta">${tr('Una copia datata per ogni pubblicazione')}</p></div>${chiudiBtn('pubblica')}</div>`;
  const C = PB.confronto;
  const gruppo = (tit, l) => l.length ? `<p class="etich">${tit} · ${l.length}</p><div class="imp-righe">${l.map(x => `<div>${esc(x.e.titolo)} · ${esc(quandoEv(x.e))}${x.sos?' · '+tr('sospeso'):''}</div>`).join('')}</div>` : '';
  const confronto = !C ? '' : `<div class="red-riquadro"><b>${tr('Dalla copia del {a} a quella del {b}',{a:esc(quandoPb(C.a.quando)), b:esc(quandoPb(C.b.quando))})}</b>
      ${gruppo(tr('Aggiunti'), C.aggiunti)}${gruppo(tr('Tolti'), C.tolti)}${gruppo(tr('Cambiati'), C.cambiati)}
      ${C.aggiunti.length+C.tolti.length+C.cambiati.length ? '' : `<span class="meta">${tr('Le due copie hanno gli stessi eventi.')}</span>`}</div>`;
  const corpo = `${statoPb()}
    ${!PB.copie ? `<p class="caricamento">${tr('Chiedo lo storico allo sportello…')}</p>` : !PB.copie.length ? `<p class="meta">${tr('Non c’è ancora nessuna copia: nasce con la prima pubblicazione.')}</p>`
      : `<p class="meta">${tr('Tocca una copia per ripristinarla, due per confrontarle.')}</p><div class="menu-lista">${PB.copie.map(x => `<button class="menu-r" data-pbcopia="${esc(x.nome)}" aria-pressed="${PB.scelte.includes(x.nome)}"><span class="casella" aria-hidden="true"></span><div><span class="t">${esc(quandoPb(x.quando))}</span><span class="meta">${esc(riepilogoPb(x))} · ${tr('{n} eventi',{n:x.eventi})} · ${esc((x.dispositivo||{}).nome||'')}${x.scaduta?' · '+tr('più di cinque anni'):''}</span></div></button>`).join('')}</div>`}
    <div class="tasti"><button class="tasto sec" data-az="pb-confronta" ${PB.scelte.length===2?'':'disabled'}>${tr('Confronta')}</button><button class="tasto sec" data-az="pb-ripristina" ${PB.scelte.length===1?'':'disabled'}>${tr('Ripristina…')}</button></div>
    ${confronto}`;
  return foglio('forte alto', testa, corpo);
}
function confrontaCopie(a, b){
  const m = k => new Map(k.eventi.map(e => [e.id, {e, sos:false}]).concat(k.sospesi.map(e => [e.id, {e, sos:true}])));
  const A = m(a), B = m(b), solo = (X, Y) => [...X].filter(([id]) => !Y.has(id)).map(([, x]) => x);
  return {a, b, tolti:solo(A, B), aggiunti:solo(B, A), cambiati:[...B].filter(([id, x]) => A.has(id) && (JSON.stringify(A.get(id).e)!==JSON.stringify(x.e) || A.get(id).sos!==x.sos)).map(([, x]) => x)};
}
const leggiCopiaPb = nome => SPORTELLO.chiedi({operazione:'copia', nome}).then(r => r.copia);
/* le richieste di rimozione registrate nelle Misure (scheda «Rete») dopo la data della copia: solo date e ore, senza nomi */
const rimozioniDopo = iso => (mz().rimozioni||[]).filter(r => r && r.ric && new Date(r.ric).getTime() > Date.parse(iso)).map(r => r.ric).sort();
function fPbCopia(){
  const R = PB.ripr;
  const testa = `<div class="riga-titolo"><div><h2>${tr('Ripristina una copia')}</h2><p class="meta">${R ? tr('Copia del {q}',{q:esc(quandoPb(R.copia.quando))}) : ''}</p></div>${chiudiBtn('pb-storico')}</div>`;
  if(!R) return foglio('forte', testa, `<p class="caricamento">${tr('Leggo la copia…')}</p>${statoPb()}`);
  const rim = R.rimozioni;
  const promemoria = rim.length ? `<div class="red-riquadro" role="note"><b>${rim.length===1 ? tr('Dopo questa copia è stata chiesta 1 rimozione di un nome.') : tr('Dopo questa copia sono state chieste {n} rimozioni di nomi.',{n:rim.length})}</b>
      <span class="meta">${tr('Ricevute il: {l}.',{l:esc(rim.map(x => quandoPb(x)).join(' · '))})} ${tr('Prima di ripubblicare vanno ripetute: correggi qui sotto gli eventi che portano quei nomi, oppure toglili dalla copia.')}</span>
      <button class="riga-int" data-az="pb-ripr-fatto" aria-pressed="${R.fatto}"><span class="casella" aria-hidden="true"></span><div><span class="t">${tr('Ho ripetuto le rimozioni chieste dopo questa data')}</span></div></button></div>`
    : `<p class="meta">${tr('Nel registro delle richieste di rimozione (Misure → Rete) non ce ne sono dopo la data di questa copia. Se ne hai ricevute e non le hai registrate, ripetile prima di ripubblicare.')}</p>`;
  const righe = (l, nota) => l.map(ev => `<div class="menu-r" style="cursor:default"><div><span class="t">${esc(ev.titolo)}</span><span class="meta">${esc(quandoEv(ev))} · ${esc(ev.luogo)}${nota?' · '+nota:''}</span></div><button class="link" data-az="pb-ripr-correggi" data-id="${esc(ev.id)}">${tr('Correggi')}</button><button class="link" data-az="pb-ripr-togli" data-id="${esc(ev.id)}">${tr('Togli')}</button></div>`).join('');
  const corpo = `<p>${tr('L’archivio torna com’era in questa copia: {n} eventi ancora da svolgere{s}. Quelli già finiti non tornano ({f}).',{n:R.eventi.length, s:R.sospesi.length ? ', '+tr('più {k} sospesi',{k:R.sospesi.length}) : '', f:R.finiti})}</p>
    ${promemoria}
    ${R.eventi.length+R.sospesi.length ? `<div class="menu-lista">${righe(R.eventi)}${righe(R.sospesi, tr('sospeso'))}</div>` : ''}
    ${statoPb()}
    <div class="tasti"><button class="tasto sec" data-az="pb-storico">${tr('Annulla')}</button><button class="tasto pri" data-az="pb-ripr-ok" ${rim.length && !R.fatto ? 'disabled' : ''}>${tr('Ripubblica questa copia')}</button></div>`;
  return foglio('forte alto', testa, corpo);
}

/* ---------- Tocchi e comandi ---------- */
function clickPubblica(t){
  const d = t.dataset;
  if(clickScheda(t) || clickRegistro(t)) return true;
  if(d.pbev){ PB.sel = d.pbev; PB.ritiro = null; PB.errore = ''; PB.msg = ''; apri('pb-evento'); return true; }
  if(d.pbcopia){ const i = PB.scelte.indexOf(d.pbcopia); if(i>=0) PB.scelte.splice(i, 1); else { PB.scelte.push(d.pbcopia); if(PB.scelte.length>2) PB.scelte.shift(); } PB.confronto = null; disegnaFoglio(); return true; }
  return false;
}
function azionePubblica(az, t){
  const x = PB.sel ? evPb(PB.sel) : null, prova = SPORTELLO.prova;
  const esito = (p, bene) => { PB.lavoro = true; PB.errore = ''; PB.msg = ''; ridisegnaPb(); return p.then(r => { PB.lavoro = false; PB.msg = bene(r); }, e => { PB.lavoro = false; PB.errore = errorePb(e); }).then(aggiornaPb); };
  switch(az){
    case 'pubblica': st.aform = null; PB.svuota = false; PB.togliPrep = null; if(st.sezione!=='mappa') vaiSezione('mappa'); apri('pubblica'); aggiornaPb(); regApri().then(ridisegnaPb); break;
    case 'pb-aggiorna': PB.msg = ''; aggiornaPb(); break;
    case 'pb-nuovo': PB.errore = ''; PB.msg = ''; apriEventoForm(null, 'pubblica'); break;
    case 'a-pubblica': pubblicaForm(); break;
    case 'pb-consegna': esito(prova.consegnaChiavi(), () => tr('Chiavi consegnate: lo sportello di prova ora accetta la firma di questo dispositivo.')); break;
    case 'pb-venti': esito(prova.eventiDelRepository().then(ev => SPORTELLO.chiedi({operazione:'scrivi', pubblica:ev})), r => tr('Portati {n} eventi inventati, pubblicati alle {o}.',{n:r.riepilogo.pubblicati.length+r.riepilogo.corretti.length, o:oraPb(r.quando)})); break;
    case 'pb-falsa': esito(prova.firmaSbagliata().then(r => r), r => r.stato===200 ? tr('Attenzione: lo sportello ha accettato un pacchetto con la firma sbagliata.') : r.corpo.motivo==='fermo' ? tr('Rifiutato: troppe firme sbagliate, lo sportello non risponde a questo dispositivo fino alle {o}.',{o:oraPb(r.corpo.fino)}) : tr('Rifiutato dallo sportello (motivo: {m}). Dopo cinque firme sbagliate in un quarto d’ora smette di rispondere a questo dispositivo per quindici minuti.',{m:r.corpo.motivo})); break;
    case 'pb-svuota': if(!PB.svuota){ PB.svuota = true; disegnaFoglio(); break; } PB.svuota = false; PB.stato = null; esito(prova.svuota(), () => tr('Sportello di prova svuotato.')); break;
    case 'pb-correggi': if(x){ PB.errore = ''; PB.msg = ''; apriEventoForm(x.ev, 'pubblica'); } break;
    case 'pb-sospendi': if(x) scriviPb({operazione:'scrivi', sospendi:[x.ev.id]}, r => { registra('sospendi', {id:x.ev.id, s:x.ev.strato}); return tr('Sospeso alle {o}: non è più sulla mappa.',{o:oraPb(r.quando)}); }); break;
    case 'pb-riattiva': if(x) scriviPb({operazione:'scrivi', riattiva:[x.ev.id]}, r => { registra('riattiva', {id:x.ev.id, s:x.ev.strato}); return tr('Riattivato alle {o}: è di nuovo sulla mappa.',{o:oraPb(r.quando)}); }); break;
    case 'pb-ritira': PB.ritiro = {motivo:'', riferimento:''}; PB.errore = ''; disegnaFoglio(); break;
    case 'pb-ritira-no': PB.ritiro = null; PB.errore = ''; disegnaFoglio(); break;
    case 'pb-ritira-ok': { const R = PB.ritiro; if(!x || !R) break;
      if(!MOTIVI_RITIRO[R.motivo]){ PB.errore = tr('Scegli il motivo del ritiro.'); disegnaFoglio(); break; }
      const rit = {id:x.ev.id, motivo:R.motivo}; if(R.riferimento.trim()) rit.riferimento = R.riferimento.trim();
      /* data e motivo del ritiro passano alla riga del registro delle fonti, se sta su questo dispositivo (cap. 22,
         «Ritiro prima della fine»), nello stesso pacchetto; il motivo resta comunque nella copia datata dello storico */
      regApri().then(() => REG.stato==='aperto' ? regPrepara([{id:rit.id, ritiro:rit.motivo, riferimento:rit.riferimento}]) : null).catch(() => null).then(rp => {
        const c = conRegistro({operazione:'scrivi', ritira:[rit]}, rp);
        scriviPb(c, r => { registra('ritira', {id:x.ev.id, s:x.ev.strato, m:R.motivo}); misureConta('rimossi'); regConferma(rp, (r.registro||{}).codici).catch(() => {});
          return tr('Ritirato alle {o}.',{o:oraPb(r.quando)}); }); }); break; }
    case 'pb-storico': apriStoricoPb(); break;
    case 'pb-confronta': { if(PB.scelte.length!==2) break; PB.errore = '';
      Promise.all(PB.scelte.map(leggiCopiaPb)).then(k => { k.sort((a,b) => a.quando<b.quando?-1:1); PB.confronto = confrontaCopie(k[0], k[1]); }, e => { PB.errore = errorePb(e); }).then(ridisegnaPb); break; }
    case 'pb-ripristina': { if(PB.scelte.length!==1) break; PB.ripr = null; PB.errore = ''; PB.msg = ''; apri('pb-copia');
      leggiCopiaPb(PB.scelte[0]).then(k => { const vivo = e => FORMATO.uscitaMs(e) > Date.now(), ordine = (x, y) => x.inizio<y.inizio?-1:1, ev = k.eventi.filter(vivo).sort(ordine), sos = k.sospesi.filter(vivo).sort(ordine);
        PB.ripr = {copia:k, eventi:ev, sospesi:sos, finiti:k.eventi.length+k.sospesi.length-ev.length-sos.length, rimozioni:rimozioniDopo(k.quando), fatto:false, corretti:0}; }, e => { PB.errore = errorePb(e); }).then(ridisegnaPb); break; }
    case 'pb-copia': st.aform = null; apri('pb-copia'); break;
    case 'pb-ripr-fatto': if(PB.ripr){ PB.ripr.fatto = !PB.ripr.fatto; disegnaFoglio(); } break;
    case 'pb-ripr-correggi': { const R = PB.ripr, ev = R && R.eventi.concat(R.sospesi).find(e => e.id===t.dataset.id); if(ev) apriEventoForm(ev, 'ripristino'); break; }
    case 'pb-ripr-togli': { const R = PB.ripr; if(R){ R.eventi = R.eventi.filter(e => e.id!==t.dataset.id); R.sospesi = R.sospesi.filter(e => e.id!==t.dataset.id); disegnaFoglio(); } break; }
    case 'pb-ripr-ok': { const R = PB.ripr; if(!R || (R.rimozioni.length && !R.fatto)) break;
      scriviPb({operazione:'ripristina', da:R.copia.nome, eventi:R.eventi, sospesi:R.sospesi}, r => { registra('ripristina-copia', {n:r.eventi}); PB.ripr = null; return tr('Copia ripristinata e pubblicata alle {o}: {n} eventi.',{o:oraPb(r.quando), n:r.eventi}); }); break; }
    case 'ix-torna': st.aform = null; apri('pb-importa'); break;
    default: return azioneScheda(az, t) || azioneImporta(az, t) || azioneRegistro(az, t);
  }
  return true;
}
/* i campi del modulo dell'evento e del ritiro: true se il campo era loro */
function inputPubblica(el){
  const d = el.dataset;
  if(inputScheda(el)) return true;
  if(d.pbritiro && PB.ritiro){ PB.ritiro[d.pbritiro] = el.value; return true; }
  if(d.acampo && st.aform){
    const c = d.acampo, f = st.aform; f[c] = el.value;
    if(c==='indirizzo'){ f.pos = null; f.precision = ''; f.addrFull = ''; $('a-punto').innerHTML = ''; chiediSuggerimenti(el.value, 'a', 'a-sugg'); }
    if(f.err[c] && String(el.value).trim()){ f.err[c] = 0; const k = el.closest('.campo'); if(k) k.classList.remove('errore'); }
    aggiornaSpia();
    return true;
  }
  return false;
}
function cambioPubblica(el){
  if(cambioScheda(el)) return true;
  if(el.dataset.acampo==='strato' && st.aform){ st.aform.strato = el.value; st.aform.sub = ''; disegnaFoglio(); return true; }
  if(el.dataset.acampo && st.aform && el.tagName==='SELECT'){ st.aform[el.dataset.acampo] = el.value; return true; }
  if(el.dataset.pbritiro && PB.ritiro){ PB.ritiro[el.dataset.pbritiro] = el.value; return true; }
  return false;
}
