/* Lo sportello di pubblicazione (voci T-038, T-039 e T-040 del piano di adeguamento; documento:
   docs/sportello-pubblicazione.md).

   Libro mastro, § 2.4 («La pubblicazione firmata», «Lo storico e le copie di sicurezza»): gli eventi si scrivono
   nell'archivio da una sola porta, questo programma, che accetta un pacchetto soltanto se porta la firma della
   Redazione; rifiuta i pacchetti fuori dalla finestra di tempo o già ricevuti; dopo pochi tentativi errati smette di
   rispondere per un tempo; se la firma è valida scrive gli eventi (quadranti e indice), salva una copia datata nello
   storico e fa aggiornare la rete di consegna. § 3.11; § 3.13 (rettifica, limitazione); § 5.2; § 7.5.

   Qui c'è soltanto la logica, uguale dovunque giri: su Bunny la avvolge sportelli/bunny-pubblicazione.js (Fase 2,
   T-065); in Fase 1 la stessa logica gira dentro il browser, nello «sportello di prova» dell'app della redazione
   (sorgenti/redazione/sportello-prova.js), con un archivio finto. Chi la avvolge le dà:

   - deposito: {leggi(percorso) → testo o null, scrivi(percorso, testo), togli(percorso), elenca(prefisso) → percorsi}.
     I percorsi che cominciano con «pubblico/» sono l'archivio che i telefoni leggono (indice.json e quadranti/); quelli
     che cominciano con «riservato/» non sono pubblici: le chiavi autorizzate, l'elenco completo degli eventi con quelli
     sospesi, lo storico, i numeri già ricevuti e i tentativi errati;
   - ora: l'orologio; cripto: gli strumenti di cifratura; regioni: i confini per i numeri per regione; vocabolario:
     strati e temi dell'app; svuota(percorsi): fa aggiornare la rete di consegna (facoltativa).

   Lo sportello riceve soltanto il testo del pacchetto: non vede e non conserva l'indirizzo di chi lo manda. I tentativi
   errati si contano per dispositivo della Redazione (decisione del 23/11/2026): chi non è un dispositivo autorizzato è
   rifiutato subito, sempre, e non può chiudere la porta agli altri.

   Le chiavi autorizzate non arrivano mai con un pacchetto: stanno in riservato/chiavi.json, che su Bunny scrive il
   Responsabile infrastruttura con i file della schermata «Chiavi» (le parti pubbliche, l'avviso di revoca); nello
   sportello di prova lo scrivono i comandi «autorizza» e «revoca» qui sotto.

   Nel browser si trova in window.AGR_MODULI.sportello (dopo eventi.js, quadranti.js e pacchetto.js); in Node con require(). */
