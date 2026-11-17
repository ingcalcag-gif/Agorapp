/* Prova: i collegamenti verso altri siti si aprono solo al tocco e non comunicano la pagina di provenienza
   (voce T-012; libro mastro, § 5.3, regola 3, e § 5.4, regola 1).

   Nell'app montata:
   - ogni pagina dichiara la regola generale <meta name="referrer" content="no-referrer">;
   - ogni <a> che porta fuori (indirizzo http o https, oppure indirizzo calcolato «${…}» che si apre in una nuova
     scheda) porta rel="noopener noreferrer" e referrerpolicy="no-referrer";
   - nessun elemento carica da sé una pagina esterna o la prepara: niente <iframe>, <embed>, <object>, né
     <link rel="preconnect | dns-prefetch | prefetch | prerender">.
   I collegamenti di posta (mailto:) e quelli interni all'app non c'entrano. Le librerie di terzi in lib/ e i testi
   delle licenze non si controllano: non sono pagine dell'app. */
'use strict';
const { USCITE, leggiUscita, riga, esito, eseguiDaSola, confronta } = require('./comune.js');

const PAGINE = ['index.html', 'licenze/index.html'];
const attr = (tag, nome) => { const m = tag.match(new RegExp('\\b' + nome + '\\s*=\\s*"([^"]*)"', 'i')); return m ? m[1] : null; };

function prova() {
  const e = esito('Collegamenti esterni senza referrer');
  let controllati = 0;
  for (const u of USCITE) {
    const trovati = [];
    for (const [f, grezzo] of Object.entries(leggiUscita(u))) {
      if (typeof grezzo !== 'string' || f.startsWith('lib/') || /^licenze\/.*\.txt$/.test(f) || !/\.(html|js)$/.test(f)) continue;
      const testo = grezzo.replace(/\\"/g, '"');   // nel codice i testi legali tradotti hanno le virgolette con la barra
      if (PAGINE.includes(f) && !/<meta\s+name="referrer"\s+content="no-referrer"\s*>/i.test(testo))
        trovati.push({ chiave: 'pagina senza la regola del referrer', dove: f, dettaglio: f });
      for (const m of testo.matchAll(/<a\s[^>]*>/gi)) {
        const tag = m[0], href = attr(tag, 'href') || '', nuova = /\btarget\s*=\s*"_blank"/i.test(tag);
        const esterno = /^https?:\/\//i.test(href) || (/^\$\{/.test(href) && nuova);
        if (!esterno || /^mailto:/i.test(href)) continue;
        controllati++;
        const rel = (attr(tag, 'rel') || '').split(/\s+/), pol = attr(tag, 'referrerpolicy');
        if (!rel.includes('noreferrer') || !rel.includes('noopener') || pol !== 'no-referrer') {
          const chiave = 'collegamento senza noreferrer: ' + (href.startsWith('${') ? href : new URL(href).host);
          trovati.push({ chiave, dove: f, dettaglio: `riga ${riga(testo, m.index)}` });
        }
      }
      for (const m of testo.matchAll(/<(iframe|embed|object)\b|<link\b[^>]*\brel\s*=\s*"(?:preconnect|dns-prefetch|prefetch|prerender)"/gi))
        trovati.push({ chiave: 'elemento che carica o prepara una pagina esterna', dove: f, dettaglio: `riga ${riga(testo, m.index)}: ${m[0].slice(0, 40)}` });
    }
    confronta(e, 'collegamenti', trovati, u);
  }
  e.note.push('collegamenti esterni controllati: ' + controllati);
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
