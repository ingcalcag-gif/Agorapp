/* La copia di sicurezza degli eventi fuori da Bunny (voce T-054 del piano di adeguamento; documento: docs/archivio.md).

   Libro mastro, § 2.4 («Lo storico e le copie di sicurezza» e le sei condizioni comuni della copia), § 3.11 (prova
   periodica del ripristino), § 3.13, passo 4 (le rimozioni chieste dopo la data della copia si ripetono prima di
   ripubblicare), § 3.14 (la copia non va oltre lo storico). Decisioni del 27/11/2026: la copia contiene tutto (n. 6:
   l'elenco degli eventi con sospesi e nascosti, che restano cifrati, tutto lo storico e il registro delle fonti come lo
   tiene lo sportello, con i contatori dei codici F); la frase è di almeno 20 caratteri e non apre la copia di riserva
   delle chiavi (n. 7); la cassaforte non entra (n. 10).

   Il modulo non parla con lo sportello e non conosce chiavi: lavora su ciò che gli si passa.
   - componi(file, info) → la copia, in chiaro: i file riservati letti dallo sportello con «immagine» (sportelli/
     pubblicazione.js), con l'impronta SHA-256 di ciascuno. Gli eventi si ripetono da una copia dello storico all'altra:
     ogni versione di un evento (o di un evento nascosto, cifrato) si scrive una volta sola, nella tabella «eventi», e
     le copie la richiamano con la sua impronta. Un file che, riletto e riscritto, non torna identico resta com'è.
   - ricomponi(copia) → gli stessi file, lettera per lettera: ognuno si controlla con l'impronta presa al momento della
     copia; un file diverso fa fallire tutto.
   - cifra(copia, frase) → i byte del file da salvare: una riga di intestazione (tipo, data, parametri) e il contenuto
     compresso (gzip) e cifrato con AES-GCM a 256 bit, con la chiave ricavata dalla frase con PBKDF2-SHA-256 (600.000
     giri, sale casuale di 16 byte), come la copia di riserva delle chiavi. L'intestazione è legata al contenuto: chi la
     cambia rompe il file. decifra(byte, frase) fa il contrario; una frase sbagliata e un file alterato danno lo stesso
     rifiuto («copia»), come per le chiavi.
   - verifica(copia, {controlla}) → {integra, problemi, conti}: che cosa vuol dire «completa» (nel codice «integra», perché «completo» è tra le parole vietate dell'interfaccia) (decisione n. 8): ogni
     file ricomposto ha la sua impronta; ogni copia nominata dall'elenco dello storico c'è, ha la forma di una copia e il
     suo nome; nessuna copia fuori elenco; l'elenco degli eventi è quello dell'ultima copia; se ci sono buste del
     registro ci sono anche i codici F; ogni evento dell'elenco passa il controllo del formato.
   - parti(file, elenco, massimo) → le parti da mandare con «ricostruisci»: i file dello storico e del registro, e in
     fondo l'elenco degli eventi da pubblicare (riservato/stato.json), come la Redazione lo rimanda.

   Nel browser si trova in window.AGR_MODULI.copiaEventi; in Node (prove) con require(). Usa CompressionStream e
   DecompressionStream, che hanno i browser recenti e Node dalla versione 18. */
