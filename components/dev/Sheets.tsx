'use client';

import type { ReactNode } from 'react';
import { HERE, guideFor } from '@/data/countries';
import { helsinki } from '@/lib/fixtures/helsinki';
import { useI18n } from '@/lib/i18n/context';
import { travel } from '@/lib/travel';
import { latvia, riga } from '@/lib/fixtures/riga';
import { stress } from '@/lib/fixtures/stress';
import type { Ehditko, OpenStatus as Status, Pharmacy } from '@/lib/types';
import { Button, IconButton } from '../Button';
import { BannerFor } from '../CountryBanner';
import { CrossGlyph } from '../CrossGlyph';
import { MapMarker, YouAreHere } from '../MapMarker';
import { NearestOpenCard } from '../NearestOpenCard';
import { OpenStatus } from '../OpenStatus';
import styles from './Sheets.module.css';

/*
 * Review sheets for /dev/states: components outside a full screen.
 * Captions are developer notes in English, not UI copy.
 */

/** A page of its own: it has the one h1 every page has. */
function Sheet({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className={styles.sheet}>
      <h1 className={styles.caption}>{title}</h1>
      {children}
    </main>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.block}>
      <h2 className={styles.caption}>{title}</h2>
      {children}
    </section>
  );
}

const byId = (id: string) => helsinki.pharmacies.find((p) => p.id === id) as Pharmacy;
const toolon = byId('toolon');
const yliopiston = byId('yliopiston');
const kampin = byId('kampin');
const kaartin = byId('kaartin');
const marijas = riga.pharmacies.find((p) => p.id === 'marijas') as Pharmacy;

const STATUSES: Status[] = [
  { kind: 'open', closes: '21:00' },
  { kind: 'open', closes: '24:00' },
  { kind: 'soon', closes: '17:45' },
  { kind: 'open24' },
  { kind: 'closed', opens: { day: 'tomorrow', time: '09:00' } },
  { kind: 'closed', opens: { day: 'today', time: '14:00' } },
  { kind: 'closed', opens: { day: 'mo', time: '08:30' } },
  { kind: 'closed' },
  { kind: 'missing' },
  { kind: 'unparseable', raw: 'soita ja kysy' },
  { kind: 'uncertain', raw: 'kesällä lyhyemmin' },
];

export function ComponentSheet() {
  const i18n = useI18n();
  // Named as on the map, in short: a marker that shows a time has it in its name (WCAG 2.5.3).
  const named = (state: string, pharmacy: Pharmacy) => `${state}: ${travel(i18n, pharmacy, 'walking').primary.long}`;
  return (
    <Sheet title="Components outside a full screen">
      <Block title="CrossGlyph: open, soon, closed, unknown (15, 20, 24 px)">
        {[15, 20, 24].map((size) => (
          <div key={size} className={styles.row}>
            {(['open', 'soon', 'closed', 'unknown'] as const).map((state) => (
              <CrossGlyph key={state} state={state} size={size} />
            ))}
          </div>
        ))}
      </Block>

      <Block title="Status lines (copy table, PLAN.md section 6)">
        {STATUSES.map((status, index) => (
          <OpenStatus key={index} status={status} />
        ))}
      </Block>

      <Block title="Buttons">
        <div className={styles.row}>
          <Button variant="primary" icon="walk">
            Reitti
          </Button>
          <Button icon="phone">Soita</Button>
          <Button icon="card">Näytä apteekissa</Button>
        </div>
        <div className={styles.row}>
          <Button trailing="chevron">Kaikki 8 apteekkia</Button>
          <IconButton icon="refresh" label="Päivitä" />
          <IconButton icon="close" label="Sulje" variant="quiet" />
        </div>
        <Button variant="primary" size="block" icon="walk" trailing="external">
          Reitti Google Mapsissa
        </Button>
        <Button size="block" icon="walk" trailing="external">
          Reitti Apple Kartoissa
        </Button>
        <div className={styles.dusk}>
          <Button variant="dusk" size="lg">
            Näytä apteekit lähelläni
          </Button>
          <Button variant="duskText">Hae paikan nimellä</Button>
        </div>
      </Block>

      <Block title="Map markers: open, closing, closed, unknown; then selected">
        <div className={styles.land}>
          <MapMarker pharmacy={yliopiston} distance="walking" label={named('open', yliopiston)} />
          <MapMarker pharmacy={toolon} distance="walking" label={named('soon', toolon)} />
          <MapMarker pharmacy={kampin} distance="walking" label="closed" />
          <MapMarker pharmacy={kaartin} distance="walking" label="unknown" />
          <span className={styles.youSlot}>
            <YouAreHere />
          </span>
        </div>
        <div className={styles.land}>
          <MapMarker pharmacy={yliopiston} distance="walking" label={named('open', yliopiston)} selected />
          <MapMarker pharmacy={toolon} distance="walking" label={named('soon', toolon)} selected />
          <MapMarker pharmacy={kampin} distance="walking" label="closed" selected />
          <MapMarker pharmacy={kaartin} distance="walking" label="unknown" selected />
        </div>
      </Block>
    </Sheet>
  );
}

