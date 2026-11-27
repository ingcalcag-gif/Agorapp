/* Service worker montato da sorgenti/build.js (sorgenti/moduli/memoria.js e sorgenti/sw.js): non modificare qui. */
/* Memoria del telefono: un solo modulo e un elenco chiuso (voce T-026 del piano di adeguamento; documento:
   docs/dati-locali.md).

   Libro mastro, § 3.7: l'app salva sul telefono soltanto ciò che serve al servizio chiesto dalla persona, e tutto ciò
   che salva è descritto nella scheda «Dati locali» (cap. 30). § 30.1, scelta 2: una riga in più o in meno è uno scarto.
   Per questo tutto ciò che l'app salva passa da qui: la memoria del browser (per chi conosce i nomi: localStorage), la
   memoria del browser per i file (Cache Storage), dove stanno anche la copia dell'app scritta dal service worker e i
   tasselli della mappa (T-029), e la base di dati del browser (IndexedDB), che usa soltanto l'app della redazione per le
   sue chiavi e per la cassaforte (T-034). Nessun altro file dei sorgenti nomina questi strumenti: lo controlla la prova
   prove/memoria.js; la prova prove/browser/memoria.js controlla che cosa il telefono contiene davvero dopo un giro
   completo nell'app.

   ELENCO è l'elenco chiuso: una chiave che non c'è non si legge e non si scrive (il modulo si ferma con un errore).
   Ogni voce dice in quale riga della scheda «Dati locali» rientra. Le voci con «redazione» sono strumenti della
   Redazione (§ 3.7: stanno sul dispositivo della redazione, non nella scheda): esistono solo se l'app è creata con
   redazione: true, cioè nell'app della redazione (T-033); l'app pubblica, all'avvio, cancella senza leggerle quelle
   che stanno nella memoria del browser (Misure e storico di quando l'area riservata stava nell'app pubblica).

   Due app sullo stesso indirizzo. Sul sito vero le due app stanno a indirizzi diversi e ciascuna ha la sua memoria. Sul
   collegamento di prova stanno invece sullo stesso indirizzo e la memoria è una sola: lì l'app pubblica non deve
   cancellare Misure e storico dell'app della redazione di prova. Per questo l'app della redazione lascia un segno
   (red_qui) e l'app pubblica, se lo trova, non cancella le chiavi della Redazione: guarda solo se il segno c'è.

   Le chiavi non contengono il nome del servizio, così un cambio di nome non cancella nulla (T-078). «prima» è il nome
   che la chiave aveva nelle versioni precedenti: all'avvio il valore trasloca sotto il nome nuovo, una volta sola, e il
   nome vecchio si cancella. TOLTE sono le chiavi di funzioni tolte dall'app: all'avvio si cancellano senza leggerle.

   Nessun identificativo della persona o del telefono, nessun contatore delle visite, nessun registro di ricerche o di
   spostamenti sulla mappa (§ 3.7; § 4.1): nell'elenco non c'è una voce che li possa contenere.

   Nel browser si trova in window.AGR_MODULI.memoria; in Node con require(). */
