'use client';

import { rankArticles, selectHero, baseScore, HERO_BAND_MIN_SCORE } from '@/lib/rank';
import { LEAD_COUNT, LIST_COUNT, KNOWN_SOURCES, SOURCE_LABELS } from '@/lib/constants';
import { SCOPE_OPTIONS, SPORT_OPTIONS, VERTICAL_OPTIONS, PROPERTY_OPTIONS } from '@/lib/taxonomy';
import { slugify } from '@/lib/slugify';
import { type ArticleEntry, newArticleEntry } from '../article-entry';
import { TextField, NumberField } from '../fields/TextField';
import { SelectField } from '../fields/SelectField';
import { CheckboxGroupField } from '../fields/CheckboxGroupField';
import { StarPickerField } from '../fields/StarPickerField';
import { ArrayEditor } from '../fields/ArrayEditor';
import { TipTapEditor } from '../TipTapEditor';

const MAIN_PAGE_COUNT = LEAD_COUNT + LIST_COUNT;

const COVERAGE_TIERS = [
  { key: 'tagsScope' as const, label: 'Alcance', options: SCOPE_OPTIONS as readonly string[] },
  { key: 'tagsSport' as const, label: 'Deporte', options: SPORT_OPTIONS as readonly string[] },
  { key: 'tagsVertical' as const, label: 'Vertical de negocio', options: VERTICAL_OPTIONS as readonly string[] },
  { key: 'tagsProperty' as const, label: 'Cobertura', options: PROPERTY_OPTIONS as readonly string[] },
];

type Props = {
  entries: ArticleEntry[];
  onChange: (entries: ArticleEntry[]) => void;
  onRemove: (entry: ArticleEntry) => void;
};

