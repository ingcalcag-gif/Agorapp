# Eventi nascosti: creazione cifrata e sblocco sul telefono

Voci T-045 e T-046 del piano di adeguamento (blocco 11). Libro mastro: § 2.3 (eventi nascosti); § 3.3, passo 4 (consenso dell'organizzatore prima della pubblicazione); § 3.7 (riga «Eventi nascosti sbloccati»); § 3.11 (cifratura sul dispositivo della redazione); § 3.14 (le password si cancellano quando l'evento finisce); § 9.2 (a che cosa servono); § 30.2 (scheda «Dati locali»); allegato A, A.2, punto 10; allegato C, C.2.

Il codice sta in `sorgenti/moduli/nascosti.js` (password, impronta, cifratura; nelle due app e nello sportello), `sorgenti/moduli/parole-nascosti.js` (le parole delle password; solo nell'app della redazione), `sorgenti/redazione/eventi-nascosti.js` (creazione, password, elenco, Misure), `sportelli/pubblicazione.js` (deposito dei file cifrati) e `sorgenti/parti/app1.js`, `app2.js`, `app3.js`, `app4.js`, `app6.js` (sblocco nell'app pubblica). Le prove sono `prove/nascosti.js` (senza browser) e `prove/browser/nascosti.js`; il giro di `prove/browser/memoria.js` sblocca un evento nascosto, e `prove/browser/ostili.js` ne sblocca uno con testi ostili.

## Le decisioni del 25/11/2026

1. La password si salva nella cassaforte dell'app della redazione, che la deve poter ritrovare per qualsiasi problema, e si cancella quando l'evento finisce (§§ 2.3 e 3.14).
2. La password è fatta di cinque parole italiane comuni pescate a caso dall'app da un elenco di 2048: si ricorda e si passa a voce, ma nessuno la può indovinare.
3. Una correzione tiene la stessa password e sostituisce il file.
4. Sui telefoni, se il file di un evento sbloccato non c'è più (sospeso o ritirato), l'evento non si mostra ma resta, con la password, fino a tre ore dopo la fine; se il file torna, ricompare.
5. Lo sportello conosce soltanto il giorno in cui l'evento nascosto esce dalla mappa, non l'ora.
6. Nelle Misure gli eventi nascosti contano come gli altri, con città e strato, aperti sul dispositivo della redazione con le password della sua cassaforte; mai nei numeri pubblici per regione.

## La password

Cinque parole dell'elenco, scelte a caso con gli strumenti del browser e senza preferenze: per esempio «nuvola tromba sedano faro lampo». Con 2048 parole le combinazioni sono 2048 alla quinta (circa 55 bit). Le parole hanno da 3 a 10 lettere e nessun accento, quindi una password ha sempre più di venti caratteri (§ 2.3). Dall'elenco sono state tolte le parole con doppi sensi volgari od offensivi, quelle legate a politica, religione, violenza o salute e quelle che si confondono con i nomi dell'app. La Redazione non scrive mai la password a mano: se una non le piace, «Generane un'altra».

Per lo sblocco contano solo le lettere: maiuscole, accenti, spazi, trattini e altri segni non fanno differenza. «Nuvola-TROMBA sedano faro lampo» apre lo stesso evento di «nuvola tromba sedano faro lampo».

## Impronta e cifratura

Gli strumenti sono quelli del browser (Web Crypto).

| Che cosa | Come | Perché |
| --- | --- | --- |
| Impronta, cioè il nome del file | PBKDF2-SHA-256 sulle lettere della password, con un sale fisso e 600.000 giri; 64 cifre esadecimali | Il nome non rivela la password, e ogni tentativo di indovinarla costa quanto la chiave |
| Chiave | PBKDF2-SHA-256 sulle lettere della password, con un sale casuale scritto nel file e 600.000 giri; AES-GCM a 256 bit | Un calcolo volutamente lento (§ 2.3), diverso da quello dell'impronta |
| Dati autenticati | Il tipo del file e l'impronta | Un file spostato sotto un altro nome non si apre |

Il file pubblicato: `{formato: "evento-nascosto", versione: 1, "tdm-reservation": 1, kdf: {nome, hash, giri, sale}, cifra: {nome, iv}, dati}`. Dentro c'è un evento nel formato pubblico (`docs/formato-eventi.md`), con il campo «Fonte:», che il telefono controlla con lo stesso modulo degli altri eventi. Una password sbagliata e un file alterato danno lo stesso errore.

## Nell'app della redazione (T-045)

Strumenti della redazione → Pubblicazione → Nuovo evento → casella «Evento nascosto». Accesa:

