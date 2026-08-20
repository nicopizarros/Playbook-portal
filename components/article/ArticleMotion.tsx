'use client';

import { useEffect } from 'react';
import { gsap } from '@/lib/gsap';
// Registered locally, NOT in lib/gsap's shared entry point — per that
// file's guidance (same as DeparturesBoard): only article pages use the
// scramble here, so the plugin shouldn't ship to every GSAP route.
import { ScrambleTextPlugin } from '@/vendor/gsap/esm/ScrambleTextPlugin.js';
import { FIGURE_TEXT_RE } from '@/lib/figures';
// The five primitives this page shares with the hubs and the homepage
// (2026-08-10). What stays local below is what only an article has: the
// scramble-driven flaps, and the four data devices (Reparto, Duelo, Serie,
// pull-figure) whose geometry has no equivalent anywhere else.
import {
  type MotionScope,
  drawIn,
  parallax,
  staggerIn,
  countUp,
  highlightFigures,
} from '@/lib/motion-kit';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrambleTextPlugin);
}

// La Lectura's shared motion kit (article redesign, 2026-08-05; round 2
// same day added the jugada flap and the inline figure highlight). One
// mount, six devices, all progressive enhancement over server-rendered
// final states — no-JS and prefers-reduced-motion readers get the complete
// article with nothing missing:
//   1. Kicker scramble: the publication chip flaps into place like the
//      split-flap boards the product hubs already use.
//   2. Cover parallax: the cover photo drifts subtly inside its fixed
//      16/10 frame as the page scrolls (transform-only, pre-scaled so no
//      edge ever shows — zero layout impact).
//   3. Drawn rules: .lect-rule dividers and in-body <hr>s draw themselves
//      in as the reader reaches them.
//   4. Jugada flap-in: the connection strip's sides scramble into place
//      like departures-board cells.
//   5. Inline figure highlight: unbolded money/percent figures in prose
//      get a marker swipe drawn on scroll (capped, DOM-side, reversible).
//   6. Inline count-ups: any <strong> in the body whose entire text is a
//      figure ("US$9,612 millones", "22%"), plus the pull-figure beats
//      ([data-lect-countup]), tick up from 0 on first view. The element's
//      width is locked to its server-rendered (final) size first, so the
//      surrounding text never reflows while the number runs.
//
// Everything is queried from the DOM rather than passed as props on
// purpose: the body markup comes from three different render paths
// (TipTap HTML, HTML teaser, plain-text paragraphs) and this stays
// correct for all of them without threading structure through the page.

const FLAP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·';

// Inline figure highlight cap: enough for a data-dense story to read as
// annotated, few enough that a page never becomes a highlighter accident.
const MAX_INLINE_FIGS = 6;

