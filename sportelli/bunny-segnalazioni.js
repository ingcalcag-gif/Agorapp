/* Lo sportello delle segnalazioni su Bunny (Edge Scripting, script «standalone»): scritto e spento (voce T-051).
   Si accende con l'allacciamento (T-065), quando esistono l'account e le zone di Bunny (T-063, T-064); l'app passa dal
   messaggio di posta allo sportello solo dopo la prova del limite (T-071), con segnalazioni.sportello nella configurazione.

   Questo file è soltanto l'involucro: riceve la richiesta, passa il testo alla logica dello sportello
   (sportelli/segnalazioni.js, la stessa che in Fase 1 gira nello sportello di prova) e risponde. Lo strumento
   strumenti/monta-sportello.mjs ne fa un file solo (node strumenti/monta-sportello.mjs segnalazioni), mettendo al posto
   del segnaposto i moduli comuni (segnalazione, pacchetto, logica dello sportello).

   Che cosa gli serve, nelle variabili e nei segreti dello script su Bunny (mai nel codice, mai nel repository):
     ZONA_RISERVATA, CHIAVE_ZONA_RISERVATA   la zona non pubblica (chiavi ammesse, segnalazioni depositate) e la sua password
     STORAGE_HOST                            l'indirizzo dell'archiviazione nella regione scelta (Unione europea)
     ORIGINE_APP, ORIGINE_REDAZIONE          gli indirizzi dell'app pubblica (porta aperta) e dell'app della redazione
                                             (porta firmata): l'unico da cui il browser può scrivere è uno dei due
   Il lucchetto (la parte pubblica di cifratura della Redazione) sta in riservato/chiavi.json, lo stesso file dello
   sportello di pubblicazione, scritto dal Responsabile infrastruttura con il file delle parti pubbliche della
   schermata «Chiavi» (docs/segnalazioni.md).

   Lo sportello non legge l'indirizzo di chi scrive e non lo conserva; il limite uguale per tutti e il piccolo compito
   stanno nella logica; il limite per indirizzo, se serve, è una regola della zona di Bunny (T-064, T-071).

   Da verificare con l'allacciamento (T-065, T-071): i nomi esatti delle funzioni di Bunny, due richieste arrivate nello
   stesso istante su due nodi (il conto del limite), che Bunny non tenga nei suoi registri il contenuto delle richieste. */
import * as BunnySDK from "@bunny.net/edgescript-sdk";
import process from "node:process";

/*@@MODULI@@*/

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
const sportello = globalThis.AGR_MODULI.segnalazioniSportello.crea({ deposito: deposito(), pacchetto: globalThis.AGR_MODULI.pacchetto });

async function gestisci(request) {
  const origine = request.headers.get('origin') || '', ammesse = [amb('ORIGINE_APP'), amb('ORIGINE_REDAZIONE')].filter(Boolean);
  const testa = { 'content-type': 'application/json', 'cache-control': 'no-store', 'access-control-allow-origin': ammesse.includes(origine) ? origine : (ammesse[0] || ''), vary: 'origin' };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: Object.assign({ 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '600' }, testa) });
  if (request.method !== 'POST') return new Response(JSON.stringify({ esito: 'rifiutato', motivo: 'forma' }), { status: 405, headers: testa });
  const r = await sportello.ricevi(await request.text());
  return new Response(JSON.stringify(r.corpo), { status: r.stato, headers: testa });
}
BunnySDK.net.http.serve(gestisci);
