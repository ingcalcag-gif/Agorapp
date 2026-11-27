/* Prova nel browser: i testi pubblicati e le note legali da ogni schermata (voce T-055 del piano di adeguamento;
   libro mastro, Parte VI; § 7.5, misura 1; § 31.1; documento: docs/testi-pubblicati.md).

   1. Da ogni schermata (mappa, calendario, Agorà, Temi, Impostazioni, una scheda, il modulo «Segnala») un tocco sul
      tasto «Note legali» in alto apre le note legali; con la mappa a schermo intero lo fa l'angolo della mappa.
      Chiudendo si torna da dove si era partiti.
   2. Il foglio «Informazioni legali»: quattro testi, versione «In preparazione» finché la configurazione non dà
      versione e data, il segnaposto, il titolare accanto al nome; nelle note legali le due caselle, quella per le
      autorità anche in inglese, e il collegamento alle licenze; nell'informativa il riquadro del diritto di opposizione
      e la sezione «Dove stanno i dati»; dal modulo «Segnala» si arriva all'informativa.
   3. In inglese e in arabo: interfaccia tradotta, testo in italiano con la riga che lo dice e la direzione giusta.
   4. «Apri come pagina di testo»: la pagina di solo testo esiste, senza script, con la riserva dell'estrazione.
   5. Su un telefono stretto (360 punti) il tasto in alto sta nella barra senza farla traboccare, in tutte e due le app.
   Dati inventati; ogni richiesta verso l'esterno è bloccata. */
'use strict';
const { esito, eseguiDaSola, config } = require('../comune.js');
const { playwright, server, apri, pausa, archivio, eventoProva } = require('./comune.js');

const EV = eventoProva('testilegali', { titolo: 'Evento inventato per i testi legali' });
const STRATI = { musica: { on: true } };

