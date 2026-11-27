/* Lo sportello dell'archivio dei registri (voce T-053 del piano di adeguamento; documento: docs/archivio.md).

   Libro mastro, § 1.1 (le tre condizioni dell'archivio: uno spazio riservato, separato e non raggiungibile dal pubblico;
   file cifrati sul dispositivo della redazione prima del caricamento; una copia fuori da Bunny), § 18.3 (QB-7, strada 2,
   decisione del 17/11/2026: i registri si cifrano con la password di apertura del programma dei fogli di calcolo e si
   depositano dalla sezione «Archivio» dell'app della redazione, con la firma, che rifiuta i file in chiaro e non apre
   mai i registri; fino al lancio la sola copia corrente, strada a), § 18.4 (i nomi dei file), § 18.2 (gli allegati),
   cap. 22 (il registro delle fonti scritto dall'app usa lo stesso deposito), § 2.4 («Le chiavi»: la password
   dell'account Bunny non serve a depositare).

   Una sola porta, firmata: risponde soltanto ai pacchetti firmati da un dispositivo della Redazione, con il pacchetto e
   le regole dello sportello di pubblicazione (sorgenti/moduli/pacchetto.js; decisione del 23/11/2026: cinque minuti;
   cinque firme sbagliate in un quarto d'ora fermano quel dispositivo per quindici minuti; gli estranei sono rifiutati
   subito, senza contare nulla). Le operazioni (decisioni del 27/11/2026, nn. 2-5):
   - «archivia»: deposita un file già cifrato. Il file viaggia accanto al pacchetto, nella stessa richiesta
     ({pacchetto, dati}): il pacchetto firmato porta nome, dimensione e impronta SHA-256 del file, così la firma copre
     anche il file senza che il file debba stare dentro il pacchetto (che ha un limite di 2 milioni di caratteri). Lo
     sportello controlla il nome (§ 18.4), la dimensione (al più 10 MB) e il numero dei file (al più 1.000), l'impronta e
     la cifratura (sorgenti/moduli/file-cifrati.js: Excel e PDF con AES, decisione n. 1); un file con lo stesso nome di
     uno già depositato lo sostituisce soltanto se il pacchetto lo chiede («sostituisci»), perché fino al lancio
     nell'archivio c'è la sola copia corrente (§ 18.3, strada a);
   - «elenca»: l'elenco dei file con dimensione, impronta, cifratura, ora e dispositivo, e il numero delle buste del
     registro delle fonti scritte dall'app (decisione n. 3: le buste viaggiano con la pubblicazione e restano nel
     riservato dello sportello di pubblicazione, nella stessa zona; qui si mostrano e si riscaricano);
   - «scarica»: un file, così com'è (cifrato), oppure le buste del registro delle fonti, a pagine;
   - «togli»: toglie un file (un allegato scaduto con la sua voce, § 18.6; un file depositato per errore);
   - «codice»: il prossimo codice FS (fonti) o NP (richieste non pubblicate) del registro delle fonti (decisione n. 4):
     due dispositivi non danno mai lo stesso codice (§ 18.4: i codici non si riusano). Il dispositivo manda il primo
     numero che conosce come libero («almeno»): il contatore va avanti, mai indietro, così un codice scritto a mano o
     dato prima non torna.
   Lo sportello non apre mai i file: li conserva così come arrivano, in base64 dentro un piccolo file JSON con le sue
   informazioni, nella zona riservata, sotto riservato/archivio/.

   Qui c'è soltanto la logica, uguale dovunque giri: su Bunny la avvolge sportelli/bunny-archivio.js (Fase 2, T-065); in
   Fase 1 gira dentro il browser dell'app della redazione, nello sportello di prova, con lo stesso archivio finto degli
   altri sportelli. Chi la avvolge le dà deposito {leggi, scrivi, togli, elenca}, ora, cripto, pacchetto, file (il
   modulo dei file cifrati) e nome (il nome del servizio, con cui cominciano i nomi dei registri).

   Nel browser si trova in window.AGR_MODULI.archivioSportello (dopo pacchetto.js e file-cifrati.js); in Node con
   require(). */
