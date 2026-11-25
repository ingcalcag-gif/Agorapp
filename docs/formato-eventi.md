# Formato pubblico degli eventi, versione 1

Questo documento descrive come sono scritti gli eventi pubblici nei file dell'archivio comune (voce T-020 del piano di adeguamento; libro mastro, §§ 2.2, 2.4, 5.3, 6.5 e 11.3). Il formato è uno solo per tutti: l'app della redazione prepara gli eventi in questa forma, lo sportello di pubblicazione li accetta solo in questa forma, l'app pubblica li legge in questa forma.

Il controllo è scritto una volta sola, in `sorgenti/moduli/eventi.js` (funzione `controlla`), e lo usano tutti e tre. Un evento che non lo supera non si pubblica e, se arriva comunque al telefono, non si mostra. La prova `prove/eventi.js` controlla che questo documento e il modulo elenchino gli stessi campi.

## Un evento

Un evento è un oggetto JSON con i campi qui sotto e nessun altro: un campo sconosciuto fa rifiutare l'evento. I testi sono semplici testi: l'app li mostra sempre come testo, mai come codice della pagina (§ 3.11). Le lunghezze sono in caratteri.

| Campo | Obbligatorio | Che cosa contiene | Regole |
| --- | --- | --- | --- |
| `id` | sì | Identificativo dell'evento | 16 caratteri casuali, un trattino, 8 caratteri del segno del marcatore (T-037; §§ 2.4 e 6.5); alfabeto `a-z` e `2-7`. Esempio: `k3m7q2a5x4t6w7p5-r2d4f6h3` |
| `titolo` | sì | Titolo dell'evento | Fino a 100 caratteri, su una riga |
| `strato` | sì | Strato a cui appartiene | Chiave di uno strato dell'app (`musica`, `arte`, `sport`…: `sorgenti/dati/strati.js`) |
| `sottostrato` | no | Sottostrato | Chiave di un sottostrato dello stesso strato (`jazz`, `mostre`…) |
| `tema` | no | Tema trasversale | Uno dei temi dell'app, scritto come nell'app (`Beni comuni`, `Mobilità dolce`…), fino a 40 caratteri |
| `inizio` | sì | Giorno e ora di inizio | `AAAA-MM-GGTHH:MM`, ora italiana, come la legge chi va all'evento |
| `fine` | no | Giorno e ora di fine | Come `inizio`; dopo l'inizio, al massimo 366 giorni dopo. Non insieme a `durata` |
| `durata` | no | Durata in minuti | Numero intero da 1 a 1440. Non insieme a `fine`; per eventi più lunghi si usa `fine` |
| `luogo` | sì | Nome del luogo | Fino a 120 caratteri, su una riga (§ 11.3, regola 1) |
| `indirizzo` | sì | Indirizzo, come lo indica la fonte | Fino a 200 caratteri, su una riga |
| `collocazione` | sì | Come è stato messo il punto sulla mappa | `indirizzo` (trovato dalla ricerca degli indirizzi) oppure `a_mano` (indirizzo non trovato, punto messo dalla Redazione: § 2.2) |
| `descrizione_luogo` | no | Come si raggiunge il luogo, a parole | Fino a 300 caratteri; sempre facoltativa, anche per gli eventi collocati a mano: consigliata quando l'indirizzo non basta a trovare il luogo (decisione del 23/11/2026, eccezione al § 11.3, regola 2) |
| `lat` | sì | Latitudine del punto | Numero con al massimo 6 decimali; il punto deve stare nel riquadro dell'Italia |
| `lng` | sì | Longitudine del punto | Come `lat` |
| `organizzatore` | no | Chi organizza, quando è noto | Fino a 120 caratteri, su una riga (§ 2.2) |
| `descrizione` | sì | Descrizione dell'evento | Fino a 2000 caratteri; può andare a capo |
| `prezzo` | no | Prezzo, come lo indica la fonte | Fino a 80 caratteri, su una riga (per esempio «Gratuito», «10 €», «Offerta libera») |
| `fonte` | sì | Il campo «Fonte:» (§ 5.3) | Oggetto con `testo` (obbligatorio, fino a 160 caratteri: il nome della fonte) e `collegamento` (facoltativo: un indirizzo `https`, fino a 500 caratteri, senza nome utente o password) |
| `modificato` | sì | Ultima modifica dell'evento | `AAAA-MM-GGTHH:MM:SSZ`, in tempo universale (UTC) |

