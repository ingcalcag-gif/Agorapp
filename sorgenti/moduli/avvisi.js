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
