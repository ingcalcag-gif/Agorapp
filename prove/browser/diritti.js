/* Prova nel browser: i diritti delle persone (voci T-047 e T-048; libro mastro §§ 2.4, 3.5, 3.13, 18.7, cap. 26).

   Le due app si aprono dallo stesso indirizzo, come sul collegamento di prova, con lo sportello di prova. Tutto è
   inventato; l'evento con «Persona di prova» e le sue frasi sono testi d'esempio approvati il 26/11/2026.

   1. Si pubblicano un evento che nomina «Persona di prova» e un evento nascosto con la stessa descrizione (codice C);
      l'evento pubblico si corregge, così lo storico ha più copie con il nome.
   2. Accesso: la ricerca trova i due eventi, con le copie dello storico, e la riga del registro delle fonti che porta il
      titolo; i recapiti sono già tolti; il resoconto in
      Excel è intestato con il solo codice della richiesta e non contiene recapiti.
   3. Portabilità: con il codice C l'app trova l'evento nascosto; escono l'Excel con le colonne del modello e il JSON.
   4. «Togli questo nome ovunque»: richiesta nuova con il codice R, tre punti trovati (anche nel nascosto), una casella
      si toglie e si rimette; alla conferma i due eventi si ripubblicano con «[relatore]», la richiesta è evasa nelle
      Misure; nell'app pubblica il nome non c'è più, nemmeno nel nascosto sbloccato.
   5. Lo storico conserva il nome: la ricerca per l'accesso lo trova solo nello storico.
   6. Ripristino di una copia vecchia: il promemoria elenca la richiesta; «Ripubblica» resta spento finché il nome non
      si toglie dalla copia; dopo, la copia ripubblicata non ha il nome. */
'use strict';
const fs = require('fs');
const path = require('path');
const { esito, eseguiDaSola, RADICE } = require('../comune.js');
const X = require(path.join(RADICE, 'sorgenti', 'moduli', 'excel.js'));
const { playwright, server, apri, giorno, pausa, archivio, eventoProva, eventiCaricati, giudizioProva } = require('./comune.js');

const TUTTI = Object.fromEntries(['musica', 'arte', 'sport', 'sociale', 'cibo', 'teatro', 'cinema', 'conferenze', 'laboratori', 'manifestazioni', 'mercati', 'benessere', 'volontariato'].map(k => [k, { on: true }]));
const RICERCA = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [7.6869, 45.0703] },
  properties: { country: 'Italia', city: 'Torino', postcode: '10100', street: 'Via Inventata', housenumber: '5', type: 'house' } }] };
const FRASE = 'una frase inventata per la prova';
const TITOLO = 'Incontro con Persona di prova';
const DESC = 'Persona di prova racconta il laboratorio di quartiere. Ingresso libero; informazioni a prova@esempio.invalid.';
const DESC2 = 'Persona di prova racconta il laboratorio di quartiere. Ingresso libero, posti limitati; informazioni a prova@esempio.invalid.';
const dtLocale = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);

