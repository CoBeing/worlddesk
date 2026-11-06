# WorldDesk Preview — installation

## Official downloads

Open https://github.com/CoBeing/worlddesk/releases and choose the latest prerelease. From v0.1.0-preview.8, macOS Apple Silicon and Windows x64 downloads are provided. Verify the file SHA-256 against the release checksum asset.

| Platform | File | Procedure |
|---|---|---|
| macOS Apple Silicon (M1/M2/M3/M4) | WorldDesk-Preview-macos-arm64.zip | Unzip and drag WorldDesk Preview.app into Applications |
| Windows x64 | WorldDesk-Preview-windows-x64.exe | Run the installer |
| Ubuntu/Debian x64 (later) | Not in v0.1.0-preview.2 | Return after native Mac acceptance |

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

USGS, NASA EONET and Radio Browser rely on the public Internet; the bundled coastline and sky calculations work offline. Individual sources may fail, be stale or rate-limited; other available sources continue working. Offline previously saved cards are historical only. Direct radio streams vary by provider, codec and rights.

CoBeing Basic remains in active development; user logins, memory sync, multiplayer rooms and private Agent operations are not available yet. WorldDesk provides its own sky calculation and world-event visualization; there is no CoBeing or God’s Eye View connection in this Preview.

No OS signing certificate or notarization is used. Starting with Preview.8, updates are checked silently ten seconds after startup and every six hours while the window is visible and online. A small navigation button offers download and installation; on Mac, restart when convenient. Windows installation can close the app automatically. Update packages are cryptographically verified. Older versions require one manual installation of Preview.8.

## Locale and IP location

The app uses your operating system language (Chinese or English) by default. Changing the dropdown overrides the language; the IP country never overrides this preference. For a useful starting point, the app attempts coarse public-IP geolocation directly from the user device via GeoJS, with ipwho.is as a fallback. Both services can see the request IP; WorldDesk does not persist it. If they fail or you use a VPN, select a preferred city manually (including Beijing, Shanghai, Shenzhen, Chengdu, Hong Kong, Singapore and more). The choice stays on this device. No precise GPS permission is requested.

## China-first content

Chinese language radio stations are prioritized, followed by global streams. On-device sunrise, sunset and moon phase calculations work for the selected city without APIs. Live China-region events are shown only when the public source actually reports them; no invented local observations. Mainland-China map platform APIs often need licensed keys and appropriate service terms; this Preview avoids them with a simplified, non-navigational Natural Earth coastline map. Any future commercial map service must be authorized separately.


## New: real World Cinema and Flight Watch

The home view opens with licensed real photographs, NASA DSCOVR EPIC Earth images, and JMA Himawari infrared cloud observations. Use Previous / Next and Keep Exploring to navigate. Captions show source, author, license, and observation/photo date; these are not live cameras. Satellite frames are delayed or unavailable at times. See docs/MEDIA_CREDITS.md.

Flight Watch shows openly received aircraft ADS-B positions (adsb.lol ODbL 1.0), not FR24. Choose a current or preset airspace: Shanghai, Beijing, Pearl River Delta, Hong Kong, Tokyo, Singapore, or London. Click a plane to see reported aircraft type, altitude, speed, heading, and position age; toggle Follow to recenter after subsequent reports. Only reported coordinates are shown, with no inferred origin or destination. Refreshing happens while the view is active (about once per minute), not as a background aircraft monitor. The third-party source sees the chosen geographic center and the requesting IP. The development browser has a local test proxy; the installed Mac app uses a fixed native HTTPS request. See docs/FLIGHT_DATA.md.

## Flight Live and map options (Preview 0.1.0-preview.4)

Choose **Flight Live / 飞行现场** on the left. The map fills the main part of the window. Use the aircraft list toggle to reclaim the full canvas. Click a plane to open its details (heading, speed, altitude, freshness) and optionally follow it; close the right drawer with ×. Flight observations refresh about every minute while the view is visible. The four cards are **current snapshot values**, not 24-hour aggregates. Use the search field to find a callsign, aircraft type or registration. The city/region selector changes the airspace, not the UI language.

The map switch offers a keyless OpenFreeMap vector map (Detailed), a dark variant (Night) and an offline Natural Earth outline. If online tiles fail, the app falls back to its bundled sketch. Detailed tile coverage/access from mainland China is not guaranteed; no raw location, API credential or browsing history is sent to a WorldDesk backend.

The main menu now has five entries. In World Pulse, the weaker event categories are filtered using secondary tabs instead of competing with immersive/flight observation at the top level.
