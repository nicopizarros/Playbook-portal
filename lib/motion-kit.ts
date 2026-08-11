'use client';

import { gsap } from '@/lib/gsap';
import { splitFigure, parseNumeric, formatNumeric, FIGURE_INLINE_RE } from '@/lib/figures';

// The motion primitives La Lectura invented for the article page, lifted out
// of components/article/ArticleMotion.tsx (2026-08-10) so the rest of the
// site can speak the same language instead of growing a second, subtly
// different one.
//
// Everything here is progressive enhancement over a server-rendered FINAL
// state: each primitive reads the value that is already in the DOM, animates
// toward it, and registers a cleanup that puts the element back exactly as
// the server wrote it. A reader with no JS, or with prefers-reduced-motion,
// sees the complete page with nothing missing — the callers are responsible
// for checking that media query before calling in (both do).
//
// The scope object is the whole lifecycle contract: primitives push their
// tweens and undo functions into it, and the mounting component disposes the
// scope in its effect cleanup. No primitive keeps state of its own, so two
// components can drive the same kit over different parts of the page without
// coordinating.

type Tween = { kill(): void; scrollTrigger?: { kill(): void } | null };

export type MotionScope = { tweens: Tween[]; cleanups: (() => void)[] };

export function createScope(): MotionScope {
  return { tweens: [], cleanups: [] };
}

export function disposeScope(scope: MotionScope): void {
  scope.tweens.forEach(tween => {
    tween.scrollTrigger?.kill();
    tween.kill();
  });
  scope.cleanups.forEach(fn => fn());
  scope.tweens.length = 0;
  scope.cleanups.length = 0;
}

// ——— Drawn rules. A divider draws itself left to right as the reader
// reaches it. Transform-only, so a 2px rule costs nothing to animate.
export function drawIn(scope: MotionScope, elements: Iterable<HTMLElement>): void {
  for (const rule of elements) {
    gsap.set(rule, { scaleX: 0, transformOrigin: 'left center' });
    scope.tweens.push(
      gsap.to(rule, {
        scaleX: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: rule, start: 'top 92%', once: true },
      }),
    );
    scope.cleanups.push(() => rule.style.removeProperty('transform'));
  }
}

// ——— Cover parallax. The photo drifts inside its fixed frame as the page
// scrolls. Pre-scaled 1.12 so the ±5% drift never exposes an edge, and
// transform-only so it has zero layout impact — which matters because every
// photo frame on this site is a hard aspect-ratio + object-fit:cover box.
export function parallax(scope: MotionScope, frame: HTMLElement, img: HTMLElement): void {
  gsap.set(img, { scale: 1.12 });
  scope.tweens.push(
    gsap.fromTo(
      img,
      { yPercent: -5 },
      {
        yPercent: 5,
        ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 0.4 },
      },
    ),
  );
  scope.cleanups.push(() => img.style.removeProperty('transform'));
}

// ——— Staggered rise. A group's children arrive in sequence rather than all
// at once. Deliberately NOT for anything already carrying `.reveal`:
// components/ScrollReveal.tsx owns those and staggers them itself, and two
// observers tweening the same opacity fight each other.
export function staggerIn(scope: MotionScope, group: HTMLElement, children: HTMLElement[]): void {
  if (!children.length) return;
  gsap.set(children, { opacity: 0, y: 8 });
  scope.tweens.push(
    gsap.to(children, {
      opacity: 1,
      y: 0,
      duration: 0.45,
      stagger: 0.12,
      ease: 'power2.out',
      scrollTrigger: { trigger: group, start: 'top 88%', once: true },
    }),
  );
  scope.cleanups.push(() => {
    children.forEach(child => {
      child.style.removeProperty('opacity');
      child.style.removeProperty('transform');
    });
  });
}

// ——— Count-ups. Any element whose text is a figure ticks up from zero on
// first view, keeping its prefix, separators, decimals and suffix
// ("US$9,612 millones" counts the 9,612 and leaves the rest alone — that is
// what lib/figures exists for). The element's rendered width is locked to
// its final size BEFORE the first frame, so a running number never reflows
// the line it sits on.
export function countUp(scope: MotionScope, elements: Iterable<HTMLElement>): void {
  for (const el of elements) {
    const finalText = el.textContent || '';
    const parts = splitFigure(finalText);
    const numeric = parts && parseNumeric(parts.num);
    if (!parts || !numeric) continue;
    el.style.display = 'inline-block';
    el.style.minWidth = `${el.offsetWidth}px`;
    const counter = { value: 0 };
    el.textContent = parts.pre + formatNumeric(0, numeric.decimals) + parts.post;
    scope.tweens.push(
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
    scope.cleanups.push(() => {
      el.textContent = finalText;
      el.style.removeProperty('display');
      el.style.removeProperty('min-width');
    });
  }
}

// ——— Inline figure highlight. Money and percentages sitting in plain prose
// get a marker swipe drawn under them on scroll. Done with a TreeWalker over
// real text nodes rather than a string replace over HTML: the roots handed in
// here come from three different render paths (TipTap output, editor HTML,
// server-composed JSX) and only the DOM is guaranteed to be well-formed for
// all of them.
//
// `cap` is not decoration: past a handful of swipes a page reads as a
// highlighter accident rather than an annotated one. Callers pass the cap
// that suits their surface (a long article can carry more than a card grid).
export function highlightFigures(
  scope: MotionScope,
  roots: Iterable<HTMLElement>,
  cap: number,
  skipSelector = 'strong, a, aside, figure, mark, h1, h2, h3, figcaption',
): void {
  const marks: HTMLElement[] = [];

  for (const root of roots) {
    if (marks.length >= cap) break;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const el = node.parentElement;
        if (!el) return NodeFilter.FILTER_REJECT;
        return el.closest(skipSelector) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      },
    });
    const textNodes: Text[] = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) textNodes.push(n as Text);
    for (const node of textNodes) {
      if (marks.length >= cap) break;
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
  }

  marks.forEach(mark => {
    mark.style.setProperty('--lect-fx', '0');
    scope.tweens.push(
      gsap.to(mark, {
        '--lect-fx': 1,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: mark, start: 'top 85%', once: true },
      }),
    );
  });

  scope.cleanups.push(() => {
    marks.forEach(mark => {
      const textNode = document.createTextNode(mark.textContent || '');
      mark.parentNode?.replaceChild(textNode, mark);
    });
  });
}
