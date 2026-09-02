'use client';

import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { articlePath } from '@/lib/article-url';

// ============================================================ El Archivero
// La Lana's signature module: the back catalog as an actual filing cabinet
// — a drawer, a stair of tabbed folders, one open case at the front.
// Rewritten in round 2 (2026-08-27) against the measured spec in
// "Handoff Spec R2.dc.html" §3.
//
// THREE MODES, decided at mount and rebuilt on breakpoint / motion change:
//
//   1. Flat grid — the BASE state of the markup, and what <768px and
//      prefers-reduced-motion get at any width. NOT a degradation: it is
//      the same list designed as tabbed index cards. Nothing here depends
//      on the effect running, so no-JS readers get the full catalog with
//      zero layout shift (cabinet styling only lands with `is-cabinet`).
//   2. Cabinet (>=900px, motion allowed) — the scrubbed drawer below.
//   3. 768-899px keeps the flat grid too: the stage needs the width.
//
// ------------------------------------------------------ ESTA NO SE REUSA
// The archivero is La Lana's signature BECAUSE an investigation is a
// document. Noticias (El Trago), TFBR (La Sala de Juntas) and Infinitas
// (El Marcador) already have their own device in styles/product-hubs.css.
// Writing it down so nobody copies this sideways.
//
// ---------------------------------------------------------- THE GEOMETRY
// Everything is a function of `d = i - f`: the signed distance between a
// file's index and the fractional scroll index.
//
//     d > 0   still in the drawer, stacked up the stair ("adelante")
//     d ~ 0   open at the front
//     d < 0   filed away, sinking behind the drawer face ("atrás")
//
// The stage is a sticky 100vh inside a tall runway, and every card is
// position:absolute — NOTHING reserves height of its own. That is what
// killed the white gap the first version left: the gap was height
// reserved by items already out of flow.
//
// ---------------------------------------- THE TRAP THAT COST THREE PASSES
// Inside a `transform-style: preserve-3d` context, paint order is decided
// by REAL Z, not by z-index. With the stack at Z 0 and the open file at
// Z +130, the open folder covered all fourteen archived ones no matter
// what z-index they carried. z-index only breaks ties BETWEEN ELEMENTS
// THAT SHARE A Z — which is exactly why the drawer face (no transform,
// so Z 0, z-index 950) lands in front of the stair while the archived
// files at Z -20 slide behind it. That "behind the metal" is the whole
// filed-away metaphor; it is geometry, not layering.
//
// Two more, cheaper but just as real:
//   * Anchor by the TOP edge (top:40%, transform-origin:50% 0). Centred,
//     the 200px open body grows upward and eats the tab strip.
//   * The open body's height must be DETERMINISTIC: height = ease x 200px
//     with overflow:hidden and the dek clamped to two lines. Without the
//     clamp a longer dek overruns by ~16px and hides precisely the figure
//     and the open link.

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

/** vh of runway per file, plus the 100vh the sticky stage itself occupies. */
const VH_PER_FILE = 60;
const STAGE_VH = 100;

