-- Run against the real schema. Every fixture row and reward is ROLLED BACK.
BEGIN;
DO $test$
DECLARE
 a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); room uuid := gen_random_uuid();
 token text := md5(random()::text)||md5(random()::text);
 n integer;
BEGIN
 INSERT INTO public.arcane_duo_v2_profiles(id,token_hash,nickname)
 VALUES(a,token,'QA221 rollback reward A'),(b,md5(token)||md5(token||'b'),'QA221 rollback reward B');
 INSERT INTO public.arcane_duo_v2_rooms(id,status,state,host_token_hash,invitation_hash,host_profile_id,guest_profile_id)
 VALUES(room,'active','{"schema":2,"status":"active","chapter":1,"winner":null,"entry":"chapter","duelNo":1}',token,token,a,b);
 UPDATE public.arcane_duo_v2_rooms SET status='finished',state=state||'{"status":"finished","winner":0}' WHERE id=room;
 SELECT count(*) INTO n FROM public.arcane_duo_v2_profiles WHERE id IN(a,b) AND xp=60 AND essence=105 AND shards=2 AND wins=1 AND chapter_card_credits=3;
 IF n<>2 THEN RAISE EXCEPTION 'First win must reward both people exactly once'; END IF;
 -- Reload/repeated persistence and declined post-result invitations must not pay again.
 UPDATE public.arcane_duo_v2_rooms SET updated_at=clock_timestamp() WHERE id=room;
 UPDATE public.arcane_duo_v2_rooms SET status='waiting',state=state||'{"status":"party_ready"}' WHERE id=room;
 UPDATE public.arcane_duo_v2_rooms SET status='finished',state=state||'{"status":"finished"}' WHERE id=room;
 SELECT count(*) INTO n FROM public.arcane_duo_v2_profiles WHERE id IN(a,b) AND xp=60 AND essence=105 AND wins=1;
 IF n<>2 THEN RAISE EXCEPTION 'Reload or declining an invitation duplicated a reward'; END IF;
 -- A genuinely new, accepted and won duel in the SAME room/chapter pays the repeat reward.
 UPDATE public.arcane_duo_v2_rooms SET status='active',state=state||'{"status":"active","winner":null,"duelNo":2}' WHERE id=room;
 UPDATE public.arcane_duo_v2_rooms SET status='finished',state=state||'{"status":"finished","winner":0}' WHERE id=room;
 SELECT count(*) INTO n FROM public.arcane_duo_v2_profiles WHERE id IN(a,b) AND xp=90 AND essence=147 AND shards=3 AND wins=2 AND chapter_card_credits=3;
 IF n<>2 THEN RAISE EXCEPTION 'Second completed duel must pay only the repeat reward to both people'; END IF;
 UPDATE public.arcane_duo_v2_rooms SET updated_at=clock_timestamp() WHERE id=room;
 SELECT count(*) INTO n FROM public.arcane_duo_v2_reward_ledger WHERE room_id=room;
 IF n<>4 THEN RAISE EXCEPTION 'Exactly four personal receipts expected for two completed duels'; END IF;
END
$test$;
ROLLBACK;
SELECT 'DUO_REWARDS_221_PASS: two independent first rewards, idempotent reload/decline, separate repeat receipts; all fixture data rolled back' AS result;
