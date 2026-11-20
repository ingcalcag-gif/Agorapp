/* Prova: il formato pubblico degli eventi e la sua funzione di controllo (voce T-020; docs/formato-eventi.md).

   1. Il documento e il modulo sorgenti/moduli/eventi.js elencano gli stessi campi, con lo stesso obbligo.
   2. Un evento valido passa; ogni variante sbagliata è rifiutata con l'errore sul campo giusto: campi sconosciuti
      (immagine, password, provenienza, nome di chi segnala), collegamenti non https, testi troppo lunghi, date
      impossibili, fine prima dell'inizio, fine e durata insieme, evento collocato a mano senza descrizione del luogo,
      punto fuori dall'Italia, strato, sottostrato e tema che non esistono nell'app.
   3. Le ore italiane diventano il momento giusto anche nelle notti del cambio dell'ora; l'uscita è tre ore dopo la fine.
   4. Il modulo si carica anche nel browser, senza require, in window.AGR_MODULI.eventi.
   Gli eventi sono inventati e servono solo alla prova. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { RADICE, esito, eseguiDaSola } = require('./comune.js');
const E = require('../sorgenti/moduli/eventi.js');

/* Strati e temi dell'app, letti dai sorgenti come li usa il montaggio. */
function vocabolarioApp() {
  const strati = vm.runInNewContext(fs.readFileSync(path.join(RADICE, 'sorgenti', 'dati', 'strati.js'), 'utf8') + ';LAYERS');
  const temi = JSON.parse(fs.readFileSync(path.join(RADICE, 'sorgenti', 'parti', 'app7.js'), 'utf8').match(/const TEMI_VOC = (\[[^\]]*\])/)[1]);
  return E.vocabolario(strati, temi);
}

const VALIDO = () => ({
  id: 'k3m7q2a5x4t6w7p5-r2d4f6h3', titolo: 'Concerto di prova', strato: 'musica', sottostrato: 'jazz', tema: 'Cultura libera',
  inizio: '2026-12-04T21:00', fine: '2026-12-04T23:30', luogo: 'Sala inventata', indirizzo: 'Via Inventata 1, Torino',
  collocazione: 'indirizzo', lat: 45.0703, lng: 7.6869, organizzatore: 'Associazione inventata',
  descrizione: 'Evento inventato per la prova automatica.\nSeconda riga.', prezzo: 'Gratuito',
  fonte: { testo: 'Sito di chi organizza', collegamento: 'https://esempio.example/evento' }, modificato: '2026-11-20T10:15:00Z',
});

