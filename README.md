# WorldDesk Preview

**打开世界，随时去远方。** Explore the real world, even when you are staying home.

WorldDesk is an independent CoBeing ecosystem application. The CoBeing platform stays in the background: no registration is necessary to explore.

## Preview features — implemented

- **随便看看 · World Cinema**: six genuinely sourced, watchable scenes including Yangshuo, Zhangjiajie, the Great Wall, Sichuan highlands, NASA DSCOVR EPIC Earth imagery, and JMA Himawari infrared cloud observations with capture dates, credits, and playback/step controls. Photos are archives; satellite images are delayed observations, not live webcams.
- **飞行现场 · Flight Live**: a **large, interactive map-first** view (default detailed map), collapsible aircraft list, expandable flight details, callsign/type/altitude/speed/heading, real following, search and airborne filter. Region presets include Chinese and overseas airspaces. Four derived live cards show *aircraft now / fastest / highest / nearest*. Sampling counts are **since this app opened**, never fabricated 24-hour traffic. Automatic desktop-direct multi-source positions: FR24 public web feed + adsb.lol ODbL 1.0 + adsb.fi (personal non-commercial use), deduplicated by aircraft with graceful partial-source failure. Selected aircraft show provider airport codes from FR24, with adsbdb as a callsign-metadata fallback and session-only observed tracks; missing routes remain unknown. The FR24 adapter is a personal-use web-feed integration, not its official paid API.
- **地图三模式**: **OpenFreeMap** detailed or night vector map with roads/city labels, or bundled Natural Earth offline outline with a compact city catalog. Online map access from mainland China may vary; the app falls back rather than freezing. The online renderer loads on demand when entering flight view to keep the world cinema fast.
- **收敛的世界动态**: only five primary entries — World Cinema, Flight Live, World Pulse, World Radio and Favorites. Sky, Nearby, Nature Events and Earthquakes are World Pulse subfilters. The viewing sidebar shows sourced, actionable observations: local sunset, current aircraft (when available), delayed Himawari East Asia imagery, Chinese radio.

- **地球观察**: real earthquake observations from USGS and natural events from NASA EONET on a local Natural Earth coastline map.
- **听听世界**: try direct Internet radio streams from Radio Browser. Streams can be blocked or use unsupported codecs.
- **收藏与分享**: favorites stored in this app locally, share official event and source links. No automatic cloud sync.
- **中英双语**: follows the operating system language by default (Chinese/English), with a manual selector.
- **IP 地区初始定位**: GeoJS best-effort coarse location, manual Chinese city fallback; no precise GPS permission or raw IP stored.
- **中国友好体验**: Chinese radio catalog first, local sunrise, sunset and moon phases computed without paid API keys, with visual Moon phases and a Sun–Earth–Moon teaching diagram; bundled offline coastline map.
- **Local Bridge included**: the desktop install carries the open-source eaopen/local-bridge runtime as a bundled sidecar. The app reads the actual bundled binary version, with an opt-in self-test. No separate installation, background service, model account or third-party communications permission is required.
- **Built-in astronomy and world observations**: internal sky calculations and world-event map; no dependency on CoBeing or God’s Eye View UI. CoBeing remains optional behind the scenes and is not connected in this Preview.

## Cultural calendar · Luo integration

World Cinema and World Pulse now include a compact, expandable **岁时 / Seasonal calendar** card: Chinese lunar dates, solar-term countdowns, traditional phenology, Chinese festival names (not official holiday/workday schedules), sourced astronomical notes and Markdown export to your journal. It follows the app language; Chinese phenology names remain explicitly labelled as Chinese.

Calculations run locally using pinned `lunar-typescript` (MIT), for civil dates 1900–2100. The calendar uses **Beijing time UTC+8**, independently of the selected observation city; phenology is cultural tradition, not local weather. No Luo API, Java runtime, annual data pack, account or new background service is needed. The former standalone Luo project is paused; this capability is maintained here. See [scope and provenance](docs/SEASONAL_CALENDAR.md).

## Download

**[Get WorldDesk Preview on GitHub Releases](https://github.com/CoBeing/worlddesk/releases)**

Unsigned and unnotarized packages are for testing. Read [install and safety notes](docs/PREVIEW_INSTALL.md) and verify the SHA-256 checksum for the exact downloaded file. Packages have no OS signing certificate or login service. Preview.7 adds signed in-app updates for macOS Apple Silicon and Windows x64.

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

Source observations can be delayed and must not be used for emergency, aviation or route planning. Open ADS-B has patchy coverage (especially in China), is not a substitute for FR24 or ATC information, and never supplies invented route endpoints. The personal-use FR24 web-feed adapter runs on the client; no paid 3D imagery is distributed.

## Open-source and data attribution

- App: Apache-2.0 (this project).
- Local Bridge: Apache-2.0 (https://github.com/eaopen/local-bridge).
- Leaflet: BSD-2-Clause. MapLibre GL JS: BSD-3-Clause; @maplibre/maplibre-gl-leaflet: ISC. Detailed styles/tiles are served by OpenFreeMap (https://openfreemap.org/), © OpenMapTiles / © OpenStreetMap contributors, with attribution shown. Natural Earth public-domain land outlines are bundled for offline fallback; the online tile host requires network access.
- Event data: USGS Earthquake Feeds and NASA EONET APIs.
- Radio Browser is a station directory, not a WorldDesk rebroadcast server. Stations own their streams and licensing.
- God’s Eye View is a separate upstream project; its source or licensed data are not copied into WorldDesk.


## Flight data, media and content credits

- Flight data and licensing: see docs/FLIGHT_DATA.md. The open API (ODbL 1.0) is from adsb.lol. This public preview is exploratory; contact the source maintainer before broad production rollout. FR24's consumer website prohibits automated data collection; its official API is separately licensed.
- Imagery and credits: see docs/MEDIA_CREDITS.md. Archive photos and satellite observations retain their own licenses and attribution requirements. They are not part of the WorldDesk Apache-2.0 grant.
- Experience roadmap: docs/CAPABILITY_ROADMAP.md. Candidate next features include ISS passes, sunlit Earth, properly licensed public cameras and stories.

## Product experience review

See [功能清单、体验改进与持续兴趣评估](docs/PRODUCT_EXPERIENCE.md) for implementation boundaries, priorities and user-validation plans.
