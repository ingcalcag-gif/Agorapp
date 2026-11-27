/* Scarti noti: casi che le prove trovano oggi e che una voce successiva del piano di adeguamento chiude.
   Ogni riga dice quale prova, che cosa (chiave), dove, quante volte, quale voce lo chiude e perché.
   Una prova fallisce se trova un caso che qui non c'è, se il numero dei casi cambia, o se uno scarto non si
   trova più: in quel caso la voce l'ha chiuso e la riga va tolta. Elenco del 18/11/2026 (blocchi 1 e 2), aggiornato il 19/11/2026 (blocco 3: CARTO uscito con T-017) e il 27/11/2026 (blocco 15: i testi legali v1.2 sono usciti con T-055). */
'use strict';

const s = (prova, chiave, dove, volte, voce, motivo) => ({ prova, chiave, dove, volte, voce, motivo });

module.exports = [
  /* ---------- Nome fuori dalla configurazione (prove/nome.js) ---------- */

  /* ---------- Indirizzi esterni (prove/indirizzi.js); piano, sezione 11 ---------- */

  /* ---------- Collegamenti esterni senza referrer (prove/collegamenti.js) ---------- */

  /* ---------- Richieste vere del telefono (prove/browser/richieste.js) ---------- */

  /* ---------- Chiavi e password nel codice (prove/chiavi.js) ---------- */

  /* ---------- Parole vietate (prove/parole.js): rivisti con T-013; gli usi innocui sono nell'elenco AMMESSI della prova ---------- */

  /* ---------- Accessibilità (prove/browser/accessibilita.js): regole di axe-core ---------- */
  s('accessibilita', 'label-content-name-mismatch', 'mappa', 2, 'T-057', 'il nome letto dal lettore di schermo non contiene il testo visibile (città, calendario)'),
  s('accessibilita', 'label-content-name-mismatch', 'elenco', 1, 'T-057', 'tasto della città'),
  s('accessibilita', 'label-content-name-mismatch', 'scheda evento', 1, 'T-057', 'tasto della città'),
  s('accessibilita', 'label-content-name-mismatch', 'calendario', 1, 'T-057', 'tasto della città'),
  s('accessibilita', 'label-content-name-mismatch', 'cerca', 1, 'T-057', 'tasto della città'),
  s('accessibilita', 'label-content-name-mismatch', 'impostazioni', 1, 'T-057', 'tasto della città'),
  s('accessibilita', 'label-content-name-mismatch', 'segnala', 1, 'T-057', 'tasto della città (il modulo «Segnala», T-050, non ha casi suoi)'),
  s('accessibilita', 'label-content-name-mismatch', 'segnala, errori', 1, 'T-057', 'tasto della città (il modulo «Segnala», T-050, non ha casi suoi)'),
  s('accessibilita', 'nested-interactive', 'mappa', 2, 'T-057', 'segnaposto della mappa: MapLibre rende interattivo il contenitore che ha dentro il tasto (visibile dal blocco 3, quando la mappa si carica anche nelle prove)'),
  s('accessibilita', 'nested-interactive', 'elenco', 2, 'T-057', 'segnaposto della mappa: MapLibre rende interattivo il contenitore che ha dentro il tasto (visibile dal blocco 3, quando la mappa si carica anche nelle prove)'),
  s('accessibilita', 'nested-interactive', 'scheda evento', 2, 'T-057', 'segnaposto della mappa: MapLibre rende interattivo il contenitore che ha dentro il tasto (visibile dal blocco 3, quando la mappa si carica anche nelle prove)'),
  s('accessibilita', 'nested-interactive', 'cerca', 2, 'T-057', 'segnaposto della mappa: MapLibre rende interattivo il contenitore che ha dentro il tasto (visibile dal blocco 3, quando la mappa si carica anche nelle prove)'),
  s('accessibilita', 'nested-interactive', 'impostazioni', 2, 'T-057', 'segnaposto della mappa: MapLibre rende interattivo il contenitore che ha dentro il tasto (visibile dal blocco 3, quando la mappa si carica anche nelle prove)'),
  s('accessibilita', 'nested-interactive', 'segnala', 2, 'T-057', 'segnaposto della mappa: MapLibre rende interattivo il contenitore che ha dentro il tasto (visibile dal blocco 3, quando la mappa si carica anche nelle prove)'),
  s('accessibilita', 'nested-interactive', 'segnala, errori', 2, 'T-057', 'segnaposto della mappa: MapLibre rende interattivo il contenitore che ha dentro il tasto (visibile dal blocco 3, quando la mappa si carica anche nelle prove)'),
];
