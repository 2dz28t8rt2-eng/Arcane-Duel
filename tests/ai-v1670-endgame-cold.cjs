'use strict';
// v20.7 rule regime break: no v20.6 duel-outcome labels used at evaluation.
// The new learner is trained POST-run on fresh v20.7 TRAIN only.
const fs=require('node:fs');const {mode}=require('./helpers/research-role-balance-v167.cjs');
const balance=mode(),root='artifacts/v1670/'+balance;fs.mkdirSync(root,{recursive:true});
const data={schema:'arcane-v1670-cold-start',sourceRun:0,sourceRules:'v20.7',
 balance,split:'train',ruleChangeReset:true,holdoutUsed:false,validationUsed:false,
 games:0,failures:0,actions:0,learned:{},nonzero:0,
 note:'Valid experiment policy uses no pre-v20.7 endgame outcome labels.'};
fs.writeFileSync(root+'/endgame-learner.json',JSON.stringify(data,null,2)+'\n');
console.log('ARCANE_V1670_RULE_RESET '+JSON.stringify({balance,sourceRules:data.sourceRules}));
