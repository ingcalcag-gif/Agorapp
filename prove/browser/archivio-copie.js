/* Prova nel browser: l'archivio dei registri e la copia di sicurezza degli eventi (voci T-053 e T-054; libro mastro
   §§ 1.1, 2.4, 3.11, 3.13 passo 4, 18.3, 18.4; documento: docs/archivio.md).

   L'app della redazione si apre con lo sportello di prova; i file da depositare sono quelli inventati di
   prove/dati/archivio/, salvati con una password dai programmi veri; gli eventi sono quelli inventati dell'archivio di
   prova e un evento nascosto inventato.

   1. Chiavi consegnate, eventi inventati portati nello sportello di prova, un evento nascosto pubblicato (con la sua
      fonte: il codice FS lo dà lo sportello dell'archivio). Gli Strumenti ricordano le tre cose da fare.
   2. Archivio: un registro in chiaro, un .xls con il nome di un registro e un nome fuori regola sono rifiutati con il
      motivo, senza il tasto «Deposita»; un registro cifrato scritto con le maiuscole sbagliate si deposita con il nome
      giusto e la cifratura trovata; un allegato PDF cifrato pure; lo stesso nome sostituisce dopo due tocchi; il file
      riscaricato è quello depositato; «Togli» con due tocchi; le buste del registro delle fonti si contano;
      «Scarica tutti i file» dà un archivio ZIP con i file e le buste.
   3. Copia di sicurezza: una frase corta e la frase delle chiavi sono rifiutate; con una frase giusta si scarica un file
      solo, senza testi in chiaro.
   4. Svuotato lo sportello di prova e consegnate di nuovo le chiavi: la frase sbagliata non apre la copia; con quella
      giusta «Copia integra», con i conti e il nascosto che si apre con la cassaforte; «Ripristina in uno sportello vuoto»
      elenca la richiesta di rimozione arrivata dopo la copia e resta spento finché non è ripetuta; poi riporta gli eventi
      e il nascosto; un secondo ripristino nello stesso sportello, non più vuoto, è rifiutato.
   5. Fatte le tre cose, gli Strumenti non le ricordano più; lo storico delle operazioni le ha annotate. */
'use strict';
const fs = require('fs');
const path = require('path');
const { esito, eseguiDaSola, RADICE } = require('../comune.js');
const X = require(path.join(RADICE, 'sorgenti', 'moduli', 'excel.js'));
const { playwright, server, apri, giorno, pausa, archivio, eventoProva, giudizioProva } = require('./comune.js');

const NOME = require(path.join(RADICE, 'sorgenti', 'config.js')).nome;
const TUTTI = Object.fromEntries(['musica', 'arte', 'sport', 'sociale', 'cibo', 'teatro', 'cinema', 'conferenze', 'laboratori', 'manifestazioni', 'mercati', 'benessere', 'volontariato'].map(k => [k, { on: true }]));
const RICERCA = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [7.6869, 45.0703] },
  properties: { country: 'Italia', city: 'Torino', postcode: '10100', street: 'Via Inventata', housenumber: '5', type: 'house' } }] };
const FRASE = 'una frase inventata per la prova';
const FRASE_COPIA = 'un’altra frase inventata per la copia degli eventi';
const DATI = path.join(RADICE, 'prove', 'dati', 'archivio');
const dato = (f, nome, tipo) => ({ name: nome, mimeType: tipo || 'application/octet-stream', buffer: fs.readFileSync(path.join(DATI, f)) });

