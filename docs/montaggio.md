# Montaggio sicuro e fattorino

Voci T-060 e T-061 del piano di adeguamento (blocco 17). Libro mastro: § 2.4, «Il codice» (codice dell'app sotto controllo, pubblicazione da un processo automatico che parte dalla versione approvata, chiave di caricamento nello spazio riservato della piattaforma del codice); § 3.11 (sicurezza del trattamento); § 6.6, regola 3 (avvisi di licenza); § 2.6.

## Compattazione (T-060)

`npm run build` monta le due app e compatta `app.js`, `moduli.js` e `sezioni.js` con terser 5.51.4 (versione fissata in `sorgenti/package.json`; prima volta: `npm ci` in `sorgenti/`). La compattazione toglie commenti e spazi e accorcia i nomi interni alle funzioni; i nomi globali restano, perché i file dell'app si parlano attraverso quelli; restano anche i commenti di licenza (`/*!`, `@license`, `@preserve`). `app.css` perde commenti, spazi in testa e righe vuote. `sw.js` resta leggibile (17 KB): le sue prime righe dicono versione e copia e servono a capire un aggiornamento. Le librerie di terzi in `lib/` arrivano già compattate dai loro autori, con i loro avvisi, e non si toccano.

Effetto (27/11/2026): `app.js` dell'app pubblica da 238 a 168 KB, dell'app della redazione da 752 a 552 KB.

Per cercare un errore: `node sorgenti/build.js --leggibile` monta senza compattare (le prove vogliono le uscite compattate: prima di inviare si rimonta con `npm run build`). Le prove che cercano nomi del codice usano la forma leggibile, che il montaggio produce dagli stessi sorgenti (`uscita(cfg, app, { leggibile: true })`).

## Controllo finale (T-060)

Prima di scrivere le uscite, `sorgenti/controllo-uscita.js` (`controlloFinale`) ferma il montaggio se un file di testo dell'app contiene:

- un indirizzo esterno che `sorgenti/config.js` non ammette (`indirizzi` e `collegamenti`; nella pagina delle licenze contano solo i collegamenti; fanno eccezione i nomi di formato dei file Excel nel modulo della redazione);
- una chiave privata (anche nella forma JWK), un gettone di un servizio noto o una chiave di caricamento di Bunny.

Non si controllano le librerie di terzi in `lib/` (impronte fisse, `prove/componenti.js`) né i testi delle licenze. Le stesse regole, più ampie, le applicano le prove sui sorgenti (`prove/indirizzi.js`, `prove/chiavi.js`).

## Intestazioni di sicurezza (T-060)

Modello in `sorgenti/intestazioni.json`, una voce per app; i segnaposto `{indirizzi.<nome>}` prendono l'origine dalla configurazione (vuoto = tolto), il dominio dell'app è `'self'`. Si attivano sulla zona di Bunny con T-075 (regole della zona o script del bordo).

| Intestazione | Valore | Perché |
| --- | --- | --- |
| Content-Security-Policy | `default-src 'none'`; script, stili, caratteri, manifest solo dallo stesso indirizzo; immagini anche `data:` e `blob:`; lavoratori dallo stesso indirizzo e da `blob:` (la mappa); connessioni allo stesso indirizzo, a Photon e agli indirizzi Bunny della configurazione (per la redazione anche sportelli e archivio); nessuna cornice, nessun oggetto, `base-uri` e `form-action` chiusi; `upgrade-insecure-requests` | Elenco chiuso delle fonti; nessun codice scritto nella pagina (niente `'unsafe-inline'` per gli script, niente `'unsafe-eval'`); gli stili scritti negli attributi sono ammessi (`style-src-attr`), perché l'app li usa per i colori degli strati |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` | Connessione cifrata obbligatoria |
| Referrer-Policy | `no-referrer` | Nessun invio della pagina di provenienza |
| X-Content-Type-Options, X-Frame-Options, Cross-Origin-Opener-Policy | `nosniff`, `DENY`, `same-origin` | Nessuna lettura del tipo, nessuna cornice, finestra separata |
| Permissions-Policy | posizione solo dallo stesso indirizzo (QB-4); fotocamera, microfono, pagamenti e gli altri permessi negati | Permessi del browser limitati |
| tdm-reservation (pubblica) | `1` | Riserva dell'estrazione nell'intestazione (T-056) |
| X-Robots-Tag (redazione) | `noindex, nofollow` | L'app della redazione non si indicizza |

Il service worker è ammesso dallo stesso indirizzo (`script-src 'self'`). La prova nel browser `prove/browser/intestazioni.js` serve le due app compattate con queste intestazioni (tolta solo `upgrade-insecure-requests`, perché il server di prova è http) e usa le schermate principali, il PDF del calendario e gli strumenti della redazione: nessuna violazione.

## Il fattorino (T-061)

`.github/workflows/pubblica.yml`, **scritto e spento**. A ogni invio: `npm ci` in `sorgenti/`, `npm run build` (montaggio, controllo finale, prove senza browser), controllo che `dist/` sia quello che i sorgenti producono. Poi, soltanto se esistono il segreto `BUNNY_CHIAVE_CARICAMENTO` (la chiave della zona di archiviazione, non quella dell'account) e la variabile `PUBBLICA_SU_BUNNY = si` (dopo T-065):

- su `main` carica `dist/pubblica/` e `dist/redazione/` sulle loro zone (variabili `BUNNY_STORAGE_HOST`, `BUNNY_ZONA_PUBBLICA`, `BUNNY_ZONA_REDAZIONE`);
- su ogni altro ramo li carica in `prove/<ramo>/` della zona di prova (`BUNNY_ZONA_PROVE`), al posto di githack.

I file con il numero di versione nell'indirizzo (`?v=…`) si caricano per primi; `index.html`, `sw.js`, `avvisi.json` ed `emergenza.json` per ultimi, e vanno serviti con scadenza breve dalle regole della zona (T-075; da verificare che la cache della zona distingua l'indirizzo con `?v=`, opzione «Query String Vary»). Ripristino: «Run workflow» con `versione` = un commit di `main` già pubblicato. Se qualcosa va storto GitHub scrive a chi ha fatto l'invio o lanciato il lavoro; il Responsabile infrastruttura riceve gli avvisi dei lavori non riusciti impostandolo nel suo profilo GitHub. Nessuna pulizia della cache: servirebbe la chiave dell'account, che il fattorino non ha.

Finché è spento il lavoro si ferma prima del caricamento e lo scrive («Fattorino spento»). Netlify non è toccato: pubblica ancora `main` da `dist/pubblica/` (T-079 lo chiude).

## Prove

- `prove/montaggio.js`: uscite compattate con gli avvisi di licenza, controllo finale (sei casi fermati), modello delle intestazioni, pagina senza codice scritto dentro, fattorino spento con un solo segreto, nomi e descrizioni dei lavori di GitHub Actions che GitHub sa leggere (senza apici niente «: » né « #»: il 27/11/2026 il nome di un passo di `prove.yml` con «compattare: T-060» ha fatto rifiutare il file intero, e il lavoro «Prove» non partiva).
- `prove/browser/intestazioni.js`: le due app compattate funzionano con le intestazioni del modello.
- Tutte le altre prove nel browser girano sulle uscite compattate.
