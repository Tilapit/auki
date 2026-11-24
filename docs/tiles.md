# Pharmacy tiles, version 1

The format of the static files the nightly pipeline publishes and the apps read. The web app
reads them with `lib/tiles.ts`; the iOS app implements the same reading in Swift and checks
itself against `tests/vectors/`. This document and those vectors are the contract. A change
that an existing reader could not survive gets a new version in the path.

- All files are JSON, UTF-8, served with gzip or Brotli by the CDN.
- Instants are **epoch seconds** (UTC). Durations inside a tile are **minutes**.
- The data is OpenStreetMap's, under the ODbL. `index.json` carries the attribution.

## Addresses

| File | Path |
|---|---|
| Index | `/tiles/v1/index.json` |
| Tile | `/tiles/v1/10/{x}/{y}.json` |
| Country file | `/tiles/v1/countries/{CC}.json` (for the pipeline, see the end) |

`x` and `y` are the standard web-map tile numbers at zoom 10, the numbering every slippy map
uses. For a latitude φ and longitude λ in degrees, with n = 2¹⁰ = 1024:

```
x = floor((λ + 180) / 360 · n)
y = floor((1 − ln(tan φ + 1 / cos φ) / π) / 2 · n)        (φ in radians inside tan and cos)
```

A square is about 20 km across in southern Finland, 30 km in Spain and 13 km at the North Cape.

A request for a tile names a square, never a position. That is the privacy property the
whole design rests on (PLAN.md 7.6).

## index.json

```jsonc
{
  "v": 1,
  "generated": 1795443300,              // when this index was written
  "attribution": "© OpenStreetMap contributors, ODbL 1.0, https://www.openstreetmap.org/copyright",
  "countries": {
    "FI": {
      "generated": 1795443229,          // when Finland's data was fetched from OpenStreetMap
      "pharmacies": 787,
      "withHours": 624,                 // have an opening_hours value
      "parsed": 624,                    // of those, give intervals
      "unparseable": 0,                 // could not be read ("call for hours")
      "uncertain": 0,                   // read, but can't be trusted
      "corrected": 2,                   // parsed after the library corrected the value
      "shareWithHours": 0.7929,         // withHours / pharmacies
      "parseRate": 1,                   // parsed / withHours
      "kept": "fetch"                   // only when this run could not refresh the country:
                                        // "fetch" (Overpass failed) or "check" (a gate failed).
                                        // The numbers and the tiles are then those of an earlier run.
    }
  },
  "grid": {
    "z": 10,
    "x0": 420, "y0": 97,                // the square of the first character of the first row
    "width": 185,
    "rows": ["....ccccdd..", "…"]       // one string per row of squares, north to south
  }
}
```

### The grid

One character per square, west to east. The square `(x, y)` is `rows[y − y0][x − x0]`. A
square outside the grid is `.`.

| Character | Meaning | Tile file |
|---|---|---|
| `.` | Outside the coverage | none |
| `c` | In a covered country, no pharmacy in it | none |
| `d` | Has pharmacies | yes |
| `b` | In a covered country and also touching a country outside the coverage | yes, with a border grid; it may have no pharmacies |

So the index answers "is there data here" and "are we in a covered country" without a request
per empty square. Sea within a covered country's waters counts as that country.

## A tile

```jsonc
{
  "v": 1, "z": 10, "x": 582, "y": 296,
  "sources": [
    { "country": "FI", "zone": "Europe/Helsinki",
      "generated": 1795443229,          // when this country's data was fetched
      "from": 1795384800,               // start of the hours window: local midnight of that day
      "until": 1796076000 }             // end of the window: eight local days later
  ],
  "cities": ["Helsinki", "Espoo"],
  "hours": [
    [[480, 1260, 1920, 2700]],          // a set of open intervals
    [[480, 1080], [1440, 2880]]         // open intervals, then stretches the data calls unknown
  ],
  "rows": [
    ["n1", 60.1699, 24.9384, "Keskustan apteekki", "Mannerheimintie 5", 0, 0, 0, null, "+358 9 1234567"]
  ],
  "border": { "n": 16, "codes": ["FI", "RU"], "cells": "0000…1111" }   // only in "b" squares
}
```

### sources

One entry per country and time zone in the square. A square on a border has several; so does
a square where one country's data is fresh and its neighbour's was kept from an earlier run.
Spain and Portugal have two zones each (the Canaries, the Azores).

**Freshness is per source, not per tile.** A pharmacy's data is too old to read when
`now − generated > 7 days`, or when `now` is outside `[from, until)`. Then no status is
shown as open (see "Status" below).

### rows

One array per pharmacy. Columns, in order; trailing nulls are left off, so a row can be
shorter than the list:

| # | Column | Type | Notes |
|---|---|---|---|
| 0 | id | string | OpenStreetMap type and id: `n123`, `w456`, `r789` |
| 1 | lat | number | Five decimals |
| 2 | lon | number | Five decimals |
| 3 | name | string or null | null: OpenStreetMap has no name, brand or operator. The app says "Apteekki" / "Pharmacy" |
| 4 | street | string or null | Street and house number |
| 5 | city | number or null | Index into `cities`. `addr:city` as OpenStreetMap writes it |
| 6 | source | number | Index into `sources` |
| 7 | hours | number, `"x"`, `"u"` or null | See below |
| 8 | raw | string or null | The `opening_hours` value, at most 200 characters. Kept only when it will be shown |
| 9 | phone | string or null | |
| 10 | email | string or null | |
| 11 | website | string or null | `http` or `https` only |
| 12 | wheelchair | `"yes"`, `"limited"`, `"no"` or null | |
| 13 | wheelchairNote | string or null | `wheelchair:description`, in the mapper's language |
| 14 | dispensing | `false` or null | `false`: OpenStreetMap says `dispensing=no` |
| 15 | checkDate | string or null | `YYYY-MM-DD`: when a mapper last checked the hours |

