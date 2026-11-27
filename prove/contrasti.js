/* Prova: contrasti dei colori dell'app, in chiaro e in scuro, anche sulle superfici trasparenti sopra la mappa (voce
   T-058; libro mastro, § 11.1; WCAG 2.1, criteri 1.4.3 e 1.4.11; documento: docs/accessibilita.md).

   I colori si leggono da sorgenti/parti/style.css (variabili del tema chiaro, del tema scuro e del contrasto aumentato) e
   dagli stili della mappa (stile-carta-chiaro.json e stile-carta-scuro.json in sorgenti/vendor/protomaps-basemaps-…). Sopra la mappa una superficie «vetro»
   lascia passare la mappa: si calcola il colore risultante sopra il colore più chiaro e sopra il più scuro della mappa di
   quel tema (la sfocatura mescola l'area, quindi si usano i colori di riempimento e delle linee, non le etichette).
   - testo, testo secondario, verde dei collegamenti e rosso degli errori: almeno 4,5:1 sulle superfici piene e sui tre
     vetri, sopra qualunque colore della mappa;
   - bordi di campi e interruttori (--bordo-comando) e contorno della tastiera (--verde): almeno 3:1 su superficie e fondo.
   La verifica a occhio resta da fare dopo l'identità grafica (T-077). */
'use strict';
const fs = require('fs');
const path = require('path');
const { RADICE, esito, eseguiDaSola } = require('./comune.js');

const hex = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const rapporto = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const mescola = (sopra, sotto, a) => sopra.map((c, i) => Math.round(a * c + (1 - a) * sotto[i]));
const rgba = s => { const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/); return m ? { c: [+m[1], +m[2], +m[3]], a: m[4] == null ? 1 : +m[4] } : null; };

function variabili(blocco) {
  const v = {};
  for (const m of blocco.matchAll(/--([a-z0-9-]+)\s*:\s*([^;}]+)/g)) v[m[1]] = m[2].trim();
  return v;
}

function prova() {
  const e = esito('Contrasti in chiaro, in scuro e sopra la mappa');
  const err = x => e.errori.push(x);
  const css = fs.readFileSync(path.join(RADICE, 'sorgenti', 'parti', 'style.css'), 'utf8');
  const chiaro = variabili((css.match(/^:root\{([\s\S]*?)\n\}/m) || [])[1] || '');
  const scuro = Object.assign({}, chiaro, variabili((css.match(/^:root\[data-theme="dark"\]\{([\s\S]*?)\}/m) || [])[1] || ''));
  const piu = variabili((css.match(/@media \(prefers-contrast: more\)\{\s*:root\{([^}]*)\}/) || [])[1] || '');
  if (!chiaro.superficie || !scuro.superficie) { err('style.css: non trovo le variabili dei due temi'); return e; }
  if (!piu['testo-2']) err('style.css: manca il blocco del contrasto aumentato (@media (prefers-contrast: more))');
  const alfa = n => { const m = (chiaro[n] || '').match(/(\d+)%/); return m ? +m[1] / 100 : null; };
  const vetri = { vetro: alfa('vetro'), 'vetro leggero': alfa('vetro-leggero'), 'vetro forte': alfa('vetro-forte') };
  const dir = fs.readdirSync(path.join(RADICE, 'sorgenti', 'vendor')).find(d => d.startsWith('protomaps-basemaps-'));
  const coloriMappa = nome => {
    const s = JSON.parse(fs.readFileSync(path.join(RADICE, 'sorgenti', 'vendor', dir, `stile-carta-${nome}.json`), 'utf8'));
    const out = new Set(), cammina = x => { if (typeof x === 'string' && /^#[0-9a-f]{3,6}$/i.test(x)) out.add(x.toLowerCase()); else if (x && typeof x === 'object') Object.values(x).forEach(cammina); };
    for (const l of (Array.isArray(s) ? s : s.layers || [])) if (['fill', 'background', 'line'].includes(l.type)) cammina(l.paint || {});
    const c = [...out].map(hex).sort((a, b) => lum(a) - lum(b));
    return [c[0], c[c.length - 1]];
  };
  let controlli = 0;
  const minimo = (fg, bg, soglia, che) => { controlli++; const r = rapporto(fg, bg); if (r < soglia - 1e-9) err(`${che}: ${r.toFixed(2)}:1, sotto ${soglia}:1`); };
  for (const [tema, v, mappa] of [['chiaro', chiaro, coloriMappa('chiaro')], ['scuro', scuro, coloriMappa('scuro')]]) {
    const sup = hex(v.superficie), fondo = hex(v.fondo);
    for (const k of ['testo', 'testo-2', 'verde', 'rosso']) {
      if (!/^#/.test(v[k] || '')) { err(`${tema}: --${k} non è un colore esadecimale`); continue; }
      minimo(hex(v[k]), sup, 4.5, `${tema}, --${k} sulla superficie`);
      minimo(hex(v[k]), fondo, 4.5, `${tema}, --${k} sul fondo`);
      for (const [nome, a] of Object.entries(vetri)) for (const m of mappa) minimo(hex(v[k]), mescola(sup, m, a), 4.5, `${tema}, --${k} sul ${nome} sopra la mappa (rgb ${m.join(',')})`);
    }
    for (const k of ['bordo-comando', 'verde']) for (const [bg, n] of [[sup, 'superficie'], [fondo, 'fondo']]) minimo(hex(v[k]), bg, 3, `${tema}, --${k} (bordo o contorno) su ${n}`);
  }
  // contrasto aumentato: superfici piene e testo secondario almeno 7:1 nel tema chiaro
  if (piu['testo-2']) minimo(hex(piu['testo-2']), hex(chiaro.superficie), 7, 'contrasto aumentato, --testo-2 sulla superficie');
  if (piu.vetro && !/var\(--superficie\)/.test(piu.vetro)) err('contrasto aumentato: il vetro sopra la mappa deve diventare pieno');
  e.note.push(`${controlli} coppie di colori controllate; vetri al ${Object.values(vetri).map(a => Math.round(a * 100) + '%').join(', ')}; mappa: colori più chiaro e più scuro di ciascun tema`);
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
