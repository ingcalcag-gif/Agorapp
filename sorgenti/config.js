/* Configurazione dell'app: l'unico punto in cui stanno il nome del servizio, il titolare,
   le caselle di posta, gli indirizzi e le versioni dei testi pubblicati.

   Il montaggio (sorgenti/build.js) la legge e:
   - la scrive in ogni uscita come config.js (window.AGR_CONFIG), caricato prima del resto dell'app;
   - ne inserisce i valori nella pagina e nei testi pubblicati al posto dei segnaposto {nome}, {titolare},
     {casella_contatto}, {casella_autorita} e {licenze} (sorgenti/testi-pubblicati.js).
   Nel codice il nome si usa con la costante NOME; nelle traduzioni con la variabile {nome},
   che tr() riempie da sé. Per cambiare nome o recapiti basta cambiare questo file e rimontare.
   Una prova automatica fallisce se il nome compare scritto altrove nei sorgenti.

   Le chiavi della memoria del telefono non contengono il nome (sorgenti/moduli/memoria.js, T-026).
   I valori tra parentesi quadre sono segnaposto: l'app li mostra come testo, senza collegamento. */
'use strict';

module.exports = {
  // Nome del servizio, come compare ovunque nell'app (§ 2.1; § 13.8). Cambia con T-078.
  nome: 'Agorapp',

  // Colori con cui il telefono presenta l'app installata (manifest, T-028): barra in alto e schermata d'avvio.
  aspetto: { colore_tema: '#FFFDF8', colore_sfondo: '#F5F0E8' },

  // Chi risponde del servizio: compare sempre accanto al nome nei testi pubblici (§ 2.1).
  titolare: 'Lorenzo Calcagno',

  // Caselle presso Proton, sul dominio del servizio (§§ 2.6, 7.5): nascono con T-076. contatto è la casella per gli
  // utenti (note legali, informativa, condizioni d'uso, accanto al modulo «Segnala»); autorita compare soltanto nelle
  // note legali, nella parte scritta anche in inglese (T-055).
  caselle: {
    contatto: '[casella di contatto]',
    autorita: '[casella per le autorità]',
  },

  // Indirizzi base. Vuoto = non ancora esistente (la voce del piano che lo crea è indicata accanto).
  indirizzi: {
    app_pubblica: 'https://melodic-custard-8a668b.netlify.app', // oggi Netlify; dominio nuovo con T-074
    app_redazione: '',            // T-033, T-065
    eventi: '',                   // archivio degli eventi su Bunny: T-021, T-065
    mappa: '',                    // file della mappa e mappa.json su Bunny: T-065. Vuoto = prova di Torino in mappa/prova/ (solo dal repository)
    sportello_pubblicazione: '',  // T-038, T-065
    sportello_segnalazioni: '',   // T-051, T-065
    archivio: '',                 // archivio dei registri: T-053, T-065
    ricerca_indirizzi: 'https://photon.komoot.io', // Photon (komoot, Germania), § 2.4
  },

  // Pagine esterne che l'app apre soltanto al tocco della persona: il telefono non le contatta da sé.
  // La prova degli indirizzi (prove/indirizzi.js) ammette nell'app solo questi e gli indirizzi qui sopra.
  collegamenti: [
    'https://www.openstreetmap.org/copyright', // avviso di provenienza della mappa (§ 6.6; § 31.1)
    'https://www.garanteprivacy.it',           // autorità di controllo, nell'informativa (reclamo)
  ],

  // Il modulo «Segnala» (T-050, T-051; § 7.5, misura 3). sportello: false = la segnalazione parte con il messaggio di
  // posta già compilato verso la casella per gli utenti (soluzione ponte, anche al lancio); true = parte, chiusa, per lo
  // sportello delle segnalazioni (indirizzi.sportello_segnalazioni). Si accende con T-071, dopo l'allacciamento (T-065).
  // Sul collegamento di prova il modulo usa lo sportello di prova quando questo ha il lucchetto (decisione del 26/11/2026).
  segnalazioni: { sportello: false },

  // Strumenti che aspettano una decisione prima dell'uso. false = spento con lo sportello vero (con lo sportello di prova
  // funziona sugli eventi inventati). esporta_assistenza: «Esporta per assistenza» (T-049; § 2.6), si accende soltanto
  // dopo il sì nella revisione finale del libro mastro (sezione 6 del piano).
  funzioni: { esporta_assistenza: false },

  // Versioni dei quattro testi pubblicati (Parte VI del libro mastro; T-055, docs/testi-pubblicati.md). Ogni testo sta in
  // sorgenti/testi/<lingua>/<testo>.html. null = in preparazione: il file è un segnaposto e la pagina lo dice. Quando
  // arriva il testo (T-080): { versione: '1.0', data: 'AAAA-MM-GG' }, il giorno della pubblicazione.
  testi: {
    informativa: null,
    dati_locali: null,
    note_legali: null,
    condizioni_uso: null,
  },
};
