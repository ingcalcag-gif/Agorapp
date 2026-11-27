/* Prova: montaggio compattato, controllo finale e modello delle intestazioni di sicurezza (voce T-060; libro mastro,
   § 2.4, «Il codice»; § 3.11; § 6.6, regola 3; documento: docs/montaggio.md).

   1. Le uscite sono compattate (app.js, moduli.js, sezioni.js): niente commenti tranne quelli di licenza, molto più
      piccole della forma leggibile; i commenti di licenza («/*!», @license) restano.
   2. Il controllo finale rifiuta un'uscita con un indirizzo non ammesso, una chiave privata (anche JWK), un gettone di
      un servizio o una chiave di caricamento, e accetta le uscite vere.
   3. Il modello sorgenti/intestazioni.json: per le due app le intestazioni richieste, una politica dei contenuti senza
      codice scritto nella pagina né valutazione di testo, gli indirizzi della configurazione; la pagina delle app non
      contiene script scritti dentro né gestori, così la politica non la rompe. */
'use strict';
const { leggiUscita, config, esito, eseguiDaSola } = require('./comune.js');
const { uscita } = require('../sorgenti/build.js');
const C = require('../sorgenti/controllo-uscita.js');

function prova() {
  const e = esito('Montaggio compattato, controllo finale, intestazioni di sicurezza');
  const err = x => e.errori.push(x);
  const cfg = config();
  const quote = [];

  /* 1 */
  for (const u of ['pubblica', 'redazione']) {
    const d = leggiUscita(u), l = uscita(cfg, u, { leggibile: true });
    for (const f of ['app.js', 'moduli.js', 'sezioni.js']) {
      if (!d[f]) { err(`dist/${u}/${f} manca`); continue; }
      const commenti = (d[f].match(/\/\*(?![!@])[\s\S]*?\*\//g) || []).filter(c => !/@license|@preserve/.test(c));
      if (commenti.length) err(`dist/${u}/${f}: non è compattato (${commenti.length} commenti)`);
      if (d[f].length > 0.85 * l[f].length) err(`dist/${u}/${f}: compattato è ancora l'${Math.round(100 * d[f].length / l[f].length)}% della forma leggibile`);
      if (f === 'app.js') quote.push(`${u} ${Math.round(l[f].length / 1024)}→${Math.round(d[f].length / 1024)} KB`);
    }
  }
  const lic = C.compattaJs('/*! Avviso di licenza */\n/* commento */\nfunction somma(a, b) { return a + b; }\nwindow.x = somma(1, 2);', 'prova');
  if (!lic.includes('/*! Avviso di licenza */') || lic.includes('commento')) err('compattaJs: deve tenere i commenti di licenza e togliere gli altri');
  if (!/function somma\(/.test(lic)) err('compattaJs: i nomi globali restano');
  if (C.compattaCss('/* c */\n  a{b:c}\n\n') !== 'a{b:c}') err('compattaCss: toglie commenti, spazi in testa e righe vuote');

  /* 2 */
  const base = { 'app.js': 'fetch("' + (cfg.indirizzi.ricerca_indirizzi || 'https://photon.komoot.io') + '/api")' };
  if (C.problemi(base, cfg, 'pubblica').length) err('controllo finale: rifiuta un indirizzo ammesso');
  const casi = [
    ['indirizzo non ammesso', { 'app.js': 'fetch("https://esempio.invalid/raccolta")' }],
    ['chiave privata', { 'app.js': '"-----BEGIN ' + 'PRIVATE KEY-----"' }],
    ['chiave privata JWK', { 'moduli.js': '{"kty":"EC","d":"' + 'A'.repeat(43) + '"}' }],
    ['gettone di un servizio', { 'app.js': '"gh' + 'p_' + 'a'.repeat(36) + '"' }],
    ['chiave di caricamento', { 'app.js': 'headers:{AccessKey:"12345678-1234-1234-1234-123456789012abcd"}' }],
    ['indirizzo nella pagina delle licenze', { 'licenze/index.html': '<a href="https://esempio.invalid/">x</a>' }],
  ];
  for (const [che, f] of casi) if (!C.problemi(f, cfg, 'pubblica').length) err('controllo finale: non ferma ' + che);
  if (C.problemi({ 'lib/x.js': 'https://esempio.invalid/' }, cfg, 'pubblica').length) err('controllo finale: le librerie di terzi in lib/ non si controllano (impronte fisse, prove/componenti.js)');
  let fermato = false; try { C.controlloFinale(casi[0][1], cfg, 'pubblica'); } catch (x) { fermato = true; }
  if (!fermato) err('controllo finale: deve fermare il montaggio');

  /* 3 */
  for (const u of ['pubblica', 'redazione']) {
    let h; try { h = C.intestazioni(cfg, u); } catch (x) { err(x.message); continue; }
    const csp = h['Content-Security-Policy'] || '';
    const dir = Object.fromEntries(csp.split(';').map(x => x.trim()).filter(Boolean).map(x => { const [k, ...v] = x.split(/\s+/); return [k, v]; }));
    if (!dir['script-src'] || dir['script-src'].join(' ') !== "'self'") err(`${u}: script-src deve essere soltanto 'self' (nessun codice scritto nella pagina)`);
    if (/'unsafe-eval'|'unsafe-inline'/.test((dir['script-src'] || []).join(' ') + (dir['default-src'] || []).join(' ') + (dir['style-src'] || []).join(' '))) err(`${u}: niente 'unsafe-eval' o 'unsafe-inline' per script e fogli di stile`);
    for (const [k, v] of [['default-src', "'none'"], ['frame-ancestors', "'none'"], ['object-src', "'none'"], ['base-uri', "'none'"]]) if (!dir[k] || dir[k][0] !== v) err(`${u}: ${k} deve essere ${v}`);
    if (!('upgrade-insecure-requests' in dir)) err(`${u}: manca upgrade-insecure-requests (connessione cifrata obbligatoria)`);
    const photon = new URL(cfg.indirizzi.ricerca_indirizzi).origin;
    if (!(dir['connect-src'] || []).includes(photon)) err(`${u}: connect-src deve ammettere la ricerca degli indirizzi (${photon})`);
    for (const x of (dir['connect-src'] || [])) if (x !== "'self'" && !Object.values(cfg.indirizzi).filter(Boolean).some(a => new URL(a).origin === x)) err(`${u}: connect-src ammette ${x}, che la configurazione non nomina`);
    if (!/max-age=\d{7,}/.test(h['Strict-Transport-Security'] || '')) err(`${u}: manca Strict-Transport-Security di almeno sei mesi`);
    if (h['Referrer-Policy'] !== 'no-referrer') err(`${u}: Referrer-Policy deve essere no-referrer`);
    if (h['X-Content-Type-Options'] !== 'nosniff') err(`${u}: manca X-Content-Type-Options`);
    if (!/geolocation=\(self\)/.test(h['Permissions-Policy'] || '') || !/camera=\(\)/.test(h['Permissions-Policy'] || '') || !/microphone=\(\)/.test(h['Permissions-Policy'] || '')) err(`${u}: Permissions-Policy deve tenere la posizione per lo stesso indirizzo e negare camera e microfono`);
    if (u === 'redazione' && !/noindex/.test(h['X-Robots-Tag'] || '')) err('redazione: manca X-Robots-Tag noindex');
    if (u === 'pubblica' && h['tdm-reservation'] !== '1') err('pubblica: manca l\'intestazione tdm-reservation (T-056)');
    /* la pagina dell'app non ha codice scritto dentro */
    const pagina = leggiUscita(u)['index.html'] || '';
    if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(pagina)) err(`dist/${u}/index.html: c'è uno script scritto nella pagina`);
    if (/<[a-z][^>]*\son[a-z]+\s*=/i.test(pagina) || /javascript:/i.test(pagina)) err(`dist/${u}/index.html: gestori o javascript: nella pagina`);
    if (/<style[\s>]/i.test(pagina)) err(`dist/${u}/index.html: un foglio di stile scritto nella pagina`);
  }
  /* 4. il fattorino (T-061): scritto e spento, carica soltanto con la chiave della zona e la variabile accesa */
  const fs = require('fs'), path = require('path');
  const wf = path.join(__dirname, '..', '.github', 'workflows', 'pubblica.yml');
  if (!fs.existsSync(wf)) err('manca .github/workflows/pubblica.yml (T-061)');
  else {
    const y = fs.readFileSync(wf, 'utf8');
    const segreti = [...new Set((y.match(/secrets\.[A-Z_]+/g) || []))];
    if (segreti.join() !== 'secrets.BUNNY_CHIAVE_CARICAMENTO') err('pubblica.yml: l\'unico segreto è la chiave di caricamento della zona (' + segreti.join(', ') + ')');
    if (!/if:\s*steps\.stato\.outputs\.carica == 'si'/.test(y) || !/vars\.PUBBLICA_SU_BUNNY == 'si'/.test(y)) err('pubblica.yml: il caricamento deve partire soltanto con la variabile accesa e la chiave');
    if (!/npm run build/.test(y) || !/git status --porcelain dist/.test(y)) err('pubblica.yml: prima del caricamento servono montaggio, prove e uscite uguali al repository');
    if (/netlify/i.test(y.replace(/^#.*$/gm, ''))) err('pubblica.yml: il fattorino non tocca Netlify');
    if (!/inputs\.versione/.test(y)) err('pubblica.yml: manca il ripristino di una versione precedente');
  }
  /* 5. i lavori di GitHub Actions si leggono: un nome o una descrizione senza apici non contiene «: » né « #»
     (con i due punti seguiti da uno spazio GitHub rifiuta il file intero e il lavoro non parte; dopo « #» il testo
     sparisce come commento). */
  const cartellaLavori = path.join(__dirname, '..', '.github', 'workflows');
  let righeLavori = 0;
  for (const f of fs.existsSync(cartellaLavori) ? fs.readdirSync(cartellaLavori).filter(x => /\.ya?ml$/.test(x)) : []) {
    fs.readFileSync(path.join(cartellaLavori, f), 'utf8').split('\n').forEach((r, i) => {
      const m = r.match(/^\s*(?:-\s+)?(?:name|description):\s+(.*)$/);
      if (!m) return;
      righeLavori++;
      const v = m[1].trim();
      if (/^['"|>]/.test(v)) return;
      if (/:\s/.test(v) || /:$/.test(v) || /\s#/.test(v)) err(`.github/workflows/${f}, riga ${i + 1}: «${v}» va scritto tra apici (con «: » o « #» GitHub non legge il file)`);
    });
  }
  e.note.push(`app.js: ${quote.join('; ')}; ${casi.length} casi fermati dal controllo finale; intestazioni delle due app controllate; ${righeLavori} nomi dei lavori di GitHub Actions leggibili`);
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
