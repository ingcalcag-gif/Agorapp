/* ======================= Chiavi della Redazione: le schermate (T-034, T-037) =======================
   La schermata «Chiavi» e lo strumento «Viene dal nostro archivio?». Le chiavi le fa e le tiene il modulo
   sorgenti/moduli/chiavi.js; qui ci sono soltanto ciò che si vede e i comandi.
   Nulla di segreto passa da qui tranne la frase mentre la si scrive: non si salva, e si dimentica appena è servita. */
const CH = {stato:null, vista:'', modulo:{nome:'', frase:'', ripeti:''}, copia:null, errore:'', lavoro:false, msg:'', revoca:false, avviso:null,
  cassaforte:null, scopo:'', ver:{testo:'', esito:null, errore:''}};
const ERRORI_CHIAVI = {
  'frase-corta':() => tr('La frase deve avere almeno {n} caratteri.',{n:MODULI.chiavi.FRASE_MIN}),
  'frase-diversa':() => tr('Le due frasi non sono uguali.'),
  nome:() => tr('Dai un nome al dispositivo (al massimo {n} caratteri).',{n:MODULI.chiavi.NOME_MAX}),
  frase:() => tr('La frase non apre questa copia: controlla la frase e il file.'),
  file:() => tr('Il file non è quello giusto: serve la copia fatta da questa app.'),
  browser:() => tr('Questo browser non può conservare le chiavi: prova con un altro browser, non in navigazione privata.'),
  'ci-sono':() => tr('Su questo dispositivo le chiavi ci sono già.'),
  mancano:() => tr('Prima crea le chiavi.')
};
const erroreChiavi = e => (ERRORI_CHIAVI[e && e.motivo] || (() => tr('Non è riuscito: riprova.')))();
function aggiornaChiavi(){
  return CHIAVI.stato().then(s => { CH.stato = s; }, e => { CH.stato = {ci_sono:false, guasto:true, revocata:null}; })
    .then(() => CH.stato.ci_sono ? CHIAVI.cassaforte.pulisci().then(r => { CH.cassaforte = r; }, () => { CH.cassaforte = null; }) : null)
    .then(() => { if(st.foglio==='chiavi' || st.foglio==='admin') disegnaFoglio(); });
}
function scaricaTesto(testo, nome){ scaricaBlob(new Blob([testo], {type:'application/json'}), nome); }
const dataChiavi = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(dloc(), {day:'numeric', month:'long', year:'numeric'}); };

