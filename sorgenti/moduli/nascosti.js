/* Eventi nascosti: password, impronta e cifratura (voci T-045 e T-046 del piano di adeguamento; documento:
   docs/eventi-nascosti.md).

   Libro mastro, § 2.3: gli eventi nascosti sono pubblicati nell'archivio comune ma leggibili soltanto da chi ne conosce
   la password. La password è generata a caso dall'app della redazione e non è mai una frase prevedibile; il contenuto
   si cifra sul dispositivo della redazione con AES-256 e una chiave ricavata dalla password con un calcolo volutamente
   lento; lo sportello e Bunny ricevono un file già illeggibile, il cui nome è l'impronta della password, ottenuta con
   un calcolo diverso da quello della chiave. Il telefono di chi scrive la password calcola l'impronta, scarica il file
   e lo decifra. § 3.11 (cifratura sul dispositivo); allegato A, A.2, punto 10.

   La password (decisione del 25/11/2026): cinque parole italiane comuni pescate a caso dall'app della redazione da un
   elenco di 2048 (sorgenti/moduli/parole-nascosti.js, solo in quell'app), per esempio «nuvola tromba sedano faro
   lampo»: si ricorda e si passa a voce, ma è scelta a caso e nessuno la può indovinare (55 bit). Per l'impronta e per
   la chiave contano solo le lettere: maiuscole, accenti, spazi, trattini e altri segni non fanno differenza.

   Gli strumenti di cifratura sono soltanto quelli del browser (Web Crypto; in Node globalThis.crypto):
   - impronta: PBKDF2-SHA-256 con un sale fisso, 600.000 giri → 32 byte, scritti in 64 cifre esadecimali;
   - chiave: PBKDF2-SHA-256 con un sale casuale scritto nel file, 600.000 giri → AES-GCM a 256 bit, con l'impronta tra
     i dati autenticati, così un file non si può spostare sotto un altro nome.
   Il file pubblicato: {formato, versione, tdm-reservation, kdf: {nome, hash, giri, sale}, cifra: {nome, iv}, dati}.
   Dentro c'è un evento nel formato pubblico (docs/formato-eventi.md), che chi lo apre controlla con eventi.js.

   Nel browser si trova in window.AGR_MODULI.nascosti (dopo eventi.js); in Node con require(). */
