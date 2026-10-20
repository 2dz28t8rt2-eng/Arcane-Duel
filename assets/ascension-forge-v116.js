/* Arcane Duel v11.6 - fair, persisted three-card ascension forge.
 * Complements the exact-level-conservation family workshop: this is a
 * progression craft and deliberately consumes three real free cards.
 */
'use strict';
(()=>{
 const key='schmiedekunst', clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 UPGRADES[key]={name:'Schmiedekunst',desc:'Verringert die Essenzkosten der Aufstiegsschmiede um 10 % pro Rang (max. 30 %). Genau 3 Materialkarten bleiben immer erforderlich.',base:310,max:3};
 const originalFresh=freshProfile,originalValidate=validateProfile;
 const validRank=n=>Number.isSafeInteger(n)&&n>=0&&n<=3;
 const validPity=p=>p&&typeof p==='object'&&!Array.isArray(p)&&
  Object.entries(p).every(([k,v])=>/^(?:[2-9]|10)$/.test(k)&&Number.isInteger(v)&&v>=0&&v<=2);
 const validHistory=h=>Array.isArray(h)&&h.length<=20&&h.every(x=>
  x&&Number.isInteger(x.level)&&x.level>=2&&x.level<=10&&
  Number.isInteger(x.id)&&!!CARDS[x.id]&&CARDS[x.id].level===x.level&&
  typeof x.fusion==='boolean'&&Number.isSafeInteger(x.at)&&x.at>=0&&x.at<=1e15);
 function hydrate(p,raw=p){
  const rank=raw?.upgrades?.[key]??0;if(!validRank(rank))throw Error('Ungültiger Schmiedekunst-Rang.');
  if(raw?.ascensionPity!==undefined&&!validPity(raw.ascensionPity))throw Error('Ungültiger Aufstiegsschmiede-Glücksschutz.');
  if(raw?.ascensionIntroSeen!==undefined&&typeof raw.ascensionIntroSeen!=='boolean')throw Error('Ungültige Schmiedefreischaltung.');
  if(raw?.ascensionHistory!==undefined&&!validHistory(raw.ascensionHistory))throw Error('Ungültiger Aufstiegsschmiede-Verlauf.');
  p.upgrades[key]=rank;
  p.ascensionPity={...(raw?.ascensionPity||{})};
  p.ascensionIntroSeen=raw?.ascensionIntroSeen===true;
  p.ascensionHistory=(raw?.ascensionHistory||[]).map(x=>({...x}));
  return p;
 }
 freshProfile=function(...args){const p=originalFresh(...args);return hydrate(p);};
 validateProfile=function(raw,...args){
  // Old v3 validation checks every registered perk. Supply the new default
  // explicitly, without changing the original user object.
  const rank=raw?.upgrades?.[key]??0;
  if(!validRank(rank))throw Error('Ungültiger Schmiedekunst-Rang.');
  const adapted={...raw,upgrades:{...raw.upgrades,[key]:rank}};
  const p=originalValidate(adapted,...args);
  return hydrate(p,raw);
 };
 // The original profile has already been loaded before this late module.
 const stored=(()=>{try{return JSON.parse(window.localStorage.getItem(SAVE_KEY)||'null');}catch{return null;}})();
 hydrate(profile,stored&&stored.version===3?stored:profile);
 const allowed=c=>!!c&&c.rpg&&!c.retired&&!c.ace&&!c.enemyOnly&&!c.questOnly&&
  !c.lv1Exclusive&&!c.fateOnly&&!c.essenceMonster&&!c.trainingReward&&!c.milestoneOnly&&!c.hard;
 const cap=()=>highestCleared()>=6?10:highestCleared()>=5?9:0;
 const price=target=>Math.ceil((60+25*target)*(1-.1*(profile.upgrades[key]||0))/5)*5;
 const inputPool=level=>CARDS.filter(c=>allowed(c)&&c.level===level&&(profile.inventory[c.id]||0)>0&&freeCopies(c.id)>0)
  .sort((a,b)=>(a.fusionOnly?1:0)-(b.fusionOnly?1:0)||a.atk+a.def-(b.atk+b.def)||a.id-b.id);
 const outputPool=(level,fusion)=>CARDS.filter(c=>allowed(c)&&c.level===level&&!!c.fusionOnly===fusion&&
  (c.source==null||c.source<0||c.source<=highestCleared()+(fusion?1:2))&&
  (c.requiredTier==null||c.requiredTier<=highestCleared()+(fusion?1:2)));
 const safeRecipe=(ids,level)=>Array.isArray(ids)&&ids.length===3&&ids.every(id=>
  Number.isInteger(id)&&allowed(CARDS[id])&&CARDS[id].level===level)&&
  [...new Set(ids)].every(id=>ids.filter(x=>x===id).length<=freeCopies(id));
 function suggested(level){
  const pool=inputPool(level),picked=[];
  for(const c of pool)for(let n=0;n<Math.min(freeCopies(c.id),3-picked.length);n++)picked.push(c.id);
  return picked.length===3?picked:null;
 }
 function forge(level,ids,opts={}){
  if(storageConflict||!storageWritable||profile.activeDuel||game&&game.winner===null)
   return {ok:false,message:'Schließe zuerst dein laufendes Duell oder kläre den Speicherkonflikt.'};
  if(!Number.isInteger(level)||level<1||level+1>cap())
   return {ok:false,message:'Aufstieg noch gesperrt. Nach V bis Lv 9, nach VI bis Lv 10.'};
  if(!safeRecipe(ids,level))return {ok:false,message:'Es werden genau drei freie, ungeschützte Karten derselben Stufe benötigt.'};
  const target=level+1,cost=price(target);
  if(profile.coins<cost)return {ok:false,message:'Nicht genügend Essenz: '+cost+' erforderlich.'};
  const normals=outputPool(target,false),fusions=outputPool(target,true);
  if(!normals.length&&!fusions.length)return {ok:false,message:'Für dieses Level gibt es keine zulässigen Karten.'};
  const before={inventory:{...profile.inventory},coins:profile.coins,
   unlocked:[...profile.unlocked],fusionOwned:[...profile.fusionOwned],
   unseen:[...profile.unseen],pity:{...profile.ascensionPity},
   history:profile.ascensionHistory.map(x=>({...x}))};
  const pity=profile.ascensionPity[target]||0;
  const g={seed:rng(0xffffffff)||1};
  const wantFusion=fusions.length>0&&(normals.length===0||pity>=2||randomInt(g,100)<40);
  const pool=wantFusion?fusions:normals.length?normals:fusions;
  const out=pool[randomInt(g,pool.length)];
  for(const id of ids)profile.inventory[id]--;
  profile.coins-=cost;
  addCard(out.id);
  profile.ascensionPity[target]=out.fusionOnly?0:Math.min(2,pity+1);
  profile.ascensionHistory.unshift({level:target,id:out.id,fusion:!!out.fusionOnly,at:Date.now()});
  profile.ascensionHistory=profile.ascensionHistory.slice(0,20);
  if(!saveProfile()){
   Object.assign(profile,{inventory:before.inventory,coins:before.coins,
    unlocked:before.unlocked,fusionOwned:before.fusionOwned,
    unseen:before.unseen,ascensionPity:before.pity,ascensionHistory:before.history});
   return {ok:false,message:'Speichern fehlgeschlagen. Die Karten wurden nicht verbraucht.'};
  }
  return {ok:true,id:out.id,level:target,fusion:!!out.fusionOnly,
   pity:profile.ascensionPity[target],cost,message:'Aufstieg gelungen: '+out.name+' · Lv '+target+'!'};
 }
 const esc=x=>escapeHtml(String(x??''));
 let pickLevel=5,selected=[];
 function renderForge(){
  if(uiMode!=='menu'||menuTab!=='workshop')return;
  const target=$('menuContent');if(!target)return;
  target.querySelector('#ascensionForge116')?.remove();
  const max=cap();
  const box=document.createElement('section');box.className='menu-panel ad116-ascension';
  box.id='ascensionForge116';
  if(!max){
   box.innerHTML='<h2>✦ Aufstiegsschmiede</h2><p>Wird mit dem ersten Turniersieg über <b>V · Vulkanrichter</b> freigeschaltet.</p>';
   target.prepend(box);return;
  }
  const levels=Array.from({length:max-1},(_,i)=>i+1);
  if(!levels.includes(pickLevel))pickLevel=levels.at(-1);
  if(!safeRecipe(selected,pickLevel))selected=suggested(pickLevel)||[];
  const pool=inputPool(pickLevel);
  const options=pool.map(c=>'<option value="'+c.id+'">'+esc(c.name)+' · '+(c.fusionOnly?'Fusion':'Normal')+
   ' · '+freeCopies(c.id)+' freie</option>').join('');
  const select=(i)=>'<label>Material '+(i+1)+'<select data-ad116-material="'+i+'">'+
   '<option value="">— Auswählen —</option>'+pool.map(c=>
   '<option value="'+c.id+'" '+(selected[i]===c.id?'selected':'')+'>'+
   esc(c.name)+' · '+(c.fusionOnly?'Fusion':'Normal')+' · '+freeCopies(c.id)+' frei</option>').join('')+'</select></label>';
  const goal=pickLevel+1,pity=profile.ascensionPity[goal]||0;
  box.innerHTML='<div class="ad116-ascension-head"><span>✦ AUFSTIEG</span><h2>Aufstiegsschmiede</h2>'+
   '<p>Drei freie Karten desselben Levels verschmelzen zu <b>einer</b> Karte der nächsthöheren Stufe. '+
   'Normalmonster: 60 %, Fusionsvorlage: 40 %. Nach zwei normalen Ergebnissen ist die dritte Fusion dieser Zielstufe garantiert. '+
   'ACE-, Quest- und Lieblingskarten sowie Deckexemplare sind geschützt.</p></div>'+
   '<label>Materiallevel<select id="ad116Level">'+levels.map(l=>'<option value="'+l+'" '+(l===pickLevel?'selected':'')+'>Level '+l+' → '+(l+1)+'</option>').join('')+'</select></label>'+
   '<div class="ad116-materials">'+[0,1,2].map(select).join('')+'</div>'+
   '<p class="ad116-price"><b>Ergebnis: Lv '+goal+'</b> · Kosten: '+price(goal)+' Essenz · Glücksschutz: '+pity+'/2</p>'+
   '<p class="ad116-info">Die Schmiede ist eine eigenständige Aufstiegsmethode. Deine bisherige Monsterwerkstatt mit Levelpunkte-Erhaltung bleibt unverändert.</p>'+
   '<button type="button" class="btn primary" data-ad116-forge '+(!safeRecipe(selected,pickLevel)||profile.coins<price(goal)?'disabled':'')+'>✧ Drei Karten verschmelzen</button>';
  target.prepend(box);
 }
 $('menuScreen')?.addEventListener('change',event=>{
  const t=event.target;if(t.id==='ad116Level'){pickLevel=Number(t.value);selected=suggested(pickLevel)||[];renderForge();}
  if(t.matches?.('[data-ad116-material]')){
   selected[Number(t.dataset.ad116Material)]=Number(t.value)||null;
   renderForge();
  }
 });
 $('menuScreen')?.addEventListener('click',event=>{
  if(!event.target.closest?.('[data-ad116-forge]'))return;
  if(!safeRecipe(selected,pickLevel)){toast('Wähle drei freie Karten derselben Stufe.');return;}
  const ids=[...selected],level=pickLevel,goal=level+1,cost=price(goal);
  openModal(modalHtml('✦ AUFSTIEGSSCHMIEDE','Drei Karten dauerhaft verschmelzen','✧',
   'Drei echte Karten werden verbraucht. Das Ergebnis ist zufällig; der Glücksschutz gilt pro Zielstufe.',
   '<p>'+ids.map(id=>esc(CARDS[id].name)+' · Lv '+level).join(' + ')+'</p>'+
   '<p><b>→ Lv '+goal+'</b> · '+cost+' Essenz · 60 % Normal / 40 % Fusion · Schutz: '+
   (profile.ascensionPity[goal]||0)+'/2</p>',
   '<button id="ad116Cancel" class="btn">ABBRECHEN</button>'+
   '<button id="ad116Confirm" class="btn primary">JETZT SCHMIEDEN</button>'));
  $('ad116Cancel').onclick=hideModal;
  $('ad116Confirm').onclick=()=>{
   const result=forge(level,ids);
   hideModal();
   toast(result.message);
   if(result.ok){
    selected=suggested(level)||[];
    renderMenu();
    const c=CARDS[result.id];
    openModal(modalHtml('✧ AUFSTIEG VOLLENDET',result.fusion?'✦ Fusionsvorlage erhalten':'✦ Normales Monster erhalten','✦',
     'Dein neues Monster wurde deiner Sammlung gutgeschrieben.',
     '<div class="ad116-reward">'+fullCardHtml(profileCard(c))+'<h3>'+esc(c.name)+' · Lv '+c.level+'</h3></div>',
     '<button class="btn primary" id="ad116RewardClose">WEITER</button>'));
    $('ad116RewardClose').onclick=hideModal;
   }
  };
 });
 const beforeRender=renderMenu;
 renderMenu=function(...args){
  const r=beforeRender(...args);
  renderForge();
  if(uiMode==='menu'&&highestCleared()>=5&&!profile.ascensionIntroSeen&&!storageConflict){
   profile.ascensionIntroSeen=true;
   if(saveProfile()){
    openModal(modalHtml('✧ DIE AUFSTIEGSSCHMIEDE','Neue Funktion nach Turniergegner V','✦',
     'Du kannst jetzt drei gleichstufige Karten zu einer höherstufigen Karte verschmelzen. '+ 
     'Nach dem Sieg über VI wird auch Level 10 erreichbar. Zwei Fehlschläge in Folge garantieren beim dritten Versuch eine Fusionsvorlage.',
     '<p>Gehe ins Menü <b>Monsterwerkstatt → Aufstiegsschmiede</b>. Deine bereits ausgerüsteten Decks und Favoriten sind geschützt.</p>',
     '<button class="btn primary" id="ad116IntroClose">VERSTANDEN</button>'));
    $('ad116IntroClose').onclick=hideModal;
   }else profile.ascensionIntroSeen=false;
  }
  return r;
 };
 window.ArcaneAscensionForge116=Object.freeze({version:'11.6.0',cap,price,safeRecipe,
  inputPool,outputPool,suggested,forge,renderForge,hydrate});
})();
