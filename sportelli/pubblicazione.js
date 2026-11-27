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
   sportello di prova lo scrivono i comandi «ammetti» e «revoca» qui sotto.

   Gli eventi nascosti (T-045; § 2.3; docs/eventi-nascosti.md) arrivano già cifrati: lo sportello non sa aprirli. Di
   ognuno conosce l'identificativo, l'impronta della password (il nome del file), il giorno in cui esce dalla mappa
   (decisione del 25/11/2026: soltanto il giorno, non l'ora) e il file illeggibile, che scrive in pubblico/nascosti/
   con l'impronta come nome. Due eventi nascosti non possono avere la stessa impronta, cioè la stessa password.

   Nel browser si trova in window.AGR_MODULI.sportello (dopo eventi.js, nascosti.js, quadranti.js e pacchetto.js); in
   Node con require(). */
(function (radice, fabbrica) {
  const nodo = typeof module === 'object' && module.exports && typeof require === 'function';
  const M = nodo ? { eventi: require('../sorgenti/moduli/eventi.js'), quadranti: require('../sorgenti/moduli/quadranti.js'), pacchetto: require('../sorgenti/moduli/pacchetto.js'),
    nascosti: require('../sorgenti/moduli/nascosti.js') } : (radice.AGR_MODULI || {});
  const m = fabbrica(M.eventi, M.quadranti, M.pacchetto, M.nascosti, radice);
  if (nodo) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).sportello = m;
})(typeof self !== 'undefined' ? self : this, function (E, Q, P, N, radice) {
  'use strict';
  if (!E || !Q || !P || !N) throw new Error('sportello: servono prima eventi.js, nascosti.js, quadranti.js e pacchetto.js');

  const VERSIONE = 1;
  const TENTATIVI = 5;                    // firme sbagliate, a nome dello stesso dispositivo…
  const QUARTO_MS = 15 * 6e4;             // …in un quarto d'ora…
  const FERMO_MS = 15 * 6e4;              // …e lo sportello non risponde a quel dispositivo per un quarto d'ora
  const MAX_EVENTI = 2000;                // eventi in un solo pacchetto
  const CINQUE_ANNI_MS = 5 * 365.25 * 864e5;   // § 3.14: lo storico si conserva cinque anni (si controlla nel riesame)
  /* I motivi del ritiro prima della fine (cap. 22, colonna «Ritiro prima della fine»; §§ 5.2 e 7.5). */
  const MOTIVI = ['annullato', 'errore', 'esclusione', 'richiesta', 'segnalazione', 'ordine'];
  const PUB = 'pubblico/', RIS = 'riservato/', NASC = PUB + 'nascosti/';
  const F = { chiavi: RIS + 'chiavi.json', stato: RIS + 'stato.json', visti: RIS + 'visti.json', tentativi: RIS + 'tentativi.json',
    elenco: RIS + 'storico/elenco.json', copie: RIS + 'storico/copie/', codici: RIS + 'registro/codici.json', righe: RIS + 'registro/righe/' };
  /* Il registro delle fonti (cap. 22; T-041, T-043): con una pubblicazione può arrivare, nello stesso pacchetto firmato,
     la busta cifrata con le sue righe. Lo sportello non la sa aprire (la chiave del registro sta solo sui dispositivi
     della Redazione): ne controlla la forma, la conserva in riservato/registro/righe/ accanto alla copia datata e dà a
     ogni evento nuovo il suo codice F, uno dopo l'altro, così due dispositivi non danno mai lo stesso codice a due
     eventi (§ 18.4: i codici non si riusano e non si rinumerano). La busta non entra mai nei file pubblici.
     Decisione del 24/11/2026: fino allo sportello dell'archivio (T-053) il registro arriva insieme all'evento.
     Con la busta può arrivare registroDa, il primo numero F che lo sportello può dare: le righe scritte a mano prima
     dell'app hanno già i loro codici, e il contatore passa oltre (T-043). La lettura firmata «registro» restituisce le
     buste conservate e gli eventi pubblicati nel periodo, per il controllo della corrispondenza (cap. 22, regola 4) e
     per un secondo dispositivo, che le apre con la stessa chiave del registro. */
  const TIPO_BUSTA = 'registro-fonti-redazione', TIPO_RIGHE = 'registro-righe', MAX_BUSTA = 1500000;
  const TIPO_COPIA = 'copia-pubblicazione', TIPO_PUBBLICHE = 'chiavi-pubbliche-redazione', TIPO_REVOCA = 'revoca-chiave-redazione';
  const NOME_COPIA = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[0-9a-f]{8}$/;
  const MAX_BUSTE = 500, MAX_COPIE_LETTE = 2000, MAX_F = 99999;
  /* La copia di sicurezza degli eventi fuori da Bunny (T-054; § 2.4, «Lo storico e le copie di sicurezza»; decisioni del
     27/11/2026, nn. 6 e 8). «immagine» legge, a pagine, i file riservati che la copia deve contenere: l'elenco degli
     eventi (stato.json), lo storico (elenco e copie datate) e il registro delle fonti (codici F e buste); non le chiavi
     ammesse, i numeri ricevuti, i tentativi errati né i file degli altri sportelli. «ricostruisci» li riversa in uno
     sportello vuoto (oggi lo sportello di prova svuotato; con T-072 la cartella di prova su Bunny, o lo spazio nuovo dopo
     la perdita dell'account), a parti, ciascuna con il suo pacchetto firmato: i file viaggiano accanto al pacchetto
     ({pacchetto, file}) e il pacchetto ne porta le impronte SHA-256, così la firma li copre tutti. Lo sportello accetta la
     prima parte soltanto se è vuoto, così non si può cancellare per errore l'archivio vero; finché la ricostruzione non è
     finita (il segno riservato/ricostruzione.json) non pubblica nient'altro. L'ultima parte porta l'elenco degli eventi
     come la Redazione lo rimanda dopo aver ripetuto le rimozioni chieste dopo la data della copia (§ 3.13, passo 4): lo
     sportello lo pubblica come ogni pubblicazione, con la sua copia datata. */
  const MARCA = RIS + 'ricostruzione.json', MAX_PAGINA = 3e6, MAX_INVOLUCRO = 12e6, MAX_PARTI = 100000;
  const IMMAGINE = [/^riservato\/stato\.json$/, /^riservato\/storico\/elenco\.json$/, /^riservato\/storico\/copie\/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[0-9a-f]{8}\.json$/,
    /^riservato\/registro\/codici\.json$/, /^riservato\/registro\/righe\/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[0-9a-f]{8}\.json$/];
  const nellImmagine = x => IMMAGINE.some(re => re.test(x));
  /* le cartelle da elencare una per una: su Bunny l'elenco di una cartella non comprende le sottocartelle */
  const CARTELLE_IMMAGINE = [RIS + 'storico/', RIS + 'storico/copie/', RIS + 'registro/', RIS + 'registro/righe/'];
  const RIGA = /^[^\u0000-\u001F\u007F-\u009F]*$/;

  const iso = ms => new Date(ms).toISOString();
  function rifiuto(motivo, extra) { const e = new Error('sportello: ' + motivo); e.rifiuto = Object.assign({ motivo }, extra || {}); return e; }
  const corto = x => (typeof x === 'string' ? x : String(x)).slice(0, 40);

  function crea(o) {
    const dep = o.deposito, ora = o.ora || (() => Date.now()), cripto = o.cripto || radice.crypto || (typeof globalThis === 'object' ? globalThis.crypto : null);
    const regioni = o.regioni || [], opzEv = o.vocabolario ? { vocabolario: o.vocabolario } : undefined;
    const pagina = o.pagina || MAX_PAGINA;   // i caratteri di una pagina di «immagine» (nelle prove, più piccola)
    if (!dep) throw new Error('sportello: manca il deposito');

    async function leggiJson(p, d) { const t = await dep.leggi(p); if (t == null) return d; try { return JSON.parse(t); } catch (e) { return d; } }
    const scriviJson = (p, v) => dep.scrivi(p, JSON.stringify(v));
    const risposta = (stato, corpo) => ({ stato, corpo: Object.assign({ sportello: 'pubblicazione', v: VERSIONE, ora: iso(ora()) }, corpo) });

    /* ---------- L'elenco completo degli eventi (riservato): pubblicati e sospesi, senza quelli già usciti ---------- */
    async function statoVivo(t) {
      const s = await leggiJson(F.stato, null) || {};
      const vivo = ev => E.uscitaMs(ev) > t, tutti = (s.eventi || []).concat(s.sospesi || []);
      const eventi = (s.eventi || []).filter(vivo), sospesi = (s.sospesi || []).filter(vivo);
      /* gli eventi nascosti restano fino alla fine del giorno in cui escono dalla mappa (ora italiana) */
      const vivoN = x => !!x && N.vivo(x.giorno, t), nascosti = (s.nascosti || []).filter(vivoN), nascostiSospesi = (s.nascostiSospesi || []).filter(vivoN);
      return { eventi, sospesi, nascosti, nascostiSospesi, usciti: tutti.length - eventi.length - sospesi.length, aggiornato: s.aggiornato || null };
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
    /* Un evento nascosto arriva come {id, impronta, giorno, file}: lo sportello ne controlla soltanto la forma (il
       contenuto non lo sa leggere). Due voci dello stesso pacchetto con lo stesso identificativo o la stessa impronta
       fanno rifiutare il pacchetto intero. */
    function controllaNascosti(lista) {
      const dettagli = [], ids = new Set(), impronte = new Set();
      for (const x of lista) {
        const err = [];
        if (!x || typeof x !== 'object' || Array.isArray(x) || Object.keys(x).sort().join() !== 'file,giorno,id,impronta') err.push('campi diversi da id, impronta, giorno, file');
        else {
          if (typeof x.id !== 'string' || !E.ID.test(x.id)) err.push('id');
          if (typeof x.impronta !== 'string' || !N.IMPRONTA.test(x.impronta)) err.push('impronta');
          if (!N.giornoValido(x.giorno)) err.push('giorno');
          err.push(...N.controllaFile(x.file));
        }
        if (!err.length && (ids.has(x.id) || impronte.has(x.impronta))) throw rifiuto('impronta', { id: corto(x.id) });
        if (!err.length) { ids.add(x.id); impronte.add(x.impronta); }
        else dettagli.push({ id: x && typeof x.id === 'string' ? corto(x.id) : null, errori: err.slice(0, 5) });
      }
      if (dettagli.length) throw rifiuto('nascosto', { dettagli: dettagli.slice(0, 20) });
    }
    const lista = (c, k) => { const v = c[k]; if (v === undefined) return []; if (!Array.isArray(v) || v.length > MAX_EVENTI) throw rifiuto('contenuto'); return v; };

    /* ---------- Scrivere: l'elenco riservato, la copia datata nello storico, poi l'archivio pubblico ----------
       Prima ciò che è riservato, poi i file pubblici: se la scrittura si interrompe a metà, la pubblicazione seguente
       ricostruisce tutto dall'elenco. I file dei quadranti hanno la versione nel nome: si scrivono quelli nuovi, poi
       l'indice, e si tolgono subito tutti quelli che l'indice nuovo non nomina: un evento ritirato o sospeso non deve
       restare leggibile in un file vecchio. Il telefono che ha ancora l'indice di prima e non trova più un file
       richiede l'indice (sorgenti/moduli/archivio.js). */
    async function pubblica(p, t, operazione, riepilogo, eventi, sospesi, registro, nascosti, nascostiSospesi) {
      nascosti = nascosti || []; nascostiSospesi = nascostiSospesi || [];
      const { file } = Q.costruisci(eventi, Object.assign({ adesso: t, regioni }, opzEv || {}));
      const quando = iso(t), nome = quando.replace(/[:.]/g, '-') + '-' + p.numero.slice(0, 8);
      await scriviJson(F.stato, { v: VERSIONE, aggiornato: quando, eventi, sospesi, nascosti, nascostiSospesi });
      if (registro) {
        await scriviJson(F.codici, registro.tutti);
        await scriviJson(F.righe + nome + '.json', { tipo: TIPO_RIGHE, v: VERSIONE, nome, quando, dispositivo: p.dispositivo, codici: registro.codici, busta: registro.busta });
      }
      await scriviJson(F.copie + nome + '.json', { tipo: TIPO_COPIA, v: VERSIONE, nome, quando, dispositivo: p.dispositivo, operazione, riepilogo, eventi, sospesi, nascosti, nascostiSospesi, pacchetto: p });
      const elenco = await leggiJson(F.elenco, []);
      const conti = Object.fromEntries(Object.entries(riepilogo).map(([k, v]) => [k, Array.isArray(v) ? v.length : v]));
      elenco.push({ nome, quando, dispositivo: p.dispositivo, operazione, riepilogo: conti, eventi: eventi.length, sospesi: sospesi.length, nascosti: nascosti.length, nascostiSospesi: nascostiSospesi.length });
      await scriviJson(F.elenco, elenco);

      const presenti = await dep.elenca(PUB + 'quadranti/');
      for (const [f, testo] of Object.entries(file)) if (f !== 'indice.json' && !presenti.includes(PUB + f)) await dep.scrivi(PUB + f, testo);
      await dep.scrivi(PUB + 'indice.json', file['indice.json']);
      for (const f of presenti) if (!(f.slice(PUB.length) in file)) await dep.togli(f);
      /* Gli eventi nascosti: un file per evento, con l'impronta come nome. Il nome non cambia con una correzione (la
         password resta la stessa, decisione del 25/11/2026): il file si riscrive solo se è cambiato, e la rete di consegna
         va aggiornata anche per lui. I file degli eventi sospesi, ritirati o usciti si tolgono subito. */
      const voluti = new Map(nascosti.map(x => [NASC + x.impronta + '.json', JSON.stringify(x.file)])), cambiati = [];
      for (const [f, testo] of voluti) if ((await dep.leggi(f)) !== testo) { await dep.scrivi(f, testo); cambiati.push(f.slice(PUB.length)); }
      for (const f of await dep.elenca(NASC)) if (!voluti.has(f)) { await dep.togli(f); cambiati.push(f.slice(PUB.length)); }
      if (o.svuota) { try { await o.svuota(['indice.json'].concat(cambiati)); } catch (e) { /* la rete di consegna si aggiorna da sé alla scadenza */ } }
      return Object.assign({ quando, copia: nome, eventi: eventi.length, sospesi: sospesi.length, nascosti: nascosti.length, nascostiSospesi: nascostiSospesi.length, riepilogo }, registro ? { registro: { codici: registro.codici } } : {});
    }
    /* La busta del registro: solo la forma, senza aprirla. Ai codici: un codice F per ogni evento che ancora non ne ha
       uno (pubblicato, corretto o ritirato), lo stesso di prima per quelli che l'hanno già. */
    function bustaValida(b) {
      return !!b && typeof b === 'object' && !Array.isArray(b) && b.tipo === TIPO_BUSTA && b.v === 1 && Object.keys(b).every(k => ['tipo', 'v', 'iv', 'dati'].includes(k)) &&
        typeof b.iv === 'string' && /^[A-Za-z0-9_-]{16}$/.test(b.iv) && typeof b.dati === 'string' && /^[A-Za-z0-9_-]+$/.test(b.dati) && b.dati.length <= MAX_BUSTA;
    }
    async function codiciRegistro(ids, da) {
      const tutti = await leggiJson(F.codici, null) || { prossimo: 1, codici: {} }, codici = {};
      if (da) tutti.prossimo = Math.max(tutti.prossimo, da);
      for (const id of ids) {
        if (!tutti.codici[id]) tutti.codici[id] = 'F-' + String(tutti.prossimo++).padStart(5, '0');
        codici[id] = tutti.codici[id];
      }
      return { tutti, codici };
    }

    /* i file riservati della copia di sicurezza che lo sportello ha, in ordine di percorso (T-054) */
    async function fileImmagine() {
      const tutti = new Set();
      for (const pre of CARTELLE_IMMAGINE) for (const x of await dep.elenca(pre)) if (nellImmagine(x)) tutti.add(x);
      if ((await dep.leggi(F.stato)) != null) tutti.add(F.stato);
      return [...tutti].sort();
    }
    const OPERA = {
      /* Pubblicare o correggere (un evento con un identificativo già pubblicato lo sostituisce), sospendere (l'evento
         esce dall'archivio pubblico e resta nell'elenco riservato: § 3.13, limitazione), riattivare, ritirare prima
         della fine con il motivo (cap. 22). */
      async scrivi(c, p, t) {
        const pub = lista(c, 'pubblica'), nas = lista(c, 'nascosti'), sos = lista(c, 'sospendi'), ria = lista(c, 'riattiva'), rit = lista(c, 'ritira');
        if (!(pub.length + nas.length + sos.length + ria.length + rit.length)) throw rifiuto('vuoto');
        if (c.registro !== undefined && (!bustaValida(c.registro) || !(pub.length + nas.length + rit.length))) throw rifiuto('registro');
        if (c.registroDa !== undefined && (c.registro === undefined || !Number.isInteger(c.registroDa) || c.registroDa < 1 || c.registroDa > MAX_F)) throw rifiuto('registro');
        controllaEventi(pub); controllaNascosti(nas);
        const s = await statoVivo(t), eventi = new Map(s.eventi.map(e => [e.id, e])), sospesi = new Map(s.sospesi.map(e => [e.id, e]));
        const nascosti = new Map(s.nascosti.map(x => [x.id, x])), nascSos = new Map(s.nascostiSospesi.map(x => [x.id, x]));
        const nascosto = id => nascosti.has(id) || nascSos.has(id), pubblico = id => eventi.has(id) || sospesi.has(id);
        const r = { pubblicati: [], corretti: [], sospesi: [], riattivati: [], ritirati: [] };
        for (const ev of pub) {
          if (E.uscitaMs(ev) <= t) throw rifiuto('passato', { id: corto(ev.id) });
          if (nascosto(ev.id)) throw rifiuto('nascosto', { id: corto(ev.id) });   // un evento nascosto non diventa pubblico
          if (sospesi.has(ev.id)) { sospesi.set(ev.id, ev); r.corretti.push(ev.id); }   // un evento sospeso si corregge e resta sospeso
          else { (eventi.has(ev.id) ? r.corretti : r.pubblicati).push(ev.id); eventi.set(ev.id, ev); }
        }
        /* Gli eventi nascosti: nuovi o corretti. Una correzione ha la stessa impronta (la stessa password); un'impronta
           che appartiene a un altro evento nascosto vuol dire una password già usata, e il pacchetto si rifiuta. */
        for (const x of nas) {
          if (!N.vivo(x.giorno, t)) throw rifiuto('passato', { id: corto(x.id) });
          if (pubblico(x.id)) throw rifiuto('nascosto', { id: corto(x.id) });
          const prima = nascosti.get(x.id) || nascSos.get(x.id);
          if ((prima && prima.impronta !== x.impronta) || [...nascosti.values(), ...nascSos.values()].some(y => y.impronta === x.impronta && y.id !== x.id)) throw rifiuto('impronta', { id: corto(x.id) });
          if (nascSos.has(x.id)) { nascSos.set(x.id, x); r.corretti.push(x.id); }
          else { (nascosti.has(x.id) ? r.corretti : r.pubblicati).push(x.id); nascosti.set(x.id, x); }
        }
        const sposta = (da, a, id) => { a.set(id, da.get(id)); da.delete(id); };
        for (const id of sos) { if (eventi.has(id)) sposta(eventi, sospesi, id); else if (nascosti.has(id)) sposta(nascosti, nascSos, id); else throw rifiuto('manca', { id: corto(id) }); r.sospesi.push(id); }
        for (const id of ria) { if (sospesi.has(id)) sposta(sospesi, eventi, id); else if (nascSos.has(id)) sposta(nascSos, nascosti, id); else throw rifiuto('manca', { id: corto(id) }); r.riattivati.push(id); }
        for (const x of rit) {
          if (!x || typeof x !== 'object' || typeof x.id !== 'string' || !MOTIVI.includes(x.motivo) ||
            (x.riferimento !== undefined && (typeof x.riferimento !== 'string' || x.riferimento.length > 40 || !RIGA.test(x.riferimento)))) throw rifiuto('ritiro');
          if (!pubblico(x.id) && !nascosto(x.id)) throw rifiuto('manca', { id: corto(x.id) });
          eventi.delete(x.id); sospesi.delete(x.id); nascosti.delete(x.id); nascSos.delete(x.id);
          r.ritirati.push(Object.assign({ id: x.id, motivo: x.motivo }, x.riferimento ? { riferimento: x.riferimento } : {}));
        }
        const reg = c.registro === undefined ? null : Object.assign(await codiciRegistro(r.pubblicati.concat(r.corretti, r.ritirati.map(x => x.id)), c.registroDa), { busta: c.registro });
        return pubblica(p, t, 'scrivi', r, [...eventi.values()], [...sospesi.values()], reg, [...nascosti.values()], [...nascSos.values()]);
      },
      /* Ripristinare una copia dello storico: la Redazione la legge, ripete le rimozioni di nomi chieste dopo la sua
         data (§ 3.13, passo 4) e rimanda gli eventi firmati; l'elenco di prima viene sostituito. */
      async ripristina(c, p, t) {
        if (typeof c.da !== 'string' || !NOME_COPIA.test(c.da) || !(await leggiJson(F.elenco, [])).some(x => x.nome === c.da)) throw rifiuto('copia');
        const ev = lista(c, 'eventi'), sos = lista(c, 'sospesi'), nas = lista(c, 'nascosti'), nsos = lista(c, 'nascostiSospesi');
        controllaEventi(ev.concat(sos)); controllaNascosti(nas.concat(nsos));
        const ids = new Set(ev.concat(sos).map(e => e.id)), doppio = nas.concat(nsos).find(x => ids.has(x.id));
        if (doppio) throw rifiuto('nascosto', { id: corto(doppio.id) });
        /* gli eventi nascosti della copia tornano così come sono, cifrati: la Redazione può soltanto toglierli */
        const vivo = e => E.uscitaMs(e) > t, vivoN = x => N.vivo(x.giorno, t);
        return pubblica(p, t, 'ripristina', { da: c.da }, ev.filter(vivo), sos.filter(vivo), null, nas.filter(vivoN), nsos.filter(vivoN));
      },
      /* Letture riservate alla Redazione: anche queste chiedono la firma. */
      async stato(c, p, t) { const s = await statoVivo(t); return { eventi: s.eventi, sospesi: s.sospesi, nascosti: s.nascosti, nascostiSospesi: s.nascostiSospesi, aggiornato: s.aggiornato, copie: (await leggiJson(F.elenco, [])).length }; },
      async storico(c, p, t) {
        const elenco = await leggiJson(F.elenco, []);
        return { copie: elenco.slice().reverse().map(x => Object.assign({}, x, Date.parse(x.quando) < t - CINQUE_ANNI_MS ? { scaduta: true } : {})) };
      },
      /* Il registro delle fonti come lo conserva lo sportello (T-043): le buste arrivate dopo la copia «dopo» (tutte, se
         manca), al più 500 per volta, e gli eventi pubblicati per la prima volta tra «da» e «a» (date gg: aaaa-mm-gg,
         comprese), letti dalle copie dello storico. Le buste restano chiuse: le apre solo la Redazione. */
      async registro(c, p, t) {
        if (c.dopo !== undefined && (typeof c.dopo !== 'string' || !NOME_COPIA.test(c.dopo))) throw rifiuto('registro');
        const giorno = x => x === undefined || (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x));
        if (!giorno(c.da) || !giorno(c.a)) throw rifiuto('registro');
        const elenco = await leggiJson(F.elenco, []), tutti = await leggiJson(F.codici, null) || { prossimo: 1, codici: {} };
        const nomi = (await dep.elenca(F.righe)).map(x => x.slice(F.righe.length).replace(/\.json$/, '')).filter(n => NOME_COPIA.test(n) && (!c.dopo || n > c.dopo)).sort();
        const buste = [];
        for (const n of nomi.slice(0, MAX_BUSTE)) {
          const x = await leggiJson(F.righe + n + '.json', null);
          if (x && x.tipo === TIPO_RIGHE && bustaValida(x.busta)) buste.push({ nome: x.nome, quando: x.quando, dispositivo: x.dispositivo, codici: x.codici || {}, busta: x.busta });
        }
        const pubblicati = []; let lette = 0;
        if (c.da || c.a) {
          for (const x of elenco) {
            const g = String(x.quando || '').slice(0, 10);
            if (x.operazione !== 'scrivi' || !(x.riepilogo && x.riepilogo.pubblicati) || (c.da && g < c.da) || (c.a && g > c.a)) continue;
            if (++lette > MAX_COPIE_LETTE) break;
            const k = await leggiJson(F.copie + x.nome + '.json', null);
            if (k && k.tipo === TIPO_COPIA) for (const id of (k.riepilogo && k.riepilogo.pubblicati) || []) pubblicati.push({ id, quando: k.quando, copia: k.nome, codice: tutti.codici[id] || '' });
          }
        }
        return { buste, altre: nomi.length > MAX_BUSTE, pubblicati, troppe: lette > MAX_COPIE_LETTE, prossimo: tutti.prossimo };
      },
      /* La copia di sicurezza: i file riservati, a pagine di al più tre milioni di caratteri, in ordine di percorso */
      async immagine(c) {
        if (c.dopo !== undefined && (typeof c.dopo !== 'string' || !nellImmagine(c.dopo))) throw rifiuto('immagine');
        const tutti = await fileImmagine();
        const via = tutti.filter(x => !c.dopo || x > c.dopo), file = []; let n = 0;
        for (const percorso of via) {
          const testo = await dep.leggi(percorso); if (testo == null) continue;
          if (file.length && n + testo.length > pagina) break;
          file.push({ percorso, testo }); n += testo.length;
        }
        return { file, totale: tutti.length, seguito: file.length < via.length ? file[file.length - 1].percorso : null };
      },
      async ricostruisci(c, p, t, file) {
        if (typeof c.id !== 'string' || !/^[0-9a-f]{16}$/.test(c.id) || !Number.isInteger(c.parte) || !Number.isInteger(c.di) || c.parte < 1 || c.parte > c.di || c.di > MAX_PARTI ||
          !Array.isArray(c.file) || !Array.isArray(file) || c.file.length !== file.length) throw rifiuto('ricostruzione');
        /* i file: percorsi della copia, testi JSON, impronte uguali a quelle firmate; l'elenco degli eventi solo nell'ultima parte */
        for (let i = 0; i < file.length; i++) {
          const x = file[i], f = c.file[i];
          if (!x || typeof x.testo !== 'string' || !f || f.percorso !== x.percorso || !nellImmagine(x.percorso) || typeof f.impronta !== 'string' ||
            (x.percorso === F.stato && c.parte !== c.di)) throw rifiuto('ricostruzione', { percorso: corto(x && x.percorso) });
          const h = Array.from(new Uint8Array(await cripto.subtle.digest('SHA-256', new TextEncoder().encode(x.testo))), y => y.toString(16).padStart(2, '0')).join('');
          if (h !== f.impronta) throw rifiuto('impronta', { percorso: corto(x.percorso) });
          try { JSON.parse(x.testo); } catch (e) { throw rifiuto('ricostruzione', { percorso: corto(x.percorso) }); }
        }
        const marca = await leggiJson(MARCA, null);
        if (c.parte === 1) {
          /* la prima parte: lo sportello è vuoto, oppure c'è una ricostruzione interrotta, che si ricomincia da capo */
          const presenti = await fileImmagine();
          if (presenti.length && !marca) throw rifiuto('pieno');
          for (const x of presenti) await dep.togli(x);
        } else if (!marca || marca.id !== c.id || marca.parte !== c.parte - 1 || marca.di !== c.di) throw rifiuto('parte', { attesa: marca && marca.id === c.id ? marca.parte + 1 : 1 });
        await scriviJson(MARCA, { id: c.id, di: c.di, parte: c.parte, dispositivo: p.dispositivo, inizio: marca && c.parte > 1 ? marca.inizio : iso(t) });
        let stato = null;
        for (const x of file) { if (x.percorso === F.stato) stato = JSON.parse(x.testo); else await dep.scrivi(x.percorso, x.testo); }
        if (c.parte < c.di) return { parte: c.parte, di: c.di };
        /* l'ultima parte: si pubblica l'elenco degli eventi, come un ripristino, con la sua copia datata */
        if (!stato || typeof stato !== 'object') throw rifiuto('ricostruzione', { percorso: F.stato });
        const ev = lista(stato, 'eventi'), sos = lista(stato, 'sospesi'), nas = lista(stato, 'nascosti'), nsos = lista(stato, 'nascostiSospesi');
        controllaEventi(ev.concat(sos)); controllaNascosti(nas.concat(nsos));
        const ids = new Set(ev.concat(sos).map(e => e.id)), doppio = nas.concat(nsos).find(x => ids.has(x.id));
        if (doppio) throw rifiuto('nascosto', { id: corto(doppio.id) });
        const vivo = e => E.uscitaMs(e) > t, vivoN = x => N.vivo(x.giorno, t);
        const r = await pubblica(p, t, 'ricostruisci', { da: typeof c.da === 'string' ? c.da.slice(0, 40) : '' }, ev.filter(vivo), sos.filter(vivo), null, nas.filter(vivoN), nsos.filter(vivoN));
        await dep.togli(MARCA);
        return Object.assign(r, { parte: c.parte, di: c.di });
      },
      async copia(c) {
        if (typeof c.nome !== 'string' || !NOME_COPIA.test(c.nome)) throw rifiuto('copia');
        const k = await leggiJson(F.copie + c.nome + '.json', null);
        if (!k || k.tipo !== TIPO_COPIA) throw rifiuto('copia');
        return { copia: { nome: k.nome, quando: k.quando, dispositivo: k.dispositivo, operazione: k.operazione, riepilogo: k.riepilogo, eventi: k.eventi, sospesi: k.sospesi,
          nascosti: k.nascosti || [], nascostiSospesi: k.nascostiSospesi || [] } };
      }
    };

    /* ---------- La porta: un pacchetto alla volta ---------- */
    async function tratta(testo) {
      const no = (stato, motivo, extra) => risposta(stato, Object.assign({ esito: 'rifiutato', motivo }, extra || {}));
      /* la richiesta è il pacchetto, oppure, per «ricostruisci», {pacchetto, file}: i file accanto al pacchetto (T-054) */
      let pacchetto = testo, file;
      if (typeof testo === 'string' && testo.length <= MAX_INVOLUCRO && /^\s*\{\s*"pacchetto"/.test(testo)) {
        let r; try { r = JSON.parse(testo); } catch (e) { return no(400, 'forma'); }
        if (!r || typeof r !== 'object' || Array.isArray(r) || Object.keys(r).some(k => k !== 'pacchetto' && k !== 'file') || !Array.isArray(r.file)) return no(400, 'forma');
        pacchetto = r.pacchetto; file = r.file;
      }
      let letto; try { letto = P.leggi(pacchetto); } catch (e) { return no(400, 'forma'); }
      const p = letto.pacchetto, c = letto.contenuto, t = ora(), imp = p.dispositivo.impronta;
      if (!Object.prototype.hasOwnProperty.call(OPERA, c.operazione)) return no(400, 'operazione');   // un'operazione di un altro sportello (T-052, T-053)
      if ((file !== undefined) !== (c.operazione === 'ricostruisci')) return no(400, 'forma');
      const chiavi = await leggiJson(F.chiavi, {});
      if ((chiavi.revocate || []).some(k => k.impronta === imp)) return no(403, 'revocata');
      const nota = (chiavi.ammesse || []).find(k => k.impronta === imp);
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
      /* durante una ricostruzione non si pubblica e non si ripristina (T-054) */
      if ((c.operazione === 'scrivi' || c.operazione === 'ripristina') && (await dep.leggi(MARCA)) != null) return no(409, 'ricostruzione');
      try { return risposta(200, Object.assign({ esito: 'fatto', operazione: c.operazione }, await OPERA[c.operazione](c, p, t, file))); }
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
    async function ammetti(pubbliche) {
      const f = pubbliche && pubbliche.firma;
      if (!pubbliche || pubbliche.tipo !== TIPO_PUBBLICHE || !f || typeof f.pubblica !== 'string' || !/^[A-Za-z0-9_-]{80,100}$/.test(f.pubblica)) throw rifiuto('chiavi');
      const imp = await P.impronta(f.pubblica, cripto);
      if (imp !== f.impronta) throw rifiuto('chiavi');
      const k = await leggiJson(F.chiavi, {}); k.ammesse = k.ammesse || []; k.revocate = k.revocate || [];
      if (k.revocate.some(x => x.impronta === imp)) throw rifiuto('revocata');   // una firma revocata non torna: il dispositivo se ne fa una nuova
      /* dal blocco 13 la voce tiene anche la parte pubblica di cifratura, che lo sportello delle segnalazioni dà come
         lucchetto (sportelli/segnalazioni.js; decisione del 26/11/2026) */
      const ci = pubbliche.cifratura, cifratura = ci && typeof ci.pubblica === 'string' && /^[A-Za-z0-9_-]{80,100}$/.test(ci.pubblica) && ci.impronta === await P.impronta(ci.pubblica, cripto)
        ? { pubblica: ci.pubblica, impronta: ci.impronta } : null;
      k.ammesse = k.ammesse.filter(x => x.impronta !== imp).concat([Object.assign({ dispositivo: String(pubbliche.dispositivo || '').slice(0, 80), impronta: imp, pubblica: f.pubblica, dal: iso(ora()) }, cifratura ? { cifratura } : {})]);
      await scriviJson(F.chiavi, k);
      return imp;
    }
    async function revoca(avviso) {
      if (!avviso || avviso.tipo !== TIPO_REVOCA || typeof avviso.impronta !== 'string' || !P.IMPRONTA.test(avviso.impronta)) throw rifiuto('chiavi');
      const k = await leggiJson(F.chiavi, {}); k.ammesse = (k.ammesse || []).filter(x => x.impronta !== avviso.impronta);
      k.revocate = (k.revocate || []).filter(x => x.impronta !== avviso.impronta).concat([{ dispositivo: String(avviso.dispositivo || '').slice(0, 80), impronta: avviso.impronta, quando: iso(ora()) }]);
      await scriviJson(F.chiavi, k);
      return avviso.impronta;
    }
    /* Chi è autorizzato e chi è revocato, senza le chiavi. */
    async function chiavi() {
      const k = await leggiJson(F.chiavi, {});
      return { ammesse: (k.ammesse || []).map(x => ({ dispositivo: x.dispositivo, impronta: x.impronta, dal: x.dal })), revocate: k.revocate || [] };
    }

    return { ricevi, ammetti, revoca, chiavi };
  }

  return { VERSIONE, TENTATIVI, QUARTO_MS, FERMO_MS, MAX_EVENTI, CINQUE_ANNI_MS, MOTIVI, PUB, RIS, NASC, TIPO_COPIA, NOME_COPIA, MAX_BUSTE, MARCA, MAX_PAGINA, MAX_INVOLUCRO, nellImmagine, crea };
});
