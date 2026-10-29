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
  this.children=[];this.className='';this.textContent='';this.style={values:{},
   setProperty:(key,value)=>{this.style.values[key]=value;}};
  this.classList={add:(...names)=>{const all=new Set(this.className.split(/\s+/).filter(Boolean));
   names.forEach(name=>all.add(name));this.className=[...all].join(' ');},
   remove:(...names)=>{this.className=this.className.split(/\s+/).filter(name=>name&&!names.includes(name)).join(' ');},
   contains:name=>this.className.split(/\s+/).includes(name)};
 }
 append(node){this.children.push(node);node.parent=this;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(node=>node!==this);}
 setAttribute(name,value){this[name]=value;}
 getBoundingClientRect(){return this.rect;}
}
function fixture({seat=0,hidden=false,reduced=false,emptyHand=false}={}){
 const source=new Element(),target=new Element(),body=new Element();
 source.rect={left:120,top:720,width:106,height:115};
 source.textContent='Silberfuchs';
 target.rect={left:530,top:400,width:100,height:110};
 const tasks=[];
 const document={body,hidden,visibilityState:hidden?'hidden':'visible',
  querySelector:query=>query.includes('duo178-hand-card')?source:
   query.includes('.field-cell[data-slot="1"]')?target:null,
  querySelectorAll:()=>[target],createElement:()=>new Element()};
 const window={innerWidth:1280,innerHeight:900,scrollX:0,scrollY:0,
  matchMedia:()=>({matches:reduced})};
 const scope={window,document,Date,setTimeout:(fn,ms)=>{tasks.push({fn,ms});return tasks.length;},
  clearTimeout:id=>{if(tasks[id-1])tasks[id-1].cleared=true;}};
 vm.runInNewContext(read('assets/duo-summon-cinema-v190.js'),scope);
 const api=window.ArcaneDuoSummonCinema190;
 const before={roomId:'duo-test',chapter:2,revision:8,status:'active',activeSeat:seat,
  players:[{seat:0,hand:emptyHand?[]:[12],field:[null,null,null]},
   {seat:1,hand:[22],field:[null,null,null]},
   {seat:2,hand:[12],field:[null,null,null]},
   {seat:3,hand:[24],field:[null,null,null]}]};
 const after={...before,revision:9,players:before.players.map(p=>({
  ...p,hand:p.seat===seat?[]:p.hand.slice(),
  field:p.seat===seat?[null,{id:12},null]:p.field.slice()}))};
 const action={type:'summon',handIndex:0,slot:1};
 const ticket=api.capture({action,game:before,seat,catalog:{12:{name:'Silberfuchs',level:3}}});
 return {api,before,after,action,ticket,source,target,body,tasks,scope};
}

test('captures only the acting human player hand and a free field slot',()=>{
 const f=fixture();
 assert.equal(f.api.version,'19.0.0');
 assert.equal(f.ticket.cardId,12);
 assert.equal(f.ticket.name,'Silberfuchs');
 assert.equal(f.ticket.seat,0);
 assert.equal(f.ticket.rect.left,120);
 assert.equal(f.api.capture({game:f.before,seat:1,action:f.action}),null);
 assert.equal(f.api.capture({game:{...f.before,activeSeat:2},seat:0,action:f.action}),null);
 assert.equal(f.api.capture({game:f.before,seat:0,action:{...f.action,type:'fusion'}}),null);
 assert.equal(f.api.capture({game:f.before,seat:0,action:{...f.action,slot:50}}),null);
 assert.equal(f.api.capture({game:f.before,seat:0,action:{...f.action,handIndex:50}}),null);
 assert.equal(f.api.capture({game:{...f.before,players:f.before.players.map((p,i)=>i===0?
  {...p,field:[null,{id:30},null]}:p)},seat:0,action:f.action}),null);
 assert.equal(fixture({emptyHand:true}).ticket,null);
 assert.equal(fixture({seat:2}).ticket.cardId,12);
});

