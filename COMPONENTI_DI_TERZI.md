# Componenti di terzi

Elenco dei componenti di terzi che l'app usa, con versione, licenza e obblighi (libro mastro, § 6.6, regole 1-3; § 18.9; § 31.1). Si tiene insieme al codice perché non contiene dati personali.

**Come si aggiorna.** Prima di aggiungere un componente se ne legge la licenza: un componente senza licenza chiara non si usa (§ 6.6, regola 1). A ogni nuovo componente, o a ogni nuova versione di un componente, si aggiornano la sua riga e il testo della licenza in `licenze/`, prima del rilascio che lo introduce (§ 31.1, «Quando si aggiorna»). La prova automatica `prove/componenti.js` fallisce se nell'app montata compare una libreria, un carattere o un servizio di mappe senza una riga in questo elenco, o con una versione diversa.

**Che cosa va sul sito.** Il montaggio (`sorgenti/build.js`) legge la tabella «Componenti nell'app» e pubblica con l'app, in `licenze/`, la pagina `index.html` con i titolari, le licenze e i testi integrali dei componenti elencati lì, insieme ai file di testo delle licenze. L'app la apre da Impostazioni → Documenti → «Licenze dei componenti». Le note legali (cap. 31) la richiameranno con T-055 e T-080.

## Componenti nell'app

