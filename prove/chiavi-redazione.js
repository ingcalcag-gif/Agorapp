/* Prova: chiavi della Redazione, cassaforte e marcatore (voci T-034 e T-037 del piano di adeguamento).

   Il modulo sorgenti/moduli/chiavi.js gira qui con gli strumenti di cifratura di Node, che sono quelli del browser, e
   con un deposito finto al posto della base di dati. Tutto è inventato: frasi, nomi, password, identificativi.

   1. Le chiavi nascono solo con una frase lunga abbastanza, scritta due volte uguale, e un nome di dispositivo.
   2. Sul dispositivo le parti segrete sono chiavi non estraibili; la frase non si salva.
   3. La copia di riserva non contiene nulla di leggibile e si apre solo con la frase giusta; un file alterato non si apre.
   4. Firma: si verifica con la parte pubblica; un testo cambiato non passa.
   5. Marcatore (T-037): l'identificativo ha la forma del formato pubblico; il segno si riconosce solo con la chiave;
      cambiare una lettera lo rompe; un altro dispositivo con chiavi sue non lo riconosce, uno aggiunto dalla copia sì.
   6. Più dispositivi: «aggiungi» dà una firma nuova e le chiavi comuni; «ripristina» ridà la stessa firma.
   7. Cassaforte: le password stanno cifrate, si cancellano alla fine dell'evento, la copia è illeggibile e rientra solo
      con le stesse chiavi.
   8. Revoca: le chiavi spariscono dal dispositivo e resta l'avviso per gli sportelli.
   9. Nessuna chiave nel codice o nel repository: il modulo non contiene materiale di chiavi. */
'use strict';
const fs = require('fs');
const path = require('path');
const { RADICE, esito, eseguiDaSola } = require('./comune.js');
const C = require('../sorgenti/moduli/chiavi.js');
const EVF = require('../sorgenti/moduli/eventi.js');

const FRASE = 'cavallo batteria graffetta corretta', ALTRA = 'un’altra frase lunga ma sbagliata';
function deposito() { const m = new Map(); return { m, leggi: async k => m.get(k), scrivi: async (k, v) => { m.set(k, v); }, togli: async k => { m.delete(k); } }; }
async function motivo(f) { try { await f(); return ''; } catch (x) { return x && x.motivo || 'errore senza motivo: ' + (x && x.message); } }

