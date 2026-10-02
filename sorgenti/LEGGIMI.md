# Sorgenti del restyling

`index.html` è assemblato da questi pezzi con `node sorgenti/build.js`
(lanciato dalla cartella che contiene `parti/`, `build.js` e il mockup `mock_v7.html`, da cui prende i testi legali).

- `parti/style*.css`: stile (dal mockup unico + aggiunte per la mappa vera)
- `parti/body.html`: struttura della pagina
- `parti/app1.js`…`app7.js`: Mappa, schede, Calendario, Off-Grid, Cerca, admin, Temi (un solo modulo)
- `parti/sezioni.js`: Progetti, Agorà e Proposte in anteprima (dal mockup, dati dalla demo)
- `parti/traduzioni.js`: testi in EN ES FR AR (chiave = testo italiano)

Si può anche modificare direttamente `index.html`: in quel caso questi pezzi non sono più allineati.
