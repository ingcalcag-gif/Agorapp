/* La segnalazione di un evento (voci T-050, T-051 e T-052 del piano di adeguamento; documento: docs/segnalazioni.md).

   Libro mastro, § 7.5, misura 3 (regole 1-8, strade a e b): il modulo «Segnala» nella scheda dell'evento indica l'evento
   con il suo identificativo, chiede il motivo tra cinque e una descrizione libera; email e nome sono facoltativi e servono
   solo a ricevere conferma ed esito; per i contenuti illeciti propone la dichiarazione di buona fede. Nessun
   identificativo del telefono; nulla resta sul telefono dopo l'invio. § 4.2 (invii volontari); § 11.4 (le richieste di
   adattamento arrivano anche dal modulo, con «Altro»).

   Questo modulo è scritto una volta sola e lo usano tutti e tre i lati:
   - l'app pubblica controlla la segnalazione, la chiude nella busta e risolve il piccolo compito prima dell'invio;
   - lo sportello delle segnalazioni (sportelli/segnalazioni.js) controlla la forma della busta e il compito;
   - l'app della redazione apre la busta con la chiave di cifratura del dispositivo (sorgenti/moduli/chiavi.js).

   La busta (strada a, decisione del 26/11/2026: chiude il telefono, il lucchetto lo dà lo sportello). Il telefono crea
   una coppia di chiavi usa e getta (ECDH P-256), ricava con la parte pubblica di cifratura della Redazione un segreto
   comune e, da quello, una chiave AES-GCM a 256 bit (HKDF-SHA-256); chiude il testo e butta la sua parte segreta. Nella
   busta viaggiano soltanto la sua parte pubblica usa e getta, il vettore iniziale e il testo chiuso: la riapre solo chi
   ha la parte segreta di cifratura della Redazione. Lo sportello e Bunny conservano un file illeggibile.

   Il piccolo compito (decisione del 26/11/2026, dubbio 4): prima dell'invio il telefono cerca un numero che, insieme
   all'ora data dallo sportello e all'impronta della busta, dia un'impronta SHA-256 che comincia con un certo numero di
   bit a zero. Per una persona è un'attesa breve; per chi volesse mandare migliaia di segnalazioni diventa lento. Il
   compito non dice nulla di chi scrive: lega soltanto la busta all'ora.

   Nel browser si trova in window.AGR_MODULI.segnalazione; in Node (prove, sportello) con require(). */
