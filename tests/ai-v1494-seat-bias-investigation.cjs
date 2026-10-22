'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
let src=fs.readFileSync('tests/ai-v1493-extensive-strategy-replay-training.cjs','utf8');
src=src.slice(0,src.indexOf("\nconst crypto=require('node:crypto');"));
function patch(a,b){assert.equal(src.split(a).length-1,1,'source mismatch: '+a);src=src.replace(a,b);}
patch("strategicTraining:{enabled:true,noAttackTurns:scene.warmup,disableArenaLPDecay:true}});",
"strategicTraining:{enabled:true,noAttackTurns:scene.warmup,disableArenaLPDecay:true,symmetricSides:!!scene.symmetricSides}});");
patch("if(game!==g||game.active!==learner||game.pending)return baseChoose(game,policy);",
"if(game!==g||(!scene.bothStrategic&&game.active!==learner)||game.pending)return baseChoose(game,policy);");
patch("function sceneResult(deck,warmup,seed,profile,starter,candidateSeat){",
"function sceneResult(deck,warmup,seed,profile,starter,candidateSeat,extras={}){");
patch("  seed,profile,warmup,starter,candidateSeat};",
"  seed,profile,warmup,starter,candidateSeat,...extras};");
const study=String.raw`
const auditStages=[0,6,10],styles=['guardian','predator','fusion','soul','mixed'];
const profile1494={name:'synergy',defense:1.1,synergy:2.2,
 waitCost:.55,materialCost:.68,aggression:.75};
const data=[],summary={},folder='artifacts/v1494';
fs.mkdirSync(folder,{recursive:true});
for(const stage of auditStages)for(const style of styles)for(let d=0;d<3;d++){
 const tier=d%2?10:9,deckSeed=1350+stage*8+styles.indexOf(style)*71+d*29;
 const deck=style==='mixed'?mixed(tier,deckSeed,.40):
  makeBenchmarkDeck(catalog,tier,style,'balanced',deckSeed);
 for(const symmetricSides of [false,true])
 for(const policy of ['balanced-mirror','strategic-mirror'])
 for(const starter of [0,1]){
  const seed=14940001+stage*200000+styles.indexOf(style)*4000+d*47+starter*3;
  const r=sceneResult(deck,stage,seed,profile1494,starter,-1,
   {symmetricSides,bothStrategic:policy==='strategic-mirror'});
  assert.equal(r.invalid,0,'Illegal research action');
  assert.equal(r.stats.prebattleOffensiveSouls,0,'Premature Soul');
  assert.ok(r.firstAttackTurn===null||r.firstAttackTurn>stage);
  const record={stage,style,tier,deckSeed,policy,
   controls:symmetricSides?'research-symmetric':'legacy-side-rules',
   starter,winner:r.winner,timeout:r.timeout,turn:r.turn,
   beforeCombat:r.occupancy,offensiveSoulBeforeUnlock:r.stats.prebattleOffensiveSouls,
   soulUnlockTurn:r.soulUnlockedTurn};
  data.push(record);
  const key=[stage,record.controls,policy].join('|');
  const stats=summary[key]||(summary[key]={stage,controls:record.controls,policy,
   total:0,decided:0,seat0Wins:0,seat1Wins:0,starterWins:0,
   secondWins:0,timeouts:0,byStyle:{}});
  stats.total++;stats.timeouts+=Number(r.timeout);
  if(r.winner!==null){
   stats.decided++;
   if(r.winner===0)stats.seat0Wins++;else stats.seat1Wins++;
   if(r.winner===starter)stats.starterWins++;else stats.secondWins++;
  }
  const st=stats.byStyle[style]||(stats.byStyle[style]={total:0,seat0:0,starter:0});
  st.total++;st.seat0+=Number(r.winner===0);st.starter+=Number(r.winner===starter);
 }
}
const report={schema:'arcane-v1494-seat-bias-investigation',status:'completed',
 source:process.env.GITHUB_SHA||'unknown',
 controls:{matched40CardDecksAnd5CardHands:true,bothSeatsSamePolicy:true,
  matchedFusionStock:true,arenaDecayDisabled:true,realRolesEnabled:true,
  accurateDynamicSoulGate:true},
 stages:auditStages,styles,matchCount:data.length,
 groups:Object.values(summary).sort((a,b)=>a.stage-b.stage||
 a.controls.localeCompare(b.controls)||a.policy.localeCompare(b.policy)),
 warnings:['Attack initiative remains asymmetric by design: normal turn 2 favors the second player; after an even attack-lock duration the initial starter attacks first.',
  'The research-symmetric switch neutralizes player-only metaperks but does not make all PvE APIs symmetric.',
  'Active Soul Raid remains unavailable to BOTH agents through shared AI action controller.',
  'Historical v14.9.3 numbers used different Soul timing and cannot be compared directly.',
  'Small samples; treat patterns as diagnostics, not proof of causation.']};
fs.writeFileSync(folder+'/report.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(folder+'/duels.json',JSON.stringify(data,null,2)+'\n');
console.log('ARCANE_V1494_PARITY '+JSON.stringify({games:data.length,
 groups:report.groups.map(({byStyle,...x})=>x)}));
`;
new Function('require','process','console',src+'\n'+study)(require,process,console);
