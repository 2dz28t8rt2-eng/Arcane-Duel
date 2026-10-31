'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

class Element{
 constructor(){
  this.children=[];this.className='';this.textContent='';
  this.style={values:{},setProperty:(name,value)=>{this.style.values[name]=value;}};
  this.classList={add:(...names)=>{
   const s=new Set(this.className.split(/\s+/).filter(Boolean));names.forEach(n=>s.add(n));
   this.className=[...s].join(' ');
  },remove:(...names)=>{this.className=this.className.split(/\s+/)
   .filter(n=>n&&!names.includes(n)).join(' ');},
  contains:name=>this.className.split(/\s+/).includes(name)};
 }
 append(child){this.children.push(child);child.parent=this;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}
 setAttribute(key,value){this[key]=value;}
 querySelector(){return null;}
 getBoundingClientRect(){return this.rect;}
}
const unit=(uid,id,mode='atk',switched=false)=>({uid,id,mode,switched});
const player=(seat,card,ghost=null)=>({seat,field:[card,null,null],
 lv1:{ghostSlots:[ghost,null]}});
function states(){
 const before={roomId:'2v2-test',chapter:3,revision:11,players:[
  player(0,unit(111,7)),player(1,unit(222,8)),
  player(2,unit(333,9),unit(555,12,'def')),
  player(3,unit(444,10))]};
 const after={...before,revision:12,players:[
  player(0,unit(111,7,'def',true)),player(1,unit(222,8)),
  player(2,unit(333,9),unit(555,12,'atk',true)),
  player(3,unit(444,10,'def',true))]};
 return {before,after,catalog:{7:{name:'Silberfuchs'},12:{name:'Geisterritter'},
  10:{name:'Kohlewächter'}}};
}
function fixture({reduced=false,hidden=false}={}){
 const body=new Element(),field=new Element(),ghost=new Element(),tasks=[];
 field.rect={left:320,top:300,width:105,height:95,right:425,bottom:395};
 ghost.rect={left:550,top:350,width:83,height:80,right:633,bottom:430};
 const document={body,hidden,visibilityState:hidden?'hidden':'visible',
  querySelector:selector=>selector.includes('duo-ghost-cell')?ghost:field,
  createElement:()=>new Element()};
 const window={innerWidth:1200,innerHeight:850,
  matchMedia:()=>({matches:reduced})};
 const scope={window,document,Number,Date,
  setTimeout:(fn,ms)=>{const t={fn,ms,cleared:false};tasks.push(t);return tasks.length;},
  clearTimeout:id=>{if(tasks[id-1])tasks[id-1].cleared=true;}};
 vm.runInNewContext(read('assets/duo-stance-cinema-v191.js'),scope);
 return {api:window.ArcaneDuoStanceCinema191,field,ghost,body,tasks,scope};
}

test('confirmed ATK/DEF changes include both humans, AI and ghosts',()=>{
 const f=fixture(),s=states(),events=f.api.changes(s.before,s.after,s.catalog);
 assert.equal(f.api.version,'19.1.0');
 assert.equal(events.length,3);
 assert.deepEqual(Array.from(events,({seat,slot,area,from,to,name})=>
  [seat,slot,area,from,to,name]),[
   [0,0,'field','atk','def','Silberfuchs'],
   [2,0,'ghost','def','atk','Geisterritter'],
   [3,0,'field','atk','def','Kohlewächter']]);
});

test('unchanged revisions, chapters, rooms and false identity changes do not animate',()=>{
 const f=fixture(),s=states(),events=after=>f.api.changes(s.before,after,s.catalog);
 assert.equal(events({...s.after,revision:11}).length,0);
 assert.equal(events({...s.after,revision:10}).length,0);
 assert.equal(events({...s.after,roomId:'other'}).length,0);
 assert.equal(events({...s.after,chapter:4}).length,0);
 assert.equal(f.api.changes(null,s.after,s.catalog).length,0);
 const replaced={...s.after,players:s.after.players.map((p,i)=>i===0?
  {...p,field:[unit(999,7,'def',true),null,null]}:p)};
 assert.ok(events(replaced).every(e=>e.seat!==0),'same card art, different UID');
 const unswitched={...s.after,players:s.after.players.map((p,i)=>i===0?
  {...p,field:[unit(111,7,'def',false),null,null]}:p)};
 assert.ok(events(unswitched).every(e=>e.seat!==0));
 const sameMode={...s.after,players:s.after.players.map((p,i)=>i===0?
  {...p,field:[unit(111,7,'atk',true),null,null]}:p)};
 assert.ok(events(sameMode).every(e=>e.seat!==0));
});

