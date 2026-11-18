/* Scarti noti: casi che le prove trovano oggi e che una voce successiva del piano di adeguamento chiude.
   Ogni riga dice quale prova, che cosa (chiave), dove, quante volte, quale voce lo chiude e perché.
   Una prova fallisce se trova un caso che qui non c'è, se il numero dei casi cambia, o se uno scarto non si
   trova più: in quel caso la voce l'ha chiuso e la riga va tolta. Elenco del 18/11/2026 (blocchi 1 e 2). */
'use strict';

const s = (prova, chiave, dove, volte, voce, motivo) => ({ prova, chiave, dove, volte, voce, motivo });

module.exports = [
  /* ---------- Nome fuori dalla configurazione (prove/nome.js) ---------- */
  s('nome', 'agorapp2024', 'sorgenti/parti/app1.js', 1, 'T-033, T-034', 'password di amministrazione scritta nel codice'),
  s('nome', 'agorapp2024', 'Nomeprova/app.js', 1, 'T-033, T-034', 'password di amministrazione scritta nel codice'),

  /* ---------- Contenuti d'esempio di Agorà e Progetti (prove/anteprime.js) ---------- */
  s('anteprime', 'testo senza traduzione', 'sorgenti/anteprime/lingue/fr.json', 835, 'T-015', 'contenuti d\'esempio ancora da tradurre (passo 3 della voce)'),
  s('anteprime', 'testo senza traduzione', 'sorgenti/anteprime/lingue/ar.json', 835, 'T-015', 'contenuti d\'esempio ancora da tradurre (passo 3 della voce)'),

  /* ---------- Indirizzi esterni (prove/indirizzi.js); piano, sezione 11 ---------- */
  s('indirizzi', 'basemaps.cartocdn.com/gl', 'app.js', 1, 'T-017', 'stile e tasselli della mappa CARTO'),
  s('indirizzi', 'carto.com/attributions', 'index.html', 1, 'T-017', 'attribuzione CARTO sulla mappa'),
  s('indirizzi', 'esempio.it', 'app.js', 1, 'T-033, T-042', "esempio nel modello Excel dell'importazione (amministrazione)"),
  s('indirizzi', 'carto.com/privacy', 'app.js', 2, 'T-080', 'testi legali v1.2 in uso (traduzione inglese)'),
  s('indirizzi', 'carto.com/privacy', 'index.html', 2, 'T-080', 'testi legali v1.2 in uso'),
  s('indirizzi', 'osmfoundation.org/wiki', 'app.js', 1, 'T-080', 'testi legali v1.2 in uso (traduzione inglese)'),
  s('indirizzi', 'osmfoundation.org/wiki', 'index.html', 1, 'T-080', 'testi legali v1.2 in uso'),

  /* ---------- Collegamenti esterni senza referrer (prove/collegamenti.js) ---------- */

  /* ---------- Richieste vere del telefono (prove/browser/richieste.js) ---------- */
  s('richieste', 'basemaps.cartocdn.com/gl', 'app', 1, 'T-017', 'stile della mappa CARTO a ogni apertura (poi tasselli, caratteri e icone della mappa)'),

  /* ---------- Chiavi e password nel codice (prove/chiavi.js) ---------- */
  s('chiavi', 'segreto assegnato a un testo: ADMIN_PW', 'sorgenti/parti/app1.js', 1, 'T-033, T-034', 'password di amministrazione nel codice'),

  /* ---------- Parole vietate (prove/parole.js): rivisti con T-013; gli usi innocui sono nell'elenco AMMESSI della prova ---------- */

  /* ---------- Accessibilità (prove/browser/accessibilita.js): regole di axe-core ---------- */
  s('accessibilita', 'label-content-name-mismatch', 'mappa', 2, 'T-057', 'il nome letto dal lettore di schermo non contiene il testo visibile (città, calendario)'),
  s('accessibilita', 'label-content-name-mismatch', 'elenco', 1, 'T-057', 'tasto della città'),
  s('accessibilita', 'label-content-name-mismatch', 'scheda evento', 1, 'T-057', 'tasto della città'),
  s('accessibilita', 'label-content-name-mismatch', 'calendario', 1, 'T-057', 'tasto della città'),
  s('accessibilita', 'label-content-name-mismatch', 'cerca', 1, 'T-057', 'tasto della città'),
  s('accessibilita', 'label-content-name-mismatch', 'impostazioni', 1, 'T-057', 'tasto della città'),
  s('accessibilita', 'scrollable-region-focusable', 'scheda evento', 1, 'T-057', 'zona che scorre non raggiungibile con la tastiera'),
];
