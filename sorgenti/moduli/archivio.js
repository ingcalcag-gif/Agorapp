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
