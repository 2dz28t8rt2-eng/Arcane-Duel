-- 2v2 ruleset v16.0 is intentionally isolated from existing v15.8 rooms.
-- Only the Edge Function service-role client may read private hands/decks.
create table if not exists public.arcane_duo_v2_rooms (
  id uuid primary key,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '48 hours'),
  status text not null default 'waiting' check (status in ('waiting','active','finished')),
  revision bigint not null default 0 check (revision >= 0),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  host_token_hash text not null,
  invitation_hash text not null,
  guest_token_hash text,
  creator_fingerprint text
);
create index if not exists arcane_duo_v2_room_limit_idx
  on public.arcane_duo_v2_rooms (creator_fingerprint, created_at desc);
create index if not exists arcane_duo_v2_room_expiry_idx
  on public.arcane_duo_v2_rooms (expires_at);
alter table public.arcane_duo_v2_rooms enable row level security;
revoke all on public.arcane_duo_v2_rooms from public, anon, authenticated;
comment on table public.arcane_duo_v2_rooms is
  'Private online 2v2 rooms for new canonical-card rules; no direct browser access';
