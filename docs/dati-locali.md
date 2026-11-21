# Dati locali: che cosa l'app salva sul telefono

Voce T-026 del piano di adeguamento; libro mastro, § 3.7 («Dati salvati sul telefono»), cap. 30 (scheda «Dati locali»), § 2.5 (principio 4) e § 4.1. Stato al 21/11/2026, blocco 6.

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
| `dl_archivio` | file | Gli eventi delle zone che hai aperto | L'indice dell'archivio e i file dei quadranti scaricati per le zone consultate (T-022) | Quando la mappa si ferma su una zona e a ogni controllo delle novità | Un file si cancella quando l'indice non lo nomina più; gli eventi finiti da più di tre ore l'app non li mostra |

Fino ai blocchi 8-10 `dl_eventi` contiene anche gli eventi creati o importati dall'area riservata, che non vanno sulla mappa (piano, criterio d'ordine 6): passeranno all'app della redazione.

Prima del blocco 6 le chiavi portavano il nome del servizio. I nomi di prima sono, nell'ordine della tabella: `agorapp_events`, `agorapp_cal`, `agorapp_theme`, `agorapp_lang`, `agorapp_layers`, `agorapp_city`, `agorapp_simple`, `agorapp_day_mode`, `agorapp_presets`, `agorapp_temi_slots`, `agorapp_guida`, `agorapp_archivio`.

## Righe della scheda che l'app non scrive ancora

La scheda (§ 30.2) ha sette righe. Quattro sono già nell'elenco; le altre arrivano con le voci indicate, che aggiungono la chiave all'elenco quando la funzione nasce.

| Riga della scheda | Voce | Stato |
| --- | --- | --- |
| L'app | T-029 | La copia dell'app per l'uso senza rete nasce con il service worker |
| La mappa delle zone che hai guardato | T-029 | La mappa non si conserva ancora sul telefono |
| Le tue preferenze e scelte: avvisi già visti | T-031 | L'avviso delle novità legali non c'è ancora |
| Gli eventi nascosti che hai sbloccato | T-046 | Oggi lo sblocco vale finché l'app resta aperta e non si salva |

## Strumenti della Redazione

Le chiavi dell'area riservata. Il libro mastro le tiene fuori dalla scheda, perché stanno sul dispositivo della redazione e non sul terminale di un utente (§ 3.7). Fino al blocco 8 l'area riservata sta ancora nell'app pubblica, che per questo crea la memoria con `redazione: true`; le due chiavi si scrivono soltanto dopo l'accesso all'area riservata. Dal blocco 8 (T-033) l'app pubblica creerà la memoria senza la Redazione: all'avvio il modulo cancellerà le due chiavi, senza leggerle, dai telefoni che le avessero (è la «pulizia di Misure e storico dal telefono pubblico» di T-026), e l'app della redazione ripartirà vuota (QB-11).

| Chiave | Dove | Che cosa contiene | Prima si chiamava |
| --- | --- | --- | --- |
| `red_storico` | memoria | Storico delle operazioni dell'area riservata: tipo, giorno e ora, numero di eventi, identificativo dell'evento | `agorapp_storico` |
| `red_misure` | memoria | Misure: totali del giorno, numeri inseriti a mano, soglie, stato del catalogo | `agorapp_misure` |

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
- Le librerie di terzi (MapLibre, lettore PMTiles, jsPDF, SheetJS) non salvano nulla: lo mostra l'inventario del telefono dopo il giro completo.

## Esito per il libro mastro (§ 3.7 e cap. 30)

La verifica chiesta dal § 30.3 («che la tabella corrisponda a ciò che l'app salva davvero») dà oggi questo esito, sul ramo del blocco 6.

- Le righe «I tuoi eventi Off-Grid», «Il tuo calendario» e «Gli eventi delle zone che hai aperto» corrispondono a ciò che l'app salva.
- La riga delle preferenze va aggiornata, nel § 3.7 e nel § 30.2, come deciso con QB-5: l'app salva tema, lingua, città, strati visibili e combinazioni, lenti, Modalità semplice, mezzo della giornata e guida già vista; gli avvisi già visti arriveranno con T-031.
- Le righe «L'app», «La mappa delle zone che hai guardato» e «Gli eventi nascosti che hai sbloccato» descrivono funzioni non ancora costruite (T-029, T-046): fino ad allora l'app salva meno di ciò che la scheda dice.
- Il testo di riferimento nomina, tra parentesi, tre strumenti (localStorage, IndexedDB e Cache Storage): oggi l'app usa il primo e il terzo.
- Gli Off-Grid restano 92 giorni dopo la fine («tre mesi» nella scheda).
- Fino al blocco 8 il telefono di chi entra nell'area riservata dall'app pubblica contiene anche le due chiavi della Redazione.
