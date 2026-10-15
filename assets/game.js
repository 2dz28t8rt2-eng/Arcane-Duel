// Arcane Duel · Alpha 2.0 Entwicklungsgrundlage · klassisches JavaScript

'use strict';
const START_LP=8000,MAX_COPIES=3,HAND_SIZE=5,MAX_LEVEL=8,MAX_DEF=1000,ARENA_SAFE_ROUNDS=9,OPENING_SHIELD=200;
const LEVEL_RULES=[null,{max:300,min:100},{max:500,min:150},{max:700,min:250},{max:900,min:350},{max:1100,min:450},{max:1300,min:550},{max:1500,min:600},{max:2000,min:750}];
const $=id=>document.getElementById(id);
const rng=max=>{if(window.crypto?.getRandomValues){const b=new Uint32Array(1);window.crypto.getRandomValues(b);return b[0]%max;}return Math.floor(Math.random()*max);};
const statPools=LEVEL_RULES.map((r,l)=>{if(!r)return null;const a=[],low=l===1?0:LEVEL_RULES[l-1].max;for(let atk=r.min;atk<=r.max-r.min;atk+=10)for(let def=r.min;def<=Math.min(MAX_DEF,r.max-atk);def+=10)if(atk+def>low)a.push({atk,def});return a;});
const definitions=[
 [1,'Funkenkobold','goblin','FEUER','#ffb173'],[1,'Mooswicht','golem','ERDE','#96ca7e'],[1,'Dunstküken','bird','WIND','#a3ced9'],[1,'Sternenmotte','insect','LICHT','#e6c1ff'],[1,'Schattenkeim','spirit','DUNKEL','#ae86dc'],[1,'Tropfenrochen','ray','WASSER','#6bceeb'],[1,'Glutnatter','serpent','FEUER','#e99681'],
 [2,'Eisenpage','knight','ERDE','#a9b6d5'],[2,'Rubinhexe','mage','FEUER','#ed7ca3'],[2,'Nebeljäger','wolf','WIND','#a0d5ae'],[2,'Runenfalter','insect','LICHT','#e6cd88'],[2,'Dämmergreif','bird','DUNKEL','#ba8ff4'],[2,'Gezeitengeist','spirit','WASSER','#75b7f1'],[2,'Dornenhirsch','stag','ERDE','#72c4a9'],
 [3,'Obsidianritter','knight','DUNKEL','#b192d4'],[3,'Azurdrache','dragon','WASSER','#80d6f4'],[3,'Sonnenorakel','mage','LICHT','#f6d17a'],[3,'Sturmschakal','wolf','WIND','#a6bedf'],[3,'Lavakoloss','golem','FEUER','#ec8664'],[3,'Waldkrone','stag','ERDE','#94cc80'],
 [4,'Prismengreif','bird','LICHT','#f1c7f3'],[4,'Blutmondhexe','mage','DUNKEL','#e97dab'],[4,'Korallendrache','dragon','WASSER','#70dfd4'],[5,'Ruf des Vulkans','golem','FEUER','#ff9a65'],[5,'Thronenwächter','knight','ERDE','#d2ca83'],[5,'Silbersturm','wolf','WIND','#b4daef'],[6,'Eklipsenwyrm','dragon','DUNKEL','#bf8cff'],[6,'Lichtarchon','mage','LICHT','#ffe098'],[6,'Tiefseeleviathan','serpent','WASSER','#79c5df'],[7,'Phönixregent','bird','FEUER','#ffba73'],[7,'Weltenwurzler','stag','ERDE','#97dfb0'],[7,'Himmelsbrecher','knight','WIND','#d5d6ff'],[8,'Astraldrache','dragon','LICHT','#fff0b8'],[8,'König der Leere','spirit','DUNKEL','#d6a1f7'],[8,'Urozean-Titan','golem','WASSER','#80eee1'],
 [1,'Bernsteinwicht','goblin','ERDE','#f8c274'],[1,'Mondscherbe','spirit','LICHT','#c4b9ff'],[2,'Wellenritter','knight','WASSER','#8cdfeb'],[2,'Glutgreif','bird','FEUER','#ed987b'],[3,'Runenherz','golem','ERDE','#b4d8a6'],[3,'Sternenhexe','mage','LICHT','#e8baff']
];
const CARDS=definitions.map(([level,name,kind,element,color],id)=>({id,level,name,kind,element,color,...statPools[level][(id*73+19)%statPools[level].length],desc:id<20?'Ein Bewohner der alten Arena.':id<35?'Nur durch Fusion erreichbar.':'Eine neue Karte deiner Sammlung.'}));
const DEFAULT_DECK=Array.from({length:20},(_,i)=>i),BASE_CARDS=CARDS.filter(c=>c.level<=3);
const editorPreviewIds={collection:null,fusions:null};
const displayElement=element=>element==='DUNKEL'?'Dunkelheit':element;


