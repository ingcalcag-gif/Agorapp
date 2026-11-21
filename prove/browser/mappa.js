/* Prova nel browser: la mappa propria (voci T-017 e T-018; libro mastro § 2.4, «La mappa»; § 6.6; § 31.1).

   Apre l'app con la mappa di prova di Torino del repository e controlla che:
   - stile, icone, glifi e lettore arrivino dall'app (lib/) e i tasselli dalla zona della mappa (mappa/prova/),
     senza nessun servizio di mappe esterno; il server di prova, come githack, non accetta le richieste a pezzi:
     l'app deve passare da sé dal file unico alla cartella di tasselli;
   - le vie abbiano il nome anche quando sono pedonali (Via Roma a Torino, dato di OpenStreetMap);
   - gli oggetti della mappa siano di tutte le categorie, attività commerciali comprese (decisione del 20/11/2026, da
     sfoltire prima della pubblicazione), e nessuno chieda un'icona che non c'è;
   - i numeri civici non si vedano sulla mappa normale e si vedano solo mentre si sceglie un punto («Scegli sulla mappa»);
   - il cambio di tema cambi colori e icone senza scaricare di nuovo tasselli o glifi;
   - l'avviso di provenienza dica «© OpenStreetMap» con il collegamento alla pagina dei diritti e «Protomaps», senza CARTO;
   - lo strato delle correzioni (T-018), con un file di correzioni inventato, nasconda l'oggetto indicato (qui Via Roma),
     disegni l'aggiunta con il suo nome e faccia comparire nell'avviso «correzioni di» con il nome del servizio;
     con il file vero, oggi vuoto, l'avviso delle correzioni non compare;
   - senza file della mappa (indice che non si trova) i segnaposto degli eventi restano sul fondo.
   Serve WebGL: Chromium lo fa in software (SwiftShader), qui e su GitHub Actions. */
'use strict';
const { playwright, server, apri, pausa, giorno, archivio, ZONA_ARCHIVIO } = require('./comune.js');
const { pubblici, offgrid } = require('./ostili.js');
const { esito, eseguiDaSola, config } = require('../comune.js');

// Il punto di Torino da guardare: Via Roma tra piazza San Carlo e piazza Carlo Felice.
const VIA_ROMA = { centro: [7.6826, 45.0668], zoom: 16.5 };
// Correzioni inventate per la prova: nascondere i due tratti di Via Roma del file di prova, aggiungere un punto.
const CORREZIONI_PROVA = { type: 'FeatureCollection', features: [
  { type: 'Feature', geometry: null, properties: { correzione: 'nascondi', livello: 'roads', id_mappa: 35184394996620, data: '2026-11-19', motivo: 'prova' } },
  { type: 'Feature', geometry: null, properties: { correzione: 'nascondi', livello: 'roads', id_mappa: 35184691359920, data: '2026-11-19', motivo: 'prova' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [7.6836, 45.0662] }, properties: { correzione: 'aggiunta', nome: 'Punto di prova', data: '2026-11-19', motivo: 'prova' } },
] };

