# La mappa

La mappa di Agorapp è un file proprio, costruito con Protomaps dai dati di OpenStreetMap (libro mastro, § 2.4, «La mappa»; piano di adeguamento, blocco 3). Il telefono ne legge i soli tasselli che servono e li disegna con MapLibre, senza contattare altri servizi di mappe.

## Che cosa sta dove

| Parte | Dove sta nel repository | Dove la prende il telefono |
| --- | --- | --- |
| Stili «tinta carta», chiaro e scuro | `sorgenti/vendor/protomaps-basemaps-5.7.2/`, generati da `strumenti/genera-stili.mjs` | Con l'app, in `lib/` |
| Icone degli oggetti della mappa | `sorgenti/vendor/protomaps-icone-v4/` | Con l'app, in `lib/` |
| Glifi di DM Sans per le scritte | `sorgenti/vendor/caratteri-mappa/dm-sans-v17/`, generati da `strumenti/genera-caratteri.mjs` | Con l'app, in `lib/` |
| Lettore del file unico (PMTiles) | `sorgenti/vendor/pmtiles-4.5.0/` | Con l'app, in `lib/` |
| Strato delle correzioni e delle aggiunte | `correzioni.geojson` (T-018) | Con l'app |
| File della mappa e indice `mappa.json` | Solo la prova di Torino, in `prova/` | All'indirizzo `indirizzi.mappa` della configurazione (Bunny, T-065); finché è vuoto, l'app aperta dal repository (githack, prove automatiche) usa `prova/` |

## L'indice `mappa.json`

Accanto al file della mappa sta un piccolo file che dice all'app quale mappa usare (T-019): `versione`, `file` (il file unico `.pmtiles`), `tasselli` (la cartella di riserva con i tasselli separati), `zoom_max`, `riquadro` (ovest, sud, est, nord) e `dati` (provenienza e licenza). L'app legge il file unico a pezzi; se il server non lo consente, passa da sé alla cartella di tasselli.

## La prova di Torino

`prova/torino.pmtiles` e `prova/torino/` vengono dalla mappa del mondo di Protomaps del 12/10/2026, ritagliata su Torino (ramo `mappa-protomaps`): 22 MB, 1.513 tasselli, zoom da 0 a 15. Servono solo alle prove sul telefono (githack) e alle prove automatiche. githack non garantisce le richieste a pezzi: di solito l'app passa alla cartella di tasselli.

## Le categorie visibili e i numeri civici

Sulla mappa si vedono solo le categorie di oggetti dell'elenco `OGGETTI_VISIBILI` in `strumenti/genera-stili.mjs`: tutte le attività commerciali sono escluse, e lo resta ogni categoria nuova che comparisse nei dati. L'elenco definitivo è «decisione aperta» della Direzione (§ 2.4): si cambia lì, si rigenera, si aggiornano le impronte in `sorgenti/vendor/elenco.js` e si rimonta. I numeri civici sono spenti nello stile e l'app li accende solo mentre si sceglie un punto sulla mappa (decisione di Lorenzo del 19/11/2026). I nomi sono quelli locali di OpenStreetMap.

## Lo strato delle correzioni e delle aggiunte

I dati di OpenStreetMap non si modificano nel file della mappa (libro mastro, § 6.6): correzioni e aggiunte stanno in `correzioni.geojson` (T-018), una raccolta GeoJSON che viaggia con l'app e che oggi è vuota. Ogni voce è una `Feature` con queste proprietà:

| Proprietà | Valori |
| --- | --- |
| `correzione` | `nascondi` (un oggetto sbagliato della mappa non si disegna) oppure `aggiunta` (un punto con il nome, disegnato sopra la mappa in corsivo) |
| `livello` | Solo per `nascondi`: il livello del file della mappa (`earth`, `landcover`, `landuse`, `water`, `roads`, `transit`, `buildings`, `pois`, `places`, `boundaries`) |
| `id_mappa` | Solo per `nascondi`: il numero dell'oggetto nel file della mappa (ricavato da OpenStreetMap e stabile tra le ricostruzioni); la geometria può essere `null` |
| `nome` | Solo per `aggiunta`: il nome da scrivere; la geometria è un punto (`Point`, longitudine e latitudine) |
| `data`, `motivo` | Sempre: quando e perché (AAAA-MM-GG; una frase) |

Il montaggio rifiuta un file con voci incomplete. Quando c'è almeno una voce, l'avviso di provenienza aggiunge «correzioni di» con il nome del servizio, preso dalla configurazione: i contenuti del servizio restano distinti da quelli di OpenStreetMap. Lo strato contiene solo dati propri, creati senza estrarli da OpenStreetMap; se un giorno si copiassero dati da OpenStreetMap, varrebbe la licenza ODbL (§ 6.6, «da verificare»). La prova `prove/browser/mappa.js` lo controlla con correzioni inventate.

## Rigenerare stili e glifi

Dalla cartella `strumenti/`: `npm ci`, poi `node genera-stili.mjs`; per i glifi serve anche fontTools (`pip install fonttools==4.67.0 brotli`), poi `node genera-caratteri.mjs`. La rigenerazione dà file identici; se un file cambia, la prova dei componenti lo segnala finché non si aggiorna la sua impronta. Licenze: `LICENZE.md`.

## Il fattorino della mappa

`.github/workflows/mappa.yml` (T-019) costruisce il file d'Italia dalla mappa del mondo di Protomaps, con il nome versionato `mappa-AAAA-MM`, lo controlla con `strumenti/controlla-mappa.mjs` (attribuzione e licenza di OpenStreetMap, nessuna fonte nuova oltre a Natural Earth, schema 4, zoom fino a 15, area coperta, avviso «© OpenStreetMap» nell'app: § 6.6, regola 5), scrive `mappa.json` e, se richiesto, la cartella di tasselli con `strumenti/cartella-tasselli.mjs`. Gira il 2 gennaio e il 2 luglio e a comando (`area`: `italia` o `torino`), ma il calendario e il comando valgono solo quando il file sta su main; fino ad allora gira con `torino` a ogni invio che cambia il lavoro, gli strumenti o le aree.

Il caricamento su Bunny è scritto e spento: parte solo con la variabile del repository `MAPPA_CARICA_SU_BUNNY` = `si`, il segreto `BUNNY_CHIAVE_MAPPA` e le variabili `BUNNY_SPAZIO_MAPPA` e `BUNNY_SERVER_SPAZIO` (T-065). Carica prima il file e la cartella, per ultimo l'indice; le versioni vecchie restano. Finché è spento, con `italia` misura soltanto, senza scaricare i 2,7 GB; con `torino` lascia il file di prova per sette giorni tra i file del lavoro.

## Altre cartelle

- `aree/`: contorni di Italia, Nord, tre regioni e Piemonte, per ritagliare la mappa del mondo (T-019).
- `misure/`: pesi del file della mappa per ciascuna area, misurati il 12/10/2026 (Italia: 2,7 GB).
