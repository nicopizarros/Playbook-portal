'use client';

import { deleteMyAccount } from '@/lib/actions/reader-account';

// A real <form action={...}>, not a manually-invoked async call wrapped in
// try/catch: deleteMyAccount() ends in signOut({redirectTo:'/'}), which
// works by throwing Next's special NEXT_REDIRECT signal -- a generic catch
// around a direct call would swallow that and show a false "failed" error
// on the success path. Same form-action pattern already used by the admin
// logout button (app/admin/(protected)/layout.tsx).
export function DeleteAccountButton() {
  return (
    <form
      action={deleteMyAccount}
      onSubmit={e => {
        const confirmed = window.confirm(
          'Esto borra tu cuenta y todo tu historial de lectura de forma permanente. ¿Continuar?',
        );
        if (!confirmed) e.preventDefault();
      }}
    >
      <button type="submit" className="btn light">Eliminar mi cuenta y mis datos</button>
    </form>
  );
}
