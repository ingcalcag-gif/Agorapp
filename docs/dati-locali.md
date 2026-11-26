# Dati locali: che cosa l'app salva sul telefono

Voce T-026 del piano di adeguamento; libro mastro, § 3.7 («Dati salvati sul telefono»), cap. 30 (scheda «Dati locali»), § 2.5 (principio 4) e § 4.1. Stato al 25/11/2026, blocco 11.

Il libro mastro chiede che l'app salvi sul telefono soltanto ciò che serve al servizio chiesto dalla persona e che tutto ciò che salva sia descritto, riga per riga, nella scheda «Dati locali»: una riga in più o in meno è uno scarto da correggere prima del rilascio (§ 30.1, scelta 2). Questo documento è l'inventario tecnico che sta dietro la scheda: dice quali chiavi esistono, in quale riga della scheda rientrano e come si controlla che non ce ne siano altre.

## Le regole

1. **Un solo modulo.** Tutto ciò che l'app salva sul telefono passa da `sorgenti/moduli/memoria.js`. Nessun altro file dei sorgenti usa, né nomina, gli strumenti del browser che salvano: la memoria del browser (localStorage), la memoria della scheda (sessionStorage), la base di dati del browser (IndexedDB), la memoria per i file (Cache Storage), i cookie.
2. **Un elenco chiuso.** Il modulo conosce soltanto le chiavi di `ELENCO`. Leggere o scrivere una chiave che non c'è ferma il modulo con un errore: una chiave nuova non può nascere per distrazione.
3. **Nomi senza il nome del servizio.** Le chiavi cominciano con `dl_` (dati locali) o con `red_` (strumenti della Redazione): un cambio di nome del servizio non cancella nulla (T-078).
4. **Niente che riconosca o segua la persona.** Nell'elenco non c'è una voce per un identificativo della persona o del telefono, per un contatore delle visite, per un registro delle ricerche o degli spostamenti sulla mappa (§ 3.7; § 4.1).
5. **Chi aggiunge una voce** la fa entrare prima nella scheda «Dati locali» (§ 30.1, «Quando si aggiorna»), poi aggiunge la riga a `ELENCO`, la riga a questo documento e il passo che la fa scrivere al giro della prova `prove/browser/memoria.js`.

## Le prove

- `prove/memoria.js` (senza browser): l'elenco è ben formato; il modulo rifiuta le chiavi fuori elenco, trasloca i nomi di prima, cancella senza leggerle le chiavi delle funzioni tolte e non tocca le chiavi di altre pagine; nessun altro file dei sorgenti o dell'app montata usa gli strumenti che salvano; ogni lettura e scrittura dell'app nomina una chiave dell'elenco; questo documento elenca le stesse chiavi del modulo.
- `prove/browser/memoria.js` (nel browser): dopo un giro completo nell'app il telefono contiene soltanto chiavi dell'elenco, e il giro le ha fatte scrivere tutte; niente nella memoria della scheda, nessun cookie, nessuna base di dati, nessun programma in sottofondo; riaprire l'app, muovere la mappa, aprire schede e cercare non cambia nulla nella memoria del browser; un telefono con i dati delle versioni precedenti li ritrova sotto i nomi nuovi.

## L'elenco chiuso

Le chiavi dell'app pubblica. «Memoria» è la memoria del browser a coppie chiave-valore; «file» è la memoria del browser per i file.

