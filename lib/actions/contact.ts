'use server';

import { sendContactMessage } from '@/lib/email';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export type ContactResult = { ok: true } | { ok: false; error: string };

/**
 * The /contacto form's only server action. No rate limiting or CAPTCHA —
 * this is a brand-new, low-traffic form and there's no infra for either
 * yet — so the honeypot field below is the entire spam defense: a real
 * visitor never sees or fills it, a bot filling every field does, and that
 * submission is dropped as a silent success rather than telling the bot
 * what worked.
 */
export async function submitContactMessage(formData: FormData): Promise<ContactResult> {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const message = String(formData.get('message') || '').trim();
  const honeypot = String(formData.get('company') || '').trim();

  if (honeypot) return { ok: true };

  if (!name) return { ok: false, error: 'Escribe tu nombre.' };
  if (!isValidEmail(email)) return { ok: false, error: 'Ingresa un correo válido.' };
  if (message.length < 10) return { ok: false, error: 'Cuéntanos un poco más en el mensaje.' };
  if (message.length > 4000) return { ok: false, error: 'El mensaje es demasiado largo.' };

  const result = await sendContactMessage({ name, fromEmail: email, message });
  if (!result.sent) {
    console.error('[Playbook] /contacto send failed:', result.reason);
    return { ok: false, error: 'No pudimos enviar tu mensaje ahora mismo. Intenta de nuevo en unos minutos.' };
  }
  return { ok: true };
}
