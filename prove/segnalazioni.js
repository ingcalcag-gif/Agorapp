/* Prova: segnalazione, busta chiusa e sportello delle segnalazioni (voci T-050, T-051 e T-052 del piano di adeguamento;
   documento: docs/segnalazioni.md).

   Il modulo della segnalazione (sorgenti/moduli/segnalazione.js) e la logica dello sportello (sportelli/segnalazioni.js)
   girano qui con un deposito finto in memoria e con le chiavi di sorgenti/moduli/chiavi.js fatte al momento: tutto è
   inventato.

    1. La segnalazione: si prepara con i soli campi ammessi; i controlli fermano motivo mancante, «Di chi è il nome?»
       mancante, descrizione vuota con «Contenuto che ritieni illecito» e con «Altro», email sbagliata, campi in più.
    2. La busta: il telefono la chiude con il lucchetto della Redazione, la apre soltanto la parte segreta di cifratura
       (anche su un secondo dispositivo con le chiavi comuni); una chiave diversa o una busta cambiata danno «busta».
       SHA-256 scritto nel modulo dà le stesse impronte di quello di Node.
    3. Il lucchetto: senza chiavi ammesse lo sportello è «chiuso»; dopo la consegna delle chiavi (la parte pubblica di
       cifratura entra in riservato/chiavi.json) lo sportello dà il lucchetto e il compito a 16 bit.
    4. Il deposito: un compito sbagliato, un'ora fuori dai dieci minuti o una busta fuori forma sono rifiutati; una busta
       giusta si deposita senza nulla di chi scrive; la stessa busta una seconda volta è rifiutata.
    5. Il limite uguale per tutti: 20 in un'ora, 100 in un giorno, 300 in attesa; dopo un'ora si riparte.
    6. La porta firmata: un estraneo è rifiutato; la Redazione legge le buste chiuse e le apre sul dispositivo; «presa»
       le toglie dallo sportello senza lasciare traccia; le operazioni di uno sportello sono rifiutate dall'altro.
    7. I sorgenti non leggono l'indirizzo di chi scrive e non contengono chiavi.
    8. L'involucro per Bunny (sportelli/bunny-segnalazioni.js, montato da strumenti/monta-sportello.mjs), scritto e
       spento: con un deposito finto al posto dell'archiviazione di Bunny dà il lucchetto, riceve, rifiuta e risponde
       soltanto alle due app. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const nodeCrypto = require('crypto');
const { RADICE, esito, eseguiDaSola } = require('./comune.js');
const C = require('../sorgenti/moduli/chiavi.js');
const P = require('../sorgenti/moduli/pacchetto.js');
const S = require('../sorgenti/moduli/segnalazione.js');
const SP = require('../sportelli/pubblicazione.js');
const SS = require('../sportelli/segnalazioni.js');

const FRASE = 'cavallo batteria graffetta corretta';
const ID = 'provasegnalazion-provaaaa';
function depositoChiavi() { const m = new Map(); return { leggi: async k => m.get(k), scrivi: async (k, v) => { m.set(k, v); }, togli: async k => { m.delete(k); } }; }
function deposito() {
  const m = new Map();
  return { m, leggi: async p => (m.has(p) ? m.get(p) : null), scrivi: async (p, t) => { m.set(p, String(t)); }, togli: async p => { m.delete(p); },
    elenca: async pre => [...m.keys()].filter(k => k.startsWith(pre)) };
}
/* la segnalazione inventata approvata il 26/11/2026 */
const PROVA = { id: ID, titolo: 'Evento inventato per la prova', motivo: 'annullato', descrizione: 'Prova: la fonte dice che l’evento è rinviato.', email: 'prova@esempio.invalid', nome: 'Persona di prova' };

