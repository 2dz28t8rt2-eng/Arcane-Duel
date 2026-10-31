'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const rules=require('../assets/duo-shared-rules-v160.js');
const INITIAL_LP=rules.duoStartingLp(1);
const snapshot=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));
const deck=[...snapshot.starterMain],fusions=[...snapshot.starterFusions];
const setup=()=>{
 const base=rules.create({roomId:'test-123456',hostName:'Hannes',hostDeck:deck,hostFusions:fusions,
  enemyDeckA:deck,enemyDeckB:deck,enemyFusionsA:fusions,enemyFusionsB:fusions,
  chapter:1,entry:'new',catalog});
 return rules.apply(base,2,{type:'join',name:'Partner',deck,fusions},{catalog});
};
const move=(state,seat,action)=>rules.apply(state,seat,action,{catalog});
const live=(id,changes={})=>({id,uid:1000+id,level:catalog[id].level,
 atk:catalog[id].atk,def:catalog[id].def,role:catalog[id].role,
 fusion:false,mode:'atk',used:false,switched:false,placedRound:0,
 soul:0,condensed:0,soulCooldown:0,raidCooldown:0,condenseLeft:0,
 condenseSlice:0,drainPreference:0,lastSoulAction:-1,lastDrainSwitch:-1,
 decaySkipOwnTurn:-1,decayGrace:0,maxDef:catalog[id].def,resonance:0,...changes});
