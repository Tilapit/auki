# Auki (working name)

A web app that finds the nearest open pharmacy. A job application project by Janne Lappi for Treat Health, not a Treat product. Website first, with the iOS app on its own track from M2 on.

The name is not final (PLAN.md decision D4). It lives in one constant, `lib/brand.ts`: never write it into copy, metadata or tests by hand.

## Sources of truth
- `PLAN.md` is the spec: scope (section 4), screens (5), design system (6), architecture (7), accessibility (9), milestones (11), open decisions (13). If the code and PLAN.md disagree, say so before changing either.
- `design/` is the approved visual direction from the Claude Design canvas: board images in `design/png/` and source files in `design/canvas/` (see `design/README.md`). Reference only, never imported.
- `DESIGN-LOG.md` records the design decisions made during the build.
- `docs/research/pharmacy-field-findings.md` is the evidence behind PLAN.md sections 2 and 8.

## How we work
- One milestone at a time (PLAN.md section 11), each on its own branch (`m1`, `m2`, …) and delivered as a pull request. Commit on the milestone branch as you go. Never commit to `main` and never merge: Janne reviews and merges.
- The pull request description is the report: what changed, the decisions and their reasons, where you departed from PLAN.md or the designs, screenshots (light and dark; phone and desktop), CI results, the measured numbers, and open questions.
- Check UI work visually before reporting: screenshot the affected `/dev/states` views with Playwright at 390×844 and 1440×900, light and dark, look at the images and compare them with `design/png/`.
- Ask before adding a dependency that PLAN.md doesn't name.
- Next.js 16 App Router, TypeScript strict, CSS Modules with CSS variables. No Tailwind, no UI kit, no icon library, no analytics, no cookies.
- Server-only code lives in `lib/server/` and is never imported by client components. Secrets go in `.env.local` only; `.env.example` lists the names.
- Accessibility (PLAN.md section 9) is part of every milestone, not a final polish step.

