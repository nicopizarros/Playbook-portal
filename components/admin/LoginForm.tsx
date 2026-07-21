'use client';

import { useActionState } from 'react';
import { loginAction } from '@/lib/actions/editor-auth';

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <form className="admin-login-card" action={formAction}>
      <img
        src="/assets/img/playbook-logo.webp"
        width={180}
        height={44}
        alt="Playbook"
        className="admin-login-logo"
      />
      <h1>Panel de contenido</h1>
      <p className="admin-login-sub">Acceso para el equipo editorial de Playbook.</p>
      <label className="admin-field">
        <span>Usuario</span>
        <input
          type="text"
          name="username"
          autoComplete="username"
          placeholder="aldo / nico / guillermo"
          required
        />
      </label>
      <label className="admin-field">
        <span>Contraseña</span>
        <input type="password" name="password" autoComplete="current-password" required />
      </label>
      <button type="submit" className="btn accent admin-login-submit" disabled={isPending}>
        {isPending ? 'Entrando…' : 'Entrar'}
      </button>
      <p className="admin-error" role="alert">{state?.error || ''}</p>
    </form>
  );
}
