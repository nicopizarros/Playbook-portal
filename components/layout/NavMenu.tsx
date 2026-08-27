'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

/**
 * One disclosure menu in the desktop header.
 *
 * Accessibility contract (brief §2's quality floor), all of it real:
 *  • button carries aria-expanded + aria-controls, panel is labelled by it
 *  • Escape closes and returns focus to the trigger
 *  • click or focus outside closes
 *  • the panel is a plain group of links, so Tab order is document order
 *    and a screen reader reads it as a list — no fake menu semantics that
 *    would demand arrow-key handling we don't implement. (Deliberate:
 *    role="menu" carries a keyboard contract; a nav disclosure does not.)
 *
 * Round 1 added two things to the primitive, both WITHOUT changing that
 * semantics — the comment above stays true:
 *
 *  • HOVER INTENT. 150ms to open, 260ms to close. The open delay stops the
 *    panel firing when the cursor merely crosses the trigger on its way
 *    somewhere else; the close delay is deliberately longer because it has
 *    to survive the diagonal trip from the trigger down into the panel.
 *    Neither is animation, so neither is touched by
 *    prefers-reduced-motion — this is accidental-open prevention.
 *    Pointer-coarse devices never hover: tap only.
 *  • ARROW KEYS as an OPTIONAL shortcut. Down from the trigger opens and
 *    focuses the first link; arrows cycle; Home/End jump to the ends. Tab
 *    remains the primary path, which is exactly why the role does not
 *    change: we're adding a convenience, not claiming a menu contract.
 *
 * Only one panel is open at a time. Menus coordinate through a window
 * event rather than a shared provider: pointerdown/focusin already close a
 * menu when the interaction lands elsewhere, but HOVERING a sibling
 * trigger is neither, so without this a second panel could open over the
 * first.
 */
const OPEN_EVENT = 'playbook:navmenu-open';
const OPEN_INTENT_MS = 150;
const CLOSE_DELAY_MS = 260;

export function NavMenu({
  label,
  children,
  align = 'start',
  wide = false,
  panelClassName,
}: {
  label: string;
  children: React.ReactNode;
  align?: 'start' | 'end';
  wide?: boolean;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const panelId = `navmenu-${id}`;

  const clearTimers = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  // Announce so every other menu closes. `detail` is this menu's own id, so
  // the announcement never closes the menu that made it.
  const openNow = useCallback(() => {
    clearTimers();
    setOpen(true);
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: panelId }));
  }, [clearTimers, panelId]);

  const closeNow = useCallback(() => {
    clearTimers();
    setOpen(false);
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    function onSiblingOpen(e: Event) {
      if ((e as CustomEvent<string>).detail !== panelId) {
        clearTimers();
        setOpen(false);
      }
    }
    window.addEventListener(OPEN_EVENT, onSiblingOpen);
    return () => window.removeEventListener(OPEN_EVENT, onSiblingOpen);
  }, [clearTimers, panelId]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      closeNow();
      buttonRef.current?.focus();
    }
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) closeNow();
    }
    // focusin, not blur: closes when focus leaves by ANY means (Tab out,
    // click elsewhere), which blur alone doesn't reliably catch.
    function onFocusIn(e: FocusEvent) {
      if (!rootRef.current?.contains(e.target as Node)) closeNow();
    }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [open, closeNow]);

  // Hover is a desktop-pointer affordance only. A coarse pointer fires
  // mouseenter on tap, which would open the panel and then immediately
  // fight the click handler for it.
  function canHover() {
    return typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
  }

  function onPointerEnter() {
    if (!canHover()) return;
    clearTimers();
    openTimer.current = setTimeout(openNow, OPEN_INTENT_MS);
  }

  function onPointerLeave() {
    if (!canHover()) return;
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }

  function links() {
    return Array.from(panelRef.current?.querySelectorAll<HTMLElement>('a[href]') ?? []);
  }

  function focusLink(index: number) {
    const items = links();
    if (!items.length) return;
    const wrapped = ((index % items.length) + items.length) % items.length;
    items[wrapped].focus();
  }

  function onTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== 'ArrowDown') return;
    e.preventDefault();
    openNow();
    // After the panel renders — the links do not exist until it does.
    requestAnimationFrame(() => focusLink(0));
  }

  function onPanelKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const items = links();
    if (!items.length) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      focusLink(current + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      focusLink(current - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusLink(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusLink(items.length - 1);
    }
  }

  return (
    <div className="navmenu" ref={rootRef} onMouseEnter={onPointerEnter} onMouseLeave={onPointerLeave}>
      <button
        type="button"
        className="navmenu-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        // Click wins over hover intent in both directions and with no
        // delay, whatever the hover timers were about to do.
        onClick={() => (open ? closeNow() : openNow())}
        onKeyDown={onTriggerKeyDown}
        ref={buttonRef}
      >
        {label}
        <span className="navmenu-chevron" aria-hidden="true" />
      </button>
      <div
        className={`navmenu-panel${open ? ' is-open' : ''}${wide ? ' is-wide' : ''}${panelClassName ? ` ${panelClassName}` : ''}`}
        id={panelId}
        data-align={align}
        // hidden (not display:none via a class alone) so the links are
        // genuinely out of the tab order when closed.
        hidden={!open}
        onClick={closeNow}
        onKeyDown={onPanelKeyDown}
        ref={panelRef}
      >
        {children}
      </div>
    </div>
  );
}
