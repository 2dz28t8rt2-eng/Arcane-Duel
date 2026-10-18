'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const scripts=['art-engine.js','game.js','expansion.js','evolution.js'].map(x=>fs.readFileSync(path.join(root,'assets',x),'utf8'));
function boot(saved=null){
 const nodes=new Map(),store=new Map(saved||[]);
 function el(id=''){return {id,innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},append(){},appendChild(){},remove(){},setAttribute(){},addEventListener(){},insertAdjacentHTML(){},click(){this.onclick?.()},querySelector(){return el()},querySelectorAll(){return []},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}}};}
 const doc={body:el('body'),getElementById(id){if(!nodes.has(id))nodes.set(id,el(id));return nodes.get(id)},querySelector(){return el()},querySelectorAll(){return []},createElement:el,addEventListener(){},elementFromPoint(){return null}};
 const window={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},crypto:{getRandomValues(a){a[0]=12345;return a}},innerWidth:1200,innerHeight:800};
 const ctx=vm.createContext({window,document:doc,console,setTimeout(){},setInterval(){},clearTimeout(){},clearInterval(){},Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}}});
 for(const source of scripts)vm.runInContext(source,ctx,{timeout:20000});
 return {run(expr){return JSON.parse(vm.runInContext(`JSON.stringify(${expr})`,ctx,{timeout:30000}))},store};
}
test('Skipping a quest counts towards 15 and instantly activates a zero-progress replacement',()=>{
 const r=boot().run(`(()=>{
 const x=profile.evolution,before=x.active.map(q=>q.id),coins=profile.coins;
 x.active[0].progress=2;
 const ok=window.ArcaneEvolution.skipQuest(before[0]);
 return {ok,done:x.done,skipped:x.skipped,active:x.active.length,used:x.used.length,coins:profile.coins,oldPresent:x.active.some(q=>q.id===before[0]),replacements:x.active.filter(q=>!before.includes(q.id)).map(q=>q.progress),otherProgress:x.active.find(q=>q.id===before[1]).progress};
})()`);
 assert.equal(r.ok,true);assert.equal(r.done,1);assert.equal(r.skipped,1);assert.equal(r.active,3);assert.equal(r.used,4);assert.equal(r.coins,0);assert.equal(r.oldPresent,false);assert.deepEqual(r.replacements,[0]);assert.equal(r.otherProgress,0);
});
test('Skipping same/unknown quest a second time cannot produce another consumed slot or reward',()=>{
 const r=boot().run(`(()=>{const id=profile.evolution.active[0].id;const first=window.ArcaneEvolution.skipQuest(id),same=window.ArcaneEvolution.skipQuest(id),unknown=window.ArcaneEvolution.skipQuest('invalid');return {first,same,unknown,done:profile.evolution.done,coins:profile.coins}})()`);
 assert.deepEqual(r,{first:true,same:false,unknown:false,done:1,coins:0});
});
test('Skipping all fifteen daily opportunities never activates a sixteenth quest',()=>{
 const r=boot().run(`(()=>{const x=profile.evolution;let n=0;while(x.active.length&&n<16){if(!window.ArcaneEvolution.skipQuest(x.active[0].id))break;n++}return {n,done:x.done,skipped:x.skipped,active:x.active.length,used:x.used.length,refill:(window.ArcaneEvolution.refillQuests(),x.active.length)}})()`);
 assert.deepEqual(r,{n:15,done:15,skipped:15,active:0,used:15,refill:0});
});
test('Claiming plus skipping share the daily limit, while skipped quests never pay',()=>{
 const r=boot().run(`(()=>{const x=profile.evolution;const first=x.active[0].id,q=window.ArcaneEvolution.quests.find(q=>q.id===first);x.active[0].progress=q.target;const claim=window.ArcaneEvolution.claimQuest(first),second=x.active[0].id;const coins=profile.coins,skip=window.ArcaneEvolution.skipQuest(second);return {claim,skip,done:x.done,skipped:x.skipped,coins,coinsAfterSkip:profile.coins,active:x.active.length,used:x.used.length}})()`);
 assert.equal(r.claim,true);assert.equal(r.skip,true);assert.equal(r.done,2);assert.equal(r.skipped,1);assert.equal(r.coinsAfterSkip,r.coins);assert.equal(r.active,3);assert.equal(r.used,5);
});
test('Quest skip is persistent across reload and is reset on a new day',()=>{
 const b=boot();const before=b.run(`(()=>{const id=profile.evolution.active[0].id;window.ArcaneEvolution.skipQuest(id);return {saved:saveProfile(),done:profile.evolution.done,skipped:profile.evolution.skipped,active:profile.evolution.active.length}})()`);
 assert.equal(before.saved,true);const n=boot([...b.store]);const retained=n.run('({done:profile.evolution.done,skipped:profile.evolution.skipped,active:profile.evolution.active.length})');assert.deepEqual(retained,{done:1,skipped:1,active:3});
 const next=n.run(`(()=>{profile.evolution.records.fusion[4]=3;profile.evolution.day='1999-12-31';window.ArcaneEvolution.refillQuests();return {done:profile.evolution.done,skipped:profile.evolution.skipped,active:profile.evolution.active.length,used:profile.evolution.used.length,record:profile.evolution.records.fusion[4]}})()`);
 assert.deepEqual(next,{done:0,skipped:0,active:3,used:3,record:3});
});
test('Replacement quest does not retroactively earn progress from an already-started duel',()=>{
 const r=boot().run(`(()=>{const g=createGame({mode:'pve',opponentId:0,seed:88,starter:0}),start=g.questActiveIds;window.ArcaneEvolution.skipQuest(start[0]);g.winner=0;g.totalFusions[0]=12;rewardMatch(g);return {start,active:profile.evolution.active.map(q=>({id:q.id,progress:q.progress})),newCount:profile.evolution.active.filter(q=>!start.includes(q.id)).length}})()`);
 assert.equal(r.newCount,1);const newcomer=r.active.find(q=>!r.start.includes(q.id));assert.ok(newcomer);assert.equal(newcomer.progress,0);
});
test('Existing save key remains stable; fresh account has level 2, 3 and 4 starter fusions',()=>{
 const r=boot().run(`({key:SAVE_KEY,starter:profile.fusionDeck.map(id=>({level:CARDS[id].level,rare:CARDS[id].rarity==='rare'})),level6:profile.fusionDeck.some(id=>CARDS[id].level===6)})`);
 assert.equal(r.key,'arcane-duel-rpg-profile-v4-reborn');assert.deepEqual([...new Set(r.starter.map(x=>x.level))].sort((a,b)=>a-b),[2,3,4]);assert.equal(r.starter.some(x=>x.rare),false);assert.equal(r.level6,false);
});
test('Two pairs including level-one materials beat a single pair at level three in quality',()=>{
 const r=boot().run(`({single:window.ArcaneEvolution.fusionQuality([3,3]).factor,two:window.ArcaneEvolution.fusionQuality([3,3,1,1]).factor,small:window.ArcaneEvolution.fusionQuality([1,2,3]).factor})`);
 assert.ok(r.two>r.single,JSON.stringify(r));assert.ok(r.small>1.06,JSON.stringify(r));
});
test('Card markup hides ATK/DEF labels but preserves descriptive screen-reader attributes',()=>{
 const r=boot().run(`(()=>{const h=fullCardHtml({id:0});return {labels:h.includes('stat-label'),aria:h.includes('aria-label="Angriff'),stat:h.includes('class="stat-value"'),element:displayElement('DUNKEL')}})()`);
 assert.deepEqual(r,{labels:false,aria:true,stat:true,element:'Dunkelheit'});
});
