'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { ThemeToggle } from '../theme/ThemeToggle';
import { SearchBox, type SearchableArticle } from './SearchBox';
import { NavMenu } from './NavMenu';
import type { NavLink } from '@/lib/data/site-content';
import { PRODUCT_HUBS } from '@/lib/product-hubs';
import { HUBS, UPCOMING_HUBS } from '@/lib/hubs';
import { gsap } from '@/lib/gsap';

// ---------------------------------------------------------------- Zones
// THREE ZONES, three KINDS of thing (brief §2). They are differentiated
// STRUCTURALLY, not by colour:
//
//   Publicaciones  a mega-menu of things Playbook AUTHORS. Two columns,
//                  each product with its identity chip and a descriptor.
//   Exclusivas     a narrower menu of DESTINATIONS about properties we do
//                  not own. Separated from Publicaciones by a standing rule.
//                  Reader-facing label only: the route namespace stays
//                  /coberturas/<slug> (see lib/hubs/types.ts).
//   Newsletter     not a menu at all — a filled button in the actions
//                  cluster. An ACTION, and one of only two places on the
//                  site newsletter signup is allowed to live (the other is
//                  the footer module).
//
// Zone labels, and why these words:
//   "Publicaciones" — a reader subscribes to and reads a publication;
//     "productos" is our internal framing, not theirs. (Flagged: the
//     homepage section still reads "Productos editoriales" — worth
//     aligning, but renaming reader-facing copy is the publisher's call.)
//   "Exclusivas"    — publisher's call, 2026-08-18. Frames these as what
//     Playbook has that nobody else does, rather than as a filing category.
//     Note this decouples the label from the /coberturas route namespace.
//   "Newsletter"    — kept as the accessible group name because the visible
//     control is the CTA's own words ("Suscríbete gratis"), already the
//     site's established conversion copy.
//
// HUB IDENTITY IS CONTAINED: no --hub-* token is read anywhere in this
// file. A hub's palette lives inside its own page subtree (data-hub) and
// never touches global chrome.

