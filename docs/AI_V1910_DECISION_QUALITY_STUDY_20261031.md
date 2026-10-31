# Arcane Duel: KI 19.1 – Experiment

Vergleich: eingefrorene optimierte KI 18.8 vs. experimentelle KI 19.1, 46.080 Duelle gesamt, je 23.040, gleiche Live-Regeln und identische paarweise Ausgangsbedingungen.

v18.9 hatte 9 schlechtere Ergebnisse bei einer Ausgangssituation: unproduktiver Soul raid statt Soul discharge. v19.0 verlor in Stage 4 durch pauschalen Schutz des Discharge vor einem nützlichen Angriff. Diese beiden bekannten Fälle werden als Regressionstests verwendet (nicht als neue HOLDOUT-Belege).

v19.1:
- Selektiver Filter: Ein nicht gewinnender Soul raid darf einen gewählten Soul discharge nur bei tatsächlicher Monsterentfernung UND >=180 beseitigter gegnerischer ATK verdrängen. Andere legale Angriffe bleiben zulässig.
- Zwei-Aktionen-Suchbudget 18/12 statt 16/10; dritte Aktion bis 4000 sichtbare LP statt 3000, 15 statt 12 Checks. Nur echte geklonte Engine-Aktionen während des eigenen Zuges.
- Zusätzliche sichere Angriffsvorzüge: >=150 gegnerische ATK entfernt, gegnerisches Monster entfernt, keine Eigenverluste, Score >=65, Score-Marge >=90.
- Enger Zugende-Rettungsfilter mit Score und Marge jeweils >=100 und beobachtbarem realem Effekt.
- Neue Zähler: SoulRaidFiltered, SafeThreatPromotions, SafeEndPromotions. Die übrigen Metriken und Champion-Gates bleiben unverändert.
- Neue A/B-gepaarte Seeds: Stage4 -180, Stage8 +900, Stage9 +460. Unveränderte Rollen-/Sitzplatz-/Guardian-/Fusion-/Predator-/H2H- und HOLDOUT-Schutzkriterien.

Nur Forschungsdateien auf development. Keine produktive Solo-/Duo- oder Supabase-Änderung, keine Kartenwerte, kein main, keine automatische Champion-Promotion.
