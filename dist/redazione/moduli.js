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
    { nome: 'dl_nascosti', dove: 'memoria', forma: 'json', riga: 'nascosti',
      cosa: 'Gli eventi nascosti sbloccati con la loro password, fino a tre ore dopo la fine dell\'evento; la persona li può togliere prima (T-046)' },
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
    { nome: 'red_registro', dove: 'base', redazione: true,
      cosa: 'Il registro delle fonti sul dispositivo (fonti, righe degli eventi pubblicati, schede preparate), in una busta cifrata con la chiave del registro (T-041, T-043)' },
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
    /* La descrizione del luogo («Come arrivare») è sempre facoltativa, anche per un evento collocato a mano: decisione
       del 23/11/2026, eccezione consapevole al § 11.3, regola 2, del libro mastro (voce LM-62). */
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

/* Eventi nascosti: password, impronta e cifratura (voci T-045 e T-046 del piano di adeguamento; documento:
   docs/eventi-nascosti.md).

   Libro mastro, § 2.3: gli eventi nascosti sono pubblicati nell'archivio comune ma leggibili soltanto da chi ne conosce
   la password. La password è generata a caso dall'app della redazione e non è mai una frase prevedibile; il contenuto
   si cifra sul dispositivo della redazione con AES-256 e una chiave ricavata dalla password con un calcolo volutamente
   lento; lo sportello e Bunny ricevono un file già illeggibile, il cui nome è l'impronta della password, ottenuta con
   un calcolo diverso da quello della chiave. Il telefono di chi scrive la password calcola l'impronta, scarica il file
   e lo decifra. § 3.11 (cifratura sul dispositivo); allegato A, A.2, punto 10.

   La password (decisione del 25/11/2026): cinque parole italiane comuni pescate a caso dall'app della redazione da un
   elenco di 2048 (sorgenti/moduli/parole-nascosti.js, solo in quell'app), per esempio «nuvola tromba sedano faro
   lampo»: si ricorda e si passa a voce, ma è scelta a caso e nessuno la può indovinare (55 bit). Per l'impronta e per
   la chiave contano solo le lettere: maiuscole, accenti, spazi, trattini e altri segni non fanno differenza.

   Gli strumenti di cifratura sono soltanto quelli del browser (Web Crypto; in Node globalThis.crypto):
   - impronta: PBKDF2-SHA-256 con un sale fisso, 600.000 giri → 32 byte, scritti in 64 cifre esadecimali;
   - chiave: PBKDF2-SHA-256 con un sale casuale scritto nel file, 600.000 giri → AES-GCM a 256 bit, con l'impronta tra
     i dati autenticati, così un file non si può spostare sotto un altro nome.
   Il file pubblicato: {formato, versione, tdm-reservation, kdf: {nome, hash, giri, sale}, cifra: {nome, iv}, dati}.
   Dentro c'è un evento nel formato pubblico (docs/formato-eventi.md), che chi lo apre controlla con eventi.js.

   Nel browser si trova in window.AGR_MODULI.nascosti (dopo eventi.js); in Node con require(). */
(function (radice, fabbrica) {
  const nodo = typeof module === 'object' && module.exports && typeof require === 'function';
  const E = nodo ? require('./eventi.js') : (radice.AGR_MODULI || {}).eventi;
  const m = fabbrica(radice, E);
  if (nodo) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).nascosti = m;
})(typeof self !== 'undefined' ? self : this, function (radice, E) {
  'use strict';
  if (!E) throw new Error('nascosti.js: serve prima eventi.js');

  const VERSIONE = 1;
  const TIPO = 'evento-nascosto';
  const GIRI = 600000;              // giri di PBKDF2, per l'impronta e per la chiave (come la copia di riserva delle chiavi)
  const PAROLE = 5;                 // parole di una password
  const MIN_LETTERE = 20;           // § 2.3: almeno venti caratteri; una password più corta non si cerca nemmeno
  const DOMINIO_IMPRONTA = 'nascosti/impronta/v1';
  const MAX_DATI = 16000;           // caratteri del contenuto cifrato: un evento del formato pubblico ci sta largo
  const IMPRONTA = /^[0-9a-f]{64}$/;
  const GIORNO = /^(\d{4})-(\d{2})-(\d{2})$/;
  const B64 = /^[A-Za-z0-9_-]+$/;

  const cripto = c => c || radice.crypto || (typeof globalThis === 'object' ? globalThis.crypto : null);
  const byte = s => new TextEncoder().encode(String(s));
  function b64(b) { b = new Uint8Array(b); let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function daB64(s) { const t = atob(String(s).replace(/-/g, '+').replace(/_/g, '/')), b = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i); return b; }
  function errore(motivo) { const e = new Error('Evento nascosto, ' + motivo); e.motivo = motivo; return e; }

  /* Le lettere della password, le sole che contano: senza accenti, minuscole, senza spazi né altri segni. */
  const normalizza = t => String(t == null ? '' : t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
  /* La password come si mostra e si scrive: parole minuscole senza accenti, separate da uno spazio. */
  const forma = t => String(t == null ? '' : t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]+/g, ' ').trim();
  /* Abbastanza lunga da cercarla? (§ 2.3: almeno venti caratteri.) */
  const lunga = t => normalizza(t).length >= MIN_LETTERE;

  /* Cinque parole a caso dall'elenco, senza preferenze: un numero a caso per parola, scartando quelli che darebbero
     più peso alle prime parole dell'elenco. */
  function genera(elenco, c) {
    c = cripto(c);
    if (!Array.isArray(elenco) || elenco.length < 1024 || elenco.length > 65536) throw errore('elenco');
    const n = elenco.length, limite = Math.floor(65536 / n) * n, scelte = [];
    while (scelte.length < PAROLE) {
      const x = c.getRandomValues(new Uint16Array(1))[0];
      if (x < limite) scelte.push(elenco[x % n]);
    }
    return scelte.join(' ');
  }

  async function derivaBit(password, sale, giri, c) {
    const base = await c.subtle.importKey('raw', byte(normalizza(password)), 'PBKDF2', false, ['deriveBits']);
    return new Uint8Array(await c.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sale, iterations: giri }, base, 256));
  }
  async function chiave(password, sale, giri, c) {
    const base = await c.subtle.importKey('raw', byte(normalizza(password)), 'PBKDF2', false, ['deriveKey']);
    return c.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: sale, iterations: giri }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  /* L'impronta della password: il nome del file. Un numero che non permette di risalire alla password. */
  async function impronta(password, c) {
    c = cripto(c);
    if (!lunga(password)) throw errore('corta');
    return Array.from(await derivaBit(password, byte(DOMINIO_IMPRONTA), GIRI, c), x => x.toString(16).padStart(2, '0')).join('');
  }
  const aggiunti = imp => byte(TIPO + ':' + imp);

  /* Cifra un evento (formato pubblico) con la password: → {impronta, file}. */
  async function cifra(evento, password, c, giaImpronta) {
    c = cripto(c);
    const imp = giaImpronta || await impronta(password, c);
    if (!IMPRONTA.test(imp)) throw errore('impronta');
    const sale = c.getRandomValues(new Uint8Array(16)), iv = c.getRandomValues(new Uint8Array(12));
    const k = await chiave(password, sale, GIRI, c);
    const dati = b64(await c.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aggiunti(imp) }, k, byte(JSON.stringify(evento))));
    if (dati.length > MAX_DATI) throw errore('lungo');
    return { impronta: imp, file: { formato: TIPO, versione: VERSIONE, 'tdm-reservation': 1, kdf: { nome: 'PBKDF2', hash: 'SHA-256', giri: GIRI, sale: b64(sale) }, cifra: { nome: 'AES-GCM', iv: b64(iv) }, dati } };
  }

  /* La forma del file, senza aprirlo: lo usa anche lo sportello. → elenco degli errori, [] se va bene. */
  function controllaFile(f) {
    const err = [], solo = (o, k) => !!o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).length === k.length && k.every(x => Object.prototype.hasOwnProperty.call(o, x));
    if (!solo(f, ['formato', 'versione', 'tdm-reservation', 'kdf', 'cifra', 'dati'])) return ['file: campi diversi da quelli del formato'];
    if (f.formato !== TIPO || f.versione !== VERSIONE || f['tdm-reservation'] !== 1) err.push('file: formato o versione');
    if (!solo(f.kdf, ['nome', 'hash', 'giri', 'sale']) || f.kdf.nome !== 'PBKDF2' || f.kdf.hash !== 'SHA-256' || !Number.isInteger(f.kdf.giri) || f.kdf.giri < 100000 || f.kdf.giri > 5000000 ||
      typeof f.kdf.sale !== 'string' || !/^[A-Za-z0-9_-]{22}$/.test(f.kdf.sale)) err.push('file: kdf');
    if (!solo(f.cifra, ['nome', 'iv']) || f.cifra.nome !== 'AES-GCM' || typeof f.cifra.iv !== 'string' || !/^[A-Za-z0-9_-]{16}$/.test(f.cifra.iv)) err.push('file: cifra');
    if (typeof f.dati !== 'string' || !B64.test(f.dati) || f.dati.length < 24 || f.dati.length > MAX_DATI) err.push('file: dati');
    return err;
  }

  /* Apre un file con la password: → l'evento (ancora da controllare con eventi.js). Una password sbagliata o un file
     alterato danno lo stesso errore, «password». */
  async function decifra(f, password, c, giaImpronta) {
    c = cripto(c);
    if (typeof f === 'string') { try { f = JSON.parse(f); } catch (e) { throw errore('file'); } }
    if (controllaFile(f).length) throw errore('file');
    const imp = giaImpronta || await impronta(password, c);
    const k = await chiave(password, daB64(f.kdf.sale), f.kdf.giri, c);
    let chiaro;
    try { chiaro = await c.subtle.decrypt({ name: 'AES-GCM', iv: daB64(f.cifra.iv), additionalData: aggiunti(imp) }, k, daB64(f.dati)); }
    catch (e) { throw errore('password'); }
    try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(chiaro)); } catch (e) { throw errore('file'); }
  }

  /* Il giorno italiano (AAAA-MM-GG) di un momento. Lo sportello conosce soltanto il giorno in cui un evento nascosto esce
     dalla mappa (decisione del 25/11/2026) e toglie il file alla prima pubblicazione dopo la mezzanotte di quel giorno. */
  const FMT = typeof Intl === 'object' ? new Intl.DateTimeFormat('en-CA', { timeZone: E.FUSO, year: 'numeric', month: '2-digit', day: '2-digit' }) : null;
  function giornoDi(ms) { const p = {}; FMT.formatToParts(new Date(ms)).forEach(x => { p[x.type] = x.value; }); return p.year + '-' + p.month + '-' + p.day; }
  const giornoUscita = ev => { const u = E.uscitaMs(ev); return u == null ? null : giornoDi(u); };
  function giornoValido(g) { const m = typeof g === 'string' && g.match(GIORNO); if (!m) return false; const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return d.toISOString().slice(0, 10) === g; }
  /* Ancora da tenere nell'archivio al momento t? Fino alla fine del giorno di uscita, ora italiana. */
  const vivo = (giorno, t) => giornoValido(giorno) && giorno >= giornoDi(t);

  return { VERSIONE, TIPO, GIRI, PAROLE, MIN_LETTERE, IMPRONTA, MAX_DATI, normalizza, forma, lunga, genera, impronta, cifra, decifra, controllaFile, giornoDi, giornoUscita, giornoValido, vivo };
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
  /* Le uscite di una regione (LM-46): l'indice si scrive quando la Redazione pubblica, ma gli eventi escono dalla mappa
     anche tra una pubblicazione e l'altra. Per questo accanto al numero di ogni regione l'indice dice quanti eventi
     escono e quando: coppie [minuto, quanti], con il minuto contato dal 1970 in tempo universale, in ordine. Chi legge
     toglie dal numero quelli già usciti (eventiVivi). Sono soltanto numeri: non dicono quali eventi. */
  const MINUTO = 6e4;
  function eventiVivi(r, adesso) {
    let n = r.eventi;
    for (const u of r.uscite || []) { if (u[0] * MINUTO > adesso) break; n -= u[1]; }
    return Math.max(0, n);
  }
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
    const per = {}, conta = {}, perRegione = {}, escono = {}, visti = new Set();
    for (const ev of eventi) {
      const err = E.controlla(ev, opz.vocabolario ? { vocabolario: opz.vocabolario } : undefined);
      if (err.length) throw new Error('evento ' + (ev && ev.id) + ' non valido: ' + err.join('; '));
      if (visti.has(ev.id)) throw new Error('identificativo ripetuto: ' + ev.id); visti.add(ev.id);
      if (E.uscitaMs(ev) <= adesso) continue;
      const q = quadrante(ev.lat, ev.lng); if (!q) throw new Error('evento ' + ev.id + ' fuori dalla griglia');
      (per[q] = per[q] || []).push(ev);
      const reg = regione(ev.lat, ev.lng, regioni);
      if (reg) {
        conta[reg] = (conta[reg] || 0) + 1; ((perRegione[reg] = perRegione[reg] || {})[q] = perRegione[reg][q] || []).push(ev);
        const m = Math.round(E.uscitaMs(ev) / MINUTO); (escono[reg] = escono[reg] || {})[m] = (escono[reg][m] || 0) + 1;
      }
    }
    const file = {}, quadranti = {};
    for (const q of Object.keys(per).sort()) {
      const lista = per[q].sort((x, y) => E.istante(x.inizio) - E.istante(y.inizio) || (x.id < y.id ? -1 : 1));
      const testo = testoQuadrante(q, lista), v = impronta(testo), f = cartella + q + '-' + v + '.json';
      file[f] = testo; quadranti[q] = { file: f, v, eventi: lista.length };
    }
    const indice = { formato: 'eventi-indice', versione: E.FORMATO, 'tdm-reservation': 1, generato: new Date(adesso).toISOString().slice(0, 19) + 'Z',
      griglia: GRIGLIA, quadranti,
      regioni: regioni.filter(r => conta[r.nome]).map(r => ({ nome: r.nome, punto: r.punto, eventi: conta[r.nome], vai: vai(perRegione[r.nome]),
        uscite: Object.keys(escono[r.nome]).map(Number).sort((x, y) => x - y).map(m => [m, escono[r.nome][m]]) })) };
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
      else if (!usciteValide(r)) err.push('indice: uscite non valide per ' + r.nome);
    }
    return err;
  }
  /* Le uscite di una regione: coppie [minuto, quanti] in ordine di minuto, che in tutto fanno il numero della regione. */
  function usciteValide(r) {
    if (!Array.isArray(r.uscite)) return false;
    let somma = 0, prima = -1;
    for (const u of r.uscite) {
      if (!Array.isArray(u) || u.length !== 2 || !Number.isSafeInteger(u[0]) || !Number.isInteger(u[1]) || u[1] < 1 || u[0] <= prima) return false;
      prima = u[0]; somma += u[1];
    }
    return somma === r.eventi;
  }
  /* Gli eventi di un file di quadrante: solo quelli validi e che stanno davvero in quel quadrante. */
  function eventiDelQuadrante(j, id, opz) {
    if (!j || j.formato !== 'eventi-quadrante' || j.versione !== E.FORMATO || j.quadrante !== id || !Array.isArray(j.eventi)) return { eventi: [], scartati: -1 };
    const eventi = j.eventi.filter(ev => E.valido(ev, opz) && quadrante(ev.lat, ev.lng) === id);
    return { eventi, scartati: j.eventi.length - eventi.length };
  }

  return { GRIGLIA, quadrante, confini, intorno, regione, impronta, costruisci, controllaIndice, eventiDelQuadrante, eventiVivi };
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

  const TRENTA_MINUTI = 30 * 6e4, CINQUE_SECONDI = 5000;
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
      const servono = () => ids.filter(q => S.indice.quadranti[q] && (!S.caricati.has(q) || S.caricati.get(q).v !== S.indice.quadranti[q].v));
      let esiti = await Promise.all(servono().map(scarica));
      /* Un file che non arriva può voler dire che l'archivio è cambiato dopo l'ultimo controllo (lo sportello toglie
         subito i file che l'indice nuovo non nomina): si richiede l'indice, una volta, e si riprova. */
      if (esiti.includes(false) && adesso() - S.ultimoControllo > CINQUE_SECONDI) {
        const cambiato = await controllaNovita();
        esiti = esiti.concat([cambiato], await Promise.all(servono().map(scarica)));
      }
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
      /* I numeri per regione, tolti gli eventi usciti dalla mappa dopo l'ultima pubblicazione (LM-46): l'indice dice
         quanti escono e quando, il conto lo fa il telefono. Una regione rimasta senza eventi non si mostra. */
      regioni: () => (S.indice ? S.indice.regioni.map(r => Object.assign({}, r, { eventi: Q.eventiVivi(r, adesso()) })).filter(r => r.eventi > 0) : []),
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
    TIPO_REVOCA = 'revoca-chiave-redazione', TIPO_CASSAFORTE = 'copia-cassaforte-redazione', TIPO_REGISTRO = 'registro-fonti-redazione';

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

    /* ---------- Registro delle fonti: la sua chiave cifra e non fa altro (T-041, T-043; cap. 22; § 3.11) ----------
       cifra(testo) → busta {tipo, v, iv, dati}; decifra(busta) → il testo. Una busta scritta con un'altra chiave, o
       rovinata, dà l'errore «registro»: non si legge a pezzi. La busta è ciò che resta sul dispositivo e ciò che si
       deposita nell'archivio riservato: chi la trova senza la chiave del registro non ne ricava nulla. */
    async function cifraRegistro(testo) {
      const v = await attive();
      if (typeof testo !== 'string') throw errore('registro');
      const iv = casuali(12);
      return { tipo: TIPO_REGISTRO, v: VERSIONE, iv: b64(iv),
        dati: b64(await sub.encrypt({ name: 'AES-GCM', iv, additionalData: testoInByte(TIPO_REGISTRO) }, v.chiavi.registro, testoInByte(testo))) };
    }
    async function decifraRegistro(busta) {
      const v = await attive();
      if (!busta || busta.tipo !== TIPO_REGISTRO || typeof busta.iv !== 'string' || typeof busta.dati !== 'string') throw errore('registro');
      try { return byteInTesto(await sub.decrypt({ name: 'AES-GCM', iv: daB64(busta.iv), additionalData: testoInByte(TIPO_REGISTRO) }, v.chiavi.registro, daB64(busta.dati))); }
      catch (e) { throw errore('registro'); }
    }
    /* La voce «red_registro» del dispositivo: la busta del registro. leggi() dà il testo, o null se il registro non è
       ancora nato; scrivi(testo) lo cifra e lo conserva, e restituisce la busta; busta() dà la busta così com'è, per
       depositarla nell'archivio riservato. */
    async function leggiRegistro() { await attive(); const b = await dep.leggi('red_registro'); return b ? decifraRegistro(b) : null; }
    async function scriviRegistro(testo) { const b = await cifraRegistro(testo); await dep.scrivi('red_registro', b); return b; }
    async function bustaRegistro() { return (await dep.leggi('red_registro')) || null; }

    return { stato, genera, daCopia, copia, pubbliche, revoca, dimentica, avvisoRevoca, firma, verifica, nuovoId, viene, controllaTesto,
      registro: { cifra: cifraRegistro, decifra: decifraRegistro, leggi: leggiRegistro, scrivi: scriviRegistro, busta: bustaRegistro },
      cassaforte: { metti: mettiPassword, leggi: leggiPassword, togli: togliPassword, pulisci: pulisciCassaforte, copia: copiaCassaforte, ripristina: ripristinaCassaforte } };
  }

  return { VERSIONE, GIRI, FRASE_MIN, NOME_MAX, ID, TIPO_COPIA, TIPO_PUBBLICHE, TIPO_REVOCA, TIPO_CASSAFORTE, TIPO_REGISTRO, crea };
});

/* Il pacchetto firmato della Redazione (voce T-038 del piano di adeguamento; documento: docs/sportello-pubblicazione.md).

   Libro mastro, § 2.4 («La pubblicazione firmata»): gli eventi si scrivono nell'archivio da una sola porta, lo sportello,
   che accetta un pacchetto soltanto se porta la firma crittografica della Redazione; la firma comprende data e ora,
   sicché un pacchetto intercettato non può essere rispedito più tardi. § 3.11: pubblicazione solo con la firma.

   Questo modulo è scritto una volta sola e lo usano tutti e due i lati: l'app della redazione forma il pacchetto, lo
   sportello (sportelli/pubblicazione.js) lo legge e ne verifica la firma. Un pacchetto è fatto così:

     { tipo, v, quando, numero, dispositivo: { nome, impronta }, contenuto, firma }

   - quando: data e ora in cui è stato firmato (tempo universale);
   - numero: un numero unico, a caso, che lo sportello accetta una volta sola;
   - dispositivo: il nome del dispositivo della redazione e l'impronta della sua chiave di firma;
   - contenuto: che cosa si chiede allo sportello, scritto come testo (JSON): così ciò che si firma è esattamente ciò
     che viaggia, lettera per lettera;
   - firma: la firma di tutto il resto, fatta con la chiave di firma del dispositivo (ECDSA P-256 con SHA-256).

   Il modulo non contiene chiavi e non ne conserva: chi forma il pacchetto gli passa la funzione che firma.
   Nel browser si trova in window.AGR_MODULI.pacchetto; in Node (prove, sportello) con require(). */
(function (radice, fabbrica) {
  const m = fabbrica(radice);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).pacchetto = m;
})(typeof self !== 'undefined' ? self : this, function (radice) {
  'use strict';

  const TIPO = 'pacchetto-redazione', VERSIONE = 1;
  const FINESTRA_MS = 5 * 6e4;          // un pacchetto vale cinque minuti prima o dopo l'ora dello sportello (decisione del 23/11/2026)
  const MAX_CARATTERI = 2e6;            // un pacchetto più lungo non si legge nemmeno
  /* Che cosa si può chiedere: «scrivi» (pubblicare, correggere, sospendere, riattivare, ritirare), «ripristina» (una
     copia dello storico), e quattro letture riservate alla Redazione: «stato», «storico», «copia» e, dal blocco 10,
     «registro» (le buste del registro delle fonti, che lo sportello non sa aprire: T-043). */
  const OPERAZIONI = ['scrivi', 'ripristina', 'stato', 'storico', 'copia', 'registro'];
  const IMPRONTA = /^[0-9a-f]{4}( [0-9a-f]{4}){3}$/, NUMERO = /^[0-9a-f]{32}$/, B64 = /^[A-Za-z0-9_-]+$/;
  const QUANDO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

  function errore(motivo, dettaglio) { const e = new Error('Pacchetto della Redazione, ' + motivo + (dettaglio ? ' (' + dettaglio + ')' : '')); e.motivo = motivo; return e; }
  const cripto = c => c || radice.crypto || (typeof globalThis === 'object' ? globalThis.crypto : null);
  const testoInByte = s => new TextEncoder().encode(String(s));
  function daB64(s) {
    const t = atob(s.replace(/-/g, '+').replace(/_/g, '/')), b = new Uint8Array(t.length);
    for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i);
    return b;
  }
  const esadecimale = b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');

  /* L'impronta di una chiave pubblica di firma: la stessa che mostra la schermata «Chiavi» (sorgenti/moduli/chiavi.js). */
  async function impronta(pubblica, c) {
    const h = esadecimale(await cripto(c).subtle.digest('SHA-256', daB64(pubblica))).slice(0, 16);
    return h.replace(/(.{4})(?=.)/g, '$1 ');
  }

  /* Il testo che si firma: tutto il pacchetto tranne la firma, in un ordine fisso. */
  const daFirmare = p => JSON.stringify([p.tipo, p.v, p.quando, p.numero, p.dispositivo.nome, p.dispositivo.impronta, p.contenuto]);

  /* forma(contenuto, {firma, dispositivo, ora, cripto}) → il pacchetto firmato.
     contenuto: un oggetto con «operazione»; firma: funzione che firma un testo con la chiave del dispositivo (CHIAVI.firma);
     dispositivo: {nome, impronta}; ora: l'orologio (nelle prove, finto). */
  async function forma(contenuto, o) {
    if (!contenuto || !OPERAZIONI.includes(contenuto.operazione)) throw errore('operazione');
    if (!o || typeof o.firma !== 'function' || !o.dispositivo || !IMPRONTA.test(o.dispositivo.impronta || '')) throw errore('dispositivo');
    const p = { tipo: TIPO, v: VERSIONE, quando: new Date((o.ora || Date.now)()).toISOString(),
      numero: esadecimale(cripto(o.cripto).getRandomValues(new Uint8Array(16))),
      dispositivo: { nome: String(o.dispositivo.nome || ''), impronta: o.dispositivo.impronta }, contenuto: JSON.stringify(contenuto) };
    p.firma = await o.firma(daFirmare(p));
    if (JSON.stringify(p).length > MAX_CARATTERI) throw errore('lungo');
    return p;
  }

  /* leggi(testo o oggetto) → {pacchetto, contenuto}. Controlla soltanto la forma: la firma la verifica «verifica».
     Un pacchetto che non ha questa forma fa nascere un errore con motivo «forma». */
  function leggi(x) {
    let p = x;
    if (typeof x === 'string') {
      if (x.length > MAX_CARATTERI) throw errore('forma', 'troppo lungo');
      try { p = JSON.parse(x); } catch (e) { throw errore('forma', 'non è JSON'); }
    }
    const d = p && p.dispositivo;
    if (!p || typeof p !== 'object' || p.tipo !== TIPO || p.v !== VERSIONE || typeof p.quando !== 'string' || !QUANDO.test(p.quando) || !Number.isFinite(Date.parse(p.quando)) ||
      typeof p.numero !== 'string' || !NUMERO.test(p.numero) || !d || typeof d !== 'object' || typeof d.nome !== 'string' || d.nome.length > 80 ||
      typeof d.impronta !== 'string' || !IMPRONTA.test(d.impronta) || typeof p.contenuto !== 'string' || typeof p.firma !== 'string' || !B64.test(p.firma) || p.firma.length > 200 ||
      Object.keys(p).some(k => !['tipo', 'v', 'quando', 'numero', 'dispositivo', 'contenuto', 'firma'].includes(k)) || Object.keys(d).some(k => k !== 'nome' && k !== 'impronta'))
      throw errore('forma');
    let contenuto; try { contenuto = JSON.parse(p.contenuto); } catch (e) { throw errore('forma', 'contenuto'); }
    if (!contenuto || typeof contenuto !== 'object' || Array.isArray(contenuto) || !OPERAZIONI.includes(contenuto.operazione)) throw errore('forma', 'operazione');
    return { pacchetto: p, contenuto };
  }

  /* verifica(pacchetto, pubblica) → true se la firma è quella della chiave pubblica data (in base64 per indirizzi). */
  async function verifica(p, pubblica, c) {
    try {
      const k = await cripto(c).subtle.importKey('raw', daB64(pubblica), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      return await cripto(c).subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, daB64(p.firma), testoInByte(daFirmare(p)));
    } catch (e) { return false; }
  }

  return { TIPO, VERSIONE, FINESTRA_MS, MAX_CARATTERI, OPERAZIONI, IMPRONTA, forma, leggi, verifica, impronta, daFirmare };
});

