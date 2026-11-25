'use client';

import type { ReactNode } from 'react';
import { GUIDES, abroadFor } from '@/data/countries';
import { helsinki } from '@/lib/fixtures/helsinki';
import { latvia, riga } from '@/lib/fixtures/riga';
import { stress } from '@/lib/fixtures/stress';
import type { Ehditko, OpenStatus as Status, Pharmacy } from '@/lib/types';
import { Button, IconButton } from '../Button';
import { CountryBanner } from '../CountryBanner';
import { CrossGlyph } from '../CrossGlyph';
import { MapMarker, YouAreHere } from '../MapMarker';
import { NearestOpenCard } from '../NearestOpenCard';
import { OpenStatus } from '../OpenStatus';
import styles from './Sheets.module.css';

/*
 * Review sheets for /dev/states: components outside a full screen.
 * Captions are developer notes in English, not UI copy.
 */

function Sheet({ children }: { children: ReactNode }) {
  return <main className={styles.sheet}>{children}</main>;
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
  return (
    <Sheet>
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
          <MapMarker pharmacy={yliopiston} distance="walking" label="open" />
          <MapMarker pharmacy={toolon} distance="walking" label="soon" />
          <MapMarker pharmacy={kampin} distance="walking" label="closed" />
          <MapMarker pharmacy={kaartin} distance="walking" label="unknown" />
          <span className={styles.youSlot}>
            <YouAreHere />
          </span>
        </div>
        <div className={styles.land}>
          <MapMarker pharmacy={yliopiston} distance="walking" label="open" selected />
          <MapMarker pharmacy={toolon} distance="walking" label="soon" selected />
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

export function CardCases() {
  return (
    <Sheet>
      <Block title="1. Closes within the hour: timeline">
        <NearestOpenCard pharmacy={toolon} distance="walking" ehditko={timeline} nextOpen={yliopiston} />
      </Block>
      <Block title="1b. Tight slack: under 5 min, or under a fifth of the walk (5 min after a 30 min walk)">
        <NearestOpenCard pharmacy={tightToolon} distance="walking" ehditko={tight} />
        <NearestOpenCard pharmacy={farToolon} distance="walking" ehditko={{ kind: 'timeline', arrive: '20:55', closes: '21:00', slackMin: 5 }} />
      </Block>
      <Block title="2. Arrival after closing: the closing one keeps Soita, the next open one has the main actions">
        <NearestOpenCard
          pharmacy={lateToolon}
          distance="walking"
          ehditko={{ kind: 'tooLate', arrive: '20:47', closes: '20:45' }}
          nextOpen={farYliopiston}
        />
      </Block>
      <Block title="3. Closes later: status line only">
        <NearestOpenCard pharmacy={yliopiston} distance="walking" ehditko={{ kind: 'none' }} />
      </Block>
      <Block title="4. Open 24 hours, abroad, nearer ones closed, no phone number">
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
          <CountryBanner country={latvia} />
        </NearestOpenCard>
      </Block>
      <Block title="5. Long name, three actions, no prescriptions">
        <NearestOpenCard
          pharmacy={{ ...stress.pharmacies[3], dispensing: false }}
          distance="walking"
          ehditko={{ kind: 'none' }}
          country={latvia}
        />
      </Block>
      <Block title="6. Straight-line fallback: metres lead, no timeline">
        <NearestOpenCard pharmacy={{ ...toolon, walkMin: undefined, walkMeters: undefined }} distance="straight" ehditko={{ kind: 'none' }} />
      </Block>
    </Sheet>
  );
}

/**
 * Every country's banner as the card shows it, and its counter card's lines as plain text:
 * for reading the texts of data/countries/ through in one place. The cards themselves are
 * the "counter" views.
 */
export function AbroadSheet() {
  return (
    <Sheet>
      {GUIDES.map((guide) => {
        const { country, card } = abroadFor(guide.code)!;
        return (
          <Block key={guide.code} title={`${guide.code}: banner, then the card ${country.inLanguage.en}${card.reviewed ? '' : ' (unreviewed)'}`}>
            <CountryBanner country={country} />
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
          </Block>
        );
      })}
    </Sheet>
  );
}