(function (radice, fabbrica) {
  const m = fabbrica(radice);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).memoria = m;
})(typeof self !== 'undefined' ? self : this, function (radice) {
  'use strict';

  /* Le righe della scheda «Dati locali», nell'ordine della scheda (libro mastro, § 3.7 e § 30.2; la riga delle
     preferenze con le scelte aggiunte dalla decisione QB-5 del 17/11/2026). */
  const RIGHE = {
    app: 'L\'app',
    zone: 'Gli eventi delle zone che hai aperto',
    mappa: 'La mappa delle zone che hai guardato',
    offgrid: 'I tuoi eventi Off-Grid',
    calendario: 'Il tuo calendario',
    preferenze: 'Le tue preferenze e scelte',
    nascosti: 'Gli eventi nascosti che hai sbloccato'
  };

  /* dove: «memoria» (memoria del browser, coppie chiave-valore), «file» (memoria del browser per i file) oppure
     «base» (base di dati del browser: conserva anche le chiavi di cifratura non estraibili, che nella memoria a
     coppie non possono stare). forma: «json» o «testo», per le voci della memoria. */
  const ELENCO = [
    { nome: 'dl_eventi', dove: 'memoria', forma: 'json', riga: 'offgrid', prima: 'agorapp_events',
      cosa: 'Gli eventi Off-Grid della persona. Nell\'app della redazione, fino al blocco 10, anche gli eventi che la Redazione prepara o importa, che non vanno sulla mappa' },
    { nome: 'dl_calendario', dove: 'memoria', forma: 'json', riga: 'calendario', prima: 'agorapp_cal',
      cosa: 'Gli identificativi degli eventi messi nel calendario' },
    { nome: 'dl_tema', dove: 'memoria', forma: 'testo', riga: 'preferenze', prima: 'agorapp_theme', cosa: 'Tema chiaro o scuro' },
    { nome: 'dl_lingua', dove: 'memoria', forma: 'testo', riga: 'preferenze', prima: 'agorapp_lang', cosa: 'Lingua dell\'interfaccia' },
    { nome: 'dl_strati', dove: 'memoria', forma: 'json', riga: 'preferenze', prima: 'agorapp_layers', cosa: 'Strati e sottocategorie visibili sulla mappa' },
    { nome: 'dl_citta', dove: 'memoria', forma: 'testo', riga: 'preferenze', prima: 'agorapp_city', cosa: 'Città scelta (QB-5)' },
    { nome: 'dl_semplice', dove: 'memoria', forma: 'testo', riga: 'preferenze', prima: 'agorapp_simple', cosa: 'Modalità semplice accesa o spenta (QB-5)' },
    { nome: 'dl_mezzo', dove: 'memoria', forma: 'testo', riga: 'preferenze', prima: 'agorapp_day_mode', cosa: 'Mezzo della «La mia giornata»: a piedi, in bici, con i mezzi (QB-5)' },
    { nome: 'dl_combinazioni', dove: 'memoria', forma: 'json', riga: 'preferenze', prima: 'agorapp_presets', cosa: 'Combinazioni di strati salvate, «Mappa 1, 2, 3» (QB-5)' },
    { nome: 'dl_lenti', dove: 'memoria', forma: 'json', riga: 'preferenze', prima: 'agorapp_temi_slots', cosa: 'Le tre lenti dei Temi salvate dalla persona (QB-5)' },
    { nome: 'dl_guida', dove: 'memoria', forma: 'testo', riga: 'preferenze', prima: 'agorapp_guida', cosa: 'La guida iniziale è già stata vista (QB-5)' },
    { nome: 'dl_avvisi', dove: 'memoria', forma: 'json', riga: 'preferenze', cosa: 'Gli avvisi delle novità già visti: i soli identificativi degli avvisi (T-031; QB-5)' },
    { nome: 'dl_app', dove: 'file', riga: 'app', cosa: 'La copia dell\'app per aprirla senza rete; la scrive il service worker (T-029)' },
    { nome: 'dl_mappa', dove: 'file', riga: 'mappa', cosa: 'I tasselli della mappa delle zone viste, fino a 50 MB, e la copia del piccolo indice della mappa (T-029)' },
    { nome: 'dl_archivio', dove: 'file', riga: 'zone', prima: 'agorapp_archivio',
      cosa: 'Indice e quadranti dell\'archivio degli eventi scaricati per le zone consultate (T-022)' },
    { nome: 'dl_nascosti', dove: 'memoria', forma: 'json', riga: 'nascosti',
      cosa: 'Gli eventi nascosti sbloccati con la loro password, fino a tre ore dopo la fine dell\'evento; la persona li può togliere prima (T-046)' },
    { nome: 'red_storico', dove: 'memoria', forma: 'json', redazione: true, prima: 'agorapp_storico',
      cosa: 'Storico delle operazioni della Redazione' },
    { nome: 'red_misure', dove: 'memoria', forma: 'json', redazione: true, prima: 'agorapp_misure',
      cosa: 'Misure della Redazione: totali, numeri inseriti a mano, soglie' },
    { nome: 'red_promemoria', dove: 'memoria', forma: 'json', redazione: true,
      cosa: 'I giorni dell\'ultima copia di sicurezza degli eventi, dell\'ultima copia dei registri su memoria fisica e dell\'ultima prova del ripristino riuscita, per i promemoria (T-053, T-054)' },
    { nome: 'red_qui', dove: 'memoria', forma: 'testo', redazione: true,
      cosa: 'Segno che su questo indirizzo c\'è l\'app della redazione: serve solo dove le due app condividono l\'indirizzo (collegamento di prova)' },
    { nome: 'red_chiavi', dove: 'base', redazione: true,
      cosa: 'Le chiavi della Redazione (firma, cifratura, registro delle fonti, marcatore, cassaforte), non estraibili, e la loro copia di riserva cifrata con la frase (T-034)' },
    { nome: 'red_cassaforte', dove: 'base', redazione: true,
      cosa: 'La cassaforte cifrata delle password degli eventi nascosti, cancellate alla fine dell\'evento (T-034)' },
    { nome: 'red_registro', dove: 'base', redazione: true,
      cosa: 'Il registro delle fonti sul dispositivo (fonti, righe degli eventi pubblicati, schede preparate), in una busta cifrata con la chiave del registro (T-041, T-043)' },
    /* Solo sul collegamento di prova (voci con «prova»): non sta nella scheda e sul sito vero non nasce mai. La scrive
       lo sportello di prova dell'app della redazione; l'app pubblica di prova, che lì sta allo stesso indirizzo, la
       legge e, dal blocco 13, vi deposita soltanto le segnalazioni chiuse nella busta (sportello delle segnalazioni di
       prova, T-051). Contiene soli eventi e segnalazioni inventati. */
    { nome: 'prova_sportello', dove: 'file', prova: true,
      cosa: 'L\'archivio finto dello sportello di prova: i file pubblici degli eventi, l\'elenco riservato, lo storico, le chiavi ammesse (T-038) e le segnalazioni inventate depositate (T-051)' }
  ];
  /* Il segno dell'app della redazione e la base di dati dei suoi strumenti. */
  const SEGNO_REDAZIONE = 'red_qui', BASE = 'red_strumenti', DEPOSITO = 'voci';

  /* Chiavi di funzioni tolte dall'app: si cancellano all'avvio senza leggerle. dove: «memoria» oppure «sessione»
     (la memoria che dura finché la scheda del browser resta aperta, che l'app non usa più). */
  const TOLTE = [
    { nome: 'agorapp_interesse', dove: 'memoria', voce: 'T-010', cosa: 'pulsanti volontari «Mi interessa» e «Vorrei … qui»' },
    { nome: 'agorapp_fate', dove: 'memoria', voce: 'T-014', cosa: 'Ordine delle Fate' },
    { nome: 'agorapp_fate_io', dove: 'memoria', voce: 'T-014', cosa: 'Ordine delle Fate' },
    { nome: 'agorapp_fate_strato', dove: 'memoria', voce: 'T-014', cosa: 'Ordine delle Fate' },
    { nome: 'agorapp_fate_chi', dove: 'memoria', voce: 'T-014', cosa: 'Ordine delle Fate' },
    { nome: 'agorapp_demo', dove: 'memoria', voce: 'T-015', cosa: 'demo degli eventi, con progetti e istanze d\'esempio' },
    { nome: 'agorapp_votes', dove: 'sessione', voce: 'prima del piano', cosa: 'contatori «Ci vado / Sono qui»' }
  ];

  const PER_CHIAVE = new Map(ELENCO.map(v => [v.nome, v]));

  /* Le chiavi che un'app può avere sul telefono: quelle della scheda e, per la redazione, anche le sue. */
  const chiavi = (redazione, dove) => ELENCO.filter(v => !v.prova && (redazione || !v.redazione) && (!dove || v.dove === dove)).map(v => v.nome);

  /* Uno strumento del browser, se c'è e se il browser lo lascia usare (in navigazione privata può non esserci). */
  function strumento(nome) {
    try { return radice[nome] || null; } catch (e) { return null; }
  }

  /* crea({redazione, memoria, sessione, casse, base}): la memoria di un'app.
     redazione: true se l'app contiene gli strumenti della Redazione. memoria, sessione, casse e base sono gli strumenti
     del browser; nelle prove, finti. Se mancano, il modulo prende quelli del browser in cui gira. */
  function crea(o) {
    o = o || {};
    const redazione = !!o.redazione;
    const mem = 'memoria' in o ? o.memoria : strumento('localStorage');
    const ses = 'sessione' in o ? o.sessione : strumento('sessionStorage');
    const cas = 'casse' in o ? o.casse : (strumento('isSecureContext') ? strumento('caches') : null);
    const idb = 'base' in o ? o.base : strumento('indexedDB');

    function voce(k, dove) {
      const v = PER_CHIAVE.get(k);
      if (!v || v.dove !== dove || (v.redazione && !redazione)) throw new Error('memoria.js: «' + k + '» non è nell\'elenco chiuso dei dati locali (docs/dati-locali.md)');
      return v;
    }
    const prendi = k => { try { return mem ? mem.getItem(k) : null; } catch (e) { return null; } };
    const metti = (k, s) => { try { if (!mem) return false; mem.setItem(k, s); return true; } catch (e) { return false; } };
    const via = k => { try { if (mem) mem.removeItem(k); } catch (e) { /* niente da fare */ } };

    /* Un valore scritto come JSON; d se la chiave non c'è o il valore non si legge. */
    function leggi(k, d) {
      voce(k, 'memoria');
      const s = prendi(k);
      if (s == null) return d;
      try { return JSON.parse(s); } catch (e) { return d; }
    }
    /* Un valore scritto come testo; d se la chiave non c'è. */
    function testo(k, d) {
      voce(k, 'memoria');
      const s = prendi(k);
      return s == null ? d : s;
    }
    /* Scrive un valore: un testo così com'è, il resto come JSON. false se il telefono non ha più spazio. */
    function scrivi(k, v) {
      voce(k, 'memoria');
      return metti(k, typeof v === 'string' ? v : JSON.stringify(v));
    }
    function togli(k) {
      voce(k, 'memoria');
      via(k);
    }

    /* La memoria per i file: come quella del browser, ma apre soltanto i nomi dell'elenco. null se il browser non
       la offre (indirizzo non sicuro, navigazione privata): chi la usa lavora allora senza copia sul telefono. */
    const file = cas ? { open: nome => { voce(nome, 'file'); return cas.open(nome); }, delete: nome => { voce(nome, 'file'); return cas.delete(nome); },
      has: nome => { voce(nome, 'file'); return cas.has(nome); } } : null;

    /* La base di dati: soltanto nell'app della redazione, e soltanto per le voci «base» dell'elenco. Conserva i valori
       così come sono (anche le chiavi di cifratura non estraibili). null se il browser non la offre. */
    function conBase(modo, lavoro) {
      return new Promise((ok, no) => {
        let r;
        try { r = idb.open(BASE, 1); } catch (e) { return no(e); }
        r.onupgradeneeded = () => { r.result.createObjectStore(DEPOSITO); };
        r.onerror = () => no(r.error || new Error('la base di dati non si apre'));
        r.onblocked = () => no(new Error('la base di dati è occupata'));
        r.onsuccess = () => {
          const db = r.result;
          let t, richiesta;
          try { t = db.transaction(DEPOSITO, modo); richiesta = lavoro(t.objectStore(DEPOSITO)); } catch (e) { db.close(); return no(e); }
          t.oncomplete = () => { db.close(); ok(richiesta ? richiesta.result : undefined); };
          t.onerror = t.onabort = () => { db.close(); no(t.error || new Error('la base di dati non risponde')); };
        };
      });
    }
    const base = redazione && idb ? {
      leggi: k => { voce(k, 'base'); return conBase('readonly', d => d.get(k)); },
      scrivi: (k, v) => { voce(k, 'base'); return conBase('readwrite', d => d.put(v, k)); },
      togli: k => { voce(k, 'base'); return conBase('readwrite', d => d.delete(k)); }
    } : null;
    /* Chiede al browser di non cancellare da sé i dati di questo indirizzo (le chiavi della Redazione). Non salva nulla. */
    async function tieni() {
      try { const n = strumento('navigator'); return !!(n && n.storage && n.storage.persist && await n.storage.persist()); } catch (e) { return false; }
    }

    /* All'avvio, prima di leggere qualunque cosa: trasloco dei nomi vecchi e pulizia. Restituisce le chiavi traslocate.
       Tocca soltanto le chiavi che conosce: sullo stesso indirizzo possono esserci dati di altre pagine. Le chiavi
       delle funzioni tolte e, in un'app senza area riservata, quelle della Redazione si cancellano senza leggerle. */
    function avvia() {
      const fatto = { traslocate: [], redazioneQui: false };
      if (redazione) metti(SEGNO_REDAZIONE, '1');
      /* sullo stesso indirizzo c'è anche l'app della redazione (collegamento di prova): le sue chiavi non si toccano */
      else fatto.redazioneQui = prendi(SEGNO_REDAZIONE) != null;
      for (const v of ELENCO) {
        if (v.dove === 'base') continue;   // la base di dati la apre soltanto l'app della redazione
        const fuori = v.redazione && !redazione;   // strumenti della Redazione su un'app che non li ha
        if (fuori && fatto.redazioneQui) continue;
        if (v.dove === 'memoria') {
          if (fuori) {
            for (const k of [v.prima, v.nome]) if (k) via(k);   // senza leggerle
            continue;
          }
          if (!v.prima) continue;
          const vecchio = prendi(v.prima);
          if (vecchio == null) continue;
          /* Se il nome nuovo c'è già vale quello. Altrimenti il nome di prima si toglie prima di scrivere quello nuovo:
             così il trasloco non chiede spazio in più nemmeno su un telefono quasi pieno. Se la scrittura non riesce
             lo stesso, il dato torna sotto il nome di prima e si riprova al prossimo avvio. */
          via(v.prima);
          if (prendi(v.nome) != null) continue;
          if (metti(v.nome, vecchio)) fatto.traslocate.push(v.nome);
          else metti(v.prima, vecchio);
        } else if (v.dove === 'file' && cas) {
          /* i file si riscaricano: il nome vecchio si cancella e basta */
          for (const k of fuori ? [v.prima, v.nome] : [v.prima]) if (k) { try { Promise.resolve(cas.delete(k)).catch(() => {}); } catch (e) { /* niente da fare */ } }
        }
      }
      for (const t of TOLTE) {
        const dove = t.dove === 'sessione' ? ses : mem;
        try { if (dove) dove.removeItem(t.nome); } catch (e) { /* niente da fare */ }
      }
      return fatto;
    }

    return { leggi, testo, scrivi, togli, file, base, tieni, avvia, redazione };
  }

  return { RIGHE, ELENCO, TOLTE, SEGNO_REDAZIONE, chiavi, crea };
});

