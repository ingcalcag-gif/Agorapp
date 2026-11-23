/* Prova: pacchetto firmato e sportello di pubblicazione (voci T-038, T-039 e T-040 del piano di adeguamento).

   La logica dello sportello (sportelli/pubblicazione.js) gira qui con un deposito finto in memoria e con le chiavi del
   modulo sorgenti/moduli/chiavi.js, fatte al momento: tutto è inventato, eventi compresi.

    1. Il pacchetto: si forma, si rilegge, la firma si verifica; un contenuto cambiato dopo la firma non passa.
    2. Chi non è un dispositivo autorizzato è rifiutato subito, e non resta traccia dei suoi tentativi.
    3. Un pacchetto firmato pubblica: quadranti, indice, elenco riservato e copia datata; la risposta porta l'ora.
    4. Un pacchetto già ricevuto, o firmato più di cinque minuti prima o dopo, è rifiutato.
    5. Cinque firme sbagliate a nome di un dispositivo: lo sportello non gli risponde per un quarto d'ora; gli altri
       dispositivi continuano a pubblicare.
    6. Un evento non valido fa rifiutare il pacchetto intero e non cambia nulla.
    7. Correzione: stesso identificativo, testo nuovo; il file del quadrante cambia nome e quello vecchio sparisce subito;
       il telefono che aveva l'indice di prima richiede l'indice da sé.
    8. Sospensione e riattivazione (T-040): l'evento sospeso esce dai file pubblici e resta nell'elenco riservato.
    9. Ritiro: serve il motivo; la copia datata lo conserva.
   10. Storico (T-039): elenco delle copie, lettura di una copia, ripristino firmato.
   11. I numeri per regione scendono da soli quando un evento esce (LM-46), anche senza una nuova pubblicazione.
   12. Revoca: la firma revocata non vale più e non si può autorizzare di nuovo.
   13. Lo sportello non riceve e non conserva indirizzi; nei sorgenti non ci sono chiavi.
   14. L'involucro per Bunny (sportelli/bunny-pubblicazione.js, montato da strumenti/monta-sportello.mjs), scritto e
       spento: con un deposito finto al posto dell'archiviazione di Bunny riceve, rifiuta, pubblica e risponde. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { RADICE, esito, eseguiDaSola } = require('./comune.js');
const C = require('../sorgenti/moduli/chiavi.js');
const E = require('../sorgenti/moduli/eventi.js');
const Q = require('../sorgenti/moduli/quadranti.js');
const P = require('../sorgenti/moduli/pacchetto.js');
const A = require('../sorgenti/moduli/archivio.js');
const S = require('../sportelli/pubblicazione.js');
const REGIONI = require('../sorgenti/dati/regioni.json').regioni;
const { vocabolarioApp } = require('./eventi.js');

const FRASE = 'cavallo batteria graffetta corretta';
function depositoChiavi() { const m = new Map(); return { leggi: async k => m.get(k), scrivi: async (k, v) => { m.set(k, v); }, togli: async k => { m.delete(k); } }; }
function deposito() {
  const m = new Map();
  return { m, leggi: async p => (m.has(p) ? m.get(p) : null), scrivi: async (p, t) => { m.set(p, String(t)); }, togli: async p => { m.delete(p); },
    elenca: async pre => [...m.keys()].filter(k => k.startsWith(pre)) };
}
const ID = k => (k + 'aaaaaaaaaaaaaaaa').slice(0, 16) + '-provaaaa';

async function prova() {
  const e = esito('Pacchetto firmato e sportello di pubblicazione');
  const err = s => e.errori.push(s);
  let t = Date.parse('2026-12-01T09:00:00Z'); const ora = () => t;
  const ev = (k, campi) => Object.assign({ id: ID(k), titolo: 'Evento inventato ' + k, strato: 'musica', inizio: '2026-12-04T21:00', fine: '2026-12-04T23:00', luogo: 'Sala inventata',
    indirizzo: 'Via Inventata 1, Torino', collocazione: 'indirizzo', lat: 45.0703, lng: 7.6869, descrizione: 'Evento inventato per la prova.', fonte: { testo: 'Fonte inventata' }, modificato: '2026-12-01T09:00:00Z' }, campi || {});

  const dep = deposito(), voc = vocabolarioApp();
  const sp = S.crea({ deposito: dep, ora, regioni: REGIONI, vocabolario: voc });
  async function dispositivo(nome) {
    const k = C.crea({ deposito: depositoChiavi(), ora }); await k.genera(FRASE, FRASE, nome);
    const s = await k.stato();
    return { k, pubbliche: await k.pubbliche(), forma: c => P.forma(c, { firma: k.firma, dispositivo: { nome, impronta: s.firma.impronta }, ora }) };
  }
  const D1 = await dispositivo('Portatile di prova'), D2 = await dispositivo('Telefono di prova'), D3 = await dispositivo('Estraneo');
  const manda = async (d, c) => sp.ricevi(JSON.stringify(await d.forma(c)));
  const pubblici = () => [...dep.m.keys()].filter(k => k.startsWith(S.PUB)).sort();
  const indice = () => JSON.parse(dep.m.get(S.PUB + 'indice.json'));
  const titoliPubblici = () => Object.values(indice().quadranti).flatMap(x => JSON.parse(dep.m.get(S.PUB + x.file)).eventi.map(y => y.titolo)).sort();

  /* 1 */
  const p0 = await D1.forma({ operazione: 'stato' });
  if (!(await P.verifica(p0, D1.pubbliche.firma.pubblica))) err('pacchetto: la firma appena fatta non si verifica');
  if (await P.verifica(p0, D2.pubbliche.firma.pubblica)) err('pacchetto: la firma si verifica con la chiave di un altro dispositivo');
  const cambiato = Object.assign({}, p0, { contenuto: JSON.stringify({ operazione: 'storico' }) });
  if (await P.verifica(cambiato, D1.pubbliche.firma.pubblica)) err('pacchetto: un contenuto cambiato dopo la firma passa la verifica');
  if (await P.verifica(Object.assign({}, p0, { quando: new Date(t + 1000).toISOString() }), D1.pubbliche.firma.pubblica)) err('pacchetto: la data e l\'ora non sono coperte dalla firma');
  for (const [nome, x] of [['un campo in più', Object.assign({}, p0, { altro: 1 })], ['senza numero', Object.assign({}, p0, { numero: '' })], ['operazione sconosciuta', Object.assign({}, p0, { contenuto: '{"operazione":"cancella-tutto"}' })], ['testo qualunque', 'ciao']]) {
    let m = ''; try { P.leggi(typeof x === 'string' ? x : JSON.stringify(x)); } catch (z) { m = z.motivo; }
    if (m !== 'forma') err('pacchetto: «' + nome + '» doveva essere rifiutato per la forma');
  }

  /* 2 */
  let r = await manda(D3, { operazione: 'scrivi', pubblica: [ev('uno')] });
  if (r.stato !== 403 || r.corpo.motivo !== 'sconosciuto') err('un dispositivo non autorizzato doveva essere rifiutato (403, sconosciuto): ' + JSON.stringify(r));
  if (dep.m.size) err('il rifiuto di un estraneo ha lasciato qualcosa nel deposito: ' + [...dep.m.keys()].join(', '));

  /* 3 */
  await sp.ammetti(D1.pubbliche); await sp.ammetti(D2.pubbliche);
  r = await manda(D1, { operazione: 'scrivi', pubblica: [ev('uno'), ev('due', { lat: 45.4642, lng: 9.19, indirizzo: 'Via Inventata 2, Milano' })] });
  if (r.stato !== 200 || r.corpo.esito !== 'fatto' || r.corpo.quando !== new Date(t).toISOString() || r.corpo.eventi !== 2) err('pubblicazione: risposta inattesa ' + JSON.stringify(r));
  if (Q.controllaIndice(indice()).length) err('pubblicazione: l\'indice scritto non è valido: ' + Q.controllaIndice(indice()).join('; '));
  if (titoliPubblici().join('|') !== 'Evento inventato due|Evento inventato uno') err('pubblicazione: nei file pubblici non ci sono i due eventi: ' + titoliPubblici());
  if (pubblici().some(f => !/^pubblico\/(indice\.json|quadranti\/q\d\d-\d\d-[0-9a-f]{16}\.json)$/.test(f))) err('pubblicazione: file pubblici con nomi inattesi: ' + pubblici());
  const copie1 = [...dep.m.keys()].filter(k => k.startsWith(S.RIS + 'storico/copie/'));
  if (copie1.length !== 1) err('pubblicazione: doveva esserci una copia datata, ce ne sono ' + copie1.length);
  else { const k = JSON.parse(dep.m.get(copie1[0])); if (k.eventi.length !== 2 || k.dispositivo.nome !== 'Portatile di prova' || !k.pacchetto || !(await P.verifica(k.pacchetto, D1.pubbliche.firma.pubblica))) err('copia datata: mancano gli eventi, il dispositivo o il pacchetto firmato'); }
  const prima = r.corpo.copia;

  /* 4 */
  const pk = await D1.forma({ operazione: 'stato' });
  r = await sp.ricevi(JSON.stringify(pk)); if (r.stato !== 200 || r.corpo.eventi.length !== 2) err('lettura dello stato: attesi due eventi, ' + JSON.stringify(r).slice(0, 200));
  r = await sp.ricevi(JSON.stringify(pk)); if (r.stato !== 409 || r.corpo.motivo !== 'ripetuto') err('un pacchetto già ricevuto doveva essere rifiutato (409): ' + JSON.stringify(r));
  const vecchio = await D1.forma({ operazione: 'stato' });
  t += P.FINESTRA_MS + 1000; r = await sp.ricevi(JSON.stringify(vecchio));
  if (r.stato !== 400 || r.corpo.motivo !== 'tempo') err('un pacchetto firmato più di cinque minuti prima doveva essere rifiutato: ' + JSON.stringify(r));
  const futuro = await P.forma({ operazione: 'stato' }, { firma: D1.k.firma, dispositivo: { nome: 'Portatile di prova', impronta: D1.pubbliche.firma.impronta }, ora: () => t + P.FINESTRA_MS + 60000 });
  r = await sp.ricevi(JSON.stringify(futuro)); if (r.stato !== 400 || r.corpo.motivo !== 'tempo') err('un pacchetto con l\'ora troppo avanti doveva essere rifiutato: ' + JSON.stringify(r));

  /* 5 */
  const falso = async () => { const p = await D1.forma({ operazione: 'scrivi', pubblica: [ev('falso')] }); p.contenuto = p.contenuto.replace('falso', 'falsi'); return JSON.stringify(p); };
  const esiti = []; for (let i = 0; i < S.TENTATIVI; i++) { r = await sp.ricevi(await falso()); esiti.push(r.stato + ' ' + r.corpo.motivo); }
  if (esiti.join(',') !== '401 firma,401 firma,401 firma,401 firma,429 fermo') err('tentativi errati: attesi quattro rifiuti e poi il fermo, avuti ' + esiti.join(','));
  r = await manda(D1, { operazione: 'stato' }); if (r.stato !== 429 || r.corpo.motivo !== 'fermo' || !r.corpo.fino) err('dopo cinque firme sbagliate il dispositivo doveva restare fermo: ' + JSON.stringify(r));
  r = await manda(D2, { operazione: 'stato' }); if (r.stato !== 200) err('il fermo di un dispositivo non deve fermare gli altri: ' + JSON.stringify(r));
  if (titoliPubblici().some(x => /fals/.test(x))) err('un pacchetto con la firma sbagliata ha scritto nell\'archivio');
  t += S.FERMO_MS + 1000;
  r = await manda(D1, { operazione: 'stato' }); if (r.stato !== 200) err('passato il quarto d\'ora il dispositivo doveva tornare a pubblicare: ' + JSON.stringify(r));

  /* 6 */
  const indicePrima = dep.m.get(S.PUB + 'indice.json');
  for (const [nome, x] of [['senza fonte', (() => { const y = ev('tre'); delete y.fonte; return y; })()], ['con un\'immagine', ev('tre', { immagine: 'https://esempio.example/x.jpg' })], ['fuori dall\'Italia', ev('tre', { lat: 48.85, lng: 2.35 })], ['strato inventato', ev('tre', { strato: 'inesistente' })]]) {
    r = await manda(D1, { operazione: 'scrivi', pubblica: [ev('buono'), x] });
    if (r.stato !== 422 || r.corpo.motivo !== 'evento') err('un evento ' + nome + ' doveva far rifiutare il pacchetto (422): ' + JSON.stringify(r).slice(0, 200));
  }
  r = await manda(D1, { operazione: 'scrivi', pubblica: [ev('passato', { inizio: '2026-11-01T10:00', fine: '2026-11-01T11:00' })] });
  if (r.stato !== 422 || r.corpo.motivo !== 'passato') err('un evento già uscito dalla mappa doveva essere rifiutato: ' + JSON.stringify(r));
  r = await manda(D1, { operazione: 'scrivi' }); if (r.stato !== 422 || r.corpo.motivo !== 'vuoto') err('un pacchetto senza nulla da fare doveva essere rifiutato: ' + JSON.stringify(r));
  if (dep.m.get(S.PUB + 'indice.json') !== indicePrima) err('i pacchetti rifiutati hanno cambiato l\'indice');

  /* 7 */
  const fileUno = () => Object.values(indice().quadranti).map(x => x.file).find(f => JSON.parse(dep.m.get(S.PUB + f)).eventi.some(y => y.id === ID('uno')));
  const vecchioFile = fileUno();
  const fetchFinto = async u => { const k = S.PUB + String(u).replace('https://archivio.example/', ''); return dep.m.has(k) ? { ok: true, text: async () => dep.m.get(k) } : { ok: false, text: async () => '' }; };
  const telefono = A.crea({ dove: 'https://archivio.example/', vocabolario: voc, adesso: ora, fetch: fetchFinto });
  await telefono.apri();   // un telefono che ha l'indice di prima della correzione, e non ha ancora scaricato nulla
  t += 60000; r = await manda(D2, { operazione: 'scrivi', pubblica: [ev('uno', { titolo: 'Evento inventato uno, corretto', modificato: new Date(t).toISOString().slice(0, 19) + 'Z' })] });
  if (r.stato !== 200 || r.corpo.riepilogo.corretti.join() !== ID('uno') || r.corpo.riepilogo.pubblicati.length) err('correzione: riepilogo inatteso ' + JSON.stringify(r.corpo));
  if (!titoliPubblici().includes('Evento inventato uno, corretto') || titoliPubblici().length !== 2) err('correzione: il testo nuovo non è nei file pubblici, o gli eventi non sono più due');
  if (fileUno() === vecchioFile) err('correzione: il file del quadrante doveva cambiare nome');
  if (dep.m.has(S.PUB + vecchioFile)) err('correzione: il file di prima doveva sparire subito (un evento ritirato non deve restare leggibile in un file vecchio)');
  await telefono.carica(Q.intorno(Q.quadrante(45.0703, 7.6869)));
  if (!telefono.eventi().some(x => x.ev.titolo === 'Evento inventato uno, corretto')) err('un telefono con l\'indice di prima, non trovando più il file, doveva richiedere l\'indice e leggere l\'evento corretto');
  t += 60000; r = await manda(D1, { operazione: 'scrivi', pubblica: [ev('quattro')] });

  /* 8 */
  t += 60000; r = await manda(D1, { operazione: 'scrivi', sospendi: [ID('quattro')] });
  if (r.stato !== 200 || titoliPubblici().includes('Evento inventato quattro')) err('sospensione: l\'evento è ancora nei file pubblici');
  if (JSON.stringify([...dep.m.entries()].filter(([k]) => k.startsWith(S.PUB))).includes(ID('quattro'))) err('sospensione: l\'identificativo dell\'evento sospeso è ancora in un file pubblico');
  r = await manda(D1, { operazione: 'stato' }); if (r.corpo.sospesi.map(x => x.id).join() !== ID('quattro') || r.corpo.eventi.length !== 2) err('sospensione: l\'elenco riservato doveva avere due eventi e uno sospeso');
  r = await manda(D1, { operazione: 'scrivi', pubblica: [ev('quattro', { titolo: 'Evento inventato quattro, corretto' })] });
  if (r.stato !== 200 || titoliPubblici().some(x => /quattro/.test(x))) err('un evento sospeso si corregge ma resta sospeso');
  r = await manda(D1, { operazione: 'scrivi', sospendi: [ID('nessuno')] }); if (r.stato !== 422 || r.corpo.motivo !== 'manca') err('sospendere un evento che non c\'è doveva essere rifiutato');
  t += 60000; r = await manda(D2, { operazione: 'scrivi', riattiva: [ID('quattro')] });
  if (r.stato !== 200 || !titoliPubblici().includes('Evento inventato quattro, corretto')) err('riattivazione: l\'evento non è tornato nei file pubblici');

  /* 9 */
  r = await manda(D1, { operazione: 'scrivi', ritira: [{ id: ID('quattro') }] }); if (r.stato !== 422 || r.corpo.motivo !== 'ritiro') err('un ritiro senza motivo doveva essere rifiutato: ' + JSON.stringify(r));
  r = await manda(D1, { operazione: 'scrivi', ritira: [{ id: ID('quattro'), motivo: 'perché sì' }] }); if (r.stato !== 422) err('un ritiro con un motivo fuori elenco doveva essere rifiutato');
  t += 60000; r = await manda(D1, { operazione: 'scrivi', ritira: [{ id: ID('quattro'), motivo: 'richiesta', riferimento: 'R inventata 1' }] });
  if (r.stato !== 200 || titoliPubblici().some(x => /quattro/.test(x))) err('ritiro: l\'evento è ancora pubblicato');
  const kr = JSON.parse(dep.m.get(S.RIS + 'storico/copie/' + r.corpo.copia + '.json'));
  if (JSON.stringify(kr.riepilogo.ritirati) !== JSON.stringify([{ id: ID('quattro'), motivo: 'richiesta', riferimento: 'R inventata 1' }])) err('ritiro: la copia datata non conserva il motivo: ' + JSON.stringify(kr.riepilogo));
  if (S.MOTIVI.join() !== 'annullato,errore,esclusione,richiesta,segnalazione,ordine') err('i motivi del ritiro non sono i sei del cap. 22');

  /* 10 */
  r = await manda(D1, { operazione: 'storico' });
  const copie = r.corpo.copie || [];
  if (r.stato !== 200 || copie.length < 6 || copie[copie.length - 1].nome !== prima || copie.some((x, i) => i && x.quando > copie[i - 1].quando)) err('storico: elenco delle copie inatteso (' + copie.length + ' copie, dalla più recente)');
  r = await manda(D1, { operazione: 'copia', nome: prima });
  if (r.stato !== 200 || r.corpo.copia.eventi.map(x => x.titolo).sort().join('|') !== 'Evento inventato due|Evento inventato uno' || 'pacchetto' in r.corpo.copia) err('storico: la prima copia non si legge come attesa');
  const k1 = r.corpo.copia;
  r = await manda(D1, { operazione: 'copia', nome: '../chiavi' }); if (r.stato !== 422) err('storico: un nome di copia fuori forma doveva essere rifiutato');
  t += 60000; r = await manda(D2, { operazione: 'ripristina', da: prima, eventi: k1.eventi, sospesi: k1.sospesi });
  if (r.stato !== 200 || titoliPubblici().join('|') !== 'Evento inventato due|Evento inventato uno') err('ripristino: l\'archivio non è tornato alla prima copia: ' + titoliPubblici());
  r = await manda(D2, { operazione: 'ripristina', da: '2020-01-01T00-00-00-000Z-00000000', eventi: [], sospesi: [] }); if (r.stato !== 422 || r.corpo.motivo !== 'copia') err('ripristino: una copia che non esiste doveva essere rifiutata');

  /* 11 */
  t += 60000; r = await manda(D1, { operazione: 'scrivi', pubblica: [ev('presto', { inizio: '2026-12-02T10:00', fine: '2026-12-02T11:00' })] });
  const piemonte = () => indice().regioni.find(x => x.nome === 'Piemonte');
  if (!piemonte() || piemonte().eventi !== 2 || !Array.isArray(piemonte().uscite)) err('indice: per il Piemonte attesi 2 eventi con le uscite: ' + JSON.stringify(piemonte()));
  const scritto = dep.m.get(S.PUB + 'indice.json'), dopo = Date.parse('2026-12-02T13:00:01Z');   // tre ore dopo la fine, ora italiana (11:00 + 3 = 14:00, cioè le 13:00 in tempo universale)
  if (Q.eventiVivi(piemonte(), t) !== 2 || Q.eventiVivi(piemonte(), dopo - 2000) !== 2 || Q.eventiVivi(piemonte(), dopo) !== 1 || Q.eventiVivi(piemonte(), Date.parse('2027-01-01T00:00:00Z')) !== 0) err('indice: i numeri per regione non scendono al momento giusto');
  const lettore = A.crea({ dove: 'https://archivio.example/', vocabolario: voc, adesso: ora, fetch: fetchFinto });
  await lettore.apri();
  const num = () => (lettore.regioni().find(x => x.nome === 'Piemonte') || { eventi: 0 }).eventi;
  if (num() !== 2) err('lettura: per il Piemonte attesi 2 eventi, letti ' + num());
  t = dopo; if (num() !== 1) err('lettura: uscito un evento, il numero del Piemonte doveva scendere a 1 senza una nuova pubblicazione (LM-46), è ' + num());
  if (dep.m.get(S.PUB + 'indice.json') !== scritto) err('il numero è sceso ma l\'indice è stato riscritto: doveva bastare il conto del telefono');
  r = await manda(D1, { operazione: 'stato' }); if (r.corpo.eventi.some(x => x.id === ID('presto'))) err('un evento uscito dalla mappa è ancora nell\'elenco dello sportello');
  t = Date.parse('2027-01-01T00:00:00Z'); if (lettore.regioni().length) err('lettura: una regione rimasta senza eventi non si deve più mostrare');

  /* 12 */
  t = dopo + 60000;
  await sp.revoca(await D2.k.revoca());
  const p2 = await P.forma({ operazione: 'stato' }, { firma: async () => 'AAAA', dispositivo: { nome: 'Telefono di prova', impronta: D2.pubbliche.firma.impronta }, ora });
  r = await sp.ricevi(JSON.stringify(p2)); if (r.stato !== 403 || r.corpo.motivo !== 'revocata') err('una firma revocata doveva essere rifiutata (403, revocata): ' + JSON.stringify(r));
  let rifiutata = false; try { await sp.ammetti(D2.pubbliche); } catch (x) { rifiutata = !!(x.rifiuto && x.rifiuto.motivo === 'revocata'); }
  if (!rifiutata) err('una firma revocata non si deve poter autorizzare di nuovo');
  const ch = await sp.chiavi(); if (ch.ammesse.length !== 1 || ch.revocate.length !== 1 || JSON.stringify(ch).includes(D1.pubbliche.firma.pubblica)) err('elenco delle chiavi dello sportello inatteso');

  /* 13 */
  const sorgenti = ['sportelli/pubblicazione.js', 'sportelli/bunny-pubblicazione.js', 'sorgenti/moduli/pacchetto.js', 'sorgenti/redazione/sportello-prova.js'].filter(f => fs.existsSync(path.join(RADICE, f)));
  for (const f of sorgenti) {
    const testo = fs.readFileSync(path.join(RADICE, f), 'utf8'), codice = testo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    if (/x-forwarded-for|x-real-ip|remoteAddr|remote_addr|\.ip\b/i.test(codice)) err(f + ': lo sportello non deve leggere l\'indirizzo di chi scrive');
    if (/["'`][A-Za-z0-9+/_-]{60,}["'`]/.test(codice) || /BEGIN [A-Z ]*KEY/.test(testo)) err(f + ': sembra contenere una chiave');
  }
  const tutto = JSON.stringify([...dep.m.entries()]);
  if (/"ip"|indirizzo_ip|x-forwarded/i.test(tutto)) err('nel deposito dello sportello c\'è qualcosa che somiglia a un indirizzo di chi scrive');
  if (Object.keys(JSON.parse(dep.m.get(S.RIS + 'tentativi.json'))).some(k => !P.IMPRONTA.test(k))) err('i tentativi errati si contano solo per impronta del dispositivo');

  /* 14 */
  const { montaSportello } = await import('../strumenti/monta-sportello.mjs');
  const montato = montaSportello();
  if (/\/\*@@[A-Z]+@@\*\//.test(montato)) err('involucro per Bunny: nel file montato resta un segnaposto');
  const bunny = new Map(); let gestore = null;
  const AMB = Object.fromEntries([['ZONA_EVENTI', 'eventi-inventati'], ['CHIAVE_ZONA_EVENTI', 'inventata-uno'], ['ZONA_RISERVATA', 'riservata-inventata'], ['CHIAVE_ZONA_RISERVATA', 'inventata-due'], ['STORAGE_HOST', 'archiviazione.example'], ['ORIGINE_REDAZIONE', 'https://redazione.example']]);
  const archiviazione = async (u, o = {}) => {
    const k = new URL(u).pathname, m = o.method || 'GET';
    if (new URL(u).hostname !== 'archiviazione.example' || (o.headers || {}).AccessKey !== (k.startsWith('/eventi-inventati/') ? 'inventata-uno' : 'inventata-due')) return new Response('', { status: 401 });
    if (m === 'PUT') { bunny.set(k, String(o.body)); return new Response('', { status: 201 }); }
    if (m === 'DELETE') return new Response('', { status: bunny.delete(k) ? 200 : 404 });
    if (k.endsWith('/')) return new Response(JSON.stringify([...bunny.keys()].filter(x => x.startsWith(k) && !x.slice(k.length).includes('/')).map(x => ({ ObjectName: x.slice(k.length), IsDirectory: false }))), { status: 200 });
    return bunny.has(k) ? new Response(bunny.get(k), { status: 200 }) : new Response('', { status: 404 });
  };
  const mondo = { BunnySDK: { net: { http: { serve: f => { gestore = f; } } } }, process: { env: AMB }, fetch: archiviazione, Response, Request, crypto: globalThis.crypto, TextEncoder, TextDecoder, atob, btoa, URL, console };
  mondo.self = mondo;
  try { vm.runInNewContext(montato.replace(/^import .*$/gm, ''), mondo); } catch (x) { err('involucro per Bunny: il file montato non parte: ' + x.message); }
  if (typeof gestore !== 'function') err('involucro per Bunny: non consegna a Bunny la funzione che riceve le richieste');
  else {
    const adesso = c => P.forma(c, { firma: D1.k.firma, dispositivo: { nome: 'Portatile di prova', impronta: D1.pubbliche.firma.impronta } });
    const chiedi = async c => { const x = await gestore(new Request('https://sportello.example/', { method: 'POST', body: JSON.stringify(await adesso(c)) })); return { stato: x.status, origine: x.headers.get('access-control-allow-origin'), corpo: await x.json() }; };
    const traUnMese = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);   // l'involucro usa l'orologio vero: l'evento deve essere futuro in qualunque giorno giri la prova
    r = await chiedi({ operazione: 'stato' });
    if (r.stato !== 403 || r.corpo.motivo !== 'sconosciuto' || r.origine !== 'https://redazione.example') err('involucro per Bunny: senza chiavi ammesse doveva rifiutare (403), rispondendo alla sola app della redazione: ' + JSON.stringify(r));
    bunny.set('/riservata-inventata/chiavi.json', JSON.stringify({ ammesse: [{ dispositivo: 'Portatile di prova', impronta: D1.pubbliche.firma.impronta, pubblica: D1.pubbliche.firma.pubblica }], revocate: [] }));
    r = await chiedi({ operazione: 'scrivi', pubblica: [ev('bunny', { inizio: traUnMese + 'T21:00', fine: traUnMese + 'T23:00' })] });
    const pubb = [...bunny.keys()].filter(k => k.startsWith('/eventi-inventati/')).sort();
    if (r.stato !== 200 || pubb.length !== 2 || pubb[0] !== '/eventi-inventati/indice.json' || !/^\/eventi-inventati\/quadranti\/q21-01-[0-9a-f]{16}\.json$/.test(pubb[1])) err('involucro per Bunny: la pubblicazione non scrive indice e quadrante nella zona degli eventi: ' + JSON.stringify(r).slice(0, 200) + ' ' + pubb);
    if (!bunny.has('/riservata-inventata/stato.json') || ![...bunny.keys()].some(k => k.startsWith('/riservata-inventata/storico/copie/'))) err('involucro per Bunny: elenco riservato e copia datata non stanno nella zona riservata');
    r = await chiedi({ operazione: 'scrivi', ritira: [{ id: ID('bunny'), motivo: 'annullato' }] });
    if (r.stato !== 200 || [...bunny.keys()].filter(k => k.startsWith('/eventi-inventati/quadranti/')).length) err('involucro per Bunny: dopo il ritiro il file del quadrante doveva sparire dalla zona degli eventi');
    const x = await gestore(new Request('https://sportello.example/')); if (x.status !== 405) err('involucro per Bunny: una richiesta che non consegna un pacchetto doveva essere rifiutata (405)');
    const y = await gestore(new Request('https://sportello.example/', { method: 'OPTIONS' })); if (y.status !== 204 || y.headers.get('access-control-allow-methods') !== 'POST') err('involucro per Bunny: la richiesta preliminare del browser non riceve la risposta attesa');
  }

  e.note.push('finestra di ' + P.FINESTRA_MS / 6e4 + ' minuti; ' + S.TENTATIVI + ' firme sbagliate in ' + S.QUARTO_MS / 6e4 + ' minuti, poi ' + S.FERMO_MS / 6e4 + ' minuti di silenzio per quel dispositivo; copie nello storico della prova: ' + [...dep.m.keys()].filter(k => k.startsWith(S.RIS + 'storico/copie/')).length);
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
