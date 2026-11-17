# Componenti di terzi

Elenco dei componenti di terzi che l'app usa, con versione, licenza e obblighi (libro mastro, § 6.6, regole 1-3; § 18.9; § 31.1). Si tiene insieme al codice perché non contiene dati personali.

**Come si aggiorna.** Prima di aggiungere un componente se ne legge la licenza: un componente senza licenza chiara non si usa (§ 6.6, regola 1). A ogni nuovo componente, o a ogni nuova versione di un componente, si aggiornano la sua riga e il testo della licenza in `licenze/`, prima del rilascio che lo introduce (§ 31.1, «Quando si aggiorna»). La prova automatica `prove/componenti.js` fallisce se nell'app montata compare una libreria, un carattere o un servizio di mappe senza una riga in questo elenco, o con una versione diversa.

**Che cosa va sul sito.** Il montaggio (`sorgenti/build.js`) legge la tabella «Componenti nell'app» e pubblica con l'app, in `licenze/`, la pagina `index.html` con i titolari, le licenze e i testi integrali dei componenti elencati lì, insieme ai file di testo delle licenze. L'app la apre da Impostazioni → Documenti → «Licenze dei componenti». Le note legali (cap. 31) la richiameranno con T-055 e T-080.

## Componenti nell'app

| Componente | Versione | Dove si usa | Licenza | Titolari | Obblighi | Come si adempie | Testo | Controllo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MapLibre GL JS | 5.24.0 | Motore della mappa, sul telefono. Oggi il telefono lo scarica da unpkg.com; con T-007 viaggia con l'app | BSD a tre clausole; contiene codice di Mapbox GL JS fino alla 1.13 (BSD a tre clausole), di glfx.js (MIT) e di d3-color (BSD a tre clausole) | MapLibre contributors; Mapbox; Evan Wallace; Mike Bostock | Nelle copie distribuite, avviso di copyright, condizioni e clausola di esonero; il nome non si usa per promuovere prodotti derivati | Testo integrale in `licenze/`; l'avviso `@license` resta in testa al file; attribuzioni nelle note legali, sezione 7 | maplibre-gl-js.txt | 17/11/2026 |
| jsPDF | 2.5.1 | PDF del calendario, sul telefono. Oggi lo scarica da cdnjs.cloudflare.com al momento della stampa; con T-007 viaggia con l'app | MIT; il file contiene parti di altri autori con i propri avvisi (MIT, BSD a tre clausole, licenze permissive; due parti senza una licenza precisa, vedi sotto) | James Hall; yWorks GmbH; gli altri autori indicati negli avvisi del file | Avviso di copyright e testo della licenza in tutte le copie | Testo integrale e avvisi del file in `licenze/`; gli avvisi restano nel file anche dopo la compattazione (T-060) | jspdf.txt, jspdf-avvisi-nel-file.txt | 17/11/2026 |
| SheetJS Community Edition (xlsx) | 0.18.5 | Importazione ed esportazione Excel nell'amministrazione. Oggi la scarica da cdnjs.cloudflare.com al momento dell'uso; con T-042 resta solo nell'app della redazione, in una versione senza le vulnerabilità note della 0.18.5 | Apache 2.0 | SheetJS LLC | Copia della licenza a chi riceve il programma; avvisi del file NOTICE, se esiste (il pacchetto 0.18.5 non ne ha) | Testo integrale in `licenze/`; l'avviso in testa al file resta | sheetjs.txt | 17/11/2026 |
| DM Sans | Non fissata: oggi la serve Google Fonts | Carattere dell'interfaccia. Con T-007 i file viaggiano con l'app, a versione fissa | SIL Open Font License 1.1 | The DM Sans Project Authors | Licenza unita ai file; i caratteri non si vendono da soli | Testo integrale in `licenze/`; con T-007 anche accanto ai file dei caratteri | dm-sans.txt | 17/11/2026 |
| DM Serif Display | Non fissata: oggi la serve Google Fonts | Titoli dell'interfaccia. Con T-007 i file viaggiano con l'app, a versione fissa | SIL Open Font License 1.1 | Adobe, con il nome riservato «Source»; Google LLC | Licenza unita ai file; i caratteri non si vendono da soli; una versione modificata non può usare il nome riservato «Source» | Testo integrale in `licenze/`; con T-007 anche accanto ai file dei caratteri | dm-serif-display.txt | 17/11/2026 |
| Dati di OpenStreetMap | Non pertinente: oggi arrivano nei tasselli di CARTO e nelle risposte di Photon e Nominatim | Mappa di base; ricerca degli indirizzi | Open Database License 1.0 (ODbL) | OpenStreetMap contributors | Avviso di provenienza leggibile da chi guarda la mappa (art. 4.3); nessuna modifica dei dati senza condivisione alle stesse condizioni | «© OpenStreetMap» in un angolo della mappa, con il collegamento alla pagina dei diritti; testo integrale in `licenze/` | odbl-1.0.txt | 17/11/2026 |

