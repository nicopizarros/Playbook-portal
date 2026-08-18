'use client';

import { useEffect } from 'react';
import { ScrollTrigger } from '@/lib/gsap';

// styles/header.css already has a full "shrunk" treatment for
// header.topbar.is-scrolled — smaller logo, shorter nav, a stronger box
// shadow, all with their own CSS transitions — carried over from the
// legacy port. Nothing ever actually added that class: there was no
// scroll listener anywhere in the app.
//
// The original single toggleClass at 4px oscillated: adding the class
// shrinks the sticky header by 14px, the layout shift (plus browser
// scroll anchoring) can push the scroll position back under the
// threshold, the class comes off, the header grows, and the loop repeats
// — the intermittent "shaky logo" at the top of hub pages. The fix is
// hysteresis: shrink only past SHRINK_ON, grow back only above
// SHRINK_OFF, with a gap wider than the 14px height delta so one state
// change can never re-cross the opposite threshold.
const SHRINK_ON = 96;
const SHRINK_OFF = 40;

export function HeaderScrollEffect() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('header.topbar');
    if (!header) return;
    const shrink = ScrollTrigger.create({
      trigger: document.body,
      start: `top -${SHRINK_ON}`,
      end: 'max',
      onEnter: () => header.classList.add('is-scrolled'),
    });
    const grow = ScrollTrigger.create({
      trigger: document.body,
      start: `top -${SHRINK_OFF}`,
      end: 'max',
      onLeaveBack: () => header.classList.remove('is-scrolled'),
    });
    return () => {
      shrink.kill();
      grow.kill();
      header.classList.remove('is-scrolled');
    };
  }, []);

  return null;
}
