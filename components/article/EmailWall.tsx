import { signInWithGoogle } from '@/lib/actions/reader-auth';
import { FREE_ARTICLES_PER_MONTH } from '@/lib/constants';

// Reuses the existing pill-form/nl-fields classes from the ported design
// system (styles/sections.css, styles/components.css) — same visual
// language as the newsletter forms, no new CSS needed for the form
// itself. No payment step anywhere, per the brief: this is pure identity
// capture via Google, not a paywall. Server component: the sign-in button
// is a form bound to a server action (signInWithGoogle), so no client-side
// state/handlers are needed here anymore.
export function EmailWall({ articleUrl, teaser }: { articleUrl: string; teaser?: string | null }) {
  return (
    <div className="article-walled">
      {/* Editor-authored (articles.wallTeaser), never the excerpt/summary —
          left unset means no preview text, not a silent fallback. */}
      {teaser && <p className="article-walled-teaser">{teaser}</p>}
      <p className="wall-kicker">Para seguir leyendo</p>
      <p>
        Ya leíste tus {FREE_ARTICLES_PER_MONTH} artículos gratis este mes. Continúa con tu cuenta
        de Google para seguir leyendo sin costo.
      </p>
      <form className="pill-form email-wall-form" action={signInWithGoogle.bind(null, articleUrl)}>
        <div className="nl-fields">
          <button className="btn" type="submit">Continuar con Google</button>
        </div>
      </form>
    </div>
  );
}
