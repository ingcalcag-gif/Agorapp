# Senza rete, installazione e avvisi delle novità

Voci T-028–T-031 del piano di adeguamento; libro mastro, § 2.2 («L'uso senza rete e le preferenze»), § 3.7 e cap. 30 (scheda «Dati locali»), §§ 29.1 e 32.1 (annuncio delle modifiche), § 3.12 e allegato C.13 (comunicazione pubblica di una violazione). Stato al 22/11/2026, blocco 7.

## Che cosa resta sul telefono

Tre cose permettono di usare l'app senza rete. Stanno tutte nella memoria del browser per i file, in tre voci dell'elenco chiuso (`docs/dati-locali.md`).

| Che cosa | Voce | Chi la scrive | Quanto resta |
| --- | --- | --- | --- |
| La copia dell'app | `dl_app` | Il service worker (`sorgenti/sw.js`) | Fino alla versione successiva, che la sostituisce |
| Gli eventi delle zone aperte | `dl_archivio` | `sorgenti/moduli/archivio.js` (T-022) | Finché l'archivio li nomina; si aggiornano a ogni controllo delle novità |
| La mappa delle zone guardate | `dl_mappa` | `sorgenti/moduli/mappa-locale.js` | Fino a 50 MB, poi i tasselli più vecchi lasciano posto ai nuovi |

Calendario, Off-Grid e preferenze stanno già sul telefono (T-026). Senza rete non arrivano eventi nuovi e non si cerca un indirizzo.

## La copia dell'app: il service worker

- **Che cosa conserva.** Tutti i file dell'uscita (pagina, codice, stile, traduzioni, librerie, caratteri, stili e icone della mappa, contenuti d'esempio di Agorà e Progetti in tutte le lingue, pagina delle licenze, manifest e icone). Le due app (T-033) hanno ciascuna il suo service worker e la sua copia, anche quando stanno sullo stesso indirizzo: ogni service worker tocca soltanto i file sotto la cartella della sua app. Anche l'app della redazione si apre senza rete (decisione di Lorenzo del 22/11/2026): per pubblicare e per cercare un indirizzo serve comunque la rete. Dal blocco 10 non ci sono più file da conservare solo al primo uso: i file Excel dell'app della redazione li fa codice nostro (`sorgenti/moduli/excel.js`, T-042), che sta nella copia come il resto. Non conserva mai file di altri siti.
- **Che cosa non conserva.** `avvisi.json`, `emergenza.json` e `sw.js`: il telefono li chiede sempre alla rete. Eventi e mappa passano dalla rete com'è e li conservano i loro moduli.
- **Impronte.** Il montaggio scrive nel service worker l'elenco dei file con l'impronta di ciascuno. Un file entra nella copia solo se la sua impronta corrisponde: se il server consegna un file di un'altra versione, la versione nuova non parte e resta quella di prima. I file che non cambiano tra due versioni non si riscaricano.
- **Preparazione.** Alla prima apertura il telefono scarica 79 file, circa 3,9 MB, sei alla volta. Un file che non arriva, che il server rifiuta o che non corrisponde si richiede fino a tre volte (la seconda e la terza senza passare dalla memoria del browser); se ancora non va, la copia non si fa e si riprova all'apertura successiva.
- **A che punto è.** In cima alla guida «Senza connessione» una riga dice se la copia si sta preparando («… 34 file su 79»), se è pronta, oppure se non è riuscita, con il nome del file e il motivo (rete assente, risposta del server, file che non corrisponde alla versione, rimando a un altro sito). Il service worker lo comunica alla pagina con messaggi interni al telefono; la pagina non lo salva.
- **Aggiornamento silenzioso.** Una versione nuova si prepara mentre l'app è aperta e aspetta: entra in uso quando l'app viene chiusa e riaperta. Entra in uso prima solo se c'è un momento in cui non disturba, cioè quando l'app non è in vista da qualche secondo e la persona non ha nulla di aperto (un foglio, un modulo, la guida): allora la pagina glielo dice e si ricarica. Mentre la persona usa l'app non cambia nulla. Poi i file della versione di prima si cancellano. Nessun avviso: gli avvisi servono solo per le novità che contano (sotto).
- **Numero di versione.** Sette caratteri ricavati dal contenuto di tutti i file dell'app. Sta nella pagina (`data-versione`), nel service worker e in Impostazioni, in fondo («Versione …»).
- **Niente che riconosca il telefono.** Richieste senza credenziali e senza parametri che dipendano dal telefono; nessun conteggio.

## Interruttore d'emergenza

`sorgenti/emergenza.json` si pubblica con l'app come `emergenza.json`. Di norma contiene `{"scarta": []}`.

Se una versione pubblicata risulta sbagliata, si scrive il suo numero nell'elenco, per esempio `{"scarta": ["a1b2c3d"]}`, e si pubblica. A ogni apertura in rete il telefono legge il file: se la versione che ha in copia è nell'elenco, cancella la copia, toglie il service worker e ricarica l'app dalla rete. `"*"` vale per tutte le versioni: l'app resta senza copia finché l'elenco non torna vuoto. Calendario, Off-Grid, preferenze, eventi e mappa conservati non si toccano.

Il file costa una piccola richiesta in più a ogni apertura, allo stesso servizio che ospita l'app. La pagina avvia il service worker solo dopo aver letto davvero il file: senza rete non fa nulla e resta quello che c'era. Se il file mancasse dal sito, il service worker non partirebbe su nessun telefono nuovo.

## La mappa sul telefono

