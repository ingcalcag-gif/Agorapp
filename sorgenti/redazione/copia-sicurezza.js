/* ======================= Copia di sicurezza degli eventi fuori da Bunny (T-054) =======================
   Libro mastro, § 2.4 («Lo storico e le copie di sicurezza»: contro la perdita dell'intero account, una copia periodica
   fuori da Bunny, cifrata e custodita dalla Redazione, mai sulla piattaforma del codice né presso strumenti di
   intelligenza artificiale; le sei condizioni comuni), § 3.11 (prova periodica del ripristino), § 3.13, passo 4 (le
   rimozioni chieste dopo la data della copia si ripetono prima di ripubblicare), § 3.14. Copre le alternative 1, 2 e 4
   del § 2.4: il file si salva sul supporto che sceglie la Direzione (decisione aperta, sezione 6 del piano). Documento:
   docs/archivio.md.

   Decisioni del 27/11/2026 (nn. 6-10):
   - «Scarica la copia di sicurezza» legge dallo sportello di pubblicazione, con la firma, tutto ciò che la copia deve
     contenere (operazione «immagine»: l'elenco degli eventi con sospesi e nascosti, che restano cifrati, tutto lo storico
     e il registro delle fonti come lo tiene lo sportello, con i contatori dei codici F), lo compone, lo comprime e lo
     cifra su questo dispositivo con una frase di almeno 20 caratteri, diversa da quella delle chiavi: se la frase apre la
     copia di riserva delle chiavi, l'app la rifiuta (sorgenti/moduli/copia-eventi.js). Un solo file.
   - «Prova il ripristino» apre il file con la frase, controlla che la copia sia completa, la riversa in un archivio di
     prova che vive soltanto in questa pagina (la stessa logica dello sportello, con un deposito in memoria: non scrive
     nulla da nessuna parte) e lo rilegge; controlla anche che ogni evento nascosto ancora in corso si apra con le password
     della cassaforte di questo dispositivo. La cassaforte non entra nella copia: ha la sua (§ 2.4, n. 10).
   - «Ripristina in uno sportello vuoto»: dopo una prova riuscita, mostra le richieste di rimozione arrivate dopo l'ultima
     pubblicazione della copia, da ripetere come nel ripristino dallo storico, e poi riversa la copia, a parti firmate,
     nello sportello, che la accetta soltanto se è vuoto (operazione «ricostruisci»): oggi lo sportello di prova svuotato;
     con T-072 la cartella di prova su Bunny o lo spazio nuovo dopo la perdita dell'account.
   - I promemoria (n. 9): dopo 30 giorni dall'ultima copia degli eventi o dall'ultima copia dei registri su memoria fisica
     («Scarica tutti i file» dell'Archivio) e dopo 90 dall'ultima prova del ripristino riuscita, gli Strumenti della
     redazione lo ricordano. Le date (soltanto il giorno) stanno su questo dispositivo, nella voce red_promemoria.

   La copia non va mai su GitHub, nella posta o all'assistente: lo dice la schermata. La frase non si salva da nessuna
   parte; la copia aperta per la prova resta soltanto in questa pagina. */
const CS = {lavoro:'', avanz:'', errore:'', msg:'', frase:'', ripeti:'', file:null, fraseProva:'', esito:null, copia:null};
OP_STORICO['copia-scarica'] = ['accessi', 'Copia di sicurezza degli eventi scaricata'];
OP_STORICO['copia-prova'] = ['accessi', 'Prova del ripristino della copia di sicurezza'];
OP_STORICO['copia-ripristina'] = ['eventi', 'Copia di sicurezza ripristinata in uno sportello vuoto'];

