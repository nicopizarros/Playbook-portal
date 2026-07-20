'use client';

import { useState } from 'react';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Ported from legacy/js/ui.js's initNewsletterForms(). The form still posts
// to an external Substack URL in a new tab (target="_blank") — this
// component can't know the real subscription result, so "success" here is
// the same "assumed success once the email looks valid" UX legacy already
// shipped, not a confirmed server round-trip.
export function NewsletterForm({
  formClassName,
  action,
  emailId,
  emailLabel,
  buttonLabel,
  successMessage,
}: {
  formClassName: string;
  action: string;
  emailId: string;
  emailLabel: string;
  buttonLabel: string;
  successMessage: string;
}) {
  const [hasError, setHasError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const input = e.currentTarget.querySelector('input') as HTMLInputElement;
    const value = input.value.trim();
    if (!isValidEmail(value)) {
      e.preventDefault();
      setHasError(true);
      setErrorMsg('Ingresa un correo válido.');
      input.focus();
      return;
    }
    setHasError(false);
    window.setTimeout(() => setIsSuccess(true), 50);
  }

  return (
    <form
      className={`pill-form ${formClassName}${hasError ? ' has-error' : ''}${isSuccess ? ' is-success' : ''}`}
      action={action}
      target="_blank"
      rel="noopener noreferrer"
      onSubmit={handleSubmit}
    >
      <div className="nl-fields">
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
      <p className="nl-success" role="status">
        {successMessage}
      </p>
      <span className="nl-error" role="alert">
        {hasError ? errorMsg : ''}
      </span>
    </form>
  );
}
