'use client';

import { useEffect } from 'react';
import { ScrollTrigger } from '@/lib/gsap';

// styles/header.css already has a full "shrunk" treatment for
// header.topbar.is-scrolled — smaller logo, shorter nav, a stronger box
// shadow, all with their own CSS transitions — carried over from the
// legacy port. Nothing ever actually added that class: there was no
// scroll listener anywhere in the app. ScrollTrigger.create's toggleClass
// is exactly this trigger, and more robust than a hand-rolled scroll
// listener would be (built-in throttling, recalculates on resize) — the
// shrink itself stays a plain CSS transition, which was already smooth.
export function HeaderScrollEffect() {
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: 'top -4',
      toggleClass: { targets: 'header.topbar', className: 'is-scrolled' },
    });
    return () => trigger.kill();
  }, []);

  return null;
}
