'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const rules=require('../assets/duo-shared-rules-v160.js');
const pack=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(pack.cards.map(card=>[card.id,card]));
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const live=(id,extra={})=>({id,uid:1000+id,level:catalog[id].level,
 atk:catalog[id].atk,def:catalog[id].def,role:catalog[id].role,
 fusion:false,mode:'atk',used:false,switched:false,placedRound:0,
 soul:0,condensed:0,lv1Shield:0,soulCooldown:0,raidCooldown:0,
 condenseLeft:0,condenseSlice:0,drainPreference:0,
 lastSoulAction:-1,lastDrainSwitch:-1,decaySkipOwnTurn:-1,
 decayGrace:0,maxDef:catalog[id].def,resonance:0,...extra});
function match(){
 const deck=[...pack.starterMain],fusions=[...pack.starterFusions];
 const base=rules.create({roomId:'abilities-v193',hostName:'Hannes',hostDeck:deck,
  hostFusions:fusions,enemyDeckA:deck,enemyDeckB:deck,
  enemyFusionsA:fusions,enemyFusionsB:fusions,chapter:1,entry:'new',catalog});
 const state=rules.apply(base,2,{type:'join',name:'Partner',deck,fusions},{catalog});
 state.round=3;return state;
}
const apply=(state,seat,action)=>rules.apply(state,seat,action,{catalog});
class Element{
 constructor(rect={left:300,top:300,width:100,height:90,right:400,bottom:390}){
  this.children=[];this.className='';this.rect=rect;this.textContent='';
  this.style={props:{},setProperty:(k,v)=>{this.style.props[k]=v;}};
  this.classList={contains:()=>false};
 }
 append(node){this.children.push(node);node.parent=this;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}
 setAttribute(k,v){this[k]=v;}
 getBoundingClientRect(){return this.rect;}
}
function fixture({hidden=false,reduced=false}={}){
 const tasks=[],body=new Element(),card=new Element(),team=new Element();
 const document={body,hidden,visibilityState:hidden?'hidden':'visible',
  createElement:()=>new Element(),querySelector:()=>card,
  getElementById:()=>team};
 const window={innerWidth:1280,innerHeight:850,
  matchMedia:()=>({matches:reduced})};
 const scope={window,document,Number,
  setTimeout:(fn,ms)=>{tasks.push({fn,ms,cleared:false});return tasks.length;},
  clearTimeout:id=>{if(tasks[id-1])tasks[id-1].cleared=true;}};
 vm.runInNewContext(read('assets/duo-abilities-cinema-v193.js'),scope);
 return {api:window.ArcaneDuoAbilitiesCinema193,tasks,body,card};
}

test('Verdichten uses actual stored protection and new ATK, never consumes the monster action',()=>{
 const f=fixture(),before=match();
 before.players[0].field[0]=live(7,{role:'soul',mode:'def',soul:500});
 const original=JSON.stringify(before);
 const after=apply(before,0,{type:'soulCondense',slot:0});
 const events=f.api.analyze(before,after,catalog);
 assert.equal(events.length,1);
 assert.equal(events[0].kind,'condense');
 assert.equal(events[0].shield,375);
 assert.equal(events[0].atk,187);
 assert.equal(events[0].where.seat,0);
 assert.equal(after.players[0].field[0].used,false);
 assert.equal(JSON.stringify(before),original,'the presentation never mutates state');
});

test('Seelenraub locates the actual source and target, not a same-named bystander',()=>{
 const f=fixture(),before=match();
 before.players[0].field[0]=live(7,{role:'soul',mode:'def',soul:100,level:5});
 before.players[1].field[0]=live(4,{atk:300,def:400});
 before.players[3].field[1]=live(4,{uid:9944,atk:400,def:500});
 const after=apply(before,0,{type:'soulRaid',slot:0,targetSeat:1,targetSlot:0});
 const [e]=f.api.analyze(before,after,catalog);
 assert.equal(e?.kind,'raid');
 assert.equal(e.where.seat,0);
 assert.equal(e.from.seat,1);
 assert.equal(e.from.slot,0);
 assert.ok(e.gain>0&&e.atk+e.def>0);
 assert.equal(e.atk+e.def,
  (before.players[1].field[0].atk-after.players[1].field[0].atk)+
  (before.players[1].field[0].def-after.players[1].field[0].def));
});

test('confirmed automatic Seelenentzug and resonance pulses coexist on a new turn',()=>{
 const f=fixture(),before=match();before.activeSeat=3;
 before.players[0].field[0]=live(7,{uid:9951,role:'soul',mode:'def',level:4,soul:50});
 before.players[0].field[1]=live(0,{uid:9952,role:'combatant',resonance:0});
 before.players[0].field[2]=live(1,{uid:9953,role:'resonator',fusion:true,resonance:0});
 before.players[1].field[0]=live(4,{uid:9954,atk:350,def:450});
 before.players[3].field[0]=live(5,{uid:9955,atk:390,def:510});
 const after=apply(before,3,{type:'end'}),events=f.api.analyze(before,after,catalog);
 const drain=events.find(e=>e.kind==='drain'),res=events.filter(e=>e.kind==='resonance');
 assert.ok(drain,'passive drain is detected only from the server event');
 assert.equal(drain.where.seat,0);
 assert.equal(drain.from.length,2);
 assert.ok(drain.gain>0);
 assert.equal(res.length,2);
 assert.deepEqual([...res.map(e=>e.pct)],[8,20],
  'normal Allrounder and fusion Resonator have distinct growth');
 assert.equal(f.api.analyze(after,after,catalog).length,0);
});

