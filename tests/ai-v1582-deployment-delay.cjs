'use strict';
/* Research-only deployment delay on top of certified v15.81 same-seed duels.
 * No engine/UI changes. A voluntary emergency attack is an AI action choice:
 * if the planner attacks with a freshly summoned creature, effective attack
 * strength for that action is halved without writing to the card's ATK stat.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const mode=process.env.ARCANE_V1582_MODE;
const MODES=['baseline','delay','emergency50-locked','emergency50-open'];
assert.ok(MODES.includes(mode),'Unknown deployment-delay mode');
assert.ok(['cross','mirror'].includes(process.env.ARCANE_V1580_MATCH));
assert.ok(['9','10'].includes(process.argv[2]));
process.env.ARCANE_V1581_FACTOR='baseline';
let upstream=fs.readFileSync(path.join(__dirname,'ai-v1581-opening-mechanism.cjs'),'utf8');
function once(from,to,why){
 assert.equal(upstream.split(from).length,2,'v15.82 source drift: '+why);
 upstream=upstream.replace(from,to);
}
once("'const match=process.env.ARCANE_V1580_MATCH;\\nconst factor=process.env.ARCANE_V1581_FACTOR;'",
 "'const match=process.env.ARCANE_V1580_MATCH;\\nconst factor=process.env.ARCANE_V1581_FACTOR;\\nconst deploymentMode=process.env.ARCANE_V1582_MODE;'",
 'stage dynamic mode');
once("'artifacts/v1581/'+match+'/'+factor",
 "'artifacts/v1582/'+match+'/'+deploymentMode",'separate shards');
once("'arcane-v1581-'+match+'-'+factor+'-'",
 "'arcane-v1582-'+match+'-'+deploymentMode+'-'",'separate provenance');
once('diagnosticFactor:process.env.ARCANE_V1581_FACTOR});',
 'diagnosticFactor:process.env.ARCANE_V1581_FACTOR,deploymentMode:process.env.ARCANE_V1582_MODE});',
 'pass deployment mode to game');
once("  '      diagnosticFactor:process.env.ARCANE_V1581_FACTOR,\\n'+",
 "  '      diagnosticFactor:process.env.ARCANE_V1581_FACTOR,\\n'+\n"+
 "  '      deploymentMode:process.env.ARCANE_V1582_MODE,\\n'+\n"+
 "  '      freshAttackActions:m.stats.freshAttackActions,\\n'+\n"+
 "  '      emergencyAttackActions:m.stats.emergencyAttackActions,\\n'+\n"+
 "  '      emergencyHalfDamageChecks:m.stats.emergencyHalfDamageChecks,\\n'+",
 'export real-game attack choices');

const deploymentHooks=String.raw`
inject('  scene.diagnosticFactor==="no-creature-decay"?advanceTurn16:advanceTurn;',[
 '  scene.diagnosticFactor==="no-creature-decay"?advanceTurn16:advanceTurn;',
 ' const __baseDeploymentCanAttack=canAttack,',
 '  __baseDeploymentEffectiveAttack=effectiveAttack;',
 ' counter.freshAttackActions=0;counter.emergencyAttackActions=0;',
 ' counter.emergencyHalfDamageChecks=0;',
 ' canAttack=function(game,c){',
 '  const base=__baseDeploymentCanAttack(game,c);',
 '  if(scene.deploymentMode==="baseline"||!c||!game)return base;',
 '  if(c.summonedTurn!==game.turn)return base;',
 '  if(scene.deploymentMode==="delay")return false;',
 '  if(base)return true;',
 '  // The open variant also removes the *legacy* global turn-one attack ban',
 '  // for the 50% emergency action only. It can hit LP directly on turn one.',
 '  if(scene.deploymentMode!=="emergency50-open"||game.turn!==1)return false;',
 '  return game.winner===null&&!game.pending&&c.mode==="atk"&&',
 '   (!game.strategicTraining||game.turn>game.strategicTraining.noAttackTurns)&&',
 '   (!c.attacked||(game.essenceRules&&CARDS[c.id]?.essenceSchool==="predator"&&',
 '    c.essenceCombat?.doubleChoice===2&&c.essenceCombat?.attacksThisTurn===1));',
 ' };',
 ' effectiveAttack=function(game,c,d){',
 '  const raw=__baseDeploymentEffectiveAttack(game,c,d);',
 '  if(scene.deploymentMode!=="emergency50-locked"&&',
 '     scene.deploymentMode!=="emergency50-open")return raw;',
 '  if(!c||c.summonedTurn!==game.turn||',
 '     !game.players[game.active].field.includes(c))return raw;',
 '  // Derived combat strength only: never change c.card.atk/def.',
 '  return Math.floor(raw*.5);',
 ' };'
]);
inject('  const current=game.active;',[
 '  const current=game.active;',
 '  if(game===g&&action?.type==="attack"){',
 '   const attacker=game.players[current].field[action.ai];',
 '   if(attacker?.summonedTurn===game.turn){',
 '    counter.freshAttackActions++;',
 '    if(scene.deploymentMode==="delay")',
 '     throw Error("Fresh monster attacked despite hard deployment delay");',
 '    if(scene.deploymentMode==="emergency50-locked"||',
 '       scene.deploymentMode==="emergency50-open"){',
 '     const target=action.di===null?null:game.players[1-current].field[action.di];',
 '     const raw=__baseDeploymentEffectiveAttack(game,attacker,target);',
 '     const half=effectiveAttack(game,attacker,target);',
 '     if(half!==Math.floor(raw*.5))throw Error("Emergency half attack not applied");',
 '     counter.emergencyAttackActions++;counter.emergencyHalfDamageChecks++;',
 '    }',
 '   }',
 '  }'
]);
`;
once('const extension=String.raw`',
 'const deploymentHooks='+JSON.stringify(deploymentHooks)+';\nconst extension=String.raw`',
 'append independent experiment hooks');
once('${JSON.stringify(extraHooks)}+"const inner=',
 '${JSON.stringify(extraHooks+deploymentHooks)}+"const inner=',
 'inject after existing telemetry');
new Function('require','process','console','__dirname',upstream)(require,process,console,__dirname);
