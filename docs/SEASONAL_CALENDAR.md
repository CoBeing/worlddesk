# Seasonal calendar: Luo integrated into WorldDesk

Decision: 2026-11-06. Preserve the useful cultural calendar inside WorldDesk; pause the independently maintained Luo application.

## Keep

- A compact card in World Cinema and World Pulse (All / Nearby / Sky), not a sixth primary navigation entry.
- Date navigation, Chinese lunar date, actual solar-term day or next-term countdown, traditional phenology, source attribution, Markdown export and manual clipboard fallback.
- Chinese/English interface, with Chinese phenology labels retained as source terminology. Beijing civil time (UTC+8) is explicit and independent of the observation city's timezone.

## Remove from the runtime architecture

- No dependency on `api-luo.openea.site`, standalone Cloudflare Workers/KV/R2, Java generator or annual JSON snapshots.
- No AI-generated daily text, auspicious/inauspicious advice, fixed daily colors, extra accounts or telemetry.
- No separate Luo release pipeline. Existing Luo repositories and deployments are historical artifacts; this integration does not shut down or delete them.

## Engine and maintenance

`lunar-typescript` 1.8.7 (6tail, MIT) is pinned and bundled in a separately loaded local module. It calculates 1900–2100 dates without annual updates or network requests. Source code: https://github.com/6tail/lunar-typescript . The package license is included in `public/licenses/lunar-typescript.txt` and therefore in desktop/web distributions.

This is a calendar-day cultural feature, not the old Time4J precise-instant API or a historical calendar research claim. Term-day comparisons use the library's whole-day mode; leap lunar months retain their identity. Definitions of solar terms are paraphrased from the Hong Kong Observatory: https://www.hko.gov.hk/sc/gts/time/24solarterms.htm . Source pages open only on user action through the existing HTTPS opener; only the HKO host was added to its allowlist.

The adapter and presentation consolidate user-owned Luo work. No private factory source tree is copied into this public repository. Original engine dependencies remain under their own licenses.

## Verification

- One-off comparison against the 730 original Luo dates from 2026–2027: matching solar-term days, non-term countdowns and phenology (after distinguishing descriptive “eve of term” strings from actual term days).
- Automated tests cover Gregorian validation, Beijing midnight, Spring Festival, leap lunar month, winter/year boundaries, term days and source-bearing Markdown in both languages.
- Browser acceptance covers expansion, language switching, copy fallback, date validation, view visibility and operation with external network requests blocked.

No claim of astronomical second-level equivalence is made. Upgrade the pinned dependency only when needed, rerun regression checks, and retain source/phenology boundaries.
