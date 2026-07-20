// One-time seed: migrates the legacy ADMIN_USERS env var
// ("aldo:pass1,nico:pass2,guillermo:pass3") into the editors table with
// bcrypt-hashed passwords. Safe to re-run: existing usernames are updated,
// not duplicated.
//
// Usage: ADMIN_USERS="aldo:...,nico:...,guillermo:..." npm run db:seed-editors

import bcrypt from 'bcryptjs';
import { db } from '../lib/db/client';
import { editors } from '../lib/db/schema';

function parseUsers(raw: string) {
  const map: Record<string, string> = {};
  raw.split(',').forEach(pair => {
    const idx = pair.indexOf(':');
    if (idx === -1) return;
    const user = pair.slice(0, idx).trim().toLowerCase();
    const pass = pair.slice(idx + 1).trim();
    if (user && pass) map[user] = pass;
  });
  return map;
}

async function main() {
  const raw = process.env.ADMIN_USERS;
  if (!raw) {
    console.error('[seed-editors] ADMIN_USERS is not set — nothing to seed.');
    process.exit(1);
  }

  const users = parseUsers(raw);
  const usernames = Object.keys(users);
  if (!usernames.length) {
    console.error('[seed-editors] ADMIN_USERS parsed to zero accounts, check the format.');
    process.exit(1);
  }

  for (const username of usernames) {
    const passwordHash = await bcrypt.hash(users[username], 12);
    await db
      .insert(editors)
      .values({ username, passwordHash, displayName: username })
      .onConflictDoUpdate({
        target: editors.username,
        set: { passwordHash },
      });
    console.log(`[seed-editors] upserted "${username}"`);
  }

  console.log(`[seed-editors] done. ${usernames.length} editor account(s) ready.`);
  process.exit(0);
}

main().catch(err => {
  console.error('[seed-editors] failed:', err);
  process.exit(1);
});
