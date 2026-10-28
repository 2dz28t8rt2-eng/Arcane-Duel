# KI-Forschung v15.77 – echte Duelle Predator gegen Fusion

## Ausgangspunkt

Die kontrollierte v15.76-Untersuchung zeigte, dass große Fusionen zwar mehrere
Predatoren mit einem Stomp treffen können, unter hohem Druck aber oft innerhalb
von drei Predator-Antworten sterben. Diese künstlich aufgebauten Spielsituationen
sind **keine** vollständigen Duelle und liefern **keine** Winrates.

Mit v15.77 wird geprüft, ob sich diese Anfälligkeit auch ergibt, wenn eine
vollständige KI eigenständig 40-Karten-Decks zieht, Karten ausspielt, legale
Fusionen mit drei bis fünf Materialien bildet und im echten Duell angreift.

## Vorab festgelegtes Experiment

| Dimension | Wert |
| --- | --- |
| Rolle Kandidat / Gegner | Fusion gegen Predator (Stufe 9) und Predator gegen Fusion (Stufe 10) |
| Feste Vergleichsstrategien | Fünf eingefrorene Kontrollarme und ein experimenteller Kandidat |
| Angriffsbewertung | Vorherige Baseline gegen bounded reply-aware; sonst gleiche Regeln |
| Echter Aufbau | Ohne erzwungenes Angriffsverbot (`lock0`) |
| Sensitivität | Symmetrische Aufbauphase über vier Züge (`lock4`) |
| Spiegelung | Beide Startspieler, beide Kandidatenplätze, identische Seeds zwischen Scoring-Varianten |
| Umfang | 2 Rollenstufen × 2 Modi × 2 Aufbauvarianten × 2.304 = 18.432 vollständige Duelle |
| Strikte Splits | TRAIN / VALIDATION / bislang ungeöffnete HOLDOUT nach vorab festgelegten Szenarien |
| Externe Boni | Spielerprofile-Perks und einseitige Gegnerverstärkungen abgeschaltet; kein Platz-0-Vorteil |
| Produktivspiel | Unverändert; keine automatische KI-Übernahme und keine Regeländerungen |

## Zu untersuchende Strategievor- und -nachteile

### Fusionen

- **Vorteile:** Stomp erfasst neben dem Hauptziel bis zu drei benachbarte
  Gegner; Materialrollen verstärken den Effekt; DEF-Schaden schwächt Felder
  selbst ohne unmittelbare Zerstörung. Größere Fusionen bündeln die Essenz.
- **Nachteile:** Material- und Zeitaufwand; Verlust mehrerer Karten bei der
  Zerstörung der Fusion; pro getroffenem Ziel zerfallen bei jedem Angriff ATK
  und DEF; Wächter können über Stomp-Reaktionen LP-Kosten verursachen.
- **Messung:** Legale Mehrmaterial-Fusionen 3/4/5, reale Stomps, Nebentreffer,
  Vernichtungen, DEF-Abtrag, verursachte Gegenschlag-LP-Kosten, ATK/DEF-Erschöpfung,
  echte Winrates je Gegnerrolle und Startplatz.

### Predatoren

- **Vorteile:** Starkes fokussiertes Angriffspotenzial, Rudel-/Schwarmboni
  und teilweise Rüstungsdurchdringung; besonders starke Predatoren können
  eine konzentrierte Fusion taktisch unter Druck setzen.
- **Nachteile:** Gegen mehrere Ziele gleichzeitig anfällig; schwächere
  Predatoren verlieren gegen große Fusionswerte häufig den direkten Kampf.
- **Messung:** Tatsächliche Predator-Angriffe auf Fusionen mit mindestens
  drei Materialien (nicht hypothetische Simulationen), echte Vernichtungen,
  Kontrolle pro Spielfeldeigenschaft und Duell-Winrates.

## Verlässlichkeit und Auswertung

Im v15.77-Probelauf wurden bereits **echte** 3-, 4- und 5-Material-Fusionen,
Stomps und Predator-Angriffe darauf beobachtet. Das ist nur eine
Funktionskontrolle, noch kein Ergebnis des großen Trainingslaufs.

Die KI-Scoring-Variante wird ausschließlich anhand der **VALIDATION**-Duelle
ohne Angriffsverbot ausgewählt; die HOLDOUT-Auswertung folgt erst danach.
Eine geringe Winrate-Differenz gilt ohne Replikation nicht als gesicherter
Balancevorteil. Außerdem wird bewusst zwischen `lock0` und `lock4`
unterschieden; Ergebnisse dürfen nicht mit der künstlich aufgebauten
v15.76-Untersuchung zu einer gemeinsamen Winrate vermischt werden.
