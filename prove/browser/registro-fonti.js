/* Prova nel browser: il registro delle fonti scritto dall'app (voce T-043 del piano di adeguamento; libro mastro cap. 22,
   regole 3, 4 e 5, foglio «Non pubblicati»; § 18.4), nell'app della redazione, con lo sportello di prova, chiavi create al
   momento e soli testi inventati. Il file del registro «tenuto a mano» è costruito qui, con l'impianto del modello del
   13/11/2026 (titolo, sottotitolo, intestazioni alla riga 4, riga «ESEMPIO»).

   1. Importazione del registro tenuto a mano: la fonte che c'è già resta com'è, entrano una fonte nuova (un calendario
      in dati aperti, con la licenza e i sette punti), tre righe degli eventi con i loro codici F e un «Non pubblicato».
   2. Si pubblicano tre eventi: uno dalla scheda, due dal file degli eventi. Lo sportello dà i codici dopo quelli scritti
      a mano (F-00004, F-00005, F-00006: registroDa). Le buste nel riservato dello sportello non si leggono in chiaro.
   3. «Non pubblicati»: una riga nuova prende NP-0002; corretta, la correzione resta nella colonna «Rettifiche».
   4. Esportazione: i sette fogli nell'ordine del modello; nei fogli «Fonti», «Eventi» e «Non pubblicati» le
      intestazioni alla riga 4, con le colonne e l'ordine del cap. 22; le tre righe pubblicate con le colonne di fatto e
      di giudizio; le righe scritte a mano com'erano; date come date; scadenza a cinque anni; riepilogo dell'anno.
   5. Confronto con lo sportello: un evento pubblicato senza la riga (portato dall'archivio di prova) risulta tra i
      «pubblicati senza una riga»; le tre righe pubblicate corrispondono.
   6. Un secondo dispositivo (qui: lo stesso, con il registro tolto e le stesse chiavi) riprende dallo sportello righe,
      fonti e «Non pubblicati» (quelli arrivati allo sportello con una pubblicazione). */
'use strict';
const path = require('path');
const fs = require('fs');
const { esito, eseguiDaSola, RADICE } = require('../comune.js');
const { playwright, server, apri, giorno, pausa, archivio, eventoProva, idProva, giudizioProva } = require('./comune.js');
const X = require(path.join(RADICE, 'sorgenti', 'moduli', 'excel.js'));

const FRASE = 'una frase inventata per la prova';
const TROVATO = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [7.6869, 45.0703] },
  properties: { country: 'Italia', city: 'Torino', postcode: '10100', street: 'Via Inventata', housenumber: '5', type: 'house' } }] };
/* le colonne del cap. 22, come nel modello del 13/11/2026: la prova le scrive da sé, per accorgersi di un ordine cambiato */
const PUNTI = ['Punto 1: pubblicato dal Comune o nel catalogo AgID', 'Punto 2: licenza o assenza di licenza verificata', 'Punto 3: condizioni della licenza rispettate', 'Punto 4: nomi trattati secondo i §§ 3.4-3.6',
  'Punto 5: testi riscritti, nessuna immagine', 'Punto 6: file scaricato dal dispositivo e importato con anteprima', 'Punto 7: aggiornamenti ripassati dalla revisione'];
const FONTI = ['Codice', 'Data di registrazione', 'Funzione che annota', 'Nome della fonte', 'Tipo', 'Grado', 'Indirizzo', 'Persona fisica', 'Condizioni lette il', 'Esito', 'Licenza del calendario',
  'Nome della licenza', 'Attribuzione richiesta', ...PUNTI, 'Prossimo controllo', 'Ultimo evento collegato', 'Rif. libro mastro', 'Collegamenti', 'Stato', 'Contestazione in corso',
  'Scadenza della conservazione', 'Da cancellare al riesame', 'Rettifiche', 'Note'];
