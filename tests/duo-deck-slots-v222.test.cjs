'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const slots=require('../assets/duo-deck-slots-v222.js');
const rules=require('../assets/duo-shared-rules-v160.js');
const economy=require('../assets/duo-economy-v172.js');
const pack=require('../assets/duo-card-catalog-v160.json');
const {fixture}=require('./helpers/duo-online-fixture-v221.cjs');
const catalog=Object.fromEntries(pack.cards.map(c=>[c.id,c]));
const profile=()=>({deck:[...pack.starterMain],fusions:[...pack.starterFusions],
 deck_slots:[],active_deck_slot:0,owned_main:[...pack.starterMain,1],
 owned_fusions:[...pack.starterFusions],enhancements:{},upgrades:{},essence_binding:{},lv1_research:{}});
test('new and existing profiles start with three independent copies of their active deck',()=>{
 const p=profile(),out=slots.slots(p);
 assert.equal(out.length,3);assert.deepEqual(out[0].main,p.deck);
 out[1].main[0]=1;assert.notEqual(out[0].main[0],out[1].main[0]);
 assert.equal(p.deck_slots.length,0);assert.deepEqual(p.deck,pack.starterMain);
 assert.equal(fs.readFileSync(require.resolve('../assets/duo-deck-slots-v222.js'),'utf8'),
  fs.readFileSync(require.resolve('../supabase/functions/arcane-duo-v2/duo-deck-slots-v222.js'),'utf8'));
});
test('the first deck edit does not silently alter either other variant',()=>{
 const f=fixture(),created=f.handle({type:'profileCreate',name:'Duellant'});
 const edited=f.handle({type:'deckReplace',profileToken:created.profileToken,
  expectedRevision:0,zone:'main',slot:0,cardId:1}).profile;
 assert.equal(edited.deckSlots[0].main[0],1);
 assert.equal(edited.deckSlots[1].main[0],0);
 assert.equal(edited.deckSlots[2].main[0],0);
});
test('copy and switch retain separate variants, upgrades and owned-card validation',()=>{
 let p=profile();p.enhancements={'0':3};
 Object.assign(p,slots.operation(p,'deckSlotCopy',1,catalog,rules));
 p.deck[0]=1;assert.equal(slots.slots(p)[1].main[0],0);
 Object.assign(p,slots.operation(p,'deckSlotSelect',1,catalog,rules));
 assert.equal(p.active_deck_slot,1);assert.equal(p.deck[0],0);
 assert.equal(p.enhancements['0'],3);
 Object.assign(p,slots.operation(p,'deckSlotSelect',0,catalog,rules));
 assert.equal(p.deck[0],1);assert.equal(p.enhancements['0'],3);
 p.owned_main=p.owned_main.filter(id=>id!==0);
 assert.throws(()=>slots.operation(p,'deckSlotSelect',1,catalog,rules),/verfügbare/);
 assert.throws(()=>slots.operation(p,'deckSlotCopy',9,catalog,rules),/Deckplatz/);
});
test('cards used in any saved variant cannot be recycled out from under it',()=>{
 const p=profile();Object.assign(p,slots.operation(p,'deckSlotCopy',1,catalog,rules));
 p.deck[0]=1;p.deck[1]=1; // Two fewer copies of 0 in active deck.
 assert.equal(economy.recycleOffer(p,0,catalog),null);
 p.owned_main.push(0);
 assert.equal(economy.recycleOffer(p,0,catalog).spare,1);
});
test('two profiles use their own variants and changing a deck does not change an active duel',()=>{
 const s=fixture(),host=s.handle({type:'profileCreate',name:'Host'}),guest=s.handle({type:'profileCreate',name:'Gast'});
 const change=(token,rev,type,extra={})=>s.handle({type,profileToken:token,expectedRevision:rev,...extra});
 let h=change(host.profileToken,0,'deckSlotCopy',{slot:1});
 h=change(host.profileToken,h.profile.revision,'deckReplace',{zone:'main',slot:0,cardId:1});
 const other=s.handle({type:'profile',profileToken:guest.profileToken});
 assert.equal(other.profile.activeDeckSlot,0);assert.deepEqual(other.profile.deck,pack.starterMain);
 const room=s.handle({type:'create',profileToken:host.profileToken,personalDuoRules:true});
 const joined=s.handle({type:'join',profileToken:guest.profileToken,roomId:room.roomId,invite:room.invite});
 const invite=s.handle({type:'action',roomId:room.roomId,token:room.token,expectedRevision:joined.state.revision,action:{type:'requestDuel',chapter:1}});
 s.handle({type:'action',roomId:room.roomId,token:joined.token,expectedRevision:invite.state.revision,action:{type:'acceptPartyStart',inviteId:invite.state.partyStartInvite.id}});
 const combat=s.rooms.get(room.roomId).game,original=[...combat.players[0].baseDeck];
 h=change(host.profileToken,h.profile.revision,'deckSlotSelect',{slot:1});
 assert.notDeepEqual(h.profile.deck,original);
 assert.deepEqual(combat.players[0].baseDeck,original);
 assert.deepEqual(s.handle({type:'profile',profileToken:guest.profileToken}).profile.deck,other.profile.deck);
});
