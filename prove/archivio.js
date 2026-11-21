/* Prova: la lettura dell'archivio (voce T-022; sorgenti/moduli/archivio.js; libro mastro §§ 2.4 e 3.7).

   Con una rete e una memoria del telefono finte, controlla che il lettore:
   - chieda l'indice sempre ricontrollandolo con il server e i file senza credenziali, senza parametri né identificativi;
   - scarichi soltanto i quadranti chiesti che hanno eventi, una volta sola, e li conservi sul telefono;
   - alla riapertura mostri subito ciò che conserva, anche senza rete, e poi riscarichi solo i quadranti cambiati,
     dimenticando quelli che non hanno più eventi e togliendo dalla memoria i file vecchi;
   - rifiuti un file diverso da quello annunciato dall'indice, un indice manomesso, gli eventi non validi;
   - ricontrolli al ritorno solo se sono passati più di trenta minuti;
   - non mostri più un evento tre ore dopo la sua fine.
   Gli eventi sono inventati. */
'use strict';
const { esito, eseguiDaSola } = require('./comune.js');
const E = require('../sorgenti/moduli/eventi.js');
const Q = require('../sorgenti/moduli/quadranti.js');
const A = require('../sorgenti/moduli/archivio.js');
const { VALIDO } = require('./eventi.js');

const DOVE = 'https://archivio.esempio.invalid/eventi/';
const REG = require('../sorgenti/dati/regioni.json').regioni;
let progressivo = 0;
const L3_ = n => 'abcdefghijklmnopqrstuvwxyz'[Math.floor(n / 676) % 26] + 'abcdefghijklmnopqrstuvwxyz'[Math.floor(n / 26) % 26] + 'abcdefghijklmnopqrstuvwxyz'[n % 26];
const ev = (lat, lng, giorno, ora, extra) => Object.assign(VALIDO(), { id: 'provaarchivio' + L3_(++progressivo) + '-provaaaa',
  lat, lng, inizio: giorno + 'T' + ora, fine: giorno + 'T23:30' }, extra || {});

/* Rete finta: risponde con i file dati, annota ogni richiesta con le sue opzioni. */
function rete(file) {
  const log = [];
  const f = async (url, opz) => {
    log.push({ url, opz: Object.assign({}, opz) });
    if (f.spenta) throw new TypeError('rete assente');
    const k = url.startsWith(DOVE) ? url.slice(DOVE.length) : null;
    if (k == null || !(k in file)) return { ok: false, status: 404, text: async () => 'non trovato' };
    return { ok: true, status: 200, text: async () => file[k] };
  };
  f.log = log; f.file = file; return f;
}
/* Memoria del telefono finta, come Cache Storage. */
function memoriaFinta() {
  const casse = new Map();
  return { casse, open: async nome => {
    if (!casse.has(nome)) casse.set(nome, new Map());
    const c = casse.get(nome);
    return { match: async u => (c.has(u) ? { text: async () => c.get(u) } : undefined),
      put: async (u, r) => { c.set(u, await r.text()); },
      keys: async () => [...c.keys()].map(url => ({ url })), delete: async r => c.delete(r.url || r) };
  } };
}

