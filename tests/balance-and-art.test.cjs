'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const art=fs.readFileSync(path.join(root,'assets/art-engine.js'),'utf8');
const game=fs.readFileSync(path.join(root,'assets/game.js'),'utf8');
function boot(){
 const nodes=new Map(),store=new Map();
 const node=()=>({innerHTML:'',textContent:'',hidden:false,disabled:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return true}},addEventListener(){},click(){},remove(){},append(){}});
 const document={body:node(),getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},querySelector(){return null},querySelectorAll(){return []},createElement:node,addEventListener(){}};
 const window={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},crypto:{getRandomValues(a){a[0]=15432;return a}}};
 const ctx=vm.createContext({window,document,setInterval(){},clearInterval(){},setTimeout(){},clearTimeout(){},console,Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}}});
 vm.runInContext(art,ctx,{timeout:6000});vm.runInContext(game,ctx,{timeout:9000});
 return code=>JSON.parse(vm.runInContext('JSON.stringify('+code+')',ctx,{timeout:12000}));
}
test('Alle 390 Karten besitzen Bilder; 66 neue Stufenformen teilen ihre Basisillustration',()=>{
 const run=boot(),x=run('({number:CARDS.length,unique: new Set(CARDS.map(c=>c.art)).size,generated:CARDS.filter(c=>String(c.art).startsWith("data:image/svg+xml")).length,custom:CARDS.filter(c=>String(c.art).startsWith("assets/custom-art/")).length,customUnique:new Set(CARDS.filter(c=>String(c.art).startsWith("assets/custom-art/")).map(c=>c.art)).size,formsMatch:CARDS.filter(c=>c.manifestOf!=null&&String(c.art).startsWith("assets/custom-art/")).every(c=>CARDS[c.manifestOf]?.art===c.art),version:window.ArcaneArt.version})');
 assert.equal(x.number,390);assert.equal(x.generated+x.custom,390);assert.equal(x.customUnique,60);assert.equal(x.unique,293); // Original templates keep their 293 source images (including shared manifestations).assert.equal(x.formsMatch,true);assert.equal(x.version,'2.1');
});
test('Charakterpacks liefern drei verschiedene Angebote und höchstens eine seltene Gestalt',()=>{
 const run=boot();
 const r=run('(()=>{let violations=0,rarePacks=0,packs=0;for(let source=0;source<11;source++){for(const difficulty of ["easy","hard"]){for(let seed=1;seed<=90;seed++){const offers=drawCharacterPackOffers({seed},source,difficulty);if(offers.length!==3||new Set(offers).size!==3||offers.filter(id=>CARDS[id].fusionOnly||CARDS[id].manifestOf).length>1)violations++;rarePacks+=Number(offers.some(id=>CARDS[id].fusionOnly||CARDS[id].manifestOf));packs++;}}}return {violations,rarePacks,packs,rate:rarePacks/packs};})()');
 assert.equal(r.violations,0);assert.equal(r.packs,1980);
 assert.ok(r.rate>0&&r.rate<0.8,'Packs sollen seltene Karten ermöglichen, aber nicht garantieren');
});
test('Gameplay-Kern bleibt unangetastet: 4000 LP, Zerfall',()=>{
 const run=boot(),r=run('(()=>{const g=createGame({mode:"pve",starter:0,seed:8});const c=newInstance(g,RPG_DEFAULT_DECK[0],0);c.decayClass="starter";c.summonedTurn=1;c.decayTotal=0;g.players[0].field[0]=c;const before=dataOf(c).atk;advanceTurn(g);return {maxLP:g.maxLP,atk:before,after:dataOf(c).atk};})()');
 assert.equal(r.maxLP,4000);assert.equal(r.after,r.atk);
});
test('11 Gegnertexte und eindeutige Kernmonster-Namen bleiben erhalten',()=>{
 const run=boot(),r=run('({stories:RPG_OPPONENTS.filter(o=>o.profileLine&&o.profileLine.length>35).length,people:new Set(RPG_OPPONENTS.map(o=>o.name)).size,core:new Set(RPG_OPPONENTS.flatMap(o=>[...o.loot,...o.hardLoot].map(id=>CARDS[id].name))).size})');
 assert.deepEqual(r,{stories:11,people:11,core:45});
});
