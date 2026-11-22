import { FirstVisit } from '@/components/FirstVisit';

/** The static shell. In M0 it is the first-visit window; the reducer and the other views arrive in M1. */
export default function Page() {
  return <FirstVisit />;
}