const CUSTOM_CARD_ART=[

 {id:0,name:'Untoter Goblin vor dem Vollmond',art:'assets/custom-art/base-000.webp',desc:'Ein verwester Kleinkrieger, der im fahlen Vollmondlicht durch die Ruinen schleicht.'},
 {id:1,name:'Sumpfbestie im Mondlicht',art:'assets/custom-art/base-001.webp',desc:'Eine klamme Bestie aus Moder und Schlamm, die aus schwarzem Wasser hervorbricht.'},
 {id:2,name:'Dämonische Runenfledermaus über Mondruinen',art:'assets/custom-art/base-002.webp',desc:'Ein runenverbranntes Nachtwesen, das kreischend über zerfallene Bögen jagt.'},
 {id:3,name:'Mondlicht-Panther in gotischen Ruinen',art:'assets/custom-art/base-003.webp',desc:'Ein lautloser Jäger mit violetten Augen, der zwischen gotischen Mauern pirscht.'},
 {id:6,name:'Runenbasilisk im Ruinentempel',art:'assets/custom-art/base-006.webp',desc:'Ein schuppiges Schreckenstier, dessen Blick von dunklen Runen aufgeladen ist.'},
 {id:11,name:'Spektraler Wyvern über mondbeschienenen Ruinen',art:'assets/custom-art/base-011.webp',desc:'Ein geisterhafter Wyvern, der mit kaltem Monddunst durch die Nacht gleitet.'},
 {id:24,name:'Schattenritter unter dem Violetten Mond',art:'assets/custom-art/base-024.webp',desc:'Ein finsterer Krieger mit runengetränkter Lanze, verhüllt von flatterndem Umhang.'},
 {id:25,name:'Sturmmantikor im Violetten Nebel',art:'assets/custom-art/base-025.webp',desc:'Ein rasender Bestienherr mit giftigen Klauen und einem Leib voller Sturmenergie.'},
 {id:30,name:'Kristallramme im Mondlicht',art:'assets/custom-art/base-030.webp',desc:'Ein urtümlicher Widder, dessen Hörner und Fell von leuchtenden Kristallen durchzogen sind.'},
 {id:31,name:'Untoter Wächter im Geisterfeuer',art:'assets/custom-art/base-031.webp',desc:'Ein eiserner Grabwächter, umspült von blauen Flammen und Ketten schwerer Verdammnis.'},
 {id:7,name:'Runenspeer-Krieger unter dem Purpurmond',art:'assets/custom-art/base-007.webp',desc:'Ein entschlossener Lanzenkämpfer, der unter dem Purpurmond durch die Ruinen schreitet.'},
 {id:9,name:'Schattenwolf im Mondlicht der Ruinen',art:'assets/custom-art/base-009.webp',desc:'Ein lautloser Mondjäger, der zwischen zerfallenen Bögen auf Beute lauert.'},
 {id:12,name:'Skelettkrähe im Mondlicht',art:'assets/custom-art/base-012.webp',desc:'Ein unheilvoller Knochenvogel, dessen Ruf durch die kalte Nacht hallt.'},
 {id:14,name:'Kristallhirsch im Mondlicht',art:'assets/custom-art/base-014.webp',desc:'Ein urtümlicher Hirsch, dessen Kristallgeweih im violetten Mondschein glänzt.'},
 {id:15,name:'Dunkler Ritter unter dem Violetten Mond',art:'assets/custom-art/base-015.webp',desc:'Ein finsterer Vollstrecker in zerschlagener Rüstung, aufgeladen mit violetter Arkanenergie.'},
 {id:17,name:'Kristallschakal im Mondlicht',art:'assets/custom-art/base-017.webp',desc:'Ein flinker Räuber, dessen Fell von scharfkantigen Kristallen durchbrochen wird.'},
 {id:20,name:'Mondfluch-Hexe im Mondlicht',art:'assets/custom-art/base-020.webp',desc:'Eine Hexe der Nacht, die unter dem Vollmond unheilvolle Rituale webt.'},
 {id:22,name:'Gargoyle der Mondfinsternis',art:'assets/custom-art/base-022.webp',desc:'Ein steinerner Wächter, der in der Finsternis erwacht und über die Ruinen herrscht.'},
 {id:26,name:'Drache im Mondlicht über Ruinen',art:'assets/custom-art/base-026.webp',desc:'Ein bedrohlicher Nachtdrache, der hoch über dem zerfallenen Gemäuer kreist.'},
 {id:29,name:'Sturmleviathan im Arkanen Meer',art:'assets/custom-art/base-029.webp',desc:'Ein titanischer Leviathan, der die Brandung und uralte Runenstürme beherrscht.'}
];
for(const art of CUSTOM_CARD_ART){if(CARDS[art.id])Object.assign(CARDS[art.id],art,{customArt:art.art});}
const dataOf=c=>{const t=c.card?{...CARDS[c.id],...rpgRole(c.id),...c.card,...(c.fate?{name:'✦ '+FATE_NAMES[FATE_CARD_IDS.indexOf(c.id)],art:(window.ArcaneFateVisuals?.artFor(FATE_CARD_IDS.indexOf(c.id))||CARDS[FATE_ART_IDS[FATE_CARD_IDS.indexOf(c.id)]].art),ability:undefined,desc:'Schicksalsmonster · nicht fusionierbar · nur dieses Duell.',fate:true}:{})}:CARDS[c.id];return c.essenceCombat?{...t,def:Math.min(10000,t.def+c.essenceCombat.soul+c.essenceCombat.condensed)}:t;};
function randomInt(g,max){let x=g.seed>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;g.seed=x>>>0;return g.seed%max;}
function buildDeck(g,ids=DEFAULT_DECK){const deck=[...ids],counts=new Map(ids.map(id=>[id,1]));while(deck.length<40){const options=ids.filter(id=>counts.get(id)<3),id=options[randomInt(g,options.length)];deck.push(id);counts.set(id,counts.get(id)+1);}for(let i=39;i>0;i--){const j=randomInt(g,i+1);[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}
function newInstance(g,id,owner=g.active){const c=CARDS[id],p=g.players[owner],factor=g.mode==='pve'?enhancementFactor(p?.enhancements?.[id]||0)*(p?.power||1):1;return {...(g.mode==='pve'?{card:{level:c.level,atk:round10(baseStat(c,"atk",p)),def:round10(baseStat(c,"def",p))}}:{}),uid:g.nextUid++,id,mode:'atk',attacked:false,switched:false};}
function logEvent(g,text){g.log.unshift(text);g.log.length=Math.min(80,g.log.length);}
function createClassicGame(options={}){const g={id:options.id||'test',seed:options.seed||rng(0xffffffff)||1,nextUid:1,players:[],mode:options.mode||'pvp',opponentId:options.opponentId??0,turn:1,active:0,starter:0,tiePriority:0,winner:null,winReason:'',aiPhase:"summon",summoned:false,pending:null,selection:null,materials:[],log:[],totalFusions:[0,0],damageDealt:[0,0],rewardClaimed:false,lastSummoned:null};
 g.players=[0,1].map(id=>{const deck=buildDeck(g,id===0?(options.deck||DEFAULT_DECK):DEFAULT_DECK);return {id,lp:START_LP,shield:0,deck,originalDeck:[...deck],hand:[],field:Array(5).fill(null),graveyard:[]};});
 g.starter=options.starter??randomInt(g,2);g.active=g.starter;g.tiePriority=options.tiePriority??randomInt(g,2);g.players[1-g.starter].shield=OPENING_SHIELD;g.players.forEach(p=>drawToFive(g,p));logEvent(g,`Duellant ${g.starter+1} beginnt. Duellant ${2-g.starter} erhält ein Eröffnungsschild für ${OPENING_SHIELD} Kampfschaden.`);return g;
}
function drawToFive(g,p){while(p.hand.length<5&&p.deck.length)p.hand.push(newInstance(g,p.deck.pop(),p.id));}
function roundNumber(g){return Math.ceil(g.turn/2);}
function arenaDamage(round){return round<=9?0:Math.min(START_LP,200*2**(round-10));}
function conclude(g,winner,reason){if(g.winner!==null)return;g.winner=winner;g.winReason=reason;g.selection=null;g.materials=[];g.pending=null;logEvent(g,`Duellant ${winner+1} gewinnt: ${reason}`);}
function settleRound(g){const damage=arenaDamage(roundNumber(g));if(!damage)return;const before=g.players.map(p=>p.lp);g.players.forEach(p=>p.lp=Math.max(0,p.lp-damage));logEvent(g,`Arena-Zerfall: beide verlieren ${damage} LP am Ende von Runde ${roundNumber(g)}.`);const dead=g.players.map(p=>p.lp===0);if(dead[0]&&dead[1]){const w=before[0]===before[1]?g.tiePriority:(before[0]>before[1]?0:1);conclude(g,w,before[0]===before[1]?'Arena-Zerfall: Gleichstand, ausgeloste Entscheidungsinitiative.':'Arena-Zerfall: mehr LP unmittelbar vor dem gemeinsamen Schaden.');}else if(dead[0]||dead[1])conclude(g,dead[0]?1:0,'Lebenspunkte durch Arena-Zerfall auf 0.');}
function nextPlayer(g){return 1-g.active;}
function fatePressure(g,id){
 const own=g.players[id],foe=g.players[1-id],lpRatio=own.lp/Math.max(1,g.maxLP);
 const life=lpRatio<=.1?40:lpRatio<=.2?35:lpRatio<=.35?25:lpRatio<=.5?15:lpRatio<=.65?5:0;
 const ours=own.field.filter(Boolean),theirs=foe.field.filter(Boolean);
 const oursPower=ours.reduce((n,c)=>n+Math.max(dataOf(c).atk,dataOf(c).def),0);
 const theirsPower=theirs.reduce((n,c)=>n+Math.max(dataOf(c).atk,dataOf(c).def),0);
 const field=!theirs.length?0:!ours.length?40:theirsPower>=oursPower*1.7?30:theirsPower>=oursPower*.85?10:0;
 // Approximate a lethal attack from the visible opposing board, accounting for guards.
 const openThreat=Math.max(0,theirs.reduce((n,c)=>n+(c.mode==='atk'?dataOf(c).atk:0),0)-
  ours.reduce((n,c)=>n+Math.max(dataOf(c).atk,dataOf(c).def),0));
 const lethal=theirs.length>0&&openThreat>=own.lp+own.shield;
 return {score:life+field+(lethal?20:0),life,field,lethal};
}
function fateReference(g,id){
 const foe=g.players[1-id];let strongest=null;
 for(const cid of foe.deck){const t=CARDS[cid];if(!t)continue;const candidate={atk:baseStat(t,'atk',foe),def:baseStat(t,'def',foe)};
  if(!strongest||candidate.atk+candidate.def>strongest.atk+strongest.def)strongest=candidate;}
 for(const c of [...foe.field.filter(Boolean),...foe.graveyard]){const t=dataOf(c);
  if(!strongest||t.atk+t.def>strongest.atk+strongest.def)strongest={atk:t.atk,def:t.def};}
 return strongest||{atk:500,def:500};
}
function maybeFate(g,id){
 if(g.mode!=='pve'||roundNumber(g)<3||g.fateUsed?.[id]||g.winner!==null)return false;
 const pressure=fatePressure(g,id),chance=pressure.score>=90?5:pressure.score>=75?3:pressure.score>=60?1:0;
 if(!chance||randomInt(g,100)>=chance)return false;
 const p=g.players[id],reference=fateReference(g,id);
 // Returning hand cards to the deck preserves deck exhaustion and 40-card origin.
 p.deck.push(...p.hand.filter(c=>!isFateCard(c)).map(c=>c.id));p.hand=[];
 for(let i=p.deck.length-1;i>0;i--){const j=randomInt(g,i+1);[p.deck[i],p.deck[j]]=[p.deck[j],p.deck[i]];}
 const pool=[...FATE_CARD_IDS];for(let i=pool.length-1;i>0;i--){const j=randomInt(g,i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
 const chosen=pool.slice(0,5);for(const cid of chosen){const c=newInstance(g,cid,id);
  c.card={level:CARDS[cid].level,atk:Math.min(10000,reference.atk+100),def:Math.min(10000,reference.def+100)};
  c.fate=true;p.hand.push(c);}
 g.fateUsed[id]=true;g.fateEvent={owner:id,cards:chosen,score:pressure.score};
 logEvent(g,'✦ SCHICKSALSZUG! Duellant '+(id+1)+' zieht fünf unverschmelzbare Schicksalsmonster.');
 return true;
}
function coreAdvanceTurn(g){if(g.winner!==null||g.pending)return false;if(g.turn%2===0){settleRound(g);if(g.winner!==null)return true;}g.active=nextPlayer(g);g.turn++;g.aiPhase="summon";g.summoned=false;g.selection=null;g.materials=[];g.lastSummoned=null;const p=g.players[g.active];p.field.forEach(c=>{if(c){c.attacked=false;c.switched=false;}});if(!p.deck.length){conclude(g,1-g.active,'Deck zu Beginn des eigenen Zuges leer.');return true;}maybeFate(g,g.active);const old=p.hand.length;drawToFive(g,p);logEvent(g,`Duellant ${g.active+1}: Zug ${g.turn}, ${p.hand.length-old} Karte(n) gezogen.`);return true;}
function fusionBudget(levels,g){return Math.min(g?.mode==='pve'?12:8,levels.reduce((a,b)=>a+b,0),Math.max(...levels)+(g?.mode==='pve'?2:1));}


function qualityRolls(levels){const quality=levels.reduce((a,b)=>a+b,0)-Math.max(...levels);return 1+Math.min(3,Math.floor(quality/2));}
function classicFusedInstance(g,instances,levels){if(g.mode==='pve'){const pool=fusionOptions(g,levels);if(!pool.length)return null;const template=pool[randomInt(g,pool.length)],p=g.players[g.active],factor=enhancementFactor(p.enhancements[template.id]||0)*p.power,rolls=qualityRolls(levels);let best=null;for(let i=0;i<rolls;i++){const roll={atk:round10((baseStat(template,"atk",p))*(.94+randomInt(g,13)/100)),def:round10((baseStat(template,"def",p))*(.94+randomInt(g,13)/100))};if(!best||roll.atk+roll.def>best.atk+best.def)best=roll;}best.atk=Math.max(best.atk,Math.ceil(Math.max(...instances.map(c=>dataOf(c).atk))*.95/10)*10);best.def=Math.max(best.def,Math.ceil(Math.max(...instances.map(c=>dataOf(c).def))*.95/10)*10);return {...newInstance(g,template.id),card:{level:template.level,...best},fusion:true,qualityRolls:rolls,attacked:instances.some(c=>c.attacked)};}const level=fusionLevel(levels,g),pool=CARDS.filter(c=>c.level===level&&c.id<35),template=pool[randomInt(g,pool.length)],pairs=statPools[level];let stats=null;const rolls=qualityRolls(levels);for(let i=0;i<rolls;i++){const candidate=pairs[randomInt(g,pairs.length)];if(!stats||candidate.atk+candidate.def>stats.atk+stats.def||candidate.atk+candidate.def===stats.atk+stats.def&&candidate.atk>stats.atk)stats=candidate;}return {...newInstance(g,template.id),card:{level,...stats},fusion:true,qualityRolls:rolls,attacked:instances.some(c=>c.attacked)};}
function prepareNormal(g,uid){if(g.winner!==null||g.summoned||g.pending)return false;const c=g.players[g.active].hand.find(c=>c.uid===uid);if(!c)return false;g.pending={kind:'normal',card:c,levels:[dataOf(c).level]};g.selection=null;g.materials=[];return true;}
function corePrepareHandFusion(g,uids){if(g.winner!==null||g.summoned||g.pending||uids.length<2||uids.length>5||new Set(uids).size!==uids.length)return false;const p=g.players[g.active],m=uids.map(id=>p.hand.find(c=>c.uid===id));if(m.some(c=>!c||isFateCard(c)))return false;const last=m.slice(-2),levels=last.map(c=>dataOf(c).level),result=fusedInstance(g,last,levels);if(!result)return false;p.hand=p.hand.filter(c=>!uids.includes(c.uid));p.graveyard.push(...m);g.pending={kind:'fusion',card:result,levels};g.materials=[];g.selection=null;g.totalFusions[g.active]++;logEvent(g,`${m.length-2} Abwurf; Handfusion → ${dataOf(result).name}, Lv ${dataOf(result).level}, Qualität ${result.qualityRolls} Würfe.`);return true;}
function corePlacePending(g,idx){if(g.winner!==null||g.summoned||!g.pending||!Number.isInteger(idx)||idx<0||idx>4)return null;const p=g.players[g.active],pending=g.pending,old=p.field[idx],incoming=pending.card;if(old&&(isFateCard(old)||isFateCard(incoming)))return null;let result=old?fusedInstance(g,[incoming,old],[...pending.levels,dataOf(old).level]):incoming;if(!result)return null;if(pending.kind==='normal'){const ix=p.hand.findIndex(c=>c.uid===incoming.uid);if(ix<0)return null;p.hand.splice(ix,1);}if(old){p.graveyard.push(incoming,old);g.totalFusions[g.active]++;logEvent(g,`Feldfusion in Zone ${idx+1}: Lv ${dataOf(result).level}.${result.attacked?' Angriff bleibt verbraucht.':''}`);}result.mode='atk';result.switched=false;p.field[idx]=result;g.pending=null;g.summoned=true;g.selection={type:'field',idx};g.lastSummoned=result.uid;logEvent(g,`${dataOf(result).name} (${dataOf(result).atk}/${dataOf(result).def}) in Zone ${idx+1}.`);return {card:result,fused:!!old};}
function canAttack(g,c){return !!c&&g.winner===null&&!g.pending&&c.mode==='atk'&&g.turn!==1&&(!c.attacked||(g.essenceRules&&CARDS[c.id]?.essenceSchool==='predator'&&c.essenceCombat?.doubleChoice===2&&c.essenceCombat?.attacksThisTurn===1));}
function switchPosition(g,idx){const c=g.players[g.active].field[idx];if(g.winner!==null||g.pending||!c||c.switched)return false;c.mode=c.mode==='atk'?'def':'atk';c.switched=true;logEvent(g,`${dataOf(c).name}: ${c.mode==='atk'?'Angriffs':'Verteidigungs'}position.`);return true;}
function damagePlayer(g,id,amount){const p=g.players[id],absorbed=Math.min(p.shield,amount);p.shield-=absorbed;const actual=amount-absorbed;p.lp=Math.max(0,p.lp-actual);if(absorbed)logEvent(g,`Schutzschild von Duellant ${id+1} absorbiert ${absorbed} Schaden.`);return actual;}
function attack(g,ai,di){const p=g.players[g.active],e=g.players[1-g.active],a=p.field[ai],d=di===null?null:e.field[di];if(!canAttack(g,a)||di!==null&&!d||di===null&&e.field.some(Boolean))return null;const baseAtk=dataOf(a),dt=d?dataOf(d):null,at={...baseAtk,atk:effectiveAttack(g,a,d)};let damage=0,damaged=null,destroyed=[];
 if(di===null){damage=damagePlayer(g,e.id,at.atk);damaged=e.id;g.damageDealt[p.id]+=damage;logEvent(g,`${at.name}: direkter Angriff, ${damage} Schaden.`);}else if(d.mode==='atk'){
  if(at.atk>=dt.atk){e.graveyard.push(d);e.field[di]=null;destroyed.push(e.id+':'+di);}if(at.atk<=dt.atk){p.graveyard.push(a);p.field[ai]=null;destroyed.push(p.id+':'+ai);}if(at.atk!==dt.atk){damaged=at.atk>dt.atk?e.id:p.id;damage=damagePlayer(g,damaged,Math.floor(Math.abs(at.atk-dt.atk)));g.damageDealt[1-damaged]+=damage;}logEvent(g,`${at.name} gegen ${dt.name}: ${damage} LP Schaden.`);
 }else {if(at.atk>dt.def){e.graveyard.push(d);e.field[di]=null;destroyed.push(e.id+':'+di);logEvent(g,`${at.name} durchbricht ${dt.name}${damage?' · '+damage+' Durchbruchschaden':''}.`);}else if(at.atk<dt.def){damaged=p.id;damage=damagePlayer(g,p.id,dt.def-at.atk);logEvent(g,`${dt.name} hält stand: ${damage} Schaden beim Angreifer.`);}else logEvent(g,'Gleichstand gegen Verteidigung.');}
 if(p.field[ai]===a){a.attacked=true;if(g.mode==='pve'){const fatigue=g.active===0?30-2*(profile?.upgrades?.combatDiscipline||0):30;a.card.atk=Math.max(0,dataOf(a).atk-fatigue);a.attackFatigue=(a.attackFatigue||0)+fatigue;logEvent(g,`${dataOf(a).name}: −${fatigue} ATK durch den Angriff.`);}}if(e.lp===0)conclude(g,p.id,'Lebenspunkte des Gegners auf 0.');else if(p.lp===0)conclude(g,e.id,'Lebenspunkte des Angreifers auf 0.');g.selection=null;return {damage,damaged,destroyed,ai,di};
}
function attackPlan(g){
 const p=g.players[g.active],e=g.players[1-g.active];
 const attackers=p.field.map((c,i)=>({c,i})).filter(x=>canAttack(g,x.c)).sort((a,b)=>dataOf(a.c).atk-dataOf(b.c).atk);
 const targets=e.field.map((c,j)=>({c,j,value:c?(c.mode==='atk'?dataOf(c).atk:dataOf(c).def):0})).filter(x=>x.c).sort((a,b)=>a.value-b.value);
 if(!attackers.length)return null;
 if(!targets.length){
  if(g.mode!=='pve')return {ai:attackers[0].i,di:null}; // PvP keeps its original attack priority.
  // With the new post-attack fatigue, the finishing blow takes priority.
  const lethal=attackers.filter(x=>effectiveAttack(g,x.c,null)>=e.lp+e.shield);
  return {ai:(lethal.length?lethal[0]:attackers[0]).i,di:null};
 }
 // Early opponents intentionally keep their easy-to-read, basic AI.
 // Tournament opponents III-X learn to eliminate the biggest live threat
 // with the weakest safe attacker instead of always attacking the smallest card.
 if(g.mode==='pve'&&g.active===1&&g.opponentId>=3){
  let best=null;
  for(const a of attackers)for(const t of targets){
   const strength=effectiveAttack(g,a.c,t.c),victim=dataOf(t.c),attacker=dataOf(a.c);
   const kill=strength>t.value,tie=t.c.mode==='atk'&&strength===t.value&&victim.level>=attacker.level;
   if(!kill&&!tie)continue; // Never suicide into a defensive wall.
   const threat=victim.atk+(t.c.fusion?180:0);
   const priority=threat*1.5+(t.c.mode==='def'?victim.def*.20:0)
     -attacker.atk*.20+(kill?100:0)-(tie?300:0);
   if(!best||priority>best.priority)best={ai:a.i,di:t.j,priority};
  }
  if(best)return {ai:best.ai,di:best.di};
  return null;
 }
 for(const {c,i}of attackers){
  const kill=targets.find(x=>effectiveAttack(g,c,x.c)>x.value);if(kill)return {ai:i,di:kill.j};
  const tie=targets.find(x=>x.c.mode==='atk'&&effectiveAttack(g,c,x.c)===x.value&&dataOf(x.c).level>=dataOf(c).level);
  if(tie)return {ai:i,di:tie.j};
 }
 return null;
}
function coreChooseAiAction(g,policy='balanced'){
 const p=g.players[g.active],hand=[...p.hand].sort((a,b)=>dataOf(b).level-dataOf(a).level||dataOf(b).atk-dataOf(a).atk),field=p.field.map((c,i)=>({c,i})).filter(x=>x.c),empty=p.field.findIndex(c=>!c),grow=[...field].filter(x=>dataOf(x.c).level<(g.mode==='pve'?Math.max(...p.fusionDeck.map(id=>CARDS[id].level)):8)).sort((a,b)=>dataOf(b.c).level-dataOf(a.c).level)[0];
 if(g.pending){const weak=[...field].sort((a,b)=>dataOf(a.c).atk-dataOf(b.c).atk)[0];return {type:'place',idx:grow?grow.i:empty>=0?empty:weak.i};}
 for(let step=0;step<6;step++){
  const phase=g.aiPhase||'summon';
  if(phase==='summon'){g.aiPhase='positions';if(!g.summoned&&hand.length){
   if(policy==='novice'&&g.mode!=='pve'){if(empty>=0)return {type:'normal',uid:strongest.uid};}
   else if(policy==='economy'&&grow){const feed=[...hand].sort((a,b)=>dataOf(a).level-dataOf(b).level||dataOf(a).atk-dataOf(b).atk)[0];return {type:'normal',uid:feed.uid};}
   else if(hand.length>=2&&(grow||empty>=0||field.some(x=>dataOf(x.c).atk<(g.mode==='pve'?Math.max(...p.fusionDeck.map(id=>CARDS[id].atk))*p.power:1000))))return {type:'fusion',uids:hand.slice(0,2).map(c=>c.uid)};
   else if(hand.length===1&&(grow||empty>=0))return {type:'normal',uid:hand[0].uid};
  }}
  else if(phase==='positions'){const targets=g.players[1-g.active].field.filter(Boolean);const def=field.find(x=>x.c.mode==='def'&&!x.c.switched&&!x.c.attacked&&(targets.length===0||targets.some(t=>effectiveAttack(g,x.c,t)>(t.mode==='atk'?dataOf(t).atk:dataOf(t).def))));if(def)return {type:'switch',idx:def.i};g.aiPhase='attacks';}
  else if(phase==='attacks'){const plan=attackPlan(g);if(plan)return {type:'attack',...plan};g.aiPhase='guard';}
  else if(phase==='guard'){if(['balanced','economy','guardian'].includes(policy)){const threat=Math.max(0,...g.players[1-g.active].field.filter(Boolean).map(c=>dataOf(c).atk)),guard=field.find(x=>x.c.mode==='atk'&&!x.c.switched&&(dataOf(x.c).def>dataOf(x.c).atk||threat>=dataOf(x.c).atk));if(guard)return {type:'switch',idx:guard.i};}g.aiPhase='end';}
  else return {type:'end'};
 }
 return {type:'end'};
}
function applyAiAction(g,a){if(g.winner!==null)return null;switch(a.type){case 'normal':return prepareNormal(g,a.uid);case 'fusion':return prepareHandFusion(g,a.uids);case 'place':return placePending(g,a.idx);case 'switch':return switchPosition(g,a.idx);case 'attack':return attack(g,a.ai,a.di);case 'end':return advanceTurn(g);default:throw Error('Unbekannte KI-Aktion.');}}
function aiTurn(g,policy='balanced'){const turn=g.turn;for(let i=0;i<40&&g.winner===null&&g.turn===turn;i++){const a=chooseAiAction(g,policy);if(!applyAiAction(g,a))throw Error('KI konnte ihre Aktion nicht ausführen: '+a.type);}if(g.winner===null&&g.turn===turn)throw Error('KI-Zug konnte nicht beendet werden.');}
function simulateGame(g,playerPolicy='balanced',enemyPolicy='balanced'){for(let i=0;i<32&&g.winner===null;i++)aiTurn(g,g.active===0?playerPolicy:enemyPolicy);if(g.winner===null)throw Error('Duell konnte nicht abgeschlossen werden.');return g;}

function coreCreateGame(options={}){const g=createClassicGame(options);g.maxLP=START_LP;g.context=options.context||'free';if(g.mode==='pve'){const baseEnemy=options.enemy||rpgEnemyLoadout(g.opponentId,options.difficulty,options.trainingStage),enemy={...baseEnemy,power:baseEnemy.power*(g.opponentId>0&&g.context!=='tournament'&&g.context!=='challenge'&&options.difficulty!=='hard'?.9:1)},loadouts=[{deck:options.deck||RPG_DEFAULT_DECK,fusionDeck:options.fusionDeck||RPG_START_FUSIONS,enhancements:options.enhancements||{},power:1,flatBonus:options.challenge==='untrained'?0:(options.flatBonus||0)},enemy];g.players=loadouts.map((l,id)=>{const allowed=id===1&&options.showcase?CARDS.filter(c=>c.rpg&&!c.fusionOnly&&!c.ace&&c.level>=8&&c.level<=10).map(c=>c.id):RPG_BASE_CARDS.map(c=>c.id);if(mainDeckError(l.deck,allowed))throw Error(mainDeckError(l.deck,allowed));if(fusionDeckError(l.fusionDeck))throw Error(fusionDeckError(l.fusionDeck));const deck=buildDeck(g,l.deck);return {id,lp:START_LP,shield:id===1-g.starter?OPENING_SHIELD:0,deck,originalDeck:[...deck],fusionDeck:[...l.fusionDeck],enhancements:{...l.enhancements},power:l.power||1,flatBonus:l.flatBonus||0,hand:[],field:Array(5).fill(null),graveyard:[]};});g.players.forEach(p=>drawToFive(g,p));}return g;}

function fusionOptions(g,levels){const limit=fusionBudget(levels,g),p=g.players[g.active];return [...new Set(p.remainingFusion||p.fusionDeck)].map(id=>CARDS[id]).filter(c=>c.level<=limit);}
function fusionLevel(levels,g){return g?.mode==='pve'?Math.max(0,...fusionOptions(g,levels).map(c=>c.level)):fusionBudget(levels,g);}
function fusedInstance16(g,instances,levels){if(g.mode!=='pve')return classicFusedInstance(g,instances,levels);const pool=fusionOptions(g,levels),p=g.players[g.active];if(!pool.length)return null;const template=g.fusionChoice!==undefined?pool.find(c=>c.id===g.fusionChoice):[...pool].sort((a,b)=>b.level-a.level||b.atk-a.atk)[0];if(!template)return null;const factor=enhancementFactor(p.enhancements[template.id]||0)*p.power,rolls=Math.min(4,qualityRolls(levels)+0);let best=null;for(let i=0;i<rolls;i++){const roll={atk:round10((baseStat(template,"atk",p))*(.94+randomInt(g,13)/100)),def:round10((baseStat(template,"def",p))*(.94+randomInt(g,13)/100))};if(!best||roll.atk+roll.def>best.atk+best.def)best=roll;}best.atk=Math.max(best.atk,Math.ceil(Math.max(...instances.map(c=>dataOf(c).atk))*.95/10)*10);best.def=Math.max(best.def,Math.ceil(Math.max(...instances.map(c=>dataOf(c).def))*.95/10)*10);p.remainingFusion.splice(p.remainingFusion.indexOf(template.id),1);logEvent(g,`${template.name}: eine Fusionskopie verbraucht (${countCard(p.remainingFusion,template.id)} übrig).`);return {...newInstance(g,template.id),card:{level:template.level,...best},fusion:true,qualityRolls:rolls,attacked:instances.some(c=>c.attacked)};}
function prepareHandFusion(g,uids,choice){if(g.mode==='pve'){const materials=uids.slice(-2).map(uid=>g.players[g.active].hand.find(c=>c.uid===uid));if(materials.some(c=>!c||isFateCard(c))||materials.length!==2)return false;const levels=materials.map(c=>dataOf(c).level),options=fusionOptions(g,levels).filter(c=>canCompleteHandFusion(g,levels,c.id));if(choice===undefined)choice=options.sort((a,b)=>b.level-a.level||b.atk-a.atk)[0]?.id;if(!options.some(c=>c.id===choice))return false;}g.fusionChoice=choice;try{const strongest=Math.max(0,...uids.slice(-2).map(uid=>(g.players[g.active].hand.find(c=>c.uid===uid)?dataOf(g.players[g.active].hand.find(c=>c.uid===uid)).atk:0)));const result=corePrepareHandFusion(g,uids);if(result&&g.mode==='pve'&&g.active===0&&dataOf(g.pending.card).atk<strongest)g.findings.loss=true;return result;}finally{delete g.fusionChoice;}}
function placePending16(g,idx,choice){g.fusionChoice=choice;const old=g.players[g.active].field[idx],pending=g.pending;try{const result=corePlacePending(g,idx);if(result&&g.mode==='pve'){const t=dataOf(result.card),p=g.players[g.active];if(g.active===0&&old&&pending&&t.atk<Math.max(dataOf(old).atk,dataOf(pending.card).atk))g.findings.loss=true;}return result;}finally{delete g.fusionChoice;}}
function advanceTurn16(g){if(g.mode==='pve'&&g.active===0&&!g.pending&&g.winner===null){if(attackPlan(g))g.findings.attack=true;const h=g.players[0].hand;if(h.length>=2&&!h.some((a,i)=>h.slice(i+1).some(b=>fusionOptions(g,[dataOf(a).level,dataOf(b).level]).length)))g.findings.bridge=true;}return coreAdvanceTurn(g);}
function chooseAiAction(g,policy='balanced'){if(g.mode!=='pve')return coreChooseAiAction(g,policy);const p=g.players[g.active];if(g.pending){const empty=p.field.findIndex(c=>!c);const incoming=dataOf(g.pending.card);const old=p.field.map((c,i)=>({c,i})).filter(x=>x.c&&!isFateCard(x.c)&&!isFateCard(g.pending.card)&&fusionOptions(g,[...g.pending.levels,dataOf(x.c).level]).some(t=>t.level>Math.max(dataOf(x.c).level,incoming.level)&&baseStat(t,"atk",p)>Math.max(dataOf(x.c).atk,incoming.atk)*1.08));if(old.length)return {type:'place',idx:old.sort((a,b)=>dataOf(b.c).level-dataOf(a.c).level)[0].i};if(empty>=0)return {type:'place',idx:empty};const possible=p.field.findIndex(c=>!isFateCard(c)&&!isFateCard(g.pending.card)&&fusionOptions(g,[...g.pending.levels,dataOf(c).level]).length);if(possible>=0)return {type:'place',idx:possible};throw Error('Kein legaler Platz für bestätigte Beschwörung.');}
 if(g.aiPhase==='summon'&&!g.summoned&&p.hand.length){g.aiPhase='positions';const empty=p.field.findIndex(c=>!c),hand=[...p.hand].sort((a,b)=>dataOf(b).level-dataOf(a).level||dataOf(b).atk-dataOf(a).atk);const levels=hand.slice(0,2).map(c=>dataOf(c).level),opts=hand.length>1&&!hand.slice(0,2).some(isFateCard)?fusionOptions(g,levels):[];const strongest=[...hand].sort((a,b)=>(isFateCard(b)?100000:normalAiScore(g,b,policy))-(isFateCard(a)?100000:normalAiScore(g,a,policy)))[0],bestExpected=Math.max(0,...opts.map(c=>baseStat(c,"atk",p)));if(opts.length&&empty>=0&&bestExpected>dataOf(strongest).atk*(policy==='economy'?1.25:policy==='offensive'?1.18:1.08))return {type:'fusion',uids:hand.slice(0,2).map(c=>c.uid)};if(empty>=0)return {type:'normal',uid:strongest.uid};const canFeed=hand.find(c=>!isFateCard(c)&&p.field.some(old=>!isFateCard(old)&&fusionOptions(g,[dataOf(c).level,dataOf(old).level]).length));if(canFeed)return {type:'normal',uid:canFeed.uid};if(empty<0&&p.hand.every(isFateCard))g.aiPhase='positions';}
 return coreChooseAiAction(g,policy);}
function createGame16(options={}){const g=coreCreateGame(options);g.rulesVersion=4;g.trainingStage=g.mode==='pve'&&g.opponentId===0?(options.trainingStage??trainingStage()):null;g.difficulty=options.difficulty||'easy';g.challenge=options.challenge||null;g.boosted=options.boosted===true;g.findings={attack:false,loss:false,bridge:false};if(g.mode==='pve')g.players.forEach(p=>{p.remainingFusion=[...p.fusionDeck];});return g;}

function canCompleteHandFusion(g,levels,choice){const p=g.players[g.active];if(p.field.some(c=>!c))return true;const remain=[...p.remainingFusion],i=remain.indexOf(choice);if(i<0)return false;remain.splice(i,1);return p.field.some(c=>remain.some(id=>CARDS[id].level<=fusionBudget([...levels,dataOf(c).level],g)));}

function effectiveAttack(g,a,d){const c=dataOf(a);return Math.floor(c.atk);}
function normalAiScore(g,c,policy){const t=dataOf(c),enemy=g.players[1-g.active];return t.atk;}

// Normal tournament and free duels share the same LP tiers by opponent number.
// Training stays at 4,000; hard mode and classic PvP retain their own 8,000 LP rules.
function duelStartingLP(mode,opponentId=0,difficulty='easy',context='free',showcase=false){
 if(mode==='pvp')return 8000;
 if(difficulty==='hard')return opponentId>=9?10000:8000;
 if(showcase)return 8000;
 if(mode!=='pve'||!Number.isInteger(opponentId)||opponentId<=3)return 4000;
 if(opponentId<=6)return 6000;
 if(opponentId<=8)return 7000;
 return 10000;
}
function createGame(options={}){const g=createGame16(options);g.rulesVersion=5;g.maxLP=duelStartingLP(g.mode,g.opponentId,g.difficulty,g.context,options.showcase===true);g.players.forEach(p=>p.lp=g.maxLP);if(g.mode==='pve')g.players[0].shield=Math.min(600,g.players[0].shield+25*(profile?.upgrades?.openingAegis||0));g.fateUsed=[false,false];g.fateEvent=null;g.encounter=options.encounter?JSON.parse(JSON.stringify(options.encounter)):null;
 if(g.mode==='pve'&&g.context==='tournament'&&g.opponentId>0&&!profile.cleared.includes(g.opponentId)&&!(profile.tournamentLosses?.[g.opponentId]>0)){
 const ace=CARDS[OPPONENTS[g.opponentId].signature],best=Math.max(...g.players[0].originalDeck.map(id=>baseStat(CARDS[id],'atk',g.players[0])));const boost=Math.min(.12,Math.max(0,(best-ace.atk)/Math.max(1,ace.atk)));
 if(boost>0){g.firstTrialBoost=boost;g.players[1].power=(g.players[1].power||1)*(1+boost);for(const c of [...g.players[1].hand,...g.players[1].field.filter(Boolean)])if(c?.card){c.card.atk=round10(c.card.atk*(1+boost));c.card.def=round10(c.card.def*(1+boost));}}
 }return g;}
function fusionPenalty(g){return g.mode==='pve'&&g.active===1&&g.context==='tournament'?(g.opponentId===1?100:g.opponentId===2?50:0):0;}
function materialBase(c,stat){return Math.max(0,dataOf(c)[stat]-(c.materialBonus?.[stat]||0));}
function materialBlocks(g,instances){return instances.flatMap(c=>c.fusion?Array(Math.min(12,dataOf(c).level)).fill(10):Array(g.players[g.active].enhancements[c.id]||0).fill(20)).slice(0,24);}
function fusedInstance(g,instances,levels){if(g.mode!=='pve')return classicFusedInstance(g,instances,levels);const pool=fusionOptions(g,levels),p=g.players[g.active],template=g.fusionChoice!==undefined?pool.find(c=>c.id===g.fusionChoice):[...pool].sort((a,b)=>b.level-a.level||b.atk-a.atk)[0];if(!template)return null;const rolls=Math.min(4,qualityRolls(levels)+0+(g.mode==='pve'&&g.active===0&&!g.totalFusions[0]?(profile?.upgrades?.fusionLore||0):0));let best=null;for(let n=0;n<rolls;n++){const roll={atk:round10(baseStat(template,'atk',p)*(.94+randomInt(g,13)/100)),def:round10(baseStat(template,'def',p)*(.94+randomInt(g,13)/100))};if(!best||roll.atk+roll.def>best.atk+best.def)best=roll;}
const bonus={atk:0,def:0};for(const n of materialBlocks(g,instances))bonus[randomInt(g,2)?'atk':'def']+=n;for(const stat of ['atk','def'])best[stat]=Math.max(0,Math.max(best[stat],Math.ceil(Math.max(...instances.map(c=>materialBase(c,stat)))*.95/10)*10)+bonus[stat]-fusionPenalty(g));
p.remainingFusion.splice(p.remainingFusion.indexOf(template.id),1);logEvent(g,template.name+': Fusionskopie verbraucht. Die endgültigen Werte werden erst nach dem Ausspielen enthüllt.');return {...newInstance(g,template.id),card:{level:template.level,...best},fusion:true,materialBonus:bonus,qualityRolls:rolls,attacked:instances.some(c=>c.attacked)};}
function placePending(g,idx,choice){const result=placePending16(g,idx,choice);if(result&&g.mode==='pve'){const c=result.card;c.summonedTurn=g.turn;c.decayClass=c.fusion?'fusion':c.id<20?'starter':'normal';c.decayTotal=0;}return result;}
function advanceTurn(g){if(g.winner===null&&!g.pending&&g.mode==='pve'){for(const c of g.players[g.active].field.filter(Boolean)){if(c.summonedTurn===g.turn)continue;const base=c.decayClass==='starter'?20:c.fusion?25:30;const amount=Math.max(c.decayClass==='starter'?10:c.fusion?15:20,base-5*(c.decayAge||0)-(g.active===0?(profile?.upgrades?.resilience||0)*3:0));for(const stat of ['atk','def'])c.card[stat]=Math.max(0,c.card[stat]-amount);c.decayTotal=(c.decayTotal||0)+amount;c.decayAge=(c.decayAge||0)+1;logEvent(g,dataOf(c).name+': Kreaturenzerfall −'+amount+' ATK/DEF · Überlebensbonus für spätere Züge.');}}return advanceTurn16(g);}

// RPG pools are independent of the neutral local PvP catalogue.
const RPG_START_FUSIONS=[CARDS.length,CARDS.length+1];
function addRpgCard(spec){const id=CARDS.length;CARDS.push({kind:'dragon',element:'LICHT',color:'#e8c879',desc:'RPG-Monster',rpg:true,...spec,id});return id;}
addRpgCard({name:'Funkenwyrm',level:2,atk:460,def:350,kind:'serpent',element:'FEUER',color:'#eda46e',source:-1,fusionOnly:true,desc:'Startfusion · Brücke zu höheren Stufen.'});
addRpgCard({name:'Runengreif',level:4,atk:900,def:720,kind:'bird',element:'WIND',color:'#a0ccdf',source:-1,fusionOnly:true,desc:'Startfusion · durch stärkeren Loot ersetzbar.'});
// Level 11/12 are reserved for a later post-tournament expansion.
// Keep their technical IDs stable, but do not expose them in current gameplay.
const TOURNAMENT_LEVEL_CAP=10;
const RPG_OPPONENTS=[
 {id:0,name:'Moos-Training',title:'Freies Training',level:4,policy:'novice',power:.82,coins:18,xp:12,icon:'◇',theme:'Moos',kind:'golem',element:'ERDE',color:'#97cfa8'},
 {id:1,name:'Der Eisenprüfer',title:'I · Tor der Arena',level:4,policy:'balanced',power:.90,coins:30,xp:24,icon:'Ⅰ',theme:'Eisen',kind:'knight',element:'ERDE',color:'#b7c6d6'},
 {id:2,name:'Die Rubinmagierin',title:'II · Gluthalle',level:5,policy:'offensive',power:.85,coins:45,xp:32,icon:'Ⅱ',theme:'Rubin',kind:'mage',element:'FEUER',color:'#ee9cac'},
 {id:3,name:'Die Dornengarde',title:'III · Wilder Hain',level:6,policy:'guardian',power:.99,coins:65,xp:42,icon:'Ⅲ',theme:'Dornen',kind:'stag',element:'ERDE',color:'#9bce8c'},
 {id:4,name:'Der Gezeitenfürst',title:'IV · Versunkener Hof',level:7,policy:'economy',power:1.02,coins:90,xp:54,icon:'Ⅳ',theme:'Gezeiten',kind:'serpent',element:'WASSER',color:'#8bdfeb'},
 {id:5,name:'Der Vulkanrichter',title:'V · Brennender Thron',level:8,policy:'offensive',power:1.04,coins:125,xp:68,icon:'Ⅴ',theme:'Vulkan',kind:'golem',element:'FEUER',color:'#f2a178'},
 {id:6,name:'Der Schattenjäger',title:'VI · Nachtpfad',level:9,policy:'balanced',power:1.08,coins:170,xp:84,icon:'Ⅵ',theme:'Schatten',kind:'wolf',element:'DUNKEL',color:'#b09adf'},
 {id:7,name:'Der Himmelswächter',title:'VII · Wolkenfestung',level:10,policy:'guardian',power:1.14,coins:230,xp:102,icon:'Ⅶ',theme:'Himmels',kind:'bird',element:'WIND',color:'#c9dfed'},
 {id:8,name:'Der Runenarchont',title:'VIII · Sternenarchiv',level:10,policy:'economy',power:1.10,coins:310,xp:122,icon:'Ⅷ',theme:'Runen',kind:'mage',element:'LICHT',color:'#eed694'},
 {id:9,name:'Die Leerenkönigin',title:'IX · Letzter Abgrund',level:10,policy:'balanced',power:1.11,coins:420,xp:144,icon:'Ⅸ',theme:'Leeren',kind:'spirit',element:'DUNKEL',color:'#d2a0ef'},
 {id:10,name:'Der Astralkaiser',title:'X · Finale',level:10,policy:'balanced',power:1.12,coins:580,xp:170,icon:'Ⅹ',theme:'Astral',kind:'dragon',element:'LICHT',color:'#fff0b7'}
];
const FUSION_POWER={2:440,4:900,5:1110,6:1350,7:1610,8:1890,9:2200,10:2540,11:2890,12:3260};
const round10=n=>Math.round(n/10)*10;
for(const o of RPG_OPPONENTS){const base=FUSION_POWER[o.level]*(o.id===0?.98:o.id===10?1.12:1.04),basic=380+o.id*105;
 o.loot=[
 addRpgCard({name:o.theme+'läufer',kind:'wolf',element:o.element,color:o.color,source:o.id,level:2,atk:round10(basic*.9),def:round10(basic*.7),fusionOnly:false,desc:'Beute: '+o.name}),
 addRpgCard({name:o.theme+'wächter',kind:'knight',element:o.element,color:o.color,source:o.id,level:3,atk:round10(basic*1.08),def:round10(basic*.92),fusionOnly:false,desc:'Beute: '+o.name}),
 addRpgCard({name:o.theme+'brecher',kind:o.kind,element:o.element,color:o.color,source:o.id,level:o.level,atk:round10(base*1.12),def:round10(base*.73),fusionOnly:true,ability:undefined,desc:'Angriffsorientierte Fusionsvorlage. Keine individuellen Klassen-Matchupboni.'}),
 addRpgCard({name:o.theme+'hüter',kind:o.kind,element:o.element,color:o.color,source:o.id,level:o.level,atk:round10(base*.89),def:round10(base*1.03),fusionOnly:true,ability:undefined,desc:'Verteidigungsorientierte Fusionsvorlage. Ihre Werte bestimmen den Schutz im Kampf.'})
 ];
 o.desc=o.id===0?'Ein leichter Gegner zum Aufbau deiner ersten Sammlung.':`Fusionsstufe ${o.level} · ${['','ausgewogen','offensiv','defensiv','sparsam'][o.id%4+1]||'ausgewogen'} · eigener Beutepool.`;
}
const RPG_BASE_CARDS=CARDS.filter(c=>c.id<20||c.rpg&&!c.fusionOnly),RPG_FUSIONS=CARDS.filter(c=>c.fusionOnly);


function enhancementFactor(rank){return 1;}


const RPG_DEFAULT_DECK=DEFAULT_DECK.flatMap(id=>[id,id]);
function mainDeckError(ids,owned=RPG_BASE_CARDS.map(c=>c.id)){if(!Array.isArray(ids)||ids.length!==40||ids.some(id=>!owned.includes(id)||!CARDS[id]||CARDS[id].level>TOURNAMENT_LEVEL_CAP))return 'Das Hauptdeck benötigt genau 40 freigeschaltete Basiskarten.';if(ids.some(id=>ids.filter(x=>x===id).length>3))return 'Höchstens drei Exemplare je Kartenart.';return '';}


function enemyFusionDeck(ids){const chosen=bestFusionDeck(ids),levels=chosen.map(id=>CARDS[id].level);for(const id of [...ids].reverse())if(chosen.length<15&&!chosen.includes(id)&&levels.includes(CARDS[id].level))chosen.push(id);return chosen;}

// Card IDs 0–86 remain stable for existing saves.
for(const o of RPG_OPPONENTS){
 const entry=CARDS[o.loot[0]],key=CARDS[o.loot[1]];entry.ability=undefined;entry.desc='Gewöhnliche Kreatur ohne einzigartigen Fusionswurfbonus.';key.ability=undefined;key.desc='Gewöhnliche Kreatur ohne individuellen Matchupbonus.';
 const signature=addRpgCard({name:o.theme+'souverän',kind:o.kind,element:o.element,color:o.color,source:o.id,level:o.level,atk:round10(FUSION_POWER[o.level]*1.13),def:round10(FUSION_POWER[o.level]*.8),fusionOnly:true,rarity:'rare',ability:undefined,desc:'Seltene gegnerische Signaturfusion. Ihr Wert liegt in ihren hohen Grundwerten und möglichen allgemeinen Rollenmechaniken, nicht in individuellen Schadensboni.'});
 o.signature=signature;o.loot.push(signature);o.hardLoot=[];
 const l=Math.min(TOURNAMENT_LEVEL_CAP,o.level+2),base=FUSION_POWER[l]*1.10;
 o.hardLoot.push(addRpgCard({name:o.theme+'vorreiter',kind:o.kind,element:o.element,color:o.color,source:o.id,hard:true,level:4,atk:round10((550+o.id*115)*1.2),def:round10((550+o.id*115)*.8),fusionOnly:false,ability:undefined,desc:'Hardmode · Normale Kreatur ohne individuellen Fusions-Wurfbonus.'}));
 o.hardLoot.push(addRpgCard({name:o.theme+'erzbrecher',kind:o.kind,element:o.element,color:o.color,source:o.id,hard:true,level:l,atk:round10(base*1.12),def:round10(base*.7),fusionOnly:true,rarity:'rare',ability:undefined,desc:'Hardmode · Hochstufige Fusionsvorlage ohne eigenen Durchbruchbonus.'}));
 o.hardLoot.push(addRpgCard({name:o.theme+'erzregent',kind:o.kind,element:o.element,color:o.color,source:o.id,hard:true,level:l,atk:round10(base),def:round10(base*.95),fusionOnly:true,rarity:'rare',ability:undefined,desc:'Hardmode · Fusionsvorlage ohne individuellen Schadensbonus gegen andere Kreaturen.'}));
 o.themeText=['Aufbau und Schutz','Durchbruch und Druck','Jagd auf Fusionen'][o.id%3];
}
RPG_BASE_CARDS.splice(0,RPG_BASE_CARDS.length,...CARDS.filter(c=>c.id<20||c.rpg&&!c.fusionOnly));RPG_FUSIONS.splice(0,RPG_FUSIONS.length,...CARDS.filter(c=>c.rpg&&c.fusionOnly));

/* Einzigartige Namen für NPC-Duellanten und ihre Kernkarten.
   Die numerischen IDs bleiben für alle gespeicherten Spielstände unverändert. */
const DUELIST_AND_CARD_NAMES=[["Milo Fenn","Sporell","Pilzwicht Fenno","Waldschlund","Eibenwächter","Moorkönig Aurum","Moospion Nellis","Moorbrecher","Urwurzel Oboros"],["Kael Ardent","Rostfuchs","Graustahl-Knappe","Eisenzahn","Bastion Ferrus","Argentum-Koloss","Bronzeklinge Soren","Stahlbeißer","Kaiser Galdren"],["Akari Hoshino","Glutpfote","Karmesin-Adeptin","Aschenwolf","Rubin-Seraph","Phönix Myrra","Flammenspeer Yui","Inferno-Klaue","Drachenherz Ignia"],["Rin Wilder","Dornläuferin","Laubritter Talon","Stachelherz","Waldgeist Veyra","Thronhirsch Sylvan","Distelspäher","Dornenfürst Darius","Eichenpaladin"],["Kai Mizuno","Perlentaucher","Flutknappe","Abyss-Jäger","Korallenfürstin","Leviathan Coru","Gischtreiter","Neptunsklaue","Sturmtitan Tides"],["Ryuji Kagetsu","Lavakobold Zenn","Schmelzritter","Pyronox","Vulkanbestie","Aschewyrm Rakh","Feuerbote Haku","Magmahäuter","Flammenregent Kaido"],["Noa Kuronagi","Nachtspäher","Dunkelritter Voss","Schwarzklaue","Schattenwolf Lyra","Nox-Albtraum","Krähenjäger Toshi","Seelenbeißer","Obsidian-Mond"],["Sora Amaya","Wolkenfuchs","Azurstahl-Wächter","Sturmschnabel","Windgeist Areon","Himmelskrone","Federklinge Zeph","Orkanbestie","Seraph Windra"],["Yuna Tsukishiro","Runenkatze","Arkanknappe","Glyphenjäger","Chronosgeist","Astra-Lexikon","Siegelhüter Reva","Rissbrecher","Ätherwandler"],["Liora Noctis","Schleierfuchs","Mitternachtswächter","Grabschwinge","Nachtalb Eileen","Leerenorakel","Dunkelpfad Shira","Seelenreißer","Nihil-Wache"],["Aster Valerian","Sternenpfote","Himmelsklinge Ren","Kosmoswyrm","Astralritter","Genesis-König","Sonnenbote Lio","Nebelgestirn","Aurora-Imperator"]];
RPG_OPPONENTS.forEach((o,index)=>{
 const [human,...creatures]=DUELIST_AND_CARD_NAMES[index];
 o.name=human;
 [...o.loot,...o.hardLoot].forEach((cardId,i)=>{
  if(CARDS[cardId])CARDS[cardId].name=creatures[i];
 });
});


/* Gegner haben eigene Stimmen statt austauschbarer Rollentexte.
 * Diese Texte sind ausschließlich Darstellung; KI und Belohnungen bleiben identisch. */
const DUELIST_PERSONALITIES=[
 'Milo nimmt es mit Humor, wenn du einen Zug verpatzt. Er erklärt lieber eine Karte, als dich damit zu überrollen.',
 'Kael baut seine Eisentruppe geduldig auf. Gibst du ihm zu viel Zeit, steht plötzlich eine ganze Festung vor dir.',
 'Akari setzt auf Tempo und glühende Angriffe. Sie lächelt noch, wenn dir ihre nächste Karte schon Probleme macht.',
 'Rin denkt zuerst an Sicherheit. Ihre Monster halten viel aus und zwingen dich zu überlegten Angriffen.',
 'Kai spielt ruhig, fast wie Ebbe und Flut. Ein ungeduldiger Angriff kommt ihm oft gerade recht.',
 'Ryuji kennt nur eine Richtung: nach vorne. Seine Flammen werden gefährlich, sobald du deine Deckung aufgibst.',
 'Noa beobachtet, was du fusionierst, und sucht gezielt nach einer Schwachstelle.',
 'Sora wartet auf den richtigen Augenblick. Seine Verteidigung wirkt harmlos, bis der Sturm losbricht.',
 'Yuna zählt ihre Ressourcen genau. Gegen sie zählt nicht nur die stärkste Karte, sondern auch dein langer Atem.',
 'Liora wechselt zwischen Geduld und plötzlicher Härte. Unterschätze ihre ruhigen ersten Züge nicht.',
 'Aster ist dein letzter Prüfstein: ein ausgeglichener Duellant, der auf fast jede Strategie eine Antwort hat.'
];
const CREATURE_FLAVOR={
 goblin:'Klein, frech und kaum zu berechnen.',
 wolf:'Wittert Schwächen, bevor du sie selbst bemerkst.',
 knight:'Ein treuer Wächter mit einer rostfreien Entschlossenheit.',
 mage:'Hütet alte Zauber und gefährliche Geheimnisse.',
 dragon:'Sein Schatten kündigt größere Kämpfe an.',
 golem:'Aus Stein und Geduld zu einer Festung geworden.',
 bird:'Hoch über dem Feld sucht es den perfekten Moment.',
 insect:'Ein winziger Schatten mit erstaunlich großem Mut.',
 serpent:'Schlängelt sich dorthin, wo niemand hinschaut.',
 stag:'Ein stolzer Beschützer des alten Hains.',
 ray:'Gleitet lautlos durch die Strömung.',
 spirit:'Ein Echo aus einer vergessenen Zeit.'
};
RPG_OPPONENTS.forEach((o,i)=>o.profileLine=DUELIST_PERSONALITIES[i]);
CARDS.forEach(c=>{if(c.rpg&&/^Beute: /.test(c.desc))c.desc=CREATURE_FLAVOR[c.kind]||'Ein ungewöhnlicher Verbündeter der Arena.';});

const CHALLENGES=[{id:'arsenal',name:'Knappes Arsenal',desc:'Besiege Kael Ardent mit höchstens fünf Fusionskopien im Deck.',opponent:1,reward:180}, {id:'unique',name:'Ohne Wiederholung',desc:'Besiege Akari Hoshino ohne doppelte Fusionsvorlagen.',opponent:2,reward:260}, {id:'blitz',name:'Blitzduell',desc:'Besiege den aktuellen Trainingsgegner bis Ende der vierten Runde.',opponent:0,reward:160}, {id:'theme',name:'Eisenbund',desc:'Besiege Kael Ardent mit mindestens sechs Eisen-Karten im Hauptdeck.',opponent:1,reward:220}];
const ENHANCE_SHARDS=[3,5,6,8,9];
// Unified shard economy; legacy per-opponent buckets remain only for save compatibility.
const SHARD_CRAFT_COST=30;
function sharedShards(p=profile){return (p.shards||[]).reduce((sum,n)=>sum+(n||0),0);}
function spendSharedShards(amount){
 if(!Number.isInteger(amount)||amount<0||sharedShards()<amount)return false;
 for(let i=0;i<profile.shards.length&&amount>0;i++){
  const use=Math.min(profile.shards[i],amount);profile.shards[i]-=use;amount-=use;
 }
 return amount===0;
}
function countCard(ids,id){return ids.filter(x=>x===id).length;}
function fusionDeckError(ids){if(!Array.isArray(ids)||ids.length<2||ids.length>15||ids.some(id=>!CARDS[id]?.rpg||CARDS[id].level>TOURNAMENT_LEVEL_CAP||!CARDS[id].fusionOnly||countCard(ids,id)>3))return '2–15 Fusionskopien; höchstens drei je Art.';return '';}
function inventoryError(ids,inventory){return ids.some(id=>countCard(ids,id)>(inventory[id]||0))?'Nicht genügend Exemplare im Besitz.':'';}
function bestFusionDeck(ids,enhancements={},inventory=null){const sorted=[...new Set(ids)].filter(id=>CARDS[id]?.fusionOnly&&(!inventory||inventory[id]>0)).sort((a,b)=>(CARDS[b].atk+ascensionStep(b)*(enhancements[b]||0))-(CARDS[a].atk+ascensionStep(a)*(enhancements[a]||0)));const levels=[...new Set(sorted.map(id=>CARDS[id].level))].sort((a,b)=>a-b);let chosen=levels.map(l=>sorted.find(id=>CARDS[id].level===l));if(chosen.length>15)chosen=chosen.slice(0,15);for(let pass=0;pass<2;pass++)for(const id of sorted){if(chosen.length>=15)break;if(countCard(chosen,id)<Math.min(3,inventory?inventory[id]||0:3))chosen.push(id);}return chosen;}
function strongestMainDeck(ids,enhancements={},inventory=null){return [...new Set(ids)].filter(id=>CARDS[id]&&!CARDS[id].fusionOnly).sort((a,b)=>(CARDS[b].atk+CARDS[b].def+2*ascensionStep(b)*(enhancements[b]||0))-(CARDS[a].atk+CARDS[a].def+2*ascensionStep(a)*(enhancements[a]||0))).flatMap(id=>Array(Math.min(3,inventory?inventory[id]||0:3)).fill(id)).slice(0,40);}
function themedEnemyLoadout(id,difficulty='easy'){const o=RPG_OPPONENTS[id],available=RPG_OPPONENTS.filter(x=>x.id<=id).flatMap(x=>x.loot),hard=difficulty==='hard';const ownBasics=o.loot.filter(cid=>!CARDS[cid].fusionOnly),basics=[...DEFAULT_DECK,...available.filter(cid=>!CARDS[cid].fusionOnly),...(hard?o.hardLoot.filter(cid=>!CARDS[cid].fusionOnly):[])];const deck=strongestMainDeck(basics);for(const cid of ownBasics)while(countCard(deck,cid)<3){const replace=deck.findIndex(x=>!ownBasics.includes(x)&&countCard(deck,x)>1);if(replace<0)break;deck[replace]=cid;}
 const manifestation=hard?o.hardManifest:o.easyManifest;if(manifestation!==undefined){const amount=hard?3:id>=5?2:1;for(let n=0;n<amount;n++){const candidates=deck.map((cid,i)=>({cid,i})).filter(x=>!ownBasics.includes(x.cid)&&x.cid!==manifestation).sort((a,b)=>CARDS[a.cid].atk-CARDS[b.cid].atk);if(candidates.length)deck[candidates[0].i]=manifestation;}}
 const ids=[...RPG_START_FUSIONS,...available.filter(cid=>CARDS[cid].fusionOnly),...(hard?o.hardLoot.filter(cid=>CARDS[cid].fusionOnly):[])];let fusionDeck=bestFusionDeck(ids);const signature=hard?o.hardLoot[2]:o.signature;for(let i=0;i<2;i++)if(countCard(fusionDeck,signature)<2){if(fusionDeck.length===15)fusionDeck.pop();fusionDeck.push(signature);}// The compact roster can make a legacy opponent try four copies of a card.
 // Preserve strong monsters while enforcing the exact three-copy game rule.
 const copies=new Map();const options=[...new Set([...basics,...DEFAULT_DECK])].filter(id=>UPDATE_B_SET.has(id)&&!CARDS[id].fusionOnly);
 for(let i=0;i<deck.length;i++){
  const id=deck[i],n=copies.get(id)||0;
  if(n>=3){const replacement=options.find(cid=>(copies.get(cid)||0)<3);if(replacement===undefined)throw Error('Update B: kein NPC-Ersatzmonster');deck[i]=replacement;copies.set(replacement,(copies.get(replacement)||0)+1);}
  else copies.set(id,n+1);
 }
 return {deck,fusionDeck,enhancements:{},power:o.power*(hard?1.20:1)};}

// Manifestations are separate owned main-deck cards, never fusion stock.
for(const o of RPG_OPPONENTS){o.manifestations=[];if(!o.id)continue;for(const original of [...o.loot,...o.hardLoot].filter(id=>CARDS[id].fusionOnly)){const c=CARDS[original],id=addRpgCard({...c,name:c.name+' · Gestalt',fusionOnly:false,manifestOf:original,desc:'Normal beschwörbare Gestalt. '+c.desc});CARDS[id].id=id;o.manifestations.push(id);}o.easyManifest=o.manifestations.find(id=>CARDS[id].manifestOf===o.loot[2]);o.hardManifest=o.manifestations.find(id=>CARDS[id].manifestOf===o.hardLoot[1]);}
RPG_BASE_CARDS.splice(0,RPG_BASE_CARDS.length,...CARDS.filter(c=>c.id<20||c.rpg&&!c.fusionOnly));

// Alpha 1.6: three replacing training opponents; stable legacy IDs.
const TRAINING_STAGES=[
 {name:'Lio · Erster Funke',power:.64,coins:30,shards:3,desc:'Die ersten Beschwörungen und Angriffe kennenlernen.'},
 {name:'Mira · Runenprobe',power:.67,coins:40,shards:4,desc:'Ein kleiner Schritt weiter: einfache Fusionen ausprobieren.'},
 {name:'Taro · Trainingshüter',power:.70,coins:50,shards:5,desc:'Dein dauerhafter Trainingspartner zum Sammeln und Ausprobieren.'}
];
const TRAINING_FUSION=addRpgCard({name:'Morgenflügel',level:5,atk:1110,def:810,kind:'bird',element:'LICHT',color:'#ffd387',source:0,fusionOnly:true,rarity:'rare',trainingReward:true,desc:'Garantierte Erstbelohnung der dritten Trainingsprüfung. Eine Kopie, eine Beschwörung je Duell.'});
RPG_FUSIONS.push(CARDS[TRAINING_FUSION]);
function rpgRole(id){return {};}
for(const o of RPG_OPPONENTS){if(!o.id)continue;const c=CARDS[o.loot[1]];if(o.policy==='offensive'||o.id%3===2){c.ability=undefined;c.desc='Ein Duellmonster ohne individuelle Schadensvorteile gegen andere Kreaturen.';}o.themeText+=' · '+({offensive:'rascher Angriff mit Einzelmonstern',guardian:'Schutz und standhafte Signatur',economy:'spart Fusionsreserven',balanced:'gezielter Aufbau'}[o.policy]||'Training');}
CHALLENGES.push(
 {id:'singlefusion',name:'Eine einzige Fusion',desc:'Besiege Kael Ardent mit höchstens einer ausgeführten Fusion.',opponent:1,reward:180},
 {id:'regulars',name:'Die gewöhnlichen Helden',desc:'Besiege Kael Ardent mit drei verschiedenen normal beschworenen Monstern auf deinem Feld.',opponent:1,reward:200},
 {id:'untrained',name:'Aus eigener Kraft',desc:'Besiege Akari Hoshino ohne den Monstertraining-Bonus. Der Bonus wird nur für diese Challenge ausgesetzt.',opponent:2,reward:240}
);
// Pre-register Fusion Evolution challenge IDs before validating persisted profiles.
// The presentation and rules are provided by evolution.js after the profile loads.
for(const mode of ['defense','burst','fusion'])for(let stage=1;stage<=5;stage++)CHALLENGES.push({id:`evo-${mode}-${stage}`,name:`${mode} · ${stage}`,desc:'Spezialherausforderung',opponent:1,reward:0});
/* Geheimduellant: absichtlich keine Karten-/Beutevorschau vor dem Kampf. */
const SHOWCASE_NAME='Vael · Der Hochmütige';
function showcaseEnemy(){
 const normals=CARDS.filter(c=>c.rpg&&!c.fusionOnly&&!c.ace&&c.level>=8&&c.level<=10);
 const fusion=CARDS.filter(c=>c.fusionOnly&&!c.ace&&c.level>=8&&c.level<=10);
 if(normals.length<14||fusion.length<5)throw Error('Nicht genug Monster für Vaels Deck.');
 // Fixed, valid deck: 40 cards, max 3 copies each, 8–10 only.
 const main=normals.slice(0,20).flatMap(c=>[c.id,c.id]);
 const stock=fusion.slice(0,10).map(c=>c.id);
 return {deck:main,fusionDeck:stock,enhancements:{},power:1.13,flatBonus:0};
}
function showShowcaseIntro(){
 if(storageConflict||busy||aiRunning||profile.activeDuel||profile.rewardQueue.length)return false;
 if(!profile.showcase.pending)return false;
 openModal(modalHtml('??? · UNBEKANNTER DUELLANT',SHOWCASE_NAME,'✦',
  '„Drei Trainingssiege? Wie entzückend. Du hältst dich wohl schon für einen Duellanten.“',
  '<p>„Sieh genau hin, Neuling. So sehen Karten aus, die du noch nicht einmal begreifen kannst.“</p><p><b>Ein Pflichtduell beginnt.</b> Diese Begegnung zeigt dir, welche Mächte jenseits deiner bisherigen Kämpfe warten.</p><p>Deck: ??? · Stufen: ??? · Fusionen: ??? · Belohnungen: ???</p>',
  '<button class="btn primary" id="showcaseBegin">HERAUSFORDERUNG ANNEHMEN</button>'));
 $('showcaseBegin').onclick=()=>{profile.showcase.pending=false;profile.showcase.seen=true;saveProfile();hideModal();startShowcaseDuel(true);};
 return true;
}
function startShowcaseDuel(forced=false){
 if(storageConflict||busy||aiRunning||profile.activeDuel||profile.rewardQueue.length)return;
 if(!forced&&!profile.showcase.offered)return;
 const enemy=showcaseEnemy();
 if(!forced)profile.showcase.offered=false;
 profile.showcase.streak=0;
 stopTraining(false);
 game=createGame({id:newMatchId(),mode:'pve',opponentId:8,context:'challenge',enemy,showcase:true,
  deck:profile.activeDeck,fusionDeck:profile.fusionDeck,enhancements:profile.enhancements,
  flatBonus:monsterTrainingBonus(profile.upgrades.power)});
 game.showcase=true;game.showcaseForced=forced;
 profile.activeDuel=JSON.parse(JSON.stringify(game));saveProfile();
 uiMode='duel';materialMode=false;$('menuScreen').hidden=true;$('menuNav').hidden=true;
 $('duelScreen').hidden=false;
 for(const id of ['deckBtn','restartBtn','homeBtn'])$(id).hidden=false;
 hideModal();render();
 openModal(modalHtml('??? · GEHEIMDUELL',SHOWCASE_NAME,'✦',
  '„Du darfst anfangen. Viel wird es dir nicht nützen.“',
  '<p>„Drei Trainingssiege machen dich noch lange nicht zu einem würdigen Gegner.“</p>',
  '<button class="btn primary" id="showcaseGo">DUELL STARTEN</button>'));
 $('showcaseGo').onclick=()=>{hideModal();if(game?.active===1)runAi();};
}
function showcasePanel(){
 const sc=profile.showcase;
 if(!sc.seen||!sc.offered)return '';
 return `<section class="menu-panel opponent-card"><div class="side-kicker">??? · GEHEIMDUELL</div>
 <h2>${SHOWCASE_NAME}</h2><p>Deck: ??? · Stufe: ??? · Fusionen: ??? · Beute: ???</p>
 <p>Der Hochmütige ist nur für <b>ein weiteres Duell</b> hier. „Das hier ist keine Übung. Hoffentlich kannst du wenigstens verlieren, ohne Ausreden zu suchen.“</p>
 <button class="btn primary" id="showcaseOptional">HERAUSFORDERN</button></section>`;
}
function showcaseReward(g){
 if(storageConflict||g.winner===null||g.rewardClaimed||profile.rewardLedger.includes(g.id))return null;
 g.rewardClaimed=true;profile.rewardLedger.push(g.id);profile.rewardLedger=profile.rewardLedger.slice(-512);
 const win=g.winner===0&&!g.surrendered,first=win&&!profile.showcase.firstWin;
 const coins=win?(first?2500:OPPONENTS[8].coins):0;
 const xp=win?(first?800:OPPONENTS[8].xp):0;
 const shards=win?(first?30:3):0;
 if(win){
  profile.wins++;profile.coins=Math.min(1e9,profile.coins+coins);profile.xp=Math.min(1e9,profile.xp+xp);
  profile.shards[8]=Math.min(1e9,profile.shards[8]+shards);
  if(first){profile.showcase.firstWin=true;profile.packs[packKey(8,'easy')]=(profile.packs[packKey(8,'easy')]||0)+1;}
 } // The exhibition defeat is not counted as a loss.
 profile.showcase.streak=0;profile.showcase.offered=false;
 profile.history.unshift({opponent:8,win,turns:g.turn,coins,xp,at:Date.now(),context:'free'});
 profile.history=profile.history.slice(0,30);
 grantMilestones();saveProfile();
 return {coins,xp,loot:win?{source:8,shards,card:null,duplicate:false}:null,
  charge:0,showcase:true,showcaseFirst:first};
}
function showcaseTrackDuel(g){
 if(g.mode!=='pve'||g.showcase||g.context==='auto'||g.surrendered||!profile.showcase.seen)return;
 const sc=profile.showcase;
 // The visitor departs after the next completed duel, even if that duel is lost.
 if(sc.offered){sc.offered=false;sc.streak=0;return;}
 if(g.winner!==0){sc.streak=0;return;}
 sc.streak++;
 if(sc.streak>=3){
  sc.streak=0;
  const roll=randomInt(g,100);
  if(roll<30)sc.offered=true;
 }
}
function trainingStage(){return Math.min(2,profile.trainingWins||0);}
function trainingName(stage=trainingStage()){return TRAINING_STAGES[stage].name;}
function rpgEnemyLoadout(id,difficulty='easy',stage){if(id===0&&difficulty!=='hard'){const s=stage??trainingStage();return {deck:[...RPG_DEFAULT_DECK],fusionDeck:[41,41,42,42],enhancements:{},power:TRAINING_STAGES[s].power};}const load=themedEnemyLoadout(id,difficulty),o=RPG_OPPONENTS[id],signature=difficulty==='hard'?o.hardLoot[2]:o.signature;
 // Guarantee three signature copies; guard and hunter opponents select their role.
 const role=o.policy==='guardian'?'guard':o.id%3===2?'hunt':'pierce';const roleCard=[...o.loot,...(difficulty==='hard'?o.hardLoot:[])].find(cid=>CARDS[cid].fusionOnly&&CARDS[cid].ability===role);
 for(const target of [signature,roleCard])if(target!==undefined)while(countCard(load.fusionDeck,target)<3){const i=load.fusionDeck.findIndex(cid=>cid!==target&&cid!==signature&&CARDS[cid].level>=o.level);if(load.fusionDeck.length<15)load.fusionDeck.push(target);else if(i>=0)load.fusionDeck[i]=target;else break;}
 return load;
}
// The midpoint used by Fusion 3.1 stays grounded in the unmodified original card catalog.
// PvE-only normal monsters gain marginal level progression and a defensive role identity.
function normalRoleBonus(c,stat,owner=0,upgrades=profile?.upgrades){
 if(!c||c.fusionOnly||c.essenceMonster||!c.rpg)return 0;
 const level=Math.max(1,Math.min(10,c.level||1));
 const defRole=c.role==='guardian'||c.role==='soul';
 const hunter=c.role==='predator';
 const highLevel=level>=6?20*(level-5):0; // LV6 +20, LV10 +100 to each stat.
 const guardianBonus=stat==='def'&&defRole?round10(workshopBudget(level)*.09):0;
 if(owner!==0)return highLevel+guardianBonus;
 const hunting= hunter?(upgrades?.jagdinstinkt||0):0;
 const shielding=defRole?(upgrades?.schildwall||0):0;
 const specialized=stat==='atk'?hunting*(15+8*level)+shielding*(5+2*level):
   hunting*(5+2*level)+shielding*(20+8*level);
 return highLevel+guardianBonus+specialized;
}
function baseStat(c,stat,p){
 const starterBonus=c.id<20&&p?.id===0&&p?.enhancements?35*(profile?.upgrades?.starter||0):0;
 return c[stat]*(p?.power||1)+ascensionStep(c.id)*(p?.enhancements?.[c.id]||0)+(p?.flatBonus||0)+starterBonus+
  (p?normalRoleBonus(c,stat,p.id):0);
}

const XP_MILESTONES=[5,10,15,20,25,30,35,40,45,50];
function ascensionStep(id){return id<20?10:CARDS[id]?.fusionOnly?20:30;}
// Dedicated rare templates guarantee three distinct stage-appropriate choices, even before the first victory.
const MILESTONE_FORMS=[];
for(const o of RPG_OPPONENTS){const forms=[];for(let k=0;k<6;k++){const l=o.level,atk=round10(FUSION_POWER[l]*(.92+k*.04)),def=round10(FUSION_POWER[l]*(.82-k*.04));const original=addRpgCard({name:o.theme+['licht','flamme','schwinge','klinge','wacht','glanz'][k],source:o.id,level:l,atk,def,kind:['spirit','dragon','bird'][k%3],element:o.element,color:o.color,fusionOnly:true,rarity:'rare',milestoneOnly:true,ability:['guard','pierce','hunt'][k%3],desc:'Seltene Meilenstein-Vorlage · als Gestalt über Spielerstufe 20 oder 40.'});const form=addRpgCard({...CARDS[original],name:CARDS[original].name+' · Gestalt',fusionOnly:false,manifestOf:original,desc:'Seltene Meilenstein-Gestalt · normal beschwörbar.'});forms.push(form);}MILESTONE_FORMS.push(forms);}
RPG_BASE_CARDS.splice(0,RPG_BASE_CARDS.length,...CARDS.filter(c=>c.id<20||c.rpg&&!c.fusionOnly));RPG_FUSIONS.splice(0,RPG_FUSIONS.length,...CARDS.filter(c=>c.rpg&&c.fusionOnly));
/* Hidden fate pool: 10 temporary templates, never collectible, craftable or droppable. */
const FATE_NAMES=['Sternenrichter','Goldener Phönix','Schicksalsdrache','Ewigkeitswächter','Sonnenseraph','Astralgreif','Nebelkaiser','Kometenbestie','Himmelsarchon','Kosmischer Titan'];
const FATE_ART_IDS=[9,12,14,15,17,20,22,26,29,7];
const FATE_CARD_IDS=CARDS.filter(c=>c.rpg&&!c.fusionOnly&&!c.ace&&c.level===10).slice(0,10).map(c=>c.id);
function isFateCard(c){return !!c&&typeof c==='object'&&c.fate===true;}

function coreValidateDuelSnapshot(raw){
 const fail=()=>{throw Error('Ungültige gespeicherte Partie.');};
 if(!raw||raw.mode!=='pve'||typeof raw.id!=='string'||!raw.id.length||raw.id.length>100||!validInt(raw.opponentId,10)||!['free','tournament','challenge','encounter'].includes(raw.context)||!validInt(raw.turn,30)||raw.turn<1||!validInt(raw.active,1)||!validInt(raw.starter,1)||!validInt(raw.tiePriority,1)||!validInt(raw.seed,4294967295)||!validInt(raw.nextUid,10000)||!['summon','positions','attacks','guard','end'].includes(raw.aiPhase)||![null,0,1].includes(raw.winner))fail();
 function card(c){if(!c||!validInt(c.uid,10000)||c.uid<1||!Number.isInteger(c.id)||!CARDS[c.id]||!['atk','def'].includes(c.mode)||typeof c.attacked!=='boolean'||typeof c.switched!=='boolean')fail();const out={uid:c.uid,id:c.id,mode:c.mode,attacked:c.attacked,switched:c.switched};if(c.card){if((c.card.level!==CARDS[c.id].level&&!(CARDS[c.id].essenceMonster&&validInt(c.card.level,10)&&c.card.level>=3))||!validInt(c.card.atk,10000)||!validInt(c.card.def,10000))fail();out.card={level:c.card.level,atk:c.card.atk,def:c.card.def};}for(const key of ['summonedTurn','decayTotal'])if(c[key]!==undefined){if(!validInt(c[key],key==='summonedTurn'?30:10000))fail();out[key]=c[key];}if(c.decayClass!==undefined){if(!['starter','normal','fusion'].includes(c.decayClass))fail();out.decayClass=c.decayClass;}if(c.materialBonus){if(!validInt(c.materialBonus.atk,240)||!validInt(c.materialBonus.def,240)||c.materialBonus.atk+c.materialBonus.def>240)fail();out.materialBonus={...c.materialBonus};}if(c.surgeTurn!==undefined){if(!validInt(c.surgeTurn,30))fail();out.surgeTurn=c.surgeTurn;}if(c.decayAge!==undefined){if(!validInt(c.decayAge,30))fail();out.decayAge=c.decayAge;}else if(c.decayClass&&c.decayTotal){const base=c.decayClass==='starter'?20:c.decayClass==='fusion'?50:30,min=c.decayClass==='starter'?10:20;let accumulated=0,age=0;while(accumulated<c.decayTotal&&age<30){accumulated+=Math.max(min,base-5*age);age++;}out.decayAge=age;}if(c.attackFatigue!==undefined){if(!validInt(c.attackFatigue,10000))fail();out.attackFatigue=c.attackFatigue;}if(c.fate){if(!FATE_CARD_IDS.includes(c.id))fail();out.fate=true;}if(c.fusion)out.fusion=true;if(c.qualityRolls){if(!validInt(c.qualityRolls,7))fail();out.qualityRolls=c.qualityRolls;}
 if(c.essenceCombat!==undefined){
 const e=c.essenceCombat;
 if(!e||!validInt(e.soul,10000)||!validInt(e.condensed,10000)||!validInt(e.cooldown,3)||!validInt(e.condenseLeft,3)||!validInt(e.condenseSlice,10000)||!validInt(e.guardLeft,2)||!validInt(e.doubleChoice,2)||!validInt(e.lastToggle,60)||!validInt(e.maxDef,10000)||!validInt(e.attacksThisTurn,2)||!validInt(e.lastDischarge,60)||!validInt(e.guardGrantedTurn,60)||!validInt(e.drainPreference??0,2)||!validInt(e.lastDrainSwitch??0,60))fail();
 out.essenceCombat={soul:e.soul,condensed:e.condensed,cooldown:e.cooldown,condenseLeft:e.condenseLeft,condenseSlice:e.condenseSlice,guardLeft:e.guardLeft,doubleChoice:e.doubleChoice,lastToggle:e.lastToggle,maxDef:e.maxDef,attacksThisTurn:e.attacksThisTurn,lastDischarge:e.lastDischarge,guardGrantedTurn:e.guardGrantedTurn,drainPreference:e.drainPreference??0,lastDrainSwitch:e.lastDrainSwitch??0};
 }return out;}
 if(!Array.isArray(raw.players)||raw.players.length!==2)fail();const players=raw.players.map((p,id)=>{if(p.id!==id||!validInt(p.lp,10000)||!validInt(p.shield,600)||mainDeckError(p.originalDeck,id===1&&raw.showcase===true&&raw.opponentId===8?CARDS.filter(c=>c.rpg&&!c.fusionOnly&&!c.ace&&c.level>=8&&c.level<=10).map(c=>c.id):RPG_BASE_CARDS.map(c=>c.id))||!Array.isArray(p.deck)||p.deck.length>40||p.deck.some(cid=>!(id===1&&raw.showcase===true&&raw.opponentId===8?CARDS.some(c=>c.id===cid&&c.rpg&&!c.fusionOnly&&!c.ace&&c.level>=8&&c.level<=10):RPG_BASE_CARDS.some(c=>c.id===cid)))||!Array.isArray(p.hand)||p.hand.length>5||!Array.isArray(p.field)||p.field.length!==5||!Array.isArray(p.graveyard)||p.graveyard.length>150||fusionDeckError(p.fusionDeck)||!Number.isFinite(p.power)||p.power<.1||p.power>2)fail();const enhancements={};for(const [cid,rank]of Object.entries(p.enhancements||{})){if(!(CARDS[cid]?.rpg||Number(cid)<20)||!validInt(rank,5))fail();enhancements[cid]=rank;}const out={id,lp:p.lp,shield:p.shield,originalDeck:[...p.originalDeck],deck:[...p.deck],hand:p.hand.map(card),field:p.field.map(c=>c?card(c):null),graveyard:p.graveyard.map(card),fusionDeck:[...p.fusionDeck],enhancements,power:p.power};if(out.hand.some(c=>CARDS[c.id].fusionOnly||dataOf(c).level>12))fail();return out;});
 const all=players.flatMap(p=>[...p.hand,...p.field.filter(Boolean),...p.graveyard]),uids=all.map(c=>c.uid);if(new Set(uids).size!==uids.length)fail();
 const g={id:raw.id,mode:'pve',opponentId:raw.opponentId,context:raw.context,maxLP:START_LP,turn:raw.turn,active:raw.active,starter:raw.starter,tiePriority:raw.tiePriority,seed:raw.seed,nextUid:raw.nextUid,aiPhase:raw.aiPhase,winner:raw.winner,winReason:typeof raw.winReason==='string'?raw.winReason.slice(0,300):'',summoned:raw.summoned===true,players,selection:null,pending:null,materials:[],lastSummoned:null,rewardClaimed:raw.rewardClaimed===true,finishShown:false,log:[],totalFusions:[],damageDealt:[]};
 if(!Array.isArray(raw.log)||raw.log.length>80||raw.log.some(x=>typeof x!=='string'||x.length>500))fail();g.log=[...raw.log];for(const key of ['totalFusions','damageDealt']){if(!Array.isArray(raw[key])||raw[key].length!==2||raw[key].some(n=>!validInt(n,100000)))fail();g[key]=[...raw[key]];}
 if(raw.pending){const p=raw.pending;if(!['normal','fusion'].includes(p.kind)||!Array.isArray(p.levels)||p.levels.length<1||p.levels.length>2||p.levels.some(l=>!validInt(l,12)||l<1))fail();const c=card(p.card);if(p.kind==='normal'&&!players[g.active].hand.some(h=>h.uid===c.uid&&h.id===c.id))fail();if(p.kind==='fusion'&&uids.includes(c.uid))fail();g.pending={kind:p.kind,levels:[...p.levels],card:c};uids.push(c.uid);}
 if(g.nextUid<=Math.max(0,...uids))fail();if(g.winner===null&&players.some(p=>p.lp===0))fail();return g;
}
function saveDuelSnapshot(){if(!game||game.mode!=='pve')return;profile.activeDuel=game.rewardClaimed?null:JSON.parse(JSON.stringify(game));saveProfile();}
function manualSave(){if(busy||aiRunning){toast('Die laufende Aktion wird automatisch gesichert.');return;}saveDuelSnapshot();const ok=saveProfile();renderHud();toast(ok?'Spielstand gespeichert · '+new Date(profile.savedAt).toLocaleTimeString('de-AT'):storageWarning||'Speichern nicht möglich. Bitte exportiere deinen Spielstand.');}
function resumeDuel(){if(!profile.activeDuel||storageConflict||busy||aiRunning)return;try{stopTraining(false);game=validateDuelSnapshot(profile.activeDuel);materialMode=false;uiMode='duel';$('menuScreen').hidden=true;$('menuNav').hidden=true;$('duelScreen').hidden=false;for(const id of ['deckBtn','restartBtn','homeBtn'])$(id).hidden=false;hideModal();render();if(game.winner!==null)showFinished();else if(game.active===1)runAi();else toast('Gespeichertes Duell fortgesetzt.');}catch(e){toast(e.message);}}

function validateDuelSnapshot(raw){if(raw.rulesVersion!==5)throw Error('Diese Partie verwendet ältere Fusionsregeln.');const g=coreValidateDuelSnapshot(raw);g.rulesVersion=5;// Preserve LP of a duel started before the update; never change health mid-battle.
 g.maxLP=[4000,6000,7000,8000,10000].includes(raw.maxLP)?raw.maxLP:(raw.difficulty==='hard'?8000:4000);g.encounter=raw.encounter?validateEncounter(raw.encounter):null;if(g.context==='encounter'&&!g.encounter)throw Error('Begegnung fehlt.');if(g.players.some(p=>p.lp>g.maxLP))throw Error('Ungültige Lebenspunkte.');g.showcase=raw.showcase===true&&raw.opponentId===8&&raw.context==='challenge';g.showcaseForced=g.showcase&&raw.showcaseForced===true;g.fateUsed=Array.isArray(raw.fateUsed)&&raw.fateUsed.length===2?raw.fateUsed.map(x=>x===true):[false,false];if(g.players.some((p,i)=>[...p.hand,...p.field.filter(Boolean),...p.graveyard].some(isFateCard)&&!g.fateUsed[i]))throw Error('Ungültiger Schicksalszug im Spielstand.');g.fateEvent=null;g.trainingStage=raw.opponentId===0?raw.trainingStage:null;if(raw.opponentId===0&&!validInt(g.trainingStage,2))throw Error("Ungültige Trainingsprüfung.");g.surrendered=raw.surrendered===true;g.difficulty=raw.difficulty==='hard'?'hard':'easy';g.challenge=raw.challenge&&CHALLENGES.some(c=>c.id===raw.challenge)?raw.challenge:null;g.boosted=raw.boosted===true;g.findings={attack:raw.findings?.attack===true,loss:raw.findings?.loss===true,bridge:raw.findings?.bridge===true};g.essenceRules=raw.essenceRules===true;
 g.essenceSchool=raw.essenceSchool&&['predator','fusion','defense'].includes(raw.essenceSchool)?raw.essenceSchool:null;
 g.essenceTier=validInt(raw.essenceTier,10)?raw.essenceTier:0;
 g.essenceTrial=typeof raw.essenceTrial==='string'&&/^(intro-[0-2]|switch-(predator|fusion|defense)-[0-4])$/.test(raw.essenceTrial)?raw.essenceTrial:null;
 g.essenceParticipated=raw.essenceParticipated===true;
 g.essenceTurns=validInt(raw.essenceTurns,60)?raw.essenceTurns:0;
 g.essenceKills=validInt(raw.essenceKills,100)?raw.essenceKills:0;
 g.essenceGuardSpent=raw.essenceGuardSpent===true;g.essenceTauntUsed=raw.essenceTauntUsed===true;
 g.essenceTurnAttacks=validInt(raw.essenceTurnAttacks,10)?raw.essenceTurnAttacks:0;
 g.players.forEach((p,i)=>{const remain=raw.players[i].remainingFusion;if(!Array.isArray(remain)||remain.length>15||remain.some(id=>countCard(remain,id)>countCard(p.fusionDeck,id)))throw Error('Ungültige verbleibende Fusionskopien.');p.remainingFusion=[...remain];if(!validInt(raw.players[i].flatBonus??0,500))throw Error('Ungültiger Trainingsbonus.');p.flatBonus=raw.players[i].flatBonus||0;});return g;}


/* Ace-Karten werden vor dem Laden des Spielstands registriert.
   Nur so können gespeicherte Ace-IDs beim nächsten Seitenaufruf validiert werden. */
const ACE_CARD_IDS={};
for(const o of RPG_OPPONENTS.slice(1)){
 const signature=CARDS[o.signature],fusion=o.id>=3;
 // Das kaufbare ACE ist dieselbe Karten-Vorlage wie die des Gegners.
 // Vorhandene IDs bleiben stabil, selbst wenn ein ACE nun eine Fusion ist.
 const stats=o.id===3?{level:6,atk:1080,def:1140}:fusion
  ?{level:signature.level,atk:signature.atk,def:signature.def}
  :{level:Math.max(2,o.level-1),atk:round10(signature.atk*.72),def:round10(signature.def*.72)};
 const id=addRpgCard({
  name:signature.name,kind:o.kind,element:o.element,color:o.color,
  source:o.id,...stats,fusionOnly:fusion,ace:true,rarity:'ace',
  ability:fusion?o.id===3?'guard':signature.ability:undefined,
  desc:fusion?'Das echte Fusions-ACE von '+o.name+'.':'Das echte normale ACE von '+o.name+'.'
 });
 ACE_CARD_IDS[o.id]=id;
 o.aceCard=id;
 o.originalSignature=o.signature;
 if(fusion)o.signature=id; // Fusionsgegner beschwören die kaufbare ACE-Vorlage.
 (fusion?RPG_FUSIONS:RPG_BASE_CARDS).push(CARDS[id]);
}

/* Update A · normale Monsterstufen. Alte IDs 0–323 und sämtliche
   Kampfwerte bleiben erhalten. Neue Stufen sind eigenständige sammelbare
   Kartenkopien, teilen aber exakt das Artwork ihres Grundmonsters. Die
   Spielstands-Validierung erkennt sie durch den bestehenden Basiskartenpool. */
const NORMAL_LINE_ORIGINAL_COUNT=CARDS.length;
/* Update B: exactly 22 collectible normal-monster families. */
const NORMAL_LINE_ROOT_IDS=[...DEFAULT_DECK,20,22];
const NORMAL_LINE_VARIANT_IDS=[];
for(const rootId of NORMAL_LINE_ROOT_IDS){
 const root=CARDS[rootId];
 root.lineRoot=rootId;
 root.lineStep=0;
 for(let step=1;step<=3&&root.level+step<=12;step++){
  // Access to higher card tiers follows tournament progress; merely owning
  // the weak version never grants its stronger forms automatically.
  const requiredTier=Math.min(10,Math.max(1,root.source>=0?root.source:0,root.level+step-1));
  const id=addRpgCard({...root,
   id:undefined,source:Math.max(0,root.source??0),rpg:true,
   fusionOnly:false,ace:false,manifestOf:null,milestoneOnly:false,
   trainingReward:false,rarity:'common',
   level:root.level+step,
   atk:round10(root.atk+step*(90+root.level*20)),
   def:round10(root.def+step*(75+root.level*15)),
   variantOf:rootId,lineRoot:rootId,lineStep:step,requiredTier,
   desc:root.desc+' · Entwicklungsstufe: '+(root.level+step)+'.'
  });
  NORMAL_LINE_VARIANT_IDS.push(id);
  RPG_BASE_CARDS.push(CARDS[id]);
 }
}

/* Artwork-Pack 01: zehn neue Normalmonsterfamilien, vier Stufen pro Motiv.
   Kartennummern, Elemente und Kampfwerte bleiben erhalten. */
const NORMAL_ART_PACK_01=Object.freeze([{"root":0,"art":"assets/custom-art/normal-pack-01-01.webp","name":"Schatzkobold der Glutgruben","desc":"Ein gewitzter Kobold, der Gold und glimmende Relikte aus verlassenen Minen stiehlt."},{"root":8,"art":"assets/custom-art/normal-pack-01-02.webp","name":"Aschenwolke der Sturmhöhen","desc":"Eine rußige Wolkengestalt, in deren Innerem Feuerblitze und uralte Stimmen kreisen."},{"root":10,"art":"assets/custom-art/normal-pack-01-03.webp","name":"Blattklingen-Mantis","desc":"Ein lauernder Waldjäger mit gezackten Blattklingen und schimmernden Augen."},{"root":5,"art":"assets/custom-art/normal-pack-01-04.webp","name":"Leuchtangler der Tiefenruinen","desc":"Ein uralter Tiefseejäger, der Beute mit seinen leuchtenden Fühlern in versunkene Tempel lockt."},{"root":1,"art":"assets/custom-art/normal-pack-01-05.webp","name":"Moospanzer-Nashorn","desc":"Eine schwer gepanzerte Urbestie, auf deren Rücken ganze Moosgärten wachsen."},{"root":4,"art":"assets/custom-art/normal-pack-01-06.webp","name":"Laternengeist der Vergessenen","desc":"Ein rastloser Schatten, der verirrte Seelen mit gespenstischen Laternen anlockt."},{"root":16,"art":"assets/custom-art/normal-pack-01-07.webp","name":"Sonnenreiher der Ruinen","desc":"Ein langbeiniger Lichtvogel, der in verwunschenen Wasserbecken nach Erinnerungen sucht."},{"root":13,"art":"assets/custom-art/normal-pack-01-08.webp","name":"Pilzschnecke des Moderwalds","desc":"Ein schleichender Waldbewohner mit giftigen Pilzen und wachsamen Fühleraugen."},{"root":18,"art":"assets/custom-art/normal-pack-01-09.webp","name":"Dünenplünderer mit dem Rotmantel","desc":"Ein listiger Wüstenschakal, dessen Klingen in der flirrenden Mittagshitze glühen."},{"root":19,"art":"assets/custom-art/normal-pack-01-10.webp","name":"Kristallpanzerschildkröte","desc":"Ein geduldiger Wächter der Höhlen, dessen Panzer aus leuchtenden Kristallen wächst."}]);
for(const entry of NORMAL_ART_PACK_01){
 const root=CARDS[entry.root];
 if(!root||root.fusionOnly)throw Error('Artwork-Pack 01: ungueltige Familie '+entry.root);
 for(const card of CARDS){
  if(card.id!==entry.root&&card.variantOf!==entry.root)continue;
  card.name=entry.name;card.art=entry.art;
  card.desc=entry.desc+(card.variantOf===entry.root?' · Stufe '+card.level+'.':'');
 }
}

const AUTO_CAP=30;
/* Arcane Duel 3.0 · UPDATE B: Curated roster, no legacy collection migration.
   Legacy templates remain internal because older duel functions reference fixed
   indexes. Only ACTIVE_CARD_IDS may enter new loot, decks or booster pools.
   The 22 roots and their three variants share one art and one element per line. */
const UPDATE_B_NORMAL_ROOTS=Object.freeze([...NORMAL_LINE_ROOT_IDS]);
const UPDATE_B_FUSION_IDS=Object.freeze([
 ...RPG_START_FUSIONS,TRAINING_FUSION,
 ...RPG_OPPONENTS.flatMap(o=>o.loot.slice(2,4)),
 90,102,105,121,260
]);
const UPDATE_B_ACE_IDS=Object.freeze(RPG_OPPONENTS.slice(1).map(o=>ACE_CARD_IDS[o.id]));
const UPDATE_B_MAIN_IDS=[...UPDATE_B_NORMAL_ROOTS,...NORMAL_LINE_VARIANT_IDS,...UPDATE_B_ACE_IDS.filter(id=>!CARDS[id].fusionOnly)];
const UPDATE_B_ACTIVE_IDS=[...UPDATE_B_MAIN_IDS,...UPDATE_B_FUSION_IDS,...UPDATE_B_ACE_IDS.filter(id=>CARDS[id].fusionOnly)];
const UPDATE_B_SET=new Set(UPDATE_B_ACTIVE_IDS);
if(UPDATE_B_FUSION_IDS.length!==30||UPDATE_B_MAIN_IDS.length!==90||UPDATE_B_ACTIVE_IDS.length!==128||new Set(UPDATE_B_ACTIVE_IDS).size!==128)throw Error('Update B: ungueltiger Kartenpool');
for(const c of CARDS)c.retired=!UPDATE_B_SET.has(c.id);
for(const rootId of UPDATE_B_NORMAL_ROOTS){
 const root=CARDS[rootId];
 root.rpg=true;root.fusionOnly=false;root.ace=false;root.milestoneOnly=false;
 if(root.id>=20){root.source=root.id===20?2:3;root.requiredTier=root.source;}
 for(const id of NORMAL_LINE_VARIANT_IDS.filter(id=>CARDS[id].variantOf===rootId)){
  const variant=CARDS[id];variant.name=root.name;variant.element=root.element;
  variant.art=root.art;variant.retired=false;
 }
}
for(const id of UPDATE_B_FUSION_IDS){
 const c=CARDS[id];c.rpg=true;c.fusionOnly=true;c.milestoneOnly=false;
 c.hard=false;c.retired=false;
}
for(const id of UPDATE_B_ACE_IDS){CARDS[id].retired=false;}
RPG_BASE_CARDS.splice(0,RPG_BASE_CARDS.length,...UPDATE_B_MAIN_IDS.map(id=>CARDS[id]));
RPG_FUSIONS.splice(0,RPG_FUSIONS.length,...UPDATE_B_FUSION_IDS.map(id=>CARDS[id]),...UPDATE_B_ACE_IDS.filter(id=>CARDS[id].fusionOnly).map(id=>CARDS[id]));
// Opponent decks and rewards use only approved, level-appropriate templates.
const UPDATE_B_FUSIONS_BY_SOURCE=RPG_OPPONENTS.map(o=>UPDATE_B_FUSION_IDS.filter(id=>CARDS[id].source===o.id&&!CARDS[id].trainingReward));
const UPDATE_B_LOOT={};
for(const o of RPG_OPPONENTS){
 const candidates=UPDATE_B_MAIN_IDS.filter(id=>!CARDS[id].ace&&CARDS[id].level<=Math.min(10,o.level+1)&&(
    CARDS[id].requiredTier==null||CARDS[id].requiredTier<=Math.max(1,o.id)));
 const element=[...candidates].filter(id=>CARDS[id].element===o.element),other=candidates.filter(id=>!element.includes(id));
 const order=[...element,...other];
 const shift=(o.id*3)%Math.max(1,order.length);
 const rotated=order.slice(shift).concat(order.slice(0,shift));
 const normals=rotated.slice(0,4);
 const ownFusion=UPDATE_B_FUSIONS_BY_SOURCE[o.id];
 const fusion=ownFusion.length?ownFusion:UPDATE_B_FUSION_IDS.filter(id=>CARDS[id].source<o.id&&!CARDS[id].trainingReward).slice(-2);
 UPDATE_B_LOOT[o.id]={easy:[...normals.slice(0,3),...fusion.slice(0,2)],hard:[...normals,...fusion.slice(0,3)]};
 // These same curated families also appear in the actual opponent decks.
 o.loot=[...UPDATE_B_LOOT[o.id].easy];
 o.hardLoot=[...UPDATE_B_LOOT[o.id].hard.slice(3)];
 o.easyManifest=normals[1];o.hardManifest=normals[3];
 if(o.id>=3)o.signature=o.aceCard; // True ACE identity for late opponents.
}
// Milestones draw from the finite collectible fusion catalogue, not retired
// milestone-only templates. Every choice offers three different cards.
for(const o of RPG_OPPONENTS){
 const available=UPDATE_B_FUSION_IDS.filter(id=>!CARDS[id].trainingReward&&(CARDS[id].source<0||CARDS[id].source<=o.id));
 const choices=[...available].sort((a,b)=>Math.abs(CARDS[a].level-o.level)-Math.abs(CARDS[b].level-o.level)||b-a).slice(0,6);
 if(choices.length<3)throw Error('Update B: Meilenstein-Auswahl leer');
 MILESTONE_FORMS[o.id]=choices;
}
// The 3 initial quest/fusion stages and ACE purchases retain their identity.
// No additional cards may become available just by lingering in CARDS.

/* Reserve the six pre-existing evolution enemy-card IDs BEFORE save loading.
 * The earlier evolution layer registered them only after loadProfile(), which
 * was unsafe for paused duels; these exact IDs (390–395) are preserved.
 */
const EVOLUTION_ENEMY_IDS={};
for(const [tier,items] of [[1,[[4,690,660,'Eisenfunke']]],[3,[[3,790,750,'Dornenklinge'],[4,900,860,'Hainwacht'],[5,1040,950,'Wurzelwolf'],[6,1130,1050,'Kronenhirsch'],[6,1080,1140,'Schildholz']]]]){
 EVOLUTION_ENEMY_IDS[tier]=items.map(([level,atk,def,name],index)=>{
  const o=RPG_OPPONENTS[tier],id=CARDS.length;
  const card={id,rpg:true,enemyOnly:true,fusionOnly:true,name,level,atk,def,source:tier,element:o.element,kind:o.kind,color:o.color,rarity:'normal',ability:index%2?'guard':'pierce',desc:'Spezielle Gegnerfusion für '+o.name};
  card.art=window.ArcaneArt?.makeArt(card)||makeArt(card);CARDS.push(card);return id;
 });
}
/* ESSENCE BOND · stable catalogue expansion, before any profile is validated.
 * New IDs are appended ONLY after all pre-existing cards; old IDs stay unchanged.
 * Entries are never in booster/loot/milestone pools. Ownership is quest-exclusive.
 */
const ESSENCE_MONSTER_IDS={};
for(const spec of [
 {school:'predator',name:'Essenzbestie · Reißzahn',level:3,atk:720,def:330,kind:'wolf',element:'DUNKEL',color:'#e4a272',role:'predator',desc:'Ein unabhängiges Essenzwesen. Seine Angriffe folgen seinem eigenen Instinkt.'},
 {school:'fusion',name:'Essenzbestie · Runenherz',level:3,atk:460,def:550,kind:'mage',element:'LICHT',color:'#b8a1f4',role:'weaver',desc:'Ein eigensinniges Essenzwesen, das Fusionswürfe beeinflusst.'},
 {school:'defense',name:'Essenzbestie · Aschenhort',level:3,atk:230,def:920,kind:'golem',element:'ERDE',color:'#98d8b9',role:'guardian',desc:'Ein unabhängiges Essenzwesen, dessen Widerstand aus fremdem Lebenswillen wächst.'}
]){const id=addRpgCard({...spec,essenceMonster:true,source:-1,rarity:'essence',fusionOnly:false});CARDS[id].art=window.ArcaneArt?.makeArt(CARDS[id])||makeArt(CARDS[id]);ESSENCE_MONSTER_IDS[spec.school]=id;RPG_BASE_CARDS.push(CARDS[id]);}
/* Explicit creature roles; old card stats/IDs and PvP remain unchanged.
 * Roles are assigned on CARD objects, not inferred by the duel UI.
 */
for(const c of RPG_BASE_CARDS.concat(RPG_FUSIONS)){
 if(c.essenceMonster)continue;
 const ratio=(Number(c.def)||0)/Math.max(1,Number(c.atk)||0);
 c.role=c.ability==='guide'?'weaver':c.ability==='hunt'?'hunter':ratio>=1.09?'guardian':ratio<=.82?'predator':(c.id%8===0?'support':'combatant');
}
const ROLE_SOUL_CANDIDATES=RPG_BASE_CARDS.filter(c=>!c.essenceMonster&&c.role==='guardian'&&c.level>=2);
for(let i=0;i<ROLE_SOUL_CANDIDATES.length;i++){
 const card=ROLE_SOUL_CANDIDATES[i];
 if(i%3===0||[7,22,387].includes(card.id)){card.role='soul';card.soulRank=Math.min(5,Math.max(1,Math.floor((card.level+1)/2)));}
}
for(const c of RPG_FUSIONS)if((c.role==='guardian'&&c.level>=4&&c.level%3===1)||(c.ability==='guard'&&c.level>=7&&c.id%5===0)){c.role='soul';c.soulRank=Math.min(5,Math.floor(c.level/2));}


/* Monsterwerkstatt 3.1: deterministic stage cards added AFTER the original
 * roster and the three exclusive Essence creatures. Existing IDs never move.
 * Each family reserves stable IDs through 12; only levels 1–10 are playable.
 * Levels 11/12 are held for a future post-tournament expansion.
 */
const ARCANE_NEW_FAMILIES=[
 ['Frostklingen-Greif','predator','WIND',1,'bird','#9bcfe9'],
 ['Basalt-Rammbock','guardian','ERDE',1,'golem','#a6b9ad'],
 ['Schattenegel der Tiefen','soul','DUNKEL',2,'serpent','#9d8fd1'],
 ['Glutjäger der Dünen','predator','FEUER',2,'wolf','#e4ac78'],
 ['Runenkröte des Moores','weaver','WASSER',2,'spirit','#85b9c5'],
 ['Kristallbastion','guardian','ERDE',3,'golem','#8cbdc3'],
 ['Nachtpirscher','predator','DUNKEL',3,'wolf','#b397d5'],
 ['Wurzelhüter der Dämmerung','guardian','ERDE',3,'plant','#94b986'],
 ['Spiegelmotte','support','LICHT',4,'bird','#d9c1f0'],
 ['Seelensumpf-Hydra','soul','WASSER',4,'serpent','#a4b4d4']
];
const ARCANE_STAGE_IDS=new Map();
const ARCANE_WORKSHOP_IDS=[];
function workshopTierFor(level){
 return level<=4?0:level<=6?3:level<=8?5:level<=10?7:11;
}
function workshopBudget(level){return 150+30*level*level;}
function workshopValues(level,role){
 const budget=workshopBudget(level);
 const share=role==='predator'?.76:role==='guardian'?.25:role==='soul'?.22:
  role==='support'?.43:role==='weaver'?.40:.53;
 return [Math.max(80,round10(budget*share)),Math.max(80,round10(budget*(1-share)))];
}
function registerWorkshopStage(card,rootId,level,origin){
 // Reserve stage IDs for later content without exposing these cards to players.
 if(level>TOURNAMENT_LEVEL_CAP){card.retired=true;card.workshopOnly=true;card.requiredTier=11;return;}
 card.lineRoot=rootId;card.variantOf=card.id===rootId?undefined:rootId;
 // Preserve pre-existing variant requirements; otherwise booster cards leak into tier 0.
 card.requiredTier=Math.max(workshopTierFor(level),Math.max(0,origin||0),Math.max(0,card.requiredTier||0));
 card.retired=false;card.rpg=true;card.fusionOnly=false;card.essenceMonster=false;
 card.ace=false;card.milestoneOnly=false;card.trainingReward=false;
 ARCANE_STAGE_IDS.set(rootId+':'+level,card.id);
 if(!RPG_BASE_CARDS.some(c=>c.id===card.id))RPG_BASE_CARDS.push(card);
 if(!UPDATE_B_SET.has(card.id)){
  UPDATE_B_SET.add(card.id);UPDATE_B_MAIN_IDS.push(card.id);UPDATE_B_ACTIVE_IDS.push(card.id);
 }
 if(!ARCANE_WORKSHOP_IDS.includes(card.id))ARCANE_WORKSHOP_IDS.push(card.id);
}
for(const rootId of NORMAL_LINE_ROOT_IDS){
 const root=CARDS[rootId],origin=Math.max(0,root.source||0);
 // Keep every pre-existing card's values/ID. Create the missing stages only.
 const existing=[root,...NORMAL_LINE_VARIANT_IDS.map(id=>CARDS[id]).filter(x=>x?.variantOf===rootId)];
 for(const card of existing)registerWorkshopStage(card,rootId,card.level,origin);
 for(let level=1;level<=12;level++){
  if(ARCANE_STAGE_IDS.has(rootId+':'+level))continue;
  const [atk,def]=workshopValues(level,root.role);
  const card={...root,id:undefined,name:root.name,art:root.art,level,atk,def,
   role:root.role,soulRank:root.role==='soul'?Math.min(5,Math.ceil(level/2)):undefined,
   rarity:'common',workshopOnly:true,variantOf:rootId,lineRoot:rootId,lineStep:level-root.level,
   source:origin,requiredTier:Math.max(origin,workshopTierFor(level)),
   desc:'Entwicklungsform Stufe '+level+' der Monsterfamilie '+root.name+'.'};
  const id=addRpgCard(card);
  registerWorkshopStage(CARDS[id],rootId,level,origin);
 }
}
for(const [name,role,element,origin,kind,color] of ARCANE_NEW_FAMILIES){
 const [atk,def]=workshopValues(1,role);
 const id=addRpgCard({name,level:1,atk,def,kind,element,color,role,source:origin,
  fusionOnly:false,rarity:'common',soulRank:role==='soul'?1:undefined,
  desc:'Neue normale Monsterfamilie. Im regulären Turnier bis Stufe 10 entwickelbar.'});
 const root=CARDS[id];
 root.art=window.ArcaneArt?.makeArt?.(root)||makeArt(root);
 registerWorkshopStage(root,id,1,origin);
 for(let level=2;level<=12;level++){
  const [a,d]=workshopValues(level,role);
  const childId=addRpgCard({...root,id:undefined,level,atk:a,def:d,
   soulRank:role==='soul'?Math.min(5,Math.ceil(level/2)):undefined,
   art:root.art,workshopOnly:true,variantOf:id,lineRoot:id,lineStep:level-1,
   requiredTier:Math.max(origin,workshopTierFor(level)),
   desc:'Entwicklungsform Stufe '+level+' der Monsterfamilie '+name+'.'});
  registerWorkshopStage(CARDS[childId],id,level,origin);
 }
}
// Full levels are deterministic IDs; no new copies are granted by this setup.

// Normalize legacy per-card combat perks after ALL RPG templates and workshop stages
// have been registered. General role abilities are deliberately unaffected.
const RETIRED_SINGLE_CARD_ABILITIES=new Set(['aegis','pierce','hunt','guide','rush','guard']);
for(const c of CARDS)if(c.rpg&&RETIRED_SINGLE_CARD_ABILITIES.has(c.ability)){
 c.ability=undefined;
 if(/(?:25 %|15 %|120 LP|240 LP|Fusionshilfe|Vorstoß|Durchbruch|Hüter:|Jäger:|Signatur:)/i.test(c.desc||''))
  c.desc='Monster mit allgemeinen Klassenfähigkeiten. Individuelle Schadensboni gegen andere Monster sind deaktiviert.';
}
const SAVE_KEY='arcane-duel-rpg-profile-v4-reborn',LEGACY_SAVE_KEY='arcane-duel-alpha-profile-v1',PROFILE_VERSION=3,OPPONENTS=RPG_OPPONENTS;
const UPGRADES={power:{name:'Monstertraining',desc:'Kleiner allgemeiner Bonus auf alle eigenen Monster, maximal +110 ATK und +110 DEF. Spezialisierungen lohnen sich stärker.',base:120,max:10},loot:{name:'Beutestudien',desc:'+5 % Essenz pro Stufe',base:240,max:5},learning:{name:'Werkzeugkunde',desc:'−5 % Herstellungskosten, +10 % XP pro Stufe',base:180,max:5},tempo:{name:'Trainingsroutine',desc:'Verkürzt Autokämpfe von 6 auf mindestens 3 Sekunden',base:100,max:4},starter:{name:'Grundausbildung',desc:'Je Stufe +35 ATK und +35 DEF auf die 20 ursprünglichen Startmonster.',base:60,max:8},fusionLore:{name:'Fusionskunde',desc:'Stufe 1: erster Fusionsversuch pro Duell erhält einen zusätzlichen Wertewurf (maximal vier).',base:430,max:1},resilience:{name:'Standhaftigkeit',desc:'Verlangsamt den automatischen Kreaturenzerfall eigener Monster um 3 Punkte pro Stufe (maximal zwei).',base:320,max:2},fusionPrecision:{name:'Runenpräzision',desc:'Bei Spezialfusionen mit mindestens drei Materialien je Stufe +1,5 Prozentpunkte Qualität; maximal +4,5 %, allgemeine Qualitätsobergrenze bleibt bestehen.',base:310,max:3},combatDiscipline:{name:'Kampfdisziplin',desc:'Eigene Monster verlieren pro Angriff 2 ATK weniger je Stufe: 28 / 26 / 24 statt 30.',base:260,max:3},openingAegis:{name:'Vorhut-Schutz',desc:'Zu Beginn jedes Einzelspielerduells erhältst du je Stufe 25 zusätzliche Schildpunkte (maximal +75).',base:350,max:3},
jagdinstinkt:{name:'Jagdinstinkt',desc:'Nur normale Predatoren: je Rang +15 ATK und +5 DEF, zusätzlich +8 ATK und +2 DEF pro Monsterlevel; maximal 5 Ränge.',base:260,max:5},
schildwall:{name:'Schildwall',desc:'Nur normale Wächter und Seelenzehrer: je Rang +20 DEF und +5 ATK, zusätzlich +8 DEF und +2 ATK pro Monsterlevel; maximal 5 Ränge.' ,base:280,max:5}};
function monsterTrainingBonus(level){return [35,25,15,10,8,6,4,3,2,2].slice(0,Math.max(0,Math.min(10,level||0))).reduce((a,b)=>a+b,0);}
let storageWarning='',storageWritable=true,storageConflict=false,lastStoredProfile=null,legacyImported=false;
function freshLegacyProfile(){return {version:2,coins:0,xp:0,wins:0,losses:0,pvpMatches:0,totalTurns:0,totalFusions:0,bestTurns:null,unlocked:[...DEFAULT_DECK],activeDeck:[...RPG_DEFAULT_DECK],fusionOwned:[...RPG_START_FUSIONS],fusionDeck:[...RPG_START_FUSIONS],enhancements:{},shards:Array(11).fill(0),pity:Array(11).fill(0),cleared:[],mastery:Array(11).fill(0),upgrades:{loot:0,learning:0,tempo:0,power:0,starter:0,fusionLore:0,resilience:0,fusionPrecision:0,combatDiscipline:0,openingAegis:0,jagdinstinkt:0,schildwall:0},specializationRebalance:true,strategy:'balanced',history:[],rewardLedger:[],nextMatch:1,settings:{animation:'fast',sound:false},unseen:[],lootHistory:[],investments:{},auto:{energy:AUTO_CAP,at:Date.now()},lastLoot:null,activeDuel:null,savedAt:0};}
function playerLevel(p){return Math.min(100,1+Math.floor(Math.sqrt(p.xp/60)));}
function levelFloor(level){return 60*(level-1)**2;}
// Each cleared tournament tier supports five player levels at full farming XP.
// Replaying an earlier opponent cannot bypass the tier's soft cap.
function farmingLevelCap(opponentId){return 5*Math.max(1,Math.min(highestCleared(),Math.max(1,opponentId||1)));}
function farmingXpFactor(opponentId,level=playerLevel(profile)){
 const excess=Math.max(0,level-farmingLevelCap(opponentId));
 return excess===0?1:Math.max(.10,.25*Math.pow(.8,excess-1));
}
function farmingDropFactor(opponentId,level=playerLevel(profile)){
 const excess=Math.max(0,level-farmingLevelCap(opponentId));
 return excess===0?1:Math.max(.25,1-.2*excess);
}
function validInt(v,max=1e9){return Number.isSafeInteger(v)&&v>=0&&v<=max;}
function migrateLegacy(raw){if(raw.version!==1||!validInt(raw.pvpMatches)||!['fast','instant'].includes(raw.settings?.animation))throw Error('Ungültiger älterer Spielstand.');const p=freshProfile();p.pvpMatches=raw.pvpMatches;p.settings={animation:raw.settings.animation,sound:raw.settings.sound===true};legacyImported=true;return p;}
function validateLegacyProfile(raw){if(raw?.version===1)return migrateLegacy(raw);if(!raw||raw.version!==2)throw Error('Nicht unterstützte Spielstand-Version.');const p=freshProfile();for(const k of ['coins','xp','wins','losses','pvpMatches','totalTurns','totalFusions','nextMatch']){if(!validInt(raw[k]))throw Error('Ungültiger Spielstand: '+k);p[k]=raw[k];}if(!p.nextMatch)throw Error('Ungültige Duellnummer.');
 const ids=(a,allowed)=>{if(!Array.isArray(a)||new Set(a).size!==a.length||a.some(x=>!allowed.includes(x)))throw Error('Ungültige Karten oder Gegner.');return [...a];};
 p.unlocked=ids(raw.unlocked,RPG_BASE_CARDS.map(c=>c.id));if(DEFAULT_DECK.some(id=>!p.unlocked.includes(id)))throw Error('Startkarten fehlen.');if(mainDeckError(raw.activeDeck,p.unlocked))throw Error(mainDeckError(raw.activeDeck,p.unlocked));p.activeDeck=[...raw.activeDeck];p.fusionOwned=ids(raw.fusionOwned,RPG_FUSIONS.map(c=>c.id));if(RPG_START_FUSIONS.some(id=>!p.fusionOwned.includes(id)))throw Error('Startfusionen fehlen.');p.fusionDeck=ids(raw.fusionDeck,p.fusionOwned);const error=fusionDeckError(p.fusionDeck);if(error)throw Error(error);
 p.cleared=ids(raw.cleared,OPPONENTS.slice(1).map(o=>o.id));if(p.cleared.some(id=>id>1&&!p.cleared.includes(id-1)))throw Error('Turnierstufen müssen der Reihe nach freigeschaltet sein.');
 for(const k of ['shards','pity','mastery']){if(!Array.isArray(raw[k])||raw[k].length!==11||raw[k].some(x=>!validInt(x,k==='pity'?4:1e9)))throw Error('Ungültiger Fortschritt.');p[k]=[...raw[k]];}
 for(const [id,rank]of Object.entries(raw.enhancements||{})){if(![...p.unlocked,...p.fusionOwned].includes(Number(id))||!(CARDS[Number(id)]?.rpg||Number(id)<20)||!validInt(rank,5))throw Error('Ungültige Verstärkung.');p.enhancements[id]=rank;}
 for(const key of Object.keys(UPGRADES)){const rank=['starter','fusionLore','resilience','fusionPrecision','combatDiscipline','openingAegis','jagdinstinkt','schildwall'].includes(key)?(raw.upgrades?.[key]??0):raw.upgrades?.[key];if(!validInt(rank,UPGRADES[key].max))throw Error('Ungültiger Ausbau.');p.upgrades[key]=rank;}
 // Existing Monstertraining investments were bought at the old +185 maximum.
 // Keep purchased ranks, credit a one-time 40% refund of their essence price.
 // New profiles are marked compensated already. Validation never alters the
 // original saved JSON; the credit becomes durable on the next successful save.
 p.specializationRebalance=raw.specializationRebalance===true;
 if(!p.specializationRebalance){
  const oldRanks=p.upgrades.power||0;
  if(oldRanks){
   let spent=0;for(let i=0;i<oldRanks;i++)spent+=Math.ceil(120*1.5**i);
   const refund=Math.min(1e9-p.coins,Math.floor(spent*.40));
   p.coins+=refund;
   p.migrationMessage='Monstertraining wurde neu balanciert. Deine '+oldRanks+' gekauften Stufen bleiben erhalten; als Ausgleich erhältst du '+refund+' Essenz für neue Spezialisierungen.';
  }
  p.specializationRebalance=true;
 }

 if(!['balanced','offensive','economy'].includes(raw.strategy))throw Error('Ungültige Strategie.');p.strategy=raw.strategy;if(raw.bestTurns!==null&&!validInt(raw.bestTurns,30))throw Error('Ungültige Statistik.');p.bestTurns=raw.bestTurns;
 if(!Array.isArray(raw.rewardLedger)||raw.rewardLedger.length>512||raw.rewardLedger.some(x=>typeof x!=='string'||x.length>100))throw Error('Ungültige Belohnungen.');p.rewardLedger=[...new Set(raw.rewardLedger)];
 if(!Array.isArray(raw.history)||raw.history.length>30)throw Error('Ungültige Historie.');p.history=raw.history.map(h=>{if(!validInt(h.opponent,10)||typeof h.win!=='boolean'||!validInt(h.turns,30)||!validInt(h.coins)||!validInt(h.xp)||!validInt(h.at,1e15)||!['free','tournament','auto'].includes(h.context))throw Error('Ungültiger Duelleintrag.');return {opponent:h.opponent,win:h.win,turns:h.turns,coins:h.coins,xp:h.xp,at:h.at,context:h.context};});
 if(!['fast','instant'].includes(raw.settings?.animation)||typeof raw.settings?.sound!=='boolean')throw Error('Ungültige Einstellungen.');p.settings={animation:raw.settings.animation,sound:raw.settings.sound};if(!validInt(raw.auto?.energy,AUTO_CAP)||!validInt(raw.auto?.at,1e15))throw Error('Ungültige Trainingsladung.');p.auto={energy:raw.auto.energy,at:Math.min(Date.now(),raw.auto.at)};p.unseen=ids(raw.unseen||[],[...p.unlocked,...p.fusionOwned]);p.lootHistory=(raw.lootHistory||[]).slice(0,30).map(validateLootEntry);p.lastLoot=p.lootHistory[0]||null;for(const [id,cost] of Object.entries(raw.investments||{})){if(!ownsProfileCard(p,Number(id))||!validInt(cost.coins)||!validInt(cost.shards))throw Error('Ungültige Investition.');p.investments[id]={coins:cost.coins,shards:cost.shards};}p.savedAt=validInt(raw.savedAt,1e15)?raw.savedAt:0;p.activeDuel=raw.activeDuel?validateDuelSnapshot(raw.activeDuel):null;if(p.activeDuel&&p.rewardLedger.includes(p.activeDuel.id))p.activeDuel=null;return p;
}
function markStorageConflict(){storageConflict=true;storageWarning='Ein anderer Tab hat den Spielstand geändert. Speichern und neue Kämpfe sind angehalten. Exportiere bei Bedarf diesen Stand und lade die Seite neu.';}
function loadProfile(){try{lastStoredProfile=window.localStorage.getItem(SAVE_KEY);if(lastStoredProfile){const raw=JSON.parse(lastStoredProfile);if(raw.evolution&&raw.activeDuel){window.__arcaneEvolutionPendingSave=raw.activeDuel;raw.activeDuel=null;}const loaded=validateProfile(raw);if(raw.evolution)loaded.evolution=raw.evolution;return loaded;}return freshProfile();}catch(e){storageWritable=false;storageWarning='Spielstand konnte nicht geladen werden. Bestehende Daten bleiben erhalten. Exportiere deinen Fortschritt oder importiere eine gültige Sicherung.';return freshProfile();}}
let profile=loadProfile();
function saveProfile(){if(!storageWritable||storageConflict)return false;try{if(window.localStorage.getItem(SAVE_KEY)!==lastStoredProfile){markStorageConflict();return false;}syncSlot();profile.savedAt=Date.now();const text=JSON.stringify(profile);window.localStorage.setItem(SAVE_KEY,text);lastStoredProfile=text;storageWarning='';return true;}catch(e){storageWarning='Speichern nicht möglich. Bitte sichere deinen Fortschritt über Einstellungen → Export.';return false;}}
function newMatchId(){const id=Date.now().toString(36)+'-'+profile.nextMatch+'-'+rng(0xffffffff).toString(36);profile.nextMatch=profile.nextMatch>=1e9?1:profile.nextMatch+1;saveProfile();return id;}
function tournamentUnlocked(id){return id>=1&&id<=10&&(id===1||profile.cleared.includes(id-1));}
function opponentUnlocked(id){return id===0||profile.cleared.includes(id);}
function upgradeCost(key,p=profile){if(key==='tempo')return [100,180,300,480][p.upgrades.tempo]??Infinity;return Math.ceil(UPGRADES[key].base*1.50**p.upgrades[key]);}
function buyUpgrade(key){if(storageConflict||!UPGRADES[key]||profile.upgrades[key]>=UPGRADES[key].max||profile.coins<upgradeCost(key))return false;profile.coins-=upgradeCost(key);profile.upgrades[key]++;saveProfile();return true;}

function cardCost(id){const c=CARDS[id],levelSurcharge=c.variantOf!=null?60*c.lineStep+25*c.level:0;return Math.ceil((60+Math.max(0,c.source)*45+levelSurcharge)*(1-.05*profile.upgrades.learning));}






function refreshEnergy(now=Date.now()){const a=profile.auto,elapsed=Math.max(0,now-a.at),count=Math.floor(elapsed/60000);if(a.energy>=AUTO_CAP){a.at=now;return;}if(count){a.energy=Math.min(AUTO_CAP,a.energy+count);a.at=a.energy===AUTO_CAP?now:a.at+count*60000;}}
function consumeEnergy(){if(storageConflict)return false;refreshEnergy();if(profile.auto.energy<1)return false;profile.auto.energy--;saveProfile();return true;}

function awardLoot(g,first){const o=OPPONENTS[g.opponentId],id=o.id;profile.shards[id]=Math.min(1e9,profile.shards[id]+2+(first?6:0));const missing=o.loot.filter(id=>!ownsCard(id));profile.pity[id]=Math.min(4,profile.pity[id]+1);let card=null,duplicate=false;if(first||profile.pity[id]>=4||randomInt(g,100)<35){const fusionMissing=missing.filter(id=>CARDS[id].fusionOnly);const candidates=first?(fusionMissing.length?fusionMissing:o.loot.filter(id=>CARDS[id].fusionOnly)):profile.pity[id]>=4&&missing.length?missing:o.loot;card=candidates[randomInt(g,candidates.length)];duplicate=ownsCard(card);if(duplicate)profile.shards[id]=Math.min(1e9,profile.shards[id]+4);else {(CARDS[card].fusionOnly?profile.fusionOwned:profile.unlocked).push(card);profile.unseen.push(card);}if(!duplicate||!missing.length)profile.pity[id]=0;}return {card,duplicate,shards:2+(first?6:0)+(duplicate?4:0),source:id};}

function exportProfile(){refreshEnergy();const blob=new Blob([JSON.stringify(profile,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Arcane_Duel_RPG_Spielstand.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function importProfileText(text){const next=validateProfile(JSON.parse(text));try{const serialized=JSON.stringify(next);window.localStorage.setItem(SAVE_KEY,serialized);lastStoredProfile=serialized;}catch(e){throw Error('Import konnte nicht gespeichert werden. Der bisherige Stand bleibt erhalten.');}profile=next;storageWritable=true;storageConflict=false;storageWarning='';return true;}

function ownsProfileCard(p,id){return p.unlocked.includes(id)||p.fusionOwned.includes(id);}
function validateLootEntry(l){if(!l||!validInt(l.source,10)||!validInt(l.shards,100)||!validInt(l.at,1e15)||typeof l.duplicate!=='boolean'||(l.card!==null&&![...lootPool(l.source,'hard'),...lootPool(l.source,'easy')].includes(l.card)))throw Error('Ungültige Beutehistorie.');return {source:l.source,shards:l.shards,at:l.at,duplicate:l.duplicate,card:l.card};}
function investmentFor(id){if(profile.investments[id])return profile.investments[id];let coins=0,shards=0;for(let rank=0;rank<(profile.enhancements[id]||0);rank++){coins+=Math.ceil((40+Math.max(0,CARDS[id].source)*30)*(rank+1)*.75);shards+=2+rank;}return {coins,shards};}
function refundQuote(id){const spent=investmentFor(id);return {coins:Math.floor(spent.coins*.75),shards:Math.floor(spent.shards*.75),source:Math.max(0,CARDS[id].source)};}


function freshProfile(){const p=freshLegacyProfile();p.version=3;p.inventory=Object.fromEntries(DEFAULT_DECK.map(id=>[id,2]));RPG_START_FUSIONS.forEach(id=>p.inventory[id]=2);p.fusionDeck=RPG_START_FUSIONS.flatMap(id=>[id,id]);p.slots=Array.from({length:3},(_,i)=>({name:'Deck '+(i+1),main:[...p.activeDeck],fusion:[...p.fusionDeck]}));p.activeSlot=0;p.favorites=[];p.manualEasy=Array(11).fill(0);p.hardWins=Array(11).fill(0);p.dropCharges=0;p.useDropCharges=false;p.packProgress=Array(22).fill(0);p.packs=Array(22).fill(0);p.openPack=null;p.challenges=[];p.lastReview=null;p.migrationMessage='';p.progressionVersion=3;p.trainingWins=0;p.milestones=[];p.rewardQueue=[];p.encounters=[];p.wanderer=null;p.lastBooster=null;p.acePurchased=[];p.aceHints=[];p.tournamentLosses=Array(11).fill(0);p.guideSeen=false;p.showcase={pending:false,seen:false,firstWin:false,streak:0,offered:false};return p;}
// Besitzer früherer normaler ACEs behalten ihre Karten. Wurden solche ACEs
// in Alpha 2.5 zur Fusion, werden Hauptdecks vor der strengen Profilprüfung
// repariert. Kein Zurücksetzen von Inventar, Münzen, Fortschritt oder Aufstiegen.
function migrateFusionAceDecks(raw){
 if(!raw||raw.version!==3||!Array.isArray(raw.unlocked))return raw;
 const converted=new Set(RPG_OPPONENTS.slice(3).map(o=>ACE_CARD_IDS[o.id]));
 if(!raw.unlocked.some(id=>converted.has(id)))return raw;
 const p=JSON.parse(JSON.stringify(raw)),moving=p.unlocked.filter(id=>converted.has(id));
 p.unlocked=p.unlocked.filter(id=>!converted.has(id));
 p.fusionOwned=Array.isArray(p.fusionOwned)?[...new Set([...p.fusionOwned,...moving])]:moving;
 p.inventory=p.inventory&&typeof p.inventory==='object'?p.inventory:{};
 const options=p.unlocked.filter(id=>CARDS[id]&&!CARDS[id].fusionOnly)
  .sort((a,b)=>(CARDS[b].atk+CARDS[b].def)-(CARDS[a].atk+CARDS[a].def));
 function repair(deck){if(!Array.isArray(deck))return deck;
  const fixed=[...deck];for(let i=0;i<fixed.length;i++)if(converted.has(fixed[i])){
   let id=options.find(x=>fixed.filter(y=>y===x).length<Math.min(3,p.inventory[x]||0));
   if(id===undefined){id=options.find(x=>fixed.filter(y=>y===x).length<3);
    if(id!==undefined)p.inventory[id]=Math.max(p.inventory[id]||0,fixed.filter(y=>y===id).length+1);}
   if(id===undefined)throw Error('Kein Ersatzmonster für bisheriges ACE-Hauptdeck.');fixed[i]=id;
  }return fixed;
 }
 p.activeDeck=repair(p.activeDeck);
 if(Array.isArray(p.slots))p.slots=p.slots.map(slot=>({...slot,main:repair(slot.main)}));
 // Ein ehemals im Hauptdeck gespieltes ACE kann sofort im Fusionsdeck ausgerüstet werden.
 if(Array.isArray(p.fusionDeck))for(const id of moving)
  if(p.fusionDeck.length<15&&!p.fusionDeck.includes(id)&&(p.inventory[id]||0)>0)p.fusionDeck.push(id);
 if(Array.isArray(p.slots)&&Number.isInteger(p.activeSlot)&&p.slots[p.activeSlot])
  p.slots[p.activeSlot]={...p.slots[p.activeSlot],main:[...p.activeDeck],fusion:[...p.fusionDeck]};
 // Eine begonnene Partie mit den alten Normal-Kartenregeln könnte unzulässig sein.
 if(p.activeDuel&&p.activeDuel.players?.[0]?.originalDeck?.some(id=>converted.has(id)))p.activeDuel=null;
 p.__migratedFusionAces=true;
 return p;
}
function validateProfileCore(raw){raw=migrateFusionAceDecks(raw);if(raw?.version===1)return migrateLegacy(raw);if(!raw||![2,3].includes(raw.version))throw Error('Nicht unterstützte Spielstand-Version.');const v3=raw.version===3,legacy={...raw,version:2,upgrades:{...raw.upgrades,power:raw.upgrades?.power||0},fusionDeck:[...RPG_START_FUSIONS],activeDuel:null,history:(raw.history||[]).map(h=>({...h,context:h.context==='challenge'?'free':h.context}))};const p=validateLegacyProfile(legacy);p.version=3;
 if(!v3){p.inventory=Object.fromEntries([...p.unlocked,...p.fusionOwned].map(id=>[id,CARDS[id].fusionOnly?Math.max(2,countCard(raw.fusionDeck,id)):3]));p.fusionDeck=[...raw.fusionDeck];p.slots=Array.from({length:3},(_,i)=>({name:'Deck '+(i+1),main:[...p.activeDeck],fusion:[...p.fusionDeck]}));p.migrationMessage='Alpha 1.5: Sammlung und Decks übernommen. Basiskarten: drei Exemplare je bekannter Art; Fusionen: mindestens zwei. Alte laufende Duelle wurden wegen der neuen Fusionsregeln beendet. Hardmode zählt neue manuelle Easy-Siege.';return p;}
 if(!raw.inventory||typeof raw.inventory!=='object'||Array.isArray(raw.inventory))throw Error('Ungültiger Kartenbestand.');p.inventory={};for(const [key,n]of Object.entries(raw.inventory)){const id=Number(key);if(![...p.unlocked,...p.fusionOwned].includes(id)||!validInt(n,999999))throw Error('Ungültiger Kartenbestand.');p.inventory[id]=n;}
 const deck=(d,fusion=false)=>{const err=fusion?fusionDeckError(d):mainDeckError(d);if(err||inventoryError(d,p.inventory))throw Error(err||'Deck enthält fehlende Exemplare.');return [...d];};p.activeDeck=deck(raw.activeDeck);p.fusionDeck=deck(raw.fusionDeck,true);
 if(!Array.isArray(raw.slots)||raw.slots.length!==3||!validInt(raw.activeSlot,2))throw Error('Ungültige Deckplätze.');p.activeSlot=raw.activeSlot;p.slots=raw.slots.map((s,i)=>({name:'Deck '+(i+1),main:deck(s.main),fusion:deck(s.fusion,true)}));p.slots[p.activeSlot]={name:'Deck '+(p.activeSlot+1),main:[...p.activeDeck],fusion:[...p.fusionDeck]};
 const arr=(name,len,max)=>{const a=raw[name];if(!Array.isArray(a)||a.length!==len||a.some(n=>!validInt(n,max)))throw Error('Ungültiger Fortschritt: '+name);return [...a];};p.manualEasy=arr('manualEasy',11,1e9);p.hardWins=arr('hardWins',11,1e9);p.packProgress=arr('packProgress',22,999);p.packs=arr('packs',22,999999);if(!validInt(raw.dropCharges,8)||typeof raw.useDropCharges!=='boolean')throw Error('Ungültige Dropladungen.');p.dropCharges=raw.dropCharges;p.useDropCharges=raw.useDropCharges;
 if(!Array.isArray(raw.favorites)||raw.favorites.some(id=>!CARDS[id]||!ownsProfileCard(p,id)))throw Error('Ungültige Favoriten.');p.favorites=[...new Set(raw.favorites)];if(!Array.isArray(raw.challenges)||raw.challenges.some(id=>!CHALLENGES.some(c=>c.id===id)))throw Error('Ungültige Challenges.');p.challenges=[...new Set(raw.challenges)];p.openPack=raw.openPack?validatePack(raw.openPack):null;p.lastReview=raw.lastReview?validateReview(raw.lastReview):null;p.migrationMessage=typeof raw.migrationMessage==='string'?raw.migrationMessage.slice(0,400):'';
 p.activeDuel=raw.activeDuel?validateDuelSnapshot(raw.activeDuel):null;if(p.activeDuel&&p.rewardLedger.includes(p.activeDuel.id))p.activeDuel=null;if(raw.__migratedFusionAces)p.migrationMessage='ACE-Update: Gekaufte Fusions-ACEs wurden im Inventar erhalten und aus alten Hauptdecks ins Fusionsdeck übertragen. Bitte deine Deckplätze prüfen.';return p;
}
function syncSlot(){if(!profile.slots)return;profile.slots[profile.activeSlot]={name:'Deck '+(profile.activeSlot+1),main:[...profile.activeDeck],fusion:[...profile.fusionDeck]};}
function ownsCard(id){return (profile.inventory[id]||0)>0;}
function addCard(id){const c=CARDS[id],owned=ownsCard(id);profile.inventory[id]=Math.min(999999,(profile.inventory[id]||0)+1);const list=c.fusionOnly?profile.fusionOwned:profile.unlocked;if(!list.includes(id))list.push(id);if(!profile.unseen.includes(id))profile.unseen.push(id);return owned;}
function hardUnlocked(id){return opponentUnlocked(id)&&profile.manualEasy[id]>=10&&(id!==0||profile.trainingWins===3&&profile.cleared.includes(1));}
function autoUnlocked(id,difficulty='easy'){return id===0&&(profile.trainingWins||0)<3?false:difficulty==='hard'?hardUnlocked(id)&&profile.hardWins[id]>=3:opponentUnlocked(id)&&profile.mastery[id]>=3;}
function cardAvailable(id){const c=CARDS[id];return !!c&&c.level<=TOURNAMENT_LEVEL_CAP&&UPDATE_B_SET.has(id)&&(!c.ace||ownsCard(id))&&c?.rpg&&(c.requiredTier==null||highestCleared()>=c.requiredTier)&&(!c.milestoneOnly||ownsCard(id))&&(!c.trainingReward||profile.trainingWins>=3)&&(c.source<0||opponentUnlocked(c.source)&&(!c.hard||hardUnlocked(c.source)&&profile.hardWins[c.source]>=1)&&(!c.manifestOf||ownsProfileCard(profile,c.manifestOf)||c.milestoneOnly&&ownsCard(id)));}
function craftCard(id){const c=CARDS[id],source=Math.max(0,c?.source??0);if(storageConflict||c?.essenceMonster||!cardAvailable(id)||sharedShards()<SHARD_CRAFT_COST||profile.coins<cardCost(id))return false;if(!spendSharedShards(SHARD_CRAFT_COST))return false;profile.coins-=cardCost(id);addCard(id);saveProfile();return true;}

function setActiveDeck(ids){if(storageConflict||mainDeckError(ids)||inventoryError(ids,profile.inventory))return false;profile.activeDeck=[...ids];saveProfile();return true;}
function setFusionDeck(ids){if(storageConflict||fusionDeckError(ids)||inventoryError(ids,profile.inventory))return false;profile.fusionDeck=[...ids];saveProfile();return true;}
function equipBest(){if(storageConflict)return;profile.activeDeck=strongestMainDeck(profile.unlocked,profile.enhancements,profile.inventory);profile.fusionDeck=bestFusionDeck(profile.fusionOwned,profile.enhancements,profile.inventory);saveProfile();}
function selectDeckSlot(index){if(storageConflict||!validInt(index,2))return false;syncSlot();profile.activeSlot=index;profile.activeDeck=[...profile.slots[index].main];profile.fusionDeck=[...profile.slots[index].fusion];saveProfile();return true;}
function reservedCopies(id){syncSlot();return Math.max(...profile.slots.map(s=>countCard(CARDS[id].fusionOnly?s.fusion:s.main,id)));}
function salvageCard(id){if(storageConflict||CARDS[id]?.essenceMonster||!ownsCard(id)||profile.favorites.includes(id)||profile.inventory[id]<=Math.max(1,reservedCopies(id)))return false;profile.inventory[id]--;const source=Math.max(0,CARDS[id].source||0),gain=CARDS[id].fusionOnly?4:2;profile.shards[source]=Math.min(1e9,profile.shards[source]+gain);saveProfile();return true;}
function lootPool(source,difficulty='easy'){return [...(difficulty==='hard'?UPDATE_B_LOOT[source]?.hard:UPDATE_B_LOOT[source]?.easy)||[]];}
function lootWeights16(source,difficulty='easy',pack=false){
 const pool=lootPool(source,difficulty),commons=pool.filter(id=>!CARDS[id].fusionOnly),rares=pool.filter(id=>CARDS[id].fusionOnly);
 if(!pool.length||!commons.length||!rares.length)throw Error('Update B: unvollstaendiger Beutepool '+source);
 const rareWeight=pack?22:difficulty==='hard'?34:25;
 return pool.map(id=>({id,weight:CARDS[id].fusionOnly?rareWeight/rares.length:(100-rareWeight)/commons.length}));
}
function packKey(source,difficulty){return source*2+(difficulty==='hard'?1:0);}
function grantPackProgress(source,difficulty,amount){const k=packKey(source,difficulty),total=profile.packProgress[k]+amount;profile.packs[k]=Math.min(999999,profile.packs[k]+Math.floor(total/1000));profile.packProgress[k]=total%1000;}
function packPrice(source,difficulty,pick){return Math.ceil(OPPONENTS[source].coins*(difficulty==='hard'?1.6:1)*(pick===1?2:4));}
/* Drei verschiedene Vorlagen; höchstens eine seltene Karte pro Pack.
 * Das gesamte Pack wird beim Öffnen festgelegt und gespeichert. */
function characterPackCompanion(source){
 const o=OPPONENTS[source],candidates=CARDS.filter(c=>c.id<20&&c.element===o.element);
 return candidates[source%candidates.length].id;
}
function characterPackRareChance(source,difficulty='easy'){
 const table=lootWeights(source,difficulty,true);
 const weight=table.filter(x=>CARDS[x.id].fusionOnly||CARDS[x.id].manifestOf).reduce((n,x)=>n+x.weight,0);
 return weight?Math.min(.10,Math.max(.03,weight/100*.35)):0;
}
function drawCharacterPackOffers(g,source,difficulty='easy'){
 const table=lootWeights(source,difficulty,true),isRare=id=>!!(CARDS[id].fusionOnly||CARDS[id].manifestOf);
 const common=table.filter(x=>!isRare(x.id)),rare=table.filter(x=>isRare(x.id));
 // Jeder Gegner kann einen bekannten Element-Begleiter anbieten.
 // So gibt es auch ohne erzwungenes Rare drei unterschiedliche normale Optionen.
 if(common.length<3)common.push({id:characterPackCompanion(source),weight:30});
 if(common.length<3)throw Error('Dieser Duellant hat noch zu wenige gewöhnliche Charakterkarten.');
 const pick=(pool)=>{
  const total=pool.reduce((n,x)=>n+x.weight,0);
  let roll=randomInt(g,1000000)/1000000*total,index=pool.length-1;
  for(let i=0;i<pool.length;i++){roll-=pool[i].weight;if(roll<0){index=i;break;}}
  return pool.splice(index,1)[0].id;
 };
 // Die Entscheidung über einen seltenen Slot fällt ein einziges Mal pro Pack.
 // 8–26 % Packchance, abhängig von Gegnerpool und Spieler-Seltenheitsbonus.
 const chance=characterPackRareChance(source,difficulty);
 const offers=[];
 if(rare.length&&randomInt(g,1000000)<Math.round(chance*1000000))offers.push(pick(rare));
 while(offers.length<3)offers.push(pick(common));
 for(let i=offers.length-1;i>0;i--){const j=randomInt(g,i+1);[offers[i],offers[j]]=[offers[j],offers[i]];}
 return offers;
}
function openCharacterPack(source,difficulty='easy'){if(storageConflict||profile.openPack)return false;const key=packKey(source,difficulty);if(!profile.packs[key])return false;const g={seed:rng(0xffffffff)||1};const cards=drawCharacterPackOffers(g,source,difficulty);profile.packs[key]--;profile.openPack={source,difficulty,cards,taken:[],created:Date.now()};saveProfile();return true;}
function validatePack(p){if(!p||!validInt(p.source,10)||!['easy','hard'].includes(p.difficulty)||!Array.isArray(p.cards)||p.cards.length!==3||p.cards.some(id=>!lootPool(p.source,p.difficulty).includes(id)&&id!==characterPackCompanion(p.source))||!Array.isArray(p.taken)||new Set(p.taken).size!==p.taken.length||p.taken.some(i=>!validInt(i,2))||!validInt(p.created,1e15))throw Error('Ungültiges geöffnetes Pack.');return {source:p.source,difficulty:p.difficulty,cards:[...p.cards],taken:[...p.taken],created:p.created};}
function takePackCard(index){const p=profile.openPack;if(storageConflict||!p||!validInt(index,2)||p.taken.includes(index))return false;const cost=p.taken.length?packPrice(p.source,p.difficulty,p.taken.length):0;if(profile.coins<cost)return false;profile.coins-=cost;addCard(p.cards[index]);p.taken.push(index);saveProfile();return true;}
function closeCharacterPack(){if(storageConflict||!profile.openPack?.taken.length)return false;profile.openPack=null;saveProfile();return true;}
function validateReview(r){if(!r||!validInt(r.source,10)||!Array.isArray(r.log)||r.log.length>80||r.log.some(s=>typeof s!=='string'||s.length>500)||!Array.isArray(r.findings)||r.findings.some(k=>!['attack','loss','bridge'].includes(k))||!Array.isArray(r.bought)||r.bought.some(k=>!r.findings.includes(k)))throw Error('Ungültige Duellchronik.');return {source:r.source,log:[...r.log],findings:[...new Set(r.findings)],bought:[...new Set(r.bought)]};}
const HINTS={attack:'Ein möglicher direkter Angriff oder günstiger Kartentausch blieb am Zugende ungenutzt. Prüfe, ob du Schaden oder einen Kartentausch verpasst hast.',loss:'Eine Feldfusion hat deine ATK gesenkt. Wäge den Werteverlust gegen die neue Stufe oder Fähigkeit ab.',bridge:'Für keine Kombination aus zwei Handkarten war noch eine passende Fusionskopie verfügbar. Prüfe die verbleibenden Kopien und mögliche Zwischenstufen.'};
function buyHint(){const r=profile.lastReview;if(storageConflict||!r)return null;const next=r.findings.find(k=>!r.bought.includes(k)),cost=Math.max(10,Math.round(OPPONENTS[r.source].coins*.5));if(!next||profile.coins<cost)return null;profile.coins-=cost;r.bought.push(next);saveProfile();return HINTS[next];}
function challengeEligible(id){const c=CHALLENGES.find(x=>x.id===id);if(!c||!opponentUnlocked(c.opponent))return false;if(id==='arsenal')return profile.fusionDeck.length<=5;if(id==='unique')return new Set(profile.fusionDeck).size===profile.fusionDeck.length;if(id==='theme')return profile.activeDeck.filter(cid=>CARDS[cid].source===1).length>=6;return true;}
function rewardMatchCore(g){if(storageConflict||g.winner===null||g.rewardClaimed||profile.rewardLedger.includes(g.id))return null;g.rewardClaimed=true;profile.rewardLedger.push(g.id);profile.rewardLedger=profile.rewardLedger.slice(-512);if(g.mode==='pvp'){profile.pvpMatches++;saveProfile();return {coins:0,xp:0,pvp:true};}
 if(g.surrendered){profile.losses++;profile.lastReview={source:g.opponentId,log:[...g.log],findings:[],bought:[]};profile.history.unshift({opponent:g.opponentId,win:false,turns:g.turn,coins:0,xp:0,at:Date.now(),context:['challenge','encounter'].includes(g.context)?'free':g.context});profile.history=profile.history.slice(0,30);saveProfile();return {coins:0,xp:0,loot:null,charge:0,surrendered:true};}
 const o=OPPONENTS[g.opponentId],win=g.winner===0,automatic=g.context==='auto',hard=g.difficulty==='hard',boost=automatic&&g.boosted&&profile.dropCharges>0,ratio=automatic?(boost?.5:.3):1,scale=hard?1.6:1,first=win&&g.context==='tournament'&&!profile.cleared.includes(o.id);
 if(boost)profile.dropCharges--;const charge=automatic?0:Math.min(1,dropChargeCap()-profile.dropCharges);profile.dropCharges+=charge;
 let coins=win?Math.floor(o.coins*scale*(1+.05*profile.upgrades.loot)*ratio):g.context==='free'?Math.round(o.coins*.25):0;const noviceBonus=Math.max(0,10-playerLevel(profile))*.065;const repeatFarm=!first&&['free','auto','tournament','encounter'].includes(g.context);const xpFactor=repeatFarm?farmingXpFactor(o.id):1;let xp=Math.floor(o.xp*scale*(win?1:.15)*(1+.1*profile.upgrades.learning)*ratio*(1+noviceBonus)*xpFactor);if(first){
  // First tournament victories grant a meaningful but finite XP bonus.
  // The general XP curve is gentler, while repeat-farming remains soft-capped.
  xp=Math.round(xp*3);
  coins+=o.coins*3;profile.cleared.push(o.id);
 }profile.coins=Math.min(1e9,profile.coins+coins);profile.xp=Math.min(1e9,profile.xp+xp);let loot=null;
 if(win){profile.wins++;profile.mastery[o.id]++;if(!automatic&&g.context==='free'){if(hard)profile.hardWins[o.id]++;else profile.manualEasy[o.id]++;}let shards=automatic?(boost?2:1):3;shards+=first?6:0;profile.shards[o.id]=Math.min(1e9,profile.shards[o.id]+shards);let card=null,duplicate=false;const chance=automatic?(boost?20:12):40;const dropFactor=g.context==='free'||g.context==='auto'?farmingDropFactor(o.id):1;if(!first&&randomInt(g,100)<(g.context==='encounter'?60:chance)*dropFactor){card=drawLoot(g,o.id,g.difficulty);duplicate=addCard(card);}loot={source:o.id,shards,card,duplicate,at:Date.now()};profile.lastLoot=loot;profile.lootHistory.unshift(loot);profile.lootHistory=profile.lootHistory.slice(0,30);grantPackProgress(o.id,g.difficulty,automatic?(boost?100:60):200);profile.bestTurns=profile.bestTurns===null?g.turn:Math.min(profile.bestTurns,g.turn);
 }else{profile.losses++;if(g.context==='free')profile.shards[o.id]++;}
 let challengeBonus=0;if(win&&g.context==='challenge'&&g.challenge&&!profile.challenges.includes(g.challenge)){const c=CHALLENGES.find(x=>x.id===g.challenge),p=g.players[0];const valid=c&&challengeCompleted(g)&&c.opponent===g.opponentId&&(c.id!=='arsenal'||p.fusionDeck.length<=5)&&(c.id!=='unique'||new Set(p.fusionDeck).size===p.fusionDeck.length)&&(c.id!=='blitz'||g.turn<=8)&&(c.id!=='theme'||p.originalDeck.filter(cid=>CARDS[cid].source===1).length>=6);if(valid){profile.challenges.push(c.id);challengeBonus=c.reward;profile.coins=Math.min(1e9,profile.coins+c.reward);}}
 profile.totalTurns+=g.turn;profile.totalFusions+=g.totalFusions[0];profile.history.unshift({opponent:o.id,win,turns:g.turn,coins:coins+challengeBonus,xp,at:Date.now(),context:['challenge','encounter'].includes(g.context)?'free':g.context});profile.history=profile.history.slice(0,30);if(!automatic)profile.lastReview={source:o.id,log:[...g.log],findings:Object.keys(g.findings||{}).filter(k=>g.findings[k]),bought:[]};saveProfile();return {coins:coins+challengeBonus,xp,first,pvp:false,loot,charge,boost,challengeBonus,trainingShard:!win&&g.context==='free'?1:0};}

function validateProfile16(raw){
 if(raw?.version===1)return migrateLegacy(raw);
 const modern=raw?.progressionVersion===2;
 const prepared=modern?raw:{...raw,activeDuel:null};
 const p=validateProfileCore(prepared);
 if(modern){if(!validInt(raw.trainingWins,3))throw Error('Ungültige Trainingsreihe.');p.trainingWins=raw.trainingWins;}
 else {
  p.trainingWins=0;
  // Transfer existing ranks to the flat system; reimburse the old paid resources once.
  let refunded=0;for(const [id,rank]of Object.entries(p.enhancements)){const cost=p.investments[id]||{coins:Array.from({length:rank},(_,r)=>Math.ceil((40+Math.max(0,CARDS[id].source)*30)*(r+1)*.75)).reduce((a,b)=>a+b,0),shards:[3,5,6,8,9].slice(0,rank).reduce((a,b)=>a+b,0)};p.coins=Math.min(1e9,p.coins+cost.coins);refunded+=cost.coins;const source=Math.max(0,CARDS[id].source);p.shards[source]=Math.min(1e9,p.shards[source]+cost.shards);}
  p.investments={};p.migrationMessage='Alpha 1.6: Verbesserungsränge übernommen (+30 ATK/DEF je Rang statt Prozentbonus); frühere Verbesserungskosten erstattet ('+refunded+' Essenz plus Splitter). Die neue Trainingsreihe ist verfügbar. Ältere laufende Duelle wurden wegen der geänderten Regeln beendet.';
 }
 p.progressionVersion=2;return p;
}
function freeCopies(id){return profile.favorites.includes(id)?0:Math.max(0,(profile.inventory[id]||0)-Math.max(1,reservedCopies(id)));}
function enhanceCost(id){const c=CARDS[id],rank=profile.enhancements[id]||0;return {copies:(c?.fusionOnly&&c.rarity==='rare'?[1,3,4,5,5]:[3,5,7,9,11])[rank]||0,coins:0,shards:0,source:Math.max(0,c?.source||0)};}
function enhanceCard(id){const cost=enhanceCost(id);if(storageConflict||!CARDS[id]||CARDS[id].essenceMonster||!ownsCard(id)||(profile.enhancements[id]||0)>=5||!cost.copies||freeCopies(id)<cost.copies)return false;profile.inventory[id]-=cost.copies;profile.enhancements[id]=(profile.enhancements[id]||0)+1;saveProfile();return true;}
function resetEnhancement(){return false;}
function sellPrice(id){return CARDS[id].fusionOnly?8:3;}
function sellCard(id){if(storageConflict||!CARDS[id]||CARDS[id].essenceMonster||freeCopies(id)<1)return false;profile.inventory[id]--;profile.coins=Math.min(1e9,profile.coins+sellPrice(id));saveProfile();return true;}
function challengeCompleted(g){if(g.challenge==='singlefusion')return g.totalFusions[0]<=1;if(g.challenge==='regulars')return new Set(g.players[0].field.filter(c=>c&&!c.fusion).map(c=>c.id)).size>=3;if(g.challenge==='untrained')return g.players[0].flatBonus===0;return true;}
function rewardMatch16(g){
 if(storageConflict||g.winner===null||g.rewardClaimed||profile.rewardLedger.includes(g.id))return null;
 const trainingFirst=g.mode==='pve'&&g.opponentId===0&&g.context==='free'&&g.difficulty==='easy'&&g.winner===0&&!g.surrendered&&g.trainingStage===profile.trainingWins&&profile.trainingWins<3;
 const reward=rewardMatchCore(g);if(!reward||!trainingFirst)return reward;
 const stage=profile.trainingWins,bonus=TRAINING_STAGES[stage];profile.trainingWins++;
 profile.coins=Math.min(1e9,profile.coins+bonus.coins);profile.shards[0]=Math.min(1e9,profile.shards[0]+bonus.shards);reward.coins+=bonus.coins;reward.loot.shards+=bonus.shards;
 // rewardMatchCore's loot is the same object as the history item.
 reward.trainingAdvance=profile.trainingWins;
 if(stage===2){profile.showcase.pending=true;addCard(TRAINING_FUSION);reward.trainingCard=TRAINING_FUSION;if(profile.fusionDeck.length<15&&countCard(profile.fusionDeck,TRAINING_FUSION)<3)profile.fusionDeck.push(TRAINING_FUSION);logEvent(g,'Trainingsreihe abgeschlossen: Morgenflügel · Lv 5 erhalten.');}
 if(profile.history[0])profile.history[0].coins=reward.coins;
 saveProfile();return reward;
}

function highestCleared(p=profile){return Math.max(0,...p.cleared);}
function dropChargeCap(p=profile){return 5+[10,25,50].filter(l=>(p.milestones||[]).includes(l)).length;}
function rarityMultiplier(level=playerLevel(profile)){return (level>=2?1.05:1)*(level>=3?1.03:1)*(level>=4?1.015:1)*1.005**Math.max(0,level-4);}
function lootWeights(source,difficulty='easy',pack=false,encounter=false){const table=lootWeights16(source,difficulty,pack),isRare=id=>CARDS[id].fusionOnly||CARDS[id].manifestOf,total=table.filter(x=>isRare(x.id)).reduce((n,x)=>n+x.weight,0),target=Math.min(95,total*rarityMultiplier()*(encounter?1.25:1)*(pack?.42:1));return table.map(x=>({id:x.id,weight:x.weight*(isRare(x.id)?target/total:(100-target)/(100-total))}));}
function drawLoot(g,source,difficulty,pack=false){const table=lootWeights(source,difficulty,pack,g.context==='encounter');let roll=randomInt(g,1000000)/10000;for(const x of table){roll-=x.weight;if(roll<0)return x.id;}return table.at(-1).id;}
function boosterPools(tier){const pool=UPDATE_B_MAIN_IDS.filter(id=>!CARDS[id].ace&&!CARDS[id].workshopOnly&&(CARDS[id].requiredTier==null||CARDS[id].requiredTier<=tier)),starter=DEFAULT_DECK.filter(id=>pool.includes(id)),normal=pool.filter(id=>id>=20||CARDS[id].variantOf!=null);return {starter,normal:normal.length?normal:starter,rare:UPDATE_B_FUSION_IDS.filter(id=>!CARDS[id].trainingReward&&(CARDS[id].source<0||CARDS[id].source<=tier))};}
function boosterPrice(tier=highestCleared(),count=10){const rate={1:.16,3:.43,5:.66,10:1}[count];if(rate===undefined)return Infinity;return Math.ceil((120+OPPONENTS[tier].coins*3)*rate);}
function rollBooster(tier,g={seed:rng(0xffffffff)||1},count=10){if(![1,3,5,10].includes(count))throw Error('Ungültige Boostergröße.');const pools=boosterPools(tier),cards=[];for(let slot=0;slot<count;slot++){const roll=randomInt(g,100),cut=count===10?(slot<8?[85,98]:slot===8?[40,75]:[15,50]):count===5&&slot===4?[60,88]:[85,98],pool=roll<cut[0]?pools.starter:roll<cut[1]?pools.normal:pools.rare;cards.push(pool[randomInt(g,pool.length)]);}return cards;}
function buyBooster(count=10){if(![1,3,5,10].includes(count)||storageConflict||profile.rewardQueue.length||profile.coins<boosterPrice(highestCleared(),count))return false;const tier=highestCleared(),cards=rollBooster(tier,{seed:rng(0xffffffff)||1},count);profile.coins-=boosterPrice(tier,count);cards.forEach(addCard);profile.lastBooster={tier,cards};saveProfile();return true;}
function milestoneOffers(tier){const pool=[...MILESTONE_FORMS[tier]],g={seed:rng(0xffffffff)||1};for(let i=pool.length-1;i>0;i--){const j=randomInt(g,i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}return pool.slice(0,3);}
function grantMilestones(){const level=playerLevel(profile),tier=highestCleared();for(const l of XP_MILESTONES){if(l>level||profile.milestones.includes(l))continue;profile.milestones.push(l);const reward={level:l,tier,kind:[20,40].includes(l)?'choice':[15,30,45].includes(l)?'currency':'booster'};if(reward.kind==='choice')reward.cards=milestoneOffers(tier);else if(reward.kind==='currency'){reward.coins=OPPONENTS[tier].coins*3;reward.shards=10;profile.coins=Math.min(1e9,profile.coins+reward.coins);profile.shards[tier]+=10;}else{reward.cards=rollBooster(tier);reward.cards.forEach(addCard);}profile.rewardQueue.push(reward);}return profile.rewardQueue.length;}
function finishMilestone(choice){if(storageConflict)return false;const reward=profile.rewardQueue[0];if(!reward)return false;if(reward.kind==='choice'){if(!reward.cards.includes(choice))return false;addCard(choice);}profile.rewardQueue.shift();saveProfile();return true;}
function validateEncounter(e){if(!e||typeof e.id!=='string'||e.id.length>100||typeof e.name!=='string'||e.name.length>100||!validInt(e.tier,10)||!validInt(e.source,10)||!validInt(e.seed,4294967295)||!['tournament','random'].includes(e.kind)||!e.enemy||mainDeckError(e.enemy.deck)||fusionDeckError(e.enemy.fusionDeck)||!Number.isFinite(e.enemy.power)||e.enemy.power<.1||e.enemy.power>2)throw Error('Ungültige Begegnung.');return JSON.parse(JSON.stringify(e));}
function makeEncounter(tier,kind,g){tier=Math.max(0,Math.min(10,tier));const source=Math.min(tier,highestCleared()),pool=[...DEFAULT_DECK,...UPDATE_B_MAIN_IDS.filter(id=>!CARDS[id].ace&&(CARDS[id].requiredTier==null||CARDS[id].requiredTier<=tier))],deck=[];while(deck.length<40){const options=pool.filter(id=>countCard(deck,id)<3),id=options[randomInt(g,options.length)];deck.push(id);}const base=rpgEnemyLoadout(tier,'easy',2),candidates=UPDATE_B_FUSION_IDS.map(id=>CARDS[id]).filter(c=>!c.trainingReward&&(c.source===-1||c.source>=0&&c.source<=tier)),stock=[];for(const level of [...new Set(candidates.map(c=>c.level))].sort((a,b)=>a-b)){const pool=candidates.filter(c=>c.level===level);stock.push(pool[randomInt(g,pool.length)].id);}while(stock.length<15){const pool=candidates.filter(c=>countCard(stock,c.id)<3);if(!pool.length)break;stock.push(pool[randomInt(g,pool.length)].id);}return {id:'enc-'+Date.now().toString(36)+'-'+randomInt(g,1e9),name:['Wandernde','Verborgene','Fremde'][randomInt(g,3)]+' '+['Runenhüterin','Duellantin','Bestienmeisterin'][randomInt(g,3)],tier,source,seed:randomInt(g,4294967295)||1,kind,enemy:{deck,fusionDeck:stock,enhancements:{},power:base.power}};}
function rewardMatch(g){if(g.showcase)return showcaseReward(g);const reward=rewardMatch16(g);if(!reward||g.mode!=='pve'||g.surrendered)return reward;if(reward.trainingAdvance===3)profile.activeDuel=null;if(reward.first)reward.refilled=true;if(g.context==='encounter'&&g.winner===0){const extra=Math.floor(reward.coins*.25),xp=Math.floor(reward.xp*.25);profile.coins+=extra;profile.xp+=xp;reward.coins+=extra;reward.xp+=xp;profile.shards[g.opponentId]+=2;if(reward.loot)reward.loot.shards+=2;if(profile.history[0]){profile.history[0].coins=reward.coins;profile.history[0].xp=reward.xp;}}
if(g.context==='tournament'){profile.encounters=[-1,0,1].map(d=>makeEncounter(g.opponentId+d,'tournament',g));}else if(g.context==='free'&&!profile.wanderer&&randomInt(g,100)<5){profile.wanderer=makeEncounter(Math.min(10,highestCleared()+1),'random',g);}showcaseTrackDuel(g);grantMilestones();if(reward.refilled)profile.dropCharges=dropChargeCap();saveProfile();return reward;}
function validateProfile(raw){const modern=raw?.progressionVersion===3;const projected={...raw,progressionVersion:raw?.progressionVersion===3?2:raw?.progressionVersion,activeDuel:modern?raw.activeDuel:null};const p=validateProfile16(projected);p.progressionVersion=3;if(!modern){p.milestones=[];p.rewardQueue=[];p.encounters=[];p.wanderer=null;p.lastBooster=null;p.activeDuel=null;p.migrationMessage='Alpha 1.7: Sammlung und Fortschritt übernommen. Aufstiege: Startkarten +10, Hauptkarten +30, Fusionen +20 je Rang. Alte laufende Duelle wurden wegen der neuen LP- und Zerfallsregeln beendet. Bereits erreichte XP-Meilensteine werden jetzt vergeben.';return p;}
if(!Array.isArray(raw.milestones)||new Set(raw.milestones).size!==raw.milestones.length||raw.milestones.some(l=>!XP_MILESTONES.includes(l)||l>playerLevel(p)))throw Error('Ungültige XP-Meilensteine.');p.milestones=[...raw.milestones];if(p.dropCharges>dropChargeCap(p))throw Error('Zu viele Dropladungen.');
if(!Array.isArray(raw.rewardQueue)||raw.rewardQueue.length>10)throw Error('Ungültige Belohnungswarteschlange.');p.rewardQueue=raw.rewardQueue.map(x=>{if(!p.milestones.includes(x.level)||!validInt(x.tier,highestCleared(p))||!['choice','currency','booster'].includes(x.kind))throw Error('Ungültige Levelbelohnung.');const kind=[20,40].includes(x.level)?'choice':[15,30,45].includes(x.level)?'currency':'booster';if(x.kind!==kind)throw Error('Falsche Levelbelohnung.');if(kind==='currency'){if(x.coins!==OPPONENTS[x.tier].coins*3||x.shards!==10)throw Error('Ungültige Währung.');}else{const pool=kind==='choice'?MILESTONE_FORMS[x.tier]:Object.values(boosterPools(x.tier)).flat();if(!Array.isArray(x.cards)||x.cards.length!==(kind==='choice'?3:10)||x.cards.some(id=>!pool.includes(id))||kind==='choice'&&new Set(x.cards).size!==3)throw Error('Ungültige Belohnungskarten.');}return JSON.parse(JSON.stringify(x));});if(new Set(p.rewardQueue.map(x=>x.level)).size!==p.rewardQueue.length)throw Error('Doppelte Levelbelohnung.');
if(!Array.isArray(raw.encounters)||raw.encounters.length>3)throw Error('Ungültige Begegnungsliste.');p.encounters=raw.encounters.map(validateEncounter);p.wanderer=raw.wanderer?validateEncounter(raw.wanderer):null;p.lastBooster=null;if(raw.lastBooster){const b=raw.lastBooster,pool=validInt(b.tier,highestCleared(p))?Object.values(boosterPools(b.tier)).flat():[];if(!Array.isArray(b.cards)||![1,3,5,10].includes(b.cards.length)||b.cards.some(id=>!pool.includes(id)))throw Error('Ungültiger Boosterbeleg.');p.lastBooster={tier:b.tier,cards:[...b.cards]};}const validAceList=a=>Array.isArray(a)&&a.length<=10&&new Set(a).size===a.length&&a.every(x=>Number.isInteger(x)&&x>=1&&x<=10);p.acePurchased=validAceList(raw.acePurchased)?[...raw.acePurchased]:[];p.aceHints=validAceList(raw.aceHints)?[...raw.aceHints]:[];p.tournamentLosses=Array.isArray(raw.tournamentLosses)&&raw.tournamentLosses.length===11?raw.tournamentLosses.map(v=>validInt(v)?v:0):Array(11).fill(0);p.guideSeen=raw.guideSeen===true;
 const sc=raw.showcase||{};
 p.showcase={pending:sc.pending===true,seen:sc.seen===true,firstWin:sc.firstWin===true,
  streak:validInt(sc.streak,2)?sc.streak:0,offered:sc.offered===true};
 if(p.trainingWins<3){p.showcase.pending=false;p.showcase.offered=false;}
 // Existing players who have finished training can still meet the stranger once.
 if(p.trainingWins===3&&!p.showcase.seen&&!p.showcase.pending)p.showcase.pending=true;
 return p;}
// Existing level milestones are immediately fixed and granted on migration.
if(profile.progressionVersion===3){grantMilestones();saveProfile();}

function artShape(kind){
 const shapes={
 bird:`<path d="M116 104 Q63 43 12 65 Q35 70 52 92 L22 98 Q58 107 85 117 L76 148 Q94 139 115 118 Q142 139 163 148 L154 117 Q181 107 218 98 L185 92 Q205 70 228 65 Q174 42 123 104 Z" fill="url(#creature)"/><path d="M116 104 Q118 77 126 69 L140 84 L127 96 L145 100 L123 111 L116 129 L107 114 L96 101 Z" fill="#141824" stroke="url(#shine)" stroke-width="2"/><circle cx="129" cy="94" r="2.4" fill="#fff3c4"/><path d="M37 76 L83 108 M198 76 L150 108" stroke="#fff1c0" stroke-width="2" opacity=".5"/>`,
 knight:`<path d="M79 156 L73 91 L89 62 L106 49 L118 43 L132 49 L150 62 L166 92 L158 157 Z" fill="url(#creature)" stroke="url(#shine)" stroke-width="3"/><path d="M96 85 L112 76 L138 85 L134 107 L104 107 Z" fill="#141b29"/><path d="M107 95 L127 95" stroke="#e8f7ff" stroke-width="3"/><path d="M119 45 L119 75 M90 129 L146 129" stroke="#fae4ae" stroke-width="4"/><path d="M158 161 L175 45 L186 27 L193 48 L180 161 Z" fill="url(#shine)"/><path d="M177 79 L201 92 L154 92 Z" fill="#242935" stroke="#f9ddad" stroke-width="2"/>`,
 mage:`<path d="M68 162 Q75 92 88 68 L120 32 L151 69 Q165 109 177 162 Z" fill="url(#creature)" stroke="url(#shine)" stroke-width="2"/><path d="M91 78 L119 55 L146 78 L136 119 L103 119 Z" fill="#171a2a"/><path d="M104 91 L116 96 M123 96 L137 91" stroke="#faf3c9" stroke-width="3"/><path d="M163 160 L186 54" stroke="#e5b96e" stroke-width="6"/><path d="M183 55 L168 33 L186 8 L203 32 Z" fill="url(#shine)"/><path d="M75 155 Q114 140 160 155" fill="none" stroke="#fbe1b1" stroke-width="3"/>`,
 dragon:`<path d="M112 93 Q67 32 15 26 L49 77 L27 87 L85 125 L106 117 Q144 127 171 103 L216 92 L182 83 L218 36 Q159 41 132 86 Z" fill="url(#creature)" stroke="url(#shine)" stroke-width="2.5"/><path d="M101 95 L104 61 L121 39 L145 61 L163 76 L155 100 L124 118 Z" fill="#17202c" stroke="url(#shine)" stroke-width="3"/><path d="M111 53 L102 19 L122 42 L141 16 L142 54" fill="url(#creature)" stroke="url(#shine)" stroke-width="2"/><circle cx="137" cy="84" r="3.5" fill="#fff6bb"/><path d="M122 116 Q179 137 197 159" fill="none" stroke="url(#shine)" stroke-width="10"/>`,
 wolf:`<path d="M50 159 L64 95 L56 42 L95 63 L120 43 L144 63 L183 41 L176 96 L195 160 Z" fill="url(#creature)" stroke="url(#shine)" stroke-width="3"/><path d="M87 97 L115 106 L145 96 L155 131 L119 148 L83 130 Z" fill="#19202d"/><path d="M84 86 L106 95 M128 95 L151 86" stroke="#fff0bd" stroke-width="4"/><path d="M108 126 L118 135 L129 126" fill="none" stroke="url(#shine)" stroke-width="5"/>`,
 golem:`<path d="M72 48 L107 31 L135 37 L168 65 L167 117 L187 144 L151 163 L86 162 L57 142 L68 112 Z" fill="url(#creature)" stroke="url(#shine)" stroke-width="5"/><path d="M88 64 L148 69 L140 120 L96 119 Z" fill="#232a35" stroke="#e4d49d" stroke-width="3"/><path d="M99 90 L114 93 M127 93 L139 88" stroke="#fff1c0" stroke-width="5"/><path d="M119 111 L119 150 M96 131 L139 132" stroke="url(#shine)" stroke-width="3"/><path d="M60 88 L27 103 L38 138 L64 127 M171 93 L213 109 L201 142 L171 130" fill="url(#creature)" stroke="url(#shine)" stroke-width="3"/>`,
 insect:`<path d="M118 88 Q78 4 26 62 Q14 116 106 117 Q56 155 91 166 L117 124 L126 124 L152 166 Q185 155 134 117 Q225 115 211 62 Q159 4 125 88" fill="url(#creature)" stroke="url(#shine)" stroke-width="3"/><ellipse cx="121" cy="116" rx="16" ry="42" fill="#1e2232" stroke="url(#shine)" stroke-width="3"/><path d="M117 77 Q103 35 83 27 M128 77 Q144 35 164 27" fill="none" stroke="url(#shine)" stroke-width="4"/><path d="M55 79 L100 104 M185 79 L142 104" stroke="#fff9c2" stroke-width="3" opacity=".6"/>`,
 serpent:`<path d="M75 169 Q26 124 83 96 Q136 71 110 34 Q96 4 130 14 Q180 30 151 78 Q123 110 95 120 Q72 143 117 146 Q165 137 186 112" fill="none" stroke="url(#creature)" stroke-width="35" stroke-linecap="round"/><path d="M75 169 Q26 124 83 96 Q136 71 110 34 Q96 4 130 14 Q180 30 151 78 Q123 110 95 120 Q72 143 117 146 Q165 137 186 112" fill="none" stroke="url(#shine)" stroke-width="3" stroke-linecap="round"/><path d="M168 108 L209 96 L196 117 L216 124 L187 137 L168 126 Z" fill="#18202e" stroke="url(#shine)" stroke-width="3"/><circle cx="190" cy="113" r="3" fill="#fff5c2"/>`,
 stag:`<path d="M88 166 L97 90 L119 73 L139 90 L148 166 Z" fill="url(#creature)" stroke="url(#shine)" stroke-width="3"/><path d="M96 100 L102 39 L78 19 M101 55 L61 47 M98 77 L73 65 M141 100 L136 39 L160 19 M137 55 L177 47 M140 77 L165 65" stroke="url(#shine)" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M101 104 L116 111 L137 103 L131 134 L116 147 L104 132 Z" fill="#22212b"/><path d="M107 114 L114 116 M124 116 L133 114" stroke="#ffe5a6" stroke-width="3"/>`,
 goblin:`<path d="M70 157 L75 94 L40 86 L67 69 L63 40 L102 53 L119 43 L138 54 L175 40 L173 70 L200 87 L164 95 L166 157 Z" fill="url(#creature)" stroke="url(#shine)" stroke-width="3"/><path d="M92 91 L105 103 L91 106 M142 91 L129 103 L143 106" fill="none" stroke="#fff2b0" stroke-width="4"/><path d="M110 120 L118 133 L129 120" fill="none" stroke="#ead2a0" stroke-width="4"/><path d="M88 150 L154 150" stroke="#fae4ac" stroke-width="3"/>`,
 ray:`<path d="M120 49 Q78 82 13 95 Q67 119 82 154 L120 137 L155 154 Q169 119 227 95 Q167 81 120 49 Z" fill="url(#creature)" stroke="url(#shine)" stroke-width="3"/><path d="M120 137 Q136 171 119 182" stroke="url(#shine)" stroke-width="5" fill="none"/><path d="M108 91 L116 98 M125 98 L133 91" stroke="#fff3c9" stroke-width="4"/><path d="M46 102 Q82 91 101 111 M189 102 Q157 91 137 111" fill="none" stroke="#fff6bd" stroke-width="2" opacity=".75"/>`,
 spirit:`<path d="M119 18 Q170 32 163 91 Q163 112 190 143 L168 131 L155 169 L138 145 L117 178 L93 150 L69 169 L75 126 L52 135 Q75 105 78 86 Q68 32 119 18 Z" fill="url(#creature)" stroke="url(#shine)" stroke-width="3"/><path d="M93 81 Q107 67 117 84 Q131 65 146 81 Q132 96 121 98 Q107 98 93 81" fill="#fff6d0"/><path d="M115 110 Q123 126 131 109" fill="none" stroke="#fff6d0" stroke-width="4"/>`
 };return shapes[kind]||shapes.spirit;
}
function makeArt(c){const seed=c.id,variant=seed%7;
 const rune=[
 '<path d="M116 16 L124 16 L128 39 L120 48 L112 39Z M107 42 L120 29 L133 42" fill="none" stroke="#fbeab9" stroke-width="2" opacity=".9"/>',
 '<path d="M59 97 L31 75 L56 79 L47 55 L78 87 M178 93 L211 64 L190 93 L220 96 L176 110" fill="none" stroke="#e5eaff" stroke-width="3" opacity=".8"/>',
 '<path d="M87 32 L103 6 L112 33 L121 17 L136 36 L145 10 L155 34" fill="none" stroke="#fff2ce" stroke-width="4" opacity=".9"/>',
 '<ellipse cx="121" cy="105" rx="71" ry="34" fill="none" stroke="#fff7c5" stroke-width="2" stroke-dasharray="11 6" opacity=".7"/>',
 '<path d="M48 57 L74 35 L77 76 L55 83Z M180 49 L207 64 L192 88 L168 78Z" fill="url(#shine)" opacity=".6"/>',
 '<path d="M119 16 L141 53 L124 51 L119 74 L106 48 L98 51Z" fill="url(#shine)" opacity=".72"/>',
 '<path d="M63 131 L44 158 L94 150 M182 124 L207 153 L159 146" fill="none" stroke="#fff0ca" stroke-width="5" opacity=".8"/>'
 ][variant];
 let accents='';for(let i=0;i<14;i++){const x=(seed*37+i*71)%240,y=(seed*79+i*47)%184,r=(i%3)+.7;accents+=`<circle cx="${x}" cy="${y}" r="${r}" fill="#f7ecb7" opacity="${(.12+(i%5)*.08).toFixed(2)}"/>`;}
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 184"><defs><radialGradient id="bg"><stop stop-color="${c.color}" stop-opacity=".63"/><stop offset=".57" stop-color="#1b3047"/><stop offset="1" stop-color="#0a101e"/></radialGradient><linearGradient id="creature" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c.color}"/><stop offset=".48" stop-color="#314254"/><stop offset="1" stop-color="#090e1c"/></linearGradient><linearGradient id="shine"><stop stop-color="#fff1b6"/><stop offset=".58" stop-color="${c.color}"/><stop offset="1" stop-color="#af805b"/></linearGradient><radialGradient id="orb"><stop stop-color="#ffedb8" stop-opacity=".55"/><stop offset="1" stop-color="${c.color}" stop-opacity="0"/></radialGradient></defs><rect width="240" height="184" fill="url(#bg)"/><circle cx="120" cy="87" r="92" fill="none" stroke="${c.color}" stroke-width="1" opacity=".35"/><circle cx="120" cy="87" r="70" fill="url(#orb)"/><path d="M-10 144 L47 99 L85 136 L137 78 L203 142 L250 99" fill="none" stroke="${c.color}" stroke-width="11" opacity=".15"/><path d="M0 162 Q70 136 131 164 T240 145 L240 184 L0 184Z" fill="#060d18" opacity=".85"/>${accents}<g transform="translate(${120+(seed%5-2)*6} ${96+(seed%7-3)*3}) scale(${(seed%2?-1:1)*(.68+c.level*.035+(seed%3)*.03)} ${.7+c.level*.035+(seed%4)*.023}) translate(-120 -96)">${artShape(c.kind)}${rune}</g><circle cx="120" cy="92" r="${48+c.level*3}" fill="none" stroke="${c.color}" stroke-dasharray="${c.level*3} 9" opacity=".45"/><path d="M90 171 L120 154 L150 171 L120 180 Z" fill="${c.color}" opacity=".55"/><path d="M5 11 L30 11 M5 11 L5 36 M235 11 L210 11 M235 11 L235 36 M5 173 L30 173 M5 173 L5 148 M235 173 L210 173 M235 173 L235 148" stroke="#ebce90" stroke-width="1.4" opacity=".64"/><rect x="1" y="1" width="238" height="182" rx="2" fill="none" stroke="#b99766" stroke-width="2"/></svg>`;
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
/* Artwork-Welle 3: reine Präsentation. Die Karten-IDs und Kampfwerte bleiben stabil. */
const CUSTOM_CARD_ART_WAVE_3=[
 {id:244,name:"Aschenruinen-Drache",customArt:"assets/custom-art/wave3-01.webp",desc:"Sein Feuer verwandelt uralte Festungen in eine einzige glühende Ruine."},
 {id:34,name:"Eisgolem der Nacht",customArt:"assets/custom-art/wave3-02.webp",desc:"Eis und uralte Rüstung verschmelzen zu einem Wächter, den kein Winter bezwingen kann."},
 {id:68,name:"Phantomreiter des Mondsturms",customArt:"assets/custom-art/wave3-03.webp",desc:"Ein ruheloser Reiter, der zwischen den Welten auf seinem Schattenross jagt."},
 {id:42,name:"Himmelsgreif der Stürme",customArt:"assets/custom-art/wave3-04.webp",desc:"Seine gewaltigen Schwingen spalten Sturmwolken und kündigen den Wandel an."},
 {id:21,name:"Runenmagier der Ruinen",customArt:"assets/custom-art/wave3-05.webp",desc:"In den Trümmern einer verlorenen Stadt bewahrt er verbotene Zeichen."},
 {id:65,name:"Chaoskonstrukt",customArt:"assets/custom-art/wave3-06.webp",desc:"Ein künstlicher Wächter, dessen Kern von ungebändigter Arkanenergie pulsiert."},
 {id:61,name:"Nachtwyrm der Abgründe",customArt:"assets/custom-art/wave3-07.webp",desc:"Tief unter den Wellen wartet er, bis der Mond das Meer in Bewegung setzt."},
 {id:66,name:"Dämonenfürst der Blutfelsen",customArt:"assets/custom-art/wave3-08.webp",desc:"Unter einem roten Himmel erhebt sich der Herr der glutheißen Klippen."},
 {id:27,name:"Celestia, Lichtwächterin",customArt:"assets/custom-art/wave3-09.webp",desc:"Ein geflügelter Lichtgeist, der mit stiller Entschlossenheit die Ruinen bewacht."},
 {id:256,name:"Obsidian-Drache",customArt:"assets/custom-art/wave3-10.webp",desc:"Seine schwarzen Schuppen verschlingen das Licht und reflektieren uralte Schattenrunen."},
 ];
for(const art of CUSTOM_CARD_ART_WAVE_3){
 const c=CARDS[art.id];
 if(!c)throw new Error('Artwork-Karte fehlt: '+art.id);
 Object.assign(c,art);
 // Eine normale Gestalt desselben Monsters erhält exakt dasselbe Motiv.
 for(const form of CARDS.filter(x=>x.manifestOf===art.id)){
  form.customArt=art.customArt;
  form.name=art.name+' · Gestalt';
 }
}
/* Artwork-Welle 4: Übergang zu imposanteren Fusionen, ohne Änderungen an IDs, Elementen oder Kampfwerten. */
const CUSTOM_CARD_ART_WAVE_4=[
 {id:280,name:'Sonnenklinge-Wyvern',customArt:'assets/custom-art/wave4-01.webp',desc:'Seine goldenen Schwingen schneiden durch das Licht der sinkenden Sonne.'},
 {id:90,name:'Donnerkoloss der Gebirgsspalten',customArt:'assets/custom-art/wave4-02.webp',desc:'Wo seine Schritte hallen, bersten die Berge und erwachen uralte Steine.'},
 {id:103,name:'Tiefenlord Leviathan',customArt:'assets/custom-art/wave4-03.webp',desc:'Ein uralter Meeresjäger, dessen Ruf selbst versunkene Städte erzittern lässt.'},
 {id:246,name:'Flammenphönix der Aschewelt',customArt:'assets/custom-art/wave4-04.webp',desc:'Er erhebt sich aus der Glut vergessener Reiche und trägt den Funken ihrer Wiedergeburt.'},
 {id:260,name:'Schattenlord der Zwischenwelt',customArt:'assets/custom-art/wave4-05.webp',desc:'Ein schwarzer Seelenherr, der zwischen Erinnerung und Vergessen wandert.'},
 {id:278,name:'Himmelsrichterin Seraphiel',customArt:'assets/custom-art/wave4-06.webp',desc:'Ihre Lanze erstrahlt, wenn die letzte Entscheidung über Licht und Schatten fällt.'},
 {id:101,name:'Blutdorn-Behemoth',customArt:'assets/custom-art/wave4-07.webp',desc:'Seine Dornen nähren sich vom Kampf und wachsen mit jedem überwundenen Feind.'},
 {id:286,name:'Kristalldrache der Sternenbrüche',customArt:'assets/custom-art/wave4-08.webp',desc:'Seine Schuppen spiegeln das zerbrochene Licht ferner Sterne.'},
 {id:274,name:'Sturmtitan der Verlorenen Inseln',customArt:'assets/custom-art/wave4-09.webp',desc:'Er steigt aus dem tosenden Himmel auf und zieht vergessene Inseln in seinen Bann.'},
 {id:262,name:'Nekrofusion-Drachentyrann',customArt:'assets/custom-art/wave4-10.webp',desc:'Aus Drachenknochen und ruhelosen Seelen geformt, bewacht er das Tor zur Zwischenwelt.'}
];
for(const art of CUSTOM_CARD_ART_WAVE_4){
 const c=CARDS[art.id];
 if(!c||c.customArt)throw new Error('Artwork-Welle 4: Karte fehlt oder ist bereits belegt: '+art.id);
 Object.assign(c,art);
 for(const form of CARDS.filter(x=>x.manifestOf===art.id)){
  form.customArt=art.customArt;
  form.name=art.name+' · Gestalt';
 }
}

/* Artwork-Welle 5: zehn individuelle Originalillustrationen für fortgeschrittene Stufen. */
const CUSTOM_CARD_ART_WAVE_5=[
 {id:85,name:"Chronowyrm der Zeitspalten",customArt:"assets/custom-art/wave5-01.webp",desc:"Seine Schuppen bergen die Erinnerung an ungezählte Zukünfte."},
 {id:123,name:"Umbrakaiser der Leerenrosse",customArt:"assets/custom-art/wave5-02.webp",desc:"Ein finsterer Reiter, der verlorene Seelen durch die Zwischenwelt führt."},
 {id:105,name:"Abysskrake der Tiefseegräben",customArt:"assets/custom-art/wave5-03.webp",desc:"Er erhebt sich aus den tiefsten Gräben und verschlingt das Licht."},
 {id:102,name:"Weltenbaum-Ent der Urwälder",customArt:"assets/custom-art/wave5-04.webp",desc:"Seine Wurzeln halten die uralten Wälder zusammen."},
 {id:73,name:"Eisphönix der Polarnacht",customArt:"assets/custom-art/wave5-05.webp",desc:"Ein geflügeltes Wesen aus kristallklarer Wintermagie."},
 {id:82,name:"Dämonenfürstin Lilith",customArt:"assets/custom-art/wave5-06.webp",desc:"Ihre Stimme lockt Erinnerungen in die Schatten."},
 {id:109,name:"Stahlgolem der Himmelsfestungen",customArt:"assets/custom-art/wave5-07.webp",desc:"Ein gewaltiger Wächter über den schwebenden Festungen."},
 {id:292,name:"Schattenhydra der Seelenkluft",customArt:"assets/custom-art/wave5-08.webp",desc:"Ihre Häupter winden sich aus dem Riss zwischen den Welten."},
 {id:119,name:"Sternenwächter Aurelion",customArt:"assets/custom-art/wave5-09.webp",desc:"Er bewacht die Sternenpfade mit unerschütterlichem Licht."},
 {id:298,name:"Chaosdrache der Weltenzerstörung",customArt:"assets/custom-art/wave5-10.webp",desc:"Aus den Trümmern verlorener Reiche wächst sein unheilvoller Schatten."},
];
for(const art of CUSTOM_CARD_ART_WAVE_5){
 const c=CARDS[art.id];
 if(!c||c.customArt)throw new Error("Artwork-Welle 5: Karte fehlt oder belegt: "+art.id);
 Object.assign(c,art);
 for(const form of CARDS.filter(x=>x.manifestOf===art.id)){form.customArt=art.customArt;form.name=art.name+" · Gestalt";}
}
/* Artwork-Welle 6: Originalillustrationen aus dem zuletzt freigegebenen Pack.
   Nur Darstellung; bestehende Karten-IDs, Level und Kampfwerte bleiben unverändert. */
const CUSTOM_CARD_ART_WAVE_6=[{"id":86,"name":"Goldener Himmelswyvern","customArt":"assets/custom-art/wave6-01.webp","desc":"Ein goldener Wächter der hohen Ruinen, dessen Schwingen das Sonnenlicht tragen."},{"id":89,"name":"Donnergolem des Sturmgebirges","customArt":"assets/custom-art/wave6-02.webp","desc":"Aus Felsen und Blitz geformt erwacht er im Auge des Gewitters."},{"id":317,"name":"Mondsturm-Leviathan","customArt":"assets/custom-art/wave6-03.webp","desc":"Aus tobenden Wassern erhebt sich ein uraltes Meereswesen."},{"id":210,"name":"Majestätischer Aschenphönix","customArt":"assets/custom-art/wave6-04.webp","desc":"Inmitten eines Feuersturms erneuert er sein glühendes Gefieder."},{"id":33,"name":"Overlord des Zerbrochenen Portals","customArt":"assets/custom-art/wave6-05.webp","desc":"Ein Herr der Zwischenwelt, der aus einem zerrissenen Portal tritt."},{"id":121,"name":"Seraphische Richterin","customArt":"assets/custom-art/wave6-06.webp","desc":"Die Hüterin erhebt ihre Sternenklinge über den donnernden Himmel."},{"id":69,"name":"Blutmond-Kristallbehemoth","customArt":"assets/custom-art/wave6-07.webp","desc":"Ein gewaltiges Schattenwesen mit blutroten Kristallstacheln."},{"id":304,"name":"Kosmischer Kristalldrache","customArt":"assets/custom-art/wave6-08.webp","desc":"Seine Schuppen tragen Splitter unbekannter Sternbilder."},{"id":106,"name":"Sturmtitan aus Stein und Meer","customArt":"assets/custom-art/wave6-09.webp","desc":"Ein uraltes Wesen aus Gestein und Wassermassen, geladen mit Blitzen."},{"id":81,"name":"Nekrodrache des Purpurmonds","customArt":"assets/custom-art/wave6-10.webp","desc":"Ein gespenstischer Drache, der an der Schwelle zur Schattenwelt kreist."}];
for(const art of CUSTOM_CARD_ART_WAVE_6){
 const c=CARDS[art.id];
 if(!c||c.customArt)throw new Error('Artwork-Welle 6: Karte fehlt oder schon belegt: '+art.id);
 Object.assign(c,art);
 for(const form of CARDS.filter(x=>x.manifestOf===art.id)){form.customArt=art.customArt;form.name=art.name+' · Gestalt';}
}
CARDS.forEach(c=>{c.art=c.variantOf==null?(window.ArcaneArt?.makeArt(c)||makeArt(c)):CARDS[c.variantOf].art;});
for(const id of NORMAL_LINE_VARIANT_IDS){const stage=CARDS[id],root=CARDS[stage.variantOf];stage.name=root.name;stage.desc=root.desc+' · Entwicklungsstufe: '+stage.level+'.';}
// Each normal monster stage uses exactly the same image URL/data and final name as its base form.

function sound(type){if(!soundOn)return;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const context=sound.context||(sound.context=new A());if(context.state==='suspended')context.resume();const o=context.createOscillator(),gain=context.createGain();o.type=type==='attack'?'sawtooth':'sine';let t=context.currentTime;o.frequency.setValueAtTime(type==='attack'?390:type==='win'?600:500,t);o.frequency.exponentialRampToValueAtTime(type==='attack'?110:type==='win'?1200:190,t+.23);gain.gain.setValueAtTime(.09,t);gain.gain.exponentialRampToValueAtTime(.001,t+.28);o.connect(gain).connect(context.destination);o.start(t);o.stop(t+.29);}catch(e){}}
function showToast(msg){$('toast').textContent=msg;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2600);}
function center(el){if(!el)return {x:window.innerWidth/2,y:window.innerHeight/2};const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};}
function bolt(a,b){const dx=b.x-a.x,dy=b.y-a.y;const beam=document.createElement('div');beam.className='battle-bolt';beam.style.left=a.x+'px';beam.style.top=a.y+'px';beam.style.width=Math.hypot(dx,dy)+'px';beam.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;document.body.append(beam);setTimeout(()=>beam.remove(),580);}
function damageFloat(p,text){const el=document.createElement('div');el.className='damage-float';el.textContent=text;el.style.left=(p.x-26)+'px';el.style.top=(p.y-24)+'px';document.body.append(el);setTimeout(()=>el.remove(),980);}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

let game=null,busy=false,aiRunning=false,uiMode='menu',menuTab=profile.trainingWins<3?'free':'tournament',deckDraft=[...profile.activeDeck],fusionDraft=[...profile.fusionDeck],soundOn=profile.settings.sound,animationSpeed=profile.settings.animation,toastTimer=null,training=null,trainingTimer=null,materialMode=false;
const roman=['Ⅰ','Ⅱ'];
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('de-AT');
const self=()=>game.players[game.active],enemy=()=>game.players[1-game.active];
function animationWait(ms){return new Promise(resolve=>setTimeout(resolve,animationSpeed==='instant'?0:ms));}
function toast(msg){showToast(msg);}
function hideModal(){if(profile.showcase?.pending&&!game){showShowcaseIntro();return;}if(profile.rewardQueue?.length){showMilestone();return;}if(profile.openPack&&!profile.openPack.taken.length){showPack();return;}$('overlay').classList.add('hidden');}
function modalHtml(kicker,title,icon,text,extra,buttons){return `<div class="modal-icon">${icon}</div><div class="modal-kicker">${kicker}</div><h2>${title}</h2><p>${text}</p>${extra||''}<div class="modal-actions">${buttons}</div>`;}
function openModal(html){$('modal').classList.remove('pool-modal','arcane-rule-modal');$('modal').innerHTML=html;$('overlay').classList.remove('hidden');}




function profileCard(c){const factor=enhancementFactor(profile.enhancements[c.id]||0),flat=monsterTrainingBonus(profile.upgrades.power)+(c.id<20?35*(profile.upgrades.starter||0):0);return {id:c.id,card:{atk:round10(c.atk+ascensionStep(c.id)*(profile.enhancements[c.id]||0)+flat+normalRoleBonus(c,'atk',0)),def:round10(c.def+ascensionStep(c.id)*(profile.enhancements[c.id]||0)+flat+normalRoleBonus(c,'def',0)),level:c.level}};}





function trainingDelay(){return Math.max(3000,6000-profile.upgrades.tempo*750);}
function stopTraining(refresh=true){clearTimeout(trainingTimer);trainingTimer=null;training=null;if(refresh&&uiMode==='menu')renderMenu();}
function toggleTraining(id,difficulty='easy'){if(training?.opponent===id){stopTraining();return;}if(storageConflict||!autoUnlocked(id,difficulty)||!profile.auto.energy)return;stopTraining(false);training={opponent:id,difficulty,matches:0,wins:0,coins:0,xp:0};renderMenu();trainingTimer=setTimeout(runTraining,trainingDelay());}
function runTraining(){const job=training;if(!job||uiMode!=='menu')return;if(profile.rewardQueue.length){stopTraining(false);showMilestone();return;}if(storageConflict||job.matches>=10){stopTraining();return;}const result=resolveAuto(job.opponent,job.difficulty);if(!result){stopTraining();return;}job.matches++;job.wins+=result.win?1:0;job.coins+=result.coins;job.xp+=result.xp;if(job.matches>=10||!profile.auto.energy){const text=`Serie beendet: ${job.matches} Kämpfe · ${job.wins} Siege · +${job.coins} Essenz`;stopTraining(false);renderMenu();toast(text);return;}renderMenu();trainingTimer=setTimeout(runTraining,trainingDelay());}
function resolveAuto(id,difficulty='easy'){if(profile.rewardQueue.length)return null;if(storageConflict||!autoUnlocked(id,difficulty)||!consumeEnergy())return null;try{const g=createGame({mode:'pve',opponentId:id,context:'auto',difficulty,boosted:profile.useDropCharges&&profile.dropCharges>0,id:newMatchId(),deck:profile.activeDeck,fusionDeck:profile.fusionDeck,enhancements:profile.enhancements,flatBonus:monsterTrainingBonus(profile.upgrades.power)});simulateGame(g,profile.strategy,OPPONENTS[id].policy);const reward=rewardMatch(g);return {win:g.winner===0,...reward,turns:g.turn};}catch(e){profile.auto.energy=Math.min(AUTO_CAP,profile.auto.energy+1);saveProfile();toast('Autokampf unterbrochen. Die Ladung wurde zurückgegeben.');return null;}}
function quickFight(id,difficulty='easy'){if(uiMode!=='menu'||training||!autoUnlocked(id,difficulty)||!profile.auto.energy)return;training={opponent:id,difficulty,matches:0,wins:0,coins:0,xp:0,single:true};renderMenu();toast('Autokampf läuft …');trainingTimer=setTimeout(()=>{if(!training)return;const r=resolveAuto(id,difficulty);stopTraining(false);renderMenu();if(r)openModal(modalHtml('AUTOKAMPF · ERGEBNIS',r.win?'Sieg!':'Niederlage','⚔','Dein automatischer Kampf wurde abgeschlossen.',`<div class="info-pills"><span>+${fmt(r.coins||0)} Essenz</span><span>+${fmt(r.xp||0)} XP</span><span>${r.turns||0} Züge</span></div><p class="loot-banner">${lootText(r.loot)}</p>`, '<button class="btn primary" id="autoResultClose">Schließen</button>'));if(r)$('autoResultClose').onclick=hideModal;},trainingDelay());}
function startDuel(mode,id=0,context='free',difficulty='easy',challenge=null){if(mode==='pve'&&((difficulty==='hard'&&!hardUnlocked(id))||(challenge&&!challengeEligible(challenge))))return;if(busy||aiRunning||storageConflict)return;if(profile.rewardQueue.length){showMilestone();return;}if(profile.activeDuel){openModal(modalHtml('GESPEICHERTES DUELL','Partie fortsetzen?','↶','Du hast eine gespeicherte Einzelspielerpartie. Du kannst sie fortsetzen oder für die neue Partie verwerfen.','','<button class="btn primary" id="resumeSaved">FORTSETZEN</button><button class="btn" id="discardSaved">VERWERFEN & NEU STARTEN</button>'));$('resumeSaved').onclick=resumeDuel;$('discardSaved').onclick=()=>{profile.activeDuel=null;saveProfile();hideModal();startDuel(mode,id,context,difficulty,challenge);};return;}if(mode==='pve'&&(context==='tournament'?!tournamentUnlocked(id):!opponentUnlocked(id)))return;stopTraining(false);materialMode=false;game=createGame({id:newMatchId(),mode,opponentId:id,context,difficulty,challenge,deck:mode==='pve'?profile.activeDeck:DEFAULT_DECK,fusionDeck:profile.fusionDeck,enhancements:profile.enhancements,flatBonus:monsterTrainingBonus(profile.upgrades.power)});uiMode='duel';$('menuScreen').hidden=true;$('menuNav').hidden=true;$('duelScreen').hidden=false;for(const id of ['deckBtn','restartBtn','homeBtn'])$(id).hidden=false;render();openModal(modalHtml(mode==='pvp'?'LOKALES PVP':context==='tournament'?'TURNIER':'FREIMODUS',mode==='pve'?(id===0?trainingName(game.trainingStage):OPPONENTS[id].name):'Klassisches Duell','⚔',mode==='pve'?'Duellant 1 bist du. Deine ausgerüsteten Karten und Verstärkungen gelten für diese Partie.':'Neutraler Kartenpool ohne RPG-Boni.',`<div class="info-pills"><span>${game.maxLP.toLocaleString('de-AT')} LP</span><span>Start: Duellant ${game.starter+1}</span><span>Tiebreak: Duellant ${game.tiePriority+1}</span><span>Strikt abwechselnde Züge</span>${game.firstTrialBoost?'<span>Erstprüfungs-Bonus: +'+Math.round(game.firstTrialBoost*100)+' % Gegnerstärke</span>':''}</div>`,'<button class="btn primary" id="modalGo">DUELL STARTEN</button>'));$('modalGo').onclick=()=>{hideModal();if(game.mode==='pve'&&game.active===1)runAi();};}
function showFinished16(){if(!game||game.winner===null||game.finishShown)return;game.finishShown=true;const reward=rewardMatch(game);render();const won=game.mode==='pve'&&game.winner===0;openModal(modalHtml('DUELL BEENDET',game.mode==='pve'?(won?'Sieg!':'Niederlage'):`Duellant ${game.winner+1} gewinnt!`,won?'✦':'⚔',escapeHtml(game.winReason),`<div class="info-pills"><span>${game.turn} Spielerzüge</span>${game.mode==='pve'?`<span>+${reward?.coins||0} Essenz</span><span>+${reward?.xp||0} XP</span>${reward?.trainingShard?'<span>+1 Trainingssplitter</span>':''}<span>${reward?.surrendered?'Aufgegeben · keine Belohnung':reward?.refilled?'Dropladungen vollständig aufgefüllt ('+dropChargeCap()+')':reward?.charge?'+1 Dropladung':'Dropladungsvorrat voll ('+dropChargeCap()+')'}</span>`:''}</div>${reward?.loot?`<p class="loot-banner">${lootText(reward.loot)}</p>${reward.loot.card!==null&&reward.loot.card!==undefined?`<div class="arcane-reward-showcase"><strong>✦ NEUE BEUTE · DIESE KARTE HAST DU ERHALTEN</strong>${fullCardHtml({id:reward.loot.card})}</div>`:''}`:''}${reward?.trainingAdvance?`<p class="loot-banner">${reward.trainingAdvance<3?'Nächste Trainingsprüfung: '+trainingName(reward.trainingAdvance):'Trainingsreihe abgeschlossen! Morgenflügel · Lv 5 erhalten. '+(profile.fusionDeck.includes(TRAINING_FUSION)?'Bereits ins aktive Fusionsdeck gelegt.':'Im Fusionsdeck ausrüsten.')}<br>Die erhöhten Startbelohnungen gibt es nur einmal.</p>`:''}${reward?.first?`<div class="arcane-reward-showcase"><strong>✦ TURNIER-FREISCHALTUNG · JETZT IM SHOP KAUFBAR</strong>${fullCardHtml({id:OPPONENTS[game.opponentId].aceCard})}<small>Vorschau – nicht erhalten. Die ACE-Karte kostet Essenz und kann unter Fortschritt → Booster-Shop gekauft werden.</small></div><p>${OPPONENTS[game.opponentId].name} ist jetzt im Freimodus verfügbar.${game.opponentId===10?' Alle zehn Prüfungen sind bestanden!':' Die nächste Prüfung ist freigeschaltet.'}</p><p class="loot-banner">✦ ACE FREIGESCHALTET: Das Ace-Monster dieses Gegners ist ab sofort einmalig im Shop für Essenz kaufbar. Es wird nicht kostenlos vergeben. Erst nach dem Kauf kann es mit nur 0,35 % Chance pro Boosterkarte erneut erscheinen.</p>`:''}${game.mode==='pve'&&!won?'<p>Du kannst im Hauptmenü unter <b>Spielstand & Extras → Chronik</b> taktische Hinweise zum letzten Duell kaufen. Bei Aufgabe werden keine Belohnungen vergeben.</p>':''}`,'<button class="btn primary" id="modalAgain">NOCHMALS SPIELEN</button><button class="btn" id="modalMenu">ZUM MENÜ & DECKBAU</button>'));$('modalAgain').onclick=()=>{const {mode,opponentId,context,difficulty,challenge}=game;hideModal();game=null;startDuel(mode,opponentId,context,difficulty,challenge);};$('modalMenu').onclick=returnToMenu;
 if(game.mode==='pve'&&!won){
  const hint=document.createElement('button');hint.type='button';hint.className='btn';
  hint.id='postDuelHints';hint.textContent='✦ Hinweise & Chronik ansehen';
  hint.onclick=()=>{returnToMenu();window.ArcaneRoyalUI?.navigate?.('stats');};
  $('modal')?.querySelector('.modal-actions')?.append(hint);
 }
}
function returnToMenu(){if(busy||aiRunning)return;if(game?.showcase&&game.winner===null){toast('Dieses Geheimduell wird zuerst abgeschlossen.');return;}saveDuelSnapshot();hideModal();game=null;uiMode='menu';deckDraft=[...profile.activeDeck];fusionDraft=[...profile.fusionDeck];renderMenu();}
function askMenu(){if(!game||game.winner!==null){returnToMenu();return;}if(busy||aiRunning)return;openModal(modalHtml('PARTIE VERLASSEN','Zurück zum Menü?','↶','Dein Einzelspielerduell wird pausiert und gespeichert. Du kannst es später im Menü fortsetzen. Lokales PvP wird beim Verlassen beendet.','','<button class="btn ghost" id="cancelLeave">WEITERSPIELEN</button><button class="btn primary" id="confirmLeave">ZUM MENÜ</button>'));$('cancelLeave').onclick=hideModal;$('confirmLeave').onclick=returnToMenu;}

/* Farbcode für Kartenränder: Startkarten > Fusionen > Level.
   Rein visuell; Karten-ID, Stats, Kartenbild und Spielstand bleiben unverändert. */
function frameClassForCard(c){
 const t=dataOf(c);if(isFateCard(c))return 'tc-fate fate-identity-'+Math.max(0,FATE_CARD_IDS.indexOf(c.id));
 // Karten 0–19 behalten bewusst den neutralen Startrahmen.
 if(t.id<20)return 'tc-starter';
 // Manifestationen/Gestalten sind visuell verwandt mit Fusionsmonstern.
 if(t.fusionOnly||c.fusion||c.fused)return 'tc-fusion tc-lv-'+Math.max(1,Math.min(12,t.level))+' tc-special';
 if(t.manifestOf!=null)return 'tc-lv-'+Math.max(1,Math.min(12,t.level))+' tc-manifest';
 const level=Math.max(1,Math.min(12,Math.trunc(Number(t.level)||1)));
 return 'tc-lv-'+level;
}
function fullCardHtml(c,attrs='',classes='',badge=''){const t=dataOf(c),elementLabel=displayElement(t.element);return `<button class="hand-card tc-card ${frameClassForCard(c)}${t.ace?' tc-ace':''}${isFateCard(c)?' fate-sparkle':''} ${classes}" data-element="${escapeHtml(t.element)}" data-level="${t.level}" ${attrs} aria-label="${t.name}, Level ${t.level}, Angriff ${t.atk}, Verteidigung ${t.def}">${badge}${t.ace?'<span class="ace-stamp">✦ ACE</span>':''}<div class="hand-title"><span class="card-name">${escapeHtml(t.name)}</span><span class="card-level-badge" aria-label="Stufe ${t.level}" title="Stufe ${t.level}">LV ${t.level}</span></div><div class="hand-art"><img class="${String(t.art).startsWith('data:image/svg+xml')?'legacy-art':'curated-art'}" src="${t.art}" alt="${escapeHtml(t.name)}"></div><div class="hand-type">${elementLabel}</div><div class="hand-stats" aria-label="Angriff ${t.atk}, Verteidigung ${t.def}"><span class="stat atk" title="Angriff ${t.atk}"><strong class="stat-value">${t.atk}</strong></span><span class="stat def" title="Verteidigung ${t.def}"><strong class="stat-value">${t.def}</strong></span></div></button>`;}
function ensureEditorPreviewId(fusion){const key=fusion?'fusions':'collection',cards=sourceCards(fusion);if(!cards.length)return null;if(!cards.some(c=>c.id===editorPreviewIds[key]))editorPreviewIds[key]=cards[0].id;return editorPreviewIds[key];}
function updateDeckPreview(fusion,id){
 const key=fusion?'fusions':'collection',card=sourceCards(fusion).find(c=>c.id===id);
 if(!card||!['collection','fusions'].includes(menuTab))return;
 editorPreviewIds[key]=id;
 const side=document.getElementById('deckSidePreview');
 if(!side)return;
 side.outerHTML=cardDetailPanel(card,fusion);
 document.querySelectorAll('.deck-editor-grid .collection-item').forEach(item=>{
  const button=item.querySelector('[data-preview-card]');
  item.classList.toggle('preview-selected',!!button&&Number(button.dataset.previewCard)===id);
 });
 document.querySelectorAll('#deckSidePreview [data-action]').forEach(btn=>btn.onclick=()=>menuAction(btn.dataset));
}
function deckPreviewCard(fusion){const cards=sourceCards(fusion),id=ensureEditorPreviewId(fusion);return cards.find(c=>c.id===id)||cards[0]||null;}
function cardFamilyMarkup(c){
 const rootId=c.lineRoot??c.variantOf;
 if(rootId==null)return '';
 const siblings=RPG_BASE_CARDS.filter(x=>x.lineRoot===rootId&&!x.fusionOnly&&!x.essenceMonster).sort((a,b)=>a.level-b.level);
 return '<div class="deck-family"><b>Weitere Stufen · eigene Monsterkarten, gemeinsames Bild</b><div class="deck-family-levels">'+siblings.map(s=>{
  const owned=profile.inventory[s.id]||0,locked=s.requiredTier!=null&&highestCleared()<s.requiredTier;
  return '<span class="'+(s.id===c.id?'active ':'')+(locked?'locked':'')+'" title="'+(locked?'Freischaltung ab Turnierstufe '+s.requiredTier:'Eigenständige Karte: '+owned+' Kopien')+'">Lv '+s.level+(owned?' ✓':'')+'</span>';
 }).join('')+'</div><small>Jede Stufe ist eine eigene sammelbare Karte mit eigenen Werten. Höhere Stufen erscheinen nach Turnierfortschritt in Boostern oder können hergestellt werden.</small></div>';
}
function cardDetailPanel(c,fusion){if(!c)return '<aside class="deck-side-preview"><p>Keine Karte ausgewählt.</p></aside>';const draft=fusion?fusionDraft:deckDraft,n=countCard(draft,c.id),owned=profile.inventory[c.id]||0,rank=profile.enhancements[c.id]||0,cost=enhanceCost(c.id),free=freeCopies(c.id),typeLabel=c.ace?'✦ ACE-Monster':c.fusionOnly&&c.rarity==='rare'?'Seltene Fusion':c.fusionOnly?'Fusion':'Gewöhnliche Karte';return `<aside class="deck-side-preview" id="deckSidePreview"><div class="deck-side-sticky"><div class="deck-preview-card">${fullCardHtml(profileCard(c))}</div><div class="deck-preview-meta"><div class="deck-preview-head"><h3>${escapeHtml(c.name)}</h3><span>${typeLabel}</span></div><p class="deck-preview-desc">${escapeHtml(c.desc||'')}</p>${cardFamilyMarkup(c)}<div class="deck-preview-pills"><span>Besitz <b>${owned}</b></span><span>Im Deck <b>${n}/3</b></span><span>Frei <b>${free}</b></span><span>Aufstieg <b>${rank}/5</b></span></div>${comparisonText(c)}<div class="deck-preview-actions"><div class="copy-controls">${menuButton('−','copy',`data-id="${c.id}" data-delta="-1"`,!n)}${menuButton('+','copy',`data-id="${c.id}" data-delta="1"`,n>=Math.min(3,owned)||draft.length>=(fusion?15:40))}</div>${owned?menuButton(profile.favorites.includes(c.id)?'★ Geschützt':'☆ Schützen','favorite',`data-id="${c.id}"`):''}${profile.unseen.includes(c.id)?menuButton('Als gesehen markieren','seen',`data-id="${c.id}"`):''}${rank<5?`<progress max="${cost.copies}" value="${Math.min(free,cost.copies)}"></progress><small>${free}/${cost.copies} freie Kopien für +${ascensionStep(c.id)} ATK/DEF</small>`:'<small>Maximaler Aufstieg erreicht.</small>'}${menuButton(rank===5?'Maximal verstärkt':'Kopienaufstieg …','enhance',`data-id="${c.id}"`,rank===5||free<cost.copies)}${c.rpg?menuButton(`Exemplar herstellen: ${SHARD_CRAFT_COST} Splitter + ${cardCost(c.id)} ✦`,'craft',`data-id="${c.id}"`,!cardAvailable(c.id)||sharedShards()<SHARD_CRAFT_COST||profile.coins<cardCost(c.id)):''}${c.hard&&!profile.hardWins[c.source]?'<small>Rezept: erster manueller Hard-Sieg erforderlich.</small>':''}${owned?menuButton(`1 freie Kopie verkaufen · +${sellPrice(c.id)} ✦`,'sell',`data-id="${c.id}"`,free<1):''}</div></div></div></aside>`;}
function cardHtml(c,side){const t=dataOf(c);return `<div class="board-creature tc-card ${frameClassForCard(c)}${t.ace?' tc-ace':''}${isFateCard(c)?' fate-sparkle':''} ${c.mode==='def'?'defense':''} ${c.attacked?'exhausted':''} ${game.lastSummoned===c.uid?'summon-anim':''}"><img class="board-art ${String(t.art).startsWith('data:image/svg+xml')?'legacy-art':'curated-art'}" src="${t.art}" alt=""><span class="board-level">Lv ${t.level}</span>${t.ace?'<span class="board-ace-stamp">ACE</span>':''}<span class="state-badge">${c.mode==='atk'?'ATK':'DEF'}</span><div class="board-name">${t.name}</div><div class="board-stats"><b>⚔${effectiveAttack(game,c,null)}${game.mode==='pve'&&c.surgeTurn===game.turn?' ↑':''}</b><b>◆${t.def}</b></div></div>`;}
function render(){saveDuelSnapshot();renderHud();if(!game)return;const viewer=game.mode==='pve'?0:game.active,me=game.players[viewer],foe=game.players[1-viewer],humanTurn=game.mode==='pvp'||game.active===0,sel=humanTurn?game.selection:null,pending=humanTurn?game.pending:null,chosen=sel?.type==='field'?me.field[sel.idx]:null;
 for(const [p,prefix]of [[me,'my'],[foe,'enemy']]){$(prefix+'Name').textContent=game.mode==='pve'?(p.id===0?'DUELLANT 1 · DU':(game.showcase?SHOWCASE_NAME:game.encounter?.name||(game.opponentId===0?trainingName(game.trainingStage):OPPONENTS[game.opponentId].name)).toUpperCase()):'DUELLANT '+(p.id+1);$(prefix+'LP').textContent=p.lp;$(prefix+'LPBar').style.width=p.lp/(game.maxLP||8000)*100+'%';$(prefix+'Deck').textContent=p.deck.length;$(prefix+'Portrait').textContent=roman[p.id];}
 $('handCount').textContent=`(${me.hand.length} / 5)`;$('turnName').textContent=humanTurn?'Duellant '+(game.active+1):'KI ist am Zug';$('turnSeal').textContent=roman[game.active];$('turnNumber').textContent=`Runde ${roundNumber(game)} · Zug ${game.turn}`;
 for(const [row,p,side]of [['ownRow',me,'mine'],['enemyRow',foe,'enemy']])$(row).innerHTML=p.field.map((c,i)=>`<button class="monster-slot ${side} ${c?'':'empty'} ${side==='mine'&&pending?'can-place':''} ${side==='mine'&&sel?.type==='field'&&sel.idx===i?'selected':''} ${side==='enemy'&&c&&canAttack(game,chosen)?'targetable':''}" data-${side}="${i}" ${!humanTurn||busy?'disabled':''} aria-label="${c?dataOf(c).name:'Leere Zone '+(i+1)}">${c?cardHtml(c,side):''}${side==='mine'&&pending&&c?fusionZoneHint(game,pending,c):''}</button>`).join('');
 $('touchFusionBtn').hidden=!humanTurn;$('touchFusionBtn').disabled=busy||aiRunning||game.summoned||!!pending||game.winner!==null;$('touchFusionBtn').classList.toggle('active',materialMode);$('touchFusionBtn').textContent=materialMode?'✓ Fusionsmodus aktiv: 2–5 Karten antippen':'✧ Touch-Fusion aktivieren';
 $('hand').innerHTML=me.hand.map(c=>{const index=game.materials.indexOf(c.uid),marked=humanTurn&&index>=0,discard=marked&&index<game.materials.length-2;return fullCardHtml(c,`data-hand="${c.uid}" ${!humanTurn||busy?'disabled':''}`,`${sel?.type==='hand'&&sel.uid===c.uid?'selected':''} ${marked?'fusion-mark':''} ${discard?'discard-mark':''}`,marked?`<span class="order-badge">${index+1}</span><span class="material-label">${discard?'ABWURF':'FUSION'}</span>`:'');}).join('')||'<div class="no-cards">Keine Handkarten</div>';
 if(pending){const t=dataOf(pending.card);$('summonStage').innerHTML=`<div class="stage-card">${pending.kind==='fusion'?'<div class="arcane-fusion-concealed">✧ FUSION IM ENTSTEHEN ✧<br>Die Werte erscheinen nach der Platzierung.</div>':fullCardHtml(pending.card)}</div><div class="stage-copy"><span class="step">SCHRITT 2 · MONSTERZONE WÄHLEN</span><b>${t.name} · Lv ${t.level}</b><br>${pending.kind==='fusion'?'ATK / DEF werden erst auf dem Feld aufgedeckt.':'ATK '+t.atk+' / DEF '+t.def}<br>Leere Zone beschwört, besetzte Zone fusioniert.<br>Eine Feldfusion nutzt den Mittelpunkt des normalen Potenzials ihrer Zielstufe; der Wurf kann auch unter dem stärksten Material liegen.<br>Qualität: ${pending.card.qualityRolls||1} Würfe · bester Gesamtwert.${pending.kind==='fusion'?'<br>Qualität und Materialrollen bestimmen, wie stark diese Fusion wird.':''}</div>`;}
 else {const levels=humanTurn?game.materials.slice(-2).map(uid=>me.hand.find(c=>c.uid===uid)).filter(Boolean).map(c=>dataOf(c).level):[];$('summonStage').innerHTML=`<div class="stage-copy"><span class="step">${humanTurn?'SCHRITT 1 · HANDAKTION':'GEGNER AM ZUG'}</span><b>${humanTurn?'Beschwören oder fusionieren':'Die KI entscheidet …'}</b><br>${levels.length===2?`${game.materials.length-2} Abwurf · Ergebnis Lv ${fusionLevel(levels,game)} · Qualität ${qualityRolls(levels)} Würfe`:'Handkarte antippen und „Beschwören“ wählen. Fusion: mindestens 2 Karten rechtsklicken oder Touch-Fusion aktivieren.'}</div>`;}
 const blocked=busy||!humanTurn||game.winner!==null;$('summonBtn').disabled=blocked||game.summoned||!!pending||sel?.type!=='hand';$('fusionBtn').disabled=blocked||game.summoned||!!pending||game.materials.length<2;$('clearBtn').disabled=blocked||pending?.kind==='fusion'||!(sel||pending||game.materials.length);$('switchBtn').disabled=blocked||!!pending||!chosen||chosen.switched;$('directBtn').disabled=blocked||!canAttack(game,chosen)||foe.field.some(Boolean);$('retryAiBtn').hidden=game.mode!=='pve'||game.active!==1||game.winner!==null||busy||aiRunning;$('endTurnBtn').disabled=blocked||!!pending;$('endTurnBtn').textContent='Zug beenden [Leertaste] → Duellant '+(nextPlayer(game)+1);
 $('switchBtn').textContent=chosen?`↻ ${chosen.mode==='atk'?'In Verteidigung drehen':'In Angriff drehen'}${chosen.switched?' · verbraucht':''}`:'↻ Position wechseln';
 $('selectedInfo').innerHTML=chosen?`<b>${dataOf(chosen).name} · Lv ${dataOf(chosen).level}</b><br>ATK ${dataOf(chosen).atk} / DEF ${dataOf(chosen).def}${game.mode==='pve'&&chosen.surgeTurn===game.turn?'<br><b>Vorstoß aktiv: '+effectiveAttack(game,chosen,null)+' Angriffsleistung.</b>':''}${dataOf(chosen).ability?'<br>'+dataOf(chosen).desc:''}${decayDescription(chosen)}<br>${chosen.attacked?'Angriff verbraucht.':game.turn===1?'Im Eröffnungszug ist kein Angriff erlaubt.':chosen.mode==='def'?'In Verteidigung ist kein Angriff möglich.':'Angriff noch verfügbar.'}`:pending?'Beschwörungsauswahl bereit. Wähle eine Monsterzone.':sel?.type==='hand'?`${dataOf(me.hand.find(c=>c.uid===sel.uid)).name} · „Beschwören“ bestätigen.`:game.materials.length?`${game.materials.length} Fusionskarten markiert.`:'Noch keine Karte ausgewählt.';
 $('actionHint').textContent=pending?'Leere Zone: beschwören · besetzte Zone: fusionieren.':chosen?'Gegnerisches Ziel wählen oder Kampfposition ändern.':'Wähle zuerst deine Handaktion.';
 $('turnAdvice').innerHTML=`${humanTurn?(game.summoned?'Beschwörung verbraucht. Greife an oder beende den Zug.':'Eine Beschwörung pro Zug, mit oder ohne Fusion.'):'KI spielt mit ihrer eigenen Hand und dem sichtbaren Feld.'}<br>Die Spieler sind strikt abwechselnd am Zug.<br><span class="grave-label">${game.mode==='pve'?'Fusionsvorrat: '+me.remainingFusion.length+'/'+me.fusionDeck.length+' · Details unter Deck<br>':''}Friedhof ${me.graveyard.length} · Gegner ${foe.graveyard.length}<br>Schild: du ${me.shield} · Gegner ${foe.shield}</span>`;
 const d=arenaDamage(roundNumber(game));$('arenaStatus').textContent=d?`RUNDENENDE: BEIDE −${d} LP · TIEBREAK: DUELLANT ${game.tiePriority+1}`:`RUNDE ${roundNumber(game)} / 9 · ZERFALL AB RUNDE 10 · TIEBREAK: DUELLANT ${game.tiePriority+1}`;$('arenaStatus').classList.toggle('active',d>0);$('duelLog').innerHTML=game.log.map(s=>`<li>${escapeHtml(s)}</li>`).join('');for(const id of ['deckBtn','restartBtn','homeBtn','rulesBtn','poolBtn'])$(id).disabled=busy||aiRunning;$('targetHint').textContent=foe.field.some(Boolean)?'MONSTER ALS ZIEL WÄHLEN':'FELD FREI';renderCardPreview();$('surrenderBtn').disabled=busy||aiRunning||game.winner!==null;
}
function inputAllowed(){if(profile.rewardQueue.length)return false;return !!game&&uiMode==='duel'&&!busy&&!aiRunning&&game.winner===null&&$('overlay').classList.contains('hidden')&&(game.mode==='pvp'||game.active===0);}
function onHand(uid){if(!inputAllowed()||game.summoned)return;enemyPreviewIndex=null;if(game.pending){if(game.pending.kind==='normal'&&game.pending.card.uid===uid){game.pending=null;game.selection=null;render();}return;}if(materialMode){if(isFateCard(game.players[game.active].hand.find(c=>c.uid===uid))){toast('Schicksalskarten können nicht fusioniert werden.');return;}markMaterial(uid);return;}game.materials=[];game.selection=game.selection?.type==='hand'&&game.selection.uid===uid?null:{type:'hand',uid};render();}
function markMaterial(uid){if(!inputAllowed()||game.summoned||game.pending)return;if(isFateCard(game.players[game.active].hand.find(c=>c.uid===uid))){toast('Schicksalskarten sind keine Fusionsmaterialien.');return;}game.selection=null;const i=game.materials.indexOf(uid);if(i>=0)game.materials.splice(i,1);else if(game.materials.length<5)game.materials.push(uid);render();}
function clearSelection(){if(!inputAllowed()||game.pending?.kind==='fusion')return;game.selection=null;game.materials=[];game.pending=null;materialMode=false;render();}

async function fusionAnimation(level){if(animationSpeed==='instant')return;const effect=document.createElement('div');effect.className='fusion-effect';effect.innerHTML=`<span>✧ FUSION · LV ${level} ✧</span>`;document.body.append(effect);sound('summon');await animationWait(180);effect.remove();}


function switchMode(){if(inputAllowed()&&game.selection?.type==='field'&&switchPosition(game,game.selection.idx))render();}
async function performAttack(ai,di){if(!inputAllowed())return;busy=true;const viewId=game.mode==='pve'?0:game.active,a=center(document.querySelector(`[data-mine="${ai}"]`)),b=di===null?center($('enemyBanner')):center(document.querySelector(`[data-enemy="${di}"]`));if(animationSpeed!=='instant'){bolt(a,b);sound('attack');}const result=attack(game,ai,di);if(result){render();if(result.damage)damageFloat(result.damaged===viewId?a:b,'−'+result.damage);await animationWait(120);}busy=false;render();if(game.winner!==null)showFinished();}
function onEnemySlot(idx){if(!game)return;if(inputAllowed()&&game.selection?.type==='field'){enemyPreviewIndex=null;performAttack(game.selection.idx,idx);return;}const foe=game.players[game.mode==='pve'?1:1-game.active];if(foe.field[idx]){enemyPreviewIndex=idx;renderCardPreview();}}
async function endTurn(){if(!inputAllowed()||game.pending)return;materialMode=false;const previousPlayer=game.active;advanceTurn(game);if(game.fateEvent){busy=true;render();await fateAnimation(game);busy=false;}if(game.winner!==null){showFinished();return;}if(game.mode==='pvp'&&game.active!==previousPlayer){openModal(modalHtml('SPIELERWECHSEL',`Duellant ${game.active+1} ist dran.`,roman[game.active],'Gebt das Gerät weiter und deckt danach die Hand auf.','','<button class="btn primary" id="modalGo">HAND AUFDECKEN →</button>'));$('hand').innerHTML='<div class="no-cards">Hand verdeckt · Spielerwechsel</div>';$('largeCardPreview').innerHTML='<p>Spielerwechsel · Kartenansicht verdeckt.</p>';$('selectedInfo').textContent='Spielerwechsel';$('modalGo').onclick=()=>{render();hideModal();};}else {render();runAi();}}
async function runAi(){if(!game||game.mode!=='pve'||game.active!==1||game.winner!==null||aiRunning)return;enemyPreviewIndex=null;aiRunning=true;busy=true;const g=game;try{for(let i=0;i<80&&game===g&&g.active===1&&g.winner===null;i++){const a=chooseAiAction(g,OPPONENTS[g.opponentId].policy);let result;if(a.type==='attack'&&animationSpeed!=='instant'){const from=center(document.querySelector(`[data-enemy="${a.ai}"]`)),to=a.di===null?center($('myBanner')):center(document.querySelector(`[data-mine="${a.di}"]`));bolt(from,to);sound('attack');}result=applyAiAction(g,a);if(!result)throw Error('KI-Aktion nicht möglich.');render();if(g.fateEvent)await fateAnimation(g);if(a.type==='place'&&result.fused)await fusionAnimation(dataOf(result.card).level);else await animationWait(a.type==='attack'?120:60);if(a.type==='place')g.lastSummoned=null;}}catch(e){toast('Der KI-Zug wurde unterbrochen. Klicke auf „KI-Zug fortsetzen“, um weiterzuspielen.');}finally{aiRunning=false;busy=false;if(game===g){render();if(g.winner!==null)showFinished();}}}
async function fateAnimation(g){
 const event=g.fateEvent;if(!event)return;
 const layer=document.createElement('div');layer.className='fate-cinema';layer.setAttribute('role','status');
 const cards=event.cards.map(id=>CARDS[id]);
 layer.innerHTML='<div class="fate-cinema-aura"></div><div class="fate-cinema-title">✦ DAS SCHICKSAL ERWACHT ✦</div>'+
 '<div class="fate-cinema-sub">Duellant '+(event.owner+1)+' · Eine letzte Chance</div>'+
 '<div class="fate-cinema-cards">'+cards.map((c,i)=>'<div class="fate-reveal" style="--fate-i:'+i+'"><div class="fate-reveal-inner"><div class="fate-reveal-back">✧</div><div class="fate-reveal-front"><img src="'+CARDS[FATE_ART_IDS[FATE_CARD_IDS.indexOf(c.id)]].art+'" alt=""><b>✦ '+escapeHtml(FATE_NAMES[FATE_CARD_IDS.indexOf(c.id)])+'</b><span>✦ SCHICKSAL ✦</span></div></div></div>').join('')+'</div>'+
 '<div class="fate-cinema-foot">Fünf Karten · Unverschmelzbar · Nur für dieses Duell</div>';
 document.body.append(layer);sound('summon');
 await new Promise(resolve=>setTimeout(resolve,animationSpeed==='instant'?850:2800));
 layer.remove();if(g.fateEvent===event)g.fateEvent=null;
}
function toggleSpeed(){animationSpeed=animationSpeed==='instant'?'fast':'instant';profile.settings.animation=animationSpeed;saveProfile();if(uiMode==='menu')renderMenu();else render();}
function toggleSound(){soundOn=!soundOn;profile.settings.sound=soundOn;saveProfile();sound('summon');if(uiMode==='menu')renderMenu();else render();}

function showPool(){openModal(modalHtml('MONSTERKATALOG','Deine freigeschalteten Karten','✦','Hier findest du deine bereits entdeckten Monster. Turnierkarten, Verstärkungen und das klassische lokale Duell bleiben getrennte Sammlungen.',`<div class="pool-grid">${(game?.mode==='pvp'?CARDS.filter(c=>c.id<35):UPDATE_B_ACTIVE_IDS.map(id=>CARDS[id]).filter(c=>ownsCard(c.id))).map(c=>fullCardHtml({id:c.id})).join('')}</div>`,'<button class="btn primary" id="modalGo">ZURÜCK</button>'));$('modal').classList.add('pool-modal');$('modalGo').onclick=hideModal;}

function askRestart(){if(busy||aiRunning)return;if(game?.showcase){toast('Dieses Geheimduell kann nicht neu gestartet werden.');return;}openModal(modalHtml('NEUE PARTIE','Duell neu beginnen?','↻','Die laufende Partie wird verworfen. Dein Fortschritt bleibt erhalten.','','<button class="btn ghost" id="cancelRestart">ABBRECHEN</button><button class="btn primary" id="confirmRestart">NEU STARTEN</button>'));$('cancelRestart').onclick=hideModal;$('confirmRestart').onclick=()=>{const mode=game.mode,id=game.opponentId,context=game.context,difficulty=game.difficulty,challenge=game.challenge;hideModal();game=null;profile.activeDuel=null;saveProfile();startDuel(mode,id,context,difficulty,challenge);};}
$('menuNav').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b){menuTab=b.dataset.tab;if(menuTab==='collection')deckDraft=[...profile.activeDeck];if(menuTab==='fusions')fusionDraft=[...profile.fusionDeck];renderMenu();}});
$('hand').addEventListener('click',e=>{const b=e.target.closest('[data-hand]');if(b)onHand(Number(b.dataset.hand));});$('summonStage').addEventListener('click',e=>{if(e.target.closest('.stage-card')&&game?.pending?.kind==='normal'&&inputAllowed()){game.pending=null;game.selection=null;enemyPreviewIndex=null;render();}});$('hand').addEventListener('contextmenu',e=>{const b=e.target.closest('[data-hand]');if(b){e.preventDefault();markMaterial(Number(b.dataset.hand));}});$('ownRow').addEventListener('click',e=>{const b=e.target.closest('[data-mine]');if(b)onOwnSlot(Number(b.dataset.mine));});$('enemyRow').addEventListener('click',e=>{const b=e.target.closest('[data-enemy]');if(b)onEnemySlot(Number(b.dataset.enemy));});
$('touchFusionBtn').onclick=()=>{if(!inputAllowed()||game.summoned||game.pending)return;materialMode=!materialMode;game.selection=null;if(!materialMode)game.materials=[];render();};$('retryAiBtn').onclick=()=>{hideModal();runAi();};$('summonBtn').onclick=prepareSummon;$('fusionBtn').onclick=()=>prepareFusion();$('clearBtn').onclick=clearSelection;$('switchBtn').onclick=switchMode;$('directBtn').onclick=()=>{if(game?.selection?.type==='field')performAttack(game.selection.idx,null);};$('endTurnBtn').onclick=endTurn;$('rulesBtn').onclick=showRules;$('iphoneHelpBtn').onclick=showIphoneHelp;$('poolBtn').onclick=showPool;$('deckBtn').onclick=showDeck;$('restartBtn').onclick=askRestart;$('homeBtn').onclick=askMenu;$('speedBtn').onclick=toggleSpeed;$('soundBtn').onclick=toggleSound;
$('importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2e6)throw Error('Spielstand-Datei ist zu groß.');const text=await file.text();if(uiMode!=='menu'||game){toast('Bitte den Spielstand im Hauptmenü erneut importieren.');return;}const preview=validateProfile(JSON.parse(text));openModal(modalHtml('SPIELSTAND IMPORTIEREN','Profil ersetzen?','↧',`Sicherung: Stufe ${playerLevel(preview)}, ${fmt(preview.coins)} Essenz, ${preview.wins} Siege. Das aktuelle Profil wird durch diese Sicherung ersetzt.`,'','<button class="btn ghost" id="cancelImport">ABBRECHEN</button><button class="btn primary" id="confirmImport">IMPORTIEREN</button>'));$('cancelImport').onclick=hideModal;$('confirmImport').onclick=()=>{try{importProfileText(text);deckDraft=[...profile.activeDeck];fusionDraft=[...profile.fusionDeck];animationSpeed=profile.settings.animation;soundOn=profile.settings.sound;hideModal();renderMenu();toast('Spielstand geladen.');}catch(err){toast(err.message);}};}catch(err){toast('Import fehlgeschlagen: '+err.message);}});

window.addEventListener?.('storage',e=>{if(e.key!==SAVE_KEY&&e.key!==null)return;if(e.key===SAVE_KEY&&e.newValue===lastStoredProfile)return;markStorageConflict();stopTraining(false);if(uiMode==='menu')renderMenu();else renderHud();});
setInterval(()=>{const old=profile.auto.energy;refreshEnergy();if(old!==profile.auto.energy){if(uiMode==='menu')renderMenu();else renderHud();}},1000);

function comparisonText(c){const ids=c.fusionOnly?profile.fusionDeck:profile.activeDeck;const peers=[...new Set(ids)].filter(id=>CARDS[id].level===c.level&&id!==c.id);if(!peers.length)return '<small>Keine andere ausgerüstete Karte derselben Stufe.</small>';const best=peers.sort((a,b)=>{const x=profileCard(CARDS[a]).card,y=profileCard(CARDS[b]).card;return y.atk+y.def-x.atk-x.def;})[0],a=profileCard(c).card,b=profileCard(CARDS[best]).card;const sign=n=>(n>=0?'+':'')+n;return `<small>Gegen ${CARDS[best].name} (Lv ${c.level}): ATK ${sign(a.atk-b.atk)} / DEF ${sign(a.def-b.def)}. Rollen zusätzlich beachten.</small>`;}
function lootHistoryHtml(){return `<details class="loot-history"><summary>Beutehistorie · ${profile.lootHistory.length} letzte Siege</summary>${profile.lootHistory.length?profile.lootHistory.map(l=>`<p><small>${new Date(l.at).toLocaleString('de-AT')} · ${OPPONENTS[l.source].name}</small><br>${lootText(l)}</p>`).join(''):'<p>Noch keine Beute.</p>'}</details>`;}
function showRefund(id){const q=refundQuote(id);openModal(modalHtml('VERSTÄRKUNG ZURÜCKSETZEN',CARDS[id].name,'↶','Die Karte bleibt in deiner Sammlung und in deinen Decks. Ihre Verstärkung wird auf 0 gesetzt; laufende Duelle behalten ihre bereits gespeicherten Werte.',`<p>Erstattung: <b>${q.coins} Essenz + ${q.shards} ${OPPONENTS[q.source].theme}-Splitter</b>.</p>`,'<button class="btn" id="refundCancel">ABBRECHEN</button><button class="btn primary" id="refundConfirm">ZURÜCKSETZEN</button>'));$('refundCancel').onclick=hideModal;$('refundConfirm').onclick=()=>{if(resetEnhancement(id)){hideModal();renderMenu();toast('Verstärkung zurückgesetzt und Ressourcen erstattet.');}};}
function showEquipmentProposal(){const main=strongestMainDeck(profile.unlocked,profile.enhancements,profile.inventory),fusions=bestFusionDeck(profile.fusionOwned,profile.enhancements,profile.inventory);const list=(ids,old)=>[...new Set([...ids,...old])].map(id=>`<div class="deck-item"><span>${CARDS[id].name} · Lv ${CARDS[id].level}</span><b>${old.filter(x=>x===id).length} → ${ids.filter(x=>x===id).length}</b></div>`).join('');const differences=(old,ids)=>[...new Set([...old,...ids])].filter(id=>old.filter(x=>x===id).length!==ids.filter(x=>x===id).length).length;openModal(modalHtml('AUSRÜSTUNGSVORSCHLAG','Beide Decks vergleichen','▤','Hauptdeck nach Gesamtwerten; Fusionen nach ATK, damit der Vorschlag Angriffe begünstigt. Rollen werden nicht gewichtet. Die Listen zeigen bisherige → vorgeschlagene Anzahl. Deine Decks ändern sich erst beim Übernehmen.',`<p>${differences(profile.activeDeck,main)} Hauptkartenarten und ${differences(profile.fusionDeck,fusions)} Fusionen ändern ihre Anzahl. Mehrere Kopien erlauben wiederholte Beschwörungen. Prüfe die Mengen deiner Zwischenstufen.</p><details open><summary>Hauptdeck · 40 Karten</summary>${list(main,profile.activeDeck)}</details><details open><summary>Fusionsdeck · ${fusions.length}/15</summary>${list(fusions,profile.fusionDeck)}</details><p>Ungespeicherte Deckentwürfe werden beim Übernehmen ersetzt.</p>`,'<button class="btn" id="proposalCancel">BEHALTEN</button><button class="btn primary" id="proposalApply">BEIDE DECKS ÜBERNEHMEN</button>'));$('proposalCancel').onclick=hideModal;$('proposalApply').onclick=()=>{if(storageConflict)return;profile.activeDeck=main;profile.fusionDeck=fusions;saveProfile();deckDraft=[...main];fusionDraft=[...fusions];hideModal();renderMenu();};}

function progressionHint(){const next=profile.cleared.length+1;if(next>10)return '<p>Alle Prüfungen bestanden. Du kannst deine Sammlung vervollständigen und eigene Decks testen.</p>';const source=next-1,breaker=OPPONENTS[source].loot[2],rank=profile.enhancements[breaker]||0;if(!ownsCard(breaker))return `<p class="loot-banner">Nächster Ausbau: ${CARDS[breaker].name}. Sammle beim ${OPPONENTS[source].name} zuerst ${SHARD_CRAFT_COST} Splitter für diese Angriffsfusion (${sharedShards()}/${SHARD_CRAFT_COST}) und ${cardCost(breaker)} Essenz. Spare diese Splitter vor weiteren Verstärkungen schwächerer Karten.</p>`;return `<p class="loot-banner">Vorbereitung auf Prüfung ${next}: ${CARDS[breaker].name} ist verfügbar (+${rank}/5). ${!profile.fusionDeck.includes(breaker)?'Prüfe den Ausrüstungsvorschlag oder lege sie im Fusionsdeck an.':rank<3?'Verstärke sie zunächst auf +3 und teste die nächste Prüfung.':'Deine Angriffsfusion ist vorbereitet. Probiere die nächste Prüfung; bei Bedarf weiter verstärken.'}</p>`;}

const difficultySelection=Array(11).fill('easy');
function menuButton(label,action,attrs='',disabled=false){return `<button class="btn" data-action="${action}" ${attrs} ${disabled?'disabled':''}>${label}</button>`;}
function navMarkup(){return [['tournament','Turnier'],['free','Freimodus'],['shop','Booster-Shop'],['xp','Levelbelohnungen'],['challenges','Challenges'],['collection','Hauptdeck'],['fusions','Fusionsdeck'],['decks','Deckplätze'],['packs','Charakter-Boosterpacks'],['lexicon','Lexikon'],['upgrades','Ausbau'],['stats','Chronik & Hinweise'],['pvp','Lokales PvP'],['settings','Spielstand']].map(([id,label])=>`<button class="menu-tab ${menuTab===id?'active':''}" data-tab="${id}">${label}</button>`).join('');}
function renderHud(){
 refreshEnergy();
 const level=playerLevel(profile),floor=levelFloor(level),next=levelFloor(level+1),maximum=level>=100;
 const progress=maximum?100:Math.max(0,Math.min(100,100*(profile.xp-floor)/Math.max(1,next-floor)));
 const totalShards=sharedShards();
 const shardDetails='Gemeinsamer Splittervorrat · für alle herstellbaren Karten';
 $('profileHud').innerHTML=`<span>✦ <b>${fmt(profile.coins)}</b> Essenz</span><span title="${escapeHtml(shardDetails)}">◆ <b>${fmt(totalShards)}</b> Splitter <button type="button" class="hud-shards-help" id="hudShardsHelp" aria-label="Wozu brauche ich Splitter?">?</button></span><span class="hud-xp">Lv <b>${level}</b> <span class="xp-meter" role="progressbar" aria-label="XP bis zum nächsten Level" aria-valuenow="${Math.round(progress)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${progress.toFixed(2)}%"></i></span><small>${maximum?'Maximale Stufe erreicht':fmt(profile.xp-floor)+' / '+fmt(next-floor)+' XP bis Level '+(level+1)}</small></span><span>⚡ <b>${profile.auto.energy}/${AUTO_CAP}</b> Automatik</span><button type="button" class="hud-drop ${profile.useDropCharges?'active':''}" id="hudDropToggle" aria-pressed="${profile.useDropCharges}" title="Dropladungen erhöhen die Beute im Autokampf; bei ausgeschaltetem Bonus sparst du deine Ladungen.">✧ ${profile.dropCharges}/${dropChargeCap()} Dropladungen · ${profile.useDropCharges?'AKTIV':'AUS'}</button>${training?'<button class="btn" id="hudStopTraining">Serie stoppen</button>':''}`;
 $('hudShardsHelp').onclick=()=>toast('Alle Splitter bilden einen gemeinsamen Vorrat. Eine Kartenherstellung kostet 30 Splitter und zusätzlich Essenz.');
 $('hudDropToggle').onclick=()=>{if(storageConflict){toast('Speicherkonflikt: Einstellung derzeit gesperrt.');return;}profile.useDropCharges=!profile.useDropCharges;saveProfile();renderHud();};
 if($('hudStopTraining'))$('hudStopTraining').onclick=()=>stopTraining();
 $('storageNotice').hidden=!storageWarning;$('storageNotice').textContent=storageWarning;
 $('soundBtn').textContent='♪ Ton: '+(soundOn?'An':'Aus');
 $('speedBtn').textContent='✧ Animationen: '+(animationSpeed==='instant'?'Aus':'An');
 document.body.classList.toggle('instant',animationSpeed==='instant');
}
function lootText(l){return l?`+${l.shards} Splitter${l.card!==null?' · '+CARDS[l.card].name+(l.duplicate?' · weiteres Exemplar':' · NEU'):''}`:'';}
function sourceCards(fusion){return (fusion?RPG_FUSIONS:RPG_BASE_CARDS).filter(c=>ownsCard(c.id)).sort((a,b)=>fusion?b.level-a.level||b.atk-a.atk||a.name.localeCompare(b.name):a.id-b.id);}
function previousCardEditor(c,fusion){const draft=fusion?fusionDraft:deckDraft,n=countCard(draft,c.id),owned=profile.inventory[c.id]||0,rank=profile.enhancements[c.id]||0,cost=c.rpg?enhanceCost(c.id):null;return `<article class="collection-item ${n?'chosen':''}">${fullCardHtml(profileCard(c))}<div class="collection-actions"><b>${profile.unseen.includes(c.id)?'✦ NEU · ':''}Besitz ${owned} · Im Deck ${n}/3</b>${comparisonText(c)}<div class="copy-controls">${menuButton('−','copy',`data-id="${c.id}" data-delta="-1"`,!n)}${menuButton('+','copy',`data-id="${c.id}" data-delta="1"`,n>=Math.min(3,owned)||draft.length>=(fusion?15:40))}</div>${owned?menuButton(profile.favorites.includes(c.id)?'★ Geschützt':'☆ Favorit','favorite',`data-id="${c.id}"`):''}${profile.unseen.includes(c.id)?menuButton('Als gesehen markieren','seen',`data-id="${c.id}"`):''}${c.rpg?`<span>Verstärkung +${rank}/5 · für alle Exemplare</span>${menuButton(rank===5?'Maximal verstärkt':`+4 %: ${cost.coins} ✦ / ${cost.shards} Splitter`,'enhance',`data-id="${c.id}"`,!owned||rank===5||profile.coins<cost.coins||profile.shards[cost.source]<cost.shards)}${rank?menuButton('Verstärkung zurücksetzen …','refund',`data-id="${c.id}"`):''}${menuButton(`Exemplar herstellen: ${SHARD_CRAFT_COST} Splitter + ${cardCost(c.id)} ✦`,'craft',`data-id="${c.id}"`,!cardAvailable(c.id)||sharedShards()<SHARD_CRAFT_COST||profile.coins<cardCost(c.id))}`:''}${owned?menuButton(`1 Exemplar verkaufen: +${sellPrice(c.id)} Essenz`,'salvage',`data-id="${c.id}"`,profile.favorites.includes(c.id)||owned<=reservedCopies(c.id)):''}</div></article>`;}
function regularOpponentPanel(o,tournament){const difficulty=tournament?'easy':difficultySelection[o.id],hard=difficulty==='hard',unlocked=tournament?tournamentUnlocked(o.id):opponentUnlocked(o.id),canHard=hardUnlocked(o.id),k=packKey(o.id,difficulty),auto=autoUnlocked(o.id,difficulty);return `<article class="menu-panel opponent-card"><div class="opponent-seal">${o.icon}</div><h2>${o.name}</h2><p>${o.profileLine||o.themeText}<br><b>Acemonster:</b> ${CARDS[o.aceCard].name} · Lv ${CARDS[o.aceCard].level}<br>${hard?'Hard: höhere Kartenstufen, 120 % Turnierfaktor, stärkere Handkarten.':tournament?'Volle Turnierstärke.':o.id?'Easy: 90 % Turnierwerte.':'Einsteigertraining.'}<br><b>Lebenspunkte:</b> ${duelStartingLP('pve',o.id,difficulty,tournament?'tournament':'free').toLocaleString('de-AT')} LP für beide</p>${!tournament?`<div class="copy-controls">${menuButton('Easy','difficulty',`data-id="${o.id}" data-mode="easy"`)}${menuButton('Hard','difficulty',`data-id="${o.id}" data-mode="hard"`,!canHard)}</div><p>Gewählt: <b>${hard?'Hard':'Easy'}</b> · ${profile.manualEasy[o.id]}/10 manuelle Easy-Siege<br>Hard-Automatik: ${profile.hardWins[o.id]}/3 manuelle Hard-Siege</p>`:''}<p>Sieg manuell: ${Math.floor(o.coins*(hard?1.6:1)*(1+.05*profile.upgrades.loot))} ✦ · ${Math.floor(o.xp*(hard?1.6:1)*(1+.1*profile.upgrades.learning))} XP · 3 Splitter<br>Kartenchance 40 % · Auto 12 % · geboostet 20 %</p><progress max="1000" value="${profile.packProgress[k]}"></progress><small>Pack: ${profile.packProgress[k]/10} % · ${profile.packs[k]} bereit</small>${menuButton('Beutepool & Chancen','loot',`data-id="${o.id}" data-mode="${difficulty}"`)}${unlocked?menuButton(tournament?'Turnierduell':'Manuelles Duell','fight',`data-id="${o.id}" data-context="${tournament?'tournament':'free'}" data-mode="${difficulty}"`):'<p>Vorherige Prüfung abschließen.</p>'}${!tournament&&unlocked?menuButton('Autokampf · 1 Ladung','auto',`data-id="${o.id}" data-mode="${difficulty}"`,!auto||!profile.auto.energy||!!training)+menuButton('Serie · max. 10 Kämpfe','series',`data-id="${o.id}" data-mode="${difficulty}"`,!auto||!profile.auto.energy||!!training):''}</article>`;}
function renderMenu16(){renderHud();$('menuScreen').hidden=false;$('duelScreen').hidden=true;$('menuNav').hidden=false;$('menuNav').innerHTML=navMarkup();for(const id of ['deckBtn','restartBtn','homeBtn'])$(id).hidden=true;for(const id of ['rulesBtn','poolBtn'])$(id).disabled=false;
 $('menuHero').innerHTML=`<span class="side-kicker">ALPHA 2.2 DEV · ${profile.cleared.length}/10 TURNIERPRÜFUNGEN</span><h1>Baue dein Deck. Stell dich der Arena.</h1><p>Aktiv: Deck ${profile.activeSlot+1} · 40 Hauptkarten · ${profile.fusionDeck.length}/15 Fusionskopien.</p><label>Deck für den nächsten Kampf <select id="activeSlotSelect">${profile.slots.map((s,i)=>`<option value="${i}" ${i===profile.activeSlot?'selected':''}>${s.name}</option>`).join('')}</select></label>${profile.activeDuel?'<p><button class="btn primary" id="resumeDuelBtn">Gespeichertes Duell fortsetzen</button></p>':''}${profile.migrationMessage?`<p>${escapeHtml(profile.migrationMessage)}</p>`:''}`;
 let html='';
 if(menuTab==='tournament')html=(profile.trainingWins<3?trainingPanel():'')+'<section class="menu-panel"><h2>Die zehn Prüfungen</h2><p>LP steigen mit der Prüfung: I–III 4.000, IV–VI 6.000, VII–VIII 7.000, IX–X 10.000. Freie Duelle gegen dieselben Gegner haben die gleichen LP; Hard bleibt bei 8.000. Jeder Duellant hat seinen eigenen Stil und seine eigene Sammlung. Besiege ihn im Turnier, um anschließend frei gegen ihn antreten zu können. Erstsiege geben zusätzlich eine Angriffsfusion und ihre normal beschwörbare Gestalt, sechs Splitter und dreifache Basisessenz. Wenn du dir bei deinem Deck unsicher bist, findest du im Deckbau einen unverbindlichen Vorschlag.</p></section><div class="menu-grid">'+OPPONENTS.slice(1).map(o=>opponentPanel(o,true)).join('')+'</div>';
 else if(menuTab==='free')html=`<section class="menu-panel"><h2>Freie Duelle · Normal & Schwer</h2><p>Such dir einen bekannten Duellanten aus und teste dein Deck ohne Turnierdruck. Manuell erhältst du 100 % Essenz und grundsätzlich 100 % XP sowie 3 Splitter pro Sieg. Nach jeweils fünf Spielerleveln pro besiegtem Turniergegner greift beim Wiederholen ein XP-Softcap (ab dem nächsten Level 25 %, später mindestens 10 %); ältere Gegner behalten ihre niedrigere Grenze. Kartendrops werden ebenfalls reduziert. Erste Turniersiege bleiben ungekürzt. Automatik: 30 % und 1 Splitter; mit Dropladung: 50 % und 2 Splitter. Jeder abgeschlossene manuelle Einzelspielerkampf gibt eine Dropladung, anfangs fünf, durch Levelbelohnungen bis acht. Ein aktivierter Bonus wird beim nächsten abgeschlossenen Autokampf verbraucht, auch bei Niederlage.</p>${menuButton(profile.useDropCharges?'✧ Dropladungen: AN':'✧ Dropladungen: AUS','boost')}<p>Pack-Fortschritt je Sieg: manuell 20 %, automatisch 6 %, geboostet 10 %. Easy und Hard haben eigene Packs. Automatikladungen regenerieren bis 30; Serien enden nach zehn Kämpfen. Keine Offlinekämpfe.</p><label>KI-Strategie <select id="strategySelect">${['balanced','offensive','economy'].map((v,i)=>`<option value="${v}" ${v===profile.strategy?'selected':''}>${['Ausgewogen','Offensiv','Sparsam'][i]}</option>`).join('')}</select></label>${training?`<p>${training.matches}/10 Kämpfe · ${training.wins} Siege ${menuButton('Serie stoppen','stop')}</p>`:''}${lootHistoryHtml()}</section><div class="menu-grid">${OPPONENTS.filter(o=>opponentUnlocked(o.id)).map(o=>opponentPanel(o,false)).join('')}</div>`;
 else if(['collection','fusions'].includes(menuTab)){const f=menuTab==='fusions',draft=f?fusionDraft:deckDraft,error=(f?fusionDeckError(draft):mainDeckError(draft))||inventoryError(draft,profile.inventory),cards=sourceCards(f),selected=deckPreviewCard(f);html=`<section class="menu-panel deck-editor-shell"><h2>${f?'Fusionsdeck':'Hauptdeck'} · Deck ${profile.activeSlot+1}</h2><p>${f?'2–15 Kopien, höchstens drei je Art. Jede ausgerüstete Kopie ist einmal pro Duell beschwörbar, auch Weiterfusion verbraucht sie. Im nächsten Duell sind alle wieder verfügbar. Du wählst die erreichbare Vorlage selbst.':'Genau 40 tatsächlich besessene Exemplare, höchstens drei je Art. Ab dem ersten Turniersieg erhältst du normal beschwörbare Gestalten von Fusionen. Weitere Exemplare sind Beute oder herstellbar; ihre Stufen bleiben erhalten.'}</p><p>Kopienaufstiege gelten für alle eigenen Exemplare einer Art, inklusive späterem Loot. Normal- und Fusionsform steigen getrennt auf. Favoriten, Deckkopien und das letzte Exemplar bleiben geschützt. Kopienverbrauch ist dauerhaft.</p><div class="deck-editor-toolbar"><b>${draft.length}/${f?15:40}</b>${menuButton('Deck speichern','save-deck','',!!error)}${menuButton('Vorschlag ansehen','proposal')}${menuButton('Entwurf zurücksetzen','discard')}</div>${error?`<p class="error-note">${error}</p>`:''}<div class="shard-strip"><span>◆ Gemeinsame Splitter: <b>${sharedShards()}</b> · Kartenherstellung: ${SHARD_CRAFT_COST} je Exemplar</span></div><div class="deck-editor-layout"><div class="collection-grid deck-editor-grid">${cards.map(c=>cardEditor(c,f)).join('')}</div>${cardDetailPanel(selected,f)}</div></section>`;}
 else if(menuTab==='decks')html=`<section class="menu-panel"><h2>Drei Deckplätze</h2><p>Jeder Platz speichert Haupt- und Fusionsdeck. Die Plätze teilen sich deine Sammlung. Der aktive Platz wird beim Speichern im Deckbau aktualisiert. Ein laufendes Duell behält sein Startdeck.</p></section><div class="menu-grid">${profile.slots.map((s,i)=>`<section class="menu-panel"><h2>${s.name}</h2><p>${s.main.length} Hauptkarten · ${s.fusion.length} Fusionen</p>${menuButton(i===profile.activeSlot?'Aktiv':'Aktivieren','slot',`data-id="${i}"`,i===profile.activeSlot)}${menuButton('Aktuelles Deck hierhin kopieren','copy-slot',`data-id="${i}"`,i===profile.activeSlot)}</section>`).join('')}</div>`;
 else if(menuTab==='packs')html=`<section class="menu-panel"><h2>Charakter-Boosterpacks</h2><p>Drei verschiedene Karten werden angeboten, darunter manchmal ein einfacher Begleiter aus dem Element des Duellanten. Du nimmst sofort eine kostenlos; die zweite und dritte kannst du gegen Essenz mitnehmen. Pro Pack erscheint höchstens eine seltene Gestalt (Chance abhängig vom Pool: 8–26 %). Nicht gewählte Karten verschwinden ohne Splitter. Ein begonnenes Pack wird gespeichert, bis du deine Wahl abgeschlossen hast. Die Seltenheitschance siehst du beim Öffnen des Packs.</p>${profile.openPack?menuButton('Geöffnetes Pack fortsetzen','resume-pack'):''}</section><div class="menu-grid">${OPPONENTS.filter(o=>opponentUnlocked(o.id)||profile.packs[packKey(o.id,'easy')]>0).flatMap(o=>['easy',...(hardUnlocked(o.id)||profile.packs[packKey(o.id,'hard')]>0||profile.packProgress[packKey(o.id,'hard')]>0?['hard']:[])].map(d=>{const k=packKey(o.id,d);return `<section class="menu-panel"><h2>${o.name} · ${d==='hard'?'Hard':'Easy'}</h2><progress max="1000" value="${profile.packProgress[k]}"></progress><p>${profile.packProgress[k]/10} % · ${profile.packs[k]} Packs bereit<br>Zweite Karte: ${packPrice(o.id,d,1)} ✦ · dritte: ${packPrice(o.id,d,2)} ✦</p>${menuButton('Pack öffnen','pack',`data-id="${o.id}" data-mode="${d}"`,!profile.packs[k]||!!profile.openPack)}</section>`;})).join('')}</div>`;
 else if(menuTab==='challenges')html='<section class="menu-panel"><h2>Challenges</h2><p>Optionale manuelle Prüfungen mit deinen Karten, gegen volle Turnierstärke. Die Sonderbelohnung gibt es einmal; reguläre Duellbelohnungen bleiben. Kein Fortschritt für Easy-/Hard-Freischaltungen.</p></section><div class="menu-grid">'+CHALLENGES.map(c=>`<section class="menu-panel"><h2>${c.name}</h2><p>${c.desc}</p><p>Einmalig +${c.reward} Essenz · ${profile.challenges.includes(c.id)?'✓ Abgeschlossen':'Offen'}</p>${menuButton('Challenge starten','challenge',`data-challenge="${c.id}"`,!challengeEligible(c.id))}</section>`).join('')+'</div>';
 else if(menuTab==='lexicon')html='<section class="menu-panel"><h2>Kartenlexikon</h2><p>Hier kannst du deine Kreaturensammlung durchstöbern. Noch unbekannte Monster bleiben geheim; ihre möglichen Fundorte findest du bei den Duellanten. Bestand, Fähigkeiten und verstärkte Werte findest du bei entdeckten Karten.</p><div class="collection-grid">'+UPDATE_B_ACTIVE_IDS.map(id=>CARDS[id]).map(c=>`<article class="collection-item">${(ownsProfileCard(profile,c.id)||window.ArcaneLearning?.seen?.(c.id))?fullCardHtml(profileCard(c)):'<div class="unknown-card">? <br>Unentdeckt · Lv '+c.level+'</div>'}<p>${c.trainingReward?'Trainingsreihe · einmaliger dritter Sieg':c.source>=0?OPPONENTS[c.source].name+' · '+(c.hard?'Hard':'Easy & Hard'):'Startsammlung'}<br>${c.manifestOf?'Gestalt: auch aus der entdeckten Fusionsvorlage herstellbar.<br>':''}Besitz: ${profile.inventory[c.id]||0}${!ownsProfileCard(profile,c.id)&&window.ArcaneLearning?.seen?.(c.id)?' · Nur im Leihdeck gesehen, noch nicht freigeschaltet':''}</p>${c.source>=0&&!c.trainingReward?menuButton('Chancen ansehen','loot',`data-id="${c.source}" data-mode="${c.hard?'hard':'easy'}"`):''}</article>`).join('')+'</div></section>';
 else if(menuTab==='upgrades')html='<section class="menu-panel"><h2>Werkstatt</h2><p>Deine Essenz ist begrenzt – entscheide, ob du lieber stärkere Monster, schnelleres Training oder bessere Belohnungen möchtest. Die günstige Grundausbildung hält deine ersten 20 Monster länger konkurrenzfähig. Neue seltene Karten schaltest du weiterhin durch Turniersiege frei.</p></section><div class="menu-grid">'+Object.entries(UPGRADES).map(([k,u])=>`<section class="menu-panel"><h2>${u.name}</h2><p>${u.desc} · ${profile.upgrades[k]}/${u.max}</p>${menuButton(`${upgradeCost(k)} Essenz`,'upgrade',`data-key="${k}"`,profile.upgrades[k]>=u.max||profile.coins<upgradeCost(k))}</section>`).join('')+'</div>';
 else if(menuTab==='stats'){const review=profile.lastReview,cost=review?Math.max(10,Math.round(OPPONENTS[review.source].coins*.5)):0;html=`<section class="menu-panel"><h2>Chronik & Hinweise</h2><p>${profile.wins} Siege · ${profile.losses} Niederlagen · ${profile.totalFusions} Fusionen</p>${review?`<h3>Letztes manuelles Duell</h3><p>Hier kannst du für Essenz einen taktischen Hinweis zum letzten Duell kaufen. Ein Hinweis behandelt einen beobachteten Vorgang, keine verbindliche Empfehlung. Keine neue Beobachtung: keine Zahlung.</p>${menuButton(`Einen Hinweis kaufen · ${cost} ✦`,'hint','',profile.coins<cost||review.findings.every(k=>review.bought.includes(k)))}${review.bought.map(k=>`<p class="loot-banner">${HINTS[k]}</p>`).join('')}<details><summary>Sachliche Duellchronik</summary><ol>${review.log.map(l=>`<li>${escapeHtml(l)}</li>`).join('')}</ol></details>`:'<p>Noch kein manuelles Duell abgeschlossen.</p>'}${lootHistoryHtml()}<details><summary>Letzte Duelle</summary>${profile.history.map(h=>`<p>${OPPONENTS[h.opponent].name} · ${h.context} · ${h.win?'Sieg':'Niederlage'} · ${h.turns} Züge · +${h.coins} ✦</p>`).join('')}</details></section>`;}
 else if(menuTab==='pvp')html='<section class="menu-panel"><h2>Lokales PvP</h2><p>Neutraler klassischer Kartenpool, 40 Karten, 8.000 LP. Keine RPG-Boni, keine Dropladungen oder Beute. Klassische Fusionen sind weiterhin unbegrenzt verfügbar.</p>'+menuButton('PvP starten','pvp')+'</section>';
 else html='<section class="menu-panel"><h2>Einstellungen und Spielstandoptionen</h2><p>Automatisches Speichern im Browser. Exportiere vor einem Datei- oder Gerätewechsel. Ältere RPG-Spielstände werden übernommen. Verbesserungsränge bleiben erhalten: Startkarten +10, Hauptkarten +30, Fusionen +20 je Rang. Alte laufende Duelle enden bei der Migration; bereits erreichte XP-Meilensteine erscheinen sofort. Aktuelle Duelle und geöffnete Packs sind fortsetzbar.</p>'+menuButton('Jetzt speichern','save')+menuButton('Exportieren','export')+menuButton('Importieren','import')+menuButton(animationSpeed==='instant'?'Animationen einschalten':'Animationen ausschalten','speed')+menuButton('Ton umschalten','sound')+'</section>';
 $('menuContent').innerHTML=html;bindMenu();
}
function bindMenu(){if($('resumeDuelBtn'))$('resumeDuelBtn').onclick=resumeDuel;if($('activeSlotSelect'))$('activeSlotSelect').onchange=e=>{stopTraining(false);selectDeckSlot(Number(e.target.value));deckDraft=[...profile.activeDeck];fusionDraft=[...profile.fusionDeck];renderMenu();};if($('strategySelect'))$('strategySelect').onchange=e=>{profile.strategy=e.target.value;saveProfile();};document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>menuAction(b.dataset));document.querySelectorAll('[data-preview-card]').forEach(b=>b.onclick=e=>{e.preventDefault();updateDeckPreview(b.dataset.previewKind==='fusions',Number(b.dataset.previewCard));});}
function menuAction16(d){const id=Number(d.id),mode=d.mode||'easy';switch(d.action){case 'fight':startDuel('pve',id,d.context,mode);return;case 'difficulty':if(mode==='easy'||hardUnlocked(id)){difficultySelection[id]=mode;stopTraining(false);}break;case 'auto':quickFight(id,mode);return;case 'series':toggleTraining(id,mode);return;case 'stop':stopTraining();return;case 'boost':profile.useDropCharges=!profile.useDropCharges;saveProfile();break;case 'loot':showLoot(id,mode);return;case 'copy':{const a=menuTab==='fusions'?fusionDraft:deckDraft,delta=Number(d.delta);if(delta<0){const index=a.indexOf(id);if(index>=0)a.splice(index,1);}else if(a.length<(menuTab==='fusions'?15:40)&&countCard(a,id)<Math.min(3,profile.inventory[id]||0))a.push(id);break;}case 'save-deck':if(menuTab==='fusions'?setFusionDeck(fusionDraft):setActiveDeck(deckDraft))toast('Deck gespeichert.');break;case 'discard':deckDraft=[...profile.activeDeck];fusionDraft=[...profile.fusionDeck];break;case 'proposal':showEquipmentProposal();return;case 'favorite':profile.favorites=profile.favorites.includes(id)?profile.favorites.filter(x=>x!==id):[...profile.favorites,id];saveProfile();break;case 'seen':profile.unseen=profile.unseen.filter(x=>x!==id);saveProfile();break;case 'craft':if(craftCard(id))toast('Ein Exemplar hergestellt.');break;case 'enhance':showCopyAscension(id);return;case 'sell':showSell(id);return;case 'refund':showRefund(id);return;case 'salvage':showSalvage(id);return;case 'slot':stopTraining(false);selectDeckSlot(id);deckDraft=[...profile.activeDeck];fusionDraft=[...profile.fusionDeck];break;case 'copy-slot':syncSlot();profile.slots[id]={name:'Deck '+(id+1),main:[...profile.activeDeck],fusion:[...profile.fusionDeck]};saveProfile();break;case 'pack':if(openCharacterPack(id,mode))showPack();return;case 'resume-pack':showPack();return;case 'upgrade':buyUpgrade(d.key);break;case 'hint':{const hint=buyHint();if(hint)toast(hint);break;}case 'challenge':{const c=CHALLENGES.find(c=>c.id===d.challenge);if(c&&challengeEligible(c.id))startDuel('pve',c.opponent,'challenge','easy',c.id);return;}case 'pvp':startDuel('pvp');return;case 'save':manualSave();return;case 'export':exportProfile();return;case 'import':stopTraining();$('importFile').value='';$('importFile').click();return;case 'speed':toggleSpeed();return;case 'sound':toggleSound();return;}renderMenu();}
function showSalvage(id){openModal(modalHtml('KARTE ZERLEGEN',CARDS[id].name,'↶','Diese Karte wird dauerhaft aus deiner Sammlung entfernt. Überlege dir gut, ob du sie vielleicht für einen späteren Deckbau brauchst.',`<p>Ertrag: ${CARDS[id].fusionOnly?4:2} Splitter. Verstärkung der Art bleibt erhalten.</p>`,'<button class="btn" id="salvageCancel">ABBRECHEN</button><button class="btn" id="salvageConfirm">1 EXEMPLAR ZERLEGEN</button>'));$('salvageCancel').onclick=hideModal;$('salvageConfirm').onclick=()=>{const confirm=$('salvageConfirm');if(confirm.disabled)return;confirm.disabled=true;if(salvageCard(id)){hideModal();renderMenu();}else confirm.disabled=false;};}
function showPack(){const p=profile.openPack;if(!p)return;const cost=p.taken.length?packPrice(p.source,p.difficulty,p.taken.length):0;openModal(modalHtml('CHARAKTERPACK',OPPONENTS[p.source].name,'✦',`Wähle jetzt eine Karte aus drei unterschiedlichen Angeboten. Die erste ist kostenlos; weitere kosten Essenz. In diesem Pack liegt höchstens eine seltene Gestalt; die Chance dafür beträgt ${Math.round(characterPackRareChance(p.source,p.difficulty)*100)} %. Deine Entscheidung ist verbindlich.`,`<div class="pack-grid">${p.cards.map((id,i)=>`<article>${fullCardHtml(profileCard(CARDS[id]),`data-pack-pick="${i}" title="Karte durch Klick auswählen" ${p.taken.includes(i)||profile.coins<cost?'disabled':''}`)}<p>Besitz ${profile.inventory[id]||0} · Verkauf: ${sellPrice(id)} Essenz</p><button class="btn" data-pack-pick="${i}" ${p.taken.includes(i)||profile.coins<cost?'disabled':''}>${p.taken.includes(i)?'Übernommen':cost?`Übernehmen · ${cost} ✦`:'Kostenlos wählen'}</button></article>`).join('')}</div>`,`<button class="btn primary" id="packFinish" ${!p.taken.length?'disabled':''}>${p.taken.length<3?'REST VERWERFEN & ABSCHLIESSEN':'ABSCHLIESSEN'}</button>`));$('modal').classList.add('pool-modal');document.querySelectorAll('[data-pack-pick]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.packPick),price=profile.openPack?.taken.length?packPrice(profile.openPack.source,profile.openPack.difficulty,profile.openPack.taken.length):0;if(b.disabled)return;if(price){openModal(modalHtml('KARTE ÜBERNEHMEN',CARDS[profile.openPack.cards[i]].name,'✦','Diese zusätzliche Karte kostet '+fmt(price)+' Essenz. Möchtest du sie übernehmen?','','<button class="btn" id="packCancel">Zurück</button><button class="btn primary" id="packConfirm">Kaufen</button>'));$('packCancel').onclick=showPack;$('packConfirm').onclick=()=>{const confirm=$('packConfirm');if(confirm.disabled)return;confirm.disabled=true;if(takePackCard(i))renderHud();showPack();};return;}if(takePackCard(i)){renderHud();showPack();}});$('packFinish').onclick=()=>{if(closeCharacterPack()){hideModal();renderMenu();}};}
function showLoot(id,difficulty='easy'){
 const normal=lootWeights(id,difficulty);
 const panel='<div class="pool-grid">'+normal.map(r=>{
  const chance=(r.weight*.4).toFixed(2).replace('.',',');
  return '<article>'+fullCardHtml({id:r.id})+'<p><strong>'+chance+' %</strong> Chance pro manuellem Sieg (ungefähr)</p></article>';
 }).join('')+'</div>';
 openModal(modalHtml('DROPCHANCEN',OPPONENTS[id].name+' · '+difficulty,'✦',
  'Hier siehst du die ungefähre Chance pro manuellem Sieg. Mehr Seltenheitsbonus erhöht die Chance auf seltene Karten.',
  panel,'<button class="btn primary" id="modalGo">ZURÜCK</button>'));
 $('modal').classList.add('pool-modal');$('modalGo').onclick=hideModal;
}
function previousChooseFusionModal(levels,materials,callback,extra=''){const options=fusionOptions(game,levels).filter(c=>game.pending||canCompleteHandFusion(game,levels,c.id)).sort((a,b)=>b.level-a.level||b.atk-a.atk||a.name.localeCompare(b.name));if(!options.length){toast('Keine passende Fusionskarte verfügbar.');return;}const p=self();openModal(modalHtml('FUSIONSKOPIE WÄHLEN','Welche Vorlage setzt du ein?','✧','Wähle die passende Fusionskarte. Die Werte werden anschließend gewürfelt.',`<p>${extra}</p><div class="pool-grid">${options.map(c=>{const factor=enhancementFactor(p.enhancements[c.id]||0)*p.power,atk=Math.ceil(Math.max(...materials.map(m=>dataOf(m).atk))*.95/10)*10,def=Math.ceil(Math.max(...materials.map(m=>dataOf(m).def))*.95/10)*10;return `<article>${fullCardHtml({id:c.id})}<p>${countCard(p.remainingFusion,c.id)} Kopie(n) übrig<br>ATK ${Math.max(atk,round10((c.atk*factor+(p.flatBonus||0))*.94))}–${Math.max(atk,round10((c.atk*factor+(p.flatBonus||0))*1.06))}<br>DEF ${Math.max(def,round10((c.def*factor+(p.flatBonus||0))*.94))}–${Math.max(def,round10((c.def*factor+(p.flatBonus||0))*1.06))}</p><button class="btn" data-fusion-choice="${c.id}">Diese Fusionskarte verwenden</button></article>`;}).join('')}</div>`,'<button class="btn" id="fusionCancel">ZURÜCK</button>'));$('modal').classList.add('pool-modal');$('fusionCancel').onclick=hideModal;document.querySelectorAll('[data-fusion-choice]').forEach(b=>b.onclick=()=>{hideModal();callback(Number(b.dataset.fusionChoice));});}
async function prepareFusion(choice){if(!inputAllowed())return;if(game.summoned){toast('Du hast in diesem Zug bereits beschworen.');return;}if(game.pending){toast('Platziere zuerst die bereits vorbereitete Karte auf deinem Feld.');return;}if(game.materials.length<2){toast('Markiere mindestens zwei Handkarten per Rechtsklick oder Touch-Fusion.');return;}if(game.mode==='pve'&&choice===undefined){const uids=[...game.materials],materials=uids.slice(-2).map(uid=>self().hand.find(c=>c.uid===uid));if(materials.length!==2||materials.some(c=>!c)){toast('Die gewählten Fusionsmaterialien befinden sich nicht mehr auf deiner Hand.');return;}chooseFusionModal(materials.map(c=>dataOf(c).level),materials,id=>prepareFusion(id),'Volles Feld: Für die Weiterfusion ist eine zweite Fusionskarte nötig.');return;}if(!prepareHandFusion(game,[...game.materials],choice)){const levels=game.materials.slice(-2).map(uid=>self().hand.find(c=>c.uid===uid)).filter(Boolean).map(c=>dataOf(c).level);toast(fusionFailureReason(game,levels));return;}if(game.mode==='pve'){render();return;}busy=true;render();await fusionAnimation(dataOf(game.pending.card).level);busy=false;render();}
async function onOwnSlot(idx,choice){if(!inputAllowed())return;if(game.pending){const wasRevealed=Boolean(game.pending.revealed);const old=self().field[idx];if(game.mode==='pve'&&old&&choice===undefined){chooseFusionModal([...game.pending.levels,dataOf(old).level],[game.pending.card,old],id=>onOwnSlot(idx,id),'Diese Feldfusion bleibt automatisch in Zone '+(idx+1)+'. '+(game.pending.kind==='fusion'?'Die Kopie der Handfusion ist bereits verbraucht.':'Die Handkarte und das Feldmonster werden auf den Friedhof gelegt.'));return;}const result=placePending(game,idx,choice);if(!result){toast('In dieser Zone ist keine gültige Beschwörung möglich.');return;}game.cinemaActive=Boolean(result.fused||(game.mode==='pve'&&result.card?.fusion&&!wasRevealed));busy=true;render();try{if(game.cinemaActive)await fusionAnimation(dataOf(result.card).level,null,result.fused?'field':'full');}finally{game.cinemaActive=false;busy=false;game.lastSummoned=null;render();}}else if(self().field[idx]){game.materials=[];game.selection={type:'field',idx};render();}else toast('Zuerst eine Handaktion bestätigen.');}
function prepareSummon(){if(!inputAllowed()||game.selection?.type!=='hand')return;const c=self().hand.find(c=>c.uid===game.selection.uid);if(game.mode==='pve'&&self().field.every(Boolean)&&!self().field.some(old=>fusionOptions(game,[dataOf(c).level,dataOf(old).level]).length)){toast('Keine passende Fusionskarte für das volle Feld verfügbar. Du kannst angreifen oder den Zug beenden.');return;}if(prepareNormal(game,c.uid))render();}
function showDeck(){if(!game)return;const p=game.players[game.mode==='pve'?0:game.active];openModal(modalHtml('DECKÜBERSICHT','Karten & Fusionsvorrat','▤','Fusionskopien regenerieren erst für das nächste Duell.',`<details open><summary>Hauptdeck · ursprüngliche 40 Karten</summary>${[...new Set(p.originalDeck)].map(id=>`<p>${CARDS[id].name} ×${countCard(p.originalDeck,id)}</p>`).join('')}</details>${game.mode==='pve'?`<h3>Verbleibende Fusionen</h3>${[...new Set(p.fusionDeck)].map(id=>`<p>${CARDS[id].name}: <b>${countCard(p.remainingFusion,id)} verfügbar</b> / ${countCard(p.fusionDeck,id)} ursprünglich</p>`).join('')}`:''}`,'<button class="btn" id="modalGo">ZURÜCK</button>'));$('modalGo').onclick=hideModal;}
function showRules(){openModal(modalHtml('ALPHA 2.2 DEV','Regeln & Fortschritt','⚔','Turnier I–III: 4.000 LP · IV–VI: 6.000 · VII–VIII: 7.000 · IX–X: 10.000 · Hard/PvP: 8.000 · 40 Hauptkarten',`<p><b>Kartenrahmen:</b> Deine ursprünglichen Startmonster tragen Silberweiß. Fusionen erkennst du am bläulich-violetten Rahmen. Andere Monster wechseln je nach Level die Farbe – Level 12 ist rot. Die Textfelder bleiben bewusst kontrastreich.</p><ol class="rulelist"><li>Zu Beginn jedes eigenen Zuges ziehst du auf fünf Handkarten auf. Hast du dann schon keine Karte mehr im Deck, verlierst du. Du darfst pro Zug eine Karte beschwören oder fusionieren. Jedes Monster darf einmal angreifen und einmal seine Position wechseln. Neue Monster liegen immer im Angriff.</li><li>Handaktion zuerst, dann Zielzone. Markiere per Rechtsklick oder Touch-Modus Materialien; nur die letzten zwei fusionieren, frühere werden abgeworfen. Bei vollem Feld ist eine Handfusion nur möglich, wenn danach noch eine passende Kopie für die Feldfusion bleibt.</li><li>RPG: Jede Fusionskopie ist einmal pro Duell nutzbar. Wähle selbst unter den verfügbaren Vorlagen bis Materialsumme, höchstem ursprünglichen Material +2, maximal Lv 12. Hand- und anschließende Feldfusion verbrauchen zwei Kopien. Feldfusion bleibt auf dem ursprünglichen Feld. Bereits verbrauchte Angriffe bleiben verbraucht.</li><li>Fusionen starten beim mittleren normalen ATK-/DEF-Potenzial ihrer Zielstufe. Pro Wurf sind 88–112 % dieses Grundpotenzials möglich. Es gibt keine garantierte Übernahme von 95 % des besten Materials; Pokerkombinationen ermöglichen zusätzliche Wertewürfe, bis zu sieben insgesamt.</li><li>Individuelle Kreaturen-Matchupboni sind deaktiviert. Spezialisierungen entstehen durch die übergreifenden Predator-, Wächter- und Seelenzehrer-Regeln sowie gezielte Materialfusionen. Schild maximal 600; Arena-Zerfall ignoriert ihn.</li><li>ATK/ATK zerstört das schwächere Monster, Differenz als LP-Schaden. Gleichstand zerstört beide. Gegen DEF zerstört höhere ATK ohne normalen LP-Schaden; niedrigere ATK schädigt den Angreifer. Direkt nur bei leerem Gegnerfeld. Keine Angriffe im ersten Spielerzug.</li><li>Kreaturenzerfall am Ende des eigenen Zuges: Startkarten beginnen bei −20, normale Monster bei −30 und Fusionen bei −25 ATK/DEF. Jede überlebte Zerfallsrunde reduziert den nächsten Abzug um 5; Untergrenze: −10 für Startkarten, −20 für normale Monster und −15 für Fusionen. Zusätzlich verliert ein überlebender Angreifer nach jedem Angriff 30 ATK. Frisch beschworene Monster haben einen zerfallsfreien Zug. Bereits verbrauchte Angriffe bleiben verbraucht.</li><li>Materialbonus: gewöhnliches Material liefert je Aufstiegsrang 20 Punkte, fusioniertes Material je Monsterlevel 10 Punkte; jeder Block geht zufällig auf ATK oder DEF. Frühere Materialboni werden nicht erneut vererbt.</li><li>Die Spieler wechseln nach jedem Zug. Ab Runde 10 eskaliert gemeinsamer Arenaschaden, Ende spätestens Runde 15. Bei gemeinsamem Tod zählt der vorherige LP-Vorsprung, sonst die sichtbar ausgeloste Entscheidungsinitiative.</li><li>Turnier-Freimodus-Hard nach zehn manuellen Easy-Siegen; Hard-Rezepte nach dem ersten manuellen Hard-Sieg, Hard-Automatik nach drei manuellen Hard-Siegen. Easy-Automatik nach drei Siegen. Auto: 30 % Essenz/XP, 1 Splitter; geboostet: 50 %, 2 Splitter; manuell: 100 %, 3 Splitter.</li><li>Wiederholte Kämpfe unterliegen ab Level 6/11/16 usw. je nach höchstem besiegten Turniergegner einem XP-Softcap: zunächst 25 %, später mindestens 10 %. Bereits besiegte niedrigere Gegner bleiben bei ihrer eigenen Grenze. Erste Turniersiege sind ausgenommen. Ein abgeschlossenes manuelles Einzelspielerduell gibt eine Dropladung (Kapazität 5–8 nach Spielerstufe). Aktiver Bonus kostet eine Ladung je abgeschlossenem Autokampf, auch bei Niederlage. Automatikenergie regeneriert 1/Minute bis 30, Serien maximal zehn Kämpfe.</li><li>Pack-Fortschritt pro Sieg: 20/6/10 % für manuell/Auto/Boost. Packs: drei unterschiedliche Angebote, eines gratis; weitere kosten Essenz. Seltene Fusionskarten sind im Charakter-Boosterpack seltener als bei normalen Kartenfunden; höchstens eine seltene Vorlage erscheint je Pack. Keine Garantie auf neue Karten.</li><li>Herstellung: 30 gemeinsame Splitter plus Essenz. Kopienaufstiege: Startkarten +10, gewöhnliche Hauptkarten +30, Fusionen +20 ATK/DEF pro Rang, maximal fünf. Seltene Fusionen kosten 1/3/4/5/5 zusätzliche Kopien, gewöhnliche Karten 3/5/7/9/11. Verkauf: 3 Essenz je Hauptkarte, 8 je Fusion. Mindestens ein Exemplar, Deckkopien und Favoriten bleiben geschützt.</li><li><b>Schicksalszug:</b> Ab Runde 3 kann ein bedrängter Duellant zu Beginn seines Zuges mit 1–5 % Wahrscheinlichkeit fünf zufällige Schicksalsmonster erhalten. Bedrängnis berücksichtigt LP, Feldunterlegenheit und drohende Niederlage. Die bisherige Hand wird ins Deck gemischt; die neuen Karten übertreffen das stärkste gegnerische Monster aus Deck, Feld oder Friedhof um je 100 ATK und DEF. Sie sind unverschmelzbar, verschwinden nach dem Duell und können pro Duellant nur einmal erscheinen. Die Regel gilt für Spieler und KI im Einzelspielerduell.</li><li>Lokales PvP bleibt klassisch: neutrale Karten, Lv 8, DEF max. 1.000, unbeschränkte Fusionsvorlagen, keine RPG-Belohnungen.</li></ol>`,'<button class="btn" id="modalGo">VERSTANDEN</button>'));$('modalGo').onclick=hideModal;}

$('manualSaveBtn').onclick=manualSave;hideModal();renderMenu();saveProfile();

let enemyPreviewIndex=null;
function renderCardPreview(){if(!game)return;if(game.cinemaActive){$('largeCardPreview').innerHTML='<div class="arcane-fusion-concealed"><span>✧ FUSIONSRITUAL ✧</span><strong>Die Werte werden gerade enthüllt</strong><p>ATK und DEF erscheinen hier erst nach Abschluss der Animation.</p></div>';return;}if(game.pending?.kind==='fusion'){$('largeCardPreview').innerHTML='<div class="arcane-fusion-concealed"><span>✧ FUSION IM ENTSTEHEN ✧</span><strong>'+escapeHtml(dataOf(game.pending.card).name)+'</strong><p>Die endgültigen Werte erscheinen erst nach der Platzierung auf dem Feld.</p></div>';return;}const p=game.players[game.mode==='pve'?0:game.active],s=game.selection;const selectedMaterial=game.materials.length?p.hand.find(c=>c.uid===game.materials[game.materials.length-1]):null;const foe=game.players[1-p.id],viewedEnemy=enemyPreviewIndex!==null?foe.field[enemyPreviewIndex]:null;const c=game.pending?.card||(s?.type==='hand'?p.hand.find(c=>c.uid===s.uid):s?.type==='field'?p.field[s.idx]:null)||selectedMaterial||viewedEnemy;$('largeCardPreview').innerHTML=c?fullCardHtml(c)+'<p>'+escapeHtml(dataOf(c).desc)+'</p>'+decayDescription(c):'<p>Wähle eine Hand- oder Feldkarte, um sie hier groß zu sehen.</p>';}
function askSurrender(){if(!inputAllowed())return;openModal(modalHtml('AUFGEBEN','Dieses Duell aufgeben?','⚑','Das Duell zählt als Niederlage. Aufgeben gibt keine Essenz, XP, Splitter, Dropladung oder Pack-Fortschritt. Deine Karten bleiben erhalten.','','<button class="btn" id="surrenderCancel">WEITERSPIELEN</button><button class="btn primary" id="surrenderConfirm">AUFGEBEN</button>'));$('surrenderCancel').onclick=hideModal;$('surrenderConfirm').onclick=()=>{game.surrendered=true;conclude(game,game.mode==='pve'?1:1-game.active,'Duell aufgegeben.');hideModal();showFinished();};}
$('surrenderBtn').onclick=askSurrender;
document.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target?.closest?.('input,textarea,select,[contenteditable]')||!inputAllowed())return;const key=e.key.toLowerCase();if(['f','d',' ','e','escape','1','2','3','4','5'].includes(key))e.preventDefault();if(key==='f')prepareFusion();else if(key==='d'&&game.selection?.type==='field'&&!enemy().field.some(Boolean))performAttack(game.selection.idx,null);else if(key===' '||key==='e')endTurn();else if(key==='escape')clearSelection();else if(/^[1-5]$/.test(key)){const c=self().hand[Number(key)-1];if(c)e.shiftKey?markMaterial(c.uid):onHand(c.uid);}});

function trainingPanel(){const stage=trainingStage(),o=TRAINING_STAGES[stage],complete=profile.trainingWins===3;return `<section class="menu-panel opponent-card"><div class="side-kicker">TRAININGSREIHE · ${Math.min(3,profile.trainingWins+1)}/3</div><h2>${o.name}</h2><p>${o.desc}</p><p>${complete?'Du kannst Taro weiterhin herausfordern, Moos-Splitter sammeln und neue Karten ausprobieren.':`Einmalig beim nächsten Sieg zusätzlich: <b>${o.coins} Essenz · ${o.shards} Moos-Splitter</b>. ${stage===2?'Dazu garantiert Morgenflügel · Lv 5 (eine Fusionskopie).':'Danach ersetzt die nächste, nur leicht stärkere Prüfung diesen Gegner.'}`}</p><p>Normaler Sieg: ${Math.floor(18*(1+.05*profile.upgrades.loot))} Essenz · ${Math.floor(12*(1+.1*profile.upgrades.learning))} XP · 3 Moos-Splitter.<br>Kartenchance: manuell 40 %, Auto 12 %, geboostet 20 %. Pack-Fortschritt: 20/6/10 %.</p><progress max="1000" value="${profile.packProgress[0]}"></progress><small>Moos-Pack: ${profile.packProgress[0]/10} %</small>${menuButton('Trainingsduell','fight','data-id="0" data-context="free"')}${menuButton('Beutepool ansehen','loot','data-id="0"')}${complete?menuButton('Hard-Training','difficulty','data-id="0" data-mode="hard"',!hardUnlocked(0))+'<small>Hard-Training nach dem ersten Turniersieg und zehn manuellen Trainingssiegen. Hard-Rezepte erst nach einem manuellen Hard-Sieg.</small>':''}${complete?menuButton('Autokampf · 1 Ladung','auto','data-id="0"',!autoUnlocked(0)||!profile.auto.energy||!!training)+menuButton('Serie · max. 10 Kämpfe','series','data-id="0"',!autoUnlocked(0)||!profile.auto.energy||!!training):'<p>Automatik nach Abschluss der Trainingsreihe. Das Turnier kannst du jederzeit versuchen.</p>'}</section>`;}
function opponentPanel(o,tournament){return o.id===0&&!tournament&&difficultySelection[0]!=='hard'?trainingPanel():regularOpponentPanel(o,tournament);}
function cardEditor(c,fusion){const draft=fusion?fusionDraft:deckDraft,n=countCard(draft,c.id),owned=profile.inventory[c.id]||0,key=fusion?'fusions':'collection',selected=editorPreviewIds[key]===c.id;return `<article class="collection-item ${n?'chosen':''} ${selected?'preview-selected':''}">${fullCardHtml(profileCard(c),`data-preview-card="${c.id}" data-preview-kind="${key}" title="${escapeHtml(c.name)} anzeigen"`,fusion?'fusion-deck-pick-card':'')}<div class="collection-actions"><b>${profile.unseen.includes(c.id)?'✦ NEU · ':''}Besitz ${owned} · Im Deck ${n}/3</b><small>${c.ace?'✦ ACE-Monster':c.fusionOnly&&c.rarity==='rare'?'Seltene Fusion':c.fusionOnly?'Fusion':'Gewöhnliche Karte'}</small><span>Stufe ${c.level} · ${displayElement(c.element)}</span></div></article>`;}
function showCopyAscension(id){const cost=enhanceCost(id);if(!cost.copies)return;openModal(modalHtml('KOPIENAUFSTIEG',CARDS[id].name,'✧',`${cost.copies} zusätzliche Kopie(n) werden dauerhaft verbraucht. Alle eigenen Exemplare dieser Kartenart erhalten +${ascensionStep(id)} ATK und +${ascensionStep(id)} DEF. Danach besitzt du noch ${(profile.inventory[id]||0)-cost.copies} Exemplar(e).`, `<p>Aufstieg ${(profile.enhancements[id]||0)+1}/5 · Kein Essenz- oder Splitterpreis. Geschützte und in Decks benötigte Kopien bleiben erhalten. Laufende Duelle behalten ihre Werte.</p>`,'<button class="btn" id="ascendCancel">ABBRECHEN</button><button class="btn primary" id="ascendConfirm">KOPIEN VERBRAUCHEN</button>'));$('ascendCancel').onclick=hideModal;$('ascendConfirm').onclick=()=>{const confirm=$('ascendConfirm');if(confirm.disabled)return;confirm.disabled=true;if(enhanceCard(id)){hideModal();renderMenu();toast('Aufstieg: +'+ascensionStep(id)+' ATK und DEF für diese Kartenart.');}else confirm.disabled=false;};}
function showSell(id){openModal(modalHtml('KOPIE VERKAUFEN',CARDS[id].name,'✦','Eine freie Kopie wird dauerhaft verkauft.',`<p>Du erhältst ${sellPrice(id)} Essenz. Aufstiege bleiben für die Kartenart erhalten.</p>`,'<button class="btn" id="sellCancel">ABBRECHEN</button><button class="btn primary" id="sellConfirm">1 KOPIE VERKAUFEN</button>'));$('sellCancel').onclick=hideModal;$('sellConfirm').onclick=()=>{const confirm=$('sellConfirm');if(confirm.disabled)return;confirm.disabled=true;if(sellCard(id)){hideModal();renderMenu();}else confirm.disabled=false;};}
function fusionPreview16(g,c,materials,levels=materials.map(m=>dataOf(m).level)){const p=g.players[g.active],range=stat=>{const floor=Math.ceil(Math.max(...materials.map(m=>dataOf(m)[stat]))*.95/10)*10;return [Math.max(floor,round10(baseStat(c,stat,p)*.94)),Math.max(floor,round10(baseStat(c,stat,p)*1.06))];};return {atk:range('atk'),def:range('def'),remaining:countCard(p.remainingFusion,c.id)-1,attackSpent:materials.some(m=>m.attacked),rolls:Math.min(4,qualityRolls(levels)+materials.filter(m=>dataOf(m).ability==='guide').length+(g.active===0&&!g.totalFusions[0]?(profile.upgrades.fusionLore||0):0))};}

/* Fusionsdiagnose ohne Seiteneffekte: keine Karte und kein Spielstand wird verändert. */
function fusionFailureReason(g,levels){
 if(!g)return 'Starte zuerst ein Duell.';
 const p=g.players[g.active],available=[...new Set(p.remainingFusion||p.fusionDeck)].map(id=>CARDS[id]).filter(Boolean);
 if(!available.length)return 'Dein Fusionsdeck hat in diesem Duell keine nutzbaren Karten mehr. Im nächsten Duell stehen die ausgerüsteten Fusionskarten wieder bereit.';
 const limit=fusionBudget(levels,g);
 if(!available.some(c=>c.level<=limit))return `Keine nutzbare Fusionsvorlage: Diese Materialien erlauben maximal Level ${limit}. Wähle andere Materialien oder eine niedrigere Vorlage.`;
 if(!g.pending&&p.field.every(Boolean))return 'Dein Feld ist voll. Für eine Handfusion muss danach noch eine gültige Feldfusion möglich sein.';
 return 'Keine passende Fusionskarte für diese Materialkombination verfügbar. Prüfe deine Vorlagen unter „Deck ansehen“.';
}
function fusionZoneHint(g,pending,old){
 const levels=[...pending.levels,dataOf(old).level],options=fusionOptions(g,levels);
 return options.length?`<span class="zone-fusion">✧ bis Lv ${Math.max(...options.map(c=>c.level))} · ${qualityRolls(levels)} Wertewurf/-würfe${old.attacked?' · Angriff verbraucht':''}</span>`:'<span class="zone-fusion">✕ Keine passende Fusionskarte</span>';
}
function chooseFusionModal(levels,materials,callback,extra=''){
 const options=fusionOptions(game,levels).filter(c=>game.pending||canCompleteHandFusion(game,levels,c.id));
 if(!options.length){toast(fusionFailureReason(game,levels));return;}
 openModal(modalHtml('FUSIONSKARTE WÄHLEN','Die Gestalt erwacht erst nach der Beschwörung','✧',
  'Wähle deine <b>Fusionskarte</b>. Ihre tatsächlichen ATK- und DEF-Werte bleiben bis zur Beschwörung verborgen.',
  '<p><b>Materialien:</b> '+materials.map(m=>escapeHtml(dataOf(m).name)).join(' + ')+'</p><p>'+extra+'</p>'+
  '<div class="pool-grid fusion-choice-grid">'+options.map(c=>
   '<article class="fusion-offer fusion-mystery"><div class="fusion-sigil">✦</div><h3>'+escapeHtml(c.name)+'</h3>'+
   '<p>Stufe '+c.level+' · '+escapeHtml(displayElement(c.element))+'</p>'+
   '<p>Der Ausgang der Fusion ist noch ungewiss.</p><p>Verfügbare Exemplare: '+countCard(game.players[game.active].remainingFusion,c.id)+'</p>'+
   '<button class="btn primary" data-fusion-choice="'+c.id+'">Diese Karte wählen</button></article>').join('')+'</div>',
  '<button class="btn" id="fusionCancel">ZURÜCK</button>'));
 $('modal').classList.add('pool-modal','fusion-choice-modal');
 $('fusionCancel').onclick=hideModal;
 let chosen=false;
 document.querySelectorAll('[data-fusion-choice]').forEach(b=>b.onclick=()=>{if(chosen)return;chosen=true;hideModal();callback(Number(b.dataset.fusionChoice));});
}
function decayDescription(c){if(!game||game.mode!=='pve'||!c.decayClass)return '';const base=c.decayClass==='starter'?20:c.fusion?25:30,min=c.decayClass==='starter'?10:c.fusion?15:20,rate=Math.max(min,base-5*(c.decayAge||0)-(game.active===0?(profile.upgrades.resilience||0)*3:0));return `<p><b>${c.decayClass==='starter'?'Startkarte':c.fusion?'Fusion':'Normales Monster'}</b> · Nächster Zerfall −${rate} ATK/DEF (bis mindestens −${min}); Angriff: zusätzlich −30 ATK.<br>${c.summonedTurn===game.turn?'Frisch beschworen: in diesem Zug kein Zerfall.':'Bisher verloren: −'+(c.decayTotal||0)+' ATK/DEF durch Zerfall.'}${c.attackFatigue?' · −'+c.attackFatigue+' ATK durch Angriffe.':''}</p>`;}
function fusionPreview(g,c,materials,levels=materials.map(m=>dataOf(m).level)){const p=g.players[g.active],bonus=materialBlocks(g,materials).reduce((a,b)=>a+b,0),range=stat=>{const floor=Math.ceil(Math.max(...materials.map(m=>materialBase(m,stat)))*.95/10)*10;return [Math.max(0,Math.max(floor,round10(baseStat(c,stat,p)*.94))-fusionPenalty(g)),Math.max(0,Math.max(floor,round10(baseStat(c,stat,p)*1.06))+bonus-fusionPenalty(g))];};return {atk:range('atk'),def:range('def'),bonus,remaining:countCard(p.remainingFusion,c.id)-1,attackSpent:materials.some(m=>m.attacked),rolls:Math.min(4,qualityRolls(levels)+materials.filter(m=>dataOf(m).ability==='guide').length)};}
function xpHelpText(){return `<p><b>Dein Spielerlevel und dein Turnierfortschritt haben verschiedene Aufgaben.</b> XP bringt Levelaufstiege. Besiegte Turniergegner bestimmen, wie stark deine Levelbelohnungen sein dürfen.</p><p>Beispiel: Erreichst du Level 20 nach zwei Turniersiegen, stammen deine drei Kartenangebote aus Stufe 2 – auch wenn dein Spielerlevel hoch ist. Willst du stärkere Angebote, musst du vor dem Levelaufstieg weiter im Turnier kommen.</p><p>Die Belohnung erscheint sofort beim Erreichen des Levels. Die Zehnkarten-Meilensteinbooster werden sofort geöffnet und alle Karten deiner Sammlung gutgeschrieben. Bei Level 20 und 40 musst du eine der drei unterschiedlichen Gestalten wählen, bevor du weiterspielst. Du kannst nichts für einen späteren stärkeren Pool aufsparen. Neuladen erhält genau dieselben Angebote.</p><p>Level 10, 25 und 50 erhöhen die maximale Zahl deiner Dropladungen um eins (5 → 8), ohne den Vorrat aufzufüllen. Das sind nicht die Automatikladungen.</p><p>Seltenheitsbonus: Level 2 ×1,05, Level 3 zusätzlich ×1,03, Level 4 ×1,015, danach jedes Level ×1,005. Aktuell: <b>+${((rarityMultiplier()-1)*100).toFixed(2)} % relativ</b>. Aus 1 % würden ${(rarityMultiplier()).toFixed(3)} %. Er wirkt auf seltene Beute innerhalb eines Kartendrops und auf Charakter-Boosterpacks, nicht auf gekaufte Booster. Spielerlevel derzeit maximal 100.</p>`;}
function showXPHelp(){openModal(modalHtml('FORTSCHRITT EINFACH ERKLÄRT','Wie funktionieren Levelbelohnungen?','?', '',xpHelpText(),'<button class="btn primary" id="xpHelpClose">VERSTANDEN</button>'));$('xpHelpClose').onclick=()=>profile.rewardQueue.length?showMilestone():hideModal();}
function showMilestone(){const r=profile.rewardQueue[0];if(!r)return;const extra=r.kind==='currency'?`<p>Bereits erhalten: ${r.coins} Essenz und ${r.shards} Splitter.</p>`:`<div class="pool-grid">${r.cards.map((id,i)=>`<article>${fullCardHtml(profileCard(CARDS[id]))}${r.kind==='choice'?`<button class="btn primary" id="milestonePick${i}">Diese Fusion wählen</button>`:''}</article>`).join('')}</div>`;openModal(modalHtml('LEVEL '+r.level+' ERREICHT','Deine Meilensteinbelohnung','✦',`Belohnungsstufe ${r.tier}: ${OPPONENTS[r.tier].name}. Aktueller Seltenheitsbonus: +${((rarityMultiplier()-1)*100).toFixed(2)} % relativ. ${r.kind==='choice'?'Wähle eine Fusionskarte für deine Sammlung. Dein Hauptdeck bleibt unverändert.':r.kind==='booster'?'Alle zehn Karten wurden deiner Sammlung hinzugefügt.':''} ${[10,25,50].includes(r.level)?'Dropladungskapazität erhöht!':''}`,extra,'<button class="btn" id="milestoneHelp">? Warum diese Belohnung?</button>'+(r.kind==='choice'?'':'<button class="btn primary" id="milestoneDone">WEITER</button>')));$('modal').classList.add('pool-modal');$('milestoneHelp').onclick=showXPHelp;const finish=id=>{if(!finishMilestone(id))return;if(profile.rewardQueue.length)showMilestone();else{hideModal();if(game?.winner!==null&&game)returnToMenu();else if(uiMode==='menu')renderMenu();}};if(r.kind==='choice')r.cards.forEach((id,i)=>$('milestonePick'+i).onclick=()=>finish(id));else $('milestoneDone').onclick=()=>finish();}
function showFinished(){showFinished16();if(game?.showcase&&!$('modal')?.querySelector('.vael-afterword')){$('modal').insertAdjacentHTML('beforeend','<p class="vael-afterword"><b>Vael · Der Hochmütige:</b> „Komm zurück, wenn du bereit bist. Werde nicht übermütig. Du bist noch ein blutiger Anfänger, und deine ersten Siege waren nichts als Glück.“</p>');$('modalAgain').disabled=true;$('modalAgain').textContent='Einmalige Begegnung';if(game.showcaseFirst){const modal=$('modal');if(modal&&!modal.textContent.includes('Charakter-Boosterpack'))modal.insertAdjacentHTML('beforeend','<p class="loot-banner">Erster Sieg gegen Vael: +1 Charakter-Boosterpack (Stufe VIII) im Packmenü!</p>');}}if(game?.encounter){$('modalAgain').disabled=true;$('modalAgain').textContent='Begegnung abgeschlossen';}if(game?.mode==='pve'&&game.opponentId===0){$('modalAgain').disabled=true;$('modalAgain').textContent='Training: zurück ins Menü';}if(profile.rewardQueue.length){stopTraining(false);showMilestone();}}
function encounterMarkup(){const cards=[...profile.encounters,...(profile.wanderer?[profile.wanderer]:[])];return `<section class="menu-panel"><h2>Einmalige Begegnungen</h2><p>Nach einem abgeschlossenen Turnierduell erscheinen drei Reisende. Sie ersetzen die bisherigen Turnierangebote. Normale manuelle Freikämpfe haben 5 % Chance auf einen zusätzlichen Wanderer. Automatik und Begegnungen erzeugen keine Wanderer. Nur manuell spielbar; ein Versuch, auch bei Niederlage oder Aufgabe.</p><p>Sieg: +25 % Essenz/XP, 5 Splitter, 60 % Kartenchance. Seltene Auswahlchance ×1,25 zusätzlich zum XP-Bonus. Beute bleibt an besiegte Turnierstufen gebunden. Unterbrochene Begegnungen kannst du fortsetzen; Verwerfen verbraucht den Versuch.</p></section><div class="menu-grid">${cards.map(e=>`<section class="menu-panel"><h3>${e.name}</h3><p>${e.kind==='random'?'Zufallsbegegnung':'Turniergast'} · Gegnerstufe ${e.tier}<br>Beute: ${OPPONENTS[e.source].name}</p>${menuButton('Einmalig herausfordern','encounter',`data-enc="${e.id}"`)}</section>`).join('')||'<p>Noch keine Begegnungen verfügbar.</p>'}</div>`;}
function startEncounter(id){if(storageConflict||busy||aiRunning||profile.rewardQueue.length)return;if(profile.activeDuel){toast('Setze zuerst dein gespeichertes Duell fort oder beende es.');return;}const e=[...profile.encounters,...(profile.wanderer?[profile.wanderer]:[])].find(e=>e.id===id);if(!e)return;stopTraining(false);game=createGame({id:newMatchId(),mode:'pve',opponentId:e.source,context:'encounter',encounter:e,enemy:e.enemy,seed:e.seed,deck:profile.activeDeck,fusionDeck:profile.fusionDeck,enhancements:profile.enhancements,flatBonus:monsterTrainingBonus(profile.upgrades.power)});profile.encounters=profile.encounters.filter(x=>x.id!==id);if(profile.wanderer?.id===id)profile.wanderer=null;profile.activeDuel=JSON.parse(JSON.stringify(game));saveProfile();uiMode='duel';materialMode=false;$('menuScreen').hidden=true;$('menuNav').hidden=true;$('duelScreen').hidden=false;for(const id of ['deckBtn','restartBtn','homeBtn'])$(id).hidden=false;hideModal();render();if(game.active===1)runAi();}
function shopMarkup(){const tier=highestCleared();return `<section class="menu-panel"><h2>Booster-Shop</h2><p>Wähle deine Packgröße. Du kannst klein einsteigen oder sparen: Je größer das Pack, desto weniger Essenz zahlst du pro Karte. Im Zehnerbooster haben die letzten beiden Plätze bessere Chancen auf wertvolle Karten. Alle gezogenen Karten gehören dir und Duplikate können für Kartenaufstiege verwendet werden.</p><div class="booster-choices">${[1,3,5,10].map(n=>`<article class="booster-choice"><h3>${n} ${n===1?'Karte':'Karten'}</h3><p><b>${fmt(boosterPrice(tier,n))} Essenz</b><br><small>≈ ${Math.ceil(boosterPrice(tier,n)/n)} Essenz/Karte</small></p>${menuButton(n+' Karten kaufen','booster','data-count="'+n+'"',profile.coins<boosterPrice(tier,n))}</article>`).join('')}</div><p><b>Neu – Update B:</b> 22 normale Familien besitzen je vier Stufen mit demselben Artwork. Diese eigenständigen Karten erscheinen nach freigeschalteten Turnierstufen in Boostern und sind dann auch herstellbar. Fusionen und ACEs bleiben einzigartig.</p><p><b>Ziehchancen:</b> Kleine Packs haben überwiegend Startkarten, aber auch die Chance auf gewöhnliche und seltene Karten. Der Fünferbooster hat einen verbesserten letzten Platz. Beim Zehner sind Platz 9 und 10 deutlich wertvoller.</p><p>Seltenes Material richtet sich nach deiner höchsten besiegten Turnierstufe (${tier}). Gekaufte Booster verwenden nicht den XP-Dropbonus.</p></section>${profile.lastBooster?'<section class="menu-panel"><h3>Zuletzt geöffnet · '+profile.lastBooster.cards.length+' Karten</h3><div class="pool-grid">'+profile.lastBooster.cards.map(id=>fullCardHtml(profileCard(CARDS[id]))).join('')+'</div></section>':''}`;}

function xpMarkup(){const level=playerLevel(profile);return `<section class="menu-panel"><h2>Spielerstufe ${level}</h2>${menuButton('? Levelsystem einfach erklärt','xphelp')}<p>Die nächste Belohnung erscheint automatisch, sobald du ihre Stufe erreichst. Wie stark die Karten darin sind, richtet sich nach deiner <b>höchsten besiegten Turnierstufe ${highestCleared()}</b>. Es ist nicht möglich, Belohnungen für später zurückzuhalten.</p><p><b>Dein Seltenheitsbonus:</b> +${((rarityMultiplier()-1)*100).toFixed(2)} % <em>relativ</em>. Er verbessert die Gewichtung seltener Karten bei Beute und Charakter-Boosterpacks, nicht die Chance auf eine Karte überhaupt. Jede Spielerstufe verändert diesen Bonus ein wenig.</p><div class="table-scroll"><table class="history-table"><thead><tr><th>Stufe</th><th>Deine Belohnung</th><th>Seltenheitsbonus bis dahin*</th><th>Status</th></tr></thead><tbody>${XP_MILESTONES.map(l=>`<tr><td><b>${l}</b></td><td>${[20,40].includes(l)?'Wähle 1 aus 3 unterschiedlichen seltenen Gestalten':[15,30,45].includes(l)?'Essenz + 10 Splitter':[10,25,50].includes(l)?'10 Karten + 1 Platz für Dropladungen':'10 Karten sofort'}</td><td>+${((rarityMultiplier(l)-1)*100).toFixed(2)} % relativ</td><td>${profile.milestones.includes(l)?'✓ Erreicht':'Offen'}</td></tr>`).join('')}</tbody></table></div><p class="pool-note">* Der angegebene Wert ist der gesamte Seltenheitsbonus beim Erreichen der Stufe, nicht der zusätzliche Bonus durch die einzelne Belohnung. Dropladungen sind getrennt von Automatikenergie. Alle Splitter bilden einen gemeinsamen Vorrat. Eine Karte kostet ${SHARD_CRAFT_COST} Splitter plus Essenz.</p></section>`;}

function renderMenu(){renderMenu16();if(menuTab==='free')$('menuContent').innerHTML+=showcasePanel()+encounterMarkup();if(menuTab==='shop')$('menuContent').innerHTML=shopMarkup();if(menuTab==='xp')$('menuContent').innerHTML=xpMarkup();$('menuHero').innerHTML+='<button class="btn tiny" id="alwaysXPHelp" aria-label="Levelbelohnungen erklären">? Level & Belohnungen</button>';$('alwaysXPHelp').onclick=showXPHelp;bindMenu();if($('showcaseOptional'))$('showcaseOptional').onclick=()=>startShowcaseDuel(false);if(profile.rewardQueue.length)showMilestone();else if(profile.openPack)showPack();else if(profile.showcase.pending)showShowcaseIntro();}
function menuAction(d){if(profile.rewardQueue.length){showMilestone();return;}if(d.action==='xphelp'){showXPHelp();return;}if(d.action==='booster'){if(buyBooster(Number(d.count)||10))renderMenu();else toast('Nicht genug Essenz für diesen Booster.');return;}if(d.action==='encounter'){startEncounter(d.enc);return;}menuAction16(d);}
function showIphoneHelp(){openModal(modalHtml('MOBIL SPIELEN','Arcane Duel auf dem iPhone','📱','Spiele möglichst in Safari als Webseite. Die iOS-Dateivorschau führt JavaScript möglicherweise nicht vollständig aus.',`<ol class="rulelist"><li><b>Karten:</b> Tippe eine Handkarte an, dann auf „Beschwören“ und anschließend auf ein eigenes Feld.</li><li><b>Fusion:</b> Aktiviere „Touch-Fusion“, tippe mindestens zwei Handkarten nacheinander an und drücke „Fusionieren“. Wähle die Fusionsvorlage und dann ein eigenes Feld.</li><li><b>Angriff:</b> Tippe auf dein Monster und dann auf das gegnerische Ziel. Bei freiem Gegnerfeld nutze „Direkter Angriff“.</li><li><b>Speichern:</b> Im Menü unter „Spielstand“ regelmäßig als JSON exportieren. Ein HTML-Dateiwechsel oder Browserwechsel kann ein anderes lokales Speichergebiet verwenden.</li><li><b>Zum Home-Bildschirm:</b> Sobald das Spiel unter einer HTTPS-Webadresse in Safari läuft: Teilen → „Zum Home-Bildschirm“.</li></ol>`, '<button class="btn primary" id="iphoneHelpClose">VERSTANDEN</button>'));$('iphoneHelpClose').onclick=hideModal;}
if(profile.rewardQueue.length)showMilestone();
