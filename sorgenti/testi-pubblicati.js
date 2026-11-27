/* I quattro testi pubblicati (voce T-055 del piano di adeguamento; libro mastro, Parte VI, capp. 29-32):
   informativa, scheda «Dati locali», note legali, condizioni d'uso.

   I testi stanno in file separati, sorgenti/testi/<lingua>/<testo>.html, così i testi della Direzione entrano senza
   toccare il codice. L'italiano c'è sempre; le altre lingue (en, es, fr, ar) si aggiungono mettendo il file nella loro
   cartella. Ogni file è un pezzo di HTML di solo testo, con un insieme chiuso di elementi e di attributi, controllato
   qui a ogni montaggio. Il montaggio vi sostituisce i segnaposto con i valori di sorgenti/config.js:
     {nome}, {titolare}, {casella_contatto} (la casella per gli utenti), {casella_autorita} (solo nelle note legali,
     nella parte scritta anche in inglese), {licenze} (il collegamento alla pagina delle licenze dei componenti).
   Versione e data di ciascun testo vengono dalla configurazione (testi.<voce>): null = testo in preparazione, e
   allora il file è un segnaposto (contiene almeno un elemento di classe «segnaposto»); con versione e data, nessun
   segnaposto. Le regole di posto (libro mastro, § 7.5, misura 1; §§ 29.1, 31.1, 32.1) sono in REGOLE.

   Dai file escono, in ogni uscita:
     - i modelli <template id="leg-<testo>"> (italiano) e <template id="leg-<testo>-<lingua>"> nella pagina dell'app,
       che li mostra nel foglio «Informazioni legali», anche senza rete;
     - le pagine di solo testo testi/<lingua>/<testo>.html, senza script, leggibili anche dai programmi (§ 32.1,
       scelta 4), con la riserva dell'estrazione nei metadati (T-056; § 6.5), e il loro foglio di stile testi/testi.css.
   Documento: docs/testi-pubblicati.md. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SORGENTI = __dirname;
const CARTELLA = path.join(SORGENTI, 'testi');
const LINGUE = ['it', 'en', 'es', 'fr', 'ar'];
const escH = require('./moduli/testo.js').esc;   // la stessa funzione dell'app (T-024)

/* I quattro testi: identificativo (nome del file e del modello), voce della configurazione (testi.<voce>), titolo e
   voce breve dell'interfaccia (testi di traduzioni.js). */
const TESTI = [
  { id: 'informativa', voce: 'informativa', titolo: 'Informativa sulla privacy', breve: 'Informativa privacy' },
  { id: 'dati-locali', voce: 'dati_locali', titolo: 'Dati locali', breve: 'Dati locali' },
  { id: 'note-legali', voce: 'note_legali', titolo: 'Note legali', breve: 'Note legali' },
  { id: 'condizioni-uso', voce: 'condizioni_uso', titolo: 'Condizioni d’uso', breve: 'Condizioni d’uso' },
];

/* Dove devono stare le caselle e le parti obbligatorie (T-055):
   - la casella per gli utenti in note legali, informativa e condizioni d'uso (e, nell'app, accanto al modulo «Segnala»);
   - la casella per le autorità soltanto nelle note legali, dentro una parte scritta in inglese (lang="en");
   - nell'informativa, il riquadro separato del diritto di opposizione (section class="opposizione", art. 21, par. 4,
     GDPR) e la sezione «Dove stanno i dati» (id="dove-stanno-i-dati", § 2.6);
   - nelle note legali il titolare, le due caselle e il collegamento alle licenze dei componenti (§ 31.1). */
const REGOLE = {
  'informativa': { servono: ['{titolare}', '{casella_contatto}'], opposizione: true, dove: true },
  'dati-locali': { servono: [] },
  'note-legali': { servono: ['{titolare}', '{casella_contatto}', '{casella_autorita}', '{licenze}'], autorita: true },
  'condizioni-uso': { servono: ['{casella_contatto}'] },
};
const SEGNAPOSTI = ['{nome}', '{titolare}', '{casella_contatto}', '{casella_autorita}', '{licenze}'];

