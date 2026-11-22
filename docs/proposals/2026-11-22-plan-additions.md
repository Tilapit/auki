# Plan additions, 22 November 2026 (proposals)

From a review of PLAN.md after M0 and of the new field research (`docs/research/pharmacy-field-findings.md`). The aim of this project is to show engineering judgment: depth where it changes the result, nothing for show. Each proposal says why, what, where in the plan, and when it is done.

Claude Code: push back on any proposal you think is wrong or not worth the work, with reasons. Fold the ones you accept into PLAN.md; after that this file can go.

## P1. Cut section 2 now and start a clean history

- **Why:** every commit so far carries interview material that isn't cleared for publication (D1). If the cut waits until M7, either the history from M1 to M7 is thrown away, or the old text stays reachable through the pull requests. The pull requests are the best evidence of how the work was done, so they should be publishable from the start.
- **What:** cut section 2 to the pharmacy findings. Remove anything else in the tree that reports what interviewees said about care, employers or insurers: product decisions stay, the interview evidence behind them goes. Then replace the history with one root commit that holds exactly what `main` tracks now, plus the PLAN update and the files in `docs/`. Force-push `main` and delete the remote branches. Keep the old history locally as `archive/pre-d1`, never pushed.
- **Where:** D1, section 2, M7 (no fresh history needed any more).
- **Done when:** the history on GitHub starts at the new root, and a search of the tree for interview material finds nothing.

## P2. Every milestone lands as a pull request

- **Why:** a reviewer sees how decisions were made, not only the result.
- **What:** a branch per milestone. The PR description has what changed, the decisions and their reasons, screenshots, CI results and the measured numbers. Janne merges.
- **Where:** `CLAUDE.md` (How we work), section 11.
- **Done when:** M1 arrives as a PR with green CI.

## P3. The name lives in one place (D4 open again)

- **Why:** Janne doesn't want "Auki" after all. The name shouldn't block any milestone.
- **What:** one constant (for example `lib/brand.ts`) that all copy, metadata and the manifest read. "Auki" stays as the working name. The repo keeps its name; a GitHub rename later keeps PRs and redirects.
- **Where:** D4 (open; decide before the M7 recording and the domain), the copy in sections 5 and 6.
- **Done when:** changing the constant renames the app everywhere, `<title>` included.

## P4. Coverage: 21 countries

- **Why:** the field data now covers AT, CH, GR, HU, IT, MT, SI and SK, and HR, PT and ES are field-tested. Spain, Greece and Italy are popular destinations for Finns. The architecture grows by a list, and this shows it.
- **What:** add the eight countries to `pipeline/countries.ts` and section 8. Check holiday support in `opening_hours` 3.16 for each (cantons for Switzerland). Where the library has none, `PH`-dependent hours are flagged uncertain as section 7.4 already says; contributing the holiday definitions upstream is an option. The candidate list in 7.7 becomes FR, NL, BE and UK.
- **Where:** 7.2, 7.4, 7.7, 8, M2 ("all thirteen countries" becomes the coverage list).
- **Done when:** M2 publishes tiles and parse rates for all 21.

## P5. Rotating night duty

- **Why:** in many countries (Germany, Austria, Italy, Spain and Greece among them) pharmacies take turns at night and on Sundays. OpenStreetMap hours can't show tonight's duty pharmacy, so at night abroad "nothing open nearby" can be wrong, and the answer is in an official lookup. This is the most likely way the app fails a user abroad at night.
- **What:** in `outOfHours` (8.1), add `duty: 'rotating' | 'fixed' | 'none'` with the official lookup (URL, phone). In a country with rotating duty, the nothing-open state and night results lead with the duty lookup ("Tonight's duty pharmacy") and say in one line why our list may miss it. Verify every source in M6.
- **Where:** section 5 (states), 7.1 step 6, 8.1, M6.
- **Done when:** the nothing-open state in Germany shows the duty lookup first, and Finland doesn't.

## P6. Works offline

- **Why:** abroad, people are often without data (roaming outside the EU rules, Switzerland for example) or with weak signal indoors. The architecture already fits: static tiles with a date and a 7-day rule.
- **What:** a hand-written service worker, no plugin. It caches the app shell, `index.json` and the tiles of the latest search, keyed by the tiles' generated-at time. Offline, the app answers from the cache with the data date, and walking times fall back to straight line. Only the latest area is kept (squares of 20–30 km, on the device, expiring with the data); the privacy page says so.
- **Where:** section 3 (principle 5), 7.3 (Offline state), 7.6, M3 or M5.
- **Done when:** a Playwright test loads results, goes offline, reloads and gets the same pharmacies with the data date; with the clock moved 8 days ahead nothing reads open.

## P7. A public data page

- **Why:** the pipeline's quality is the core of the app. It should be visible, not claimed.
- **What:** `/fi/data` and `/en/data`, built from `index.json`: per country the number of pharmacies, the share with hours, the parse rate, and the time of the last run. Linked from the results footer next to the data date.
- **Where:** 7.2, M3.
- **Done when:** the page shows the numbers of the last nightly run.
- **Note:** in a public repository GitHub disables scheduled workflows after 60 days without activity. The page and the 7-day rule would show it; mention it in the README.

## P8. Fix the data at the source

