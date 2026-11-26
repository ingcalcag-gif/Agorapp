/* ======================= «Esporta per assistenza» (T-049) =======================
   Libro mastro: § 2.6 «L'assistente di intelligenza artificiale» (copie con i nomi sostituiti, anteprima, tabella di
   corrispondenza sul dispositivo; se una copia non si può rendere irriconoscibile, non si fa); § 3.5 «L'assistenza
   tecnica»; § 12.5, regola 1. L'eccezione aspetta il sì nella revisione finale del libro mastro (sezione 6 del piano):
   la voce si costruisce ma si usa soltanto dopo il sì. Decisione del 26/11/2026, n. 16.

   Serve in un caso solo: dopo il lancio, un guasto che si vede soltanto con eventi veri. Sta solo nell'app della
   redazione. La Redazione sceglie a mano da 1 a 10 eventi pubblicati (mai i nascosti, mai le password) e, se vuole,
   scrive i nomi delle persone che vi compaiono, una persona per riga. Di ogni evento parte soltanto strato, città e
   mese, e quali persone contiene come Persona_1, Persona_2…: nessun testo dell'evento, nessuna data precisa, nessun
   luogo né recapito, nessun identificativo. Tutti gli eventi sono pubblici, quindi chi riceve la copia potrebbe
   cercarli nell'app: un evento parte solo se nell'archivio ci sono almeno 5 eventi con la stessa città, lo stesso mese
   e lo stesso strato (regola dei cinque); altrimenti non parte, e se non ne parte nessuno la copia non si fa.
   L'anteprima mostra esattamente il file; la tabella di corrispondenza (Evento_1 = quale evento, Persona_1 = quale
   nome) si vede soltanto nella pagina aperta e non si salva.

   Con lo sportello di prova funziona, sugli eventi inventati. Con lo sportello vero «Esporta» resta spento finché
   funzioni.esporta_assistenza di sorgenti/config.js non diventa true, con un commit dopo il sì. Il file è isolato:
   con un no si toglie da JS_RED di sorgenti/build.js e dal disco, con prove/browser/assistenza.js e il valore della
   configurazione, senza toccare altro.

   Testi come testo (T-024): titoli e nomi entrano nella pagina solo con esc(). */
const PA = {eventi:null, sel:[], nomi:'', anteprima:null, lavoro:false, errore:'', msg:''};
const ASSISTENZA_MAX = 10, ASSISTENZA_SOGLIA = 5;
fogliPb.push('pa');
OP_STORICO['assistenza-esporta'] = ['file', 'Copia per l’assistenza esportata'];
const assistenzaAccesa = () => SPORTELLO.diProva() || (CFG.funzioni||{}).esporta_assistenza === true;
const cittaAssistenza = ev => { const c = cittaDi(ev); return c==='altro' ? tr('Fuori dalle città') : nomeCitta(c); };
const meseAssistenza = ev => String(ev.inizio||'').slice(0, 7);
const gruppoAssistenza = ev => ev.strato+'|'+cittaAssistenza(ev)+'|'+meseAssistenza(ev);

