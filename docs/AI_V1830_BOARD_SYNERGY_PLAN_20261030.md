# v18.3: Spielqualität, Synergien und Boardstrategie – 30.10.2026

Vorbefund: v18.2 Actions #41057782077, 46.080 Duelle, 42 ausgeführte andere Angriffe, keine Siegerwechsel. Champion bleibt `l10-guarded-worst-reply`.

Forschungsarm `baseline`: unveränderte v18.2-Policy. `optimized`: Bewertete legale Angriffskandidaten (maximal 18 pro Entscheidung), Sichtfeld-Bedrohung, aktive Wächter/Seelenzehrer-Verbindungen, reale LP-/Monsterverluste und maximal ein zweiter **legaler Angriff im aktuellen eigenen Zug**. Keine hypothetische gegnerische Zugübergabe im neuen Angriffsoverride. Vollständige Angreifer-/Ziel-UIDs, Score-Margin, Board- und Bond-Telemetrie im Vergleich.

46.080 gepaarte Duelle (23.040 je Kohorte) über elf Stages; Identität von Seeds und Sitzen; TRAIN-only Lernmodell; VALIDATION und HOLDOUT nur zur Bewertung. Starke Aufstiegshürden (H2H-TRAIN +4, H2H-VAL +8, L10, Zerfall, Synergie und Holden-Out), keine automatische Promotion, keine Änderung an Live-KI oder Gameplay-Balance. Wächter 95 %-Pool, 22/78 ATK/DEF unverändert.

Erfolg bedeutet nachweislich unterschiedliche legale Aktionen und positive gepaarte Siege in unabhängigen Starts, besonders gegen Level 10 und Fusion. Profilreplikate sind keine unabhängigen Starts. Version v18.2 bleibt unverändert archiviert.
