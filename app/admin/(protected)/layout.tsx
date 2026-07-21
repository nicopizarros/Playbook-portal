import { redirect } from 'next/navigation';
import Image from 'next/image';
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
          <Image src="/assets/img/playbook-logo.webp" width={28} height={28} alt="Playbook" />
          <span>Panel de contenido</span>
        </div>
        <div className="admin-topbar-actions">
          <AdminTopbarNav />
          {/* AdminDashboard (rendered inside {children}, a sibling of this
              header — not a descendant) portals its save-button/dirty-dot/
              status text here, matching legacy/admin/dashboard.html's
              topbar order (whoami, status, save button, logout). The
              analytics page renders nothing into this slot, same as
              legacy/admin/analytics.html's topbar having no save button. */}
          <div id="admin-topbar-save-slot" style={{ display: 'contents' }} />
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
