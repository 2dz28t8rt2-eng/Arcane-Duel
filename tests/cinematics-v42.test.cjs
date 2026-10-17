'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {boot,repo}=require('./helpers/game-runtime.cjs');
function setup(){
 const b=boot({seed:42});
 b.exec(`globalThis.cinemaFixture=()=>{
  profile=freshProfile();game=createGame({id:'cinema-fixture',mode:'pve',opponentId:2,context:'free',seed:42,starter:0});
  game.active=1;game.turn=4;game.players.forEach(p=>p.field.fill(null));
  const make=(role,owner)=>{const t=CARDS.find(c=>c&&!c.retired&&!c.fusionOnly&&c.role===role&&c.level===4);const c=newInstance(game,t.id,owner);c.mode='def';c.summonedTurn=1;ArcaneEssenceCombat.statLayer(c);return c;};
  const guardian=make('guardian',0),soul=make('soul',0),soul2=make('soul',0),prey=make('predator',1);
  prey.summonedTurn=game.turn;game.players[0].field=[guardian,soul,soul2,null,null];game.players[1].field=[prey,null,null,null,null];soul.card.def-=100;
  uiMode='duel';animationSpeed='normal';busy=false;aiRunning=false;$('overlay').classList.add('hidden');
  return {g:game,guardian,soul,soul2,prey};
 };`);
 return b;
}
test('All active monsters and the reported legacy wolf have original, distinct motifs',()=>{
 const b=boot(),r=b.run('({audit:ArcaneArtworkCoverage.audit(),count:ArcaneArtworkCompletion.motifs,wolf:[CARDS[113].art,CARDS[159].art]})');
 assert.equal(r.audit.active,370);assert.equal(r.audit.missingCards,0);assert.equal(r.count,17);assert.equal(r.wolf[0],r.wolf[1]);
 const m=JSON.parse(fs.readFileSync(path.join(repo,'assets/custom-art/generated-4-2/manifest.json')));
 assert.equal(m.assets.length,17);assert.equal(new Set(m.assets.map(a=>a.sha256)).size,17);
 for(const a of m.assets){const bytes=fs.readFileSync(path.join(repo,a.path));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.sha256);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(a.width,1024);}
});
test('A turn groups real guardian healing and both soul absorptions under one orb batch',()=>{
 const b=setup();b.ctx.matchMedia=()=>({matches:false});
 const r=b.run(`(()=>{const {g,soul,prey}=cinemaFixture();const before=prey.card.atk+prey.card.def;advanceTurn(g);const q=ArcaneDefenderFX.pending(g);return {q,drained:before-prey.card.atk-prey.card.def,soul:soul.essenceCombat.soul};})()`);
 assert.equal(r.q.length,1);assert.equal(r.q[0].type,'turn');assert.equal(r.q[0].targets.length,1);
 const steps=r.q[0].steps;assert.equal(steps.filter(s=>s.type==='heal').length,1);assert.equal(steps.filter(s=>s.type==='absorb').length,2);
 assert.equal(steps.filter(s=>s.type==='absorb').reduce((sum,s)=>sum+s.targets[0].amount,0),r.drained);assert.ok(r.soul>0);
});
test('No defender means no orb batch; animation-off simulations keep no visual queue',()=>{
 const b=setup();b.ctx.matchMedia=()=>({matches:false});
 assert.deepEqual(b.run(`(()=>{const {g}=cinemaFixture();g.players[0].field.fill(null);advanceTurn(g);return ArcaneDefenderFX.pending(g);})()`),[]);
 b.ctx.matchMedia=()=>({matches:true});assert.deepEqual(b.run(`(()=>{const {g}=cinemaFixture();advanceTurn(g);return ArcaneDefenderFX.pending(g);})()`),[]);
});
test('Visual recording consumes no battle randomness and changes no results',()=>{
 const outputs=[];
 for(const visible of [false,true]){const b=setup();b.ctx.matchMedia=()=>({matches:!visible});outputs.push(b.run(`(()=>{const {g}=cinemaFixture();advanceTurn(g);return {seed:g.seed,lp:g.players.map(p=>p.lp),field:g.players.map(p=>p.field.map(c=>c?{id:c.id,card:c.card,essence:c.essenceCombat}:null)),log:g.log};})()`));}
 assert.deepEqual(outputs[0],outputs[1]);
});
test('Overcharged DEF is derived from current layers and clears at the real maximum',()=>{
 const b=setup();const r=b.run(`(()=>{const {soul}=cinemaFixture();soul.card.def=soul.essenceCombat.maxDef;soul.essenceCombat.soul=80;const charged=ArcaneDefenderFX.charge(soul),markup=fullCardHtml(soul);soul.essenceCombat.soul=0;const cleared=ArcaneDefenderFX.charge(soul);soul.mode='atk';soul.essenceCombat.soul=80;return {charged,markup,cleared,attack:ArcaneDefenderFX.charge(soul)};})()`);
 assert.equal(r.charged.extra,80);assert.match(r.markup,/ad-overcharged/);assert.equal(r.cleared,null);assert.equal(r.attack,null);
});
test('Counterstrikes are recorded only for actual eligible hits, including a destroyed defender',()=>{
 const b=setup();b.ctx.matchMedia=()=>({matches:false});
 const r=b.run(`(()=>{const {g,guardian,prey}=cinemaFixture();g.active=1;g.turn=6;g.players[0].field=[guardian,null,null,null,null];prey.mode='atk';prey.card.atk=9000;guardian.card.atk=300;g.players[1].lp=g.maxLP;g.players[1].shield=0;prey.attacked=false;prey.summonedTurn=1;guardian.card.def=1;const result=attack(g,0,0),first=ArcaneDefenderFX.pending(g);attack(g,0,0);return {destroyed:result.destroyed,first,after:ArcaneDefenderFX.pending(g)};})()`);
 assert.deepEqual(r.destroyed,['0:0']);assert.equal(r.first.length,1);assert.equal(r.first[0].type,'counter');assert.ok(r.first[0].amount>0);assert.deepEqual(r.first,r.after);
});
test('One phase skip completes that phase only and cannot skip the following phase',async()=>{
 const b=boot();const r=await b.exec(`(async()=>{
  const root=document.createElement('div'),phases=ArcaneCinemaPhases.create(root,()=>new Promise(()=>{}));let first=false,second=false;
  const a=phases.run('Rotation',async()=>{await phases.wait(999);await phases.wait(999);first=true;});
  const accepted=phases.skip(),duplicate=phases.skip();await a;
  const next=phases.run('Berechnung',async()=>{await phases.wait(999);second=true;});
  await Promise.resolve();const blocked=!second;phases.skip();await next;phases.close();
  return {accepted,duplicate,first,blocked,second};
 })()`);
 assert.deepEqual(JSON.parse(JSON.stringify(r)),{accepted:true,duplicate:false,first:true,blocked:true,second:true});
});
