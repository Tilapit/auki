# Auki (working name)

A web app that finds the nearest open pharmacy. A job application project by Janne Lappi. Not affiliated with Treat Health.

The spec is `PLAN.md`, the working rules are in `CLAUDE.md`, and design decisions made during the build are in `DESIGN-LOG.md`. The pharmacy field findings behind the plan are in `docs/research/`. This file becomes the full README (decisions, trade-offs, known limitations, sources) in milestone M7.

## Status

M0: scaffold, tokens, components and every view on fixture data. No calls to Overpass, openrouteservice or Nominatim yet, and the map is a placeholder until M4.

## Run it

```
npm install
npm run dev
```

Then open `/fi` or `/en`, and `/dev/states` for every view and state in light and dark, phone and desktop. Other commands are listed in `CLAUDE.md`.

## Known limitations so far

- The first-visit sky takes its position from the device time zone (a table of European zones, Helsinki as fallback), so it is approximate by design: no location is asked for it.
- Landscape phones get the phone layout and are cramped.
- The bottom sheet opens and closes by tap; dragging it arrives with the real map in M4.
- The Latvian counter-card text has not had a native check and is marked as an unreviewed translation.
