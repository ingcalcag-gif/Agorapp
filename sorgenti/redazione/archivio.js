/* ======================= Archivio dei registri (T-053) =======================
   Libro mastro, § 1.1 (le tre condizioni dell'archivio), § 18.3 (QB-7, strada 2, decisione del 17/11/2026: i registri
   si cifrano con la password di apertura del programma dei fogli di calcolo e si depositano da qui, con la firma; l'app
   rifiuta i file in chiaro e non apre mai i registri; fino al lancio la sola copia corrente, strada a), § 18.4 (i nomi),
   § 18.2 (gli allegati), cap. 22 (il registro delle fonti scritto dall'app), allegato A, A.1, punto 8. Documento:
   docs/archivio.md.

   La sezione «Archivio» parla con lo sportello dell'archivio (sportelli/archivio.js) con il pacchetto firmato del
   dispositivo, come la pubblicazione. Decisioni del 27/11/2026 (nn. 1-5):
   - «Deposita un file»: si sceglie un file; l'app ne guarda soltanto il contenitore (sorgenti/moduli/file-cifrati.js)
     e il nome (§ 18.4), dice che cifratura ha trovato, o perché lo rifiuta, e lo manda soltanto se è cifrato: Excel e PDF
     con AES. Un file con lo stesso nome di uno già depositato lo sostituisce dopo la conferma in due tocchi;
   - l'elenco dei file, con dimensione, cifratura, ora e dispositivo; ogni file si riscarica così com'è, cifrato, e si
     toglie con due tocchi (un allegato scaduto con la sua voce, § 18.6);
   - le buste del registro delle fonti scritte dall'app (decisione n. 3: restano dove le mette la pubblicazione): si
     contano e si riscaricano;
   - «Scarica tutti i file»: un solo archivio ZIP con tutti i file e le buste, così come sono (già cifrati), per la copia
     su memoria fisica che il § 18.3 chiede almeno una volta al mese.
   Qui stanno anche i codici FS e NP del registro delle fonti (decisione n. 4): li dà lo sportello dell'archivio, così due
   dispositivi non danno mai lo stesso codice; dove lo sportello non c'è (né vero né di prova) li dà il dispositivo, come
   prima.

   Nulla resta in chiaro sul dispositivo: il file scelto sta nella pagina, già cifrato, finché non parte; i file
   scaricati vanno dove li mette il browser, così come sono. Testi come testo (T-024): nomi dei file e dei dispositivi
   entrano nella pagina solo con esc(). */
const AR = {elenco:null, lavoro:'', errore:'', msg:'', scelto:null, conferma:'', avanz:''};
OP_STORICO['archivio-deposita'] = ['file', 'File depositato nell’archivio dei registri'];
OP_STORICO['archivio-togli'] = ['file', 'File tolto dall’archivio dei registri'];
OP_STORICO['archivio-tutti'] = ['file', 'Archivio dei registri scaricato per la copia su memoria fisica'];
const ETICHETTE_AR = {registro:'Registri', collegato:'File collegati ai registri', gestione:'File di gestione delle attività', allegato:'Allegati'};

/* ---------- Lo sportello dell'archivio: vero (indirizzi.archivio, T-065) o di prova (nel browser) ---------- */
const ARCH = (() => {
  const vero = (CFG.indirizzi||{}).archivio || '';
  const diProva = () => !vero && !!SPORTELLO_PROVA_DOVE && !!MEM.file && !!MODULI.archivioSportello;
  let logica = null;
  const sportello = () => logica || (logica = MODULI.archivioSportello.crea({deposito:depositoProva(), pacchetto:MODULI.pacchetto, file:MODULI.fileCifrati, nome:NOME}));
  function errore(motivo, corpo){ const e = new Error('archivio: '+motivo); e.motivo = motivo; e.corpo = corpo||null; return e; }
  async function consegna(testo){
    if(vero){
      let r; try{ r = await fetch(vero, {method:'POST', body:testo, headers:{'content-type':'application/json'}, credentials:'omit', cache:'no-store', redirect:'error', referrerPolicy:'no-referrer'}); }catch(e){ throw errore('rete'); }
      let corpo = null; try{ corpo = await r.json(); }catch(e){ corpo = null; }
      return {stato:r.status, corpo:corpo||{}};
    }
    if(!diProva()) throw errore('assente');
    return sportello().ricevi(testo);
  }
  /* chiedi(contenuto, dati) → ciò che lo sportello risponde; dati: il file in base64, accanto al pacchetto */
  async function chiedi(contenuto, dati){
    let s; try{ s = await CHIAVI.stato(); }catch(e){ throw errore('chiavi'); }
    if(!s.ci_sono) throw errore('chiavi');
    const p = await MODULI.pacchetto.forma(contenuto, {firma:CHIAVI.firma, dispositivo:{nome:s.dispositivo, impronta:s.firma.impronta}});
    const r = await consegna(JSON.stringify(dati===undefined ? p : {pacchetto:p, dati}));
    if(r.stato!==200 || !r.corpo || r.corpo.esito!=='fatto') throw errore((r.corpo && r.corpo.motivo) || 'guasto', r.corpo);
    return r.corpo;
  }
  return {chiedi, disponibile:() => !!vero || diProva(), diProva};
})();

