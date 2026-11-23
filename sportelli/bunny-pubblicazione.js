/* Lo sportello di pubblicazione su Bunny (Edge Scripting, script «standalone»): scritto e spento (voce T-038).
   Si accende con l'allacciamento (T-065), quando esistono l'account e le zone di Bunny (T-063, T-064).

   Questo file è soltanto l'involucro: riceve la richiesta, passa il testo del pacchetto alla logica dello sportello
   (sportelli/pubblicazione.js, la stessa che in Fase 1 gira nello sportello di prova) e risponde. Lo strumento
   strumenti/monta-sportello.mjs ne fa un file solo, mettendo al posto dei tre segnaposto i moduli comuni
   (eventi, quadranti, pacchetto, logica dello sportello), i confini delle regioni e gli strati e i temi dell'app.

   Che cosa gli serve, nelle variabili e nei segreti dello script su Bunny (mai nel codice, mai nel repository):
     ZONA_EVENTI, CHIAVE_ZONA_EVENTI         la zona pubblica degli eventi e la sua password di scrittura
     ZONA_RISERVATA, CHIAVE_ZONA_RISERVATA   la zona non pubblica (chiavi ammesse, elenco, storico) e la sua password
     STORAGE_HOST                            l'indirizzo dell'archiviazione nella regione scelta (Unione europea)
     ORIGINE_REDAZIONE                       l'indirizzo dell'app della redazione, l'unico da cui il browser può scrivere
   Le chiavi pubbliche ammesse non stanno qui: stanno in riservato/chiavi.json, scritto dal Responsabile
   infrastruttura con i file della schermata «Chiavi» (docs/sportello-pubblicazione.md).

   Lo sportello non legge l'indirizzo di chi scrive e non lo conserva; il limite di richieste per indirizzo è una
   regola della zona di Bunny (T-064, T-071), non di questo programma.

   Da verificare con l'allacciamento (T-065, T-070): i nomi esatti delle funzioni di Bunny, due pacchetti arrivati
   nello stesso istante su due nodi, il tempo dopo il quale la rete di consegna rilegge indice.json. */
import * as BunnySDK from "@bunny.net/edgescript-sdk";
import process from "node:process";

/*@@MODULI@@*/
const REGIONI = /*@@REGIONI@@*/[];
const VOCABOLARIO = /*@@VOCABOLARIO@@*/null;

const amb = k => process.env[k] || '';
/* Il deposito: l'archiviazione di Bunny, con una zona per i file pubblici e una per quelli riservati. */
function deposito() {
  const zone = { 'pubblico/': ['ZONA_EVENTI', 'CHIAVE_ZONA_EVENTI'], 'riservato/': ['ZONA_RISERVATA', 'CHIAVE_ZONA_RISERVATA'] };
  const dove = p => {
    const pre = Object.keys(zone).find(k => p.startsWith(k));
    if (!pre || p.includes('..')) throw new Error('sportello: percorso fuori dalle zone');
    return { url: 'https://' + (amb('STORAGE_HOST') || 'storage.bunnycdn.com') + '/' + amb(zone[pre][0]) + '/' + p.slice(pre.length), testa: { AccessKey: amb(zone[pre][1]) }, pre };
  };
  const bene = (r, che) => { if (!r.ok) throw new Error('sportello: il deposito non ha ' + che + ' (' + r.status + ')'); return r; };
  return {
    async leggi(p) { const d = dove(p), r = await fetch(d.url, { headers: d.testa }); return r.status === 404 ? null : bene(r, 'letto').text(); },
    async scrivi(p, t) { const d = dove(p); bene(await fetch(d.url, { method: 'PUT', headers: Object.assign({ 'content-type': 'application/json' }, d.testa), body: t }), 'scritto'); },
    async togli(p) { const d = dove(p), r = await fetch(d.url, { method: 'DELETE', headers: d.testa }); if (r.status !== 404) bene(r, 'tolto'); },
    async elenca(pre) {
      const d = dove(pre), r = await fetch(d.url, { headers: Object.assign({ accept: 'application/json' }, d.testa) });
      if (r.status === 404) return [];
      return (await bene(r, 'elencato').json()).filter(x => !x.IsDirectory).map(x => pre + x.ObjectName);
    }
  };
}
const sportello = globalThis.AGR_MODULI.sportello.crea({ deposito: deposito(), regioni: REGIONI, vocabolario: VOCABOLARIO });

async function gestisci(request) {
  const testa = { 'content-type': 'application/json', 'cache-control': 'no-store', 'access-control-allow-origin': amb('ORIGINE_REDAZIONE'), vary: 'origin' };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: Object.assign({ 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '600' }, testa) });
  if (request.method !== 'POST') return new Response(JSON.stringify({ esito: 'rifiutato', motivo: 'forma' }), { status: 405, headers: testa });
  const r = await sportello.ricevi(await request.text());
  return new Response(JSON.stringify(r.corpo), { status: r.stato, headers: testa });
}
BunnySDK.net.http.serve(gestisci);
