# Arcane Duel – KI-Entwicklung v17.9: Live-Regeln, heutige Integrationsabnahme

**Lauf:** [Actions #41044207178](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/41044207178)  
**Branch:** `development`  
**Produktionsbalance als Forschungsbaseline:** v21.2, 95 % Wächtergesamtbudget, 22 % ATK / 78 % DEF.  
**Laufumfang:** 2 × 23.040 = 46.080 beabsichtigte Duelle, jeweils elf Stages. Vorprüfungen der Gruppen `baseline` und `optimized` bestanden.

## Was trainiert/verglichen wird

Die `baseline`-Kohorte verwendet die zuletzt geprüfte Forschungsstrategie mit eingefrorenem Champion. Die `optimized`-Kohorte testet zusätzliche, **vor dem Lauf festgelegte** Entscheidungsgewichte für legale gegnerische Antworten, defensiven Seelenbundschutz, Ablass-/Raid-Risiken und taktische Folgezustände. Es werden keine Kartendaten geändert und kein künstlicher Kampfbonus vergeben. Pro Kohorte entsteht ein **TRAIN-only Folge-Lernmodell**; weder VALIDATION noch HOLDOUT fließen in dessen Werte ein.

Beide Kohorten nutzen **identische Seeds, Sitze, Gegner, Decks, aktuellen Produktionskatalog und native Solo-Kampfregeln**. `ARCANE_RESEARCH_BALANCE_V169=control10` ist ein No-op der Testumgebung; `ARCANE_RESEARCH_GUARDIAN_STATS_V178=control` aktiviert nur die echte Angriffs-/Gegenschlags-Telemetrie und **keinen** zweiten Wächter-Nerf. Der alte v17.8-Trainingsabschluss wird wegen des geänderten Kartenbudgets nicht als neues Gewinner-/Endgame-Label eingebracht.

## Vor Übernahme heute Abend zwingend prüfen

- Beide vollständigen `report.json`: **23.040 Duelle** und elf Stages; **0 ungültige Positionswechsel**, korrekte Gewinner-/Sitz-Erfassung, identische Startkonfigurationen
- Direkte H2H-Gates zum eingefrorenen Champion: **TRAIN mindestens +4**, **VALIDATION mindestens +8** sowie harte Level-10- und Rollensynergie-Gates unverändert erfüllt; HOLDOUT streng erst nach der Auswahl lesen
- Spezifische KI-Messwerte: echte offensive Angriffe statt passiver Gegenschläge, sinnvolle DEF/ATK-Wechsel, Seelenverbundschutz, Ressourcen- und Fusionsentscheidungen, möglichst keine verschlechterten Fusion-/Predator-Matchups
- Modelle aus `next-run-endgame-learner.json` ausschließlich mit `split=train`, `validationUsed=false` und `holdoutUsed=false` akzeptieren; **dieser NEXT-Checkpoint ist noch kein validierter, aktivierter Champion**
- Nur eine nachweislich bessere Politik hinter einer **deaktivierbaren KI-Versionsflag** in den Solo-Spielcode übertragen. Nachziehen auf 2v2 **nur wenn die KI-Forschung und der 2v2-Regelabgleich erfolgreich sind**; keine Spielstands-Migration oder Veränderung der Regeln
- Technische Abnahme: deterministische reproduzierbare Angriffsszenarien, Legalität von Seelenfähigkeiten, keine übermäßige Denkzeit/Freeze, vollständiges `npm test`, Headless-Browser-Probe, Singleplayer- und Duo-Partie mit nachvollziehbarem Rollback
- Falls Kandidat Gates verfehlt: **alten Champion beibehalten**, diagnostische Trainingsdaten als Forschung nutzen. Kein Ausrollen bloß wegen hoher TRAIN-Siegquote und kein stilles Absenken der Freigabeschwellen

**Noch nicht implementiert:** Diese Checkliste ist Vorbereitungsdokumentation; die Integration ins Live-Spiel erfolgt erst nach Ende des Laufs und Ergebnisprüfung. Der Workflow selbst befördert oder veröffentlicht niemals eine neue KI.
