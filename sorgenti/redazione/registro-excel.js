/* ======================= Il registro delle fonti: Excel, «Non pubblicati», confronto con lo sportello (T-043) =======================
   Libro mastro, cap. 22 («Come l'app della redazione scrive il registro», regole 3, 4 e 5; foglio «Non pubblicati»;
   conservazione); § 18.4 (un file per registro, fogli comuni, colonne comuni, nessuna voce riscritta, date gg/mm/aaaa);
   § 18.3 (il file sta cifrato); §§ 7.5, caso 2, e 8.5, passo 1 (richieste non accolte per ragioni di fatto).

   La schermata «Registro delle fonti» (Pubblicazione → «Registro delle fonti») raccoglie:
   - le fonti (registro-fonti.js) e le richieste «Non pubblicati» (qui), che si scrivono nell'app;
   - l'esportazione in Excel con le colonne e l'ordine del modello del registro delle fonti del 13/11/2026: fogli
     «Istruzioni», «Fonti», «Eventi», «Non pubblicati», «Riepilogo», «Valori» e «Versioni», intestazioni alla riga 4,
     date gg/mm/aaaa (cap. 22, regola 3). Il file esportato non ha password: lo dice l'app, e la Redazione lo salva con
     la password del registro prima di tenerlo (§ 18.3);
   - l'importazione del file tenuto a mano (regola 5, «Il passaggio»): fonti, righe degli eventi e «Non pubblicati»
     entrano con i loro codici, che non si rinumerano; ciò che c'è già non si tocca, ciò che è in contrasto si mostra;
   - il confronto con lo sportello (regola 4): le righe del periodo contro gli eventi pubblicati la prima volta nello
     stesso periodo, secondo lo storico dello sportello; e, per un secondo dispositivo, le righe, le fonti e i «Non
     pubblicati» che lo sportello conserva nelle sue buste e che qui mancano.
   «Togli questo nome ovunque» non tocca il registro (cap. 22, conservazione; § 3.13): il registro non è un documento
   operativo e non copia i nomi delle persone.

   Testi come testo (T-024): ciò che viene dal file o dalle buste entra nella pagina solo con esc(). */
const RX = {imp:null, conf:null, np:null, scopo:''};

/* ---------- I valori dei menu, come nel foglio «Valori» del modello ---------- */
const V_TIPO = {organizzatore:'Organizzatore che scrive alla Redazione', sito:"Sito dell'organizzatore", social:'Pagina ufficiale su un social network', istituzionale:'Sito istituzionale', calendario:'Calendario in dati aperti', testata:'Testata o comunicato'};
const V_ESITO = {ammessa:'Ammessa', attribuzione:'Ammessa con attribuzione', vietata:"Non ammessa: vieta il riuso (si cerca l'organizzatore)", esclusa:'Esclusa'};
const V_LICENZA = {aperta:'Licenza aperta che consente il riuso', nessuna:'Nessuna licenza (art. 52, c. 2, CAD)', condivisione:'Licenza a condivisione alle stesse condizioni (solo inserimento a mano)', np:'Non pertinente'};
const V_CANALE = {singolo:'Evento singolo', excel:'File Excel', calendario:'Calendario in dati aperti'};
const V_RITIRO = {annullato:'Annullato o rinviato', errore:'Errore non verificabile in tempo', esclusione:'Esclusione editoriale (X)', richiesta:"Richiesta dell'interessato (R)", segnalazione:'Segnalazione (S)', ordine:"Ordine di un'autorità (A)"};
const V_MOTIVO_NP = {domanda:'Una delle dieci domande non superata', nonpubblico:'Evento non ancora pubblico altrove', contrasto:'Contrasto tra fonti non risolto', fonte:'Fonte non ammessa', altro:'Altro motivo di fatto'};
const V_CANALI = ['Casella di contatto', 'App di messaggistica', 'Social network', 'Telefono', 'Di persona', "Modulo o tasto dell'app"];
const FUNZIONI_REG = ['Direzione', 'Referente privacy', 'Redazione eventi', 'Relazioni con gli utenti', 'Responsabile infrastruttura', 'Amministrazione', 'Collaudo', 'Sviluppo', 'Etica'];

/* ---------- Le colonne, nell'ordine del modello (cap. 22; § 18.4, regola 4) ---------- */
const PUNTO_COL = n => 'Punto '+n+': '+SETTE_PUNTI[n-1][1].charAt(0).toLowerCase()+SETTE_PUNTI[n-1][1].slice(1);
const COL_FONTI = ['Codice', 'Data di registrazione', 'Funzione che annota', 'Nome della fonte', 'Tipo', 'Grado', 'Indirizzo', 'Persona fisica', 'Condizioni lette il', 'Esito',
  'Licenza del calendario', 'Nome della licenza', 'Attribuzione richiesta', ...SETTE_PUNTI.map(([n]) => PUNTO_COL(n)), 'Prossimo controllo', 'Ultimo evento collegato',
  'Rif. libro mastro', 'Collegamenti', 'Stato', 'Contestazione in corso', 'Scadenza della conservazione', 'Da cancellare al riesame', 'Rettifiche', 'Note'];
const COL_EVENTI = ['Codice', 'Data di registrazione', 'Funzione che annota', 'Data e ora di pubblicazione', "Identificativo dell'evento", 'Titolo (senza nomi di persone)', 'Evento nascosto',
  'Canale di immissione', 'Fonte (codice FS)', 'Grado della fonte', "Fonte diversa dall'organizzatore", "Collegamento alla pagina dell'evento", 'Data di consultazione', 'Funzione che ha consultato',
  'Post leggibile senza account', 'Testo del campo «Fonte:»', 'Dieci domande', 'Domande e correzioni', 'Elementi ripresi', 'Nomi ripresi', 'Evento politico o religioso',
  "Avviso all'organizzatore: data", 'Avviso: canale', 'Prova del consenso (codice C)', 'Ritiro prima della fine: data', 'Motivo del ritiro',
  'Rif. libro mastro', 'Collegamenti', 'Stato', 'Contestazione in corso', 'Scadenza della conservazione', 'Da cancellare al riesame', 'Rettifiche', 'Note'];
const COL_NP = ['Codice', 'Data di registrazione', 'Funzione che annota', 'Data della richiesta', 'Organizzatore (denominazione o codice P)', 'Evento richiesto (senza nomi)', 'Motivo',
  'Motivazione inviata: data', 'Motivazione: canale', 'Rif. libro mastro', 'Collegamenti', 'Stato', 'Data di chiusura', 'Contestazione in corso', 'Scadenza della conservazione',
  'Da cancellare al riesame', 'Rettifiche', 'Note'];
/* le colonne con una data (o con data e ora) nei tre fogli */
const COL_DATA = new Set(['Data di registrazione', 'Condizioni lette il', ...SETTE_PUNTI.map(([n]) => PUNTO_COL(n)), 'Prossimo controllo', 'Ultimo evento collegato', 'Data di consultazione',
  "Avviso all'organizzatore: data", 'Ritiro prima della fine: data', 'Data della richiesta', 'Motivazione inviata: data', 'Data di chiusura']);
const COL_ORA = new Set(['Data e ora di pubblicazione']);
const LARG_FONTI = [12,13,18,26,24,9,30,10,13,26,26,16,26,13,13,13,13,13,13,13,13,13,13,18,14,12,14,12,30,30];
const LARG_EVENTI = [12,13,18,15,18,30,10,18,12,9,12,30,13,16,18,24,18,26,26,16,11,13,20,12,13,22,13,18,14,12,14,12,30,30];
const LARG_NP = [12,13,18,13,22,28,26,13,18,13,18,14,13,12,14,12,30,30];

