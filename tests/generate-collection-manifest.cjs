'use strict';
// Use the complete production script order, including all art waves and family mappings.
const {writeFileSync}=require('node:fs'),path=require('node:path');
const {boot,repo}=require('./helpers/game-runtime.cjs');
const cards=boot().run('UPDATE_B_ACTIVE_IDS.map(id=>CARDS[id]).map(c=>({id:c.id,name:c.name,level:c.level,kind:c.kind,element:c.element,fusion:!!c.fusionOnly,manifestOf:c.manifestOf??null,variantOf:c.variantOf??c.lineRoot??null,art:c.art?.startsWith("assets/")?c.art:null}))');
for(const c of cards)if(c.variantOf===c.id)c.variantOf=null;
writeFileSync(path.join(repo,'assets/collection-v3-data.js'),'/* Generated from the complete current game catalog; run node tests/generate-collection-manifest.cjs. */\nwindow.ARCANE_COLLECTION_V3='+JSON.stringify(cards)+';\n');
console.log('Updated '+cards.length+' collectible cards, '+cards.filter(c=>!c.art).length+' missing artworks.');
