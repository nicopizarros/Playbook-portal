'use client';

import { useEffect } from 'react';
import { gsap } from '@/lib/gsap';
import { createScope, disposeScope, countUp, staggerIn } from '@/lib/motion-kit';

/**
 * Motion for a coverage hub.
 *
 * Same contract as the rest of this codebase's motion (lib/motion-kit.ts):
 * PROGRESSIVE ENHANCEMENT OVER A SERVER-RENDERED FINAL STATE. Every tween
 * reads the value already in the DOM, animates toward it, and registers a
 * cleanup that restores exactly what the server wrote. With JS off, or with
 * prefers-reduced-motion, the page is complete and nothing is missing —
 * which is why the reduced-motion check below returns before any tween is
 * created rather than shortening durations.
 *
 * Hub-specific pieces the shared kit does not cover:
 *  • La Cadena draws itself — one tween on the track's --reached drives the
 *    covered span, the chain links and the current pole together.
 *  • The map fills state by state, established before announced, so the
 *    reader sees the footprint assemble rather than arrive.
 *  • Plaza rows and map states light each other up on hover, which is the
 *    only way to tell which shape is which without labelling 32 paths.
 */
export function HubMotion() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const scope = createScope();
    const q = <T extends Element>(sel: string) => Array.from(document.querySelectorAll<T>(sel));

    // ——— La Cadena. The device is a measurement, so it should be seen being
    // measured: the chain runs out to the line to gain.
    const track = document.querySelector<HTMLElement>('.hubx-chain-track');
    if (track) {
      const target = parseFloat(getComputedStyle(track).getPropertyValue('--reached')) || 0;
      const state = { v: 0 };
      track.style.setProperty('--reached', '0%');
      scope.tweens.push(
        gsap.to(state, {
          v: target,
          duration: 1.15,
          ease: 'power3.out',
          onUpdate: () => track.style.setProperty('--reached', `${state.v}%`),
          scrollTrigger: { trigger: track, start: 'top 85%', once: true },
        }),
      );
      scope.cleanups.push(() => track.style.setProperty('--reached', `${target}%`));
    }

    // ——— Figures tick up. The chain's remaining count is the headline
    // number on the page, so it gets the same treatment as the stat tiles.
    countUp(scope, q<HTMLElement>('.hubx-chain-remaining, .hubx-figure-value'));

    // ——— Grouped reveals.
    for (const [groupSel, childSel] of [
      ['.hubx-figures', '.hubx-figure'],
      ['.hubx-stream', '.hubx-item'],
      ['.hubx-cross', 'a'],
      ['.hubx-season', 'li'],
    ] as const) {
      const group = document.querySelector<HTMLElement>(groupSel);
      if (group) staggerIn(scope, group, Array.from(group.querySelectorAll<HTMLElement>(childSel)));
    }

    // ——— The map assembles. Established plazas first (the league as it is),
    // then the announced markets (where it is going) — the same order the
    // chain tells its story in.
    const map = document.querySelector<HTMLElement>('.hubx-map');
    if (map) {
      const lit = [
        ...map.querySelectorAll<SVGPathElement>('path[data-state="establecida"]'),
        ...map.querySelectorAll<SVGPathElement>('path[data-state="anunciada"]'),
      ];
      if (lit.length) {
        gsap.set(lit, { opacity: 0 });
        scope.tweens.push(
          gsap.to(lit, {
            opacity: 1,
            duration: 0.4,
            stagger: 0.07,
            ease: 'power2.out',
            scrollTrigger: { trigger: map, start: 'top 85%', once: true },
          }),
        );
        scope.cleanups.push(() => lit.forEach(p => p.style.removeProperty('opacity')));
      }
    }

    // ——— Row ↔ state linking. Pointer only, and additive: it adds a class
    // and removes it, so nothing here can leave the page in a changed state.
    const rows = q<HTMLTableRowElement>('.hubx-plazas tbody tr[data-state-key]');
    const listeners: (() => void)[] = [];
    for (const row of rows) {
      const key = row.dataset.stateKey;
      if (!key) continue;
      const path = map?.querySelector<SVGPathElement>(`path[data-name="${CSS.escape(key)}"]`);
      if (!path) continue;
      const on = () => { row.classList.add('is-linked'); path.classList.add('is-linked'); };
      const off = () => { row.classList.remove('is-linked'); path.classList.remove('is-linked'); };
      row.addEventListener('pointerenter', on);
      row.addEventListener('pointerleave', off);
      listeners.push(() => {
        row.removeEventListener('pointerenter', on);
        row.removeEventListener('pointerleave', off);
        off();
      });
    }
    scope.cleanups.push(() => listeners.forEach(fn => fn()));

    return () => disposeScope(scope);
  }, []);

  return null;
}
