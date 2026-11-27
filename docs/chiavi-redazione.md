# Chiavi della Redazione, cassaforte e marcatore

Voci T-034 e T-037 del piano di adeguamento. Libro mastro: § 2.4 («Le chiavi»: la firma della Redazione consente soltanto di pubblicare eventi e la sua parte segreta non lascia il dispositivo della redazione; nessuna chiave nel codice né in una chat), § 3.11 (archivio della redazione con copia di sicurezza cifrata), § 3.14 (le password degli eventi nascosti si cancellano quando l'evento finisce), §§ 2.4 e 6.5 (marcatore invisibile negli identificativi).

Il codice sta in `sorgenti/moduli/chiavi.js` (le chiavi) e in `sorgenti/redazione/chiavi-viste.js` (le schermate). Entra soltanto nell'app della redazione. Le prove sono `prove/chiavi-redazione.js` e `prove/browser/redazione.js`. Come la chiave di firma si usa per pubblicare, e come le parti pubbliche e l'avviso di revoca arrivano allo sportello, è in `docs/sportello-pubblicazione.md` (T-038).

## Le regole

1. **Le chiavi nascono sul dispositivo della redazione.** Le crea il browser, con i suoi strumenti di cifratura. Nel codice, nel repository e nelle conversazioni con l'assistente non c'è e non passa nessuna chiave: nelle prove si usano chiavi create al momento e frasi inventate.
2. **Le parti segrete non si possono più leggere.** Il browser le tiene come chiavi non estraibili: l'app le può usare (per firmare, per cifrare), ma né l'app né chi apre gli strumenti del browser può copiarle.
3. **L'unica copia leggibile è la copia di riserva**, fatta nel momento in cui le chiavi nascono e cifrata con una frase che conosce solo la Redazione. La frase non si salva da nessuna parte. Chi perde la frase non apre più la copia; chi perde il dispositivo e ha copia e frase riparte.
4. **Ogni chiave apre una sola porta** (§ 3.11). La firma non cifra, la chiave del registro non firma, il marcatore non apre nulla.
5. **Le password degli eventi nascosti stanno cifrate** e si cancellano quando l'evento finisce.

## Che cosa c'è sul dispositivo

Nella base di dati del browser, voce `red_chiavi` (`docs/dati-locali.md`):

| Chiave | A che cosa serve | Strumento | Chi la usa |
| --- | --- | --- | --- |
| Firma (coppia) | Firmare i pacchetti da pubblicare; gli sportelli verificano con la parte pubblica | ECDSA, curva P-256, SHA-256 | Blocco 9 e seguenti |
| Cifratura (coppia) | Il telefono di chi segnala chiude la segnalazione con la parte pubblica, che gli dà lo sportello delle segnalazioni (il «lucchetto»); la apre solo la parte segreta, sui dispositivi della Redazione (`docs/segnalazioni.md`) | ECDH, curva P-256 | Blocco 13 |
| Registro delle fonti | Cifrare il registro delle fonti; è diversa dalla firma | AES-GCM a 256 bit | Blocchi 10 e 14 |
| Marcatore | Ricavare il segno negli identificativi degli eventi | HMAC-SHA-256 | T-037, qui sotto |
| Cassaforte | Cifrare le password degli eventi nascosti | AES-GCM a 256 bit | Blocco 11 |

Con le chiavi stanno il nome del dispositivo, la data, le parti pubbliche, la copia di riserva già cifrata e l'elenco degli altri dispositivi conosciuti (nome e impronta della loro firma).

## La copia di riserva

Un file `copia-chiavi-AAAA-MM-GG.json`. Contiene il tipo del file, la data, il nome del dispositivo, i parametri della cifratura e un blocco cifrato; dentro il blocco ci sono tutte le parti segrete. La chiave che lo cifra si ricava dalla frase con PBKDF2-SHA-256 (600.000 giri, sale casuale di 16 byte); la cifratura è AES-GCM. La frase deve avere almeno 20 caratteri.

Una frase sbagliata e un file alterato danno lo stesso rifiuto: non si può capire quale dei due sia il motivo, ed è voluto.

Dove tenerla: fuori dal dispositivo della redazione, su un supporto cifrato; mai in una chat, nella posta o nel repository.

Dal blocco 14 la frase serve anche a un controllo: la copia di sicurezza degli eventi (T-054) va cifrata con una frase diversa, e `CHIAVI.fraseDelleChiavi(frase)` prova ad aprire con la frase proposta la copia di riserva che il dispositivo tiene: se si apre, la frase è quella delle chiavi e la copia degli eventi la rifiuta (`docs/archivio.md`).

## Più dispositivi

La firma è di ogni dispositivo. Da una copia di riserva si può:

- **ripristinare**: il dispositivo nuovo riceve tutte le chiavi di quello perso, firma compresa. Per gli sportelli non cambia nulla;
- **aggiungere un dispositivo**: il secondo dispositivo riceve le chiavi comuni (cifratura, registro, marcatore, cassaforte) e si crea una firma sua, con un nome suo. La sua parte pubblica va consegnata agli sportelli; la sua copia di riserva è cifrata con la stessa frase.

## Le parti pubbliche

«Copia» e «Scarica» nella schermata «Chiavi» danno un piccolo testo in JSON (`chiavi-pubbliche-AAAA-MM-GG.json`) con il nome del dispositivo, la data, la parte pubblica della firma e quella della cifratura, ciascuna con la sua impronta (16 cifre esadecimali, a gruppi di quattro: servono a confrontarle a voce). Non contengono nulla di segreto. Gli sportelli le ricevono nell'elenco delle chiavi ammesse (`docs/sportello-pubblicazione.md`); dal blocco 13 la voce di ogni dispositivo tiene anche la parte pubblica di cifratura, che lo sportello delle segnalazioni dà al telefono come lucchetto (decisione del 26/11/2026). Nel codice e nel repository non c'è nessuna chiave, nemmeno questa.

## La revoca

«Revoca questo dispositivo» cancella le chiavi dal dispositivo (anche la copia di riserva che teneva) e lascia soltanto l'avviso di revoca: tipo, nome del dispositivo, impronta della firma, data. L'avviso si scarica e si consegna agli sportelli, che da quel momento rifiutano quella firma. Per un dispositivo perso, l'avviso si prepara da un altro dispositivo che lo conosce («Altri dispositivi della Redazione»).

La revoca vale davvero quando lo sportello toglie la parte pubblica dal suo elenco (blocco 9): fino ad allora questa schermata prepara soltanto l'avviso.

## Il registro delle fonti

Dal blocco 10 (T-041, T-043) la chiave del registro cifra il registro delle fonti e non fa altro. `CHIAVI.registro.cifra(testo)` dà una busta `{tipo: "registro-fonti-redazione", v, iv, dati}` (AES-GCM, con il tipo come dato aggiuntivo); `decifra(busta)` dà il testo, oppure l'errore `registro` se la busta è rovinata o è stata scritta con un'altra chiave. Sul dispositivo il registro sta in una sola voce, `red_registro`, nella base di dati: `leggi()`, `scrivi(testo)` e `busta()`. In chiaro esiste soltanto nella pagina aperta. Un secondo dispositivo riceve la stessa chiave del registro con la copia di riserva, quindi legge le buste scritte dal primo. La stessa busta, con le sole righe di una pubblicazione, viaggia nel pacchetto firmato e resta nel riservato dello sportello (`docs/sportello-pubblicazione.md`); dal blocco 14 la sezione «Archivio» la conta e la fa riscaricare, chiusa, e i codici FS e NP li dà lo sportello dell'archivio (`docs/archivio.md`).

## La cassaforte

Voce `red_cassaforte`: per ogni evento nascosto, la password cifrata con la chiave della cassaforte e legata all'identificativo dell'evento, e il momento in cui l'evento finisce. A ogni apertura dell'app della redazione le voci degli eventi finiti si cancellano. La copia di sicurezza (`copia-cassaforte-AAAA-MM-GG.json`) contiene le voci così come sono, cifrate: si legge soltanto con le stesse chiavi, cioè con la copia di riserva delle chiavi e la frase.

La cassaforte è pronta; gli eventi nascosti la useranno dal blocco 11 (T-045). Fino ad allora il modulo degli eventi di oggi tiene la password come prima, nella memoria del dispositivo.

## Il marcatore (T-037)

L'identificativo di un evento ha 16 caratteri a caso, un trattino e 8 caratteri di segno (`docs/formato-eventi.md`). Il segno si ricava dalla parte a caso con la chiave del marcatore (HMAC-SHA-256, primi 40 bit, scritti con l'alfabeto a-z, 2-7). È uguale per tutti, non cambia nulla di ciò che la persona vede, e a chi lo guarda non dice nulla: lo può verificare soltanto chi ha la chiave. Non si usano mai eventi falsi.

Ogni evento nuovo dell'app della redazione, creato o importato, riceve un identificativo così. Senza le chiavi un evento nuovo non si salva, e l'app dice perché.

«Viene dal nostro archivio?» (negli strumenti) controlla un identificativo, oppure un testo o un file copiato: cerca tutti gli identificativi e dice quanti portano il nostro segno. Su un identificativo inventato, 8 caratteri giusti per caso capitano una volta su mille miliardi circa.

L'archivio di prova del repository (`prova/archivio/`) ha identificativi fatti senza chiave, che finiscono in `-provaaaa` o simili: lo strumento risponde «no», ed è giusto così.

## Per il libro mastro

- § 2.4, «Le chiavi»: «la firma della Redazione» diventa, nel codice, un mazzo di cinque chiavi con compiti separati; da descrivere (voce LM della memoria del Progetto).
- § 6.5: il marcatore è costruito come sopra; i suoi requisiti come informazione elettronica sul regime dei diritti restano «da verificare» con il professionista.
- § 3.12: la password di amministrazione scritta nel codice è uscita dai rami con T-033; resta nella storia del repository e sul sito vero fino alla pubblicazione. La valutazione del § 3.12 è nella sezione 8 del piano.
