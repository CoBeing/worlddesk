# WorldDesk Flight Watch — data and operating boundary

Flight Watch is a personal-use, click-to-view experiment aggregating FR24 public web-feed snapshots, adsb.lol and adsb.fi directly on the desktop.

- Open data source: https://www.adsb.lol/docs/open-data/api
- API request shape: https://api.adsb.lol/v2/lat/{lat}/lon/{lon}/dist/{radius}
- Data license: Open Data Commons Open Database License 1.0 (ODbL).
- Attribution displayed in WorldDesk: © adsb.lol contributors · ODbL 1.0.
- API documentation states the API is free today, but production users should contact its maintainer. Obtain explicit consent before a broad consumer/paid rollout and avoid depending on unspecified uptime.

The macOS native app sends fixed HTTPS requests to data-cloud.flightradar24.com, api.adsb.lol and opendata.adsb.fi. No application server or third-party proxy participates. The request validates latitude, longitude and radius (at most 250 nautical miles), uses a 10-second timeout, caps response size at 2 MB, and extracts only required aircraft fields. No arbitrary URL requests or persistent flight history. Fetch when the user opens Flight Watch, changes region, refreshes or after about 60 seconds while the view remains visible. The source receives the selected geographic center and caller IP; WorldDesk does not upload favorites or personal files.

Positions are near-real-time ADS-B/MLAT receptions aggregated by volunteer stations. Coverage is incomplete, especially near regions with fewer receivers. Aircraft metadata can be absent, stale or inaccurate. The app displays position age and hides items over 180 seconds old. NOT for aviation safety, navigation, dispatch or emergency purposes.

Callsign or flight number does not imply verified departure or destination. The app does NOT invent flight origin, destination, routes, passenger status, crew identity or aircraft landing predictions.

## FR24 desktop-direct adapter

As requested for personal use, the current local implementation calls the public `data-cloud.flightradar24.com/zones/fcgi/feed.js` version-4 feed directly from the Tauri process. It is not the official paid FR24 API and does not claim official authorization or availability guarantees. No login cookies, API keys, remote proxy, challenge bypass or credential collection is used. An HTTP error or schema change marks this source unavailable while other feeds continue.

The selected center/radius is converted into a bounded rectangular viewport (clipped at the poles/date line). Estimated positions are disabled. Aircraft without a valid ICAO hex or recent timestamp are excluded. Provider airport codes stay attached to matching callsigns only, even when another source has a newer position. These are provider route metadata, not proof of actual takeoff or landing. Tracking remains session-only; no historical FR24 track endpoint is used.

The browser-only development preview uses a local Vite forwarding rule; the installed desktop never depends on that development server. FR24 data retains its source attribution and is not covered by the app's Apache license or adsb.lol's ODbL license. Source terms: https://www.flightradar24.com/terms-of-service ; official API: https://fr24api.flightradar24.com/docs/faq .

## Local receiver in the future

WorldDesk may later connect an explicitly enabled readsb / dump1090 / SDR receiver via Local Bridge, using a labeled local data source. Opening Flight Watch never automatically turns on a microphone, radio, serial port or messaging Provider.

## WorldDesk map-first experience (Preview 0.1.0-preview.4)

Flight Live uses an enlarged airspace map with an optional aircraft list and a closable detail drawer. Selecting an aircraft shows only sourced attributes and can follow its current reports. The four context cards (reported count / fastest / highest / nearest) are derived from **the current snapshot**. A small sample count is taken once per 30+ seconds in the current app session; it is not a pre-existing 24-hour timeline and is never presented as such. Closing WorldDesk ends the sample history.

The detailed map uses [OpenFreeMap](https://openfreemap.org/) (light and dark styles via MapLibre GL/Leaflet); attribution is shown at all times. Its connectivity in mainland China needs user verification. The built-in Natural Earth outline and curated city names are the explicit fallback; there is no dependence on unauthorized Gaode/Tianditu keys or generic OSMF production raster servers. Coordinates are displayed in WGS84, with no GCJ-02 overlay mismatch.

Flight and map observations do not imply origin/destination, actual routes or 24-hour history. For broader commercial distribution, discuss ADSB.lol key/licensing and availability with the source maintainers.

## 2026-11-06: Multiple sources, airport metadata and session tracks

- Position feeds **FR24 web feed**, **adsb.lol** (ODbL 1.0) and **adsb.fi** are queried automatically and merged by aircraft ICAO hex, keeping the newest observation and its provenance. This is a non-commercial application; adsb.fi’s [public API terms](https://github.com/adsbfi/opendata/blob/main/README.md) permit personal non-commercial use only. Commercial deployment needs provider authorization. There is no source picker. One failing feed does not discard another successful feed; status shows partial availability. Individual observations retain their source; aggregation does not relicense provider data. The v3 radius endpoint is used; requests are spaced at least 1.1 seconds per provider in the UI, with normal polling once a minute while visible.
- **adsbdb** supplies callsign-associated origin/destination (and optional midpoint) via its [public API](https://github.com/mrjackwills/adsbdb). Only a selected aircraft triggers lookup; results including unavailable responses are held in memory for ten minutes, capped at 100 entries. This is reference route metadata, not verified departure/arrival events for the observed flight. Unknown callsigns remain unknown. Attribution appears in the aircraft detail.
- Both desktop commands accept only fixed providers/validated inputs. No user-supplied URL or credentials. FR24 uses the public web-feed adapter described earlier. Vite proxies provide the same paths during development; the static web build does not claim native flight access.
- Selecting/following an aircraft displays a solid observed track, automatically extended on successful snapshots. At least two observations are required. It does not draw inferred lines between airports, reconstruct history before launch, or bridge gaps over three minutes, implausible jumps over 1600 km/h or the date line. Each aircraft retains at most 180 points / one hour, with at most 500 aircraft in memory. A plausible source handoff continues the track; changing airspace clears session tracks.
- Source `now` timestamps are normalized from milliseconds (live v2/v3 responses) or seconds (compatible responses). Old requests cannot overwrite a newer source/airspace after errors.

The source API smoke checks prove connectivity in the tested environment, not China-wide reception, uptime or data correctness. Route metadata may be absent or outdated.

## Exploration experience

Position sources publish incrementally as each request resolves. Airport connections use an offline, lazy-loaded OurAirports public-domain IATA catalog (`src/airports.json`), with great-circle dashed lines separate from solid observed tracks. The journey card places endpoints before technical details. Nearby, surprise aircraft and airport hopping provide one-click exploration. Map framing stays stable when slower sources arrive.
