import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { HUBS, hubBySlug } from '@/lib/hubs';
import { hubArticles } from '@/lib/hubs/pool';
import { HubChain } from '@/components/hubs/HubChain';
import { HubCross, HubFigures, HubPlazas, HubSeason, HubStream } from '@/components/hubs/HubModules';
import { SITE_URL } from '@/lib/site-url';

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