function sectionHref(href: string) {
  return href.startsWith('#') ? `/${href}` : href;
}

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
        return;
      }
      // Keep Tab inside the open drawer — see the original note: the
      // overlay blocks pointers but tabbing walked straight past it into
      // dimmed, unclickable controls.
      if (e.key !== 'Tab') return;
      const panel = drawerRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const items = drawerRef.current?.querySelectorAll('.nav-drawer-zone, .theme-toggle-drawer');
    if (!items?.length) return;
    gsap.fromTo(
      items,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', stagger: 0.055, delay: 0.08 },
    );
  }, [isOpen]);

  // The CMS's nav links are homepage SECTION anchors, and two of them
  // ("Noticias", "Infinitas") share a name with a product that now has its
  // own entry above. Listing both put the same word twice in one menu with
  // two different destinations. The product wins: it is the real page.
  const productNames = new Set(PRODUCT_HUBS.map(p => p.name.toLowerCase()));
  const sectionLinks = links.filter(l => !productNames.has(l.label.trim().toLowerCase()));

  const productItems = PRODUCT_HUBS.map(product => (
    <Link className="navmenu-item" href={product.path} key={product.source}>
      <span className="navmenu-chip" style={{ background: `var(${product.token})` }} aria-hidden="true" />
      <span className="navmenu-item-body">
        <span className="navmenu-item-name">{product.name}</span>
        <span className="navmenu-item-desc">{product.descriptor}</span>
      </span>
    </Link>
  ));

  // Only LISTED hubs are advertised. An unlisted hub's route works, but the
  // nav must not link to it — see Hub.listed.
  const listedHubs = HUBS.filter(h => h.listed);

  const hubItems = listedHubs.map(hub => (
    <Link className="navmenu-item" href={`/coberturas/${hub.slug}`} key={hub.slug}>
      <span className="navmenu-item-body">
        <span className="navmenu-item-name">{hub.name}</span>
        <span className="navmenu-item-desc">{hub.fullName}</span>
      </span>
    </Link>
  ));

  return (
    <>
      {/* ------------------------------------------------ Desktop zones */}
      <nav className="nav-zones" aria-label="Navegación principal">
        <NavMenu label="Publicaciones" wide>
          <div className="navmenu-group">
            <p className="navmenu-group-head">Publicaciones</p>
            {productItems}
          </div>
          {sectionLinks.length > 0 && (
            <div className="navmenu-group navmenu-group-secondary">
              <p className="navmenu-group-head">En la portada</p>
              {sectionLinks.map(link => (
                <a
                  className="navmenu-item navmenu-item-plain"
                  key={link.href}
                  href={sectionHref(link.href)}
                >
                  <span className="navmenu-item-name">{link.label}</span>
                </a>
              ))}
            </div>
          )}
        </NavMenu>

        {/* The standing rule is the structural signal that what follows is
            a different KIND of destination, not another peer link. */}
        <span className="nav-zone-rule" aria-hidden="true" />

        <NavMenu label="Exclusivas">
          {/* Hidden entirely when nothing is live — an "activas" heading over
              an empty list reads as broken, not as forthcoming. */}
          {listedHubs.length > 0 && (
            <div className="navmenu-group">
              <p className="navmenu-group-head">Exclusivas</p>
              {hubItems}
            </div>
          )}
          {UPCOMING_HUBS.length > 0 && (
            <div className={`navmenu-group${listedHubs.length ? ' navmenu-group-secondary' : ''}`}>
              <p className="navmenu-group-head">En preparación</p>
              {UPCOMING_HUBS.map(upcoming => (
                <span className="navmenu-item navmenu-item-muted" key={upcoming.name}>
                  <span className="navmenu-item-name">{upcoming.name}</span>
                  <span className="navmenu-item-desc">{upcoming.note}</span>
                </span>
              ))}
            </div>
          )}
        </NavMenu>
      </nav>

      {/* -------------------------------------------------- Mobile drawer */}
      <nav
        className={`nav-links${isOpen ? ' is-open' : ''}`}
        id="nav-links"
        aria-label="Navegación"
        ref={drawerRef}
      >
        <div id="nav-links-dynamic">
          <section className="nav-drawer-zone">
            <h2 className="nav-drawer-head">Publicaciones</h2>
            {PRODUCT_HUBS.map(product => (
              <Link className="nav-drawer-link" href={product.path} key={product.source} onClick={close}>
                <span className="navmenu-chip" style={{ background: `var(${product.token})` }} aria-hidden="true" />
                {product.name}
              </Link>
            ))}
            {sectionLinks.map(link => (
              <a className="nav-drawer-link nav-drawer-sub" key={link.href} href={sectionHref(link.href)} onClick={close}>
                {link.label}
              </a>
            ))}
          </section>

          <section className="nav-drawer-zone">
            <h2 className="nav-drawer-head">Exclusivas</h2>
            {listedHubs.map(hub => (
              <Link className="nav-drawer-link" href={`/coberturas/${hub.slug}`} key={hub.slug} onClick={close}>
                {hub.name}
              </Link>
            ))}
            {UPCOMING_HUBS.map(upcoming => (
              <span className="nav-drawer-link nav-drawer-muted" key={upcoming.name}>
                {upcoming.name} <em>{upcoming.note}</em>
              </span>
            ))}
          </section>

          <section className="nav-drawer-zone">
            <h2 className="nav-drawer-head">Newsletter</h2>
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
          </section>
        </div>
        <ThemeToggle variant="drawer" onToggle={close} />
      </nav>

      {/* ------------------------------------------------------- Actions */}
      <div className="nav-actions">
        {readerEmail ? (
          <span className="reader-status" title={readerEmail}>
            <Link href="/cuenta">{readerEmail}</Link>
            <button type="button" onClick={() => signOut({ redirectTo: '/' })}>Salir</button>
          </span>
        ) : (
          <Link href="/cuenta" className="nav-login-link">
            Iniciar sesión
          </Link>
        )}
        <SearchBox articles={searchArticles} />
        <ThemeToggle variant="desktop" />
        {/* Zone 3. A filled button, not a nav link — the one conversion
            entry point in the header. */}
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
