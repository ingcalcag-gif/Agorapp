/* ======================= Registro delle fonti sul dispositivo della redazione (T-041, T-043) =======================
   Libro mastro, cap. 22: il registro prova che ogni evento pubblicato ha un'origine lecita e verificabile. La riga la
   scrive l'app nel momento in cui la Redazione pubblica (§ 3.4), con le colonne di fatto che l'app conosce e con le
   colonne di giudizio compilate nella scheda di pubblicazione (scheda-pubblicazione.js).

   Qui sta ciò che il registro tiene sul dispositivo, in una sola voce cifrata (red_registro, nella base di dati del
   browser): le fonti (foglio «Fonti», codici FS: decisione del 24/11/2026, l'elenco lo tiene l'app), le righe degli
   eventi (foglio «Eventi»; i codici F li dà lo sportello) e gli eventi preparati e non ancora pubblicati. La voce è una busta cifrata con
   la chiave del registro, diversa dalla firma (la legge e la scrive il modulo delle chiavi, sorgenti/moduli/chiavi.js): senza quella chiave non si legge nulla, e
   in chiaro il registro esiste soltanto nella memoria della pagina, finché l'app è aperta.

   Nel registro le persone fisiche non compaiono con il nome (§ 18.5): una fonte che è una persona si scrive con il
   codice P, e il titolo di un evento si annota con il ruolo al posto del nome. I codici non si riusano mai. Per ora
   l'elenco delle fonti sta sul solo dispositivo che lo scrive: con un secondo dispositivo le fonti si riportano con
   l'importazione del registro (T-043).

   Testi come testo (T-024): nomi delle fonti, titoli e note entrano nella pagina solo con esc(). */
const TIPI_FONTE = [['organizzatore', 'Organizzatore che scrive alla Redazione', '1'], ['sito', 'Sito dell’organizzatore', '2'], ['social', 'Pagina ufficiale su un social network', '2'],
  ['istituzionale', 'Sito istituzionale', '3'], ['calendario', 'Calendario in dati aperti', '3'], ['testata', 'Testata o comunicato', '4']];
