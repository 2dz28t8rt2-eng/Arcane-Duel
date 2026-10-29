'use strict';
/* Arcane Duel v13.3: train a robust policy over source-legal, constructed
 * multi-archetype decks against IX and X, then validate against VII/IX/X.
 * Historical v13.1 model and v13.2 frozen policy loaded from GitHub artifacts.
 * No earned-inventory claims, no production changes, no holdout-based selection.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {summonPolicySource}=require('./helpers/ai-pre-attack-v92.cjs');
const {ruleFeatureSource}=require('./helpers/ai-rule-features-v130.cjs');
const {STYLES,roster,makeBenchmarkDeck}=require('./helpers/lategame-ai-decks-v72.cjs');
const old=JSON.parse(fs.readFileSync('artifacts/v132/ai-ix-x-trained-policy-v132.json','utf8'));
const prior=JSON.parse(fs.readFileSync('artifacts/v131/ai-rule-model-v131.json','utf8'));
assert.equal(old.schema,'arcane-ix-x-policy-v132');
assert.equal(old.trained,true);
assert.equal(old.productionActive,false);
assert.equal(prior.schema,'arcane-tactical-reward-model-v131');
assert.equal(prior.trained,true);
assert.equal(prior.weights.length,16);
const baseline=old.coefficients;
const v133=JSON.parse(fs.readFileSync('artifacts/v133/ai-v133-frozen-policy.json','utf8'));
assert.equal(v133.schema,'arcane-v133-strategy-policy');
assert.equal(v133.productionIntegrated,false);
assert.equal(v133.holdoutUsedForFitting,false);
const champion=v133.weights;
assert.equal(Object.keys(champion).length,14);
assert.equal(Object.keys(baseline).length,14);
const extracted=boot({seed:133000,x128Mode:'full'}).run(String.raw`(()=>({
 cards:CARDS.map(c=>c?({id:c.id,name:c.name,level:c.level,atk:c.atk,
  def:c.def,role:c.role,source:c.source,requiredTier:c.requiredTier,
  hard:c.hard,ace:c.ace,retired:c.retired,enemyOnly:c.enemyOnly,
  essenceMonster:c.essenceMonster,lv1Exclusive:c.lv1Exclusive,
  workshopOnly:c.workshopOnly,fateOnly:c.fateOnly,fusionOnly:c.fusionOnly,
  milestoneOnly:c.milestoneOnly,manifestOf:c.manifestOf,eventOnly:c.eventOnly,
  questOnly:c.questOnly,legendaryOnly:c.legendaryOnly,fate:c.fate}):null),
 defaultDeck:[...DEFAULT_DECK],
 startFusions:[...RPG_START_FUSIONS],
 opponents:RPG_OPPONENTS.map(o=>({level:o.level,loot:[...o.loot]}))
}))()`);
const catalogue=extracted;
const catalogueVM=boot({seed:133001});
function testDeck(deck){
 assert.equal(deck.deck.length,40);
 assert.ok(deck.fusionDeck.length>=2&&deck.fusionDeck.length<=15);
 assert.equal(catalogueVM.run('mainDeckError('+JSON.stringify(deck.deck)+')'),'');
 assert.equal(catalogueVM.run('fusionDeckError('+JSON.stringify(deck.fusionDeck)+')'),'');
 const eligible=roster(catalogue,deck.tier);
 for(const id of [...deck.deck,...deck.fusionDeck])assert.ok(eligible.allowed(catalogue.cards[id]),
  'Future-locked or non-source card in deck '+deck.id+': '+id);
}


function isSignature132(c,g){return !!c&&(!!CARDS[c.id]?.ace||c.id===OPPONENTS[g.opponentId]?.signature);}
function role132(c){return (c?.roleOverride||CARDS[c?.id]?.role||'').toLowerCase();}
function score132(g,w,stat){
 if(g.active!==0||g.winner!==null||g.pending)return null;
 const me=g.players[0],foe=g.players[1],enemy=foe.field.filter(Boolean),my=me.field.filter(Boolean);
 const hostile=enemy.map(c=>({c,stat:dataOf(c),role:role132(c)}));
 const aceOnBoard=hostile.filter(x=>isSignature132(x.c,g));
 if(aceOnBoard.length)stat.aceObservations++;
 const maxThreat=Math.max(0,...hostile.map(x=>x.c.mode==='def'?x.stat.def:x.stat.atk));
 const aceThreat=Math.max(0,...aceOnBoard.map(x=>x.stat.atk));
 const free=me.field.findIndex(c=>!c);

 // Actual fusionOptions and canCompleteHandFusion are used as legal-action guards.
 // Stats are estimates, not unseen RNG predictions.
 if(g.aiPhase==='summon'&&!g.summoned&&free>=0){
  const hand=me.hand.filter(c=>!isFateCard(c));
  if(!hand.length)return null;
  const normals=hand.map(c=>{
   const d=dataOf(c),r=role132(c);
   const power=d.atk/1000,def=d.def/1000;
   const survives=d.def>=maxThreat;
   const countersAce=aceThreat>0&&d.atk>Math.max(...aceOnBoard.map(x=>x.stat.def));
   const quality=power+w.defenseWeight*def+w.tempoWeight*(survives?1:0)
    +w.aceReach*(isSignature132(c,g)?1:0)
    +w.aceThreat*(countersAce?1:0)
    -w.decayWeight*creatureDecayRate(g,c,0)/1000
    +(r==='guardian'||r==='soul'?0.08*w.defenseWeight:0);
   return {score:quality,action:{type:'normal',uid:c.uid},source:'normal'};
  });
  let best=normals.sort((a,b)=>b.score-a.score)[0];
  const limit=5;
  let considered=0;
  for(let mask=1;mask<(1<<Math.min(limit,hand.length));mask++){
   const chosen=hand.filter((c,i)=>(mask&(1<<i))!==0);
   if(chosen.length<2||chosen.length>5)continue;
   const levels=chosen.map(c=>dataOf(c).level);
   const options=fusionOptions(g,levels,chosen)
    .filter(t=>me.remainingFusion.includes(t.id)&&canCompleteHandFusion(g,levels,t.id));
   for(const card of options){
    considered++;
    const expectedAtk=baseStat(card,'atk',me),expectedDef=baseStat(card,'def',me);
    const strongest=Math.max(...chosen.map(c=>dataOf(c).atk));
    const sacrifice=chosen.reduce((n,c)=>n+dataOf(c).atk,0)-strongest;
    const survives=expectedDef>=maxThreat;
    const counterAce=aceThreat>0&&expectedAtk>Math.max(...aceOnBoard.map(x=>x.stat.def));
    const isAce=!!card.ace||card.id===OPPONENTS[g.opponentId]?.signature;
    const quality=expectedAtk/1000+w.defenseWeight*expectedDef/1000
     +w.tempoWeight*(survives?1:0)
     +w.aceReach*(isAce?1:0)
     +w.aceThreat*(counterAce?1:0)
     +w.fusionBias
     +Math.min(4,qualityRolls(levels))*w.qualityWeight
     -w.materialTax*sacrifice/1000
     -w.cardTax*(chosen.length-1)
     -w.decayWeight*(ASCENSION_DECAY_BY_LEVEL[Math.max(1,Math.min(10,card.level))]||0)/1000;
    if(quality>best.score){
     best={score:quality,action:{type:'fusion',uids:chosen.map(c=>c.uid),choice:card.id},source:'fusion'};
    }
   }
  }
  stat.fusionOffers+=considered;
  if(best.source==='fusion')stat.fusions++;
  else stat.normals++;
  g.aiPhase='positions';return best.action;
 }

 if(g.aiPhase==='positions'){
  // Avoid arbitrary stance switching: only take a stance with clear tactical value.
  // Choosing a defense protects a valuable unit when visible enemy ATK threatens it.
  for(let i=0;i<me.field.length;i++){
   const c=me.field[i];if(!c||c.switched||c.attacked||c.mode!=='atk')continue;
   const d=dataOf(c),threat=Math.max(0,...enemy.filter(t=>t.mode==='atk').map(t=>dataOf(t).atk));
   const myCanKill=enemy.some(t=>effectiveAttack(g,c,t)>(t.mode==='def'?dataOf(t).def:dataOf(t).atk));
   const danger=threat>d.atk&&d.def>threat&&(role132(c)==='guardian'||role132(c)==='soul');
   if(danger&&!myCanKill&&w.guardWeight>0.5){
    stat.guards++;
    return {type:'switch',idx:i};
   }
  }
  return null;
 }

 if(g.aiPhase!=='attacks'||g.turn===1)return null;
 const attacks=tacticalRuleFeatures(g).legalAttacks;
 if(!attacks.length)return null;
 const ready=me.field.filter(c=>c&&canAttack(g,c)).length;
 let best=null,top=-Infinity;
 for(const a of attacks){
  const mine=me.field[a.from],target=a.to===null?null:foe.field[a.to];
  if(!mine||(a.to!==null&&!target))continue;
  const own=dataOf(mine),value=effectiveAttack(g,mine,target);
  const wall=target?(target.mode==='def'?dataOf(target).def:dataOf(target).atk):0;
  const kill=target&&value>wall,trade=target&&target.mode==='atk'&&value===wall;
  const lose=target&&target.mode==='atk'&&value<=wall;
  const direct=a.to===null;
  const ace=target&&isSignature132(target,g);
  const win=direct&&value>=foe.lp+foe.shield;
  const cardWorth=target?(dataOf(target).atk*.6+dataOf(target).def*.3)/1000:0;
  const badBlock=target&&target.mode==='def'&&value<=wall;
  let utility=(direct?value/1100:0)
   +(kill?1.2+cardWorth:0)
   +(trade?0.2:0)
   -(lose?w.attackRisk*(own.atk/1000+0.8):0)
   -(badBlock?w.attackRisk*(wall-value)/1100+0.7:0)
   +(ace&&kill?w.aceThreat*2.5:0)
   +(win?100:0)
   +(ready>=2&&kill?w.futureWeight*.5:0)
   -(target&&!kill&&!trade?.25:0);
  // Carry forward the genuinely fitted previous-run attack-value model.
  const field=me.field.filter(Boolean),other=foe.field.filter(Boolean);
  const maxEnemy=Math.max(0,...other.map(c=>dataOf(c).atk));
  const atk=own.atk,role=role132(mine),targetRole=role132(target);
  const vec=[
   1,atk/3000,wall/3000,Math.max(-2,Math.min(2,(atk-wall)/3000)),
   target?1:0,target?.mode==='def'?1:0,field.length/5,other.length/5,
   Math.min(2,me.lp/10000),Math.min(2,foe.lp/10000),maxEnemy/3000,
   Math.min(1,(own.level||1)/10),mine.fusion?1:0,
   (role.includes('soul')||role.includes('seelen'))?1:0,
   (targetRole.includes('soul')||targetRole.includes('seelen'))?1:0,
   direct&&atk>=foe.lp?1:0
  ];
  utility+=w.priorWeight*vec.reduce((n,v,i)=>n+v*(V132_PRIOR[i]||0),0);
  if(utility>top){top=utility;best={type:'attack',ai:a.from,di:a.to};}
 }
 stat.attacksConsidered+=attacks.length;
 if(best&&top>=w.attackFloor){stat.attacksChosen++;if(best.di!==null&&isSignature132(foe.field[best.di],g))stat.aceTargets++;return best;}
 // Exit instead of forcing costly attack. Real game applies end-of-turn and decay.
 stat.skips++;g.aiPhase='guard';return {type:'end'};
}
function init132(){return {normals:0,fusions:0,fusionOffers:0,attacksConsidered:0,attacksChosen:0,aceTargets:0,aceObservations:0,guards:0,skips:0,invalid:0,steps:0};}




/* v13.4: outcome-guided failure training. Previous v13.3 engine-rule
 * policy is kept unchanged for matched comparisons. All diagnostics read
 * visible cards, own hand and real engine action results; NEVER opponent hand.
 * Constructed decks are only source-legal tactical stress tests, NOT earned.
 */
