const fs=require('fs'),vm=require('vm');
const L=fs.readFileSync('mock_v7.html','utf8').split('\n');
const seg=(a,b)=>L.slice(a-1,b).join('\n');
const ctx={window:{}};vm.createContext(ctx);
// bacheche, istanze, temi
vm.runInContext(seg(938,1244).replace('const BACHECHE','var BACHECHE'),ctx);
vm.runInContext(seg(1247,1681).replace('const IST','var IST'),ctx);
vm.runInContext(seg(1684,1724),ctx);
// eventi città
vm.runInContext(seg(1785,1825).replace('const E','var E'),ctx);
// progetti
const iT=L.findIndex(l=>l.startsWith('const TIPO = {'))+1, iP=L.findIndex(l=>l.startsWith('const PROGETTI = ['))+1;
let fineP=iP; while(!L[fineP-1].startsWith('];')) fineP++;
vm.runInContext(seg(iT,iP-1).replace('const TIPO','var TIPO')+'\n'+seg(iP,fineP).replace('const PROGETTI','var PROGETTI'),ctx);
// lenti
const iG=L.findIndex(l=>l.startsWith('const G = {'))+1, iLA=L.findIndex(l=>l.startsWith('const LENTI_AG = ['))+1;
let fineL=iLA; while(!L[fineL-1].startsWith('];')) fineL++;
vm.runInContext(seg(iG,iLA-1).replace('const G','var G')+'\n'+seg(iLA,fineL).replace('const LENTI_AG','var LENTI_AG'),ctx);
const W=ctx.window, BACHECHE=W.BACHECHE, IST=W.IST;
const ETICH={agorapp:"Progetto Agorapp",sostenuto:"Accompagnato da Agorapp",indipendente:"Indipendente"};
const FONTI={comune:"Sito del Comune di Torino",org:"Sito di chi organizza",social:"Pagina pubblica di chi organizza"};
const fineDT=(g,i,f)=>{ if(!f) return ''; let d=g; if(f<=i){const x=new Date(g+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+1);d=x.toISOString().slice(0,10);} return d+'T'+f; };
const eventi=[], coll=[];
// 1. eventi della città
ctx.E.forEach(r=>{const [id,tipo,strato,sub,titolo,luogo,lat,lng,giorno,inizio,fine,prezzo,desc,fonte,extra]=r; const x=extra||{};
  const ev={id:'demo-'+id,demo:true,title:titolo,category:strato,sublayer:sub,description:desc,datetime:giorno+'T'+inizio,end:fineDT(giorno,inizio,fine),price:prezzo,lat,lng,address:luogo,source:FONTI[fonte]||'',tema:x.tema||'',hidden:!!x.nascosto,hiddenPassword:x.password||'',offgrid:false,link:'',image:''};
  eventi.push(ev); if(x.tema) coll.push({da:ev.id,tipo:'tema',a:x.tema});});
// 2. pratiche: il prossimo appuntamento di ogni progetto
Object.entries(BACHECHE).forEach(([pid,b])=>{const a=b.app;
  const ev={id:'demo-pratica-'+pid,demo:true,parentType:'pratica',parentId:pid,title:a.titolo,category:a.strato,sublayer:a.sub,description:a.programma,datetime:a.giorno+'T'+a.inizio,end:fineDT(a.giorno,a.inizio,a.fine),price:a.prezzo||'',lat:a.lat,lng:a.lng,address:a.posto+' · '+a.zona,addrNum:a.civico||'',tema:a.tema||'',statoAppuntamento:a.stato||'',progetto:b.titolo,etichetta:ETICH[b.tipo],hidden:false,offgrid:false,link:'',image:''};
  eventi.push(ev); coll.push({da:ev.id,tipo:'progetto',a:pid});});
