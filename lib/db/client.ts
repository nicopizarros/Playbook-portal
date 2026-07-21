import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Plain `pg` driver (not the edge-only @vercel/postgres fetch client) so the
// exact same code path runs against a local Docker Postgres in dev and
// against Vercel Postgres in production — both speak standard wire-protocol
// Postgres over POSTGRES_URL.
declare global {
  // eslint-disable-next-line no-var
  var __pbPgPool: Pool | undefined;
}

// Deliberately does NOT throw here if POSTGRES_URL is missing. This used
// to fail fast on import, which was the right instinct (an unconfigured DB
// should be a loud, immediate error) but had a bug in where "immediate"
// landed: Next.js imports every route module — including force-dynamic
// ones — while collecting page data during `next build`, so eagerly
// throwing here crashed the *build*, not just a misconfigured *request*,
// well before any actual query ran. `pg.Pool` itself performs no I/O at
// construction time (connections are opened lazily, per query) — letting
// it construct unconditionally means a missing POSTGRES_URL now correctly
// surfaces as a connection error the first time a request actually queries
// the database, and never blocks a build that doesn't have one configured
// yet (e.g. before a production Postgres is connected on Vercel).
function getPool() {
  // Reused across hot reloads in dev so we don't leak connections.
  if (!global.__pbPgPool) {
    global.__pbPgPool = new Pool({ connectionString: process.env.POSTGRES_URL });
  }
  return global.__pbPgPool;
}

export const db = drizzle(getPool(), { schema });
