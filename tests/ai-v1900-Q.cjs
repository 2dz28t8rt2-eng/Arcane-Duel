'use strict';
if(process.env.ARCANE_RESEARCH_BALANCE_V169!=='control10')throw Error('v17.7 must retain 15/90/100/120');
// v16.5 rule-regime reset: Q is revalidated on current v20.6 engine.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'ai-v1571-Q.cjs'),'utf8');
for(const [a,b] of [['artifacts/v1571','artifacts/v1900/'+require('./helpers/research-ai-v190.cjs').mode()],['ARCANE_V1571','ARCANE_V1900']]){
 assert.ok(source.includes(a),'Missing Q source anchor '+a);
 source=source.split(a).join(b);
}
const stale='const older=historical.examples.filter(r=>r.swarm===swarm&&r.pierce===pierce);';
assert.equal(source.split(stale).length,2,'Missing prior-rule outcome import');
source=source.replace(stale,'const older=[]; // no historical labels from the pre-v20.6 rule regime');
new Function('require','process','console',source)(require,process,console);
