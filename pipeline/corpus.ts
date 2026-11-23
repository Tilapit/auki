/**
 * `npm run data:corpus`: pins the distinct opening_hours values of every country, from the
 * Overpass answers of the last run (.data/raw), into data/corpus/. CI parses every one of
 * them on each push (tests/unit/corpus.test.ts), so a change that lowers the parse rate
 * can't go unnoticed (PLAN.md section 12).
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { COUNTRIES } from './countries.ts';
import type { Country } from './countries.ts';
import type { CountryExtract } from './fetch.ts';
import { computeHours, windowFor } from './hours.ts';
import { normalize } from './normalize.ts';

export const CORPUS_DIR = 'data/corpus';

export interface CorpusFile {
  country: string;
  /** The date of the OpenStreetMap data, as Overpass reported it. */
  osmBase?: string;
  /** Each distinct value and how many pharmacies carry it, most common first. */
  values: [string, number][];
}

export interface CorpusCounts {
  /** Distinct values. */
  values: number;
  /** Pharmacies that carry one. */
  withHours: number;
  parsed: number;
  unparseable: number;
  uncertain: number;
  corrected: number;
  /** parsed / withHours, as the pipeline counts it. */
  parseRate: number;
}

export interface CorpusExpected {
  /** The instant the values are evaluated at: holidays and the window depend on it. */
  at: number;
  countries: Record<string, CorpusCounts>;
}

/** Where holidays differ by state, the corpus is read as in the country's first state. */
export const corpusState = (country: Country): string | undefined => (country.states ? Object.keys(country.states)[0] : undefined);

export function countCorpus(country: Country, file: CorpusFile, at: number, each?: (value: string, result: ReturnType<typeof computeHours>) => void): CorpusCounts {
  const window = windowFor(country.zone, at);
  const state = corpusState(country);
  const counts = { values: file.values.length, withHours: 0, parsed: 0, unparseable: 0, uncertain: 0, corrected: 0, parseRate: 0 };
  for (const [value, pharmacies] of file.values) {
    const result = computeHours(value, { country, state, window });
    each?.(value, result);
    counts.withHours += pharmacies;
    if (result.hours.kind === 'parsed') {
      counts.parsed += pharmacies;
      if (result.corrected) counts.corrected += pharmacies;
    } else if (result.hours.kind === 'unparseable') counts.unparseable += pharmacies;
    else if (result.hours.kind === 'uncertain') counts.uncertain += pharmacies;
  }
  counts.parseRate = counts.withHours === 0 ? 0 : Math.round((counts.parsed / counts.withHours) * 10000) / 10000;
  return counts;
}

function main(): void {
  const expected: CorpusExpected = { at: 0, countries: {} };
  fs.mkdirSync(CORPUS_DIR, { recursive: true });
  const lines = ['| Country | Distinct values | Pharmacies with hours | Parse rate | Corrected | Unparseable | Uncertain |', '|---|---:|---:|---:|---:|---:|---:|'];

  for (const country of COUNTRIES) {
    const rawFile = path.join('.data/raw', `${country.code}.json`);
    if (!fs.existsSync(rawFile)) {
      console.error(`${country.code}: no saved answer in ${rawFile}. Run "npm run data" first.`);
      process.exitCode = 1;
      continue;
    }
    const extract = JSON.parse(fs.readFileSync(rawFile, 'utf8')) as CountryExtract;
    // The same pharmacies the pipeline publishes: private ones and duplicates are left out.
    const tally = new Map<string, number>();
    for (const pharmacy of normalize(extract, country).pharmacies) {
      if (pharmacy.openingHours) tally.set(pharmacy.openingHours, (tally.get(pharmacy.openingHours) ?? 0) + 1);
    }
    const values = [...tally].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
    const file: CorpusFile = { country: country.code, osmBase: extract.osmBase, values };
    fs.writeFileSync(path.join(CORPUS_DIR, `${country.code}.json`), `${JSON.stringify(file, null, 0).replace(/\],\[/g, '],\n[')}\n`);

    // One instant for all: the latest fetch, so every country's window is the real one or later.
    expected.at = Math.max(expected.at, extract.fetched);
  }
  for (const country of COUNTRIES) {
    const file = path.join(CORPUS_DIR, `${country.code}.json`);
    if (!fs.existsSync(file)) continue;
    const counts = countCorpus(country, JSON.parse(fs.readFileSync(file, 'utf8')) as CorpusFile, expected.at);
    expected.countries[country.code] = counts;
    lines.push(`| ${country.code} | ${counts.values} | ${counts.withHours} | ${(counts.parseRate * 100).toFixed(1)} % | ${counts.corrected} | ${counts.unparseable} | ${counts.uncertain} |`);
  }
  fs.writeFileSync(path.join(CORPUS_DIR, 'expected.json'), `${JSON.stringify(expected, null, 1)}\n`);
  console.log(lines.join('\n'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
