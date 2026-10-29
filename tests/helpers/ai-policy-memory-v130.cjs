'use strict';
/* v13.0 safe first cross-run memory consumer.
 * Historical per-policy episode wins are TRAINING priors only, not action labels.
 * No use of held-out results when selecting or tuning a policy.
 * This is a conservative veto on risky experimentation, not an ML model.
 */
const history=require('../../models/ai-policy-history-v130.json');
const REGIME='arcane-strategic-board-lookahead-v129';
function preferBaselineForTier(tier,challenger='strategic-lookahead'){
 if(!Number.isInteger(tier)||tier<1||tier>10)
  throw Error('Invalid tier');
 const src=history.history.find(x=>x.schema===REGIME);
 if(!src)throw Error('No comparable strategic-learning history');
 const target=[7,8,9,10].indexOf(tier);
 if(target<0)return {recommended:'tempo-baseline',reason:'no strategic test at tier',
   evidence:'no historical matching training policy'};
 if(!src.arms[challenger])throw Error('Not compared challenger: '+challenger);
 const a=src.arms['tempo-baseline'].train[target],
  b=src.arms[challenger].train[target];
 // No statistical claim on 16 examples: require at least a two-career
 // training advantage before even ALLOWING a new policy as a candidate.
 // Independent post-selection holdout must still be run before promotion.
 const experimentalCandidate=b>=a+2;
 return {recommended:experimentalCandidate?challenger:'tempo-baseline',
  baselineTrainWins:a,challengerTrainWins:b,nTrain:16,
  reason:experimentalCandidate?
   'training advantage: candidate for new independent evaluation':
   'no demonstrated train-only advantage: retain proven tempo policy',
  requireFreshHoldout:true};
}
module.exports={preferBaselineForTier};
