/* Chiavi della Redazione, cassaforte e marcatore (voci T-034 e T-037 del piano di adeguamento; documento:
   docs/chiavi-redazione.md). Questo modulo entra soltanto nell'app della redazione.

   Libro mastro, § 2.4 («Le chiavi»): la firma della Redazione consente soltanto di pubblicare eventi e la sua parte
   segreta non lascia il dispositivo della redazione; nessuna chiave sta nel codice, nel repository o in una chat.
   § 3.11: archivio della redazione con copia di sicurezza cifrata. § 3.14: le password degli eventi nascosti si
   cancellano quando l'evento finisce. §§ 2.4 e 6.5: marcatore invisibile negli identificativi degli eventi.

   Che cosa c'è sul dispositivo (voce «red_chiavi» della base di dati, modulo memoria.js):
   - una coppia di chiavi di FIRMA, propria di questo dispositivo: firma i pacchetti da pubblicare (blocco 9);
   - una coppia di chiavi di CIFRATURA: gli sportelli cifrano le segnalazioni con la parte pubblica, solo la Redazione
     le legge (blocco 13);
   - la chiave del REGISTRO delle fonti, diversa da quella della firma (blocchi 10 e 14);
   - la chiave del MARCATORE, da cui si ricava il segno negli identificativi degli eventi;
   - la chiave della CASSAFORTE delle password degli eventi nascosti.
   Le parti segrete sono tenute dal browser come chiavi non estraibili: l'app le può usare, ma non le può più leggere né
   copiare. L'unica copia leggibile è la COPIA DI RISERVA, fatta nel momento in cui le chiavi nascono e cifrata con una
   frase che conosce solo la Redazione: senza la frase il file è illeggibile, e la frase non si salva da nessuna parte.

   Più dispositivi. La firma è di ogni dispositivo: un secondo dispositivo riceve dalla copia di riserva le chiavi comuni
   (cifratura, registro, marcatore, cassaforte) e si crea una firma sua, che si può revocare da sola. «Ripristina» porta
   invece su un dispositivo nuovo tutte le chiavi di quello perso, firma compresa.

   Strumenti: soltanto quelli di cifratura del browser (Web Crypto). Firma: ECDSA sulla curva P-256 con SHA-256.
   Cifratura: ECDH P-256. Registro e cassaforte: AES-GCM a 256 bit. Marcatore: HMAC-SHA-256. Copia di riserva: chiave
   ricavata dalla frase con PBKDF2-SHA-256 (600.000 giri, sale casuale) e AES-GCM.

   Nel browser si trova in window.AGR_MODULI.chiavi; in Node (prove) con require(). */
