import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HUBS, hubBySlug } from '@/lib/hubs';
import { hubArticles } from '@/lib/hubs/pool';
import { HubChain } from '@/components/hubs/HubChain';
import { HubCross, HubFigures, HubPlazas, HubSeason, HubStream } from '@/components/hubs/HubModules';
import { SITE_URL } from '@/lib/site-url';

// ONE ROUTE, EVERY HUB. Adding a coverage destination is a config entry in
// lib/hubs/ plus a token file in styles/hubs/ — this file never changes.
//
// FIXED-COLOUR ENVIRONMENT (2026-08-18). The hub no longer rides the site
// theme: it is a dark surface in both themes, the same posture
// styles/product-hubs.css already documents for the four editorial product
// hubs ("Every hub surface is a FIXED-color environment, same reasoning as
// the footer's --ink-fixed"). The publisher's direction is that a coverage
// destination should look like the property it covers, so the LFA hub
// speaks the LFA's visual language — dark ground, Anton display, a green
// kicker over each section, the flag gradient in the masthead.
//
// The property's mark is used as NOMINATIVE REFERENCE — it identifies what
// this coverage is about. The "Exclusiva Playbook" eyebrow and the Playbook
// header/footer stay prominent precisely so the page never reads as an
// official league property.

export function generateStaticParams() {
  return HUBS.map(hub => ({ slug: hub.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hub = hubBySlug(slug);
  if (!hub) return {};
  return {
    title: `${hub.name} — Exclusiva Playbook`,
    description: hub.description,
    alternates: { canonical: `${SITE_URL}/coberturas/${hub.slug}` },
  };
}

export default async function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hub = hubBySlug(slug);
  if (!hub) notFound();

  const articles = await hubArticles(hub);

  return (
    // data-hub scopes the token file, so the palette cannot escape this
    // subtree — the site header and footer are untouched on this route.
    <main className="hubx" data-hub={hub.slug} id={`hub-${hub.slug}`}>
      {/* ------------------------------------------------------- Masthead
          Full-bleed flag gradient with the diagonal hatch the league uses,
          then the lockup over it. */}
      <header className="hubx-hero">
        <div className="hubx-hero-wash" aria-hidden="true" />
        <div className="container hubx-hero-inner">
          <Link className="hubx-back" href="/">← Volver a Playbook</Link>
          <div className="hubx-lockup">
            {hub.identity.logo && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                className="hubx-mark"
                src={hub.identity.logo.src}
                alt={hub.identity.logo.alt}
                width={hub.identity.logo.width}
                height={hub.identity.logo.height}
              />
            )}
            <div className="hubx-lockup-type">
              <p className="hubx-eyebrow">Exclusiva Playbook</p>
              {/* The wordmark ALWAYS renders — the mark above is layered
                  over it, never a replacement for it. */}
              <h1 className="hubx-wordmark">{hub.identity.wordmark}</h1>
              <p className="hubx-tagline">{hub.tagline}</p>
              {/* Declared relationship. Rendered only when one genuinely
                  exists — see Hub.partnership. */}
              {hub.partnership && (
                <p className="hubx-partner">
                  <span className="hubx-partner-brand">Playbook</span>
                  <span className="hubx-partner-role">{hub.partnership}</span>
                </p>
              )}
            </div>
          </div>
          <p className="hubx-thesis">{hub.thesis}</p>
          <p className="hubx-fullname">{hub.fullName}</p>
        </div>
      </header>

      <div className="container">
        {hub.chain && (
          <section className="hubx-section" aria-labelledby="hubx-chain-title">
            <p className="hubx-kicker">La meta</p>
            <HubChain chain={hub.chain} />
          </section>
        )}

        <HubFigures hub={hub} />
        <HubPlazas hub={hub} />
        <HubSeason hub={hub} />
        <HubStream hub={hub} articles={articles} />
        <HubCross hub={hub} />
      </div>
    </main>
  );
}
