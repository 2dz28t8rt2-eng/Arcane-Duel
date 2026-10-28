'use strict';
/* v15.80: isolate starter, absolute seat, deck source and deterministic RNG.
 * Identical starter-pair seeds with either cross-role or exact mirror decks;
 * 5/5 control and 5/6 second-to-act from the real existing deck.
 * Same research policy for BOTH sides, historical TRAIN-only checkpoints,
 * paired starters/seats/seeds. No edits to the actual game rules/live AI.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const extra=Number(process.env.ARCANE_V1580_SECOND_EXTRA);
assert.ok([0,1].includes(extra),'ARCANE_V1580_SECOND_EXTRA must be 0 or 1');
const match=process.env.ARCANE_V1580_MATCH;
assert.ok(['cross','mirror'].includes(match),'ARCANE_V1580_MATCH must be cross or mirror');
assert.ok(['9','10'].includes(process.argv[2]),'stage 9 Fusion vs Predator / stage 10 Predator vs Fusion');
process.env.ARCANE_V1575_MODE='baseline';
const original=fs.readFileSync;
function once(source,needle,replacement,why){
 const p=source.split(needle);
 assert.equal(p.length,2,'Source anchor drift '+why+': '+needle.slice(0,95));
 return p.join(replacement);
}
function amendRoles(src){
 const stage9=`stage===9?[\n   ['fusion','guardian'],['fusion','guardian'],['fusion','guardian'],['fusion','guardian'],\n   ['fusion','soul'],['fusion','soul'],['fusion','soul'],['fusion','soul']\n  ]`;
 const stage10=`stage===10?[\n   ['predator','guardian'],['predator','guardian'],['predator','guardian'],['predator','guardian'],\n   ['predator','soul'],['predator','soul'],['predator','soul'],['predator','soul']\n  ]`;
 src=once(src,stage9,`stage===9?[\n   ['fusion','predator'],['fusion','predator'],['fusion','predator'],['fusion','predator'],\n   ['fusion','predator'],['fusion','predator'],['fusion','predator'],['fusion','predator']\n  ]`,'stage9 role');
 src=once(src,stage10,`stage===10?[\n   ['predator','fusion'],['predator','fusion'],['predator','fusion'],['predator','fusion'],\n   ['predator','fusion'],['predator','fusion'],['predator','fusion'],['predator','fusion']\n  ]`,'stage10 role');
 src=once(src,'  const [roleA,roleB]=matchups[pair];',
  '  let [roleA,roleB]=matchups[pair];\n'+
  '  if(process.env.ARCANE_V1580_MATCH==="mirror")roleB=roleA;',
  'role labels match real mirrored deck');
 src=once(src,"   const b=makeBenchmarkDeck(catalog,foeTier,roleB,'balanced',seedB);",
  "   const b=process.env.ARCANE_V1580_MATCH==='mirror'?a:stage===10?makeFusionRoleDeck(catalog,foeTier,\n"+
  "    fusionModes[pair]==='predator-swarm'?'fusion-mixed':fusionModes[pair],seedB):\n"+
  "    makeBenchmarkDeck(catalog,foeTier,roleB,'balanced',seedB);",
  'real legal fusion opponent');
 src=once(src,'    const matchSeed=15710000+pairedStage*200000+sameOpponentPair*10000+scenario*1550+starter*107;',
  '    const matchSeed=15710000+pairedStage*200000+sameOpponentPair*10000+scenario*1550;',
  'cross starter conditions share exact random seed');
 // Unlike v15.77, **both** seats use identical planning/scoring logic/Q.
 src=once(src,'     const foeQ=stage===7?frozenQ:scenario%2===0?latest:previousQ;',
  '     const foeQ=latest;','no opponent Q disadvantage');
 src=once(src,
  '     const foeRolePolicy=stage===7?guardedL10:scenario%2===0?champion:balancedPolicy;',
  '     const foeRolePolicy=profile.rolePolicy;',
  'same policy for candidate and opponent');
 src=once(src,
  "      0,matchSeed,{name:'siege',defense:.85,synergy:1,waitCost:1.1,materialCost:.53,aggression:1},",
  "      0,matchSeed,{name:'siege',defense:.85,synergy:1,waitCost:1.1,materialCost:.53,aggression:1},",
  'preserve natural no attack-lock phase');
 src=once(src,'      decayEnabled:decayActive});',
  '      decayEnabled:decayActive,matchType:process.env.ARCANE_V1580_MATCH,secondDrawerExtraCard:Number(process.env.ARCANE_V1580_SECOND_EXTRA)});',
  'apply measured second-drawer draw only to real scene setup');
 src=once(src,'      fusionMaterialTargets:stage===9||stage===10?a.meta.materialTargets:null,',
  '      fusionMaterialTargets:stage===9||stage===10?(stage===9?a:b).meta.materialTargets:null,\n'+
  '      matchType:process.env.ARCANE_V1580_MATCH,\n'+
  '      extraCardSecond:Number(process.env.ARCANE_V1580_SECOND_EXTRA),\n'+
  '      extraCardBeneficiarySeat:1-starter,\n'+
  '      candidateDrawsSecond:seat!==starter,\n'+
  '      actualStartingHands:m.stats.researchStartingHands,\n'+
  '      openingFiveEqual:m.stats.openingFiveEqual,\n'+
  '      openingDeckEqual:m.stats.openingDeckEqual,\n'+
  '      openingFusionEqual:m.stats.openingFusionEqual,\n'+
  '      openingFourActionsBySeat:m.stats.openingFourActionsBySeat,\n'+
  '      openingFirstActionsBySeat:m.stats.openingFirstActionsBySeat,\n'+
  '      largeFusionUniqueBySeat:m.stats.largeFusionUniqueBySeat,\n'+
  '      largeFusionPresenceTurnsBySeat:m.stats.largeFusionPresenceTurnsBySeat,\n'+
  '      largeFusionPredatorThreatWindows:m.stats.largeFusionPredatorThreatWindows,',
  'research-only per-game metadata');
 // The hand changes after original source/deck integrity assertions, but
 // before the first player move. There is never an invented sixth card.
 src=once(src,
  "' let learner=scene.candidateSeat;',\n' const defender=g.players[1-learner]",
  "' let learner=scene.candidateSeat;',\n"+
  "' const secondSeat=1-g.starter;',\n"+
  "' if(g.active!==g.starter)throw Error(\"Starter/active mismatch\");',\n"+
  "' if(scene.secondDrawerExtraCard){',\n"+
  "'  const p=g.players[secondSeat];',\n"+
  "'  if(p.hand.length!==5||p.deck.length!==35)throw Error(\"Not a 40-card opening\");',\n"+
  "'  p.hand.push(newInstance(g,p.deck.shift(),secondSeat));',\n"+
  "' }',\n"+
  "' counter.researchStartingHands=g.players.map(p=>p.hand.length);',\n"+
  "' counter.openingFiveEqual=JSON.stringify(g.players[0].hand.slice(0,5).map(c=>c.id))===',\n"+
  "'  JSON.stringify(g.players[1].hand.slice(0,5).map(c=>c.id));',\n"+
  "' counter.openingDeckEqual=JSON.stringify(g.players[0].originalDeck)===',\n"+
  "'  JSON.stringify(g.players[1].originalDeck);',\n"+
  "' counter.openingFusionEqual=JSON.stringify(g.players[0].remainingFusion)===',\n"+
  "'  JSON.stringify(g.players[1].remainingFusion);',\n"+
  "' if(scene.matchType===\"mirror\"&&',\n"+
  "'  (!counter.openingFiveEqual||!counter.openingDeckEqual||!counter.openingFusionEqual))',\n"+
  "'  throw Error(\"Mirror initial hands or decks differ\");',\n"+
  "' counter.openingFourActionsBySeat=[{},{}];',\n"+
  "' counter.openingFirstActionsBySeat=[[],[]];',\n"+
  "' if(counter.researchStartingHands[g.starter]!==5||',\n"+
  "'    counter.researchStartingHands[secondSeat]!==',\n"+
  "'    (scene.secondDrawerExtraCard?6:5))throw Error(\"Wrong second-drawer hand\");',\n"+
  "' const __seenLargeFusionUids=new Set();',\n"+
  "' const __seenPredatorWindows=new Set();',\n"+
  "' counter.largeFusionUniqueBySeat=[0,0];',\n"+
  "' counter.largeFusionPresenceTurnsBySeat=[0,0];',\n"+
  "' counter.largeFusionPredatorThreatWindows=0;',\n"+
  "' const defender=g.players[1-learner]",
  'sixth card and lifecycle counters');
 // Inject only into the underlying duel simulation. These counters are
 // MAIN-GAME observations; they cannot learn from future branches or clones.
 const injection=`inject(' advanceTurn=function(game){',[
 ' advanceTurn=function(game){',
 '  if(game===g){',
 '   for(let owner=0;owner<2;owner++)for(const c of game.players[owner].field){',
 '    if(!c?.fusion||(c.materialsUsed||0)<3)continue;',
 '    counter.largeFusionPresenceTurnsBySeat[owner]++;',
 '    if(!__seenLargeFusionUids.has(c.uid)){',
 '     __seenLargeFusionUids.add(c.uid);counter.largeFusionUniqueBySeat[owner]++;',
 '    }',
 '   }',
 '  }'
]);
inject(' chooseAiAction=function(game,policy){',[
 ' chooseAiAction=function(game,policy){',
 '  if(game===g&&game.aiPhase===\"attacks\"){',
 '   const key=game.turn+\"/\"+game.active;',
 '   if(!__seenPredatorWindows.has(key)){',
 '    __seenPredatorWindows.add(key);',
 '    const f=game.players[1-game.active].field.some(c=>c?.fusion&&(c.materialsUsed||0)>=3);',
 '    const p=game.players[game.active].field.some(c=>c&&role(c)===\"predator\"&&!c.attacked);',
 '    if(f&&p)counter.largeFusionPredatorThreatWindows++;',
 '   }',
 '  }'
]);
`;
 src=once(src,"const inner='\\nnew Function(",injection+"const inner='\\nnew Function(",
  'append main-game lifecycle instrumentation');
 src=once(src,"'  const current=game.active;',",
  "'  const current=game.active;',\n"+
  "'  if(game===g&&game.turn<=4){',\n"+
  "'   const type=action?.type||\"unknown\",bySeat=counter.openingFourActionsBySeat[current];',\n"+
  "'   bySeat[type]=(bySeat[type]||0)+1;',\n"+
  "'   if(counter.openingFirstActionsBySeat[current].length<5)',\n"+
  "'    counter.openingFirstActionsBySeat[current].push(type);',\n"+
  "'  }',",
  'record early real-game actions by each absolute seat');
 return src;
}
let code=original.call(fs,path.join(__dirname,'ai-v1575-counterplay-selfplay.cjs'),'utf8');
code=once(code,'artifacts/v1575/"+mode+"','artifacts/v1580/'+match+'/second'+extra,'unique stage root');
code=once(code,'arcane-v1575-"+mode+"-','arcane-v1580-'+match+'-second'+extra+'-',
 'unique provenance label');
let intercepted=0;
fs.readFileSync=function(file,...rest){
 const content=original.call(this,file,...rest);
 if(String(file).replace(/\\/g,'/').endsWith('/ai-v1571-roles-selfplay.cjs')){
  intercepted++;return amendRoles(content);
 }
 return content;
};
try{new Function('require','process','console','__dirname',code)(require,process,console,__dirname);}
finally{fs.readFileSync=original;}
assert.equal(intercepted,1,'Expected exactly one role-simulator patch');
