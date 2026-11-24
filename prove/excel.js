/* Prova: i file Excel letti e scritti dall'app della redazione con codice nostro (sorgenti/moduli/excel.js; voce T-042,
   decisione del 24/11/2026: niente più SheetJS).

   1. Scrivere e rileggere: nomi dei fogli, testi con caratteri speciali e a capo, lingue diverse, numeri, vero/falso,
      date (gg/mm/aaaa, rilette come numero di serie), celle vuote al loro posto, «_x000D_» scritto da una persona che
      resta com'è; la prima riga in grassetto; nessuna formula nel file scritto. Le intestazioni alla riga 4, come nei
      registri del cap. 18, e le date con l'ora (T-043); un file salvato con una password si riconosce.
   2. Leggere file fatti da altri programmi: uno salvato da openpyxl (testi nelle celle, più fogli, date e ore) e uno
      costruito come lo salva Excel (testi condivisi, testo a pezzi con la pronuncia da scartare, formule di cui si
      legge solo il valore, errori, colonna AA, caratteri scritti come _x000D_ ed entità). I due file d'esempio stanno in
      prove/dati/, con i programmi che li hanno fatti; contengono soli testi inventati.
   3. CSV: separatore scelto dalla prima riga, virgolette, a capo dentro le virgolette, BOM.
   4. Difese: un file che non è un .xlsx, un archivio rovinato, un archivio che si gonfia oltre 60 MB, un foglio con più
      di 10.000 righe, una compressione non prevista: errore con il suo motivo, nessun blocco.
   5. Nell'app della redazione non c'è più SheetJS, né nei sorgenti né nelle uscite. */
'use strict';
const fs = require('fs');
const path = require('path');
const { RADICE, esito, eseguiDaSola } = require('./comune.js');
const X = require('../sorgenti/moduli/excel.js');

async function motivo(f) { try { await f(); return null; } catch (e) { return e.motivo || e.message; } }
const testo = b => Buffer.from(b).toString('latin1');