/* Il prossimo codice FS o NP del registro delle fonti (decisione del 27/11/2026, n. 4): lo dà lo sportello, che riceve il
   primo numero che questo dispositivo conosce come libero e non torna mai indietro. */
function codiceRegistro(serie, locale){
  if(!ARCH.disponibile()) return Promise.resolve(regCodice(serie, locale, 4));
  return ARCH.chiedi({operazione:'codice', serie, almeno:Math.min(Math.max(1, locale|0), 9999)}).then(r => r.codice);
}
const numeroCodice = c => parseInt(String(c||'').replace(/^[A-Z]+-/, ''), 10) || 0;
function erroreCodice(e, cosa){
  const m = e && e.motivo;
  return m==='sconosciuto' ? tr('Lo sportello dell’archivio non conosce ancora questo dispositivo, e senza il codice {c} non si salva: consegna le chiavi (Pubblicazione → «Consegna le chiavi allo sportello di prova»).',{c:cosa})
    : m==='chiavi' ? tr('Per avere il codice {c} servono le chiavi della Redazione: Strumenti della redazione → Chiavi.',{c:cosa})
    : m==='rete' ? tr('Lo sportello dell’archivio non risponde, e senza il codice {c} non si salva: controlla la connessione e riprova.',{c:cosa})
    : tr('Lo sportello dell’archivio non ha dato il codice {c} ({m}): non è salvato.',{c:cosa, m:m||'guasto'});
}

