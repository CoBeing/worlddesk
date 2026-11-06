# WorldDesk v0.1.0-preview.8 — Quiet radio checks, effortless listening

**macOS Apple Silicon + Windows x64 · preview · no account required.**

## Desktop downloads and updates

- macOS ZIP and Windows installer are provided together.
- Checks for updates quietly at startup and every six hours. A small button offers installation; downloaded updates are verified with a dedicated signing key.
- Install this version manually once to enable future in-app updates.

## Radio that gets out of your way

- Quietly checks one station at a time, at most once every 30 seconds while World Radio is visible and playback is paused. No audible autoplay or check button.
- Temporarily hides streams that report network/decoder errors; successful checks are cached for six hours, failed checks for thirty minutes. Expired entries recover automatically; timeouts are retried later without hiding the station.
- Background checks stop when listening starts, the view changes or the window is hidden. Favorites are retained; hidden stations are not deleted.

## Also included: explore in one click

- **Pick a plane and see its journey.** Departure/destination airports and cities lead the detail card. Dashed great-circle airport connections and solid observed tracks appear on the map; technical details stay folded away.
- **Near me, follow a surprise, airport hopping.** Three quick actions take you straight into exploration. Selecting a plane clears space for its map and route.
- **Faster first picture.** Flight sources publish as soon as they respond, with slower sources filling in afterward. Positions merge automatically from the desktop-direct FR24 public web feed, adsb.lol and adsb.fi. No source selector or WorldDesk server is needed.
- **Slide through the sky.** Explore from 14 days ago to 30 days ahead: sunrise/sunset illustrations, eight Moon phases, a Sun–Earth–Moon diagram and linked calendar dates. Return to today in one click.
- **Calendar and festivals.** Local Chinese lunar dates, solar terms, traditional phenology and festival names, with Markdown export. Festival names are separate from official days-off/workday schedules.
- Clearer empty-state actions and radio error feedback; local diagnostics are folded away.

## Notes

- Airport connections illustrate a journey, not an actual flown route. Observed tracks begin with this app session. Airport coordinates/names use the bundled OurAirports public-domain IATA catalog.
- FR24 integration uses its public web feed, not its official paid API. Availability and formats can change; other sources remain available when one fails. Provider terms and attribution remain applicable; adsb.fi is personal/non-commercial.
- Moon and Sun images are calculated teaching illustrations, not photographs or weather forecasts. Calendar dates use Beijing time; observation times use the selected city's timezone.
- Packages do not have Apple notarization or Windows Authenticode certificates; the OS may show a security prompt. Updater signatures verify update authenticity separately. SHA-256 files are included. Linux packages are not included.
