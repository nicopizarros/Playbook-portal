'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

// Next's <Link href="/"> is a no-op when you're already on "/" -- no
// navigation event fires, so nothing scrolls and no client state (like
// NewsGrid's source filter) resets. A reader who filtered the 5+1 down to
// one source and then clicks the logo expecting "take me back to the top,
// default view" saw literally nothing happen (real bug report, 2026-08-01).
// Away from "/" the plain Link behavior is already correct (App Router
// resets scroll and remounts the page on real navigation), so this only
// intercepts the same-route case.
export function BrandLink() {
  const pathname = usePathname();

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (pathname !== '/') return;
    e.preventDefault();
    window.history.replaceState(null, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.dispatchEvent(new Event('playbook:reset-home'));
  }

  return (
    <Link href="/" className="brand" aria-label="Playbook — inicio" onClick={handleClick}>
      <Image
        className="logo-light"
        src="/assets/img/playbook-logo.webp"
        width={640}
        height={158}
        alt="Playbook"
        priority
      />
      <Image
        className="logo-dark"
        src="/assets/img/playbook-logo-dark.png"
        width={640}
        height={158}
        alt="Playbook"
        priority
      />
    </Link>
  );
}
