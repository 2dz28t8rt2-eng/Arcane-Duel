# Arcane Duel – Alpha 2.2 DEV (Updates 2.1 + 2.2)

**Ziel:** Die schon begonnene Progression aus 2.1 mit der Kampf-Balance aus 2.2 zusammenführen, verifizieren und ausschließlich auf `development` testen. Die öffentliche `main`-Version bleibt unverändert.

## Alpha 2.1 – Belohnungen, Seltenheit und Fortschritt

| Vereinbarung | Stand |
|---|---|
| Erster Turniersieg je Gegner füllt Dropladungen vollständig | Umgesetzt. Ein wiederholter Sieg vergibt nur die reguläre Ladung. Neu korrigiert: Wird beim Erstsieg eine XP-Kapazitätserweiterung erreicht, wird **auf die neue Kapazität** aufgefüllt. |
| Gewinn-Pop-up mit besonderen Erstsiegprämien | Enthält Fusion, die beschwörbare Gestalt, Zusatzsplitter, Bonusessenz, volle Dropladungen und Ace-Shop-Freischaltung. |
| Freie Duelle zeigen tatsächliche Autokampfbelohnungen und Booststatus | Bereits implementiert; Booster-Glow, exakte Chance und Pack-Öffnung bleiben erhalten. |
| Nach Turnierniederlage Stärke-Schätzung des Acemonsters und kaufbarer Hinweis | Vorhanden und jetzt mit einem gezielten Test für die Kosten und die Entsperrung abgesichert. |
| Ace-Monster nach Sieg einmalig kaufbar, schwächer als Turnierboss, im Level günstiger | Implementiert; separate Marktsektion mit Kartenillustration und Seltenheitsbezeichnung. |
| Ace-Monster erst nach Erwerb mit sehr kleiner Chance in Boostern | Weiterhin **0,35 % pro Boosterkarte**. 20.000 deterministische Probekarten ergaben 0 Treffer davor und 59 danach. Die Beobachtung ersetzt keine Garantie für eine individuelle Boosteröffnung. |
| Anfängerlevel leichter, später normaler XP-Verlauf | Der XP-Aufschlag läuft bis Level 10 aus. Die bestehenden Levelgrenzen und Spielstände bleiben kompatibel. |
| Trainingsroutine günstiger | Vier Preise: **100 / 180 / 300 / 480 Essenz**. |
| Kartenkategorie „ACE“ eindeutig erkennbar | Neu: eigenes goldenes Kennzeichen in Sammlung, Kartenhand, Feldansicht und ACE-Markt; die vorhandene Levelfarbe bleibt bestehen. |

## Alpha 2.2 – Kreaturenzerfall und Gegner-KI

- Nach einer Beschwörung ist der erste eigene Zug zerfallsfrei.
- Der automatische Zerfall pro späterem eigenen Zug wird um **5 ATK/DEF** geringer:
  - Startkarten: 20 → 15 → 10, Untergrenze 10
  - Normale Monster: 30 → 25 → 20, Untergrenze 20
  - Fusionen: 50 → 45 → 40 → 35 → 30 → 25 → 20, Untergrenze 20
- Ein überlebender Angreifer verliert zusätzlich **30 ATK nach jedem Angriff**, nicht vorher. Der bereits ausgelöste Kampfschaden bleibt dadurch korrekt.
- **Spielstand-Fix:** `decayAge` und `attackFatigue` werden in aktiven Duell-Snapshots validiert und erhalten. Ältere gespeicherte Duelle bekommen ein konservativ rekonstruiertes Zerfallsalter aus dem bisher verlorenen Gesamtwert. Das Snapshotformat `rulesVersion=5` bleibt kompatibel.
- Das Karten-Detailfenster zeigt den nächsten Zerfallsbetrag, den Untergrenzwert und den bisherigen Angriffskraftverlust durch Attacken.
- Gegner III–X wählen bei Angriffen häufiger die **höchste zerstörbare Bedrohung**, bevorzugen kosteneffiziente Angreifer und vermeiden unsinnige Verluste gegen starke Verteidigung. Ein möglicher direkter Schlusstreffer erhält Vorrang. Die ersten beiden Gegner behalten einfache Angriffsmuster; lokales PvP verwendet weiterhin das ursprüngliche Angriffsverhalten.
- Die ersten Turniergegner wurden für realistische Trainings- und Beutedecks feinjustiert (nach der dritten Trainingsprüfung erhält man bereits Morgenflügel). Der fünfte Turniergegner bleibt bewusst eine spürbare Herausforderung.
- Die Regeltexte und das Duellantenhandbuch erklären den neuen Zerfall, die einmalige Turnierbelohnung und die ACE-Karten.

