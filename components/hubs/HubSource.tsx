import type { HubSource as Source } from '@/lib/hubs';

/**
 * Provenance line under every factual claim on a hub page.
 *
 * A source with a public URL links. A source WITHOUT one still renders,
 * carrying a visible "sin cita pública" marker (styles/hubs/hub.css's
 * .hubx-unverified). That is deliberate: the alternatives were to drop the
 * publisher's own knowledge from the page, or to launder it into looking
 * reported. Showing it, labelled, keeps the page honest AND makes the
 * citation backlog visible on the artefact itself — which for a
 * business-intelligence outlet is the whole point.
 */
export function HubSource({ source }: { source: Source }) {
  const unverified = !source.url;
  return (
    // The qualifier rides in `title` rather than inline: shown in full it
    // ran to three lines under every figure and buried the number it was
    // meant to support. The "sin cita pública" chip carries the signal;
    // the detail is one hover (or one screen-reader pass) away.
    <span
      className={`hubx-source${unverified ? ' hubx-unverified' : ''}`}
      title={source.note ? `${source.label} — ${source.note}` : source.label}
    >
      {source.url ? (
        <a href={source.url} target="_blank" rel="noopener noreferrer">
          {source.label}
        </a>
      ) : (
        source.label
      )}
    </span>
  );
}
