'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminTopbarNav() {
  const pathname = usePathname();
  const isAnalytics = pathname?.startsWith('/admin/analytics') ?? false;

  return (
    <nav className="admin-topbar-nav" aria-label="Secciones del panel">
      <Link
        href="/admin/dashboard"
        className={`admin-tab${isAnalytics ? '' : ' is-active'}`}
        aria-current={isAnalytics ? undefined : 'page'}
      >
        CMS
      </Link>
      <Link
        href="/admin/analytics"
        className={`admin-tab${isAnalytics ? ' is-active' : ''}`}
        aria-current={isAnalytics ? 'page' : undefined}
      >
        Analytics
      </Link>
    </nav>
  );
}
