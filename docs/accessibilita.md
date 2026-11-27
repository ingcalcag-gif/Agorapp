# Accessibilità

Voci T-057, T-058 e T-059 del piano di adeguamento (blocco 16). Libro mastro: cap. 11 (§ 11.1, tabella delle misure e metodo della verifica; § 11.3, regola 4); cap. 28-bis (registro dell'accessibilità). Riferimento tecnico: WCAG 2.1, livello AA, come recepite dalla EN 301 549. Questo documento non è una dichiarazione di accessibilità e non dice che l'app è accessibile o conforme (§ 11.1; § 2.5, principio 7): descrive ciò che il codice fa e ciò che le prove controllano.

## Che cosa fa l'app

**Fogli, finestre e avvisi (T-057).** Ogni foglio (elenco, scheda, calendario, Impostazioni, informazioni legali, moduli…) è una finestra di dialogo (`role="dialog"`, `aria-modal="true"`) con il nome del suo titolo. All'apertura il cursore va sul titolo; Tab e Maiusc+Tab restano dentro il foglio finché resta aperto; Esc fa ciò che fa la sua croce (dalle note legali si torna al foglio di partenza); alla chiusura il cursore torna al comando che aveva aperto il primo foglio. Quando un foglio si ridisegna (per esempio dopo «Scuro» nelle Impostazioni) il cursore resta sul comando equivalente. La guida della prima apertura è una finestra modale con il cursore dentro. Gli avvisi in basso e l'avviso delle novità sono annunciati (`role="status"`, `aria-live`); quando cambia il numero delle cose sulla mappa, il lettore di schermo lo dice («12 cose sulla mappa»), non all'apertura. Codice: `sorgenti/parti/app3.js` (`nominaFoglio`, `disegnaFoglio`), `app6.js` (`trattieniFuoco`, Esc), `app5.js` (guida), `app2.js` (`annunciaConta`).

**Struttura.** Intestazione (`header`), contenuto principale (`main`, uno solo: la scena con la mappa, le sezioni e i fogli), navigazione (`nav`). Prima del blocco 16 le pagine di Agorà, Progetti e Temi erano altri `main`.

**Contorno della tastiera.** Ogni comando raggiunto con la tastiera ha un contorno verde di 2 punti (`:focus-visible`); la mappa ne ha uno di 3 punti dentro il bordo.

**Nomi.** I pulsanti fatti solo di un'icona hanno un nome tradotto; il nome dei tasti con un testo visibile comincia con quel testo (città: «Torino · Scegli città o zona»; calendario: «Calendario» e il numero). I segnaposto della mappa non sono più comandi annidati: il comando è il tasto che hanno dentro, con la sua etichetta.

**Contrasti e misure (T-058).** Testo, testo secondario, collegamenti ed errori almeno 4,5:1, in chiaro e in scuro, anche sui tre vetri sopra la mappa (calcolati sopra il colore più chiaro e il più scuro della mappa di ciascun tema); bordi di campi e interruttori (`--bordo-comando`) e contorno della tastiera almeno 3:1. Comandi di almeno 24 punti per lato, 44 dove c'è spazio; restano più piccoli soltanto i collegamenti dentro una riga di testo (per esempio «© OpenStreetMap» nell'angolo della mappa), come ammette il criterio. Nessun blocco dello zoom; a 320 punti di larghezza (il testo al doppio su un telefono di 640) nulla esce dallo schermo e nessun pezzo della barra in alto ne copre un altro.

**Preferenze del telefono.** Tema scuro: l'app lo segue finché la persona non sceglie Chiaro o Scuro nelle Impostazioni, anche se cambia mentre l'app è aperta; la scelta del telefono non si salva (prima del blocco 16 il primo accesso era sempre chiaro). Animazioni ridotte: niente movimento in nessuna parte dell'app (la mappa le salta da sé). Contrasto aumentato: superfici piene sopra la mappa, testo secondario più marcato, linee e bordi più scuri (o più chiari nel tema scuro).

**Linguaggio semplice (T-059).** Ogni testo italiano dell'interfaccia pubblica di almeno 10 parole ha l'indice Gulpease di almeno 60 (comprensibile con la licenza media); l'indice medio è 79. Fa eccezione la dichiarazione di buona fede del modulo «Segnala», che ripete le parole del DSA. Riscritti nel blocco 16 i quattro testi sotto la soglia (sezioni dimostrative di Agorà e Progetti), con le traduzioni.

## Prove

| Prova | Che cosa controlla |
| --- | --- |
| `prove/browser/accessibilita.js` | axe-core, regole WCAG 2.1 A e AA, su mappa, elenco, scheda, «Segnala» (anche con gli errori), calendario, cerca, Impostazioni, Agorà, Progetti, Temi: nessuna violazione ammessa (i 15 scarti noti sono chiusi) |
| `prove/browser/accessibilita-uso.js` | Fogli e guida con la tastiera (annuncio, cursore trattenuto, Esc, ritorno, ridisegno); struttura; contorno su ogni comando raggiunto con Tab; nomi tradotti dei pulsanti fatti di un'icona; tema scuro del telefono con axe-core sui contrasti; animazioni ridotte; contrasto aumentato; misure a 393 punti; testo al doppio a 320 punti; sola tastiera sui percorsi essenziali |
| `prove/contrasti.js` | I contrasti calcolati dai colori di `style.css` e della mappa |
| `prove/linguaggio.js` | L'indice Gulpease dei testi dell'interfaccia pubblica |

