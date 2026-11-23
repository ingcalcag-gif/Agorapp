/* ======================= Lo sportello: l'invio dei pacchetti e lo sportello di prova (T-038) =======================
   Da qui l'app della redazione parla con lo sportello di pubblicazione: forma il pacchetto, lo firma con la chiave del
   dispositivo (sorgenti/moduli/pacchetto.js, sorgenti/moduli/chiavi.js) e lo consegna.

   Dove lo consegna. Quando la configurazione ha l'indirizzo dello sportello (Bunny, T-065), il pacchetto parte per
   quell'indirizzo. Finché l'indirizzo è vuoto c'è lo «sportello di prova»: la stessa logica dello sportello vero
   (sportelli/pubblicazione.js) gira qui, dentro il browser, con un archivio finto tenuto nella memoria del browser per
   i file. Sul collegamento di prova l'app pubblica sta allo stesso indirizzo e legge quell'archivio (app2.js): così il
   giro intero si prova sul telefono senza Bunny, con soli eventi inventati. Nulla esce dal dispositivo.

   Le chiavi ammesse dallo sportello non viaggiano mai in un pacchetto: allo sportello vero le consegna il Responsabile
   infrastruttura con i file della schermata «Chiavi»; allo sportello di prova le consegna il comando qui sotto. */
const SPORTELLO = (() => {
  const vero = (CFG.indirizzi||{}).sportello_pubblicazione || '';
  const base = SPORTELLO_PROVA_DOVE;
  const diProva = () => !vero && !!base && !!MEM.file && !!MODULI.sportello;
  let cassa = null, logica = null;
  const apriCassa = async () => cassa || (cassa = await MEM.file.open('prova_sportello'));
  /* il deposito dello sportello di prova: i percorsi diventano indirizzi finti sotto prova/sportello/, che nessuno chiede alla rete */
  const deposito = {
    leggi: async p => { const r = await (await apriCassa()).match(base + p); return r ? r.text() : null; },
    scrivi: async (p, t) => { await (await apriCassa()).put(base + p, new Response(t, {headers:{'content-type':'application/json'}})); },
    togli: async p => { await (await apriCassa()).delete(base + p); },
    elenca: async pre => (await (await apriCassa()).keys()).map(r => r.url).filter(u => u.startsWith(base + pre)).map(u => u.slice(base.length))
  };
  const sportello = () => logica || (logica = MODULI.sportello.crea({deposito, regioni:MODULI.regioni, vocabolario:FORMATO.vocabolario(LAYERS, TEMI_VOC)}));
  function errore(motivo, corpo){ const e = new Error('sportello: '+motivo); e.motivo = motivo; e.corpo = corpo||null; return e; }

  async function consegna(testo){
    if(vero){
      let r; try{ r = await fetch(vero, {method:'POST', body:testo, headers:{'content-type':'application/json'}, credentials:'omit', cache:'no-store', redirect:'error', referrerPolicy:'no-referrer'}); }catch(e){ throw errore('rete'); }
      let corpo = null; try{ corpo = await r.json(); }catch(e){ corpo = null; }
      return {stato:r.status, corpo:corpo||{}};
    }
    if(!diProva()) throw errore('assente');
    return sportello().ricevi(testo);
  }
  async function firmato(contenuto){
    let s; try{ s = await CHIAVI.stato(); }catch(e){ throw errore('chiavi'); }
    if(!s.ci_sono) throw errore('chiavi');
    return MODULI.pacchetto.forma(contenuto, {firma:CHIAVI.firma, dispositivo:{nome:s.dispositivo, impronta:s.firma.impronta}});
  }
  /* chiedi(contenuto) → ciò che lo sportello risponde. Un rifiuto diventa un errore con il motivo dello sportello. */
  async function chiedi(contenuto){
    const r = await consegna(JSON.stringify(await firmato(contenuto)));
    if(r.stato!==200 || !r.corpo || r.corpo.esito!=='fatto') throw errore((r.corpo && r.corpo.motivo) || 'guasto', r.corpo);
    return r.corpo;
  }

  /* ---------- Solo per lo sportello di prova ---------- */
  const prova = {
    /* questo dispositivo è tra quelli ammessi? e quanti sono */
    async stato(){
      const k = await sportello().chiavi(); let s = null; try{ s = await CHIAVI.stato(); }catch(e){ s = null; }
      const mia = s && s.ci_sono ? s.firma.impronta : '';
      return {ammessi:k.ammesse.length, revocati:k.revocate.length, ammesso:!!mia && k.ammesse.some(x => x.impronta===mia), revocato:!!mia && k.revocate.some(x => x.impronta===mia)};
    },
    async consegnaChiavi(){ return sportello().ammetti(await CHIAVI.pubbliche()); },
    revoca: avviso => sportello().revoca(avviso),
    /* un pacchetto cambiato dopo la firma: lo sportello lo deve rifiutare */
    async firmaSbagliata(){
      const p = await firmato({operazione:'stato'}); p.contenuto = JSON.stringify({operazione:'storico'});
      return consegna(JSON.stringify(p));
    },
    /* gli eventi inventati dell'archivio di prova del repository, letti dalla rete */
    async eventiDelRepository(){
      const A = MODULI.archivio.crea({dove:ARCHIVIO_DOVE, vocabolario:FORMATO.vocabolario(LAYERS, TEMI_VOC), fetch:window.fetch.bind(window)});
      await A.controllaNovita(); if(!A.pronto()) throw errore('rete');
      await A.carica(A.quadranti());
      return A.eventi().map(x => x.ev);
    },
    async svuota(){ cassa = null; logica = null; await MEM.file.delete('prova_sportello'); }
  };
  return {chiedi, diProva, vero:() => vero, prova};
})();