async function prova() {
  const e = esito('Diritti delle persone: togliere un nome, accesso e portabilità (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const err = x => e.errori.push(x);
  const F = '#foglio-slot ';
  const s = await server('redazione'), { browser, ctx } = await apri(pw, { dl_guida: '1', dl_strati: TUTTI });
  try {
    await archivio(ctx, [eventoProva('prima', { titolo: 'Evento dell’archivio di prima' })]);
    await ctx.route(u => u.hostname === 'photon.komoot.io', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(RICERCA) }));
    const p = await ctx.newPage(), pp = await ctx.newPage();
    for (const [x, n] of [[p, 'redazione'], [pp, 'pubblica']]) x.on('pageerror', y => err('errore nella pagina (' + n + '): ' + y.message));
    const tocca = async (sel, dove) => { const l = p.locator(sel).first();
      /* l'elemento può arrivare dopo una lettura dello sportello: si aspetta, anche con più prove insieme */
      try { await l.waitFor({ timeout: 20000 }); } catch (x) { err(`${dove}: non trovo ${sel}`); return false; }
      try { await l.click({ timeout: 15000 }); } catch (x) { err(`${dove}: non riesco a toccare ${sel}`); return false; } await pausa(350); return true; };
    const testo = () => p.locator(F).innerText().catch(() => '');
    const aspetta = async (re, dove, ms = 30000) => { try { await p.waitForFunction(r => new RegExp(r, 'i').test((document.querySelector('#foglio-slot') || {}).innerText || ''), re.source, { timeout: ms }); return true; }
      catch (x) { err(dove + ': atteso «' + re.source + '», letto «' + ((await testo()) || '').replace(/\s+/g, ' ').slice(-700) + '»'); return false; } };
    const strumenti = async () => { await p.evaluate(() => window.AGR.chiudi()); await pausa(250); return tocca('#badgeRed', 'strumenti'); };
    const scarica = async (sel, dove) => { try { const [d] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), p.locator(sel).first().click()]); return { nome: d.suggestedFilename(), dati: fs.readFileSync(await d.path()) }; }
      catch (x) { err(dove + ': il file non si scarica (' + x.message + ')'); return null; } };
    const compila = async (titolo, desc, luogo) => {
      await p.fill('#a-titolo', titolo); await p.selectOption('#a-strato', 'musica'); await pausa(300);
      await p.fill('#a-inizio', giorno(3) + 'T18:00'); await p.fill('#a-fine', giorno(3) + 'T20:00'); await p.fill('#a-luogo', luogo);
      await p.fill('#a-desc', desc); await p.fill('#a-fonte', 'Fonte inventata');
      await p.fill('#a-indirizzo', 'Via Inventata 5, Torino'); await pausa(1300); await tocca('#a-sugg [data-si="0"]', 'modulo, suggerimento');
      await giudizioProva(p); await pausa(300);
      /* l'indirizzo di posta inventato fa comparire l'avviso dei recapiti: qui si conferma, per arrivare alla ricerca */
      if (await p.locator(F + '[data-az="g-visto"][data-k="recapiti"]').count()) await tocca(F + '[data-az="g-visto"][data-k="recapiti"]', 'avviso dei recapiti');
    };

    /* chiavi e sportello di prova */
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(400);
    if (!(await tocca('#badgeRed', 'strumenti')) || !(await tocca(F + '[data-az="chiavi"]', 'chiavi'))) return e;
    await pausa(400); await p.fill('#ch-nome', 'Portatile di prova'); await p.fill('#ch-frase', FRASE); await p.fill('#ch-ripeti', FRASE);
    await tocca(F + '[data-az="chiavi-crea"]', 'chiavi, crea');
    try { await p.waitForSelector(F + '[data-az="chiavi-copia"]', { timeout: 20000 }); } catch (x) { err('le chiavi non si creano'); return e; }
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(300);
    if (!(await tocca('#badgeRed', 'strumenti')) || !(await tocca(F + '[data-az="pubblica"]', 'pubblicazione'))) return e;
    await tocca(F + '[data-az="pb-consegna"]', 'consegna delle chiavi'); await aspetta(/Pubblicati · 0/, 'elenco vuoto');

    /* 1 */
    await tocca(F + '[data-az="pb-nuovo"]', 'nuovo evento'); await compila(TITOLO, DESC, 'Sala inventata');
    await tocca(F + '[data-az="a-pubblica"]', 'pubblica'); if (!(await aspetta(/Pubblicato alle[\s\S]*Pubblicati · 1/, 'pubblicazione dell\'evento con il nome'))) return e;
    await tocca(F + '[data-az="pb-nuovo"]', 'nuovo evento nascosto'); await tocca(F + '[data-az="nr-nascosto"]', 'casella «Evento nascosto»');
    const pass = ((await p.locator(F + '.nr-password code').first().textContent().catch(() => '')) || '').trim();
    await compila('Concerto nascosto inventato', DESC, 'Cortile inventato'); await p.fill('#g-consenso', 'C-0001'); await pausa(300);
    await tocca(F + '[data-az="a-pubblica"]', 'pubblica il nascosto'); if (!(await aspetta(/Evento nascosto pubblicato[\s\S]*Nascosti · 1/, 'pubblicazione del nascosto'))) return e;
    await tocca(F + '[data-az="nr-fatto-ok"]', 'fatto');
    await tocca(F + '[data-pbev]:has-text("' + TITOLO + '")', 'evento nell\'elenco'); await tocca(F + '[data-az="pb-correggi"]', 'correggi');
    await p.fill('#a-desc', DESC2); await pausa(300);
    if (await p.locator(F + '[data-az="g-visto"][data-k="recapiti"][aria-pressed="false"]').count()) await tocca(F + '[data-az="g-visto"][data-k="recapiti"]', 'avviso dei recapiti');
    await tocca(F + '[data-az="a-pubblica"]', 'pubblica la correzione'); if (!(await aspetta(/Correzione pubblicata alle/, 'correzione'))) return e;

    /* 2 */
    await strumenti(); await tocca(F + '[data-az="rn"]', 'cerca un nome');
    await p.fill('#rn-r', 'R-0001'); await p.fill('#rn-forme', 'Persona di prova'); await tocca(F + '[data-az="rn-cerca"]', 'cerca');
    /* tre righe: i due eventi e la riga del registro delle fonti, che qui porta il titolo con il nome (la scheda della prova
       risponde «nessun nome»): il registro non si tocca, ma l'accesso lo trova */
    if (await aspetta(/Eventi in cui compare · 3[\s\S]*Registro delle fonti, riga F-/, 'accesso: due eventi e la riga del registro')) {
      const t = await testo();
      if (!/Pubblicato[\s\S]*In 3 copie dello storico/.test(t) || !/Nascosto[\s\S]*In 2 copie dello storico/.test(t)) err('accesso: per ogni evento le copie dello storico in cui compare il nome: ' + t.replace(/\s+/g, ' ').slice(0, 400));
      const brani = await p.evaluate(() => [...document.querySelectorAll('#foglio-slot [data-rnb]')].map(x => x.value).join(' | '));
      if (/@esempio/.test(brani) || !/\[recapito tolto\]/.test(brani) || !/Persona di prova/.test(brani)) err('accesso: i brani devono avere il nome e non i recapiti: ' + brani.slice(0, 300));
      const f = await scarica(F + '[data-az="rn-esporta"]', 'resoconto dell\'accesso');
      if (f) {
        const wb = await X.leggi(f.dati, f.nome), r = (wb.fogli.find(x => x.nome === 'Resoconto') || {}).righe || [], tutto = JSON.stringify(r);
        if (!/^accesso-R-0001-/.test(f.nome) || !/R-0001/.test(String((r[0] || [])[0])) || r.length < 6 || /@esempio/.test(tutto) || !/Persona di prova/.test(tutto)) err('accesso: il resoconto deve avere il codice R in testa, i brani con il nome e nessun recapito: ' + f.nome + ' ' + tutto.slice(0, 300));
      }
    }

    /* 3 */
    await strumenti(); await tocca(F + '[data-az="rp"]', 'portabilità');
    await p.fill('#rp-r', 'R-0001'); await p.fill('#rp-c', 'C-0001'); await tocca(F + '[data-az="rp-cerca"]', 'cerca');
    if (await aspetta(/Eventi trovati · 1[\s\S]*Concerto nascosto inventato/, 'portabilità: l\'evento nascosto del consenso')) {
      const j = await scarica(F + '[data-az="rp-json"]', 'portabilità, JSON');
      if (j) { const d = JSON.parse(j.dati.toString('utf8')); if (d.formato !== 'eventi' || d.richiesta !== 'R-0001' || (d.eventi || []).length !== 1 || d.eventi[0].titolo !== 'Concerto nascosto inventato') err('portabilità: il JSON deve avere l\'evento del consenso nel formato degli eventi: ' + JSON.stringify(d).slice(0, 200)); }
      const x = await scarica(F + '[data-az="rp-excel"]', 'portabilità, Excel');
      if (x) { const wb = await X.leggi(x.dati, x.nome), r = (wb.fogli.find(y => y.nome === 'Eventi') || {}).righe || [];
        if ((r[0] || []).length !== 17 || r[0][0] !== 'Titolo' || r[0][16] !== 'Organizzatore' || (r[1] || [])[0] !== 'Concerto nascosto inventato') err('portabilità: l\'Excel deve avere le 17 colonne dell\'evento del modello e la riga dell\'evento: ' + JSON.stringify(r).slice(0, 300)); }
    }

    /* 4 */
    await strumenti(); await tocca(F + '[data-az="tn"]', 'togli questo nome ovunque');
    await tocca(F + '[data-az="tn-rich"][data-v="nuova"]', 'richiesta nuova');
    /* un minuto avanti: la richiesta viene dopo tutte le copie della prova anche se tutto succede nello stesso minuto */
    await p.fill('#tn-ric', dtLocale(new Date(Date.now() + 6e4))); await p.fill('#tn-r', 'R-0001'); await p.fill('#tn-forme', 'Persona di prova');
    await tocca(F + '[data-az="tn-cerca"]', 'cerca');
    if (!(await aspetta(/Trovato in 3 punti[\s\S]*Eventi pubblicati e sospesi · 1[\s\S]*Eventi nascosti · 1/, 'togli: tre punti, anche nel nascosto'))) return e;
    const casella = F + '[data-tnp="0.0"]';
    await tocca(casella, 'togli il segno'); if ((await p.getAttribute(casella, 'aria-pressed')) !== 'false') err('togli: la casella di un punto deve togliersi');
    await tocca(casella, 'rimetti il segno'); if ((await p.getAttribute(casella, 'aria-pressed')) !== 'true') err('togli: la casella di un punto deve rimettersi');
    await tocca(F + '[data-az="tn-togli"]', 'togli il nome'); await aspetta(/Tocca ancora/, 'togli: la conferma');
    await tocca(F + '[data-az="tn-togli"]', 'togli il nome, conferma');
    await aspetta(/Nome tolto alle[\s\S]*2 eventi corretti[\s\S]*Richiesta R-0001 segnata come evasa/, 'togli: eventi ripubblicati e richiesta evasa');
    const m = await p.evaluate(() => JSON.parse(localStorage.getItem('red_misure') || '{}').rimozioni || []);
    if (!m.some(r => r.r === 'R-0001' && r.ric && r.eva)) err('togli: la richiesta deve essere nel registro delle Misure con codice, ricevuta ed evasa: ' + JSON.stringify(m));
    await pp.goto(s.url.replace('/dist/redazione/', '/dist/pubblica/') + 'index.html'); await pp.waitForSelector('[data-az="elenco"]'); await eventiCaricati(pp, 1); await pausa(500);
    await pp.click('[data-az="elenco"]'); await pausa(500);
    const titoli = await pp.evaluate(() => [...document.querySelectorAll('#foglio-slot [data-ev]')].map(x => x.textContent).join(' | '));
    if (!/Incontro con \[relatore\]/.test(titoli) || /Persona di prova/.test(titoli)) err('app pubblica: il titolo deve dire «Incontro con [relatore]»: ' + titoli);
    await pp.evaluate(() => window.AGR.chiudi()); await pausa(300);
    await pp.click('[data-az="cerca"]'); await pausa(300); await pp.fill('#pw', pass); await pp.click('[data-az="sblocca"]');
    try { await pp.waitForFunction(() => /\[relatore\] racconta il laboratorio/.test((document.querySelector('#foglio-slot') || {}).innerText || ''), null, { timeout: 20000 }); }
    catch (x) { err('app pubblica: l\'evento nascosto sbloccato deve dire «[relatore] racconta…»: ' + ((await pp.locator('#foglio-slot').innerText().catch(() => '')) || '').slice(0, 200)); }

    /* 5 */
    await strumenti(); await tocca(F + '[data-az="rn"]', 'cerca un nome, di nuovo');
    await p.fill('#rn-r', 'R-0001'); await p.fill('#rn-forme', 'Persona di prova'); await tocca(F + '[data-az="rn-cerca"]', 'cerca');
    if (await aspetta(/Eventi in cui compare · 3/, 'accesso dopo la rimozione')) {
      const t = await testo();
      if ((t.match(/Solo nello storico/g) || []).length !== 2) err('accesso dopo la rimozione: il nome resta solo nello storico, per i due eventi: ' + t.replace(/\s+/g, ' ').slice(0, 300));
    }

    /* 6 */
    await strumenti(); await tocca(F + '[data-az="pubblica"]', 'pubblicazione'); await aspetta(/Pubblicati · 1/, 'elenco');
    await tocca(F + '[data-az="pb-storico"]', 'storico');
    await aspetta(/Tocca una copia per ripristinarla/, 'copie dello storico');
    await tocca(F + '[data-pbcopia]:last-of-type', 'la copia più vecchia'); await tocca(F + '[data-az="pb-ripristina"]', 'ripristina');
    if (await aspetta(/è stata chiesta 1 rimozione[\s\S]*R-0001/, 'promemoria della richiesta')) {
      if (!(await p.locator(F + '[data-az="pb-ripr-ok"]').isDisabled())) err('ripristino: «Ripubblica» deve restare spento finché la richiesta non è ripetuta');
      await tocca(F + '[data-az="tn-copia"]', 'togli il nome da questa copia');
      await p.fill('#tn-forme', 'Persona di prova'); await tocca(F + '[data-az="tn-cerca"]', 'cerca nella copia');
      await aspetta(/Trovato in 2 punti/, 'togli nella copia');
      await tocca(F + '[data-az="tn-togli"]', 'togli nella copia'); await tocca(F + '[data-az="tn-togli"]', 'togli nella copia, conferma');
      await aspetta(/Nome tolto da 1 eventi della copia[\s\S]*Richiesta segnata come ripetuta/, 'ritorno al ripristino');
      if (await p.locator(F + '[data-az="pb-ripr-ok"]').isDisabled()) err('ripristino: con la richiesta ripetuta «Ripubblica» deve accendersi');
      await tocca(F + '[data-az="pb-ripr-ok"]', 'ripubblica'); await aspetta(/Copia ripristinata e pubblicata alle/, 'ripristino');
      await pp.goto(s.url.replace('/dist/redazione/', '/dist/pubblica/') + 'index.html'); await pp.waitForSelector('[data-az="elenco"]'); await eventiCaricati(pp, 1); await pausa(500);
      await pp.click('[data-az="elenco"]'); await pausa(500);
      const dopo = await pp.evaluate(() => [...document.querySelectorAll('#foglio-slot [data-ev]')].map(x => x.textContent).join(' | '));
      if (!/Incontro con \[relatore\]/.test(dopo) || /Persona di prova/.test(dopo)) err('dopo il ripristino la copia ripubblicata non deve avere il nome: ' + dopo);
    }
    e.note.push('evento e nascosto con il nome, accesso con lo storico e il resoconto in Excel, portabilità in Excel e JSON, rimozione con la richiesta evasa nelle Misure, ripristino con la rimozione ripetuta');
  } finally { await browser.close(); await s.chiudi(); }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
