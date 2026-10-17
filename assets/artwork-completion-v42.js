/* Original illustrated motifs, stable IDs and unchanged combat values. */
'use strict';
(()=>{
 const entries=[
  [77,'glyphenjaeger','Glyphenjäger','Zwischen zerbrochenen Glyphen spannt er einen Bogen aus Licht. Als Fusionsvorlage ist er auf Angriff ausgerichtet.'],
  [78,'chronosgeist','Chronosgeist','In seiner Sanduhr sammeln sich die letzten Augenblicke vergangener Duelle. Dieser Seelenzehrer nährt sich in Verteidigungsposition von gegnerischen Werten.'],
  [390,'eisenfunke','Eisenfunke','Ein verlorener Schmiedefunke hält diese schwere Eisenrüstung am Leben. Kael Ardents erdgebundene Gegnerfusion.'],
  [391,'dornenklinge','Dornenklinge','Mit jedem Satz schneiden seine dornigen Geweihe neue Pfade durch den Hain. Eine Gegnerfusion von Rin Wilder.'],
  [392,'hainwacht','Hainwacht','Unter seinem belaubten Geweih findet der stille Hain Schutz. Eine erdgebundene Gegnerfusion von Rin Wilder.'],
  [393,'wurzelwolf','Wurzelwolf','Wo sein Rudel längst verstummt ist, jagen Wurzeln in Wolfsgestalt weiter. Eine Gegnerfusion von Rin Wilder.'],
  [394,'kronenhirsch','Kronenhirsch','Der alte Wald trägt seine Krone nicht aus Gold, sondern aus lebendem Geweih. Eine Gegnerfusion von Rin Wilder.'],
  [395,'schildholz','Schildholz','Dicht geschichtete Eichenplatten schützen das grüne Herz dieses Waldwesens. Eine Gegnerfusion von Rin Wilder.'],
  [396,'reisszahn','Essenzbestie · Reißzahn','Unter schwarzem Fell glimmt die Essenz deiner Bindung. Seine langen Fänge und sein eigener Jagdinstinkt machen Reißzahn zum treuen Predator.'],
  [398,'aschenhort','Essenzbestie · Aschenhort','Zwischen alten Herdsteinen bewahrt Aschenhort ein leuchtendes Herz. Dieses erdgebundene Essenzwesen gehört zu den Wächtern.'],
  [575,'frostklingen-greif','Frostklingen-Greif','Seine eishellen Federn schneiden durch den Sturm. Dieser schnelle Predator beherrscht die Winde über den zerfallenen Bergbrücken.'],
  [587,'basalt-rammbock','Basalt-Rammbock','Schicht um Schicht trägt er das Gewicht eines ganzen Berges. Als Wächter hält dieser steinerne Widder die Stellung.'],
  [599,'schattenegel','Schattenegel der Tiefen','Unter dem schwarzen Wasser wartet ein lautloser Hunger. In Verteidigungsposition entzieht dieser Seelenzehrer gegnerischen Monstern Kraft.'],
  [611,'glutjaeger','Glutjäger der Dünen','Seine Pfoten hinterlassen glühende Spuren im kalten Wüstensand. Ein Feuer-Predator, der im Zwielicht auf die Jagd geht.'],
  [623,'runenkroete','Runenkröte des Moores','Jeder Tropfen auf ihrer Haut trägt ein Stück vergessener Magie. Als Runenweber verbindet sie die Wasser des Moores.'],
  [671,'spiegelmotte','Spiegelmotte','In ihren schimmernden Flügeln liegt das Licht einer versunkenen Kathedrale. Als Unterstützerin hilft sie ihren Gefährten aus dem Schutz der Verteidigung.'],
  [113,'seelenbeisser','Seelenbeißer','Zwischen zerbrochenen Säulen jagt dieser Schattenwolf den verlorenen Seelen nach. Eine alte, seltene Fusionsvorlage.']
 ];
 const assigned=[];
 for(const [id,key,name,desc] of entries){
  const family=[575,587,599,611,623,671].includes(id);
  const cards=CARDS.filter(c=>c&&(c.id===id||(family&&(c.lineRoot===id||c.variantOf===id))||(id===113&&c.manifestOf===113)));
  for(const c of cards){c.art='assets/custom-art/generated-4-2/'+key+'.webp';c.customArt=c.art;c.artWave='4.2';c.name=c.manifestOf===113?name+' · Gestalt':name;c.desc=c.manifestOf===113?'Normal beschwörbare Gestalt. '+desc:desc;if(c.id===393)c.kind='wolf';assigned.push(c.id);}
 }
 window.ArcaneArtworkCompletion=Object.freeze({version:'4.2',motifs:entries.length,assigned:Object.freeze(assigned)});
})();
