'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {boot}=require('./helpers/game-runtime.cjs');
test('deck preview ATK and DEF match untouched first-turn monster stats for all ordinary base cards',()=>{
 const b=boot({seed:626});
 const r=b.run("(()=>{profile.upgrades.power=5;profile.upgrades.starter=2;profile.upgrades.jagdinstinkt=3;profile.upgrades.schildwall=2;profile.enhancements={};const base=RPG_BASE_CARDS.filter(x=>x.rpg&&!x.fusionOnly&&!x.ace&&x.level<=10).slice(0,80);for(const c of base)profile.enhancements[c.id]=c.id%5;const g=createGame({mode:'pve',opponentId:4,context:'free',deck:profile.activeDeck,fusionDeck:profile.fusionDeck,enhancements:profile.enhancements,flatBonus:monsterTrainingBonus(profile.upgrades.power)});return base.map(c=>{const m=profileCard(c).card,n=newInstance(g,c.id,0).card;return {name:c.name,id:c.id,atk:m.atk-n.atk,def:m.def-n.def,shown:m,live:n}}).filter(x=>x.atk||x.def);})()");
 assert.deepEqual(r,[],JSON.stringify(r.slice(0,12)));
});
test('monster positioning is one action: no stance change after attack, including NPC fusion creatures',()=>{
 const b=boot({seed:517});
 const r=b.run("(()=>{const g=createGame({mode:'pve',opponentId:4,context:'free'}),c=g.players[1].hand[0];g.players[1].field[0]=c;g.players[1].hand.shift();g.active=1;c.attacked=true;c.switched=false;return {blocked:switchPosition(g,0)===false,mode:c.mode};})()");
 assert.deepEqual(r,{blocked:true,mode:'atk'});
});
test('active soul raid flushes its recorded siphon effect rather than leaving it pending',()=>{
 const s=fs.readFileSync(path.join(__dirname,'../assets/essence-combat.js'),'utf8');
 assert.match(s,/activeRaid:true/);assert.match(s,/ArcaneDefenderFX\?\.flush\?\.\(game\)/);
 const anim=fs.readFileSync(path.join(__dirname,'../assets/duel-cinematics-v42.js'),'utf8');
 assert.match(anim,/event\.activeRaid\?'#e155ff'/);
});
test('counterattack animation uses red hostile impact and explicit negative LP numbers',()=>{
 const s=fs.readFileSync(path.join(__dirname,'../assets/duel-cinematics-v42.js'),'utf8');
 assert.match(s,/event\.amount>0/);assert.match(s,/LP · GEGENSCHLAG/);assert.match(s,/#ff214c/);
 assert.match(s,/ad-counter-impact/);
});
test('reward art retains boxed ATK and DEF and hides only duplicate top-of-card level badges',()=>{
 const css=fs.readFileSync(path.join(__dirname,'../assets/quality-sprint-v50.css'),'utf8');
 assert.match(css,/\.pool-grid,\.pack-grid,\.arcane-reward-showcase/);
 assert.match(css,/\.card-level-badge\{display:none!important\}/);
 assert.match(css,/\.hand-stats\s*\{/);
 assert.match(css,/\.hand-stats \.stat/);
});
