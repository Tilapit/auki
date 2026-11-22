# Map spike (S1)

Screenshots from `/dev/map`: MapLibre on real OpenFreeMap tiles with our own style (`lib/map/style.ts`). Fixture pharmacies, fixed moments on 19 Nov 2026. Not wired into the app. The recommendation and the numbers are in `DESIGN-LOG.md`.

- `sheet-helsinki-desktop.jpg`, `sheet-helsinki-phone.jpg`, `sheet-riga-desktop.jpg`: the three variants (columns) at day, dusk and night (rows).
- `{city}-{variant}-{phase}.{size}.jpg`: each view on its own. `phone` is 390×844 at 2×, `desktop` is 1440×900.

Variants: `a` flat and calm; `b` buildings in 3D, lit from the sun's side; `c` pitched camera with a sky.

To look at them live: `npm run dev`, then `/dev/map`. Add `?font=noto` to a map to see OpenFreeMap's typeface instead of ours.

Map data © OpenStreetMap contributors, tiles by OpenFreeMap (OpenMapTiles schema).