/* Service worker: l'app senza rete (voce T-029 del piano di adeguamento; documento: docs/senza-rete.md).

   Libro mastro, § 2.2 («L'uso senza rete») e § 3.7, riga «Copia dell'app»: il telefono conserva una copia dell'app, per
   aprirla e usarla senza rete, fino alla versione successiva, che la sostituisce.

   Che cosa fa.
   - Alla prima apertura scarica i file dell'app e li conserva nella memoria del browser per i file, nella voce
     «dl_app» dell'elenco chiuso (modulo memoria.js, montato qui sopra). Ogni file si conserva solo se è proprio quello
     di questa versione: se ne controlla l'impronta. Un file che non arriva o non corrisponde si richiede fino a tre
     volte; se ancora non va, la versione nuova non parte e resta quella di prima. Mentre lavora, il service worker dice
     alla pagina a che punto è e, se non riesce, quale file e perché: la pagina lo mostra nella guida «Senza
     connessione». Sono messaggi interni al telefono: non escono.
   - Poi consegna quei file dalla copia, anche senza rete. Tutto il resto passa dalla rete com'è: gli eventi
     (li conserva il modulo archivio.js), la mappa (modulo mappa-locale.js), la ricerca degli indirizzi, gli avvisi e
     il file d'emergenza. Il service worker non conserva mai file di altri siti.
   - Una versione nuova si prepara in silenzio e aspetta: sostituisce la precedente quando l'app viene chiusa e riaperta,
     oppure prima, quando la pagina lo chiede perché in quel momento non disturba nessuno (messaggio «attiva»). Non
     prende mai il posto della versione di prima mentre la persona sta usando l'app. Poi i file di prima si cancellano.
   - Interruttore d'emergenza: a ogni apertura in rete legge il piccolo file emergenza.json. Se il file dice di scartare
     questa versione, cancella la copia, si toglie di mezzo e fa ricaricare la pagina dalla rete.

   Nessun identificativo, nessun conteggio: le richieste sono senza credenziali e senza parametri che dipendano dal telefono.

   Il montaggio (sorgenti/build.js) mette qui sopra il modulo della memoria e riempie i tre valori qui sotto. */
