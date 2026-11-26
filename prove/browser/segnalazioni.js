/* Prova nel browser: il modulo «Segnala» e la lettura delle segnalazioni (voci T-050, T-051 e T-052; documento:
   docs/segnalazioni.md).

   Le due app si aprono dallo stesso indirizzo, come sul collegamento di prova. Tutto è inventato: l'evento è uno solo,
   le segnalazioni sono quelle approvate il 26/11/2026.

   1. Nella scheda dell'evento c'è «Segnala», sotto il riquadro «Fonte:»; il modulo indica l'evento con il suo
      identificativo e ha i cinque motivi.
   2. Senza lo sportello di prova pronto il modulo prepara il messaggio di posta: non si apre senza motivo, né senza
      «Di chi è il nome?» con il nome da togliere; il messaggio va alla casella per gli utenti (oggi il segnaposto), con
      oggetto, identificativo dell'evento, motivo, risposta e descrizione. Dopo, il modulo lo dice e non tiene nulla.
   3. Consegnate le chiavi allo sportello di prova (app della redazione), il modulo dell'app pubblica usa lo sportello:
      l'email sbagliata si ferma; la segnalazione si chiude, il compito si risolve, la busta si deposita e il modulo
      dice «Segnalazione inviata». Sul telefono non resta nulla di ciò che si è scritto.
   4. Nell'app della redazione la segnalazione si legge, aperta sul dispositivo; con «Il mio» compare la scadenza delle 48
      ore. La riga del registro delle segnalazioni ha le colonne del cap. 25, il codice S e il codice P scritti a mano e
      nessun recapito; la riga del registro delle richieste ha il codice R e la scadenza; il recapito si copia a parte.
      «Togli questo nome ovunque» si apre con la richiesta già pronta (arrivo e codice R).
   5. «Presa in carico» chiede due tocchi, toglie la segnalazione dallo sportello e la conta nelle Misure.
   6. Se lo sportello non risponde, il modulo lo dice, tiene ciò che si è scritto e offre di riprovare o la posta. */
'use strict';
const { esito, eseguiDaSola } = require('../comune.js');
const { playwright, server, apri, pausa, archivio, eventoProva } = require('./comune.js');

const FRASE = 'una frase inventata per la prova';
const TUTTI = Object.fromEntries(['musica', 'arte', 'sport', 'sociale', 'cibo', 'teatro', 'cinema', 'conferenze', 'laboratori', 'manifestazioni', 'mercati', 'benessere', 'volontariato'].map(k => [k, { on: true }]));
const EV = eventoProva('segnalare', { titolo: 'Evento inventato da segnalare' });
/* le segnalazioni inventate approvate il 26/11/2026 */
const DESC_ANNULLATO = 'Prova: la fonte dice che l’evento è rinviato.';
const DESC_NOME = 'Prova: sono Persona di prova e chiedo di togliere il mio nome.';
const EMAIL = 'prova@esempio.invalid', NOME = 'Persona di prova';

