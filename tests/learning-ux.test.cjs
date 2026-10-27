'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function boot(persisted=false){
 const nodes=new Map(),store=new Map(),handlers={};
 function el(id=''){return {id,innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},append(){},appendChild(){},remove(){},setAttribute(){},addEventListener(){},insertAdjacentHTML(){},click(){this.onclick?.()},querySelector(){return el()},querySelectorAll(){return []},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}}};}
 const document={_handlers:handlers,body:el('body'),getElementById(id){if(!nodes.has(id))nodes.set(id,el(id));return nodes.get(id)},querySelector(){return el()},querySelectorAll(){return []},createElement:el,addEventListener(k,f){(handlers[k]||=[]).push(f)},elementFromPoint(){return null}};
 const window={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},crypto:{getRandomValues(a){a[0]=123456;return a}},innerWidth:1200,innerHeight:800};
 const ctx=vm.createContext({window,document,console,setTimeout(){},setInterval(){},clearTimeout(){},clearInterval(){},Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}}});
 for(const file of ['art-engine.js','game.js','expansion.js','evolution.js'])vm.runInContext(fs.readFileSync(path.join(root,'assets',file),'utf8'),ctx,{timeout:20000});
 if(persisted)vm.runInContext(`profile.fateDiscovered=true;profile.lessonCompleted=['pair'];saveProfile();profile=validateProfile(JSON.parse(window.localStorage.getItem(SAVE_KEY)));`,ctx,{timeout:20000});
 vm.runInContext('async function fateAnimation(g){}',ctx);
 vm.runInContext(fs.readFileSync(path.join(root,'assets/learning.js'),'utf8'),ctx,{timeout:20000});
 return expr=>JSON.parse(vm.runInContext(`JSON.stringify(${expr})`,ctx,{timeout:20000}));
}
test('13 guided lessons supply legal 40-card loan decks with no more than 3 copies each',()=>{
 const run=boot();const r=run('window.ArcaneLearning.lessons.map(l=>({id:l.id,weights:l.weights,deck:window.ArcaneLearning.buildDeck(l.id)}))');
 assert.equal(r.length,13);
 for(const x of r){assert.equal(x.deck.length,40,x.id);const freq=Object.values(x.deck.reduce((a,v)=>(a[v]=(a[v]||0)+1,a),{}));assert.ok(Math.max(...freq)<=3,x.id);}
});
test('lesson duel uses loan deck without changing player inventory or deck and remains resumable',()=>{
 const run=boot();
 const r=run(`(()=>{
  profile.trainingWins=3;profile.cleared=[1];profile.showcase.seen=true;profile.showcase.pending=false;
  const before={deck:[...profile.activeDeck],fusions:[...profile.fusionDeck],inventory:JSON.stringify(profile.inventory)};
  const handler=document._handlers.click.at(-1);
  handler({target:{closest(query){return query==='[data-lesson]'?{dataset:{lesson:'pair'}}:null}}});
  document.getElementById('lessonConfirm').onclick();
  const g=game;
  return {lesson:g.lessonId,context:g.context,maxLP:g.maxLP,firstDeck:mainDeckError(g.players[0].originalDeck),fusion:fusionDeckError(g.players[0].fusionDeck),snapshot:validateDuelSnapshot(JSON.parse(JSON.stringify(g))).lessonId,sameDeck:JSON.stringify(before.deck)===JSON.stringify(profile.activeDeck),sameFusions:JSON.stringify(before.fusions)===JSON.stringify(profile.fusionDeck),sameInventory:before.inventory===JSON.stringify(profile.inventory)};
 })()`);
 assert.equal(r.lesson,'pair');assert.equal(r.context,'challenge');assert.equal(r.maxLP,6000);assert.equal(r.firstDeck,'');assert.equal(r.fusion,'');assert.equal(r.snapshot,'pair');
 assert.equal(r.sameDeck,true);assert.equal(r.sameFusions,true);assert.equal(r.sameInventory,true);
});
test('first successful lesson awards one character pack, no repeat farming or unmatched reward',()=>{
 const run=boot(),r=run(`(()=>{
  profile.trainingWins=3;profile.cleared=[1];profile.showcase.seen=true;
  const make=(id,pattern,win)=>{const g=createGame({id,mode:'pve',opponentId:1,context:'free'});g.lessonId='pair';g.lessonPatterns=pattern;g.context='challenge';g.winner=win;return rewardMatch(g);};
  const key=packKey(1,'easy'),before=profile.packs[key],noCombo=make('l-1',[],0),afterNoCombo=profile.packs[key],first=make('l-2',['Paar'],0),afterFirst=profile.packs[key],again=make('l-3',['Paar'],0),afterAgain=profile.packs[key];
  const lose=make('l-4',['Paar'],1);
  return {before,afterNoCombo,afterFirst,afterAgain,first:first.lessonPack,again:again.lessonPack,noCombo:noCombo.lessonPassed,lose:lose.lessonPassed,completed:profile.lessonCompleted};
 })()`);
 assert.equal(r.before,r.afterNoCombo);assert.equal(r.afterFirst,r.before+1);assert.equal(r.afterAgain,r.afterFirst);assert.equal(r.first,true);assert.ok(!r.again);assert.equal(r.noCombo,false);assert.equal(r.lose,false);assert.deepEqual(r.completed,['pair']);
});
test('every lesson combination has a valid available fusion template in its practice deck',()=>{
 const run=boot();const result=run(`(()=>{
  profile.trainingWins=3;profile.cleared=[1];profile.showcase.seen=true;
  return window.ArcaneLearning.lessons.map(l=>{
   const handler=document._handlers.click.at(-1);
   game=null;profile.activeDuel=null;uiMode='menu';
   handler({target:{closest(q){return q==='[data-lesson]'?{dataset:{lesson:l.id}}:null}}});
   document.getElementById('lessonConfirm').onclick();
   const g=game;g.active=0;
   const n=g.players[0].originalDeck.map(id=>CARDS[id].level);
   const materialCount=l.levels.every(level=>n.filter(v=>v===level).length>=l.levels.filter(x=>x===level).length);
   const available=fusionOptions(g,l.levels).length;
   const budget=fusionBudget(l.levels,g);
   return {id:l.id,materialCount,available,budget};
  });})()`);
 for(const item of result){assert.ok(item.materialCount,item.id+' missing material');assert.ok(item.available>0,item.id+' no fusion option: '+JSON.stringify(item));}
});
test('Fate information is initially undiscovered and preserved in save-validation',()=>{
 const run=boot(),r=run(`(()=>{const initial=profile.fateDiscovered;profile.fateDiscovered=true;const validated=validateProfile(JSON.parse(JSON.stringify(profile))).fateDiscovered;return {initial,validated};})()`);
 assert.equal(r.initial,false);assert.equal(r.validated,true);
});

test('discovery and learning completion survive base-game save validation on reload',()=>{
 const run=boot(true),r=run('({discovered:profile.fateDiscovered,completed:profile.lessonCompleted})');
 assert.equal(r.discovered,true);assert.deepEqual(r.completed,['pair']);
});
