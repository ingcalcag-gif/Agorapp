/* Prova nel browser: i calendari aperti dei Comuni (voce T-044 del piano di adeguamento; libro mastro § 2.2, canale 3;
   § 6.4; § 6.6; cap. 22), nell'app della redazione, con lo sportello di prova, chiavi create al momento e soli calendari
   inventati.

   1. L'importazione resta chiusa finché la fonte non ha tutti e sette i punti del § 6.4; con una licenza a condivisione
      alle stesse condizioni resta chiusa sempre.
   2. Un calendario inventato in CSV: la corrispondenza delle colonne si propone dai nomi; gli eventi già finiti e quelli
      senza ora restano fuori; le righe arrivano nell'anteprima con l'attribuzione chiesta dalla licenza nel campo
      «Fonte:» e restano da sistemare finché la descrizione del Comune non si riscrive (la scheda la mostra come testo
      di riferimento); due righe riscritte e segnate si pubblicano con il canale «calendario».
   3. Un aggiornamento dello stesso calendario: l'evento cambiato torna come correzione (stesso identificativo, stesso
      codice F); quello che il Comune ha tolto si elenca «da ritirare» e si ritira dalla sua scheda.
   4. Un calendario iCalendar (ora in tempo universale portata all'ora italiana, righe ripiegate, evento annullato,
      evento di tutto il giorno) e uno JSON con i campi annidati e una colonna scelta a mano. */
'use strict';
const { esito, eseguiDaSola } = require('../comune.js');
const { playwright, server, apri, giorno, pausa, archivio, eventoProva } = require('./comune.js');

const FRASE = 'una frase inventata per la prova';
const ATTR = 'Comune Inventato, dati aperti (CC BY 4.0)';
const DESC = 'Una descrizione inventata, riscritta con parole proprie per la prova.';
/* il calendario CSV inventato del Comune; con «aggiornato» il secondo invio: A tolto, B con l'ora cambiata, D nuovo */
function csv(aggiornato) {
  const r = (id, t, g, a, b, ds) => [id, t, g, a, b, 'Sala civica inventata', 'Via Inventata 5, Torino', '45.0703', '7.6869', ds || 'Testo del Comune inventato su ' + t + '.', 'https://comune-inventato.example/eventi/' + id, 'Concerti'].join(';');
  const righe = ['ID;Titolo;Data inizio;Ora inizio;Ora fine;Luogo;Indirizzo;Latitudine;Longitudine;Descrizione;Link;Categoria'];
  if (!aggiornato) righe.push(r('A', 'Concerto inventato A', giorno(5), '18:00', '20:00'));
  righe.push(r('B', 'Concerto inventato B', giorno(6), aggiornato ? '21:00' : '18:00', aggiornato ? '23:00' : '20:00'), r('C', 'Concerto inventato C', giorno(7), '18:00', '20:00'),
    r('P', 'Concerto inventato già passato', giorno(-4), '18:00', '20:00'), r('T', 'Mostra inventata di tutto il giorno', giorno(8), '', ''));
  if (aggiornato) righe.push(r('D', 'Concerto inventato D', giorno(9), '18:00', '20:00'));
  return Buffer.from(righe.join('\n'));
}
const aaaammgg = g => g.replace(/-/g, '');
function ics() {
  const g = aaaammgg(giorno(6));
  return Buffer.from(['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Comune Inventato//Prova//IT',
    'BEGIN:VEVENT', 'UID:ics-uno@comune-inventato.example', 'DTSTART:' + g + 'T173000Z', 'DTEND:' + g + 'T193000Z', 'SUMMARY:Lettura inventata in biblioteca',
    'LOCATION:Biblioteca inventata\\, Via Inventata 9\\, Torino', 'GEO:45.0712;7.6851', 'URL:https://comune-inventato.example/ics/uno',
    'DESCRIPTION:Prima riga del testo inventato\\nseconda riga che continua', '  su una riga ripiegata.', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:ics-due@comune-inventato.example', 'DTSTART;TZID=Europe/Rome:' + g + 'T210000', 'SUMMARY:Proiezione inventata', 'LOCATION:Cortile inventato', 'GEO:45.0703;7.6869', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:ics-tre@comune-inventato.example', 'DTSTART;VALUE=DATE:' + g, 'SUMMARY:Festa inventata di tutto il giorno', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:ics-quattro@comune-inventato.example', 'DTSTART:' + g + 'T160000Z', 'SUMMARY:Incontro inventato annullato', 'STATUS:CANCELLED', 'GEO:45.07;7.68', 'END:VEVENT',
    'END:VCALENDAR'].join('\r\n'));
}
function json() {
  return Buffer.from(JSON.stringify({ aggiornato: giorno(0), eventi: [
    { id: 'j1', titolo: 'Laboratorio inventato dal JSON', quando: { inizio: giorno(7) + 'T15:00:00Z' }, luogo: { nome: 'Officina inventata', indirizzo: 'Via Inventata 3, Torino' }, geo: { lat: 45.0703, lng: 7.6869 } }] }));
}
const oraIt = (g, hhmm) => new Date(g + 'T' + hhmm + ':00Z').toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hour12: false });