async function prova() {
  const e = esito('Mappa propria (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const s = await server('pubblica');
  const { browser, ctx } = await apri(pw, { dl_guida: '1' });
  // La mappa vive dentro l'app: per guardarla dall'esterno si tiene da parte l'oggetto che MapLibre crea.
  await ctx.addInitScript(() => {
    let ml; Object.defineProperty(window, 'maplibregl', { configurable: true, get() { return ml; },
      set(v) { const M = v.Map; v.Map = function (...a) { const m = new M(...a); window.__mappaProva = m; window.__iconeMancanti = []; m.on('styleimagemissing', ev => window.__iconeMancanti.push(ev.id)); return m; }; v.Map.prototype = M.prototype; ml = v; } });
  });
  const zonaMappa = new URL('../../mappa/prova/', s.url).href, zonaArchivio = new URL('../..' + ZONA_ARCHIVIO, s.url).href;
  const richieste = [];
  try {
    const p = await ctx.newPage();
    p.on('request', r => richieste.push(r.url()));
    const pronta = () => p.waitForFunction(() => { const m = window.__mappaProva; return m && m.getSource('protomaps') && m.isStyleLoaded() && m.areTilesLoaded(); }, null, { timeout: 30000 });
    await p.goto(s.url + 'index.html');
    try { await pronta(); } catch (x) { e.errori.push('la mappa non si carica entro 30 secondi'); return e; }

    // Da dove arrivano le parti della mappa.
    /* dal blocco 7 i tasselli passano dal protocollo dell'app, che li conserva sul telefono (T-029): la strada presa si legge dall'app */
    const fonte = await p.evaluate(() => window.AGR.mappa().fonte);
    if (fonte !== 'tasselli' || !richieste.some(u => u.startsWith(zonaMappa + 'torino/') && /\.pbf$/.test(u))) e.errori.push('la mappa non è passata alla cartella di tasselli della prova (fonte: ' + fonte + ')');
    if (!richieste.some(u => u === zonaMappa + 'torino.pmtiles')) e.errori.push('l\'app non ha provato prima il file unico torino.pmtiles');
    for (const [parte, re] of [['stile', /lib\/protomaps-basemaps-[\d.]+\/stile-carta-chiaro\.json$/], ['icone', /lib\/protomaps-icone-v\d+\/light(@2x)?\.png$/],
      ['glifi', /lib\/caratteri-mappa\/dm-sans-v\d+\/DM%20Sans%20Regular\/\d+-\d+\.pbf$/], ['lettore', /lib\/pmtiles-[\d.]+\/pmtiles\.js$/], ['indice', /mappa\/prova\/mappa\.json$/]])
      if (!richieste.some(u => re.test(u))) e.errori.push(`mappa: ${parte} non caricato dall'app`);
    const altrove = richieste.filter(u => !u.startsWith(s.url) && !u.startsWith(zonaMappa) && !u.startsWith(zonaArchivio) && !/^(blob|data):/.test(u));
    if (altrove.length) e.errori.push('richieste fuori dall\'app, dalla zona della mappa e da quella degli eventi: ' + altrove.slice(0, 5).join(', '));

    // Via Roma, via pedonale, ha il suo nome.
    await p.evaluate(v => window.__mappaProva.jumpTo({ center: v.centro, zoom: v.zoom }), VIA_ROMA); await pronta().catch(() => {}); await pausa(600);
    const nomi = await p.evaluate(() => window.__mappaProva.queryRenderedFeatures().filter(f => /^roads_labels/.test(f.layer.id)).map(f => f.properties.name));
    if (!nomi.includes('Via Roma')) e.errori.push('a zoom 16,5 su Via Roma la mappa non scrive «Via Roma» (vie con il nome: ' + [...new Set(nomi)].join(', ') + ')');

    // Oggetti della mappa: per ora tutte le categorie, anche le attività commerciali (decisione del 20/11/2026).
    const tipi = await p.evaluate(() => [...new Set(window.__mappaProva.queryRenderedFeatures().filter(f => f.layer.id === 'pois').map(f => f.properties.kind))]);
    const commerciali = tipi.filter(k => ['cafe', 'restaurant', 'bar', 'fast_food', 'ice_cream', 'supermarket', 'clothes', 'shoes', 'bank', 'pharmacy'].includes(k));
    if (!commerciali.length) e.errori.push('a zoom 16,5 su Via Roma non si vede nessuna attività commerciale (categorie: ' + tipi.join(', ') + ')');
    e.note.push(`oggetti della mappa a zoom 16,5 su Via Roma: ${tipi.length} categorie, tra cui ${commerciali.join(', ')}`);

    // Numeri civici: mai sulla mappa normale, solo durante «Scegli sulla mappa».
    const civici = () => p.evaluate(() => { const m = window.__mappaProva; m.jumpTo({ center: [7.6826, 45.0668], zoom: 18.5 }); return new Promise(ok => m.once('idle', () => ok(m.queryRenderedFeatures().filter(f => f.layer.id === 'address_label').length))); });
    const prima = await civici();
    if (prima) e.errori.push(`numeri civici sulla mappa normale: ${prima}`);
    await p.click('#btnNuovo'); await pausa(400);
    await p.click('[data-az="scegli-mappa"]'); await pausa(400);
    const durante = await civici();
    if (!durante) e.errori.push('nessun numero civico mentre si sceglie il punto sulla mappa');
    await p.click('[data-az="posa-annulla"]'); await pausa(300);
    const dopo = await p.evaluate(() => window.__mappaProva.getLayoutProperty('address_label', 'visibility'));
    if (dopo !== 'none') e.errori.push('i numeri civici restano accesi dopo «Annulla»');
    e.note.push(`numeri civici a zoom 18,5: mappa normale ${prima}, durante la scelta del punto ${durante}`);
    const mancanti = await p.evaluate(() => [...new Set(window.__iconeMancanti)]);
    if (mancanti.length) e.errori.push('la mappa chiede icone che non ci sono: ' + mancanti.join(', '));

    // Cambio di tema: colori e icone, nessun tassello o glifo scaricato di nuovo.
    await p.goto(s.url + 'index.html'); await pronta();
    const pesanti = () => richieste.filter(u => /\.pbf$|\.pmtiles$/.test(u)).length;
    const n0 = pesanti();
    await p.click('[data-az="impostazioni"]'); await pausa(300); await p.click('[data-tema-set="dark"]'); await pausa(1200);
    const scuro = await p.evaluate(() => { const m = window.__mappaProva; return { fondo: m.getPaintProperty('background', 'background-color'), icone: String(m.getStyle().sprite) }; });
    if (!/^#1C1915$/i.test(scuro.fondo)) e.errori.push('dopo il tema scuro il fondo della mappa è ' + scuro.fondo);
    if (!/protomaps-icone-v\d+\/dark$/.test(scuro.icone)) e.errori.push('dopo il tema scuro le icone non sono quelle scure: ' + scuro.icone);
    if (pesanti() !== n0) e.errori.push(`il cambio di tema ha scaricato di nuovo ${pesanti() - n0} tasselli o glifi`);

    // Avviso di provenienza.
    const avviso = await p.evaluate(() => { const a = document.getElementById('attrib'); return { testo: a.textContent.replace(/\s+/g, ' ').trim(), link: [...a.querySelectorAll('a')].map(x => x.href) }; });
    if (!/© OpenStreetMap/.test(avviso.testo) || !avviso.link.includes('https://www.openstreetmap.org/copyright')) e.errori.push('avviso di provenienza senza «© OpenStreetMap» e il collegamento alla pagina dei diritti: ' + avviso.testo);
    if (!/Protomaps/.test(avviso.testo)) e.errori.push('avviso di provenienza senza il riconoscimento di Protomaps');
    if (/CARTO/i.test(avviso.testo)) e.errori.push('l\'avviso nomina ancora CARTO');
    if (await p.evaluate(() => !document.getElementById('attrib-correzioni').hidden)) e.errori.push('l\'avviso delle correzioni compare anche senza correzioni');
    e.note.push('avviso: ' + avviso.testo);

    // Strato delle correzioni, con il file inventato.
    await ctx.route(u => u.pathname.endsWith('/dist/pubblica/mappa/correzioni.geojson'), r => r.fulfill({ contentType: 'application/geo+json', body: JSON.stringify(CORREZIONI_PROVA) }));
    const p2 = await ctx.newPage();
    await p2.goto(s.url + 'index.html');
    await p2.waitForFunction(() => { const m = window.__mappaProva; return m && m.getSource('protomaps') && m.isStyleLoaded() && m.areTilesLoaded(); }, null, { timeout: 30000 });
    await p2.evaluate(v => window.__mappaProva.jumpTo({ center: v.centro, zoom: v.zoom }), VIA_ROMA);
    const viste = await p2.evaluate(() => new Promise(ok => window.__mappaProva.once('idle', () => { const f = window.__mappaProva.queryRenderedFeatures();
      ok({ strade: f.filter(x => /^roads_labels/.test(x.layer.id)).map(x => x.properties.name), aggiunte: f.filter(x => x.layer.id === 'agr-correzioni-nomi').map(x => x.properties.nome),
        avviso: document.getElementById('attrib').textContent.replace(/\s+/g, ' ').trim() }); })));
    if (viste.strade.includes('Via Roma')) e.errori.push('con la correzione «nascondi» Via Roma ha ancora il nome');
    if (!viste.aggiunte.includes('Punto di prova')) e.errori.push('l\'aggiunta dello strato delle correzioni non si vede');
    if (!viste.avviso.includes('correzioni di ' + config().nome)) e.errori.push('con le correzioni l\'avviso non dice «correzioni di ' + config().nome + '»: ' + viste.avviso);
    e.note.push('con le correzioni di prova: ' + viste.avviso);

    // Senza file della mappa: il fondo regge i segnaposto (qui un evento dell'archivio e un Off-Grid inventati di domani).
    const c3 = await apri(pw, { dl_guida: '1', dl_strati: { musica: { on: true } }, dl_eventi: offgrid(false, giorno(1)) });
    try {
      await archivio(c3.ctx, pubblici(false, giorno(1)));
      await c3.ctx.route(u => u.pathname.endsWith('/mappa/prova/mappa.json'), r => r.fulfill({ status: 404, body: 'non trovato' }));
      const p3 = await c3.ctx.newPage();
      await p3.goto(s.url + 'index.html'); await pausa(3500);
      const pin = await p3.locator('.pin').count();
      if (pin < 2) e.errori.push(`senza file della mappa i segnaposto non si vedono (${pin} invece di 2)`);
      e.note.push(`senza file della mappa: ${pin} segnaposto sul fondo`);
    } finally { await c3.browser.close(); }
  } finally {
    await browser.close(); await s.chiudi();
  }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
