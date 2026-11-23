# Auki (working name)

A web app that finds the nearest open pharmacy. A job application project by Janne Lappi. Not affiliated with Treat Health.

The spec is `PLAN.md`, the working rules are in `CLAUDE.md`, and design decisions made during the build are in `DESIGN-LOG.md`. The pharmacy field findings behind the plan are in `docs/research/`. This file becomes the full README (decisions, trade-offs, known limitations, sources) in milestone M7.

## Status

M3: the app reads the tiles. After the position is found it shows real pharmacies, nearest first by straight line, each with a status worked out on the device from the hours in the tile, renewed every minute. When nothing nearby is open it looks up to 30 km for one that is. Data older than seven days is never shown as open; outside the 21 covered countries the app says so and hands off to a map app. The data page (`/fi/data`) shows the pipeline's numbers per country.

Finding pharmacies sends no position: the requests name squares of 20 to 30 km. A browser test records every request of the whole flow and fails if one carries the position or goes to a host other than ours and the map tile host; the Content-Security-Policy is built from the same list (`lib/requests.ts`).

Still to come: the real map (M4), walking times and ehditkö (M5), the prescription banner and counter card abroad, and offline use (M6).

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

Place search calls Nominatim through the server and needs a contact address to identify itself: copy `.env.example` to `.env.local` and set `CONTACT_EMAIL`.

## Known limitations so far

- Opening hours are only as good as OpenStreetMap's. In Southern Europe most pharmacies have none there yet (see the numbers above).
- The public Overpass servers are shared and sometimes busy. The pipeline asks once per country, waits and retries once, tries one other server, and otherwise keeps the country's data of the night before. A commercial service should build from a planet extract or its own Overpass instance.
- Public holidays are known per country, and per state or canton in Germany, Spain and Switzerland. A town's own holidays (common in Spain and Italy) are not.
- Hours written as sunrise or sunset are shown as uncertain.
- In a public repository GitHub switches scheduled workflows off after 60 days without a commit. The data would then age, and after seven days the app shows no pharmacy as open. "Enable workflow" on the Data workflow's page switches it back on.

- The first-visit sky takes its position from the device time zone (a table of European zones, Helsinki as fallback), so it is approximate by design: no location is asked for it.
- Landscape phones get the phone layout and are cramped.
- The bottom sheet opens and closes by tap; dragging it arrives with the real map in M4.
- The Latvian counter-card text has not had a native check and is marked as an unreviewed translation.
