/* Prova nel browser: lo sportello di prova, dall'app della redazione all'app pubblica (voci T-038, T-039 e T-040).

   Le due app si aprono dallo stesso indirizzo, come sul collegamento di prova. Nell'app della redazione si creano le
   chiavi, si consegnano allo sportello di prova e si fa il giro intero; a ogni passo l'app pubblica, ricaricata, deve
   mostrare ciò che lo sportello ha pubblicato. Tutto è inventato.

   1. Senza chiavi consegnate lo sportello di prova rifiuta; consegnate le chiavi, accetta.
   2. Un evento scritto nel modulo si pubblica: compare tra i pubblicati con l'ora, e nell'app pubblica.
   3. La correzione arriva nell'app pubblica.
   4. Sospeso, l'evento sparisce dall'app pubblica; riattivato, torna.
   5. Il ritiro chiede il motivo; ritirato, l'evento non c'è più.
   6. Storico: una copia per pubblicazione; il confronto dice che cosa è cambiato; il ripristino ricorda le rimozioni di
      nomi chieste dopo la data della copia e non parte finché non si conferma di averle ripetute.
   7. Un pacchetto con la firma sbagliata è rifiutato; dopo cinque lo sportello non risponde più a questo dispositivo.
   8. Svuotato lo sportello di prova, l'app pubblica torna all'archivio di prima; nella redazione nessun errore in
      rosso, solo il riquadro che chiede di consegnare di nuovo le chiavi.
   A ogni lettura la barra degli strati dell'app pubblica dice «archivio dello sportello di prova di questo browser»
   quando, e solo quando, l'app legge l'archivio finto. */
'use strict';
const { esito, eseguiDaSola } = require('../comune.js');
const { playwright, server, apri, giorno, pausa, archivio, eventoProva, eventiCaricati, giudizioProva } = require('./comune.js');

const FRASE = 'una frase inventata per la prova';
const RICERCA = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [7.6869, 45.0703] },
  properties: { country: 'Italia', city: 'Torino', postcode: '10100', street: 'Via Inventata', housenumber: '5', type: 'house' } }] };
const DI_PRIMA = [eventoProva('primauno', { titolo: 'Evento dell’archivio di prima, uno' }), eventoProva('primadue', { titolo: 'Evento dell’archivio di prima, due', lat: 45.0712, lng: 7.6851 })];
/* una richiesta di rimozione registrata domani: è «dopo» qualunque copia fatta durante la prova */
const TUTTI = Object.fromEntries(['musica', 'arte', 'sport', 'sociale', 'cibo', 'teatro', 'cinema', 'conferenze', 'laboratori', 'manifestazioni', 'mercati', 'benessere', 'volontariato'].map(k => [k, { on: true }]));
const MISURE = { v: 1, rimozioni: [{ ric: giorno(1) + 'T10:00', eva: '' }] };

