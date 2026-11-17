/* Librerie e caratteri di terzi ospitati con l'app (voce T-007; libro mastro § 2.4, «Caratteri e librerie»;
   § 3.11, librerie a versione fissa). Il montaggio copia ogni file in lib/ di ciascuna uscita, accanto al testo
   della sua licenza (da licenze/), e la prova prove/componenti.js controlla che ogni file sia identico a quello
   annotato qui (impronta SHA-256): un file cambiato per sbaglio, o sostituito, fa fallire la prova.

   Per aggiornare un componente: leggerne la licenza (§ 6.6, regola 1), sostituire i file in una cartella con la
   nuova versione nel nome, aggiornare qui cartella, file e impronte, la riga di COMPONENTI_DI_TERZI.md e il testo
   in licenze/. Provenienza dei file: vedi sorgenti/vendor/LEGGIMI.md. */
'use strict';

module.exports = [
  {
    cartella: 'maplibre-gl-5.24.0', licenza: 'maplibre-gl-js.txt',
    file: {
      'maplibre-gl.js': '45a9b07a9189ce56054c620a947ccf41e291e58c95e9b61533b740aaa65ee5cb',
      'maplibre-gl.css': 'ab1e70d59ec40465bae7e7030da2f3ccf28133fd502e62bd598eefbadfd7a732',
    },
  },
  {
    cartella: 'jspdf-2.5.1', licenza: 'jspdf.txt',
    file: { 'jspdf.umd.min.js': '98ccf17aa10c20bb1301762618fcc9b6ab3a4e7f26b6071d64d0b41154df3875' },
  },
  {
    cartella: 'sheetjs-0.18.5', licenza: 'sheetjs.txt',
    file: { 'xlsx.full.min.js': 'c9506197caf809a075b6dee1da0d36fb19da7158ffe8a88e7b0c96c5d8623c99' },
  },
  {
    cartella: 'caratteri/dm-sans-v17', licenza: 'dm-sans.txt', nomeLicenza: 'OFL.txt',
    file: {
      'dm-sans-latin-opsz-normal.woff2': 'ca72d2bcea8f4daa783dbdfa2d9b46068c3ce38168e05918fb867aa453b4f890',
      'dm-sans-latin-ext-opsz-normal.woff2': '5d18d31d23ada61ebee1d589b11d5da30db9e158f589d5e35221ba2b1a45de54',
    },
  },
  {
    cartella: 'caratteri/dm-serif-display-v17', licenza: 'dm-serif-display.txt', nomeLicenza: 'OFL.txt',
    file: {
      'dm-serif-display-latin-400-normal.woff2': 'fdf61e20fd2c0108e0ea28da4daca0035205b4b7fc031a3974b865b704de160a',
      'dm-serif-display-latin-ext-400-normal.woff2': '3af47815d6183efcee27a5717970acfe31153365e9b842e62d30c04e86c0613a',
    },
  },
];