// Two-move outlook for summons: immediate board clearance and next own turn,
// discounted for natural decay and the actual cards sacrificed by fusion.
function score134(g,w,stats){
 if(g.active!==0||g.pending||g.winner!==null)return null;
 const me=g.players[0],enemy=g.players[1],enemyField=enemy.field.filter(Boolean);
 const hostile=enemyField.map(c=>({c,d:dataOf(c)}));
 const ace=hostile.filter(x=>isSignature132(x.c,g));
 const strongestEnemyAtk=Math.max(0,...hostile.map(x=>x.d.atk));
 const maxWall=Math.max(0,...hostile.map(x=>x.c.mode==='def'?x.d.def:x.d.atk));
 const weakEnemyWall=Math.min(Infinity,...hostile.map(x=>x.c.mode==='def'?x.d.def:x.d.atk));
 if(ace.length)stats.aceVisible++;
 if(g.aiPhase==='summon'&&!g.summoned){
  const free=me.field.indexOf(null);
  const hand=me.hand.filter(c=>!isFateCard(c)).slice(0,5);
  if(free<0||!hand.length)return null;
  const baseOwnPower=Math.max(0,...me.field.filter(Boolean).map(c=>dataOf(c).atk));
  const enemyLP=enemy.lp+(enemy.shield||0);
  let best=null;
  const options=[];
  function add(card,kind,chosen,template){
   const d=template?{atk:baseStat(template,'atk',me),
    def:baseStat(template,'def',me),level:template.level}:dataOf(card);
   const minAttack=d.atk*.94;
   const decay=template?ASCENSION_DECAY_BY_LEVEL[Math.max(1,Math.min(10,d.level))]:
    creatureDecayRate(g,card,0);
   const pts=chosen.reduce((n,c)=>n+dataOf(c).atk,0);
   const strongest=Math.max(...chosen.map(c=>dataOf(c).atk));
   const pressure=hostile.length?
    hostile.reduce((n,x)=>n+Number(minAttack>(x.c.mode==='def'?x.d.def:x.d.atk)),0):
    minAttack>=enemyLP?2:1;
   const canBreak=hostile.length?
    Number(minAttack>weakEnemyWall):Number(minAttack>=enemyLP);
   const survival=hostile.length?Number(d.def>=strongestEnemyAtk):1;
   const aceReach=ace.length?
    ace.reduce((n,x)=>n+Number(minAttack>(x.c.mode==='def'?x.d.def:x.d.atk)),0):0;
   const tempoBonus=Number(me.field.filter(Boolean).length<enemyField.length);
   const futureAttack=Math.max(0,d.atk-2*decay);
   const requiresSacrifice=kind==='fusion'?chosen.length-1:0;
   const futureOptionTax=kind==='fusion'?chosen.slice(1).reduce((n,c)=>n+dataOf(c).level,0)/20:0;
   let s=w.rawAttack*d.atk/1000+w.defense*d.def/1000
    +w.breakPressure*canBreak
    +w.clearPressure*Math.min(2,pressure)
    +w.survival*survival
    +w.fightingChance*Math.max(0,(minAttack-maxWall)/2000)
    +w.aceCounter*Math.min(2,aceReach)
    +w.tempo*tempoBonus
    +w.future*futureAttack/1300
    -w.decay*decay/120
    -w.materialCost*(pts-strongest)/1200
    -w.cardCost*requiresSacrifice
    -w.fusionOpportunityCost*futureOptionTax;
   if(kind==='fusion'){
    s+=w.fusionBias;
    s+=w.quality*Math.min(4,qualityRolls(chosen.map(c=>dataOf(c).level)));
    s-=w.acePreservation*Number(chosen.some(c=>CARDS[c.id]?.ace));
   }
   options.push({s,kind,chosen,card:template||card});
   if(!best||s>best.s)best=options[options.length-1];
  }
  for(const c of hand)add(c,'normal',[c],null);
  for(let mask=1;mask<(1<<hand.length);mask++){
   const chosen=hand.filter((c,i)=>(mask&(1<<i))!==0);
   if(chosen.length<2||chosen.length>5)continue;
   const levels=chosen.map(c=>dataOf(c).level);
   const opts=fusionOptions(g,levels,chosen)
    .filter(t=>me.remainingFusion.includes(t.id)&&canCompleteHandFusion(g,levels,t.id));
   for(const t of opts)add(null,'fusion',chosen,t);
  }
  stats.offeredFusions+=options.filter(x=>x.kind==='fusion').length;
  stats.offeredNormals+=hand.length;
  if(options.some(x=>x.kind==='fusion'))stats.fusionOpportunityTurns++;
  stats.summonChoices++;
  if(!best)return null;
  const action=best.kind==='fusion'?
    {type:'fusion',uids:best.chosen.map(c=>c.uid),choice:best.card.id}:
    {type:'normal',uid:best.chosen[0].uid};
  if(best.kind==='fusion')stats.fusionChosen++;
  else stats.normalChosen++;
  // If a normal has more immediate attack than all visible walls,
  // it must be allowed to compete against speculative fusion quality.
  g.aiPhase='positions';
  return action;
 }
 if(g.aiPhase==='attacks'&&g.turn!==1){
  const attacks=tacticalRuleFeatures(g).legalAttacks;
  if(!attacks.length)return null;
  let best=null,value=-Infinity;
  for(const a of attacks){
   const mine=me.field[a.from],target=a.to===null?null:enemy.field[a.to];
   if(!mine||a.to!==null&&!target)continue;
   const m=dataOf(mine),strength=effectiveAttack(g,mine,target);
   const targetD=target?dataOf(target):null;
   const wall=targetD?(target.mode==='def'?targetD.def:targetD.atk):0;
   const kill=target&&strength>wall;
   const aceTarget=target&&isSignature132(target,g);
   const direct=target===null;
   const losing=target&&target.mode==='atk'&&strength<=targetD.atk;
   const tie=target&&target.mode==='atk'&&strength===targetD.atk;
   const stalled=target&&target.mode==='def'&&strength<=targetD.def;
   const lethal=direct&&strength>=enemy.lp+(enemy.shield||0);
   const threatensNext=targetD?targetD.atk/1800:0;
   const counterCost=(losing?m.atk/1100:0);
   const protectedUnit=Number(m.def>m.atk*1.3);
   let score=(direct?strength/1000:0)
    +(kill?(1.15+targetD.atk/950+threatensNext*w.threatWeight):0)
    +(aceTarget&&kill?w.aceTargetWeight:0)
    +(tie?.5:0)
    -(losing?w.risk*counterCost:0)
    -(stalled?w.risk*(wall-strength)/1200+.85:0)
    +(lethal?100:0)
    -w.preservingDefender*protectedUnit*Number(losing)
    +w.attackPersistence*Number(kill);
   if(score>value){value=score;best={type:'attack',ai:a.from,di:a.to};}
  }
  stats.attackOptions+=attacks.length;
  if(best&&value>=w.attackThreshold){
   stats.attackChosen++;
   if(best.di!==null&&isSignature132(enemy.field[best.di],g))stats.aceTargets++;
   return best;
  }
  // End avoids forcing attacks against an unbeatable DEF formation.
  stats.abstained++;
  g.aiPhase='guard';
  return {type:'end'};
 }
 return null;
}
function newStats(){
 return {summonChoices:0,offeredFusions:0,offeredNormals:0,
  fusionOpportunityTurns:0,fusionChosen:0,normalChosen:0,
  aceVisible:0,aceTargets:0,attackOptions:0,attackChosen:0,
  abstained:0,invalid:0,normalPlaced:0,fusionPlaced:0,attacksExecuted:0,
  firstOwnAttackTurn:null,ownTurnStarts:0,earlyDeficit:0,earlyNoAttack:0,
  earlyEnemyAceTurns:0,earlyOwnLPMin:1,earlyEnemyMaxPower:0,
  firstTurns:[],engineLossMoments:0};
}
const injector=[isSignature132,role132,score132,init132,score134,newStats]
 .map(f=>f.toString()).join('\n');