// 3. incontri delle istanze (il prossimo di ogni tavolo) e restituzione dell'istanza conclusa
const elenco=l=>l.length<2?l.join(''):l.slice(0,-1).join(', ')+' e '+l[l.length-1];
IST.lista.forEach(a=>{const strato=a.strati.includes('sociale')?'sociale':a.strati[0];
  a.tavoli.forEach(t=>{const pr=t.prossimo; if(!pr) return; const [i,f]=pr.ora.split('–'); const [lat,lng]=pr.lat?[pr.lat,pr.lng]:IST.citta[pr.citta];
    const ev={id:`demo-istanza-${a.id}-t${t.n}`,demo:true,parentType:'istanza',parentId:a.id,tavolo:t.n,passo:t.incontri.length+1,title:`Tavolo ${t.n} · ${t.titolo}`,category:strato,sublayer:'Assemblee',description:'In programma: '+pr.programma,datetime:pr.iso+'T'+i,end:fineDT(pr.iso,i,f),price:'Gratuito',lat,lng,address:pr.posto||pr.citta,citta:pr.citta,suMappa:pr.citta==='Torino',istanza:a.titolo,obiettivo:a.obiettivo,soggetti:`${t.soggetti.length} soggetti da ${elenco([...new Set(t.soggetti.map(s=>s[2]))])}`,tema:a.tema||'',hidden:false,offgrid:false,link:'',image:''};
    eventi.push(ev); coll.push({da:ev.id,tipo:'istanza',a:a.id,tavolo:t.n});});
  if(a.conclusa){const r=a.conclusa.restituzione,[i,f]=r.ora.split('–');
    const ev={id:`demo-istanza-${a.id}-fine`,demo:true,parentType:'istanza',parentId:a.id,restituzione:true,title:`${a.titolo} · la proposta consegnata`,category:strato,sublayer:'Assemblee',description:'In programma: '+r.programma,datetime:r.iso+'T'+i,end:fineDT(r.iso,i,f),price:'Gratuito',lat:r.lat,lng:r.lng,address:r.posto,citta:'Torino',suMappa:true,istanza:a.titolo,obiettivo:a.obiettivo,soggetti:`I ${a.tavoli.length} tavoli dell’istanza: ${a.tavoli.reduce((n,t)=>n+t.soggetti.length,0)} soggetti`,tema:a.tema||'',hidden:false,offgrid:false,link:'',image:''};
    eventi.push(ev); coll.push({da:ev.id,tipo:'istanza',a:a.id,restituzione:true});}
});
// 4. Off-Grid d'esempio (solo sul telefono di chi carica la demo)
const offgrid=[{id:'demo-og-cena',demo:true,personal:true,offgrid:true,title:'Cena da Fede',address:'Via Maria Vittoria 20, 10123 Torino (TO)',addressFull:'Via Maria Vittoria 20, 10123 Torino (TO)',addrPrecision:'exact',addrNum:'20',lat:45.0668,lng:7.6898,datetime:'2026-10-01T20:30',end:'2026-10-01T23:00',notes:'Porto il dolce.',description:'Porto il dolce.',links:[],link:'',category:'',sublayer:'',hidden:false,hiddenPassword:'',price:'',image:''}];
['2026-10-02','2026-10-09','2026-10-16','2026-10-23','2026-10-30'].forEach((g,k)=>offgrid.push({id:'demo-og-corsa-'+k,demo:true,personal:true,offgrid:true,seriesId:'demo-ser-corsa',rep:{freq:'weekly',until:'2026-10-30'},title:'Corsa al Valentino con Giulia',address:'Corso Massimo d’Azeglio 15, 10125 Torino (TO)',addressFull:'Corso Massimo d’Azeglio 15, 10125 Torino (TO)',addrPrecision:'exact',addrNum:'15',lat:45.0575,lng:7.6870,datetime:g+'T07:30',end:g+'T08:30',notes:'',description:'',links:[],link:'',category:'',sublayer:'',hidden:false,hiddenPassword:'',price:'',image:''}));
// 5. temi di progetti e istanze, lenti
Object.entries(W.TAGS_BY_ID).forEach(([id,t])=>coll.push({da:id==='agorapp-critica'?'agorapp':id,tipo:'temi',a:t}));
ctx.LENTI_AG.forEach(l=>coll.push({da:'lente:'+l.id,tipo:'lente',a:l.k}));
const lenti=ctx.LENTI_AG.map(l=>Object.assign({},l,{glifo:ctx.G[l.id]}));
const demo={
  formato:'agorapp-demo', versione:1, creato:'2026-10-03',
  descrizione:'Dati d’esempio di Agorapp: eventi della città, pratiche dei progetti, incontri delle istanze, Off-Grid d’esempio, progetti con le bacheche, istanze dell’Agorà con tavoli e rendiconti, temi e lenti, e i collegamenti tra tutto. Tutto inventato, ricavato dal mockup unico del 2 ottobre 2026.',
  ancora:'2026-10-01T17:30',
  notaAncora:'Le date sono quelle del mockup, costruite attorno a giovedì 1 ottobre 2026 alle 17:30. Al caricamento si possono spostare in avanti.',
  eventi, offgrid,
  calendario:['demo-jazz','demo-pratica-cortile','demo-meditazione'],
  progetti:{tipi:ctx.TIPO, elenco:ctx.PROGETTI, bacheche:BACHECHE},
  istanze:IST,
  temi:{vocabolario:W.TEMI_VOC, perOggetto:W.TAGS_BY_ID, lenti},
  collegamenti:coll
};
fs.writeFileSync('agorapp-demo.json',JSON.stringify(demo,null,1));
const n=t=>coll.filter(c=>c.tipo===t).length;
console.log('eventi',eventi.length,'(città',ctx.E.length,', pratiche',n('progetto'),', istanze',n('istanza'),') offgrid',offgrid.length,'progetti',ctx.PROGETTI.length,'bacheche',Object.keys(BACHECHE).length,'istanze',IST.lista.length,'lenti',lenti.length,'collegamenti',coll.length);
console.log('fuori Torino:',eventi.filter(e=>e.suMappa===false).length);
