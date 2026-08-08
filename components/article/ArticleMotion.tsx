'use client';

import { useEffect } from 'react';
import { gsap } from '@/lib/gsap';
// Registered locally, NOT in lib/gsap's shared entry point — per that
// file's guidance (same as DeparturesBoard): only article pages use the
// scramble here, so the plugin shouldn't ship to every GSAP route.
import { ScrambleTextPlugin } from '@/vendor/gsap/esm/ScrambleTextPlugin.js';
import { splitFigure, parseNumeric, formatNumeric, FIGURE_TEXT_RE, FIGURE_INLINE_RE } from '@/lib/figures';

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
    if (photo && cover) {
      gsap.set(cover, { scale: 1.12 });
      tweens.push(
        gsap.fromTo(
          cover,
          { yPercent: -5 },
          {
            yPercent: 5,
            ease: 'none',
            scrollTrigger: { trigger: photo, start: 'top bottom', end: 'bottom top', scrub: 0.4 },
          },
        ),
      );
      cleanups.push(() => {
        cover.style.removeProperty('transform');
      });
    }

    // 3 — Drawn rules (plus any device baseline carrying .lect-draw,
    // e.g. the timeline's spine).
    document.querySelectorAll<HTMLElement>('.lect-rule, .article-body hr, .lect-draw').forEach(rule => {
      gsap.set(rule, { scaleX: 0, transformOrigin: 'left center' });
      tweens.push(
        gsap.to(rule, {
          scaleX: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: rule, start: 'top 92%', once: true },
        }),
      );
      cleanups.push(() => rule.style.removeProperty('transform'));
    });

    // 3b — Device choreography (round-3 collection): children of any
    // [data-lect-stagger] group rise in sequence, and the Reparto bar's
    // segments grow left-to-right. Both once, on first view.
    document.querySelectorAll<HTMLElement>('[data-lect-stagger]').forEach(group => {
      const children = Array.from(group.children) as HTMLElement[];
      if (!children.length) return;
      gsap.set(children, { opacity: 0, y: 8 });
      tweens.push(
        gsap.to(children, {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: { trigger: group, start: 'top 88%', once: true },
        }),
      );
      cleanups.push(() => {
        children.forEach(child => {
          child.style.removeProperty('opacity');
          child.style.removeProperty('transform');
        });
      });
    });
    document.querySelectorAll<HTMLElement>('.lect-rep-bar').forEach(bar => {
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
    const marks: HTMLElement[] = [];
    const body = document.querySelector<HTMLElement>('.article-body');
    if (body) {
      const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const el = node.parentElement;
          if (!el) return NodeFilter.FILTER_REJECT;
          if (el.closest('strong, a, aside, figure, mark, .lect-jugada, .lect-device, .money-trail, h2, h3, figcaption')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const textNodes: Text[] = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) textNodes.push(n as Text);
      for (const node of textNodes) {
        if (marks.length >= MAX_INLINE_FIGS) break;
        const text = node.textContent || '';
        FIGURE_INLINE_RE.lastIndex = 0;
        const match = FIGURE_INLINE_RE.exec(text);
        if (!match) continue;
        const mark = document.createElement('mark');
        mark.className = 'lect-fig';
        const rest = node.splitText(match.index);
        rest.splitText(match[0].length);
        mark.textContent = rest.textContent;
        rest.parentNode?.replaceChild(mark, rest);
        marks.push(mark);
      }
      marks.forEach(mark => {
        mark.style.setProperty('--lect-fx', '0');
        tweens.push(
          gsap.to(mark, {
            '--lect-fx': 1,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: { trigger: mark, start: 'top 85%', once: true },
          }),
        );
      });
      cleanups.push(() => {
        marks.forEach(mark => {
          const textNode = document.createTextNode(mark.textContent || '');
          mark.parentNode?.replaceChild(textNode, mark);
        });
      });
    }

    // 6 — Inline count-ups.
    const numberEls = new Set<HTMLElement>();
    document.querySelectorAll<HTMLElement>('[data-lect-countup]').forEach(el => numberEls.add(el));
    document.querySelectorAll<HTMLElement>('.article-body strong').forEach(el => {
      if (FIGURE_TEXT_RE.test(el.textContent || '')) numberEls.add(el);
    });
    numberEls.forEach(el => {
      const finalText = el.textContent || '';
      const parts = splitFigure(finalText);
      const numeric = parts && parseNumeric(parts.num);
      if (!parts || !numeric) return;
      // Lock the final width so the running number never reflows the line.
      el.style.display = 'inline-block';
      el.style.minWidth = `${el.offsetWidth}px`;
      const counter = { value: 0 };
      el.textContent = parts.pre + formatNumeric(0, numeric.decimals) + parts.post;
      tweens.push(
        gsap.to(counter, {
          value: numeric.value,
          duration: 1.4,
          ease: 'power3.out',
          onUpdate() {
            el.textContent = parts.pre + formatNumeric(counter.value, numeric.decimals) + parts.post;
          },
          onComplete() {
            el.textContent = finalText;
          },
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }),
      );
      cleanups.push(() => {
        el.textContent = finalText;
        el.style.removeProperty('display');
        el.style.removeProperty('min-width');
      });
    });

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
