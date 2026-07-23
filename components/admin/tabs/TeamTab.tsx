'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getTeamData,
  inviteEditor,
  revokeInvitation,
  type TeamEditor,
  type TeamInvitation,
} from '@/lib/actions/team';

type Props = {
  // Toasts live in AdminDashboard (shared stack) — the tab reports through
  // this instead of owning its own notification UI.
  onToast: (message: string, error?: boolean) => void;
};

const dateFmt = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

// Unlike every other tab, this one doesn't edit SiteContentData drafts —
// team membership is immediate server state (invite/revoke apply on click,
// there's no "save" step), so it self-loads via getTeamData() instead of
// receiving props from the dashboard's content draft.
export function TeamTab({ onToast }: Props) {
  const [editors, setEditors] = useState<TeamEditor[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await getTeamData();
      setEditors(data.editors);
      setInvitations(data.invitations);
      setLoadError('');
    } catch (err) {
      setLoadError(`No se pudo cargar el equipo: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setLastInviteUrl('');
    setLinkCopied(false);
    try {
      const result = await inviteEditor({ email, username, displayName });
      if (!result.ok) {
        onToast(result.error, true);
        return;
      }
      if (result.emailSent) {
        onToast(`Invitación enviada a ${email.trim()}.`);
      } else {
        onToast(
          `La invitación se creó pero el correo no salió (${result.emailError || 'sin detalle'}). Copia el enlace y compártelo tú.`,
          true,
        );
      }
      setLastInviteUrl(result.inviteUrl);
      setEmail('');
      setUsername('');
      setDisplayName('');
      await refresh();
    } catch (err) {
      onToast(`Error al invitar: ${(err as Error).message}`, true);
    } finally {
      setInviting(false);
    }
  }

  async function handleRevoke(inv: TeamInvitation) {
    try {
      await revokeInvitation(inv.id);
      onToast(`Invitación para ${inv.email} revocada.`);
      await refresh();
    } catch (err) {
      onToast(`No se pudo revocar: ${(err as Error).message}`, true);
    }
  }

  async function copyInviteUrl() {
    try {
      await navigator.clipboard.writeText(lastInviteUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2200);
    } catch {
      onToast('No se pudo copiar — selecciona el enlace y cópialo a mano.', true);
    }
  }

  return (
    <div>
      <h2 className="admin-section-title">Equipo editorial</h2>
      <p className="admin-section-desc">
        Quiénes pueden entrar a este panel. Invita a alguien nuevo por correo: recibe un enlace que
        vence en 48 horas para elegir su propia contraseña.
      </p>

      {loadError && <p className="field-error">{loadError}</p>}

      <h3 className="admin-section-title">Invitar a un editor</h3>
      <form className="team-invite-form" onSubmit={handleInvite}>
        <label className="admin-field">
          Correo
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="nombre@correo.com"
            required
          />
        </label>
        <label className="admin-field">
          Usuario
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="ej. mariana"
            pattern="[a-zA-Z0-9._\-]{3,32}"
            title="3-32 caracteres: letras, números, punto, guion o guion bajo"
            required
          />
        </label>
        <label className="admin-field">
          Nombre para mostrar
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="ej. Mariana López"
            required
          />
        </label>
        <button className="btn" type="submit" disabled={inviting}>
          {inviting ? 'Invitando…' : 'Enviar invitación'}
        </button>
      </form>

      {lastInviteUrl && (
        <div className="admin-callout team-invite-link">
          <strong>Enlace de invitación</strong> (por si prefieres compartirlo directo, vence en 48 h):
          <div className="team-invite-link-row">
            <input className="input" readOnly value={lastInviteUrl} onFocus={e => e.currentTarget.select()} />
            <button type="button" className="btn-mini" onClick={copyInviteUrl}>
              {linkCopied ? 'Copiado ✓' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      <h3 className="admin-section-title">Invitaciones pendientes</h3>
      {loading ? (
        <p className="array-empty">Cargando…</p>
      ) : invitations.length === 0 ? (
        <p className="array-empty">No hay invitaciones pendientes.</p>
      ) : (
        <ul className="team-list">
          {invitations.map(inv => (
            <li key={inv.id} className="team-row">
              <div className="team-row-main">
                <b>{inv.displayName}</b>
                <span className="team-row-meta">
                  {inv.email} · usuario: {inv.username}
                  {inv.invitedByName ? ` · invitó ${inv.invitedByName}` : ''}
                </span>
                <span className={`team-row-meta${inv.expired ? ' is-expired' : ''}`}>
                  {inv.expired ? 'Vencida — vuelve a invitar' : `Vence ${dateTimeFmt.format(inv.expiresAt)}`}
                </span>
              </div>
              <button type="button" className="btn-mini btn-danger" onClick={() => handleRevoke(inv)}>
                Revocar
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="admin-section-title">Editores activos</h3>
      {loading ? (
        <p className="array-empty">Cargando…</p>
      ) : (
        <ul className="team-list">
          {editors.map(ed => (
            <li key={ed.id} className="team-row">
              <div className="team-row-main">
                <b>{ed.displayName}</b>
                <span className="team-row-meta">
                  usuario: {ed.username} · desde {dateFmt.format(ed.createdAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="admin-callout">
        El alta manual por consola (<code>npm run db:seed-editors</code>) sigue disponible para
        emergencias; esta pestaña es el camino normal.
      </div>
    </div>
  );
}
