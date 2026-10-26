'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const file=name=>fs.readFileSync(path.resolve(__dirname,'..',name),'utf8');
const script=file('assets/duo-parity-v160.js');
const endpoint=file('supabase/functions/arcane-duo-v2/index.ts');
const html=file('duo-campaign-v2.html');
const ddl=file('supabase/migrations/202610260002_arcane_duo_v2_independent_progress.sql');
const rules=require('../assets/duo-shared-rules-v160.js');
const data=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(data.cards.map(c=>[c.id,c]));
test('solo and duo progression have hard independent storage namespaces',()=>{
 assert.ok(script.includes('arcane-duel-duo-v171-profile-key'));
 assert.ok(!script.includes('arcane-duel-rpg-profile-v4-reborn'));
 assert.ok(!script.includes('localStorage.getItem(\'arcane-duel-rpg'));
 assert.ok(script.includes("type:'profileCreate'"));
 assert.ok(html.includes('Es gibt keinen Import'));
 assert.ok(!html.includes('aus deinem Singleplayer-Profil gelesen'));
});
test('fresh 2v2 creates rooms only using authenticated server profile decks',()=>{
 assert.ok(endpoint.includes('const p=await profileByToken(body.profileToken)'));
 assert.ok(endpoint.includes('hostDeck:p.deck,hostFusions:p.fusions'));
 assert.ok(endpoint.includes('deck:p.deck,fusions:p.fusions'));
 assert.ok(!endpoint.includes('hostDeck:body.deck'));
 assert.ok(!endpoint.includes('deck:body.deck'));
 assert.ok(!endpoint.includes('hostUpgrades:body.upgrades'));
 assert.ok(!endpoint.includes('upgrades:body.upgrades'));
});
test('cards, active decks and upgrade rank caps are restricted server-side',()=>{
 assert.ok(endpoint.includes('inventoryAllows(deck,'));
 assert.ok(endpoint.includes('game.validDeck(deck,catalog,fusion)'));
 assert.ok(endpoint.includes('game.PERK_LIMITS[body.key]'));
 assert.ok(endpoint.includes('expectedRevision===p.revision'));
 assert.ok(endpoint.includes('snapshot.cards.filter(c=>c.playable'));
 assert.ok(rules.validDeck(data.starterMain,catalog));
 assert.ok(rules.validDeck(data.starterFusions,catalog,true));
});
test('progress and chapter rewards have private ownership and atomic idempotence',()=>{
 assert.ok(ddl.includes('enable row level security'));
 assert.ok(ddl.includes('revoke all on public.arcane_duo_v2_profiles'));
 assert.ok(ddl.includes('primary key(profile_id, room_id, chapter)'));
 assert.ok(ddl.includes('on conflict do nothing'));
 assert.ok(ddl.includes('after update of state, status'));
 assert.ok(ddl.includes("new.state->>'winner'"));
});
test('duo rooms are recoverable by private profile, do not rely on solo storage',()=>{
 assert.ok(endpoint.includes('host_profile_id:p.id'));
 assert.ok(endpoint.includes('guest_profile_id:p.id'));
 assert.ok(endpoint.includes('90*86400000'));
 assert.ok(script.includes("type:'profile',profileToken:duoProfileToken"));
 assert.ok(script.includes('continueLastRoom('));
});
test('exactly two humans vs two AI seats remain unchanged',()=>{
 assert.deepEqual(rules.seats.map(x=>x.kind),['human','ai','human','ai']);
});