test('flip appears after the final render and reveals the server-confirmed position',()=>{
 const f=fixture(),s=states();
 const events=f.api.onState(s.before,s.after,s.catalog);
 assert.equal(events.length,3);
 assert.equal(f.body.children.length,0,'state observation does not animate synchronously');
 const queued=f.tasks.find(x=>x.ms===0);queued.fn();
 assert.equal(f.body.children.length,1);
 const layer=f.body.children[0],card=layer.children[0];
 assert.equal(card.className,'ad191-position-card');
 assert.equal(card.children[0].children.length,2,'both old and new position faces');
 assert.match(card.children[0].children[0].className,/ad191-face-atk/);
 assert.match(card.children[0].children[1].className,/ad191-face-def/);
 assert.equal(f.field.classList.contains('ad191-position-transition'),true);
 assert.equal(card.style.left,'320px');
 f.tasks.find(x=>x.ms===640).fn();
 assert.equal(f.field.classList.contains('ad191-position-transition'),false);
 assert.equal(f.field.classList.contains('ad191-position-def'),true);
 assert.equal(layer.children.length,2,'impact appears after flip');
 assert.equal(layer.children[1].children.length,10,'one ring, one shield and eight sparks');
 f.tasks.find(x=>x.ms===1260).fn();
 assert.equal(f.body.children.length,0);
 assert.equal(f.field.classList.contains('ad191-position-arrived'),false);
});

test('a later confirmed event may start after a previous flip has finished',()=>{
 const f=fixture(),s=states();f.api.onState(s.before,s.after,s.catalog);
 f.tasks.find(t=>t.ms===0).fn();
 f.tasks.find(t=>t.ms===1260).fn();
 f.tasks.find(t=>t.ms===1380).fn();
 assert.equal(f.body.children.length,1);
 assert.equal(f.ghost.classList.contains('ad191-position-transition'),true);
 f.api.clear();
 assert.equal(f.body.children.length,0);
 assert.equal(f.ghost.classList.contains('ad191-position-transition'),false);
});

test('reduced motion, hidden tab and offscreen cards play no overlay',()=>{
 const s=states();
 for(const config of [{reduced:true},{hidden:true}]){
  const f=fixture(config);
  assert.equal(f.api.play(f.api.changes(s.before,s.after,s.catalog)[0]),false);
  assert.equal(f.body.children.length,0);
 }
 const f=fixture();f.field.rect.left=4000;f.field.rect.right=4105;
 assert.equal(f.api.play(f.api.changes(s.before,s.after,s.catalog)[0]),false);
});

test('new DEF Soul Eater gets delayed violet Seelenfokus arrival after summon',()=>{
 const f=fixture(),s=states();
 const newSoul=unit(989,42,'def',false);newSoul.role='soul';
 const after={...s.before,revision:12,
  players:s.before.players.map((p,i)=>i===1?
   {...p,field:[...p.field.slice(0,1),newSoul,null]}:p)};
 const events=f.api.changes(s.before,after,{42:{name:'Wolkenzehrer'}});
 assert.equal(events.length,1);
 assert.equal(events[0].arrival,true);
 assert.equal(events[0].soul,true);
 f.api.onState(s.before,after,{42:{name:'Wolkenzehrer'}});
 const pending=f.tasks.find(t=>t.ms===950);
 assert.ok(pending,'place animation must not compete with the summon landing');
 pending.fn();
 assert.match(f.body.children[0].className,/ad191-soul-focus/);
 const card=f.body.children[0].children[0];
 assert.ok(card.children[0].children[1].children.some(x=>x.textContent.includes('SEELENFOKUS')));
});
test('new server revision invalidates an older pending visual; polling same revision does not',()=>{
 const f=fixture(),s=states();f.api.onState(s.before,s.after,s.catalog);
 assert.equal(f.tasks[0].cleared,false);
 f.api.onState(s.after,s.after,s.catalog);
 assert.equal(f.tasks[0].cleared,false);
 const later={...s.after,revision:13,players:s.after.players.map(p=>({
  ...p,field:p.field.slice(),lv1:{ghostSlots:p.lv1.ghostSlots.slice()}}))};
 f.api.onState(s.after,later,s.catalog);
 assert.equal(f.tasks[0].cleared,true);
 assert.equal(f.body.children.length,0);
});

test('integration binds the visual observer to server load and never changes game rules',()=>{
 const parity=read('assets/duo-parity-v160.js'),html=read('duo-campaign-v2.html');
 assert.match(parity,/window\.ArcaneDuoStanceCinema191\?\.onState\(previous,game,catalog\)/);
 assert.ok(parity.indexOf('game=payload.state')<parity.indexOf('ArcaneDuoStanceCinema191?.onState'));
 assert.match(html,/duo-stance-cinema-v191\.css\?v=20261030-soul-focus/);
 assert.match(html,/duo-stance-cinema-v191\.js\?v=shared-presentation-228/);
 assert.ok(html.indexOf('duo-stance-cinema-v191.js')<html.indexOf('duo-parity-v160.js'));
 const script=read('assets/duo-stance-cinema-v191.js');
 assert.doesNotMatch(script,/\b(fetch|localStorage|sessionStorage|WebSocket)\s*\(/);
 assert.doesNotMatch(script,/\bsend\s*\(/);
});
