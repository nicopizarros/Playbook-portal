'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { acceptInvitation, type AcceptInvitationState } from '@/lib/actions/team';

export function SetPasswordForm({ token, username }: { token: string; username: string }) {
  const [state, formAction, isPending] = useActionState<AcceptInvitationState, FormData>(
    acceptInvitation,
    null,
  );

  if (state?.ok) {
    return (
      <div className="admin-set-password-done" role="status">
        <p className="admin-login-sub">
          Tu cuenta <strong>{state.username}</strong> quedó activa. Ya puedes iniciar sesión con tu
          contraseña nueva.
        </p>
        <Link className="btn" href="/admin">Iniciar sesión</Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="admin-set-password-form">
      <input type="hidden" name="token" value={token} />
      {/* Hidden but real username field so password managers save the right
          credential pair, not just a lone password. */}
      <input
        type="text"
        name="username"
        value={username}
        readOnly
        autoComplete="username"
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
      <label className="admin-field">
        Contraseña nueva
        <input name="password" type="password" autoComplete="new-password" minLength={8} required autoFocus />
      </label>
      <label className="admin-field">
        Repite la contraseña
        <input name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <p className="admin-error" role="alert">{state && !state.ok ? state.error : ''}</p>
      <button className="btn admin-login-submit" type="submit" disabled={isPending}>
        {isPending ? 'Activando…' : 'Activar mi cuenta'}
      </button>
    </form>
  );
}
