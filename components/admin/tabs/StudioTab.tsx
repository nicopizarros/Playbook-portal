'use client';

import { useState } from 'react';
import { STUDIO_SECTIONS, type StudioPrompt } from '../studio-prompts';

// Fase 8B: biblioteca de prompts. Página estática de referencia: el equipo
// copia el prompt y lo pega en su propia sesión de Claude (cada quien con
// su suscripción). No llama a ninguna API desde aquí, a propósito.
function PromptCard({ prompt, promptKey }: { prompt: StudioPrompt; promptKey: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt.prompt);
    } catch {
      // Clipboard API puede fallar (permisos/HTTP): selecciona el texto para
      // que el copiado manual sea un solo Ctrl+C.
      const el = document.getElementById(promptKey) as HTMLTextAreaElement | null;
      el?.focus();
      el?.select();
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div className="studio-card">
      <div className="studio-card-head">
        <div>
          <h4 className="studio-card-title">{prompt.title}</h4>
          <p className="studio-card-desc">{prompt.description}</p>
        </div>
        <button type="button" className={`btn-mini${copied ? ' is-active' : ''}`} onClick={copy}>
          {copied ? 'Copiado ✓' : 'Copiar'}
        </button>
      </div>
      <textarea
        id={promptKey}
        className="studio-prompt-text"
        readOnly
        value={prompt.prompt}
        rows={Math.min(14, Math.max(6, prompt.prompt.split('\n').length))}
        onFocus={e => e.currentTarget.select()}
        aria-label={`Prompt: ${prompt.title}`}
      />
    </div>
  );
}

