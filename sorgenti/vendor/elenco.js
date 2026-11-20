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
  /* Mappa propria (T-017): lettore del file unico, stili e icone di Protomaps, glifi di DM Sans per le scritte.
     Stili e glifi sono generati da mappa/strumenti/ (vedi mappa/LEGGIMI.md). */
  {
    cartella: 'pmtiles-4.5.0', licenza: 'pmtiles.txt',
    file: {
      'pmtiles.js': 'caf981bc46f6327ee7e65d5dc964d89d38a69f60edca2bd4c5c890c21b554c6c',
    },
  },
  {
    cartella: 'protomaps-basemaps-5.7.2', licenza: 'protomaps-basemaps.txt',
    file: {
      'stile-carta-chiaro.json': 'fdbbeab4e19baa613963b14d45e5d902ee9f355a8552b5a056d21c8b471210d0',
      'stile-carta-scuro.json': '86442de9ba623533aeb8bc4ead44dd2e024a16780a8a45871e02fc631e9274e1',
    },
  },
  {
    cartella: 'protomaps-icone-v4', licenza: 'protomaps-icone.txt',
    file: {
      'dark.json': 'bfac76cf7ed5c2aa2992695904056a1c6b07785b7fd20e6c640cb44fd6244a2e',
      'dark.png': '8920f68e8f9f7a4188da43e62a81bbc426532579fff7b5f27aad09e130f4246e',
      'dark@2x.json': '1fb5b123fbe35d2e1f6ac171513ce01df89e671273a417ee89c44886a4c132f0',
      'dark@2x.png': '6e01b4e366d304f27bbd55390511a3d4e39aa1d03eb3e82f873f7ea32e74cbe4',
      'light.json': 'bfac76cf7ed5c2aa2992695904056a1c6b07785b7fd20e6c640cb44fd6244a2e',
      'light.png': 'b6a34640917bdc57d0bd080836db33376371a3312ebe7b849045268015de3481',
      'light@2x.json': '1fb5b123fbe35d2e1f6ac171513ce01df89e671273a417ee89c44886a4c132f0',
      'light@2x.png': '23f6e9df27c2e9a14385763980a24e3608966bfc8192a106058bc2ca959ab563',
    },
  },
  {
    cartella: 'caratteri-mappa/dm-sans-v17', licenza: 'dm-sans.txt', nomeLicenza: 'OFL.txt',
    file: {
      'DM Sans Italic/0-255.pbf': 'f7bb279300f31efaf645a87d30e061e32933d07d86f7d2f2390571c80638269a',
      'DM Sans Italic/256-511.pbf': '1bab33e64de7f32d8175b09bc0773b70d31689ba0d02d2774cc6d12d02bf9b75',
      'DM Sans Italic/512-767.pbf': '2a33e9ea40e02b35bdcd0998c8cb3568473b9605831fc3d9865276380ca317d5',
      'DM Sans Italic/768-1023.pbf': '253a66eb432d70656f74c469eae7bbc811761acd851b64cb259af222bf6139fb',
      'DM Sans Italic/7680-7935.pbf': '9072a9aab78197b8b6fdaec40db6ea5098bb18540be8ad445ddcfa3460bf19eb',
      'DM Sans Italic/8192-8447.pbf': '87125bebb81ad080c2541e7c2f4bfd47af5d03ca17473f40d9c1ec54429a8df4',
      'DM Sans Italic/8448-8703.pbf': 'acb9141e24401280a8be6721734bb1809965f33a4a47eabca655bcc687dbbe27',
      'DM Sans Italic/8704-8959.pbf': 'e2e8c0832bd441a11c4c416ff20399f22505d6128a56388999781bdb9736564f',
      'DM Sans Medium/0-255.pbf': '62cd08773f7cffdbf2196618b01fc55874f586b65397dd6af2feb9ae0fb30735',
      'DM Sans Medium/256-511.pbf': '4e6eeca73c8acd7a328d26de716a5bc82676706a7c34ea9094a037506ce7b4de',
      'DM Sans Medium/512-767.pbf': 'ae44f1a5f8db9fa82c75504fe91d1f6df55ec02dd558b2ce6d7692c4290c3ce2',
      'DM Sans Medium/768-1023.pbf': '4148875ce7965fbad6fbae351b8f653439b740b1fa25b9da03fbdf4f296d24fc',
      'DM Sans Medium/7680-7935.pbf': '5317416ac8035ebcbc72935b15b3d426be620563ed54657325fb1cf64b6d41e9',
      'DM Sans Medium/8192-8447.pbf': 'af3a53c2d43684c4b74291896746cffd7566af5d6b619fccafe129edf08e1cfe',
      'DM Sans Medium/8448-8703.pbf': 'eecbbad83f25098259e8dcd6bf6060680134d5c9f70ca4b0a1fce4ddd12e1619',
      'DM Sans Medium/8704-8959.pbf': 'd64c653f83b9361853e78ef4da77a94167f3b7e13fc19503323a320e58d6e06b',
      'DM Sans Regular/0-255.pbf': 'ef444f5a7c5740178a15c2254967b3c350172873ce9250d739dbe535127fb244',
      'DM Sans Regular/256-511.pbf': 'b56481ee2a6ef374d45cc219b5ae1fbd30cf0bc9716bc55fbc2531cd1a35a0fd',
      'DM Sans Regular/512-767.pbf': 'c055363cbc921aec8151fc0c0dea444a1a7341e85c634b53ec429f1bbc7893f9',
      'DM Sans Regular/768-1023.pbf': '0bcd2e2772887d748cf9c7621e06665f5d459c5fd8fef627167c8e928590ccdc',
      'DM Sans Regular/7680-7935.pbf': '223c2931f5064f19a35efd2a901297d21bc7c0027ccf9c3ec6f10ae74cb2b5b1',
      'DM Sans Regular/8192-8447.pbf': '4de9665c63a4dac3b465bcc124a9808cc426b841be291ba972a5f4b9a8fb4184',
      'DM Sans Regular/8448-8703.pbf': 'b7254fe37a0d05fe09b6c84d26cd3e03ec6f876922b22a1cc51d70d37796bfaa',
      'DM Sans Regular/8704-8959.pbf': 'e68bb919403b50a5a33fe072a2f8a7e1f1fc7e869d0b1eeb3b860275bad6a446',
    },
  },
];
