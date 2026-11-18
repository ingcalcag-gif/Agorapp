# Prove automatiche

Le prove controllano a ogni montaggio, e su GitHub Actions a ogni invio su qualunque ramo, che l'app rispetti alcune regole del libro mastro (§§ 1.4 e 3.11: procedura per verificare le misure; § 11.1: verifica con uno strumento automatico; allegato A, A.7). Usano soltanto il codice del repository e dati inventati, e nessuna prova contatta servizi esterni: nel browser ogni richiesta verso un indirizzo diverso dal server locale è bloccata.

## Come si lanciano

| Comando | Che cosa fa |
| --- | --- |
| `npm run build` | Monta l'app (anche la copia «Nomeprova») e lancia le prove statiche, in un paio di secondi |
| `npm test` | Tutte le prove; quelle nel browser si saltano se Playwright non è installato |
| `npm run prove:installa` | Installa in `prove/` gli strumenti delle prove nel browser (Playwright, axe-core) e Chromium |
| `node prove/esegui.js --tutte --dettagli` | Come le lancia GitHub Actions: tutte, obbligatorie, con l'elenco degli scarti noti |
| `node prove/<nome>.js` | Una prova sola, con i dettagli |

## Le prove

| File | Che cosa controlla | Voce |
| --- | --- | --- |
| `sintassi.js` | Sintassi di ogni file JavaScript e JSON dell'app montata e degli strumenti | T-005 |
| `uscite.js` | Le uscite in `dist/` sono esattamente ciò che i sorgenti producono; il sito pubblica solo `dist/pubblica/` e lì non finiscono versioni archiviate, demo, dati o sorgenti | T-001, T-003 |
| `componenti.js` | Ogni libreria, carattere, dato o servizio di terzi dell'app ha la sua riga in `COMPONENTI_DI_TERZI.md`, con la stessa versione, e il testo della licenza è pubblicato; nessun file estraneo in `lib/` | T-004, T-007 |
| `nome.js` | «agorapp» non compare fuori da `sorgenti/config.js`: né nei sorgenti, né nell'app montata con il nome «Nomeprova». Ammesse solo le chiavi interne della memoria del telefono (`agorapp_…`) | T-002 |
| `indirizzi.js` | Nei testi dell'app montata non ci sono indirizzi esterni oltre a quelli di `config.js` (`indirizzi` e `collegamenti`); le librerie in `lib/` si controllano sull'impronta | T-005 |
| `collegamenti.js` | Ogni pagina ha la regola generale «no-referrer»; ogni collegamento verso altri siti si apre solo al tocco con `rel="noopener noreferrer"` e `referrerpolicy="no-referrer"`; nessun `iframe`, `embed`, `object` né preparazione di pagine esterne | T-012 |
| `chiavi.js` | Nessuna chiave, password o formula segreta nel codice | T-005 |
| `parole.js` | Parole vietate nei testi dell'interfaccia, nei contenuti d'esempio di Agorà e Progetti e nei testi legali tradotti, in italiano, inglese, spagnolo, francese e arabo, compresa la frase sui dati abbreviata; gli usi innocui rivisti con T-013 stanno, con la frase esatta e il motivo, nell'elenco `AMMESSI` della prova | T-005, T-013 |
| `anteprime.js` | Contenuti d'esempio di Agorà e Progetti: ogni istanza e ogni progetto completi; appuntamenti almeno un giorno dopo l'àncora e incontri passati almeno una settimana prima; nessun nome o luogo reale della colonna «Oggi» dell'allegato del 18/11/2026, nessun atto di istituzioni reali, nessun segnaposto tra parentesi quadre, recapito, indirizzo web o coordinata; segnaposto delle date validi e conservati nelle traduzioni; ogni testo tradotto nelle quattro lingue | T-015 |
| `browser/ostili.js` | Eventi inventati con testi ostili in ogni campo si mostrano come testo in elenco, scheda, Off-Grid, calendario e ricerca; nessun collegamento `javascript:` | T-005, T-024 |
| `browser/richieste.js` | Le richieste che il telefono fa davvero aprendo l'app, la scheda, il calendario con il PDF, le impostazioni e la ricerca: ammessi solo gli indirizzi di `config.js`; controlla anche che caratteri, MapLibre e jsPDF arrivino dall'app e che la ricerca degli indirizzi parta solo mentre si scrive, senza referrer, con il solo testo e parametri fissi (niente posizione, centro o zoom della mappa); la pressione prolungata mostra solo le coordinate con «Copia», senza richieste e senza salvare nulla; nella scheda ogni collegamento verso altri siti è senza referrer e la pagina ha la regola generale; la posizione del telefono non si salva; la scheda offre «Apri nelle mappe del telefono» (solo coordinate) su Android e «Copia indirizzo» altrove | T-007, T-008, T-009, T-012, T-016 |
| `browser/tolte.js` | Le funzioni tolte nel blocco 2 non lasciano tracce: niente pulsanti volontari in Città, Agorà e Progetti, nessuna richiesta a `/api/`, le chiavi del telefono delle funzioni tolte cancellate all'avvio; nessuna immagine negli eventi, né nei dati né nella scheda; niente Ordine delle Fate: chiavi ed eventi ricevuti cancellati, la vecchia formula è una password come le altre, niente strato né tasto dorato; niente demo degli eventi: chiave, eventi, Off-Grid e voci del calendario della demo cancellati all'avvio, nessun tasto o cartellino per caricarla (Impostazioni, guida, Agorà, Progetti), nessuna richiesta del suo file | T-010, T-011, T-014, T-015 |
| `browser/anteprime.js` | Su un telefono nuovo Agorà e Progetti sono piene, con la striscia «Demo» in ogni pagina, foglio e PDF; «Vedi sulla mappa» apre la mappa disegnata; «Salva in calendario», «Vorrei venire anch'io», i messaggi e i moduli «Proponi» funzionano senza email, recapiti o posta; Temi mostra «Nelle sezioni» con il bollino «Demo»; alla fine la memoria del telefono è identica, mappa e Calendario non hanno eventi d'esempio e il telefono ha chiesto solo file dell'app | T-015 |
| `browser/accessibilita.js` | Controllo automatico con axe-core delle regole WCAG 2.1 A e AA su mappa, elenco, scheda, calendario, ricerca e impostazioni | T-005, T-057-T-059 |

Le prove della memoria del telefono (solo chiavi dell'elenco chiuso) arrivano con il blocco 6 (T-026).

## Scarti noti

Molte regole oggi non sono ancora rispettate: le voci successive del piano le chiudono. `scarti-noti.js` elenca ogni caso trovato oggi, con la prova, il file, il numero di casi, la voce che lo chiude e il motivo. Una prova fallisce se trova un caso nuovo, se il numero dei casi cambia o se uno scarto non si trova più. Chi chiude uno scarto toglie la sua riga: così l'elenco resta vero ed è anche la lista di ciò che manca.

## Strumenti

Gli strumenti delle prove nel browser stanno in `prove/package.json` e non vanno mai nell'app: Playwright (Apache 2.0) apre l'app in un Chromium senza finestra con le misure di un telefono; axe-core (MPL 2.0) fa il controllo di accessibilità. Le prove statiche non hanno bisogno di nulla oltre a Node.