'use strict';
const VERSIONE = "9d8a901";
const COPIA = {"anteprime/ar.json":"c86fcb1be0","anteprime/en.json":"011850aff4","anteprime/es.json":"55bc214b22","anteprime/fr.json":"0193733a8b","anteprime/it.json":"5246a33ab6","app.css":"809b152772","app.js":"f0ea543c26","config.js":"80c922cd77","icone/icona-180.png":"efbb032e18","icone/icona-192.png":"c5c4bad63d","icone/icona-512.png":"4fe4120db3","index.html":"0c9e5f0bdd","lib/caratteri-mappa/dm-sans-v17/DM Sans Italic/0-255.pbf":"f7bb279300","lib/caratteri-mappa/dm-sans-v17/DM Sans Italic/256-511.pbf":"1bab33e64d","lib/caratteri-mappa/dm-sans-v17/DM Sans Italic/512-767.pbf":"2a33e9ea40","lib/caratteri-mappa/dm-sans-v17/DM Sans Italic/768-1023.pbf":"253a66eb43","lib/caratteri-mappa/dm-sans-v17/DM Sans Italic/7680-7935.pbf":"9072a9aab7","lib/caratteri-mappa/dm-sans-v17/DM Sans Italic/8192-8447.pbf":"87125bebb8","lib/caratteri-mappa/dm-sans-v17/DM Sans Italic/8448-8703.pbf":"acb9141e24","lib/caratteri-mappa/dm-sans-v17/DM Sans Italic/8704-8959.pbf":"e2e8c0832b","lib/caratteri-mappa/dm-sans-v17/DM Sans Medium/0-255.pbf":"62cd08773f","lib/caratteri-mappa/dm-sans-v17/DM Sans Medium/256-511.pbf":"4e6eeca73c","lib/caratteri-mappa/dm-sans-v17/DM Sans Medium/512-767.pbf":"ae44f1a5f8","lib/caratteri-mappa/dm-sans-v17/DM Sans Medium/768-1023.pbf":"4148875ce7","lib/caratteri-mappa/dm-sans-v17/DM Sans Medium/7680-7935.pbf":"5317416ac8","lib/caratteri-mappa/dm-sans-v17/DM Sans Medium/8192-8447.pbf":"af3a53c2d4","lib/caratteri-mappa/dm-sans-v17/DM Sans Medium/8448-8703.pbf":"eecbbad83f","lib/caratteri-mappa/dm-sans-v17/DM Sans Medium/8704-8959.pbf":"d64c653f83","lib/caratteri-mappa/dm-sans-v17/DM Sans Regular/0-255.pbf":"ef444f5a7c","lib/caratteri-mappa/dm-sans-v17/DM Sans Regular/256-511.pbf":"b56481ee2a","lib/caratteri-mappa/dm-sans-v17/DM Sans Regular/512-767.pbf":"c055363cbc","lib/caratteri-mappa/dm-sans-v17/DM Sans Regular/768-1023.pbf":"0bcd2e2772","lib/caratteri-mappa/dm-sans-v17/DM Sans Regular/7680-7935.pbf":"223c2931f5","lib/caratteri-mappa/dm-sans-v17/DM Sans Regular/8192-8447.pbf":"4de9665c63","lib/caratteri-mappa/dm-sans-v17/DM Sans Regular/8448-8703.pbf":"b7254fe37a","lib/caratteri-mappa/dm-sans-v17/DM Sans Regular/8704-8959.pbf":"e68bb91940","lib/caratteri-mappa/dm-sans-v17/OFL.txt":"9af3619033","lib/caratteri/caratteri.css":"0d359f5805","lib/caratteri/dm-sans-v17/OFL.txt":"9af3619033","lib/caratteri/dm-sans-v17/dm-sans-latin-ext-opsz-normal.woff2":"5d18d31d23","lib/caratteri/dm-sans-v17/dm-sans-latin-opsz-normal.woff2":"ca72d2bcea","lib/caratteri/dm-serif-display-v17/OFL.txt":"a3e5cdd67d","lib/caratteri/dm-serif-display-v17/dm-serif-display-latin-400-normal.woff2":"fdf61e20fd","lib/caratteri/dm-serif-display-v17/dm-serif-display-latin-ext-400-normal.woff2":"3af47815d6","lib/jspdf-2.5.1/LICENSE.txt":"2d26bfab8a","lib/jspdf-2.5.1/jspdf.umd.min.js":"98ccf17aa1","lib/maplibre-gl-5.24.0/LICENSE.txt":"ee5fc05a06","lib/maplibre-gl-5.24.0/maplibre-gl.css":"ab1e70d59e","lib/maplibre-gl-5.24.0/maplibre-gl.js":"45a9b07a91","lib/pmtiles-4.5.0/LICENSE.txt":"0371c38f33","lib/pmtiles-4.5.0/pmtiles.js":"caf981bc46","lib/protomaps-basemaps-5.7.2/LICENSE.txt":"74f975cfed","lib/protomaps-basemaps-5.7.2/stile-carta-chiaro.json":"fdbbeab4e1","lib/protomaps-basemaps-5.7.2/stile-carta-scuro.json":"86442de9ba","lib/protomaps-icone-v4/LICENSE.txt":"46d0ca73c1","lib/protomaps-icone-v4/dark.json":"bfac76cf7e","lib/protomaps-icone-v4/dark.png":"8920f68e8f","lib/protomaps-icone-v4/dark@2x.json":"1fb5b123fb","lib/protomaps-icone-v4/dark@2x.png":"6e01b4e366","lib/protomaps-icone-v4/light.json":"bfac76cf7e","lib/protomaps-icone-v4/light.png":"b6a3464091","lib/protomaps-icone-v4/light@2x.json":"1fb5b123fb","lib/protomaps-icone-v4/light@2x.png":"23f6e9df27","licenze/dm-sans.txt":"9af3619033","licenze/dm-serif-display.txt":"a3e5cdd67d","licenze/index.html":"02259d6d4f","licenze/jspdf-avvisi-nel-file.txt":"c458abafd2","licenze/jspdf.txt":"2d26bfab8a","licenze/licenze.css":"a250c27390","licenze/maplibre-gl-js.txt":"ee5fc05a06","licenze/odbl-1.0.txt":"77d2692c3d","licenze/pmtiles.txt":"0371c38f33","licenze/protomaps-basemaps.txt":"74f975cfed","licenze/protomaps-icone.txt":"46d0ca73c1","manifest.webmanifest":"a4e1cb1bbb","mappa/correzioni.geojson":"b3049ad7a1","moduli.js":"ecfeffdd1a","sezioni.js":"b2e10e6d80","testi/it/condizioni-uso.html":"584abb4316","testi/it/dati-locali.html":"e93274812e","testi/it/informativa.html":"4bdd73cc0c","testi/it/note-legali.html":"6728dc6894","testi/testi.css":"4662af946a","traduzioni.js":"5eed33d069"};      // {percorso: impronta} di ogni file dell'app
const PIGRI = [];      // file che si conservano solo quando servono (dal blocco 10 nessuno)

