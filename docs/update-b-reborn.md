# Arcane Duel 3.0 – Update B: Bestiarium Reborn

## Scope und Speicherstände

Bewusster **Neustart** ohne Migration oder Entschädigung. Neuer Local-Storage-Schlüssel `arcane-duel-rpg-profile-v4-reborn`; ältere lokale Spielstände bleiben physisch vorhanden, werden von dieser Version aber nicht geladen. Ein neuer Spieler beginnt mit dem neuen Startdeck. Die Hauptversion `main` ist vom Entwicklungsupdate nicht betroffen.

## Kuratierter RPG-Kartenpool

128 sammelbare Karten insgesamt:
- **22 Normalmonster-Familien**, je **vier eigenständige Stufen** (88 Varianten) mit demselben Artwork und Element innerhalb der Familie; Stufen besitzen eigene Werte, eigene Karten-IDs und eigene Kopien/Upgrades.
- **30 reguläre Fusionen** mit eigener Kartenidentität.
- **10 ACE-Monster**, jeweils genau eines für Turniergegner I–X. Zwei ACEs sind Normalmonster, acht Fusionen.

Die 324 bisherigen Templates plus 66 neue Stufenvarianten werden intern noch mit IDs gehalten, aber ausgemusterte Templates sind nicht sammelbar, nicht im RPG-Deckbau, Loot oder Booster-Pool. Nur die 128 kuratierten Karten erscheinen im normalen Sammlungsmenü und Atelier. Dieses Vorgehen entfernt unnötige Hardcode-Brüche durch das bisherige `CARDS[id]`-System. Der klassische lokale PvP-Kartenpool bleibt getrennt.

Alle Gegner und ihre Decks/Belohnungspools, frühe Startbooster, Meilensteine und Deck-Vorschläge auf den kuratierten Pool angepasst. Gerade Gegner I–III behalten ihre bewusst unterschiedlichen Spielstile: I normale Offensive, II ausbalancierte Verteidigung mit zwei Fusionen, III stärker fusionsorientiert.

## Tägliche Quests

- 18 Aufgaben im Tagespool, täglich deterministisch durchgemischte Reihenfolge.
- Maximal **3 gleichzeitig aktiv** und **15 abgeholt pro Tag**.
- Inaktive Aufgaben erhalten **keinen** Fortschritt. Eine neue Quest wird erst beim Freischalten mit **0 Fortschritt** aktiviert.
- Wenn eine Quest mitten in einem Kampf nachrückt, zählt sie **nicht rückwirkend** für diesen Kampf.
- Tageswechsel beeinflusst **nicht** die permanenten Belohnungen/Bonusse der Herausforderungsmodi.

## Bildfenster

Alte SVG-Generator-Artworks werden mit `object-fit: contain` statt `cover` vollständig dargestellt. Kuratierte Illustrationen dürfen weiterhin das Portraitfenster ausfüllen. Die neu angepassten Kartenrahmen bleiben erhalten.

## Qualitätssicherung

- `npm test`: 152 von 152 bestanden (inkl. zwölf neuer Update-B-Regressionstests).
- Browser-Sichtprüfung: Desktop 1440×900 / Mobil 390×844, alle 13 Hauptmenüs, Bildreferenzen und Karten-Detailvorschau ohne Skript- oder Assetfehler.
- 120 isolierte, deterministische Turnierduelle und 90 komplette Testläufe bis Gegner III ohne Programm-Ausnahmen.
- 24 vollständige Turnierversuche ohne Farming: keiner kam bis X (III/IV als Hürden).
- 12 vollständige Wirtschafts-/Turnierverläufe **mit** Farmen, Booster-Käufen und Deckverbesserungen über zehn Gegner: **10/12 erfolgreich**; zwei blockiert bei IV bzw. IX. Das Spiel ist mit Aufbau-/Farmphasen schaffbar, verlangt derzeit aber teils 112–160 Farmduelle – **Balance-Beobachtung für ein späteres Update**.

## Bewusst nicht umgesetzt

Die spätere Spezialisierung durch Low-Level-Fusionsketten, neue Fusions-/ACE-Artworks oder ein umfassendes Balancing von XP/Farming/Boostern sind **nicht** Teil dieses Updates.
