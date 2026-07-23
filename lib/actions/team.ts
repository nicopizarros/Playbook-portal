'use server';

import { createHash, randomBytes } from 'node:crypto';
import { and, desc, eq, isNull, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import { db } from '@/lib/db/client';
import { editorInvitations, editors } from '@/lib/db/schema';
import { sendEditorInvitationEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request-ip';
import { SITE_URL } from '@/lib/site-url';

// Same guard as lib/actions/admin.ts's requireEditor — redefined here
// because 'use server' modules may only export async server actions, so
// the helper can't be imported across action files without itself becoming
// a callable action.
async function requireEditor() {
  const session = await auth();
  if (!session || session.user.role !== 'editor') {
    throw new Error('Unauthorized');
  }
  return session;
}

const INVITE_TTL_HOURS = 48;
// The invite link must land on the same deployment the admin is using —
// NEXTAUTH_URL is already the canonical "where does auth live" origin for
// this app (set in dev and production alike, see .env.local.example);
// SITE_URL is the production fallback if it's ever absent.
function inviteOrigin() {
  return process.env.NEXTAUTH_URL || SITE_URL;
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

const USERNAME_RE = /^[a-z0-9._-]{3,32}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------- read side

export type TeamEditor = { id: string; username: string; displayName: string; createdAt: Date };
export type TeamInvitation = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  createdAt: Date;
  expiresAt: Date;
  expired: boolean;
  invitedByName: string | null;
};

export async function getTeamData(): Promise<{ editors: TeamEditor[]; invitations: TeamInvitation[] }> {
  await requireEditor();
  const [editorRows, inviteRows] = await Promise.all([
    db
      .select({ id: editors.id, username: editors.username, displayName: editors.displayName, createdAt: editors.createdAt })
      .from(editors)
      .orderBy(editors.createdAt),
    db
      .select({
        id: editorInvitations.id,
        email: editorInvitations.email,
        username: editorInvitations.username,
        displayName: editorInvitations.displayName,
        createdAt: editorInvitations.createdAt,
        expiresAt: editorInvitations.expiresAt,
        invitedByName: editors.displayName,
      })
      .from(editorInvitations)
      .leftJoin(editors, eq(editorInvitations.invitedBy, editors.id))
      .where(isNull(editorInvitations.usedAt))
      .orderBy(desc(editorInvitations.createdAt)),
  ]);

  const now = Date.now();
  return {
    editors: editorRows,
    invitations: inviteRows.map(r => ({ ...r, expired: r.expiresAt.getTime() <= now })),
  };
}

// ---------------------------------------------------------------- invite

export type InviteResult =
  | { ok: false; error: string }
  | { ok: true; emailSent: boolean; emailError?: string; inviteUrl: string };

export async function inviteEditor(input: {
  email: string;
  username: string;
  displayName: string;
}): Promise<InviteResult> {
  const session = await requireEditor();

  const email = input.email.trim().toLowerCase();
  const username = input.username.trim().toLowerCase();
  const displayName = input.displayName.trim();

  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Correo inválido.' };
  if (!USERNAME_RE.test(username)) {
    return { ok: false, error: 'Usuario inválido: 3-32 caracteres, solo minúsculas, números, punto, guion o guion bajo.' };
  }
  if (!displayName) return { ok: false, error: 'El nombre para mostrar es obligatorio.' };

  const [taken] = await db.select({ id: editors.id }).from(editors).where(eq(editors.username, username)).limit(1);
  if (taken) return { ok: false, error: `El usuario "${username}" ya existe en el equipo.` };

  // Re-inviting replaces any pending invitation for the same person
  // (matched by email or username) instead of stacking valid tokens.
  await db
    .delete(editorInvitations)
    .where(
      and(
        isNull(editorInvitations.usedAt),
        or(eq(editorInvitations.email, email), eq(editorInvitations.username, username)),
      ),
    );

  // 32 random bytes, URL-safe; only its SHA-256 lands in the database.
  const token = randomBytes(32).toString('base64url');
  await db.insert(editorInvitations).values({
    email,
    username,
    displayName,
    tokenHash: hashToken(token),
    invitedBy: session.user.id,
    expiresAt: new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000),
  });

  const inviteUrl = `${inviteOrigin()}/admin/set-password?token=${token}`;
  const sendResult = await sendEditorInvitationEmail({
    to: email,
    inviteUrl,
    displayName,
    invitedByName: session.user.name || 'El equipo de Playbook',
  });

  // The invite URL goes back to the inviting editor either way: they're
  // already fully trusted (they could archive every article), and with
  // production Resend known-broken (HANDOFF §12) the copyable link is what
  // keeps invitations usable — the editor shares it by their own channel.
  return {
    ok: true,
    emailSent: sendResult.sent,
    emailError: sendResult.sent ? undefined : sendResult.reason,
    inviteUrl,
  };
}

export async function revokeInvitation(id: string): Promise<void> {
  await requireEditor();
  await db.delete(editorInvitations).where(and(eq(editorInvitations.id, id), isNull(editorInvitations.usedAt)));
}

// ---------------------------------------------------------------- accept (public)

export type AcceptInvitationState = { ok: true; username: string } | { ok: false; error: string } | null;

const ACCEPT_LIMIT = 5;
const ACCEPT_WINDOW_SECONDS = 10 * 60;

// Public action (the invitee has no session yet) — rate-limited per IP so
// the token can't be brute-forced through this endpoint, on top of the
// token itself being 256 random bits.
export async function acceptInvitation(
  _prev: AcceptInvitationState,
  formData: FormData,
): Promise<AcceptInvitationState> {
  const token = String(formData.get('token') || '');
  const password = String(formData.get('password') || '');
  const confirm = String(formData.get('confirm') || '');

  const ip = await getClientIp();
  const limit = checkRateLimit(`invite-accept:${ip}`, ACCEPT_LIMIT, ACCEPT_WINDOW_SECONDS);
  if (!limit.allowed) {
    return { ok: false, error: `Demasiados intentos. Prueba de nuevo en ${Math.ceil(limit.retryAfterSeconds / 60)} minuto(s).` };
  }

  if (!token) return { ok: false, error: 'Falta el token de invitación.' };
  if (password.length < 8) return { ok: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
  if (password !== confirm) return { ok: false, error: 'Las contraseñas no coinciden.' };

  const [invitation] = await db
    .select()
    .from(editorInvitations)
    .where(eq(editorInvitations.tokenHash, hashToken(token)))
    .limit(1);

  if (!invitation || invitation.usedAt) {
    return { ok: false, error: 'Esta invitación no existe o ya fue usada. Pide una nueva al equipo.' };
  }
  if (invitation.expiresAt.getTime() <= Date.now()) {
    return { ok: false, error: 'Esta invitación venció (duran 48 horas). Pide una nueva al equipo.' };
  }

  // Same bcrypt cost as scripts/seed-editors.ts, so both provisioning
  // paths produce equivalent hashes.
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await db.transaction(async tx => {
      await tx.insert(editors).values({
        username: invitation.username,
        passwordHash,
        displayName: invitation.displayName,
      });
      await tx
        .update(editorInvitations)
        .set({ usedAt: new Date() })
        .where(eq(editorInvitations.id, invitation.id));
    });
  } catch (err) {
    // 23505 = unique_violation: the username was claimed between the
    // invitation and its acceptance (e.g. a manual seed run).
    if ((err as { code?: string }).code === '23505') {
      return { ok: false, error: `El usuario "${invitation.username}" ya fue creado por otra vía. Pide una invitación nueva.` };
    }
    throw err;
  }

  return { ok: true, username: invitation.username };
}