const BASE = new URL('./', self.location.href).href;
const PERCORSO_BASE = new URL(BASE).pathname;
const MEM = self.AGR_MODULI.memoria.crea({});
const INSIEME = 6;     // file scaricati insieme durante la preparazione
const TENTATIVI = 3;   // richieste per ogni file, prima di arrendersi

/* La copia: null se il browser non offre la memoria per i file. */
async function copia() {
  try { return MEM.file ? await MEM.file.open('dl_app') : null; } catch (e) { return null; }
}
const indirizzo = p => new URL(p.split('/').map(encodeURIComponent).join('/'), BASE).href;
const chiave = p => indirizzo(p) + '?v=' + COPIA[p];

async function impronta(dati) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', dati));
  return Array.from(h.subarray(0, 5), b => b.toString(16).padStart(2, '0')).join('');
}
const TIPI = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json', webmanifest: 'application/manifest+json',
  geojson: 'application/geo+json', txt: 'text/plain; charset=utf-8', png: 'image/png', svg: 'image/svg+xml', pbf: 'application/x-protobuf', woff2: 'font/woff2' };
const tipo = p => TIPI[p.slice(p.lastIndexOf('.') + 1)] || 'application/octet-stream';

/* Perché un file non è entrato nella copia: motivo «rete» (non arriva), «risposta» (il server risponde n), «impronta»
   (non è il file di questa versione), «altrove» (il server rimanda a un altro sito). */