| Componente | Versione | Dove si usa | Licenza | Titolari | Obblighi | Come si adempie | Testo | Controllo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MapLibre GL JS | 5.24.0 | Motore della mappa, sul telefono. Viaggia con l'app in `lib/maplibre-gl-5.24.0/` (T-007), con accanto il testo della licenza | BSD a tre clausole; contiene codice di Mapbox GL JS fino alla 1.13 (BSD a tre clausole), di glfx.js (MIT) e di d3-color (BSD a tre clausole) | MapLibre contributors; Mapbox; Evan Wallace; Mike Bostock | Nelle copie distribuite, avviso di copyright, condizioni e clausola di esonero; il nome non si usa per promuovere prodotti derivati | Testo integrale in `licenze/` e, come `LICENSE.txt`, accanto al file; l'avviso `@license` resta in testa al file; attribuzioni nelle note legali, sezione 7 | maplibre-gl-js.txt | 17/11/2026 |
| jsPDF | 2.5.1 | PDF del calendario, sul telefono. Viaggia con l'app in `lib/jspdf-2.5.1/` (T-007) e si carica solo al momento della stampa | MIT; il file contiene parti di altri autori con i propri avvisi (MIT, BSD a tre clausole, licenze permissive; due parti senza una licenza precisa, vedi sotto) | James Hall; yWorks GmbH; gli altri autori indicati negli avvisi del file | Avviso di copyright e testo della licenza in tutte le copie | Testo integrale e avvisi del file in `licenze/`, licenza anche accanto al file; gli avvisi restano nel file anche dopo la compattazione (T-060) | jspdf.txt, jspdf-avvisi-nel-file.txt | 17/11/2026 |
| DM Sans | v17 | Carattere dell'interfaccia. Viaggia con l'app in `lib/caratteri/dm-sans-v17/` (T-007): file di Google Fonts dal pacchetto `@fontsource-variable/dm-sans` 5.3.0 | SIL Open Font License 1.1 | The DM Sans Project Authors | Licenza unita ai file; i caratteri non si vendono da soli | Testo integrale in `licenze/` e, come `OFL.txt`, accanto ai file dei caratteri | dm-sans.txt | 17/11/2026 |
| DM Serif Display | v17 | Titoli dell'interfaccia. Viaggia con l'app in `lib/caratteri/dm-serif-display-v17/` (T-007): file di Google Fonts dal pacchetto `@fontsource/dm-serif-display` 5.3.0 | SIL Open Font License 1.1 | Adobe, con il nome riservato «Source»; Google LLC | Licenza unita ai file; i caratteri non si vendono da soli; una versione modificata non può usare il nome riservato «Source» | Testo integrale in `licenze/` e, come `OFL.txt`, accanto ai file dei caratteri | dm-serif-display.txt | 17/11/2026 |
| Dati di OpenStreetMap | Non pertinente: arrivano nel file della mappa (oggi la prova di Torino con i dati del 12/10/2026, in `mappa/prova/`; poi il file d'Italia su Bunny, T-019 e T-065) e nelle risposte di Photon | Mappa di base; ricerca degli indirizzi | Open Database License 1.0 (ODbL) | OpenStreetMap contributors | Avviso di provenienza leggibile da chi guarda la mappa (art. 4.3); nessuna modifica dei dati senza condivisione alle stesse condizioni | «© OpenStreetMap» in un angolo della mappa, con il collegamento alla pagina dei diritti; i dati non si modificano: si scelgono solo le categorie da mostrare nello stile (§ 2.4); testo integrale in `licenze/` | odbl-1.0.txt | 19/11/2026 |
| PMTiles, lettore JavaScript | 4.5.0 | Lettura del file unico della mappa, sul telefono. Viaggia con l'app in `lib/pmtiles-4.5.0/` (T-017): file `dist/pmtiles.js` del pacchetto npm `pmtiles@4.5.0`, identico a quello del ramo `mappa-protomaps` | BSD a tre clausole; la specifica del formato è di pubblico dominio (CC0) | Protomaps LLC | Nelle copie distribuite, avviso di copyright, condizioni e clausola di esonero | Il pacchetto 4.5.0 non contiene il file della licenza e il file non ha avvisi in testa: il testo integrale, dal repository di Protomaps, sta in `licenze/` e, come `LICENSE.txt`, accanto al file | pmtiles.txt | 19/11/2026 |
| Protomaps basemaps: stili della mappa | 5.7.2 | Stili «tinta carta» chiaro e scuro, in `lib/protomaps-basemaps-5.7.2/` (T-017). Generati dal pacchetto npm `@protomaps/basemaps@5.7.2` con `mappa/strumenti/genera-stili.mjs`: colori dell'app, categorie di oggetti scelte nello stile (per ora tutte, decisione del 20/11/2026), numeri civici spenti, nomi locali, DM Sans al posto di Noto Sans | Codice BSD a tre clausole; disegno degli stili CC0; schema dei livelli adattato da Tilezen, MIT | Protomaps LLC, Kelso Cartography (codice); Geraldine Sarmiento per Protomaps LLC (disegno, CC0); Mapzen, Linux Foundation (schema) | Per il codice, avviso di copyright, condizioni e clausola di esonero nelle copie; per lo schema, avviso e licenza MIT; il disegno CC0 non chiede nulla | Testo integrale in `licenze/` e, come `LICENSE.txt`, accanto agli stili; riconoscimento «Protomaps» sulla mappa, per cortesia (§ 31.1) | protomaps-basemaps.txt | 19/11/2026 |
| Protomaps basemaps-assets: icone della mappa | v4 | Icone degli oggetti della mappa, chiare e scure, in `lib/protomaps-icone-v4/` (T-017): cartella `sprites/v4` del repository `protomaps/basemaps-assets` (commit 028c18f del 31/10/2025), solo i gusti `light` e `dark`, identiche a quelle del ramo `mappa-protomaps` | MIT (icone derivate da `tangrams/icons` di Mapzen, come dice il repository) | Mapzen | Avviso di copyright e testo della licenza in tutte le copie | Testo integrale in `licenze/` e, come `LICENSE.txt`, accanto alle icone | protomaps-icone.txt | 19/11/2026 |
| DM Sans, glifi della mappa | v17 | Scritte sulla mappa, in `lib/caratteri-mappa/dm-sans-v17/` (T-017). Generati con `mappa/strumenti/genera-caratteri.mjs` dagli stessi file di DM Sans dell'interfaccia (pacchetto `@fontsource-variable/dm-sans@5.3.0`, versione 4.004 del carattere): istanze Regular, Medium e Italic a dimensione ottica 12, convertite con fontnik 0.7.7 | SIL Open Font License 1.1 | The DM Sans Project Authors | Licenza unita ai file; i caratteri non si vendono da soli; la conversione è una versione modificata ammessa (DM Sans non ha nomi riservati) | Testo integrale in `licenze/` e, come `OFL.txt`, accanto ai glifi | dm-sans.txt | 19/11/2026 |

## Componenti in arrivo

Non sono ancora nell'app. I testi delle licenze sono già in `licenze/`, ma il sito li pubblica solo quando la riga passa nella tabella qui sopra. Dal blocco 3 (19/11/2026) non ce n'è nessuno: lettore PMTiles, stili e glifi della mappa sono passati nella tabella qui sopra.

| Componente | Versione | Dove si userà | Licenza | Titolari | Testo | Voce |
| --- | --- | --- | --- | --- | --- | --- |

## Servizi che oggi forniscono parti dell'app

Non sono componenti distribuiti con l'app: il telefono li contatta direttamente. Ricevono l'indirizzo IP di chi apre l'app e sono scarti del § 2.4 fino alla voce indicata (piano di adeguamento, sezione 11). Google Fonts, unpkg.com e cdnjs.cloudflare.com sono usciti con T-007, CARTO con T-017: dal blocco 3 nessun servizio fornisce parti dell'app (Photon riceve le ricerche, ma non consegna parti dell'app).

| Servizio | Che cosa fornisce | Attribuzione | Voce che lo toglie |
| --- | --- | --- | --- |

## Strumenti usati solo nelle prove

Stanno in `prove/package.json`, servono alle prove automatiche (T-005) e non vanno mai nell'app.

| Strumento | Versione | Licenza | Uso |
| --- | --- | --- | --- |
| Playwright | 1.63.0 | Apache 2.0 | Apre l'app in un Chromium senza finestra, con le misure di un telefono |
| axe-core | 4.14.1 | Mozilla Public License 2.0 | Controllo automatico dell'accessibilità (WCAG 2.1 A e AA) |

## Note del controllo del 17/11/2026

- I testi delle licenze di MapLibre GL JS e jsPDF vengono dai pacchetti npm delle versioni indicate, come i file delle librerie in `sorgenti/vendor/` (provenienza in `sorgenti/vendor/LEGGIMI.md`); quelli di DM Sans e DM Serif Display dal file `OFL.txt` del repository di Google Fonts; quelli di PMTiles e Protomaps basemaps dal repository di Protomaps; il testo dell'ODbL 1.0 dall'elenco SPDX. Gli avvisi contenuti nel file di jsPDF sono estratti dal file `jspdf.umd.min.js` della versione 2.5.1.
- Il file di jsPDF contiene due parti senza una licenza precisa: un lettore di colori di Stoyan Stefanov («Use it if you like it») e una funzione md5 di Joseph Myers («does not specify a particular license»). Le stesse parti sono presenti anche nell'ultima versione (4.2.1). Il § 6.6, regola 1, dice che un componente senza licenza chiara non si usa. Decisione della Direzione del 17/11/2026: jsPDF resta; la questione va nel registro delle questioni aperte come «da verificare» prima del lancio.
- Il § 31.1 del libro mastro indica come titolari di DM Sans «Indian Type Foundry; Google LLC»: il file della licenza indica «The DM Sans Project Authors». Il § 6.6 non elenca DM Serif Display, che l'app usa.

## Note del controllo del 19/11/2026 (mappa propria, T-017)

- Il file di prova della mappa (`mappa/prova/torino.pmtiles` e la cartella `mappa/prova/torino/`) viene dalla mappa del mondo di Protomaps del 12/10/2026 (schema 4.15.2; dati OpenStreetMap del 12/10/2026 04:00 UTC), ritagliata su Torino dal ramo `mappa-protomaps`. Le sue informazioni dicono che i livelli derivano da OpenStreetMap e da Natural Earth: Natural Earth è di pubblico dominio e non chiede attribuzioni (libro mastro, § 31.3, «quali fonti diverse da OpenStreetMap entrano nei file della mappa»). Il file non va con l'app: in produzione la mappa sta su Bunny, all'indirizzo della configurazione (T-065).
- Lo stile usato non include icone con licenza propria diversa da quella indicata qui: le icone sono quelle di `basemaps-assets`, derivate dalle icone MIT di Mapzen (§ 31.3).
- Il vecchio `mappa/LICENZE.md` del ramo chiamava BSD lo stile della mappa: la licenza dice codice BSD e disegno CC0 (piano, sezione 12). Il file è stato riscritto.
- Gli strumenti di generazione (`mappa/strumenti/package.json`: `@protomaps/basemaps` 5.7.2, `fontnik` 0.7.7, `@fontsource-variable/dm-sans` 5.3.0, `pmtiles` 4.5.0; fontTools 4.67.0 per le istanze del carattere) non vanno nell'app. La rigenerazione dà file identici: le impronte stanno in `sorgenti/vendor/elenco.js`.

## Note del controllo del 20/11/2026 (archivio degli eventi, T-021)

- I confini delle regioni in `sorgenti/dati/regioni.json` vengono da Natural Earth 5.1.2, «Admin 1 – States, Provinces» alla scala 1:10 milioni (repository `nvkelso/natural-earth-vector`, etichetta `v5.1.2`): dati di pubblico dominio, che non chiedono attribuzione. Le 110 province italiane sono unite nelle venti regioni e semplificate da `strumenti/genera-regioni.mjs`. I confini non vanno nell'app: servono a chi scrive l'indice dell'archivio (oggi lo strumento dell'archivio di prova, poi lo sportello). Nell'indice arrivano al telefono soltanto i nomi delle regioni, i numeri degli eventi e un punto interno per ciascuna.
- Lo strumento usa `mapshaper` 0.6.121 (Mozilla Public License 2.0; `strumenti/package.json`), che non va nell'app.
- SheetJS Community Edition 0.18.5 è uscita con T-042 (decisione del 24/11/2026): i file Excel dell'app della redazione si leggono e si scrivono con codice nostro (`sorgenti/moduli/excel.js`), senza librerie di terzi.