const styles=['predator','guardian','soul','fusion','allrounder','tempo','hybrid'];
const variantsTrain=['balanced','veteran'];
const variantsTest=['starter-heavy','specialist'];
const trainingRepeats=Number(process.env.ARCANE_V134_TRAIN_REPEATS||2);
const holdoutRepeats=Number(process.env.ARCANE_V134_HOLDOUT_REPEATS||3);
const numCandidates=Number(process.env.ARCANE_V134_CANDIDATES||12);
assert.ok(Number.isInteger(trainingRepeats)&&trainingRepeats>=1&&trainingRepeats<=3);
assert.ok(Number.isInteger(holdoutRepeats)&&holdoutRepeats>=1&&holdoutRepeats<=4);
assert.ok(Number.isInteger(numCandidates)&&numCandidates>=4&&numCandidates<=20);
function scenario(tier,style,variant,repeat,phase){
 const styleId=styles.indexOf(style);
 const variantId=(phase==='train'?variantsTrain:variantsTest).indexOf(variant);
 assert.ok(styleId>=0&&variantId>=0);
 const ds=phase==='train'?2400+styleId*157+repeat*71+variantId*307:
  8500+styleId*157+repeat*31+variantId*127;
 const deck=makeBenchmarkDeck(catalogue,tier,style,variant,ds);
 testDeck(deck);
 const seed=(phase==='train'?134000:434000)+tier*1211+
  styleId*169+repeat*37+variantId*91;
 return {tier,style,variant,phase,repeat,deck,seed,
  difficulty:variantId===0?'easy':'hard',starter:(styleId+repeat+variantId)%2};
}
const training=[];
for(const tier of [9,10])
 for(const style of ['predator','guardian','fusion','hybrid'])
  for(const variant of variantsTrain)
   for(let i=0;i<trainingRepeats;i++)
    training.push(scenario(tier,style,variant,i,'train'));
