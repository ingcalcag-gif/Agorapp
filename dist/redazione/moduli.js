/* Testi sempre come testo (voce T-024 del piano di adeguamento; libro mastro, § 3.11; documento: docs/testi-come-testo.md).

   Ogni testo che arriva da fuori (eventi dell'archivio, Off-Grid, file importati, risposte della ricerca degli indirizzi,
   memoria del telefono) entra nella pagina soltanto passando da esc(), che trasforma i cinque caratteri con cui un testo
   potrebbe diventare codice: & < > " '. È l'unica funzione di protezione: la usano l'app, le sezioni Agorà e Progetti e
   il montaggio. Nel browser si trova in window.AGR_MODULI.testo; in Node con require().

   collegamento() dice se un indirizzo può diventare un collegamento della pagina: solo https, senza nome utente e
   password, senza spazi né caratteri di controllo. Restituisce l'indirizzo, oppure '' se non va bene: chi lo usa mostra
   allora il solo testo. Così nella pagina non arriva mai un collegamento javascript:, data: o http:. */
(function (radice, fabbrica) {
  const m = fabbrica();
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).testo = m;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SOSTITUTI = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => SOSTITUTI[c]);

  function collegamento(u) {
    if (typeof u !== 'string') return '';
    const s = u.trim();
    if (!/^https:\/\//i.test(s) || /[\s\u0000-\u001f\u007f]/.test(s)) return '';
    let x;
    try { x = new URL(s); } catch (e) { return ''; }
    return x.protocol === 'https:' && x.hostname && !x.username && !x.password ? s : '';
  }

  return { esc, collegamento };
});

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
      cosa: 'La cassaforte cifrata delle password degli eventi nascosti, cancellate alla fine dell\'evento (T-034)' }
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
  const chiavi = (redazione, dove) => ELENCO.filter(v => (redazione || !v.redazione) && (!dove || v.dove === dove)).map(v => v.nome);

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
    const file = cas ? { open: nome => { voce(nome, 'file'); return cas.open(nome); }, delete: nome => { voce(nome, 'file'); return cas.delete(nome); } } : null;

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

/* Formato pubblico degli eventi, versione 1 (voce T-020 del piano di adeguamento; documento: docs/formato-eventi.md).

   Un modulo scritto una volta e usato da tutti: l'app pubblica (legge gli eventi dell'archivio, T-022), l'app della
   redazione (li prepara, blocco 10) e lo sportello di pubblicazione (li accetta, blocco 9). Nel browser si trova in
   window.AGR_MODULI.eventi; in Node con require(). Non usa nulla oltre a JavaScript standard e Intl.

   La funzione di controllo è una sola: controlla(evento, opzioni) restituisce l'elenco degli errori, vuoto se l'evento
   è valido. Rifiuta i campi sconosciuti (immagini, password, provenienza interna, colonne del registro, nomi di chi
   segnala non hanno un campo: libro mastro §§ 2.2, 3.2 lett. c, 5.3, 6.2), i collegamenti che non sono https e i testi
   oltre le lunghezze stabilite.

   Le date e le ore sono quelle italiane, scritte come le legge chi va all'evento («2026-11-27T21:00», ora di Roma);
   istante() le trasforma nel momento esatto, uguale su qualunque telefono e server. */