async function prova() {
  const e = esito('Archivio dei registri e copia di sicurezza degli eventi (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const err = x => e.errori.push(x);
  const F = '#foglio-slot ';
  /* una richiesta di rimozione registrata nelle Misure con un'ora che viene dopo la copia: il ripristino la deve elencare */
  const dopo = new Date(Date.now() + 2 * 36e5).toISOString();
  const s = await server('redazione'), { browser, ctx } = await apri(pw, { dl_guida: '1', dl_strati: TUTTI, red_misure: { v: 1, rimozioni: [{ ric: dopo, r: 'R-0001' }] } });
  try {
    await archivio(ctx, [eventoProva('prima', { titolo: 'Evento inventato uno' }), eventoProva('seconda', { titolo: 'Evento inventato due' }), eventoProva('terza', { titolo: 'Evento inventato tre' })]);
    await ctx.route(u => u.hostname === 'photon.komoot.io', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(RICERCA) }));
    const p = await ctx.newPage();
    p.on('pageerror', y => err('errore nella pagina: ' + y.message));
    const tocca = async (sel, dove) => { const l = p.locator(sel).first();
      try { await l.waitFor({ timeout: 20000 }); } catch (x) { err(`${dove}: non trovo ${sel}`); return false; }
      try { await l.click({ timeout: 15000 }); } catch (x) { err(`${dove}: non riesco a toccare ${sel}`); return false; } await pausa(350); return true; };
    const testo = () => p.locator(F).innerText().catch(() => '');
    const aspetta = async (re, dove, ms = 40000) => { try { await p.waitForFunction(r => new RegExp(r, 'i').test((document.querySelector('#foglio-slot') || {}).innerText || ''), re.source, { timeout: ms }); return true; }
      catch (x) { err(dove + ': atteso «' + re.source + '», letto «' + ((await testo()) || '').replace(/\s+/g, ' ').slice(-700) + '»'); return false; } };
    const strumenti = async () => { await p.evaluate(() => window.AGR.chiudi()); await pausa(250); return tocca('#badgeRed', 'strumenti'); };
    const scarica = async (sel, dove) => { try { const [d] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.locator(sel).first().click()]); return { nome: d.suggestedFilename(), dati: fs.readFileSync(await d.path()) }; }
      catch (x) { err(dove + ': il file non si scarica (' + x.message + ')'); return null; } };
    const scegliFile = async (sel, f) => { await p.setInputFiles(sel, f); await pausa(500); };
    const cassa = () => p.evaluate(async () => { const c = await caches.open('prova_sportello'); return (await c.keys()).map(r => r.url); });
    const leggiCassa = suff => p.evaluate(async x => { const c = await caches.open('prova_sportello'); const k = (await c.keys()).find(r => r.url.endsWith(x)); return k ? (await c.match(k)).text() : null; }, suff);

    /* 1 */
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(400);
    if (!(await tocca('#badgeRed', 'strumenti')) || !(await tocca(F + '[data-az="chiavi"]', 'chiavi'))) return e;
    await pausa(400); await p.fill('#ch-nome', 'Portatile di prova'); await p.fill('#ch-frase', FRASE); await p.fill('#ch-ripeti', FRASE);
    await tocca(F + '[data-az="chiavi-crea"]', 'chiavi, crea');
    try { await p.waitForSelector(F + '[data-az="chiavi-copia"]', { timeout: 20000 }); } catch (x) { err('le chiavi non si creano'); return e; }
    await strumenti();
    await aspetta(/Da rifare[\s\S]*Copia di sicurezza degli eventi: non ancora fatta[\s\S]*Copia dei registri su memoria fisica: non ancora fatta[\s\S]*Prova del ripristino: non ancora fatta/, 'promemoria all\'inizio');
    await tocca(F + '[data-az="pubblica"]', 'pubblicazione');
    await tocca(F + '[data-az="pb-consegna"]', 'consegna delle chiavi'); await aspetta(/accetta la firma di questo dispositivo/, 'chiavi consegnate');
    await tocca(F + '[data-az="pb-venti"]', 'eventi inventati'); await aspetta(/Portati \d+ eventi inventati/, 'eventi inventati portati');
    const portati = +(((await testo()).match(/Portati (\d+) eventi inventati/) || [])[1] || 0);
    await tocca(F + '[data-az="pb-nuovo"]', 'nuovo evento nascosto'); await tocca(F + '[data-az="nr-nascosto"]', 'casella «Evento nascosto»');
    await p.fill('#a-titolo', 'Concerto nascosto inventato'); await p.selectOption('#a-strato', 'musica'); await pausa(300);
    await p.fill('#a-inizio', giorno(3) + 'T18:00'); await p.fill('#a-fine', giorno(3) + 'T20:00'); await p.fill('#a-luogo', 'Cortile inventato');
    await p.fill('#a-desc', 'Concerto inventato per la prova della copia di sicurezza.'); await p.fill('#a-fonte', 'Fonte inventata');
    await p.fill('#a-indirizzo', 'Via Inventata 5, Torino'); await pausa(1300); await tocca('#a-sugg [data-si="0"]', 'modulo, suggerimento');
    await giudizioProva(p); await p.fill('#g-consenso', 'C-0001'); await pausa(300);
    await tocca(F + '[data-az="a-pubblica"]', 'pubblica il nascosto'); if (!(await aspetta(/Evento nascosto pubblicato[\s\S]*Nascosti · 1/, 'pubblicazione del nascosto'))) return e;
    await tocca(F + '[data-az="nr-fatto-ok"]', 'fatto');
    const codici = JSON.parse((await leggiCassa('riservato/archivio/codici.json')) || '{}');
    if (codici.FS !== 2) err('il codice FS della fonte nuova doveva darlo lo sportello dell\'archivio: ' + JSON.stringify(codici));

    /* 2 */
    await strumenti(); if (!(await tocca(F + '[data-az="archivio"]', 'archivio'))) return e;
    await aspetta(/L’archivio è ancora vuoto[\s\S]*Registro delle fonti scritto dall’app[\s\S]*1 busta cifrata[\s\S]*12 registri non ancora depositati/, 'archivio vuoto, con la busta del registro');
    const REG19 = NOME + '_Reg19_Decisioni.xlsx';
    for (const [f, nome, re, dove] of [['registro-chiaro.xlsx', REG19, /Questo file non è cifrato/, 'registro in chiaro'], ['registro-vecchio-pw.xls', REG19, /accetta soltanto file Excel[\s\S]*Excel 97-2003/, '.xls con il nome di un registro'],
      ['registro-excel.xlsx', 'Registro delle decisioni.xlsx', /Il nome non è tra quelli dei registri/, 'nome fuori regola'], ['allegato-rc4.pdf', 'C-0007_risposta.pdf', /cifratura che si aggira \(RC4\)/, 'PDF con RC4']]) {
      await scegliFile('#fileArchivio', dato(f, nome)); await aspetta(re, dove);
      if (await p.locator(F + '[data-az="ar-deposita"]').count()) err(dove + ': non deve esserci «Deposita»');
      await tocca(F + '[data-az="ar-annulla"]', dove + ', annulla');
    }
    await scegliFile('#fileArchivio', dato('registro-excel.xlsx', REG19.toLowerCase()));
    await aspetta(new RegExp('si deposita come «' + REG19.replace('.', '\\.') + '»[\\s\\S]*Cifrato: AES a 256 bit · SHA-512 · 100\\.000 giri'), 'registro con le maiuscole sbagliate');
    await tocca(F + '[data-az="ar-deposita"]', 'deposita il registro'); await aspetta(/Depositato: «[^»]+Reg19_Decisioni\.xlsx»[\s\S]*Registri · 1/, 'registro depositato');
    await scegliFile('#fileArchivio', dato('allegato-aes128.pdf', 'C-0007_risposta.pdf', 'application/pdf'));
    await aspetta(/Allegato della voce C-0007[\s\S]*Cifrato: AES a 128 bit · PDF/, 'allegato PDF'); await tocca(F + '[data-az="ar-deposita"]', 'deposita l\'allegato');
    await aspetta(/Depositato: «C-0007_risposta\.pdf»[\s\S]*Allegati · 1/, 'allegato depositato');
    await scegliFile('#fileArchivio', dato('registro-libreoffice.xlsx', REG19));
    await aspetta(/Cifrato: AES a 128 bit · SHA-1 · 50\.000 giri[\s\S]*Nell’archivio c’è già questo file[\s\S]*Sostituisci il file/, 'lo stesso nome');
    await tocca(F + '[data-az="ar-deposita"]', 'sostituisci'); await aspetta(/Tocca ancora per sostituirlo/, 'sostituisci, conferma');
    await tocca(F + '[data-az="ar-deposita"]', 'sostituisci, secondo tocco'); await aspetta(/Sostituito: «[^»]+»[\s\S]*Registri · 1/, 'registro sostituito');
    const giu = await scarica(F + '[data-az="ar-scarica"][data-n="' + REG19 + '"]', 'scarica il registro');
    if (giu && (giu.nome !== REG19 || Buffer.compare(giu.dati, fs.readFileSync(path.join(DATI, 'registro-libreoffice.xlsx'))))) err('il registro riscaricato non è quello depositato: ' + giu.nome);
    await tocca(F + '[data-az="ar-togli"][data-n="C-0007_risposta.pdf"]', 'togli l\'allegato'); await aspetta(/Tocca ancora per toglierlo/, 'togli, conferma');
    await tocca(F + '[data-az="ar-togli"][data-n="C-0007_risposta.pdf"]', 'togli, secondo tocco'); await aspetta(/Tolto dall’archivio: «C-0007_risposta\.pdf»/, 'allegato tolto');
    if (/Allegati ·/.test(await testo())) err('tolto l\'allegato, il gruppo degli allegati doveva sparire');
    const zip = await scarica(F + '[data-az="ar-tutti"]', 'scarica tutti i file');
    if (zip) {
      const voci = []; for (let i = 0; i + 30 < zip.dati.length && zip.dati.readUInt32LE(i) === 0x04034b50;) { const ln = zip.dati.readUInt16LE(i + 26), lx = zip.dati.readUInt16LE(i + 28), n = zip.dati.readUInt32LE(i + 18); voci.push(zip.dati.slice(i + 30, i + 30 + ln).toString()); i += 30 + ln + lx + n; }
      if (!/-archivio-registri-\d{4}-\d\d-\d\d\.zip$/.test(zip.nome) || !voci.includes(REG19) || voci.filter(x => /^registro-fonti-scritto-dall-app\/.+\.json$/.test(x)).length !== 1) err('l\'archivio ZIP deve avere il registro e la busta: ' + zip.nome + ' ' + voci.join(', '));
      if (/Concerto nascosto inventato|Cortile inventato/.test(zip.dati.toString('latin1'))) err('l\'archivio ZIP non deve contenere testi in chiaro');
    }
    if ((await cassa()).some(u => /\.xlsx$|\.pdf$/.test(u) && !/riservato\/archivio\/file\//.test(u))) err('i file depositati devono stare solo nella parte riservata dell\'archivio');

    /* 3 */
    await strumenti(); if (!(await tocca(F + '[data-az="copia-sicurezza"]', 'copia di sicurezza'))) return e;
    await aspetta(/Ultima copia scaricata da questo dispositivo: mai/, 'copia di sicurezza, all\'inizio');
    await p.fill('#cs-frase', 'corta'); await p.fill('#cs-ripeti', 'corta'); await tocca(F + '[data-az="cs-scarica"]', 'frase corta'); await aspetta(/almeno 20 caratteri/, 'frase corta');
    await p.fill('#cs-frase', FRASE); await p.fill('#cs-ripeti', FRASE); await tocca(F + '[data-az="cs-scarica"]', 'frase delle chiavi'); await aspetta(/apre anche la copia di riserva delle chiavi/, 'frase delle chiavi');
    await p.fill('#cs-frase', FRASE_COPIA); await p.fill('#cs-ripeti', FRASE_COPIA);
    const copia = await scarica(F + '[data-az="cs-scarica"]', 'scarica la copia di sicurezza');
    if (!copia) return e;
    await aspetta(/Scaricata «copia-eventi-\d{4}-\d\d-\d\d\.bin»/, 'copia scaricata');
    if (!/^copia-eventi-\d{4}-\d\d-\d\d\.bin$/.test(copia.nome) || !/"tipo":"copia-sicurezza-eventi"/.test(copia.dati.slice(0, 400).toString()) || /Concerto nascosto inventato|Torino|inventat/.test(copia.dati.slice(copia.dati.indexOf(10)).toString('latin1'))) err('la copia deve avere l\'intestazione e nessun testo in chiaro');

    /* 4 */
    await strumenti(); await tocca(F + '[data-az="pubblica"]', 'pubblicazione');
    await tocca(F + '[data-az="pb-svuota"]', 'svuota'); await tocca(F + '[data-az="pb-svuota"]', 'svuota, conferma'); await aspetta(/Sportello di prova svuotato/, 'sportello svuotato');
    await tocca(F + '[data-az="pb-consegna"]', 'consegna di nuovo le chiavi'); await aspetta(/accetta la firma di questo dispositivo[\s\S]*Pubblicati · 0/, 'sportello vuoto con le chiavi');
    await strumenti(); await tocca(F + '[data-az="copia-sicurezza"]', 'copia di sicurezza');
    await tocca(F + '[data-az="cs-file"]', 'scegli il file'); await scegliFile('#fileCopia', { name: copia.nome, mimeType: 'application/octet-stream', buffer: copia.dati });
    await aspetta(new RegExp(copia.nome.replace(/\./g, '\\.')), 'file scelto');
    await p.fill('#cs-frase-prova', FRASE_COPIA + ' sbagliata'); await tocca(F + '[data-az="cs-prova"]', 'prova con la frase sbagliata'); await aspetta(/non si apre con questa frase/, 'frase sbagliata');
    await p.fill('#cs-frase-prova', FRASE_COPIA); await tocca(F + '[data-az="cs-prova"]', 'prova il ripristino');
    if (await aspetta(/Copia integra: il ripristino funziona\.[\s\S]*copie dello storico · \d+ eventi \(\d+ ancora da svolgere\) · 0 sospesi · 1 nascosti · 1 buste[\s\S]*tutti si aprono con la cassaforte/, 'prova del ripristino')) {
      const n = +(((await testo()).match(/· (\d+) eventi \(/) || [])[1] || 0);
      if (n !== portati) err('la copia doveva avere i ' + portati + ' eventi portati, ne ha ' + n);
    }
    if ((await cassa()).some(u => /riservato\/stato\.json$/.test(u))) err('la prova del ripristino non deve scrivere nello sportello di prova');
    await tocca(F + '[data-az="cs-ripristina"]', 'ripristina in uno sportello vuoto');
    await aspetta(/Ripristina in uno sportello vuoto[\s\S]*Dopo questa copia è stata chiesta 1 rimozione[\s\S]*R-0001[\s\S]*Ripristina in questo sportello/, 'schermata del ripristino, con la richiesta da ripetere');
    if (!(await p.locator(F + '[data-az="pb-ripr-ok"]').isDisabled().catch(() => false))) err('il ripristino deve restare spento finché la richiesta non è ripetuta');
    await tocca(F + '[data-az="pb-ripr-fatto"]', 'richiesta ripetuta in questa copia');
    await tocca(F + '[data-az="pb-ripr-ok"]', 'ripristina in questo sportello');
    await aspetta(/Copia di sicurezza ripristinata e pubblicata alle[\s\S]*Più 1 eventi nascosti[\s\S]*Nascosti · 1/, 'ripristino nello sportello vuoto');
    const elenco = JSON.parse((await leggiCassa('riservato/storico/elenco.json')) || '[]');
    if (!elenco.length || elenco[elenco.length - 1].operazione !== 'ricostruisci') err('nello storico doveva esserci la copia della ricostruzione');
    /* un secondo ripristino nello stesso sportello, che ora non è vuoto, è rifiutato */
    await strumenti(); await tocca(F + '[data-az="copia-sicurezza"]', 'copia di sicurezza, di nuovo');
    await p.fill('#cs-frase-prova', FRASE_COPIA); await tocca(F + '[data-az="cs-prova"]', 'prova di nuovo'); await aspetta(/Copia integra/, 'seconda prova');
    await tocca(F + '[data-az="cs-ripristina"]', 'ripristina di nuovo'); await tocca(F + '[data-az="pb-ripr-fatto"]', 'richiesta ripetuta, di nuovo'); await tocca(F + '[data-az="pb-ripr-ok"]', 'ripristina di nuovo, conferma');
    await aspetta(/Lo sportello non è vuoto/, 'secondo ripristino in uno sportello pieno');

    /* 5 */
    await strumenti(); await pausa(300);
    if (/Da rifare/.test(await testo())) err('fatte copia, copia dei registri e prova, gli Strumenti non devono ricordarle: ' + (await testo()).replace(/\s+/g, ' ').slice(0, 300));
    await tocca(F + '[data-az="admin-storico"]', 'storico delle operazioni');
    await aspetta(/Copia di sicurezza ripristinata in uno sportello vuoto[\s\S]*Prova del ripristino della copia di sicurezza[\s\S]*Copia di sicurezza degli eventi scaricata[\s\S]*Archivio dei registri scaricato per la copia su memoria fisica[\s\S]*File tolto dall’archivio dei registri[\s\S]*File depositato nell’archivio dei registri/, 'storico delle operazioni');
    const promemoria = await p.evaluate(() => JSON.parse(localStorage.getItem('red_promemoria') || '{}'));
    if (Object.keys(promemoria).sort().join() !== 'copiaEventi,copiaRegistri,provaRipristino' || Object.values(promemoria).some(x => !/^\d{4}-\d\d-\d\d$/.test(x))) err('red_promemoria deve avere soltanto i tre giorni: ' + JSON.stringify(promemoria));
    e.note.push('eventi nella copia: ' + portati + ' più un nascosto; copia di ' + copia.dati.length + ' byte');
  } finally { await browser.close(); s.chiudi(); }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