(function (radice, fabbrica) {
  const m = fabbrica(radice);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).segnalazione = m;
})(typeof self !== 'undefined' ? self : this, function (radice) {
  'use strict';
  const VERSIONE = 1, TIPO_BUSTA = 'segnalazione-redazione';
  /* I cinque motivi del § 7.5, regola 2 (e della colonna «Motivo» del cap. 25), nell'ordine del modulo. */
  const MOTIVI = ['dati', 'annullato', 'nome', 'illecito', 'altro'];
  /* Con il motivo «nome» la domanda «Di chi è il nome?» è obbligatoria (decisione del 26/11/2026): il proprio nome è
     una richiesta sui propri dati, da evadere entro 48 ore (§ 3.13; cap. 26). */
  const CHI = ['mio', 'altro'];
  const MAX_DESCRIZIONE = 2000, MAX_EMAIL = 254, MAX_NOME = 100, MAX_TITOLO = 200;
  const MAX_DATI = 24000;                 // il testo chiuso, in base64 per indirizzi
  const INFO = 'segnalazione-redazione-v1';
  const ID = /^[a-z2-7]{16}-[a-z2-7]{8}$/;
  const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/;
  const B64 = /^[A-Za-z0-9_-]+$/;
  const QUANDO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  const cripto = c => c || radice.crypto || (typeof globalThis === 'object' ? globalThis.crypto : null);

  function b64(b) { b = new Uint8Array(b); let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function daB64(s) { const t = atob(String(s).replace(/-/g, '+').replace(/_/g, '/')), b = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i); return b; }
  /* testi: senza caratteri di controllo, tranne l'a capo; a capo sempre \n */
  const pulisci = (x, max) => String(x == null ? '' : x).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u2028\u2029]/g, ' ').trim().slice(0, max);
  const lunghezza = x => Array.from(String(x == null ? '' : x)).length;

  /* ---------- La segnalazione: forma e controllo ---------- */
  /* prepara(campi) → la segnalazione nella forma che viaggia: soltanto ciò che la persona ha scritto e l'evento. */
  function prepara(c) {
    c = c || {};
    const s = { v: VERSIONE, evento: { id: String(c.id || ''), titolo: pulisci(c.titolo, MAX_TITOLO) }, motivo: String(c.motivo || ''), descrizione: pulisci(c.descrizione, MAX_DESCRIZIONE) };
    if (s.motivo === 'nome') s.chi = String(c.chi || '');
    if (s.motivo === 'illecito') s.buonaFede = !!c.buonaFede;
    const email = pulisci(c.email, MAX_EMAIL).replace(/\s+/g, ''), nome = pulisci(c.nome, MAX_NOME).replace(/\s+/g, ' ');
    if (email) s.email = email;
    if (nome) s.nome = nome;
    return s;
  }
  /* controlla(segnalazione) → l'elenco dei campi da sistemare: evento, motivo, chi, descrizione, email, nome, forma. */
  function controlla(s) {
    const e = [];
    if (!s || typeof s !== 'object' || Array.isArray(s) || s.v !== VERSIONE) return ['forma'];
    const ammessi = ['v', 'evento', 'motivo', 'chi', 'buonaFede', 'descrizione', 'email', 'nome'];
    if (Object.keys(s).some(k => !ammessi.includes(k))) e.push('forma');
    const ev = s.evento;
    if (!ev || typeof ev !== 'object' || typeof ev.id !== 'string' || !ID.test(ev.id) || typeof ev.titolo !== 'string' || lunghezza(ev.titolo) > MAX_TITOLO || Object.keys(ev).some(k => k !== 'id' && k !== 'titolo')) e.push('evento');
    if (!MOTIVI.includes(s.motivo)) e.push('motivo');
    if (s.motivo === 'nome' ? !CHI.includes(s.chi) : s.chi !== undefined) e.push('chi');
    if (s.motivo === 'illecito' ? typeof s.buonaFede !== 'boolean' : s.buonaFede !== undefined) e.push('forma');
    if (typeof s.descrizione !== 'string' || lunghezza(s.descrizione) > MAX_DESCRIZIONE || ((s.motivo === 'illecito' || s.motivo === 'altro') && !s.descrizione.trim())) e.push('descrizione');
    if (s.email !== undefined && (typeof s.email !== 'string' || s.email.length > MAX_EMAIL || !EMAIL.test(s.email))) e.push('email');
    if (s.nome !== undefined && (typeof s.nome !== 'string' || !s.nome.trim() || lunghezza(s.nome) > MAX_NOME)) e.push('nome');
    return Array.from(new Set(e));
  }

  /* ---------- La busta ---------- */
  const ec = { name: 'ECDH', namedCurve: 'P-256' };
  async function chiaveDaSegreto(segreto, effimera, c) {
    const sub = cripto(c).subtle;
    const base = await sub.importKey('raw', segreto, 'HKDF', false, ['deriveKey']);
    return sub.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: effimera, info: new TextEncoder().encode(INFO) }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  /* cifra(segnalazione, lucchetto, cripto) → la busta {tipo, v, effimera, iv, dati}. lucchetto: la parte pubblica di
     cifratura della Redazione (65 byte, in base64 per indirizzi), data dallo sportello. */
  async function cifra(s, lucchetto, c) {
    const errori = controlla(s); if (errori.length) throw Object.assign(new Error('segnalazione: ' + errori.join(', ')), { motivo: 'forma', campi: errori });
    if (typeof lucchetto !== 'string' || !B64.test(lucchetto)) throw Object.assign(new Error('segnalazione: lucchetto'), { motivo: 'lucchetto' });
    const k = cripto(c), sub = k.subtle;
    const redazione = await sub.importKey('raw', daB64(lucchetto), ec, false, []);
    const mia = await sub.generateKey(ec, false, ['deriveBits']);
    const effimera = new Uint8Array(await sub.exportKey('raw', mia.publicKey));
    const segreto = await sub.deriveBits({ name: 'ECDH', public: redazione }, mia.privateKey, 256);
    const chiave = await chiaveDaSegreto(segreto, effimera, c), iv = k.getRandomValues(new Uint8Array(12));
    const dati = await sub.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(TIPO_BUSTA) }, chiave, new TextEncoder().encode(JSON.stringify(s)));
    const busta = { tipo: TIPO_BUSTA, v: VERSIONE, effimera: b64(effimera), iv: b64(iv), dati: b64(dati) };
    if (busta.dati.length > MAX_DATI) throw Object.assign(new Error('segnalazione: troppo lunga'), { motivo: 'lunga' });
    return busta;
  }
  function bustaValida(b) {
    return !!b && typeof b === 'object' && !Array.isArray(b) && b.tipo === TIPO_BUSTA && b.v === VERSIONE && Object.keys(b).every(k => ['tipo', 'v', 'effimera', 'iv', 'dati'].includes(k)) &&
      typeof b.effimera === 'string' && /^[A-Za-z0-9_-]{87}$/.test(b.effimera) && typeof b.iv === 'string' && /^[A-Za-z0-9_-]{16}$/.test(b.iv) &&
      typeof b.dati === 'string' && B64.test(b.dati) && b.dati.length >= 24 && b.dati.length <= MAX_DATI;
  }
  /* apri(busta, segreto, cripto) → la segnalazione. segreto(effimera in byte) → il segreto comune (256 bit), ricavato
     dalla parte segreta di cifratura del dispositivo della Redazione (segretoSegnalazione del modulo delle chiavi). Una busta rovinata,
     scritta per un'altra chiave o con un contenuto fuori forma dà l'errore con motivo «busta». */
  async function apri(busta, segreto, c) {
    const no = () => Object.assign(new Error('segnalazione: busta'), { motivo: 'busta' });
    if (!bustaValida(busta)) throw no();
    let s;
    try {
      const effimera = daB64(busta.effimera), chiave = await chiaveDaSegreto(await segreto(effimera), effimera, c);
      const testo = await cripto(c).subtle.decrypt({ name: 'AES-GCM', iv: daB64(busta.iv), additionalData: new TextEncoder().encode(TIPO_BUSTA) }, chiave, daB64(busta.dati));
      s = JSON.parse(new TextDecoder().decode(testo));
    } catch (e) { throw no(); }
    if (controlla(s).length) throw no();
    return s;
  }

  /* ---------- Il piccolo compito ---------- */
  /* SHA-256 scritto qui, senza attese: il compito ne calcola decine di migliaia di fila (FIPS 180-4). */
  const K = new Uint32Array([0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d,
    0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  const W = new Uint32Array(64);
  function sha256(byte) {
    const n = byte.length, righe = ((n + 9 + 63) >> 6) << 6, m = new Uint8Array(righe);
    m.set(byte); m[n] = 0x80;
    const bit = n * 8; m[righe - 4] = bit >>> 24; m[righe - 3] = (bit >>> 16) & 255; m[righe - 2] = (bit >>> 8) & 255; m[righe - 1] = bit & 255;
    m[righe - 5] = Math.floor(n / 0x20000000) & 255;
    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a, h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    for (let o = 0; o < righe; o += 64) {
      for (let i = 0; i < 16; i++) W[i] = (m[o + 4 * i] << 24) | (m[o + 4 * i + 1] << 16) | (m[o + 4 * i + 2] << 8) | m[o + 4 * i + 3];
      for (let i = 16; i < 64; i++) {
        const a = W[i - 15], b = W[i - 2];
        const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3), s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
      }
      let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (let i = 0; i < 64; i++) {
        const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7)), ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + W[i]) | 0;
        const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10)), maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
    }
    const r = new Uint8Array(32), hs = [h0, h1, h2, h3, h4, h5, h6, h7];
    for (let i = 0; i < 8; i++) { r[4 * i] = hs[i] >>> 24; r[4 * i + 1] = (hs[i] >>> 16) & 255; r[4 * i + 2] = (hs[i] >>> 8) & 255; r[4 * i + 3] = hs[i] & 255; }
    return r;
  }
  const byte = t => new TextEncoder().encode(t);
  /* l'impronta della busta: i primi 32 caratteri (192 bit) dell'impronta SHA-256 dei suoi tre campi */
  const improntaBusta = b => b64(sha256(byte(b.effimera + '.' + b.iv + '.' + b.dati))).slice(0, 32);
  const zeri = h => { let n = 0; for (let i = 0; i < h.length; i++) { if (h[i] === 0) { n += 8; continue; } let x = h[i]; while (!(x & 0x80)) { n++; x <<= 1; } break; } return n; };
  const testoCompito = (quando, imp, n) => quando + '.' + imp + '.' + n.toString(36);
  /* verificaCompito(busta, {quando, n}, bit) → vero se il numero risolve il compito per quella busta e quell'ora */
  function verificaCompito(busta, compito, bit) {
    if (!compito || typeof compito !== 'object' || typeof compito.quando !== 'string' || !QUANDO.test(compito.quando) || !Number.isSafeInteger(compito.n) || compito.n < 0) return false;
    return zeri(sha256(byte(testoCompito(compito.quando, improntaBusta(busta), compito.n)))) >= bit;
  }
  /* risolvi(busta, quando, bit, fermo) → {quando, n}. Lavora a pezzi e lascia respirare la pagina tra un pezzo e
     l'altro; fermo() vero interrompe (il modulo è stato chiuso). */
  async function risolvi(busta, quando, bit, fermo) {
    const imp = improntaBusta(busta), pausa = () => new Promise(r => setTimeout(r, 0));
    for (let n = 0; n < Number.MAX_SAFE_INTEGER; n++) {
      if (zeri(sha256(byte(testoCompito(quando, imp, n)))) >= bit) return { quando, n };
      if ((n & 2047) === 2047) { await pausa(); if (fermo && fermo()) throw Object.assign(new Error('segnalazione: fermata'), { motivo: 'fermata' }); }
    }
    throw new Error('segnalazione: compito');
  }

  return { VERSIONE, TIPO_BUSTA, MOTIVI, CHI, MAX_DESCRIZIONE, MAX_EMAIL, MAX_NOME, MAX_DATI, ID, EMAIL, prepara, controlla, cifra, apri, bustaValida,
    sha256, improntaBusta, zeri, verificaCompito, risolvi };
});
