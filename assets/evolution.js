/* Arcane Duel · Fusion Evolution 3.0: rules, modes and progression.
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
 {id:'combo3',name:'Kombinationskünstler',description:'Löse 3 Spezialkombinationsboni aus.',kind:'combos',target:3,reward:65},
 {id:'defend3',name:'Standfest',description:'Überstehe 3 Runden im Verteidigungsmodus.',kind:'defenseRounds',target:3,reward:50},
 {id:'burst2000',name:'Offensive',description:'Verursache 2.000 LP-Schaden im Burstmodus.',kind:'burstDamage',target:2000,reward:55},
 {id:'fusion8',name:'Fusionsmeister',description:'Führe 8 Fusionen aus.',kind:'fusions',target:8,reward:80},
 {id:'normal6000',name:'Ordentliche Arbeit',description:'Verursache 6.000 LP-Schaden mit normalen Monstern.',kind:'normalDamage',target:6000,reward:90},
 {id:'win5',name:'Wiederkehrer',description:'Gewinne 5 manuelle Duelle.',kind:'wins',target:5,reward:90},
 {id:'combo6',name:'Kombinationsserie',description:'Löse 6 Spezialkombinationsboni aus.',kind:'combos',target:6,reward:100},
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
 const active=raw.day===day&&Array.isArray(raw.active)?raw.active.filter(q=>q&&quests.some(x=>x.id===q.id)&&Number.isInteger(q.progress)&&q.progress>=0&&q.progress<=1000000).slice(0,3).map(q=>({id:q.id,progress:q.progress,duels:Array.isArray(q.duels)?q.duels.filter(v=>typeof v==='string'&&v.length<=100).slice(0,30):[],activatedAt:Number.isSafeInteger(q.activatedAt)&&q.activatedAt>=0?q.activatedAt:0})):[];
 const used=Array.isArray(raw.used)?raw.used.filter(id=>quests.some(q=>q.id===id)).slice(0,15):[];
 const skipped=raw.day===day&&Number.isInteger(raw.skipped)&&raw.skipped>=0&&raw.skipped<=done?raw.skipped:0;
 return {records,day,daily,done,active,used:day===raw.day?used:[],skipped,bonuses:Object.keys(MODES).filter(m=>records[m][4]>=3)};
}
function dailyQuestOrder(day){
 // A deterministic daily rotation over all 18 tasks, without pre-completing
 // any locked task. At most 15 can be activated per calendar day.
 const seed=[...day].reduce((n,ch)=>(n*31+ch.charCodeAt(0))>>>0,2166136261);
 const start=seed%quests.length;
 const direction=seed%2?1:-1;
 return Array.from({length:quests.length},(_,i)=>quests[(start+direction*i+quests.length*100)%quests.length]);
}
function refillQuests(){
 let x=profile.evolution;
 if(x.day!==dayKey()){
  // Keep permanent special-mode rewards: only daily quests should reset.
  profile.evolution=normalizeEvo({...x,day:dayKey(),active:[],used:[],done:0,daily:0,skipped:0});
  x=profile.evolution;
 }
 while(x.active.length<3&&x.done+x.active.length<15){
  const next=dailyQuestOrder(x.day).find(q=>!x.used.includes(q.id)&&!x.active.some(a=>a.id===q.id));
  if(!next)break;
  x.active.push({id:next.id,progress:0,duels:[],activatedAt:Date.now()});
  x.used.push(next.id);
 }
}
validateProfile=function(raw){const p=previous.validateProfile(raw);p.evolution=normalizeEvo(raw?.evolution);return p;};
freshProfile=function(){const p=previous.freshProfile();p.evolution=normalizeEvo({});return p;};
profile.evolution=normalizeEvo(profile.evolution);refillQuests();

// Limited, predictable economy adjustment; applied equally to UI and purchases.
cardCost=function(id){return Math.ceil(previous.cardCost(id)*1.15/5)*5;};
boosterPrice=function(tier,count){return Math.ceil(previous.boosterPrice(tier,count)*1.12/5)*5;};
packPrice=function(source,difficulty,pick){return Math.ceil(previous.packPrice(source,difficulty,pick)*1.12/5)*5;};

// Character-specific tournament decks, with enemy-only templates. The stock and
// rarity of existing collectible cards remain unchanged.
const enemyFusion={1:[...EVOLUTION_ENEMY_IDS[1]],3:[...EVOLUTION_ENEMY_IDS[3]]};
// IDs are now registered in game.js before loading saves. Do not append them
// again: existing game snapshots may reference these exact enemy templates.
for(const [tier,list] of Object.entries(enemyFusion))for(const id of list)
 if(!CARDS[id]?.enemyOnly||CARDS[id].source!==Number(tier))throw Error('Gegner-Fusionskatalog inkonsistent.');
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
 deck:npcMainDeck(id),fusionDeck:id===1?[enemyFusion[1][0]]:id===2?o.loot.filter(cid=>CARDS[cid].fusionOnly).slice(0,2):enemyFusion[3].flatMap(cardId=>[cardId,cardId,cardId]),
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
 const hasLevelOnePair=(count.get(1)||0)>=2;
 if(groups[0]===5){name='Fünfling';rollBonus=3;levelBonus=2;qualityBonus=.18;}
 else if(groups[0]===4){name='Vierling';rollBonus=2;levelBonus=1;qualityBonus=.13;}
 else if(groups[0]===3&&groups[1]===2){name='Full House';rollBonus=2;levelBonus=2;qualityBonus=.14;}
 else if(chain&&levels.length>=4){name='Große Straße';rollBonus=levels.length===5?3:2;levelBonus=levels.length===5?2:1;qualityBonus=levels.length===5?.26:.22;}
 else if(chain&&levels.length===3){name='Kleine Straße';rollBonus=1;levelBonus=1;qualityBonus=.20;}
 else if(groups[0]===3){name='Drilling';rollBonus=1;levelBonus=1;qualityBonus=.08;}
 else if(groups[0]===2&&groups[1]===2){name='Zwei Paare';rollBonus=1;levelBonus=1;qualityBonus=.12+(hasLevelOnePair ? .05 : 0);}
 else if(groups[0]===2){name='Paar';qualityBonus=.04+(hasLevelOnePair ? .015 : 0);}
 // Capped low-level synergy: makes level 1/2 useful in poker combinations without buffing free fusions.
 const lowLevelBonus=levels.length>=3&&name!=='Freie Fusion'
  ?Math.min(.08,levels.filter(l=>l===1).length*.02+levels.filter(l=>l===2).length*.01):0;
 qualityBonus+=lowLevelBonus;
 const elemental=elements.length>=2&&elements.every(e=>e===elements[0]);if(elemental){qualityBonus+=.025;name+=' · Elementharmonie';}
 return {name,rollBonus,levelBonus,qualityBonus,lowLevelBonus,elemental,hasCombo:name!=='Freie Fusion'};
}
function fusionQuality(levels,elements=[]){const pattern=fusionPattern(levels,elements),average=levels.reduce((a,b)=>a+b,0)/levels.length,spread=Math.max(...levels)-Math.min(...levels);
 const factor=Math.max(.72,Math.min(1.48,1+.045*(levels.length-2)-.075*spread+pattern.qualityBonus));return {...pattern,factor,average,spread};}
function tunedFusionQuality(g,levels,elements=[],materials=[]){
 const f=fusionQuality(levels,elements);
 // Neutral Allrounders NEVER reduce the quality or special roll count of an
 // existing 2+ material chain, even when their own level increases the spread.
 // Poker combos from the complete chain are still evaluated normally.
 const allrounder=window.ArcaneAllrounder;
 const resonance=allrounder?.evaluate?.(g,materials)||{bonus:0,materials:0,charges:0};
 if(g?.mode==='pve'&&g.active===0&&resonance.materials){
  const original=materials.filter(c=>!allrounder.isAllrounder(c)&&!allrounder.isResonator?.(c));
  if(original.length>=1){
   const baseline=fusionQuality(original.map(c=>dataOf(c).level),original.map(c=>dataOf(c).element));
   f.factor=Math.max(f.factor,baseline.factor);
   f.rollBonus=Math.max(f.rollBonus,baseline.rollBonus);
   f.levelBonus=Math.max(f.levelBonus,baseline.levelBonus);
   if(baseline.hasCombo&&!f.hasCombo){f.name=baseline.name+' · Resonanz';f.hasCombo=true;}
  }
  f.resonancePct=resonance.bonus;
  f.resonanceMaterials=resonance.materials;
  f.resonanceCharges=resonance.charges;
 }

 // NPCs can fuse normally, but do not receive the player's poker-pattern quality or extra rolls.
 if(g?.mode==='pve'&&g.active===1){f.factor=Math.max(.72,Math.min(1.48,1+.045*(levels.length-2)-.075*f.spread));f.rollBonus=0;f.levelBonus=0;f.qualityBonus=0;f.lowLevelBonus=0;f.hasCombo=false;f.name='Freie Fusion';}
 if(g?.mode==='pve'&&g.active===0&&levels.length>=3&&f.hasCombo)
  f.factor=Math.min(1.48,f.factor+.015*(profile?.upgrades?.fusionPrecision||0));
 if(f.resonancePct)f.factor=Math.min(2.2,f.factor+f.resonancePct/100);
 return f;
}
fusionBudget=function(levels,g,materials=[]){
 if(!levels.length||levels.length>5)return 0;
 if(g?.mode!=='pve')return previous.fusionBudget(levels,g);
 const cap=levels.reduce((a,b)=>a+b,0);
 const budget=list=>{
  const f=fusionQuality(list);
  return Math.max(1,Math.min(list.reduce((a,b)=>a+b,0),Math.floor(
   f.average+2+(list.length-2)*.70+(g?.active===1?0:f.levelBonus)-.45*f.spread)));
 };
 let result=budget(levels);
 // A weak Allrounder may be used to ENHANCE, never spoil the reachable fusion
 // level of an already legal chain. Retain total-level cap and max Lv12.
 if(g.active===0&&window.ArcaneAllrounder?.isAllrounder&&materials.length===levels.length){
  const ordinary=materials.filter(c=>!window.ArcaneAllrounder.isAllrounder(c)&&!window.ArcaneAllrounder.isResonator?.(c));
  if(ordinary.length>=2)result=Math.max(result,budget(ordinary.map(c=>dataOf(c).level)));
 }
 return Math.min(12,cap,result);
};
baseStat=function(c,stat,p){const result=previous.baseStat(c,stat,p);if(!p||p.id!==0||game?.mode==='pvp'||!profile?.evolution)return result;const bonuses=profile.evolution.bonuses;return result*(c.fusionOnly?bonuses.includes('fusion')?1.015:1:bonuses.includes(stat==='atk'?'burst':'defense')?1.03:1);};
/* Fusion rolls begin at the midpoint of ordinary monster potential for the
 * same TARGET level. The catalog's high fusion-template stats do not compound.
 * Existing neutral PvP combat, permanent cards and saved IDs are unaffected. */