## Automatisierte Balanceprüfung

Der Regressionstest startet **1.000 deterministische PvE-Partien**: je 100 gegen die zehn Turniergegner, abwechselnd mit Anfangszug für Spieler oder KI; jede fünfte Partie ist Hardmode. Die simulierte Spielerseite nutzt eine regelbasierte KI und eine ungefähr zur vorherigen Turnierstufe passende Kartensammlung – beim ersten Turniergegner die freigeschaltete Trainingsfusion.

| Gegner | Siege der simulierten Spielerseite (von 100) |
|---|---:|
| I – Eisenprüfer | 72 |
| II – Rubinmagierin | 54 |
| III – Dornengarde | 52 |
| IV – Gezeitenfürst | 48 |
| V – Vulkanrichter | 18 |
| VI – Schattenjäger | 25 |
| VII – Himmelswächter | 34 |
| VIII – Runenarchont | 30 |
| IX – Leerenkönigin | 24 |
| X – Astralkaiser | 18 |

Alle 1.000 Duelle endeten innerhalb des maximalen Simulationshorizonts ohne ungültige Werte oder Ausnahme.

**Wichtig:** Diese Siegquoten beschreiben **nur diese simulierten Decks und KI-Strategien**; sie sind keine Prognose für reale Spieler. Die manuelle Testphase bleibt erforderlich.

## Bestehende Systeme und Grenzen

Die acht Kapitel im Duellantenhandbuch, Lootboost-Animationen, Pack-Schnellöffnung, Fusionsbild-Auswahl, Kampf-FX und die zweifach bestätigte Zurücksetzfunktion aus den vorherigen DEV-Schritten bleiben erhalten.

**Nicht Teil dieses Updates:** Der sporadisch gemeldete Fehler beim Turnierduell-Button „Wiederholen“ wurde wie zuvor vereinbart nicht gezielt verändert.

## Manuelle Testempfehlung

2. Ein Turnier erstmals besiegen (volle Dropladungen, konkrete Gewinnprämien); denselben Gegner erneut besiegen (kein erneutes Auffüllen).
3. Nach einer Niederlage geschätzten Ace-Stärkebereich und gekauften Hinweis prüfen.
4. Ace nach Turniersieg einmal kaufen, Karte im Deck verwenden, Spiel neu laden und ACE-Rahmen/Boostershop prüfen.
5. Ein über mehrere Runden bestehendes starkes Monster beobachten: automatischer Zerfall wird geringer, Angriffe kosten 30 ATK.
6. Ein Duell mitten im Kampf speichern, neu laden und kontrollieren, dass Zerfall und Angriffsermüdung fortgesetzt werden.
7. Gegner III, IV und V besonders beobachten, ob die KI Prioritätsziele nachvollziehbar auswählt.
8. Lokal-PvP und die mobile Spieloberfläche gesondert kontrollieren.

## Vorschau

- Normal: https://raw.githack.com/2dz28t8rt2-eng/Arcane-Duel/development/index.html

**Nur `development`: `main` bleibt öffentlich auf Alpha 1.8.**

> **Aktueller Hinweis:** Die separate Admin-Version wurde entfernt. Es gibt nur noch `index.html` mit dem regulären Spielstand unter `arcane-duel-rpg-profile-v3`. Alte Admin-Daten werden weder importiert noch gelöscht.
