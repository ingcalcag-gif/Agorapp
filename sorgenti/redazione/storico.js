/* ======================= Storico delle operazioni della Redazione (6 ottobre 2026; nell'app della redazione da T-035) =======================
   Dove sta: su questo dispositivo, nella memoria del browser (chiave red_storico), come gli eventi
   e le Misure. L'app lo legge da lì: non va su nessun server e un altro telefono non lo vede.
   Cosa tiene: il tipo di operazione, giorno e ora, quanti eventi e il codice dell'evento. Il titolo NON viene salvato:
   lo storico lo legge dall'evento finché l'evento è sulla mappa. Quando l'evento sparisce (3 ore dopo la fine),
   nello storico resta solo «evento non più sulla mappa», così lo storico non diventa un archivio degli eventi.
   Si tengono le ultime 1.000 operazioni e al massimo 12 mesi. */
const STORICO_MAX = 1000, STORICO_GIORNI = 365;
const OP_STORICO = {
  /* «entra» ed «esci» sono di quando l'area riservata stava nell'app pubblica: restano per leggere le voci vecchie */
  entra:['accessi','Entrata nell’area riservata'], esci:['accessi','Uscita dall’area riservata'],
  'chiavi-crea':['accessi','Chiavi create'], 'chiavi-ripristina':['accessi','Chiavi ripristinate da una copia'], 'chiavi-aggiungi':['accessi','Dispositivo aggiunto da una copia'],
  'chiavi-copia':['accessi','Copia di riserva delle chiavi scaricata'], 'chiavi-revoca':['accessi','Chiavi di questo dispositivo revocate'],
  'cassaforte-copia':['accessi','Copia della cassaforte scaricata'], 'cassaforte-riporta':['accessi','Cassaforte riportata da una copia'],
  crea:['eventi','Evento creato'], modifica:['eventi','Evento modificato'], elimina:['eventi','Evento eliminato'], ripristina:['eventi','Eventi ripristinati'],
  pubblica:['eventi','Evento pubblicato'], correggi:['eventi','Correzione pubblicata'], sospendi:['eventi','Evento sospeso'], riattiva:['eventi','Evento riattivato'], ritira:['eventi','Evento ritirato prima della fine'],
  'ripristina-copia':['eventi','Copia dello storico ripristinata'], 'fonte-nuova':['eventi','Fonte aggiunta al registro delle fonti'], 'fonte-corretta':['eventi','Fonte del registro corretta'],
  'np-nuovo':['eventi','Richiesta non pubblicata annotata nel registro delle fonti'], 'np-corretto':['eventi','Richiesta non pubblicata corretta'],
  'registro-esporta':['file','Registro delle fonti esportato in Excel'], 'calendario-importa':['file','Calendario aperto di un Comune letto per l’anteprima'], 'registro-importa':['file','Registro delle fonti tenuto a mano importato'],
  'registro-confronta':['eventi','Registro delle fonti confrontato con lo sportello'], 'registro-riprendi':['eventi','Voci del registro delle fonti riprese dallo sportello'],
  importa:['file','Eventi importati da Excel'], 'esporta-excel':['file','Eventi esportati in Excel'], 'esporta-json':['file','Copia completa esportata in JSON'],
  'esporta-misure':['file','Misure esportate in Excel'], 'esporta-storico':['file','Storico esportato in Excel'],
  misura:['misure','Libreria delle misure'], svuota:['accessi','Storico svuotato']
};
const GRUPPI_STORICO = [['tutte','Tutte'], ['eventi','Eventi'], ['file','Import ed export'], ['misure','Misure'], ['accessi','Chiavi e accessi']];
const SH = {filtro:'tutte', mostrati:60, conferma:false};
function storico(){
  const l = MEM.leggi('red_storico', []); if(!Array.isArray(l)) return [];
  const limite = Date.now() - STORICO_GIORNI*864e5;
  return l.filter(x => x && OP_STORICO[x.op] && Date.parse(x.t) >= limite);
}
function registra(op, extra){
  if(!OP_STORICO[op]) return;
  const voce = Object.assign({t:new Date().toISOString(), op}, extra||{});
  Object.keys(voce).forEach(k => { if(voce[k]==null || voce[k]==='') delete voce[k]; });
  const l = storico(); l.push(voce);
  MEM.scrivi('red_storico', l.slice(-STORICO_MAX));
}
function descriviVoce(x){
  const ev = x.id ? rawById(x.id) : null, strato = x.s && S[x.s] ? tr(S[x.s].label) : '';
  const parti = [];
  if(x.id) parti.push(ev ? `«${esc(ev.title||'')}»` : `<span class="sh-via">${tr('evento non più sulla mappa')}</span>`);
  if(strato) parti.push(esc(strato));
  if(x.n!=null) parti.push(x.n===1 ? tr('1 evento') : tr('{n} eventi',{n:nf(x.n)}));
  if(x.r!=null) parti.push(tr('riga {n}',{n:esc(x.r)}));
  if(x.x) parti.push(esc(x.x));
  return parti.join(' · ');
}
function foglioStorico(){
  const tutte = storico().reverse(), f = SH.filtro;
  const lista = tutte.filter(x => f==='tutte' || OP_STORICO[x.op][0]===f), vis = lista.slice(0, SH.mostrati);
  let giorno = '', righe = '';
  vis.forEach(x => { const d = new Date(x.t), g = x.t.slice(0,10);
    if(g!==giorno){ giorno = g; righe += `<h3 class="sh-giorno">${esc(lungD(oggiDi(d)))}</h3>`; }
    righe += `<div class="sh-voce sh-${OP_STORICO[x.op][0]}"><span class="sh-ora">${hm(d)}</span><div><b>${tr(OP_STORICO[x.op][1])}</b>${descriviVoce(x)?`<span class="meta">${descriviVoce(x)}</span>`:''}</div></div>`; });
  window.AGR.foglio(`<div class="mz-foglio sh">
    <button class="link sh-indietro" data-az="admin">${tr('‹ Strumenti della redazione')}</button>
    <h2>${tr('Storico delle operazioni')}</h2>
    <p class="meta">${tr('Resta solo su questo telefono, nella memoria del browser (chiave red_storico): l’app lo legge da lì e non lo manda a nessun server. Un altro telefono ha il suo storico, o nessuno.')}</p>
    <nav class="mz-schede mz-filtri" aria-label="${esc(tr('Filtra lo storico'))}">${GRUPPI_STORICO.map(([k,t]) => `<button data-sh="filtro" data-v="${k}" aria-pressed="${f===k}"><span>${tr(t)} · ${tutte.filter(x => k==='tutte' || OP_STORICO[x.op][0]===k).length}</span></button>`).join('')}</nav>
    ${righe || `<p class="mz-nota">${tr('Nessuna operazione registrata. Lo storico parte da oggi: le operazioni fatte prima non ci sono.')}</p>`}
    ${lista.length > vis.length ? `<button class="tasto sec pieno" data-sh="altre">${tr('Mostra le precedenti ({n})',{n:lista.length - vis.length})}</button>` : ''}
    <p class="meta">${tr('Il titolo degli eventi non si salva: si legge dall’evento finché è sulla mappa. Si tengono le ultime 1.000 operazioni, per al massimo 12 mesi.')}</p>
    ${tutte.length ? `<button class="tasto sec pieno" data-sh="esporta">${tr('Esporta lo storico in Excel')}</button>
    ${SH.conferma ? `<div class="sh-conferma" role="alert"><p>${tr('Cancello tutte le {n} operazioni da questo telefono? Non si possono recuperare.',{n:tutte.length})}</p><div class="tasti"><button class="tasto sec" data-sh="annulla">${tr('Annulla')}</button><button class="tasto pri" data-sh="svuota-ok">${tr('Sì, svuota')}</button></div></div>`
      : `<button class="link sh-svuota" data-sh="svuota">${tr('Svuota lo storico')}</button>`}` : ''}
  </div>`, 'sez-misure');
}
const oggiDi = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function esportaStorico(){
  const R = [[tr('Giorno'), tr('Ora'), tr('Tipo'), tr('Operazione'), tr('Evento (se ancora sulla mappa)'), tr('Strato'), tr('Quanti'), tr('Riga delle Misure'), tr('Dettaglio')]]
    .concat(storico().map(x => { const d = new Date(x.t), ev = x.id ? rawById(x.id) : null;
      return [dIso(oggiDi(d)), hm(d), tr(GRUPPI_STORICO.find(g => g[0]===OP_STORICO[x.op][0])[1]), tr(OP_STORICO[x.op][1]), x.id ? (ev ? ev.title : tr('non più sulla mappa')) : '', x.s && S[x.s] ? tr(S[x.s].label) : '', x.n==null ? '' : x.n, x.r==null ? '' : x.r, x.x||'']; }));
  fileExcel([[tr('Storico'), R, [12,8,16,32,40,18,8,10,30]]], nomeFile()+'_storico_'+oggi()+'.xlsx')
    .then(() => { registra('esporta-storico'); avviso(tr('Storico esportato: {f}',{f:nomeFile()+'_storico_'+oggi()+'.xlsx'}), null, true); foglioStorico(); })
    .catch(() => avviso(tr('Non sono riuscito a preparare il file Excel.'), null, true));
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-sh]'); if(!b) return;
  ev.preventDefault(); ev.stopPropagation();
  const a = b.dataset.sh;
  if(a==='filtro'){ SH.filtro = b.dataset.v; SH.mostrati = 60; }
  else if(a==='altre') SH.mostrati += 100;
  else if(a==='esporta'){ esportaStorico(); return; }
  else if(a==='svuota') SH.conferma = true;
  else if(a==='annulla') SH.conferma = false;
  else if(a==='svuota-ok'){ const n = storico().length; MEM.scrivi('red_storico', []); SH.conferma = false; registra('svuota', {x:tr('{n} operazioni cancellate',{n})}); avviso(tr('Storico svuotato'), null, true); }
  foglioStorico();
}, true);
