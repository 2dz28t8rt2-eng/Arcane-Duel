'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const rules=require('../assets/duo-shared-rules-v160.js');
const cards=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(cards.cards.map(card=>[card.id,card]));
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const live=(id,extra={})=>({id,uid:1000+id,level:catalog[id].level,
 atk:catalog[id].atk,def:catalog[id].def,role:catalog[id].role,
 fusion:false,mode:'atk',used:false,switched:false,placedRound:0,
 soul:0,condensed:0,lv1Shield:0,soulCooldown:0,raidCooldown:0,condenseLeft:0,
 condenseSlice:0,drainPreference:0,lastSoulAction:-1,lastDrainSwitch:-1,
 decaySkipOwnTurn:-1,decayGrace:0,maxDef:catalog[id].def,resonance:0,...extra});
const deck=[...cards.starterMain],fusions=[...cards.starterFusions];
function match(){
 const base=rules.create({roomId:'impact-test',hostName:'Hannes',hostDeck:deck,
  hostFusions:fusions,enemyDeckA:deck,enemyDeckB:deck,enemyFusionsA:fusions,
  enemyFusionsB:fusions,chapter:1,entry:'new',catalog});
 const state=rules.apply(base,2,{type:'join',name:'Partner',deck,fusions},{catalog});
 state.round=2;return state;
}
const act=(before,seat,action)=>rules.apply(before,seat,action,{catalog});
class Element{
 constructor(rect={left:200,top:300,width:100,height:75,right:300,bottom:375}){
  this.children=[];this.className='';this.textContent='';this.rect=rect;
  this.style={props:{},setProperty:(name,value)=>{this.style.props[name]=value;}};
  this.classList={contains:()=>false};
 }
 append(node){this.children.push(node);node.parent=this;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}
 setAttribute(name,value){this[name]=value;}
 getBoundingClientRect(){return this.rect;}
}
function fixture({reduced=false,hidden=false}={}){
 const tasks=[],body=new Element(),target=new Element(),bar0=new Element({
  left:160,top:80,width:130,height:30,right:290,bottom:110}),bar1=new Element({
  left:610,top:80,width:130,height:30,right:740,bottom:110});
 const document={body,hidden,visibilityState:hidden?'hidden':'visible',
  querySelector:selector=>selector.includes('.seat')?target:null,
  getElementById:id=>id==='duoAlliedLP'?bar0:id==='duoEnemyLP'?bar1:null,
  createElement:()=>new Element()};
 const window={innerWidth:1280,innerHeight:850,matchMedia:()=>({matches:reduced})};
 const scope={window,document,Date,Number,
  setTimeout:(fn,ms)=>{tasks.push({fn,ms,cleared:false});return tasks.length;},
  clearTimeout:id=>{if(tasks[id-1])tasks[id-1].cleared=true;}};
 vm.runInNewContext(read('assets/duo-impact-cinema-v192.js'),scope);
 return {api:window.ArcaneDuoImpactCinema192,body,target,bar0,bar1,tasks,scope};
}

test('real DEF attack reports lost DEF/essence and the actual separate counterstrike LP',()=>{
 const f=fixture(),before=match();
 before.players[0].field[0]=live(4,{atk:1000});
 for(let slot=1;slot<=5;slot++)before.players[0].field[slot]=live(5);
 before.players[1].field[0]=live(0,{atk:400,def:1000,maxDef:1000,
  mode:'def',soul:100,condensed:50});
 const snapshot=JSON.stringify(before);
 const after=act(before,0,{type:'attack',slot:0,targetSeat:1,targetSlot:0});
 const events=f.api.analyze(before,after,catalog);
 const hit=events.find(e=>e.kind==='hit'),counter=events.find(e=>e.kind==='counter');
 assert.ok(hit&&counter);
 assert.equal(hit.amount,990,'50 condensation + 100 soul + 840 DEF after unbound armor');
 assert.equal(hit.armor,10);
 assert.equal(hit.where.seat,1);
 assert.equal(hit.where.slot,0);
 assert.equal(counter.team,0,'counterstrike damages the attacking team');
 assert.equal(counter.amount,200,'only the actual logged counterstrike LP');
 assert.deepEqual([...events.filter(e=>e.kind==='lp').map(e=>e.amount)],[50],
  'forced soul-loss scoring remains distinct, never counted twice as counterstrike');
 assert.equal(JSON.stringify(before),snapshot,'visual analysis never mutates rules state');
});

