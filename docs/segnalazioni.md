# Segnalazioni: il modulo «Segnala», lo sportello e la lettura nella redazione

Voci T-050, T-051 e T-052 del piano di adeguamento (blocco 13). Libro mastro: § 7.5, misura 3 (regole 1-8; strade a e b), § 4.2 (invii volontari), § 11.4 (richieste di adattamento), § 2.5 (principio 3, eccezione motivata), capp. 25 e 26, § 18.5 (codice P), § 3.13 (rimozione entro 48 ore), § 3.14 (conservazione).

Il codice sta in `sorgenti/moduli/segnalazione.js` (la segnalazione, la busta, il piccolo compito: lo usano tutti e tre i lati), `sportelli/segnalazioni.js` (la logica dello sportello), `sportelli/bunny-segnalazioni.js` (l'involucro per Bunny, scritto e spento), `sorgenti/parti/app3.js` (il modulo nell'app pubblica) e `sorgenti/redazione/segnalazioni.js` (la lettura nell'app della redazione). Le prove sono `prove/segnalazioni.js` e `prove/browser/segnalazioni.js`, più la parte delle segnalazioni in `prove/browser/ostili.js`.

## Le decisioni del 26/11/2026

1. La segnalazione la chiude il telefono, con la parte pubblica di cifratura della Redazione (il «lucchetto»), come dice il § 7.5 (strada a). Il lucchetto lo dà lo sportello delle segnalazioni, che lo prende dall'elenco delle chiavi ammesse: nessuna chiave, nemmeno la parte pubblica, nel codice o nel repository.
2. Il modo d'invio lo sceglie la configurazione: `segnalazioni.sportello` spento vuol dire messaggio di posta già compilato (il ponte, anche al lancio); acceso vuol dire sportello (`indirizzi.sportello_segnalazioni`), con T-071 dopo l'allacciamento (T-065). Sul collegamento di prova il modulo usa lo sportello di prova quando questo ha il lucchetto, altrimenti la posta. Se lo sportello rifiuta o non risponde, il modulo propone la posta.
3. Il limite è uguale per tutti, senza sapere chi scrive: 20 segnalazioni l'ora, 100 al giorno, 300 in attesa; descrizione al più di 2.000 caratteri. In più un piccolo compito per il telefono (16 bit a zero).
4. Dopo l'invio, solo un messaggio di conferma; sul telefono non resta nulla.
5. I cinque motivi restano quelli del libro mastro. Le richieste di adattamento passano da «Altro», con la frase d'aiuto sotto la descrizione. Con «Nome o altro dato personale da togliere» la domanda «Di chi è il nome?» («Il mio», «Di un'altra persona») è obbligatoria.
6. Il codice S lo scrive la Redazione; la riga del registro si copia e si incolla; la segnalazione si toglie dallo sportello alla presa in carico, senza tracce.

## Il modulo «Segnala» (T-050)

Sta nella scheda di ogni evento pubblico, sotto il riquadro «Fonte:». Il modulo mostra il titolo e l'identificativo dell'evento (regola 1), il motivo tra i cinque (regola 2), la domanda sul nome quando serve, la dichiarazione di buona fede per i contenuti ritenuti illeciti (regola 3: proposta, non obbligatoria; nel registro la colonna è sì/no), la descrizione con l'avvertenza di non scrivere dati di altre persone (obbligatoria solo per «illecito» e «Altro»), il nome facoltativo e, con lo sportello, l'email facoltativa (regola 3). Accanto: la casella per gli utenti (`caselle.contatto`, oggi il segnaposto) e l'informativa.

Nulla resta sul telefono (regola 4): il modulo vive soltanto nella pagina aperta (`st.segn`), i campi non si completano da soli, nessuna voce della memoria si scrive, e dopo l'invio restano solo evento e titolo per il messaggio di conferma. Nessun identificativo del telefono: la richiesta allo sportello non porta cookie, credenziali né referrer.

Con la posta il comando «Prepara il messaggio di posta» è un collegamento `mailto:` verso la casella per gli utenti, con oggetto («Segnalazione: titolo») e testo (app, evento, identificativo, motivo, risposta sul nome, buona fede, descrizione, nome), nella lingua dell'app. Non si apre se manca il motivo o la risposta sul nome. L'email non si chiede: è quella da cui la persona scrive.

## La busta e il piccolo compito

Il telefono crea una coppia di chiavi usa e getta (ECDH P-256), ricava con il lucchetto un segreto comune e da lì, con HKDF-SHA-256, una chiave AES-GCM a 256 bit; chiude la segnalazione e butta la sua parte segreta. La busta è `{tipo: "segnalazione-redazione", v, effimera, iv, dati}`: la parte pubblica usa e getta, il vettore iniziale, il testo chiuso. La apre soltanto la parte segreta di cifratura della Redazione (`CHIAVI.segretoSegnalazione`), che è la stessa su tutti i dispositivi della Redazione (arriva con la copia di riserva). Una busta rovinata, o chiusa per un'altra chiave, non si apre; una segnalazione aperta passa di nuovo da `controlla()`.

Il compito: il telefono cerca un numero che, con l'ora data dallo sportello e l'impronta della busta, dia un'impronta SHA-256 che comincia con 16 bit a zero (circa 65.000 tentativi: una frazione di secondo su un computer, uno o due secondi su un telefono). Il compito non dice nulla di chi scrive; lega la busta all'ora, che vale dieci minuti, e si usa una volta sola.

## Lo sportello delle segnalazioni (T-051)

