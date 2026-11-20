// Genera sorgenti/dati/regioni.json: i confini semplificati delle venti regioni italiane, con un punto interno per
// ciascuna (voce T-021). Servono a contare gli eventi per regione nell'indice dell'archivio (libro mastro § 2.4, «La
// lettura degli eventi»): li usano chi scrive l'indice (oggi l'archivio di prova, poi lo sportello) e non il telefono.
//
// Fonte: Natural Earth, «Admin 1 – States, Provinces», scala 1:10 milioni, versione 5.1.2 (pubblico dominio: nessuna
// attribuzione richiesta). Le 110 province italiane si uniscono nelle loro regioni; i nomi diventano quelli italiani.
//
// Uso, dalla cartella strumenti:  npm ci  →  node genera-regioni.mjs  [--da=<file geojson di Natural Earth già scaricato>]
// Senza --da scarica il file da GitHub (repository nvkelso/natural-earth-vector, etichetta v5.1.2), circa 40 MB.
import mapshaper from 'mapshaper';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const QUI = path.dirname(fileURLToPath(import.meta.url));
const USCITA = path.resolve(QUI, '../sorgenti/dati/regioni.json');
const VERSIONE = 'v5.1.2';
const INDIRIZZO = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${VERSIONE}/geojson/ne_10m_admin_1_states_provinces.geojson`;
// Nomi di Natural Earth → nomi italiani delle regioni.
const NOMI = { Abruzzo: 'Abruzzo', Apulia: 'Puglia', Basilicata: 'Basilicata', Calabria: 'Calabria', Campania: 'Campania',
  'Emilia-Romagna': 'Emilia-Romagna', 'Friuli-Venezia Giulia': 'Friuli-Venezia Giulia', Lazio: 'Lazio', Liguria: 'Liguria',
  Lombardia: 'Lombardia', Marche: 'Marche', Molise: 'Molise', Piemonte: 'Piemonte', Sardegna: 'Sardegna', Sicily: 'Sicilia',
  Toscana: 'Toscana', 'Trentino-Alto Adige': 'Trentino-Alto Adige', Umbria: 'Umbria', "Valle d'Aosta": "Valle d'Aosta", Veneto: 'Veneto' };

const opz = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
let sorgente = opz.da;
if (!sorgente) {
  sorgente = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'regioni-')), 'ne_10m_admin_1.geojson');
  console.log('scarico ' + INDIRIZZO);
  const r = await fetch(INDIRIZZO); if (!r.ok) throw new Error('scaricamento non riuscito: ' + r.status);
  fs.writeFileSync(sorgente, Buffer.from(await r.arrayBuffer()));
}

// Solo l'Italia, nomi italiani, province unite in regioni, confini semplificati (tolleranza di circa 400 m, senza perdere
// le isole), coordinate a 4 decimali (circa 10 m).
const ne = JSON.parse(fs.readFileSync(sorgente, 'utf8'));
const italia = { type: 'FeatureCollection', features: ne.features.filter(f => f.properties.adm0_a3 === 'ITA').map(f => {
  const n = NOMI[f.properties.region]; if (!n) throw new Error('regione sconosciuta in Natural Earth: ' + f.properties.region);
  return { type: 'Feature', geometry: f.geometry, properties: { nome: n } };
}) };
if (italia.features.length !== 110) throw new Error('attese 110 province italiane, trovate ' + italia.features.length);
const comandi = '-i italia.json -dissolve nome -simplify dp interval=400 keep-shapes -o regioni.json format=geojson precision=0.0001 ' +
  '-points inner -o punti.json format=geojson precision=0.0001';
const out = await mapshaper.applyCommands(comandi, { 'italia.json': JSON.stringify(italia) });
const regioni = JSON.parse(out['regioni.json']), punti = JSON.parse(out['punti.json']);
const punto = Object.fromEntries(punti.features.map(f => [f.properties.nome, f.geometry.coordinates]));

// Forma compatta: per ogni regione nome, punto interno [lng, lat] e poligoni (anelli di [lng, lat]).
const elenco = regioni.features.map(f => ({
  nome: f.properties.nome, punto: punto[f.properties.nome],
  poligoni: f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates,
})).sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
if (elenco.length !== 20) throw new Error('attese 20 regioni, trovate ' + elenco.length);
const testo = '{"fonte":"Natural Earth ' + VERSIONE.slice(1) + ', Admin 1 (1:10m), pubblico dominio; province unite in regioni e semplificate da strumenti/genera-regioni.mjs",\n"regioni":[\n' +
  elenco.map(r => JSON.stringify(r)).join(',\n') + '\n]}\n';
fs.writeFileSync(USCITA, testo);
console.log(path.relative(process.cwd(), USCITA) + ': ' + elenco.length + ' regioni, ' + Math.round(testo.length / 1024) + ' KB, ' +
  elenco.reduce((n, r) => n + r.poligoni.flat().reduce((k, a) => k + a.length, 0), 0) + ' punti');
