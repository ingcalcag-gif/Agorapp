/* Prova nel browser: i testi che arrivano da fuori si mostrano sempre come testo, mai come codice (voci T-005 e T-024;
   libro mastro, § 3.11; inventario in docs/testi-come-testo.md).

   Ogni fonte di testi esterni porta testi ostili inventati, cioè pezzi di HTML che, se la pagina li scrivesse come
   codice, creerebbero elementi con l'attributo data-ostile o eseguirebbero window.__ostile:
   - due eventi dell'archivio, nel formato pubblico (docs/formato-eventi.md), con testi ostili in ogni campo, e un terzo
     nello stesso punto per avere il gruppo «Qui vicino»;
   - un indice dell'archivio con il nome di una regione ostile;
   - gli Off-Grid nella memoria del telefono (uno con la ripetizione), con testi e collegamenti ostili;
   - le altre chiavi della memoria del telefono che contengono testi: lenti dei Temi, combinazioni, preferenze;
   - le risposte della ricerca degli indirizzi (Photon), servite dalla prova con nomi, vie e numeri civici ostili;
   - un file da importare nell'area riservata (CSV) con celle ostili, lo storico e gli appunti delle Misure.
   La prova apre tutte le viste dell'app, compresi l'anteprima del PDF, la pagina di stampa e il PDF scaricato, e
   controlla che nessun testo sia diventato un elemento o sia stato eseguito, che nessun collegamento javascript:,
   data: o http: arrivi nella pagina e che nessun elemento abbia un gestore scritto nella pagina (on…=). Un evento
   dell'archivio con un collegamento javascript: non deve comparire affatto (il formato accetta solo https). */
'use strict';
const { esito, eseguiDaSola, confronta } = require('../comune.js');
const { playwright, server, apri, giorno, pausa, archivio, fileArchivio, eventoProva, eventiCaricati, ZONA_ARCHIVIO } = require('./comune.js');

const O_ = n => `<img src=x data-ostile="${n}" onerror="window.__ostile='${n}'"><b data-ostile="${n}">prova</b>`;
const ATTR_ = n => `" data-ostile="${n}-a" x="' data-ostile='${n}-b' y='`;
const B_ = n => `<b data-ostile="${n}">x</b>`;   // breve, per i campi corti

const ID_EV = 'provaostileevent-provaaaa', ID_TITOLO = 'provaostiletitol-provaaaa', ID_JS = 'provaostilelinkj-provaaaa', ID_OG = 'prova-ostile-og';

/* Gli eventi pubblici inventati della prova, nel formato dell'archivio; con ostili = false gli stessi senza testi ostili. */
function pubblici(ostili = true, g = giorno(1), ore = ['18:00', '20:00']) {
  const O = ostili ? O_ : () => '', ATTR = ostili ? ATTR_ : () => '', B = ostili ? B_ : () => '';
  const ev = eventoProva(ID_EV, { titolo: 'Concerto ' + ATTR('titolo'), inizio: g + 'T' + ore[0], fine: g + 'T' + ore[1],
    luogo: 'Sala ' + O('luogo'), indirizzo: 'Via Inventata 1 ' + ATTR('indirizzo') + O('indirizzo'), organizzatore: 'Gruppo ' + O('org'),
    descrizione: 'Descrizione ' + O('descrizione'), prezzo: '5 ' + B('prezzo'), fonte: { testo: 'Fonte inventata ' + O('fonte'), collegamento: 'https://organizzatore.esempio.invalid/evento' } });
  const titolo = eventoProva(ID_TITOLO, { titolo: O_('titolo'), inizio: g + 'T' + ore[0], fine: g + 'T' + ore[1], lat: 45.0712, lng: 7.6845,
    collocazione: 'a_mano', descrizione_luogo: 'Dal cancello ' + O_('descrizione-luogo'), tema: 'Beni comuni' });
  return ostili ? [ev, titolo] : [ev];
}
/* Un evento con un collegamento javascript: e una password: il formato lo rifiuta, l'app non lo mostra. */
const RIFIUTATO = () => eventoProva(ID_JS, { titolo: 'Evento con collegamento javascript', fonte: { testo: 'Fonte', collegamento: "javascript:window.__ostile='link'" }, password: 'x' });

