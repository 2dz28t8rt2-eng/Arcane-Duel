'use strict';
/* v15.81: use the certified v15.80 same-seed mirror/cross harness, with
 * one research-only mechanic switched off per matched full duel. No live code.
 * One identical research policy on BOTH seats; baseline opening is 5/5.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const factor=process.env.ARCANE_V1581_FACTOR;
const FACTORS=['baseline','equal-opening-attacks','no-creature-decay',
 'no-attack-stat-loss','no-predator-swarm','no-predator-pierce'];
assert.ok(FACTORS.includes(factor),'Invalid v15.81 mechanism factor');
assert.ok(['cross','mirror'].includes(process.env.ARCANE_V1580_MATCH));
assert.ok(['9','10'].includes(process.argv[2]));
process.env.ARCANE_V1580_SECOND_EXTRA='0';
let source=fs.readFileSync(path.join(__dirname,'ai-v1580-seat-starter-isolation.cjs'),'utf8');
function once(a,b,why){
 assert.equal(source.split(a).length,2,'v15.81 outer source anchor drift '+why);
 source=source.replace(a,b);
}
once('const match=process.env.ARCANE_V1580_MATCH;',
 'const match=process.env.ARCANE_V1580_MATCH;\nconst factor=process.env.ARCANE_V1581_FACTOR;',
 'mode scope');
once("'artifacts/v1580/'+match+'/second'+extra",
 "'artifacts/v1581/'+match+'/'+factor",'stage output');
once("'arcane-v1580-'+match+'-second'+extra+'-'",
 "'arcane-v1581-'+match+'-'+factor+'-'",'stage provenance');

const extraHooks=String.raw`
inject(' const baseChoose=chooseAiAction,baseApply=applyAiAction,baseAdvance=advanceTurn;',[
 ' const baseChoose=chooseAiAction,baseApply=applyAiAction,baseAdvance=',
 '  scene.diagnosticFactor==="no-creature-decay"?advanceTurn16:advanceTurn;',
 ' counter.openingBeginning=null;counter.openingTimeline=[];counter.openingActionByTurn={};',
 ' counter.openingAttackStatRestorations=0;',
 ' function __openingSnapshot(game){',
 '  return game.players.map((p,id)=>{',
 '   const f=p.field.filter(Boolean),pred=f.filter(c=>role(c)==="predator").length;',
 '   const totals=f.reduce((o,c)=>{const d=dataOf(c);o.atk+=d.atk;o.def+=d.def;',
 '    o.peakAtk=Math.max(o.peakAtk,d.atk);return o;},{atk:0,def:0,peakAtk:0});',
 '   const ready=id===game.active?f.filter(c=>canAttack(game,c)).length:0;',
 '   return {lp:p.lp,shield:p.shield,board:f.length,predators:pred,',
 '    atk:totals.atk,def:totals.def,peakAtk:totals.peakAtk,ready,',
 '    hand:p.hand.length,deck:p.deck.length};',
 '  });',
 ' }',
 ' counter.openingBeginning=__openingSnapshot(g);',
 ' if(scene.diagnosticFactor==="no-predator-swarm")g.strategicTraining.predatorSwarmPercent=0;',
 ' if(scene.diagnosticFactor==="no-predator-pierce")g.strategicTraining.predatorArmorPierce=0;',
 ' if(scene.diagnosticFactor==="equal-opening-attacks"){',
 '  const __canAttack=canAttack;',
 '  canAttack=function(game,c){return game.turn>2&&__canAttack(game,c);};',
 ' }',
 ' if(scene.diagnosticFactor==="no-creature-decay"){',
 '  creatureDecayRate=function(){return 0;};',
 ' }',
 ' if(scene.diagnosticFactor==="no-attack-stat-loss"){',
 '  const __attack=attack;',
 '  attack=function(game,ai,di){',
 '   const p=game.players[game.active],c=p.field[ai];',
 '   const atk=c?.card?.atk,def=c?.card?.def;',
 '   const outcome=__attack(game,ai,di);',
 '   if(outcome&&c&&p.field[ai]===c){',
 '    if(game===g&&(c.card.atk<atk||c.card.def<def))',
 '     counter.openingAttackStatRestorations++;',
 '    if(Number.isFinite(atk)&&c.card.atk<atk)c.card.atk=atk;',
 '    if(Number.isFinite(def)&&c.card.def<def)c.card.def=def;',
 '   }',
 '   return outcome;',
 '  };',
 ' }',
 ' counter.openingRuleFlags={predatorSwarm:g.strategicTraining.predatorSwarmPercent,',
 '  predatorPierce:g.strategicTraining.predatorArmorPierce,',
 '  factor:scene.diagnosticFactor,arenaDecayDisabled:g.strategicTraining.disableArenaLPDecay};'
]);
inject(' const result=baseAdvance(game);',[
 ' const __openingTurn=game===g&&game.turn<=6?game.turn:null;',
 ' const __openingOwner=game.active;',
 ' const __openingBefore=__openingTurn===null?null:__openingSnapshot(game);',
 ' const result=baseAdvance(game);',
 ' if(__openingTurn!==null){',
 '  const after=__openingSnapshot(game);',
 '  counter.openingTimeline.push({turn:__openingTurn,owner:__openingOwner,',
 '   before:__openingBefore,after,',
 '   outgoingAtkLoss:Math.max(0,__openingBefore[__openingOwner].atk-after[__openingOwner].atk),',
 '   outgoingDefLoss:Math.max(0,__openingBefore[__openingOwner].def-after[__openingOwner].def)});',
 ' }'
]);
`;

const extension=String.raw`
function extend1581(src){
 src=once(src,
  '      decayEnabled:decayActive,matchType:process.env.ARCANE_V1580_MATCH,secondDrawerExtraCard:Number(process.env.ARCANE_V1580_SECOND_EXTRA)});',
  '      decayEnabled:decayActive,matchType:process.env.ARCANE_V1580_MATCH,secondDrawerExtraCard:Number(process.env.ARCANE_V1580_SECOND_EXTRA),diagnosticFactor:process.env.ARCANE_V1581_FACTOR});',
  'pass experiment to actual duel');
 src=once(src,'      extraCardBeneficiarySeat:1-starter,',
  '      extraCardBeneficiarySeat:1-starter,\n'+
  '      diagnosticFactor:process.env.ARCANE_V1581_FACTOR,\n'+
  '      openingBeginning:m.stats.openingBeginning,\n'+
  '      openingTimeline:m.stats.openingTimeline,\n'+
  '      openingActionByTurn:m.stats.openingActionByTurn,\n'+
  '      openingRuleFlags:m.stats.openingRuleFlags,\n'+
  '      openingAttackStatRestorations:m.stats.openingAttackStatRestorations,',
  'export six-turn main-game traces');
 src=once(src,' ];\n const shardArg=',
  ' ].slice(-1);\n const shardArg=',
  'only one matched policy; remove five repeated controls');
 src=once(src,"'  if(game===g&&game.turn<=4){',",
  "'  if(game===g&&game.turn<=6){',\n"+
  "'   const open=counter.openingActionByTurn[game.turn]||',\n"+
  "'    (counter.openingActionByTurn[game.turn]={owner:current,actions:0,types:{},',\n"+
  "'       availableAttackWindows:0,missedReadyAttacks:0});',\n"+
  "'   open.actions++;open.types[action.type]=(open.types[action.type]||0)+1;',\n"+
  "'   const available=game.aiPhase===\"attacks\"&&',\n"+
  "'    game.players[current].field.some(c=>c&&canAttack(game,c));',\n"+
  "'   if(available)open.availableAttackWindows++;',\n"+
  "'   if(available&&action.type===\"end\")open.missedReadyAttacks++;',",
  'six-turn action type trace');
 src=once(src,"assert.equal(obj.cases.length,144,", "assert.equal(obj.cases.length,24,",'smaller shards');
 src=once(src,"assert.equal(cases.length,144,", "assert.equal(cases.length,24,",'smaller candidate shards');
 src=once(src,"const inner='\\nnew Function(",
  ${JSON.stringify(extraHooks)}+"const inner='\\nnew Function(",
  'append research-only mechanics/trace injection');
 return src;
}
`;
once('function amendRoles(src){',extension+'\nfunction amendRoles(src){','extension definition');
once(' return src;\n}\nlet code=original',
 ' return extend1581(src);\n}\nlet code=original', 'extend underlying simulation source');
new Function('require','process','console','__dirname',source)(require,process,console,__dirname);
