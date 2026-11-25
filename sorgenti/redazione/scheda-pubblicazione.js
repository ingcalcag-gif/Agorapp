/* ======================= Scheda di pubblicazione dell'evento singolo (T-041) =======================
   Libro mastro: § 2.2, canale 1; § 3.4 (le dieci domande); §§ 3.5-3.6; §§ 5.1-5.4; § 11.3; cap. 22, regola 1 («Senza
   le colonne di giudizio l'app non pubblica»); § 12.1, regola 1 (le decisioni restano alle persone: qui non c'è nessun
   aiuto di intelligenza artificiale); allegato A, A.2.

   Il modulo dell'evento (pubblicazione.js) porta i campi pubblici; questa parte gli aggiunge:
   - le colonne di giudizio del registro delle fonti: la fonte (codice FS, scelta dall'elenco delle fonti), la data
     di consultazione, il post leggibile senza account, l'esito delle dieci domande, gli elementi ripresi e i nomi
     con il solo ruolo, l'evento politico o religioso, l'avviso all'organizzatore, la prova del consenso;
   - i controlli prima di pubblicare: recapiti nei testi (chiocciola, «+39», «tel.», numeri lunghi), parole da non
     usare per eventi soltanto ripresi, immagini, evento già cominciato. Un avviso non decide nulla: chiede a chi
     pubblica di guardare e di confermare;
   - gli eventi preparati: una scheda si può salvare e riprendere più tardi; resta nel registro cifrato del
     dispositivo finché non si pubblica o non si toglie.
   Finché le colonne di giudizio non sono complete «Pubblica» resta spento, e sotto il tasto c'è scritto che cosa manca.

   Le colonne di giudizio non entrano mai nell'evento pubblico (il formato non ha un campo per loro): vanno nella riga
   del registro, che nasce quando lo sportello accetta la pubblicazione (registro-fonti.js).

   Testi come testo (T-024): ciò che viene dal registro o dal modulo entra nella pagina solo con esc(). */
const DIECI_DOMANDE = [
  [1, 'La fonte è verificabile ora, con un collegamento funzionante?', ['stop']],
  [2, 'La fonte è accessibile senza registrazione o accesso riservato?', ['stop']],
  [3, 'La fonte è stabile, e non un contenuto destinato a sparire in poche ore?', ['stop']],
  [4, 'La fonte è dell’organizzatore, di un ente o di una testata?', ['stop']],
  [5, 'Si riprendono solo informazioni sull’evento, e non sulle persone?', ['stop']],
  [6, 'Le persone nominate agiscono in una veste pubblica (relatori, artisti) e nessuna è un minore?', ['omesso', 'consenso']],
  [7, 'Il testo è riscritto con parole proprie e senza immagini altrui?', ['riscritto', 'stop']],
  [8, 'Mancano recapiti personali?', ['tolti', 'stop']],
  [9, 'L’organizzatore ha scelto di rendere pubblico l’evento?', ['consenso', 'stop']],
  [10, 'Il luogo è pubblico o aperto al pubblico, e nulla nella fonte indica che l’evento si svolga in modo irregolare?', ['consenso', 'stop']]];