(function (radice, fabbrica) {
  const m = fabbrica();
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).eventi = m;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const FORMATO = 1;
  const FUSO = 'Europe/Rome';
  /* Riquadro della griglia dei quadranti (T-021): tutta l'Italia, isole comprese (Lampedusa, Pantelleria, Vetta d'Italia,
     Otranto). Un evento fuori dal riquadro non ha un quadrante e non si accetta. */
  const RIQUADRO = { ovest: 6.5, sud: 35.4, est: 19.1, nord: 47.55 };
  /* Un evento esce da mappa e agenda tre ore dopo la fine (libro mastro § 2.2). */
  const TRE_ORE = 3 * 36e5;
  /* Durata massima di un evento: una mostra può durare mesi, non più di un anno. */
  const MAX_GIORNI = 366;

  /* L'identificativo: una parte casuale di 16 caratteri e, dopo il trattino, il segno del marcatore di 8 caratteri,
     ricavato con la chiave del marcatore (T-037; libro mastro §§ 2.4 e 6.5). Alfabeto base32 minuscolo (a-z, 2-7). */
  const ID = /^[a-z2-7]{16}-[a-z2-7]{8}$/;
  const DATA_ORA = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
  const MODIFICATO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/;
  const COLLOCAZIONI = ['indirizzo', 'a_mano'];

  /* I campi del formato. testo: lunghezza massima in caratteri; righe: il testo può andare a capo. */
  const CAMPI = {
    id:                { obbligatorio: true,  tipo: 'id' },
    titolo:            { obbligatorio: true,  tipo: 'testo', max: 100 },
    strato:            { obbligatorio: true,  tipo: 'chiave' },
    sottostrato:       { obbligatorio: false, tipo: 'chiave' },
    tema:              { obbligatorio: false, tipo: 'testo', max: 40 },
    inizio:            { obbligatorio: true,  tipo: 'data_ora' },
    fine:              { obbligatorio: false, tipo: 'data_ora' },
    durata:            { obbligatorio: false, tipo: 'minuti' },
    luogo:             { obbligatorio: true,  tipo: 'testo', max: 120 },
    indirizzo:         { obbligatorio: true,  tipo: 'testo', max: 200 },
    collocazione:      { obbligatorio: true,  tipo: 'scelta', valori: COLLOCAZIONI },
    descrizione_luogo: { obbligatorio: false, tipo: 'testo', max: 300, righe: true },
    lat:               { obbligatorio: true,  tipo: 'coordinata' },
    lng:               { obbligatorio: true,  tipo: 'coordinata' },
    organizzatore:     { obbligatorio: false, tipo: 'testo', max: 120 },
    descrizione:       { obbligatorio: true,  tipo: 'testo', max: 2000, righe: true },
    prezzo:            { obbligatorio: false, tipo: 'testo', max: 80 },
    fonte:             { obbligatorio: true,  tipo: 'fonte' },
    modificato:        { obbligatorio: true,  tipo: 'modificato' },
  };
  const CAMPI_FONTE = { testo: { obbligatorio: true, max: 160 }, collegamento: { obbligatorio: false, max: 500 } };

  const lunghezza = s => Array.from(s).length;
  // Caratteri di controllo: mai nei testi; a capo e tabulazione solo nei testi su più righe.
  const CONTROLLO = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u2028\u2029]/;
  const CONTROLLO_RIGA = /[\u0000-\u001F\u007F-\u009F\u2028\u2029]/;

  function controllaTesto(v, def, nome, err) {
    if (typeof v !== 'string') return err.push(nome + ': deve essere un testo');
    if (!v.trim()) return err.push(nome + ': vuoto');
    if ((def.righe ? CONTROLLO : CONTROLLO_RIGA).test(v)) err.push(nome + ': contiene caratteri di controllo' + (def.righe ? '' : ' o un a capo'));
    if (lunghezza(v) > def.max) err.push(nome + ': oltre ' + def.max + ' caratteri (' + lunghezza(v) + ')');
  }

  /* Un collegamento si accetta solo https, senza nome utente o password, con un nome di sito vero. */
  function controllaCollegamento(v, max, nome, err) {
    if (typeof v !== 'string' || !v) return err.push(nome + ': deve essere un indirizzo https');
    if (lunghezza(v) > max) return err.push(nome + ': oltre ' + max + ' caratteri');
    if (/\s/.test(v) || CONTROLLO_RIGA.test(v)) return err.push(nome + ': contiene spazi o caratteri di controllo');
    let u; try { u = new URL(v); } catch (e) { return err.push(nome + ': non è un indirizzo valido'); }
    if (u.protocol !== 'https:') return err.push(nome + ': solo collegamenti https');
    if (u.username || u.password) err.push(nome + ': un collegamento non porta nomi utente o password');
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname)) err.push(nome + ': nome del sito non valido');
  }

  /* «AAAA-MM-GGTHH:MM» con una data che esiste davvero. */
  function partiDataOra(v) {
    const m = typeof v === 'string' && v.match(DATA_ORA); if (!m) return null;
    const [a, me, g, h, mi] = m.slice(1).map(Number);
    if (a < 2020 || a > 2100 || me < 1 || me > 12 || g < 1 || h > 23 || mi > 59) return null;
    if (g > new Date(Date.UTC(a, me, 0)).getUTCDate()) return null;
    return [a, me, g, h, mi];
  }

  /* Il momento esatto (millisecondi dal 1970, UTC) di un'ora italiana «AAAA-MM-GGTHH:MM». null se non è valida.
     Nelle notti del cambio dell'ora: un orario che esiste due volte (ottobre) vale la prima volta; un orario che non
     esiste (marzo, tra le 2 e le 3) vale come se l'ora non fosse ancora cambiata (le 2:30 diventano le 3:30). */
  const FMT = typeof Intl === 'object' ? new Intl.DateTimeFormat('en-GB', { timeZone: FUSO, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null;
  function scarto(ms) {   // differenza tra l'ora di Roma e UTC in quel momento, in millisecondi
    const p = {}; FMT.formatToParts(new Date(ms)).forEach(x => { p[x.type] = x.value; });
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000;
  }
  function istante(v) {
    const p = partiDataOra(v); if (!p) return null;
    const muro = Date.UTC(p[0], p[1] - 1, p[2], p[3], p[4]);
    const prove = [muro - scarto(muro - 36e5 * 3), muro - scarto(muro + 36e5 * 3)];
    const giusti = prove.filter(t => t + scarto(t) === muro);
    return giusti.length ? Math.min(...giusti) : prove[0];
  }
  /* Fine dell'evento: «fine», oppure inizio più «durata», oppure l'inizio stesso. */
  function fineMs(ev) {
    const a = istante(ev && ev.inizio); if (a == null) return null;
    if (ev.fine) { const b = istante(ev.fine); return b == null ? a : b; }
    if (Number.isInteger(ev.durata)) return a + ev.durata * 6e4;
    return a;
  }
  /* Quando l'evento esce da mappa e agenda: tre ore dopo la fine. */
  const uscitaMs = ev => { const f = fineMs(ev); return f == null ? null : f + TRE_ORE; };

  /* Strati, sottostrati e temi ammessi, dai dati dell'app: vocabolario(LAYERS, TEMI_VOC). */
  function vocabolario(strati, temi) {
    return { strati: Object.fromEntries((strati || []).map(l => [l.id, (l.sub || []).map(s => s.id)])), temi: (temi || []).slice() };
  }

  /* L'unica funzione di controllo. opzioni.vocabolario: se c'è, strato, sottostrato e tema devono esserci.
     Restituisce l'elenco degli errori, in italiano, ciascuno con il nome del campo; [] = evento valido. */
  function controlla(ev, opzioni) {
    const err = [], voc = opzioni && opzioni.vocabolario;
    if (!ev || typeof ev !== 'object' || Array.isArray(ev)) return ['l\'evento deve essere un oggetto'];
    for (const k of Object.keys(ev)) if (!Object.prototype.hasOwnProperty.call(CAMPI, k)) err.push(k + ': campo sconosciuto');
    for (const [k, def] of Object.entries(CAMPI)) {
      const v = ev[k];
      if (v === undefined || v === null) { if (def.obbligatorio) err.push(k + ': manca'); continue; }
      switch (def.tipo) {
        case 'id': if (typeof v !== 'string' || !ID.test(v)) err.push(k + ': deve essere 16 caratteri, un trattino e 8 caratteri (a-z, 2-7)'); break;
        case 'testo': controllaTesto(v, def, k, err); break;
        case 'chiave': if (typeof v !== 'string' || !/^[a-z][a-z0-9-]{0,39}$/.test(v)) err.push(k + ': chiave non valida'); break;
        case 'data_ora': if (!partiDataOra(v)) err.push(k + ': deve essere AAAA-MM-GGTHH:MM, con una data che esiste'); break;
        case 'minuti': if (!Number.isInteger(v) || v < 1 || v > 1440) err.push(k + ': minuti interi da 1 a 1440 (per durate più lunghe si usa «fine»)'); break;
        case 'scelta': if (!def.valori.includes(v)) err.push(k + ': deve essere ' + def.valori.join(' o ')); break;
        case 'coordinata': if (typeof v !== 'number' || !Number.isFinite(v)) err.push(k + ': deve essere un numero');
          else if (Math.round(v * 1e6) / 1e6 !== v) err.push(k + ': al massimo 6 decimali'); break;
        case 'modificato': { const m = typeof v === 'string' && v.match(MODIFICATO);
          if (!m || isNaN(Date.parse(v)) || new Date(v).toISOString().slice(0, 19) + 'Z' !== v) err.push(k + ': deve essere AAAA-MM-GGTHH:MM:SSZ (UTC)'); break; }
        case 'fonte':
          if (typeof v !== 'object' || Array.isArray(v)) { err.push(k + ': deve essere un oggetto con testo ed eventuale collegamento'); break; }
          for (const c of Object.keys(v)) if (!Object.prototype.hasOwnProperty.call(CAMPI_FONTE, c)) err.push(k + '.' + c + ': campo sconosciuto');
          if (v.testo == null) err.push(k + '.testo: manca'); else controllaTesto(v.testo, CAMPI_FONTE.testo, k + '.testo', err);
          if (v.collegamento != null) controllaCollegamento(v.collegamento, CAMPI_FONTE.collegamento.max, k + '.collegamento', err);
          break;
      }
    }
    // Regole che legano più campi.
    if (ev.fine != null && ev.durata != null) err.push('fine e durata: se ne indica una sola');
    const a = istante(ev.inizio), b = ev.fine != null ? istante(ev.fine) : null;
    if (a != null && b != null) {
      if (b <= a) err.push('fine: deve venire dopo l\'inizio');
      else if (b - a > MAX_GIORNI * 864e5) err.push('fine: al massimo ' + MAX_GIORNI + ' giorni dopo l\'inizio');
    }
    if (ev.collocazione === 'a_mano' && ev.descrizione_luogo == null) err.push('descrizione_luogo: obbligatoria per un evento collocato a mano (libro mastro § 11.3)');
    if (typeof ev.lat === 'number' && typeof ev.lng === 'number' &&
        !(ev.lat >= RIQUADRO.sud && ev.lat < RIQUADRO.nord && ev.lng >= RIQUADRO.ovest && ev.lng < RIQUADRO.est)) err.push('lat e lng: fuori dall\'Italia');
    if (ev.sottostrato != null && ev.strato == null) err.push('sottostrato: senza strato');
    if (voc) {
      if (typeof ev.strato === 'string' && !voc.strati[ev.strato]) err.push('strato: «' + ev.strato + '» non esiste');
      else if (typeof ev.sottostrato === 'string' && !voc.strati[ev.strato].includes(ev.sottostrato)) err.push('sottostrato: «' + ev.sottostrato + '» non appartiene allo strato «' + ev.strato + '»');
      if (typeof ev.tema === 'string' && !voc.temi.includes(ev.tema)) err.push('tema: «' + ev.tema + '» non è tra i temi');
    }
    return err;
  }
  const valido = (ev, opzioni) => controlla(ev, opzioni).length === 0;

  return { FORMATO, FUSO, RIQUADRO, TRE_ORE, ID, CAMPI, CAMPI_FONTE, controlla, valido, istante, fineMs, uscitaMs, vocabolario };
});

/* Quadranti e indice dell'archivio degli eventi (voce T-021 del piano di adeguamento; docs/formato-eventi.md).

   L'Italia è divisa da una griglia fissa in quadranti di circa 50 km di lato (libro mastro § 2.4, «La lettura degli
   eventi»): 0,45 gradi di latitudine (50 km) per 0,6 di longitudine (da 54 km in Sicilia a 45 km in Alto Adige).
   Ogni quadrante ha il file dei propri eventi futuri; un indice piccolo dice la versione di ogni quadrante e quanti
   eventi ci sono in ogni regione. Lo stesso modulo serve a chi scrive l'archivio (oggi lo strumento dell'archivio di
   prova, poi lo sportello di pubblicazione) e all'app pubblica, che lo legge (T-022).

   Nel browser si trova in window.AGR_MODULI.quadranti (dopo eventi.js); in Node con require(). */