function errore(file, motivo, n) { const e = new Error(file + ': ' + motivo + (n ? ' ' + n : '')); e.file = file; e.motivo = motivo; e.n = n || 0; return e; }
const pausa = ms => new Promise(ok => setTimeout(ok, ms));

/* Scarica un file dell'app e lo mette nella copia, solo se è quello di questa versione; se non va, riprova (la seconda
   e la terza volta senza passare dalla memoria del browser). Restituisce la risposta pronta. */
async function prendi(c, p) {
  let ultimo = null;
  for (let t = 0; t < TENTATIVI; t++) {
    if (t) await pausa(t * 1500);
    let r;
    try { r = await fetch(indirizzo(p), { cache: t ? 'reload' : 'no-cache', credentials: 'omit' }); } catch (e) { ultimo = errore(p, 'rete'); continue; }
    if (r.redirected && new URL(r.url).origin !== self.location.origin) throw errore(p, 'altrove');
    if (!r.ok) { ultimo = errore(p, 'risposta', r.status); continue; }
    let dati;
    try { dati = await r.arrayBuffer(); } catch (e) { ultimo = errore(p, 'rete'); continue; }
    if (await impronta(dati) !== COPIA[p]) { ultimo = errore(p, 'impronta'); continue; }
    const intestazioni = { 'content-type': tipo(p), 'content-length': String(dati.byteLength) };
    await c.put(chiave(p), new Response(dati.slice(0), { headers: intestazioni }));
    return new Response(dati, { headers: intestazioni });
  }
  throw ultimo;
}

