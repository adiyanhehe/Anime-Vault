# Reliable release publisher workflow

`release-publisher.yml` avoids GitHub Release conflicts by separating build jobs from publishing:

1. Windows, macOS, Linux, and Android jobs build artifacts and upload them as workflow artifacts.
2. One final publisher job downloads those artifacts.
3. The publisher creates or updates a single `autobuild-<run>-<sha>` GitHub Release and uploads all generated files with `--clobber` on reruns.

This file intentionally documents the new conflict-free publisher separately from `README_RELEASES.md` so the existing release docs can stay aligned with `main` while this branch resolves merge conflicts.