export function ArticlesTab({ entries, onChange, onRemove }: Props) {
  const list = entries.map(e => e.data);
  const ranked = rankArticles(list);
  const mainPageIds = new Set(ranked.slice(0, MAIN_PAGE_COUNT).map(a => a.id));
  const heroId = selectHero(list)?.id ?? null;

  // Display order matches the real site (rankArticles), but keyed off each
  // entry's *baseline* data rather than the live-edited `data` — sorting by
  // live values would reshuffle the list on every keystroke that touches
  // score/date/featured, collapsing whatever card is open mid-edit
  // (ArrayEditor tracks expanded state by index, see its own comment on
  // that trade-off). Baseline only changes on save, so the list stays put
  // while you type. Unsaved new articles (no baseline yet) have no rank to
  // sort by, so they stay in their existing (just-added-to-the-front) order
  // ahead of the ranked ones — same place ArrayEditor's own addItem puts
  // them.
  //
  // Sorted via rankArticles() itself (not a hand-rolled comparator) so this
  // can never drift from the real site's order again the way it did until
  // 2026-08-20's boleta rewrite: this used to call the legacy `rankScore`
  // directly, which kept ordering admin entries by star + recency even
  // after the homepage moved to the 0-99 score.
  const newOnes = entries.filter(e => !e.inBaseline);
  const baselineOrder = rankArticles(entries.filter(e => e.inBaseline).map(e => e.baselineData!));
  const orderIndex = new Map(baselineOrder.map((a, i) => [a.id, i]));
  const existingOnes = entries
    .filter(e => e.inBaseline)
    .slice()
    .sort((a, b) => (orderIndex.get(a.baselineData!.id) ?? 0) - (orderIndex.get(b.baselineData!.id) ?? 0));
  const sortedEntries = [...newOnes, ...existingOnes];

  // Keyed by clientKey, not array index — the list rendered below
  // (sortedEntries) is a display-order copy, not `entries` itself, so an
  // index into one doesn't line up with the other.
  function updateEntry(clientKey: string, patch: Partial<ArticleEntry['data']>) {
    const idx = entries.findIndex(e => e.clientKey === clientKey);
    if (idx === -1) return;
    const next = entries.slice();
    next[idx] = { ...next[idx], data: { ...next[idx].data, ...patch } };
    onChange(next);
  }

  return (
    <div>
      <h2 className="admin-section-title">Artículos (Noticias)</h2>

      <div className="admin-tag-coverage">
        <h3 className="admin-section-title">Cobertura de etiquetas</h3>
        <p className="admin-section-desc">
          Cuántos artículos actuales llevan cada etiqueta — para ver qué temas quedarían vacíos en una
          página de tema.
        </p>
        {COVERAGE_TIERS.map(tier => (
          <div className="tag-coverage-group" key={tier.key}>
            <span className="tag-coverage-group-label">{tier.label}</span>
            {tier.options.map(option => {
              const count = list.filter(a => (a[tier.key] || []).includes(option)).length;
              return (
                <div className={`tag-coverage-row${count === 0 ? ' is-zero' : ''}`} key={option}>
                  <span>{option}</span>
                  <b>{count}</b>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <ArrayEditor<ArticleEntry>
        items={sortedEntries}
        onChange={onChange}
        onRemove={onRemove}
        addLabel="+ Agregar artículo manualmente"
        emptyHint="No hay artículos cargados todavía."
        itemTitle={entry => entry.data.title || 'Artículo sin título'}
        itemBadge={entry =>
          entry.data.id === heroId
            ? { text: '👑 Hero de portada', kind: 'hero-main' }
            : mainPageIds.has(entry.data.id)
              ? { text: '★ En portada', kind: 'hero' }
              : { text: 'Archivo', kind: 'archive' }
        }
        newItem={newArticleEntry}
        renderItem={entry => {
          const a = entry.data;
          const otherFeatured = list.find(other => other.id !== a.id && other.featured === true);
          // 2026-08-20: was `Number(a.priority) === 5`, from before the
          // 0-99 boleta rewrite. baseScore() is the real hero-eligibility
          // signal now — HERO_BAND_MIN_SCORE (70) is the same "clears 70"
          // bar rule 02 of the spec uses for the weekly hero band.
          const showHeroNote = baseScore(a) >= HERO_BAND_MIN_SCORE || a.featured === true;

          return (
            <>
              <TextField
                label="Título"
                help="El titular del artículo tal como se muestra en Noticias."
                value={a.title}
                onChange={v => {
                  const patch: Partial<ArticleEntry['data']> = { title: v };
                  if (!a.id) patch.id = slugify(v);
                  updateEntry(entry.clientKey, patch);
                }}
              />
              <TextField
                label="ID (para el enlace del artículo)"
                help="Se genera solo a partir del título si lo dejas vacío. Debe ser único — se usa en la URL del artículo (/articulo/...)."
                value={a.id}
                onChange={v => updateEntry(entry.clientKey, { id: v })}
              />
              <TextField
                label="Extracto"
                multiline
                help="Uno o dos renglones que resumen el artículo — se usa en las tarjetas de Noticias."
                value={a.excerpt}
                onChange={v => updateEntry(entry.clientKey, { excerpt: v })}
              />
              <TextField
                label="Resumen en texto plano (respaldo)"
                multiline
                help="Se usa como resumen del feed RSS y como cuerpo del artículo cuando no tiene editor TipTap todavía."
                value={a.teaser}
                onChange={v => updateEntry(entry.clientKey, { teaser: v })}
              />
              <TextField
                label="Teaser del muro de registro"
                multiline
                help='Lo que ve un lector no registrado que ya agotó sus 3 artículos gratis del mes, en vez del cuerpo del artículo. Si lo dejas vacío, el muro no muestra ningún adelanto — no usa el extracto ni el resumen de arriba.'
                value={a.wallTeaser}
                onChange={v => updateEntry(entry.clientKey, { wallTeaser: v })}
              />
              <div className="field">
                <span className="field-label">Cuerpo del artículo (editor)</span>
                <span className="field-help">
                  El texto completo que ve el lector en la página del artículo. Si lo dejas vacío, el sitio
                  muestra el resumen en texto plano de arriba en su lugar.
                </span>
                <TipTapEditor content={a.bodyJson} onChange={json => updateEntry(entry.clientKey, { bodyJson: json })} />
              </div>
              <TextField
                label="Autor"
                help='El nombre de quien escribió el artículo. Se muestra públicamente solo si activas "Mostrar autor" abajo, o si está prendido globalmente desde Ajustes.'
                value={a.author}
                onChange={v => updateEntry(entry.clientKey, { author: v })}
              />
              <div className="field">
                <span className="field-label">Mostrar autor</span>
                <span className="field-help">
                  Muestra el nombre de arriba en la página de este artículo. Apagado por defecto. También se
                  puede prender para todos los artículos a la vez desde la pestaña Ajustes.
                </span>
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={a.mostrarAutor === true}
                    onChange={e => updateEntry(entry.clientKey, { mostrarAutor: e.target.checked })}
                  />
                  <span>Mostrar autor de este artículo</span>
                </label>
              </div>
              <TextField
                label="Publicación"
                help="El nombre de la publicación de origen."
                value={a.publication}
                onChange={v => updateEntry(entry.clientKey, { publication: v })}
              />
              <SelectField
                label="Fuente"
                help="A qué categoría pertenece — define el color de su etiqueta."
                value={a.source}
                options={KNOWN_SOURCES.map(v => ({ value: v, label: SOURCE_LABELS[v] || v }))}
                onChange={v => updateEntry(entry.clientKey, { source: v })}
              />
              <CheckboxGroupField label="Alcance" help="Nacional y/o internacional." options={SCOPE_OPTIONS} value={a.tagsScope} onChange={v => updateEntry(entry.clientKey, { tagsScope: v })} />
              <CheckboxGroupField label="Deporte" help="Puede tener más de uno." options={SPORT_OPTIONS} value={a.tagsSport} onChange={v => updateEntry(entry.clientKey, { tagsSport: v })} />
              <CheckboxGroupField label="Vertical de negocio" help="Puede tener más de uno." options={VERTICAL_OPTIONS} value={a.tagsVertical} onChange={v => updateEntry(entry.clientKey, { tagsVertical: v })} />
              {/* Cobertura (hub tier). Deliberately last and normally
                  empty: this is not a topic, it's the destination the
                  piece belongs to (/coberturas/lfa). Marca solo si la
                  pieza ES cobertura de la propiedad, no si la menciona —
                  la regla de frontera vive en
                  .claude/playbook-editorial/fields-and-taxonomy.md. */}
              <CheckboxGroupField label="Cobertura" help="Solo si la pieza ES cobertura de esa propiedad, no si la menciona." options={PROPERTY_OPTIONS} value={a.tagsProperty} onChange={v => updateEntry(entry.clientKey, { tagsProperty: v })} />
              <div className="field">
                <span className="field-label">Visibilidad</span>
                <span className="field-help">
                  Desmarcado, el artículo sigue publicado y resuelve en su URL real
                  (/articulo/…) para verlo y revisarlo, pero desaparece de Noticias, del
                  archivo, del buscador, de cualquier cobertura que lo reúna por etiqueta,
                  del sitemap.xml y lleva noindex. Vuelve a marcarlo cuando quieras hacerlo
                  público — es el mismo mecanismo que usan las coberturas no listadas.
                </span>
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={a.listed === true}
                    onChange={e => updateEntry(entry.clientKey, { listed: e.target.checked })}
                  />
                  <span>Listado (visible y descubrible en el sitio)</span>
                </label>
              </div>
              <TextField label="Fecha (AAAA-MM-DD)" help="Se usa para ordenar los artículos por fecha — lo más reciente siempre pesa." value={a.date} onChange={v => updateEntry(entry.clientKey, { date: v })} />
              <TextField label="Fecha en texto" help="Cómo se muestra la fecha en el sitio (ej. 9 jul 2026)." value={a.dateFormatted} onChange={v => updateEntry(entry.clientKey, { dateFormatted: v })} />
              <NumberField label="Tiempo de lectura (minutos)" help="Minutos de lectura, se escribe a mano — ya no se calcula solo." min={1} step={1} value={a.readingTime} onChange={v => updateEntry(entry.clientKey, { readingTime: v })} />
              <StarPickerField
                label="Importancia (heredado)"
                help="Campo del sistema de estrellas anterior. Ya no decide el orden de portada por sí solo — eso lo hace la calificación 0-99 (boleta editorial). Solo sigue pesando en artículos que todavía no tienen esa calificación asignada."
                value={a.priority}
                onChange={v => updateEntry(entry.clientKey, { priority: v })}
              />
              <div className="field">
                <span className="field-label">Destacado (hero)</span>
                <span className="field-help">
                  Marca este artículo para que ocupe el puesto principal de portada durante
                  aproximadamente un día, sin importar su calificación.
                </span>
                <label className="checkbox-option">
                  <input type="checkbox" checked={a.featured === true} onChange={e => updateEntry(entry.clientKey, { featured: e.target.checked })} />
                  <span>Mostrar como destacado</span>
                </label>
              </div>
              {showHeroNote && (
                <div className="admin-hero-note">
                  <strong>
                    La portada la decide la combinación de calificación (0-99) + fecha: una calificación alta
                    no garantiza el puesto si algo más reciente pesa más.{' '}
                  </strong>
                  <span>
                    &quot;Destacado&quot; fuerza el puesto principal durante aproximadamente un día;
                    después se apaga solo y el puesto vuelve a decidirse por calificación + fecha, así
                    que no hace falta desmarcarlo a mano.
                  </span>
                  {a.featured === true && otherFeatured && (
                    <div className="admin-hero-warning">
                      Ya hay otro artículo marcado como &quot;Destacado&quot;: &quot;{otherFeatured.title || 'sin título'}&quot;.
                      Solo uno de los dos se muestra como principal (el que aún conserve el impulso de
                      &quot;Destacado&quot; o, si ya se apagó en ambos, el de mejor combinación de calificación y fecha).
                    </div>
                  )}
                </div>
              )}
              <TextField
                label="Enlace en Substack"
                type="url"
                required
                help='A dónde lleva el botón secundario "Ver en Substack" en la página del artículo.'
                value={a.substackUrl}
                onChange={v => updateEntry(entry.clientKey, { substackUrl: v })}
              />
              <TextField
                label="Imagen"
                type="url"
                required
                help="El link a una imagen para el artículo, relacionada directamente con el tema. Obligatoria para todo artículo, sin importar la prioridad."
                value={a.imageUrl}
                onChange={v => updateEntry(entry.clientKey, { imageUrl: v })}
              />
              <TextField
                label="Crédito de la imagen"
                help='Ej. "Foto: Jane Doe / Unsplash". Se muestra debajo de la foto en la página del artículo.'
                value={a.imageCredit}
                onChange={v => updateEntry(entry.clientKey, { imageCredit: v })}
              />
            </>
          );
        }}
      />
    </div>
  );
}
