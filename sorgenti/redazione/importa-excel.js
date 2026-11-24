/* ======================= Importazione dal file Excel degli eventi (T-042) =======================
   Libro mastro: § 2.2, canale 2 (anteprima, esclusione singola, indirizzi non trovati in un elenco a parte, punto
   messo a mano); § 5.2 («negli eventi importati in blocco ogni riga sia vista nell'anteprima»: decisione del
   24/11/2026, un segno per riga); §§ 3.4-3.6; § 5.3 (la fonte di ogni evento, mai il nome del file); § 6.2.

   Il file è quello «Eventi da importare» consegnato il 13/11/2026 (o un .csv con le stesse intestazioni): foglio «Eventi»,
   colonne blu (l'evento) e verdi (il registro delle fonti), riconosciute dal nome dell'intestazione. Si legge con il
   modulo nostro dei file Excel (sorgenti/moduli/excel.js) e non si conserva: le righe stanno nella memoria della
   pagina finché questa schermata è aperta.

   Ogni riga finisce in uno di quattro gruppi:
   - rifiutate, con il motivo, come nel foglio «Controllo» del file: immagine o password compilate, «Nascosto» diverso
     da «No», titolo, strato, data o ora mancanti o illeggibili, evento già finito o già pubblicato. Si correggono nel
     file e si importa di nuovo;
   - da sistemare: manca qualcosa che si può scrivere qui (descrizione, fonte, codice FS che non è nell'elenco delle
     fonti, colonne di giudizio, conferma di un avviso sui recapiti o sulle parole): «Correggi» apre la scheda di
     pubblicazione con la riga, e «Tieni nell'importazione» la riporta qui;
   - indirizzi non trovati: la ricerca (Photon, dal dispositivo della redazione, uno al secondo: T-008) non li trova;
     «Metti il punto» apre la scheda, dove si sceglie il punto sulla mappa e si può scrivere «Come arrivare»;
   - pronte: si guardano una per una e si segnano «L'ho vista: pubblicala». Una riga non segnata resta fuori.
   «Pubblica» manda in un solo pacchetto firmato le righe segnate, con le loro righe del registro delle fonti (canale
   «file Excel»). Nessuna pubblicazione automatica.

   Testi come testo (T-024): ogni testo del file entra nella pagina solo con esc(). */
const IX = {stato:null};   /* {nome, fase: 'leggo'|'cerco'|'pronto', righe, fatti, daCercare, lavoro, errore, msg} */
const COLONNE_FILE = {
  'titolo':'titolo', 'strato':'strato', 'sottostrato':'sub', 'descrizione':'desc', 'data':'data', 'ora inizio':'oraInizio', 'ora fine':'oraFine', 'durata':'durata',
  'prezzo':'prezzo', 'indirizzo':'indirizzo', 'latitudine':'lat', 'longitudine':'lng', 'link':'link', 'immagine':'immagine', 'nascosto':'nascosto', 'password':'password',
  'provenienza':'provenienza', 'fonte':'fonte', 'organizzatore':'organizzatore', 'luogo':'luogo', 'nome del luogo':'luogo', 'come arrivare':'comeArrivare',
  'fonte codice fs':'fs', 'data di consultazione':'consultazione', 'post leggibile senza account':'post', 'dieci domande':'dieci', 'domande e correzioni':'correzioni',
  'nomi ripresi':'nomi', 'evento politico o religioso':'politico', 'prova del consenso codice c':'consenso', 'recapito dell organizzatore per l avviso codice k':'k'};
const ID_PROVVISORIO = 'importazioneprov-aaaaaaaa';   /* solo per il controllo del formato: l'identificativo vero nasce alla pubblicazione */
const cellaTesto = v => v==null ? '' : typeof v==='number' ? String(v) : String(v).trim();
const minutiDurata = v => { const t = cellaTesto(v).toLowerCase().replace(',', '.'); let m;
  if(typeof v==='number' && v>0 && v<1) return Math.round(v*1440);
  if((m = t.match(/^(\d+)[:.](\d{2})$/))) return +m[1]*60 + +m[2];
  if((m = t.match(/^(\d+(?:\.\d+)?)\s*(h|ore|ora)?\s*(?:(\d+)\s*(m|min|minuti)?)?$/))) return m[2] || !m[4] && +m[1]<=12 ? Math.round(+m[1]*60) + (+m[3]||0) : +m[1];
  if((m = t.match(/^(\d+)\s*(m|min|minuti)$/))) return +m[1];
  return null; };

