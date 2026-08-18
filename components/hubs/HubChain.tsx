import type { HubChain as Chain } from '@/lib/hubs';
import { HubSource } from './HubSource';

// Parses the display value back to a number for the geometry. A figure
// that isn't countable ("US$100M") can't drive a chain, which is why the
// device is reserved for the one fact that has a real current-vs-target
// pair. Unparseable → the module returns null and vanishes from the page
// rather than rendering a measurement it can't make.
function count(value: string): number | null {
  const n = Number(value.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}


/**
 * LA CADENA — the hub's signature.
 *
 * The chain crew is the only apparatus in any sport carried onto the field
 * for the sole purpose of adjudicating whether progress crossed a stated
 * threshold. That is exactly how a business reader should see this
 * property: expansion is not a vibe, it is a measured distance to a line.
 *
 * Two rules this device must never break:
 *  1. It renders ONLY with a sourced current AND a sourced target. No
 *     placeholder numbers, ever — absent beats fake.
 *  2. The readout leads with DISTANCE REMAINING in the property's own
 *     units. Never a percentage: "67%" is the generic-progress-bar answer
 *     and tells a reader nothing they can act on. "Faltan 4 franquicias"
 *     is a fact they can hold.
 */
export function HubChain({ chain }: { chain: Chain }) {
  const current = count(chain.current.value);
  const target = count(chain.target.value);
  if (current === null || target === null || target <= 0 || current > target) return null;

  const remaining = target - current;
  const reached = `${Math.max(0, Math.min(100, (current / target) * 100))}%`;
  const unit = remaining === 1 ? chain.unit[0] : chain.unit[1];

  return (
    <section className="hubx-chain" aria-labelledby="hubx-chain-title">
      <div className="hubx-chain-head">
        <h2 className="hubx-chain-title" id="hubx-chain-title">{chain.title}</h2>
        <span className="hubx-chain-horizon">Meta {chain.horizon}</span>
      </div>

      {/* The measure is decorative markup around a sentence that is already
          in the DOM below (.hubx-chain-readout), so it is hidden from
          assistive tech rather than narrated as a pile of numbers. */}
      <div className="hubx-chain-track" aria-hidden="true">
        <div className="hubx-chain-ticks">
          {Array.from({ length: Math.min(target, 24) }, (_, i) => (
            <span
              className="hubx-chain-tick"
              data-state={i < current ? 'gained' : 'open'}
              key={i}
            />
          ))}
        </div>
        <div className="hubx-chain-span" style={{ ['--reached' as string]: reached }} />
        {/* The chain itself: ball → line to gain, i.e. what is LEFT. */}
        <div className="hubx-chain-links" style={{ ['--reached' as string]: reached }} />
        <div
          className="hubx-chain-pole"
          data-role="current"
          data-value={chain.current.value}
          style={{ ['--reached' as string]: reached }}
        />
        <div className="hubx-chain-pole" data-role="gain" data-value={chain.target.value} />
      </div>

      <p className="hubx-chain-readout">
        <span className="hubx-chain-remaining">{remaining}</span>
        <span className="hubx-chain-caption">
          {remaining === 1 ? 'franquicia para' : `${unit} para`} llegar a {chain.target.value} en{' '}
          {chain.horizon}. Hoy son {chain.current.value}.
        </span>
      </p>

      <HubSource source={chain.current.source} />
    </section>
  );
}
