# Arcane Duel AI v19.2 – sichtbare Feldbedrohung und sichere Zugenden

## Geprüfte Hypothese
v18.9: unproduktiver Soul raid statt Soul discharge verlor Duelle.
v19.0: blanket Soul discharge protection blockierte wertvollen Angriff.
v19.1: selektiver Soul-Raid-Filter ohne Siegeränderungen; 3.292 End-Turn-Prüfungen und 0 zusätzliche Rettungen.
Diese bekannten Fehler dienen nur als Regressionstests. Keine Veröffentlichung der neuen KI ohne Champion-Gates.

## Experimental Design
- Frozen baseline: optimierter v18.8-Planer (gleich wie v19.1), produktive Live-Regeln.
- Candidate: v19.1 Seelenfilter + eigener Zug-Same-Turn 2/3-step legal action clone; zusätzlicher sichtbarer Bedrohungs-Score, kein unzulässiger Gegnerzug.
- `visibleExposure` zählt ausschließlich offene gegnerische Monster in ATK und nur wenn die eigenen Feldzonen völlig leer sind; positive ATK-Summe (max. eigener LP+600) als Risikoindikator. Keine gegnerischen Handkarten, Deckkarten, Zugwechsel, unbekannte Effekte oder angenommene Schadensformeln. Die Metrik ist eine *heuristische Oberflächenexposition*, keine echte Reply-Simulation.
- Risiko wird auf die simulierte erste und zweite eigene Aktion in strategischer Bewertung angewendet. Echte Finisher sind ausgenommen; die Engine bestimmt legal actions und Sieger.
- Konservativer End-Turn-Rettungsfilter: aktueller eigener LP-/Karten-/Bondverlust 0, beobachtbare Wirkung, Score und Marge >=85, keine sichtbare Exposition. Notwendig: neue Sieger / keine verschlechterten Duelle.
- Telemetrie: VisibleThreatChecks / ExposedThreatPenalty; die bisherigen SoulRaidFiltered / SafeThreatPromotions / SafeEndPromotions bleiben.
- New seeds: Stage8 +960, Stage9 +520, Stage4 -130, gepaart in baseline/optimized, in 0..9999. TRAIN/VALIDATION/HOLDOUT bleiben unverändert getrennt.

## Guardrails
46.080 Duelle (23.040 pro Kohorte) unter der echten Engine. Keine Produktions-KI, keine Datenbanken, keine Kartenwerte, keine `main`-Änderungen. Kein Championwechsel ohne H2H, Role- und Seat-Fairness-Gates.
