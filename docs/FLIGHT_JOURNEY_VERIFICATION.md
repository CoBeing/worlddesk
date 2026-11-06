# Flight journey visual verification — Preview.9

Validated the rendered browser UI using deterministic flight fixtures and the real Leaflet renderer, not just helper output. Test-only source instrumentation exposes the map; none is included in the application build.

Scenarios: Shanghai–New York, Shanghai–Beijing, Narita–San Francisco; each at 1410×880 and the minimum supported 960×650 window. A fixture includes 40 other aircraft to expose traffic clutter.

Checks passed:
- Map marker selection retains the current zoom and center.
- Whole-journey overview shows exactly one aircraft and two readable airport labels, with no horizontal overflow or labels hidden behind the heading.
- Returning restores zoom level 7, the prior center within map pixel rounding, and all 41 aircraft.
- Inspected screenshots for long, short and dateline routes; fixed dateline land bands, heading overlap, narrow tooltip wrapping, and zoom-control overlap discovered during the review.
- 45 unit tests and the frontend production build pass, including dateline geometry and polar-ring preservation.

The overview uses the bundled coastline for immediate, consistent rendering. The chosen detailed/night map returns when leaving the overview. Dashed airport connections remain illustrative and are not presented as a measured flight path.

Native Mac acceptance also passed on the Preview.9 bundle: selected live CQH8908 (MIG–NGB), opened the single-flight overview, inspected its rendered labels/route/aircraft, and returned to the detailed map with traffic and following state restored. The signed local updater archive passed signature verification and tamper rejection.

Release: https://github.com/CoBeing/worlddesk/releases/tag/v0.1.0-preview.9 . Windows build/test/package job in run 42235812350 passed. Because the Mac runner remained queued, the release uses the locally built, natively tested Mac ARM64 bundle from the same application commit (`1a0f83c`); the remaining CI run was cancelled after Windows upload. Downloaded release files passed SHA-256 and updater signature/tamper checks for both platforms. Published updater manifest reports Preview.9 with both platform URLs.
