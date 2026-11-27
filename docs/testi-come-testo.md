# Testi sempre come testo

Questo documento raccoglie l'inventario dei punti in cui un testo che viene da fuori entra nella pagina dell'app, le regole con cui ci entra e l'esito della verifica del codice (voce T-024 del piano di adeguamento; libro mastro, § 3.11: «Testi degli eventi mostrati sempre come testo, mai come codice»).

Il rischio è uno solo: un testo scritto apposta, dentro un evento, un file o una risposta di un servizio, che la pagina tratta come codice e che così si esegue sul telefono di chi lo apre e ne legge i dati locali.

## Le regole

1. **Una sola funzione di protezione.** `esc()` di `sorgenti/moduli/testo.js` trasforma i cinque caratteri con cui un testo può diventare codice (`&`, `<`, `>`, `"`, `'`). La usano l'app (`app1.js`), le sezioni Agorà e Progetti (`sezioni.js`) e il montaggio (`build.js`, `licenze.js`). Nessun altro file sostituisce quei caratteri per conto suo.
2. **Ogni testo esterno passa da `esc()`** nel punto in cui entra in un modello di pagina, sia nel testo sia dentro un attributo. Vale anche per i valori messi in un testo tradotto: `tr('Eliminare «{t}»?', {t: esc(titolo)})`.
3. **Attributi sempre tra virgolette.** Un valore non entra mai in un attributo senza virgolette.
4. **Collegamenti solo https.** `collegamento()` dello stesso modulo accetta solo indirizzi `https`, senza nome utente e password, senza spazi né caratteri di controllo; tutto il resto non diventa un collegamento e resta, se serve, come testo. Un indirizzo scritto dalla persona senza lo schema, o con `http`, si porta a `https` (`normLink`). Nella pagina non arrivano collegamenti `javascript:`, `data:` o `http:`. Gli altri schemi che l'app scrive da sé sono `geo:` (solo coordinate), `mailto:` (casella della configurazione; nel modulo «Segnala», T-050, anche oggetto e testo del messaggio di posta già compilato, codificati con `encodeURIComponent` e messi nell'attributo con `esc()`) e `blob:` (file creati sul telefono).
5. **Nessun gestore scritto nella pagina.** Niente `onclick=`, `onerror=` e simili: i tocchi passano dagli attributi `data-…` e da un solo ascoltatore (`app6.js`). Nessun codice JavaScript dentro le pagine montate.
6. **I numeri sono numeri.** Un valore che deve essere un numero o una data si calcola (per esempio l'ora da un oggetto `Date`) oppure si controlla prima dell'uso; se arriva dalla memoria del telefono e non lo è, vale il valore di partenza.

## Da dove arrivano i testi esterni

| Fonte | Che cosa porta | Primo controllo | Dove entra nella pagina |
| --- | --- | --- | --- |
| Archivio degli eventi (file dei quadranti) | Titolo, nome del luogo, indirizzo, descrizione del luogo, organizzatore, descrizione, prezzo, fonte (testo e collegamento), strato, sottostrato, tema, identificativo | `controlla()` del formato (`sorgenti/moduli/eventi.js`): campi sconosciuti, lunghezze, strati e temi dell'app, collegamento solo https | Segnaposto (etichetta), elenco, gruppo «Qui vicino», scheda, calendario (giornata, mese, agenda), ricerca, Temi, anteprima del PDF, pagina di stampa, PDF |
| Eventi nascosti sbloccati (T-046): il file cifrato dell'archivio aperto con la password, e la voce `dl_nascosti` della memoria del telefono | Gli stessi campi di un evento dell'archivio | `controllaFile()` (`nascosti.js`) sul file; poi `valido()` del formato, con strati e temi dell'app, sull'evento aperto e su ogni voce riletta dalla memoria | Come gli eventi dell'archivio: scheda, elenco, segnaposto, calendario, Cerca (elenco dei nascosti sbloccati) |
| Indice dell'archivio | Nomi delle regioni, numeri, punti | `controllaIndice()` (`quadranti.js`): forma, numeri interi, nomi fino a 40 caratteri | Numeri per regione sulla mappa (numero ed etichetta) |
| Off-Grid nella memoria del telefono (`dl_eventi`), anche importati da una copia in JSON | Titolo, indirizzo, note, collegamenti, durata, ripetizione, identificativi | Data e coordinate valide; collegamenti solo https | Come gli eventi, più modulo di modifica (valori dei campi) e conferma dell'eliminazione |
| Ricerca degli indirizzi (Photon) | Nome, via, numero civico, città, CAP, provincia | Nessuno: è un servizio esterno | Risultati di «Cerca», suggerimenti dei moduli, riquadro «Registriamo questo punto» |
| Ciò che la persona scrive | Testo cercato, campi dei moduli, nome di una lente | Lunghezze dei campi | Ricerca («Nessun evento con «…»»), moduli, Temi |
| Altre chiavi della memoria del telefono | Lingua, città, tema, mezzo, strati, combinazioni, lenti (`dl_lenti`), calendario | Solo valori che l'app conosce; per le lenti solo strati e temi dell'app e un nome di 16 caratteri al massimo | Barra degli strati, Temi |
| File importato nell'app della redazione (Excel, CSV; l'importazione da JSON è tolta nel blocco 12) | Tutte le colonne | Controlli dell'importazione (`rigaDalFile()`, formato degli eventi) | Anteprima dell'importazione (T-042), con i gruppi di righe e la scheda della riga; nessun evento resta nella memoria del dispositivo: si pubblica allo sportello |
| Storico e Misure dell'app della redazione (`red_storico`, `red_misure`) | Note, nomi dei giri di prova, azioni, appunti, conteggi | Tipi di operazione conosciuti; conteggi e soglie trattati come numeri | Storico delle operazioni, schede delle Misure |
| Chiavi della Redazione (app della redazione, T-034): nome del dispositivo scritto dalla persona, nome del file della copia scelto dal dispositivo, contenuto di una copia di riserva o di una copia della cassaforte | Nome del dispositivo, nome del file, nomi dei dispositivi e impronte scritti nella copia | Nome: al massimo 40 caratteri, senza caratteri di controllo; la copia si apre solo con la frase e i suoi campi si controllano uno per uno | Schermata «Chiavi», riga delle chiavi negli strumenti |
| «Viene dal nostro archivio?» (app della redazione, T-037): testo incollato o file aperto dal dispositivo | Tutto il testo | Si cercano soltanto gli identificativi (16 caratteri, trattino, 8 caratteri dell'alfabeto a-z, 2-7) | Esito della verifica, con l'elenco degli identificativi trovati |
| Eventi nascosti nell'app della redazione (T-045): file cifrati letti dallo sportello e aperti con le password della cassaforte; la password generata | Gli stessi campi di un evento; la password (parole dell'elenco) | Le voci dello sportello: `controllaFile()`; gli eventi aperti si mostrano solo con `esc()` | Elenco «Nascosti», scheda dell'evento, riquadro della password, ripristino, confronto delle copie |
| Registro delle fonti (app della redazione, T-041, T-043): il registro cifrato del dispositivo (`red_registro`), il file del registro tenuto a mano importato, le buste che lo sportello restituisce | Nomi delle fonti, indirizzi, attribuzioni, note, titoli delle righe, organizzatori ed eventi dei «Non pubblicati», rettifiche | Forma delle voci (`regInForma()`), codici FS, F e NP nella loro forma, lunghezze; le buste si aprono solo con la chiave del registro | Schermata «Registro delle fonti», elenco delle fonti, «Non pubblicati», anteprima dell'importazione (contrasti), confronto con lo sportello: tutti con `esc()`; il file esportato scrive i testi come testo (`excel.js`) |
| Calendari aperti dei Comuni (app della redazione, T-044): file CSV, .xlsx, JSON o iCalendar scaricati dal dispositivo | Titoli, giorni e ore, luoghi, indirizzi, collegamenti, organizzatori, categorie, descrizioni del Comune, identificativi, nomi delle colonne | Limiti del modulo Excel (20 MB, 10.000 righe); collegamenti solo https; le righe passano dai controlli dell'importazione (`rigaDalFile()`, formato degli eventi); la descrizione del Comune non entra nell'evento | Corrispondenza delle colonne (nomi delle colonne e valori del primo evento), anteprima, scheda della riga (testo del Comune da riscrivere): tutti con `esc()` |
| Strumenti dei diritti delle persone (app della redazione, T-047-T-049): gli eventi dello sportello (attuali e copie dello storico, nascosti aperti con la cassaforte), le schede preparate, le righe dell'importazione e del calendario aperti; le forme del nome e i brani scritti dalla Redazione | Titoli, brani attorno al nome, fonti, codici R, C e P, nomi delle persone per la copia dell'assistenza | Gli eventi hanno già passato i controlli della loro fonte; le forme del nome si leggono riga per riga (`sorgenti/moduli/nomi.js`), al più 20 di 120 caratteri; i codici si controllano nella loro forma | Punti trovati da «Togli questo nome ovunque» (il nome evidenziato con `mark`), resoconto dell'accesso (brani nei campi), portabilità, «Esporta per assistenza» (elenco, anteprima, tabella di corrispondenza): tutti con `esc()`; i file Excel scrivono i testi come testo (`excel.js`), il JSON con `JSON.stringify` |
| Segnalazioni (T-050-T-052): nel modulo «Segnala» il titolo e l'identificativo dell'evento e ciò che la persona scrive; nell'app della redazione le segnalazioni che lo sportello restituisce, aperte con la chiave di cifratura | Titolo dell'evento, identificativo, motivo, descrizione, email, nome | Nel modulo: lunghezze dei campi; il messaggio di posta si compone con `encodeURIComponent`. Le buste: forma (`bustaValida()`), poi, aperte, `controlla()` di `sorgenti/moduli/segnalazione.js` (solo campi conosciuti, identificativo nella forma del formato, lunghezze, email nella sua forma); una busta che non si apre o non supera i controlli si mostra soltanto come «Segnalazione che non si apre» | Modulo «Segnala» (titolo e identificativo nella testa, campi), messaggio dopo l'invio; schermate «Segnalazioni» (elenco e scheda): tutti con `esc()`; le righe dei registri si copiano come testo semplice, senza tabulazioni né a capo nelle celle |
| Archivio dei registri e copia di sicurezza degli eventi (app della redazione, T-053, T-054): il nome del file scelto dal dispositivo, l'elenco dello sportello dell'archivio (nomi dei file, nomi dei dispositivi), il nome del file della copia e il suo contenuto aperto con la frase (eventi, nome del dispositivo) | Nomi di file e di dispositivi; gli stessi campi di un evento | Nomi dei file: soltanto lettere, cifre, «_» e «-» per entrare nell'archivio (`tipoNome()`, `sportelli/archivio.js`); copia: impronta di ogni file, formato degli eventi (`verifica()`, `copia-eventi.js`) | Schermate «Archivio» e «Copia di sicurezza degli eventi», ripristino (`esc()`) |
| File degli avvisi delle novità (`avvisi.json`, T-031) | Testo dell'avviso, tipo, testo da aprire | `errori()` (`avvisi.js`): solo campi conosciuti, testo fino a 600 caratteri, tipo e testo da aprire tra quelli previsti; nessun collegamento | Avviso in basso, all'apertura |
| Mappa (dati di OpenStreetMap nel file della mappa) | Nomi di vie e luoghi | Nessuno | Solo nel disegno della mappa (MapLibre li disegna, non li scrive nella pagina) |

