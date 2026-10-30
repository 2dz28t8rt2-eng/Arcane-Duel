'use strict';
// v18.5 compares the current production Guardian 95%/22:78 catalogue under
// ACTUAL live combat rules. The research-only v17.8 counter instrumentation
// is observation-only with stats cohort pinned to 'control'.
const MODES=Object.freeze(['baseline','optimized']);
function mode(){const m=process.env.ARCANE_V1850_COHORT;
 if(!MODES.includes(m))throw Error('v18.5 requires baseline or optimized cohort');
 if(process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V178!=='control')throw Error('v18.5 must not reweight already-balanced Guardian cards');
 if(process.env.ARCANE_RESEARCH_BALANCE_V169!=='control10')throw Error('v18.5 uses live combat: 10% default predator pierce and native Essence rules');
 return m;}
module.exports={MODES,mode};
