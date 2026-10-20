'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const execute=(source,seed=116210)=>boot({seed}).run(source);
test('level-based creature decay is identical for player/NPC, stronger rank lasts fewer turns',()=>{
 const r=execute("(()=>{profile=freshProfile();const g=createGame({mode:'pve',opponentId:7,seed:1});const l3={id:RPG_BASE_CARDS.find(c=>c.level===3&&!c.retired).id,card:{level:3,atk:600,def:600}};const l10={id:RPG_BASE_CARDS.find(c=>c.level===10&&!c.retired).id,card:{level:10,atk:2700,def:2700}};const basic=[creatureDecayRate(g,l3,0),creatureDecayRate(g,l10,0),creatureDecayRate(g,l10,1)];profile.upgrades.resilience=2;return {basic,perk:creatureDecayRate(g,l10,0),npc:creatureDecayRate(g,l10,1)};})()");
 assert.deepEqual(r.basic,[30,170,170]);assert.equal(r.perk,136);assert.equal(r.npc,170);
});
test('two true Resonators earn exactly +1 rank ONCE in chain, not every recombination',()=>{
 const r=execute("(()=>{const f=window.ArcaneFusionRework113,g=createGame({mode:'pve',opponentId:6,seed:116});const a={id:55,uid:901,fusion:true,roleOverride:'resonator',card:{level:6}},b={id:56,uid:902,fusion:true,roleOverride:'resonator',card:{level:5}};const first=f.calculate([6,5],g,[a,b]);a.fusionResonatorLineage={count:2,used:true};const repeat=f.calculate([6,5],g,[a,b]);return {bonus:first.resonatorBonus,repeat:repeat.resonatorBonus,firstLevel:first.level,repeatLevel:repeat.level,used:repeat.resonatorLineage.used};})()");
 assert.equal(r.bonus,1);assert.equal(r.repeat,0);assert.equal(r.used,true);
 assert.equal(r.firstLevel-r.repeatLevel,1);
});
test('opponent VII has guardian archetype, exactly three Lv10 fusions including its unique ACE',()=>{
 const r=execute("(()=>{const o=RPG_OPPONENTS[7],p=rpgEnemyLoadout(7,'easy');const ace=ACE_CARD_IDS[7];const dec=p.fusionDeck.map(id=>({id,level:CARDS[id].level,ace:id===ace}));return {style:o.aiArchetype,policy:o.policy,main:p.deck.length,templates:dec,aceLevel:CARDS[ace].level,normalTags:p.deck.filter(id=>['guardian','soul'].includes(CARDS[id].role)).length};})()");
 assert.equal(r.style,'defense');assert.equal(r.policy,'guardian');
 assert.equal(r.main,40);assert.equal(r.aceLevel,10);
 assert.equal(r.templates.filter(x=>x.level===10).length,3,JSON.stringify(r));
 assert.equal(r.templates.filter(x=>x.level===10&&!x.ace).length,2);
 assert.equal(r.templates.filter(x=>x.level===10&&x.ace).length,1);
 assert.ok(r.normalTags>=5,JSON.stringify(r));
});
test('ascending forge is tier V gated, Lv10 unlocks only after VI, and all results are legal real catalogue cards',()=>{
 const r=execute("(()=>{profile=freshProfile();const f=window.ArcaneAscensionForge116;const start=f.cap();profile.cleared=[1,2,3,4,5];const afterV=f.cap();const ninth={normal:f.outputPool(9,false).length,fusion:f.outputPool(9,true).length};const tenthBefore=f.outputPool(10,true).length;profile.cleared.push(6);return {start,afterV,afterVI:f.cap(),ninth,tenthBefore,tenNormal:f.outputPool(10,false).length,tenFusion:f.outputPool(10,true).length};})()");
 assert.equal(r.start,0);assert.equal(r.afterV,9);assert.equal(r.afterVI,10);
 assert.ok(r.ninth.normal>0,JSON.stringify(r));
 assert.ok(r.tenNormal>0&&r.tenFusion>0,JSON.stringify(r));
});
test('three cards consumed, correct Lv10, coin fee and pity guarantee, no equipped cards spent',()=>{
 const r=execute("(()=>{profile=freshProfile();profile.cleared=[1,2,3,4,5,6];const f=window.ArcaneAscensionForge116;profile.coins=100000;const c=CARDS.find(x=>x.rpg&&x.level===9&&!x.fusionOnly&&!x.ace&&!x.enemyOnly&&!x.retired&&!x.essenceMonster&&!x.questOnly&&!x.trainingReward&&!x.hard);if(!c)throw Error('No usable Lv9');for(let i=0;i<8;i++)addCard(c.id);const before=profile.inventory[c.id];const cost=f.price(10);profile.ascensionPity[10]=2;const item=f.forge(9,[c.id,c.id,c.id]);return {item,spent:before-profile.inventory[c.id],coins:100000-profile.coins,cost,newCopy:profile.inventory[item.id]||0,pity:profile.ascensionPity[10],validated:validateProfile(JSON.parse(JSON.stringify(profile))).ascensionPity[10],level:CARDS[item.id]?.level};})()");
 assert.equal(r.item.ok,true,JSON.stringify(r));assert.equal(r.item.fusion,true,JSON.stringify(r));
 assert.equal(r.spent,3);assert.equal(r.coins,r.cost);assert.equal(r.pity,0);assert.equal(r.validated,0);assert.equal(r.level,10);
});
test('forbidden/owned deck cards, mismatched levels and prematurely unlocked Level 10 never spend resources',()=>{
 const r=execute("(()=>{profile=freshProfile();profile.cleared=[1,2,3,4,5];profile.coins=5000;const f=window.ArcaneAscensionForge116,c=CARDS.find(x=>x.rpg&&x.level===9&&!x.fusionOnly&&!x.ace&&!x.enemyOnly&&!x.retired&&!x.hard);for(let i=0;i<8;i++)addCard(c.id);const before=profile.coins;const denied=f.forge(9,[c.id,c.id,c.id]);profile.cleared.push(6);profile.favorites.push(c.id);const forbidden=f.forge(9,[c.id,c.id,c.id]);return {denied:denied.ok,forbidden:forbidden.ok,before,after:profile.coins};})()");
 assert.equal(r.denied,false);assert.equal(r.forbidden,false);assert.equal(r.before,r.after);
});
test('forge rank and pity survive save/validate cycle; crafted cards cannot be forged from non-existent copies',()=>{
 const r=execute("(()=>{profile=freshProfile();profile.cleared=[1,2,3,4,5,6];profile.upgrades.schmiedekunst=3;profile.ascensionPity[10]=2;profile.ascensionIntroSeen=true;const before=window.ArcaneAscensionForge116.price(10);const tested=validateProfile(JSON.parse(JSON.stringify(profile)));return {rank:tested.upgrades.schmiedekunst,pity:tested.ascensionPity[10],seen:tested.ascensionIntroSeen,price:before,illegal:window.ArcaneAscensionForge116.forge(9,[99999,99999,99999]).ok};})()");
 assert.deepEqual({rank:r.rank,pity:r.pity,seen:r.seen},{rank:3,pity:2,seen:true});
 assert.equal(r.illegal,false);assert.ok(r.price<310);
});

