# Desktop preview release

Development branch: `dev`. Bump package.json/package-lock.json, Cargo.toml/Cargo.lock and tauri.conf.json together, update RELEASE_NOTES.md, test, then push an annotated `vX.Y.Z-preview.N` tag.

The release workflow builds macOS Apple Silicon and Windows x64, including the pinned Local Bridge sidecar. It creates a draft release, uploads installers, signed updater artifacts and SHA-256 files, then publishes only after both platform jobs pass. The final job updates `latest.json` on the `updates` branch; preview clients read that HTTPS URL because GitHub's latest-release route excludes prereleases.

`TAURI_SIGNING_PRIVATE_KEY` is a repository Actions secret. The matching public key is in tauri.conf.json. The private key must never be committed or regenerated for an ordinary release: installed clients trust that public key. Keep a secure backup of the existing key. The current key has an empty password; CI passes an empty TAURI_SIGNING_PRIVATE_KEY_PASSWORD. Updater signing is separate from Apple notarization/Windows Authenticode.

For a local signed build, provide the same signing environment variables and use Rust 1.90.0. The key is stored outside the repository by the maintainer. Never print it in logs.

After publishing, download assets, verify their SHA-256 files, inspect the public updater manifest and verify that both artifact URLs are accessible. Installation smoke tests should be performed on each target OS; CI build success alone does not establish interactive Windows installation acceptance.