async function prova() {
  const e = esito('File Excel con codice nostro');
  const err = x => e.errori.push(x);

  /* 1 */
  const righe = [['Titolo', 'Prezzo', 'Data', 'Libero', 'Note'],
    ['Concerto «inventato» & amici <b>x</b> "virgolette" \'apici\'', 5.5, new Date(2026, 11, 4), true, 'a capo\ndentro'],
    ['Città d’arte · مرحبا · 😀', -3, null, false, '_x000D_ scritto da una persona'],
    [],
    ['', '', '', '', 'solo l\'ultima']];
  const b = X.scrivi([['Eventi [prova]', righe, [30, 8, 12, 6, 20]], ['Seconda', [['uno']]], ['Eventi [prova]', [['doppio nome']]]]);
  const zip = testo(b);
  if (/<f>/.test(zip)) err('scrivi: nel file scritto c\'è una formula');
  if (!/numFmtId="164" formatCode="dd\/mm\/yyyy"/.test(zip) || !/<b\/>/.test(zip)) err('scrivi: mancano il formato gg/mm/aaaa o il grassetto delle intestazioni');
  const r = await X.leggi(b, 'prova.xlsx');
  const nomi = r.fogli.map(f => f.nome);
  if (nomi.length !== 3 || nomi[0] !== 'Eventi  prova' || nomi[1] !== 'Seconda' || nomi[2] === nomi[0]) err('scrivi: nomi dei fogli inattesi ' + JSON.stringify(nomi));
  const L = r.fogli[0].righe, attesa = X.numeroData(new Date(2026, 11, 4));
  if (L[1][0] !== righe[1][0] || L[1][1] !== 5.5 || L[1][2] !== attesa || L[1][3] !== true || L[1][4] !== 'a capo\ndentro') err('rilettura della riga 2: ' + JSON.stringify(L[1]));
  if (L[2][0] !== righe[2][0] || L[2][1] !== -3 || L[2][2] !== '' || L[2][3] !== false || L[2][4] !== '_x000D_ scritto da una persona') err('rilettura della riga 3: ' + JSON.stringify(L[2]));
  if (L[3].length !== 0 || L[4].length !== 5 || L[4][4] !== 'solo l\'ultima' || L[4][0] !== '') err('rilettura: righe e celle vuote fuori posto ' + JSON.stringify(L.slice(3)));
  if (attesa !== 46360) err('numero di serie di Excel del 4/12/2026: atteso 46360, trovato ' + attesa);
  if (X.crc32(new TextEncoder().encode('123456789')) !== 0xCBF43926) err('CRC-32 sbagliato');

  /* 1 bis (T-043): intestazioni non sulla prima riga, come nei registri del cap. 18 (titolo, sottotitolo, intestazioni
     alla riga 4), e date con l'ora */
  const reg = X.scrivi([['Eventi', [['Eventi pubblicati'], ['sottotitolo'], [], ['Codice', 'Data e ora'], ['F-00001', { data: new Date(2026, 11, 4, 18, 30), ora: true }], ['F-00002', { data: new Date(2026, 11, 4) }]], [12, 15], { testa: 3 }]]);
  const zr = testo(reg);
  if (!/pane ySplit="4" topLeftCell="A5"/.test(zr) || !/numFmtId="165" formatCode="dd\/mm\/yyyy hh:mm"/.test(zr)) err('scrivi: con opzioni.testa = 3 le intestazioni stanno ferme alla riga 4, e le date con l\'ora hanno il formato gg/mm/aaaa hh:mm');
  if (!/<c r="A4" t="inlineStr" s="2">/.test(zr) || !/<c r="A1" t="inlineStr" s="2">/.test(zr) || /<c r="A5" t="inlineStr" s="2">/.test(zr)) err('scrivi: in grassetto il titolo e le intestazioni della riga 4, non le righe dei dati');
  const rr = (await X.leggi(reg, 'registro.xlsx')).fogli[0].righe;
  if (Math.abs(rr[4][1] - (X.numeroData(new Date(2026, 11, 4)) + 18.5 / 24)) > 1e-9 || rr[5][1] !== X.numeroData(new Date(2026, 11, 4)) || rr[3][0] !== 'Codice') err('rilettura delle date con l\'ora: ' + JSON.stringify(rr.slice(3)));
  /* un file salvato con una password non è uno ZIP: l'errore dice «protetto», per un messaggio chiaro */
  const cfb = Uint8Array.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1].concat(new Array(504).fill(0)));
  if (await motivo(() => X.leggi(cfb, 'Registro.xlsx')) !== 'protetto') err('un file .xlsx salvato con una password deve dare «protetto»');

  /* 2 */
  const leggiFile = f => X.leggi(fs.readFileSync(path.join(__dirname, 'dati', f)), f);
  const o = await leggiFile('excel-prova.xlsx');
  const ev = o.fogli.find(f => f.nome === 'Eventi');
  if (!ev || o.fogli[0].nome !== 'Istruzioni') err('file di openpyxl: fogli inattesi ' + JSON.stringify(o.fogli.map(f => f.nome)));
  else {
    const g = ev.righe;
    if (g[1][0] !== 'Concerto inventato & amici <prova>' || g[1][1] !== 46360 || Math.abs(g[1][2] - 21.5 / 24) > 1e-9 || g[1][3] !== 5) err('file di openpyxl, riga 2: ' + JSON.stringify(g[1]));
    if (g[2][0] !== 'Testo a pezzi' || g[2][4] !== 'a capo\ndentro la cella' || g[3].length !== 0 || g[4][4] !== 'Città d’arte · ٢٠٢٦' || g[4][6] !== true) err('file di openpyxl, righe 3-5: ' + JSON.stringify(g.slice(2)));
  }
  const c = await leggiFile('excel-testi-condivisi.xlsx'), cr = c.fogli[0] && c.fogli[0].righe;
  if (!cr || c.fogli[0].nome !== 'Eventi') err('file come Excel: foglio inatteso');
  else {
    if (cr[0][0] !== 'Titolo' || cr[0][2] !== '') err('file come Excel, riga 1: ' + JSON.stringify(cr[0]));
    if (cr[2][0] !== 'Serata inventata') err('file come Excel: il testo a pezzi deve unire i pezzi e scartare la pronuncia («' + cr[2][0] + '»)');
    if (cr[2][1] !== 8.5 || cr[2][2] !== 'ab' || cr[2][3] !== '') err('file come Excel: delle formule si legge solo il valore, gli errori diventano celle vuote ' + JSON.stringify(cr[2].slice(1, 4)));
    if (cr[2][26] !== 'riga\r\nseconda & é😀') err('file come Excel: colonna AA, _x000D_ ed entità ' + JSON.stringify(cr[2][26]));
  }

  /* 3 */
  const csv = (s, nome) => X.leggi(new TextEncoder().encode(s), nome || 'eventi.csv').then(x => x.fogli[0].righe);
  let v = await csv('﻿Titolo;Prezzo;Note\n"Uno; con punto e virgola";5;"a ""capo""\nqui"\r\nDue;;\n');
  if (JSON.stringify(v) !== JSON.stringify([['Titolo', 'Prezzo', 'Note'], ['Uno; con punto e virgola', '5', 'a "capo"\nqui'], ['Due', '', '']])) err('CSV con «;»: ' + JSON.stringify(v));
  v = await csv('a,b,c\n1,"2,5",3');
  if (JSON.stringify(v) !== JSON.stringify([['a', 'b', 'c'], ['1', '2,5', '3']])) err('CSV con «,»: ' + JSON.stringify(v));
  v = await csv('a\tb\n1\t2\n');
  if (JSON.stringify(v) !== JSON.stringify([['a', 'b'], ['1', '2']])) err('CSV con tabulazione: ' + JSON.stringify(v));

  /* 4 */
  if (await motivo(() => X.leggi(new TextEncoder().encode('non sono un foglio'), 'eventi.xlsx')) !== 'formato') err('un file .xlsx che non è un archivio deve dare «formato»');
  if (await motivo(() => X.leggi(Uint8Array.from([0x50, 0x4B, 3, 4, 1, 2, 3]), 'eventi.xlsx')) !== 'file') err('un archivio rovinato deve dare «file»');
  /* un archivio che si gonfia: 61 MB di zeri compressi in pochi KB come foglio di lavoro */
  const gonfio = async () => { const cs = new CompressionStream('deflate-raw'), w = cs.writable.getWriter(); const blocco = new Uint8Array(1 << 20);
    (async () => { for (let i = 0; i < 61; i++) await w.write(blocco); await w.close(); })();
    return new Uint8Array(await new Response(cs.readable).arrayBuffer()); };
  const z = await gonfio();
  const fintoZip = (nome, dati, metodo) => { const ok = X.scrivi([['x', [['x']]]]); const s = testo(ok);
    /* si sostituisce la prima voce (il tipo dei contenuti) con il foglio di lavoro gonfiato */
    const enc = new TextEncoder(), n = enc.encode(nome), h = Buffer.alloc(30), k = Buffer.alloc(46), e2 = Buffer.alloc(22);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(metodo, 8); h.writeUInt32LE(dati.length, 18); h.writeUInt32LE(61 << 20, 22); h.writeUInt16LE(n.length, 26);
    k.writeUInt32LE(0x02014b50, 0); k.writeUInt16LE(metodo, 10); k.writeUInt32LE(dati.length, 20); k.writeUInt32LE(61 << 20, 24); k.writeUInt16LE(n.length, 28); k.writeUInt32LE(0, 42);
    e2.writeUInt32LE(0x06054b50, 0); e2.writeUInt16LE(1, 8); e2.writeUInt16LE(1, 10); e2.writeUInt32LE(46 + n.length, 12); e2.writeUInt32LE(30 + n.length + dati.length, 16);
    void s; return Buffer.concat([h, Buffer.from(n), Buffer.from(dati), k, Buffer.from(n), e2]); };
  if (await motivo(() => X.leggi(fintoZip('xl/workbook.xml', z, 8), 'bomba.xlsx')) !== 'file') err('un archivio che si gonfia oltre 60 MB deve fermarsi con «file»');
  if (await motivo(() => X.leggi(fintoZip('xl/workbook.xml', z, 12), 'b.xlsx')) !== 'file') err('una compressione non prevista deve dare «file»');
  const molte = Array.from({ length: 10001 }, (_, i) => ['riga ' + i]);
  if (await motivo(() => X.leggi(X.scrivi([['Molte', molte]]), 'molte.xlsx')) !== 'righe') err('un foglio oltre 10.000 righe deve dare «righe»');
  if (await motivo(() => X.leggi(new TextEncoder().encode('a\n'.repeat(10002)), 'molte.csv')) !== 'righe') err('un CSV oltre 10.000 righe deve dare «righe»');

  /* 5 */
  const vendor = path.join(RADICE, 'sorgenti', 'vendor');
  if (fs.readdirSync(vendor).some(f => /sheetjs/i.test(f))) err('sorgenti/vendor/: c\'è ancora SheetJS');
  for (const app of ['pubblica', 'redazione']) {
    const dir = path.join(RADICE, 'dist', app);
    if (fs.existsSync(path.join(dir, 'lib')) && fs.readdirSync(path.join(dir, 'lib')).some(f => /sheetjs/i.test(f))) err('dist/' + app + '/lib: c\'è ancora SheetJS');
  }
  const red = fs.readFileSync(path.join(RADICE, 'dist', 'redazione', 'moduli.js'), 'utf8'), pub = fs.readFileSync(path.join(RADICE, 'dist', 'pubblica', 'moduli.js'), 'utf8');
  if (!red.includes('AGR_MODULI.excel') && !/\.excel = m/.test(red)) err('dist/redazione/moduli.js: manca il modulo Excel');
  if (/File Excel letti e scritti/.test(pub)) err('dist/pubblica/moduli.js: il modulo Excel è solo dell\'app della redazione');
  e.note.push('scritto e riletto un file con 3 fogli; letti un file di openpyxl e uno costruito come Excel; CSV con tre separatori; fermati un file finto, un archivio rovinato, uno che si gonfia a 61 MB e un foglio di 10.001 righe');
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
