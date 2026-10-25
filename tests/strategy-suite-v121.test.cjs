'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname);
const js=fs.readFileSync(path.join(root,'../assets/strategy-suite-v121.js'),'utf8');
const css=fs.readFileSync(path.join(root,'../assets/strategy-suite-v121.css'),'utf8');
const html=fs.readFileSync(path.join(root,'../index.html'),'utf8');

test('the strategy suite loads after the original v120 and v119 interfaces',()=>{
 assert.ok(html.indexOf('strategy-suite-v121.js')>html.indexOf('strategy-experience-v120.js'));
 assert.ok(html.includes('strategy-suite-v121.css'));
});
test('challenge categories only rearrange existing bound cards, never create rewards or battles',()=>{
 const block=js.slice(js.indexOf('function organizeChallenges()'),js.indexOf('const allVisibleCards='));
 assert.match(block,/CHALLENGES\.forEach/);
 assert.match(block,/container\.appendChild\(card\)/);
 assert.match(block,/grid\.replaceWith\(shell\)/);
 assert.doesNotMatch(block,/rewardMatch\(|saveProfile\(|CHALLENGES\.push\(|startDuel\(/);
 assert.match(js,/evo-defense-/);
 assert.match(js,/evo-fusion-/);
 assert.match(js,/evo-burst-/);
});
test('living bestiary guards hidden quest art and never changes levels or ownership',()=>{
 const block=js.slice(js.indexOf('const allVisibleCards='),js.indexOf('function deckRoleDescription('));
 assert.match(block,/!c\.questOnly\|\|seenCard\(c\)/);
 assert.match(block,/!c\.lv1Exclusive\|\|seenCard\(c\)/);
 assert.match(block,/first\?\.name\|\|'Unentdeckte Monsterfamilie'/);
 assert.match(block,/hidden\.map\(c=>'<div class="ad121-hidden-card"/);
 assert.doesNotMatch(block,/saveProfile\(|addCard\(|card\.level\s*=/);
});
test('extended lab has 5, 30, 50 match modes, paired seeds and no persisted rewards',()=>{
 const block=js.slice(js.indexOf('async function runAdvancedLab()'),js.indexOf('function extendMenu()'));
 assert.match(block,/\[5,30,50\]\.includes\(count\)/);
 assert.match(block,/seed=210012\+foe\*97\+sample\*1013/);
 assert.match(block,/createGame\(/);
 assert.match(block,/simulateGame\(/);
 assert.match(block,/stats\.damage\+=g\.damageDealt\[0\]/);
 assert.match(block,/stats\.fusionMatches/);
 assert.doesNotMatch(block,/rewardMatch\(|saveProfile\(|consumeEnergy\(|newMatchId\(/);
});
test('suite is accessible and resilient to low-motion preference',()=>{
 assert.match(js,/aria-pressed/);
 assert.match(js,/role="progressbar"/);
 assert.match(js,/aria-live="polite"/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
