/* Prova nel browser: le regole degli Off-Grid e del calendario (voce T-027 del piano di adeguamento; libro mastro,
   § 2.2, § 3.7, § 13.3, § 30.2).

   1. Tempo: un Off-Grid esce dalla mappa e dall'elenco tre ore dopo la fine; finito da meno di tre ore si vede solo
      con «Appena finiti»; resta nel calendario (mese e giornata) per tre mesi, poi il telefono lo cancella da sé, anche
      dal calendario.
   2. Cancellazione dall'app: uno per uno (anche un Off-Grid passato, dalla giornata del calendario) e per serie
      («solo questo» oppure «tutta la serie»); ciò che si cancella sparisce dalla memoria del telefono e dal calendario.
   3. Dal telefono non esce nulla: nessuna richiesta verso l'esterno mentre si guardano, si creano con «Scegli sulla
      mappa» e si cancellano gli Off-Grid; la ricerca dell'indirizzo parte solo quando la persona scrive nel campo
      dell'indirizzo. La scheda di un Off-Grid non ha comandi per condividerlo.
   4. Il PDF del calendario si crea sul telefono e passa al foglio di condivisione del telefono come file, senza
      collegamenti e senza richieste verso l'esterno; dove il foglio non c'è, il file si scarica (lo provano
      prove/browser/ostili.js e prove/browser/memoria.js).
   Dati inventati; ogni richiesta verso l'esterno è bloccata. */
'use strict';
const { esito, eseguiDaSola } = require('../comune.js');
const { playwright, server, apri, pausa } = require('./comune.js');

const H = 36e5, G = 24 * H;
const locale = ms => { const d = new Date(ms), p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); };
/* ogni Off-Grid in un punto suo di Torino, perché sulla mappa non si raccolgano in un gruppo */
let quanti = 0;
const og = (id, titolo, inizio, fine, altro) => { const n = quanti++; return Object.assign({ id, personal: true, offgrid: true, title: titolo, datetime: locale(inizio), end: locale(fine),
  lat: 45.0640 + (n % 4) * 0.0045, lng: 7.6760 + Math.floor(n / 4) * 0.0075, address: 'Via Finta ' + (n + 1), notes: '', hidden: false, price: '' }, altro || {}); };

