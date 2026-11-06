# Aircraft heading verification — Preview.10

The previous marker rotated a font-dependent airplane character as if its nose pointed north. Replaced it with a fixed SVG whose nose starts at (12, 2), centered at (12, 12); compass track rotates clockwise from north. Unknown track renders a neutral dot.

Validation:
- All 47 unit tests pass, including FR24, adsb.lol and adsb.fi track normalization through the renderer, cardinal directions, 359°, wrapped angles and missing values.
- Browser rendering used the actual production icon module and stylesheet. SVG screen-coordinate nose vectors were north (0, -9), east (9, 0), south (0, 9), west (-9, 0). The rendered screenshot was visually inspected.
- Native Mac Preview.10: live CCA4536 reported track 252°; its selected marker pointed west-southwest, matching the numeric detail.
- Local Mac production build and updater signature/tamper verification passed.

This fixes the displayed direction; it does not infer heading from the airport connection or alter provider observations.

Published release: https://github.com/CoBeing/worlddesk/releases/tag/v0.1.0-preview.10 . Windows build/test/package job in run 42239495929 passed. Mac uses the locally built and natively verified ARM64 bundle from the same application commit (`f4137c8`); the remaining cloud Mac build was cancelled after Windows completed. Downloaded artifacts on both platforms passed SHA-256 and updater signature verification, including rejection of one-byte modifications. The public updater manifest reports Preview.10 for both platforms.