/* File Excel letti e scritti dall'app della redazione, senza librerie di terzi (voce T-042 del piano di adeguamento;
   decisione del 24/11/2026: codice nostro al posto di SheetJS 0.18.5, che aveva difetti di sicurezza noti).

   Un file .xlsx è un archivio ZIP di testi XML. Il modulo:
   - leggi(dati, nome) → {fogli: [{nome, righe}]}: legge i fogli di un .xlsx (testi condivisi, testi scritti nella
     cella, numeri, vero/falso) oppure un .csv (separatore «;», «,» o tabulazione, scelto dalla prima riga). Le date
     restano numeri di serie di Excel: chi legge le trasforma (leggiData e leggiOra degli strumenti della redazione).
     Formule: si legge il valore calcolato che il file porta con sé, mai la formula;
   - scrivi(fogli) → i byte di un .xlsx: fogli = [[nome, righe, larghezze, opzioni]]; nelle righe testi, numeri,
     vero/falso, date (oggetti Date, scritti come gg/mm/aaaa) e date con l'ora ({data: Date, ora: true}, scritte come
     gg/mm/aaaa hh:mm). La riga delle intestazioni è in grassetto e resta ferma in cima: di solito è la prima;
     opzioni.testa dice quale è, contando da 0, quando sopra ci sono il titolo e il sottotitolo del foglio, come nei
     registri del cap. 18 del libro mastro (intestazioni alla riga 4). I testi si scrivono sempre come testo: in un
     .xlsx una cella di testo non diventa mai una formula.
   Il file letto non si conserva: il modulo restituisce le righe e basta.

   Difese contro i file costruiti per far danni: al più 20 MB di file e 60 MB di testo una volta aperto (un archivio
   che si gonfia oltre si ferma a metà); al più 10.000 righe e 200 colonne per foglio; solo i metodi di compressione
   «nessuna» e «deflate»; nessuna entità XML esterna (l'XML si legge con espressioni semplici, non con un lettore che
   le risolverebbe). Un file che non rispetta la forma dà l'errore con motivo «file»; un file .xlsx salvato con una
   password (che i programmi chiudono in un contenitore cifrato, non in uno ZIP) dà l'errore con motivo «protetto».

   Gli indirizzi «schemas.openxmlformats.org» che si leggono qui sotto sono i nomi del formato che ogni file .xlsx deve
   portare dentro di sé: nessuno li chiede alla rete (prove/indirizzi.js li ammette per questo solo file).

   Nel browser si trova in window.AGR_MODULI.excel, dopo testo.js; in Node (prove) con require(). Usa
   DecompressionStream, che hanno i browser recenti e Node dalla versione 18. */
