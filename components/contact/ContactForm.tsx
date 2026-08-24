'use client';

import { useRef, useState, useTransition } from 'react';
import { submitContactMessage } from '@/lib/actions/contact';

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitContactMessage(formData);
      if (result.ok) {
        setStatus('success');
        formRef.current?.reset();
      } else {
        setStatus('error');
        setError(result.error);
      }
    });
  }

  if (status === 'success') {
    return (
      <p className="contact-success" role="status">
        Gracias — recibimos tu mensaje y te contestamos directo a tu correo.
      </p>
    );
  }

  return (
    <form className="contact-form" ref={formRef} onSubmit={handleSubmit}>
      {/* Honeypot: real visitors never see this field (styles/team.css hides
          it off-screen, not display:none, since some spam bots skip fields a
          screen reader also wouldn't reach — same posture, belt and
          suspenders). A filled value is treated as spam server-side. */}
      <div className="contact-hp" aria-hidden="true">
        <label htmlFor="contact-company">No llenar</label>
        <input id="contact-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="contact-field">
        <label htmlFor="contact-name">Nombre</label>
        <input id="contact-name" name="name" type="text" required autoComplete="name" />
      </div>
      <div className="contact-field">
        <label htmlFor="contact-email">Correo</label>
        <input id="contact-email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="contact-field">
        <label htmlFor="contact-message">Mensaje</label>
        <textarea id="contact-message" name="message" rows={6} required minLength={10} maxLength={4000} />
      </div>

      {status === 'error' && (
        <p className="contact-error" role="alert">
          {error}
        </p>
      )}

      <button className="btn accent" type="submit" disabled={isPending}>
        {isPending ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  );
}
