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

function getPool() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not set (see .env.local.example)');
  }
  // Reused across hot reloads in dev so we don't leak connections.
  if (!global.__pbPgPool) {
    global.__pbPgPool = new Pool({ connectionString: process.env.POSTGRES_URL });
  }
  return global.__pbPgPool;
}

export const db = drizzle(getPool(), { schema });
