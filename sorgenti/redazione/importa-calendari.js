/* ======================= Importazione dei calendari aperti dei Comuni (T-044) =======================
   Libro mastro: § 2.2, canale 3; § 5.4 (si importano in blocco soltanto i calendari che i Comuni pubblicano come dati
   aperti); § 6.4 (i sette punti, prima della prima importazione da ciascun Comune; licenze; testi riscritti, nessuna
   immagine; ogni aggiornamento ripassa dalla revisione e un evento tolto dal Comune si toglie anche dalla mappa); § 6.6
   (attribuzione chiesta dalla licenza; le licenze a condivisione alle stesse condizioni non si importano in blocco);
   cap. 22 (canale «calendario in dati aperti»; i sette punti e la licenza nella riga FS).

   Il calendario è un file che la Redazione scarica dal sito o dal portale dei dati aperti del Comune, con il dispositivo
   della redazione (punto 6): l'app non lo chiede alla rete. Formati: CSV (o .xlsx), JSON, iCalendar (.ics).
   1. Si sceglie la fonte del registro (tipo «calendario in dati aperti»): l'importazione resta chiusa finché mancano la
      licenza o la data di uno dei sette punti, o se l'esito non è «ammessa»; con una licenza a condivisione alle stesse
      condizioni resta chiusa sempre: quegli eventi si inseriscono a mano, uno per uno.
   2. Si legge il file e si dice quale colonna (o quale campo) porta il titolo, l'inizio, il luogo e il resto: l'app
      propone una corrispondenza dai nomi, la Redazione la conferma o la cambia, e l'app la ricorda per quella fonte.
      Nei file iCalendar i campi sono quelli dello standard (SUMMARY, DTSTART, DTEND, LOCATION, GEO, URL, UID…).
   3. Le righe passano dalla stessa anteprima del file Excel (importa-excel.js, T-042), con il canale «calendario»: il
      campo «Fonte:» porta l'attribuzione chiesta dalla licenza; la descrizione del Comune non si pubblica (punto 5): si
      vede nella scheda della riga come testo da riscrivere, e la riga resta «da sistemare» finché la Redazione non
      scrive la sua. Gli strati sono quelli dell'app (§ 6.3, regola 1): uno per tutto il calendario, da correggere riga
      per riga. Dieci domande, nomi, evento politico e avviso si scelgono una volta per l'importazione, e ogni riga si
      guarda e si segna comunque «L'ho vista: pubblicala».
   4. Un aggiornamento dello stesso calendario: gli eventi già pubblicati e uguali restano dove sono; quelli cambiati
      tornano come correzioni, con la descrizione già riscritta; quelli che il Comune ha tolto e che sono ancora sulla
      mappa si elencano «da ritirare» (§ 6.4, punto 7; § 5.2). L'evento si riconosce dall'identificativo che il
      calendario gli dà (UID nei file iCalendar); se il calendario non ne ha, da titolo, giorno e ora.

   Testi come testo (T-024): ogni testo del calendario entra nella pagina solo con esc(). */
const CAL = {stato:null};   /* {fonte, nome, fase: 'scegli'|'leggo'|'mappa', record, colonne, mappa, scelte, errore} */
const CAMPI_CAL = [['titolo', 'Titolo', true], ['inizio', 'Inizio (giorno, o giorno e ora)', true], ['oraInizio', 'Ora di inizio, se è in una colonna a parte'], ['fine', 'Fine (giorno, o giorno e ora)'],
  ['oraFine', 'Ora di fine, se è in una colonna a parte'], ['luogo', 'Nome del luogo'], ['indirizzo', 'Indirizzo'], ['lat', 'Latitudine'], ['lng', 'Longitudine'], ['link', 'Collegamento alla pagina dell’evento'],
  ['organizzatore', 'Organizzatore'], ['prezzo', 'Prezzo'], ['strato', 'Categoria (per lo strato dell’app)'], ['testo', 'Descrizione del Comune (si riscrive, non si pubblica)'], ['chiave', 'Identificativo dell’evento nel calendario']];
