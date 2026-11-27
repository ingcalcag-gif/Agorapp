/* Il controllo dei file che entrano nell'archivio dei registri (voce T-053 del piano di adeguamento; documento:
   docs/archivio.md).

   Libro mastro, § 1.1 (condizione 2: file cifrati sul dispositivo della redazione prima del caricamento, così che Bunny
   conservi soltanto contenuti illeggibili) e § 18.3 (strumento di cifratura: decisione del 17/11/2026, QB-7, strada 2,
   la password di apertura del programma dei fogli di calcolo). Decisione del 27/11/2026 (n. 1): l'archivio accetta i file
   Excel (.xlsx) e PDF chiusi con una vera password di apertura, con la cifratura AES a 128, 192 o 256 bit, e rifiuta
   tutto il resto, dicendo perché.

   Il modulo guarda soltanto il contenitore del file, senza aprirlo e senza la password: non vede nessuna riga.
   - Excel. Un file .xlsx normale è un archivio ZIP di testi leggibili. Salvato con la password di apertura, il programma
     lo chiude in un altro contenitore (il formato «Compound File» di Microsoft, MS-CFB) che ha due parti con nomi fissi:
     «EncryptionInfo», la scheda della cifratura, ed «EncryptedPackage», il file vero, illeggibile (MS-OFFCRYPTO). Il
     modulo legge la scheda: la cifratura «agile» (Excel dal 2010, versione 4.4: un testo XML con l'algoritmo, la
     lunghezza della chiave, l'impronta e i giri) o quella «standard» (versioni 2.2-4.2: AES a 128-256 bit, SHA-1,
     50.000 giri fissi; la usa per esempio LibreOffice). Un vecchio file .xls sta nello stesso contenitore ma senza
     quelle due parti: la sua password usa RC4, che si aggira, e si rifiuta.
   - PDF. Un PDF con la password di apertura ha, nel «trailer» (la coda del file), il riferimento al dizionario di
     cifratura: il modulo lo legge (filtro «Standard», versione e revisione, filtro dei contenuti) e accetta soltanto AES
     (AESV2 a 128 bit, AESV3 a 256 bit); RC4 e i contenuti lasciati in chiaro si rifiutano.

   esamina(dati, nome) → {formato, cifrato, cifratura, motivo, dettaglio}
     formato: 'xlsx', 'pdf', 'xls', 'ods', 'csv', 'zip', 'office' (un altro documento Office cifrato) o 'altro';
     cifratura: {metodo: 'AES', bit, schema: 'agile' | 'standard' | 'pdf', impronta, giri, revisione} oppure null;
     motivo: '' se il file è cifrato come si deve; altrimenti 'chiaro' (non cifrato), 'debole' (cifratura che si
     aggira, come RC4), 'formato' (un formato che l'archivio non accetta), 'rovinato' (il contenitore non torna),
     'vuoto' (nessun byte).
   Il controllo lo fanno tutti e due i lati: l'app della redazione prima di mandare il file e lo sportello dell'archivio
   (sportelli/archivio.js) prima di scriverlo.

   Nel browser si trova in window.AGR_MODULI.fileCifrati; in Node (prove, sportello) con require(). */
