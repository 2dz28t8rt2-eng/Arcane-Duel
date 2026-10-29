# One-time live 2v2 progression validation

This marker documents the opt-in GitHub Action run for the isolated 2v2
progression endpoint. It tests two server-created test profiles, one test room,
forged deck and perk input rejection, profile recovery, hidden hands, and stale
revision rejection. Real human-device multiplayer acceptance remains deferred.

The test does not disclose profile secrets, grant real players loot, or touch
singleplayer profiles. Code and schema are maintained on `development`.
