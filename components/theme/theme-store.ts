// Tiny client-side pub/sub for dark-mode state, so the two theme-toggle
// instances (desktop nav-actions + mobile drawer — only one is ever visible
// at a time per css/responsive.css, but both must stay correct) and the
// <meta name="theme-color"> tag all agree, mirroring legacy/js/nav.js's
// syncThemeUi() which updated every [data-theme-toggle] element at once.

const THEME_KEY = 'playbook_theme';
type Theme = 'light' | 'dark';

const listeners = new Set<() => void>();
let mediaListenerAttached = false;

function storedTheme(): Theme | null {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
}

export function isDarkActive(): boolean {
  const stored = storedTheme();
  if (stored === 'dark') return true;
  if (stored === 'light') return false;
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function notify() {
  listeners.forEach(l => l());
}

function applyThemeColor(dark: boolean) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#121316' : '#ffffff');
}

export function toggleTheme() {
  const next: Theme = isDarkActive() ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // localStorage unavailable (private mode, disabled) — theme still
    // applies for this page load, just doesn't persist.
  }
  applyThemeColor(next === 'dark');
  notify();
}

export function subscribeTheme(callback: () => void): () => void {
  listeners.add(callback);
  // Without a stored preference, follow the system theme live — attached
  // once, shared across every subscriber.
  if (!mediaListenerAttached && typeof window !== 'undefined' && window.matchMedia) {
    mediaListenerAttached = true;
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (!storedTheme()) {
        applyThemeColor(isDarkActive());
        notify();
      }
    });
  }
  return () => listeners.delete(callback);
}