/* ---------- Pezzi ---------- */
const pesoAr = n => n >= 1048576 ? tr('{n} MB',{n:(n/1048576).toLocaleString(dloc(), {maximumFractionDigits:1})}) : tr('{n} KB',{n:Math.max(1, Math.round(n/1024)).toLocaleString(dloc())});
function b64Ar(b){ let s = ''; for(let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i+8192)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function daB64Ar(s){ const t = atob(String(s).replace(/-/g, '+').replace(/_/g, '/')), b = new Uint8Array(t.length); for(let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i); return b; }
const hexAr = b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');
const LIMITE_AR = () => (MODULI.archivioSportello||{LIMITI:{dimensione:10485760}}).LIMITI.dimensione;
function erroreAr(e){
  const m = e && e.motivo, c = (e && e.corpo) || {};
  const T = {
    chiavi:() => tr('Per l’archivio servono le chiavi della Redazione: Strumenti della redazione → Chiavi.'),
    sconosciuto:() => ARCH.diProva() ? tr('Lo sportello di prova non conosce ancora questo dispositivo: Pubblicazione → «Consegna le chiavi allo sportello di prova».') : tr('Lo sportello dell’archivio non conosce questo dispositivo: vanno consegnate le sue chiavi pubbliche.'),
    revocata:() => tr('La firma di questo dispositivo è revocata: lo sportello non la accetta più.'),
    firma:() => tr('Lo sportello ha rifiutato la firma.'),
    fermo:() => tr('Troppe firme sbagliate: lo sportello non risponde a questo dispositivo fino alle {o}.',{o:oraPb(c.fino)}),
    tempo:() => tr('Lo sportello ha rifiutato il pacchetto perché l’ora non corrisponde: controlla data e ora di questo dispositivo.'),
    ripetuto:() => tr('Lo sportello aveva già ricevuto questo pacchetto: riprova.'),
    rete:() => tr('Lo sportello dell’archivio non risponde: controlla la connessione e riprova.'),
    assente:() => tr('Lo sportello dell’archivio non è ancora allacciato.'),
    nome:() => tr('Lo sportello non accetta questo nome di file.'),
    grande:() => tr('Il file è più grande di {p}: lo sportello non lo accetta.',{p:pesoAr(c.massimo||LIMITE_AR())}),
    troppi:() => tr('Nell’archivio ci sono già {n} file, il massimo.',{n:nf(c.massimo||1000)}),
    cifratura:() => tr('Lo sportello ha rifiutato il file: {d}.',{d:c.dettaglio || c.file || ''}),
    impronta:() => tr('Il file è arrivato diverso da com’è partito: riprova.'),
    esiste:() => tr('Nell’archivio c’è già un file con questo nome: aggiorna l’elenco e riprova.'),
    manca:() => tr('Il file non c’è più nell’archivio: aggiorna l’elenco.')
  };
  return (T[m] || (() => tr('Lo sportello dell’archivio ha rifiutato la richiesta (motivo: {m}).',{m:m||'guasto'})))();
}
const ridisegnaAr = () => { if(st.foglio==='rd-archivio') disegnaFoglio(); };
/* perché un file scelto non si può depositare: '' se si può */
function rifiutoAr(s){
  if(!s) return '';
  if(s.dimensione > LIMITE_AR()) return tr('Il file pesa {p}: l’archivio accetta file fino a {m}.',{p:pesoAr(s.dimensione), m:pesoAr(LIMITE_AR())});
  if(!s.tipo) return tr('Il nome non è tra quelli dei registri (§ 18.4): per esempio «{r}», oppure, per un allegato, il codice della voce davanti, come «C-0007_risposta.pdf».',{r:NOME+'_Reg26_Richieste.xlsx'});
  const es = s.esame; if(!es) return '';
  const ext = s.nome.split('.').pop().toLowerCase();
  if(es.motivo==='chiaro') return tr('Questo file non è cifrato: {d}. Salvalo con la password di apertura (non basta proteggere il foglio) e riprova.',{d:es.dettaglio});
  if(es.motivo==='debole') return tr('La password di questo file usa una cifratura che si aggira ({d}). Salvalo di nuovo con la password di apertura, in formato .xlsx o con AES.',{d:es.dettaglio});
  if(es.motivo==='formato') return tr('L’archivio accetta soltanto file Excel (.xlsx) e PDF cifrati con la password di apertura: questo è {d}.',{d:es.dettaglio});
  if(es.motivo==='vuoto') return tr('Il file è vuoto.');
  if(es.motivo==='rovinato') return tr('Il file sembra rovinato: non riesco a leggerne il contenitore.');
  if(!s.tipo.estensioni.includes(ext) || es.formato!==ext) return tr('Il contenuto non è un file .{e}.',{e:ext});
  return '';
}

/* ---------- La schermata ---------- */
function fAr(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Archivio')}</h2><p class="meta">${ARCH.diProva() ? tr('Sportello di prova: archivio finto su questo dispositivo') : tr('Registri cifrati nello spazio riservato su Bunny')}</p></div>${chiudiBtn('admin')}</div>`;
  if(!ARCH.disponibile()) return foglio('forte alto', testa, `<p class="meta">${tr('Lo sportello dell’archivio non è ancora allacciato.')}</p>`);
  const E = AR.elenco, s = AR.scelto, no = rifiutoAr(s);
  const stato = `${AR.errore ? `<p class="err" role="alert">${esc(AR.errore)}</p>` : ''}${AR.msg ? `<p class="meta" role="status" style="color:var(--testo)">${esc(AR.msg)}</p>` : ''}${AR.lavoro ? `<p class="caricamento">${esc(AR.avanz || tr('Firmo e consegno allo sportello…'))}</p>` : ''}`;
  const scelto = !s ? '' : `<div class="red-riquadro"${no ? ' role="alert"' : ''}><b>${esc(s.nomeFile)}</b>
      <span class="meta">${esc(pesoAr(s.dimensione))}${s.tipo ? ' · '+esc(tr(s.tipo.etichetta)) : ''}${s.tipo && s.nome!==s.nomeFile ? ' · '+esc(tr('si deposita come «{n}»',{n:s.nome})) : ''}</span>
      ${no ? `<span class="err">${esc(no)}</span>` : !s.esame ? `<span class="caricamento">${tr('Guardo il file…')}</span>` : `<span class="meta" style="color:var(--testo)">${esc(tr('Cifrato: {c}.',{c:MODULI.fileCifrati.descrivi(s.esame.cifratura)}))}</span>
        ${s.esiste ? `<span class="meta">${esc(tr('Nell’archivio c’è già questo file, depositato il {q} da {d}. Il nuovo lo sostituisce: quello di prima non resta.',{q:quandoPb(s.esiste.quando), d:(s.esiste.dispositivo||{}).nome||''}))}</span>` : ''}`}
      <div class="tasti"><button class="tasto sec" data-az="ar-annulla">${tr('Annulla')}</button>${no || !s.esame ? '' : `<button class="tasto pri" data-az="ar-deposita" ${AR.lavoro ? 'disabled' : ''}>${s.esiste ? (AR.conferma==='sostituisci' ? tr('Tocca ancora per sostituirlo') : tr('Sostituisci il file')) : tr('Deposita')}</button>`}</div></div>`;
  const riga = x => `<div class="menu-r" style="cursor:default"><div><span class="t">${esc(x.nome)}</span>
      <span class="meta">${esc(pesoAr(x.dimensione))} · ${esc(quandoPb(x.quando))} · ${esc((x.dispositivo||{}).nome||'')}${x.cifratura ? ' · AES '+esc(String(x.cifratura.bit)) : ''}</span></div>
      <button class="link" data-az="ar-scarica" data-n="${esc(x.nome)}">${tr('Scarica')}</button>
      <button class="link" data-az="ar-togli" data-n="${esc(x.nome)}">${AR.conferma==='togli:'+x.nome ? tr('Tocca ancora per toglierlo') : tr('Togli')}</button></div>`;
  const gruppi = !E ? '' : Object.keys(ETICHETTE_AR).map(k => { const l = E.file.filter(x => x.categoria===k); return l.length ? `<p class="etich">${tr(ETICHETTE_AR[k])} · ${l.length}</p><div class="menu-lista">${l.map(riga).join('')}</div>` : ''; }).join('');
  const mancano = !E ? [] : MODULI.archivioSportello.nomiFissi(NOME).filter(x => /_Reg\d/.test(x.nome) && !E.file.some(y => y.nome===x.nome));
  const corpo = `${stato}
    <p class="meta">${tr('Qui stanno i registri, i file collegati e gli allegati, già cifrati con la password di apertura del programma dei fogli di calcolo (§ 18.3). L’app non li apre mai: controlla soltanto che siano cifrati, e rifiuta quelli in chiaro.')}</p>
    <div class="tasti"><button class="tasto pri" data-az="ar-scegli" ${AR.lavoro ? 'disabled' : ''}>${tr('Deposita un file')}</button></div>
    ${scelto}
    ${!E ? '' : (E.file.length ? gruppi : `<p class="meta">${tr('L’archivio è ancora vuoto.')}</p>`)}
    ${E ? `<p class="etich">${tr('Registro delle fonti scritto dall’app')}</p><div class="menu-lista"><div class="menu-r" style="cursor:default"><div><span class="t">${E.buste.numero===1 ? tr('1 busta cifrata') : tr('{n} buste cifrate',{n:nf(E.buste.numero)})}</span>
        <span class="meta">${tr('Le scrive l’app a ogni pubblicazione, con la chiave del registro; non si depositano da qui.')}${E.buste.ultima ? ' '+esc(tr('L’ultima: {q}.',{q:quandoPb(E.buste.ultima.replace(/T(\d\d)-(\d\d)-(\d\d)-(\d{3})Z-.*$/, 'T$1:$2:$3.$4Z'))})) : ''}</span></div>
        ${E.buste.numero ? `<button class="link" data-az="ar-buste">${tr('Scarica')}</button>` : ''}</div></div>` : ''}
    ${E && mancano.length ? `<details class="meta"><summary>${mancano.length===1 ? tr('1 registro non ancora depositato') : tr('{n} registri non ancora depositati',{n:mancano.length})}</summary><p>${esc(mancano.map(x => x.nome).join(' · '))}</p></details>` : ''}
    ${E ? `<div class="tasti"><button class="tasto sec" data-az="ar-tutti" ${AR.lavoro || !(E.file.length+E.buste.numero) ? 'disabled' : ''}>${tr('Scarica tutti i file')}</button><button class="tasto sec" data-az="ar-aggiorna" ${AR.lavoro ? 'disabled' : ''}>${tr('Aggiorna l’elenco')}</button></div>
      <p class="meta">${tr('«Scarica tutti i file» prepara un solo archivio ZIP con i file così come sono, cifrati: è la copia da tenere su una memoria fisica, aggiornata almeno una volta al mese (§ 18.3). La password dei registri non va sulla stessa memoria.')}</p>` : ''}
    <p class="meta">${tr('Fino a {p} per file, al più {n} file. Nell’archivio c’è soltanto la copia corrente: un file con lo stesso nome sostituisce quello di prima (§ 18.3, strada a).',{p:pesoAr(LIMITE_AR()), n:nf((MODULI.archivioSportello||{LIMITI:{numero:1000}}).LIMITI.numero)})}</p>`;
  return foglio('forte alto', testa, corpo);
}
Object.assign(FOGLI_RED, {'rd-archivio':fAr});

/* ---------- Che cosa fa ---------- */
async function caricaAr(){
  AR.lavoro = 'elenco'; AR.avanz = tr('Chiedo l’elenco allo sportello…'); ridisegnaAr();
  try{ AR.elenco = await ARCH.chiedi({operazione:'elenca'}); }catch(e){ AR.errore = erroreAr(e); }
  AR.lavoro = ''; AR.avanz = ''; ridisegnaAr();
}
$('fileArchivio').addEventListener('change', function(){
  const f = this.files && this.files[0]; this.value = ''; if(!f) return;
  AR.errore = ''; AR.msg = ''; AR.conferma = '';
  const tipo = MODULI.archivioSportello.tipoNome(f.name, NOME);
  const s = {nomeFile:f.name, nome:tipo ? tipo.nome : '', tipo, dimensione:f.size, esame:null, byte:null, esiste:null};
  AR.scelto = s;
  if(f.size > LIMITE_AR() || !tipo){ ridisegnaAr(); return; }
  f.arrayBuffer().then(b => {
    if(AR.scelto!==s) return;
    s.byte = new Uint8Array(b); s.esame = MODULI.fileCifrati.esamina(s.byte, s.nome);
    s.esiste = AR.elenco ? AR.elenco.file.find(x => x.nome===s.nome) || null : null;
    ridisegnaAr();
  }, () => { AR.scelto = null; AR.errore = tr('Il file non si legge.'); ridisegnaAr(); });
  ridisegnaAr();
});
async function depositaAr(){
  const s = AR.scelto; if(!s || !s.byte || rifiutoAr(s) || AR.lavoro) return;
  if(s.esiste && AR.conferma!=='sostituisci'){ AR.conferma = 'sostituisci'; ridisegnaAr(); return; }
  AR.lavoro = 'deposita'; AR.avanz = tr('Firmo e consegno il file allo sportello…'); AR.errore = ''; AR.msg = ''; ridisegnaAr();
  try{
    const impronta = hexAr(await crypto.subtle.digest('SHA-256', s.byte));
    const r = await ARCH.chiedi({operazione:'archivia', nome:s.nome, dimensione:s.dimensione, impronta, sostituisci:!!s.esiste}, b64Ar(s.byte));
    registra('archivio-deposita', {x:s.nome});
    AR.msg = (r.sostituito ? tr('Sostituito: «{n}».',{n:s.nome}) : tr('Depositato: «{n}».',{n:s.nome}))+' '+tr('Cifrato: {c}.',{c:MODULI.fileCifrati.descrivi(r.file.cifratura)});
    AR.scelto = null; AR.conferma = '';
  }catch(e){ AR.errore = erroreAr(e); AR.conferma = ''; }
  AR.lavoro = ''; AR.avanz = '';
  return caricaAr();
}
async function scaricaAr(nome){
  if(AR.lavoro) return;
  AR.lavoro = 'scarica'; AR.avanz = tr('Chiedo il file allo sportello…'); AR.errore = ''; AR.msg = ''; ridisegnaAr();
  try{
    const r = await ARCH.chiedi({operazione:'scarica', nome});
    const b = daB64Ar(r.dati);
    if(hexAr(await crypto.subtle.digest('SHA-256', b))!==r.file.impronta) throw Object.assign(new Error('impronta'), {motivo:'impronta'});
    scaricaBlob(new Blob([b], {type:'application/octet-stream'}), r.file.nome);
    AR.msg = tr('Scaricato: «{n}», così com’è, cifrato.',{n:r.file.nome});
  }catch(e){ AR.errore = erroreAr(e); }
  AR.lavoro = ''; AR.avanz = ''; ridisegnaAr();
}
/* le buste del registro delle fonti: a pagine, ciascuna come file a sé */
async function busteAr(){
  const tutte = []; let dopo;
  for(let giri = 0; giri < 1000; giri++){
    const r = await ARCH.chiedi(Object.assign({operazione:'scarica', buste:true}, dopo ? {dopo} : {}));
    tutte.push(...r.buste); if(!r.altre || !r.buste.length) break; dopo = r.buste[r.buste.length-1].nome;
  }
  return tutte;
}
const cartellaBuste = 'registro-fonti-scritto-dall-app/';
async function scaricaBusteAr(){
  if(AR.lavoro) return;
  AR.lavoro = 'buste'; AR.avanz = tr('Chiedo le buste allo sportello…'); AR.errore = ''; AR.msg = ''; ridisegnaAr();
  try{
    const b = await busteAr(), nome = nomeFile()+'-registro-fonti-buste-'+oggi()+'.zip';
    scaricaBlob(new Blob([MODULI.excel.zip(b.map(x => [cartellaBuste+x.nome+'.json', x.testo]))], {type:'application/zip'}), nome);
    AR.msg = tr('Scaricate {n} buste, chiuse: «{f}».',{n:b.length, f:nome});
  }catch(e){ AR.errore = erroreAr(e); }
  AR.lavoro = ''; AR.avanz = ''; ridisegnaAr();
}
async function scaricaTuttiAr(){
  const E = AR.elenco; if(AR.lavoro || !E) return;
  AR.lavoro = 'tutti'; AR.errore = ''; AR.msg = '';
  try{
    const voci = [];
    for(let i = 0; i < E.file.length; i++){
      AR.avanz = tr('Scarico i file: {i} di {n}…',{i:i+1, n:E.file.length}); ridisegnaAr();
      const r = await ARCH.chiedi({operazione:'scarica', nome:E.file[i].nome}), b = daB64Ar(r.dati);
      if(hexAr(await crypto.subtle.digest('SHA-256', b))!==r.file.impronta) throw Object.assign(new Error('impronta'), {motivo:'impronta'});
      voci.push([r.file.nome, b]);
    }
    AR.avanz = tr('Scarico le buste del registro delle fonti…'); ridisegnaAr();
    for(const x of await busteAr()) voci.push([cartellaBuste+x.nome+'.json', x.testo]);
    const nome = nomeFile()+'-archivio-registri-'+oggi()+'.zip';
    scaricaBlob(new Blob([MODULI.excel.zip(voci)], {type:'application/zip'}), nome);
    segnaPromemoria('copiaRegistri'); registra('archivio-tutti', {n:voci.length});
    AR.msg = tr('Scaricato «{f}»: {n} file, così come sono, cifrati. Copialo sulla memoria fisica della Redazione.',{f:nome, n:voci.length});
  }catch(e){ AR.errore = erroreAr(e); }
  AR.lavoro = ''; AR.avanz = ''; ridisegnaAr();
}
async function togliAr(nome){
  if(AR.lavoro) return;
  if(AR.conferma!=='togli:'+nome){ AR.conferma = 'togli:'+nome; ridisegnaAr(); return; }
  AR.lavoro = 'togli'; AR.avanz = tr('Firmo e consegno allo sportello…'); AR.conferma = ''; AR.errore = ''; AR.msg = ''; ridisegnaAr();
  try{ await ARCH.chiedi({operazione:'togli', nome}); registra('archivio-togli', {x:nome}); AR.msg = tr('Tolto dall’archivio: «{n}».',{n:nome}); }
  catch(e){ AR.errore = erroreAr(e); }
  AR.lavoro = ''; AR.avanz = '';
  return caricaAr();
}

/* ---------- Le interazioni ---------- */
function azioneAr(az, t){
  switch(az){
    case 'archivio': Object.assign(AR, {errore:'', msg:'', scelto:null, conferma:''}); apri('rd-archivio'); if(ARCH.disponibile()) caricaAr(); return true;
    case 'ar-scegli': $('fileArchivio').click(); return true;
    case 'ar-annulla': AR.scelto = null; AR.conferma = ''; ridisegnaAr(); return true;
    case 'ar-deposita': depositaAr(); return true;
    case 'ar-aggiorna': AR.msg = ''; AR.errore = ''; caricaAr(); return true;
    case 'ar-scarica': scaricaAr(t.dataset.n); return true;
    case 'ar-togli': togliAr(t.dataset.n); return true;
    case 'ar-buste': scaricaBusteAr(); return true;
    case 'ar-tutti': scaricaTuttiAr(); return true;
  }
  return false;
}