test('Seelenfokus and Seelenentladung are visually differentiated',()=>{
 const f=fixture(),before=match();
 before.players[0].field[0]=live(7,{role:'soul',level:5,mode:'def',soul:300});
 let after=apply(before,0,{type:'soulFocus',slot:0,stat:'atk'});
 let events=f.api.analyze(before,after,catalog);
 assert.equal(events.length,1);
 assert.equal(events[0].kind,'focus');
 assert.equal(events[0].stat,'ATK');
 before.players[0].field[0].lastSoulAction=-1;
 after=apply(before,0,{type:'soulDischarge',slot:0});
 events=f.api.analyze(before,after,catalog);
 assert.equal(events.length,1);
 assert.equal(events[0].kind,'discharge');
 assert.equal(events[0].targetTeam,1);
});

test('duplicate names without unique server evidence never animate the wrong card',()=>{
 const f=fixture(),before=match();
 before.players[0].field[0]=live(7,{uid:8821,role:'soul',mode:'def',soul:400});
 before.players[0].field[1]=live(7,{uid:8822,role:'soul',mode:'def',soul:400});
 const after=apply(before,0,{type:'soulCondense',slot:0});
 const events=f.api.analyze(before,after,catalog);
 assert.equal(events.length,1);
 assert.equal(events[0].where.slot,0);
 // A fabricated ambiguous (though syntactically valid) server delta is
 // deliberately skipped, not assigned to an arbitrary card.
 const ambiguous=JSON.parse(JSON.stringify(after));
 ambiguous.players[0].field[1].soul=after.players[0].field[0].soul;
 ambiguous.players[0].field[1].condensed=after.players[0].field[0].condensed;
 ambiguous.players[0].field[1].soulCooldown=3;
 assert.equal(f.api.analyze(before,ambiguous,catalog).length,0);
});

test('unrelated, same-revision and cross-room state updates never trigger abilities',()=>{
 const f=fixture(),before=match();
 before.players[0].field[0]=live(7,{role:'soul',mode:'def',soul:100});
 const after=apply(before,0,{type:'soulCondense',slot:0});
 assert.equal(f.api.analyze(after,after,catalog).length,0);
 assert.equal(f.api.analyze(before,{...after,revision:before.revision},catalog).length,0);
 assert.equal(f.api.analyze(before,{...after,roomId:'elsewhere'},catalog).length,0);
 assert.equal(f.api.analyze(before,{...after,chapter:2},catalog).length,0);
 assert.equal(f.api.analyze(before,{...after,log:['different history']},catalog).length,0);
});

test('animations run after state confirmation and respect reduced motion, polling and hidden tabs',()=>{
 const before=match();before.players[0].field[0]=live(7,{role:'soul',mode:'def',soul:250});
 const after=apply(before,0,{type:'soulCondense',slot:0});
 const f=fixture(),events=f.api.onState(before,after,catalog);
 assert.equal(events.length,1);
 assert.equal(f.body.children.length,0,'no early animation before scheduled effect');
 const first=f.tasks.find(t=>t.ms===120);assert.ok(first);first.fn();
 assert.equal(f.body.children.length,1);
 assert.match(f.body.children[0].className,/ad193-ability-stage/);
 assert.match(f.body.children[0].children[0].className,/ad193-condense/);
 f.api.onState(after,after,catalog);
 assert.equal(f.body.children.length,1,'same-revision polling leaves current effect');
 f.api.onState(after,{...after,revision:after.revision+1,
  log:[...after.log,'Anderer Zug.']},catalog);
 assert.equal(f.body.children.length,0,'new revision cancels old animation');
 for(const option of [{hidden:true},{reduced:true}]){
  const x=fixture(option);x.api.onState(before,after,catalog);
  for(const task of x.tasks)if(!task.cleared)task.fn();
  assert.equal(x.body.children.length,0);
 }
});

test('integration loads visual code before battle controller; rules and network are untouched',()=>{
 const html=read('duo-campaign-v2.html'),parity=read('assets/duo-parity-v160.js');
 const source=read('assets/duo-abilities-cinema-v193.js');
 assert.match(html,/duo-abilities-cinema-v193\.css\?v=20261026-v193/);
 assert.match(html,/duo-abilities-cinema-v193\.js\?v=20261026-v193/);
 assert.ok(html.indexOf('duo-abilities-cinema-v193.js')<html.indexOf('duo-parity-v160.js'));
 assert.match(parity,/ArcaneDuoAbilitiesCinema193\?\.onState\(previous,game,catalog\)/);
 assert.doesNotMatch(source,/\b(fetch|localStorage|sessionStorage|WebSocket)\s*\(/);
 assert.doesNotMatch(source,/\bsend\s*\(/);
});