(function (radice, fabbrica) {
  const m = fabbrica(radice);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).copiaEventi = m;
})(typeof self !== 'undefined' ? self : this, function (radice) {
  'use strict';
  const TIPO = 'copia-sicurezza-eventi', VERSIONE = 1, GIRI = 600000, FRASE_MIN = 20;
  const MAX_TESTA = 4096, PARTE = 2.5e6;
  const STATO = 'riservato/stato.json', ELENCO = 'riservato/storico/elenco.json', CODICI = 'riservato/registro/codici.json';
  const COPIA = /^riservato\/storico\/copie\/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[0-9a-f]{8})\.json$/, RIGHE = /^riservato\/registro\/righe\/(.+)\.json$/;
  const LISTE = ['eventi', 'sospesi', 'nascosti', 'nascostiSospesi'];

  function errore(motivo, dettaglio) { const e = new Error('Copia di sicurezza, ' + motivo + (dettaglio ? ' (' + dettaglio + ')' : '')); e.motivo = motivo; e.dettaglio = dettaglio || ''; return e; }
  const cripto = () => radice.crypto || (typeof globalThis === 'object' ? globalThis.crypto : null);
  const hex = b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');
  const sha = async t => hex(await cripto().subtle.digest('SHA-256', typeof t === 'string' ? new TextEncoder().encode(t) : t));
  function b64(b) { b = new Uint8Array(b); let s = ''; for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function daB64(s) { const t = atob(String(s).replace(/-/g, '+').replace(/_/g, '/')), b = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i); return b; }
  async function flusso(dati, tipo) {
    const s = new Blob([dati]).stream().pipeThrough(tipo);
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  const comprimi = d => flusso(d, new CompressionStream('gzip'));
  const espandi = d => flusso(d, new DecompressionStream('gzip'));

  /* ---------- Comporre e ricomporre ---------- */
  async function componi(file, info) {
    if (!Array.isArray(file)) throw errore('file');
    const eventi = {}, voci = [];
    async function riferimento(x) { const t = JSON.stringify(x), k = (await sha(t)).slice(0, 32); if (!(k in eventi)) eventi[k] = x; return k; }
    for (const f of file) {
      if (!f || typeof f.percorso !== 'string' || typeof f.testo !== 'string') throw errore('file');
      const v = { percorso: f.percorso, impronta: await sha(f.testo), lunghezza: f.testo.length };
      let o = null;
      if (f.percorso === STATO || COPIA.test(f.percorso)) { try { o = JSON.parse(f.testo); } catch (e) { o = null; } }
      if (o && typeof o === 'object' && !Array.isArray(o) && JSON.stringify(o) === f.testo) {
        for (const k of LISTE) if (Array.isArray(o[k])) { const l = []; for (const x of o[k]) l.push(await riferimento(x)); o[k] = l; }
        v.compatta = o;
      } else v.testo = f.testo;
      voci.push(v);
    }
    return { tipo: TIPO, v: VERSIONE, creata: new Date((info && info.ora) || Date.now()).toISOString(), sportello: (info && info.sportello) || '', dispositivo: (info && info.dispositivo) || '', eventi, file: voci };
  }
  async function ricomponi(c) {
    if (!c || c.tipo !== TIPO || c.v !== VERSIONE || !Array.isArray(c.file) || !c.eventi || typeof c.eventi !== 'object') throw errore('forma');
    const out = [];
    for (const v of c.file) {
      let testo;
      if (typeof v.testo === 'string') testo = v.testo;
      else if (v.compatta && typeof v.compatta === 'object') {
        const o = Object.assign({}, v.compatta);
        for (const k of LISTE) if (Array.isArray(o[k])) o[k] = o[k].map(h => { if (!(h in c.eventi)) throw errore('impronta', v.percorso); return c.eventi[h]; });
        testo = JSON.stringify(o);
      } else throw errore('forma', v && v.percorso);
      if ((await sha(testo)) !== v.impronta) throw errore('impronta', v.percorso);
      out.push({ percorso: v.percorso, testo });
    }
    return out;
  }

  /* ---------- Cifrare il file ---------- */
  async function chiave(frase, sale, giri) {
    const base = await cripto().subtle.importKey('raw', new TextEncoder().encode(String(frase).normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
    return cripto().subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: sale, iterations: giri }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  const fraseCorta = frase => Array.from(String(frase || '').trim()).length < FRASE_MIN;
  async function cifra(c, frase) {
    if (fraseCorta(frase)) throw errore('frase-corta');
    const sale = cripto().getRandomValues(new Uint8Array(16)), iv = cripto().getRandomValues(new Uint8Array(12));
    const testa = JSON.stringify({ tipo: TIPO, v: VERSIONE, creata: c.creata, kdf: { nome: 'PBKDF2-SHA-256', giri: GIRI, sale: b64(sale) }, cifra: { nome: 'AES-GCM', bit: 256, iv: b64(iv) }, compresso: 'gzip' }) + '\n';
    const tb = new TextEncoder().encode(testa);
    const dentro = await comprimi(new TextEncoder().encode(JSON.stringify(c)));
    const fuori = new Uint8Array(await cripto().subtle.encrypt({ name: 'AES-GCM', iv, additionalData: tb }, await chiave(frase, sale, GIRI), dentro));
    const r = new Uint8Array(tb.length + fuori.length); r.set(tb); r.set(fuori, tb.length);
    return r;
  }
  function intestazione(byte) {
    const b = byte instanceof Uint8Array ? byte : new Uint8Array(byte);
    const fine = b.subarray(0, MAX_TESTA).indexOf(10);
    if (fine < 0) throw errore('copia');
    let t; try { t = JSON.parse(new TextDecoder().decode(b.subarray(0, fine))); } catch (e) { throw errore('copia'); }
    if (!t || t.tipo !== TIPO || t.v !== VERSIONE || !t.kdf || !t.cifra || t.cifra.nome !== 'AES-GCM' || t.kdf.nome !== 'PBKDF2-SHA-256' || !(t.kdf.giri >= 100000 && t.kdf.giri <= 5e6)) throw errore('copia');
    return { testa: t, tb: b.subarray(0, fine + 1), corpo: b.subarray(fine + 1) };
  }
  async function decifra(byte, frase) {
    const h = intestazione(byte);
    let dentro;
    try { dentro = await cripto().subtle.decrypt({ name: 'AES-GCM', iv: daB64(h.testa.cifra.iv), additionalData: h.tb }, await chiave(frase, daB64(h.testa.kdf.sale), h.testa.kdf.giri), h.corpo); }
    catch (e) { throw errore('copia'); }
    let c; try { c = JSON.parse(new TextDecoder().decode(await espandi(new Uint8Array(dentro)))); } catch (e) { throw errore('copia'); }
    if (!c || c.tipo !== TIPO || c.v !== VERSIONE) throw errore('copia');
    return c;
  }

  /* ---------- Che cosa vuol dire «completa» ---------- */
  async function verifica(c, o) {
    const problemi = [], conti = { copie: 0, eventi: 0, sospesi: 0, nascosti: 0, buste: 0, codici: 0 };
    let file;
    try { file = await ricomponi(c); } catch (e) { return { integra: false, problemi: [e.motivo === 'impronta' ? 'il file ' + e.dettaglio + ' non è più uguale a quello copiato' : 'la copia non ha la forma giusta'], conti, file: null }; }
    const per = new Map(file.map(f => [f.percorso, f.testo])), json = p => { try { return JSON.parse(per.get(p)); } catch (e) { return null; } };
    const elenco = per.has(ELENCO) ? json(ELENCO) : [];
    if (!Array.isArray(elenco)) problemi.push('l’elenco dello storico non si legge');
    const nomi = new Set((Array.isArray(elenco) ? elenco : []).map(x => x && x.nome));
    const copie = file.filter(f => COPIA.test(f.percorso));
    for (const n of nomi) if (!per.has('riservato/storico/copie/' + n + '.json')) problemi.push('manca la copia dello storico del ' + n);
    for (const f of copie) {
      const n = f.percorso.match(COPIA)[1], k = json(f.percorso);
      if (!nomi.has(n)) problemi.push('la copia ' + n + ' non è nell’elenco dello storico');
      if (!k || k.tipo !== 'copia-pubblicazione' || k.nome !== n) problemi.push('la copia ' + n + ' non ha la forma di una copia dello storico');
    }
    conti.copie = copie.length;
    const stato = per.has(STATO) ? json(STATO) : null;
    if (nomi.size && !stato) problemi.push('manca l’elenco degli eventi');
    if (stato) {
      for (const k of LISTE) if (stato[k] !== undefined && !Array.isArray(stato[k])) problemi.push('l’elenco degli eventi non si legge');
      conti.eventi = (stato.eventi || []).length; conti.sospesi = (stato.sospesi || []).length; conti.nascosti = (stato.nascosti || []).length + (stato.nascostiSospesi || []).length;
      const ultima = Array.isArray(elenco) && elenco.length ? json('riservato/storico/copie/' + elenco[elenco.length - 1].nome + '.json') : null;
      if (ultima && LISTE.some(k => JSON.stringify(stato[k] || []) !== JSON.stringify(ultima[k] || []))) problemi.push('l’elenco degli eventi non è quello dell’ultima copia dello storico: forse c’è stata una pubblicazione mentre si faceva la copia');
      if (o && typeof o.controlla === 'function') for (const ev of (stato.eventi || []).concat(stato.sospesi || [])) { const e = o.controlla(ev); if (e && e.length) problemi.push('l’evento ' + String(ev && ev.id).slice(0, 40) + ' non passa il controllo del formato'); }
    }
    const buste = file.filter(f => RIGHE.test(f.percorso));
    conti.buste = buste.length;
    for (const f of buste) { const k = json(f.percorso); if (!k || k.tipo !== 'registro-righe') problemi.push('la busta ' + f.percorso.match(RIGHE)[1] + ' del registro non ha la forma giusta'); }
    const cod = per.has(CODICI) ? json(CODICI) : null;
    if (buste.length && !cod) problemi.push('mancano i codici F del registro delle fonti');
    if (cod) conti.codici = Math.max(0, (cod.prossimo || 1) - 1);
    return { integra: !problemi.length, problemi, conti, file };
  }

  /* ---------- Le parti di «ricostruisci» ---------- */
  function parti(file, elenco, massimo) {
    const max = massimo || PARTE, gruppi = [[]];
    let n = 0;
    for (const f of file) {
      if (f.percorso === STATO) continue;
      if (gruppi[gruppi.length - 1].length && n + f.testo.length > max) { gruppi.push([]); n = 0; }
      gruppi[gruppi.length - 1].push(f); n += f.testo.length;
    }
    const ultimo = { percorso: STATO, testo: JSON.stringify({ eventi: elenco.eventi || [], sospesi: elenco.sospesi || [], nascosti: elenco.nascosti || [], nascostiSospesi: elenco.nascostiSospesi || [] }) };
    if (gruppi[gruppi.length - 1].length && n + ultimo.testo.length > max) gruppi.push([]);
    gruppi[gruppi.length - 1].push(ultimo);
    return gruppi;
  }
  /* l'elenco dei file di una parte con le impronte, per il pacchetto firmato */
  async function impronte(gruppo) { const l = []; for (const f of gruppo) l.push({ percorso: f.percorso, impronta: await sha(f.testo) }); return l; }

  return { TIPO, VERSIONE, GIRI, FRASE_MIN, STATO, ELENCO, CODICI, componi, ricomponi, cifra, decifra, intestazione, verifica, parti, impronte, sha };
});
