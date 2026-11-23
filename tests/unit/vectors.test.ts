import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildVectors, serialize } from '@/tests/vectors/make';

/**
 * tests/vectors/ holds cases with their answers, for the Swift implementation to be checked
 * against. They are generated from this code with a fixed seed. If the code changes what it
 * answers, this fails until `npm run vectors` has written the files again, and the change
 * shows up in the pull request as a diff of the answers.
 */
describe('shared test vectors', () => {
  const vectors = buildVectors();

  it.each(Object.keys(vectors))('%s is what the code answers today', (name) => {
    const file = path.join(__dirname, '../vectors', name);
    expect(fs.existsSync(file), `${name} is missing: run "npm run vectors"`).toBe(true);
    expect(fs.readFileSync(file, 'utf8')).toBe(serialize(vectors[name]));
  });

  it('covers every kind of status', () => {
    const { cases } = vectors['status.json'] as { cases: { status: { kind: string } }[] };
    const kinds = new Set(cases.map((entry) => entry.status.kind));
    expect([...kinds].sort()).toEqual(['closed', 'missing', 'open', 'open24', 'soon', 'stale', 'uncertain', 'unparseable']);
  });
});
