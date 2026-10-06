/* Agorapp · pulsanti volontari «Mi interessa» e «Vorrei Agorapp nella mia città» (tranche 2 delle Misure, 6 ottobre 2026).
   Riceve solo la scelta toccata dalla persona e somma +1 a un contatore. Non legge, non salva e non scrive nei log
   l'indirizzo IP, il browser o altro della richiesta: tiene solo totali (per voce e per giorno), senza dati personali.
   I contatori stanno in Netlify Blobs, regione UE (Francoforte). */
import { getStore } from "@netlify/blobs";

const VOCI = new Set(["agora", "progetti"]);
const CITTA = new Set(["Roma","Milano","Napoli","Genova","Bari","Palermo","Catania","Messina","Verona","Padova","Venezia","Trieste","Trento","Bolzano","Brescia","Bergamo","Parma","Modena","Reggio Emilia","Firenze","Pisa","Livorno","Perugia","Ancona","Pescara","L'Aquila","Cagliari","Sassari","Lecce","Salerno","Potenza","Campobasso","Catanzaro","Reggio Calabria","Aosta","Altra"]);
const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type", "cache-control": "no-store" };
const risposta = (corpo, stato) => new Response(corpo == null ? null : JSON.stringify(corpo), { status: stato || 200, headers: { ...CORS, "content-type": "application/json" } });

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const store = getStore({ name: "agorapp-interesse", region: "eu-central-1", consistency: "strong" });
  if (req.method === "GET") return risposta((await store.get("totali", { type: "json" })) || {});
  if (req.method !== "POST") return risposta({ errore: "metodo" }, 405);
  let d;
  try { const testo = await req.text(); if (testo.length > 200) throw 0; d = JSON.parse(testo); } catch (e) { return risposta({ errore: "richiesta" }, 400); }
  let chiave = null;
  if (d && VOCI.has(d.voce)) chiave = d.voce;
  else if (d && d.voce === "citta" && typeof d.citta === "string") chiave = "citta:" + (CITTA.has(d.citta) ? d.citta : "Altra");
  if (!chiave) return risposta({ errore: "voce" }, 400);
  const giorno = new Date().toISOString().slice(0, 10);
  const t = (await store.get("totali", { type: "json" })) || {};
  t.tot = t.tot || {}; t.giorni = t.giorni || {};
  t.tot[chiave] = (t.tot[chiave] || 0) + 1;
  t.giorni[giorno] = t.giorni[giorno] || {};
  t.giorni[giorno][chiave] = (t.giorni[giorno][chiave] || 0) + 1;
  await store.setJSON("totali", t);
  return risposta({ ok: true });
};

export const config = { path: "/api/interesse" };
