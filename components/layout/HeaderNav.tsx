'use client';

import { useEffect, useRef, useState } from 'react';
import { ThemeToggle } from '../theme/ThemeToggle';
import { SearchBox, type SearchableArticle } from './SearchBox';
import type { NavLink } from '@/lib/data/site-content';

// Owns the mobile drawer's open/close state (nav-links, nav-overlay, and
// the nav-toggle button all need to agree on it, mirroring
// legacy/js/nav.js's initMobileDrawer) plus the two theme-toggle instances
// and the search box, none of which have a server-renderable equivalent.
export function HeaderNav({
  links,
  ctaLabel,
  ctaUrl,
  searchArticles,
}: {
  links: NavLink[];
  ctaLabel: string;
  ctaUrl: string;
  searchArticles: SearchableArticle[];
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
              href={link.href}
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
        </div>
        <ThemeToggle variant="drawer" onToggle={close} />
      </nav>

      <div className="nav-actions">
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
