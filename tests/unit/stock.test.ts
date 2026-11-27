import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COUNTRY_CODES } from '@/lib/countries';
import { EXAMPLE_ANSWER, exampleProvider } from '@/lib/fixtures/stock';
import { getDictionary, locales } from '@/lib/i18n';
import { MEDICINE_MAX_LENGTH, medicineText } from '@/lib/stock/provider';
import { AWAITING_AGREEMENT, PROVIDERS, providerFor, providerForReview } from '@/lib/stock/providers';

/** A name no medicine has, with everything an address has to carry safely: a space, letters outside ASCII, and the characters that mean something in a URL. */
const NAME = 'Zzyx-Koevalmiste 12 mg/ml & ä?#+%';

/** Those the app offers, and those that are ready and wait for an agreement: the same rules hold for both. */
const ALL = [...PROVIDERS, ...AWAITING_AGREEMENT];

/** Where a name is in an address, whichever way the provider writes it: a query value, a part of the path, or the fragment. */
function carried(url: string): string[] {
  const { searchParams, pathname, hash } = new URL(url);
  return [...searchParams.values(), ...pathname.split('/').map((part) => decodeURIComponent(part)), decodeURIComponent(hash.slice(1))];
}

describe('the medicine name as it goes into a link', () => {
  it('is what was typed: trimmed, with single spaces, never corrected', () => {
    expect(medicineText('  Zzyx   Koevalmiste\t12 mg ')).toBe('Zzyx Koevalmiste 12 mg');
    expect(medicineText('ÄÖ å')).toBe('ÄÖ å');
  });

  it('is nothing when nothing was typed', () => {
    for (const empty of [undefined, '', '   ', '\n\t']) expect(medicineText(empty)).toBeUndefined();
  });

  it('drops control characters and is cut to a length no product name needs', () => {
    expect(medicineText('a\u0000b\u007fc')).toBe('a b c');
    expect(medicineText('x'.repeat(500))).toHaveLength(MEDICINE_MAX_LENGTH);
  });
});