/* ---------- I promemoria (decisione del 27/11/2026, n. 9) ---------- */
const PROMEMORIA = [['copiaEventi', 30, 'Copia di sicurezza degli eventi', 'copia-sicurezza'], ['copiaRegistri', 30, 'Copia dei registri su memoria fisica', 'archivio'], ['provaRipristino', 90, 'Prova del ripristino', 'copia-sicurezza']];
function datePromemoria(){ const d = MEM.leggi('red_promemoria', {}); return d && typeof d==='object' && !Array.isArray(d) ? d : {}; }
function segnaPromemoria(k){ const d = datePromemoria(); d[k] = oggi(); MEM.scrivi('red_promemoria', d); }
const giornoIt = g => /^\d{4}-\d{2}-\d{2}$/.test(g||'') ? g.slice(8)+'/'+g.slice(5, 7)+'/'+g.slice(0, 4) : '';
function promemoriaHtml(){
  const d = datePromemoria(), adesso = Date.parse(oggi());
  const scaduti = PROMEMORIA.filter(([k, g]) => !/^\d{4}-\d{2}-\d{2}$/.test(d[k]||'') || (adesso - Date.parse(d[k]))/864e5 > g);
  if(!scaduti.length) return '';
  return `<div class="red-riquadro" role="note"><b>${tr('Da rifare')}</b>${scaduti.map(([k, g, t, az]) => `<span class="meta">${esc(tr(t))}: ${d[k] ? esc(tr('l’ultima è del {d}, più di {g} giorni fa.',{d:giornoIt(d[k]), g})) : esc(tr('non ancora fatta su questo dispositivo.'))}
    <button class="link" style="min-height:32px" data-az="${az}">${tr('Apri')}</button></span>`).join('')}</div>`;
}

/* ---------- Pezzi ---------- */
const csDisponibile = () => !!SPORTELLO.vero() || SPORTELLO.diProva();
const ridisegnaCs = () => { if(st.foglio==='rd-copia') disegnaFoglio(); };
const vocabolarioCs = () => FORMATO.vocabolario(LAYERS, TEMI_VOC);
function erroreCs(e){
  const m = e && e.motivo;
  if(m==='frase-corta') return tr('La frase deve avere almeno {n} caratteri.',{n:MODULI.copiaEventi.FRASE_MIN});
  if(m==='frase-diversa') return tr('Le due frasi non sono uguali.');
  if(m==='frase-chiavi') return tr('Questa frase apre anche la copia di riserva delle chiavi: scegline un’altra (§ 2.4: la chiave della copia non sta con le altre).');
  if(m==='copia') return tr('Il file non si apre con questa frase, oppure è rovinato.');
  if(m==='pieno') return tr('Lo sportello non è vuoto: una copia di sicurezza si ripristina soltanto in uno sportello che non ha ancora nulla. Sul collegamento di prova: Pubblicazione → «Svuota lo sportello di prova», poi «Consegna le chiavi allo sportello di prova».');
  if(m==='ricostruzione') return tr('Lo sportello sta ancora ricevendo una ricostruzione interrotta: ripeti il ripristino dall’inizio.');
  return errorePb(e);
}
const casualeCs = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), x => x.toString(16).padStart(2, '0')).join('');

