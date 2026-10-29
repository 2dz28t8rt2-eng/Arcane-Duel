'use strict';
/* v15.84 research-only audit: global attack release turns 2/3/4/5 versus
 * the previously studied one-personal-turn deployment delay. Keep the
 * sealed split and timeout-safe marker checks of the v15.82 audit.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let code=fs.readFileSync(path.join(__dirname,'ai-v1582-deployment-delay-aggregate.cjs'),'utf8');
function once(a,b,reason){
 assert.equal(code.split(a).length,2,'v15.84 aggregate source drift: '+reason);
 code=code.replace(a,b);
}
once("const root='artifacts/v1582'","const root='artifacts/v1584'",'isolated report');
once("const modes=['baseline','delay','emergency50-locked','emergency50-open'];",
 "const modes=['baseline','release3','release4','release5','delay'];",'five initiative arms');
once("   }else if(mode==='delay'){",
 `   }else if(mode.startsWith('release')){
    assert.equal(c.emergencyAttackActions,0);
    assert.equal(c.emergencyHalfDamageChecks,0);
    const release=Number(mode.slice(7));
    assert.ok([3,4,5].includes(release));
    for(let t=1;t<release;t++)
     assert.equal(c.openingActionByTurn?.[t]?.types?.attack||0,0,
      'Attack occurred before allowed global turn '+release);
   }else if(mode==='delay'){`, 'strict timing checks');
once(`   }else{
    assert.equal(c.emergencyAttackActions,c.freshAttackActions,
     'Every early attack must be the optional half-strength action');
    assert.equal(c.emergencyHalfDamageChecks,c.emergencyAttackActions);
    if(mode==='emergency50-locked')assert.equal(c.openingActionByTurn?.[1]?.types?.attack||0,0);
   }`,
 `   }else throw Error('Unrecognized initiative arm: '+mode);`,
 'remove emergency action assumptions');
once("assert.equal(sum(shards,s=>s.duels),6144);",
 "assert.equal(sum(shards,s=>s.duels),7680);",'20 cohorts');
once("assert.equal(starterPairs,3072);assert.equal(labelChecks,1536);",
 "assert.equal(starterPairs,3840);assert.equal(labelChecks,1920);",'starter/marker audits');
once("assert.equal(matchedMechanismPairs,4608);",
 "assert.equal(matchedMechanismPairs,6144);",'paired treatment comparisons');
const oldChecks=`const emergencies=matches.flatMap(m=>stages.flatMap(s=>
 ['emergency50-locked','emergency50-open'].flatMap(mode=>cohorts[[m,s,mode].join('|')])));
assert.ok(sum(emergencies,c=>c.emergencyHalfDamageChecks)>0,'No real optional attacks at 50%');
const opens=cohorts['mirror|10|emergency50-open'];
assert.ok(sum(opens,c=>c.openingActionByTurn?.[1]?.types?.attack||0)>0,
 'Open variant never exercised the permitted half-strength global turn-one attack');`;
const newChecks=`for(const release of [3,4,5]){
 const rows=cohorts['mirror|10|release'+release];
 assert.ok(sum(rows,c=>c.openingActionByTurn?.[release]?.types?.attack||0)>0,
  'Expected actual Predator attacks at the first permitted global turn '+release);
}
const delayed=cohorts['mirror|10|delay'];
assert.ok(sum(delayed,c=>c.openingActionByTurn?.[3]?.types?.attack||0)>0,
 'Deployment-delay control never attacked on global turn 3');`;
once(oldChecks,newChecks,'actual timing mechanism observation');
once("schema:'arcane-v1582-deployment-delay-temporary-emergency-attack'",
 "schema:'arcane-v1584-global-attack-initiative-windows'",'report identity');
once("status:'completed',totalDuels:6144,starterPairs,labelChecks,matchedMechanismPairs,",
 "status:'completed',totalDuels:7680,starterPairs,labelChecks,matchedMechanismPairs,",'report total');
once('oneSidedSeatPerksOff:true,arenaLPDecayDisabled:true,temporaryCombatMultiplierOnly:true,',
 'oneSidedSeatPerksOff:true,arenaLPDecayDisabled:true,attackTimingOnly:true,',
 'no attack or defense values changed');
const oldDetails=` modeDetails:{baseline:'Existing live turn-one global attack lock, fresh monsters may attack from turn two.',
  delay:'No freshly summoned creature attacks until its owners next personal turn.',
  'emergency50-locked':'A fresh monster may voluntarily attack at 50% effective strength, but the old global turn-one lock remains.',
  'emergency50-open':'A fresh monster may voluntarily attack at 50% effective strength even on global turn one; old turn-one lock removed only for this action.'},`;
const newDetails=` modeDetails:{baseline:'Existing combat: global turn 1 blocked; first attack permitted on global turn 2.',
  release3:'No attacks on global turns 1-2; combat begins on global turn 3 (first player).',
  release4:'No attacks on global turns 1-3; combat begins on global turn 4 (second player).',
  release5:'No attacks on global turns 1-4; combat begins on global turn 5 (first player).',
  delay:'Creature cannot attack on its own summon turn; fully ready from its next personal turn.'},`;
once(oldDetails,newDetails,'explicit preregistered arms');
const fromCaveats=`  'The 50% emergency option is selected by the research AI as an attack action; a live UI button is not shipped.',
  '50% affects only computed combat strength, never permanently halves the card attack stat. Existing normal attack fatigue/essence costs still apply.',
  'One-turn delay means the card cannot attack on the personal turn it is placed; it becomes fully ready on the owners following personal turn.',
  'The two emergency variants distinguish the legacy first global turn attack prohibition, which confounded prior symmetry assumptions.',
  'Comparisons isolate the new deployment and emergency mechanism; no changes to user campaign or multiplayer rules.',`;
const toCaveats=`  'Attack release variants change ONLY the first globally permitted attack turn. Existing combat damage, ordinary decay, essence costs and tactical actions are unchanged.',
  'Release 2/4 gives the second player the first attack window; release 3/5 gives the first player the first attack window. The longer build phase may independently change outcome.',
  'The one-personal-turn summon delay is a control against the timing-only attack windows; no emergency 50% attacks are enabled.',
  'No changes to the user campaign, multiplayer rules, card ATK/DEF stats or live UI.',`;
once(fromCaveats,toCaveats,'interpretability caveats');
once("console.log('ARCANE_V1582_COMPLETE '","console.log('ARCANE_V1584_COMPLETE '",
 'report completion marker');
new Function('require','process','console','__dirname',code)(require,process,console,__dirname);
