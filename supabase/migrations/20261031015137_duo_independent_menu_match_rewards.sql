-- Each accepted duel in a persistent party has its own idempotency key.
-- Existing receipts remain duel 1. Reward amounts, daily cap and Saga ranks are preserved.
ALTER TABLE public.arcane_duo_v2_reward_ledger ADD COLUMN duel_no integer NOT NULL DEFAULT 1 CHECK (duel_no >= 1);
ALTER TABLE public.arcane_duo_v2_reward_ledger DROP CONSTRAINT arcane_duo_v2_reward_ledger_pkey;
ALTER TABLE public.arcane_duo_v2_reward_ledger ADD PRIMARY KEY (profile_id,room_id,chapter,duel_no);

CREATE OR REPLACE FUNCTION public.arcane_duo_v2_award_on_win()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
 v_chapter integer;
 v_duel integer;
 v_tier integer;
 v_profile uuid;
 v_clear integer[];
 v_first boolean;
 v_xp integer;
 v_essence integer;
 v_shards integer;
 v_inserted integer;
 v_daily integer;
begin
 if new.status <> 'finished' or (new.state->>'winner') <> '0'
  or coalesce(old.state->>'status','') <> 'active' or new.host_profile_id is null
  or new.guest_profile_id is null then
  return new;
 end if;
 v_chapter := (new.state->>'chapter')::integer;
 v_duel := greatest(1,coalesce((new.state->>'duelNo')::integer,1));
 if v_chapter not between 1 and 15 then return new; end if;
 -- A won match only clears a saga stage if its battle objective was fulfilled.
 if v_chapter >= 11 and (
  coalesce(new.state->>'entry','') <> 'quest' or
  coalesce((new.state->>'questPassed')::boolean,false) is not true
 ) then return new; end if;
 v_tier := case when v_chapter >= 11 then v_chapter-8 else v_chapter end;
 for v_profile in
  select distinct pid from unnest(array[new.host_profile_id,new.guest_profile_id]) as t(pid)
  where pid is not null order by pid
 loop
  select coalesce(cleared_chapters,'{}') into v_clear
  from public.arcane_duo_v2_profiles where id=v_profile for update;
  if not found then continue; end if;
  v_first := not (v_chapter = any(v_clear));
  if v_first then
   v_xp := 40+20*v_tier;
   v_essence := 70+35*v_tier;
   v_shards := 1+v_tier;
  else
   select count(*) into v_daily from public.arcane_duo_v2_reward_ledger
   where profile_id=v_profile and chapter=v_chapter
    and awarded_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC'
    and xp = (40+20*v_tier)/2;
   if v_daily>=3 then continue; end if;
   v_xp := (40+20*v_tier)/2;
   v_essence := greatest(1,floor((70+35*v_tier)*0.4)::integer);
   v_shards := 1;
  end if;
  insert into public.arcane_duo_v2_reward_ledger(profile_id,room_id,chapter,duel_no,xp,essence,shards)
   values(v_profile,new.id,v_chapter,v_duel,v_xp,v_essence,v_shards)
   on conflict do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted>0 then
   update public.arcane_duo_v2_profiles p set
    xp=p.xp+v_xp,essence=p.essence+v_essence,
    shards=p.shards+v_shards,wins=p.wins+1,
    chapter_card_credits=p.chapter_card_credits+case when v_first then 3 else 0 end,
    cleared_chapters=(select array_agg(distinct n order by n)
     from unnest(p.cleared_chapters||array[v_chapter]) as n),
    -- Every successfully completed Fanatiker stage grants its Lv1 research rank
    -- to BOTH team profiles; the first stage also supplies the three templates.
    lv1_research=case when v_chapter between 11 and 15 then
     jsonb_set(coalesce(p.lv1_research,'{}'::jsonb)||'{"perk":true}'::jsonb,'{rank}',
      to_jsonb(greatest(v_chapter-10,coalesce((p.lv1_research->>'rank')::integer,0))),true)
     else p.lv1_research end,
    owned_fusions=case when v_chapter=11 and v_first then
     p.owned_fusions||coalesce((
      select jsonb_agg(n.id order by n.id) from (values(711),(712),(713)) as n(id)
      where not p.owned_fusions @> jsonb_build_array(n.id)
     ),'[]'::jsonb) else p.owned_fusions end,
    fusions=case when v_chapter=11 and v_first then
     p.fusions||coalesce((
      select jsonb_agg(t.id order by t.id) from (
       select n.id from (values(711),(712),(713)) as n(id)
       where not p.fusions @> jsonb_build_array(n.id)
       order by n.id limit greatest(0,15-jsonb_array_length(p.fusions))
      ) as t
     ),'[]'::jsonb) else p.fusions end,
    revision=p.revision+1,updated_at=now()
   where p.id=v_profile;
  end if;
 end loop;
 return new;
end
$function$
;
REVOKE ALL ON FUNCTION public.arcane_duo_v2_award_on_win() FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.arcane_duo_v2_award_on_win() TO service_role;
