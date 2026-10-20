'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const audit=code=>boot({seed:19019}).run(code);
test('all ten tournament opponents follow their planned identities, including VII Guardian',()=>{
 const rows=audit('Array.from({length:10},(_,i)=>({tier:i+1,...ArcaneAiRevamp55.profileFor(i+1)}))');
 assert.deepEqual(rows.map(x=>x.style),
  ['attack','defense','fusion','attack','defense','fusion','defense','defense','fusion','hybrid']);
 assert.deepEqual(rows.map(x=>x.difficulty),
  ['leicht','leicht','leicht','mittel','mittel','mittel','schwer','schwer','schwer','finale']);
});
test('tournament decks are legal, contain ACE and final opponent has no Lv3 filler',()=>{
 const rows=audit("Array.from({length:10},(_,i)=>{const tier=i+1,g=createGame({mode:'pve',context:'tournament',opponentId:tier,difficulty:'easy'}),p=g.players[1],ace=ACE_CARD_IDS[tier],copies=p.originalDeck.filter(x=>x===ace).length;return {tier,count:p.originalDeck.length,valid:!mainDeckError(p.originalDeck,RPG_BASE_CARDS.map(c=>c.id)),min:Math.min(...p.originalDeck.map(x=>CARDS[x].level)),max:Math.max(...p.originalDeck.map(x=>CARDS[x].level)),cap:ArcaneAiRevamp55.profileFor(tier).cap,aceInMain:copies,aceInFusion:p.fusionDeck.includes(ace),fusionAce:CARDS[ace].fusionOnly,distinct:new Set(p.originalDeck).size,power:p.power};})");
 for(const r of rows){
  assert.equal(r.count,40,'tier '+r.tier+' needs 40 cards');
  assert.equal(r.valid,true,'tier '+r.tier+' invalid deck '+JSON.stringify(r));
  assert.ok(r.aceInMain>0||r.aceInFusion,'tier '+r.tier+' missing ACE');
  assert.ok(r.distinct>=10,'tier '+r.tier+' has too little variety');
  assert.ok(r.max<=r.cap,
   'tier '+r.tier+' contains a card above its difficulty ceiling: '+JSON.stringify(r));
 }
 assert.ok(rows[9].min>=7,'Final boss must never bring Lv3 filler: '+JSON.stringify(rows[9]));
 console.log('AI_DECK_AUDIT',JSON.stringify(rows));
});
test('a drawn ordinary ACE outranks weaker summons in NPC tournament',()=>{
 const result=audit("(()=>{const g=createGame({mode:'pve',context:'tournament',opponentId:7});game=g;g.active=1;g.aiPhase='summon';g.summoned=false;g.pending=null;g.players[1].field.fill(null);const id=ACE_CARD_IDS[7];if(CARDS[id].fusionOnly)return {fusion:true};const ace=newInstance(g,id,1);g.players[1].hand=[ace,...g.players[1].hand.filter(c=>c.id!==id).slice(0,4)];const choice=chooseAiAction(g);return {fusion:false,type:choice.type,chosen:choice.uid===ace.uid};})()");
 if(!result.fusion){assert.equal(result.type,'normal');assert.equal(result.chosen,true);}
});
test('ace preparation shifts an existing card in the actual deck rather than creating one',()=>{
 const result=audit("(()=>{const g=createGame({mode:'pve',context:'tournament',opponentId:10});game=g;g.active=1;g.aiPhase='summon';g.turn=9;g.summoned=false;const ace=ACE_CARD_IDS[10],p=g.players[1];const amountBefore=p.deck.filter(x=>x===ace).length;p.hand=p.hand.filter(c=>c.id!==ace);p.graveyard=[];p.field.fill(null);if(!amountBefore)return {skip:true};chooseAiAction(g);return {skip:false,flag:g.arcaneAceCue,next:p.deck.at(-1)===ace,remaining:p.deck.filter(x=>x===ace).length,amountBefore};})()");
 if(!result.skip){assert.equal(result.flag,true);assert.equal(result.next,true);assert.equal(result.remaining,result.amountBefore);}
});
test('Forbidden Research unlock and upgrade rank are validated and persist after a save roundtrip',()=>{
 const result=audit("(()=>{profile.lv1Saga={offered:true,met:true,stage:5,perk:true,skillRank:3,story:[1,2,3,4,5]};const normal=RPG_BASE_CARDS.find(c=>c.level===1&&!c.fusionOnly&&!c.ace&&!c.retired);const bonus=normalRoleBonus(normal,'atk',0,profile.upgrades);const enemy=normalRoleBonus(normal,'atk',1,profile.upgrades);saveProfile();const saved=JSON.parse(localStorage.getItem(SAVE_KEY));const validated=validateProfile(saved);return {bonus:bonus-enemy,rank:saved.lv1Saga.skillRank,validated:validated.lv1Saga.skillRank};})()");
 assert.equal(result.bonus,15);assert.equal(result.rank,3);assert.equal(result.validated,3);
});
test('no permanent Lv1 research passive without clearing finale',()=>{
 const result=audit("(()=>{profile.lv1Saga={offered:true,met:true,stage:3,perk:false,skillRank:0};const x=RPG_BASE_CARDS.find(c=>c.level===1&&!c.ace&&!c.fusionOnly&&!c.retired);return normalRoleBonus(x,'def',0,profile.upgrades)-normalRoleBonus(x,'def',1,profile.upgrades);})()");
 // Other player-only progression bonuses may exist: compare against baseline.
 assert.equal(result,0);
});

