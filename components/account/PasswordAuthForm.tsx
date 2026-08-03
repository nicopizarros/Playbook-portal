'use client';

import { useActionState, useState } from 'react';
import { signUpOrSignInWithPasswordAction, type PasswordAuthState } from '@/lib/actions/reader-auth';

// Secondary, collapsed-by-default path alongside the Google button
// (EmailWall / AccountSignInPrompt) — Google stays the fastest option for
// most readers, this is for the ones who'd rather not use it. One form
// handles both signup and login (see the server action): a reader who
// isn't sure whether they already have an account just enters
// email+password once, same friction either way, no separate "create
// account" step or confirmation email.
export function PasswordAuthForm({ redirectTo }: { redirectTo: string }) {
  const [expanded, setExpanded] = useState(false);
  const action = signUpOrSignInWithPasswordAction.bind(null, redirectTo) as (
    prev: PasswordAuthState,
    formData: FormData,
  ) => Promise<PasswordAuthState>;
  const [state, formAction, isPending] = useActionState(action, null);

  if (!expanded) {
    return (
      <button type="button" className="link-btn password-auth-toggle" onClick={() => setExpanded(true)}>
        O continúa con tu correo y contraseña
      </button>
    );
  }

  return (
    <form className="pill-form email-wall-form password-auth-form" action={formAction}>
      <div className="nl-fields">
        <input type="email" name="email" placeholder="Tu correo" autoComplete="email" required />
        <input
          type="password"
          name="password"
          placeholder="Contraseña (mínimo 8 caracteres)"
          autoComplete="current-password"
          minLength={8}
          required
        />
        <button className="btn" type="submit" disabled={isPending}>
          {isPending ? 'Entrando…' : 'Continuar'}
        </button>
      </div>
      <p className="password-auth-hint">
        Si es la primera vez que usas este correo, se crea tu cuenta automáticamente.
      </p>
      {state?.error && (
        <p className="password-auth-error" role="alert">{state.error}</p>
      )}
    </form>
  );
}
