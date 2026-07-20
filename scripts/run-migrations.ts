import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from '../lib/db/client';

async function main() {
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('[migrate] schema migrations applied.');
  process.exit(0);
}

main().catch(err => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