La mappa è un file unico letto a pezzi, quindi non si può conservare com'è. L'app conserva i tasselli uno per uno, quando li disegna: i tasselli passano dal protocollo «agrmappa» (`app2.js`), che guarda prima sul telefono e poi scarica, dal file unico o dalla cartella di tasselli. Accanto ai tasselli sta la copia di `mappa.json`, che senza rete dice quale mappa si stava usando.

- Limite: 50 MB (§ 3.7). Oltre il limite escono i tasselli arrivati per primi.
- Quando la mappa cambia versione (T-019), i tasselli della versione di prima si cancellano.
- Un errore di rete non fa passare dal file unico alla cartella di tasselli: senza rete si aspetta.

## App installabile

- `manifest.webmanifest`: nome e colori dalla configurazione (`config.js`, `nome` e `aspetto`), avvio a schermo pieno.
- Icona provvisoria neutra: un quadrato del verde dell'app con un anello chiaro, in tre misure (`sorgenti/icone/`, disegnate da `strumenti/genera-icone.mjs`). Quella definitiva arriva con T-077.
- Invito discreto: l'ultimo cartellino della guida iniziale e la voce d'aiuto «Senza connessione». Il tasto «Installa» compare solo dove il browser lo consente (Android, computer); su iPhone ci sono le istruzioni. Nessuno conta chi installa, e l'app non lo annota.

## Guida «Senza connessione»

Impostazioni → Aiuto → «Senza connessione». Il testo è quello del documento di architettura (cap. 7, «Senza rete: come lo spieghiamo agli utenti»). L'avvertenza per iPhone ha la forma prudente del libro mastro (§ 30.1, scelta 5: «il telefono può cancellare»), non quella del documento di architettura («così il telefono non cancella i tuoi dati»). Dalla guida si apre la scheda «Dati locali».

## Avvisi delle novità

`sorgenti/testi/avvisi.json` si pubblica con l'app come `avvisi.json`. Oggi è vuoto.

```json
{"formato": "avvisi", "versione": 1, "avvisi": [
  {"id": "2027-01-informativa", "tipo": "modifica", "dal": "2027-01-10", "fino": "2027-03-10",
   "apre": "privacy", "testo": {"it": "Testo dell'avviso."}}
]}
```

- `tipo`: `modifica` (dei testi che toccano i dati o i diritti) oppure `violazione` (comunicazione pubblica di una violazione dei dati, testo del modello C.13). Una violazione si mostra per prima.
- `dal`, `fino`: primo e ultimo giorno in cui l'avviso si mostra. Per le condizioni d'uso `dal` viene prima della data di entrata in vigore, che si scrive nel testo.
- `apre`: il testo che il tasto «Leggi» apre (`privacy`, `storage`, `disclaimer`, `condizioni`); senza, c'è solo «Ho capito».
- `testo`: almeno in italiano, fino a 600 caratteri per lingua, senza codice e senza collegamenti: l'app lo mostra come testo.

Il montaggio rifiuta un file sbagliato. All'apertura l'app legge il file dalla rete e mostra, in basso e senza coprire l'app, l'avviso di questi giorni che il telefono non ha ancora visto; alla prima apertura aspetta la fine della guida. Non è un banner di consenso: non chiede nulla. Il telefono ricorda i soli identificativi degli avvisi visti (`dl_avvisi`), e solo finché il file li nomina. Senza rete non si mostra nessun avviso.

Per pubblicare un avviso basta cambiare `avvisi.json` e rimontare: l'avviso arriva alla prossima apertura in rete, senza aspettare la versione nuova dell'app.

## Sul collegamento di prova

- Ogni ramo ha il suo indirizzo e quindi il suo service worker; la memoria per i file è in comune tra i rami, ma ogni service worker tocca solo i file del suo indirizzo.
- **Sul collegamento di prova (githack) la copia per l'uso senza rete non si completa**, quindi lì l'app non si apre senza rete. Prova di Lorenzo del 22/11/2026: la riga di stato dice «non è riuscita (icone/icona-180.png: il server rimanda a un altro sito)». Githack non consegna da sé le immagini: rimanda il telefono a un altro sito, e il service worker rifiuta apposta ogni rimando verso altri siti, perché nella copia entrano solo file arrivati dall'indirizzo dell'app. Sul servizio che ospiterà l'app i file arrivano tutti dallo stesso indirizzo. L'uso senza rete su un telefono vero si verifica quando le prove passano su Bunny (T-065, T-070); fino ad allora lo coprono le prove automatiche. Installazione, guida, numero di versione e riga di stato si provano anche su githack.
- Dopo un invio sul ramo la versione nuova si prepara alla prima apertura ed entra in uso quando tutte le schede dell'app sono state chiuse e l'app viene riaperta (oppure dopo qualche secondo con l'app non in vista). Il numero in fondo alle Impostazioni dice quale versione è in uso.
- Il collegamento di prova tiene per qualche minuto le copie dei file: finché non ha tutti i file della versione nuova, il controllo delle impronte la rifiuta e resta quella di prima.

## Prove

- `prove/senza-rete.js`: manifest e icone, elenco e impronte del service worker, numero di versione, interruttore spento, mappa sul telefono con una memoria finta, avvisi, traduzioni dei testi nuovi.
- `prove/browser/senza-rete.js`: con il service worker acceso: copia dell'app, un file che risponde 503 una volta e si richiede, riga di stato nella guida (preparazione, pronta), uso senza rete, versione manomessa rifiutata, aggiornamento silenzioso, interruttore d'emergenza, telefono nuovo con un file sbagliato (la riga dice quale e perché).
- `prove/browser/avvisi.js`: avvisi, guida «Senza connessione», invito alla schermata Home.
- Nelle altre prove nel browser il service worker è spento (`serviceWorkers: 'block'` in `prove/browser/comune.js`), perché usano risposte finte.
