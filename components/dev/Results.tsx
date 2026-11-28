'use client';

import type { ComponentProps } from 'react';
import { primeDuty } from '@/lib/duty';
import { primeGuidance } from '@/lib/guidance';
import * as duty from '../DutyParts';
import * as parts from '../GuidanceParts';
import { ResultsView as Live } from '../ResultsView';

// The live app fetches the prescription guidance when a prescription's country is not the
// pharmacy's (lib/guidance.ts). Here it is part of the page: the views are fixtures, rendered
// on the server and photographed, and none may be caught while a file is on its way.
primeGuidance(parts);
// The duty lookups likewise (lib/duty.ts).
primeDuty(duty);

/** The results view of /dev/states and /dev/map: the live one, with the guidance already there. */
export function ResultsView(props: ComponentProps<typeof Live>) {
  return <Live {...props} />;
}
