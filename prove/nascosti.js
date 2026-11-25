/* Prova: eventi nascosti, password, cifratura e sportello (voci T-045 e T-046 del piano di adeguamento;
   docs/eventi-nascosti.md; libro mastro, §§ 2.3, 3.11 e 3.14).

   Tutto è inventato: parole, password ed eventi nascono qui e non restano da nessuna parte.

    1. L'elenco delle parole: 2048, tutte diverse, di sole lettere senza accenti (3-10), nessuna parola vietata.
    2. La password: cinque parole dell'elenco, almeno venti lettere, ogni volta diversa; per lo sblocco contano solo le
       lettere (maiuscole, accenti, spazi e trattini non fanno differenza).
    3. Impronta e chiave: l'impronta è sempre la stessa per la stessa password e cambia con la password; il file si apre
       solo con la password giusta e sotto il suo nome; un file alterato non si apre.
    4. Il giorno di uscita, ora italiana, anche nelle notti del cambio dell'ora.
    5. Lo sportello: pubblica un evento nascosto in pubblico/nascosti/ con l'impronta come nome; l'evento non entra
       nell'indice né nei quadranti né nei numeri per regione; nessun testo in chiaro nello sportello.
    6. Una password già usata da un altro evento nascosto è rifiutata; una correzione tiene la stessa password.
    7. Sospensione, riattivazione e ritiro: il file esce e rientra; dopo il giorno di uscita il file si toglie alla
       pubblicazione seguente.
    8. Storico e ripristino: le copie tengono il file cifrato, il ripristino lo rimette com'è.
    9. L'involucro per Bunny scrive il file nella zona degli eventi, sotto nascosti/. */
'use strict';
const vm = require('vm');
const { esito, eseguiDaSola } = require('./comune.js');
const N = require('../sorgenti/moduli/nascosti.js');
const PAROLE = require('../sorgenti/moduli/parole-nascosti.js');
const C = require('../sorgenti/moduli/chiavi.js');
const E = require('../sorgenti/moduli/eventi.js');
const P = require('../sorgenti/moduli/pacchetto.js');
const S = require('../sportelli/pubblicazione.js');
const REGIONI = require('../sorgenti/dati/regioni.json').regioni;
const { vocabolarioApp } = require('./eventi.js');

const FRASE = 'tartaruga lanterna violino scogliera';
const VIETATE = /sicur|verificat|ufficial|autorizzat|conform|neutral|imparzial|complet|agora|^(?:password|nascost[oaie]|segret[oaie]|chiav[ei]|mapp[ae]|font[ei]|registro|archivio|evento)$/;   // parole vietate (prove/parole.js), il nome e le parole dell'app
function depositoChiavi() { const m = new Map(); return { leggi: async k => m.get(k), scrivi: async (k, v) => { m.set(k, v); }, togli: async k => { m.delete(k); } }; }
function deposito() {
  const m = new Map();
  return { m, leggi: async p => (m.has(p) ? m.get(p) : null), scrivi: async (p, t) => { m.set(p, String(t)); }, togli: async p => { m.delete(p); },
    elenca: async pre => [...m.keys()].filter(k => k.startsWith(pre)) };
}
const ID = k => (k + 'aaaaaaaaaaaaaaaa').slice(0, 16) + '-nascosto';

