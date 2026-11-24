/* Prova nel browser: l'importazione dal file Excel degli eventi (voce T-042 del piano di adeguamento; libro mastro
   § 2.2, canale 2; § 5.2), nell'app della redazione, con lo sportello di prova, la ricerca degli indirizzi finta e un
   file di dieci righe inventate scritto con le intestazioni del file «Eventi da importare» del 13/11/2026.

   1. Le dieci righe finiscono nei gruppi giusti: 3 pronte; 4 da sistemare (senza «Fonte», con «+39 …» nella
      descrizione, evento politico con nomi senza consenso esplicito, codice FS che non è nell'elenco delle fonti);
      1 nell'elenco degli indirizzi non trovati; 2 rifiutate con il motivo (immagine compilata, data passata).
   2. «Pubblica» resta spento finché nessuna riga è segnata «L'ho vista: pubblicala»; con due righe segnate si
      pubblicano quelle due, in un solo pacchetto, con le righe del registro delle fonti (codici F) nel riservato
      dello sportello; la riga pronta non segnata resta fuori.
   3. La riga con l'indirizzo non trovato: «Metti il punto», punto scelto sulla mappa, «Tieni nell'importazione»: torna
      tra le pronte.
   4. Il modello scaricabile ha le colonne del file del 13/11/2026 (con «Luogo» e «Come arrivare») e nessun evento. */
'use strict';
const path = require('path');
const fs = require('fs');
const { esito, eseguiDaSola, RADICE } = require('../comune.js');
const { playwright, server, apri, giorno, pausa, archivio, eventoProva } = require('./comune.js');
const X = require(path.join(RADICE, 'sorgenti', 'moduli', 'excel.js'));

const FRASE = 'una frase inventata per la prova';
const TROVATO = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [7.6869, 45.0703] },
  properties: { country: 'Italia', city: 'Torino', postcode: '10100', street: 'Via Inventata', housenumber: '5', type: 'house' } }] };
const NIENTE = { type: 'FeatureCollection', features: [] };
const TESTA = ['Titolo', 'Strato', 'Sottostrato', 'Descrizione', 'Data', 'Ora inizio', 'Ora fine', 'Durata', 'Prezzo', 'Indirizzo', 'Latitudine', 'Longitudine', 'Link', 'Immagine', 'Nascosto', 'Password',
  'Provenienza', 'Fonte', 'Organizzatore', 'Fonte (codice FS)', 'Data di consultazione', 'Post leggibile senza account', 'Dieci domande', 'Domande e correzioni', 'Nomi ripresi',
  'Evento politico o religioso', 'Prova del consenso (codice C)', "Recapito dell'organizzatore per l'avviso (codice K)"];
const D = 'Una descrizione inventata, riscritta con parole proprie per la prova.';
/* una riga del file: i valori che non si danno restano quelli di una riga buona */
function riga(n, cambi = {}) {
  const v = { Titolo: 'Evento inventato del file ' + n, Strato: 'Musica', Descrizione: D, Data: giorno(4), 'Ora inizio': '18:00', 'Ora fine': '20:00', Indirizzo: 'Via Inventata 5, Torino',
    Link: 'https://circolo-inventato.example/evento-' + n, Nascosto: 'No', Provenienza: 'Fonte pubblica', Fonte: 'Circolo Inventato, sito', 'Fonte (codice FS)': 'FS-0001',
    'Data di consultazione': giorno(-1), 'Post leggibile senza account': 'Non pertinente', 'Dieci domande': 'Tutte superate', 'Nomi ripresi': 'Nessun nome', 'Evento politico o religioso': 'No' };
  Object.assign(v, cambi);
  return TESTA.map(k => v[k] === undefined ? '' : v[k]);
}
function fileDiDieci() {
  const righe = [TESTA,
    riga(1), riga(2),
    riga(3, { Indirizzo: 'Piazza Inventata, Torino', Latitudine: 45.0712, Longitudine: 7.6851 }),
    riga(4, { Fonte: '' }),
    riga(5, { Indirizzo: 'Via Che Non Esiste 1, Torino' }),
    riga(6, { Immagine: 'locandina-inventata.jpg' }),
    riga(7, { Data: giorno(-3) }),
    riga(8, { Descrizione: D + ' Per informazioni: +39 333 7654321.' }),
    riga(9, { 'Evento politico o religioso': 'Sì', 'Nomi ripresi': 'Sì, con il solo ruolo' }),
    riga(10, { 'Fonte (codice FS)': 'FS-0099' })];
  return Buffer.from(X.scrivi([['Eventi', righe]]));
}

