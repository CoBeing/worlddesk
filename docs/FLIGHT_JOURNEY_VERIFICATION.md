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