(function (radice, fabbrica) {
  const m = fabbrica(radice);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).chiavi = m;
})(typeof self !== 'undefined' ? self : this, function (radice) {
  'use strict';

  const VERSIONE = 1;
  const GIRI = 600000;            // giri di PBKDF2 per la copia di riserva
  const FRASE_MIN = 20;           // lunghezza minima della frase, in caratteri
  const NOME_MAX = 40;            // lunghezza massima del nome del dispositivo
  const CURVA = 'P-256';
  const ALFABETO = 'abcdefghijklmnopqrstuvwxyz234567';   // base32 minuscolo, come negli identificativi (eventi.js)
  const ID = /^([a-z2-7]{16})-([a-z2-7]{8})$/;
  const ID_OVUNQUE = /(?<![a-z2-7])[a-z2-7]{16}-[a-z2-7]{8}(?![a-z2-7])/g;
  const TIPO_COPIA = 'copia-chiavi-redazione', TIPO_PUBBLICHE = 'chiavi-pubbliche-redazione',
    TIPO_REVOCA = 'revoca-chiave-redazione', TIPO_CASSAFORTE = 'copia-cassaforte-redazione', TIPO_REGISTRO = 'registro-fonti-redazione';

  /* Un errore con un motivo breve, che la schermata traduce in una frase. */
  function errore(motivo, dettaglio) { const e = new Error('Chiavi della Redazione, ' + motivo + (dettaglio ? ' (' + dettaglio + ')' : '')); e.motivo = motivo; return e; }

  const testoInByte = s => new TextEncoder().encode(String(s));
  const byteInTesto = b => new TextDecoder('utf-8', { fatal: true }).decode(b);
  function b64(b) { b = new Uint8Array(b); let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function daB64(s) {
    if (typeof s !== 'string' || !/^[A-Za-z0-9_-]*$/.test(s)) throw errore('file');
    const t = atob(s.replace(/-/g, '+').replace(/_/g, '/')), b = new Uint8Array(t.length);
    for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i);
    return b;
  }
  /* base32 minuscolo dei primi n caratteri (5 bit per carattere). */
  function base32(b, n) {
    let s = '', bit = 0, v = 0;
    for (let i = 0; i < b.length && s.length < n; i++) {
      v = (v << 8) | b[i]; bit += 8;
      while (bit >= 5 && s.length < n) { s += ALFABETO[(v >>> (bit - 5)) & 31]; bit -= 5; }
    }
    return s;
  }
  const esadecimale = b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');

  /* crea({cripto, deposito, ora}): le chiavi di un dispositivo.
     cripto: gli strumenti di cifratura del browser (crypto); deposito: {leggi, scrivi, togli} sulle voci «red_chiavi» e
     «red_cassaforte» (la base di dati di memoria.js; nelle prove, finto); ora: l'orologio (nelle prove, finto). */
  function crea(o) {
    o = o || {};
    const cripto = o.cripto || radice.crypto || (typeof globalThis === 'object' ? globalThis.crypto : null), dep = o.deposito, ora = o.ora || (() => Date.now());
    const sub = cripto && cripto.subtle;
    const pronto = () => { if (!sub || !dep) throw errore('browser'); };

    const casuali = n => cripto.getRandomValues(new Uint8Array(n));
    const impronta = async pubblica => { const h = esadecimale(await sub.digest('SHA-256', daB64(pubblica))).slice(0, 16); return h.replace(/(.{4})(?=.)/g, '$1 '); };

    /* ---------- La copia di riserva: tutto ciò che è segreto, cifrato con la frase ---------- */
    async function chiaveDallaFrase(frase, sale, giri) {
      const base = await sub.importKey('raw', testoInByte(frase.normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
      return sub.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: sale, iterations: giri }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    }
    async function chiudi(segreti, frase) {
      const sale = casuali(16), iv = casuali(12);
      const k = await chiaveDallaFrase(frase, sale, GIRI);
      const dati = await sub.encrypt({ name: 'AES-GCM', iv, additionalData: testoInByte(TIPO_COPIA) }, k, testoInByte(JSON.stringify(segreti)));
      return { tipo: TIPO_COPIA, v: VERSIONE, creato: new Date(ora()).toISOString(), dispositivo: segreti.dispositivo,
        kdf: { nome: 'PBKDF2', hash: 'SHA-256', giri: GIRI, sale: b64(sale) }, cifra: { nome: 'AES-GCM', iv: b64(iv) }, dati: b64(dati) };
    }
    async function apri(copia, frase) {
      if (typeof copia === 'string') { try { copia = JSON.parse(copia); } catch (e) { throw errore('file'); } }
      if (!copia || copia.tipo !== TIPO_COPIA || copia.v !== VERSIONE || !copia.kdf || !copia.cifra) throw errore('file');
      const giri = copia.kdf.giri;
      if (copia.kdf.nome !== 'PBKDF2' || copia.kdf.hash !== 'SHA-256' || !Number.isInteger(giri) || giri < 100000 || giri > 5000000 || copia.cifra.nome !== 'AES-GCM') throw errore('file');
      const k = await chiaveDallaFrase(String(frase || ''), daB64(copia.kdf.sale), giri);
      let chiaro;
      try { chiaro = await sub.decrypt({ name: 'AES-GCM', iv: daB64(copia.cifra.iv), additionalData: testoInByte(TIPO_COPIA) }, k, daB64(copia.dati)); }
      catch (e) { throw errore('frase'); }   // frase sbagliata o file alterato: non si distinguono, ed è giusto così
      let s; try { s = JSON.parse(byteInTesto(chiaro)); } catch (e) { throw errore('file'); }
      for (const c of ['firma', 'firma_pub', 'cifratura', 'cifratura_pub', 'registro', 'marcatore', 'cassaforte']) if (typeof s[c] !== 'string') throw errore('file');
      return s;
    }

    /* ---------- Dal segreto leggibile alle chiavi non estraibili ---------- */
    async function importa(s) {
      const ec = (nome, usi) => ({ name: nome, namedCurve: CURVA });
      return {
        firma: { privata: await sub.importKey('pkcs8', daB64(s.firma), ec('ECDSA'), false, ['sign']), pubblica: s.firma_pub },
        cifratura: { privata: await sub.importKey('pkcs8', daB64(s.cifratura), ec('ECDH'), false, ['deriveKey', 'deriveBits']), pubblica: s.cifratura_pub },
        registro: await sub.importKey('raw', daB64(s.registro), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']),
        marcatore: await sub.importKey('raw', daB64(s.marcatore), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
        cassaforte: await sub.importKey('raw', daB64(s.cassaforte), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
      };
    }
    async function nuovaCoppia(nome, usi) {
      const c = await sub.generateKey({ name: nome, namedCurve: CURVA }, true, usi);
      return { privata: b64(await sub.exportKey('pkcs8', c.privateKey)), pubblica: b64(await sub.exportKey('raw', c.publicKey)) };
    }

    function controllaFrase(frase, ripeti) {
      frase = String(frase == null ? '' : frase);
      if (Array.from(frase.trim()).length < FRASE_MIN) throw errore('frase-corta');
      if (ripeti !== undefined && frase !== String(ripeti)) throw errore('frase-diversa');
      return frase;
    }
    function controllaNome(nome) {
      nome = String(nome == null ? '' : nome).replace(/\s+/g, ' ').trim();
      if (!nome || Array.from(nome).length > NOME_MAX || /[\u0000-\u001F\u007F-\u009F\u2028\u2029]/.test(nome)) throw errore('nome');
      return nome;
    }

    const leggi = async () => { pronto(); const v = await dep.leggi('red_chiavi'); return v && typeof v === 'object' ? v : null; };
    async function attive() { const v = await leggi(); if (!v || !v.chiavi) throw errore('mancano'); return v; }

    /* Mette sul dispositivo le chiavi ricavate dai segreti, con la copia di riserva già cifrata. */
    async function deposita(segreti, frase, noti) {
      const copia = await chiudi(segreti, frase);
      const voce = { v: VERSIONE, dispositivo: segreti.dispositivo, creato: segreti.creato, chiavi: await importa(segreti), copia, noti: noti || [] };
      await dep.scrivi('red_chiavi', voce);
      return stato();
    }

    /* Lo stato delle chiavi, senza nulla di segreto: {ci_sono, dispositivo, creato, firma, cifratura, noti, revocata}. */
    async function stato() {
      const v = await leggi();
      if (!v || !v.chiavi) return { ci_sono: false, revocata: v && v.revocata ? v.revocata : null };
      return { ci_sono: true, dispositivo: v.dispositivo, creato: v.creato,
        firma: { pubblica: v.chiavi.firma.pubblica, impronta: await impronta(v.chiavi.firma.pubblica) },
        cifratura: { pubblica: v.chiavi.cifratura.pubblica, impronta: await impronta(v.chiavi.cifratura.pubblica) },
        noti: v.noti || [], revocata: null };
    }

    /* «Crea le chiavi»: nascono qui, una volta sola. */
    async function genera(frase, ripeti, nome) {
      pronto();
      frase = controllaFrase(frase, ripeti); nome = controllaNome(nome);
      const c = await leggi(); if (c && c.chiavi) throw errore('ci-sono');
      const f = await nuovaCoppia('ECDSA', ['sign', 'verify']), ci = await nuovaCoppia('ECDH', ['deriveKey', 'deriveBits']);
      const segreti = { dispositivo: nome, creato: new Date(ora()).toISOString(), firma: f.privata, firma_pub: f.pubblica, cifratura: ci.privata, cifratura_pub: ci.pubblica,
        registro: b64(casuali(32)), marcatore: b64(casuali(32)), cassaforte: b64(casuali(32)) };
      return deposita(segreti, frase, []);
    }

    /* Da una copia di riserva. modo «ripristina»: le stesse chiavi del dispositivo perso, firma compresa.
       modo «aggiungi»: un dispositivo in più, con le chiavi comuni della copia e una firma sua (serve il suo nome). */
    async function daCopia(copia, frase, modo, nome) {
      pronto();
      const c = await leggi(); if (c && c.chiavi) throw errore('ci-sono');
      const s = await apri(copia, frase);
      if (modo === 'ripristina') return deposita(s, String(frase), Array.isArray(s.noti) ? s.noti : []);
      if (modo !== 'aggiungi') throw errore('modo');
      nome = controllaNome(nome);
      const f = await nuovaCoppia('ECDSA', ['sign', 'verify']);
      const noti = (Array.isArray(s.noti) ? s.noti : []).concat([{ dispositivo: s.dispositivo, impronta: await impronta(s.firma_pub), pubblica: s.firma_pub }]);
      const mio = Object.assign({}, s, { dispositivo: nome, creato: new Date(ora()).toISOString(), firma: f.privata, firma_pub: f.pubblica, noti });
      return deposita(mio, String(frase), noti);
    }

    /* «Copia di riserva»: il file cifrato fatto alla nascita delle chiavi, così com'è. */
    async function copia() {
      const v = await attive();
      return { nome: 'copia-chiavi-' + v.creato.slice(0, 10) + '.json', testo: JSON.stringify(v.copia, null, 1) + '\n' };
    }
    /* Le parti pubbliche da consegnare agli sportelli: non contengono nulla di segreto. */
    async function pubbliche() {
      const s = await stato(); if (!s.ci_sono) throw errore('mancano');
      return { tipo: TIPO_PUBBLICHE, v: VERSIONE, dispositivo: s.dispositivo, creato: s.creato,
        firma: { algoritmo: 'ECDSA-P256-SHA256', pubblica: s.firma.pubblica, impronta: s.firma.impronta },
        cifratura: { algoritmo: 'ECDH-P256', pubblica: s.cifratura.pubblica, impronta: s.cifratura.impronta } };
    }
    /* L'avviso di revoca di una firma, da consegnare agli sportelli: per questo dispositivo o per un altro che si conosce. */
    function avvisoRevoca(dispositivo, impr) { return { tipo: TIPO_REVOCA, v: VERSIONE, dispositivo, impronta: impr, quando: new Date(ora()).toISOString() }; }
    /* «Revoca questo dispositivo»: le chiavi si cancellano da qui, e resta l'avviso da consegnare agli sportelli. */
    async function revoca() {
      const s = await stato(); if (!s.ci_sono) throw errore('mancano');
      const avviso = avvisoRevoca(s.dispositivo, s.firma.impronta);
      await dep.scrivi('red_chiavi', { v: VERSIONE, revocata: avviso });
      return avviso;
    }
    /* Toglie anche il ricordo della revoca: il dispositivo torna come nuovo. */
    async function dimentica() { pronto(); const v = await leggi(); if (v && v.chiavi) throw errore('ci-sono'); await dep.togli('red_chiavi'); }

    /* ---------- Firma (la usano i blocchi 9 e seguenti) ---------- */
    async function firma(dati) {
      const v = await attive();
      return b64(await sub.sign({ name: 'ECDSA', hash: 'SHA-256' }, v.chiavi.firma.privata, typeof dati === 'string' ? testoInByte(dati) : dati));
    }
    async function verifica(pubblica, dati, f) {
      try {
        const k = await sub.importKey('raw', daB64(pubblica), { name: 'ECDSA', namedCurve: CURVA }, false, ['verify']);
        return await sub.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, daB64(f), typeof dati === 'string' ? testoInByte(dati) : dati);
      } catch (e) { return false; }
    }

    /* ---------- Cifratura: le segnalazioni (blocco 13, T-052) ----------
       La busta di una segnalazione porta la parte pubblica usa e getta del telefono che l'ha chiusa
       (sorgenti/moduli/segnalazione.js): con la parte segreta di cifratura del dispositivo se ne ricava il segreto comune,
       da cui il modulo della segnalazione ricava la chiave che apre la busta. La parte segreta non esce mai di qui, e
       serve soltanto a questo (ogni chiave apre una sola porta, § 3.11). */
    async function segretoSegnalazione(effimera) {
      const v = await attive();
      const k = await sub.importKey('raw', effimera, { name: 'ECDH', namedCurve: CURVA }, false, []);
      return sub.deriveBits({ name: 'ECDH', public: k }, v.chiavi.cifratura.privata, 256);
    }

    /* ---------- Marcatore (T-037) ----------
       L'identificativo di un evento: 16 caratteri a caso, un trattino e 8 caratteri di segno, ricavati dalla parte a
       caso con la chiave del marcatore. Il segno è uguale per tutti, non dice nulla a chi lo guarda e lo può verificare
       soltanto chi ha la chiave. */
    async function segno(parte) {
      const v = await attive();
      return base32(new Uint8Array(await sub.sign('HMAC', v.chiavi.marcatore, testoInByte('evento:' + parte))), 8);
    }
    async function nuovoId() { const parte = base32(casuali(10), 16); return parte + '-' + await segno(parte); }
    /* «Viene dal nostro archivio?» per un identificativo. */
    async function viene(id) { const m = String(id).match(ID); return !!m && await segno(m[1]) === m[2]; }
    /* Lo stesso per un testo o un file copiato: cerca tutti gli identificativi e li controlla uno per uno. */
    async function controllaTesto(testo) {
      const trovati = [...new Set(String(testo).match(ID_OVUNQUE) || [])], nostri = [], altri = [];
      for (const id of trovati) (await viene(id) ? nostri : altri).push(id);
      return { trovati: trovati.length, nostri, altri };
    }

    /* ---------- Cassaforte delle password degli eventi nascosti ----------
       Voce «red_cassaforte»: {v, voci: {idEvento: {iv, dati, fine}}}. Ogni password è cifrata con la chiave della
       cassaforte e legata al suo evento; «fine» è il momento in cui l'evento finisce: da allora la voce si cancella. */
    async function voci() { const c = await dep.leggi('red_cassaforte'); return c && c.voci && typeof c.voci === 'object' ? c.voci : {}; }
    const salvaVoci = v => dep.scrivi('red_cassaforte', { v: VERSIONE, voci: v });
    async function mettiPassword(idEvento, password, fineMs) {
      const v = await attive();
      if (typeof idEvento !== 'string' || !idEvento || typeof password !== 'string' || !password || !Number.isFinite(fineMs)) throw errore('cassaforte');
      const iv = casuali(12), tutte = await voci();
      tutte[idEvento] = { iv: b64(iv), fine: fineMs,
        dati: b64(await sub.encrypt({ name: 'AES-GCM', iv, additionalData: testoInByte(idEvento) }, v.chiavi.cassaforte, testoInByte(password))) };
      await salvaVoci(tutte);
    }
    async function leggiPassword(idEvento) {
      const v = await attive(), x = (await voci())[idEvento];
      if (!x || x.fine <= ora()) return null;
      try { return byteInTesto(await sub.decrypt({ name: 'AES-GCM', iv: daB64(x.iv), additionalData: testoInByte(idEvento) }, v.chiavi.cassaforte, daB64(x.dati))); }
      catch (e) { return null; }   // scritta con un'altra chiave: illeggibile
    }
    async function togliPassword(idEvento) { const tutte = await voci(); if (idEvento in tutte) { delete tutte[idEvento]; await salvaVoci(tutte); } }
    /* Cancella le password degli eventi finiti. Si chiama a ogni apertura dell'app della redazione. */
    async function pulisciCassaforte() {
      pronto();
      const tutte = await voci(), via = Object.keys(tutte).filter(k => !(tutte[k] && tutte[k].fine > ora()));
      if (via.length) { via.forEach(k => delete tutte[k]); await salvaVoci(tutte); }
      return { cancellate: via.length, restano: Object.keys(tutte).length };
    }
    /* La copia di sicurezza della cassaforte: le voci restano cifrate, e senza le chiavi non si leggono. */
    async function copiaCassaforte() {
      await pulisciCassaforte();
      return { nome: 'copia-cassaforte-' + new Date(ora()).toISOString().slice(0, 10) + '.json', testo: JSON.stringify({ tipo: TIPO_CASSAFORTE, v: VERSIONE, creato: new Date(ora()).toISOString(), voci: await voci() }, null, 1) + '\n' };
    }
    /* Riporta nella cassaforte le voci di una copia che queste chiavi sanno aprire e che non sono finite. */
    async function ripristinaCassaforte(testo) {
      const v = await attive();
      let c; try { c = JSON.parse(testo); } catch (e) { throw errore('file'); }
      if (!c || c.tipo !== TIPO_CASSAFORTE || c.v !== VERSIONE || !c.voci || typeof c.voci !== 'object') throw errore('file');
      const tutte = await voci(); let rientrate = 0, scartate = 0;
      for (const [id, x] of Object.entries(c.voci)) {
        try {
          if (!(x.fine > ora())) throw 0;
          await sub.decrypt({ name: 'AES-GCM', iv: daB64(x.iv), additionalData: testoInByte(id) }, v.chiavi.cassaforte, daB64(x.dati));
          tutte[id] = { iv: x.iv, dati: x.dati, fine: x.fine }; rientrate++;
        } catch (e) { scartate++; }
      }
      await salvaVoci(tutte);
      return { rientrate, scartate };
    }

    /* ---------- Registro delle fonti: la sua chiave cifra e non fa altro (T-041, T-043; cap. 22; § 3.11) ----------
       cifra(testo) → busta {tipo, v, iv, dati}; decifra(busta) → il testo. Una busta scritta con un'altra chiave, o
       rovinata, dà l'errore «registro»: non si legge a pezzi. La busta è ciò che resta sul dispositivo e ciò che si
       deposita nell'archivio riservato: chi la trova senza la chiave del registro non ne ricava nulla. */
    async function cifraRegistro(testo) {
      const v = await attive();
      if (typeof testo !== 'string') throw errore('registro');
      const iv = casuali(12);
      return { tipo: TIPO_REGISTRO, v: VERSIONE, iv: b64(iv),
        dati: b64(await sub.encrypt({ name: 'AES-GCM', iv, additionalData: testoInByte(TIPO_REGISTRO) }, v.chiavi.registro, testoInByte(testo))) };
    }
    async function decifraRegistro(busta) {
      const v = await attive();
      if (!busta || busta.tipo !== TIPO_REGISTRO || typeof busta.iv !== 'string' || typeof busta.dati !== 'string') throw errore('registro');
      try { return byteInTesto(await sub.decrypt({ name: 'AES-GCM', iv: daB64(busta.iv), additionalData: testoInByte(TIPO_REGISTRO) }, v.chiavi.registro, daB64(busta.dati))); }
      catch (e) { throw errore('registro'); }
    }
    /* La voce «red_registro» del dispositivo: la busta del registro. leggi() dà il testo, o null se il registro non è
       ancora nato; scrivi(testo) lo cifra e lo conserva, e restituisce la busta; busta() dà la busta così com'è, per
       depositarla nell'archivio riservato. */
    async function leggiRegistro() { await attive(); const b = await dep.leggi('red_registro'); return b ? decifraRegistro(b) : null; }
    async function scriviRegistro(testo) { const b = await cifraRegistro(testo); await dep.scrivi('red_registro', b); return b; }
    async function bustaRegistro() { return (await dep.leggi('red_registro')) || null; }

    return { stato, genera, daCopia, copia, pubbliche, revoca, dimentica, avvisoRevoca, firma, verifica, segretoSegnalazione, nuovoId, viene, controllaTesto,
      registro: { cifra: cifraRegistro, decifra: decifraRegistro, leggi: leggiRegistro, scrivi: scriviRegistro, busta: bustaRegistro },
      cassaforte: { metti: mettiPassword, leggi: leggiPassword, togli: togliPassword, pulisci: pulisciCassaforte, copia: copiaCassaforte, ripristina: ripristinaCassaforte } };
  }

  return { VERSIONE, GIRI, FRASE_MIN, NOME_MAX, ID, TIPO_COPIA, TIPO_PUBBLICHE, TIPO_REVOCA, TIPO_CASSAFORTE, TIPO_REGISTRO, crea };
});