const holdout=[];
for(const tier of [7,9,10])
 for(const style of styles)
  for(const variant of variantsTest)
   for(let i=0;i<(tier===7?1:holdoutRepeats);i++)
    holdout.push(scenario(tier,style,variant,i,'holdout'));
const trainedFingerprints=new Set(training.map(s=>s.deck.fingerprint));
assert.ok(!holdout.some(s=>trainedFingerprints.has(s.deck.fingerprint)));
assert.equal(new Set(training.map(x=>x.seed)).size,training.length);
assert.equal(new Set(holdout.map(x=>x.seed)).size,holdout.length);
const statsTemplate={summonObservations:0,normalOffered:0,legalFusionOffers:0,fusionAvailableTurns:0,
 freeSlotObservations:0,fullBoardObservations:0,noNormalHand:0,enemyAheadAtSummon:0,
 attackerOnBoardAtSummon:0,policyNormalChoices:0,policyFusionChoices:0,
 fusionMaterialsChosen:0,fusionTargetAtkSum:0,attacks:0,damageNpc:0};
function duel(s,arm,weights){
 const vm=boot({seed:s.seed+127,x128Mode:'full'});
 vm.exec(summonPolicySource);
 vm.exec(ruleFeatureSource);
 vm.exec(injector);
 vm.exec('var V132_PRIOR='+JSON.stringify(prior.weights)+';var V132_W='+
  JSON.stringify(champion)+';var V134_W='+JSON.stringify(weights)+';');
 const config={id:'v134-'+s.seed,mode:'pve',context:'tournament',
  opponentId:s.tier,seed:s.seed,starter:s.starter,difficulty:s.difficulty,
  deck:s.deck.deck,fusionDeck:s.deck.fusionDeck};
 const snippet=[
 '(()=>{const g=createGame(',JSON.stringify(config),');',
 'const st=newStats(),ctrl=',JSON.stringify(statsTemplate),';',
 'const old=chooseAiAction,apply=applyAiAction;',
 'let previousTurn=-1;',
 'chooseAiAction=function(game,style){',
 'if(game!==g||game.active!==0)return old(game,style);',
 'if(g.turn!==previousTurn){previousTurn=g.turn;st.ownTurnStarts++;',
 'const me=g.players[0],foe=g.players[1];',
 'const power=id=>g.players[id].field.filter(Boolean).reduce((n,c)=>n+dataOf(c).atk,0);',
 'if(st.ownTurnStarts<=4){',
 'const mine=me.field.filter(Boolean).length,enemies=foe.field.filter(Boolean).length;',
 'const f=tacticalRuleFeatures(g);const able=f?.legalAttacks?.length||0;',
 'const ace=foe.field.some(c=>isSignature132(c,g));',
 'if(power(1)>power(0))st.earlyDeficit++;',
 'if(!able)st.earlyNoAttack++;if(ace)st.earlyEnemyAceTurns++;',
 'st.earlyOwnLPMin=Math.min(st.earlyOwnLPMin,me.lp/g.maxLP);',
 'st.earlyEnemyMaxPower=Math.max(st.earlyEnemyMaxPower,power(1));',
 'st.firstTurns.push({turn:g.turn,ownLP:me.lp,enemyLP:foe.lp,ownField:mine,enemyField:enemies,',
 'ownBoardATK:power(0),enemyBoardATK:power(1),legalAttacks:able,',
 'availableFusionOffers:f?.legalFusionChoices?.length||0,enemyAce:ace});',
 '}}',
 arm==='new'?'const cand=score134(game,V134_W,st);if(cand)return cand;':
 arm==='previous'?'const cand=score132(game,V132_W,st);if(cand)return cand;':'',
 'return summonPolicy(game,"tempo-board",ctrl)||old(game,style);};',
 'applyAiAction=function(game,a){',
 'if(game===g&&game.active===0&&a?.type==="attack"&&st.firstOwnAttackTurn===null)',
 'st.firstOwnAttackTurn=g.turn;',
 'const ok=apply(game,a);',
 'if(game===g&&game.active===0){',
 'if(!ok)st.invalid++;',
 'else {if(a?.type==="attack")st.attacksExecuted++;',
 'if(a?.type==="normal")st.normalPlaced++;',
 'if(a?.type==="fusion")st.fusionPlaced++;}',
 '}return ok;};',
 'try{simulateGame(g,"balanced","balanced");}finally{',
 'chooseAiAction=old;applyAiAction=apply;}',
 'const me=g.players[0],foe=g.players[1];',
 'const board=id=>g.players[id].field.filter(Boolean).reduce((n,c)=>n+dataOf(c).atk+.4*dataOf(c).def,0);',
 'return {win:g.winner===0,turn:g.turn,ownLP:me.lp,enemyLP:foe.lp,',
 'ownRatio:me.lp/g.maxLP,enemyRatio:foe.lp/g.maxLP,',
 'boardDiff:(board(0)-board(1))/3000,st};',
 '})()'
 ].join('');
 const result=vm.run(snippet,240000);
 assert.ok(typeof result.win==='boolean');
 assert.equal(result.st.invalid,0,'Rejected or illegal action in '+arm);
 return result;
}
function objective(r){
 return 6*Number(r.win)+1.8*(1-r.enemyRatio)+.85*r.ownRatio+
  .3*Math.max(-3,Math.min(3,r.boardDiff))+
  .35*Number(r.st.firstOwnAttackTurn!==null);
}
const start={
 rawAttack:1.18,defense:.3,breakPressure:.45,clearPressure:.4,survival:.22,
 fightingChance:.24,aceCounter:.8,tempo:.22,future:.17,decay:.24,
 materialCost:.64,cardCost:.36,fusionOpportunityCost:.12,
 fusionBias:-.12,quality:.06,acePreservation:.2,
 threatWeight:.55,aceTargetWeight:1.6,risk:1.15,preservingDefender:.25,
 attackPersistence:.2,attackThreshold:-.25
};
const bounds={
 rawAttack:[.4,1.6],defense:[0,.9],breakPressure:[0,2.5],clearPressure:[0,1.4],
 survival:[0,1.7],fightingChance:[0,1.5],aceCounter:[0,2.5],
 tempo:[0,1.3],future:[0,1.2],decay:[0,1.8],
 materialCost:[0,1.5],cardCost:[.05,1.3],fusionOpportunityCost:[0,1.2],
 fusionBias:[-1.1,1],quality:[0,.55],acePreservation:[0,.8],
 threatWeight:[0,2],aceTargetWeight:[0,3],risk:[.4,3],
 preservingDefender:[0,1],attackPersistence:[0,1],attackThreshold:[-.9,.2]
};
let randomSeed=13413;
function random(){randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/4294967296;}
function mutate(base,i){
 const w={...base};
 for(const [k,[lo,hi]] of Object.entries(bounds)){
  if(random()<.38){
   const amt=(random()*2-1)*(hi-lo)*.38;
   w[k]=Math.max(lo,Math.min(hi,w[k]+amt));
  }
 }
 if(i%3===0){w.breakPressure=Math.max(w.breakPressure,1.4);w.aceCounter=Math.max(w.aceCounter,1.4);}
 else if(i%3===1){w.survival=Math.max(w.survival,1);w.materialCost=Math.max(w.materialCost,.8);}
 else{w.rawAttack=Math.max(w.rawAttack,1.3);w.fusionBias=Math.max(w.fusionBias,.1);}
 return w;
}
const candidates=[{name:'new-base',w:start}];
for(let i=1;i<numCandidates;i++)candidates.push({
 name:'v134-'+String(i).padStart(2,'0'),w:mutate(start,i)});
