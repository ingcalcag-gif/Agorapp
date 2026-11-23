/* Prova nel browser: mai soltanto il colore; l'elenco è completo (voce T-025; libro mastro, § 11.3, regole 3 e 5).

   Con l'archivio di prova (eventi inventati a Torino e a Milano) e un Off-Grid inventato nella memoria del telefono:
   - ogni strato ha, nel pannello Strati, un nome scritto e un'icona sua, diversa da quella degli altri;
   - ogni segnaposto ha l'icona del suo strato e un'etichetta per il lettore di schermo con strato, titolo e data;
     l'Off-Grid dice «Off-Grid»; un evento salvato dice «nel calendario»;
   - ogni riga dell'elenco ha l'icona e il nome dello strato scritto;
   - l'elenco («agenda») contiene esattamente gli eventi che hanno un segnaposto sulla mappa della zona, da soli o dentro
     un gruppo, e il numero sul tasto è lo stesso: a Torino con tutti gli strati, con uno strato spento, con il filtro
     «Domani», con «Il tuo calendario», a Milano, e da lontano (nessun evento pubblico né sulla mappa né nell'elenco);
   - nel calendario, vista Mese, il giorno con qualcosa lo dice anche a parole;
   - il lucchetto degli eventi nascosti compare nel codice solo accanto a un testo. */
'use strict';
const fs = require('fs');
const path = require('path');
const { esito, eseguiDaSola, RADICE } = require('../comune.js');
const { playwright, server, apri, giorno, pausa, eventiCaricati } = require('./comune.js');

const TUTTI = Object.fromEntries(['musica', 'arte', 'sport', 'sociale', 'cibo', 'teatro', 'cinema', 'conferenze', 'laboratori', 'manifestazioni', 'mercati', 'benessere', 'volontariato'].map(k => [k, { on: true }]));
const ID_OG = 'prova-agenda-og';
const OFFGRID = () => [{ id: ID_OG, personal: true, offgrid: true, title: 'Cena inventata', address: 'Via Finta 2', addressFull: 'Via Finta 2, Torino', addrPrecision: 'exact', notes: '', links: [], link: '',
  category: '', sublayer: '', datetime: giorno(1) + 'T20:00', end: giorno(1) + 'T22:00', lat: 45.072, lng: 7.69, hidden: false, price: '' }];
const spia = () => {   // tiene da parte la mappa che l'app crea, per spostarla dall'esterno
  let ml; Object.defineProperty(window, 'maplibregl', { configurable: true, get() { return ml; },
    set(v) { const M = v.Map; v.Map = function (...a) { const m = new M(...a); window.__mappaProva = m; return m; }; v.Map.prototype = M.prototype; ml = v; } });
};
const vai = (p, lng, lat, zoom) => p.evaluate(([lng, lat, zoom]) => window.__mappaProva.jumpTo({ center: [lng, lat], zoom }), [lng, lat, zoom]);

/* Gli eventi che hanno un segnaposto (da soli o in un gruppo), con le etichette dei segnaposto singoli. */
const sullaMappa = p => p.evaluate(() => {
  const ids = [], etichette = {}, senzaIcona = [];
  for (const b of document.querySelectorAll('#map .pin')) {
    if (b.dataset.ev) { ids.push(b.dataset.ev); etichette[b.dataset.ev] = b.getAttribute('aria-label') || ''; if (!b.querySelector('.f svg')) senzaIcona.push(b.dataset.ev); }
    else if (b.dataset.gruppo) ids.push(...b.dataset.gruppo.split(','));
  }
  return { ids: ids.sort(), etichette, senzaIcona, conta: (document.querySelector('#btnElenco .conta') || {}).textContent };
});
/* Gli eventi dell'elenco aperto, con ciò che ogni riga mostra. */
const nellElenco = p => p.evaluate(() => [...document.querySelectorAll('#foglio-slot .riga-ev')].map(r => ({ id: r.dataset.ev, icona: !!r.querySelector('svg.forma'), meta: (r.querySelector('.meta') || {}).textContent || '', titolo: (r.querySelector('.t') || {}).textContent || '' })));

