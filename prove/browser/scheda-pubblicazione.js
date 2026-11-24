/* Prova nel browser: la scheda di pubblicazione dell'evento singolo (voce T-041 del piano di adeguamento; libro mastro
   § 3.4, cap. 22, allegato A, A.2), nell'app della redazione, con lo sportello di prova, chiavi create al momento e soli
   testi inventati.

   1. Con i campi pubblici compilati «Pubblica» resta spento finché mancano le colonne di giudizio, e la riga sotto il
      tasto dice che cosa manca: la fonte del registro, le dieci domande e il resto.
   2. La fonte si sceglie dall'elenco delle fonti del registro: una fonte nuova prende il codice FS-0001; una fonte «non
      ammessa» non accende «Pubblica»; una persona fisica non si scrive con il nome.
   3. Le dieci domande: un «no: non si pubblica» tiene spento il tasto; un consenso diretto chiede il codice C.
   4. Controlli prima di pubblicare: una descrizione con «+39 333…» fa comparire l'avviso e spegne «Pubblica» finché
      non si conferma; se il recapito cambia, la conferma va rifatta; tolto il recapito, l'avviso sparisce. Lo stesso
      per le parole da non usare. Un evento politico con nomi chiede il ruolo e il codice C del consenso esplicito.
   5. «Salva tra i preparati»: la scheda resta sul dispositivo anche dopo aver riaperto l'app, con i campi e le
      risposte; ripresa, si pubblica, e la riga del registro nasce con la pubblicazione (codice F-00001, dato dallo
      sportello).
   6. Sul dispositivo il registro è una busta cifrata: nella base di dati non si legge né il titolo né la fonte. Allo
      sportello la riga è arrivata nello stesso pacchetto, cifrata, nel riservato e mai nei file pubblici.
   7. Correggendo l'evento pubblicato, la scheda ritrova le colonne di giudizio della riga. */
'use strict';
const { esito, eseguiDaSola } = require('../comune.js');
const { playwright, server, apri, giorno, pausa, archivio, eventoProva } = require('./comune.js');

const FRASE = 'una frase inventata per la prova';
const RICERCA = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [7.6869, 45.0703] },
  properties: { country: 'Italia', city: 'Torino', postcode: '10100', street: 'Via Inventata', housenumber: '5', type: 'house' } }] };
const DI_PRIMA = [eventoProva('schedaprima', { titolo: 'Evento dell’archivio di prima' })];
const TITOLO = 'Serata inventata della scheda', DESC = 'Una descrizione inventata, riscritta con parole proprie per la prova.';

