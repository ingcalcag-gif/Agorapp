/* Prova: i testi che arrivano da fuori entrano nella pagina sempre come testo (voce T-024 del piano di adeguamento;
   libro mastro, § 3.11; inventario e regole in docs/testi-come-testo.md).

   Qui stanno i controlli che si possono fare leggendo il codice; ciò che succede davvero nella pagina lo controlla
   prove/browser/ostili.js, con testi ostili in tutte le viste.

   1. La funzione di protezione è una sola (sorgenti/moduli/testo.js) e fa ciò che deve; collegamento() accetta solo https.
   2. Nessun'altra funzione dei sorgenti sostituisce i caratteri speciali per conto suo.
   3. Nessun gestore scritto nella pagina (onclick=, onerror=…) e nessun collegamento javascript: nei sorgenti e nelle
      uscite montate.
   4. Nei modelli di pagina ogni attributo riempito con un valore sta tra virgolette, e ogni collegamento o indirizzo
      (href, src, action) riempito con un valore passa dalla funzione di protezione.
   5. L'inventario dei punti in cui il codice scrive nella pagina (innerHTML e simili) è quello del documento: se
      cambia, la prova si ferma finché il punto nuovo non è stato rivisto e annotato. */
'use strict';
const fs = require('fs');
const path = require('path');
const { RADICE, DIST, USCITE, esito, eseguiDaSola, riga } = require('./comune.js');

const SORGENTI = path.join(RADICE, 'sorgenti');
const PARTI = path.join(SORGENTI, 'parti');
const TESTO = require(path.join(SORGENTI, 'moduli', 'testo.js'));

/* Quante volte ogni file dei sorgenti scrive codice nella pagina (innerHTML, outerHTML, insertAdjacentHTML,
   document.write). Ogni punto è rivisto in docs/testi-come-testo.md: chi ne aggiunge uno lo rivede, lo annota lì e
   aggiorna questo numero. */