(function (radice, fabbrica) {
  const nodo = typeof module === 'object' && module.exports && typeof require === 'function';
  const M = nodo ? { pacchetto: require('../sorgenti/moduli/pacchetto.js'), file: require('../sorgenti/moduli/file-cifrati.js') } : (radice.AGR_MODULI || {});
  const m = fabbrica(M.pacchetto, M.file || M.fileCifrati, radice);
  if (nodo) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).archivioSportello = m;
})(typeof self !== 'undefined' ? self : this, function (P0, F0, radice) {
  'use strict';

  const VERSIONE = 1;
  const LIMITI = { dimensione: 10 * 1024 * 1024, numero: 1000 };   // decisione del 27/11/2026, n. 5
  const TENTATIVI = 5, QUARTO_MS = 15 * 6e4, FERMO_MS = 15 * 6e4;    // come lo sportello di pubblicazione
  const MAX_PAGINA = 3e6;                  // caratteri di buste in una risposta di «scarica»
  const PRE = 'riservato/archivio/', RIGHE = 'riservato/registro/righe/';
  const F = { chiavi: 'riservato/chiavi.json', elenco: PRE + 'elenco.json', file: PRE + 'file/', codici: PRE + 'codici.json', visti: PRE + 'visti.json', tentativi: PRE + 'tentativi.json' };
  const TIPO_FILE = 'file-archivio';
  const NOME_COPIA = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[0-9a-f]{8}$/;
  const IMPRONTA = /^[0-9a-f]{64}$/, B64 = /^[A-Za-z0-9_-]*$/;

  /* I nomi dei file (§ 18.4: «Agorapp_RegNN_Nome.xlsx», con il nome del servizio davanti; §§ 18.5 e 18.9: anagrafica ed
     elenchi; cap. 25: la sezione riservata delle segnalazioni ha un file suo). Gli allegati (§ 18.2) portano davanti il
     codice della voce a cui appartengono, per esempio «C-0007_risposta.pdf». I file di gestione delle attività (§ 2.6;
     piano, sezione 8: «depositabili, se cifrati, con lo strumento di T-053»), che il libro mastro non nomina, si chiamano
     «<nome>_Gestione_<descrizione>.xlsx» (scelta del 27/11/2026, da annotare nel libro mastro). */
  const REGISTRI = [
    ['Reg19_Decisioni', 'Registro delle decisioni (cap. 19)'], ['Reg20_Questioni_aperte', 'Registro delle questioni aperte (cap. 20)'], ['Reg21_Trattamenti', 'Registro dei trattamenti (cap. 21)'],
    ['Reg22_Fonti', 'Registro delle fonti (cap. 22)'], ['Reg23_Consensi', 'Registro dei consensi (cap. 23)'], ['Reg24_Esclusioni', 'Registro delle esclusioni editoriali (cap. 24)'],
    ['Reg25_Segnalazioni', 'Registro delle segnalazioni (cap. 25)'], ['Reg25_Sezione_riservata', 'Sezione riservata delle segnalazioni (cap. 25)'], ['Reg26_Richieste', 'Registro delle richieste (cap. 26)'],
    ['Reg27_Violazioni', 'Registro delle violazioni (cap. 27)'], ['Reg28_Servizi_esterni', 'Registro dei servizi esterni (cap. 28)'], ['Reg28bis_Accessibilita', 'Registro dell’accessibilità (cap. 28-bis)']];
  const COLLEGATI = [['Anagrafica_registri', 'Anagrafica dei registri (§ 18.5)'], ['Elenco_contatti', 'Elenco dei contatti della Direzione (§ 18.9)'], ['Elenco_beta_tester', 'Elenco dei beta-tester (§ 18.9)']];
  const PREFISSI = ['D', 'RI', 'CI', 'E', 'Q', 'VD', 'T', 'DES', 'FS', 'F', 'NP', 'C', 'X', 'CR', 'PR', 'S', 'A', 'AV', 'R', 'V', 'SE', 'ACC-S', 'ACC-G', 'ACC-V', 'ACC-O', 'P', 'K', 'BT'];
  const ALLEGATO = new RegExp('^(?:' + PREFISSI.join('|') + ')-\\d{4,5}_[A-Za-z0-9][A-Za-z0-9_-]{0,80}\\.(pdf|xlsx)$');
  const DESCRIZIONE = '[A-Za-z0-9][A-Za-z0-9_-]{0,60}';
  const escRe = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  /* tipoNome(nome, servizio) → {tipo: 'registro' | 'collegato' | 'gestione' | 'allegato', nome, etichetta, estensioni} o
     null. Un registro scritto con maiuscole diverse si riconosce e torna con il nome giusto. */
  function tipoNome(nome, servizio) {
    nome = String(nome || ''); const s = String(servizio || '');
    if (!s || nome.length > 120 || /[\/\\\u0000-\u001F\u007F]/.test(nome)) return null;
    for (const [tipo, l] of [['registro', REGISTRI], ['collegato', COLLEGATI]])
      for (const [n, etichetta] of l) { const giusto = s + '_' + n + '.xlsx'; if (nome.toLowerCase() === giusto.toLowerCase()) return { tipo, nome: giusto, etichetta, estensioni: ['xlsx'] }; }
    if (new RegExp('^' + escRe(s) + '_Gestione_' + DESCRIZIONE + '\\.xlsx$').test(nome)) return { tipo: 'gestione', nome, etichetta: 'File di gestione delle attività (§ 2.6)', estensioni: ['xlsx'] };
    const a = nome.match(ALLEGATO);
    if (a) return { tipo: 'allegato', nome, etichetta: 'Allegato della voce ' + nome.split('_')[0] + ' (§ 18.2)', estensioni: [a[1]] };
    return null;
  }
  const nomiFissi = servizio => REGISTRI.concat(COLLEGATI).map(([n, etichetta]) => ({ nome: servizio + '_' + n + '.xlsx', etichetta }));

  const iso = ms => new Date(ms).toISOString();
  function rifiuto(motivo, extra) { const e = new Error('archivio: ' + motivo); e.rifiuto = Object.assign({ motivo }, extra || {}); return e; }
  function daB64(s) {
    const t = atob(s.replace(/-/g, '+').replace(/_/g, '/')), b = new Uint8Array(t.length);
    for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i);
    return b;
  }
  const esadecimale = b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');

  function crea(o) {
    const dep = o.deposito, ora = o.ora || (() => Date.now()), P = o.pacchetto || P0, FC = o.file || F0, servizio = String(o.nome || '');
    const cripto = o.cripto || radice.crypto || (typeof globalThis === 'object' ? globalThis.crypto : null);
    const L = Object.assign({}, LIMITI, o.limiti || {});
    if (!dep || !P || !FC || !servizio) throw new Error('sportello dell\'archivio: mancano deposito, pacchetto, modulo dei file o nome');
    const MAX_RICHIESTA = P.MAX_CARATTERI + Math.ceil(L.dimensione * 4 / 3) + 1000;
    async function leggiJson(p, d) { const t = await dep.leggi(p); if (t == null) return d; try { return JSON.parse(t); } catch (e) { return d; } }
    const scriviJson = (p, v) => dep.scrivi(p, JSON.stringify(v));
    const risposta = (stato, corpo) => ({ stato, corpo: Object.assign({ sportello: 'archivio', v: VERSIONE, ora: iso(ora()) }, corpo) });
    const no = (stato, motivo, extra) => risposta(stato, Object.assign({ esito: 'rifiutato', motivo }, extra || {}));
    const elenco = async () => { const e = await leggiJson(F.elenco, null); return e && e.file && typeof e.file === 'object' ? e : { v: VERSIONE, file: {} }; };
    const buste = async () => (await dep.elenca(RIGHE)).map(x => x.slice(RIGHE.length).replace(/\.json$/, '')).filter(n => NOME_COPIA.test(n)).sort();

    const OPERA = {
      async archivia(c, p, t, dati) {
        const tn = tipoNome(c.nome, servizio);
        if (!tn || tn.nome !== c.nome) throw rifiuto('nome');
        if (!Number.isInteger(c.dimensione) || c.dimensione < 1) throw rifiuto('forma');
        if (c.dimensione > L.dimensione) throw rifiuto('grande', { massimo: L.dimensione });
        if (typeof c.impronta !== 'string' || !IMPRONTA.test(c.impronta) || (c.sostituisci !== undefined && typeof c.sostituisci !== 'boolean')) throw rifiuto('forma');
        if (typeof dati !== 'string' || !B64.test(dati)) throw rifiuto('forma');
        const b = daB64(dati);
        if (b.length !== c.dimensione) throw rifiuto('forma');
        if (esadecimale(await cripto.subtle.digest('SHA-256', b)) !== c.impronta) throw rifiuto('impronta');
        const es = FC.esamina(b, c.nome), ext = c.nome.split('.').pop().toLowerCase();
        if (es.motivo) throw rifiuto('cifratura', { file: es.motivo, dettaglio: es.dettaglio });
        if (!tn.estensioni.includes(ext) || es.formato !== ext) throw rifiuto('cifratura', { file: 'formato', dettaglio: 'il contenuto non è un file .' + ext });
        const e = await elenco(), prima = e.file[c.nome];
        if (prima && !c.sostituisci) throw rifiuto('esiste', { quando: prima.quando, dispositivo: prima.dispositivo });
        if (!prima && Object.keys(e.file).length >= L.numero) throw rifiuto('troppi', { massimo: L.numero });
        const quando = iso(t), meta = { nome: c.nome, categoria: tn.tipo, dimensione: c.dimensione, impronta: c.impronta, cifratura: es.cifratura, quando, dispositivo: p.dispositivo };
        await scriviJson(F.file + c.nome + '.json', Object.assign({ tipo: TIPO_FILE, v: VERSIONE }, meta, { dati }));
        e.file[c.nome] = meta; await scriviJson(F.elenco, e);
        return { file: meta, sostituito: !!prima };
      },
      async elenca(c) {
        const e = await elenco(), n = await buste(), cod = await leggiJson(F.codici, {});
        return { file: Object.values(e.file).sort((a, b) => a.nome < b.nome ? -1 : 1), buste: { numero: n.length, ultima: n.length ? n[n.length - 1] : null },
          limiti: { dimensione: L.dimensione, numero: L.numero }, codici: { FS: cod.FS || 1, NP: cod.NP || 1 } };
      },
      async scarica(c) {
        if (c.buste === true) {
          if (c.dopo !== undefined && (typeof c.dopo !== 'string' || !NOME_COPIA.test(c.dopo))) throw rifiuto('forma');
          const tutte = await buste(), via = tutte.filter(n => !c.dopo || n > c.dopo), fuori = [];
          let n = 0;
          for (const nome of via) {
            const testo = await dep.leggi(RIGHE + nome + '.json'); if (testo == null) continue;
            if (fuori.length && n + testo.length > MAX_PAGINA) break;
            fuori.push({ nome, testo }); n += testo.length;
          }
          return { buste: fuori, altre: fuori.length < via.length };
        }
        if (!tipoNome(c.nome, servizio) || !(await elenco()).file[c.nome]) throw rifiuto('manca');
        const x = await leggiJson(F.file + c.nome + '.json', null);
        if (!x || x.tipo !== TIPO_FILE || x.nome !== c.nome) throw rifiuto('manca');
        return { file: { nome: x.nome, categoria: x.categoria, dimensione: x.dimensione, impronta: x.impronta, cifratura: x.cifratura, quando: x.quando, dispositivo: x.dispositivo }, dati: x.dati };
      },
      async togli(c) {
        const e = await elenco();
        if (!tipoNome(c.nome, servizio) || !e.file[c.nome]) throw rifiuto('manca');
        await dep.togli(F.file + c.nome + '.json'); delete e.file[c.nome]; await scriviJson(F.elenco, e);
        return { tolto: c.nome };
      },
      async codice(c) {
        if (!['FS', 'NP'].includes(c.serie) || (c.almeno !== undefined && (!Number.isInteger(c.almeno) || c.almeno < 1 || c.almeno > 9999))) throw rifiuto('forma');
        const cod = await leggiJson(F.codici, {}), n = Math.max(cod[c.serie] || 1, c.almeno || 1);
        if (n > 9999) throw rifiuto('codici');
        cod[c.serie] = n + 1; await scriviJson(F.codici, cod);
        return { codice: c.serie + '-' + String(n).padStart(4, '0') };
      }
    };

    /* ---------- La porta: una richiesta alla volta ---------- */
    async function tratta(testo) {
      const t = ora();
      if (typeof testo !== 'string' || testo.length > MAX_RICHIESTA) return no(400, 'forma');
      let r; try { r = JSON.parse(testo); } catch (e) { return no(400, 'forma'); }
      /* la richiesta è il pacchetto, oppure {pacchetto, dati} quando porta un file */
      let pacchetto = r, dati;
      if (r && typeof r === 'object' && !Array.isArray(r) && 'pacchetto' in r) {
        if (Object.keys(r).some(k => k !== 'pacchetto' && k !== 'dati')) return no(400, 'forma');
        pacchetto = r.pacchetto; dati = r.dati;
      }
      let letto; try { letto = P.leggi(pacchetto); } catch (e) { return no(400, 'forma'); }
      const p = letto.pacchetto, c = letto.contenuto, imp = p.dispositivo.impronta;
      if (!Object.prototype.hasOwnProperty.call(OPERA, c.operazione)) return no(400, 'operazione');   // le operazioni degli altri sportelli
      if ((dati !== undefined) !== (c.operazione === 'archivia')) return no(400, 'forma');
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
      try { return risposta(200, Object.assign({ esito: 'fatto', operazione: c.operazione }, await OPERA[c.operazione](c, p, t, dati))); }
      catch (e) { if (e && e.rifiuto) return risposta(422, Object.assign({ esito: 'rifiutato' }, e.rifiuto)); throw e; }
    }
    let coda = Promise.resolve();
    /* ricevi(testo della richiesta) → {stato, corpo}, come gli altri sportelli */
    function ricevi(testo) {
      const r = coda.then(() => tratta(testo));
      coda = r.catch(() => {});
      return r.catch(() => risposta(500, { esito: 'rifiutato', motivo: 'guasto' }));
    }
    return { ricevi };
  }

  return { VERSIONE, LIMITI, PRE, REGISTRI, COLLEGATI, PREFISSI, tipoNome, nomiFissi, crea };
});
