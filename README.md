# Auki (working name)

A web app that finds the nearest open pharmacy. A job application project by Janne Lappi. Not affiliated with Treat Health.

The spec is `PLAN.md`, the working rules are in `CLAUDE.md`, and design decisions made during the build are in `DESIGN-LOG.md`. The pharmacy field findings behind the plan are in `docs/research/`. This file becomes the full README (decisions, trade-offs, known limitations, sources) in milestone M7.

## Status

M5: walking times. After the position is found the app shows real pharmacies on a real map (MapLibre on OpenFreeMap's tiles, in our own style) and in a list, nearest first on foot, each with a status worked out on the device from the hours in the tile, renewed every minute. When the nearest open pharmacy closes within the hour the card shows ehditkö: when you would be there, when it closes, and the minutes to spare; when you would not make it, it says so and puts forward the next open one. The walking route to the selected pharmacy is drawn on the map, and the pharmacy sheet lists the week's opening hours, hands the route off to Google Maps or Apple Maps and links to the pharmacy's website, its email and OpenStreetMap's note form. The dot follows the device while the page is visible, and after 300 m the list is ranked again from the tiles already on the device. The markers are our own buttons over the map, placed the same way with or without it, so the list and the markers go on working if the map can't be drawn. When nothing nearby is open it looks up to 30 km for one that is. Data older than seven days is never shown as open; outside the 21 covered countries the app says so and hands off to a map app. The data page (`/fi/data`) shows the pipeline's numbers per country.

Finding pharmacies sends no position: the requests name squares of 20 to 30 km. The position leaves the device in one request, `POST /api/walking`, to our own server, which asks openrouteservice for walking times and routes; openrouteservice sees our server, not the user, and nothing is logged. A browser test records every request of the whole flow and fails if any other request carries the position, or if one goes to a host other than ours and the map tile host; the Content-Security-Policy is built from the same list (`lib/requests.ts`).

Walking times come from openrouteservice's free plan: 500 Matrix and 2,000 Directions requests a day, 40 a minute each. The server keeps its own count under those and stops asking for a while when the service says no or keeps failing. The list waits a second and a half for walking times and no longer: without them it is by straight line and says so, and it is never reordered afterwards.

Still to come: the prescription banner and counter card abroad, and offline use (M6).

The map is by far the heaviest thing in the app: 439 KB of JavaScript as it travels (`maplibre-gl` 6.19 and its worker), against 169 KB for the first window. It is fetched only once the results are on screen, and it has a budget of its own in CI (`tests/e2e/perf.spec.ts`). The map tile host is OpenFreeMap; `NEXT_PUBLIC_MAP_TILES_URL` points the same style at another host with the OpenMapTiles schema, and the Content-Security-Policy follows that one value.

### The data, measured

From the pipeline's run of 23 November 2026 on OpenStreetMap's data of that afternoon (`npm run data`):

| | |
|---|---|
| Pharmacies | 89,987 in 21 countries |
| With opening hours in OpenStreetMap | 42.3 % |
| Of those, read into intervals | 99.9 % |
| Tile files | 5,012 (4,381 squares with pharmacies, 631 at the edge of the coverage) |
| A tile, gzipped | median 0.6 KB, largest 54 KB (central Barcelona, 1,272 pharmacies) |
| All tiles together, gzipped | 5.0 MB |
| `index.json`, gzipped | 3.9 KB |
| Time to first result, throttled phone (slow 4G, 4× slower CPU), heaviest tile | 2.3 s on this Mac, median of five (`tests/e2e/perf.spec.ts`) |

The share with opening hours is the number to watch, and it differs a great deal by country: 95 % in Norway, 82 % in Germany, 79 % in Finland, but 23 % in Italy, 18 % in Spain and 7 % in Greece. Where the hours are missing the app says "hours not listed" and never guesses. The numbers per country are in `data/corpus/expected.json`, and from M3 on the data page.

No square is split into smaller ones: the heaviest tile is 54 KB on the wire, a quarter of a second on a slow phone connection.

## Run it

```
npm install
npm run dev
```

Then open `/fi` or `/en`, and `/dev/states` for every view and state in light and dark, phone and desktop. Other commands are listed in `CLAUDE.md`.

The data pipeline: `npm run data` (it needs `CONTACT_EMAIL` in `.env.local` and Node 22.18 or later), then `npm run data:serve` to give the tiles to the dev server.

Place search calls Nominatim through the server and needs a contact address to identify itself: copy `.env.example` to `.env.local` and set `CONTACT_EMAIL`. Walking times need `ORS_API_KEY` there, a free key from openrouteservice; without it the app works by straight line. `npm run walking:check` tells whether the key works.

## Known limitations so far

- Opening hours are only as good as OpenStreetMap's. In Southern Europe most pharmacies have none there yet (see the numbers above). Where most of the nearest ones have none, the card leads with the nearest pharmacy, says what isn't known and puts the call first, instead of sending people to a far one whose hours happen to be listed (provisional, `DESIGN-LOG.md`).
- The public Overpass servers are shared and sometimes busy. The pipeline asks once per country, waits and retries once, tries one other server, and otherwise keeps the country's data of the night before. A second attempt two and a half hours later asks again for the countries that failed, and only for those. When three countries in a row get no answer the run stops asking and leaves the rest to that second attempt. The data page shows when each country was last fetched. A commercial service should build from a planet extract or its own Overpass instance: the main public instance says of itself that it is meant for browser-based and human-operated tools.
- Public holidays are known per country, and per state or canton in Germany, Spain and Switzerland. A town's own holidays (common in Spain and Italy) are not.
- Hours written as sunrise or sunset are shown as uncertain.
- In a public repository GitHub switches scheduled workflows off after 60 days without a commit. The data would then age, and after seven days the app shows no pharmacy as open. "Enable workflow" on the Data workflow's page switches it back on.

- Walking times depend on a free plan of 500 searches a day: beyond that, and whenever the service is slow, distances are straight lines, labelled as such. The budget is counted in the server's memory, per instance, so openrouteservice's own limit is the one that finally holds.
- The first-visit sky takes its position from the device time zone (a table of European zones, Helsinki as fallback), so it is approximate by design: no location is asked for it.
- Landscape phones get the phone layout and are cramped.
- With the sheet open on a phone, it closes from its handle: pulling the list itself down scrolls the list.
- The map needs WebGL. Without it, or when the map tiles don't arrive, the markers stand on a plain ground and the app says so.
- The Latvian counter-card text has not had a native check and is marked as an unreviewed translation.