const luckySeed=()=>{
 for(let seed=1;seed<10000;seed++){
  let x=seed;x^=x<<13;x^=x>>>17;x^=x<<5;
  if((x>>>0)%100===0)return seed;
 }
 throw Error('No deterministic 0% test seed found');
};
function fateSetup(ownerSeat=0){
 const state=setup();state.round=3;
 state.activeSeat=ownerSeat===0?3:ownerSeat===1?0:ownerSeat===2?1:2;
 state.teams[state.players[ownerSeat].team].lp=100;
 const rivalSeat=ownerSeat===0||ownerSeat===2?1:0;
 state.players[rivalSeat].field[0]=live(deck[0],{atk:3000,def:3000});
 state.rngSeed=luckySeed();
 return state;
}
test('current singleplayer catalog and server catalog never diverge',()=>{
 assert.equal(snapshot.cards.length,762);
 assert.ok(snapshot.cards.filter(c=>c.playable).length>420);
 assert.deepEqual(snapshot.cards.map(c=>c.id),Array.from({length:762},(_,i)=>i));
 assert.equal(fs.readFileSync(path.resolve(__dirname,'../supabase/functions/arcane-duo-v2/catalog.json'),'utf8'),
  fs.readFileSync(path.resolve(__dirname,'../assets/duo-card-catalog-v160.json'),'utf8'));
 assert.equal(fs.readFileSync(path.resolve(__dirname,'../supabase/functions/arcane-duo-v2/duo-rules.js'),'utf8'),
  fs.readFileSync(path.resolve(__dirname,'../assets/duo-shared-rules-v160.js'),'utf8'));
});
test('all four players start with 40 real cards, five in own hand, seven slots and stage-specific team LP',()=>{
 const state=setup();
 assert.equal(state.schema,2);assert.equal(state.ruleset,'duo-v166');
 assert.ok([0,1].includes(state.tiePriority));assert.equal(state.players.length,4);
 assert.deepEqual(state.players.map(p=>p.hand.length),[5,5,5,5]);
 assert.deepEqual(state.players.map(p=>p.deck.length),[35,35,35,35]);
 assert.deepEqual(state.players.map(p=>p.field.length),[7,7,7,7]);
 assert.deepEqual(state.teams.map(t=>t.lp),[INITIAL_LP,INITIAL_LP]);
 assert.deepEqual(state.players.map(p=>p.team),[0,1,0,1]);
 assert.equal(state.activeSeat,0);
});
test('ten original Fate identities (including noncollectible templates) come from the singleplayer',()=>{
 assert.equal(snapshot.fateIds.length,10);
 assert.equal(snapshot.fateNames.length,10);
 assert.deepEqual(snapshot.fateNames.slice(0,2),['Sternenrichter','Himmlischer Löwenwächter']);
 assert.ok(snapshot.fateIds.every(id=>catalog[id].fateTemplate&&catalog[id].level===10));
 assert.equal(new Set(snapshot.fateIds).size,10);
 assert.ok(snapshot.fateIds.some(id=>!catalog[id].playable));
 assert.ok(snapshot.fateIds.every(id=>!deck.includes(id)));
});
test('Fate draw starts from round 3, respects 2v2 team pressure, and returns hand to deck',()=>{
 const before=fateSetup();before.round=1;
 const noFate=move(before,3,{type:'end'});
 assert.equal(noFate.players[0].fateUsed,false);
 const eligible=fateSetup();
 const oldHand=[...eligible.players[0].hand],oldCount=eligible.players[0].deck.length;
 eligible.players[1].graveyard.push(live(deck[0],{atk:3800,def:4100}));
 const next=move(eligible,3,{type:'end'});
 assert.equal(next.activeSeat,0);assert.equal(next.round,4);
 assert.equal(next.players[0].fateUsed,true);
 assert.equal(next.players[0].hand.length,5);
 assert.equal(next.players[0].deck.length,oldCount+oldHand.length);
 assert.deepEqual(next.players[0].deck.slice().sort((a,b)=>a-b),
  [...eligible.players[0].deck,...oldHand].sort((a,b)=>a-b));
 assert.ok(next.players[0].hand.every(c=>c.fate&&snapshot.fateIds.includes(c.id)));
 assert.equal(new Set(next.players[0].hand.map(c=>c.id)).size,5);
 assert.ok(next.players[0].hand.every(c=>c.atk===3900&&c.def===4200));
 assert.deepEqual(next.fateEvent.cardIds,next.players[0].hand.map(c=>c.id));
 assert.equal(next.fateEvent.ownerSeat,0);
 assert.equal(next.fateEvent.score,100);
 assert.equal(eligible.players[0].fateUsed,false,'The reducer must not mutate a prior state');
 const host=rules.view(next,0),guest=rules.view(next,2);
 assert.equal(host.players[0].hand[0].fate,true);
 assert.deepEqual(guest.players[0].hand,Array(5).fill(null));
});
test('Fate also triggers for opponents; its low-pressure chance stays zero',()=>{
 const enemy=fateSetup(1);const next=move(enemy,0,{type:'end'});
 assert.equal(next.players[1].fateUsed,true);
 assert.equal(next.fateEvent.ownerSeat,1);
 assert.ok(next.players[1].hand.every(c=>c.fate));
 const calm=setup();calm.round=3;calm.activeSeat=3;calm.rngSeed=luckySeed();
 const noFate=move(calm,3,{type:'end'});
 assert.equal(noFate.players[0].fateUsed,false);
 assert.equal(noFate.fateEvent,null);
});
test('Fate creatures summon and attack normally, but cannot fuse from hand/field or enter ghosts',()=>{
 let g=move(fateSetup(),3,{type:'end'});
 assert.throws(()=>rules.fusionOptions(g,0,[{from:'hand',index:0},{from:'hand',index:1}],catalog),
  /nicht fusionierbar/);
 const temp=g.players[0].hand[0];
 g=move(g,0,{type:'summon',handIndex:0,slot:0});
 assert.equal(g.players[0].field[0].fate,true);
 assert.equal(g.players[0].field[0].atk,temp.atk);
 assert.equal(g.players[0].field[0].maxDef,temp.def);
 assert.throws(()=>rules.fusionOptions(g,0,[{from:'field',index:0},
  {from:'hand',index:0}],catalog),/nicht fusionierbar/);
 g.players[0].lv1.perk=true;g.players[0].lv1.ghostSlots=[null];
 assert.throws(()=>move(g,0,{type:'lv1Station',slot:0,ghostSlot:0}),/Geisterslot/);
 g.round=5;
 const before=g.teams[1].lp;
 // Destroy opposing obstacles to isolate normal fate direct-attack damage.
 g.players[1].field.fill(null);g.players[3].field.fill(null);
 const attacked=move(g,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null});
 assert.equal(attacked.teams[1].lp,before-temp.atk);
 assert.equal(attacked.players[0].field[0].used,true);
});
test('ACE monsters cannot be used as fusion material in hand, field, or ghost zone',()=>{
 const g=setup(),ace=314;
 assert.equal(catalog[ace].ace,true);
 g.players[0].hand[0]=ace;
 assert.throws(()=>rules.fusionOptions(g,0,[{from:'hand',index:0},
  {from:'hand',index:1}],catalog),/ACE-Monster/);
 g.players[0].hand[0]=deck[0];
 g.players[0].field[0]=live(ace);
 assert.throws(()=>rules.fusionOptions(g,0,[{from:'field',index:0},
  {from:'hand',index:0}],catalog),/ACE-Monster/);
 g.players[0].field[0]=null;
 g.players[0].lv1.perk=true;
 g.players[0].lv1.ghostSlots=[live(ace)];
 assert.throws(()=>rules.fusionOptions(g,0,[{from:'ghost',index:0},
  {from:'hand',index:0}],catalog),/ACE-Monster/);
});
test('Fate cards are one-time per duellant and all temporary cards disappear between chapters',()=>{
 let g=move(fateSetup(),3,{type:'end'});
 g.activeSeat=3;g.round=4;g.rngSeed=luckySeed();
 const previous=g.fateEvent;
 const noSecond=move(g,3,{type:'end'});
 assert.deepEqual(noSecond.fateEvent,previous);
 assert.equal(noSecond.players[0].fateUsed,true);
 noSecond.status='finished';noSecond.winner=0;
 const offer=move(noSecond,0,{type:'nextChapter'});
 assert.equal(offer.status,'inviting_next');
 assert.equal(offer.chapter,1);
 const chapter=move(offer,2,{type:'acceptNextChapter'});
 assert.equal(chapter.chapter,2);
 assert.equal(chapter.fateEvent,null);
 assert.ok(chapter.players.every(p=>p.fateUsed===false));
 assert.ok(chapter.players.every(p=>p.hand.every(id=>Number.isInteger(id))));
 assert.ok(chapter.players.every(p=>p.field.every(c=>c===null)));
});
test('Arena damages team LP only after completed round 10 and bypasses shields',()=>{
 let g=setup();g.activeSeat=3;g.round=9;
 g.teams[0].shield=500;g.teams[1].shield=300;
 const early=move(g,3,{type:'end'});
 assert.deepEqual(early.teams.map(t=>t.lp),[INITIAL_LP,INITIAL_LP]);
 assert.equal(early.arenaEvent,null);
 g.round=10;
 const after=move(g,3,{type:'end'});
 assert.deepEqual(after.teams.map(t=>t.lp),[INITIAL_LP-400,INITIAL_LP-400]);
 assert.deepEqual(after.teams.map(t=>t.shield),[500,300]);
 assert.equal(after.round,11);assert.equal(after.arenaEvent.damage,400);
 assert.deepEqual(after.arenaEvent.before,[INITIAL_LP,INITIAL_LP]);
 assert.equal(rules.arenaDamage(g,10),400);
 assert.equal(rules.arenaDamage(g,11),800);
 assert.equal(rules.arenaDamage(g,16),INITIAL_LP);
 assert.equal(after.log.some(s=>s.includes('Arena-Zerfall')),true);
});
test('Arena dual knockout uses pre-damage LP, then fixed seeded initiative on ties',()=>{
 const state=setup();state.activeSeat=3;state.round=10;
 state.teams[0].lp=200;state.teams[1].lp=150;
 let next=move(state,3,{type:'end'});
 assert.equal(next.status,'finished');assert.equal(next.winner,0);
 assert.equal(next.activeSeat,3);assert.deepEqual(next.teams.map(t=>t.lp),[0,0]);
 state.teams[0].lp=150;state.teams[1].lp=200;
 next=move(state,3,{type:'end'});assert.equal(next.winner,1);
 state.teams[0].lp=200;state.teams[1].lp=200;
 state.tiePriority=1;
 next=move(state,3,{type:'end'});assert.equal(next.winner,1);
 assert.match(next.log.at(-1),/ausgeloste Entscheidungsinitiative/);
 state.tiePriority=0;
 next=move(state,3,{type:'end'});assert.equal(next.winner,0);
 state.teams[0].lp=401;state.teams[1].lp=400;
 next=move(state,3,{type:'end'});
 assert.equal(next.status,'finished');assert.equal(next.winner,0);
});
test('v16.5 rooms continue without Fate or Arena changes',()=>{
 const g=fateSetup();g.ruleset='duo-v165';g.round=10;
 const oldHand=[...g.players[0].hand];
 const old=move(g,3,{type:'end'});
 assert.equal(old.fateEvent,null);assert.equal(old.arenaEvent,null);
 assert.equal(old.players[0].fateUsed,false);
 assert.deepEqual(old.players[0].hand,oldHand);
 assert.equal(old.teams[0].lp,100);
});
test('deck validation rejects unknown IDs, fusion cards in main, invalid counts and duplication',()=>{
 assert.ok(rules.validDeck(deck,catalog));
 assert.ok(rules.validDeck(fusions,catalog,true));
 assert.equal(rules.validDeck(Array(40).fill(deck[0]),catalog),false);
 assert.equal(rules.validDeck([...deck.slice(1),999999],catalog),false);
 assert.equal(rules.validDeck([fusions[0],...deck.slice(1)],catalog),false);
 assert.equal(rules.validDeck([...fusions,deck[0]],catalog,true),false);
});
test('room views never disclose other players hands, deck contents, or fusion templates',()=>{
 const state=setup(),host=rules.view(state,0),guest=rules.view(state,2);
 assert.deepEqual(host.players[1].hand,[null,null,null,null,null]);
 assert.deepEqual(host.players[2].fusionDeck,guest.players[2].fusionDeck.map(()=>null));
 assert.equal(guest.players[0].hand[0],null);
 assert.equal(host.players[0].hand.length,5);
 assert.equal(host.players[0].baseDeck,undefined);
 assert.equal(guest.players[2].baseFusions,undefined);
 assert.equal(host.uid,undefined);
 assert.equal(host.rngSeed,undefined,'Future fusion rolls must remain server-owned');
});
test('turn ownership, summon limits, position restrictions, draw to five and correct seat cycle',()=>{
 let state=setup();
 assert.throws(()=>move(state,2,{type:'summon',handIndex:0,slot:0}),/anderer Spieler/);
 const id=state.players[0].hand[0];
 state=move(state,0,{type:'summon',handIndex:0,slot:0});
 assert.equal(state.players[0].field[0].id,id);
 assert.equal(state.players[0].hand.length,4);
 assert.throws(()=>move(state,0,{type:'summon',handIndex:0,slot:1}),/bereits/);
 assert.throws(()=>move(state,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null}),/nicht bereit/);
 state=move(state,0,{type:'switch',slot:0});
 assert.equal(state.players[0].field[0].mode,'def');
 assert.throws(()=>move(state,0,{type:'switch',slot:0}),/nicht möglich/);
 state=move(state,0,{type:'end'});
 assert.equal(state.activeSeat,1);
 state=move(state,1,{type:'end'});assert.equal(state.activeSeat,2);
 state=move(state,2,{type:'end'});assert.equal(state.activeSeat,3);
 state=move(state,3,{type:'end'});
 assert.equal(state.activeSeat,0);assert.equal(state.round,2);
 assert.equal(state.players[0].hand.length,5);
 assert.equal(state.players[0].field[0].switched,false);
});
test('ordinary fusion uses owned materials, consumes template and does not touch unselected ally field',()=>{
 let state=setup();
 // The inventory includes at least one Lv2/3 early fusion.
 const levelOneHand=state.players[0].hand
  .map((id,i)=>({id,i})).filter(x=>catalog[x.id].level===1);
 assert.ok(levelOneHand.length>=2);
 const materials=levelOneHand.slice(0,2).map(x=>({from:'hand',index:x.i}));
 const options=rules.fusionOptions(state,0,materials,catalog);
 assert.ok(options.rule.level>=2);
 assert.ok(options.templates.length>0);
 const templateId=options.templates[0],count=state.players[0].remainingFusion.length;
 state=move(state,0,{type:'fusion',materials,slot:0,templateId});
 assert.equal(state.players[0].field[0].id,templateId);
 assert.equal(state.players[0].field[0].fusion,true);
 assert.equal(state.players[0].hand.length,3);
 assert.equal(state.players[0].remainingFusion.length,count-1);
 assert.equal(state.players[2].field.filter(Boolean).length,0);
 assert.equal(state.players[0].graveyard.length,2);
 assert.throws(()=>move(state,0,{type:'fusion',materials,slot:1,templateId}),/bereits/);
});
test('partner can attack either opponent, never attack the ally, and defender counter hurts',()=>{
 let state=setup();
 state=move(state,0,{type:'summon',handIndex:0,slot:0});
 state=move(state,0,{type:'end'});
 state=move(state,1,{type:'summon',handIndex:0,slot:0});
 state=move(state,1,{type:'end'});
 state=move(state,2,{type:'summon',handIndex:0,slot:1});
 state=move(state,2,{type:'end'});
 state=move(state,3,{type:'end'});
 assert.throws(()=>move(state,0,{type:'attack',slot:0,targetSeat:2,targetSlot:0}),/Gegnerischer Feldplatz/);
 state=move(state,0,{type:'attack',slot:0,targetSeat:1,targetSlot:0});
 assert.ok(state.log.at(-1).includes('greift'));
});
test('chapter progression only after victory and deck exhaustion is a team loss',()=>{
 let state=setup();
 assert.throws(()=>move(state,0,{type:'nextChapter'}),/freigeschaltete/);
 state.players[1].deck=[];
 state=move(state,0,{type:'end'});
 assert.equal(state.status,'finished');
 assert.equal(state.winner,0);
 state=move(state,0,{type:'nextChapter'});
 assert.equal(state.chapter,1);
 assert.equal(state.status,'inviting_next');
 assert.throws(()=>move(state,0,{type:'acceptNextChapter'}),/Einladung|Sitzplatz|Annahme/);
 state=move(state,2,{type:'acceptNextChapter'});
 assert.equal(state.chapter,2);
 assert.equal(state.status,'active');
 assert.equal(state.activeSeat,0);
 assert.equal(state.players[0].hand.length,5);
});
test('fusion majority ignores neutral quality materials and never inherits a random field role',()=>{
 const c=role=>({role});
 assert.equal(rules.fusionRole([c('soul'),c('soul')]),'soul');
 assert.equal(rules.fusionRole([c('guardian'),c('guardian')]),'guardian');
 assert.equal(rules.fusionRole([c('predator'),c('predator'),c('combatant')]),'predator');
 assert.equal(rules.fusionRole([c('guardian'),c('soul'),c('combatant')]),'guardian');
 assert.equal(rules.fusionRole([c('guardian'),c('predator')]),'resonator');
 assert.equal(rules.fusionRole([c('combatant'),c('combatant')]),'resonator');
 let state=setup();
 state.players[0].hand=[4,5];
 const materials=[{from:'hand',index:0},{from:'hand',index:1}];
 const templateId=rules.fusionOptions(state,0,materials,catalog).templates[0];
 assert.ok(templateId);
 const forecast=rules.fusionPreview(state,0,materials,catalog,{templateId});
 state=move(state,0,{type:'fusion',materials,slot:0,templateId});
 const monster=state.players[0].field[0];
 assert.equal(monster.role,'predator');
 assert.equal(monster.qualityRolls,forecast.analysis.rolls);
 assert.equal(monster.rollTrace.length,forecast.analysis.rolls);
 assert.ok(monster.atk>=forecast.atk[0]&&monster.atk<=forecast.atk[1]);
 assert.ok(monster.def>=forecast.def[0]&&monster.def<=forecast.def[1]);
 assert.deepEqual(monster.rollTrace[monster.rollMath.winnerIndex],monster.rollMath.winner);
 assert.equal(monster.atk,monster.rollMath.winner.atk+monster.materialBonus.atk);
 assert.equal(monster.def,monster.rollMath.winner.def+monster.materialBonus.def);
});
test('fusion poker patterns prefer the longest real street over repeated lower levels',()=>{
 const cards=(levels,elements=[])=>levels.map((level,i)=>({
  level,element:elements[i]||'',role:'predator',fusion:false}));
 assert.equal(rules.fusionPattern(cards([1,1,2,3,4])).name,'Große Straße');
 assert.equal(rules.fusionPattern(cards([1,1,1,2,2])).name,'Full House');
 assert.equal(rules.fusionPattern(cards([1,2,3,4,5])).name,'Gigantische Straße');
 assert.equal(rules.fusionPattern(cards([1,1,1,1,1])).name,'Fünfling');
 assert.equal(rules.fusionPattern(cards([1,1,2,2])).name,'Zwei Paare');
 assert.equal(rules.fusionPattern(cards([1,1,2,3,4],
  Array(5).fill('fire'))).name,'Große Straße · Elementharmonie');
 assert.equal(rules.fusionPattern(cards([1,1,2,3,4],
  ['fire','fire','fire','water','fire'])).name,'Große Straße');
});
test('a full straight fixes its strongest core, otherwise the player may choose it',()=>{
 const cards=[3,6,7].map(level=>({level,role:'predator',fusion:false}));
 const weak=rules.fusionLevel(cards,{coreIndex:0});
 const strong=rules.fusionLevel(cards,{coreIndex:2});
 assert.equal(weak.core,3);
 assert.equal(strong.core,7);
 assert.ok(strong.level>weak.level);
 const straight=[1,2,3,4,5].map(level=>({level}));
 const a=rules.fusionLevel(straight,{coreIndex:0});
 const b=rules.fusionLevel(straight,{coreIndex:4});
 assert.equal(a.core,5);
 assert.deepEqual(a,b);
});
test('resonator chains give at most one extra level across generations',()=>{
 const base=[{level:4,role:'resonator',fusion:true},
  {level:4,role:'resonator',fusion:true}];
 const result=rules.fusionLevel(base);
 assert.equal(result.resonatorAscent,true);
 const already=[{...base[0],fusionResonatorLineage:{count:2,used:true}},
  {level:4,role:'predator',fusion:false}];
 assert.equal(rules.fusionLevel(already).resonatorAscent,false);
});
test('server-authoritative fusion preview agrees with roll trace and reference midpoint',()=>{
 let state=setup();
 state.players[0].hand=[9,9,9,9,9];
 const materials=[0,1,2,3,4].map(index=>({from:'hand',index}));
 const availability=rules.fusionOptions(state,0,materials,catalog);
 assert.ok(availability.analysis.pattern.startsWith('Fünfling'));
 const templateId=availability.templates[0];
 assert.ok(templateId);
 const preview=rules.fusionPreview(state,0,materials,catalog,{templateId});
 const expected=rules.fusionAnalysis(availability.cards,availability.rule);
 assert.deepEqual(preview.analysis,expected);
 assert.ok(preview.atk[1]>preview.atk[0]);
 const before=JSON.stringify(state);
 state=move(state,0,{type:'fusion',materials,slot:0,templateId});
 const fused=state.players[0].field[0];
 assert.equal(fused.rollTrace.length,preview.analysis.rolls);
 assert.equal(fused.pattern,availability.analysis.pattern);
 assert.equal(fused.role,'predator');
 assert.equal(fused.rollMath.base.atk,
  Math.round(catalog[templateId].fusionReference.atk*1.2*expected.quality/10)*10);
 assert.equal(fused.rollMath.winnerIndex,fused.rollTrace.findIndex(x=>
  x.atk+x.def===Math.max(...fused.rollTrace.map(c=>c.atk+c.def))));
 assert.ok(fused.atk>=preview.atk[0]&&fused.atk<=preview.atk[1]);
 assert.ok(fused.def>=preview.def[0]&&fused.def<=preview.def[1]);
 assert.notEqual(JSON.stringify(state),before);
});
test('a fusion inherits only its own materials and consumes exactly one real template',()=>{
 let state=setup();
 state.players[0].hand=[4,4];
 const materials=[{from:'hand',index:0},{from:'hand',index:1}];
 const preview=rules.fusionOptions(state,0,materials,catalog);
 assert.ok(preview.templates.length);
 assert.throws(()=>move(state,0,{type:'fusion',materials:[
  {from:'hand',index:0},{from:'field',index:0}],slot:0,
  templateId:preview.templates[0]}),/nicht vorhanden/);
 const t=preview.templates[0];
 const count=state.players[0].remainingFusion.filter(id=>id===t).length;
 const result=move(state,0,{type:'fusion',materials,slot:0,templateId:t});
 assert.equal(result.players[0].remainingFusion.filter(id=>id===t).length,count-1);
 assert.equal(result.players[2].field.filter(Boolean).length,0);
});
test('DEF attacks are persistent, armoured, layered and counterattack with both defender roles',()=>{
 let state=setup();state.round=2;
 state.players[0].field[0]=live(4,{atk:1000});
 for(let i=1;i<6;i++)state.players[0].field[i]=live(5);
 state.players[2].field[0]=live(4); // partner never increases the owner's swarm bonus
 state.players[1].field[0]=live(0,{atk:400,def:1000,maxDef:1000,
  mode:'def',soul:100,condensed:50});
 const after=move(state,0,{type:'attack',slot:0,targetSeat:1,targetSlot:0});
 const defender=after.players[1].field[0];
 // 1000 ATK * 110% swarm * 90% (10% unbound armor) => 990.
 assert.equal(defender.condensed,0);
 assert.equal(defender.soul,0);
 assert.equal(defender.def,160);
 assert.equal(after.teams[0].lp,INITIAL_LP-50-140); // lost soul + 35% survivor counter
 assert.equal(after.players[0].field[0].atk,970); // attack fatigue
 assert.equal(after.players[0].field[0].used,true);
 assert.equal(state.players[1].field[0].def,1000,'Reducer must not mutate input');
});
test('Soul defender counters in DEF; Predator in DEF has no armor',()=>{
 let state=setup();state.round=2;
 state.players[0].field[0]=live(4,{atk:200});
 state.players[1].field[0]=live(7,{atk:300,def:300,mode:'def'});
 state=move(state,0,{type:'attack',slot:0,targetSeat:1,targetSlot:0});
 assert.equal(state.players[1].field[0].def,117); // 200 * 1.02 swarm * 0.90 unbound armor = 183
 assert.equal(state.teams[0].lp,INITIAL_LP-105);
 let predator=setup();predator.round=2;
 predator.players[0].field[0]=live(0,{atk:200});
 predator.players[1].field[0]=live(4,{def:250,mode:'def'});
 predator=move(predator,0,{type:'attack',slot:0,targetSeat:1,targetSlot:0});
 assert.equal(predator.players[1].field[0].def,50);
 assert.equal(predator.teams[0].lp,INITIAL_LP);
});
test('Soul passive drains both enemy fields, applies brand, and Guardian heals own team',()=>{
 let state=setup();state.activeSeat=3;
 state.players[0].field[0]=live(7,{mode:'def'});
 state.players[0].field[1]=live(0,{mode:'def'});
 state.players[2].field[1]=live(7,{mode:'def',def:100,maxDef:260});
 state.players[1].field[0]=live(4,{atk:300,def:300});
 state.players[3].field[0]=live(5,{atk:300,def:300});
 const next=move(state,3,{type:'end'});
 assert.equal(next.activeSeat,0);
 assert.ok(next.players[1].field[0].atk<300);
 assert.ok(next.players[3].field[0].atk<300);
 assert.ok(next.players[0].field[0].soul>0);
 assert.ok(next.teams[1].lp<INITIAL_LP,'Soul brand should damage the enemy team');
 assert.ok(next.players[2].field[1].def>100,'Guardian restores partner base DEF');
 assert.ok(next.players[2].field[1].def<=260);
});
test('Soul actions validate authorization, require DEF, and enforce once-per-turn gate',()=>{
 let state=setup();
 state.players[0].field[0]=live(7,{mode:'def',soul:200});
 assert.throws(()=>move(state,2,{type:'soulDischarge',slot:0}),/anderer Spieler/);
 const next=move(state,0,{type:'soulDischarge',slot:0});
 assert.equal(next.players[0].field[0].soul,0);
 assert.equal(next.teams[1].lp,INITIAL_LP-260);
 assert.throws(()=>move(next,0,{type:'soulCondense',slot:0}),/Bereits eine aktive/);
 assert.throws(()=>move(state,0,{type:'soulFocus',slot:0,stat:'atk'}),/Rang 3/);
 const focused=setup();focused.players[0].field[0]=live(387,{mode:'def'});
 const chose=move(focused,0,{type:'soulFocus',slot:0,stat:'def'});
 assert.equal(chose.players[0].field[0].drainPreference,2);
 assert.throws(()=>move(chose,0,{type:'soulFocus',slot:0,stat:'atk'}),/schon gewechselt/);
});
test('Soul condense and raid use cooldowns on own turns; raid pauses same-turn decay',()=>{
 let state=setup();
 state.players[0].field[0]=live(7,{mode:'def',soul:200});
 const condensed=move(state,0,{type:'soulCondense',slot:0});
 assert.equal(condensed.players[0].field[0].soul,50);
 assert.equal(condensed.players[0].field[0].condensed,150);
 assert.equal(condensed.players[0].field[0].soulCooldown,3);
 const ended=move(condensed,0,{type:'end'});
 assert.equal(ended.players[0].field[0].soulCooldown,2);
 assert.equal(ended.players[0].field[0].condenseLeft,2);
 assert.equal(ended.players[0].field[0].condensed,100);
 let raid=setup();
 raid.players[0].field[0]=live(7,{mode:'def',soul:80,atk:200,decayGrace:0});
 raid.players[1].field[0]=live(4,{atk:300,def:300});
 assert.throws(()=>move(raid,0,{type:'soulRaid',slot:0,targetSeat:2,targetSlot:0}),/nur gegen Gegner/);
 raid=move(raid,0,{type:'soulRaid',slot:0,targetSeat:1,targetSlot:0});
 assert.equal(raid.players[0].field[0].raidCooldown,3);
 assert.ok(raid.players[0].field[0].soul>80);
 const noDecay=move(raid,0,{type:'end'});
 assert.equal(noDecay.players[0].field[0].atk,200);
 assert.equal(noDecay.players[0].field[0].raidCooldown,2);
});
test('old v16.0 room snapshots continue to run without new Soul fields',()=>{
 let state=setup();state.ruleset='duo-v160';
 state.players[0].field[0]=live(7,{mode:'def',soul:100});
 for(const field of ['raidCooldown','condenseLeft','condenseSlice','drainPreference',
  'lastSoulAction','lastDrainSwitch','decaySkipOwnTurn','maxDef'])
  delete state.players[0].field[0][field];
 const after=move(state,0,{type:'soulDischarge',slot:0});
 assert.equal(after.players[0].field[0].lastSoulAction,0);
 assert.equal(after.teams[1].lp,INITIAL_LP-130);
});
test('combat build is server-validated, bounded to the submitted decks and persists on both seats',()=>{
 assert.equal(rules.version,'20.2-beta');
 const opts={roomId:'build-123456',hostName:'Host',hostDeck:deck,hostFusions:fusions,
  enemyDeckA:deck,enemyDeckB:deck,enemyFusionsA:fusions,enemyFusionsB:fusions,
  chapter:1,entry:'new',catalog,hostUpgrades:{power:10,openingAegis:3},
  hostEnhancements:{[deck[0]]:5,[fusions[0]]:2}};
 const g=rules.create(opts);
 assert.equal(g.teams[0].shield,75);
 assert.equal(g.players[0].upgrades.power,10);
 assert.equal(g.players[0].enhancements[deck[0]],5);
 assert.equal(g.players[0].enhancements[fusions[0]],2);
 assert.throws(()=>rules.create({...opts,hostUpgrades:{power:11}}),/Ungültiger Rang/);
 assert.throws(()=>rules.create({...opts,hostUpgrades:{power:-1}}),/Ungültiger Rang/);
 assert.throws(()=>rules.create({...opts,hostUpgrades:{power:1.5}}),/Ungültiger Rang/);
 assert.throws(()=>rules.create({...opts,hostUpgrades:{loot:5}}),/Unbekannter Kampf-Ausbau/);
 assert.throws(()=>rules.create({...opts,hostEnhancements:{9:6}}),/Kartenverstärkung/);
 assert.throws(()=>rules.create({...opts,hostEnhancements:{700:5}}),/Kartenverstärkung/);
 const joined=move(g,2,{type:'join',name:'Guest',deck,fusions,
  upgrades:{openingAegis:3,jagdinstinkt:2},enhancements:{[deck[0]]:3}});
 assert.equal(joined.players[2].upgrades.jagdinstinkt,2);
 assert.equal(joined.teams[0].shield,150);
 assert.equal(rules.view(joined,0).rngSeed,undefined);
});
test('normal monster role bonuses, personal perks, training and individual card ascension combine correctly',()=>{
 let state=rules.create({roomId:'stats-123456',hostName:'Host',hostDeck:deck,
  hostFusions:fusions,enemyDeckA:deck,enemyDeckB:deck,enemyFusionsA:fusions,
  enemyFusionsB:fusions,catalog,hostUpgrades:{power:10,jagdinstinkt:5,schildwall:5},
  hostEnhancements:{9:5,7:5}});
 state=move(state,2,{type:'join',name:'Guest',deck,fusions});
 state.players[0].hand=[9,7];
 const wolf=move(state,0,{type:'summon',handIndex:0,slot:0}).players[0].field[0];
 assert.equal(wolf.atk,Math.round((catalog[9].atk+110+5*10+5*(20+10*2))/10)*10);
 assert.equal(wolf.def,Math.round((catalog[9].def+110+5*10+5*(6+3*2))/10)*10);
 let guardian=setup();guardian.players[0].hand=[7];
 guardian.players[0].upgrades={power:10,schildwall:5};
 guardian.players[0].enhancements={7:5};
 guardian=move(guardian,0,{type:'summon',handIndex:0,slot:0});
 assert.equal(guardian.players[0].field[0].atk,
  Math.round((catalog[7].atk+110+5*10+5*(6+3*2))/10)*10);
 assert.equal(guardian.players[0].field[0].def,
  Math.round((catalog[7].def+catalog[7].pveBaseBonus.def+110+5*10+5*(28+10*2))/10)*10);
});
test('partner shield is shared and server-authoritative before LP damage',()=>{
 let state=setup();
 state.players[0].upgrades={openingAegis:3};
 state.teams[0].shield=75;
 state.activeSeat=1;
 state.players[1].field[0]=live(7,{mode:'def',soul:100});
 const after=move(state,1,{type:'soulDischarge',slot:0});
 assert.equal(after.teams[0].shield,0);
 assert.equal(after.teams[0].lp,INITIAL_LP-55);
 assert.ok(after.log.some(x=>x.includes('75 Schaden durch Vorhut-Schutz')));
});
test('level-sensitive creature decay and Standhaftigkeit match singleplayer and attack costs 3% of both stats',()=>{
 let state=setup();
 state.players[0].upgrades={resilience:2,combatDiscipline:3};
 state.players[0].field[0]=live(700,{atk:500,def:500,maxDef:500});
 const after=move(state,0,{type:'end'});
 assert.equal(after.players[0].field[0].atk,448);
 assert.equal(after.players[0].field[0].def,448);
 assert.equal(after.players[0].field[0].maxDef,500);
 let attack=setup();attack.players[0].upgrades={combatDiscipline:3};
 attack.round=2;attack.players[0].field[0]=live(9,{atk:500});
 attack=move(attack,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null});
 assert.equal(attack.players[0].field[0].atk,485);
 assert.equal(attack.players[0].field[0].def,Math.max(0,live(9).def-Math.ceil(live(9).def*.03)));
});
test('fusion perks add opening roll, completed street precision and one-time chain quality',()=>{
 const base=setup(),boost=setup();
 const materials=[0,1,2,3,4].map(index=>({from:'hand',index}));
 base.players[0].hand=[9,9,9,9,9];
 boost.players[0].hand=[9,9,9,9,9];
 boost.players[0].upgrades={fusionLore:1,fusionPrecision:3};
 const normal=rules.fusionOptions(base,0,materials,catalog).analysis;
 const improved=rules.fusionOptions(boost,0,materials,catalog).analysis;
 assert.equal(improved.loreOpeningRoll,true);
 assert.equal(improved.rolls,Math.min(7,normal.rolls+1));
 assert.ok(improved.quality>normal.quality);
 assert.equal(improved.precisionPct,4.5);
 const chainA=live(41,{fusion:true,level:2,quality:1.2});
 const chainB=live(41,{fusion:true,level:2,quality:1.2});
 const chain=rules.fusionAnalysis([chainA,chainB],rules.fusionLevel([chainA,chainB]),
  boost.players[0]);
 assert.equal(chain.loreChainApplied,true);
 boost.players[0].fusionLoreChainUsed=true;
 const second=rules.fusionAnalysis([chainA,chainB],rules.fusionLevel([chainA,chainB]),
  boost.players[0]);
 assert.equal(second.loreChainApplied,false);
 assert.ok(chain.quality>second.quality);
 const straightCards=[1,2,3,4,5].map(level=>({level,role:'predator',fusion:false}));
 const straightRule=rules.fusionLevel(straightCards);
 const normalStreet=rules.fusionAnalysis(straightCards,straightRule);
 const poweredStreet=rules.fusionAnalysis(straightCards,straightRule,boost.players[0]);
 assert.equal(poweredStreet.precisionPct,6);
 assert.equal(poweredStreet.rolls,Math.min(7,normalStreet.rolls+2));
});
test('ascended fusion template raises server-authoritative preview and real roll baseline',()=>{
 const base=setup(),boost=setup();
 base.players[0].hand=[4,5];boost.players[0].hand=[4,5];
 boost.players[0].enhancements={41:5};
 const materials=[{from:'hand',index:0},{from:'hand',index:1}];
 const a=rules.fusionPreview(base,0,materials,catalog,{templateId:41});
 const b=rules.fusionPreview(boost,0,materials,catalog,{templateId:41});
 assert.ok(b.atk[0]>a.atk[0]);
 assert.ok(b.def[1]>a.def[1]);
 const fused=move(boost,0,{type:'fusion',materials,slot:0,templateId:41});
 assert.ok(fused.players[0].field[0].rollMath.base.atk>a.atk[0]);
});
test('pre-v16.3 rooms without perk fields still accept actions and chapter transition',()=>{
 let state=setup();state.ruleset='duo-v162';
 for(const p of state.players){delete p.upgrades;delete p.enhancements;
  delete p.fusionsPerformed;delete p.fusionLoreChainUsed;}
 for(const t of state.teams)delete t.shield;
 state=move(state,0,{type:'summon',handIndex:0,slot:0});
 assert.ok(state.players[0].field[0].atk>0);
 state.players[1].deck=[];
 state=move(state,0,{type:'end'});
 assert.equal(state.status,'finished');
 state=move(state,0,{type:'nextChapter'});
 assert.equal(state.status,'inviting_next');
 state=move(state,2,{type:'acceptNextChapter'});
 assert.equal(state.status,'active');
 assert.equal(state.teams[0].shield,0);
});
const bondDeck=id=>{const out=[...deck];out[3]=id;return out;};
const withEssence=(id,school,tier=10,rank=5)=>{
 const main=bondDeck(id);
 const g=rules.create({roomId:'essence-123456',hostName:'Essence Host',
  hostDeck:main,hostFusions:fusions,enemyDeckA:deck,enemyDeckB:deck,
  enemyFusionsA:fusions,enemyFusionsB:fusions,catalog,
  hostEssence:{chosen:id,school,tier,rank}});
 return move(g,2,{type:'join',name:'Partner',deck,fusions});
};
test('canonical catalog labels exact bonded essence identities and sealed Level-1 fusions',()=>{
 assert.deepEqual([396,397,398].map(id=>catalog[id].essenceSchool),
  ['predator','fusion','defense']);
 assert.ok(Object.values(catalog).filter(c=>c.lv1Exclusive).length>=3);
 const bound=withEssence(396,'predator');
 assert.equal(bound.players[0].essence.chosen,396);
 assert.equal(bound.players[0].essence.rank,5);
 assert.throws(()=>rules.create({roomId:'test-123456',hostName:'X',
  hostDeck:bondDeck(396),hostFusions:fusions,enemyDeckA:deck,enemyDeckB:deck,
  enemyFusionsA:fusions,enemyFusionsB:fusions,catalog}),/Essenzmonster erfordert/);
 const forged={chosen:398,school:'defense',tier:10,rank:5};
 assert.throws(()=>rules.normalizedBuild({}, {},bondDeck(396),fusions,catalog,forged),
  /Gebundenes Essenzmonster/);
 assert.throws(()=>rules.normalizedBuild({}, {},bondDeck(396),fusions,catalog,
  {chosen:396,school:'predator',tier:3,rank:5}),/Essenzstufe/);
 assert.throws(()=>rules.normalizedBuild({}, {},bondDeck(396),fusions,catalog,
  {chosen:396,school:'hidden',tier:10,rank:5}),/Spezialisierung/);
});
test('Essence Reißzahn evolves by progress and chooses exactly two legal 70% attacks',()=>{
 let state=withEssence(396,'predator');state.players[0].hand=[396];
 state=move(state,0,{type:'summon',handIndex:0,slot:0});
 const creature=state.players[0].field[0];
 assert.equal(creature.level,10);
 assert.equal(creature.atk,catalog[396].atk+10*45+5*35);
 assert.equal(creature.def,catalog[396].def+10*70+5*55);
 state.round=2;state.players[0].field[0].placedRound=1;
 state=move(state,0,{type:'essencePredatorMode',slot:0,mode:2});
 assert.equal(state.players[0].field[0].essenceChoice,2);
 assert.throws(()=>move(state,0,{type:'essencePredatorMode',slot:0,mode:1}),/verbraucht/);
 const firstPower=Math.floor(Math.floor(creature.atk*1.02)*.7);
 state=move(state,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null});
 assert.equal(state.teams[1].lp,INITIAL_LP-firstPower);
 assert.equal(state.players[0].field[0].essenceAttacks,1);
 assert.equal(state.players[0].field[0].used,false);
 assert.throws(()=>move(state,0,{type:'switch',slot:0}),/Positionswechsel/);
 const nextAtk=state.players[0].field[0].atk;
 state=move(state,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null});
 assert.equal(state.teams[1].lp,INITIAL_LP-firstPower-
  Math.floor(Math.floor(nextAtk*1.02)*.7));
 assert.equal(state.players[0].field[0].essenceAttacks,2);
 assert.equal(state.players[0].field[0].used,true);
 assert.throws(()=>move(state,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null}),
  /nicht bereit/);
});
test('Essence Runenherz grants 1–2 independent fusion rolls only while present',()=>{
 const state=withEssence(397,'fusion',7,3);
 state.players[0].hand=[4,5];
 const materials=[{from:'hand',index:0},{from:'hand',index:1}];
 const plain=rules.fusionOptions(state,0,materials,catalog).analysis;
 state.players[0].field[2]=live(397,{role:'weaver',level:5});
 const powered=rules.fusionOptions(state,0,materials,catalog).analysis;
 assert.equal(plain.essenceRolls,0);
 assert.equal(powered.essenceRolls,2);
 assert.equal(powered.rolls,Math.min(7,plain.rolls+2));
 const fused=move(state,0,{type:'fusion',materials,slot:0,templateId:41});
 assert.equal(fused.players[0].field[0].qualityRolls,powered.rolls);
 assert.equal(fused.players[0].field[0].rollTrace.length,powered.rolls);
 assert.equal(fused.players[0].field[2].id,397);
});
test('Essence Aschenhort redirects the first attack of each enemy turn at half strength',()=>{
 let state=withEssence(398,'defense');state.round=2;
 state.players[0].field[0]=live(398,{mode:'def',def:1200,maxDef:1200});
 state.players[2].field[0]=live(7,{mode:'def',def:700,maxDef:700});
 state.players[1].field[0]=live(9,{atk:600});
 state.activeSeat=1;
 state=move(state,1,{type:'attack',slot:0,targetSeat:2,targetSlot:0});
 assert.equal(state.players[2].field[0].def,700);
 assert.ok(state.players[0].field[0].def<1200);
 assert.equal(state.teams[0].essenceTauntTurn,state.turn);
 const afterFirst=state.players[0].field[0].def;
 state.players[1].field[1]=live(9,{atk:600});
 state=move(state,1,{type:'attack',slot:1,targetSeat:2,targetSlot:0});
 assert.equal(state.players[0].field[0].def,afterFirst);
 assert.ok(state.players[2].field[0].def<700);
 state.activeSeat=3;state.turn++;
 state.players[3].field[0]=live(9,{atk:600});
 state=move(state,3,{type:'attack',slot:0,targetSeat:2,targetSlot:0});
 assert.ok(state.players[0].field[0].def<afterFirst,
  'The second enemy seat starts a new turn with its own first-attack taunt');
});
test('Defense essence saves one allied defender as a chapter-limited Last Bastion',()=>{
 let state=withEssence(398,'defense');state.round=2;
 state.players[0].field[0]=live(7,{mode:'def',def:50,maxDef:50});
 state.players[1].field[0]=live(9,{atk:1000});state.activeSeat=1;
 state=move(state,1,{type:'attack',slot:0,targetSeat:0,targetSlot:0});
 assert.equal(state.players[0].field[0].def,1);
 assert.equal(state.players[0].field[0].guardLeft,2);
 assert.equal(state.teams[0].essenceBastionUsed,true);
 const lp=state.teams[1].lp;
 state.players[1].field[1]=live(9,{atk:1000});
 state=move(state,1,{type:'attack',slot:1,targetSeat:0,targetSlot:0});
 assert.equal(state.players[0].field[0].def,1);
 assert.equal(state.teams[1].lp,lp,'Immune defender no longer counters');
 state=move(state,1,{type:'end'});
 assert.equal(state.players[0].field[0].guardLeft,2);
 state.activeSeat=3;state.turn++;
 state=move(state,3,{type:'end'});
 assert.equal(state.players[0].field[0].guardLeft,1);
 state.players[0].field[1]=live(7,{mode:'def',def:1});
 state.players[1].field[2]=live(9,{atk:1000});state.activeSeat=1;state.turn++;
 state=move(state,1,{type:'attack',slot:2,targetSeat:0,targetSlot:1});
 assert.equal(state.players[0].field[1],null,
  'Second allied defender cannot claim an already-used chapter safeguard');
 state.status='finished';state.winner=0;state.activeSeat=0;
 state=move(state,0,{type:'nextChapter'});
 assert.equal(state.status,'inviting_next');
 state=move(state,2,{type:'acceptNextChapter'});
 assert.equal(state.teams[0].essenceBastionUsed,false);
 assert.equal(state.teams[0].essenceTauntTurn,-1);
});
test('Defense essence increases stored Soul conversion without overriding fusion conversion',()=>{
 const baseline=setup(),buffed=withEssence(398,'defense',8,4);
 for(const state of [baseline,buffed]){
  state.players[0].field[0]=live(387,{role:'soul',mode:'def'});
  state.players[1].field[0]=live(9,{atk:1000,def:1000});
 }
 const action={type:'soulRaid',slot:0,targetSeat:1,targetSlot:0};
 const plain=move(baseline,0,action),boosted=move(buffed,0,action);
 assert.ok(boosted.players[0].field[0].soul>plain.players[0].field[0].soul);
 assert.equal(boosted.players[0].field[0].soul,
  Math.floor(plain.players[0].field[0].soul*1.22));
});
test('Defense specialization reduces only defensive creature decay and old rooms remain playable',()=>{
 let state=withEssence(398,'defense',10,5);
 state.players[0].field[0]=live(700,{mode:'def',atk:500,def:500,maxDef:500});
 state.players[0].field[1]=live(9,{mode:'atk',atk:500,def:500,maxDef:500});
 state=move(state,0,{type:'end'});
 assert.equal(state.players[0].field[0].atk,451);
 assert.equal(state.players[0].field[0].def,451);
 assert.equal(state.players[0].field[1].atk,475);
 let old=setup();for(const p of old.players)delete p.essence;
 old=move(old,0,{type:'summon',handIndex:0,slot:0});
 assert.ok(old.players[0].field[0]);
});
const lv1Fusions=[...fusions,711,712,713];
const withResearch=(rank=3)=>{
 const g=rules.create({roomId:'lv1-room-123456',hostName:'Forscher',hostDeck:deck,
  hostFusions:lv1Fusions,enemyDeckA:deck,enemyDeckB:deck,
  enemyFusionsA:fusions,enemyFusionsB:fusions,catalog,
  hostLv1:{perk:true,rank}});
 return move(g,2,{type:'join',name:'Partner',deck,fusions});
};
test('Lv1 research rank is validated and ordinary Lv1 creatures receive only the researched bonus',()=>{
 assert.throws(()=>rules.normalizedBuild({}, {},deck,fusions,catalog,{},
  {perk:false,rank:1}),/Verbotene Forschung/);
 for(const rank of [-1,0,6,1.5])assert.throws(()=>rules.normalizedBuild({}, {},
  deck,fusions,catalog,{},{perk:true,rank}),/Verbotene Forschung/);
 const state=withResearch(5);
 state.players[0].hand=[0,714];
 const normal=move(state,0,{type:'summon',handIndex:0,slot:0}).players[0].field[0];
 let baseline=setup();baseline.players[0].hand=[0];
 const unresearched=move(baseline,0,{type:'summon',handIndex:0,slot:0}).players[0].field[0];
 assert.equal(normal.atk,unresearched.atk+25);
 assert.equal(normal.def,unresearched.def+25);
 assert.equal(state.players[0].lv1.rank,5);
 const ace=move({...state,players:state.players.map((p,i)=>i===0?{...p,
  hand:[714]}:p)},0,{type:'summon',handIndex:0,slot:0}).players[0].field[0];
 assert.equal(ace.atk,111,
  'Lumira gets no ordinary Lv1 research stat bonus');
 let legacy=setup();for(const p of legacy.players)delete p.lv1;
 legacy=move(legacy,0,{type:'summon',handIndex:0,slot:0});
 assert.ok(legacy.players[0].field[0], 'previous rooms still accept summons');
});
test('exclusive Level-1 fusion needs the quest perk and exactly three to five real Lv1 materials',()=>{
 const material3=[0,1,2].map(index=>({from:'hand',index}));
 const noUnlock=setup();noUnlock.players[0].hand=[0,1,4,4,4];
 noUnlock.players[0].remainingFusion=[711,712,713];
 assert.equal(rules.fusionOptions(noUnlock,0,material3,catalog).templates.length,0);
 assert.throws(()=>move(noUnlock,0,{type:'fusion',materials:material3,
  slot:0,templateId:711}),/nicht verfügbar/);
 let state=withResearch();state.players[0].hand=[0,1,4,4,4];
 const materials2=material3.slice(0,2);
 assert.equal(rules.fusionOptions(state,0,materials2,catalog).templates.includes(711),false);
 const available=rules.fusionOptions(state,0,material3,catalog).templates;
 assert.deepEqual([711,712,713].every(id=>available.includes(id)),true);
 const three=rules.fusionPreview(state,0,material3,catalog,{templateId:711});
 assert.equal(three.resultingLevel,1);
 assert.equal(three.analysis.specialLv1,true);
 assert.ok(three.analysis.rolls>=3);
 assert.ok(three.analysis.quality>rules.fusionOptions(state,0,material3,catalog).analysis.quality);
 const five=rules.fusionOptions(state,0,[0,1,2,3,4].map(index=>({from:'hand',index})),catalog);
 assert.ok(five.templates.includes(712));
 state=move(state,0,{type:'fusion',materials:material3,slot:0,templateId:711});
 const hive=state.players[0].field[0];
 assert.equal(hive.level,1);assert.equal(hive.fusion,true);
 assert.equal(hive.rollTrace.length,three.analysis.rolls);
 assert.equal(hive.def,hive.rollMath.winner.def+hive.materialBonus.def+100);
 assert.equal(hive.lv1Full.def,hive.def);
 assert.ok(!state.players[0].remainingFusion.includes(711));
 let mixed=withResearch();mixed.players[0].hand=[0,7,4];
 assert.equal(rules.fusionOptions(mixed,0,material3,catalog).templates.includes(711),false);
});
test('Nekroth opens five ghost zones over own turns; station/return consume monster actions',()=>{
 let state=withResearch();state.players[0].field[0]=live(711,{fusion:true,level:1});
 for(let n=0;n<5;n++){
  state.activeSeat=3;state=move(state,3,{type:'end'});
  assert.equal(state.players[0].lv1.ghostSlots.length,n+1);
 }
 state.players[0].field[1]=live(4);
 state=move(state,0,{type:'lv1Station',slot:1,ghostSlot:0});
 assert.equal(state.players[0].field[1],null);
 assert.equal(state.players[0].lv1.ghostSlots[0].id,4);
 assert.throws(()=>move(state,0,{type:'lv1Return',ghostSlot:0,slot:1}),/nicht möglich/);
 state.activeSeat=3;state=move(state,3,{type:'end'});
 state=move(state,0,{type:'lv1Return',ghostSlot:0,slot:1});
 assert.equal(state.players[0].field[1].id,4);
 assert.equal(state.players[0].lv1.ghostSlots[0],null);
 assert.equal(state.players[0].field[1].used,true);
 assert.equal(state.players[0].lv1.ghostSlots.length,5);
});
test('ghost cards block direct attacks, can be attacked or used for fusion material',()=>{
 let state=withResearch();state.round=2;
 state.players[0].lv1.ghostSlots=[live(4,{mode:'def',def:500,maxDef:500})];
 state.players[1].field[0]=live(9,{atk:250});state.activeSeat=1;
 assert.throws(()=>move(state,1,{type:'attack',slot:0,targetSeat:null,targetSlot:null}),
  /Direkter Angriff.*blockiert/);
 state=move(state,1,{type:'attack',slot:0,targetSeat:0,targetSlot:0,targetArea:'ghost'});
 assert.ok(state.players[0].lv1.ghostSlots[0].def<500);
 state.activeSeat=0;state.players[0].hand=[0,1];
 const materials=[{from:'ghost',index:0},{from:'hand',index:0},{from:'hand',index:1}];
 assert.ok(rules.fusionOptions(state,0,materials,catalog).templates.includes(712));
 state=move(state,0,{type:'fusion',materials,slot:0,templateId:712});
 assert.equal(state.players[0].lv1.ghostSlots[0],null);
 assert.equal(state.players[0].field[0].level,1);
});
test('Nekroth sacrifices an occupied ghost zone to resurrect its saved fused values',()=>{
 let state=withResearch();state.round=2;state.activeSeat=1;
 state.players[0].field[0]=live(711,{fusion:true,level:1,mode:'def',
  atk:150,def:20,maxDef:150,lv1Full:{atk:150,def:150}});
 state.players[0].lv1.ghostSlots=[live(4,{mode:'def'})];
 state.players[1].field[0]=live(9,{atk:500});
 state=move(state,1,{type:'attack',slot:0,targetSeat:0,targetSlot:0});
 assert.equal(state.players[0].field[0].def,150);
 assert.equal(state.players[0].field[0].atk,150);
 assert.equal(state.players[0].lv1.ghostSlots[0],null);
 assert.ok(state.log.some(line=>line.includes('wiedergeboren')));
});
test('Aegurion redirects attacks across partner boards and uses DEF for survival even in ATK',()=>{
 let state=withResearch();state.round=2;state.activeSeat=1;
 state.players[0].field[0]=live(712,{fusion:true,level:1,mode:'atk',
  atk:50,def:500,maxDef:500});
 state.players[2].field[0]=live(4,{mode:'def',def:500,maxDef:500});
 state.players[1].field[0]=live(9,{atk:300});
 state=move(state,1,{type:'attack',slot:0,targetSeat:2,targetSlot:0});
 assert.equal(state.players[2].field[0].def,500);
 assert.equal(state.players[0].field[0].def,194);
 assert.ok(state.log.some(x=>x.includes('Aegurion')));
 state.activeSeat=3;state=move(state,3,{type:'end'});
 assert.ok(state.players[0].field[0].def>194,'protection regenerates lost DEF');
});
test('Nyxar grants two attacks and an echo offer, paying symmetric 3% fatigue per attack',()=>{
 let state=withResearch();state.round=2;
 state.players[0].field[0]=live(713,{fusion:true,level:1,atk:300,def:300});
 state.players[0].field[1]=live(4);
 state=move(state,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null});
 assert.equal(state.players[0].field[0].used,false);
 assert.equal(state.players[0].field[0].lv1Attacks,1);
 assert.equal(state.players[0].field[0].atk,291);
 assert.equal(state.players[0].field[0].def,291);
 assert.ok(state.players[0].lv1.offers.includes(4));
 state=move(state,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null});
 assert.equal(state.players[0].field[0].used,true);
 assert.equal(state.players[0].field[0].atk,282);
 assert.equal(state.players[0].field[0].def,282);
 state=move(state,0,{type:'lv1UseOffer',index:0,slot:2});
 assert.equal(state.players[0].field[2].lv1Effectless,true);
 assert.equal(state.players[0].field[2].id,4);
 assert.throws(()=>move(state,0,{type:'lv1UseOffer',index:100,slot:3}),
  /Kein Schwarm-Echo/);
});
test('Floating after genuine Level-1 death gives a bounded free echo or a real deck card',()=>{
 let state=withResearch();state.round=2;
 state.players[0].field[0]=live(4,{mode:'atk',atk:50});
 state.players[1].field[0]=live(9,{atk:400});state.activeSeat=1;
 state=move(state,1,{type:'attack',slot:0,targetSeat:0,targetSlot:0});
 assert.equal(state.players[0].field[0],null);
 assert.deepEqual(state.players[0].lv1.choices,[4]);
 state.activeSeat=0;
 state=move(state,0,{type:'lv1Floating',index:0,kind:'echo',slot:0});
 assert.equal(state.players[0].field[0].lv1Echo,true);
 assert.equal(state.players[0].lv1.choices.length,0);
 let fromDeck=withResearch();fromDeck.players[0].lv1.choices=[4];
 const oldCount=fromDeck.players[0].deck.length;
 fromDeck=move(fromDeck,0,{type:'lv1Floating',index:0,kind:'deck',slot:0});
 assert.equal(fromDeck.players[0].deck.length,oldCount-1);
 assert.equal(fromDeck.players[0].field[0].lv1Echo,false);
});
test('Lumira survives one lethal DEF attack and heals team on own turn',()=>{
 let state=withResearch();state.round=2;state.activeSeat=1;
 state.players[0].field[0]=live(714,{atk:200,def:100,maxDef:200,mode:'def'});
 state.players[1].field[0]=live(9,{atk:500});
 state=move(state,1,{type:'attack',slot:0,targetSeat:0,targetSlot:0});
 assert.equal(state.players[0].field[0].def,1);
 assert.equal(state.players[0].field[0].lv1AceSaved,true);
 state.teams[0].lp=INITIAL_LP-100;state.activeSeat=3;
 state=move(state,3,{type:'end'});
 assert.equal(state.teams[0].lp,INITIAL_LP-40);
 assert.ok(state.players[0].field[0].def>1);
});
test('ghosts and queued Lv1 effects reset between campaign chapters',()=>{
 let state=withResearch();state.players[0].lv1={perk:true,rank:3,
  ghostSlots:[live(4)],charges:3,choices:[4],offers:[4],floatUsed:3,swarmUsed:5};
 state.status='finished';state.winner=0;
 state=move(state,0,{type:'nextChapter'});
 assert.equal(state.status,'inviting_next');
 state=move(state,2,{type:'acceptNextChapter'});
 assert.equal(state.players[0].lv1.perk,true);
 assert.deepEqual(state.players[0].lv1.ghostSlots,[]);
 assert.deepEqual(state.players[0].lv1.choices,[]);
 assert.equal(state.players[0].lv1.charges,0);
});

