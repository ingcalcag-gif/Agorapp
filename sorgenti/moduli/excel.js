/* File Excel letti e scritti dall'app della redazione, senza librerie di terzi (voce T-042 del piano di adeguamento;
   decisione del 24/11/2026: codice nostro al posto di SheetJS 0.18.5, che aveva difetti di sicurezza noti).

   Un file .xlsx è un archivio ZIP di testi XML. Il modulo:
   - leggi(dati, nome) → {fogli: [{nome, righe}]}: legge i fogli di un .xlsx (testi condivisi, testi scritti nella
     cella, numeri, vero/falso) oppure un .csv (separatore «;», «,» o tabulazione, scelto dalla prima riga). Le date
     restano numeri di serie di Excel: chi legge le trasforma (leggiData e leggiOra degli strumenti della redazione).
     Formule: si legge il valore calcolato che il file porta con sé, mai la formula;
   - scrivi(fogli) → i byte di un .xlsx: fogli = [[nome, righe, larghezze, opzioni]]; nelle righe testi, numeri,
     vero/falso, date (oggetti Date, scritti come gg/mm/aaaa) e date con l'ora ({data: Date, ora: true}, scritte come
     gg/mm/aaaa hh:mm). La riga delle intestazioni è in grassetto e resta ferma in cima: di solito è la prima;
     opzioni.testa dice quale è, contando da 0, quando sopra ci sono il titolo e il sottotitolo del foglio, come nei
     registri del cap. 18 del libro mastro (intestazioni alla riga 4). I testi si scrivono sempre come testo: in un
     .xlsx una cella di testo non diventa mai una formula.
   Il file letto non si conserva: il modulo restituisce le righe e basta.

   Difese contro i file costruiti per far danni: al più 20 MB di file e 60 MB di testo una volta aperto (un archivio
   che si gonfia oltre si ferma a metà); al più 10.000 righe e 200 colonne per foglio; solo i metodi di compressione
   «nessuna» e «deflate»; nessuna entità XML esterna (l'XML si legge con espressioni semplici, non con un lettore che
   le risolverebbe). Un file che non rispetta la forma dà l'errore con motivo «file»; un file .xlsx salvato con una
   password (che i programmi chiudono in un contenitore cifrato, non in uno ZIP) dà l'errore con motivo «protetto».

   Gli indirizzi «schemas.openxmlformats.org» che si leggono qui sotto sono i nomi del formato che ogni file .xlsx deve
   portare dentro di sé: nessuno li chiede alla rete (prove/indirizzi.js li ammette per questo solo file).

   Nel browser si trova in window.AGR_MODULI.excel, dopo testo.js; in Node (prove) con require(). Usa
   DecompressionStream, che hanno i browser recenti e Node dalla versione 18. */
