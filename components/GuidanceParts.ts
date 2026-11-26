/**
 * What travels with the prescription guidance, in one file of its own (lib/guidance.ts): the
 * "Resepti kotimaasta?" banner, the counter card, and the data both read (data/countries/).
 * Nothing that is part of the first load may import this file, or anything it exports, except
 * as a type: lib/guidance.ts asks for it when a prescription's country is not the pharmacy's.
 */

export { CounterCard } from './CounterCard';
export { CountryBanner } from './CountryBanner';
export { guideFor } from '@/data/countries';
