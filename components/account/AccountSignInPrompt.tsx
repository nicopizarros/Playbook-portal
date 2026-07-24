import { signInWithGoogle } from '@/lib/actions/reader-auth';

// Same signInWithGoogle action the paywall's EmailWall uses -- just a
// different entry point and redirectTo, so proactively wanting to check
// your account doesn't require first hitting the free-article wall on
// some article.
export function AccountSignInPrompt() {
  return (
    <form className="pill-form email-wall-form" action={signInWithGoogle.bind(null, '/cuenta')}>
      <div className="nl-fields">
        <button className="btn" type="submit">Continuar con Google</button>
      </div>
    </form>
  );
}