| Chiave | Dove | Riga della scheda «Dati locali» | Che cosa contiene | Quando si scrive | Per quanto resta |
| --- | --- | --- | --- | --- | --- |
| `dl_eventi` | memoria | I tuoi eventi Off-Grid | Gli Off-Grid creati dalla persona: titolo, indirizzo, punto, giorno e ore, note, collegamenti, ripetizione | Quando la persona crea, modifica o cancella un Off-Grid | Ogni Off-Grid esce dalla mappa tre ore dopo la fine e si cancella dal telefono 92 giorni dopo la fine; prima, dall'app, uno per uno o per serie |
| `dl_calendario` | memoria | Il tuo calendario | Gli identificativi degli eventi messi nel calendario, senza altri dati | Quando la persona salva o toglie un evento | La voce di un Off-Grid si toglie con l'Off-Grid; quella di un evento pubblico quando l'archivio non ha più l'evento |
| `dl_tema` | memoria | Le tue preferenze e scelte | Tema chiaro o scuro | Quando la persona lo sceglie | Finché la persona non lo cambia |
| `dl_lingua` | memoria | Le tue preferenze e scelte | Lingua dell'interfaccia | Quando la persona la sceglie | Finché la persona non la cambia |
| `dl_strati` | memoria | Le tue preferenze e scelte | Strati e sottocategorie visibili sulla mappa | Quando la persona accende o spegne uno strato o sceglie una combinazione | Finché la persona non li cambia |
| `dl_citta` | memoria | Le tue preferenze e scelte | Città scelta (QB-5) | Quando la persona sceglie una città | Finché la persona non la cambia |
| `dl_semplice` | memoria | Le tue preferenze e scelte | Modalità semplice accesa o spenta (QB-5) | Quando la persona la accende o la spegne | Finché la persona non la cambia |
| `dl_mezzo` | memoria | Le tue preferenze e scelte | Mezzo della «La mia giornata»: a piedi, in bici, con i mezzi (QB-5) | Quando la persona lo sceglie | Finché la persona non lo cambia |
| `dl_combinazioni` | memoria | Le tue preferenze e scelte | Le combinazioni di strati salvate, «Mappa 1, 2, 3» (QB-5) | Quando la persona salva una combinazione | Finché la persona non le cambia |
| `dl_lenti` | memoria | Le tue preferenze e scelte | Le tre lenti dei Temi salvate dalla persona, con il nome che ha dato (QB-5) | Quando la persona salva o toglie una lente | Finché la persona non le cambia |
| `dl_guida` | memoria | Le tue preferenze e scelte | La guida iniziale è già stata vista (QB-5) | Quando la persona chiude la guida | Sempre: serve a non riproporla a ogni apertura |
| `dl_avvisi` | memoria | Le tue preferenze e scelte | Gli identificativi degli avvisi delle novità già visti (T-031; QB-5) | Quando la persona chiude un avviso o ne apre il testo | Finché il file degli avvisi nomina ancora l'avviso |
| `dl_app` | file | L'app | La copia dei file dell'app, per aprirla senza rete; la scrive il service worker (T-029) | Alla prima apertura e a ogni versione nuova | Fino alla versione successiva, che la sostituisce |
| `dl_mappa` | file | La mappa delle zone che hai guardato | I tasselli della mappa disegnati, uno per uno, e la copia del piccolo indice della mappa (T-029) | Quando l'app disegna un tassello che non aveva | Fino a 50 MB, poi i più vecchi lasciano posto ai nuovi; a ogni versione nuova della mappa i tasselli di prima si cancellano |
| `dl_archivio` | file | Gli eventi delle zone che hai aperto | L'indice dell'archivio e i file dei quadranti scaricati per le zone consultate (T-022) | Quando la mappa si ferma su una zona e a ogni controllo delle novità | Un file si cancella quando l'indice non lo nomina più; gli eventi finiti da più di tre ore l'app non li mostra |
| `dl_nascosti` | memoria | Gli eventi nascosti che hai sbloccato | Per ogni evento nascosto sbloccato: la password, come la persona l'ha scritta (solo le parole), l'impronta, l'evento decifrato e un segno del file da cui viene (T-046; `docs/eventi-nascosti.md`) | Quando la persona sblocca un evento con la password, e a ogni controllo delle novità se il file è cambiato o non c'è più | Fino a tre ore dopo la fine dell'evento, poi si cancella da solo con la password; la persona lo può togliere prima dalla scheda dell'evento. Se il file non c'è più (evento sospeso o ritirato) l'evento non si mostra ma resta fino a quel momento, e ricompare se il file torna (decisione del 25/11/2026) |

