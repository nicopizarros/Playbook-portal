import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from '../lib/db/client';

// Wired into Vercel's production build via package.json's `vercel-build`
// script, so a schema-changing PR can never again ship code the database
// hasn't caught up to — see HANDOFF.md's 2026-07-22 "wall_teaser" outage
// for the incident this exists to prevent: drizzle/0002_curly_dragon_man.sql
// was committed and merged, but nobody ran `npm run db:migrate` against
// production, so every article query 500'd on a column that didn't exist
// yet. This script makes that step automatic instead of a manual one a
// session can forget.
//
// Deliberately scoped to real production builds only (VERCEL_ENV ===
// 'production'): preview deployments share the same database (confirmed
// against real Vercel runtime logs — preview branches serve real article
// data), and an unreviewed, possibly-abandoned branch's work-in-progress
// migration should never auto-apply to it just because its preview build
// ran. Local `next build` (via the separate, untouched `build` script) and
// CI (.github/workflows/ci.yml, which deliberately never sets
// POSTGRES_URL — see that workflow's comment) both skip too, since neither
// sets VERCEL_ENV.
async function main() {
  if (process.env.VERCEL_ENV !== 'production') {
    console.log(
      `[predeploy-migrate] not a production build (VERCEL_ENV=${process.env.VERCEL_ENV ?? 'unset'}), skipping.`
    );
    process.exit(0);
  }

  if (!process.env.POSTGRES_URL) {
    // Same "degrade, don't crash the build" philosophy lib/db/client.ts
    // already documents — but unlike that lazy check, this is worth a loud
    // console.error rather than a silent skip: a real production build
    // with no POSTGRES_URL at all is itself almost certainly a
    // misconfiguration worth noticing in the build log, even though it
    // shouldn't block the deploy by itself (the app already degrades
    // per-request for a missing POSTGRES_URL, same as before this script
    // existed).
    console.error(
      '[predeploy-migrate] VERCEL_ENV=production but POSTGRES_URL is not set — skipping migration. This is likely a real misconfiguration, not expected steady state.'
    );
    process.exit(0);
  }

  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('[predeploy-migrate] schema migrations applied.');
  process.exit(0);
}

main().catch(err => {
  // Unlike a missing env var, a real migration failure (bad SQL, a
  // constraint violation against real data, a lock timeout) has to fail
  // the build loudly. Deploying new application code against a database
  // that didn't get the schema it expects is exactly the incident this
  // script exists to prevent — silently continuing here would defeat the
  // entire point of running it during the build instead of by hand.
  console.error('[predeploy-migrate] migration failed, failing the build:', err);
  process.exit(1);
});