/* ---------- Dalla riga del file alla scheda ---------- */
function rigaDalFile(o){
  const R = {riga:o.__riga, stato:'', motivi:[], note:[], vista:false, f:null}, no = m => { R.stato = 'rifiutata'; R.motivi.push(m); };
  const t = k => cellaTesto(o[k]);
  /* le colonne che il file deve lasciare vuote (§§ 2.3, 2.4, 6.2) */
  if(t('immagine')) no(tr('colonna «Immagine» compilata: le immagini non si pubblicano'));
  if(t('password')) no(tr('colonna «Password» compilata: nessuna password in un file'));
  if(t('nascosto') && normT(t('nascosto'))!=='no') no(tr('«Nascosto» diverso da «No»: gli eventi nascosti non si importano da file'));
  const titolo = t('titolo'); if(!titolo) no(tr('manca il titolo'));
  const l = trovaStrato(o.strato); if(!l) no(t('strato') ? tr('strato «{s}» non riconosciuto',{s:t('strato').slice(0, 80)}) : tr('manca lo strato'));
  const g = leggiData(o.data); if(!g) no(t('data') ? tr('data non leggibile') : tr('manca la data'));
  const h = leggiOra(o.oraInizio); if(!h) no(t('oraInizio') ? tr('ora di inizio non leggibile') : tr('manca l’ora di inizio'));
  if(R.stato) return R;
  const inizio = g+'T'+h, hf = leggiOra(o.oraFine);
  let fine = ''; if(hf){ fine = g+'T'+hf; if(fine<=inizio) fine = piuGiorni(g,1)+'T'+hf; }
  else { const m = minutiDurata(o.durata); if(m && m>0 && m<=1440) fine = new Date(Date.parse(inizio+':00Z') + m*6e4).toISOString().slice(0, 16); }   /* ora italiana più i minuti, come sull'orologio */
  if(FORMATO.uscitaMs({inizio, fine:fine||undefined}) <= Date.now()) { no(tr('l’evento è già finito')); return R; }
  const sub = trovaSub(l, o.sub);
  if(t('sub') && !sub) R.note.push(tr('sottostrato «{s}» non riconosciuto: lasciato vuoto',{s:t('sub').slice(0, 80)}));
  const lat = numero(o.lat), lng = numero(o.lng), coord = lat!=null && lng!=null && (lat || lng);
  const indirizzo = t('indirizzo').slice(0, 200);
  if(!coord && indirizzo.length<3){ no(tr('manca l’indirizzo (o latitudine e longitudine)')); return R; }
  /* la scheda: gli stessi campi del modulo dell'evento (pubblicazione.js), più il giudizio dalle colonne verdi */
  const f = {per:'importa', id:null, titolo:titolo.slice(0, 100), strato:l.id, sub:sub ? sub.id : '', tema:'', inizio, fine, luogo:(t('luogo') || indirizzo).slice(0, 120), luogoDaIndirizzo:!t('luogo'),
    indirizzo, addrFull:indirizzo, pos:coord ? {lat:Math.round(lat*1e6)/1e6, lng:Math.round(lng*1e6)/1e6} : null, precision:coord ? 'map' : '', hn:'', comeArrivare:t('comeArrivare').slice(0, 300),
    organizzatore:t('organizzatore').slice(0, 120), desc:t('desc').slice(0, 2000), prezzo:t('prezzo').slice(0, 80), fonte:t('fonte').slice(0, 160), fonteLink:t('link').slice(0, 500), err:{}, errori:[], imp:R.riga};
  const gi = giudizioNuovo(); gi.daFile = true;
  gi.fonte = t('fs').toUpperCase().replace(/\s+/g, '');
  const dc = leggiData(o.consultazione); if(dc) gi.consultazione = dc; else gi.consultazione = '';
  const post = normT(t('post')); gi.post = /^si/.test(post) ? 'si' : post ? 'np' : '';
  const dieci = normT(t('dieci'));
  if(dieci==='tutte superate') DIECI_DOMANDE.forEach(([n]) => { gi.dom[n] = 'si'; });
  else if(dieci==='correzione applicata') gi.domFile = ('Correzione applicata: '+t('correzioni')).slice(0, 200);
  else if(dieci==='consenso diretto chiesto') gi.domFile = 'Consenso diretto chiesto';
  const nomi = normT(t('nomi')); gi.nomi = nomi==='nessun nome' ? 'no' : /^si/.test(nomi) ? 'si' : '';
  const pol = normT(t('politico')); gi.politico = pol==='no' ? 'no' : pol==='si' ? 'si' : '';
  gi.consenso = t('consenso').toUpperCase().replace(/\s+/g, '').slice(0, 12);
  gi.k = t('k').toUpperCase().replace(/\s+/g, '').slice(0, 12); gi.avviso = gi.k ? 'dopo' : 'nessuno';
  f.g = gi; R.f = f;
  return R;
}
/* lo stato di una riga che non è rifiutata: indirizzo da trovare, da sistemare o pronta */
function valutaRiga(R){
  if(R.stato==='rifiutata' || R.stato==='pubblicata' || R.stato==='preparata') return;
  const f = R.f; R.motivi = [];
  if(!f.pos){ R.stato = 'indirizzo'; R.motivi.push(tr('indirizzo non trovato: metti il punto sulla mappa')); return; }
  const ev = eventoDalForm(f, ID_PROVVISORIO), formato = FORMATO.controlla(ev, {vocabolario:FORMATO.vocabolario(LAYERS, TEMI_VOC)}).map(erroreCampoPb);
  const manca = giudizioManca(f);
  R.motivi = formato.concat(manca.length ? [testoSpia(manca)] : []);
  if(!R.motivi.length && PB.stato && PB.stato.eventi.concat(PB.stato.sospesi).some(e => normT(e.titolo)===normT(ev.titolo) && e.inizio===ev.inizio)){ R.stato = 'rifiutata'; R.motivi = [tr('c’è già tra i pubblicati, con lo stesso titolo e lo stesso inizio')]; return; }
  R.stato = R.motivi.length ? 'sistemare' : 'pronta';
  if(R.stato!=='pronta') R.vista = false;
}

