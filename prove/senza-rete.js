/* Prova: app installabile, copia per l'uso senza rete, mappa sul telefono, avvisi delle novità (voci T-028, T-029 e
   T-031 del piano di adeguamento; libro mastro, §§ 2.2, 3.7, 29.1, 32.1 e 3.12; documento: docs/senza-rete.md).

   Qui stanno i controlli che si fanno leggendo le uscite e provando i moduli con una memoria finta; ciò che succede
   davvero nel browser lo controllano prove/browser/senza-rete.js e prove/browser/avvisi.js.

   1. Manifest e icone: nome dalla configurazione, colori, icone presenti e delle misure dichiarate; la pagina li
      richiama. Nessun conteggio di chi installa.
   2. Service worker di ogni uscita: l'elenco della copia è fatto di tutti i file dell'uscita, con l'impronta giusta,
      tranne i tre che arrivano sempre dalla rete; il numero di versione è lo stesso nella pagina e nel service
      worker; nessun indirizzo di altri siti; l'interruttore d'emergenza parte spento.
   3. Mappa sul telefono (sorgenti/moduli/mappa-locale.js): un tassello scaricato si conserva e poi non si riscarica;
      la copia non dipende da che cosa fa dei dati chi disegna; oltre il limite i più vecchi lasciano posto ai nuovi; i
      tasselli di un'altra versione della mappa si cancellano; la copia dell'indice si rilegge; gli errori di rete
      passano a chi chiama e non lasciano nulla.
   4. Avvisi (sorgenti/moduli/avvisi.js): il file dei sorgenti è valido; un file sbagliato si riconosce; si mostra solo
      l'avviso di questi giorni non ancora visto, prima una violazione; l'elenco dei visti non cresce.
   5. I testi nuovi dell'interfaccia sono tradotti nelle quattro lingue. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { RADICE, DIST, USCITE, elencaFile, esito, eseguiDaSola, config } = require('./comune.js');

const SORGENTI = path.join(RADICE, 'sorgenti');
const LOCALE = require(path.join(SORGENTI, 'moduli', 'mappa-locale.js'));
const AVVISI = require(path.join(SORGENTI, 'moduli', 'avvisi.js'));
const { SEMPRE_DALLA_RETE } = require(path.join(SORGENTI, 'build.js'));
const impronta = d => crypto.createHash('sha256').update(d).digest('hex').slice(0, 10);

/* Una memoria per i file finta, come quella del browser: le voci stanno nell'ordine in cui arrivano. */
function casseFinte() {
  const casse = new Map();
  const cassa = () => { const m = new Map(); return { m,
    match: async r => { const x = m.get(typeof r === 'string' ? r : r.url); return x ? new Response(x.dati.slice(0), { headers: x.intestazioni }) : undefined; },
    put: async (r, risposta) => { const u = typeof r === 'string' ? r : r.url; m.delete(u); m.set(u, { dati: await risposta.arrayBuffer(), intestazioni: Object.fromEntries(risposta.headers.entries()) }); },
    delete: async r => m.delete(typeof r === 'string' ? r : r.url),
    keys: async () => [...m.keys()].map(url => ({ url })) }; };
  return { casse, open: async n => { if (!casse.has(n)) casse.set(n, cassa()); return casse.get(n); } };
}
const byte = (n, v = 7) => new Uint8Array(n).fill(v).buffer;

function pngLato(dati) { return dati.subarray(0, 8).toString('latin1') === '\x89PNG\r\n\x1a\n' ? [dati.readUInt32BE(16), dati.readUInt32BE(20)] : null; }