/* ---------- La schermata ---------- */
function fCs(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Copia di sicurezza degli eventi')}</h2><p class="meta">${tr('Fuori da Bunny, cifrata su questo dispositivo (§ 2.4)')}</p></div>${chiudiBtn('admin')}</div>`;
  if(!csDisponibile()) return foglio('forte alto', testa, `<p class="meta">${tr('Lo sportello di pubblicazione non è ancora allacciato.')}</p>`);
  const d = datePromemoria(), E = CS.esito, occupato = !!CS.lavoro;
  const campo = (id, k, lab, nota) => `<div class="stack-s"><label class="etich" for="${id}">${lab}</label><div class="campo"><input id="${id}" data-cs="${k}" type="password" value="${esc(CS[k])}" autocomplete="off" autocapitalize="off" spellcheck="false"></div>${nota ? `<span class="meta">${nota}</span>` : ''}</div>`;
  const esito = !E ? '' : `<div class="red-riquadro"${E.integra ? '' : ' role="alert"'}><b>${E.integra ? tr('Copia integra: il ripristino funziona.') : tr('La copia non è integra.')}</b>
      <span class="meta">${esc(tr('Copia del {q}, fatta da «{d}».',{q:quandoPb(E.creata), d:E.dispositivo||'—'}))}</span>
      <span class="meta">${esc(tr('{c} copie dello storico · {e} eventi ({v} ancora da svolgere) · {s} sospesi · {n} nascosti · {b} buste del registro delle fonti · codici F fino a F-{f}',
        {c:E.conti.copie, e:E.conti.eventi, v:E.vivi, s:E.conti.sospesi, n:E.conti.nascosti, b:E.conti.buste, f:String(E.conti.codici).padStart(5, '0')}))}</span>
      ${E.nascosti.tot ? `<span class="meta">${esc(E.nascosti.aperti===E.nascosti.tot ? tr('Nascosti in corso: {n}, tutti si aprono con la cassaforte di questo dispositivo.',{n:E.nascosti.tot}) : tr('Nascosti in corso: {n}; con la cassaforte di questo dispositivo se ne aprono {a}. Per gli altri serve la cassaforte del dispositivo che li ha pubblicati (Chiavi → copia della cassaforte).',{n:E.nascosti.tot, a:E.nascosti.aperti}))}</span>` : ''}
      ${E.problemi.map(x => `<span class="err">${esc(x)}</span>`).join('')}</div>`;
  const corpo = `${CS.errore ? `<p class="err" role="alert">${esc(CS.errore)}</p>` : ''}${CS.msg ? `<p class="meta" role="status" style="color:var(--testo)">${esc(CS.msg)}</p>` : ''}${CS.lavoro ? `<p class="caricamento">${esc(CS.avanz)}</p>` : ''}
    <p class="meta">${esc(tr('Ultima copia scaricata da questo dispositivo: {a}. Ultima prova del ripristino riuscita: {b}.',{a:giornoIt(d.copiaEventi) || tr('mai'), b:giornoIt(d.provaRipristino) || tr('mai')}))}</p>
    <p class="etich">${tr('Scarica la copia di sicurezza')}</p>
    <p class="meta">${tr('Un solo file con gli eventi pubblicati, sospesi e nascosti (questi restano cifrati), tutto lo storico delle pubblicazioni e il registro delle fonti come lo tiene lo sportello, con i suoi codici. Si cifra su questo dispositivo con una frase diversa da quella delle chiavi.')}</p>
    ${campo('cs-frase', 'frase', tr('Frase della copia'), tr('Almeno {n} caratteri. Non si salva da nessuna parte: se la dimentichi, la copia non si apre più. Tienila lontano dal supporto della copia.',{n:MODULI.copiaEventi.FRASE_MIN}))}
    ${campo('cs-ripeti', 'ripeti', tr('Ripeti la frase'))}
    <div class="tasti"><button class="tasto pri" data-az="cs-scarica" ${occupato ? 'disabled' : ''}>${tr('Scarica la copia di sicurezza')}</button></div>
    <p class="meta">${tr('Salva il file sul supporto scelto dalla Direzione, fuori da questo dispositivo. Mai su GitHub, nella posta o in una conversazione con l’assistente. Durante la copia non pubblicare.')}</p>
    <p class="etich">${tr('Prova il ripristino')}</p>
    <p class="meta">${tr('Apre la copia, controlla che sia integra e la ripristina in un archivio di prova che vive soltanto in questa pagina: non cambia nulla, né qui né nello sportello.')}</p>
    <div class="tasti"><button class="tasto sec" data-az="cs-file" ${occupato ? 'disabled' : ''}>${CS.file ? tr('Un altro file') : tr('Scegli il file della copia')}</button></div>
    ${CS.file ? `<p class="meta" style="color:var(--testo)">${esc(CS.file.nome)}</p>${campo('cs-frase-prova', 'fraseProva', tr('Frase della copia'))}
      <div class="tasti"><button class="tasto pri" data-az="cs-prova" ${occupato ? 'disabled' : ''}>${tr('Prova il ripristino')}</button></div>` : ''}
    ${esito}
    ${E && E.integra && CS.copia ? `<p class="etich">${tr('Ripristina in uno sportello vuoto')}</p>
      <p class="meta">${tr('Dopo la perdita dell’archivio, in uno sportello che non ha ancora nulla: oggi lo sportello di prova svuotato (Pubblicazione → «Svuota lo sportello di prova», poi «Consegna le chiavi allo sportello di prova»). Prima di ripristinare, l’app mostra le richieste di rimozione arrivate dopo l’ultima pubblicazione della copia, da ripetere.')}</p>
      <div class="tasti"><button class="tasto sec" data-az="cs-ripristina" ${occupato ? 'disabled' : ''}>${tr('Ripristina in uno sportello vuoto…')}</button></div>` : ''}`;
  return foglio('forte alto', testa, corpo);
}
Object.assign(FOGLI_RED, {'rd-copia':fCs});

