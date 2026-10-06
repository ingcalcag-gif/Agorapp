# Sorgenti del restyling

`index.html` è assemblato da questi pezzi con `node sorgenti/build.js`
(lanciato dalla cartella `sorgenti/`). I testi legali italiani si prendono dal mockup `mock_v7.html` se c'è, altrimenti dall'`index.html` già assemblato.

- `parti/style*.css`: stile (dal mockup unico + aggiunte per la mappa vera)
- `parti/body.html`: struttura della pagina
- `parti/app1.js`…`app7.js`: Mappa, schede, Calendario, Off-Grid, Cerca, admin, Temi (un solo modulo)
- `parti/fate.js` e `parti/style_fate.css`: Ordine delle Fate, funzione nascosta (formula, condividi d'oro, pacchetto cifrato nel link, strato degli eventi ricevuti)
- `parti/misure.js`, `parti/misure_kpi.js`, `parti/style_misure.css`: Misure nell'admin (tranche 1): totali del giorno dagli eventi, numeri inseriti a mano, decisioni con soglie, catalogo delle 50 domande. Tutto nella chiave agorapp_misure del telefono dell'admin, esportabile in Excel.
- `parti/sezioni.js`: Progetti, Agorà e Proposte in anteprima (dal mockup, dati dalla demo)
- `parti/traduzioni.js`: testi in EN ES FR AR (chiave = testo italiano)

Si può anche modificare direttamente `index.html`: in quel caso questi pezzi non sono più allineati.

Librerie caricate solo quando servono (non all'apertura): SheetJS 0.18.5 (Excel, solo admin) e jsPDF 2.5.1 (PDF del calendario), da cdnjs.
