'use strict';
/* v15.74, research-only: v15.73's fully legal 3–5 fusion challenger gains
 * the actual v20.0 Stomp damage/counter/fatigue tradeoff model. Frozen
 * champion gates, TRAIN/VALIDATION/HOLDOUT split and opponents are unchanged.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'ai-v1573-multifusion-selfplay.cjs'),'utf8');
function once(before,after){
 assert.equal(source.split(before).length,2,'v15.74 upstream drift: '+before.slice(0,85));
 source=source.replace(before,after);
}
function all(before,after){
 assert.ok(source.includes(before),'v15.74 upstream drift: '+before);
 source=source.split(before).join(after);
}
all('artifacts/v1573','artifacts/v1574');
all('arcane-v1573-','arcane-v1574-');
all('ARCANE_V1573_','ARCANE_V1574_');
once('15730000+','15740000+');
once('seed:15730042','seed:15740042');
all('fusion-v1573-multimaterial','fusion-v1574-stomp-conscious');
all('ai-multifusion-v1573.cjs','ai-stomp-v1574.cjs');
all('const {enumerateLargeFusions}=require(', 'const {enumerateLargeFusions,evaluateAttack}=require(');
all('__arcaneResearchLargeFusion=enumerateLargeFusions;return runtime;};',
 '__arcaneResearchLargeFusion=enumerateLargeFusions;runtime.ctx.__arcaneResearchStompAttack=evaluateAttack;return runtime;};');
once('multiFusionCandidates:true};', 'multiFusionCandidates:true,stompAwareFusion:true};');
once('maxPerSize:3});', 'maxPerSize:3,stompEngine:window.ArcaneFusionStomp});');
for(const n of [3,4,5])once(n+':{legal:0,previewed:0,accepted:0}',
 n+':{legal:0,previewed:0,accepted:0,stompForecasts:0,predatorWindows:0}');
once('["legal","previewed","accepted"]',
 '["legal","previewed","accepted","stompForecasts","predatorWindows"]');

// Base research evaluated only primary-target ATK/DEF and own LP. The active
// engine now returns all collateral hits and symmetric attack fatigue; the
// challenger must compare the REAL side effects of each legal cloned attack.
const tacticalHook=String.raw`inject('    const score=damageLP*scene.profile.aggression+chip*.62+',[
 '    let stompDecision=null;',
 '    if(scene.rolePolicy?.stompAwareFusion){',
 '     stompDecision=__arcaneResearchStompAttack({game:g,trial,result,ai:i,di:j,cardValue,dataOf,role});',
 '     counter.stompAttackEvaluations=(counter.stompAttackEvaluations||0)+1;',
 '     counter.stompSplashKills=(counter.stompSplashKills||0)+stompDecision.splashKills;',
 '     counter.stompSplashChip=(counter.stompSplashChip||0)+stompDecision.splashChip;',
 '     counter.stompFatigueCosts=(counter.stompFatigueCosts||0)+stompDecision.fatigue;',
 '     counter.stompPredatorWindows=(counter.stompPredatorWindows||0)+stompDecision.predatorWindow;',
 '    }',
 '    let score=damageLP*scene.profile.aggression+chip*.62+'
]);
inject('      (!survived?cardValue(oldAttacker)*1.2:0)-ownLP*.7;',[
 '      (!survived?cardValue(oldAttacker)*1.2:0)-ownLP*.7;',
 '    if(stompDecision)score+=stompDecision.score;'
]);`;
once(']);`;\nconst forecastHook=String.raw`',
 ']);\n'+tacticalHook+'`;\nconst forecastHook=String.raw`');
once(" '        multiFusionForecastComparisons:m.stats.multiFusionForecastComparisons||0,');",
 " '        multiFusionForecastComparisons:m.stats.multiFusionForecastComparisons||0,\\n'+\n"+
 " '        stompAttackEvaluations:m.stats.stompAttackEvaluations||0,\\n'+\n"+
 " '        stompSplashKills:m.stats.stompSplashKills||0,\\n'+\n"+
 " '        stompSplashChip:m.stats.stompSplashChip||0,\\n'+\n"+
 " '        stompFatigueCosts:m.stats.stompFatigueCosts||0,\\n'+\n"+
 " '        stompPredatorWindows:m.stats.stompPredatorWindows||0,');");
new Function('require','process','console','__dirname',source)(require,process,console,__dirname);
