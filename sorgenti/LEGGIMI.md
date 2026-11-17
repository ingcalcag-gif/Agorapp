# Sorgenti dell'app

L'app si monta con un solo comando, da qualunque cartella del repository:

```
npm run build
```

Il montaggio legge soltanto i file di `sorgenti/` e scrive due uscite:

- `dist/pubblica/`: l'app pubblica, la sola cartella che il sito pubblica;
- `dist/redazione/`: l'app della redazione. Fino al blocco 8 del piano di adeguamento è uguale alla pubblica.

Il sito pubblica soltanto `dist/pubblica/` (lo dice `netlify.toml`). Versioni archiviate (`versioni/`), demo, `dati/`, sorgenti e strumenti restano nel repository ma non vanno sul sito: un file che l'app deve scaricare dal sito va montato dentro `dist/pubblica/`.

In ogni uscita la pagina `index.html` richiama file propri: `config.js`, `app.css`, `traduzioni.js`, `app.js`, `sezioni.js`. Nessun codice JavaScript e nessun foglio di stile stanno dentro la pagina, così le intestazioni di sicurezza potranno accettare soltanto file dello stesso indirizzo. Ogni collegamento porta un numero di versione ricavato dal contenuto (`app.js?v=…`), perché il telefono non tenga copie vecchie.

Alla fine il montaggio controlla la sintassi di ogni file JavaScript prodotto (`node --check`): se un file ha un errore, il comando si ferma e lo dice.

**Le uscite non si modificano a mano**: si cambiano i sorgenti e si rimonta. Le uscite stanno nel repository perché il collegamento di prova (githack) e il sito le leggono così come sono.

## Componenti di terzi e licenze

`COMPONENTI_DI_TERZI.md`, alla radice del repository, elenca i componenti di terzi con versione, licenza e obblighi; `licenze/` contiene i testi integrali delle licenze. Il montaggio (`sorgenti/licenze.js`) legge la tabella «Componenti nell'app» e scrive in ogni uscita la cartella `licenze/`: la pagina `index.html` con titolari, licenze e testi, il suo foglio di stile e i file di testo. L'app la apre da Impostazioni → Documenti → «Licenze dei componenti». Chi aggiunge o aggiorna un componente aggiorna la riga e il testo; la prova `prove/componenti.js` controlla che ogni componente dell'app abbia la sua riga.

## Nome, recapiti e indirizzi: `config.js`

`sorgenti/config.js` è l'unico punto in cui stanno il nome del servizio, il titolare, le caselle di posta, gli indirizzi base e le versioni dei testi pubblicati. Per cambiare nome basta cambiare `nome` e rimontare.

- Nel codice il nome si usa con la costante `NOME`, la casella di contatto con `CASELLA` o `casellaHtml()`, i nomi dei file scaricati con `nomeFile()`.
- Nelle traduzioni e nei testi passati a `tr()` il nome è la variabile `{nome}`, che `tr()` riempie da sé.
- Nella pagina e nei testi legali il montaggio sostituisce `{nome}`, `{titolare}`, `{casella_contatto}`, `{versione_legali}` e `{data_legali}`.
- I valori tra parentesi quadre (per esempio `[casella di contatto]`) sono segnaposto: l'app li mostra come testo, senza collegamento.
- Le chiavi interne della memoria del telefono (`agorapp_…`) non sono visibili e restano come sono.

Copia di prova con un altro nome: `npm run build:prova-nome` scrive `dist/prova-nome/pubblica/` con il nome «Nomeprova». Serve solo a provare che il nome cambia ovunque; il sito non la pubblica.

## I pezzi

- `build.js`: il programma di montaggio.
- `licenze.js`: la pagina delle licenze, da `COMPONENTI_DI_TERZI.md` e `licenze/`.
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