async function prova() {
  const e = esito('Installazione, copia senza rete, mappa sul telefono, avvisi');
  const err = s => e.errori.push(s);
  const cfg = config();

  /* ---------- 1 e 2: le uscite ---------- */
  for (const u of USCITE) {
    const c = path.join(DIST, u), leggi = f => fs.readFileSync(path.join(c, f)), qui = `dist/${u}/`;
    const tutti = elencaFile(c);
    for (const f of ['manifest.webmanifest', 'sw.js', 'avvisi.json', 'emergenza.json', 'index.html']) if (!tutti.includes(f)) { err(qui + f + ': manca'); }
    if (!tutti.includes('sw.js') || !tutti.includes('manifest.webmanifest')) continue;
    const pagina = leggi('index.html').toString('utf8'), m = JSON.parse(leggi('manifest.webmanifest').toString('utf8'));
    if (m.name !== cfg.nome || m.short_name !== cfg.nome) err(qui + 'manifest: il nome non è quello della configurazione');
    if (m.display !== 'standalone' || m.start_url !== './index.html' || m.scope !== './') err(qui + 'manifest: display, start_url o scope non sono quelli attesi');
    if (m.theme_color !== cfg.aspetto.colore_tema || m.background_color !== cfg.aspetto.colore_sfondo) err(qui + 'manifest: i colori non sono quelli della configurazione');
    for (const k of Object.keys(m)) if (!['name', 'short_name', 'lang', 'start_url', 'scope', 'display', 'background_color', 'theme_color', 'icons'].includes(k)) err(qui + 'manifest: campo non previsto «' + k + '»');
    for (const lato of [192, 512]) {
      const ic = (m.icons || []).find(x => x.sizes === `${lato}x${lato}`);
      if (!ic || !tutti.includes(ic.src)) { err(qui + `manifest: manca l'icona da ${lato}`); continue; }
      const l = pngLato(leggi(ic.src)); if (!l || l[0] !== lato || l[1] !== lato) err(qui + ic.src + ': non è un PNG di ' + lato + ' punti');
    }
    const l180 = tutti.includes('icone/icona-180.png') && pngLato(leggi('icone/icona-180.png'));
    if (!l180 || l180[0] !== 180) err(qui + 'icone/icona-180.png: manca l\'icona per iPhone');
    if (!/<link rel="manifest" href="manifest\.webmanifest">/.test(pagina) || !/<link rel="apple-touch-icon" href="icone\/icona-180\.png">/.test(pagina)) err(qui + 'index.html: non richiama il manifest e l\'icona per iPhone');

    const sw = leggi('sw.js').toString('utf8');
    const copia = JSON.parse((sw.match(/const COPIA = (\{[^;]*\});/) || [])[1] || '{}'), versione = JSON.parse((sw.match(/const VERSIONE = ("[^"]*");/) || [])[1] || '""');
    const attesi = tutti.filter(f => !SEMPRE_DALLA_RETE.includes(f)).sort();
    const inPiu = Object.keys(copia).filter(f => !attesi.includes(f)), inMeno = attesi.filter(f => !(f in copia));
    if (inPiu.length || inMeno.length) err(qui + 'sw.js: l\'elenco della copia non è quello dei file dell\'uscita (in più: ' + inPiu.slice(0, 3).join(', ') + '; in meno: ' + inMeno.slice(0, 3).join(', ') + ')');
    for (const f of attesi) if (f in copia && copia[f] !== impronta(leggi(f))) err(qui + 'sw.js: impronta sbagliata per ' + f);
    if (!/^[0-9a-f]{7}$/.test(versione)) err(qui + 'sw.js: numero di versione mancante');
    if ((pagina.match(/data-versione="([^"]*)"/) || [])[1] !== versione) err(qui + 'il numero di versione della pagina non è quello del service worker');
    if (/https?:\/\/(?!\$)/.test(sw.replace(/\/\*[\s\S]*?\*\//g, ''))) err(qui + 'sw.js: contiene un indirizzo scritto per esteso; il service worker lavora solo sui file dell\'app');
    if (/importScripts|indexedDB|localStorage|document\.cookie|navigator\.sendBeacon|XMLHttpRequest/.test(sw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/strumento\('[a-zA-Z]+'\)/g, ''))) err(qui + 'sw.js: usa uno strumento che non gli serve');
    const em = JSON.parse(leggi('emergenza.json').toString('utf8'));
    if (!Array.isArray(em.scarta) || em.scarta.length) err(qui + 'emergenza.json: l\'interruttore d\'emergenza deve partire spento ({"scarta": []})');
    const av = JSON.parse(leggi('avvisi.json').toString('utf8'));
    if (AVVISI.errori(av).length) err(qui + 'avvisi.json: ' + AVVISI.errori(av).join('; '));
    if (u === 'pubblica') e.note.push(`versione ${versione}: ${Object.keys(copia).length} file nella copia dell'app; avvisi pubblicati: ${av.avvisi.length}; interruttore d'emergenza spento`);
  }
  /* nessun conteggio di chi installa: l'app ascolta l'installazione solo per togliere il tasto «Installa» */
  const app5 = fs.readFileSync(path.join(SORGENTI, 'parti', 'app5.js'), 'utf8');
  const dopoInstalla = (app5.match(/addEventListener\('appinstalled',[^\n]*/) || [''])[0];
  if (/MEM\.|fetch\(|registra\(|misure/i.test(dopoInstalla)) err('app5.js: all\'installazione l\'app salva o invia qualcosa: nessuno deve contare chi installa');

  /* ---------- 3. la mappa sul telefono ---------- */
  {
    const DOVE = 'https://mappa.example/prova/';
    const casse = casseFinte();
    const L = LOCALE.crea({ casse, nomeCassa: 'dl_mappa', dove: DOVE, limite: 1000 });
    let scaricati = 0;
    const scarica = n => async () => { scaricati++; return byte(n); };
    const primo = await L.tassello('v1', 13, 1, 1, scarica(300));
    /* chi disegna si porta via i dati appena li riceve: la copia sul telefono deve restare intera */
    try { structuredClone(primo, { transfer: [primo] }); } catch (x) { new Uint8Array(primo).fill(0); }
    let st = await L.stato();
    if (st.tasselli !== 1 || st.byte !== 300) err('mappa sul telefono: un tassello scaricato non si è conservato intero (' + JSON.stringify(st) + ')');
    const riletto = await L.tassello('v1', 13, 1, 1, async () => { scaricati++; return byte(1); });
    if (scaricati !== 1 || !riletto || riletto.byteLength !== 300 || new Uint8Array(riletto)[0] !== 7) err('mappa sul telefono: un tassello conservato è stato riscaricato, o non è quello di prima');
    await L.tassello('v1', 13, 1, 2, scarica(300)); await L.tassello('v1', 13, 1, 3, scarica(300));
    st = await L.stato(); if (st.tasselli !== 3 || st.byte !== 900) err('mappa sul telefono: conti sbagliati dopo tre tasselli (' + JSON.stringify(st) + ')');
    await L.tassello('v1', 13, 1, 4, scarica(300));   // oltre il limite: esce il più vecchio
    st = await L.stato();
    const chiavi = [...casse.casse.get('dl_mappa').m.keys()].map(u => u.replace(DOVE + 'sul-telefono/', ''));
    if (st.byte > 1000 || st.tasselli !== 3 || chiavi.includes('v1/13/1/1') || !chiavi.includes('v1/13/1/4')) err('mappa sul telefono: oltre il limite i più vecchi non lasciano posto ai nuovi (' + chiavi.join(', ') + ')');
    if (await L.tassello('v1', 13, 9, 9, async () => null) !== null || (await L.stato()).tasselli !== 3) err('mappa sul telefono: un punto senza mappa non va conservato');
    let passato = false;
    try { await L.tassello('v1', 13, 8, 8, async () => { throw new TypeError('rete assente'); }); } catch (x) { passato = true; }
    if (!passato || (await L.stato()).tasselli !== 3) err('mappa sul telefono: un errore di rete deve passare a chi chiama, senza lasciare nulla');
    await L.tassello('v1', 13, 5, 5, scarica(2000));   // più grande del limite: non si conserva
    if ((await L.stato()).byte > 1000) err('mappa sul telefono: un tassello più grande del limite è stato conservato');
    await L.ricorda('{"versione":"v1"}');
    /* un'altra apertura dell'app: i conti si rifanno da ciò che c'è; poi la mappa cambia versione */
    const L2 = LOCALE.crea({ casse, nomeCassa: 'dl_mappa', dove: DOVE, limite: 1000 });
    if ((await L2.stato()).byte !== st.byte) err('mappa sul telefono: alla riapertura i conti non corrispondono a ciò che c\'è');
    if (await L2.ricordato() !== '{"versione":"v1"}') err('mappa sul telefono: la copia dell\'indice della mappa non si rilegge');
    await L2.tassello('v2', 13, 1, 1, scarica(100)); await L2.soloVersione('v2');
    const dopo = [...casse.casse.get('dl_mappa').m.keys()].map(u => u.replace(DOVE + 'sul-telefono/', '')).sort();
    if (dopo.join() !== 'mappa.json,v2/13/1/1') err('mappa sul telefono: al cambio di versione restano i tasselli di prima (' + dopo.join(', ') + ')');
    /* senza memoria per i file: si scarica e basta */
    const L3 = LOCALE.crea({ casse: null, nomeCassa: 'dl_mappa', dove: DOVE });
    const x = await L3.tassello('v1', 1, 1, 1, scarica(10));
    if (!x || x.byteLength !== 10 || (await L3.stato()).tasselli !== 0 || await L3.ricordato() !== null) err('mappa sul telefono: senza memoria per i file il modulo deve scaricare e basta');
    if (LOCALE.LIMITE !== 50 * 1024 * 1024) err('mappa sul telefono: il limite deve essere 50 MB (§ 3.7)');
  }

  /* ---------- 4. gli avvisi ---------- */
  {
    const sorgente = JSON.parse(fs.readFileSync(path.join(SORGENTI, 'testi', 'avvisi.json'), 'utf8'));
    if (AVVISI.errori(sorgente).length) err('sorgenti/testi/avvisi.json: ' + AVVISI.errori(sorgente).join('; '));
    const a = (id, tipo, dal, fino, altro) => Object.assign({ id, tipo, dal, fino, testo: { it: 'Testo inventato per la prova.', en: 'Text made up for the test.' } }, altro || {});
    const file = { formato: 'avvisi', versione: 1, avvisi: [a('modifica-passata', 'modifica', '2026-01-01', '2026-01-31'), a('modifica-di-oggi', 'modifica', '2026-11-01', '2026-12-31', { apre: 'privacy' }),
      a('violazione-di-oggi', 'violazione', '2026-11-20', '2026-12-20'), a('modifica-futura', 'modifica', '2027-01-01', '2027-02-01')] };
    if (AVVISI.errori(file).length) err('avvisi: un file valido è rifiutato: ' + AVVISI.errori(file).join('; '));
    const oggi = '2026-11-21';
    let x = AVVISI.daMostrare(file, { oggi, visti: [], lingua: 'en' });
    if (!x || x.id !== 'violazione-di-oggi' || x.testo !== 'Text made up for the test.' || x.lingua !== 'en') err('avvisi: una violazione di questi giorni si mostra per prima, nella lingua della persona');
    x = AVVISI.daMostrare(file, { oggi, visti: ['violazione-di-oggi'], lingua: 'fr' });
    if (!x || x.id !== 'modifica-di-oggi' || x.apre !== 'privacy' || x.lingua !== 'it') err('avvisi: dopo la violazione tocca alla modifica di questi giorni; senza traduzione vale l\'italiano');
    if (AVVISI.daMostrare(file, { oggi, visti: ['violazione-di-oggi', 'modifica-di-oggi'], lingua: 'it' }) !== null) err('avvisi: un avviso passato, futuro o già visto non si mostra');
    if (AVVISI.daMostrare(file, { oggi: '2026-12-31', visti: [], lingua: 'it' }).id !== 'modifica-di-oggi' || AVVISI.daMostrare(file, { oggi: '2027-01-01', visti: [], lingua: 'it' }).id !== 'modifica-futura') err('avvisi: il primo e l\'ultimo giorno sono compresi');
    const visti = AVVISI.conVisto(file, ['avviso-che-non-c-e-piu', 'violazione-di-oggi'], 'modifica-di-oggi');
    if (visti.slice().sort().join() !== 'modifica-di-oggi,violazione-di-oggi') err('avvisi: l\'elenco dei visti deve tenere solo gli avvisi che il file nomina ancora (' + visti.join(', ') + ')');
    const sbagliati = [null, [], {}, { formato: 'avvisi', versione: 2, avvisi: [] }, { formato: 'avvisi', versione: 1, avvisi: [a('x', 'modifica', '2026-11-01', '2026-12-01')] },
      { formato: 'avvisi', versione: 1, avvisi: [a('avviso-uno', 'pubblicita', '2026-11-01', '2026-12-01')] }, { formato: 'avvisi', versione: 1, avvisi: [a('avviso-uno', 'modifica', '2026-12-01', '2026-11-01')] },
      { formato: 'avvisi', versione: 1, avvisi: [a('avviso-uno', 'modifica', '2026-11-01', '2026-12-01', { apre: 'altrove' })] }, { formato: 'avvisi', versione: 1, avvisi: [a('avviso-uno', 'modifica', '2026-11-01', '2026-12-01', { testo: { en: 'Solo inglese' } })] },
      { formato: 'avvisi', versione: 1, avvisi: [a('avviso-uno', 'modifica', '2026-11-01', '2026-12-01', { testo: { it: 'x'.repeat(601) } })] }, { formato: 'avvisi', versione: 1, avvisi: [a('avviso-uno', 'modifica', '2026-11-01', '2026-12-01', { collegamento: 'https://esempio.example/' })] },
      { formato: 'avvisi', versione: 1, avvisi: [a('avviso-uno', 'modifica', '2026-11-01', '2026-12-01'), a('avviso-uno', 'modifica', '2026-11-01', '2026-12-01')] }, { formato: 'avvisi', versione: 1, avvisi: Array.from({ length: 11 }, (_, i) => a('avviso-' + i + 'x', 'modifica', '2026-11-01', '2026-12-01')) }];
    sbagliati.forEach((j, i) => { if (!AVVISI.errori(j).length) err('avvisi: il file sbagliato n. ' + (i + 1) + ' è accettato'); if (AVVISI.daMostrare(j, { oggi, visti: [], lingua: 'it' }) !== null) err('avvisi: il file sbagliato n. ' + (i + 1) + ' mostra un avviso'); });
  }

  /* ---------- 5. i testi nuovi sono tradotti ---------- */
  {
    const t = fs.readFileSync(path.join(SORGENTI, 'parti', 'traduzioni.js'), 'utf8'), TR = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
    const blocchi = [(app5.match(/function fSenzaRete\(\)\{[\s\S]*?\n\}/) || [''])[0], (app5.match(/function mostraNovita\(\)\{[\s\S]*?\n\}/) || [''])[0], (app5.match(/const GUIDA = \(\) => \[[\s\S]*?\n\];/) || [''])[0],
      (app5.match(/data-az="senza-rete"[^\n]*/) || [''])[0], (app5.match(/id="versione-app"[^\n]*/) || [''])[0]];
    const testi = [...new Set(blocchi.join('\n').match(/tr\('((?:[^'\\]|\\.)*)'/g) || [])].map(x => x.slice(4, -1));
    if (testi.length < 19) err('testi nuovi: la prova ne trova solo ' + testi.length + ' nei sorgenti');
    for (const l of ['en', 'es', 'fr', 'ar']) for (const k of testi) {
      if (!TR[l][k]) err(`traduzioni: manca «${k.slice(0, 50)}» in ${l}`);
      else for (const v of k.match(/\{[a-z]+\}/g) || []) if (!TR[l][k].includes(v)) err(`traduzioni: in ${l} «${k.slice(0, 40)}» ha perso ${v}`);
    }
    e.note.push(`testi dell'interfaccia controllati nelle quattro lingue: ${testi.length}`);
  }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
