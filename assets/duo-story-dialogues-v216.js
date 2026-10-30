/* Arcane Duel v21.6 · Two-voice boss introductions.
 * UI only. State is read-only; no combat action or server timer is touched.
 * Stable session key shows appearances once for each participant and chapter.
 */
'use strict';
((root)=>{
 const portraits=root.ArcanePortraits215;
 if(!portraits||typeof document==='undefined')return;
 const EIMAN='Eiman Huel Stalker',HANS='Hans Ess Kirk';
 const FIRST='Der Level-1-Fanatiker',SECOND='Fanatikers Adept';
 const BOSS=[
  {seat:1,mood:'DER FINSTERE MAGIER',text:'Du hast es also bis hierher geschafft. Diese Kreaturen kennen nur einen Willen: meinen. Und jetzt wirst du verstehen, warum.'},
  {seat:3,mood:'DER ROTE MAGIER',text:'Heh! Die Bühne gehört nicht dir allein, Eiman. Mein Blut kocht schon. Ein bisschen Todesschrecken sollte unsere Gäste willkommen heißen.'},
  {seat:1,mood:'EIN GESCHLOSSENES BÜNDNIS',text:'Hans, überlass mir ihre Verteidigung. Sobald ich ihre Monster gebrochen habe, gehört dir der Rest.'},
  {seat:3,mood:'GEMEINSAM UNAUFHALTSAM',text:'Hand in Hand, alter Freund. Du bindest ihre Seelen, ich feiere ihren Untergang. Zwei Magier, ein Urteil!'}
 ];
 const QUESTS=[
 [
  {seat:1,mood:'HOFFNUNG',text:'Wir haben es gefunden! Hier beginnt die wahre Forschung. Diese kleinen Kreaturen bergen ein Geheimnis, das noch niemand versteht.'},
  {seat:3,mood:'NEUGIER',text:'Deine Berechnungen sind kühn. Ich habe die Höhlenaufzeichnungen entziffert. Vielleicht gelingt uns gemeinsam der Durchbruch.'},
  {seat:1,mood:'DER ERSTE VERSUCH',text:'Wir müssen jede Reaktion beobachten. Selbst ein winziger Funke könnte unsere Theorie beweisen.'},
  {seat:3,mood:'EIN VERSPRECHEN',text:'Dann wagen wir es. Möge dieses Duell der erste Schritt zu etwas Großem sein.'}
 ],
 [
  {seat:1,mood:'UNRUHE',text:'Siehst du? Die Monster verschwinden, aber ihre Spuren bleiben! Warum gehorchen sie uns nicht so, wie sie sollten?'},
  {seat:3,mood:'ZWEIFEL',text:'Meine Messungen widersprechen einander. Vielleicht betrachten wir den Vorgang noch immer aus dem falschen Winkel.'},
  {seat:1,mood:'ERSTER ZORN',text:'Falscher Winkel?! Dann müssen wir eben genauer hinsehen. Dieses Rätsel wird uns keine Ruhe lassen!'},
  {seat:3,mood:'BESCHLOSSENE FORTSETZUNG',text:'Gut. Wir wiederholen alles – solange, bis die Zahlen endlich zu unseren Erwartungen passen.'}
 ],
 [
  {seat:1,mood:'BESESSENHEIT',text:'Es wächst, es vervielfältigt sich! Mein Schwarm wird beweisen, dass ich recht hatte. Ich brauche nur noch einen Versuch!'},
  {seat:3,mood:'ÜBERGANG',text:'Ich habe seit Tagen kaum geschlafen. Trotzdem sehe ich in jeder neuen Kopie dieselbe Möglichkeit.'},
  {seat:1,mood:'FORSCHUNGSWUT',text:'Du verstehst es! Wir dürfen jetzt nicht zurückweichen. Was klein beginnt, wird größer als alles vor uns.'},
  {seat:3,mood:'GETEILTER EHRGEIZ',text:'Dann führe ich die Aufzeichnungen. Und du zeigst ihnen, wozu unsere Monster geworden sind.'}
 ],
 [
  {seat:1,mood:'VERBOTENES WISSEN',text:'Sie nennen es unmöglich, Monster dieser Stufe zu verschmelzen. Wir werden ihre Regeln zerbrechen.'},
  {seat:3,mood:'DUNKLE BEGEISTERUNG',text:'Ihre Warnungen hängen immer noch an den Höhlenwänden. Ich habe sie verbrannt. Sie hielten uns nur auf.'},
  {seat:1,mood:'VERACHTUNG',text:'Sie fürchten nur, was sie nicht kontrollieren können. Ich fürchte gar nichts mehr.'},
  {seat:3,mood:'DIE LETZTE GRENZE',text:'Dann lassen wir die Fusionskammer offen. Was auch herauskommt, es wird unser Werk sein.'}
 ],
 [
  {seat:1,mood:'LETZTE BESCHEIDENHEIT VERLOREN',text:'Fünf Prüfungen, endlose Nächte! Ihr habt keine Ahnung, was wir geopfert haben. Heute werden unsere Forschungen vollendet.'},
  {seat:3,mood:'MANISCHE ENTSCHLOSSENHEIT',text:'Ich höre die Maschinen selbst im Schlaf. Aber sie flüstern nur noch eines: Wir dürfen nicht verlieren.'},
  {seat:1,mood:'HASS',text:'Wenn ihr meine Erkenntnisse zurückweist, werde ich euch ihren Wert mit jeder einzelnen Kreatur einbrennen!'},
  {seat:3,mood:'LETZTER PAKT',text:'Dann stehen wir ein letztes Mal Seite an Seite. Kein Rückzug, keine Zweifel – nur das Ergebnis.'}
 ]
 ];
 const scene=chapter=>chapter===10?BOSS:chapter>=11&&chapter<=15?QUESTS[chapter-11]:[];
 const fixedName=(chapter,seat,players)=>{
  if(players?.[seat]?.name)return players[seat].name;
  if(chapter===10)return seat===1?EIMAN:HANS;
  return seat===1?FIRST:SECOND;
 };
 let queue=[],active=false,host=null,currentKey='';
 function cleanup(){host?.remove();host=null;active=false;currentKey='';}
 function step(){
  if(!host)return;
  const item=queue.shift();
  if(!item){cleanup();return;}
  const card=host.querySelector('.ad216-dialog-card');
  card.replaceChildren();
  const tag=document.createElement('p');tag.className='ad216-kicker';
  tag.textContent='✦ AUFTRITT · '+item.mood;card.append(tag);
  const picture=document.createElement('div');picture.className='ad216-picture';
  picture.append(portraits.node(portraits.duoOpponent(item.chapter,item.seat),item.name));
  card.append(picture);
  const title=document.createElement('h2');title.textContent=item.name;card.append(title);
  const line=document.createElement('p');line.className='ad216-speech';line.textContent='„'+item.text+'“';
  card.append(line);
  const footer=document.createElement('div');footer.className='ad216-footer';
  const progress=document.createElement('span');progress.textContent=item.number+' / '+item.total;
  footer.append(progress);
  const controls=document.createElement('div');controls.className='ad216-buttons';
  const skip=document.createElement('button');skip.type='button';skip.textContent='Dialog überspringen';
  skip.addEventListener('click',cleanup);
  const next=document.createElement('button');next.type='button';next.className='ad216-primary';
  next.textContent=queue.length?'WEITER →':'DUELL ANSEHEN';
  next.addEventListener('click',step);controls.append(skip,next);footer.append(controls);
  card.append(footer);next.focus();
 }
 function begin(chapter,players,key){
  if(active)return false;
  const lines=scene(chapter);
  if(!lines.length)return false;
  currentKey=key;active=true;
  queue=lines.map((line,i)=>({...line,chapter,name:fixedName(chapter,line.seat,players),number:i+1,total:lines.length}));
  host=document.createElement('section');host.className='ad216-dialog-overlay';
  host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');
  host.setAttribute('aria-label','Story-Auftritt der gegnerischen Duellanten');
  const card=document.createElement('div');card.className='ad216-dialog-card';host.append(card);
  document.body.append(host);step();return true;
 }
 function onState(previous,current,viewerSeat,roomId){
  if(!current||current.status!=='active'||![0,2].includes(viewerSeat)||
   ![10,11,12,13,14,15].includes(current.chapter)||!roomId||!current.players?.[3])return;
  // This key is local per browser: both players see the same introduction once.
  const key='arcane-duo-story-216:'+roomId+':'+current.chapter;
  try{if(sessionStorage.getItem(key)==='shown')return;
   sessionStorage.setItem(key,'shown');}
  catch{if(currentKey===key)return;}
  begin(current.chapter,current.players,key);
 }
 root.ArcaneDuoStory216=Object.freeze({version:'21.6',scene,onState,begin});
})(typeof window!=='undefined'?window:globalThis);