const RISPOSTE_DOMANDA = {si:'Sì', stop:'No: non si pubblica', omesso:'No: ho omesso il nome (sempre, se è un minore)', consenso:'No: c’è il consenso diretto', riscritto:'No: ora l’ho riscritto', tolti:'No: ora li ho tolti'};
const CORREZIONI_DOMANDA = {omesso:'nome omesso', consenso:'consenso diretto', riscritto:'testo riscritto', tolti:'recapiti tolti'};
const ELEMENTI_RIPRESI = [['titolo', 'Titolo'], ['data', 'Data'], ['ora', 'Ora'], ['luogo', 'Luogo'], ['descrizione', 'Descrizione riscritta']];
const AVVISI_ORG = {nessuno:'Nessun recapito di lavoro noto', dopo:'Recapito noto: l’avviso parte dopo la pubblicazione', inviato:'Avviso già inviato'};
const giudizioNuovo = () => ({fonte:'', consultazione:oggi(), post:'', dom:{}, elementi:{titolo:1, data:1, ora:1, luogo:1, descrizione:1}, nomi:'', ruoli:'', titoloReg:'', politico:'', avviso:'', avvisoData:'', avvisoCanale:'', k:'', consenso:'', visti:{}});
/* un giudizio letto dal registro o da una scheda preparata torna nella forma di giudizioNuovo() */
function giudizioInForma(g){
  const o = giudizioNuovo(); if(!g || typeof g!=='object') return o;
  ['fonte', 'consultazione', 'post', 'nomi', 'ruoli', 'titoloReg', 'politico', 'avviso', 'avvisoData', 'avvisoCanale', 'k', 'consenso'].forEach(k => { if(typeof g[k]==='string') o[k] = g[k].slice(0, 200); });
  DIECI_DOMANDE.forEach(([n, , no]) => { const v = g.dom && g.dom[n]; if(v==='si' || no.includes(v)) o.dom[n] = v; });
  if(g.elementi && typeof g.elementi==='object') ELEMENTI_RIPRESI.forEach(([k]) => { o.elementi[k] = g.elementi[k] ? 1 : 0; });
  if(g.visti && typeof g.visti==='object') Object.keys(g.visti).slice(0, 8).forEach(k => { if(typeof g.visti[k]==='string') o.visti[k] = g.visti[k].slice(0, 400); });
  if(typeof g.domFile==='string' && g.domFile) o.domFile = g.domFile.slice(0, 200);
  if(g.daFile) o.daFile = true;
  return o;
}
/* l'esito delle dieci domande come lo vuole la colonna del registro */
function esitoDomande(g){
  if(g.domFile) return g.domFile;   /* una riga del file d'importazione: l'esito com'è scritto nel file */
  const no = DIECI_DOMANDE.filter(([n]) => g.dom[n] && g.dom[n]!=='si');
  return no.length ? no.map(([n]) => n+': '+(CORREZIONI_DOMANDA[g.dom[n]]||'non si pubblica')).join('; ') : 'Tutte superate';
}
const serveConsenso = g => DIECI_DOMANDE.some(([n]) => g.dom[n]==='consenso') || g.domFile==='Consenso diretto chiesto' || (g.politico==='si' && g.nomi==='si');

/* ---------- Controlli prima di pubblicare (§ 5.2; allegato A, A.2) ---------- */
const TESTI_SCHEDA = f => [f.titolo, f.desc, f.comeArrivare, f.organizzatore, f.luogo, f.prezzo, f.fonte].map(x => String(x||''));
const RECAPITI = [/[^\s@]*@[^\s@]*/g, /\+\s?39[\d .\-]*/g, /\b(?:tel|cell|telefono|whatsapp)\b\.?:?\s*[\d .\-+]*/gi, /\b\d(?:[ .\-]?\d){8,}\b/g];
const PAROLE_DA_EVITARE = /\b(?:verificat[oaie]|ufficial[ei]|autorizzat[oaie]|in regola|sicur[oaie]|a norma)\b/gi;
const IMMAGINI = /data:image|\bhttps?:\/\/\S+\.(?:jpe?g|png|gif|webp|svg|avif)\b/i;
const corrispondenze = (testi, regole) => { const o = []; testi.forEach(t => regole.forEach(r => { (t.match(r)||[]).forEach(x => { x = x.trim(); if(x && !o.includes(x)) o.push(x); }); })); return o; };
/* gli avvisi di questa scheda: ognuno con la sua firma, cioè le parole che l'hanno fatto nascere. La conferma vale
   finché la firma resta la stessa: se il testo cambia e l'avviso con lui, va guardato di nuovo. */
