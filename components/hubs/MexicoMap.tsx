import type { Hub } from '@/lib/hubs';
import { MEXICO_STATES, MEXICO_VIEWBOX } from '@/lib/hubs/mexico-map';

/**
 * Mexico, with the property's covered states filled.
 *
 * Data-driven: a state lights up because a plaza in the hub config names it
 * (HubPlaza.state), not because it is listed here. Adding a franchise to
 * lib/hubs/<slug>.ts colours the map with no change to this file.
 *
 * Accessibility: the SVG is aria-hidden and the same information is carried
 * by the plazas table beside it, which is the accessible source of truth. A
 * screen reader gets a real table, not thirty-two unlabelled paths.
 */
export function MexicoMap({ hub }: { hub: Hub }) {
  const byState = new Map<string, 'establecida' | 'anunciada'>();
  for (const plaza of hub.plazas) {
    if (!plaza.state) continue;
    // Established wins if a state somehow carries both.
    if (plaza.status === 'establecida' || !byState.has(plaza.state)) {
      byState.set(plaza.state, plaza.status);
    }
  }

  return (
    <svg
      className="hubx-map"
      viewBox={MEXICO_VIEWBOX}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {Object.entries(MEXICO_STATES).map(([name, d]) => (
        <path key={name} d={d} data-name={name} data-state={byState.get(name) ?? 'none'} />
      ))}
    </svg>
  );
}
