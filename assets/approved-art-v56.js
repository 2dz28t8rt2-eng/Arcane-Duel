/* Arcane Duel v5.6 – five approved new illustrations. */
'use strict';
(()=>{
const expected=[
  [46,"Eibenwächter",'assets/custom-art/qa/eibenwaechter.webp'],
  [49,"Eisenzahn",'assets/custom-art/qa/eisenzahn.webp'],
  [50,"Bastion Ferrus",'assets/custom-art/qa/bastion-ferrus.webp'],
  [54,"Rubin-Seraph",'assets/custom-art/qa/rubin-seraph.webp'],
  [58,"Waldgeist Veyra",'assets/custom-art/qa/waldgeist-veyra.webp'],
];
for(const [id,name,art] of expected){
  if(CARDS[id]?.name!==name||!CARDS[id].fusionOnly)
    throw Error('Freigegebenes Artwork: Karten-ID oder Name abweichend: '+id);
  CARDS[id].art=art;CARDS[id].customArt=art;CARDS[id].artWave='approved-5.6';
}
window.ArcaneApprovedArt56=Object.freeze({version:'5.6',count:expected.length});
})();
