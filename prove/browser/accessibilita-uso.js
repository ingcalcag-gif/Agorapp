/* Prova nel browser: accessibilità nell'uso (voci T-057, T-058 e T-059 del piano di adeguamento; libro mastro, § 11.1,
   righe «Finestre, avvisi e pannelli», «La pagina è divisa…», «I pulsanti fatti solo di un'icona…», «L'app rispetta le
   preferenze impostate sul telefono», «I pulsanti misurano almeno 24 pixel», e metodo della verifica del Collaudo;
   § 11.3, regola 4; documento: docs/accessibilita.md).

   1. Fogli e guida: finestre annunciate (role="dialog", aria-modal, un nome), il cursore entra e non esce con Tab o
      Maiusc+Tab, Esc chiude come la croce, il cursore torna al comando di partenza; quando un foglio si ridisegna il
      cursore resta sul comando.
   2. Struttura: un solo contenuto principale visibile, intestazione, navigazione.
   3. Contorno visibile su ogni comando raggiunto con la tastiera, mappa compresa.
   4. Pulsanti fatti solo di un'icona: hanno un nome, e in inglese il nome è tradotto.
   5. Preferenze del telefono: tema scuro senza scelta salvata (e contrasti con axe-core in tema scuro), animazioni
      ridotte, contrasto aumentato.
   6. Pulsanti di almeno 24 punti per lato (salvo i collegamenti dentro una riga di testo).
   7. Testo ingrandito al doppio: a 320 punti di larghezza nulla esce dallo schermo e niente si copre.
   8. Sola tastiera sui percorsi essenziali (T-059): trovare un evento, aprirne la scheda, salvarlo nel calendario,
      scrivere ad Agorapp con «Segnala»; cercare un indirizzo.
   Il lettore di schermo del telefono resta una prova a mano (debug finale). Dati inventati; nessuna richiesta esterna. */
'use strict';
const fs = require('fs');
const path = require('path');
const { esito, eseguiDaSola, RADICE } = require('../comune.js');
const { playwright, server, apri, pausa, archivio, eventoProva } = require('./comune.js');

const EV = eventoProva('accessibile', { titolo: 'Evento inventato per la tastiera' });
const STRATI = { musica: { on: true } };
const t = fs.readFileSync(path.join(RADICE, 'sorgenti', 'parti', 'traduzioni.js'), 'utf8'), TR = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));

