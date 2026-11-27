# The opening-hours corpus

Every distinct `opening_hours` value of the pharmacies in the covered countries, with how
many pharmacies carry it: the first 21 countries as OpenStreetMap had them on 23 November
2026, and the ten that joined on 27 November 2026 (BE, BG, CY, FR, IE, LU, NL, RO, IS, LI)
as it had them that day; each file's `osmBase` says which. France and the Netherlands are
their European parts, as in the tiles. `expected.json` holds what the hours step makes of
them, all read at one instant (its `at`, 27 November 2026): how many parse, how many needed
the library's correction, how many can't be read. Moving that instant from the 23rd to the
27th changed no count of the first 21.

The hours library has no public holidays for Cyprus, Iceland and Liechtenstein: a value
that mentions `PH` can't be read there and counts as unparseable (one in Cyprus, one in
Iceland, one of Liechtenstein's six).

CI runs the hours step over all of it on every push (`tests/unit/corpus.test.ts`): no value
may throw, every interval must be sound, and the counts must equal `expected.json`. So a
change that lowers the parse rate, or raises it, shows up as a failing test and then as a
diff of that file.

Refresh it with `npm run data`, then `npm run data:corpus`. The second reads the saved
Overpass answers in `.data/raw/` and rewrites a country's file only when its answer is
there; the counts of every country are then taken again at the latest answer's instant.

The values are OpenStreetMap data: © OpenStreetMap contributors, under the Open Database
License (ODbL), https://www.openstreetmap.org/copyright
