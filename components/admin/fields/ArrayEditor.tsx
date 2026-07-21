'use client';

import { useState } from 'react';

type Badge = { text: string; kind?: string };

type ArrayEditorProps<T> = {
  items: T[];
  onChange: (items: T[]) => void;
  newItem: () => T;
  renderItem: (item: T, index: number) => React.ReactNode;
  itemTitle: (item: T, index: number) => string;
  itemBadge?: (item: T, index: number) => Badge | null;
  addLabel?: string;
  emptyHint?: string;
  // Overrides the default "splice it out of the array" removal — the
  // Articles tab uses this to archive an existing DB row instead of just
  // dropping it from local state (see lib/actions/admin.ts's
  // archiveArticle and HANDOFF.md's per-article save design).
  onRemove?: (item: T, index: number) => void;
};

// Collapsible, drag-reorderable list — same interaction as legacy/admin/
// dashboard.js's arrayEditor(). Expand state and drag tracking are keyed by
// array *index*, not object identity: an immutable per-keystroke update
// (onChange(items.map(...))) produces a new object reference for the edited
// item on every keystroke, which would otherwise constantly "lose" an
// identity-keyed expanded flag. Index-based tracking has one accepted
// trade-off instead — right after a drag reorder, the expanded/collapsed
// look can momentarily read as "follows the position, not the moved card" —
// a minor visual quirk, not a data bug, and far better than remounting a
// field's input (losing focus/cursor) on every keystroke.
export function ArrayEditor<T>({
  items,
  onChange,
  newItem,
  renderItem,
  itemTitle,
  itemBadge,
  addLabel = '+ Agregar',
  emptyHint,
  onRemove,
}: ArrayEditorProps<T>) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function toggle(i: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function addItem() {
    onChange([newItem(), ...items]);
    setExpanded(prev => new Set(Array.from(prev, i => i + 1)).add(0));
  }

  function removeItem(i: number) {
    if (onRemove) {
      onRemove(items[i], i);
      return;
    }
    onChange(items.filter((_, idx) => idx !== i));
    setExpanded(prev => {
      const next = new Set<number>();
      prev.forEach(idx => {
        if (idx < i) next.add(idx);
        else if (idx > i) next.add(idx - 1);
      });
      return next;
    });
  }

  function drop(i: number) {
    if (dragIndex !== null && dragIndex !== i) {
      const next = items.slice();
      const [moved] = next.splice(dragIndex, 1);
      next.splice(i, 0, moved);
      onChange(next);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }

  return (
    <div className="array-editor">
      <div className="array-add-bar">
        <button type="button" className="btn-add" onClick={addItem}>{addLabel}</button>
      </div>
      <div className="array-list">
        {items.length === 0 && (
          <p className="array-empty">
            {emptyHint || 'Todavía no hay elementos. Usa el botón de arriba para agregar uno.'}
          </p>
        )}
        {items.map((item, i) => {
          const isOpen = expanded.has(i);
          const badge = itemBadge ? itemBadge(item, i) : null;
          return (
            <div
              key={i}
              className={[
                'array-item',
                isOpen && 'is-open',
                dragIndex === i && 'is-dragging',
                dragOverIndex === i && dragIndex !== i && 'is-drag-over',
              ].filter(Boolean).join(' ')}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={e => { e.preventDefault(); setDragOverIndex(i); }}
              onDragLeave={() => setDragOverIndex(prev => (prev === i ? null : prev))}
              onDrop={e => { e.preventDefault(); drop(i); }}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
            >
              <div className="array-item-header">
                <span className="drag-handle" aria-hidden="true" title="Arrastra para reordenar">⠿</span>
                <div className="array-item-title-wrap" onClick={() => toggle(i)}>
                  <span className="array-item-chevron" aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
                  <span className="array-item-title">{itemTitle(item, i)}</span>
                  {badge && (
                    <span className={`badge-pill${badge.kind ? ` is-${badge.kind}` : ''}`}>{badge.text}</span>
                  )}
                </div>
                <div className="array-item-actions">
                  <button
                    type="button"
                    className="btn-mini btn-danger"
                    onClick={e => { e.stopPropagation(); removeItem(i); }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              {isOpen && <div className="array-item-body">{renderItem(item, i)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
