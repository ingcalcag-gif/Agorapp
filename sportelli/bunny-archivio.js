/* Lo sportello dell'archivio dei registri su Bunny (Edge Scripting, script «standalone»): scritto e spento (voce T-053).
   Si accende con l'allacciamento (T-065), quando esistono l'account e le zone di Bunny (T-063, T-064), con l'indirizzo
   in indirizzi.archivio della configurazione.

   Questo file è soltanto l'involucro: riceve la richiesta, passa il testo alla logica dello sportello
   (sportelli/archivio.js, la stessa che in Fase 1 gira nello sportello di prova) e risponde. Lo strumento
   strumenti/monta-sportello.mjs ne fa un file solo (node strumenti/monta-sportello.mjs archivio), mettendo al posto dei
   segnaposto i moduli comuni (pacchetto, controllo dei file cifrati, logica dello sportello) e il nome del servizio della
   configurazione, con cui cominciano i nomi dei registri (§ 18.4).

   Che cosa gli serve, nelle variabili e nei segreti dello script su Bunny (mai nel codice, mai nel repository):
     ZONA_RISERVATA, CHIAVE_ZONA_RISERVATA   la zona non pubblica (chiavi ammesse, archivio dei registri, buste del
                                             registro delle fonti) e la sua password
     STORAGE_HOST                            l'indirizzo dell'archiviazione nella regione scelta (Unione europea)
     ORIGINE_REDAZIONE                       l'indirizzo dell'app della redazione, l'unico da cui il browser può scrivere
   Le chiavi pubbliche ammesse stanno in riservato/chiavi.json, lo stesso file degli altri due sportelli
   (docs/sportello-pubblicazione.md).

   Lo sportello non legge l'indirizzo di chi scrive e non lo conserva; non apre mai i file: li conserva cifrati come
   arrivano (docs/archivio.md).

   Da verificare con l'allacciamento (T-065): i nomi esatti delle funzioni di Bunny; la dimensione massima di una
   richiesta che Bunny accetta (un file di 10 MB viaggia come circa 14 milioni di caratteri); due richieste nello stesso
   istante su due nodi (il contatore dei codici FS e NP). */
import * as BunnySDK from "@bunny.net/edgescript-sdk";
import process from "node:process";

/*@@MODULI@@*/
const NOME = /*@@NOME@@*/'';

const amb = k => process.env[k] || '';
/* Il deposito: l'archiviazione di Bunny, nella sola zona riservata. */
function deposito() {
  const dove = p => {
    if (!p.startsWith('riservato/') || p.includes('..')) throw new Error('sportello: percorso fuori dalla zona riservata');
    return { url: 'https://' + (amb('STORAGE_HOST') || 'storage.bunnycdn.com') + '/' + amb('ZONA_RISERVATA') + '/' + p.slice('riservato/'.length), testa: { AccessKey: amb('CHIAVE_ZONA_RISERVATA') } };
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
const M = globalThis.AGR_MODULI;
const sportello = M.archivioSportello.crea({ deposito: deposito(), pacchetto: M.pacchetto, file: M.fileCifrati, nome: NOME });

async function gestisci(request) {
  const testa = { 'content-type': 'application/json', 'cache-control': 'no-store', 'access-control-allow-origin': amb('ORIGINE_REDAZIONE'), vary: 'origin' };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: Object.assign({ 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '600' }, testa) });
  if (request.method !== 'POST') return new Response(JSON.stringify({ esito: 'rifiutato', motivo: 'forma' }), { status: 405, headers: testa });
  const r = await sportello.ricevi(await request.text());
  return new Response(JSON.stringify(r.corpo), { status: r.stato, headers: testa });
}
BunnySDK.net.http.serve(gestisci);