async function prova() {
  const e = esito('Eventi nascosti: password, cifratura e sportello');
  const err = s => e.errori.push(s);
  const motivo = async f => { try { await f(); return ''; } catch (x) { return x.motivo || String(x); } };

  /* 1 */
  if (PAROLE.length !== 2048 || new Set(PAROLE).size !== 2048) err('parole: servono 2048 parole tutte diverse, sono ' + PAROLE.length + ' (' + new Set(PAROLE).size + ' diverse)');
  const fuori = PAROLE.filter(p => !/^[a-z]{3,10}$/.test(p)); if (fuori.length) err('parole: solo lettere minuscole senza accenti, da 3 a 10: ' + fuori.slice(0, 5).join(', '));
  const vietate = PAROLE.filter(p => VIETATE.test(p)); if (vietate.length) err('parole: parole da non usare nell\'elenco: ' + vietate.join(', '));

  /* 2 */
  const viste = new Set();
  for (let i = 0; i < 200; i++) {
    const pw = N.genera(PAROLE), parti = pw.split(' ');
    if (parti.length !== N.PAROLE || parti.some(p => !PAROLE.includes(p)) || N.normalizza(pw).length < N.MIN_LETTERE) { err('password: «' + pw + '» non è fatta di cinque parole dell\'elenco con almeno venti lettere'); break; }
    viste.add(pw);
  }
  if (viste.size !== 200) err('password: in 200 password generate ce ne sono di uguali');
  if (N.normalizza('  Nùvola-TROMBA  sedano\tFaro, lampo! ') !== 'nuvolatrombasedanofarolampo' || N.forma(' Nùvola-TROMBA  sedano ') !== 'nuvola tromba sedano') err('password: maiuscole, accenti e separatori non vengono tolti come previsto');
  if (N.lunga('faro lampo sole') || !N.lunga('nuvola tromba sedano faro')) err('password: la soglia di venti lettere non è quella attesa');
  if (await motivo(() => N.impronta('troppo corta')) !== 'corta') err('password: una password più corta di venti lettere non si deve nemmeno cercare');

  /* 3 */
  const pw = 'castoro piuma treno salvia ponte', imp = await N.impronta(pw);
  if (!N.IMPRONTA.test(imp) || imp !== await N.impronta('CASTORO-piuma treno  sàlvia ponte') || imp === await N.impronta('castoro piuma treno salvia porta')) err('impronta: non è stabile o non cambia con la password');
  const ev = { id: ID('concerto'), titolo: 'Concerto inventato nel cortile', strato: 'musica', inizio: '2026-12-05T21:00', fine: '2026-12-05T23:00', luogo: 'Cortile inventato',
    indirizzo: 'Via Inventata 3, Torino', collocazione: 'indirizzo', lat: 45.0703, lng: 7.6869, descrizione: 'Evento inventato per la prova.', fonte: { testo: 'Organizzatore inventato' }, modificato: '2026-11-25T10:00:00Z' };
  const { file } = await N.cifra(ev, pw, null, imp);
  if (N.controllaFile(file).length) err('file: la forma del file appena cifrato non va: ' + N.controllaFile(file).join('; '));
  if (JSON.stringify(file).includes('inventato') || JSON.stringify(file).includes('Torino')) err('file: nel file cifrato si legge il contenuto');
  const aperto = await N.decifra(JSON.stringify(file), 'castoro PIUMA treno salvia ponte');
  if (JSON.stringify(aperto) !== JSON.stringify(ev) || E.controlla(aperto).length) err('file: aperto con la password non dà l\'evento di partenza');
  if (await motivo(() => N.decifra(file, 'castoro piuma treno salvia porta')) !== 'password') err('file: con un\'altra password non si deve aprire');
  const altroNome = await N.impronta('ape ape ape ape ape ape ape ape');
  if (await motivo(() => N.decifra(file, pw, null, altroNome)) !== 'password') err('file: spostato sotto un altro nome non si deve aprire');
  const alterato = JSON.parse(JSON.stringify(file)); alterato.dati = alterato.dati.slice(0, 10) + (alterato.dati[10] === 'A' ? 'B' : 'A') + alterato.dati.slice(11);
  if (await motivo(() => N.decifra(alterato, pw)) !== 'password') err('file: un file alterato non si deve aprire');
  for (const [nome, f] of [['un campo in più', Object.assign({}, file, { titolo: 'x' })], ['giri troppo pochi', Object.assign({}, file, { kdf: Object.assign({}, file.kdf, { giri: 1000 }) })], ['un altro formato', Object.assign({}, file, { formato: 'eventi-quadrante' })]])
    if (!N.controllaFile(f).length) err('file: «' + nome + '» doveva essere fuori forma');

  /* 4 */
  if (N.giornoUscita(ev) !== '2026-12-06') err('giorno di uscita: fine alle 23 del 5/12, esce alle 2 del 6/12: atteso 2026-12-06, è ' + N.giornoUscita(ev));
  if (!N.vivo('2026-12-06', Date.parse('2026-12-06T22:59:00Z')) || N.vivo('2026-12-06', Date.parse('2026-12-06T23:00:00Z'))) err('giorno di uscita: il file resta fino alla mezzanotte italiana di quel giorno');
  if (!N.vivo('2026-03-29', Date.parse('2026-03-29T21:59:00Z')) || N.vivo('2026-03-29', Date.parse('2026-03-29T22:00:00Z'))) err('giorno di uscita: la mezzanotte dopo il cambio dell\'ora di marzo non è quella giusta');
  if (N.giornoValido('2026-02-30') || !N.giornoValido('2028-02-29')) err('giorno di uscita: il controllo della data non va');

  /* 5 */
  let t = Date.parse('2026-12-01T09:00:00Z'); const ora = () => t;
  const dep = deposito(), voc = vocabolarioApp();
  const sp = S.crea({ deposito: dep, ora, regioni: REGIONI, vocabolario: voc, svuota: async x => { svuotati.push(...x); } });
  const svuotati = [];
  const k = C.crea({ deposito: depositoChiavi(), ora }); await k.genera(FRASE, FRASE, 'Portatile di prova');
  const stK = await k.stato(); await sp.ammetti(await k.pubbliche());
  const manda = async c => sp.ricevi(JSON.stringify(await P.forma(c, { firma: k.firma, dispositivo: { nome: 'Portatile di prova', impronta: stK.firma.impronta }, ora })));
  const voce = (x, f, i) => ({ id: x.id, impronta: i, giorno: N.giornoUscita(x), file: f });
  const pubblico = { id: ID('pubblico'), titolo: 'Mostra inventata', strato: 'arte', inizio: '2026-12-04T10:00', fine: '2026-12-04T18:00', luogo: 'Sala inventata',
    indirizzo: 'Via Inventata 1, Torino', collocazione: 'indirizzo', lat: 45.0703, lng: 7.6869, descrizione: 'Evento pubblico inventato.', fonte: { testo: 'Fonte inventata' }, modificato: '2026-12-01T09:00:00Z' };
  let r = await manda({ operazione: 'scrivi', pubblica: [pubblico], nascosti: [voce(ev, file, imp)] });
  const nome = S.NASC + imp + '.json';
  if (r.stato !== 200 || dep.m.get(nome) !== JSON.stringify(file)) err('sportello: l\'evento nascosto non è nel suo file, con l\'impronta come nome: ' + JSON.stringify(r.corpo).slice(0, 300));
  if (r.corpo.nascosti !== 1 || r.corpo.eventi !== 1 || !(r.corpo.riepilogo.pubblicati || []).includes(ev.id)) err('sportello: la risposta non conta l\'evento nascosto tra i pubblicati');
  const indice = JSON.parse(dep.m.get(S.PUB + 'indice.json')), quadranti = Object.values(indice.quadranti).map(x => dep.m.get(S.PUB + x.file)).join('\n');
  if (Object.values(indice.quadranti).reduce((a, x) => a + x.eventi, 0) !== 1 || indice.regioni.reduce((a, x) => a + x.eventi, 0) !== 1 || quadranti.includes(ev.id)) err('sportello: l\'evento nascosto non deve entrare nell\'indice, nei quadranti né nei numeri per regione');
  if (!svuotati.includes('nascosti/' + imp + '.json')) err('sportello: la rete di consegna va aggiornata anche per il file nascosto');
  const tutto = JSON.stringify([...dep.m.entries()]);
  if (tutto.includes('Concerto inventato') || tutto.includes('Cortile inventato') || tutto.includes(pw) || tutto.includes(N.normalizza(pw))) err('sportello: nel deposito si leggono il contenuto o la password dell\'evento nascosto');
  r = await manda({ operazione: 'stato' });
  if (r.stato !== 200 || (r.corpo.nascosti || []).length !== 1 || r.corpo.nascosti[0].impronta !== imp || r.corpo.nascosti[0].giorno !== '2026-12-06') err('sportello: lo stato non elenca l\'evento nascosto con impronta e giorno');

  /* 6 */
  const altro = Object.assign({}, ev, { id: ID('altro'), titolo: 'Altro evento inventato' }), fAltro = (await N.cifra(altro, pw, null, imp)).file;
  r = await manda({ operazione: 'scrivi', nascosti: [voce(altro, fAltro, imp)] });
  if (r.stato !== 422 || r.corpo.motivo !== 'impronta') err('sportello: una password già usata da un altro evento nascosto doveva essere rifiutata (impronta): ' + JSON.stringify(r.corpo).slice(0, 200));
  const corretto = Object.assign({}, ev, { inizio: '2026-12-05T21:30', modificato: '2026-12-01T09:05:00Z' }), fCorr = (await N.cifra(corretto, pw, null, imp)).file;
  t += 60000; r = await manda({ operazione: 'scrivi', nascosti: [voce(corretto, fCorr, imp)] });
  if (r.stato !== 200 || !(r.corpo.riepilogo.corretti || []).includes(ev.id) || dep.m.get(nome) !== JSON.stringify(fCorr) || (await N.decifra(dep.m.get(nome), pw)).inizio !== '2026-12-05T21:30') err('sportello: la correzione con la stessa password non ha sostituito il file');
  const pw2 = 'faro lampo sedano nuvola tromba', imp2 = await N.impronta(pw2), f2 = (await N.cifra(corretto, pw2, null, imp2)).file;
  r = await manda({ operazione: 'scrivi', nascosti: [voce(corretto, f2, imp2)] });
  if (r.stato !== 422 || r.corpo.motivo !== 'impronta') err('sportello: lo stesso evento nascosto con un\'altra password doveva essere rifiutato (impronta)');
  r = await manda({ operazione: 'scrivi', pubblica: [Object.assign({}, pubblico, { id: ev.id })] });
  if (r.stato !== 422 || r.corpo.motivo !== 'nascosto') err('sportello: un evento nascosto non deve poter diventare pubblico con lo stesso identificativo');
  r = await manda({ operazione: 'scrivi', nascosti: [Object.assign(voce(corretto, fCorr, imp), { giorno: '2026-11-30' })] });
  if (r.stato !== 422 || r.corpo.motivo !== 'passato') err('sportello: un evento nascosto con il giorno di uscita passato doveva essere rifiutato');
  r = await manda({ operazione: 'scrivi', nascosti: [Object.assign(voce(corretto, fCorr, imp), { titolo: 'x' })] });
  if (r.stato !== 422 || r.corpo.motivo !== 'nascosto') err('sportello: una voce nascosta con un campo in più doveva essere rifiutata');

  /* 7 */
  t += 60000; r = await manda({ operazione: 'scrivi', sospendi: [ev.id] });
  let s = (await manda({ operazione: 'stato' })).corpo;
  if (r.stato !== 200 || dep.m.has(nome) || s.nascosti.length || s.nascostiSospesi.length !== 1) err('sospensione: il file nascosto doveva uscire dall\'archivio pubblico e restare nell\'elenco riservato');
  t += 60000; r = await manda({ operazione: 'scrivi', riattiva: [ev.id] });
  if (r.stato !== 200 || dep.m.get(nome) !== JSON.stringify(fCorr)) err('riattivazione: il file nascosto doveva tornare com\'era');
  const copiaPrima = r.corpo.copia;
  t += 60000; r = await manda({ operazione: 'scrivi', ritira: [{ id: ev.id, motivo: 'richiesta' }] });
  s = (await manda({ operazione: 'stato' })).corpo;
  if (r.stato !== 200 || dep.m.has(nome) || s.nascosti.length || s.nascostiSospesi.length) err('ritiro: il file nascosto doveva sparire dall\'archivio e dall\'elenco riservato');

  /* 8 */
  r = await manda({ operazione: 'copia', nome: copiaPrima });
  const k1 = r.corpo.copia;
  if (r.stato !== 200 || (k1.nascosti || []).length !== 1 || JSON.stringify(k1).includes('Concerto inventato')) err('storico: la copia deve tenere l\'evento nascosto soltanto cifrato');
  t += 60000; r = await manda({ operazione: 'ripristina', da: copiaPrima, eventi: k1.eventi, sospesi: k1.sospesi, nascosti: k1.nascosti, nascostiSospesi: k1.nascostiSospesi });
  if (r.stato !== 200 || dep.m.get(nome) !== JSON.stringify(fCorr)) err('ripristino: il file nascosto della copia doveva tornare com\'era: ' + JSON.stringify(r.corpo).slice(0, 200));
  /* il giorno di uscita passa: alla pubblicazione seguente il file si toglie */
  t = Date.parse('2026-12-06T22:59:00Z'); r = await manda({ operazione: 'scrivi', pubblica: [Object.assign({}, pubblico, { id: ID('dopo'), inizio: '2026-12-10T10:00', fine: '2026-12-10T12:00' })] });
  if (!dep.m.has(nome)) err('uscita: il file nascosto doveva restare fino alla mezzanotte italiana del giorno di uscita');
  t = Date.parse('2026-12-06T23:01:00Z'); r = await manda({ operazione: 'scrivi', sospendi: [ID('dopo')] });
  s = (await manda({ operazione: 'stato' })).corpo;
  if (dep.m.has(nome) || s.nascosti.length) err('uscita: dopo la mezzanotte del giorno di uscita il file nascosto doveva sparire alla pubblicazione seguente');

  /* 9 */
  const { montaSportello } = await import('../strumenti/monta-sportello.mjs');
  const bunny = new Map(); let gestore = null;
  const AMB = { ZONA_EVENTI: 'eventi-inventati', CHIAVE_ZONA_EVENTI: 'inventata-uno', ZONA_RISERVATA: 'riservata-inventata', CHIAVE_ZONA_RISERVATA: 'inventata-due', STORAGE_HOST: 'archiviazione.example', ORIGINE_REDAZIONE: 'https://redazione.example' };
  const archiviazione = async (u, o = {}) => {
    const p = new URL(u).pathname, m = o.method || 'GET';
    if ((o.headers || {}).AccessKey !== (p.startsWith('/eventi-inventati/') ? 'inventata-uno' : 'inventata-due')) return new Response('', { status: 401 });
    if (m === 'PUT') { bunny.set(p, String(o.body)); return new Response('', { status: 201 }); }
    if (m === 'DELETE') return new Response('', { status: bunny.delete(p) ? 200 : 404 });
    if (p.endsWith('/')) return new Response(JSON.stringify([...bunny.keys()].filter(x => x.startsWith(p) && !x.slice(p.length).includes('/')).map(x => ({ ObjectName: x.slice(p.length), IsDirectory: false }))), { status: 200 });
    return bunny.has(p) ? new Response(bunny.get(p), { status: 200 }) : new Response('', { status: 404 });
  };
  const mondo = { BunnySDK: { net: { http: { serve: f => { gestore = f; } } } }, process: { env: AMB }, fetch: archiviazione, Response, Request, crypto: globalThis.crypto, TextEncoder, TextDecoder, atob, btoa, URL, Intl, console };
  mondo.self = mondo;
  try { vm.runInNewContext(montaSportello().replace(/^import .*$/gm, ''), mondo); } catch (x) { err('involucro per Bunny: il file montato non parte: ' + x.message); }
  if (typeof gestore === 'function') {
    bunny.set('/riservata-inventata/chiavi.json', JSON.stringify({ ammesse: [{ dispositivo: 'Portatile di prova', impronta: stK.firma.impronta, pubblica: stK.firma.pubblica }], revocate: [] }));
    const traUnMese = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);   // l'involucro usa l'orologio vero
    const futuro = Object.assign({}, ev, { id: ID('bunny'), inizio: traUnMese + 'T21:00', fine: traUnMese + 'T23:00' }), pw3 = N.genera(PAROLE), i3 = await N.impronta(pw3);
    const pac = await P.forma({ operazione: 'scrivi', nascosti: [voce(futuro, (await N.cifra(futuro, pw3, null, i3)).file, i3)] }, { firma: k.firma, dispositivo: { nome: 'Portatile di prova', impronta: stK.firma.impronta } });
    const x = await gestore(new Request('https://sportello.example/', { method: 'POST', body: JSON.stringify(pac) }));
    if (x.status !== 200 || !bunny.has('/eventi-inventati/nascosti/' + i3 + '.json')) err('involucro per Bunny: il file nascosto doveva stare nella zona degli eventi, sotto nascosti/ (' + x.status + ')');
  } else err('involucro per Bunny: non consegna la funzione che riceve le richieste');

  e.note.push('parole: ' + PAROLE.length + ', password di ' + N.PAROLE + ' parole; impronta e chiave con PBKDF2 a ' + N.GIRI.toLocaleString('it-IT') + ' giri; file ' + JSON.stringify(file).length + ' caratteri');
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