async function prova() {
  const e = esito('Sportello di prova: pubblicare, correggere, sospendere, ritirare, ripristinare (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const err = x => e.errori.push(x);
  const F = '#foglio-slot ';
  const s = await server('redazione'), { browser, ctx } = await apri(pw, { dl_guida: '1', dl_strati: TUTTI, red_misure: MISURE });
  try {
    await archivio(ctx, DI_PRIMA);
    await ctx.route(u => u.hostname === 'photon.komoot.io', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(RICERCA) }));
    const p = await ctx.newPage(), pp = await ctx.newPage();
    for (const [x, n] of [[p, 'redazione'], [pp, 'pubblica']]) x.on('pageerror', y => err('errore nella pagina (' + n + '): ' + y.message));
    const tocca = async (sel, dove) => { const l = p.locator(sel).first(); if (!(await l.count())) { err(`${dove}: non trovo ${sel}`); return false; }
      try { await l.click({ timeout: 15000 }); } catch (x) { err(`${dove}: non riesco a toccare ${sel}`); return false; } await pausa(350); return true; };
    const testo = () => p.locator(F).innerText().catch(() => '');
    const aspetta = async (re, dove) => { try { await p.waitForFunction(r => new RegExp(r, 'i').test((document.querySelector('#foglio-slot') || {}).innerText || ''), re.source, { timeout: 20000 }); return true; } catch (x) { err(dove + ': atteso «' + re.source + '», trovato «' + (await testo()).replace(/\s+/g, ' ').slice(0, 260) + '»'); return false; } };
    /* l'app pubblica, ricaricata: quale archivio legge, quanti eventi e con quali titoli */
    const pubblica = async attesi => {
      await pp.goto(s.url.replace('/dist/redazione/', '/dist/pubblica/') + 'index.html'); await pp.waitForSelector('[data-az="elenco"]');
      if (attesi) await eventiCaricati(pp, attesi); else await pausa(1500);
      const barra = (await pp.locator('#peek').textContent()) || '';
      await pp.click('[data-az="elenco"]'); await pausa(500);
      const a = await pp.evaluate(() => Object.assign(window.AGR.archivio(), { titoli: [...document.querySelectorAll('#foglio-slot [data-ev]')].map(x => x.textContent) }));
      /* sul collegamento di prova la barra degli strati dice quando l'app legge l'archivio finto (testo approvato il 25/11/2026) */
      if (/archivio dello sportello di prova di questo browser/.test(barra) !== !!a.finto) err('la barra degli strati deve dire «archivio dello sportello di prova di questo browser» solo quando l\'app legge l\'archivio finto: ' + JSON.stringify({ finto: a.finto, barra }));
      return { finto: a.finto, n: a.pubblici, titoli: a.titoli.join(' | ') };
    };
    const compila = async titolo => {
      await p.fill('#a-titolo', titolo); await p.selectOption('#a-strato', 'musica'); await pausa(300);
      await p.fill('#a-inizio', giorno(3) + 'T18:00'); await p.fill('#a-fine', giorno(3) + 'T20:00'); await p.fill('#a-luogo', 'Sala inventata'); await p.fill('#a-desc', 'Una descrizione inventata, lunga quanto serve per la prova.');
      await p.fill('#a-fonte', 'Fonte inventata'); await p.fill('#a-indirizzo', 'Via Inventata 5, Torino'); await pausa(1300);
      await tocca('#a-sugg [data-si="0"]', 'modulo, suggerimento');
    };

    /* prima di tutto l'app pubblica legge l'archivio di prima */
    let a = await pubblica(2);
    if (a.finto || a.n !== 2) err('prima di ogni pubblicazione l\'app pubblica deve leggere l\'archivio di prima (2 eventi), non lo sportello di prova: ' + JSON.stringify(a));

    /* le chiavi */
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(400);
    if (!(await tocca('#badgeRed', 'strumenti')) || !(await tocca(F + '[data-az="chiavi"]', 'chiavi'))) return e;
    await pausa(400); await p.fill('#ch-nome', 'Portatile di prova'); await p.fill('#ch-frase', FRASE); await p.fill('#ch-ripeti', FRASE);
    await tocca(F + '[data-az="chiavi-crea"]', 'chiavi, crea');
    try { await p.waitForSelector(F + '[data-az="chiavi-copia"]', { timeout: 20000 }); } catch (x) { err('le chiavi non si creano'); return e; }
    const apriPb = async () => { await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(300); return await tocca('#badgeRed', 'strumenti') && await tocca(F + '[data-az="pubblica"]', 'pubblicazione'); };

    /* 1 */
    if (!(await apriPb())) return e;
    await aspetta(/non conosce ancora questo dispositivo/, 'senza chiavi consegnate');
    await tocca(F + '[data-az="pb-consegna"]', 'consegna delle chiavi');
    await aspetta(/accetta la firma di questo dispositivo/, 'chiavi consegnate');
    await aspetta(/Pubblicati · 0/, 'elenco vuoto');

    /* 2 */
    if (await tocca(F + '[data-az="pb-nuovo"]', 'nuovo evento')) {
      await p.fill('#a-indirizzo', 'Via Inventata 5, Torino'); await pausa(1300); await tocca('#a-sugg [data-si="0"]', 'modulo, suggerimento');
      /* dal blocco 10 «Pubblica» si accende solo con le colonne di giudizio (T-041): qui si compilano, e i campi pubblici restano vuoti */
      await giudizioProva(p); await p.fill('#a-fonte', ''); await pausa(200);
      await tocca(F + '[data-az="a-pubblica"]', 'pubblica a vuoto'); await pausa(400);
      if (!(await p.locator(F + '#a-titolo').count())) err('un modulo vuoto non si deve pubblicare');
      /* gli errori si leggono: parole semplici, nessun nome tecnico, un riquadro alto quanto serve, il campo colorato */
      const riquadro = p.locator(F + '.pb-errori'), alto = (await riquadro.boundingBox().catch(() => null) || { height: 0 }).height, parole = await riquadro.innerText().catch(() => '');
      if (alto < 100 || !/Luogo: scrivi il nome del luogo/.test(parole) || !/Descrizione: scrivi/.test(parole) || !/Fonte: scrivi/.test(parole)) err('modulo vuoto: il riquadro degli errori non si legge (alto ' + Math.round(alto) + ' px: «' + parole.replace(/\s+/g, ' ').slice(0, 200) + '»)');
      if (/descrizione_luogo|: vuoto|: manca\b/.test(parole)) err('modulo vuoto: gli errori usano i nomi tecnici dei campi («' + parole.replace(/\s+/g, ' ').slice(0, 200) + '»)');
      if (!(await p.locator(F + '.campo.errore #a-luogo').count())) err('modulo vuoto: il campo «Luogo» non si colora');
      await compila('Evento inventato dello sportello');
      /* punto scelto sulla mappa: «Come arrivare» resta facoltativo (decisione del 23/11/2026, LM-62) e l'evento si
         pubblica anche senza */
      if (await tocca(F + '[data-az="scegli-mappa-a"]', 'scegli sulla mappa') && await tocca('[data-az="posa-ok"]', 'conferma del punto')) {
        const etichetta = await p.locator(F + 'label[for="a-come"]').innerText().catch(() => '');
        if (!/facoltativo/.test(etichetta) || /obbligatorio/.test(etichetta)) err('punto scelto sulla mappa: «Come arrivare» deve restare facoltativo («' + etichetta + '»)');
      }
      await tocca(F + '[data-az="a-pubblica"]', 'pubblica');
      await aspetta(/Pubblicato alle \d\d[:.]\d\d \(ora dello sportello\)[\s\S]*Pubblicati · 1/, 'pubblicazione');
    }
    a = await pubblica(1);
    if (!a.finto || a.n !== 1 || !/Evento inventato dello sportello/.test(a.titoli)) err('l\'evento pubblicato non arriva nell\'app pubblica: ' + JSON.stringify(a));

    /* 3 */
    if (await tocca(F + '[data-pbev]', 'evento') && await tocca(F + '[data-az="pb-correggi"]', 'correggi')) {
      if ((await p.inputValue('#a-titolo')) !== 'Evento inventato dello sportello' || (await p.inputValue('#a-luogo')) !== 'Sala inventata' || (await p.inputValue('#a-fine')) !== giorno(3) + 'T20:00') err('correzione: il modulo non riporta i campi dell\'evento pubblicato');
      await p.fill('#a-titolo', 'Evento inventato dello sportello, corretto');
      await tocca(F + '[data-az="a-pubblica"]', 'pubblica la correzione');
      await aspetta(/Correzione pubblicata alle/, 'correzione');
    }
    a = await pubblica(1);
    if (a.n !== 1 || !/sportello, corretto/.test(a.titoli)) err('la correzione non arriva nell\'app pubblica: ' + JSON.stringify(a));

    /* 4 */
    if (await tocca(F + '[data-pbev]', 'evento') && await tocca(F + '[data-az="pb-sospendi"]', 'sospendi')) await aspetta(/Sospeso alle[\s\S]*Pubblicati · 0[\s\S]*Sospesi · 1/, 'sospensione');
    a = await pubblica(0);
    if (!a.finto || a.n !== 0) err('un evento sospeso deve sparire dall\'app pubblica: ' + JSON.stringify(a));
    if (await tocca(F + '[data-pbev]', 'evento sospeso') && await tocca(F + '[data-az="pb-riattiva"]', 'riattiva')) await aspetta(/Riattivato alle[\s\S]*Pubblicati · 1/, 'riattivazione');
    a = await pubblica(1);
    if (a.n !== 1) err('un evento riattivato deve tornare nell\'app pubblica: ' + JSON.stringify(a));

    /* 5 */
    if (await tocca(F + '[data-pbev]', 'evento') && await tocca(F + '[data-az="pb-ritira"]', 'ritira')) {
      await tocca(F + '[data-az="pb-ritira-ok"]', 'ritira senza motivo');
      await aspetta(/Scegli il motivo del ritiro/, 'ritiro senza motivo');
      const motivi = await p.locator('#pb-motivo option').count();
      if (motivi !== 7) err('ritiro: attesi i sei motivi del registro delle fonti, trovate ' + (motivi - 1) + ' voci');
      await p.selectOption('#pb-motivo', 'annullato'); await p.fill('#pb-rif', 'voce inventata 1');
      await tocca(F + '[data-az="pb-ritira-ok"]', 'ritira');
      await aspetta(/Ritirato alle[\s\S]*Pubblicati · 0/, 'ritiro');
    }
    a = await pubblica(0);
    if (a.n !== 0) err('un evento ritirato non deve più essere nell\'app pubblica: ' + JSON.stringify(a));

    /* 6 */
    if (await tocca(F + '[data-az="pb-storico"]', 'storico')) {
      try { await p.waitForSelector(F + '[data-pbcopia]', { timeout: 15000 }); } catch (x) { err('storico: l\'elenco delle copie non arriva'); }
      const copie = p.locator(F + '[data-pbcopia]'), n = await copie.count();
      if (n !== 5) err('storico: attese 5 copie (pubblicazione, correzione, sospensione, riattivazione, ritiro), trovate ' + n);
      if (!/Portatile di prova/.test(await testo())) err('storico: le copie non dicono da quale dispositivo vengono');
      /* dalla seconda copia (correzione) all'ultima (ritiro): un evento tolto */
      await copie.nth(n - 2).click(); await copie.nth(0).click(); await pausa(300);
      await tocca(F + '[data-az="pb-confronta"]', 'confronta');
      await aspetta(/Tolti · 1[\s\S]*sportello, corretto/, 'confronto tra due copie');
      await p.locator(F + '[data-pbcopia]').nth(0).click(); await pausa(300);   // resta scelta solo la copia della correzione
      if (await tocca(F + '[data-az="pb-ripristina"]', 'ripristina')) {
        await aspetta(/è stata chiesta 1 rimozione/, 'promemoria delle rimozioni');
        if (!(await p.locator(F + '[data-az="pb-ripr-ok"]').isDisabled())) err('ripristino: con una rimozione chiesta dopo la copia non si deve poter ripubblicare senza conferma');
        await tocca(F + '[data-az="pb-ripr-fatto"]', 'conferma delle rimozioni');
        await tocca(F + '[data-az="pb-ripr-ok"]', 'ripubblica');
        await aspetta(/Copia ripristinata e pubblicata alle[\s\S]*Pubblicati · 1/, 'ripristino');
      }
    }
    a = await pubblica(1);
    if (a.n !== 1 || !/sportello, corretto/.test(a.titoli)) err('dopo il ripristino l\'app pubblica deve tornare allo stato della copia: ' + JSON.stringify(a));

    /* 6 bis: le Misure leggono lo storico delle pubblicazioni dallo sportello (decisione del 23/11/2026) e ne tengono solo
       i conteggi: un evento pubblicato, uno corretto, uno sospeso, uno riattivato, uno ritirato perché annullato, un
       ripristino; alla fine un evento presente */
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(300);
    if (await tocca('#badgeRed', 'strumenti') && await tocca(F + '[data-az="admin-misure"]', 'Misure')) {
      try { await p.waitForFunction(() => /tutti i dispositivi/.test((document.querySelector('.mz-storico') || {}).textContent || '') || !!(JSON.parse(localStorage.getItem('red_misure') || '{}').pubbl), null, { timeout: 20000 }); } catch (x) { err('Misure: lo storico delle pubblicazioni non si legge'); }
      await pausa(600);
      const pu = await p.evaluate(() => { const grezzo = localStorage.getItem('red_misure') || '{}', m = JSON.parse(grezzo).pubbl || {}, t = { n: 0, p: 0, c: 0, s: 0, a: 0, r: 0, rip: 0, annullati: 0 };
        Object.keys(m).sort().forEach(g => { const v = m[g]; t.n = v.n; ['p', 'c', 's', 'a', 'r', 'rip'].forEach(k => { t[k] += v[k] || 0; }); t.annullati += (v.m || {}).annullato || 0; });
        return { t, titoli: /sportello, corretto|Sala inventata/.test(grezzo) }; });
      if (JSON.stringify(pu.t) !== JSON.stringify({ n: 1, p: 1, c: 1, s: 1, a: 1, r: 1, rip: 1, annullati: 1 })) err('Misure: i conteggi dello storico non tornano: ' + JSON.stringify(pu.t));
      if (pu.titoli) err('Misure: dello storico devono restare solo i conteggi, non i testi degli eventi');
      if (await tocca('.mz-schede [data-mz="scheda"][data-v="offerta"]', 'Misure, offerta')) {
        const riquadro = await p.locator('section[aria-labelledby="mzg-pubbl"]').innerText().catch(() => '');
        if (!/meno di 5\s+ritirati/i.test(riquadro) || !/Annullato/.test(riquadro)) err('Misure, offerta: il riquadro dello storico deve dire i ritirati (sotto soglia: «meno di 5») e il motivo «Annullato» («' + riquadro.replace(/\s+/g, ' ').slice(0, 300) + '»)');
      }
    }
    if (await apriPb()) await aspetta(/Pubblicati · 1/, 'ritorno alla pubblicazione dopo le Misure');

    /* 7 */
    for (let i = 1; i <= 5; i++) {
      await tocca(F + '[data-az="pb-falsa"]', 'firma sbagliata ' + i);
      await aspetta(i < 5 ? /Rifiutato dallo sportello \(motivo: firma\)/ : /non risponde a questo dispositivo fino alle/, 'firma sbagliata, tentativo ' + i);
      if (/ha accettato un pacchetto con la firma sbagliata/.test(await testo())) err('lo sportello ha accettato una firma sbagliata');
    }
    await aspetta(/Troppe firme sbagliate/, 'dispositivo fermo');
    a = await pubblica(1);
    if (a.n !== 1) err('le firme sbagliate non devono cambiare l\'archivio: ' + JSON.stringify(a));

    /* 8 */
    await tocca(F + '[data-az="pb-svuota"]', 'svuota'); await tocca(F + '[data-az="pb-svuota"]', 'svuota, conferma');
    await aspetta(/Sportello di prova svuotato/, 'svuotamento'); await pausa(800);
    /* svuotato, lo sportello di prova non conosce più le chiavi: il riquadro lo dice, senza un rifiuto in rosso (blocco 10, prova di Lorenzo del 25/11) */
    const rosso = await p.locator(F + '.err').allInnerTexts();
    if (rosso.length) err('dopo lo svuotamento la schermata non deve mostrare un errore: ' + rosso.join(' | '));
    if (!/non conosce ancora questo dispositivo/.test(await testo())) err('dopo lo svuotamento il riquadro deve dire che lo sportello di prova non conosce ancora questo dispositivo');
    a = await pubblica(2);
    if (a.finto || a.n !== 2) err('svuotato lo sportello di prova, l\'app pubblica deve tornare all\'archivio di prima: ' + JSON.stringify(a));
    e.note.push('giro intero dallo sportello di prova all\'app pubblica: pubblicazione, correzione, sospensione, riattivazione, ritiro con il motivo, 5 copie nello storico, confronto, ripristino con il promemoria delle rimozioni, Misure con i soli conteggi dello storico, 5 firme sbagliate e fermo');
  } finally { await browser.close(); await s.chiudi(); }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