async function prova() {
  const e = esito('Segnalazioni: busta chiusa e sportello');
  const err = s => e.errori.push(s);
  let t = Date.parse('2026-12-01T09:00:00Z'); const ora = () => t;

  /* 1 */
  const s0 = S.prepara(PROVA);
  if (S.controlla(s0).length) err('la segnalazione inventata non supera i controlli: ' + S.controlla(s0));
  if (Object.keys(s0).sort().join() !== 'descrizione,email,evento,motivo,nome,v') err('la segnalazione porta campi inattesi: ' + Object.keys(s0));
  const casi = [['motivo mancante', { motivo: '' }, 'motivo'], ['«Di chi è il nome?» mancante', { motivo: 'nome' }, 'chi'], ['illecito senza descrizione', { motivo: 'illecito', descrizione: ' ' }, 'descrizione'],
    ['«Altro» senza descrizione', { motivo: 'altro', descrizione: '' }, 'descrizione'], ['email sbagliata', { email: 'prova@' }, 'email'], ['descrizione troppo lunga', { descrizione: 'x'.repeat(2001) }, 'descrizione']];
  for (const [nome, cambia, campo] of casi) {
    const x = Object.assign(S.prepara(Object.assign({}, PROVA, cambia)), campo === 'descrizione' && cambia.descrizione && cambia.descrizione.length > 2000 ? { descrizione: cambia.descrizione } : {});
    if (!S.controlla(x).includes(campo)) err('controllo: «' + nome + '» doveva fermare il campo ' + campo + ' (' + S.controlla(x) + ')');
  }
  if (!S.controlla(Object.assign({}, s0, { telefono: 'x' })).includes('forma')) err('controllo: un campo in più doveva essere rifiutato');
  const mio = S.prepara(Object.assign({}, PROVA, { motivo: 'nome', chi: 'mio', descrizione: 'Prova: sono Persona di prova e chiedo di togliere il mio nome.' }));
  if (S.controlla(mio).length || mio.chi !== 'mio') err('la segnalazione inventata sul proprio nome non supera i controlli');
  if (S.prepara(Object.assign({}, PROVA, { motivo: 'illecito', buonaFede: 1 })).buonaFede !== true) err('la dichiarazione di buona fede si perde');
  if ('buonaFede' in s0 || 'chi' in s0) err('buona fede e «Di chi è il nome?» viaggiano solo con i loro motivi');

  /* 2 */
  for (const n of [0, 1, 55, 56, 64, 65, 1000]) {
    const b = nodeCrypto.randomBytes(n);
    if (Buffer.from(S.sha256(new Uint8Array(b))).toString('hex') !== nodeCrypto.createHash('sha256').update(b).digest('hex')) err('SHA-256 del modulo: impronta diversa da Node con ' + n + ' byte');
  }
  async function dispositivo(nome, da) {
    const k = C.crea({ deposito: depositoChiavi(), ora });
    if (da) await k.daCopia(JSON.parse((await da.k.copia()).testo), FRASE, 'aggiungi', nome); else await k.genera(FRASE, FRASE, nome);
    const s = await k.stato();
    return { k, pubbliche: await k.pubbliche(), forma: c => P.forma(c, { firma: k.firma, dispositivo: { nome, impronta: s.firma.impronta }, ora }) };
  }
  const D1 = await dispositivo('Portatile di prova'), D2 = await dispositivo('Telefono di prova', D1), D3 = await dispositivo('Estraneo');
  const busta = await S.cifra(s0, D1.pubbliche.cifratura.pubblica);
  if (!S.bustaValida(busta) || JSON.stringify(busta).includes('Persona di prova') || JSON.stringify(busta).includes('esempio.invalid')) err('la busta non è chiusa o non ha la forma attesa');
  const aperta = await S.apri(busta, D1.k.segretoSegnalazione);
  if (JSON.stringify(aperta) !== JSON.stringify(s0)) err('la busta riaperta non dà la segnalazione di partenza');
  if (JSON.stringify(await S.apri(busta, D2.k.segretoSegnalazione)) !== JSON.stringify(s0)) err('un secondo dispositivo con le chiavi comuni non apre la busta');
  for (const [nome, f] of [['un\'altra chiave', () => S.apri(busta, D3.k.segretoSegnalazione)], ['una busta cambiata', () => S.apri(Object.assign({}, busta, { dati: busta.dati.slice(0, -2) + (busta.dati.endsWith('AA') ? 'BB' : 'AA') }), D1.k.segretoSegnalazione)]]) {
    let m = ''; try { await f(); } catch (x) { m = x.motivo; } if (m !== 'busta') err('busta: ' + nome + ' doveva dare «busta», ha dato «' + m + '»');
  }
  let rifiutata = false; try { await S.cifra(S.prepara(Object.assign({}, PROVA, { motivo: 'nome' })), D1.pubbliche.cifratura.pubblica); } catch (x) { rifiutata = x.motivo === 'forma'; }
  if (!rifiutata) err('una segnalazione che non supera i controlli non deve chiudersi nella busta');

  /* 3 */
  const dep = deposito(), pub = SP.crea({ deposito: dep, ora }), ss = SS.crea({ deposito: dep, ora });
  const aperto = async r => ss.ricevi(JSON.stringify(Object.assign({ porta: 'aperta' }, r)));
  let r = await aperto({ operazione: 'lucchetto' });
  if (r.stato !== 503 || r.corpo.motivo !== 'chiuso') err('senza chiavi ammesse lo sportello doveva rispondere «chiuso» (503): ' + JSON.stringify(r));
  await pub.ammetti(D1.pubbliche);
  const voce = JSON.parse(dep.m.get('riservato/chiavi.json')).ammesse[0];
  if (!voce.cifratura || voce.cifratura.pubblica !== D1.pubbliche.cifratura.pubblica) err('la consegna delle chiavi non mette la parte pubblica di cifratura nell\'elenco delle chiavi ammesse');
  r = await aperto({ operazione: 'lucchetto' });
  if (r.stato !== 200 || r.corpo.lucchetto.pubblica !== D1.pubbliche.cifratura.pubblica || r.corpo.compito.bit !== 16 || r.corpo.compito.quando !== new Date(t).toISOString()) err('il lucchetto o il compito non sono quelli attesi: ' + JSON.stringify(r).slice(0, 300));

  /* 4 */
  const t0 = Date.now(), compito = await S.risolvi(busta, r.corpo.compito.quando, r.corpo.compito.bit), msCompito = Date.now() - t0;
  if (!S.verificaCompito(busta, compito, 16)) err('il compito risolto non si verifica');
  const deposita = (b, c) => aperto({ operazione: 'deposita', busta: b, compito: c });
  r = await deposita(busta, Object.assign({}, compito, { n: compito.n + 1 }));
  if (S.verificaCompito(busta, Object.assign({}, compito, { n: compito.n + 1 }), 16) ? false : (r.stato !== 400 || r.corpo.motivo !== 'compito')) err('un compito sbagliato doveva essere rifiutato (400, compito): ' + JSON.stringify(r));
  t += 11 * 6e4; r = await deposita(busta, compito); t -= 11 * 6e4;
  if (r.stato !== 400 || r.corpo.motivo !== 'tempo') err('un compito di più di dieci minuti fa doveva essere rifiutato (400, tempo): ' + JSON.stringify(r));
  r = await deposita(Object.assign({}, busta, { altro: 1 }), compito);
  if (r.stato !== 400 || r.corpo.motivo !== 'forma') err('una busta fuori forma doveva essere rifiutata (400, forma): ' + JSON.stringify(r));
  if ([...dep.m.keys()].some(k => k.startsWith(SS.PRE))) err('i rifiuti hanno lasciato qualcosa nello sportello: ' + [...dep.m.keys()].filter(k => k.startsWith(SS.PRE)));
  r = await deposita(busta, compito);
  if (r.stato !== 200 || r.corpo.esito !== 'fatto') err('una busta giusta doveva essere depositata: ' + JSON.stringify(r));
  const arrivate = [...dep.m.keys()].filter(k => k.startsWith(SS.PRE + 'arrivate/'));
  const file = arrivate.length === 1 ? JSON.parse(dep.m.get(arrivate[0])) : null;
  if (!file || Object.keys(file).sort().join() !== 'arrivo,busta,nome,tipo,v' || JSON.stringify(file.busta) !== JSON.stringify(busta)) err('nello sportello doveva esserci una sola segnalazione, con arrivo e busta e nient\'altro: ' + JSON.stringify(file).slice(0, 200));
  r = await deposita(busta, compito);
  if (r.stato !== 409 || r.corpo.motivo !== 'ripetuto') err('la stessa busta con lo stesso compito doveva essere rifiutata (409, ripetuto): ' + JSON.stringify(r));

  /* 5 */
  const dep5 = deposito(), pub5 = SP.crea({ deposito: dep5, ora }), ss5 = SS.crea({ deposito: dep5, ora, limiti: { bit: 2 } });
  await pub5.ammetti(D1.pubbliche);
  const manda5 = async () => {
    const l = JSON.parse(JSON.stringify((await ss5.ricevi(JSON.stringify({ porta: 'aperta', operazione: 'lucchetto' }))).corpo));
    const b = await S.cifra(s0, l.lucchetto.pubblica);
    return ss5.ricevi(JSON.stringify({ porta: 'aperta', operazione: 'deposita', busta: b, compito: await S.risolvi(b, l.compito.quando, l.compito.bit) }));
  };
  for (let i = 0; i < 20; i++) { r = await manda5(); if (r.stato !== 200) { err('limite: la segnalazione ' + (i + 1) + ' dell\'ora doveva passare: ' + JSON.stringify(r)); break; } t += 1000; }
  r = await manda5(); if (r.stato !== 429 || r.corpo.motivo !== 'troppe') err('limite: la ventunesima segnalazione dell\'ora doveva essere rifiutata (429, troppe): ' + JSON.stringify(r));
  let fatte = 20;
  for (let ora_ = 0; ora_ < 6 && fatte < 100; ora_++) { t += 36e5 + 1000; for (let i = 0; i < 20 && fatte < 100; i++, fatte++) { r = await manda5(); if (r.stato !== 200) { err('limite: dopo un\'ora si doveva ripartire: ' + JSON.stringify(r)); ora_ = 9; break; } t += 1000; } }
  t += 36e5 + 1000; r = await manda5(); if (r.stato !== 429) err('limite: la centunesima segnalazione del giorno doveva essere rifiutata: ' + JSON.stringify(r));
  const conti = JSON.parse(dep5.m.get(SS.PRE + 'conti.json'));
  if (Object.keys(conti).join() !== 'arrivi' || conti.arrivi.some(x => typeof x !== 'number')) err('il conto del limite deve tenere soltanto gli istanti di arrivo: ' + JSON.stringify(conti).slice(0, 120));
  const dep5b = deposito(), ss5b = SS.crea({ deposito: dep5b, ora, limiti: { bit: 2, attesa: 3 } }); await SP.crea({ deposito: dep5b, ora }).ammetti(D1.pubbliche);
  const piena = async () => { const l = (await ss5b.ricevi(JSON.stringify({ porta: 'aperta', operazione: 'lucchetto' }))).corpo, b = await S.cifra(s0, l.lucchetto.pubblica);
    return ss5b.ricevi(JSON.stringify({ porta: 'aperta', operazione: 'deposita', busta: b, compito: await S.risolvi(b, l.compito.quando, l.compito.bit) })); };
  for (let i = 0; i < 3; i++) { await piena(); t += 1000; }
  r = await piena(); if (r.stato !== 429) err('limite: con lo sportello pieno (in attesa il massimo) doveva rifiutare: ' + JSON.stringify(r));

  /* 6 */
  const firmato = async (d, c) => ss.ricevi(JSON.stringify(await d.forma(c)));
  r = await firmato(D3, { operazione: 'segnalazioni' });
  if (r.stato !== 403 || r.corpo.motivo !== 'sconosciuto') err('un estraneo doveva essere rifiutato alla porta firmata (403, sconosciuto): ' + JSON.stringify(r));
  r = await firmato(D1, { operazione: 'segnalazioni' });
  const lista = r.corpo.segnalazioni || [];
  if (r.stato !== 200 || lista.length !== 1 || JSON.stringify(lista[0].busta) !== JSON.stringify(busta)) err('la Redazione non legge la segnalazione depositata: ' + JSON.stringify(r).slice(0, 200));
  else if (JSON.stringify(await S.apri(lista[0].busta, D1.k.segretoSegnalazione)) !== JSON.stringify(s0)) err('la segnalazione letta dalla Redazione non si apre sul dispositivo');
  r = await firmato(D1, { operazione: 'stato' });
  if (r.stato !== 400 || r.corpo.motivo !== 'operazione') err('lo sportello delle segnalazioni doveva rifiutare un\'operazione dello sportello di pubblicazione: ' + JSON.stringify(r));
  r = await pub.ricevi(JSON.stringify(await D1.forma({ operazione: 'segnalazioni' })));
  if (r.stato !== 400 || r.corpo.motivo !== 'operazione') err('lo sportello di pubblicazione doveva rifiutare un\'operazione dello sportello delle segnalazioni: ' + JSON.stringify(r));
  r = await firmato(D1, { operazione: 'presa', nomi: [lista[0] && lista[0].nome] });
  if (r.stato !== 200 || !r.corpo.tolte || r.corpo.tolte.length !== 1) err('«presa» doveva togliere la segnalazione: ' + JSON.stringify(r));
  if ([...dep.m.keys()].some(k => k.startsWith(SS.PRE + 'arrivate/'))) err('dopo la presa in carico nello sportello resta la segnalazione');
  r = await firmato(D1, { operazione: 'presa', nomi: ['../chiavi'] });
  if (r.stato !== 422 || r.corpo.motivo !== 'presa') err('«presa» con un nome fuori forma doveva essere rifiutata (422, presa): ' + JSON.stringify(r));

  /* 7 */
  for (const f of ['sportelli/segnalazioni.js', 'sportelli/bunny-segnalazioni.js', 'sorgenti/moduli/segnalazione.js']) {
    const testo = fs.readFileSync(path.join(RADICE, f), 'utf8'), codice = testo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    if (/x-forwarded-for|x-real-ip|remoteAddr|remote_addr|\.ip\b|cf-connecting-ip/i.test(codice)) err(f + ': lo sportello non deve leggere l\'indirizzo di chi scrive');
    if (/["'`][A-Za-z0-9+/_-]{60,}["'`]/.test(codice) || /BEGIN [A-Z ]*KEY/.test(testo)) err(f + ': sembra contenere una chiave');
  }
  if (/"ip"|indirizzo_ip|x-forwarded/i.test(JSON.stringify([...dep.m.entries()]))) err('nel deposito dello sportello c\'è qualcosa che somiglia a un indirizzo di chi scrive');

  /* 8 */
  const { montaSportello } = await import('../strumenti/monta-sportello.mjs');
  const montato = montaSportello('segnalazioni');
  if (/\/\*@@[A-Z]+@@\*\//.test(montato)) err('involucro per Bunny: nel file montato resta un segnaposto');
  const bunny = new Map(); let gestore = null;
  const AMB = { ZONA_RISERVATA: 'riservata-inventata', CHIAVE_ZONA_RISERVATA: 'inventata-due', STORAGE_HOST: 'archiviazione.example', ORIGINE_APP: 'https://app.example', ORIGINE_REDAZIONE: 'https://redazione.example' };
  const archiviazione = async (u, o = {}) => {
    const k = new URL(u).pathname, m = o.method || 'GET';
    if (new URL(u).hostname !== 'archiviazione.example' || (o.headers || {}).AccessKey !== 'inventata-due' || !k.startsWith('/riservata-inventata/')) return new Response('', { status: 401 });
    if (m === 'PUT') { bunny.set(k, String(o.body)); return new Response('', { status: 201 }); }
    if (m === 'DELETE') return new Response('', { status: bunny.delete(k) ? 200 : 404 });
    if (k.endsWith('/')) return new Response(JSON.stringify([...bunny.keys()].filter(x => x.startsWith(k) && !x.slice(k.length).includes('/')).map(x => ({ ObjectName: x.slice(k.length), IsDirectory: false }))), { status: 200 });
    return bunny.has(k) ? new Response(bunny.get(k), { status: 200 }) : new Response('', { status: 404 });
  };
  const mondo = { BunnySDK: { net: { http: { serve: f => { gestore = f; } } } }, process: { env: AMB }, fetch: archiviazione, Response, Request, crypto: globalThis.crypto, TextEncoder, TextDecoder, atob, btoa, URL, console, setTimeout };
  mondo.self = mondo;
  try { vm.runInNewContext(montato.replace(/^import .*$/gm, ''), mondo); } catch (x) { err('involucro per Bunny: il file montato non parte: ' + x.message); }
  if (typeof gestore !== 'function') err('involucro per Bunny: non consegna a Bunny la funzione che riceve le richieste');
  else {
    const chiedi = async (corpo, origine) => { const x = await gestore(new Request('https://sportello.example/', { method: 'POST', body: corpo, headers: origine ? { origin: origine } : {} })); return { stato: x.status, origine: x.headers.get('access-control-allow-origin'), corpo: await x.json() }; };
    r = await chiedi(JSON.stringify({ porta: 'aperta', operazione: 'lucchetto' }), 'https://app.example');
    if (r.stato !== 503 || r.corpo.motivo !== 'chiuso' || r.origine !== 'https://app.example') err('involucro per Bunny: senza chiavi ammesse doveva rispondere «chiuso» all\'app pubblica: ' + JSON.stringify(r));
    bunny.set('/riservata-inventata/chiavi.json', JSON.stringify({ ammesse: [Object.assign({}, voce, { dal: new Date().toISOString() })], revocate: [] }));
    r = await chiedi(JSON.stringify({ porta: 'aperta', operazione: 'lucchetto' }), 'https://altro.example');
    if (r.stato !== 200 || r.corpo.lucchetto.pubblica !== D1.pubbliche.cifratura.pubblica || r.origine === 'https://altro.example') err('involucro per Bunny: il lucchetto non arriva, o arriva a un sito estraneo: ' + JSON.stringify(r).slice(0, 200));
    const bB = await S.cifra(s0, r.corpo.lucchetto.pubblica), cB = await S.risolvi(bB, r.corpo.compito.quando, r.corpo.compito.bit);
    r = await chiedi(JSON.stringify({ porta: 'aperta', operazione: 'deposita', busta: bB, compito: cB }), 'https://app.example');
    const nella = [...bunny.keys()].filter(k => k.startsWith('/riservata-inventata/segnalazioni/arrivate/'));
    if (r.stato !== 200 || nella.length !== 1) err('involucro per Bunny: la busta non si deposita nella zona riservata: ' + JSON.stringify(r));
    const pk = await P.forma({ operazione: 'segnalazioni' }, { firma: D1.k.firma, dispositivo: { nome: 'Portatile di prova', impronta: D1.pubbliche.firma.impronta } });
    r = await chiedi(JSON.stringify(pk), 'https://redazione.example');
    if (r.stato !== 200 || (r.corpo.segnalazioni || []).length !== 1 || r.origine !== 'https://redazione.example') err('involucro per Bunny: la Redazione non legge la busta depositata: ' + JSON.stringify(r).slice(0, 200));
    const x = await gestore(new Request('https://sportello.example/')); if (x.status !== 405) err('involucro per Bunny: una richiesta senza contenuto doveva essere rifiutata (405)');
  }

  e.note.push('compito a 16 bit risolto in ' + msCompito + ' ms (n = ' + compito.n + '); limite di ' + SS.LIMITI.ora + ' l\'ora, ' + SS.LIMITI.giorno + ' al giorno, ' + SS.LIMITI.attesa + ' in attesa');
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
