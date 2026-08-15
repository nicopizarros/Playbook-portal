import {
  BUCKET_LABEL,
  ELECTION,
  FEDERATIONS,
  buckets,
  byStance,
  defectors,
  lastMovement,
  sides,
} from '@/lib/data/fifa-election';

// ——— "El tablero de la FIFA" (sidebar module, 2026-08-15) ———
// A standing scoreboard of where the 210 voting federations sit on Gianni
// Infantino ahead of the March 2027 Congress, read from
// lib/data/fifa-election.ts.
//
// Five states, not two: a confederation's position and a federation's own
// words are different facts, and the whole point of the board is where
// they disagree. Mexico sits inside a Concacaf that asked for a review and
// backed Infantino anyway; England sits inside a UEFA that asked for one
// and said so itself; the United States backed Concacaf's statement
// without declaring on Infantino at all. See that file's header.
//
// 210 ballots, not 211: Nepal is a FIFA member whose vote is suspended.
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
// Two opposed hues (publisher feedback, 2026-08-15: the two camps need
// contrast, Playbook's green against a blue). The house green carries the
// side backing Infantino and the Noticias blue the side asking for a
// review, with FULL strength reserved for the federations that spoke in
// their own name and a held-back tint for the ones inheriting their bloc's
// position. Same two variables as the article map's `bandos` palette —
// hue says which side, intensity says whether they said it themselves —
// so the rail and the map teach the reader one legend, not two.
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
  const tally = sides();

  const spoke = FEDERATIONS.length;
  const broke = defectors();

  return (
    <section className="side-module side-board" aria-labelledby="side-board-title">
      <h2 className="side-title" id="side-board-title">El tablero de la FIFA</h2>
      <p className="side-board-lede">
        Las {ELECTION.totalVotes} federaciones que votan en marzo de 2027: {tally.respalda} con
        Infantino, {tally.enContra} pidiendo una revisión independiente.
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
        {spoke} de {ELECTION.totalVotes} se pronunciaron por su cuenta; el resto cuenta por lo que
        decidió su confederación. Último movimiento: {shortDate(lastMovement())}.
      </p>
    </section>
  );
}
