# Arcane Duel – KI v14.1: selektiver Planer und tatsächliche Mechanikabdeckung

**Datum:** 21. Oktober 2026 · `development` · **GitHub Actions SUCCESS (zweiter Versuch)**

- [Vollständiger Trainingslauf #39646196727](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39646196727)
- [Originalartefakt mit Selektor, Mechanik-Audit und Kandidat](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39646196727/artifacts/12367791417)
- `tests/ai-selective-planner-v141.cjs`
- `.github/workflows/ai-selective-planner-v141.yml`

## Durchführung

Die 15 Champion-Gewichte (`models/ai-selfplay-v136.json`, 1.920 historisch erfasste Trainingsduelle) blieben **identisch**. Untersucht wurde ausschließlich, *wann* der v13.9-Zwei-Aktionen-Planer aktiviert werden sollte. Die drei v13.6-Generationen und die originalen v14.0-A/B-Daten wurden geprüft; v14.0-Holdouts gingen **nicht** in die v14.1-Gate-Auswahl ein.

Der erste Workflowversuch wurde durch ein GitHub-Runner-Shutdown-Signal abgebrochen. Die erneute Ausführung (Attempt 2) war vollständig erfolgreich. Alle **42** Regresstests bestanden, Pilot und große Train-/Holdout-Läufe erfolgreich, keine abgewiesenen KI-Aktionen.

### Trainingsauswahl – 56 Szenarien, zwei gespiegelte Sitze je Strategie

| Kandidat | Siege | Planer-Aufrufe | Ergebnis |
|---|---:|---:|---|
| Immer aktiv | 56/112 | 432 | Kein Vorsprung |
| Nur Beschwörung | 56/112 | 336 | Kein Vorsprung |
| Nur Angriff | 56/112 | 91 | Kein Vorsprung |
| Frühe Angriffe | 56/112 | 14 | Kein Vorsprung |
| Sichtbare Verteidigungs-/ACE-Bedrohung | 56/112 | 37 | Kein Vorsprung |

**Auswahl:** `none` (geschützter Champion ohne Lookahead). Sicherheitskriterium verlangte mindestens 55 % Siegquote auf den *neuen* Trainingsszenarien und mindestens fünf Planer-Aufrufe. Kein Kandidat qualifizierte sich.

Die identischen Siegerquoten sind ein **starker Anlass für ein gezieltes Override-Audit**: Es ist noch nicht gemessen, ob der Planer jemals eine andere legale Aktion als der Standardcontroller gewählt hat. Es wäre verfrüht zu behaupten, der Planer sei nutzlos oder habe die Regeln verstanden. Wichtigstes v14.2-Ziel: tatsächliche Action-Overrides, Legalität nach Engine und resultierende Boarddifferenzen zählen.

### Unabhängige Holdouts

Da auf dem Trainingsset **keine** Aktivierungsstrategie bestanden hat, wurde die **unveränderte Champion-Kontrolle** bewertet. Daher sind die Holdout-Siege **keine** unabhängige positive Bestätigung eines neuen Planers.

| Messung | Ergebnis |
|---|---:|
| Gleicher Champion auf beiden Seiten | **72/144 = 50 %** |
| VII/IX/X | **14/36** Champion gegen denselben Champion |
| Offensiver Spezialist | **19/32** |
| DEF-/Support-Spezialist | **18/32** |
| Fusion/Material-Spezialist | **19/32** |
| Neuer Champion / Produktion | **Nein / unverändert** |

### Mechanik-Audit: tatsächliche Angebote vs. Aktionstypen

Aus den 72 unabhängigen gespiegelten Tests wurde auf einer Spieler-Seite die Verfügbarkeit von Aktionsfamilien je Entscheidungskontext mitgeschrieben sowie die gewählten Aktionstypen. Die beiden Spalten haben unterschiedliche Zählweise und dürfen **nicht** unmittelbar als Umsetzungsquote dividiert werden.

| Mechanik | Entscheidungskontexte mit legalem Angebot | Gewählte Aktionen (protokolliert) |
|---|---:|---:|
| Normale Beschwörung | 854 | 438 |
| Handfusion | 707 | 416 |
| Angriff | 633 | 1.228 |
| Positionswechsel | 32 | 389 |
| Seelenentzug | 13 | **9** |
| Wächter-Heilung | 3 | **2** |

Zusätzlich wurden wiederholte Rollen-Beobachtungen aufgezeichnet: Predator 2.784, Guardian 2.307, Soul 1.108, Resonator 730, Combatant 381, Allrounder 62. Das sind **keine einzigartigen Karten oder Matches**.

**Wichtig:** Die mehrfach höhere Aktionshäufigkeit gegenüber Angebotskontexten belegt, dass die Rohmetriken unterschiedliche Teile der Entscheidungspipeline erfassen (u. a. Fallback-Aktionen). Für saubere *Nutzungsraten* muss v14.2 Angebote und gewählte Aktionen am **gleichen Entscheidungszeitpunkt** paaren und nach Rolle, Boardzustand und Legalitätsprüfung gruppieren.

## Erkenntnis und nächste Roadmap

1. **Priorität 1: Action-Override-Audit.** Für jedes Planer-Ereignis Baseline-Aktion und vorgeschlagene Planer-Aktion miteinander vergleichen, tatsächliche abweichende Aktionen und Legalität messen, inklusive kausaler Ergebnisunsicherheit.
2. **Priorität 2: Planer-Ziel überarbeiten.** Eine bloße kurzfristige additive Board-Bewertung könnte zu selten Aktionen umrangieren. Material- und Zerfallskosten, ACE-Drohung, Rollenfähigkeiten, aktive Soul-Drain-Ketten und Resonanz gesondert erfassen.
3. **Priorität 3: Mechanik-Curriculum.** Saubere per-Opportunity-Angebot-versus-Wahl-Verhältnisse und echte Vorher/Nachher-State-Deltas; gezielte Trainingssituationen statt nur noch mehr Duelle.
4. **Priorität 4: Langzeitarchiv.** Actions-Artefakte sind 90 Tage verfügbar; die aktuellen Erkenntnisse sind hier im Repository versioniert. Modelle nur nach unabhängiger Bestätigung aktualisieren.
5. Danach ausgewählte Strategien mit unterschiedlichen Seeds, Bossen, echten erspielbaren Inventaren und historischen Gegner-Archetypen gegentesten.

**Fazit:** Technisch sauberer, aber strategisch **kein** neuer Champion. Das Experiment widerlegt den Nutzen des bisherigen Planers nicht; es zeigt, dass keine geprüfte pauschale Aktivierungsregel bislang einen Vorteil nachweist. Die neue Mechanik-Telemetrie ist die Grundlage, den eigentlichen Entscheidungsfehler zu diagnostizieren.