/* ---------- Leggere il file ---------- */
function importaExcel(file){
  const nome = String(file.name||'');
  IX.stato = {nome, fase:'leggo', righe:[], fatti:0, daCercare:0, lavoro:false, errore:'', msg:''};
  const I = IX.stato; PB.errore = ''; PB.msg = '';
  if(st.sezione!=='mappa') vaiSezione('mappa'); apri('pb-importa');
  Promise.all([file.arrayBuffer().then(b => MODULI.excel.leggi(b, nome)), regApri(), PB.stato ? null : aggiornaPb().catch(() => null)]).then(([wb]) => {
    if(IX.stato!==I) return;
    const foglioE = wb.fogli.find(x => normT(x.nome)==='eventi') || wb.fogli[0], righe = foglioE.righe;
    const iTesta = righe.findIndex(r => (r||[]).filter(c => COLONNE_FILE[normT(c)]).length >= 3);
    if(iTesta<0){ I.fase = 'pronto'; I.errore = tr('Nel file non trovo le colonne del foglio «Eventi»: parti dal file «Eventi da importare» o dal modello.'); ridisegnaIx(); return; }
    const mappa = righe[iTesta].map(c => COLONNE_FILE[normT(c)] || null);
    righe.slice(iTesta+1).forEach((r, k) => {
      if(!(r||[]).some(c => cellaTesto(c))) return;
      const o = {__riga:iTesta+k+2}; mappa.forEach((c, j) => { if(c) o[c] = (r||[])[j]; });
      I.righe.push(rigaDalFile(o));
    });
    if(!I.righe.length){ I.fase = 'pronto'; I.errore = tr('Nel foglio «Eventi» non ci sono righe compilate.'); ridisegnaIx(); return; }
    I.righe.forEach(R => { if(R.stato!=='rifiutata' && R.f && !R.f.pos) R.daCercare = true; else valutaRiga(R); });
    const daCercare = I.righe.filter(R => R.daCercare); I.daCercare = daCercare.length; I.fase = daCercare.length ? 'cerco' : 'pronto'; ridisegnaIx();
    /* gli indirizzi senza coordinate si cercano uno alla volta, uno al secondo (T-008) */
    (async () => {
      for(const R of daCercare){
        if(IX.stato!==I) return;
        const q = R.f.indirizzo, pa = parseAddr(q);
        let x = null; try{ const res = await lookup(pa.city ? q : q+', '+cittaObj().n); x = res.list[0]; }catch(e){ x = null; }
        if(IX.stato!==I) return;
        if(x){ R.f.pos = {lat:x.lat, lng:x.lng}; R.f.addrFull = testoRisultato(x); R.f.precision = x.precision||'exact'; R.f.hn = x.hn||''; }
        delete R.daCercare; valutaRiga(R); I.fatti++; ridisegnaIx();
        await new Promise(ok => setTimeout(ok, 1000));
      }
      if(IX.stato!==I) return;
      I.fase = 'pronto'; ridisegnaIx();
    })();
  }).catch(e => { if(IX.stato!==I) return; I.fase = 'pronto';
    I.errore = e && e.motivo==='righe' ? tr('Il file ha più di 10.000 righe: dividilo in più file.') : tr('Il file non si legge: controlla che sia un foglio .xlsx o .csv (un file .ods va prima salvato come .xlsx).'); ridisegnaIx(); });
}
const ridisegnaIx = () => { if(st.foglio==='pb-importa') disegnaFoglio(); };

