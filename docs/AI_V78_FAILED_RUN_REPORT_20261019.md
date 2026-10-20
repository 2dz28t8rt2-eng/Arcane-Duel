# Arcane Duel – Fehlerbericht zum KI-Training v7.8 (19.10.2026)

**Ursprünglicher fehlgeschlagener GitHub-Lauf:** [39285652755](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39285652755) · Status `failure`.  
**Neuer korrigierter Lauf:** [39293814588](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39293814588) · Status zuletzt `in_progress`; vorgeschaltete Tests erfolgreich, Karriereaufbau gestartet.  
**Arbeitszweig:** `development`. `main`, aktive Turniergegner-Gewichte und gespeicherte Nutzerprofile nicht verändert.

## 1. Was fehlgeschlagen ist – und was ausdrücklich NICHT

Das ursprüngliche Training war **kein gescheitertes KI-Lernexperiment**: Die GitHub Action brach bereits im Schritt **„Gate AI training on real shard-economy and save compatibility checks“** ab. Von 13 zu diesem Zeitpunkt ausgeführten Tests waren **10 bestanden und 3 fehlgeschlagen**.

**Alle späteren Trainingsschritte wurden übersprungen**: vollständige Karriere-Simulation I–VI, rechtmäßiger Sieg über VI und VII, Deckökonomie-A/B und Spielsimulation gegen VIII. Daher existieren für *diesen* Lauf **keine neuen Siegquoten oder Lerngewichte**, und keine neue Strategie wurde aktiviert.

### Unmittelbare Fehlermeldungen

| Fehler | Symptom | Technische Ursache / Behebung |
|---|---|---|
| **Kartenspürsinn** | Booster-Tests zeigen trotz zusätzlicher Skillränge keine messbare Verschiebung. | **Echter Gameplay-Integrationsfehler:** `assets/expansion.js` überschreibt `rollBooster` aus `assets/game.js` durch eine eigene ACE-Shop-Version und verwendete weiterhin die ursprünglichen starren Startkarten-Schwellen. Jetzt ruft die Erweiterung `cardSenseStarterCut` auf; seltene ACE-Nebenwürfe bleiben gleich. |
| **Normales Splitter-Crafting** | Ein Test erwartet eine erfolgreiche Herstellung, die von `craftCard` verweigert wird. | Testdaten wählten nach dem Rework teils Sonderkarten, die bewusst nicht über Splitter gekauft werden dürfen. Die Tests filtern nun die echten Crafting-Ausschlüsse (ACE, exklusive Quest-/Trainings-/Werkstattkarten etc.). Die Preise **10/18/28/40** für reguläre Monster und **30 plus Essenz** für bestimmte Fusionsrezepte bleiben erhalten. |
| **Gespeicherte Rollenforschung** | `Ungültige Splitter-Forschung.` oder eine bezahlte Kartenwahl wird abgelehnt. | **Echter Spielstand-/Gameplay-Bug:** Quelle **0** (Trainingsgegner) ist legitim nutzbar, aber Forschungsspeicherprüfung und Kartenauswahl verlangten irrtümlich einen Eintrag `profile.cleared.includes(0)`, der bei normalen Karrieren nicht existiert. Beide Prüfungen akzeptieren die legitim offene Startquelle nun wie `opponentUnlocked(0)`. |

Weitere allgemeine Regressionen fanden alte Testannahmen aus v7.6/v7.7: Startmonster müssten trotz bewusster Perk-Änderung weiter +35 ATK erhalten und normale Karten müssten pauschal 30 Splitter kosten. Diese wurden auf den ausdrücklich genehmigten neuen Mechanikstand aktualisiert, ohne alte Produktionsinhalte zu fälschen. Der plattformweite Testlauf hatte im alten Stand **542/547 bestanden**, fünf nicht bestanden. Der Forge-Test verwendet jetzt ein freigeschaltetes normales Rezept statt einer exklusiven Quelle-0-Karte.

## 2. Was sich auf `development` geändert hat

- `assets/game.js`: Rollenforschung Quelle-0-Validierung bei Speichern und Auswahl konsistent.
- `assets/expansion.js`: das überschreibende `rollBooster` respektiert `Kartenspürsinn` bei identischer Anzahl/ACE-Nebenchance.
- `tests/shard-rework-v77.test.cjs`: Testdaten nur aus wirklich freigeschalteten und craftbaren Rezepten.
- `tests/perk-card-sense-v76.test.cjs`: reale Mengenverschiebung im spät verfügbaren Kartenpool und korrekte Freischaltungsgates.
- `tests/monster-roles-forge.test.cjs` / `tests/regression.test.cjs`: erwartete Kosten und Skillwirkung an das genehmigte Rework angepasst.
- `.github/workflows/ai-earned-shard-v78.yml`: QA prüft jetzt alle zuvor betroffenen Regressionen, bevor jemals die AI-/Karrieresimulation startet.

## 3. Rückkehr zum eigentlichen Trainingsziel

Der korrigierte Run [39293814588](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39293814588) hat das **QA-Gate bestanden** und baut derzeit rechtmäßig verdiente Karriereinventare auf. Erst wenn die nachfolgenden Schritte abgeschlossen sind, können wir bewerten, ob:

1. 0 / 2 bezahlte Craftingkäufe und eine bezahlte Rollenforschung die aktiven Decks verbessern;
2. legitime VIII-Spielstände endlich passende Level-7+-Monster besitzen bzw. ausrüsten;
3. bei unabhängigen Kontrollpartien gegen echte VIII-Bosse die bisherige v5.7- und die eingefrorene v7.3-Fusionsstrategie unterschiedliches Verhalten zeigen.

Der Trainingslauf darf bei zu wenigen echten VIII-Spielständen **berechtigt scheitern**; dann muss die Progression untersucht werden, statt Karten oder Turniersiege zu erfinden.

**Kein Merge nach `main`, keine automatische Aktivierung experimenteller KI-Gewichte.** Status dieses Berichts nach neuem Lauf ergänzen.
