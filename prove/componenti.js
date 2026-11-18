/* Prova: ogni componente di terzi dell'app ha la sua riga in COMPONENTI_DI_TERZI.md (voce T-004).

   Controlla nell'app montata (dist/pubblica e dist/redazione):
   - che ogni libreria, carattere o dato di terzi riconosciuto abbia una riga nella tabella «Componenti nell'app»,
     con la stessa versione;
   - che ogni servizio che fornisce parti dell'app abbia una riga nella tabella dei servizi;
   - che non ci siano librerie esterne o file estranei che la prova non sa riconoscere;
   - che ogni riga corrisponda a qualcosa che l'app usa davvero (niente righe rimaste dopo una rimozione);
   - che i testi delle licenze esistano in licenze/ e siano pubblicati identici con l'app.
   Libro mastro: § 6.6, regole 1-3; § 31.1. */
'use strict';
const fs = require('fs');
const path = require('path');
const { RADICE, USCITE, leggiUscita, esito, eseguiDaSola } = require('./comune.js');
const { tabella, ELENCO } = require('../sorgenti/licenze.js');
const VENDOR = require('../sorgenti/vendor/elenco.js');

/* Come si riconosce ciascun componente nell'app montata (nei testi dell'app e nei percorsi dei suoi file).
   versione: true = la versione sta nel percorso; false = versione non pertinente (la riga lo dice con «Non …»).
   Le librerie e i caratteri stanno in lib/, copiati da sorgenti/vendor/ (T-007). */
