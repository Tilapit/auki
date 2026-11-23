/**
 * The data pipeline's entry point (PLAN.md 7.2): `npm run data`, or `npm run data -- FI SE`
 * for some countries only.
 *
 *   --cached      use the Overpass answers saved in .data/raw instead of asking again
 *   --out=<dir>   where the site is written (default .data/site)
 *
 * A country that isn't asked for, can't be fetched or fails its checks keeps the data of the
 * last run: from the output directory if it has any, else from TILES_ORIGIN.
 *
 * Exit code: 0 when every country asked for is fresh, 2 when the site was written but some
 * country kept older data, 1 when nothing could be written.
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { INDEX_PATH } from '../lib/tiles.ts';
import type { CountryStats, IndexJson, TilePharmacy } from '../lib/tiles.ts';
import { check, statsOf } from './check.ts';
import { COUNTRIES, COUNTRY_CODES } from './countries.ts';
import type { Country } from './countries.ts';
import { fetchCountry } from './fetch.ts';
import type { CountryExtract, FetchDeps } from './fetch.ts';
import { memoized, windowFor } from './hours.ts';
import type { Window } from './hours.ts';
import { normalize } from './normalize.ts';
import { buildSite, countryPath, decodeCountry } from './write.ts';
import type { CountryData, CountryFile, SiteSummary } from './write.ts';

const PAUSE_BETWEEN_COUNTRIES_MS = 10_000;
const RAW_DIR = '.data/raw';

interface Options {
  codes: string[];
  cached: boolean;
  outDir: string;
}

function readArguments(argv: string[]): Options {
  const codes: string[] = [];
  let cached = false;
  let outDir = '.data/site';
  for (const argument of argv) {
    if (argument === '--cached') cached = true;
    else if (argument.startsWith('--out=')) outDir = argument.slice('--out='.length);
    else if (COUNTRY_CODES.includes(argument.toUpperCase())) codes.push(argument.toUpperCase());
    else throw new Error(`Unknown argument "${argument}". Countries: ${COUNTRY_CODES.join(' ')}`);
  }
  return { codes: codes.length > 0 ? codes : COUNTRY_CODES, cached, outDir };
}

/** One country, from an Overpass answer to the pharmacies of its tiles. Pure. */
export function processCountry(country: Country, extract: CountryExtract): { data: CountryData; dropped: ReturnType<typeof normalize>['dropped'] } {
  const { pharmacies: normalized, dropped } = normalize(extract, country);
  const hoursOf = memoized();
  const windows = new Map<string, Window>();
  let corrected = 0;

  const pharmacies = normalized.map((pharmacy): TilePharmacy => {
    let window = windows.get(pharmacy.zone);
    if (!window) {
      // The window starts on the day of the fetch, which is the day the data is from.
      window = windowFor(pharmacy.zone, extract.fetched);
      windows.set(pharmacy.zone, window);
    }
    const result = hoursOf(pharmacy.openingHours, { country, state: pharmacy.state, window });
    if (result.corrected && result.hours.kind === 'parsed') corrected++;
    // The state and the raw value have done their work: a tile carries neither.
    const published: Partial<typeof pharmacy> = { ...pharmacy };
    delete published.state;
    delete published.openingHours;
    return { ...(published as Omit<typeof pharmacy, 'state' | 'openingHours'>), generated: extract.fetched, windowFrom: window.from, windowUntil: window.until, hours: result.hours };
  });

  return {
    data: { code: country.code, stats: statsOf(extract.fetched, pharmacies.map((pharmacy) => pharmacy.hours), corrected), pharmacies },
    dropped,
  };
}

interface Previous {
  index: IndexJson | undefined;
  country: (code: string) => Promise<CountryData | undefined>;
  from: string;
}

