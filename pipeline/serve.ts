/**
 * Serves the tiles of the last `npm run data` on this machine, for development:
 * `npm run data:serve`, then `npm run dev`. The dev server's /tiles rewrite points here
 * when TILES_ORIGIN is not set (next.config.ts).
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

export const LOCAL_DATA_PORT = 3900;
const root = path.resolve('.data/site');

http
  .createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    const file = path.join(root, pathname);
    // Nothing outside the site directory, and nothing but the JSON it holds.
    if (!file.startsWith(root + path.sep) || !file.endsWith('.json') || !fs.existsSync(file)) {
      response.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
      return;
    }
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(response);
  })
  .listen(LOCAL_DATA_PORT, () => {
    console.log(`Tiles from ${root} on http://localhost:${LOCAL_DATA_PORT}`);
    if (!fs.existsSync(path.join(root, 'tiles'))) console.log('Nothing there yet: run "npm run data" first.');
  });