(function (radice, fabbrica) {
  const nodo = typeof module === 'object' && module.exports && typeof require === 'function';
  const m = fabbrica(nodo ? require('./testo.js') : (radice.AGR_MODULI || {}).testo);
  if (nodo) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).excel = m;
})(typeof self !== 'undefined' ? self : this, function (T) {
  'use strict';
  if (!T || typeof T.esc !== 'function') throw new Error('excel: serve prima testo.js');
  const MAX_FILE = 20e6, MAX_APERTO = 60e6, MAX_RIGHE = 10000, MAX_COLONNE = 200, MAX_FOGLI = 50;
  const MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  function errore(motivo, dettaglio) { const e = new Error('Excel, ' + motivo + (dettaglio ? ' (' + dettaglio + ')' : '')); e.motivo = motivo; return e; }
  const byte = d => d instanceof Uint8Array ? d : d instanceof ArrayBuffer ? new Uint8Array(d) : ArrayBuffer.isView(d) ? new Uint8Array(d.buffer, d.byteOffset, d.byteLength) : null;
  const u16 = (b, i) => b[i] | (b[i + 1] << 8), u32 = (b, i) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;

  /* ---------- CRC-32 (per scrivere lo ZIP) ---------- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

  /* ---------- Leggere lo ZIP ---------- */
  async function gonfia(dati, resta) {
    if (typeof DecompressionStream !== 'function') throw errore('browser', 'manca DecompressionStream');
    const ds = new DecompressionStream('deflate-raw'), w = ds.writable.getWriter(), r = ds.readable.getReader(), pezzi = [];
    w.write(dati).catch(() => {}); w.close().catch(() => {});
    let n = 0;
    for (;;) {
      let x; try { x = await r.read(); } catch (e) { throw errore('file', 'compressione rovinata'); }
      if (x.done) break;
      n += x.value.length;
      if (n > resta) { r.cancel().catch(() => {}); throw errore('file', 'troppo grande una volta aperto'); }
      pezzi.push(x.value);
    }
    const out = new Uint8Array(n); let k = 0; for (const p of pezzi) { out.set(p, k); k += p.length; }
    return out;
  }
  /* → Map nome → funzione che dà i byte; si apre solo ciò che serve */
  function zip(b) {
    if (b.length < 22 || b.length > MAX_FILE) throw errore('file', b.length > MAX_FILE ? 'oltre 20 MB' : 'troppo corto');
    let e = -1; for (let i = b.length - 22; i >= Math.max(0, b.length - 22 - 65535); i--) if (u32(b, i) === 0x06054b50) { e = i; break; }
    if (e < 0) throw errore('file', 'non è un archivio ZIP');
    const n = u16(b, e + 10), dir = u32(b, e + 16), voci = new Map();
    let aperto = 0;
    for (let i = 0, p = dir; i < n; i++) {
      if (p + 46 > b.length || u32(b, p) !== 0x02014b50) throw errore('file', 'indice dello ZIP rovinato');
      const metodo = u16(b, p + 10), compresso = u32(b, p + 20), pieno = u32(b, p + 24), ln = u16(b, p + 28), lx = u16(b, p + 30), lc = u16(b, p + 32), loc = u32(b, p + 42);
      const nome = new TextDecoder().decode(b.subarray(p + 46, p + 46 + ln));
      p += 46 + ln + lx + lc;
      voci.set(nome, async () => {
        if (loc + 30 > b.length || u32(b, loc) !== 0x04034b50) throw errore('file', 'voce dello ZIP rovinata');
        const ini = loc + 30 + u16(b, loc + 26) + u16(b, loc + 28), dati = b.subarray(ini, ini + compresso);
        if (dati.length !== compresso) throw errore('file', 'voce dello ZIP tagliata');
        const resta = MAX_APERTO - aperto;
        let out;
        if (metodo === 0) { if (compresso > resta) throw errore('file', 'troppo grande una volta aperto'); out = dati.slice(); }
        else if (metodo === 8) out = await gonfia(dati, Math.min(resta, pieno ? pieno + 1024 : resta));
        else throw errore('file', 'compressione non prevista');
        aperto += out.length;
        return out;
      });
    }
    return voci;
  }

  /* ---------- XML: le poche cose che servono, senza un lettore XML ---------- */
  const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  const daXml = s => s.replace(/&(#x[0-9a-fA-F]{1,6}|#\d{1,7}|amp|lt|gt|quot|apos);/g, (_, x) => {
    if (x[0] !== '#') return ENT[x];
    const c = x[1] === 'x' ? parseInt(x.slice(2), 16) : parseInt(x.slice(1), 10);
    return c > 0 && c <= 0x10FFFF && !(c >= 0xD800 && c <= 0xDFFF) ? String.fromCodePoint(c) : '';
  }).replace(/_x([0-9A-Fa-f]{4})_/g, (_, h) => String.fromCharCode(parseInt(h, 16)));   // i caratteri che Excel scrive come _x000D_
  const attributo = (tag, nome) => { const m = tag.match(new RegExp('\\s' + nome + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')')); return m ? daXml(m[2] != null ? m[2] : m[3]) : null; };
  /* il testo di un <si> o di un <is>: tutti i <t>, tranne quelli della pronuncia (<rPh>) */
  const testiT = x => [...x.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)].map(m => daXml(m[1])).join('');
  const colonna = lettere => { let n = 0; for (const ch of lettere) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };

  async function leggiXlsx(b) {
    const v = zip(b), testo = async nome => { const f = v.get(nome); return f ? new TextDecoder().decode(await f()) : null; };
    const wb = await testo('xl/workbook.xml'); if (wb == null) throw errore('file', 'manca il foglio di lavoro');
    const rels = (await testo('xl/_rels/workbook.xml.rels')) || '', dove = {};
    for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) { const id = attributo(m[0], 'Id'), t = attributo(m[0], 'Target'); if (id && t) dove[id] = t.startsWith('/') ? t.slice(1) : 'xl/' + t.replace(/^\.\//, ''); }
    const comuni = [], ss = await testo('xl/sharedStrings.xml');
    if (ss) for (const m of ss.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>|<si\b[^>]*\/>/g)) comuni.push(m[1] ? testiT(m[1]) : '');
    const fogli = [];
    for (const m of [...wb.matchAll(/<sheet\b[^>]*\/?>/g)].slice(0, MAX_FOGLI)) {
      const nome = attributo(m[0], 'name') || '', id = attributo(m[0], 'r:id'), xml = id && dove[id] ? await testo(dove[id]) : null;
      if (xml == null) continue;
      const righe = []; let ultima = -1;
      for (const r of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
        const nr = attributo(r[0].slice(0, r[0].indexOf('>') + 1), 'r'), i = nr ? parseInt(nr, 10) - 1 : ultima + 1;
        if (!(i >= 0) || i >= MAX_RIGHE) { if (i >= MAX_RIGHE) throw errore('righe', 'oltre ' + MAX_RIGHE + ' righe'); continue; }
        ultima = i; const riga = []; let uc = -1;
        for (const c of (r[2] || '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
          const ref = attributo(' ' + c[1], 'r'), t = attributo(' ' + c[1], 't') || 'n', dentro = c[2] || '';
          const j = ref && /^[A-Z]{1,3}\d+$/.test(ref) ? colonna(ref.match(/^[A-Z]+/)[0]) : uc + 1; uc = j;
          if (j >= MAX_COLONNE) continue;
          const vv = (dentro.match(/<v>([^<]*)<\/v>/) || [])[1];
          let x = '';
          if (t === 's') x = vv != null ? (comuni[parseInt(vv, 10)] ?? '') : '';
          else if (t === 'inlineStr') { const is = dentro.match(/<is>([\s\S]*?)<\/is>/); x = is ? testiT(is[1]) : ''; }
          else if (t === 'str' || t === 'd') x = vv != null ? daXml(vv) : '';
          else if (t === 'b') x = vv === '1';
          else if (t === 'e') x = '';
          else if (vv != null && vv.trim() !== '') { const n = Number(vv); x = Number.isFinite(n) ? n : daXml(vv); }
          riga[j] = x;
        }
        for (let k = 0; k < riga.length; k++) if (riga[k] === undefined) riga[k] = '';
        righe[i] = riga;
      }
      for (let k = 0; k < righe.length; k++) if (!righe[k]) righe[k] = [];
      fogli.push({ nome, righe });
    }
    if (!fogli.length) throw errore('file', 'nessun foglio');
    return { fogli };
  }

  /* ---------- CSV ---------- */
  function leggiCsv(testo) {
    testo = String(testo).replace(/^\uFEFF/, '');
    const prima = testo.split(/\r?\n/, 1)[0] || '', conta = s => prima.split(s).length;
    const sep = [';', ',', '\t'].reduce((a, s) => conta(s) > conta(a) ? s : a, ';');
    const righe = []; let riga = [], cella = '', q = false;
    for (let i = 0; i < testo.length; i++) {
      const ch = testo[i];
      if (q) { if (ch === '"') { if (testo[i + 1] === '"') { cella += '"'; i++; } else q = false; } else cella += ch; continue; }
      if (ch === '"' && cella === '') q = true;
      else if (ch === sep) { riga.push(cella); cella = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && testo[i + 1] === '\n') i++; riga.push(cella); righe.push(riga); riga = []; cella = ''; if (righe.length > MAX_RIGHE) throw errore('righe', 'oltre ' + MAX_RIGHE + ' righe'); }
      else cella += ch;
    }
    if (cella !== '' || riga.length) { riga.push(cella); righe.push(riga); }
    return righe.map(r => r.slice(0, MAX_COLONNE));
  }

  async function leggi(dati, nome) {
    const b = byte(dati); if (!b) throw errore('file', 'dati mancanti');
    if (b.length > MAX_FILE) throw errore('file', 'oltre 20 MB');
    /* un file salvato con una password: il contenitore cifrato dei programmi per ufficio, non uno ZIP */
    if (b.length >= 8 && b[0] === 0xD0 && b[1] === 0xCF && b[2] === 0x11 && b[3] === 0xE0 && b[4] === 0xA1 && b[5] === 0xB1 && b[6] === 0x1A && b[7] === 0xE1 && !/\.csv$/i.test(nome || '')) throw errore('protetto', 'il file si apre con una password');
    if (/\.csv$/i.test(nome || '') || !(b[0] === 0x50 && b[1] === 0x4B)) {
      if (!/\.csv$/i.test(nome || '') && /\.(xlsx|xlsm|ods|xls)$/i.test(nome || '')) throw errore('formato', 'non è un file .xlsx');
      return { fogli: [{ nome: 'csv', righe: leggiCsv(new TextDecoder().decode(b)) }] };
    }
    return leggiXlsx(b);
  }

  /* ---------- Scrivere ---------- */
  /* un testo dentro l'XML: tolti i caratteri che l'XML non ammette, protetto «_x…_» come lo scrive Excel, e i caratteri
     speciali protetti dall'unica funzione dell'app che lo fa (testo.js, T-024) */
  const aXml = s => T.esc(String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '').replace(/_x([0-9A-Fa-f]{4})_/g, '_x005F_x$1_'));
  const lettere = j => { let s = ''; j++; while (j > 0) { const r = (j - 1) % 26; s = String.fromCharCode(65 + r) + s; j = Math.floor((j - 1) / 26); } return s; };
  /* il numero di serie di Excel di un giorno (solo la data, senza fuso: 0 = 30/12/1899) */
  const numeroData = d => (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(1899, 11, 30)) / 864e5;
  /* lo stesso con l'ora del dispositivo, al minuto (la parte dopo la virgola sono le ore del giorno) */
  const numeroDataOra = d => (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()) - Date.UTC(1899, 11, 30)) / 864e5;
  function foglioXml(righe, larghezze, testa) {
    testa = Number.isInteger(testa) && testa >= 0 ? testa : 0;
    const cols = (larghezze || []).length ? '<cols>' + larghezze.map((w, j) => `<col min="${j + 1}" max="${j + 1}" width="${Math.max(1, Math.min(255, +w || 10))}" customWidth="1"/>`).join('') + '</cols>' : '';
    const dati = righe.map((r, i) => `<row r="${i + 1}">` + (r || []).map((c, j) => {
      const ref = lettere(j) + (i + 1), st = i === 0 || i === testa ? ' s="2"' : '';
      if (c === null || c === undefined || c === '') return '';
      if (c instanceof Date) return isNaN(c) ? '' : `<c r="${ref}" s="1"><v>${numeroData(c)}</v></c>`;
      if (typeof c === 'object' && c.data instanceof Date) return isNaN(c.data) ? '' : c.ora ? `<c r="${ref}" s="3"><v>${numeroDataOra(c.data)}</v></c>` : `<c r="${ref}" s="1"><v>${numeroData(c.data)}</v></c>`;
      if (typeof c === 'object') return '';
      if (typeof c === 'number') return Number.isFinite(c) ? `<c r="${ref}"${st}><v>${c}</v></c>` : '';
      if (typeof c === 'boolean') return `<c r="${ref}" t="b"${st}><v>${c ? 1 : 0}</v></c>`;
      return `<c r="${ref}" t="inlineStr"${st}><is><t xml:space="preserve">${aXml(c)}</t></is></c>`;
    }).join('') + '</row>').join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      + `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${testa + 1}" topLeftCell="A${testa + 2}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
      + cols + '<sheetData>' + dati + '</sheetData></worksheet>';
  }
  function zipScrivi(voci) {
    const enc = new TextEncoder(), locali = [], centrali = []; let off = 0;
    const d = new Date(), tempo = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), giorno = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (const [nome, testo] of voci) {
      const n = enc.encode(nome), dati = enc.encode(testo), c = crc32(dati);
      const h = new Uint8Array(30 + n.length), v = new DataView(h.buffer);
      v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(6, 0x0800, true); v.setUint16(8, 0, true); v.setUint16(10, tempo, true); v.setUint16(12, giorno, true);
      v.setUint32(14, c, true); v.setUint32(18, dati.length, true); v.setUint32(22, dati.length, true); v.setUint16(26, n.length, true); v.setUint16(28, 0, true); h.set(n, 30);
      const k = new Uint8Array(46 + n.length), w = new DataView(k.buffer);
      w.setUint32(0, 0x02014b50, true); w.setUint16(4, 20, true); w.setUint16(6, 20, true); w.setUint16(8, 0x0800, true); w.setUint16(10, 0, true); w.setUint16(12, tempo, true); w.setUint16(14, giorno, true);
      w.setUint32(16, c, true); w.setUint32(20, dati.length, true); w.setUint32(24, dati.length, true); w.setUint16(28, n.length, true); w.setUint32(42, off, true); k.set(n, 46);
      locali.push(h, dati); centrali.push(k); off += h.length + dati.length;
    }
    const lc = centrali.reduce((s, x) => s + x.length, 0), e = new Uint8Array(22), z = new DataView(e.buffer);
    z.setUint32(0, 0x06054b50, true); z.setUint16(8, voci.length, true); z.setUint16(10, voci.length, true); z.setUint32(12, lc, true); z.setUint32(16, off, true);
    const tutti = locali.concat(centrali, [e]), out = new Uint8Array(tutti.reduce((s, x) => s + x.length, 0)); let p = 0;
    for (const x of tutti) { out.set(x, p); p += x.length; }
    return out;
  }
  function scrivi(fogli) {
    if (!Array.isArray(fogli) || !fogli.length) throw errore('fogli');
    const nomi = [], visti = new Set();
    fogli.forEach(([n], i) => { let s = String(n || 'Foglio ' + (i + 1)).replace(/[\[\]:*?/\\]/g, ' ').slice(0, 31).trim() || 'Foglio ' + (i + 1);
      while (visti.has(s.toLowerCase())) s = s.slice(0, 28) + ' ' + (i + 1); visti.add(s.toLowerCase()); nomi.push(s); });
    const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    const voci = [
      ['[Content_Types].xml', X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'
        + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        + nomi.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') + '</Types>'],
      ['_rels/.rels', X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', X + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
        + nomi.map((n, i) => `<sheet name="${aXml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + nomi.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')
        + `<Relationship Id="rId${nomi.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
      ['xl/styles.xml', X + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy hh:mm"/></numFmts>'
        + '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
        + '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders>'
        + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        + '<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
        + '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>']
    ].concat(fogli.map(([, righe, larghezze, opz], i) => [`xl/worksheets/sheet${i + 1}.xml`, foglioXml(righe || [], larghezze, (opz || {}).testa)]));
    return zipScrivi(voci);
  }

  return { MAX_FILE, MAX_RIGHE, MAX_COLONNE, MIME, leggi, leggiCsv, scrivi, numeroData, numeroDataOra, crc32 };
});

/* Le parole delle password degli eventi nascosti (voce T-045 del piano di adeguamento; decisione del 25/11/2026;
   documento: docs/eventi-nascosti.md). Entra soltanto nell'app della redazione, che genera le password: l'app pubblica
   non ne ha bisogno, perché per lo sblocco contano solo le lettere (sorgenti/moduli/nascosti.js).

   2048 parole italiane comuni, di 3-10 lettere, senza accenti, tutte diverse: animali, piante, cibi, oggetti, luoghi,
   musica, colori, verbi. Una password ne prende cinque a caso (2048 alla quinta: circa 55 bit, impossibile da
   indovinare con il calcolo lento dell'impronta). Sono state tolte le parole con doppi sensi volgari od offensivi, quelle
   legate a politica, religione, violenza o salute, e quelle che si confondono con i nomi dell'app (mappa, fonte,
   registro, chiave). L'elenco non si cambia alla leggera: le password già date restano valide comunque, perché per lo
   sblocco contano solo le lettere, ma la prova prove/nascosti.js controlla che le parole siano 2048 e tutte diverse.

   Nel browser si trova in window.AGR_MODULI.paroleNascosti; in Node con require(). */
(function (radice, fabbrica) {
  const m = fabbrica();
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).paroleNascosti = m;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return Object.freeze([
    'ape', 'aquila', 'airone', 'alce', 'allodola', 'alpaca', 'anatra', 'anguilla', 'antilope', 'aragosta', 'armadillo',
    'astice', 'bassotto', 'beccaccia', 'bisonte', 'bruco', 'bufalo', 'cammello', 'canarino', 'canguro', 'capriolo',
    'carpa', 'castoro', 'cavallo', 'cervo', 'cicala', 'cicogna', 'cigno', 'cinghiale', 'coccinella', 'colibri', 'corvo',
    'criceto', 'cuculo', 'delfino', 'donnola', 'elefante', 'ermellino', 'fagiano', 'falco', 'faina', 'formica',
    'fringuello', 'gabbiano', 'gallo', 'gambero', 'gatto', 'gazza', 'gazzella', 'geco', 'ghepardo', 'ghiro', 'giraffa',
    'granchio', 'gru', 'gufo', 'ippocampo', 'istrice', 'koala', 'lama', 'lepre', 'leone', 'leopardo', 'libellula',
    'lince', 'lombrico', 'lontra', 'lucertola', 'lumaca', 'lupo', 'mantide', 'marmotta', 'medusa', 'orca', 'orso',
    'ostrica', 'panda', 'pantera', 'pavone', 'pellicano', 'pesce', 'pettirosso', 'pinguino', 'polpo', 'pony', 'procione',
    'puledro', 'puma', 'quaglia', 'rana', 'renna', 'riccio', 'rondine', 'salmone', 'sardina', 'scoiattolo', 'seppia',
    'sogliola', 'stambecco', 'storione', 'struzzo', 'talpa', 'tacchino', 'tapiro', 'tartaruga', 'tasso', 'tigre', 'tonno',
    'topo', 'trota', 'tucano', 'upupa', 'usignolo', 'vespa', 'volpe', 'zebra', 'zanzara', 'cavalletta', 'falena', 'bombo',
    'calabrone', 'alligatore', 'camaleonte', 'lemure', 'bradipo', 'cincilla', 'furetto', 'cerbiatto', 'agnello',
    'vitello', 'toro', 'capretto', 'pulcino', 'colomba', 'piccione', 'grifone', 'unicorno', 'ricciola', 'orata',
    'branzino', 'spigola', 'cernia', 'acciuga', 'aringa', 'sgombro', 'triglia', 'squalo', 'murena', 'cefalo', 'luccio',
    'persico', 'tinca', 'cavedano', 'gamberetto', 'scampo', 'corallo', 'chiocciola', 'baco', 'scarabeo', 'termite',
    'girino', 'ranocchio', 'cormorano', 'ibis', 'sparviero', 'condor', 'albatro', 'ghiandaia', 'cardellino', 'lucherino',
    'verdone', 'picchio', 'rondone', 'storno', 'pernice', 'tortora', 'colombo', 'germano', 'giaguaro', 'visone',
    'tricheco', 'capodoglio', 'salamandra', 'tritone', 'pavoncella', 'fenice', 'albicocca', 'ananas', 'arancia',
    'avocado', 'cachi', 'castagna', 'ciliegia', 'cocco', 'dattero', 'fragola', 'kiwi', 'lampone', 'limone', 'mandarino',
    'mango', 'mela', 'melone', 'mirtillo', 'mora', 'nespola', 'nocciola', 'noce', 'oliva', 'papaya', 'pesca',
    'pistacchio', 'pompelmo', 'prugna', 'ribes', 'susina', 'uva', 'anguria', 'cedro', 'lime', 'melograno', 'mandorla',
    'arachide', 'giuggiola', 'corbezzolo', 'sorba', 'mirto', 'ginepro', 'aglio', 'asparago', 'basilico', 'bietola',
    'broccolo', 'cardo', 'carota', 'cece', 'cicoria', 'cipolla', 'fagiolo', 'fungo', 'indivia', 'lattuga', 'lenticchia',
    'mais', 'melanzana', 'pomodoro', 'porro', 'radicchio', 'ravanello', 'rucola', 'scalogno', 'sedano', 'spinacio',
    'zucca', 'zucchina', 'rosmarino', 'salvia', 'timo', 'origano', 'menta', 'prezzemolo', 'alloro', 'cappero', 'zenzero',
    'curcuma', 'cannella', 'vaniglia', 'zafferano', 'pepe', 'senape', 'cumino', 'anice', 'cardamomo', 'maggiorana',
    'carciofino', 'crescione', 'pane', 'pasta', 'pizza', 'focaccia', 'grissino', 'biscotto', 'torta', 'crostata',
    'gelato', 'budino', 'cioccolato', 'caramella', 'miele', 'marmellata', 'burro', 'formaggio', 'ricotta', 'mozzarella',
    'yogurt', 'latte', 'uovo', 'frittata', 'risotto', 'polenta', 'minestra', 'zuppa', 'brodo', 'lasagna', 'raviolo',
    'tortello', 'fusillo', 'spaghetto', 'panino', 'tramezzino', 'cornetto', 'brioche', 'cassata', 'tiramisu', 'panettone',
    'pandoro', 'torrone', 'croccante', 'meringa', 'sorbetto', 'granita', 'macedonia', 'insalata', 'caponata',
    'peperonata', 'pesto', 'sugo', 'olio', 'aceto', 'farina', 'zucchero', 'lievito', 'semola', 'riso', 'orzo', 'farro',
    'avena', 'segale', 'grano', 'crusca', 'acqua', 'caffe', 'tisana', 'succo', 'spremuta', 'limonata', 'aranciata',
    'gazzosa', 'cedrata', 'sciroppo', 'orzata', 'cioccolata', 'tuorlo', 'crosta', 'mollica', 'briciola', 'fetta',
    'spicchio', 'buccia', 'nocciolo', 'chicco', 'grappolo', 'spiga', 'pannocchia', 'baccello', 'cialda', 'panna', 'crema',
    'caramello', 'amaretto', 'savoiardo', 'cantuccio', 'ciambella', 'frittella', 'pastiera', 'zeppola', 'polpetta',
    'crocchetta', 'arancino', 'piadina', 'tigella', 'calzone', 'bruschetta', 'crostino', 'tartina', 'sformato',
    'timballo', 'fonduta', 'salsa', 'maionese', 'sushi', 'paella', 'tortilla', 'curry', 'strudel', 'muffin', 'popcorn',
    'salatino', 'tarallo', 'pizzetta', 'biscottino', 'abete', 'acero', 'betulla', 'castagno', 'cipresso', 'faggio',
    'frassino', 'ginestra', 'glicine', 'larice', 'leccio', 'magnolia', 'mimosa', 'olivo', 'olmo', 'ontano', 'palma',
    'pino', 'pioppo', 'platano', 'quercia', 'salice', 'sambuco', 'tiglio', 'ulivo', 'carpino', 'eucalipto', 'baobab',
    'sequoia', 'edera', 'felce', 'muschio', 'lichene', 'alga', 'giunco', 'papiro', 'cactus', 'agave', 'aloe', 'lavanda',
    'gelsomino', 'garofano', 'geranio', 'giacinto', 'girasole', 'iris', 'loto', 'margherita', 'mughetto', 'narciso',
    'orchidea', 'ortensia', 'papavero', 'peonia', 'primula', 'rosa', 'tulipano', 'viola', 'violetta', 'ciclamino',
    'begonia', 'camelia', 'dalia', 'gardenia', 'azalea', 'fiordaliso', 'genziana', 'rododendro', 'oleandro', 'ibisco',
    'trifoglio', 'malva', 'camomilla', 'calendula', 'verbena', 'tarassaco', 'borragine', 'crocus', 'anemone', 'gerbera',
    'fresia', 'zinnia', 'petunia', 'lupino', 'bonsai', 'ficus', 'ghianda', 'pigna', 'foglia', 'ramo', 'radice', 'tronco',
    'corteccia', 'seme', 'germoglio', 'bocciolo', 'petalo', 'polline', 'linfa', 'resina', 'albero', 'arbusto',
    'cespuglio', 'ginkgo', 'alba', 'tramonto', 'aurora', 'sole', 'luna', 'stella', 'cometa', 'pianeta', 'galassia',
    'nebulosa', 'meteora', 'eclissi', 'orbita', 'cielo', 'nuvola', 'pioggia', 'neve', 'grandine', 'nebbia', 'brina',
    'rugiada', 'vento', 'brezza', 'tempesta', 'fulmine', 'tuono', 'lampo', 'arcobaleno', 'temporale', 'bufera', 'gelo',
    'ghiaccio', 'sereno', 'afa', 'mare', 'oceano', 'onda', 'spiaggia', 'sabbia', 'scoglio', 'isola', 'baia', 'golfo',
    'laguna', 'lago', 'fiume', 'torrente', 'ruscello', 'cascata', 'sorgente', 'pozzo', 'palude', 'stagno', 'valle',
    'collina', 'monte', 'montagna', 'vetta', 'cima', 'crinale', 'pendio', 'rupe', 'grotta', 'caverna', 'vulcano',
    'cratere', 'deserto', 'duna', 'oasi', 'prato', 'bosco', 'foresta', 'giungla', 'savana', 'steppa', 'tundra',
    'ghiacciaio', 'pianura', 'altopiano', 'fiordo', 'penisola', 'arcipelago', 'costa', 'riva', 'sponda', 'foce', 'delta',
    'estuario', 'marea', 'corrente', 'fondale', 'scogliera', 'faro', 'porto', 'molo', 'pontile', 'sentiero', 'radura',
    'siepe', 'roccia', 'pietra', 'sasso', 'ciottolo', 'ghiaia', 'argilla', 'fango', 'terra', 'polvere', 'cenere', 'fuoco',
    'fiamma', 'brace', 'scintilla', 'vapore', 'goccia', 'bolla', 'schiuma', 'cristallo', 'quarzo', 'granito', 'marmo',
    'ardesia', 'basalto', 'ambra', 'perla', 'rubino', 'smeraldo', 'zaffiro', 'topazio', 'giada', 'opale', 'onice',
    'agata', 'turchese', 'ametista', 'oro', 'argento', 'bronzo', 'rame', 'ferro', 'piombo', 'zinco', 'platino', 'titanio',
    'cobalto', 'mercurio', 'carbone', 'grafite', 'zolfo', 'magma', 'lava', 'orizzonte', 'equatore', 'tropico', 'polo',
    'meridiano', 'emisfero', 'stagione', 'primavera', 'estate', 'autunno', 'inverno', 'mattino', 'mattina', 'meriggio',
    'pomeriggio', 'sera', 'notte', 'crepuscolo', 'secolo', 'settimana', 'giornata', 'minuto', 'anno', 'mese', 'diamante',
    'casa', 'tetto', 'muro', 'porta', 'finestra', 'balcone', 'terrazza', 'scala', 'gradino', 'soffitto', 'pavimento',
    'parete', 'camino', 'cortile', 'giardino', 'orto', 'serra', 'cantina', 'soffitta', 'solaio', 'garage', 'cucina',
    'salotto', 'camera', 'bagno', 'corridoio', 'ingresso', 'studio', 'veranda', 'portico', 'cancello', 'recinto', 'sedia',
    'tavolo', 'divano', 'poltrona', 'letto', 'cuscino', 'coperta', 'lenzuolo', 'materasso', 'armadio', 'cassetto',
    'comodino', 'mensola', 'scaffale', 'credenza', 'specchio', 'tappeto', 'tenda', 'lampada', 'lampadario', 'candela',
    'lanterna', 'torcia', 'fiammifero', 'orologio', 'sveglia', 'quadro', 'cornice', 'vaso', 'ciotola', 'piatto',
    'bicchiere', 'tazza', 'tazzina', 'forchetta', 'cucchiaio', 'mestolo', 'pentola', 'padella', 'teglia', 'tegame',
    'caraffa', 'bottiglia', 'brocca', 'barattolo', 'scatola', 'cesto', 'cestino', 'sacco', 'borsa', 'zaino', 'valigia',
    'baule', 'cassa', 'cassetta', 'busta', 'pacco', 'nastro', 'spago', 'corda', 'filo', 'ago', 'spilla', 'bottone',
    'cerniera', 'forbici', 'colla', 'chiodo', 'vite', 'bullone', 'martello', 'cacciavite', 'pinza', 'tenaglia', 'trapano',
    'pialla', 'scalpello', 'pennello', 'rullo', 'secchio', 'paletta', 'straccio', 'spugna', 'sapone', 'pettine',
    'spazzola', 'ombrello', 'cappello', 'berretto', 'sciarpa', 'guanto', 'calza', 'calzino', 'scarpa', 'stivale',
    'sandalo', 'ciabatta', 'giacca', 'cappotto', 'maglia', 'maglione', 'camicia', 'gonna', 'pantalone', 'vestito',
    'grembiule', 'cintura', 'cravatta', 'fazzoletto', 'tasca', 'colletto', 'manica', 'orlo', 'tessuto', 'lana', 'cotone',
    'seta', 'lino', 'velluto', 'raso', 'feltro', 'tela', 'cuoio', 'piuma', 'gomitolo', 'uncinetto', 'telaio', 'ditale',
    'collana', 'anello', 'bracciale', 'orecchino', 'ciondolo', 'medaglia', 'occhiali', 'binocolo', 'lente', 'telescopio',
    'bussola', 'globo', 'atlante', 'libro', 'quaderno', 'matita', 'penna', 'gomma', 'righello', 'squadra', 'compasso',
    'astuccio', 'lavagna', 'gesso', 'inchiostro', 'pennarello', 'pastello', 'acquerello', 'tavolozza', 'cavalletto',
    'carta', 'cartolina', 'lettera', 'diario', 'rubrica', 'giornale', 'rivista', 'fumetto', 'romanzo', 'poesia', 'favola',
    'fiaba', 'leggenda', 'racconto', 'capitolo', 'pagina', 'copertina', 'segnalibro', 'biblioteca', 'museo', 'teatro',
    'cinema', 'concerto', 'festival', 'mostra', 'galleria', 'piazza', 'fontana', 'statua', 'colonna', 'arco', 'ponte',
    'torre', 'castello', 'palazzo', 'villa', 'cascina', 'fienile', 'mulino', 'granaio', 'stalla', 'capanna', 'baita',
    'rifugio', 'igloo', 'fornello', 'lavello', 'rubinetto', 'mattarello', 'grattugia', 'colino', 'imbuto', 'tagliere',
    'frullino', 'mortaio', 'pestello', 'tostapane', 'teiera', 'moka', 'bollitore', 'presina', 'tovaglia', 'tovagliolo',
    'vassoio', 'saliera', 'oliera', 'anfora', 'ampolla', 'borraccia', 'cannuccia', 'cappuccio', 'cartella', 'mattone',
    'piastrella', 'rotolo', 'sacchetto', 'scatolone', 'sgabello', 'tappo', 'timbro', 'ventaglio', 'zerbino', 'carillon',
    'grammofono', 'giradischi', 'radio', 'tastiera', 'schermo', 'stampante', 'lavatrice', 'stazione', 'binario', 'treno',
    'tram', 'autobus', 'metro', 'taxi', 'bicicletta', 'moto', 'scooter', 'auto', 'furgone', 'camion', 'trattore', 'barca',
    'nave', 'veliero', 'gondola', 'canoa', 'kayak', 'zattera', 'traghetto', 'aereo', 'elicottero', 'razzo', 'aquilone',
    'slitta', 'carretto', 'carrozza', 'vagone', 'biglietto', 'passaporto', 'strada', 'viale', 'vicolo', 'incrocio',
    'rotonda', 'semaforo', 'panchina', 'lampione', 'edicola', 'mercato', 'negozio', 'bottega', 'forno', 'panetteria',
    'gelateria', 'farmacia', 'ufficio', 'fabbrica', 'officina', 'cantiere', 'magazzino', 'scuola', 'palestra', 'piscina',
    'stadio', 'campo', 'parco', 'giostra', 'altalena', 'scivolo', 'borgo', 'paese', 'villaggio', 'contrada', 'quartiere',
    'rione', 'periferia', 'centro', 'corso', 'lungomare', 'belvedere', 'loggia', 'chiostro', 'cupola', 'guglia',
    'fossato', 'acquedotto', 'anfiteatro', 'arena', 'obelisco', 'elica', 'ancora', 'timone', 'vela', 'remo', 'boa',
    'scialuppa', 'canotto', 'motoscafo', 'funivia', 'seggiovia', 'cabinovia', 'tandem', 'aiuola', 'vialetto', 'rastrello',
    'zappa', 'vanga', 'carriola', 'cesoia', 'terriccio', 'concime', 'semina', 'raccolto', 'frutteto', 'vigneto',
    'uliveto', 'aranceto', 'roseto', 'pergola', 'gazebo', 'amaca', 'dondolo', 'sdraio', 'ombrellone', 'musica', 'canzone',
    'melodia', 'ritmo', 'armonia', 'nota', 'accordo', 'sinfonia', 'sonata', 'valzer', 'tango', 'samba', 'polka',
    'ballata', 'coro', 'orchestra', 'banda', 'chitarra', 'violino', 'arpa', 'pianoforte', 'organo', 'flauto',
    'clarinetto', 'oboe', 'fagotto', 'corno', 'tuba', 'sassofono', 'tamburo', 'batteria', 'triangolo', 'xilofono',
    'armonica', 'mandolino', 'banjo', 'ukulele', 'liuto', 'cetra', 'campana', 'campanello', 'sonaglio', 'danza',
    'balletto', 'giocoliere', 'acrobata', 'circo', 'burattino', 'marionetta', 'maschera', 'costume', 'coriandolo',
    'girandola', 'trottola', 'bambola', 'pupazzo', 'peluche', 'puzzle', 'domino', 'scacchi', 'dama', 'dado', 'jolly',
    'tombola', 'biglia', 'canestro', 'racchetta', 'birillo', 'freccia', 'bersaglio', 'traguardo', 'coppa', 'trofeo',
    'podio', 'maratona', 'staffetta', 'corsa', 'salto', 'nuoto', 'tuffo', 'sci', 'pattino', 'slittino', 'golf', 'tennis',
    'rugby', 'scherma', 'judo', 'yoga', 'ciclismo', 'alpinismo', 'campeggio', 'picnic', 'gita', 'viaggio', 'avventura',
    'crociera', 'vacanza', 'festa', 'sagra', 'fiera', 'carnevale', 'parata', 'pittura', 'scultura', 'disegno', 'schizzo',
    'mosaico', 'affresco', 'ritratto', 'paesaggio', 'murale', 'graffito', 'fotografia', 'pellicola', 'colore', 'tinta',
    'sfumatura', 'ombra', 'luce', 'riflesso', 'eco', 'silenzio', 'sussurro', 'risata', 'sorriso', 'abbraccio', 'saluto',
    'carezza', 'gioia', 'allegria', 'pace', 'calma', 'quiete', 'sogno', 'ricordo', 'idea', 'pensiero', 'parola', 'frase',
    'voce', 'canto', 'fischio', 'applauso', 'palloncino', 'fischietto', 'tamburello', 'zufolo', 'zampogna', 'rosso',
    'blu', 'verde', 'giallo', 'bianco', 'grigio', 'arancio', 'azzurro', 'celeste', 'indaco', 'porpora', 'cremisi', 'ocra',
    'avorio', 'cipria', 'ruggine', 'marrone', 'castano', 'dorato', 'argentato', 'lucente', 'brillante', 'opaco', 'chiaro',
    'scuro', 'tenue', 'vivace', 'morbido', 'liscio', 'ruvido', 'soffice', 'leggero', 'pesante', 'lento', 'veloce',
    'rapido', 'agile', 'calmo', 'quieto', 'allegro', 'gentile', 'felice', 'curioso', 'saggio', 'fiero', 'forte', 'dolce',
    'salato', 'aspro', 'fresco', 'caldo', 'tiepido', 'freddo', 'gelido', 'nuovo', 'antico', 'giovane', 'alto', 'basso',
    'largo', 'stretto', 'lungo', 'corto', 'tondo', 'quadrato', 'ovale', 'curvo', 'dritto', 'lontano', 'vicino', 'pieno',
    'vuoto', 'semplice', 'strano', 'raro', 'magico', 'libero', 'aperto', 'chiuso', 'elegante', 'grazioso', 'timido',
    'audace', 'attento', 'sveglio', 'goloso', 'pulito', 'lucido', 'sottile', 'robusto', 'gigante', 'minuscolo', 'enorme',
    'tenero', 'profumato', 'musicale', 'notturno', 'estivo', 'invernale', 'autunnale', 'marino', 'montano', 'lunare',
    'solare', 'stellato', 'nuvoloso', 'ventoso', 'piovoso', 'nevoso', 'limpido', 'luminoso', 'splendido', 'vellutato',
    'frizzante', 'zuccherato', 'cuoco', 'fornaio', 'sarto', 'fabbro', 'vasaio', 'pittore', 'poeta', 'pilota', 'marinaio',
    'pescatore', 'mugnaio', 'pastaio', 'gelataio', 'libraio', 'postino', 'maestro', 'scultore', 'regista', 'autore',
    'viandante', 'astronauta', 'mago', 'folletto', 'gnomo', 'elfo', 'fata', 'drago', 'sirena', 'centauro', 'falegname',
    'musicista', 'cantante', 'ballerino', 'atomo', 'molecola', 'cellula', 'elettrone', 'protone', 'neutrone', 'magnete',
    'energia', 'circuito', 'motore', 'ruota', 'leva', 'molla', 'pistone', 'turbina', 'antenna', 'segnale', 'robot',
    'satellite', 'sonda', 'meteorite', 'asteroide', 'quasar', 'laser', 'prisma', 'provetta', 'alambicco', 'formula',
    'calcolo', 'numero', 'cifra', 'somma', 'grammo', 'litro', 'bilancia', 'termometro', 'barometro', 'clessidra',
    'meridiana', 'pendolo', 'cerchio', 'cubo', 'sfera', 'cono', 'cilindro', 'piramide', 'rombo', 'spirale', 'punto',
    'linea', 'angolo', 'vertice', 'raggio', 'diametro', 'poligono', 'esagono', 'ottagono', 'battito', 'bivio', 'cammino',
    'destino', 'dono', 'enigma', 'fortuna', 'galoppo', 'ghirlanda', 'indizio', 'intreccio', 'labirinto', 'mistero',
    'nodo', 'passo', 'percorso', 'rebus', 'rima', 'rotta', 'sorpresa', 'tesoro', 'traccia', 'trama', 'varco', 'vortice',
    'zigzag', 'cuore', 'cantare', 'ballare', 'danzare', 'correre', 'saltare', 'nuotare', 'volare', 'sognare', 'ridere',
    'sorridere', 'giocare', 'leggere', 'scrivere', 'dipingere', 'disegnare', 'cucinare', 'viaggiare', 'camminare',
    'pedalare', 'remare', 'sciare', 'pescare', 'ascoltare', 'suonare', 'fischiare', 'salutare', 'raccontare', 'inventare',
    'costruire', 'scoprire', 'esplorare', 'osservare', 'contare', 'imparare', 'studiare', 'cercare', 'trovare', 'aprire',
    'partire', 'tornare', 'arrivare', 'aspettare', 'restare', 'salire', 'scendere', 'girare', 'brillare', 'splendere',
    'fiorire', 'crescere', 'piantare', 'annaffiare', 'impastare', 'assaggiare', 'gustare', 'mescolare', 'cuocere',
    'bollire', 'infornare', 'stirare', 'cucire', 'ricamare', 'colorare', 'incollare', 'piegare', 'annodare', 'scalare',
    'applaudire', 'sussurrare', 'scherzare', 'vincere', 'guardare', 'sbocciare', 'navigare', 'veleggiare', 'pattinare',
    'scivolare', 'riposare', 'respirare', 'decorare', 'addobbare', 'regalare', 'donare', 'abitare', 'visitare',
    'seminare', 'potare', 'arare', 'macinare', 'lievitare', 'sfornare', 'assaporare', 'saltellare', 'rotolare',
    'dondolare', 'oscillare', 'ruotare', 'fluttuare', 'planare', 'atterrare', 'decollare', 'approdare', 'salpare',
    'alone', 'bagliore', 'chiarore', 'scroscio', 'pioviggine', 'nevicata', 'gelata', 'disgelo', 'bonaccia', 'maestrale',
    'scirocco', 'tramontana', 'libeccio', 'ponente', 'levante', 'bora', 'foschia', 'miraggio', 'stellina', 'plenilunio',
    'novilunio', 'solstizio', 'equinozio', 'conchiglia', 'salsedine', 'risacca', 'maroso', 'cavallone', 'approdo',
    'ormeggio', 'banchina', 'scafo', 'prua', 'poppa', 'salvagente', 'pagaia', 'pinna', 'muta', 'cabina', 'battigia',
    'secca', 'lido', 'arenile', 'cala', 'insenatura', 'faraglione', 'isolotto', 'atollo', 'malga', 'alpeggio', 'forcella',
    'colle', 'valico', 'crepaccio', 'ferrata', 'picozza', 'scarpone', 'bastoncino', 'pista', 'camoscio', 'cascatella',
    'nord', 'sud', 'est', 'ovest', 'fattoria', 'aia', 'covone', 'aratro', 'solco', 'filare', 'pergolato', 'pollaio',
    'alveare', 'cera', 'nettare', 'dispensa', 'ripiano', 'cappa', 'frigo', 'scolapasta', 'spatola', 'setaccio',
    'piattino', 'scodella', 'zuppiera', 'fruttiera', 'cucchiaino', 'banco', 'cattedra', 'mappamondo', 'gessetto',
    'temperino', 'graffetta', 'puntina', 'taccuino', 'foglio', 'cartoncino', 'calamaio', 'pergamena', 'felpa', 'gilet',
    'giubbotto', 'mantella', 'poncho', 'kimono', 'tunica', 'bermuda', 'tuta', 'pigiama', 'vestaglia', 'pantofola',
    'mocassino', 'ballerina', 'cuffia', 'bombetta', 'basco', 'fascia', 'scialle', 'mantello', 'fermaglio', 'fiocco',
    'nastrino', 'merletto', 'ricamo', 'toppa', 'asola', 'trenino', 'mattoncino', 'girotondo', 'triciclo', 'yoyo',
    'teatrino', 'cavallino', 'orsetto', 'tamburino', 'astronave', 'navicella', 'torretta', 'forziere', 'scrigno',
    'cantilena', 'mosca', 'moscerino', 'insetto', 'millepiedi', 'ragnatela', 'cocorita', 'falchetto', 'capinera', 'alice',
    'daino', 'moscardino', 'gattino', 'cucciolo', 'micio', 'agnellino', 'vitellino', 'dromedario', 'fortezza', 'rocca',
    'maniero', 'reggia', 'palazzina', 'villetta', 'casetta', 'casolare', 'masseria', 'trullo', 'nuraghe', 'rustico',
    'capanno', 'padiglione', 'voliera', 'acquario', 'planetario', 'frantoio', 'caseificio', 'bancarella', 'chiosco',
    'botteghino', 'fermata', 'capolinea', 'aeroporto', 'tunnel', 'passerella', 'lungofiume', 'lungolago', 'argine',
    'diga', 'chiusa', 'canale', 'naviglio', 'fontanella', 'piazzetta', 'scalinata', 'gradinata', 'portone', 'atrio',
    'porticato', 'arcata', 'volta', 'persiana', 'imposta', 'davanzale', 'ringhiera', 'terrazzino', 'ceramica',
    'porcellana', 'terracotta', 'maiolica', 'vetro', 'filigrana', 'arazzo', 'vetrata', 'cammeo', 'gemma', 'sigillo',
    'stemma', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica', 'gennaio', 'febbraio',
    'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre', 'amicizia',
    'bellezza', 'cortesia', 'coraggio', 'fantasia', 'fiducia', 'gentilezza', 'meraviglia', 'pazienza', 'saggezza',
    'speranza', 'stupore', 'tenerezza', 'entusiasmo', 'passione', 'equilibrio', 'leggerezza', 'dolcezza', 'freschezza',
    'chiarezza', 'lentezza', 'riposo', 'respiro', 'sospiro', 'sbadiglio', 'risveglio', 'incontro', 'ritorno', 'partenza',
    'arrivo', 'scoperta', 'invenzione', 'regalo', 'pacchetto', 'invito', 'buono', 'bello', 'bravo', 'caro', 'simpatico',
    'sincero', 'onesto', 'generoso', 'coraggioso', 'paziente', 'tranquillo', 'contento', 'stupito', 'rilassato',
    'riposato', 'energico', 'rosato', 'turchino', 'purpureo', 'spugnoso', 'cremoso', 'succoso', 'saporito', 'gustoso',
    'fragrante', 'aromatico', 'speziato', 'agrodolce', 'zuccherino', 'tartufo', 'porcino', 'ovolo', 'finferlo',
    'morchella', 'pinolo', 'sesamo', 'fagiolino', 'soia', 'quinoa', 'pastina', 'rigatone', 'sfoglia', 'crostatina',
    'tortina', 'pasticcino', 'confetto', 'gelatina', 'semifreddo', 'nasturzio', 'giglio', 'gladiolo', 'ninfea', 'fucsia',
    'agrifoglio', 'vischio', 'soffione', 'lucerna', 'lumino', 'paralume', 'plafoniera', 'cavo', 'pila', 'dinamo',
    'bobina', 'rocchetto', 'gancio', 'maniglia', 'pomello', 'citofono', 'gruccia', 'asse', 'cesta', 'cestello', 'panca',
    'leggio', 'scrittoio', 'scrivania', 'ventola', 'stufa', 'caminetto', 'legna', 'ceppo', 'anfratto', 'caletta',
    'rigagnolo', 'fontanile', 'meandro', 'pietraia', 'macchia', 'sottobosco', 'pineta', 'faggeta', 'castagneto',
    'querceto', 'canneto', 'moneta', 'borsellino', 'damigiana', 'barile', 'tino', 'mastello', 'catino', 'bacinella',
    'vasca', 'doccia', 'lavandino', 'cornicione', 'tegola', 'mattonella', 'intonaco', 'calce', 'cemento', 'trave',
    'pilastro', 'capitello', 'nicchia', 'soppalco', 'lavanderia', 'stenditoio', 'molletta', 'bucato', 'panzanella',
    'ribollita', 'minestrone', 'tortellino', 'carbonara', 'pecorino', 'parmigiano', 'gorgonzola', 'fontina', 'stracchino',
    'robiola', 'scamorza', 'provola', 'burrata', 'caciotta', 'mascarpone', 'taleggio', 'asiago', 'montasio', 'rosetta',
    'michetta', 'pagnotta', 'filone', 'focaccina', 'polipo', 'calamaro', 'gamberone', 'rovescio', 'schiarita',
    'nuvoletta', 'venticello', 'solleone', 'tepore', 'frescura', 'ostello', 'locanda', 'osteria', 'trattoria', 'pizzeria',
    'drogheria', 'merceria', 'ferramenta', 'cartoleria', 'vivaio', 'escursione', 'merenda', 'colazione', 'pranzo', 'cena',
    'spuntino', 'banchetto', 'rinfresco', 'grigliata', 'ballo', 'fanfara', 'serenata', 'preludio', 'minuetto', 'mazurca',
    'tarantella', 'saltarello', 'quadriglia', 'bolero', 'rumba', 'mambo', 'jazz', 'opera', 'operetta', 'aria', 'romanza',
    'duetto', 'terzetto', 'quartetto', 'assolo', 'ritornello', 'strofa', 'spartito', 'bemolle', 'metronomo', 'diapason',
    'plettro', 'archetto', 'tasto', 'pedale', 'ottava', 'cadenza', 'festone', 'candelina', 'nuvolone', 'acquazzone',
    'fiammella', 'lanternino'
  ]);
});

/* Nomi di persona nei testi degli eventi: come si trovano e come si sostituiscono (voci T-047, T-048 e T-049 del piano
   di adeguamento; libro mastro, §§ 3.5 «La rimozione», 3.13 passo 3, 18.7 e 2.6; decisione del 26/11/2026, n. 10).

   La Redazione scrive una o più forme del nome, una per riga (nome e cognome, il solo cognome, il nome d'arte). Il
   modulo le cerca senza badare a maiuscole, accenti e apostrofi, e solo come parole intere: «Esempio» trova
   «Via Esempio», non «Esempiotto». Trattini, punti e altri segni contano come spazi, così «concerto-nicolo-esempio»
   in un collegamento contiene «Nicolò Esempio». L'app non sa che cosa sia un nome: trova soltanto le forme scritte, e
   ogni punto trovato si guarda prima di toccarlo (conferma punto per punto).

   - forme(testo) → [{forma, n}]: le forme, una per riga, senza doppioni; n è la forma normalizzata;
   - trova(testo, forme) → [{da, a, forma}]: i punti in cui una forma compare, nel testo com'è (da compreso, a escluso),
     senza sovrapposizioni; a parità di punto vince la forma più lunga;
   - sostituisci(testo, punti, neutro) → il testo con i punti sostituiti da neutro;
   - estratto(testo, da, a, margine) → {prima, nome, dopo}: il brano attorno a un punto, su una riga;
   - puntiEvento(ev, forme) → [{campo, da, a, forma}]: i punti in ogni campo di un evento nel formato pubblico
     (docs/formato-eventi.md); nel collegamento della fonte un punto ha collegamento: true e non si sostituisce, perché
     un indirizzo cambiato non porterebbe più alla pagina (il collegamento è facoltativo e si propone di toglierlo);
   - leggiCampo(ev, campo) e conCampo(ev, campo, valore): un campo dell'evento, anche «fonte.testo»;
   - RUOLI: i testi neutri approvati il 26/11/2026 (decisione n. 11).

   Nel browser si trova in window.AGR_MODULI.nomi, soltanto nell'app della redazione; in Node (prove) con require(). */
(function (radice, fabbrica) {
  const nodo = typeof module === 'object' && module.exports && typeof require === 'function';
  const m = fabbrica();
  if (nodo) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).nomi = m;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const RUOLI = ['[relatore]', '[relatrice]', '[artista]', '[referente]', '[organizzatore]', '[persona]'];
  const CAMPI = ['titolo', 'descrizione', 'organizzatore', 'luogo', 'indirizzo', 'descrizione_luogo', 'prezzo', 'fonte.testo', 'fonte.collegamento'];
  const SEGNI = /[̀-ͯ]/g, APOSTROFI = /[‘’ʼ`´′]/g, LETTERA = /[\p{L}\p{N}']/u;

  /* Il testo normalizzato, con il posto di ogni suo carattere nel testo di partenza: t[k] viene dai caratteri
     da[k] … a[k]-1. Minuscole, senza accenti, apostrofi tutti uguali, ogni altro segno uno spazio, spazi non ripetuti. */
  function norma(testo) {
    const s = String(testo == null ? '' : testo), t = [], da = [], a = [];
    let i = 0;
    for (const c of s) {
      const fine = i + c.length;
      let x = c.toLowerCase().normalize('NFD').replace(SEGNI, '').replace(APOSTROFI, "'");
      x = [...x].map(y => LETTERA.test(y) ? y : ' ').join('');
      for (const y of x) {
        if (y === ' ' && (!t.length || t[t.length - 1] === ' ')) continue;
        t.push(y); da.push(i); a.push(fine);
      }
      i = fine;
    }
    while (t.length && t[t.length - 1] === ' ') { t.pop(); da.pop(); a.pop(); }
    return { t: t.join(''), da, a };
  }
  const normale = testo => norma(testo).t;

  function forme(testo) {
    const viste = new Set(), out = [];
    for (const riga of String(testo == null ? '' : testo).split(/\r?\n/)) {
      const forma = riga.trim().slice(0, 120), n = normale(forma);
      if ((n.match(/\p{L}/gu) || []).length < 2 || viste.has(n)) continue;
      viste.add(n); out.push({ forma, n });
    }
    return out.slice(0, 20);
  }
  const elenco = f => (Array.isArray(f) ? f : forme(f)).filter(x => x && x.n);

  /* una forma è una parola intera se prima e dopo c'è uno spazio, un apostrofo o il bordo del testo */
  const bordo = (t, k) => k < 0 || k >= t.length || t[k] === ' ' || t[k] === "'";
  function trova(testo, f) {
    const N = norma(testo), lista = [];
    for (const x of elenco(f)) {
      let k = N.t.indexOf(x.n);
      while (k >= 0) {
        if (bordo(N.t, k - 1) && bordo(N.t, k + x.n.length)) lista.push({ k, l: x.n.length, forma: x.forma });
        k = N.t.indexOf(x.n, k + 1);
      }
    }
    lista.sort((p, q) => p.k - q.k || q.l - p.l);
    const out = []; let fin = -1;
    for (const p of lista) { if (p.k < fin) continue; out.push({ da: N.da[p.k], a: N.a[p.k + p.l - 1], forma: p.forma }); fin = p.k + p.l; }
    return out;
  }
  const contiene = (testo, f) => trova(testo, f).length > 0;

  function sostituisci(testo, punti, neutro) {
    let s = String(testo == null ? '' : testo);
    for (const p of (punti || []).slice().sort((x, y) => y.da - x.da)) s = s.slice(0, p.da) + neutro + s.slice(p.a);
    return s;
  }

  function estratto(testo, da, a, margine) {
    const s = String(testo == null ? '' : testo), m = margine == null ? 50 : margine, una = x => x.replace(/\s+/g, ' ');
    let i = Math.max(0, da - m), j = Math.min(s.length, a + m);
    if (i > 0) { const k = s.indexOf(' ', i); if (k >= 0 && k < da) i = k + 1; }
    if (j < s.length) { const k = s.lastIndexOf(' ', j); if (k > a) j = k; }
    return { prima: (i > 0 ? '…' : '') + una(s.slice(i, da)), nome: una(s.slice(da, a)), dopo: una(s.slice(a, j)) + (j < s.length ? '…' : '') };
  }

  const leggiCampo = (ev, campo) => {
    if (!ev || typeof ev !== 'object') return '';
    const v = campo.startsWith('fonte.') ? (ev.fonte || {})[campo.slice(6)] : ev[campo];
    return typeof v === 'string' ? v : '';
  };
  function conCampo(ev, campo, valore) {
    const o = Object.assign({}, ev);
    if (campo.startsWith('fonte.')) {
      o.fonte = Object.assign({}, ev.fonte || {});
      if (valore === undefined || valore === '') delete o.fonte[campo.slice(6)]; else o.fonte[campo.slice(6)] = valore;
    } else if (valore === undefined || valore === '') delete o[campo]; else o[campo] = valore;
    return o;
  }
  /* un indirizzo si legge con le parti scritte in codice (%20…) già tradotte */
  const decodifica = u => { try { return decodeURIComponent(u); } catch (e) { return u; } };

  function puntiEvento(ev, f) {
    const out = [];
    for (const campo of CAMPI) {
      const v = leggiCampo(ev, campo); if (!v) continue;
      if (campo === 'fonte.collegamento') { const p = trova(decodifica(v), f); if (p.length) out.push({ campo, da: 0, a: v.length, forma: p[0].forma, collegamento: true }); continue; }
      for (const p of trova(v, f)) out.push(Object.assign({ campo }, p));
    }
    return out;
  }

  return { RUOLI, CAMPI, normale, forme, trova, contiene, sostituisci, estratto, leggiCampo, conCampo, puntiEvento };
});

