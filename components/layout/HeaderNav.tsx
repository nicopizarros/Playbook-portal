'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { ThemeToggle } from '../theme/ThemeToggle';
import { SearchBox, type SearchableArticle } from './SearchBox';
import type { NavLink } from '@/lib/data/site-content';
import { gsap } from '@/lib/gsap';

// The CMS stores these as bare fragments ("#noticias", "#analisis", …)
// because the nav was built when the homepage was the only page. Every one
// of those sections lives on the homepage only, so on /archivo, /articulo,
// /tema, /autor and the legal pages all five links resolved to a fragment
// with no matching element — clicking "Noticias" from an article did
// nothing at all, no navigation, no scroll, no feedback. Prefixing with
// "/" makes them navigate home and *then* anchor, which is what a reader
// means by tapping "Video" from somewhere else on the site.
// Deliberately normalised at render time rather than by rewriting
// content.json: the hrefs stay editable as plain fragments in the CMS's
// Navegación tab (where "#noticias" is the intuitive thing to type), and
// an editor who enters a full path or an external URL still gets it
// through untouched.
function sectionHref(href: string) {
  return href.startsWith('#') ? `/${href}` : href;
}

// Owns the mobile drawer's open/close state (nav-links, nav-overlay, and
// the nav-toggle button all need to agree on it, mirroring
// legacy/js/nav.js's initMobileDrawer) plus the two theme-toggle instances
// and the search box, none of which have a server-renderable equivalent.
export function HeaderNav({
  links,
  ctaLabel,
  ctaUrl,
  searchArticles,
  readerEmail,
}: {
  links: NavLink[];
  ctaLabel: string;
  ctaUrl: string;
  searchArticles: SearchableArticle[];
  readerEmail: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  function close() {
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    const firstLink = drawerRef.current?.querySelector('a');
    (firstLink as HTMLElement | null)?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
        toggleRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // The drawer panel itself already slides in via CSS (.nav-links.is-open,
  // styles/responsive.css) — this staggers its links in on top of that
  // slide, the kind of coordinated multi-element timing CSS transitions
  // can't express cleanly since every link would otherwise appear all at
  // once the instant the panel stops moving.
  useEffect(() => {
    if (!isOpen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const items = drawerRef.current?.querySelectorAll('#nav-links-dynamic > *, .theme-toggle-drawer');
    if (!items?.length) return;
    gsap.fromTo(
      items,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', stagger: 0.045, delay: 0.08 },
    );
  }, [isOpen]);

  return (
    <>
      <nav
        className={`nav-links${isOpen ? ' is-open' : ''}`}
        id="nav-links"
        aria-label="Navegación principal"
        ref={drawerRef}
      >
        <div id="nav-links-dynamic">
          {links.map(link => (
            <a
              key={link.href}
              className={link.variant === 'infinitas' ? 'nav-link-infinitas' : undefined}
              href={sectionHref(link.href)}
              onClick={close}
            >
              {link.label}
            </a>
          ))}
          <a
            className="btn nav-drawer-cta"
            href={ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
          >
            {ctaLabel}
          </a>
          {!readerEmail && (
            <Link href="/cuenta" className="nav-drawer-login" onClick={close}>
              Iniciar sesión
            </Link>
          )}
        </div>
        <ThemeToggle variant="drawer" onToggle={close} />
      </nav>

      <div className="nav-actions">
        {readerEmail ? (
          <span className="reader-status" title={readerEmail}>
            <Link href="/cuenta">{readerEmail}</Link>
            <button type="button" onClick={() => signOut({ redirectTo: '/' })}>Salir</button>
          </span>
        ) : (
          // ctaUrl/ctaLabel below ("Suscríbete gratis") link out to the
          // Substack newsletter -- a separate product (email subscription)
          // from this site's own reader accounts (free-article quota via
          // magic-link login, see lib/metering.ts). Real gap this closes:
          // there was no way to reach the on-site login at all except by
          // first hitting the free-article wall on some article.
          <Link href="/cuenta" className="nav-login-link">
            Iniciar sesión
          </Link>
        )}
        <SearchBox articles={searchArticles} />
        <ThemeToggle variant="desktop" />
        <a className="btn" id="nav-cta" href={ctaUrl} target="_blank" rel="noopener noreferrer">
          {ctaLabel}
        </a>
        <button
          className="nav-toggle"
          id="nav-toggle"
          type="button"
          aria-expanded={isOpen}
          aria-controls="nav-links"
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setIsOpen(v => !v)}
          ref={toggleRef}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div className={`nav-overlay${isOpen ? ' is-open' : ''}`} onClick={close} />
    </>
  );
}
