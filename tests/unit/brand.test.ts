import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

// The name is one constant (PLAN.md, decision D4). Swap it and everything that shows the name follows.
vi.mock('@/lib/brand', () => ({ BRAND: 'Zzyzx' }));

describe('the product name comes from lib/brand.ts', () => {
  it('reaches the dictionaries in both languages', async () => {
    const { getDictionary } = await import('@/lib/i18n');
    for (const locale of ['fi', 'en'] as const) {
      const t = getDictionary(locale);
      expect(t.app.name).toBe('Zzyzx');
      expect(t.meta.title.startsWith('Zzyzx: ')).toBe(true);
    }
  });

  it('is not written out in the app, the components or the hooks', async () => {
    const { BRAND } = await vi.importActual<typeof import('@/lib/brand')>('@/lib/brand');
    const files = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? files(join(dir, entry.name)) : /\.(ts|tsx|css)$/.test(entry.name) ? [join(dir, entry.name)] : [],
      );
    // Every string lives in lib/i18n, so the name as a word has no business in these folders.
    const word = new RegExp(`\\b${BRAND}\\b`);
    const offenders = ['app', 'components', 'hooks'].flatMap(files).filter((file) => word.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('reaches the page title', async () => {
    const { siteMetadata } = await import('@/lib/metadata');
    expect(siteMetadata('fi').title).toBe('Zzyzx: lähin auki oleva apteekki');
    expect(siteMetadata('en').title).toBe('Zzyzx: the nearest open pharmacy');
  });

  it('reaches the User-Agent our server sends', async () => {
    const { userAgent } = await import('@/lib/server/geocode');
    expect(userAgent('contact@example.org')).toBe('zzyzx-pharmacy-finder/0.1 (contact@example.org)');
  });
});
