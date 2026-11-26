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
| `scrivi` | `pubblica`: eventi nuovi o corretti (un identificativo già pubblicato sostituisce l'evento); `nascosti` (dal blocco 11, T-045): eventi nascosti nuovi o corretti, già cifrati, `{id, impronta, giorno, file}` (`docs/eventi-nascosti.md`); `sospendi` e `riattiva`: identificativi, anche di eventi nascosti; `ritira`: identificativo, motivo e, se c'è, la voce del registro; `registro` (dal blocco 10): la busta cifrata con le righe del registro delle fonti di questa pubblicazione, solo insieme a `pubblica` o a `ritira`; `registroDa` (T-043): il primo numero F che lo sportello può dare, solo insieme a `registro` |
| `ripristina` | Sostituisce l'elenco con gli eventi di una copia dello storico, così come la Redazione li rimanda dopo aver ripetuto le rimozioni; gli eventi nascosti tornano così come sono, cifrati |
| `stato` | Legge l'elenco riservato: eventi pubblicati e sospesi, ed eventi nascosti pubblicati e sospesi (cifrati) |
| `storico` | Legge l'elenco delle copie datate |
| `copia` | Legge una copia |
| `registro` | Dal blocco 10 (T-043): le buste del registro delle fonti conservate, chiuse (tutte, o quelle dopo la copia `dopo`; al più 500 per volta), e, con `da` e `a` (giorni `aaaa-mm-gg`), gli eventi pubblicati la prima volta nel periodo secondo le copie dello storico, ciascuno con il suo codice F |

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

Le risposte portano l'esito, il motivo del rifiuto (`forma`, `sconosciuto`, `revocata`, `fermo`, `firma`, `tempo`, `ripetuto`, `evento`, `passato`, `manca`, `ritiro`, `copia`, `vuoto`, `registro`; dal blocco 11 `nascosto`, una voce nascosta fuori forma o un identificativo usato sia da un evento pubblico sia da uno nascosto, e `impronta`, una password già usata da un altro evento nascosto o diversa da quella dell'evento da correggere) e l'ora dello sportello; una pubblicazione riuscita porta l'ora di pubblicazione, che l'app della redazione mostra.

## Che cosa scrive

| Dove | Che cosa |
| --- | --- |
| `pubblico/indice.json`, `pubblico/quadranti/` | L'archivio che i telefoni leggono (`docs/formato-eventi.md`), scritto con `quadranti.costruisci` |
| `pubblico/nascosti/` | Dal blocco 11 (T-045): un file cifrato per ogni evento nascosto pubblicato, con l'impronta della password come nome; fuori dall'indice, dai quadranti e dai numeri per regione; si toglie alla prima pubblicazione dopo la mezzanotte del giorno in cui l'evento esce dalla mappa (`docs/eventi-nascosti.md`) |
| `riservato/stato.json` | L'elenco completo: eventi pubblicati ed eventi sospesi; dal blocco 11 anche gli eventi nascosti, pubblicati e sospesi, cifrati, con l'impronta e il giorno di uscita |
| `riservato/storico/copie/` | Una copia datata per ogni pubblicazione: eventi, sospesi, che cosa è cambiato, chi ha firmato e il pacchetto firmato |
| `riservato/storico/elenco.json` | L'elenco delle copie, con il riepilogo |
| `riservato/chiavi.json` | Le chiavi pubbliche ammesse e le firme revocate |
| `riservato/visti.json`, `riservato/tentativi.json` | I numeri dei pacchetti ricevuti negli ultimi dieci minuti; le firme sbagliate, per impronta del dispositivo |
| `riservato/registro/righe/` | Dal blocco 10: per ogni pubblicazione che porta la busta del registro delle fonti, un file con lo stesso nome della copia datata: la busta così come è arrivata, il dispositivo e i codici F dati agli eventi |
| `riservato/registro/codici.json` | Il codice F di ogni evento che ha una riga nel registro, e il numero del prossimo |

## Il registro delle fonti (T-041, T-043)

Decisione del 24/11/2026: fino allo sportello dell'archivio (T-053) le righe del registro delle fonti arrivano insieme all'evento, nello stesso pacchetto firmato. L'app della redazione prepara le righe della pubblicazione (colonne di fatto e colonne di giudizio della scheda), le cifra con la chiave del registro (`docs/chiavi-redazione.md`) e le mette nel campo `registro` del contenuto: `{tipo: "registro-fonti-redazione", v: 1, iv, dati}`. Nella busta ci sono soltanto le righe di quella pubblicazione e le fonti che citano, com'erano in quel momento: le copie datate conservano il pacchetto intero, e un registro intero ricopiato a ogni pubblicazione le farebbe crescere senza misura.

