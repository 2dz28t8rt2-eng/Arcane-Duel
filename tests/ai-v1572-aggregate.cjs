'use strict';
/* Run the same sealed, paired v14.9.71 acceptance gates on the new predeclared
 * v14.9.72 arms. No weakening of H2H, seat, decay, fusion or HOLDOUT gates. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'ai-v1571-roles-aggregate.cjs'),'utf8');
function all(before,after){
 assert.ok(source.includes(before),'Missing aggregate anchor '+before);
 source=source.split(before).join(after);
}
all('artifacts/v1571','artifacts/v1572');
all('arcane-v1571','arcane-v1572');
all('15710000+','15720000+');
all('defender-v1569-endgame-control','defender-v1572-survival-control');
all('defender-v1569-mixed-control','defender-v1572-counterplay');
all('role-identity-conditional-fusion','fusion-v1572-role-economics');
new Function('require','process','console',source)(require,process,console);