(function (radice, fabbrica) {
  const nodo = typeof module === 'object' && module.exports && typeof require === 'function';
  const M = nodo ? { eventi: require('../sorgenti/moduli/eventi.js'), quadranti: require('../sorgenti/moduli/quadranti.js'), pacchetto: require('../sorgenti/moduli/pacchetto.js') } : (radice.AGR_MODULI || {});
  const m = fabbrica(M.eventi, M.quadranti, M.pacchetto, radice);
  if (nodo) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).sportello = m;
})(typeof self !== 'undefined' ? self : this, function (E, Q, P, radice) {
  'use strict';
  if (!E || !Q || !P) throw new Error('sportello: servono prima eventi.js, quadranti.js e pacchetto.js');

  const VERSIONE = 1;
  const TENTATIVI = 5;                    // firme sbagliate, a nome dello stesso dispositivo…
  const QUARTO_MS = 15 * 6e4;             // …in un quarto d'ora…
  const FERMO_MS = 15 * 6e4;              // …e lo sportello non risponde a quel dispositivo per un quarto d'ora
  const MAX_EVENTI = 2000;                // eventi in un solo pacchetto
  const CINQUE_ANNI_MS = 5 * 365.25 * 864e5;   // § 3.14: lo storico si conserva cinque anni (si controlla nel riesame)
  /* I motivi del ritiro prima della fine (cap. 22, colonna «Ritiro prima della fine»; §§ 5.2 e 7.5). */
  const MOTIVI = ['annullato', 'errore', 'esclusione', 'richiesta', 'segnalazione', 'ordine'];
  const PUB = 'pubblico/', RIS = 'riservato/';
  const F = { chiavi: RIS + 'chiavi.json', stato: RIS + 'stato.json', visti: RIS + 'visti.json', tentativi: RIS + 'tentativi.json',
    elenco: RIS + 'storico/elenco.json', copie: RIS + 'storico/copie/' };
  const TIPO_COPIA = 'copia-pubblicazione', TIPO_PUBBLICHE = 'chiavi-pubbliche-redazione', TIPO_REVOCA = 'revoca-chiave-redazione';
  const NOME_COPIA = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[0-9a-f]{8}$/;
  const RIGA = /^[^\u0000-\u001F\u007F-\u009F]*$/;

  const iso = ms => new Date(ms).toISOString();
  function rifiuto(motivo, extra) { const e = new Error('sportello: ' + motivo); e.rifiuto = Object.assign({ motivo }, extra || {}); return e; }
  const corto = x => (typeof x === 'string' ? x : String(x)).slice(0, 40);

  function crea(o) {
    const dep = o.deposito, ora = o.ora || (() => Date.now()), cripto = o.cripto || radice.crypto || (typeof globalThis === 'object' ? globalThis.crypto : null);
    const regioni = o.regioni || [], opzEv = o.vocabolario ? { vocabolario: o.vocabolario } : undefined;
    if (!dep) throw new Error('sportello: manca il deposito');

    async function leggiJson(p, d) { const t = await dep.leggi(p); if (t == null) return d; try { return JSON.parse(t); } catch (e) { return d; } }
    const scriviJson = (p, v) => dep.scrivi(p, JSON.stringify(v));
    const risposta = (stato, corpo) => ({ stato, corpo: Object.assign({ sportello: 'pubblicazione', v: VERSIONE, ora: iso(ora()) }, corpo) });

    /* ---------- L'elenco completo degli eventi (riservato): pubblicati e sospesi, senza quelli già usciti ---------- */
    async function statoVivo(t) {
      const s = await leggiJson(F.stato, null) || {};
      const vivo = ev => E.uscitaMs(ev) > t, tutti = (s.eventi || []).concat(s.sospesi || []);
      const eventi = (s.eventi || []).filter(vivo), sospesi = (s.sospesi || []).filter(vivo);
      return { eventi, sospesi, usciti: tutti.length - eventi.length - sospesi.length, aggiornato: s.aggiornato || null };
    }
    /* Ogni evento passa dallo stesso controllo dell'app (sorgenti/moduli/eventi.js): se uno solo non lo supera, il
       pacchetto si rifiuta intero e non si scrive nulla. */
    function controllaEventi(lista) {
      const dettagli = [], visti = new Set();
      for (const ev of lista) {
        const err = E.controlla(ev, opzEv);
        if (!err.length && !Q.quadrante(ev.lat, ev.lng)) err.push('fuori dalla griglia');
        if (!err.length && visti.has(ev.id)) err.push('identificativo ripetuto');
        if (!err.length) visti.add(ev.id);
        else dettagli.push({ id: ev && typeof ev.id === 'string' ? corto(ev.id) : null, errori: err.slice(0, 5).map(x => String(x).slice(0, 200)) });
      }
      if (dettagli.length) throw rifiuto('evento', { dettagli: dettagli.slice(0, 20) });
    }
    const lista = (c, k) => { const v = c[k]; if (v === undefined) return []; if (!Array.isArray(v) || v.length > MAX_EVENTI) throw rifiuto('contenuto'); return v; };

    /* ---------- Scrivere: l'elenco riservato, la copia datata nello storico, poi l'archivio pubblico ----------
       Prima ciò che è riservato, poi i file pubblici: se la scrittura si interrompe a metà, la pubblicazione seguente
       ricostruisce tutto dall'elenco. I file dei quadranti hanno la versione nel nome: si scrivono quelli nuovi, poi
       l'indice, e si tolgono subito tutti quelli che l'indice nuovo non nomina: un evento ritirato o sospeso non deve
       restare leggibile in un file vecchio. Il telefono che ha ancora l'indice di prima e non trova più un file
       richiede l'indice (sorgenti/moduli/archivio.js). */
    async function pubblica(p, t, operazione, riepilogo, eventi, sospesi) {
      const { file } = Q.costruisci(eventi, Object.assign({ adesso: t, regioni }, opzEv || {}));
      const quando = iso(t), nome = quando.replace(/[:.]/g, '-') + '-' + p.numero.slice(0, 8);
      await scriviJson(F.stato, { v: VERSIONE, aggiornato: quando, eventi, sospesi });
      await scriviJson(F.copie + nome + '.json', { tipo: TIPO_COPIA, v: VERSIONE, nome, quando, dispositivo: p.dispositivo, operazione, riepilogo, eventi, sospesi, pacchetto: p });
      const elenco = await leggiJson(F.elenco, []);
      const conti = Object.fromEntries(Object.entries(riepilogo).map(([k, v]) => [k, Array.isArray(v) ? v.length : v]));
      elenco.push({ nome, quando, dispositivo: p.dispositivo, operazione, riepilogo: conti, eventi: eventi.length, sospesi: sospesi.length });
      await scriviJson(F.elenco, elenco);

      const presenti = await dep.elenca(PUB + 'quadranti/');
      for (const [f, testo] of Object.entries(file)) if (f !== 'indice.json' && !presenti.includes(PUB + f)) await dep.scrivi(PUB + f, testo);
      await dep.scrivi(PUB + 'indice.json', file['indice.json']);
      for (const f of presenti) if (!(f.slice(PUB.length) in file)) await dep.togli(f);
      if (o.svuota) { try { await o.svuota(['indice.json']); } catch (e) { /* la rete di consegna si aggiorna da sé alla scadenza */ } }
      return { quando, copia: nome, eventi: eventi.length, sospesi: sospesi.length, riepilogo };
    }

    const OPERA = {
      /* Pubblicare o correggere (un evento con un identificativo già pubblicato lo sostituisce), sospendere (l'evento
         esce dall'archivio pubblico e resta nell'elenco riservato: § 3.13, limitazione), riattivare, ritirare prima
         della fine con il motivo (cap. 22). */
      async scrivi(c, p, t) {
        const pub = lista(c, 'pubblica'), sos = lista(c, 'sospendi'), ria = lista(c, 'riattiva'), rit = lista(c, 'ritira');
        if (!(pub.length + sos.length + ria.length + rit.length)) throw rifiuto('vuoto');
        controllaEventi(pub);
        const s = await statoVivo(t), eventi = new Map(s.eventi.map(e => [e.id, e])), sospesi = new Map(s.sospesi.map(e => [e.id, e]));
        const r = { pubblicati: [], corretti: [], sospesi: [], riattivati: [], ritirati: [] };
        for (const ev of pub) {
          if (E.uscitaMs(ev) <= t) throw rifiuto('passato', { id: corto(ev.id) });
          if (sospesi.has(ev.id)) { sospesi.set(ev.id, ev); r.corretti.push(ev.id); }   // un evento sospeso si corregge e resta sospeso
          else { (eventi.has(ev.id) ? r.corretti : r.pubblicati).push(ev.id); eventi.set(ev.id, ev); }
        }
        for (const id of sos) { if (!eventi.has(id)) throw rifiuto('manca', { id: corto(id) }); sospesi.set(id, eventi.get(id)); eventi.delete(id); r.sospesi.push(id); }
        for (const id of ria) { if (!sospesi.has(id)) throw rifiuto('manca', { id: corto(id) }); eventi.set(id, sospesi.get(id)); sospesi.delete(id); r.riattivati.push(id); }
        for (const x of rit) {
          if (!x || typeof x !== 'object' || typeof x.id !== 'string' || !MOTIVI.includes(x.motivo) ||
            (x.riferimento !== undefined && (typeof x.riferimento !== 'string' || x.riferimento.length > 40 || !RIGA.test(x.riferimento)))) throw rifiuto('ritiro');
          if (!eventi.has(x.id) && !sospesi.has(x.id)) throw rifiuto('manca', { id: corto(x.id) });
          eventi.delete(x.id); sospesi.delete(x.id);
          r.ritirati.push(Object.assign({ id: x.id, motivo: x.motivo }, x.riferimento ? { riferimento: x.riferimento } : {}));
        }
        return pubblica(p, t, 'scrivi', r, [...eventi.values()], [...sospesi.values()]);
      },
      /* Ripristinare una copia dello storico: la Redazione la legge, ripete le rimozioni di nomi chieste dopo la sua
         data (§ 3.13, passo 4) e rimanda gli eventi firmati; l'elenco di prima viene sostituito. */
      async ripristina(c, p, t) {
        if (typeof c.da !== 'string' || !NOME_COPIA.test(c.da) || !(await leggiJson(F.elenco, [])).some(x => x.nome === c.da)) throw rifiuto('copia');
        const ev = lista(c, 'eventi'), sos = lista(c, 'sospesi');
        controllaEventi(ev.concat(sos));
        const vivo = e => E.uscitaMs(e) > t;
        return pubblica(p, t, 'ripristina', { da: c.da }, ev.filter(vivo), sos.filter(vivo));
      },
      /* Letture riservate alla Redazione: anche queste chiedono la firma. */
      async stato(c, p, t) { const s = await statoVivo(t); return { eventi: s.eventi, sospesi: s.sospesi, aggiornato: s.aggiornato, copie: (await leggiJson(F.elenco, [])).length }; },
      async storico(c, p, t) {
        const elenco = await leggiJson(F.elenco, []);
        return { copie: elenco.slice().reverse().map(x => Object.assign({}, x, Date.parse(x.quando) < t - CINQUE_ANNI_MS ? { scaduta: true } : {})) };
      },
      async copia(c) {
        if (typeof c.nome !== 'string' || !NOME_COPIA.test(c.nome)) throw rifiuto('copia');
        const k = await leggiJson(F.copie + c.nome + '.json', null);
        if (!k || k.tipo !== TIPO_COPIA) throw rifiuto('copia');
        return { copia: { nome: k.nome, quando: k.quando, dispositivo: k.dispositivo, operazione: k.operazione, riepilogo: k.riepilogo, eventi: k.eventi, sospesi: k.sospesi } };
      }
    };

    /* ---------- La porta: un pacchetto alla volta ---------- */
    async function tratta(testo) {
      let letto; try { letto = P.leggi(testo); } catch (e) { return risposta(400, { esito: 'rifiutato', motivo: 'forma' }); }
      const p = letto.pacchetto, c = letto.contenuto, t = ora(), imp = p.dispositivo.impronta;
      const no = (stato, motivo, extra) => risposta(stato, Object.assign({ esito: 'rifiutato', motivo }, extra || {}));
      const chiavi = await leggiJson(F.chiavi, {});
      if ((chiavi.revocate || []).some(k => k.impronta === imp)) return no(403, 'revocata');
      const nota = (chiavi.autorizzate || []).find(k => k.impronta === imp);
      if (!nota) return no(403, 'sconosciuto');   // non è un dispositivo della Redazione: rifiutato subito, senza contare nulla
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
      try { return risposta(200, Object.assign({ esito: 'fatto', operazione: c.operazione }, await OPERA[c.operazione](c, p, t))); }
      catch (e) { if (e && e.rifiuto) return risposta(422, Object.assign({ esito: 'rifiutato' }, e.rifiuto)); throw e; }
    }
    let coda = Promise.resolve();
    /* ricevi(testo del pacchetto) → {stato, corpo}: stato è il codice della risposta (200 se è andata), corpo ciò che
       lo sportello risponde, con la sua ora. */
    function ricevi(testo) {
      const r = coda.then(() => tratta(testo));
      coda = r.catch(() => {});
      return r.catch(() => risposta(500, { esito: 'rifiutato', motivo: 'guasto' }));
    }

    /* ---------- Le chiavi autorizzate: non passano dalla porta ---------- */
    async function autorizza(pubbliche) {
      const f = pubbliche && pubbliche.firma;
      if (!pubbliche || pubbliche.tipo !== TIPO_PUBBLICHE || !f || typeof f.pubblica !== 'string' || !/^[A-Za-z0-9_-]{80,100}$/.test(f.pubblica)) throw rifiuto('chiavi');
      const imp = await P.impronta(f.pubblica, cripto);
      if (imp !== f.impronta) throw rifiuto('chiavi');
      const k = await leggiJson(F.chiavi, {}); k.autorizzate = k.autorizzate || []; k.revocate = k.revocate || [];
      if (k.revocate.some(x => x.impronta === imp)) throw rifiuto('revocata');   // una firma revocata non torna: il dispositivo se ne fa una nuova
      k.autorizzate = k.autorizzate.filter(x => x.impronta !== imp).concat([{ dispositivo: String(pubbliche.dispositivo || '').slice(0, 80), impronta: imp, pubblica: f.pubblica, dal: iso(ora()) }]);
      await scriviJson(F.chiavi, k);
      return imp;
    }
    async function revoca(avviso) {
      if (!avviso || avviso.tipo !== TIPO_REVOCA || typeof avviso.impronta !== 'string' || !P.IMPRONTA.test(avviso.impronta)) throw rifiuto('chiavi');
      const k = await leggiJson(F.chiavi, {}); k.autorizzate = (k.autorizzate || []).filter(x => x.impronta !== avviso.impronta);
      k.revocate = (k.revocate || []).filter(x => x.impronta !== avviso.impronta).concat([{ dispositivo: String(avviso.dispositivo || '').slice(0, 80), impronta: avviso.impronta, quando: iso(ora()) }]);
      await scriviJson(F.chiavi, k);
      return avviso.impronta;
    }
    /* Chi è autorizzato e chi è revocato, senza le chiavi. */
    async function chiavi() {
      const k = await leggiJson(F.chiavi, {});
      return { autorizzate: (k.autorizzate || []).map(x => ({ dispositivo: x.dispositivo, impronta: x.impronta, dal: x.dal })), revocate: k.revocate || [] };
    }

    return { ricevi, autorizza, revoca, chiavi };
  }

  return { VERSIONE, TENTATIVI, QUARTO_MS, FERMO_MS, MAX_EVENTI, CINQUE_ANNI_MS, MOTIVI, PUB, RIS, TIPO_COPIA, NOME_COPIA, crea };
});