/* ---------- Scaricare ---------- */
async function immagineCs(){
  const file = []; let dopo;
  for(let giri = 0; giri < 100000; giri++){
    const r = await SPORTELLO.chiedi(Object.assign({operazione:'immagine'}, dopo ? {dopo} : {}));
    file.push(...r.file); CS.avanz = tr('Leggo dallo sportello: {i} di {n} file…',{i:file.length, n:r.totale}); ridisegnaCs();
    if(!r.seguito) return file; dopo = r.seguito;
  }
  return file;
}
async function scaricaCs(){
  if(CS.lavoro) return;
  const frase = CS.frase, ripeti = CS.ripeti;
  CS.errore = ''; CS.msg = '';
  try{
    if(Array.from(frase.trim()).length < MODULI.copiaEventi.FRASE_MIN) throw {motivo:'frase-corta'};
    if(frase!==ripeti) throw {motivo:'frase-diversa'};
    CS.lavoro = 'scarica'; CS.avanz = tr('Controllo la frase…'); ridisegnaCs();
    if(await CHIAVI.fraseDelleChiavi(frase)) throw {motivo:'frase-chiavi'};
    const s = await CHIAVI.stato(), file = await immagineCs();
    CS.avanz = tr('Compongo e cifro la copia…'); ridisegnaCs();
    const c = await MODULI.copiaEventi.componi(file, {ora:Date.now(), dispositivo:s.dispositivo});
    const b = await MODULI.copiaEventi.cifra(c, frase), nome = 'copia-eventi-'+oggi()+'.bin';
    scaricaBlob(new Blob([b], {type:'application/octet-stream'}), nome);
    segnaPromemoria('copiaEventi'); registra('copia-scarica', {n:file.length});
    CS.frase = ''; CS.ripeti = '';
    CS.msg = tr('Scaricata «{f}» ({p}): {n} file dello sportello. Copiala sul supporto della Direzione e prova il ripristino.',{f:nome, p:pesoAr(b.length), n:file.length});
  }catch(e){ CS.errore = erroreCs(e); }
  CS.lavoro = ''; CS.avanz = ''; ridisegnaCs();
}

