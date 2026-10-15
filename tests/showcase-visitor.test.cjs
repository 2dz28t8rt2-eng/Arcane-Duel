'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function boot(){
 const store=new Map(),nodes=new Map();function el(){return {innerHTML:'',textContent:'',hidden:false,disabled:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},insertAdjacentHTML(){},querySelector(){return null},querySelectorAll(){return []},append(){},appendChild(){},remove(){},focus(){},setAttribute(){}};}
 const document={body:el(),getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id)},querySelector(){return null},querySelectorAll(){return []},createElement:el,addEventListener(){}};
 const window={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},crypto:{getRandomValues(a){a[0]=123456;return a}}};
 const ctx=vm.createContext({window,document,console,Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){}});
 for(const f of ['assets/art-engine.js','assets/game.js','assets/expansion.js','assets/evolution.js'])vm.runInContext(fs.readFileSync(path.resolve(__dirname,'..',f),'utf8'),ctx,{timeout:20000});
 return exp=>JSON.parse(vm.runInContext('JSON.stringify('+exp+')',ctx,{timeout:20000}));
}
test('Showcase enemy deck has exactly 40 level 8-10 normal monsters and valid fusion deck',()=>{
 const r=boot()(`(()=>{const e=showcaseEnemy();return {baseCount:RPG_BASE_CARDS.filter(c=>c.level>=8&&c.level<=10).length,mainError:mainDeckError(e.deck,e.deck),fusionError:fusionDeckError(e.fusionDeck),main:e.deck.map(id=>CARDS[id].level),fusions:e.fusionDeck.map(id=>CARDS[id].level),distinct:new Set(e.deck).size};})()`);
 assert.equal(r.mainError,"");assert.equal(r.fusionError,"");assert.equal(r.main.length,40);assert.ok(r.main.every(n=>n>=8&&n<=10));assert.ok(r.fusions.length>=2&&r.fusions.every(n=>n>=8&&n<=10));assert.ok(r.distinct>=14);
});
test('Third training win queues mandatory visitor and only once',()=>{
 const r=boot()(`(()=>{profile.trainingWins=2;const g=createGame({id:'showcase-training-3',mode:'pve',context:'free',opponentId:0,trainingStage:2});g.winner=0;const reward=rewardMatch(g);return {training:profile.trainingWins,pending:profile.showcase.pending,advance:reward.trainingAdvance,losses:profile.losses};})()`);
 assert.equal(r.training,3);assert.equal(r.pending,true);assert.equal(r.advance,3);assert.equal(r.losses,0);
});
test('Exhibition loss does not count as a defeat or remove currency',()=>{
 const r=boot()(`(()=>{profile.trainingWins=3;profile.showcase.seen=true;const before={coins:profile.coins,xp:profile.xp,losses:profile.losses};const g=createGame({id:'showcase-loss',mode:'pve',context:'challenge',opponentId:8,enemy:showcaseEnemy(),showcase:true});g.showcase=true;g.winner=1;const reward=rewardMatch(g);return {before,after:{coins:profile.coins,xp:profile.xp,losses:profile.losses},reward};})()`);
 assert.deepEqual(r.before,r.after);assert.equal(r.reward.coins,0);assert.equal(r.reward.xp,0);
});
test('First exhibition victory gives large reward and one character pack, repeats do not',()=>{
 const r=boot()(`(()=>{profile.trainingWins=3;profile.showcase.seen=true;const before=profile.packs[packKey(8,'easy')];const g=createGame({id:'showcase-first',mode:'pve',context:'challenge',opponentId:8,enemy:showcaseEnemy(),showcase:true});g.showcase=true;g.winner=0;const first=rewardMatch(g);const mid=profile.packs[packKey(8,'easy')];const g2=createGame({id:'showcase-repeat',mode:'pve',context:'challenge',opponentId:8,enemy:showcaseEnemy(),showcase:true});g2.showcase=true;g2.winner=0;const repeat=rewardMatch(g2);return {before,mid,after:profile.packs[packKey(8,'easy')],first:first.coins,repeat:repeat.coins,firstFlag:first.showcaseFirst,repeatFlag:repeat.showcaseFirst};})()`);
 assert.equal(r.mid,r.before+1);assert.equal(r.after,r.mid);assert.ok(r.first>r.repeat);assert.equal(r.firstFlag,true);assert.equal(r.repeatFlag,false);
});
test('Offer triggers only after three wins and expires after the next duel',()=>{
 const r=boot()(`(()=>{profile.showcase.seen=true;profile.trainingWins=3;const g={mode:'pve',context:'free',winner:0,seed:1};showcaseTrackDuel(g);showcaseTrackDuel(g);const two=profile.showcase.streak;showcaseTrackDuel(g);const afterThree={streak:profile.showcase.streak,offered:profile.showcase.offered};profile.showcase.offered=true;showcaseTrackDuel({...g,winner:1});return {two,afterThree,expired:!profile.showcase.offered};})()`);
 assert.equal(r.two,2);assert.equal(r.afterThree.streak,0);assert.equal(r.expired,true);
});
test('Mandatory dialogue starts a resumable showcase duel, with high-level enemy deck',()=>{
 const r=boot()(`(()=>{profile.trainingWins=3;profile.showcase.pending=true;const shown=showShowcaseIntro();const title=document.getElementById('modal').innerHTML;document.getElementById('showcaseBegin').onclick();const g=game;return {shown,title:title.includes('Vael'),pending:profile.showcase.pending,seen:profile.showcase.seen,showcase:g.showcase,opponent:g.opponentId,levels:g.players[1].originalDeck.map(id=>CARDS[id].level),saved:!!profile.activeDuel,resumed:validateDuelSnapshot(profile.activeDuel).showcase};})()`);
 assert.equal(r.shown,true);assert.equal(r.title,true);assert.equal(r.pending,false);assert.equal(r.seen,true);assert.equal(r.showcase,true);assert.equal(r.opponent,8);assert.ok(r.levels.every(n=>n>=8&&n<=10));assert.equal(r.saved,true);assert.equal(r.resumed,true);
});
test('Special character pack can be opened without unlocking opponent VIII',()=>{
 const r=boot()(`(()=>{profile.trainingWins=3;profile.showcase.seen=true;const g=createGame({id:'showcase-pack',mode:'pve',context:'challenge',opponentId:8,enemy:showcaseEnemy(),showcase:true});g.showcase=true;g.winner=0;rewardMatch(g);const available=profile.packs[packKey(8,'easy')];const opened=openCharacterPack(8,'easy');return {available,opened,source:profile.openPack?.source,cards:profile.openPack?.cards?.length};})()`);
 assert.equal(r.available,1);assert.equal(r.opened,true);assert.equal(r.source,8);assert.equal(r.cards,3);
});
test('Showcase enemy completes multiple AI-controlled exhibition battles without runtime errors',()=>{
 const r=boot()(`(()=>{const results=[];for(let i=0;i<12;i++){const g=createGame({id:'showcase-sim-'+i,seed:1400+i,mode:'pve',context:'challenge',opponentId:8,enemy:showcaseEnemy(),showcase:true});g.showcase=true;simulateGame(g,'balanced',OPPONENTS[8].policy);results.push({winner:g.winner,turn:g.turn});}return results;})()`);
 assert.equal(r.length,12);assert.ok(r.every(x=>[0,1].includes(x.winner)&&x.turn>0&&x.turn<=30));
});