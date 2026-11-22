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

## Design latitude
You're trusted to improve the design. The canvas is the approved direction, not a pixel spec, and real data will show things the canvas couldn't. The feel to aim for is Flighty: calm, dense, status readable at a glance, one bold signal (here the lit cross). Treat's palette, not Treat's website.
- Decide, then log: spacing, sizes, alignment, motion timing, loading and empty states, sheet and map interaction details, how layouts cope with real data (long names, repeated names, many results, missing hours), accessibility fixes, small copy edits within the copy rules.
- Propose first and wait: changes to the lit-cross status system, the palette, the typeface, the layout of a main view, adding or removing a feature or screen, anything that touches scope (PLAN.md section 4). Show the current and the proposed version side by side in `/dev/states` and give the reason in one or two sentences.
- Tried and rejected, don't bring back: pill buttons, shadows on buttons, icons that only decorate, an FI/EN pill toggle, questions on the first visit, a "you'll make it" badge, a clock-time headline, taglines in threes ("Fast. Private. Free."), all-caps labels above headings, decorative gradients outside the first-visit scene.
- Every decision gets an entry in `DESIGN-LOG.md`.

## Content rules (these win over everything above)
- The app never presents itself as Treat's: no Treat name or logo in the UI. Footer: "Janne Lapin työhakemusprojekti. Ei Treat Healthin palvelu." / "A job application project by Janne Lappi. Not affiliated with Treat Health."
- No interviewee names anywhere: code, fixtures, comments, commit messages. No field result tied to a named pharmacy.
- Pharmacy field results are cleared for publication (decision D1): show them with sample size, date and city. Nothing else from the research trip goes into the repository, in any file, comment or commit message: no interview material about care, employers or insurers.
- Branches under `archive/` hold the history from before that cut. They stay on this machine and are never pushed.
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
- `npm test`: unit tests (Vitest), in `tests/unit/`.
- `npm run test:e2e`: the Playwright tests against the dev server, in Chromium and WebKit. First time: `npx playwright install chromium webkit`. Tests wait for hydration before they click (`open()` in `tests/e2e/flow.spec.ts`).
- `npm run shots`: screenshots of every `/dev/states` view at 390×844 and 1440×900, light and dark, at 2×, into `screenshots/` (Chromium) and `screenshots/webkit/` (not committed). For looking at. `LOCALE=en npm run shots` for English.
- `npm run lighthouse`: the budgets of PLAN.md section 12 against a production build (`npm run build` first), and the measured numbers as a table. Set `CHROME_PATH` if Chrome isn't installed: `CHROME_PATH="$(node -e "console.log(require('playwright').chromium.executablePath())")"`.

CI (`.github/workflows/ci.yml`) runs on every push: type check, lint, unit tests, production build, Lighthouse budgets, a check that `/dev` is a 404 in that build, then Playwright with the visual comparison against a second build made with `DEV_ROUTES=1`. A newer push to the same branch cancels the running one.

Visual baselines live in `tests/e2e/__screenshots__/`, at 1×, and are made in the CI's Linux image, never on macOS (text renders differently). When a view changes on purpose:
1. Push a commit whose message contains `[baselines]` (or run the workflow by hand with "baselines" ticked). That run makes new baselines instead of comparing.
2. `gh run download <run id> -n baselines -D tests/e2e/__screenshots__`
3. Look at the changed images, commit them, push. That run compares, and the pull request shows old and new side by side.
- On a phone in the same network: the dev server listens on every interface, so open `http://<this machine's LAN address>:<port>/fi` (`ipconfig getifaddr en0`). `next.config.ts` allows the machine's LAN addresses as dev origins at start-up; restart the dev server after changing networks. Geolocation needs HTTPS: `npm run dev:https`.
- `/dev/map` (redirects to `/fi/dev/map`): the map spike, on real OpenFreeMap tiles. `DEV_ROUTES=1 npm run build` and `DEV_ROUTES=1 npm run start` keep it in a production build, to measure it there.
- `/dev/states` (redirects to `/fi/dev/states`): every view and state from fixtures. Add new views to `lib/dev/viewList.ts` and `lib/dev/views.tsx`. Nothing there may read the clock or call a service.
- Place search needs `CONTACT_EMAIL` in `.env.local` (Nominatim asks callers to identify themselves). Without it `/api/geocode` answers 503 and the view says the search isn't available. Tests never call Nominatim: they answer `/api/geocode` themselves.