function avvisiScheda(f){
  const a = [], testi = TESTI_SCHEDA(f);
  const rec = corrispondenze(testi, RECAPITI);
  if(rec.length) a.push({k:'recapiti', firma:rec.join(' | '), tit:tr('Nei testi sembra esserci un recapito'), testo:tr('Trovato: {l}. I recapiti personali non si pubblicano mai (§ 3.5): toglili. Il recapito di una biglietteria o di un ente può restare.',{l:rec.slice(0, 6).join(' · ')}), ok:tr('Ho controllato: non è un recapito personale')});
  const par = corrispondenze([f.titolo, f.desc, f.comeArrivare].map(x => String(x||'')), [PAROLE_DA_EVITARE]).map(x => x.toLowerCase()).filter((x, i, l) => l.indexOf(x)===i);
  if(par.length) a.push({k:'parole', firma:par.join(' | '), tit:tr('Parole da non usare per un evento soltanto ripreso'), testo:tr('Trovato: {l}. Queste parole promettono un controllo che la Redazione non ha fatto (§ 5.2; § 9.4): riscrivi la frase. Possono restare solo se fanno parte del nome dell’evento o del luogo.',{l:par.map(x => '«'+x+'»').join(', ')}), ok:tr('Ho controllato: è il nome dell’evento o del luogo')});
  const ini = f.inizio ? FORMATO.istante(f.inizio) : null;
  if(ini!=null && ini < Date.now()) a.push({k:'cominciato', firma:f.inizio, tit:tr('L’evento è già cominciato'), testo:tr('L’inizio è nel passato. Va bene per una mostra o una rassegna ancora in corso; altrimenti controlla la data.'), ok:tr('Ho controllato: è ancora in corso')});
  return a;
}
const avvisoVisto = (f, x) => f.g.visti[x.k]===x.firma;

/* ---------- Che cosa manca per accendere «Pubblica» ---------- */
function giudizioManca(f){
  const g = f.g, m = [], fo = regFonte(g.fonte);
  if(REG.stato!=='aperto') return [statoRegistro()];
  if(!fo) m.push(tr('la fonte nel registro'));
  else {
    if(!fonteAmmessa(fo)) m.push(tr('una fonte ammessa: {c} non lo è',{c:fo.codice}));
    if(fo.tipo!=='organizzatore' && !String(f.fonteLink||'').trim()) m.push(tr('il collegamento alla pagina dell’evento'));
    if(fo.tipo==='social' && g.post!=='si') m.push(tr('il post aperto senza accedere'));
    if(fo.attribuzione && !String(f.fonte||'').includes(fo.attribuzione.trim())) m.push(tr('nel campo «Fonte» l’attribuzione chiesta dalla licenza'));
  }
  if(!/^\d{4}-\d{2}-\d{2}$/.test(g.consultazione) || g.consultazione > oggi()) m.push(tr('la data di consultazione'));
  const senza = DIECI_DOMANDE.filter(([n]) => !g.dom[n]).length, stop = DIECI_DOMANDE.filter(([n]) => g.dom[n]==='stop').map(x => x[0]);
  if(senza && !g.domFile) m.push(senza===10 ? tr('le dieci domande') : tr('{n} delle dieci domande',{n:senza}));
  if(stop.length) m.push(tr('un evento che si può pubblicare: alla domanda {n} hai risposto che non si pubblica',{n:stop.join(', ')}));
  if(!ELEMENTI_RIPRESI.some(([k]) => g.elementi[k])) m.push(tr('gli elementi ripresi'));
  if(g.nomi!=='no' && g.nomi!=='si') m.push(tr('i nomi di persone: sì o no'));
  else if(g.nomi==='si' && !g.ruoli.trim() && !g.daFile) m.push(tr('il ruolo delle persone nominate'));
  if(g.politico!=='no' && g.politico!=='si') m.push(tr('evento politico o religioso: sì o no'));
  if(!AVVISI_ORG[g.avviso]) m.push(tr('l’avviso all’organizzatore'));
  else if(g.avviso==='inviato' && (!/^\d{4}-\d{2}-\d{2}$/.test(g.avvisoData) || !g.avvisoCanale.trim())) m.push(tr('data e canale dell’avviso'));
  if(g.k.trim() && !CODICE_K.test(g.k.trim())) m.push(tr('un codice K scritto come «K-0001»'));
  /* un evento nascosto si pubblica solo con il consenso dell'organizzatore (§ 3.3, passo 4; allegato C, C.2) e non è mai una
     manifestazione (§ 9.2, regola 2) */
  if((serveConsenso(g) || f.nascosto) && !CODICE_C.test(g.consenso.trim())) m.push(g.politico==='si' && g.nomi==='si' ? tr('il codice C del consenso esplicito (evento politico o religioso con nomi)')
    : f.nascosto ? tr('il codice C del consenso dell’organizzatore all’evento nascosto') : tr('il codice C del consenso diretto'));
  else if(g.consenso.trim() && !CODICE_C.test(g.consenso.trim())) m.push(tr('un codice C scritto come «C-0001»'));
  if(f.nascosto && f.strato==='manifestazioni') m.push(tr('un altro strato: un evento nascosto non è mai una manifestazione (§ 9.2)'));
  if(IMMAGINI.test(TESTI_SCHEDA(f).join('\n'))) m.push(tr('un testo senza immagini: nei testi c’è il collegamento a un’immagine'));
  const daVedere = avvisiScheda(f).filter(x => !avvisoVisto(f, x)).length;
  if(daVedere) m.push(daVedere===1 ? tr('la conferma di un avviso') : tr('la conferma di {n} avvisi',{n:daVedere}));
  return m;
}
const testoSpia = m => m.length ? tr('«Pubblica» è spento. Manca: {l}.',{l:m.join('; ')}) : tr('Alla scheda non manca nulla: «Pubblica» è acceso.');
const avvisiHtml = f => avvisiScheda(f).map(x => `<div class="red-riquadro g-avviso" role="note"><b>${esc(x.tit)}</b><span class="meta">${esc(x.testo)}</span>
  <button class="riga-int" data-az="g-visto" data-k="${x.k}" aria-pressed="${avvisoVisto(f, x)}"><span class="casella" aria-hidden="true"></span><div><span class="t">${esc(x.ok)}</span></div></button></div>`).join('');