const EVENTI = ['Codice', 'Data di registrazione', 'Funzione che annota', 'Data e ora di pubblicazione', "Identificativo dell'evento", 'Titolo (senza nomi di persone)', 'Evento nascosto',
  'Canale di immissione', 'Fonte (codice FS)', 'Grado della fonte', "Fonte diversa dall'organizzatore", "Collegamento alla pagina dell'evento", 'Data di consultazione', 'Funzione che ha consultato',
  'Post leggibile senza account', 'Testo del campo «Fonte:»', 'Dieci domande', 'Domande e correzioni', 'Elementi ripresi', 'Nomi ripresi', 'Evento politico o religioso',
  "Avviso all'organizzatore: data", 'Avviso: canale', 'Prova del consenso (codice C)', 'Ritiro prima della fine: data', 'Motivo del ritiro', 'Rif. libro mastro', 'Collegamenti', 'Stato',
  'Contestazione in corso', 'Scadenza della conservazione', 'Da cancellare al riesame', 'Rettifiche', 'Note'];
const NP = ['Codice', 'Data di registrazione', 'Funzione che annota', 'Data della richiesta', 'Organizzatore (denominazione o codice P)', 'Evento richiesto (senza nomi)', 'Motivo',
  'Motivazione inviata: data', 'Motivazione: canale', 'Rif. libro mastro', 'Collegamenti', 'Stato', 'Data di chiusura', 'Contestazione in corso', 'Scadenza della conservazione',
  'Da cancellare al riesame', 'Rettifiche', 'Note'];