(function (radice, fabbrica) {
  const nodo = typeof module === 'object' && module.exports && typeof require === 'function';
  const m = fabbrica(nodo ? require('./eventi.js') : (radice.AGR_MODULI || {}).eventi);
  if (nodo) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).quadranti = m;
})(typeof self !== 'undefined' ? self : this, function (E) {
  'use strict';
  if (!E) throw new Error('quadranti.js: serve prima eventi.js');

  /* La griglia. Non cambia: se cambiasse, cambierebbero i nomi di tutti i file (versione 2). Gradi in milionesimi,
     per fare i conti con numeri interi e assegnare sempre lo stesso quadrante a un punto sul bordo. */
  const GRIGLIA = { versione: 1, ovest: 6.5, sud: 35.4, passo_lat: 0.45, passo_lng: 0.6, righe: 27, colonne: 21 };
  const U = 1e6, O = Math.round(GRIGLIA.ovest * U), S = Math.round(GRIGLIA.sud * U),
    PL = Math.round(GRIGLIA.passo_lat * U), PG = Math.round(GRIGLIA.passo_lng * U);
  if (GRIGLIA.sud + GRIGLIA.righe * GRIGLIA.passo_lat - E.RIQUADRO.nord > 1e-9 || GRIGLIA.ovest + GRIGLIA.colonne * GRIGLIA.passo_lng - E.RIQUADRO.est > 1e-9)
    throw new Error('quadranti.js: la griglia non coincide con il riquadro di eventi.js');
  const ID = /^q(\d{2})-(\d{2})$/;
  const pad = n => (n < 10 ? '0' : '') + n;
  const nome = (r, c) => 'q' + pad(r) + '-' + pad(c);

  /* Il quadrante di un punto: «q21-01» (riga 21 da sud, colonna 1 da ovest), oppure null fuori dalla griglia. */
  function quadrante(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const r = Math.floor((Math.round(lat * U) - S) / PL), c = Math.floor((Math.round(lng * U) - O) / PG);
    return r >= 0 && r < GRIGLIA.righe && c >= 0 && c < GRIGLIA.colonne ? nome(r, c) : null;
  }
  function rigaColonna(id) {
    const m = typeof id === 'string' && id.match(ID); if (!m) return null;
    const r = +m[1], c = +m[2];
    return r < GRIGLIA.righe && c < GRIGLIA.colonne ? [r, c] : null;
  }
  /* Confini di un quadrante in gradi: {ovest, sud, est, nord}. */
  function confini(id) {
    const rc = rigaColonna(id); if (!rc) return null;
    return { ovest: (O + rc[1] * PG) / U, sud: (S + rc[0] * PL) / U, est: (O + (rc[1] + 1) * PG) / U, nord: (S + (rc[0] + 1) * PL) / U };
  }
  /* Il quadrante e gli otto intorno (quelli che esistono nella griglia), dal centro: è ciò che il telefono scarica. */
  function intorno(id) {
    const rc = rigaColonna(id); if (!rc) return [];
    const out = [id];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const r = rc[0] + dr, c = rc[1] + dc;
      if ((dr || dc) && r >= 0 && r < GRIGLIA.righe && c >= 0 && c < GRIGLIA.colonne) out.push(nome(r, c));
    }
    return out;
  }

  /* ---------- Regioni: il punto in quale regione cade (sorgenti/dati/regioni.json, da Natural Earth) ---------- */
  function dentroAnelli(lng, lat, anelli) {   // regola pari-dispari: il primo anello è il contorno, gli altri sono buchi
    let dentro = false;
    for (const a of anelli) for (let i = 0, j = a.length - 1; i < a.length; j = i++) {
      const [xi, yi] = a[i], [xj, yj] = a[j];
      if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) dentro = !dentro;
    }
    return dentro;
  }
  const KM_LAT = 111.32;
  function distanzaKm(lng, lat, anelli) {   // distanza dal bordo più vicino, approssimata sul piano locale
    const kx = KM_LAT * Math.cos(lat * Math.PI / 180);
    let min = Infinity;
    for (const a of anelli) for (let i = 1; i < a.length; i++) {
      const ax = (a[i - 1][0] - lng) * kx, ay = (a[i - 1][1] - lat) * KM_LAT, bx = (a[i][0] - lng) * kx, by = (a[i][1] - lat) * KM_LAT;
      const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
      const t = l ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / l)) : 0;
      min = Math.min(min, Math.hypot(ax + t * dx, ay + t * dy));
    }
    return min;
  }
  /* La regione di un punto. Un punto in mare vicino alla costa (un molo, un'isola minore che la semplificazione dei
     confini ha tolto) va alla regione più vicina entro 40 km (le isole Ponziane distano più di 30 km dalla costa); più lontano, nessuna. */
  function regione(lat, lng, regioni) {
    let vicina = null, dMin = 40;
    for (const r of regioni) {
      if (r.poligoni.some(p => dentroAnelli(lng, lat, p))) return r.nome;
      const d = Math.min(...r.poligoni.map(p => distanzaKm(lng, lat, p)));
      if (d < dMin) { dMin = d; vicina = r.nome; }
    }
    return vicina;
  }

  /* Un'impronta breve del contenuto di un file (FNV-1a e un mescolamento alla Murmur, 32 bit ciascuno): cambia quando
     cambia il file. Non è una misura di sicurezza: serve al telefono per capire se un quadrante è cambiato. */
  function impronta(testo) {
    let a = 0x811c9dc5, b = 0x050c5d1f;
    for (let i = 0; i < testo.length; i++) {
      const c = testo.charCodeAt(i);
      a = Math.imul(a ^ c, 0x01000193) >>> 0;
      b = Math.imul(b ^ c, 0x5bd1e995); b = (b ^ (b >>> 13)) >>> 0;
    }
    return ('0000000' + a.toString(16)).slice(-8) + ('0000000' + b.toString(16)).slice(-8);
  }

  /* ---------- Scrivere l'archivio ----------
     costruisci(eventi, {adesso, regioni, cartella}) → {indice, file: {percorso: testo}}.
     Tiene solo gli eventi che a quel momento non sono ancora usciti dalla mappa (tre ore dopo la fine); uno per riga,
     in ordine di inizio. Rifiuta (con un errore) un evento non valido o fuori dalla griglia. */
  function testoQuadrante(id, eventi) {
    return '{"formato":"eventi-quadrante","versione":' + E.FORMATO + ',"tdm-reservation":1,"quadrante":"' + id + '","eventi":[' +
      (eventi.length ? '\n' + eventi.map(e => JSON.stringify(e)).join(',\n') + '\n' : '') + ']}\n';
  }
  /* Dove portare chi tocca il numero di una regione: il punto medio degli eventi del suo quadrante più pieno (a parità, il
     primo in ordine di nome), arrotondato a quattro decimali. */
  function vai(perQuadrante) {
    const q = Object.keys(perQuadrante).sort().reduce((m, k) => (!m || perQuadrante[k].length > perQuadrante[m].length ? k : m), null);
    const l = perQuadrante[q], r4 = x => Math.round(x * 1e4) / 1e4;
    return [r4(l.reduce((s, e) => s + e.lng, 0) / l.length), r4(l.reduce((s, e) => s + e.lat, 0) / l.length)];
  }
  function costruisci(eventi, opz) {
    const adesso = opz.adesso, cartella = opz.cartella || 'quadranti/', regioni = opz.regioni || [];
    if (!Number.isFinite(adesso)) throw new Error('costruisci: serve «adesso» in millisecondi');
    const per = {}, conta = {}, perRegione = {}, visti = new Set();
    for (const ev of eventi) {
      const err = E.controlla(ev, opz.vocabolario ? { vocabolario: opz.vocabolario } : undefined);
      if (err.length) throw new Error('evento ' + (ev && ev.id) + ' non valido: ' + err.join('; '));
      if (visti.has(ev.id)) throw new Error('identificativo ripetuto: ' + ev.id); visti.add(ev.id);
      if (E.uscitaMs(ev) <= adesso) continue;
      const q = quadrante(ev.lat, ev.lng); if (!q) throw new Error('evento ' + ev.id + ' fuori dalla griglia');
      (per[q] = per[q] || []).push(ev);
      const reg = regione(ev.lat, ev.lng, regioni);
      if (reg) { conta[reg] = (conta[reg] || 0) + 1; ((perRegione[reg] = perRegione[reg] || {})[q] = perRegione[reg][q] || []).push(ev); }
    }
    const file = {}, quadranti = {};
    for (const q of Object.keys(per).sort()) {
      const lista = per[q].sort((x, y) => E.istante(x.inizio) - E.istante(y.inizio) || (x.id < y.id ? -1 : 1));
      const testo = testoQuadrante(q, lista), v = impronta(testo), f = cartella + q + '-' + v + '.json';
      file[f] = testo; quadranti[q] = { file: f, v, eventi: lista.length };
    }
    const indice = { formato: 'eventi-indice', versione: E.FORMATO, 'tdm-reservation': 1, generato: new Date(adesso).toISOString().slice(0, 19) + 'Z',
      griglia: GRIGLIA, quadranti,
      regioni: regioni.filter(r => conta[r.nome]).map(r => ({ nome: r.nome, punto: r.punto, eventi: conta[r.nome], vai: vai(perRegione[r.nome]) })) };
    file['indice.json'] = JSON.stringify(indice) + '\n';
    return { indice, file };
  }

  /* ---------- Leggere l'archivio (app pubblica) ---------- */
  const FILE = /^[a-z0-9_-]+(\/[a-z0-9_-]+)*\/?[a-z0-9_.-]+\.json$/;
  /* Controlla l'indice: [] se va bene. Un indice con un'altra griglia o un'altra versione non si usa. */
  function controllaIndice(j) {
    const err = [];
    if (!j || typeof j !== 'object') return ['indice: non è un oggetto'];
    if (j.formato !== 'eventi-indice') err.push('indice: formato sconosciuto');
    if (j.versione !== E.FORMATO) err.push('indice: versione ' + j.versione + ', l\'app legge la ' + E.FORMATO);
    if (JSON.stringify(j.griglia) !== JSON.stringify(GRIGLIA)) err.push('indice: griglia diversa');
    if (!j.quadranti || typeof j.quadranti !== 'object' || Array.isArray(j.quadranti)) err.push('indice: mancano i quadranti');
    else for (const [q, x] of Object.entries(j.quadranti)) {
      if (!rigaColonna(q)) err.push('indice: quadrante sconosciuto ' + q);
      else if (!x || typeof x.file !== 'string' || !FILE.test(x.file) || x.file.includes('..') || typeof x.v !== 'string' || !/^[0-9a-z]{1,32}$/.test(x.v) || !Number.isInteger(x.eventi) || x.eventi < 0)
        err.push('indice: voce non valida per ' + q);
    }
    if (!Array.isArray(j.regioni)) err.push('indice: mancano le regioni');
    else for (const r of j.regioni) {
      const inItalia = p => Array.isArray(p) && p.length === 2 && p[1] >= E.RIQUADRO.sud && p[1] < E.RIQUADRO.nord && p[0] >= E.RIQUADRO.ovest && p[0] < E.RIQUADRO.est;
      if (!r || typeof r.nome !== 'string' || !r.nome || r.nome.length > 40 || !inItalia(r.punto) || !inItalia(r.vai) || !Number.isInteger(r.eventi) || r.eventi < 0) err.push('indice: regione non valida');
    }
    return err;
  }
  /* Gli eventi di un file di quadrante: solo quelli validi e che stanno davvero in quel quadrante. */
  function eventiDelQuadrante(j, id, opz) {
    if (!j || j.formato !== 'eventi-quadrante' || j.versione !== E.FORMATO || j.quadrante !== id || !Array.isArray(j.eventi)) return { eventi: [], scartati: -1 };
    const eventi = j.eventi.filter(ev => E.valido(ev, opz) && quadrante(ev.lat, ev.lng) === id);
    return { eventi, scartati: j.eventi.length - eventi.length };
  }

  return { GRIGLIA, quadrante, confini, intorno, regione, impronta, costruisci, controllaIndice, eventiDelQuadrante };
});

