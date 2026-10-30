# KI-Forschung v18.8 · 30.10.2026

Baseline ist der **exakte optimierte v18.7-Planer**, während experimentell legale Zielaktionen nach sichtbarer Bedrohung (ATK+0.35 DEF) priorisiert werden. Innerhalb von 3000 sichtbaren Gegner-LP untersucht v18.8 bis zu zwölf legale dritte Aktionen statt sechs, abgeleitete Finisher müssen über den echten Engine-Siegstatus bestätigt werden. Sinnvolle Engine-geprüfte Endzug-Rettung ist bei einem deutlichen Bewertungsgewinn ab 150 statt 180 möglich.

Die fünf bisher fehlenden Protokollfelder werden jetzt **pro Duell** geschrieben und beim Vergleich zwingend geprüft: EndTurnChecks, EndTurnRescues, ThirdActionTrials, ThreeActionFinders, RejectedLowValue. Somit lassen sich tatsächliche Aktivierung und Nichtauswahl unterscheiden.

Geplante A/B-Auswertung: 46080 Duelle, 23040 pro Variante, 2304 gepaarte Stage-8-Starts; kontrollierte Seeds 760/320 in Stage 8/9. TRAIN/VALIDATION/HOLDOUT, legal engine clone actions, sämtliche Champion-Gates unverändert. Keine produktive Änderung an Solo/2v2, kein Supabase-Deployment oder main-Änderung. Der aktuelle game-runtime-Benchmark muss aktuelle Portraits und Rollen-Kataloge korrekt laden, sonst stoppt der Lauf vor den großen Stages.