function apriAssistenza(){
  Object.assign(PA, {eventi:null, sel:[], nomi:'', anteprima:null, lavoro:true, errore:'', msg:''}); apri('pa');
  SPORTELLO.chiedi({operazione:'stato'}).then(s => { PA.eventi = s.eventi.slice().sort((a, b) => a.inizio<b.inizio?-1:1); }, e => { PA.eventi = []; PA.errore = errorePb(e); })
    .then(() => { PA.lavoro = false; ridisegnaPb(); });
}
/* le persone: una per riga; più forme della stessa persona sulla stessa riga, separate da «/» */
const personeAssistenza = () => PA.nomi.split(/\r?\n/).map(r => MODULI.nomi.forme(r.split('/').join('\n'))).filter(f => f.length).slice(0, 20);
function preparaAssistenza(){
  const N = MODULI.nomi, persone = personeAssistenza(), tutti = PA.eventi||[], conta = new Map();
  tutti.forEach(ev => { const g = gruppoAssistenza(ev); conta.set(g, (conta.get(g)||0) + 1); });
  const testi = ev => N.CAMPI.map(c => { const v = N.leggiCampo(ev, c); try{ return c==='fonte.collegamento' ? decodeURIComponent(v) : v; }catch(e){ return v; } }).join('\n');
  let n = 0;
  const righe = PA.sel.map(id => tutti.find(ev => ev.id===id)).filter(Boolean).map(ev => {
    const quanti = conta.get(gruppoAssistenza(ev))||0, parte = quanti >= ASSISTENZA_SOGLIA, t = testi(ev);
    return {ev, parte, quanti, nome:parte ? 'Evento_'+(++n) : '', persone:persone.map((f, k) => N.contiene(t, f) ? 'Persona_'+(k+1) : '').filter(Boolean)};
  });
  const copia = {tipo:'copia-per-assistenza', versione:1, nota:'Strato, città e mese di eventi pubblici scelti dalla Redazione; nessun testo degli eventi, nessun nome, nessun recapito.',
    eventi:righe.filter(r => r.parte).map(r => Object.assign({evento:r.nome, strato:r.ev.strato, citta:cittaAssistenza(r.ev), mese:meseAssistenza(r.ev)}, r.persone.length ? {persone:r.persone} : {}))};
  PA.anteprima = {righe, persone, copia, testo:JSON.stringify(copia, null, 1)};
}
function fPa(){
  const testa = `<div class="riga-titolo"><div><h2>${tr('Esporta per assistenza')}</h2><p class="meta">${tr('Una copia senza nomi per l’assistente di intelligenza artificiale (§ 2.6)')}</p></div>${chiudiBtn('admin')}</div>`;
  const acceso = assistenzaAccesa(), A = PA.anteprima;
  const spiega = `<div class="red-riquadro" role="note"><b>${tr('Solo per un guasto che si vede con eventi veri')}</b>
      <span class="meta">${tr('Di ogni evento scelto parte soltanto strato, città e mese, e quali persone contiene come Persona_1, Persona_2… Nessun titolo, descrizione, luogo, indirizzo, data precisa o recapito; mai eventi nascosti né password.')}</span>
      <span class="meta">${tr('Un evento parte solo se nell’archivio ci sono almeno {n} eventi con la stessa città, lo stesso mese e lo stesso strato: così chi riceve la copia non può capire quale sia.',{n:ASSISTENZA_SOGLIA})}</span>
      ${acceso ? (SPORTELLO.diProva() ? `<span class="meta">${tr('Sportello di prova: funziona sugli eventi inventati. Con lo sportello vero resta spento fino al sì nella revisione finale del libro mastro.')}</span>` : '')
        : `<span class="err">${tr('In attesa del sì nella revisione finale del libro mastro: «Esporta» è spento (sezione 6 del piano).')}</span>`}</div>`;
  const stato = `${PA.errore ? `<p class="err" role="alert">${esc(PA.errore)}</p>` : ''}${PA.msg ? `<p class="meta" role="status" style="color:var(--testo)">${esc(PA.msg)}</p>` : ''}${PA.lavoro ? `<p class="caricamento">${tr('Chiedo l’elenco allo sportello…')}</p>` : ''}`;
  const E = PA.eventi;
  const scelta = !E ? '' : !E.length ? `<p class="meta">${tr('Nessun evento pubblicato.')}</p>` : `<p class="etich">${tr('Gli eventi del guasto')} · ${PA.sel.length}/${ASSISTENZA_MAX}</p>
    <div class="menu-lista pa-scelta">${E.map(ev => `<button class="riga-int" data-pae="${esc(ev.id)}" aria-pressed="${PA.sel.includes(ev.id)}"><span class="casella" aria-hidden="true"></span><div><span class="t">${esc(ev.titolo)}</span><span class="meta">${esc(quandoEv(ev))} · ${esc(ev.luogo)}</span></div></button>`).join('')}</div>
    <label class="etich" for="pa-nomi">${tr('Le persone che compaiono in questi eventi')} <span class="fac">${tr('facoltativo')}</span></label>
    <div class="campo"><textarea id="pa-nomi" data-pa="nomi" maxlength="1200" placeholder="${esc(tr('Una persona per riga; più forme della stessa persona separate da /'))}">${esc(PA.nomi)}</textarea></div>
    <span class="meta">${tr('I nomi non partono: servono solo a dire «contiene Persona_1».')}</span>
    <div class="tasti"><button class="tasto pri" data-az="pa-anteprima" ${PA.sel.length ? '' : 'disabled'}>${tr('Prepara l’anteprima')}</button></div>`;
  const parte = A ? A.copia.eventi.length : 0;
  const anteprima = !A ? '' : `${A.righe.filter(r => !r.parte).map(r => `<p class="meta">${tr('«{t}» non parte: nell’archivio ci sono {q} eventi con la stessa città, lo stesso mese e lo stesso strato, ne servono almeno {n}.',{t:esc(r.ev.titolo), q:r.quanti, n:ASSISTENZA_SOGLIA})}</p>`).join('')}
    ${parte ? `<p class="etich">${tr('Ciò che parte, esattamente')}</p><pre class="pa-anteprima">${esc(A.testo)}</pre>`
      : `<p class="err" role="status">${tr('Nessun evento si può rendere irriconoscibile: la copia non si fa (§ 2.6). Descrivi il guasto a parole.')}</p>`}
    <p class="etich">${tr('Tabella di corrispondenza: resta qui, non parte e non si salva')}</p>
    <div class="imp-righe">${A.righe.filter(r => r.parte).map(r => `<div>${esc(r.nome)} = ${esc(r.ev.titolo)} · ${esc(quandoEv(r.ev))}</div>`).join('')}${A.persone.map((f, k) => `<div>Persona_${k+1} = ${esc(f.map(x => x.forma).join(' / '))}</div>`).join('')}</div>
    <div class="tasti"><button class="tasto pri" data-az="pa-esporta" ${parte && acceso ? '' : 'disabled'}>${tr('Esporta la copia')}</button></div>
    <p class="meta">${tr('Il file resta su questo dispositivo: decidi tu se darlo all’assistente. Le schermate e i messaggi degli utenti non si girano: se ne descrive il problema.')}</p>`;
  return foglio('forte alto', testa, `${spiega}${stato}${scelta}${anteprima}`);
}
function esportaAssistenza(){
  const A = PA.anteprima; if(!A || !A.copia.eventi.length || !assistenzaAccesa()) return;
  const nome = 'assistenza-'+oggi()+'.json';
  scaricaBlob(new Blob([A.testo], {type:'application/json'}), nome);
  registra('assistenza-esporta', {n:A.copia.eventi.length}); PA.msg = tr('Copia esportata: {f}.',{f:nome}); disegnaFoglio();
}

