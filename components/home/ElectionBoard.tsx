import {
  BUCKET_LABEL,
  ELECTION,
  FEDERATIONS,
  buckets,
  byStance,
  defectors,
  lastMovement,
} from '@/lib/data/fifa-election';

// ——— "El tablero de la FIFA" (sidebar module, 2026-08-15) ———
// A standing scoreboard of where the 211 voting federations sit on Gianni
// Infantino ahead of the March 2027 Congress, read from
// lib/data/fifa-election.ts.
//
// Four states, not two: a confederation's position and a federation's own
// words are different facts, and the whole point of the board is where
// they disagree. Mexico sits inside a Concacaf that asked for a review and
// backed Infantino anyway; England sits inside a UEFA that asked for one
// and said so itself. See that file's header for the model.
//
// Why the rail and not a band: the homepage's 1+5 news package is a
// negotiated count and the section order below it is fixed
// (app/(public)/page.tsx). The sidebar is the page's documented extension
// point — "new modules go below" (HomeSidebar).
//
// Why no map at this width: the `Mapa:` device draws real geography and
// needs the better part of an article column to stay legible; at ~300px
// half of Concacaf and most of Oceania are sub-pixel dots. The rail gets
// the tally, the article gets the map, and both read the same numbers.
//
// Colour is deliberately quiet (publisher feedback, 2026-08-15: it should
// not jump out of the page). The bar is one ink scale for the side asking
// for a review and one green scale for the side backing him, with full
// strength reserved for the federations that spoke in their own name — so
// the loudest colour on the module covers the 7 votes that earned it,
// not 75. Same logic as the map's ramp: intensity means "said it itself".
//
// It renders nothing when the fight is over: once a camp holds every vote
// there is no board left to keep, and the module should disappear on its
// own rather than wait for someone to remember to delete it.

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function shortDate(iso: string) {
  const [year, month, day] = iso.split('-');
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
}

export function ElectionBoard() {
  const camps = buckets();
  if (camps.filter(camp => camp.votes > 0).length < 2) return null;

  const spoke = FEDERATIONS.length;
  const broke = defectors();

  return (
    <section className="side-module side-board" aria-labelledby="side-board-title">
      <h2 className="side-title" id="side-board-title">El tablero de la FIFA</h2>
      <p className="side-board-lede">
        Dónde están las {ELECTION.totalVotes} federaciones que votan en marzo de 2027, y cuáles lo
        dijeron por su cuenta.
      </p>

      <div
        className="side-board-bar"
        role="img"
        aria-label={camps.map(camp => `${BUCKET_LABEL[camp.bucket]}: ${camp.votes}`).join('. ')}
      >
        {camps
          .filter(camp => camp.votes > 0)
          .map(camp => (
            <span
              key={camp.bucket}
              className={`side-board-seg side-board-seg--${camp.bucket}`}
              style={{ flexGrow: camp.votes }}
            />
          ))}
      </div>

      <ul className="side-board-keys">
        {camps.map(camp => (
          <li key={camp.bucket} className={`side-board-key side-board-key--${camp.bucket}`}>
            <span className="side-board-swatch" aria-hidden="true" />
            <span className="side-board-key-label">{BUCKET_LABEL[camp.bucket]}</span>
            <span className="side-board-key-count">{camp.votes}</span>
          </li>
        ))}
      </ul>

      <dl className="side-board-blocs">
        <dt>Piden revisión</dt>
        <dd>{byStance('en-contra').map(c => c.name).join(' · ')}</dd>
        <dt>Lo apoyan</dt>
        <dd>{byStance('respalda').map(c => c.name).join(' · ')}</dd>
      </dl>

      {broke.length > 0 && (
        <p className="side-board-note">
          <span className="side-board-note-label">Rompen con su bloque</span>
          {broke.map(f => f.name).join(' · ')}
        </p>
      )}

      <p className="side-board-foot">
        {spoke} de {ELECTION.totalVotes} se pronunciaron por su cuenta. Último movimiento:{' '}
        {shortDate(lastMovement())}.
      </p>
    </section>
  );
}
