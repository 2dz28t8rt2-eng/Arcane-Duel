'use strict';
// v20.6 SOLO ARMOR RULE RESET. No historical outcome-based endgame biases:
// previous duel labels were generated under a different Guardian/Soul rule.
// Generate neutral checkpoint; learn v20.6 endgames from this run's TRAIN
// for the next generation. Frozen champion policy is deliberately unchanged.
const fs=require('node:fs'),assert=require('node:assert/strict');
const root='artifacts/v1650';fs.mkdirSync(root,{recursive:true});
const data={
 schema:'arcane-v1650-endgame-rule-reset',
 sourceRun:0,sourceRules:'v20.6-soul-bond',split:'train',
 ruleChangeReset:true,holdoutUsed:false,validationUsed:false,
 outcomeAssociationNotCausality:true,sources:[],
 games:0,failures:0,actions:0,learned:{},nonzero:0,
 rationale:'Do not transfer pre-v20.6 Guardian/Soul outcome priors into the new 20/35 percent armor regime.'
};
fs.writeFileSync(root+'/endgame-learner.json',JSON.stringify(data,null,2)+'\n');
console.log('ARCANE_V1650_COLD_START_RULE_RESET '+JSON.stringify(data));