test('fusion-oriented opponents can plan their ACE directly from legal hand materials',()=>{
 const result=audit("Array.from({length:3},(_,i)=>{const tier=[6,9,10][i],g=createGame({mode:'pve',context:'tournament',opponentId:tier}),p=g.players[1];g.active=1;g.aiPhase='summon';g.summoned=false;g.pending=null;p.field.fill(null);const ace=ACE_CARD_IDS[tier];let legal=null;for(let a=0;a<p.hand.length&&!legal;a++)for(let b=a+1;b<p.hand.length;b++){const x=[p.hand[a],p.hand[b]],levels=x.map(c=>dataOf(c).level);if(fusionOptions(g,levels,x).some(c=>c.id===ace)&&canCompleteHandFusion(g,levels,ace))legal=x;}if(!legal)return {tier,legal:false};p.hand=[...legal,...p.hand.filter(c=>!legal.includes(c))];const a=chooseAiAction(g);return {tier,legal:true,chosen:a.choice===ace,action:a.type};})");
 for(const x of result)if(x.legal){
  assert.equal(x.action,'fusion','tier '+x.tier+' should fuse available ACE');
  assert.equal(x.chosen,true,'tier '+x.tier+' should choose ACE template');
 }
 console.log('ACE_FUSION_PLAN_AUDIT',JSON.stringify(result));
});
test('temporary Lv1 mechanics unlock per trial; passive only after final research',()=>{
 const r=audit("(()=>{profile.lv1Saga={offered:true,met:true,stage:2,perk:false};const g=createGame({mode:'pve',opponentId:1,context:'challenge'});g.lv1Saga={stage:2};const float=ArcaneLv1Swarm.enabled(g);g.lv1Saga.stage=3;const swarm=ArcaneLv1Swarm.enabled(g);g.lv1Saga.stage=4;const fusion=ArcaneLv1Swarm.enabled(g);delete g.lv1Saga;const outside=ArcaneLv1Swarm.enabled(g);profile.lv1Saga.perk=true;profile.lv1Saga.skillRank=1;const after=ArcaneLv1Swarm.enabled(g);return {float,swarm,fusion,outside,after};})()");
 assert.deepEqual(r,{float:true,swarm:true,fusion:true,outside:false,after:true});
});

test('guardian AI keeps a 200 ATK / 800 DEF protector in defensive position',()=>{
 const r=audit("(()=>{const g=createGame({mode:'pve',context:'tournament',opponentId:8});game=g;g.active=1;g.turn=8;g.pending=null;g.aiPhase='positions';g.summoned=true;const p=g.players[1],c=p.field[0]=newInstance(g,p.originalDeck[0],1);c.roleOverride='guardian';c.mode='atk';c.attacked=false;c.switched=false;c.card.atk=200;c.card.def=800;const command=chooseAiAction(g);const ok=command.type==='switch'?applyAiAction(g,command):false;const next=chooseAiAction(g);return {command:command.type,success:!!ok,mode:c.mode,next:next.type};})()");
 assert.equal(r.command,'switch');assert.equal(r.success,true);assert.equal(r.mode,'def');assert.notEqual(r.next,'switch');
});
test('two regular Predators grant a small pack attack bonus, no bonus to a solitary attacker',()=>{
 const r=audit("(()=>{const g=createGame({mode:'pve',opponentId:3,context:'free'});g.active=0;const p=g.players[0],a=newInstance(g,RPG_BASE_CARDS.find(c=>c.level===3&&!c.retired&&!c.ace).id,0),b=newInstance(g,RPG_BASE_CARDS.find(c=>c.level===3&&!c.retired&&!c.ace).id,0);a.roleOverride='predator';b.roleOverride='predator';p.field[0]=a;const before=effectiveAttack(g,a,null);p.field[1]=b;const after=effectiveAttack(g,a,null);return {before,after};})()");
 assert.ok(r.after>r.before&&r.after<=Math.ceil(r.before*1.03));
});
test('every tournament opponent AI completes repeated turns without an invalid action or stalled phase',()=>{
 const summary=audit("Array.from({length:10},(_,i)=>{const g=createGame({mode:'pve',opponentId:i+1,context:'tournament',seed:104+i});let actions=0;let error=null;try{for(let n=0;n<14&&g.winner===null;n++){aiTurn(g,g.active===0?'balanced':OPPONENTS[g.opponentId].policy);actions++;}}catch(e){error=String(e)}return {tier:i+1,actions,winner:g.winner,error};})");
 console.log('CAREER_AI_SIMULATION',JSON.stringify(summary));
 for(const x of summary)assert.equal(x.error,null,'tier '+x.tier+': '+x.error);
 assert.ok(summary.every(x=>x.actions>0));
});