/* nomi frequenti delle colonne, per la corrispondenza proposta */
const SINONIMI_CAL = {titolo:['titolo', 'title', 'nome', 'nome evento', 'denominazione', 'evento', 'summary', 'name', 'oggetto'],
  inizio:['data inizio', 'inizio', 'data', 'start', 'start date', 'startdate', 'dtstart', 'data evento', 'dal', 'data di inizio', 'datainizio'],
  oraInizio:['ora inizio', 'ora', 'orario', 'start time', 'ora di inizio', 'orainizio', 'orario inizio'], fine:['data fine', 'fine', 'end', 'end date', 'enddate', 'dtend', 'al', 'data di fine', 'datafine'],
  oraFine:['ora fine', 'end time', 'ora di fine', 'orafine', 'orario fine'], luogo:['luogo', 'sede', 'location name', 'nome luogo', 'venue', 'struttura'],
  indirizzo:['indirizzo', 'address', 'via', 'location', 'indirizzo esteso', 'street address'], lat:['lat', 'latitudine', 'latitude', 'y'], lng:['lng', 'lon', 'long', 'longitudine', 'longitude', 'x'],
  link:['link', 'url', 'sito', 'collegamento', 'pagina', 'web', 'scheda'], organizzatore:['organizzatore', 'organizer', 'ente organizzatore', 'promotore', 'a cura di'],
  prezzo:['prezzo', 'costo', 'biglietto', 'ingresso', 'price', 'tariffa'], strato:['categoria', 'tipologia', 'tipo', 'category', 'genere', 'tema'],
  testo:['descrizione', 'description', 'testo', 'abstract', 'dettagli', 'sommario'], chiave:['id', 'uid', 'identificativo', 'codice', 'id evento', 'identifier']};

