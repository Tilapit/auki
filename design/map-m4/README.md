# The map as built (M4)

Screenshots from `/dev/map`: the real results view with MapLibre under it, on OpenFreeMap's tiles in our own style (`lib/map/style.ts`). Fixture pharmacies, fixed moments on 19 Nov 2026. The decisions are in `DESIGN-LOG.md` (23 Nov, the entries marked M4).

- `sun-and-theme.desktop.jpg`: Helsinki at noon, at dusk (16.10) and at night (20.41), top to bottom; the light theme on the left, the dark theme on the right. The theme picks light or dark; in the dark theme the sun picks dusk or night. Provisional.
- `phone.jpg`: Helsinki and Riga at noon (light), Helsinki at dusk and Riga at night (dark).
- `buildings-rise.jpg`: zoom 13.5, 15.3 and 16.5, at noon in the light theme and at dusk in the dark one. Flat from afar; the buildings rise from zoom 15.
- `no-map.jpg`: a browser without WebGL. The markers and the list work, and one line says the map didn't load.

To look at them live: `npm run dev`, then `/dev/map`.

Map data © OpenStreetMap contributors, tiles by OpenFreeMap (OpenMapTiles schema).
