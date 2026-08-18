'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminTopbarNav() {
  const pathname = usePathname();
  const isAnalytics = pathname?.startsWith('/admin/analytics') ?? false;
  const isGuide = pathname?.startsWith('/admin/guia') ?? false;
  const isEstilo = pathname?.startsWith('/admin/estilo') ?? false;
  const isCms = !isAnalytics && !isGuide && !isEstilo;

  return (
    <nav className="admin-topbar-nav" aria-label="Secciones del panel">
      <Link
        href="/admin/dashboard"
        className={`admin-tab${isCms ? ' is-active' : ''}`}
        aria-current={isCms ? 'page' : undefined}
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
      <Link
        href="/admin/guia"
        className={`admin-tab${isGuide ? ' is-active' : ''}`}
        aria-current={isGuide ? 'page' : undefined}
      >
        Guía
      </Link>
      <Link
        href="/admin/estilo"
        className={`admin-tab${isEstilo ? ' is-active' : ''}`}
        aria-current={isEstilo ? 'page' : undefined}
      >
        Estilo
      </Link>
    </nav>
  );
}
