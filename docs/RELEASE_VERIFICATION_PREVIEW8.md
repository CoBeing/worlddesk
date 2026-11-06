# Preview.8 release verification

Date: 2026-11-06. App source: `6bfa828`; development branch: `dev`.

- Release: https://github.com/CoBeing/worlddesk/releases/tag/v0.1.0-preview.8
- Both-platform build/publish run: https://github.com/CoBeing/worlddesk/actions/runs/42231217789 — passed.
- Windows install/startup smoke: https://github.com/CoBeing/worlddesk/actions/runs/42232972189 — passed. Installer ran silently on Windows runner; bundled Local Bridge returned its version; the installed app stayed running through the startup check.
- 44 frontend tests passed. Native invalid-input test passed on both platforms; three unrelated live-provider tests remained intentionally ignored.
- Downloaded Mac ZIP, Mac updater archive, Windows installer and signature files matched their SHA-256 manifests. Both updater artifacts passed verification against the configured public key; modifying one byte caused verification to fail.
- Public `updates/latest.json` contains Preview.8, matching signatures and downloadable Mac ARM64 / Windows x64 artifacts.
- Actual Mac update acceptance: a separate Preview.7 test copy discovered Preview.8 automatically, downloaded and installed it, offered restart, and reopened the application. Its bundle version changed to `0.1.0-preview.8`.

Limits: Windows coverage is installation/startup smoke, not interactive feature or in-place updater acceptance. Mac Intel and Linux packages are not published. OS publisher certificates/notarization are absent; updater cryptographic signing is enabled. Older publicly released versions need one manual installation to gain the updater.
