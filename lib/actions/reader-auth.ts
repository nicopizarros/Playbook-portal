'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request-ip';

export type MagicLinkState = { ok: boolean; error?: string } | null;

// 5 requests per 10 minutes per IP -- Resend charges per email and a magic
// link lands in someone's real inbox, so this is tighter than the editor
// login limit: both a cost control and a guard against using this as an
// email-bombing vector against a victim's address.
const MAGIC_LINK_LIMIT = 5;
const MAGIC_LINK_WINDOW_SECONDS = 10 * 60;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Called from <EmailWall> via useActionState. redirect:false means this
// returns a result instead of navigating — the component shows its own
// inline "revisa tu correo" confirmation rather than landing on Auth.js's
// default (English, unstyled) verify-request page.
export async function requestMagicLink(_prev: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  const email = String(formData.get('email') || '').trim();
  const redirectTo = String(formData.get('redirectTo') || '/');

  if (!isValidEmail(email)) {
    return { ok: false, error: 'Ingresa un correo válido.' };
  }

  const ip = await getClientIp();
  const limit = checkRateLimit(`magic-link:${ip}`, MAGIC_LINK_LIMIT, MAGIC_LINK_WINDOW_SECONDS);
  if (!limit.allowed) {
    return { ok: false, error: `Demasiados intentos. Prueba de nuevo en ${Math.ceil(limit.retryAfterSeconds / 60)} minuto(s).` };
  }

  try {
    // signIn() with redirect:false returns a plain URL string for
    // non-Credentials providers (verified against next-auth's actual
    // implementation, not assumed — the {error, ok, status, url} shape is
    // specific to the Credentials provider). Auth.js signals a failed
    // Email-provider send by redirecting to its error page with an
    // `error=` query param instead of throwing, so the string itself has
    // to be inspected — checking `.error` on it (as if it were an object)
    // silently missed every failure, including a real one caught during
    // this phase's own verification (an invalid RESEND_API_KEY reached
    // Resend, got a 401, and this action still reported success until
    // fixed).
    const result = await signIn('resend', { email, redirectTo, redirect: false });
    const resultUrl = typeof result === 'string' ? result : '';
    const failed = resultUrl.includes('/api/auth/error') || new URL(resultUrl, 'http://x').searchParams.has('error');
    if (failed) {
      return { ok: false, error: 'No se pudo enviar el enlace. Intenta de nuevo en unos minutos.' };
    }
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: 'No se pudo enviar el enlace. Intenta de nuevo en unos minutos.' };
    }
    throw err;
  }
}
