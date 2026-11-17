# Sorgenti dell'app

L'app si monta con un solo comando, da qualunque cartella del repository:

```
npm run build
```

Il montaggio legge soltanto i file di `sorgenti/` e scrive due uscite:

- `dist/pubblica/`: l'app pubblica, la sola cartella che il sito pubblica;
- `dist/redazione/`: l'app della redazione. Fino al blocco 8 del piano di adeguamento è uguale alla pubblica.

In ogni uscita la pagina `index.html` richiama file propri: `app.css`, `traduzioni.js`, `app.js`, `sezioni.js`. Nessun codice JavaScript e nessun foglio di stile stanno dentro la pagina, così le intestazioni di sicurezza potranno accettare soltanto file dello stesso indirizzo. Ogni collegamento porta un numero di versione ricavato dal contenuto (`app.js?v=…`), perché il telefono non tenga copie vecchie.

Alla fine il montaggio controlla la sintassi di ogni file JavaScript prodotto (`node --check`): se un file ha un errore, il comando si ferma e lo dice.

**Le uscite non si modificano a mano**: si cambiano i sorgenti e si rimonta. Le uscite stanno nel repository perché il collegamento di prova (githack) e il sito le leggono così come sono.

## I pezzi

- `build.js`: il programma di montaggio.
- `parti/body.html`: struttura della pagina.
- `parti/legali_it.html`: testi legali italiani in uso (versione 1.2), come modelli `<template>`.
- `parti/style*.css`: stile, montato in `app.css` in questo ordine: `style`, `style2`, `style_temi`, `style_sezioni`, `style_fate`, `style_misure`. `parti/css_mock.css` non entra nel montaggio.
- `parti/app1.js`…`app7.js` e gli altri pezzi JavaScript: un solo modulo, montato in `app.js` in questo ordine: `app1`, `app2`, `app3`, `app4`, `app5`, `app7`, `fate`, `misure_kpi`, `misure`, `interesse`, `storico`, `app6` (app1 apre, app6 chiude).
  - app1: dati, stato, filtri, lingue (`tr()`);
  - app2: icone, mappa MapLibre, segnaposto;
  - app3: fogli (Strati, Elenco, schede, Calendario, PDF);
  - app4: Cerca, Scegli i giorni, Off-Grid, conferme;
  - app5: impostazioni, demo, amministrazione, Excel, guida;
  - app7: Temi;
  - fate: Ordine delle Fate (funzione nascosta, da togliere con T-014);
  - misure, misure_kpi, storico: Misure e storico nell'amministrazione;
  - interesse: pulsanti volontari «Mi interessa» (da togliere con T-010);
  - app6: tocchi (`data-az`), tastiera, avvio.
- `parti/sezioni.js`: Progetti e Agorà in anteprima, montato a parte in `sezioni.js`.
- `parti/traduzioni.js`: testi in EN ES FR AR (`window.AGR_TR`, chiave = testo italiano, una riga di JSON).
- `dati/strati.js`: strati della mappa e loro icone (`LAYER_ICONS`, `LAYERS`), inseriti al posto del segnaposto `/*@@LAYERS@@*/` di `app1.js`.
- `dati/legali_tradotti.json`: testi legali tradotti (oggi solo l'inglese), inseriti al posto del segnaposto `/*@@LEGALI@@*/` di `app5.js`.

## Librerie esterne

Fino al blocco 2 del piano (T-007) l'app chiede ancora a servizi esterni i caratteri DM Sans e DM Serif Display (Google Fonts), MapLibre GL 5.24.0 (unpkg) e, solo quando servono, jsPDF 2.5.1 e SheetJS 0.18.5 (cdnjs).
