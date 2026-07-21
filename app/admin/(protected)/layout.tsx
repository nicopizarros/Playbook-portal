import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';
import { AdminTopbarNav } from '@/components/admin/AdminTopbarNav';

export const dynamic = 'force-dynamic';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== 'editor') {
    redirect('/admin');
  }

  return (
    <div className="admin-editor">
      <header className="admin-topbar">
        <div className="admin-topbar-brand">
          <img src="/assets/img/playbook-logo.webp" width={28} height={28} alt="Playbook" />
          <span>Panel de contenido</span>
        </div>
        <div className="admin-topbar-actions">
          <AdminTopbarNav />
          <span className="admin-status">
            {session.user.name ? `Sesión: ${session.user.name}` : ''}
          </span>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/admin' });
            }}
          >
            <button type="submit" className="btn light">Salir</button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
