# Sportello di pubblicazione, storico e ritiro degli eventi

Questo documento descrive come gli eventi arrivano nell'archivio comune (voci T-038, T-039 e T-040 del piano di adeguamento; libro mastro, § 2.4 «La pubblicazione firmata» e «Lo storico e le copie di sicurezza», §§ 3.11, 3.13, 3.14, 5.1, 5.2 e 7.5; cap. 22).

Il codice sta in `sorgenti/moduli/pacchetto.js` (il pacchetto firmato), `sportelli/pubblicazione.js` (la logica dello sportello), `sportelli/bunny-pubblicazione.js` (l'involucro per Bunny, scritto e spento), `sorgenti/redazione/sportello-prova.js` (invio dei pacchetti e sportello di prova) e `sorgenti/redazione/pubblicazione.js` (le schermate). Le prove sono `prove/sportello.js` e `prove/browser/sportello.js`.

## La regola

Gli eventi si scrivono nell'archivio da una sola porta, lo sportello, che accetta un pacchetto soltanto se porta la firma di un dispositivo della Redazione. L'app della redazione non scrive mai nell'archivio: prepara un pacchetto, lo firma con la chiave di firma del dispositivo (`docs/chiavi-redazione.md`) e lo consegna. Anche leggere l'elenco riservato e lo storico chiede la firma.

## Il pacchetto

`{ tipo, v, quando, numero, dispositivo: { nome, impronta }, contenuto, firma }`

| Campo | Che cosa contiene |
| --- | --- |
| `quando` | Data e ora della firma, in tempo universale |
| `numero` | Un numero unico, a caso: lo sportello lo accetta una volta sola |
| `dispositivo` | Il nome del dispositivo e l'impronta della sua chiave di firma, la stessa che mostra la schermata «Chiavi» |
| `contenuto` | Che cosa si chiede, scritto come testo: ciò che si firma è esattamente ciò che viaggia |
| `firma` | La firma di tutto il resto (ECDSA P-256 con SHA-256) |

La firma copre data e ora, numero, dispositivo e contenuto: cambiare una sola lettera la rompe.

## Che cosa si può chiedere

| Operazione | Che cosa fa |
| --- | --- |
| `scrivi` | `pubblica`: eventi nuovi o corretti (un identificativo già pubblicato sostituisce l'evento); `sospendi` e `riattiva`: identificativi; `ritira`: identificativo, motivo e, se c'è, la voce del registro |
| `ripristina` | Sostituisce l'elenco con gli eventi di una copia dello storico, così come la Redazione li rimanda dopo aver ripetuto le rimozioni |
| `stato` | Legge l'elenco riservato: eventi pubblicati e sospesi |
| `storico` | Legge l'elenco delle copie datate |
| `copia` | Legge una copia |

Ogni evento passa dal controllo del formato (`sorgenti/moduli/eventi.js`, lo stesso dell'app): se uno solo non lo supera, il pacchetto si rifiuta intero e non si scrive nulla. Un evento già uscito dalla mappa non si pubblica.

## Come decide lo sportello

Nell'ordine:

1. il pacchetto ha la forma giusta, altrimenti è rifiutato;
2. il dispositivo è tra quelli ammessi e non è revocato, altrimenti è rifiutato subito, senza contare nulla;
3. il dispositivo non è fermo per troppi tentativi errati;
4. la firma è quella della chiave pubblica consegnata per quel dispositivo; una firma sbagliata si conta: alla quinta in un quarto d'ora lo sportello non risponde a quel dispositivo per quindici minuti;
5. il pacchetto è stato firmato non più di cinque minuti prima o dopo l'ora dello sportello;
6. il numero non è già stato ricevuto.

I numeri (cinque minuti; cinque tentativi, un quarto d'ora, quindici minuti, contati per dispositivo) sono la decisione del 23/11/2026. Lo sportello riceve soltanto il testo del pacchetto: non legge e non conserva l'indirizzo di chi lo manda. Chi non è un dispositivo ammesso non può chiudere la porta agli altri.

Le risposte portano l'esito, il motivo del rifiuto (`forma`, `sconosciuto`, `revocata`, `fermo`, `firma`, `tempo`, `ripetuto`, `evento`, `passato`, `manca`, `ritiro`, `copia`, `vuoto`) e l'ora dello sportello; una pubblicazione riuscita porta l'ora di pubblicazione, che l'app della redazione mostra.

## Che cosa scrive

| Dove | Che cosa |
| --- | --- |
| `pubblico/indice.json`, `pubblico/quadranti/` | L'archivio che i telefoni leggono (`docs/formato-eventi.md`), scritto con `quadranti.costruisci` |
| `riservato/stato.json` | L'elenco completo: eventi pubblicati ed eventi sospesi |
| `riservato/storico/copie/` | Una copia datata per ogni pubblicazione: eventi, sospesi, che cosa è cambiato, chi ha firmato e il pacchetto firmato |
| `riservato/storico/elenco.json` | L'elenco delle copie, con il riepilogo |
| `riservato/chiavi.json` | Le chiavi pubbliche ammesse e le firme revocate |
| `riservato/visti.json`, `riservato/tentativi.json` | I numeri dei pacchetti ricevuti negli ultimi dieci minuti; le firme sbagliate, per impronta del dispositivo |

Prima scrive ciò che è riservato, poi i file pubblici: se la scrittura si interrompe, la pubblicazione seguente ricostruisce tutto dall'elenco. I file dei quadranti hanno la versione nel nome; quelli che l'indice nuovo non nomina si tolgono subito, perché un evento ritirato o sospeso non resti leggibile in un file vecchio. Il telefono che non trova più un file richiede l'indice.

Gli eventi finiti da più di tre ore escono dall'elenco alla pubblicazione seguente; nel frattempo il telefono non li mostra, e i numeri per regione scendono da soli (`docs/formato-eventi.md`, «Le uscite»).

## Le chiavi ammesse

Le chiavi non arrivano mai con un pacchetto. `riservato/chiavi.json` ha questa forma:

`{ "ammesse": [{ "dispositivo", "impronta", "pubblica", "dal" }], "revocate": [{ "dispositivo", "impronta", "quando" }] }`

Su Bunny lo scrive il Responsabile infrastruttura, con la password dell'account, a partire dai file che la schermata «Chiavi» fa scaricare: le parti pubbliche di un dispositivo (campo `firma`) e l'avviso di revoca. Una firma revocata non si può riammettere: il dispositivo se ne fa una nuova. Nello sportello di prova lo scrivono «Consegna le chiavi allo sportello di prova» e la revoca dalla schermata «Chiavi».

## Sospendere, riattivare, ritirare (T-040)

- **Correggere**: l'evento corretto si pubblica con una nuova firma e sostituisce quello di prima; la copia datata documenta che cosa era pubblicato prima e dopo (§ 5.2).
- **Sospendere**: l'evento esce dai file pubblici e resta nell'elenco riservato finché una verifica è in corso (§ 3.13, limitazione); si può correggere mentre è sospeso, e torna sulla mappa con «Riattiva».
- **Ritirare prima della fine**: chiede il motivo tra i sei del registro delle fonti (cap. 22, colonna «Ritiro prima della fine»): annullato; errore non verificabile in tempo; esclusione (X); richiesta (R); segnalazione (S); ordine di un'autorità (A). Motivo e voce del registro restano nella copia datata; al registro delle fonti li passa T-043. Anche gli ordini delle autorità si eseguono così (§ 7.5).

## Storico e ripristino (T-039)

Ogni pubblicazione lascia una copia datata. L'app della redazione mostra l'elenco delle copie, confronta due copie (eventi aggiunti, tolti, cambiati) e ripristina una copia: legge la copia, mostra quante rimozioni di nomi risultano chieste dopo la sua data nel registro delle richieste di rimozione delle Misure (solo date e ore), lascia correggere o togliere gli eventi della copia e non ripubblica finché non si conferma di aver ripetuto le rimozioni (§ 3.13, passo 4). Gli eventi della copia già finiti non tornano. Il ripristino è a sua volta una pubblicazione firmata e lascia la sua copia.

Dal blocco 10 anche le Misure leggono lo storico, con le stesse letture firmate («storico» e «copia»): per ogni giorno tengono soltanto i conteggi (eventi presenti, pubblicati, corretti, sospesi, riattivati, ritirati per motivo, ripristini), da tutti i dispositivi della Redazione; delle copie non conservano nulla (§ 4.2; decisione del 23/11/2026).

Le copie contengono i testi degli eventi, compresi eventuali nomi: si conservano cinque anni (§ 3.14). Lo sportello non cancella nulla da sé: segna le copie più vecchie di cinque anni, e la cancellazione si decide nel riesame.

## Lo sportello di prova

Finché la configurazione non ha l'indirizzo dello sportello (`indirizzi.sportello_pubblicazione`, T-065), l'app della redazione fa girare la stessa logica dentro il browser, con un archivio finto nella memoria del browser per i file (`prova_sportello`, `docs/dati-locali.md`). Sul collegamento di prova l'app pubblica sta allo stesso indirizzo e, quando lo sportello di prova ha pubblicato qualcosa, legge quell'archivio al posto di quello del repository. Nulla esce dal dispositivo; gli eventi sono solo inventati.

Nella schermata «Pubblicazione» lo sportello di prova ha quattro comandi in più: consegnare le chiavi di questo dispositivo, portare nell'archivio finto gli eventi inventati dell'archivio di prova del repository (quelli non ancora finiti), provare a consegnare un pacchetto con la firma sbagliata, svuotare lo sportello di prova.

## Su Bunny (Fase 2)

`sportelli/bunny-pubblicazione.js` è l'involucro per Bunny Edge Scripting: riceve la richiesta, passa il testo alla logica, risponde soltanto all'indirizzo dell'app della redazione. `strumenti/monta-sportello.mjs` ne fa un file solo. Zone e password stanno nelle variabili e nei segreti dello script, mai nel codice. Restano da verificare con l'allacciamento (T-065, T-070, T-071): i nomi esatti delle funzioni di Bunny; due pacchetti arrivati nello stesso istante su due nodi; ogni quanto la rete di consegna rilegge `indice.json` (i quadranti hanno la versione nel nome e non hanno bisogno di svuotamento); il limite di richieste per indirizzo, che è una regola della zona e non dello sportello.

## Ciò che arriva dopo

Le dieci domande, le colonne di giudizio e l'elenco degli eventi preparati (T-041); l'importazione dal file Excel nel formato pubblico (T-042); la riga del registro delle fonti a ogni pubblicazione, con il motivo del ritiro (T-043); gli eventi nascosti, che viaggiano cifrati in file propri (T-045); «Togli questo nome ovunque» (T-047).