const fusionLevelReferences=new Map();
for(let level=1;level<=10;level++){
 const pool=ARCANE_WORKSHOP_IDS.map(id=>CARDS[id]).filter(c=>
  c&&c.level===level&&!c.retired&&!c.fusionOnly&&!c.essenceMonster&&
  Number.isFinite(c.atk)&&Number.isFinite(c.def));
 const midpoint=pool.length?Object.fromEntries(['atk','def'].map(stat=>{
  const values=pool.map(c=>c[stat]);
  return [stat,round10((Math.min(...values)+Math.max(...values))/2)];
 })):{atk:round10(workshopBudget(level)/2),def:round10(workshopBudget(level)/2)};
 fusionLevelReferences.set(level,Object.freeze(midpoint));
}
function fusionReferenceStats(level){
 const stats=fusionLevelReferences.get(level);
 if(stats)return {...stats};
 const mean=round10(workshopBudget(Math.max(1,Math.min(10,level)))/2);
 return {atk:mean,def:mean};
}
function fusionReferenceStat(template,stat,p){
 // Preserve legitimate training/upgrade multipliers, not template's base ATK.
 return fusionReferenceStats(template.level)[stat]*baseStat(template,stat,p)/Math.max(1,template[stat]);
}

/* Progressive tournament tactics: I–III retain their tutorial policies.
 * From IV onward the opponent compares expected real Fusion-3.1 stats
 * against its best available normal creature before consuming materials.
 * Stronger opponents examine progressively larger hand combinations.
 * No hidden boosts to dice or to the NPC's fusion quality are introduced.
 */
const previousProgressiveOpponent=chooseAiAction;
function opponentFusionCandidates(g,materials,p){
 const lv=materials.map(c=>dataOf(c).level);
 const possibilities=fusionOptions(g,lv);
 if(!possibilities.length)return null;
 const template=[...possibilities].sort((a,b)=>b.level-a.level||b.atk-a.atk)[0];
 const quality=tunedFusionQuality(g,lv,materials.map(c=>dataOf(c).element));
 const rolls=Math.min(7,qualityRolls(lv)+quality.rollBonus);
 const expectedRoll=1+.018*Math.max(0,rolls-1); // mild average benefit of best-of-N
 const ref=fusionReferenceStats(template.level);
 const inherited=window.ArcaneRoleFusion?.inheritance?.(materials);
 const role=inherited||(g.mode==='pve'?'resonator':template.role||'combatant');
 const weights=fusionRoleWeights(role);
 const scale=(p.power||1)*quality.factor*expectedRoll;
 return {materials,level:template.level,
  atk:ref.atk*weights.atk*scale,def:ref.def*weights.def*scale,spend:materials.length};
}
chooseAiAction=function(g,policy='balanced'){
 if(g.mode!=='pve'||g.active!==1||g.opponentId<4||g.context==='encounter'||
    g.aiPhase!=='summon'||g.summoned||g.pending||g.winner!==null)
  return previousProgressiveOpponent(g,policy);
 const p=g.players[1];
 if(!p.field.some(c=>!c))return previousProgressiveOpponent(g,policy);
 const hand=p.hand.filter(c=>!isFateCard(c));
 if(!hand.length)return previousProgressiveOpponent(g,policy);
 const lvl=g.opponentId;
 const intent=OPPONENTS[lvl]?.policy==='guardian'?'def':
  OPPONENTS[lvl]?.policy==='offensive'?'atk':'both';
 const weight=(atk,def)=>intent==='def'?atk*.4+def:
   intent==='atk'?atk+def*.35:atk*.85+def*.65;
 const bestNormal=[...hand].sort((a,b)=>weight(dataOf(b).atk,dataOf(b).def)-
   weight(dataOf(a).atk,dataOf(a).def))[0];
 const normalValue=weight(dataOf(bestNormal).atk,dataOf(bestNormal).def);
 const maxMaterials=lvl>=9?5:lvl>=7?4:lvl>=5?3:2;
 let best=null;
 for(let count=2;count<=Math.min(maxMaterials,hand.length);count++){
  function check(start,chosen){
   if(chosen.length===count){
    const candidate=opponentFusionCandidates(g,chosen,p);
    if(!candidate)return;
    // Spend at least two material cards; each extra sacrificed monster raises
    // the necessary tactical advantage. Avoid spamming low-value fusion copies.
    const opportunity=1.04+.055*(count-2);
    const score=weight(candidate.atk,candidate.def)/Math.max(1,normalValue)/opportunity;
    if(!best||score>best.score)best={...candidate,score};
    return;
   }
   for(let j=start;j<=hand.length-(count-chosen.length);j++)
    check(j+1,[...chosen,hand[j]]);
  }
  check(0,[]);
 }
 g.aiPhase='positions';
 if(best&&best.score>=1.08)
  return {type:'fusion',uids:best.materials.map(c=>c.uid)};
 return {type:'normal',uid:bestNormal.uid};
};

function fusionRoleWeights(role){
 return role==='predator'?{atk:1.20,def:.75}:role==='guardian'||role==='soul'?{atk:.75,def:1.35}:{atk:1,def:1};
}
fusedInstance=function(g,instances,levels){
 if(instances.length>5||instances.length<2)return null;
 if(g.mode!=='pve')return previous.fusedInstance(g,instances,levels);
 const p=g.players[g.active],pool=fusionOptions(g,levels,instances),
  template=g.fusionChoice!==undefined?pool.find(c=>c.id===g.fusionChoice):
   [...pool].sort((a,b)=>b.level-a.level||b.atk-a.atk)[0];
 if(!template)return null;
 const imprint=window.ArcaneRoleFusion?.imprint?.(g,instances)||null;
 const role=imprint?.role||(g.mode==='pve'?'resonator':template.role||'combatant');
 const roleWeights=fusionRoleWeights(role);
 const f=tunedFusionQuality(g,levels,instances.map(c=>dataOf(c).element),instances);
 const rolls=Math.min(7,qualityRolls(levels)+f.rollBonus+
  (window.ArcaneEssenceCombat?.fusionRollBonus?.(g)||0)+
  instances.filter(c=>dataOf(c).ability==='guide').length+
  (g.active===0&&!g.totalFusions[0]?(profile.upgrades.fusionLore||0):0));
 // The chosen role shifts the ATK/DEF midpoint BEFORE every real dice roll.
 const baseline={
  atk:fusionReferenceStat(template,'atk',p)*roleWeights.atk*f.factor,
  def:fusionReferenceStat(template,'def',p)*roleWeights.def*f.factor
 };
 let best=null,bestIndex=-1;const trace=[];
 for(let i=0;i<rolls;i++){
  const atkPercent=.88+randomInt(g,25)/100,defPercent=.88+randomInt(g,25)/100;
  const candidate={atk:round10(baseline.atk*atkPercent),def:round10(baseline.def*defPercent)};
  trace.push(candidate);
  if(!best||candidate.atk+candidate.def>best.atk+best.def){best={...candidate};bestIndex=i;}
 }
 const winner={...best},bonus={atk:0,def:0};
 for(const n of materialBlocks(g,instances))bonus[randomInt(g,2)?'atk':'def']+=n;
 const penalty=fusionPenalty(g);
 for(const stat of ['atk','def'])best[stat]=Math.max(0,best[stat]+bonus[stat]-penalty);
 const used=p.remainingFusion.indexOf(template.id);if(used<0)return null;
 p.remainingFusion.splice(used,1);
 const result={...newInstance(g,template.id),card:{level:template.level,...best},
  fusion:true,materialBonus:bonus,qualityRolls:rolls,pattern:f.name,
  ...(f.resonancePct?{resonanceFusion:{bonusPct:f.resonancePct,materials:f.resonanceMaterials,charges:f.resonanceCharges}}:{}),
  materialsUsed:instances.length,rollTrace:trace,
  rollMath:{base:{atk:round10(baseline.atk),def:round10(baseline.def)},
   winnerIndex:bestIndex,winner,bonus:{...bonus},penalty,final:{...best},
   role,roleWeights,quality:f.factor,
   resonancePct:f.resonancePct||0,
    combo:{name:f.name,qualityPct:Math.round(f.qualityBonus*1000)/10,
     rollBonus:f.rollBonus,materialCount:instances.length}},
  attacked:instances.some(c=>c.attacked)};
 if(f.resonancePct)logEvent(g,'Materialresonanz: +'+f.resonancePct+' % Fusionsqualität durch '+f.resonanceMaterials+' Resonanz-Materialien.');
 if(imprint){
  result.roleOverride=imprint.role;result.roleOrigin='material';
  result.roleMaterials=imprint.materials;
  if(imprint.soulOdds!==undefined){result.soulOdds=imprint.soulOdds;result.soulAwakened=imprint.soulAwakened;}
  logEvent(g,dataOf(result).name+' erbt '+imprint.role+' durch '+instances.length+
   ' Materialien: die Rolle prägt bereits die Würfelgrundwerte.');
 }
 // Field materials can pass on a bounded part of already collected soul energy.
 // A hand material contributes nothing; materials are consumed in the real fusion transaction.
 if(g.mode==='pve'){
  const fieldUids=new Set(g.players[g.active].field.filter(Boolean).map(c=>c.uid));
  const used=new Set(),charged=instances.filter(c=>{
   if(!fieldUids.has(c.uid)||used.has(c.uid))return false;
   used.add(c.uid);return true;
  });
  const stored=charged.reduce((n,c)=>n+Math.max(0,Math.min(2000,c.essenceCombat?.soul||0)),0);
  if(stored>0){
   const available=Math.max(0,10000-result.card.def);
   const defGain=Math.min(250,available,Math.floor(stored*.30/10)*10);
   if(defGain){
    result.card.def+=defGain;
    result.rollMath.final.def+=defGain;
    result.rollMath.bonus.def+=defGain; // Keep the rolled-stat equation truthful.
   }
   let carried=0;
   if(role==='soul'){
    const layer=window.ArcaneEssenceCombat?.statLayer?.(result);
    if(layer){
     carried=Math.min(250+result.card.level*125,Math.floor(stored*.30));
     layer.soul=carried; // Never return more energy than the consumed inputs.
     layer.maxDef=result.card.def;
    }
   }
   result.soulInheritance={energy:stored,defBonus:defGain,carried};
   // These charged source instances enter the graveyard after the transaction.
   // Clear their spent reserves now so revival cannot harvest the same energy twice.
   for(const source of charged)if(source.essenceCombat)source.essenceCombat.soul=0;
   logEvent(g,'Seelen-Erbe der Feldfusion: '+stored+' eingesetzte Seelenenergie → +'+defGain+' DEF'+(carried?' und '+carried+' gespeicherte Seelenessenz':'')+'.');
  }
 }
 logEvent(g,template.name+': '+instances.length+' Materialien · '+f.name+' · '+rolls+
  ' Rollenwürfe · final ATK '+best.atk+' / DEF '+best.def+'.');
 return result;
};
prepareHandFusion=function(g,uids,choice){if(g.mode!=='pve')return previous.prepareHandFusion(g,uids,choice);if(g.winner!==null||g.summoned||g.pending||uids.length<2||uids.length>5||new Set(uids).size!==uids.length)return false;const p=g.players[g.active],materials=uids.map(uid=>p.hand.find(c=>c.uid===uid));if(materials.some(c=>!c))return false;const levels=materials.map(c=>dataOf(c).level),options=fusionOptions(g,levels,materials).filter(c=>canCompleteHandFusion(g,levels,c.id));if(choice===undefined)choice=options.sort((a,b)=>b.level-a.level||b.atk-a.atk)[0]?.id;if(!options.some(c=>c.id===choice))return false;
 g.fusionChoice=choice;let card;try{card=fusedInstance(g,materials,levels);}finally{delete g.fusionChoice;}if(!card)return false;p.hand=p.hand.filter(c=>!uids.includes(c.uid));p.graveyard.push(...materials);g.pending={kind:'fusion',card,levels};g.materials=[];g.selection=null;g.totalFusions[g.active]++;
 if(g.active===0)recordFusion(g,card,materials.length);return true;
};
function recordFusion(g,card,count){g.evoStats=g.evoStats||{normalDamage:0,combos:0,five:0,materialsMax:0};g.evoStats.materialsMax=Math.max(g.evoStats.materialsMax,count);if(count===5)g.evoStats.five++;if(card.pattern&&card.pattern!=='Freie Fusion')g.evoStats.combos++;}
const oldPlacePending=placePending;
placePending=function(g,idx,choice){const result=oldPlacePending(g,idx,choice);if(result?.fused){fusionVisualResult=result.card;if(g.active===0)recordFusion(g,result.card,(result.card.materialsUsed||2));}return result;};

