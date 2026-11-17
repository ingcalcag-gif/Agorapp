/* Configurazione dell'app: l'unico punto in cui stanno il nome del servizio, il titolare,
   le caselle di posta, gli indirizzi e le versioni dei testi pubblicati.

   Il montaggio (sorgenti/build.js) la legge e:
   - la scrive in ogni uscita come config.js (window.AGR_CONFIG), caricato prima del resto dell'app;
   - ne inserisce i valori nella pagina e nei testi legali al posto dei segnaposto {nome}, {titolare},
     {casella_contatto}, {versione_legali} e {data_legali}.
   Nel codice il nome si usa con la costante NOME; nelle traduzioni con la variabile {nome},
   che tr() riempie da sé. Per cambiare nome o recapiti basta cambiare questo file e rimontare.
   Una prova automatica fallisce se il nome compare scritto altrove nei sorgenti.

   Le chiavi interne della memoria del telefono (agorapp_…) non sono visibili e restano come sono.
   I valori tra parentesi quadre sono segnaposto: l'app li mostra come testo, senza collegamento. */
'use strict';

module.exports = {
  // Nome del servizio, come compare ovunque nell'app (§ 2.1; § 13.8). Cambia con T-078.
  nome: 'Agorapp',

  // Chi risponde del servizio: compare sempre accanto al nome nei testi pubblici (§ 2.1).
  titolare: 'Lorenzo Calcagno',

  // Caselle presso Proton, sul dominio del servizio (§§ 2.6, 7.5): nascono con T-076.
  caselle: {
    contatto: '[casella di contatto]',
    autorita: '[casella per le autorità]',
  },

  // Indirizzi base. Vuoto = non ancora esistente (la voce del piano che lo crea è indicata accanto).
  indirizzi: {
    app_pubblica: 'https://melodic-custard-8a668b.netlify.app', // oggi Netlify; dominio nuovo con T-074
    app_redazione: '',            // T-033, T-065
    eventi: '',                   // archivio degli eventi su Bunny: T-021, T-065
    mappa: '',                    // file della mappa su Bunny: T-017, T-065
    sportello_pubblicazione: '',  // T-038, T-065
    sportello_segnalazioni: '',   // T-051, T-065
    archivio: '',                 // archivio dei registri: T-053, T-065
    ricerca_indirizzi: 'https://photon.komoot.io', // Photon (komoot, Germania), § 2.4
  },

  // Versioni dei testi pubblicati. data = anno e mese (AAAA-MM).
  testi: {
    // Informativa, «Dati locali» e avvertenze oggi dentro l'app (modelli di parti/legali_it.html).
    legali_in_app: { versione: '1.2', data: '2026-03' },
    // I quattro testi della Parte VI arrivano con T-055 e T-080.
    informativa: null,
    dati_locali: null,
    note_legali: null,
    condizioni_uso: null,
  },
};