async function prova() {
  const e = esito('Off-Grid e calendario: le regole (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const s = await server('pubblica');
  const err = x => e.errori.push(x);
  const F = '#foglio-slot ';
  const ora = Date.now();

  const sessione = async (memoria, prima, fn) => {
    const { browser, ctx } = await apri(pw, Object.assign({ dl_guida: '1' }, memoria));
    try {
      const fuori = [];
      ctx.on('request', r => { if (!/^https?:\/\/127\.0\.0\.1(:\d+)?\//.test(r.url())) fuori.push(r.url()); });
      const p = await ctx.newPage();
      p.on('pageerror', x => err('errore nella pagina: ' + x.message));
      if (prima) await prima(p);
      const avvia = async () => { await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(1200); };
      const tocca = async (sel, dove) => {
        const l = p.locator(sel).first();
        if (!(await l.count())) { err(`${dove}: non trovo ${sel}`); return false; }
        try { await l.click({ timeout: 5000 }); } catch (x) { try { await l.dispatchEvent('click'); } catch (y) { err(`${dove}: non riesco a toccare ${sel}`); return false; } }
        await pausa(350); return true;
      };
      const telefono = () => p.evaluate(() => ({ ev: JSON.parse(localStorage.getItem('dl_eventi') || '[]').map(x => x.id), cal: Object.keys(JSON.parse(localStorage.getItem('dl_calendario') || '{}')) }));
      const nelFoglio = () => p.evaluate(() => [...document.querySelectorAll('#foglio-slot [data-ev]')].map(x => x.dataset.ev));
      const sullaMappa = () => p.evaluate(() => [...document.querySelectorAll('.pin[data-ev], .pin[data-gruppo]')].flatMap(x => (x.dataset.ev || x.dataset.gruppo).split(',')));
      await fn({ p, avvia, tocca, telefono, nelFoglio, sullaMappa, fuori });
    } finally { await browser.close(); }
  };

  try {
    /* ---------- 1, 2 e 3: tempo, cancellazione, nessuna richiesta ---------- */
    const eventi = [
      og('og-domani', 'Cena inventata di domani', ora + 24 * H, ora + 26 * H),
      og('og-finito-due', 'Pranzo inventato finito da due ore', ora - 4 * H, ora - 2 * H),
      og('og-finito-quattro', 'Colazione inventata finita da quattro ore', ora - 6 * H, ora - 4 * H),
      og('og-ieri', 'Cena inventata di ieri', ora - 30 * H, ora - 28 * H),
      og('og-novantuno', 'Gita inventata di tre mesi fa', ora - 91 * G - 2 * H, ora - 91 * G),
      og('og-novantatre', 'Gita inventata di più di tre mesi fa', ora - 93 * G - 2 * H, ora - 93 * G),
      ...[1, 8, 15].map((g, i) => og('og-serie-' + (i + 1), 'Corso inventato del martedì', ora + g * G + 2 * H, ora + g * G + 3 * H, { seriesId: 'serie-inventata', rep: { freq: 'weekly', until: locale(ora + 15 * G).slice(0, 10) } })),
      ...[2, 9].map((g, i) => og('og-coppia-' + (i + 1), 'Prove inventate del coro', ora + g * G + 4 * H, ora + g * G + 5 * H, { seriesId: 'coppia-inventata', rep: { freq: 'weekly', until: locale(ora + 9 * G).slice(0, 10) } })),
    ];
    const tutti = eventi.map(x => x.id);
    await sessione({ dl_eventi: eventi, dl_calendario: Object.fromEntries(tutti.map(id => [id, true])) }, null, async ({ p, avvia, tocca, telefono, nelFoglio, sullaMappa, fuori }) => {
      await avvia();
      /* tre mesi nel calendario, poi via dal telefono */
      let t = await telefono();
      if (t.ev.includes('og-novantatre') || t.cal.includes('og-novantatre')) err('un Off-Grid finito da più di tre mesi resta sul telefono (eventi o calendario)');
      for (const id of tutti.filter(x => x !== 'og-novantatre')) if (!t.ev.includes(id) || !t.cal.includes(id)) err(`l'Off-Grid «${id}» è sparito dal telefono prima del tempo`);
      /* sulla mappa e nell'elenco: fuori tre ore dopo la fine */
      const pin = await sullaMappa();
      if (!pin.includes('og-domani')) err('mappa: l\'Off-Grid di domani non ha il suo segnaposto');
      for (const id of ['og-finito-quattro', 'og-ieri', 'og-novantuno']) if (pin.includes(id)) err(`mappa: «${id}», finito da più di tre ore, è ancora sulla mappa`);
      if (await tocca('[data-az="elenco"]', 'elenco')) {
        const el = await nelFoglio();
        if (!el.includes('og-domani')) err('elenco: manca l\'Off-Grid di domani');
        for (const id of ['og-finito-due', 'og-finito-quattro', 'og-ieri', 'og-novantuno']) if (el.includes(id)) err(`elenco: «${id}» è finito e non dovrebbe esserci`);
        if (!el.includes('og-serie-1') || el.includes('og-serie-2')) err('elenco: di una serie si deve vedere solo la prossima data');
      }
      await avvia();
      if (await tocca('[data-az="strati"]', 'strati') && await tocca(F + '[data-az="finiti"]', 'strati, «Appena finiti»')) {
        const pin2 = await sullaMappa();
        if (!pin2.includes('og-finito-due')) err('con «Appena finiti» l\'Off-Grid finito da due ore non torna sulla mappa');
        for (const id of ['og-finito-quattro', 'og-ieri', 'og-novantuno']) if (pin2.includes(id)) err(`con «Appena finiti» torna sulla mappa anche «${id}», finito da più di tre ore`);
      }
      /* nel calendario restano: mese e giornata */
      await avvia();
      if (await tocca('[data-az="calendario"]', 'calendario')) {
        for (const [id, quando] of [['og-ieri', ora - 30 * H], ['og-novantuno', ora - 91 * G - 2 * H]]) {
          const d = new Date(quando), giorno = locale(quando).slice(0, 10);
          await p.evaluate(([y, m]) => { window.AGR.stato.cal.y = y; window.AGR.stato.cal.m = m; }, [d.getFullYear(), d.getMonth()]);
          await tocca(F + '[data-vista="mese"]', 'calendario, mese');
          if (!(await p.locator(F + '[data-giorno-cal="' + giorno + '"] .punto.og').count())) err(`calendario, mese: il giorno di «${id}» non mostra l'Off-Grid passato`);
          if (await tocca(F + '[data-giorno-cal="' + giorno + '"]', 'calendario, giorno') && !(await nelFoglio()).includes(id)) err(`calendario, giornata: «${id}» non c'è`);
        }
        /* un Off-Grid passato si cancella dall'app, dalla giornata */
        const ieri = locale(ora - 30 * H).slice(0, 10);
        await p.evaluate(g => { window.AGR.stato.cal.giorno = g; }, ieri); await tocca(F + '[data-vista="giornata"]', 'calendario, giornata di ieri');
        if (await tocca(F + '[data-ev="og-ieri"]', 'giornata, Off-Grid di ieri')) {
          const scheda = await p.locator('#foglio-slot').innerHTML();
          if (/condivid|data-az="[^"]*(?:invia|share)/i.test(scheda) || /href="(?:mailto:|sms:|whatsapp:|https:\/\/(?:wa\.me|t\.me))/i.test(scheda)) err('scheda di un Off-Grid: c\'è un comando per condividerlo');
          if (await tocca(F + '[data-elimina="og-ieri"]', 'scheda, elimina') && await tocca(F + '[data-elimina-ok="una"]', 'conferma')) {
            t = await telefono();
            if (t.ev.includes('og-ieri') || t.cal.includes('og-ieri')) err('un Off-Grid cancellato dall\'app resta sul telefono (eventi o calendario)');
          }
        }
      }
      /* per serie: «solo questo» toglie una data, «tutta la serie» le toglie tutte */
      await avvia();
      if (await tocca('[data-az="elenco"]', 'elenco') && await tocca(F + '[data-ev="og-coppia-1"]', 'scheda della serie') && await tocca(F + '[data-elimina="og-coppia-1"]', 'scheda, elimina')) {
        if (!(await p.locator(F + '[data-elimina-ok="serie"]').count())) err('conferma: per un Off-Grid che si ripete manca «tutta la serie»');
        if (await tocca(F + '[data-elimina-ok="una"]', 'conferma, solo questo')) {
          t = await telefono();
          if (t.ev.includes('og-coppia-1') || !t.ev.includes('og-coppia-2') || t.cal.includes('og-coppia-1') || !t.cal.includes('og-coppia-2')) err('«solo questo» non toglie una sola data della serie');
        }
      }
      await avvia();
      if (await tocca('[data-az="elenco"]', 'elenco') && await tocca(F + '[data-ev="og-serie-1"]', 'scheda della serie') && await tocca(F + '[data-elimina="og-serie-1"]', 'scheda, elimina')
        && await tocca(F + '[data-elimina-ok="serie"]', 'conferma, tutta la serie')) {
        t = await telefono();
        const rimaste = t.ev.concat(t.cal).filter(id => /^og-serie-/.test(id));
        if (rimaste.length) err('«tutta la serie» lascia sul telefono ' + [...new Set(rimaste)].join(', '));
        if (!t.ev.includes('og-domani') || !t.ev.includes('og-coppia-2')) err('cancellando una serie sono spariti anche altri Off-Grid');
      }
      /* un Off-Grid nuovo con «Scegli sulla mappa»: nessuna ricerca */
      await avvia();
      if (await tocca('[data-az="nuovo"]', 'Off-Grid nuovo')) {
        await p.locator('#f-titolo').fill('Passeggiata inventata'); await p.locator('#f-note').fill('Nota inventata.').catch(() => {}); await pausa(700);
        if (await tocca(F + '[data-az="scegli-mappa"]', 'Off-Grid nuovo, scegli sulla mappa') && await tocca('[data-az="posa-ok"]', 'conferma del punto') && await tocca(F + '[data-salva-form="una"]', 'salva')) {
          await pausa(400);
          if (!(await p.evaluate(() => window.AGR.eventi().some(x => x.title === 'Passeggiata inventata')))) err('l\'Off-Grid creato con «Scegli sulla mappa» non si è salvato');
        }
      }
      if (fuori.length) err('guardando, creando e cancellando Off-Grid il telefono ha fatto richieste verso l\'esterno: ' + [...new Set(fuori.map(u => new URL(u).host))].join(', '));
      /* la ricerca dell'indirizzo: solo quando la persona scrive nel campo dell'indirizzo */
      await avvia();
      if (await tocca('[data-az="nuovo"]', 'Off-Grid nuovo')) {
        await p.locator('#f-titolo').fill('Via Roma 5 Torino, titolo inventato'); await p.locator('#f-note').fill('Via Roma 5 Torino, nota inventata').catch(() => {}); await pausa(1200);
        if (fuori.length) err('il titolo o le note di un Off-Grid fanno partire una ricerca verso l\'esterno');
        await p.locator('#f-indirizzo').fill('Via Inventata 5'); await pausa(1300);
        const host = [...new Set(fuori.map(u => new URL(u).host))];
        if (host.length !== 1 || host[0] !== 'photon.komoot.io') err('scrivendo l\'indirizzo la richiesta deve andare solo alla ricerca degli indirizzi: ' + (host.join(', ') || 'nessuna richiesta'));
        const titoloFuori = fuori.some(u => /titolo|nota/i.test(decodeURIComponent(u)));
        if (titoloFuori) err('la ricerca dell\'indirizzo porta fuori dal telefono anche il titolo o le note');
      }
      e.note.push('tre ore: fuori da mappa ed elenco; tre mesi: nel calendario (mese e giornata), poi cancellati dal telefono; cancellazione uno per uno, «solo questo» e «tutta la serie»');
      e.note.push('richieste verso l\'esterno: nessuna, tranne la ricerca degli indirizzi quando si scrive nel campo dell\'indirizzo');
    });

    /* ---------- 4: il PDF passa al foglio di condivisione del telefono ---------- */
    const ev2 = [og('og-pdf-1', 'Colazione inventata', ora + 24 * H, ora + 25 * H), og('og-pdf-2', 'Cena inventata', ora + 30 * H, ora + 31 * H)];
    const finto = p => p.addInitScript(() => { window.__condivisi = [];
      navigator.canShare = d => !!(d && d.files && d.files.length);
      navigator.share = async d => { const f = d.files && d.files[0]; window.__condivisi.push({ file: d.files ? d.files.length : 0, tipo: f ? f.type : '', nome: f ? f.name : '', peso: f ? f.size : 0,
        testa: f ? new TextDecoder('latin1').decode(new Uint8Array(await f.slice(0, 5).arrayBuffer())) : '', url: d.url || '', testo: d.text || '' }); }; });
    await sessione({ dl_eventi: ev2, dl_calendario: { 'og-pdf-1': true, 'og-pdf-2': true } }, finto, async ({ p, avvia, tocca, fuori }) => {
      await avvia();
      const scaricati = []; p.on('download', d => scaricati.push(d.suggestedFilename()));
      if (await tocca('[data-az="calendario"]', 'calendario') && await tocca(F + '[data-vista="agenda"]', 'calendario, agenda') && await tocca(F + '[data-az="pdf"]', 'calendario, PDF') && await tocca(F + '[data-az="scarica-pdf"]', 'PDF, condividi')) {
        try { await p.waitForFunction(() => window.__condivisi.length > 0, null, { timeout: 20000 }); } catch (x) { /* controllato qui sotto */ }
        const c = await p.evaluate(() => window.__condivisi);
        if (c.length !== 1) err('PDF: il file non arriva al foglio di condivisione del telefono');
        else {
          const x = c[0];
          if (x.file !== 1 || x.tipo !== 'application/pdf' || !/\.pdf$/.test(x.nome) || x.testa !== '%PDF-' || x.peso < 500) err('PDF: al foglio di condivisione non arriva un file PDF vero (' + JSON.stringify(x) + ')');
          if (x.url || x.testo) err('PDF: insieme al file passa anche un collegamento o un testo');
          e.note.push(`PDF: creato sul telefono (${Math.round(x.peso / 1024)} KB) e passato come file al foglio di condivisione; nessun collegamento, nessuna richiesta verso l'esterno`);
        }
        if (scaricati.length) err('PDF: con il foglio di condivisione il file non deve anche scaricarsi');
      }
      if (fuori.length) err('PDF: creare o condividere il PDF fa richieste verso l\'esterno: ' + [...new Set(fuori.map(u => new URL(u).host))].join(', '));
    });
  } finally { await s.chiudi(); }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
