/* Prova nel browser: eventi nascosti, dalla creazione cifrata allo sblocco sul telefono (voci T-045 e T-046;
   docs/eventi-nascosti.md; libro mastro §§ 2.3, 3.7, 3.14 e 9.2). Tutto è inventato, password comprese.

   App pubblica, con un archivio servito dalla prova:
    1. La password scritta nella barra dei nascosti (in Cerca), con maiuscole e trattini, sblocca l'evento: si apre la
       sua scheda, con il testo «Evento nascosto, sbloccato con la password»; l'evento si vede anche con gli strati
       spenti. La richiesta chiede solo il file con l'impronta come nome: niente password nell'indirizzo, niente cookie.
    2. Evento e password restano sul telefono (dl_nascosti) e ci sono ancora alla riapertura.
    3. Il comando degli strati «Nascosti che hai sbloccato» li nasconde e li rimostra.
    4. Una correzione (stessa password) arriva al controllo delle novità; se il file non c'è più l'evento non si mostra
       ma resta; se il file torna, ricompare.
    5. Password sbagliata, troppo corta, rete che non risponde, evento già finito: il messaggio giusto.
    6. «Togli dal telefono» (due tocchi) cancella evento e password; un evento finito da più di tre ore si cancella da
       solo all'apertura.
   Dall'app della redazione allo sportello di prova, con le due app aperte dallo stesso indirizzo:
    7. La casella «Evento nascosto» propone una password di cinque parole; senza il codice C del consenso, o con lo
       strato «Manifestazioni», «Pubblica» resta spento.
    8. Pubblicato, l'evento sta nello sportello di prova solo cifrato; la password si legge con «Copia la password» e
       «Copia il messaggio di conferma» ed è nella cassaforte; la riga del registro dice «Evento nascosto: sì».
    9. Nell'app pubblica la password sblocca l'evento; la correzione arriva; sospeso non si mostra e riattivato torna;
       le Misure lo contano; ritirato, il file non c'è più. */
'use strict';
const fs = require('fs');
const path = require('path');
const { esito, eseguiDaSola, RADICE } = require('../comune.js');
const X = require(path.join(RADICE, 'sorgenti', 'moduli', 'excel.js'));
const { playwright, server, apri, giorno, pausa, archivio, eventoProva, idProva, giudizioProva, nascostoProva, NASC } = require('./comune.js');

const PW = 'castoro piuma treno salvia ponte';
const TUTTI = Object.fromEntries(['musica', 'arte', 'sport', 'sociale', 'cibo', 'teatro', 'cinema', 'conferenze', 'laboratori', 'manifestazioni', 'mercati', 'benessere', 'volontariato'].map(k => [k, { on: true }]));
const RICERCA = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [7.6869, 45.0703] },
  properties: { country: 'Italia', city: 'Torino', postcode: '10100', street: 'Via Inventata', housenumber: '5', type: 'house' } }] };
const FRASE = 'una frase inventata per la prova';