Due porte, nello stesso indirizzo.

| Porta | Richiesta | Che cosa fa |
| --- | --- | --- |
| Aperta | `{porta: "aperta", operazione: "lucchetto"}` | Dà il lucchetto (la parte pubblica di cifratura delle chiavi ammesse non revocate) e il compito `{quando, bit}`; senza chiavi ammesse risponde `chiuso` |
| Aperta | `{porta: "aperta", operazione: "deposita", busta, compito: {quando, n}}` | Controlla forma, ora del compito, compito, ripetizione e limite; poi scrive la busta in `riservato/segnalazioni/arrivate/` con la sola ora di arrivo |
| Firmata | pacchetto con `operazione: "segnalazioni"` | Restituisce le buste depositate, chiuse |
| Firmata | pacchetto con `operazione: "presa", nomi` | Toglie le segnalazioni prese in carico |

La porta firmata usa il pacchetto e le regole dello sportello di pubblicazione (`docs/sportello-pubblicazione.md`): cinque minuti, cinque firme sbagliate in un quarto d'ora fermano quel dispositivo per quindici minuti, gli estranei sono rifiutati subito. Ognuno dei due sportelli rifiuta le operazioni dell'altro (`operazione`).

I motivi di rifiuto: `chiuso`, `forma`, `tempo`, `compito`, `ripetuto`, `troppe` (limite o sportello pieno), `presa`; alla porta firmata anche `operazione`, `sconosciuto`, `revocata`, `fermo`, `firma`.

Che cosa tiene lo sportello, tutto in `riservato/segnalazioni/`: le buste arrivate (`arrivate/`, con ora di arrivo e nient'altro), gli istanti di arrivo dell'ultimo giorno per il limite (`conti.json`), le impronte dei compiti usati negli ultimi venti minuti (`compiti.json`), i numeri dei pacchetti firmati e i tentativi errati per dispositivo. Nessun indirizzo, nessun identificativo. Dopo la presa in carico la busta si toglie e non ne resta traccia: le date stanno nel registro.

Sul collegamento di prova la stessa logica gira nel browser, sullo stesso archivio finto dello sportello di pubblicazione (`prova_sportello`, `docs/dati-locali.md`): l'app pubblica deposita, l'app della redazione legge. Il lucchetto c'è dopo «Consegna le chiavi allo sportello di prova» (Pubblicazione), che dal blocco 13 mette nell'elenco anche la parte pubblica di cifratura.

Su Bunny (Fase 2): `node strumenti/monta-sportello.mjs segnalazioni` fa il file solo. Variabili e segreti dello script: `ZONA_RISERVATA`, `CHIAVE_ZONA_RISERVATA`, `STORAGE_HOST`, `ORIGINE_APP`, `ORIGINE_REDAZIONE`. Il lucchetto è nel file delle chiavi ammesse che il Responsabile infrastruttura scrive già per lo sportello di pubblicazione. Da verificare con l'allacciamento e con la prova del limite (T-065, T-071): i nomi delle funzioni di Bunny; due richieste nello stesso istante su due nodi (il conto del limite); che Bunny non tenga nei suoi registri il contenuto delle richieste; il limite per indirizzo come regola della zona, se serve.

## La lettura nella redazione (T-052)

Strumenti della redazione → «Segnalazioni». L'app chiede le buste con il pacchetto firmato, le apre sul dispositivo e le mostra; le segnalazioni aperte vivono soltanto nella pagina. Ogni segnalazione mostra evento, motivo, risposta sul nome, buona fede, descrizione e recapito; con «Il mio», la scadenza delle 48 ore dall'arrivo.

Per il registro la Redazione scrive il codice S (la numerazione è una sola anche per le segnalazioni arrivate per posta, dalla casella o dagli avvisi del fornitore), il codice P dell'anagrafica (solo se c'è un recapito), sceglie «Chi segnala» e scrive la descrizione per il registro (una sintesi senza dati di altre persone). Poi:

- «Copia la riga del registro delle segnalazioni»: 30 colonne, nell'ordine del cap. 25 tra le colonne comuni del § 18.4 (codice, data di registrazione, funzione che annota … rettifiche, note), separate da tabulazioni, pronte da incollare nel foglio «Segnalazioni»; canale «Modulo con lo sportello»; nessun recapito;
- con «Il mio», anche «Copia la riga del registro delle richieste» (25 colonne del cap. 26: codice R, richiedente P, «Sé stesso», «Cancellazione (art. 17)», evento, scadenza delle 48 ore e di un mese) e «Togli questo nome ovunque», che si apre con la richiesta nuova già pronta (ora di arrivo e codice R) e annota la richiesta nel registro delle richieste di rimozione delle Misure;
- «Copia il recapito», per l'anagrafica e per la conferma dalla casella per gli utenti: il recapito non entra mai nei registri (§ 18.5);
- «Presa in carico», con due tocchi: la segnalazione esce dallo sportello e si conta nelle Misure, nel giorno dell'arrivo.

## Che cosa resta da fare fuori dal codice

- L'eccezione motivata al principio 3 del § 2.5 nel registro delle decisioni, con l'armonizzazione del principio 3 con il § 4.2, prima che il modulo vada al pubblico (sezione 8 del piano).
- I testi pubblicati: informativa (sezione 6, la segnalazione arriva chiusa a uno sportello su Bunny), condizioni d'uso (sezione 6), note legali (sezione 2), con T-055 e T-080.
- La casella per gli utenti vera (T-076), al posto del segnaposto.