const GRADI_FONTE = {'1':'Grado 1', '2':'Grado 2', '3':'Grado 3', '4':'Grado 4', esclusa:'Esclusa'};
const ESITI_FONTE = {ammessa:'Ammessa', attribuzione:'Ammessa con attribuzione', vietata:'Non ammessa: vieta il riuso, si cerca l’organizzatore', esclusa:'Esclusa'};
const CODICE_P = /^P-\d{4,}$/, CODICE_C = /^C-\d{4,}$/, CODICE_K = /^K-\d{4,}$/;
const REG = {dati:null, stato:'', attesa:null};   /* stato: '' (da aprire), 'aperto', 'chiavi' (mancano le chiavi), 'illeggibile' (scritto con altre chiavi) */
const regVuoto = () => ({v:1, fonti:[], eventi:[], preparati:[], prossimi:{fs:1, p:1}});
const testoReg = (x, max) => typeof x==='string' ? x.slice(0, max||500) : '';
/* ciò che esce dalla busta si rimette in forma: elenchi veri, testi veri, contatori che non tornano mai indietro */
function regInForma(d){
  const o = regVuoto(); if(!d || typeof d!=='object') return o;
  ['fonti', 'eventi', 'preparati'].forEach(k => { if(Array.isArray(d[k])) o[k] = d[k].filter(x => x && typeof x==='object'); });
  o.fonti.forEach(f => { ['codice', 'nome', 'tipo', 'grado', 'indirizzo', 'lette', 'esito', 'licenza', 'attribuzione'].forEach(k => { f[k] = testoReg(f[k]); }); });
  const p = d.prossimi||{}, num = (pre, l) => l.reduce((m, x) => { const n = parseInt(String(x.codice||'').replace(pre, ''), 10); return n>=m ? n+1 : m; }, 1);
  o.prossimi = {fs:Math.max(+p.fs||1, num('FS-', o.fonti)), p:Math.max(+p.p||1, num('PR-', o.preparati))};
  return o;
}
/* apre il registro una volta sola; chi arriva mentre si apre aspetta la stessa lettura */
function regApri(){
  if(REG.stato==='aperto') return Promise.resolve(REG.dati);
  if(REG.attesa) return REG.attesa;
  REG.attesa = CHIAVI.registro.leggi().then(t => t==null ? regVuoto() : regInForma(JSON.parse(t)))
    .then(d => { REG.dati = d; REG.stato = 'aperto'; return d; }, e => { REG.dati = null; REG.stato = e && e.motivo==='mancano' ? 'chiavi' : 'illeggibile'; return null; })
    .then(d => { REG.attesa = null; return d; });
  return REG.attesa;
}
/* cifra e scrive; un registro che non si è riusciti a leggere non si sovrascrive mai */
function regSalva(){
  if(REG.stato!=='aperto' || !REG.dati) return Promise.reject(new Error('registro'));
  return CHIAVI.registro.scrivi(JSON.stringify(REG.dati));
}
const regCodice = (pre, n, cifre) => pre+'-'+String(n).padStart(cifre, '0');
const regFonte = c => REG.dati ? REG.dati.fonti.find(f => f.codice===c) || null : null;
const regRiga = id => REG.dati ? REG.dati.eventi.find(r => r.id===id) || null : null;
const tipoFonte = t => TIPI_FONTE.find(x => x[0]===t) || null;
/* il prossimo controllo delle condizioni: dodici mesi dopo l'ultimo (cap. 22, foglio «Fonti») */
const prossimoControllo = f => /^\d{4}-\d{2}-\d{2}$/.test(f.lette||'') ? (+f.lette.slice(0,4)+1)+f.lette.slice(4) : '';
const fonteAmmessa = f => !!f && (f.esito==='ammessa' || f.esito==='attribuzione') && f.grado!=='esclusa';
const fonteDaRicontrollare = f => { const p = prossimoControllo(f); return !!p && p <= oggi(); };
const etichettaFonte = f => f.codice+' · '+f.nome+(GRADI_FONTE[f.grado] ? ' · '+tr(GRADI_FONTE[f.grado]).toLowerCase() : '');
const statoRegistro = () => REG.stato==='chiavi' ? tr('Per il registro delle fonti servono le chiavi della Redazione: Strumenti della redazione → Chiavi.')
  : REG.stato==='illeggibile' ? tr('Il registro delle fonti su questo dispositivo è scritto con altre chiavi e non si legge: ripristina le chiavi dalla copia di riserva (Strumenti della redazione → Chiavi). Finché non si legge, non si tocca.')
  : REG.stato==='aperto' ? '' : tr('Apro il registro delle fonti…');

