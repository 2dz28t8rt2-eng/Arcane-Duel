-- Independent 2v2 profiles only. Existing active decks remain unchanged.
ALTER TABLE public.arcane_duo_v2_profiles
 ADD COLUMN IF NOT EXISTS deck_slots jsonb NOT NULL DEFAULT '[]'::jsonb,
 ADD COLUMN IF NOT EXISTS active_deck_slot smallint NOT NULL DEFAULT 0;
ALTER TABLE public.arcane_duo_v2_profiles
 ADD CONSTRAINT arcane_duo_v2_deck_slots_shape CHECK (
  jsonb_typeof(deck_slots) = 'array' AND jsonb_array_length(deck_slots) IN (0,3)),
 ADD CONSTRAINT arcane_duo_v2_active_deck_slot_range CHECK (active_deck_slot BETWEEN 0 AND 2);
