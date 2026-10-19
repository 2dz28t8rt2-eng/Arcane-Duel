/* Arcane Duel 7.8 – earned resource spending A/B on genuine tier-VIII
 * player deckbuilding pilots, compared against frozen boss v5.7 and v7.3.
 * No invented decks / cards / levels. Neither boss policy is activated.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const earned=JSON.parse(fs.readFileSync('artifacts/ai-earned-stage-vii-v74.json','utf8'));
const snapshots=earned.legitimateVIIIProfiles||[];
if(!snapshots.length)throw Error('No actually unlocked VIII career; do NOT counterfeit VIII saves');
const policyNames=['balanced','offensive','guardian','economy'];
const vm=boot({seed:750251});
const old=JSON.parse(fs.readFileSync('docs/ai-evolved-weights-v57.json','utf8')).profiles
 .find(x=>x.tier===8)?.weights;
if(!old)throw Error('Missing original VIII trained weights');
const weights={
 'trained-v57':old,
 'frozen-fusion-precision':{
  ...old,
  quality:Math.min(15,Math.round(old.quality*4*100)/100),
  cost:Math.min(15,Math.round(old.cost*.65*100)/100),
  tempo:Math.min(15,Math.round(old.tempo*.7*100)/100),
  ace:old.ace
 }
};
const budget=Number(process.env.ARCANE_V75_HOLD_SEEDS||10);
if(!Number.isInteger(budget)||budget<6||budget>20)throw Error('Bad earned holdout seed count');

const arms=['existing','craft','research','hybrid'];
// The ONLY source profiles are actual VII tournament wins settled by rewardMatch.
// All purchases below are made with saved, earned shard balances.
const prepared=[];
for(let origin=0;origin<snapshots.length;origin++)for(const arm of arms){
 const seedState=snapshots[origin];
 const expression='(()=>{profile='+JSON.stringify(seedState.profile)+';'+
 'const arm='+JSON.stringify(arm)+';'+
 "if(!profile.cleared.includes(7)||profile.cleared.includes(8))throw Error('Not a genuine VIII profile');"+
 "let crafted=0,research=0,reroll=0;const before=sharedShards();"+
 "const previousCoins=profile.coins;"+
 "const valid=()=>{if(mainDeckError(profile.activeDeck)||fusionDeckError(profile.fusionDeck)||"+
 "inventoryError(profile.activeDeck,profile.inventory)||inventoryError(profile.fusionDeck,profile.inventory))"+
 "throw Error('Unowned deck in VIII');validateProfile(JSON.parse(JSON.stringify(profile)));};"+
 "valid();"+
 "const score=c=>c.level*10000+c.atk+c.def+((profile.inventory[c.id]||0)===0?250:0);"+
 "if(arm==='craft'||arm==='hybrid')for(let n=0;n<2;n++){"+
 "const options=CARDS.filter(c=>c&&c.rpg&&!c.fusionOnly&&!c.ace&&"+
 "!c.essenceMonster&&!c.enemyOnly&&!c.questOnly&&!c.lv1Exclusive&&!c.fateOnly&&"+
 "!c.milestoneOnly&&!c.workshopOnly&&!c.trainingReward&&cardAvailable(c.id)&&"+
 "sharedShards()>=cardCraftShardCost(c.id)).sort((a,b)=>score(b)-score(a));"+
 "if(!options.length)break;if(!craftCard(options[0].id))throw Error('Real crafting failed');crafted++;}"+
 "if(arm==='research'||arm==='hybrid'){"+
 "const options=SHARD_RESEARCH_ROLES.map(role=>({role,pool:shardResearchPool(role)}))"+
 ".filter(x=>x.pool.length>=3).sort((a,b)=>"+
 "Math.max(...b.pool.map(score))-Math.max(...a.pool.map(score)));"+
 "if(options.length&&sharedShards()>=12){"+
 "if(!beginShardResearch(options[0].role))throw Error('Research could not be paid');"+
 "const offered=profile.shardResearch.offers;"+
 "const pick=offered.map((id,index)=>({id,index}))"+
 ".sort((a,b)=>score(CARDS[b.id])-score(CARDS[a.id]))[0];"+
 "if(takeShardResearchCard(pick.index)!==pick.id)throw Error('Research award invalid');research++;}"+
 "if(profile.lastBooster&&sharedShards()>=5){"+
 "const index=profile.lastBooster.cards.findIndex(id=>DEFAULT_DECK.includes(id)&&"+
 "(profile.inventory[id]||0)>Math.max(1,reservedCopies(id))&&!profile.favorites.includes(id));"+
 "if(index>=0&&rerollBoosterStarter(index)!==false)reroll++;}}"+
 "if(arm!=='existing')equipBest();valid();"+
 "const main=profile.activeDeck;"+
 "return {profile:JSON.parse(JSON.stringify(profile)),arm,crafted,research,reroll,"+
 "shardsSpent:before-sharedShards(),coinsSpent:previousCoins-profile.coins,"+
 "maxLevel:Math.max(...main.map(id=>CARDS[id].level)),"+
 "level7plus:main.filter(id=>CARDS[id].level>=7).length,"+
 "lateOwned:CARDS.slice(716,732).filter(c=>(profile.inventory[c.id]||0)>0).length,"+
 "lateEquipped:main.filter(id=>id>=716&&id<=731).length};})()";
 const data=vm.run(expression,120000);
 if(data.shardsSpent<0||data.coinsSpent!==0)throw Error('Invented currency in shard arm');
 prepared.push({origin,sourceCareer:seedState.sourceCareer,...data});
}

let duels=0;
function run(record,policy,config,seed,starter){
 const expr='(()=>{profile='+JSON.stringify(record.profile)+
 ';if(!profile.cleared.includes(7)||profile.cleared.includes(8))'+
 "throw Error('Must arrive through genuinely won VII');"+
 "if(mainDeckError(profile.activeDeck)||fusionDeckError(profile.fusionDeck)||"+
 "inventoryError(profile.activeDeck,profile.inventory)||"+
 "inventoryError(profile.fusionDeck,profile.inventory))"+
 "throw Error('VIII player is using unowned cards');"+
 "validateProfile(JSON.parse(JSON.stringify(profile)));"+
 'ArcaneAiLearning56.setSandbox('+JSON.stringify(weights[config])+',true);'+
 'ArcaneAiLookahead58.setSandbox(null);ArcaneAiBranches59.setSandbox(null);'+
 "const g=createGame({id:'v75-earned-'+String("+seed+")+'-'+String("+starter+"),"+
 "mode:'pve',context:'tournament',opponentId:8,difficulty:'easy',"+
 'seed:'+seed+',starter:'+starter+','+
 "deck:[...profile.activeDeck],fusionDeck:[...profile.fusionDeck],"+
 "enhancements:profile.enhancements});"+
 "const ace=ACE_CARD_IDS[8];"+
 "if(!g.players[1].originalDeck.includes(ace)&&"+
 "!g.players[1].remainingFusion.includes(ace))"+
 "throw Error('VIII authentic boss signature ACE missing');"+
 "let aceSeen=false;const original=applyAiAction;"+
 "applyAiAction=function(b,a){const ok=original(b,a);"+
 "if(ok&&b===g)aceSeen=aceSeen||g.players[1].field.some(c=>c?.id===ace);return ok;};"+
 "let error=null,earnedIX=null;"+
 "try{simulateGame(g,"+JSON.stringify(policy)+",'balanced');"+
 "if(g.winner===0){if(!rewardMatch(g)||!profile.cleared.includes(8))"+
 "throw Error('Won VIII without real rewarded progression');"+
 "validateProfile(JSON.parse(JSON.stringify(profile)));"+
 "earnedIX=JSON.parse(JSON.stringify(profile));}}catch(e){error=String(e);}"+
 "applyAiAction=original;ArcaneAiLearning56.setSandbox(null);"+
 "return {error,winner:g.winner,aceSeen,npcMargin:g.players[1].lp-g.players[0].lp,"+
 "earnedIX,turns:g.turn};})()";
 const r=vm.run(expr,120000);duels++;
 if(r.error||![0,1].includes(r.winner))
  throw Error('Earned VIII duel failed '+r.error);
 return r;
}
const pilotNames=policyNames;
const trainSeeds=Number(process.env.ARCANE_V78_TRAIN_SEEDS||2);
const holdSeeds=Number(process.env.ARCANE_V78_HOLD_SEEDS||4);
if(!Number.isInteger(trainSeeds)||trainSeeds<1||trainSeeds>4||
 !Number.isInteger(holdSeeds)||holdSeeds<3||holdSeeds>10)
 throw Error('Invalid comparison seeds');
function evaluate(phase,budget){
 const records=[];
 for(const record of prepared)for(const pilot of pilotNames)
 for(let i=0;i<budget;i++)for(const starter of [0,1]){
  // Matching seed across EVERY shard arm for the same earned origin and pilot.
  const seed=(phase==='train'?7855101:9877101)+record.origin*82917+
   pilotNames.indexOf(pilot)*7877+i*11317;
  for(const config of Object.keys(weights))
   records.push({arm:record.arm,origin:record.origin,pilot,starter,config,
    ...run(record,pilot,config,seed,starter)});
 }
 return Object.keys(weights).flatMap(config=>arms.map(arm=>{
  const samples=records.filter(r=>r.config===config&&r.arm===arm);
  return {config,arm,games:samples.length,
   npcWins:samples.filter(r=>r.winner===1).length,
   playerWins:samples.filter(r=>r.winner===0).length,
   genuineIXWins:samples.filter(r=>r.earnedIX).length,
   bossACE:samples.filter(r=>r.aceSeen).length,
   avgNPCMargin:Math.round(samples.reduce((a,x)=>a+x.npcMargin,0)/samples.length)};
 }));
}
const train=evaluate('train',trainSeeds);
const baseline=train.find(x=>x.config==='trained-v57'&&x.arm==='existing');
const ranked=train.filter(x=>x.config==='trained-v57'&&x.arm!=='existing')
 .map(x=>({arm:x.arm,wins:x.playerWins,
  winGain:x.playerWins-baseline.playerWins,
  marginGain:baseline.avgNPCMargin-x.avgNPCMargin}))
 .sort((a,b)=>b.winGain-a.winGain||b.marginGain-a.marginGain);
const selected=ranked[0].winGain>0||ranked[0].marginGain>0?
 ranked[0].arm:'existing';
// Holdout is evaluated with pre-frozen economic modes, the training choice
// is not adjusted after inspecting these results.
const hold=evaluate('hold',holdSeeds);
const old=hold.find(x=>x.config==='trained-v57'&&x.arm==='existing');
const challenger=hold.find(x=>x.config==='trained-v57'&&x.arm===selected);
const experimental=hold.find(x=>x.config==='frozen-fusion-precision'&&x.arm===selected);
const independentOrigins=new Set(prepared.map(x=>x.sourceCareer)).size;
const report={schema:'earned-shard-player-economy-and-viii-AI-v78',
 branches:['v7.7 paid inventory','trained-v57 NPC','frozen fusion-precision NPC'],
 genuineVIIIProfiles:snapshots.length,independentOrigins,
 profilesCompared:prepared.length,duels,trainSeeds,holdSeeds,
 trainingRanked:ranked,selectedBeforeHoldout:selected,
 train,hold,prepared:prepared.map(({profile,...rest})=>rest),
 holdout:{baseline:old,selected:challenger,fusionBoss:experimental,
  playerWinGain:challenger.playerWins-old.playerWins,
  npcMarginImprovement:old.avgNPCMargin-challenger.avgNPCMargin},
 limitations:[
 'The saved stage-VIII profiles may share one original career; do NOT interpret repeats as independent human careers.',
 'No artificial shard / Essence / card grants; all acquired cards use real paid crafting or research.',
 'No changes to actual VIII/X boss weights or main branch; stronger VIII is only sandboxed.',
 'Train and holdout battle seeds are separate, but all policies share the same earned starting profiles.'
 ]};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-earned-shard-training-v78.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_EARNED_SHARD_TRAINING_V78 '+JSON.stringify({
 duels,earnedProfiles:snapshots.length,independentOrigins,selected,
 spent:report.prepared.map(x=>({origin:x.origin,arm:x.arm,shards:x.shardsSpent,
  crafted:x.crafted,research:x.research,reroll:x.reroll,
  level:x.maxLevel,lateOwned:x.lateOwned,lateEquipped:x.lateEquipped})),
 trainingBaseline:baseline,holdout:report.holdout}));
