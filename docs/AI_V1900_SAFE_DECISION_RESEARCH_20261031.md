# Arcane Duel AI v19.0 – Schutz des Seelenstoßes und sichere Angriffswahl

Baseline: eingefrorene optimierte v18.8 (zuvor v18.9 Control); Optimiert: v19.0 geschützt. 46.080 echte Duelle, 23.040 je Kohorte, gepaarte neue Stage-8/9-Deckseeds 840/400 anstelle von 760/320. Die aus v18.9 bekannten neun negativen Resultate gehen nur in Regressionstests ein, nicht als unberührte Holdout-Prüfung.

Nicht-finisher Soul-Discharge → Soul-Raid wird untersagt, wenn keine legale, vom Engine-Siegerstatus bestätigte Gewinnsequenz vorhanden ist. Eng begrenzte Score-Margensenkung für Attack→Attack und Endturn→ertragreichen Angriff, ausschließlich mit echter Engine-Kopie, ohne Eigen-LP-/Karten-/Bondverlust. Telemetrie: SoulDischargeProtected, SafeAttackPromotions, SafeEndPromotions.

Originale Deck-/Sitzplatz-/Guardian-/Fusion-/Schwarm-/H2H-/TRAIN-/VALIDATION-/HOLDOUT-Gates und frozen Champion unverändert; keine automatische Beförderung, keine Spiel-, Server-, Karten- oder main-Änderung.
