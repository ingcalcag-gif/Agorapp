# Testi pubblicati e riserva dell'estrazione

Voci T-055 e T-056 del piano di adeguamento (blocco 15). Libro mastro: Parte VI (capp. 29-32, testi di riferimento); § 7.5, misura 1 (le due caselle); § 10.6 (nessun indirizzo postale); § 12.1, regola 2, e § 12.4 (responsabilità editoriale); § 31.1 (note legali da ogni schermata); § 32.1, scelta 4 (testo leggibile dai programmi); § 6.5 e § 12.3 (riserva dell'estrazione); § 1.3, regola 1 (si pubblica soltanto ciò che è in atto).

## I quattro testi

| Testo | File | Configurazione | Che cosa deve contenere (controllato a ogni montaggio) |
| --- | --- | --- | --- |
| Informativa sulla privacy (cap. 29) | `sorgenti/testi/it/informativa.html` | `testi.informativa` | `{titolare}`, `{casella_contatto}`, il riquadro separato del diritto di opposizione (`<section class="opposizione">`, art. 21, par. 4, GDPR), la sezione «Dove stanno i dati» (`id="dove-stanno-i-dati"`, § 2.6) |
| Scheda «Dati locali» (cap. 30) | `sorgenti/testi/it/dati-locali.html` | `testi.dati_locali` | Nulla di fisso; con T-080 deve corrispondere riga per riga all'elenco di `sorgenti/moduli/memoria.js` (§ 30.1) |
| Note legali (cap. 31) | `sorgenti/testi/it/note-legali.html` | `testi.note_legali` | `{titolare}`, `{casella_contatto}`, `{casella_autorita}` anche dentro una parte scritta in inglese (`lang="en"`, art. 11, par. 3, DSA), `{licenze}` |
| Condizioni d'uso (cap. 32) | `sorgenti/testi/it/condizioni-uso.html` | `testi.condizioni_uso` | `{casella_contatto}` |

La casella per le autorità sta soltanto nelle note legali: il montaggio rifiuta `{casella_autorita}` negli altri testi, e la prova controlla che l'indirizzo configurato non compaia altrove nella pagina dell'app. La casella per gli utenti compare in note legali, informativa e condizioni d'uso, e accanto al modulo «Segnala» (con il collegamento all'informativa).

Oggi i quattro file sono segnaposto: un paragrafo `class="segnaposto"` dice che il testo è in preparazione, e restano soltanto le parti che vengono dai testi di riferimento del libro mastro e che le regole qui sopra chiedono (chi risponde del servizio, le due caselle con la parte in inglese, i dati della mappa e le licenze, la riserva dell'estrazione). Nessuna frase dei testi della v1.2: sono usciti con il blocco 15, insieme alle loro traduzioni (`parti/legali_it.html`, `dati/legali_tradotti.json`).

### Il formato dei file

Pezzi di HTML di solo testo. Elementi ammessi: `h3`, `h4`, `p`, `ul`, `ol`, `li`, `strong`, `em`, `a`, `br`, `section`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `span`. Attributi ammessi: `lang` (le cinque lingue dell'app), `id` (minuscole, cifre, trattini), `class` (`segnaposto`, `opposizione`), `href` sui collegamenti (solo `https://…` o `#…`), `scope` sulle intestazioni di tabella. Niente script, gestori, stili, immagini, moduli; niente `<` o `>` fuori dagli elementi; nessun codice postale seguito dal nome di una città. I commenti `<!-- … -->` restano nei sorgenti e non escono.

Segnaposto: `{nome}`, `{titolare}`, `{casella_contatto}`, `{casella_autorita}`, `{licenze}`. Il montaggio li riempie dalla configurazione: una casella ancora tra parentesi quadre resta testo, altrimenti diventa un collegamento `mailto:`; `{licenze}` diventa il collegamento alla pagina «Licenze dei componenti». I collegamenti esterni si aprono a parte, senza pagina di provenienza; gli indirizzi ammessi sono quelli della configurazione (`prove/indirizzi.js`).

### Versione e data

`sorgenti/config.js`, `testi`: per ogni testo `null` (in preparazione) oppure `{ versione: '1.0', data: 'AAAA-MM-GG' }`. Il montaggio si ferma se un testo con versione contiene ancora un segnaposto, o se un testo senza segnaposto non ha versione. L'app scrive «Versione 1.0 · aggiornata il 15 gennaio 2027» (nella lingua dell'app) oppure «In preparazione».

### Le altre lingue

Una lingua si aggiunge mettendo i suoi file in `sorgenti/testi/<lingua>/` (`en`, `es`, `fr`, `ar`), con le stesse regole: nessun codice da toccare. Se il testo nella lingua dell'app non c'è, l'app mostra quello italiano, con `lang="it"` e la direzione da sinistra a destra, e una riga tradotta: «Questo testo per ora è disponibile soltanto in italiano.» Quale versione prevalga tra le lingue si decide con l'informativa (§ 30.3; piano, sezione 6).

## Dove si leggono

- **Nell'app**: il foglio «Informazioni legali», con quattro linguette (Informativa privacy, Dati locali, Note legali, Condizioni d'uso), il titolare accanto al nome («<nome>, progetto di <titolare>», dalla configurazione), la versione e il testo. Il montaggio mette i testi nella pagina come modelli (`<template id="leg-<testo>">`, e `leg-<testo>-<lingua>` per le altre lingue): si leggono anche senza rete. Sotto il testo, «Apri come pagina di testo».
- **Da ogni schermata**: il tasto «Note legali» nella barra in alto, accanto alla città, in tutte e due le app; con la mappa a schermo intero, che nasconde la barra, «Note legali» nell'angolo della mappa, accanto a «© OpenStreetMap · Protomaps». Chiudendo il foglio si torna a quello da cui si era partiti (calendario, Impostazioni, scheda, modulo «Segnala»…), oppure alla mappa. Su un telefono stretto (360 punti) il tasto va a capo invece di allargarsi, e nell'app della redazione il cartellino «Redazione» prende il posto del nome.
- **Impostazioni → Documenti**: i quattro testi e «Licenze dei componenti».
- **Pagine di solo testo**: `testi/<lingua>/<testo>.html` in ogni uscita, con `testi/testi.css`; senza script, leggibili anche dai programmi, con i collegamenti agli altri testi e alle licenze. Un testo in preparazione chiede di non essere indicizzato. La pagina dell'app le indica ai programmi con `<link rel="privacy-policy">` e `<link rel="terms-of-service">`.
- **Avvisi delle novità** (T-031): `apre` vale `informativa`, `dati-locali`, `note-legali` o `condizioni-uso`.