Nell'app pubblica `dl_eventi` contiene soltanto gli Off-Grid della persona. Nell'app della redazione, fino al blocco 10, contiene anche gli eventi che la Redazione prepara o importa, che non vanno sulla mappa finché non si pubblicano (piano, criterio d'ordine 6).

Prima del blocco 6 le chiavi portavano il nome del servizio. I nomi di prima sono, nell'ordine della tabella: `agorapp_events`, `agorapp_cal`, `agorapp_theme`, `agorapp_lang`, `agorapp_layers`, `agorapp_city`, `agorapp_simple`, `agorapp_day_mode`, `agorapp_presets`, `agorapp_temi_slots`, `agorapp_guida`, `agorapp_archivio`.

## Righe della scheda

La scheda (§ 30.2) ha sette righe, e dal blocco 11 (T-046) l'app le scrive tutte: l'ultima, «Gli eventi nascosti che hai sbloccato», è la chiave `dl_nascosti`.

## Strumenti della Redazione

Le chiavi degli strumenti della Redazione. Il libro mastro le tiene fuori dalla scheda, perché stanno sul dispositivo della redazione e non sul terminale di un utente (§ 3.7). Dal blocco 8 (T-033) le app sono due: l'app pubblica crea la memoria con `redazione: false` e non può né leggere né scrivere queste chiavi; l'app della redazione la crea con `redazione: true`.

A ogni apertura l'app pubblica cancella, senza leggerle, le chiavi di Misure e storico rimaste sul telefono da quando l'area riservata stava nell'app pubblica (`red_misure`, `red_storico` e i loro nomi di prima). La base di dati non la apre mai.

Due app sullo stesso indirizzo. Sul sito vero le due app stanno a indirizzi diversi e ciascuna ha la sua memoria. Sul collegamento di prova stanno sullo stesso indirizzo e la memoria è una sola: lì l'app pubblica cancellerebbe Misure e storico dell'app della redazione di prova. Per questo l'app della redazione, all'avvio, scrive il segno `red_qui`; l'app pubblica guarda soltanto se il segno c'è e, se c'è, non tocca le chiavi della Redazione. Su un telefono dove l'app della redazione non è mai stata aperta il segno non c'è, e la pulizia scatta.

| Chiave | Dove | Che cosa contiene | Prima si chiamava |
| --- | --- | --- | --- |
| `red_storico` | memoria | Storico delle operazioni della Redazione: tipo, giorno e ora, numero di eventi, identificativo dell'evento | `agorapp_storico` |
| `red_misure` | memoria | Misure: totali del giorno (dagli eventi dell'archivio e, dal blocco 10, dallo storico delle pubblicazioni dello sportello: eventi presenti, pubblicati, corretti, sospesi, riattivati, ritirati per motivo; mai i testi degli eventi), numeri inseriti a mano, registro delle richieste di rimozione (ricevuta, evasa e, dal blocco 12, codice R della richiesta: mai nomi), soglie, stato del catalogo | `agorapp_misure` |
| `red_qui` | memoria | Il segno che su questo indirizzo c'è l'app della redazione: il solo valore `1` | nessuno |
| `red_chiavi` | base di dati | Le chiavi della Redazione (firma, cifratura, registro delle fonti, marcatore, cassaforte), tenute dal browser come chiavi non estraibili; le loro parti pubbliche; la copia di riserva, cifrata con la frase; il nome del dispositivo e la data. Dopo una revoca: soltanto l'avviso di revoca (T-034; `docs/chiavi-redazione.md`) | nessuno |
| `red_cassaforte` | base di dati | Le password degli eventi nascosti, cifrate una per una con la chiave della cassaforte, con il momento in cui l'evento finisce: da allora la voce si cancella (T-034) | nessuno |
| `red_registro` | base di dati | Il registro delle fonti sul dispositivo: l'elenco delle fonti (codici FS), le righe degli eventi pubblicati con le colonne di giudizio (codici F), le richieste non pubblicate (codici NP; T-043), le righe portate dal registro tenuto a mano e le schede preparate e non ancora pubblicate. Una sola busta, cifrata con la chiave del registro: in chiaro esiste soltanto nella pagina aperta (T-041, T-043; cap. 22) | nessuno |

«Base di dati» è la base di dati del browser (per chi conosce i nomi: IndexedDB), che può conservare chiavi di cifratura non estraibili; la base si chiama `red_strumenti` e la usa soltanto l'app della redazione, attraverso il modulo della memoria (`MEM.base`) e il modulo delle chiavi (`sorgenti/moduli/chiavi.js`). Quando si creano o si ripristinano le chiavi, l'app chiede al browser di non cancellare da sé i dati di quell'indirizzo (`MEM.tieni`): è una richiesta, non un dato salvato.

## Solo sul collegamento di prova

Una voce che sul sito vero non nasce mai (T-038). Sul collegamento di prova l'app della redazione e l'app pubblica stanno allo stesso indirizzo: lo «sportello di prova» dell'app della redazione tiene qui il suo archivio finto, e l'app pubblica di prova lo legge soltanto, al posto dell'archivio del repository, quando lo sportello di prova ha pubblicato qualcosa. Contiene soli eventi inventati. Non sta nella scheda «Dati locali» e non è tra le chiavi che l'app può avere sul telefono (`chiavi()` del modulo non la elenca); quando la configurazione ha l'indirizzo degli eventi (Bunny, T-065) nessuna delle due app la apre più. Si cancella dall'app della redazione con «Svuota lo sportello di prova».

| Chiave | Dove | Che cosa contiene | Prima si chiamava |
| --- | --- | --- | --- |
| `prova_sportello` | file | L'archivio finto dello sportello di prova: i file pubblici degli eventi (indice e quadranti), l'elenco riservato con gli eventi sospesi, lo storico delle pubblicazioni, le chiavi pubbliche ammesse, i numeri dei pacchetti già ricevuti e i tentativi errati (`docs/sportello-pubblicazione.md`) | nessuno |

## Chiavi tolte

Chiavi di funzioni che l'app non ha più. Se un telefono le ha ancora, all'avvio si cancellano senza essere lette.

| Chiave | Dove | Funzione | Voce |
| --- | --- | --- | --- |
| `agorapp_interesse` | memoria | Pulsanti volontari «Mi interessa» e «Vorrei … qui» | T-010 |
| `agorapp_fate` | memoria | Ordine delle Fate | T-014 |
| `agorapp_fate_io` | memoria | Ordine delle Fate | T-014 |
| `agorapp_fate_strato` | memoria | Ordine delle Fate | T-014 |
| `agorapp_fate_chi` | memoria | Ordine delle Fate | T-014 |
| `agorapp_demo` | memoria | Demo degli eventi | T-015 |
| `agorapp_votes` | memoria della scheda | Contatori «Ci vado / Sono qui» | prima del piano |

## Il trasloco dei nomi

All'avvio, prima di leggere qualunque cosa, il modulo guarda se il telefono ha dati sotto i nomi di prima. Se li ha, li passa sotto il nome nuovo così come sono e cancella il nome di prima; se il nome nuovo c'è già, vale quello. Il nome di prima si toglie un attimo prima di scrivere quello nuovo, così il trasloco non chiede spazio in più nemmeno su un telefono quasi pieno; se la scrittura non riesce lo stesso, il dato torna sotto il nome di prima e il trasloco si riprova all'avvio successivo. I file con il nome di prima si cancellano e basta, perché l'app li riscarica. Il modulo tocca soltanto le chiavi che conosce: sullo stesso indirizzo possono esserci dati di altre pagine (succede con l'indirizzo di prova), e restano dove sono.

## Ciò che l'app non salva

- La posizione del telefono: si usa finché l'app è aperta e non si salva (T-016; prova `prove/browser/richieste.js`).
- Le ricerche, il punto della mappa che si sta guardando, gli spostamenti, le schede aperte, i filtri di tempo e di prezzo: stanno nella memoria di lavoro e si perdono chiudendo l'app.
- Le coordinate mostrate dalla pressione prolungata (T-009).
- Tutto ciò che si fa nelle sezioni Demo, Agorà e Progetti (T-015; prova `prove/browser/anteprime.js`).
- Il PDF del calendario: si crea sul telefono e passa al foglio di condivisione del telefono, oppure si scarica; l'app non ne tiene copia (T-027; prova `prove/browser/offgrid.js`).
- Le librerie di terzi (MapLibre, lettore PMTiles, jsPDF) non salvano nulla: lo mostra l'inventario del telefono dopo il giro completo.
- Chi aggiunge l'app alla schermata Home: nessuno lo conta e l'app non lo annota (T-028).

## Esito per il libro mastro (§ 3.7 e cap. 30)

La verifica chiesta dal § 30.3 («che la tabella corrisponda a ciò che l'app salva davvero») dà oggi questo esito, sul ramo del blocco 6.

- Le righe «L'app», «Gli eventi delle zone che hai aperto», «La mappa delle zone che hai guardato», «I tuoi eventi Off-Grid» e «Il tuo calendario» corrispondono a ciò che l'app salva (le prime tre dal blocco 7, T-029).
- La riga delle preferenze va aggiornata, nel § 3.7 e nel § 30.2, come deciso con QB-5: l'app salva tema, lingua, città, strati visibili e combinazioni, lenti, Modalità semplice, mezzo della giornata, guida già vista e avvisi delle novità già visti (T-031).
- La riga «Gli eventi nascosti che hai sbloccato» corrisponde dal blocco 11 (T-046) a ciò che l'app salva: evento e password restano fino a tre ore dopo la fine, poi si cancellano da soli, e la persona li può togliere prima dall'app. Un evento sospeso o ritirato non si mostra più, ma resta sul telefono fino a quel momento e ricompare se torna (decisione del 25/11/2026): la riga del § 30.2 («Escono come gli altri, tre ore dopo la fine») lo copre; il § 3.3 sulla revoca del consenso («l'evento si toglie entro 48 ore») va letto per l'archivio, non per i telefoni (voce LM-77).
- Il testo di riferimento nomina, tra parentesi, tre strumenti (localStorage, IndexedDB e Cache Storage): l'app pubblica usa il primo e il terzo; il secondo lo usa soltanto l'app della redazione, per le sue chiavi (blocco 8).
- Gli Off-Grid restano 92 giorni dopo la fine («tre mesi» nella scheda).
- Dal blocco 8 (T-033) l'app pubblica non ha più un'area riservata e non scrive nessuna chiave della Redazione; a ogni apertura cancella, senza leggerle, quelle di Misure e storico rimaste da prima.