I testi su una riga non possono contenere a capo né caratteri di controllo; `descrizione` e `descrizione_luogo` possono andare a capo.

## Che cosa resta fuori

Nel formato non c'è posto per: immagini (§ 6.2), password, la provenienza interna e il flusso dell'evento (consenso dell'organizzatore o fonte pubblica: stanno nel registro delle fonti, cap. 22), le colonne del registro delle fonti, i nomi di chi ha segnalato l'evento (§ 5.3, regola 5). Non c'è neppure un collegamento separato al sito di chi organizza: il collegamento è quello della fonte (§ 5.3, tabella). Gli eventi nascosti usano lo stesso formato, ma viaggiano cifrati, in file propri fuori dall'indice e dai quadranti (§ 2.3; blocco 11, `docs/eventi-nascosti.md`).

## Le ore

`inizio` e `fine` sono ore italiane (fuso di Roma), scritte senza indicazione del fuso, come compaiono nella scheda. La funzione `istante` del modulo le trasforma nel momento esatto, uguale su qualunque telefono e server; nelle notti del cambio dell'ora un orario che esiste due volte vale la prima volta, uno che non esiste vale come se l'ora non fosse ancora cambiata. La fine di un evento è `fine`, oppure l'inizio più `durata`, oppure, se mancano entrambe, l'inizio stesso. Un evento esce da mappa e agenda tre ore dopo la fine (§ 2.2; funzione `uscitaMs`).

## La riserva dell'estrazione

Ogni file dell'archivio porta in testa la riserva dell'estrazione di testo e di dati in forma leggibile dalle macchine (§ 6.5; direttiva (UE) 2019/790, art. 4, par. 3, e cons. 18): il campo `tdm-reservation` con il valore `1`. Il nome del campo viene dal protocollo pubblico per la riserva (TDM Reservation Protocol); gli standard tecnici da usare sono «da verificare» e si fissano con T-056, che può aggiungere il riferimento alle condizioni d'uso. La forma dei file è descritta qui sotto.

## L'archivio: quadranti e indice

L'archivio comune non è un file unico: il telefono non scarica una città intera (§ 2.4, «La lettura degli eventi»). Il modulo `sorgenti/moduli/quadranti.js` contiene la griglia e le funzioni per scrivere e leggere l'archivio; lo usano chi lo scrive (oggi lo strumento dell'archivio di prova, poi lo sportello di pubblicazione, blocco 9) e l'app pubblica.

**La griglia.** Una griglia fissa divide l'Italia in quadranti: 0,45 gradi di latitudine (circa 50 km) per 0,6 gradi di longitudine (da circa 54 km in Sicilia a 45 km in Alto Adige), a partire dall'angolo sud-ovest (35,4° N, 6,5° E); 27 righe da sud a nord e 21 colonne da ovest a est, fino a 47,55° N e 19,1° E. Un quadrante si chiama `q<riga>-<colonna>`, con due cifre ciascuna: Torino è in `q21-01` (la parte a est del Po in `q21-02`), Milano in `q22-04`, Roma in `q14-09`. Un punto esattamente sul bordo appartiene al quadrante a nord e a est. La griglia non cambia: se cambiasse, sarebbe una versione nuova dell'archivio.

**I file dei quadranti.** Ogni quadrante con almeno un evento ha il suo file, con gli eventi che non sono ancora usciti dalla mappa, uno per riga, in ordine di inizio:

```
{"formato":"eventi-quadrante","versione":1,"tdm-reservation":1,"quadrante":"q21-01","eventi":[
{…un evento…},
{…un evento…}
]}
```

**L'indice.** Un file piccolo, `indice.json`, dice per ogni quadrante il nome del file, la sua versione e quanti eventi contiene, e per ogni regione quanti eventi ci sono, dove mettere il numero sulla mappa vista da lontano (`punto`, un punto interno della regione) e dove portare chi lo tocca (`vai`, il punto medio degli eventi del quadrante più pieno della regione):

```
{"formato":"eventi-indice","versione":1,"tdm-reservation":1,"generato":"2026-11-20T05:00:00Z",
 "griglia":{"versione":1,"ovest":6.5,"sud":35.4,"passo_lat":0.45,"passo_lng":0.6,"righe":27,"colonne":21},
 "quadranti":{"q21-01":{"file":"quadranti/q21-01-<versione>.json","v":"<versione>","eventi":10}, …},
 "regioni":[{"nome":"Piemonte","punto":[7.9108,44.9987],"eventi":14,"vai":[7.6803,45.0729],"uscite":[[29921820,1], …]}, …]}
```

La versione di un quadrante è un'impronta breve del contenuto del suo file (funzione `impronta`): cambia quando cambia il file. Il nome del file la contiene, così nessuna copia vecchia, nel telefono o nella rete di consegna, si scambia per quella nuova; il telefono scarica di nuovo solo i quadranti la cui versione è cambiata. L'indice elenca solo i quadranti e le regioni con almeno un evento.

**Le uscite.** L'indice si scrive quando la Redazione pubblica, ma gli eventi escono dalla mappa anche tra una pubblicazione e l'altra. Per questo ogni regione porta anche `uscite`: coppie `[minuto, quanti]`, in ordine, che dicono quanti dei suoi eventi escono e quando (il minuto si conta dal 1970, in tempo universale); in tutto fanno il numero della regione. Il telefono toglie dal numero quelli già usciti (funzione `eventiVivi`) e non mostra una regione rimasta senza eventi: il numero scende da solo, anche senza rete. Sono soltanto numeri. Esempio: `"eventi":14,"uscite":[[29921820,1],[29923080,2], …]`.

**Chi scrive l'archivio.** Lo sportello di pubblicazione (`sportelli/pubblicazione.js`, `docs/sportello-pubblicazione.md`), a ogni pacchetto firmato della Redazione: scrive i file nuovi dei quadranti, poi l'indice, e toglie subito i file che l'indice nuovo non nomina, perché un evento ritirato o sospeso non resti leggibile in un file vecchio. Un telefono che non trova più un file richiede l'indice.

**Le regioni.** La regione di un evento si ricava dalle sue coordinate con i confini semplificati delle venti regioni in `sorgenti/dati/regioni.json` (da Natural Earth, pubblico dominio; strumento `strumenti/genera-regioni.mjs`); un punto in mare vicino alla costa, entro 40 km, va alla regione più vicina. Il telefono non riceve i confini: gli bastano i numeri e i punti dell'indice.

**Che cosa controlla chi legge.** L'app usa un indice solo se ha questo formato, questa versione e la stessa griglia, e se i nomi dei file stanno nella cartella dell'archivio (funzione `controllaIndice`); di un file di quadrante tiene solo gli eventi validi che stanno davvero in quel quadrante (funzione `eventiDelQuadrante`).

**Come lo legge l'app pubblica (T-022).** Il modulo `sorgenti/moduli/archivio.js` chiede l'indice all'apertura e al ritorno nell'app dopo più di trenta minuti, ricontrollandolo sempre con il server; quando la mappa resta ferma per mezzo secondo e la zona inquadrata sta dentro il quadrante del centro e gli otto intorno, scarica quei quadranti che hanno eventi e non ha già nella versione giusta. Da più lontano l'app mostra soltanto i numeri per regione e invita ad avvicinarsi. Nessuna richiesta porta cookie, credenziali o parametri. I file scaricati restano sul telefono (memoria del browser per i file, `dl_archivio`) come «eventi delle zone consultate» (§ 3.7): l'app li mostra subito alla riapertura, anche senza rete, riscarica solo i quadranti cambiati e cancella i file che l'indice non nomina più. Elenco e mappa mostrano gli eventi della zona inquadrata; calendario, ricerca e Temi anche quelli delle altre zone consultate. Gli eventi escono da mappa e agenda tre ore dopo la fine.

**L'archivio di prova.** `prova/archivio/` contiene l'unico archivio del repository: eventi inventati (`strumenti/archivio-prova.json`, approvati da Lorenzo il 20/11/2026), scritti con `node strumenti/genera-archivio-prova.mjs [--da=AAAA-MM-GG]`. Nessun evento reale entra mai nel repository (§ 2.6). La prova `prove/quadranti.js` controlla che i file siano esattamente quelli che lo strumento produce.

## Versioni del formato

Questo documento descrive la versione 1 (`FORMATO` nel modulo). Un cambiamento che rende non validi eventi che prima lo erano, o che aggiunge un campo, porta a una versione nuova: si aggiornano insieme questo documento, il modulo e la sua prova.