Le pagine non vanno sul sito vero prima che ciò che descrivono sia in atto (§ 1.3, regola 1): i testi arrivano con T-080, con i controlli di quella voce.

## La riserva dell'estrazione (T-056)

Il libro mastro la esprime in tre forme (§ 6.5): un file per i programmi di raccolta, l'indicazione secondo un protocollo tecnico pubblico, la clausola delle condizioni d'uso.

1. **`robots.txt`** (solo nell'app pubblica; sorgente `sorgenti/robots.txt`). Un gruppo per ogni programma di raccolta dichiarato dal suo gestore per l'addestramento di sistemi di intelligenza artificiale, per raccolte di dati destinate all'addestramento, per l'estrazione di dati o per gli indici delle risposte dei sistemi di intelligenza artificiale, con `Disallow: /`; per tutti gli altri `User-agent: *` con `Disallow:` vuoto, così i motori di ricerca (Googlebot, Bingbot, Applebot) restano ammessi. Restano ammessi anche i programmi che leggono una pagina soltanto quando una persona lo chiede (Claude-User, ChatGPT-User, Perplexity-User, MistralAI-User): agiscono per chi consulta, come un browser (art. 102-ter L. 633/1941). L'elenco (31 programmi al 27/11/2026, dalle pagine dei gestori e dagli elenchi pubblici aggiornati) si rivede a ogni riesame prima di un rilascio (§ 12.3); il montaggio controlla la forma delle righe e la chiusura con `User-agent: *`. L'app della redazione ha il suo `robots.txt` che nega tutto a tutti (T-033).
2. **TDMRep** (TDM Reservation Protocol, W3C Community Group, rapporto finale del 10/05/2024). `.well-known/tdmrep.json` (sorgente `sorgenti/.well-known/tdmrep.json`): la regola `"location": "/*"` con `"tdm-reservation": 1`; il montaggio vi aggiunge `"tdm-policy"`, la pagina delle condizioni d'uso sull'indirizzo pubblico della configurazione (il protocollo ammette una politica in HTML, leggibile dalle persone). Gli stessi due valori stanno nei metadati della pagina dell'app (tutte e due le app), delle pagine di solo testo e della pagina delle licenze (`<meta name="tdm-reservation" content="1">`, `<meta name="tdm-policy" …>`). I file degli eventi portano il campo `tdm-reservation` (T-020, `docs/formato-eventi.md`): per i file JSON il protocollo non prevede metadati interni e valgono il file `.well-known` e l'intestazione HTTP.
3. **Condizioni d'uso**: la clausola completa la scrive la Direzione (cap. 32, § 32.2, sezione 4; T-080). Il segnaposto contiene già la frase della riserva del testo di riferimento, perché è la pagina a cui rinviano i metadati.

`robots.txt` e `tdmrep.json` valgono soltanto alla radice di un indirizzo: sul collegamento di prova (githack, in una sottocartella) non hanno effetto. Non entrano nella copia dell'app sul telefono, perché l'app non li legge (`PER_I_PROGRAMMI` in `sorgenti/build.js`).

Da fare con l'allacciamento a Bunny (T-065): la zona degli eventi (`indirizzi.eventi`) è un altro indirizzo e ha bisogno del suo `.well-known/tdmrep.json` o dell'intestazione `tdm-reservation: 1` su ogni risposta; la stessa intestazione si può aggiungere anche all'app pubblica. Il protocollo raccomanda una sola tecnica; quelle usate qui danno lo stesso valore e non si contraddicono.

## Prove

- `prove/testi-pubblicati.js`: i file e il loro controllo (24 casi sbagliati), le uscite (pagine, modelli, rimandi, caselle, nulla dei testi v1.2), `robots.txt`, `tdmrep.json`, metadati.
- `prove/browser/testi-pubblicati.js`: le note legali da nove schermate con ritorno al punto di partenza, il foglio e i quattro testi, inglese e arabo, le pagine di solo testo, la barra in alto a 360 punti in cinque lingue e in tutte e due le app.
- `prove/parole.js` legge anche `sorgenti/testi/`; `prove/componenti.js` riconosce le pagine e i due file per i programmi come prodotti dal montaggio.