async function prova() {
  const e = esito('Scheda di pubblicazione: colonne di giudizio, dieci domande, avvisi, preparati (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const err = x => e.errori.push(x);
  const F = '#foglio-slot ';
  const s = await server('redazione'), { browser, ctx } = await apri(pw, { dl_guida: '1' });
  try {
    await archivio(ctx, DI_PRIMA);
    await ctx.route(u => u.hostname === 'photon.komoot.io', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(RICERCA) }));
    const p = await ctx.newPage();
    p.on('pageerror', y => err('errore nella pagina: ' + y.message));
    const tocca = async (sel, dove) => { const l = p.locator(sel).first(); if (!(await l.count())) { err(`${dove}: non trovo ${sel}`); return false; }
      try { await l.click({ timeout: 15000 }); } catch (x) { err(`${dove}: non riesco a toccare ${sel}`); return false; } await pausa(300); return true; };
    const testo = () => p.locator(F).innerText().catch(() => '');
    const aspetta = async (re, dove) => { try { await p.waitForFunction(r => new RegExp(r, 'i').test((document.querySelector('#foglio-slot') || {}).innerText || ''), re.source, { timeout: 20000 }); return true; } catch (x) { err(dove + ': atteso «' + re.source + '», trovato «' + (await testo()).replace(/\s+/g, ' ').slice(0, 260) + '»'); return false; } };
    const spia = async () => (await p.locator('#g-spia').innerText().catch(() => '')).replace(/\s+/g, ' ');
    const spento = () => p.locator(F + '[data-az="a-pubblica"]').isDisabled().catch(() => null);
    /* «Pubblica» deve essere spento (con le parole attese nella riga sotto) oppure acceso */
    const stato = async (dove, attese) => { await pausa(250); const off = await spento(), riga = await spia();
      if (attese) { if (off !== true) err(dove + ': «Pubblica» deve essere spento'); for (const re of [].concat(attese)) if (!re.test(riga)) err(dove + ': sotto «Pubblica» atteso «' + re.source + '», trovato «' + riga.slice(0, 300) + '»'); }
      else if (off !== false) err(dove + ': «Pubblica» deve essere acceso («' + riga.slice(0, 300) + '»)'); };
    const scegli = async (sel, v) => { await p.selectOption(sel, v); await pausa(200); };
    const apriPb = async () => { await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(300); return await tocca('#badgeRed', 'strumenti') && await tocca(F + '[data-az="pubblica"]', 'pubblicazione'); };
    const nuovaFonte = async (nome, esitoF) => {
      await tocca(F + '[data-az="pb-fonte-nuova"]', 'nuova fonte'); await p.fill('#fo-nome', nome); await scegli('#fo-tipo', 'sito');
      if ((await p.inputValue('#fo-grado')) !== '2') err('fonti: scelto il tipo «sito dell\'organizzatore» il grado di partenza deve essere 2');
      await p.fill('#fo-indirizzo', 'https://' + (esitoF === 'ammessa' ? 'circolo' : 'guida') + '-inventato.example/'); await scegli('#fo-esito', esitoF);
      await tocca(F + '[data-az="pb-fonte-salva"]', 'salva la fonte'); };

    /* chiavi e sportello di prova */
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(400);
    if (!(await tocca('#badgeRed', 'strumenti')) || !(await tocca(F + '[data-az="chiavi"]', 'chiavi'))) return e;
    await pausa(400); await p.fill('#ch-nome', 'Portatile di prova'); await p.fill('#ch-frase', FRASE); await p.fill('#ch-ripeti', FRASE);
    await tocca(F + '[data-az="chiavi-crea"]', 'chiavi, crea');
    try { await p.waitForSelector(F + '[data-az="chiavi-copia"]', { timeout: 20000 }); } catch (x) { err('le chiavi non si creano'); return e; }
    if (!(await apriPb())) return e;
    await aspetta(/non conosce ancora questo dispositivo/, 'senza chiavi consegnate');
    await tocca(F + '[data-az="pb-consegna"]', 'consegna delle chiavi'); await aspetta(/accetta la firma di questo dispositivo/, 'chiavi consegnate');

    /* 1 */
    if (!(await tocca(F + '[data-az="pb-nuovo"]', 'nuovo evento'))) return e;
    await p.fill('#a-titolo', TITOLO); await scegli('#a-strato', 'musica');
    await p.fill('#a-inizio', giorno(3) + 'T18:00'); await p.fill('#a-fine', giorno(3) + 'T20:00'); await p.fill('#a-luogo', 'Sala inventata'); await p.fill('#a-desc', DESC);
    await p.fill('#a-indirizzo', 'Via Inventata 5, Torino'); await pausa(1300); await tocca('#a-sugg [data-si="0"]', 'modulo, suggerimento');
    try { await p.waitForSelector(F + '#g-fonte', { timeout: 20000 }); } catch (x) { err('la scheda non mostra le colonne di giudizio'); return e; }
    await stato('scheda senza giudizio', [/Manca: la fonte nel registro/, /le dieci domande/, /i nomi di persone/, /evento politico o religioso/, /l’avviso all’organizzatore/]);
    if (!/servono a partecipare|Il testo riporta fatti/.test(await p.locator(F + '.g-regole').innerText().catch(() => '') + await p.locator(F + '.g-regole').innerHTML().catch(() => ''))) err('scheda: le regole di scrittura non sono a portata di mano');
    if ((await p.locator(F + '.g-domanda').count()) !== 10) err('scheda: attese le dieci domande');

    /* 2 */
    await tocca(F + '[data-az="g-fonti"]', 'elenco delle fonti'); await aspetta(/Non c’è ancora nessuna fonte/, 'elenco delle fonti vuoto');
    await tocca(F + '[data-az="pb-fonte-nuova"]', 'nuova fonte'); await tocca(F + '[data-az="pb-fonte-salva"]', 'fonte vuota');
    await aspetta(/Nome della fonte: scrivilo[\s\S]*Tipo: scegline uno[\s\S]*Esito: scegline uno/, 'fonte vuota rifiutata');
    await tocca(F + '[data-az="pb-fonti"]', 'annulla la fonte');
    await nuovaFonte('Guida Inventata agli eventi', 'vietata'); await aspetta(/FS-0001 · Guida Inventata agli eventi[\s\S]*non ammessa/, 'prima fonte, non ammessa');
    await nuovaFonte('Circolo Inventato, sito', 'ammessa'); await aspetta(/FS-0002 · Circolo Inventato, sito/, 'seconda fonte, ammessa');
    await tocca(F + '[data-az="g-torna"]', 'ritorno alla scheda');
    if ((await p.inputValue('#g-fonte')) !== 'FS-0002') err('scheda: la fonte appena aggiunta deve risultare scelta');
    if ((await p.inputValue('#a-titolo')) !== TITOLO || (await p.inputValue('#a-desc')) !== DESC) err('scheda: passando dall\'elenco delle fonti i campi già scritti si perdono');
    if ((await p.inputValue('#a-fonte')) !== 'Circolo Inventato, sito') err('scheda: scelta la fonte, il campo «Fonte» vuoto deve prendere il suo nome');
    await scegli('#g-fonte', 'FS-0001'); await stato('fonte non ammessa', /una fonte ammessa: FS-0001 non lo è/);
    await scegli('#g-fonte', 'FS-0002'); await stato('fonte ammessa, senza collegamento', /il collegamento alla pagina dell’evento/);
    await p.fill('#a-fonte-link', 'https://circolo-inventato.example/serata');

    /* 3 */
    for (let n = 1; n <= 9; n++) await scegli('#g-d' + n, 'si');
    await scegli('#g-nomi', 'no'); await scegli('#g-politico', 'no'); await scegli('#g-avviso', 'nessuno');
    await stato('nove domande su dieci', /1 delle dieci domande/);
    await scegli('#g-d10', 'si'); await stato('giudizio completo');
    await scegli('#g-d2', 'stop'); await stato('domanda 2: non si pubblica', /alla domanda 2 hai risposto che non si pubblica/);
    await scegli('#g-d2', 'si'); await scegli('#g-d9', 'consenso'); await stato('consenso diretto senza codice', /il codice C del consenso diretto/);
    await p.fill('#g-consenso', 'C-12'); await stato('codice C scritto male', /il codice C del consenso diretto/);
    await p.fill('#g-consenso', 'C-0001'); await stato('consenso diretto con il codice');
    await scegli('#g-d9', 'si'); await p.fill('#g-consenso', '');

    /* 4 */
    await p.fill('#a-desc', DESC + ' Per informazioni: +39 333 1234567.'); await stato('recapito nella descrizione', /la conferma di un avviso/);
    if (!/sembra esserci un recapito[\s\S]*\+39 333 1234567/.test(await p.locator('#g-avvisi').innerText().catch(() => ''))) err('una descrizione con «+39 333…» deve far comparire l\'avviso sul recapito');
    await tocca('#g-avvisi [data-az="g-visto"][data-k="recapiti"]', 'conferma dell\'avviso'); await stato('avviso confermato');
    await p.fill('#a-desc', DESC + ' Scrivere a persona@posta-inventata.example.'); await stato('recapito cambiato', /la conferma di un avviso/);
    await p.fill('#a-desc', DESC + ' Un percorso sicuro e verificato.'); await stato('parole da non usare', /la conferma di un avviso/);
    if (!/Parole da non usare[\s\S]*«sicuro»[\s\S]*«verificato»/.test(await p.locator('#g-avvisi').innerText().catch(() => ''))) err('«sicuro» e «verificato» nella descrizione devono far comparire l\'avviso sulle parole');
    await p.fill('#a-desc', DESC + ' Locandina: https://circolo-inventato.example/locandina.jpg'); await stato('immagine nei testi', /un testo senza immagini/);
    await p.fill('#a-desc', DESC); await stato('avvisi spariti');
    if (await p.locator('#g-avvisi .g-avviso').count()) err('tolto il recapito, l\'avviso deve sparire');
    await scegli('#g-politico', 'si'); await scegli('#g-nomi', 'si'); await stato('politico con nomi', [/il ruolo delle persone nominate/, /il codice C del consenso esplicito/]);
    await p.fill('#g-ruoli', 'relatrice'); await p.fill('#g-consenso', 'C-0002'); await stato('politico con nomi, ruolo e consenso');
    await scegli('#g-nomi', 'no'); await scegli('#g-politico', 'no');
    await stato('nessun nome, non politico');

    /* 5 */
    await tocca(F + '[data-az="g-prepara"]', 'salva tra i preparati');
    await aspetta(/Scheda salvata tra i preparati[\s\S]*Preparati, non ancora pubblicati · 1[\s\S]*Serata inventata della scheda/, 'scheda tra i preparati');
    if (!(await apriPb())) return e;
    await aspetta(/Preparati, non ancora pubblicati · 1[\s\S]*Pubblicati · 0/, 'preparati dopo aver riaperto l\'app');
    await tocca(F + '[data-pbprep]', 'scheda preparata'); await p.waitForSelector(F + '#g-fonte', { timeout: 20000 }).catch(() => err('la scheda preparata non si riapre'));
    if ((await p.inputValue('#a-titolo')) !== TITOLO || (await p.inputValue('#a-inizio')) !== giorno(3) + 'T18:00' || (await p.inputValue('#g-fonte')) !== 'FS-0002' || (await p.inputValue('#g-d7')) !== 'si' || (await p.inputValue('#g-avviso')) !== 'nessuno')
      err('scheda preparata: riaperta, non ha i campi e le risposte di prima');
    await stato('scheda preparata, ripresa');
    await tocca(F + '[data-az="a-pubblica"]', 'pubblica');
    await aspetta(/Pubblicato alle \d\d[:.]\d\d \(ora dello sportello\)\. Riga F-00001 nel registro delle fonti[\s\S]*Pubblicati · 1/, 'pubblicazione con la riga del registro');
    if (/Preparati, non ancora pubblicati/.test(await testo())) err('pubblicata, la scheda deve uscire dai preparati');

    /* 6 */
    const base = await p.evaluate(() => new Promise((ok, no) => { const r = indexedDB.open('red_strumenti'); r.onerror = () => no(r.error);
      r.onsuccess = () => { const q = r.result.transaction('voci').objectStore('voci').get('red_registro'); q.onsuccess = () => { r.result.close(); ok(JSON.stringify(q.result || null)); }; }; }));
    const busta = JSON.parse(base);
    if (!busta || busta.tipo !== 'registro-fonti-redazione' || typeof busta.dati !== 'string' || busta.dati.length < 200) err('registro: sul dispositivo deve esserci la busta cifrata del registro (' + base.slice(0, 120) + ')');
    if (/Serata inventata|Circolo Inventato|Guida Inventata|FS-0002|F-00001|relatrice/.test(base)) err('registro: nella base di dati si legge qualcosa del registro in chiaro');
    /* allo sportello di prova la riga è arrivata nello stesso pacchetto, cifrata: nel riservato c'è, e non si legge */
    const allo = await p.evaluate(async () => { const c = await caches.open('prova_sportello'), out = [];
      for (const r of await c.keys()) if (/riservato\/registro\//.test(r.url)) out.push([r.url.replace(/^.*riservato\//, ''), await (await c.match(r)).text()]);
      const pub = []; for (const r of await c.keys()) if (/pubblico\//.test(r.url)) pub.push(await (await c.match(r)).text());
      return { righe: out, pubblico: pub.join('\n') }; });
    const file = allo.righe.find(x => /^registro\/righe\//.test(x[0]));
    if (!file || !/"F-00001"/.test(file[1]) || !/registro-fonti-redazione/.test(file[1])) err('sportello: la riga del registro non è arrivata nel riservato con il codice F-00001 (' + allo.righe.map(x => x[0]).join(', ') + ')');
    if (file && /Serata inventata|Circolo Inventato|FS-0002|Tutte superate/.test(file[1])) err('sportello: nel riservato la riga del registro si legge in chiaro');
    if (/registro-fonti-redazione|Tutte superate/.test(allo.pubblico)) err('sportello: la riga del registro è finita nei file pubblici');

    /* 7 */
    if (await tocca(F + '[data-pbev]', 'evento pubblicato') && await tocca(F + '[data-az="pb-correggi"]', 'correggi')) {
      await p.waitForSelector(F + '#g-fonte', { timeout: 20000 }).catch(() => err('correzione: la scheda non mostra le colonne di giudizio'));
      await pausa(500);
      if ((await p.inputValue('#g-fonte')) !== 'FS-0002' || (await p.inputValue('#g-d10')) !== 'si' || (await p.inputValue('#g-nomi')) !== 'no') err('correzione: la scheda deve ritrovare le colonne di giudizio della riga del registro');
      await stato('correzione con il giudizio della riga');
      if (await p.locator(F + '[data-az="g-prepara"]').count()) err('correzione: un evento già pubblicato non si salva tra i preparati');
    }
    e.note.push('«Pubblica» spento senza fonte e dieci domande; fonti FS-0001 (non ammessa) e FS-0002; avviso per «+39 333…» e per le parole da non usare; scheda preparata ripresa dopo la riapertura; riga F-00001 data dallo sportello e arrivata cifrata nel suo riservato; registro cifrato sul dispositivo');
  } finally { await browser.close(); await s.chiudi(); }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
