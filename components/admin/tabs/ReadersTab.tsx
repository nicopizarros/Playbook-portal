'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getReadersData, type ReaderRow } from '@/lib/actions/readers';

const dateFmt = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

// Same self-loading pattern as TeamTab (immediate server state, no draft
// to save) -- read-only for now, this exists so the team can actually see
// who signed up (Fase 5 auth just shipped) without querying Postgres by
// hand.
export function ReadersTab() {
  const [readers, setReaders] = useState<ReaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReadersData();
      setReaders(data.readers);
      setLoadError('');
    } catch (err) {
      setLoadError(`No se pudo cargar la lista de lectores: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return readers;
    return readers.filter(r => r.email.toLowerCase().includes(q) || (r.name || '').toLowerCase().includes(q));
  }, [readers, query]);

  return (
    <div>
      <h2 className="admin-section-title">Lectores registrados</h2>
      <p className="admin-section-desc">
        Cuentas de lector creadas con Google o con correo y contraseña. {readers.length}{' '}
        {readers.length === 1 ? 'lector' : 'lectores'} en total.
      </p>

      {loadError && <p className="field-error">{loadError}</p>}

      <label className="admin-field">
        Buscar
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="correo o nombre"
        />
      </label>

      {loading ? (
        <p className="array-empty">Cargando…</p>
      ) : filtered.length === 0 ? (
        <p className="array-empty">{readers.length === 0 ? 'Todavía no hay lectores registrados.' : 'Sin resultados.'}</p>
      ) : (
        <ul className="team-list">
          {filtered.map(r => (
            <li key={r.id} className="team-row">
              <div className="team-row-main">
                <b>{r.name || r.email}</b>
                <span className="team-row-meta">
                  {r.email} · {r.authMethod === 'google' ? 'Google' : 'Correo y contraseña'} · desde{' '}
                  {dateFmt.format(r.createdAt)}
                </span>
                <span className="team-row-meta">
                  {r.totalReads} {r.totalReads === 1 ? 'lectura' : 'lecturas'} en total
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="btn-mini" onClick={() => void refresh()} disabled={loading}>
        Actualizar
      </button>
    </div>
  );
}
