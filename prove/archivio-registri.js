/* Prova: l'archivio dei registri (voce T-053 del piano di adeguamento; documento: docs/archivio.md).

   Il controllo dei file cifrati (sorgenti/moduli/file-cifrati.js) e la logica dello sportello dell'archivio
   (sportelli/archivio.js) girano qui con un deposito finto in memoria, con le chiavi di sorgenti/moduli/chiavi.js fatte
   al momento e con i file inventati di prove/dati/archivio/, salvati con una password dai programmi veri
   (prove/dati/genera-archivio-prova.py): tutto è inventato.

    1. I file cifrati: Excel salvato con la password da Excel (cifratura «agile», AES a 256 bit) e da LibreOffice
       (cifratura «standard», AES a 128 bit) e PDF con AES a 128 e 256 bit sono accettati, con la cifratura trovata;
       Excel e PDF in chiaro, Excel 97 con e senza password, ODS, CSV, PDF con RC4, un file vuoto o tagliato e le schede
       della cifratura cambiate (RC4, DES, senza password) sono rifiutati con il motivo giusto. Il controllo non apre il
       file: la password non serve.
    2. I nomi del § 18.4: i dodici registri e i tre file collegati, scritti anche con le maiuscole sbagliate; i file di
       gestione; gli allegati con il codice della voce; i nomi fuori regola rifiutati.
    3. Lo sportello: un estraneo è rifiutato senza lasciare traccia; un registro cifrato si deposita, con impronta,
       dimensione, cifratura, ora e dispositivo nell'elenco; un file in chiaro, debole, con il nome sbagliato, con
       un'impronta o una dimensione che non tornano non entra; lo stesso nome sostituisce solo se lo si chiede; 10 MB e
       1.000 file al massimo; il file si riscarica uguale; «togli» lo toglie.
    4. I codici FS e NP: dati dallo sportello uno dopo l'altro, mai indietro, anche quando il dispositivo manda un numero
       più basso.
    5. Le buste del registro delle fonti, depositate dalla pubblicazione, si contano e si riscaricano dall'archivio.
    6. Ogni sportello rifiuta le operazioni degli altri; cinque firme sbagliate fermano il dispositivo; nulla esce dalla
       zona riservata.
    7. L'involucro per Bunny (sportelli/bunny-archivio.js, montato da strumenti/monta-sportello.mjs), scritto e spento:
       con un'archiviazione finta riceve un file, lo elenca e lo restituisce, e risponde soltanto all'app della redazione. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const nodeCrypto = require('crypto');
const { RADICE, esito, eseguiDaSola } = require('./comune.js');
const C = require('../sorgenti/moduli/chiavi.js');
const P = require('../sorgenti/moduli/pacchetto.js');
const FC = require('../sorgenti/moduli/file-cifrati.js');
const SA = require('../sportelli/archivio.js');
const SP = require('../sportelli/pubblicazione.js');
const SS = require('../sportelli/segnalazioni.js');
const REGIONI = require('../sorgenti/dati/regioni.json').regioni;
const { vocabolarioApp } = require('./eventi.js');

const FRASE = 'cavallo batteria graffetta corretta';
const NOME = require('../sorgenti/config.js').nome;
const DATI = path.join(RADICE, 'prove', 'dati', 'archivio');
const leggiDato = f => new Uint8Array(fs.readFileSync(path.join(DATI, f)));
function depositoChiavi() { const m = new Map(); return { leggi: async k => m.get(k), scrivi: async (k, v) => { m.set(k, v); }, togli: async k => { m.delete(k); } }; }
function deposito() {
  const m = new Map();
  return { m, leggi: async p => (m.has(p) ? m.get(p) : null), scrivi: async (p, t) => { m.set(p, String(t)); }, togli: async p => { m.delete(p); },
    elenca: async pre => [...m.keys()].filter(k => k.startsWith(pre)) };
}
const b64 = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const sha = b => nodeCrypto.createHash('sha256').update(b).digest('hex');
/* cambia in un file i byte di un testo con altri della stessa lunghezza: il contenitore resta valido */
function cambia(b, da, a) {
  const x = Buffer.from(b), i = x.indexOf(Buffer.from(da, 'latin1'));
  if (i < 0 || da.length !== a.length) throw new Error('prova: non trovo «' + da + '»');
  Buffer.from(a, 'latin1').copy(x, i); return new Uint8Array(x);
}

