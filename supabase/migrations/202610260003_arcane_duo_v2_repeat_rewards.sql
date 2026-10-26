-- v17.3: one-time chapter clearance rewards + controlled repeat-run rewards.
-- No new public data API permissions; remains SECURITY INVOKER, service-role only.
create or replace function public.arcane_duo_v2_award_on_win()
returns trigger language plpgsql security invoker
set search_path = public, pg_temp
as $$
declare
 v_chapter integer;
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
  or old.status = 'finished' or new.host_profile_id is null
  or new.guest_profile_id is null then
  return new;
 end if;
 v_chapter := (new.state->>'chapter')::integer;
 if v_chapter not between 1 and 4 then return new; end if;
 -- Stable lock order protects parallel rewards when teammates swap seats.
 for v_profile in
  select distinct x from unnest(array[new.host_profile_id,new.guest_profile_id]) as x
  where x is not null order by x
 loop
  select coalesce(cleared_chapters,'{}') into v_clear
  from public.arcane_duo_v2_profiles
  where id=v_profile for update;
  if not found then continue; end if;
  v_first := not (v_chapter = any(v_clear));
  if v_first then
   v_xp := 40+20*v_chapter;
   v_essence := 70+35*v_chapter;
   v_shards := 1+v_chapter;
  else
   -- Maximum three repeat payouts per chapter and UTC day, across all rooms.
   select count(*) into v_daily from public.arcane_duo_v2_reward_ledger
   where profile_id=v_profile and chapter=v_chapter
    and awarded_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC'
    and xp = (40+20*v_chapter)/2;
   if v_daily >= 3 then continue; end if;
   v_xp := (40+20*v_chapter)/2;
   v_essence := greatest(1,floor((70+35*v_chapter)*0.4)::integer);
   v_shards := 1;
  end if;
  insert into public.arcane_duo_v2_reward_ledger(profile_id,room_id,chapter,xp,essence,shards)
   values(v_profile,new.id,v_chapter,v_xp,v_essence,v_shards)
   on conflict do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted > 0 then
   update public.arcane_duo_v2_profiles p set
    xp=p.xp+v_xp,essence=p.essence+v_essence,
    shards=p.shards+v_shards,wins=p.wins+1,
    cleared_chapters=(select array_agg(distinct n order by n)
     from unnest(p.cleared_chapters||array[v_chapter]) as n),
    revision=p.revision+1,updated_at=now()
   where p.id=v_profile;
  end if;
 end loop;
 return new;
end
$$;
revoke all on function public.arcane_duo_v2_award_on_win() from public, anon, authenticated;
grant execute on function public.arcane_duo_v2_award_on_win() to service_role;
