import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteContent } from '@/lib/data/site-content';
import { LEADERSHIP, EDITORIAL_PRINCIPLES, PRODUCT_CADENCE } from '@/lib/data/leadership';
import { PRODUCT_HUBS } from '@/lib/product-hubs';
import { jsonLdScript } from '@/lib/json-ld';
import { safeUrl } from '@/lib/safe-url';
import { SITE_URL } from '@/lib/site-url';

// /nosotros — the corporate page (ronda 1, "Nosotros.dc.html").
//
// This is the INDEXABLE answer to "quién es Playbook": /equipo answers
// "who writes here" from live bylines, this one answers "who runs this and
// with what rules". They are different questions and deliberately
// different pages; the panel in the header links to both.
//
// Variants chosen from the design's own defaults: hero `lockup`, misión
// `asimétrico`, cómo-trabajamos `reglas`, cierre `puertas`.
//
// Copy discipline: every [BRACKET] in the mock is a gap for the client to
// fill, and a live page cannot print a bracket. Where a gap had no true
// replacement the sentence is dropped rather than guessed — see
// lib/data/leadership.ts and docs/TODO.md. Two consequences visible here:
// the hero's "Desde [AÑO]" badge is absent until the founding year is
// supplied, and the visión reads without its horizon year.

const DESCRIPTION =
  'Playbook es la casa editorial que cubre el negocio del deporte en México y Latinoamérica: ' +
  'el capital, los derechos, las marcas, los datos y la relación con el aficionado. Quién lo ' +
  'reporta, con qué reglas y con qué alcance.';

