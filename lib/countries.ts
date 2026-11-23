/**
 * The countries the tiles cover, as ISO codes (PLAN.md 7.2 and section 8), for the views
 * that name them. The pipeline's own list (pipeline/countries.ts) has the time zones and
 * the states as well; a unit test keeps the two the same.
 */
export const COUNTRY_CODES = ['FI', 'AT', 'CH', 'CZ', 'DE', 'DK', 'EE', 'ES', 'GR', 'HR', 'HU', 'IT', 'LT', 'LV', 'MT', 'NO', 'PL', 'PT', 'SE', 'SI', 'SK'] as const;