(function (radice, fabbrica) {
  const m = fabbrica();
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).fileCifrati = m;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const CFB = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1];
  const FINE = 0xFFFFFFFA;                 // i numeri di settore da qui in su chiudono una catena (MS-CFB, § 2.1)
  const MAX_VOCI = 4096, MAX_SETTORI = 1 << 22;
  const AES = { 0x660E: 128, 0x660F: 192, 0x6610: 256 }, RC4 = 0x6801;

  const byte = d => d instanceof Uint8Array ? d : d instanceof ArrayBuffer ? new Uint8Array(d) : ArrayBuffer.isView(d) ? new Uint8Array(d.buffer, d.byteOffset, d.byteLength) : null;
  const u16 = (b, i) => b[i] | (b[i + 1] << 8), u32 = (b, i) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;
  function guasto(dettaglio) { const e = new Error('file rovinato: ' + dettaglio); e.rovinato = true; return e; }
  const esito = (formato, motivo, dettaglio, cifratura) => ({ formato, cifrato: !!cifratura, cifratura: cifratura || null, motivo, dettaglio: dettaglio || '' });
  const estensione = nome => (String(nome || '').match(/\.([A-Za-z0-9]{1,8})$/) || ['', ''])[1].toLowerCase();

  /* ---------- Il contenitore di Office (MS-CFB) ---------- */
  function contenitore(b) {
    if (b.length < 512) throw guasto('intestazione corta');
    const sh = u16(b, 0x1E);
    if (u16(b, 0x1C) !== 0xFFFE || (sh !== 9 && sh !== 12)) throw guasto('intestazione');
    const ss = 1 << sh, ms = 1 << u16(b, 0x20), nFat = u32(b, 0x2C), dir0 = u32(b, 0x30), taglio = u32(b, 0x38), mf0 = u32(b, 0x3C), difat0 = u32(b, 0x44);
    if (ms !== 64 || nFat > MAX_SETTORI / (ss / 4) || taglio !== 4096) throw guasto('intestazione');
    const settore = n => { const o = (n + 1) * ss; if (n >= FINE || o >= b.length) throw guasto('settore fuori dal file'); return o; };
    const quattro = (o, n) => { const v = []; for (let i = 0; i < n; i++) v.push(o + i * 4 + 4 <= b.length ? u32(b, o + i * 4) : FINE + 4); return v; };
    /* la tabella dei settori (FAT): i primi 109 settori nell'intestazione, gli altri nella catena DIFAT */
    const fs = quattro(0x4C, 109).slice(0, nFat);
    for (let d = difat0, giri = 0; fs.length < nFat && d < FINE; giri++) {
      if (giri > MAX_SETTORI) throw guasto('catena DIFAT');
      const o = settore(d), v = quattro(o, ss / 4); fs.push(...v.slice(0, ss / 4 - 1).slice(0, nFat - fs.length)); d = v[ss / 4 - 1];
    }
    if (fs.length < nFat) throw guasto('tabella dei settori incompleta');
    const fat = []; for (const s of fs) fat.push(...quattro(settore(s), ss / 4));
    function catena(inizio, tab) {
      const l = [], visti = new Set();
      for (let s = inizio; s < FINE; s = tab[s]) {
        if (s >= tab.length || visti.has(s) || l.length > MAX_SETTORI) throw guasto('catena di settori');
        visti.add(s); l.push(s);
      }
      return l;
    }
    /* la cartella: voci di 128 byte con nome, tipo, figli e primo settore */
    const voci = [];
    for (const s of catena(dir0, fat)) {
      const o = settore(s);
      for (let k = 0; k + 128 <= ss && voci.length < MAX_VOCI; k += 128) {
        const q = o + k, ln = u16(b, q + 64), n = [];
        for (let i = 0; i + 1 < Math.min(ln, 64) - 1; i += 2) n.push(u16(b, q + i));
        voci.push({ nome: String.fromCharCode(...n), tipo: b[q + 66], sx: u32(b, q + 68), dx: u32(b, q + 72), figlio: u32(b, q + 76), inizio: u32(b, q + 116), dim: u32(b, q + 120), alto: u32(b, q + 124) });
      }
    }
    if (!voci.length || voci[0].tipo !== 5) throw guasto('manca la radice');
    /* i figli della radice: un albero di voci (sinistra, destra) */
    const figli = new Map(), pila = [voci[0].figlio], visti = new Set();
    while (pila.length) {
      const i = pila.pop();
      if (i >= FINE || i === 0xFFFFFFFF) continue;
      if (i >= voci.length || visti.has(i)) throw guasto('albero della cartella');
      visti.add(i); const v = voci[i]; figli.set(v.nome, v); pila.push(v.sx, v.dx);
    }
    function leggi(v, max) {
      if (v.alto || v.dim > max) throw guasto('parte troppo grande');
      const out = new Uint8Array(v.dim);
      if (v.dim < taglio) {
        /* le parti piccole stanno nel «mini stream», a pezzi di 64 byte */
        const mini = catena(voci[0].inizio, fat), mfat = [];
        for (const s of catena(mf0, fat)) mfat.push(...quattro(settore(s), ss / 4));
        let p = 0;
        for (const m of catena(v.inizio, mfat)) {
          if (p >= v.dim) break;
          const pos = m * ms, s = mini[Math.floor(pos / ss)];
          if (s === undefined) throw guasto('mini stream');
          const o = settore(s) + (pos % ss), n = Math.min(ms, v.dim - p);
          if (o + n > b.length) throw guasto('mini stream');
          out.set(b.subarray(o, o + n), p); p += n;
        }
        if (p < v.dim) throw guasto('parte tagliata');
      } else {
        let p = 0;
        for (const s of catena(v.inizio, fat)) {
          if (p >= v.dim) break;
          const o = settore(s), n = Math.min(ss, v.dim - p, b.length - o);
          out.set(b.subarray(o, o + n), p); p += n;
        }
        if (p < v.dim) throw guasto('parte tagliata');
      }
      return out;
    }
    return { figli, leggi };
  }
  /* la scheda della cifratura di Office (MS-OFFCRYPTO, § 2.3.4.10 «agile» e § 2.3.4.5 «standard») */
  function schedaOffice(info) {
    if (info.length < 8) throw guasto('scheda della cifratura');
    const mag = u16(info, 0), min = u16(info, 2);
    if (mag === 4 && min === 4) {
      const xml = new TextDecoder().decode(info.subarray(8));
      const attr = t => { const o = {}; for (const m of String(t || '').matchAll(/([A-Za-z]+)="([^"]*)"/g)) o[m[1]] = m[2]; return o; };
      const dati = attr((xml.match(/<keyData\b([^>]*)>/) || [])[1]);
      const chiave = attr((xml.match(/<(?:\w+:)?encryptedKey\b([^>]*)>/) || [])[1]);
      if (!/<keyEncryptor\b[^>]*\buri="[^"]*keyEncryptor\/password"/.test(xml) || !chiave.cipherAlgorithm) return { motivo: 'formato', dettaglio: 'cifratura senza password (con un certificato)' };
      if (dati.cipherAlgorithm !== 'AES' || chiave.cipherAlgorithm !== 'AES') return { motivo: 'debole', dettaglio: 'algoritmo ' + (dati.cipherAlgorithm || chiave.cipherAlgorithm || '?') };
      const bit = +chiave.keyBits, giri = +chiave.spinCount;
      if (![128, 192, 256].includes(bit) || +dati.keyBits !== bit) throw guasto('lunghezza della chiave');
      return { cifratura: { metodo: 'AES', bit, schema: 'agile', impronta: (chiave.hashAlgorithm || '').replace(/^SHA(\d)/, 'SHA-$1'), giri: Number.isFinite(giri) ? giri : 0 } };
    }
    if ([2, 3, 4].includes(mag) && min === 2) {
      if (info.length < 32) throw guasto('scheda della cifratura');
      const flag = u32(info, 4), alg = u32(info, 20), aes = !!(flag & 0x20);
      if (alg === RC4 || (!aes && alg === 0)) return { motivo: 'debole', dettaglio: 'RC4' };
      const bit = alg === 0 ? 128 : AES[alg];
      if (!aes || !bit) throw guasto('algoritmo');
      return { cifratura: { metodo: 'AES', bit, schema: 'standard', impronta: 'SHA-1', giri: 50000 } };
    }
    if ((mag === 3 || mag === 4) && min === 3) return { motivo: 'formato', dettaglio: 'cifratura «estensibile», non usata dai programmi di oggi' };
    throw guasto('versione della scheda ' + mag + '.' + min);
  }
  function office(b, ext) {
    const c = contenitore(b);
    const info = c.figli.get('EncryptionInfo'), pacco = c.figli.get('EncryptedPackage');
    if (!info || !pacco) {
      if (c.figli.has('Workbook') || c.figli.has('Book')) return esito('xls', 'formato', 'formato Excel 97-2003 (.xls)');
      return esito('altro', 'formato', 'documento Office di un altro tipo');
    }
    if (info.tipo !== 2 || pacco.tipo !== 2 || pacco.dim < 8 + 16) throw guasto('parti della cifratura');
    const s = schedaOffice(c.leggi(info, 65536)), formato = ext === 'xlsx' ? 'xlsx' : 'office';
    return s.cifratura ? esito(formato, '', '', s.cifratura) : esito(formato, s.motivo, s.dettaglio);
  }

  /* ---------- PDF ---------- */
  /* toglie dal testo le stringhe letterali (con le parentesi annidate e i caratteri preceduti da «\») e quelle
     esadecimali, lasciando i dizionari «<< >>»: così un byte qualunque dentro le stringhe della cifratura non si
     scambia per una chiave del dizionario */
  function senzaStringhe(t) {
    let o = '', i = 0;
    while (i < t.length) {
      const c = t[i];
      if (c === '(') {
        let liv = 1; i++;
        while (i < t.length && liv) { const d = t[i]; if (d === '\\') i += 2; else { if (d === '(') liv++; else if (d === ')') liv--; i++; } }
        o += '()';
      } else if (c === '<' && t[i + 1] !== '<') { const j = t.indexOf('>', i); i = j < 0 ? t.length : j + 1; o += '<>'; }
      else if (c === '<') { o += '<<'; i += 2; } else { o += c; i++; }
    }
    return o;
  }
  /* il dizionario che comincia in t alla posizione i («<<…>>», con quelli annidati) */
  function dizionario(t, i) {
    const a = t.indexOf('<<', i); if (a < 0) return null;
    let liv = 0;
    for (let k = a; k < t.length - 1; k++) {
      if (t[k] === '<' && t[k + 1] === '<') { liv++; k++; } else if (t[k] === '>' && t[k + 1] === '>') { liv--; k++; if (!liv) return t.slice(a, k + 1); }
    }
    return null;
  }
  function pdf(b) {
    let t = ''; for (let i = 0; i < b.length; i += 8192) t += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
    const coda = t.slice(-2048), m = coda.match(/startxref\s+(\d+)\s+%%EOF\s*$/) || [...coda.matchAll(/startxref\s+(\d+)/g)].pop();
    if (!m) throw guasto('manca startxref');
    const off = +m[1]; if (off >= t.length) throw guasto('startxref fuori dal file');
    /* la coda: dopo la tabella «xref» c'è il «trailer»; nei PDF più nuovi la tabella è un oggetto XRef con il suo dizionario */
    let trailer = null;
    if (/^\s*xref\b/.test(t.slice(off, off + 20))) { const k = t.indexOf('trailer', off); trailer = k < 0 ? null : dizionario(t, k); }
    else if (/^\s*\d+\s+\d+\s+obj\b/.test(t.slice(off, off + 40))) trailer = dizionario(t, off);
    if (!trailer) throw guasto('manca il trailer');
    const tr = senzaStringhe(trailer), rif = tr.match(/\/Encrypt\s+(\d+)\s+(\d+)\s+R\b/);
    let diz = null;
    if (rif) {
      const re = new RegExp('(^|[^0-9])' + rif[1] + '\\s+' + rif[2] + '\\s+obj\\b', 'g'); let ultimo = -1;
      for (const x of t.matchAll(re)) ultimo = x.index;
      if (ultimo < 0) throw guasto('manca il dizionario di cifratura');
      diz = dizionario(t, ultimo);
    } else if (/\/Encrypt\s*<</.test(tr)) diz = dizionario(tr, tr.indexOf('/Encrypt'));
    if (!diz) return esito('pdf', 'chiaro', 'il PDF non ha una password di apertura');
    const d = senzaStringhe(diz), nome = re => (d.match(re) || [])[1];
    if (nome(/\/Filter\s*\/(\w+)/) !== 'Standard') return esito('pdf', 'formato', 'cifratura senza password (con un certificato)');
    const v = +nome(/\/V\s+(\d+)/), r = +nome(/\/R\s+(\d+)/);
    if (v === 1 || v === 2 || v === 3) return esito('pdf', 'debole', 'RC4');
    if (v !== 4 && v !== 5) throw guasto('versione della cifratura');
    const filtro = nome(/\/StmF\s*\/(\w+)/) || 'Identity';
    if (filtro === 'Identity') return esito('pdf', 'chiaro', 'i contenuti del PDF non sono cifrati');
    const cf = d.match(new RegExp('/' + filtro + '\\s*<<([^>]*)>>')), metodo = cf && (cf[1].match(/\/CFM\s*\/(\w+)/) || [])[1];
    if (metodo === 'V2') return esito('pdf', 'debole', 'RC4');
    if (metodo === 'None') return esito('pdf', 'chiaro', 'i contenuti del PDF non sono cifrati');
    if (metodo === 'AESV2' && v === 4) return esito('pdf', '', '', { metodo: 'AES', bit: 128, schema: 'pdf', revisione: r });
    if (metodo === 'AESV3' && v === 5) return esito('pdf', '', '', { metodo: 'AES', bit: 256, schema: 'pdf', revisione: r });
    throw guasto('filtro di cifratura');
  }

  function esamina(dati, nome) {
    const b = byte(dati), ext = estensione(nome);
    if (!b) throw new Error('file cifrati: servono i byte del file');
    if (!b.length) return esito('altro', 'vuoto', 'il file è vuoto');
    try {
      if (CFB.every((x, i) => b[i] === x)) return office(b, ext);
      if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2D) return pdf(b);
      if (b[0] === 0x50 && b[1] === 0x4B && b[2] === 0x03 && b[3] === 0x04) {
        if (ext === 'xlsx') return esito('xlsx', 'chiaro', 'il file Excel non ha una password di apertura');
        if (ext === 'ods') return esito('ods', 'formato', 'formato di LibreOffice (.ods)');
        return esito('zip', 'formato', 'archivio compresso');
      }
      if (ext === 'csv') return esito('csv', 'formato', 'un CSV è testo semplice e non si può cifrare');
      return esito('altro', 'formato', 'formato non riconosciuto');
    } catch (e) {
      if (e && e.rovinato) return esito(ext === 'pdf' ? 'pdf' : ext === 'xlsx' ? 'xlsx' : 'altro', 'rovinato', e.message);
      throw e;
    }
  }
  /* come si dice a una persona: «AES a 256 bit · SHA-512 · 100.000 giri» */
  function descrivi(c) {
    if (!c) return '';
    const p = ['AES a ' + c.bit + ' bit'];
    if (c.schema === 'pdf') p.push('PDF' + (c.revisione ? ', revisione ' + c.revisione : ''));
    else { if (c.impronta) p.push(c.impronta); if (c.giri) p.push(String(c.giri).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' giri'); p.push(c.schema === 'agile' ? 'cifratura «agile» di Office' : 'cifratura «standard» di Office'); }
    return p.join(' · ');
  }

  return { esamina, descrivi };
});