export const metadata: Metadata = {
  title: 'Nosotros',
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/nosotros` },
  robots: { index: true, follow: true },
};

// Same "read live data, don't prerender a stale snapshot" reasoning as the
// rest of app/(public): the reach figures come from site_content.
export const dynamic = 'force-dynamic';

export default async function NosotrosPage() {
  const content = await getSiteContent();
  const reach = content.statsSection.stats;
  const ctaUrl = safeUrl(content.nav.ctaUrl);

  const aboutJsonLd = jsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${SITE_URL}/nosotros#aboutpage`,
    url: `${SITE_URL}/nosotros`,
    name: 'Nosotros — Playbook',
    description: DESCRIPTION,
    inLanguage: 'es-MX',
    about: { '@id': `${SITE_URL}#organization` },
    publisher: { '@id': `${SITE_URL}#organization` },
  });

  return (
    <main className="nosotros-page" id="nosotros-main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: aboutJsonLd }} />

      {/* ------------------------------------------------------- 1. Hero */}
      <section className="container nos-hero">
        <span className="eyebrow">Nosotros</span>
        <h1 className="nos-hero-title">Tú ves el partido. Nosotros vemos el negocio.</h1>
        <div className="nos-hero-foot">
          <p className="nos-hero-dek">
            Playbook es la casa editorial que cubre el negocio del deporte en México y
            Latinoamérica: el capital, los derechos, las marcas, los datos y la relación con el
            aficionado.
          </p>
          {/* La ficha "Desde [AÑO]" del diseño vive acá cuando llegue el año
              de fundación (hueco 01). Se omite en vez de imprimir el
              corchete: un hueco visible es correcto en una maqueta y no en
              una página publicada. */}
        </div>
      </section>

      {/* --------------------------------------------- 2. Misión y visión */}
      <section className="container nos-section" id="mision">
        <div className="nos-mision">
          <div className="nos-mision-main">
            <p className="nos-label">Misión</p>
            <p className="nos-mision-copy">
              Existimos para que quien decide en el deporte latinoamericano tenga la misma calidad
              de información que su contraparte en Estados Unidos o Europa. Reportamos el dinero y
              los incentivos detrás de cada movimiento, con contexto y sin ruido.
            </p>
          </div>
          <div className="nos-mision-aside">
            <p className="nos-label">Visión</p>
            <p className="nos-vision-copy">
              Que la conversación sobre el negocio del deporte en la región se dé con datos
              públicos, comparables y verificables, y que Playbook sea el lugar donde esa
              conversación empieza.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------- 3. Cómo trabajamos */}
      <section className="container nos-section" id="como-trabajamos">
        <div className="nos-head">
          <h2>Cómo trabajamos</h2>
          <p className="nos-head-note">Cuatro reglas que decidimos antes de cada nota, no después.</p>
        </div>
        <div className="nos-rules">
          {EDITORIAL_PRINCIPLES.map(rule => (
            <div className="nos-rule" key={rule.num}>
              <div className="nos-rule-lead">
                <span className="nos-rule-num" aria-hidden="true">
                  {rule.num}
                </span>
                <h3>{rule.lead}</h3>
              </div>
              <p className="nos-rule-body">{rule.body}</p>
            </div>
          ))}
        </div>
        <p className="nos-rules-more">
          <Link className="nos-underline" href="/estandares">
            Leer nuestros estándares editoriales completos
          </Link>
        </p>
      </section>

      {/* -------------------------------------------------- 4. Liderazgo */}
      <section className="container nos-section" id="liderazgo">
        <div className="nos-head">
          <h2>Liderazgo</h2>
          <Link className="nos-head-link" href="/equipo">
            Directorio completo de firmas
          </Link>
        </div>
        <div className="nos-leaders">
          {LEADERSHIP.map(person => (
            <article className="nos-leader" key={person.name}>
              <div className="nos-leader-portrait">
                {person.photo ? (
                  // Plain <img> for the same reason every other editorial
                  // image in this repo uses one: the URL is supplied
                  // content, not a fixed set of hosts next/image can
                  // allow-list. See next.config.ts's CSP note.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={person.photo}
                    width={400}
                    height={500}
                    alt={`Retrato de ${person.name}`}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  // The designed no-portrait state, not a broken image:
                  // a monogram in a Playbook frame.
                  <span className="nos-leader-monogram" aria-hidden="true">
                    {person.initials}
                  </span>
                )}
              </div>
              <p className="nos-leader-role">{person.role}</p>
              <h3 className="nos-leader-name">{person.name}</h3>
              <p className="nos-leader-bio">{person.bio}</p>
              {person.credential && <p className="nos-leader-credential">{person.credential}</p>}
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- 5. Alcance */}
      {reach.length > 0 && (
        <section className="container nos-section" aria-label="Alcance de Playbook">
          <div className="nos-reach">
            {reach.map((stat, i) => (
              <div className="nos-reach-cell" key={i}>
                {/* Sin contador animado, a diferencia de StatsSection en la
                    portada: acá el número se lee, no se actúa. Mismo dato,
                    misma fuente (site_content), otro registro. */}
                <b>{stat.value}</b>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
          <p className="nos-reach-note">
            Cifras vigentes en el sitio. Sin contadores animados: el número se lee, no se actúa.
          </p>
        </section>
      )}

      {/* ----------------------------------------------- 6. Los productos */}
      <section className="container nos-section">
        <div className="nos-head">
          <h2>Los productos</h2>
          <p className="nos-head-note">Cuatro productos, un solo criterio editorial.</p>
        </div>
        <div className="nos-products">
          {PRODUCT_HUBS.map(product => (
            <Link
              className="nos-product"
              key={product.source}
              href={product.path}
              style={{ borderLeftColor: `var(${product.token})` }}
            >
              <span className="nos-product-cadence" style={{ color: `var(${product.token})` }}>
                {PRODUCT_CADENCE[product.source] ?? 'Periódico'}
              </span>
              <h3>{product.name}</h3>
              <p>{product.descriptor}</p>
              <span className="nos-product-go">Ver el hub →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- 7. Cierre */}
      <section className="container nos-section nos-close-section">
        <div className="nos-close">
          <div className="nos-close-door">
            <span className="nos-label">Para leer</span>
            <h3>El negocio del deporte, en tu correo</h3>
            <p>Cuatro productos, sin costo. Cancelas cuando quieras.</p>
            <a className="btn" href={ctaUrl} target="_blank" rel="noopener noreferrer">
              {content.nav.ctaLabel}
            </a>
          </div>
          <div className="nos-close-door">
            <span className="nos-label">Para trabajar con nosotros</span>
            <h3>Marcas, propiedades y alianzas</h3>
            <p>Patrocinio, contenido de marca identificado como tal y proyectos de datos.</p>
            <Link className="btn nos-btn-ghost" href="/contacto#alianzas">
              Trabaja con Playbook
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
