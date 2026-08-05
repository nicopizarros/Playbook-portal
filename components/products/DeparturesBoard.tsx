'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
// Registered locally, NOT in lib/gsap's shared entry point — per that
// file's own guidance: every plugin registered there ships to every route
// that touches GSAP, and only this board uses ScrambleText.
import { ScrambleTextPlugin } from '@/vendor/gsap/esm/ScrambleTextPlugin.js';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrambleTextPlugin);
}

// La Lana's masthead device (2026-08-05, replacing the route line the
// user kept reading as abstract): the DEPARTURES board from the card art,
// made editorial. Each row is a connection the investigations uncovered
// ("Infantino ↔ Trump"), set as a flight — the expediente number is the
// flight number, the case status is the flight status. On first view the
// connection cells scramble into place like split-flap panels; an open
// case's status blinks like a boarding call. Rows with a URL link to
// their expediente.

export type BoardRow = {
  fecha: string;
  conexion: string;
  expediente: string;
  estado: string;
  url?: string;
};

// Uppercase pool the scramble cycles through before settling — reads as
// flap characters, not binary noise.
const FLAP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·↔→';

function statusBlinks(estado: string): boolean {
  const s = estado.toLowerCase();
  return s.includes('abierto') || s.includes('curso');
}

export function DeparturesBoard({ label, note, rows }: { label: string; note: string; rows: BoardRow[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const played = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cells = Array.from(root.querySelectorAll<HTMLElement>('.lana-board-conexion'));
    if (!cells.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Stash the real text and blank the cells until the board scrolls
    // into view, then scramble each row in with a stagger.
    const finals = cells.map(cell => cell.textContent || '');
    cells.forEach(cell => {
      cell.textContent = '';
    });

    const tweens: { kill(): void }[] = [];
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(e => e.isIntersecting) || played.current) return;
        played.current = true;
        cells.forEach((cell, i) => {
          tweens.push(
            gsap.to(cell, {
              duration: 1.1,
              delay: i * 0.22,
              scrambleText: { text: finals[i], chars: FLAP_CHARS, speed: 0.4 },
            }),
          );
        });
        observer.disconnect();
      },
      { threshold: 0.35 },
    );
    observer.observe(root);

    return () => {
      observer.disconnect();
      tweens.forEach(t => t.kill());
      // If unmount raced the animation, leave the DOM text correct.
      cells.forEach((cell, i) => {
        cell.textContent = finals[i];
      });
    };
  }, [rows.length]);

  if (!rows.length) return null;

  return (
    <div className="lana-board" ref={rootRef}>
      <div className="lana-board-head">
        <span className="lana-board-label">{label}</span>
        <span className="lana-board-note">{note}</span>
      </div>
      <div className="lana-board-table" role="table" aria-label={label}>
        <div className="lana-board-row lana-board-row-head" role="row">
          <span role="columnheader" className="lana-board-fecha">Salida</span>
          <span role="columnheader" className="lana-board-conexion-col">Conexión</span>
          <span role="columnheader" className="lana-board-exp">Vuelo</span>
          <span role="columnheader" className="lana-board-estado-col">Estado</span>
        </div>
        {rows.map((row, i) => {
          const inner = (
            <>
              <span className="lana-board-fecha" role="cell">{row.fecha || '—'}</span>
              {/* aria-label keeps the real text for readers while the
                  visual cell scrambles in. */}
              <span className="lana-board-conexion" role="cell" aria-label={row.conexion}>
                {row.conexion}
              </span>
              <span className="lana-board-exp" role="cell">{row.expediente || '—'}</span>
              <span
                className={`lana-board-estado${statusBlinks(row.estado) ? ' is-blinking' : ''}`}
                role="cell"
              >
                {row.estado || '—'}
              </span>
            </>
          );
          return row.url ? (
            <a className="lana-board-row" role="row" href={row.url} key={`${row.conexion}-${i}`}>
              {inner}
            </a>
          ) : (
            <div className="lana-board-row" role="row" key={`${row.conexion}-${i}`}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
