# Arcane Duel 1.1.2 – Einladung und Menüeinstieg

Ein gespeicherter, noch nicht freigegebener Gruppenraum öffnete beim Host nach
dem Laden wieder den Einladungsdialog. Dieser hatte keine Schließen-Schaltfläche.
Bei einer bestehenden Gruppe öffnete der 2v2-Titelbutton den Dialog, ohne vorher
den darüberliegenden Titelbildschirm zu schließen.

Der Host öffnet den Gruppenraum jetzt ausdrücklich über „Spieler einladen“ oder
den 2v2-Button. „Schließen“ und Escape schließen das Fenster, erhalten aber den
Raum und den Einladungslink. Der Link wird im eigenen Browser zusammen mit der
Raumzuordnung gespeichert. Nach Neuladen und Gastbeitritt bleibt ein geschlossenes
Hostfenster geschlossen. Bei alten wartenden Räumen ohne lokal gespeicherten Link
kann der Host einen neuen erzeugen, solange noch kein Gast beigetreten ist.

Beide 2v2-Einstiege warten auf das Ende des ursprünglichen Titelübergangs, bevor
sie den Gruppen- oder Gegnerdialog öffnen. Auch der Gast wird erst danach für
den Warteraum gesperrt, sodass der Titelübergang diese Sperre nicht aufheben kann.
Der Gast bleibt bis zum Fortsetzen durch den ursprünglichen Host im Warteraum.
Der veraltete URL-Auftrag `invitePlayer` wird nach einmaliger Verarbeitung entfernt.

`scripts/verify-online-entry-v112.cjs` prüft die sichtbaren Schaltflächen mit zwei
getrennten Browsern: schließen, neu laden, Solo betreten, denselben Link wieder
öffnen, Gastbeitritt, beide 2v2-Einstiege, Fortsetzen und Nein sowie schmale Ansicht.
Der bestehende vollständige Duelltest bleibt zusätzlich aktiv. Seine Angriffswahl
wartet nun ausdrücklich auf die ursprüngliche Rudelführer-Einführung und prüft die
tatsächlich ausgewählte Feldposition.

Persönliche Spielstände, Serverregeln und Decks werden durch diese Korrektur nicht
migriert oder zurückgesetzt. Veröffentlichung und aktive Revision sind zusätzlich
über `/api/health` zu prüfen; diese Datei allein ist kein Deploymentnachweis.
