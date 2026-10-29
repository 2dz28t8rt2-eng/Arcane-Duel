const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(require('node:path').join(__dirname,'../assets/game.js'),'utf8');
const cut=src.slice(0,src.indexOf('/* Ace-Karten werden vor dem Laden'));
test('Schicksalszug exists, hidden templates and equal access',()=>{assert.match(src,/function fatePressure\(/);assert.match(src,/function maybeFate\(/);assert.match(src,/g\.fateUsed\[id\]=true/);assert.match(src,/roundNumber\(g\)<3/);assert.match(src,/chance=pressure.score>=90\?5:pressure.score>=75\?3:pressure.score>=60\?1:0/);assert.match(src,/g\.mode!=='pve'/);assert.match(src,/FATE_CARD_IDS=CARDS\.filter/);assert.match(src,/if\(m.some\(c=>!c\|\|isFusionForbidden\(c,g\)\)\)return false/);});
test('visual animation and card protection',()=>{const css=fs.readFileSync(require('node:path').join(__dirname,'../assets/fate.css'),'utf8');assert.match(css,/fate-cinema/);assert.match(css,/fateFlip/);assert.match(src,/if\(old&&!replacing&&\(isFusionForbidden\(old\)\|\|isFusionForbidden\(incoming\)\)\)return null/);assert.match(src,/g\.fateEvent=\{owner:id/);});

// Runtime smoke tests use the actual browser game engine with a small DOM shim.
const path=require('node:path');
function boot(){
 const store=new Map(),nodes=new Map();function el(){return {innerHTML:'',textContent:'',hidden:false,disabled:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},insertAdjacentHTML(){},querySelector(){return null},querySelectorAll(){return []},append(){},appendChild(){},remove(){},focus(){},setAttribute(){}};}
 const document={body:el(),getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id)},querySelector(){return null},querySelectorAll(){return []},createElement:el,addEventListener(){}};
 const window={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},crypto:{getRandomValues(a){a[0]=123456;return a}}};
 const ctx=vm.createContext({window,document,console,Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){}});
 for(const f of ['assets/art-engine.js','assets/game.js','assets/expansion.js','assets/evolution.js'])vm.runInContext(fs.readFileSync(path.resolve(__dirname,'..',f),'utf8'),ctx,{timeout:20000});
 return exp=>JSON.parse(vm.runInContext('JSON.stringify('+exp+')',ctx,{timeout:20000}));
}
test('Fate uses 10 noncollectible templates without adding permanent cards',()=>{const r=boot()(`({pool:FATE_CARD_IDS.length,total:CARDS.length,levels:FATE_CARD_IDS.map(id=>CARDS[id].level),unique:new Set(FATE_CARD_IDS).size})`);assert.equal(r.pool,10);assert.ok(r.total>=396);assert.equal(r.unique,10);assert.ok(r.levels.every(x=>x===10));});
test('Fate draw scales against strongest enemy, persists and never repeats',()=>{
 const r=boot()(`(()=>{const g=createGame({id:'fate-test',mode:'pve',context:'free',opponentId:7});g.turn=5;g.players[0].lp=100;g.players[0].field.fill(null);g.players[1].field[0]={...newInstance(g,7,1),card:{level:CARDS[7].level,atk:3500,def:3200}};g.players[1].deck=[7];const before=g.players[0].deck.length;let hit=false;for(let i=1;i<500&&!hit;i++){g.seed=i;hit=maybeFate(g,0);}const hand=g.players[0].hand;const ref=fateReference(g,0);const snap=JSON.parse(JSON.stringify(g));const restored=validateDuelSnapshot(snap);return {hit,used:g.fateUsed[0],count:hand.length,fate:hand.every(isFateCard),atk:hand[0]?.card.atk,def:hand[0]?.card.def,ref,deck:g.players[0].deck.length,before,saved:restored.players[0].hand.every(isFateCard),repeat:maybeFate(g,0)};})()`);
 assert.equal(r.hit,true);assert.equal(r.used,true);assert.equal(r.count,5);assert.equal(r.fate,true);assert.equal(r.atk,r.ref.atk+100);assert.equal(r.def,r.ref.def+100);assert.equal(r.saved,true);assert.equal(r.repeat,false);assert.ok(r.deck>=r.before);
});
