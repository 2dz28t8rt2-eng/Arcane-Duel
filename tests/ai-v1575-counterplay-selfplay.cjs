'use strict';
/* Paired causal scoring experiment against v15.74. No production AI edits.
 * Keep identical deck/seat/starter seeds in all four predefined arms and
 * record only main-game (never cloned-forecast) attacks as actual telemetry.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {MODES}=require('./helpers/ai-counterplay-v1575.cjs');
const mode=process.env.ARCANE_V1575_MODE;
assert.ok(MODES.includes(mode),'Set ARCANE_V1575_MODE to '+MODES.join(', '));
let source=fs.readFileSync(path.join(__dirname,'ai-v1574-stomp-selfplay.cjs'),'utf8');
function once(a,b){assert.equal(source.split(a).length,2,'v15.75 anchor drift '+a.slice(0,100));source=source.replace(a,b);}

// Preserve v15.74 matchup and RNG seeds across modes: an apples-to-apples
// experiment, not a comparison against a different shuffle.
once("all('artifacts/v1573','artifacts/v1574');",
 "all('artifacts/v1573','artifacts/v1575/"+mode+"');");
once("all('arcane-v1573-','arcane-v1574-');",
 "all('arcane-v1573-','arcane-v1575-"+mode+"-');");
once("all('ARCANE_V1573_','ARCANE_V1574_');",
 "all('ARCANE_V1573_','ARCANE_V1575_');");
once("all('ai-multifusion-v1573.cjs','ai-stomp-v1574.cjs');",
 "all('ai-multifusion-v1573.cjs','ai-counterplay-v1575.cjs');");
once("once('multiFusionCandidates:true};', 'multiFusionCandidates:true,stompAwareFusion:true};');",
 "once('multiFusionCandidates:true};', 'multiFusionCandidates:true,stompAwareFusion:true,stompResearchMode:\""+mode+"\"};');");
once('cardValue,dataOf,role});',
 'cardValue,dataOf,role,attack,mode:scene.rolePolicy.stompResearchMode});');
once(" '    let score=damageLP*scene.profile.aggression+chip*.62+'",
 " '    counter.stompReplySearchTrials=(counter.stompReplySearchTrials||0)+(stompDecision?.replyTrials||0);',\n"+
 " '    counter.stompReplySearchKills=(counter.stompReplySearchKills||0)+(stompDecision?.replyKills||0);',\n"+
 " '    counter.stompPredatorFusionEvaluations=(counter.stompPredatorFusionEvaluations||0)+(stompDecision?.predatorFusionAttacks||0);',\n"+
 " '    let score=damageLP*scene.profile.aggression+chip*.62+'");

// Detailed actual action outcomes are attached to the existing per-game row,
// but **never** computed from evaluateAttack's many what-if clones.
const realFields=[
 'realCandidateStomps','realOpponentStomps','realCandidateSplashHits',
 'realCandidateSplashKills','realCandidateSplashDefLost','realCandidateSplashCounterLP',
 'realCandidateAttackFatigueAtk','realCandidateAttackFatigueDef',
 'realPredatorFusionAttacks','realPredatorFusionKills',
 'realOpponentPredatorKillsCandidateFusion',
 'stompReplySearchTrials','stompReplySearchKills',
 'stompPredatorFusionEvaluations'
];
const oldTail=" '        stompPredatorWindows:m.stats.stompPredatorWindows||0,');";
const newTail=" '        stompPredatorWindows:m.stats.stompPredatorWindows||0,\\n'+\n"+
 realFields.map((field,i)=>" '        "+field+":m.stats."+field+"||0,"+(i===realFields.length-1?"');":"\\n'+\n")).join('');

const telemetry=String.raw`inject(' counter.fusionMultiMaterialOpportunities=0;counter.fusionMultiMaterialChosen=0;',[
 ' counter.fusionMultiMaterialOpportunities=0;counter.fusionMultiMaterialChosen=0;',
 ' for(const k of __REAL_FIELDS__)counter[k]=0;'
]);
inject(' damagePlayer=function(game,id,amount){',[
 ' const beforeRealAttack=attack;',
 ' attack=function(game,ai,di){',
 '  const real=game===g,owner=game.active,actor=game.players[owner]?.field?.[ai];',
 '  const target=Number.isInteger(di)?game.players[1-owner]?.field?.[di]:null;',
 '  const atk=actor?.card?.atk||0,def=actor?.card?.def||0;',
 '  const result=beforeRealAttack(game,ai,di);',
 '  if(real&&result&&actor){',
 '   const theirs=owner!==learner,roleName=role(actor);',
 '   const hits=result.stomp?.hits||[];',
 '   if(hits.length){',
 '    const key=theirs?"realOpponentStomps":"realCandidateStomps";counter[key]++;',
 '    if(!theirs){',
 '     counter.realCandidateSplashHits+=hits.length;',
 '     counter.realCandidateSplashKills+=hits.filter(x=>x.destroyed).length;',
 '     counter.realCandidateSplashDefLost+=hits.reduce((n,x)=>n+(x.defLost||0),0);',
 '     counter.realCandidateSplashCounterLP+=hits.reduce((n,x)=>n+(x.counter||0),0);',
 '    }',
 '   }',
 '   if(!theirs){',
 '    const still=game.players[owner].field[ai];',
 '    if(still===actor){',
 '     const price=window.ArcaneFusionStomp.fatigue(atk,def,1+hits.length);',
 '     counter.realCandidateAttackFatigueAtk+=price.atk;',
 '     counter.realCandidateAttackFatigueDef+=price.def;',
 '    }',
 '    if(roleName==="predator"&&target?.fusion&&(target.materialsUsed||0)>=3){',
 '     counter.realPredatorFusionAttacks++;',
 '     const remains=game.players[1-owner].field[di];',
 '     if(!remains||remains.uid!==target.uid)counter.realPredatorFusionKills++;',
 '    }',
 '   }else if(roleName==="predator"&&target?.fusion&&(target.materialsUsed||0)>=3){',
 '    const remains=game.players[1-owner].field[di];',
 '    if(!remains||remains.uid!==target.uid)',
 '     counter.realOpponentPredatorKillsCandidateFusion++;',
 '   }',
 '  }',
 '  return result;',
 ' };',
 ' damagePlayer=function(game,id,amount){'
]);`;

// Extend the v15.73 `hook` template after the v15.74 tactical hook has been
// inserted. The nested hook executes where `inject` is actually defined.
const beforeCompile="new Function('require','process','console','__dirname',source)(require,process,console,__dirname);";
const compiledTelemetry=telemetry.replace('__REAL_FIELDS__',JSON.stringify(realFields));
once(beforeCompile,
 'once('+JSON.stringify(oldTail)+','+JSON.stringify(newTail)+');\n'+
 'const actualHook='+JSON.stringify(compiledTelemetry)+';\n'+
 'const insertBefore='+JSON.stringify('`;\nconst forecastHook=String.raw`')+';\n'+
 'once(insertBefore,actualHook+"\\n"+insertBefore);\n'+beforeCompile);

new Function('require','process','console','__dirname',source)(require,process,console,__dirname);
