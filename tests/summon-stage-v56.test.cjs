'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {boot}=require('./helpers/game-runtime.cjs');
const inspect=(code)=>boot({seed:5601}).run(code);
test('summon cockpit separates selection and materials without a redundant zones panel',()=>{
 const r=inspect("(()=>{profile=freshProfile();game=createGame({mode:'pve',opponentId:1});game.active=0;uiMode='duel';game.selection={type:'hand',uid:game.players[0].hand[0].uid};render();const html=$('summonStage').innerHTML;return {selection:html.includes('ad56-selection'),materials:html.includes('ad56-material'),placement:html.includes('ad56-placement'),zones:(html.match(/class=\"ad56-zone (?:frei|occupied)/g)||[]).length,card:html.includes('ad56-card-detail'),button:!$('summonBtn').disabled};})()");
 assert.equal(r.selection,true);assert.equal(r.materials,true);assert.equal(r.placement,false);assert.equal(r.zones,0);assert.equal(r.card,true);assert.equal(r.button,true);
});
test('material list displays exact saved UID and legal fusion counters',()=>{
 const r=inspect("(()=>{profile=freshProfile();game=createGame({mode:'pve',opponentId:1});game.active=0;uiMode='duel';game.materials=game.players[0].hand.slice(0,3).map(c=>c.uid);render();const html=$('summonStage').innerHTML;return {chips:(html.match(/data-ad56-remove/g)||[]).length,uid:html.includes('data-ad56-remove=\"'+game.materials[0]+'\"'),levels:html.includes('3 / 5 Materialien'),zones:(html.match(/class=\"ad56-zone (?:frei|occupied)/g)||[]).length};})()");
 assert.equal(r.chips,3);assert.equal(r.uid,true);assert.equal(r.levels,true);assert.equal(r.zones,0);
});
test('fusion preview never reveals generated stats before placement',()=>{
 const r=inspect("(()=>{profile=freshProfile();game=createGame({mode:'pve',opponentId:1});game.active=0;uiMode='duel';const p=game.players[0],one=p.hand[0];game.pending={kind:'fusion',card:{...one,fusion:true,card:{level:4,atk:8765,def:5678}},levels:[2,2]};render();const html=$('summonStage').innerHTML;return {hidden:!html.includes('8765')&&!html.includes('5678'),shown:html.includes('Fusionswerte werden nach der Platzierung'),placement:html.includes('Feldplatz wählen')};})()");
 assert.equal(r.hidden,true);assert.equal(r.shown,true);assert.equal(r.placement,true);
});

test('revealed fusion shows the authentic resulting card before choosing a field zone',()=>{
 const r=inspect("(()=>{profile=freshProfile();game=createGame({mode:'pve',opponentId:1});game.active=0;uiMode='duel';const c=game.players[0].hand[0];game.pending={kind:'fusion',revealed:true,card:{...c,fusion:true,card:{level:4,atk:8765,def:5678}},levels:[2,2]};render();const html=$('summonStage').innerHTML;return {preview:html.includes('arcane-fusion-ready-card'),result:html.includes('8765')&&html.includes('5678'),zone:html.includes('Feldplatz wählen')};})()");
 assert.equal(r.preview,true);assert.equal(r.result,true);assert.equal(r.zone,true);
});
test('CSS provides narrow viewport layout and keyboard focus for material chips',()=>{
 const css=fs.readFileSync(path.join(__dirname,'../assets/summon-stage-v56.css'),'utf8');
 assert.match(css,/@media\(max-width:560px\)/);assert.match(css,/focus-visible/);
 assert.match(css,/ad56-mat-list/);
});