async function prova() {
  const e = esito('Testi pubblicati e note legali da ogni schermata (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const cfg = config();
  const err = x => e.errori.push(x);
  const F = '#foglio-slot ';
  const s = await server('pubblica');
  let viste = 0;

  const sessione = async (memoria, fn, opzioni) => {
    const { browser, ctx } = await apri(pw, Object.assign({ dl_guida: '1', dl_strati: STRATI }, memoria), opzioni);
    try {
      await archivio(ctx, [EV]);
      const p = await ctx.newPage();
      p.on('pageerror', x => err('errore nella pagina: ' + x.message));
      const tocca = async (sel, dove) => {
        const l = p.locator(sel).first();
        if (!(await l.count())) { err(`${dove}: non trovo ${sel}`); return false; }
        try { await l.click({ timeout: 5000 }); } catch (x) { err(`${dove}: non riesco a toccare ${sel} (${String(x.message).split('\n')[0].slice(0, 100)})`); return false; }
        await pausa(300); return true;
      };
      const stato = () => p.evaluate(() => ({ foglio: window.AGR.stato.foglio, legale: window.AGR.stato.legale, sezione: window.AGR.stato.sezione }));
      await fn({ p, ctx, tocca, stato });
    } finally { await browser.close(); }
  };

  try {
    /* ---------- 1. da ogni schermata ---------- */
    await sessione({}, async ({ p, tocca, stato }) => {
      await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(600);
      const daQui = async (dove, apriPrima, atteso) => {
        if (apriPrima && !(await apriPrima())) return;
        const prima = (await stato()).foglio;
        if (!(await tocca('#btnLegali', dove + ', tasto «Note legali»'))) return;
        const x = await stato();
        if (x.foglio !== 'legale' || x.legale !== 'note-legali') { err(`${dove}: il tasto in alto non apre le note legali (${x.foglio}/${x.legale})`); return; }
        viste++;
        if (!(await tocca(F + '[data-az="indietro-legale"]', dove + ', chiudi'))) return;
        const dopo = (await stato()).foglio;
        if (dopo !== (atteso === undefined ? prima : atteso)) err(`${dove}: chiudendo le note legali non si torna da dove si era (${dopo} invece di ${prima})`);
      };
      await p.waitForFunction(() => window.AGR && window.AGR.archivio && window.AGR.archivio().pubblici >= 1, null, { timeout: 20000 }).catch(() => {});
      await daQui('mappa', null, null);
      await daQui('calendario', () => tocca('#btnCal', 'calendario'));
      await p.evaluate(() => window.AGR && document.querySelector('[data-az="chiudi"]') && document.querySelector('[data-az="chiudi"]').click()); await pausa(250);
      await daQui('Impostazioni', () => tocca('#btnImpo', 'impostazioni'));
      /* da una scheda e dal modulo «Segnala» */
      await p.evaluate(() => document.querySelector('[data-az="chiudi"]') && document.querySelector('[data-az="chiudi"]').click()); await pausa(250);
      if (await tocca('[data-az="elenco"]', 'elenco') && (await p.locator(F + `[data-ev="${EV.id}"]`).first().waitFor({ timeout: 15000 }).then(() => true, () => false) || true) && await tocca(F + `[data-ev="${EV.id}"]`, 'elenco, evento inventato')) {
        await daQui('scheda di un evento', null);
        if (await tocca(F + '[data-az="segnala"]', 'scheda, «Segnala»')) {
          await daQui('modulo «Segnala»', null);
          /* il modulo porta all'informativa, accanto alla casella per gli utenti */
          if (await tocca(F + '[data-legale="informativa"]', 'modulo «Segnala», «Informativa sulla privacy»')) {
            const x = await stato();
            if (x.foglio !== 'legale' || x.legale !== 'informativa') err('dal modulo «Segnala» non si apre l\'informativa');
            await tocca(F + '[data-az="indietro-legale"]', 'informativa, chiudi');
            if ((await stato()).foglio !== 'segnala') err('chiudendo l\'informativa non si torna al modulo «Segnala»');
          }
        }
      }
      await p.keyboard.press('Escape'); await pausa(250);
      for (const sez of ['agora', 'progetti', 'temi']) {
        if (!(await tocca(`#navBassa [data-sez="${sez}"]`, 'sezione ' + sez))) continue;
        await pausa(400);
        await daQui('sezione ' + sez, null);
      }
      await tocca('#navBassa [data-sez="mappa"]', 'torna alla mappa'); await pausa(400);
      /* mappa a schermo intero: la barra in alto sparisce, resta l'angolo della mappa */
      if (await tocca('#btnPieno', 'schermo intero')) {
        if (await p.locator('#btnLegali').isVisible()) err('a schermo intero la barra in alto dovrebbe sparire (la prova non è più quella giusta)');
        if (await tocca('#attrib [data-legale="note-legali"]', 'angolo della mappa, «Note legali»')) {
          const x = await stato();
          if (x.foglio !== 'legale' || x.legale !== 'note-legali') err('a schermo intero l\'angolo della mappa non apre le note legali'); else viste++;
        }
      }
    });

    /* ---------- 2. il foglio e i quattro testi ---------- */
    await sessione({}, async ({ p, tocca, stato }) => {
      await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(500);
      await tocca('#btnImpo', 'impostazioni');
      for (const t of ['informativa', 'dati-locali', 'note-legali', 'condizioni-uso']) if (!(await p.locator(F + `.menu-r[data-legale="${t}"]`).count())) err('Impostazioni → Documenti: manca ' + t);
      if (!(await tocca(F + '.menu-r[data-legale="note-legali"]', 'Impostazioni, note legali'))) return;
      const foglio = async () => (await p.locator(F + '.foglio').textContent() || '').replace(/\s+/g, ' ');
      let t = await foglio();
      if (!t.includes(cfg.nome + ', progetto di ' + cfg.titolare)) err('il foglio non mostra il titolare accanto al nome');
      if (!t.includes('In preparazione') || !t.includes('[Testo in preparazione.')) err('le note legali non mostrano versione «In preparazione» e segnaposto');
      if (!t.includes(cfg.caselle.contatto) || !t.includes(cfg.caselle.autorita)) err('le note legali non mostrano le due caselle');
      const inglese = await p.locator(F + '.legale-testo [lang="en"]').textContent().catch(() => '');
      if (!/Contact point for authorities/.test(inglese) || !inglese.includes(cfg.caselle.autorita)) err('nelle note legali manca la parte in inglese con la casella per le autorità');
      const lic = await p.locator(F + '.legale-testo a[href="licenze/index.html"]').count();
      if (!lic) err('le note legali non hanno il collegamento alla pagina delle licenze');
      if (/Piazza|\b\d{5}\s+[A-Z]/.test(t)) err('nelle note legali c\'è qualcosa che sembra un indirizzo postale');
      if (/1\.2|Conforme|carto/i.test(t)) err('nel foglio resta qualcosa dei testi v1.2');
      for (const k of ['informativa', 'dati-locali', 'condizioni-uso']) {
        if (!(await tocca(F + `.seg [data-legale="${k}"]`, 'linguetta ' + k))) continue;
        const x = await stato();
        if (x.legale !== k) err('la linguetta non apre ' + k);
        if ((await p.locator(F + `.seg [data-legale="${k}"]`).getAttribute('aria-pressed')) !== 'true') err('la linguetta di ' + k + ' non risulta premuta');
        t = await foglio();
        if (k === 'informativa') {
          if (!(await p.locator(F + 'section.opposizione').count())) err('l\'informativa non ha il riquadro separato del diritto di opposizione');
          if (!(await p.locator(F + '#dove-stanno-i-dati').count())) err('l\'informativa non ha la sezione «Dove stanno i dati»');
          if (!t.includes(cfg.caselle.contatto)) err('l\'informativa non mostra la casella per gli utenti');
        }
        if (cfg.caselle.autorita && t.includes(cfg.caselle.autorita)) err(k + ': la casella per le autorità sta soltanto nelle note legali');
        const href = await p.locator(F + 'a.link[href^="testi/"]').getAttribute('href');
        if (href !== `testi/it/${k}.html`) err(k + ': «Apri come pagina di testo» porta a ' + href);
      }
      /* chiudendo si torna alle Impostazioni, da cui si era partiti */
      await tocca(F + '[data-az="indietro-legale"]', 'chiudi');
      if ((await stato()).foglio !== 'impostazioni') err('chiudendo il foglio aperto dalle Impostazioni non si torna alle Impostazioni');
    });

    /* ---------- 3. in inglese e in arabo ---------- */
    for (const [l, parola, dir] of [['en', 'Legal information', 'ltr'], ['ar', 'معلومات قانونية', 'rtl']]) {
      await sessione({ dl_lingua: l }, async ({ p, tocca }) => {
        await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(500);
        const tasto = (await p.locator('#btnLegali').textContent() || '').trim();
        if (tasto === 'Note legali') err(l + ': il tasto in alto non è tradotto');
        if (!(await tocca('#btnLegali', l + ', tasto in alto'))) return;
        const t = (await p.locator(F + '.foglio').textContent() || '');
        if (!t.includes(parola)) err(l + ': il titolo del foglio non è tradotto');
        if (!(await p.locator(F + '.legale > p.meta').count())) err(l + ': manca la riga che dice che il testo è soltanto in italiano');
        const a = await p.locator(F + '.legale-testo').evaluate(x => x.getAttribute('lang') + '/' + x.getAttribute('dir'));
        if (a !== 'it/ltr') err(l + ': il testo in italiano deve avere lang="it" e dir="ltr" (' + a + ')');
        if (await p.evaluate(() => document.documentElement.dir) !== dir) err(l + ': direzione della pagina sbagliata');
      });
    }

    /* ---------- 4. la pagina di solo testo ---------- */
    await sessione({}, async ({ p }) => {
      for (const t of ['informativa', 'dati-locali', 'note-legali', 'condizioni-uso']) {
        const r = await p.goto(s.url + 'testi/it/' + t + '.html');
        if (!r || r.status() !== 200) { err('testi/it/' + t + '.html non si apre'); continue; }
        const x = await p.evaluate(() => ({ script: document.scripts.length, tdm: (document.querySelector('meta[name="tdm-reservation"]') || {}).content, h1: (document.querySelector('h1') || {}).textContent, lang: document.documentElement.lang, altri: document.querySelectorAll('ul.altri a').length }));
        if (x.script) err(t + ': la pagina di testo contiene script');
        if (x.tdm !== '1') err(t + ': la pagina di testo non porta la riserva dell\'estrazione');
        if (!x.h1 || x.lang !== 'it' || x.altri !== 4) err(t + ': titolo, lingua o collegamenti agli altri testi mancanti');
      }
      /* i collegamenti tra le pagine funzionano */
      await p.click('ul.altri a[href="informativa.html"]'); await pausa(200);
      if (!/\/testi\/it\/informativa\.html$/.test(p.url())) err('dalla pagina delle condizioni d\'uso non si arriva all\'informativa');
    });

    /* ---------- 5. telefono stretto: la barra in alto non trabocca ---------- */
    const s2 = await server('redazione');
    try {
      for (const [nome, url] of [['app pubblica', s.url], ['app della redazione', s2.url]]) {
        for (const lingua of ['it', 'en', 'es', 'fr', 'ar']) {
          await sessione({ dl_lingua: lingua }, async ({ p }) => {
            await p.goto(url + 'index.html'); await p.waitForSelector('#btnLegali'); await pausa(500);
            const x = await p.evaluate(() => {
              const top = document.querySelector('.top'), w = window.innerWidth;
              const dentro = id => { const r = document.getElementById(id).getBoundingClientRect(); return r.left >= 0 && r.right <= w + 0.5 && r.width > 0; };
              /* nessun pezzo della barra copre un altro: marchio (o il suo nome), cartellino della redazione, i tre tasti */
              const pezzi = ['#btnHome .quad', '#btnHome .nome', '#badgeRed', '#btnLegali span', '#btnCitta span', '#btnImpo'].map(q => document.querySelector(q)).filter(el => el && el.offsetParent && el.getBoundingClientRect().width > 0);
              const sovrapposti = [];
              for (let i = 0; i < pezzi.length; i++) for (let j = i + 1; j < pezzi.length; j++) {
                const a = pezzi[i].getBoundingClientRect(), b = pezzi[j].getBoundingClientRect();
                if (a.left < b.right - 0.5 && b.left < a.right - 0.5) sovrapposti.push((pezzi[i].id || pezzi[i].className) + '/' + (pezzi[j].id || pezzi[j].className));
              }
              return { trabocca: top.scrollWidth > top.clientWidth + 1, legali: dentro('btnLegali'), citta: dentro('btnCitta'), impo: dentro('btnImpo'), sovrapposti, alto: document.getElementById('btnLegali').getBoundingClientRect().height };
            });
            if (x.trabocca || !x.legali || !x.citta || !x.impo || x.sovrapposti.length) err(`${nome} (${lingua}), 360 punti: la barra in alto trabocca, un tasto esce dallo schermo o due pezzi si coprono (${JSON.stringify(x)})`);
            if (x.alto < 44) err(`${nome}: il tasto «Note legali» è più basso di 44 punti`);
          }, { viewport: { width: 360, height: 740 } });
        }
      }
    } finally { await s2.chiudi(); }
    e.note.push(`note legali aperte da ${viste} schermate, con ritorno al punto di partenza; quattro testi, inglese e arabo, pagine di solo testo, barra a 360 punti`);
  } finally { await s.chiudi(); }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
