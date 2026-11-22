import type { I18n } from './i18n';
import type { GlyphState, OpenStatus, Pharmacy } from './types';

type Opening = NonNullable<Extract<OpenStatus, { kind: 'closed' }>['opens']>;

/** Which of the four glyph shapes a status gets. Shape, not colour, carries the state. */
export function glyphFor(status: OpenStatus): GlyphState {
  switch (status.kind) {
    case 'open':
    case 'open24':
      return 'open';
    case 'soon':
      return 'soon';
    case 'closed':
      return 'closed';
    default:
      return 'unknown';
  }
}

export type StatusTone = 'open' | 'soon' | 'muted';

export function toneFor(status: OpenStatus): StatusTone {
  if (status.kind === 'open' || status.kind === 'open24') return 'open';
  if (status.kind === 'soon' || status.kind === 'uncertain') return 'soon';
  return 'muted';
}

export const isOpenNow = (status: OpenStatus): boolean => glyphFor(status) === 'open' || glyphFor(status) === 'soon';

/** When a closed pharmacy opens: "klo 9", "huomenna klo 9", "ma klo 9". */
export function opensWhen({ t, f }: I18n, opens: Opening): string {
  const time = f.clockShort(opens.time);
  if (opens.day === 'today') return time;
  if (opens.day === 'tomorrow') return t.status.tomorrow(time);
  return t.status.onDay(t.status.weekdays[opens.day], time);
}

export function statusText(i18n: I18n, status: OpenStatus): string {
  const { t, f } = i18n;
  switch (status.kind) {
    case 'open':
      return t.status.openUntil(f.clockShort(status.closes));
    case 'soon':
      return t.status.closesSoon(f.clockShort(status.closes));
    case 'open24':
      return t.status.open24;
    case 'closed':
      return status.opens ? t.status.closedOpens(opensWhen(i18n, status.opens)) : t.status.closed;
    case 'missing':
      return t.status.missing;
    case 'unparseable':
      return t.status.unparseable(status.raw);
    case 'uncertain':
      return t.status.uncertain(status.raw);
  }
}

export const displayName = ({ t }: I18n, pharmacy: Pharmacy): string => pharmacy.name ?? t.app.fallbackName;

/** Name plus street, for labels where the street tells same-named pharmacies apart. */
export function fullName(i18n: I18n, pharmacy: Pharmacy, withStreet: boolean): string {
  const name = displayName(i18n, pharmacy);
  return withStreet && pharmacy.street ? `${name}, ${pharmacy.street}` : name;
}