test('server-confirmed revision and exact summoned card are required',()=>{
 const f=fixture(),check=(after)=>f.api.confirmed({ticket:f.ticket,before:f.before,after});
 assert.equal(check(f.after),true);
 assert.equal(check({...f.after,revision:8}),false);
 assert.equal(check({...f.after,revision:7}),false);
 assert.equal(check({...f.after,roomId:'different'}),false);
 assert.equal(check({...f.after,chapter:3}),false);
 assert.equal(check({...f.after,players:f.after.players.map((p,i)=>i===0?
  {...p,field:[null,{id:99},null]}:p)}),false);
 assert.equal(check({...f.after,players:f.after.players.map((p,i)=>i===0?
  {...p,field:[null,null,{id:12}]}:p)}),false);
 assert.equal(f.api.confirmed({ticket:null,before:f.before,after:f.after}),false);
});

test('a confirmed local summon flies to its slot, has one own effect and cleans up',()=>{
 const f=fixture();
 assert.equal(f.api.play({ticket:f.ticket,before:f.before,after:f.after}),true);
 assert.equal(f.body.children.length,1);
 const stage=f.body.children[0],card=stage.children[0];
 assert.equal(card.className,'ad190-flight-card');
 assert.equal(card.style.values['--ad190-dx'],'407px');
 assert.equal(f.target.classList.contains('ad190-awaiting'),true);
 assert.equal(f.api.ownsSummon({seat:1,slot:1,area:'field'}),false);
 assert.equal(f.api.ownsSummon({seat:0,slot:0,area:'field'}),false);
 assert.equal(f.api.ownsSummon({seat:0,slot:1,area:'field'}),true);
 assert.equal(f.api.ownsSummon({seat:0,slot:1,area:'field'}),false);
 f.tasks.find(task=>task.ms===560).fn();
 assert.equal(f.target.classList.contains('ad190-awaiting'),false);
 assert.equal(f.target.classList.contains('ad190-arrived'),true);
 assert.equal(stage.children.length,2);
 assert.equal(stage.children[1].children.length,14,'ring, center and 12 sparks');
 f.tasks.find(task=>task.ms===1400).fn();
 assert.equal(f.body.children.length,0);
 assert.equal(f.target.classList.contains('ad190-arrived'),false);
});

test('reduced motion, invisible tab, rejected action, or off-screen hand remain static',()=>{
 for(const config of [{reduced:true},{hidden:true}]){
  const f=fixture(config);
  assert.equal(f.api.play({ticket:f.ticket,before:f.before,after:f.after}),false);
  assert.equal(f.body.children.length,0);
 }
 const rejected=fixture();
 assert.equal(rejected.api.play({ticket:rejected.ticket,before:rejected.before,
  after:{...rejected.after,revision:8}}),false);
 assert.equal(rejected.body.children.length,0);
 const unseen=fixture();unseen.ticket.rect.left=3000;
 assert.equal(unseen.api.play({ticket:unseen.ticket,before:unseen.before,after:unseen.after}),false);
});

test('integration uses original server action and retains partner/opponent choreography',()=>{
 const parity=read('assets/duo-parity-v160.js'),fx=read('assets/duo-cinematics-v167.js'),
  html=read('duo-campaign-v2.html');
 const captureAt=parity.indexOf('ArcaneDuoSummonCinema190?.capture');
 assert.ok(captureAt>parity.indexOf('async function send(action)'));
 assert.ok(captureAt<parity.indexOf('busy=true;render()',captureAt));
 assert.match(parity,/load\(response\);\s*if\(summonTicket&&window\.ArcaneDuoSummonCinema190\?\.confirmed/);
 assert.match(parity,/finally\s*\{\s*busy=false;render\(\);[\s\S]*?if\(confirmedSummon\)window\.ArcaneDuoSummonCinema190\?\.play/);
 assert.match(fx,/e\.type!=="summon"\|\|!window\.ArcaneDuoSummonCinema190\?\.ownsSummon/);
 assert.match(html,/duo-summon-cinema-v190\.css\?v=20261026-v190/);
 assert.match(html,/duo-summon-cinema-v190\.js\?v=20261026-v190/);
 assert.ok(html.indexOf('duo-summon-cinema-v190.js')<html.indexOf('duo-parity-v160.js'));
 const cinema=read('assets/duo-summon-cinema-v190.js');
 assert.doesNotMatch(cinema,/\b(fetch|localStorage|sessionStorage|WebSocket)\s*\(/);
});