## Componenti in arrivo

Non sono ancora nell'app. I testi delle licenze sono già in `licenze/`, ma il sito li pubblica solo quando la riga passa nella tabella qui sopra.

| Componente | Versione | Dove si userà | Licenza | Titolari | Testo | Voce |
| --- | --- | --- | --- | --- | --- | --- |
| PMTiles, lettore JavaScript | 4.5.0 (ramo `mappa-protomaps`) | Lettura del file della mappa, sul telefono | BSD a tre clausole; la specifica è di pubblico dominio (CC0). Il pacchetto 4.5.0 non contiene il file della licenza: il testo viene dal repository di Protomaps | Protomaps LLC | pmtiles.txt | T-017 |
| Protomaps basemaps: stili e icone della mappa | 5.7.2 (ramo `mappa-protomaps`) | Stile della mappa e icone | Codice BSD a tre clausole; disegno degli stili CC0; icone derivate da quelle di Mapzen, MIT; schema dei livelli adattato da Tilezen, MIT. Il pacchetto 5.7.2 non contiene il file della licenza: il testo viene dal repository di Protomaps | Protomaps LLC, Kelso Cartography; Mapzen; Linux Foundation | protomaps-basemaps.txt | T-017 |
| Caratteri della mappa (glifi di DM Sans) | Da fissare con T-017 | Scritte sulla mappa | SIL Open Font License 1.1 | The DM Sans Project Authors | dm-sans.txt | T-017 |

## Servizi che oggi forniscono parti dell'app

Non sono componenti distribuiti con l'app: il telefono li contatta direttamente. Ricevono l'indirizzo IP di chi apre l'app e sono scarti del § 2.4 fino alla voce indicata (piano di adeguamento, sezione 11).

| Servizio | Che cosa fornisce | Attribuzione | Voce che lo toglie |
| --- | --- | --- | --- |
| Google Fonts | DM Sans e DM Serif Display | Nessuna richiesta oltre alla licenza dei caratteri | T-007 |
| unpkg.com | MapLibre GL JS | Nessuna oltre alla licenza di MapLibre | T-007 |
| cdnjs.cloudflare.com | jsPDF e SheetJS | Nessuna oltre alle licenze delle librerie | T-007, T-042 |
| CARTO (basemaps.cartocdn.com) | Stile e tasselli della mappa di base | «CARTO» sulla mappa, accanto a «© OpenStreetMap», con il collegamento alla pagina delle attribuzioni di CARTO | T-017 |

## Nel repository, fuori dall'app pubblicata

| Componente | Dove si usa | Licenza | Obblighi | Voce |
| --- | --- | --- | --- | --- |
| Elenco dei comuni italiani (Istat, elenco Situas di giugno 2025), `dati/comuni.json` | Funzione Netlify dei pulsanti volontari; dal 17/11/2026 (T-003) il sito non lo pubblica più | Creative Commons Attribuzione 4.0 | Indicare la fonte («Elenco dei comuni: Istat, licenza CC BY 4.0», oggi nel testo dell'app) | Esce con T-010 |

## Note del controllo del 17/11/2026

- I testi delle licenze di MapLibre GL JS, jsPDF e SheetJS vengono dai pacchetti npm delle versioni indicate; quelli di DM Sans e DM Serif Display dal file `OFL.txt` del repository di Google Fonts; quelli di PMTiles e Protomaps basemaps dal repository di Protomaps; il testo dell'ODbL 1.0 dall'elenco SPDX. Gli avvisi contenuti nel file di jsPDF sono estratti dal file `jspdf.umd.min.js` della versione 2.5.1.
- Il file di jsPDF contiene due parti senza una licenza precisa: un lettore di colori di Stoyan Stefanov («Use it if you like it») e una funzione md5 di Joseph Myers («does not specify a particular license»). Le stesse parti sono presenti anche nell'ultima versione (4.2.1). Il § 6.6, regola 1, dice che un componente senza licenza chiara non si usa: questione aperta per la Direzione.
- Il § 31.1 del libro mastro indica come titolari di DM Sans «Indian Type Foundry; Google LLC»: il file della licenza indica «The DM Sans Project Authors». Il § 6.6 non elenca DM Serif Display, che l'app usa.
