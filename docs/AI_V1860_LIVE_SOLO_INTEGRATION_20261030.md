# Arcane Duel v18.6 – erste produktive KI-Integration (2026-10-30)

## Forschungsabschluss
[Trainingslauf #41109886654](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/41109886654): 27/27 Jobs erfolgreich, 46.080 Duelle, 0 geänderte Sieger in 2.304 direkt gepaarten Stage-8-Szenarien. Champion nicht befördert; der bisherige Champion `l10-guarded-worst-reply` bleibt bestehen. Neue Trainingskontexte sind weiterhin nicht als produktionsreif validiert.

## Live Solo – Phase 1
`assets/ai-production-bridge-v186.js` ist als letztes verzögert geladenes Script in `index.html` aktiv. Der Adapter umhüllt `chooseAiAction` und ist standardmäßig für reale Solo-PvE-Gegner III–X in der Angriffsphase aktiv, sofern sie Wächter oder Seelenzehrer kontrollieren. Er benutzt dieselben tatsächlichen Spiel-Angriffsregeln über `applyAiAction`, simuliert ausschließlich auf öffentlich sichtbaren `ArcaneAiBranches59.publicState`-Spielstandkopien und überschreibt nur nach legaler, ausreichend besserer Handlung oder echten Finishersituationen. Beschwörungen, Fusionen, ältere NPC-Spezialfähigkeiten und sonstige Aktionen bleiben beim bisherigen KI-Code.

### Grenzen und Sicherheit
Keine erfundenen Forschungs-Seelenfähigkeiten in der echten Welt, kein Einblick in die Hand/Deck-Reihenfolge des Menschen, keine Änderung an Kartenwerten, Game-Engine, gespeichertem Profil oder Champion-Gates. PvP, Duo/2v2, Test-/StrategicTraining-Modus und Einsteigergegner 0–II bleiben bewusst unberührt. Bei Fehlern fällt das Spiel auf die bestehende KI zurück. Diagnose: `ArcaneAiProduction186.stats()`, Abschalten: `ArcaneAiProduction186.setEnabled(false)` (nur bis Neuladen).

Dies ist ein erster produktiver Schritt, noch **kein vollständiger Import** des Forschungsplans über Summon, Fusion und Duo. Für Duo braucht es den gesonderten Server-Regelpfad. Weitere Solo- und Duo-Playtests sind nötig.

### Prüfungen
`node --test tests/ai-live-integration-v186.test.cjs`; außerdem `npm test`.
