import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { COUNTRIES } from '@/pipeline/countries';
import { CORPUS_DIR, countCorpus } from '@/pipeline/corpus';
import type { CorpusExpected, CorpusFile } from '@/pipeline/corpus';
import { windowFor } from '@/pipeline/hours';

/**
 * Is the parsing right (PLAN.md section 12)? Every distinct opening_hours value of every
 * covered country, pinned in data/corpus/ by `npm run data:corpus`, goes through the hours
 * step. The counts must be the pinned ones: a change that parses fewer values, or more,
 * shows up here and in the diff of expected.json.
 */
const root = path.join(__dirname, '../..', CORPUS_DIR);
const expected = JSON.parse(fs.readFileSync(path.join(root, 'expected.json'), 'utf8')) as CorpusExpected;

describe('the opening-hours corpus', () => {
  it('has a file for every covered country', () => {
    expect(Object.keys(expected.countries).sort()).toEqual(COUNTRIES.map((country) => country.code).sort());
  });

  it.each(COUNTRIES.map((country) => [country.code, country] as const))('%s: no value throws, intervals are sound, and the counts are the pinned ones', (code, country) => {
    const file = JSON.parse(fs.readFileSync(path.join(root, `${code}.json`), 'utf8')) as CorpusFile;
    const window = windowFor(country.zone, expected.at);
    const counts = countCorpus(country, file, expected.at, (value, result) => {
      const hours = result.hours;
      expect(['parsed', 'unparseable', 'uncertain'], value).toContain(hours.kind);
      if (hours.kind !== 'parsed') return;
      for (const list of [hours.open, hours.unknown]) {
        let last = window.from - 1;
        for (const interval of list) {
          // Sorted, apart from each other, and inside the window.
          if (!(interval.from > last && interval.to > interval.from && interval.to <= window.until)) {
            throw new Error(`"${value}" gives an interval out of order or outside the window`);
          }
          last = interval.to;
        }
      }
    });
    expect(counts).toEqual(expected.countries[code]);
  });
});