export function StudioTab() {
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set());

  function toggle(key: string) {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div>
      <h2 className="admin-section-title">Guía</h2>
      <p className="admin-section-desc">
        Cómo hacer las tareas del día a día — a mano en este panel o con Claude Code — y, más abajo,
        una biblioteca de prompts para lo que todavía no tiene un flujo dedicado.
      </p>

      <section className="studio-howto">
        <h3 className="studio-howto-title">A mano en el CMS</h3>
        <dl className="studio-howto-list">
          <div className="studio-howto-item">
            <dt>Publicar un artículo nuevo</dt>
            <dd>
              Pestaña <b>Artículos</b> → “+ Agregar artículo manualmente” → llena los campos (el ID se
              genera solo a partir del título) → <b>Guardar artículos</b>.
            </dd>
          </div>
          <div className="studio-howto-item">
            <dt>Marcar el destacado (hero) de portada</dt>
            <dd>
              Abre el artículo en <b>Artículos</b> y activa “Destacado”. Si ya hay otro marcado, el sitio
              solo muestra el más reciente de los dos como principal — desmarca el viejo si quieres forzar
              el nuevo.
            </dd>
          </div>
          <div className="studio-howto-item">
            <dt>Subir la prioridad de un artículo</dt>
            <dd>
              Campo “Importancia” (1 a 5 estrellas) en el mismo formulario. Junto con la fecha, decide el
              orden real del sitio: más estrellas y más reciente pesa más.
            </dd>
          </div>
          <div className="studio-howto-item">
            <dt>Corregir o archivar un artículo</dt>
            <dd>
              Edita cualquier campo y <b>Guardar artículos</b>. Para quitarlo de la portada usa “Eliminar”
              en la tarjeta — archiva el artículo, no lo borra; sigue viviendo en /archivo.
            </dd>
          </div>
          <div className="studio-howto-item">
            <dt>Reordenar las pestañas de este panel</dt>
            <dd>Arrastra cualquier pestaña de la barra izquierda. El orden se guarda por editor.</dd>
          </div>
        </dl>
      </section>

      <section className="studio-howto">
        <h3 className="studio-howto-title">Con Claude Code</h3>
        <p className="studio-section-desc">
          Si tienes una sesión de Claude Code abierta en el repo Playbook-portal, usa los skills reales
          del proyecto en vez de copiar un prompt suelto — ya conocen la base de datos de producción, la
          taxonomía exacta y, según el caso, piden tu aprobación antes de publicar.
        </p>
        <dl className="studio-howto-list">
          <div className="studio-howto-item">
            <dt>Una edición de newsletter (Industry Shots, La Lana del Deporte, Infinitas)</dt>
            <dd>
              “Usa el skill <code>publish-newsletter</code> con este enlace: [URL]”. Publica directo, sin
              paso de revisión — es contenido propio de Playbook.
            </dd>
          </div>
          <div className="studio-howto-item">
            <dt>Una nota de otro medio (ESPN, Reuters, un comunicado, cualquier link que no sea de Playbook)</dt>
            <dd>
              “Usa el skill <code>publish-sourced-article</code> con este enlace: [URL]”. <b>Primero
              clasifica el formato (A/B/C)</b> y después redacta con el núcleo de voz Playbook. Cruza
              otras coberturas, cita todas las fuentes al final y siempre se detiene a pedir tu
              aprobación antes de publicar.
            </dd>
          </div>
          <div className="studio-howto-item">
            <dt>La Lana del Deporte</dt>
            <dd>
              El artículo se desarrolla en su flujo propio. Al llevarlo al website, <b>no volver a
              generarlo desde cero</b>: conservar su tesis, estructura y voz; adaptar únicamente
              presentación, anexos, metadata y módulos del portal.
            </dd>
          </div>
          <div className="studio-howto-item">
            <dt>Cualquier otra cosa (redes sociales, un brief, el digest semanal, Playbook Base…)</dt>
            <dd>Todavía no tiene un skill dedicado — usa la biblioteca de prompts de abajo.</dd>
          </div>
        </dl>
      </section>

      <section className="studio-howto">
        <h3 className="studio-howto-title">Sistema editorial de artículos</h3>
        <p className="studio-section-desc">
          Antes de escribir, Playbook decide qué clase de pieza tiene enfrente. <b>La profundidad
          editorial define el formato; los gráficos son una consecuencia, no el criterio.</b> El flujo:
          fuentes → brief → router A/B/C/D → núcleo Playbook → prompt del formato → editor final →
          publicación.
        </p>
        <div className="studio-formats">
          <div className="studio-format-card">
            <span className="studio-format-letter">A</span>
            <h4>Noticia breve</h4>
            <p className="studio-format-q">¿Qué pasó?</p>
            <p>Movimiento + dato principal + contexto mínimo. Sin tesis y sin Opinión de Playbook.</p>
            <p className="studio-format-meta">100–180 palabras · Opinión: no · Gráficos: no</p>
          </div>
          <div className="studio-format-card">
            <span className="studio-format-letter">B</span>
            <h4>Noticia Playbook</h4>
            <p className="studio-format-q">¿Qué pasó y qué significa?</p>
            <p>
              La noticia más una segunda capa concreta de negocio: control, dinero, propiedad,
              distribución, riesgo, negociación o poder.
            </p>
            <p className="studio-format-meta">250–500 palabras · Opinión: sí · Gráficos: opcionales</p>
          </div>
          <div className="studio-format-card">
            <span className="studio-format-letter">C</span>
            <h4>Deep Dive</h4>
            <p className="studio-format-q">¿Cómo funciona realmente este negocio?</p>
            <p>
              Parte de una noticia, pero necesita abrir números, actores, estructura, comparaciones o
              mecanismos para entenderla.
            </p>
            <p className="studio-format-meta">700–1,200 palabras · Opinión: sí · Gráficos: 2–4</p>
          </div>
          <div className="studio-format-card">
            <span className="studio-format-letter">D</span>
            <h4>La Lana del Deporte</h4>
            <p className="studio-format-q">¿Qué pregunta de industria queremos resolver?</p>
            <p>
              Thesis-driven. La noticia puede ser el punto de partida, pero no necesariamente es la
              historia.
            </p>
            <p className="studio-format-meta">Flujo propio · Opinión: sí · Al website: adaptar, no regenerar</p>
          </div>
        </div>
        <p className="studio-format-rule">
          <b>La diferencia que no se debe perder:</b> Deep Dive explica a fondo una noticia. La Lana
          investiga una pregunta.
        </p>
      </section>

      <h3 className="admin-section-title studio-library-title">Biblioteca de prompts</h3>
      <p className="admin-section-desc">
        Para lo de arriba sin skill dedicado, o para cuando no tienes una sesión de Claude Code a la
        mano. Copia el prompt y pégalo en tu propia sesión de Claude; nada de esto llama a ninguna API.
      </p>

      {STUDIO_SECTIONS.map(section => {
        const open = openSections.has(section.key);
        return (
          <section key={section.key} className="studio-section">
            <button
              type="button"
              className="studio-section-toggle"
              aria-expanded={open}
              onClick={() => toggle(section.key)}
            >
              <span className="array-item-chevron" aria-hidden="true">{open ? '▾' : '▸'}</span>
              <span className="studio-section-title">{section.title}</span>
              <span className="badge-pill">{section.prompts.length} prompt{section.prompts.length > 1 ? 's' : ''}</span>
            </button>
            {open && (
              <div className="studio-section-body">
                <p className="studio-section-desc">{section.description}</p>
                {section.prompts.map((p, i) => (
                  <PromptCard key={`${section.key}-${i}`} promptKey={`studio-${section.key}-${i}`} prompt={p} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
