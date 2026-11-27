/* Compattazione e controllo finale delle uscite (voce T-060 del piano di adeguamento; libro mastro, § 2.4, «Il codice»;
   § 3.11; § 6.6, regola 3). Lo usa sorgenti/build.js; la prova è prove/montaggio.js.

   compattaJs: terser, a versione fissa (sorgenti/package.json), toglie commenti e spazi e accorcia i nomi interni alle
   funzioni; non tocca i nomi globali, perché i file dell'app si parlano attraverso quelli, e lascia i commenti di licenza
   («/*!», @license, @preserve). compattaCss: toglie commenti, spazi in testa e righe vuote, niente di più.
   controlloFinale: rifiuta l'uscita se un file di testo dell'app (non le librerie di terzi in lib/, non i testi delle
   licenze) contiene un indirizzo esterno che sorgenti/config.js non ammette, o qualcosa che ha la forma di una chiave:
   chiave privata, chiave privata JWK, gettone di un servizio, chiave di caricamento di Bunny. */
'use strict';

let terser = null;
try { terser = require('terser'); } catch (e) { terser = null; }

const LICENZE = /^!|@license|@preserve/;
function compattaJs(codice, nome, leggibile) {
  if (leggibile) return codice;
  if (!terser || !terser.minify_sync) throw new Error('Manca terser per compattare ' + nome + ': lancia «npm ci» in sorgenti/ (oppure monta con --leggibile)');
  const r = terser.minify_sync(codice, { ecma: 2020, module: false, toplevel: false, compress: { passes: 1 }, mangle: true, format: { comments: LICENZE } });
  if (r.error) throw new Error('Compattazione di ' + nome + ' non riuscita: ' + r.error.message);
  return r.code;
}
function compattaCss(css, leggibile) {
  if (leggibile) return css;
  return css.replace(/\/\*(?!!)[\s\S]*?\*\//g, '').split('\n').map(r => r.trim()).filter(Boolean).join('\n');
}

const URL_RE = /https?:\/\/[^\s"'`<>()\\{}|^]+/g;
/* Nomi di formato del file Excel, non indirizzi: solo nel modulo dei file Excel dell'app della redazione (T-042). */
const SPAZI_DEI_NOMI = /^http:\/\/schemas\.openxmlformats\.org\/(?:spreadsheetml|package|officeDocument)\/20\d\d\//;
const CHIAVI = [
  ['chiave privata', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['chiave privata JWK', /"d"\s*:\s*"[A-Za-z0-9_-]{40,}"/],
  ['gettone di un servizio', /\b(?:sk-(?:ant-|proj-|live_|test_)?[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|xox[abprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35})\b/],
  ['chiave di caricamento', /AccessKey['"]?\s*[:=,]\s*['"][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12,}/i],
];
function ammessi(cfg) {
  return [...Object.values(cfg.indirizzi || {}), ...(cfg.collegamenti || [])].filter(Boolean).map(u => String(u).replace(/\/$/, ''));
}
function problemi(file, cfg, quale) {
  const lista = ammessi(cfg), out = [];
  const ammesso = url => lista.some(a => url === a || url.startsWith(a) && /[/?#]/.test(url[a.length]));
  for (const [f, testo] of Object.entries(file)) {
    if (typeof testo !== 'string' || f.startsWith('lib/') || /^licenze\/.*\.txt$/.test(f)) continue;
    const fonte = f === 'licenze/index.html' ? [...testo.matchAll(/\b(?:href|src)="([^"]*)"/g)].map(m => m[1]).join('\n') : testo;
    for (const m of fonte.matchAll(URL_RE)) {
      const url = m[0].replace(/[.,;:!?]+$/, '');
      if (ammesso(url) || (quale === 'redazione' && f === 'moduli.js' && SPAZI_DEI_NOMI.test(url))) continue;
      out.push(`${f}: indirizzo non ammesso ${url.slice(0, 80)}`);
    }
    for (const [nome, re] of CHIAVI) if (re.test(testo)) out.push(`${f}: ${nome}`);
  }
  return out;
}
function controlloFinale(file, cfg, quale) {
  const p = problemi(file, cfg, quale);
  if (p.length) throw new Error('Controllo finale dell\'uscita ' + quale + ' non superato:\n  ' + [...new Set(p)].slice(0, 20).join('\n  '));
}

/* Le intestazioni di sicurezza di un'app, dal modello sorgenti/intestazioni.json con gli indirizzi della configurazione
   (solo l'origine: schema, nome e porta). Un indirizzo vuoto si toglie. */
function intestazioni(cfg, quale) {
  const m = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'intestazioni.json'), 'utf8'));
  if (m.formato !== 'intestazioni' || m.versione !== 1 || !m.app || !m.app[quale]) throw new Error('sorgenti/intestazioni.json: manca il modello di ' + quale);
  const origine = u => { try { return new URL(u).origin; } catch (e) { return ''; } };
  const out = {};
  for (const [k, v] of Object.entries(m.app[quale])) {
    out[k] = String(v).replace(/\{indirizzi\.([a-z_]+)\}/g, (x, n) => {
      if (!(n in (cfg.indirizzi || {}))) throw new Error('sorgenti/intestazioni.json: indirizzo sconosciuto ' + n);
      return origine(cfg.indirizzi[n]);
    }).replace(/ {2,}/g, ' ').replace(/ ;/g, ';');
  }
  return out;
}

module.exports = { compattaJs, compattaCss, controlloFinale, problemi, intestazioni };