/* Lettura dell'archivio degli eventi nell'app pubblica (voce T-022 del piano di adeguamento; docs/formato-eventi.md).

   Libro mastro § 2.4, «La lettura degli eventi»: il telefono non scarica una città intera, ma l'indice e i quadranti
   che servono; all'apertura e al ritorno nell'app dopo più di trenta minuti chiede se i quadranti che conserva sono
   cambiati e riscarica solo quelli; nessuna richiesta porta con sé un identificativo dell'utente (niente cookie,
   credenziali, parametri). § 3.7: gli eventi delle zone consultate restano sul telefono finché sono futuri, per
   consultarli senza rete, e si aggiornano a ogni controllo delle novità. Qui si conservano nella memoria del browser
   per i file (Cache Storage), se c'è; altrimenti solo finché l'app resta aperta.

   Il modulo non disegna nulla: l'interfaccia (app2.js) gli chiede le zone e legge gli eventi.
   Nel browser si trova in window.AGR_MODULI.archivio (dopo eventi.js e quadranti.js); in Node con require(). */
(function (radice, fabbrica) {
  const nodo = typeof module === 'object' && module.exports && typeof require === 'function';
  const M = nodo ? { eventi: require('./eventi.js'), quadranti: require('./quadranti.js') } : (radice.AGR_MODULI || {});
  const m = fabbrica(M.eventi, M.quadranti);
  if (nodo) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).archivio = m;
})(typeof self !== 'undefined' ? self : this, function (E, Q) {
  'use strict';
  if (!E || !Q) throw new Error('archivio.js: servono prima eventi.js e quadranti.js');

  const TRENTA_MINUTI = 30 * 6e4;
  /* Le richieste: mai cookie o credenziali, nessun parametro; l'indice si ricontrolla sempre con il server. */
  const RICHIESTA_INDICE = { credentials: 'omit', cache: 'no-cache', redirect: 'error' };
  const RICHIESTA_FILE = { credentials: 'omit', redirect: 'error' };

  /* crea({dove, vocabolario, fetch, casse, nomeCassa, adesso}): un lettore dell'archivio.
     dove: indirizzo della cartella dell'archivio, con la barra finale; fetch: quello del browser; casse: la memoria per
     i file del modulo memoria.js (nelle prove, finta), con nomeCassa che è il suo nome nell'elenco chiuso della memoria
     del telefono (T-026); adesso: funzione che dà l'ora in millisecondi. */
  function crea(o) {
    const dove = String(o.dove || '').replace(/\/?$/, '/');
    const prendi = o.fetch, adesso = o.adesso || (() => Date.now()), opzEv = o.vocabolario ? { vocabolario: o.vocabolario } : undefined;
    const S = { indice: null, caricati: new Map(), inCorso: new Map(), ultimoControllo: 0, cache: null, persistente: false, controllo: null };

    async function memoria() {
      if (S.cache || !o.casse || !o.nomeCassa) return S.cache;
      try { S.cache = await o.casse.open(o.nomeCassa); S.persistente = true; } catch (e) { S.cache = null; }
      return S.cache;
    }
    async function leggiMemoria(percorso) {
      const c = await memoria(); if (!c) return null;
      try { const r = await c.match(dove + percorso); return r ? await r.text() : null; } catch (e) { return null; }
    }
    async function scriviMemoria(percorso, testo) {
      const c = await memoria(); if (!c) return;
      try { await c.put(dove + percorso, new Response(testo, { headers: { 'content-type': 'application/json' } })); } catch (e) { /* memoria piena: resta in uso finché l'app è aperta */ }
    }
    /* Toglie dalla memoria i file che l'indice attuale non nomina più (versioni vecchie, quadranti senza eventi). */
    async function pulisciMemoria() {
      const c = await memoria(); if (!c || !S.indice) return;
      const validi = new Set(['indice.json'].concat([...S.caricati.values()].map(x => x.file)));
      try { for (const r of await c.keys()) { const u = r.url || String(r); if (u.startsWith(dove) && !validi.has(u.slice(dove.length))) await c.delete(r); } } catch (e) { /* niente */ }
    }

    function leggiQuadrante(q, testo, voce) {
      if (Q.impronta(testo) !== voce.v) return false;   // il file non è quello che l'indice annuncia
      let j; try { j = JSON.parse(testo); } catch (e) { return false; }
      const letti = Q.eventiDelQuadrante(j, q, opzEv);
      if (letti.scartati < 0) return false;
      S.caricati.set(q, { v: voce.v, file: voce.file, eventi: letti.eventi, scartati: letti.scartati });
      return true;
    }
    async function scarica(q) {
      if (S.inCorso.has(q)) return S.inCorso.get(q);
      const voce = S.indice && S.indice.quadranti[q];
      if (!voce) { S.caricati.delete(q); return false; }
      const p = (async () => {
        try {
          const r = await prendi(dove + voce.file, RICHIESTA_FILE); if (!r.ok) return false;
          const testo = await r.text();
          if (!leggiQuadrante(q, testo, voce)) return false;
          await scriviMemoria(voce.file, testo);
          return true;
        } catch (e) { return false; }
        finally { S.inCorso.delete(q); }
      })();
      S.inCorso.set(q, p);
      return p;
    }

    /* All'apertura: prima ciò che il telefono conserva (subito, anche senza rete), poi il controllo delle novità. */
    async function apri() {
      const testo = await leggiMemoria('indice.json');
      if (testo) {
        let j = null; try { j = JSON.parse(testo); } catch (e) { j = null; }
        if (j && !Q.controllaIndice(j).length) {
          S.indice = j;
          for (const [q, voce] of Object.entries(j.quadranti)) { const t = await leggiMemoria(voce.file); if (t) leggiQuadrante(q, t, voce); }
        }
      }
      return controllaNovita();
    }

    /* Rilegge l'indice; riscarica i quadranti conservati che sono cambiati; dimentica quelli che non hanno più eventi.
       Restituisce true se è cambiato qualcosa. Una sola alla volta. */
    function controllaNovita() {
      if (S.controllo) return S.controllo;
      S.controllo = (async () => {
        try {
          const r = await prendi(dove + 'indice.json', RICHIESTA_INDICE); if (!r.ok) return false;
          const testo = await r.text(); let j; try { j = JSON.parse(testo); } catch (e) { return false; }
          if (Q.controllaIndice(j).length) return false;
          const prima = S.indice ? JSON.stringify(S.indice.quadranti) + JSON.stringify(S.indice.regioni) : '';
          S.indice = j; S.ultimoControllo = adesso();
          await scriviMemoria('indice.json', testo);
          const cambiati = [];
          for (const [q, x] of [...S.caricati]) {
            const voce = j.quadranti[q];
            if (!voce) S.caricati.delete(q);
            else if (voce.v !== x.v) cambiati.push(q);
          }
          await Promise.all(cambiati.map(scarica));
          await pulisciMemoria();
          return prima !== JSON.stringify(j.quadranti) + JSON.stringify(j.regioni) || cambiati.length > 0;
        } catch (e) { return false; }
        finally { S.controllo = null; }
      })();
      return S.controllo;
    }
    /* Al ritorno nell'app: il controllo solo se l'ultimo è di più di trenta minuti fa. */
    const forseControlla = () => adesso() - S.ultimoControllo > TRENTA_MINUTI ? controllaNovita() : Promise.resolve(false);

    /* Carica i quadranti indicati che hanno eventi (dalla memoria se la versione è quella giusta, se no dalla rete).
       Restituisce true se ne è arrivato almeno uno nuovo. */
    async function carica(ids) {
      if (!S.indice) return false;
      const daFare = ids.filter(q => S.indice.quadranti[q] && (!S.caricati.has(q) || S.caricati.get(q).v !== S.indice.quadranti[q].v));
      const esiti = await Promise.all(daFare.map(scarica));
      return esiti.some(Boolean);
    }

    /* Gli eventi conservati (di tutte le zone consultate) non ancora usciti dalla mappa, con il loro quadrante. */
    function eventi() {
      const t = adesso(), out = [];
      for (const [q, x] of S.caricati) for (const ev of x.eventi) if (E.uscitaMs(ev) > t) out.push({ q, ev });
      return out;
    }

    return {
      apri, controllaNovita, forseControlla, carica, eventi,
      regioni: () => (S.indice ? S.indice.regioni : []),
      quadranti: () => (S.indice ? Object.keys(S.indice.quadranti) : []),   // tutti i quadranti con eventi, dall'indice
      pronto: () => !!S.indice,
      quadrantiConservati: () => [...S.caricati.keys()],
      persistente: () => S.persistente,
      ultimoControllo: () => S.ultimoControllo,
    };
  }

  return { crea, TRENTA_MINUTI };
});