/* dopo ogni tasto: la spia sotto «Pubblica», il tasto, e gli avvisi se sono cambiati (senza ridisegnare il modulo, che farebbe perdere il punto in cui si scrive) */
function aggiornaSpia(){
  const f = st.aform; if(!f || !f.g || f.per==='ripristino') return;
  const m = giudizioManca(f), spia = $('g-spia'), tasto = document.querySelector('#foglio-slot [data-az="a-pubblica"]'), box = $('g-avvisi');
  if(spia) spia.textContent = testoSpia(m);
  if(tasto) tasto.disabled = m.length>0;
  const firma = avvisiScheda(f).map(x => x.k+':'+x.firma).join('\n');
  if(box && box.dataset.firma!==firma){ box.innerHTML = avvisiHtml(f); box.dataset.firma = firma; }
}

/* ---------- La parte della scheda con le colonne di giudizio ---------- */
function fonteScelta(f){
  const fo = regFonte(f.g.fonte); if(!fo) return;
  /* il campo «Fonte» vuoto, o ancora con il nome messo qui per la fonte scelta prima, prende quello della fonte nuova
     (l'attribuzione chiesta dalla licenza, se c'è); un testo scritto dalla Redazione non si tocca */
  const att = String(f.fonte||'').trim();
  if(!att || att===f.fonteAuto){ f.fonte = (fo.attribuzione || (CODICE_P.test(fo.nome) ? '' : fo.nome)).slice(0, 160); f.fonteAuto = f.fonte; }
  if(fo.tipo!=='social') f.g.post = 'np'; else if(f.g.post==='np') f.g.post = '';
}
function schedaGiudizio(f){
  const g = f.g, s = statoRegistro();
  const testa = `<h3 class="g-tit">${tr('Per il registro delle fonti')}</h3><p class="meta">${tr('Queste risposte non si pubblicano: vanno nella riga del registro delle fonti, che nasce insieme alla pubblicazione. Senza, «Pubblica» resta spento.')}</p>`;
  if(s) return `<div class="g-scheda">${testa}<p class="meta" role="status">${esc(s)}</p></div>`;
  const fo = regFonte(g.fonte), fac = tr('facoltativo');
  const campo = (id, lab, html, nota) => `<div class="stack-s"><label class="etich" for="${id}">${lab}</label>${html}${nota?`<span class="meta">${nota}</span>`:''}</div>`;
  const scelta = (id, c, lab, voci, nota) => campo(id, lab, `<div class="campo"><select id="${id}" data-gcampo="${c}"><option value="">${tr('— Scegli —')}</option>${voci.map(([v, t]) => `<option value="${esc(v)}" ${g[c]===v?'selected':''}>${esc(t)}</option>`).join('')}</select></div>`, nota);
  const testo = (id, c, lab, max, segna, nota, tipo) => campo(id, lab, `<div class="campo"><input id="${id}" data-gcampo="${c}" maxlength="${max}" value="${esc(g[c])}" placeholder="${esc(segna||'')}" autocomplete="off"${tipo?` type="${tipo}"`:''}></div>`, nota);
  const notaFonte = !fo ? tr('La fonte si sceglie dall’elenco del registro. Se è nuova, prima si leggono le condizioni del sito e si aggiunge all’elenco.')
    : !fonteAmmessa(fo) ? tr('Questa fonte non è ammessa: non si usa. Cerca l’organizzatore.')
    : fonteDaRicontrollare(fo) ? tr('Le condizioni di questa fonte sono state lette più di dodici mesi fa: rileggile e aggiorna la data nell’elenco delle fonti.')
    : tr('{t} · condizioni lette il {d}',{t:tr((tipoFonte(fo.tipo)||['', ''])[1]), d:fo.lette})
      + (fo.attribuzione ? ' · '+tr('la licenza chiede questa attribuzione nel campo «Fonte»: {a}',{a:fo.attribuzione}) : '');
  const domande = DIECI_DOMANDE.map(([n, q, no]) => `<div class="g-domanda${g.dom[n]==='stop'?' stop':''}"><label for="g-d${n}"><b>${n}.</b> ${esc(tr(q))}</label>
    <div class="campo"><select id="g-d${n}" data-gdom="${n}" aria-label="${esc(tr('Domanda {n}',{n}))}"><option value="">${tr('— Rispondi —')}</option>${['si'].concat(no).map(v => `<option value="${v}" ${g.dom[n]===v?'selected':''}>${esc(tr(RISPOSTE_DOMANDA[v]))}</option>`).join('')}</select></div></div>`).join('');
  return `<div class="g-scheda">${testa}
    ${campo('g-fonte', tr('Fonte nel registro'), `<div class="campo"><select id="g-fonte" data-gcampo="fonte"><option value="">${tr('— Scegli —')}</option>${REG.dati.fonti.map(x => `<option value="${esc(x.codice)}" ${g.fonte===x.codice?'selected':''}>${esc(etichettaFonte(x))}</option>`).join('')}</select></div>`, esc(notaFonte))}
    <button class="link" data-az="g-fonti">${tr('Apri l’elenco delle fonti')}</button>
    ${testo('g-cons', 'consultazione', tr('Data di consultazione'), 10, '', tr('Il giorno in cui hai letto la pagina dell’evento.'), 'date')}
    ${fo && fo.tipo==='social' ? scelta('g-post', 'post', tr('Post leggibile senza account'), [['si', tr('Sì: l’ho aperto senza accedere e si legge')]], tr('Valgono solo i post che si leggono senza account, nemmeno con quello del progetto; le storie non sono mai fonte (§ 6.4).')) : ''}
    <h3 class="g-tit">${tr('Le dieci domande')}</h3>
    <p class="meta">${tr('Si risponde a tutte, prima di pubblicare (§ 3.4). Basta un no per fermarsi: secondo la domanda si corregge l’evento, serve il consenso diretto, oppure l’evento non si pubblica.')}</p>
    ${g.domFile ? `<div class="red-riquadro" role="note"><b>${tr('Dal file: «{e}»',{e:esc(g.domFile)})}</b><span class="meta">${tr('È l’esito scritto nel file. Se rispondi qui a una domanda, vale la risposta domanda per domanda.')}</span></div>` : ''}
    <div class="g-domande">${domande}</div>
    <details class="g-regole"><summary>${tr('Le regole di scrittura, a portata di mano')}</summary>
      <ul><li>${tr('Il testo riporta fatti: che cosa, dove, quando, chi organizza, come si partecipa. Nessun giudizio su persone ed enti.')}</li>
      <li>${tr('La descrizione si riscrive con parole proprie, anche quando arriva dall’organizzatore; nessun brano di testi altrui, nessuna immagine.')}</li>
      <li>${tr('Gratuità, accessibilità del luogo, età minima: solo se la fonte le dichiara, e attribuite alla fonte («secondo l’organizzatore»).')}</li>
      <li>${tr('Un nome di persona solo se serve a partecipare e solo nel suo ruolo (relatore, artista, referente). Mai recapiti personali, mai i nomi di chi partecipa, mai il nome di un minore.')}</li>
      <li>${tr('Eventi politici e religiosi: attribuiti all’ente, senza nomi di persone fisiche, salvo consenso esplicito.')}</li>
      <li>${tr('Mai «verificato» o «ufficiale» per un evento soltanto ripreso; mai «autorizzato», «in regola», «sicuro», «a norma».')}</li>
      <li>${tr('Il campo «Fonte:» indica la fonte reale, quella di grado più alto, non un passaggio intermedio né chi ha segnalato l’evento.')}</li>
      <li>${tr('Se le fonti non concordano su data, ora o luogo e il contrasto non si risolve, l’evento non si pubblica.')}</li></ul></details>
    <h3 class="g-tit">${tr('Che cosa hai ripreso')}</h3>
    <div class="g-elementi" role="group" aria-label="${esc(tr('Elementi ripresi'))}">${ELEMENTI_RIPRESI.map(([k, t]) => `<button class="chip-in" data-az="g-elemento" data-k="${k}" aria-pressed="${!!g.elementi[k]}">${esc(tr(t))}</button>`).join('')}</div>
    ${scelta('g-nomi', 'nomi', tr('Nomi di persone'), [['no', tr('Nessun nome')], ['si', tr('Sì, con il solo ruolo')]])}
    ${g.nomi==='si' ? testo('g-ruoli', 'ruoli', tr('Ruolo delle persone nominate'), 120, tr('relatore, artista, referente'), tr('Qui si scrive il ruolo, mai il nome: nel registro i nomi non si copiano.'))
      + testo('g-titoloreg', 'titoloReg', `${tr('Titolo per il registro')} <span class="fac">${fac}</span>`, 100, tr('Concerto di [artista]'), tr('Solo se il titolo contiene il nome di una persona: riscrivilo con il ruolo al posto del nome. Vuoto, vale il titolo dell’evento.')) : ''}
    ${scelta('g-politico', 'politico', tr('Evento politico o religioso'), [['no', tr('No')], ['si', tr('Sì')]], tr('Conta lo scopo dell’evento, non il luogo: un concerto in una chiesa non è un evento religioso. Se sì, l’evento si attribuisce all’ente e i nomi di persone fisiche compaiono solo con il consenso esplicito.'))}
    ${scelta('g-avviso', 'avviso', tr('Avviso all’organizzatore'), Object.entries(AVVISI_ORG).map(([v, t]) => [v, tr(t)]), tr('All’organizzatore di cui si conosce un recapito di lavoro si manda l’avviso di pubblicazione (§ 3.3). Data e canale si annotano nel registro.'))}
    ${g.avviso==='inviato' ? `<div class="due">${testo('g-avvdata', 'avvisoData', tr('Avviso inviato il'), 10, '', '', 'date')}${testo('g-avvcanale', 'avvisoCanale', tr('Canale'), 40, tr('posta, messaggio…'))}</div>` : ''}
    ${g.avviso==='dopo' || g.avviso==='inviato' ? testo('g-k', 'k', `${tr('Recapito dell’organizzatore (codice K)')} <span class="fac">${fac}</span>`, 12, 'K-0001', tr('Il codice dell’elenco dei contatti: nel registro il recapito non si copia.')) : ''}
    ${serveConsenso(g) || g.consenso || f.nascosto ? testo('g-consenso', 'consenso', tr('Prova del consenso (codice C)'), 12, 'C-0001', tr('Il codice della riga del registro dei consensi dove sta la prova.')) : ''}
    <div id="g-avvisi" data-firma="${esc(avvisiScheda(f).map(x => x.k+':'+x.firma).join('\n'))}">${avvisiHtml(f)}</div></div>`;
}
/* il tasto «Pubblica» e la spia sotto, per il modulo dell'evento */
const spiaHtml = f => `<p class="meta g-spia" id="g-spia" role="status">${esc(testoSpia(giudizioManca(f)))}</p>`;

