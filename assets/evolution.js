/* Arcane Duel · Fusion Evolution 2.5: rules, modes and progression.
 * Loaded after game.js and expansion.js. No original card ids or saves are rewritten. */
(function(){
'use strict';
const previous={createGame,rpgEnemyLoadout,chooseAiAction,fusionBudget,prepareHandFusion,fusedInstance,attack,damagePlayer,settleRound,advanceTurn,baseStat,render,renderMenu,renderHud,showRules,showFinished,rewardMatch,validateProfile,freshProfile,validateDuelSnapshot,cardCost,boosterPrice,packPrice,showIphoneHelp,frameClassForCard,prepareFusion,fusionAnimation,showFinished16};
const MODES={defense:{name:'Verteidigung',icon:'🛡',text:'Deine Angriffe verursachen keinen gegnerischen LP-Schaden. Der Gegner verursacht weiterhin normalen Schaden. Überlebe den beschleunigten Zerfall.'},burst:{name:'Burst',icon:'⚡',text:'Kein Arena- oder Monsterzerfall. Erreiche deine Schadensziele vor dem Rundenlimit.'},fusion:{name:'Fusion',icon:'✧',text:'Erfülle Fusionsziele in einem Duell. Nach jedem Ziel darfst du aussteigen oder für zusätzliche Belohnungen weiterspielen.'}};
const evoId=(mode,stage)=>`evo-${mode}-${stage}`;
const decodeId=id=>{const m=/^evo-(defense|burst|fusion)-([1-5])$/.exec(id||'');return m?{mode:m[1],stage:Number(m[2])}:null;};
for(const mode of Object.keys(MODES))for(let stage=1;stage<=5;stage++){const id=evoId(mode,stage),c=CHALLENGES.find(c=>c.id===id);if(c)c.name=`${MODES[mode].name} · ${stage}`;else CHALLENGES.push({id,name:`${MODES[mode].name} · ${stage}`,opponent:1,reward:0});}

// Persist only bounded, well-formed extension data; missing legacy fields are safe.
const quests=[
 {id:'fusion3',name:'Fusionslehrling',description:'Führe 3 Fusionen aus.',kind:'fusions',target:3,reward:35},
 {id:'normal2500',name:'Ohne Magie',description:'Verursache 2.500 LP-Schaden mit normalen Monstern.',kind:'normalDamage',target:2500,reward:55},
 {id:'win3',name:'Arenaroutine',description:'Gewinne 3 manuelle Duelle.',kind:'wins',target:3,reward:45},
 {id:'fusion5',name:'Fünferkunst',description:'Führe in 2 verschiedenen Duellen eine Fünferfusion aus.',kind:'fiveDuels',target:2,reward:85},
 {id:'combo3',name:'Kombinationskünstler',description:'Löse 3 Poker-Fusionsboni aus.',kind:'combos',target:3,reward:65},
 {id:'defend3',name:'Standfest',description:'Überstehe 3 Runden im Verteidigungsmodus.',kind:'defenseRounds',target:3,reward:50},
 {id:'burst2000',name:'Offensive',description:'Verursache 2.000 LP-Schaden im Burstmodus.',kind:'burstDamage',target:2000,reward:55},
 {id:'fusion8',name:'Fusionsmeister',description:'Führe 8 Fusionen aus.',kind:'fusions',target:8,reward:80},
 {id:'normal6000',name:'Ordentliche Arbeit',description:'Verursache 6.000 LP-Schaden mit normalen Monstern.',kind:'normalDamage',target:6000,reward:90},
 {id:'win5',name:'Wiederkehrer',description:'Gewinne 5 manuelle Duelle.',kind:'wins',target:5,reward:90},
 {id:'combo6',name:'Kombinationsserie',description:'Löse 6 Poker-Fusionsboni aus.',kind:'combos',target:6,reward:100},
 {id:'fusion5x5',name:'Große Beschwörung',description:'Führe in 5 verschiedenen Duellen eine Fünferfusion aus.',kind:'fiveDuels',target:5,reward:140},
 {id:'victory7',name:'Langstrecke',description:'Gewinne 7 manuelle Duelle.',kind:'wins',target:7,reward:110},
 {id:'triple12',name:'Magische Erfahrung',description:'Führe 12 Fusionen aus.',kind:'fusions',target:12,reward:125},
 {id:'normal9000',name:'Klassischer Kämpfer',description:'Verursache 9.000 LP-Schaden mit normalen Monstern.',kind:'normalDamage',target:9000,reward:135},
 {id:'poker9',name:'Pokermeister',description:'Erreiche 9 Poker-Kombinationsboni.',kind:'combos',target:9,reward:140},
 {id:'defend9',name:'Festung',description:'Überstehe insgesamt 9 Runden im Verteidigungsmodus.',kind:'defenseRounds',target:9,reward:135},
 {id:'burst6000',name:'Letzter Schlag',description:'Verursache 6.000 LP-Schaden im Burstmodus.',kind:'burstDamage',target:6000,reward:140}
];
function dayKey(){return new Date().toLocaleDateString('sv-SE');}
function normalizeEvo(input){const raw=input&&typeof input==='object'?input:{},records={};for(const mode of Object.keys(MODES)){records[mode]=Array.from({length:5},(_,i)=>{const x=raw.records?.[mode]?.[i];return Number.isInteger(x)&&x>=0&&x<=3?x:0;});}
 const day=raw.day===dayKey()?raw.day:dayKey(),daily=day===raw.day&&Number.isInteger(raw.daily)&&raw.daily>=0&&raw.daily<=15?raw.daily:0;
 const done=raw.day===day&&Number.isInteger(raw.done)&&raw.done>=0&&raw.done<=15?raw.done:0;
 const active=raw.day===day&&Array.isArray(raw.active)?raw.active.filter(q=>q&&quests.some(x=>x.id===q.id)&&Number.isInteger(q.progress)&&q.progress>=0&&q.progress<=1000000).slice(0,3).map(q=>({id:q.id,progress:q.progress,duels:Array.isArray(q.duels)?q.duels.filter(v=>typeof v==='string'&&v.length<=100).slice(0,30):[]})):[];
 const used=Array.isArray(raw.used)?raw.used.filter(id=>quests.some(q=>q.id===id)).slice(0,15):[];
 return {records,day,daily,done,active,used:day===raw.day?used:[],bonuses:Object.keys(MODES).filter(m=>records[m][4]>=3)};
}
function refillQuests(){const x=profile.evolution;if(x.day!==dayKey()){profile.evolution=normalizeEvo({});return refillQuests();}while(x.active.length<3&&x.done+x.active.length<15){const next=quests.find(q=>!x.used.includes(q.id)&&!x.active.some(a=>a.id===q.id));if(!next)break;x.active.push({id:next.id,progress:0,duels:[]});x.used.push(next.id);}}
validateProfile=function(raw){const p=previous.validateProfile(raw);p.evolution=normalizeEvo(raw?.evolution);return p;};
freshProfile=function(){const p=previous.freshProfile();p.evolution=normalizeEvo({});return p;};
profile.evolution=normalizeEvo(profile.evolution);refillQuests();

// Limited, predictable economy adjustment; applied equally to UI and purchases.
cardCost=function(id){return Math.ceil(previous.cardCost(id)*1.15/5)*5;};
boosterPrice=function(tier,count){return Math.ceil(previous.boosterPrice(tier,count)*1.12/5)*5;};
packPrice=function(source,difficulty,pick){return Math.ceil(previous.packPrice(source,difficulty,pick)*1.12/5)*5;};

// Character-specific tournament decks, with enemy-only templates. The stock and
// rarity of existing collectible cards remain unchanged.
const enemyFusion={};
for(const [tier,descriptions] of [[1,[[4,690,660,'Eisenfunke']]],[3,[[3,790,750,'Dornenklinge'],[4,900,860,'Hainwacht'],[5,1040,950,'Wurzelwolf'],[6,1130,1050,'Kronenhirsch'],[6,1080,1140,'Schildholz']]]]){
 enemyFusion[tier]=descriptions.map(([level,atk,def,name],index)=>{
  const o=OPPONENTS[tier],id=CARDS.length;
  const card={id,rpg:true,enemyOnly:true,fusionOnly:true,name,level,atk,def,source:tier,element:o.element,kind:o.kind,color:o.color,rarity:'normal',ability:index%2?'guard':'pierce',desc:'Spezielle Gegnerfusion für '+o.name};
  card.art=window.ArcaneArt?.makeArt(card)||makeArt(card);CARDS.push(card);return id;
 });
}
// Die Dornengarde führt die exakt gleiche Fusionskarte wie der Shop.
// Die fünfte Gegnervorlage bleibt aus ID-Stabilitätsgründen reserviert.
enemyFusion[3][4]=ACE_CARD_IDS[3];
// Ein eigenständiges Motiv je ACE. Da Shop, Deck und Kampf dieselbe Karten-ID
// benutzen, wird überall automatisch dieselbe Illustration geladen.
for(let tier=1;tier<=10;tier++)CARDS[ACE_CARD_IDS[tier]].art='assets/ace/ace-'+String(tier).padStart(2,'0')+'.svg';
const ACE2=CARDS[ACE_CARD_IDS[2]];ACE2.atk=round10(ACE2.atk*.82);ACE2.def=round10(Math.max(ACE2.def*1.48,1250));ACE2.desc='Defensives ACE mit außergewöhnlicher Verteidigung.';
function npcMainDeck(tier){const o=OPPONENTS[tier];const own=o.loot.filter(id=>!CARDS[id].fusionOnly);const pool=[...DEFAULT_DECK,...own,...(tier===3?[]:[ACE_CARD_IDS[tier]]),...(tier===3?OPPONENTS[2].loot.filter(id=>!CARDS[id].fusionOnly):[])];
 const ranked=[...new Set(pool)].sort((a,b)=>{const x=CARDS[a],y=CARDS[b],wx=tier===2?x.atk+x.def*1.35:tier===1?x.atk*1.5+x.def*.45:x.atk+x.def*.75,wy=tier===2?y.atk+y.def*1.35:tier===1?y.atk*1.5+y.def*.45:y.atk+y.def*.75;return wy-wx;});
 const deck=[];for(const id of [...(tier===3?[]:[ACE_CARD_IDS[tier]]),...own])for(let j=0;j<(tier===1?2:3);j++)if(deck.length<40)deck.push(id);
 for(const id of ranked)while(deck.length<40&&countCard(deck,id)<3)deck.push(id);
 if(deck.length!==40)throw Error('NPC-Hauptdeck hat keine 40 Karten.');return deck;}
rpgEnemyLoadout=function(id,difficulty='easy',stage){
 if(difficulty==='hard'&&id>=1&&id<=10){
  // Hard hat zusaetzliche starke Karten, benutzt aber weiterhin dasselbe ACE.
  const load=previous.rpgEnemyLoadout(id,difficulty,stage),ace=ACE_CARD_IDS[id];
  if(CARDS[ace].fusionOnly){
   if(!load.fusionDeck.includes(ace)){if(load.fusionDeck.length>=15)load.fusionDeck.pop();load.fusionDeck.push(ace);}
  }else if(!load.deck.includes(ace)){
   const index=load.deck.findIndex(cid=>CARDS[cid].source!==id);
   if(index>=0)load.deck[index]=ace;
  }
  return load;
 }
 if(![1,2,3].includes(id))return previous.rpgEnemyLoadout(id,difficulty,stage);
 const o=OPPONENTS[id];return {
 deck:npcMainDeck(id),fusionDeck:id===1?[enemyFusion[1][0]]:id===2?[o.loot[2],o.loot[3]]:enemyFusion[3].flatMap(cardId=>[cardId,cardId,cardId]),
 enhancements:{},power:id===1?.91:id===2?.90:.80,style:id===1?'normal':id===2?'balanced':'fusion'};};
const originalFusionDeckError=fusionDeckError;
fusionDeckError=function(ids){if(Array.isArray(ids)&&ids.length===1&&CARDS[ids[0]]?.enemyOnly)return '';return originalFusionDeckError(ids);};
const oldNormalAiScore=normalAiScore;
chooseAiAction=function(g,policy='balanced'){
 if(g.mode==='pve'&&g.active===1&&g.context!=='encounter'&&[1,2,3].includes(g.opponentId)&&g.aiPhase==='summon'&&!g.summoned&&!g.pending){
  const p=g.players[1],empty=p.field.findIndex(c=>!c),hand=[...p.hand].sort((a,b)=>oldNormalAiScore(g,b,policy)-oldNormalAiScore(g,a,policy));
  if(empty>=0&&hand.length){g.aiPhase='positions';
   if(g.opponentId===1)return {type:'normal',uid:hand[0].uid};
   if(g.opponentId===2&&hand.length>=2){const levels=hand.slice(0,2).map(c=>dataOf(c).level),options=fusionOptions(g,levels);if(options.some(c=>baseStat(c,'atk',p)>dataOf(hand[0]).atk*1.13))return {type:'fusion',uids:hand.slice(0,2).map(c=>c.uid)};}
   if(g.opponentId===3&&hand.length>=2){for(const n of [3,2,4,5]){if(hand.length<n)continue;const chosen=hand.slice(0,n),levels=chosen.map(c=>dataOf(c).level);if(fusionOptions(g,levels).length)return {type:'fusion',uids:chosen.map(c=>c.uid)};}}
   return {type:'normal',uid:hand[0].uid};
  }
 }
 return previous.chooseAiAction(g,policy);
};

// High-quality multiple materials and optional element synergies.
function fusionPattern(levels,elements=[]){const count=new Map();for(const level of levels)count.set(level,(count.get(level)||0)+1);const groups=[...count.values()].sort((a,b)=>b-a),straight=[...new Set(levels)].sort((a,b)=>a-b),chain=straight.length===levels.length&&straight.every((v,i)=>!i||v===straight[i-1]+1);
 let name='Freie Fusion',rollBonus=0,levelBonus=0,qualityBonus=0;
 if(groups[0]===5){name='Fünfling';rollBonus=3;levelBonus=2;qualityBonus=.18;}
 else if(groups[0]===4){name='Vierling';rollBonus=2;levelBonus=1;qualityBonus=.13;}
 else if(groups[0]===3&&groups[1]===2){name='Full House';rollBonus=2;levelBonus=2;qualityBonus=.14;}
 else if(chain&&levels.length===5){name='Große Straße';rollBonus=3;levelBonus=2;qualityBonus=.15;}
 else if(chain&&levels.length>=3){name='Kleine Straße';rollBonus=1;levelBonus=1;qualityBonus=.08;}
 else if(groups[0]===3){name='Drilling';rollBonus=1;levelBonus=1;qualityBonus=.08;}
 else if(groups[0]===2&&groups[1]===2){name='Zwei Paare';rollBonus=1;qualityBonus=.055;}
 else if(groups[0]===2){name='Paar';qualityBonus=.03;}
 const elemental=elements.length>=2&&elements.every(e=>e===elements[0]);if(elemental){qualityBonus+=.025;name+=' · Elementharmonie';}
 return {name,rollBonus,levelBonus,qualityBonus,elemental,hasCombo:name!=='Freie Fusion'};
}
function fusionQuality(levels,elements=[]){const pattern=fusionPattern(levels,elements),average=levels.reduce((a,b)=>a+b,0)/levels.length,spread=Math.max(...levels)-Math.min(...levels);
 const factor=Math.max(.72,Math.min(1.48,1+.045*(levels.length-2)-.075*spread+pattern.qualityBonus));return {...pattern,factor,average,spread};}
fusionBudget=function(levels,g){if(!levels.length||levels.length>5)return 0;if(g?.mode!=='pve')return previous.fusionBudget(levels,g);const f=fusionQuality(levels);return Math.min(12,Math.max(1,Math.min(levels.reduce((a,b)=>a+b,0),Math.floor(f.average+2+(levels.length-2)*.70+f.levelBonus-.45*f.spread))));};
baseStat=function(c,stat,p){const result=previous.baseStat(c,stat,p);if(!p||p.id!==0||game?.mode==='pvp'||!profile?.evolution)return result;const bonuses=profile.evolution.bonuses;return result*(c.fusionOnly?bonuses.includes('fusion')?1.015:1:bonuses.includes(stat==='atk'?'burst':'defense')?1.03:1);};
fusedInstance=function(g,instances,levels){if(instances.length>5||instances.length<2)return null;if(g.mode!=='pve')return previous.fusedInstance(g,instances,levels);const p=g.players[g.active],pool=fusionOptions(g,levels),template=g.fusionChoice!==undefined?pool.find(c=>c.id===g.fusionChoice):[...pool].sort((a,b)=>b.level-a.level||b.atk-a.atk)[0];if(!template)return null;
 const f=fusionQuality(levels,instances.map(c=>dataOf(c).element));const rolls=Math.min(7,qualityRolls(levels)+f.rollBonus+instances.filter(c=>dataOf(c).ability==='guide').length+(g.active===0&&!g.totalFusions[0]?(profile.upgrades.fusionLore||0):0));
 let best=null,trace=[];for(let i=0;i<rolls;i++){const atkPercent=.94+randomInt(g,13)/100,defPercent=.94+randomInt(g,13)/100;const candidate={atk:round10(baseStat(template,'atk',p)*atkPercent*f.factor),def:round10(baseStat(template,'def',p)*defPercent*f.factor)};trace.push({atk:candidate.atk,def:candidate.def});if(!best||candidate.atk+candidate.def>best.atk+best.def)best=candidate;}
 const bonus={atk:0,def:0};for(const n of materialBlocks(g,instances))bonus[randomInt(g,2)?'atk':'def']+=n;
 for(const stat of ['atk','def'])best[stat]=Math.max(0,Math.max(best[stat],Math.ceil(Math.max(...instances.map(c=>materialBase(c,stat)))*.95/10)*10)+bonus[stat]-fusionPenalty(g));
 const used=p.remainingFusion.indexOf(template.id);if(used<0)return null;p.remainingFusion.splice(used,1);
 const result={...newInstance(g,template.id),card:{level:template.level,...best},fusion:true,materialBonus:bonus,qualityRolls:rolls,pattern:f.name,materialsUsed:instances.length,rollTrace:trace,attacked:instances.some(c=>c.attacked)};
 logEvent(g,`${template.name}: ${instances.length} Materialien · ${f.name} · ${rolls} Würfe · ATK ${best.atk} / DEF ${best.def}.`);return result;
};
prepareHandFusion=function(g,uids,choice){if(g.mode!=='pve')return previous.prepareHandFusion(g,uids,choice);if(g.winner!==null||g.summoned||g.pending||uids.length<2||uids.length>5||new Set(uids).size!==uids.length)return false;const p=g.players[g.active],materials=uids.map(uid=>p.hand.find(c=>c.uid===uid));if(materials.some(c=>!c))return false;const levels=materials.map(c=>dataOf(c).level),options=fusionOptions(g,levels).filter(c=>canCompleteHandFusion(g,levels,c.id));if(choice===undefined)choice=options.sort((a,b)=>b.level-a.level||b.atk-a.atk)[0]?.id;if(!options.some(c=>c.id===choice))return false;
 g.fusionChoice=choice;let card;try{card=fusedInstance(g,materials,levels);}finally{delete g.fusionChoice;}if(!card)return false;p.hand=p.hand.filter(c=>!uids.includes(c.uid));p.graveyard.push(...materials);g.pending={kind:'fusion',card,levels};g.materials=[];g.selection=null;g.totalFusions[g.active]++;
 if(g.active===0)recordFusion(g,card,materials.length);return true;
};
function recordFusion(g,card,count){g.evoStats=g.evoStats||{normalDamage:0,combos:0,five:0,materialsMax:0};g.evoStats.materialsMax=Math.max(g.evoStats.materialsMax,count);if(count===5)g.evoStats.five++;if(card.pattern&&card.pattern!=='Freie Fusion')g.evoStats.combos++;}
const oldPlacePending=placePending;
placePending=function(g,idx,choice){const result=oldPlacePending(g,idx,choice);if(result?.fused&&g.active===0)recordFusion(g,result.card,(result.card.materialsUsed||2));return result;};

// Legacy snapshot validator understood only 1–2 pending material levels.
// Validate its remaining invariants using a two-level projection, then restore
// bounded multi-material and animation data from the original snapshot.
validateDuelSnapshot=function(raw){const projected=JSON.parse(JSON.stringify(raw));if(projected.pending?.levels?.length>2)projected.pending.levels=projected.pending.levels.slice(0,2);
 for(const player of projected.players||[]){for(const card of [...(player.hand||[]),...(player.field||[]).filter(Boolean),...(player.graveyard||[])])if(card.qualityRolls>4)card.qualityRolls=4;}if(projected.pending?.card?.qualityRolls>4)projected.pending.card.qualityRolls=4;for(const pl of projected.players||[]){for(const card of [...pl.hand,...pl.field.filter(Boolean),...pl.graveyard])if(card.materialBonus&&(card.materialBonus.atk>240||card.materialBonus.def>240||card.materialBonus.atk+card.materialBonus.def>240))card.materialBonus={atk:0,def:0};}if(projected.pending?.card?.materialBonus&&(projected.pending.card.materialBonus.atk>240||projected.pending.card.materialBonus.def>240||projected.pending.card.materialBonus.atk+projected.pending.card.materialBonus.def>240))projected.pending.card.materialBonus={atk:0,def:0};
 const g=previous.validateDuelSnapshot(projected);if(raw.pending?.levels?.length>2){if(raw.pending.levels.length>5||raw.pending.levels.some(l=>!Number.isInteger(l)||l<1||l>12))throw Error('Ungültige Fusionsmaterialien.');g.pending.levels=[...raw.pending.levels];}
 if(raw.evolutionMode){const info=decodeId(raw.challenge);if(!info||raw.evolutionMode!==info.mode||raw.evolutionStage!==info.stage)throw Error('Ungültige Herausforderungsdaten.');g.evolutionMode=info.mode;g.evolutionStage=info.stage;g.evoStats=normalizeEvoStats(raw.evoStats);g.evolutionCashout=raw.evolutionCashout===true;}
 return g;
};
function normalizeEvoStats(s){const out={normalDamage:0,combos:0,five:0,materialsMax:0};for(const k of Object.keys(out))if(Number.isInteger(s?.[k])&&s[k]>=0&&s[k]<=1000000)out[k]=s[k];return out;}

// New challenge types are deliberately isolated from ordinary PvE and rewards.
createGame=function(options={}){const g=previous.createGame(options),info=decodeId(options.challenge);if(!info||g.mode!=='pve')return g;
 g.evolutionMode=info.mode;g.evolutionStage=info.stage;g.evolutionCashout=false;g.evoStats=normalizeEvoStats({});g.evolutionRoundLimit=[0,9,8,7,7,6][info.stage];
 if(info.mode==='defense'){g.maxLP=8000;g.difficulty='hard';g.players[0].lp=6000;g.players[1].lp=3000;const factor=1+.07*(info.stage-1);g.players[1].power*=factor;for(const c of g.players[1].hand)for(const stat of ['atk','def'])if(c.card)c.card[stat]=round10(c.card[stat]*factor);}
 if(info.mode==='burst'){g.maxLP=8000;g.difficulty='hard';g.players[0].lp=6000;g.players[1].lp=[0,3000,4000,5000,6000,7500][info.stage];}
 return g;};
damagePlayer=function(g,id,amount){if(g.evolutionMode==='defense'&&g.active===0&&id===1){logEvent(g,'Verteidigungsmodus: Der Spieler kann mit Angriffen keinen LP-Schaden verursachen.');return 0;}return previous.damagePlayer(g,id,amount);};
attack=function(g,ai,di){const playerAttack=g.active===0,attacker=playerAttack?g.players[0].field[ai]:null,isNormal=attacker&&!attacker.fusion,oldEnemyLP=g.players[1].lp,result=previous.attack(g,ai,di);
 if(result&&isNormal){g.evoStats=g.evoStats||normalizeEvoStats({});g.evoStats.normalDamage+=Math.max(0,oldEnemyLP-g.players[1].lp);}return result;};
settleRound=function(g){if(g.evolutionMode==='burst')return;if(g.evolutionMode!=='defense')return previous.settleRound(g);
 const round=roundNumber(g),amount=round<=2?0:Math.floor(30*Math.pow(round-2,1.48)*(1+.09*(g.evolutionStage-1)));if(!amount)return;
 const before=g.players.map(p=>p.lp);g.players.forEach(p=>p.lp=Math.max(0,p.lp-amount));logEvent(g,`Beschleunigter Arena-Zerfall: beide verlieren ${amount} LP in Runde ${round}.`);
 if(g.players[0].lp===0&&g.players[1].lp===0)conclude(g,before[0]>=before[1]?0:1,'Zerfall · vorheriger LP-Vorsprung');else if(g.players[0].lp===0||g.players[1].lp===0)conclude(g,g.players[0].lp===0?1:0,'Zerfall hat die Lebenspunkte auf 0 reduziert.');
};
advanceTurn=function(g){if(g.evolutionMode==='burst'){if(g.turn%2===0&&roundNumber(g)>=g.evolutionRoundLimit){conclude(g,1,'Burstmodus: Rundenlimit erreicht.');return true;}return advanceTurn16(g);}if(g.evolutionMode==='defense'&&g.mode==='pve'){
 const p=g.players[g.active];for(const c of p.field.filter(Boolean)){if(c.summonedTurn===g.turn)continue;const extra=12+g.evolutionStage*4;for(const stat of ['atk','def'])c.card[stat]=Math.max(0,c.card[stat]-extra);c.decayTotal=(c.decayTotal||0)+extra;}
 }return previous.advanceTurn(g);};
function objectives(g){if(!g?.evolutionMode)return 0;const s=g.evolutionStage,round=roundNumber(g),damage=g.damageDealt[0]||0;
 if(g.evolutionMode==='defense')return [3,5,7].map(n=>n+Math.floor((s-1)/2)).filter(v=>round>=v).length;
 if(g.evolutionMode==='burst'){const cap=[0,3000,4000,5000,6000,7500][s];return [.25,.55,.95].filter(f=>damage>=cap*f).length;}
 const stats=g.evoStats||{},num=g.totalFusions[0];return [num>=1,num>=2&&stats.materialsMax>=3,num>=3&&stats.materialsMax>=Math.min(5,s+1)&&stats.combos>=1].filter(Boolean).length;
}
function goalDescriptions(g){const stage=g.evolutionStage;if(g.evolutionMode==='defense')return [3,5,7].map(n=>'Bis Runde '+(n+Math.floor((stage-1)/2))+' durchhalten');if(g.evolutionMode==='burst'){const lp=[0,3000,4000,5000,6000,7500][stage];return [.25,.55,.95].map(p=>Math.ceil(lp*p)+' LP-Schaden verursachen');}return ['Mindestens eine Fusion herstellen','Zwei Fusionen, darunter mindestens eine Dreierfusion','Drei Fusionen, eine mit mindestens '+Math.min(5,stage+1)+' Materialien und einem Kombinationsbonus'];}
function modeCashout(){if(!game||!game.evolutionMode||!inputAllowed()||objectives(game)<1)return false;game.evolutionCashout=true;conclude(game,0,'Herausforderung nach '+objectives(game)+' erreichten Zielen beendet.');showFinished();return true;}
const oldReward=rewardMatch;
rewardMatch=function(g){if(!g.evolutionMode){const r=oldReward(g);if(r&&g.mode==='pve')applyQuests(g);return r;}
 if(g.rewardClaimed||profile.rewardLedger.includes(g.id))return null;g.rewardClaimed=true;profile.rewardLedger.push(g.id);profile.rewardLedger=profile.rewardLedger.slice(-512);
 const achieved=g.winner===0?objectives(g):0,valid=achieved>0&&(g.evolutionCashout||g.players[1].lp===0),mode=g.evolutionMode,stage=g.evolutionStage,record=profile.evolution.records[mode],previousBest=record[stage-1],best=valid?Math.max(previousBest,achieved):previousBest;
 const coins=valid?Math.max(0,best-previousBest)*stage*28:0;if(valid){record[stage-1]=best;if(best>=1&&!profile.challenges.includes(g.challenge))profile.challenges.push(g.challenge);if(stage===5&&best===3&&!profile.evolution.bonuses.includes(mode))profile.evolution.bonuses.push(mode);profile.wins++;}else profile.losses++;
 profile.coins=Math.min(1e9,profile.coins+coins);profile.totalTurns+=g.turn;profile.totalFusions+=g.totalFusions[0];profile.history.unshift({opponent:1,win:!!valid,turns:g.turn,coins,xp:0,at:Date.now(),context:'challenge'});profile.history=profile.history.slice(0,30);
 applyQuests(g);saveProfile();return {coins,xp:0,challengeBonus:coins,loot:null,charge:0,evolution:true,objectives:valid?achieved:0,noReward:!valid,bonusUnlocked:valid&&stage===5&&best===3&&previousBest<3};
};
function applyQuests(g){if(g.mode!=='pve'||g.context==='auto'||g.surrendered||g.winner!==0)return;refillQuests();const x=profile.evolution,stats=g.evoStats||normalizeEvoStats({});for(const entry of x.active){const def=quests.find(q=>q.id===entry.id);if(!def)continue;let delta=0;
 switch(def.kind){case 'fusions':delta=g.totalFusions[0];break;case 'normalDamage':delta=stats.normalDamage;break;case 'wins':delta=1;break;case 'combos':delta=stats.combos;break;case 'defenseRounds':delta=g.evolutionMode==='defense'?roundNumber(g):0;break;case 'burstDamage':delta=g.evolutionMode==='burst'?g.damageDealt[0]:0;break;case 'fiveDuels':delta=stats.five>0&&!entry.duels.includes(g.id)?1:0;if(delta)entry.duels.push(g.id);break;}
 entry.progress=Math.min(def.target,entry.progress+delta);
 }saveProfile();}
function claimQuest(id){if(storageConflict)return false;refillQuests();const x=profile.evolution,idx=x.active.findIndex(e=>e.id===id);if(idx<0||x.done>=15)return false;const q=quests.find(q=>q.id===id),entry=x.active[idx];if(entry.progress<q.target)return false;
 profile.coins=Math.min(1e9,profile.coins+q.reward);if(['fusion5','fusion5x5','combo6'].includes(q.id)){const pool=boosterPools(highestCleared()).starter;addCard(pool[rng(pool.length)]);}
 x.active.splice(idx,1);x.done++;refillQuests();saveProfile();return true;
}
// Original challenges remain visible; the new modes use separate clickable cards.
function challengePanels(){const x=profile.evolution;return `<section class="menu-panel evo-intro"><h2>✧ Spezialherausforderungen</h2><p>Drei Modi mit je fünf Stufen und besonderen Regeln. Jede Mission hat drei aufeinander aufbauende Ziele: Nach einem erreichten Ziel darfst du <b>aussteigen</b> und die Essenz sichern oder weiterkämpfen. <b>Bei einer Niederlage verlierst du sämtliche Belohnungen dieses Versuchs.</b> Bereits ausgezahlte Rekorde bleiben erhalten. Stufe 5, vollständig mit drei Zielen abgeschlossen, schaltet einen permanenten Bonus frei.</p><button class="btn" data-evo-help="1">? Regeln und Belohnungen</button></section><div class="menu-grid">`+Object.entries(MODES).map(([mode,m])=>`<section class="menu-panel evo-mode"><h3>${m.icon} ${m.name}</h3><p>${m.text}</p><p><b>Dauerbonus bei Stufe 5 (3/3 Ziele):</b> ${mode==='defense'?'+3 % DEF normaler Monster':mode==='burst'?'+3 % ATK normaler Monster':'+1,5 % ATK/DEF von Fusionen'} · <b>${x.bonuses.includes(mode)?'✓ Freigeschaltet':'Noch gesperrt'}</b></p><div class="evo-steps">${Array.from({length:5},(_,i)=>{const stage=i+1,record=x.records[mode][i],locked=i>0&&x.records[mode][i-1]<1;return `<button class="btn ${record>=3?'evo-finished':''}" data-evo-start="${evoId(mode,stage)}" ${locked||!opponentUnlocked(1)?'disabled':''}>${stage}. ${record?'✓ '+record+'/3':'Starten'} ${locked?'🔒':''}</button>`;}).join('')}</div></section>`).join('')+'</div>';}
function questPanels(){refillQuests();const x=profile.evolution;return `<section class="menu-panel evo-quests"><h2>✦ Passive Tagesquests · ${x.done}/15</h2><p>Du hast gleichzeitig höchstens drei Quests. Sie zählen automatisch bei <b>abgeschlossenen, gewonnenen manuellen Duellen</b>. Fertige Quests kannst du hier abholen; danach rückt eine neue nach. Maximal 15 pro Kalendertag. Morgen beginnt eine neue Rotation.</p><button class="btn" data-evo-help="2">? Quest-Hilfe</button><div class="evo-quest-grid">${x.active.map(a=>{const q=quests.find(q=>q.id===a.id);return `<article class="evo-quest"><strong>${q.name}</strong><p>${q.description}</p><progress max="${q.target}" value="${Math.min(q.target,a.progress)}"></progress><small>${Math.min(q.target,a.progress)} / ${q.target} · ${q.reward} Essenz${['fusion5','fusion5x5','combo6'].includes(q.id)?' + 1 Karte':''}</small><button class="btn" data-evo-claim="${q.id}" ${a.progress<q.target?'disabled':''}>${a.progress>=q.target?'Belohnung abholen':'Noch offen'}</button></article>`;}).join('')||'<p>Tageslimit erreicht. Morgen gibt es neue Quests.</p>'}</div></section>`;}
renderMenu=function(){const custom=CHALLENGES.filter(c=>decodeId(c.id));for(let i=CHALLENGES.length-1;i>=0;i--)if(decodeId(CHALLENGES[i].id))CHALLENGES.splice(i,1);try{previous.renderMenu();}finally{CHALLENGES.push(...custom);}const panel=$('menuContent');if(menuTab==='challenges')panel.insertAdjacentHTML('beforeend',challengePanels());if(menuTab==='stats')panel.insertAdjacentHTML('beforeend',`<section class="menu-panel"><h2>Turnierstatistiken</h2><div class="table-scroll"><table class="history-table"><tr><th>Gegner</th><th>Siege</th><th>Niederlagen im Turnier</th></tr>${OPPONENTS.slice(1).map(o=>`<tr><td>${o.name}</td><td>${profile.mastery[o.id]}</td><td>${profile.tournamentLosses[o.id]||0}</td></tr>`).join('')}</table></div></section>`);panel.insertAdjacentHTML('beforeend',questPanels());const hero=$('menuHero');if(hero){hero.innerHTML=hero.innerHTML.replace('ALPHA 2.2 DEV','ALPHA 2.5 · FUSION EVOLUTION');hero.insertAdjacentHTML('beforeend','<div class="evo-welcome">✦ Neu: Fusionen aus 2–5 echten Materialien, Poker-Kombinationen, neue Spezialmissionen und passive Tagesquests. <button class="btn tiny" data-evo-rulebook="1">? Neue Regeln ansehen</button></div>');}};
$('menuContent').addEventListener('click',e=>{const start=e.target.closest('[data-evo-start]'),claim=e.target.closest('[data-evo-claim]'),help=e.target.closest('[data-evo-help]'),rulebook=e.target.closest('[data-evo-rulebook]');if(rulebook){showRules();return;}if(start){const info=decodeId(start.dataset.evoStart);if(info&&(!profile.evolution.records[info.mode][info.stage-2]||info.stage===1)&&info.stage>1)return;startDuel('pve',1,'challenge','easy',start.dataset.evoStart);return;}if(claim){if(claimQuest(claim.dataset.evoClaim))renderMenu();return;}if(help){const questHelp=help.dataset.evoHelp==='2';openModal(modalHtml('SPIELHILFE',questHelp?'Passive Quests':'Spezialherausforderungen','?',questHelp?'Drei Quests gleichzeitig, maximal fünfzehn pro Tag. Fortschritte werden automatisch bei gewonnenen manuellen Duellen verrechnet. Klicke nach dem Erreichen des Ziels auf „Belohnung abholen“; danach erscheint die nächste Aufgabe.':'Du darfst in jedem Modus nach einem erreichten Ziel mit deiner Belohnung aussteigen. Wenn du weiterspielst und verlierst, gibt es für diesen Versuch nichts. Je Stufe werden neue Ziele anspruchsvoller. Der permanente Kampfbonus wird erst für Stufe 5 mit drei erfüllten Zielen vergeben.','','<button class="btn primary" id="evoHelpClose">VERSTANDEN</button>'));$('evoHelpClose').onclick=hideModal;}});

const previousStartDuel=startDuel;
startDuel=function(mode,id=0,context='free',difficulty='easy',challenge=null){previousStartDuel(mode,id,context,difficulty,challenge);const info=decodeId(challenge);if(!info||!game?.evolutionMode||uiMode!=='duel')return;
 $('modal')?.insertAdjacentHTML('afterbegin',`<section class="evo-rulebox"><h3>${MODES[info.mode].icon} ${MODES[info.mode].name} · Stufe ${info.stage}</h3><p>${MODES[info.mode].text}</p><p>Erreiche eines der drei Ziele und sichere deine Belohnung mit „Ziele sichern & beenden“. Du kannst stattdessen riskant weiterspielen. <b>Bei einer Niederlage gehen alle Belohnungen dieses Versuchs verloren.</b> Die Stufe-5-Dauerverstärkung gibt es ausschließlich mit 3/3 Zielen.</p></section>`);
};
// Clear context even when the ordinary duel HUD is reused.
function modeHud(){let panel=$('evolutionStatus');if(!panel){panel=document.createElement('section');panel.id='evolutionStatus';panel.className='evo-live';$('endTurnBtn').parentNode?.append(panel);}if(!game?.evolutionMode){panel.hidden=true;return;}panel.hidden=false;const mode=MODES[game.evolutionMode],done=objectives(game),stats=game.evoStats||{};
 const progress=game.evolutionMode==='defense'?`Überstandene Runde: ${roundNumber(game)} · Zerfall steigt ab Runde 3`:game.evolutionMode==='burst'?`LP-Schaden: ${game.damageDealt[0]} · Rundenlimit: ${game.evolutionRoundLimit}`:`Fusionen: ${game.totalFusions[0]} · Max. Materialien: ${stats.materialsMax||0} · Kombinationen: ${stats.combos||0}`;
 panel.innerHTML=`<h3>${mode.icon} ${mode.name} · Stufe ${game.evolutionStage}</h3><p>${mode.text}</p><p><b>${progress}</b></p><div class="evo-goals">${[1,2,3].map(n=>`<span class="${done>=n?'complete':''}">${done>=n?'✓':'○'} Ziel ${n}: ${goalDescriptions(game)[n-1]}</span>`).join('')}</div><button class="btn primary wide" id="evoCashout" ${done<1||game.winner!==null||game.active!==0||busy||aiRunning?'disabled':''}>${done?'✓ '+done+' Ziel(e) sichern & beenden':'Erstes Ziel erreichen'}</button>`;
 const cash=$('evoCashout');if(cash)cash.onclick=modeCashout;
 $('arenaStatus').textContent=game.evolutionMode==='burst'?'BURST: KEIN ZERFALL · MAX. '+game.evolutionRoundLimit+' RUNDEN':game.evolutionMode==='defense'?'VERTEIDIGUNG: NUR GEGNER VERURSACHT LP-KAMPFSCHADEN · SCHNELLER ZERFALL':$('arenaStatus').textContent;
}
render=function(){previous.render();if(game){const selected=game.materials||[];if(selected.length>=2){const ms=selected.map(uid=>self().hand.find(c=>c.uid===uid)).filter(Boolean),levels=ms.map(c=>dataOf(c).level);if(ms.length>=2){const f=fusionQuality(levels,ms.map(c=>dataOf(c).element));$('summonStage').insertAdjacentHTML('beforeend',`<div class="evo-fusion-preview"><b>${f.name}</b> · ${ms.length} Materialien · Potenzial ${(f.factor*100).toFixed(0)} % · Vorlagen bis Lv ${fusionBudget(levels,game)}</div>`);}document.querySelectorAll('.discard-mark').forEach(x=>x.classList.remove('discard-mark'));document.querySelectorAll('.material-label').forEach(x=>x.textContent='MATERIAL');}
 $('summonBtn').textContent=game.pending?'✦ Platzieren':'✦ Beschwören (oder Handkarte anklicken)';}modeHud();};
// Single left-click immediately prepares a normal monster; the player then picks the field.
onHand=function(uid){if(!inputAllowed()||game.summoned||game.pending)return;if(materialMode){markMaterial(uid);return;}game.materials=[];const card=self().hand.find(c=>c.uid===uid);if(!card)return;if(self().field.every(Boolean)){toast('Alle Monsterzonen belegt. Wähle Materialien zur Feldfusion oder mache Platz.');return;}if(prepareNormal(game,uid)){render();toast('Monster ausgewählt: Klicke jetzt auf eine freie Zone.');}};
// Suppress the old "two last materials / earlier discarded" explanation.
prepareFusion=async function(choice){if(!inputAllowed()||game.summoned||game.pending)return;if(game.materials.length<2){toast('Wähle zwei bis fünf Fusionsmaterialien.');return;}const ids=[...game.materials],materials=ids.map(uid=>self().hand.find(c=>c.uid===uid));if(materials.some(x=>!x))return;
 if(choice===undefined&&game.mode==='pve'){chooseFusionModal(materials.map(m=>dataOf(m).level),materials,id=>prepareFusion(id),'Alle markierten Materialien werden wirklich fusioniert. Weitere Materialien können bei schlechtem Levelmix schwächen.');return;}
 if(!prepareHandFusion(game,ids,choice)){toast(fusionFailureReason(game,materials.map(m=>dataOf(m).level)));return;}
 busy=true;render();await fusionAnimation(dataOf(game.pending.card).level);busy=false;render();};
fusionPreview=function(g,c,materials,levels=materials.map(m=>dataOf(m).level)){const p=g.players[g.active],f=fusionQuality(levels,materials.map(m=>dataOf(m).element)),bonus=materialBlocks(g,materials).reduce((a,b)=>a+b,0),range=stat=>{const floor=Math.ceil(Math.max(...materials.map(m=>materialBase(m,stat)))*.95/10)*10;return [Math.max(0,Math.max(floor,round10(baseStat(c,stat,p)*.94*f.factor))-fusionPenalty(g)),Math.max(0,Math.max(floor,round10(baseStat(c,stat,p)*1.06*f.factor))+bonus-fusionPenalty(g))];};return {atk:range('atk'),def:range('def'),bonus,remaining:countCard(p.remainingFusion,c.id)-1,attackSpent:materials.some(m=>m.attacked),rolls:Math.min(7,qualityRolls(levels)+f.rollBonus+materials.filter(m=>dataOf(m).ability==='guide').length+(g.active===0&&!g.totalFusions[0]?(profile.upgrades.fusionLore||0):0)),pattern:f.name};};
chooseFusionModal=function(levels,materials,callback,extra=''){const options=fusionOptions(game,levels).filter(c=>game.pending||canCompleteHandFusion(game,levels,c.id)).sort((a,b)=>b.level-a.level||b.atk-a.atk);if(!options.length){toast(fusionFailureReason(game,levels));return;}const f=fusionQuality(levels,materials.map(m=>dataOf(m).element));openModal(modalHtml('FUSIONSVORSCHAU',f.name,'✧','Tippe eine Monsterkarte an, um die Fusionsvorlage auszuwählen. Alle markierten Materialien werden eingesetzt.',`<p><b>Material:</b> ${materials.map(m=>escapeHtml(dataOf(m).name)).join(' + ')}</p><p>Qualität: <b>${(f.factor*100).toFixed(0)} %</b> · Niveau ${f.average.toFixed(1)} · mögliche Stufe bis <b>${fusionBudget(levels,game)}</b>. ${extra}</p><details class="fusion-how"><summary>Wie berechnet sich die Fusion?</summary><p>Die durchschnittliche Materialstufe entscheidet über das Potenzial. Hohe Differenzen zwischen Materialien senken die Qualität. Pokerkombinationen und Elemente können diese verbessern. Pro Wurf liegen Grundwerte zwischen 94 und 106 %; der beste Gesamtwurf gewinnt. Material-Aufstiegsboni werden zusätzlich zufällig auf ATK oder DEF verteilt. Eine schlechte Fusion kann schwächer als ihr stärkstes Material ausfallen.</p></details><div class="pool-grid fusion-choice-grid">${options.map(c=>{const v=fusionPreview(game,c,materials,levels);return `<article class="fusion-offer">${fullCardHtml({id:c.id,card:{level:c.level,atk:round10((v.atk[0]+v.atk[1])/2),def:round10((v.def[0]+v.def[1])/2)}},`data-fusion-choice="${c.id}" title="${escapeHtml(c.name)} auswählen"`,'fusion-pick-card')}<div class="fusion-forecast"><strong>ATK ${fmt(v.atk[0])}–${fmt(v.atk[1])}</strong><strong>DEF ${fmt(v.def[0])}–${fmt(v.def[1])}</strong></div><p class="fusion-short">${v.rolls} Wertewürfe · ${escapeHtml(v.pattern)} · Materialbonus +${v.bonus}<br>Noch ${v.remaining} Fusionskopie(n)</p><button class="btn" data-fusion-choice="${c.id}">Diese Fusion wählen</button></article>`;}).join('')}</div>`, '<button class="btn" id="fusionCancel">ZURÜCK</button>'));$('modal').classList.add('pool-modal','fusion-choice-modal');$('fusionCancel').onclick=hideModal;let chosen=false;document.querySelectorAll('[data-fusion-choice]').forEach(b=>b.onclick=()=>{if(chosen)return;chosen=true;hideModal();callback(Number(b.dataset.fusionChoice));});};
// Keep effect duration short and let the existing "instant" preference skip it.
fusionAnimation=async function(level){if(animationSpeed==='instant')return;const c=game?.pending?.card||game?.players?.[game.active]?.field?.find(x=>x?.fusion);const count=c?.materialsUsed||2,pattern=c?.pattern||'Fusion',trace=c?.rollTrace||[];const fx=document.createElement('div');fx.className='evo-summon'+(count>=4?' evo-summon-grand':'');fx.innerHTML=`<div class="evo-swirl"><span>✦</span><span>✧</span><span>✦</span></div><strong>${escapeHtml(pattern)}</strong><small>${count} Materialien · Lv ${level}</small><div class="evo-rolls" aria-live="polite"></div>`;document.body.append(fx);sound('summon');const el=fx.querySelector('.evo-rolls');for(const roll of trace.slice(0,Math.min(4,trace.length))){if(el)el.textContent=`✧ Wertewurf: ATK ${roll.atk} / DEF ${roll.def}`;await animationWait(count>=4?125:95);}await animationWait(count>=4?210:110);fx.remove();};
const baseOnOwnSlot=onOwnSlot;onOwnSlot=async function(idx,choice){const wasPending=Boolean(game?.pending);await baseOnOwnSlot(idx,choice);if(wasPending&&!game?.pending){const target=document.querySelector(`[data-mine="${idx}"] .board-creature`);if(target){target.classList.add('evo-card-arrive');setTimeout(()=>target.classList.remove('evo-card-arrive'),320);}}};
frameClassForCard=function(c){const css=previous.frameClassForCard(c);const t=dataOf(c);return t.ace?css+' evo-ace-tier-'+t.source:css;};
showFinished=function(){const mode=game?.evolutionMode,already=game?.finishShown;previous.showFinished();if(game?.mode==='pve'&&game?.context==='tournament'&&game?.winner===0){const stale=$('modal')?.querySelector('.first-win-box');if(stale){stale.innerHTML='<h3>✦ Erste Turnierprüfung bestanden!</h3><p>Die nächste Turnierstufe und das einmalig kaufbare ACE-Monster sind freigeschaltet. <b>Keine kostenlose ACE- oder Fusionskarte:</b> Das ACE ist im Shop gegen Essenz erhältlich.</p>';}}if(!mode||already||!game?.finishShown)return;const r=objectives(game),won=game.evolutionCashout||game.winner===0&&game.players[1].lp===0&&r>0;
 const note=`<div class="evo-result"><h3>${won?'✦ Herausforderung abgeschlossen':'⚠ Versuch gescheitert'}</h3><p>${won?r+' von 3 Zielen erfüllt. Mehr Belohnungen gibt es beim erneuten Versuch mit weiteren Zielen.':'Keine Belohnung für diesen Versuch. Bereits abgeschlossene frühere Versuche bleiben erhalten.'}</p>${game.evolutionStage===5&&won&&r===3?'<p>✦ Permanenter Kategorievorteil freigeschaltet!</p>':''}</div>`;$('modal')?.insertAdjacentHTML('afterbegin',note);};
showRules=function(){openModal(modalHtml('ALPHA 2.5 · REGELN','Das Duellantenhandbuch','⚔','Handkarten, Fusionen und Herausforderungen verständlich erklärt.',`<ol class="rulelist"><li><b>Normal beschwören:</b> Klicke eine Handkarte und dann eine eigene Monsterzone. Pro Zug ist eine Beschwörung möglich.</li><li><b>Angreifen:</b> Wähle ein eigenes Angriffsmonster und danach das gegnerische Ziel. Direkte Angriffe sind nur gegen ein leeres Gegnerfeld möglich. Monster in Verteidigung erzeugen Rückstoßschaden bei zu schwachen Angriffen.</li><li><b>Fusionieren:</b> Aktiviere Touch-Fusion oder markiere per Rechtsklick <b>2–5 Karten</b>. Alle Karten sind echte Materialien, keine werden unbemerkt abgeworfen. Wähle eine passende Fusionsvorlage, dann eine Zone. Eine besetzte Zone fusioniert zusätzlich mit dem Feldmonster, solange insgesamt maximal fünf Materialien verwendet werden.</li><li><b>Fusionsqualität:</b> Je höher der Materialdurchschnitt, desto höher das Potenzial. Ein schwaches zusätzliches Material kann schaden. Paar, Drilling, Straße, Vierling, Full House und Fünfling liefern unterschiedliche Boni. Gleiches Element erhöht die Qualität leicht. Exakte Elementrezepte bleiben künftigen Updates vorbehalten.</li><li><b>Wertewürfe:</b> Die Vorlage würfelt ATK/DEF mehrfach, der beste gemeinsame Wert gilt. Pokerboni können zusätzliche Würfe oder höhere Qualität erzeugen; die Vorschau nennt Schätzwerte. Neue Monster verlieren bei Angriffen 30 ATK. Andere Kreaturen zerfallen nach ihrer Beschwörungsrunde allmählich.</li><li><b>Standardduell:</b> Normal 4.000 LP; Hard und PvP 8.000 LP. Ab Runde 10 steigt der Arena-Zerfall. Fusionskopien sind pro Duell endlich.</li><li><b>Verteidigung:</b> Du startest mit 6.000 LP, der Gegner mit 3.000. <b>Nur deine Angriffe verursachen keine LP-Schäden</b>; gegnerische Angriffe und eigener Rückstoß wirken weiter. Arena und Monster zerfallen schneller.</li><li><b>Burst:</b> Kein Arena- oder Monsterzerfall. Innerhalb des Rundenlimits den Gegner mit Schaden überwinden.</li><li><b>Fusionsmodus:</b> Löse drei aufeinanderfolgende Ziele. Du kannst nach jedem erreichten Ziel aufhören und die Belohnung sichern. Wer weiterkämpft und verliert, bekommt für diesen Versuch nichts.</li><li><b>ACE-Monster:</b> Jedes Turnier-ACE ist exakt die Karte des Gegners. Kaufen kannst du sie einmalig nach dem Sieg; danach ist sie mit 0,35 % Chance pro Boosterkarte erneut erhältlich. Einige ACEs sind normale Monster, andere Fusionen.</li><li><b>Belohnungen:</b> Spezialmissionen zahlen pro neu erreichtem Ziel kleine Essenzbeträge, Stufe 5 mit 3/3 Zielen gewährt +3 % DEF normaler Monster, +3 % ATK normaler Monster oder +1,5 % für Fusionen. Permanente Boni gelten erst in neuen Duellen.</li><li><b>Tagesquests:</b> Maximal drei gleichzeitig und fünfzehn am Tag. Sie zählen automatisch bei gewonnenen manuellen Duellen und können im Menü abgeholt werden.</li><li><b>Kartenkosten:</b> Charakterpacks und Booster sind gegenüber Alpha 2.4 leicht teurer, damit zusätzliche Quests und Herausforderungen die Wirtschaft nicht überfüllen.</li></ol>`, '', '<button class="btn primary" id="modalGo">VERSTANDEN</button>'));$('modalGo').onclick=hideModal;};
showIphoneHelp=function(){previous.showIphoneHelp();$('modal')?.insertAdjacentHTML('beforeend','<p class="evo-rulebox">Alpha 2.5: Handkarte einmal antippen und Feldzone wählen. Für Fusionen „Touch-Fusion“ aktivieren und zwei bis fünf Materialien antippen; es wird nichts mehr bloß abgeworfen.</p>');};
if(window.__arcaneEvolutionPendingSave){try{profile.activeDuel=validateDuelSnapshot(window.__arcaneEvolutionPendingSave);saveProfile();}catch(err){console.warn('Fusion Evolution: gespeicherte Partie nicht wiederhergestellt',err);profile.migrationMessage='Ein laufendes Alpha-2.5-Duell konnte nicht wiederhergestellt werden. Der übrige Spielstand bleibt erhalten.';}delete window.__arcaneEvolutionPendingSave;}
// Public diagnostics for automated tests and balancing. No hidden admin mode.
window.ArcaneEvolution={version:'2.5.0',MODES,decodeId,fusionPattern,fusionQuality,objectives,claimQuest,quests,modeCashout,refillQuests};
if(uiMode==='menu')renderMenu();else if(game)render();
})();
