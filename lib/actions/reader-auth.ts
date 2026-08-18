'use server';

import { AuthError } from 'next-auth';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { signIn } from '@/auth';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request-ip';
import { appendReaderRow } from '@/lib/google-sheets';

// Google OAuth is a redirect-based flow: signIn() without redirect:false
// throws Auth.js's internal NEXT_REDIRECT to send the browser to Google
// and back through /api/auth/callback/google, so this action never
// returns normally on success — it's meant to be bound as a form action
// (see EmailWall / AccountSignInPrompt), not read for a result like the
// old magic-link action was.
export async function signInWithGoogle(redirectTo: string) {
  await signIn('google', { redirectTo });
}

export type PasswordAuthState = { error?: string } | null;

const MIN_PASSWORD_LENGTH = 8;
// Combined signup-or-login, not two separate forms/actions: a reader who
// doesn't remember whether they already have an account just enters
// email+password once, same friction either way. Same rate-limit shape as
// editor login (lib/actions/editor-auth.ts): generous enough a real
// reader mistyping their password a few times is never blocked.
const ATTEMPT_LIMIT = 10;
const ATTEMPT_WINDOW_SECONDS = 5 * 60;

// signIn()'s redirect:true default (used here, same as editor login) means
// a *successful* Credentials sign-in throws Next's internal NEXT_REDIRECT
// to send the browser to `redirectTo` — that throw must propagate past the
// try/catch below, only a real AuthError (wrong password / no such
// account, both surfaced as the same generic authorize() null from
// auth.ts) gets turned into a form-visible message.
export async function signUpOrSignInWithPasswordAction(
  redirectTo: string,
  _prev: PasswordAuthState,
  formData: FormData,
): Promise<PasswordAuthState> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Ingresa un correo válido.' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `La contraseña necesita al menos ${MIN_PASSWORD_LENGTH} caracteres.` };
  }

  const ip = await getClientIp();
  const limit = checkRateLimit(`reader-password:${ip}`, ATTEMPT_LIMIT, ATTEMPT_WINDOW_SECONDS);
  if (!limit.allowed) {
    return { error: `Demasiados intentos. Prueba de nuevo en ${Math.ceil(limit.retryAfterSeconds / 60)} minuto(s).` };
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing && !existing.passwordHash) {
    // Real account, but it signed up via Google — reject instead of
    // silently attaching a password to it (that would let anyone who
    // learns a reader's email "take over" their Google-linked account by
    // just setting a password on it).
    return { error: 'Ya existe una cuenta con este correo usando Google. Continúa con Google.' };
  }

  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = new Date();
    try {
      await db.insert(users).values({ email, passwordHash, createdAt });
      // Fire-and-forget on purpose (see appendReaderRow's own comment) --
      // only reached when this request itself created the row, not the
      // 23505 race-loser branch below, so a concurrent double-signup
      // never appends twice for the same reader.
      void appendReaderRow({ createdAt, email, name: null, authMethod: 'password', totalReads: 0 });
    } catch (err) {
      // 23505 = unique_violation on users.email -- two concurrent
      // first-time signups for the same address (double-click, two tabs).
      // The other request already created the row; fall through to
      // signIn() below instead of surfacing a raw DB error.
      if ((err as { code?: string }).code !== '23505') throw err;
    }
  }

  try {
    await signIn('reader-credentials', { email, password, redirectTo });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: 'Correo o contraseña incorrectos.' };
    }
    throw err;
  }
  return null;
}
