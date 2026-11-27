# Archivio dei registri e copia di sicurezza degli eventi

Voci T-053 e T-054 del piano di adeguamento (blocco 14). Libro mastro: § 1.1 (le tre condizioni dell'archivio), § 2.4 («Lo storico e le copie di sicurezza», le sei condizioni comuni della copia e le alternative; «Le chiavi»), § 3.11 (prova periodica del ripristino), § 3.13, passo 4, § 3.14, § 18.2 (inventario e allegati), § 18.3 (l'archivio, la cifratura e le copie), § 18.4 (i file e i nomi), § 18.5, § 18.9, cap. 22 (registro delle fonti), allegato A, A.1, punto 8.

Il codice sta in `sorgenti/moduli/file-cifrati.js` (il controllo dei file cifrati), `sportelli/archivio.js` (la logica dello sportello dell'archivio), `sportelli/bunny-archivio.js` (l'involucro per Bunny, scritto e spento), `sorgenti/redazione/archivio.js` (la sezione «Archivio» e i codici FS e NP), `sorgenti/moduli/copia-eventi.js` (la copia di sicurezza: comporre, cifrare, controllare, riversare), `sportelli/pubblicazione.js` (le operazioni «immagine» e «ricostruisci») e `sorgenti/redazione/copia-sicurezza.js` (la schermata «Copia di sicurezza degli eventi» e i promemoria). Le prove sono `prove/archivio-registri.js`, `prove/copia-sicurezza.js` e `prove/browser/archivio-copie.js`, con i file inventati di `prove/dati/archivio/` (`prove/dati/genera-archivio-prova.py`), più le parti nuove di `prove/browser/ostili.js`.

## Le decisioni del 27/11/2026

1. L'Archivio accetta i file Excel (.xlsx) cifrati con la password di apertura, per i registri e i file collegati, e i PDF cifrati, per gli allegati del § 18.2; la cifratura deve essere AES (128, 192 o 256 bit), e l'app dice quale ha trovato. Tutto il resto si rifiuta, con il motivo.
2. Le operazioni sono deposita, elenca, scarica (un file, oppure tutti insieme per la copia su memoria fisica) e togli; un file con lo stesso nome sostituisce quello di prima dopo la conferma in due tocchi: fino al lancio c'è la sola copia corrente (§ 18.3, strada a).
3. Le buste del registro delle fonti scritte dall'app viaggiano ancora con la pubblicazione e restano nel riservato dello sportello di pubblicazione (la zona riservata è una sola); l'Archivio le conta, le fa riscaricare e le mette nella copia per la memoria fisica.
4. I codici FS (fonti) e NP (richieste non pubblicate) li dà lo sportello dell'archivio.
5. Limiti: 10 MB per file, al più 1.000 file.
6. La copia di sicurezza degli eventi contiene tutto: eventi pubblicati, sospesi e nascosti (cifrati), tutto lo storico e il registro delle fonti come lo tiene lo sportello, con i contatori dei codici F; ogni versione di un evento si scrive una volta sola, e il file si comprime.
7. La frase della copia ha almeno 20 caratteri e non deve aprire la copia di riserva delle chiavi.
8. «Prova il ripristino» lavora soltanto nella pagina; «Ripristina in uno sportello vuoto» riversa la copia con il pacchetto firmato in uno sportello che non ha ancora nulla.
9. Promemoria sul dispositivo: copie dopo 30 giorni, prova del ripristino dopo 90.
10. Gli eventi nascosti entrano nella copia solo cifrati e la cassaforte resta fuori (§ 2.4); la prova del ripristino controlla che ogni nascosto in corso si apra con la cassaforte del dispositivo.

## Il controllo dei file cifrati

L'app guarda soltanto il contenitore del file, senza aprirlo e senza la password: non vede nessuna riga di nessun registro.

