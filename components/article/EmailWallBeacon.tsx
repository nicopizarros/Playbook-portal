'use client';

import { useEffect, useRef } from 'react';
import {
  registerPageProduct,
  trackEvent,
  type ProductKey,
} from '@/lib/analytics-events';

// The metering wall's funnel, in two halves.
//
//   email_wall_view — the reader hit the wall (they'd used up their
//     FREE_ARTICLES_PER_MONTH). This is the denominator; without it a raw
//     signup count can't distinguish "the wall converts well" from "the
//     wall is rarely reached".
//   email_wall_cta — the reader acted on it: submitted the Google form or
//     the email+password form.
//
// DELIBERATELY NOT NAMED email_wall_convert. A completed conversion isn't
// observable from this page: both paths hand off to an auth flow that
// redirects (Google leaves the origin entirely), so the last thing this
// component can honestly witness is the click. Reporting the click as a
// conversion would overstate it by however many readers abandon the OAuth
// screen. The true conversion is already recorded first-party -- a new row
// in the readers table -- and belongs in that query, not here.
export function EmailWallBeacon({
  articleId,
  product,
}: {
  articleId: string;
  product: ProductKey;
}) {
  const viewed = useRef(false);

  useEffect(() => {
    // The walled branch is still an article view for attribution purposes,
    // so the site-wide listeners can name the product on it too.
    registerPageProduct(product);

    if (!viewed.current) {
      viewed.current = true;
      trackEvent('email_wall_view', { product, article_id: articleId });
    }

    const wall = document.querySelector<HTMLElement>('.article-walled');
    if (!wall) return () => registerPageProduct(null);

    // Submit rather than click: PasswordAuthForm is collapsed behind a
    // toggle whose own button would otherwise register as an intent to
    // sign up, and the Google path is a form bound to a server action.
    // Listening for submit counts exactly the readers who committed.
    function onSubmit(event: Event) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      trackEvent('email_wall_cta', {
        product,
        article_id: articleId,
        method: form.classList.contains('email-wall-form') ? 'google' : 'password',
      });
    }

    wall.addEventListener('submit', onSubmit, { capture: true });
    return () => {
      wall.removeEventListener('submit', onSubmit, { capture: true });
      registerPageProduct(null);
    };
  }, [articleId, product]);

  return null;
}
