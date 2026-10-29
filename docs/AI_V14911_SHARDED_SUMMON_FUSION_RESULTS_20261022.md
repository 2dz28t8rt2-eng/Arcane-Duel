# Arcane Duel v14.9.11 – Prüfbericht nach Speicher-Fix

**Stand:** 22. Oktober 2026 · **Branch:** `development` · **GitHub Actions:** [Run #39803691439](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39803691439) · **Resultat:** SUCCESS · **getesteter Commit:** `10b7f117cdba836cfc9031f3c941c948bf773495`

[Prüfungsartefakt #12437676253](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39803691439/artifacts/12437676253): 24 vollständige Batch-Rohdateien, `fullmatch-cases.json`, `fullmatch.json`, `report.json`, `training-q-and-examples.json`, `conclusion.json`.

## 1. Status und technischer Erfolg

- **Alle 24 separaten Node.js-Prozesse** mit jeweils **64 vollständigen Duellen** abgeschlossen; **1.536/1.536** Spielsituationen ausgewertet.
- Der Aggregator hat alle vollständigen Kombinationen aus Startbedingung, Wartezeit, Gegnerdeck, Vergleichsarm, Starter und KI-Sitz auf Vollständigkeit und Eindeutigkeit geprüft; keine doppelten Matches, keine Duell-Timeouts.
- Die alten 4-GB-V8-OOM-Abbrüche sind durch kurzlebige 1.800-MB-Prozesse beseitigt worden.
- Syntax, unveränderte Predator-Schwarm-/10pp-Rüstungsregeln, Seelenmechaniken und Seitensymmetrie: alle vorgeschalteten CI-Tests erfolgreich.
- Umfang zusätzlich: **1.350** taktische Trainingssituationen und **450** zuvor unbekannte taktische Tests.

**Achtung:** Das Training war technisch erfolgreich, es wurde aber **kein vorheriger Q-Checkpoint geladen**. Im Originalbericht steht `priorCheckpointLoaded:false` und `legacyQTransferred:false`, während der frühere gültige Checkpoint [#39789451267](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39789451267) weiterhin vorhanden ist. Der Run erzeugte also ein **neues Q-Modell von Grund auf** (160 Q-Schlüssel je Forschungsarm) und nahm drei neue Updatepakete an. **Keine belastbare Behauptung, dass bereits gelerntes Wissen aus alten Läufen diesmal weiterentwickelt wurde.**

## 2. Vergleich der kompletten Duelle

Die 40-Karten-Stresstests wurden gegen Guardian-/Soul-/Fusion-/Hybriddecks mit Gegner-KI-Politiken `economy` beziehungsweise `offensive`, den Angriffswartephasen 0/6/10 sowie beiden Start- und Sitzrichtungen gespielt. Bewusster harter Start: zwei reale gegnerische Deckkarten schon auf DEF-Feld, wobei sie aus dem restlichen Deck herausgenommen werden.

| Forschungspolitik | Normale Starts (192) | Zwei DEF-Karten beim Gegner (192) | Zusammen (384) |
|---|---:|---:|---:|
| Bewährte Angriffs- und Beschwörungsheuristik | **187** | 185 | 372 |
| Konservatives Q ohne Beschwörungsvorausschau | **187** | 185 | 372 |
| Konservatives Q + Beschwörungs-/Fusionsvorausschau | **187** | 183 | 370 |
| Konservatives Q + Beschwörungs-/Fusionsvorausschau + Angriffsvorausschau | **187** | **186** | **373** |

Im harten Stresstest verbessert die volle Vorausschau die reine Beschwörungsvorausschau **von 183 auf 186/192**, aber gegenüber der bisherigen Heuristik nur **185 auf 186/192**. Das ist **kein ausreichend großer Leistungsnachweis**, um die KI-Policy in der regulären Karriere zu ersetzen. Bei normalen Starts liegen alle Politiken bei identisch 187/192: dies ist stark gesättigt.

### Erfolgszahlen nach Gegnerarchetyp (schwere DEF-Starts, je 48 Matches)

| Politik | Guardian | Soul | Fusion | Hybrid |
|---|---:|---:|---:|---:|
| Heuristik | 48 | 46 | 46 | 45 |
| Konservatives Q | 48 | 46 | 46 | 45 |
| Q + Beschwörungs-/Fusionsplanung | 46 | 47 | 46 | 44 |
| Q + Beschwörungs-/Fusions- und Angriffsplanung | 48 | **48** | 46 | 44 |

### Normale Starts, je 48

- Jeder Vergleichsarm gewann gegen Guardian **48/48**, Soul **48/48**, Fusion **47/48**, Hybrid **44/48**.
- In dieser aktuellen Versuchsreihe sind daher **Hybridstrategien die schwierigste normale Herausforderung**, nicht Fusionen allein. Die Stärke der Gegnerprofile variiert zwischen Studien; Unterschiede zur früheren Untersuchung dürfen nicht als direkter kausaler Fortschritt interpretiert werden.

### Seitensymmetrie

Bei den normalen Starts erzielten alle Politiken Platz 0: **94 Siege**, Platz 1: **93 Siege**. Harte Starts: Heuristik und konservatives Q **93/92**, Q + Beschwörung **91/92**, volle Planung **93/93**. In diesem Test keine offensichtliche große Sitzbevorzugung.

## 3. Nachweis echter Planungsentscheidungen

Je *einer* der zwei Planungsvarianten:

- **1.536** durchlaufene Beschwörungsplanungschecks: 768 normal / 768 schwer.
- **6.144** als legal protokollierte simulierte Handkarten-/Fusionskandidaten: 3.072 normal / 3.072 schwer.
- **147** tatsächlich geänderte Beschwörungsentscheidungen: 68 normal / 79 schwer.
- **123** davon wählten eine Fusion: 56 normal / 67 schwer.
- Nur bei der zusätzlich ausführenden Angriffs-Vorausschau: **3.367** Auswertungen der Angriffsfolge, **67** tatsächliche Abweichungen.
- Konservatives Q ohne weitere Planung: **80** aktive Q-Aktionsentscheidungen über 384 Spiele.

Diese Zahlen demonstrieren, dass simulierte Alternativen tatsächlich in Forschungsduellen verwendet wurden. Sie sind **kein Beweis**, dass alle Änderungen über mehrere Spielzüge günstig waren.

## 4. Gegenfaktischer Q-Lernprozess und Gedächtnisfehler

Drei Forschungsarme × 450 Trainingspositionen + 150 zuvor unbekannte Holdout-Positionen:

| Arm | Taktischer Holdout: gelernter Q-Wert (Mittel) | Alte Heuristik auf denselben Boards | Optimale Wahl aus 150 Einzelpositionen |
|---|---:|---:|---:|
| Ohne Schwarm/Piercing | 0,7895 | 0,5048 | 137 |
| Mit Schwarm, ohne Piercing | 0,8587 | 0,5421 | 137 |
| **Schwarm + 10pp Rüstungsdurchschlag** | **0,8714** | 0,5706 | 137 |

Die Werte sind **lokaler normierter taktischer Nutzen, keine Siegwahrscheinlichkeiten**. Alle drei Updatepakete wurden auf dem Trainingssatz akzeptiert.

**Kritische Checkpoint-Lücke:** Trotz vorhandenen Vorgänger-Artefakts wurden `previous-training-q.json` und der Legacy-Pfad im GitHub-Workflow nicht wiederhergestellt. Der Runner meldet beides `false`, keine sichtbare Bestätigung im Restore-Schritt. Das bedeutet: In diesem Lauf wurde **nicht zuverlässig aus bereits früheren Duellen weitergelernt**.

**Erforderlicher Fix vor dem nächsten Lernzyklus:** GitHub-Actions-REST-Runs anhand exakter Workflow-`path`/`conclusion=success` über das Repository-Runs-API identifizieren und daraus das benannte Artefakt laden; nach erfolgreichem Download nur die tatsächlich gelernte Q-Tabelle übernehmen. Einen **verpflichtenden Restore-Gate-Test** einbauen, der bei vorhandener Vorgängergeneration ein fehlendes oder leeres Checkpoint als Fehler behandelt (nicht stillschweigend neu trainiert). Trainingsdaten und Holdout-Labels dürfen dabei nicht in die Q-Eingabe gelangen. Danach mindestens ein tatsächlicher Folgelauf für nachgewiesene Persistenz.

## 5. Methodische Grenzen und Empfehlung

- Im Forschungsmodus blieb der Arena-LP-Zerfall deaktiviert; NPC-/Quest-Sonderbedingungen und zukünftige verdeckte Hand-/Deckinformationen wurden nicht durchgespielt.
- Beschwörungs-/Fusions-Vorausschau verwendet geklonte echte Spielaktion + Platzierung + höchstens eine vom sichtbaren Gegnerfeld ausgehende Angriffserwiderung. Die Zwei-Zug-Angriffsplanung ist ebenfalls nur ein begrenzter Ausschnitt eines realen Zugverlaufs. Kein vollständiger Fusion-/Beschwörungs-/Seelenraub-Suchbaum.
- Die Gegner bestehen aus nur einigen festen Politikvarianten, **keine echte unabhängige KI-Liga oder selbstlernendes Self-Play**.
- Deckkombinationen sind gepaart und statistisch nicht vollständig unabhängig. Ein Sieg mehr unter 384 Partien ist noch keine signifikante Verbesserung.

**Empfohlene Reihenfolge:**

1. **Q-Checkpoint-Restore verpflichtend absichern**, damit fortgesetztes Lernen wirklich über mehrere Actions-Läufe erhalten bleibt.
2. **Schwierigere Hybrid-/Fusion-Gegner** beziehungsweise Gegner-Liga konstruieren. Eine Referenz mit über 95 % Winrate ist für kleine Strategieunterschiede wenig aussagekräftig.
3. **Entscheidungsqualität für Fusionen gesondert messen:** Unterscheiden, ob eine Fusion wirklich legal ausgeführt wurde, welchen realen Wertsprung sie brachte, und welche Gegenaktion im nächsten vollständig berechneten gegnerischen Zug folgt.
4. **Aktualisierung konservativ freigeben:** Eine neue KI darf Heuristik oder gated Q nur dann ersetzen, wenn sie wiederholt auf neuen Decks/Seeds und mit normalen Arena-Zerfallsregeln gewinnt.
5. Bis dahin **Produktiv-KI auf development/main unverändert lassen**; die Predator-Spielregeln +2%-Schwarm und 10pp-DEF-Rüstungsdurchschlag bleiben davon unabhängig.

**Gesamturteil:** Vollständiger Trainings- und technische Speicher-Test erfolgreich ✅. Beschwörungs-/Fusionsplanung funktioniert ✅. Verlässliche historische Wissensfortführung nicht nachgewiesen ❌. Signifikante Steigerung vollständiger Matchleistung nicht belegt ⚠️. Kein Live-AI-Upgrade.
