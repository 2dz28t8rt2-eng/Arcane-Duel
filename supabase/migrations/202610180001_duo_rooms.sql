-- Arcane Duel 2v2 private authoritative rooms.
-- Only the Edge Function's service role may read/write state. No public Data API access.
create table if not exists public.arcane_duo_rooms (
  id text primary key check (length(id) between 12 and 64),
  revision bigint not null default 0 check (revision >= 0),
  room_status text not null default 'waiting' check(room_status in ('waiting','active','finished')),
  host_token_hash text not null check(length(host_token_hash)=64),
  invite_token_hash text check(invite_token_hash is null or length(invite_token_hash)=64),
  partner_token_hash text check(partner_token_hash is null or length(partner_token_hash)=64),
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  constraint duo_invitation_state check (
    (room_status='waiting' and partner_token_hash is null and invite_token_hash is not null)
    or (room_status in ('active','finished') and partner_token_hash is not null and invite_token_hash is null)
  )
);
alter table public.arcane_duo_rooms enable row level security;
revoke all on public.arcane_duo_rooms from public, anon, authenticated;
grant select, insert, update, delete on public.arcane_duo_rooms to service_role;
create index if not exists arcane_duo_rooms_expires on public.arcane_duo_rooms(expires_at);
create index if not exists arcane_duo_rooms_status on public.arcane_duo_rooms(room_status,updated_at);
comment on table public.arcane_duo_rooms is 'Private online 2v2 match snapshots; tokens and hidden hands only accessible by the server.';
