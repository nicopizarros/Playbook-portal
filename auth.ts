import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from './lib/db/client';
import { users, accounts, verificationTokens, editors } from './lib/db/schema';

// One Auth.js instance, two genuinely separate identity flows sharing it —
// Google OAuth for readers, credentials for editors. (Was Resend
// magic-link email; switched because sending to arbitrary reader
// addresses needs a verified sending domain, which isn't set up.) The
// Drizzle adapter is scoped to the reader tables only
// (usersTable/accountsTable/verificationTokensTable); editors are never
// persisted through it — Credentials + JWT sessions don't need adapter
// involvement, and keeping editors out of the `users` table keeps the two
// identity types from ever being confusable with each other. No
// sessionsTable is passed: @auth/drizzle-adapter's Postgres schema type
// marks it optional, and JWT session strategy (below) never calls the
// adapter's session methods, so nothing needs it.
const adapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  verificationTokensTable: verificationTokens,
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: 'jwt' },
  providers: [
    Google,
    Credentials({
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const username = String(credentials?.username || '').trim().toLowerCase();
        const password = String(credentials?.password || '');
        if (!username || !password) return null;

        const [editor] = await db.select().from(editors).where(eq(editors.username, username)).limit(1);
        if (!editor) return null;

        const ok = await bcrypt.compare(password, editor.passwordHash);
        if (!ok) return null;

        return { id: editor.id, name: editor.displayName, email: null };
      },
    }),
  ],
  callbacks: {
    // role is derived from which provider actually authenticated this
    // sign-in — never trusted from client input — so a reader can never
    // end up with role:'editor' by any means other than a real Credentials
    // check against the editors table succeeding.
    async jwt({ token, user, account }) {
      if (user && account) {
        token.id = user.id;
        token.role = account.provider === 'credentials' ? 'editor' : 'reader';
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && token.role) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'reader' | 'editor';
      }
      return session;
    },
  },
  // No custom `pages` config: readers sign in inline via the <EmailWall>
  // component (see lib/actions/reader-auth.ts), which calls signIn()
  // directly and handles errors itself in Spanish — Auth.js's default
  // pages are never actually shown to a reader in the normal flow. Editors
  // get a real login page in Phase 4 alongside the rest of the admin CMS.
});