test('armor, untouched barrier and immunity never report invented damage',()=>{
 const f=fixture(),before=match();
 before.players[0].field[0]=live(4,{atk:600});
 before.players[1].field[0]=live(7,{mode:'def',def:1,maxDef:1,
  guardLeft:2,guardGrantedTurn:before.turn});
 const after=act(before,0,{type:'attack',slot:0,targetSeat:1,targetSlot:0});
 const events=f.api.analyze(before,after,catalog);
 assert.equal(events.find(e=>e.kind==='block')?.amount,0);
 assert.equal(events.some(e=>e.kind==='hit'),false);
 assert.equal(events.some(e=>e.kind==='counter'),false);
});

test('direct attacks and ATK duels show only real team LP; shield absorbs separately',()=>{
 const f=fixture();
 let before=match();before.players[0].field[0]=live(4,{atk:1000});
 before.teams[1].shield=300;
 let after=act(before,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null});
 let events=f.api.analyze(before,after,catalog);
 assert.equal(events.find(e=>e.kind==='ward')?.amount,300);
 assert.equal(events.find(e=>e.kind==='lp')?.amount,720,
  'the Predator swarm bonus is already included in the actual server LP loss');
 assert.equal(events.some(e=>e.kind==='hit'),false,'direct LP damage is not creature DEF');

 before=match();before.players[0].field[0]=live(4,{atk:1000});
 before.players[1].field[0]=live(9,{atk:400});
 after=act(before,0,{type:'attack',slot:0,targetSeat:1,targetSlot:0});
 events=f.api.analyze(before,after,catalog);
 assert.equal(events.find(e=>e.kind==='lp')?.team,1);
 assert.equal(events.find(e=>e.kind==='lp')?.amount,620);
 assert.equal(events.some(e=>e.kind==='hit'),false,
  'an ATK-versus-ATK difference is team LP, not DEF loss');
});

test('unchanged, older, unrelated, or missing revisions cannot replay combat effects',()=>{
 const f=fixture(),before=match();before.players[0].field[0]=live(4,{atk:300});
 const after=act(before,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null});
 assert.equal(f.api.analyze(after,after,catalog).length,0);
 assert.equal(f.api.analyze(null,after,catalog).length,0);
 assert.equal(f.api.analyze(before,{...after,revision:before.revision},catalog).length,0);
 assert.equal(f.api.analyze(before,{...after,roomId:'other'},catalog).length,0);
 assert.equal(f.api.analyze(before,{...after,chapter:3},catalog).length,0);
 const noProof={...after,log:['unrelated history with no shared sequence']};
 assert.equal(f.api.analyze(before,noProof,catalog).length,0);
});

test('existing 2v2 camera gets real impacts only after the attack travel phase',()=>{
 const f=fixture(),before=match();before.players[0].field[0]=live(4,{atk:300});
 const after=act(before,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null});
 const events=f.api.onState(before,after,catalog);
 assert.ok(events.length);
 assert.equal(f.body.children.length,0,'no premature animation before confirmation queue');
 const timer=f.tasks.find(t=>t.ms===520);
 assert.ok(timer,'LP number is delayed until after the legacy attack effect');
 timer.fn();
 const layer=f.body.children[0];
 assert.match(layer.className,/ad192-impact-stage/);
 assert.equal(layer.children.length,1);
 assert.match(layer.children[0].className,/ad192-hit/);
 f.api.onState(after,after,catalog);
 assert.equal(f.body.children.length,1,'unchanged polling leaves an ongoing effect intact');
 const newer={...after,revision:after.revision+1,log:[...after.log,'Runde beendet.']};
 f.api.onState(after,newer,catalog);
 assert.equal(f.body.children.length,0,'new unrelated revision removes stale overlays');
});

test('reduced motion and hidden tabs do not start particles',()=>{
 const before=match();before.players[0].field[0]=live(4,{atk:500});
 const after=act(before,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null});
 for(const opt of [{reduced:true},{hidden:true}]){
  const f=fixture(opt);f.api.onState(before,after,catalog);
  for(const t of f.tasks)t.fn();
  assert.equal(f.body.children.length,0);
 }
});

test('integration is client-only, loaded before parity and keeps the 2v2 rules untouched',()=>{
 const html=read('duo-campaign-v2.html'),parity=read('assets/duo-parity-v160.js');
 const source=read('assets/duo-impact-cinema-v192.js');
 assert.match(html,/duo-impact-cinema-v192\.css\?v=20261026-v192/);
 assert.match(html,/duo-impact-cinema-v192\.js\?v=20261026-v192/);
 assert.ok(html.indexOf('duo-impact-cinema-v192.js')<html.indexOf('duo-parity-v160.js'));
 assert.match(parity,/ArcaneDuoImpactCinema192\?\.onState\(previous,game,catalog\)/);
 assert.doesNotMatch(source,/\b(fetch|localStorage|sessionStorage|WebSocket)\s*\(/);
 assert.doesNotMatch(source,/\bsend\s*\(/);
});