/** The last run: the output directory if it holds one, else the published site. */
async function previousRun(outDir: string, origin: string | undefined): Promise<Previous> {
  const localIndex = path.join(outDir, INDEX_PATH);
  if (fs.existsSync(localIndex)) {
    return {
      index: JSON.parse(fs.readFileSync(localIndex, 'utf8')) as IndexJson,
      from: outDir,
      country: async (code) => {
        const file = path.join(outDir, countryPath(code));
        return fs.existsSync(file) ? decodeCountry(JSON.parse(fs.readFileSync(file, 'utf8')) as CountryFile) : undefined;
      },
    };
  }
  if (origin) {
    const get = async <T>(pathname: string): Promise<T | undefined> => {
      try {
        const response = await fetch(new URL(pathname, origin));
        return response.ok ? ((await response.json()) as T) : undefined;
      } catch {
        return undefined;
      }
    };
    return {
      index: await get<IndexJson>(INDEX_PATH),
      from: new URL(origin).host,
      country: async (code) => {
        const file = await get<CountryFile>(countryPath(code));
        return file ? decodeCountry(file) : undefined;
      },
    };
  }
  return { index: undefined, from: 'nowhere: this is a first run', country: async () => undefined };
}

interface Outcome {
  code: string;
  state: 'fresh' | 'kept' | 'missing';
  /** Why it isn't fresh. */
  reason?: string;
  stats?: CountryStats;
  seconds?: number;
}

const percent = (share: number): string => `${(share * 100).toFixed(1)} %`;
const kilobytes = (bytes: number): string => `${(bytes / 1024).toFixed(1)} KB`;

function report(outcomes: Outcome[], site: SiteSummary | undefined, previousFrom: string): string {
  const lines = [
    '## Pharmacy data',
    '',
    `Compared with the last run from ${previousFrom}.`,
    '',
    '| Country | State | Pharmacies | With hours | Parse rate | Corrected | Unparseable | Uncertain | Note |',
    '|---|---|---:|---:|---:|---:|---:|---:|---|',
  ];
  for (const outcome of outcomes) {
    const s = outcome.stats;
    lines.push(
      s
        ? `| ${outcome.code} | ${outcome.state} | ${s.pharmacies} | ${percent(s.shareWithHours)} | ${percent(s.parseRate)} | ${s.corrected} | ${s.unparseable} | ${s.uncertain} | ${outcome.reason ?? ''} |`
        : `| ${outcome.code} | ${outcome.state} | | | | | | | ${outcome.reason ?? ''} |`,
    );
  }
  const totals = outcomes.reduce(
    (sum, { stats }) => ({ pharmacies: sum.pharmacies + (stats?.pharmacies ?? 0), withHours: sum.withHours + (stats?.withHours ?? 0), parsed: sum.parsed + (stats?.parsed ?? 0) }),
    { pharmacies: 0, withHours: 0, parsed: 0 },
  );
  if (totals.pharmacies > 0) {
    lines.push(`| All | | ${totals.pharmacies} | ${percent(totals.withHours / totals.pharmacies)} | ${percent(totals.withHours === 0 ? 0 : totals.parsed / totals.withHours)} | | | | |`);
  }
  if (site) {
    lines.push(
      '',
      `Tiles: ${site.tiles} files, ${site.borderOnly} of them only a border grid. Squares: ${site.squares.d} with pharmacies, ${site.squares.b} at the edge of the coverage, ${site.squares.c} covered without a pharmacy.`,
      `Tile size, gzipped: median ${kilobytes(site.sizes.medianGzip)}, largest ${kilobytes(site.sizes.largestGzip)} (${site.sizes.largestTile}; ${kilobytes(site.sizes.largest)} before compression). All tiles together ${kilobytes(site.sizes.totalGzip)}.`,
      `index.json: ${kilobytes(site.index.gzip)} gzipped. Country files: ${kilobytes(site.countryFiles.gzip)} gzipped.`,
    );
  }
  return lines.join('\n');
}