/* ---------- Provare il ripristino: un archivio di prova nella pagina ---------- */
$('fileCopia').addEventListener('change', function(){
  const f = this.files && this.files[0]; this.value = ''; if(!f) return;
  CS.esito = null; CS.copia = null; CS.errore = ''; CS.msg = '';
  if(f.size > 1.5e9){ CS.errore = tr('Il file è troppo grande.'); ridisegnaCs(); return; }
  f.arrayBuffer().then(b => { CS.file = {nome:f.name, byte:new Uint8Array(b)}; ridisegnaCs(); }, () => { CS.errore = tr('Il file non si legge.'); ridisegnaCs(); });
});
/* manda le parti di «ricostruisci» a uno sportello: quello vero (chiedi) o quello di prova nella pagina */
async function riversaCs(file, elenco, creata, manda){
  const CE = MODULI.copiaEventi, gruppi = CE.parti(file, elenco), id = casualeCs(); let r = null;
  for(let i = 0; i < gruppi.length; i++){
    CS.avanz = tr('Riverso la copia: parte {i} di {n}…',{i:i+1, n:gruppi.length}); ridisegnaCs();
    r = await manda({operazione:'ricostruisci', id, parte:i+1, di:gruppi.length, file:await CE.impronte(gruppi[i]), da:creata}, gruppi[i]);
  }
  return r;
}
async function provaCs(){
  if(CS.lavoro || !CS.file) return;
  CS.lavoro = 'prova'; CS.avanz = tr('Apro la copia…'); CS.errore = ''; CS.msg = ''; CS.esito = null; CS.copia = null; ridisegnaCs();
  try{
    const CE = MODULI.copiaEventi, voc = vocabolarioCs();
    const c = await CE.decifra(CS.file.byte, CS.fraseProva);
    CS.avanz = tr('Controllo che la copia sia integra…'); ridisegnaCs();
    const v = await CE.verifica(c, {controlla:ev => FORMATO.controlla(ev, {vocabolario:voc})});
    const problemi = v.problemi.slice(), stato = v.file ? JSON.parse((v.file.find(x => x.percorso===CE.STATO)||{testo:'{}'}).testo) : {};
    let vivi = 0;
    if(v.file){
      /* l'archivio di prova nella pagina: la stessa logica dello sportello, con un deposito in memoria */
      const mem = new Map(), dep = {leggi:async p => mem.has(p) ? mem.get(p) : null, scrivi:async (p, t) => { mem.set(p, String(t)); }, togli:async p => { mem.delete(p); }, elenca:async pre => [...mem.keys()].filter(k => k.startsWith(pre))};
      const sp = MODULI.sportello.crea({deposito:dep, regioni:MODULI.regioni, vocabolario:voc}), s = await CHIAVI.stato();
      await sp.ammetti(await CHIAVI.pubbliche());
      const firmato = async x => MODULI.pacchetto.forma(x, {firma:CHIAVI.firma, dispositivo:{nome:s.dispositivo, impronta:s.firma.impronta}});
      const manda = async (x, g) => { const q = await sp.ricevi(JSON.stringify(g ? {pacchetto:await firmato(x), file:g} : await firmato(x))); if(q.stato!==200) throw Object.assign(new Error('prova'), {motivo:q.corpo.motivo||'guasto'}); return q.corpo; };
      try{
        const r = await riversaCs(v.file, stato, c.creata, manda); vivi = r.eventi;
        CS.avanz = tr('Rileggo l’archivio di prova…'); ridisegnaCs();
        const letti = new Map(); let dopo;
        for(let g = 0; g < 100000; g++){ const q = await manda(Object.assign({operazione:'immagine'}, dopo ? {dopo} : {})); q.file.forEach(x => letti.set(x.percorso, x.testo)); if(!q.seguito) break; dopo = q.seguito; }
        for(const f of v.file) if(f.percorso!==CE.STATO && f.percorso!==CE.ELENCO && letti.get(f.percorso)!==f.testo) problemi.push(tr('nell’archivio di prova il file {p} non è tornato identico',{p:f.percorso}));
        if((await manda({operazione:'stato'})).eventi.length!==vivi) problemi.push(tr('nell’archivio di prova gli eventi non sono quelli della copia'));
      }catch(e){ problemi.push(tr('il ripristino nell’archivio di prova si è fermato ({m})',{m:e.motivo||'guasto'})); }
    }
    /* i nascosti ancora in corso si aprono con la cassaforte di questo dispositivo? */
    const nascosti = {tot:0, aperti:0};
    for(const x of (stato.nascosti||[]).concat(stato.nascostiSospesi||[])){
      if(!MODULI.nascosti.vivo(x.giorno, Date.now())) continue;
      nascosti.tot++;
      try{ const pw = await CHIAVI.cassaforte.leggi(x.id); if(pw){ await MODULI.nascosti.decifra(x.file, pw, null, x.impronta); nascosti.aperti++; } }catch(e){ /* non si apre: si conta come non aperto */ }
    }
    CS.esito = {integra:!problemi.length, problemi, conti:v.conti, vivi, nascosti, creata:c.creata, dispositivo:c.dispositivo};
    if(CS.esito.integra){ CS.copia = {creata:c.creata, file:v.file, stato}; segnaPromemoria('provaRipristino'); }
    registra('copia-prova', {n:v.conti.eventi, x:CS.esito.integra ? 'integra' : 'non integra'});
    CS.fraseProva = '';
  }catch(e){ CS.errore = erroreCs(e); }
  CS.lavoro = ''; CS.avanz = ''; ridisegnaCs();
}

