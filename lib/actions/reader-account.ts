'use server';

import { eq } from 'drizzle-orm';
import { auth, signOut } from '@/auth';
import { db } from '@/lib/db/client';
import { users, verificationTokens } from '@/lib/db/schema';

async function requireReader() {
  const session = await auth();
  if (!session || session.user.role !== 'reader') {
    throw new Error('Unauthorized');
  }
  return session;
}

// ARCO self-service deletion (see /privacidad's "Tus derechos" section --
// this is what makes that promise real, not just text). Deletes the user
// row; accounts and article_reads both have onDelete:'cascade' FKs to
// users (lib/db/schema.ts), so both go with it automatically. verification_token
// has no FK to users at all (Auth.js's own schema keys it by the email
// string, not a user id), so a pending unused magic-link token for this
// address is cleaned up separately -- otherwise it would outlive the
// account it belongs to.
export async function deleteMyAccount() {
  const session = await requireReader();
  const email = session.user.email;

  await db.delete(users).where(eq(users.id, session.user.id));
  if (email) {
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
  }

  await signOut({ redirectTo: '/' });
}
