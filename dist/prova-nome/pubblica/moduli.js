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
   memoria del browser per i file (Cache Storage) e, quando serviranno, la base di dati del browser (IndexedDB) e la
   copia dell'app del service worker. Nessun altro file dei sorgenti nomina questi strumenti: lo controlla la prova
   prove/memoria.js; la prova prove/browser/memoria.js controlla che cosa il telefono contiene davvero dopo un giro
   completo nell'app.

   ELENCO è l'elenco chiuso: una chiave che non c'è non si legge e non si scrive (il modulo si ferma con un errore).
   Ogni voce dice in quale riga della scheda «Dati locali» rientra. Le voci con «redazione» sono strumenti della
   Redazione (§ 3.7: stanno sul dispositivo della redazione, non nella scheda): esistono solo se l'app è creata con
   redazione: true; altrimenti, all'avvio, si cancellano.

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

  /* dove: «memoria» (memoria del browser, coppie chiave-valore) oppure «file» (memoria del browser per i file).
     forma: «json» o «testo», per le voci della memoria. */
  const ELENCO = [
    { nome: 'dl_eventi', dove: 'memoria', forma: 'json', riga: 'offgrid', prima: 'agorapp_events',
      cosa: 'Gli eventi Off-Grid della persona. Fino ai blocchi 8-10 anche gli eventi creati o importati dall\'area riservata, che non vanno sulla mappa' },
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
    { nome: 'dl_archivio', dove: 'file', riga: 'zone', prima: 'agorapp_archivio',
      cosa: 'Indice e quadranti dell\'archivio degli eventi scaricati per le zone consultate (T-022)' },
    { nome: 'red_storico', dove: 'memoria', forma: 'json', redazione: true, prima: 'agorapp_storico',
      cosa: 'Storico delle operazioni dell\'area riservata' },
    { nome: 'red_misure', dove: 'memoria', forma: 'json', redazione: true, prima: 'agorapp_misure',
      cosa: 'Misure dell\'area riservata: totali, numeri inseriti a mano, soglie' }
  ];

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

  /* crea({redazione, memoria, sessione, casse}): la memoria di un'app.
     redazione: true se l'app contiene gli strumenti della Redazione. memoria, sessione e casse sono gli strumenti del
     browser; nelle prove, finti. Se mancano, il modulo prende quelli del browser in cui gira. */
  function crea(o) {
    o = o || {};
    const redazione = !!o.redazione;
    const mem = 'memoria' in o ? o.memoria : strumento('localStorage');
    const ses = 'sessione' in o ? o.sessione : strumento('sessionStorage');
    const cas = 'casse' in o ? o.casse : (strumento('isSecureContext') ? strumento('caches') : null);

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
    const file = cas ? { open: nome => { voce(nome, 'file'); return cas.open(nome); } } : null;

    /* All'avvio, prima di leggere qualunque cosa: trasloco dei nomi vecchi e pulizia. Restituisce le chiavi traslocate.
       Tocca soltanto le chiavi che conosce: sullo stesso indirizzo possono esserci dati di altre pagine. Le chiavi
       delle funzioni tolte e, in un'app senza area riservata, quelle della Redazione si cancellano senza leggerle. */
    function avvia() {
      const fatto = { traslocate: [] };
      for (const v of ELENCO) {
        const fuori = v.redazione && !redazione;   // strumenti della Redazione su un'app che non li ha
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

    return { leggi, testo, scrivi, togli, file, avvia, redazione };
  }

  return { RIGHE, ELENCO, TOLTE, chiavi, crea };
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
      pronto: () => !!S.indice,
      quadrantiConservati: () => [...S.caricati.keys()],
      persistente: () => S.persistente,
      ultimoControllo: () => S.ultimoControllo,
    };
  }

  return { crea, TRENTA_MINUTI };
});

