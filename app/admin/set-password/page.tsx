import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { editorInvitations } from '@/lib/db/schema';
import { SetPasswordForm } from '@/components/admin/SetPasswordForm';

export const metadata: Metadata = { title: 'Activar cuenta de editor' };
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ token?: string }> };

// Public page (deliberately OUTSIDE app/admin/(protected)): the invitee has
// no session yet — that's the whole point. The token is validated here for
// a friendly early error, and validated AGAIN inside acceptInvitation();
// this render-time check is UX, not the security boundary.
export default async function SetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  let state: 'ok' | 'invalid' | 'expired' = 'invalid';
  let displayName = '';
  let username = '';

  if (token) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const [invitation] = await db
      .select()
      .from(editorInvitations)
      .where(eq(editorInvitations.tokenHash, tokenHash))
      .limit(1);
    if (invitation && !invitation.usedAt) {
      if (invitation.expiresAt.getTime() > Date.now()) {
        state = 'ok';
        displayName = invitation.displayName;
        username = invitation.username;
      } else {
        state = 'expired';
      }
    }
  }

  return (
    <main className="admin-login admin-body-login">
      <div className="admin-login-card">
          <Image className="admin-login-logo" src="/assets/img/playbook-logo.webp" width={34} height={34} alt="Playbook" />
          {state === 'ok' ? (
            <>
              <h1>Hola, {displayName}</h1>
              <p className="admin-login-sub">
                Te invitaron al panel editorial de Playbook. Tu usuario es <strong>{username}</strong>.
                Elige una contraseña para activar tu cuenta.
              </p>
              <SetPasswordForm token={token!} username={username} />
            </>
          ) : (
            <>
              <h1>{state === 'expired' ? 'Invitación vencida' : 'Invitación no válida'}</h1>
              <p className="admin-login-sub">
                {state === 'expired'
                  ? 'Esta invitación venció (los enlaces duran 48 horas). Pide al equipo que te envíe una nueva.'
                  : 'Este enlace de invitación no existe o ya fue usado. Pide al equipo que te envíe uno nuevo.'}
              </p>
              <Link className="btn light" href="/admin">Ir al inicio de sesión</Link>
            </>
          )}
      </div>
    </main>
  );
}