/* L'Off-Grid inventato della prova, nella memoria del telefono. */
function offgrid(ostili = true, g = giorno(1)) {
  const O = ostili ? O_ : () => '', ATTR = ostili ? ATTR_ : () => '';
  return [{ id: ID_OG, personal: true, offgrid: true, title: 'Cena ' + ATTR('og-titolo') + O('og-titolo'),
    address: 'Via Finta 2 ' + O('og-indirizzo'), addressFull: 'Via Finta 2, Torino ' + O('og-indfull'), addrPrecision: 'exact', addrNum: '2',
    notes: 'Note ' + O('og-note'), description: 'Descr ' + O('og-descr'),
    links: ostili ? ["javascript:window.__ostile='og-link'", 'https://esempio.invalid/" data-ostile="og-href'] : [], link: '',
    category: '', sublayer: '', datetime: g + 'T20:00', end: g + 'T22:00', lat: 45.072, lng: 7.69, hidden: false, price: '' }];
}


/* ---------- Le altre fonti di testi ostili (T-024) ---------- */
const ID_VICINO = 'provaostilevicin-provaaaa', ID_OG2 = 'prova-ostile-og-2', ID_SERIE = 'prova-ostile-serie';
/* Un terzo evento nello stesso punto del primo: sulla mappa formano il gruppo «Qui vicino». */
const vicino = (g = giorno(1)) => eventoProva(ID_VICINO, { titolo: 'Vicino ' + B_('vicino'), inizio: g + 'T19:00', fine: g + 'T21:00', luogo: 'Sala ' + B_('vicino-luogo') });
/* Un secondo Off-Grid lo stesso giorno (per i tratti della «La mia giornata») e uno che si ripete. */
function altriOffgrid(g = giorno(1)) {
  const base = offgrid(true, g)[0];
  return [Object.assign({}, base, { id: ID_OG2, title: 'Dopocena ' + O_('og2-titolo'), datetime: g + 'T22:30', end: '', lat: 45.0655, lng: 7.6801, duration: 'tutta la sera ' + B_('og-durata') }),
    Object.assign({}, base, { id: ID_SERIE, title: 'Prove ' + O_('serie-titolo'), datetime: giorno(2) + 'T18:00', end: giorno(2) + 'T19:00', seriesId: 'serie-' + ATTR_('serie-id'),
      rep: { freq: 'weekly' + ATTR_('serie-freq'), until: giorno(30) }, lat: 45.0745, lng: 7.6905 })];
}
/* La memoria del telefono con testi ostili ovunque l'app legga un testo. */
function memoriaOstile() {
  return { dl_guida: '1', dl_strati: { musica: { on: true } }, dl_eventi: offgrid().concat(altriOffgrid()),
    dl_calendario: { [ID_EV]: true, [ID_OG]: true, [ID_OG2]: true, [ID_SERIE]: true, ['id ' + ATTR_('cal-id')]: true },
    /* le lenti: il nome è al massimo di 16 caratteri, quindi il testo ostile è corto; se diventasse un elemento avrebbe l'attributo data-ostile */
    dl_lenti: [{ nome: '<s data-ostile>L', k: ['s:musica', 't:' + O_('lente-tema'), 's:' + ATTR_('lente-strato')] }, { name: '<s data-ostile>V', tags: ['Musica'] }, null],
    dl_combinazioni: { data: [null, null, null], names: ['Mappa ' + O_('preset'), 'Mappa 2', 'Mappa 3'] },
    dl_citta: 'torino' + ATTR_('citta'), dl_mezzo: 'piedi' + ATTR_('mezzo'), dl_tema: 'light' + ATTR_('tema'), dl_semplice: ATTR_('semplice') };
}
/* Le risposte della ricerca degli indirizzi, con testi ostili in ogni proprietà. */
function risposteRicerca() {
  const p = (extra, lng = 7.6869, lat = 45.0703) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: Object.assign({ country: 'Italia', city: 'Torino ' + B_('ph-citta'), postcode: '10100' + B_('ph-cap'), county: 'Torino ' + B_('ph-contea') }, extra) });
  return { type: 'FeatureCollection', features: [
    p({ name: 'Circolo ' + O_('ph-nome'), street: 'Via Roma ' + O_('ph-via'), housenumber: '5' + ATTR_('ph-civico') + B_('ph-civico'), osm_key: 'amenity', osm_value: 'cafe', type: 'house' }),
    p({ name: 'Via Roma ' + O_('ph-strada'), osm_key: 'highway', osm_value: 'residential', type: 'street' }, 7.687, 45.071),
    p({ name: 'Torino ' + O_('ph-luogo'), osm_key: 'place', osm_value: 'city', type: 'city' }, 7.686, 45.07),
    p({ street: 'Via Roma', housenumber: '5' + B_('ph-civico2'), type: 'house' }, 7.688, 45.072) ] };
}
/* Un file da importare nell'area riservata: una riga scartata e una con un avviso, con celle ostili. */
function fileDaImportare() {
  const c = t => '"' + String(t).replace(/"/g, '""') + '"';
  const righe = [['Titolo', 'Strato', 'Sottostrato', 'Descrizione', 'Data', 'Ora inizio', 'Ora fine', 'Durata', 'Prezzo', 'Indirizzo', 'Latitudine', 'Longitudine', 'Link', 'Nascosto', 'Password', 'Provenienza'],
    ['Evento ' + O_('imp-titolo'), 'Strato ' + O_('imp-strato'), '', 'Una descrizione inventata lunga abbastanza per la prova.', giorno(3), '18:00', '20:00', '', '5', 'Via Finta 1', '45.07', '7.68', '', 'no', '', ''],
    ['Concerto ' + O_('imp-titolo2'), 'Musica', 'Sotto ' + O_('imp-sub'), 'Una descrizione inventata ' + O_('imp-descr') + ' lunga abbastanza.', giorno(3), '19:00', '21:00', '2 ore ' + B_('imp-durata'), '5 ' + B_('imp-prezzo'), 'Via Finta 2 ' + O_('imp-indirizzo'), '45.071', '7.681', "javascript:window.__ostile='imp-link'", 'no', '', 'Fonte ' + B_('imp-prov')]];
  return Buffer.from(righe.map(r => r.map(c).join(',')).join('\n') + '\n', 'utf8');
}
/* Le Misure dell'area riservata, con testi ostili al posto di nomi, appunti, numeri e date. */
function misureOstili() {
  const H = n => B_('mz-' + n), g = giorno(-5);
  return { v: 1, soglie: { zona: H('zona'), nuovi: H('nuovi'), carico: H('carico') }, azioni: [{ d: g, t: 'Volantini ' + O_('mz-azione') }, { d: H('azione-d'), t: H('azione-t') }],
    giri: [{ titolo: 'Giro ' + O_('mz-giro'), d: g, n: H('giro-n'), cons: H('giro-cons'), scoperto: H('giro-s'), andato: 1, guida: 1, og: 1 }, { titolo: O_('mz-giro-prima'), d: g, n: H('giro-n-prima') }, { d: H('giro-d'), n: 3 }],
    versioni: [{ v: H('versione'), s: H('versione-s'), d: g }, { v: '1.0', s: 2.5, d: g }], prove: [{ d: g, t: H('prova') }], rimozioni: [{ d: g, h: H('rimozione') }],
    lib: { 1: { appunti: 'Appunti ' + O_('mz-appunti'), appuntiD: H('appunti-d') }, 2: { appunti: 'Appunti ' + O_('mz-appunti'), appuntiD: g }, 3: { stato: H('stato'), agg: H('agg') } },
    stati: { [H('stati')]: 'fatto' }, mie: { [H('mie')]: true }, rete: { d: H('rete'), v: H('rete-v') }, giorni: { [g]: { r: H('giorno-r') } }, richieste: { [g]: H('richieste') },
    segnalazioni: { [g]: H('segnalazioni') }, correzioni: { [g]: H('correzioni') }, creati: { [g]: H('creati') }, visti: { [H('visti')]: 1 } };
}
const STORICO = () => [{ t: new Date().toISOString(), op: 'importa', n: 2, x: 'nota ' + O_('storico-x'), s: 'musica' + ATTR_('storico-s') }, { t: new Date().toISOString(), op: 'modifica', id: ID_OG, r: O_('storico-r') }];

/* I testi ostili che la prova deve ritrovare, come testo, in almeno una pagina. */
const ATTESI = ['titolo', 'luogo', 'indirizzo', 'org', 'descrizione', 'descrizione-luogo', 'prezzo', 'fonte', 'vicino', 'vicino-luogo', 'regione',
  'og-titolo', 'og-indirizzo', 'og-indfull', 'og-note', 'og2-titolo', 'og-durata', 'serie-titolo',
  'ph-nome', 'ph-via', 'ph-civico', 'ph-civico2', 'ph-strada', 'ph-luogo', 'ph-citta', 'ph-cap', 'ph-contea',
  'cerca-testo', 'avviso-testo', 'imp-strato', 'imp-sub', 'storico-x', 'storico-r', 'mz-appunti', 'mz-giro', 'mz-giro-prima'];

async function prova() {
  const e = esito('Testi ostili mostrati come testo (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const s = await server('pubblica');
  const trovati = [], viste = [];
  /* Ciò che non deve mai succedere in una pagina dell'app. */
  const esamina = () => ({ eseguito: window.__ostile || null,
    /* i testi ostili che la pagina mostra come testo (nel testo, nei campi e negli attributi): servono a sapere che la prova li ha portati fin lì */
    visti: (() => { const t = [document.body ? document.body.textContent : ''];
      for (const x of document.querySelectorAll('*')) { if ('value' in x && typeof x.value === 'string') t.push(x.value); for (const a of x.attributes) t.push(a.value); }
      return [...new Set([...t.join('\n').matchAll(/data-ostile=["']([a-z0-9-]+?)(?:-[ab])?["']/g)].map(m => m[1]))]; })(),
    elementi: [...document.querySelectorAll('[data-ostile]')].map(x => x.getAttribute('data-ostile')),
    collegamenti: [...document.querySelectorAll('a[href], area[href]')].map(a => a.getAttribute('href')).filter(h => !/^(https:\/\/|mailto:|geo:|tel:|#|blob:)/i.test(h.trim()) && /^[a-z][a-z0-9+.-]*:/i.test(h.trim())),
    gestori: [...document.querySelectorAll('*')].filter(x => [...x.attributes].some(a => /^on/i.test(a.name))).map(x => x.tagName.toLowerCase() + ' ' + [...x.attributes].filter(a => /^on/i.test(a.name)).map(a => a.name).join(',')) });
  const visti = new Set();
  const annota = (vista, r) => {
    viste.push(vista); for (const x of r.visti) visti.add(x);
    if (r.eseguito) trovati.push({ chiave: 'testo eseguito come codice', dove: vista, dettaglio: r.eseguito });
    for (const x of r.elementi) trovati.push({ chiave: 'testo diventato elemento', dove: vista, dettaglio: x });
    for (const x of r.collegamenti) trovati.push({ chiave: 'collegamento non https', dove: vista, dettaglio: x.slice(0, 60) });
    for (const x of r.gestori) trovati.push({ chiave: 'gestore scritto nella pagina', dove: vista, dettaglio: x });
  };
  const sessione = async (memoria, opzioni, fn) => {
    const { browser, ctx } = await apri(pw, memoria, opzioni);
    try {
      /* l'archivio della prova, con il nome di una regione ostile nell'indice */
      const file = fileArchivio(pubblici().concat([vicino()]), [RIFIUTATO()]);
      const indice = JSON.parse(file['indice.json']); indice.regioni.forEach(r => { r.nome = B_('regione'); });   // al massimo 40 caratteri, come chiede il controllo dell'indice
      file['indice.json'] = JSON.stringify(indice) + '\n';
      await ctx.route(u => u.pathname.includes(ZONA_ARCHIVIO), r => { const k = new URL(r.request().url()).pathname.split(ZONA_ARCHIVIO)[1];
        return k in file ? r.fulfill({ status: 200, contentType: 'application/json', body: file[k] }) : r.fulfill({ status: 404, body: 'non trovato' }); });
      /* il file degli avvisi delle novità, con un testo ostile (T-031) */
      await ctx.route(u => /\/avvisi\.json$/.test(u.pathname), r => r.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ formato: 'avvisi', versione: 1, avvisi: [{ id: 'avviso-ostile', tipo: 'modifica', dal: giorno(-1), fino: giorno(30), testo: { it: 'Avviso ' + O_('avviso-testo') } }] }) }));
      /* la ricerca degli indirizzi risponde con testi ostili (la prova non contatta il servizio vero) */
      await ctx.route(u => u.hostname === 'photon.komoot.io', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(risposteRicerca()) }));
      const p = await ctx.newPage();
      p.on('pageerror', err => e.errori.push('errore nella pagina: ' + err.message));
      /* le pagine che l'app apre a parte (stampa) si raccolgono invece di aprirle */
      await p.addInitScript(() => { window.__aperte = []; window.open = u => { window.__aperte.push(String(u)); return { print() {} }; };
        /* la mappa che l'app crea si tiene da parte, per portarla lontano */
        let ml; Object.defineProperty(window, 'maplibregl', { configurable: true, get() { return ml; },
          set(v) { const M = v.Map; v.Map = function (...a) { const m = new M(...a); window.__mappaProva = m; return m; }; v.Map.prototype = M.prototype; ml = v; } }); });
      const controlla = async vista => annota(vista, await p.evaluate(esamina));
      const avvia = async () => { await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]');
        if (!(await eventiCaricati(p, 3))) e.errori.push('gli eventi dell\'archivio non arrivano'); await pausa(400); };
      const tocca = async (sel, vista, facoltativo) => {
        const l = p.locator(sel).first();
        if (!(await l.count())) { if (!facoltativo) e.errori.push(`${vista}: non trovo ${sel}`); return false; }
        try { await l.click({ timeout: 5000 }); } catch (err) { try { await l.dispatchEvent('click'); } catch (e2) { e.errori.push(`${vista}: non riesco a toccare ${sel}`); return false; } }
        await pausa(400); return true;
      };
      /* una pagina che l'app ha preparato per la stampa: si apre in una scheda vuota e si esamina allo stesso modo */
      const pagineAperte = async vista => {
        const url = await p.evaluate(() => window.__aperte.splice(0));
        if (!url.length) { e.errori.push(vista + ': l\'app non ha preparato la pagina'); return; }
        for (const u of url) {
          const html = await p.evaluate(async x => (await fetch(x)).text(), u);
          const q = await ctx.newPage();
          try { await q.setContent(html, { waitUntil: 'load' }); await pausa(200); annota(vista, await q.evaluate(esamina)); } finally { await q.close(); }
        }
      };
      await fn({ p, ctx, controlla, avvia, tocca, pagineAperte });
    } finally { await browser.close(); }
  };

  try {
    /* ---------- Chi usa l'app ---------- */
    await sessione(memoriaOstile(), {}, async ({ p, controlla, avvia, tocca, pagineAperte }) => {
      const F = '#foglio-slot ';
      await avvia(); await controlla('avvio');
      if (await tocca('[data-az="elenco"]', 'elenco')) {
        await controlla('elenco');
        if (await p.locator(F + '[data-ev="' + ID_JS + '"]').count()) e.errori.push('elenco: compare l\'evento con il collegamento javascript:, che il formato rifiuta');
        if (!(await p.locator(F + '[data-ev="' + ID_TITOLO + '"]').count())) e.errori.push('elenco: non trovo l\'evento con il titolo ostile');
        if (await tocca(F + '[data-ev="' + ID_EV + '"]', 'scheda evento')) {
          await controlla('scheda evento');
          if (await tocca(F + '[data-az="leggi"]', 'scheda evento, leggi tutto', true)) await controlla('scheda evento, leggi tutto');
          if (await tocca(F + '[data-salva]', 'scheda evento, salva')) await controlla('scheda evento, salva');
          if (await tocca(F + '[data-copia-indirizzo]', 'scheda evento, copia indirizzo', true)) await controlla('scheda evento, copia indirizzo');
        }
      }
      await avvia();
      if (await tocca('[data-az="elenco"]', 'elenco') && await tocca(F + '[data-ev="' + ID_TITOLO + '"]', 'scheda evento, titolo')) await controlla('scheda evento, titolo');
      await avvia();
      if (await tocca('.pin.gruppo', 'gruppo sulla mappa')) await controlla('gruppo «Qui vicino»');
      await avvia();
      if (await tocca('[data-az="strati"]', 'strati')) { await controlla('strati'); if (await tocca(F + '[data-espandi="musica"]', 'strati, sottocategorie', true)) await controlla('strati, sottocategorie'); }
      await avvia();
      if (await tocca('[data-az="elenco"]', 'elenco') && await tocca(F + '[data-ev="' + ID_OG + '"]', 'scheda Off-Grid')) {
        await controlla('scheda Off-Grid');
        if (await tocca(F + '[data-modifica="' + ID_OG + '"]', 'modulo Off-Grid')) {
          await controlla('modulo Off-Grid');
          const ind = p.locator('#f-indirizzo, [data-campo="indirizzo"]').first();
          if (await ind.count()) { await ind.fill('Via Roma 5, Torino'); await pausa(1200); await controlla('modulo Off-Grid, suggerimenti');
            if (await tocca('#f-sugg [data-si="0"]', 'modulo Off-Grid, suggerimento', true)) await controlla('modulo Off-Grid, punto scelto'); }
          else e.errori.push('modulo Off-Grid: non trovo il campo dell\'indirizzo');
          if (await tocca(F + '[data-az="aggiungi-link"]', 'modulo Off-Grid, link', true)) await controlla('modulo Off-Grid, link');
          if (await tocca(F + '[data-az="aiuto-og"], ' + F + '[data-az="aiuto"]', 'modulo Off-Grid, aiuto', true)) await controlla('modulo Off-Grid, aiuto');
        }
      }
      await avvia();
      if (await tocca('[data-az="elenco"]', 'elenco') && await tocca(F + '[data-ev="' + ID_OG2 + '"]', 'scheda Off-Grid con la durata')) await controlla('scheda Off-Grid con la durata');
      await avvia();
      if (await tocca('[data-az="elenco"]', 'elenco') && await tocca(F + '[data-ev="' + ID_SERIE + '"]', 'scheda Off-Grid che si ripete')) {
        await controlla('scheda Off-Grid che si ripete');
        if (await tocca(F + '[data-modifica="' + ID_SERIE + '"]', 'modulo della serie')) await controlla('modulo Off-Grid, serie');
        await avvia();
        if (await tocca('[data-az="elenco"]', 'elenco') && await tocca(F + '[data-ev="' + ID_SERIE + '"]', 'scheda della serie') && await tocca(F + '[data-elimina="' + ID_SERIE + '"]', 'conferma')) await controlla('conferma dell\'eliminazione, serie');
      }
      await avvia();
      if (await tocca('[data-az="elenco"]', 'elenco') && await tocca(F + '[data-ev="' + ID_OG + '"]', 'scheda Off-Grid') && await tocca(F + '[data-elimina="' + ID_OG + '"]', 'conferma')) await controlla('conferma dell\'eliminazione');
      await avvia();
      if (await tocca('[data-az="calendario"]', 'calendario')) {
        await controlla('calendario, giornata di oggi');
        await p.evaluate(g => { window.AGR.stato.cal.giorno = g; }, giorno(1));   // il giorno degli eventi inventati
        if (await tocca(F + '[data-vista="giornata"]', 'calendario, giornata')) await controlla('calendario, giornata con le tappe');
        if (!(await p.locator(F + '.tappa-r').count())) e.errori.push('calendario: la giornata degli eventi inventati non ha tappe');
        if (await tocca(F + '[data-mezzo="bici"]', 'calendario, mezzo', true)) await controlla('calendario, giornata in bici');
        if (await tocca(F + '[data-vista="mese"]', 'calendario, mese')) await controlla('calendario, mese');
        if (await tocca(F + '[data-vista="agenda"]', 'calendario, agenda')) await controlla('calendario, agenda');
        if (await tocca(F + '[data-az="pdf"]', 'anteprima del PDF')) {
          await controlla('anteprima del PDF');
          if (await tocca(F + '[data-az="stampa-pdf"]', 'pagina di stampa')) await pagineAperte('pagina di stampa del calendario');
          const scarico = p.waitForEvent('download', { timeout: 20000 }).catch(() => null);
          if (await tocca(F + '[data-az="scarica-pdf"]', 'PDF')) {
            const d = await scarico;
            if (!d) e.errori.push('PDF: il file non si scarica');
            else { const f = await d.path(), testa = f ? require('fs').readFileSync(f).subarray(0, 5).toString('latin1') : '';
              if (!/\.pdf$/.test(d.suggestedFilename()) || testa !== '%PDF-') e.errori.push('PDF: il file scaricato non è un PDF (' + d.suggestedFilename() + ')'); }
            await controlla('PDF scaricato');
            const inPiu = await p.evaluate(() => window.__aperte.length);
            if (inPiu) e.errori.push('PDF: l\'app è ripiegata sulla pagina di stampa, il PDF non si è creato');
          }
        }
      }
      await avvia();
      if (await tocca('[data-az="cerca"]', 'cerca')) {
        await p.keyboard.type('Concerto'); await pausa(1200); await controlla('cerca, eventi e luoghi');
        const q = p.locator('#q'); await q.fill('Via Roma 5'); await pausa(1200); await controlla('cerca, indirizzi');
        if (await tocca('#risultati-luoghi [data-si="0"]', 'cerca, luogo scelto', true)) await controlla('cerca, luogo scelto');
      }
      await avvia();
      if (await tocca('[data-az="cerca"]', 'cerca')) { await p.locator('#q').fill(O_('cerca-testo')); await pausa(1200); await controlla('cerca, testo ostile'); }
      await avvia();
      if (await tocca('[data-az="date"]', 'scegli i giorni')) await controlla('scegli i giorni');
      await avvia();
      if (await tocca('[data-az="citta"]', 'città')) await controlla('città');
      await avvia();
      if (await tocca('[data-az="impostazioni"]', 'impostazioni')) {
        await controlla('impostazioni');
        if (await tocca(F + '[data-legale]', 'testi legali', true)) await controlla('testi legali');
      }
      await avvia();
      if (await tocca('[data-az="nuovo"]', 'nuovo Off-Grid', true)) await controlla('modulo Off-Grid nuovo');
      /* da lontano: i numeri per regione, con il nome ostile nell'indice */
      await avvia();
      await p.evaluate(() => window.__mappaProva.jumpTo({ center: [8.8, 44.9], zoom: 6.3 }));
      await pausa(1500); await controlla('mappa da lontano');
      if (!(await p.locator('.pin.regione').count())) e.errori.push('da lontano non compaiono i numeri per regione: il nome ostile dell\'indice non è stato provato');
      if (await tocca('[data-az="elenco"]', 'elenco da lontano')) await controlla('elenco da lontano');
      /* Temi, con le lenti ostili della memoria del telefono */
      await avvia();
      if (await tocca('[data-sez="temi"]', 'Temi')) {
        await pausa(600); await controlla('Temi');
        if (await tocca('[data-tz-lente="0"]', 'Temi, lente')) { await pausa(600); await controlla('Temi, lente scelta'); }
        if (await tocca('[data-tz="strumenti"], [data-tz-foglio]', 'Temi, strumenti', true)) await controlla('Temi, strumenti');
      }
      await avvia(); await controlla('mappa con la lente dei Temi');
      for (const sez of ['progetti', 'agora']) { await avvia(); if (await tocca('[data-sez="' + sez + '"]', sez)) { await pausa(1500); await controlla('sezione ' + sez); } }
    });

    /* ---------- L'area riservata: importazione, storico, Misure ---------- */
    await sessione(Object.assign(memoriaOstile(), { red_storico: STORICO(), red_misure: misureOstili() }), {}, async ({ p, controlla, avvia, tocca }) => {
      const F = '#foglio-slot ';
      /* la password dell'area riservata sta ancora nel codice (scarto noto, T-033 e T-034): la prova la legge da lì */
      const m = require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'sorgenti', 'parti', 'app1.js'), 'utf8').match(/ADMIN_PW = '([^']+)'/);
      if (!m) { e.note.push('area riservata: la password non è più nel codice, le viste riservate vanno provate con le chiavi della redazione (blocco 8)'); return; }
      const entra = async () => { await avvia();
        if (!(await tocca('[data-az="impostazioni"]', 'impostazioni') && await tocca(F + '[data-az="mostra-admin"]', 'accesso riservato'))) return false;
        await p.locator('#adminpw').fill(m[1]); return tocca(F + '[data-az="entra-admin"]', 'area riservata'); };
      if (!(await entra())) return;
      await controlla('area riservata');
      await p.setInputFiles('#fileImporta', { name: 'eventi-inventati.csv', mimeType: 'text/csv', buffer: fileDaImportare() });
      try { await p.waitForFunction(() => { const x = window.AGR.stato.importa; return x && x.fase === 'pronto'; }, null, { timeout: 20000 }); } catch (err) { e.errori.push('importazione: l\'anteprima del file non arriva'); }
      await pausa(300); await controlla('importazione, anteprima');
      const righe = await p.locator(F + '.imp-righe > div').count();
      if (righe < 2) e.errori.push('importazione: l\'anteprima non mostra la riga scartata e l\'avviso (' + righe + ' righe)');
      if (await tocca(F + '[data-az="importa-ok"]', 'importazione, conferma', true)) await controlla('importazione, fatta');
      if (await entra()) {
        if (await tocca(F + '[data-az="admin-ongrid"]', 'modulo della redazione')) {
          await controlla('modulo della redazione');
          const ind = p.locator('#a-indirizzo');
          if (await ind.count()) { await ind.fill('Via Roma 5, Torino'); await pausa(1200); await controlla('modulo della redazione, suggerimenti');
            if (await tocca('#a-sugg [data-si="0"]', 'modulo della redazione, suggerimento', true)) await controlla('modulo della redazione, punto scelto'); }
        }
      }
      if (await entra() && await tocca(F + '[data-az="admin-storico"]', 'storico')) { await pausa(400); await controlla('storico delle operazioni'); }
      if (await entra() && await tocca(F + '[data-az="admin-misure"]', 'Misure')) {
        await pausa(800); await controlla('Misure');
        const schede = await p.evaluate(() => [...document.querySelectorAll('.mz-schede [data-mz="scheda"]')].map(b => b.getAttribute('data-v')));
        if (schede.length < 3) e.errori.push('Misure: non trovo le schede (' + schede.join(', ') + ')');
        for (const v of schede) { if (await tocca('.mz-schede [data-mz="scheda"][data-v="' + v + '"]', 'Misure, ' + v)) { await controlla('Misure, scheda ' + v);
          /* nella libreria: tutte le misure e la scheda di una misura, con gli appunti */
          if (v === 'libreria') { if (await tocca('[data-mz="filtro"][data-v="tutti"]', 'Misure, tutte', true)) await controlla('Misure, libreria completa');
            if (await tocca('[data-mz="kpi"][data-n="1"]', 'Misure, una misura', true)) await controlla('Misure, scheda di una misura'); } } }
      }
    });
  } finally {
    await s.chiudi();
  }
  confronta(e, 'ostili', trovati);
  /* ogni fonte di testi ostili deve essere arrivata davvero in una pagina, come testo: altrimenti la prova non prova nulla */
  const mancanti = ATTESI.filter(x => !visti.has(x));
  if (mancanti.length) e.errori.push('testi ostili mai arrivati in una pagina (la prova non li copre più): ' + mancanti.join(', '));
  if (process.env.OSTILI_VISTI) e.note.push('visti: ' + [...visti].sort().join(', '));
  e.note.push(viste.length + ' viste esaminate: ' + [...new Set(viste)].join(', '));
  return e;
}

module.exports = { prova, pubblici, offgrid, ID_EV, ID_OG };
eseguiDaSola(module, prova);
