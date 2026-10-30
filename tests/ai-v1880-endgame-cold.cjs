'use strict';
if(process.env.ARCANE_RESEARCH_BALANCE_V169!=='control10')throw Error('v17.7 must retain 15/90/100/120');
// v20.7 rule regime break: no v20.6 duel-outcome labels used at evaluation.
// The new learner is trained POST-run on fresh v20.7 TRAIN only.
const fs=require('node:fs');const {mode}=require('./helpers/research-ai-v188.cjs');
const balance=mode(),root='artifacts/v1880/'+balance;fs.mkdirSync(root,{recursive:true});
const data={schema:'arcane-v1880-cold-start',sourceRun:0,sourceRules:'v21.2-live-guardian-95pct-22-78',
 balance,split:'train',ruleChangeReset:true,holdoutUsed:false,validationUsed:false,
 games:0,failures:0,actions:0,learned:{},nonzero:0,
 note:'Valid experiment policy uses no pre-v20.7 endgame outcome labels.'};
fs.writeFileSync(root+'/endgame-learner.json',JSON.stringify(data,null,2)+'\n');
console.log('ARCANE_V1880_RULE_RESET '+JSON.stringify({balance,sourceRules:data.sourceRules}));
