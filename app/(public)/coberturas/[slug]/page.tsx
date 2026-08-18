import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HUBS, hubBySlug } from '@/lib/hubs';
import { hubArticles } from '@/lib/hubs/pool';
import { HubChain } from '@/components/hubs/HubChain';
import {
  HubCross, HubFigures, HubPlazas, HubSeason, HubSponsor, HubStream,
} from '@/components/hubs/HubModules';
import { SITE_URL } from '@/lib/site-url';

// ONE ROUTE, EVERY HUB. Adding a coverage destination is a config entry in
// lib/hubs/ plus a token file in styles/hubs/ — this file never changes.
// If a future hub needs a code change here, the abstraction has failed and
// the fix is to generalise, not to special-case.

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
    title: `${hub.name} — Cobertura Playbook`,
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
    // data-hub is what scopes the token file (styles/hubs/<slug>.tokens.css).
    // The hub's palette therefore cannot escape this subtree — nothing bleeds
    // into the header, footer or any other page's chrome.
    <main className="hubx" data-hub={hub.slug} id={`hub-${hub.slug}`}>
      <div className="container">
        <Link className="section-link back-link" href="/">← Volver a Playbook</Link>

        <header className="hubx-masthead">
          <p className="hubx-eyebrow">Exclusiva Playbook</p>
          <div className="hubx-lockup">
            {/* Nominative-reference slot. Absent until rights are confirmed;
                the wordmark below renders either way, so an unlicensed or
                withdrawn mark degrades to type rather than to a hole. */}
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
            <h1 className="hubx-wordmark">{hub.identity.wordmark}</h1>
          </div>
          <p className="hubx-fullname">{hub.fullName}</p>
          <p className="hubx-thesis">{hub.thesis}</p>
        </header>

        {/* Hero as thesis: the masthead states the argument, then the
            signature device puts the league's defining number on the table.
            Not a stat card with a gradient. */}
        {hub.chain && (
          <div className="hubx-section">
            <HubChain chain={hub.chain} />
          </div>
        )}

        <HubFigures hub={hub} />
        <HubPlazas hub={hub} />
        <HubSeason hub={hub} />
        <HubStream hub={hub} articles={articles} />
        <HubSponsor hub={hub} />
        <HubCross hub={hub} />
      </div>
    </main>
  );
}