const timeline: Ehditko = { kind: 'timeline', arrive: '20:44', closes: '21:00', slackMin: 16 };
const lateToolon: Pharmacy = { ...toolon, status: { kind: 'soon', closes: '20:45' }, walkMin: 6, walkMeters: 480 };
const farYliopiston: Pharmacy = { ...yliopiston, walkMin: 9, walkMeters: 750 };
const tightToolon: Pharmacy = { ...toolon, walkMin: 16, walkMeters: 1280 };
const tight: Ehditko = { kind: 'timeline', arrive: '20:57', closes: '21:00', slackMin: 3 };
const farToolon: Pharmacy = { ...toolon, walkMin: 30, walkMeters: 2400 };

/**
 * "Lähin auki nyt" in each of its cases, one to a page. The card is a landmark with a name,
 * and a page that showed it eight times had eight landmarks by one name: no page of the app
 * has two.
 */
export const CARD_CASES: Record<string, { title: string; card: () => ReactNode }> = {
  timeline: {
    title: '1. Closes within the hour: timeline',
    card: () => <NearestOpenCard pharmacy={toolon} distance="walking" ehditko={timeline} nextOpen={yliopiston} />,
  },
  tight: {
    title: '1b. Tight slack: under 5 min',
    card: () => <NearestOpenCard pharmacy={tightToolon} distance="walking" ehditko={tight} />,
  },
  'tight-far': {
    title: '1c. Tight slack: under a fifth of the walk (5 min after a 30 min walk)',
    card: () => <NearestOpenCard pharmacy={farToolon} distance="walking" ehditko={{ kind: 'timeline', arrive: '20:55', closes: '21:00', slackMin: 5 }} />,
  },
  late: {
    title: '2. Arrival after closing: the closing one keeps Soita, the next open one has the main actions',
    card: () => <NearestOpenCard pharmacy={lateToolon} distance="walking" ehditko={{ kind: 'tooLate', arrive: '20:47', closes: '20:45' }} nextOpen={farYliopiston} />,
  },
  later: {
    title: '3. Closes later: status line only',
    card: () => <NearestOpenCard pharmacy={yliopiston} distance="walking" ehditko={{ kind: 'none' }} />,
  },
  abroad: {
    title: '4. Open 24 hours, abroad, nearer ones closed, no phone number',
    card: () => (
      <NearestOpenCard
        pharmacy={marijas}
        distance="walking"
        ehditko={{ kind: 'none' }}
        nextOpen={riga.farOpen}
        nextOpenWithStreet
        closerClosed={9}
        closedOpens={riga.closedOpens}
        country={latvia}
      >
        <BannerFor home="FI" here="LV" />
      </NearestOpenCard>
    ),
  },
  long: {
    title: '5. Long name, three actions, no prescriptions',
    card: () => <NearestOpenCard pharmacy={{ ...stress.pharmacies[3], dispensing: false }} distance="walking" ehditko={{ kind: 'none' }} country={latvia} />,
  },
  straight: {
    title: '6. Straight-line fallback: metres lead, no timeline',
    card: () => <NearestOpenCard pharmacy={{ ...toolon, walkMin: undefined, walkMeters: undefined }} distance="straight" ehditko={{ kind: 'none' }} />,
  },
};

