/**
 * A compact value on screen with full words for screen readers:
 * "220 m" is read as "220 metriä" (PLAN.md section 9).
 */
export function Measure({ short, long }: { short: string; long: string }) {
  if (short === long) return <>{short}</>;
  return (
    <>
      <span aria-hidden="true">{short}</span>
      <span className="visually-hidden">{long}</span>
    </>
  );
}
