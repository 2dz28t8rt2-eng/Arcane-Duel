'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const make=()=>boot({seed:9109});
test('fresh and historical saved profiles gain validated seal balance and three perks',()=>{
 const b=make();
 const p=b.run('({seals:profile.boosterSeals,valid:!!validateProfile(JSON.parse(JSON.stringify(profile))),ranks:["grosswildjaeger","kolossenkraft","schwarminstinkt"].map(k=>profile.upgrades[k])})');
 assert.equal(p.seals,0);assert(p.valid);assert.deepEqual(p.ranks,[0,0,0]);
 const m=b.run('(()=>{const raw=JSON.parse(JSON.stringify(profile));delete raw.boosterSeals;delete raw.discoveredCards;for(const k of ["grosswildjaeger","kolossenkraft","schwarminstinkt"])delete raw.upgrades[k];const next=validateProfile(raw);return [next.boosterSeals,next.upgrades.grosswildjaeger,next.discoveredCards.length]})()');
 assert.equal(m[0],0);assert.equal(m[1],0);assert(m[2]>0);
 assert(b.run('(()=>{const raw=JSON.parse(JSON.stringify(profile));raw.boosterSeals=-1;try{validateProfile(raw);return false}catch(e){return true}})()'));
});
test('mixed packs roll the precise fusion count 1, 1-2, 2-3, and 3-5',()=>{
 const b=make();
 const rows=b.run('(()=>{profile.cleared=[1,2,3,4,5,6,7];const out=[];for(const n of [1,3,5,10])for(let i=0;i<60;i++){const cards=window.ArcaneFusionPackV109.rollFusionPack(n,highestCleared(),{seed:1777+n*301+i*311});if(!cards)throw Error("No pack");out.push({n,total:cards.length,fusions:cards.filter(id=>CARDS[id].fusionOnly).length,legal:cards.every(id=>!CARDS[id].ace&&!CARDS[id].milestoneOnly&&!CARDS[id].questOnly&&(CARDS[id].source<0||CARDS[id].source<=7))});}return out})()');
 const bounds={1:[1,1],3:[1,2],5:[2,3],10:[3,5]};
 for(const r of rows){assert.equal(r.total,r.n);assert(r.fusions>=bounds[r.n][0]&&r.fusions<=bounds[r.n][1]);assert(r.legal);}
});
test('mixed pack consumes seals, adds exactly ten copies, saves and blocks insufficient funds',()=>{
 const b=make(),v=b.run('(()=>{profile.cleared=[1,2,3,4,5];profile.boosterSeals=90;const before=Object.values(profile.inventory).reduce((a,n)=>a+n,0),success=window.ArcaneFusionPackV109.buyFusionPack(10),cards=[...profile.lastBooster.cards],after=Object.values(profile.inventory).reduce((a,n)=>a+n,0),saved=!!validateProfile(JSON.parse(JSON.stringify(profile))),seals=profile.boosterSeals;profile.boosterSeals=0;const blocked=!window.ArcaneFusionPackV109.buyFusionPack(10);return {success,delta:after-before,cards,seals,saved,blocked}})()');
 assert(v.success);assert.equal(v.delta,10);assert.equal(v.cards.length,10);assert.equal(v.seals,62);assert(v.saved);assert(v.blocked);
});
test('normal booster uses seals; winning one genuine pve match grants seals and small shards once',()=>{
 const b=make();
 const v=b.run('(()=>{profile.boosterSeals=100;profile.coins=5000;const before=Object.values(profile.inventory).reduce((a,n)=>a+n,0),buy=buyBooster(5),after=Object.values(profile.inventory).reduce((a,n)=>a+n,0),sealAfter=profile.boosterSeals,coinAfter=profile.coins;const g=createGame({id:newMatchId(),mode:"pve",context:"free",opponentId:1,seed:6713,deck:[...profile.activeDeck],fusionDeck:[...profile.fusionDeck],enhancements:profile.enhancements});const shardBefore=profile.shards[1];g.winner=0;const reward=rewardMatch(g),duplicate=rewardMatch(g);return {buy,gained:after-before,sealAfter,coinAfter,shards:profile.shards[1]-shardBefore,awarded:reward?.boosterSeals,duplicate:duplicate===null}})()');
 assert(v.buy);assert.equal(v.gained,5);assert.equal(v.sealAfter,92);assert.equal(v.coinAfter,5000);assert(v.shards>=1);assert(v.awarded>=2);assert(v.duplicate);
});
test('kolossenkraft only buffs high-level nonfusion player monster',()=>{
 const b=make();const v=b.run('(()=>{const high=CARDS.find(c=>c.rpg&&!c.fusionOnly&&!c.ace&&c.level===7),low=CARDS.find(c=>c.rpg&&!c.fusionOnly&&!c.ace&&c.level<=5),fusion=CARDS.find(c=>c.rpg&&c.fusionOnly&&c.level===7);const before=[normalRoleBonus(high,"atk",0),normalRoleBonus(low,"atk",0),normalRoleBonus(fusion,"atk",0)];profile.upgrades.kolossenkraft=2;return [normalRoleBonus(high,"atk",0)-before[0],normalRoleBonus(low,"atk",0)-before[1],normalRoleBonus(fusion,"atk",0)-before[2]]})()');
 assert.deepEqual(v,[32,0,0]);
});
test('wild hunter high-tier loot never leaves eligible genuine source pool',()=>{
 const b=make();const n=b.run('(()=>{profile.cleared=[1,2,3,4,5,6,7,8];profile.upgrades.grosswildjaeger=3;const seen=new Set();for(let i=0;i<400;i++){const c=drawLoot({seed:i*1123+1,context:"free"},5,"easy");if(!lootPool(5,"easy").includes(c)||CARDS[c].ace)throw Error("out of original loot pool");seen.add(c)}return seen.size})()');assert(n>1);
});
