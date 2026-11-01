# WorldDesk v0.1.0-preview.4 — Map first, real-time discovery

**macOS Apple Silicon · unsigned preview · no account required.**

### Better to look at

- **Flight Live full-canvas experience**. The aircraft map expands across the whole app content, and the usual three-column squeeze is gone. Collapse the aircraft list to explore; a separate details drawer only appears when you select an aircraft.
- **Useful detailed map**. OpenFreeMap vector roads and city names, with Detailed / Night / bundled Offline outline modes. Offline includes small curated city labels. The app falls back if the external tile host fails (regional access varies).
- **Current aircraft facts**. Reported aircraft now, fastest aircraft, highest flight and nearest to observation center, all derived from the ADSB.lol snapshot, with a current-session sampling count instead of a fake 24h chart.
- **Less navigation, more content**. Five primary entries: immersive real-world scenes, Flight Live, World Pulse, World Radio and Favorites. Nearby, Sky, Nature Events and Earthquakes become filters inside World Pulse.
- **Dynamic content picks**. Current sunset prediction, aircraft discovery, JMA East Asia satellite observations and licensed Chinese-language radio become directly clickable cards; fewer empty screens.
- Faster World Cinema startup: MapLibre vector renderer only loads when Flight Live is actually opened.

### Data and product boundaries

- The aircraft source is **ADSB.lol ODbL 1.0**, not FR24. China coverage is incomplete, and flight origins/destinations are not claimed.
- Counts and extreme-value cards are **current position reports**, not rolling 24h totals.
- Live public data, radio and online maps depend on external provider connectivity; the Chinese network and access policies may vary. Offline coastline remains available.
- No CoBeing login, chat provider, SDR activation or background Local Bridge service.
- Mac Apple Silicon **unsigned/unnotarized** package only; use the GitHub Release checksum. Windows/Linux remain postponed.
