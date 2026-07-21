import type { DefaultSession } from 'next-auth';

// Standard Auth.js TS augmentation pattern: adds the role/id fields our
// jwt/session callbacks (see auth.ts) attach on top of the library's
// defaults. `role` distinguishes readers (Resend/email provider, backed by
// the `users` table) from editors (Credentials provider, backed by the
// separate `editors` table) sharing one Auth.js instance.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'reader' | 'editor';
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: 'reader' | 'editor';
  }
}
