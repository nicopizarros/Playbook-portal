'use client';

import { rankArticles } from '@/lib/rank';
import { LEAD_COUNT, LIST_COUNT, KNOWN_SOURCES, SOURCE_LABELS } from '@/lib/constants';
import { SCOPE_OPTIONS, SPORT_OPTIONS, VERTICAL_OPTIONS } from '@/lib/taxonomy';
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
  const heroCount = list.filter(a => Number(a.priority) === 5).length;
  const featuredCount = list.filter(a => a.featured === true).length;

  function updateEntry(i: number, patch: Partial<ArticleEntry['data']>) {
    const next = entries.slice();
    next[i] = { ...next[i], data: { ...next[i].data, ...patch } };
    onChange(next);
  }

  return (
    <div>
      <h2 className="admin-section-title">Artículos (Noticias)</h2>
      <div className="admin-callout">
        <strong>La automatización de Make.com sigue activa. </strong>
        <span>
          Los artículos nuevos siguen llegando solos desde el RSS. Esta pestaña es una capa de corrección
          manual encima de eso: úsala para arreglar un error, archivar un artículo o subir la prioridad de
          uno a mano — no para reemplazar la automatización.
        </span>
      </div>

      <p className="admin-section-desc">
        {mainPageIds.size} de {list.length} artículos aparecen en la portada (el destacado + los {LIST_COUNT}{' '}
        siguientes por estrellas y fecha). El resto vive en /archivo automáticamente — no hace falta
        archivarlos a mano.
      </p>

      {(heroCount > 1 || featuredCount > 1) && (
        <div className="admin-hero-conflict-banner">
          {heroCount > 1 && (
            <p>
              Hay {heroCount} artículos con 5 estrellas al mismo tiempo. Solo el más reciente se muestra
              como principal en portada — el resto sigue apareciendo con prioridad alta en el resto del sitio.
            </p>
          )}
          {featuredCount > 1 && (
            <p>
              Hay {featuredCount} artículos marcados como &quot;Destacado&quot; al mismo tiempo. Solo el más
              reciente se muestra como principal en portada.
            </p>
          )}
        </div>
      )}

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
        items={entries}
        onChange={onChange}
        onRemove={onRemove}
        addLabel="+ Agregar artículo manualmente"
        emptyHint="No hay artículos cargados todavía."
        itemTitle={entry => entry.data.title || 'Artículo sin título'}
        itemBadge={entry =>
          mainPageIds.has(entry.data.id)
            ? { text: '★ En portada', kind: 'hero' }
            : { text: 'Archivo', kind: 'archive' }
        }
        newItem={newArticleEntry}
        renderItem={(entry, i) => {
          const a = entry.data;
          const otherHero = list.find((other, idx) => idx !== i && Number(other.priority) === 5);
          const otherFeatured = list.find((other, idx) => idx !== i && other.featured === true);
          const showHeroNote = Number(a.priority) === 5 || a.featured === true;

          return (
            <>
              <TextField
                label="Título"
                help="El titular del artículo tal como se muestra en Noticias."
                value={a.title}
                onChange={v => {
                  const patch: Partial<ArticleEntry['data']> = { title: v };
                  if (!a.id) patch.id = slugify(v);
                  updateEntry(i, patch);
                }}
              />
              <TextField
                label="ID (para el enlace del artículo)"
                help="Se genera solo a partir del título si lo dejas vacío. Debe ser único — se usa en la URL del artículo (/articulo?id=...)."
                value={a.id}
                onChange={v => updateEntry(i, { id: v })}
              />
              <TextField
                label="Extracto"
                multiline
                help="Uno o dos renglones que resumen el artículo — se usa en las tarjetas de Noticias."
                value={a.excerpt}
                onChange={v => updateEntry(i, { excerpt: v })}
              />
              <TextField
                label="Resumen en texto plano (respaldo)"
                multiline
                help="Se usa como resumen del feed RSS y como cuerpo del artículo cuando no tiene editor TipTap todavía."
                value={a.teaser}
                onChange={v => updateEntry(i, { teaser: v })}
              />
              <TextField
                label="Teaser del muro de registro"
                multiline
                help='Lo que ve un lector no registrado que ya agotó sus 3 artículos gratis del mes, en vez del cuerpo del artículo. Si lo dejas vacío, el muro no muestra ningún adelanto — no usa el extracto ni el resumen de arriba.'
                value={a.wallTeaser}
                onChange={v => updateEntry(i, { wallTeaser: v })}
              />
              <div className="field">
                <span className="field-label">Cuerpo del artículo (editor)</span>
                <span className="field-help">
                  El texto completo que ve el lector en la página del artículo. Si lo dejas vacío, el sitio
                  muestra el resumen en texto plano de arriba en su lugar.
                </span>
                <TipTapEditor content={a.bodyJson} onChange={json => updateEntry(i, { bodyJson: json })} />
              </div>
              <TextField
                label="Autor"
                help='El nombre de quien escribió el artículo. Se muestra públicamente solo si activas "Mostrar autor" abajo, o si está prendido globalmente desde Ajustes.'
                value={a.author}
                onChange={v => updateEntry(i, { author: v })}
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
                    onChange={e => updateEntry(i, { mostrarAutor: e.target.checked })}
                  />
                  <span>Mostrar autor de este artículo</span>
                </label>
              </div>
              <TextField
                label="Publicación"
                help="El nombre de la publicación de origen."
                value={a.publication}
                onChange={v => updateEntry(i, { publication: v })}
              />
              <SelectField
                label="Fuente"
                help="A qué categoría pertenece — define el color de su etiqueta."
                value={a.source}
                options={KNOWN_SOURCES.map(v => ({ value: v, label: SOURCE_LABELS[v] || v }))}
                onChange={v => updateEntry(i, { source: v })}
              />
              <CheckboxGroupField label="Alcance" help="Nacional y/o internacional." options={SCOPE_OPTIONS} value={a.tagsScope} onChange={v => updateEntry(i, { tagsScope: v })} />
              <CheckboxGroupField label="Deporte" help="Puede tener más de uno." options={SPORT_OPTIONS} value={a.tagsSport} onChange={v => updateEntry(i, { tagsSport: v })} />
              <CheckboxGroupField label="Vertical de negocio" help="Puede tener más de uno." options={VERTICAL_OPTIONS} value={a.tagsVertical} onChange={v => updateEntry(i, { tagsVertical: v })} />
              <TextField label="Fecha (AAAA-MM-DD)" help="Se usa para ordenar los artículos por fecha — lo más reciente siempre pesa." value={a.date} onChange={v => updateEntry(i, { date: v })} />
              <TextField label="Fecha en texto" help="Cómo se muestra la fecha en el sitio (ej. 9 jul 2026)." value={a.dateFormatted} onChange={v => updateEntry(i, { dateFormatted: v })} />
              <NumberField label="Tiempo de lectura (minutos)" help="Minutos de lectura, se escribe a mano — ya no se calcula solo." min={1} step={1} value={a.readingTime} onChange={v => updateEntry(i, { readingTime: v })} />
              <StarPickerField
                label="Importancia"
                help="De 1 a 5 estrellas. Junto con la fecha, decide el orden: más estrellas y más reciente aparece primero."
                value={a.priority}
                onChange={v => updateEntry(i, { priority: v })}
              />
              <div className="field">
                <span className="field-label">Destacado (hero)</span>
                <span className="field-help">
                  Marca este artículo para que ocupe el puesto principal de portada, sin importar sus
                  estrellas.
                </span>
                <label className="checkbox-option">
                  <input type="checkbox" checked={a.featured === true} onChange={e => updateEntry(i, { featured: e.target.checked })} />
                  <span>Mostrar como destacado</span>
                </label>
              </div>
              {showHeroNote && (
                <div className="admin-hero-note">
                  <strong>5 estrellas o &quot;Destacado&quot; = tratamiento de portada (hero). </strong>
                  <span>Normalmente debe haber solo un artículo destacado a la vez.</span>
                  {otherHero && (
                    <div className="admin-hero-warning">
                      Ya hay otro artículo con 5 estrellas: &quot;{otherHero.title || 'sin título'}&quot;. Solo
                      el más reciente de los dos se mostrará como principal.
                    </div>
                  )}
                  {otherFeatured && (
                    <div className="admin-hero-warning">
                      Ya hay otro artículo marcado como &quot;Destacado&quot;: &quot;{otherFeatured.title || 'sin título'}&quot;.
                      Solo el más reciente de los dos se mostrará como principal.
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
                onChange={v => updateEntry(i, { substackUrl: v })}
              />
              <TextField
                label="Imagen"
                type="url"
                required
                help="El link a una imagen para el artículo, relacionada directamente con el tema. Obligatoria para todo artículo, sin importar la prioridad."
                value={a.imageUrl}
                onChange={v => updateEntry(i, { imageUrl: v })}
              />
              <TextField
                label="Crédito de la imagen"
                help='Ej. "Foto: Jane Doe / Unsplash". Se muestra debajo de la foto en la página del artículo.'
                value={a.imageCredit}
                onChange={v => updateEntry(i, { imageCredit: v })}
              />
            </>
          );
        }}
      />
    </div>
  );
}