const dt = (g, h) => ({ data: new Date(g + 'T' + (h || '00:00')), ora: !!h });
const riga = (col, v) => col.map(c => v[c] === undefined ? '' : v[c]);
/* il registro tenuto a mano, inventato */
function registroAMano() {
  const titolo = (t, s) => [[t], [s], []];
  const fonti = titolo('Fonti valutate', 'Una riga per sito, pagina o calendario').concat([FONTI,
    riga(FONTI, { Codice: 'ESEMPIO', 'Nome della fonte': 'Associazione di esempio (inventata)' }),
    riga(FONTI, { Codice: 'FS-0001', 'Data di registrazione': dt(giorno(-30)), 'Funzione che annota': 'Redazione eventi', 'Nome della fonte': 'Circolo Inventato, sito', Tipo: "Sito dell'organizzatore", Grado: '2',
      Indirizzo: 'https://circolo-inventato.example/', 'Persona fisica': 'No', 'Condizioni lette il': dt(giorno(-30)), Esito: 'Ammessa', Stato: 'In uso' }),
    riga(FONTI, { Codice: 'FS-0002', 'Data di registrazione': dt(giorno(-25)), 'Funzione che annota': 'Redazione eventi', 'Nome della fonte': 'Comune Inventato, calendario degli eventi', Tipo: 'Calendario in dati aperti', Grado: '3',
      Indirizzo: 'https://comune-inventato.example/eventi.csv', 'Persona fisica': 'No', 'Condizioni lette il': dt(giorno(-25)), Esito: 'Ammessa con attribuzione', 'Licenza del calendario': 'Licenza aperta che consente il riuso',
      'Nome della licenza': 'CC BY 4.0', 'Attribuzione richiesta': 'Comune Inventato, dati aperti (CC BY 4.0)', [PUNTI[0]]: dt(giorno(-25)), [PUNTI[1]]: dt(giorno(-25)), Stato: 'In uso', Note: 'Nota inventata' })]);
  const ev = (n, g) => riga(EVENTI, { Codice: 'F-0000' + n, 'Data di registrazione': dt(g), 'Funzione che annota': 'Redazione eventi', 'Data e ora di pubblicazione': dt(g, '18:30'),
    "Identificativo dell'evento": 'amano' + n + 'aaaaaaaaaaa-provaaaa', 'Titolo (senza nomi di persone)': 'Evento inventato scritto a mano ' + n, 'Evento nascosto': 'No', 'Canale di immissione': 'Evento singolo',
    'Fonte (codice FS)': 'FS-0001', "Collegamento alla pagina dell'evento": 'https://circolo-inventato.example/a-mano-' + n, 'Data di consultazione': dt(g), 'Funzione che ha consultato': 'Redazione eventi',
    'Post leggibile senza account': 'Non pertinente', 'Testo del campo «Fonte:»': 'Circolo Inventato, sito', 'Dieci domande': 'Tutte superate', 'Elementi ripresi': 'Titolo, data, ora, luogo; descrizione riscritta',
    'Nomi ripresi': 'Nessun nome', 'Evento politico o religioso': 'No', 'Avviso: canale': 'Nessun recapito di lavoro noto', 'Rif. libro mastro': '§§ 3.4 e 5.3', Stato: 'Concluso', Note: 'Riga scritta a mano ' + n });
  const eventi = titolo('Eventi pubblicati', 'Una riga per evento').concat([EVENTI, riga(EVENTI, { Codice: 'ESEMPIO' }), ev(1, giorno(-20)), ev(2, giorno(-19)), ev(3, giorno(-18))]);
  const np = titolo('Richieste di pubblicazione non accolte per ragioni di fatto', '§ 7.5').concat([NP, riga(NP, { Codice: 'ESEMPIO' }),
    riga(NP, { Codice: 'NP-0001', 'Data di registrazione': dt(giorno(-10)), 'Funzione che annota': 'Redazione eventi', 'Data della richiesta': dt(giorno(-11)), 'Organizzatore (denominazione o codice P)': 'Associazione Inventata',
      'Evento richiesto (senza nomi)': 'Laboratorio inventato', Motivo: 'Evento non ancora pubblico altrove', 'Motivazione inviata: data': dt(giorno(-10)), 'Motivazione: canale': 'Casella di contatto', Stato: 'Chiusa', 'Data di chiusura': dt(giorno(-10)) })]);
  return Buffer.from(X.scrivi([['Istruzioni', [['Registro delle fonti']]], ['Fonti', fonti, [], { testa: 3 }], ['Eventi', eventi, [], { testa: 3 }], ['Non pubblicati', np, [], { testa: 3 }], ['Valori', [['x']]]]));
}
/* due eventi inventati nel file degli eventi da importare (T-042), con le coordinate: nessuna ricerca degli indirizzi */
function eventiDaImportare() {
  const T = ['Titolo', 'Strato', 'Descrizione', 'Data', 'Ora inizio', 'Ora fine', 'Luogo', 'Indirizzo', 'Latitudine', 'Longitudine', 'Link', 'Fonte', 'Fonte (codice FS)', 'Data di consultazione',
    'Post leggibile senza account', 'Dieci domande', 'Nomi ripresi', 'Evento politico o religioso'];
  const r = n => [`Evento inventato dal file ${n}`, 'Musica', 'Una descrizione inventata, riscritta con parole proprie per la prova.', giorno(5), '18:00', '20:00', 'Sala inventata', 'Via Inventata 5, Torino',
    45.0703, 7.6869, 'https://circolo-inventato.example/file-' + n, 'Circolo Inventato, sito', 'FS-0001', giorno(-1), 'Non pertinente', 'Tutte superate', 'Nessun nome', 'No'];
  return Buffer.from(X.scrivi([['Eventi', [T, r(1), r(2)]]]));
}

