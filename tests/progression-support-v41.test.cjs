'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
function setup(){
 const b=boot({seed:1917});
 b.exec(`profile=freshProfile();profile.guideSeen=true;profile.trainingWins=3;
  globalThis.prizeGame=(mode,stage=1,tier=0,goals=3)=>{
   profile.cleared=Array.from({length:tier},(_,i)=>i+1);
   const g=createGame({id:'prize-'+mode+'-'+stage+'-'+Math.random(),mode:'pve',opponentId:1,context:'challenge',challenge:'evo-'+mode+'-'+stage,seed:218,starter:0});
   g.evolutionCashout=true;g.winner=0;
   if(mode==='defense')g.turn=2*([3,5,7][goals-1]+Math.floor((stage-1)/2))-1;
   if(mode==='burst')g.damageDealt[0]=[0,3000,4000,5000,6000,7500][stage]*[.25,.55,.95][goals-1];
   if(mode==='fusion'){g.evoStats.fusions=3;g.evoStats.maxMaterials=Math.min(5,stage+1);g.evoStats.combos=1;}
   return g;
  };`);
 return b;
}
test('Role prizes scale with both progress and difficulty and never cross workshop limits',()=>{
 const rows=setup().run(`(()=>{const out=[];for(let tier=0;tier<=10;tier++)for(const mode of ['defense','burst','fusion'])for(let stage=1;stage<=5;stage++){
  const p=ArcaneProgressionSupport.rewardPlan(mode,stage,tier),cap=tier>=7?10:tier>=5?8:tier>=3?6:4;
  out.push({tier,mode,stage,level:p.level,target:p.targetLevel,cap,valid:p.ids.length>0&&p.ids.every(id=>CARDS[id].level===p.level&&(mode==='fusion'?CARDS[id].fusionOnly:CARDS[id].role===p.role))});
 }return out;})()`);
 assert.equal(rows.length,165);
 for(const row of rows){assert.ok(row.valid,JSON.stringify(row));assert.ok(row.level<=row.target&&row.target<=row.cap,JSON.stringify(row));}
 for(const mode of ['burst','fusion'])assert.ok(rows.find(r=>r.tier===7&&r.mode===mode&&r.stage===5).level>rows.find(r=>r.tier===0&&r.mode===mode&&r.stage===1).level);
});
test('A full defense stage gives exactly one card; replaying and duplicate payouts cannot mint more',()=>{
 const r=setup().run(`(()=>{const g=prizeGame('defense'),before={...profile.inventory},reward=rewardMatch(g),id=reward.roleChallengeCard;
  const count=profile.inventory[id],again=rewardMatch(g),replay=rewardMatch(prizeGame('defense'));
  return {role:CARDS[id].role,delta:count-(before[id]||0),again,replayCard:replay.roleChallengeCard??null,unchanged:profile.inventory[id]===count,saved:validateProfile(JSON.parse(JSON.stringify(profile))).progressionSupport.prizes.defense[0]===id};})()`);
 assert.deepEqual(r,{role:'soul',delta:1,again:null,replayCard:null,unchanged:true,saved:true});
});
test('Partial completion preserves its Essence reward and leaves the role card available',()=>{
 const r=setup().run(`(()=>{const a=rewardMatch(prizeGame('defense',1,0,2)),b=rewardMatch(prizeGame('defense',1,0,3));return {partial:a.objectives,coins:a.coins,partialCard:a.roleChallengeCard??null,full:b.objectives,fullCard:Number.isInteger(b.roleChallengeCard)};})()`);
 assert.deepEqual(r,{partial:2,coins:56,partialCard:null,full:3,fullCard:true});
});
test('A challenge retains the prize level from its start across saving and later progression',()=>{
 const r=setup().run(`(()=>{const g=prizeGame('burst',5,0),raw=JSON.parse(JSON.stringify(g)),restored=validateDuelSnapshot(raw);
  profile.cleared=[1,2,3,4,5,6,7,8,9];const reward=rewardMatch(restored);return {tier:restored.roleRewardTier,level:CARDS[reward.roleChallengeCard].level,count:restored.executedAttacks};})()`);
 assert.equal(r.tier,0);assert.ok(r.level<=4);assert.deepEqual(r.count,[0,0]);
});
test('Three losses at IV, V and IX offer contextual help without counting other opponents or farming',()=>{
 const r=setup().run(`(()=>{const p=freshProfile();p.history=[{context:'free',opponent:4,win:true},{context:'tournament',opponent:4,win:false},{context:'tournament',opponent:4,win:false},{context:'tournament',opponent:3,win:false},{context:'tournament',opponent:4,win:false}];
  const hint=ArcaneProgressionSupport.helpData(4,p);p.cleared=[4];const cleared=ArcaneProgressionSupport.helpData(4,p);return {losses:hint.losses,cap:hint.cap,cleared,unsupported:ArcaneProgressionSupport.helpData(6,p)};})()`);
 assert.deepEqual(r,{losses:3,cap:4,cleared:null,unsupported:null});
});
test('Fusion preview explains consumed zones and inherited roles without consuming RNG, cards or templates',()=>{
 const r=setup().run(`(()=>{const g=createGame({mode:'pve',opponentId:4,seed:192}),p=g.players[0];g.active=0;
  const ids=[...ARCANE_STAGE_IDS.values()].filter(id=>CARDS[id].role==='guardian'&&CARDS[id].level===2).slice(0,3),m=ids.map(id=>newInstance(g,id,0));p.field=[...m,null,null];
  const t=RPG_FUSIONS.find(c=>c.level===4&&c.role==='predator');p.remainingFusion=[t.id,t.id];
  const before=JSON.stringify(g),v=ArcaneProgressionSupport.fusionDecision(g,m,t);return {same:JSON.stringify(g)===before,role:v.role,field:v.field,change:v.fieldChange,chance:v.chance,remaining:v.remaining};})()`);
 assert.deepEqual(r,{same:true,role:'guardian',field:3,change:-2,chance:1,remaining:1});
});
test('A real counterstrike win earns 10 percent without requiring a player attack and pays only once',()=>{
 const r=setup().run(`(()=>{const g=createGame({id:'counter-win',mode:'pve',context:'free',opponentId:3,seed:1917,starter:1});g.active=1;g.turn=2;
  const ids=[...ARCANE_STAGE_IDS.values()],d=newInstance(g,ids.find(id=>CARDS[id].role==='guardian'&&CARDS[id].level===4),0),a=newInstance(g,ids.find(id=>CARDS[id].role==='predator'&&CARDS[id].level===1),1);
  d.mode='def';g.players[0].field=[d,null,null,null,null];g.players[1].field=[a,null,null,null,null];g.players[1].lp=1;
  attack(g,0,0);const before=profile.coins,reward=rewardMatch(g),again=rewardMatch(g);return {winner:g.winner,counts:g.executedAttacks,bonus:reward.noAttackBonus,expected:Math.floor(OPPONENTS[3].coins*.1),coins:reward.coins,delta:profile.coins-before,again};})()`);
 assert.equal(r.winner,0);assert.deepEqual(r.counts,[0,1]);assert.equal(r.bonus,r.expected);assert.equal(r.coins,r.delta);assert.equal(r.again,null);
});
test('Executed attacks count even with zero damage; illegal attacks and passive damage do not count',()=>{
 const r=setup().run(`(()=>{const g=createGame({mode:'pve',opponentId:3,seed:188,starter:0}),p=g.players[0],q=g.players[1];g.turn=3;g.active=0;p.field.fill(null);q.field.fill(null);
  const id=[...ARCANE_STAGE_IDS.values()].find(id=>CARDS[id].role==='predator'&&CARDS[id].level===1),a=newInstance(g,id,0),d=newInstance(g,id,1);a.card.atk=0;d.card.def=100;d.mode='def';p.field[0]=a;q.field[0]=d;
  const invalid=attack(g,4,0),one=attack(g,0,0),after=JSON.parse(JSON.stringify(g.executedAttacks));damagePlayer(g,1,5);const passive=JSON.stringify(g.executedAttacks)===JSON.stringify(after);g.winner=0;return {invalid,damage:one.damage,counts:after,passive,bonus:ArcaneDuelMerit.bonusFor(g)};})()`);
 assert.equal(r.invalid,null);assert.equal(r.damage,0);assert.deepEqual(r.counts,[1,0]);assert.ok(r.passive);assert.equal(r.bonus,0);
});
test('Bonus excludes automatic and special modes and does not multiply first-win or challenge jackpots',()=>{
 const rows=setup().run(`(()=>{const g=createGame({mode:'pve',opponentId:4,context:'tournament',seed:881});g.winner=0;
  const b=ArcaneDuelMerit.bonusFor(g),out={base:b,expected:Math.floor(OPPONENTS[4].coins*.1)};
  for(const [key,value] of [['context','auto'],['lessonId','pair'],['showcase',true],['evolutionMode','defense'],['essenceTrial','intro-0'],['surrendered',true]]){const other={...g,[key]:value};out[key]=ArcaneDuelMerit.bonusFor(other);}
  const reward=rewardMatch(g);out.actual=reward.noAttackBonus;out.first=reward.first;return out;})()`);
 assert.equal(rows.base,rows.expected);assert.equal(rows.actual,rows.expected);assert.ok(rows.first);
 for(const k of ['context','lessonId','showcase','evolutionMode','essenceTrial','surrendered'])assert.equal(rows[k],0,k);
});
test('Attack statistics survive reload; legacy snapshots stay ineligible; malformed counters are rejected',()=>{
 const b=setup();
 const saved=b.run(`(()=>{const g=createGame({id:'reload-attacks',mode:'pve',opponentId:3,seed:781});g.executedAttacks=[2,4];profile.activeDuel=JSON.parse(JSON.stringify(g));return {[SAVE_KEY]:JSON.stringify(profile)};})()`);
 assert.deepEqual(boot({saved}).run('profile.activeDuel.executedAttacks'),[2,4]);
 const r=b.run(`(()=>{const raw=profile.activeDuel,restored=validateDuelSnapshot(raw);delete raw.executedAttacks;const legacy=validateDuelSnapshot(raw);legacy.winner=0;let bad=false;try{validateDuelSnapshot({...raw,executedAttacks:[0,-1]});}catch(e){bad=true;}return {count:restored.executedAttacks,legacy:ArcaneDuelMerit.bonusFor(legacy),bad};})()`);
 assert.deepEqual(r,{count:[2,4],legacy:0,bad:true});
});
