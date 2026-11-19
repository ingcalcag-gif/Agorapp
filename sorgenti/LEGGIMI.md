# Sorgenti dell'app

L'app si monta con un solo comando, da qualunque cartella del repository:

```
npm run build
```

Il montaggio legge soltanto i file di `sorgenti/` e scrive due uscite:

- `dist/pubblica/`: l'app pubblica, la sola cartella che il sito pubblica;
- `dist/redazione/`: l'app della redazione. Fino al blocco 8 del piano di adeguamento è uguale alla pubblica.

Il sito pubblica soltanto `dist/pubblica/` (lo dice `netlify.toml`). Versioni archiviate (`versioni/`), sorgenti e strumenti restano nel repository ma non vanno sul sito: un file che l'app deve scaricare dal sito va montato dentro `dist/pubblica/`.

In ogni uscita la pagina `index.html` richiama file propri: `config.js`, `app.css`, `traduzioni.js`, `app.js`, `sezioni.js`. Nessun codice JavaScript e nessun foglio di stile stanno dentro la pagina, così le intestazioni di sicurezza potranno accettare soltanto file dello stesso indirizzo. Ogni collegamento porta un numero di versione ricavato dal contenuto (`app.js?v=…`), perché il telefono non tenga copie vecchie.

Alla fine il montaggio controlla la sintassi di ogni file JavaScript prodotto (`node --check`): se un file ha un errore, il comando si ferma e lo dice. `npm run build` monta anche la copia «Nomeprova» e lancia le prove statiche (`prove/`, vedi `prove/LEGGIMI.md`): se una prova non è superata, il comando finisce con un errore.

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

Copia di prova con un altro nome: `npm run build` (o da sola `npm run build:prova-nome`) scrive `dist/prova-nome/pubblica/` con il nome «Nomeprova». Serve solo a provare che il nome cambia ovunque; il sito non la pubblica. La prova `prove/nome.js` fallisce se il nome compare scritto fuori da `config.js`.

`config.js` contiene anche gli indirizzi che l'app può nominare: `indirizzi` (servizi che il telefono contatta) e `collegamenti` (pagine che apre solo al tocco). La prova `prove/indirizzi.js` fallisce se nell'app compare un altro indirizzo esterno.

## I pezzi

- `build.js`: il programma di montaggio.
- `licenze.js`: la pagina delle licenze, da `COMPONENTI_DI_TERZI.md` e `licenze/`.
- `vendor/`: librerie e caratteri di terzi a versione fissa, con `elenco.js` (impronte) e `caratteri.css`.
- `parti/body.html`: struttura della pagina.
- `parti/legali_it.html`: testi legali italiani in uso (versione 1.2), come modelli `<template>`.
- `parti/style*.css`: stile, montato in `app.css` in questo ordine: `style`, `style2`, `style_temi`, `style_sezioni`, `style_misure`. `parti/css_mock.css` non entra nel montaggio.
- `parti/app1.js`…`app7.js` e gli altri pezzi JavaScript: un solo modulo, montato in `app.js` in questo ordine: `app1`, `app2`, `app3`, `app4`, `app5`, `app7`, `misure_kpi`, `misure`, `storico`, `app6` (app1 apre, app6 chiude).
  - app1: dati, stato, filtri, lingue (`tr()`);
  - app2: icone, mappa MapLibre, segnaposto;
  - app3: fogli (Strati, Elenco, schede, Calendario, PDF);
  - app4: Cerca, Scegli i giorni, Off-Grid, conferme;
  - app5: impostazioni, amministrazione, Excel, guida;
  - app7: Temi;
  - misure, misure_kpi, storico: Misure e storico nell'amministrazione;
  - app6: tocchi (`data-az`), tastiera, avvio.