A reader must ignore columns beyond the ones it knows.

### hours

Column 7 of a row says which of four things is known:

| Column 7 | Column 8 | Meaning |
|---|---|---|
| null | null | **Missing**: OpenStreetMap has no opening hours |
| `"x"` | the value | **Unparseable**: the value could not be read |
| `"u"` | the value | **Uncertain**: read, but not to be trusted (sunrise-based times; holidays in a state we could not determine) |
| a number | null | **Parsed**: the set at that index of `hours` |
| a number | the value | **Parsed, with unknown stretches**: the set has a second list |

A set is `[open]` or `[open, unknown]`. Each list is flat: start, end, start, end, in
**minutes from the source's `from`**. So the first interval of `[480, 1260, …]` runs from
`from + 480·60` to `from + 1260·60`.

- An interval holds its start and not its end: at the closing minute the pharmacy is closed.
- Intervals are sorted, never overlap and never touch. One that crosses midnight is one
  interval. One that is open around the clock is the single interval `[0, …]` to the end of
  the window.
- They are instants. Daylight-saving changes are already in them: 08:00 on the wall is 480
  minutes after midnight on an ordinary day and 540 on the day the clocks go back. **A reader
  never does time-zone arithmetic to decide open or closed.** The zone is there to print a
  time on the pharmacy's own clock.
- Public holidays are already in them, by country, and by state or canton in Germany, Spain
  and Switzerland.
- Identical sets are stored once and shared by index.

### border

Only in `b` squares. `n` cells per side (16, about 1.5 km each), `cells` is `n · n`
characters, north to south and west to east. `.` means no country (open sea); anything else
is a base-36 digit, an index into `codes`. The codes are ISO 3166-1, of covered countries and
others alike.

The cell of a position is, with the fractional tile coordinates `fx`, `fy` from the formulas
above before `floor`:

```
column = floor((fx − x) · n)        row = floor((fy − y) · n)
```

How the app uses it (PLAN.md 7.7): if the position's cell and all the cells around it are
outside the coverage, the app says the country isn't covered. If the position is near the
edge, results are shown as usual with a note that names the country that is missing. The
grid is coarse on purpose: it can cost a note too many, and it cannot hide a result.

## Status

From a pharmacy's intervals and the current instant (`lib/hoursStatus.ts`):

1. **Stale** if `now − generated > 7 days`, `now ≥ until` or `now < from`. This comes first
   and applies to every pharmacy, whatever its hours.
2. Missing, unparseable and uncertain hours are passed on as they are.
3. **Uncertain** if `now` is inside an unknown stretch.
4. If `now` is inside an open interval, with `closes` its end:
   - **open around the clock** if `closes ≥ until`: no closing is in sight;
   - **closes soon** if `closes − now < 30 minutes` (at exactly 30 it is still plainly open);
   - otherwise **open**, until `closes`.
5. Otherwise **closed**. The next opening is the earliest open interval that starts after
   `now`, unless an unknown stretch starts before it: then no opening is promised.

A time is printed on the pharmacy's clock (`zone`), and so is "today" or "tomorrow": the day
turns at local midnight there, not on the device. A closing at midnight is printed as 24:00
of the day that ends.

## Finding the nearest

`lib/tiles.ts`, `searchStep`. Given a position, how many to find and how far to look:

1. Take the pharmacies of the tiles loaded so far that are within the radius, nearest first
   (ties by id). Keep as many as asked for.
2. The reach is the distance of the last one when the list is full, else the radius.
3. Load the tiles the grid lists (`d` or `b`) that are not loaded yet and whose square has a
   point within the reach, nearest square first, a few at a time. Then start again.
4. When there is none left to load, the list is the answer.

It equals a search through every pharmacy there is, because a square is only skipped when
none of its points is nearer than what is already found. The distance to a square is zero
inside it, and otherwise the distance to the nearest point of its outline, less a thousandth
as a margin for measuring on a sphere.

The app looks for the nearest 20 within 10 km; if there are none, the nearest five within
50 km (PLAN.md 7.1). Distances are great-circle distances on a sphere of radius 6,371,008.8 m.

## Test vectors

`tests/vectors/`, written by `npm run vectors` from a fixed seed:

| File | What it checks |
|---|---|
| `zone.json` | An instant on a zone's wall clock; a wall-clock time as an instant, with skipped and doubled times |
| `tiles.json` | Tile numbers, square outlines, distances |
| `status.json` | The status rules above, with the printed day and time |
| `search.json` | The nearest pharmacies through tiles, and how many tiles that took |
| `tile-file.json` | A tile as stored, and as read |
| `ehditko.json` | Ehditkö from a status, a walking time and an instant: the timeline from 60 minutes before closing, too late at closing time, and when the slack is tight (PLAN.md 7.1, step 10) |

Compare distances to within 0.5 %; everything else exactly.

## Country files

`/tiles/v1/countries/{CC}.json` holds all of one country's rows in the tile encoding, with
the numbers of `index.json`:

```jsonc
{ "v": 1, "country": "FI", "stats": { … }, "tile": { "v": 1, "sources": […], "rows": […], … } }
```

They are the pipeline's memory. When a country can't be fetched one night, or fails its
checks, the pipeline reads this file from the published site and writes the country's rows
again as they were, with their older `generated`. The apps don't read these files.