/* La mappa delle zone viste, conservata sul telefono (voce T-029 del piano di adeguamento; documento: docs/senza-rete.md).

   Libro mastro, § 2.2 («L'uso senza rete») e § 3.7: il telefono conserva la mappa delle zone già viste, per vederla
   senza rete, fino a 50 MB; poi i tasselli più vecchi lasciano posto ai nuovi. La mappa è un file unico letto a pezzi:
   per questo i tasselli si conservano uno per uno, quando l'app li disegna, nella memoria del browser per i file
   (modulo memoria.js, voce dell'elenco chiuso). Accanto ai tasselli sta la copia del piccolo indice della mappa
   (mappa.json), che senza rete dice quale mappa si stava usando.

   Quando la mappa cambia versione (ogni sei mesi, T-019) i tasselli della versione di prima si cancellano.
   Il modulo non disegna e non scarica nulla: riceve da chi lo usa la funzione che scarica un tassello.
   Nel browser si trova in window.AGR_MODULI.mappaLocale; in Node con require(). */
(function (radice, fabbrica) {
  const m = fabbrica();
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).mappaLocale = m;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const LIMITE = 50 * 1024 * 1024;   // 50 MB (§ 3.7)
  const PESO = 'x-peso';             // intestazione con il peso del tassello, per fare i conti senza rileggerlo

  /* crea({casse, nomeCassa, dove, limite}): casse è la memoria per i file del modulo memoria.js (nelle prove, finta), con
     nomeCassa che è il suo nome nell'elenco chiuso; dove è l'indirizzo della mappa, con la barra finale; limite in byte. */
  function crea(o) {
    const dove = String(o.dove || '').replace(/\/?$/, '/'), limite = o.limite > 0 ? o.limite : LIMITE;
    const BASE = dove + 'sul-telefono/', INDICE = BASE + 'mappa.json';
    const S = { cassa: undefined, pesi: null, totale: 0, pronta: null, coda: Promise.resolve() };
    const chiave = (versione, z, x, y) => BASE + encodeURIComponent(versione) + '/' + z + '/' + x + '/' + y;

    async function cassa() {
      if (S.cassa !== undefined) return S.cassa;
      S.cassa = null;
      if (o.casse && o.nomeCassa && dove !== '/') { try { S.cassa = await o.casse.open(o.nomeCassa); } catch (e) { S.cassa = null; } }
      return S.cassa;
    }
    /* I pesi dei tasselli conservati, nell'ordine in cui sono arrivati: si leggono una volta sola, alla prima scrittura. */
    function conti() {
      return S.pronta = S.pronta || (async () => {
        const c = await cassa(); S.pesi = new Map(); S.totale = 0;
        if (!c) return;
        const richieste = await c.keys();
        for (const r of richieste) {
          if (r.url === INDICE || !r.url.startsWith(BASE)) continue;
          let peso = 0;
          try { const x = await c.match(r); peso = x ? Number(x.headers.get(PESO)) || 0 : 0; } catch (e) { peso = 0; }
          S.pesi.set(r.url, peso); S.totale += peso;
        }
      })();
    }
    async function togli(c, url) {
      try { await c.delete(url); } catch (e) { /* niente da fare */ }
      S.totale -= S.pesi.get(url) || 0; S.pesi.delete(url);
    }

    /* La copia dell'indice della mappa: ricorda(testo) la scrive, ricordato() la rilegge (null se non c'è). */
    async function ricorda(testo) {
      const c = await cassa(); if (!c) return;
      try { await c.put(INDICE, new Response(String(testo), { headers: { 'content-type': 'application/json' } })); } catch (e) { /* niente da fare */ }
    }
    async function ricordato() {
      const c = await cassa(); if (!c) return null;
      try { const r = await c.match(INDICE); return r ? await r.text() : null; } catch (e) { return null; }
    }

    /* Un tassello: dalla copia sul telefono se c'è, altrimenti con scarica(), che dà i dati (ArrayBuffer) oppure null
       se in quel punto la mappa non ha nulla. Ciò che si scarica si conserva; gli errori di scarica() passano a chi chiama. */
    async function tassello(versione, z, x, y, scarica) {
      const c = await cassa(), k = chiave(versione, z, x, y);
      if (c) { try { const r = await c.match(k); if (r) return await r.arrayBuffer(); } catch (e) { /* si scarica */ } }
      const dati = await scarica();
      /* Si conserva una copia fatta subito: chi disegna la mappa può portarsi via i dati appena li riceve.
         Le scritture vanno una dopo l'altra, così i conti dello spazio restano giusti. */
      if (c && dati && dati.byteLength) { const copia = dati.slice(0); S.coda = S.coda.then(() => conserva(c, k, copia)).catch(() => {}); }
      return dati || null;
    }
    async function conserva(c, k, dati) {
      await conti();
      const peso = dati.byteLength;
      if (peso > limite) return;
      if (S.pesi.has(k)) await togli(c, k);
      /* prima si fa posto: i più vecchi lasciano posto ai nuovi */
      for (const vecchio of S.pesi.keys()) { if (S.totale + peso <= limite) break; await togli(c, vecchio); }
      try { await c.put(k, new Response(dati, { headers: { 'content-type': 'application/x-protobuf', [PESO]: String(peso) } })); } catch (e) { return; }
      S.pesi.set(k, peso); S.totale += peso;
    }

    /* Toglie i tasselli delle versioni della mappa diverse da quella in uso. */
    async function soloVersione(versione) {
      const c = await cassa(); if (!c) return;
      await conti();
      const pre = BASE + encodeURIComponent(versione) + '/';
      for (const url of [...S.pesi.keys()]) if (!url.startsWith(pre)) await togli(c, url);
    }

    /* Quanto c'è sul telefono: {tasselli, byte}. */
    async function stato() { await S.coda; await conti(); return { tasselli: S.pesi.size, byte: S.totale }; }

    return { tassello, ricorda, ricordato, soloVersione, stato, limite };
  }

  return { LIMITE, crea };
});

/* Avvisi delle novità (voce T-031 del piano di adeguamento; documento: docs/senza-rete.md).

   Libro mastro, § 29.1 («Quando si aggiorna») e § 32.1: una modifica dei testi che tocca i dati o i diritti si annuncia
   nell'app, e per le condizioni d'uso prima della data di entrata in vigore; § 3.12, passo 4, e allegato C.13: quando le
   persone coinvolte non si possono raggiungere una per una, la comunicazione di una violazione dei dati si fa in forma
   pubblica, anche nell'app (art. 34, par. 3, lett. c, GDPR).

   Gli avvisi stanno in un piccolo file pubblicato con l'app, avvisi.json (sorgente: sorgenti/testi/avvisi.json):

     {"formato": "avvisi", "versione": 1, "avvisi": [
       {"id": "2027-01-informativa", "tipo": "modifica", "dal": "2027-01-10", "fino": "2027-03-10",
        "apre": "privacy", "testo": {"it": "…", "en": "…"}}]}

   tipo: «modifica» (dei testi) o «violazione» (comunicazione pubblica di una violazione dei dati); dal, fino: il primo e
   l'ultimo giorno in cui l'avviso si mostra; apre: il testo che il tasto «Leggi» apre (privacy, storage, disclaimer,
   condizioni), oppure niente; testo: almeno in italiano, senza codice: l'app lo mostra come testo.

   L'avviso informa e basta: non chiede consensi e non blocca l'app. Chi l'ha visto non lo rivede: il telefono ricorda
   i soli identificativi degli avvisi visti (riga delle preferenze e scelte della scheda «Dati locali», QB-5).
   Il modulo non disegna e non scarica nulla. Nel browser si trova in window.AGR_MODULI.avvisi; in Node con require(). */