async function prova() {
  const e = esito('Importazione dal file Excel: anteprima, segno per riga, indirizzi a parte (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const err = x => e.errori.push(x);
  const F = '#foglio-slot ';
  const s = await server('redazione'), { browser, ctx } = await apri(pw, { dl_guida: '1' });
  try {
    await archivio(ctx, [eventoProva('importaprima', { titolo: 'Evento dell’archivio di prima' })]);
    await ctx.route(u => u.hostname === 'photon.komoot.io', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(/Che Non Esiste/i.test(decodeURIComponent(r.request().url())) ? NIENTE : TROVATO) }));
    const p = await ctx.newPage();
    p.on('pageerror', y => err('errore nella pagina: ' + y.message));
    const tocca = async (sel, dove) => { const l = p.locator(sel).first(); if (!(await l.count())) { err(`${dove}: non trovo ${sel}`); return false; }
      try { await l.click({ timeout: 15000 }); } catch (x) { err(`${dove}: non riesco a toccare ${sel}`); return false; } await pausa(300); return true; };
    const testo = () => p.locator(F).innerText().catch(() => '');
    const aspetta = async (re, dove, ms = 25000) => { try { await p.waitForFunction(r => new RegExp(r, 'i').test((document.querySelector('#foglio-slot') || {}).innerText || ''), re.source, { timeout: ms }); return true; } catch (x) { err(dove + ': atteso «' + re.source + '», trovato «' + (await testo()).replace(/\s+/g, ' ').slice(0, 400) + '»'); return false; } };
    const apriPb = async () => { await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(300); return await tocca('#badgeRed', 'strumenti') && await tocca(F + '[data-az="pubblica"]', 'pubblicazione'); };

    /* chiavi, sportello di prova e la fonte FS-0001 */
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(400);
    if (!(await tocca('#badgeRed', 'strumenti')) || !(await tocca(F + '[data-az="chiavi"]', 'chiavi'))) return e;
    await pausa(400); await p.fill('#ch-nome', 'Portatile di prova'); await p.fill('#ch-frase', FRASE); await p.fill('#ch-ripeti', FRASE);
    await tocca(F + '[data-az="chiavi-crea"]', 'chiavi, crea');
    try { await p.waitForSelector(F + '[data-az="chiavi-copia"]', { timeout: 20000 }); } catch (x) { err('le chiavi non si creano'); return e; }
    if (!(await apriPb())) return e;
    await aspetta(/non conosce ancora questo dispositivo/, 'senza chiavi consegnate');
    await tocca(F + '[data-az="pb-consegna"]', 'consegna delle chiavi'); await aspetta(/accetta la firma di questo dispositivo/, 'chiavi consegnate');
    await tocca(F + '[data-az="pb-registro"]', 'registro delle fonti'); await tocca(F + '[data-az="pb-fonti"]', 'fonti'); await tocca(F + '[data-az="pb-fonte-nuova"]', 'nuova fonte');
    await p.fill('#fo-nome', 'Circolo Inventato, sito'); await p.selectOption('#fo-tipo', 'sito'); await p.fill('#fo-indirizzo', 'https://circolo-inventato.example/'); await p.selectOption('#fo-esito', 'ammessa');
    await tocca(F + '[data-az="pb-fonte-salva"]', 'salva la fonte'); await aspetta(/FS-0001 · Circolo Inventato/, 'fonte FS-0001');

    /* 1 */
    if (!(await apriPb())) return e;
    await p.setInputFiles('#fileImporta', { name: 'eventi-inventati.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: fileDiDieci() });
    await aspetta(/Pronte · 3[\s\S]*Da sistemare · 4[\s\S]*Indirizzi non trovati · 1[\s\S]*Rifiutate[^·]*· 2/, 'gruppi delle dieci righe', 40000);
    const t1 = await testo();
    for (const [re, che] of [[/Riga 7: colonna «Immagine» compilata/, 'riga con l\'immagine rifiutata'], [/Riga 8: l’evento è già finito/, 'riga con la data passata rifiutata'],
      [/Riga 5 · Evento inventato del file 4[\s\S]{0,200}Fonte/, 'riga senza «Fonte» da sistemare'], [/Riga 9 · [\s\S]{0,300}conferma di un avviso/, 'riga con «+39 …» da sistemare'],
      [/Riga 10 · [\s\S]{0,400}codice C del consenso esplicito/, 'evento politico con nomi senza consenso da sistemare'], [/Riga 11 · [\s\S]{0,300}la fonte nel registro/, 'codice FS sconosciuto da sistemare'],
      [/Riga 6 · Evento inventato del file 5[\s\S]{0,120}indirizzo non trovato/, 'indirizzo non trovato nell\'elenco a parte']])
      if (!re.test(t1)) err('anteprima: ' + che);

    /* 2 */
    const tasto = F + '[data-az="ix-pubblica"]';
    if (!(await p.locator(tasto).isDisabled())) err('«Pubblica» deve restare spento finché nessuna riga è segnata');
    await tocca(F + '[data-az="ix-vista"][data-r="2"]', 'segno della riga 2'); await tocca(F + '[data-az="ix-vista"][data-r="3"]', 'segno della riga 3');
    if (!/Pubblica le 2 righe segnate/.test(await p.locator(tasto).innerText().catch(() => '')) || await p.locator(tasto).isDisabled()) err('con due righe segnate, «Pubblica le 2 righe segnate» deve essere acceso');
    await tocca(tasto, 'pubblica le righe segnate');
    await aspetta(/Pubblicate 2 righe alle \d\d[:.]\d\d \(ora dello sportello\)[\s\S]*Pronte · 1[\s\S]*Già pubblicate · 2/, 'pubblicazione delle due righe segnate');
    const allo = await p.evaluate(async () => { const c = await caches.open('prova_sportello'), out = { righe: [], stato: null };
      for (const r of await c.keys()) { if (/riservato\/registro\/righe\//.test(r.url)) out.righe.push(JSON.parse(await (await c.match(r)).text())); if (/riservato\/stato\.json$/.test(r.url)) out.stato = JSON.parse(await (await c.match(r)).text()); }
      return out; });
    const titoli = ((allo.stato || {}).eventi || []).map(x => x.titolo).sort().join(' | ');
    if (titoli !== 'Evento inventato del file 1 | Evento inventato del file 2') err('allo sportello devono esserci i due eventi segnati, e solo loro: ' + titoli);
    if (allo.righe.length !== 1 || Object.values(allo.righe[0].codici).sort().join() !== 'F-00001,F-00002') err('le righe del registro delle due pubblicazioni devono arrivare in un solo pacchetto, con i codici F-00001 e F-00002 (' + JSON.stringify(allo.righe.map(x => x.codici)) + ')');
    if (JSON.stringify(allo.righe).includes('Evento inventato del file')) err('nel riservato le righe del registro si leggono in chiaro');

    /* 3 */
    if (await tocca(F + '[data-az="ix-correggi"][data-r="6"]', 'metti il punto')) {
      await aspetta(/Riga 6 del file/, 'scheda della riga 6');
      if (await tocca(F + '[data-az="scegli-mappa-a"]', 'scegli sulla mappa') && await tocca('[data-az="posa-ok"]', 'conferma del punto')) {
        await pausa(300);
        await tocca(F + '[data-az="a-pubblica"]', 'tieni nell\'importazione');
        await aspetta(/Pronte · 2[\s\S]*Riga 6 · Evento inventato del file 5/, 'riga 6 tornata tra le pronte');
        if (/Indirizzi non trovati/.test(await testo())) err('dopo il punto messo a mano l\'elenco degli indirizzi non trovati deve essere vuoto');
      }
    }

    /* 4 */
    await tocca(F + '[data-az="ix-chiudi"]', 'chiudi'); await aspetta(/non sono pubblicate e andranno perse/, 'avviso prima di chiudere');
    await tocca(F + '[data-az="ix-chiudi"]', 'chiudi davvero');
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(300);
    if (await tocca('#badgeRed', 'strumenti')) {
      try {
        const [d] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), p.locator(F + '[data-az="admin-modello"]').first().click()]);
        const m = await X.leggi(fs.readFileSync(await d.path()), d.suggestedFilename()), ev = m.fogli.find(x => x.nome === 'Eventi');
        if (!ev || ev.righe.length !== 1 || !['Titolo', 'Luogo', 'Come arrivare', 'Fonte', 'Fonte (codice FS)', 'Dieci domande', 'Evento politico o religioso'].every(k => ev.righe[0].includes(k))) err('modello: intestazioni inattese o righe d\'esempio (' + JSON.stringify(ev && ev.righe).slice(0, 200) + ')');
        if (ev && ['Immagine', 'Password', 'Nascosto'].some(k => ev.righe[0].includes(k))) err('modello: non deve avere le colonne da lasciare vuote');
      } catch (x) { err('modello: non si scarica (' + x.message + ')'); }
    }
    e.note.push('dieci righe: 3 pronte, 4 da sistemare, 1 indirizzo non trovato, 2 rifiutate; pubblicate le 2 righe segnate con F-00001 e F-00002 in un solo pacchetto; punto messo a mano e riga tornata tra le pronte; modello con le colonne del 13/11');
  } finally { await browser.close(); await s.chiudi(); }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
