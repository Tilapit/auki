# Auki (working name)

A web app that finds the nearest open pharmacy. A job application project by Janne Lappi. Not affiliated with Treat Health.

The spec is `PLAN.md`, the working rules are in `CLAUDE.md`, and design decisions made during the build are in `DESIGN-LOG.md`. The pharmacy field findings behind the plan are in `docs/research/`. This file becomes the full README (decisions, trade-offs, known limitations, sources) in milestone M7.

## Status

M1: the app finds a position, from the device or from a place name, and handles every way that can fail. It then stops at the searching view: pharmacy data arrives with the nightly pipeline (M2) and the client that reads it (M3). The map is a placeholder until M4.

Every push runs type check, lint, unit tests, the Playwright flows with a visual comparison of every view, and Lighthouse budgets.

## Run it

```
npm install
npm run dev
```

Then open `/fi` or `/en`, and `/dev/states` for every view and state in light and dark, phone and desktop. Other commands are listed in `CLAUDE.md`.

Place search calls Nominatim through the server and needs a contact address to identify itself: copy `.env.example` to `.env.local` and set `CONTACT_EMAIL`.

## Known limitations so far

- The first-visit sky takes its position from the device time zone (a table of European zones, Helsinki as fallback), so it is approximate by design: no location is asked for it.
- Landscape phones get the phone layout and are cramped.
- The bottom sheet opens and closes by tap; dragging it arrives with the real map in M4.
- The Latvian counter-card text has not had a native check and is marked as an unreviewed translation.