/* ---------- Le fonti (foglio «Fonti», codici FS) ---------- */
function fPbFonti(){
  const torna = st.aform ? 'aform' : 'pubblica';
  const testa = `<div class="riga-titolo"><div><h2>${tr('Fonti')}</h2><p class="meta">${tr('Registro delle fonti · una riga per sito, pagina o calendario')}</p></div>${chiudiBtn(torna==='aform' ? 'g-torna' : 'pubblica')}</div>`;
  const s = statoRegistro(); if(s) return foglio('forte', testa, `<p class="meta" role="status">${esc(s)}</p>`);
  const F = REG.dati.fonti;
  const nota = f => !fonteAmmessa(f) ? tr('non ammessa') : fonteDaRicontrollare(f) ? tr('condizioni da rileggere') : tr('condizioni lette il {d}',{d:f.lette ? dIso(f.lette).toLocaleDateString(dloc(), {day:'numeric', month:'short', year:'numeric'}) : '–'});
  const corpo = `${statoPb()}
    <p class="meta">${tr('Prima di usare un sito se ne leggono le condizioni, le note legali o la licenza: se vieta il riuso non si usa, e si cerca l’organizzatore. Qui si annota l’esito, una volta per fonte; nella scheda dell’evento si sceglie la fonte da questo elenco.')}</p>
    <div class="tasti"><button class="tasto pri" data-az="pb-fonte-nuova">${tr('Nuova fonte')}</button></div>
    ${F.length ? `<div class="menu-lista">${F.map(f => `<button class="menu-r" data-pbfonte="${esc(f.codice)}"><div><span class="t">${esc(f.codice)} · ${esc(f.nome)}</span><span class="meta">${esc(tr((tipoFonte(f.tipo)||['', '—'])[1]))} · ${esc(tr(GRADI_FONTE[f.grado]||'—').toLowerCase())} · ${esc(nota(f))}</span></div>${freccia}</button>`).join('')}</div>`
      : `<p class="meta">${tr('Non c’è ancora nessuna fonte: la prima nasce con «Nuova fonte» e prende il codice FS-0001.')}</p>`}`;
  return foglio('forte alto', testa, corpo);
}
function apriFonte(codice){
  const f = codice ? regFonte(codice) : null;
  PB.fonte = Object.assign({codice:null, nome:'', tipo:'', grado:'', indirizzo:'', lette:oggi(), esito:'', licenza:'', attribuzione:'', errori:[]}, f ? JSON.parse(JSON.stringify(f)) : {}, {errori:[]});
  PB.errore = ''; PB.msg = ''; apri('pb-fonte');
}
function fPbFonte(){
  const f = PB.fonte, testa = `<div class="riga-titolo"><div><h2>${f && f.codice ? esc(f.codice) : tr('Nuova fonte')}</h2><p class="meta">${tr('Registro delle fonti, foglio «Fonti»')}</p></div>${chiudiBtn('pb-fonti')}</div>`;
  if(!f) return foglio('forte', testa, '');
  const fac = tr('facoltativo'), campo = (id, lab, html, nota) => `<div class="stack-s"><label class="etich" for="${id}">${lab}</label>${html}${nota?`<span class="meta">${nota}</span>`:''}</div>`;
  const testo = (id, c, lab, max, segna, nota, tipo) => campo(id, lab, `<div class="campo"><input id="${id}" data-fcampo="${c}" maxlength="${max}" value="${esc(f[c])}" placeholder="${esc(segna||'')}" autocomplete="off"${tipo?` type="${tipo}"`:''}></div>`, nota);
  const scelta = (id, c, lab, voci, nota) => campo(id, lab, `<div class="campo"><select id="${id}" data-fcampo="${c}"><option value="">${tr('— Scegli —')}</option>${voci.map(([v, t]) => `<option value="${esc(v)}" ${f[c]===v?'selected':''}>${esc(tr(t))}</option>`).join('')}</select></div>`, nota);
  const corpo = `
    ${testo('fo-nome', 'nome', tr('Nome della fonte'), 120, tr('Ente, organizzatore o testata'), tr('Una persona fisica non si scrive con il nome: si scrive il suo codice P dell’anagrafica dei registri, per esempio «P-0007».'))}
    ${scelta('fo-tipo', 'tipo', tr('Tipo'), TIPI_FONTE.map(x => [x[0], x[1]]))}
    ${scelta('fo-grado', 'grado', tr('Grado'), Object.entries(GRADI_FONTE), tr('1: l’organizzatore che chiede la pubblicazione · 2: il suo sito o la sua pagina ufficiale · 3: il sito istituzionale dell’ente · 4: testate e comunicati · esclusi: aggregatori, gruppi, contenuti leggibili solo con un account, storie, segnalazioni di privati.'))}
    ${testo('fo-indirizzo', 'indirizzo', `${tr('Indirizzo')} <span class="fac">${fac}</span>`, 500, 'https://', tr('Il collegamento alla fonte. Per un organizzatore che scrive alla Redazione può mancare.'), 'url')}
    ${testo('fo-lette', 'lette', tr('Condizioni lette il'), 10, '', tr('Il giorno in cui hai letto le condizioni, le note legali o la licenza del sito. Dopo dodici mesi l’app chiede di rileggerle.'), 'date')}
    ${scelta('fo-esito', 'esito', tr('Esito'), Object.entries(ESITI_FONTE))}
    ${testo('fo-licenza', 'licenza', `${tr('Licenza del calendario')} <span class="fac">${fac}</span>`, 120, tr('Solo per i calendari in dati aperti'), tr('Il nome della licenza, oppure «nessuna licenza».'))}
    ${testo('fo-attr', 'attribuzione', `${tr('Attribuzione richiesta')} <span class="fac">${fac}</span>`, 160, '', tr('Il testo che la licenza chiede di mostrare: va nel campo «Fonte:» dell’evento.'))}
    ${f.errori.length ? `<div class="red-riquadro pb-errori" role="alert"><b>${tr('Per salvare la fonte:')}</b>${f.errori.map(x => `<span class="err">${esc(x)}</span>`).join('')}</div>` : ''}
    ${statoPb()}
    <div class="tasti"><button class="tasto sec" data-az="pb-fonti">${tr('Annulla')}</button><button class="tasto pri" data-az="pb-fonte-salva">${f.codice ? tr('Salva la fonte') : tr('Aggiungi la fonte')}</button></div>
    <p class="meta">${tr('Una fonte non si cancella: il suo codice resta legato agli eventi pubblicati. Se un sito non si può più usare, cambia l’esito in «Non ammessa» o «Esclusa».')}</p>`;
  return foglio('forte alto', testa, corpo);
}
function salvaFonte(){
  const f = PB.fonte; if(!f || PB.lavoro) return;
  const e = [], nome = f.nome.trim(), ind = f.indirizzo.trim();
  if(!nome) e.push(tr('Nome della fonte: scrivilo.'));
  if(!tipoFonte(f.tipo)) e.push(tr('Tipo: scegline uno.'));
  if(!GRADI_FONTE[f.grado]) e.push(tr('Grado: scegline uno.'));
  if(ind && !MODULI.testo.collegamento(ind)) e.push(tr('Indirizzo: deve cominciare con https:// (oppure lascialo vuoto).'));
  if(!ind && f.tipo && f.tipo!=='organizzatore') e.push(tr('Indirizzo: per questo tipo di fonte serve il collegamento.'));
  if(!/^\d{4}-\d{2}-\d{2}$/.test(f.lette) || f.lette > oggi()) e.push(tr('Condizioni lette il: scegli il giorno, non nel futuro.'));
  if(!ESITI_FONTE[f.esito]) e.push(tr('Esito: scegline uno.'));
  if(f.grado==='esclusa' && f.esito!=='esclusa' && ESITI_FONTE[f.esito]) e.push(tr('Una fonte di grado «Esclusa» ha l’esito «Esclusa».'));
  f.errori = e; if(e.length){ disegnaFoglio(); return; }
  const d = REG.dati, v = {nome, tipo:f.tipo, grado:f.grado, indirizzo:ind, lette:f.lette, esito:f.esito, licenza:f.licenza.trim(), attribuzione:f.attribuzione.trim()};
  let x = f.codice ? regFonte(f.codice) : null;
  if(x) Object.assign(x, v); else { x = Object.assign({codice:regCodice('FS', d.prossimi.fs++, 4)}, v); d.fonti.push(x); }
  PB.lavoro = true; disegnaFoglio();
  regSalva().then(() => { PB.lavoro = false; registra(f.codice ? 'fonte-corretta' : 'fonte-nuova', {c:x.codice}); PB.fonte = null;
      /* dalla scheda di un evento: la fonte appena aggiunta è già scelta */
      if(st.aform && st.aform.g && !f.codice){ st.aform.g.fonte = x.codice; fonteScelta(st.aform); }
      PB.msg = tr('Fonte {c} salvata.',{c:x.codice}); apri('pb-fonti'); },
    () => { PB.lavoro = false; if(!f.codice){ d.fonti.pop(); d.prossimi.fs--; } PB.errore = tr('Non sono riuscito a salvare il registro delle fonti su questo dispositivo.'); disegnaFoglio(); });
}

