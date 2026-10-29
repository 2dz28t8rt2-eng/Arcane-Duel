'use strict';
// v20.7 rule regime break: no v20.6 duel-outcome labels used at evaluation.
// The new learner is trained POST-run on fresh v20.7 TRAIN only.
const fs=require('node:fs');const {mode}=require('./helpers/research-role-balance-v169.cjs');
const cohort=process.env.ARCANE_V1700_COHORT;
if(!['cold','learned'].includes(cohort))throw Error('v17.0 requires cold or learned cohort');
if(require('./ai-v1700-research-baseline.cjs').selectedVariant!=='predator15Triad90')throw Error('Unexpected v17.0 research rules');
if(process.env.ARCANE_RESEARCH_BALANCE_V169!=='predator15Triad90')throw Error('v17.0 rule mismatch');

const balance=mode(),root='artifacts/v1700/'+cohort;fs.mkdirSync(root,{recursive:true});
const data={schema:'arcane-v1700-cold-start',sourceRun:0,sourceRules:'v20.7',
 balance,split:'train',ruleChangeReset:true,holdoutUsed:false,validationUsed:false,
 games:0,failures:0,actions:0,learned:{},nonzero:0,
 note:'Valid experiment policy uses no pre-v20.7 endgame outcome labels.'};
fs.writeFileSync(root+'/endgame-learner.json',JSON.stringify(data,null,2)+'\n');
console.log('ARCANE_V1700_RULE_RESET '+JSON.stringify({balance,sourceRules:data.sourceRules}));
