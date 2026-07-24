'use server';

import { signIn } from '@/auth';

// Google OAuth is a redirect-based flow: signIn() without redirect:false
// throws Auth.js's internal NEXT_REDIRECT to send the browser to Google
// and back through /api/auth/callback/google, so this action never
// returns normally on success — it's meant to be bound as a form action
// (see EmailWall / AccountSignInPrompt), not read for a result like the
// old magic-link action was.
export async function signInWithGoogle(redirectTo: string) {
  await signIn('google', { redirectTo });
}
