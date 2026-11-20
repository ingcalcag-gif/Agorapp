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
| `descrizione_luogo` | solo per `a_mano` | Come si raggiunge il luogo, a parole | Fino a 300 caratteri; obbligatoria per gli eventi collocati a mano (§ 11.3, regola 2) |
| `lat` | sì | Latitudine del punto | Numero con al massimo 6 decimali; il punto deve stare nel riquadro dell'Italia |
| `lng` | sì | Longitudine del punto | Come `lat` |
| `organizzatore` | no | Chi organizza, quando è noto | Fino a 120 caratteri, su una riga (§ 2.2) |
| `descrizione` | sì | Descrizione dell'evento | Fino a 2000 caratteri; può andare a capo |
| `prezzo` | no | Prezzo, come lo indica la fonte | Fino a 80 caratteri, su una riga (per esempio «Gratuito», «10 €», «Offerta libera») |
| `fonte` | sì | Il campo «Fonte:» (§ 5.3) | Oggetto con `testo` (obbligatorio, fino a 160 caratteri: il nome della fonte) e `collegamento` (facoltativo: un indirizzo `https`, fino a 500 caratteri, senza nome utente o password) |
| `modificato` | sì | Ultima modifica dell'evento | `AAAA-MM-GGTHH:MM:SSZ`, in tempo universale (UTC) |

I testi su una riga non possono contenere a capo né caratteri di controllo; `descrizione` e `descrizione_luogo` possono andare a capo.

## Che cosa resta fuori

Nel formato non c'è posto per: immagini (§ 6.2), password, la provenienza interna e il flusso dell'evento (consenso dell'organizzatore o fonte pubblica: stanno nel registro delle fonti, cap. 22), le colonne del registro delle fonti, i nomi di chi ha segnalato l'evento (§ 5.3, regola 5). Non c'è neppure un collegamento separato al sito di chi organizza: il collegamento è quello della fonte (§ 5.3, tabella). Gli eventi nascosti non usano questo formato: viaggiano cifrati, in file propri (§ 2.3; blocco 11).

## Le ore

`inizio` e `fine` sono ore italiane (fuso di Roma), scritte senza indicazione del fuso, come compaiono nella scheda. La funzione `istante` del modulo le trasforma nel momento esatto, uguale su qualunque telefono e server; nelle notti del cambio dell'ora un orario che esiste due volte vale la prima volta, uno che non esiste vale come se l'ora non fosse ancora cambiata. La fine di un evento è `fine`, oppure l'inizio più `durata`, oppure, se mancano entrambe, l'inizio stesso. Un evento esce da mappa e agenda tre ore dopo la fine (§ 2.2; funzione `uscitaMs`).

## La riserva dell'estrazione

Ogni file dell'archivio porta in testa la riserva dell'estrazione di testo e di dati in forma leggibile dalle macchine (§ 6.5; direttiva (UE) 2019/790, art. 4, par. 3, e cons. 18): il campo `tdm-reservation` con il valore `1`. Il nome del campo viene dal protocollo pubblico per la riserva (TDM Reservation Protocol); gli standard tecnici da usare sono «da verificare» e si fissano con T-056, che può aggiungere il riferimento alle condizioni d'uso. La forma dei file dell'archivio (quadranti e indice) si aggiunge qui con T-021.

## Versioni del formato

Questo documento descrive la versione 1 (`FORMATO` nel modulo). Un cambiamento che rende non validi eventi che prima lo erano, o che aggiunge un campo, porta a una versione nuova: si aggiornano insieme questo documento, il modulo e la sua prova.