(function (radice, fabbrica) {
  const nodo = typeof module === 'object' && module.exports && typeof require === 'function';
  const E = nodo ? require('./eventi.js') : (radice.AGR_MODULI || {}).eventi;
  const m = fabbrica(radice, E);
  if (nodo) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).nascosti = m;
})(typeof self !== 'undefined' ? self : this, function (radice, E) {
  'use strict';
  if (!E) throw new Error('nascosti.js: serve prima eventi.js');

  const VERSIONE = 1;
  const TIPO = 'evento-nascosto';
  const GIRI = 600000;              // giri di PBKDF2, per l'impronta e per la chiave (come la copia di riserva delle chiavi)
  const PAROLE = 5;                 // parole di una password
  const MIN_LETTERE = 20;           // § 2.3: almeno venti caratteri; una password più corta non si cerca nemmeno
  const DOMINIO_IMPRONTA = 'nascosti/impronta/v1';
  const MAX_DATI = 16000;           // caratteri del contenuto cifrato: un evento del formato pubblico ci sta largo
  const IMPRONTA = /^[0-9a-f]{64}$/;
  const GIORNO = /^(\d{4})-(\d{2})-(\d{2})$/;
  const B64 = /^[A-Za-z0-9_-]+$/;

  const cripto = c => c || radice.crypto || (typeof globalThis === 'object' ? globalThis.crypto : null);
  const byte = s => new TextEncoder().encode(String(s));
  function b64(b) { b = new Uint8Array(b); let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function daB64(s) { const t = atob(String(s).replace(/-/g, '+').replace(/_/g, '/')), b = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i); return b; }
  function errore(motivo) { const e = new Error('Evento nascosto, ' + motivo); e.motivo = motivo; return e; }

  /* Le lettere della password, le sole che contano: senza accenti, minuscole, senza spazi né altri segni. */
  const normalizza = t => String(t == null ? '' : t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
  /* La password come si mostra e si scrive: parole minuscole senza accenti, separate da uno spazio. */
  const forma = t => String(t == null ? '' : t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]+/g, ' ').trim();
  /* Abbastanza lunga da cercarla? (§ 2.3: almeno venti caratteri.) */
  const lunga = t => normalizza(t).length >= MIN_LETTERE;

  /* Cinque parole a caso dall'elenco, senza preferenze: un numero a caso per parola, scartando quelli che darebbero
     più peso alle prime parole dell'elenco. */
  function genera(elenco, c) {
    c = cripto(c);
    if (!Array.isArray(elenco) || elenco.length < 1024 || elenco.length > 65536) throw errore('elenco');
    const n = elenco.length, limite = Math.floor(65536 / n) * n, scelte = [];
    while (scelte.length < PAROLE) {
      const x = c.getRandomValues(new Uint16Array(1))[0];
      if (x < limite) scelte.push(elenco[x % n]);
    }
    return scelte.join(' ');
  }

  async function derivaBit(password, sale, giri, c) {
    const base = await c.subtle.importKey('raw', byte(normalizza(password)), 'PBKDF2', false, ['deriveBits']);
    return new Uint8Array(await c.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sale, iterations: giri }, base, 256));
  }
  async function chiave(password, sale, giri, c) {
    const base = await c.subtle.importKey('raw', byte(normalizza(password)), 'PBKDF2', false, ['deriveKey']);
    return c.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: sale, iterations: giri }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  /* L'impronta della password: il nome del file. Un numero che non permette di risalire alla password. */
  async function impronta(password, c) {
    c = cripto(c);
    if (!lunga(password)) throw errore('corta');
    return Array.from(await derivaBit(password, byte(DOMINIO_IMPRONTA), GIRI, c), x => x.toString(16).padStart(2, '0')).join('');
  }
  const aggiunti = imp => byte(TIPO + ':' + imp);

  /* Cifra un evento (formato pubblico) con la password: → {impronta, file}. */
  async function cifra(evento, password, c, giaImpronta) {
    c = cripto(c);
    const imp = giaImpronta || await impronta(password, c);
    if (!IMPRONTA.test(imp)) throw errore('impronta');
    const sale = c.getRandomValues(new Uint8Array(16)), iv = c.getRandomValues(new Uint8Array(12));
    const k = await chiave(password, sale, GIRI, c);
    const dati = b64(await c.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aggiunti(imp) }, k, byte(JSON.stringify(evento))));
    if (dati.length > MAX_DATI) throw errore('lungo');
    return { impronta: imp, file: { formato: TIPO, versione: VERSIONE, 'tdm-reservation': 1, kdf: { nome: 'PBKDF2', hash: 'SHA-256', giri: GIRI, sale: b64(sale) }, cifra: { nome: 'AES-GCM', iv: b64(iv) }, dati } };
  }

  /* La forma del file, senza aprirlo: lo usa anche lo sportello. → elenco degli errori, [] se va bene. */
  function controllaFile(f) {
    const err = [], solo = (o, k) => !!o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).length === k.length && k.every(x => Object.prototype.hasOwnProperty.call(o, x));
    if (!solo(f, ['formato', 'versione', 'tdm-reservation', 'kdf', 'cifra', 'dati'])) return ['file: campi diversi da quelli del formato'];
    if (f.formato !== TIPO || f.versione !== VERSIONE || f['tdm-reservation'] !== 1) err.push('file: formato o versione');
    if (!solo(f.kdf, ['nome', 'hash', 'giri', 'sale']) || f.kdf.nome !== 'PBKDF2' || f.kdf.hash !== 'SHA-256' || !Number.isInteger(f.kdf.giri) || f.kdf.giri < 100000 || f.kdf.giri > 5000000 ||
      typeof f.kdf.sale !== 'string' || !/^[A-Za-z0-9_-]{22}$/.test(f.kdf.sale)) err.push('file: kdf');
    if (!solo(f.cifra, ['nome', 'iv']) || f.cifra.nome !== 'AES-GCM' || typeof f.cifra.iv !== 'string' || !/^[A-Za-z0-9_-]{16}$/.test(f.cifra.iv)) err.push('file: cifra');
    if (typeof f.dati !== 'string' || !B64.test(f.dati) || f.dati.length < 24 || f.dati.length > MAX_DATI) err.push('file: dati');
    return err;
  }

  /* Apre un file con la password: → l'evento (ancora da controllare con eventi.js). Una password sbagliata o un file
     alterato danno lo stesso errore, «password». */
  async function decifra(f, password, c, giaImpronta) {
    c = cripto(c);
    if (typeof f === 'string') { try { f = JSON.parse(f); } catch (e) { throw errore('file'); } }
    if (controllaFile(f).length) throw errore('file');
    const imp = giaImpronta || await impronta(password, c);
    const k = await chiave(password, daB64(f.kdf.sale), f.kdf.giri, c);
    let chiaro;
    try { chiaro = await c.subtle.decrypt({ name: 'AES-GCM', iv: daB64(f.cifra.iv), additionalData: aggiunti(imp) }, k, daB64(f.dati)); }
    catch (e) { throw errore('password'); }
    try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(chiaro)); } catch (e) { throw errore('file'); }
  }

  /* Il giorno italiano (AAAA-MM-GG) di un momento. Lo sportello conosce soltanto il giorno in cui un evento nascosto esce
     dalla mappa (decisione del 25/11/2026) e toglie il file alla prima pubblicazione dopo la mezzanotte di quel giorno. */
  const FMT = typeof Intl === 'object' ? new Intl.DateTimeFormat('en-CA', { timeZone: E.FUSO, year: 'numeric', month: '2-digit', day: '2-digit' }) : null;
  function giornoDi(ms) { const p = {}; FMT.formatToParts(new Date(ms)).forEach(x => { p[x.type] = x.value; }); return p.year + '-' + p.month + '-' + p.day; }
  const giornoUscita = ev => { const u = E.uscitaMs(ev); return u == null ? null : giornoDi(u); };
  function giornoValido(g) { const m = typeof g === 'string' && g.match(GIORNO); if (!m) return false; const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return d.toISOString().slice(0, 10) === g; }
  /* Ancora da tenere nell'archivio al momento t? Fino alla fine del giorno di uscita, ora italiana. */
  const vivo = (giorno, t) => giornoValido(giorno) && giorno >= giornoDi(t);

  return { VERSIONE, TIPO, GIRI, PAROLE, MIN_LETTERE, IMPRONTA, MAX_DATI, normalizza, forma, lunga, genera, impronta, cifra, decifra, controllaFile, giornoDi, giornoUscita, giornoValido, vivo };
});
