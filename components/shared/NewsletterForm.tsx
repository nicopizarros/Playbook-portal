'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { newsletterActionUrl } from '@/lib/newsletter-url';
import { trackEvent, resolvePageProduct } from '@/lib/analytics-events';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Ported from legacy/js/ui.js's initNewsletterForms(). The form still posts
// to an external Substack URL in a new tab (target="_blank") — this
// component can't know the real subscription result, so "success" here is
// the same "assumed success once the email looks valid" UX legacy already
// shipped, not a confirmed server round-trip. `successMessage` should
// therefore say what actually happened (the reader was handed off to
// Substack to confirm), not promise a mail that nothing here has sent.
export function NewsletterForm({
  formClassName,
  action,
  emailId,
  emailLabel,
  buttonLabel,
  successMessage,
  placement,
}: {
  formClassName: string;
  action: string;
  emailId: string;
  emailLabel: string;
  buttonLabel: string;
  successMessage: string;
  /** Which surface this form sits on, for reporting. */
  placement: 'home-sidebar' | 'mid-cta';
}) {
  const [hasError, setHasError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fieldsRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLParagraphElement>(null);
  const errorRef = useRef<HTMLSpanElement>(null);

  // .nl-success/.nl-error were hard display:none/flex toggles with zero
  // transition — same gap the header search dropdown had before it got
  // GSAP's autoAlpha. The success swap fades the fields out FIRST and only
  // flips isSuccess (which is what actually swaps .nl-fields/.nl-success
  // via the CSS class, see styles/hero.css) once that fade completes, same
  // fade-then-swap ordering as the homepage filter fix below — a plain
  // setTimeout guessing at the fade duration is exactly the bug that fix
  // was for.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const input = e.currentTarget.querySelector('input') as HTMLInputElement;
    const value = input.value.trim();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isValidEmail(value)) {
      e.preventDefault();
      setHasError(true);
      setErrorMsg('Ingresa un correo válido.');
      input.focus();
      return;
    }
    setHasError(false);
    // Fired here, on the validated submit, and NOT on the success state:
    // this form posts to Substack in a new tab and never learns the real
    // subscription result (see the component note above), so "signup" here
    // means "handed off to Substack with a valid-looking address" -- the
    // same thing the success copy claims. Naming it after what we can
    // actually observe keeps the number honest.
    trackEvent('newsletter_signup', {
      placement,
      product: resolvePageProduct(window.location.pathname),
    });
    if (reduced || !fieldsRef.current) {
      window.setTimeout(() => setIsSuccess(true), 50);
      return;
    }
    window.setTimeout(() => {
      gsap.to(fieldsRef.current, {
        opacity: 0,
        duration: 0.15,
        ease: 'power1.in',
        onComplete: () => setIsSuccess(true),
      });
    }, 50);
  }

  useEffect(() => {
    if (!isSuccess) return;
    const el = successRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
  }, [isSuccess]);

  useEffect(() => {
    if (!hasError) return;
    const el = errorRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(el, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
  }, [hasError, errorMsg]);

  return (
    <form
      className={`pill-form ${formClassName}${hasError ? ' has-error' : ''}${isSuccess ? ' is-success' : ''}`}
      // Normalised, not used raw: the configured URL is a Substack
      // publication root, where the submitted ?email= is silently dropped.
      // See lib/newsletter-url.ts.
      action={newsletterActionUrl(action)}
      target="_blank"
      rel="noopener noreferrer"
      onSubmit={handleSubmit}
    >
      <div className="nl-fields" ref={fieldsRef}>
        <label className="visually-hidden" htmlFor={emailId}>
          {emailLabel}
        </label>
        <input
          id={emailId}
          name="email"
          type="text"
          inputMode="email"
          placeholder="Tu correo"
          aria-label={emailLabel}
          autoComplete="email"
          required
          onInput={() => setHasError(false)}
        />
        <button className="btn" type="submit">
          {buttonLabel}
        </button>
      </div>
      <p className="nl-success" role="status" ref={successRef}>
        {successMessage}
      </p>
      <span className="nl-error" role="alert" ref={errorRef}>
        {hasError ? errorMsg : ''}
      </span>
    </form>
  );
}
