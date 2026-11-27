/* Prova: la copia di sicurezza degli eventi fuori da Bunny e il ripristino (voce T-054 del piano di adeguamento;
   documento: docs/archivio.md).

   Lo sportello di pubblicazione (sportelli/pubblicazione.js) gira qui con un deposito finto in memoria, con le chiavi di
   sorgenti/moduli/chiavi.js fatte al momento ed eventi inventati; la copia si compone e si cifra con
   sorgenti/moduli/copia-eventi.js.

    1. «immagine» legge, a pagine, l'elenco degli eventi, lo storico e il registro delle fonti come lo tiene lo sportello:
       non le chiavi ammesse, i numeri ricevuti, i tentativi errati né i file degli altri sportelli.
    2. La copia: ogni versione di un evento si scrive una volta sola; ricomposta, ogni file torna identico, lettera per
       lettera. Cifrata con la frase: la frase sbagliata, un byte cambiato o l'intestazione cambiata danno lo stesso
       rifiuto; una frase di meno di 20 caratteri non si usa; la frase delle chiavi si riconosce.
    3. «Completa»: la copia giusta lo è, con i conti; una copia dello storico mancante, un evento cambiato, l'elenco degli
       eventi diverso dall'ultima copia e un evento fuori formato si vedono.
    4. «Ricostruisci» in uno sportello vuoto, a parti firmate: eventi, nascosti, sospesi e storico tornano, con una copia
       nuova che dice da dove vengono; un evento già finito non torna; i codici F ripartono da dove erano.
    5. Le difese: uno sportello non vuoto rifiuta; una parte fuori ordine, un file con l'impronta sbagliata, un percorso
       fuori dalla copia sono rifiutati; durante la ricostruzione non si pubblica; una ricostruzione interrotta si
       ricomincia da capo, senza lasciare file della prima. */
'use strict';
const { esito, eseguiDaSola } = require('./comune.js');
const C = require('../sorgenti/moduli/chiavi.js');
const E = require('../sorgenti/moduli/eventi.js');
const N = require('../sorgenti/moduli/nascosti.js');
const PAROLE = require('../sorgenti/moduli/parole-nascosti.js');
const P = require('../sorgenti/moduli/pacchetto.js');
const CE = require('../sorgenti/moduli/copia-eventi.js');
const SP = require('../sportelli/pubblicazione.js');
const REGIONI = require('../sorgenti/dati/regioni.json').regioni;
const { vocabolarioApp } = require('./eventi.js');

const FRASE = 'cavallo batteria graffetta corretta';
const FRASE_COPIA = 'una frase inventata per la copia degli eventi';
function depositoChiavi() { const m = new Map(); return { leggi: async k => m.get(k), scrivi: async (k, v) => { m.set(k, v); }, togli: async k => { m.delete(k); } }; }
function deposito() {
  const m = new Map();
  return { m, leggi: async p => (m.has(p) ? m.get(p) : null), scrivi: async (p, t) => { m.set(p, String(t)); }, togli: async p => { m.delete(p); },
    elenca: async pre => [...m.keys()].filter(k => k.startsWith(pre)) };
}
const ID = k => (k + 'aaaaaaaaaaaaaaaa').slice(0, 16) + '-provaaaa';

