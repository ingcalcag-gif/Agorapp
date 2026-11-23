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
    { nome: 'red_storico', dove: 'memoria', forma: 'json', redazione: true, prima: 'agorapp_storico',
      cosa: 'Storico delle operazioni della Redazione' },
    { nome: 'red_misure', dove: 'memoria', forma: 'json', redazione: true, prima: 'agorapp_misure',
      cosa: 'Misure della Redazione: totali, numeri inseriti a mano, soglie' },
    { nome: 'red_qui', dove: 'memoria', forma: 'testo', redazione: true,
      cosa: 'Segno che su questo indirizzo c\'è l\'app della redazione: serve solo dove le due app condividono l\'indirizzo (collegamento di prova)' },
    { nome: 'red_chiavi', dove: 'base', redazione: true,
      cosa: 'Le chiavi della Redazione (firma, cifratura, registro delle fonti, marcatore, cassaforte), non estraibili, e la loro copia di riserva cifrata con la frase (T-034)' },
    { nome: 'red_cassaforte', dove: 'base', redazione: true,
      cosa: 'La cassaforte cifrata delle password degli eventi nascosti, cancellate alla fine dell\'evento (T-034)' },
    /* Solo sul collegamento di prova (voci con «prova»): non sta nella scheda e sul sito vero non nasce mai. La scrive
       lo sportello di prova dell'app della redazione; l'app pubblica di prova, che lì sta allo stesso indirizzo, la
       legge soltanto. Contiene soli eventi inventati. */
    { nome: 'prova_sportello', dove: 'file', prova: true,
      cosa: 'L\'archivio finto dello sportello di prova: i file pubblici degli eventi, l\'elenco riservato, lo storico e le chiavi ammesse (T-038)' }
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