Lo sportello non sa aprire la busta: ne controlla soltanto la forma (tipo, versione, nessun campo in più, testi in base64 per indirizzi, al massimo 1,5 milioni di caratteri) e rifiuta il pacchetto intero, con il motivo `registro`, se la forma non va o se il pacchetto non pubblica né ritira nulla. Poi dà a ogni evento che non ce l'ha il suo codice F (`F-00001`, `F-00002`…), uno dopo l'altro: i pacchetti passano uno alla volta, quindi due dispositivi non danno mai lo stesso codice a due eventi (§ 18.4). Una correzione e un ritiro tengono il codice della riga. I codici tornano nella risposta (`registro.codici`), e l'app li scrive nella riga del suo registro solo dopo che lo sportello ha accettato: se lo sportello rifiuta, la riga non nasce. La busta non entra mai nei file pubblici.

Prima scrive ciò che è riservato, poi i file pubblici: se la scrittura si interrompe, la pubblicazione seguente ricostruisce tutto dall'elenco. I file dei quadranti hanno la versione nel nome; quelli che l'indice nuovo non nomina si tolgono subito, perché un evento ritirato o sospeso non resti leggibile in un file vecchio. Il telefono che non trova più un file richiede l'indice.

Gli eventi finiti da più di tre ore escono dall'elenco alla pubblicazione seguente; nel frattempo il telefono non li mostra, e i numeri per regione scendono da soli (`docs/formato-eventi.md`, «Le uscite»).

Dal blocco 10 (T-043) la busta porta anche ciò che lo sportello non ha ancora del registro di quel dispositivo: le fonti aggiunte o corrette, le righe «Non pubblicati» e le righe portate dal file del registro tenuto a mano; ognuna parte una volta sola, con la pubblicazione seguente. Se tra le righe ci sono quelle scritte a mano, il pacchetto porta in chiaro `registroDa`, il primo numero F libero dopo i loro codici: lo sportello sposta in avanti il contatore (mai indietro), così un codice scritto a mano non viene dato a un altro evento (§ 18.4, regola 3).

La lettura firmata `registro` restituisce le buste, chiuse, e gli eventi pubblicati la prima volta nel periodo chiesto, letti dalle copie datate dello storico. L'app della redazione le apre con la chiave del registro e ne ricava due cose (schermata «Registro delle fonti» → «Confronta con lo sportello»): il controllo della corrispondenza tra le righe del periodo e gli eventi pubblicati (cap. 22, regola 4), con gli eventi pubblicati senza riga e le righe senza evento; e, per un secondo dispositivo, le righe, le fonti e i «Non pubblicati» che mancano sul dispositivo, da riprendere. Un secondo dispositivo apre le buste perché riceve la stessa chiave del registro con la copia di riserva (`docs/chiavi-redazione.md`). I codici FS e NP li dà ancora il dispositivo che scrive la voce: due dispositivi che aggiungono una fonte prima di essersi allineati possono dare lo stesso codice a due fonti diverse; il confronto lo mostra come contrasto e non sovrascrive nulla.

## Le chiavi ammesse

Le chiavi non arrivano mai con un pacchetto. `riservato/chiavi.json` ha questa forma:

`{ "ammesse": [{ "dispositivo", "impronta", "pubblica", "dal" }], "revocate": [{ "dispositivo", "impronta", "quando" }] }`

Su Bunny lo scrive il Responsabile infrastruttura, con la password dell'account, a partire dai file che la schermata «Chiavi» fa scaricare: le parti pubbliche di un dispositivo (campo `firma`) e l'avviso di revoca. Una firma revocata non si può riammettere: il dispositivo se ne fa una nuova. Nello sportello di prova lo scrivono «Consegna le chiavi allo sportello di prova» e la revoca dalla schermata «Chiavi».

## Sospendere, riattivare, ritirare (T-040)

- **Correggere**: l'evento corretto si pubblica con una nuova firma e sostituisce quello di prima; la copia datata documenta che cosa era pubblicato prima e dopo (§ 5.2).
- **Sospendere**: l'evento esce dai file pubblici e resta nell'elenco riservato finché una verifica è in corso (§ 3.13, limitazione); si può correggere mentre è sospeso, e torna sulla mappa con «Riattiva».
- **Ritirare prima della fine**: chiede il motivo tra i sei del registro delle fonti (cap. 22, colonna «Ritiro prima della fine»): annullato; errore non verificabile in tempo; esclusione (X); richiesta (R); segnalazione (S); ordine di un'autorità (A). Motivo e voce del registro restano nella copia datata; al registro delle fonti li passa T-043. Anche gli ordini delle autorità si eseguono così (§ 7.5).

## Storico e ripristino (T-039)

