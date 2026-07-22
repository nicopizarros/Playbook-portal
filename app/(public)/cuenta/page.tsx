import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/auth';
import { getReaderAccountSummary } from '@/lib/data/reader-account';
import { AccountSignInPrompt } from '@/components/account/AccountSignInPrompt';
import { DeleteAccountButton } from '@/components/account/DeleteAccountButton';

export const metadata: Metadata = {
  title: 'Mi cuenta',
  robots: { index: false, follow: true },
};

const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

export default async function CuentaPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'reader') {
    return (
      <main className="container legal-page" id="cuenta-main">
        <h1>Mi cuenta</h1>
        <p>Iniciá sesión con tu correo para ver tu cuenta, tu historial de lectura y tus datos.</p>
        <AccountSignInPrompt />
      </main>
    );
  }

  const summary = await getReaderAccountSummary(session.user.id);
  if (!summary) {
    // Session cookie survived but the user row is gone -- e.g. this same
    // session hit "eliminar mi cuenta" in another tab a moment ago.
    return (
      <main className="container legal-page" id="cuenta-main">
        <h1>Mi cuenta</h1>
        <p>No encontramos tu cuenta. Si la eliminaste recientemente, este es el resultado esperado.</p>
      </main>
    );
  }

  return (
    <main className="container legal-page" id="cuenta-main">
      <h1>Mi cuenta</h1>

      <h2>Datos</h2>
      <p>
        Correo: {summary.email}
        <br />
        Miembro desde: {dateFormatter.format(summary.memberSince)}
      </p>

      <h2>Tu actividad de lectura</h2>
      <p>
        {summary.readsThisMonth} {summary.readsThisMonth === 1 ? 'artículo leído' : 'artículos leídos'} este mes ·{' '}
        {summary.totalReads} en total. Como lector registrado, no tenés límite de lecturas gratuitas.
      </p>
      {summary.recentReads.length > 0 && (
        <ul>
          {summary.recentReads.map(r => (
            <li key={`${r.articleId}-${r.readAt.toISOString()}`}>
              <Link href={`/articulo?id=${r.articleId}`}>{r.title}</Link>
              {' — '}
              {dateFormatter.format(r.readAt)}
            </li>
          ))}
        </ul>
      )}

      <h2>Tus datos</h2>
      <p>
        Podés exportar o eliminar tu cuenta y tu historial de lectura en cualquier momento, sin
        necesidad de escribirnos (ver <Link href="/privacidad">Aviso de Privacidad</Link>).
      </p>
      <div className="account-actions">
        <a className="btn light" href="/api/account/export">Exportar mis datos</a>
        <DeleteAccountButton />
      </div>
    </main>
  );
}