async function prova() {
  const e = esito('Lettura dell\'archivio');
  const oggi = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date());
  const domani = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date(Date.now() + 864e5));
  const torino = [ev(45.0703, 7.6869, domani, '18:00'), ev(45.0612, 7.7052, domani, '19:00')];   // q21-01 e q21-02
  const milano = [ev(45.4642, 9.19, domani, '20:00')];                                              // q22-04
  const roma = [ev(41.9028, 12.4964, domani, '21:00')];                                             // q14-09
  let adesso = Date.now();
  const scrivi = eventi => Q.costruisci(eventi, { adesso, regioni: REG }).file;

  // 1. Prima apertura: indice, poi solo i quadranti chiesti che hanno eventi.
  const net = rete(scrivi(torino.concat(milano, roma)));
  const cassa = memoriaFinta();
  const L = A.crea({ dove: DOVE, fetch: net, casse: cassa, nomeCassa: 'dl_archivio', adesso: () => adesso });
  if (!(await L.apri())) e.errori.push('alla prima apertura il controllo delle novità non segnala nulla');
  const indice = net.log.find(x => x.url === DOVE + 'indice.json');
  if (!indice || indice.opz.cache !== 'no-cache' || indice.opz.credentials !== 'omit') e.errori.push('l\'indice non si chiede senza credenziali e ricontrollandolo con il server: ' + JSON.stringify(indice && indice.opz));
  await L.carica(Q.intorno('q21-01'));
  const scaricati = net.log.filter(x => /quadranti\//.test(x.url)).map(x => x.url.replace(DOVE + 'quadranti/', '').slice(0, 6)).sort();
  if (scaricati.join() !== 'q21-01,q21-02') e.errori.push('intorno a Torino scaricati: ' + scaricati.join(', ') + ' (attesi q21-01, q21-02)');
  for (const x of net.log) {
    if (x.opz.credentials !== 'omit') e.errori.push('richiesta con le credenziali: ' + x.url);
    if (/[?#]/.test(x.url)) e.errori.push('richiesta con parametri: ' + x.url);
  }
  if (L.eventi().length !== 2) e.errori.push(`dopo Torino: ${L.eventi().length} eventi invece di 2`);
  const n1 = net.log.length; await L.carica(Q.intorno('q21-01'));
  if (net.log.length !== n1) e.errori.push('i quadranti già caricati si scaricano di nuovo');
  await L.carica(Q.intorno('q22-04'));
  if (L.eventi().length !== 3 || L.quadrantiConservati().sort().join() !== 'q21-01,q21-02,q22-04') e.errori.push('dopo Milano: ' + L.quadrantiConservati().join(', '));
  if (L.eventi().some(x => x.ev.id === roma[0].id)) e.errori.push('caricato un evento di Roma senza averlo chiesto');
  const regioni = L.regioni().map(r => r.nome + ' ' + r.eventi).join(', ');
  if (regioni !== 'Lazio 1, Lombardia 1, Piemonte 2') e.errori.push('regioni dell\'indice: ' + regioni);

  // 2. Riapertura senza rete: subito ciò che il telefono conserva.
  net.spenta = true;
  const L2 = A.crea({ dove: DOVE, fetch: net, casse: cassa, nomeCassa: 'dl_archivio', adesso: () => adesso });
  await L2.apri();
  if (L2.eventi().length !== 3 || !L2.pronto()) e.errori.push(`senza rete, alla riapertura: ${L2.eventi().length} eventi invece dei 3 conservati`);
  net.spenta = false;

  // 3. L'archivio cambia: Milano cambia, Torino est (q21-02) non ha più eventi, Torino ovest resta uguale.
  const torino2 = [torino[0]], milano2 = [milano[0], ev(45.47, 9.2, domani, '21:30')];
  Object.keys(net.file).forEach(k => delete net.file[k]); Object.assign(net.file, scrivi(torino2.concat(milano2, roma)));
  const prima = net.log.length;
  const L3 = A.crea({ dove: DOVE, fetch: net, casse: cassa, nomeCassa: 'dl_archivio', adesso: () => adesso });
  await L3.apri();
  const nuove = net.log.slice(prima).map(x => x.url.replace(DOVE, '')).filter(u => u !== 'indice.json').map(u => u.slice(10, 16));
  if (nuove.join() !== 'q22-04') e.errori.push('dopo il cambiamento riscaricati: ' + (nuove.join(', ') || 'nessuno') + ' (atteso solo q22-04)');
  if (L3.quadrantiConservati().sort().join() !== 'q21-01,q22-04') e.errori.push('dopo il cambiamento conservati: ' + L3.quadrantiConservati().join(', '));
  if (L3.eventi().length !== 3) e.errori.push(`dopo il cambiamento: ${L3.eventi().length} eventi invece di 3`);
  const chiavi = [...cassa.casse.get('dl_archivio').keys()].map(u => u.replace(DOVE, '')).sort();
  const attese = ['indice.json'].concat(Object.keys(net.file).filter(k => /q21-01|q22-04/.test(k))).sort();
  if (chiavi.join() !== attese.join()) e.errori.push('memoria del telefono dopo il cambiamento: ' + chiavi.join(', '));

  // 4. Trenta minuti.
  const n4 = net.log.length;
  adesso += 29 * 6e4; await L3.forseControlla();
  if (net.log.length !== n4) e.errori.push('controllo delle novità prima dei trenta minuti');
  adesso += 2 * 6e4; await L3.forseControlla();
  if (net.log.length === n4) e.errori.push('nessun controllo delle novità dopo più di trenta minuti');

  // 5. File manomessi e indici sbagliati.
  const net5 = rete(scrivi(torino));
  const f = Object.keys(net5.file).find(k => k.includes('q21-01'));
  net5.file[f] = net5.file[f].replace('Concerto di prova', 'Concerto cambiato');
  const L5 = A.crea({ dove: DOVE, fetch: net5, adesso: () => adesso });
  await L5.apri(); await L5.carica(['q21-01']);
  if (L5.eventi().length) e.errori.push('accettato un file diverso da quello annunciato dall\'indice');
  const net6 = rete(scrivi(torino)); const ind = JSON.parse(net6.file['indice.json']); ind.griglia.passo_lat = 0.5; net6.file['indice.json'] = JSON.stringify(ind);
  const L6 = A.crea({ dove: DOVE, fetch: net6, adesso: () => adesso });
  await L6.apri();
  if (L6.pronto()) e.errori.push('accettato un indice con un\'altra griglia');

  // 6. Tre ore dopo la fine l'evento non c'è più.
  const L7 = A.crea({ dove: DOVE, fetch: rete(scrivi(torino)), adesso: () => adesso });
  await L7.apri(); await L7.carica(['q21-01']);
  const fine = E.fineMs(torino[0]);
  adesso = fine + 2.9 * 36e5;
  if (L7.eventi().length !== 1) e.errori.push('un evento finito da meno di tre ore non c\'è più');
  adesso = fine + 3.1 * 36e5;
  if (L7.eventi().length !== 0) e.errori.push('un evento finito da più di tre ore c\'è ancora');

  // 7. Senza memoria del telefono funziona lo stesso, solo finché l'app è aperta.
  adesso = Date.now();
  const L8 = A.crea({ dove: DOVE, fetch: rete(scrivi(torino)), adesso: () => Date.now() });
  await L8.apri(); await L8.carica(['q21-01']);
  if (L8.eventi().length !== 1 || L8.persistente()) e.errori.push('senza memoria del telefono il lettore non funziona come atteso');
  e.note.push(`richieste nella prova: ${net.log.length}, tutte senza credenziali e senza parametri; giorno degli eventi ${domani} (oggi ${oggi})`);
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