/* A che punto è la preparazione, per tutte le pagine di questa app aperte sul telefono (anche quelle che il service
   worker non serve ancora). */
async function annuncia(msg) {
  try { for (const cl of await self.clients.matchAll({ type: 'window', includeUncontrolled: true })) cl.postMessage(Object.assign({ copia: true, versione: VERSIONE }, msg)); } catch (e) { /* niente da fare */ }
}

self.addEventListener('install', ev => ev.waitUntil((async () => {
  const c = await copia();
  if (!c) { await annuncia({ stato: 'errore', motivo: 'memoria' }); throw new Error('questo browser non conserva file'); }
  const tutti = Object.keys(COPIA).filter(p => !PIGRI.includes(p)), mancanti = [];
  for (const p of tutti) if (!(await c.match(chiave(p)))) mancanti.push(p);
  const totale = tutti.length;
  let fatti = totale - mancanti.length, prossimo = 0, fermo = false;
  await annuncia({ stato: 'preparazione', fatti, totale });
  /* sei file alla volta: appena uno è finito, parte il successivo */
  const lavora = async () => {
    while (!fermo && prossimo < mancanti.length) {
      const p = mancanti[prossimo++];
      await prendi(c, p);
      annuncia({ stato: 'preparazione', fatti: ++fatti, totale });
    }
  };
  try { await Promise.all(Array.from({ length: INSIEME }, lavora)); }
  catch (e) { fermo = true; await annuncia({ stato: 'errore', file: e.file || '', motivo: e.motivo || 'rete', n: e.n || 0 }); throw e; }
  await annuncia({ stato: 'installata', fatti, totale });
})()));

