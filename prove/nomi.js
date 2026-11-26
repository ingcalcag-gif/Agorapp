/* Prova: i nomi di persona nei testi degli eventi (sorgenti/moduli/nomi.js; voci T-047, T-048 e T-049 del piano di
   adeguamento; libro mastro, §§ 3.5, 3.13 e 2.6; decisione del 26/11/2026, n. 10).

   Nomi e frasi sono inventati (testi d'esempio approvati da Lorenzo il 26/11/2026).

    1. Le forme: una per riga, senza doppioni né righe vuote, almeno due lettere.
    2. Maiuscole, accenti e apostrofi non contano: «Nicolò Esempio» trova «NICOLO ESEMPIO», «Anna D'Esempio» trova
       «Anna D’Esempio».
    3. Solo parole intere: «Esempio» trova «Via Esempio», non «Esempiotto».
    4. Più forme insieme, senza sovrapposizioni; vince la forma più lunga.
    5. La sostituzione cambia soltanto i punti scelti; il brano mostra il nome con il testo intorno.
    6. In un evento: i punti di ogni campo; nel collegamento della fonte il nome si trova anche scritto con i trattini, e
       il punto non si sostituisce (il collegamento si toglie).
    7. I testi neutri sono quelli approvati. */
'use strict';
const { esito, eseguiDaSola } = require('./comune.js');
const N = require('../sorgenti/moduli/nomi.js');

function prova() {
  const e = esito('Nomi di persona nei testi degli eventi');
  const err = x => e.errori.push(x);
  const uguali = (a, b, cosa) => { if (JSON.stringify(a) !== JSON.stringify(b)) err(cosa + ': atteso ' + JSON.stringify(b) + ', trovato ' + JSON.stringify(a)); };
  const pezzi = (t, f) => N.trova(t, f).map(p => t.slice(p.da, p.a));

  /* 1 */
  uguali(N.forme('Nicolò Esempio\n\n  nicolo esempio  \nX\nDJ Esempio').map(x => x.forma), ['Nicolò Esempio', 'DJ Esempio'], 'forme');
  /* 2 */
  const frase = 'Incontro con NICOLO ESEMPIO e Persona di prova, in arte DJ Esempio.';
  uguali(pezzi(frase, 'Nicolò Esempio\nDJ Esempio\nPersona di prova'), ['NICOLO ESEMPIO', 'Persona di prova', 'DJ Esempio'], 'maiuscole e accenti');
  uguali(pezzi('Concerto di Anna D’Esempio', "Anna D'Esempio"), ['Anna D’Esempio'], 'apostrofi');
  /* 3 */
  const via = 'Laboratorio Esempiotto in Via Esempio 4';
  uguali(pezzi(via, 'Esempio'), ['Esempio'], 'parole intere');
  if (N.trova(via, 'Esempio')[0].da !== via.indexOf('Via Esempio') + 4) err('parole intere: il punto deve essere quello di «Via Esempio»');
  /* 4 */
  uguali(pezzi(frase, 'Esempio\nNicolò Esempio'), ['NICOLO ESEMPIO', 'Esempio'], 'la forma più lunga vince');
  /* 5 */
  const p = N.trova(frase, 'Nicolò Esempio\nDJ Esempio');
  uguali(N.sostituisci(frase, p.slice(0, 1), '[artista]'), 'Incontro con [artista] e Persona di prova, in arte DJ Esempio.', 'sostituzione di un punto solo');
  uguali(N.sostituisci(frase, p, '[artista]'), 'Incontro con [artista] e Persona di prova, in arte [artista].', 'sostituzione di tutti i punti');
  const b = N.estratto(frase, p[0].da, p[0].a, 10);
  if (b.nome !== 'NICOLO ESEMPIO' || !b.prima.endsWith('con ') || !b.dopo.startsWith(' e')) err('brano attorno al nome: ' + JSON.stringify(b));
  /* 6 */
  const ev = { id: 'x', titolo: 'Incontro con Persona di prova', descrizione: 'Persona di prova racconta il laboratorio di quartiere.', luogo: 'Via Esempio 4',
    fonte: { testo: 'Fonte inventata', collegamento: 'https://esempio.invalid/eventi/concerto-nicolo-esempio' } };
  const pe = N.puntiEvento(ev, 'Persona di prova\nNicolò Esempio');
  uguali(pe.map(x => x.campo), ['titolo', 'descrizione', 'fonte.collegamento'], 'campi dell\'evento con il nome');
  if (!pe[2] || !pe[2].collegamento) err('il punto nel collegamento della fonte deve dire collegamento: true');
  const senza = N.conCampo(ev, 'fonte.collegamento', '');
  if ('collegamento' in senza.fonte || senza.fonte.testo !== 'Fonte inventata' || !ev.fonte.collegamento) err('togliere il collegamento non deve toccare il resto dell\'evento né l\'evento di partenza');
  uguali(N.conCampo(ev, 'titolo', 'Incontro con [relatore]').titolo, 'Incontro con [relatore]', 'campo cambiato');
  /* 7 */
  uguali(N.RUOLI, ['[relatore]', '[relatrice]', '[artista]', '[referente]', '[organizzatore]', '[persona]'], 'testi neutri approvati');
  e.note.push('forme, maiuscole, accenti, apostrofi, parole intere, sostituzione, brani e campi dell\'evento controllati');
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
