-- Arcane Duel portrait expansion: 16 playable choices, 12 reserved story images.
-- Change only the strict avatar validation; saved profiles and room states
-- remain untouched. Run alongside the matching Edge Function deployment.
alter table public.arcane_duo_v2_profiles
 add column if not exists avatar_id text not null default 'hero-01';
alter table public.arcane_duo_v2_profiles
 drop constraint if exists arcane_duo_v2_profiles_avatar_id_check;
alter table public.arcane_duo_v2_profiles
 add constraint arcane_duo_v2_profiles_avatar_id_check
 check (avatar_id ~ '^hero-(0[1-9]|1[0-6])$');