- **Why:** wrong hours are the app's biggest risk, and the fix belongs in OpenStreetMap.
- **What:** on "hours missing", "hours unclear" and "hours may be out of date", a link to OpenStreetMap's note form at the pharmacy's position (`https://www.openstreetmap.org/note/new#map=19/{lat}/{lon}`). No backend. A fix reaches the tiles the next night.
- **Where:** section 5 (pharmacy sheet), 7.6 (links table), M5.
- **Done when:** the link opens the note form at the pharmacy.

## P9. The map's look: a spike now, not in M4

- **Why:** the map is what Janne is least sure about (D6), and none of the map apps he looked at impressed him. With MapLibre the look comes from our style, not from the tile host. Show that with real tiles before M4 builds on it.
- **What,** on `/dev/map` only, with no wiring into the app:
  - `maplibre-gl` and OpenFreeMap's vector tiles, with our own style built from the design tokens (`lib/map/style.ts`), not one of OpenFreeMap's ready styles.
  - Central Helsinki and one city abroad, with fixture pharmacies: lit cross (open), dim cross (closed), the soon glyph.
  - Variant A, flat and calm: water, parks, three road weights, flat buildings, few labels.
  - Variant B: A plus 3D buildings from zoom 15, lit from the sun's real direction at the map's centre. Extend `lib/sky.ts` with the sun's azimuth and test it against reference values. Below the horizon, a cool light from above.
  - Variant C: B plus a pitched camera that shows the map's sky in the same phase colours as the first-visit sky (MapLibre's `sky`, if the installed version has it).
  - Each variant in day, dusk and night.
  - Labels in Atkinson Hyperlegible Next (glyph PBFs under `public/glyphs`). If that takes more than about an hour, use OpenFreeMap's fonts for the spike and say so.
  - Screenshots at 390×844 and 1440×900 in `design/map-spike/`. A propose-first entry in `DESIGN-LOG.md` with a recommendation. Numbers: `maplibre-gl` gzipped, style size, first map render on the throttled phone profile.
- **Where:** D6 (closed, to be confirmed after the spike), section 6, M4.
- **Done when:** Janne picks a variant from the screenshots.

## P10. iOS earlier

- **Why:** the assignment asks for an iOS app as well as the website, and Treat's own apps are native. Starting iOS only after web M7 risks a rushed native app.
- **What:** an iOS track that starts after M2, once `docs/tiles.md` and `tests/vectors/` exist, in its own Claude Code session. I1: SwiftUI list and map, status from the intervals, checked against the shared vectors. I2: the Live Activity. After P9, decide MapKit (native look, little styling) or MapLibre Native (the web style on both platforms). macOS runners use up Actions minutes many times faster on a private repo: run the iOS tests locally until the repo is public.
- **Where:** D5, section 11.
- **Done when:** I1 passes the shared vectors with `xcodebuild test`.

## Not adding

Accounts, a database, a chatbot or any LLM feature, scraping stock or prices, push notifications, Android before iOS is done. Each adds work without changing what a reviewer learns about the engineering.

## Outcome (Claude Code, 22 November 2026)

All ten are folded into PLAN.md. Four of them changed on the way in:

| Proposal | Outcome | What changed, and why |
|---|---|---|
| P1 | Done as written, then withdrawn | Section 2 was cut to the pharmacy findings and the history restarted from one root commit. Later the same day Janne corrected D1: Treat has cleared all of the trip's findings, the interview material included. Section 2 has that material back, the new root stays, and the older commits need no cleanup. |
| P2 | Accepted | `CLAUDE.md` and section 11. |
| P3 | Accepted | `lib/brand.ts`; D4 is open. A unit test swaps the constant and checks the dictionaries and the metadata. |
| P4 | Accepted | All eight have public-holiday definitions in `opening_hours` 3.16.0. Switzerland's differ by canton, so it is grouped by canton like Germany and Spain by state. New: Greek place names need a rule ("Lähelläsi" when a city has no Latin name in the table), and the Greek counter card needs a fallback typeface. |
| P5 | Accepted, narrower | The duty lookup leads only when nothing nearby is open. When we show an open pharmacy, it stays first and the lookup is one line under it: an external link shouldn't push out an answer we know is right. The trigger is the state, not the clock, so Sundays are covered. Not every country has one national lookup, so the fallback is the notice on the pharmacy's door. |
| P6 | Accepted, later | In M6, not M3 or M5. A service worker caches an app whose shape still changes every milestone, and its bugs (a stale shell after a deploy) are the slow kind. It belongs with the abroad work, where the counter card without data is the strongest case. The build writes the file list, so the worker doesn't guess chunk names. |
| P7 | Accepted | `index.json` also gets the share of pharmacies with hours. In M3. |
| P8 | Accepted, moved | Not on "hours may be out of date": that state means our tiles are old, and a note to OpenStreetMap fixes nothing. Instead the link is in every pharmacy sheet, because the worst case is a pharmacy we called open that was closed, and it sits next to the status when hours are missing or unclear. |
| P9 | Accepted | Built as written, as S1 in section 11. B and C carry the risk of being for show: the recommendation comes with the measured cost on a phone. |
| P10 | Accepted | For iOS to start after M2, the status logic and the shared vectors move from M3 into M2: the tile contract is then testable end to end in one milestone. The map choice (MapKit or MapLibre Native) is open inside D5. |
| Not adding | Accepted | In section 4, "Not doing". |

From the field findings, also folded in: the pharmacy's email in the sheet, counter-card lines P8 to P11, the EHIC tip for Croatia, "ask for the pharmacist" everywhere, and the wording rule for medicines sold over the counter.