- `parti/sezioni.js`: Agorà e Progetti in forma dimostrativa, montato a parte in `sezioni.js`; i contenuti d'esempio arrivano da `anteprime/` (sezione qui sotto).
- `parti/traduzioni.js`: testi in EN ES FR AR (`window.AGR_TR`, chiave = testo italiano, una riga di JSON).
- `dati/strati.js`: strati della mappa e loro icone (`LAYER_ICONS`, `LAYERS`), inseriti al posto del segnaposto `/*@@LAYERS@@*/` di `app1.js`.
- `dati/legali_tradotti.json`: testi legali tradotti (oggi solo l'inglese), inseriti al posto del segnaposto `/*@@LEGALI@@*/` di `app5.js`.

## Contenuti d'esempio di Agorà e Progetti: `anteprime/`

Dalla voce T-015 Agorà e Progetti sono sempre piene di contenuti d'esempio, con la striscia «Demo · contenuti d'esempio» in ogni schermata, foglio e PDF. Niente va sulla mappa, nel Calendario o nella memoria del telefono, e niente parte: «Vedi sulla mappa» apre la mappa disegnata, «Salva in calendario» e «Vorrei venire anch'io» valgono finché l'app resta aperta, i messaggi e i moduli «Proponi» si provano ma non inviano.

- `anteprime/agora.json` e `anteprime/progetti.json`: i contenuti, in italiano, come approvati il 18/11/2026 (nomi, luoghi ed enti inventati; città e quartieri veri). `ancora` è il giorno attorno a cui sono scritte le date.
- `anteprime/lingue/en.json`, `es.json`, `fr.json`, `ar.json`: testo italiano → traduzione, come `traduzioni.js`. Nomi di progetti, soggetti, quartieri e luoghi restano in italiano. In spagnolo, francese e arabo gli aggettivi e i verbi delle bacheche seguono il genere della persona a cui il testo appartiene; in arabo le righe dei soggetti collettivi e quelle che valgono per più persone sono scritte senza verbo («تنظيم البطولة», «organizzare il torneo»). Se un testo passa a un'altra persona, va rivista anche la sua traduzione.
- `contenuti_esempio.js`: dice quali testi si traducono e scrive in ogni uscita `anteprime/<lingua>.json`, con il nome del servizio al posto di `{nome}`. Un testo senza traduzione resta in italiano.

L'app scarica il file della sua lingua solo quando si apre Agorà, Progetti o «Nelle sezioni» di Temi, e sposta tutte le date di settimane intere, perché l'àncora cada tra oggi e sei giorni da oggi: gli appuntamenti non sono mai passati e gli incontri passati restano passati. Nei testi i mesi si scrivono con i segnaposto `{mese:AAAA-MM-GG}`, `{data:AAAA-MM-GG}` e `{mesi:AAAA-MM-GG/AAAA-MM-GG}`, che si spostano con le date. La prova `prove/anteprime.js` controlla forma, date, nomi reali, segnaposto e traduzioni.

## Librerie e caratteri di terzi: `vendor/`

Dal blocco 2 (T-007) l'app non chiede più nulla a Google Fonts, unpkg o cdnjs. I caratteri DM Sans e DM Serif Display, MapLibre GL 5.24.0, jsPDF 2.5.1 e SheetJS 0.18.5 stanno in `sorgenti/vendor/`, a versione fissa, e il montaggio li copia in `lib/` di ogni uscita con accanto il testo della licenza; jsPDF e SheetJS si caricano solo quando servono. `vendor/elenco.js` annota le impronte dei file: il montaggio si ferma se un file non corrisponde. Provenienza e aggiornamento in `vendor/LEGGIMI.md`.

Dal blocco 3 (T-017) la mappa di base non è più quella di CARTO: è la mappa propria, costruita con Protomaps dai dati di OpenStreetMap. Lettore del file unico (PMTiles), stili «tinta carta», icone e glifi di DM Sans per le scritte stanno anch'essi in `vendor/` e viaggiano con l'app; il file della mappa sta all'indirizzo `indirizzi.mappa` della configurazione e, finché è vuoto, l'app aperta dal repository usa la prova di Torino in `mappa/prova/`. Come si rigenerano stili e glifi, e che cosa sta dove: `mappa/LEGGIMI.md`. Il segnaposto `/*@@MAPPA_LIB@@*/` di `app2.js` diventa, al montaggio, l'elenco dei percorsi di stili, icone e glifi ricavato da `vendor/elenco.js`.