test("final boss switches strategy to counter public board threats without reading the player\'s hand",()=>{
 const rows=audit("(()=>{const p=ArcaneAiRevamp55.profileFor(10);const g={players:[{field:Array(5).fill(null),hand:[{id:99999}]},{field:Array(5).fill(null)}]};const mode=()=>ArcaneAiRevamp55.counterMode(g,p);const open=mode();g.players[0].field[0]={id:1,roleOverride:'predator',fusion:false};g.players[0].field[1]={id:1,roleOverride:'predator',fusion:false};g.players[0].field[2]={id:1,roleOverride:'predator',fusion:false};const swarm=mode();g.players[0].field.fill(null);g.players[0].field[0]={id:1,roleOverride:'guardian',mode:'def'};g.players[0].field[1]={id:1,roleOverride:'soul',mode:'def'};const wall=mode();return {open,swarm,wall};})()");
 assert.deepEqual(rows,{open:'attack',swarm:'defense',wall:'fusion'});
});

test('ordinary ACE is the next real drawn card, with no duplicate',()=>{
 const r=audit("(()=>{const g=createGame({mode:'pve',context:'tournament',opponentId:1}),p=g.players[1],ace=ACE_CARD_IDS[1];game=g;g.active=1;g.aiPhase='summon';g.summoned=false;g.turn=12;p.deck=[...p.originalDeck];p.hand=[];const before=p.deck.filter(id=>id===ace).length;chooseAiAction(g);const queued=p.deck.at(-1)===ace;drawToFive(g,p);return {queued,drawn:p.hand.some(c=>c.id===ace),before,after:p.deck.filter(id=>id===ace).length+p.hand.filter(c=>c.id===ace).length};})()");
 assert.equal(r.queued,true);assert.equal(r.drawn,true);assert.equal(r.after,r.before);
});
test('fusion ACE uses real material cards at the pop() end and preserves the deck',()=>{
 const r=audit("(()=>{const g=createGame({mode:'pve',context:'tournament',opponentId:8}),p=g.players[1],ace=ACE_CARD_IDS[8],min=Math.max(1,CARDS[ace].level-2);game=g;g.active=1;g.aiPhase='summon';g.summoned=false;g.turn=12;p.deck=[...p.originalDeck];p.hand=[];const before=p.deck.slice();chooseAiAction(g);const queued=p.deck.slice(-2).every(id=>CARDS[id].level>=min);drawToFive(g,p);return {fusion:CARDS[ace].fusionOnly,cue:g.arcaneAceCue===true,queued,drawn:p.hand.filter(c=>CARDS[c.id].level>=min).length,preserved:JSON.stringify(before.slice().sort((a,b)=>a-b))===JSON.stringify([...p.deck,...p.hand.map(c=>c.id)].sort((a,b)=>a-b))};})()");
 assert.equal(r.fusion,true);assert.equal(r.cue,true);assert.equal(r.queued,true);
 assert.ok(r.drawn>=2);assert.equal(r.preserved,true);
});

test('AI guardian healing requires an adjacent Soul Drainer on the actual field',()=>{
 const r=audit("(()=>{const g=createGame({mode:'pve',context:'tournament',opponentId:8}),p=g.players[1];game=g;g.active=1;g.aiPhase='attacks';g.summoned=true;g.turn=8;p.field.fill(null);g.players[0].field.fill(null);const soul=newInstance(g,p.originalDeck[0],1),guard=newInstance(g,p.originalDeck[1],1);soul.roleOverride='soul';soul.mode='def';soul.card.def=Math.max(1,baseStat(CARDS[soul.id],'def',p)-300);guard.roleOverride='guardian';guard.mode='def';p.field[1]=soul;p.field[0]=guard;const adjacent=chooseAiAction(g).type;p.field[0]=null;p.field[4]=guard;g.aiPhase='attacks';const distant=chooseAiAction(g).type;const blocked=applyAiAction(g,{type:'arcane-guardian-heal',guardian:4,ally:1});return {adjacent,distant,guardNotSpent:!guard.attacked,defAfter:soul.card.def,blocked:!!blocked};})()");
 assert.equal(r.adjacent,'arcane-guardian-heal');
 assert.notEqual(r.distant,'arcane-guardian-heal');
 assert.equal(r.guardNotSpent,true);
 // An invalid delayed support action is safely skipped rather than applied.
 assert.equal(r.blocked,true);
});
