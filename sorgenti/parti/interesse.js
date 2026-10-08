/* ======================= Pulsanti volontari (Misure, tranche 2 · 6 ottobre 2026) =======================
   «Mi interessa» nelle anteprime di Agorà e Progetti, «Vorrei Agorapp qui» nella scelta della città.
   Parte qualcosa SOLO quando la persona tocca il tasto: la scelta (es. {voce:'agora'}) e nient'altro, senza cookie,
   senza credenziali, senza referrer. La funzione Netlify somma +1 e non salva l'IP. Questo telefono ricorda solo
   che il tasto è stato toccato (chiave agorapp_interesse), per non chiederlo di nuovo. */
const API_INTERESSE = (/(^|\.)netlify\.app$|(^|\.)agorapp\.it$/.test(location.hostname) ? '' : 'https://melodic-custard-8a668b.netlify.app') + '/api/interesse';
/* Tutti i 7.896 comuni italiani (Istat, elenco Situas di giugno 2025, licenza CC BY 4.0), come «Nome (PR)».
   Il file si scarica dal sito solo quando la persona tocca il campo di ricerca, e una volta sola. */
const COMUNI = {lista:null, norm:null, carico:null, scelto:''};
const normCom = t => String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’'`]/g,' ').replace(/[^a-z0-9()/ -]/g,'').replace(/\s+/g,' ').trim();
function caricaComuni(){
  if(COMUNI.lista) return Promise.resolve(COMUNI.lista);
  if(!COMUNI.carico) COMUNI.carico = fetch('dati/comuni.json', {credentials:'omit', referrerPolicy:'no-referrer'}).then(r => { if(!r.ok) throw 0; return r.json(); })
    .then(l => { COMUNI.lista = l; COMUNI.norm = l.map(normCom); return l; }).catch(e => { COMUNI.carico = null; throw e; });
  return COMUNI.carico;
}
function cercaComuni(q){
  const n = normCom(q); if(n.length < 2 || !COMUNI.lista) return [];
  const a = [], b = [], c = [];
  COMUNI.norm.forEach((x,i) => { if(x.startsWith(n)) a.push(i); else if(x.includes(' '+n) || x.includes('/'+n)) b.push(i); else if(x.includes(n)) c.push(i); });
  const corti = l => l.sort((x,y) => COMUNI.lista[x].length - COMUNI.lista[y].length || x - y);   /* a parità di inizio, prima i nomi brevi: «tor» → Torino */
  return corti(a).concat(corti(b), corti(c)).slice(0, 8).map(i => COMUNI.lista[i]);
}
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
      : `<div class="interesse-cerca"><label class="sr-only" for="int-citta-q">${tr('Cerca il tuo comune')}</label><span class="campo"><input id="int-citta-q" type="search" autocomplete="off" spellcheck="false" maxlength="60" placeholder="${esc(tr('Scrivi il nome del tuo comune'))}" aria-describedby="int-citta-n"></span>
        <div class="interesse-esiti" id="int-citta-l"></div><p class="meta" id="int-citta-n" aria-live="polite"></p>
        <button class="tasto sec" data-interesse="citta">${tr('Vorrei Agorapp qui')}</button></div><p class="meta interesse-err" role="status"></p>`}
    <p class="meta">${tr('Arriva a noi solo il nome del comune che scegli dall’elenco, con un +1. Niente posizione, niente nome, niente email.')} ${tr('Elenco dei comuni: Istat, licenza CC BY 4.0.')}</p></section>`;
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-interesse]'); if(!b || b.disabled) return;
  ev.preventDefault(); ev.stopPropagation();
  const voce = b.dataset.interesse, box = b.closest('[data-int-box]'), err = box && box.querySelector('.interesse-err');
  let dati = {voce};
  if(voce==='citta'){ if(!COMUNI.scelto){ if(err) err.textContent = tr('Scrivi il nome e scegli il tuo comune dall’elenco.'); const q = $('int-citta-q'); if(q) q.focus(); return; } dati.citta = COMUNI.scelto; }
  const testo = b.textContent; b.disabled = true; b.textContent = tr('Invio…'); if(err) err.textContent = '';
  inviaInteresse(dati).then(() => {
    const m = mieiInteressi(); m[voce] = voce==='citta' ? dati.citta : oggi(); LS.set('agorapp_interesse', m);
    if(voce==='citta') COMUNI.scelto = '';
    if(box) box.outerHTML = voce==='citta' ? bloccoCittaVoglio() : bloccoInteresse(voce);
  }).catch(() => { b.disabled = false; b.textContent = testo; if(err) err.textContent = tr('Non è arrivato: controlla la connessione e riprova.'); });
}, true);

/* ---------- ricerca del comune ---------- */
function mostraEsitiComuni(){
  const q = $('int-citta-q'), l = $('int-citta-l'), n = $('int-citta-n'); if(!q || !l) return;
  const v = q.value; if(v !== COMUNI.scelto) COMUNI.scelto = '';
  const err = q.closest('[data-int-box]') && q.closest('[data-int-box]').querySelector('.interesse-err'); if(err) err.textContent = '';
  if(COMUNI.scelto){ l.innerHTML = ''; if(n) n.textContent = tr('Scelto: {c}',{c:COMUNI.scelto}); return; }
  if(normCom(v).length < 2){ l.innerHTML = ''; if(n) n.textContent = ''; return; }
  if(!COMUNI.lista){ if(n) n.textContent = tr('Carico l’elenco dei comuni…');
    caricaComuni().then(mostraEsitiComuni).catch(() => { if(n) n.textContent = tr('Elenco dei comuni non raggiungibile: controlla la connessione e riprova.'); }); return; }
  const r = cercaComuni(v);
  l.innerHTML = r.map(c => `<button type="button" class="interesse-esito" data-int-com="${esc(c)}">${esc(c)}</button>`).join('');
  if(n) n.textContent = r.length ? (r.length===1 ? tr('1 comune trovato') : tr('{n} comuni trovati',{n:r.length})) : tr('Nessun comune con questo nome.');
}
document.addEventListener('input', ev => { if(ev.target && ev.target.id==='int-citta-q') mostraEsitiComuni(); });
document.addEventListener('focusin', ev => { if(ev.target && ev.target.id==='int-citta-q') caricaComuni().catch(() => {}); });
document.addEventListener('keydown', ev => {
  const t = ev.target; if(!t) return;
  if(t.id==='int-citta-q' && ev.key==='ArrowDown'){ const b = document.querySelector('#int-citta-l .interesse-esito'); if(b){ ev.preventDefault(); b.focus(); } }
  else if(t.classList && t.classList.contains('interesse-esito') && (ev.key==='ArrowDown' || ev.key==='ArrowUp')){ ev.preventDefault(); const o = ev.key==='ArrowDown' ? t.nextElementSibling : (t.previousElementSibling || $('int-citta-q')); if(o) o.focus(); }
});
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-int-com]'); if(!b) return;
  ev.preventDefault(); ev.stopPropagation();
  COMUNI.scelto = b.dataset.intCom; const q = $('int-citta-q'); if(q) q.value = COMUNI.scelto;
  mostraEsitiComuni(); const box = b.closest('[data-int-box]'), err = box && box.querySelector('.interesse-err'); if(err) err.textContent = '';
  const inv = box && box.querySelector('[data-interesse="citta"]'); if(inv) inv.focus();
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