async function prova() {
  const e = esito('Eventi nascosti: creazione cifrata e sblocco sul telefono (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const err = x => e.errori.push(x);
  const F = '#foglio-slot ';
  await pubblica(pw, err, F);
  await redazione(pw, err, F, e);
  return e;
}

/* ---------- 1-6: l'app pubblica ---------- */
async function pubblica(pw, err, F) {
  const s = await server('pubblica'), { browser, ctx } = await apri(pw, { dl_guida: '1' });   // strati spenti, come alla prima apertura
  try {
    const H = eventoProva('nascostouno', { titolo: 'Concerto inventato nel cortile', luogo: 'Cortile inventato' });
    const h = await nascostoProva(H, PW);
    const finito = await nascostoProva(eventoProva('nascostofinito', { inizio: giorno(-1) + 'T08:00', fine: giorno(-1) + 'T09:00' }), 'faro lampo sedano nuvola tromba');
    const rotto = await NASC.impronta('ape tram luna moka arpa riso');
    const file = await archivio(ctx, [eventoProva('pubblicouno', { titolo: 'Evento pubblico inventato' })], [], { [h.percorso]: h.testo, [finito.percorso]: finito.testo });
    await ctx.route(u => u.pathname.endsWith('/nascosti/' + rotto + '.json'), r => r.fulfill({ status: 503, body: 'non ora' }));
    const p = await ctx.newPage(), richieste = [];
    p.on('pageerror', y => err('errore nella pagina (pubblica): ' + y.message));
    p.on('request', r => { if (r.url().includes('/nascosti/')) richieste.push({ url: r.url(), cookie: r.headers().cookie || '' }); });
    const conta = () => p.evaluate(() => window.AGR.nascosti.conta());
    const voci = () => p.evaluate(() => { try { return JSON.parse(localStorage.getItem('dl_nascosti') || 'null'); } catch (x) { return 'illeggibile'; } });
    const messaggio = async () => { try { await p.waitForFunction(() => { const x = document.querySelector('#pw-err'); return x && !x.hidden && !/Sblocco/.test(x.textContent); }, null, { timeout: 20000 }); } catch (x) { /* si vede sotto */ }
      return (await p.locator('#pw-err').textContent().catch(() => '')) || ''; };
    const sblocca = async testo => { await p.click('[data-az="cerca"]'); await pausa(300); await p.fill('#pw', testo); await p.click('[data-az="sblocca"]'); };
    const apriApp = async () => { await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="cerca"]'); await pausa(500); };

    /* 1 */
    await apriApp();
    await sblocca('  CASTORO-Piuma treno  salvia ponte ');
    try { await p.waitForFunction(() => /Evento nascosto, sbloccato con la password/.test((document.querySelector('#foglio-slot') || {}).innerText || ''), null, { timeout: 20000 }); }
    catch (x) { err('sblocco: la scheda dell\'evento nascosto non si apre («' + (await messaggio()) + '»)'); return; }
    if (!/Concerto inventato nel cortile/.test(await p.locator(F).innerText())) err('sblocco: la scheda non mostra il titolo dell\'evento nascosto');
    if (!(await p.locator(F + '[data-az="togli-nascosto"]').count())) err('sblocco: nella scheda manca «Togli dal telefono»');
    let c = await conta();
    if (c.voci !== 1 || c.visti !== 1 || c.sullaMappa !== 1) err('sblocco: l\'evento nascosto deve stare sulla mappa anche con gli strati spenti: ' + JSON.stringify(c));
    if (!richieste.length || richieste.some(r => !/\/nascosti\/[0-9a-f]{64}\.json$/.test(r.url) || /castoro|piuma|salvia/i.test(r.url) || r.cookie)) err('sblocco: le richieste devono chiedere solo il file con l\'impronta come nome, senza cookie: ' + JSON.stringify(richieste.slice(0, 3)));
    let v = await voci();
    if (!v || !v.voci || v.voci.length !== 1 || v.voci[0].password !== PW || v.voci[0].impronta !== h.impronta || v.voci[0].evento.titolo !== H.titolo) err('memoria: dl_nascosti deve contenere evento e password (solo le parole): ' + JSON.stringify(v).slice(0, 200));

    /* 2 */
    await apriApp(); c = await conta();
    if (c.voci !== 1 || c.visti !== 1) err('riapertura: l\'evento nascosto sbloccato deve esserci ancora: ' + JSON.stringify(c));
    await p.click('[data-az="elenco"]'); await pausa(500);
    if (!(await p.locator(F + '[data-ev="' + H.id + '"]').count())) err('elenco: con gli strati spenti l\'evento nascosto sbloccato deve esserci');

    /* 3 */
    await apriApp(); await p.locator('[data-az="strati"]').first().click().catch(() => {}); await pausa(500);
    const comando = p.locator(F + '[data-az="nascosti-on"]');
    if (!(await comando.count()) || !/Nascosti che hai sbloccato · 1/.test(await comando.innerText())) err('strati: manca il comando «Nascosti che hai sbloccato · 1»');
    else {
      await comando.click(); await pausa(300); c = await conta();
      if (c.sullaMappa !== 0) err('strati: spento il comando, l\'evento nascosto non deve stare sulla mappa');
      await p.locator(F + '[data-az="nascosti-on"]').click(); await pausa(300); c = await conta();
      if (c.sullaMappa !== 1) err('strati: riacceso il comando, l\'evento nascosto deve tornare sulla mappa');
    }

    /* 4 */
    const corretto = await nascostoProva(Object.assign({}, H, { titolo: 'Concerto inventato, ora alle 21' }), PW);
    if (corretto.percorso !== h.percorso) err('correzione: con la stessa password il nome del file deve restare lo stesso');
    file[h.percorso] = corretto.testo;
    await p.evaluate(() => window.AGR.nascosti.controlla()); v = await voci();
    if (!v || v.voci[0].evento.titolo !== 'Concerto inventato, ora alle 21') err('correzione: al controllo delle novità l\'evento nascosto doveva aggiornarsi');
    delete file[h.percorso];
    await p.evaluate(() => window.AGR.nascosti.controlla()); c = await conta(); v = await voci();
    if (c.voci !== 1 || c.visti !== 0 || !v.voci[0].assente) err('file tolto (sospeso o ritirato): l\'evento non si mostra ma resta sul telefono: ' + JSON.stringify(c));
    file[h.percorso] = corretto.testo;
    await p.evaluate(() => window.AGR.nascosti.controlla()); c = await conta();
    if (c.visti !== 1) err('file tornato (riattivato): l\'evento nascosto doveva ricomparire');

    /* 5 */
    for (const [testo, atteso, cosa] of [['faro lampo sedano nuvola porta', /Nessun evento nascosto con questa password/, 'password sbagliata'], ['ape', /Nessun evento nascosto con questa password/, 'password corta'],
      ['ape tram luna moka arpa riso', /Non riesco a controllare la password/, 'rete che non risponde'], ['faro lampo sedano nuvola tromba', /già finito/, 'evento già finito']]) {
      await apriApp(); await sblocca(testo); const m = await messaggio();
      if (!atteso.test(m)) err(cosa + ': atteso «' + atteso.source + '», letto «' + m + '»');
    }
    c = await conta(); if (c.voci !== 1) err('i tentativi non riusciti non devono salvare nulla: ' + JSON.stringify(c));

    /* 6 */
    await apriApp();
    await p.click('[data-az="cerca"]'); await pausa(300);
    const riga = p.locator(F + '[data-ev="' + H.id + '"]').first();
    if (!(await riga.count())) err('Cerca: sotto la barra manca l\'elenco dei nascosti sbloccati');
    else {
      await riga.click(); await pausa(600);
      await p.click(F + '[data-az="togli-nascosto"]'); await pausa(300);
      if (!/servirà di nuovo la password/.test(await p.locator(F).innerText())) err('togli dal telefono: il primo tocco deve chiedere conferma');
      await p.click(F + '[data-az="togli-nascosto"]'); await pausa(400);
      c = await conta(); v = await voci();
      if (c.voci || v) err('togli dal telefono: evento e password dovevano sparire dal telefono');
    }
    const vecchio = { password: 'faro lampo sedano nuvola tromba', impronta: finito.impronta, evento: eventoProva('nascostofinito', { inizio: giorno(-1) + 'T08:00', fine: giorno(-1) + 'T09:00' }), v: 'x' };
    await p.evaluate(x => localStorage.setItem('dl_nascosti', JSON.stringify({ v: 1, voci: [x] })), vecchio);
    await apriApp(); c = await conta(); v = await voci();
    if (c.voci || v) err('un evento nascosto finito da più di tre ore deve cancellarsi da solo all\'apertura, con la password');
  } finally { await browser.close(); await s.chiudi(); }
}

/* ---------- 7-9: dall'app della redazione all'app pubblica ---------- */
async function redazione(pw, err, F, e) {
  const s = await server('redazione'), { browser, ctx } = await apri(pw, { dl_guida: '1', dl_strati: TUTTI });
  try {
    await archivio(ctx, [eventoProva('prima', { titolo: 'Evento dell’archivio di prima' })]);
    await ctx.route(u => u.hostname === 'photon.komoot.io', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(RICERCA) }));
    const p = await ctx.newPage(), pp = await ctx.newPage();
    for (const [x, n] of [[p, 'redazione'], [pp, 'pubblica']]) x.on('pageerror', y => err('errore nella pagina (' + n + '): ' + y.message));
    const tocca = async (sel, dove) => { const l = p.locator(sel).first(); if (!(await l.count())) { err(`${dove}: non trovo ${sel}`); return false; }
      try { await l.click({ timeout: 15000 }); } catch (x) { err(`${dove}: non riesco a toccare ${sel}`); return false; } await pausa(350); return true; };
    const aspetta = async (re, dove) => { try { await p.waitForFunction(r => new RegExp(r, 'i').test((document.querySelector('#foglio-slot') || {}).innerText || ''), re.source, { timeout: 30000 }); return true; }
      catch (x) { err(dove + ': atteso «' + re.source + '», letto «' + ((await p.locator(F).innerText().catch(() => '')) || '').replace(/\s+/g, ' ').slice(0, 300) + '»'); return false; } };
    const spia = () => p.locator('#g-spia').innerText().catch(() => '');
    const pubblicaApp = async () => { await pp.goto(s.url.replace('/dist/redazione/', '/dist/pubblica/') + 'index.html'); await pp.waitForSelector('[data-az="cerca"]'); await pausa(800); };
    const contaPub = () => pp.evaluate(() => window.AGR.nascosti.controlla().then(() => window.AGR.nascosti.conta()));

    /* chiavi e sportello di prova */
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(400);
    if (!(await tocca('#badgeRed', 'strumenti')) || !(await tocca(F + '[data-az="chiavi"]', 'chiavi'))) return;
    await pausa(400); await p.fill('#ch-nome', 'Portatile di prova'); await p.fill('#ch-frase', FRASE); await p.fill('#ch-ripeti', FRASE);
    await tocca(F + '[data-az="chiavi-crea"]', 'chiavi, crea');
    try { await p.waitForSelector(F + '[data-az="chiavi-copia"]', { timeout: 20000 }); } catch (x) { err('le chiavi non si creano'); return; }
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(300);
    if (!(await tocca('#badgeRed', 'strumenti')) || !(await tocca(F + '[data-az="pubblica"]', 'pubblicazione'))) return;
    await tocca(F + '[data-az="pb-consegna"]', 'consegna delle chiavi'); await aspetta(/Pubblicati · 0/, 'elenco vuoto');

    /* 7 */
    if (!(await tocca(F + '[data-az="pb-nuovo"]', 'nuovo evento')) || !(await tocca(F + '[data-az="nr-nascosto"]', 'casella «Evento nascosto»'))) return;
    let pass = ((await p.locator(F + '.nr-password code').first().textContent().catch(() => '')) || '').trim();
    if (pass.split(' ').length !== 5 || NASC.normalizza(pass).length < 20) err('la password proposta deve essere di cinque parole, almeno venti lettere: «' + pass + '»');
    if (!/ritrovi privati[\s\S]*manifestazioni/.test(await p.locator(F + '.nr-regole').innerText().catch(() => ''))) err('il riquadro dell\'evento nascosto deve ricordare le regole del § 9.2');
    await tocca(F + '[data-az="nr-altra"]', 'generane un\'altra');
    const altra = ((await p.locator(F + '.nr-password code').first().textContent().catch(() => '')) || '').trim();
    if (!altra || altra === pass) err('«Generane un’altra» deve proporre una password diversa'); pass = altra;
    await p.fill('#a-titolo', 'Concerto nascosto inventato'); await p.selectOption('#a-strato', 'musica'); await pausa(300);
    await p.fill('#a-inizio', giorno(3) + 'T21:00'); await p.fill('#a-fine', giorno(3) + 'T23:00'); await p.fill('#a-luogo', 'Cortile inventato');
    await p.fill('#a-desc', 'Una descrizione inventata per la prova dell’evento nascosto.'); await p.fill('#a-fonte', 'Organizzatore inventato');
    await p.fill('#a-indirizzo', 'Via Inventata 5, Torino'); await pausa(1300); await tocca('#a-sugg [data-si="0"]', 'modulo, suggerimento');
    await giudizioProva(p); await pausa(300);
    if (!/consenso dell’organizzatore all’evento nascosto/.test(await spia()) || !(await p.locator(F + '[data-az="a-pubblica"][disabled]').count())) err('senza il codice C del consenso «Pubblica» deve restare spento: «' + (await spia()) + '»');
    await p.fill('#g-consenso', 'C-0001'); await pausa(300);
    await p.selectOption('#a-strato', 'manifestazioni'); await pausa(400);
    if (!/non è mai una manifestazione/.test(await spia())) err('con lo strato «Manifestazioni» «Pubblica» deve restare spento: «' + (await spia()) + '»');
    await p.selectOption('#a-strato', 'musica'); await pausa(400);
    if (await p.locator(F + '[data-az="a-pubblica"][disabled]').count()) err('con il codice C e lo strato giusto «Pubblica» deve accendersi: «' + (await spia()) + '»');

    /* 8 */
    await tocca(F + '[data-az="a-pubblica"]', 'pubblica');
    if (!(await aspetta(/Evento nascosto pubblicato[\s\S]*Copia la password[\s\S]*Copia il messaggio di conferma[\s\S]*Nascosti · 1/, 'pubblicazione dell\'evento nascosto'))) return;
    const id = await p.locator(F + '[data-az="nr-copia-pw"]').first().getAttribute('data-id');
    const dentro = await p.evaluate(async () => {
      const c = await caches.open('prova_sportello'), tutti = [];
      for (const r of await c.keys()) tutti.push({ url: r.url, testo: await (await c.match(r)).text() });
      return { file: tutti.filter(x => /\/pubblico\/nascosti\/[0-9a-f]{64}\.json$/.test(x.url)).length, chiaro: tutti.some(x => /Concerto nascosto inventato|Cortile inventato/.test(x.testo)) };
    });
    if (dentro.file !== 1 || dentro.chiaro) err('sportello di prova: l\'evento nascosto deve esserci soltanto come file cifrato: ' + JSON.stringify(dentro));
    const copiato = await p.evaluate(() => { let t = ''; navigator.clipboard.writeText = x => { t = x; return Promise.resolve(); }; document.querySelector('#foglio-slot [data-az="nr-copia-msg"]').click(); return new Promise(r => setTimeout(() => r(t), 300)); });
    if (!copiato.includes('Concerto nascosto inventato') || !copiato.includes(pass) || !/condividila soltanto con chi vuoi invitare/.test(copiato)) err('«Copia il messaggio di conferma» deve copiare il testo C.2 con titolo e password: «' + copiato + '»');
    /* la stessa pagina della redazione, aperta prima della prima pubblicazione nello sportello di prova, passa da sé al suo
       archivio e sblocca l'evento nascosto (riscontro di Lorenzo del 26/11/2026: la pagina restava sull'archivio del repository) */
    await pausa(800);
    if (!(await p.evaluate(() => window.AGR.archivio().finto))) err('redazione: dopo la pubblicazione nello sportello di prova la pagina deve leggere il suo archivio, senza ricaricarla');
    await p.click(F + '[data-az="nr-fatto-ok"]').catch(() => {}); await pausa(300);
    await p.evaluate(() => window.AGR.chiudi()); await pausa(300);
    await p.click('[data-az="cerca"]'); await pausa(300); await p.fill('#pw', pass); await p.click('[data-az="sblocca"]');
    try { await p.waitForFunction(() => /Evento nascosto, sbloccato con la password/.test((document.querySelector('#foglio-slot') || {}).innerText || ''), null, { timeout: 20000 }); }
    catch (x) { err('redazione: nella stessa pagina la password non sblocca l\'evento nascosto appena pubblicato («' + ((await p.locator('#pw-err').textContent().catch(() => '')) || '') + '»)'); }
    await p.evaluate(() => window.AGR.chiudi()); await pausa(300);
    await tocca('#badgeRed', 'strumenti'); await tocca(F + '[data-az="pubblica"]', 'pubblicazione'); await aspetta(/Nascosti · 1/, 'elenco con il nascosto');

    /* la password si ritrova nella scheda dell'evento, dalla cassaforte */
    if (await tocca(F + '[data-pbev="' + id + '"]', 'evento nascosto nell\'elenco')) {
      await aspetta(/Password dell’evento nascosto/, 'scheda dell\'evento nascosto');
      if (((await p.locator(F + '.nr-password code').first().textContent().catch(() => '')) || '').trim() !== pass) err('la password deve stare nella cassaforte e ritrovarsi nella scheda dell\'evento');
      await tocca(F + '[data-az="pubblica"]', 'torna alla pubblicazione');
    }
    /* la riga del registro delle fonti: «Evento nascosto: sì», con il codice C; la password no */
    if (await tocca(F + '[data-az="pb-registro"]', 'registro delle fonti')) {
      await aspetta(/Sul dispositivo: \d+ righe degli eventi/, 'registro delle fonti');
      try {
        const [d] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), p.locator(F + '[data-az="rx-esporta"]').first().click()]);
        const wb = await X.leggi(fs.readFileSync(await d.path()), d.suggestedFilename()), righe = (wb.fogli.find(x => x.nome === 'Eventi') || {}).righe || [], testa = righe[3] || [], k = n => testa.indexOf(n);
        const r = righe.slice(4).find(x => x[k("Identificativo dell'evento")] === id);
        if (!r || r[k('Evento nascosto')] !== 'Sì' || r[k('Prova del consenso (codice C)')] !== 'C-0001') err('registro delle fonti: la riga dell\'evento nascosto deve dire «Evento nascosto: sì», con il codice C: ' + JSON.stringify(r).slice(0, 300));
        if (JSON.stringify(righe).includes(NASC.normalizza(pass).slice(0, 12)) || JSON.stringify(righe).includes(pass)) err('registro delle fonti: la password non deve stare nel registro');
      } catch (x) { err('registro delle fonti: l\'esportazione non riesce (' + x.message + ')'); }
      await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(300); await tocca('#badgeRed', 'strumenti'); await tocca(F + '[data-az="pubblica"]', 'pubblicazione');
      await aspetta(/Nascosti · 1/, 'elenco con il nascosto');
    }

    /* 9 */
    await pubblicaApp();
    await pp.click('[data-az="cerca"]'); await pausa(300); await pp.fill('#pw', pass.toUpperCase()); await pp.click('[data-az="sblocca"]');
    try { await pp.waitForFunction(() => /Concerto nascosto inventato/.test((document.querySelector('#foglio-slot') || {}).innerText || ''), null, { timeout: 20000 }); }
    catch (x) { err('app pubblica: la password non sblocca l\'evento pubblicato dallo sportello di prova («' + ((await pp.locator('#pw-err').textContent().catch(() => '')) || '') + '»)'); return; }
    /* correzione, stessa password */
    if (await tocca(F + '[data-pbev="' + id + '"]', 'evento nascosto nell\'elenco') && await tocca(F + '[data-az="pb-correggi"]', 'correggi')) {
      if (((await p.locator(F + '.nr-password code').first().textContent().catch(() => '')) || '').trim() !== pass || await p.locator(F + '[data-az="nr-altra"]').count()) err('correzione: la password deve restare la stessa, senza «Generane un’altra»');
      await p.fill('#a-titolo', 'Concerto nascosto inventato, corretto'); await pausa(300);
      await tocca(F + '[data-az="a-pubblica"]', 'pubblica la correzione');
      await aspetta(/Correzione dell’evento nascosto pubblicata/, 'correzione');
    }
    let c = await contaPub(), titolo = await pp.evaluate(() => JSON.parse(localStorage.getItem('dl_nascosti')).voci[0].evento.titolo);
    if (c.visti !== 1 || titolo !== 'Concerto nascosto inventato, corretto') err('app pubblica: la correzione non è arrivata: ' + JSON.stringify(c) + ' «' + titolo + '»');
    /* sospensione e riattivazione */
    if (await tocca(F + '[data-pbev="' + id + '"]', 'evento') && await tocca(F + '[data-az="pb-sospendi"]', 'sospendi')) await aspetta(/Sospeso alle/, 'sospensione');
    c = await contaPub(); if (c.voci !== 1 || c.visti !== 0) err('app pubblica: sospeso, l\'evento nascosto non si deve mostrare ma deve restare: ' + JSON.stringify(c));
    if (await tocca(F + '[data-pbev="' + id + '"]', 'evento') && await tocca(F + '[data-az="pb-riattiva"]', 'riattiva')) await aspetta(/Riattivato alle/, 'riattivazione');
    c = await contaPub(); if (c.visti !== 1) err('app pubblica: riattivato, l\'evento nascosto deve ricomparire: ' + JSON.stringify(c));
    /* le Misure lo contano, con città e strato (la fotografia del giorno: l'archivio dello sportello di prova ha soltanto il nascosto, a Torino; sotto la soglia di 5 il numero si legge «meno di 5») */
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(300);
    if (await tocca('#badgeRed', 'strumenti') && await tocca(F + '[data-az="admin-misure"]', 'Misure')) {
      try { await p.waitForFunction(() => /di cui .* nascosti/.test((document.querySelector('.mz-archivio') || {}).textContent || ''), null, { timeout: 25000 }); }
      catch (x) { err('Misure: la riga dell\'archivio deve dire che un evento è nascosto: «' + ((await p.locator('.mz-archivio').first().textContent().catch(() => '')) || '') + '»'); }
      const g = await p.evaluate(() => { const m = JSON.parse(localStorage.getItem('red_misure') || '{}'), d = new Date(), k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); return (m.giorni || {})[k] || null; });
      if (!g || g.tot !== 1 || (g.citta || {}).torino !== 1 || (g.strati || {}).musica !== 1) err('Misure: l\'evento nascosto deve contare come gli altri, con città e strato: ' + JSON.stringify(g));
    }
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(300); await tocca('#badgeRed', 'strumenti'); await tocca(F + '[data-az="pubblica"]', 'pubblicazione');
    await aspetta(/Nascosti · 1/, 'elenco con il nascosto');
    /* ritiro */
    if (await tocca(F + '[data-pbev="' + id + '"]', 'evento') && await tocca(F + '[data-az="pb-ritira"]', 'ritira')) {
      await p.selectOption('#pb-motivo', 'richiesta'); await tocca(F + '[data-az="pb-ritira-ok"]', 'conferma del ritiro'); await aspetta(/Ritirato alle/, 'ritiro');
    }
    const restano = await p.evaluate(async () => (await (await caches.open('prova_sportello')).keys()).filter(r => /\/pubblico\/nascosti\//.test(r.url)).length);
    c = await contaPub();
    if (restano || c.visti !== 0) err('ritirato, il file dell\'evento nascosto non deve più esserci e il telefono non lo deve mostrare: ' + JSON.stringify({ restano, c }));
    e.note.push('password proposta: cinque parole; sblocco nell\'app pubblica dallo sportello di prova riuscito; correzione, sospensione, riattivazione, Misure e ritiro controllati');
  } finally { await browser.close(); await s.chiudi(); }
}

module.exports = { prova };
eseguiDaSola(module, prova);