async function prova() {
  const e = esito('Mai soltanto il colore; elenco completo (browser)');
  /* il lucchetto: nel codice sta solo dentro il suo segno con il testo, oppure nei punti che hanno il testo accanto.
     Dal blocco 8 si guardano anche gli strumenti della Redazione (sorgenti/redazione/, T-033). */
  const AMMESSI = { 'parti/app2.js': 2, 'parti/app3.js': 2, 'parti/app4.js': 1, 'redazione/strumenti.js': 1 };   // definizione del segno e segnaposto (etichetta); riga degli Strati e testata della scheda; sblocco con la password; nell'app della redazione: voce «Chiavi», con il testo accanto (l'interruttore «Evento nascosto» è uscito con il modulo di prima: torna con il blocco 11)
  for (const c of ['parti', 'redazione']) for (const f of fs.readdirSync(path.join(RADICE, 'sorgenti', c)).filter(f => /\.js$/.test(f))) {
    const n = (fs.readFileSync(path.join(RADICE, 'sorgenti', c, f), 'utf8').match(/icoLucchetto\(/g) || []).length, k = c + '/' + f;
    if (n !== (AMMESSI[k] || 0)) e.errori.push(`${k}: il lucchetto degli eventi nascosti compare ${n} volte, ne sono previste ${AMMESSI[k] || 0}: ogni lucchetto ha accanto un testo (segnoNascosto) e va annotato qui`);
  }
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const s = await server('pubblica');
  const { browser, ctx } = await apri(pw, { dl_guida: '1', dl_strati: TUTTI, dl_eventi: OFFGRID() });
  let confronti = 0;
  try {
    const p = await ctx.newPage();
    p.on('pageerror', err => e.errori.push('errore nella pagina: ' + err.message));
    await p.addInitScript(spia);
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]');
    if (!(await eventiCaricati(p, 10))) e.errori.push('gli eventi dell\'archivio di prova non arrivano');
    await pausa(800);
    const strati = await p.evaluate(() => window.AGR.dati.strati.map(l => ({ id: l.id, nome: window.AGR.tr(l.label) })));
    let etichetteViste = 0; const esempi = [];

    /* l'elenco e la mappa mostrano gli stessi eventi */
    const confronta = async dove => {
      await p.evaluate(() => window.AGR.chiudi()); await pausa(500);
      const m = await sullaMappa(p);
      await p.locator('[data-az="elenco"]').first().click(); await pausa(400);
      const l = await nellElenco(p), ids = l.map(x => x.id).sort();
      confronti++;
      if (ids.join() !== m.ids.join()) e.errori.push(`${dove}: l'elenco e la mappa non hanno gli stessi eventi (elenco ${ids.length}, mappa ${m.ids.length}; solo in elenco: ${ids.filter(x => !m.ids.includes(x)).join(', ') || '–'}; solo sulla mappa: ${m.ids.filter(x => !ids.includes(x)).join(', ') || '–'})`);
      if (String(m.conta) !== String(ids.length)) e.errori.push(`${dove}: il tasto dell'elenco dice ${m.conta}, l'elenco ha ${ids.length} eventi`);
      for (const r of l) {
        if (!r.icona) e.errori.push(`${dove}: nell'elenco «${r.titolo}» non ha l'icona`);
        if (!strati.some(x => r.meta.includes(x.nome)) && !/Off-Grid/.test(r.meta)) e.errori.push(`${dove}: nell'elenco «${r.titolo}» non dice lo strato (${r.meta})`);
      }
      for (const id of m.senzaIcona) e.errori.push(`${dove}: il segnaposto di ${id} non ha l'icona dello strato`);
      for (const [id, et] of Object.entries(m.etichette)) {
        etichetteViste++; if (esempi.length < 2 && !esempi.includes(et)) esempi.push(et);
        const riga = l.find(x => x.id === id), strato = strati.find(x => et.startsWith(x.nome + ': '));
        if (!strato && !et.startsWith('Off-Grid: ')) e.errori.push(`${dove}: l'etichetta del segnaposto non comincia con lo strato («${et}»)`);
        if (riga && !et.includes(riga.titolo.trim())) e.errori.push(`${dove}: l'etichetta del segnaposto non dice il titolo («${et}»)`);
        if (!/ alle \d\d:\d\d/.test(et)) e.errori.push(`${dove}: l'etichetta del segnaposto non dice la data («${et}»)`);
      }
      return { m, l, ids };
    };

    let x = await confronta('Torino, tutti gli strati');
    if (x.ids.length < 10) e.errori.push('Torino: mi aspettavo almeno dieci eventi, ne trovo ' + x.ids.length);
    if (!x.ids.includes(ID_OG)) e.errori.push('Torino: l\'Off-Grid non è nell\'elenco');
    const nTorino = x.ids.length;

    /* pannello Strati: nome scritto e icona diversa per ogni strato */
    await p.evaluate(() => window.AGR.chiudi()); await pausa(300);
    await p.locator('[data-az="strati"]').first().click(); await pausa(400);
    const righe = await p.evaluate(() => [...document.querySelectorAll('#foglio-slot .strato-on')].map(b => ({ id: b.dataset.strato, nome: (b.querySelector('.t') || {}).textContent || '', icona: (b.querySelector('.ico svg') || {}).innerHTML || '' })));
    for (const l of strati) { const r = righe.find(y => y.id === l.id);
      if (!r) e.errori.push('Strati: manca la riga di ' + l.id);
      else { if (r.nome.trim() !== l.nome) e.errori.push(`Strati: ${l.id} non ha il nome scritto (${r.nome})`); if (!r.icona) e.errori.push(`Strati: ${l.id} non ha l'icona`); } }
    const forme = righe.map(r => r.icona.replace(/(fill|stroke)="[^"]*"/g, '').replace(/\s+/g, ' '));
    forme.forEach((f, i) => { const j = forme.indexOf(f); if (f && j !== i) e.errori.push(`Strati: ${righe[i].id} e ${righe[j].id} hanno la stessa icona: li distingue solo il colore`); });

    /* uno strato spento */
    await p.locator('#foglio-slot .strato-on[data-strato="musica"]').click(); await pausa(400);
    x = await confronta('Torino, senza Musica');
    if (x.ids.length >= nTorino) e.errori.push('spenta la Musica, l\'elenco non è più corto');
    await p.evaluate(() => window.AGR.chiudi()); await p.locator('[data-az="strati"]').first().click(); await pausa(300);
    await p.locator('#foglio-slot .strato-on[data-strato="musica"]').click(); await pausa(300);

    /* il filtro del tempo */
    await p.evaluate(() => window.AGR.chiudi()); await pausa(200);
    if (await p.locator('[data-tempo="domani"]').count()) { await p.locator('[data-tempo="domani"]').first().click(); await pausa(500); await confronta('Torino, domani'); await p.evaluate(() => window.AGR.chiudi()); await p.locator('[data-tempo="tutto"]').first().click(); await pausa(400); }
    else e.errori.push('non trovo il filtro «Domani»');

    /* un evento salvato: l'etichetta lo dice; «Il tuo calendario» mostra solo i salvati e gli Off-Grid, su mappa ed elenco */
    const salvato = x.ids.find(i => i !== ID_OG) || (await sullaMappa(p)).ids.find(i => i !== ID_OG);
    await p.evaluate(id => { window.AGR.salvati.add(id); }, salvato);
    await p.reload(); await p.waitForSelector('[data-az="elenco"]'); await eventiCaricati(p, 10); await pausa(800);
    x = await confronta('Torino, dopo aver salvato un evento');
    const et = x.m.etichette[salvato];
    if (et !== undefined && !/, nel calendario$/.test(et)) e.errori.push(`evento salvato: l'etichetta del segnaposto non dice «nel calendario» («${et}»)`);
    const og = x.m.etichette[ID_OG];
    if (og !== undefined && !/^Off-Grid: Cena inventata, /.test(og)) e.errori.push(`Off-Grid: etichetta del segnaposto inattesa («${og}»)`);
    await p.evaluate(() => window.AGR.chiudi()); await pausa(200);
    await p.locator('[data-az="salvati"]').first().click(); await pausa(500);
    x = await confronta('Torino, «Il tuo calendario»');
    if (x.ids.length !== 2) e.errori.push('«Il tuo calendario»: mi aspettavo l\'evento salvato e l\'Off-Grid, trovo ' + x.ids.length + ' eventi');
    await p.evaluate(() => window.AGR.chiudi()); await p.locator('[data-az="salvati"]').first().click(); await pausa(400);

    /* calendario, mese: il giorno dell'Off-Grid e dell'evento salvato lo dice a parole */
    await p.locator('[data-az="calendario"]').first().click(); await pausa(300);
    await p.locator('#foglio-slot [data-vista="mese"]').click(); await pausa(300);
    const giorni = await p.evaluate(() => [...document.querySelectorAll('#foglio-slot .cal button[data-giorno-cal]')].filter(b => b.querySelector('.punto')).map(b => b.getAttribute('aria-label')));
    if (giorni.length && !giorni.every(g => /Off-Grid|salvat/.test(g))) e.errori.push('calendario, mese: un giorno con i pallini non dice a parole che cosa c\'è (' + giorni.join(' | ') + ')');
    if (giorni.length && !giorni.some(g => /1 Off-Grid/.test(g))) e.errori.push('calendario, mese: nessun giorno dice «1 Off-Grid» (' + giorni.join(' | ') + ')');
    if (!giorni.length) e.note.push('calendario, mese: il giorno degli eventi inventati cade nel mese dopo, pallini non controllati');

    /* un'altra zona e da lontano */
    await p.evaluate(() => window.AGR.chiudi());
    await vai(p, 9.19, 45.4642, 13.3); await pausa(3000);
    x = await confronta('Milano');
    if (!x.ids.length) e.errori.push('Milano: nessun evento nell\'elenco');
    await p.evaluate(() => window.AGR.chiudi());
    await vai(p, 8.8, 44.9, 6.3); await pausa(2000);
    x = await confronta('da lontano');
    if (x.ids.some(i => i !== ID_OG)) e.errori.push('da lontano: nell\'elenco ci sono eventi pubblici');
    e.note.push(`elenco e mappa confrontati in ${confronti} situazioni; Torino ${nTorino} eventi; strati con nome e icona propria: ${righe.length}`);
    if (!etichetteViste) e.errori.push('nessun segnaposto singolo sulla mappa: le etichette non sono state controllate');
    e.note.push(`etichette dei segnaposto controllate: ${etichetteViste}; per esempio «${esempi.join('» · «')}»`);
  } finally {
    await browser.close(); await s.chiudi();
  }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
