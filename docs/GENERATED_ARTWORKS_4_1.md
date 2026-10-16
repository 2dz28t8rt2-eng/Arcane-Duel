# Arcane Duel 4.1 – Neue KI-Artworks

**Integriert am 16.10.2026 auf `development`: zwölf neue 1024×1024 WebP-Kartenillustrationen.**

**Level, Elemente, Kampfwerte, Spielstände und IDs bleiben erhalten**. Namen und Beschreibungen werden bei Bedarf an das neue Motiv angepasst. Die ersten zehn Bilder stammen aus dem zugeordneten Integrationspaket; Argentum-Koloss und Nox-Albtraum wurden anschließend auf direkten Integrationsauftrag ergänzt.

| ID | Kartenname | Neues Motiv |
|---|---|---|
| 320 | Himmelskrone | Himmlischer Kronendrache |
| 74 | Areon, Himmlischer Sturmwyrm | Himmlischer Sturmwyrm |
| 181 | Morgenflügel | Himmelsdrache im goldenen Morgenlicht |
| 318 | Aschewyrm Rakh | Magma-Drache über brennenden Ruinen |
| 316 | Sylvan, Wächter des Urwalds | Erhabener Wächter des Urwalds |
| 53 | Aschenwolf | Lavawolf im Sturm der Asche |
| 62 | Korallenfürstin | Korallenkönigin in der Tiefsee |
| 315 | Phönix Myrra | Phönix aus Flammen und Gold |
| 260 | Schattenwyrm der Zwischenwelt | Schattenwyrm im kosmischen Gewitter |
| 70 | Schattenwolf Lyra | Spektralwolf im Mondlicht |
| 314 | Argentum-Koloss | Silberner Erdkoloss in den Ruinen |
| 319 | Nox-Albtraum | Gehörnter Nachtmahr der Mondruinen |

## Einbindung
Die Bilder liegen unter `assets/custom-art/generated-4-1/`. Das dortige `manifest.json` dokumentiert Karten-IDs, Bildtitel und SHA-256-Prüfsummen aus dem Integrationspaket.

`assets/arcane-v4-live.js` und `assets/arcane-v4-catalog.json` verwenden die neuen Bilder für die bestehenden spielbaren Karten. Die separat gespeicherten Sammlungsdaten in `assets/collection-v3-data.js` verwenden dieselben zwölf Zuordnungen. Beide HTML-Einstiege laden ihre aktualisierten Skripte mit einer neuen Cache-Version.

Die fertigen Karten und Kontaktbögen der Wellen 07 und 09 werden mit dem bestehenden Originalrenderer neu erzeugt. Damit sind beide vormals offenen Karten, Argentum-Koloss (314) und Nox-Albtraum (319), ebenfalls erneuert.

## Quellen / Namensführung
Originale KI-generierte Illustrationen für Arcane Duel, auf Basis der gewünschten bestehenden Fantasy-Art-Richtung. Die letzten beiden Motive wurden mit dem eingebauten `image_gen`-Werkzeug erzeugt; genaue Prompts und Dateipfade stehen in [ARGENTUM_NOX_ARTWORKS_4_1.md](ARGENTUM_NOX_ARTWORKS_4_1.md).
Drei Motive erhalten passendere Namen: Areon, Himmlischer Sturmwyrm (74), Schattenwyrm der Zwischenwelt (260) und Sylvan, Wächter des Urwalds (316). Die übrigen neun Namen bleiben erhalten. Alle zwölf Beschreibungen passen zum jeweiligen Bild; besondere Hinweise wie das Trainingslimit von Morgenflügel und die ACE-Zuordnungen bleiben enthalten. Die Zuordnung in Duellen und Spielständen bleibt über die unveränderten IDs stabil.
Alte OpenGameArt-Artworks bleiben für historische Lizenzdokumentation vorhanden, werden bei diesen zwölf Karten aber nicht mehr aktiv eingesetzt.

Der vorhandene Urheberhinweis wird anhand des tatsächlich verwendeten Bildpfads aufgelöst. Die Urheberangaben der alten externen Bilder werden den neuen KI-Illustrationen nicht zugeordnet.

## Bildausschnitt
Die WebP-Dateien wurden für die quadratische Monsterbildfläche formatfüllend zugeschnitten. Keine schwarzen Balken.

## Abschluss
Alle zwölf konkret beauftragten Bildersetzungen sind integriert. Die gesonderten weiteren Sichtungskandidaten stehen in `ARTWORK_NEUGESTALTUNG_VORMERKUNG.md`.

## Animationskorrektur
Der Animationsschalter setzt `ad-motion-disabled` jetzt sofort am `body`, wie es die Element- und Rahmeneffekte erwarten. Bisher wurde die Klasse erst verzögert am `html`-Element gesetzt; dadurch konnten die neuen Effekte trotz ausgeschalteter Animationen weiterlaufen. Die CSS-Medienabfrage für reduzierte Bewegung bleibt zusätzlich wirksam.

Die Großansichten verwenden außerdem keine gesonderte Animationsregel mehr, die durch ihre höhere CSS-Spezifität die Abschaltung oder reduzierte Bewegung übersteuern konnte. Deckportal, eigene und gegnerische Vorschau folgen derselben zentralen Elementanimation.

Die Elementfarben setzen sich nun auch in den normalen Kartenvorlagen gegen die ältere einheitliche Schrift- und Hintergrundfarbe der Levelrahmen durch. Der Browsertest prüft alle sechs Paletten und die drei Großansichten.