// [descrizione, modifica, campo che l'errore deve nominare]
const SBAGLIATI = [
  ['campo immagine', e => { e.immagine = 'https://esempio.example/locandina.jpg'; }, 'immagine'],
  ['campo image', e => { e.image = 'x'; }, 'image'],
  ['campo password', e => { e.password = 'segreta'; }, 'password'],
  ['provenienza interna', e => { e.provenienza = 'consenso'; }, 'provenienza'],
  ['nome di chi segnala', e => { e.segnalato_da = 'Nome Inventato'; }, 'segnalato_da'],
  ['collegamento separato', e => { e.link = 'https://esempio.example'; }, 'link'],
  ['campo in più nella fonte', e => { e.fonte.consultata = '2026-11-20'; }, 'fonte.consultata'],
  ['manca il titolo', e => { delete e.titolo; }, 'titolo'],
  ['titolo vuoto', e => { e.titolo = '   '; }, 'titolo'],
  ['titolo di 101 caratteri', e => { e.titolo = 'x'.repeat(101); }, 'titolo'],
  ['titolo su due righe', e => { e.titolo = 'riga\nriga'; }, 'titolo'],
  ['titolo con carattere di controllo', e => { e.titolo = 'a\u0007b'; }, 'titolo'],
  ['descrizione di 2001 caratteri', e => { e.descrizione = 'x'.repeat(2001); }, 'descrizione'],
  ['luogo di 121 caratteri', e => { e.luogo = 'x'.repeat(121); }, 'luogo'],
  ['prezzo come numero', e => { e.prezzo = 10; }, 'prezzo'],
  ['manca la fonte', e => { delete e.fonte; }, 'fonte'],
  ['fonte senza testo', e => { e.fonte = { collegamento: 'https://esempio.example' }; }, 'fonte.testo'],
  ['collegamento http', e => { e.fonte.collegamento = 'http://esempio.example/evento'; }, 'fonte.collegamento'],
  ['collegamento javascript', e => { e.fonte.collegamento = 'javascript:alert(1)'; }, 'fonte.collegamento'],
  ['collegamento con password', e => { e.fonte.collegamento = 'https://nome:segreta@esempio.example/'; }, 'fonte.collegamento'],
  ['collegamento con spazi', e => { e.fonte.collegamento = 'https://esempio.example/a b'; }, 'fonte.collegamento'],
  ['collegamento di 501 caratteri', e => { e.fonte.collegamento = 'https://esempio.example/' + 'x'.repeat(477); }, 'fonte.collegamento'],
  ['identificativo senza segno', e => { e.id = 'k3m7q2a5x4t6w7p5'; }, 'id'],
  ['identificativo con l\'ora', e => { e.id = '1732099200000'; }, 'id'],
  ['inizio senza ora', e => { e.inizio = '2026-12-04'; }, 'inizio'],
  ['30 febbraio', e => { e.inizio = '2027-02-30T21:00'; delete e.fine; }, 'inizio'],
  ['ora 24', e => { e.inizio = '2026-12-04T24:00'; delete e.fine; }, 'inizio'],
  ['fine prima dell\'inizio', e => { e.fine = '2026-12-04T20:00'; }, 'fine'],
  ['fine dopo più di un anno', e => { e.fine = '2027-12-10T20:00'; }, 'fine'],
  ['fine e durata insieme', e => { e.durata = 90; }, 'fine e durata'],
  ['durata zero', e => { delete e.fine; e.durata = 0; }, 'durata'],
  ['durata di due giorni', e => { delete e.fine; e.durata = 2880; }, 'durata'],
  ['durata scritta a parole', e => { delete e.fine; e.durata = '2 ore'; }, 'durata'],
  ['collocazione sconosciuta', e => { e.collocazione = 'gps'; }, 'collocazione'],
  ['a mano senza descrizione del luogo', e => { e.collocazione = 'a_mano'; }, 'descrizione_luogo'],
  ['latitudine come testo', e => { e.lat = '45.07'; }, 'lat'],
  ['sette decimali', e => { e.lat = 45.0703123; }, 'lat'],
  ['punto a Parigi', e => { e.lat = 48.8566; e.lng = 2.3522; }, 'lat e lng'],
  ['modificato senza fuso', e => { e.modificato = '2026-11-20T10:15:00'; }, 'modificato'],
  ['strato che non esiste', e => { e.strato = 'astrologia'; delete e.sottostrato; }, 'strato'],
  ['sottostrato di un altro strato', e => { e.sottostrato = 'calcio'; }, 'sottostrato'],
  ['tema che non esiste', e => { e.tema = 'Tema inventato'; }, 'tema'],
  ['strato con caratteri strani', e => { e.strato = 'Musica!'; }, 'strato'],
];