test('actual PvE two-resonator fusion grants exactly one template level and saves lineage',()=>{
 const r=execute("(()=>{profile=freshProfile();profile.trainingWins=3;const g=createGame({mode:'pve',opponentId:6,seed:1616});game=g;g.active=0;g.turn=3;const t6=RPG_FUSIONS.find(c=>c.level===6&&!c.retired),t5=RPG_FUSIONS.find(c=>c.level===5&&!c.retired),t9=RPG_FUSIONS.find(c=>c.level===9&&!c.retired);if(!t6||!t5||!t9)throw Error('Catalog shortage');const a=newInstance(g,t6.id,0),b=newInstance(g,t5.id,0);a.fusion=true;b.fusion=true;a.roleOverride='resonator';b.roleOverride='resonator';g.players[0].fusionDeck=[t9.id,t9.id];g.players[0].remainingFusion=[t9.id,t9.id];g.fusionChoice=t9.id;const budget=fusionBudget([6,5],g,[a,b]);const chosen=fusedInstance(g,[a,b],[6,5]);delete g.fusionChoice;g.players[0].field[0]=chosen;const snap=validateDuelSnapshot(JSON.parse(JSON.stringify(g)));return {budget,created:!!chosen,level:chosen?dataOf(chosen).level:0,lineage:chosen?.fusionResonatorLineage,saved:snap.players[0].field[0].fusionResonatorLineage,remain:g.players[0].remainingFusion.length};})()");
 assert.equal(r.budget,9,JSON.stringify(r));assert.equal(r.created,true,JSON.stringify(r));assert.equal(r.level,9);
 assert.deepEqual(r.lineage,{count:2,used:true});assert.deepEqual(r.saved,r.lineage);assert.equal(r.remain,1);
});
test('the forge always requires available individual copies, including repeated same-card recipes',()=>{
 const r=execute("(()=>{profile=freshProfile();profile.cleared=[1,2,3,4,5,6];profile.coins=2000;const forge=window.ArcaneAscensionForge116;const c=CARDS.find(x=>x.level===9&&x.rpg&&!x.fusionOnly&&!x.ace&&!x.enemyOnly&&!x.retired&&!x.essenceMonster);addCard(c.id);return {free:freeCopies(c.id),recipe:forge.safeRecipe([c.id,c.id,c.id],9),blocked:forge.forge(9,[c.id,c.id,c.id]).ok,coins:profile.coins};})()");
 assert.equal(r.recipe,false);assert.equal(r.blocked,false);assert.equal(r.coins,2000);
});
