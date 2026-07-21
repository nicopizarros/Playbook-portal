'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request-ip';

export type LoginState = { error?: string } | null;

// 10 attempts per 5 minutes per IP -- generous enough that a real editor
// mistyping their password a few times never gets blocked, tight enough to
// blunt a credential-stuffing/brute-force script.
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_SECONDS = 5 * 60;

// signIn() defaults to redirect:true, which internally calls next/navigation's
// redirect() on success — that throw must propagate, not be swallowed below.
// A failed Credentials attempt is classified as an AuthError (CredentialsSignin)
// and *throws* instead of returning a result to inspect, verified against
// next-auth's actual installed source (node_modules/next-auth/lib/actions.js:
// signIn() has no try/catch around its internal Auth() call, and
// @auth/core/index.js's error handler re-throws whenever the error is an
// AuthError and the call is in "raw" mode, which is how actions.js always
// invokes it) — this is a different failure shape than lib/actions/reader-auth.ts's
// Resend case (a returned URL to inspect, never a throw), so it isn't safe to
// copy that handling here even though both call signIn().
export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '');
  if (!username || !password) {
    return { error: 'Usuario y contraseña son obligatorios' };
  }

  const ip = await getClientIp();
  const limit = checkRateLimit(`editor-login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_SECONDS);
  if (!limit.allowed) {
    return { error: `Demasiados intentos. Probá de nuevo en ${Math.ceil(limit.retryAfterSeconds / 60)} minuto(s).` };
  }

  try {
    await signIn('credentials', { username, password, redirectTo: '/admin/dashboard' });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: 'Usuario o contraseña incorrectos' };
    }
    throw err;
  }
  return null;
}