/** |d| under this and the file counts as the one open at the front. */
const OPEN_BAND = 0.5;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function LanaArchiveCabinet({ folders }: { folders: CabinetFolder[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const runwayRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const markRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // The live fractional index. Read by the click handler to tell "bring
  // this file to the front" apart from "open it", so it has to be a ref:
  // re-rendering on every scroll frame would defeat the whole point of
  // driving this with raw transforms.
  const fRef = useRef(0);
  const cabinetRef = useRef(false);

  const total = folders.length;

  // Scroll position that puts file `i` at the front. Derived from the
  // runway's own box rather than offsetTop: offsetTop is measured against
  // the nearest POSITIONED ancestor, and the runway is itself
  // position:relative inside a hub subtree that may grow one later — this
  // form cannot drift.
  const goTo = useCallback(
    (index: number) => {
      const runway = runwayRef.current;
      if (!runway || !cabinetRef.current || total < 2) return;
      const rect = runway.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) return;
      const target = clamp(index, 0, total - 1) / (total - 1);
      window.scrollTo({ top: rect.top + window.scrollY + target * travel, behavior: 'smooth' });
    },
    [total],
  );

  useEffect(() => {
    const section = sectionRef.current;
    const runway = runwayRef.current;
    if (!section || !runway || total === 0) return;

    let frame: number | null = null;
    let active = -1;
    let teardownMode: (() => void) | null = null;

    function paint() {
      frame = null;
      const rect = runway!.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const progress = travel > 0 ? clamp(-rect.top / travel, 0, 1) : 0;
      const f = progress * (total - 1);
      fRef.current = f;

      for (let i = 0; i < total; i++) {
        const card = cardRefs.current[i];
        if (!card) continue;

        const d = i - f;
        const distance = Math.abs(d);
        const c = clamp(1 - distance, 0, 1);
        // Smoothstep. The ONLY "how close to the front" factor; every
        // other value below consumes it.
        const ease = c * c * (3 - 2 * c);
        const ahead = d > 0;

        // Rest at 34 degrees, not 54: at 54 a 44px tab foreshortens to
        // 12px and the back of the drawer reads as a smear.
        const rotateX = ahead ? 34 * (1 - ease) : 34 + 6 * (1 - ease) - 34 * ease;
        // A uniform 14px step up the stair, like an accordion organiser's
        // dividers; archived files drop 10px each toward the lip.
        const rawY = ahead ? -d * 14 : 60 + -d * 10;
        const y = clamp(rawY, -196, 200) * (1 - ease);
        // Negative Z for the archived: they go INTO the cabinet, behind
        // the face. No Z retreat for the stair — depth there comes from
        // the step, the shadow and the overlap.
        const z = ahead ? 130 * ease : 130 * ease + (1 - ease) * -20;
        // Almost no falloff: in an accordion the dividers are all the
        // same size, they only step.
        const scale = 1 - clamp(distance, 0, 12) * 0.004 + 0.05 * ease;
        const layer = ahead ? 500 - d * 12 + ease * 400 : 300 + (total + d) * 6;

        card.style.transform =
          `translate(-50%, 0) translateY(${y.toFixed(2)}px) translateZ(${z.toFixed(2)}px) ` +
          `rotateX(${rotateX.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        card.style.zIndex = String(Math.round(layer));
        card.style.setProperty('--folder-ease', ease.toFixed(4));
        // Deep in the stack the tab thins down to the height of one step
        // and drops its title and date: fourteen full tabs at a 10px pitch
        // bury each other.
        card.classList.toggle('is-spine', d < -OPEN_BAND);
        card.classList.toggle('is-open', distance < OPEN_BAND);
      }

      const index = clamp(Math.round(f), 0, total - 1);
      if (index !== active) {
        active = index;
        const plate = progressRef.current;
        if (plate) plate.textContent = folders[index].caseNo;
        markRefs.current.forEach((mark, i) => {
          if (!mark) return;
          if (i === index) mark.setAttribute('aria-current', 'true');
          else mark.removeAttribute('aria-current');
        });
      }
    }

    function onScroll() {
      if (frame === null) frame = window.requestAnimationFrame(paint);
    }

    // Arrow keys step one file, and ONLY while the stage is pinned —
    // outside that range they have to stay ordinary page scrolling.
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName ?? '')) return;
      const rect = runway!.getBoundingClientRect();
      if (rect.top > 0 || rect.bottom < window.innerHeight) return;
      event.preventDefault();
      goTo(Math.round(fRef.current) + (event.key === 'ArrowDown' ? 1 : -1));
    }

    function buildCabinet() {
      section!.classList.add('is-cabinet');
      cabinetRef.current = true;
      runway!.style.height = `${total * VH_PER_FILE + STAGE_VH}vh`;

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      window.addEventListener('keydown', onKeyDown);
      paint();

      return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        window.removeEventListener('keydown', onKeyDown);
        if (frame !== null) window.cancelAnimationFrame(frame);
        frame = null;
        cabinetRef.current = false;
        section!.classList.remove('is-cabinet');
        runway!.style.height = '';
        cardRefs.current.forEach(card => {
          if (!card) return;
          card.style.transform = '';
          card.style.zIndex = '';
          card.style.removeProperty('--folder-ease');
          card.classList.remove('is-spine', 'is-open');
        });
        active = -1;
      };
    }

    function build() {
      teardownMode?.();
      teardownMode = null;
      if (window.matchMedia(REDUCED_QUERY).matches) return;
      if (!window.matchMedia(DESKTOP_QUERY).matches) return;
      teardownMode = buildCabinet();
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
      teardownMode?.();
      teardownMode = null;
    };
  }, [folders, total, goTo]);

  if (!total) return null;

  // A click on a TAB always jumps the index; a click on the body opens,
  // but only once the file is actually at the front — otherwise it is a
  // "bring this one here", not an "open it".
  //
  // Keyboard activation is exempt and returns early. `detail === 0` is the
  // standard "this click came from Enter/Space, not a pointer" test, and
  // without it there is a live race: onFocus fires goTo(i), which scrolls
  // smoothly, and an Enter pressed before that scroll lands still sees a
  // far-away `f` and gets swallowed into a second jump instead of opening
  // the file. Caught in a Playwright pass — it reproduced at a 1000ms wait
  // and not at 1200ms. Enter on a focused card is always "open": native
  // <a> activation, no key handler, no dependence on scroll timing.
  function onCardClick(event: React.MouseEvent<HTMLAnchorElement>, index: number) {
    if (!cabinetRef.current || event.detail === 0) return;
    const onTab = event.target instanceof Element && event.target.closest('.lana-folder-tab');
    if (onTab || Math.abs(index - fRef.current) >= OPEN_BAND) {
      event.preventDefault();
      goTo(index);
    }
  }

  return (
    <section className="lana-archive lana-cabinet" aria-label="Expedientes anteriores" ref={sectionRef}>
      <h2 className="lana-archive-head">Archivero</h2>
      <div className="lana-cabinet-runway" ref={runwayRef}>
        <div className="lana-cabinet-stage">
          <p className="lana-cabinet-progress" aria-hidden="true">
            <span ref={progressRef}>{folders[0].caseNo}</span> / {String(total).padStart(3, '0')}
          </p>

          {/* A REAL ordered list of N real links, in reading order. The
              cabinet is a presentation layer over it: run or not, the
              files exist for the crawler and the screen reader. This is
              also the flat grid — same markup, no second copy. */}
          <ol className="lana-cabinet-folders lana-archive-grid">
            {folders.map((folder, index) => (
              <li
                className="lana-cab-folder"
                key={folder.id}
                ref={element => {
                  cardRefs.current[index] = element;
                }}
              >
                <Link
                  className="lana-folder lana-folder-card"
                  href={articlePath(folder.id)}
                  /* Tabbing through the list pulls each file to the front,
                     so focus can never land on something invisible. */
                  onFocus={() => goTo(index)}
                  onClick={event => onCardClick(event, index)}
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
              </li>
            ))}
          </ol>

          {/* Position rail: 24x2px in --pb-ink for the open file, 13x1px in
              --pb-rule for the rest. Operable, not just an indicator — it
              is the same "jump the index" affordance as a tab, in one
              place, for a reader who is scrubbing rather than reading. */}
          <div className="lana-cabinet-index-rail" role="group" aria-label="Posición en el archivero">
            {folders.map((folder, index) => (
              <button
                className="lana-cabinet-mark"
                type="button"
                key={folder.id}
                aria-label={`Expediente ${folder.caseNo}`}
                aria-current={index === 0 ? 'true' : undefined}
                onClick={() => goTo(index)}
                ref={element => {
                  markRefs.current[index] = element;
                }}
              />
            ))}
          </div>

          {/* The cabinet itself. Painted steel: four gradients and one flat
              colour, eleven warm greys derived from --pb-rule and --pb-gray
              (styles/product-hubs.css). No transform anywhere in here — it
              has to stay at Z 0 so the archived files at Z -20 file in
              BEHIND it. */}
          <div className="lana-cabinet-drawer" aria-hidden="true">
            <span className="lana-cabinet-steel-rail lana-cabinet-steel-rail-l" />
            <span className="lana-cabinet-steel-rail lana-cabinet-steel-rail-r" />
            <span className="lana-cabinet-lip" />
            <div className="lana-cabinet-drawer-face">
              <span className="lana-cabinet-recess">
                <span className="lana-cabinet-plate">Archivero · La Lana del Deporte</span>
              </span>
              <span className="lana-cabinet-handle" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
