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
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set([STUDIO_SECTIONS[0].key]));

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
      <h2 className="admin-section-title">Studio</h2>
      <p className="admin-section-desc">
        La biblioteca de prompts del equipo. Copia el que necesites y pégalo en tu propia sesión de
        Claude; aquí no se llama a ninguna API. Los prompts ya traen la voz editorial, la taxonomía
        exacta del panel y la escala de importancia.
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
