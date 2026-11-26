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