/* ---------- La schermata ---------- */
function fPbImporta(){
  const I = IX.stato;
  const testa = `<div class="riga-titolo"><div><h2>${tr('Importa da Excel')}</h2><p class="meta">${I ? esc(I.nome) : ''}</p></div>${chiudiBtn('ix-chiudi')}</div>`;
  if(!I) return foglio('forte', testa, '');
  if(I.fase==='leggo') return foglio('forte', testa, `<p class="caricamento">${tr('Leggo il file…')}</p>`);
  const gruppi = {pronta:[], sistemare:[], indirizzo:[], rifiutata:[], pubblicata:[], preparata:[]};
  I.righe.forEach(R => { if(R.daCercare) return; (gruppi[R.stato]||gruppi.rifiutata).push(R); });
  const segnate = gruppi.pronta.filter(R => R.vista).length;
  const quando = f => esc(giornoOra(f.inizio))+(f.fine ? ' → '+esc(giornoOra(f.fine)) : '');
  const pronta = R => { const f = R.f, fo = regFonte(f.g.fonte);
    return `<div class="ix-riga"><details><summary><span class="t">${tr('Riga {r}',{r:R.riga})} · ${esc(f.titolo)}</span><span class="meta">${quando(f)} · ${esc(f.luogo)}</span></summary>
      <dl class="ix-dati"><dt>${tr('Indirizzo')}</dt><dd>${esc(f.addrFull||f.indirizzo)}${f.precision==='map' ? ' · '+tr('punto messo a mano') : ''}</dd>
      ${f.comeArrivare ? `<dt>${tr('Come arrivare')}</dt><dd>${esc(f.comeArrivare)}</dd>` : ''}${f.organizzatore ? `<dt>${tr('Organizza')}</dt><dd>${esc(f.organizzatore)}</dd>` : ''}
      <dt>${tr('Descrizione')}</dt><dd>${esc(f.desc)}</dd>${f.prezzo ? `<dt>${tr('Prezzo indicato dalla fonte')}</dt><dd>${esc(f.prezzo)}</dd>` : ''}
      <dt>${tr('Fonte')}</dt><dd>${esc(f.fonte)}${f.fonteLink ? ' · '+esc(f.fonteLink) : ''}</dd>
      <dt>${tr('Registro')}</dt><dd>${esc(fo ? etichettaFonte(fo) : f.g.fonte)} · ${esc(esitoDomande(f.g))}</dd></dl>
      ${R.note.map(x => `<p class="meta">${esc(x)}</p>`).join('')}${f.luogoDaIndirizzo ? `<p class="meta">${tr('Il file non ha la colonna «Luogo»: il nome del luogo è l’indirizzo. Se il luogo ha un nome, correggilo.')}</p>` : ''}
      <button class="link" data-az="ix-correggi" data-r="${R.riga}">${tr('Correggi')}</button></details>
      <button class="riga-int" data-az="ix-vista" data-r="${R.riga}" aria-pressed="${R.vista}"><span class="casella" aria-hidden="true"></span><div><span class="t">${tr('L’ho vista: pubblicala')}</span></div></button></div>`; };
  const altra = (R, tasto, az) => `<div class="menu-r" style="cursor:default"><div><span class="t">${tr('Riga {r}',{r:R.riga})}${R.f ? ' · '+esc(R.f.titolo) : ''}</span><span class="meta">${R.motivi.concat(R.note).map(esc).join(' · ')}</span></div>${tasto ? `<button class="link" data-az="${az}" data-r="${R.riga}">${tasto}</button>` : ''}</div>`;
  const sezione = (tit, l, html) => l.length ? `<p class="etich">${tit} · ${l.length}</p>${html}` : '';
  const corpo = `${I.errore ? `<p class="err" role="alert">${esc(I.errore)}</p>` : ''}${I.msg ? `<p class="meta" role="status" style="color:var(--testo)">${esc(I.msg)}</p>` : ''}${statoPb()}
    ${I.fase==='cerco' ? `<p class="caricamento">${tr('Cerco gli indirizzi senza coordinate: {k} di {n}…',{k:I.fatti, n:I.daCercare})}</p><p class="meta">${tr('Uno al secondo, come chiede il servizio delle mappe. Le righe già pronte si possono guardare.')}</p>` : ''}
    <p class="meta">${tr('Ogni riga va guardata prima di pubblicarla (§ 5.2): aprila, controlla, e segnala con «L’ho vista: pubblicala». Una riga non segnata non si pubblica. Il file non si conserva: chiudendo questa schermata, le righe non pubblicate si perdono (dalla scheda di una riga si può salvarla tra i preparati).')}</p>
    ${sezione(tr('Pronte'), gruppi.pronta, `<div class="ix-lista">${gruppi.pronta.map(pronta).join('')}</div>`)}
    ${sezione(tr('Da sistemare'), gruppi.sistemare, `<div class="menu-lista">${gruppi.sistemare.map(R => altra(R, tr('Correggi'), 'ix-correggi')).join('')}</div>`)}
    ${sezione(tr('Indirizzi non trovati'), gruppi.indirizzo, `<div class="menu-lista">${gruppi.indirizzo.map(R => altra(R, tr('Metti il punto'), 'ix-correggi')).join('')}</div>`)}
    ${sezione(tr('Rifiutate: si correggono nel file'), gruppi.rifiutata, `<div class="imp-righe">${gruppi.rifiutata.map(R => `<div class="no">${tr('Riga {r}',{r:R.riga})}: ${esc(R.motivi.join('; '))}</div>`).join('')}</div>`)}
    ${sezione(tr('Già pubblicate'), gruppi.pubblicata, `<div class="imp-righe">${gruppi.pubblicata.map(R => `<div>${tr('Riga {r}',{r:R.riga})}: ${esc(R.f.titolo)} · ${esc(R.codice||'')}</div>`).join('')}</div>`)}
    ${sezione(tr('Salvate tra i preparati'), gruppi.preparata, `<div class="imp-righe">${gruppi.preparata.map(R => `<div>${tr('Riga {r}',{r:R.riga})}: ${esc(R.f.titolo)}</div>`).join('')}</div>`)}
    <div class="tasti"><button class="tasto sec" data-az="ix-chiudi">${tr('Chiudi')}</button><button class="tasto pri" data-az="ix-pubblica" ${segnate && !PB.lavoro ? '' : 'disabled'}>${segnate===1 ? tr('Pubblica la riga segnata') : tr('Pubblica le {n} righe segnate',{n:segnate})}</button></div>`;
  return foglio('forte alto', testa, corpo);
}