const evaluated=[];
for(const c of candidates){
 const outcomes={9:[],10:[]};
 for(const s of training)outcomes[s.tier].push(duel(s,'new',c.w));
 const ix=outcomes[9],x=outcomes[10];
 const ixWins=ix.filter(r=>r.win).length,xWins=x.filter(r=>r.win).length;
 const valIX=ix.reduce((n,r)=>n+objective(r),0)/ix.length;
 const valX=x.reduce((n,r)=>n+objective(r),0)/x.length;
 const score=.25*valIX+.75*valX;
 const earlyDeficits=ix.concat(x).reduce((n,r)=>n+r.st.earlyDeficit,0);
 evaluated.push({name:c.name,w:c.w,score,ixWins,xWins,
  meanIX:valIX,meanX:valX,earlyDeficits});
 console.log('ARCANE_V134_TRAIN '+JSON.stringify({
  name:c.name,ixWins,xWins,games:ix.length+x.length,
  score:+score.toFixed(5),earlyDeficits}));
}
evaluated.sort((a,b)=>b.score-a.score||b.xWins-a.xWins||a.name.localeCompare(b.name));
const chosen=evaluated[0];
console.log('ARCANE_V134_FROZEN '+JSON.stringify({
 selected:chosen.name,score:+chosen.score.toFixed(5),weights:chosen.w,
 trainingOnly:true}));
