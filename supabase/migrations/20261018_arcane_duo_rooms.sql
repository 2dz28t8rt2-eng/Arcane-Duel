-- Arcane Duel 2v2 — capability-authenticated rooms, server-only state (2026-10-18).
-- No direct public table API. The Edge Function alone reads/writes using the service role.
create table if not exists public.arcane_duo_rooms (
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
create index if not exists arcane_duo_rooms_creation_guard
  on public.arcane_duo_rooms (creator_fingerprint, created_at desc);
create index if not exists arcane_duo_rooms_expiry_idx
  on public.arcane_duo_rooms (expires_at);
alter table public.arcane_duo_rooms enable row level security;
revoke all on table public.arcane_duo_rooms from public, anon, authenticated;
comment on table public.arcane_duo_rooms is '2v2 server-authoritative prototype; never grant browser direct table access';
