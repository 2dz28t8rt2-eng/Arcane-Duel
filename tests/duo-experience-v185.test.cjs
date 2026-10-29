'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const load=path=>fs.readFileSync(require('node:path').join(root,path),'utf8');
const scope={window:{}};
vm.runInNewContext(load('assets/duo-experience-v185.js'),scope);
const ui=scope.window.ArcaneDuoExperience185;
const players=[
 {seat:0,team:0,name:'Hannes',kind:'human'},
 {seat:1,team:1,name:'Schattenjäger',kind:'ai'},
 {seat:2,team:0,name:'Freund',kind:'human'},
 {seat:3,team:1,name:'Dunkelritter',kind:'ai'}
];
const game=(revision=1,extra={})=>({roomId:'room-42',status:'active',activeSeat:0,chapter:1,
  revision,players,teams:[{lp:16000,maxLp:16000,shield:100},{lp:16000,maxLp:16000,shield:0}],log:[],...extra});

test('Duo turn display says who plays for both human seats, including the second human',()=>{
 assert.equal(ui.turnInfo(game(),0).kind,'self');
 assert.equal(ui.turnInfo(game(),2).kind,'ally');
 assert.equal(ui.turnInfo(game(1,{activeSeat:2}),2).kind,'self');
 assert.equal(ui.turnInfo(game(1,{activeSeat:2}),0).kind,'ally');
 assert.equal(ui.turnInfo(game(1,{activeSeat:1}),0).kind,'enemy');
 assert.equal(ui.turnInfo(game(1,{status:'waiting'}),0).kind,'waiting');
 assert.equal(ui.turnInfo(game(1,{status:'finished',winner:0}),0).kind,'victory');
 assert.equal(ui.turnInfo(game(1,{status:'finished',winner:1}),2).kind,'defeat');
});

test('Team markers keep both humans allied and both computer opponents hostile',()=>{
 assert.equal(ui.seatKind(players[0],0),'self');
 assert.equal(ui.seatKind(players[2],0),'ally');
 assert.equal(ui.seatKind(players[0],2),'ally');
 assert.equal(ui.seatKind(players[2],2),'self');
 assert.equal(ui.seatKind(players[1],2),'enemy');
 assert.equal(ui.seatKind(players[3],0),'enemy');
});

test('Team effects come from confirmed changes and never replay on unchanged state',()=>{
 const before=game(10),after=game(11,{activeSeat:2,
  teams:[{lp:16000,maxLp:16000,shield:330},{lp:13000,maxLp:16000,shield:0}],
  log:['Freund greift Dunkelritter in DEF an: 3000 Schaden.']});
 const copy=JSON.stringify(after);
 const events=ui.changes(before,after,0);
 assert.ok(events.some(e=>e.kind==='shield'&&e.text.includes('230')));
 assert.ok(events.some(e=>e.kind==='attack'&&e.seat===2));
 assert.ok(events.some(e=>e.kind==='impact'&&e.team===1));
 assert.equal(ui.changes(after,after,0).length,0);
 assert.equal(ui.changes(null,after,0).length,0);
 assert.equal(JSON.stringify(after),copy,'Only read from the authoritative game snapshot');
});

test('First history render, switched rooms and chapter change do not fake team actions',()=>{
 const initial=game(4,{log:['Freund greift Schattenjäger in DEF an.']});
 assert.equal(ui.changedLines(null,initial).length,0);
 assert.equal(ui.changes(initial,game(5,{roomId:'other-room'}),0).length,0);
 assert.equal(ui.changes(initial,game(5,{chapter:2}),0).length,0);
 const newer=game(5,{log:[...initial.log,'Freund fusioniert zwei eigene Monster.']});
 assert.deepEqual([...ui.changedLines(initial,newer)],['Freund fusioniert zwei eigene Monster.']);
 assert.equal(ui.changes(initial,newer,2).some(e=>e.seat===2&&e.kind==='fusion'),false,
  'Partner actions must not be displayed as your own');
});

test('v18.5 loads as a read-only presentation layer before duel parity',()=>{
 const html=load('duo-campaign-v2.html'),parity=load('assets/duo-parity-v160.js');
 assert.ok(html.includes('assets/duo-experience-v185.css'));
 assert.ok(html.includes('id="ad185-turn-banner"'));
 assert.ok(html.includes('id="ad185-team-event"'));
 assert.ok(html.indexOf('duo-experience-v185.js')<html.indexOf('duo-parity-v160.js'));
 assert.ok(parity.includes('ArcaneDuoExperience185?.didRender'));
 const module=load('assets/duo-experience-v185.js');
 assert.doesNotMatch(module,/\b(send|apply|save|localStorage\.setItem)\s*\(/);
});
