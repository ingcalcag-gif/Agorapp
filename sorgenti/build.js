const fs=require('fs'),vm=require('vm');
const P='parti/';
const old=fs.readFileSync('/home/claude/agorapp/versioni/og17/index.html','utf8').split('\n');
const mock=fs.readFileSync('mock_v7.html','utf8').split('\n');
// LAYERS e icone dall'app online
const i1=old.findIndex(l=>l.startsWith('const LAYER_ICONS={')), i2=old.findIndex(l=>l.startsWith('const LAYERS=['));
let i3=i2; while(old[i3]!=='];') i3++;
const layers=old.slice(i1,i3+1).join('\n');
// testi legali nelle altre lingue (T dell'app online)
const t0=old.findIndex(l=>l.startsWith('const T={')); let t1=t0; while(old[t1]!=='};') t1++;
const ctx={};vm.createContext(ctx);vm.runInContext(old.slice(t0,t1+1).join('\n').replace('const T','var T'),ctx);
const LEG={};['en','es','fr','ar'].forEach(l=>{const x=ctx.T[l]||{};LEG[l]={privacy:x.legal_html_privacy||'',storage:x.legal_html_storage||'',disclaimer:x.legal_html_disclaimer||''};});
const legali='const LEGALI = '+JSON.stringify(LEG)+';';
// testi legali italiani (template del mockup = app online OG 1.7)
const lA=mock.findIndex(l=>l.startsWith('<template id="leg-privacy">'));
let lB=mock.findIndex(l=>l.startsWith('<template id="leg-disclaimer">')); while(!mock[lB].includes('</template>')) lB++;
const tmpl=mock.slice(lA,lB+1).join('\n');
let js=['app1.js','app2.js','app3.js','app4.js','app5.js','app7.js','app6.js'].map(f=>fs.readFileSync(P+f,'utf8')).join('\n');
js=js.replace('/*@@LAYERS@@*/',layers).replace('/*@@LEGALI@@*/',legali);
const tr=fs.existsSync(P+'traduzioni.js')?fs.readFileSync(P+'traduzioni.js','utf8'):'window.AGR_TR={};';
const css=fs.readFileSync(P+'style.css','utf8')+'\n'+fs.readFileSync(P+'style2.css','utf8')+'\n'+fs.readFileSync(P+'style_temi.css','utf8')+'\n'+fs.readFileSync(P+'style_sezioni.css','utf8');
const html=`<!DOCTYPE html>
<!-- Restyling 4 — ${new Date().toISOString().slice(0,10)} — ramo restyling-app. Mappa, Calendario, Off-Grid, Strati, Temi; Progetti e Agorà in anteprima (5 lingue). 4 ottobre: «Il tuo calendario» fermo, tasto Calendario grande, trattino che allarga i pannelli, Strati trasparenti, PDF da condividere, demo per tutti, import/export Excel per l'admin, primo accesso chiaro. OG 1.7 archiviata in versioni/og17 -->
<html lang="it" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#FFFDF8">
<title>Agorapp — Torino</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Serif+Display&display=swap">
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css">
<style>
${css}
</style>
</head>
<body>
${fs.readFileSync(P+'body.html','utf8')}
<!-- Testi legali: quelli dell'app online OG 1.7 (v1.2), invariati -->
${tmpl}
<script src="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js"></script>
<script>
${tr}
</script>
<script>
${js}
</script>
<script>
${fs.readFileSync(P+'sezioni.js','utf8')}
</script>
</body>
</html>
`;
fs.writeFileSync('/home/claude/agorapp/index.html',html);
console.log('ok',html.length);