- l'app propone la password e ricorda le regole del § 9.2: eventi socioculturali di dimensioni contenute, annunciati altrove dall'organizzatore, di cui si tiene riservato il luogo o un altro dettaglio; mai ritrovi privati né manifestazioni; in luogo pubblico la Redazione valuta caso per caso e annota la valutazione nelle note della voce del registro dei consensi (nessun campo in più, sezione 6 del piano);
- servono il codice C del consenso dell'organizzatore (§ 3.3, passo 4; allegato C, C.2) e la fonte; con lo strato «Manifestazioni» «Pubblica» resta spento (§ 9.2, regola 2);
- valgono le dieci domande e tutte le colonne di giudizio, come per ogni evento (allegato A, A.2).

«Pubblica» chiede allo sportello se la password è già usata da un altro evento nascosto (§ 2.3: «controlla che non sia già usata»), cifra l'evento sul dispositivo, mette la password nella cassaforte e manda il pacchetto firmato con il solo file illeggibile. La riga del registro delle fonti nasce con «Evento nascosto: sì» e il codice C; la password non va in nessun registro (allegato C, C.2, «Dove si annota»). Se lo sportello rifiuta, la password di un evento nuovo esce dalla cassaforte.

Dopo la pubblicazione la schermata mostra la password con «Copia la password» e «Copia il messaggio di conferma» (il testo C.2, con titolo e password), da mandare all'organizzatore sul canale del consenso. La password si ritrova quando serve nella scheda dell'evento (Pubblicazione → l'evento), finché l'evento non finisce.

Nell'elenco della schermata «Pubblicazione» gli eventi nascosti stanno sotto «Nascosti», con il titolo se questo dispositivo ne ha la password. Un evento nascosto si corregge (stessa password), si sospende, si riattiva, si ritira con il motivo. Se la password non è nella cassaforte di questo dispositivo (per esempio un secondo dispositivo senza la copia della cassaforte), l'evento si può sospendere, riattivare o ritirare, non correggere. Le copie dello storico tengono gli eventi nascosti soltanto cifrati; il ripristino li rimette così come sono, e la Redazione li può soltanto togliere dalla copia.

Nessun evento nascosto si importa da un file Excel o da un calendario (`importa-excel.js`).

## Lo sportello

Nel pacchetto `scrivi`, la lista `nascosti` porta per ogni evento `{id, impronta, giorno, file}`: `giorno` è il giorno italiano (`AAAA-MM-GG`) in cui l'evento esce dalla mappa, cioè tre ore dopo la fine. Lo sportello non sa aprire il file: ne controlla la forma e scrive `pubblico/nascosti/<impronta>.json`. L'evento nascosto non entra nell'indice, nei quadranti né nei numeri per regione. Due eventi nascosti non possono avere la stessa impronta (rifiuto `impronta`); un evento nascosto non diventa pubblico con lo stesso identificativo e viceversa (rifiuto `nascosto`).

`sospendi`, `riattiva` e `ritira` valgono anche per gli eventi nascosti; il file esce o rientra subito. Il file si toglie alla prima pubblicazione dopo la mezzanotte del suo giorno. L'elenco riservato (`stato`), le copie datate e le letture firmate `stato` e `copia` portano `nascosti` e `nascostiSospesi`, sempre cifrati. Il nome del file non cambia con una correzione: la rete di consegna va aggiornata anche per lui (`svuota`).

## Nell'app pubblica (T-046)

La barra dei nascosti sta in Cerca («Ti hanno dato la password di un evento nascosto?»). Il telefono calcola l'impronta, chiede `nascosti/<impronta>.json` all'archivio degli eventi (sul collegamento di prova, all'archivio dello sportello di prova quando c'è), senza cookie né credenziali, e lo apre. L'evento sbloccato si apre nella sua scheda, con il lucchetto e «Evento nascosto, sbloccato con la password», e compare sulla mappa con un'icona propria con etichetta. Gli strati non lo nascondono: lo mostra o lo nasconde il comando «Nascosti che hai sbloccato» negli Strati (e nei Temi).

Evento e password restano nella voce `dl_nascosti` (`docs/dati-locali.md`) fino a tre ore dopo la fine, poi si cancellano da soli; la persona li toglie prima con «Togli dal telefono» nella scheda (due tocchi). All'apertura e al ritorno dopo trenta minuti il telefono riguarda i file degli eventi sbloccati: un file cambiato aggiorna l'evento; un file che non c'è più lo nasconde (decisione 4); un errore di rete non cambia nulla.

I messaggi della barra: «Sblocco l'evento…»; «Nessun evento nascosto con questa password.» (anche per una password più corta di venti lettere, che non si cerca nemmeno); «Non riesco a controllare la password: controlla la connessione e riprova.»; «Questo evento nascosto è già finito.».

## Da verificare con Bunny (T-065)

Che la rete di consegna non tenga in memoria una risposta «non trovato» per un'impronta prima che il file nasca, o la tenga per pochi secondi; che `svuota` aggiorni davvero il file corretto; che la zona degli eventi non elenchi il contenuto di `nascosti/` a chi lo chiede (lo prevede anche T-070, punto «i nomi dei file degli eventi nascosti non rivelino nulla»).