(function (radice, fabbrica) {
  const m = fabbrica();
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).avvisi = m;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TIPI = ['violazione', 'modifica'];                         // in quest'ordine: una violazione si mostra per prima
  const APRE = ['privacy', 'storage', 'disclaimer', 'condizioni'];
  const LINGUE = ['it', 'en', 'es', 'fr', 'ar'];
  const MASSIMO = 10, TESTO_MAX = 600;
  const giorno = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z'));

  /* Gli errori di un file di avvisi, in parole; elenco vuoto se il file va bene. */
  function errori(j) {
    const e = [];
    if (!j || typeof j !== 'object' || j.formato !== 'avvisi' || j.versione !== 1 || !Array.isArray(j.avvisi)) return ['il file non è un file di avvisi (formato «avvisi», versione 1, elenco «avvisi»)'];
    if (j.avvisi.length > MASSIMO) e.push('troppi avvisi: al massimo ' + MASSIMO);
    const visti = new Set();
    j.avvisi.forEach((a, i) => {
      const n = 'avviso ' + (i + 1) + ': ';
      if (!a || typeof a !== 'object') return e.push(n + 'non è un avviso');
      for (const k of Object.keys(a)) if (!['id', 'tipo', 'dal', 'fino', 'apre', 'testo'].includes(k)) e.push(n + 'campo sconosciuto «' + k + '»');
      if (typeof a.id !== 'string' || !/^[a-z0-9][a-z0-9.-]{2,60}$/.test(a.id)) e.push(n + 'id non valido (lettere minuscole, cifre, punti e trattini)');
      else if (visti.has(a.id)) e.push(n + 'id ripetuto'); else visti.add(a.id);
      if (!TIPI.includes(a.tipo)) e.push(n + 'tipo deve essere «modifica» o «violazione»');
      if (!giorno(a.dal) || !giorno(a.fino) || a.fino < a.dal) e.push(n + 'servono dal e fino (AAAA-MM-GG), con fino non prima di dal');
      if (a.apre != null && !APRE.includes(a.apre)) e.push(n + 'apre deve essere uno tra ' + APRE.join(', '));
      const t = a.testo;
      if (!t || typeof t !== 'object' || typeof t.it !== 'string' || !t.it.trim()) e.push(n + 'manca il testo in italiano');
      else for (const [l, x] of Object.entries(t)) {
        if (!LINGUE.includes(l)) e.push(n + 'lingua sconosciuta «' + l + '»');
        else if (typeof x !== 'string' || !x.trim() || x.length > TESTO_MAX) e.push(n + 'testo «' + l + '» vuoto o più lungo di ' + TESTO_MAX + ' caratteri');
      }
    });
    return e;
  }

  /* L'avviso da mostrare oggi, oppure null. o: {oggi: 'AAAA-MM-GG', visti: [id…], lingua}. Un file non valido non mostra nulla. */
  function daMostrare(j, o) {
    if (errori(j).length) return null;
    const oggi = o && o.oggi, visti = new Set(Array.isArray(o && o.visti) ? o.visti : []);
    if (!giorno(oggi)) return null;
    const attivi = j.avvisi.filter(a => a.dal <= oggi && oggi <= a.fino && !visti.has(a.id))
      .sort((a, b) => TIPI.indexOf(a.tipo) - TIPI.indexOf(b.tipo) || (a.dal < b.dal ? -1 : a.dal > b.dal ? 1 : 0));
    if (!attivi.length) return null;
    const a = attivi[0], l = o && o.lingua;
    return { id: a.id, tipo: a.tipo, apre: a.apre || null, testo: (l && a.testo[l]) || a.testo.it, lingua: l && a.testo[l] ? l : 'it' };
  }

  /* L'elenco degli avvisi visti dopo averne visto uno: restano solo quelli che il file nomina ancora, così non cresce. */
  function conVisto(j, visti, id) {
    const nel = new Set(errori(j).length ? [] : j.avvisi.map(a => a.id));
    return [...new Set((Array.isArray(visti) ? visti : []).concat([id]))].filter(x => typeof x === 'string' && nel.has(x));
  }

  return { TIPI, APRE, errori, daMostrare, conVisto };
});

/* Chiavi della Redazione, cassaforte e marcatore (voci T-034 e T-037 del piano di adeguamento; documento:
   docs/chiavi-redazione.md). Questo modulo entra soltanto nell'app della redazione.

   Libro mastro, § 2.4 («Le chiavi»): la firma della Redazione consente soltanto di pubblicare eventi e la sua parte
   segreta non lascia il dispositivo della redazione; nessuna chiave sta nel codice, nel repository o in una chat.
   § 3.11: archivio della redazione con copia di sicurezza cifrata. § 3.14: le password degli eventi nascosti si
   cancellano quando l'evento finisce. §§ 2.4 e 6.5: marcatore invisibile negli identificativi degli eventi.

   Che cosa c'è sul dispositivo (voce «red_chiavi» della base di dati, modulo memoria.js):
   - una coppia di chiavi di FIRMA, propria di questo dispositivo: firma i pacchetti da pubblicare (blocco 9);
   - una coppia di chiavi di CIFRATURA: gli sportelli cifrano le segnalazioni con la parte pubblica, solo la Redazione
     le legge (blocco 13);
   - la chiave del REGISTRO delle fonti, diversa da quella della firma (blocchi 10 e 14);
   - la chiave del MARCATORE, da cui si ricava il segno negli identificativi degli eventi;
   - la chiave della CASSAFORTE delle password degli eventi nascosti.
   Le parti segrete sono tenute dal browser come chiavi non estraibili: l'app le può usare, ma non le può più leggere né
   copiare. L'unica copia leggibile è la COPIA DI RISERVA, fatta nel momento in cui le chiavi nascono e cifrata con una
   frase che conosce solo la Redazione: senza la frase il file è illeggibile, e la frase non si salva da nessuna parte.

   Più dispositivi. La firma è di ogni dispositivo: un secondo dispositivo riceve dalla copia di riserva le chiavi comuni
   (cifratura, registro, marcatore, cassaforte) e si crea una firma sua, che si può revocare da sola. «Ripristina» porta
   invece su un dispositivo nuovo tutte le chiavi di quello perso, firma compresa.

   Strumenti: soltanto quelli di cifratura del browser (Web Crypto). Firma: ECDSA sulla curva P-256 con SHA-256.
   Cifratura: ECDH P-256. Registro e cassaforte: AES-GCM a 256 bit. Marcatore: HMAC-SHA-256. Copia di riserva: chiave
   ricavata dalla frase con PBKDF2-SHA-256 (600.000 giri, sale casuale) e AES-GCM.

   Nel browser si trova in window.AGR_MODULI.chiavi; in Node (prove) con require(). */