function fChiavi(){
  const s = CH.stato, m = CH.modulo;
  const testa = `<div class="riga-titolo"><div><h2>${tr('Chiavi')}</h2><p class="meta">${tr('Firma, cifratura, marcatore e cassaforte della Redazione')}</p></div>${chiudiBtn('admin')}</div>`;
  const err = CH.errore ? `<p class="err" role="alert">${esc(CH.errore)}</p>` : '';
  const msg = CH.msg ? `<p class="meta" role="status" style="color:var(--testo)">${esc(CH.msg)}</p>` : '';
  const campo = (id, lab, html, nota) => `<div class="stack-s"><label class="etich" for="${id}">${lab}</label>${html}${nota?`<span class="meta">${nota}</span>`:''}</div>`;
  const cNome = campo('ch-nome', tr('Nome di questo dispositivo'), `<div class="campo"><input id="ch-nome" data-ch="nome" maxlength="${MODULI.chiavi.NOME_MAX}" value="${esc(m.nome)}" placeholder="${esc(tr('es. Portatile della redazione'))}" autocomplete="off"></div>`, tr('Serve a riconoscerlo quando lo si revoca.'));
  const cFrase = (id, c, lab, nota) => campo(id, lab, `<div class="campo"><input id="${id}" data-ch="${c}" type="password" value="${esc(m[c])}" autocomplete="off" autocapitalize="off" spellcheck="false"></div>`, nota);
  let corpo;
  if(!s) corpo = `<p class="caricamento">${tr('Un attimo…')}</p>`;
  else if(s.guasto) corpo = `<p class="err" role="alert">${ERRORI_CHIAVI.browser()}</p>`;
  else if(CH.lavoro) corpo = `<p class="caricamento">${tr('Preparo le chiavi: ci vuole qualche secondo…')}</p>`;
  else if(!s.ci_sono && CH.vista==='copia'){
    corpo = `<p>${tr('Scegli il file della copia di riserva delle chiavi e scrivi la frase con cui è stata cifrata.')}</p>
      <button class="tasto sec pieno" data-az="chiavi-file">${CH.copia ? tr('File scelto: {f}',{f:esc(CH.copia.nome)}) : tr('Scegli il file della copia')}</button>
      ${cFrase('ch-frase', 'frase', tr('Frase della copia'))}
      ${err}
      <button class="tasto pri pieno" data-az="chiavi-ripristina">${tr('Ripristina su questo dispositivo')}</button>
      <p class="meta">${tr('Per quando il dispositivo di prima è perso o cambiato: qui tornano le stesse chiavi, firma compresa.')}</p>
      ${cNome}
      <button class="tasto sec pieno" data-az="chiavi-aggiungi">${tr('Aggiungi come dispositivo in più')}</button>
      <p class="meta">${tr('Per lavorare da due dispositivi: questo riceve le chiavi comuni e una firma sua, che si può revocare da sola.')}</p>
      <button class="link" data-az="chiavi-vista-crea">${tr('‹ Crea chiavi nuove')}</button>`;
  }
  else if(!s.ci_sono){
    const rev = s.revocata ? `<div class="red-riquadro" role="note"><b>${tr('Le chiavi di questo dispositivo sono revocate.')}</b><span class="meta">${tr('Dispositivo «{d}», firma {i}, revocata il {g}. Consegna l’avviso di revoca allo sportello: da quel momento la firma non vale più.',{d:esc(s.revocata.dispositivo), i:esc(s.revocata.impronta), g:esc(dataChiavi(s.revocata.quando))})}</span>
        <div class="tasti"><button class="tasto sec" data-az="chiavi-revoca-file">${tr('Scarica l’avviso di revoca')}</button></div></div>` : '';
    corpo = `${rev}${msg}
      <p>${tr('Le chiavi nascono su questo dispositivo e la loro parte segreta non ne esce. Servono per salvare gli eventi con l’identificativo giusto, per firmare ciò che si pubblica e per leggere le segnalazioni.')}</p>
      ${cNome}
      ${cFrase('ch-frase', 'frase', tr('Frase della Redazione'), tr('Almeno {n} caratteri: per esempio quattro o cinque parole a caso. Protegge la copia di riserva. Non si salva da nessuna parte: se la dimentichi, la copia non si apre più.',{n:MODULI.chiavi.FRASE_MIN}))}
      ${cFrase('ch-ripeti', 'ripeti', tr('Ripeti la frase'))}
      ${err}
      <button class="tasto pri pieno" data-az="chiavi-crea">${tr('Crea le chiavi')}</button>
      <button class="link" data-az="chiavi-vista-copia">${tr('Ho già una copia di riserva')} ${freccia}</button>`;
  }
  else {
    const cas = CH.cassaforte, nCas = cas ? cas.restano : 0;
    const noti = (s.noti||[]).map((n, i) => `<div class="red-riga"><div><span class="t">${esc(n.dispositivo)}</span><span class="meta">${tr('Firma {i}',{i:esc(n.impronta)})}</span></div><button class="link" data-az="chiavi-revoca-altro" data-i="${i}">${tr('Avviso di revoca')}</button></div>`).join('');
    corpo = `${msg}
      <div class="red-riquadro"><b>${esc(s.dispositivo)}</b><span class="meta">${tr('Chiavi create il {g}',{g:esc(dataChiavi(s.creato))})}</span>
        <span class="meta">${tr('Firma')}: <code class="red-id">${esc(s.firma.impronta)}</code></span><span class="meta">${tr('Cifratura')}: <code class="red-id">${esc(s.cifratura.impronta)}</code></span></div>
      <section class="sezione"><div class="tipo">${tr('Parti pubbliche')}</div>
        <p class="meta">${tr('Sono ciò che si consegna agli sportelli: servono a riconoscere la firma e a cifrare le segnalazioni. Non contengono nulla di segreto.')}</p>
        <div class="tasti"><button class="tasto sec" data-az="chiavi-pubbliche-copia">${CH.copiato ? tr('Copiate') : tr('Copia')}</button><button class="tasto sec" data-az="chiavi-pubbliche-file">${tr('Scarica')}</button></div></section>
      <section class="sezione"><div class="tipo">${tr('Copia di riserva')}</div>
        <p class="meta">${tr('Un file cifrato con la frase della Redazione: senza la frase è illeggibile. Tienilo fuori da questo dispositivo, su un supporto cifrato; mai in una chat o nella posta.')}</p>
        <button class="tasto sec pieno" data-az="chiavi-copia">${tr('Scarica la copia di riserva')}</button>
        <p class="meta">${tr('Per riaprirla serve questa app: su un dispositivo senza chiavi, Chiavi → «Ho già una copia di riserva», poi il file e la frase.')}</p></section>
      <section class="sezione"><div class="tipo">${tr('Cassaforte degli eventi nascosti')}</div>
        <p class="meta">${nCas===1 ? tr('1 password conservata, cifrata.') : tr('{n} password conservate, cifrate.',{n:nCas})} ${tr('Ogni password si cancella da sola quando il suo evento finisce.')}</p>
        <div class="tasti"><button class="tasto sec" data-az="cassaforte-copia">${tr('Scarica la copia')}</button><button class="tasto sec" data-az="cassaforte-file">${tr('Riporta da una copia')}</button></div></section>
      ${noti ? `<section class="sezione"><div class="tipo">${tr('Altri dispositivi della Redazione')}</div>${noti}</section>` : ''}
      ${err}
      <section class="sezione"><div class="tipo">${tr('Revoca')}</div>
      ${CH.revoca ? `<div class="red-riquadro" role="alert"><b>${tr('Revocare questo dispositivo?')}</b><span class="meta">${tr('Le chiavi si cancellano da qui e non si possono più usare: per continuare servirà la copia di riserva con la frase, oppure chiavi nuove. Poi va consegnato allo sportello l’avviso di revoca.')}</span>
          <div class="tasti"><button class="tasto sec" data-az="chiavi-revoca-no">${tr('Annulla')}</button><button class="tasto pericolo" data-az="chiavi-revoca-ok">${tr('Sì, revoca')}</button></div></div>`
        : `<button class="link" style="color:var(--rosso,#B3261E)" data-az="chiavi-revoca">${tr('Revoca questo dispositivo')}</button>`}</section>`;
  }
  return foglio('forte alto', testa, corpo);
}

