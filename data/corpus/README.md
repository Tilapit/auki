# The opening-hours corpus

Every distinct `opening_hours` value of the pharmacies in the 21 covered countries, with how
many pharmacies carry it, as OpenStreetMap had them on 23 November 2026. `expected.json`
holds what the hours step makes of them: how many parse, how many needed the library's
correction, how many can't be read.

CI runs the hours step over all of it on every push (`tests/unit/corpus.test.ts`): no value
may throw, every interval must be sound, and the counts must equal `expected.json`. So a
change that lowers the parse rate, or raises it, shows up as a failing test and then as a
diff of that file.

Refresh it with `npm run data`, then `npm run data:corpus`.

The values are OpenStreetMap data: © OpenStreetMap contributors, under the Open Database
License (ODbL), https://www.openstreetmap.org/copyright