/* ---------- Ripristinare in uno sportello vuoto ---------- */
function preparaRipristinoCs(){
  const K = CS.copia; if(!K) return;
  const s = K.stato, elenco = JSON.parse((K.file.find(x => x.percorso===MODULI.copiaEventi.ELENCO)||{testo:'[]'}).testo);
  const ultima = Array.isArray(elenco) && elenco.length ? elenco[elenco.length-1].quando : K.creata;
  const vivo = e => FORMATO.uscitaMs(e) > Date.now(), ordine = (x, y) => x.inizio<y.inizio?-1:1, vivoN = x => MODULI.nascosti.vivo(x.giorno, Date.now());
  const ev = (s.eventi||[]).filter(vivo).sort(ordine), sos = (s.sospesi||[]).filter(vivo).sort(ordine), nas = (s.nascosti||[]).filter(vivoN), nsos = (s.nascostiSospesi||[]).filter(vivoN);
  /* le richieste di rimozione da ripetere: quelle arrivate dopo l'ultima pubblicazione della copia (§ 3.13, passo 4) */
  PB.ripr = {copia:{nome:'', quando:ultima}, sicurezza:K.creata, eventi:ev, sospesi:sos, nascosti:nas, nascostiSospesi:nsos,
    finiti:(s.eventi||[]).length+(s.sospesi||[]).length-ev.length-sos.length, rimozioni:rimozioniDopo(ultima), fatte:[], corretti:0};
  PB.errore = ''; PB.msg = ''; apri('pb-copia');
  nrDecifra(nas.concat(nsos)).then(ridisegnaPb);
}
async function ripristinaCs(R){
  const K = CS.copia; if(!K || PB.lavoro) return;
  PB.lavoro = true; PB.errore = ''; PB.msg = ''; ridisegnaPb();
  try{
    const r = await riversaCs(K.file, {eventi:R.eventi, sospesi:R.sospesi, nascosti:R.nascosti, nascostiSospesi:R.nascostiSospesi}, K.creata, (x, g) => SPORTELLO.chiediFile(x, g));
    registra('copia-ripristina', {n:r.eventi});
    PB.ripr = null; CS.copia = null; CS.esito = null;
    PB.msg = tr('Copia di sicurezza ripristinata e pubblicata alle {o}: {n} eventi.',{o:oraPb(r.quando), n:r.eventi}) + (r.nascosti ? ' '+tr('Più {k} eventi nascosti.',{k:r.nascosti}) : '');
    PB.lavoro = false; st.foglio = 'pubblica'; return aggiornaPb();
  }catch(e){ PB.lavoro = false; PB.errore = erroreCs(e); ridisegnaPb(); }
}

/* ---------- Le interazioni ---------- */
function azioneCs(az, t){
  switch(az){
    case 'copia-sicurezza': Object.assign(CS, {errore:'', msg:''}); apri('rd-copia'); return true;
    case 'cs-scarica': scaricaCs(); return true;
    case 'cs-file': $('fileCopia').click(); return true;
    case 'cs-prova': provaCs(); return true;
    case 'cs-ripristina': preparaRipristinoCs(); return true;
  }
  return false;
}
function inputCs(el){
  const k = el.dataset.cs; if(!k) return false;
  if(k in CS && typeof CS[k]==='string') CS[k] = el.value;
  return true;
}