/* ---------- Gli eventi preparati ---------- */
/* «nascosto» resta tra i preparati, la password no: non va in nessun registro (§ 18.4), e alla ripresa l'app ne genera una nuova */
const CAMPI_PREPARATI = ['id', 'titolo', 'strato', 'sub', 'tema', 'inizio', 'fine', 'luogo', 'indirizzo', 'addrFull', 'precision', 'hn', 'comeArrivare', 'organizzatore', 'desc', 'prezzo', 'fonte', 'fonteLink', 'testoCal', 'nascosto'];
function preparaScheda(){
  const f = st.aform; if(!f || f.per==='ripristino' || PB.lavoro) return;
  if(REG.stato!=='aperto'){ f.errori = [statoRegistro()]; disegnaFoglio(); return; }
  if(!String(f.titolo||'').trim()){ f.err = {titolo:1}; f.errori = [tr('Titolo: per salvare la scheda tra i preparati serve almeno il titolo.')]; disegnaFoglio(); mostraErroriPb(); return; }
  const d = REG.dati, dati = {}; CAMPI_PREPARATI.forEach(k => { dati[k] = f[k]==null ? '' : f[k]; });
  dati.pos = f.pos ? {lat:f.pos.lat, lng:f.pos.lng} : null;
  let p = f.prep ? d.preparati.find(x => x.codice===f.prep) : null;
  if(!p){ p = {codice:regCodice('PR', d.prossimi.p++, 4), canale:'singolo'}; d.preparati.push(p); }
  Object.assign(p, {salvato:new Date().toISOString(), dati, g:JSON.parse(JSON.stringify(f.g))});
  PB.lavoro = true; disegnaFoglio();
  regSalva().then(() => { PB.lavoro = false; st.aform = null; PB.msg = tr('Scheda salvata tra i preparati: resta su questo dispositivo, cifrata, finché non la pubblichi o non la togli.');
      if(f.per==='importa'){ rigaPreparata(f.imp); apri('pb-importa'); return; }
      st.foglio = 'pubblica'; aggiornaPb(); },
    () => { PB.lavoro = false; f.errori = [tr('Non sono riuscito a salvare il registro delle fonti su questo dispositivo.')]; disegnaFoglio(); });
}
function apriPreparato(codice){
  const p = REG.dati && REG.dati.preparati.find(x => x.codice===codice); if(!p) return;
  apriEventoForm(null, 'pubblica');
  const f = st.aform, dati = p.dati||{};
  CAMPI_PREPARATI.forEach(k => { if(k==='id') f.id = typeof dati.id==='string' && dati.id ? dati.id : null; else f[k] = typeof dati[k]==='string' ? dati[k] : ''; });
  f.pos = dati.pos && isFinite(dati.pos.lat) && isFinite(dati.pos.lng) ? {lat:+dati.pos.lat, lng:+dati.pos.lng} : null;
  f.g = giudizioInForma(p.g); f.prep = p.codice; disegnaFoglio();
}
function togliPreparato(codice){
  const d = REG.dati; if(!d) return Promise.resolve();
  d.preparati = d.preparati.filter(x => x.codice!==codice); return regSalva().catch(() => {});
}
const preparatiHtml = () => {
  if(REG.stato!=='aperto') return REG.stato ? `<p class="meta" role="status">${esc(statoRegistro())}</p>` : '';
  const P = REG.dati.preparati; if(!P.length) return '';
  return `<p class="etich">${tr('Preparati, non ancora pubblicati')} · ${P.length}</p><div class="menu-lista">${P.map(p => { const d = p.dati||{};
    return `<div class="menu-r" style="cursor:default"><button class="g-prep" data-pbprep="${esc(p.codice)}"><span class="t">${esc(d.titolo||tr('Senza titolo'))}</span><span class="meta">${esc(d.inizio ? giornoOra(d.inizio) : tr('senza data'))}${d.luogo ? ' · '+esc(d.luogo) : ''}</span></button><button class="link" data-az="g-prep-togli" data-c="${esc(p.codice)}">${PB.togliPrep===p.codice ? tr('Tocca ancora per togliere') : tr('Togli')}</button></div>`; }).join('')}</div>
    <p class="meta">${tr('Le schede preparate stanno solo su questo dispositivo, cifrate con la chiave del registro. Nessuna è sulla mappa.')}</p>`;
};