export function CardCase({ id }: { id: keyof typeof CARD_CASES }) {
  const { title, card } = CARD_CASES[id];
  return <Sheet title={title}>{card()}</Sheet>;
}

/** A counter card's lines as plain text, each variant under its name. */
function CardLines({ home, here }: { home: string; here: string }) {
  const card = guideFor(home, here)?.card;
  if (!card) return null;
  return (
    <>
      {Object.entries(card.variants).map(([variant, lines]) => (
        <p key={variant} lang={card.lang} className={styles.lines}>
          <span lang="en" className={styles.caption}>
            {variant}
          </span>
          {lines.local.join(' ')}
        </p>
      ))}
      <p lang={card.lang} className={styles.lines}>
        <span lang="en" className={styles.caption}>
          pharmacist
        </span>
        {card.pharmacist.local}
      </p>
    </>
  );
}

/** Pairs that show each kind of answer the banner can give, beyond a prescription from Finland. */
const VISITORS: { home: string | null; here: string; what: string }[] = [
  { home: 'EE', here: 'FI', what: 'Estonia to Finland: both countries list each other' },
  { home: 'DE', here: 'FI', what: 'Germany to Finland: not on Finland’s list; paper recognised, with Finland’s own conditions' },
  { home: 'CH', here: 'FI', what: 'Switzerland to Finland: outside the EU rule, and Finland takes the paper prescription' },
  { home: 'GB', here: 'FI', what: 'United Kingdom to Finland: Finland says it takes none from outside the EU, the EEA and Switzerland' },
  { home: 'DE', here: 'LV', what: 'Germany to Latvia: not on Latvia’s list' },
  { home: 'PT', here: 'CZ', what: 'Portugal to Czechia: works one way (Czechia to Portugal does not)' },
  { home: 'CZ', here: 'PT', what: 'Czechia to Portugal: the other way, on neither list' },
  { home: 'CZ', here: 'HR', what: 'Czechia to Croatia: on Czechia’s page; Croatia’s own notice is from 2022' },
  { home: 'ES', here: 'AT', what: 'Spain to Austria: on Spain’s page only, Austria’s own was not read' },
  { home: 'FR', here: 'IT', what: 'France to Italy: nothing official found for the electronic prescription' },
  { home: 'NO', here: 'EE', what: 'Norway to Estonia: Norway says its prescription needs paper abroad' },
  { home: 'EE', here: 'SE', what: 'Estonia to Sweden: Sweden takes no e-prescription from abroad' },
  { home: 'DE', here: 'CH', what: 'Germany to Switzerland: outside the EU rule' },
  { home: 'CH', here: 'DE', what: 'Switzerland to Germany: outside the EU rule, the other way' },
  { home: 'XX', here: 'IT', what: 'Another country to Italy: nothing official found' },
  { home: null, here: 'LV', what: 'No country suggested by the device: the banner asks' },
];

/**
 * The prescription guidance for reading through in one place (data/countries/): for every
 * country one can be in, the banner for a prescription from Finland (in Finland, from Estonia)
 * with its details open, and the counter card's lines as plain text. Then pairs that show each
 * kind of answer. The whole matrix is in docs/research/prescriptions-across-borders.md.
 */
export function AbroadSheet() {
  return (
    <Sheet title="Prescriptions across borders: each country's banner and counter-card lines">
      {HERE.map((place) => {
        const home = place.code === 'FI' ? 'EE' : 'FI';
        const card = guideFor(home, place.code)!.card;
        return (
          <Block key={place.code} title={`${place.code}, a prescription from ${home}: banner, then the card ${place.inLanguage.en}${card.reviewed ? '' : ' (unreviewed)'}`}>
            <BannerFor home={home} here={place.code} open />
            <CardLines home={home} here={place.code} />
          </Block>
        );
      })}
      {VISITORS.map(({ home, here, what }) => (
        <Block key={`${home}-${here}`} title={what}>
          <BannerFor home={home} here={here} />
          {home && <CardLines home={home} here={here} />}
        </Block>
      ))}
    </Sheet>
  );
}