/* Elementi e attributi ammessi: solo testo, titoli, elenchi, tabelle, collegamenti. */
const ELEMENTI = new Set(['h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br', 'section', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span']);
const VUOTI = new Set(['br']);
const CLASSI = new Set(['segnaposto', 'opposizione']);
function attributoAmmesso(el, nome, valore) {
  if (nome === 'lang') return LINGUE.includes(valore);
  if (nome === 'id') return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(valore);
  if (nome === 'class') return valore.split(' ').every(c => CLASSI.has(c));
  if (nome === 'href') return el === 'a' && (/^https:\/\/[^\s"<>]+$/.test(valore) || /^#[a-z0-9-]+$/.test(valore));
  if (nome === 'scope') return el === 'th' && /^(row|col)$/.test(valore);
  return false;
}
const RE_TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z-]+="[^"<>]*")*)\s*(\/?)>/g;

/* Errori di un testo (sorgente, prima di riempire i segnaposto). voce: la configurazione del testo (null o {versione, data}). */
function errori(sorgente, id, lingua, voce) {
  const e = [], dove = `sorgenti/testi/${lingua}/${id}.html`;
  const t = sorgente.replace(/<!--[\s\S]*?-->/g, '');
  if (!t.trim()) return [dove + ': vuoto'];
  // elementi e attributi, e annidamento
  const pila = [];
  for (const m of t.matchAll(RE_TAG)) {
    const [, chiude, nomeEl, attr, auto] = m, el = nomeEl.toLowerCase();
    if (!ELEMENTI.has(el)) { e.push(`${dove}: elemento non ammesso <${el}>`); continue; }
    if (chiude) {
      if (attr.trim()) e.push(`${dove}: attributi in un tag di chiusura </${el}>`);
      if (pila.pop() !== el) e.push(`${dove}: </${el}> non chiude l'elemento aperto`);
      continue;
    }
    for (const a of attr.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) if (!attributoAmmesso(el, a[1].toLowerCase(), a[2])) e.push(`${dove}: attributo non ammesso ${a[1]}="${a[2].slice(0, 40)}" in <${el}>`);
    if (!VUOTI.has(el) && !auto) pila.push(el);
  }
  if (pila.length) e.push(`${dove}: elementi non chiusi (${pila.join(', ')})`);
  const resto = t.replace(RE_TAG, '');
  if (/[<>]/.test(resto)) e.push(`${dove}: «<» o «>» fuori da un elemento ammesso`);
  if (/&(?!(?:amp|lt|gt|quot|nbsp|#\d{1,6});)/.test(resto)) e.push(`${dove}: «&» da scrivere come &` + 'amp;');
  // segnaposti
  for (const m of t.matchAll(/\{[^{}\s]{1,40}\}/g)) if (!SEGNAPOSTI.includes(m[0])) e.push(`${dove}: segnaposto sconosciuto ${m[0]}`);
  const r = REGOLE[id];
  for (const s of r.servono) if (!t.includes(s)) e.push(`${dove}: manca ${s}`);
  if (!r.autorita && t.includes('{casella_autorita}')) e.push(`${dove}: la casella per le autorità sta soltanto nelle note legali`);
  if (r.autorita && lingua !== 'en' && !/<(\w+)[^>]*\blang="en"[^>]*>(?:(?!<\/\1>)[\s\S])*\{casella_autorita\}/.test(t))
    e.push(`${dove}: la casella per le autorità va anche in una parte scritta in inglese (lang="en")`);
  if (r.opposizione && !/<section[^>]*\bclass="[^"]*\bopposizione\b/.test(t)) e.push(`${dove}: manca il riquadro separato del diritto di opposizione (<section class="opposizione">)`);
  if (r.dove && !/\bid="dove-stanno-i-dati"/.test(t)) e.push(`${dove}: manca la sezione «Dove stanno i dati» (id="dove-stanno-i-dati")`);
  // nessun indirizzo postale (§ 10.6; § 31.1): un codice postale seguito dal nome di una città
  if (/\b\d{5}\s+[A-ZÀ-Ý][a-zà-ÿ]/.test(resto)) e.push(`${dove}: sembra un indirizzo postale (codice e città): i testi non ne contengono`);
  // segnaposto del testo e versione nella configurazione
  const inPreparazione = /\bclass="[^"]*\bsegnaposto\b/.test(t);
  if (voce == null && !inPreparazione) e.push(`${dove}: testo senza versione in sorgenti/config.js (testi.${TESTI.find(x => x.id === id).voce}): aggiungi versione e data`);
  if (voce != null && inPreparazione) e.push(`${dove}: c'è ancora un segnaposto ma sorgenti/config.js gli dà la versione ${voce.versione}`);
  return e;
}

/* La configurazione dei testi: per ognuno null oppure {versione: «1.0», data: «AAAA-MM-GG»}. */
function controllaConfigurazione(cfg) {
  const t = cfg.testi || {};
  for (const x of TESTI) {
    const v = t[x.voce];
    if (v === undefined) throw new Error(`config.js: manca testi.${x.voce} (null finché il testo è in preparazione)`);
    if (v === null) continue;
    if (!v || !/^\d+\.\d+$/.test(String(v.versione)) || !/^\d{4}-\d{2}-\d{2}$/.test(String(v.data)) || isNaN(Date.parse(v.data + 'T00:00:00Z')))
      throw new Error(`config.js: testi.${x.voce} deve essere null oppure {versione: '1.0', data: 'AAAA-MM-GG'}`);
  }
}

/* Tutti i testi presenti: {it: {informativa: '…', …}, en: {…}}. L'italiano deve averli tutti e quattro. */
function leggiTesti(cartella = CARTELLA) {
  const testi = {};
  for (const l of fs.readdirSync(cartella, { withFileTypes: true })) {
    if (!l.isDirectory()) continue;
    if (!LINGUE.includes(l.name)) throw new Error(`sorgenti/testi/${l.name}/: lingua sconosciuta (ammesse: ${LINGUE.join(', ')})`);
    testi[l.name] = {};
    for (const f of fs.readdirSync(path.join(cartella, l.name))) {
      const id = f.replace(/\.html$/, '');
      if (!f.endsWith('.html') || !TESTI.some(x => x.id === id)) throw new Error(`sorgenti/testi/${l.name}/${f}: file sconosciuto (ammessi: ${TESTI.map(x => x.id + '.html').join(', ')})`);
      testi[l.name][id] = fs.readFileSync(path.join(cartella, l.name, f), 'utf8');
    }
  }
  for (const x of TESTI) if (!testi.it || !testi.it[x.id]) throw new Error(`manca sorgenti/testi/it/${x.id}.html`);
  return testi;
}

/* Le traduzioni dell'interfaccia (sorgenti/parti/traduzioni.js), per le pagine di testo nelle altre lingue. */
function traduttore() {
  const t = fs.readFileSync(path.join(SORGENTI, 'parti', 'traduzioni.js'), 'utf8');
  const TR = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
  return (lingua, cfg, k, v = {}) => {
    const s = (lingua !== 'it' && TR[lingua] && TR[lingua][k]) || k;
    return s.replace(/\{(\w+)\}/g, (m, n) => n === 'nome' ? cfg.nome : (n in v ? v[n] : m));
  };
}
const LOCALI = { it: 'it-IT', en: 'en-GB', es: 'es-ES', fr: 'fr-FR', ar: 'ar' };
const dataLunga = (aaaammgg, lingua) => new Intl.DateTimeFormat(LOCALI[lingua], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(aaaammgg + 'T00:00:00Z'));

/* Riempie i segnaposto (valori protetti per l'HTML). base: il percorso fino alla radice dell'app («» dalla pagina
   dell'app, «../../» da una pagina di testo). I collegamenti esterni si aprono a parte, senza pagina di provenienza. */
function riempi(sorgente, cfg, lingua, base, T) {
  const casella = c => /^\[.*\]$/.test(String(c)) ? `<span class="segnaposto">${escH(c)}</span>` : `<a href="mailto:${escH(c)}">${escH(c)}</a>`;
  const v = {
    '{nome}': escH(cfg.nome), '{titolare}': escH(cfg.titolare),
    '{casella_contatto}': casella(cfg.caselle.contatto), '{casella_autorita}': casella(cfg.caselle.autorita || '[casella per le autorità]'),
    '{licenze}': `<a href="${escH(base)}licenze/index.html" target="_blank" rel="noopener noreferrer">${escH(T(lingua, cfg, 'Licenze dei componenti'))}</a>`,
  };
  return sorgente.replace(/<!--[\s\S]*?-->\n?/g, '').trim()
    .replace(/<a href="(https:[^"]*)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer"')
    .replace(/\{(nome|titolare|casella_contatto|casella_autorita|licenze)\}/g, m => v[m]);
}

/* Il collegamento alla politica della riserva (TDMRep, tdm-policy): le condizioni d'uso, sull'indirizzo pubblico. */
function politica(cfg) {
  const base = ((cfg.indirizzi || {}).app_pubblica || '').replace(/\/$/, '');
  return base ? base + '/testi/it/condizioni-uso.html' : '';
}
/* I metadati della riserva dell'estrazione per le pagine (T-056; § 6.5; TDMRep, W3C Community Group, 2024). */
function metaRiserva(cfg) {
  const p = politica(cfg);
  return '<meta name="tdm-reservation" content="1">' + (p ? `\n<meta name="tdm-policy" content="${escH(p)}">` : '');
}

const CSS = `:root{color-scheme:light dark;--fondo:#FFFDF8;--testo:#1F2420;--tenue:#5B635D;--riga:#E4E0D6;--riquadro:#F4F1EA;--link:#2D5A3D;--segnaposto:#8A5A00}
@media (prefers-color-scheme:dark){:root{--fondo:#161A17;--testo:#ECEDE9;--tenue:#AEB4AF;--riga:#333A35;--riquadro:#1F2420;--link:#86B795;--segnaposto:#E0B464}}
*{box-sizing:border-box}
body{margin:0;background:var(--fondo);color:var(--testo);font:1rem/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:46rem;margin:0 auto;padding:1.25rem 1rem 3rem}
h1{font-size:1.5rem;line-height:1.25;margin:.25rem 0 .5rem}
h2{font-size:1.1rem;margin:2.5rem 0 .5rem;padding-top:1rem;border-top:1px solid var(--riga)}
h3{font-size:1.05rem;margin:1.5rem 0 .25rem}
h4{font-size:1rem;margin:1rem 0 .25rem}
p,li{max-width:40rem}
a{color:var(--link)}
.tenue{color:var(--tenue);font-size:.9rem;margin:0}
.versione{display:inline-block;font-size:.85rem;font-weight:700;border:1px solid var(--riga);border-radius:999px;padding:.15rem .7rem;margin:0 0 1rem}
.segnaposto{color:var(--segnaposto);font-style:italic}
section.opposizione{border:2px solid var(--testo);border-radius:.6rem;padding:.25rem 1rem;margin:1rem 0}
table{border-collapse:collapse;width:100%;font-size:.9rem;margin:.5rem 0}
th,td{border:1px solid var(--riga);padding:.35rem .5rem;text-align:start;vertical-align:top}
ul.altri{padding-inline-start:1.2rem}
`;

/* Una pagina di solo testo. */
function pagina(x, lingua, sorgente, cfg, T) {
  const voce = (cfg.testi || {})[x.voce];
  const versione = voce ? T(lingua, cfg, 'Versione {v} · aggiornata il {data}', { v: escH(voce.versione), data: escH(dataLunga(voce.data, lingua)) }) : escH(T(lingua, cfg, 'In preparazione'));
  const ver = crypto.createHash('sha256').update(CSS).digest('hex').slice(0, 10);
  const altri = TESTI.filter(y => y.id !== x.id).map(y => `<li><a href="${escH(y.id)}.html">${escH(T(lingua, cfg, y.titolo))}</a></li>`).join('\n');
  return `<!DOCTYPE html>
<!-- Pagina montata da sorgenti/testi-pubblicati.js a partire da sorgenti/testi/${lingua}/${x.id}.html: non modificare qui. -->
<html lang="${lingua}" dir="${lingua === 'ar' ? 'rtl' : 'ltr'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">${voce ? '' : '\n<meta name="robots" content="noindex">'}
${metaRiserva(cfg)}
<title>${escH(T(lingua, cfg, x.titolo))} · ${escH(cfg.nome)}</title>
<link rel="stylesheet" href="../testi.css?v=${ver}">
</head>
<body>
<main>
<p class="tenue">${escH(T(lingua, cfg, '{nome}, progetto di {titolare}', { titolare: cfg.titolare }))}</p>
<h1>${escH(T(lingua, cfg, x.titolo))}</h1>
<p class="versione">${versione}</p>
${riempi(sorgente, cfg, lingua, '../../', T)}
<h2>${escH(T(lingua, cfg, 'Altri testi'))}</h2>
<ul class="altri">
${altri}
<li><a href="../../licenze/index.html">${escH(T(lingua, cfg, 'Licenze dei componenti'))}</a></li>
</ul>
</main>
</body>
</html>
`;
}

/* Controlla tutto e restituisce {file, modelli}: le pagine di testo da aggiungere all'uscita e i modelli per la
   pagina dell'app. */
function testiPubblicati(cfg) {
  controllaConfigurazione(cfg);
  const testi = leggiTesti(), T = traduttore(), sbagli = [];
  for (const [l, gruppo] of Object.entries(testi)) for (const [id, s] of Object.entries(gruppo)) sbagli.push(...errori(s, id, l, cfg.testi[TESTI.find(x => x.id === id).voce]));
  if (sbagli.length) throw new Error('Testi pubblicati:\n  ' + sbagli.join('\n  '));
  const file = { 'testi/testi.css': CSS }, modelli = [];
  for (const [l, gruppo] of Object.entries(testi)) for (const x of TESTI) {
    if (!gruppo[x.id]) continue;
    file[`testi/${l}/${x.id}.html`] = pagina(x, l, gruppo[x.id], cfg, T);
    modelli.push(`<template id="leg-${x.id}${l === 'it' ? '' : '-' + l}" lang="${l}">${riempi(gruppo[x.id], cfg, l, '', T)}</template>`);
  }
  return { file, modelli: modelli.join('\n') };
}

module.exports = { TESTI, REGOLE, LINGUE, errori, leggiTesti, testiPubblicati, metaRiserva, politica, riempi, CSS };