const tests=[];
for(const s of holdout){
 const results={};
 for(const arm of ['tempo','previous','new']){
  results[arm]=duel(s,arm,chosen.w);
 }
 tests.push({tier:s.tier,style:s.style,variant:s.variant,difficulty:s.difficulty,
  starter:s.starter,seed:s.seed,fingerprint:s.deck.fingerprint,result:results});
}
const arms=['tempo','previous','new'];
function summarize(tests){
 const r={duels:tests.length,wins:Object.fromEntries(arms.map(a=>[a,0])),
  avgTurns:Object.fromEntries(arms.map(a=>[a,0])),
  earlyBoardDeficit:Object.fromEntries(arms.map(a=>[a,0])),
  noAttackFirstFour:Object.fromEntries(arms.map(a=>[a,0])),
  noAttackEntireMatch:Object.fromEntries(arms.map(a=>[a,0])),
  totalFusions:Object.fromEntries(arms.map(a=>[a,0])),
  enemyAceObserved:Object.fromEntries(arms.map(a=>[a,0])),
  chosenAceTargets:Object.fromEntries(arms.map(a=>[a,0])),
  invalidActions:0};
 for(const row of tests){
  for(const a of arms){
   const t=row.result[a];
   r.wins[a]+=Number(t.win);
   r.avgTurns[a]+=t.turn;
   r.earlyBoardDeficit[a]+=t.st.earlyDeficit;
   r.noAttackFirstFour[a]+=t.st.earlyNoAttack;
   r.noAttackEntireMatch[a]+=Number(t.st.firstOwnAttackTurn===null);
   r.totalFusions[a]+=t.st.fusionPlaced;
   r.enemyAceObserved[a]+=t.st.earlyEnemyAceTurns;
   r.chosenAceTargets[a]+=t.st.aceTargets||0;
   r.invalidActions+=t.st.invalid;
  }
 }
 for(const a of arms)r.avgTurns[a]=+(r.avgTurns[a]/Math.max(1,tests.length)).toFixed(2);
 return r;
}
const byTier=Object.fromEntries([7,9,10].map(t=>[
 t,summarize(tests.filter(x=>x.tier===t))]));