async function prova() {
  const e = esito('Segnala: il modulo, lo sportello di prova e la lettura nella redazione (browser)');
  const pw = playwright();
  if (!pw) { e.saltata = true; e.note.push('Playwright non installato: npm ci in prove/ (su GitHub Actions gira sempre)'); return e; }
  const err = x => e.errori.push(x);
  const F = '#foglio-slot ';
  const s = await server('redazione'), { browser, ctx } = await apri(pw, { dl_guida: '1', dl_strati: TUTTI });
  try {
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(s.url).origin });
    await archivio(ctx, [EV]);
    const p = await ctx.newPage(), pp = await ctx.newPage();
    for (const [x, n] of [[p, 'redazione'], [pp, 'pubblica']]) x.on('pageerror', y => err('errore nella pagina (' + n + '): ' + y.message));
    const tocca = async (pg, sel, dove) => { const l = pg.locator(sel).first();
      try { await l.waitFor({ timeout: 15000 }); await l.click({ timeout: 15000 }); } catch (x) { err(`${dove}: non riesco a toccare ${sel}`); return false; } await pausa(300); return true; };
    const aspetta = async (pg, re, dove) => { try { await pg.waitForFunction(r => new RegExp(r, 'i').test((document.querySelector('#foglio-slot') || {}).innerText || ''), re.source, { timeout: 25000 }); return true; }
      catch (x) { err(dove + ': atteso «' + re.source + '», c\'è «' + ((await pg.locator(F).innerText().catch(() => '')) || '').replace(/\s+/g, ' ').slice(0, 300) + '»'); return false; } };
    const appunti = pg => pg.evaluate(() => navigator.clipboard.readText()).catch(() => '');
    /* nulla di ciò che si è scritto resta nella memoria del telefono */
    const memoriaPulita = async (pg, dove, testi) => {
      const tutto = await pg.evaluate(async () => {
        const m = JSON.stringify(Object.assign({}, localStorage)) + JSON.stringify(Object.assign({}, sessionStorage));
        let c = ''; for (const n of await caches.keys()) { if (n === 'prova_sportello' || /prova_sportello/.test(n)) continue; for (const r of await (await caches.open(n)).keys()) c += r.url; }
        return m + c;
      });
      for (const t of testi) if (tutto.includes(t)) err(dove + ': nella memoria del telefono resta «' + t + '»');
    };
    const apriEvento = async () => {
      await pp.goto(s.url.replace('/dist/redazione/', '/dist/pubblica/') + 'index.html'); await pp.waitForSelector('[data-az="elenco"]');
      await pp.waitForFunction(() => window.AGR && window.AGR.archivio && window.AGR.archivio().pubblici >= 1, null, { timeout: 20000 }).catch(() => {});
      if (!(await tocca(pp, '[data-az="elenco"]', 'elenco') && await tocca(pp, F + `[data-ev="${EV.id}"]`, 'evento'))) return false;
      /* «Segnala» sta sotto il riquadro «Fonte:» (nota del 21/11/2026) */
      const sotto = await pp.evaluate(() => { const f = document.querySelector('#foglio-slot .fonte'), b = document.querySelector('#foglio-slot [data-az="segnala"]');
        return !!f && !!b && !!(f.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) && b.getBoundingClientRect().top >= f.getBoundingClientRect().bottom - 1; });
      if (!sotto) err('«Segnala» deve stare sotto il riquadro «Fonte:» della scheda');
      return await tocca(pp, F + '[data-az="segnala"]', 'Segnala');
    };
    const scegli = (k, v) => tocca(pp, F + `label:has([data-segn-scelta="${k}"][value="${v}"])`, 'scelta ' + k + ' ' + v);

    /* 1 e 2: la posta */
    if (await apriEvento()) {
      await aspetta(pp, /Segnala questo evento[\s\S]*Evento inventato da segnalare[\s\S]*Codice dell’evento: segnalareaaaaaaa-provaaaa/, 'modulo');
      const motivi = await pp.locator(F + '[data-segn-scelta="motivo"]').count();
      if (motivi !== 5) err('il modulo deve avere i cinque motivi del libro mastro, ne ha ' + motivi);
      try { await pp.waitForSelector(F + '#s-posta', { timeout: 15000 }); } catch (x) { err('senza lo sportello di prova pronto il modulo deve preparare il messaggio di posta'); }
      if (await pp.locator(F + '#s-email').count()) err('con la posta il campo dell\'email non serve: l\'indirizzo è quello da cui si scrive');
      await pp.evaluate(() => document.addEventListener('click', ev => { if (ev.target.closest && ev.target.closest('[data-segn-posta]')) ev.preventDefault(); }, true));   // la prova non apre davvero l'app di posta
      await tocca(pp, F + '#s-posta', 'posta senza motivo'); await aspetta(pp, /Scegli un motivo\./, 'posta senza motivo');
      await scegli('motivo', 'nome'); await aspetta(pp, /Di chi è il nome\?/, 'domanda sul nome');
      await pp.fill('#s-desc', DESC_NOME); await pp.fill('#s-nome', NOME);
      await tocca(pp, F + '#s-posta', 'posta senza «Di chi è il nome?»'); await aspetta(pp, /Scegli di chi è il nome\./, 'posta senza «Di chi è il nome?»');
      await scegli('chi', 'mio');
      const href = await pp.getAttribute(F + '#s-posta', 'href').catch(() => '') || '';
      const [dest, resto] = href.replace(/^mailto:/, '').split('?'), q = new URLSearchParams((resto || '').replace(/\+/g, '%2B'));
      const corpo = q.get('body') || '';
      if (decodeURIComponent(dest || '') !== '[casella di contatto]' || q.get('subject') !== 'Segnalazione: Evento inventato da segnalare') err('messaggio di posta: destinatario o oggetto inattesi: ' + href.slice(0, 160));
      for (const atteso of ['Codice dell’evento: ' + EV.id, 'Motivo: Nome o altro dato personale da togliere', 'Di chi è il nome: Il mio', 'Descrizione:\r\n' + DESC_NOME, 'Nome: ' + NOME])
        if (!corpo.includes(atteso)) err('messaggio di posta: manca «' + atteso.replace(/\r\n/g, ' ') + '»');
      await tocca(pp, F + '#s-posta', 'prepara il messaggio');
      await aspetta(pp, /Si è aperta la tua app di posta con il messaggio pronto/, 'dopo il messaggio di posta');
      if (await pp.locator(F + '#s-desc').count()) err('dopo il messaggio di posta il modulo non deve tenere ciò che si è scritto');
      await memoriaPulita(pp, 'posta', [DESC_NOME, NOME]);
    }

    /* 3: le chiavi allo sportello di prova, poi lo sportello */
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(400);
    if (!(await tocca(p, '#badgeRed', 'strumenti')) || !(await tocca(p, F + '[data-az="chiavi"]', 'chiavi'))) return e;
    await p.fill('#ch-nome', 'Portatile di prova'); await p.fill('#ch-frase', FRASE); await p.fill('#ch-ripeti', FRASE);
    await tocca(p, F + '[data-az="chiavi-crea"]', 'chiavi, crea');
    try { await p.waitForSelector(F + '[data-az="chiavi-copia"]', { timeout: 20000 }); } catch (x) { err('le chiavi non si creano'); return e; }
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(300);
    await tocca(p, '#badgeRed', 'strumenti'); await tocca(p, F + '[data-az="pubblica"]', 'pubblicazione');
    await tocca(p, F + '[data-az="pb-consegna"]', 'consegna delle chiavi');
    await aspetta(p, /accetta la firma di questo dispositivo/, 'chiavi consegnate');

    if (await apriEvento()) {
      try { await pp.waitForSelector(F + '[data-az="segnala-invia"]', { timeout: 15000 }); } catch (x) { err('con lo sportello di prova pronto il modulo deve offrire «Invia la segnalazione»'); }
      await scegli('motivo', 'nome'); await scegli('chi', 'mio');
      await pp.fill('#s-desc', DESC_NOME); await pp.fill('#s-email', 'prova@'); await pp.fill('#s-nome', NOME);
      await tocca(pp, F + '[data-az="segnala-invia"]', 'invia con l\'email sbagliata'); await aspetta(pp, /Controlla l’indirizzo email\./, 'email sbagliata');
      await pp.fill('#s-email', EMAIL);
      const t0 = Date.now();
      await tocca(pp, F + '[data-az="segnala-invia"]', 'invia');
      if (await aspetta(pp, /Segnalazione inviata\. Se hai lasciato un indirizzo email, riceverai una conferma\./, 'invio')) e.note.push('invio con lucchetto, busta e compito: ' + (Date.now() - t0) + ' ms');
      if (await pp.locator(F + '#s-desc, ' + F + '#s-email').count()) err('dopo l\'invio il modulo non deve tenere ciò che si è scritto');
      await memoriaPulita(pp, 'sportello', [DESC_NOME, EMAIL, NOME]);
    }

    /* 4: la lettura nella redazione */
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(300);
    await tocca(p, '#badgeRed', 'strumenti'); await tocca(p, F + '[data-az="segnalazioni"]', 'segnalazioni');
    if (await aspetta(p, /Evento inventato da segnalare[\s\S]*Nome o dato personale da togliere[\s\S]*il suo nome: entro il/, 'elenco delle segnalazioni')
      && await tocca(p, F + '[data-az="sg-apri"]', 'apri la segnalazione')) {
      await aspetta(p, /Chiede di togliere il suo nome: entro il[\s\S]*Prova: sono Persona di prova/, 'segnalazione aperta');
      await p.fill('#sg-s', 'S-0001'); await p.fill('#sg-p', 'P-0001'); await p.fill('#sg-r', 'R-0001');
      await tocca(p, F + '[data-che="segnalazione"]', 'copia la riga'); await pausa(300);
      const riga = (await appunti(p)).split('\t');
      if (riga.length !== 30 || riga[0] !== 'S-0001' || riga[4] !== 'Modulo con lo sportello' || riga[5] !== 'Persona nominata' || riga[6] !== 'P-0001' || riga[7] !== EV.id || riga[8] !== 'Nome o dato personale da togliere' || riga[12] !== 'R-0001')
        err('riga del registro delle segnalazioni inattesa: ' + JSON.stringify(riga).slice(0, 400));
      if (riga.join('\t').includes(EMAIL)) err('la riga del registro delle segnalazioni non deve contenere il recapito');
      await tocca(p, F + '[data-che="richiesta"]', 'copia la riga delle richieste'); await pausa(300);
      const rich = (await appunti(p)).split('\t');
      if (rich.length !== 25 || rich[0] !== 'R-0001' || rich[5] !== 'P-0001' || rich[6] !== 'Sé stesso' || !/^\d\d\/\d\d\/\d{4} \d\d:\d\d$/.test(rich[10] || '') || rich.join('\t').includes(EMAIL))
        err('riga del registro delle richieste inattesa: ' + JSON.stringify(rich).slice(0, 400));
      await tocca(p, F + '[data-che="recapito"]', 'copia il recapito'); await pausa(300);
      if ((await appunti(p)) !== NOME + ' <' + EMAIL + '>') err('il recapito copiato non è quello atteso: «' + (await appunti(p)) + '»');
      if (await tocca(p, F + '[data-az="sg-togli"]', 'togli questo nome ovunque')) {
        await aspetta(p, /Togli questo nome ovunque[\s\S]*Dalla segnalazione S-0001 sull’evento «Evento inventato da segnalare»/, 'togli questo nome ovunque');
        if ((await p.inputValue('#tn-r').catch(() => '')) !== 'R-0001' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(await p.inputValue('#tn-ric').catch(() => ''))) err('«Togli questo nome ovunque» non si apre con la richiesta già pronta (arrivo e codice R)');
      }
    }

    /* 5: la presa in carico */
    await p.goto(s.url + 'index.html'); await p.waitForSelector('[data-az="elenco"]'); await pausa(300);
    await tocca(p, '#badgeRed', 'strumenti'); await tocca(p, F + '[data-az="segnalazioni"]', 'segnalazioni');
    if (await tocca(p, F + '[data-az="sg-apri"]', 'apri la segnalazione')) {
      await tocca(p, F + '[data-az="sg-presa"]', 'presa in carico'); await aspetta(p, /Tocca ancora: la segnalazione esce dallo sportello/, 'presa in carico, primo tocco');
      await tocca(p, F + '[data-az="sg-presa"]', 'presa in carico, secondo tocco');
      await aspetta(p, /Segnalazione presa in carico e tolta dallo sportello/, 'presa in carico');
      await tocca(p, F + '[data-az="sg-carica"]', 'chiedi di nuovo');
      await aspetta(p, /Nessuna segnalazione in attesa\./, 'dopo la presa in carico');
      const conto = await p.evaluate(() => { try { const m = JSON.parse(localStorage.getItem('red_misure') || '{}'); return Object.values(m.segnalazioni || {}).reduce((a, b) => a + b, 0); } catch (x) { return -1; } });
      if (conto !== 1) err('la segnalazione presa in carico deve contare nelle Misure: conto ' + conto);
    }

    /* 6: lo sportello che non risponde (qui: l'archivio finto cancellato dopo l'apertura del modulo) */
    if (await apriEvento()) {
      try { await pp.waitForSelector(F + '[data-az="segnala-invia"]', { timeout: 15000 }); } catch (x) { err('sportello che non risponde: il modulo doveva partire con lo sportello di prova'); }
      await pp.evaluate(() => caches.delete('prova_sportello'));
      await scegli('motivo', 'annullato'); await pp.fill('#s-desc', DESC_ANNULLATO);
      await tocca(pp, F + '[data-az="segnala-invia"]', 'invia con lo sportello che non risponde');
      await aspetta(pp, /Non riesco a inviare la segnalazione\. Controlla la connessione e riprova, oppure mandala per posta\./, 'sportello che non risponde');
      if (!(await pp.locator(F + '[data-az="segnala-invia"]').count()) || !(await pp.locator(F + '#s-posta').count())) err('sportello che non risponde: restano da offrire «Invia la segnalazione» e la posta');
      if ((await pp.inputValue('#s-desc').catch(() => '')) !== DESC_ANNULLATO) err('sportello che non risponde: ciò che si è scritto deve restare nel modulo, per riprovare');
    }
  } catch (x) { err('la prova si è interrotta: ' + (x && x.message || x)); }
  finally { await browser.close(); await s.chiudi(); }
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