/* «Viene dal nostro archivio?» (T-037): un identificativo, oppure un testo o un file copiato. */
function fVerifica(){
  const V = CH.ver, e = V.esito;
  const testa = `<div class="riga-titolo"><div><h2>${tr('Viene dal nostro archivio?')}</h2><p class="meta">${tr('Il marcatore negli identificativi degli eventi lo riconosce solo chi ha la chiave')}</p></div>${chiudiBtn('admin')}</div>`;
  const elenco = l => l.slice(0, 20).map(x => `<code class="red-id">${esc(x)}</code>`).join(' ') + (l.length > 20 ? ' …' : '');
  const esito = !e ? '' : !e.trovati ? `<div class="red-riquadro" role="status"><b>${tr('Nessun identificativo nel testo.')}</b><span class="meta">${tr('Un identificativo è fatto di 16 caratteri, un trattino e altri 8.')}</span></div>`
    : `<div class="red-riquadro" role="status"><b>${e.trovati===1 ? (e.nostri.length ? tr('Sì: viene dal nostro archivio.') : tr('No: non viene dal nostro archivio.')) : tr('{n} identificativi: {s} vengono dal nostro archivio, {a} no.',{n:e.trovati, s:e.nostri.length, a:e.altri.length})}</b>
        ${e.trovati>1 && e.nostri.length ? `<span class="meta">${tr('Dal nostro archivio')}: ${elenco(e.nostri)}</span>` : ''}${e.trovati>1 && e.altri.length ? `<span class="meta">${tr('Non nostri')}: ${elenco(e.altri)}</span>` : ''}
        <span class="meta">${tr('Vale per gli identificativi creati con le chiavi di questa Redazione.')}</span></div>`;
  const corpo = `<div class="stack-s"><label class="etich" for="ver-testo">${tr('Identificativo o testo copiato')}</label><div class="campo"><textarea id="ver-testo" data-ch="verifica" rows="4" autocomplete="off" spellcheck="false">${esc(V.testo)}</textarea></div></div>
    ${V.errore ? `<p class="err" role="alert">${esc(V.errore)}</p>` : ''}
    <div class="tasti"><button class="tasto sec" data-az="verifica-file">${tr('Apri un file')}</button><button class="tasto pri" data-az="verifica-ok">${tr('Controlla')}</button></div>
    ${esito}`;
  return foglio('forte alto', testa, corpo);
}
function controllaVerifica(){
  const V = CH.ver; V.errore = ''; V.esito = null;
  CHIAVI.controllaTesto(V.testo).then(r => { V.esito = r; }, e => { V.errore = erroreChiavi(e); }).then(() => { if(st.foglio==='verifica') disegnaFoglio(); });
}

