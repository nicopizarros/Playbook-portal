import { DashboardPlaceholder } from './DashboardPlaceholder';

export default function AdminDashboardPage() {
  return (
    <main className="admin-main">
      <div style={{ padding: 28, maxWidth: 720 }}>
        <p>CMS — en construcción (checkpoint 4 del Fase 4 de HANDOFF.md).</p>
        <p style={{ fontSize: 12.5, color: 'var(--gray-txt)' }}>
          El editor de abajo es solo para verificar manualmente el checkpoint 3
          (TipTap + subida a Blob) — se reemplaza por las 12 pestañas reales en
          el checkpoint 4.
        </p>
        <DashboardPlaceholder />
      </div>
    </main>
  );
}
