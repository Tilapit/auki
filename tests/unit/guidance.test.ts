import { describe, expect, it } from 'vitest';
import { HOMES } from '@/data/countries';
import { HOME_CODES } from '@/data/countries/codes';

/**
 * The first load has the codes of the home countries and nothing else of data/countries/
 * (lib/guidance.ts): the names and the guidance come when a prescription's country is not the
 * pharmacy's. The two lists are written out twice, so they are held equal here.
 */
describe('the home countries the first load knows', () => {
  it('are the ones the guidance has, in the same order', () => {
    expect(HOME_CODES).toEqual(HOMES.map((home) => home.code));
  });
});