/* Lo sportello di pubblicazione (voci T-038, T-039 e T-040 del piano di adeguamento; documento:
   docs/sportello-pubblicazione.md).

   Libro mastro, § 2.4 («La pubblicazione firmata», «Lo storico e le copie di sicurezza»): gli eventi si scrivono
   nell'archivio da una sola porta, questo programma, che accetta un pacchetto soltanto se porta la firma della
   Redazione; rifiuta i pacchetti fuori dalla finestra di tempo o già ricevuti; dopo pochi tentativi errati smette di
   rispondere per un tempo; se la firma è valida scrive gli eventi (quadranti e indice), salva una copia datata nello
   storico e fa aggiornare la rete di consegna. § 3.11; § 3.13 (rettifica, limitazione); § 5.2; § 7.5.

   Qui c'è soltanto la logica, uguale dovunque giri: su Bunny la avvolge sportelli/bunny-pubblicazione.js (Fase 2,
   T-065); in Fase 1 la stessa logica gira dentro il browser, nello «sportello di prova» dell'app della redazione
   (sorgenti/redazione/sportello-prova.js), con un archivio finto. Chi la avvolge le dà:

   - deposito: {leggi(percorso) → testo o null, scrivi(percorso, testo), togli(percorso), elenca(prefisso) → percorsi}.
     I percorsi che cominciano con «pubblico/» sono l'archivio che i telefoni leggono (indice.json e quadranti/); quelli
     che cominciano con «riservato/» non sono pubblici: le chiavi autorizzate, l'elenco completo degli eventi con quelli
     sospesi, lo storico, i numeri già ricevuti e i tentativi errati;
   - ora: l'orologio; cripto: gli strumenti di cifratura; regioni: i confini per i numeri per regione; vocabolario:
     strati e temi dell'app; svuota(percorsi): fa aggiornare la rete di consegna (facoltativa).

   Lo sportello riceve soltanto il testo del pacchetto: non vede e non conserva l'indirizzo di chi lo manda. I tentativi
   errati si contano per dispositivo della Redazione (decisione del 23/11/2026): chi non è un dispositivo autorizzato è
   rifiutato subito, sempre, e non può chiudere la porta agli altri.

   Le chiavi autorizzate non arrivano mai con un pacchetto: stanno in riservato/chiavi.json, che su Bunny scrive il
   Responsabile infrastruttura con i file della schermata «Chiavi» (le parti pubbliche, l'avviso di revoca); nello
   sportello di prova lo scrivono i comandi «ammetti» e «revoca» qui sotto.

   Gli eventi nascosti (T-045; § 2.3; docs/eventi-nascosti.md) arrivano già cifrati: lo sportello non sa aprirli. Di
   ognuno conosce l'identificativo, l'impronta della password (il nome del file), il giorno in cui esce dalla mappa
   (decisione del 25/11/2026: soltanto il giorno, non l'ora) e il file illeggibile, che scrive in pubblico/nascosti/
   con l'impronta come nome. Due eventi nascosti non possono avere la stessa impronta, cioè la stessa password.

   Nel browser si trova in window.AGR_MODULI.sportello (dopo eventi.js, nascosti.js, quadranti.js e pacchetto.js); in
   Node con require(). */
(function (radice, fabbrica) {
  const nodo = typeof module === 'object' && module.exports && typeof require === 'function';
  const M = nodo ? { eventi: require('../sorgenti/moduli/eventi.js'), quadranti: require('../sorgenti/moduli/quadranti.js'), pacchetto: require('../sorgenti/moduli/pacchetto.js'),
    nascosti: require('../sorgenti/moduli/nascosti.js') } : (radice.AGR_MODULI || {});
  const m = fabbrica(M.eventi, M.quadranti, M.pacchetto, M.nascosti, radice);
  if (nodo) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).sportello = m;
})(typeof self !== 'undefined' ? self : this, function (E, Q, P, N, radice) {
  'use strict';
  if (!E || !Q || !P || !N) throw new Error('sportello: servono prima eventi.js, nascosti.js, quadranti.js e pacchetto.js');

  const VERSIONE = 1;
  const TENTATIVI = 5;                    // firme sbagliate, a nome dello stesso dispositivo…
  const QUARTO_MS = 15 * 6e4;             // …in un quarto d'ora…
  const FERMO_MS = 15 * 6e4;              // …e lo sportello non risponde a quel dispositivo per un quarto d'ora
  const MAX_EVENTI = 2000;                // eventi in un solo pacchetto
  const CINQUE_ANNI_MS = 5 * 365.25 * 864e5;   // § 3.14: lo storico si conserva cinque anni (si controlla nel riesame)
  /* I motivi del ritiro prima della fine (cap. 22, colonna «Ritiro prima della fine»; §§ 5.2 e 7.5). */
  const MOTIVI = ['annullato', 'errore', 'esclusione', 'richiesta', 'segnalazione', 'ordine'];
  const PUB = 'pubblico/', RIS = 'riservato/', NASC = PUB + 'nascosti/';
  const F = { chiavi: RIS + 'chiavi.json', stato: RIS + 'stato.json', visti: RIS + 'visti.json', tentativi: RIS + 'tentativi.json',
    elenco: RIS + 'storico/elenco.json', copie: RIS + 'storico/copie/', codici: RIS + 'registro/codici.json', righe: RIS + 'registro/righe/' };
  /* Il registro delle fonti (cap. 22; T-041, T-043): con una pubblicazione può arrivare, nello stesso pacchetto firmato,
     la busta cifrata con le sue righe. Lo sportello non la sa aprire (la chiave del registro sta solo sui dispositivi
     della Redazione): ne controlla la forma, la conserva in riservato/registro/righe/ accanto alla copia datata e dà a
     ogni evento nuovo il suo codice F, uno dopo l'altro, così due dispositivi non danno mai lo stesso codice a due
     eventi (§ 18.4: i codici non si riusano e non si rinumerano). La busta non entra mai nei file pubblici.
     Decisione del 24/11/2026: fino allo sportello dell'archivio (T-053) il registro arriva insieme all'evento.
     Con la busta può arrivare registroDa, il primo numero F che lo sportello può dare: le righe scritte a mano prima
     dell'app hanno già i loro codici, e il contatore passa oltre (T-043). La lettura firmata «registro» restituisce le
     buste conservate e gli eventi pubblicati nel periodo, per il controllo della corrispondenza (cap. 22, regola 4) e
     per un secondo dispositivo, che le apre con la stessa chiave del registro. */
  const TIPO_BUSTA = 'registro-fonti-redazione', TIPO_RIGHE = 'registro-righe', MAX_BUSTA = 1500000;
  const TIPO_COPIA = 'copia-pubblicazione', TIPO_PUBBLICHE = 'chiavi-pubbliche-redazione', TIPO_REVOCA = 'revoca-chiave-redazione';
  const NOME_COPIA = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[0-9a-f]{8}$/;
  const MAX_BUSTE = 500, MAX_COPIE_LETTE = 2000, MAX_F = 99999;
  const RIGA = /^[^\u0000-\u001F\u007F-\u009F]*$/;

  const iso = ms => new Date(ms).toISOString();
  function rifiuto(motivo, extra) { const e = new Error('sportello: ' + motivo); e.rifiuto = Object.assign({ motivo }, extra || {}); return e; }
  const corto = x => (typeof x === 'string' ? x : String(x)).slice(0, 40);

  function crea(o) {
    const dep = o.deposito, ora = o.ora || (() => Date.now()), cripto = o.cripto || radice.crypto || (typeof globalThis === 'object' ? globalThis.crypto : null);
    const regioni = o.regioni || [], opzEv = o.vocabolario ? { vocabolario: o.vocabolario } : undefined;
    if (!dep) throw new Error('sportello: manca il deposito');

    async function leggiJson(p, d) { const t = await dep.leggi(p); if (t == null) return d; try { return JSON.parse(t); } catch (e) { return d; } }
    const scriviJson = (p, v) => dep.scrivi(p, JSON.stringify(v));
    const risposta = (stato, corpo) => ({ stato, corpo: Object.assign({ sportello: 'pubblicazione', v: VERSIONE, ora: iso(ora()) }, corpo) });

    /* ---------- L'elenco completo degli eventi (riservato): pubblicati e sospesi, senza quelli già usciti ---------- */
    async function statoVivo(t) {
      const s = await leggiJson(F.stato, null) || {};
      const vivo = ev => E.uscitaMs(ev) > t, tutti = (s.eventi || []).concat(s.sospesi || []);
      const eventi = (s.eventi || []).filter(vivo), sospesi = (s.sospesi || []).filter(vivo);
      /* gli eventi nascosti restano fino alla fine del giorno in cui escono dalla mappa (ora italiana) */
      const vivoN = x => !!x && N.vivo(x.giorno, t), nascosti = (s.nascosti || []).filter(vivoN), nascostiSospesi = (s.nascostiSospesi || []).filter(vivoN);
      return { eventi, sospesi, nascosti, nascostiSospesi, usciti: tutti.length - eventi.length - sospesi.length, aggiornato: s.aggiornato || null };
    }
    /* Ogni evento passa dallo stesso controllo dell'app (sorgenti/moduli/eventi.js): se uno solo non lo supera, il
       pacchetto si rifiuta intero e non si scrive nulla. */
    function controllaEventi(lista) {
      const dettagli = [], visti = new Set();
      for (const ev of lista) {
        const err = E.controlla(ev, opzEv);
        if (!err.length && !Q.quadrante(ev.lat, ev.lng)) err.push('fuori dalla griglia');
        if (!err.length && visti.has(ev.id)) err.push('identificativo ripetuto');
        if (!err.length) visti.add(ev.id);
        else dettagli.push({ id: ev && typeof ev.id === 'string' ? corto(ev.id) : null, errori: err.slice(0, 5).map(x => String(x).slice(0, 200)) });
      }
      if (dettagli.length) throw rifiuto('evento', { dettagli: dettagli.slice(0, 20) });
    }
    /* Un evento nascosto arriva come {id, impronta, giorno, file}: lo sportello ne controlla soltanto la forma (il
       contenuto non lo sa leggere). Due voci dello stesso pacchetto con lo stesso identificativo o la stessa impronta
       fanno rifiutare il pacchetto intero. */
    function controllaNascosti(lista) {
      const dettagli = [], ids = new Set(), impronte = new Set();
      for (const x of lista) {
        const err = [];
        if (!x || typeof x !== 'object' || Array.isArray(x) || Object.keys(x).sort().join() !== 'file,giorno,id,impronta') err.push('campi diversi da id, impronta, giorno, file');
        else {
          if (typeof x.id !== 'string' || !E.ID.test(x.id)) err.push('id');
          if (typeof x.impronta !== 'string' || !N.IMPRONTA.test(x.impronta)) err.push('impronta');
          if (!N.giornoValido(x.giorno)) err.push('giorno');
          err.push(...N.controllaFile(x.file));
        }
        if (!err.length && (ids.has(x.id) || impronte.has(x.impronta))) throw rifiuto('impronta', { id: corto(x.id) });
        if (!err.length) { ids.add(x.id); impronte.add(x.impronta); }
        else dettagli.push({ id: x && typeof x.id === 'string' ? corto(x.id) : null, errori: err.slice(0, 5) });
      }
      if (dettagli.length) throw rifiuto('nascosto', { dettagli: dettagli.slice(0, 20) });
    }
    const lista = (c, k) => { const v = c[k]; if (v === undefined) return []; if (!Array.isArray(v) || v.length > MAX_EVENTI) throw rifiuto('contenuto'); return v; };

    /* ---------- Scrivere: l'elenco riservato, la copia datata nello storico, poi l'archivio pubblico ----------
       Prima ciò che è riservato, poi i file pubblici: se la scrittura si interrompe a metà, la pubblicazione seguente
       ricostruisce tutto dall'elenco. I file dei quadranti hanno la versione nel nome: si scrivono quelli nuovi, poi
       l'indice, e si tolgono subito tutti quelli che l'indice nuovo non nomina: un evento ritirato o sospeso non deve
       restare leggibile in un file vecchio. Il telefono che ha ancora l'indice di prima e non trova più un file
       richiede l'indice (sorgenti/moduli/archivio.js). */
    async function pubblica(p, t, operazione, riepilogo, eventi, sospesi, registro, nascosti, nascostiSospesi) {
      nascosti = nascosti || []; nascostiSospesi = nascostiSospesi || [];
      const { file } = Q.costruisci(eventi, Object.assign({ adesso: t, regioni }, opzEv || {}));
      const quando = iso(t), nome = quando.replace(/[:.]/g, '-') + '-' + p.numero.slice(0, 8);
      await scriviJson(F.stato, { v: VERSIONE, aggiornato: quando, eventi, sospesi, nascosti, nascostiSospesi });
      if (registro) {
        await scriviJson(F.codici, registro.tutti);
        await scriviJson(F.righe + nome + '.json', { tipo: TIPO_RIGHE, v: VERSIONE, nome, quando, dispositivo: p.dispositivo, codici: registro.codici, busta: registro.busta });
      }
      await scriviJson(F.copie + nome + '.json', { tipo: TIPO_COPIA, v: VERSIONE, nome, quando, dispositivo: p.dispositivo, operazione, riepilogo, eventi, sospesi, nascosti, nascostiSospesi, pacchetto: p });
      const elenco = await leggiJson(F.elenco, []);
      const conti = Object.fromEntries(Object.entries(riepilogo).map(([k, v]) => [k, Array.isArray(v) ? v.length : v]));
      elenco.push({ nome, quando, dispositivo: p.dispositivo, operazione, riepilogo: conti, eventi: eventi.length, sospesi: sospesi.length, nascosti: nascosti.length, nascostiSospesi: nascostiSospesi.length });
      await scriviJson(F.elenco, elenco);

      const presenti = await dep.elenca(PUB + 'quadranti/');
      for (const [f, testo] of Object.entries(file)) if (f !== 'indice.json' && !presenti.includes(PUB + f)) await dep.scrivi(PUB + f, testo);
      await dep.scrivi(PUB + 'indice.json', file['indice.json']);
      for (const f of presenti) if (!(f.slice(PUB.length) in file)) await dep.togli(f);
      /* Gli eventi nascosti: un file per evento, con l'impronta come nome. Il nome non cambia con una correzione (la
         password resta la stessa, decisione del 25/11/2026): il file si riscrive solo se è cambiato, e la rete di consegna
         va aggiornata anche per lui. I file degli eventi sospesi, ritirati o usciti si tolgono subito. */
      const voluti = new Map(nascosti.map(x => [NASC + x.impronta + '.json', JSON.stringify(x.file)])), cambiati = [];
      for (const [f, testo] of voluti) if ((await dep.leggi(f)) !== testo) { await dep.scrivi(f, testo); cambiati.push(f.slice(PUB.length)); }
      for (const f of await dep.elenca(NASC)) if (!voluti.has(f)) { await dep.togli(f); cambiati.push(f.slice(PUB.length)); }
      if (o.svuota) { try { await o.svuota(['indice.json'].concat(cambiati)); } catch (e) { /* la rete di consegna si aggiorna da sé alla scadenza */ } }
      return Object.assign({ quando, copia: nome, eventi: eventi.length, sospesi: sospesi.length, nascosti: nascosti.length, nascostiSospesi: nascostiSospesi.length, riepilogo }, registro ? { registro: { codici: registro.codici } } : {});
    }
    /* La busta del registro: solo la forma, senza aprirla. Ai codici: un codice F per ogni evento che ancora non ne ha
       uno (pubblicato, corretto o ritirato), lo stesso di prima per quelli che l'hanno già. */
    function bustaValida(b) {
      return !!b && typeof b === 'object' && !Array.isArray(b) && b.tipo === TIPO_BUSTA && b.v === 1 && Object.keys(b).every(k => ['tipo', 'v', 'iv', 'dati'].includes(k)) &&
        typeof b.iv === 'string' && /^[A-Za-z0-9_-]{16}$/.test(b.iv) && typeof b.dati === 'string' && /^[A-Za-z0-9_-]+$/.test(b.dati) && b.dati.length <= MAX_BUSTA;
    }
    async function codiciRegistro(ids, da) {
      const tutti = await leggiJson(F.codici, null) || { prossimo: 1, codici: {} }, codici = {};
      if (da) tutti.prossimo = Math.max(tutti.prossimo, da);
      for (const id of ids) {
        if (!tutti.codici[id]) tutti.codici[id] = 'F-' + String(tutti.prossimo++).padStart(5, '0');
        codici[id] = tutti.codici[id];
      }
      return { tutti, codici };
    }

    const OPERA = {
      /* Pubblicare o correggere (un evento con un identificativo già pubblicato lo sostituisce), sospendere (l'evento
         esce dall'archivio pubblico e resta nell'elenco riservato: § 3.13, limitazione), riattivare, ritirare prima
         della fine con il motivo (cap. 22). */
      async scrivi(c, p, t) {
        const pub = lista(c, 'pubblica'), nas = lista(c, 'nascosti'), sos = lista(c, 'sospendi'), ria = lista(c, 'riattiva'), rit = lista(c, 'ritira');
        if (!(pub.length + nas.length + sos.length + ria.length + rit.length)) throw rifiuto('vuoto');
        if (c.registro !== undefined && (!bustaValida(c.registro) || !(pub.length + nas.length + rit.length))) throw rifiuto('registro');
        if (c.registroDa !== undefined && (c.registro === undefined || !Number.isInteger(c.registroDa) || c.registroDa < 1 || c.registroDa > MAX_F)) throw rifiuto('registro');
        controllaEventi(pub); controllaNascosti(nas);
        const s = await statoVivo(t), eventi = new Map(s.eventi.map(e => [e.id, e])), sospesi = new Map(s.sospesi.map(e => [e.id, e]));
        const nascosti = new Map(s.nascosti.map(x => [x.id, x])), nascSos = new Map(s.nascostiSospesi.map(x => [x.id, x]));
        const nascosto = id => nascosti.has(id) || nascSos.has(id), pubblico = id => eventi.has(id) || sospesi.has(id);
        const r = { pubblicati: [], corretti: [], sospesi: [], riattivati: [], ritirati: [] };
        for (const ev of pub) {
          if (E.uscitaMs(ev) <= t) throw rifiuto('passato', { id: corto(ev.id) });
          if (nascosto(ev.id)) throw rifiuto('nascosto', { id: corto(ev.id) });   // un evento nascosto non diventa pubblico
          if (sospesi.has(ev.id)) { sospesi.set(ev.id, ev); r.corretti.push(ev.id); }   // un evento sospeso si corregge e resta sospeso
          else { (eventi.has(ev.id) ? r.corretti : r.pubblicati).push(ev.id); eventi.set(ev.id, ev); }
        }
        /* Gli eventi nascosti: nuovi o corretti. Una correzione ha la stessa impronta (la stessa password); un'impronta
           che appartiene a un altro evento nascosto vuol dire una password già usata, e il pacchetto si rifiuta. */
        for (const x of nas) {
          if (!N.vivo(x.giorno, t)) throw rifiuto('passato', { id: corto(x.id) });
          if (pubblico(x.id)) throw rifiuto('nascosto', { id: corto(x.id) });
          const prima = nascosti.get(x.id) || nascSos.get(x.id);
          if ((prima && prima.impronta !== x.impronta) || [...nascosti.values(), ...nascSos.values()].some(y => y.impronta === x.impronta && y.id !== x.id)) throw rifiuto('impronta', { id: corto(x.id) });
          if (nascSos.has(x.id)) { nascSos.set(x.id, x); r.corretti.push(x.id); }
          else { (nascosti.has(x.id) ? r.corretti : r.pubblicati).push(x.id); nascosti.set(x.id, x); }
        }
        const sposta = (da, a, id) => { a.set(id, da.get(id)); da.delete(id); };
        for (const id of sos) { if (eventi.has(id)) sposta(eventi, sospesi, id); else if (nascosti.has(id)) sposta(nascosti, nascSos, id); else throw rifiuto('manca', { id: corto(id) }); r.sospesi.push(id); }
        for (const id of ria) { if (sospesi.has(id)) sposta(sospesi, eventi, id); else if (nascSos.has(id)) sposta(nascSos, nascosti, id); else throw rifiuto('manca', { id: corto(id) }); r.riattivati.push(id); }
        for (const x of rit) {
          if (!x || typeof x !== 'object' || typeof x.id !== 'string' || !MOTIVI.includes(x.motivo) ||
            (x.riferimento !== undefined && (typeof x.riferimento !== 'string' || x.riferimento.length > 40 || !RIGA.test(x.riferimento)))) throw rifiuto('ritiro');
          if (!pubblico(x.id) && !nascosto(x.id)) throw rifiuto('manca', { id: corto(x.id) });
          eventi.delete(x.id); sospesi.delete(x.id); nascosti.delete(x.id); nascSos.delete(x.id);
          r.ritirati.push(Object.assign({ id: x.id, motivo: x.motivo }, x.riferimento ? { riferimento: x.riferimento } : {}));
        }
        const reg = c.registro === undefined ? null : Object.assign(await codiciRegistro(r.pubblicati.concat(r.corretti, r.ritirati.map(x => x.id)), c.registroDa), { busta: c.registro });
        return pubblica(p, t, 'scrivi', r, [...eventi.values()], [...sospesi.values()], reg, [...nascosti.values()], [...nascSos.values()]);
      },
      /* Ripristinare una copia dello storico: la Redazione la legge, ripete le rimozioni di nomi chieste dopo la sua
         data (§ 3.13, passo 4) e rimanda gli eventi firmati; l'elenco di prima viene sostituito. */
      async ripristina(c, p, t) {
        if (typeof c.da !== 'string' || !NOME_COPIA.test(c.da) || !(await leggiJson(F.elenco, [])).some(x => x.nome === c.da)) throw rifiuto('copia');
        const ev = lista(c, 'eventi'), sos = lista(c, 'sospesi'), nas = lista(c, 'nascosti'), nsos = lista(c, 'nascostiSospesi');
        controllaEventi(ev.concat(sos)); controllaNascosti(nas.concat(nsos));
        const ids = new Set(ev.concat(sos).map(e => e.id)), doppio = nas.concat(nsos).find(x => ids.has(x.id));
        if (doppio) throw rifiuto('nascosto', { id: corto(doppio.id) });
        /* gli eventi nascosti della copia tornano così come sono, cifrati: la Redazione può soltanto toglierli */
        const vivo = e => E.uscitaMs(e) > t, vivoN = x => N.vivo(x.giorno, t);
        return pubblica(p, t, 'ripristina', { da: c.da }, ev.filter(vivo), sos.filter(vivo), null, nas.filter(vivoN), nsos.filter(vivoN));
      },
      /* Letture riservate alla Redazione: anche queste chiedono la firma. */
      async stato(c, p, t) { const s = await statoVivo(t); return { eventi: s.eventi, sospesi: s.sospesi, nascosti: s.nascosti, nascostiSospesi: s.nascostiSospesi, aggiornato: s.aggiornato, copie: (await leggiJson(F.elenco, [])).length }; },
      async storico(c, p, t) {
        const elenco = await leggiJson(F.elenco, []);
        return { copie: elenco.slice().reverse().map(x => Object.assign({}, x, Date.parse(x.quando) < t - CINQUE_ANNI_MS ? { scaduta: true } : {})) };
      },
      /* Il registro delle fonti come lo conserva lo sportello (T-043): le buste arrivate dopo la copia «dopo» (tutte, se
         manca), al più 500 per volta, e gli eventi pubblicati per la prima volta tra «da» e «a» (date gg: aaaa-mm-gg,
         comprese), letti dalle copie dello storico. Le buste restano chiuse: le apre solo la Redazione. */
      async registro(c, p, t) {
        if (c.dopo !== undefined && (typeof c.dopo !== 'string' || !NOME_COPIA.test(c.dopo))) throw rifiuto('registro');
        const giorno = x => x === undefined || (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x));
        if (!giorno(c.da) || !giorno(c.a)) throw rifiuto('registro');
        const elenco = await leggiJson(F.elenco, []), tutti = await leggiJson(F.codici, null) || { prossimo: 1, codici: {} };
        const nomi = (await dep.elenca(F.righe)).map(x => x.slice(F.righe.length).replace(/\.json$/, '')).filter(n => NOME_COPIA.test(n) && (!c.dopo || n > c.dopo)).sort();
        const buste = [];
        for (const n of nomi.slice(0, MAX_BUSTE)) {
          const x = await leggiJson(F.righe + n + '.json', null);
          if (x && x.tipo === TIPO_RIGHE && bustaValida(x.busta)) buste.push({ nome: x.nome, quando: x.quando, dispositivo: x.dispositivo, codici: x.codici || {}, busta: x.busta });
        }
        const pubblicati = []; let lette = 0;
        if (c.da || c.a) {
          for (const x of elenco) {
            const g = String(x.quando || '').slice(0, 10);
            if (x.operazione !== 'scrivi' || !(x.riepilogo && x.riepilogo.pubblicati) || (c.da && g < c.da) || (c.a && g > c.a)) continue;
            if (++lette > MAX_COPIE_LETTE) break;
            const k = await leggiJson(F.copie + x.nome + '.json', null);
            if (k && k.tipo === TIPO_COPIA) for (const id of (k.riepilogo && k.riepilogo.pubblicati) || []) pubblicati.push({ id, quando: k.quando, copia: k.nome, codice: tutti.codici[id] || '' });
          }
        }
        return { buste, altre: nomi.length > MAX_BUSTE, pubblicati, troppe: lette > MAX_COPIE_LETTE, prossimo: tutti.prossimo };
      },
      async copia(c) {
        if (typeof c.nome !== 'string' || !NOME_COPIA.test(c.nome)) throw rifiuto('copia');
        const k = await leggiJson(F.copie + c.nome + '.json', null);
        if (!k || k.tipo !== TIPO_COPIA) throw rifiuto('copia');
        return { copia: { nome: k.nome, quando: k.quando, dispositivo: k.dispositivo, operazione: k.operazione, riepilogo: k.riepilogo, eventi: k.eventi, sospesi: k.sospesi,
          nascosti: k.nascosti || [], nascostiSospesi: k.nascostiSospesi || [] } };
      }
    };

    /* ---------- La porta: un pacchetto alla volta ---------- */
    async function tratta(testo) {
      let letto; try { letto = P.leggi(testo); } catch (e) { return risposta(400, { esito: 'rifiutato', motivo: 'forma' }); }
      const p = letto.pacchetto, c = letto.contenuto, t = ora(), imp = p.dispositivo.impronta;
      const no = (stato, motivo, extra) => risposta(stato, Object.assign({ esito: 'rifiutato', motivo }, extra || {}));
      const chiavi = await leggiJson(F.chiavi, {});
      if ((chiavi.revocate || []).some(k => k.impronta === imp)) return no(403, 'revocata');
      const nota = (chiavi.ammesse || []).find(k => k.impronta === imp);
      if (!nota) return no(403, 'sconosciuto');   // non è un dispositivo della Redazione: rifiutato subito, senza contare nulla
      const tentativi = await leggiJson(F.tentativi, {}), mio = tentativi[imp] || { errori: [] };
      if (mio.fermo_fino > t) return no(429, 'fermo', { fino: iso(mio.fermo_fino) });
      if (!(await P.verifica(p, nota.pubblica, cripto))) {
        mio.errori = (mio.errori || []).filter(x => x > t - QUARTO_MS).concat([t]);
        const fermo = mio.errori.length >= TENTATIVI;
        if (fermo) { mio.fermo_fino = t + FERMO_MS; mio.errori = []; }
        tentativi[imp] = mio; await scriviJson(F.tentativi, tentativi);
        return fermo ? no(429, 'fermo', { fino: iso(mio.fermo_fino) }) : no(401, 'firma');
      }
      if (Math.abs(t - Date.parse(p.quando)) > P.FINESTRA_MS) return no(400, 'tempo');
      const visti = await leggiJson(F.visti, {});
      for (const k of Object.keys(visti)) if (!(visti[k] > t - 2 * P.FINESTRA_MS)) delete visti[k];
      if (visti[p.numero]) return no(409, 'ripetuto');
      visti[p.numero] = t; await scriviJson(F.visti, visti);
      try { return risposta(200, Object.assign({ esito: 'fatto', operazione: c.operazione }, await OPERA[c.operazione](c, p, t))); }
      catch (e) { if (e && e.rifiuto) return risposta(422, Object.assign({ esito: 'rifiutato' }, e.rifiuto)); throw e; }
    }
    let coda = Promise.resolve();
    /* ricevi(testo del pacchetto) → {stato, corpo}: stato è il codice della risposta (200 se è andata), corpo ciò che
       lo sportello risponde, con la sua ora. */
    function ricevi(testo) {
      const r = coda.then(() => tratta(testo));
      coda = r.catch(() => {});
      return r.catch(() => risposta(500, { esito: 'rifiutato', motivo: 'guasto' }));
    }

    /* ---------- Le chiavi autorizzate: non passano dalla porta ---------- */
    async function ammetti(pubbliche) {
      const f = pubbliche && pubbliche.firma;
      if (!pubbliche || pubbliche.tipo !== TIPO_PUBBLICHE || !f || typeof f.pubblica !== 'string' || !/^[A-Za-z0-9_-]{80,100}$/.test(f.pubblica)) throw rifiuto('chiavi');
      const imp = await P.impronta(f.pubblica, cripto);
      if (imp !== f.impronta) throw rifiuto('chiavi');
      const k = await leggiJson(F.chiavi, {}); k.ammesse = k.ammesse || []; k.revocate = k.revocate || [];
      if (k.revocate.some(x => x.impronta === imp)) throw rifiuto('revocata');   // una firma revocata non torna: il dispositivo se ne fa una nuova
      k.ammesse = k.ammesse.filter(x => x.impronta !== imp).concat([{ dispositivo: String(pubbliche.dispositivo || '').slice(0, 80), impronta: imp, pubblica: f.pubblica, dal: iso(ora()) }]);
      await scriviJson(F.chiavi, k);
      return imp;
    }
    async function revoca(avviso) {
      if (!avviso || avviso.tipo !== TIPO_REVOCA || typeof avviso.impronta !== 'string' || !P.IMPRONTA.test(avviso.impronta)) throw rifiuto('chiavi');
      const k = await leggiJson(F.chiavi, {}); k.ammesse = (k.ammesse || []).filter(x => x.impronta !== avviso.impronta);
      k.revocate = (k.revocate || []).filter(x => x.impronta !== avviso.impronta).concat([{ dispositivo: String(avviso.dispositivo || '').slice(0, 80), impronta: avviso.impronta, quando: iso(ora()) }]);
      await scriviJson(F.chiavi, k);
      return avviso.impronta;
    }
    /* Chi è autorizzato e chi è revocato, senza le chiavi. */
    async function chiavi() {
      const k = await leggiJson(F.chiavi, {});
      return { ammesse: (k.ammesse || []).map(x => ({ dispositivo: x.dispositivo, impronta: x.impronta, dal: x.dal })), revocate: k.revocate || [] };
    }

    return { ricevi, ammetti, revoca, chiavi };
  }

  return { VERSIONE, TENTATIVI, QUARTO_MS, FERMO_MS, MAX_EVENTI, CINQUE_ANNI_MS, MOTIVI, PUB, RIS, NASC, TIPO_COPIA, NOME_COPIA, MAX_BUSTE, crea };
});