async function prova() {
  const e = esito('Registro delle fonti: importazione del registro a mano, esportazione, «Non pubblicati», confronto con lo sportello (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const err = x => e.errori.push(x);
  const F = '#foglio-slot ';
  const s = await server('redazione'), { browser, ctx } = await apri(pw, { dl_guida: '1' });
  try {
    await archivio(ctx, [eventoProva('regprima', { titolo: 'Evento inventato senza riga' })]);
    await ctx.route(u => u.hostname === 'photon.komoot.io', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(TROVATO) }));
    const p = await ctx.newPage();
    p.on('pageerror', y => err('errore nella pagina: ' + y.message));
    const tocca = async (sel, dove) => { const l = p.locator(sel).first(); if (!(await l.count())) { err(`${dove}: non trovo ${sel}`); return false; }
      try { await l.click({ timeout: 15000 }); } catch (x) { err(`${dove}: non riesco a toccare ${sel}`); return false; } await pausa(300); return true; };
    const testo = () => p.locator(F).innerText().catch(() => '');
    const aspetta = async (re, dove, ms = 25000) => { try { await p.waitForFunction(r => new RegExp(r, 'i').test((document.querySelector('#foglio-slot') || {}).innerText || ''), re.source, { timeout: ms }); return true; } catch (x) { err(dove + ': atteso «' + re.source + '», trovato «' + (await testo()).replace(/\s+/g, ' ').slice(0, 400) + '»'); return false; } };
    /* scelta in un menu o testo in un campo: se il campo non c'è, l'errore si annota e la prova va avanti */
    const scegli = async (sel, v, dove) => { try { await p.selectOption(sel, v, { timeout: 10000 }); await pausa(200); } catch (x) { err(`${dove}: non trovo il menu ${sel} («${(await testo()).replace(/\s+/g, ' ').slice(0, 200)}»)`); } };
    const scrivi = async (sel, v, dove) => { try { await p.fill(sel, v, { timeout: 10000 }); } catch (x) { err(`${dove}: non trovo il campo ${sel}`); } };
    const apriPb = async () => { await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(300); return await tocca('#badgeRed', 'strumenti') && await tocca(F + '[data-az="pubblica"]', 'pubblicazione'); };
    const apriRegistro = async () => await apriPb() && await tocca(F + '[data-az="pb-registro"]', 'registro delle fonti') && await aspetta(/Sul dispositivo: \d+ righe degli eventi/, 'registro delle fonti');
    const scarica = async (sel, dove) => { try { const [d] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), p.locator(sel).first().click()]); return { nome: d.suggestedFilename(), dati: fs.readFileSync(await d.path()) }; } catch (x) { err(dove + ': non si scarica (' + x.message + ')'); return null; } };

    /* chiavi, sportello di prova, fonte FS-0001 dal registro */
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(400);
    if (!(await tocca('#badgeRed', 'strumenti')) || !(await tocca(F + '[data-az="chiavi"]', 'chiavi'))) return e;
    await pausa(400); await p.fill('#ch-nome', 'Portatile di prova'); await p.fill('#ch-frase', FRASE); await p.fill('#ch-ripeti', FRASE);
    await tocca(F + '[data-az="chiavi-crea"]', 'chiavi, crea');
    try { await p.waitForSelector(F + '[data-az="chiavi-copia"]', { timeout: 20000 }); } catch (x) { err('le chiavi non si creano'); return e; }
    if (!(await apriPb())) return e;
    await tocca(F + '[data-az="pb-consegna"]', 'consegna delle chiavi'); await aspetta(/accetta la firma di questo dispositivo/, 'chiavi consegnate');
    await tocca(F + '[data-az="pb-registro"]', 'registro delle fonti'); await aspetta(/Sul dispositivo: 0 righe degli eventi, 0 fonti, 0 richieste/, 'registro vuoto');
    await tocca(F + '[data-az="pb-fonti"]', 'fonti'); await tocca(F + '[data-az="pb-fonte-nuova"]', 'nuova fonte');
    await p.fill('#fo-nome', 'Circolo Inventato, sito'); await p.selectOption('#fo-tipo', 'sito'); await p.fill('#fo-indirizzo', 'https://circolo-inventato.example/'); await p.selectOption('#fo-esito', 'ammessa');
    await tocca(F + '[data-az="pb-fonte-salva"]', 'salva la fonte'); await aspetta(/FS-0001 · Circolo Inventato/, 'fonte FS-0001');
    /* un calendario in dati aperti chiede la licenza e mostra i sette punti */
    await tocca(F + '[data-az="pb-fonte-nuova"]', 'nuova fonte, calendario'); await p.selectOption('#fo-tipo', 'calendario'); await pausa(300);
    if ((await p.locator(F + '[data-fpunto]').count()) !== 7) err('fonte di tipo calendario: attesi i sette punti del § 6.4');
    await p.fill('#fo-nome', 'Calendario da scartare'); await p.fill('#fo-indirizzo', 'https://comune-inventato.example/'); await p.selectOption('#fo-esito', 'ammessa');
    await tocca(F + '[data-az="pb-fonte-salva"]', 'calendario senza licenza'); await aspetta(/Licenza del calendario: scegline una/, 'calendario senza licenza rifiutato');
    await tocca(F + '[data-az="pb-fonti"]', 'annulla il calendario');

    /* 1 */
    await tocca(F + '[data-az="pb-registro"]', 'torna al registro');
    await p.setInputFiles('#fileRegistro', { name: 'registro-inventato.xlsx', mimeType: X.MIME, buffer: registroAMano() });
    await aspetta(/Nel file: 2 fonti, 3 righe degli eventi, 1 non pubblicati[\s\S]*Da importare[\s\S]*1 fonti[\s\S]*3 righe degli eventi[\s\S]*1 non pubblicati[\s\S]*Già sul dispositivo[\s\S]*1 fonti/, 'anteprima del registro a mano');
    await tocca(F + '[data-az="rx-importa-ok"]', 'importa il registro');
    await aspetta(/Importate 5 voci del registro tenuto a mano[\s\S]*3 righe degli eventi, 2 fonti, 1 richieste non pubblicate[\s\S]*6 voci partiranno per lo sportello/, 'registro a mano importato');

    /* 2: un evento dalla scheda e due dal file degli eventi */
    if (!(await apriPb()) || !(await tocca(F + '[data-az="pb-nuovo"]', 'nuovo evento'))) return e;
    await p.fill('#a-titolo', 'Evento inventato della scheda'); await p.selectOption('#a-strato', 'musica');
    await p.fill('#a-inizio', giorno(4) + 'T18:00'); await p.fill('#a-fine', giorno(4) + 'T20:00'); await p.fill('#a-luogo', 'Sala inventata');
    await p.fill('#a-desc', 'Una descrizione inventata, riscritta con parole proprie per la prova.');
    await p.fill('#a-indirizzo', 'Via Inventata 5, Torino'); await pausa(1300); await tocca('#a-sugg [data-si="0"]', 'suggerimento dell\'indirizzo');
    await giudizioProva(p); await pausa(300);
    await tocca(F + '[data-az="a-pubblica"]', 'pubblica');
    await aspetta(/Riga F-00004 nel registro delle fonti/, 'il primo codice dopo quelli scritti a mano');
    await p.setInputFiles('#fileImporta', { name: 'eventi-inventati.xlsx', mimeType: X.MIME, buffer: eventiDaImportare() });
    await aspetta(/Pronte · 2/, 'due righe pronte nel file degli eventi', 40000);
    await tocca(F + '[data-az="ix-vista"][data-r="2"]', 'segno della riga 2'); await tocca(F + '[data-az="ix-vista"][data-r="3"]', 'segno della riga 3');
    await tocca(F + '[data-az="ix-pubblica"]', 'pubblica le righe segnate'); await aspetta(/Pubblicate 2 righe/, 'due righe pubblicate dal file');
    await tocca(F + '[data-az="ix-chiudi"]', 'chiudi l\'importazione');
    await tocca(F + '[data-az="pb-venti"]', 'evento dall\'archivio di prova, senza riga'); await aspetta(/Portati 1 eventi inventati/, 'evento senza riga pubblicato');
    const allo = await p.evaluate(async () => { const c = await caches.open('prova_sportello'), out = { righe: [], codici: null };
      for (const r of await c.keys()) { if (/riservato\/registro\/righe\//.test(r.url)) out.righe.push(await (await c.match(r)).text()); if (/riservato\/registro\/codici\.json$/.test(r.url)) out.codici = JSON.parse(await (await c.match(r)).text()); }
      return out; });
    const codici = Object.values((allo.codici || {}).codici || {}).sort().join();
    if (codici !== 'F-00004,F-00005,F-00006' || (allo.codici || {}).prossimo !== 7) err('sportello: attesi i codici F-00004, F-00005, F-00006 dopo quelli scritti a mano (' + JSON.stringify(allo.codici) + ')');
    if (allo.righe.length !== 2 || allo.righe.some(t => /Evento inventato|Circolo Inventato|Comune Inventato|Associazione Inventata|FS-0002|NP-0001/.test(t))) err('sportello: le buste del registro devono essere due, illeggibili senza la chiave del registro');

    /* 3 */
    if (!(await apriRegistro())) return e;
    await tocca(F + '[data-az="rx-np"]', 'non pubblicati'); await aspetta(/NP-0001 · Laboratorio inventato/, 'non pubblicato importato');
    await tocca(F + '[data-az="rx-np-nuovo"]', 'nuova richiesta'); await tocca(F + '[data-az="rx-np-salva"]', 'richiesta vuota');
    await aspetta(/Organizzatore: scrivi[\s\S]*Evento richiesto: scrivi[\s\S]*Motivo: scegline uno/, 'richiesta vuota rifiutata');
    await scrivi('#np-org', 'Associazione Inventata Due', 'nuova richiesta'); await scrivi('#np-ev', 'Incontro inventato', 'nuova richiesta'); await scegli('#np-mot', 'contrasto', 'nuova richiesta');
    await tocca(F + '[data-az="rx-np-salva"]', 'salva la richiesta'); await aspetta(/Riga NP-0002 salvata/, 'richiesta NP-0002');
    await tocca(F + '[data-rxnp="NP-0002"]', 'apri NP-0002'); await scegli('#np-mot', 'nonpubblico', 'correzione di NP-0002'); await scrivi('#np-chiusa', giorno(0), 'correzione di NP-0002');
    await tocca(F + '[data-az="rx-np-salva"]', 'correggi NP-0002'); await aspetta(/Riga NP-0002 salvata/, 'richiesta corretta');

    /* 4 */
    await tocca(F + '[data-az="pb-registro"]', 'torna al registro');
    const f = await scarica(F + '[data-az="rx-esporta"]', 'esportazione del registro');
    if (f) {
      if (!/_Reg22_Fonti_esportato_\d{4}-\d{2}-\d{2}\.xlsx$/.test(f.nome)) err('esportazione: nome del file inatteso ' + f.nome);
      const wb = await X.leggi(f.dati, f.nome), foglio = n => (wb.fogli.find(x => x.nome === n) || {}).righe || [];
      if (wb.fogli.map(x => x.nome).join('|') !== 'Istruzioni|Fonti|Eventi|Non pubblicati|Riepilogo|Valori|Versioni') err('esportazione: fogli inattesi ' + wb.fogli.map(x => x.nome).join('|'));
      for (const [n, col] of [['Fonti', FONTI], ['Eventi', EVENTI], ['Non pubblicati', NP]]) if (JSON.stringify(foglio(n)[3]) !== JSON.stringify(col)) err(`esportazione, foglio «${n}»: le intestazioni alla riga 4 non sono le colonne del cap. 22 nell'ordine del modello: ` + JSON.stringify(foglio(n)[3]).slice(0, 300));
      const ev = foglio('Eventi').slice(4), k = c => EVENTI.indexOf(c), oggi = X.numeroData(new Date()), cinque = X.numeroData(new Date(new Date().getFullYear() + 5, new Date().getMonth(), new Date().getDate()));
      if (ev.map(r => r[0]).join() !== 'F-00001,F-00002,F-00003,F-00004,F-00005,F-00006') err('esportazione: righe degli eventi attese F-00001…F-00006, trovate ' + ev.map(r => r[0]).join());
      const app = ev.slice(3, 6);
      for (const r of app) {
        if (typeof r[k('Data e ora di pubblicazione')] !== 'number' || Math.floor(r[k('Data e ora di pubblicazione')]) !== oggi) err('esportazione: data e ora di pubblicazione di ' + r[0] + ' non sono una data di oggi con l\'ora');
        if (r[k('Fonte (codice FS)')] !== 'FS-0001' || r[k('Grado della fonte')] !== '2' || r[k("Fonte diversa dall'organizzatore")] !== 'No' || r[k('Dieci domande')] !== 'Tutte superate' || r[k('Nomi ripresi')] !== 'Nessun nome' ||
          r[k('Avviso: canale')] !== 'Nessun recapito di lavoro noto' || r[k('Evento nascosto')] !== 'No' || r[k('Stato')] !== 'Pubblicato' || r[k('Scadenza della conservazione')] !== cinque || !/^[a-z2-7]{16}-[a-z2-7]{8}$/.test(r[k("Identificativo dell'evento")]))
          err('esportazione: la riga ' + r[0] + ' non ha le colonne attese: ' + JSON.stringify(r).slice(0, 400));
      }
      if (app.map(r => r[k('Canale di immissione')]).join() !== 'Evento singolo,File Excel,File Excel') err('esportazione: canali attesi «Evento singolo», «File Excel», «File Excel»: ' + app.map(r => r[k('Canale di immissione')]).join());
      if ((app[0] || [])[k('Titolo (senza nomi di persone)')] !== 'Evento inventato della scheda' || !/^Titolo, data, ora, luogo; descrizione riscritta$/.test((app[0] || [])[k('Elementi ripresi')])) err('esportazione: titolo o elementi ripresi della riga F-00004 inattesi');
      const mano = ev[0];
      if (mano[k('Note')] !== 'Riga scritta a mano 1' || mano[k('Stato')] !== 'Concluso' || typeof mano[k('Data e ora di pubblicazione')] !== 'number' || Math.abs(mano[k('Data e ora di pubblicazione')] % 1 - 18.5 / 24) > 1e-6) err('esportazione: la riga scritta a mano F-00001 non esce com\'era: ' + JSON.stringify(mano).slice(0, 300));
      const fo = foglio('Fonti').slice(4);
      if (fo.map(r => r[0]).join() !== 'FS-0001,FS-0002') err('esportazione: fonti attese FS-0001 e FS-0002, trovate ' + fo.map(r => r[0]).join());
      const cal = fo[1] || [];
      if (cal[FONTI.indexOf('Tipo')] !== 'Calendario in dati aperti' || cal[FONTI.indexOf('Licenza del calendario')] !== 'Licenza aperta che consente il riuso' || cal[FONTI.indexOf('Nome della licenza')] !== 'CC BY 4.0' ||
        typeof cal[FONTI.indexOf(PUNTI[0])] !== 'number' || cal[FONTI.indexOf(PUNTI[2])] !== '' || cal[FONTI.indexOf('Scadenza della conservazione')] !== 'Durata del servizio' || cal[FONTI.indexOf('Note')] !== 'Nota inventata') err('esportazione: la fonte FS-0002 non ha le colonne attese: ' + JSON.stringify(cal).slice(0, 400));
      if ((fo[0] || [])[FONTI.indexOf('Ultimo evento collegato')] !== oggi) err('esportazione: l\'ultimo evento collegato alla fonte FS-0001 è di oggi');
      const np = foglio('Non pubblicati').slice(4), n2 = np.find(r => r[0] === 'NP-0002') || [];
      if (np.map(r => r[0]).join() !== 'NP-0001,NP-0002' || n2[NP.indexOf('Stato')] !== 'Chiusa' || n2[NP.indexOf('Motivo')] !== 'Evento non ancora pubblico altrove' || n2[NP.indexOf('Organizzatore (denominazione o codice P)')] !== 'Associazione Inventata Due')
        err('esportazione: le richieste non pubblicate non tornano: ' + JSON.stringify(np).slice(0, 400));
      if (!/Motivo: «contrasto» → «nonpubblico»[\s\S]*Chiusura: «» → «\d{4}-\d{2}-\d{2}»/.test(n2[NP.indexOf('Rettifiche')] || '')) err('esportazione: la correzione di NP-0002 deve restare nella colonna «Rettifiche», con quello che c\'era prima: ' + n2[NP.indexOf('Rettifiche')]);
      const rie = foglio('Riepilogo'), val = v => (rie.find(r => r[0] === v) || [])[1];
      const nellAnno = [giorno(-20), giorno(-19), giorno(-18)].filter(g => g.slice(0, 4) === String(new Date().getFullYear())).length + 3;
      if (val('Eventi pubblicati') !== nellAnno || val('da fonti degli organizzatori (gradi 1 e 2)') !== nellAnno || val('Fonti in uso') !== 2) err('esportazione: riepilogo inatteso ' + JSON.stringify(rie.slice(3, 16)));
      if (!/non ha password/.test(foglio('Istruzioni').map(r => r[0]).join(' '))) err('esportazione: le istruzioni devono dire che il file non ha password (§ 18.3)');
      await aspetta(/Registro esportato[\s\S]*non ha password/, 'messaggio dopo l\'esportazione');
    }

    /* 5 */
    await tocca(F + '[data-az="rx-confronta"]', 'confronta con lo sportello'); await tocca(F + '[data-az="rx-confronta-ok"]', 'confronta');
    await aspetta(/secondo lo storico: 4 · righe del registro nel periodo: 3[\s\S]*Pubblicati senza una riga del registro · 1/, 'confronto con lo storico');
    if (!new RegExp(idProva('regprima')).test(await testo())) err('confronto: l\'evento portato dall\'archivio di prova deve risultare senza riga');
    if (/Righe senza un evento pubblicato/.test(await testo())) err('confronto: tutte le righe pubblicate hanno il loro evento nello storico');
    if (!/ci sono già tutte le voci/.test(await testo())) err('confronto: sul dispositivo che ha scritto tutto non deve mancare nulla');

    /* 6: lo stesso dispositivo senza il registro, come un secondo dispositivo con le stesse chiavi */
    await p.evaluate(() => new Promise((ok, no) => { const r = indexedDB.open('red_strumenti'); r.onerror = () => no(r.error);
      r.onsuccess = () => { const t = r.result.transaction('voci', 'readwrite'); t.objectStore('voci').delete('red_registro'); t.oncomplete = () => { r.result.close(); ok(); }; }; }));
    if (!(await apriRegistro())) return e;
    await aspetta(/Sul dispositivo: 0 righe degli eventi, 0 fonti, 0 richieste/, 'registro tolto');
    await tocca(F + '[data-az="rx-confronta"]', 'confronta, secondo dispositivo'); await tocca(F + '[data-az="rx-confronta-ok"]', 'confronta, secondo dispositivo');
    /* NP-0002 è nato dopo l'ultima pubblicazione: allo sportello arriverà con la prossima, e per ora il secondo dispositivo non lo vede */
    await aspetta(/6 righe degli eventi, 2 fonti, 1 non pubblicati/, 'voci da riprendere dallo sportello');
    await tocca(F + '[data-az="rx-riprendi"]', 'riprendi'); await aspetta(/Riprese dallo sportello 9 voci/, 'voci riprese');
    await tocca(F + '[data-az="pb-registro"]', 'torna al registro'); await aspetta(/Sul dispositivo: 6 righe degli eventi, 2 fonti, 1 richieste non pubblicate\./, 'registro ripreso dallo sportello');
    e.note.push('registro a mano importato (1 fonte nuova, 3 righe, 1 non pubblicato); codici F-00004…F-00006 dopo quelli a mano; NP-0002 con la rettifica; esportazione con i 7 fogli e le colonne del cap. 22; confronto: 4 pubblicati, 3 righe, 1 senza riga; secondo dispositivo: 9 voci riprese');
  } catch (x) { err('la prova si è interrotta: ' + (x && x.message)); } finally { await browser.close(); await s.chiudi(); }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
