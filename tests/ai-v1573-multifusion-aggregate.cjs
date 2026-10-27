'use strict';
/* Identical frozen v14.9.71/v14.9.72 acceptance gates, with only arm names,
 * independent seeds and output path changed for multi-material research. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'ai-v1571-roles-aggregate.cjs'),'utf8');
function all(before,after){
 assert.ok(source.includes(before),'Missing aggregate anchor '+before);
 source=source.split(before).join(after);
}
all('artifacts/v1571','artifacts/v1573');
all('arcane-v1571','arcane-v1573');
all('15710000+','15730000+');
all('defender-v1569-endgame-control','defender-v1573-survival-control');
all('defender-v1569-mixed-control','defender-v1573-counterplay');
all('role-identity-conditional-fusion','fusion-v1573-multimaterial');
new Function('require','process','console',source)(require,process,console);