- **Excel.** Un .xlsx normale è un archivio ZIP di testi leggibili: si rifiuta. Salvato con la password di apertura, il programma lo chiude in un contenitore di un altro tipo (il «Compound File» di Microsoft) con due parti dai nomi fissi: `EncryptionInfo`, la scheda della cifratura, ed `EncryptedPackage`, il file vero. L'app legge la scheda: la cifratura «agile» (Excel dal 2010: AES a 256 bit, SHA-512, 100.000 giri) e quella «standard» (AES a 128 bit, SHA-1, 50.000 giri: per esempio LibreOffice 24.2 salva così un .xlsx con password) sono accettate; RC4 e gli altri algoritmi si rifiutano. Un vecchio .xls sta nello stesso contenitore ma senza quelle due parti, e la sua password usa RC4: si rifiuta. Un file solo «protetto da modifica», o con il foglio protetto, resta un .xlsx in chiaro: si rifiuta.
- **PDF.** La coda del file (il «trailer», o l'oggetto che lo sostituisce nei PDF più nuovi) rinvia al dizionario di cifratura: l'app accetta soltanto il filtro «Standard» (la password) con AES (AESV2 a 128 bit, AESV3 a 256 bit) e i contenuti cifrati; RC4 e i contenuti lasciati in chiaro si rifiutano.
- **Gli altri formati** (CSV, ODS, .docx e così via) si rifiutano: un CSV è testo semplice e non si cifra; l'ODS non è tra i formati del § 18.4.

Lo stesso controllo lo fa lo sportello prima di scrivere, con lo stesso modulo. La verifica dello strumento di cifratura «sulla versione in uso del programma dei fogli di calcolo» (piano, sezione 8, Referente privacy) si fa depositando un file salvato con quella versione: l'app dice che cifratura ha trovato.

## I nomi dei file (§ 18.4)

- I registri: `<nome>_Reg19_Decisioni.xlsx`, `_Reg20_Questioni_aperte`, `_Reg21_Trattamenti`, `_Reg22_Fonti`, `_Reg23_Consensi`, `_Reg24_Esclusioni`, `_Reg25_Segnalazioni`, `_Reg25_Sezione_riservata`, `_Reg26_Richieste`, `_Reg27_Violazioni`, `_Reg28_Servizi_esterni`, `_Reg28bis_Accessibilita`, dove `<nome>` è il nome del servizio della configurazione (oggi quello in `sorgenti/config.js`; con T-078 cambia).
- I file collegati: `<nome>_Anagrafica_registri.xlsx`, `<nome>_Elenco_contatti.xlsx`, `<nome>_Elenco_beta_tester.xlsx`. L'elenco dei componenti di terzi sta con il codice, non qui (§ 18.9).
- Gli allegati (§ 18.2): il codice della voce davanti, un trattino basso e una descrizione di lettere, cifre, «_» e «-», in .pdf o .xlsx: per esempio `C-0007_risposta.pdf`. I prefissi sono quelli della tabella del § 18.4.
- I file di gestione delle attività (§ 2.6; piano, sezione 8): `<nome>_Gestione_<descrizione>.xlsx`. Il libro mastro non ne fissa il nome: la regola è una scelta del 27/11/2026, da annotare.

Un registro scritto con le maiuscole sbagliate si riconosce e si deposita con il nome giusto.

## Lo sportello dell'archivio

Una sola porta, firmata, con il pacchetto e le regole dello sportello di pubblicazione (`docs/sportello-pubblicazione.md`): cinque minuti; cinque firme sbagliate in un quarto d'ora fermano quel dispositivo per quindici minuti; gli estranei sono rifiutati subito. Ogni sportello rifiuta le operazioni degli altri (`operazione`).

| Operazione | Che cosa fa |
| --- | --- |
| `archivia` | Deposita un file. La richiesta è `{pacchetto, dati}`: il file, in base64 per indirizzi, viaggia accanto al pacchetto, e il pacchetto firmato porta `nome`, `dimensione` e `impronta` (SHA-256) del file, così la firma copre anche il file. Con `sostituisci: true` prende il posto di quello con lo stesso nome |
| `elenca` | I file con categoria, dimensione, impronta, cifratura, ora e dispositivo; il numero delle buste del registro delle fonti e l'ultima; i limiti; i contatori dei codici FS e NP |
| `scarica` | Un file (`nome`), così com'è; oppure le buste del registro delle fonti (`buste: true`, a pagine di tre milioni di caratteri, con `dopo`) |
| `togli` | Toglie un file |
| `codice` | Il prossimo codice FS o NP (`serie`); con `almeno`, il primo numero che il dispositivo conosce come libero: il contatore va avanti, mai indietro |

I motivi dei rifiuti: `nome`, `forma`, `grande`, `troppi`, `impronta`, `cifratura` (con `file`: `chiaro`, `debole`, `formato`, `rovinato`, `vuoto`, e il dettaglio), `esiste` (con l'ora e il dispositivo del file presente), `manca`, `codici`; alla porta anche `operazione`, `sconosciuto`, `revocata`, `fermo`, `firma`, `tempo`, `ripetuto`.

Che cosa tiene, nella zona riservata, sotto `riservato/archivio/`: `elenco.json` (le informazioni dei file), `file/<nome>.json` (il file in base64 con le sue informazioni), `codici.json` (i contatori FS e NP), `visti.json` e `tentativi.json`. Le buste stanno dove le scrive la pubblicazione (`riservato/registro/righe/`). Lo sportello non apre mai i file e non legge l'indirizzo di chi scrive.

Sul collegamento di prova la stessa logica gira nel browser, sullo stesso archivio finto degli altri sportelli (`prova_sportello`); «Svuota lo sportello di prova» svuota anche l'archivio. Su Bunny (Fase 2): `node strumenti/monta-sportello.mjs archivio` fa il file solo, con il nome del servizio della configurazione; variabili e segreti dello script: `ZONA_RISERVATA`, `CHIAVE_ZONA_RISERVATA`, `STORAGE_HOST`, `ORIGINE_REDAZIONE`; l'indirizzo va in `indirizzi.archivio`. Da verificare con l'allacciamento (T-065): i nomi delle funzioni di Bunny, la dimensione massima di una richiesta (un file di 10 MB viaggia come circa 14 milioni di caratteri), due richieste nello stesso istante su due nodi (il contatore dei codici).

## La sezione «Archivio»

Strumenti della redazione → «Archivio». «Deposita un file» apre la scelta del file; l'app mostra il nome con cui si deposita, la categoria e la cifratura trovata, oppure perché lo rifiuta, e solo nel primo caso offre «Deposita» (o «Sostituisci il file», in due tocchi). L'elenco divide i file in registri, file collegati, file di gestione e allegati; ognuno si riscarica («Scarica»: il file così com'è, cifrato) e si toglie («Togli», due tocchi). Sotto, il registro delle fonti scritto dall'app: quante buste e l'ultima, con «Scarica» (un archivio ZIP con le buste, chiuse). L'elenco dei registri non ancora depositati sta in un riquadro che si apre.

«Scarica tutti i file» prepara un solo archivio ZIP con tutti i file e le buste, così come sono: è la copia per la memoria fisica che il § 18.3 chiede almeno una volta al mese e a ogni riesame. La password dei registri non va su quella memoria (§ 18.3; § 2.4, condizione 2).

Nulla resta in chiaro sul dispositivo: il file scelto sta nella pagina, già cifrato, finché non parte; i file scaricati vanno dove li mette il browser, così come sono.

## I codici FS e NP

Quando la Redazione salva una fonte nuova (Pubblicazione → Registro delle fonti → Fonti) o una riga «Non pubblicati», l'app chiede il codice allo sportello dell'archivio, con il primo numero che il dispositivo conosce come libero: due dispositivi non danno mai lo stesso codice (§ 18.4). Se lo sportello non risponde la voce non si salva, e l'app dice perché. Dove lo sportello non c'è, né vero né di prova, il codice lo dà il dispositivo, come prima. Con l'importazione del registro tenuto a mano i codici scritti a mano restano, e la richiesta successiva porta il primo numero dopo di loro: lo sportello salta in avanti.

## La copia di sicurezza degli eventi

Strumenti della redazione → «Copia di sicurezza degli eventi».

**Scarica la copia di sicurezza.** La frase (almeno 20 caratteri, scritta due volte) si controlla: se apre la copia di riserva delle chiavi, cioè se è la frase delle chiavi, si rifiuta (§ 2.4, condizione 2: la chiave della copia non sta con le altre). Poi l'app legge dallo sportello di pubblicazione, con la firma, l'operazione `immagine` (a pagine di tre milioni di caratteri): `stato.json` (l'elenco degli eventi), `storico/elenco.json` e le copie datate, `registro/codici.json` e le buste. Non legge le chiavi ammesse, i numeri ricevuti, i tentativi errati né i file degli altri sportelli. La copia si compone (ogni versione di un evento, o di un evento nascosto, una volta sola; ogni file con la sua impronta SHA-256), si comprime (gzip) e si cifra sul dispositivo con AES-GCM a 256 bit, con la chiave ricavata dalla frase con PBKDF2-SHA-256 (600.000 giri, sale casuale di 16 byte). Il file `copia-eventi-AAAA-MM-GG.bin` ha una riga d'intestazione in chiaro (tipo, data, parametri), legata al contenuto: chi la cambia rompe il file. Durante la copia non si pubblica: se l'elenco degli eventi non è quello dell'ultima copia dello storico, la prova lo dice.

Il file si salva sul supporto che sceglie la Direzione (decisione aperta, piano, sezione 6): copre le alternative 1 (memoria fisica esterna), 2 (disco cifrato del dispositivo) e 4 (combinazione) del § 2.4; la 3 (secondo spazio presso un altro fornitore) chiederebbe una voce in più. Mai su GitHub, nella posta o all'assistente.

**Prova il ripristino.** Si sceglie il file e si scrive la frase. L'app lo apre (una frase sbagliata e un file alterato danno lo stesso rifiuto) e controlla che la copia sia integra: ogni file ricomposto ha la sua impronta; ogni copia nominata dall'elenco dello storico c'è, con la forma e il nome giusti; nessuna copia fuori elenco; l'elenco degli eventi è quello dell'ultima copia; con le buste ci sono i codici F; ogni evento passa il controllo del formato. Poi la riversa, con le stesse parti firmate del ripristino vero, in un archivio di prova che vive soltanto nella pagina (la logica dello sportello con un deposito in memoria) e la rilegge con `immagine`: ogni file deve tornare identico. Infine conta gli eventi nascosti ancora in corso e quanti si aprono con le password della cassaforte di questo dispositivo. La prova non scrive nulla da nessuna parte; se è riuscita, segna il giorno per il promemoria.

**Ripristina in uno sportello vuoto.** Dopo una prova riuscita, l'app mostra la stessa schermata del ripristino dallo storico: gli eventi ancora da svolgere (quelli finiti non tornano), i nascosti, e le richieste di rimozione registrate nelle Misure dopo l'ultima pubblicazione della copia, da ripetere una per una prima di ripristinare (§ 3.13, passo 4; «Togli il nome da questa copia»). Poi l'operazione `ricostruisci` riversa la copia nello sportello, a parti di al più due milioni e mezzo di caratteri, ciascuna con il suo pacchetto firmato; i file viaggiano accanto al pacchetto (`{pacchetto, file}`) e il pacchetto ne porta le impronte. Lo sportello:

- accetta la prima parte soltanto se non ha né l'elenco degli eventi né lo storico né il registro (motivo `pieno`), così l'archivio vero non si cancella per errore;
- mette il segno `riservato/ricostruzione.json`; finché c'è, rifiuta le pubblicazioni e i ripristini (`ricostruzione`) e accetta soltanto la parte che segue (`parte`); una ricostruzione interrotta si ricomincia dalla prima parte, e i file della prima prova si tolgono;
- controlla le impronte (`impronta`) e i percorsi (`ricostruzione`): soltanto quelli della copia;
- con l'ultima parte pubblica l'elenco degli eventi come ogni pubblicazione, con la sua copia datata (operazione `ricostruisci`, «Ripristino dalla copia di sicurezza» nello storico), rifà i file pubblici e toglie il segno. I contatori dei codici F tornano quelli della copia.

Oggi lo sportello vuoto è lo sportello di prova svuotato (Pubblicazione → «Svuota lo sportello di prova», poi «Consegna le chiavi allo sportello di prova»). Con T-072 la stessa operazione serve per la cartella di prova su Bunny e, dopo la perdita dell'account, per lo spazio nuovo, dopo che il Responsabile infrastruttura vi ha scritto le chiavi ammesse.

**I nascosti e la cassaforte.** Gli eventi nascosti entrano nella copia nella forma cifrata in cui sono pubblicati; la cassaforte con le loro password non entra: ha la sua copia (Chiavi → copia della cassaforte; `docs/chiavi-redazione.md`).

## I promemoria

Gli Strumenti della redazione mostrano in cima il riquadro «Da rifare» quando la copia di sicurezza degli eventi o la copia dei registri su memoria fisica («Scarica tutti i file» dell'Archivio) hanno più di 30 giorni, o la prova del ripristino riuscita più di 90, oppure non sono ancora state fatte su questo dispositivo; ogni riga ha «Apri». I giorni (soltanto il giorno) stanno nella voce `red_promemoria` della memoria del browser (`docs/dati-locali.md`). I numeri si cambiano in un punto solo (`PROMEMORIA` in `sorgenti/redazione/copia-sicurezza.js`) quando la Direzione fissa la frequenza.

## Che cosa resta da fare fuori dal codice

- La verifica dello strumento di cifratura sulla versione in uso del programma (piano, sezione 8, Referente privacy).
- Il supporto e la frequenza della copia di sicurezza (decisione aperta, piano, sezione 6); le copie datate dei registri (strada b del § 18.3, dopo il lancio).
- L'allacciamento dello sportello dell'archivio su Bunny (T-065) e la prova di ripristino su Bunny (T-072).
- I testi pubblicati: informativa, sezioni 9 (archivio riservato cifrato) e 10 (copie di sicurezza), con T-055 e T-080.
