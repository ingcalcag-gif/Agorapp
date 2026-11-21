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