/* ---------- Leggere il file: righe come oggetti {colonna: valore} ---------- */
/* iCalendar (RFC 5545): righe ripiegate, parametri, testi con \n \, \; */
function leggiIcs(testo){
  const righe = String(testo).replace(/\r\n[ \t]|\n[ \t]/g, '').split(/\r?\n/), out = []; let ev = null;
  const testoIcs = v => v.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1');
  for(const r of righe){
    if(/^BEGIN:VEVENT$/i.test(r)){ ev = {}; continue; }
    if(/^END:VEVENT$/i.test(r)){ if(ev) out.push(ev); ev = null; if(out.length > MODULI.excel.MAX_RIGHE) throw Object.assign(new Error('righe'), {motivo:'righe'}); continue; }
    if(!ev) continue;
    const m = r.match(/^([A-Za-z-]+)((?:;[^:]*)?):(.*)$/); if(!m) continue;
    const nome = m[1].toUpperCase(), par = m[2], v = m[3];
    if(nome==='DTSTART' || nome==='DTEND'){ const tz = (par.match(/TZID=([^;:]+)/i)||[])[1] || ''; ev[nome] = {v, tz, giorno:/VALUE=DATE(?!-)/i.test(par) || /^\d{8}$/.test(v)}; }
    else if(nome==='GEO'){ const [la, lo] = v.split(/[;,]/).map(Number); if(isFinite(la) && isFinite(lo)){ ev.LAT = la; ev.LNG = lo; } }
    else if(nome==='ORGANIZER'){ ev.ORGANIZER = testoIcs((par.match(/CN=("[^"]*"|[^;:]*)/i)||[])[1]||'').replace(/^"|"$/g, ''); }
    else if(['SUMMARY', 'LOCATION', 'DESCRIPTION', 'URL', 'UID', 'CATEGORIES', 'STATUS'].includes(nome)) ev[nome] = testoIcs(v).slice(0, 4000);
  }
  return out;
}
/* l'istante di un DTSTART o DTEND come giorno e ora italiani */
function quandoIcs(x){
  if(!x || !x.v) return null;
  const m = x.v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/); if(!m) return null;
  if(!m[4]) return {data:m[1]+'-'+m[2]+'-'+m[3], ora:''};
  if(m[7]) return oraItaliana(Date.UTC(+m[1], +m[2]-1, +m[3], +m[4], +m[5], +(m[6]||0)));
  return {data:m[1]+'-'+m[2]+'-'+m[3], ora:m[4]+':'+m[5], fuso:x.tz && !/^Europe\/Rome$/i.test(x.tz) ? x.tz : ''};
}
const oraItaliana = ms => { const t = new Date(ms).toLocaleString('sv-SE', {timeZone:'Europe/Rome', hour12:false}); return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(t) ? {data:t.slice(0, 10), ora:t.slice(11, 16)} : null; };
/* JSON: un elenco di oggetti, anche dentro una proprietà (events, eventi, items, data, records, @graph, features); i campi annidati si appiattiscono (luogo.indirizzo) */
function leggiJsonCal(testo){
  const d = JSON.parse(testo);
  const elenco = Array.isArray(d) ? d : (['eventi', 'events', 'items', 'data', 'records', 'result', '@graph', 'features'].map(k => d && d[k]).find(Array.isArray) || Object.values(d||{}).find(v => Array.isArray(v) && v.some(x => x && typeof x==='object')) || []);
  const piatto = (o, pre, out, liv) => { Object.entries(o||{}).forEach(([k, v]) => { const n = pre ? pre+'.'+k : k;
    if(v && typeof v==='object' && !Array.isArray(v) && liv < 3) piatto(v, n, out, liv+1);
    else if(Array.isArray(v)) { if(n==='geometry.coordinates' && v.length>=2 && isFinite(v[0]) && isFinite(v[1])){ out['geometry.lng'] = v[0]; out['geometry.lat'] = v[1]; } else out[n] = v.filter(x => x==null || typeof x!=='object').join(', '); }
    else if(v!=null) out[n] = typeof v==='string' ? v.slice(0, 4000) : v; }); return out; };
  return elenco.filter(x => x && typeof x==='object').slice(0, MODULI.excel.MAX_RIGHE).map(x => piatto(x, '', {}, 0));
}
async function leggiCalendario(file){
  const nome = String(file.name||'').toLowerCase(), b = await file.arrayBuffer();
  if(b.byteLength > MODULI.excel.MAX_FILE) throw Object.assign(new Error('file'), {motivo:'file'});
  if(/\.ics$/.test(nome)) return {tipo:'ics', record:leggiIcs(new TextDecoder().decode(b))};
  if(/\.json$/.test(nome)) return {tipo:'json', record:leggiJsonCal(new TextDecoder().decode(b))};
  const wb = await MODULI.excel.leggi(b, nome), righe = (wb.fogli[0]||{righe:[]}).righe;
  const i = righe.findIndex(r => (r||[]).filter(c => cellaTesto(c)).length >= 2); if(i<0) return {tipo:'tabella', record:[]};
  const testa = righe[i].map((c, j) => cellaTesto(c) || 'Colonna '+(j+1));
  return {tipo:'tabella', record:righe.slice(i+1).filter(r => (r||[]).some(c => cellaTesto(c))).map(r => Object.fromEntries(testa.map((c, j) => [c, (r||[])[j]==null ? '' : r[j]])))};
}
/* la corrispondenza proposta: per ogni campo, la prima colonna che ha un nome noto */
function mappaProposta(colonne, salvata){
  const m = {}, usate = new Set();
  CAMPI_CAL.forEach(([k]) => { if(salvata && salvata[k] && colonne.includes(salvata[k])){ m[k] = salvata[k]; usate.add(salvata[k]); } });
  CAMPI_CAL.forEach(([k]) => { if(m[k]) return; const c = colonne.find(x => !usate.has(x) && SINONIMI_CAL[k].includes(normT(x.split('.').pop())) ) || colonne.find(x => !usate.has(x) && SINONIMI_CAL[k].includes(normT(x)));
    if(c){ m[k] = c; usate.add(c); } });
  return m;
}
const MAPPA_ICS = {titolo:'SUMMARY', inizio:'DTSTART', fine:'DTEND', indirizzo:'LOCATION', lat:'LAT', lng:'LNG', link:'URL', organizzatore:'ORGANIZER', strato:'CATEGORIES', testo:'DESCRIPTION', chiave:'UID'};

/* ---------- Un valore di giorno e ora da una colonna del calendario ---------- */
function giornoOraCal(v){
  if(v==null || v==='') return null;
  if(typeof v==='object' && v.v) return quandoIcs(v);
  if(typeof v==='number') return {data:leggiData(v), ora:v % 1 ? leggiOra(v) : ''};
  const t = String(v).trim();
  /* un istante con il fuso (2026-12-04T17:30:00Z, +01:00): in ora italiana */
  if(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/i.test(t)){ const ms = Date.parse(t.replace(' ', 'T')); return isNaN(ms) ? null : oraItaliana(ms); }
  const [g, h] = t.split(/[T ]+/), data = leggiData(g); if(!data) return null;
  return {data, ora:h ? leggiOra(h.slice(0, 5)) || '' : ''};
}

/* ---------- Dal calendario alle righe dell'anteprima (importa-excel.js) ---------- */
const chiaveCal = (o, x) => (x.chiave ? 'id:'+String(x.chiave).slice(0, 180) : 'tdo:'+normT(o.titolo)+'|'+o.data+'|'+o.oraInizio);
function righeDalCalendario(C){
  const fo = regFonte(C.fonte), m = C.tipo==='ics' ? MAPPA_ICS : C.mappa, S = C.scelte, v = (r, k) => m[k] ? r[m[k]] : undefined;
  const stratoDef = LAYERS.find(l => l.id===S.strato), righe = [], saltati = {finiti:0, senzaOra:0};
  C.record.forEach((r, i) => {
    if(C.tipo==='ics' && String(r.STATUS||'').toUpperCase()==='CANCELLED') return;   /* un evento annullato nel calendario non entra; se era pubblicato, risulta tra i tolti */
    const a = giornoOraCal(v(r, 'inizio')), b = giornoOraCal(v(r, 'fine'));
    const oraA = a && (a.ora || leggiOra(v(r, 'oraInizio'))), oraB = b ? (b.ora || leggiOra(v(r, 'oraFine')) || '') : leggiOra(v(r, 'oraFine')) || '';
    const o = {__riga:i+1, titolo:cellaTesto(v(r, 'titolo')).slice(0, 100), strato:trovaStrato(v(r, 'strato')) ? v(r, 'strato') : (stratoDef ? stratoDef.id : ''), data:a ? a.data : '', oraInizio:oraA || '', oraFine:'',
      luogo:cellaTesto(v(r, 'luogo')), indirizzo:cellaTesto(v(r, 'indirizzo')), lat:v(r, 'lat'), lng:v(r, 'lng'), link:/^https:\/\//i.test(cellaTesto(v(r, 'link'))) ? cellaTesto(v(r, 'link')) : '',
      organizzatore:cellaTesto(v(r, 'organizzatore')), prezzo:cellaTesto(v(r, 'prezzo')), desc:'', fonte:(fo.attribuzione || fo.nome).slice(0, 160), fs:fo.codice, consultazione:oggi(),
      post:'Non pertinente', dieci:S.dieci==='tutte' ? 'Tutte superate' : '', nomi:S.nomi==='si' ? 'Sì, con il solo ruolo' : S.nomi==='no' ? 'Nessun nome' : '', politico:S.politico==='si' ? 'Sì' : S.politico==='no' ? 'No' : ''};
    /* la fine: un giorno diverso, o un'ora sola */
    if(b && b.data && oraB){ if(b.data===o.data) o.oraFine = oraB; else o.fineIso = b.data+'T'+oraB; }
    else if(oraB) o.oraFine = oraB;
    if(a && !a.ora && !oraA){ saltati.senzaOra++; return; }   /* eventi di tutto il giorno, senza ora: si inseriscono a mano */
    const R = rigaDalFile(o);
    if(R.stato==='rifiutata' && R.motivi.some(x => /già finito/.test(x))){ saltati.finiti++; return; }
    R.chiave = chiaveCal(o, {chiave:v(r, 'chiave')});
    if(a && a.fuso) R.note.push(tr('ora nel fuso «{f}»: controllala',{f:a.fuso}));
    if(R.f){ R.f.testoCal = cellaTesto(v(r, 'testo')).slice(0, 4000); if(!o.link && fo.indirizzo) R.f.fonteLink = fo.indirizzo; R.f.g.avviso = AVVISI_ORG[S.avviso] ? S.avviso : ''; }
    righe.push(R);
  });
  return {righe, saltati};
}
/* un aggiornamento: righe già pubblicate (uguali o cambiate) e eventi tolti dal Comune */
function confrontaAggiornamento(C, righe){
  const vivi = PB.stato ? new Map(PB.stato.eventi.concat(PB.stato.sospesi).map(e => [e.id, e])) : new Map();
  const mie = REG.dati.eventi.filter(r => r.canale==='calendario' && fsRiga(r)===C.fonte && !r.ritiro && r.chiave);
  const perChiave = new Map(mie.map(r => [r.chiave, r])), nelFile = new Set(righe.map(R => R.chiave));
  righe.forEach(R => { const r = perChiave.get(R.chiave), ev = r && vivi.get(r.id); if(!ev || !R.f) return;
    const nuovo = R.f, uguale = ev.titolo===nuovo.titolo.trim() && ev.inizio===nuovo.inizio && (ev.fine||'')===(nuovo.fine||'') && (ev.luogo||'')===nuovo.luogo.trim() && (!nuovo.pos || (Math.abs(ev.lat-nuovo.pos.lat)<1e-5 && Math.abs(ev.lng-nuovo.pos.lng)<1e-5));
    if(uguale){ R.stato = 'pubblicata'; R.codice = r.codice; R.motivi = []; return; }
    /* cambiato nel calendario: torna come correzione, con ciò che la Redazione aveva già scritto */
    Object.assign(nuovo, {id:ev.id, desc:ev.descrizione||'', strato:ev.strato, sub:ev.sottostrato||'', tema:ev.tema||'', comeArrivare:ev.descrizione_luogo||'', organizzatore:nuovo.organizzatore || ev.organizzatore || ''});
    nuovo.g = giudizioInForma(r.g); R.correzione = true; R.note.push(tr('già pubblicato: nel calendario è cambiato, si pubblica come correzione'));
  });
  return mie.filter(r => !nelFile.has(r.chiave) && vivi.has(r.id)).map(r => ({id:r.id, codice:r.codice, titolo:vivi.get(r.id).titolo, inizio:vivi.get(r.id).inizio}));
}

/* ---------- Le schermate ---------- */
/* che cosa manca a una fonte per importarne il calendario (§ 6.4) */
function calendarioChiuso(fo){
  if(!fo) return [tr('scegli la fonte del calendario nel registro')];
  if(fo.tipo!=='calendario') return [tr('la fonte non è di tipo «calendario in dati aperti»')];
  if(fo.licenzaTipo==='condivisione') return [tr('la licenza impone di condividere alle stesse condizioni: questo calendario non si importa in blocco, i suoi eventi si inseriscono a mano, uno per uno (§ 6.4, punto 3)')];
  const m = [];
  if(!fonteAmmessa(fo)) m.push(tr('una fonte ammessa: {c} non lo è',{c:fo.codice}));
  if(!LICENZE_CAL[fo.licenzaTipo]) m.push(tr('la licenza del calendario'));
  const senza = SETTE_PUNTI.filter(([n]) => !(fo.punti||{})[n]).map(x => x[0]);
  if(senza.length) m.push(senza.length===1 ? tr('la data del punto {l} dei sette',{l:senza[0]}) : tr('la data dei punti {l} dei sette',{l:senza.join(', ')}));
  if(fonteDaRicontrollare(fo)) m.push(tr('condizioni del sito rilette negli ultimi dodici mesi'));
  return m;
}
function apriCalendari(){
  CAL.stato = {fase:'scegli', fonte:'', errore:''}; PB.errore = ''; PB.msg = ''; apri('pb-calendario');
  Promise.all([regApri(), PB.stato ? null : aggiornaPb().catch(() => null)]).then(() => { if(st.foglio==='pb-calendario') disegnaFoglio(); });
}
function fPbCalendario(){
  const C = CAL.stato, testa = `<div class="riga-titolo"><div><h2>${tr('Calendari dei Comuni')}</h2><p class="meta">${tr('Calendari pubblicati come dati aperti · § 6.4')}</p></div>${chiudiBtn('pubblica')}</div>`;
  if(!C) return foglio('forte', testa, '');
  const s = statoRegistro(); if(s) return foglio('forte', testa, `<p class="meta" role="status">${esc(s)}</p>`);
  const cal = REG.dati.fonti.filter(f => f.tipo==='calendario'), fo = regFonte(C.fonte), chiuso = calendarioChiuso(fo);
  if(C.fase==='leggo') return foglio('forte', testa, `<p class="caricamento">${tr('Leggo il calendario…')}</p>`);
  if(C.fase==='mappa') return foglio('forte alto', testa, mappaHtml(C, fo));
  const corpo = `${C.errore ? `<p class="err" role="alert">${esc(C.errore)}</p>` : ''}${statoPb()}
    <p class="meta">${tr('Si importano in blocco soltanto i calendari che i Comuni pubblicano come dati aperti. Il file si scarica dal sito o dal portale del Comune con questo dispositivo, in formato CSV, JSON o iCalendar (.ics): l’app non lo chiede alla rete. Ogni evento passa poi dall’anteprima, come le righe del file Excel.')}</p>
    ${cal.length ? `<div class="stack-s"><label class="etich" for="cal-fonte">${tr('Fonte del calendario nel registro')}</label><div class="campo"><select id="cal-fonte" data-calcampo="fonte"><option value="">${tr('— Scegli —')}</option>${cal.map(f => `<option value="${esc(f.codice)}" ${C.fonte===f.codice?'selected':''}>${esc(etichettaFonte(f))}</option>`).join('')}</select></div></div>`
      : `<p class="meta">${tr('Nel registro non c’è ancora nessuna fonte di tipo «calendario in dati aperti». Aggiungila dall’elenco delle fonti, con la licenza e i sette punti.')}</p>`}
    ${fo && chiuso.length ? `<div class="red-riquadro pb-errori" role="alert"><b>${tr('L’importazione è chiusa. Manca:')}</b>${chiuso.map(x => `<span class="err">${esc(x)}</span>`).join('')}<button class="link" data-pbfonte="${esc(fo.codice)}">${tr('Apri la fonte {c}',{c:fo.codice})}</button></div>` : ''}
    ${fo && !chiuso.length ? `<p class="meta">${tr('Nel campo «Fonte:» di ogni evento: «{a}».',{a:esc(fo.attribuzione || fo.nome)})}</p>` : ''}
    <div class="tasti"><button class="tasto sec" data-az="pb-fonti">${tr('Fonti')}</button><button class="tasto pri" data-az="cal-file" ${fo && !chiuso.length ? '' : 'disabled'}>${tr('Scegli il file del calendario')}</button></div>`;
  return foglio('forte alto', testa, corpo);
}
function leggiFileCalendario(file){
  const C = CAL.stato; if(!C) return;
  C.fase = 'leggo'; C.errore = ''; C.nome = String(file.name||''); apri('pb-calendario');
  leggiCalendario(file).then(x => {
    if(CAL.stato!==C) return;
    if(!x.record.length){ C.fase = 'scegli'; C.errore = tr('Nel file non trovo eventi: controlla che sia il calendario in formato CSV, JSON o iCalendar.'); disegnaFoglio(); return; }
    const fo = regFonte(C.fonte);
    C.tipo = x.tipo; C.record = x.record; C.colonne = [...new Set(x.record.slice(0, 200).flatMap(r => Object.keys(r)))].slice(0, 200);
    C.mappa = x.tipo==='ics' ? Object.assign({}, MAPPA_ICS) : mappaProposta(C.colonne, fo && fo.mappa);
    C.scelte = {strato:'', dieci:'', nomi:'', politico:'', avviso:''}; C.fase = 'mappa'; disegnaFoglio();
  }).catch(e => { if(CAL.stato!==C) return; C.fase = 'scegli';
    C.errore = e && e.motivo==='protetto' ? tr('Il file si apre con una password: salvalo senza password e riprova.') : e && e.motivo==='righe' ? tr('Il calendario ha più di 10.000 eventi: dividilo in più file.') : tr('Il file non si legge: controlla che sia un calendario in formato CSV, JSON o iCalendar (.ics).');
    disegnaFoglio(); });
}
function mappaHtml(C, fo){
  const ics = C.tipo==='ics', r0 = C.record[0]||{}, val = k => { const c = C.mappa[k]; if(!c) return ''; const v = r0[c]; return v && typeof v==='object' ? v.v : v==null ? '' : String(v); };
  const mappa = ics ? `<p class="meta">${tr('File iCalendar: i campi sono quelli dello standard (titolo da SUMMARY, inizio e fine da DTSTART e DTEND, luogo da LOCATION, punto da GEO, collegamento da URL, identificativo da UID).')}</p>`
    : `<p class="meta">${tr('Per ogni campo, la colonna del file che lo porta. L’app propone una corrispondenza dai nomi delle colonne e la ricorda per questa fonte. Accanto, il valore del primo evento.')}</p>
      ${CAMPI_CAL.map(([k, lab, serve]) => `<div class="stack-s"><label class="etich" for="cal-m-${k}">${esc(tr(lab))}${serve ? '' : ` <span class="fac">${tr('facoltativo')}</span>`}</label><div class="campo"><select id="cal-m-${k}" data-calmappa="${k}"><option value="">${tr('— Nessuna —')}</option>${C.colonne.map(c => `<option value="${esc(c)}" ${C.mappa[k]===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div>${C.mappa[k] ? `<span class="meta">${tr('Primo evento: {v}',{v:esc(val(k).slice(0, 120) || '—')})}</span>` : ''}</div>`).join('')}`;
  const S = C.scelte, sel = (id, k, lab, voci, nota) => `<div class="stack-s"><label class="etich" for="${id}">${lab}</label><div class="campo"><select id="${id}" data-calscelta="${k}"><option value="">${tr('— Scegli —')}</option>${voci.map(([v, t]) => `<option value="${esc(v)}" ${S[k]===v?'selected':''}>${esc(t)}</option>`).join('')}</select></div>${nota ? `<span class="meta">${nota}</span>` : ''}</div>`;
  const manca = (ics ? [] : CAMPI_CAL.filter(x => x[2] && !C.mappa[x[0]]).map(x => tr(x[1]))).concat(!S.strato ? [tr('lo strato')] : [], !S.dieci ? [tr('le dieci domande')] : [], !S.nomi ? [tr('i nomi di persone')] : [], !S.politico ? [tr('evento politico o religioso')] : [], !S.avviso ? [tr('l’avviso all’organizzatore')] : []);
  return `${statoPb()}<p>${tr('{n} eventi nel file «{f}».',{n:C.record.length, f:esc(C.nome)})}</p>${mappa}
    <h3 class="g-tit">${tr('Per tutte le righe di questa importazione')}</h3>
    <p class="meta">${tr('Valgono per ogni riga, che poi si guarda una per una e si segna «L’ho vista: pubblicala». Una riga diversa dalle altre si corregge nella sua scheda prima di segnarla.')}</p>
    ${sel('cal-strato', 'strato', tr('Strato'), LAYERS.map(l => [l.id, tr(l.label)]), tr('Le categorie della mappa sono gli strati dell’app, non quelle del calendario (§ 6.3). Se la colonna della categoria porta il nome di uno strato, vale quello.'))}
    ${sel('cal-dieci', 'dieci', tr('Le dieci domande'), [['tutte', tr('Tutte superate, salvo correzioni nella scheda di una riga')], ['riga', tr('Rispondo nella scheda di ogni riga')]])}
    ${sel('cal-nomi', 'nomi', tr('Nomi di persone'), [['no', tr('Nessun nome')], ['si', tr('Sì, con il solo ruolo')]])}
    ${sel('cal-politico', 'politico', tr('Evento politico o religioso'), [['no', tr('No')], ['si', tr('Sì')]])}
    ${sel('cal-avviso', 'avviso', tr('Avviso all’organizzatore'), Object.entries(AVVISI_ORG).filter(([v]) => v!=='inviato').map(([v, t]) => [v, tr(t)]))}
    <p class="meta">${tr('La descrizione del Comune non si pubblica: nella scheda di ogni riga si vede come testo da riscrivere con parole proprie (§ 6.4, punto 5).')}</p>
    ${manca.length ? `<p class="meta" role="status">${tr('Per passare all’anteprima manca: {l}.',{l:esc(manca.join('; '))})}</p>` : ''}
    <div class="tasti"><button class="tasto sec" data-az="cal-annulla">${tr('Annulla')}</button><button class="tasto pri" data-az="cal-anteprima" ${manca.length || PB.lavoro ? 'disabled' : ''}>${tr('Passa all’anteprima')}</button></div>`;
}
function anteprimaCalendario(){
  const C = CAL.stato, fo = C && regFonte(C.fonte); if(!C || !fo || calendarioChiuso(fo).length) return;
  if(C.tipo!=='ics' && JSON.stringify(fo.mappa||{})!==JSON.stringify(C.mappa)){ fo.mappa = Object.assign({}, C.mappa); regSalva().catch(() => {}); }
  const {righe, saltati} = righeDalCalendario(C);
  IX.stato = {nome:C.nome, fase:'cerco', righe, fatti:0, daCercare:0, lavoro:false, errore:'', msg:'', canale:'calendario', fonte:fo.codice, saltati, tolti:confrontaAggiornamento(C, righe)};
  CAL.stato = null; registra('calendario-importa', {n:righe.length, c:fo.codice});
  cercaEValuta(IX.stato);
  apri('pb-importa');
}

/* ---------- Tocchi e campi ---------- */
function azioneCalendari(az){
  switch(az){
    case 'pb-calendari': apriCalendari(); break;
    case 'cal-file': scegliFileRegistro('calendario'); break;
    case 'cal-annulla': apriCalendari(); break;
    case 'cal-anteprima': anteprimaCalendario(); break;
    default: return false;
  }
  return true;
}
function cambioCalendari(el){
  const d = el.dataset, C = CAL.stato; if(!C) return false;
  if(d.calcampo){ C[d.calcampo] = el.value; C.errore = ''; disegnaFoglio(); return true; }
  if(d.calmappa){ if(el.value) C.mappa[d.calmappa] = el.value; else delete C.mappa[d.calmappa]; disegnaFoglio(); return true; }
  if(d.calscelta){ C.scelte[d.calscelta] = el.value; disegnaFoglio(); return true; }
  return false;
}
const importaCalendario = leggiFileCalendario;
