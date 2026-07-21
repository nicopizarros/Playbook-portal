'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SiteContentData } from '@/lib/data/site-content';
import type { Article } from '@/lib/data/articles';
import {
  saveSiteContent,
  saveArticle,
  createArticle,
  archiveArticle,
  reloadSiteContent,
  reloadArticle,
} from '@/lib/actions/admin';
import { FormValidationProvider, type FormValidationHandle } from './fields/FormValidationContext';
import { TopbarSaveSlot } from './TopbarSaveSlot';
import { type ArticleEntry, articleToEntry, applyServerArticle, newArticleEntry, isEntryDirty } from './article-entry';
import { NavTab } from './tabs/NavTab';
import { ArticlesTab } from './tabs/ArticlesTab';
import { OpinionTab } from './tabs/OpinionTab';
import { VideoTab } from './tabs/VideoTab';
import { InfinitasTab } from './tabs/InfinitasTab';
import { ProductsTab } from './tabs/ProductsTab';
import { StatsTab } from './tabs/StatsTab';
import { TestimonialsTab } from './tabs/TestimonialsTab';
import { AboutTab } from './tabs/AboutTab';
import { MidCtaTab } from './tabs/MidCtaTab';
import { FooterTab } from './tabs/FooterTab';
import { SettingsTab } from './tabs/SettingsTab';
import { LivePreview } from './LivePreview';

const TAB_DEFS = [
  { key: 'articles', label: 'Artículos' },
  { key: 'opinion', label: 'Opinión' },
  { key: 'video', label: 'Video' },
  { key: 'infinitas', label: 'Infinitas' },
  { key: 'products', label: 'Productos' },
  { key: 'stats', label: 'Números' },
  { key: 'testimonials', label: 'Testimonios' },
  { key: 'about', label: 'Acerca' },
  { key: 'midCta', label: 'CTA' },
  { key: 'nav', label: 'Navegación' },
  { key: 'footer', label: 'Footer' },
  { key: 'settings', label: 'Ajustes' },
] as const;

type TabKey = (typeof TAB_DEFS)[number]['key'];
const DEFAULT_ORDER: TabKey[] = TAB_DEFS.map(t => t.key);
const LABELS: Record<TabKey, string> = Object.fromEntries(TAB_DEFS.map(t => [t.key, t.label])) as Record<TabKey, string>;

type Toast = { id: number; message: string; error?: boolean };
type Status = { text: string; kind?: 'ok' | 'error' };

type Props = {
  initialContent: SiteContentData;
  initialContentVersion: number;
  initialArticles: Article[];
  editorUsername: string;
};

