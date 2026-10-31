# 2v2-Deckplätze

Das 2v2-Profil enthält drei persönliche Deckvarianten. Jede Variante speichert
Haupt- und Fusionsdeck. Die Varianten teilen sich die persönliche 2v2-Sammlung;
für mehrere Varianten wird dieselbe Karte nicht mehrfach benötigt. Geschützte
Karten können nicht zerlegt werden, wenn eine gespeicherte Variante sie benötigt.
Ein laufendes Duell behält sein beim Start gespeichertes Deck. Der separate
Einzelspieler-Spielstand und das Profil des Partners werden nicht verändert.

## Bereitstellung

1. Den Zielstand von `development` und das richtige Supabase-Projekt prüfen.
2. Die Migration `20261031060000_duo_deck_slots.sql` einmalig über den
   üblichen Migrationsablauf anwenden. Sie ergänzt nur private 2v2-Profilspalten
   mit Standardwerten; sie importiert keine Einzelspieler-Spielstände.
3. Die Funktion `arcane-duo-v2` einschließlich der neuen Datei
   `duo-deck-slots-v222.js` und aller übrigen Dateien aus demselben Commit
   bereitstellen. Keine Zugangsdaten oder Wiederherstellungslinks ausgeben.
4. Zwei isolierte Testprofile verwenden: Deckplatz kopieren, wechseln und
   bearbeiten; Bestandsschutz und erhaltene Verbesserungen prüfen; bestätigen,
   dass der zweite Spieler und ein laufendes Duell unverändert bleiben.
5. Mit einem bestehenden Testprofil prüfen, dass das bisherige aktive Deck
   erhalten bleibt und beim ersten Bearbeiten die anderen beiden Varianten
   ihren ursprünglichen Zustand behalten.

Solange der Server die neuen Felder nicht liefert, zeigt der 2v2-Client bei
den Deckplätzen einen Hinweis statt nicht funktionierender Schaltflächen.
Die Migration und der Live-Test wurden in dieser Arbeitsumgebung nicht ausgeführt.
