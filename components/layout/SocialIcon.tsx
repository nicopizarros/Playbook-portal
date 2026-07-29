// Maps a CMS-authored social link label (free text, see
// components/admin/tabs/FooterTab.tsx) to a recognizable brand glyph —
// keyword match on the label rather than the URL, since editors type the
// platform name as the label ("Instagram", "YouTube", …). Falls back to
// null for anything not in this set, so the footer can show the plain
// text pill it always used to for a platform not covered here instead of
// silently hiding it.
export function SocialIcon({ label }: { label: string }) {
  const key = label.toLowerCase();

  if (key.includes('instagram')) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (key.includes('youtube')) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="4" />
        <path d="M10 9l6 3-6 3V9z" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (key.includes('linkedin')) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <circle cx="7.5" cy="8" r="1" fill="currentColor" stroke="none" />
        <path d="M7.5 11v6" strokeLinecap="round" />
        <path d="M12 17v-4c0-1.5 1-2.3 2.2-2.3S16 11.5 16 13v4" strokeLinecap="round" />
        <path d="M12 11v6" strokeLinecap="round" />
      </svg>
    );
  }
  if (key.includes('tiktok')) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M13.5 3h2.1c.2 1.7 1.4 3.1 3.1 3.4v2.2c-1.2 0-2.3-.4-3.2-1v6.6a4.6 4.6 0 1 1-4.6-4.6c.2 0 .4 0 .6.1v2.2a2.4 2.4 0 1 0 2 2.4V3z" />
      </svg>
    );
  }
  if (key.includes('substack')) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <rect x="4" y="4" width="16" height="3" rx="1" />
        <rect x="4" y="9" width="16" height="3" rx="1" />
        <path d="M4 15h16v2l-8 4-8-4v-2z" />
      </svg>
    );
  }
  if (key.includes('whatsapp')) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 20l1.2-3.6A8 8 0 1 1 8.6 19L4 20z" />
      </svg>
    );
  }
  if (key.includes('facebook')) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M14 21v-7h2.4l.4-3H14V9c0-.9.3-1.5 1.6-1.5H17V5c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V11H8v3h2.6v7H14z" />
      </svg>
    );
  }
  if (key === 'x' || key.includes('twitter') || key === '(x) twitter') {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d="M4 4l16 16M20 4L4 20" />
      </svg>
    );
  }

  return null;
}
