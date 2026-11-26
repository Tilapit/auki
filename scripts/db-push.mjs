// Applies supabase/migrations/ to the database of SUPABASE_DB_URL, with the Supabase CLI
// (PLAN.md 7.10). The connection string is handed to the CLI and printed nowhere.
// `npm run db:push -- --dry-run` shows what would be applied.
import { spawnSync } from 'node:child_process';

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error('SUPABASE_DB_URL is not set. It belongs in .env.local (see .env.example).');
  process.exit(1);
}
const result = spawnSync('supabase', ['db', 'push', '--db-url', url, ...process.argv.slice(2)], { stdio: ['inherit', 'pipe', 'pipe'], encoding: 'utf8' });
if (result.error) {
  console.error('The Supabase CLI was not found. Install it (https://supabase.com/docs/guides/cli) and run this again.');
  process.exit(1);
}
// Whatever the CLI says is passed on with the connection string taken out of it.
const safe = (text) => text.split(url).join('<SUPABASE_DB_URL>').replace(/postgres(ql)?:\/\/\S+/g, '<SUPABASE_DB_URL>');
process.stdout.write(safe(result.stdout ?? ''));
process.stderr.write(safe(result.stderr ?? ''));
process.exit(result.status ?? 1);