(function (radice, fabbrica) {
  const m = fabbrica(radice);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).chiavi = m;
})(typeof self !== 'undefined' ? self : this, function (radice) {
  'use strict';

  const VERSIONE = 1;
  const GIRI = 600000;            // giri di PBKDF2 per la copia di riserva
  const FRASE_MIN = 20;           // lunghezza minima della frase, in caratteri
  const NOME_MAX = 40;            // lunghezza massima del nome del dispositivo
  const CURVA = 'P-256';
  const ALFABETO = 'abcdefghijklmnopqrstuvwxyz234567';   // base32 minuscolo, come negli identificativi (eventi.js)
  const ID = /^([a-z2-7]{16})-([a-z2-7]{8})$/;
  const ID_OVUNQUE = /(?<![a-z2-7])[a-z2-7]{16}-[a-z2-7]{8}(?![a-z2-7])/g;
  const TIPO_COPIA = 'copia-chiavi-redazione', TIPO_PUBBLICHE = 'chiavi-pubbliche-redazione',
    TIPO_REVOCA = 'revoca-chiave-redazione', TIPO_CASSAFORTE = 'copia-cassaforte-redazione';

  /* Un errore con un motivo breve, che la schermata traduce in una frase. */
  function errore(motivo, dettaglio) { const e = new Error('Chiavi della Redazione, ' + motivo + (dettaglio ? ' (' + dettaglio + ')' : '')); e.motivo = motivo; return e; }

  const testoInByte = s => new TextEncoder().encode(String(s));
  const byteInTesto = b => new TextDecoder('utf-8', { fatal: true }).decode(b);
  function b64(b) { b = new Uint8Array(b); let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function daB64(s) {
    if (typeof s !== 'string' || !/^[A-Za-z0-9_-]*$/.test(s)) throw errore('file');
    const t = atob(s.replace(/-/g, '+').replace(/_/g, '/')), b = new Uint8Array(t.length);
    for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i);
    return b;
  }
  /* base32 minuscolo dei primi n caratteri (5 bit per carattere). */
  function base32(b, n) {
    let s = '', bit = 0, v = 0;
    for (let i = 0; i < b.length && s.length < n; i++) {
      v = (v << 8) | b[i]; bit += 8;
      while (bit >= 5 && s.length < n) { s += ALFABETO[(v >>> (bit - 5)) & 31]; bit -= 5; }
    }
    return s;
  }
  const esadecimale = b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');

  /* crea({cripto, deposito, ora}): le chiavi di un dispositivo.
     cripto: gli strumenti di cifratura del browser (crypto); deposito: {leggi, scrivi, togli} sulle voci «red_chiavi» e
     «red_cassaforte» (la base di dati di memoria.js; nelle prove, finto); ora: l'orologio (nelle prove, finto). */
  function crea(o) {
    o = o || {};
    const cripto = o.cripto || radice.crypto || (typeof globalThis === 'object' ? globalThis.crypto : null), dep = o.deposito, ora = o.ora || (() => Date.now());
    const sub = cripto && cripto.subtle;
    const pronto = () => { if (!sub || !dep) throw errore('browser'); };

    const casuali = n => cripto.getRandomValues(new Uint8Array(n));
    const impronta = async pubblica => { const h = esadecimale(await sub.digest('SHA-256', daB64(pubblica))).slice(0, 16); return h.replace(/(.{4})(?=.)/g, '$1 '); };

    /* ---------- La copia di riserva: tutto ciò che è segreto, cifrato con la frase ---------- */
    async function chiaveDallaFrase(frase, sale, giri) {
      const base = await sub.importKey('raw', testoInByte(frase.normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
      return sub.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: sale, iterations: giri }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    }
    async function chiudi(segreti, frase) {
      const sale = casuali(16), iv = casuali(12);
      const k = await chiaveDallaFrase(frase, sale, GIRI);
      const dati = await sub.encrypt({ name: 'AES-GCM', iv, additionalData: testoInByte(TIPO_COPIA) }, k, testoInByte(JSON.stringify(segreti)));
      return { tipo: TIPO_COPIA, v: VERSIONE, creato: new Date(ora()).toISOString(), dispositivo: segreti.dispositivo,
        kdf: { nome: 'PBKDF2', hash: 'SHA-256', giri: GIRI, sale: b64(sale) }, cifra: { nome: 'AES-GCM', iv: b64(iv) }, dati: b64(dati) };
    }
    async function apri(copia, frase) {
      if (typeof copia === 'string') { try { copia = JSON.parse(copia); } catch (e) { throw errore('file'); } }
      if (!copia || copia.tipo !== TIPO_COPIA || copia.v !== VERSIONE || !copia.kdf || !copia.cifra) throw errore('file');
      const giri = copia.kdf.giri;
      if (copia.kdf.nome !== 'PBKDF2' || copia.kdf.hash !== 'SHA-256' || !Number.isInteger(giri) || giri < 100000 || giri > 5000000 || copia.cifra.nome !== 'AES-GCM') throw errore('file');
      const k = await chiaveDallaFrase(String(frase || ''), daB64(copia.kdf.sale), giri);
      let chiaro;
      try { chiaro = await sub.decrypt({ name: 'AES-GCM', iv: daB64(copia.cifra.iv), additionalData: testoInByte(TIPO_COPIA) }, k, daB64(copia.dati)); }
      catch (e) { throw errore('frase'); }   // frase sbagliata o file alterato: non si distinguono, ed è giusto così
      let s; try { s = JSON.parse(byteInTesto(chiaro)); } catch (e) { throw errore('file'); }
      for (const c of ['firma', 'firma_pub', 'cifratura', 'cifratura_pub', 'registro', 'marcatore', 'cassaforte']) if (typeof s[c] !== 'string') throw errore('file');
      return s;
    }

    /* ---------- Dal segreto leggibile alle chiavi non estraibili ---------- */
    async function importa(s) {
      const ec = (nome, usi) => ({ name: nome, namedCurve: CURVA });
      return {
        firma: { privata: await sub.importKey('pkcs8', daB64(s.firma), ec('ECDSA'), false, ['sign']), pubblica: s.firma_pub },
        cifratura: { privata: await sub.importKey('pkcs8', daB64(s.cifratura), ec('ECDH'), false, ['deriveKey', 'deriveBits']), pubblica: s.cifratura_pub },
        registro: await sub.importKey('raw', daB64(s.registro), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']),
        marcatore: await sub.importKey('raw', daB64(s.marcatore), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
        cassaforte: await sub.importKey('raw', daB64(s.cassaforte), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
      };
    }
    async function nuovaCoppia(nome, usi) {
      const c = await sub.generateKey({ name: nome, namedCurve: CURVA }, true, usi);
      return { privata: b64(await sub.exportKey('pkcs8', c.privateKey)), pubblica: b64(await sub.exportKey('raw', c.publicKey)) };
    }

    function controllaFrase(frase, ripeti) {
      frase = String(frase == null ? '' : frase);
      if (Array.from(frase.trim()).length < FRASE_MIN) throw errore('frase-corta');
      if (ripeti !== undefined && frase !== String(ripeti)) throw errore('frase-diversa');
      return frase;
    }
    function controllaNome(nome) {
      nome = String(nome == null ? '' : nome).replace(/\s+/g, ' ').trim();
      if (!nome || Array.from(nome).length > NOME_MAX || /[\u0000-\u001F\u007F-\u009F\u2028\u2029]/.test(nome)) throw errore('nome');
      return nome;
    }

    const leggi = async () => { pronto(); const v = await dep.leggi('red_chiavi'); return v && typeof v === 'object' ? v : null; };
    async function attive() { const v = await leggi(); if (!v || !v.chiavi) throw errore('mancano'); return v; }

    /* Mette sul dispositivo le chiavi ricavate dai segreti, con la copia di riserva già cifrata. */
    async function deposita(segreti, frase, noti) {
      const copia = await chiudi(segreti, frase);
      const voce = { v: VERSIONE, dispositivo: segreti.dispositivo, creato: segreti.creato, chiavi: await importa(segreti), copia, noti: noti || [] };
      await dep.scrivi('red_chiavi', voce);
      return stato();
    }

    /* Lo stato delle chiavi, senza nulla di segreto: {ci_sono, dispositivo, creato, firma, cifratura, noti, revocata}. */
    async function stato() {
      const v = await leggi();
      if (!v || !v.chiavi) return { ci_sono: false, revocata: v && v.revocata ? v.revocata : null };
      return { ci_sono: true, dispositivo: v.dispositivo, creato: v.creato,
        firma: { pubblica: v.chiavi.firma.pubblica, impronta: await impronta(v.chiavi.firma.pubblica) },
        cifratura: { pubblica: v.chiavi.cifratura.pubblica, impronta: await impronta(v.chiavi.cifratura.pubblica) },
        noti: v.noti || [], revocata: null };
    }

    /* «Crea le chiavi»: nascono qui, una volta sola. */
    async function genera(frase, ripeti, nome) {
      pronto();
      frase = controllaFrase(frase, ripeti); nome = controllaNome(nome);
      const c = await leggi(); if (c && c.chiavi) throw errore('ci-sono');
      const f = await nuovaCoppia('ECDSA', ['sign', 'verify']), ci = await nuovaCoppia('ECDH', ['deriveKey', 'deriveBits']);
      const segreti = { dispositivo: nome, creato: new Date(ora()).toISOString(), firma: f.privata, firma_pub: f.pubblica, cifratura: ci.privata, cifratura_pub: ci.pubblica,
        registro: b64(casuali(32)), marcatore: b64(casuali(32)), cassaforte: b64(casuali(32)) };
      return deposita(segreti, frase, []);
    }

    /* Da una copia di riserva. modo «ripristina»: le stesse chiavi del dispositivo perso, firma compresa.
       modo «aggiungi»: un dispositivo in più, con le chiavi comuni della copia e una firma sua (serve il suo nome). */
    async function daCopia(copia, frase, modo, nome) {
      pronto();
      const c = await leggi(); if (c && c.chiavi) throw errore('ci-sono');
      const s = await apri(copia, frase);
      if (modo === 'ripristina') return deposita(s, String(frase), Array.isArray(s.noti) ? s.noti : []);
      if (modo !== 'aggiungi') throw errore('modo');
      nome = controllaNome(nome);
      const f = await nuovaCoppia('ECDSA', ['sign', 'verify']);
      const noti = (Array.isArray(s.noti) ? s.noti : []).concat([{ dispositivo: s.dispositivo, impronta: await impronta(s.firma_pub), pubblica: s.firma_pub }]);
      const mio = Object.assign({}, s, { dispositivo: nome, creato: new Date(ora()).toISOString(), firma: f.privata, firma_pub: f.pubblica, noti });
      return deposita(mio, String(frase), noti);
    }

    /* «Copia di riserva»: il file cifrato fatto alla nascita delle chiavi, così com'è. */
    async function copia() {
      const v = await attive();
      return { nome: 'copia-chiavi-' + v.creato.slice(0, 10) + '.json', testo: JSON.stringify(v.copia, null, 1) + '\n' };
    }
    /* Le parti pubbliche da consegnare agli sportelli: non contengono nulla di segreto. */
    async function pubbliche() {
      const s = await stato(); if (!s.ci_sono) throw errore('mancano');
      return { tipo: TIPO_PUBBLICHE, v: VERSIONE, dispositivo: s.dispositivo, creato: s.creato,
        firma: { algoritmo: 'ECDSA-P256-SHA256', pubblica: s.firma.pubblica, impronta: s.firma.impronta },
        cifratura: { algoritmo: 'ECDH-P256', pubblica: s.cifratura.pubblica, impronta: s.cifratura.impronta } };
    }
    /* L'avviso di revoca di una firma, da consegnare agli sportelli: per questo dispositivo o per un altro che si conosce. */
    function avvisoRevoca(dispositivo, impr) { return { tipo: TIPO_REVOCA, v: VERSIONE, dispositivo, impronta: impr, quando: new Date(ora()).toISOString() }; }
    /* «Revoca questo dispositivo»: le chiavi si cancellano da qui, e resta l'avviso da consegnare agli sportelli. */
    async function revoca() {
      const s = await stato(); if (!s.ci_sono) throw errore('mancano');
      const avviso = avvisoRevoca(s.dispositivo, s.firma.impronta);
      await dep.scrivi('red_chiavi', { v: VERSIONE, revocata: avviso });
      return avviso;
    }
    /* Toglie anche il ricordo della revoca: il dispositivo torna come nuovo. */
    async function dimentica() { pronto(); const v = await leggi(); if (v && v.chiavi) throw errore('ci-sono'); await dep.togli('red_chiavi'); }

    /* ---------- Firma (la usano i blocchi 9 e seguenti) ---------- */
    async function firma(dati) {
      const v = await attive();
      return b64(await sub.sign({ name: 'ECDSA', hash: 'SHA-256' }, v.chiavi.firma.privata, typeof dati === 'string' ? testoInByte(dati) : dati));
    }
    async function verifica(pubblica, dati, f) {
      try {
        const k = await sub.importKey('raw', daB64(pubblica), { name: 'ECDSA', namedCurve: CURVA }, false, ['verify']);
        return await sub.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, daB64(f), typeof dati === 'string' ? testoInByte(dati) : dati);
      } catch (e) { return false; }
    }

    /* ---------- Marcatore (T-037) ----------
       L'identificativo di un evento: 16 caratteri a caso, un trattino e 8 caratteri di segno, ricavati dalla parte a
       caso con la chiave del marcatore. Il segno è uguale per tutti, non dice nulla a chi lo guarda e lo può verificare
       soltanto chi ha la chiave. */
    async function segno(parte) {
      const v = await attive();
      return base32(new Uint8Array(await sub.sign('HMAC', v.chiavi.marcatore, testoInByte('evento:' + parte))), 8);
    }
    async function nuovoId() { const parte = base32(casuali(10), 16); return parte + '-' + await segno(parte); }
    /* «Viene dal nostro archivio?» per un identificativo. */
    async function viene(id) { const m = String(id).match(ID); return !!m && await segno(m[1]) === m[2]; }
    /* Lo stesso per un testo o un file copiato: cerca tutti gli identificativi e li controlla uno per uno. */
    async function controllaTesto(testo) {
      const trovati = [...new Set(String(testo).match(ID_OVUNQUE) || [])], nostri = [], altri = [];
      for (const id of trovati) (await viene(id) ? nostri : altri).push(id);
      return { trovati: trovati.length, nostri, altri };
    }

    /* ---------- Cassaforte delle password degli eventi nascosti ----------
       Voce «red_cassaforte»: {v, voci: {idEvento: {iv, dati, fine}}}. Ogni password è cifrata con la chiave della
       cassaforte e legata al suo evento; «fine» è il momento in cui l'evento finisce: da allora la voce si cancella. */
    async function voci() { const c = await dep.leggi('red_cassaforte'); return c && c.voci && typeof c.voci === 'object' ? c.voci : {}; }
    const salvaVoci = v => dep.scrivi('red_cassaforte', { v: VERSIONE, voci: v });
    async function mettiPassword(idEvento, password, fineMs) {
      const v = await attive();
      if (typeof idEvento !== 'string' || !idEvento || typeof password !== 'string' || !password || !Number.isFinite(fineMs)) throw errore('cassaforte');
      const iv = casuali(12), tutte = await voci();
      tutte[idEvento] = { iv: b64(iv), fine: fineMs,
        dati: b64(await sub.encrypt({ name: 'AES-GCM', iv, additionalData: testoInByte(idEvento) }, v.chiavi.cassaforte, testoInByte(password))) };
      await salvaVoci(tutte);
    }
    async function leggiPassword(idEvento) {
      const v = await attive(), x = (await voci())[idEvento];
      if (!x || x.fine <= ora()) return null;
      try { return byteInTesto(await sub.decrypt({ name: 'AES-GCM', iv: daB64(x.iv), additionalData: testoInByte(idEvento) }, v.chiavi.cassaforte, daB64(x.dati))); }
      catch (e) { return null; }   // scritta con un'altra chiave: illeggibile
    }
    async function togliPassword(idEvento) { const tutte = await voci(); if (idEvento in tutte) { delete tutte[idEvento]; await salvaVoci(tutte); } }
    /* Cancella le password degli eventi finiti. Si chiama a ogni apertura dell'app della redazione. */
    async function pulisciCassaforte() {
      pronto();
      const tutte = await voci(), via = Object.keys(tutte).filter(k => !(tutte[k] && tutte[k].fine > ora()));
      if (via.length) { via.forEach(k => delete tutte[k]); await salvaVoci(tutte); }
      return { cancellate: via.length, restano: Object.keys(tutte).length };
    }
    /* La copia di sicurezza della cassaforte: le voci restano cifrate, e senza le chiavi non si leggono. */
    async function copiaCassaforte() {
      await pulisciCassaforte();
      return { nome: 'copia-cassaforte-' + new Date(ora()).toISOString().slice(0, 10) + '.json', testo: JSON.stringify({ tipo: TIPO_CASSAFORTE, v: VERSIONE, creato: new Date(ora()).toISOString(), voci: await voci() }, null, 1) + '\n' };
    }
    /* Riporta nella cassaforte le voci di una copia che queste chiavi sanno aprire e che non sono finite. */
    async function ripristinaCassaforte(testo) {
      const v = await attive();
      let c; try { c = JSON.parse(testo); } catch (e) { throw errore('file'); }
      if (!c || c.tipo !== TIPO_CASSAFORTE || c.v !== VERSIONE || !c.voci || typeof c.voci !== 'object') throw errore('file');
      const tutte = await voci(); let rientrate = 0, scartate = 0;
      for (const [id, x] of Object.entries(c.voci)) {
        try {
          if (!(x.fine > ora())) throw 0;
          await sub.decrypt({ name: 'AES-GCM', iv: daB64(x.iv), additionalData: testoInByte(id) }, v.chiavi.cassaforte, daB64(x.dati));
          tutte[id] = { iv: x.iv, dati: x.dati, fine: x.fine }; rientrate++;
        } catch (e) { scartate++; }
      }
      await salvaVoci(tutte);
      return { rientrate, scartate };
    }

    return { stato, genera, daCopia, copia, pubbliche, revoca, dimentica, avvisoRevoca, firma, verifica, nuovoId, viene, controllaTesto,
      cassaforte: { metti: mettiPassword, leggi: leggiPassword, togli: togliPassword, pulisci: pulisciCassaforte, copia: copiaCassaforte, ripristina: ripristinaCassaforte } };
  }

  return { VERSIONE, GIRI, FRASE_MIN, NOME_MAX, ID, TIPO_COPIA, TIPO_PUBBLICHE, TIPO_REVOCA, TIPO_CASSAFORTE, crea };
});

