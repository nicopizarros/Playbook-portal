import Link from 'next/link';

// Homepage entry point into the archive (Fase 7 UX), from the v23
// prototype's topic-directory pattern: a bordered six-column grid of topic
// links (three columns on mobile, see styles/sections.css), hover in
// brand green. Twelve topics — six sports, six business verticals — each
// linking to the real /archivo filter for it, so every cell lands on a
// working, pre-filtered collection page. Values must match lib/taxonomy.ts
// exactly (they're what /archivo validates against); labels are display
// shorthand where the taxonomy value is too long for a cell.
const TOPICS: { label: string; href: string }[] = [
  { label: 'Fútbol', href: '/archivo?sport=F%C3%BAtbol' },
  { label: 'Liga MX', href: '/archivo?sport=Liga%20MX' },
  { label: 'NFL', href: '/archivo?sport=NFL' },
  { label: 'NBA', href: '/archivo?sport=NBA' },
  { label: 'Béisbol', href: '/archivo?sport=B%C3%A9isbol' },
  { label: 'F1', href: '/archivo?sport=F1' },
  { label: 'Derechos de TV', href: '/archivo?vertical=Derechos%20de%20TV%20y%20Streaming' },
  { label: 'Patrocinios', href: '/archivo?vertical=Patrocinios' },
  { label: 'Finanzas', href: '/archivo?vertical=Finanzas%20y%20Negocio' },
  { label: 'Inversión', href: '/archivo?vertical=Private%20Equity%20e%20Inversiones' },
  { label: 'Venues', href: '/archivo?vertical=Infraestructura%20y%20Venues' },
  { label: 'Audiencias', href: '/archivo?vertical=Audiencias%20y%20Consumo' },
];

export function TopicDirectory() {
  return (
    <section className="container topic-dir-section" aria-labelledby="topic-dir-title">
      <div className="section-head reveal" style={{ paddingTop: 0 }}>
        <div>
          <h2 id="topic-dir-title">Explora por tema</h2>
        </div>
        <Link className="section-link" href="/archivo">
          Ver el archivo completo
        </Link>
      </div>
      <nav className="topic-directory reveal" aria-label="Temas del archivo">
        {TOPICS.map(t => (
          <Link key={t.label} href={t.href}>
            {t.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
