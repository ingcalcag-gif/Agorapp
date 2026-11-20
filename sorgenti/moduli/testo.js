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
