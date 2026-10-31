-- Presence is independent of combat revision and never changes seat ownership.
ALTER TABLE public.arcane_duo_v2_rooms
 ADD COLUMN IF NOT EXISTS host_seen_at timestamptz,
 ADD COLUMN IF NOT EXISTS guest_seen_at timestamptz;