export function AdminDashboard({ initialContent, initialContentVersion, initialArticles, editorUsername }: Props) {
  const [content, setContent] = useState(initialContent);
  const [contentBaseline, setContentBaseline] = useState(initialContent);
  const [contentVersion, setContentVersion] = useState(initialContentVersion);
  const [articleEntries, setArticleEntries] = useState<ArticleEntry[]>(() => initialArticles.map(articleToEntry));

  const [tabOrder, setTabOrder] = useState<TabKey[]>(DEFAULT_ORDER);
  const [activeTab, setActiveTab] = useState<TabKey>(DEFAULT_ORDER[0]);
  const [status, setStatus] = useState<Status>({ text: 'Listo', kind: 'ok' });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [contentConflictOpen, setContentConflictOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const validationRef = useRef<FormValidationHandle>(null);
  const toastCounter = useRef(0);

  const contentDirty = useMemo(
    () => JSON.stringify(content) !== JSON.stringify(contentBaseline),
    [content, contentBaseline],
  );
  const articlesDirty = useMemo(() => articleEntries.some(isEntryDirty), [articleEntries]);

  const tabOrderKey = `playbook_admin_tab_order_${editorUsername || 'anon'}`;
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(tabOrderKey) || '[]') as string[];
      const valid = saved.filter((k): k is TabKey => (DEFAULT_ORDER as string[]).includes(k));
      const missing = DEFAULT_ORDER.filter(k => !valid.includes(k));
      setTabOrder(valid.length ? [...valid, ...missing] : DEFAULT_ORDER);
    } catch {
      setTabOrder(DEFAULT_ORDER);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabOrderKey]);

  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (contentDirty || articlesDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [contentDirty, articlesDirty]);

  function pushToast(message: string, error?: boolean) {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, message, error }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4200);
  }

  function reorderTabs(from: TabKey, to: TabKey) {
    setTabOrder(prev => {
      const next = prev.slice();
      const fromIdx = next.indexOf(from);
      const toIdx = next.indexOf(to);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, from);
      localStorage.setItem(tabOrderKey, JSON.stringify(next));
      return next;
    });
  }

  function updateSection<K extends keyof SiteContentData>(key: K) {
    return (value: SiteContentData[K]) => setContent(c => ({ ...c, [key]: value }));
  }

  async function handleSaveContent() {
    if (validationRef.current && !validationRef.current.runValidation()) {
      setStatus({ text: 'Hay campos con errores', kind: 'error' });
      pushToast('Corrige los enlaces marcados en rojo antes de guardar.', true);
      return;
    }
    setSaving(true);
    setStatus({ text: 'Guardando…' });
    try {
      const result = await saveSiteContent(content, contentVersion);
      if (result.conflict) {
        setContentConflictOpen(true);
        setStatus({ text: 'Conflicto al guardar', kind: 'error' });
        return;
      }
      setContentVersion(result.version);
      setContentBaseline(content);
      setStatus({ text: 'Contenido guardado', kind: 'ok' });
      pushToast('Guardado. El sitio se actualiza en 1-2 min.');
    } catch (err) {
      setStatus({ text: 'Error al guardar', kind: 'error' });
      pushToast(`Error al guardar: ${(err as Error).message}`, true);
    } finally {
      setSaving(false);
    }
  }

  async function handleReloadContent() {
    try {
      const fresh = await reloadSiteContent();
      setContent(fresh.data);
      setContentBaseline(fresh.data);
      setContentVersion(fresh.version);
      setContentConflictOpen(false);
      setStatus({ text: 'Se recargó la última versión. Vuelve a hacer tus cambios.', kind: 'error' });
    } catch (err) {
      pushToast(`No se pudo recargar: ${(err as Error).message}`, true);
    }
  }

  async function handleSaveArticles() {
    if (validationRef.current && !validationRef.current.runValidation()) {
      setStatus({ text: 'Hay campos con errores', kind: 'error' });
      pushToast('Corrige los enlaces marcados en rojo antes de guardar.', true);
      return;
    }

    const seen = new Map<string, ArticleEntry>();
    for (const entry of articleEntries) {
      const id = entry.data.id.trim();
      if (!id) {
        pushToast('Todos los artículos necesitan un ID (se genera solo desde el título).', true);
        setStatus({ text: 'Hay campos con errores', kind: 'error' });
        return;
      }
      if (seen.has(id)) {
        pushToast(`ID duplicado: "${id}" — usado por más de un artículo.`, true);
        setStatus({ text: 'Hay campos con errores', kind: 'error' });
        return;
      }
      seen.set(id, entry);
    }

    const dirty = articleEntries.filter(isEntryDirty);
    if (!dirty.length) {
      setStatus({ text: 'Sin cambios en artículos', kind: 'ok' });
      return;
    }

    setSaving(true);
    setStatus({ text: 'Guardando artículos…' });

    type Outcome =
      | { clientKey: string; title: string; ok: true; article: Article }
      | { clientKey: string; title: string; ok: false; conflict: true; fresh: Article | null }
      | { clientKey: string; title: string; ok: false; conflict: false; error: string };

    const outcomes: Outcome[] = await Promise.all(
      dirty.map(async (entry): Promise<Outcome> => {
        try {
          if (!entry.inBaseline) {
            const { article } = await createArticle(entry.data);
            return { clientKey: entry.clientKey, title: entry.data.title, ok: true, article };
          }
          const result = await saveArticle(entry.data.id, entry.data, entry.baselineUpdatedAt!);
          if (result.conflict) {
            const fresh = await reloadArticle(entry.data.id);
            return { clientKey: entry.clientKey, title: entry.data.title, ok: false, conflict: true, fresh };
          }
          return { clientKey: entry.clientKey, title: entry.data.title, ok: true, article: result.article };
        } catch (err) {
          return {
            clientKey: entry.clientKey,
            title: entry.data.title,
            ok: false,
            conflict: false,
            error: (err as Error).message,
          };
        }
      }),
    );

    setArticleEntries(prev =>
      prev.map(e => {
        const outcome = outcomes.find(o => o.clientKey === e.clientKey);
        if (!outcome) return e;
        if (outcome.ok) return applyServerArticle(e.clientKey, outcome.article);
        if (outcome.conflict && outcome.fresh) return applyServerArticle(e.clientKey, outcome.fresh);
        return e;
      }),
    );

    outcomes.forEach(o => {
      if (o.ok) return;
      if (o.conflict) {
        pushToast(
          `Conflicto guardando "${o.title || 'Artículo'}" — alguien más lo guardó primero. Se recargó la versión más reciente (tus cambios de este artículo se perdieron).`,
          true,
        );
      } else {
        pushToast(`Error guardando "${o.title || 'Artículo'}": ${o.error}`, true);
      }
    });

    const failedOrConflicted = outcomes.filter(o => !o.ok).length;
    if (failedOrConflicted) {
      setStatus({ text: `${outcomes.length - failedOrConflicted} guardado(s), ${failedOrConflicted} con problemas`, kind: 'error' });
    } else {
      setStatus({ text: 'Artículos guardados', kind: 'ok' });
      pushToast('Guardado. El sitio se actualiza en 1-2 min.');
    }
    setSaving(false);
  }

  async function handleRemoveArticle(entry: ArticleEntry) {
    if (!entry.inBaseline) {
      setArticleEntries(prev => prev.filter(e => e.clientKey !== entry.clientKey));
      return;
    }
    try {
      await archiveArticle(entry.data.id);
      setArticleEntries(prev => prev.filter(e => e.clientKey !== entry.clientKey));
      pushToast(`"${entry.data.title || 'Artículo'}" archivado.`);
    } catch (err) {
      pushToast(`No se pudo archivar: ${(err as Error).message}`, true);
    }
  }

  function handleSave() {
    if (activeTab === 'articles') void handleSaveArticles();
    else void handleSaveContent();
  }

  return (
    <FormValidationProvider ref={validationRef}>
      <TopbarSaveSlot>
        <span className={`admin-status${status.kind === 'error' ? ' is-error' : status.kind === 'ok' ? ' is-ok' : ''}`} role="status">
          {status.text}
        </span>
        <button type="button" className="btn admin-save-btn" onClick={handleSave} disabled={saving}>
          <span>{activeTab === 'articles' ? 'Guardar artículos' : 'Guardar contenido'}</span>
          {(contentDirty || articlesDirty) && <span className="dirty-dot" title="Cambios sin guardar" />}
        </button>
      </TopbarSaveSlot>

      <div className="admin-body-grid">
        <nav className="admin-tabs" aria-label="Secciones del sitio">
          {tabOrder.map(key => (
            <button
              key={key}
              type="button"
              draggable
              className={`admin-tab${activeTab === key ? ' is-active' : ''}`}
              onClick={() => setActiveTab(key)}
              onDragStart={e => e.dataTransfer.setData('text/tab-key', key)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const from = e.dataTransfer.getData('text/tab-key') as TabKey;
                if (from) reorderTabs(from, key);
              }}
            >
              <span className="admin-tab-handle" aria-hidden="true">⠿</span>
              <span className="admin-tab-label">{LABELS[key]}</span>
            </button>
          ))}
        </nav>

        <main className="admin-main">
          <section className="admin-form-pane" aria-label="Edición de contenido">
            {activeTab === 'articles' && (
              <ArticlesTab entries={articleEntries} onChange={setArticleEntries} onRemove={handleRemoveArticle} />
            )}
            {activeTab === 'opinion' && <OpinionTab data={content.opinionSection} onChange={updateSection('opinionSection')} />}
            {activeTab === 'video' && <VideoTab data={content.videoSection} onChange={updateSection('videoSection')} />}
            {activeTab === 'infinitas' && <InfinitasTab data={content.infinitasSection} onChange={updateSection('infinitasSection')} />}
            {activeTab === 'products' && <ProductsTab data={content.productsSection} onChange={updateSection('productsSection')} />}
            {activeTab === 'stats' && <StatsTab data={content.statsSection} onChange={updateSection('statsSection')} />}
            {activeTab === 'testimonials' && (
              <TestimonialsTab data={content.testimonialsSection} onChange={updateSection('testimonialsSection')} />
            )}
            {activeTab === 'about' && <AboutTab data={content.aboutSection} onChange={updateSection('aboutSection')} />}
            {activeTab === 'midCta' && <MidCtaTab data={content.midCta} onChange={updateSection('midCta')} />}
            {activeTab === 'nav' && <NavTab data={content.nav} onChange={updateSection('nav')} />}
            {activeTab === 'footer' && <FooterTab data={content.footer} onChange={updateSection('footer')} />}
            {activeTab === 'settings' && <SettingsTab data={content.siteSettings} onChange={updateSection('siteSettings')} />}
          </section>

          <aside className="admin-preview-pane" aria-label="Vista previa en vivo">
            <div className="admin-preview-toolbar">
              <div className="admin-preview-label">Vista previa en vivo — página completa</div>
              <div className="admin-preview-hint">
                <span className="preview-hint-dot" aria-hidden="true" />
                Los bloques marcados tienen cambios sin guardar
              </div>
            </div>
            <div className="admin-preview-body">
              <LivePreview content={content} contentBaseline={contentBaseline} articleEntries={articleEntries} />
            </div>
          </aside>
        </main>
      </div>

      <div className="admin-toast-stack" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`admin-toast is-visible${t.error ? ' is-error' : ''}`}>{t.message}</div>
        ))}
      </div>

      <div className="admin-modal-overlay" hidden={!contentConflictOpen}>
        <div className="admin-modal" role="alertdialog" aria-labelledby="conflict-modal-title">
          <h2 id="conflict-modal-title">⚠️ Alguien más guardó primero</h2>
          <p>
            Otra sesión guardó cambios en este contenido antes que tú. Recarga la versión más reciente y
            vuelve a aplicar tus cambios para no sobrescribir lo que ya se guardó.
          </p>
          <button type="button" className="btn accent" onClick={handleReloadContent}>Entendido, recargar</button>
        </div>
      </div>
    </FormValidationProvider>
  );
}
