/**
 * The hand-off link (PLAN.md 7.8): another app opens this one with what it already knows,
 *
 *   https://<host>/fi#country=LV&rx=e
 *
 * - `rx`: the prescription's format, `e` (electronic) or `p` (paper). The banner leads with
 *   that format's answer and the counter card opens on it.
 * - `country`: the country the sender believes the user is in. A place search takes the answer
 *   in that country first. Once pharmacies are found, their country is the one that counts.
 *
 * Both ride in the fragment, which a browser sends to no server: they are read here, on the
 * device, and go into no request, no storage and no log (PLAN.md 7.6). Names and values this
 * file does not know are passed over. Nothing in a link identifies the user, the prescription
 * or the medicine, and there is no parameter for a position.
 *
 * Pure: the window is read in hooks/useHandoff.ts.
 */

export type Rx = 'e' | 'p';

export interface Handoff {
  /** ISO 3166-1 alpha-2, upper case. Any two letters: one that is no country matches no place. */
  country?: string;
  rx?: Rx;
}

/** What a link without the parameters says: nothing. One object, so that a reader of it never sees a change where there is none. */
export const NO_HANDOFF: Handoff = Object.freeze({});

/** Reads a fragment, with or without its `#`. Of a name given twice, the first counts. */
export function readHandoff(fragment: string): Handoff {
  const params = new URLSearchParams(fragment.replace(/^#/, ''));
  const country = params.get('country') ?? '';
  const rx = (params.get('rx') ?? '').toLowerCase();
  const handoff: Handoff = {
    ...(/^[a-z]{2}$/i.test(country) ? { country: country.toUpperCase() } : {}),
    ...(rx === 'e' || rx === 'p' ? { rx } : {}),
  };
  return handoff.country || handoff.rx ? handoff : NO_HANDOFF;
}

/** The fragment a link to another page of ours carries on: what was understood, and nothing that was not. Empty when there is nothing. */
export function handoffFragment({ country, rx }: Handoff): string {
  const parts = [country && `country=${country}`, rx && `rx=${rx}`].filter(Boolean);
  return parts.length > 0 ? `#${parts.join('&')}` : '';
}

/**
 * The place a search means, of the answers it got: the first one in the link's country, where
 * the link names one and an answer is there. Otherwise the first, as without a link: the sender
 * may be wrong about the country, and the user is the one who typed the name.
 */
export function placeFor<Place extends { country?: string }>(places: readonly Place[], country: string | undefined): Place | undefined {
  return (country ? places.find((place) => place.country === country) : undefined) ?? places[0];
}
