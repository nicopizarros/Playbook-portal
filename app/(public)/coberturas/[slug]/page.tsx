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
      {/* ------------------------------------------------------- Masthead
          CO-BRANDING PER THE LEAGUE'S OWN KIT ("Asociación con otros logos
          / marcas"): the associated mark sits LEFT and LFA sits RIGHT when
          the VOICE is the partner's — which it is here, because this is
          Playbook's coverage, not an LFA channel. The two are separated by
          a rule of the same height as the LFA mark, at the distance the kit
          defines (the width of the letters "FA" in the logo).

          The kit specifies a CINDER separator, which assumes a light
          ground; on a Cinder page that would be invisible, so the rule uses
          the Cinder-family --hub-edge. Same intent, legible substrate.

          Background is the kit's approved "Black board" texture, which is
          also one of the only two grounds the 2026 campaign lockup is
          permitted on ("NO DEBEN SER USADAS SOBRE FONDOS BLANCOS"). */}
      <header className="hubx-hero">
        <div className="container hubx-hero-inner">
          <Link className="hubx-back" href="/">← Volver a Playbook</Link>

          <div className="hubx-lockup">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="hubx-lockup-mark hubx-lockup-playbook"
              src="/assets/img/playbook-logo-dark.png"
              alt="Playbook"
              width={520}
              height={121}
            />
            <span className="hubx-lockup-rule" aria-hidden="true" />
            {hub.identity.logo && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                className="hubx-lockup-mark hubx-lockup-property"
                src={hub.identity.logo.src}
                alt={hub.identity.logo.alt}
                width={hub.identity.logo.width}
                height={hub.identity.logo.height}
              />
            )}
          </div>

          {hub.partnership && <p className="hubx-partner">{hub.partnership}</p>}

          {/* The wordmark still always renders — it is the h1, so the page
              names its property whether or not any mark resolves. */}
          <h1 className="hubx-wordmark">
            <span className="hubx-wordmark-kicker">{hub.identity.wordmark}</span>
            {hub.tagline}
          </h1>

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
