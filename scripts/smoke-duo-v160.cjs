'use strict';
/* Manual online smoke. Creates two disposable rooms with real 40-card decks,
 * verifies invite, 4-seat turn order, server validation, private hands and
 * the v16.3 DEF/Soul abilities, combat perk ranks, card ascensions and
 * server-only fusion rolls without altering any existing room.
 * Requires HTTPS access and a deployed isolated arcane-duo-v2 function.
 */
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const snapshot=require('../assets/duo-card-catalog-v160.json');
const url='https://cvmtmvruutdneyblumgf.supabase.co/functions/v1/arcane-duo-v2';
function post(data,expected=200){
 const out=execFileSync('curl',['--max-time','25','-sS','-w','\n%{http_code}',
  '-X','POST',url,'-H','Origin: https://raw.githack.com',
  '-H','Content-Type: application/json','--data',JSON.stringify(data)],
 {encoding:'utf8',maxBuffer:2e6});
 const i=out.lastIndexOf('\n'),code=Number(out.slice(i+1)),body=JSON.parse(out.slice(0,i));
 assert.equal(code,expected,JSON.stringify({status:code,error:body.error}));
 return body;
}
const deck=snapshot.starterMain,fusions=snapshot.starterFusions;
// Slots 0–2 are chapter loan cards; put Soul in slot 3 so it survives replacement.
const hostDeck=[...deck.slice(0,3),387,...deck.slice(4)];
const host=post({type:'create',name:'Parity QA',entry:'new',deck:hostDeck,fusions,
 upgrades:{power:10,openingAegis:3,resilience:2,combatDiscipline:3},
 enhancements:{387:5}});
assert.equal(host.state.schema,2);
assert.equal(host.state.status,'waiting');
assert.equal(host.state.ruleset,'duo-v163');
assert.equal(host.state.teams[0].shield,75);
assert.ok(host.invite);
const guest=post({type:'join',roomId:host.roomId,invite:host.invite,
 name:'Partner QA',deck,fusions,upgrades:{openingAegis:3}});
assert.equal(guest.seat,2);
assert.equal(guest.state.teams[0].shield,150);
assert.equal(guest.state.players[2].upgrades.openingAegis,3);
assert.deepEqual(guest.state.players.map(p=>p.hand.length),[5,5,5,5]);
assert.equal(guest.state.players[0].hand[0],null);
const blocked=post({type:'action',roomId:host.roomId,token:guest.token,
 expectedRevision:guest.state.revision,action:{type:'end'}},400);
assert.match(blocked.error,/anderer Spieler/);
const summoned=post({type:'action',roomId:host.roomId,token:host.token,
 expectedRevision:guest.state.revision,action:{type:'summon',handIndex:3,slot:0}});
assert.equal(snapshot.cards[summoned.state.players[0].field[0].id].playable,true);
assert.equal(summoned.state.players[0].field[0].role,'soul');
assert.equal(summoned.state.players[0].field[0].atk,440);
assert.equal(summoned.state.players[0].field[0].def,960);
const defended=post({type:'action',roomId:host.roomId,token:host.token,
 expectedRevision:summoned.state.revision,action:{type:'switch',slot:0}});
assert.equal(defended.state.players[0].field[0].mode,'def');
const focused=post({type:'action',roomId:host.roomId,token:host.token,
 expectedRevision:defended.state.revision,action:{type:'soulFocus',slot:0,stat:'def'}});
assert.equal(focused.state.players[0].field[0].drainPreference,2);
const rejectedFocus=post({type:'action',roomId:host.roomId,token:host.token,
 expectedRevision:focused.state.revision,action:{type:'soulFocus',slot:0,stat:'atk'}},400);
assert.match(rejectedFocus.error,/Fokus in diesem Zug/);
const afterHost=post({type:'action',roomId:host.roomId,token:host.token,
 expectedRevision:focused.state.revision,action:{type:'end'}});
assert.equal(afterHost.state.activeSeat,2,'The AI must finish seat 1 server-side');
const afterGuest=post({type:'action',roomId:host.roomId,token:guest.token,
 expectedRevision:afterHost.state.revision,action:{type:'end'}});
assert.equal(afterGuest.state.activeSeat,0,'The AI must finish seat 3 server-side');
assert.ok(afterGuest.state.players[0].field[0].soul>0,'Passive soul drain must collect energy');
assert.ok(afterGuest.state.teams[1].lp<16000,'Passive Soulbrand must hurt team LP');
assert.ok(afterGuest.state.players[1].field[0],'AI seat 1 should have a legal raid target');
const raided=post({type:'action',roomId:host.roomId,token:host.token,
 expectedRevision:afterGuest.state.revision,
 action:{type:'soulRaid',slot:0,targetSeat:1,targetSlot:0}});
assert.equal(raided.state.players[0].field[0].raidCooldown,3);
assert.equal(raided.state.players[0].field[0].decaySkipOwnTurn,raided.state.players[0].ownTurns);
const checked=post({type:'state',roomId:host.roomId,token:host.token});
assert.equal(checked.state.revision,raided.state.revision);
assert.equal(checked.state.players[2].hand.every(c=>c===null),true);
assert.equal(checked.state.rngSeed,undefined,'Clients must never see the next roll seed');
// The chapter loans in positions 0 and 1 are guaranteed Lv2 material.
// Test real independent ATK/DEF rolls in a second disposable lobby.
const fuseHost=post({type:'create',name:'Fusion QA',entry:'new',deck,fusions,
 upgrades:{fusionLore:1,fusionPrecision:3},enhancements:{41:5}});
const fuseGuest=post({type:'join',roomId:fuseHost.roomId,invite:fuseHost.invite,
 name:'Fusion Partner',deck,fusions});
const fused=post({type:'action',roomId:fuseHost.roomId,token:fuseHost.token,
 expectedRevision:fuseGuest.state.revision,
 action:{type:'fusion',materials:[{from:'hand',index:0},{from:'hand',index:1}],
  coreIndex:0,slot:0,templateId:41}});
const f=fused.state.players[0].field[0];
assert.equal(f.fusion,true);
assert.ok(f.qualityRolls>=1&&f.qualityRolls<=7);
assert.equal(f.rollTrace.length,f.qualityRolls);
assert.equal(f.rollMath.winnerIndex,f.rollTrace.findIndex(x=>
 x.atk+x.def===Math.max(...f.rollTrace.map(c=>c.atk+c.def))));
assert.equal(f.atk,f.rollMath.winner.atk+f.materialBonus.atk);
assert.equal(f.def,f.rollMath.winner.def+f.materialBonus.def);
const fusionTemplate=snapshot.cards[41];
const ascentBase=fusionTemplate.fusionReference.atk*
 (fusionTemplate.atk+5*20)/fusionTemplate.atk*
 f.rollMath.roleWeights.atk*f.rollMath.quality;
assert.equal(f.rollMath.base.atk,Math.round(ascentBase/10)*10,
 'Template ascent must feed the authoritative roll baseline before role and quality factors');
assert.equal(fused.state.rngSeed,undefined);
const invalid=post({type:'create',name:'Tamper QA',entry:'new',deck,fusions,
 upgrades:{power:99}},400);
assert.match(invalid.error,/Ungültiger Rang/);
console.log('Online 2v2 v16.3: private hands, seat order, save, DEF, Soul, validated perks, ascension, shield, and server-only fusion rolls OK.');
