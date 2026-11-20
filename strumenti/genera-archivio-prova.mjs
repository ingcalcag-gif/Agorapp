// Genera l'archivio di prova degli eventi in prova/archivio/ (voce T-021): l'unico archivio che entra nel repository
// (libro mastro § 2.6: la piattaforma del codice non riceve mai eventi reali). Gli eventi sono inventati e stanno in
// strumenti/archivio-prova.json: nomi, enti, sale, vie e collegamenti inventati; città e quartieri veri (Torino e Milano).
//
// Uso, dalla radice del repository o da strumenti/:  node strumenti/genera-archivio-prova.mjs [--da=AAAA-MM-GG]
// I giorni degli eventi contano dalla data indicata (senza --da: oggi, ora italiana): l'archivio resta utile per circa
// sei settimane, poi si rigenera. La stessa data dà sempre gli stessi file (la prova prove/quadranti.js lo controlla).
//
// Gli identificativi hanno la forma del formato (16 caratteri, trattino, 8 caratteri), ricavata dalla chiave di ogni
// evento: il segno è finto, perché la chiave del marcatore (T-037) non c'è ancora e non entrerà mai nel repository.
import { createRequire } from 'module';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const QUI = path.dirname(fileURLToPath(import.meta.url)), RADICE = path.resolve(QUI, '..');
const E = require('../sorgenti/moduli/eventi.js');
const Q = require('../sorgenti/moduli/quadranti.js');
const REGIONI = require('../sorgenti/dati/regioni.json').regioni;
const USCITA = path.join(RADICE, 'prova', 'archivio');

/* Strati e temi dell'app, come li legge la prova del formato. */
export function vocabolarioApp() {
  const strati = vm.runInNewContext(fs.readFileSync(path.join(RADICE, 'sorgenti', 'dati', 'strati.js'), 'utf8') + ';LAYERS');
  const temi = JSON.parse(fs.readFileSync(path.join(RADICE, 'sorgenti', 'parti', 'app7.js'), 'utf8').match(/const TEMI_VOC = (\[[^\]]*\])/)[1]);
  return E.vocabolario(strati, temi);
}

const B32 = 'abcdefghijklmnopqrstuvwxyz234567';
function base32(buf) {
  let bit = 0, val = 0, out = '';
  for (const b of buf) { val = (val << 8) | b; bit += 8; while (bit >= 5) { out += B32[(val >>> (bit - 5)) & 31]; bit -= 5; } }
  return out;
}
const sha = t => crypto.createHash('sha256').update(t).digest();
const idProva = chiave => { const p = base32(sha('archivio di prova:' + chiave)).slice(0, 16); return p + '-' + base32(sha('segno finto di prova:' + p)).slice(0, 8); };
function piuGiorni(aaaammgg, n) {
  const [a, m, g] = aaaammgg.split('-').map(Number), d = new Date(Date.UTC(a, m - 1, g + n));
  return d.toISOString().slice(0, 10);
}
const oggiRoma = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date());

/* Gli eventi del formato, a partire dalla data «da». Campi nell'ordine del formato. */
export function eventiProva(da) {
  const sorgente = JSON.parse(fs.readFileSync(path.join(QUI, 'archivio-prova.json'), 'utf8')).eventi;
  const adesso = E.istante(da + 'T06:00'), modificato = new Date(adesso).toISOString().slice(0, 19) + 'Z';
  return sorgente.map(x => {
    const ev = { id: idProva(x.chiave), titolo: x.titolo, strato: x.strato, sottostrato: x.sottostrato, tema: x.tema,
      inizio: piuGiorni(da, x.giorno) + 'T' + x.inizio,
      fine: x.fine ? piuGiorni(da, x.fine_giorno != null ? x.fine_giorno : x.giorno) + 'T' + x.fine : undefined, durata: x.durata,
      luogo: x.luogo, indirizzo: x.indirizzo, collocazione: x.collocazione || 'indirizzo', descrizione_luogo: x.descrizione_luogo,
      lat: x.lat, lng: x.lng, organizzatore: x.organizzatore, descrizione: x.descrizione, prezzo: x.prezzo, fonte: x.fonte, modificato };
    for (const k of Object.keys(ev)) if (ev[k] === undefined) delete ev[k];
    return ev;
  });
}

/* L'archivio di prova come file {percorso: testo}, per la data «da». */
export function archivioProva(da) {
  return Q.costruisci(eventiProva(da), { adesso: E.istante(da + 'T06:00'), regioni: REGIONI, vocabolario: vocabolarioApp() });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const opz = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
  const da = opz.da || oggiRoma();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(da)) { console.error('--da vuole una data AAAA-MM-GG'); process.exit(1); }
  const { indice, file } = archivioProva(da);
  fs.rmSync(USCITA, { recursive: true, force: true });
  for (const [f, testo] of Object.entries(file)) { fs.mkdirSync(path.dirname(path.join(USCITA, f)), { recursive: true }); fs.writeFileSync(path.join(USCITA, f), testo); }
  const n = Object.values(indice.quadranti).reduce((k, q) => k + q.eventi, 0);
  console.log(`prova/archivio/: ${n} eventi in ${Object.keys(indice.quadranti).length} quadranti (${Object.keys(indice.quadranti).join(', ')}), ` +
    `regioni: ${indice.regioni.map(r => r.nome + ' ' + r.eventi).join(', ')}; giorni dal ${da}`);
}