/* ---------- Dalle voci del dispositivo alle righe del file ---------- */
const giornoD = x => giornoReg(x) ? dIso(x) : '';
/* un numero di serie di Excel (giorni dal 30/12/1899, con le ore dopo la virgola) come data e ora del dispositivo */
const daSeriale = v => new Date(1899, 11, 30 + Math.floor(v), 0, Math.round((v - Math.floor(v))*1440));
const istanteD = x => { const d = new Date(x); return x && !isNaN(d) ? {data:d, ora:true} : ''; };
const piuAnni = (g, n) => giornoReg(g) ? (+g.slice(0,4)+n)+g.slice(4) : '';
const siNo = b => b ? 'Sì' : 'No';
const testoRettifiche = l => (l||[]).map(x => { const d = new Date(x.data); return (isNaN(d) ? x.data : d.toLocaleDateString('it-IT')+' '+d.toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'}))+': '+x.testo; }).join('\n');
const fsRiga = r => r.mano ? r.fs||'' : ((r.g||{}).fonte||'');
const giornoRiga = r => { const d = new Date(r.quando||''); return r.quando && !isNaN(d) ? ymd(d) : ''; };   /* il giorno della pubblicazione, ora del dispositivo */
/* le fonti di grado 3 e 4 sono «diverse dall'organizzatore» (§ 6.3, regola 3) */
const gradoDi = c => { const f = regFonte(c); return f ? (f.grado==='esclusa' ? 'Esclusa' : f.grado) : ''; };
const diversaDi = gr => gr==='3' || gr==='4' ? 'Sì' : gr==='1' || gr==='2' ? 'No' : '';
const ultimoEvento = c => REG.dati.eventi.filter(r => fsRiga(r)===c && r.quando).reduce((m, r) => giornoRiga(r) > m ? giornoRiga(r) : m, '');
function rigaFonteReg(f){
  const persona = CODICE_P.test(f.nome), lette = f.lette, ultimo = ultimoEvento(f.codice), x = f.extra||{};
  const stato = f.esito==='esclusa' || f.grado==='esclusa' ? 'Esclusa' : STATI_FONTE[f.stato] || 'In uso';
  const scad = persona ? (ultimo ? giornoD(piuAnni(ultimo, CINQUE_ANNI)) : '') : 'Durata del servizio';
  const daCanc = scad instanceof Date && scad < dIso(oggi()) ? 'Sì' : '';
  return [f.codice, giornoD(f.registrata), x.funzione || 'Redazione eventi', f.nome, V_TIPO[f.tipo]||'', f.grado==='esclusa' ? 'Esclusa' : f.grado, f.indirizzo, siNo(persona),
    giornoD(lette), V_ESITO[f.esito]||'', f.tipo==='calendario' ? V_LICENZA[f.licenzaTipo]||'' : V_LICENZA.np, f.licenza, f.attribuzione,
    ...SETTE_PUNTI.map(([n]) => giornoD((f.punti||{})[n])), giornoD(prossimoControllo(f)), giornoD(ultimo), x.rif || '§ 5.4', x.collegamenti || '', stato, x.contestazione || '', scad, daCanc,
    testoRettifiche(f.rettifiche), f.note||''];
}
/* l'esito delle dieci domande nei due valori del modello: il valore del menu e le domande con la correzione */
function dieciPerFile(g){
  if(g.domFile){ const m = g.domFile.match(/^Correzione applicata:?\s*(.*)$/); return m ? ['Correzione applicata', m[1]] : [g.domFile, '']; }
  const no = DIECI_DOMANDE.filter(([n]) => g.dom && g.dom[n] && g.dom[n]!=='si');
  if(!no.length) return ['Tutte superate', ''];
  return [no.some(([n]) => g.dom[n]==='consenso') ? 'Consenso diretto chiesto' : 'Correzione applicata', esitoDomande(g)];
}
function elementiPerFile(g){
  const e = g.elementi||{}, base = ['titolo', 'data', 'ora', 'luogo'].filter(k => e[k]).map(k => tr(ELEMENTI_RIPRESI.find(x => x[0]===k)[1]).toLowerCase());
  let t = base.join(', '); if(t) t = t.charAt(0).toUpperCase()+t.slice(1);
  if(e.descrizione) t += (t ? '; ' : '')+'descrizione riscritta';
  if(g.nomi==='si' && g.ruoli) t += (t ? '; ' : '')+'ruoli: '+g.ruoli;
  return t;
}
function rigaEventoReg(r){
  /* una riga portata dal file tenuto a mano esce com'era scritta, con le date di nuovo come date */
  if(r.mano) return COL_EVENTI.map(c => { const v = (r.colonne||{})[c]; return v==null ? '' : typeof v!=='number' ? v : COL_ORA.has(c) ? {data:daSeriale(v), ora:true} : COL_DATA.has(c) ? daSeriale(Math.floor(v)) : v; });
  const g = r.g||{}, gr = gradoDi(g.fonte), [dieci, corr] = dieciPerFile(g), pub = giornoRiga(r), scad = r.scadenza || piuAnni(pub, CINQUE_ANNI);
  const finito = r.fine && Date.parse(r.fine) < Date.now(), rit = r.ritiro;
  const note = [!r.quando ? 'Prima pubblicazione da un altro dispositivo o prima del registro nell’app' : '', g.avviso==='dopo' ? 'Avviso all’organizzatore da inviare dopo la pubblicazione' : ''].filter(Boolean).join('; ');
  return [r.codice, giornoD(pub) || giornoD(giornoRiga({quando:r.corretto})), r.funzione || 'Redazione eventi', istanteD(r.quando), r.id, r.titolo, siNo(r.nascosto),
    V_CANALE[r.canale]||'', g.fonte||'', gr, diversaDi(gr), r.collegamento||'', giornoD(g.consultazione), r.funzione || 'Redazione eventi',
    g.post==='si' ? 'Sì, verificato senza accedere' : 'Non pertinente', r.testoFonte||'', dieci, corr, elementiPerFile(g), g.nomi==='si' ? 'Sì, con il solo ruolo' : g.nomi==='no' ? 'Nessun nome' : '',
    g.politico==='si' ? 'Sì' : g.politico==='no' ? 'No' : '', g.avviso==='inviato' ? giornoD(g.avvisoData) : '', g.avviso==='nessuno' ? 'Nessun recapito di lavoro noto' : g.avviso==='inviato' ? g.avvisoCanale||'' : '',
    g.consenso||'', rit ? giornoD(giornoReg(rit.data) || giornoRiga({quando:rit.data})) : '', rit ? V_RITIRO[rit.motivo]||'' : '', '§§ 3.4 e 5.3',
    [g.k, g.consenso, rit && rit.riferimento].filter(Boolean).join('; '), rit ? 'Ritirato prima della fine' : finito ? 'Concluso' : 'Pubblicato', '', giornoD(scad),
    giornoReg(scad) && scad < oggi() ? 'Sì' : '', testoRettifiche(r.rettifiche), note];
}
function rigaNpReg(x){
  const scad = x.chiusa ? piuAnni(x.chiusa, CINQUE_ANNI) : '', e = x.extra||{};
  return [x.codice, giornoD(x.registrata), e.funzione || 'Redazione eventi', giornoD(x.richiesta), x.organizzatore, x.evento, V_MOTIVO_NP[x.motivo]||'', giornoD(x.motivazioneData), x.motivazioneCanale,
    e.rif || '§ 7.5', e.collegamenti || '', x.chiusa ? 'Chiusa' : 'Aperta', giornoD(x.chiusa), e.contestazione || '', giornoD(scad), giornoReg(scad) && scad < oggi() ? 'Sì' : '', testoRettifiche(x.rettifiche), x.note||''];
}

/* ---------- Il riepilogo dell'anno (foglio «Riepilogo»: § 6.3, regola 3; § 18.8) ---------- */
function riepilogoAnno(anno){
  const d = REG.dati, nell = r => giornoRiga(r).slice(0, 4)===String(anno);
  const righe = d.eventi.filter(nell), conGrado = righe.map(r => ({r, gr:gradoDi(fsRiga(r))}));
  const org = conGrado.filter(x => diversaDi(x.gr)==='No').length, div = conGrado.filter(x => diversaDi(x.gr)==='Sì').length;
  const np = d.nonPubblicati.filter(x => String(x.richiesta).slice(0, 4)===String(anno)).length;
  const scaduti = d.fonti.filter(f => fonteDaRicontrollare(f)).length, inUso = d.fonti.filter(f => f.stato!=='non' && f.esito!=='esclusa' && f.grado!=='esclusa').length;
  const canc = (righe, col) => righe.filter(x => x[col.indexOf('Da cancellare al riesame')]==='Sì').length;
  const daCanc = canc(d.eventi.map(rigaEventoReg), COL_EVENTI) + canc(d.fonti.map(rigaFonteReg), COL_FONTI) + canc(d.nonPubblicati.map(rigaNpReg), COL_NP);
  const rap = n => n>0 && n<5 ? 'meno di 5' : n;
  const per = {}; conGrado.forEach(({r, gr}) => { const c = fsRiga(r)||'—'; per[c] = per[c] || {n:0, gr}; per[c].n++; });
  return {anno, righe:righe.length, org, div, quota:righe.length ? Math.round(div/righe.length*1000)/10 : '', nascosti:righe.filter(r => r.nascosto).length,
    ritirati:righe.filter(r => r.ritiro).length, inUso, scaduti, np, npRap:rap(np), daCanc, mano:righe.filter(r => r.mano).length,
    gradi:['1', '2', '3', '4'].map(g => [g, conGrado.filter(x => x.gr===g).length]), perFonte:Object.entries(per).sort((a, b) => b[1].n - a[1].n)};
}

/* ---------- L'esportazione in Excel (cap. 22, regola 3) ---------- */
const nomeRegistroFile = () => (String(NOME).replace(/[^A-Za-z0-9]+/g, '') || 'Registro')+'_Reg22_Fonti_esportato_'+oggi()+'.xlsx';
function fogliRegistro(dispositivo){
  const d = REG.dati, anno = +oggi().slice(0, 4), R = riepilogoAnno(anno), titolo = (t, s) => [[t], [s], []];
  const ordine = (a, b) => a.codice < b.codice ? -1 : a.codice > b.codice ? 1 : 0;
  const eventi = d.eventi.slice().sort((a, b) => (a.codice||'~') < (b.codice||'~') ? -1 : (a.codice||'~') > (b.codice||'~') ? 1 : String(a.quando) < String(b.quando) ? -1 : 1);
  const istr = [['Registro delle fonti'], ['Libro mastro legale, cap. 22 · lo tiene la Redazione eventi · righe degli eventi conservate cinque anni dalla pubblicazione'], [],
    ['Esportato dall’app della redazione il '+new Date().toLocaleDateString('it-IT')+' alle '+new Date().toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'})+(dispositivo ? ', dal dispositivo «'+dispositivo+'»' : '')+'.'],
    ['Le colonne e il loro ordine sono quelli del modello del 13/11/2026 (cap. 22; § 18.4). Le colonne calcolate del modello (grado della fonte, prossimo controllo, scadenza, da cancellare) qui hanno già il valore.'], [],
    ['I fogli'], ['Fonti (FS-0001): una riga per sito, pagina o calendario usato come fonte.'], ['Eventi (F-00001): una riga per ogni evento pubblicato; i codici F li dà lo sportello di pubblicazione, uno dopo l’altro.'],
    ['Non pubblicati (NP-0001): le richieste di pubblicazione non accolte per ragioni di fatto (§ 7.5, caso 2; § 8.5, passo 1).'], ['Riepilogo: eventi dell’anno per fonte e per grado, quota di eventi da fonti diverse dagli organizzatori (§ 6.3, regola 3; § 18.8).'], [],
    ['Regole'], ['Nessuna voce si riscrive: le correzioni sono nella colonna «Rettifiche», con la data (§ 18.4, regola 5).'], ['Nessun nome di persona: le persone fisiche con il codice P; nei titoli il ruolo al posto del nome (§ 5.3; § 18.5).'],
    ['Lo strumento «Togli questo nome ovunque» non modifica il registro (§ 3.13; cap. 22, conservazione).'], [],
    ['Dove sta il file'], ['Questo file non ha password. Si apre con il programma installato sul dispositivo della redazione, si salva con la password del registro e si cancella la copia senza password (§ 18.3). Mai sulla piattaforma del codice, presso strumenti di intelligenza artificiale o nel gestionale.']];
  const fonti = titolo('Fonti valutate', 'Una riga per sito, pagina o calendario · §§ 5.4, 6.3 e 6.4').concat([COL_FONTI], d.fonti.slice().sort(ordine).map(rigaFonteReg));
  const ev = titolo('Eventi pubblicati', 'Una riga per evento, al momento della pubblicazione · §§ 3.4 e 5.3').concat([COL_EVENTI], eventi.map(rigaEventoReg));
  const np = titolo('Richieste di pubblicazione non accolte per ragioni di fatto', '§ 7.5, caso 2; § 8.5, passo 1 · cinque anni dalla chiusura').concat([COL_NP], d.nonPubblicati.slice().sort(ordine).map(rigaNpReg));
  const rie = titolo('Riepilogo', 'Calcolato dall’app al momento dell’esportazione. Sotto i cinque casi il valore per il rapporto compare come «meno di 5» (§ 4.4; § 18.8)').concat([
    ['Voce', 'Valore', 'Per il rapporto interno'], ['Anno del riepilogo', anno, ''], ['Eventi pubblicati nell’anno'], ['Eventi pubblicati', R.righe, '—'], ['da fonti degli organizzatori (gradi 1 e 2)', R.org, '—'],
    ['da fonti diverse dagli organizzatori (gradi 3 e 4)', R.div, '—'], ['Quota da fonti diverse dagli organizzatori (%)', R.quota, '—'], ['Eventi nascosti', R.nascosti, '—'], ['Eventi ritirati prima della fine', R.ritirati, '—'],
    ['Fonti e richieste'], ['Fonti in uso', R.inUso, '—'], ['Fonti con il controllo delle condizioni scaduto', R.scaduti, '—'], ['Richieste di pubblicazione non accolte nell’anno', R.np, R.npRap],
    ['Conservazione'], ['Voci da cancellare al prossimo riesame (tutti i fogli)', R.daCanc, '—'], [],
    ['Eventi dell’anno per grado della fonte'], ...R.gradi.map(([g, n]) => ['Grado '+g, n, '—']), [],
    ['Eventi dell’anno per fonte'], ['Fonte (codice FS)', 'Eventi', 'Grado'], ...R.perFonte.map(([c, x]) => [c, x.n, x.gr || ''])]);
  const valori = titolo('Valori dei menu a tendina', 'Si modificano soltanto con una modifica del modello annotata nel foglio «Versioni» (§ 18.4, regola 9)');
  const liste = [['Funzioni', FUNZIONI_REG], ['SiNo', ['Sì', 'No']], ['TipoFonte', Object.values(V_TIPO)], ['Grado', ['1', '2', '3', '4', 'Esclusa']], ['EsitoFonte', Object.values(V_ESITO)],
    ['Licenza', Object.values(V_LICENZA)], ['StatoFonte', ['In uso', 'Non più in uso', 'Esclusa']], ['CanaleImmissione', Object.values(V_CANALE)], ['Leggibile', ['Sì, verificato senza accedere', 'Non pertinente']],
    ['DieciDomande', ['Tutte superate', 'Correzione applicata', 'Consenso diretto chiesto']], ['Nomi', ['Nessun nome', 'Sì, con il solo ruolo']], ['CanaleAvviso', V_CANALI.slice(0, 5).concat(['Nessun recapito di lavoro noto'])],
    ['MotivoRitiro', Object.values(V_RITIRO)], ['StatoEvento', ['Pubblicato', 'Concluso', 'Ritirato prima della fine']], ['MotivoNP', Object.values(V_MOTIVO_NP)], ['CanaleComun', V_CANALI], ['Pratica', ['Aperta', 'Chiusa']]];
  valori.push(liste.map(x => x[0]));
  for(let i = 0, n = Math.max(...liste.map(x => x[1].length)); i < n; i++) valori.push(liste.map(x => x[1][i] || ''));
  const versioni = titolo('Versioni del modello', 'Ogni modifica del modello si annota qui (§ 18.4, regola 9)').concat([['Versione', 'Data', 'Modifica', 'Decisione (codice D)'],
    ['1.0', dIso('2026-11-13'), 'Prima versione del modello, secondo il cap. 18 e il cap. 22 del libro mastro (testo del 13/11/2026).', '']]);
  return [['Istruzioni', istr, [125]], ['Fonti', fonti, LARG_FONTI, {testa:3}], ['Eventi', ev, LARG_EVENTI, {testa:3}], ['Non pubblicati', np, LARG_NP, {testa:3}],
    ['Riepilogo', rie, [70, 14, 20], {testa:3}], ['Valori', valori, liste.map(x => Math.max(18, Math.min(45, Math.max(...x[1].map(v => v.length), x[0].length)+2))), {testa:3}], ['Versioni', versioni, [10, 12, 90, 16], {testa:3}]];
}
function esportaRegistro(){
  if(REG.stato!=='aperto') { PB.errore = statoRegistro(); disegnaFoglio(); return; }
  PB.errore = ''; PB.msg = '';
  CHIAVI.stato().catch(() => null).then(s => fileExcel(fogliRegistro(s && s.ci_sono ? s.dispositivo : ''), nomeRegistroFile())).then(() => {
    const d = REG.dati; registra('registro-esporta', {n:d.eventi.length});
    PB.msg = tr('Registro esportato: {f} ({e} righe degli eventi, {s} fonti, {p} non pubblicati). Il file non ha password: aprilo con il programma del dispositivo, salvalo con la password del registro (§ 18.3) e cancella questa copia.',{f:nomeRegistroFile(), e:d.eventi.length, s:d.fonti.length, p:d.nonPubblicati.length});
    disegnaFoglio(); }, () => { PB.errore = tr('Non sono riuscito a preparare il file Excel.'); disegnaFoglio(); });
}

/* ---------- La schermata «Registro delle fonti» ---------- */
function fPbRegistro(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Registro delle fonti')}</h2><p class="meta">${tr('Cifrato su questo dispositivo con la chiave del registro · cap. 22')}</p></div>${chiudiBtn('pubblica')}</div>`;
  const s = statoRegistro(); if(s) return foglio('forte', testa, `<p class="meta" role="status">${esc(s)}</p>`);
  const d = REG.dati, rilegg = d.fonti.filter(fonteDaRicontrollare).length, aperte = d.nonPubblicati.filter(x => !x.chiusa).length, m = daMandare(d), attesa = m.fonti.length + m.nonPubblicati.length + m.mano.length;
  const corpo = `${statoPb()}
    <p class="meta">${tr('Sul dispositivo: {e} righe degli eventi, {f} fonti, {n} richieste non pubblicate.',{e:d.eventi.length, f:d.fonti.length, n:d.nonPubblicati.length})}${attesa ? ' '+tr('{n} voci partiranno per lo sportello con la prossima pubblicazione.',{n:attesa}) : ''}</p>
    <div class="menu-lista">
      <button class="menu-r" data-az="pb-fonti">${icoNote}<div><span class="t">${tr('Fonti')}</span><span class="meta">${tr('{n} fonti',{n:d.fonti.length})}${rilegg ? ' · '+tr('{n} con le condizioni da rileggere',{n:rilegg}) : ''}</span></div>${freccia}</button>
      <button class="menu-r" data-az="rx-np">${icoNote}<div><span class="t">${tr('Non pubblicati')}</span><span class="meta">${tr('Richieste di pubblicazione non accolte per ragioni di fatto')}${aperte ? ' · '+tr('{n} aperte',{n:aperte}) : ''}</span></div>${freccia}</button>
      <button class="menu-r" data-az="rx-confronta">${icoCal()}<div><span class="t">${tr('Confronta con lo sportello')}</span><span class="meta">${tr('Righe del periodo contro gli eventi pubblicati nello storico; righe e fonti scritte da un altro dispositivo')}</span></div>${freccia}</button></div>
    <div class="menu-lista">
      <button class="menu-r" data-az="rx-esporta">${icoEsporta}<div><span class="t">${tr('Esporta il registro in Excel')}</span><span class="meta">${tr('Le colonne e l’ordine del cap. 22, per il riesame, il rapporto interno o una richiesta')}</span></div>${freccia}</button>
      <button class="menu-r" data-az="rx-importa">${icoImporta}<div><span class="t">${tr('Importa il registro tenuto a mano')}</span><span class="meta">${tr('Il file Excel del registro delle fonti: fonti, righe degli eventi e non pubblicati')}</span></div>${freccia}</button></div>
    <p class="meta">${tr('Il registro non è un documento operativo: «Togli questo nome ovunque» non lo modifica, e i nomi delle persone non vi si copiano (§ 3.13; § 5.3).')}</p>`;
  return foglio('forte alto', testa, corpo);
}

/* ---------- «Non pubblicati» (NP-0001) ---------- */
function fPbNp(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Non pubblicati')}</h2><p class="meta">${tr('Registro delle fonti, foglio «Non pubblicati»')}</p></div>${chiudiBtn('pb-registro')}</div>`;
  const s = statoRegistro(); if(s) return foglio('forte', testa, `<p class="meta" role="status">${esc(s)}</p>`);
  const L = REG.dati.nonPubblicati.slice().reverse();
  const corpo = `${statoPb()}
    <p class="meta">${tr('Una riga per ogni richiesta di pubblicazione di un organizzatore che non si accoglie per ragioni di fatto: una delle dieci domande non superata, l’evento non ancora pubblico altrove, un contrasto tra fonti non risolto. Non è un’esclusione editoriale (§ 8.5, passo 1). La riga prova la motivazione inviata (§ 7.5, caso 2) e si conserva cinque anni dalla chiusura.')}</p>
    <div class="tasti"><button class="tasto pri" data-az="rx-np-nuovo">${tr('Nuova richiesta non pubblicata')}</button></div>
    ${L.length ? `<div class="menu-lista">${L.map(x => `<button class="menu-r" data-rxnp="${esc(x.codice)}"><div><span class="t">${esc(x.codice)} · ${esc(x.evento||tr('senza descrizione'))}</span><span class="meta">${esc(x.organizzatore)} · ${esc(tr(V_MOTIVO_NP[x.motivo]||'—'))} · ${x.chiusa ? tr('chiusa') : tr('aperta')}</span></div>${freccia}</button>`).join('')}</div>`
      : `<p class="meta">${tr('Nessuna richiesta non pubblicata.')}</p>`}`;
  return foglio('forte alto', testa, corpo);
}
function apriNp(codice){
  const x = codice ? REG.dati.nonPubblicati.find(y => y.codice===codice) : null;
  RX.np = Object.assign({codice:null, richiesta:oggi(), organizzatore:'', evento:'', motivo:'', motivazioneData:'', motivazioneCanale:'', chiusa:'', note:''}, x ? JSON.parse(JSON.stringify(x)) : {}, {errori:[]});
  PB.errore = ''; PB.msg = ''; apri('pb-np-riga');
}
function fPbNpRiga(){
  const x = RX.np, testa = `<div class="riga-titolo"><div><h2>${x && x.codice ? esc(x.codice) : tr('Nuova richiesta non pubblicata')}</h2><p class="meta">${tr('Registro delle fonti, foglio «Non pubblicati»')}</p></div>${chiudiBtn('rx-np')}</div>`;
  if(!x) return foglio('forte', testa, '');
  const fac = tr('facoltativo'), campo = (id, lab, html, nota) => `<div class="stack-s"><label class="etich" for="${id}">${lab}</label>${html}${nota?`<span class="meta">${nota}</span>`:''}</div>`;
  const testo = (id, c, lab, max, segna, nota, tipo) => campo(id, lab, `<div class="campo"><input id="${id}" data-npcampo="${c}" maxlength="${max}" value="${esc(x[c])}" placeholder="${esc(segna||'')}" autocomplete="off"${tipo?` type="${tipo}"`:''}></div>`, nota);
  const scelta = (id, c, lab, voci, nota) => campo(id, lab, `<div class="campo"><select id="${id}" data-npcampo="${c}"><option value="">${tr('— Scegli —')}</option>${voci.map(([v, t]) => `<option value="${esc(v)}" ${x[c]===v?'selected':''}>${esc(tr(t))}</option>`).join('')}</select></div>`, nota);
  const corpo = `
    ${testo('np-ric', 'richiesta', tr('Data della richiesta'), 10, '', '', 'date')}
    ${testo('np-org', 'organizzatore', tr('Organizzatore'), 120, tr('Ente o associazione'), tr('La denominazione dell’ente; una persona fisica non si scrive con il nome, ma con il suo codice P, per esempio «P-0007».'))}
    ${testo('np-ev', 'evento', tr('Evento richiesto'), 160, '', tr('Che evento chiedeva di pubblicare, senza nomi di persone.'))}
    ${scelta('np-mot', 'motivo', tr('Motivo'), Object.entries(V_MOTIVO_NP), tr('Ragioni di fatto: non è un’esclusione editoriale, che va nel registro delle esclusioni.'))}
    <div class="due">${testo('np-mdata', 'motivazioneData', `${tr('Motivazione inviata il')} <span class="fac">${fac}</span>`, 10, '', '', 'date')}
      ${scelta('np-mcan', 'motivazioneCanale', `${tr('Canale')} <span class="fac">${fac}</span>`, V_CANALI.map(v => [v, v]))}</div>
    ${testo('np-chiusa', 'chiusa', `${tr('Chiusa il')} <span class="fac">${fac}</span>`, 10, '', tr('Dalla chiusura la riga si conserva cinque anni.'), 'date')}
    ${testo('np-note', 'note', `${tr('Note')} <span class="fac">${fac}</span>`, 300, '', '')}
    ${x.errori.length ? `<div class="red-riquadro pb-errori" role="alert"><b>${tr('Per salvare la riga:')}</b>${x.errori.map(e => `<span class="err">${esc(e)}</span>`).join('')}</div>` : ''}
    ${statoPb()}
    <div class="tasti"><button class="tasto sec" data-az="rx-np">${tr('Annulla')}</button><button class="tasto pri" data-az="rx-np-salva">${x.codice ? tr('Salva la riga') : tr('Aggiungi la riga')}</button></div>
    <p class="meta">${tr('Una riga non si cancella: le correzioni restano annotate, con la data, nella colonna «Rettifiche» (§ 18.4).')}</p>`;
  return foglio('forte alto', testa, corpo);
}
function salvaNp(){
  const x = RX.np; if(!x || PB.lavoro) return;
  const e = [], giorno = (v, lab, serve) => { if(!v){ if(serve) e.push(tr('{c}: scegli il giorno.',{c:lab})); return; } if(!giornoReg(v) || v > oggi()) e.push(tr('{c}: scegli il giorno, non nel futuro.',{c:lab})); };
  giorno(x.richiesta, tr('Data della richiesta'), true);
  if(!x.organizzatore.trim()) e.push(tr('Organizzatore: scrivi la denominazione o il codice P.'));
  if(!x.evento.trim()) e.push(tr('Evento richiesto: scrivi di che evento si tratta, senza nomi.'));
  if(!V_MOTIVO_NP[x.motivo]) e.push(tr('Motivo: scegline uno.'));
  giorno(x.motivazioneData, tr('Motivazione inviata il')); giorno(x.chiusa, tr('Chiusa il'));
  if(x.motivazioneData && !x.motivazioneCanale) e.push(tr('Canale: scegli come hai inviato la motivazione.'));
  x.errori = e; if(e.length){ disegnaFoglio(); return; }
  const d = REG.dati, v = {richiesta:x.richiesta, organizzatore:x.organizzatore.trim(), evento:x.evento.trim(), motivo:x.motivo, motivazioneData:x.motivazioneData, motivazioneCanale:x.motivazioneCanale, chiusa:x.chiusa, note:x.note.trim(), aggiornata:new Date().toISOString(), invio:true};
  let y = x.codice ? d.nonPubblicati.find(z => z.codice===x.codice) : null; const prima = y ? JSON.parse(JSON.stringify(y)) : null, prossimo = d.prossimi.np;
  PB.lavoro = true; PB.errore = ''; disegnaFoglio();
  /* una riga nuova prende il codice NP dallo sportello dell'archivio (T-053, decisione del 27/11/2026, n. 4) */
  (y ? Promise.resolve('') : codiceRegistro('NP', d.prossimi.np)).then(codice => {
    if(y){ rettifica(y, prima, v, {richiesta:'Data della richiesta', organizzatore:'Organizzatore', evento:'Evento richiesto', motivo:'Motivo', motivazioneData:'Motivazione inviata', motivazioneCanale:'Canale', chiusa:'Chiusura', note:'Note'}); Object.assign(y, v); }
    else { y = Object.assign({codice, registrata:oggi(), rettifiche:[]}, v); d.nonPubblicati.push(y); d.prossimi.np = Math.max(d.prossimi.np, numeroCodice(codice)+1); }
    return regSalva().then(() => { PB.lavoro = false; registra(x.codice ? 'np-corretto' : 'np-nuovo', {c:y.codice}); RX.np = null; PB.msg = tr('Riga {c} salvata.',{c:y.codice}); apri('pb-np'); },
      () => { PB.lavoro = false; if(!x.codice){ d.nonPubblicati.pop(); d.prossimi.np = prossimo; } else if(prima){ Object.keys(y).forEach(k => { delete y[k]; }); Object.assign(y, prima); }
        PB.errore = tr('Non sono riuscito a salvare il registro delle fonti su questo dispositivo.'); disegnaFoglio(); });
  }, e => { PB.lavoro = false; PB.errore = erroreCodice(e, tr('della riga')); disegnaFoglio(); });
}

/* ---------- L'importazione del registro tenuto a mano (cap. 22, regola 5) ---------- */
const PREFISSI = {fonti:/^FS-\d{4,}$/, eventi:/^F-\d{5,}$/, np:/^NP-\d{4,}$/};
const COL_PER = {fonti:COL_FONTI, eventi:COL_EVENTI, np:COL_NP};
/* le righe di un foglio del file, come oggetti {intestazione del modello: valore}; l'intestazione si riconosce dal nome */
function righeDelFoglio(fogli, nome, tipo){
  const f = fogli.find(x => normT(x.nome)===normT(nome)); if(!f) return null;
  const note = new Map(COL_PER[tipo].map(c => [normT(c), c]));
  const i = f.righe.findIndex(r => (r||[]).some(c => normT(c)==='codice') && (r||[]).filter(c => note.has(normT(c))).length >= 3);
  if(i<0) return null;
  const mappa = f.righe[i].map(c => note.get(normT(c)) || null), out = [];
  f.righe.slice(i+1).forEach((r, k) => { if(!(r||[]).some(c => cellaTesto(c))) return;
    const o = {__riga:i+k+2}; mappa.forEach((c, j) => { if(c && o[c]===undefined) o[c] = (r||[])[j]; }); out.push(o); });
  return out;
}
const daEtichetta = (diz, v) => { const n = normT(v); return Object.keys(diz).find(k => normT(diz[k])===n) || ''; };
const daEtichettaInizio = (diz, v) => { const n = normT(v); return n ? Object.keys(diz).find(k => normT(diz[k])===n || normT(diz[k]).startsWith(n) || n.startsWith(normT(diz[k]).split(' ').slice(0, 2).join(' '))) || '' : ''; };
function fonteDalFile(o){
  const t = k => cellaTesto(o[k]), punti = {}, problemi = [];
  SETTE_PUNTI.forEach(([n]) => { const g = leggiData(o[PUNTO_COL(n)]); if(g) punti[n] = g; });
  const tipo = daEtichetta(V_TIPO, t('Tipo')), gr = normT(t('Grado')), grado = /^[1-4]$/.test(gr) ? gr : gr==='esclusa' ? 'esclusa' : '';
  const esito = daEtichettaInizio(V_ESITO, t('Esito')), lic = daEtichetta(V_LICENZA, t('Licenza del calendario')), st = normT(t('Stato'));
  if(!tipo) problemi.push(tr('tipo non riconosciuto'));
  if(!grado) problemi.push(tr('grado non riconosciuto'));
  if(!esito) problemi.push(tr('esito non riconosciuto'));
  const f = {codice:t('Codice').toUpperCase(), nome:t('Nome della fonte').slice(0, 120), tipo, grado, indirizzo:t('Indirizzo').slice(0, 500), lette:leggiData(o['Condizioni lette il'])||'', esito,
    licenzaTipo:lic==='np' ? '' : lic, licenza:t('Nome della licenza').slice(0, 120), attribuzione:t('Attribuzione richiesta').slice(0, 160), punti, stato:st==='non piu in uso' ? 'non' : 'uso',
    note:t('Note').slice(0, 300), registrata:leggiData(o['Data di registrazione'])||'', aggiornata:new Date().toISOString(), invio:true,
    rettifiche:t('Rettifiche') ? [{data:'', testo:t('Rettifiche').slice(0, 400)}] : [],
    extra:{funzione:t('Funzione che annota').slice(0, 60), rif:t('Rif. libro mastro').slice(0, 60), collegamenti:t('Collegamenti').slice(0, 200), contestazione:t('Contestazione in corso').slice(0, 10)}};
  return {f, problemi};
}
function rigaDalRegistro(o){
  const t = k => cellaTesto(o[k]), colonne = {};
  COL_EVENTI.forEach(c => { const v = o[c]; if(v!=null && v!=='') colonne[c] = typeof v==='number' ? v : String(v).slice(0, 400); });
  const q = o['Data e ora di pubblicazione'], g = leggiData(q), h = leggiOra(typeof q==='number' ? q : String(q||'').split(/\s+/)[1]);
  const quando = g ? new Date(dIso(g).getTime() + (h ? (+h.slice(0,2)*60 + +h.slice(3))*6e4 : 0)).toISOString() : '';
  const rit = leggiData(o['Ritiro prima della fine: data']);
  return {codice:t('Codice').toUpperCase(), id:t("Identificativo dell'evento").slice(0, 60), quando, corretto:'', nascosto:normT(t('Evento nascosto'))==='si', canale:daEtichetta(V_CANALE, t('Canale di immissione')) || 'singolo',
    funzione:t('Funzione che annota') || 'Redazione eventi', titolo:t('Titolo (senza nomi di persone)').slice(0, 200), testoFonte:t('Testo del campo «Fonte:»').slice(0, 160), collegamento:t("Collegamento alla pagina dell'evento").slice(0, 500),
    fs:t('Fonte (codice FS)').toUpperCase(), ritiro:rit ? {data:rit, motivo:daEtichetta(V_RITIRO, t('Motivo del ritiro'))} : null, scadenza:leggiData(o['Scadenza della conservazione']) || (g ? piuAnni(g, CINQUE_ANNI) : ''),
    rettifiche:[], mano:true, invio:true, colonne};
}
function npDalFile(o){
  const t = k => cellaTesto(o[k]);
  return {codice:t('Codice').toUpperCase(), registrata:leggiData(o['Data di registrazione'])||'', richiesta:leggiData(o['Data della richiesta'])||'', organizzatore:t('Organizzatore (denominazione o codice P)').slice(0, 120),
    evento:t('Evento richiesto (senza nomi)').slice(0, 160), motivo:daEtichetta(V_MOTIVO_NP, t('Motivo')), motivazioneData:leggiData(o['Motivazione inviata: data'])||'', motivazioneCanale:t('Motivazione: canale').slice(0, 40),
    chiusa:leggiData(o['Data di chiusura']) || (normT(t('Stato'))==='chiusa' ? leggiData(o['Data di registrazione'])||'' : ''), note:t('Note').slice(0, 300), aggiornata:new Date().toISOString(), invio:true,
    rettifiche:t('Rettifiche') ? [{data:'', testo:t('Rettifiche').slice(0, 400)}] : [], extra:{funzione:t('Funzione che annota').slice(0, 60), rif:t('Rif. libro mastro').slice(0, 60), collegamenti:t('Collegamenti').slice(0, 200), contestazione:t('Contestazione in corso').slice(0, 10)}};
}
const stessaFonte = (a, b) => normT(a.nome)===normT(b.nome) && normT(a.indirizzo)===normT(b.indirizzo);
function importaRegistro(file){
  const nome = String(file.name||'');
  RX.imp = {nome, fase:'leggo', errore:'', fonti:[], righe:[], np:[], scarti:[]}; PB.errore = ''; PB.msg = ''; apri('pb-regimporta');
  const I = RX.imp;
  Promise.all([file.arrayBuffer().then(b => MODULI.excel.leggi(b, nome)), regApri()]).then(([wb]) => {
    if(RX.imp!==I) return;
    if(REG.stato!=='aperto'){ I.fase = 'pronto'; I.errore = statoRegistro(); disegnaFoglio(); return; }
    const d = REG.dati, F = righeDelFoglio(wb.fogli, 'Fonti', 'fonti'), E = righeDelFoglio(wb.fogli, 'Eventi', 'eventi'), N = righeDelFoglio(wb.fogli, 'Non pubblicati', 'np');
    if(!F && !E && !N){ I.fase = 'pronto'; I.errore = tr('Nel file non trovo i fogli «Fonti», «Eventi» e «Non pubblicati» del registro delle fonti, con le intestazioni del modello.'); disegnaFoglio(); return; }
    const esempio = o => normT(o.Codice)==='esempio' || !cellaTesto(o.Codice);
    const visti = new Set();
    (F||[]).filter(o => !esempio(o)).forEach(o => { const {f, problemi} = fonteDalFile(o), qui = regFonte(f.codice);
      if(!PREFISSI.fonti.test(f.codice) || visti.has(f.codice)){ I.scarti.push(tr('Fonti, riga {r}: codice «{c}» non valido o ripetuto',{r:o.__riga, c:f.codice.slice(0, 20)})); return; } visti.add(f.codice);
      if(!f.nome){ I.scarti.push(tr('Fonti, riga {r}: manca il nome della fonte',{r:o.__riga})); return; }
      I.fonti.push({f, riga:o.__riga, problemi, esito:!qui ? 'nuova' : stessaFonte(qui, f) ? 'presente' : 'contrasto', qui}); });
    (E||[]).filter(o => !esempio(o)).forEach(o => { const r = rigaDalRegistro(o);
      if(!PREFISSI.eventi.test(r.codice) || visti.has(r.codice)){ I.scarti.push(tr('Eventi, riga {r}: codice «{c}» non valido o ripetuto',{r:o.__riga, c:r.codice.slice(0, 20)})); return; } visti.add(r.codice);
      if(!r.id || !r.quando){ I.scarti.push(tr('Eventi, riga {r}: mancano l’identificativo o la data di pubblicazione',{r:o.__riga})); return; }
      const qui = d.eventi.find(x => x.codice===r.codice || x.id===r.id);
      I.righe.push({r, riga:o.__riga, esito:!qui ? 'nuova' : qui.codice===r.codice && qui.id===r.id ? 'presente' : 'contrasto'}); });
    (N||[]).filter(o => !esempio(o)).forEach(o => { const x = npDalFile(o);
      if(!PREFISSI.np.test(x.codice) || visti.has(x.codice)){ I.scarti.push(tr('Non pubblicati, riga {r}: codice «{c}» non valido o ripetuto',{r:o.__riga, c:x.codice.slice(0, 20)})); return; } visti.add(x.codice);
      const qui = d.nonPubblicati.find(y => y.codice===x.codice);
      I.np.push({x, riga:o.__riga, esito:!qui ? 'nuova' : normT(qui.evento)===normT(x.evento) && qui.richiesta===x.richiesta ? 'presente' : 'contrasto'}); });
    I.fase = 'pronto'; disegnaFoglio();
  }).catch(e => { if(RX.imp!==I) return; I.fase = 'pronto';
    I.errore = e && e.motivo==='protetto' ? tr('Il file si apre con una password: l’app non lo legge così. Aprilo con il programma del dispositivo, salvane una copia senza password solo per l’importazione, importala e poi cancellala.')
      : tr('Il file non si legge: controlla che sia il file .xlsx del registro delle fonti.'); disegnaFoglio(); });
}
function fPbRegImporta(){
  const I = RX.imp, testa = `<div class="riga-titolo"><div><h2>${tr('Importa il registro tenuto a mano')}</h2><p class="meta">${I ? esc(I.nome) : ''}</p></div>${chiudiBtn('pb-registro')}</div>`;
  if(!I) return foglio('forte', testa, '');
  if(I.fase==='leggo') return foglio('forte', testa, `<p class="caricamento">${tr('Leggo il file…')}</p>`);
  const conta = (l, e) => l.filter(x => x.esito===e).length, nuove = conta(I.fonti, 'nuova')+conta(I.righe, 'nuova')+conta(I.np, 'nuova');
  const contrasti = I.fonti.filter(x => x.esito==='contrasto').map(x => tr('{c}: nel file «{a}», sul dispositivo «{b}»',{c:x.f.codice, a:x.f.nome, b:x.qui.nome}))
    .concat(I.righe.filter(x => x.esito==='contrasto').map(x => tr('{c}: il codice o l’identificativo c’è già, con un’altra riga',{c:x.r.codice})), I.np.filter(x => x.esito==='contrasto').map(x => tr('{c}: c’è già un’altra richiesta con questo codice',{c:x.x.codice})));
  const problemi = I.fonti.filter(x => x.esito==='nuova' && x.problemi.length).map(x => tr('{c}: {p} (correggila nell’elenco delle fonti prima di usarla)',{c:x.f.codice, p:x.problemi.join(', ')}));
  const gruppo = (tit, l) => l.length ? `<p class="etich">${tit} · ${l.length}</p><div class="imp-righe">${l.map(x => `<div>${esc(x)}</div>`).join('')}</div>` : '';
  const corpo = `${I.errore ? `<p class="err" role="alert">${esc(I.errore)}</p>` : ''}${statoPb()}
    ${I.errore ? '' : `<p>${tr('Nel file: {f} fonti, {e} righe degli eventi, {n} non pubblicati.',{f:I.fonti.length, e:I.righe.length, n:I.np.length})}</p>
    <p class="meta">${tr('Entrano con i loro codici, che non si rinumerano. Ciò che c’è già sul dispositivo non si tocca; ciò che è in contrasto resta fuori e si sistema a mano. Le voci importate partono per lo sportello con la prossima pubblicazione, insieme al primo codice F che lo sportello può dare dopo quelli scritti a mano.')}</p>
    ${gruppo(tr('Da importare'), [[conta(I.fonti, 'nuova'), tr('fonti')], [conta(I.righe, 'nuova'), tr('righe degli eventi')], [conta(I.np, 'nuova'), tr('non pubblicati')]].filter(x => x[0]).map(x => x[0]+' '+x[1]))}
    ${gruppo(tr('Già sul dispositivo'), [[conta(I.fonti, 'presente'), tr('fonti')], [conta(I.righe, 'presente'), tr('righe degli eventi')], [conta(I.np, 'presente'), tr('non pubblicati')]].filter(x => x[0]).map(x => x[0]+' '+x[1]))}
    ${gruppo(tr('In contrasto: restano fuori'), contrasti)}${gruppo(tr('Da controllare dopo l’importazione'), problemi)}${gruppo(tr('Scartate'), I.scarti)}`}
    <div class="tasti"><button class="tasto sec" data-az="pb-registro">${tr('Annulla')}</button><button class="tasto pri" data-az="rx-importa-ok" ${nuove && !PB.lavoro && !I.errore ? '' : 'disabled'}>${tr('Importa')}</button></div>`;
  return foglio('forte alto', testa, corpo);
}
function confermaImportRegistro(){
  const I = RX.imp; if(!I || PB.lavoro || REG.stato!=='aperto') return;
  const d = REG.dati, prima = JSON.stringify(d);
  I.fonti.filter(x => x.esito==='nuova').forEach(x => d.fonti.push(x.f));
  I.righe.filter(x => x.esito==='nuova').forEach(x => d.eventi.push(x.r));
  I.np.filter(x => x.esito==='nuova').forEach(x => d.nonPubblicati.push(x.x));
  const n = I.fonti.filter(x => x.esito==='nuova').length + I.righe.filter(x => x.esito==='nuova').length + I.np.filter(x => x.esito==='nuova').length;
  REG.dati = regInForma(d);
  PB.lavoro = true; disegnaFoglio();
  regSalva().then(() => { PB.lavoro = false; registra('registro-importa', {n}); RX.imp = null; PB.msg = tr('Importate {n} voci del registro tenuto a mano.',{n}); apri('pb-registro'); },
    () => { PB.lavoro = false; REG.dati = regInForma(JSON.parse(prima)); PB.errore = tr('Non sono riuscito a salvare il registro delle fonti su questo dispositivo.'); disegnaFoglio(); });
}

/* ---------- Il confronto con lo sportello (cap. 22, regola 4; un secondo dispositivo) ---------- */
function apriConfronto(){
  const a = oggi(); RX.conf = RX.conf || {da:a.slice(0, 4)+'-01-01', a, fase:'', esito:null, errore:''};
  RX.conf.esito = null; RX.conf.errore = ''; PB.errore = ''; PB.msg = ''; apri('pb-confronto');
}
/* tutte le buste dello sportello, a blocchi di 500, e gli eventi pubblicati la prima volta nel periodo (con un giorno in più per parte, perché l'ora della riga è quella del dispositivo e quella della copia è dello sportello) */
async function leggiSportelloRegistro(da, a){
  const buste = []; let pubblicati = [], dopo, giri = 0;
  for(;;){
    const c = {operazione:'registro'}; if(dopo) c.dopo = dopo; if(!giri){ c.da = piuGiorni(da, -1); c.a = piuGiorni(a, 1); }
    const r = await SPORTELLO.chiedi(c); buste.push(...(r.buste||[])); if(!giri) pubblicati = r.pubblicati||[];
    if(!r.altre || !(r.buste||[]).length || ++giri > 40) break;
    dopo = r.buste[r.buste.length-1].nome;
  }
  return {buste, pubblicati};
}
async function confronta(){
  const C = RX.conf; if(!C || C.fase==='lavoro') return;
  if(!giornoReg(C.da) || !giornoReg(C.a) || C.da > C.a){ C.errore = tr('Scegli un periodo: il primo giorno e l’ultimo, in quest’ordine.'); disegnaFoglio(); return; }
  C.fase = 'lavoro'; C.errore = ''; C.esito = null; disegnaFoglio();
  try{
    await regApri(); if(REG.stato!=='aperto') throw Object.assign(new Error('registro'), {motivo:'registro'});
    const {buste, pubblicati} = await leggiSportelloRegistro(C.da, C.a);
    const aperte = []; let chiuse = 0;
    for(const b of buste.sort((x, y) => x.nome < y.nome ? -1 : 1)){
      try{ const x = JSON.parse(await CHIAVI.registro.decifra(b.busta)); aperte.push({b, x}); }catch(e){ chiuse++; }
    }
    const d = REG.dati, righe = new Map(d.eventi.map(r => [r.id, r]));
    /* che cosa c'è nelle buste e manca qui: righe (con il codice F dato dallo sportello), fonti e «Non pubblicati» */
    const daSportello = new Map(), fonti = new Map(), np = new Map(), contrasti = [];
    aperte.forEach(({b, x}) => {
      (Array.isArray(x.righe) ? x.righe : []).forEach(r => { if(!r || typeof r.id!=='string') return; const prec = daSportello.get(r.id);
        const y = Object.assign({}, r, {codice:(b.codici||{})[r.id] || r.codice || (prec||{}).codice || '', quando:(prec && prec.quando) || r.quando || '', agg:b.quando});
        daSportello.set(r.id, y); });
      (Array.isArray(x.fonti) ? x.fonti : []).forEach(f => { if(f && PREFISSI.fonti.test(f.codice)) fonti.set(f.codice, f); });
      (Array.isArray(x.nonPubblicati) ? x.nonPubblicati : []).forEach(y => { if(y && PREFISSI.np.test(y.codice)) np.set(y.codice, y); });
    });
    const cmp = r => JSON.stringify([r.g, r.titolo, r.ritiro && r.ritiro.motivo, r.testoFonte, r.collegamento, r.colonne]);
    const nuoveRighe = [...daSportello.values()].filter(r => { const q = righe.get(r.id); return !q || (!q.codice && r.codice) || (!q.quando && r.quando) || String(r.agg) > String(q.agg || q.corretto || q.quando || '') && cmp(r)!==cmp(q); });
    const nuoveFonti = [...fonti.values()].filter(f => { const q = regFonte(f.codice); if(!q) return true; if(!stessaFonte(q, f)){ contrasti.push(tr('{c}: sullo sportello «{a}», qui «{b}»',{c:f.codice, a:f.nome, b:q.nome})); return false; } return String(f.aggiornata||'') > String(q.aggiornata||''); });
    const nuoviNp = [...np.values()].filter(y => { const q = d.nonPubblicati.find(z => z.codice===y.codice); return !q || String(y.aggiornata||'') > String(q.aggiornata||''); });
    /* la corrispondenza nel periodo: gli eventi pubblicati la prima volta, secondo lo storico, contro le righe */
    const tutte = new Map([...righe].concat([...daSportello].filter(([id]) => !righe.has(id))));
    const nel = (g, x) => g >= C.da && g <= C.a, idPub = new Set(pubblicati.map(p => p.id));
    const pubNel = pubblicati.filter(p => nel(giornoRiga(p))), righeNel = [...tutte.values()].filter(r => !r.mano && r.quando && nel(giornoRiga(r)));
    const senzaRiga = pubNel.filter(p => !tutte.has(p.id)), senzaEvento = righeNel.filter(r => !idPub.has(r.id));
    C.esito = {pubblicati:pubNel.length, righe:righeNel.length, mano:[...tutte.values()].filter(r => r.mano && nel(giornoRiga(r))).length, senzaRiga, senzaEvento, chiuse, buste:buste.length,
      nuoveRighe, nuoveFonti, nuoviNp, contrasti};
    registra('registro-confronta', {n:pubNel.length});
  }catch(e){ C.errore = e && e.motivo==='registro' ? statoRegistro() : errorePb(e); }
  C.fase = ''; if(st.foglio==='pb-confronto') disegnaFoglio();
}
function riprendiDalloSportello(){
  const C = RX.conf, E = C && C.esito; if(!E || PB.lavoro || REG.stato!=='aperto') return;
  const d = REG.dati, prima = JSON.stringify(d);
  E.nuoveRighe.forEach(r => { const q = d.eventi.find(x => x.id===r.id), y = Object.assign({}, r); delete y.invio;
    if(!q){ y.invio = false; d.eventi.push(y); return; }
    const quando = q.quando || y.quando, codice = q.codice || y.codice;
    if(String(y.agg) > String(q.agg || q.corretto || q.quando || '')) Object.assign(q, y); q.quando = quando; q.codice = codice; q.invio = false; });
  E.nuoveFonti.forEach(f => { const q = regFonte(f.codice), y = Object.assign({}, f, {invio:false}); if(q) Object.assign(q, y); else d.fonti.push(y); });
  E.nuoviNp.forEach(x => { const q = d.nonPubblicati.find(z => z.codice===x.codice), y = Object.assign({}, x, {invio:false}); if(q) Object.assign(q, y); else d.nonPubblicati.push(y); });
  const n = E.nuoveRighe.length + E.nuoveFonti.length + E.nuoviNp.length;
  REG.dati = regInForma(d); PB.lavoro = true; disegnaFoglio();
  regSalva().then(() => { PB.lavoro = false; registra('registro-riprendi', {n}); PB.msg = tr('Riprese dallo sportello {n} voci del registro.',{n}); C.esito = null; disegnaFoglio(); },
    () => { PB.lavoro = false; REG.dati = regInForma(JSON.parse(prima)); PB.errore = tr('Non sono riuscito a salvare il registro delle fonti su questo dispositivo.'); disegnaFoglio(); });
}
function fPbConfronto(){
  const C = RX.conf, testa = `<div class="riga-titolo"><div><h2>${tr('Confronta con lo sportello')}</h2><p class="meta">${tr('Registro delle fonti · cap. 22, regola 4')}</p></div>${chiudiBtn('pb-registro')}</div>`;
  if(!C) return foglio('forte', testa, '');
  const E = C.esito, giorno = x => esc(dIso(x).toLocaleDateString(dloc(), {day:'numeric', month:'short', year:'numeric'}));
  const lista = (tit, l, f) => l.length ? `<p class="etich">${tit} · ${l.length}</p><div class="imp-righe">${l.slice(0, 200).map(x => `<div>${f(x)}</div>`).join('')}${l.length>200 ? `<div>${tr('… e altre {n}',{n:l.length-200})}</div>` : ''}</div>` : '';
  const esito = !E ? '' : `<div class="red-riquadro" role="status"><b>${E.pubblicati===E.righe && !E.senzaRiga.length && !E.senzaEvento.length ? tr('Le righe corrispondono agli eventi pubblicati: {n}.',{n:E.pubblicati}) : tr('Eventi pubblicati la prima volta nel periodo, secondo lo storico: {p} · righe del registro nel periodo: {r}.',{p:E.pubblicati, r:E.righe})}</b>
      <span class="meta">${tr('Una differenza è uno scarto da spiegare e correggere prima del rilascio (§ 18.8). Le righe scritte a mano ({m} nel periodo) non si confrontano: quegli eventi non sono passati dallo sportello.',{m:E.mano})}${E.chiuse ? ' '+tr('{n} buste dello sportello non si aprono con la chiave del registro di questo dispositivo.',{n:E.chiuse}) : ''}</span></div>
    ${lista(tr('Pubblicati senza una riga del registro'), E.senzaRiga, p => `<code class="red-id">${esc(p.id)}</code> · ${esc(quandoPb(p.quando))}${p.codice ? ' · '+esc(p.codice) : ''}`)}
    ${lista(tr('Righe senza un evento pubblicato nello storico'), E.senzaEvento, r => `${esc(r.codice||'—')} · ${esc(r.titolo)} · ${esc(quandoPb(r.quando))}`)}
    ${lista(tr('Fonti in contrasto: stesso codice, fonte diversa'), E.contrasti, x => esc(x))}
    ${E.nuoveRighe.length + E.nuoveFonti.length + E.nuoviNp.length ? `<div class="red-riquadro"><b>${tr('Sullo sportello ci sono voci che qui mancano o sono più vecchie')}</b>
      <span class="meta">${tr('{r} righe degli eventi, {f} fonti, {n} non pubblicati: le ha scritte un altro dispositivo, oppure questo prima di un ripristino.',{r:E.nuoveRighe.length, f:E.nuoveFonti.length, n:E.nuoviNp.length})}</span>
      <div class="tasti"><button class="tasto pri" data-az="rx-riprendi" ${PB.lavoro ? 'disabled' : ''}>${tr('Riprendile su questo dispositivo')}</button></div></div>`
      : `<p class="meta">${tr('Su questo dispositivo ci sono già tutte le voci che lo sportello conserva ({b} buste).',{b:E.buste})}</p>`}`;
  const corpo = `<p class="meta">${tr('Nel riesame il numero di righe del periodo deve corrispondere al numero di eventi pubblicati, ricavato dallo storico delle pubblicazioni. Lo sportello restituisce le sue buste del registro, chiuse: si aprono qui, con la chiave del registro.')}</p>
    <div class="due"><div class="stack-s"><label class="etich" for="rx-da">${tr('Dal')}</label><div class="campo"><input id="rx-da" type="date" data-rxcampo="da" value="${esc(C.da)}"></div></div>
      <div class="stack-s"><label class="etich" for="rx-a">${tr('Al')}</label><div class="campo"><input id="rx-a" type="date" data-rxcampo="a" value="${esc(C.a)}"></div></div></div>
    ${C.errore ? `<p class="err" role="alert">${esc(C.errore)}</p>` : ''}${statoPb()}
    <div class="tasti"><button class="tasto pri" data-az="rx-confronta-ok" ${C.fase==='lavoro' ? 'disabled' : ''}>${C.fase==='lavoro' ? tr('Chiedo allo sportello…') : tr('Confronta')}</button></div>
    ${C.fase==='lavoro' ? `<p class="caricamento">${tr('Chiedo allo sportello le buste del registro e lo storico del periodo…')}</p>` : ''}
    ${C.da && C.a && E ? `<p class="meta">${tr('Periodo: dal {a} al {b}.',{a:giorno(C.da), b:giorno(C.a)})}</p>` : ''}${esito}`;
  return foglio('forte alto', testa, corpo);
}

/* ---------- Tocchi, campi e file ---------- */
function scegliFileRegistro(scopo){ RX.scopo = scopo; $('fileRegistro').click(); }
$('fileRegistro').addEventListener('change', function(){
  const f = this.files && this.files[0], scopo = RX.scopo || (st.foglio==='pb-calendario' ? 'calendario' : 'registro'); RX.scopo = ''; this.value = ''; if(!f) return;
  if(scopo==='registro') importaRegistro(f);
  else if(scopo==='calendario' && typeof importaCalendario==='function') importaCalendario(f);
});
function clickRegistro(t){
  if(t.dataset.rxnp){ apriNp(t.dataset.rxnp); return true; }
  return false;
}
function azioneRegistro(az){
  switch(az){
    case 'pb-registro': PB.fonte = null; RX.np = null; PB.errore = ''; apri('pb-registro'); regApri().then(ridisegnaPb); break;
    case 'rx-np': RX.np = null; PB.errore = ''; apri('pb-np'); regApri().then(ridisegnaPb); break;
    case 'rx-np-nuovo': apriNp(null); break;
    case 'rx-np-salva': salvaNp(); break;
    case 'rx-esporta': regApri().then(esportaRegistro); break;
    case 'rx-importa': scegliFileRegistro('registro'); break;
    case 'rx-importa-ok': confermaImportRegistro(); break;
    case 'rx-confronta': apriConfronto(); break;
    case 'rx-confronta-ok': confronta(); break;
    case 'rx-riprendi': riprendiDalloSportello(); break;
    default: return false;
  }
  return true;
}
function inputRegistro(el){
  const d = el.dataset;
  if(d.npcampo && RX.np){ RX.np[d.npcampo] = el.value; return true; }
  if(d.rxcampo && RX.conf){ RX.conf[d.rxcampo] = el.value; return true; }
  return false;
}
const cambioRegistro = inputRegistro;
