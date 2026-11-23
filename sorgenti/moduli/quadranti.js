/* Quadranti e indice dell'archivio degli eventi (voce T-021 del piano di adeguamento; docs/formato-eventi.md).

   L'Italia è divisa da una griglia fissa in quadranti di circa 50 km di lato (libro mastro § 2.4, «La lettura degli
   eventi»): 0,45 gradi di latitudine (50 km) per 0,6 di longitudine (da 54 km in Sicilia a 45 km in Alto Adige).
   Ogni quadrante ha il file dei propri eventi futuri; un indice piccolo dice la versione di ogni quadrante e quanti
   eventi ci sono in ogni regione. Lo stesso modulo serve a chi scrive l'archivio (oggi lo strumento dell'archivio di
   prova, poi lo sportello di pubblicazione) e all'app pubblica, che lo legge (T-022).

   Nel browser si trova in window.AGR_MODULI.quadranti (dopo eventi.js); in Node con require(). */
(function (radice, fabbrica) {
  const nodo = typeof module === 'object' && module.exports && typeof require === 'function';
  const m = fabbrica(nodo ? require('./eventi.js') : (radice.AGR_MODULI || {}).eventi);
  if (nodo) module.exports = m;
  else (radice.AGR_MODULI = radice.AGR_MODULI || {}).quadranti = m;
})(typeof self !== 'undefined' ? self : this, function (E) {
  'use strict';
  if (!E) throw new Error('quadranti.js: serve prima eventi.js');

  /* La griglia. Non cambia: se cambiasse, cambierebbero i nomi di tutti i file (versione 2). Gradi in milionesimi,
     per fare i conti con numeri interi e assegnare sempre lo stesso quadrante a un punto sul bordo. */
  const GRIGLIA = { versione: 1, ovest: 6.5, sud: 35.4, passo_lat: 0.45, passo_lng: 0.6, righe: 27, colonne: 21 };
  const U = 1e6, O = Math.round(GRIGLIA.ovest * U), S = Math.round(GRIGLIA.sud * U),
    PL = Math.round(GRIGLIA.passo_lat * U), PG = Math.round(GRIGLIA.passo_lng * U);
  if (GRIGLIA.sud + GRIGLIA.righe * GRIGLIA.passo_lat - E.RIQUADRO.nord > 1e-9 || GRIGLIA.ovest + GRIGLIA.colonne * GRIGLIA.passo_lng - E.RIQUADRO.est > 1e-9)
    throw new Error('quadranti.js: la griglia non coincide con il riquadro di eventi.js');
  const ID = /^q(\d{2})-(\d{2})$/;
  const pad = n => (n < 10 ? '0' : '') + n;
  const nome = (r, c) => 'q' + pad(r) + '-' + pad(c);

  /* Il quadrante di un punto: «q21-01» (riga 21 da sud, colonna 1 da ovest), oppure null fuori dalla griglia. */
  function quadrante(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const r = Math.floor((Math.round(lat * U) - S) / PL), c = Math.floor((Math.round(lng * U) - O) / PG);
    return r >= 0 && r < GRIGLIA.righe && c >= 0 && c < GRIGLIA.colonne ? nome(r, c) : null;
  }
  function rigaColonna(id) {
    const m = typeof id === 'string' && id.match(ID); if (!m) return null;
    const r = +m[1], c = +m[2];
    return r < GRIGLIA.righe && c < GRIGLIA.colonne ? [r, c] : null;
  }
  /* Confini di un quadrante in gradi: {ovest, sud, est, nord}. */
  function confini(id) {
    const rc = rigaColonna(id); if (!rc) return null;
    return { ovest: (O + rc[1] * PG) / U, sud: (S + rc[0] * PL) / U, est: (O + (rc[1] + 1) * PG) / U, nord: (S + (rc[0] + 1) * PL) / U };
  }
  /* Il quadrante e gli otto intorno (quelli che esistono nella griglia), dal centro: è ciò che il telefono scarica. */
  function intorno(id) {
    const rc = rigaColonna(id); if (!rc) return [];
    const out = [id];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const r = rc[0] + dr, c = rc[1] + dc;
      if ((dr || dc) && r >= 0 && r < GRIGLIA.righe && c >= 0 && c < GRIGLIA.colonne) out.push(nome(r, c));
    }
    return out;
  }

  /* ---------- Regioni: il punto in quale regione cade (sorgenti/dati/regioni.json, da Natural Earth) ---------- */
  function dentroAnelli(lng, lat, anelli) {   // regola pari-dispari: il primo anello è il contorno, gli altri sono buchi
    let dentro = false;
    for (const a of anelli) for (let i = 0, j = a.length - 1; i < a.length; j = i++) {
      const [xi, yi] = a[i], [xj, yj] = a[j];
      if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) dentro = !dentro;
    }
    return dentro;
  }
  const KM_LAT = 111.32;
  function distanzaKm(lng, lat, anelli) {   // distanza dal bordo più vicino, approssimata sul piano locale
    const kx = KM_LAT * Math.cos(lat * Math.PI / 180);
    let min = Infinity;
    for (const a of anelli) for (let i = 1; i < a.length; i++) {
      const ax = (a[i - 1][0] - lng) * kx, ay = (a[i - 1][1] - lat) * KM_LAT, bx = (a[i][0] - lng) * kx, by = (a[i][1] - lat) * KM_LAT;
      const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
      const t = l ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / l)) : 0;
      min = Math.min(min, Math.hypot(ax + t * dx, ay + t * dy));
    }
    return min;
  }
  /* La regione di un punto. Un punto in mare vicino alla costa (un molo, un'isola minore che la semplificazione dei
     confini ha tolto) va alla regione più vicina entro 40 km (le isole Ponziane distano più di 30 km dalla costa); più lontano, nessuna. */
  function regione(lat, lng, regioni) {
    let vicina = null, dMin = 40;
    for (const r of regioni) {
      if (r.poligoni.some(p => dentroAnelli(lng, lat, p))) return r.nome;
      const d = Math.min(...r.poligoni.map(p => distanzaKm(lng, lat, p)));
      if (d < dMin) { dMin = d; vicina = r.nome; }
    }
    return vicina;
  }

  /* Un'impronta breve del contenuto di un file (FNV-1a e un mescolamento alla Murmur, 32 bit ciascuno): cambia quando
     cambia il file. Non è una misura di sicurezza: serve al telefono per capire se un quadrante è cambiato. */
  function impronta(testo) {
    let a = 0x811c9dc5, b = 0x050c5d1f;
    for (let i = 0; i < testo.length; i++) {
      const c = testo.charCodeAt(i);
      a = Math.imul(a ^ c, 0x01000193) >>> 0;
      b = Math.imul(b ^ c, 0x5bd1e995); b = (b ^ (b >>> 13)) >>> 0;
    }
    return ('0000000' + a.toString(16)).slice(-8) + ('0000000' + b.toString(16)).slice(-8);
  }

  /* ---------- Scrivere l'archivio ----------
     costruisci(eventi, {adesso, regioni, cartella}) → {indice, file: {percorso: testo}}.
     Tiene solo gli eventi che a quel momento non sono ancora usciti dalla mappa (tre ore dopo la fine); uno per riga,
     in ordine di inizio. Rifiuta (con un errore) un evento non valido o fuori dalla griglia. */
  /* Le uscite di una regione (LM-46): l'indice si scrive quando la Redazione pubblica, ma gli eventi escono dalla mappa
     anche tra una pubblicazione e l'altra. Per questo accanto al numero di ogni regione l'indice dice quanti eventi
     escono e quando: coppie [minuto, quanti], con il minuto contato dal 1970 in tempo universale, in ordine. Chi legge
     toglie dal numero quelli già usciti (eventiVivi). Sono soltanto numeri: non dicono quali eventi. */
  const MINUTO = 6e4;
  function eventiVivi(r, adesso) {
    let n = r.eventi;
    for (const u of r.uscite || []) { if (u[0] * MINUTO > adesso) break; n -= u[1]; }
    return Math.max(0, n);
  }
  function testoQuadrante(id, eventi) {
    return '{"formato":"eventi-quadrante","versione":' + E.FORMATO + ',"tdm-reservation":1,"quadrante":"' + id + '","eventi":[' +
      (eventi.length ? '\n' + eventi.map(e => JSON.stringify(e)).join(',\n') + '\n' : '') + ']}\n';
  }
  /* Dove portare chi tocca il numero di una regione: il punto medio degli eventi del suo quadrante più pieno (a parità, il
     primo in ordine di nome), arrotondato a quattro decimali. */
  function vai(perQuadrante) {
    const q = Object.keys(perQuadrante).sort().reduce((m, k) => (!m || perQuadrante[k].length > perQuadrante[m].length ? k : m), null);
    const l = perQuadrante[q], r4 = x => Math.round(x * 1e4) / 1e4;
    return [r4(l.reduce((s, e) => s + e.lng, 0) / l.length), r4(l.reduce((s, e) => s + e.lat, 0) / l.length)];
  }
  function costruisci(eventi, opz) {
    const adesso = opz.adesso, cartella = opz.cartella || 'quadranti/', regioni = opz.regioni || [];
    if (!Number.isFinite(adesso)) throw new Error('costruisci: serve «adesso» in millisecondi');
    const per = {}, conta = {}, perRegione = {}, escono = {}, visti = new Set();
    for (const ev of eventi) {
      const err = E.controlla(ev, opz.vocabolario ? { vocabolario: opz.vocabolario } : undefined);
      if (err.length) throw new Error('evento ' + (ev && ev.id) + ' non valido: ' + err.join('; '));
      if (visti.has(ev.id)) throw new Error('identificativo ripetuto: ' + ev.id); visti.add(ev.id);
      if (E.uscitaMs(ev) <= adesso) continue;
      const q = quadrante(ev.lat, ev.lng); if (!q) throw new Error('evento ' + ev.id + ' fuori dalla griglia');
      (per[q] = per[q] || []).push(ev);
      const reg = regione(ev.lat, ev.lng, regioni);
      if (reg) {
        conta[reg] = (conta[reg] || 0) + 1; ((perRegione[reg] = perRegione[reg] || {})[q] = perRegione[reg][q] || []).push(ev);
        const m = Math.round(E.uscitaMs(ev) / MINUTO); (escono[reg] = escono[reg] || {})[m] = (escono[reg][m] || 0) + 1;
      }
    }
    const file = {}, quadranti = {};
    for (const q of Object.keys(per).sort()) {
      const lista = per[q].sort((x, y) => E.istante(x.inizio) - E.istante(y.inizio) || (x.id < y.id ? -1 : 1));
      const testo = testoQuadrante(q, lista), v = impronta(testo), f = cartella + q + '-' + v + '.json';
      file[f] = testo; quadranti[q] = { file: f, v, eventi: lista.length };
    }
    const indice = { formato: 'eventi-indice', versione: E.FORMATO, 'tdm-reservation': 1, generato: new Date(adesso).toISOString().slice(0, 19) + 'Z',
      griglia: GRIGLIA, quadranti,
      regioni: regioni.filter(r => conta[r.nome]).map(r => ({ nome: r.nome, punto: r.punto, eventi: conta[r.nome], vai: vai(perRegione[r.nome]),
        uscite: Object.keys(escono[r.nome]).map(Number).sort((x, y) => x - y).map(m => [m, escono[r.nome][m]]) })) };
    file['indice.json'] = JSON.stringify(indice) + '\n';
    return { indice, file };
  }

  /* ---------- Leggere l'archivio (app pubblica) ---------- */
  const FILE = /^[a-z0-9_-]+(\/[a-z0-9_-]+)*\/?[a-z0-9_.-]+\.json$/;
  /* Controlla l'indice: [] se va bene. Un indice con un'altra griglia o un'altra versione non si usa. */
  function controllaIndice(j) {
    const err = [];
    if (!j || typeof j !== 'object') return ['indice: non è un oggetto'];
    if (j.formato !== 'eventi-indice') err.push('indice: formato sconosciuto');
    if (j.versione !== E.FORMATO) err.push('indice: versione ' + j.versione + ', l\'app legge la ' + E.FORMATO);
    if (JSON.stringify(j.griglia) !== JSON.stringify(GRIGLIA)) err.push('indice: griglia diversa');
    if (!j.quadranti || typeof j.quadranti !== 'object' || Array.isArray(j.quadranti)) err.push('indice: mancano i quadranti');
    else for (const [q, x] of Object.entries(j.quadranti)) {
      if (!rigaColonna(q)) err.push('indice: quadrante sconosciuto ' + q);
      else if (!x || typeof x.file !== 'string' || !FILE.test(x.file) || x.file.includes('..') || typeof x.v !== 'string' || !/^[0-9a-z]{1,32}$/.test(x.v) || !Number.isInteger(x.eventi) || x.eventi < 0)
        err.push('indice: voce non valida per ' + q);
    }
    if (!Array.isArray(j.regioni)) err.push('indice: mancano le regioni');
    else for (const r of j.regioni) {
      const inItalia = p => Array.isArray(p) && p.length === 2 && p[1] >= E.RIQUADRO.sud && p[1] < E.RIQUADRO.nord && p[0] >= E.RIQUADRO.ovest && p[0] < E.RIQUADRO.est;
      if (!r || typeof r.nome !== 'string' || !r.nome || r.nome.length > 40 || !inItalia(r.punto) || !inItalia(r.vai) || !Number.isInteger(r.eventi) || r.eventi < 0) err.push('indice: regione non valida');
      else if (!usciteValide(r)) err.push('indice: uscite non valide per ' + r.nome);
    }
    return err;
  }
  /* Le uscite di una regione: coppie [minuto, quanti] in ordine di minuto, che in tutto fanno il numero della regione. */
  function usciteValide(r) {
    if (!Array.isArray(r.uscite)) return false;
    let somma = 0, prima = -1;
    for (const u of r.uscite) {
      if (!Array.isArray(u) || u.length !== 2 || !Number.isSafeInteger(u[0]) || !Number.isInteger(u[1]) || u[1] < 1 || u[0] <= prima) return false;
      prima = u[0]; somma += u[1];
    }
    return somma === r.eventi;
  }
  /* Gli eventi di un file di quadrante: solo quelli validi e che stanno davvero in quel quadrante. */
  function eventiDelQuadrante(j, id, opz) {
    if (!j || j.formato !== 'eventi-quadrante' || j.versione !== E.FORMATO || j.quadrante !== id || !Array.isArray(j.eventi)) return { eventi: [], scartati: -1 };
    const eventi = j.eventi.filter(ev => E.valido(ev, opz) && quadrante(ev.lat, ev.lng) === id);
    return { eventi, scartati: j.eventi.length - eventi.length };
  }

  return { GRIGLIA, quadrante, confini, intorno, regione, impronta, costruisci, controllaIndice, eventiDelQuadrante, eventiVivi };
});
