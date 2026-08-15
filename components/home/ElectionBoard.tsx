import {
  CONFEDERATIONS,
  DEFECTORS,
  ELECTION,
  STANCE_LABEL,
  lastMovement,
  tally,
  type Stance,
} from '@/lib/data/fifa-election';

// ——— "El tablero de la FIFA" (sidebar module, 2026-08-15) ———
// A standing scoreboard of where the six confederations sit on Gianni
// Infantino ahead of the March 2027 Congress, kept in
// lib/data/fifa-election.ts and assembled from Playbook's own coverage.
//
// Why the rail and not a band: the homepage's 1+5 news package is a
// negotiated count and the section order below it is fixed
// (app/(public)/page.tsx). The sidebar is the page's documented extension
// point — "new modules go below" (HomeSidebar) — so a recurring tracker
// belongs here, under La cifra del día and above the rail ad.
//
// Why no map at this width: the `Mapa:` device draws real geography and
// needs the better part of an article column to stay legible; at ~300px
// half of Concacaf and most of Oceania are sub-pixel dots. The rail gets
// the tally, the article gets the map, and both read the same numbers off
// the same file. See the article-map module for the drawn version.
//
// It renders nothing when the fight is over: once a camp holds every vote
// there is no board left to keep, and the module should disappear on its
// own rather than wait for someone to remember to delete it.

const BAR_ORDER: Stance[] = ['en-contra', 'respalda', 'sin-pronunciarse'];

export function ElectionBoard() {
  const camps = tally();
  const live = camps.filter(camp => camp.votes > 0);
  if (live.length < 2) return null;

  const moved = lastMovement();
  const [year, month, day] = moved.split('-');
  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const movedLabel = `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;

  return (
    <section className="side-module side-board" aria-labelledby="side-board-title">
      <h2 className="side-title" id="side-board-title">El tablero de la FIFA</h2>
      <p className="side-board-lede">
        Dónde está cada confederación rumbo al voto de marzo de 2027, sobre {ELECTION.totalVotes} federaciones
        con derecho a voto.
      </p>

      <div
        className="side-board-bar"
        role="img"
        aria-label={live.map(camp => `${STANCE_LABEL[camp.stance]}: ${camp.votes} votos`).join('. ')}
      >
        {BAR_ORDER.filter(stance => camps.find(c => c.stance === stance)!.votes > 0).map(stance => {
          const camp = camps.find(c => c.stance === stance)!;
          return (
            <span
              key={stance}
              className={`side-board-seg side-board-seg--${stance}`}
              style={{ flexGrow: camp.votes }}
            />
          );
        })}
      </div>

      <ul className="side-board-keys">
        {camps.map(camp => (
          <li key={camp.stance} className={`side-board-key side-board-key--${camp.stance}`}>
            <span className="side-board-swatch" aria-hidden="true" />
            <span className="side-board-key-label">{STANCE_LABEL[camp.stance]}</span>
            <span className="side-board-key-count">{camp.votes}</span>
          </li>
        ))}
      </ul>

      <ul className="side-board-list">
        {CONFEDERATIONS.map(body => (
          <li key={body.key} className={`side-board-row side-board-row--${body.stance}`}>
            <span className="side-board-dot" aria-hidden="true" />
            <a className="side-board-name" href={`/articulo?id=${encodeURIComponent(body.articleId)}`}>
              {body.name}
            </a>
            <span className="side-board-votes">{body.votes}</span>
          </li>
        ))}
      </ul>

      {DEFECTORS.length > 0 && (
        <p className="side-board-defectors">
          <span className="side-board-defectors-label">Rompen con su bloque</span>
          {DEFECTORS.map((defector, index) => (
            <span key={defector.code}>
              {index > 0 && ' · '}
              <a
                href={`/articulo?id=${encodeURIComponent(defector.articleId)}`}
                title={defector.note}
              >
                {defector.name}
              </a>
            </span>
          ))}
        </p>
      )}

      <p className="side-board-foot">Último movimiento: {movedLabel}</p>
    </section>
  );
}
