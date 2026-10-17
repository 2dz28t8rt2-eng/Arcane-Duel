'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const js=['art-engine.js','game.js','expansion.js','evolution.js'].map(x=>fs.readFileSync(path.join(root,'assets',x),'utf8'));
function boot(saved=null){
 const nodes=new Map(),store=new Map(saved||[]);
 function el(id=''){return {id,innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},append(){},appendChild(){},remove(){},setAttribute(){},addEventListener(){},insertAdjacentHTML(){},click(){this.onclick?.()},querySelector(){return el()},querySelectorAll(){return []},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}}};}
 const doc={body:el('body'),getElementById(id){if(!nodes.has(id))nodes.set(id,el(id));return nodes.get(id)},querySelector(){return el()},querySelectorAll(){return []},createElement:el,addEventListener(){},elementFromPoint(){return null}};
 const window={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},crypto:{getRandomValues(a){a[0]=12345;return a}},innerWidth:1200,innerHeight:800};
 const ctx=vm.createContext({window,document:doc,console,setTimeout(){},setInterval(){},clearTimeout(){},clearInterval(){},Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}}});
 for(const source of js)vm.runInContext(source,ctx,{timeout:20000});
 return {run(expr){return JSON.parse(vm.runInContext(`JSON.stringify(${expr})`,ctx,{timeout:30000}))},store};
}
test('32 workshop families through level 10 retain unique IDs and the fusion/ACE roster',()=>{
 const r=boot().run(`({total:UPDATE_B_ACTIVE_IDS.length,unique:new Set(UPDATE_B_ACTIVE_IDS).size,normal:UPDATE_B_MAIN_IDS.filter(id=>!CARDS[id].ace).length,roots:UPDATE_B_NORMAL_ROOTS.length,variants:NORMAL_LINE_VARIANT_IDS.length,fusions:UPDATE_B_FUSION_IDS.length,aces:UPDATE_B_ACE_IDS.length,roster:RPG_BASE_CARDS.length+RPG_FUSIONS.length,version:SAVE_KEY})`);
 assert.equal(r.total,r.unique);assert.equal(r.roots,22);assert.equal(r.variants,66);assert.equal(r.fusions,31);assert.equal(r.aces,10);assert.equal(r.roster,r.total+3);assert.ok(r.total>=128);assert.equal(r.normal,r.total-41);
 assert.match(r.version,/v4-reborn$/);
});
test('Normal monster family retains one element and one artwork across four real cards',()=>{
 const r=boot().run(`UPDATE_B_NORMAL_ROOTS.map(root=>{const rows=[CARDS[root],...NORMAL_LINE_VARIANT_IDS.map(id=>CARDS[id]).filter(c=>c.variantOf===root)];return {root,level:rows.map(c=>c.level),elements:new Set(rows.map(c=>c.element)).size,art:new Set(rows.map(c=>c.art)).size,unique:new Set(rows.map(c=>c.id)).size,retired:rows.some(c=>c.retired)};})`);
 assert.equal(r.length,22);for(const line of r){assert.equal(line.level.length,4);assert.equal(line.unique,4);assert.equal(line.elements,1);assert.equal(line.art,1);assert.equal(line.retired,false)}
});
test('Legacy saves are intentionally ignored and newly created players have valid fresh decks',()=>{
 const old='arcane-duel-rpg-profile-v3';const b=boot([[old,JSON.stringify({coins:1234567,version:3})]]);
 const r=b.run(`({coins:profile.coins,version:profile.version,main:mainDeckError(profile.activeDeck),fusion:fusionDeckError(profile.fusionDeck),length:profile.activeDeck.length,fusionCount:profile.fusionDeck.length,containsOldKey:!!window.localStorage.getItem('arcane-duel-rpg-profile-v3'),activeKeys:Object.keys(profile.inventory).length})`);
 assert.equal(r.coins,0);assert.equal(r.main,'');assert.equal(r.fusion,'');assert.equal(r.length,40);assert.equal(r.fusionCount,6);assert.equal(r.containsOldKey,true);
});
test('All tournament tiers have valid opponent decks and preserve collectible ACE identity',()=>{
 const r=boot().run(`OPPONENTS.map(o=>{const levels={};for(const mode of ['easy','hard']){const e=rpgEnemyLoadout(o.id,mode);levels[mode]={main:mainDeckError(e.deck),fusion:fusionDeckError(e.fusionDeck),count:e.deck.length,stock:e.fusionDeck.length,normal:!e.deck.some(id=>CARDS[id].fusionOnly),available:e.deck.every(id=>UPDATE_B_SET.has(id)),fusions:e.fusionDeck.filter(id=>!UPDATE_B_SET.has(id)).length};}return {id:o.id,levels,ace:o.id===0?true:(CARDS[o.aceCard].fusionOnly?levels.easy.stock>=1:true)};})`);
 for(const o of r){for(const mode of ['easy','hard']){const e=o.levels[mode];assert.equal(e.main,'',`Opponent ${o.id} ${mode}: ${e.main}`);assert.equal(e.fusion,'',`Opponent ${o.id} ${mode}: ${e.fusion}`);assert.equal(e.count,40);assert.equal(e.normal,true);assert.equal(e.available,true)}assert.equal(o.ace,true)}
});
test('Boosters from tier 0 to 10 return only curated, available and finite card templates',()=>{
 const r=boot().run(`(()=>{const errors=[];for(let tier=0;tier<=10;tier++){const pools=boosterPools(tier);if(!pools.starter.length||!pools.normal.length||!pools.rare.length)errors.push({tier,issue:'empty pool'});for(let seed=1;seed<=30;seed++){const cards=rollBooster(tier,{seed},10);if(cards.length!==10||cards.some(id=>!UPDATE_B_SET.has(id)))errors.push({tier,seed,cards});}}return errors;})()`);
 assert.deepEqual(r,[]);
});
test('Opponents draw 3 distinct or more available commons and their fusion loot, with normalized odds',()=>{
 const r=boot().run(`OPPONENTS.flatMap(o=>['easy','hard'].map(mode=>{const pool=lootPool(o.id,mode),table=lootWeights(o.id,mode);return {tier:o.id,mode,len:pool.length,unique:new Set(pool).size,normal:pool.filter(id=>!CARDS[id].fusionOnly).length,fusion:pool.filter(id=>CARDS[id].fusionOnly).length,active:pool.every(id=>UPDATE_B_SET.has(id)),odds:table.reduce((n,x)=>n+x.weight,0),valid:table.every(x=>Number.isFinite(x.weight)&&x.weight>=0)};}))`);
 for(const e of r){assert.ok(e.len>=5);assert.equal(e.unique,e.len);assert.ok(e.normal>=3);assert.ok(e.fusion>=2);assert.ok(e.active);assert.ok(Math.abs(e.odds-100)<.0001);assert.ok(e.valid)}
});
test('Character packs offer three different curated cards with no more than one rare',()=>{
 const r=boot().run(`(()=>{const issues=[];for(let tier=0;tier<=10;tier++){for(let seed=1;seed<=20;seed++){const cards=drawCharacterPackOffers({seed},tier,'easy');if(cards.length!==3||new Set(cards).size!==3||cards.some(id=>!UPDATE_B_SET.has(id))||cards.filter(id=>CARDS[id].fusionOnly).length>1)issues.push({tier,seed,cards})}}return issues;})()`);
 assert.deepEqual(r,[]);
});
test('Milestones offer three unique real fusion choices from the curated pool',()=>{
 const r=boot().run(`OPPONENTS.map(o=>({tier:o.id,choices:milestoneOffers(o.id)}))`);
 for(const x of r){assert.equal(x.choices.length,3);assert.equal(new Set(x.choices).size,3);assert.ok(x.choices.every(id=>id!==undefined))}
});
test('Only active daily quests progress; a newly activated quest always starts from zero',()=>{
 const x=boot().run(`(()=>{
  const q=profile.evolution; q.active=[{id:'fusion3',progress:0,duels:[],activatedAt:Date.now()},{id:'win3',progress:0,duels:[],activatedAt:Date.now()},{id:'normal2500',progress:0,duels:[],activatedAt:Date.now()}];q.used=q.active.map(x=>x.id);q.done=0;
  const g=createGame({mode:'pve',opponentId:0,seed:122,starter:0});g.totalFusions[0]=3;g.winner=0;rewardMatch(g);
  const before=q.active.map(v=>({id:v.id,progress:v.progress}));const claim=window.ArcaneEvolution.claimQuest('fusion3');
  const after=profile.evolution.active.map(v=>({id:v.id,progress:v.progress}));
  return {before,after,claim,done:profile.evolution.done,active:profile.evolution.active.length,used:profile.evolution.used.length};})()`);
 assert.equal(x.before.find(q=>q.id==='fusion3').progress,3);assert.equal(x.before.find(q=>q.id==='win3').progress,1);
 assert.equal(x.claim,true);assert.equal(x.active,3);assert.equal(x.done,1);assert.equal(x.used,4);
 const next=x.after.find(q=>!x.before.some(p=>p.id===q.id));assert.ok(next);assert.equal(next.progress,0);
});
test('Daily quest turnover preserves permanent defense/burst/fusion rewards',()=>{
 const r=boot().run(`(()=>{profile.evolution.records.fusion[4]=3;profile.evolution.bonuses=['fusion'];profile.evolution.day='2000-01-01';window.ArcaneEvolution.refillQuests();return {record:profile.evolution.records.fusion[4],bonus:profile.evolution.bonuses.includes('fusion'),count:profile.evolution.active.length,progress:profile.evolution.active.map(x=>x.progress)};})()`);
 assert.equal(r.record,3);assert.equal(r.bonus,true);assert.equal(r.count,3);assert.deepEqual(r.progress,[0,0,0]);
});
test('Classic generated SVG monsters fit fully, while custom illustrations may fill the card art',()=>{
 const src=fs.readFileSync(path.join(root,'assets','game.js'),'utf8');const css=fs.readFileSync(path.join(root,'assets','card-look-v3.css'),'utf8');
 assert.match(src,/legacy-art/);assert.match(css,/legacy-art\{object-fit:contain!important/);
});
test('All 10 tournament opponents finish deterministic simulations without errors',()=>{
 const r=boot().run(`(()=>{const out=[];for(let i=1;i<=10;i++)for(let seed=1;seed<=12;seed++){const g=createGame({mode:'pve',context:'tournament',opponentId:i,seed,starter:seed%2});simulateGame(g);out.push({tier:i,winner:g.winner,turn:g.turn});}return out;})()`);
 assert.equal(r.length,120);assert.ok(r.every(x=>(x.winner===0||x.winner===1)&&x.turn<=50));
});