async function prova() {
  const e = esito('Calendari aperti dei Comuni: sette punti, licenze, anteprima con l\'attribuzione, aggiornamenti (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const err = x => e.errori.push(x);
  const F = '#foglio-slot ';
  const s = await server('redazione'), { browser, ctx } = await apri(pw, { dl_guida: '1' });
  try {
    await archivio(ctx, [eventoProva('calprima', { titolo: 'Evento dell’archivio di prima' })]);
    const p = await ctx.newPage();
    p.on('pageerror', y => err('errore nella pagina: ' + y.message));
    const tocca = async (sel, dove) => { const l = p.locator(sel).first(); if (!(await l.count())) { err(`${dove}: non trovo ${sel}`); return false; }
      try { await l.click({ timeout: 15000 }); } catch (x) { err(`${dove}: non riesco a toccare ${sel}`); return false; } await pausa(300); return true; };
    const testo = () => p.locator(F).innerText().catch(() => '');
    const aspetta = async (re, dove, ms = 25000) => { try { await p.waitForFunction(r => new RegExp(r, 'i').test((document.querySelector('#foglio-slot') || {}).innerText || ''), re.source, { timeout: ms }); return true; } catch (x) { err(dove + ': atteso «' + re.source + '», trovato «' + (await testo()).replace(/\s+/g, ' ').slice(0, 400) + '»'); return false; } };
    const scegli = async (sel, v, dove) => { try { await p.selectOption(sel, v, { timeout: 10000 }); await pausa(250); } catch (x) { err(`${dove}: non trovo il menu ${sel}`); } };
    const scrivi = async (sel, v, dove) => { try { await p.fill(sel, v, { timeout: 10000 }); } catch (x) { err(`${dove}: non trovo il campo ${sel}`); } };
    const apriPb = async () => { await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(300); return await tocca('#badgeRed', 'strumenti') && await tocca(F + '[data-az="pubblica"]', 'pubblicazione'); };
    const calendari = async fonte => { if (!(await apriPb()) || !(await tocca(F + '[data-az="pb-calendari"]', 'calendari dei Comuni'))) return false; await pausa(400); if (fonte) await scegli('#cal-fonte', fonte, 'fonte del calendario'); return true; };
    const fonteCal = async (nome, licenza, punti) => {
      await tocca(F + '[data-az="pb-fonte-nuova"]', 'nuova fonte'); await scrivi('#fo-nome', nome, 'nuova fonte'); await scegli('#fo-tipo', 'calendario', 'tipo');
      await scrivi('#fo-indirizzo', 'https://comune-inventato.example/eventi', 'indirizzo'); await scegli('#fo-esito', 'attribuzione', 'esito'); await scegli('#fo-lictipo', licenza, 'licenza');
      await scrivi('#fo-licenza', 'CC BY 4.0', 'nome della licenza'); await scrivi('#fo-attr', ATTR, 'attribuzione');
      for (const n of punti) await scrivi('#fo-p' + n, giorno(-1), 'punto ' + n);
      await tocca(F + '[data-az="pb-fonte-salva"]', 'salva la fonte'); };
    const segnaEPubblica = async (righe, msg) => { for (const r of righe) await tocca(F + `[data-az="ix-vista"][data-r="${r}"]`, 'segno della riga ' + r); await tocca(F + '[data-az="ix-pubblica"]', 'pubblica le righe segnate'); await aspetta(msg, 'pubblicazione delle righe segnate'); };
    const riscrivi = async r => { if (!(await tocca(F + `[data-az="ix-correggi"][data-r="${r}"]`, 'correggi la riga ' + r))) return;
      await aspetta(/Il testo del calendario del Comune: da riscrivere/, 'scheda della riga ' + r + ': testo del Comune da riscrivere');
      if ((await p.inputValue('#a-fonte').catch(() => '')) !== ATTR) err('riga ' + r + ': nel campo «Fonte» deve esserci l\'attribuzione chiesta dalla licenza');
      if ((await p.inputValue('#a-desc').catch(() => 'x')) !== '') err('riga ' + r + ': la descrizione del Comune non deve entrare nella descrizione dell\'evento');
      await scrivi('#a-desc', DESC, 'descrizione riscritta'); await pausa(300); await tocca(F + '[data-az="a-pubblica"]', 'tieni nell\'importazione'); };
    const sportello = () => p.evaluate(async () => { const c = await caches.open('prova_sportello'), out = {};
      for (const r of await c.keys()) { if (/riservato\/stato\.json$/.test(r.url)) out.stato = JSON.parse(await (await c.match(r)).text()); if (/riservato\/registro\/codici\.json$/.test(r.url)) out.codici = JSON.parse(await (await c.match(r)).text()); }
      return out; });

    /* chiavi e sportello di prova */
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(400);
    if (!(await tocca('#badgeRed', 'strumenti')) || !(await tocca(F + '[data-az="chiavi"]', 'chiavi'))) return e;
    await pausa(400); await p.fill('#ch-nome', 'Portatile di prova'); await p.fill('#ch-frase', FRASE); await p.fill('#ch-ripeti', FRASE);
    await tocca(F + '[data-az="chiavi-crea"]', 'chiavi, crea');
    try { await p.waitForSelector(F + '[data-az="chiavi-copia"]', { timeout: 20000 }); } catch (x) { err('le chiavi non si creano'); return e; }
    if (!(await apriPb())) return e;
    await tocca(F + '[data-az="pb-consegna"]', 'consegna delle chiavi'); await aspetta(/accetta la firma di questo dispositivo/, 'chiavi consegnate');

    /* 1 */
    await tocca(F + '[data-az="pb-registro"]', 'registro delle fonti'); await tocca(F + '[data-az="pb-fonti"]', 'fonti');
    await fonteCal('Comune Inventato, calendario degli eventi', 'aperta', [1, 2, 3, 4, 5]); await aspetta(/FS-0001 · Comune Inventato/, 'fonte FS-0001');
    await fonteCal('Comune Inventato Due, calendario', 'condivisione', [1, 2, 3, 4, 5, 6, 7]); await aspetta(/FS-0002 · Comune Inventato Due/, 'fonte FS-0002');
    await calendari('FS-0001'); await aspetta(/L’importazione è chiusa[\s\S]*la data dei punti 6, 7 dei sette/, 'fonte senza i punti 6 e 7');
    if (!(await p.locator(F + '[data-az="cal-file"]').isDisabled())) err('senza i sette punti «Scegli il file del calendario» deve essere spento');
    await scegli('#cal-fonte', 'FS-0002', 'fonte a condivisione'); await aspetta(/condividere alle stesse condizioni: questo calendario non si importa in blocco/, 'licenza a condivisione alle stesse condizioni');
    await scegli('#cal-fonte', 'FS-0001', 'di nuovo FS-0001'); await tocca(F + '[data-pbfonte="FS-0001"]', 'apri la fonte dal calendario');
    await scrivi('#fo-p6', giorno(-1), 'punto 6'); await scrivi('#fo-p7', giorno(-1), 'punto 7'); await tocca(F + '[data-az="pb-fonte-salva"]', 'salva i sette punti');
    await calendari('FS-0001'); await aspetta(/Nel campo «Fonte:» di ogni evento: «Comune Inventato, dati aperti \(CC BY 4\.0\)»/, 'importazione aperta, con l\'attribuzione');

    /* 2 */
    await p.setInputFiles('#fileRegistro', { name: 'calendario-inventato.csv', mimeType: 'text/csv', buffer: csv(false) });
    await aspetta(/5 eventi nel file/, 'calendario letto');
    for (const [k, c] of [['titolo', 'Titolo'], ['inizio', 'Data inizio'], ['oraInizio', 'Ora inizio'], ['oraFine', 'Ora fine'], ['luogo', 'Luogo'], ['indirizzo', 'Indirizzo'], ['lat', 'Latitudine'], ['lng', 'Longitudine'], ['testo', 'Descrizione'], ['link', 'Link'], ['strato', 'Categoria'], ['chiave', 'ID']])
      if ((await p.inputValue('#cal-m-' + k).catch(() => '')) !== c) err('corrispondenza proposta: per «' + k + '» attesa la colonna «' + c + '», trovata «' + (await p.inputValue('#cal-m-' + k).catch(() => '')) + '»');
    if (!(await p.locator(F + '[data-az="cal-anteprima"]').isDisabled())) err('«Passa all\'anteprima» deve restare spento finché non si scelgono strato, dieci domande, nomi, evento politico e avviso');
    await scegli('#cal-strato', 'musica', 'strato'); await scegli('#cal-dieci', 'tutte', 'dieci domande'); await scegli('#cal-nomi', 'no', 'nomi'); await scegli('#cal-politico', 'no', 'politico'); await scegli('#cal-avviso', 'nessuno', 'avviso');
    await tocca(F + '[data-az="cal-anteprima"]', 'passa all\'anteprima');
    await aspetta(/Calendario del Comune[\s\S]*Da sistemare · 3[\s\S]*Non entrano nell’anteprima: 1 eventi già finiti, 1 eventi senza l’ora di inizio/, 'anteprima del calendario');
    if (!/Riga 1 · Concerto inventato A[\s\S]{0,200}Descrizione/.test(await testo())) err('anteprima: la riga senza descrizione riscritta deve essere da sistemare per la descrizione');
    await riscrivi(1); await riscrivi(2);
    await aspetta(/Pronte · 2[\s\S]*Da sistemare · 1/, 'due righe riscritte, pronte');
    if (!/Comune Inventato, dati aperti \(CC BY 4\.0\)/.test(await p.locator(F + '.ix-dati').first().textContent().catch(() => ''))) err('anteprima: la fonte della riga pronta deve essere l\'attribuzione');
    await segnaEPubblica([1, 2], /Pubblicate 2 righe/);
    let sp = await sportello();
    const A = ((sp.stato || {}).eventi || []).find(x => x.titolo === 'Concerto inventato A'), B = ((sp.stato || {}).eventi || []).find(x => x.titolo === 'Concerto inventato B');
    if (!A || !B || A.fonte.testo !== ATTR || A.fonte.collegamento !== 'https://comune-inventato.example/eventi/A' || A.descrizione !== DESC || A.strato !== 'musica') err('sportello: gli eventi A e B devono essere pubblicati con l\'attribuzione, il collegamento, la descrizione riscritta e lo strato scelto: ' + JSON.stringify(A).slice(0, 300));
    if (Object.values((sp.codici || {}).codici || {}).sort().join() !== 'F-00001,F-00002') err('sportello: attesi i codici F-00001 e F-00002: ' + JSON.stringify(sp.codici));

    /* 3 */
    await tocca(F + '[data-az="ix-chiudi"]', 'chiudi'); await tocca(F + '[data-az="ix-chiudi"]', 'chiudi davvero');
    await calendari('FS-0001');
    await p.setInputFiles('#fileRegistro', { name: 'calendario-inventato-2.csv', mimeType: 'text/csv', buffer: csv(true) });
    await aspetta(/5 eventi nel file/, 'calendario aggiornato letto');
    if ((await p.inputValue('#cal-m-titolo').catch(() => '')) !== 'Titolo') err('aggiornamento: la corrispondenza delle colonne deve essere quella salvata per la fonte');
    await scegli('#cal-strato', 'musica', 'strato'); await scegli('#cal-dieci', 'tutte', 'dieci domande'); await scegli('#cal-nomi', 'no', 'nomi'); await scegli('#cal-politico', 'no', 'politico'); await scegli('#cal-avviso', 'nessuno', 'avviso');
    await tocca(F + '[data-az="cal-anteprima"]', 'anteprima dell\'aggiornamento');
    await aspetta(/Pronte · 1[\s\S]*Riga 1 · Concerto inventato B · correzione[\s\S]*Da sistemare · 2[\s\S]*Tolti dal Comune: da ritirare · 1[\s\S]*Concerto inventato A/, 'aggiornamento: B da correggere, C e D da sistemare, A da ritirare');
    await segnaEPubblica([1], /Pubblicata 1 riga/);
    sp = await sportello();
    const B2 = ((sp.stato || {}).eventi || []).find(x => x.id === (B || {}).id);
    if (!B2 || !/T21:00$/.test(B2.inizio) || B2.descrizione !== DESC) err('aggiornamento: B deve essere corretto (stesso identificativo, ora nuova, descrizione già riscritta): ' + JSON.stringify(B2).slice(0, 200));
    if (Object.keys((sp.codici || {}).codici || {}).length !== 2) err('aggiornamento: la correzione tiene il suo codice F, nessun codice nuovo');
    if (await tocca(F + '[data-pbev]', 'evento tolto dal Comune')) {
      await aspetta(/Concerto inventato A/, 'scheda dell\'evento tolto');
      await tocca(F + '[data-az="pb-ritira"]', 'ritira'); await scegli('#pb-motivo', 'annullato', 'motivo del ritiro'); await tocca(F + '[data-az="pb-ritira-ok"]', 'ritira l\'evento');
      await aspetta(/Ritirato alle/, 'evento tolto dal Comune ritirato');
      sp = await sportello(); if (((sp.stato || {}).eventi || []).some(x => x.titolo === 'Concerto inventato A')) err('l\'evento tolto dal Comune doveva essere ritirato');
    }

    /* 4: iCalendar e JSON, da un'altra fonte */
    if (await apriPb()) { await tocca(F + '[data-az="pb-registro"]', 'registro'); await tocca(F + '[data-az="pb-fonti"]', 'fonti');
      await fonteCal('Comune Inventato Tre, calendario', 'nessuna', [1, 2, 3, 4, 5, 6, 7]); await aspetta(/FS-0003 · Comune Inventato Tre/, 'fonte FS-0003'); }
    await calendari('FS-0003');
    await p.setInputFiles('#fileRegistro', { name: 'calendario-inventato.ics', mimeType: 'text/calendar', buffer: ics() });
    await aspetta(/4 eventi nel file[\s\S]*File iCalendar/, 'calendario iCalendar letto');
    await scegli('#cal-strato', 'conferenze', 'strato'); await scegli('#cal-dieci', 'tutte', 'dieci'); await scegli('#cal-nomi', 'no', 'nomi'); await scegli('#cal-politico', 'no', 'politico'); await scegli('#cal-avviso', 'nessuno', 'avviso');
    await tocca(F + '[data-az="cal-anteprima"]', 'anteprima iCalendar');
    await aspetta(/Da sistemare · 2[\s\S]*1 eventi senza l’ora di inizio/, 'anteprima iCalendar: due righe, l\'annullato e quello di tutto il giorno fuori');
    const t4 = await testo(), ore = oraIt(giorno(6), '17:30');
    if (!new RegExp('Lettura inventata in biblioteca').test(t4) || /annullato/.test(t4)) err('iCalendar: righe inattese');
    if (await tocca(F + '[data-az="ix-correggi"][data-r="1"]', 'riga iCalendar')) {
      if ((await p.inputValue('#a-inizio').catch(() => '')) !== giorno(6) + 'T' + ore) err('iCalendar: l\'ora in tempo universale deve diventare ora italiana (' + ore + '), trovata ' + (await p.inputValue('#a-inizio').catch(() => '')));
      if (!/Prima riga del testo inventato\s+seconda riga che continua su una riga ripiegata\./.test(await testo())) err('iCalendar: il testo del Comune con a capo e righe ripiegate non si legge come atteso');
      if ((await p.inputValue('#a-luogo').catch(() => '')) !== 'Biblioteca inventata, Via Inventata 9, Torino') err('iCalendar: luogo inatteso «' + (await p.inputValue('#a-luogo').catch(() => '')) + '»');
      await tocca(F + '[data-az="ix-torna"]', 'torna all\'anteprima');
    }
    if (await tocca(F + '[data-az="ix-correggi"][data-r="2"]', 'seconda riga iCalendar')) {
      if ((await p.inputValue('#a-inizio').catch(() => '')) !== giorno(6) + 'T21:00') err('iCalendar: con TZID=Europe/Rome l\'ora resta quella scritta');
      await tocca(F + '[data-az="ix-torna"]', 'torna all\'anteprima');
    }
    await tocca(F + '[data-az="ix-chiudi"]', 'chiudi'); await tocca(F + '[data-az="ix-chiudi"]', 'chiudi davvero');
    await calendari('FS-0003');
    await p.setInputFiles('#fileRegistro', { name: 'calendario-inventato.json', mimeType: 'application/json', buffer: json() });
    await aspetta(/1 eventi nel file/, 'calendario JSON letto');
    if ((await p.inputValue('#cal-m-inizio').catch(() => '')) !== 'quando.inizio' || (await p.inputValue('#cal-m-indirizzo').catch(() => '')) !== 'luogo.indirizzo' || (await p.inputValue('#cal-m-lat').catch(() => '')) !== 'geo.lat') err('JSON: i campi annidati devono essere proposti con il loro nome («quando.inizio», «luogo.indirizzo», «geo.lat»)');
    await scegli('#cal-m-luogo', 'luogo.nome', 'colonna del luogo scelta a mano');
    await scegli('#cal-strato', 'laboratori', 'strato'); await scegli('#cal-dieci', 'riga', 'dieci'); await scegli('#cal-nomi', 'no', 'nomi'); await scegli('#cal-politico', 'no', 'politico'); await scegli('#cal-avviso', 'nessuno', 'avviso');
    await tocca(F + '[data-az="cal-anteprima"]', 'anteprima JSON');
    await aspetta(/Da sistemare · 1[\s\S]*Riga 1 · Laboratorio inventato dal JSON[\s\S]{0,300}dieci domande/, 'anteprima JSON: le dieci domande si rispondono nella scheda');
    if (await tocca(F + '[data-az="ix-correggi"][data-r="1"]', 'riga JSON')) {
      if ((await p.inputValue('#a-luogo').catch(() => '')) !== 'Officina inventata' || (await p.inputValue('#a-inizio').catch(() => '')) !== giorno(7) + 'T' + oraIt(giorno(7), '15:00')) err('JSON: luogo o inizio inattesi');
    }
    e.note.push('importazione chiusa senza i sette punti e con la licenza a condivisione; CSV: corrispondenza proposta, 1 evento finito e 1 senza ora fuori, 2 righe riscritte e pubblicate con l\'attribuzione; aggiornamento: 1 correzione con lo stesso codice F, 1 evento tolto dal Comune ritirato; iCalendar e JSON letti');
  } catch (x) { err('la prova si è interrotta: ' + (x && x.message)); } finally { await browser.close(); await s.chiudi(); }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
