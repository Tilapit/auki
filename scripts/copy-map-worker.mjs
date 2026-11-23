// MapLibre GL JS 6 ships its worker as a separate file and looks for it next to its own
// module. Behind a bundler that address doesn't exist, so the file is copied to our own
// origin and the map is told where it is (setWorkerUrl). A worker from our own origin
// needs no blob: URL, which keeps the Content-Security-Policy of PLAN.md 7.6 simple.
import { copyFileSync, mkdirSync } from 'node:fs';

mkdirSync('public/maplibre', { recursive: true });
copyFileSync('node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs', 'public/maplibre/maplibre-gl-worker.mjs');