## Night runs
Janne works with Claude Code in the evenings. At night a scheduled task starts a fresh session every hour from 23:00 to 06:00; a run doesn't start while another is going.
- Each run: read `.fable/tonight.md` (Janne's goal for the night), `.fable/log.md`, PLAN.md section 11 and the open pull requests. If `tonight.md` is empty, take the next milestone in PLAN order.
- One piece per night, on its own branch, as a pull request. Don't merge: Janne reviews and merges in the evening. Don't start work that depends on an unmerged pull request. If the piece is done early, use the time to verify it (edge cases, measurements, flaky tests) in the same pull request, then stop.
- Propose-first decisions: take your recommendation, mark it provisional in `DESIGN-LOG.md` and in the pull request, and continue.
- Never lower a test, budget or threshold to get CI green. If you can't get it green, say why in the pull request and the log.
- Stop and skip, never guess: secrets or accounts you don't have, anything that costs money, anything irreversible outside the repo (force-push, deleting branches, repos or data, GitHub or Vercel settings beyond what Janne allowed), and changes to scope or to the privacy claims. Put the blocker under "Needs Janne".
- Outside 23:00 to 07:00 Helsinki time, write one line to the log and stop.
- End every run with a log entry: what you did, the pull request and its CI state, "Check this first" (the three things most worth Janne's review) and "Needs Janne" (at most three items, each with exact steps).
- The log writes itself: a Stop hook in `.claude/settings.local.json` copies a session's closing message to `.fable/last.md` and appends it to `.fable/log.md` with the time and the branch. So the closing message is the log entry; don't write it to the file as well. `.fable/` is local and never committed.

## Design latitude
You're trusted to improve the design. The canvas is the approved direction, not a pixel spec, and real data will show things the canvas couldn't. The feel to aim for is Flighty: calm, dense, status readable at a glance, one bold signal (here the lit cross). Treat's palette, not Treat's website.
- Decide, then log: spacing, sizes, alignment, motion timing, loading and empty states, sheet and map interaction details, how layouts cope with real data (long names, repeated names, many results, missing hours), accessibility fixes, small copy edits within the copy rules.
- Propose first and wait: changes to the lit-cross status system, the palette, the typeface, the layout of a main view, adding or removing a feature or screen, anything that touches scope (PLAN.md section 4). Show the current and the proposed version side by side in `/dev/states` and give the reason in one or two sentences.
- Tried and rejected, don't bring back: pill buttons, shadows on buttons, icons that only decorate, an FI/EN pill toggle, questions on the first visit, a "you'll make it" badge, a clock-time headline, taglines in threes ("Fast. Private. Free."), all-caps labels above headings, decorative gradients outside the first-visit scene.
- Every decision gets an entry in `DESIGN-LOG.md`.

## Content rules (these win over everything above)
- The app never presents itself as Treat's: no Treat name or logo in the UI. Footer: "Janne Lapin työhakemusprojekti. Ei Treat Healthin palvelu." / "A job application project by Janne Lappi. Not affiliated with Treat Health."
- No interviewee names anywhere: code, fixtures, comments, commit messages. No field result tied to a named pharmacy.
- All of the findings of Treat's research trip are cleared for use and publication (decision D1): the pharmacy findings and the interview material. In the app, show pharmacy field results with sample size, date and city.
- Branches under `archive/` hold the history from before 22 Nov 2026. They stay on this machine and are never pushed.
- No medical advice. Link to 112, the national advice lines and Kanta. Never present "sold without a prescription" as a tip (PLAN.md section 8).
- Copy: Finnish first, then English. Sentence case, plain verbs, no exclamation marks, no em dashes. Every string lives in `lib/i18n/`.
- Finnish copy: "klo 20.45" (whole hours as "klo 21" in status lines); ranges with an en dash and no spaces ("8.00–24.00", "ma–pe"); decimal comma ("1,1 km"); a non-breaking space between a number and its unit ("3 min", "220 m") and after "klo"; Finnish quotation marks ”…”; `hyphens: auto` on `lang="fi"` text so long compound words break cleanly.
- English copy: en-GB, 24-hour times, "1.1 km".
- Numbers, times and distances go through `lib/format.ts`, which applies these rules; don't format them by hand.

## Next.js 16
This is not the Next.js in your training data. Before writing framework code, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices. Things already met in this repo: `middleware.ts` is now `proxy.ts`; `params` and `searchParams` are promises, typed with the global `PageProps<'/route'>` and `LayoutProps<'/route'>` helpers (`npx next typegen`); `next lint` is gone, so linting is plain `eslint`; dev output goes to `.next/dev`, so a build can run next to the dev server. `agentRules: false` in `next.config.ts` stops `next dev` from writing its own `AGENTS.md`: this file is the one set of instructions.

## Commands
Scripts run with `TZ=UTC` (PLAN.md 7.4). If port 3000 is taken, pass another: `npm run dev -- -p 3210`, and `PORT=3210` for the Playwright commands.
- `npm run dev`: dev server. `npm run dev:https` to test geolocation on a phone.
- `npm run build`, `npm run start`: production build and server. Everything under `/dev` is a 404 there.
- `npm run lint`, `npm run typecheck`.
- `npm test`: unit tests (Vitest) in `tests/unit/` and property tests (fast-check) in `tests/property/`.
- `npm run test:e2e`: the Playwright tests against the dev server, in Chromium and WebKit. First time: `npx playwright install chromium webkit`. Tests wait for hydration before they click (`open()` in `tests/e2e/flow.spec.ts`).
- `npm run shots`: screenshots of every `/dev/states` view at 390×844 and 1440×900, light and dark, at 2×, into `screenshots/` (Chromium) and `screenshots/webkit/` (not committed). For looking at. `LOCALE=en npm run shots` for English.
- `npm run data`: the data pipeline of PLAN.md 7.2, for every covered country, into `.data/site/` (not in git). `npm run data -- FI SE` refreshes only those and keeps the rest as they were. `--cached` reads the Overpass answers saved in `.data/raw/` instead of asking again: use it while working on the pipeline, the public Overpass servers are slow and shared. `--retry` refreshes only the countries the last run could not (marked as kept, missing, or older than 12 hours) and does nothing when there are none: it is the night's second attempt. Needs `CONTACT_EMAIL` and Node 22.18 or later, which runs the TypeScript as it is.
- `npm run data:serve`: serves `.data/site/` on port 3900. The dev server's `/tiles` rewrite points there when `TILES_ORIGIN` is not set.
- `npm run data:corpus`: pins the distinct `opening_hours` values of the last run into `data/corpus/`, with the counts the corpus test expects. Run it after `npm run data` when the pipeline's parsing changes on purpose, and look at the diff of `expected.json`.
- `npm run vectors`: writes `tests/vectors/` again, the cases the iOS app is checked against. A unit test fails until this has been run after a change to the time or tile logic.
- `npm run lighthouse`: the budgets of PLAN.md section 12 against a production build (`npm run build` first), and the measured numbers as a table. Set `CHROME_PATH` if Chrome isn't installed: `CHROME_PATH="$(node -e "console.log(require('playwright').chromium.executablePath())")"`.

The data workflow (`.github/workflows/data.yml`) runs the pipeline every night at 01:17 UTC and publishes the tiles, and at 03:47 UTC runs it again with `--retry` for the countries that failed; on a push that touches `pipeline/` it runs Malta alone and publishes nothing. A failed run names the countries it could not refresh in its error line. The tiles are published to `https://auki-data.vercel.app`, which the workflow also reads the last run from.

CI (`.github/workflows/ci.yml`) runs on every push: type check, lint, unit tests, production build, Lighthouse budgets, a check that `/dev` is a 404 in that build, then Playwright with the visual comparison against a second build made with `DEV_ROUTES=1`. A newer push to the same branch cancels the running one.

Visual baselines live in `tests/e2e/__screenshots__/`, at 1×, and are made in the CI's Linux image, never on macOS (text renders differently). When a view changes on purpose:
1. Push a commit whose message contains `[baselines]` (or run the workflow by hand with "baselines" ticked). That run makes new baselines instead of comparing.
2. `gh run download <run id> -n baselines -D tests/e2e/__screenshots__`
3. Look at the changed images, commit them, push. That run compares, and the pull request shows old and new side by side.
- On a phone in the same network: the dev server listens on every interface, so open `http://<this machine's LAN address>:<port>/fi` (`ipconfig getifaddr en0`). `next.config.ts` allows the machine's LAN addresses as dev origins at start-up; restart the dev server after changing networks. Geolocation needs HTTPS: `npm run dev:https`.
- `/dev/map` (redirects to `/fi/dev/map`): the results view on real OpenFreeMap tiles, at noon, dusk and night in both themes (`?theme=`, `?z=` for the zoom, `?sheet=expanded`). It calls the map tile host, which is why it is not in `/dev/states`. `DEV_ROUTES=1 npm run build` and `DEV_ROUTES=1 npm run start` keep it in a production build, to measure it there.
- Next keeps one dev server per directory: when one is already running here (Janne's, for the phone), a second `npm run dev` refuses to start. Leave it running and test against a build instead: `DEV_ROUTES=1 npm run build`, `DEV_ROUTES=1 npm run start -- -p 3210`, then `PORT=3210 npx playwright test …` uses that server. Add `TILES_ORIGIN=http://localhost:3900` to both for real pharmacies from `npm run data:serve`.
- Touch in browser tests: `touchscreen()` in `tests/e2e/helpers.ts` gives real touch input (drag, pinch, tap) in Chromium through DevTools; WebKit has none, so those tests skip there. Gestures and the map's own easing take real time: such tests start with `startRunning`, which leaves the page's clock running from the test's moment. With that clock the map's `performance.mark` can't be read: wait for `data-basemap="live"` and `data-zoom` on the map's element.
- The map draws every pharmacy beyond the list's ten itself (`lib/map/area.ts`), only where MapLibre is drawing: `/dev/states` never shows those signs. `/dev/map` shows them on invented pharmacies; the real ones need `npm run data:serve`.
- The map in browser tests: the map tile host is answered by the tests (`tests/e2e/fixtures.ts`; specs import `test` and `expect` from there, not from `@playwright/test`). MapLibre loads after the results and works on the page's clock, so a test that has paused the clock moves it (`settle`) before it expects anything of the map. In `/dev/states` the map is the same component without MapLibre: markers on the plain ground colour.
- Real pharmacies in the dev server: `npm run data` once, then `npm run data:serve` next to `npm run dev`. Browser tests never use them: they answer `/tiles/v1/…` themselves (`fakeTiles` in `tests/e2e/helpers.ts`). A test that pauses the page's clock has to move it once after a view first appears (`settle` in `tests/e2e/results.spec.ts`): React holds a lazily loaded view back on a timer.
- `/dev/states` (redirects to `/fi/dev/states`): every view and state from fixtures. Add new views to `lib/dev/viewList.ts` and `lib/dev/views.tsx`. Nothing there may read the clock or call a service.
- Place search needs `CONTACT_EMAIL` in `.env.local` (Nominatim asks callers to identify themselves). Without it `/api/geocode` answers 503 and the view says the search isn't available. Tests never call Nominatim: they answer `/api/geocode` themselves.
