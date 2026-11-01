# WorldDesk Preview

**打开世界，随时去远方。** Explore the real world, even when you are staying home.

WorldDesk is an independent CoBeing ecosystem application. The CoBeing platform stays in the background: no registration is necessary to explore.

## Preview features — implemented

- **随便看看 · World Cinema**: six genuinely sourced, watchable scenes including Yangshuo, Zhangjiajie, the Great Wall, Sichuan highlands, NASA DSCOVR EPIC Earth imagery, and JMA Himawari infrared cloud observations with capture dates, credits, and playback/step controls. Photos are archives; satellite images are delayed observations, not live webcams.
- **航班追踪 · Flight Watch**: real open ADS-B aircraft snapshots for selected China and world airspace regions, with callsign, aircraft type, registration, reported altitude, ground speed, heading, location age, and follow mode. On desktop only; fetched on entering the view and about every 60 seconds while visible. Source is adsb.lol ODbL 1.0, not FR24 data.
- **地球观察**: real earthquake observations from USGS and natural events from NASA EONET on a local Natural Earth coastline map.
- **听听世界**: try direct Internet radio streams from Radio Browser. Streams can be blocked or use unsupported codecs.
- **收藏与分享**: favorites stored in this app locally, share official event and source links. No automatic cloud sync.
- **中英双语**: follows the operating system language by default (Chinese/English), with a manual selector.
- **IP 地区初始定位**: GeoJS best-effort coarse location, manual Chinese city fallback; no precise GPS permission or raw IP stored.
- **中国友好体验**: Chinese radio catalog first, local sunrise, sunset and moon phases computed without paid API keys; bundled offline coastline map.
- **Local Bridge included**: the desktop install carries the open-source eaopen/local-bridge runtime as a bundled sidecar. The app reads the actual bundled binary version, with an opt-in self-test. No separate installation, background service, model account or third-party communications permission is required.
- **Built-in astronomy and world observations**: internal sky calculations and world-event map; no dependency on CoBeing or God’s Eye View UI. CoBeing remains optional behind the scenes and is not connected in this Preview.

## Download

**[Get WorldDesk Preview on GitHub Releases](https://github.com/CoBeing/worlddesk/releases)**

Unsigned and unnotarized packages are for testing. Read [install and safety notes](docs/PREVIEW_INSTALL.md) and verify the SHA-256 checksum for the exact downloaded file. There is no code signing, automatic updater or login service.

## Build from source

Requirements: Node.js 24+, Rust 1.90+, Tauri 2 native platform prerequisites, and a checked-out Local Bridge source tree.

    git clone https://github.com/CoBeing/worlddesk.git
    git clone https://github.com/eaopen/local-bridge.git
    cd worlddesk
    npm ci
    npm run bridge:prepare
    npm run tauri:build

The prepare script defaults to a sibling directory named local-bridge. Use LOCAL_BRIDGE_REPO to override. Preview CI pins a specific Local Bridge commit for reproducible packaging.

Use npm run dev for a browser-only preview with no native privileges, and npm test for data parser tests.

## Privacy and boundaries

WorldDesk requests only public, read-only feeds; it does not automatically read user messages, files, microphones or SDR devices. Local Bridge is dormant except for its explicit read-only version check and user-triggered self-test. CoBeing identity, sync, relationships and AI Agents are not in the public Preview yet. No private telemetry or event location accuracy beyond the data source is claimed.

Source observations can be delayed and must not be used for emergency, aviation or route planning. Open ADS-B has patchy coverage (especially in China), is not a substitute for FR24 or ATC information, and never supplies invented route endpoints. We do not use unofficial Flightradar24 scraping or distribute paid 3D imagery.

## Open-source and data attribution

- App: Apache-2.0 (this project).
- Local Bridge: Apache-2.0 (https://github.com/eaopen/local-bridge).
- Leaflet: BSD-2-Clause. Simplified coastline data: Natural Earth (public domain) via world-atlas/topojson-client; no external map tile CDN.
- Event data: USGS Earthquake Feeds and NASA EONET APIs.
- Radio Browser is a station directory, not a WorldDesk rebroadcast server. Stations own their streams and licensing.
- God’s Eye View is a separate upstream project; its source or licensed data are not copied into WorldDesk.


## Flight data, media and content credits

- Flight data and licensing: see docs/FLIGHT_DATA.md. The open API (ODbL 1.0) is from adsb.lol. This public preview is exploratory; contact the source maintainer before broad production rollout. FR24's consumer website prohibits automated data collection; its official API is separately licensed.
- Imagery and credits: see docs/MEDIA_CREDITS.md. Archive photos and satellite observations retain their own licenses and attribution requirements. They are not part of the WorldDesk Apache-2.0 grant.
- Experience roadmap: docs/CAPABILITY_ROADMAP.md. Candidate next features include ISS passes, sunlit Earth, properly licensed public cameras and stories.
