# WorldDesk — China-first discovery roadmap

## Product

WorldDesk is a standalone application for curious world explorers, not a link hub for CoBeing or God's Eye View. CoBeing may provide backend memories and relationships in the future. Local Bridge is a bundled local component, not a separate user-facing onboarding requirement.

## Included in Preview 0.1.0-preview.3

| Feature | Implementation | Fallback |
|---|---|---|
| Chinese and English | Operating system language or manual override, saved locally | English when OS language is not Chinese |
| Starting location | Direct client-to-GeoJS coarse IP lookup, fallback to ipwho.is | Obvious Beijing example and manually selected cities, never claim precise GPS |
| World Cinema | Bundled licensed photos of China + NASA EPIC (multiple captured frames) + JMA infrared Himawari observations | Dated archive fallback, not live webcams |\n| Aircraft viewing | Bounded native ADSB.lol ODbL snapshot around chosen airspace, refresh only while viewing | Explicit empty/unavailable; no unofficial FR24 data or inferred routes |\n| China-first audio | Radio Browser CN first + worldwide catalog | Explicit partial-data message; streams may fail |
| Sky now | Offline SunCalc sunrise/sunset/moon for chosen city | Calculations still available without feeds |
| Nearby & world observations | USGS global earthquake reports, NASA EONET | No fabricated local China events |
| Detailed + offline map | OpenFreeMap keyless vector tiles via MapLibre and Leaflet + bundled Natural Earth outline with city labels | Can switch light/dark/offline; offline fallback when map provider unavailable |
| Favorites/sharing | On-device browser storage + original source links | No login required |
| Local capability | eaopen/local-bridge pinned source built as Tauri sidecar | Version and explicit diagnostics only |

## Next useful integrations (in value order)

1. **Sunlit Earth** — locally calculate the day/night terminator and let users follow sunrise from China across the world, with city clocks and a cinematic but data-honest view.
2. **ISS and satellite passes** — CelesTrak public GP/OMM JSON data with an open orbital propagation library. Show source freshness and distinguish orbital estimates from real tracking.
3. **China weather for astronomy** — a supported, properly licensed Chinese meteorological API, with secure key handling and quota control. Avoid inventing conditions or embedding confidential keys in an open desktop binary.
4. **China seismic sources** — USGS shows only the China-region events in its global feed, not a complete China Earthquake Networks record. Integrate a permitted stable CENC service if one can be verified; do not scrape changing pages.
5. **Public world audio and authorized visual media** — extend the six included real cinema scenes with licensed public cameras and local sounds; distinguish delayed imagery from live feeds.
6. **Optional local receivers** — only after the above has value, use user-authorized Local Bridge SDR/MCP and public-domain satellite/aviation data with actual domestic coverage. Do not scrape unofficial FR24 endpoints or assume private signals are free to intercept.

## Multiple OSes, macOS first

The project uses a single Vanilla JS + Vite + Tauri 2 codebase. The default Mac flight map can switch between detailed/low-light vector tiles and the bundled coastline sketch. Vector renderer is lazily loaded. The Bridge sidecar build script selects a Rust target triple, allowing future Windows and Linux packaging. This new preview tag publishes macOS Apple Silicon only; Windows/Linux CI release jobs are intentionally inactive until Mac user experience and platform-specific installation are accepted. Preserve cross-platform compatibility in code; avoid duplicating the application for each OS.

Language and geographic observation context are separate. A Chinese-language user can explore Singapore and an English-language user can explore Shanghai.

## IP privacy

Public-IP geolocation is requested by the client directly from GeoJS, then ipwho.is if necessary. They receive the user's public IP; WorldDesk never persists the raw IP. The manual city override is stored on device. No OS precise location permission is requested. Mobile networks, VPNs and carrier gateways can produce incorrect IP cities.

## Data and map licensing

Mainland mapping APIs often require issued keys and special business terms. OpenFreeMap allows free commercial use with attribution and no key, but actual connectivity from mainland China is not guaranteed; the preview falls back to bundled Natural Earth and manually curated city labels. Neither visual map is a navigational or emergency tool. All feeds display source and freshness labels as appropriate; real, delayed, predicted and simulated observations must remain distinct.
