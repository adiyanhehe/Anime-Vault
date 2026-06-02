# macOS Installation Work‑around

When you download **AnimeVault‑0.1.0.dmg** macOS will show the warning *“Anime Vault is damaged and can’t be opened”* because the bundle is unsigned.  You can still install it safely by using the **Open** command instead of a double‑click:

1. Locate the downloaded DMG in Finder.
2. **Right‑click** (or Control‑click) the file.
3. Choose **Open** from the context menu.
4. macOS will show a smaller confirmation dialog – click **Open** again.

The app will launch and the DMG will mount normally. No Apple Developer account or signing certificate is required for this manual step.

> ⚠️ This method works for each user individually. Distributing a signed DMG (requires an Apple Developer ID) removes the extra step for everyone.
