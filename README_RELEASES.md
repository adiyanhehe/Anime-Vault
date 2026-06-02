# Automated AnimeVault builds without GitHub Releases

AnimeVault builds installers automatically whenever `main` changes, whenever a version tag such as `v0.2.0` is pushed, and whenever the workflow is run manually. The workflow does **not** create tags, create GitHub Releases, or upload assets to GitHub Releases. Instead, every successful workflow run stores the desktop installers and Android APK as GitHub Actions artifacts.

## Branch policy

Build automation is maintained on `main`; do not create extra long-lived branches for installer build updates.

## What gets built

- Windows: NSIS installers for x64 and arm64.
- macOS: unsigned DMG and ZIP builds for Intel and Apple Silicon.
- Linux: AppImage and DEB packages.
- Android: Capacitor release APK.

## Where to download builds

Open the **Automated Installer Builds** workflow run in GitHub Actions and download the artifacts from that run:

- `animevault-Windows-installer`
- `animevault-macOS-installer`
- `animevault-Linux-installer`
- `animevault-Android-apk`

Artifacts are retained for 14 days by the workflow. Increase `retention-days` in `.github/workflows/electron-build.yml` if builds need to remain downloadable longer.

## Desktop auto updates

The current artifact-only workflow does not publish the release metadata files required by `electron-updater`, so packaged desktop builds are still produced, but GitHub Release based auto-update delivery is intentionally disabled for this build path. Re-enable a release publishing job only if you want installers and update metadata to be distributed through GitHub Releases again.

## macOS signing note

This repository intentionally builds unsigned macOS artifacts when Apple Developer ID credentials are not available. That avoids requiring an Apple Developer account in CI, but it does not defeat or bypass Gatekeeper. Users may still need to approve the unsigned app in macOS Privacy & Security settings. For production distribution, add Apple signing and notarization secrets instead of relying on unsigned builds.