(function (radice, fabbrica) {
  const nodo = typeof module === 'object' && module.exports && typeof require === 'function';
  const m = fabbrica(nodo ? require('./testo.js') : (radice.AGR_MODULI || {}).testo);
  if (nodo) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).excel = m;
})(typeof self !== 'undefined' ? self : this, function (T) {
  'use strict';
  if (!T || typeof T.esc !== 'function') throw new Error('excel: serve prima testo.js');
  const MAX_FILE = 20e6, MAX_APERTO = 60e6, MAX_RIGHE = 10000, MAX_COLONNE = 200, MAX_FOGLI = 50;
  const MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  function errore(motivo, dettaglio) { const e = new Error('Excel, ' + motivo + (dettaglio ? ' (' + dettaglio + ')' : '')); e.motivo = motivo; return e; }
  const byte = d => d instanceof Uint8Array ? d : d instanceof ArrayBuffer ? new Uint8Array(d) : ArrayBuffer.isView(d) ? new Uint8Array(d.buffer, d.byteOffset, d.byteLength) : null;
  const u16 = (b, i) => b[i] | (b[i + 1] << 8), u32 = (b, i) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;

  /* ---------- CRC-32 (per scrivere lo ZIP) ---------- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

  /* ---------- Leggere lo ZIP ---------- */
  async function gonfia(dati, resta) {
    if (typeof DecompressionStream !== 'function') throw errore('browser', 'manca DecompressionStream');
    const ds = new DecompressionStream('deflate-raw'), w = ds.writable.getWriter(), r = ds.readable.getReader(), pezzi = [];
    w.write(dati).catch(() => {}); w.close().catch(() => {});
    let n = 0;
    for (;;) {
      let x; try { x = await r.read(); } catch (e) { throw errore('file', 'compressione rovinata'); }
      if (x.done) break;
      n += x.value.length;
      if (n > resta) { r.cancel().catch(() => {}); throw errore('file', 'troppo grande una volta aperto'); }
      pezzi.push(x.value);
    }
    const out = new Uint8Array(n); let k = 0; for (const p of pezzi) { out.set(p, k); k += p.length; }
    return out;
  }
  /* → Map nome → funzione che dà i byte; si apre solo ciò che serve */
  function zip(b) {
    if (b.length < 22 || b.length > MAX_FILE) throw errore('file', b.length > MAX_FILE ? 'oltre 20 MB' : 'troppo corto');
    let e = -1; for (let i = b.length - 22; i >= Math.max(0, b.length - 22 - 65535); i--) if (u32(b, i) === 0x06054b50) { e = i; break; }
    if (e < 0) throw errore('file', 'non è un archivio ZIP');
    const n = u16(b, e + 10), dir = u32(b, e + 16), voci = new Map();
    let aperto = 0;
    for (let i = 0, p = dir; i < n; i++) {
      if (p + 46 > b.length || u32(b, p) !== 0x02014b50) throw errore('file', 'indice dello ZIP rovinato');
      const metodo = u16(b, p + 10), compresso = u32(b, p + 20), pieno = u32(b, p + 24), ln = u16(b, p + 28), lx = u16(b, p + 30), lc = u16(b, p + 32), loc = u32(b, p + 42);
      const nome = new TextDecoder().decode(b.subarray(p + 46, p + 46 + ln));
      p += 46 + ln + lx + lc;
      voci.set(nome, async () => {
        if (loc + 30 > b.length || u32(b, loc) !== 0x04034b50) throw errore('file', 'voce dello ZIP rovinata');
        const ini = loc + 30 + u16(b, loc + 26) + u16(b, loc + 28), dati = b.subarray(ini, ini + compresso);
        if (dati.length !== compresso) throw errore('file', 'voce dello ZIP tagliata');
        const resta = MAX_APERTO - aperto;
        let out;
        if (metodo === 0) { if (compresso > resta) throw errore('file', 'troppo grande una volta aperto'); out = dati.slice(); }
        else if (metodo === 8) out = await gonfia(dati, Math.min(resta, pieno ? pieno + 1024 : resta));
        else throw errore('file', 'compressione non prevista');
        aperto += out.length;
        return out;
      });
    }
    return voci;
  }

  /* ---------- XML: le poche cose che servono, senza un lettore XML ---------- */
  const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  const daXml = s => s.replace(/&(#x[0-9a-fA-F]{1,6}|#\d{1,7}|amp|lt|gt|quot|apos);/g, (_, x) => {
    if (x[0] !== '#') return ENT[x];
    const c = x[1] === 'x' ? parseInt(x.slice(2), 16) : parseInt(x.slice(1), 10);
    return c > 0 && c <= 0x10FFFF && !(c >= 0xD800 && c <= 0xDFFF) ? String.fromCodePoint(c) : '';
  }).replace(/_x([0-9A-Fa-f]{4})_/g, (_, h) => String.fromCharCode(parseInt(h, 16)));   // i caratteri che Excel scrive come _x000D_
  const attributo = (tag, nome) => { const m = tag.match(new RegExp('\\s' + nome + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')')); return m ? daXml(m[2] != null ? m[2] : m[3]) : null; };
  /* il testo di un <si> o di un <is>: tutti i <t>, tranne quelli della pronuncia (<rPh>) */
  const testiT = x => [...x.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)].map(m => daXml(m[1])).join('');
  const colonna = lettere => { let n = 0; for (const ch of lettere) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };

  async function leggiXlsx(b) {
    const v = zip(b), testo = async nome => { const f = v.get(nome); return f ? new TextDecoder().decode(await f()) : null; };
    const wb = await testo('xl/workbook.xml'); if (wb == null) throw errore('file', 'manca il foglio di lavoro');
    const rels = (await testo('xl/_rels/workbook.xml.rels')) || '', dove = {};
    for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) { const id = attributo(m[0], 'Id'), t = attributo(m[0], 'Target'); if (id && t) dove[id] = t.startsWith('/') ? t.slice(1) : 'xl/' + t.replace(/^\.\//, ''); }
    const comuni = [], ss = await testo('xl/sharedStrings.xml');
    if (ss) for (const m of ss.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>|<si\b[^>]*\/>/g)) comuni.push(m[1] ? testiT(m[1]) : '');
    const fogli = [];
    for (const m of [...wb.matchAll(/<sheet\b[^>]*\/?>/g)].slice(0, MAX_FOGLI)) {
      const nome = attributo(m[0], 'name') || '', id = attributo(m[0], 'r:id'), xml = id && dove[id] ? await testo(dove[id]) : null;
      if (xml == null) continue;
      const righe = []; let ultima = -1;
      for (const r of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
        const nr = attributo(r[0].slice(0, r[0].indexOf('>') + 1), 'r'), i = nr ? parseInt(nr, 10) - 1 : ultima + 1;
        if (!(i >= 0) || i >= MAX_RIGHE) { if (i >= MAX_RIGHE) throw errore('righe', 'oltre ' + MAX_RIGHE + ' righe'); continue; }
        ultima = i; const riga = []; let uc = -1;
        for (const c of (r[2] || '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
          const ref = attributo(' ' + c[1], 'r'), t = attributo(' ' + c[1], 't') || 'n', dentro = c[2] || '';
          const j = ref && /^[A-Z]{1,3}\d+$/.test(ref) ? colonna(ref.match(/^[A-Z]+/)[0]) : uc + 1; uc = j;
          if (j >= MAX_COLONNE) continue;
          const vv = (dentro.match(/<v>([^<]*)<\/v>/) || [])[1];
          let x = '';
          if (t === 's') x = vv != null ? (comuni[parseInt(vv, 10)] ?? '') : '';
          else if (t === 'inlineStr') { const is = dentro.match(/<is>([\s\S]*?)<\/is>/); x = is ? testiT(is[1]) : ''; }
          else if (t === 'str' || t === 'd') x = vv != null ? daXml(vv) : '';
          else if (t === 'b') x = vv === '1';
          else if (t === 'e') x = '';
          else if (vv != null && vv.trim() !== '') { const n = Number(vv); x = Number.isFinite(n) ? n : daXml(vv); }
          riga[j] = x;
        }
        for (let k = 0; k < riga.length; k++) if (riga[k] === undefined) riga[k] = '';
        righe[i] = riga;
      }
      for (let k = 0; k < righe.length; k++) if (!righe[k]) righe[k] = [];
      fogli.push({ nome, righe });
    }
    if (!fogli.length) throw errore('file', 'nessun foglio');
    return { fogli };
  }

  /* ---------- CSV ---------- */
  function leggiCsv(testo) {
    testo = String(testo).replace(/^\uFEFF/, '');
    const prima = testo.split(/\r?\n/, 1)[0] || '', conta = s => prima.split(s).length;
    const sep = [';', ',', '\t'].reduce((a, s) => conta(s) > conta(a) ? s : a, ';');
    const righe = []; let riga = [], cella = '', q = false;
    for (let i = 0; i < testo.length; i++) {
      const ch = testo[i];
      if (q) { if (ch === '"') { if (testo[i + 1] === '"') { cella += '"'; i++; } else q = false; } else cella += ch; continue; }
      if (ch === '"' && cella === '') q = true;
      else if (ch === sep) { riga.push(cella); cella = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && testo[i + 1] === '\n') i++; riga.push(cella); righe.push(riga); riga = []; cella = ''; if (righe.length > MAX_RIGHE) throw errore('righe', 'oltre ' + MAX_RIGHE + ' righe'); }
      else cella += ch;
    }
    if (cella !== '' || riga.length) { riga.push(cella); righe.push(riga); }
    return righe.map(r => r.slice(0, MAX_COLONNE));
  }

  async function leggi(dati, nome) {
    const b = byte(dati); if (!b) throw errore('file', 'dati mancanti');
    if (b.length > MAX_FILE) throw errore('file', 'oltre 20 MB');
    /* un file salvato con una password: il contenitore cifrato dei programmi per ufficio, non uno ZIP */
    if (b.length >= 8 && b[0] === 0xD0 && b[1] === 0xCF && b[2] === 0x11 && b[3] === 0xE0 && b[4] === 0xA1 && b[5] === 0xB1 && b[6] === 0x1A && b[7] === 0xE1 && !/\.csv$/i.test(nome || '')) throw errore('protetto', 'il file si apre con una password');
    if (/\.csv$/i.test(nome || '') || !(b[0] === 0x50 && b[1] === 0x4B)) {
      if (!/\.csv$/i.test(nome || '') && /\.(xlsx|xlsm|ods|xls)$/i.test(nome || '')) throw errore('formato', 'non è un file .xlsx');
      return { fogli: [{ nome: 'csv', righe: leggiCsv(new TextDecoder().decode(b)) }] };
    }
    return leggiXlsx(b);
  }

  /* ---------- Scrivere ---------- */
  /* un testo dentro l'XML: tolti i caratteri che l'XML non ammette, protetto «_x…_» come lo scrive Excel, e i caratteri
     speciali protetti dall'unica funzione dell'app che lo fa (testo.js, T-024) */
  const aXml = s => T.esc(String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '').replace(/_x([0-9A-Fa-f]{4})_/g, '_x005F_x$1_'));
  const lettere = j => { let s = ''; j++; while (j > 0) { const r = (j - 1) % 26; s = String.fromCharCode(65 + r) + s; j = Math.floor((j - 1) / 26); } return s; };
  /* il numero di serie di Excel di un giorno (solo la data, senza fuso: 0 = 30/12/1899) */
  const numeroData = d => (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(1899, 11, 30)) / 864e5;
  /* lo stesso con l'ora del dispositivo, al minuto (la parte dopo la virgola sono le ore del giorno) */
  const numeroDataOra = d => (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()) - Date.UTC(1899, 11, 30)) / 864e5;
  function foglioXml(righe, larghezze, testa) {
    testa = Number.isInteger(testa) && testa >= 0 ? testa : 0;
    const cols = (larghezze || []).length ? '<cols>' + larghezze.map((w, j) => `<col min="${j + 1}" max="${j + 1}" width="${Math.max(1, Math.min(255, +w || 10))}" customWidth="1"/>`).join('') + '</cols>' : '';
    const dati = righe.map((r, i) => `<row r="${i + 1}">` + (r || []).map((c, j) => {
      const ref = lettere(j) + (i + 1), st = i === 0 || i === testa ? ' s="2"' : '';
      if (c === null || c === undefined || c === '') return '';
      if (c instanceof Date) return isNaN(c) ? '' : `<c r="${ref}" s="1"><v>${numeroData(c)}</v></c>`;
      if (typeof c === 'object' && c.data instanceof Date) return isNaN(c.data) ? '' : c.ora ? `<c r="${ref}" s="3"><v>${numeroDataOra(c.data)}</v></c>` : `<c r="${ref}" s="1"><v>${numeroData(c.data)}</v></c>`;
      if (typeof c === 'object') return '';
      if (typeof c === 'number') return Number.isFinite(c) ? `<c r="${ref}"${st}><v>${c}</v></c>` : '';
      if (typeof c === 'boolean') return `<c r="${ref}" t="b"${st}><v>${c ? 1 : 0}</v></c>`;
      return `<c r="${ref}" t="inlineStr"${st}><is><t xml:space="preserve">${aXml(c)}</t></is></c>`;
    }).join('') + '</row>').join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      + `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${testa + 1}" topLeftCell="A${testa + 2}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
      + cols + '<sheetData>' + dati + '</sheetData></worksheet>';
  }
  function zipScrivi(voci) {
    const enc = new TextEncoder(), locali = [], centrali = []; let off = 0;
    const d = new Date(), tempo = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), giorno = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (const [nome, testo] of voci) {
      const n = enc.encode(nome), dati = enc.encode(testo), c = crc32(dati);
      const h = new Uint8Array(30 + n.length), v = new DataView(h.buffer);
      v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(6, 0x0800, true); v.setUint16(8, 0, true); v.setUint16(10, tempo, true); v.setUint16(12, giorno, true);
      v.setUint32(14, c, true); v.setUint32(18, dati.length, true); v.setUint32(22, dati.length, true); v.setUint16(26, n.length, true); v.setUint16(28, 0, true); h.set(n, 30);
      const k = new Uint8Array(46 + n.length), w = new DataView(k.buffer);
      w.setUint32(0, 0x02014b50, true); w.setUint16(4, 20, true); w.setUint16(6, 20, true); w.setUint16(8, 0x0800, true); w.setUint16(10, 0, true); w.setUint16(12, tempo, true); w.setUint16(14, giorno, true);
      w.setUint32(16, c, true); w.setUint32(20, dati.length, true); w.setUint32(24, dati.length, true); w.setUint16(28, n.length, true); w.setUint32(42, off, true); k.set(n, 46);
      locali.push(h, dati); centrali.push(k); off += h.length + dati.length;
    }
    const lc = centrali.reduce((s, x) => s + x.length, 0), e = new Uint8Array(22), z = new DataView(e.buffer);
    z.setUint32(0, 0x06054b50, true); z.setUint16(8, voci.length, true); z.setUint16(10, voci.length, true); z.setUint32(12, lc, true); z.setUint32(16, off, true);
    const tutti = locali.concat(centrali, [e]), out = new Uint8Array(tutti.reduce((s, x) => s + x.length, 0)); let p = 0;
    for (const x of tutti) { out.set(x, p); p += x.length; }
    return out;
  }
  function scrivi(fogli) {
    if (!Array.isArray(fogli) || !fogli.length) throw errore('fogli');
    const nomi = [], visti = new Set();
    fogli.forEach(([n], i) => { let s = String(n || 'Foglio ' + (i + 1)).replace(/[\[\]:*?/\\]/g, ' ').slice(0, 31).trim() || 'Foglio ' + (i + 1);
      while (visti.has(s.toLowerCase())) s = s.slice(0, 28) + ' ' + (i + 1); visti.add(s.toLowerCase()); nomi.push(s); });
    const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    const voci = [
      ['[Content_Types].xml', X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'
        + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        + nomi.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') + '</Types>'],
      ['_rels/.rels', X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', X + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
        + nomi.map((n, i) => `<sheet name="${aXml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + nomi.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')
        + `<Relationship Id="rId${nomi.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
      ['xl/styles.xml', X + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy hh:mm"/></numFmts>'
        + '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
        + '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders>'
        + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        + '<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
        + '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>']
    ].concat(fogli.map(([, righe, larghezze, opz], i) => [`xl/worksheets/sheet${i + 1}.xml`, foglioXml(righe || [], larghezze, (opz || {}).testa)]));
    return zipScrivi(voci);
  }

  return { MAX_FILE, MAX_RIGHE, MAX_COLONNE, MIME, leggi, leggiCsv, scrivi, numeroData, numeroDataOra, crc32 };
});
