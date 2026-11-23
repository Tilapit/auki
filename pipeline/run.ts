/**
 * The data pipeline's entry point (PLAN.md 7.2): `npm run data`, or `npm run data -- FI SE`
 * for some countries only.
 *
 *   --cached      use the Overpass answers saved in .data/raw instead of asking again
 *   --retry       the second attempt of the night: of the countries asked for, only those the
 *                 last run could not refresh. With none of them, nothing is fetched or written.
 *   --out=<dir>   where the site is written (default .data/site)
 *
 * A country that isn't asked for, can't be fetched or fails its checks keeps the data of the
 * last run: from the output directory if it has any, else from TILES_ORIGIN.
 *
 * When three countries in a row can't be fetched, Overpass is taken to be down: the rest are
 * not asked, they keep their data, and the second attempt takes them up.
 *
 * Exit code: 0 when every country asked for is fresh (or a retry had nothing to do), 2 when
 * the site was written but some country kept older data, 1 when nothing could be written.
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
/** The second attempt asks again for a country whose data is older than this: the first attempt didn't reach it. */
export const RETRY_OLDER_THAN_SECONDS = 12 * 60 * 60;
/** This many countries in a row that can't be fetched, and Overpass is taken to be down for now. */
export const GIVE_UP_AFTER_FAILURES = 3;

export interface Options {
  codes: string[];
  cached: boolean;
  retry: boolean;
  outDir: string;
}

export function readArguments(argv: string[]): Options {
  const codes: string[] = [];
  let cached = false;
  let retry = false;
  let outDir = '.data/site';
  // "FI SE" in one argument is as good as two: a workflow input arrives that way.
  for (const argument of argv.flatMap((value) => value.split(/[\s,]+/)).filter(Boolean)) {
    if (argument === '--cached') cached = true;
    else if (argument === '--retry') retry = true;
    else if (argument.startsWith('--out=')) outDir = argument.slice('--out='.length);
    else if (COUNTRY_CODES.includes(argument.toUpperCase())) codes.push(argument.toUpperCase());
    else throw new Error(`Unknown argument "${argument}". Countries: ${COUNTRY_CODES.join(' ')}`);
  }
  return { codes: codes.length > 0 ? codes : COUNTRY_CODES, cached, retry, outDir };
}

/**
 * What the second attempt of the night asks for (`--retry`): the countries that the last
 * run marked as kept from an earlier one, those it has no data for at all, and those whose
 * data is older than twelve hours, which is what a first attempt that never ran leaves behind.
 */
export function needsRetry(codes: string[], index: Pick<IndexJson, 'countries'> | undefined, now: number): string[] {
  return codes.filter((code) => {
    const stats = index?.countries[code];
    return !stats || stats.kept !== undefined || now - stats.generated > RETRY_OLDER_THAN_SECONDS;
  });
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

export interface Previous {
  index: IndexJson | undefined;
  country: (code: string) => Promise<CountryData | undefined>;
  from: string;
}

/**
 * The last run: the output directory if it holds one, else the published site.
 *
 * A published site that answers 404 for its index has never been published to: a first run.
 * Any other failure to read it stops this run. Writing a site without knowing the last one
 * would drop every country that can't be fetched tonight, and publishing replaces the lot.
 */
export async function previousRun(outDir: string, origin: string | undefined, fetcher: typeof fetch = fetch): Promise<Previous> {
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
    const host = new URL(origin).host;
    /** undefined for a file that isn't there; throws when the host can't say. */
    const get = async <T>(pathname: string): Promise<T | undefined> => {
      let response: Response;
      try {
        response = await fetcher(new URL(pathname, origin));
      } catch (error) {
        throw new Error(`the last run could not be read from ${host}: ${pathname}: ${error instanceof Error ? error.message : String(error)}`);
      }
      if (response.status === 404) return undefined;
      if (!response.ok) throw new Error(`the last run could not be read from ${host}: ${pathname}: HTTP ${response.status}`);
      return (await response.json()) as T;
    };
    const index = await get<IndexJson>(INDEX_PATH);
    return {
      index,
      from: index ? host : `nowhere: ${host} has not been published to, so this is a first run`,
      country: async (code) => {
        const file = await get<CountryFile>(countryPath(code));
        // The index and the country files are published together: one without the other is a broken site, not a new country.
        if (!file && index?.countries[code]) throw new Error(`the last run on ${host} lists ${code}, but ${countryPath(code)} is missing`);
        return file ? decodeCountry(file) : undefined;
      },
    };
  }
  return { index: undefined, from: 'nowhere: this is a first run', country: async () => undefined };
}

export interface Outcome {
  code: string;
  state: 'fresh' | 'kept' | 'missing';
  /** Why it isn't fresh. */
  reason?: string;
  stats?: CountryStats;
  seconds?: number;
}

const percent = (share: number): string => `${(share * 100).toFixed(1)} %`;
const kilobytes = (bytes: number): string => `${(bytes / 1024).toFixed(1)} KB`;