DIRITTI.push({
  voce:() => `<button class="menu-r" data-az="pa">${icoEsporta}<div><span class="t">${tr('Esporta per assistenza')}</span><span class="meta">${assistenzaAccesa() ? tr('Una copia senza nomi per capire un guasto, da 1 a 10 eventi') : tr('In attesa del sì nella revisione finale del libro mastro')}</span></div>${freccia}</button>`,
  click(t){ const id = t.dataset.pae; if(id==null) return false;
    const i = PA.sel.indexOf(id); if(i>=0) PA.sel.splice(i, 1); else if(PA.sel.length < ASSISTENZA_MAX) PA.sel.push(id); else PA.msg = tr('Al massimo {n} eventi.',{n:ASSISTENZA_MAX});
    PA.anteprima = null; disegnaFoglio(); return true; },
  azione(az){
    switch(az){
      case 'pa': apriAssistenza(); return true;
      case 'pa-anteprima': if(PA.sel.length){ PA.msg = ''; preparaAssistenza(); disegnaFoglio(); } return true;
      case 'pa-esporta': esportaAssistenza(); return true;
    }
    return false;
  },
  input(el){ if(el.dataset.pa!=='nomi') return false; PA.nomi = el.value; return true; }   /* l'anteprima cambia solo con «Prepara l'anteprima»: è sempre il file che parte */
});
Object.assign(FOGLI_RED, {pa:fPa});
