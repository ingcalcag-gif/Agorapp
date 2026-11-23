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
     copia dello storico), e tre letture riservate alla Redazione: «stato», «storico», «copia». */
  const OPERAZIONI = ['scrivi', 'ripristina', 'stato', 'storico', 'copia'];
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
