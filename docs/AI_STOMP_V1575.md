# Arcane Duel – KI-Forschung v15.75: Stomp vs. Predator

Stand: 28.10.2026. **Reine Forschungs-KI**; keine Veränderung der Spiellogik,
der 2v2-Kampagne oder einer produktiven KI.

## Warum dieser Lauf?

Die v15.74-Forschung wurde aus 23.040 Duellen erfolgreich rekonstruiert. Ihr
experimenteller Kandidat schlug den eingefrorenen Champion auf dem versiegelten
HOLDOUT, allerdings waren die großen Fusionen selten und die spezialisierten
Predator-Rudel verbesserten sich nicht. Die ältere Erhebung zählte Tausende
**bewertete Angriffsversuche auf Klonen**, nicht Tausende echte Stomp-Treffer.

## Unveränderte Kampfregeln

- Fusion mit 3 Materialien: 100 % Hauptziel, 70 % erster rechter Nachbar
  (ansonsten links).
- 4 Materialien: 100 % Hauptziel, je 50 % rechts/links.
- 5 Materialien: 100 % Hauptziel, 50 % rechts/links, 30 % zweiter rechter
  Nachbar (sonst links). Kein Ziel doppelt.
- Treffer in ATK: reicht die Stärke gegen die gegnerische ATK, wird die Karte
  zerstört; sonst wird ihre DEF angegriffen – auch in ATK-Position.
- 3 % Eigenverbrauch von **ATK und DEF pro tatsächlich getroffenem Ziel**.
- Wächter-/Seelenzehrer-Gegenschlag auf Stomp-Nebentreffer: 40 % des normalen
  LP-Gegenschlags. Resonator-/Allrounder-Materialboni bleiben mit +12
  Prozentpunkten gedeckelt.
- Diese Kosten und Treffer gelten in **allen** Forschungsarmen identisch.

## Was die KI jetzt vergleichen soll

| Forschungsarm | Wissens- und Bewertungsschwerpunkt | Erwarteter Vorteil | Erwarteter Nachteil |
| --- | --- | --- | --- |
| `baseline` | v15.74, gleiche Decks und Seeds | Bekannter zuverlässiger Vergleich | Neue Predator-Lücken bleiben bestehen |
| `splash-only` | Erkennt Nebentreffer, **ignoriert nur in der Bewertung** Eigenverbrauch/Gegenfenster | Prüft, ob große Fusionen durch Vorsicht untergewählt werden | Kann überteure Stomps wählen und hinterher von Predatoren besiegt werden |
| `fatigue-only` | Bewertet Eigenverbrauch und Predator-Fenster, **vergütet in der Bewertung keine** Nebentreffer | Isoliert Wert des Ressourcenmanagements | Kann den Flächenschaden massiv unterschätzen |
| `reply-aware` | Vollständige v15.74-Bewertung plus bis zu zwei legale Predator-Antworten auf eine geschwächte Fusion; Predator-Zielpriorität auf große Fusionen | Mögliche Gegenangriffe werden konkret greifbar | Antwort ist nur ein sichtbarer Teilzug, keine sichere Mehrzug-Vorhersage; Zusatzrechenzeit |

Die letzten drei Arme sind **gezielte Entscheidungs-Ablationen**, kein
permanentes selbstlernendes neuronales Netz. Sie ändern niemals den echten
Kampfschaden oder den tatsächlichen Zerfall. Der Stomp-Effekt bleibt
realistisch, auch wenn eine Policy ihn im Bewertungsmodell testweise ignoriert.

## Versuchsanordnung

- Preflight: Engine- und KI-Tests plus versiegelte **TRAIN-only**-Vorwerte.
- Gleiche Seed-, Starthand-, Startspieler- und Deck-Zuordnungen für alle Arme.
- Stages 2 (Predator/Fusion-Gegenüberstellung), 9 (Fusionsökonomie), 10
  (authentische Predator-Rudel); jeweils sechs eingefrorene Vergleichs-KIs.
- Vier Bewertungsvarianten × (1.152 + 2.304 + 2.304) = **23.040 Duelle**.
- Jede Variante enthält **960 Duelle des neuen Kandidaten**. Die fünf
  unveränderten Vergleichsarme müssen bei gleicher Lage exakt dasselbe tun.
- TRAIN und VALIDATION steuern eine vorab definierte *Forschungsauswahl*;
  HOLDOUT wird erst im vollständigen Abschlussbericht ausgewertet und beeinflusst
  weder die Wahl noch das Q-Lernen.
- Kein automatischer Merge, keine automatische Freigabe für Spiel oder 2v2.

## Wichtige Messungen – zwei getrennte Ebenen

**Tatsächlich ausgeführt** (`real*`): echte Stomp-Angriffe, Nebentreffer,
Vernichtungen, verlorene DEF, LP-Gegenschläge, Kosten in ATK/DEF, Predator-
Angriffe auf große Fusionen und deren echte Vernichtung. Erfasst wird nur
`game === g` im Hauptduell, niemals eine geklonte Vorschau.

**Nur bewertet** (`stomp*`): Kandidatenangriffe, hypothetischer Flächenschaden,
erwarteter Ressourcenverbrauch, simulierte Predator-Antwortzüge und potentielle
Gegenkills. Alle Berichte müssen diese Zahlen ausdrücklich getrennt darstellen.

Wird über alle echten Spiele weiterhin kaum eine große Fusion oder gar kein
Stomp eingesetzt, ist das **ein strategisches Ergebnis**, kein technischer
Fehler: In diesem Fall sind zuerst verfügbare Materialkombinationen,
Kandidatenranking und gegnerische Feldbreite zu untersuchen.

## Grenzen

- Stage 10 prüft Predatoren vor allem gegen Wächter und Seelenzehrer. Der
  direkte Predator-vs.-Fusion-Vergleich entsteht hauptsächlich in Stage 2.
- Der Reply-Planer prüft sichtbare legale Predator-Attacken, keine verdeckten
  zukünftigen Ziehungen; ein positiver Effekt ist noch kein vollständiger
  Beweis für ein ausgewogenes Stein-Schere-Papier-System.
- Aus einer verbesserten Siegquote lässt sich ohne weitere Tests noch kein
  generelles Balancing-Update für die Spielmechanik ableiten.