async function main(): Promise<number> {
  const options = readArguments(process.argv.slice(2));
  const contact = process.env.CONTACT_EMAIL;
  if (!options.cached && !contact) {
    console.error('CONTACT_EMAIL is not set. Overpass asks callers to identify themselves, so nothing was fetched. Put it in .env.local (see .env.example).');
    return 1;
  }

  const startedAt = Math.floor(Date.now() / 1000);
  const previous = await previousRun(options.outDir, process.env.TILES_ORIGIN);
  const deps: FetchDeps = {
    fetch,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    now: () => Math.floor(Date.now() / 1000),
    contact: contact ?? '',
    log: (line) => console.log(line),
  };

  const countries: CountryData[] = [];
  const outcomes: Outcome[] = [];
  let fetches = 0;

  for (const country of COUNTRIES) {
    const code = country.code;
    const asked = options.codes.includes(code);
    let fresh: CountryData | undefined;
    let reason: string | undefined;
    let kept: CountryStats['kept'];
    const t0 = Date.now();

    if (asked) {
      try {
        let extract: CountryExtract;
        const rawFile = path.join(RAW_DIR, `${code}.json`);
        if (options.cached) {
          if (!fs.existsSync(rawFile)) throw new Error(`no saved answer in ${rawFile}`);
          extract = JSON.parse(fs.readFileSync(rawFile, 'utf8')) as CountryExtract;
        } else {
          if (fetches++ > 0) await deps.sleep(PAUSE_BETWEEN_COUNTRIES_MS);
          extract = await fetchCountry(country, deps);
          fs.mkdirSync(RAW_DIR, { recursive: true });
          fs.writeFileSync(rawFile, JSON.stringify(extract));
        }
        const { data, dropped } = processCountry(country, extract);
        const verdict = check(data.stats, previous.index?.countries[code]);
        console.log(
          `${code}: ${data.stats.pharmacies} pharmacies (${dropped.duplicate} duplicates, ${dropped.private} private and ${dropped.noPosition} without a position left out), ` +
            `${percent(data.stats.shareWithHours)} with hours, parse rate ${percent(data.stats.parseRate)}`,
        );
        if (verdict.ok) fresh = data;
        else {
          reason = `failed its check: ${verdict.reason}`;
          kept = 'check';
        }
      } catch (error) {
        reason = `not fetched: ${error instanceof Error ? error.message : String(error)}`;
        kept = 'fetch';
      }
    }

    if (fresh) {
      countries.push(fresh);
      outcomes.push({ code, state: 'fresh', stats: fresh.stats, seconds: (Date.now() - t0) / 1000 });
      continue;
    }

    const old = await previous.country(code);
    if (old) {
      // Asked for and failed: say so in the index. Not asked for: it simply stays as it was.
      const stats: CountryStats = asked ? { ...old.stats, kept } : old.stats;
      countries.push({ ...old, stats });
      outcomes.push({ code, state: 'kept', stats, reason: reason ?? 'not asked for in this run' });
    } else {
      outcomes.push({ code, state: 'missing', reason: reason ?? 'not asked for, and no earlier data' });
    }
    if (reason) console.error(`${code}: ${reason}`);
  }

  if (countries.length === 0) {
    console.error('No country has data: nothing was written.');
    return 1;
  }

  // Build next to the old site and swap, so a failed write never leaves half a site.
  const nextDir = `${options.outDir}.next`;
  fs.rmSync(nextDir, { recursive: true, force: true });
  const site = buildSite(countries, { outDir: nextDir, now: startedAt, covered: COUNTRY_CODES });
  fs.rmSync(options.outDir, { recursive: true, force: true });
  fs.renameSync(nextDir, options.outDir);

  const text = report(outcomes, site, previous.from);
  console.log(`\n${text}\n`);
  fs.writeFileSync(path.join(path.dirname(options.outDir), 'report.md'), `${text}\n`);
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) fs.appendFileSync(summary, `${text}\n`);
  const output = process.env.GITHUB_OUTPUT;
  if (output) fs.appendFileSync(output, 'written=true\n');

  const failed = outcomes.filter((outcome) => options.codes.includes(outcome.code) && outcome.state !== 'fresh');
  if (failed.length > 0) {
    console.error(`Not fresh: ${failed.map((outcome) => outcome.code).join(', ')}. The site was written with their earlier data where there was any.`);
    return 2;
  }
  return 0;
}

// Run only as a script, not when a test imports processCountry().
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(
    (code) => process.exit(code),
    (error) => {
      console.error(error);
      process.exit(1);
    },
  );
}
