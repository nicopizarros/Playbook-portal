// Direct Resend REST client for transactional email that does NOT go
// through Auth.js. Reader magic links keep using the Auth.js Resend
// provider (auth.ts); this module exists for emails Auth.js has no flow
// for — today, editor invitations (Fase 8).
//
// Same graceful-degradation posture as every other integration here: a
// missing RESEND_API_KEY or a failed send returns { sent: false, reason }
// instead of throwing, and the caller decides what to do with that (the
// invite flow falls back to handing the inviter a copyable link — see
// lib/actions/team.ts). Production Resend is known-broken right now
// (EMAIL_FROM unset, see HANDOFF.md §12), so this fallback is what keeps
// the feature usable until that credential lands.

type SendResult = { sent: true } | { sent: false; reason: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendEditorInvitationEmail(opts: {
  to: string;
  inviteUrl: string;
  displayName: string;
  invitedByName: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey) return { sent: false, reason: 'RESEND_API_KEY no está configurada' };
  if (!from) return { sent: false, reason: 'EMAIL_FROM no está configurada' };

  const safeName = escapeHtml(opts.displayName);
  const safeInviter = escapeHtml(opts.invitedByName);
  const safeUrl = escapeHtml(opts.inviteUrl);

  const subject = 'Invitación al panel editorial de Playbook';
  const text = [
    `Hola ${opts.displayName},`,
    '',
    `${opts.invitedByName} te invitó al panel editorial de Playbook.`,
    'Abre este enlace para elegir tu contraseña y activar tu cuenta de editor:',
    '',
    opts.inviteUrl,
    '',
    'El enlace vence en 48 horas. Si no esperabas esta invitación, ignora este correo.',
  ].join('\n');
  const html = `
    <div style="font-family:Inter,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0a0a0a;">
      <p style="font-size:15px;line-height:1.6;">Hola ${safeName},</p>
      <p style="font-size:15px;line-height:1.6;"><strong>${safeInviter}</strong> te invitó al panel editorial de <strong>Playbook</strong>. Abre el enlace para elegir tu contraseña y activar tu cuenta de editor:</p>
      <p style="margin:28px 0;">
        <a href="${safeUrl}" style="background:#0a0a0a;color:#ffffff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;">Activar mi cuenta</a>
      </p>
      <p style="font-size:13px;line-height:1.6;color:#6b6459;">El enlace vence en 48 horas. Si el botón no funciona, copia y pega esta dirección en tu navegador:<br>${safeUrl}</p>
      <p style="font-size:13px;line-height:1.6;color:#6b6459;">Si no esperabas esta invitación, ignora este correo.</p>
    </div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: opts.to, subject, text, html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { sent: false, reason: `Resend respondió ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: (err as Error).message };
  }
}