self.addEventListener('activate', ev => ev.waitUntil((async () => {
  const c = await copia();
  if (c) {
    const buone = new Set(Object.keys(COPIA).map(chiave));
    /* via i file delle versioni precedenti di questa app; ciò che sta sotto altri indirizzi non si tocca */
    for (const r of await c.keys()) if (r.url.startsWith(BASE) && !buone.has(r.url)) await c.delete(r);
  }
  await self.clients.claim();
  await annuncia({ stato: 'pronta' });
})()));

/* Il percorso di una richiesta dentro l'app ('' fuori dall'app); la cartella dell'app vale index.html. */
function percorso(u) {
  if (u.origin !== self.location.origin || !u.pathname.startsWith(PERCORSO_BASE)) return '';
  let p;
  try { p = decodeURIComponent(u.pathname.slice(PERCORSO_BASE.length)); } catch (e) { return ''; }
  if (p === '') return 'index.html';
  return p.endsWith('/') ? p + 'index.html' : p;
}

let spento = false;   // dopo l'interruttore d'emergenza non si consegna e non si conserva più nulla
self.addEventListener('fetch', ev => {
  const r = ev.request;
  if (spento || r.method !== 'GET') return;
  const p = percorso(new URL(r.url));
  if (!p || !(p in COPIA)) return;   // non è un file dell'app: passa dalla rete com'è
  ev.respondWith((async () => {
    const c = await copia();
    const pronta = c && await c.match(chiave(p));
    if (pronta) return pronta;
    if (c) { try { return await prendi(c, p); } catch (e) { /* si prova la rete così com'è */ } }
    return fetch(r);
  })());
  if (r.mode === 'navigate') ev.waitUntil(emergenza());
});

/* ---------- Interruttore d'emergenza ----------
   emergenza.json: {"scarta": ["<versione>", …]}; «*» vale per tutte le versioni. */
async function daScartare() {
  try {
    const r = await fetch(indirizzo('emergenza.json'), { cache: 'no-store', credentials: 'omit', redirect: 'error' });
    if (!r.ok) return false;
    const j = await r.json();
    return !!j && Array.isArray(j.scarta) && (j.scarta.includes(VERSIONE) || j.scarta.includes('*'));
  } catch (e) { return false; }   // senza rete non si scarta nulla
}
async function emergenza() {
  if (!(await daScartare())) return;
  spento = true;
  const c = await copia();
  if (c) for (const r of await c.keys()) if (r.url.startsWith(BASE)) await c.delete(r);
  await self.registration.unregister();
  for (const cl of await self.clients.matchAll({ type: 'window' })) { try { await cl.navigate(cl.url); } catch (e) { /* la pagina si ricaricherà da sé */ } }
}

/* La pagina può chiedere la versione di chi la serve e, quando non disturba, dire alla versione nuova di entrare in uso. */
self.addEventListener('message', ev => {
  if (ev.data === 'versione' && ev.ports && ev.ports[0]) ev.ports[0].postMessage(VERSIONE);
  else if (ev.data === 'attiva') ev.waitUntil(self.skipWaiting());
});
