/* Lo sportello delle segnalazioni (voce T-051 del piano di adeguamento; documento: docs/segnalazioni.md).

   Libro mastro, § 7.5, misura 3, strada a (scelta il 12/11/2026): il modulo «Segnala» chiude la segnalazione sul
   telefono con la chiave pubblica di cifratura della Redazione e la manda a questo piccolo programma, che la deposita
   nello spazio riservato; il programma limita gli invii senza conservare gli indirizzi e non aggiunge identificativi.
   Regola 4: nessun identificativo del telefono, nessun indirizzo IP registrato. Strada b (il messaggio di posta già
   compilato) resta il ponte finché lo sportello non è allacciato e provato (T-065, T-071).

   Lo sportello ha due porte.
   - La porta aperta, per chiunque, senza firma: «lucchetto» dà la parte pubblica di cifratura della Redazione e il
     piccolo compito; «deposita» riceve la busta chiusa con il compito risolto. Il lucchetto lo prende dall'elenco delle
     chiavi ammesse (riservato/chiavi.json), lo stesso dello sportello di pubblicazione: lo scrive il Responsabile
     infrastruttura con il file delle parti pubbliche della schermata «Chiavi», che contiene già la parte di cifratura
     (decisione del 26/11/2026, dubbio 1). Nel codice e nel repository non c'è nessuna chiave.
   - La porta firmata, per i soli dispositivi della Redazione, con il pacchetto firmato di sorgenti/moduli/pacchetto.js
     e le stesse regole dello sportello di pubblicazione (decisione del 23/11/2026: cinque minuti; cinque firme sbagliate
     in un quarto d'ora fermano quel dispositivo per quindici minuti; gli estranei sono rifiutati subito):
     «segnalazioni» restituisce le buste depositate, chiuse; «presa» toglie quelle prese in carico (decisione del
     26/11/2026, dubbio 8: dopo la presa in carico nello sportello non resta traccia).

   Il limite (decisione del 26/11/2026, dubbio 4): uguale per tutti, contato su tutte le segnalazioni insieme, senza sapere
   chi le manda: al più 20 in un'ora e 100 in un giorno, al più 300 in attesa di essere lette; ogni busta al più di
   24.000 caratteri (la descrizione al più di 2.000). In più il piccolo compito (sorgenti/moduli/segnalazione.js) con
   16 bit a zero: circa sessantamila tentativi, una frazione di secondo su un computer, uno o due secondi su un telefono.
   L'ora del compito la dà lo sportello con il lucchetto e vale dieci minuti; un compito già usato si rifiuta. Il limite
   per indirizzo, se serve, è una regola della zona di Bunny (T-064, T-071), che gli indirizzi li tratta già come
   responsabile: questo programma non li legge e non li conserva.

   Qui c'è soltanto la logica, uguale dovunque giri: su Bunny la avvolge sportelli/bunny-segnalazioni.js (Fase 2,
   T-065); in Fase 1 gira dentro il browser, nello sportello di prova (sul collegamento di prova l'app pubblica deposita,
   l'app della redazione legge), con lo stesso archivio finto dello sportello di pubblicazione. Chi la avvolge le dà
   deposito {leggi, scrivi, togli, elenca}, ora, cripto e, per la porta firmata, pacchetto (nell'app pubblica manca:
   lì serve solo la porta aperta).

   Nel browser si trova in window.AGR_MODULI.segnalazioniSportello (dopo segnalazione.js); in Node con require(). */
