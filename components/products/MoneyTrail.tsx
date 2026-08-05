'use client';

import { useEffect, useMemo, useRef } from 'react';
// Importing from the shared entry point also registers ScrollTrigger,
// which the scrollTrigger tween vars below rely on.
import { gsap } from '@/lib/gsap';

// La Lana del Deporte's recurring interactive device: the departures-board
// motif from the card art (routes, timestamps, money moving across
// borders) as an animated route line that draws itself as the reader
// reaches it, one arc per leg of the actual flow described in the story
// (e.g. México → Europa for the AR Monex piece). Used two ways:
//   - Hub masthead (`scrub` off): draws once when it enters the viewport.
//   - Article body (`scrub` on): drawing progress is tied to scroll, so
//     the money literally travels as the reader advances through the
//     story — the motif working as a reading device, not a decoration.
// Stops come from the "Ruta del dinero:" authoring convention (see
// lib/product-hubs.ts) or are passed directly by the hub.

const VIEW_W = 1000;
const VIEW_H = 170;
const BASE_Y = 118;
const ARC_Y = 34;
const PAD_X = 70;

function routePath(count: number): { d: string; xs: number[] } {
  const xs = Array.from({ length: count }, (_, i) =>
    count === 1 ? VIEW_W / 2 : PAD_X + (i * (VIEW_W - PAD_X * 2)) / (count - 1),
  );
  let d = `M ${xs[0]} ${BASE_Y}`;
  for (let i = 1; i < xs.length; i++) {
    const cx = (xs[i - 1] + xs[i]) / 2;
    d += ` Q ${cx} ${ARC_Y} ${xs[i]} ${BASE_Y}`;
  }
  return { d, xs };
}

export function MoneyTrail({ stops, scrub = false }: { stops: string[]; scrub?: boolean }) {
  const rootRef = useRef<SVGSVGElement>(null);
  const { d, xs } = useMemo(() => routePath(stops.length), [stops.length]);

  useEffect(() => {
    const svg = rootRef.current;
    if (!svg) return;
    const path = svg.querySelector<SVGPathElement>('.money-trail-line');
    const marks = svg.querySelectorAll<SVGElement>('.money-trail-stop');
    if (!path) return;

    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      path.style.strokeDashoffset = '0';
      return;
    }

    gsap.set(path, { strokeDashoffset: length });
    gsap.set(marks, { opacity: 0, y: 6 });

    // Scrubbed: the line's draw progress follows the reader's scroll
    // through the surrounding text. One-shot: draw on first entry.
    const lineTween = gsap.to(path, {
      strokeDashoffset: 0,
      ease: scrub ? 'none' : 'power2.out',
      duration: scrub ? 1 : 1.6,
      scrollTrigger: scrub
        ? { trigger: svg, start: 'top 85%', end: 'bottom 35%', scrub: 0.4 }
        : { trigger: svg, start: 'top 88%' },
    });
    const markTween = gsap.to(marks, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.14,
      ease: 'power2.out',
      scrollTrigger: scrub
        ? { trigger: svg, start: 'top 85%', end: 'bottom 35%', scrub: 0.4 }
        : { trigger: svg, start: 'top 88%' },
    });

    return () => {
      lineTween.scrollTrigger?.kill();
      lineTween.kill();
      markTween.scrollTrigger?.kill();
      markTween.kill();
    };
  }, [scrub, d]);

  if (stops.length < 2) return null;

  return (
    <figure className="money-trail" role="img" aria-label={`Ruta del dinero: ${stops.join(' a ')}`}>
      <svg
        ref={rootRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        focusable="false"
      >
        {/* Faint full route underneath, like the printed line on a board;
            the accent line draws itself on top of it. */}
        <path className="money-trail-ghost" d={d} fill="none" />
        <path className="money-trail-line" d={d} fill="none" />
        {stops.map((stop, i) => (
          <g className="money-trail-stop" key={`${stop}-${i}`}>
            <circle cx={xs[i]} cy={BASE_Y} r="7" className="money-trail-dot" />
            <text
              x={xs[i]}
              y={BASE_Y + 34}
              textAnchor={i === 0 ? 'start' : i === stops.length - 1 ? 'end' : 'middle'}
              className="money-trail-label"
            >
              {stop.toUpperCase()}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
