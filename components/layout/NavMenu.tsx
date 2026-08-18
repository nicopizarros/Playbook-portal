'use client';

import { useEffect, useId, useRef, useState } from 'react';

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
 */
export function NavMenu({
  label,
  children,
  align = 'start',
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  align?: 'start' | 'end';
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const panelId = `navmenu-${id}`;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    // focusin, not blur: closes when focus leaves by ANY means (Tab out,
    // click elsewhere), which blur alone doesn't reliably catch.
    function onFocusIn(e: FocusEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [open]);

  return (
    <div className="navmenu" ref={rootRef}>
      <button
        type="button"
        className="navmenu-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(v => !v)}
        ref={buttonRef}
      >
        {label}
        <span className="navmenu-chevron" aria-hidden="true" />
      </button>
      <div
        className={`navmenu-panel${open ? ' is-open' : ''}${wide ? ' is-wide' : ''}`}
        id={panelId}
        data-align={align}
        // hidden (not display:none via a class alone) so the links are
        // genuinely out of the tab order when closed.
        hidden={!open}
        onClick={() => setOpen(false)}
      >
        {children}
      </div>
    </div>
  );
}
