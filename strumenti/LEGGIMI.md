# Strumenti dell'archivio degli eventi

Strumenti per preparare i dati dell'archivio (voce T-021 del piano di adeguamento). Non vanno nell'app; il formato dei file è descritto in `docs/formato-eventi.md`.

| File | Che cosa fa |
| --- | --- |
| `genera-archivio-prova.mjs` | Scrive l'archivio di prova in `prova/archivio/` (indice e quadranti) dagli eventi inventati di `archivio-prova.json`. Uso: `node strumenti/genera-archivio-prova.mjs [--da=AAAA-MM-GG]`; i giorni degli eventi contano da quella data (senza `--da`: oggi). Non ha bisogno di pacchetti. |
| `archivio-prova.json` | Gli eventi inventati: 14 a Torino e 6 a Milano; nomi, enti, sale, vie e collegamenti inventati, città e quartieri veri (come per la Demo, QB-9). Approvati da Lorenzo il 20/11/2026: un testo nuovo si propone prima. |
| `genera-regioni.mjs` | Scrive `sorgenti/dati/regioni.json`: i confini semplificati delle venti regioni, con un punto interno per ciascuna, da Natural Earth 5.1.2 (pubblico dominio), scaricato da GitHub. Uso: `npm ci` in `strumenti/`, poi `node genera-regioni.mjs`. Serve `mapshaper` (MPL 2.0), solo qui. |

L'archivio di prova dura circa sei settimane dalla data con cui è stato generato: poi gli eventi sono passati e la mappa torna vuota. Si rigenera con lo strumento; la prova `prove/quadranti.js` controlla che i file nel repository siano esattamente quelli che lo strumento produce per la data scritta nell'indice, e avvisa quando l'archivio sta per finire.

Nessun evento reale passa da qui: gli eventi veri si pubblicano dall'app della redazione allacciata a Bunny (libro mastro § 2.6; piano, T-036 e T-081).
