/* ======================= Pulsanti volontari (Misure, tranche 2 · 6 ottobre 2026) =======================
   «Mi interessa» nelle anteprime di Agorà e Progetti, «Vorrei Agorapp qui» nella scelta della città.
   Parte qualcosa SOLO quando la persona tocca il tasto: la scelta (es. {voce:'agora'}) e nient'altro, senza cookie,
   senza credenziali, senza referrer. La funzione Netlify somma +1 e non salva l'IP. Questo telefono ricorda solo
   che il tasto è stato toccato (chiave agorapp_interesse), per non chiederlo di nuovo. */
const API_INTERESSE = (/(^|\.)netlify\.app$|(^|\.)agorapp\.it$/.test(location.hostname) ? '' : 'https://melodic-custard-8a668b.netlify.app') + '/api/interesse';
const CITTA_VOGLIO = ['Roma','Milano','Napoli','Genova','Bari','Palermo','Catania','Messina','Verona','Padova','Venezia','Trieste','Trento','Bolzano','Brescia','Bergamo','Parma','Modena','Reggio Emilia','Firenze','Pisa','Livorno','Perugia','Ancona','Pescara',"L'Aquila",'Cagliari','Sassari','Lecce','Salerno','Potenza','Campobasso','Catanzaro','Reggio Calabria','Aosta'];
const mieiInteressi = () => { const m = LS.get('agorapp_interesse', {}); return m && typeof m==='object' ? m : {}; };
function inviaInteresse(dati){
  return fetch(API_INTERESSE, {method:'POST', headers:{'content-type':'text/plain'}, body:JSON.stringify(dati), credentials:'omit', referrerPolicy:'no-referrer', cache:'no-store'})
    .then(r => { if(!r.ok) throw new Error('stato '+r.status); });
}
const spuntaInt = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function bloccoInteresse(voce){
  const fatto = !!mieiInteressi()[voce], nome = voce==='agora' ? tr('Agorà') : tr('Progetti');
  return `<div class="interesse" data-int-box="${voce}"><div class="interesse-t">${tr('Ti interessa?')}</div>
    ${fatto ? `<p class="interesse-ok" role="status">${spuntaInt}<span>${tr('Segnato. Grazie: il tuo +1 è arrivato.')}</span></p>`
      : `<p>${tr('Se vuoi che apriamo le iscrizioni, diccelo con un tocco.')}</p><button class="tasto pri" data-interesse="${voce}">${tr('Mi interessa')}</button><p class="meta interesse-err" role="status"></p>`}
    <p class="meta">${tr('Arriva a noi solo «+1 {s}»: niente nome, niente email, niente posizione. Questo telefono ricorda che l’hai toccato, per non chiedertelo di nuovo.',{s:nome})}</p></div>`;
}
function bloccoCittaVoglio(){
  const c = mieiInteressi().citta;
  return `<section class="sezione" data-int-box="citta"><div class="tipo">${tr('La tua città non c’è?')}</div>
    ${c ? `<p class="interesse-ok" role="status">${spuntaInt}<span>${tr('Segnato: +1 per {c}. Grazie.',{c:esc(c==='Altra'?tr('Altra città'):c)})}</span></p>`
      : `<div class="interesse-riga"><label class="campo"><span class="sr-only">${tr('La tua città non c’è?')}</span><select id="int-citta"><option value="">${tr('— Scegli la città —')}</option>${CITTA_VOGLIO.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('')}<option value="Altra">${tr('Altra città')}</option></select></label><button class="tasto sec" data-interesse="citta">${tr('Vorrei Agorapp qui')}</button></div><p class="meta interesse-err" role="status"></p>`}
    <p class="meta">${tr('Arriva a noi solo il nome della città che scegli dall’elenco, con un +1. Niente posizione, niente nome, niente email.')}</p></section>`;
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-interesse]'); if(!b || b.disabled) return;
  ev.preventDefault(); ev.stopPropagation();
  const voce = b.dataset.interesse, box = b.closest('[data-int-box]'), err = box && box.querySelector('.interesse-err');
  let dati = {voce};
  if(voce==='citta'){ const s = $('int-citta'); if(!s || !s.value){ if(err) err.textContent = tr('Scegli una città dall’elenco.'); return; } dati.citta = s.value; }
  const testo = b.textContent; b.disabled = true; b.textContent = tr('Invio…'); if(err) err.textContent = '';
  inviaInteresse(dati).then(() => {
    const m = mieiInteressi(); m[voce] = voce==='citta' ? dati.citta : oggi(); LS.set('agorapp_interesse', m);
    if(box) box.outerHTML = voce==='citta' ? bloccoCittaVoglio() : bloccoInteresse(voce);
  }).catch(() => { b.disabled = false; b.textContent = testo; if(err) err.textContent = tr('Non è arrivato: controlla la connessione e riprova.'); });
}, true);

/* ---------- lettura dei totali per le Misure dell'admin ---------- */
function caricaInteresse(){
  MS.int = {stato:'carico'};
  fetch(API_INTERESSE, {credentials:'omit', referrerPolicy:'no-referrer', cache:'no-store'}).then(r => { if(!r.ok) throw 0; return r.json(); })
    .then(d => { MS.int = {stato:'ok', d:d||{}}; if(st.sezione==='misure') disegnaMisure(); })
    .catch(() => { MS.int = {stato:'errore'}; if(st.sezione==='misure') disegnaMisure(); });
}
function totInteresse(){
  const d = MS.int && MS.int.stato==='ok' ? MS.int.d : null; if(!d) return null;
  const t = d.tot||{}, citta = Object.keys(t).filter(k => k.startsWith('citta:')).map(k => [k.slice(6)==='Altra'?tr('Altra città'):k.slice(6), t[k]]).sort((a,b) => b[1]-a[1]);
  return {agora:t.agora||0, progetti:t.progetti||0, citta, giorni:d.giorni||{}};
}
function serieInteresse(giorni, voce){
  const I = totInteresse(); if(!I) return giorni.map(() => null);
  const prima = Object.keys(I.giorni).filter(g => g < giorni[0]).reduce((s,g) => s + ((I.giorni[g]||{})[voce]||0), 0);
  let acc = prima; return giorni.map(g => { acc += (I.giorni[g]||{})[voce]||0; return acc; });
}
