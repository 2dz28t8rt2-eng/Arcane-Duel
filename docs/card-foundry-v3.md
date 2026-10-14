# Arcane Duel 3.0 · Card Foundry

Visual-only card component refresh, built around an original fantasy aesthetic:
raised bronze frames for standard cards; silver-amethyst ornament for fusions;
individual engraved ACE frames over both categories. Elemental enamel gems
replace the non-specific header glyph. Classic level stars and separate ATK/DEF
seals stay readable and familiar. Small parchment plaques carry card types and
flavor. The artwork itself is neither edited nor replaced by decorative overlays.

**Scope:** hand, collection, deck editor, shop, character pack, fusion picker,
large duel preview, and miniature in-field creatures.

**Out of scope:** the duel arena, field slots, menu layout, artwork generation,
stats, battle rules, inventory, save data, and card IDs. Those come later.

Load order: `styles.css`, earlier extension CSS, `visual-v3.css`, then
`card-look-v3.css` as the final card-specific styling layer. Both Desktop and
mobile browser tests check that card images load, the stats are not clipped,
and hand cards remain clickable. The CSS honors `prefers-reduced-motion`.