export function ArticleMotion() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tweens: { kill(): void; scrollTrigger?: { kill(): void } | null }[] = [];
    const cleanups: (() => void)[] = [];
    // Same two arrays, handed to the shared primitives as one object so they
    // can register their own tweens and undo functions on this component's
    // lifecycle without owning any state themselves.
    const scope: MotionScope = { tweens, cleanups };

    // 1 — Kicker scramble. Width-locked before the flap so the chip (and
    // anything after it on the line) never shifts.
    const kicker = document.querySelector<HTMLElement>('.article-kicker .tag');
    if (kicker && kicker.textContent) {
      const finalText = kicker.textContent;
      const width = kicker.offsetWidth;
      kicker.style.minWidth = `${width}px`;
      tweens.push(
        gsap.to(kicker, {
          duration: 0.9,
          delay: 0.1,
          scrambleText: { text: finalText, chars: FLAP_CHARS, speed: 0.4 },
        }),
      );
      cleanups.push(() => {
        kicker.textContent = finalText;
        kicker.style.removeProperty('min-width');
      });
    }

    // 2 — Cover parallax. Pre-scaled 1.12 so ±5% drift never exposes the
    // frame; transform-only, scrubbed, no layout involvement.
    const photo = document.querySelector<HTMLElement>('.article-photo');
    const cover = photo?.querySelector<HTMLElement>('img');
    if (photo && cover) parallax(scope, photo, cover);

    // 3 — Drawn rules (plus any device baseline carrying .lect-draw,
    // e.g. the timeline's spine).
    drawIn(scope, document.querySelectorAll<HTMLElement>('.lect-rule, .article-body hr, .lect-draw'));

    // 3b — Device choreography (round-3 collection): children of any
    // [data-lect-stagger] group rise in sequence, and the Reparto bar's
    // segments grow left-to-right. Both once, on first view.
    document.querySelectorAll<HTMLElement>('[data-lect-stagger]').forEach(group => {
      staggerIn(scope, group, Array.from(group.children) as HTMLElement[]);
    });
    // .lect-res-body joined 2026-08-13: the Resultados panel's delta bars
    // grow with the same left-to-right choreography as the Reparto's
    // segments — one primitive, two devices.
    // [data-lect-grow] generalizes this treatment: any container carrying
    // it gets its [data-lect-seg] children grown left-to-right on first
    // view — the hook the roadmap devices (Contrato term bar, Votación
    // tally, Ranking/Cascada bars) opt into without new JS per device.
    document.querySelectorAll<HTMLElement>('.lect-rep-bar, .lect-res-body, [data-lect-grow]').forEach(bar => {
      const segments = Array.from(bar.querySelectorAll<HTMLElement>('[data-lect-seg]'));
      if (!segments.length) return;
      gsap.set(segments, { scaleX: 0, transformOrigin: 'left center' });
      tweens.push(
        gsap.to(segments, {
          scaleX: 1,
          duration: 0.6,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: { trigger: bar, start: 'top 88%', once: true },
        }),
      );
      cleanups.push(() => segments.forEach(seg => seg.style.removeProperty('transform')));
    });
    // The Duelo's butterfly bars grow out of the centre line together, so
    // the eye lands on the ratio before it lands on either number. Below
    // the 640px breakpoint lectura.css stacks the two sides and both bars
    // hang off the left edge, so the origin has to follow that layout —
    // same breakpoint, kept in step deliberately.
    const duelStacked = window.matchMedia('(max-width:640px)').matches;
    document.querySelectorAll<HTMLElement>('.lect-duelo-rows').forEach(rows => {
      const bars = Array.from(rows.querySelectorAll<HTMLElement>('[data-lect-duelo-bar]'));
      if (!bars.length) return;
      bars.forEach(bar => {
        gsap.set(bar, {
          scaleX: 0,
          transformOrigin: duelStacked || bar.dataset.side === 'b' ? 'left center' : 'right center',
        });
      });
      tweens.push(
        gsap.to(bars, {
          scaleX: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: { trigger: rows, start: 'top 88%', once: true },
        }),
      );
      cleanups.push(() => bars.forEach(bar => bar.style.removeProperty('transform')));
    });

    // 3b- — The Pirámide builds itself, and the point of the choreography is
    // the thing that does NOT happen. The detached tier drops in first and
    // settles above the gap; the two connector stubs then draw toward each
    // other and stop short, so the reader watches the link fail to close
    // rather than reading a caption about it. Only then do the tiers widen
    // out of the centre line, apex first, following the order the eye reads
    // them in.
    //
    // Its own tween rather than [data-lect-grow] because that primitive
    // grows from the LEFT edge, which would draw a pyramid leaning against a
    // wall. No-JS leaves every piece at its resting position, which is the
    // finished structure.
    document.querySelectorAll<HTMLElement>('.lect-piramide').forEach(device => {
      const stack = device.querySelector<HTMLElement>('.lect-pir-stack');
      const tiers = stack ? Array.from(stack.querySelectorAll<HTMLElement>('[data-lect-seg]')) : [];
      if (!tiers.length) return;
      const outside = device.querySelector<HTMLElement>('.lect-pir-outside');
      const stubs = Array.from(device.querySelectorAll<HTMLElement>('.lect-pir-break span'));
      const trigger = { trigger: device, start: 'top 86%', once: true } as const;

      if (outside) {
        gsap.set(outside, { y: -14, opacity: 0 });
        tweens.push(
          gsap.to(outside, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', scrollTrigger: trigger }),
        );
        cleanups.push(() => {
          outside.style.removeProperty('transform');
          outside.style.removeProperty('opacity');
        });
      }
      if (stubs.length) {
        // Each stub grows from the end it hangs off: the upper one downward
        // from the detached tier, the lower one upward from the apex.
        stubs.forEach((stub, i) => {
          gsap.set(stub, { scaleY: 0, transformOrigin: i === 0 ? 'center top' : 'center bottom' });
        });
        tweens.push(
          gsap.to(stubs, {
            scaleY: 1,
            duration: 0.32,
            stagger: 0.1,
            delay: 0.4,
            ease: 'power1.out',
            scrollTrigger: trigger,
          }),
        );
        cleanups.push(() =>
          stubs.forEach(stub => {
            stub.style.removeProperty('transform');
            stub.style.removeProperty('transform-origin');
          }),
        );
      }

      gsap.set(tiers, { scaleX: 0.12, y: 10, opacity: 0, transformOrigin: 'center center' });
      tweens.push(
        gsap.to(tiers, {
          scaleX: 1,
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.12,
          delay: outside ? 0.62 : 0,
          ease: 'power3.out',
          scrollTrigger: trigger,
        }),
      );
      cleanups.push(() =>
        tiers.forEach(tier => {
          tier.style.removeProperty('transform');
          tier.style.removeProperty('opacity');
          tier.style.removeProperty('transform-origin');
        }),
      );
    });

    // 3b0 — The Cotización track's push-in: the whole arc first, then the
    // window where the story actually happens. Scrubbed against scroll
    // rather than fired once, because the point is that the READER drives
    // the zoom and can hold it anywhere, including halfway.
    //
    // Two complete layers cross-fade (buildTrack projects each on its own),
    // so neither is ever drawn with wrong geometry. The transform is only
    // there to sell the movement: the wide layer pushes past the viewer and
    // dissolves, the closing window rises to its correct resting scale of 1.
    // If this never runs, CSS leaves the wide layer showing and the detail
    // strip underneath still carries the closing numbers.
    document.querySelectorAll<HTMLElement>('.lect-cot-stage').forEach(stage => {
      const wide = stage.querySelector<SVGGElement>('.lect-cot-wide');
      const zoom = stage.querySelector<SVGGElement>('.lect-cot-zoom');
      if (!wide || !zoom) return;
      // Origin at the right edge, mid-height: the closing point is the last
      // one on the axis, so pushing in about it keeps the moment the device
      // exists to show anchored while everything else slides away.
      gsap.set([wide, zoom], { transformOrigin: '92% 50%' });
      // Two scrubbed tweens rather than a timeline: lib/gsap.ts types only
      // the surface the app actually uses, and widening that shared
      // interface for one call site is the wrong trade. Both are driven by
      // scroll position, so they cannot drift apart — the offset windows
      // below are what give the hand-off its overlap.
      tweens.push(
        gsap.to(wide, {
          scale: 2.6,
          opacity: 0,
          ease: 'power2.in',
          scrollTrigger: { trigger: stage, start: 'top 78%', end: 'top 40%', scrub: 0.6 },
        }),
        gsap.fromTo(
          zoom,
          { scale: 0.82, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: { trigger: stage, start: 'top 70%', end: 'top 34%', scrub: 0.6 },
          },
        ),
      );
      cleanups.push(() => {
        [wide, zoom].forEach(g => {
          g.style.removeProperty('transform');
          g.style.removeProperty('opacity');
          g.style.removeProperty('transform-origin');
        });
      });
    });

    // 3b1 — The Venta's crest bar wipes in as a colour block before the
    // rest of the deed settles, so the asset announces itself first — the
    // one moment in the article where a foreign brand takes the page.
    // Clipped rather than scaled: the wordmark inside must not stretch.
    document.querySelectorAll<HTMLElement>('.lect-venta-crest').forEach(crest => {
      gsap.set(crest, { clipPath: 'inset(0 100% 0 0)' });
      tweens.push(
        gsap.to(crest, {
          clipPath: 'inset(0 0% 0 0)',
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: crest, start: 'top 90%', once: true },
        }),
      );
      cleanups.push(() => crest.style.removeProperty('clip-path'));
    });

    // 3b2 — The Cadena's hold bars grow left to right, longest era first
    // in the reading order rather than the animation order: they are
    // staggered down the chain so the eye follows the rail. Same
    // transform-origin and cleanup contract as the Reparto segments above;
    // the widths themselves are inline styles from buildChain, so this
    // only ever animates toward a layout the server already decided.
    document.querySelectorAll<HTMLElement>('.lect-cadena-list').forEach(list => {
      const bars = Array.from(list.querySelectorAll<HTMLElement>('[data-lect-hold]'));
      if (!bars.length) return;
      gsap.set(bars, { scaleX: 0, transformOrigin: 'left center' });
      tweens.push(
        gsap.to(bars, {
          scaleX: 1,
          duration: 0.65,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: { trigger: list, start: 'top 88%', once: true },
        }),
      );
      cleanups.push(() => bars.forEach(bar => bar.style.removeProperty('transform')));
    });

    // 3c — The Serie's lines draw themselves left to right, both at once,
    // so the reader watches the two shapes diverge rather than comparing a
    // finished line against one still arriving. pathLength="1" is set in
    // the markup, so the dash math is the same whatever the geometry is.
    document.querySelectorAll<HTMLElement>('.lect-serie').forEach(chart => {
      const lines = Array.from(chart.querySelectorAll<SVGPolylineElement>('.lect-serie-line'));
      const fades = Array.from(
        chart.querySelectorAll<SVGElement>('.lect-serie-dot, .lect-serie-val, .lect-serie-area'),
      );
      if (!lines.length) return;
      gsap.set(lines, { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(fades, { opacity: 0 });
      tweens.push(
        gsap.to(lines, {
          strokeDashoffset: 0,
          duration: 1.1,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: chart, start: 'top 85%', once: true },
        }),
        gsap.to(fades, {
          opacity: 1,
          duration: 0.4,
          delay: 0.7,
          stagger: 0.02,
          scrollTrigger: { trigger: chart, start: 'top 85%', once: true },
        }),
      );
      cleanups.push(() => {
        lines.forEach(line => {
          line.style.removeProperty('stroke-dasharray');
          line.style.removeProperty('stroke-dashoffset');
        });
        fades.forEach(el => el.style.removeProperty('opacity'));
      });
    });

    // 4 — Flap-ins: the Jugada strip's sides and the Alineación chips
    // scramble into place like the departures board's cells, once, on
    // first view.
    document.querySelectorAll<HTMLElement>('.lect-jugada, .lect-lineup').forEach(strip => {
      const sides = Array.from(
        strip.querySelectorAll<HTMLElement>('.lect-jugada-side, .lect-lineup-name'),
      );
      if (!sides.length) return;
      const finals = sides.map(s => s.textContent || '');
      sides.forEach(side => {
        // Width-locked so the strip never jitters while flapping.
        side.style.minWidth = `${side.offsetWidth}px`;
        side.textContent = '';
      });
      const played = { done: false };
      const observer = new IntersectionObserver(
        entries => {
          if (!entries.some(e => e.isIntersecting) || played.done) return;
          played.done = true;
          sides.forEach((side, i) => {
            tweens.push(
              gsap.to(side, {
                duration: 1,
                delay: i * 0.2,
                scrambleText: { text: finals[i], chars: FLAP_CHARS, speed: 0.4 },
              }),
            );
          });
          observer.disconnect();
        },
        { threshold: 0.4 },
      );
      observer.observe(strip);
      cleanups.push(() => {
        observer.disconnect();
        sides.forEach((side, i) => {
          side.textContent = finals[i];
          side.style.removeProperty('min-width');
        });
      });
    });

    // 5 — Inline figure highlight: money/percent figures sitting in plain
    // prose get a marker swipe that draws in as the reader reaches them —
    // the whole back catalog is full of unbolded figures (measured against
    // the corpus, 2026-08-05) and this makes them scannable with zero
    // re-editing. DOM-side on purpose: a string transform over editor HTML
    // would have to reason about attributes/entities, while a TreeWalker
    // only ever sees real text nodes. Skips text inside <strong> (the
    // count-up's territory), the opinion callout, links, captions and
    // existing devices. Reduced-motion never reaches this code, so the
    // page stays byte-identical to the server render there.
    const body = document.querySelector<HTMLElement>('.article-body');
    if (body) {
      highlightFigures(
        scope,
        [body],
        MAX_INLINE_FIGS,
        // On top of the shared skip list, an article body also has to stay
        // clear of the devices and the opinion callout — those already carry
        // their own treatment and a swipe underneath reads as a mistake.
        'strong, a, aside, figure, mark, .lect-jugada, .lect-device, .money-trail, h2, h3, figcaption',
      );
    }

    // 6 — Inline count-ups.
    const numberEls = new Set<HTMLElement>();
    document.querySelectorAll<HTMLElement>('[data-lect-countup]').forEach(el => numberEls.add(el));
    document.querySelectorAll<HTMLElement>('.article-body strong').forEach(el => {
      if (FIGURE_TEXT_RE.test(el.textContent || '')) numberEls.add(el);
    });
    countUp(scope, numberEls);

    return () => {
      tweens.forEach(t => {
        t.scrollTrigger?.kill();
        t.kill();
      });
      cleanups.forEach(fn => fn());
    };
  }, []);

  return null;
}