describe('the countries\' own stock searches', () => {
  it('one provider per country, each for a country the app covers', () => {
    const countries = ALL.map((provider) => provider.country);
    expect(new Set(countries).size).toBe(countries.length);
    for (const country of countries) expect(COUNTRY_CODES as readonly string[], country).toContain(country);
    for (const provider of PROVIDERS) expect(providerFor(provider.country)).toBe(provider);
  });

  it('a country without one gets nothing', () => {
    // Denmark's lookup is in an app, behind the Danish e-ID, for one's own prescriptions: nothing to hand over to.
    for (const country of ['LV', 'DK', undefined]) expect(providerFor(country)).toBeUndefined();
    // Nine of the ten countries of 27 Nov 2026: no national stock search for the public was found, and no page worth a link in its place.
    for (const country of ['BE', 'BG', 'CY', 'FR', 'IE', 'LU', 'NL', 'RO', 'LI']) expect(providerFor(country), country).toBeUndefined();
  });

  it('where an authority says that nobody has the stock in view, the link is its page of advice: no name, and no coverage claimed', () => {
    // Iceland, in Norway's form. The page is not a stock search, so the dialog must not say which pharmacies take part in it.
    const iceland = providerFor('IS');
    expect(iceland?.takesMedicine).toBe(false);
    expect(iceland?.coverage).toBeUndefined();
    expect(iceland?.handoff({ medicine: NAME })).toEqual({ url: 'https://island.is/en/medicine-shortages-and-remedies-for-patients', withMedicine: false });
  });

  it('a provider that waits for its operator\'s agreement is not offered, and /dev/states can still show it', () => {
    expect(AWAITING_AGREEMENT.map((provider) => provider.country)).toEqual(['SE']);
    for (const provider of AWAITING_AGREEMENT) {
      expect(PROVIDERS.map((offered) => offered.country)).not.toContain(provider.country);
      expect(providerFor(provider.country)).toBeUndefined();
      expect(providerForReview(provider.country)).toBe(provider);
    }
    for (const provider of PROVIDERS) expect(providerForReview(provider.country)).toBe(provider);
  });

  it.each(ALL.map((provider) => [provider.country, provider] as const))('%s: without a name the link opens the service itself, on its own host, over https', (_, provider) => {
    for (const handoff of [provider.handoff(), provider.handoff({}), provider.handoff({ medicine: '   ' })]) {
      const url = new URL(handoff.url);
      expect(url.protocol).toBe('https:');
      expect(provider.hosts).toContain(url.host);
      expect(handoff.withMedicine).toBe(false);
      expect(url.username + url.password).toBe('');
    }
  });

  it.each(ALL.map((provider) => [provider.country, provider] as const))('%s: with a name the link carries it exactly, or not at all', (_, provider) => {
    const plain = provider.handoff();
    const handoff = provider.handoff({ medicine: `  ${NAME} ` });
    const url = new URL(handoff.url);
    expect(url.protocol).toBe('https:');
    expect(provider.hosts).toContain(url.host);
    expect(handoff.withMedicine).toBe(provider.takesMedicine);
    if (provider.takesMedicine) {
      // Whatever the characters, the service reads back what was typed, and the address is still the service's own.
      expect(carried(handoff.url)).toContain(NAME);
      expect(url.host).toBe(new URL(plain.url).host);
    } else {
      // A service whose address takes no name is never sent one.
      expect(handoff.url).toBe(plain.url);
      expect(handoff.url).not.toContain('Zzyx');
    }
  });

  it('none of them fetches stock: the seam is empty in the live app', () => {
    for (const provider of ALL) expect(provider.stock, provider.country).toBeUndefined();
  });

  it('each one was checked on a date, and has its texts in both languages', () => {
    for (const provider of ALL) {
      expect(provider.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const locale of locales) {
        const services: Record<string, { site: string; intro: string; open: string }> = getDictionary(locale).medicine.services;
        const copy = services[provider.id];
        expect(copy, `${provider.id} in ${locale}`).toBeDefined();
        // The host the texts name is one the link leads to.
        expect(provider.hosts.map((host) => host.replace(/^www\./, ''))).toContain(copy.site);
        expect(copy.open).toContain(copy.site);
        expect(copy.intro.length).toBeGreaterThan(20);
      }
    }
    // And no texts for a service that is not offered.
    for (const locale of locales) expect(Object.keys(getDictionary(locale).medicine.services).sort()).toEqual(ALL.map((provider) => provider.id).sort());
  });
});

describe('the example of live stock', () => {
  it('answers through the provider interface, for the pharmacies asked about and no others', async () => {
    const asked = [{ id: 'toolon', lat: 60.1677, lon: 24.9293, name: 'Töölön apteekki' }, { id: 'elsewhere', lat: 60, lon: 25, name: null }];
    const answer = await exampleProvider.stock?.({ medicine: 'Esimerkkivalmiste', pharmacies: asked }, new AbortController().signal);
    expect(answer?.product).toBe(EXAMPLE_ANSWER.product);
    expect(answer?.lines).toEqual([{ pharmacyId: 'toolon', level: 'inStock' }]);
  });

  it('is not part of the live app: only /dev/states and the tests read it', () => {
    const files = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? files(join(dir, entry.name)) : /\.(ts|tsx)$/.test(entry.name) ? [join(dir, entry.name)] : []));
    const allowed = (file: string) => file.startsWith(join('components', 'dev')) || file.startsWith(join('lib', 'dev')) || file.startsWith(join('lib', 'fixtures'));
    const offenders = ['app', 'components', 'hooks', 'lib']
      .flatMap(files)
      .filter((file) => !allowed(file))
      .filter((file) => /fixtures\/stock|dev\/StockExample/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