async function prova() {
  const e = esito('Copia di sicurezza degli eventi e ripristino');
  const err = s => e.errori.push(s);
  let t = Date.parse('2026-12-01T09:00:00Z'); const ora = () => t;
  const ev = (k, campi) => Object.assign({ id: ID(k), titolo: 'Evento inventato ' + k, strato: 'musica', inizio: '2026-12-04T21:00', fine: '2026-12-04T23:00', luogo: 'Sala inventata',
    indirizzo: 'Via Inventata 1, Torino', collocazione: 'indirizzo', lat: 45.0703, lng: 7.6869, descrizione: 'Evento inventato per la prova della copia.', fonte: { testo: 'Fonte inventata' }, modificato: '2026-12-01T09:00:00Z' }, campi || {});
  const voc = vocabolarioApp();
  const k = C.crea({ deposito: depositoChiavi(), ora }); await k.genera(FRASE, FRASE, 'Portatile di prova');
  const s = await k.stato(), pubbliche = await k.pubbliche();
  const forma = c => P.forma(c, { firma: k.firma, dispositivo: { nome: 'Portatile di prova', impronta: s.firma.impronta }, ora });
  const sportello = (dep, opz) => SP.crea(Object.assign({ deposito: dep, ora, regioni: REGIONI, vocabolario: voc }, opz || {}));

  /* lo sportello di partenza: quattro pubblicazioni, con un nascosto, un sospeso, un ritiro e il registro delle fonti */
  const dep = deposito(), sp = sportello(dep, { pagina: 4000 });
  await sp.ammetti(pubbliche);
  const manda = async (x, c) => x.ricevi(JSON.stringify(await forma(c)));
  const busta = async () => k.registro.cifra(JSON.stringify({ v: 1, righe: [{ titolo: 'Evento inventato' }] }));
  const pw = N.genera(PAROLE), cifrato = await N.cifra(ev('nascosto', { titolo: 'Evento nascosto inventato' }), pw);
  const voceNascosta = { id: ID('nascosto'), impronta: cifrato.impronta, giorno: N.giornoUscita(ev('nascosto')), file: cifrato.file };
  let r = await manda(sp, { operazione: 'scrivi', pubblica: [ev('uno'), ev('due'), ev('presto', { inizio: '2026-12-01T18:00', fine: '2026-12-01T19:00' })], registro: await busta() }); t += 60000;
  if (r.stato !== 200) err('preparazione: la prima pubblicazione non va: ' + JSON.stringify(r.corpo).slice(0, 200));
  r = await manda(sp, { operazione: 'scrivi', pubblica: [ev('uno', { titolo: 'Evento inventato uno, corretto' })], nascosti: [voceNascosta], registro: await busta() }); t += 60000;
  r = await manda(sp, { operazione: 'scrivi', sospendi: [ID('due')] }); t += 60000;
  r = await manda(sp, { operazione: 'scrivi', pubblica: [ev('tre')], ritira: [{ id: ID('presto'), motivo: 'annullato' }], registro: await busta() }); t += 60000;
  if (r.stato !== 200) err('preparazione: l\'ultima pubblicazione non va: ' + JSON.stringify(r.corpo).slice(0, 200));
  dep.m.set('riservato/segnalazioni/arrivate/inventata.json', '{"tipo":"segnalazione-arrivata"}');
  dep.m.set('riservato/archivio/elenco.json', '{"v":1,"file":{}}');

  /* 1 */
  const letti = []; let dopo, pagine = 0, totale = 0;
  do {
    r = await manda(sp, Object.assign({ operazione: 'immagine' }, dopo ? { dopo } : {}));
    if (r.stato !== 200) { err('immagine: risposta inattesa ' + JSON.stringify(r.corpo).slice(0, 200)); break; }
    letti.push(...r.corpo.file); dopo = r.corpo.seguito; totale = r.corpo.totale; pagine++;
  } while (dopo && pagine < 50);
  const attesi = [...dep.m.keys()].filter(x => SP.nellImmagine(x)).sort();
  if (letti.map(x => x.percorso).join('|') !== attesi.join('|')) err('immagine: i file letti non sono quelli della copia: ' + letti.map(x => x.percorso).join(', '));
  if (letti.length !== totale || pagine < 2) err('immagine: attese più pagine e il totale giusto (' + pagine + ' pagine, ' + letti.length + ' di ' + totale + ')');
  if (letti.some(x => /chiavi|visti|tentativi|segnalazioni|archivio/.test(x.percorso))) err('immagine: nella copia entrano file che non sono suoi');
  if (attesi.filter(x => /storico\/copie\//.test(x)).length !== 4 || attesi.filter(x => /registro\/righe\//.test(x)).length !== 3) err('immagine: attese 4 copie dello storico e 3 buste del registro');
  r = await manda(sp, { operazione: 'immagine', dopo: 'riservato/chiavi.json' }); if (r.corpo.motivo !== 'immagine') err('immagine: un «dopo» fuori dalla copia doveva essere rifiutato');

  /* 2 */
  const copia = await CE.componi(letti, { ora: t, sportello: new Date(t).toISOString(), dispositivo: 'Portatile di prova' });
  const riferimenti = copia.file.filter(x => x.compatta).reduce((n, x) => n + ['eventi', 'sospesi', 'nascosti', 'nascostiSospesi'].reduce((m, l) => m + ((x.compatta[l] || []).length), 0), 0);
  if (!(Object.keys(copia.eventi).length < riferimenti)) err('copia: le versioni ripetute degli eventi dovevano scriversi una volta sola (' + Object.keys(copia.eventi).length + ' su ' + riferimenti + ')');
  if (JSON.stringify(copia).includes(pw)) err('copia: la password dell\'evento nascosto non deve entrare nella copia');
  const ricomposti = await CE.ricomponi(copia);
  if (ricomposti.map(x => x.percorso + x.testo).join('\n') !== letti.map(x => x.percorso + x.testo).join('\n')) err('copia: i file ricomposti non sono identici a quelli letti');
  let m = ''; try { await CE.cifra(copia, 'corta'); } catch (x) { m = x.motivo; } if (m !== 'frase-corta') err('copia: una frase di meno di 20 caratteri doveva essere rifiutata');
  const file = await CE.cifra(copia, FRASE_COPIA);
  const testa = new TextDecoder().decode(file.subarray(0, file.indexOf(10)));
  if (!/"tipo":"copia-sicurezza-eventi"/.test(testa) || /Evento inventato|Sala inventata/.test(new TextDecoder('latin1').decode(file))) err('copia: il file deve avere l\'intestazione e nessun testo in chiaro');
  if (JSON.stringify(await CE.decifra(file, FRASE_COPIA)) !== JSON.stringify(copia)) err('copia: decifrata non torna uguale');
  const alterato = file.slice(); alterato[alterato.length - 5] ^= 1;
  const testaCambiata = new TextEncoder().encode(new TextDecoder().decode(file).replace('"compresso":"gzip"', '"compresso":"gzap"'));
  for (const [nome, b, f] of [['la frase sbagliata', file, FRASE_COPIA + '!'], ['un byte cambiato', alterato, FRASE_COPIA], ['l\'intestazione cambiata', file.length === testaCambiata.length ? testaCambiata : alterato, FRASE_COPIA]]) {
    m = ''; try { await CE.decifra(b, f); } catch (x) { m = x.motivo; } if (m !== 'copia') err('copia: ' + nome + ' doveva dare il rifiuto «copia», dà «' + m + '»');
  }
  if (!(await k.fraseDelleChiavi(FRASE)) || await k.fraseDelleChiavi(FRASE_COPIA)) err('frase: la frase delle chiavi doveva riconoscersi, e solo quella');

  /* 3 */
  let v = await CE.verifica(copia, { controlla: x => E.controlla(x, { vocabolario: voc }) });
  if (!v.integra || v.conti.copie !== 4 || v.conti.eventi !== 2 || v.conti.sospesi !== 1 || v.conti.nascosti !== 1 || v.conti.buste !== 3 || v.conti.codici !== 5) err('integra: la copia giusta doveva esserlo, con 4 copie, 2 eventi, 1 sospeso, 1 nascosto, 3 buste e 5 codici F: ' + JSON.stringify(v.conti) + ' ' + v.problemi.join('; '));
  const guasta = (f, cosa) => { const c = JSON.parse(JSON.stringify(copia)); f(c); return CE.verifica(c, { controlla: x => E.controlla(x, { vocabolario: voc }) }).then(x => { if (x.integra) err('integra: ' + cosa + ' doveva vedersi'); return x; }); };
  await guasta(c => { c.file = c.file.filter(x => !/storico\/copie\//.test(x.percorso) || x !== c.file.find(y => /storico\/copie\//.test(y.percorso))); }, 'una copia dello storico mancante');
  await guasta(c => { const h = Object.keys(c.eventi)[0]; c.eventi[h] = Object.assign({}, c.eventi[h], { titolo: 'Cambiato' }); }, 'un evento cambiato dopo la copia');
  await guasta(c => { const st = c.file.find(x => x.percorso === CE.STATO); st.testo = JSON.stringify({ v: 1, eventi: [], sospesi: [], nascosti: [], nascostiSospesi: [] }); delete st.compatta; }, 'l\'elenco degli eventi diverso dall\'ultima copia');

  /* 4 */
  const dep2 = deposito(), sp2 = sportello(dep2); await sp2.ammetti(pubbliche);
  const statoCopia = JSON.parse(v.file.find(x => x.percorso === CE.STATO).testo);
  const gruppi = CE.parti(v.file, statoCopia, 3000);
  if (gruppi.length < 3) err('parti: con un massimo piccolo dovevano essere almeno tre');
  const id = '0123456789abcdef';
  const parte = async (x, i, g, extra) => x.ricevi(JSON.stringify({ pacchetto: await forma(Object.assign({ operazione: 'ricostruisci', id, parte: i + 1, di: gruppi.length, file: await CE.impronte(g), da: copia.creata }, extra || {})), file: g }));
  t += 3 * 864e5;   // tre giorni dopo: l'evento del 4/12 è ancora da svolgere, quello ritirato no
  for (let i = 0; i < gruppi.length; i++) {
    r = await parte(sp2, i, gruppi[i]);
    if (r.stato !== 200) { err('ricostruisci: la parte ' + (i + 1) + ' è stata rifiutata: ' + JSON.stringify(r.corpo).slice(0, 300)); break; }
    if (i === 1) { const q = await manda(sp2, { operazione: 'scrivi', pubblica: [ev('intruso')] }); if (q.corpo.motivo !== 'ricostruzione') err('durante la ricostruzione una pubblicazione doveva essere rifiutata: ' + JSON.stringify(q.corpo)); }
  }
  r = await manda(sp2, { operazione: 'stato' });
  if (r.corpo.eventi.map(x => x.titolo).sort().join('|') !== 'Evento inventato tre|Evento inventato uno, corretto' || r.corpo.sospesi.length !== 1 || r.corpo.nascosti.length !== 1) err('ricostruisci: lo sportello nuovo non ha gli eventi della copia: ' + JSON.stringify(r.corpo).slice(0, 300));
  r = await manda(sp2, { operazione: 'storico' });
  if (r.corpo.copie.length !== 5 || r.corpo.copie[0].operazione !== 'ricostruisci') err('ricostruisci: lo storico doveva avere le 4 copie e una nuova della ricostruzione: ' + JSON.stringify(r.corpo.copie.map(x => x.operazione)));
  for (const p of letti.filter(x => /storico\/copie\/|registro\/righe\//.test(x.percorso))) if (dep2.m.get(p.percorso) !== p.testo) err('ricostruisci: il file ' + p.percorso + ' non è tornato identico');
  if (dep2.m.has(SP.MARCA)) err('ricostruisci: finita la ricostruzione il segno doveva sparire');
  const indice = JSON.parse(dep2.m.get('pubblico/indice.json'));
  if (!Object.keys(indice.quadranti).length || ![...dep2.m.keys()].some(x => x.startsWith(SP.NASC))) err('ricostruisci: l\'archivio pubblico (indice, quadranti, nascosti) doveva rinascere');
  r = await manda(sp2, { operazione: 'scrivi', pubblica: [ev('dopo')], registro: await busta() });
  if (r.stato !== 200 || (r.corpo.registro || {}).codici[ID('dopo')] !== 'F-00006') err('ricostruisci: dopo, i codici F dovevano ripartire da F-00006: ' + JSON.stringify(r.corpo.registro));

  /* 5 */
  r = await parte(sp2, 0, gruppi[0]); if (r.corpo.motivo !== 'pieno') err('uno sportello non vuoto doveva rifiutare la ricostruzione (pieno): ' + JSON.stringify(r.corpo));
  const dep3 = deposito(), sp3 = sportello(dep3); await sp3.ammetti(pubbliche);
  r = await parte(sp3, 1, gruppi[1]); if (r.corpo.motivo !== 'parte') err('la seconda parte prima della prima doveva essere rifiutata (parte): ' + JSON.stringify(r.corpo));
  const sbagliato = gruppi[0].map((x, i) => i ? x : Object.assign({}, x, { testo: x.testo + ' ' }));
  r = await sp3.ricevi(JSON.stringify({ pacchetto: await forma({ operazione: 'ricostruisci', id, parte: 1, di: gruppi.length, file: await CE.impronte(gruppi[0]) }), file: sbagliato }));
  if (r.corpo.motivo !== 'impronta') err('un file con l\'impronta sbagliata doveva essere rifiutato (impronta): ' + JSON.stringify(r.corpo));
  const fuori = [{ percorso: 'riservato/chiavi.json', testo: '{}' }];
  r = await sp3.ricevi(JSON.stringify({ pacchetto: await forma({ operazione: 'ricostruisci', id, parte: 1, di: 2, file: await CE.impronte(fuori) }), file: fuori }));
  if (r.corpo.motivo !== 'ricostruzione') err('un percorso fuori dalla copia doveva essere rifiutato: ' + JSON.stringify(r.corpo));
  if ([...dep3.m.keys()].some(x => x !== 'riservato/chiavi.json' && !x.startsWith('riservato/visti') && !x.startsWith('riservato/tentativi'))) err('i rifiuti non dovevano lasciare file: ' + [...dep3.m.keys()].join(', '));
  r = await parte(sp3, 0, gruppi[0]); if (r.stato !== 200) err('la prima parte su uno sportello vuoto doveva entrare');
  const altroId = 'fedcba9876543210', g0 = gruppi[0].slice(0, 1);
  r = await sp3.ricevi(JSON.stringify({ pacchetto: await forma({ operazione: 'ricostruisci', id: altroId, parte: 1, di: 1, file: await CE.impronte(g0.concat([{ percorso: CE.STATO, testo: '{"eventi":[]}' }])) }), file: g0.concat([{ percorso: CE.STATO, testo: '{"eventi":[]}' }]) }));
  if (r.stato !== 200 || [...dep3.m.keys()].filter(x => /storico\/copie\//.test(x)).length !== 1 + (g0[0].percorso.includes('storico/copie/') ? 1 : 0)) err('una ricostruzione interrotta doveva ricominciare da capo senza i file della prima: ' + JSON.stringify(r.corpo).slice(0, 200) + ' ' + [...dep3.m.keys()].join(', '));
  r = await manda(sp, { operazione: 'ricostruisci', id, parte: 1, di: 1, file: [] }); if (r.corpo.motivo !== 'forma') err('«ricostruisci» senza i file accanto doveva essere rifiutato (forma)');

  e.note.push(letti.length + ' file nella copia, ' + Object.keys(copia.eventi).length + ' versioni di eventi per ' + riferimenti + ' richiami; file cifrato di ' + file.length + ' byte; ' + gruppi.length + ' parti');
  return e;
}

module.exports = { prova };
eseguiDaSola(module, prova);
