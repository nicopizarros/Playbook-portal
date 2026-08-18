'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap, ScrollTrigger } from '@/lib/gsap';

// El Archivero as an actual cabinet (2026-08-14, user brief: a
// scroll-driven view where each investigation is pulled from a file
// cabinet — drawers, folders, tabs — in the spirit of the DEPAO
// scrollytelling / diamond-journey.com).
//
// Three rendering modes, decided at mount and rebuilt on breakpoint or
// motion-preference change:
//
//   1. No JS / prefers-reduced-motion: the base markup is a plain folder
//      grid (the pre-existing Archivero look) — nothing depends on this
//      component's effect running, so the core browsing experience stays
//      server-rendered. Zero CLS: cabinet styling only applies once the
//      `is-cabinet` class is added.
//   2. Desktop (≥900px, motion allowed): the section grows a scroll
//      runway with a sticky 100vh stage. A CSS-drawn drawer (face,
//      handle, label plate, dark slot) sits at the bottom; the folders
//      stack above it and a scrubbed timeline pulls each one up out of
//      the slot as the reader scrolls — the previous folder settles back
//      down, dimmed, the way a hand returns one file before pulling the
//      next. A plate in the corner counts "EXP. 003 / 012". CSS `position:
//      sticky` does the pinning (no pin-spacer surprises); GSAP only
//      animates transform/opacity, so the scrub stays on the compositor.
//   3. Mobile (with motion): no pinning — each folder slides up out of a
//      drawer lip as it enters the viewport (its slot clips the start of
//      the travel), so the metaphor survives without hijacking scroll on
//      a small screen.
export type CabinetFolder = {
  id: string;
  title: string;
  caseNo: string;
  dateFormatted: string;
  status: 'abierto' | 'archivado';
  figure: string | null;
  excerpt: string;
  readingTime: number;
};

const DESKTOP_QUERY = '(min-width: 900px)';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

export function LanaArchiveCabinet({ folders }: { folders: CabinetFolder[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || folders.length === 0) return;

    let killers: (() => void)[] = [];

    function teardown() {
      killers.forEach(k => k());
      killers = [];
      section!.classList.remove('is-cabinet');
    }

    function build() {
      teardown();
      if (window.matchMedia(REDUCED_QUERY).matches) return;

      const cards = Array.from(section!.querySelectorAll<HTMLElement>('.lana-cab-folder'));
      if (!cards.length) return;

      if (window.matchMedia(DESKTOP_QUERY).matches) {
        section!.classList.add('is-cabinet');
        // Runway length: one ~70vh scroll segment per folder plus the
        // 100vh the sticky stage itself occupies at the end.
        const runway = section!.querySelector<HTMLElement>('.lana-cabinet-runway');
        if (runway) runway.style.height = `${folders.length * 70 + 100}vh`;

        const tl = gsap.timeline();
        cards.forEach((card, i) => {
          // Start every folder fully below the stage, inside the drawer.
          // In viewport units, not yPercent: a percentage of the FOLDER's
          // own height (~350px) only pushed it to mid-stage, so every
          // not-yet-pulled folder peeked into view at once — the "pile of
          // files" bug caught on the first screenshot pass.
          tl.fromTo(
            card,
            { y: '96vh', rotate: i % 2 ? 1.6 : -1.6, opacity: 1, scale: 1 },
            { y: '0vh', rotate: 0, duration: 1, ease: 'power2.out' },
            i,
          );
          if (i > 0) {
            // The previous folder sinks back toward the drawer and fades
            // while the next one rises past it — one file returned, the
            // next pulled.
            tl.to(cards[i - 1], { y: '30vh', opacity: 0, duration: 0.8, ease: 'power2.in' }, i);
          }
        });

        const trigger = ScrollTrigger.create({
          trigger: section!.querySelector('.lana-cabinet-runway'),
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.35,
          animation: tl,
          onUpdate: (self: { progress: number }) => {
            const el = progressRef.current;
            if (!el) return;
            const idx = Math.min(folders.length - 1, Math.floor(self.progress * folders.length));
            const current = folders[idx]?.caseNo ?? '';
            if (el.textContent !== current) el.textContent = current;
          },
        } as unknown as Record<string, unknown>);
        killers.push(() => trigger.kill(), () => tl.kill());
      } else {
        // Mobile: per-folder pull out of the slot's drawer lip.
        cards.forEach(card => {
          const tween = gsap.fromTo(
            card,
            { y: 56, rotate: -1.2, opacity: 0.6 },
            {
              y: 0,
              rotate: 0,
              opacity: 1,
              duration: 0.55,
              ease: 'power2.out',
              scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none reverse' },
            } as unknown as Record<string, unknown>,
          );
          killers.push(() => {
            tween.scrollTrigger?.kill();
            tween.kill();
          });
        });
      }
    }

    build();

    const desktopMq = window.matchMedia(DESKTOP_QUERY);
    const reducedMq = window.matchMedia(REDUCED_QUERY);
    const rebuild = () => build();
    desktopMq.addEventListener('change', rebuild);
    reducedMq.addEventListener('change', rebuild);

    return () => {
      desktopMq.removeEventListener('change', rebuild);
      reducedMq.removeEventListener('change', rebuild);
      teardown();
    };
  }, [folders]);

  if (!folders.length) return null;

  return (
    <section className="lana-archive lana-cabinet" aria-label="Expedientes anteriores" ref={sectionRef}>
      <h2 className="lana-archive-head">Archivero</h2>
      <div className="lana-cabinet-runway">
        <div className="lana-cabinet-stage">
          <p className="lana-cabinet-progress" aria-hidden="true">
            <span ref={progressRef}>{folders[0].caseNo}</span> / {String(folders.length).padStart(3, '0')}
          </p>
          <div className="lana-cabinet-folders lana-archive-grid">
            {folders.map(folder => (
              <Link
                className="lana-folder lana-folder-card lana-cab-folder"
                href={`/articulo?id=${encodeURIComponent(folder.id)}`}
                key={folder.id}
              >
                <span className="lana-folder-tab">
                  <span className="lana-case-number">Exp. {folder.caseNo}</span>
                  <span className="lana-case-date">{folder.dateFormatted}</span>
                </span>
                <span className="lana-folder-body">
                  {folder.figure && (
                    <span className="lana-pull-figure lana-cab-extra" aria-hidden="true">
                      {folder.figure}
                    </span>
                  )}
                  <h3>{folder.title}</h3>
                  {folder.excerpt && <span className="lana-cab-excerpt lana-cab-extra">{folder.excerpt}</span>}
                  <span className="lana-folder-card-foot">
                    <span className={`lana-stamp lana-stamp-${folder.status}`}>
                      {folder.status === 'abierto' ? 'Caso abierto' : 'Archivado'}
                    </span>
                    <span className="lana-cab-reading lana-cab-extra">Lectura: {folder.readingTime || 1} min</span>
                    <span className="lana-folder-open" aria-hidden="true">
                      Abrir →
                    </span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <div className="lana-cabinet-drawer" aria-hidden="true">
            <div className="lana-cabinet-drawer-face">
              <span className="lana-cabinet-plate">Archivero · La Lana del Deporte</span>
              <span className="lana-cabinet-handle" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