/* ---------- Correggere una riga nella scheda, e riportarla qui ---------- */
const rigaIx = n => IX.stato ? IX.stato.righe.find(R => R.riga===+n) || null : null;
function correggiRiga(n){
  const R = rigaIx(n); if(!R || !R.f) return;
  st.aform = JSON.parse(JSON.stringify(R.f)); st.aform.err = {}; st.aform.errori = [];
  st.sel = null; st.form = null; apri('aform');
}
/* dalla scheda: «Tieni nell'importazione» (l'evento è già passato dal controllo del formato e dal giudizio) */
function tieniNellImportazione(f){
  const R = rigaIx(f.imp); if(!R) return;
  R.f = JSON.parse(JSON.stringify(f)); R.f.err = {}; R.f.errori = []; R.f.luogoDaIndirizzo = false;
  R.stato = ''; valutaRiga(R); st.aform = null; apri('pb-importa');
}
function rigaPreparata(n){ const R = rigaIx(n); if(R){ R.stato = 'preparata'; R.vista = false; } }

/* ---------- Pubblicare le righe segnate: un solo pacchetto, con le righe del registro ---------- */
function pubblicaImportazione(){
  const I = IX.stato; if(!I || PB.lavoro) return;
  const scelte = I.righe.filter(R => R.stato==='pronta' && R.vista);
  if(!scelte.length) return;
  scelte.forEach(valutaRiga);
  const ancora = scelte.filter(R => R.stato==='pronta' && R.vista);
  if(ancora.length!==scelte.length){ I.errore = tr('Alcune righe nel frattempo non sono più pronte: controllale.'); ridisegnaIx(); return; }
  I.errore = ''; I.msg = '';
  Promise.all(ancora.map(() => CHIAVI.nuovoId())).then(ids => {
    const cambi = ancora.map((R, i) => { const ev = eventoDalForm(R.f, ids[i]); R.idNuovo = ev.id; return {ev, g:R.f.g, titolo:R.f.g.nomi==='si' && R.f.g.titoloReg.trim() ? R.f.g.titoloReg.trim() : ev.titolo, canale:'excel'}; });
    return regPrepara(cambi).then(rp => scriviPb(conRegistro({operazione:'scrivi', pubblica:cambi.map(c => c.ev)}, rp), r => {
      const codici = (r.registro||{}).codici||{};
      ancora.forEach(R => { R.stato = 'pubblicata'; R.vista = false; R.codice = codici[R.idNuovo]||''; });
      registra('importa', {n:ancora.length});
      regConferma(rp, codici).catch(() => { PB.errore = tr('Gli eventi sono pubblicati e le righe del registro sono allo sportello, ma non sono riuscito a salvarle nel registro di questo dispositivo.'); ridisegnaIx(); });
      I.msg = ancora.length===1 ? tr('Pubblicata 1 riga alle {o} (ora dello sportello).',{o:oraPb(r.quando)}) : tr('Pubblicate {n} righe alle {o} (ora dello sportello).',{n:ancora.length, o:oraPb(r.quando)});
      return ''; }, 'pb-importa'));
  }).catch(() => { I.errore = tr('Per pubblicare servono le chiavi della Redazione: Strumenti della redazione → Chiavi.'); ridisegnaIx(); });
}

/* ---------- Tocchi ---------- */
function azioneImporta(az, t){
  const I = IX.stato;
  switch(az){
    case 'ix-file': $('fileImporta').click(); break;
    case 'ix-vista': { const R = rigaIx(t.dataset.r); if(R && R.stato==='pronta'){ R.vista = !R.vista; disegnaFoglio(); } break; }
    case 'ix-correggi': correggiRiga(t.dataset.r); break;
    case 'ix-pubblica': pubblicaImportazione(); break;
    case 'ix-chiudi': {
      const aperte = I ? I.righe.filter(R => R.stato==='pronta' || R.stato==='sistemare' || R.stato==='indirizzo').length : 0;
      if(aperte && !I.chiudi){ I.chiudi = true; I.msg = aperte===1 ? tr('Una riga non è pubblicata e andrà persa: tocca ancora «Chiudi» per uscire.') : tr('{n} righe non sono pubblicate e andranno perse: tocca ancora «Chiudi» per uscire.',{n:aperte}); disegnaFoglio(); break; }
      IX.stato = null; apri('pubblica'); aggiornaPb(); break; }
    default: return false;
  }
  return true;
}
