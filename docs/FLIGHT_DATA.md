# WorldDesk Flight Watch — data and operating boundary

Flight Watch is a click-to-view experiment using the public ADS-B.lol aircraft snapshot API.

- Open data source: https://www.adsb.lol/docs/open-data/api
- API request shape: https://api.adsb.lol/v2/lat/{lat}/lon/{lon}/dist/{radius}
- Data license: Open Data Commons Open Database License 1.0 (ODbL).
- Attribution displayed in WorldDesk: © adsb.lol contributors · ODbL 1.0.
- API documentation states the API is free today, but production users should contact its maintainer. Obtain explicit consent before a broad consumer/paid rollout and avoid depending on unspecified uptime.

The macOS native app sends a fixed HTTPS request to exactly api.adsb.lol. The request validates latitude, longitude and radius (at most 250 nautical miles), uses a 10-second timeout, caps response size at 2 MB, and extracts only required aircraft fields. No arbitrary URL requests or persistent flight history. Fetch when the user opens Flight Watch, changes region, refreshes or after about 60 seconds while the view remains visible. The source receives the selected geographic center and caller IP; WorldDesk does not upload favorites or personal files.

Positions are near-real-time ADS-B/MLAT receptions aggregated by volunteer stations. Coverage is incomplete, especially near regions with fewer receivers. Aircraft metadata can be absent, stale or inaccurate. The app displays position age and hides items over 180 seconds old. NOT for aviation safety, navigation, dispatch or emergency purposes.

Callsign or flight number does not imply verified departure or destination. The app does NOT invent flight origin, destination, routes, passenger status, crew identity or aircraft landing predictions.

## FR24 boundary

Flightradar24's Terms of Service (updated June 23, 2026) prohibit automated retrieval from the ordinary consumer website, including unofficial feed.js. Its official API requires a separate subscription and credits, restricts caching and redistribution, and includes competitive-use restrictions. The earlier local FlightDeck proof of concept is NOT used in public WorldDesk. Any future authorized commercial integration requires explicit licensing and an isolated provider; do not mix FR24 records with fallback open ADS-B data without permission.

- https://www.flightradar24.com/terms-of-service
- https://fr24api.flightradar24.com/docs/faq

## Local receiver in the future

WorldDesk may later connect an explicitly enabled readsb / dump1090 / SDR receiver via Local Bridge, using a labeled local data source. Opening Flight Watch never automatically turns on a microphone, radio, serial port or messaging Provider.

## WorldDesk map-first experience (Preview 0.1.0-preview.4)

Flight Live uses an enlarged airspace map with an optional aircraft list and a closable detail drawer. Selecting an aircraft shows only sourced attributes and can follow its current reports. The four context cards (reported count / fastest / highest / nearest) are derived from **the current snapshot**. A small sample count is taken once per 30+ seconds in the current app session; it is not a pre-existing 24-hour timeline and is never presented as such. Closing WorldDesk ends the sample history.

The detailed map uses [OpenFreeMap](https://openfreemap.org/) (light and dark styles via MapLibre GL/Leaflet); attribution is shown at all times. Its connectivity in mainland China needs user verification. The built-in Natural Earth outline and curated city names are the explicit fallback; there is no dependence on unauthorized Gaode/Tianditu keys or generic OSMF production raster servers. Coordinates are displayed in WGS84, with no GCJ-02 overlay mismatch.

Flight and map observations do not imply origin/destination, actual routes or 24-hour history. For broader commercial distribution, discuss ADSB.lol key/licensing and availability with the source maintainers.
