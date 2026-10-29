-- Arcane Duel 2v2: independent server-owned progression, never imported from solo.
-- All tables remain private to Edge service-role, with RLS and no anon grants.
create table if not exists public.arcane_duo_v2_profiles (
 id uuid primary key,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 revision bigint not null default 0 check(revision>=0),
 token_hash text not null unique check(length(token_hash)=64),
 creator_fingerprint text,
 nickname text not null default 'Duellant' check(length(nickname)<=32),
 xp integer not null default 0 check(xp>=0),
 essence integer not null default 0 check(essence>=0),
 shards integer not null default 0 check(shards>=0),
 wins integer not null default 0 check(wins>=0),
 cleared_chapters integer[] not null default '{}',
 owned_main jsonb not null default '[]'::jsonb check(jsonb_typeof(owned_main)='array'),
 owned_fusions jsonb not null default '[]'::jsonb check(jsonb_typeof(owned_fusions)='array'),
 deck jsonb not null default '[]'::jsonb check(jsonb_typeof(deck)='array'),
 fusions jsonb not null default '[]'::jsonb check(jsonb_typeof(fusions)='array'),
 upgrades jsonb not null default '{}'::jsonb check(jsonb_typeof(upgrades)='object'),
 enhancements jsonb not null default '{}'::jsonb check(jsonb_typeof(enhancements)='object'),
 essence_binding jsonb not null default '{}'::jsonb check(jsonb_typeof(essence_binding)='object'),
 lv1_research jsonb not null default '{}'::jsonb check(jsonb_typeof(lv1_research)='object')
);
create index if not exists arcane_duo_v2_profile_limit_idx
 on public.arcane_duo_v2_profiles(creator_fingerprint, created_at desc);
alter table public.arcane_duo_v2_profiles enable row level security;
revoke all on public.arcane_duo_v2_profiles from public, anon, authenticated;
grant select,insert,update on public.arcane_duo_v2_profiles to service_role;
alter table public.arcane_duo_v2_rooms
 add column if not exists host_profile_id uuid references public.arcane_duo_v2_profiles(id),
 add column if not exists guest_profile_id uuid references public.arcane_duo_v2_profiles(id),
 add column if not exists updated_at timestamptz not null default now();
create index if not exists arcane_duo_v2_rooms_host_profile_idx
 on public.arcane_duo_v2_rooms(host_profile_id,updated_at desc);
create index if not exists arcane_duo_v2_rooms_guest_profile_idx
 on public.arcane_duo_v2_rooms(guest_profile_id,updated_at desc);
create table if not exists public.arcane_duo_v2_reward_ledger (
 profile_id uuid not null references public.arcane_duo_v2_profiles(id) on delete cascade,
 room_id uuid not null references public.arcane_duo_v2_rooms(id) on delete cascade,
 chapter integer not null check(chapter between 1 and 4),
 xp integer not null check(xp>0),
 essence integer not null check(essence>0),
 shards integer not null check(shards>0),
 awarded_at timestamptz not null default now(),
 primary key(profile_id, room_id, chapter)
);
create index if not exists arcane_duo_v2_reward_ledger_room_idx
 on public.arcane_duo_v2_reward_ledger(room_id);
alter table public.arcane_duo_v2_reward_ledger enable row level security;
revoke all on public.arcane_duo_v2_reward_ledger from public, anon, authenticated;
grant select,insert on public.arcane_duo_v2_reward_ledger to service_role;
create or replace function public.arcane_duo_v2_award_on_win()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
 v_chapter integer;
 v_profile uuid;
 v_xp integer;
 v_essence integer;
 v_shards integer;
 v_inserted integer;
begin
 if new.status <> 'finished' or (new.state->>'winner') <> '0'
  or old.status = 'finished' or new.host_profile_id is null
  or new.guest_profile_id is null then
  return new;
 end if;
 v_chapter := (new.state->>'chapter')::integer;
 if v_chapter not between 1 and 4 then return new; end if;
 v_xp := 40 + 20 * v_chapter;
 v_essence := 70 + 35 * v_chapter;
 v_shards := 1 + v_chapter;
 foreach v_profile in array array[new.host_profile_id,new.guest_profile_id] loop
  if v_profile is null then continue; end if;
  insert into public.arcane_duo_v2_reward_ledger(profile_id,room_id,chapter,xp,essence,shards)
   values(v_profile,new.id,v_chapter,v_xp,v_essence,v_shards)
   on conflict do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted > 0 then
   update public.arcane_duo_v2_profiles p set
    xp = p.xp + v_xp,
    essence = p.essence + v_essence,
    shards = p.shards + v_shards,
    wins = p.wins + 1,
    cleared_chapters = (select array_agg(distinct n order by n)
     from unnest(p.cleared_chapters || array[v_chapter]) as n),
    revision = p.revision + 1,
    updated_at = now()
   where p.id = v_profile;
  end if;
 end loop;
 return new;
end
$$;
revoke all on function public.arcane_duo_v2_award_on_win() from public, anon, authenticated;
grant execute on function public.arcane_duo_v2_award_on_win() to service_role;
drop trigger if exists arcane_duo_v2_earned_rewards on public.arcane_duo_v2_rooms;
create trigger arcane_duo_v2_earned_rewards
after update of state, status on public.arcane_duo_v2_rooms
for each row execute function public.arcane_duo_v2_award_on_win();
comment on table public.arcane_duo_v2_profiles is
 'Private 2v2-only progression: no Solo save import/export, all changes via Edge service role';
comment on table public.arcane_duo_v2_reward_ledger is
 'Atomic, duplicate-resistant rewards for winning an online 2v2 chapter';