/* I campi della tabella «Un evento» di docs/formato-eventi.md, con l'obbligo. */
function campiDelDocumento() {
  const md = fs.readFileSync(path.join(RADICE, 'docs', 'formato-eventi.md'), 'utf8');
  const sezione = md.split(/^## /m).find(s => s.startsWith('Un evento'));
  return Object.fromEntries([...sezione.matchAll(/^\| `([a-z_]+)` \| ([^|]+) \|/gm)].map(m => [m[1], m[2].trim()]));
}

function prova() {
  const e = esito('Formato degli eventi');
  const voc = vocabolarioApp();

  // 1. Documento e modulo.
  const doc = campiDelDocumento();
  for (const [k, def] of Object.entries(E.CAMPI)) {
    if (!(k in doc)) { e.errori.push(`docs/formato-eventi.md: manca il campo «${k}»`); continue; }
    const obb = doc[k] === 'sì';
    if (k !== 'descrizione_luogo' && obb !== def.obbligatorio) e.errori.push(`campo «${k}»: obbligatorio nel modulo ${def.obbligatorio ? 'sì' : 'no'}, nel documento «${doc[k]}»`);
  }
  for (const k of Object.keys(doc)) if (!(k in E.CAMPI)) e.errori.push(`docs/formato-eventi.md: il campo «${k}» non è nel modulo`);

  // 2. Valido e sbagliati.
  const ok = E.controlla(VALIDO(), { vocabolario: voc });
  if (ok.length) e.errori.push('l\'evento valido è rifiutato: ' + ok.join('; '));
  const aMano = Object.assign(VALIDO(), { collocazione: 'a_mano', descrizione_luogo: 'Nel cortile, seconda porta a sinistra.' });
  if (!E.valido(aMano, { vocabolario: voc })) e.errori.push('un evento collocato a mano con la descrizione del luogo è rifiutato: ' + E.controlla(aMano, { vocabolario: voc }).join('; '));
  const minimo = VALIDO(); for (const k of ['sottostrato', 'tema', 'fine', 'organizzatore', 'prezzo']) delete minimo[k]; delete minimo.fonte.collegamento;
  if (!E.valido(minimo, { vocabolario: voc })) e.errori.push('l\'evento con i soli campi obbligatori è rifiutato: ' + E.controlla(minimo, { vocabolario: voc }).join('; '));
  for (const [nome, cambia, campo] of SBAGLIATI) {
    const x = VALIDO(); cambia(x);
    const err = E.controlla(x, { vocabolario: voc });
    if (!err.length) e.errori.push(`«${nome}»: l'evento è accettato`);
    else if (!err.some(m => m.startsWith(campo + ':'))) e.errori.push(`«${nome}»: errore atteso su «${campo}», trovato: ${err.join('; ')}`);
  }
  for (const non of [null, 'testo', [], 42]) if (E.valido(non)) e.errori.push('accettato come evento: ' + JSON.stringify(non));
  e.note.push(`${SBAGLIATI.length} varianti sbagliate rifiutate sul campo giusto; ${Object.keys(E.CAMPI).length} campi nel formato`);

  // 3. Ore italiane.
  const ore = [['2026-12-04T21:00', '2026-12-04T20:00:00.000Z'], ['2026-07-14T21:00', '2026-07-14T19:00:00.000Z'],
    ['2026-10-25T02:30', '2026-10-25T00:30:00.000Z'], ['2026-03-29T02:30', '2026-03-29T01:30:00.000Z'], ['2026-03-29T03:00', '2026-03-29T01:00:00.000Z']];
  for (const [t, utc] of ore) { const i = E.istante(t); if (i == null || new Date(i).toISOString() !== utc) e.errori.push(`istante(${t}) = ${i == null ? null : new Date(i).toISOString()}, atteso ${utc}`); }
  const u = E.uscitaMs(VALIDO());
  if (u !== Date.parse('2026-12-04T22:30:00Z') + 3 * 36e5) e.errori.push('uscita dalla mappa non tre ore dopo la fine: ' + new Date(u).toISOString());
  const d = Object.assign(VALIDO(), { durata: 90 }); delete d.fine;
  if (E.fineMs(d) !== Date.parse('2026-12-04T21:30:00Z')) e.errori.push('la fine con la durata è sbagliata');

  // 4. Nel browser.
  const finestra = { self: null, URL }; finestra.self = finestra;   // come nel browser: URL c'è
  vm.runInNewContext(fs.readFileSync(path.join(RADICE, 'sorgenti', 'moduli', 'eventi.js'), 'utf8'), finestra);
  if (!finestra.AGR_MODULI || !finestra.AGR_MODULI.eventi || !finestra.AGR_MODULI.eventi.valido(VALIDO())) e.errori.push('nel browser il modulo non si trova in AGR_MODULI.eventi');
  return e;
}

module.exports = { prova, VALIDO, vocabolarioApp };
eseguiDaSola(module, prova);