function report(outcomes: Outcome[], site: SiteSummary | undefined, previousFrom: string, attempt: string): string {
  const lines = [
    '## Pharmacy data',
    '',
    `${attempt} Compared with the last run from ${previousFrom}.`,
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

export interface Refresh {
  /** Every covered country, in the order of the coverage list. */
  all: Country[];
  /** The codes to refresh in this run. The others keep the data of the last run. */
  asked: string[];
  previous: Previous;
  /** One country's Overpass answer: fetched, or read from a saved file. Rejects when there is none. */
  getExtract: (country: Country) => Promise<CountryExtract>;
  /** How many fetch failures in a row end the asking. Infinity: never. */
  giveUpAfter?: number;
  log?: (line: string) => void;
}

/**
 * Refreshes the countries asked for, one after another, and keeps the data of the last run
 * for every other one and for each that can't be fetched or fails its check.
 */
export async function refreshCountries({ all, asked, previous, getExtract, giveUpAfter = GIVE_UP_AFTER_FAILURES, log = () => undefined }: Refresh): Promise<{ countries: CountryData[]; outcomes: Outcome[] }> {
  const countries: CountryData[] = [];
  const outcomes: Outcome[] = [];
  let failuresInARow = 0;

  for (const country of all) {
    const code = country.code;
    const wanted = asked.includes(code);
    let fresh: CountryData | undefined;
    let reason: string | undefined;
    let kept: CountryStats['kept'];
    const t0 = Date.now();

    if (wanted && failuresInARow >= giveUpAfter) {
      // Overpass is down, not this country's query: asking on would only add to its load and to our wait.
      reason = `not asked: Overpass did not answer for the ${giveUpAfter} countries before it`;
      kept = 'fetch';
    } else if (wanted) {
      let extract: CountryExtract | undefined;
      try {
        extract = await getExtract(country);
        failuresInARow = 0;
      } catch (error) {
        failuresInARow++;
        reason = `not fetched: ${error instanceof Error ? error.message : String(error)}`;
        kept = 'fetch';
      }
      if (extract) {
        const { data, dropped } = processCountry(country, extract);
        const verdict = check(data.stats, previous.index?.countries[code]);
        log(
          `${code}: ${data.stats.pharmacies} pharmacies (${dropped.duplicate} duplicates, ${dropped.private} private and ${dropped.noPosition} without a position left out), ` +
            `${percent(data.stats.shareWithHours)} with hours, parse rate ${percent(data.stats.parseRate)}`,
        );
        if (verdict.ok) fresh = data;
        else {
          reason = `failed its check: ${verdict.reason}`;
          kept = 'check';
        }
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
      const stats: CountryStats = wanted ? { ...old.stats, kept } : old.stats;
      countries.push({ ...old, stats });
      outcomes.push({ code, state: 'kept', stats, reason: reason ?? 'not asked for in this run' });
    } else {
      outcomes.push({ code, state: 'missing', reason: reason ?? 'not asked for, and no earlier data' });
    }
    if (reason) log(`${code}: ${reason}`);
  }

  return { countries, outcomes };
}

async function main(): Promise<number> {
  const options = readArguments(process.argv.slice(2));
  const contact = process.env.CONTACT_EMAIL;
  if (!options.cached && !contact) {
    console.error('CONTACT_EMAIL is not set. Overpass asks callers to identify themselves, so nothing was fetched. Put it in .env.local (see .env.example).');
    return 1;
  }

  const startedAt = Math.floor(Date.now() / 1000);
  const summary = process.env.GITHUB_STEP_SUMMARY;
  const output = process.env.GITHUB_OUTPUT;
  const previous = await previousRun(options.outDir, process.env.TILES_ORIGIN);

  let asked = options.codes;
  let attempt = 'First attempt.';
  if (options.retry) {
    asked = needsRetry(options.codes, previous.index, startedAt);
    if (asked.length === 0) {
      const text = 'Second attempt: nothing to do. The last run refreshed every country.';
      console.log(text);
      if (summary) fs.appendFileSync(summary, `## Pharmacy data\n\n${text}\n`);
      return 0;
    }
    attempt = `Second attempt, for the countries the last run could not refresh: ${asked.join(' ')}.`;
    console.log(attempt);
  }

  const deps: FetchDeps = {
    fetch,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    now: () => Math.floor(Date.now() / 1000),
    contact: contact ?? '',
    log: (line) => console.log(line),
  };

  let fetches = 0;
  const getExtract = async (country: Country): Promise<CountryExtract> => {
    const rawFile = path.join(RAW_DIR, `${country.code}.json`);
    if (options.cached) {
      if (!fs.existsSync(rawFile)) throw new Error(`no saved answer in ${rawFile}`);
      return JSON.parse(fs.readFileSync(rawFile, 'utf8')) as CountryExtract;
    }
    if (fetches++ > 0) await deps.sleep(PAUSE_BETWEEN_COUNTRIES_MS);
    const extract = await fetchCountry(country, deps);
    fs.mkdirSync(RAW_DIR, { recursive: true });
    fs.writeFileSync(rawFile, JSON.stringify(extract));
    return extract;
  };

  const { countries, outcomes } = await refreshCountries({
    all: COUNTRIES,
    asked,
    previous,
    getExtract,
    // A missing saved answer says nothing about Overpass.
    giveUpAfter: options.cached ? Infinity : GIVE_UP_AFTER_FAILURES,
    log: (line) => console.log(line),
  });

  const failed = outcomes.filter((outcome) => asked.includes(outcome.code) && outcome.state !== 'fresh');
  // For the workflow's last step, so that a failed run names its countries where the run is listed.
  if (output) fs.appendFileSync(output, `not_fresh=${failed.map((outcome) => outcome.code).join(' ')}\n`);

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

  const text = report(outcomes, site, previous.from, attempt);
  console.log(`\n${text}\n`);
  fs.writeFileSync(path.join(path.dirname(options.outDir), 'report.md'), `${text}\n`);
  if (summary) fs.appendFileSync(summary, `${text}\n`);
  if (output) fs.appendFileSync(output, 'written=true\n');

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
