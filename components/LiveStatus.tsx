/** The one polite live region: announces transitions such as "Found 8 pharmacies…" (PLAN.md section 9). */
export function LiveStatus({ message }: { message: string }) {
  return (
    <p role="status" className="visually-hidden">
      {message}
    </p>
  );
}