const SCRITTURE = { 'app2.js': 11, 'app3.js': 3, 'app4.js': 9, 'app5.js': 7, 'app6.js': 9, 'app7.js': 2, 'misure.js': 2, 'sezioni.js': 5 };
const RE_SCRITTURE = /\b(?:innerHTML|outerHTML|insertAdjacentHTML)\b|document\.write(?:ln)?\s*\(/g;

function prova() {
  const e = esito('Testi sempre come testo');

  /* 1. la funzione */
  const casi = [['<b>prova</b>', '&lt;b&gt;prova&lt;/b&gt;'], ['"x" \'y\' & z', '&quot;x&quot; &#39;y&#39; &amp; z'], [null, ''], [undefined, ''], [7, '7'], ['già &amp; fatto', 'già &amp;amp; fatto'], ['testo semplice, àèìòù €', 'testo semplice, àèìòù €']];
  for (const [dato, atteso] of casi) if (TESTO.esc(dato) !== atteso) e.errori.push(`esc(${JSON.stringify(dato)}) dà ${JSON.stringify(TESTO.esc(dato))}, atteso ${JSON.stringify(atteso)}`);
  const si = ['https://esempio.example/evento', 'HTTPS://Esempio.example/a?b=c&d=e#f', '  https://esempio.example/  '];
  const no = ['http://esempio.example/', 'javascript:alert(1)', ' JavaScript:alert(1)', 'data:text/html,<b>x</b>', 'vbscript:x', '//esempio.example/', 'esempio.example', 'https://utente:parola@esempio.example/',
    'https://utente@esempio.example/', 'https://esempio.example/a b', 'https://esempio.example/a\nb', 'https://esempio.example/\u0000', 'https://', 'https:esempio.example', '', null, undefined, 7, {}, ['https://esempio.example/']];
  for (const u of si) if (TESTO.collegamento(u) !== u.trim()) e.errori.push('collegamento() rifiuta ' + JSON.stringify(u));
  for (const u of no) if (TESTO.collegamento(u) !== '') e.errori.push('collegamento() accetta ' + JSON.stringify(u));

  /* i sorgenti che costruiscono pagine: i pezzi dell'app, i moduli e il montaggio (non le librerie di terzi) */
  const file = [];
  for (const f of fs.readdirSync(PARTI)) if (/\.(js|html)$/.test(f)) file.push(['parti/' + f, path.join(PARTI, f)]);
  for (const f of fs.readdirSync(path.join(SORGENTI, 'moduli'))) if (/\.js$/.test(f)) file.push(['moduli/' + f, path.join(SORGENTI, 'moduli', f)]);
  for (const f of ['build.js', 'licenze.js', 'contenuti_esempio.js', 'config.js']) if (fs.existsSync(path.join(SORGENTI, f))) file.push([f, path.join(SORGENTI, f)]);
  const testi = file.map(([nome, p]) => [nome, fs.readFileSync(p, 'utf8')]);

  for (const [nome, t] of testi) {
    /* 2. una sola funzione di protezione */
    if (nome !== 'moduli/testo.js' && !/^parti\/(traduzioni\.js|legali_it\.html|body\.html)$/.test(nome)) {
      for (const m of t.matchAll(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x27;|&apos;/g)) { e.errori.push(`${nome}, riga ${riga(t, m.index)}: «${m[0]}» scritto nel codice: la protezione dei caratteri speciali sta solo in sorgenti/moduli/testo.js`); break; }
    }
    /* 3. gestori e javascript: */
    for (const m of t.matchAll(/<[a-zA-Z][^<>]*?[\s"'`}]on[a-z]+\s*=\s*["'`$\\]/g)) e.errori.push(`${nome}, riga ${riga(t, m.index)}: gestore scritto nella pagina (${m[0].slice(0, 70)}…)`);
    if (nome !== 'moduli/testo.js') for (const m of t.matchAll(/javascript\s*:/gi)) e.errori.push(`${nome}, riga ${riga(t, m.index)}: «javascript:» nei sorgenti`);
    if (!/\.js$/.test(nome)) continue;
    /* 4. attributi tra virgolette; collegamenti e indirizzi protetti */
    for (const m of t.matchAll(/[\s"'][a-zA-Z_:][-a-zA-Z0-9_:.]*=\$\{/g)) {
      const prima = t.slice(Math.max(0, m.index - 200), m.index);
      if (!/<[a-zA-Z][^<>]*$/.test(prima.replace(/\$\{[^}]*\}/g, ''))) continue;   // non siamo dentro un elemento
      if (/=["'][^"']*$/.test(prima.split('<').pop().replace(/="[^"]*"/g, '').replace(/='[^']*'/g, ''))) continue;   // siamo dentro il valore di un attributo (per esempio un indirizzo con ?a=…)
      e.errori.push(`${nome}, riga ${riga(t, m.index)}: attributo senza virgolette (${m[0].trim()}…)`);
    }
    for (const m of t.matchAll(/\b(href|src|action|formaction|srcset|poster|data|xlink:href)=(["'])\s*\$\{\s*([^}]{0,40})/g)) {
      if (!/^escH?\(/.test(m[3])) e.errori.push(`${nome}, riga ${riga(t, m.index)}: ${m[1]} riempito senza la funzione di protezione (${m[3].trim()}…)`);
    }
  }

  /* 5. inventario delle scritture nella pagina */
  const trovate = {};
  for (const [nome, t] of testi) { if (!/^parti\/.*\.js$/.test(nome)) continue; const n = (t.match(RE_SCRITTURE) || []).length; if (n) trovate[nome.slice(6)] = n; }
  for (const f of new Set(Object.keys(SCRITTURE).concat(Object.keys(trovate)))) {
    if ((SCRITTURE[f] || 0) !== (trovate[f] || 0)) e.errori.push(`${f}: ${trovate[f] || 0} punti che scrivono nella pagina, l'inventario ne prevede ${SCRITTURE[f] || 0}: rivedi i punti nuovi (testi esterni solo con esc()), annotali in docs/testi-come-testo.md e aggiorna SCRITTURE in prove/testi.js`);
  }
  const doc = path.join(RADICE, 'docs', 'testi-come-testo.md');
  if (!fs.existsSync(doc)) e.errori.push('manca docs/testi-come-testo.md, con l\'inventario dei testi esterni');
  else { const d = fs.readFileSync(doc, 'utf8'); for (const f of Object.keys(SCRITTURE)) if (!d.includes('`' + f + '`')) e.errori.push(`docs/testi-come-testo.md non nomina ${f}`); }

  /* 3 bis. le uscite montate: pagine senza gestori, nessun javascript: nei file dell'app (le librerie di terzi sono a impronta fissa) */
  let pagine = 0;
  for (const u of USCITE) {
    const c = path.join(DIST, u);
    for (const f of ['index.html', 'licenze/index.html']) {
      if (!fs.existsSync(path.join(c, f))) continue;
      const t = fs.readFileSync(path.join(c, f), 'utf8'); pagine++;
      for (const m of t.matchAll(/<[a-zA-Z][^<>]*?\son[a-z]+\s*=/g)) e.errori.push(`${u}/${f}, riga ${riga(t, m.index)}: gestore scritto nella pagina`);
      if (/<script(?![^>]*\bsrc=)[^>]*>\s*\S/.test(t)) e.errori.push(`${u}/${f}: codice JavaScript scritto dentro la pagina`);
    }
    for (const f of ['index.html', 'app.js', 'sezioni.js', 'traduzioni.js', 'config.js']) {
      if (!fs.existsSync(path.join(c, f))) continue;
      if (/javascript\s*:/i.test(fs.readFileSync(path.join(c, f), 'utf8'))) e.errori.push(`${u}/${f}: contiene «javascript:»`);
    }
  }
  e.note.push(`${testi.length} file dei sorgenti e ${pagine} pagine montate controllati; punti che scrivono nella pagina: ${Object.values(trovate).reduce((a, b) => a + b, 0)}`);
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