(window.AGR_MODULI = window.AGR_MODULI || {}).regioni = [{"nome":"Abruzzo","punto":[13.8346,42.2341],"poligoni":[[[[13.9055,42.9016],[13.8171,42.8871],[13.7607,42.8686],[13.7191,42.863],[13.7,42.8476],[13.6913,42.8239],[13.665,42.8114],[13.6378,42.8075],[13.6111,42.8116],[13.5706,42.8021],[13.5364,42.8112],[13.4977,42.7674],[13.4901,42.7441],[13.4437,42.7288],[13.4298,42.7017],[13.4116,42.6951],[13.3376,42.6877],[13.3362,42.6755],[13.348,42.6596],[13.3863,42.6444],[13.3759,42.6038],[13.3689,42.586],[13.328,42.5731],[13.286,42.5722],[13.1861,42.5869],[13.168,42.5514],[13.1363,42.5423],[13.1405,42.5286],[13.1635,42.5123],[13.1666,42.4856],[13.1285,42.4453],[13.1419,42.4153],[13.1784,42.3999],[13.1565,42.3623],[13.16,42.3408],[13.206,42.3188],[13.2275,42.2721],[13.253,42.2542],[13.2729,42.2287],[13.3051,42.219],[13.3204,42.195],[13.3675,42.1852],[13.3054,42.1675],[13.3006,42.1587],[13.3065,42.1431],[13.2955,42.1332],[13.2608,42.1386],[13.2415,42.1291],[13.0943,42.1731],[13.0733,42.1413],[13.0296,42.1156],[13.012,42.1023],[13.017,42.0546],[13.0284,42.0319],[13.072,42.019],[13.0971,42.0237],[13.2801,41.9468],[13.2979,41.947],[13.3118,41.9439],[13.3308,41.9271],[13.3686,41.9078],[13.3689,41.8948],[13.3554,41.8715],[13.3537,41.8414],[13.3611,41.8287],[13.4052,41.8316],[13.5014,41.796],[13.5255,41.7727],[13.5452,41.7682],[13.5788,41.7699],[13.5992,41.778],[13.6386,41.8078],[13.6557,41.8095],[13.7148,41.7948],[13.75,41.7518],[13.7736,41.7476],[13.8007,41.7526],[13.843,41.7338],[13.8728,41.7307],[13.9457,41.6882],[13.9646,41.6921],[14.0012,41.6875],[14.0352,41.7036],[14.063,41.7288],[14.0748,41.7311],[14.0948,41.7235],[14.1386,41.7492],[14.1829,41.7629],[14.186,41.7705],[14.1618,41.7885],[14.1423,41.8242],[14.1606,41.8418],[14.1916,41.8396],[14.2294,41.8774],[14.2829,41.9062],[14.348,41.862],[14.3767,41.8733],[14.4329,41.837],[14.4333,41.8105],[14.4517,41.7881],[14.4485,41.7669],[14.4904,41.7761],[14.5193,41.7899],[14.5766,41.8556],[14.6446,41.9188],[14.647,41.9477],[14.6735,41.9594],[14.7443,42.013],[14.7634,42.0779],[14.7407,42.0846],[14.7295,42.0991],[14.7092,42.1755],[14.6937,42.1854],[14.6535,42.1911],[14.5959,42.2086],[14.5602,42.2257],[14.429,42.3217],[14.3874,42.373],[14.2572,42.4461],[14.2206,42.4702],[14.1513,42.5316],[14.0754,42.5988],[14.0632,42.6248],[14.0012,42.6984],[13.9447,42.7983],[13.9055,42.9016]]]]},{"nome":"Basilicata","punto":[16.0866,40.4803],"poligoni":[[[[16.8633,40.3909],[16.8128,40.4363],[16.7863,40.4735],[16.7456,40.467],[16.7309,40.4775],[16.7113,40.5515],[16.7107,40.6367],[16.72,40.674],[16.6966,40.6972],[16.715,40.706],[16.7157,40.7154],[16.6912,40.7357],[16.6533,40.7439],[16.621,40.7585],[16.5869,40.7623],[16.5748,40.7581],[16.5746,40.7493],[16.538,40.7576],[16.5496,40.7355],[16.5411,40.7305],[16.5093,40.7612],[16.4201,40.7033],[16.3964,40.713],[16.3404,40.7521],[16.2454,40.8375],[16.2275,40.8598],[16.2123,40.8976],[16.1966,40.9114],[16.1597,40.9227],[16.11,40.9042],[15.9876,40.9499],[15.9818,40.962],[16.0117,40.9746],[16.0313,41.0169],[15.9625,41.0803],[15.8961,41.1028],[15.8583,41.1368],[15.7711,41.1046],[15.5964,41.1094],[15.5617,41.0861],[15.5547,41.0692],[15.5586,41.0551],[15.5762,41.0266],[15.5779,41.011],[15.5367,40.9333],[15.4709,40.9018],[15.3692,40.899],[15.3609,40.8761],[15.3658,40.8439],[15.3443,40.8207],[15.3689,40.8022],[15.3649,40.7924],[15.3737,40.7417],[15.3862,40.7183],[15.4352,40.6794],[15.4876,40.6619],[15.4873,40.647],[15.4628,40.6318],[15.4456,40.6057],[15.4558,40.5953],[15.4909,40.5861],[15.5176,40.5647],[15.5396,40.52],[15.5379,40.4846],[15.5764,40.4575],[15.5984,40.4285],[15.6228,40.4234],[15.6597,40.3922],[15.6883,40.388],[15.7013,40.3796],[15.717,40.3184],[15.7517,40.298],[15.7891,40.2618],[15.7891,40.244],[15.7755,40.2198],[15.7207,40.1889],[15.6956,40.1661],[15.6968,40.1386],[15.6498,40.0808],[15.6515,40.0727],[15.6643,40.067],[15.6467,40.0469],[15.728,39.9642],[15.7458,39.9246],[15.7765,39.9653],[15.8411,40.004],[15.8583,40.0082],[15.9035,39.9855],[15.9159,40.0022],[15.9464,40.0056],[15.982,39.9789],[16.0213,39.9869],[16.011,39.954],[16.05,39.9156],[16.0689,39.9067],[16.1974,39.9145],[16.2149,39.929],[16.2627,39.9422],[16.3077,39.9359],[16.3543,39.9008],[16.3586,39.9207],[16.344,39.9352],[16.3873,40],[16.387,40.0318],[16.3988,40.0555],[16.4134,40.1221],[16.4269,40.1366],[16.45,40.1244],[16.522,40.1211],[16.5589,40.1268],[16.64,40.1187],[16.6795,40.1461],[16.716,40.1936],[16.7307,40.2007],[16.7827,40.3016],[16.8633,40.3909]]]]},{"nome":"Calabria","punto":[16.4795,39.2393],"poligoni":[[[[16.64,40.1187],[16.5589,40.1268],[16.522,40.1211],[16.45,40.1244],[16.4269,40.1366],[16.4134,40.1221],[16.3988,40.0555],[16.387,40.0318],[16.3873,40],[16.344,39.9352],[16.3586,39.9207],[16.3543,39.9008],[16.3077,39.9359],[16.2627,39.9422],[16.2149,39.929],[16.1974,39.9145],[16.0689,39.9067],[16.05,39.9156],[16.011,39.954],[16.0213,39.9869],[15.982,39.9789],[15.9464,40.0056],[15.9159,40.0022],[15.9035,39.9855],[15.8583,40.0082],[15.8411,40.004],[15.7765,39.9653],[15.7458,39.9246],[15.7744,39.8911],[15.7819,39.8686],[15.7697,39.8301],[15.7887,39.7904],[15.7887,39.7966],[15.8064,39.6955],[15.8366,39.6527],[15.8675,39.5639],[15.8762,39.5515],[15.9331,39.5137],[15.9954,39.4388],[16.034,39.3452],[16.083,39.0753],[16.0969,39.0504],[16.1543,38.955],[16.1896,38.9435],[16.2147,38.919],[16.2217,38.8566],[16.2137,38.8104],[16.2009,38.7764],[16.1792,38.7483],[16.136,38.7238],[16.0026,38.7254],[15.9048,38.6794],[15.8445,38.6604],[15.8355,38.6282],[15.9001,38.5783],[15.916,38.5504],[15.9144,38.5056],[15.9048,38.4739],[15.8298,38.351],[15.8128,38.3006],[15.7865,38.278],[15.6506,38.241],[15.6328,38.2203],[15.6478,38.1431],[15.624,38.0921],[15.6585,38.0425],[15.6384,38.0277],[15.6351,38.0091],[15.6455,37.9883],[15.6844,37.9535],[15.7349,37.931],[15.7615,37.9252],[15.9421,37.9331],[16.001,37.919],[16.0772,37.9399],[16.1013,37.9605],[16.1255,38.0048],[16.1519,38.1108],[16.1694,38.1432],[16.3063,38.2771],[16.3399,38.3008],[16.4671,38.3487],[16.5081,38.3715],[16.5614,38.4163],[16.5696,38.4295],[16.5735,38.4673],[16.577,38.5286],[16.5588,38.596],[16.5491,38.6899],[16.5348,38.6999],[16.5388,38.7233],[16.5637,38.7567],[16.5744,38.7851],[16.6106,38.8166],[16.6707,38.8406],[16.7278,38.8789],[16.8386,38.9182],[16.8922,38.9296],[16.9351,38.9387],[16.9813,38.9372],[17.022,38.906],[17.0706,38.9228],[17.095,38.9191],[17.104,38.8991],[17.1277,38.9288],[17.1724,38.9605],[17.1724,39.0052],[17.2064,39.0295],[17.1585,39.0405],[17.1245,39.0909],[17.1222,39.121],[17.1457,39.2107],[17.1177,39.256],[17.1149,39.2828],[17.1222,39.3383],[17.1587,39.4062],[17.1242,39.409],[17.0886,39.4226],[17.0571,39.4416],[17.0192,39.4792],[16.9954,39.4927],[16.953,39.4992],[16.906,39.5297],[16.8462,39.5527],[16.8161,39.5911],[16.7825,39.6116],[16.7498,39.62],[16.6248,39.6253],[16.5459,39.6609],[16.5156,39.6896],[16.5286,39.7215],[16.5021,39.7471],[16.4898,39.7752],[16.4917,39.8055],[16.5422,39.8854],[16.5892,39.9198],[16.6316,39.9662],[16.5969,40.0468],[16.6047,40.0845],[16.64,40.1187]]]]},{"nome":"Campania","punto":[14.8228,41.0344],"poligoni":[[[[15.6467,40.0469],[15.6643,40.067],[15.6515,40.0727],[15.6498,40.0808],[15.6968,40.1386],[15.6956,40.1661],[15.7207,40.1889],[15.7755,40.2198],[15.7891,40.244],[15.7891,40.2618],[15.7517,40.298],[15.717,40.3184],[15.7013,40.3796],[15.6883,40.388],[15.6597,40.3922],[15.6228,40.4234],[15.5984,40.4285],[15.5764,40.4575],[15.5379,40.4846],[15.5396,40.52],[15.5176,40.5647],[15.4909,40.5861],[15.4558,40.5953],[15.4456,40.6057],[15.4628,40.6318],[15.4873,40.647],[15.4876,40.6619],[15.4352,40.6794],[15.3862,40.7183],[15.3737,40.7417],[15.3649,40.7924],[15.3689,40.8022],[15.3443,40.8207],[15.3658,40.8439],[15.3609,40.8761],[15.3692,40.899],[15.4709,40.9018],[15.5367,40.9333],[15.5779,41.011],[15.5762,41.0266],[15.5586,41.0551],[15.4554,41.0794],[15.406,41.1056],[15.3826,41.0975],[15.2751,41.1059],[15.2584,41.1255],[15.2089,41.1494],[15.2002,41.1594],[15.2527,41.2072],[15.2446,41.2264],[15.266,41.2354],[15.2625,41.2475],[15.2401,41.2667],[15.1787,41.2891],[15.1636,41.2773],[15.1435,41.2746],[15.1282,41.3077],[15.0801,41.3263],[15.067,41.3486],[15.069,41.3616],[15.1019,41.3906],[15.097,41.4258],[15.0724,41.4381],[15.0455,41.4639],[14.9953,41.4821],[14.9268,41.4516],[14.827,41.4257],[14.7796,41.4447],[14.7642,41.4208],[14.7468,41.4097],[14.6592,41.4032],[14.5946,41.3708],[14.5783,41.3726],[14.5557,41.3894],[14.5138,41.389],[14.4959,41.3904],[14.4619,41.4231],[14.4337,41.4257],[14.3827,41.442],[14.2951,41.4694],[14.2714,41.4836],[14.2225,41.4948],[14.1637,41.4907],[14.1209,41.4957],[14.0802,41.4477],[14.0833,41.4377],[14.1058,41.4188],[14.1096,41.3955],[14.0883,41.3887],[14.0315,41.3981],[13.988,41.4581],[13.9618,41.4707],[13.9449,41.4681],[13.9095,41.4424],[13.8602,41.423],[13.8754,41.3936],[13.8726,41.3354],[13.8631,41.2993],[13.8175,41.2766],[13.81,41.2567],[13.7437,41.2376],[13.7905,41.2059],[13.8517,41.1473],[13.9107,41.0646],[13.918,41.0237],[13.9653,40.9964],[14.0101,40.9368],[14.0445,40.8742],[14.0523,40.8376],[14.0412,40.7965],[14.0477,40.7896],[14.0825,40.7835],[14.0762,40.8222],[14.0825,40.8313],[14.096,40.8338],[14.1352,40.8186],[14.1656,40.8158],[14.1822,40.8009],[14.2035,40.8012],[14.2236,40.8314],[14.2484,40.8377],[14.2942,40.8388],[14.3944,40.7616],[14.4213,40.7509],[14.4426,40.7551],[14.4741,40.7297],[14.4764,40.6951],[14.4442,40.686],[14.3874,40.6369],[14.3377,40.6244],[14.328,40.6054],[14.3298,40.5845],[14.3426,40.5706],[14.3558,40.5836],[14.422,40.6155],[14.4714,40.6247],[14.4866,40.6326],[14.5442,40.6136],[14.5713,40.6177],[14.6133,40.6459],[14.6904,40.6491],[14.72,40.6668],[14.7522,40.6767],[14.782,40.6699],[14.8097,40.653],[14.8615,40.6072],[14.8888,40.5731],[14.9983,40.3976],[15.0004,40.3688],[14.9945,40.3584],[14.9324,40.3337],[14.9391,40.3071],[14.9319,40.2855],[14.9069,40.2586],[14.9111,40.2416],[14.9381,40.2278],[14.9571,40.2316],[15.0031,40.2103],[15.0472,40.1689],[15.0657,40.1666],[15.1128,40.1748],[15.1272,40.1696],[15.19,40.1191],[15.2339,40.1],[15.2634,40.0737],[15.2791,40.0477],[15.2612,40.0362],[15.2612,40.0294],[15.3143,40.0338],[15.3432,40.0041],[15.4101,39.994],[15.4296,39.9998],[15.4598,40.0294],[15.4953,40.0467],[15.5131,40.0677],[15.5349,40.0778],[15.6102,40.0732],[15.6243,40.0778],[15.6247,40.0649],[15.6467,40.0469]]],[[[13.9447,40.7016],[13.9658,40.7153],[13.9658,40.7351],[13.8831,40.7624],[13.8628,40.7624],[13.8701,40.7487],[13.8615,40.744],[13.8491,40.7153],[13.8901,40.6942],[13.9198,40.7045],[13.9447,40.7016]]]]},{"nome":"Emilia-Romagna","punto":[11.0609,44.5265],"poligoni":[[[[12.4211,43.8952],[12.3996,43.9032],[12.3856,43.9245],[12.3957,43.9484],[12.4214,43.9672],[12.4822,43.9826],[12.4924,43.9564],[12.4831,43.9292],[12.5423,43.9035],[12.555,43.8752],[12.5753,43.8936],[12.5878,43.8954],[12.6216,43.8466],[12.675,43.8433],[12.6968,43.8655],[12.7282,43.8791],[12.7407,43.8978],[12.7372,43.9309],[12.7538,43.9724],[12.7103,43.9829],[12.6609,44.0083],[12.5742,44.0856],[12.5474,44.0935],[12.4788,44.1394],[12.458,44.1664],[12.4172,44.1955],[12.3856,44.2285],[12.3503,44.2882],[12.3421,44.3295],[12.3182,44.3612],[12.2837,44.4876],[12.2858,44.6027],[12.2696,44.6298],[12.2527,44.6684],[12.2466,44.7116],[12.28,44.8205],[12.2664,44.8205],[12.2664,44.8266],[12.2923,44.8432],[12.303,44.8429],[12.3757,44.7922],[12.3934,44.7935],[12.3497,44.818],[12.3365,44.8486],[12.2934,44.8648],[12.2842,44.9046],[12.2948,44.9274],[12.2876,44.9354],[12.2233,44.9261],[12.1745,44.9368],[12.148,44.9334],[12.1291,44.9401],[12.1157,44.959],[12.0872,44.9705],[11.9783,44.9856],[11.9305,44.9785],[11.8696,44.9854],[11.7973,44.9776],[11.7837,44.964],[11.7475,44.9567],[11.7357,44.9385],[11.6775,44.9224],[11.6403,44.8983],[11.6223,44.8951],[11.5249,44.94],[11.4885,44.9435],[11.4319,44.9377],[11.4215,44.9499],[11.3709,44.9581],[11.303,44.9601],[11.2796,44.9427],[11.257,44.9473],[11.1634,44.9315],[11.1447,44.9457],[11.0831,44.9619],[10.9994,44.9534],[10.9748,44.9359],[10.8878,44.914],[10.8596,44.927],[10.7645,44.9436],[10.7586,44.9482],[10.7634,44.9649],[10.7543,44.9765],[10.7372,44.986],[10.6925,44.9904],[10.6803,44.9871],[10.6327,44.9395],[10.6012,44.9224],[10.5655,44.9157],[10.5015,44.9194],[10.4436,44.9367],[10.414,44.9848],[10.3992,44.9913],[10.3504,44.984],[10.2237,45.0382],[10.1835,45.0466],[10.1049,45.0352],[10.0719,45.0375],[10.0463,45.0658],[10.0215,45.1101],[9.9979,45.1247],[9.9866,45.1287],[9.916,45.108],[9.9231,45.1301],[9.9039,45.1385],[9.8829,45.1341],[9.885,45.1179],[9.8996,45.0992],[9.8959,45.0919],[9.8302,45.0963],[9.8402,45.0738],[9.8337,45.0683],[9.8244,45.0687],[9.8118,45.0847],[9.7751,45.1015],[9.7645,45.1148],[9.7522,45.108],[9.7525,45.082],[9.7223,45.0723],[9.6814,45.0753],[9.6369,45.0939],[9.6404,45.1261],[9.6145,45.1255],[9.5904,45.1126],[9.5734,45.1148],[9.5527,45.1348],[9.546,45.1327],[9.5389,45.1242],[9.5419,45.086],[9.5006,45.1031],[9.425,45.1012],[9.3065,44.9249],[9.3046,44.8917],[9.351,44.8695],[9.3583,44.8565],[9.3552,44.8265],[9.3059,44.7588],[9.3226,44.7162],[9.3195,44.7036],[9.3017,44.6941],[9.2749,44.6961],[9.2514,44.7157],[9.2421,44.683],[9.2327,44.6788],[9.2014,44.6821],[9.2031,44.6138],[9.2251,44.6203],[9.2582,44.6045],[9.2904,44.6093],[9.3605,44.5819],[9.3867,44.5833],[9.408,44.5962],[9.432,44.5771],[9.4803,44.563],[9.4913,44.551],[9.4911,44.5057],[9.4762,44.4863],[9.4527,44.472],[9.4361,44.4199],[9.4404,44.4116],[9.4764,44.4125],[9.5124,44.429],[9.5985,44.4272],[9.6514,44.4062],[9.6736,44.3697],[9.6898,44.3577],[9.6915,44.3728],[9.7514,44.3892],[9.7621,44.4094],[9.8356,44.4763],[9.8663,44.483],[9.9356,44.4704],[9.9899,44.448],[10.002,44.4326],[9.9851,44.4163],[9.9913,44.4066],[10.0726,44.3521],[10.1218,44.3482],[10.1357,44.3418],[10.1994,44.3183],[10.2293,44.2815],[10.2539,44.2706],[10.2878,44.2824],[10.351,44.2749],[10.4002,44.2359],[10.4712,44.2246],[10.4816,44.1898],[10.5223,44.1555],[10.5704,44.1256],[10.6105,44.1257],[10.636,44.1535],[10.7074,44.162],[10.734,44.1547],[10.8159,44.1135],[10.9232,44.068],[10.9853,44.1259],[10.9907,44.14],[11.0044,44.1407],[11.0173,44.1335],[11.0013,44.1127],[11.0079,44.1041],[11.0483,44.0924],[11.2001,44.1047],[11.2294,44.1027],[11.2564,44.116],[11.203,44.1383],[11.1967,44.1469],[11.2002,44.1566],[11.2911,44.1708],[11.3343,44.2066],[11.3757,44.2117],[11.3965,44.2341],[11.4319,44.2271],[11.4494,44.2044],[11.496,44.1665],[11.5263,44.1622],[11.5511,44.1627],[11.5718,44.1737],[11.5883,44.1706],[11.6108,44.1523],[11.5882,44.1288],[11.6343,44.1178],[11.72,44.1317],[11.7414,44.1317],[11.7472,44.1216],[11.7202,44.0702],[11.6848,44.0267],[11.6524,44.0177],[11.6501,43.995],[11.6856,43.9621],[11.6854,43.9385],[11.7062,43.9241],[11.7089,43.8848],[11.7163,43.8791],[11.7849,43.8475],[11.813,43.8244],[11.885,43.8154],[11.9357,43.7954],[11.9686,43.7731],[12.0678,43.7543],[12.1022,43.759],[12.1415,43.7625],[12.1852,43.7429],[12.2138,43.763],[12.2499,43.7618],[12.2681,43.7714],[12.2858,43.7689],[12.285,43.7947],[12.3216,43.8137],[12.335,43.8279],[12.3515,43.87],[12.3877,43.8838],[12.4133,43.8739],[12.4224,43.8821],[12.4211,43.8952]],[[12.1993,43.7805],[12.1822,43.7888],[12.1708,43.8046],[12.1776,43.8217],[12.2267,43.8144],[12.239,43.8075],[12.2386,43.7988],[12.1993,43.7805]]]]},{"nome":"Friuli-Venezia Giulia","punto":[12.9735,46.2224],"poligoni":[[[[12.7485,46.641],[12.7602,46.5369],[12.6816,46.525],[12.6464,46.5018],[12.6423,46.4913],[12.6703,46.477],[12.6699,46.4591],[12.5931,46.4637],[12.5512,46.4574],[12.5202,46.4423],[12.5001,46.4042],[12.4447,46.3377],[12.3704,46.3063],[12.3359,46.2695],[12.3429,46.2577],[12.3828,46.2299],[12.4196,46.2256],[12.4314,46.2118],[12.4529,46.2097],[12.4628,46.1784],[12.495,46.1557],[12.4992,46.1066],[12.4442,46.0827],[12.419,46.0507],[12.4224,46.0431],[12.4478,45.9597],[12.5263,45.9204],[12.5642,45.842],[12.6031,45.8262],[12.6389,45.8321],[12.6609,45.819],[12.6728,45.8021],[12.699,45.8036],[12.7395,45.8315],[12.7704,45.8385],[12.792,45.8562],[12.8107,45.8469],[12.8154,45.8313],[12.8267,45.8244],[12.8557,45.8445],[12.8701,45.8468],[12.8837,45.842],[12.8946,45.8258],[12.9468,45.8193],[12.9729,45.8426],[12.9993,45.8255],[13.0019,45.782],[13.0258,45.7595],[13.0289,45.7428],[13.0956,45.6523],[13.103,45.669],[13.138,45.6894],[13.1497,45.7038],[13.0915,45.6892],[13.075,45.6968],[13.0696,45.7137],[13.0806,45.7276],[13.1006,45.7362],[13.1229,45.7372],[13.1082,45.7582],[13.1193,45.772],[13.1314,45.7689],[13.1497,45.7515],[13.1694,45.7687],[13.2155,45.7788],[13.2549,45.756],[13.3518,45.7403],[13.3694,45.7446],[13.3817,45.73],[13.4226,45.7241],[13.4314,45.7069],[13.4248,45.6986],[13.3767,45.6832],[13.4017,45.6754],[13.428,45.6811],[13.4692,45.7069],[13.5078,45.7144],[13.5184,45.7248],[13.5549,45.7372],[13.5283,45.7405],[13.5242,45.7601],[13.5344,45.7821],[13.5513,45.7924],[13.5833,45.7868],[13.6473,45.762],[13.7262,45.7038],[13.7537,45.6723],[13.7577,45.655],[13.7393,45.6491],[13.7771,45.6354],[13.7956,45.617],[13.8081,45.6143],[13.7302,45.6131],[13.7118,45.5932],[13.7611,45.5962],[13.8005,45.5813],[13.8478,45.5847],[13.8947,45.6318],[13.8584,45.6494],[13.7787,45.7434],[13.7095,45.7653],[13.6603,45.792],[13.5885,45.8065],[13.566,45.8303],[13.5693,45.8645],[13.6082,45.9266],[13.6228,45.9664],[13.6059,45.9854],[13.5394,45.969],[13.5094,45.9674],[13.4618,46.0064],[13.49,46.0256],[13.4903,46.0389],[13.4823,46.0448],[13.5051,46.066],[13.6164,46.125],[13.645,46.1617],[13.6374,46.1804],[13.559,46.1841],[13.5102,46.214],[13.4683,46.2234],[13.4228,46.2286],[13.4374,46.2109],[13.4101,46.208],[13.3847,46.2433],[13.3653,46.2903],[13.3913,46.3016],[13.4341,46.3539],[13.4597,46.359],[13.53,46.3883],[13.6002,46.4426],[13.6588,46.4451],[13.6775,46.4521],[13.6884,46.4678],[13.701,46.5197],[13.6703,46.5187],[13.5492,46.5458],[13.5068,46.5469],[13.478,46.5636],[13.417,46.5605],[13.3733,46.5658],[13.2714,46.5508],[13.2311,46.5522],[13.1465,46.585],[13.0645,46.598],[12.8304,46.6096],[12.7485,46.641]]]]},{"nome":"Lazio","punto":[12.652,41.9538],"poligoni":[[[[13.7437,41.2376],[13.81,41.2567],[13.8175,41.2766],[13.8631,41.2993],[13.8726,41.3354],[13.8754,41.3936],[13.8602,41.423],[13.9095,41.4424],[13.9449,41.4681],[13.9618,41.4707],[13.982,41.4865],[13.9809,41.5043],[14.0093,41.5246],[14.0087,41.5533],[13.9961,41.5734],[13.9926,41.6283],[13.9702,41.6649],[13.9457,41.6882],[13.8728,41.7307],[13.843,41.7338],[13.8007,41.7526],[13.7736,41.7476],[13.75,41.7518],[13.7148,41.7948],[13.6557,41.8095],[13.6386,41.8078],[13.5992,41.778],[13.5788,41.7699],[13.5452,41.7682],[13.5255,41.7727],[13.5014,41.796],[13.4052,41.8316],[13.3611,41.8287],[13.3537,41.8414],[13.3554,41.8715],[13.3689,41.8948],[13.3686,41.9078],[13.3308,41.9271],[13.3118,41.9439],[13.2979,41.947],[13.2801,41.9468],[13.0971,42.0237],[13.072,42.019],[13.0284,42.0319],[13.017,42.0546],[13.012,42.1023],[13.0296,42.1156],[13.0733,42.1413],[13.0943,42.1731],[13.2415,42.1291],[13.2608,42.1386],[13.2955,42.1332],[13.3065,42.1431],[13.3006,42.1587],[13.3054,42.1675],[13.3675,42.1852],[13.3204,42.195],[13.3051,42.219],[13.2729,42.2287],[13.253,42.2542],[13.2275,42.2721],[13.206,42.3188],[13.16,42.3408],[13.1565,42.3623],[13.1784,42.3999],[13.1419,42.4153],[13.1285,42.4453],[13.1666,42.4856],[13.1635,42.5123],[13.1405,42.5286],[13.1363,42.5423],[13.168,42.5514],[13.1861,42.5869],[13.286,42.5722],[13.328,42.5731],[13.3689,42.586],[13.3759,42.6038],[13.3863,42.6444],[13.348,42.6596],[13.3362,42.6755],[13.3376,42.6877],[13.3042,42.7259],[13.2744,42.7431],[13.2423,42.7356],[13.1945,42.7346],[13.1833,42.7152],[13.1878,42.6903],[13.1539,42.6451],[13.1188,42.646],[13.0908,42.6307],[13.0593,42.6238],[13.0176,42.6316],[12.9993,42.6089],[12.902,42.6096],[12.8792,42.5903],[12.8801,42.5647],[12.78,42.5271],[12.7552,42.5003],[12.7176,42.494],[12.7274,42.4668],[12.7222,42.454],[12.652,42.4438],[12.6264,42.4646],[12.6169,42.4656],[12.6084,42.4568],[12.6076,42.4223],[12.5926,42.401],[12.5369,42.3694],[12.5284,42.3695],[12.5099,42.3894],[12.4651,42.3869],[12.4311,42.3931],[12.4515,42.421],[12.4174,42.4285],[12.4174,42.4415],[12.3936,42.4625],[12.3428,42.4919],[12.319,42.498],[12.3007,42.4899],[12.2838,42.5062],[12.2715,42.5661],[12.2591,42.5656],[12.2455,42.5855],[12.2452,42.6198],[12.2358,42.6476],[12.1524,42.6758],[12.1287,42.6573],[12.0934,42.6606],[12.0251,42.6456],[11.9856,42.6754],[11.9488,42.6917],[11.928,42.7166],[11.9376,42.7287],[11.9664,42.7434],[11.9735,42.7603],[11.9331,42.7911],[11.889,42.8504],[11.8327,42.8326],[11.8009,42.8111],[11.7747,42.821],[11.7647,42.8187],[11.7472,42.7985],[11.7739,42.7806],[11.7858,42.7597],[11.8071,42.7425],[11.7889,42.711],[11.7869,42.6512],[11.7539,42.6433],[11.7352,42.6162],[11.6986,42.6017],[11.6712,42.577],[11.6206,42.5601],[11.6012,42.5695],[11.5882,42.5661],[11.5855,42.5359],[11.5659,42.5161],[11.6079,42.4873],[11.6018,42.4474],[11.5902,42.442],[11.4871,42.4305],[11.4719,42.4186],[11.4515,42.3744],[11.4893,42.3594],[11.5391,42.3489],[11.6582,42.2794],[11.7398,42.1599],[11.7502,42.1279],[11.8094,42.0664],[11.8275,42.0342],[11.9168,42.0379],[11.9346,42.0315],[11.9822,41.9997],[12.0204,41.9931],[12.0388,41.9652],[12.1475,41.9035],[12.2062,41.8273],[12.2235,41.7507],[12.239,41.7363],[12.285,41.7272],[12.3272,41.7114],[12.448,41.6308],[12.5456,41.5441],[12.6353,41.4475],[12.654,41.4656],[12.7485,41.4237],[12.7744,41.4209],[12.8622,41.4135],[12.9238,41.3798],[12.9927,41.3156],[13.0237,41.2736],[13.0446,41.2275],[13.0682,41.2217],[13.0905,41.2265],[13.1145,41.2509],[13.1512,41.2602],[13.187,41.278],[13.2858,41.2957],[13.3244,41.2948],[13.4802,41.2392],[13.4997,41.2217],[13.5144,41.2297],[13.5344,41.2081],[13.544,41.2066],[13.5755,41.2081],[13.5637,41.238],[13.5944,41.2531],[13.6566,41.2596],[13.6633,41.2507],[13.6787,41.2506],[13.7085,41.2564],[13.7437,41.2376]]],[[[13.419,40.7956],[13.4147,40.7859],[13.4269,40.7908],[13.432,40.8015],[13.419,40.7956]]]]},{"nome":"Liguria","punto":[9.0162,44.5181],"poligoni":[[[[7.6879,44.0908],[7.6899,44.0673],[7.6534,44.0397],[7.6309,43.9935],[7.5569,43.9441],[7.4779,43.8655],[7.5023,43.7922],[7.5441,43.7845],[7.572,43.7913],[7.695,43.7912],[7.7366,43.7982],[7.7858,43.822],[7.9597,43.8529],[8.0314,43.8875],[8.0677,43.8967],[8.0816,43.9152],[8.1152,43.9277],[8.1302,43.9403],[8.1447,43.9526],[8.168,43.9565],[8.1527,43.9832],[8.1691,44.0067],[8.2163,44.0452],[8.23,44.0725],[8.2332,44.1036],[8.2565,44.1284],[8.3135,44.1605],[8.3945,44.1824],[8.4082,44.1935],[8.4119,44.227],[8.4354,44.2404],[8.4497,44.2644],[8.4445,44.2839],[8.4661,44.3043],[8.5648,44.3572],[8.5938,44.3627],[8.6306,44.3819],[8.6551,44.3947],[8.6786,44.3947],[8.7372,44.4288],[8.7624,44.4321],[8.827,44.4285],[8.8454,44.4135],[8.9237,44.4116],[9.0012,44.3873],[9.1021,44.374],[9.1301,44.3633],[9.1486,44.34],[9.1467,44.3286],[9.2107,44.3053],[9.2137,44.3334],[9.2306,44.3537],[9.3677,44.2944],[9.3745,44.2718],[9.4224,44.2568],[9.4368,44.2395],[9.4844,44.2438],[9.4898,44.2309],[9.5112,44.2152],[9.573,44.1916],[9.5799,44.1789],[9.6211,44.1483],[9.6826,44.1365],[9.7718,44.0794],[9.8198,44.0634],[9.8323,44.0423],[9.8425,44.0412],[9.8464,44.0463],[9.8333,44.0521],[9.8475,44.0725],[9.8306,44.0788],[9.8196,44.093],[9.8333,44.0998],[9.8264,44.1072],[9.8447,44.1086],[9.8768,44.0878],[9.888,44.093],[9.9627,44.0447],[9.9807,44.0499],[9.9885,44.0598],[10.0285,44.0493],[10.0564,44.0907],[10.0532,44.0995],[10.0268,44.1143],[9.9899,44.1176],[9.9815,44.1501],[9.9682,44.16],[9.8986,44.1664],[9.9083,44.1913],[9.9022,44.1999],[9.8848,44.2044],[9.8617,44.1859],[9.8521,44.2526],[9.7518,44.3056],[9.6898,44.3577],[9.6736,44.3697],[9.6514,44.4062],[9.5985,44.4272],[9.5124,44.429],[9.4764,44.4125],[9.4404,44.4116],[9.4361,44.4199],[9.4527,44.472],[9.4762,44.4863],[9.4911,44.5057],[9.4913,44.551],[9.4803,44.563],[9.432,44.5771],[9.408,44.5962],[9.3867,44.5833],[9.3605,44.5819],[9.2904,44.6093],[9.2582,44.6045],[9.2251,44.6203],[9.2031,44.6138],[9.1993,44.5993],[9.1793,44.5869],[9.1544,44.5813],[9.1346,44.5835],[9.1088,44.5942],[9.0995,44.6146],[9.041,44.6322],[9.0128,44.6533],[8.9682,44.6722],[8.9592,44.6826],[8.9231,44.6828],[8.9062,44.6594],[8.8751,44.6343],[8.9066,44.6118],[8.904,44.5652],[8.8902,44.5594],[8.8257,44.5588],[8.8144,44.5344],[8.7733,44.5013],[8.7645,44.5079],[8.7648,44.5297],[8.7246,44.5786],[8.6321,44.5887],[8.6095,44.5853],[8.5972,44.562],[8.5994,44.5426],[8.5642,44.5162],[8.4763,44.5181],[8.4301,44.5118],[8.4088,44.5159],[8.387,44.5047],[8.3714,44.4864],[8.3533,44.4806],[8.2655,44.5217],[8.2498,44.5346],[8.2361,44.5323],[8.2209,44.5181],[8.1956,44.4746],[8.211,44.4457],[8.2058,44.4224],[8.1917,44.4097],[8.1641,44.3994],[8.139,44.3532],[8.0692,44.3078],[8.0777,44.2947],[8.0695,44.2257],[8.0812,44.2051],[8.0797,44.1903],[8.0485,44.1588],[8.0066,44.1645],[7.9865,44.1524],[7.9818,44.1419],[8.0004,44.13],[8.0021,44.1184],[7.9876,44.1129],[7.8344,44.1254],[7.7575,44.1438],[7.7309,44.1217],[7.738,44.0994],[7.6879,44.0908]]]]},{"nome":"Lombardia","punto":[9.7522,45.7108],"poligoni":[[[[8.729,46.1082],[8.7341,46.041],[8.7246,46.0161],[8.5885,45.9103],[8.6027,45.8388],[8.5984,45.826],[8.5696,45.8048],[8.5685,45.7895],[8.609,45.7345],[8.6489,45.7172],[8.6489,45.6809],[8.6749,45.6764],[8.6824,45.6444],[8.6646,45.6357],[8.6974,45.603],[8.7052,45.5568],[8.7206,45.5182],[8.7482,45.5003],[8.7724,45.4937],[8.811,45.4276],[8.832,45.4082],[8.7651,45.3907],[8.735,45.3755],[8.7573,45.3571],[8.7145,45.3332],[8.7027,45.3048],[8.6638,45.3126],[8.6256,45.357],[8.5722,45.3667],[8.5465,45.3642],[8.5126,45.3135],[8.4984,45.2919],[8.5156,45.277],[8.5193,45.2524],[8.5334,45.2413],[8.534,45.2176],[8.559,45.1931],[8.5515,45.1787],[8.5566,45.1648],[8.5733,45.1371],[8.6076,45.108],[8.6455,45.0412],[8.6691,45.0248],[8.6823,45.0313],[8.7131,45.0248],[8.7741,45.0276],[8.8504,45.0584],[8.8808,45.0526],[8.876,45.0176],[8.8824,45.0005],[8.9054,44.99],[8.9499,44.9846],[8.9639,44.9762],[8.9775,44.9333],[9.0533,44.8805],[9.0475,44.8526],[9.0596,44.8371],[9.0857,44.8203],[9.1406,44.8156],[9.1567,44.8067],[9.2022,44.7322],[9.2014,44.6821],[9.2327,44.6788],[9.2421,44.683],[9.2514,44.7157],[9.2749,44.6961],[9.3017,44.6941],[9.3195,44.7036],[9.3226,44.7162],[9.3059,44.7588],[9.3552,44.8265],[9.3583,44.8565],[9.351,44.8695],[9.3046,44.8917],[9.3065,44.9249],[9.425,45.1012],[9.5006,45.1031],[9.5419,45.086],[9.5389,45.1242],[9.546,45.1327],[9.5527,45.1348],[9.5734,45.1148],[9.5904,45.1126],[9.6145,45.1255],[9.6404,45.1261],[9.6369,45.0939],[9.6814,45.0753],[9.7223,45.0723],[9.7525,45.082],[9.7522,45.108],[9.7645,45.1148],[9.7751,45.1015],[9.8118,45.0847],[9.8244,45.0687],[9.8337,45.0683],[9.8402,45.0738],[9.8302,45.0963],[9.8959,45.0919],[9.8996,45.0992],[9.885,45.1179],[9.8829,45.1341],[9.9039,45.1385],[9.9231,45.1301],[9.916,45.108],[9.9866,45.1287],[9.9979,45.1247],[10.0215,45.1101],[10.0463,45.0658],[10.0719,45.0375],[10.1049,45.0352],[10.1835,45.0466],[10.2237,45.0382],[10.3504,44.984],[10.3992,44.9913],[10.414,44.9848],[10.4436,44.9367],[10.5015,44.9194],[10.5655,44.9157],[10.6012,44.9224],[10.6327,44.9395],[10.6803,44.9871],[10.6925,44.9904],[10.7372,44.986],[10.7543,44.9765],[10.7634,44.9649],[10.7586,44.9482],[10.7645,44.9436],[10.8596,44.927],[10.8878,44.914],[10.9748,44.9359],[10.9994,44.9534],[11.0831,44.9619],[11.1447,44.9457],[11.1634,44.9315],[11.257,44.9473],[11.2796,44.9427],[11.303,44.9601],[11.3709,44.9581],[11.4215,44.9499],[11.419,44.9669],[11.3889,44.9736],[11.2727,45.0338],[11.2728,45.0596],[11.1957,45.0634],[11.1912,45.0909],[11.2103,45.1043],[11.2041,45.1124],[11.1624,45.1199],[11.1094,45.1107],[11.0908,45.0993],[11.0695,45.1027],[11.0483,45.1226],[11.054,45.1472],[11.0443,45.1539],[11.0019,45.1551],[11.0053,45.18],[10.9873,45.1974],[10.9459,45.2097],[10.8486,45.2631],[10.8357,45.2809],[10.7946,45.3072],[10.7826,45.3078],[10.7611,45.2937],[10.7402,45.316],[10.6975,45.3203],[10.7064,45.3295],[10.7069,45.3537],[10.7179,45.3612],[10.7021,45.3825],[10.7024,45.4228],[10.6618,45.419],[10.643,45.448],[10.6504,45.498],[10.6405,45.563],[10.6442,45.6096],[10.7606,45.7297],[10.8449,45.8341],[10.8087,45.8454],[10.7619,45.8417],[10.734,45.8492],[10.6874,45.8453],[10.6772,45.8392],[10.6653,45.8115],[10.6158,45.808],[10.5847,45.7942],[10.5576,45.8031],[10.559,45.8244],[10.5259,45.8365],[10.5072,45.8775],[10.5195,45.9167],[10.5043,45.9394],[10.5001,45.9652],[10.466,45.9763],[10.4591,45.985],[10.4686,46.0118],[10.4946,46.0334],[10.5152,46.082],[10.5569,46.1124],[10.5654,46.1885],[10.5902,46.2334],[10.5777,46.3127],[10.5279,46.3426],[10.5519,46.3644],[10.6074,46.3698],[10.6323,46.3863],[10.6387,46.4111],[10.6247,46.4545],[10.5693,46.4809],[10.4884,46.4974],[10.4518,46.5467],[10.444,46.5377],[10.4259,46.5353],[10.3543,46.5483],[10.3195,46.546],[10.2954,46.5511],[10.2759,46.5655],[10.2347,46.5753],[10.2338,46.618],[10.2179,46.627],[10.1921,46.6268],[10.0878,46.6044],[10.0712,46.5644],[10.0328,46.533],[10.0281,46.4839],[10.044,46.467],[10.0263,46.4463],[10.0421,46.4327],[10.1334,46.414],[10.1408,46.4029],[10.1332,46.3811],[10.105,46.3614],[10.0918,46.329],[10.1049,46.3094],[10.1461,46.2803],[10.1589,46.2624],[10.1458,46.2433],[10.0757,46.22],[10.0427,46.2205],[10.0418,46.2431],[10.0317,46.2601],[9.9776,46.2981],[9.964,46.3561],[9.9184,46.3712],[9.8554,46.367],[9.7681,46.3386],[9.7201,46.3509],[9.7093,46.3424],[9.7084,46.3117],[9.6931,46.2971],[9.6743,46.2918],[9.5597,46.2927],[9.5365,46.2986],[9.5026,46.3207],[9.4826,46.3568],[9.4444,46.3753],[9.4346,46.4983],[9.4107,46.4889],[9.3955,46.4694],[9.3846,46.4664],[9.3516,46.4855],[9.3508,46.4979],[9.331,46.5015],[9.2823,46.4974],[9.2632,46.4851],[9.238,46.4365],[9.2609,46.4167],[9.2604,46.3797],[9.2752,46.3314],[9.2248,46.2312],[9.1813,46.2041],[9.1632,46.1723],[9.0906,46.1382],[9.0721,46.1189],[9.0703,46.0834],[9.0592,46.0618],[9.0021,46.0393],[8.9978,46.0279],[9.0156,45.9931],[8.9827,45.972],[8.9805,45.9644],[9.0108,45.9267],[9.0517,45.9155],[9.0631,45.899],[9.0593,45.882],[9.0344,45.8481],[9.0024,45.8207],[8.9396,45.8348],[8.9089,45.8283],[8.9,45.8264],[8.9138,45.8661],[8.9121,45.8834],[8.871,45.9471],[8.8004,45.9785],[8.7679,45.9831],[8.8344,46.0664],[8.809,46.0897],[8.7471,46.0944],[8.729,46.1082]]]]},{"nome":"Marche","punto":[13.2191,43.2852],"poligoni":[[[[12.4831,43.9292],[12.4605,43.8953],[12.4211,43.8952],[12.4224,43.8821],[12.4133,43.8739],[12.3877,43.8838],[12.3515,43.87],[12.335,43.8279],[12.3216,43.8137],[12.285,43.7947],[12.2858,43.7689],[12.3576,43.7226],[12.3544,43.7111],[12.3248,43.6834],[12.3136,43.6922],[12.3099,43.7241],[12.3019,43.7289],[12.2777,43.6897],[12.2499,43.6824],[12.2197,43.6612],[12.1958,43.6534],[12.2048,43.6168],[12.213,43.609],[12.2452,43.6064],[12.286,43.5916],[12.3108,43.6093],[12.3589,43.6194],[12.3531,43.5738],[12.3398,43.5653],[12.3097,43.5667],[12.3091,43.5521],[12.3926,43.5224],[12.4317,43.5384],[12.4883,43.522],[12.5105,43.5125],[12.6089,43.4289],[12.6386,43.4436],[12.6911,43.4343],[12.7127,43.4539],[12.7321,43.4609],[12.7582,43.4612],[12.7465,43.3788],[12.7912,43.3197],[12.7957,43.2785],[12.8517,43.2061],[12.8568,43.1756],[12.8339,43.1464],[12.8374,43.1325],[12.8677,43.1218],[12.8928,43.0939],[12.8958,43.0072],[12.9071,42.9715],[12.9298,42.9474],[12.9647,42.9268],[12.9721,42.8887],[12.9905,42.8928],[12.9886,42.9157],[13.0431,42.9193],[13.1372,42.8495],[13.1504,42.8236],[13.1667,42.8245],[13.2243,42.8477],[13.2471,42.8265],[13.2561,42.7923],[13.2489,42.7678],[13.2261,42.7585],[13.2035,42.7598],[13.1945,42.7491],[13.1945,42.7346],[13.2423,42.7356],[13.2744,42.7431],[13.3042,42.7259],[13.3376,42.6877],[13.4116,42.6951],[13.4298,42.7017],[13.4437,42.7288],[13.4901,42.7441],[13.4977,42.7674],[13.5364,42.8112],[13.5706,42.8021],[13.6111,42.8116],[13.6378,42.8075],[13.665,42.8114],[13.6913,42.8239],[13.7,42.8476],[13.7191,42.863],[13.7607,42.8686],[13.8171,42.8871],[13.9055,42.9016],[13.8654,43.0073],[13.8535,43.0674],[13.8348,43.1273],[13.7908,43.1921],[13.7803,43.2365],[13.745,43.2922],[13.647,43.4753],[13.617,43.5313],[13.6245,43.5472],[13.6156,43.5605],[13.5789,43.5729],[13.5432,43.6132],[13.521,43.6227],[13.5161,43.6317],[13.5044,43.6328],[13.4734,43.612],[13.3997,43.6356],[13.3898,43.6446],[13.2533,43.7032],[13.1772,43.7515],[12.9473,43.8976],[12.9289,43.9158],[12.8622,43.9354],[12.804,43.9669],[12.7538,43.9724],[12.7372,43.9309],[12.7407,43.8978],[12.7282,43.8791],[12.6968,43.8655],[12.675,43.8433],[12.6216,43.8466],[12.5878,43.8954],[12.5753,43.8936],[12.555,43.8752],[12.5423,43.9035],[12.4831,43.9292]],[[12.4212,43.5897],[12.4076,43.6101],[12.4162,43.6278],[12.4298,43.6315],[12.443,43.6197],[12.4448,43.6011],[12.4307,43.5897],[12.4212,43.5897]]]]},{"nome":"Molise","punto":[14.7035,41.6668],"poligoni":[[[[14.7634,42.0779],[14.7443,42.013],[14.6735,41.9594],[14.647,41.9477],[14.6446,41.9188],[14.5766,41.8556],[14.5193,41.7899],[14.4904,41.7761],[14.4485,41.7669],[14.4517,41.7881],[14.4333,41.8105],[14.4329,41.837],[14.3767,41.8733],[14.348,41.862],[14.2829,41.9062],[14.2294,41.8774],[14.1916,41.8396],[14.1606,41.8418],[14.1423,41.8242],[14.1618,41.7885],[14.186,41.7705],[14.1829,41.7629],[14.1386,41.7492],[14.0948,41.7235],[14.0748,41.7311],[14.063,41.7288],[14.0352,41.7036],[14.0012,41.6875],[13.9646,41.6921],[13.9457,41.6882],[13.9702,41.6649],[13.9926,41.6283],[13.9961,41.5734],[14.0087,41.5533],[14.0093,41.5246],[13.9809,41.5043],[13.982,41.4865],[13.9618,41.4707],[13.988,41.4581],[14.0315,41.3981],[14.0883,41.3887],[14.1096,41.3955],[14.1058,41.4188],[14.0833,41.4377],[14.0802,41.4477],[14.1209,41.4957],[14.1637,41.4907],[14.2225,41.4948],[14.2714,41.4836],[14.2951,41.4694],[14.3827,41.442],[14.4337,41.4257],[14.4619,41.4231],[14.4959,41.3904],[14.5138,41.389],[14.5557,41.3894],[14.5783,41.3726],[14.5946,41.3708],[14.6592,41.4032],[14.7468,41.4097],[14.7642,41.4208],[14.7796,41.4447],[14.827,41.4257],[14.9268,41.4516],[14.9953,41.4821],[14.935,41.526],[14.9339,41.6201],[14.958,41.6345],[15.0176,41.6197],[15.1089,41.6837],[15.1571,41.7017],[15.1571,41.7079],[15.1131,41.7183],[15.1026,41.7638],[15.1115,41.7968],[15.1073,41.8359],[15.1343,41.8757],[15.1435,41.9312],[15.1234,41.9343],[15.0345,41.9746],[14.9937,42.0106],[14.8711,42.0318],[14.8355,42.0441],[14.7801,42.0753],[14.7634,42.0779]]]]},{"nome":"Piemonte","punto":[7.9108,44.9987],"poligoni":[[[[7.8496,45.9397],[7.8559,45.9193],[7.8477,45.9077],[7.8747,45.7632],[7.8823,45.7529],[7.915,45.7382],[7.9163,45.7297],[7.911,45.6705],[7.9195,45.649],[7.8802,45.6027],[7.784,45.5814],[7.7493,45.5641],[7.7314,45.5617],[7.673,45.5636],[7.6424,45.5746],[7.538,45.5888],[7.5064,45.5786],[7.4646,45.5742],[7.3855,45.5244],[7.2328,45.4855],[7.1462,45.4922],[7.1392,45.4976],[7.1431,45.5123],[7.1379,45.5117],[7.0754,45.4663],[7.0968,45.4354],[7.1607,45.4109],[7.1508,45.3832],[7.0926,45.324],[7.1084,45.2592],[7.0812,45.2431],[7.0622,45.2185],[7.0502,45.215],[7.0297,45.2282],[6.9587,45.2098],[6.9138,45.1702],[6.8735,45.1659],[6.8682,45.1575],[6.8767,45.1412],[6.8441,45.1301],[6.7715,45.1532],[6.7364,45.1573],[6.7022,45.1412],[6.6674,45.1396],[6.6327,45.1255],[6.6027,45.1035],[6.6366,45.0745],[6.6397,45.0504],[6.6517,45.0356],[6.6622,45.0292],[6.6972,45.0269],[6.7235,45.0134],[6.7279,44.9287],[6.7454,44.9078],[6.7782,44.8876],[6.8471,44.8591],[6.866,44.8557],[6.9327,44.8617],[6.9828,44.847],[7.0008,44.833],[7.0071,44.8221],[6.9984,44.7938],[7.019,44.7389],[7.0388,44.7121],[7.0552,44.6849],[6.9828,44.6922],[6.9599,44.6832],[6.9415,44.667],[6.9343,44.6467],[6.9456,44.6254],[6.9316,44.618],[6.8973,44.5754],[6.8464,44.5475],[6.8357,44.534],[6.8388,44.5029],[6.8613,44.4749],[6.9178,44.4363],[6.8842,44.423],[6.8772,44.4144],[6.8663,44.3772],[6.8698,44.3629],[6.896,44.3398],[6.9212,44.3022],[6.9592,44.2774],[6.9734,44.2494],[6.9961,44.2378],[7.0461,44.2403],[7.145,44.2072],[7.2513,44.16],[7.3093,44.1475],[7.3216,44.1319],[7.3406,44.1237],[7.3808,44.1229],[7.5836,44.1607],[7.6247,44.1801],[7.6556,44.1761],[7.6419,44.1436],[7.6879,44.0908],[7.738,44.0994],[7.7309,44.1217],[7.7575,44.1438],[7.8344,44.1254],[7.9876,44.1129],[8.0021,44.1184],[8.0004,44.13],[7.9818,44.1419],[7.9865,44.1524],[8.0066,44.1645],[8.0485,44.1588],[8.0797,44.1903],[8.0812,44.2051],[8.0695,44.2257],[8.0777,44.2947],[8.0692,44.3078],[8.139,44.3532],[8.1641,44.3994],[8.1917,44.4097],[8.2058,44.4224],[8.211,44.4457],[8.1956,44.4746],[8.2209,44.5181],[8.2361,44.5323],[8.2498,44.5346],[8.2655,44.5217],[8.3533,44.4806],[8.3714,44.4864],[8.387,44.5047],[8.4088,44.5159],[8.4301,44.5118],[8.4763,44.5181],[8.5642,44.5162],[8.5994,44.5426],[8.5972,44.562],[8.6095,44.5853],[8.6321,44.5887],[8.7246,44.5786],[8.7648,44.5297],[8.7645,44.5079],[8.7733,44.5013],[8.8144,44.5344],[8.8257,44.5588],[8.8902,44.5594],[8.904,44.5652],[8.9066,44.6118],[8.8751,44.6343],[8.9062,44.6594],[8.9231,44.6828],[8.9592,44.6826],[8.9682,44.6722],[9.0128,44.6533],[9.041,44.6322],[9.0995,44.6146],[9.1088,44.5942],[9.1346,44.5835],[9.1544,44.5813],[9.1793,44.5869],[9.1993,44.5993],[9.2031,44.6138],[9.2014,44.6821],[9.2022,44.7322],[9.1567,44.8067],[9.1406,44.8156],[9.0857,44.8203],[9.0596,44.8371],[9.0475,44.8526],[9.0533,44.8805],[8.9775,44.9333],[8.9639,44.9762],[8.9499,44.9846],[8.9054,44.99],[8.8824,45.0005],[8.876,45.0176],[8.8808,45.0526],[8.8504,45.0584],[8.7741,45.0276],[8.7131,45.0248],[8.6823,45.0313],[8.6691,45.0248],[8.6455,45.0412],[8.6076,45.108],[8.5733,45.1371],[8.5566,45.1648],[8.5515,45.1787],[8.559,45.1931],[8.534,45.2176],[8.5334,45.2413],[8.5193,45.2524],[8.5156,45.277],[8.4984,45.2919],[8.5126,45.3135],[8.5465,45.3642],[8.5722,45.3667],[8.6256,45.357],[8.6638,45.3126],[8.7027,45.3048],[8.7145,45.3332],[8.7573,45.3571],[8.735,45.3755],[8.7651,45.3907],[8.832,45.4082],[8.811,45.4276],[8.7724,45.4937],[8.7482,45.5003],[8.7206,45.5182],[8.7052,45.5568],[8.6974,45.603],[8.6646,45.6357],[8.6824,45.6444],[8.6749,45.6764],[8.6489,45.6809],[8.6489,45.7172],[8.609,45.7345],[8.5685,45.7895],[8.5696,45.8048],[8.5984,45.826],[8.6027,45.8388],[8.5885,45.9103],[8.7246,46.0161],[8.7341,46.041],[8.729,46.1082],[8.6951,46.0952],[8.6775,46.0958],[8.6018,46.1228],[8.5387,46.1876],[8.5103,46.2079],[8.4381,46.2354],[8.4232,46.2758],[8.4463,46.3822],[8.4416,46.4349],[8.4279,46.4487],[8.3992,46.4522],[8.3434,46.4439],[8.295,46.418],[8.2866,46.4054],[8.297,46.3976],[8.2915,46.3784],[8.2418,46.3541],[8.1926,46.3092],[8.1719,46.2992],[8.1069,46.2855],[8.0773,46.262],[8.0731,46.2536],[8.1,46.2356],[8.1295,46.196],[8.1323,46.1594],[8.1106,46.127],[8.0669,46.1006],[8.0253,46.0911],[8.0107,46.0297],[7.9858,45.9993],[7.8982,45.9819],[7.8729,45.9594],[7.8702,45.9404],[7.8496,45.9397]]]]},{"nome":"Puglia","punto":[16.4742,40.9991],"poligoni":[[[[15.1435,41.9312],[15.1343,41.8757],[15.1073,41.8359],[15.1115,41.7968],[15.1026,41.7638],[15.1131,41.7183],[15.1571,41.7079],[15.1571,41.7017],[15.1089,41.6837],[15.0176,41.6197],[14.958,41.6345],[14.9339,41.6201],[14.935,41.526],[14.9953,41.4821],[15.0455,41.4639],[15.0724,41.4381],[15.097,41.4258],[15.1019,41.3906],[15.069,41.3616],[15.067,41.3486],[15.0801,41.3263],[15.1282,41.3077],[15.1435,41.2746],[15.1636,41.2773],[15.1787,41.2891],[15.2401,41.2667],[15.2625,41.2475],[15.266,41.2354],[15.2446,41.2264],[15.2527,41.2072],[15.2002,41.1594],[15.2089,41.1494],[15.2584,41.1255],[15.2751,41.1059],[15.3826,41.0975],[15.406,41.1056],[15.4554,41.0794],[15.5586,41.0551],[15.5547,41.0692],[15.5617,41.0861],[15.5964,41.1094],[15.7711,41.1046],[15.8583,41.1368],[15.8961,41.1028],[15.9625,41.0803],[16.0313,41.0169],[16.0117,40.9746],[15.9818,40.962],[15.9876,40.9499],[16.11,40.9042],[16.1597,40.9227],[16.1966,40.9114],[16.2123,40.8976],[16.2275,40.8598],[16.2454,40.8375],[16.3404,40.7521],[16.3964,40.713],[16.4201,40.7033],[16.5093,40.7612],[16.5411,40.7305],[16.5496,40.7355],[16.538,40.7576],[16.5746,40.7493],[16.5748,40.7581],[16.5869,40.7623],[16.621,40.7585],[16.6533,40.7439],[16.6912,40.7357],[16.7157,40.7154],[16.715,40.706],[16.6966,40.6972],[16.72,40.674],[16.7107,40.6367],[16.7113,40.5515],[16.7309,40.4775],[16.7456,40.467],[16.7863,40.4735],[16.8128,40.4363],[16.8633,40.3909],[16.9121,40.4452],[16.9761,40.4926],[17.0496,40.5191],[17.156,40.5124],[17.1662,40.5092],[17.19,40.4819],[17.2474,40.5028],[17.2686,40.4962],[17.2617,40.4887],[17.304,40.4995],[17.3233,40.4985],[17.3163,40.4819],[17.2957,40.4732],[17.2474,40.4803],[17.2276,40.4744],[17.2479,40.4573],[17.243,40.4414],[17.2002,40.4204],[17.2129,40.4062],[17.3682,40.3515],[17.3994,40.331],[17.4404,40.331],[17.5121,40.3037],[17.764,40.2934],[17.8477,40.29],[17.9128,40.2553],[17.9128,40.2491],[17.8997,40.2491],[17.917,40.2269],[17.926,40.1763],[17.9972,40.1204],[18.011,40.096],[18.0029,40.0744],[17.9675,40.0573],[18.0158,40.0362],[18.0203,40.0102],[18.0111,40.0034],[17.9954,40.0027],[17.9954,39.9953],[18.0715,39.9115],[18.1306,39.8835],[18.1619,39.8605],[18.2113,39.8393],[18.2656,39.8376],[18.3384,39.8001],[18.3737,39.7998],[18.3892,39.8171],[18.4001,39.8786],[18.3926,39.9161],[18.4114,39.9788],[18.4341,40.0225],[18.4836,40.0552],[18.4919,40.0847],[18.5161,40.1045],[18.5111,40.1276],[18.5161,40.1392],[18.5,40.1525],[18.4373,40.2679],[18.3705,40.3387],[18.3438,40.3516],[18.3032,40.3999],[18.2588,40.4307],[18.2383,40.4577],[18.2117,40.4647],[18.0989,40.5179],[18.0374,40.557],[18.0432,40.602],[18.0158,40.6252],[18.007,40.6507],[17.9549,40.6469],[17.9558,40.6705],[17.9219,40.683],[17.8439,40.6942],[17.7484,40.7476],[17.6345,40.785],[17.5484,40.8019],[17.5122,40.8203],[17.4761,40.8301],[17.3923,40.8937],[17.3479,40.9121],[17.3101,40.9548],[17.2764,40.9802],[17.2031,41.021],[17.0571,41.0819],[16.8853,41.124],[16.8644,41.1404],[16.8514,41.133],[16.8306,41.1463],[16.5939,41.207],[16.5442,41.2352],[16.5207,41.2501],[16.4603,41.2626],[16.3014,41.3279],[16.1141,41.3929],[16.0851,41.4127],[16.0217,41.4278],[15.9717,41.4539],[15.9336,41.4794],[15.9118,41.5029],[15.8963,41.5364],[15.8914,41.5769],[15.9001,41.6147],[15.9253,41.64],[16.0275,41.6799],[16.1072,41.7376],[16.1458,41.7488],[16.1843,41.7796],[16.1929,41.7909],[16.193,41.8084],[16.176,41.8774],[16.1792,41.8933],[16.1609,41.8926],[16.1405,41.9199],[16.0271,41.9441],[15.7744,41.9212],[15.6113,41.928],[15.4461,41.9069],[15.4006,41.9078],[15.2817,41.928],[15.1435,41.9312]]]]},{"nome":"Sardegna","punto":[9.0479,40.1175],"poligoni":[[[[8.4559,39.0736],[8.4446,39.1027],[8.3859,39.105],[8.3604,39.1182],[8.346,39.0977],[8.346,39.0909],[8.3535,39.0909],[8.3493,39.0622],[8.4098,38.9618],[8.437,38.9672],[8.4634,39.0425],[8.4593,39.0498],[8.4839,39.0698],[8.4631,39.0653],[8.4559,39.0736]]],[[[8.3058,39.1933],[8.2453,39.181],[8.23,39.1728],[8.2246,39.1571],[8.2573,39.1244],[8.2547,39.1071],[8.2694,39.1002],[8.2901,39.0988],[8.3058,39.1046],[8.312,39.1203],[8.3058,39.1933]]],[[[8.6103,38.9549],[8.615,38.923],[8.5999,38.8991],[8.6428,38.89],[8.6348,38.8712],[8.641,38.8643],[8.6551,38.8712],[8.6516,38.8915],[8.6688,38.9106],[8.7166,38.9326],[8.7666,38.9204],[8.791,38.9044],[8.8054,38.8854],[8.8054,38.906],[8.8533,38.878],[8.8775,38.8991],[8.8947,38.9023],[8.9963,38.9828],[9.0046,38.9953],[9.0151,38.9897],[9.0257,38.9953],[9.0183,38.9953],[9.0293,39.0303],[9.0449,39.0513],[9.0187,39.1039],[9.0183,39.1461],[9.0386,39.179],[9.0789,39.2123],[9.0798,39.2246],[9.075,39.2299],[9.0379,39.2271],[9.021,39.2404],[9.0257,39.256],[9.0139,39.2639],[9.0387,39.2622],[9.0637,39.2431],[9.073,39.2485],[9.1369,39.1943],[9.166,39.1871],[9.1974,39.2211],[9.2163,39.228],[9.2525,39.2252],[9.2853,39.2138],[9.2922,39.2213],[9.3451,39.1964],[9.4087,39.1461],[9.438,39.1334],[9.4429,39.1244],[9.4807,39.1356],[9.4963,39.1336],[9.5119,39.1244],[9.5071,39.1114],[9.5186,39.1046],[9.5227,39.1249],[9.5578,39.1397],[9.5664,39.1492],[9.5799,39.1871],[9.5656,39.2051],[9.5733,39.2138],[9.5676,39.2381],[9.5819,39.2663],[9.6073,39.289],[9.6346,39.2969],[9.6346,39.3032],[9.6035,39.3262],[9.6004,39.341],[9.6141,39.3994],[9.639,39.4525],[9.6449,39.484],[9.6284,39.5018],[9.6463,39.5491],[9.6558,39.5946],[9.6511,39.6525],[9.6763,39.7181],[9.6703,39.7938],[9.6843,39.8399],[9.6966,39.8519],[9.6966,39.8581],[9.6831,39.8655],[9.6831,39.8717],[9.6898,39.8717],[9.6843,39.8942],[9.6966,39.9195],[9.7145,39.9245],[9.7178,39.9338],[9.7097,39.9403],[9.6966,39.9338],[9.6873,39.9612],[9.6934,39.9929],[9.7323,40.0839],[9.6546,40.1446],[9.6311,40.1962],[9.6272,40.2245],[9.6262,40.2631],[9.6346,40.2826],[9.6831,40.3242],[9.7124,40.3664],[9.7494,40.3773],[9.7617,40.3907],[9.8088,40.4708],[9.8152,40.5025],[9.8267,40.5196],[9.8206,40.5364],[9.7922,40.557],[9.7819,40.582],[9.7616,40.5873],[9.7565,40.5952],[9.7488,40.6603],[9.7039,40.7594],[9.6698,40.8015],[9.6688,40.7904],[9.6579,40.7999],[9.6618,40.809],[9.6745,40.8139],[9.6898,40.8108],[9.681,40.8298],[9.724,40.8449],[9.6994,40.85],[9.6831,40.8654],[9.6633,40.8582],[9.6558,40.876],[9.6141,40.8934],[9.6141,40.8996],[9.6315,40.9049],[9.6421,40.9206],[9.6226,40.9238],[9.5733,40.9064],[9.5391,40.9206],[9.512,40.9152],[9.5042,40.9269],[9.5125,40.928],[9.5119,40.9343],[9.5711,40.9349],[9.5664,40.9486],[9.5789,40.962],[9.5876,40.9958],[9.6043,41.0026],[9.6512,40.9911],[9.6626,41.0026],[9.6157,41.0196],[9.5881,41.0207],[9.5733,41.0095],[9.5596,41.0163],[9.5527,41.0095],[9.5576,41.0251],[9.5542,41.0346],[9.5431,41.0369],[9.5247,41.0305],[9.5322,41.0163],[9.5119,41.0163],[9.5391,41.092],[9.5459,41.0777],[9.5623,41.0971],[9.5664,41.1193],[9.5596,41.1261],[9.5462,41.1209],[9.5247,41.133],[9.5322,41.1404],[9.5239,41.1497],[9.5081,41.1404],[9.4691,41.1462],[9.4566,41.1404],[9.4701,41.1261],[9.4429,41.092],[9.4368,41.1154],[9.4429,41.133],[9.4202,41.1564],[9.4087,41.1603],[9.4224,41.1807],[9.3882,41.1876],[9.3882,41.1807],[9.3521,41.2073],[9.3352,41.2117],[9.333,41.1876],[9.3125,41.2012],[9.2853,41.195],[9.2853,41.2217],[9.2783,41.2217],[9.2749,41.2124],[9.2783,41.195],[9.2674,41.202],[9.2681,41.2366],[9.2578,41.2497],[9.2383,41.2488],[9.2306,41.2626],[9.1711,41.2429],[9.1629,41.2254],[9.1634,41.1841],[9.1419,41.1528],[9.1356,41.1603],[9.1078,41.1395],[9.0055,41.1219],[8.9907,41.0974],[8.9401,41.0612],[8.9227,41.0368],[8.8811,41.0237],[8.888,41.0163],[8.8396,40.9616],[8.8113,40.9408],[8.7644,40.9138],[8.7339,40.9213],[8.7092,40.9206],[8.641,40.8965],[8.6343,40.8816],[8.5984,40.853],[8.501,40.8244],[8.3102,40.8507],[8.2778,40.8654],[8.2332,40.9101],[8.2362,40.9548],[8.229,40.9626],[8.2126,40.9634],[8.2096,40.9753],[8.2022,40.9753],[8.193,40.9638],[8.1789,40.9282],[8.2097,40.9145],[8.2153,40.8814],[8.1338,40.7289],[8.1458,40.726],[8.1738,40.697],[8.1974,40.6912],[8.1738,40.6416],[8.1406,40.6252],[8.1473,40.5932],[8.1618,40.5638],[8.1766,40.6066],[8.1934,40.6175],[8.2163,40.6122],[8.196,40.5781],[8.2163,40.5706],[8.2673,40.5941],[8.2915,40.5954],[8.312,40.5781],[8.3317,40.5107],[8.3656,40.4921],[8.3799,40.4687],[8.3945,40.4238],[8.3921,40.4123],[8.386,40.3518],[8.4082,40.3378],[8.4157,40.3453],[8.4413,40.3314],[8.4629,40.3145],[8.4761,40.2921],[8.4764,40.2622],[8.4596,40.216],[8.4634,40.1632],[8.49,40.1045],[8.4686,40.0622],[8.4348,40.051],[8.4014,40.0499],[8.3772,40.0338],[8.3801,40.0301],[8.3945,40.0362],[8.4071,40.0222],[8.3945,39.9884],[8.4014,39.94],[8.3945,39.9127],[8.4375,39.8768],[8.4287,39.8655],[8.4354,39.8581],[8.4447,39.8836],[8.4634,39.899],[8.4456,39.8981],[8.4422,39.8928],[8.4354,39.899],[8.4631,39.9141],[8.4942,39.9124],[8.5234,39.8989],[8.5453,39.8786],[8.5552,39.8527],[8.5521,39.8208],[8.5408,39.7893],[8.5181,39.7625],[8.5453,39.7829],[8.5068,39.7385],[8.5044,39.7215],[8.5145,39.7137],[8.5658,39.7011],[8.5485,39.6979],[8.5169,39.7021],[8.4686,39.755],[8.4461,39.7625],[8.4422,39.7147],[8.4622,39.6171],[8.4639,39.5979],[8.4559,39.5844],[8.4634,39.5769],[8.4353,39.5252],[8.3869,39.4698],[8.3981,39.4465],[8.405,39.4272],[8.4014,39.4124],[8.374,39.3789],[8.3821,39.3597],[8.4172,39.339],[8.4157,39.3237],[8.4321,39.3018],[8.4264,39.2833],[8.3767,39.2379],[8.3728,39.2221],[8.3801,39.2076],[8.3987,39.2012],[8.4095,39.1693],[8.4157,39.166],[8.4126,39.1757],[8.4188,39.1773],[8.4354,39.166],[8.4422,39.1182],[8.4543,39.1249],[8.4651,39.1195],[8.4828,39.0804],[8.5044,39.0909],[8.5181,39.0834],[8.5044,39.0629],[8.5443,39.0513],[8.5596,39.0567],[8.5801,38.9605],[8.6033,38.9649],[8.6103,38.9549]]],[[[8.2747,41.0573],[8.3324,41.0646],[8.3413,41.0741],[8.342,41.0978],[8.328,41.1125],[8.3262,41.1261],[8.3021,41.105],[8.2778,41.1057],[8.2756,41.0698],[8.2289,41.0417],[8.2096,40.9958],[8.2464,40.9936],[8.2512,41.0438],[8.2747,41.0573]]],[[[9.4748,41.2361],[9.46,41.2424],[9.437,41.1859],[9.4487,41.1855],[9.4704,41.1721],[9.4793,41.2169],[9.4748,41.2361]]],[[[9.4309,41.2248],[9.4274,41.2541],[9.4142,41.2624],[9.398,41.256],[9.3919,41.2407],[9.3731,41.2299],[9.377,41.2133],[9.3953,41.2106],[9.4353,41.217],[9.4309,41.2248]]]]},{"nome":"Sicilia","punto":[14.154,37.5652],"poligoni":[[[[11.9995,36.8359],[11.9873,36.8242],[11.9461,36.8417],[11.9222,36.8284],[11.925,36.812],[11.9373,36.7888],[11.9612,36.7652],[11.9961,36.7449],[12.0306,36.7414],[12.0535,36.7676],[12.0515,36.7904],[11.9995,36.8359]]],[[[12.2732,37.9395],[12.2878,37.9215],[12.2997,37.9193],[12.3142,37.9252],[12.3421,37.9132],[12.3577,37.914],[12.3688,37.9252],[12.3368,37.9331],[12.3142,37.9464],[12.2732,37.9395]]],[[[12.8939,37.5733],[12.9426,37.5685],[12.9741,37.5574],[13,37.5355],[13.0104,37.5069],[13.0264,37.4932],[13.0515,37.5007],[13.1741,37.487],[13.1892,37.4697],[13.2533,37.4318],[13.278,37.3937],[13.3113,37.3808],[13.4526,37.2988],[13.5692,37.2735],[13.7158,37.1714],[13.8327,37.1396],[13.8944,37.1008],[13.9385,37.0959],[13.9763,37.1103],[14.0393,37.1145],[14.0886,37.1177],[14.1263,37.1123],[14.2085,37.0811],[14.2788,37.044],[14.3346,37.0006],[14.3945,36.945],[14.4873,36.7934],[14.5659,36.7783],[14.5822,36.7813],[14.6589,36.7538],[14.6846,36.726],[14.7443,36.7191],[14.7609,36.7062],[14.7734,36.71],[14.7808,36.6994],[14.8469,36.7263],[14.8822,36.7307],[14.9186,36.7199],[14.9824,36.6889],[15.0003,36.7024],[15.0331,36.6939],[15.0736,36.6591],[15.0939,36.6549],[15.1145,36.6599],[15.1343,36.6752],[15.1172,36.7471],[15.094,36.7995],[15.1066,36.8086],[15.1584,36.9242],[15.1747,36.9441],[15.2445,36.9721],[15.2681,36.9731],[15.2638,36.9871],[15.2749,36.9936],[15.2681,37.0004],[15.3089,37.0178],[15.3247,37.0085],[15.3324,37.0116],[15.3211,37.0402],[15.2918,37.042],[15.2837,37.0484],[15.2879,37.069],[15.3027,37.0625],[15.3079,37.0867],[15.3032,37.1012],[15.2466,37.1182],[15.2318,37.1349],[15.2292,37.1496],[15.2476,37.1518],[15.2476,37.1587],[15.2332,37.1649],[15.2165,37.1552],[15.1947,37.1763],[15.1834,37.2075],[15.1991,37.2276],[15.1929,37.24],[15.2054,37.2447],[15.2158,37.2447],[15.2217,37.2375],[15.2202,37.2202],[15.2449,37.2462],[15.2612,37.2338],[15.252,37.2577],[15.2175,37.285],[15.18,37.2908],[15.1107,37.3218],[15.0925,37.3588],[15.0895,37.4595],[15.0967,37.4945],[15.1159,37.5223],[15.1638,37.5677],[15.2022,37.6854],[15.2202,37.7067],[15.2066,37.7477],[15.2412,37.7956],[15.2599,37.8078],[15.3926,37.9761],[15.5003,38.0849],[15.527,38.1368],[15.5759,38.2002],[15.5599,38.1998],[15.5697,38.227],[15.6243,38.2617],[15.6424,38.2623],[15.6516,38.2753],[15.616,38.2802],[15.5593,38.3001],[15.5287,38.3026],[15.5129,38.2976],[15.4729,38.2678],[15.3997,38.2326],[15.2918,38.207],[15.2576,38.2102],[15.2454,38.2172],[15.2407,38.2303],[15.2463,38.2543],[15.2432,38.2648],[15.2372,38.2648],[15.2407,38.2412],[15.2033,38.1833],[15.1774,38.1563],[15.0879,38.1282],[15.0687,38.1313],[15.049,38.1518],[15.0073,38.1518],[14.9697,38.1592],[14.945,38.1818],[14.9071,38.1877],[14.7981,38.1603],[14.7337,38.1576],[14.6677,38.0992],[14.6346,38.0815],[14.5117,38.0444],[14.4641,38.0372],[14.4319,38.0494],[14.3846,38.0295],[14.3312,38.018],[14.2732,38.0151],[14.1796,38.0257],[14.1514,38.0289],[14.1063,38.0214],[14.0833,38.0238],[14.0205,38.0494],[14.0072,38.0383],[13.9385,38.0289],[13.8983,38.0045],[13.8572,37.9967],[13.8127,37.9779],[13.7908,37.9736],[13.7051,37.9805],[13.7119,37.9879],[13.6511,38.001],[13.5871,38.0391],[13.5575,38.0491],[13.5409,38.0675],[13.5413,38.0941],[13.5135,38.1105],[13.3914,38.1032],[13.3733,38.1407],[13.3719,38.1728],[13.3284,38.2002],[13.3181,38.2206],[13.2544,38.2025],[13.239,38.207],[13.2303,38.1846],[13.2072,38.1761],[13.157,38.1797],[13.1125,38.1928],[13.1009,38.1901],[13.0838,38.1747],[13.0894,38.166],[13.0547,38.1418],[13.0662,38.123],[13.0697,38.0911],[13.0274,38.0624],[12.9761,38.0442],[12.9442,38.0329],[12.9011,38.0281],[12.8696,38.0425],[12.8689,38.0513],[12.8184,38.0779],[12.7908,38.1171],[12.7609,38.181],[12.7378,38.181],[12.7318,38.1928],[12.7199,38.1755],[12.7254,38.1259],[12.7046,38.1108],[12.6624,38.1163],[12.6516,38.0915],[12.6084,38.0624],[12.5763,38.0717],[12.5234,38.0314],[12.4929,38.0214],[12.5042,38.0112],[12.5029,37.9971],[12.4905,37.954],[12.4641,37.9129],[12.4787,37.8812],[12.465,37.8228],[12.4461,37.8118],[12.4446,37.816],[12.4274,37.8093],[12.427,37.797],[12.4563,37.7598],[12.465,37.7198],[12.489,37.6827],[12.5062,37.6655],[12.5236,37.6584],[12.5635,37.6578],[12.5778,37.652],[12.6362,37.5822],[12.6594,37.5651],[12.6978,37.5627],[12.7809,37.5742],[12.8939,37.5733]]],[[[12.0723,37.9679],[12.0645,37.9862],[12.0536,37.9924],[12.036,37.991],[12.0304,37.9844],[12.0476,37.9608],[12.0648,37.9508],[12.0793,37.9503],[12.0723,37.9679]]],[[[14.9663,38.4329],[14.9588,38.4329],[14.9453,38.4123],[14.9483,38.3964],[14.9868,38.3641],[15.0073,38.3777],[14.9937,38.403],[14.9663,38.4187],[14.9663,38.4329]]],[[[14.9077,38.4739],[14.9487,38.4509],[14.9663,38.4534],[14.9526,38.4814],[14.9793,38.4814],[14.9793,38.4875],[14.9588,38.5019],[14.9661,38.5163],[14.9579,38.522],[14.9248,38.5224],[14.9097,38.5153],[14.8994,38.4817],[14.9077,38.4739]]],[[[14.8633,38.549],[14.877,38.5695],[14.867,38.5811],[14.815,38.5838],[14.7938,38.5716],[14.824,38.5518],[14.8617,38.5393],[14.8633,38.549]]],[[[14.3464,38.5351],[14.3609,38.539],[14.3572,38.5512],[14.3428,38.5473],[14.3464,38.5351]]],[[[14.576,38.5766],[14.564,38.5845],[14.5425,38.5869],[14.5516,38.5616],[14.5855,38.5574],[14.576,38.5766]]],[[[15.2278,38.8103],[15.2121,38.8105],[15.187,38.7927],[15.2061,38.7752],[15.2175,38.773],[15.2297,38.783],[15.2393,38.804],[15.2278,38.8103]]],[[[13.1693,38.7173],[13.1531,38.7023],[13.1535,38.6948],[13.1652,38.6911],[13.1974,38.7083],[13.1857,38.7175],[13.1693,38.7173]]],[[[12.8599,35.8722],[12.847,35.8683],[12.8459,35.8627],[12.8569,35.8523],[12.8726,35.8523],[12.874,35.8664],[12.8599,35.8722]]],[[[12.6218,35.5098],[12.6128,35.5153],[12.5557,35.5212],[12.5339,35.5216],[12.5261,35.5167],[12.6111,35.4892],[12.6213,35.4923],[12.6218,35.5098]]]]},{"nome":"Toscana","punto":[11.1557,43.4536],"poligoni":[[[[11.4515,42.3744],[11.4719,42.4186],[11.4871,42.4305],[11.5902,42.442],[11.6018,42.4474],[11.6079,42.4873],[11.5659,42.5161],[11.5855,42.5359],[11.5882,42.5661],[11.6012,42.5695],[11.6206,42.5601],[11.6712,42.577],[11.6986,42.6017],[11.7352,42.6162],[11.7539,42.6433],[11.7869,42.6512],[11.7889,42.711],[11.8071,42.7425],[11.7858,42.7597],[11.7739,42.7806],[11.7472,42.7985],[11.7647,42.8187],[11.7747,42.821],[11.8009,42.8111],[11.8327,42.8326],[11.889,42.8504],[11.9317,42.8717],[11.9514,42.8933],[11.9506,42.9024],[11.932,42.9199],[11.9395,42.9554],[11.9517,42.99],[11.9739,43.0202],[11.9778,43.0464],[11.9635,43.0731],[11.9332,43.0638],[11.9184,43.1181],[11.9227,43.1376],[11.9527,43.1738],[12.0096,43.1969],[12.023,43.2419],[12.0374,43.2547],[12.0967,43.2455],[12.1221,43.2597],[12.1584,43.2627],[12.2132,43.291],[12.211,43.3098],[12.1985,43.3188],[12.1735,43.2968],[12.1387,43.3],[12.1326,43.3573],[12.0808,43.3719],[12.0737,43.4112],[12.0371,43.4165],[12.0574,43.4374],[12.0775,43.4429],[12.1033,43.4646],[12.1313,43.4775],[12.1295,43.4963],[12.1008,43.5083],[12.0976,43.5183],[12.1122,43.5279],[12.1375,43.5316],[12.2048,43.6168],[12.1958,43.6534],[12.2197,43.6612],[12.2499,43.6824],[12.2777,43.6897],[12.3019,43.7289],[12.3099,43.7241],[12.3136,43.6922],[12.3248,43.6834],[12.3544,43.7111],[12.3576,43.7226],[12.2858,43.7689],[12.2681,43.7714],[12.2499,43.7618],[12.2138,43.763],[12.1852,43.7429],[12.1415,43.7625],[12.1022,43.759],[12.0678,43.7543],[11.9686,43.7731],[11.9357,43.7954],[11.885,43.8154],[11.813,43.8244],[11.7849,43.8475],[11.7163,43.8791],[11.7089,43.8848],[11.7062,43.9241],[11.6854,43.9385],[11.6856,43.9621],[11.6501,43.995],[11.6524,44.0177],[11.6848,44.0267],[11.7202,44.0702],[11.7472,44.1216],[11.7414,44.1317],[11.72,44.1317],[11.6343,44.1178],[11.5882,44.1288],[11.6108,44.1523],[11.5883,44.1706],[11.5718,44.1737],[11.5511,44.1627],[11.5263,44.1622],[11.496,44.1665],[11.4494,44.2044],[11.4319,44.2271],[11.3965,44.2341],[11.3757,44.2117],[11.3343,44.2066],[11.2911,44.1708],[11.2002,44.1566],[11.1967,44.1469],[11.203,44.1383],[11.2564,44.116],[11.2294,44.1027],[11.2001,44.1047],[11.0483,44.0924],[11.0079,44.1041],[11.0013,44.1127],[11.0173,44.1335],[11.0044,44.1407],[10.9907,44.14],[10.9853,44.1259],[10.9232,44.068],[10.8159,44.1135],[10.734,44.1547],[10.7074,44.162],[10.636,44.1535],[10.6105,44.1257],[10.5704,44.1256],[10.5223,44.1555],[10.4816,44.1898],[10.4712,44.2246],[10.4002,44.2359],[10.351,44.2749],[10.2878,44.2824],[10.2539,44.2706],[10.2293,44.2815],[10.1994,44.3183],[10.1357,44.3418],[10.1218,44.3482],[10.0726,44.3521],[9.9913,44.4066],[9.9851,44.4163],[10.002,44.4326],[9.9899,44.448],[9.9356,44.4704],[9.8663,44.483],[9.8356,44.4763],[9.7621,44.4094],[9.7514,44.3892],[9.6915,44.3728],[9.6898,44.3577],[9.7518,44.3056],[9.8521,44.2526],[9.8617,44.1859],[9.8848,44.2044],[9.9022,44.1999],[9.9083,44.1913],[9.8986,44.1664],[9.9682,44.16],[9.9815,44.1501],[9.9899,44.1176],[10.0268,44.1143],[10.0532,44.0995],[10.0564,44.0907],[10.0285,44.0493],[10.1058,44.0168],[10.1433,43.9751],[10.1807,43.9553],[10.2101,43.9202],[10.2618,43.8161],[10.2934,43.5791],[10.3263,43.4769],[10.3591,43.4653],[10.437,43.3886],[10.5282,43.2468],[10.5344,43.1853],[10.5466,43.1471],[10.5357,43.1126],[10.5391,43.0794],[10.5171,43.0239],[10.5027,43.0056],[10.4776,42.9901],[10.4995,42.9405],[10.5186,42.9253],[10.5466,42.9348],[10.5391,42.9491],[10.5833,42.9597],[10.6325,42.9585],[10.7051,42.9409],[10.7635,42.9183],[10.7777,42.8947],[10.7656,42.8771],[10.7649,42.8353],[10.7554,42.8192],[10.7313,42.8044],[10.8909,42.7639],[10.9436,42.743],[10.99,42.7103],[11.0057,42.6679],[11.0778,42.6322],[11.0809,42.6127],[11.0974,42.6069],[11.1287,42.5581],[11.1585,42.564],[11.1869,42.5208],[11.1884,42.4803],[11.1797,42.4565],[11.1642,42.4398],[11.1418,42.4388],[11.113,42.4464],[11.0991,42.4429],[11.0869,42.4295],[11.0868,42.4184],[11.1066,42.3913],[11.1345,42.3842],[11.1559,42.3663],[11.1838,42.3663],[11.2113,42.4189],[11.2456,42.4223],[11.333,42.4006],[11.3621,42.4004],[11.3547,42.4072],[11.3766,42.4069],[11.3962,42.4004],[11.3962,42.393],[11.4515,42.3744]]],[[[10.8958,42.3867],[10.883,42.3922],[10.8758,42.3868],[10.8764,42.3744],[10.8618,42.3663],[10.9233,42.3187],[10.9398,42.3307],[10.9135,42.3752],[10.8958,42.3867]]],[[[10.4434,42.8454],[10.431,42.8644],[10.4124,42.8734],[10.3999,42.8688],[10.3814,42.8324],[10.3473,42.8059],[10.3221,42.8117],[10.3268,42.8262],[10.2721,42.8273],[10.2721,42.8188],[10.259,42.8119],[10.2659,42.8044],[10.2244,42.8044],[10.1795,42.8188],[10.133,42.8119],[10.1117,42.8013],[10.1014,42.784],[10.1068,42.7574],[10.1248,42.7431],[10.1472,42.7373],[10.2297,42.7354],[10.24,42.7419],[10.2454,42.7573],[10.2654,42.7446],[10.3045,42.7598],[10.3137,42.743],[10.325,42.7648],[10.3379,42.7648],[10.3643,42.7498],[10.3814,42.7226],[10.411,42.718],[10.4155,42.7089],[10.4307,42.7221],[10.4251,42.7408],[10.408,42.7573],[10.3888,42.7635],[10.4203,42.7764],[10.43,42.7876],[10.4367,42.8044],[10.4312,42.8279],[10.4434,42.8454]]],[[[9.8401,43.0652],[9.8258,43.0746],[9.8069,43.0664],[9.7846,43.0284],[9.8015,43.0078],[9.823,43.0085],[9.8421,43.025],[9.8548,43.0443],[9.8401,43.0652]]],[[[10.297,42.3449],[10.2944,42.328],[10.3132,42.3239],[10.3159,42.3408],[10.3064,42.3515],[10.297,42.3449]]],[[[10.0916,42.5958],[10.0794,42.6139],[10.0503,42.5819],[10.0858,42.5725],[10.0979,42.5839],[10.0916,42.5958]]],[[[12.1993,43.7805],[12.2386,43.7988],[12.239,43.8075],[12.2267,43.8144],[12.1776,43.8217],[12.1708,43.8046],[12.1822,43.7888],[12.1993,43.7805]]]]},{"nome":"Trentino-Alto Adige","punto":[11.2981,46.4096],"poligoni":[[[[10.4518,46.5467],[10.4884,46.4974],[10.5693,46.4809],[10.6247,46.4545],[10.6387,46.4111],[10.6323,46.3863],[10.6074,46.3698],[10.5519,46.3644],[10.5279,46.3426],[10.5777,46.3127],[10.5902,46.2334],[10.5654,46.1885],[10.5569,46.1124],[10.5152,46.082],[10.4946,46.0334],[10.4686,46.0118],[10.4591,45.985],[10.466,45.9763],[10.5001,45.9652],[10.5043,45.9394],[10.5195,45.9167],[10.5072,45.8775],[10.5259,45.8365],[10.559,45.8244],[10.5576,45.8031],[10.5847,45.7942],[10.6158,45.808],[10.6653,45.8115],[10.6772,45.8392],[10.6874,45.8453],[10.734,45.8492],[10.7619,45.8417],[10.8087,45.8454],[10.8449,45.8341],[10.8846,45.8169],[10.8995,45.79],[10.8989,45.7799],[10.8773,45.7579],[10.8725,45.7178],[10.8941,45.7142],[10.9318,45.6819],[10.9577,45.6942],[10.9834,45.6927],[11.0113,45.7146],[11.0636,45.7126],[11.1307,45.6996],[11.1479,45.7105],[11.1849,45.7547],[11.1825,45.7784],[11.2019,45.7913],[11.2005,45.8109],[11.2745,45.915],[11.3147,45.9394],[11.3461,45.9226],[11.359,45.9229],[11.383,45.9448],[11.3798,45.9676],[11.3875,45.9789],[11.4406,45.9876],[11.495,46.0124],[11.541,46.016],[11.5721,46.0106],[11.6034,45.9778],[11.6377,45.9739],[11.6848,45.9843],[11.6845,46.0303],[11.7047,46.0534],[11.699,46.0871],[11.7069,46.0994],[11.8107,46.1069],[11.8842,46.1282],[11.9022,46.1366],[11.9388,46.1741],[11.9707,46.1892],[11.9664,46.1988],[11.9204,46.2228],[11.9246,46.2531],[11.8929,46.2719],[11.8535,46.2737],[11.848,46.3079],[11.7992,46.3532],[11.8029,46.3662],[11.8482,46.381],[11.861,46.4271],[11.8957,46.4548],[11.8808,46.4714],[11.8342,46.4838],[11.8322,46.504],[11.8519,46.5142],[12.022,46.5394],[12.0639,46.5997],[12.0816,46.6549],[12.0946,46.6683],[12.1386,46.6443],[12.1779,46.6348],[12.2081,46.5949],[12.2531,46.6109],[12.3024,46.6146],[12.3407,46.6282],[12.3887,46.6194],[12.3992,46.6397],[12.4696,46.6758],[12.405,46.6901],[12.3704,46.7112],[12.3427,46.7651],[12.2691,46.7886],[12.2758,46.8463],[12.2666,46.8681],[12.2508,46.8756],[12.1951,46.8801],[12.1722,46.8992],[12.1269,46.9089],[12.1416,46.9188],[12.1417,46.928],[12.1112,46.993],[12.1217,47.0105],[12.1823,47.0336],[12.2036,47.0533],[12.2042,47.0797],[12.1806,47.0852],[12.1162,47.0766],[12.015,47.0405],[11.9436,47.0382],[11.8995,47.0277],[11.8225,46.9933],[11.7771,46.9883],[11.7349,46.9706],[11.6838,46.9919],[11.5965,47.0004],[11.5244,46.9883],[11.4718,47.0071],[11.4529,47.0009],[11.4112,46.9705],[11.3806,46.9716],[11.3138,46.9873],[11.2437,46.9793],[11.1745,46.9639],[11.0919,46.9124],[11.0543,46.8341],[11.0528,46.8149],[11.0333,46.8056],[10.9969,46.7691],[10.9309,46.774],[10.8704,46.7641],[10.8342,46.7802],[10.7951,46.7769],[10.7548,46.7908],[10.7229,46.7864],[10.7169,46.7952],[10.7487,46.8194],[10.739,46.8295],[10.6471,46.8638],[10.5277,46.8432],[10.4863,46.8464],[10.4538,46.8644],[10.4449,46.8232],[10.4172,46.7989],[10.4287,46.7556],[10.3997,46.7355],[10.3944,46.7008],[10.3692,46.6724],[10.3775,46.6533],[10.3956,46.6388],[10.4382,46.6357],[10.4591,46.6236],[10.4659,46.5785],[10.4518,46.5467]]]]},{"nome":"Umbria","punto":[12.488,42.9551],"poligoni":[[[[12.902,42.6096],[12.9993,42.6089],[13.0176,42.6316],[13.0593,42.6238],[13.0908,42.6307],[13.1188,42.646],[13.1539,42.6451],[13.1878,42.6903],[13.1833,42.7152],[13.1945,42.7346],[13.1945,42.7491],[13.2035,42.7598],[13.2261,42.7585],[13.2489,42.7678],[13.2561,42.7923],[13.2471,42.8265],[13.2243,42.8477],[13.1667,42.8245],[13.1504,42.8236],[13.1372,42.8495],[13.0431,42.9193],[12.9886,42.9157],[12.9905,42.8928],[12.9721,42.8887],[12.9647,42.9268],[12.9298,42.9474],[12.9071,42.9715],[12.8958,43.0072],[12.8928,43.0939],[12.8677,43.1218],[12.8374,43.1325],[12.8339,43.1464],[12.8568,43.1756],[12.8517,43.2061],[12.7957,43.2785],[12.7912,43.3197],[12.7465,43.3788],[12.7582,43.4612],[12.7321,43.4609],[12.7127,43.4539],[12.6911,43.4343],[12.6386,43.4436],[12.6089,43.4289],[12.5105,43.5125],[12.4883,43.522],[12.4317,43.5384],[12.3926,43.5224],[12.3091,43.5521],[12.3097,43.5667],[12.3398,43.5653],[12.3531,43.5738],[12.3589,43.6194],[12.3108,43.6093],[12.286,43.5916],[12.2452,43.6064],[12.213,43.609],[12.2048,43.6168],[12.1375,43.5316],[12.1122,43.5279],[12.0976,43.5183],[12.1008,43.5083],[12.1295,43.4963],[12.1313,43.4775],[12.1033,43.4646],[12.0775,43.4429],[12.0574,43.4374],[12.0371,43.4165],[12.0737,43.4112],[12.0808,43.3719],[12.1326,43.3573],[12.1387,43.3],[12.1735,43.2968],[12.1985,43.3188],[12.211,43.3098],[12.2132,43.291],[12.1584,43.2627],[12.1221,43.2597],[12.0967,43.2455],[12.0374,43.2547],[12.023,43.2419],[12.0096,43.1969],[11.9527,43.1738],[11.9227,43.1376],[11.9184,43.1181],[11.9332,43.0638],[11.9635,43.0731],[11.9778,43.0464],[11.9739,43.0202],[11.9517,42.99],[11.9395,42.9554],[11.932,42.9199],[11.9506,42.9024],[11.9514,42.8933],[11.9317,42.8717],[11.889,42.8504],[11.9331,42.7911],[11.9735,42.7603],[11.9664,42.7434],[11.9376,42.7287],[11.928,42.7166],[11.9488,42.6917],[11.9856,42.6754],[12.0251,42.6456],[12.0934,42.6606],[12.1287,42.6573],[12.1524,42.6758],[12.2358,42.6476],[12.2452,42.6198],[12.2455,42.5855],[12.2591,42.5656],[12.2715,42.5661],[12.2838,42.5062],[12.3007,42.4899],[12.319,42.498],[12.3428,42.4919],[12.3936,42.4625],[12.4174,42.4415],[12.4174,42.4285],[12.4515,42.421],[12.4311,42.3931],[12.4651,42.3869],[12.5099,42.3894],[12.5284,42.3695],[12.5369,42.3694],[12.5926,42.401],[12.6076,42.4223],[12.6084,42.4568],[12.6169,42.4656],[12.6264,42.4646],[12.652,42.4438],[12.7222,42.454],[12.7274,42.4668],[12.7176,42.494],[12.7552,42.5003],[12.78,42.5271],[12.8801,42.5647],[12.8792,42.5903],[12.902,42.6096]]],[[[12.4212,43.5897],[12.4307,43.5897],[12.4448,43.6011],[12.443,43.6197],[12.4298,43.6315],[12.4162,43.6278],[12.4076,43.6101],[12.4212,43.5897]]]]},{"nome":"Valle d'Aosta","punto":[7.3034,45.7078],"poligoni":[[[[7.8496,45.9397],[7.8437,45.9192],[7.8312,45.9145],[7.7801,45.9181],[7.732,45.9304],[7.7063,45.9257],[7.694,45.9287],[7.6737,45.9503],[7.643,45.9663],[7.5411,45.9841],[7.5244,45.9781],[7.5037,45.9567],[7.453,45.9459],[7.3938,45.9157],[7.3618,45.9078],[7.2867,45.9134],[7.1837,45.8805],[7.1535,45.8765],[7.0902,45.8805],[7.0669,45.8902],[7.0221,45.9253],[6.9972,45.9113],[6.9692,45.8698],[6.949,45.8578],[6.9051,45.8454],[6.8735,45.8448],[6.8707,45.8283],[6.8644,45.8269],[6.8434,45.8386],[6.8008,45.8265],[6.7827,45.7953],[6.7959,45.7181],[6.8161,45.6969],[6.8431,45.6827],[6.8826,45.6755],[6.9186,45.6526],[6.9634,45.6407],[6.9695,45.6258],[6.9529,45.5943],[6.9698,45.567],[6.9828,45.5111],[7.0754,45.4663],[7.1379,45.5117],[7.1431,45.5123],[7.1392,45.4976],[7.1462,45.4922],[7.2328,45.4855],[7.3855,45.5244],[7.4646,45.5742],[7.5064,45.5786],[7.538,45.5888],[7.6424,45.5746],[7.673,45.5636],[7.7314,45.5617],[7.7493,45.5641],[7.784,45.5814],[7.8802,45.6027],[7.9195,45.649],[7.911,45.6705],[7.9163,45.7297],[7.915,45.7382],[7.8823,45.7529],[7.8747,45.7632],[7.8477,45.9077],[7.8559,45.9193],[7.8496,45.9397]]]]},{"nome":"Veneto","punto":[11.7334,45.5156],"poligoni":[[[[12.4696,46.6758],[12.3992,46.6397],[12.3887,46.6194],[12.3407,46.6282],[12.3024,46.6146],[12.2531,46.6109],[12.2081,46.5949],[12.1779,46.6348],[12.1386,46.6443],[12.0946,46.6683],[12.0816,46.6549],[12.0639,46.5997],[12.022,46.5394],[11.8519,46.5142],[11.8322,46.504],[11.8342,46.4838],[11.8808,46.4714],[11.8957,46.4548],[11.861,46.4271],[11.8482,46.381],[11.8029,46.3662],[11.7992,46.3532],[11.848,46.3079],[11.8535,46.2737],[11.8929,46.2719],[11.9246,46.2531],[11.9204,46.2228],[11.9664,46.1988],[11.9707,46.1892],[11.9388,46.1741],[11.9022,46.1366],[11.8842,46.1282],[11.8107,46.1069],[11.7069,46.0994],[11.699,46.0871],[11.7047,46.0534],[11.6845,46.0303],[11.6848,45.9843],[11.6377,45.9739],[11.6034,45.9778],[11.5721,46.0106],[11.541,46.016],[11.495,46.0124],[11.4406,45.9876],[11.3875,45.9789],[11.3798,45.9676],[11.383,45.9448],[11.359,45.9229],[11.3461,45.9226],[11.3147,45.9394],[11.2745,45.915],[11.2005,45.8109],[11.2019,45.7913],[11.1825,45.7784],[11.1849,45.7547],[11.1479,45.7105],[11.1307,45.6996],[11.0636,45.7126],[11.0113,45.7146],[10.9834,45.6927],[10.9577,45.6942],[10.9318,45.6819],[10.8941,45.7142],[10.8725,45.7178],[10.8773,45.7579],[10.8989,45.7799],[10.8995,45.79],[10.8846,45.8169],[10.8449,45.8341],[10.7606,45.7297],[10.6442,45.6096],[10.6405,45.563],[10.6504,45.498],[10.643,45.448],[10.6618,45.419],[10.7024,45.4228],[10.7021,45.3825],[10.7179,45.3612],[10.7069,45.3537],[10.7064,45.3295],[10.6975,45.3203],[10.7402,45.316],[10.7611,45.2937],[10.7826,45.3078],[10.7946,45.3072],[10.8357,45.2809],[10.8486,45.2631],[10.9459,45.2097],[10.9873,45.1974],[11.0053,45.18],[11.0019,45.1551],[11.0443,45.1539],[11.054,45.1472],[11.0483,45.1226],[11.0695,45.1027],[11.0908,45.0993],[11.1094,45.1107],[11.1624,45.1199],[11.2041,45.1124],[11.2103,45.1043],[11.1912,45.0909],[11.1957,45.0634],[11.2728,45.0596],[11.2727,45.0338],[11.3889,44.9736],[11.419,44.9669],[11.4215,44.9499],[11.4319,44.9377],[11.4885,44.9435],[11.5249,44.94],[11.6223,44.8951],[11.6403,44.8983],[11.6775,44.9224],[11.7357,44.9385],[11.7475,44.9567],[11.7837,44.964],[11.7973,44.9776],[11.8696,44.9854],[11.9305,44.9785],[11.9783,44.9856],[12.0872,44.9705],[12.1157,44.959],[12.1291,44.9401],[12.148,44.9334],[12.1745,44.9368],[12.2233,44.9261],[12.2876,44.9354],[12.2948,44.9274],[12.2842,44.9046],[12.2934,44.8648],[12.3365,44.8486],[12.3497,44.818],[12.3934,44.7935],[12.4162,44.8033],[12.424,44.8205],[12.3967,44.8266],[12.3967,44.8335],[12.4159,44.8436],[12.4165,44.8511],[12.3916,44.8588],[12.4069,44.8913],[12.4269,44.905],[12.4383,44.9011],[12.4392,44.8776],[12.424,44.8546],[12.4446,44.8205],[12.4873,44.8623],[12.499,44.9215],[12.5127,44.9223],[12.5339,44.97],[12.5168,44.9876],[12.5026,44.9914],[12.4861,44.9912],[12.4861,44.9837],[12.4992,44.9837],[12.4862,44.9765],[12.4103,45.0322],[12.4134,45.0429],[12.3688,45.0656],[12.3866,45.0388],[12.3688,45.011],[12.3552,45.0246],[12.3762,45.0322],[12.3762,45.039],[12.3408,45.0814],[12.3211,45.0936],[12.3285,45.0799],[12.3067,45.0786],[12.2967,45.0886],[12.3073,45.1284],[12.3073,45.1079],[12.3285,45.101],[12.3213,45.1648],[12.298,45.2154],[12.3073,45.2307],[12.259,45.2028],[12.2664,45.1966],[12.2473,45.1969],[12.2305,45.2043],[12.2214,45.2163],[12.2249,45.2307],[12.2111,45.243],[12.2249,45.2512],[12.2173,45.2939],[12.1974,45.2996],[12.1994,45.2746],[12.1807,45.258],[12.1688,45.2622],[12.1491,45.2922],[12.1545,45.3135],[12.1629,45.3162],[12.1875,45.3065],[12.2088,45.3091],[12.2163,45.3162],[12.2322,45.3406],[12.2238,45.3539],[12.2453,45.3611],[12.2492,45.3855],[12.259,45.3952],[12.2461,45.4113],[12.259,45.43],[12.2527,45.4362],[12.2727,45.4636],[12.3096,45.4889],[12.3504,45.5049],[12.3831,45.5045],[12.3805,45.4948],[12.3934,45.4916],[12.424,45.4982],[12.424,45.5045],[12.3904,45.514],[12.3841,45.523],[12.3967,45.5393],[12.4036,45.5181],[12.4177,45.5236],[12.4349,45.5124],[12.4514,45.5119],[12.4419,45.5303],[12.4585,45.5483],[12.5066,45.5733],[12.5105,45.5591],[12.5373,45.5358],[12.5817,45.5529],[12.5625,45.5316],[12.5215,45.519],[12.5151,45.4927],[12.4929,45.4908],[12.4929,45.4982],[12.5066,45.4982],[12.4973,45.5067],[12.465,45.5045],[12.4787,45.4908],[12.4719,45.4859],[12.4514,45.4982],[12.4473,45.4843],[12.4309,45.484],[12.4358,45.4749],[12.4103,45.4362],[12.4878,45.4567],[12.5127,45.4704],[12.6117,45.4962],[12.7808,45.5535],[12.9439,45.6286],[12.9817,45.6348],[13.0606,45.6367],[13.085,45.6419],[13.0956,45.6523],[13.0289,45.7428],[13.0258,45.7595],[13.0019,45.782],[12.9993,45.8255],[12.9729,45.8426],[12.9468,45.8193],[12.8946,45.8258],[12.8837,45.842],[12.8701,45.8468],[12.8557,45.8445],[12.8267,45.8244],[12.8154,45.8313],[12.8107,45.8469],[12.792,45.8562],[12.7704,45.8385],[12.7395,45.8315],[12.699,45.8036],[12.6728,45.8021],[12.6609,45.819],[12.6389,45.8321],[12.6031,45.8262],[12.5642,45.842],[12.5263,45.9204],[12.4478,45.9597],[12.4224,46.0431],[12.419,46.0507],[12.4442,46.0827],[12.4992,46.1066],[12.495,46.1557],[12.4628,46.1784],[12.4529,46.2097],[12.4314,46.2118],[12.4196,46.2256],[12.3828,46.2299],[12.3429,46.2577],[12.3359,46.2695],[12.3704,46.3063],[12.4447,46.3377],[12.5001,46.4042],[12.5202,46.4423],[12.5512,46.4574],[12.5931,46.4637],[12.6699,46.4591],[12.6703,46.477],[12.6423,46.4913],[12.6464,46.5018],[12.6816,46.525],[12.7602,46.5369],[12.7485,46.641],[12.7066,46.6377],[12.6696,46.653],[12.6202,46.6565],[12.5473,46.6522],[12.4999,46.6721],[12.4696,46.6758]]],[[[12.3521,45.4055],[12.3279,45.3723],[12.3215,45.348],[12.3762,45.4226],[12.4309,45.4157],[12.4075,45.4307],[12.3892,45.4335],[12.3521,45.4055]]],[[[12.3298,45.4588],[12.3166,45.4431],[12.3206,45.4298],[12.3372,45.4274],[12.3621,45.4381],[12.3638,45.4497],[12.3472,45.4588],[12.3298,45.4588]]]]}];
