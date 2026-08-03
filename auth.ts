import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from './lib/db/client';
import { users, accounts, verificationTokens, editors } from './lib/db/schema';
import { appendReaderRow } from './lib/google-sheets';

// One Auth.js instance, three identity flows sharing it — Google OAuth
// for readers, email+password for readers who'd rather not use Google
// (2026-08-02, provider id `reader-credentials`, needs no outbound email
// at all, same motivation as the Resend-to-Google switch below), and
// username+password for editors (provider id `credentials`, the default
// Auth.js gives an unnamed Credentials provider — kept as-is since editor
// login already shipped with it, only the new reader provider gets an
// explicit id). (Reader auth was Resend magic-link email; switched to
// Google because sending to arbitrary reader addresses needs a verified
// sending domain, which isn't set up.) The Drizzle adapter is scoped to
// the reader tables only (usersTable/accountsTable/verificationTokensTable);
// editors are never persisted through it — Credentials + JWT sessions
// don't need adapter involvement, and keeping editors out of the `users`
// table keeps the two identity types from ever being confusable with each
// other. No sessionsTable is passed: @auth/drizzle-adapter's Postgres
// schema type marks it optional, and JWT session strategy (below) never
// calls the adapter's session methods, so nothing needs it.
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
    // Reader-facing alternative to Google, added 2026-08-02: an account a
    // reader creates entirely on Playbook, no Google account or outbound
    // email required. lib/actions/reader-auth.ts creates the `users` row
    // (with a bcrypt hash, same library editors already use) before ever
    // calling signIn() with this provider, so authorize() here only ever
    // verifies, it never creates an account — that split keeps "wrong
    // password" and "no such account" as distinguishable, actionable
    // errors on the signup/login form instead of this generic null.
    Credentials({
      id: 'reader-credentials',
      credentials: {
        email: { label: 'Correo', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || '').trim().toLowerCase();
        const password = String(credentials?.password || '');
        if (!email || !password) return null;

        const [reader] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        // No row, or a Google-only row with no password set: reject
        // outright, never compare against a null hash.
        if (!reader || !reader.passwordHash) return null;

        const ok = await bcrypt.compare(password, reader.passwordHash);
        if (!ok) return null;

        return { id: reader.id, name: reader.name, email: reader.email };
      },
    }),
  ],
  callbacks: {
    // role is derived from which provider actually authenticated this
    // sign-in — never trusted from client input — so a reader can never
    // end up with role:'editor' by any means other than a real Credentials
    // check against the editors table succeeding. Both reader providers
    // (google, reader-credentials) fall into the same 'reader' bucket;
    // only the editor-only 'credentials' id maps to 'editor'.
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
  events: {
    // Only fires for adapter-backed sign-ins, i.e. Google — the
    // reader-credentials provider bypasses the adapter entirely (it
    // inserts into `users` itself, see lib/actions/reader-auth.ts, which
    // calls appendReaderRow directly instead of relying on this event).
    async createUser({ user }) {
      await appendReaderRow({
        createdAt: new Date(),
        email: user.email || '',
        name: user.name ?? null,
        authMethod: 'google',
        totalReads: 0,
      });
    },
  },
  // No custom `pages` config: readers sign in inline via the <EmailWall>
  // component (see lib/actions/reader-auth.ts), which calls signIn()
  // directly and handles errors itself in Spanish — Auth.js's default
  // pages are never actually shown to a reader in the normal flow. Editors
  // get a real login page in Phase 4 alongside the rest of the admin CMS.
});