async function prova() {
  const e = esito('Archivio dei registri: file cifrati e sportello');
  const err = s => e.errori.push(s);

  /* 1 */
  const attesi = [['registro-excel.xlsx', 'xlsx', '', 256, 'agile'], ['registro-libreoffice.xlsx', 'xlsx', '', 128, 'standard'], ['allegato-aes256.pdf', 'pdf', '', 256, 'pdf'], ['allegato-aes128.pdf', 'pdf', '', 128, 'pdf'],
    ['registro-chiaro.xlsx', 'xlsx', 'chiaro'], ['registro-vecchio.xls', 'xls', 'formato'], ['registro-vecchio-pw.xls', 'xls', 'formato'], ['registro-pw.ods', 'ods', 'formato'],
    ['allegato-chiaro.pdf', 'pdf', 'chiaro'], ['allegato-rc4.pdf', 'pdf', 'debole']];
  for (const [f, formato, motivo, bit, schema] of attesi) {
    const r = FC.esamina(leggiDato(f), f);
    if (r.formato !== formato || r.motivo !== motivo) err('file cifrati: ' + f + ' doveva dare ' + formato + '/' + (motivo || 'accettato') + ', dà ' + r.formato + '/' + (r.motivo || 'accettato') + ' ' + r.dettaglio);
    if (!motivo && (!r.cifratura || r.cifratura.metodo !== 'AES' || r.cifratura.bit !== bit || r.cifratura.schema !== schema)) err('file cifrati: ' + f + ' doveva dire AES a ' + bit + ' bit (' + schema + '): ' + JSON.stringify(r.cifratura));
  }
  if (FC.descrivi(FC.esamina(leggiDato('registro-excel.xlsx'), 'x.xlsx').cifratura) !== 'AES a 256 bit · SHA-512 · 100.000 giri · cifratura «agile» di Office') err('file cifrati: la descrizione della cifratura agile non è quella attesa');
  const excel = leggiDato('registro-excel.xlsx'), lo = leggiDato('registro-libreoffice.xlsx');
  const altri = [['un file vuoto', new Uint8Array(0), 'x.xlsx', 'vuoto'], ['un CSV', new TextEncoder().encode('Codice;Data\nD-0001;27/11/2026\n'), 'x.csv', 'formato'],
    ['un file Excel tagliato', excel.slice(0, 700), 'x.xlsx', 'rovinato'], ['un file qualunque', new TextEncoder().encode('testo inventato'), 'x.xlsx', 'formato'],
    ['la scheda standard con RC4', cambia(lo, '\x0ef\x00\x00\x04\x80', '\x01h\x00\x00\x04\x80'), 'x.xlsx', 'debole'],
    ['la scheda agile con DES', cambia(excel, 'cipherAlgorithm="AES"', 'cipherAlgorithm="DES"'), 'x.xlsx', 'debole'],
    ['la scheda agile senza password', cambia(excel, 'keyEncryptor uri="http://schemas.microsoft.com/office/2006/keyEncryptor/password', 'keyEncryptor uri="http://schemas.microsoft.com/office/2006/keyEncryptor/passwerd'), 'x.xlsx', 'formato'],
    ['un PDF tagliato', leggiDato('allegato-aes256.pdf').slice(0, 300), 'x.pdf', 'rovinato']];
  for (const [nome, b, f, motivo] of altri) { const r = FC.esamina(b, f); if (r.motivo !== motivo) err('file cifrati: ' + nome + ' doveva dare «' + motivo + '», dà «' + r.motivo + '» ' + r.dettaglio); }

  /* 2 */
  const giusti = [[NOME + '_Reg19_Decisioni.xlsx', 'registro'], [NOME + '_Reg28bis_Accessibilita.xlsx', 'registro'], [NOME + '_Reg25_Sezione_riservata.xlsx', 'registro'], [NOME + '_Anagrafica_registri.xlsx', 'collegato'],
    [NOME + '_Elenco_beta_tester.xlsx', 'collegato'], [NOME + '_Gestione_Attivita_2026.xlsx', 'gestione'], ['C-0007_risposta.pdf', 'allegato'], ['ACC-S-0002_richiesta.pdf', 'allegato'], ['F-00012_locandina-verifica.xlsx', 'allegato']];
  for (const [n, tipo] of giusti) { const t = SA.tipoNome(n, NOME); if (!t || t.tipo !== tipo || t.nome !== n) err('nomi: «' + n + '» doveva essere un ' + tipo + ': ' + JSON.stringify(t)); }
  const maiuscole = SA.tipoNome(NOME.toLowerCase() + '_reg26_richieste.XLSX', NOME);
  if (!maiuscole || maiuscole.nome !== NOME + '_Reg26_Richieste.xlsx') err('nomi: un registro scritto con le maiuscole sbagliate doveva tornare con il nome giusto: ' + JSON.stringify(maiuscole));
  for (const n of [NOME + '_Reg29_Inventato.xlsx', 'Reg19_Decisioni.xlsx', 'Altro_Reg19_Decisioni.xlsx', NOME + '_Reg19_Decisioni.pdf', 'Z-0001_x.pdf', 'C-7_x.pdf', 'C-0007_x.docx', 'C-0007_.pdf',
    '../' + NOME + '_Reg19_Decisioni.xlsx', 'C-0007_a/b.pdf', NOME + '_Gestione_.xlsx', 'C-0007_risposta.pdf.exe'])
    if (SA.tipoNome(n, NOME)) err('nomi: «' + n + '» doveva essere rifiutato');
  if (SA.nomiFissi(NOME).length !== 15) err('nomi: i nomi fissi dei registri e dei file collegati devono essere 15');

  /* 3 */
  let t = Date.parse('2026-12-01T09:00:00Z'); const ora = () => t;
  const dep = deposito();
  const sp = SP.crea({ deposito: dep, ora, regioni: REGIONI, vocabolario: vocabolarioApp() });
  const sa = SA.crea({ deposito: dep, ora, nome: NOME });
  async function dispositivo(nome) {
    const k = C.crea({ deposito: depositoChiavi(), ora }); await k.genera(FRASE, FRASE, nome);
    const s = await k.stato();
    return { k, pubbliche: await k.pubbliche(), forma: c => P.forma(c, { firma: k.firma, dispositivo: { nome, impronta: s.firma.impronta }, ora }) };
  }
  const D1 = await dispositivo('Portatile di prova'), D3 = await dispositivo('Estraneo');
  const manda = async (d, c, dati) => sa.ricevi(JSON.stringify(dati === undefined ? await d.forma(c) : { pacchetto: await d.forma(c), dati }));
  const archivia = (d, nome, b, extra) => manda(d, Object.assign({ operazione: 'archivia', nome, dimensione: b.length, impronta: sha(b) }, extra || {}), b64(b));
  const REG19 = NOME + '_Reg19_Decisioni.xlsx', REG26 = NOME + '_Reg26_Richieste.xlsx';

  let r = await archivia(D3, REG19, excel);
  if (r.stato !== 403 || r.corpo.motivo !== 'sconosciuto') err('un estraneo doveva essere rifiutato (403, sconosciuto): ' + JSON.stringify(r.corpo));
  if (dep.m.size) err('il rifiuto di un estraneo ha lasciato qualcosa nel deposito: ' + [...dep.m.keys()].join(', '));
  await sp.ammetti(D1.pubbliche);
  r = await archivia(D1, REG19, excel);
  if (r.stato !== 200 || r.corpo.file.nome !== REG19 || r.corpo.file.cifratura.bit !== 256 || r.corpo.sostituito) err('deposito di un registro cifrato: risposta inattesa ' + JSON.stringify(r.corpo).slice(0, 300));
  r = await archivia(D1, REG26, lo);
  if (r.stato !== 200 || r.corpo.file.cifratura.bit !== 128) err('deposito di un registro cifrato da LibreOffice: risposta inattesa ' + JSON.stringify(r.corpo).slice(0, 300));
  r = await archivia(D1, 'C-0007_risposta.pdf', leggiDato('allegato-aes256.pdf'));
  if (r.stato !== 200 || r.corpo.file.categoria !== 'allegato') err('deposito di un allegato PDF cifrato: risposta inattesa ' + JSON.stringify(r.corpo).slice(0, 300));
  const rifiuti = [['un registro in chiaro', REG19, leggiDato('registro-chiaro.xlsx'), {}, 'cifratura', 'chiaro'], ['un .xls con password', REG19, leggiDato('registro-vecchio-pw.xls'), {}, 'cifratura', 'formato'],
    ['un PDF con RC4', 'C-0008_risposta.pdf', leggiDato('allegato-rc4.pdf'), {}, 'cifratura', 'debole'], ['un PDF con il nome di un registro', REG19, leggiDato('allegato-aes256.pdf'), { sostituisci: true }, 'cifratura', 'formato'],
    ['un nome fuori regola', 'Registro.xlsx', excel, {}, 'nome'], ['un nome scritto con le maiuscole sbagliate', REG19.toLowerCase(), excel, {}, 'nome'],
    ['un\'impronta che non torna', REG26, excel, { impronta: sha(lo), sostituisci: true }, 'impronta'], ['una dimensione che non torna', REG26, excel, { dimensione: excel.length + 1, sostituisci: true }, 'forma'],
    ['lo stesso nome senza «sostituisci»', REG19, excel, {}, 'esiste']];
  for (const [nome, n, b, extra, motivo, file] of rifiuti) {
    r = await archivia(D1, n, b, extra);
    if (r.stato === 200 || r.corpo.motivo !== motivo || (file && r.corpo.file !== file)) err('deposito: ' + nome + ' doveva essere rifiutato (' + motivo + (file ? '/' + file : '') + '): ' + JSON.stringify(r.corpo).slice(0, 300));
  }
  r = await manda(D1, { operazione: 'elenca' });
  if (r.stato !== 200 || r.corpo.file.map(x => x.nome).join('|') !== ['C-0007_risposta.pdf', REG19, REG26].sort().join('|') || r.corpo.limiti.dimensione !== 10 * 1024 * 1024 || r.corpo.limiti.numero !== 1000)
    err('elenco: attesi tre file e i limiti di 10 MB e 1.000 file: ' + JSON.stringify(r.corpo).slice(0, 400));
  const primo = r.corpo.file.find(x => x.nome === REG19);
  if (!primo || primo.impronta !== sha(excel) || primo.dimensione !== excel.length || primo.dispositivo.nome !== 'Portatile di prova' || primo.quando !== new Date(t).toISOString()) err('elenco: mancano impronta, dimensione, dispositivo o ora del registro');
  t += 60000;
  r = await archivia(D1, REG19, excel, { sostituisci: true });
  if (r.stato !== 200 || !r.corpo.sostituito) err('lo stesso nome con «sostituisci» doveva sostituire il file: ' + JSON.stringify(r.corpo).slice(0, 200));
  r = await manda(D1, { operazione: 'elenca' });
  if (r.corpo.file.length !== 3 || r.corpo.file.find(x => x.nome === REG19).quando !== new Date(t).toISOString()) err('dopo la sostituzione i file devono essere ancora tre, con l\'ora nuova');
  r = await manda(D1, { operazione: 'scarica', nome: REG26 });
  if (r.stato !== 200 || Buffer.from(r.corpo.dati.replace(/-/g, '+').replace(/_/g, '/'), 'base64').compare(Buffer.from(lo)) !== 0) err('scarica: il file riscaricato non è uguale a quello depositato');
  r = await manda(D1, { operazione: 'scarica', nome: NOME + '_Reg20_Questioni_aperte.xlsx' }); if (r.corpo.motivo !== 'manca') err('scarica: un file che non c\'è doveva dare «manca»');
  r = await manda(D1, { operazione: 'togli', nome: 'C-0007_risposta.pdf' });
  if (r.stato !== 200 || [...dep.m.keys()].some(k => k.includes('C-0007'))) err('togli: il file doveva sparire dal deposito: ' + JSON.stringify(r.corpo));
  r = await manda(D1, { operazione: 'togli', nome: 'C-0007_risposta.pdf' }); if (r.corpo.motivo !== 'manca') err('togli: un file già tolto doveva dare «manca»');
  /* i limiti, su uno sportello a parte con limiti piccoli */
  const dep2 = deposito(), sa2 = SA.crea({ deposito: dep2, ora, nome: NOME, limiti: { dimensione: 9000, numero: 1 } }), sp2 = SP.crea({ deposito: dep2, ora });
  await sp2.ammetti(D1.pubbliche);
  const manda2 = async (nome, b) => sa2.ricevi(JSON.stringify({ pacchetto: await D1.forma({ operazione: 'archivia', nome, dimensione: b.length, impronta: sha(b) }), dati: b64(b) }));
  r = await manda2(REG19, excel); if (r.corpo.motivo !== 'grande') err('limiti: un file più grande del limite doveva essere rifiutato (grande): ' + JSON.stringify(r.corpo));
  r = await manda2(REG26, lo); if (r.stato !== 200) err('limiti: il primo file doveva entrare: ' + JSON.stringify(r.corpo));
  r = await manda2(NOME + '_Reg27_Violazioni.xlsx', lo); if (r.corpo.motivo !== 'troppi') err('limiti: oltre il numero massimo doveva rifiutare (troppi): ' + JSON.stringify(r.corpo));
  r = await manda2(REG26, lo); if (r.corpo.motivo !== 'esiste') err('limiti: la sostituzione non deve contare come un file in più');

  /* 4 */
  const codici = [];
  for (const c of [{ serie: 'FS' }, { serie: 'FS' }, { serie: 'FS', almeno: 10 }, { serie: 'FS' }, { serie: 'FS', almeno: 5 }, { serie: 'NP' }, { serie: 'NP', almeno: 3 }]) {
    r = await manda(D1, Object.assign({ operazione: 'codice' }, c)); codici.push(r.corpo.codice || r.corpo.motivo);
  }
  if (codici.join(' ') !== 'FS-0001 FS-0002 FS-0010 FS-0011 FS-0012 NP-0001 NP-0003') err('codici FS e NP: attesi FS-0001 FS-0002 FS-0010 FS-0011 FS-0012 NP-0001 NP-0003, avuti ' + codici.join(' '));
  for (const c of [{ serie: 'F' }, { serie: 'FS', almeno: 0 }, { serie: 'FS', almeno: 'tre' }]) { r = await manda(D1, Object.assign({ operazione: 'codice' }, c)); if (r.corpo.motivo !== 'forma') err('codici: una richiesta fuori forma doveva essere rifiutata: ' + JSON.stringify(c)); }

  /* 5 */
  const busta = await D1.k.registro.cifra(JSON.stringify({ v: 1, righe: [{ id: 'provaarchivioaaa-provaaaa', titolo: 'Evento inventato' }] }));
  const ev = { id: 'provaarchivioaaa-provaaaa', titolo: 'Evento inventato per l\'archivio', strato: 'musica', inizio: '2026-12-04T21:00', fine: '2026-12-04T23:00', luogo: 'Sala inventata',
    indirizzo: 'Via Inventata 1, Torino', collocazione: 'indirizzo', lat: 45.0703, lng: 7.6869, descrizione: 'Evento inventato per la prova.', fonte: { testo: 'Fonte inventata' }, modificato: '2026-12-01T09:00:00Z' };
  r = await sp.ricevi(JSON.stringify(await D1.forma({ operazione: 'scrivi', pubblica: [ev], registro: busta })));
  if (r.stato !== 200) err('la pubblicazione con la busta del registro non è andata: ' + JSON.stringify(r.corpo).slice(0, 200));
  r = await manda(D1, { operazione: 'elenca' });
  if (r.corpo.buste.numero !== 1 || !r.corpo.buste.ultima) err('elenco: doveva contare la busta del registro delle fonti: ' + JSON.stringify(r.corpo.buste));
  r = await manda(D1, { operazione: 'scarica', buste: true });
  if (r.stato !== 200 || r.corpo.buste.length !== 1 || JSON.parse(r.corpo.buste[0].testo).tipo !== 'registro-righe' || r.corpo.altre) err('scarica le buste: attesa una busta del registro: ' + JSON.stringify(r.corpo).slice(0, 300));
  if (JSON.stringify(r.corpo).includes('Evento inventato\"')) err('scarica le buste: la busta doveva restare chiusa');

  /* 6 */
  r = await manda(D1, { operazione: 'scrivi', pubblica: [ev] }); if (r.corpo.motivo !== 'operazione') err('l\'archivio doveva rifiutare un\'operazione dello sportello di pubblicazione: ' + JSON.stringify(r.corpo));
  r = await sp.ricevi(JSON.stringify(await D1.forma({ operazione: 'elenca' }))); if (r.corpo.motivo !== 'operazione') err('lo sportello di pubblicazione doveva rifiutare un\'operazione dell\'archivio');
  const ss = SS.crea({ deposito: dep, ora });
  r = await ss.ricevi(JSON.stringify(await D1.forma({ operazione: 'codice', serie: 'FS' }))); if (r.corpo.motivo !== 'operazione') err('lo sportello delle segnalazioni doveva rifiutare un\'operazione dell\'archivio');
  r = await manda(D1, { operazione: 'elenca' }, b64(excel)); if (r.corpo.motivo !== 'forma') err('un file accanto a un\'operazione che non lo vuole doveva essere rifiutato (forma)');
  r = await sa.ricevi(JSON.stringify(await D1.forma({ operazione: 'archivia', nome: REG19, dimensione: 3, impronta: sha('abc') }))); if (r.corpo.motivo !== 'forma') err('«archivia» senza il file doveva essere rifiutato (forma)');
  const falso = async () => { const p = await D1.forma({ operazione: 'togli', nome: REG19 }); p.contenuto = p.contenuto.replace('Reg19', 'Reg26'); return JSON.stringify(p); };
  const esiti = []; for (let i = 0; i < 5; i++) { r = await sa.ricevi(await falso()); esiti.push(r.stato + ' ' + r.corpo.motivo); }
  if (esiti.join(',') !== '401 firma,401 firma,401 firma,401 firma,429 fermo') err('tentativi errati: attesi quattro rifiuti e poi il fermo, avuti ' + esiti.join(','));
  if (![...dep.m.keys()].includes('riservato/archivio/file/' + REG26 + '.json')) err('un pacchetto con la firma sbagliata non deve togliere nulla');
  t += 16 * 6e4;
  const fuori = [...dep.m.keys()].filter(k => !k.startsWith('riservato/') && !k.startsWith('pubblico/'));
  if (fuori.length) err('file fuori dalle zone: ' + fuori.join(', '));
  const archivioFuori = [...dep.m.keys()].filter(k => k.startsWith('pubblico/') && /archivio|Reg\d/.test(k));
  if (archivioFuori.length) err('file dell\'archivio nella zona pubblica: ' + archivioFuori.join(', '));
  const sorgente = fs.readFileSync(path.join(RADICE, 'sportelli', 'archivio.js'), 'utf8') + fs.readFileSync(path.join(RADICE, 'sportelli', 'bunny-archivio.js'), 'utf8');
  if (/x-forwarded-for|cf-connecting-ip|remoteAddress|request\.ip\b|headers\.get\(['"]x-real-ip/i.test(sorgente)) err('lo sportello dell\'archivio non deve leggere l\'indirizzo di chi scrive');

  /* 7 */
  const { montaSportello } = await import('../strumenti/monta-sportello.mjs');
  const montato = montaSportello('archivio');
  if (/\/\*@@[A-Z]+@@\*\//.test(montato)) err('involucro per Bunny: nel file montato resta un segnaposto');
  const bunny = new Map(); let gestore = null;
  const AMB = { ZONA_RISERVATA: 'riservata-inventata', CHIAVE_ZONA_RISERVATA: 'inventata-due', STORAGE_HOST: 'archiviazione.example', ORIGINE_REDAZIONE: 'https://redazione.example' };
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
    const chiedi = async corpo => { const x = await gestore(new Request('https://sportello.example/', { method: 'POST', body: corpo, headers: { origin: 'https://redazione.example' } })); return { stato: x.status, origine: x.headers.get('access-control-allow-origin'), corpo: await x.json() }; };
    bunny.set('/riservata-inventata/chiavi.json', JSON.stringify({ ammesse: [{ dispositivo: 'Portatile di prova', impronta: D1.pubbliche.firma.impronta, pubblica: D1.pubbliche.firma.pubblica, dal: new Date().toISOString() }], revocate: [] }));
    const f = async c => P.forma(c, { firma: D1.k.firma, dispositivo: { nome: 'Portatile di prova', impronta: D1.pubbliche.firma.impronta } });
    r = await chiedi(JSON.stringify({ pacchetto: await f({ operazione: 'archivia', nome: REG19, dimensione: excel.length, impronta: sha(excel) }), dati: b64(excel) }));
    if (r.stato !== 200 || r.origine !== 'https://redazione.example' || !bunny.has('/riservata-inventata/archivio/file/' + REG19 + '.json')) err('involucro per Bunny: il registro non si deposita nella zona riservata: ' + JSON.stringify(r).slice(0, 300));
    r = await chiedi(JSON.stringify(await f({ operazione: 'elenca' })));
    if (r.stato !== 200 || r.corpo.file.length !== 1) err('involucro per Bunny: l\'elenco non ha il registro depositato: ' + JSON.stringify(r.corpo).slice(0, 300));
    r = await chiedi(JSON.stringify({ pacchetto: await f({ operazione: 'archivia', nome: REG26, dimensione: 3, impronta: sha('abc') }), dati: b64(Buffer.from('abc')) }));
    if (r.corpo.motivo !== 'cifratura') err('involucro per Bunny: un file in chiaro doveva essere rifiutato');
    const x = await gestore(new Request('https://sportello.example/')); if (x.status !== 405) err('involucro per Bunny: una richiesta senza contenuto doveva essere rifiutata (405)');
  }

  e.note.push(attesi.length + ' file di prova esaminati; limiti: ' + SA.LIMITI.dimensione / 1048576 + ' MB per file, ' + SA.LIMITI.numero + ' file');
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