/* ---------- Le righe degli eventi (foglio «Eventi», codici F) ----------
   Le righe di una pubblicazione si preparano prima di partire: viaggiano cifrate nello stesso pacchetto firmato
   dell'evento (decisione del 24/11/2026), lo sportello le conserva nel riservato senza poterle leggere e dà a ogni
   evento nuovo il suo codice F. Diventano del registro di questo dispositivo solo quando lo sportello accetta: se
   rifiuta, la riga non nasce. Una correzione aggiorna le colonne di giudizio e lascia la data della prima
   pubblicazione; un ritiro prima della fine annota data e motivo. Se l'evento era stato pubblicato da un altro
   dispositivo, qui la riga nasce senza la data della prima pubblicazione: la ritrova l'importazione delle righe
   dallo sportello (T-043). */
const CINQUE_ANNI = 5;
const scadenzaRiga = iso => { const d = new Date(iso); if(!iso || isNaN(d)) return ''; d.setFullYear(d.getFullYear()+CINQUE_ANNI); return d.toISOString().slice(0,10); };
/* cambi: [{ev, g, titolo, canale}] per pubblicare o correggere; [{id, ritiro}] per un ritiro. → {busta, nuovo, quando} o null */
function regPrepara(cambi){
  if(REG.stato!=='aperto' || !REG.dati) return Promise.reject(new Error('registro'));
  const nuovo = JSON.parse(JSON.stringify(REG.dati)), quando = new Date().toISOString(), righe = [], fonti = new Map();
  for(const c of cambi){
    if(c.ev){
      const ev = c.ev, fatti = {titolo:testoReg(c.titolo||ev.titolo, 200), testoFonte:ev.fonte.testo, collegamento:ev.fonte.collegamento||'', g:JSON.parse(JSON.stringify(c.g))};
      let r = nuovo.eventi.find(x => x.id===ev.id);
      if(r) Object.assign(r, fatti, {corretto:quando});
      else { r = Object.assign({codice:'', id:ev.id, quando:c.correzione ? '' : quando, corretto:c.correzione ? quando : '', nascosto:false, canale:c.canale||'singolo', funzione:'Redazione eventi', ritiro:null, scadenza:c.correzione ? '' : scadenzaRiga(quando)}, fatti); nuovo.eventi.push(r); }
      righe.push(r);
      const fo = nuovo.fonti.find(f => f.codice===c.g.fonte); if(fo) fonti.set(fo.codice, fo);
    } else if(c.ritiro){
      const r = nuovo.eventi.find(x => x.id===c.id); if(!r) continue;
      r.ritiro = {data:quando, motivo:c.ritiro}; righe.push(r);
    }
  }
  if(!righe.length) return Promise.resolve(null);
  /* nella busta: le righe di questa pubblicazione e le fonti che citano, com'erano in quel momento */
  return CHIAVI.registro.cifra(JSON.stringify({v:1, quando, righe, fonti:[...fonti.values()]})).then(busta => ({busta, nuovo, quando}));
}
/* lo sportello ha accettato: i codici F che ha dato entrano nelle righe, e il registro del dispositivo diventa quello nuovo */
function regConferma(prep, codici){
  if(!prep) return Promise.resolve();
  Object.entries(codici||{}).forEach(([id, c]) => { const r = prep.nuovo.eventi.find(x => x.id===id); if(r && /^F-\d{5,}$/.test(c)) r.codice = c; });
  REG.dati = prep.nuovo; return regSalva();
}