Ogni pubblicazione lascia una copia datata. L'app della redazione mostra l'elenco delle copie, confronta due copie (eventi aggiunti, tolti, cambiati) e ripristina una copia: legge la copia, elenca le richieste di rimozione registrate dopo la sua data nel registro delle richieste di rimozione delle Misure (date, ore e, dal blocco 12, il codice R della richiesta: nessun nome), lascia correggere o togliere gli eventi della copia e non ripubblica finché ogni richiesta non è segnata come ripetuta (§ 3.13, passo 4). Dal blocco 12 una rimozione di nome si ripete con «Togli il nome da questa copia» (T-047, `docs/diritti-persone.md`): il nome si riprende dall'anagrafica con il codice della richiesta, e lo strumento corregge gli eventi della copia, nascosti compresi se la cassaforte ne ha la password. Gli eventi della copia già finiti non tornano. Il ripristino è a sua volta una pubblicazione firmata e lascia la sua copia.

Dal blocco 10 anche le Misure leggono lo storico, con le stesse letture firmate («storico» e «copia»): per ogni giorno tengono soltanto i conteggi (eventi presenti, pubblicati, corretti, sospesi, riattivati, ritirati per motivo, ripristini), da tutti i dispositivi della Redazione; delle copie non conservano nulla (§ 4.2; decisione del 23/11/2026).

Le copie contengono i testi degli eventi, compresi eventuali nomi: si conservano cinque anni (§ 3.14). Lo sportello non cancella nulla da sé: segna le copie più vecchie di cinque anni, e la cancellazione si decide nel riesame.

## Lo sportello di prova

Finché la configurazione non ha l'indirizzo dello sportello (`indirizzi.sportello_pubblicazione`, T-065), l'app della redazione fa girare la stessa logica dentro il browser, con un archivio finto nella memoria del browser per i file (`prova_sportello`, `docs/dati-locali.md`). Sul collegamento di prova l'app pubblica sta allo stesso indirizzo e, quando lo sportello di prova ha pubblicato qualcosa, legge quell'archivio al posto di quello del repository, e la barra degli strati lo dice («archivio dello sportello di prova di questo browser»). L'archivio finto vale solo per il browser che ha pubblicato: un altro dispositivo, o un altro browser sullo stesso dispositivo, continua a leggere l'archivio del repository (o il proprio archivio finto). Nulla esce dal dispositivo; gli eventi sono solo inventati. Sul collegamento di prova l'archivio finto sta sotto l'indirizzo del ramo: ogni ramo nuovo parte con uno sportello di prova vuoto, a cui vanno consegnate di nuovo le chiavi. Dal blocco 11, dopo ogni pubblicazione e dopo lo svuotamento, l'app della redazione rilegge da sé l'archivio giusto, senza ricaricare la pagina: prima restava sull'archivio con cui si era aperta, e un evento nascosto appena pubblicato non si sbloccava nella stessa pagina (riscontro del 26/11/2026). L'app pubblica aperta in un'altra scheda va invece ricaricata.

Nella schermata «Pubblicazione» lo sportello di prova ha quattro comandi in più: consegnare le chiavi di questo dispositivo, portare nell'archivio finto gli eventi inventati dell'archivio di prova del repository (quelli non ancora finiti), provare a consegnare un pacchetto con la firma sbagliata, svuotare lo sportello di prova.

## Su Bunny (Fase 2)

`sportelli/bunny-pubblicazione.js` è l'involucro per Bunny Edge Scripting: riceve la richiesta, passa il testo alla logica, risponde soltanto all'indirizzo dell'app della redazione. `strumenti/monta-sportello.mjs` ne fa un file solo. Zone e password stanno nelle variabili e nei segreti dello script, mai nel codice. Restano da verificare con l'allacciamento (T-065, T-070, T-071): i nomi esatti delle funzioni di Bunny; due pacchetti arrivati nello stesso istante su due nodi; ogni quanto la rete di consegna rilegge `indice.json` (i quadranti hanno la versione nel nome e non hanno bisogno di svuotamento); il limite di richieste per indirizzo, che è una regola della zona e non dello sportello.

## Ciò che arriva dopo

Dal blocco 10 la scheda di pubblicazione (T-041) e l'importazione dal file Excel (T-042) mandano gli eventi con le righe del registro delle fonti, e l'app della redazione esporta il registro, importa quello tenuto a mano e lo confronta con lo storico (T-043); i calendari aperti dei Comuni passano dalla stessa anteprima, con il canale «calendario», e un loro aggiornamento manda le correzioni con lo stesso identificativo (T-044). Dal blocco 11 gli eventi nascosti viaggiano cifrati in file propri (T-045, `docs/eventi-nascosti.md`). Dal blocco 12 «Togli questo nome ovunque» (T-047) ripubblica con l'operazione `scrivi` gli eventi corretti, pubblici, sospesi e nascosti, in un solo pacchetto, e le ricerche per l'accesso e la portabilità (T-048) leggono lo stato e le copie dello storico con le letture firmate (`docs/diritti-persone.md`). Resta il deposito dei registri nello sportello dell'archivio (T-053), che prenderà il posto delle buste conservate qui.
