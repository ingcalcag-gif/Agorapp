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

## Rigenerare stili e glifi

Dalla cartella `strumenti/`: `npm ci`, poi `node genera-stili.mjs`; per i glifi serve anche fontTools (`pip install fonttools==4.67.0 brotli`), poi `node genera-caratteri.mjs`. La rigenerazione dà file identici; se un file cambia, la prova dei componenti lo segnala finché non si aggiorna la sua impronta. Licenze: `LICENZE.md`.

## Altre cartelle

- `aree/`: contorni di Italia, Nord, tre regioni e Piemonte, per ritagliare la mappa del mondo (T-019).
- `misure/`: pesi del file della mappa per ciascuna area, misurati il 12/10/2026 (Italia: 2,7 GB).