const byStyle=Object.fromEntries(styles.map(t=>[t,summarize(tests.filter(x=>x.style===t))]));
const byDifficulty=Object.fromEntries(['easy','hard'].map(t=>[
 t,summarize(tests.filter(x=>x.difficulty===t))]));
const all=summarize(tests);
for(const [t,s] of Object.entries(byTier))
 console.log('ARCANE_V134_HOLDOUT '+JSON.stringify({tier:t,...s}));
const lossDiagnostics=[];
for(const t of [9,10]){
 const rows=tests.filter(x=>x.tier===t&&!x.result.new.win);
 const symptoms={earlyBoardDisadvantage:0,noAttackAcrossEarlyTurns:0,
  aceVisibleEarly:0,largeEnemyPowerEarly:0,ownLpUnderHalfEarly:0,
  noSuccessfulAttackInDuel:0};
 const examples=[];
 for(const row of rows){
  const d=row.result.new.st;
  if(d.earlyDeficit>=2)symptoms.earlyBoardDisadvantage++;
  if(d.earlyNoAttack>=3)symptoms.noAttackAcrossEarlyTurns++;
  if(d.earlyEnemyAceTurns>=1)symptoms.aceVisibleEarly++;
  if(d.earlyEnemyMaxPower>=5000)symptoms.largeEnemyPowerEarly++;
  if(d.earlyOwnLPMin<.5)symptoms.ownLpUnderHalfEarly++;
  if(d.attacksExecuted===0)symptoms.noSuccessfulAttackInDuel++;
  if(examples.length<8)examples.push({style:row.style,variant:row.variant,
   difficulty:row.difficulty,seed:row.seed,
   firstFour:row.result.new.st.firstTurns,
   finalTurn:row.result.new.turn,firstAttackTurn:d.firstOwnAttackTurn,
   fusionChosen:d.fusionChosen,legalFusionOffers:d.offeredFusions,
   scoreOwnLP:row.result.new.ownRatio,scoreEnemyLP:row.result.new.enemyRatio});
 }
 lossDiagnostics.push({tier:t,losses:rows.length,symptoms,examples});
}
const promotionCandidate=holdoutRepeats>=2&&all.invalidActions===0&&
 byTier[9].wins.new>=byTier[9].wins.previous&&
 byTier[10].wins.new>=byTier[10].wins.previous&&
 byTier[10].wins.new>=byTier[10].wins.tempo+3&&
 Object.values(byDifficulty).every(d=>d.wins.new>=d.wins.previous);