function scegliFileRed(scopo){ CH.scopo = scopo; $('fileRed').click(); }
$('fileRed').addEventListener('change', function(){
  const f = this.files && this.files[0], scopo = CH.scopo; this.value = ''; if(!f) return;
  if(f.size > 20e6){ CH.errore = tr('Il file è troppo grande.'); CH.ver.errore = CH.errore; disegnaFoglio(); return; }
  const r = new FileReader();
  r.onload = () => {
    const testo = String(r.result||'');
    if(scopo==='chiavi'){ CH.copia = {nome:f.name, testo}; CH.errore = ''; disegnaFoglio(); }
    else if(scopo==='cassaforte'){ CH.errore = ''; CH.msg = '';
      CHIAVI.cassaforte.ripristina(testo).then(x => { CH.msg = tr('Cassaforte: {n} password riportate, {s} scartate.',{n:x.rientrate, s:x.scartate}); registra('cassaforte-riporta', {n:x.rientrate}); }, e => { CH.errore = erroreChiavi(e); }).then(aggiornaChiavi); }
    else if(scopo==='verifica'){ CH.ver.testo = testo.slice(0, 2e6); if(st.foglio==='verifica') disegnaFoglio(); controllaVerifica(); }
  };
  r.onerror = () => { CH.errore = tr('Il file non si legge.'); disegnaFoglio(); };
  r.readAsText(f);
});

