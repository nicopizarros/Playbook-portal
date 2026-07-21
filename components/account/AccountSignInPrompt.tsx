'use client';

import { useActionState } from 'react';
import { requestMagicLink, type MagicLinkState } from '@/lib/actions/reader-auth';

// Same requestMagicLink action the paywall's EmailWall uses (already
// rate-limited, already handles the Resend-failure-looks-like-success bug
// -- see lib/actions/reader-auth.ts) -- just a different entry point and
// redirectTo, so proactively wanting to check your account doesn't require
// first hitting the free-article wall on some article.
export function AccountSignInPrompt() {
  const [state, formAction, isPending] = useActionState<MagicLinkState, FormData>(
    requestMagicLink,
    null,
  );

  if (state?.ok) {
    return (
      <p className="nl-success" role="status" style={{ display: 'flex' }}>
        ¡Listo! Revisa tu correo y toca el enlace para entrar.
      </p>
    );
  }

  return (
    <form className={`pill-form email-wall-form${state?.error ? ' has-error' : ''}`} action={formAction}>
      <input type="hidden" name="redirectTo" value="/cuenta" />
      <div className="nl-fields">
        <label className="visually-hidden" htmlFor="account-signin-email">Tu correo</label>
        <input
          id="account-signin-email"
          name="email"
          type="text"
          inputMode="email"
          placeholder="Tu correo"
          aria-label="Tu correo"
          autoComplete="email"
          required
        />
        <button className="btn" type="submit" disabled={isPending}>
          {isPending ? 'Enviando…' : 'Enviarme el enlace de acceso'}
        </button>
      </div>
      <span className="nl-error" role="alert">{state?.error || ''}</span>
    </form>
  );
}