// Legacy snapshot validator understood only 1–2 pending material levels.
// Validate its remaining invariants using a two-level projection, then restore
// bounded multi-material and animation data from the original snapshot.
validateDuelSnapshot=function(raw){const projected=JSON.parse(JSON.stringify(raw));if(projected.pending?.levels?.length>2)projected.pending.levels=projected.pending.levels.slice(0,2);
 for(const player of projected.players||[]){for(const card of [...(player.hand||[]),...(player.field||[]).filter(Boolean),...(player.graveyard||[])])if(card.qualityRolls>4)card.qualityRolls=4;}if(projected.pending?.card?.qualityRolls>4)projected.pending.card.qualityRolls=4;for(const pl of projected.players||[]){for(const card of [...pl.hand,...pl.field.filter(Boolean),...pl.graveyard])if(card.materialBonus&&(card.materialBonus.atk>240||card.materialBonus.def>240||card.materialBonus.atk+card.materialBonus.def>240))card.materialBonus={atk:0,def:0};}if(projected.pending?.card?.materialBonus&&(projected.pending.card.materialBonus.atk>240||projected.pending.card.materialBonus.def>240||projected.pending.card.materialBonus.atk+projected.pending.card.materialBonus.def>240))projected.pending.card.materialBonus={atk:0,def:0};
 const g=previous.validateDuelSnapshot(projected);
 // Reattach bounded PvE-only fusion metadata discarded by the old base save
 // validator. Inherited class tags must survive page reload / resumed duels.
 function restoreFusion(to,from){
  if(!to||!from||to.id!==from.id||to.uid!==from.uid||!to.fusion)return;
  if(['predator','guardian','soul','resonator'].includes(from.roleOverride)){
   to.roleOverride=from.roleOverride;to.roleOrigin='material';
   to.roleMaterials=Number.isInteger(from.roleMaterials)&&from.roleMaterials>=2&&from.roleMaterials<=5?from.roleMaterials:2;
  }
  if(from.soulAwakened===true&&to.roleOverride==='soul')to.soulAwakened=true;
  if(from.soulInheritance&&['energy','defBonus','carried'].every(k=>
   Number.isSafeInteger(from.soulInheritance[k])&&from.soulInheritance[k]>=0)&&
   from.soulInheritance.energy<=8000&&from.soulInheritance.defBonus<=250&&
   from.soulInheritance.carried<=2000)
   to.soulInheritance={energy:from.soulInheritance.energy,
    defBonus:from.soulInheritance.defBonus,carried:from.soulInheritance.carried};
  if(from.resonanceFusion&&Number.isInteger(from.resonanceFusion.bonusPct)&&from.resonanceFusion.bonusPct>=0&&from.resonanceFusion.bonusPct<=84&&Number.isInteger(from.resonanceFusion.materials)&&from.resonanceFusion.materials>=1&&from.resonanceFusion.materials<=5&&Number.isInteger(from.resonanceFusion.charges)&&from.resonanceFusion.charges>=0&&from.resonanceFusion.charges<=15)
   to.resonanceFusion={bonusPct:from.resonanceFusion.bonusPct,materials:from.resonanceFusion.materials,charges:from.resonanceFusion.charges};
  if(typeof from.pattern==='string'&&from.pattern.length<=50)to.pattern=from.pattern;
  if(Number.isInteger(from.materialsUsed)&&from.materialsUsed>=2&&from.materialsUsed<=5)to.materialsUsed=from.materialsUsed;
  const finite=n=>Number.isInteger(n)&&n>=0&&n<=10000;
  if(Array.isArray(from.rollTrace)&&from.rollTrace.length>=1&&from.rollTrace.length<=7&&
   from.rollTrace.every(x=>finite(x?.atk)&&finite(x?.def)))
   to.rollTrace=from.rollTrace.map(x=>({atk:x.atk,def:x.def}));
  const m=from.rollMath;
  // Old saves may contain the aliased, already adjusted winning trace entry.
  // Repair presentation metadata only when the independent raw winner proves it.
  if(m&&to.rollTrace&&Number.isInteger(m.winnerIndex)&&m.winnerIndex>=0&&m.winnerIndex<to.rollTrace.length&&
   finite(m.winner?.atk)&&finite(m.winner?.def)&&finite(m.bonus?.atk)&&finite(m.bonus?.def)&&finite(m.penalty)&&
   ['atk','def'].every(stat=>to.rollTrace[m.winnerIndex][stat]===m.final?.[stat]&&
    Math.max(0,m.winner[stat]+m.bonus[stat]-m.penalty)===m.final[stat]))
   to.rollTrace[m.winnerIndex]={atk:m.winner.atk,def:m.winner.def};
  if(m&&to.rollTrace&&Number.isInteger(m.winnerIndex)&&m.winnerIndex>=0&&m.winnerIndex<to.rollTrace.length&&
   finite(m.bonus?.atk)&&finite(m.bonus?.def)&&finite(m.penalty)&&
   finite(m.final?.atk)&&finite(m.final?.def)&&m.final.atk===to.card?.atk&&m.final.def===to.card?.def)
   to.rollMath={winnerIndex:m.winnerIndex,winner:{...to.rollTrace[m.winnerIndex]},
    bonus:{atk:m.bonus.atk,def:m.bonus.def},penalty:m.penalty,
    final:{atk:m.final.atk,def:m.final.def},role:to.roleOverride||CARDS[to.id].role,
     ...(m.combo&&typeof m.combo.name==='string'&&m.combo.name.length<=55&&
      Number.isFinite(m.combo.qualityPct)&&m.combo.qualityPct>=0&&m.combo.qualityPct<=40&&
      Number.isInteger(m.combo.rollBonus)&&m.combo.rollBonus>=0&&m.combo.rollBonus<=4&&
      Number.isInteger(m.combo.materialCount)&&m.combo.materialCount>=2&&m.combo.materialCount<=5
      ?{combo:{name:m.combo.name,qualityPct:m.combo.qualityPct,
       rollBonus:m.combo.rollBonus,materialCount:m.combo.materialCount}}:{})};
 }
 for(let owner=0;owner<2;owner++)for(const place of ['hand','graveyard']){
  for(let i=0;i<g.players[owner][place].length;i++)
   restoreFusion(g.players[owner][place][i],raw.players?.[owner]?.[place]?.[i]);
 }
 for(let owner=0;owner<2;owner++)for(let i=0;i<5;i++)
  restoreFusion(g.players[owner].field[i],raw.players?.[owner]?.field?.[i]);
 restoreFusion(g.pending?.card,raw.pending?.card);
 // The legacy core validator intentionally drops unknown card fields. Restore
 // only bounded per-instance ALLROUNDER charge counters, never template data.
 function restoreCharge(to,from){
  if(to&&from&&to.id===from.id&&to.uid===from.uid&&
   ((CARDS[to.id]?.role==='combatant'&&!to.fusion)||(to.fusion&&to.roleOverride==='resonator'))&&
   Number.isInteger(from.resonance)&&from.resonance>=0&&from.resonance<=(to.fusion?2:3))
   to.resonance=from.resonance;
 }
 for(let owner=0;owner<2;owner++){
  const a=g.players[owner],rawPlayer=raw.players?.[owner];
  for(const place of ['hand','graveyard'])
   for(let i=0;i<a[place].length;i++)restoreCharge(a[place][i],rawPlayer?.[place]?.[i]);
  for(let i=0;i<5;i++)restoreCharge(a.field[i],rawPlayer?.field?.[i]);
 }
 restoreCharge(g.pending?.card,raw.pending?.card);
 g.questActiveIds=Array.isArray(raw.questActiveIds)?raw.questActiveIds.filter(id=>quests.some(q=>q.id===id)).slice(0,3):null;if(raw.pending?.levels?.length>2){if(raw.pending.levels.length>5||raw.pending.levels.some(l=>!Number.isInteger(l)||l<1||l>12))throw Error('Ungültige Fusionsmaterialien.');g.pending.levels=[...raw.pending.levels];}
 if(raw.evolutionMode){const info=decodeId(raw.challenge);if(!info||raw.evolutionMode!==info.mode||raw.evolutionStage!==info.stage)throw Error('Ungültige Herausforderungsdaten.');g.evolutionMode=info.mode;g.evolutionStage=info.stage;g.evoStats=normalizeEvoStats(raw.evoStats);g.evolutionCashout=raw.evolutionCashout===true;}
 return g;
};
function normalizeEvoStats(s){const out={normalDamage:0,combos:0,five:0,materialsMax:0};for(const k of Object.keys(out))if(Number.isInteger(s?.[k])&&s[k]>=0&&s[k]<=1000000)out[k]=s[k];return out;}

