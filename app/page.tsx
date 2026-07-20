// Placeholder — Phase 1 of the Next.js migration only scaffolded config/DB,
// with no pages yet, which left `next build` with nothing to build. This
// keeps CI/Vercel builds green while Phase 2 (the real homepage, ported
// from legacy/index.html against the new DB) is in progress. See
// HANDOFF.md's "Registro de progreso" for current status.
export default function HomePage() {
  return (
    <main style={{ padding: '48px 24px', fontFamily: 'system-ui, sans-serif', maxWidth: 640 }}>
      <h1>Playbook</h1>
      <p>La migración a Next.js está en progreso. Esta página es un placeholder temporal.</p>
    </main>
  );
}