async function prova() {
  const e = esito('Chiavi della Redazione, cassaforte e marcatore');
  const err = s => e.errori.push(s);
  let t = Date.parse('2026-11-22T10:00:00Z'); const ora = () => t;
  const dA = deposito(), A = C.crea({ deposito: dA, ora });

  /* 1 */
  if ((await A.stato()).ci_sono) err('un dispositivo nuovo dice di avere le chiavi');
  for (const [f, r, n, atteso] of [['troppo corta', 'troppo corta', 'Dispositivo', 'frase-corta'], [FRASE, FRASE + ' ', 'Dispositivo', 'frase-diversa'], [FRASE, FRASE, '   ', 'nome'], [FRASE, FRASE, 'x'.repeat(41), 'nome'], [FRASE, FRASE, 'a\u0007b', 'nome']]) {
    const m = await motivo(() => A.genera(f, r, n));
    if (m !== atteso) err(`genera(${JSON.stringify([f.slice(0, 12), n.slice(0, 12)])}): atteso il rifiuto «${atteso}», avuto «${m}»`);
  }
  if (await motivo(() => A.nuovoId()) !== 'mancano') err('senza chiavi non si deve poter creare un identificativo');
  const s = await A.genera(FRASE, FRASE, 'Portatile di prova');
  if (!s.ci_sono || s.dispositivo !== 'Portatile di prova' || !/^([0-9a-f]{4} ){3}[0-9a-f]{4}$/.test(s.firma.impronta) || s.firma.impronta === s.cifratura.impronta) err('genera: lo stato dopo la creazione non è quello atteso');
  if (await motivo(() => A.genera(FRASE, FRASE, 'Ancora')) !== 'ci-sono') err('genera: le chiavi non si devono poter rifare sopra quelle che ci sono');

  /* 2 */
  const voce = dA.m.get('red_chiavi'), k = voce.chiavi;
  const segrete = [k.firma.privata, k.cifratura.privata, k.registro, k.marcatore, k.cassaforte];
  if (segrete.some(x => !(x instanceof CryptoKey) || x.extractable !== false)) err('sul dispositivo le parti segrete devono essere chiavi non estraibili');
  const scritto = JSON.stringify(voce, (n, x) => x instanceof CryptoKey ? '[chiave]' : x);
  if (scritto.includes(FRASE) || /cavallo|graffetta/.test(scritto)) err('la frase è stata salvata sul dispositivo');
  if (!/^[A-Za-z0-9_-]{80,}$/.test(k.firma.pubblica)) err('la parte pubblica della firma non è nella forma attesa');

  /* 3 */
  const copia = await A.copia(), cj = JSON.parse(copia.testo);
  if (cj.tipo !== C.TIPO_COPIA || cj.kdf.giri < 600000 || !cj.dati || Object.keys(cj).some(x => !['tipo', 'v', 'creato', 'dispositivo', 'kdf', 'cifra', 'dati'].includes(x))) err('copia di riserva: campi non attesi o derivazione della chiave troppo debole');
  if (/firma|cifratura|marcatore|registro|cassaforte|pkcs|PRIVATE/i.test(copia.testo.replace(/"tipo": "[^"]*"/, ''))) err('copia di riserva: contiene qualcosa di leggibile');
  if (copia.testo.includes(k.firma.pubblica)) err('copia di riserva: contiene in chiaro la parte pubblica (deve essere tutto cifrato)');
  const B0 = C.crea({ deposito: deposito(), ora });
  if (await motivo(() => B0.daCopia(copia.testo, ALTRA, 'ripristina')) !== 'frase') err('copia di riserva: una frase sbagliata deve essere rifiutata');
  const alterata = JSON.stringify(Object.assign({}, cj, { dati: cj.dati.slice(0, -4) + (cj.dati.endsWith('AAAA') ? 'BBBB' : 'AAAA') }));
  if (await motivo(() => B0.daCopia(alterata, FRASE, 'ripristina')) !== 'frase') err('copia di riserva: un file alterato non deve aprirsi');
  for (const brutto of ['non è json', '{}', JSON.stringify(Object.assign({}, cj, { kdf: Object.assign({}, cj.kdf, { giri: 10 }) })), JSON.stringify(Object.assign({}, cj, { tipo: 'altro' }))])
    if (await motivo(() => B0.daCopia(brutto, FRASE, 'ripristina')) !== 'file') err('copia di riserva: un file che non è una copia deve essere rifiutato come file sbagliato');
  if ((await B0.stato()).ci_sono) err('copia di riserva: un tentativo fallito ha lasciato chiavi sul dispositivo');

  /* 4 */
  const pacchetto = '{"eventi":[],"quando":"2026-11-22T10:00:00Z"}', f = await A.firma(pacchetto);
  if (!(await A.verifica(s.firma.pubblica, pacchetto, f))) err('firma: la parte pubblica non riconosce la firma');
  if (await A.verifica(s.firma.pubblica, pacchetto + ' ', f)) err('firma: un testo cambiato passa la verifica');
  if (await A.verifica(s.cifratura.pubblica, pacchetto, f)) err('firma: la chiave di cifratura non deve verificare una firma');

  /* 5 */
  const ids = []; for (let i = 0; i < 40; i++) ids.push(await A.nuovoId());
  if (new Set(ids).size !== ids.length) err('marcatore: due identificativi uguali');
  for (const id of ids) {
    if (!EVF.ID.test(id) || !C.ID.test(id)) { err('marcatore: «' + id + '» non ha la forma del formato pubblico degli eventi'); break; }
    if (!(await A.viene(id))) { err('marcatore: un identificativo appena creato non viene riconosciuto'); break; }
    const j = 3, cambiato = id.slice(0, j) + (id[j] === 'a' ? 'b' : 'a') + id.slice(j + 1);
    if (await A.viene(cambiato)) { err('marcatore: cambiando una lettera l\'identificativo viene ancora riconosciuto'); break; }
  }
  const Z = C.crea({ deposito: deposito(), ora }); await Z.genera(FRASE, FRASE, 'Un altro progetto');
  if (await Z.viene(ids[0])) err('marcatore: chiavi diverse riconoscono l\'identificativo');
  const testo = await A.controllaTesto(JSON.stringify({ eventi: [{ id: ids[0] }, { id: ids[1] }, { id: 'abcdefghijklmnop-abcdefgh' }], nota: 'x' + ids[2] + 'y non è un identificativo' }));
  if (testo.trovati !== 3 || testo.nostri.length !== 2 || testo.altri.join() !== 'abcdefghijklmnop-abcdefgh') err('«Viene dal nostro archivio?»: il controllo di un testo copiato non dà i conti attesi: ' + JSON.stringify(testo));
  if (await A.viene('non-un-identificativo') || await A.viene('')) err('marcatore: un testo qualunque viene riconosciuto');

  /* 6 */
  const B = C.crea({ deposito: deposito(), ora }), sb = await B.daCopia(copia.testo, FRASE, 'aggiungi', 'Telefono di prova');
  if (sb.firma.impronta === s.firma.impronta || sb.cifratura.impronta !== s.cifratura.impronta) err('dispositivo in più: deve avere una firma sua e la stessa chiave di cifratura');
  if (!(sb.noti.length === 1 && sb.noti[0].dispositivo === 'Portatile di prova' && sb.noti[0].impronta === s.firma.impronta)) err('dispositivo in più: deve ricordare la firma del dispositivo da cui viene la copia');
  if (!(await B.viene(ids[0]))) err('dispositivo in più: deve riconoscere gli identificativi dell\'archivio');
  if (await motivo(() => C.crea({ deposito: deposito(), ora }).daCopia(copia.testo, FRASE, 'aggiungi', '')) !== 'nome') err('dispositivo in più: serve il suo nome');
  const R = C.crea({ deposito: deposito(), ora }), sr = await R.daCopia(copia.testo, FRASE, 'ripristina');
  if (sr.firma.impronta !== s.firma.impronta || sr.dispositivo !== s.dispositivo) err('ripristino: deve ridare la stessa firma e lo stesso nome');
  if (!(await A.verifica(s.firma.pubblica, 'x', await R.firma('x')))) err('ripristino: la firma ripristinata non è quella di prima');
  const cB = JSON.parse((await B.copia()).testo);
  if (cB.dispositivo !== 'Telefono di prova' || (await C.crea({ deposito: deposito(), ora }).daCopia(JSON.stringify(cB), FRASE, 'ripristina')).firma.impronta !== sb.firma.impronta) err('dispositivo in più: la sua copia di riserva deve ridare la sua firma');

  /* 7 */
  const PW = 'parola-inventata-di-venti-caratteri', ev1 = ids[0], ev2 = ids[1];
  await A.cassaforte.metti(ev1, PW, t + 3600e3); await A.cassaforte.metti(ev2, PW + '-2', t + 10 * 3600e3);
  if (await A.cassaforte.leggi(ev1) !== PW || await A.cassaforte.leggi(ev2) !== PW + '-2') err('cassaforte: la password non torna com\'era');
  const cas = JSON.stringify(dA.m.get('red_cassaforte'));
  if (cas.includes('parola-inventata')) err('cassaforte: la password è scritta in chiaro');
  const cc = await A.cassaforte.copia();
  if (cc.testo.includes('parola-inventata') || JSON.parse(cc.testo).tipo !== C.TIPO_CASSAFORTE) err('cassaforte: la copia di sicurezza contiene la password in chiaro o non ha il suo tipo');
  if (JSON.stringify(await B.cassaforte.ripristina(cc.testo)) !== '{"rientrate":2,"scartate":0}' || await B.cassaforte.leggi(ev2) !== PW + '-2') err('cassaforte: con le stesse chiavi la copia deve rientrare');
  if (JSON.stringify(await Z.cassaforte.ripristina(cc.testo)) !== '{"rientrate":0,"scartate":2}') err('cassaforte: con chiavi diverse la copia non deve rientrare');
  if (await motivo(() => A.cassaforte.metti(ev1, '', t + 1)) !== 'cassaforte' || await motivo(() => A.cassaforte.metti(ev1, PW, NaN)) !== 'cassaforte') err('cassaforte: una voce senza password o senza fine deve essere rifiutata');
  t += 2 * 3600e3;   // il primo evento è finito
  if (await A.cassaforte.leggi(ev1) !== null) err('cassaforte: la password di un evento finito si legge ancora');
  const pul = await A.cassaforte.pulisci();
  if (pul.cancellate !== 1 || pul.restano !== 1 || (ev1 in dA.m.get('red_cassaforte').voci)) err('cassaforte: alla fine dell\'evento la password deve essere cancellata: ' + JSON.stringify(pul));
  await A.cassaforte.togli(ev2); if ((await A.cassaforte.pulisci()).restano !== 0) err('cassaforte: togli non toglie');

  /* 8 */
  const avviso = await A.revoca(), dopo = await A.stato();
  if (avviso.tipo !== C.TIPO_REVOCA || avviso.impronta !== s.firma.impronta || dopo.ci_sono || !dopo.revocata || dA.m.get('red_chiavi').chiavi) err('revoca: le chiavi devono sparire dal dispositivo e deve restare l\'avviso con l\'impronta');
  if (await motivo(() => A.firma('x')) !== 'mancano' || await motivo(() => A.nuovoId()) !== 'mancano') err('revoca: dopo la revoca il dispositivo firma ancora');
  await A.dimentica(); if ((await A.stato()).revocata) err('revoca: «dimentica» deve togliere anche il ricordo');
  const avB = B.avvisoRevoca(sb.noti[0].dispositivo, sb.noti[0].impronta);
  if (avB.impronta !== s.firma.impronta || avB.tipo !== C.TIPO_REVOCA) err('revoca: l\'avviso per un altro dispositivo conosciuto non è quello atteso');

  /* 9 */
  const sorg = fs.readFileSync(path.join(RADICE, 'sorgenti', 'moduli', 'chiavi.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  if (/[A-Za-z0-9+/_-]{40,}/.test(sorg)) err('sorgenti/moduli/chiavi.js: contiene una lunga sequenza che somiglia a materiale di chiavi');
  if (!/generateKey\(\{ name: nome, namedCurve: CURVA \}, true/.test(sorg) || !/'pkcs8', daB64\(s\.firma\), ec\('ECDSA'\), false/.test(sorg)) err('sorgenti/moduli/chiavi.js: la parte segreta deve nascere per la copia e restare sul dispositivo come non estraibile');

  e.note.push('firma ECDSA P-256, cifratura ECDH P-256, copia di riserva con PBKDF2 a ' + cj.kdf.giri.toLocaleString('it-IT') + ' giri e AES-GCM; frase di almeno ' + C.FRASE_MIN + ' caratteri');
  e.note.push('marcatore: 40 identificativi creati e verificati, una lettera cambiata li rompe; cassaforte: password cancellate alla fine dell\'evento');
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