(function (radice, fabbrica) {
  const nodo = typeof module === 'object' && module.exports && typeof require === 'function';
  const M = nodo ? { segnalazione: require('../sorgenti/moduli/segnalazione.js'), pacchetto: require('../sorgenti/moduli/pacchetto.js') } : (radice.AGR_MODULI || {});
  const m = fabbrica(M.segnalazione, M.pacchetto, radice);
  if (nodo) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).segnalazioniSportello = m;
})(typeof self !== 'undefined' ? self : this, function (S, P0, radice) {
  'use strict';
  if (!S) throw new Error('sportello delle segnalazioni: serve prima segnalazione.js');

  const VERSIONE = 1;
  const LIMITI = { ora: 20, giorno: 100, attesa: 300, bit: 16 };
  const ORA_MS = 36e5, GIORNO_MS = 864e5;
  const COMPITO_MS = 10 * 6e4;            // l'ora del compito vale dieci minuti
  const TENTATIVI = 5, QUARTO_MS = 15 * 6e4, FERMO_MS = 15 * 6e4;   // come lo sportello di pubblicazione
  const MAX_APERTA = 32000;               // una richiesta alla porta aperta più lunga non si legge nemmeno
  const PRE = 'riservato/segnalazioni/';
  const F = { chiavi: 'riservato/chiavi.json', arrivate: PRE + 'arrivate/', conti: PRE + 'conti.json', compiti: PRE + 'compiti.json', visti: PRE + 'visti.json', tentativi: PRE + 'tentativi.json' };
  const TIPO_ARRIVATA = 'segnalazione-arrivata';
  const NOME = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[0-9a-f]{8}$/;
  const PUBBLICA = /^[A-Za-z0-9_-]{80,100}$/;
  const iso = ms => new Date(ms).toISOString();

  function crea(o) {
    const dep = o.deposito, ora = o.ora || (() => Date.now()), P = o.pacchetto || P0 || null;
    const cripto = o.cripto || radice.crypto || (typeof globalThis === 'object' ? globalThis.crypto : null);
    const L = Object.assign({}, LIMITI, o.limiti || {});
    if (!dep) throw new Error('sportello delle segnalazioni: manca il deposito');
    async function leggiJson(p, d) { const t = await dep.leggi(p); if (t == null) return d; try { return JSON.parse(t); } catch (e) { return d; } }
    const scriviJson = (p, v) => dep.scrivi(p, JSON.stringify(v));
    const risposta = (stato, corpo) => ({ stato, corpo: Object.assign({ sportello: 'segnalazioni', v: VERSIONE, ora: iso(ora()) }, corpo) });
    const no = (stato, motivo, extra) => risposta(stato, Object.assign({ esito: 'rifiutato', motivo }, extra || {}));

    /* il lucchetto: la parte pubblica di cifratura delle chiavi ammesse (è la stessa per tutti i dispositivi; si prende la
       più recente), mai di una firma revocata */
    async function lucchetto() {
      const k = await leggiJson(F.chiavi, {}), revocate = new Set((k.revocate || []).map(x => x.impronta));
      const ok = (k.ammesse || []).filter(x => !revocate.has(x.impronta) && x.cifratura && typeof x.cifratura.pubblica === 'string' && PUBBLICA.test(x.cifratura.pubblica));
      ok.sort((a, b) => String(a.dal || '').localeCompare(String(b.dal || '')));
      const u = ok[ok.length - 1];
      return u ? { pubblica: u.cifratura.pubblica, impronta: u.cifratura.impronta || '' } : null;
    }

    /* ---------- La porta aperta ---------- */
    async function aperta(r, t) {
      if (r.operazione === 'lucchetto') {
        const l = await lucchetto();
        if (!l) return no(503, 'chiuso');
        return risposta(200, { esito: 'fatto', lucchetto: l, compito: { quando: iso(t), bit: L.bit } });
      }
      if (r.operazione !== 'deposita' || Object.keys(r).some(k => !['porta', 'operazione', 'busta', 'compito'].includes(k))) return no(400, 'forma');
      const b = r.busta, c = r.compito;
      if (!S.bustaValida(b) || !c || typeof c !== 'object' || Object.keys(c).some(k => k !== 'quando' && k !== 'n')) return no(400, 'forma');
      const q = Date.parse(c.quando);
      if (typeof c.quando !== 'string' || !Number.isFinite(q) || Math.abs(t - q) > COMPITO_MS) return no(400, 'tempo');
      if (!S.verificaCompito(b, c, L.bit)) return no(400, 'compito');
      /* un compito risolto vale una volta sola: si tiene l'impronta della busta per il tempo in cui l'ora del compito vale */
      const compiti = await leggiJson(F.compiti, {}), imp = S.improntaBusta(b);
      for (const x of Object.keys(compiti)) if (!(compiti[x] > t - 2 * COMPITO_MS)) delete compiti[x];
      if (compiti[imp]) return no(409, 'ripetuto');
      /* il limite uguale per tutti: soltanto gli istanti di arrivo dell'ultimo giorno, di nessuno in particolare */
      const conti = await leggiJson(F.conti, {}), arrivi = (Array.isArray(conti.arrivi) ? conti.arrivi : []).filter(x => typeof x === 'number' && x > t - GIORNO_MS);
      if (arrivi.filter(x => x > t - ORA_MS).length >= L.ora || arrivi.length >= L.giorno) return no(429, 'troppe');
      if ((await dep.elenca(F.arrivate)).length >= L.attesa) return no(429, 'troppe');
      const casuale = Array.from(cripto.getRandomValues(new Uint8Array(4)), x => x.toString(16).padStart(2, '0')).join('');
      const nome = iso(t).replace(/[:.]/g, '-') + '-' + casuale;
      await scriviJson(F.arrivate + nome + '.json', { tipo: TIPO_ARRIVATA, v: VERSIONE, nome, arrivo: iso(t), busta: b });
      compiti[imp] = t; await scriviJson(F.compiti, compiti);
      arrivi.push(t); await scriviJson(F.conti, { arrivi });
      return risposta(200, { esito: 'fatto' });
    }

    /* ---------- La porta firmata: solo i dispositivi della Redazione ---------- */
    const OPERA = {
      async segnalazioni() {
        const nomi = (await dep.elenca(F.arrivate)).map(x => x.slice(F.arrivate.length).replace(/\.json$/, '')).filter(n => NOME.test(n)).sort();
        const lista = [];
        for (const n of nomi.slice(0, L.attesa)) {
          const x = await leggiJson(F.arrivate + n + '.json', null);
          if (x && x.tipo === TIPO_ARRIVATA && x.nome === n && S.bustaValida(x.busta)) lista.push({ nome: n, arrivo: x.arrivo, busta: x.busta });
        }
        return { segnalazioni: lista };
      },
      async presa(c) {
        if (!Array.isArray(c.nomi) || !c.nomi.length || c.nomi.length > L.attesa || c.nomi.some(n => typeof n !== 'string' || !NOME.test(n))) throw Object.assign(new Error('presa'), { rifiuto: { motivo: 'presa' } });
        const tolte = [];
        for (const n of c.nomi) if ((await dep.leggi(F.arrivate + n + '.json')) != null) { await dep.togli(F.arrivate + n + '.json'); tolte.push(n); }
        return { tolte };
      }
    };
    async function firmata(testo, t) {
      if (!P) return no(400, 'forma');
      let letto; try { letto = P.leggi(testo); } catch (e) { return no(400, 'forma'); }
      const p = letto.pacchetto, c = letto.contenuto, imp = p.dispositivo.impronta;
      if (!OPERA[c.operazione]) return no(400, 'operazione');
      const chiavi = await leggiJson(F.chiavi, {});
      if ((chiavi.revocate || []).some(k => k.impronta === imp)) return no(403, 'revocata');
      const nota = (chiavi.ammesse || []).find(k => k.impronta === imp);
      if (!nota) return no(403, 'sconosciuto');
      const tentativi = await leggiJson(F.tentativi, {}), mio = tentativi[imp] || { errori: [] };
      if (mio.fermo_fino > t) return no(429, 'fermo', { fino: iso(mio.fermo_fino) });
      if (!(await P.verifica(p, nota.pubblica, cripto))) {
        mio.errori = (mio.errori || []).filter(x => x > t - QUARTO_MS).concat([t]);
        const fermo = mio.errori.length >= TENTATIVI;
        if (fermo) { mio.fermo_fino = t + FERMO_MS; mio.errori = []; }
        tentativi[imp] = mio; await scriviJson(F.tentativi, tentativi);
        return fermo ? no(429, 'fermo', { fino: iso(mio.fermo_fino) }) : no(401, 'firma');
      }
      if (Math.abs(t - Date.parse(p.quando)) > P.FINESTRA_MS) return no(400, 'tempo');
      const visti = await leggiJson(F.visti, {});
      for (const k of Object.keys(visti)) if (!(visti[k] > t - 2 * P.FINESTRA_MS)) delete visti[k];
      if (visti[p.numero]) return no(409, 'ripetuto');
      visti[p.numero] = t; await scriviJson(F.visti, visti);
      try { return risposta(200, Object.assign({ esito: 'fatto', operazione: c.operazione }, await OPERA[c.operazione](c))); }
      catch (e) { if (e && e.rifiuto) return risposta(422, Object.assign({ esito: 'rifiutato' }, e.rifiuto)); throw e; }
    }

    /* ---------- Una richiesta alla volta ---------- */
    async function tratta(testo) {
      const t = ora();
      if (typeof testo !== 'string') return no(400, 'forma');
      let r = null;
      if (testo.length <= MAX_APERTA) { try { r = JSON.parse(testo); } catch (e) { return no(400, 'forma'); } }
      if (r && typeof r === 'object' && !Array.isArray(r) && r.porta === 'aperta') return aperta(r, t);
      return firmata(testo, t);
    }
    let coda = Promise.resolve();
    /* ricevi(testo della richiesta) → {stato, corpo}, come lo sportello di pubblicazione */
    function ricevi(testo) {
      const r = coda.then(() => tratta(testo));
      coda = r.catch(() => {});
      return r.catch(() => risposta(500, { esito: 'rifiutato', motivo: 'guasto' }));
    }
    return { ricevi, lucchetto };
  }

  return { VERSIONE, LIMITI, COMPITO_MS, PRE, NOME, crea };
});