## Collaudo del 27/11/2026 (blocco 16), nel formato del registro dell'accessibilità

Righe da trascrivere nel file «Reg28bis_Accessibilita» (cap. 28-bis), senza dati di persone. I codici definitivi li assegna chi tiene il registro.

### Foglio «Verifiche» (ACC-V)

| Rilascio | Tipo di verifica | Strumento automatico ed esito | Tastiera, testo ingrandito, lettore di schermo | Percorsi principali | Persone con disabilità coinvolte | Scarti trovati | Esito |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ramo «adeguamento», blocco 16 (versione da rilasciare dopo il nome definitivo) | Verifica dello Sviluppo, automatica, prima del Collaudo | axe-core 4, regole WCAG 2.1 A e AA, dieci schermate in chiaro e quattro in scuro: nessuna violazione | Tastiera: provata in modo automatico (Chromium senza finestra); testo al doppio: 320 punti di larghezza, provato; lettore di schermo: non provato (da fare sul telefono) | Trovare un evento, aprirne la scheda, salvarlo nel calendario, scrivere con «Segnala»: con la sola tastiera, superati | Nessuna | Vedi «Scarti» | In parte: manca la prova con il lettore di schermo |

### Foglio «Scarti» (ACC-G)

| Data di rilevazione | Origine | Requisito e livello | Schermata | Descrizione | Chi ne è svantaggiato | Alternativa accessibile oggi | Soluzione prevista | Priorità | Rilascio previsto |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 27/11/2026 | Collaudo del blocco 16 | 4.1.2 (A), 1.3.1 (A), 2.4.3 (A) | Tutte | Il comportamento con VoiceOver (iPhone) e TalkBack (Android) non è stato provato: le prove automatiche simulano la tastiera, non il lettore di schermo | Persone cieche | Nessuna verificata | Prova a mano sui quattro percorsi con i due lettori di schermo (debug finale) | Alta | Prima del lancio |
| 27/11/2026 | Collaudo del blocco 16 | 3.1.5 (AAA, adottato come obiettivo dal § 11.1) | Tutte | I testi rispettano un indice minimo di leggibilità ma non sono stati riletti con persone con disabilità cognitive o che imparano l'italiano; le traduzioni non sono misurate | Persone con disabilità cognitive, chi impara l'italiano | Testi brevi, indice medio 79 | Rilettura con persone vere quando ci sono gli interlocutori (§ 11.1, cap. 3, § 3.10) | Media | Dopo il lancio (il piano lo ammette, T-059) |
| 27/11/2026 | Collaudo del blocco 16 | 1.4.3 (AA), 1.4.11 (AA) | Mappa e fogli sopra la mappa | I contrasti sopra la mappa sono calcolati con i colori della mappa, non con i segnaposto e le etichette che passano sotto il vetro; i colori cambieranno con l'identità grafica (T-077) | Persone ipovedenti | Contrasto aumentato del telefono: superfici piene | Verifica a occhio e nuovo calcolo dopo T-077 | Media | Con T-077 |
| 27/11/2026 | Collaudo del blocco 16 | 1.4.4 (AA) | Tutte | Il testo ingrandito si prova riducendo la larghezza a 320 punti; l'ingrandimento del testo nelle impostazioni del telefono (Android) non è stato provato su un telefono vero | Persone ipovedenti | Zoom con due dita sempre possibile | Prova a mano con il testo del telefono al massimo (debug finale) | Media | Prima del lancio |

### Foglio «Misure»

| Misura (§ 11.1) | A chi serve | Stato secondo il § 11.1 | Stato verificato |
| --- | --- | --- | --- |
| Preferenze del telefono: tema scuro, animazioni ridotte, contrasto aumentato | Persone con disturbi della vista, sensibilità al movimento o fotosensibilità | Realizzata | Realizzata, provata in modo automatico (il tema scuro del telefono vale dal blocco 16) |
| Testo ingrandibile, dimensioni relative | Persone ipovedenti | Realizzata | In parte: a 320 punti nulla esce dallo schermo; testo del telefono al massimo da provare |
| Contorno visibile per chi usa la tastiera | Chi non usa lo schermo tattile o il mouse | Realizzata | Realizzata, provata su ogni comando raggiunto con Tab, mappa compresa |
| Pulsanti di almeno 24 pixel per lato | Persone con difficoltà motorie | Realizzata | Realizzata, provata sulle schermate principali |
| «Modalità semplice» | Persone anziane o con poca familiarità digitale | Realizzata | Non riprovata nel blocco 16 |
| Interfaccia in cinque lingue, arabo da destra a sinistra | Chi non legge l'italiano | Realizzata | Realizzata |
| Etichette tradotte dei pulsanti fatti di un'icona | Chi usa un lettore di schermo | Realizzata | Realizzata, provata in inglese |
| Intestazione, navigazione e contenuto principale | Chi usa un lettore di schermo | Realizzata in parte | Realizzata dal blocco 16 |
| Finestre, avvisi e pannelli annunciati, con il cursore trattenuto | Persone cieche | Non realizzata | Realizzata dal blocco 16 (con la tastiera); lettore di schermo da provare |
| Testi in linguaggio semplice | Persone con disabilità cognitive, chi sta imparando l'italiano | Non realizzata | In parte dal blocco 16: indice Gulpease di almeno 60 per ogni testo; rilettura con persone da fare |
