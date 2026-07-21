'use client';

import { useSyncExternalStore } from 'react';
import { isDarkActive, subscribeTheme, toggleTheme } from './theme-store';

const SunIcon = () => (
  <svg
    className="icon-sun"
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M5 5l1.4 1.4M17.6 17.6L19 19M3 12h2M19 12h2M5 19l1.4-1.4M17.6 6.4L19 5" />
  </svg>
);

const MoonIcon = () => (
  <svg
    className="icon-moon"
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z" />
  </svg>
);

export function ThemeToggle({ variant, onToggle }: { variant: 'desktop' | 'drawer'; onToggle?: () => void }) {
  // getServerSnapshot returns a fixed value (light) since the real answer
  // depends on localStorage/matchMedia, unavailable during SSR — the
  // inline theme-init script in app/layout.tsx already prevents the FOUC
  // this would otherwise cause, so this mismatch is intentional and safe.
  const dark = useSyncExternalStore(subscribeTheme, isDarkActive, () => false);

  function handleClick() {
    toggleTheme();
    onToggle?.();
  }

  const className = variant === 'drawer' ? 'theme-toggle theme-toggle-drawer' : 'theme-toggle';

  return (
    <button
      className={className}
      data-theme-toggle
      type="button"
      aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-pressed={dark}
      onClick={handleClick}
    >
      <span className="theme-toggle-icon">
        <SunIcon />
        <MoonIcon />
      </span>
      {variant === 'drawer' && (
        <span className="theme-toggle-label">{dark ? 'Modo claro' : 'Modo oscuro'}</span>
      )}
    </button>
  );
}
