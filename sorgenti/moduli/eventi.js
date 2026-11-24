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
