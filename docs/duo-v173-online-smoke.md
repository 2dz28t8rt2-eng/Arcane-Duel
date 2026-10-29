# One-time v17.3 online 2v2 safety test

This marker triggers a single isolated GitHub Actions check against the
already deployed v17.3 2v2 Edge Function. One temporary profile is created.
The test verifies that an active deck card cannot be recycled and that
insufficient resources prevent upgrades, while the profile revision,
currency and collection stay unchanged.

No Solo profile, AI training or `main` deployment is involved.