test('both human players can fuse allied field monsters without consuming the wrong inventory',()=>{
 for(const seat of [0,2]){
  let state=setup(),allySeat=seat===0?2:0;
  const id=deck.find(id=>catalog[id].level===1);
  const allyCard=live(id,{uid:934+seat,level:1});
  state.players[allySeat].field[1]=allyCard;
  const handIndex=state.players[seat].hand.findIndex(id=>catalog[id].level===1);
  assert.ok(handIndex>=0,'Level-1 hand material required');
  state.activeSeat=seat;state.players[seat].summoned=false;
  const materials=[{from:'hand',index:handIndex},{from:'allyField',index:1}];
  const available=rules.fusionOptions(state,seat,materials,catalog);
  assert.ok(available.templates.length,JSON.stringify({seat,available}));
  const templateId=available.templates[0];
  const previousOwnGrave=state.players[seat].graveyard.length;
  const previousAllyGrave=state.players[allySeat].graveyard.length;
  state=move(state,seat,{type:'fusion',materials,slot:0,templateId});
  assert.equal(state.players[seat].field[0].id,templateId);
  assert.equal(state.players[seat].graveyard.length,previousOwnGrave+1);
  assert.equal(state.players[allySeat].field[1],null);
  assert.equal(state.players[allySeat].graveyard.length,previousAllyGrave+1);
  assert.equal(state.players[seat].remainingFusion.includes(templateId),
   fusions.filter(id=>id===templateId).length>1);
 }
});
test('enemy seats cannot use opposing human fields as allied fusion materials',()=>{
 const state=setup();
 const id=deck.find(card=>catalog[card].level===1);
 state.players[0].field[0]=live(id,{uid:955,level:1});
 state.players[3].field[0]=null;
 const original=JSON.stringify(state);
 assert.throws(()=>rules.fusionOptions(state,1,[{from:'hand',index:0},{from:'allyField',index:0}],catalog),
  /Fusionsmaterial ist nicht vorhanden/);
 assert.equal(JSON.stringify(state),original);
});
test('next chapter invitation may be rejected and reissued without changing decks',()=>{
 let state=setup();state.status='finished';state.winner=0;
 state=move(state,0,{type:'nextChapter'});
 assert.equal(state.status,'inviting_next');
 assert.equal(state.chapterInvite.from,'Hannes');
 assert.throws(()=>move(state,0,{type:'declineNextChapter'}),/Einladung/);
 state=move(state,2,{type:'declineNextChapter'});
 assert.equal(state.status,'finished');
 assert.equal(state.chapter,1);
 state=move(state,0,{type:'nextChapter'});
 assert.equal(state.status,'inviting_next');
 state=move(state,2,{type:'acceptNextChapter'});
 assert.equal(state.status,'active');
 assert.equal(state.chapter,2);
});

test('partner may invite host to the next chapter and host can accept or decline',()=>{
 let state=setup();state.status='finished';state.winner=0;
 state=move(state,2,{type:'nextChapter'});
 assert.equal(state.chapterInvite.from,'Partner');
 assert.equal(state.chapterInvite.fromSeat,2);
 assert.equal(state.chapterInvite.toSeat,0);
 assert.throws(()=>move(state,2,{type:'acceptNextChapter'}),/Einladung/);
 state=move(state,0,{type:'declineNextChapter'});
 assert.equal(state.status,'finished');
 state=move(state,2,{type:'nextChapter'});
 state=move(state,0,{type:'acceptNextChapter'});
 assert.equal(state.chapter,2);
 assert.equal(state.status,'active');
});
