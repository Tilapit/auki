/**
 * A compact value on screen with full words for screen readers:
 * "220 m" is read as "220 metriä" (PLAN.md section 9). Where the words for reading differ
 * from those for a control's name (lib/travel.ts), `spoken` is what is read.
 *
 * Not for the text of a button or a link: there the name has to contain what is shown.
 */
export function Measure({ short, long, spoken = long }: { short: string; long: string; spoken?: string }) {
  if (short === spoken) return <>{short}</>;
  return (
    <>
      <span aria-hidden="true">{short}</span>
      <span className="visually-hidden">{spoken}</span>
    </>
  );
}