const COMPONENTI = [
  { nome: 'MapLibre GL JS', re: /lib\/maplibre-gl-(\d+\.\d+\.\d+)\//g, versione: true },
  { nome: 'jsPDF', re: /lib\/jspdf-(\d+\.\d+\.\d+)\//g, versione: true },
  { nome: 'SheetJS Community Edition (xlsx)', re: /lib\/sheetjs-(\d+\.\d+\.\d+)\//g, versione: true },
  { nome: 'DM Sans', re: /lib\/caratteri\/dm-sans-(v\d+)\//g, versione: true },
  { nome: 'DM Serif Display', re: /lib\/caratteri\/dm-serif-display-(v\d+)\//g, versione: true },
  { nome: 'Dati di OpenStreetMap', re: /openstreetmap\.org\/copyright/g, versione: false },
];
/* Servizi che oggi consegnano parti dell'app al telefono (tabella «Servizi che oggi forniscono parti dell'app»). */
const SERVIZI = [
  { nome: 'Google Fonts', re: /fonts\.(?:googleapis|gstatic)\.com/g },
  { nome: 'unpkg.com', re: /unpkg\.com\//g },
  { nome: 'cdnjs.cloudflare.com', re: /cdnjs\.cloudflare\.com\//g },
  { nome: 'CARTO (basemaps.cartocdn.com)', re: /basemaps\.cartocdn\.com/g },
];
/* Qualunque indirizzo esterno di un file di programma, di stile, di caratteri o di mappa. */
const RISORSA_ESTERNA = /https?:\/\/[^\s"'`<>()\\]+?\.(?:m?js|css|woff2?|ttf|otf|pbf|pmtiles|json)(?=[?#"'`\s)\\]|$)|https?:\/\/fonts\.googleapis\.com\/css2?\?[^\s"'`<>]+/g;
/* File che il montaggio produce da sé, e file di terzi annotati in sorgenti/vendor/elenco.js.
   Ogni altro file nell'uscita è un componente da elencare. */
const FILE_PROPRI = /^(index\.html|config\.js|app\.css|app\.js|traduzioni\.js|sezioni\.js|licenze\/[a-z0-9.-]+\.(txt|css|html)|lib\/caratteri\/caratteri\.css|anteprime\/(it|en|es|fr|ar)\.json)$/;
const FILE_VENDOR = new Set(VENDOR.flatMap(c => Object.keys(c.file).concat(c.nomeLicenza || 'LICENSE.txt').map(f => 'lib/' + c.cartella + '/' + f)));

function prova() {
  const e = esito('Componenti di terzi e licenze');
  const md = fs.readFileSync(ELENCO, 'utf8');
  const righe = tabella(md, "Componenti nell'app");
  const servizi = tabella(md, "Servizi che oggi forniscono parti dell'app");
  const perNome = Object.fromEntries(righe.map(r => [r['Componente'].replace(/`/g, ''), r]));
  const trovati = new Set(), serviziTrovati = new Set();

  for (const r of righe) {
    for (const col of ['Componente', 'Versione', 'Dove si usa', 'Licenza', 'Titolari', 'Obblighi', 'Come si adempie', 'Testo', 'Controllo'])
      if (!r[col]) e.errori.push(`riga «${r['Componente']}»: colonna «${col}» vuota`);
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(r['Controllo'] || '')) e.errori.push(`riga «${r['Componente']}»: data del controllo non nel formato GG/MM/AAAA`);
  }

  for (const u of USCITE) {
    const file = leggiUscita(u);
    if (!Object.keys(file).length) { e.errori.push(`uscita dist/${u}/ vuota: lancia npm run build`); continue; }
    for (const f of Object.keys(file)) if (!FILE_PROPRI.test(f) && !FILE_VENDOR.has(f)) e.errori.push(`dist/${u}/${f}: file che il montaggio non produce da sé; se è un componente di terzi, aggiungi la riga e il riconoscimento in prove/componenti.js`);
    // I testi dell'app (non le licenze, non le librerie di terzi) e l'elenco dei percorsi dei file.
    const testo = Object.entries(file).filter(([f]) => !f.startsWith('licenze/') && (!f.startsWith('lib/') || f.endsWith('.css') && f.startsWith('lib/caratteri/')))
      .map(([, t]) => t).concat(Object.keys(file).map(f => '/' + f)).join('\n');
    for (const f of FILE_VENDOR) if (!(f in file)) e.errori.push(`dist/${u}/${f} manca: rimonta`);

    for (const c of COMPONENTI) for (const m of testo.matchAll(c.re)) {
      trovati.add(c.nome);
      const r = perNome[c.nome];
      if (!r) { e.errori.push(`dist/${u}: usa «${c.nome}» ma COMPONENTI_DI_TERZI.md non ha la sua riga`); continue; }
      const v = r['Versione'].replace(/`/g, '');
      if (c.versione && v !== m[1]) e.errori.push(`dist/${u}: «${c.nome}» ${m[1]} nell'app, ${v} nell'elenco`);
      if (!c.versione && !/^Non /.test(v)) e.errori.push(`riga «${c.nome}»: la versione non si ricava dall'app, la riga deve dire «Non fissata…» o «Non pertinente…»`);
    }
    for (const s of SERVIZI) if (s.re.test(testo)) { serviziTrovati.add(s.nome); s.re.lastIndex = 0; }

    for (const m of testo.matchAll(RISORSA_ESTERNA)) {
      const url = m[0];
      const noto = COMPONENTI.some(c => { c.re.lastIndex = 0; const ok = c.re.test(url); c.re.lastIndex = 0; return ok; })
        || /basemaps\.cartocdn\.com\/gl\/[a-z-]+\/style\.json$/.test(url);
      if (!noto) e.errori.push(`dist/${u}: risorsa esterna non riconosciuta ${url}: aggiungi il componente all'elenco e il riconoscimento in prove/componenti.js`);
    }

    for (const r of righe) for (const t of r['Testo'].split(',').map(s => s.trim()).filter(Boolean)) {
      const src = path.join(RADICE, 'licenze', t);
      if (!fs.existsSync(src)) { e.errori.push(`manca licenze/${t} (${r['Componente']})`); continue; }
      if (file['licenze/' + t] !== fs.readFileSync(src, 'utf8')) e.errori.push(`dist/${u}/licenze/${t} non è uguale a licenze/${t}: rimonta`);
    }
    if (!file['licenze/index.html']) e.errori.push(`dist/${u}/licenze/index.html mancante`);
    else for (const r of righe) if (!file['licenze/index.html'].includes('>' + r['Componente'].replace(/`/g, '').replace(/&/g, '&amp;') + '<'))
      e.errori.push(`dist/${u}/licenze/index.html non nomina «${r['Componente']}»: rimonta`);
  }

  for (const r of righe) if (!trovati.has(r['Componente'].replace(/`/g, '')))
    e.errori.push(`riga «${r['Componente']}»: l'app montata non lo usa (o la prova non lo riconosce): togli la riga o spostala in «Componenti in arrivo»`);
  for (const s of SERVIZI) {
    const ha = servizi.some(r => r['Servizio'] === s.nome);
    if (serviziTrovati.has(s.nome) && !ha) e.errori.push(`l'app usa il servizio «${s.nome}» ma la tabella dei servizi non ha la sua riga`);
    if (!serviziTrovati.has(s.nome) && ha) e.errori.push(`riga del servizio «${s.nome}»: l'app non lo usa più, togli la riga`);
  }
  for (const r of servizi) if (!SERVIZI.some(s => s.nome === r['Servizio'])) e.errori.push(`riga del servizio «${r['Servizio']}»: la prova non sa riconoscerlo, aggiungilo in prove/componenti.js`);

  // Ogni testo in licenze/ appartiene a qualche riga dell'elenco.
  const citati = new Set([...md.matchAll(/\|\s*([a-z0-9.-]+\.txt(?:,\s*[a-z0-9.-]+\.txt)*)\s*\|/g)].flatMap(m => m[1].split(',').map(s => s.trim())));
  for (const t of fs.readdirSync(path.join(RADICE, 'licenze'))) if (!citati.has(t)) e.errori.push(`licenze/${t}: nessuna riga dell'elenco lo cita`);

  e.note.push(`${righe.length} componenti nell'app, ${servizi.length} servizi`);
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
