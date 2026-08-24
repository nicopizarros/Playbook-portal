import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { HUBS, hubBySlug } from '@/lib/hubs';
import { hubArticles } from '@/lib/hubs/pool';
import { HubChain } from '@/components/hubs/HubChain';
import {
  HubAccess,
  HubCross,
  HubFigures,
  HubMoments,
  HubNewsletter,
  HubPillars,
  HubPlazas,
  HubSeason,
  HubStream,
} from '@/components/hubs/HubModules';
import { SITE_URL } from '@/lib/site-url';
import { HubMotion } from '@/components/hubs/HubMotion';
import { VisitBeacon } from '@/components/analytics/VisitBeacon';

// An unlisted hub (Hub.listed === false) is a real access boundary, not
// just "nothing links here" — the LFA hub was briefly listed, Google
// indexed it, and the masthead states the partnership as fact, so an
// unlisted hub must be unreachable by anyone who isn't logged in as an
// editor, not merely undiscoverable. Same session check
// app/admin/(protected)/layout.tsx uses; a non-editor gets the ordinary
// 404 boundary, identical to a slug that doesn't exist, never a "this is
// restricted" page that would itself confirm something is being hidden
// here.
async function assertHubViewable(hub: { listed: boolean }) {
  if (hub.listed) return;
  const session = await auth();
  if (!session || session.user.role !== 'editor') notFound();
}

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

// Forced dynamic (2026-08-19): assertHubViewable/generateMetadata now read
// the editor session on every request for an unlisted hub, which Next
// can't reconcile with a build-time-static response — same reasoning
// app/admin/(protected)/layout.tsx already documents for its own
// `force-dynamic`. Applies to every hub, not only unlisted ones, since
// this route can't know at build time which hubs will still be unlisted
// by the time a request actually lands.
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hub = hubBySlug(slug);
  if (!hub) return {};
  // An unlisted hub is now editor-only (see assertHubViewable below), so a
  // logged-out crawler or reader hitting this URL should see the exact
  // metadata a nonexistent slug would — never a title/description that
  // confirms a hidden hub exists at this address.
  if (!hub.listed) {
    const session = await auth();
    if (!session || session.user.role !== 'editor') {
      return { title: 'Página no encontrada', robots: { index: false, follow: false } };
    }
  }
  return {
    title: `${hub.name} — Exclusiva Playbook`,
    description: hub.description,
    alternates: { canonical: `${SITE_URL}/coberturas/${hub.slug}` },
    // Mirrors Hub.listed: belt-and-suspenders alongside assertHubViewable's
    // hard 404 — a logged-in editor viewing an unlisted hub still shouldn't
    // have it indexable from their own session.
    robots: { index: hub.listed, follow: hub.listed },
  };
}

export default async function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hub = hubBySlug(slug);
  if (!hub) notFound();
  await assertHubViewable(hub);

  const articles = await hubArticles(hub);

  return (
    // data-hub scopes the token file, so the palette cannot escape this
    // subtree — the site header and footer are untouched on this route.
    <main className="hubx" data-hub={hub.slug} id={`hub-${hub.slug}`}>
      {/* Per-hub reporting: GA4's automatic page_view already has the URL,
          but this carries the slug as a dimension so "how is LFA doing"
          survives the route rename that docs/TODO.md §0.0 is still weighing
          (/coberturas/* -> /exclusivas/*). */}
      <VisitBeacon event="hub_visit" params={{ hub_slug: hub.slug, product: `hub:${hub.slug}` }} />
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
        {/* Content opens the page, not a corporate factsheet — same
            reasoning the 2026-08-19 mockup's own internal note gives for
            leading with "Lo último". */}
        <HubStream hub={hub} articles={articles} />

        {hub.chain && (
          <section className="hubx-section" aria-labelledby="hubx-chain-title">
            <p className="hubx-kicker">La meta</p>
            <HubChain chain={hub.chain} />
          </section>
        )}

        <HubFigures hub={hub} />
        <HubPillars hub={hub} />
        <HubPlazas hub={hub} />
        <HubMoments hub={hub} />
        <HubSeason hub={hub} />
        <HubAccess hub={hub} />
        <HubCross hub={hub} />
      </div>
      <div className="container">
        <HubNewsletter hub={hub} />
      </div>
      <HubMotion />
    </main>
  );
}
