/* Pagina delle licenze dei componenti di terzi (voce T-004 del piano di adeguamento).

   Legge la tabella «Componenti nell'app» di COMPONENTI_DI_TERZI.md e i testi in licenze/,
   e restituisce i file da pubblicare con l'app nella cartella licenze/:
     licenze/index.html    titolari, licenze e testi integrali dei componenti della tabella
     licenze/licenze.css   lo stile della pagina (nessuno stile e nessuno script dentro la pagina)
     licenze/<testo>.txt   i testi delle licenze, così come sono
   Libro mastro: § 6.6, regole 2-3; § 31.1 (testi integrali in un file distribuito con l'app). */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RADICE = path.resolve(__dirname, '..');
const ELENCO = path.join(RADICE, 'COMPONENTI_DI_TERZI.md');
const TESTI = path.join(RADICE, 'licenze');
const SEZIONE = "Componenti nell'app";

const escH = require('./moduli/testo.js').esc;   // la stessa funzione dell'app (T-024)
// Il testo delle celle è Markdown semplice: tolgo gli apici inversi del codice.
const piano = s => String(s).replace(/`([^`]*)`/g, '$1').trim();

/* Righe di una tabella Markdown che sta sotto il titolo «## <titolo>», come oggetti {colonna: valore}. */
function tabella(md, titolo) {
  const righe = md.split('\n');
  const inizio = righe.findIndex(r => r.trim() === '## ' + titolo);
  if (inizio < 0) throw new Error('COMPONENTI_DI_TERZI.md: manca la sezione «' + titolo + '»');
  const celle = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  const tab = [];
  for (let i = inizio + 1; i < righe.length && !righe[i].startsWith('## '); i++) {
    if (righe[i].trim().startsWith('|')) tab.push(celle(righe[i]));
    else if (tab.length) break;
  }
  if (tab.length < 2) throw new Error('COMPONENTI_DI_TERZI.md: la tabella «' + titolo + '» non ha intestazione'); // senza righe è ammessa (servizi, dal blocco 3)
  const [testa, , ...corpo] = tab;
  return corpo.map((c, n) => {
    if (c.length !== testa.length) throw new Error('COMPONENTI_DI_TERZI.md, «' + titolo + '», riga ' + (n + 1) + ': ' + c.length + ' celle invece di ' + testa.length);
    return Object.fromEntries(testa.map((t, i) => [t, c[i]]));
  });
}

/* Componenti nell'app, con i nomi dei file dei loro testi. */
function componenti(md = fs.readFileSync(ELENCO, 'utf8')) {
  return tabella(md, SEZIONE).map(r => ({
    nome: piano(r['Componente']),
    versione: piano(r['Versione']),
    licenza: piano(r['Licenza']),
    titolari: piano(r['Titolari']),
    testi: piano(r['Testo']).split(',').map(s => s.trim()).filter(Boolean),
  }));
}

const CSS = `:root{color-scheme:light dark;--fondo:#FFFDF8;--testo:#1F2420;--tenue:#5B635D;--riga:#E4E0D6;--riquadro:#F4F1EA;--link:#2D5A3D}
@media (prefers-color-scheme:dark){:root{--fondo:#161A17;--testo:#ECEDE9;--tenue:#AEB4AF;--riga:#333A35;--riquadro:#1F2420;--link:#86B795}}
*{box-sizing:border-box}
body{margin:0;background:var(--fondo);color:var(--testo);font:1rem/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:46rem;margin:0 auto;padding:1.25rem 1rem 3rem}
h1{font-size:1.5rem;line-height:1.25;margin:.5rem 0 .75rem}
h2{font-size:1.15rem;margin:2rem 0 .25rem;padding-top:1rem;border-top:1px solid var(--riga)}
p,li{max-width:40rem}
a{color:var(--link)}
.tenue{color:var(--tenue);font-size:.9rem}
ul.indice{padding-left:1.2rem}
ul.indice li{margin:.3rem 0}
dl{display:grid;grid-template-columns:max-content 1fr;gap:.2rem .75rem;margin:.5rem 0}
dt{color:var(--tenue)}
dd{margin:0}
pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--riquadro);border:1px solid var(--riga);border-radius:.5rem;padding:.75rem;font-size:.8rem;line-height:1.45;margin:.5rem 0 1rem}
`;

/* File della cartella licenze/ da pubblicare con l'app. */
/* fuori: nomi dei testi (es. un testo di un componente della sola redazione) dei componenti che non viaggiano con questa app (T-033). */
function fileLicenze(cfg, fuori = []) {
  const elenco = componenti().filter(c => !c.testi.some(t => fuori.includes(t)));
  const file = {};
  for (const c of elenco) for (const t of c.testi) {
    if (!/^[a-z0-9.-]+\.txt$/.test(t)) throw new Error('COMPONENTI_DI_TERZI.md: nome di testo non valido «' + t + '» (' + c.nome + ')');
    if (!fs.existsSync(path.join(TESTI, t))) throw new Error('Manca licenze/' + t + ' (' + c.nome + ')');
    file['licenze/' + t] = fs.readFileSync(path.join(TESTI, t), 'utf8');
  }
  file['licenze/licenze.css'] = CSS;
  const ver = crypto.createHash('sha256').update(CSS).digest('hex').slice(0, 10);
  const ancora = c => 'c-' + c.nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const voci = elenco.map(c => `<li><a href="#${ancora(c)}">${escH(c.nome)}</a> <span class="tenue">· ${escH(c.licenza.split(';')[0])}</span></li>`).join('\n');
  const sezioni = elenco.map(c => `<section id="${ancora(c)}">
<h2>${escH(c.nome)}</h2>
<dl><dt>Versione</dt><dd>${escH(c.versione)}</dd><dt>Titolari</dt><dd>${escH(c.titolari)}</dd><dt>Licenza</dt><dd>${escH(c.licenza)}</dd></dl>
${c.testi.map(t => `<p class="tenue">Testo integrale (<a href="${escH(t)}">${escH(t)}</a>):</p>
<pre>${escH(file['licenze/' + t])}</pre>`).join('\n')}
</section>`).join('\n');
  file['licenze/index.html'] = `<!DOCTYPE html>
<!-- Pagina montata da sorgenti/licenze.js a partire da COMPONENTI_DI_TERZI.md e licenze/: non modificare qui. -->
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="referrer" content="no-referrer">
<title>Licenze dei componenti · ${escH(cfg.nome)}</title>
<link rel="stylesheet" href="licenze.css?v=${ver}">
</head>
<body>
<main>
<h1>Licenze dei componenti di terzi</h1>
<p>${escH(cfg.nome)} usa questi componenti di terzi. Per ciascuno trovi la versione, chi ne detiene i diritti, la licenza e il testo integrale della licenza, così com'è.</p>
<ul class="indice">
${voci}
</ul>
${sezioni}
</main>
</body>
</html>
`;
  return file;
}

module.exports = { componenti, tabella, fileLicenze, ELENCO };
