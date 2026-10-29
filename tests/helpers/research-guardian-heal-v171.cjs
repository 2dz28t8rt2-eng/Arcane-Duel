'use strict';
/* v17.1 only: reduce DEF-healing from a Guardian to OTHER Guardians,
 * not Guardian-to-Soul; own healing is already excluded.
 * The existing per-Guardian 150 cap and actual DEF max remain unchanged.
 * This file is loaded by the offline test VM only.
 */
const assert=require('node:assert/strict');
const MODES=Object.freeze(['control100','guardian85','guardian75']);
function mode(){
 const v=process.env.ARCANE_RESEARCH_GUARDIAN_HEAL||'';
 if(!MODES.includes(v))throw Error('Explicit v17.1 guardian healing cohort required');
 return v;
}
function factor(v){
 if(!MODES.includes(v))throw Error('invalid v17.1 guardian healing cohort '+v);
 return v==='control100'?1:v==='guardian85'?.85:.75;
}
function transform(source,variant){
 const f=factor(variant);
 const anchor='const layer=statLayer(ally),amount=Math.min(150,25+dataOf(guardian).level*12);';
 assert.equal(source.split(anchor).length,2,'Guardian healing live anchor missing or duplicated');
 if(f===1)return source;
 const after='const layer=statLayer(ally),baseHeal=Math.min(150,25+dataOf(guardian).level*12),'+
   'amount=roleOf(ally)===\'guardian\'?Math.floor(baseHeal*'+f+'):baseHeal;';
 return source.replace(anchor,after);
}
module.exports={MODES,mode,factor,transform};
