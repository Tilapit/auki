# The data host

What the nightly workflow publishes (PLAN.md 7.2, decision D7): a static site of its own
that holds nothing but the tiles. The app serves it under its own origin through a rewrite
(`/tiles/*`, `next.config.ts`), so the browser talks to one host.

- `vercel.json` goes to the root of the published directory. It sets the caching: an hour in
  the browser and on the CDN, with a day in which a stale copy may be served while a fresh
  one is fetched in the background.
- The files themselves are written by `npm run data` into `.data/site/`, which is not in git.
- The data is OpenStreetMap's, under the ODbL: © OpenStreetMap contributors,
  https://www.openstreetmap.org/copyright
