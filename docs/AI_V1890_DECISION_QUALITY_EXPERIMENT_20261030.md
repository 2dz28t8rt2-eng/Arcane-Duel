# Arcane Duel: KI-Forschung v18.9 – 30.10.2026

## A/B-Setup
Baseline = eingefrorene optimierte KI v18.8; optimized = neue v18.9-Safe-Value-Aktionswahl. 46.080 Duelle (23.040 pro Variante) mit deck-/seed-/sitzplatzgleichen Beispielen. TRAIN, VALIDATION, HOLDOUT geschützt, 27 geplante Pipeline-Jobs.

## Änderungen ausschließlich in der Forschung
- Endzug-Wertschwellen 150 → 70 (Unterschied), Mindestscore 150 → 65.
- Andere Aktionen 110 → 75 bzw. 80 → 65, Mindestscore 35.
- Kein nicht-finaler Override bei eigenem LP-, Karten- oder Seelenbundverlust; Aktion muss eine sichtbare produktive Wirkung haben.
- Finale Siege nur per realem Engine-`winner` in geklonter Spielsituation; keine Kenntnis gegnerischer Hand oder unbekannter Nachzüge.
- Diagnosen `v1890UnchangedBest`, `v1890RejectedUnsafe`, `v1890RejectedLowValue` getrennt. Engine, Schaden, Kartenwerte und Champion-Beförderungs-Gates unverändert.

`tests/helpers/ai-v1890-mechanics-control.cjs` ist die mechanisch unveränderte v18.8-Optimierung. Keine Änderungen an Solo/2v2, Server, Supabase, `main` oder produktiven KI-Funktionen. Abnahme nach vollständiger Stage-8-/HOLDOUT-/Sitzplatz-/H2H-Auswertung.