/* i comandi delle due schermate: true se il comando era loro */
function azioneChiavi(az, t){
  const m = CH.modulo, pulito = () => { m.frase = ''; m.ripeti = ''; };
  const lavora = p => { CH.lavoro = true; CH.errore = ''; CH.msg = ''; disegnaFoglio();
    return p.then(msg => { pulito(); CH.copia = null; CH.vista = ''; CH.msg = msg; MEM.tieni(); }, e => { CH.errore = erroreChiavi(e); }).then(() => { CH.lavoro = false; return aggiornaChiavi(); }); };
  switch(az){
    case 'chiavi': CH.errore = ''; CH.msg = ''; CH.revoca = false; CH.copiato = false; apri('chiavi'); aggiornaChiavi(); break;
    case 'chiavi-vista-copia': CH.vista = 'copia'; CH.errore = ''; disegnaFoglio(); break;
    case 'chiavi-vista-crea': CH.vista = ''; CH.errore = ''; disegnaFoglio(); break;
    case 'chiavi-crea': lavora(CHIAVI.genera(m.frase, m.ripeti, m.nome).then(() => { registra('chiavi-crea'); return tr('Chiavi create. Scarica subito la copia di riserva e conservala fuori da questo dispositivo.'); })); break;
    case 'chiavi-file': scegliFileRed('chiavi'); break;
    case 'chiavi-ripristina': case 'chiavi-aggiungi': {
      if(!CH.copia){ CH.errore = tr('Scegli prima il file della copia.'); disegnaFoglio(); break; }
      const modo = az==='chiavi-aggiungi' ? 'aggiungi' : 'ripristina';
      lavora(CHIAVI.daCopia(CH.copia.testo, m.frase, modo, m.nome).then(() => { registra('chiavi-'+modo); return modo==='aggiungi' ? tr('Dispositivo aggiunto: consegna allo sportello le sue parti pubbliche e scarica la sua copia di riserva.') : tr('Chiavi ripristinate su questo dispositivo.'); }));
      break; }
    case 'chiavi-copia': CHIAVI.copia().then(c => { scaricaTesto(c.testo, c.nome); registra('chiavi-copia'); CH.msg = tr('Copia di riserva scaricata: {f}',{f:c.nome}); }, e => { CH.errore = erroreChiavi(e); }).then(() => disegnaFoglio()); break;
    case 'chiavi-pubbliche-copia': CHIAVI.pubbliche().then(p => copiaTesto(JSON.stringify(p, null, 1))).then(ok => { CH.copiato = !!ok; if(!ok) CH.errore = tr('Non riesco a copiare: usa «Scarica».'); }, e => { CH.errore = erroreChiavi(e); }).then(() => disegnaFoglio()); break;
    case 'chiavi-pubbliche-file': CHIAVI.pubbliche().then(p => scaricaTesto(JSON.stringify(p, null, 1)+'\n', 'chiavi-pubbliche-'+p.creato.slice(0,10)+'.json'), e => { CH.errore = erroreChiavi(e); disegnaFoglio(); }); break;
    case 'chiavi-revoca': CH.revoca = true; disegnaFoglio(); break;
    case 'chiavi-revoca-no': CH.revoca = false; disegnaFoglio(); break;
    case 'chiavi-revoca-ok': CH.revoca = false; CHIAVI.revoca().then(a => { CH.avviso = a; registra('chiavi-revoca'); CH.msg = ''; }, e => { CH.errore = erroreChiavi(e); }).then(aggiornaChiavi); break;
    case 'chiavi-revoca-file': { const a = CH.stato && CH.stato.revocata; if(a) scaricaTesto(JSON.stringify(a, null, 1)+'\n', 'revoca-'+String(a.quando).slice(0,10)+'.json'); break; }
    case 'chiavi-revoca-altro': { const n = CH.stato && (CH.stato.noti||[])[+(t && t.dataset.i)];
      if(n){ const a = CHIAVI.avvisoRevoca(n.dispositivo, n.impronta); scaricaTesto(JSON.stringify(a, null, 1)+'\n', 'revoca-'+a.quando.slice(0,10)+'.json'); } break; }
    case 'cassaforte-copia': CHIAVI.cassaforte.copia().then(c => { scaricaTesto(c.testo, c.nome); registra('cassaforte-copia'); CH.msg = tr('Copia della cassaforte scaricata: {f}',{f:c.nome}); }, e => { CH.errore = erroreChiavi(e); }).then(() => disegnaFoglio()); break;
    case 'cassaforte-file': scegliFileRed('cassaforte'); break;
    case 'verifica': CH.ver.errore = ''; apri('verifica'); break;
    case 'verifica-ok': controllaVerifica(); break;
    case 'verifica-file': scegliFileRed('verifica'); break;
    default: return false;
  }
  return true;
}
function inputChiavi(el){
  const c = el.dataset.ch; if(!c) return false;
  if(c==='verifica') CH.ver.testo = el.value; else CH.modulo[c] = el.value;
  return true;
}
/* all'apertura: lo stato delle chiavi e la pulizia della cassaforte (le password degli eventi finiti si cancellano) */
aggiornaChiavi();
