/* Prova: nessun indirizzo esterno nell'app montata oltre a quelli ammessi dalla configurazione (voce T-005).

   Ammessi: gli indirizzi base di sorgenti/config.js (indirizzi) e le pagine che l'app apre solo al tocco
   (collegamenti). Ogni altro indirizzo è uno scarto del § 2.4 e deve stare in prove/scarti-noti.js con la voce
   che lo toglie (piano di adeguamento, sezione 11). I testi delle licenze (licenze/*.txt) sono riprodotti così
   come sono e non si controllano; della pagina licenze/index.html si controllano i collegamenti. Non si
   controllano neppure le librerie di terzi in lib/: sono copie fisse, verificate sull'impronta da
   prove/componenti.js, e i loro testi contengono indirizzi che non contattano (spazi dei nomi, guide).
   Le richieste che il telefono fa davvero le controlla prove/browser/richieste.js. */
'use strict';
const { USCITE, leggiUscita, config, riga, esito, eseguiDaSola, confronta } = require('./comune.js');

const URL_RE = /https?:\/\/[^\s"'`<>()\\{}|^]+/g;

function ammessi() {
  const c = config();
  return [...Object.values(c.indirizzi || {}), ...(c.collegamenti || [])].filter(Boolean).map(u => u.replace(/\/$/, ''));
}
const ammesso = (url, lista) => lista.some(a => url === a || url.startsWith(a) && /[/?#]/.test(url[a.length]));

function prova() {
  const e = esito('Indirizzi esterni');
  const lista = ammessi();
  for (const u of USCITE) {
    const trovati = [];
    for (const [f, testo] of Object.entries(leggiUscita(u))) {
      if (/^licenze\/.*\.txt$/.test(f) || f.startsWith('lib/') || typeof testo !== 'string') continue;   // le icone non hanno testo
      const fonte = f === 'licenze/index.html' ? [...testo.matchAll(/\b(?:href|src)="([^"]*)"/g)].map(m => m[1]).join('\n') : testo;
      for (const m of fonte.matchAll(URL_RE)) {
        const url = m[0].replace(/[.,;:!?]+$/, '');
        if (ammesso(url, lista)) continue;
        const x = new URL(url.replace(/\$.*$/, ''));
        const primo = x.pathname.split('/').filter(Boolean)[0];
        trovati.push({ chiave: x.host + (primo ? '/' + primo : ''), dove: f, dettaglio: `riga ${riga(fonte, m.index)}` });
      }
    }
    confronta(e, 'indirizzi', trovati, u);
  }
  e.note.push('ammessi dalla configurazione: ' + lista.join(', '));
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
