'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),js=fs.readFileSync(path.join(root,'assets/game.js'),'utf8'),css=fs.readFileSync(path.join(root,'assets/styles.css'),'utf8');
function boot(){
 const nodes=new Map(),store=new Map(),element=()=>({innerHTML:'',textContent:'',hidden:false,disabled:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return true}},addEventListener(){},click(){},remove(){},append(){}});
 const document={body:element(),getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)},querySelectorAll(){return []},querySelector(){return null},createElement:element,addEventListener(){}};
 const window={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},crypto:{getRandomValues(a){a[0]=77331;return a}}};
 const ctx=vm.createContext({window,document,console,setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}}});
 vm.runInContext(js,ctx,{timeout:10000});
 return code=>JSON.parse(vm.runInContext('JSON.stringify('+code+')',ctx,{timeout:10000}));
}
test('14 Kartenrahmenklassen sind definiert',()=>{
 for(const kind of ['starter','fusion',...Array.from({length:12},(_,i)=>'lv-'+(i+1))])
  assert.match(css,new RegExp('\\.tc-card\\.tc-'+kind+'\\s*\\{'));
 assert.match(css,/\.hand-card\.tc-card::before/);
 assert.match(css,/\.board-creature\.tc-card::before/);
});
test('Startmonster neutral, Fusionen lila, Level-12-Normalmonster rot',()=>{
 const run=boot();
 const x=run('(()=>{const ordinary=CARDS.find(c=>c.id>=20&&!c.fusionOnly),fusion=CARDS.find(c=>c.fusionOnly);return {start:Array.from({length:20},(_,i)=>frameClassForCard({id:i})),fusion:frameClassForCard({id:fusion.id}),fieldFusion:frameClassForCard({id:ordinary.id,card:{level:12},fusion:true}),red:frameClassForCard({id:ordinary.id,card:{level:12}})};})()');
 assert.ok(x.start.every(x=>x==='tc-starter'));
 assert.equal(x.fusion,'tc-fusion');
 assert.equal(x.fieldFusion,'tc-fusion');
 assert.equal(x.red,'tc-lv-12');
});
test('Normalmonster haben Levelrahmen 1 bis 12, und Überläufe werden gekappt',()=>{
 const run=boot();
 assert.deepEqual(run('Array.from({length:12},(_,i)=>frameClassForCard({id:20,card:{level:i+1}}))'),Array.from({length:12},(_,i)=>'tc-lv-'+(i+1)));
 assert.equal(run('frameClassForCard({id:20,card:{level:13}})'),'tc-lv-12');
 assert.equal(run('frameClassForCard({id:20,card:{level:0}})'),'tc-lv-1');
});
test('Rahmenklassen gelten in Hand, Sammlung und Duellfeld',()=>{
 const run=boot();
 assert.match(run('fullCardHtml({id:0})'),/class="hand-card tc-card tc-starter/);
 assert.match(run('fullCardHtml({id:20,card:{level:12}})'),/class="hand-card tc-card tc-lv-12/);
 assert.match(js,/class="board-creature tc-card \$\{frameClassForCard\(c\)\}/);
});
function lum(h){const p=h.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return p[0]*.2126+p[1]*.7152+p[2]*.0722;}
function ratio(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('Feste, gut lesbare Textfarben haben mindestens 7:1 Kontrast',()=>{
 for(const [a,b] of [['#fff8e8','#273247'],['#f8e4aa','#182334'],['#172437','#f8f0dc'],['#192638','#f9f1de'],['#101a2b','#f7eed9'],['#fff8e6','#253248']])
  assert.ok(ratio(a,b)>=7,a+' on '+b+' contrast: '+ratio(a,b));
 for(const selector of ['.hand-card.tc-card .hand-title','.hand-card.tc-card .hand-stars','.hand-card.tc-card .hand-type','.hand-card.tc-card .hand-description','.hand-card.tc-card .hand-stats','.board-creature.tc-card .board-name','.board-creature.tc-card .board-stats'])
  assert.ok(css.includes(selector),'Missing text style: '+selector);
});

test('Gestalt/Manifestation übernimmt den violetten Fusionsrahmen',()=>{
 const run=boot(),result=run('(()=>{const manifest=CARDS.find(c=>c.manifestOf!=null);return {id:manifest?.id||-1,kind:manifest?frameClassForCard({id:manifest.id}):null,html:manifest?fullCardHtml({id:manifest.id}):""};})()');
 assert.ok(result.id>=20);
 assert.equal(result.kind,'tc-fusion');
 assert.match(result.html,/tc-fusion/);
});
test('Der ATK/DEF-Bereich besitzt separate Zeilen und keine absolute Positionierung',()=>{
 const run=boot(),html=run('fullCardHtml({id:20,card:{level:12,atk:123456,def:987654}})');
 assert.match(html,/class="hand-stats"[^>]*>/);
 assert.match(html,/class="stat atk"/);
 assert.match(html,/class="stat def"/);
 assert.match(html,/class="stat-label">ATK/);
 assert.match(html,/class="stat-value">123456/);
 assert.match(html,/class="stat-value">987654/);
 assert.match(css,/\.hand-card\.tc-card \.hand-stats\s*\{[\s\S]*?position:static!important/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/\.hand-card\.tc-card\s*\{[\s\S]*?display:flex!important/);
});
test('SVG-Innenrahmen entspricht der Rahmenart, auch bei Gestalten',()=>{
 const art=fs.readFileSync(path.join(root,'assets/art-engine.js'),'utf8');
 const w={};
 vm.runInNewContext(art,{window:w});
 const mk=(id,level,fusionOnly=false,manifestOf=undefined)=>({id,level,fusionOnly,manifestOf,kind:'dragon',element:'FEUER',color:'#bfa2e3'});
 assert.equal(w.ArcaneArt.frameColor(mk(0,12,true)),'#dce4ee');
 assert.equal(w.ArcaneArt.frameColor(mk(30,5,true)),'#b8a0f3');
 assert.equal(w.ArcaneArt.frameColor(mk(40,4,false,31)),'#b8a0f3');
 assert.equal(w.ArcaneArt.frameColor(mk(50,12)),'#e26c71');
 const starter=decodeURIComponent(w.ArcaneArt.makeArt(mk(0,4)));
 const fusion=decodeURIComponent(w.ArcaneArt.makeArt(mk(40,4,false,31)));
 const boss=decodeURIComponent(w.ArcaneArt.makeArt(mk(50,12)));
 assert.ok(starter.includes('stroke="#dce4ee"'));
 assert.ok(fusion.includes('stroke="#b8a0f3"'));
 assert.ok(boss.includes('stroke="#e26c71"'));
});
