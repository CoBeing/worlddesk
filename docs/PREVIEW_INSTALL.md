# WorldDesk Preview — installation

## Official downloads

Open https://github.com/CoBeing/worlddesk/releases and choose the latest prerelease. Verify the file SHA-256 against the release checksum asset.

| Platform | File | Procedure |
|---|---|---|
| macOS Apple Silicon or Intel | WorldDesk-Preview-macos-*.zip | Unzip and drag WorldDesk Preview.app into Applications |
| Windows x64 | WorldDesk-Preview-windows-x64.exe | Run the NSIS installer and follow its UI |
| Ubuntu/Debian x64 | WorldDesk-Preview-linux-x64.deb | Install with the system package manager |

If a platform file is missing, that platform build has not been published or verified.

**Unsigned preview warning:** macOS Gatekeeper and Windows SmartScreen may display publisher warnings. Confirm the official release URL and checksum. On macOS, after inspecting the app you can use Finder right-click → Open or review the block in Settings → Privacy & Security. On Windows, use a manual SmartScreen override only if you trust the file and checksum. Do not turn off your computer's security protection system-wide.

## First use

1. Open the app, without login.
2. Choose a real event on the map or in the list.
3. Click 给我一个惊喜 to discover a random event or station.
4. Select 听听世界, choose a radio station, and use the built-in player if supported.
5. Save a favorite with ♡ or share the sourced record.
6. The Local Bridge panel reports its bundled version. Explicitly click 检测本地组件 to run a read-only self-test.

## Local Bridge in the bundle

Local Bridge runs as a Tauri sidecar; it is an independently built binary, not a replacement for a previously installed Bridge. Opening WorldDesk does not register a system service, start a local web server, change Chrome Native Hosts, access user messages, log into an Agent or upload files. Existing Bridge and CloudFile profiles are preserved.

## Internet and limitations

USGS, NASA EONET, Radio Browser and OpenStreetMap data rely on the public Internet. Individual sources may fail, be stale or rate-limited; other available sources continue working. Offline previously saved cards are historical only. Direct radio streams vary by provider, codec and rights.

CoBeing Basic remains in active development; user logins, memory sync, multiplayer rooms and private Agent operations are not available yet. God’s Eye View is linked as a separate project, not packaged as a 3D engine.

No signing certificate or notarization is used for this release; future updates are installed manually.
