/* Scarti noti: casi che le prove trovano oggi e che una voce successiva del piano di adeguamento chiude.
   Ogni riga dice quale prova, che cosa (chiave), dove, quante volte, quale voce lo chiude e perché.
   Una prova fallisce se trova un caso che qui non c'è, se il numero dei casi cambia, o se uno scarto non si
   trova più: in quel caso la voce l'ha chiuso e la riga va tolta. Elenco del 17/11/2026 (blocchi 1 e 2). */
'use strict';

const s = (prova, chiave, dove, volte, voce, motivo) => ({ prova, chiave, dove, volte, voce, motivo });

module.exports = [
  /* ---------- Nome fuori dalla configurazione (prove/nome.js) ---------- */
  s('nome', 'agorapp2024', 'sorgenti/parti/app1.js', 1, 'T-033, T-034', 'password di amministrazione scritta nel codice'),
  s('nome', 'agorapp2024', 'Nomeprova/app.js', 1, 'T-033, T-034', 'password di amministrazione scritta nel codice'),
  s('nome', 'agorapp', 'sorgenti/parti/app1.js', 1, 'T-015', "identificativo di un'istanza d'esempio di Agorà"),
  s('nome', 'agorapp', 'sorgenti/parti/app7.js', 1, 'T-015', "identificativo di un'istanza d'esempio di Agorà"),
  s('nome', 'agorapp', 'Nomeprova/app.js', 2, 'T-015', "identificativo di un'istanza d'esempio di Agorà"),
  s('nome', 'agorapp-critica', 'sorgenti/parti/app1.js', 1, 'T-015', "temi dell'istanza d'esempio"),
  s('nome', 'agorapp-critica', 'sorgenti/parti/app7.js', 1, 'T-015', "temi dell'istanza d'esempio"),
  s('nome', 'agorapp-critica', 'Nomeprova/app.js', 2, 'T-015', "temi dell'istanza d'esempio"),
  s('nome', '.c-agorapp', 'sorgenti/parti/style2.css', 3, 'T-015', "colori dell'istanza d'esempio"),
  s('nome', '.c-agorapp', 'sorgenti/parti/style_sezioni.css', 3, 'T-015', "colori dell'istanza d'esempio"),
  s('nome', '.c-agorapp', 'Nomeprova/app.css', 6, 'T-015', "colori dell'istanza d'esempio"),
  s('nome', 'agorapp-demo.json', 'sorgenti/parti/app5.js', 3, 'T-015', 'file della demo, scritto anche nel messaggio di errore'),
  s('nome', 'agorapp-demo.json', 'sorgenti/parti/traduzioni.js', 8, 'T-015', 'messaggio di errore della demo'),
  s('nome', 'agorapp-demo.json', 'Nomeprova/app.js', 3, 'T-015', 'file della demo, scritto anche nel messaggio di errore'),
  s('nome', 'agorapp-demo.json', 'Nomeprova/traduzioni.js', 8, 'T-015', 'messaggio di errore della demo'),
  s('nome', 'agorapp-demo', 'sorgenti/parti/app5.js', 1, 'T-015', 'formato del file della demo'),
  s('nome', 'agorapp-demo', 'Nomeprova/app.js', 1, 'T-015', 'formato del file della demo'),

  /* ---------- Indirizzi esterni (prove/indirizzi.js); piano, sezione 11 ---------- */
  s('indirizzi', 'basemaps.cartocdn.com/gl', 'app.js', 1, 'T-017', 'stile e tasselli della mappa CARTO'),
  s('indirizzi', 'carto.com/attributions', 'index.html', 1, 'T-017', 'attribuzione CARTO sulla mappa'),
  s('indirizzi', 'www.openstreetmap.org/directions', 'app.js', 1, 'T-016', '«Indicazioni» verso OpenStreetMap'),
  s('indirizzi', 'esempio.it', 'app.js', 1, 'T-033, T-042', "esempio nel modello Excel dell'importazione (amministrazione)"),
  s('indirizzi', 'carto.com/privacy', 'app.js', 2, 'T-080', 'testi legali v1.2 in uso (traduzione inglese)'),
  s('indirizzi', 'carto.com/privacy', 'index.html', 2, 'T-080', 'testi legali v1.2 in uso'),
  s('indirizzi', 'osmfoundation.org/wiki', 'app.js', 1, 'T-080', 'testi legali v1.2 in uso (traduzione inglese)'),
  s('indirizzi', 'osmfoundation.org/wiki', 'index.html', 1, 'T-080', 'testi legali v1.2 in uso'),

  /* ---------- Collegamenti esterni senza referrer (prove/collegamenti.js) ---------- */
  s('collegamenti', 'collegamento senza noreferrer: ${indicazioni(e)}', 'app.js', 1, 'T-016', '«Indicazioni» verso OpenStreetMap, sostituito da «Apri nelle mappe del telefono»'),
  s('collegamenti', 'collegamento senza noreferrer: ${esc(l)}', 'app.js', 1, 'T-014', "collegamenti nella scheda di un evento delle Fate, che esce con le Fate"),

  /* ---------- Richieste vere del telefono (prove/browser/richieste.js) ---------- */
  s('richieste', 'basemaps.cartocdn.com/gl', 'app', 1, 'T-017', 'stile della mappa CARTO a ogni apertura (poi tasselli, caratteri e icone della mappa)'),
  s('richieste', 'collegamento senza noreferrer: www.openstreetmap.org', 'scheda', 1, 'T-016', '«Indicazioni» verso OpenStreetMap, sostituito da «Apri nelle mappe del telefono»'),

  /* ---------- Chiavi e password nel codice (prove/chiavi.js) ---------- */
  s('chiavi', 'segreto assegnato a un testo: ADMIN_PW', 'sorgenti/parti/app1.js', 1, 'T-033, T-034', 'password di amministrazione nel codice'),
  s('chiavi', 'segreto assegnato a un testo: FATE_FRASE', 'sorgenti/parti/fate.js', 1, 'T-014', "formula dell'Ordine delle Fate"),
  s('chiavi', 'segreto assegnato a un testo: FATE_FINE', 'sorgenti/parti/fate.js', 1, 'T-014', "formula di chiusura dell'Ordine delle Fate"),
  s('chiavi', 'segreto assegnato a un testo: FATE_CHIAVE', 'sorgenti/parti/fate.js', 1, 'T-014', "chiave dei pacchetti delle Fate, uguale per tutti"),

  /* ---------- Parole vietate (prove/parole.js): rivisti con T-013; gli usi innocui sono nell'elenco AMMESSI della prova ---------- */
  s('parole', 'it: tutti gli eventi', 'sorgenti/parti/fate.js', 1, 'T-014', 'esce con le Fate'),
  s('parole', 'es: todos los eventos', 'traduzioni.js:es', 2, 'T-014, T-015', 'Fate («Todos los eventos de {n}») e guida della demo («Todos los eventos de la demo»)'),
  s('parole', 'fr: tous les événements', 'traduzioni.js:fr', 2, 'T-014, T-015', 'Fate («Tous les événements de {n}») e guida della demo («Tous les événements de la démo»)'),

  /* ---------- Accessibilità (prove/browser/accessibilita.js): regole di axe-core ---------- */
  s('accessibilita', 'label-content-name-mismatch', 'mappa', 2, 'T-057', 'il nome letto dal lettore di schermo non contiene il testo visibile (città, calendario)'),
  s('accessibilita', 'label-content-name-mismatch', 'elenco', 1, 'T-057', 'tasto della città'),
  s('accessibilita', 'label-content-name-mismatch', 'scheda evento', 1, 'T-057', 'tasto della città'),
  s('accessibilita', 'label-content-name-mismatch', 'calendario', 1, 'T-057', 'tasto della città'),
  s('accessibilita', 'label-content-name-mismatch', 'cerca', 1, 'T-057', 'tasto della città'),
  s('accessibilita', 'label-content-name-mismatch', 'impostazioni', 1, 'T-057', 'tasto della città'),
  s('accessibilita', 'scrollable-region-focusable', 'scheda evento', 1, 'T-057', 'zona che scorre non raggiungibile con la tastiera'),
];