// New challenge types are deliberately isolated from ordinary PvE and rewards.
createGame=function(options={}){const g=previous.createGame(options),info=decodeId(options.challenge);g.questActiveIds=(profile.evolution?.active||[]).map(q=>q.id);if(!info||g.mode!=='pve')return g;
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
function applyQuests(g){if(g.mode!=='pve'||g.context==='auto'||g.surrendered||g.winner!==0)return;refillQuests();const x=profile.evolution,stats=g.evoStats||normalizeEvoStats({});const activeAtStart=Array.isArray(g.questActiveIds)?new Set(g.questActiveIds):null;for(const entry of x.active){if(activeAtStart&&!activeAtStart.has(entry.id))continue;const def=quests.find(q=>q.id===entry.id);if(!def)continue;let delta=0;
 switch(def.kind){case 'fusions':delta=g.totalFusions[0];break;case 'normalDamage':delta=stats.normalDamage;break;case 'wins':delta=1;break;case 'combos':delta=stats.combos;break;case 'defenseRounds':delta=g.evolutionMode==='defense'?roundNumber(g):0;break;case 'burstDamage':delta=g.evolutionMode==='burst'?g.damageDealt[0]:0;break;case 'fiveDuels':delta=stats.five>0&&!entry.duels.includes(g.id)?1:0;if(delta)entry.duels.push(g.id);break;}
 entry.progress=Math.min(def.target,entry.progress+delta);
 }saveProfile();}
function claimQuest(id){if(storageConflict)return false;refillQuests();const x=profile.evolution,idx=x.active.findIndex(e=>e.id===id);if(idx<0||x.done>=15)return false;const q=quests.find(q=>q.id===id),entry=x.active[idx];if(entry.progress<q.target)return false;
 profile.coins=Math.min(1e9,profile.coins+q.reward);if(['fusion5','fusion5x5','combo6'].includes(q.id)){const pool=boosterPools(highestCleared()).starter;addCard(pool[rng(pool.length)]);}
 x.active.splice(idx,1);x.done++;refillQuests();saveProfile();return true;
}
function skipQuest(id){if(storageConflict)return false;refillQuests();const x=profile.evolution,idx=x.active.findIndex(e=>e.id===id);if(idx<0||x.done>=15)return false;
 // Skipping consumes one of today's 15 quest slots but grants no reward.
 // A fresh, unstarted quest replaces it immediately unless the cap was reached.
 x.active.splice(idx,1);x.done++;x.skipped=(x.skipped||0)+1;refillQuests();saveProfile();return true;
}
// Original challenges remain visible; the new modes use separate clickable cards.
function challengePanels(){const x=profile.evolution;return `<section class="menu-panel evo-intro"><h2>✧ Spezialherausforderungen</h2><p>Drei Modi mit je fünf Stufen und besonderen Regeln. Jede Mission hat drei aufeinander aufbauende Ziele: Nach einem erreichten Ziel darfst du <b>aussteigen</b> und die Essenz sichern oder weiterkämpfen. <b>Bei einer Niederlage verlierst du sämtliche Belohnungen dieses Versuchs.</b> Bereits ausgezahlte Rekorde bleiben erhalten. Stufe 5, vollständig mit drei Zielen abgeschlossen, schaltet einen permanenten Bonus frei.</p><button class="btn" data-evo-help="1">? Regeln und Belohnungen</button></section><div class="menu-grid">`+Object.entries(MODES).map(([mode,m])=>`<section class="menu-panel evo-mode evo-mode-${mode}"><h3>${m.icon} ${m.name}</h3><p>${m.text}</p><p><b>Dauerbonus bei Stufe 5 (3/3 Ziele):</b> ${mode==='defense'?'+3 % DEF normaler Monster':mode==='burst'?'+3 % ATK normaler Monster':'+1,5 % ATK/DEF von Fusionen'} · <b>${x.bonuses.includes(mode)?'✓ Freigeschaltet':'Noch gesperrt'}</b></p><div class="evo-steps">${Array.from({length:5},(_,i)=>{const stage=i+1,record=x.records[mode][i],locked=i>0&&x.records[mode][i-1]<1;return `<button class="btn ${record>=3?'evo-finished':''}" data-evo-start="${evoId(mode,stage)}" ${locked||!opponentUnlocked(1)?'disabled':''}>${stage}. ${record?'✓ '+record+'/3':'Starten'} ${locked?'🔒':''}</button>`;}).join('')}</div></section>`).join('')+'</div>';}
function questPanels(){refillQuests();const x=profile.evolution;return `<section class="menu-panel evo-quests"><h2>✦ Passive Tagesquests · ${x.done}/15 verbraucht</h2><p>Bis zu drei Quests gleichzeitig: Nur aktive Aufgaben sammeln Fortschritt. Abgeschlossene Quests geben ihre Belohnung frei. Eine übersprungene Quest kostet einen deiner 15 Tagesplätze, gibt <b>keine Belohnung</b> und wird sofort durch eine neue Aufgabe ersetzt, solange Plätze frei sind. Heute übersprungen: ${x.skipped||0}.</p><button class="btn" data-evo-help="2">? Quest-Hilfe</button><div class="evo-quest-grid">${x.active.map(a=>{const q=quests.find(q=>q.id===a.id);return `<article class="evo-quest ${a.progress>=q.target?'evo-quest-ready':''}"><strong>${q.name}</strong><p>${q.description}</p><progress max="${q.target}" value="${Math.min(q.target,a.progress)}"></progress><small>${Math.min(q.target,a.progress)} / ${q.target} · ${q.reward} Essenz${['fusion5','fusion5x5','combo6'].includes(q.id)?' + 1 Karte':''}</small><div class="evo-quest-actions"><button class="btn" data-evo-claim="${q.id}" ${a.progress<q.target?'disabled':''}>${a.progress>=q.target?'Belohnung abholen':'Noch offen'}</button><button class="btn ghost" data-evo-skip="${q.id}">Quest überspringen</button></div></article>`;}).join('')||'<p>Das Tageslimit von 15 Quests ist erreicht. Morgen gibt es neue Aufgaben.</p>'}</div></section>`;}
renderMenu=function(){const custom=CHALLENGES.filter(c=>decodeId(c.id));for(let i=CHALLENGES.length-1;i>=0;i--)if(decodeId(CHALLENGES[i].id))CHALLENGES.splice(i,1);try{previous.renderMenu();}finally{CHALLENGES.push(...custom);}const panel=$('menuContent');if(menuTab==='challenges')panel.insertAdjacentHTML('beforeend',challengePanels());if(menuTab==='stats')panel.insertAdjacentHTML('beforeend',`<section class="menu-panel"><h2>Turnierstatistiken</h2><div class="table-scroll"><table class="history-table"><tr><th>Gegner</th><th>Siege</th><th>Niederlagen im Turnier</th></tr>${OPPONENTS.slice(1).map(o=>`<tr><td>${o.name}</td><td>${profile.mastery[o.id]}</td><td>${profile.tournamentLosses[o.id]||0}</td></tr>`).join('')}</table></div></section>`);if(menuTab==='challenges')panel.insertAdjacentHTML('beforeend',questPanels());const hero=$('menuHero');if(hero){hero.innerHTML=hero.innerHTML.replace('ALPHA 2.2 DEV','ARCANE DUEL 4.1');}};
$('menuContent').addEventListener('click',e=>{const start=e.target.closest('[data-evo-start]'),claim=e.target.closest('[data-evo-claim]'),skip=e.target.closest('[data-evo-skip]'),help=e.target.closest('[data-evo-help]'),rulebook=e.target.closest('[data-evo-rulebook]');if(rulebook){showRules();return;}if(start){const info=decodeId(start.dataset.evoStart);if(info&&(!profile.evolution.records[info.mode][info.stage-2]||info.stage===1)&&info.stage>1)return;startDuel('pve',1,'challenge','easy',start.dataset.evoStart);return;}if(claim){if(claimQuest(claim.dataset.evoClaim))renderMenu();return;}if(skip){if(skipQuest(skip.dataset.evoSkip))renderMenu();return;}if(help){const questHelp=help.dataset.evoHelp==='2';openModal(modalHtml('SPIELHILFE',questHelp?'Passive Quests':'Spezialherausforderungen','?',questHelp?'Drei Quests gleichzeitig, maximal fünfzehn pro Tag. Fortschritte werden automatisch bei gewonnenen manuellen Duellen verrechnet. Klicke nach dem Erreichen des Ziels auf „Belohnung abholen“. Wenn du eine Quest überspringst, wird ein Tagesplatz verbraucht, aber ohne Belohnung eine neue Aufgabe aktiviert. Höchstens fünfzehn Quests pro Tag.':'Du darfst in jedem Modus nach einem erreichten Ziel mit deiner Belohnung aussteigen. Wenn du weiterspielst und verlierst, gibt es für diesen Versuch nichts. Je Stufe werden neue Ziele anspruchsvoller. Der permanente Kampfbonus wird erst für Stufe 5 mit drei erfüllten Zielen vergeben.','','<button class="btn primary" id="evoHelpClose">VERSTANDEN</button>'));$('evoHelpClose').onclick=hideModal;}});

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
render=function(){previous.render();if(game){const selected=game.materials||[];if(selected.length>=2){const ms=selected.map(uid=>self().hand.find(c=>c.uid===uid)).filter(Boolean),levels=ms.map(c=>dataOf(c).level);if(ms.length>=2){const f=tunedFusionQuality(game,levels,ms.map(c=>dataOf(c).element),ms);$('summonStage').insertAdjacentHTML('beforeend',`<div class="evo-fusion-preview"><b>${f.name}</b> · ${ms.length} Materialien · Potenzial ${(f.factor*100).toFixed(0)} %${f.resonancePct?' · ✦ Resonanz +'+f.resonancePct+' %':''} · Vorlagen bis Lv ${fusionBudget(levels,game,ms)}</div>`);}document.querySelectorAll('.discard-mark').forEach(x=>x.classList.remove('discard-mark'));document.querySelectorAll('.material-label').forEach(x=>x.textContent='MATERIAL');}
 $('summonBtn').textContent=game.pending?'✦ Platzieren':'✦ Beschwören (oder Handkarte anklicken)';}modeHud();};
// Single left-click immediately prepares a normal monster; the player then picks the field.
onHand=function(uid){if(!inputAllowed()||game.summoned||game.pending)return;if(materialMode){markMaterial(uid);return;}game.materials=[];const card=self().hand.find(c=>c.uid===uid);if(!card)return;if(self().field.every(Boolean)){toast('Alle Monsterzonen belegt. Wähle Materialien zur Feldfusion oder mache Platz.');return;}if(prepareNormal(game,uid)){render();toast('Monster ausgewählt: Klicke jetzt auf eine freie Zone.');}};
// Suppress the old "two last materials / earlier discarded" explanation.
prepareFusion=async function(choice){if(!inputAllowed()||game.summoned||game.pending)return;if(game.materials.length<2){toast('Wähle zwei bis fünf Fusionsmaterialien.');return;}const ids=[...game.materials],materials=ids.map(uid=>self().hand.find(c=>c.uid===uid));if(materials.some(x=>!x))return;
 if(choice===undefined&&game.mode==='pve'){chooseFusionModal(materials.map(m=>dataOf(m).level),materials,id=>prepareFusion(id),'Alle markierten Materialien werden wirklich fusioniert. Weitere Materialien können bei schlechtem Levelmix schwächen.');return;}
 if(!prepareHandFusion(game,ids,choice)){toast(fusionFailureReason(game,materials.map(m=>dataOf(m).level)));return;}
 fusionVisualMaterials=fusionVisualSnapshot(materials);
 // Reveal committed values BEFORE the player chooses a monster zone.
 if(game.pending?.kind==='fusion'&&game.mode==='pve'&&game.active===0){
  game.pending.revealed=false;game.cinemaActive=true;busy=true;render();
  try{await fusionAnimation(dataOf(game.pending.card).level);}
  finally{
   if(game.pending?.kind==='fusion')game.pending.revealed=true;
   game.cinemaActive=false;busy=false;render();
  }
 }else render();
 toast('Fusion enthüllt: Wähle eine Monsterzone. Belegte Zonen starten eine schnellere zweite Fusion.');};
fusionPreview=function(g,c,materials,levels=materials.map(m=>dataOf(m).level)){const p=g.players[g.active],f=tunedFusionQuality(g,levels,materials.map(m=>dataOf(m).element),materials),bonus=materialBlocks(g,materials).reduce((a,b)=>a+b,0),inherited=window.ArcaneRoleFusion?.inheritance?.(materials),role=inherited||c.role,weights=fusionRoleWeights(role),range=stat=>[Math.max(0,round10(fusionReferenceStat(c,stat,p)*weights[stat]*.88*f.factor)-fusionPenalty(g)),Math.max(0,round10(fusionReferenceStat(c,stat,p)*weights[stat]*1.12*f.factor)+bonus-fusionPenalty(g))];return {atk:range('atk'),def:range('def'),bonus,role,remaining:countCard(p.remainingFusion,c.id)-1,attackSpent:materials.some(m=>m.attacked),rolls:Math.min(7,qualityRolls(levels)+f.rollBonus+(window.ArcaneEssenceCombat?.fusionRollBonus?.(g)||0)+materials.filter(m=>dataOf(m).ability==='guide').length+(g.active===0&&!g.totalFusions[0]?(profile.upgrades.fusionLore||0):0)),pattern:f.name,resonancePct:f.resonancePct||0};};
chooseFusionModal=function(levels,materials,callback,extra=''){const options=fusionOptions(game,levels,materials).filter(c=>game.pending||canCompleteHandFusion(game,levels,c.id)).sort((a,b)=>b.level-a.level||b.atk-a.atk);if(!options.length){toast(fusionFailureReason(game,levels));return;}const f=tunedFusionQuality(game,levels,materials.map(m=>dataOf(m).element),materials);openModal(modalHtml('FUSIONSVORSCHAU',f.name,'✧','Tippe eine Fusionsvorlage an. Die Rolle entsteht ausschließlich aus deinen Fusionsmaterialien. Ohne Spezialistenmehrheit entsteht ein neutraler Resonator.',`<p><b>Material:</b> ${materials.map(m=>escapeHtml(dataOf(m).name)).join(' + ')}</p><p>Qualität: <b>${(f.factor*100).toFixed(0)} %</b>${f.resonancePct?' · <b>✦ Materialresonanz +'+f.resonancePct+' %</b>':''} · Niveau ${f.average.toFixed(1)} · mögliche Stufe bis <b>${fusionBudget(levels,game,materials)}</b>. ${extra}</p><details class="fusion-how"><summary>Wie berechnet sich die Fusion?</summary><p>Die durchschnittliche Materialstufe entscheidet über das Potenzial. Hohe Differenzen zwischen Materialien senken die Qualität. Spezialkombinationen und Elemente können diese verbessern. Fusionen starten bei den mittleren ATK-/DEF-Werten gewöhnlicher Monster ihrer Zielstufe. Ein geerbter Predator-, Wächter- oder Seelenzehrer-Tag verlagert die ATK-/DEF-Grundwerte bereits VOR den Würfen. Pro Wurf entstehen 88–112 % des geprägten Referenzwerts; nur der beste gemeinsame Wertewurf gewinnt, danach werden Materialboni addiert und Abzüge verrechnet. Es gibt keine garantierte Stärke durch das beste Material. Material-Aufstiegsboni werden zusätzlich zufällig auf ATK oder DEF verteilt. Eine schlechte Fusion kann schwächer als ihr stärkstes Material ausfallen.</p></details><div class="pool-grid fusion-choice-grid">${options.map(c=>{const v=fusionPreview(game,c,materials,levels);return `<article class="fusion-offer">${fullCardHtml({id:c.id,card:{level:c.level,atk:round10((v.atk[0]+v.atk[1])/2),def:round10((v.def[0]+v.def[1])/2)}},`data-fusion-choice="${c.id}" title="${escapeHtml(c.name)} auswählen"`,'fusion-pick-card')}<div class="fusion-forecast"><strong>ATK ${fmt(v.atk[0])}–${fmt(v.atk[1])}</strong><strong>DEF ${fmt(v.def[0])}–${fmt(v.def[1])}</strong></div><p class="fusion-short"><b>Rolle: ${escapeHtml(({predator:'Predator',guardian:'Wächter (Seelenzehrer möglich)',soul:'Seelenzehrer',resonator:'Resonator'})[v.role]||'Resonator')}</b><br>${v.rolls} Wertewürfe · ${escapeHtml(v.pattern)} · Materialbonus +${v.bonus}${v.resonancePct?' · ✦ Resonanz +'+v.resonancePct+' %':''}<br>Noch ${v.remaining} Fusionskopie(n)</p><button class="btn" data-fusion-choice="${c.id}">Diese Fusion wählen</button></article>`;}).join('')}</div>`, '<button class="btn" id="fusionCancel">ZURÜCK</button>'));$('modal').classList.add('pool-modal','fusion-choice-modal');$('fusionCancel').onclick=hideModal;let chosen=false;document.querySelectorAll('[data-fusion-choice]').forEach(b=>b.onclick=()=>{if(chosen)return;chosen=true;hideModal();callback(Number(b.dataset.fusionChoice));});};
// Real material art is captured before materials leave the hand / field.
// The animation never modifies the duel state, and honors instant/reduced-motion.
let fusionVisualMaterials=null;
let fusionVisualResult=null;
function fusionVisualCard(card){if(!card)return null;const t=dataOf(card);return {art:t.art,name:t.name,level:t.level,soul:Math.max(0,Math.floor(card.essenceCombat?.soul||0)),field:!!game?.players?.[game?.active]?.field?.some(c=>c?.uid===card.uid)};}
function fusionVisualSnapshot(cards){return cards.filter(Boolean).slice(0,5).map(fusionVisualCard);}
// Preserve actual enemy materials as well: the AI removes them before its animation starts.
const previousApplyAiAction=applyAiAction;
applyAiAction=function(g,action){
 if(action?.type==='fusion')fusionVisualMaterials=fusionVisualSnapshot(action.uids.map(uid=>g.players[g.active].hand.find(c=>c.uid===uid)));
 else if(action?.type==='place'&&g.pending&&g.players[g.active].field[action.idx])fusionVisualMaterials=fusionVisualSnapshot([g.pending.card,g.players[g.active].field[action.idx]]);
 const result=previousApplyAiAction(g,action);if(!result)fusionVisualMaterials=null;return result;
};
fusionAnimation=async function(level,visuals=null,variant='full'){
 if(animationSpeed==='instant'||window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches){
  fusionVisualMaterials=null;fusionVisualResult=null;return;
 }
 // Resolve the committed fusion instance rather than just its card catalog template.
 const summoned=game?.lastSummoned;
 const placed=typeof summoned==='object'?summoned:game?.players?.[game?.active]?.field?.find(x=>x?.uid===summoned);
 const c=fusionVisualResult||placed||game?.pending?.card;
 // New fully-scoped cinema consumes ONLY the already committed real roll trace and card.
 // Legacy scene remains a fallback for browsers that cannot load the optional module.
 if(c?.fusion&&window.ArcaneFusionCinema?.play){
  const snapshot=visuals||fusionVisualMaterials||[];
  fusionVisualMaterials=null;
  try{await window.ArcaneFusionCinema.play({instance:c,materials:snapshot,battle:game,
   card:dataOf(c),level,variant,wait:variant==='field'?(ms=>animationWait(Math.max(38,Math.round(ms*.54)))):animationWait,playSound:sound});}
  finally{fusionVisualResult=null;}
  return;
 }
 // The engine has already committed the summon; reveal it only once the card lands.
 const owner=game?.players?.findIndex(p=>p.field?.some(x=>x&&c&&x.uid===c.uid))??-1;
 const zone=owner>=0?game.players[owner].field.findIndex(x=>x&&c&&x.uid===c.uid):-1;
 const fieldSelector=zone<0?null:(owner===0?'#ownRow [data-mine="'+zone+'"]':'#enemyRow [data-enemy="'+zone+'"]');
 const fieldSlot=fieldSelector?document.querySelector(fieldSelector):null;
 const fieldCard=fieldSlot?.querySelector('.board-creature');
 if(fieldCard)fieldCard.classList.add('evo-fusion-awaiting');
 const cards=visuals||fusionVisualMaterials||[];fusionVisualMaterials=null;
 const trace=c?.rollTrace||[],math=c?.rollMath,role=c?.roleOverride||math?.role||CARDS[c?.id]?.role||'combatant';
 const labels={predator:'PREDATOR',guardian:'WÄCHTER',soul:'SEELENZEHRER',resonator:'RESONATOR'};
 const count=c?.materialsUsed||cards.length||2,pattern=c?.pattern||'Fusion',grand=count>=4;
 const fx=document.createElement('div');fx.className='evo-summon evo-fusion-scene evo-stamp-scene'+(grand?' evo-summon-grand':'')+(!['predator','guardian','soul','resonator'].includes(role)?' evo-no-role-stamp':'');
 fx.setAttribute('role','status');fx.setAttribute('aria-label','Fusion: Rollenprägung und '+trace.length+' echte Wertewürfe');
 fx.innerHTML='<div class="evo-mat-count">✧ '+count+' Materialien · '+escapeHtml(pattern)+' ✧</div>'+
  '<div class="evo-visual-stage"><div class="evo-material-layer" aria-hidden="true"></div>'+
  '<div class="evo-fusion-core" aria-hidden="true">✧</div><div class="evo-fusion-result"><img alt="">'+
  '<span>LV '+level+'</span><div class="evo-role-seal evo-seal-'+role+'">'+
  escapeHtml(labels[role]||'FUSION')+'</div><div class="evo-card-final"></div></div>'+
  '<div class="evo-fusion-flash" aria-hidden="true"></div></div>'+
  '<strong class="evo-fusion-caption">'+escapeHtml(pattern)+'</strong>'+
  '<div class="evo-popup-panel"><div class="evo-calc-heading">PRÄGUNG · '+trace.length+' WERTEWÜRFE</div>'+
  '<div class="evo-rolls" aria-live="off"></div></div>';
 const layer=fx.querySelector('.evo-material-layer');
 const shown=cards.length?cards:Array.from({length:count},()=>({art:c?dataOf(c).art:'',level:1}));
 for(let i=0;i<shown.length;i++){
  const item=document.createElement('div');item.className='evo-actual-material';
  const angle=-Math.PI/2+i*2*Math.PI/shown.length;
  item.style.setProperty('--start-x',Math.round(Math.cos(angle)*118)+'px');
  item.style.setProperty('--start-y',Math.round(Math.sin(angle)*78)+'px');
  item.style.setProperty('--spin',Math.round(360+i*38)+'deg');
  const img=document.createElement('img');img.src=shown[i].art;img.alt='';item.append(img);layer.append(item);
 }
 if(c)fx.querySelector('.evo-fusion-result img').src=dataOf(c).art;
 const num=n=>Math.max(0,Math.floor(n||0)).toLocaleString('de-AT');
 const row=(label,atk,def,css='')=>'<div class="evo-calc-row '+css+'"><span>'+escapeHtml(label)+
  '</span><b class="evo-calc-atk">'+num(atk)+'</b><b class="evo-calc-def">'+num(def)+'</b></div>';
 document.body.append(fx);sound('summon');
 try{
  // Phase 1: real materials orbit, then merge.
  fx.classList.add('evo-phase-orbit');await animationWait(grand?970:810);
  fx.classList.remove('evo-phase-orbit');fx.classList.add('evo-phase-merge');await animationWait(560);
  // Phase 2: an empty calculation popup appears, followed by the slowly revealed result.
  fx.classList.add('evo-phase-shell');await animationWait(430);
  fx.classList.add('evo-phase-reveal');await animationWait(1080);
  // Phase 3: the heavy role stamp lands on the finished card BEFORE the dice.
  if(['predator','guardian','soul','resonator'].includes(role)){
   fx.classList.add('evo-stamp-impact');sound('summon');await animationWait(780);
  }
  fx.classList.add('evo-stamp-settled','evo-phase-rolls');
  const log=fx.querySelector('.evo-rolls');
  const shift=math?.roleWeights;
  log.innerHTML=(math?.base?'<div class="evo-role-math">Rollenprägung: ATK ×'+
    (shift?.atk||1).toFixed(2).replace('.',',')+' / DEF ×'+
    (shift?.def||1).toFixed(2).replace('.',',')+
    ' · Wertebasis '+num(math.base.atk)+' / '+num(math.base.def)+'</div>':'')+
   '<div class="evo-calc-cols"><span>WÜRFE (BESTWERT GEWINNT)</span><b>ATK</b><b>DEF</b></div>';
  for(let i=0;i<trace.length;i++){
   const draw=trace[i],el=document.createElement('div');
   el.className='evo-calc-row evo-calc-spinning';
   el.innerHTML='<span>Wurf '+(i+1)+'</span><b class="evo-calc-atk"></b><b class="evo-calc-def"></b>';
   log.append(el);log.parentElement.scrollTop=log.parentElement.scrollHeight;const values=el.querySelectorAll('b');
   for(let tick=0;tick<9;tick++){
    for(let k=0;k<2;k++){
     const digits=String(Math.max(10,k?draw.def:draw.atk)).length;
     values[k].textContent=Array.from({length:digits},(_,d)=>String(1+(i*7+tick*5+d*3+k*4)%9)).join('');
    }
    await animationWait(68);
   }
   values[0].textContent=num(draw.atk);values[1].textContent=num(draw.def);
   el.classList.remove('evo-calc-spinning');el.classList.add('evo-calc-stamped');
   if(math&&i===math.winnerIndex)el.classList.add('evo-calc-winning');
   await animationWait(260);
  }
  if(math){
   const win=trace[math.winnerIndex]||math.winner;
   // We never ADD the alternative rolls: the strongest *one* is selected,
   // and only then are the real material additions/penalty calculated.
   log.insertAdjacentHTML('beforeend','<div class="evo-calc-divider"></div>'+
    row('Bester Wurf',win.atk,win.def,'evo-calc-winning')+
    row('+ Material',math.bonus.atk,math.bonus.def)+
    row('− Abzug',math.penalty,math.penalty)+
    '<div class="evo-calc-divider evo-double"></div>'+
    row('= ENDWERT',math.final.atk,math.final.def,'evo-calc-final'));
   log.parentElement.scrollTop=log.parentElement.scrollHeight;
   fx.classList.add('evo-calc-sum');await animationWait(1250);
   fx.querySelector('.evo-card-final').innerHTML='<b>ATK '+num(math.final.atk)+'</b>'+
    '<b>DEF '+num(math.final.def)+'</b>';
   fx.classList.add('evo-calc-absorb');await animationWait(1000);
  }
  // Fly the actual revealed card toward its real occupied field zone.
  // This is presentation only; the authoritative placement already succeeded.
  const actor=fx.querySelector('.evo-fusion-result');
  const slot=fieldSlot;
  if(slot&&typeof actor?.animate==='function'){
   fx.classList.add('evo-phase-landing');
   const from=actor.getBoundingClientRect(),to=slot.getBoundingClientRect();
   const dx=(to.left+to.width/2)-(from.left+from.width/2);
   const dy=(to.top+to.height/2)-(from.top+from.height/2);
   const scale=Math.max(.20,Math.min(1,to.width/Math.max(1,from.width)));
   const flight=actor.animate([
    {transform:'translate(0,0) scale(1)',opacity:1},
    {transform:'translate('+dx+'px,'+dy+'px) scale('+scale+')',opacity:0}
   ],{duration:520,easing:'cubic-bezier(.24,.7,.18,1)',fill:'forwards'});
   await Promise.race([new Promise(resolve=>{flight.onfinish=resolve;flight.oncancel=resolve;}),animationWait(700)]);
  }else{fx.classList.add('evo-card-land');await animationWait(460);}
  }finally{
  fx.remove();fusionVisualResult=null;
  if(fieldCard){
   fieldCard.classList.remove('evo-fusion-awaiting');
   fieldCard.classList.add('evo-fusion-landed');
   setTimeout(()=>fieldCard.classList.remove('evo-fusion-landed'),900);
  }
 }
};
// Small card-flight for normal summons: animation is only presentation, never a game action.
function animateCardPlacement(card,from,to){
 if(!card||!from||!to||animationSpeed==='instant'||window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)return;
 const ghost=document.createElement('div');ghost.className='evo-card-flight';ghost.setAttribute('aria-hidden','true');
 const img=document.createElement('img');img.alt='';img.src=dataOf(card).art;ghost.append(img);
 ghost.style.cssText=`left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px`;
 document.body.append(ghost);
 if(typeof ghost.animate!=='function'){ghost.remove();return;}
 const sx=to.left+to.width/2-from.left-from.width/2,sy=to.top+to.height/2-from.top-from.height/2;
 const scale=Math.min(1.1,Math.max(.45,to.width/Math.max(1,from.width)));
 const animation=ghost.animate([{transform:'translate(0,0) scale(1)',opacity:.9,filter:'brightness(1)'},{offset:.72,opacity:.95,filter:'brightness(1.3)'},{transform:`translate(${sx}px,${sy}px) scale(${scale})`,opacity:0,filter:'brightness(1.9)'}],{duration:340,easing:'cubic-bezier(.22,.65,.2,1)',fill:'forwards'});
 animation.onfinish=()=>ghost.remove();animation.oncancel=()=>ghost.remove();setTimeout(()=>ghost.remove(),520);
}
const baseOnOwnSlot=onOwnSlot;onOwnSlot=async function(idx,choice){
 const pending=game?.pending,wasPending=Boolean(pending),normal=pending?.kind==='normal'?pending.card:null;
 // Field fusion: capture both the pending card and the existing field monster before placement.
 if(pending&&game?.players?.[game.active]?.field?.[idx])fusionVisualMaterials=fusionVisualSnapshot([pending.card,game.players[game.active].field[idx]]);
 const hand=normal?document.querySelector(`[data-hand="${normal.uid}"]`):null,slot=document.querySelector(`[data-mine="${idx}"]`);
 const from=hand?.getBoundingClientRect(),to=slot?.getBoundingClientRect();
 try{await baseOnOwnSlot(idx,choice);}finally{fusionVisualMaterials=null;}
 if(wasPending&&!game?.pending){
  const target=document.querySelector(`[data-mine="${idx}"] .board-creature`);
  if(target){target.classList.add('evo-card-arrive');setTimeout(()=>target.classList.remove('evo-card-arrive'),400);}
  if(normal)animateCardPlacement(normal,from,to);
 }
};
frameClassForCard=function(c){const css=previous.frameClassForCard(c);const t=dataOf(c);return t.ace?css+' evo-ace-tier-'+t.source:t.essenceMonster?css+' tc-essence tc-essence-'+(t.essenceSchool||'fusion'):css;};
showFinished=function(){const mode=game?.evolutionMode,already=game?.finishShown;previous.showFinished();if(game?.mode==='pve'&&game?.context==='tournament'&&game?.winner===0){}if(!mode||already||!game?.finishShown)return;const r=objectives(game),won=game.evolutionCashout||game.winner===0&&game.players[1].lp===0&&r>0;
 const note=`<div class="evo-result"><h3>${won?'✦ Herausforderung abgeschlossen':'⚠ Versuch gescheitert'}</h3><p>${won?r+' von 3 Zielen erfüllt. Mehr Belohnungen gibt es beim erneuten Versuch mit weiteren Zielen.':'Keine Belohnung für diesen Versuch. Bereits abgeschlossene frühere Versuche bleiben erhalten.'}</p>${game.evolutionStage===5&&won&&r===3?'<p>✦ Permanenter Kategorievorteil freigeschaltet!</p>':''}</div>`;$('modal')?.insertAdjacentHTML('afterbegin',note);};
// Current handbook: wording follows the released PvE rules.
showRules=function(){
 const examples=[['Paar',[3,3]],['Paar mit Lv1',[1,1]],['Zwei Paare',[3,3,2,2]],['Zwei Paare + Lv1',[3,3,1,1]],['Drilling',[2,2,2]],['Kleine Straße (3)',[1,2,3]],['Große Straße (4)',[1,2,3,4]],['Große Straße (5)',[1,2,3,4,5]],['Full House',[2,2,2,3,3]],['Vierling',[2,2,2,2]],['Fünfling',[1,1,1,1,1]]];
 const pokerRows=examples.map(([label,levels])=>{const f=fusionPattern(levels);return `<tr><td>${label}</td><td>${levels.join(' + ')}</td><td>+${(f.qualityBonus*100).toLocaleString('de-AT',{maximumFractionDigits:1})} %</td><td>+${f.rollBonus}</td><td>+${f.levelBonus}</td></tr>`;}).join('');
 const chapter=(name,html,open=false)=>`<details class="arcane-rule-chapter" ${open?'open':''}><summary>${name}</summary><div class="arcane-rule-body">${html}</div></details>`;
 const body=`<div class="arcane-handbook">
 <p class="arcane-rule-intro"><b>Arcane Duel 4.1</b> · Hier findest du die Regeln der aktuellen Einzelspielerduelle. Öffne ein Kapitel oder suche nach einem Begriff. Unterschiede zum lokalen PvP stehen ausdrücklich dabei.</p>
 ${chapter('1 · Dein Ziel, die Karte und der erste Zug',`<h3>Was du erreichen möchtest</h3><p>Bringe die gegnerischen Lebenspunkte auf null. Eine gute Stellung kann das durch direkte Angriffe, günstige Kämpfe oder Seelenwirkung schaffen. Eine hohe Monsterstufe allein garantiert dir keinen Sieg.</p><p>Training und Turnier I–III beginnen mit <b>4.000 LP</b>, IV–VI mit <b>6.000</b>, VII–VIII mit <b>7.000</b> und IX–X mit <b>10.000 LP</b>. Freie Duelle folgen denselben Gegnerstufen. Im schweren Modus gelten <b>8.000 LP</b>, bei IX–X <b>10.000</b>. Lokales PvP und das besondere Duell mit Eiman Huel Stalker beginnen bei 8.000 LP. Leihdeck-Prüfungen können eigene LP-Regeln haben.</p><h3>Die Karte lesen</h3><p>Unten links steht die <b>ATK</b>, unten rechts die <b>DEF</b>. Das Siegel zwischen den Werten zeigt die Monsterstufe. Rolle und Element stehen unter dem Bild. Kartenname, Rahmen und Illustration helfen beim Wiedererkennen; die aktuellen Kampfwerte können sich im Duell verändern.</p><p>Elemente bilden keinen allgemeinen Schadenskreislauf. Gleichartige Elemente können aber deine Fusionsqualität verbessern. Die Rahmen unterscheiden normale Monster, Fusionen, ACEs und Essenzmonster.</p><h3>So beginnt dein Zug</h3><p>Du ziehst auf fünf Handkarten und kannst normalerweise einmal beschwören. Wähle eine Handkarte und eine eigene Zone. Eine erst vorbereitete normale Beschwörung kannst du durch erneutes Antippen zurücknehmen. Im allerersten Zug des gesamten Duells darf noch niemand angreifen.</p><p>Zum Angreifen wählst du dein Monster und danach sein Ziel. Auch gegnerische Karten lassen sich in der großen Ansicht lesen. Nimm dir diesen Blick, wenn du eine Rolle oder Fähigkeit noch nicht kennst.</p>`,true)}
 ${chapter('2 · Kämpfen und eine Verteidigergruppe aufbauen',`<h3>Angriff gegen Angriff</h3><p>Der höhere ATK-Wert gewinnt. Die schwächere Karte wird zerstört und die Differenz trifft ihre Seite als LP-Schaden, soweit kein Schild sie abfängt. 980 ATK gegen 760 ATK bedeuten 220 Schaden. Bei gleichen ATK werden beide Monster zerstört.</p><h3>Angriff gegen DEF im Einzelspielerduell</h3><p>Hier ist die verbleibende DEF eine Art Monster-HP. Treffer bauen sie dauerhaft ab; mehrere Angriffe können gemeinsam einen Blocker besiegen. Überschuss wird nicht automatisch zu LP-Schaden. Zusätzliche Seelenessenz und verdichtete DEF werden als Schutzschichten zuerst aufgebraucht.</p><p><b>Wächter und Seelenzehrer</b> wehren in DEF-Position <b>35 %</b> des eingehenden Angriffsschadens ab. Ein Angriff mit 1.000 ATK zieht dann 650 DEF ab, solange keine anderen Schutzschichten oder Fähigkeiten eingreifen. Ihr Gegenschlag verursacht <b>50 % ihrer aktuellen ATK</b> als direkten LP-Schaden beim Angreifer, auch wenn der Treffer sie zerstört. Während einer vollständigen Angriffsimmunität wird kein zusätzlicher Gegenschlag erzeugt.</p><h3>Wächter und Seelenzehrer gehören zusammen</h3><p>Normale Wächter in DEF-Position regenerieren zu Beginn des eigenen Zuges die Grund-DEF anderer verbündeter Wächter und Seelenzehrer in DEF-Position. Pro Wächter sind es <b>25 + 12 je Monsterstufe, höchstens 150 DEF</b>. Sie heilen sich damit nicht selbst und erhöhen keine Grund-DEF über ihren gespeicherten Höchstwert.</p><p>Die Seelenzehrer nutzen diese gewonnene Zeit zum Absaugen und für Seelenbrand. Eine Mischung aus schützenden Wächtern und offensiv wirkenden Seelenzehrern ist deshalb die gemeinsame Verteidigerstrategie. Schildwall unterstützt beide normalen Rollen. Plane nicht nur genug Schutz ein, sondern auch eine Möglichkeit, die gegnerischen LP zu erreichen.</p><h3>Predatoren und gute Angriffsziele</h3><p>Predatoren haben einen starken ATK-Schwerpunkt. Gegen eine Stellung lohnt sich konzentriertes Feuer: Ein besiegter Seelenzehrer ist oft wertvoller als zwei nur leicht beschädigte Blocker. Prüfe vor einem Angriff, ob ein Gegenschlag dich selbst auf null LP bringen würde.</p><p>Ein überlebender Angreifer verliert nach dem Angriff normalerweise <b>30 ATK</b>. Kampfdisziplin senkt diesen Verlust auf 28, 26 oder 24. Eine Position kann normalerweise einmal pro Zug gewechselt werden.</p><h3>Unterschied zum lokalen PvP</h3><p>Im lokalen PvP gelten die klassischen Verteidigungsregeln: Übersteigt ATK die DEF, wird der Verteidiger zerstört; bei zu wenig ATK kann die Differenz als Rückstoß den Angreifer treffen. Verwechsle das nicht mit den DEF-HP und der Rüstung neuer Einzelspielerduelle.</p>`)}
 ${chapter('3 · Fusionen aus Hand und Feld',`<h3>Eine Fusion ist eine Materialentscheidung</h3><p>Markiere über Touch-Fusion oder am Computer mit Rechtsklick <b>zwei bis fünf Handmonster</b>. Die gewählte Vorlage muss in deinem Fusionsdeck liegen und zum berechneten Materialbudget passen. Danach bestimmst du die Feldzone. Alle markierten Handkarten werden tatsächlich Material.</p><p>Du bekommst keine Fusionskarte allein dadurch, dass du sie im Lexikon siehst. Das Fusionsdeck enthält Vorlagen für Beschwörungen, keine direkt spielbaren Handmonster. Zum Start stehen die Vorlagen Funkenwyrm (Lv2) und Runengreif (Lv4) bereit; auch sie brauchen passende Materialien.</p><h3>Feldfusionen</h3><p>Eine vorbereitete Handkarte kann mit einem eigenen Feldmonster verschmelzen. Über <b>Freie Feldfusion</b> kannst du bis zu vier eigene Feldmonster zusätzlich zur Handkarte auswählen. Diese Monster werden wirklich verbraucht. Hat ein beteiligtes Monster bereits angegriffen, wird dieser verbrauchte Angriff nicht einfach erneuert.</p><p>Jeder Fusionsschritt verbraucht eine mitgenommene Vorlagenkopie für diese Partie. Eine Weiterfusion kann eine weitere Kopie verlangen. Mehrere Kopien derselben Vorlage geben dir mehr Möglichkeiten; dein dauerhafter Kartenbesitz bleibt durch die Beschwörung erhalten.</p><h3>Die Materialien vererben Rollen</h3><p>Zwei Predatoren vererben Predator, zwei Seelenzehrer bleiben Seelenzehrer. Wächter und Seelenzehrer zählen bei gemischten Materialgruppen gemeinsam zur Verteidigerseite. Bei größeren Gruppen braucht eine Seite eine echte Mehrheit. Ohne passende Mehrheit bleibt die Rolle der Vorlage maßgeblich.</p><p>Bei einer Verteidigerfusion verschieben sich die Ausgangswerte <b>vor den Würfen</b> auf ATK ×0,75 und DEF ×1,35. Bei einer Predatorfusion sind es ATK ×1,20 und DEF ×0,75. Das ist die Rollenprägung, kein zusätzlicher nachträglicher Multiplikator auf das fertige Ergebnis.</p><p>Zwei Verteidigermaterialien erwachen nicht zufällig zum Seelenzehrer. Ab drei geeigneten Materialien kann eine Wächterfusion erwachen. Die Chance beginnt bei 20 % und steigt je Material um 3,5 Prozentpunkte plus 0,7 je Materialstufe, höchstens bis 75 %. Zwei bereits vorhandene Seelenzehrer benötigen diese Verwandlung nicht. Werden mindestens drei Verteidiger vom Feld gemeinsam in einer passenden Verteidiger-Feldfusion eingesetzt, ist das Erwachen gesichert.</p><h3>Seelen-Erbe bei einer Feldfusion</h3><p>Liegt gespeicherte Seelenenergie auf ausgewählten Feldmonstern, zeigt die Auswahl ein violettes Leuchten. Bei der Fusion werden 30 % der eingesetzten Energie als zusätzliche DEF auf die neue Karte übertragen, höchstens +250. Wird daraus ein Seelenzehrer, erhält die neue Karte außerdem bis zu 30 % als gespeicherte Seelenenergie, begrenzt durch ihren eigenen Vorrat. Die Energie wird vom Material wirklich verbraucht. Der violette Seelen-Erbe-Posten steht separat unter den normalen Materialwerten in der Berechnung; er darf nicht doppelt addiert werden.</p><h3>Was du während der Animation siehst</h3><p>Geladene Feldkarten zersplittern vor einem verborgenen Seelen-Orb; violette Sternschnuppen laden die Fusion auf. Die Darstellung begleitet die tatsächlichen Materialien, die Rollenprägung, die Wertewürfe und die Bonusrechnung. Die endgültige Gestalt hat ihre eigenen Kampfwerte. Eine große Vorlage oder ein aufwendiger Effekt ist keine Garantie, dass die Fusion besser als deine bisherige Stellung ist. Das Animationstempo stellst du in den Optionen ein.</p>`)}
 ${chapter('4 · Kombinationen, Materialbudget und Wertewürfe',`<h3>Was als Kombination zählt</h3><p>Es zählen die <b>Stufen</b> der tatsächlich gewählten Materialien. Ein Paar benötigt zwei gleiche Stufen; eine Straße benötigt verschiedene direkt aufeinanderfolgende Stufen. Drei ergeben eine kleine Straße, vier oder fünf eine große. Die Tabelle zeigt Beispiele ohne Elementharmonie.</p><div class="arcane-rule-table-wrap"><table class="arcane-rule-table"><thead><tr><th>Muster</th><th>Materialstufen</th><th>Qualitätsbonus</th><th>Zusatzwürfe</th><th>Budgetbonus</th></tr></thead><tbody>${pokerRows}</tbody></table></div><p>Bei Mustern mit mindestens drei Materialien bringt jedes Lv1-Material weitere <b>2 Prozentpunkte</b> und jedes Lv2-Material <b>1 Prozentpunkt</b>, zusammen höchstens 8. Dieser Anteil ist in den Tabellenbeispielen bereits enthalten. Ein Paar 1 + 1 hat seinen eigenen Bonus. Sind alle Materialien vom selben Element, kommen <b>2,5 Prozentpunkte Elementharmonie</b> hinzu.</p><h3>Bonus ist nicht gleich Endergebnis</h3><p>Die Qualität berücksichtigt Materialanzahl, Stufenabstand und Kombination. Ein großer Abstand zwischen der höchsten und niedrigsten Stufe kann Qualität kosten. Der fertige Qualitätsfaktor bleibt zwischen <b>72 und 148 %</b>. Runenpräzision kann geeignete Kombinationen verbessern, hebt diese Grenze aber nicht auf.</p><p>Das Materialbudget entscheidet, welche Vorlagenstufen erreichbar sind. Es berücksichtigt unter anderem die durchschnittliche Stufe, Anzahl und Streuung der Materialien sowie passende Kombinationsboni. Es reicht deshalb nicht, nur die Stufen zu addieren. Entscheidend sind die im Auswahlfenster tatsächlich verfügbaren Vorlagen.</p><h3>Wie die Kampfwerte entstehen</h3><p>Der Ausgangspunkt ist das normale Monsterpotenzial der Zielstufe. Darauf wirken Rollenprägung und Qualität. Jeder echte Wurf erzeugt gemeinsam ATK und DEF mit jeweils <b>88–112 %</b> des entsprechenden Ausgangswerts. Es gibt höchstens <b>sieben Wertewürfe</b>; der Wurf mit der höchsten gemeinsamen Summe gewinnt.</p><p>Ein bereits fusioniertes oder dauerhaft verstärktes Material kann zusätzliche Wertblöcke beisteuern. Diese werden auf ATK und DEF verteilt. Die hohe Zahl auf einer Fusionsvorlage und das stärkste Material werden nicht einfach als garantierter Mindestwert übernommen. Eine unpassende Fusion kann deshalb schwächer ausfallen.</p>`)}
 ${chapter('5 · Deckbau, Besitz und Monsterwerkstatt',`<h3>Dein tatsächlicher Kartenbestand</h3><p>Das Hauptdeck hat <b>genau 40 Karten</b>, normalerweise bis zu drei Kopien derselben Karte. Das Fusionsdeck enthält <b>2–15 Vorlagenkopien</b>, ebenfalls höchstens drei pro Art. Besondere Karten haben gegebenenfalls eigene strengere Grenzen. Es gibt drei Deckplätze.</p><p>Das <b>Monsterlexikon</b> zeigt auch Karten, die du noch nicht besitzt. <b>Entdeckt</b> heißt, dass du eine Karte kennst. <b>Im Besitz</b> heißt, dass sie in deinem Inventar liegt. Erst die Deckzuordnung entscheidet, ob du sie im nächsten Duell mitnimmst. Auch eine sichtbare Karte unter Herstellung oder im Lexikon ist nicht automatisch schon besessen.</p><p>Eine normale Familie kann mehrere eigene Karten bis Stufe 10 haben. Die Illustration bleibt häufig dieselbe; Werte und Stufe gehören zur jeweiligen Karte. Deine Spieler-XP-Stufe ist davon unabhängig. Die regulären spielbaren Monsterstufen enden derzeit bei 10; 11 und 12 sind reserviert.</p><h3>Die Werkstatt gezielt nutzen</h3><p>Unter <b>Fortschritt → Monsterwerkstatt</b> verwandelst du freie gewöhnliche Karten derselben Familie. Die Summe der Stufen bleibt erhalten: Aus 2 + 2 + 1 kann beispielsweise eine Stufe-5-Karte werden. Beim Teilen entsteht umgekehrt eine passende Aufteilung einer höheren Stufe.</p><p>Die Werkstattgrenze liegt anfangs bei 4, nach Turnier III bei 6, nach V bei 8 und nach VII bei 10. In aktiven oder gespeicherten Deckplätzen verwendete Kopien sowie geschützte Karten sind nicht einfach frei verfügbar. Für ACEs, Essenzmonster und seltene Sonderkarten gelten andere Wege.</p><p>Werkstatt und Kampffusion sind verschieden: Die Werkstatt verändert deinen dauerhaften Bestand. Eine Kampffusion ist ein Monster für das laufende Duell. Prüfe deshalb vor einer Umwandlung, welche Kopien du später noch für dein Deck brauchst.</p>`)}
 ${chapter('6 · Turnierfortschritt und sinnvolle Ausgaben',`<h3>Training, Turnier und schwerer Modus</h3><p>Die drei Trainingsduelle bereiten dich auf die Regeln vor und öffnen weitere Übungsmöglichkeiten. Du darfst das Turnier auch schon vorher versuchen. Dort besiegst du die zehn Gegner nacheinander. Die ersten Prüfungen stellen unterschiedliche Spielweisen vor: I vor allem normale Monster, II stärkere Stellungen und III häufige Fusionen. Spätere Gegner verlangen ein weiterentwickeltes Deck.</p><p>Der schwere Modus ist eine zusätzliche Herausforderung. Seine Gegner und LP-Regeln unterscheiden sich. Du musst ihn nicht mit genau dem Deck angehen, mit dem du gerade die normale Prüfung bestanden hast.</p><h3>Vier Belohnungen, vier Aufgaben</h3><p><b>Essenz</b> ist deine ausgebbare Währung für Ausbauten und andere Käufe. <b>XP</b> erhöhen die Spielerstufe. <b>Splitter</b> helfen bei gezielter Herstellung. <b>Karten und Charakterpacks</b> erweitern den Bestand. Die gespeicherte Seelenessenz eines Monsters im Kampf ist ein anderer Vorrat als diese Währung.</p><p>Wiederholte Siege gegen deutlich leichtere Gegner geben mit steigendem Spielerlevel weniger Fortschritt. Erste Turniersiege sind davon ausgenommen. Ein verlorenes Duell ist ein Anlass, deine Stellung, Vorlagen und Ausgaben zu prüfen; eine neue Runde mit demselben Plan löst nicht jede Hürde.</p><h3>Was deinem Deck jetzt hilft</h3><p>Predatoren profitieren von Jagdinstinkt. Normale Wächter und Seelenzehrer profitieren gemeinsam von Schildwall. Fusionen brauchen passende Vorlagen und Materialien; Fusionskunde und Runenpräzision können geeignete Versuche unterstützen. Ein günstiger Ausbau ist nur dann eine gute Investition, wenn er deine tatsächlich gespielten Karten verbessert.</p><p>Nach einem besiegten Gegner kannst du sein echtes <b>ACE</b> einmalig kaufen. Ein normal beschwörbares ACE gehört ins Hauptdeck, ein Fusions-ACE ins Fusionsdeck. Nach dem Kauf besteht auch eine sehr kleine Boosterchance. Lies vor dem Kauf den Kartentyp und den angezeigten Preis.</p><p>Meilensteinbelohnungen erscheinen, wenn du sie erreichst. Triff eine angebotene Kartenwahl bewusst und schließe die Belohnung ab, bevor du weiterspielst.</p>`)}
 ${chapter('7 · Charakterpacks, Automatik und Tagesquests',`<h3>Aus einem Pack auswählen</h3><p>Ein Charakterpack bietet drei unterschiedliche Karten an. Die erste Auswahl ist kostenlos; weitere Karten können die angezeigte Essenz kosten. Eine Karte, die ein bestehendes Muster oder die Wächter-/Seelenzehrer-Gruppe ergänzt, kann hilfreicher sein als die höchste Einzelzahl.</p><h3>Automatische und manuelle Duelle</h3><p>Manuelle Duelle verbrauchen keine Automatikenergie. Die Automatik verwendet ihren eigenen Energievorrat, der sich über Zeit auffüllt. Sie hat begrenzte Serien und geringere Belohnungen als manuelle Kämpfe. Wenn du einen zusätzlichen Dropbonus aktivierst, können dafür Dropladungen verbraucht werden.</p><p>Die Automatik ist keine perfekte taktische Spielerin. Gerade eine Verteidigerstellung mit aktivem Seelenstoß oder eine bewusst vorbereitete Materialkombination kann von eigener Steuerung profitieren.</p><h3>Tagesquests</h3><p>Es sind höchstens drei Aufgaben gleichzeitig aktiv. Nur aktive Quests sammeln Fortschritt aus passenden gewonnenen manuellen Duellen. Eine nachrückende Aufgabe beginnt bei null und bekommt keine alten Aktionen rückwirkend gutgeschrieben.</p><p>Am Tag zählen höchstens <b>15 abgeschlossene oder übersprungene Quests</b>. Überspringen gibt keine Belohnung und verbraucht trotzdem einen Platz. Erfüllte Ziele holst du über die Belohnungsschaltfläche ab.</p>`)}
 ${chapter('8 · Zerfall und Spezialherausforderungen',`<h3>Drei Formen von Zeitdruck</h3><p>Nach einem Angriff verliert ein überlebender Angreifer normalerweise 30 ATK. Der <b>Kreaturenzerfall</b> ist ein eigener Abzug am Ende späterer eigener Züge: Ursprüngliche Startkarten beginnen bei 20, andere normale Monster bei 30 und Fusionen bei <b>25 ATK und DEF</b>. Das erste eigene Zugende nach der Beschwörung ist geschützt. Mit dem Alter sinken die Abzüge; die unmodifizierten Mindestwerte sind 10, 20 und 15.</p><p>Ab Runde 10 fügt die Arena beiden Seiten steigenden LP-Schaden zu. Wenn dabei beide auf null fallen, zählt die LP-Lage unmittelbar davor; bei exaktem Gleichstand entscheidet die vorgesehene Gleichstandsinitiative. Ist dein Nachziehstapel zu Beginn deines Zuges leer, verlierst du ebenfalls.</p><h3>Die drei Spezialmodi</h3><p><b>Verteidigung:</b> Du beginnst mit 6.000 LP, der Gegner mit 3.000. Deine direkten Angriffe verursachen keinen gewöhnlichen LP-Kampfschaden; die übrigen Kampfregeln und besondere Effekte können weiterhin wichtig sein. Der Zerfall ist schneller. Das Ziel ist, die geforderten Runden zu überleben.</p><p><b>Burst:</b> Es gibt keinen gewöhnlichen Arena- oder Monsterzerfall. Du sollst innerhalb des Rundenlimits genug Schaden erzeugen. <b>Fusion:</b> Die Aufgaben verlangen zunehmend anspruchsvolle Fusionsleistungen.</p><p>Jeder Modus hat fünf Stufen und je drei aufeinander aufbauende Ziele. Nach einem erreichten Ziel kannst du aussteigen und das Ergebnis sichern. Wer weiterspielt und verliert, verliert die Belohnung dieses Versuchs. Bereits vorher gesicherte Ergebnisse bleiben bestehen.</p><p>Erst Stufe 5 mit allen drei Zielen schaltet den jeweiligen dauerhaften Vorteil frei: <b>+3 % DEF normaler Monster</b>, <b>+3 % ATK normaler Monster</b> oder <b>+1,5 % ATK und DEF von Fusionen</b>.</p>`)}
 </div>`;
 openModal(modalHtml('ARCANE DUEL 4.1 · REGELBUCH','Das Duellantenhandbuch','⚔','Eine Stellung aufbauen, Rollen zusammenspielen lassen und passende Fusionen wählen.',body,'<button class="btn primary" id="modalGo">VERSTANDEN</button>'));
 $('modal').classList.add('arcane-rule-modal');$('modalGo').onclick=hideModal;
};
showIphoneHelp=function(){previous.showIphoneHelp();$('modal')?.insertAdjacentHTML('beforeend','<p class="evo-rulebox">Arcane Duel: Handkarte einmal antippen und Feldzone wählen. Für Fusionen „Touch-Fusion“ aktivieren und zwei bis fünf Materialien antippen; es wird nichts mehr bloß abgeworfen.</p>');};
if(window.__arcaneEvolutionPendingSave){try{profile.activeDuel=validateDuelSnapshot(window.__arcaneEvolutionPendingSave);saveProfile();}catch(err){console.warn('Fusion Evolution: gespeicherte Partie nicht wiederhergestellt',err);profile.migrationMessage='Ein laufendes Duell konnte nicht wiederhergestellt werden. Der übrige Spielstand bleibt erhalten.';}delete window.__arcaneEvolutionPendingSave;}
// Public diagnostics for automated tests and balancing. No hidden admin mode.
window.ArcaneEvolution={version:'3.1.0',MODES,decodeId,fusionPattern,fusionQuality,tunedFusionQuality,fusionReferenceStats,objectives,claimQuest,skipQuest,quests,modeCashout,refillQuests};
if(uiMode==='menu')renderMenu();else if(game)render();
})();