const report={
 schema:'arcane-v134-outcome-loss-diagnostic-training',status:'completed',
 previousPolicyRun:39631169966,
 previousRewardRun:39627739090,
 trainDuelCount:training.length*numCandidates,
 freshComparisonDuels:tests.length*3,
 trainingCandidates:numCandidates,chosen:chosen.name,
 modelKind:'deterministic outcome-guided tactical parameter search',
 trainingOnlySelection:true,
 fullLossTraceStored:false,
 lossesDiagnosedViaEarlyVisibleSnapshots:true,
 trainingAndHoldoutDecksDisjoint:true,
 heldoutScenarios:tests.length,sourceLegalTheoreticalDecks:true,
 noEarnedInventorySimulation:true,
 trainingRanking:evaluated.map(x=>({name:x.name,trainScore:+x.score.toFixed(5),
  IX:x.ixWins,X:x.xWins,trainingEarlyDeficits:x.earlyDeficits})),
 frozenPolicy:chosen.w,
 holdout:{overall:all,byTier,byStyle,byDifficulty},
 lossDiagnostics,
 promotionCandidate,productionIntegrated:false,
 constraints:[
  'Loss reasons are observational correlations, not causal proof.',
  'Fusions use public candidate rules and approximate expected card values; actual fusion rolls are resolved in engine.',
  'No opponent private cards, draw RNG or hidden knowledge used by policy.',
  'Decks are construction benchmarks drawn from historical drop sources, not earned player progression.',
  'Evaluation played after policy freeze, no holdout leakage into parameter choice.',
  'A player-side training policy is NOT production NPC AI without rewriting opponent-side legality and roles.'
 ]
};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-v134-loss-analysis.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync('artifacts/ai-v134-policy.json',JSON.stringify({
 schema:'arcane-v134-experimental-tactical-policy',priorPolicyRun:39631169966,
 weights:chosen.w,selectedOnTrainingOnly:true,trained:true,
 productionIntegrated:false,requiresOpponentAdaptation:true
},null,2)+'\n');
console.log('ARCANE_V134_SUMMARY '+JSON.stringify({
 trainDuelCount:report.trainDuelCount,
 freshComparisonDuels:report.freshComparisonDuels,
 chosen:chosen.name,byTier,lossDiagnostics:lossDiagnostics.map(d=>({
  tier:d.tier,losses:d.losses,symptoms:d.symptoms})),
 promotionCandidate,productionIntegrated:false}));
