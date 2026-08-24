import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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
  HubRail,
  HubSeason,
  HubStream,
} from '@/components/hubs/HubModules';
import { SITE_URL } from '@/lib/site-url';
import { HubMotion } from '@/components/hubs/HubMotion';
import { VisitBeacon } from '@/components/analytics/VisitBeacon';

// An unlisted hub (Hub.listed === false) means UNDISCOVERABLE, not
// unreachable: absent from the nav's Coberturas zone (HeaderNav.tsx) and
// from the sitemap (app/sitemap.ts), and `robots: noindex,nofollow` below
// — but the route itself has no access gate. Anyone with the direct URL
// can open it, logged in or not.
//
// 2026-08-24, publisher's explicit call: deliberately looser than the
// editor-only hard-404 this route carried between 2026-08-19 and today.
// That gate existed because the hub was briefly `listed: true` and Google
// indexed it while its masthead already stated the partnership as fact —
// i.e. the actual incident was a DISCOVERY leak (nav + sitemap + a real
// index), not someone guessing the URL. `robots: noindex` plus staying out
// of nav/sitemap is what prevents that from recurring; the editor-only
// gate was defense-in-depth on top of it, traded away now for "share the
// link with whoever needs to see it before the announcement, without
// making them log in first."
//
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

// Forced dynamic. Originally because generateMetadata/the page both read
// the editor session on every request (2026-08-19) — that gate is gone
// (see the Hub.listed comment above), but this stays dynamic anyway so the
// coverage stream (hubArticles below) never lags a build's static output.
export const dynamic = 'force-dynamic';

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
    // The actual anti-discovery mechanism: an unlisted hub is real,
    // reachable content (see the comment above) but must never be indexed
    // or followed into, regardless of who's looking at it.
    robots: { index: hub.listed, follow: hub.listed },
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
      {/* Per-hub reporting: GA4's automatic page_view already has the URL,
          but this carries the slug as a dimension so "how is LFA doing"
          survives the route rename that docs/TODO.md §0.0 is still weighing
          (/coberturas/* -> /exclusivas/*). */}
      <VisitBeacon event="hub_visit" params={{ hub_slug: hub.slug, product: `hub:${hub.slug}` }} />
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

          PHOTOGRAPHIC MASTHEAD (2026-08-24). The artwork arrives as a CSS custom
          property rather than an <img> or a rule in hub.css, for two
          reasons: styles/hubs/hub.css is structure-only and must never
          learn an asset path (it used to hardcode /hubs/lfa/board.jpg,
          which was a quiet violation of its own header), and the scrim
          needs to composite over it in the same paint. Absent, the
          masthead falls back to the token wash — see --hub-hero-wash. */}
      <header
        className="hubx-hero"
        style={
          hub.identity.heroArt
            ? ({ '--hub-hero-art': `url('${hub.identity.heroArt.src}')` } as React.CSSProperties)
            : undefined
        }
      >
        <div className="container hubx-hero-inner">
          <Link className="hubx-back" href="/">← Volver a Playbook</Link>

          <div className="hubx-hero-copy">
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

            {/* Two ways in, never more: the newest work, and the beats we
                have committed to covering. Both anchor into modules that
                are always present — the stream always renders (its empty
                state is designed), and the pillars link only appears
                because the rail below already proved the module exists. */}
            <div className="hubx-hero-actions">
              <a className="hubx-btn" data-variant="primary" href="#lo-ultimo">
                Ver lo último ↓
              </a>
              {hub.pillars?.length ? (
                <a className="hubx-btn" href="#temas">Qué estamos siguiendo</a>
              ) : null}
            </div>
          </div>
        </div>
        {hub.identity.heroArt?.credit && (
          <span className="hubx-hero-credit">{hub.identity.heroArt.credit}</span>
        )}
      </header>

      <HubRail hub={hub} />

      <div className="container">
        {/* Content opens the page, not a corporate factsheet — same
            reasoning the 2026-08-19 mockup's own internal note gives for
            leading with "Lo último". */}
        <HubStream hub={hub} articles={articles} />

        {hub.chain && (
          <section className="hubx-section" id="la-meta" aria-labelledby="hubx-chain-title">
            <p className="hubx-kicker">La meta</p>
            <HubChain chain={hub.chain} />
          </section>
        )}
      </div>

      {/* FULL-BLEED, so outside the container: the board is the page's one
          light plane and the newsletter is its closing band. Both open
          their own .container internally. */}
      <HubFigures hub={hub} />

      <div className="container">
        <HubPillars hub={hub} />
        <HubPlazas hub={hub} />
        <HubMoments hub={hub} />
        <HubSeason hub={hub} />
        <HubAccess hub={hub} />
        <HubCross hub={hub} />
      </div>

      <HubNewsletter hub={hub} />
      <HubMotion />
    </main>
  );
}
