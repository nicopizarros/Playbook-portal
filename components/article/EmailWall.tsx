import { signInWithGoogle } from '@/lib/actions/reader-auth';
import { PasswordAuthForm } from '@/components/account/PasswordAuthForm';
import { FREE_ARTICLES_PER_MONTH } from '@/lib/constants';

// Reuses the existing pill-form/nl-fields classes from the ported design
// system (styles/sections.css, styles/components.css) — same visual
// language as the newsletter forms, no new CSS needed for the form
// itself. No payment step anywhere, per the brief: this is pure identity
// capture, not a paywall. Google stays the default/fastest path (a plain
// form bound to the signInWithGoogle server action); PasswordAuthForm
// (client component) is the collapsed-by-default email+password
// alternative added 2026-08-02 for readers who'd rather not use Google.
export function EmailWall({ articleUrl, teaser }: { articleUrl: string; teaser?: string | null }) {
  return (
    <div className="article-walled">
      {/* Editor-authored (articles.wallTeaser), never the excerpt/summary —
          left unset means no preview text, not a silent fallback. */}
      {teaser && <p className="article-walled-teaser">{teaser}</p>}
      <p className="wall-kicker">Para seguir leyendo</p>
      <p>
        Ya leíste tus {FREE_ARTICLES_PER_MONTH} artículos gratis este mes. Continúa con tu cuenta
        de Google, o con tu correo y contraseña, para seguir leyendo sin costo.
      </p>
      <form className="pill-form email-wall-form" action={signInWithGoogle.bind(null, articleUrl)}>
        <div className="nl-fields">
          <button className="btn" type="submit">Continuar con Google</button>
        </div>
      </form>
      <PasswordAuthForm redirectTo={articleUrl} />
    </div>
  );
}
