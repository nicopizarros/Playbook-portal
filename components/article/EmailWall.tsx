'use client';

import { useActionState } from 'react';
import { requestMagicLink, type MagicLinkState } from '@/lib/actions/reader-auth';
import { FREE_ARTICLES_PER_MONTH } from '@/lib/constants';

// Reuses the existing pill-form/nl-fields/nl-success/nl-error classes from
// the ported design system (styles/sections.css, styles/components.css) —
// same visual language as the newsletter forms, no new CSS needed for the
// form itself. No payment step anywhere, per the brief: this is pure email
// capture, not a paywall.
export function EmailWall({ articleUrl, teaser }: { articleUrl: string; teaser?: string | null }) {
  const [state, formAction, isPending] = useActionState<MagicLinkState, FormData>(
    requestMagicLink,
    null,
  );

  if (state?.ok) {
    return (
      <div className="article-walled">
        <p className="nl-success" role="status" style={{ display: 'flex' }}>
          ¡Listo! Revisa tu correo y toca el enlace para seguir leyendo gratis.
        </p>
      </div>
    );
  }

  return (
    <div className="article-walled">
      {/* Editor-authored (articles.wallTeaser), never the excerpt/summary —
          left unset means no preview text, not a silent fallback. */}
      {teaser && <p className="article-walled-teaser">{teaser}</p>}
      <p>
        Ya leíste tus {FREE_ARTICLES_PER_MONTH} artículos gratis este mes. Déjanos tu correo para
        seguir leyendo gratis, sin costo.
      </p>
      <form className={`pill-form email-wall-form${state?.error ? ' has-error' : ''}`} action={formAction}>
        <input type="hidden" name="redirectTo" value={articleUrl} />
        <div className="nl-fields">
          <label className="visually-hidden" htmlFor="email-wall-address">Tu correo</label>
          <input
            id="email-wall-address"
            name="email"
            type="text"
            inputMode="email"
            placeholder="Tu correo"
            aria-label="Tu correo"
            autoComplete="email"
            required
          />
          <button className="btn" type="submit" disabled={isPending}>
            {isPending ? 'Enviando…' : 'Seguir leyendo gratis'}
          </button>
        </div>
        <span className="nl-error" role="alert">{state?.error || ''}</span>
      </form>
    </div>
  );
}