async function prova() {
  const e = esito('Accessibilità nell\'uso: fogli, tastiera, preferenze, misure (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const err = x => e.errori.push(x);
  const F = '#foglio-slot ';
  const s = await server('pubblica');
  const conti = { tab: 0, schermate: 0, piccoli: 0 };

  const sessione = async (memoria, fn, opzioni) => {
    const { browser, ctx } = await apri(pw, Object.assign({ dl_guida: '1', dl_strati: STRATI }, memoria), opzioni);
    try {
      await archivio(ctx, [EV]);
      const p = await ctx.newPage();
      p.on('pageerror', x => err('errore nella pagina: ' + x.message));
      const avvia = async () => {
        await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]');
        await p.waitForFunction(() => window.AGR && window.AGR.archivio && window.AGR.archivio().pubblici >= 1, null, { timeout: 20000 }).catch(() => {});
        await pausa(400);
      };
      const attivo = () => p.evaluate(() => { const a = document.activeElement; return a ? (a.id ? '#' + a.id : a.tagName.toLowerCase() + (a.getAttribute('data-az') ? '[data-az="' + a.getAttribute('data-az') + '"]' : '') + (a.className && typeof a.className === 'string' ? '.' + a.className.trim().split(/\s+/).join('.') : '')) : ''; });
      const dentro = sel => p.evaluate(q => { const b = document.querySelector(q); return !!(b && b.contains(document.activeElement)); }, sel);
      /* Tab finché il cursore arriva su un elemento che corrisponde (al più n volte) */
      const tabFino = async (sel, n = 80, dove = '') => {
        for (let i = 0; i < n; i++) {
          if (await p.evaluate(q => !!(document.activeElement && document.activeElement.matches(q)), sel)) return true;
          await p.keyboard.press('Tab'); conti.tab++;
        }
        err(`${dove}: con la sola tastiera non si arriva a ${sel}`); return false;
      };
      await fn({ p, ctx, avvia, attivo, dentro, tabFino });
    } finally { await browser.close(); }
  };

  const foglioAnnunciato = async (p, dove) => {
    const x = await p.evaluate(() => {
      const f = document.querySelector('#foglio-slot .foglio'); if (!f) return null;
      const id = f.getAttribute('aria-labelledby'), nome = id ? (document.getElementById(id) || {}).textContent : f.getAttribute('aria-label');
      return { ruolo: f.getAttribute('role'), modale: f.getAttribute('aria-modal'), nome: (nome || '').trim(), dentro: f.contains(document.activeElement) };
    });
    if (!x) { err(dove + ': il foglio non si apre'); return false; }
    if (x.ruolo !== 'dialog' || x.modale !== 'true' || !x.nome) err(`${dove}: il foglio non è una finestra annunciata con un nome (${JSON.stringify(x)})`);
    if (!x.dentro) err(dove + ': all\'apertura il cursore non entra nel foglio');
    return true;
  };
  const restaDentro = async (p, box, dove) => {
    for (const verso of ['Tab', 'Shift+Tab']) for (let i = 0; i < 30; i++) {
      await p.keyboard.press(verso);
      if (!(await p.evaluate(q => { const b = document.querySelector(q); return !!(b && b.contains(document.activeElement)); }, box))) { err(`${dove}: con ${verso} il cursore esce (dopo ${i + 1} passi)`); return; }
    }
  };

  try {
    /* ---------- 1-4. fogli, guida, struttura, contorno, nomi ---------- */
    await sessione({}, async ({ p, avvia, attivo, tabFino }) => {
      await avvia();
      const prova1 = async (comando, dove, dopo) => {
        await p.focus(comando); await p.keyboard.press('Enter'); await pausa(350);
        if (dopo) await dopo();
        if (!(await foglioAnnunciato(p, dove))) return;
        await restaDentro(p, '#foglio-slot .foglio', dove);
        await p.keyboard.press('Escape'); await pausa(300);
        const a = await attivo();
        if (await p.evaluate(() => !!document.querySelector('#foglio-slot .foglio'))) err(dove + ': Esc non chiude il foglio');
        else if (a !== comando) err(`${dove}: chiuso il foglio, il cursore non torna a ${comando} (è su ${a})`);
        conti.schermate++;
      };
      await prova1('#btnElenco', 'elenco');
      await prova1('#btnImpo', 'Impostazioni');
      await prova1('#btnCal', 'calendario');
      await prova1('#btnCerca', 'cerca');
      await prova1('#btnLegali', 'note legali');
      /* da un foglio all'altro: elenco → scheda; Esc chiude e il cursore torna al primo comando */
      await p.focus('#btnElenco'); await p.keyboard.press('Enter'); await pausa(350);
      if (await tabFino(`${F}[data-ev="${EV.id}"]`, 60, 'elenco')) {
        await p.keyboard.press('Enter'); await pausa(350);
        await foglioAnnunciato(p, 'scheda dell\'evento');
        await p.keyboard.press('Escape'); await pausa(300);
        if (await p.evaluate(() => !!document.querySelector('#foglio-slot .foglio'))) { await p.keyboard.press('Escape'); await pausa(300); }
        if ((await attivo()) !== '#btnElenco') err('elenco → scheda: chiusi i fogli, il cursore non torna all\'elenco (' + (await attivo()) + ')');
      }
      /* Impostazioni → note legali → Esc torna alle Impostazioni → Esc torna al tasto */
      await p.focus('#btnImpo'); await p.keyboard.press('Enter'); await pausa(350);
      if (await tabFino(`${F}.menu-r[data-legale="note-legali"]`, 60, 'Impostazioni')) {
        await p.keyboard.press('Enter'); await pausa(350);
        await p.keyboard.press('Escape'); await pausa(300);
        if (await p.evaluate(() => window.AGR.stato.foglio) !== 'impostazioni') err('Esc sulle note legali aperte dalle Impostazioni non torna alle Impostazioni');
        /* ridisegno: «Scuro» con Invio, il cursore resta sul tasto */
        if (await tabFino(`${F}[data-tema-set="dark"]`, 30, 'Impostazioni, Scuro')) {
          await p.keyboard.press('Enter'); await pausa(300);
          if (!(await p.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-tema-set') === 'dark'))) err('dopo «Scuro» il foglio si ridisegna e il cursore non resta sul tasto');
          await p.focus(`${F}[data-tema-set="light"]`); await p.keyboard.press('Enter'); await pausa(200);
        }
        await p.keyboard.press('Escape'); await pausa(300);
        if ((await attivo()) !== '#btnImpo') err('chiuse le Impostazioni, il cursore non torna al tasto (' + (await attivo()) + ')');
      }
      /* struttura */
      const str = await p.evaluate(() => ({ main: [...document.querySelectorAll('main,[role="main"]')].filter(x => x.offsetParent || x.getClientRects().length).length, header: !!document.querySelector('header'), nav: !!document.querySelector('nav') }));
      if (str.main !== 1 || !str.header || !str.nav) err('struttura della pagina: serve un solo contenuto principale visibile, l\'intestazione e la navigazione (' + JSON.stringify(str) + ')');
      /* contorno visibile: i comandi raggiunti con Tab dalla pagina, la mappa compresa */
      await p.evaluate(() => document.activeElement && document.activeElement.blur());
      let senza = [], mappa = false;
      for (let i = 0; i < 45; i++) {
        await p.keyboard.press('Tab');
        const x = await p.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return null; const c = getComputedStyle(a); return { el: a.id || a.className || a.tagName, w: parseFloat(c.outlineWidth) || 0, st: c.outlineStyle, ombra: c.boxShadow, canvas: a.classList.contains('maplibregl-canvas') }; });
        if (!x) continue;
        if (x.canvas) mappa = true;
        if ((x.st === 'none' || x.w < 2) && (!x.ombra || x.ombra === 'none')) senza.push(String(x.el).slice(0, 40));
      }
      if (senza.length) err('comandi senza contorno visibile con la tastiera: ' + [...new Set(senza)].join(', '));
      if (!mappa) e.note.push('la mappa non è stata raggiunta con Tab nei primi 45 passi');
    });

    /* guida alla prima apertura */
    await sessione({ dl_guida: null }, async ({ p, avvia }) => {
      await p.addInitScript(() => localStorage.removeItem('dl_guida'));
      await avvia(); await pausa(500);
      const g = await p.evaluate(() => { const d = document.querySelector('#guida-slot .guida'); return d ? { modale: d.getAttribute('aria-modal'), dentro: d.contains(document.activeElement) } : null; });
      if (!g) { e.note.push('guida non comparsa: controllo saltato'); return; }
      if (g.modale !== 'true' || !g.dentro) err('guida: deve essere una finestra modale con il cursore dentro (' + JSON.stringify(g) + ')');
      await restaDentro(p, '#guida-slot .guida', 'guida');
      await p.keyboard.press('Escape'); await pausa(300);
      if (await p.locator('#guida-slot .guida').count()) err('guida: Esc non la chiude');
    });

    /* nomi dei pulsanti fatti solo di un'icona, in inglese */
    await sessione({ dl_lingua: 'en' }, async ({ p, avvia }) => {
      await avvia();
      const raccogli = async dove => {
        const r = await p.evaluate(() => [...document.querySelectorAll('button,a[href],[role="button"],input[type="checkbox"],input[type="radio"]')].filter(x => (x.offsetParent || x.getClientRects().length) && !x.closest('[aria-hidden="true"]') && !(x.textContent || '').trim() && x.type !== 'checkbox' && x.type !== 'radio')
          .map(x => ({ el: (x.id || x.getAttribute('data-az') || x.className || x.tagName).toString().slice(0, 40), nome: (x.getAttribute('aria-label') || (x.getAttribute('aria-labelledby') && (document.getElementById(x.getAttribute('aria-labelledby')) || {}).textContent) || x.getAttribute('title') || '').trim() })));
        for (const x of r) {
          if (!x.nome) err(`${dove}: pulsante fatto solo di un'icona senza nome (${x.el})`);
          else if (TR.en[x.nome] && TR.en[x.nome] !== x.nome) err(`${dove}: il nome «${x.nome}» del pulsante ${x.el} non è tradotto in inglese`);
        }
      };
      await raccogli('mappa');
      for (const [c, d] of [['#btnElenco', 'elenco'], ['#btnImpo', 'impostazioni'], ['#btnCal', 'calendario'], ['#btnCerca', 'cerca']]) { await p.click(c); await pausa(350); await raccogli(d); await p.keyboard.press('Escape'); await pausa(250); }
    });

    /* ---------- 5. preferenze del telefono ---------- */
    const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
    await sessione({}, async ({ p, avvia }) => {
      await avvia();
      if (await p.evaluate(() => document.documentElement.getAttribute('data-theme')) !== 'dark') err('con il telefono in tema scuro e nessuna scelta salvata l\'app non è scura');
      if (await p.evaluate(() => localStorage.getItem('dl_tema'))) err('il tema del telefono non è una scelta: non si salva');
      const contrasti = [];
      for (const [c, d] of [[null, 'mappa'], ['#btnElenco', 'elenco'], ['#btnImpo', 'impostazioni'], ['#btnCal', 'calendario']]) {
        if (c) { await p.click(c); await pausa(400); }
        await p.addScriptTag({ content: axe });
        const v = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'rule', values: ['color-contrast'] }, resultTypes: ['violations'] })).violations.flatMap(x => x.nodes.map(n => n.target.join(' '))));
        for (const n of v) contrasti.push(d + ': ' + n);
        if (c) { await p.keyboard.press('Escape'); await pausa(250); }
      }
      if (contrasti.length) err('tema scuro, contrasti sotto 4,5:1: ' + contrasti.slice(0, 8).join('; '));
    }, { colorScheme: 'dark' });
    await sessione({}, async ({ p, avvia }) => {
      await p.emulateMedia({ reducedMotion: 'reduce' }); await avvia();
      await p.click('#btnElenco'); await pausa(100);
      const d = await p.evaluate(() => { const f = document.querySelector('#foglio-slot .foglio'); const c = f && getComputedStyle(f); return c ? parseFloat(c.animationDuration) : null; });
      if (d === null || d > 0.001) err('con «riduci animazioni» il foglio si anima ancora (' + d + ' s)');
    });
    await sessione({}, async ({ p, avvia }) => {
      await p.emulateMedia({ contrast: 'more' }); await avvia();
      await p.click('#btnElenco'); await pausa(300);
      const x = await p.evaluate(() => { const f = document.querySelector('#foglio-slot .foglio'); const c = getComputedStyle(f); return { fondo: c.backgroundColor, filtro: c.backdropFilter || c.webkitBackdropFilter }; });
      if (!/^rgb\(/.test(x.fondo) || (x.filtro && x.filtro !== 'none')) err('con «contrasto aumentato» il foglio sopra la mappa resta trasparente (' + JSON.stringify(x) + ')');
    });

    /* ---------- 6-7. misure dei pulsanti; testo ingrandito al doppio (320 punti) ---------- */
    const misura = async (p, dove) => {
      const r = await p.evaluate(() => [...document.querySelectorAll('button,a[href],input:not([type="hidden"]),select,textarea,[role="button"]')].filter(x => {
        if (!(x.offsetParent || x.getClientRects().length) || x.closest('[aria-hidden="true"]')) return false;
        if (x.closest('p,.attrib,.meta,li.testo,.legale-testo') && (x.tagName === 'A' || x.classList.contains('attrib-leg'))) return false;   // collegamenti dentro una riga di testo
        const l = (x.type === 'radio' || x.type === 'checkbox') && x.closest('label');   // la casella si tocca anche sulla sua etichetta
        const b = (l || x).getBoundingClientRect(); return b.width > 0 && (b.width < 24 || b.height < 24);
      }).map(x => { const b = x.getBoundingClientRect(); return (x.id || x.getAttribute('data-az') || x.className || x.tagName).toString().slice(0, 30) + ` ${Math.round(b.width)}×${Math.round(b.height)}`; }));
      conti.piccoli += r.length;
      if (r.length) err(`${dove}: comandi più piccoli di 24 punti: ${[...new Set(r)].slice(0, 8).join(', ')}`);
    };
    const reflow = async (p, dove) => {
      const x = await p.evaluate(() => {
        const w = window.innerWidth, sw = document.documentElement.scrollWidth, f = document.querySelector('#foglio-slot .foglio .corpo');
        const top = document.querySelector('.top');
        return { largo: sw > w + 1, foglio: f ? f.scrollWidth > f.clientWidth + 1 : false, barra: top.scrollWidth > top.clientWidth + 1 };
      });
      if (x.largo || x.foglio || x.barra) err(`${dove}, 320 punti: qualcosa esce dallo schermo (${JSON.stringify(x)})`);
    };
    for (const [vista, nome] of [[{ width: 393, height: 852 }, 'telefono'], [{ width: 320, height: 568 }, 'testo al doppio']]) {
      await sessione({}, async ({ p, avvia }) => {
        await avvia();
        const vp = await p.evaluate(() => (document.querySelector('meta[name="viewport"]') || {}).content || '');
        if (/maximum-scale|user-scalable\s*=\s*(no|0)/i.test(vp)) err('la pagina blocca lo zoom: ' + vp);
        const giro = async d => { if (nome === 'telefono') await misura(p, d); else await reflow(p, d); };
        await giro('mappa');
        for (const [c, d] of [['#btnElenco', 'elenco'], ['#btnImpo', 'impostazioni'], ['#btnCal', 'calendario'], ['#btnCerca', 'cerca'], ['#btnLegali', 'note legali']]) {
          await p.click(c); await pausa(350); await giro(d);
          if (d === 'elenco' && await p.locator(`${F}[data-ev="${EV.id}"]`).count()) { await p.click(`${F}[data-ev="${EV.id}"]`); await pausa(350); await giro('scheda'); if (await p.locator(`${F}[data-az="segnala"]`).count()) { await p.click(`${F}[data-az="segnala"]`); await pausa(400); await giro('segnala'); } }
          await p.keyboard.press('Escape'); await pausa(200); if (await p.locator(`${F}.foglio`).count()) { await p.keyboard.press('Escape'); await pausa(200); }
        }
        for (const sez of ['agora', 'temi']) { await p.click(`#navBassa [data-sez="${sez}"]`); await pausa(500); await giro(sez); }
      }, { viewport: vista });
    }

    /* ---------- 8. sola tastiera sui percorsi essenziali ---------- */
    await sessione({}, async ({ p, avvia, tabFino }) => {
      await avvia();
      await p.evaluate(() => document.activeElement && document.activeElement.blur());
      if (!(await tabFino('#btnElenco', 80, 'trovare un evento'))) return;
      await p.keyboard.press('Enter'); await pausa(350);
      if (!(await tabFino(`${F}[data-ev="${EV.id}"]`, 60, 'trovare un evento, nell\'elenco'))) return;
      await p.keyboard.press('Enter'); await pausa(350);
      if (await p.evaluate(() => window.AGR.stato.foglio) !== 'scheda') { err('aprire la scheda con Invio non riesce'); return; }
      if (await tabFino(`${F}[data-salva="${EV.id}"]`, 40, 'salvare nel calendario')) {
        await p.keyboard.press('Enter'); await pausa(300);
        const cal = await p.evaluate(id => JSON.parse(localStorage.getItem('dl_calendario') || '{}')[id], EV.id);
        if (!cal) err('salvare nel calendario con Invio non riesce');
      }
      if (await tabFino(`${F}[data-az="segnala"]`, 40, 'scrivere con «Segnala»')) {
        await p.keyboard.press('Enter'); await pausa(400);
        if (await tabFino(`${F}input[name="s-motivo"]`, 30, '«Segnala», motivo')) {
          await p.keyboard.press('Space'); await pausa(250);
          if (!(await p.evaluate(() => !!document.querySelector('#foglio-slot input[name="s-motivo"]:checked')))) err('«Segnala»: il motivo non si sceglie con la barra spaziatrice');
          if (await tabFino(`${F}#s-desc`, 20, '«Segnala», descrizione')) {
            await p.keyboard.type('Prova inventata con la sola tastiera.');
            await tabFino(`${F}#s-posta, ${F}[data-az="segnala-invia"]`, 20, '«Segnala», invio');
          }
        }
      }
      await p.keyboard.press('Escape'); await pausa(300); if (await p.locator(`${F}.foglio`).count()) { await p.keyboard.press('Escape'); await pausa(300); }
      /* cercare: il campo riceve il cursore */
      await p.focus('#btnCerca'); await p.keyboard.press('Enter'); await pausa(400);
      if (!(await p.evaluate(() => document.activeElement && document.activeElement.id === 'q'))) err('cercare: aperta la ricerca, il cursore non è nel campo');
    });
    e.note.push(`fogli e guida con il cursore trattenuto: ${conti.schermate} schermate; passi di Tab nei percorsi: ${conti.tab}; tema scuro, animazioni ridotte, contrasto aumentato; misure a 393 punti e testo al doppio a 320`);
  } finally { await s.chiudi(); }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