/* ---------- Tocchi e campi ---------- */
function clickScheda(t){
  const d = t.dataset;
  if(d.pbfonte){ apriFonte(d.pbfonte); return true; }
  if(d.pbprep){ PB.togliPrep = null; apriPreparato(d.pbprep); return true; }
  return false;
}
function azioneScheda(az, t){
  const f = st.aform;
  switch(az){
    case 'pb-fonti': PB.fonte = null; PB.errore = ''; regApri().then(ridisegnaPb); apri('pb-fonti'); break;
    case 'g-fonti': PB.fonte = null; PB.errore = ''; PB.msg = ''; apri('pb-fonti'); break;
    case 'g-torna': apri(st.aform ? 'aform' : 'pubblica'); break;
    case 'pb-fonte-nuova': apriFonte(null); break;
    case 'pb-fonte-salva': salvaFonte(); break;
    case 'g-elemento': if(f && f.g){ f.g.elementi[t.dataset.k] = f.g.elementi[t.dataset.k] ? 0 : 1; t.setAttribute('aria-pressed', String(!!f.g.elementi[t.dataset.k])); aggiornaSpia(); } break;
    case 'g-visto': if(f && f.g){ const x = avvisiScheda(f).find(y => y.k===t.dataset.k); if(x){ if(avvisoVisto(f, x)) delete f.g.visti[x.k]; else f.g.visti[x.k] = x.firma; t.setAttribute('aria-pressed', String(avvisoVisto(f, x))); aggiornaSpia(); } } break;
    case 'g-prepara': preparaScheda(); break;
    case 'g-prep-togli': { const c = t.dataset.c; if(PB.togliPrep!==c){ PB.togliPrep = c; disegnaFoglio(); break; }
      PB.togliPrep = null; togliPreparato(c).then(() => { PB.msg = tr('Scheda tolta dai preparati.'); ridisegnaPb(); }); break; }
    default: return false;
  }
  return true;
}
function inputScheda(el){
  const d = el.dataset;
  if(d.fcampo && PB.fonte){ PB.fonte[d.fcampo] = el.value; return true; }
  if(d.fpunto && PB.fonte){ PB.fonte.punti[d.fpunto] = el.value; return true; }
  if(inputRegistro(el)) return true;
  if(d.gcampo && st.aform && st.aform.g && el.tagName!=='SELECT'){ st.aform.g[d.gcampo] = el.value; aggiornaSpia(); return true; }
  return false;
}
function cambioScheda(el){
  const d = el.dataset, f = st.aform;
  if(d.fcampo && PB.fonte){ PB.fonte[d.fcampo] = el.value;
    /* scelto il tipo, il grado di partenza è quello dell'ordine delle fonti (§ 5.4): si può cambiare */
    if(d.fcampo==='tipo'){ const t = tipoFonte(el.value); if(t && !PB.fonte.grado) PB.fonte.grado = t[2]; disegnaFoglio(); }
    return true; }
  if(d.fpunto && PB.fonte){ PB.fonte.punti[d.fpunto] = el.value; return true; }
  if(cambioRegistro(el)) return true;
  if(!f || !f.g) return false;
  if(d.gdom){ if(el.value) f.g.dom[d.gdom] = el.value; else delete f.g.dom[d.gdom]; delete f.g.domFile; disegnaFoglio(); return true; }
  if(d.gcampo){ f.g[d.gcampo] = el.value; if(d.gcampo==='fonte') fonteScelta(f); if(el.tagName==='SELECT') disegnaFoglio(); else aggiornaSpia(); return true; }
  return false;
}
