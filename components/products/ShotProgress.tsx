'use client';

import { useEffect, useId, useRef, useState } from 'react';

// The reading-progress indicator: the product's own mark, filling from the
// bottom as the reader advances through the article body. Fixed to the
// viewport corner; progress is measured against the article body element,
// not the whole document, so the mark is full exactly when the reporting
// ends (related links and footer don't count as reading).
//
// Was Noticias-only, and was always the shot glass — the bottle metaphor
// that product runs on. Since 2026-08-07 every product gets one, drawn as
// the same mark it signs its Opinión callout with (styles/tokens.css's
// --mark-* set, styles/product-hubs.css's .shot-opinion-kicker): the
// isotope bracket for Noticias, a stack of coins for La Lana, the
// lemniscate for Infinitas, a forward arrow for TFBR. One object per
// product, doing two jobs, instead of a glass that only ever meant
// something on one of the four.
//
// Filled via an SVG <mask> rather than the <clipPath> the glass used:
// clipPath sees fill geometry only, and two of these marks are strokes.
// A mask renders the shape (stroked or filled) as the alpha channel, so
// one mechanic covers all four and the paths stay identical to the CSS.
//
// Plain rAF-throttled scroll math, no GSAP: this must track position
// exactly (a progress indicator that eases is lying), and a passive
// listener + one write per frame is cheaper than a scrubbed tween for a
// single element.

// `body` is the mask: whatever is opaque here is where the fill shows.
// `outline` draws OUTSIDE the mask, for a mark that has a permanent shell
// the fill rises inside of (only the glass does).
type Mark = { viewBox: string; body: React.ReactNode; outline?: React.ReactNode };

// Same geometry as the --mark-* tokens, at the scale each viewBox implies.
// Keep the two in sync: these are the same four objects, and a reader who
// sees a coin stack fill in the corner should meet the same coin stack on
// the callout below.
const MARKS: Record<string, Mark> = {
  // Noticias keeps the shot glass it has always had, outline and all: the
  // liquid rises inside a shell that is always drawn. The other three are
  // solid marks that fill from a faint ghost, which is why this one alone
  // carries an `outline` and no track. (The isotope bracket briefly stood
  // in here; it was reverted — that symbol closes the body and does not
  // stand for a product.)
  'industry-shots': {
    viewBox: '0 0 36 48',
    body: <path d="M6 10 L30 10 L26 44 L10 44 Z" fill="#fff" />,
    outline: <path className="shot-progress-glass" d="M5 8 L31 8 L26.5 45 L9.5 45 Z" fill="none" />,
  },
  'la-lana': {
    viewBox: '0 0 32 30',
    body: (
      <g fill="#fff">
        <ellipse cx="16" cy="6" rx="14" ry="4.8" />
        <ellipse cx="16" cy="15" rx="14" ry="4.8" />
        <ellipse cx="16" cy="24" rx="14" ry="4.8" />
      </g>
    ),
  },
  infinitas: {
    viewBox: '0 0 48 28',
    body: (
      <path
        d="M24 14c3.4-5.6 6.2-8.6 10.4-8.6a8.6 8.6 0 0 1 0 17.2c-4.2 0-7-3-10.4-8.6-3.4-5.6-6.2-8.6-10.4-8.6a8.6 8.6 0 0 0 0 17.2c4.2 0 7-3 10.4-8.6Z"
        fill="none"
        stroke="#fff"
        strokeWidth="5.2"
        strokeLinecap="round"
      />
    ),
  },
  'futbol-business-review': {
    viewBox: '0 0 32 28',
    body: (
      <path
        d="M2.4 14h24.8M17.4 4.4 27.8 14 17.4 23.6"
        fill="none"
        stroke="#fff"
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
};

export function ShotProgress({
  source = 'industry-shots',
  targetSelector = '.article-body',
}: {
  source?: string;
  targetSelector?: string;
}) {
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);
  // useId, not a literal: two article bodies on one document would otherwise
  // share a mask id and the second mark would fill from the first's shape.
  const maskId = `shot-progress-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    const target = document.querySelector<HTMLElement>(targetSelector);
    if (!target) return;

    const measure = () => {
      frame.current = 0;
      const rect = target.getBoundingClientRect();
      const viewport = window.innerHeight;
      // 0 when the body's top reaches the lower third of the screen, 1
      // when its bottom passes the same line — matches where the reader's
      // eyes actually are rather than raw document offsets.
      const readLine = viewport * 0.7;
      const total = rect.height;
      const advanced = readLine - rect.top;
      setProgress(Math.min(1, Math.max(0, total > 0 ? advanced / total : 0)));
    };

    const onScroll = () => {
      if (!frame.current) frame.current = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [targetSelector]);

  const pct = Math.round(progress * 100);
  const mark = MARKS[source] ?? MARKS['industry-shots'];
  // viewBox height drives the fill geometry, so a mark can change its own
  // aspect ratio without touching the math.
  const height = Number(mark.viewBox.split(' ')[3]);
  const fillHeight = height * progress;

  return (
    <div
      className="shot-progress"
      data-product={source}
      role="progressbar"
      aria-label="Progreso de lectura"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      data-full={progress >= 0.995 ? 'true' : undefined}
    >
      <svg
        viewBox={mark.viewBox}
        width="30"
        height={mark.outline ? 40 : 28}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <mask id={maskId}>{mark.body}</mask>
        </defs>
        <g mask={`url(#${maskId})`}>
          {/* The unread part stays visible as a faint ghost, so a solid
              mark reads as an object at 0% instead of appearing from
              nothing. The glass doesn't need it — its outline does that
              job, and a ghost inside would read as a half-full glass. */}
          {!mark.outline && (
            <rect className="shot-progress-track" x="0" y="0" width="100%" height="100%" />
          )}
          <rect
            className="shot-progress-fill"
            x="0"
            y={height - fillHeight}
            width="100%"
            height={fillHeight}
          />
        </g>
        {mark.outline}
      </svg>
      <span className="shot-progress-pct">{pct}%</span>
    </div>
  );
}