Non sono testi esterni, perché viaggiano con l'app e si rivedono prima di pubblicarla: i testi dell'interfaccia e le loro traduzioni (`traduzioni.js`), i contenuti d'esempio di Agorà e Progetti (`anteprime/`), i testi pubblicati (`sorgenti/testi/`, T-055: il montaggio li controlla con un insieme chiuso di elementi e di attributi, senza script, gestori né stili, e vi mette i valori della configurazione con `esc()`; `sorgenti/testi-pubblicati.js`), gli strati e le icone, la configurazione. Anche questi, dove passano da un attributo, passano da `esc()`.

## I punti in cui il codice scrive nella pagina

Sono 50, tutti in `sorgenti/parti/`. La prova `prove/testi.js` li conta: se il numero di un file cambia, si ferma finché il punto nuovo non è stato rivisto e annotato qui.

| File | Punti | Che cosa scrivono |
| --- | --- | --- |
| `app2.js` | 11 | Messaggi della mappa che non si carica; segnaposto (eventi, gruppi, regioni, tappe); barra del tempo e dei tipi; barra degli strati; invito ad accendere gli strati |
| `app3.js` | 3 | Il foglio in basso: tutte le viste (strati, elenco, scheda, calendario, anteprima del PDF, moduli) passano da qui |
| `app4.js` | 9 | Risultati e suggerimenti della ricerca degli indirizzi; riquadro del punto; mirino di «Scegli sulla mappa» |
| `app5.js` | 8 | Testi pubblicati (dai modelli della pagina, T-055); nome della città; guida; avvisi in alto; avviso delle novità (testo del file degli avvisi, con `esc()`, e lingua) |
| `app6.js` | 7 | Aggiornamenti del modulo Off-Grid mentre si scrive (suggerimenti, riquadro del punto); pagina di stampa delle carte di Agorà e Progetti |
| `app7.js` | 2 | Pagina dei Temi e foglio delle lenti |
| `redazione/misure.js` | 2 | Solo nell'app della redazione: schede delle Misure e loro fumetto |
| `redazione/pubblicazione.js` | 2 | Solo nell'app della redazione: aggiornamenti del modulo dell'evento mentre si scrive (ricerca dell'indirizzo, riquadro del punto). Le schermate di «Pubblicazione» mostrano titoli, luoghi, fonti, nomi dei dispositivi e risposte dello sportello: tutti con `esc()` (T-038) |
| `redazione/scheda-pubblicazione.js` | 1 | Solo nell'app della redazione: il riquadro degli avvisi della scheda di pubblicazione, aggiornato mentre si scrive; le parole trovate nei testi dell'evento vi entrano con `esc()`. La scheda, l'elenco delle fonti e le schede preparate mostrano nomi delle fonti, titoli e note letti dal registro cifrato del dispositivo (`red_registro`): tutti con `esc()` (T-041) |
| `sezioni.js` | 5 | Agorà e Progetti, con i contenuti d'esempio dell'app |

La pagina di stampa del calendario (`stampaPdf`) e quella delle carte non scrivono nella pagina dell'app: costruiscono un documento a parte, con le stesse regole. Il PDF (`creaPdf`) riceve testo semplice.

## Esito della verifica (21/11/2026)

La verifica ha riletto tutti i modelli di pagina di `sorgenti/parti/` e ha provato nel browser ogni vista con testi ostili in ogni fonte. Stato di partenza: la protezione era usata quasi ovunque. Corretto:

- una seconda funzione di protezione in `sezioni.js`, che non proteggeva l'apice, e due copie nel montaggio: ora c'è una sola funzione;
- storico delle operazioni: il numero di riga di una voce era scritto senza protezione, e un valore manomesso nella memoria del telefono diventava codice;
- Misure: i nomi dei giri di prova precedenti erano scritti senza protezione; conteggi e soglie letti dalla memoria del telefono ora valgono solo se sono numeri;
- modulo Off-Grid: numero civico nel riquadro del punto, date e orari nei campi ora passano dalla protezione;
- numeri per regione: il numero ora passa dalla protezione (l'indice è comunque controllato prima);
- Temi: una lente salvata con strati o temi che l'app non conosce bloccava la pagina; ora si scarta ciò che l'app non conosce;
- collegamenti: prima erano ammessi anche gli indirizzi `http`; ora solo `https`.

Nessun testo esterno arriva più nella pagina senza protezione nei punti provati. Lo scarto del § 3.11 del libro mastro («la verifica del codice dell'app, perché nessun testo degli eventi venga scritto nella pagina come codice») si chiude, nel registro delle questioni aperte, quando questa versione va sul sito vero.

Resta fuori da questa verifica ciò che non esiste ancora: il modulo di segnalazione (T-050), l'app della redazione separata (blocco 8) e lo sportello (blocco 9), che useranno lo stesso modulo e le stesse prove. Le intestazioni di sicurezza, che fermano il codice estraneo anche se una protezione mancasse, arrivano con T-060 e T-075.

## Le prove

- `prove/testi.js` (a ogni montaggio): la funzione e `collegamento()`; nessun'altra funzione di protezione; nessun gestore e nessun `javascript:` nei sorgenti e nelle uscite; attributi tra virgolette; collegamenti e indirizzi protetti; inventario dei punti che scrivono nella pagina.
- `prove/browser/ostili.js`: testi ostili inventati in ogni fonte della tabella, tutte le viste aperte una per una, compresi l'anteprima del PDF, la pagina di stampa e il PDF scaricato. Fallisce se un testo diventa un elemento o si esegue, se compare un collegamento che non è https, se un elemento ha un gestore, e anche se un testo ostile non arriva più in nessuna pagina (la prova non lo coprirebbe più).
- `prove/eventi.js` e `prove/quadranti.js`: il formato rifiuta i collegamenti non https e i campi sconosciuti; indici manomessi non si usano.

Chi aggiunge una vista o una fonte di testi: usa `esc()` e `collegamento()`, aggiunge la fonte alla tabella e alla prova nel browser, aggiorna il conteggio in `prove/testi.js`.
