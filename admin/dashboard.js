'use strict';

import {
  opinionSectionHeadTemplate, opinionGridTemplate,
  productsSectionHeadTemplate, productsGridTemplate,
  midCtaTemplate,
  videoSectionHeadTemplate, videoFeatureTemplate, videoFeatureCopyTemplate, videoClipsTemplate,
  infinitasSectionHeadTemplate, infinitasWrapTemplate,
  statsHeadingTemplate, statsGridTemplate,
  testimonialsSectionHeadTemplate, testimonialsGridTemplate,
  aboutCardTemplate,
  footerContentTemplate, footerCopyrightTemplate,
  escapeHtml, safeUrl
} from '../js/templates.js';

const TOKEN_KEY = 'playbook_admin_token';
const USERNAME_KEY = 'playbook_admin_username';
const KNOWN_SOURCES = ['industry-shots', 'la-lana', 'infinitas', 'playbook'];
const DEFAULT_TAB_ORDER = [
  'articles', 'opinion', 'video', 'infinitas', 'products',
  'stats', 'testimonials', 'about', 'midCta', 'nav', 'footer'
];

const state = {
  token: sessionStorage.getItem(TOKEN_KEY) || null,
  username: sessionStorage.getItem(USERNAME_KEY) || '',
  content: null, contentSha: null, contentDirty: false, contentBaseline: null,
  articles: null, articlesSha: null, articlesDirty: false, articlesBaseline: null,
  tabOrder: [],
  activeTab: null
};

if (!state.token) {
  window.location.replace('/admin');
}

// ---------------------------------------------------------------- DOM helpers

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v == null || v === false) return;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c == null) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}

function isValidUrlValue(value) {
  const v = String(value == null ? '' : value).trim();
  if (v === '') return true;
  return /^(https?:|mailto:|tel:)/i.test(v) || v.startsWith('#') || v.startsWith('/');
}

function labeledField(labelText, helpText, inputEl, errorEl) {
  const children = [el('span', { class: 'field-label', text: labelText })];
  if (helpText) children.push(el('span', { class: 'field-help', text: helpText }));
  children.push(inputEl);
  if (errorEl) children.push(errorEl);
  return el('label', { class: 'field' }, children);
}

function textField(obj, key, labelText, opts = {}) {
  const isUrl = opts.type === 'url';
  const input = el(opts.multiline ? 'textarea' : 'input', {
    class: 'input',
    type: opts.multiline ? undefined : (opts.type || 'text')
  });
  input.value = obj[key] || '';

  let errorEl = null;
  let touched = false;
  if (isUrl) {
    errorEl = el('span', {
      class: 'field-error',
      text: opts.required
        ? 'Este enlace es obligatorio y debe empezar con https://'
        : 'El enlace debe empezar con https:// (o déjalo vacío)'
    });
    errorEl.hidden = true;
    const runValidation = () => {
      const value = input.value.trim();
      const empty = value === '';
      const ok = (opts.required ? !empty : true) && isValidUrlValue(value);
      input.classList.toggle('is-invalid', touched && !ok);
      errorEl.hidden = !(touched && !ok);
      return ok;
    };
    input._playbookValidate = () => { touched = true; return runValidation(); };
    input.addEventListener('blur', () => { touched = true; runValidation(); });
    input.addEventListener('input', () => { if (touched) runValidation(); });
  }

  input.addEventListener('input', () => {
    obj[key] = input.value;
    onDirty();
  });
  return labeledField(labelText, opts.help, input, errorEl);
}

function selectField(obj, key, labelText, options, help) {
  const select = el('select', { class: 'input input-select' });
  options.forEach(o => select.appendChild(el('option', { value: o.value, text: o.label })));
  select.value = obj[key] || options[0].value;
  select.addEventListener('change', () => {
    obj[key] = select.value;
    onDirty();
  });
  return labeledField(labelText, help, select);
}

// ---------------------------------------------------------------- Collapsible drag-reorder array editor

function arrayEditor(arr, opts) {
  const expanded = new WeakSet();
  const wrap = el('div', { class: 'array-editor' });
  const addBar = el('div', { class: 'array-add-bar' });
  const list = el('div', { class: 'array-list' });

  let dragIndex = null;

  function rerender() {
    list.innerHTML = '';
    if (!arr.length) {
      list.appendChild(el('p', { class: 'array-empty', text: opts.emptyHint || 'Todavía no hay elementos. Usa el botón de arriba para agregar uno.' }));
    }
    arr.forEach((item, i) => {
      const isOpen = expanded.has(item);
      const handle = el('span', {
        class: 'drag-handle', text: '⠿', title: 'Arrastra para reordenar',
        'aria-hidden': 'true'
      });
      const card = el('div', { class: 'array-item' + (isOpen ? ' is-open' : '') });

      handle.addEventListener('mousedown', () => { card.draggable = true; });
      handle.addEventListener('touchstart', () => { card.draggable = true; }, { passive: true });
      card.addEventListener('dragend', () => { card.draggable = false; card.classList.remove('is-dragging'); });

      card.addEventListener('dragstart', e => {
        dragIndex = i;
        card.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragover', e => {
        e.preventDefault();
        card.classList.add('is-drag-over');
      });
      card.addEventListener('dragleave', () => card.classList.remove('is-drag-over'));
      card.addEventListener('drop', e => {
        e.preventDefault();
        card.classList.remove('is-drag-over');
        if (dragIndex === null || dragIndex === i) return;
        const [moved] = arr.splice(dragIndex, 1);
        arr.splice(i, 0, moved);
        dragIndex = null;
        rerender();
        onDirty();
      });

      const removeBtn = opts.removable ? el('button', {
        type: 'button', class: 'btn-mini btn-danger', text: 'Eliminar',
        onclick: (e) => { e.stopPropagation(); arr.splice(i, 1); rerender(); onDirty(); }
      }) : null;

      const chevron = el('span', { class: 'array-item-chevron', 'aria-hidden': 'true', text: isOpen ? '▾' : '▸' });

      const header = el('div', { class: 'array-item-header' }, [
        handle,
        el('div', {
          class: 'array-item-title-wrap',
          onclick: () => { if (expanded.has(item)) expanded.delete(item); else expanded.add(item); rerender(); }
        }, [
          chevron,
          el('span', { class: 'array-item-title', text: opts.itemTitle ? opts.itemTitle(item, i) : `#${i + 1}` })
        ]),
        el('div', { class: 'array-item-actions' }, [removeBtn].filter(Boolean))
      ]);

      card.appendChild(header);

      if (isOpen) {
        const body = el('div', { class: 'array-item-body' });
        opts.renderItem(item, i).forEach(f => body.appendChild(f));
        card.appendChild(body);
      }

      list.appendChild(card);
    });
  }

  if (opts.addable) {
    addBar.appendChild(el('button', {
      type: 'button', class: 'btn-add', text: opts.addLabel || '+ Agregar',
      onclick: () => {
        const item = opts.newItem();
        arr.unshift(item);
        expanded.add(item);
        rerender();
        onDirty();
      }
    }));
  }

  wrap.appendChild(addBar);
  wrap.appendChild(list);
  rerender();
  return wrap;
}

// ---------------------------------------------------------------- Dirty / preview / status / toast

let previewTimer = null;
function onDirty() {
  if (state.activeTab === 'articles') {
    state.articlesDirty = true;
  } else {
    state.contentDirty = true;
  }
  updateDirtyIndicator();
  setStatus('Cambios sin guardar', 'warn');
  clearTimeout(previewTimer);
  previewTimer = setTimeout(renderPreview, 80);
}

function updateDirtyIndicator() {
  const dot = document.getElementById('dirty-dot');
  if (dot) dot.hidden = !(state.contentDirty || state.articlesDirty);
}

function setStatus(text, kind) {
  const elStatus = document.getElementById('admin-status');
  elStatus.textContent = text;
  elStatus.className = 'admin-status' + (kind === 'ok' ? ' is-ok' : kind === 'error' ? ' is-error' : '');
}

let toastTimer = null;
function showToast(message, kind) {
  const stack = document.getElementById('toast-stack');
  const toast = el('div', { class: 'admin-toast' + (kind === 'error' ? ' is-error' : '') }, message);
  stack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 250);
  }, 4200);
}

function mount(id, html) {
  const target = document.getElementById(id);
  if (target) target.innerHTML = html;
}

// Isolates each preview section so one bad in-progress edit (e.g. a field
// temporarily left in a shape a template doesn't expect) can't blank the
// rest of the live preview while the editor is still typing.
function safeMount(id, templateFn, arg) {
  try {
    mount(id, templateFn(arg));
  } catch (err) {
    console.error(`[Playbook admin] Error rendering preview #${id}:`, err);
  }
}

function articleRowTemplate(a) {
  const source = KNOWN_SOURCES.indexOf(a.source) !== -1 ? a.source : 'playbook';
  return `<a class="news-row reveal is-visible" data-source="${escapeHtml(source)}" href="${escapeHtml(safeUrl(a.url))}" target="_blank" rel="noopener noreferrer">
    <span class="tag-mini ${escapeHtml(source)}">${escapeHtml(a.publication || '')}</span>
    <h3>${escapeHtml(a.title || '')}</h3>
    <div class="byline">${escapeHtml(a.dateFormatted || '')}</div>
  </a>`;
}

function articlesPreviewList(articlesData) {
  const list = (articlesData && Array.isArray(articlesData.articles)) ? articlesData.articles.slice() : [];
  list.sort((a, b) => {
    const pa = typeof a.priority === 'number' ? a.priority : 0;
    const pb = typeof b.priority === 'number' ? b.priority : 0;
    if (pb !== pa) return pb - pa;
    return (b.date || '').localeCompare(a.date || '');
  });
  return list.slice(0, 8).map(articleRowTemplate).join('');
}

function renderContentInto(prefix, content, articlesData) {
  if (!content) return;
  safeMount(`${prefix}-articles-head`, () => '<div><h2>Noticias</h2></div>');
  safeMount(`${prefix}-articles-list`, articlesPreviewList, articlesData);
  safeMount(`${prefix}-opinion-head`, opinionSectionHeadTemplate, content.opinionSection);
  safeMount(`${prefix}-opinion-grid`, opinionGridTemplate, content.opinionSection);
  safeMount(`${prefix}-products-head`, productsSectionHeadTemplate, content.productsSection);
  safeMount(`${prefix}-products-grid`, productsGridTemplate, content.productsSection);
  safeMount(`${prefix}-mid-cta`, midCtaTemplate, content.midCta);
  safeMount(`${prefix}-video-head`, videoSectionHeadTemplate, content.videoSection);
  safeMount(`${prefix}-video-feature`, videoFeatureTemplate, content.videoSection.featured);
  safeMount(`${prefix}-video-feature-copy`, videoFeatureCopyTemplate, content.videoSection.featured);
  safeMount(`${prefix}-video-clips`, videoClipsTemplate, content.videoSection);
  safeMount(`${prefix}-infinitas-head`, infinitasSectionHeadTemplate, content.infinitasSection);
  safeMount(`${prefix}-infinitas-wrap`, infinitasWrapTemplate, content.infinitasSection);
  safeMount(`${prefix}-stats-heading`, statsHeadingTemplate, content.statsSection);
  safeMount(`${prefix}-stats-grid`, statsGridTemplate, content.statsSection);
  safeMount(`${prefix}-testimonials-head`, testimonialsSectionHeadTemplate, content.testimonialsSection);
  safeMount(`${prefix}-testimonials-grid`, testimonialsGridTemplate, content.testimonialsSection);
  safeMount(`${prefix}-about-card`, aboutCardTemplate, content.aboutSection);
  safeMount(`${prefix}-footer-content`, footerContentTemplate, content.footer);
  safeMount(`${prefix}-footer-copyright`, footerCopyrightTemplate, content.footer);
}

function renderPreview() {
  if (state.content) renderContentInto('preview', state.content, state.articles);
}

function renderBaselinePreview() {
  if (state.contentBaseline) renderContentInto('preview-base', state.contentBaseline, state.articlesBaseline);
}

// ---------------------------------------------------------------- API calls

async function apiLoad(fileKey) {
  const res = await fetch('/api/admin-content?file=' + fileKey, {
    headers: { Authorization: 'Bearer ' + state.token }
  });
  if (res.status === 401) { logout(); throw new Error('Sesión expirada, vuelve a entrar.'); }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'No se pudo cargar');
  return body;
}

async function apiSave(fileKey, data, sha) {
  const res = await fetch('/api/admin-save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + state.token },
    body: JSON.stringify({ file: fileKey, data, sha })
  });
  if (res.status === 401) { logout(); throw new Error('Sesión expirada, vuelve a entrar.'); }
  if (res.status === 409) { const err = new Error('conflict'); err.conflict = true; throw err; }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'No se pudo guardar');
  return body;
}

// ---------------------------------------------------------------- Section builders

function buildNavTab(container) {
  const nav = state.content.nav;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'Navegación' }));
  container.appendChild(el('p', { class: 'admin-section-desc', text: 'Textos y enlaces del menú superior, y el botón de suscripción.' }));
  container.appendChild(textField(nav, 'ctaLabel', 'Texto del botón de suscripción', { help: 'El texto que aparece en el botón verde de suscripción, en la esquina del menú.' }));
  container.appendChild(textField(nav, 'ctaUrl', 'Enlace del botón de suscripción', { type: 'url', required: true, help: 'A dónde lleva el botón al hacer clic (normalmente la página de Substack).' }));
  container.appendChild(el('h3', { class: 'admin-section-title', text: 'Enlaces del menú' }));
  container.appendChild(el('p', { class: 'admin-section-desc', text: 'Solo se puede editar el texto y el destino de cada botón — agregar o quitar botones aquí podría romper la página.' }));
  container.appendChild(el('div', { class: 'array-editor' }, nav.links.map(item => el('div', { class: 'array-item is-open is-static' }, [
    el('div', { class: 'array-item-body' }, [
      textField(item, 'label', 'Texto del enlace', { help: 'El texto que se muestra en el menú (ej. Noticias, Video).' }),
      textField(item, 'href', 'Destino del enlace', { help: 'A qué sección de la página lleva (ej. #noticias).' })
    ])
  ]))));
}

function buildArticlesTab(container) {
  if (!state.articles) {
    container.appendChild(el('p', { text: 'Cargando artículos…' }));
    return;
  }
  const list = state.articles.articles;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'Artículos (Noticias)' }));
  container.appendChild(el('div', { class: 'admin-callout' }, [
    el('strong', { text: 'La automatización de Make.com sigue activa. ' }),
    el('span', { text: 'Los artículos nuevos siguen llegando solos desde el RSS. Esta pestaña es una capa de corrección manual encima de eso: úsala para arreglar un error, borrar un artículo o subir la prioridad de uno a mano — no para reemplazar la automatización.' })
  ]));
  container.appendChild(arrayEditor(list, {
    removable: true, addable: true, addLabel: '+ Agregar artículo manualmente',
    itemTitle: (item) => item.title || 'Artículo sin título',
    emptyHint: 'No hay artículos cargados todavía.',
    newItem: () => ({
      id: '', title: '', excerpt: '', author: '', date: '', dateFormatted: '',
      publication: 'Playbook', source: 'playbook', tag: '', priority: 0, url: '', imageUrl: ''
    }),
    renderItem: (item) => [
      textField(item, 'title', 'Título', { help: 'El titular del artículo tal como se muestra en Noticias.' }),
      textField(item, 'excerpt', 'Extracto', { multiline: true, help: 'Uno o dos renglones que resumen el artículo.' }),
      textField(item, 'author', 'Autor', { help: 'El nombre de quien escribió el artículo.' }),
      textField(item, 'publication', 'Publicación', { help: 'El nombre de la publicación de origen.' }),
      selectField(item, 'source', 'Fuente', KNOWN_SOURCES.map(v => ({ value: v, label: v })), 'A qué categoría pertenece — define el color de su etiqueta.'),
      textField(item, 'tag', 'Etiqueta', { help: 'Una etiqueta corta de tema (ej. Audiencias).' }),
      textField(item, 'date', 'Fecha (AAAA-MM-DD)', { help: 'Se usa para ordenar los artículos por fecha.' }),
      textField(item, 'dateFormatted', 'Fecha en texto', { help: 'Cómo se muestra la fecha en el sitio (ej. 9 jul 2026).' }),
      textField(item, 'priority', 'Prioridad', { type: 'number', help: 'Un número: mientras más alto, más arriba aparece en la lista.' }),
      textField(item, 'url', 'Enlace del artículo', { type: 'url', required: true, help: 'A dónde lleva el artículo al hacer clic.' }),
      textField(item, 'imageUrl', 'Imagen (opcional)', { type: 'url', help: 'El link a una imagen para el artículo, si tiene.' })
    ]
  }));
}

function buildOpinionTab(container) {
  const s = state.content.opinionSection;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'Artículos de opinión' }));
  container.appendChild(el('p', { class: 'admin-section-desc', text: 'Las tarjetas de "Artículos de opinión".' }));
  container.appendChild(textField(s, 'heading', 'Título de la sección', { help: 'El encabezado grande arriba de las tarjetas de opinión.' }));
  container.appendChild(textField(s, 'archiveLinkLabel', 'Texto del enlace "Ver archivo"', { help: 'El texto del enlace que lleva al archivo completo de opinión.' }));
  container.appendChild(textField(s, 'archiveLinkUrl', 'Enlace del archivo', { type: 'url', required: true, help: 'A dónde lleva ese enlace (normalmente Substack).' }));
  container.appendChild(arrayEditor(s.cards, {
    removable: true, addable: true, addLabel: '+ Agregar artículo de opinión',
    itemTitle: (item) => item.title || 'Artículo sin título',
    newItem: () => ({ variant: 'standard', masthead: '', title: '', excerpt: '', url: '', image: '', imageAlt: '' }),
    renderItem: (item) => [
      selectField(item, 'variant', 'Formato', [{ value: 'standard', label: 'Estándar (texto)' }, { value: 'banner', label: 'Banner (con imagen)' }], 'Estándar es solo texto; Banner muestra una imagen arriba del texto.'),
      textField(item, 'masthead', 'Publicación', { help: 'El nombre que aparece arriba del título (ej. La Lana del Mundial).' }),
      textField(item, 'title', 'Título', { help: 'El titular que se muestra en la tarjeta.' }),
      textField(item, 'excerpt', 'Extracto', { multiline: true, help: 'Uno o dos renglones que resumen el artículo.' }),
      textField(item, 'url', 'Enlace del artículo', { type: 'url', required: true, help: 'La URL a la que lleva la tarjeta al hacer clic.' }),
      textField(item, 'image', 'Imagen (solo formato Banner)', { type: 'url', help: 'El link a una imagen ya subida. Déjalo vacío si el formato es Estándar.' })
    ]
  }));
}

function buildProductsTab(container) {
  const s = state.content.productsSection;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'Productos editoriales' }));
  container.appendChild(el('p', { class: 'admin-section-desc', text: 'Las tarjetas de "Productos editoriales".' }));
  container.appendChild(textField(s, 'heading', 'Título de la sección', { help: 'El encabezado grande de la sección de productos.' }));
  container.appendChild(arrayEditor(s.products, {
    removable: true, addable: true, addLabel: '+ Agregar producto',
    itemTitle: (item) => item.wordmark || item.description || 'Producto',
    newItem: () => ({ variant: 'banner', glyph: '', wordmark: '', description: '', meta: '', url: '', image: '', imageAlt: '' }),
    renderItem: (item) => [
      selectField(item, 'variant', 'Formato', [{ value: 'banner', label: 'Banner (con imagen)' }, { value: 'glyph', label: 'Ícono + texto' }], 'Banner muestra una imagen; Ícono + texto muestra un emoji y el nombre.'),
      textField(item, 'glyph', 'Ícono (emoji)', { help: 'Un emoji que representa el producto (solo formato Ícono + texto).' }),
      textField(item, 'wordmark', 'Nombre del producto', { help: 'El nombre junto al ícono (solo formato Ícono + texto).' }),
      textField(item, 'image', 'Imagen (solo formato Banner)', { type: 'url', help: 'El link a la imagen del producto.' }),
      textField(item, 'description', 'Descripción', { help: 'El texto que describe el producto.' }),
      textField(item, 'meta', 'Frecuencia', { help: 'Cuándo se publica (ej. Martes / Jueves).' }),
      textField(item, 'url', 'Enlace del producto', { type: 'url', required: true, help: 'A dónde lleva la tarjeta al hacer clic.' })
    ]
  }));
}

function buildMidCtaTab(container) {
  const s = state.content.midCta;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'CTA secundario' }));
  container.appendChild(el('p', { class: 'admin-section-desc', text: 'El bloque "Con Playbook estás un paso adelante".' }));
  container.appendChild(textField(s, 'headingMain', 'Título (parte normal)', { help: 'La primera parte del título, en texto normal.' }));
  container.appendChild(textField(s, 'headingEm', 'Título (parte destacada)', { help: 'La segunda parte del título, resaltada en verde.' }));
  container.appendChild(textField(s, 'body', 'Texto', { multiline: true, help: 'El texto debajo del título.' }));
  container.appendChild(textField(s, 'buttonLabel', 'Texto del botón', { help: 'El texto del botón de suscripción.' }));
  container.appendChild(textField(s, 'formUrl', 'Enlace del formulario', { type: 'url', required: true, help: 'A dónde se envía el formulario de suscripción.' }));
  container.appendChild(textField(s, 'successMessage', 'Mensaje de éxito', { help: 'El mensaje que ve la persona después de suscribirse.' }));
}

function buildVideoTab(container) {
  const s = state.content.videoSection;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'Video Playbook' }));
  container.appendChild(el('p', { class: 'admin-section-desc', text: 'El video destacado de Al Banquillo y los clips cortos.' }));
  container.appendChild(textField(s, 'heading', 'Título de la sección', { help: 'El encabezado grande de la sección Video.' }));
  container.appendChild(textField(s, 'sub', 'Subtítulo', { help: 'El texto pequeño debajo del título de la sección.' }));
  container.appendChild(textField(s, 'channelLinkLabel', 'Texto del enlace al canal', { help: 'El texto del enlace que lleva al canal de YouTube.' }));
  container.appendChild(textField(s, 'channelLinkUrl', 'Enlace del canal', { type: 'url', required: true, help: 'La URL del canal de YouTube.' }));

  container.appendChild(el('h3', { class: 'admin-section-title', text: 'Video destacado' }));
  const f = s.featured;
  container.appendChild(textField(f, 'embedId', 'ID de video de YouTube', { help: 'El código después de "v=" o "youtu.be/" (ej. ihHFQ30NE5c), no el link completo.' }));
  container.appendChild(textField(f, 'embedTitle', 'Título del video (accesibilidad)', { help: 'Un texto descriptivo para lectores de pantalla; no se muestra en pantalla.' }));
  container.appendChild(textField(f, 'eyebrow', 'Etiqueta', { help: 'El texto pequeño arriba del título (ej. Al Banquillo).' }));
  container.appendChild(textField(f, 'title', 'Título', { help: 'El título grande del video destacado.' }));
  container.appendChild(labeledField('Párrafos de descripción', 'Un párrafo por línea; se muestran debajo del título del video.', (() => {
    const ta = el('textarea', { class: 'input' });
    ta.value = (f.paragraphs || []).join('\n');
    ta.addEventListener('input', () => { f.paragraphs = ta.value.split('\n').filter(l => l.trim() !== ''); onDirty(); });
    return ta;
  })()));
  container.appendChild(arrayEditor(f.episodeLinks, {
    removable: true, addable: true, addLabel: '+ Agregar episodio',
    itemTitle: (item) => item.label || 'Episodio',
    newItem: () => ({ label: '', url: '' }),
    renderItem: (item) => [
      textField(item, 'label', 'Texto del episodio', { help: 'El nombre del episodio en la lista de "Más episodios".' }),
      textField(item, 'url', 'Enlace del episodio', { type: 'url', required: true, help: 'A dónde lleva ese episodio.' })
    ]
  }));

  container.appendChild(el('h3', { class: 'admin-section-title', text: 'Clips cortos' }));
  container.appendChild(arrayEditor(s.clips, {
    removable: true, addable: true, addLabel: '+ Agregar clip',
    itemTitle: (item) => item.title || 'Clip',
    newItem: () => ({ platform: 'youtube', url: '', thumbnail: '', title: '', handle: '', igText: '', variant: '' }),
    renderItem: (item) => [
      selectField(item, 'platform', 'Plataforma', [{ value: 'youtube', label: 'YouTube' }, { value: 'instagram', label: 'Instagram' }], 'YouTube muestra una miniatura; Instagram muestra una tarjeta de texto.'),
      textField(item, 'url', 'Enlace del clip', { type: 'url', required: true, help: 'A dónde lleva el clip al hacer clic.' }),
      textField(item, 'thumbnail', 'Miniatura (solo YouTube)', { type: 'url', help: 'El link a la imagen de miniatura del clip.' }),
      textField(item, 'igText', 'Texto de la tarjeta (solo Instagram)', { help: 'El texto que se muestra dentro de la tarjeta de Instagram.' }),
      textField(item, 'title', 'Título del clip', { help: 'El título que aparece debajo del clip.' }),
      textField(item, 'handle', 'Cuenta', { help: 'El usuario de la red social en la tarjeta (ej. @playbook.la).' })
    ]
  }));
}

function buildInfinitasTab(container) {
  const s = state.content.infinitasSection;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'Infinitas' }));
  container.appendChild(el('p', { class: 'admin-section-desc', text: 'El artículo destacado y los secundarios de Infinitas.' }));
  container.appendChild(textField(s, 'heading', 'Título de la sección', { help: 'El encabezado grande de la sección Infinitas.' }));
  container.appendChild(textField(s, 'sub', 'Subtítulo', { help: 'El texto pequeño debajo del título.' }));
  container.appendChild(textField(s, 'linkLabel', 'Texto del enlace', { help: 'El texto del enlace que lleva a Infinitas.' }));
  container.appendChild(textField(s, 'linkUrl', 'Enlace de Infinitas', { type: 'url', required: true, help: 'A dónde lleva ese enlace.' }));

  container.appendChild(el('h3', { class: 'admin-section-title', text: 'Artículo destacado' }));
  const feat = s.featured;
  container.appendChild(textField(feat, 'image', 'Imagen', { type: 'url', help: 'El link a la imagen de fondo del artículo destacado.' }));
  container.appendChild(textField(feat, 'eyebrow', 'Etiqueta', { help: 'El texto pequeño arriba del título.' }));
  container.appendChild(textField(feat, 'title', 'Título', { help: 'El título del artículo destacado.' }));
  container.appendChild(textField(feat, 'body', 'Texto', { multiline: true, help: 'El texto que acompaña al título.' }));
  container.appendChild(textField(feat, 'url', 'Enlace del artículo destacado', { type: 'url', required: true, help: 'A dónde lleva la tarjeta al hacer clic.' }));

  container.appendChild(el('h3', { class: 'admin-section-title', text: 'Artículos secundarios' }));
  container.appendChild(arrayEditor(s.sideCards, {
    removable: true, addable: true, addLabel: '+ Agregar artículo secundario',
    itemTitle: (item) => item.title || 'Artículo',
    newItem: () => ({ image: '', eyebrow: '', title: '', url: '' }),
    renderItem: (item) => [
      textField(item, 'image', 'Imagen', { type: 'url', help: 'El link a la imagen de fondo de la tarjeta.' }),
      textField(item, 'eyebrow', 'Etiqueta', { help: 'El texto pequeño arriba del título.' }),
      textField(item, 'title', 'Título', { help: 'El título de la tarjeta.' }),
      textField(item, 'url', 'Enlace del artículo', { type: 'url', required: true, help: 'A dónde lleva la tarjeta al hacer clic.' })
    ]
  }));
}

function buildStatsTab(container) {
  const s = state.content.statsSection;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'Playbook en números' }));
  container.appendChild(el('p', { class: 'admin-section-desc', text: 'Las cifras de "Playbook en números".' }));
  container.appendChild(textField(s, 'heading', 'Título de la sección', { help: 'El encabezado de la sección de cifras.' }));
  container.appendChild(arrayEditor(s.stats, {
    removable: true, addable: true, addLabel: '+ Agregar cifra',
    itemTitle: (item) => item.value || 'Cifra',
    newItem: () => ({ value: '', label: '' }),
    renderItem: (item) => [
      textField(item, 'value', 'Cifra', { help: 'El número grande (ej. 3.5M+).' }),
      textField(item, 'label', 'Descripción', { help: 'El texto pequeño que explica la cifra.' })
    ]
  }));
}

function buildTestimonialsTab(container) {
  const s = state.content.testimonialsSection;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'Testimonios' }));
  container.appendChild(el('p', { class: 'admin-section-desc', text: 'Las citas de la comunidad.' }));
  container.appendChild(textField(s, 'heading', 'Título de la sección', { help: 'El encabezado de la sección de testimonios.' }));
  container.appendChild(arrayEditor(s.testimonials, {
    removable: true, addable: true, addLabel: '+ Agregar testimonio',
    itemTitle: (item) => item.name || 'Testimonio',
    newItem: () => ({ quote: '', name: '', role: '' }),
    renderItem: (item) => [
      textField(item, 'quote', 'Cita', { multiline: true, help: 'La cita textual de la persona.' }),
      textField(item, 'name', 'Nombre', { help: 'El nombre de quien dice la cita.' }),
      textField(item, 'role', 'Cargo', { help: 'El cargo o rol de esa persona, debajo del nombre.' })
    ]
  }));
}

function buildAboutTab(container) {
  const s = state.content.aboutSection;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'Acerca de Playbook' }));
  container.appendChild(el('p', { class: 'admin-section-desc', text: 'El texto y la frase destacada de "Acerca de Playbook".' }));
  container.appendChild(textField(s, 'image', 'Imagen principal', { type: 'url', required: true, help: 'La imagen de la sección; se ve al hacer clic para reproducir el video.' }));
  container.appendChild(textField(s, 'imageAlt', 'Texto alternativo de la imagen', { help: 'Descripción de la imagen para accesibilidad y buscadores.' }));
  container.appendChild(textField(s, 'videoUrl', 'Enlace del video', { type: 'url', required: true, help: 'El video que se abre al hacer clic en la imagen.' }));
  container.appendChild(textField(s, 'badgeEyebrow', 'Etiqueta pequeña sobre la imagen', { help: 'Ej. Al Banquillo.' }));
  container.appendChild(textField(s, 'badgeTitle', 'Texto grande sobre la imagen', { help: 'El texto grande que aparece sobre la imagen.' }));
  container.appendChild(textField(s, 'eyebrow', 'Etiqueta de sección', { help: 'La etiqueta pequeña arriba del título de la sección.' }));
  container.appendChild(textField(s, 'pullQuoteMain', 'Frase destacada (parte normal)', { help: 'La primera parte de la frase, en texto normal.' }));
  container.appendChild(textField(s, 'pullQuoteEm', 'Frase destacada (parte cursiva)', { help: 'La segunda parte de la frase, en cursiva.' }));
  container.appendChild(textField(s, 'body', 'Texto', { multiline: true, help: 'El párrafo principal de la sección.' }));
  container.appendChild(textField(s, 'productsLine', 'Línea de productos', { help: 'La línea que menciona los productos de Playbook.' }));
  container.appendChild(textField(s, 'productsLineNote', 'Nota junto a la línea de productos', { help: 'Una nota corta junto a esa línea.' }));
  container.appendChild(arrayEditor(s.actions, {
    removable: true, addable: true, addLabel: '+ Agregar botón',
    itemTitle: (item) => item.label || 'Botón',
    newItem: () => ({ label: '', url: '', style: 'light' }),
    renderItem: (item) => [
      textField(item, 'label', 'Texto del botón', { help: 'El texto que se muestra en el botón.' }),
      textField(item, 'url', 'Enlace del botón', { type: 'url', required: true, help: 'A dónde lleva el botón al hacer clic.' }),
      selectField(item, 'style', 'Estilo', [{ value: 'light', label: 'Claro (con borde)' }, { value: 'accent', label: 'Destacado (verde)' }], 'Claro es un botón con borde; Destacado es un botón verde.')
    ]
  }));
}

function buildFooterTab(container) {
  const s = state.content.footer;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'Footer' }));
  container.appendChild(el('p', { class: 'admin-section-desc', text: 'Redes sociales y el pie de página.' }));
  container.appendChild(textField(s, 'brandBlurb', 'Descripción de Playbook', { multiline: true, help: 'El texto corto junto al logo, en el pie de página.' }));
  container.appendChild(textField(s, 'infinitasLinkLabel', 'Texto del enlace a Infinitas', { help: 'El texto del enlace a Infinitas en el pie de página.' }));
  container.appendChild(textField(s, 'infinitasLinkUrl', 'Enlace de Infinitas', { type: 'url', required: true, help: 'A dónde lleva ese enlace.' }));
  container.appendChild(textField(s, 'copyrightText', 'Texto de copyright', { help: 'El texto de derechos de autor, al final de la página.' }));
  container.appendChild(el('h3', { class: 'admin-section-title', text: 'Redes sociales' }));
  container.appendChild(arrayEditor(s.socialLinks, {
    removable: true, addable: true, addLabel: '+ Agregar red social',
    itemTitle: (item) => item.label || 'Red social',
    newItem: () => ({ label: '', url: '' }),
    renderItem: (item) => [
      textField(item, 'label', 'Nombre', { help: 'El nombre de la red social (ej. Instagram, X).' }),
      textField(item, 'url', 'Enlace del perfil', { type: 'url', required: true, help: 'El link al perfil de esa red social.' })
    ]
  }));
}

// ---------------------------------------------------------------- Tabs / shell

const TAB_DEFS = {
  articles: { label: 'Artículos', build: buildArticlesTab },
  opinion: { label: 'Opinión', build: buildOpinionTab },
  video: { label: 'Video', build: buildVideoTab },
  infinitas: { label: 'Infinitas', build: buildInfinitasTab },
  products: { label: 'Productos', build: buildProductsTab },
  stats: { label: 'Números', build: buildStatsTab },
  testimonials: { label: 'Testimonios', build: buildTestimonialsTab },
  about: { label: 'Acerca', build: buildAboutTab },
  midCta: { label: 'CTA', build: buildMidCtaTab },
  nav: { label: 'Navegación', build: buildNavTab },
  footer: { label: 'Footer', build: buildFooterTab }
};

function tabOrderStorageKey() {
  return `playbook_admin_tab_order_${state.username || 'anon'}`;
}

function loadTabOrder() {
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(tabOrderStorageKey()) || '[]'); } catch { saved = []; }
  const valid = saved.filter(k => TAB_DEFS[k]);
  const missing = DEFAULT_TAB_ORDER.filter(k => valid.indexOf(k) === -1);
  state.tabOrder = valid.length ? valid.concat(missing) : DEFAULT_TAB_ORDER.slice();
}

function saveTabOrder() {
  localStorage.setItem(tabOrderStorageKey(), JSON.stringify(state.tabOrder));
}

let tabDragKey = null;

function renderTabs() {
  const nav = document.getElementById('admin-tabs');
  nav.innerHTML = '';
  state.tabOrder.forEach(key => {
    const def = TAB_DEFS[key];
    if (!def) return;
    const btn = el('button', {
      type: 'button',
      class: 'admin-tab' + (state.activeTab === key ? ' is-active' : ''),
      draggable: 'true'
    }, [
      el('span', { class: 'admin-tab-handle', 'aria-hidden': 'true', text: '⠿' }),
      el('span', { class: 'admin-tab-label', text: def.label })
    ]);
    btn.addEventListener('click', () => { state.activeTab = key; renderTabs(); renderActiveForm(); updateSaveButtonLabel(); });
    btn.addEventListener('dragstart', e => { tabDragKey = key; e.dataTransfer.effectAllowed = 'move'; btn.classList.add('is-dragging'); });
    btn.addEventListener('dragend', () => btn.classList.remove('is-dragging'));
    btn.addEventListener('dragover', e => { e.preventDefault(); btn.classList.add('is-drag-over'); });
    btn.addEventListener('dragleave', () => btn.classList.remove('is-drag-over'));
    btn.addEventListener('drop', e => {
      e.preventDefault();
      btn.classList.remove('is-drag-over');
      if (!tabDragKey || tabDragKey === key) return;
      const from = state.tabOrder.indexOf(tabDragKey);
      const to = state.tabOrder.indexOf(key);
      if (from === -1 || to === -1) return;
      state.tabOrder.splice(from, 1);
      state.tabOrder.splice(to, 0, tabDragKey);
      tabDragKey = null;
      saveTabOrder();
      renderTabs();
    });
    nav.appendChild(btn);
  });
}

function renderActiveForm() {
  const pane = document.getElementById('admin-form-pane');
  pane.innerHTML = '';
  const def = TAB_DEFS[state.activeTab];
  if (!def) return;
  def.build(pane);
}

function updateSaveButtonLabel() {
  const label = document.getElementById('save-btn-label');
  label.textContent = state.activeTab === 'articles' ? 'Guardar artículos' : 'Guardar contenido';
}

// ---------------------------------------------------------------- Validation

function validateActiveTabUrls() {
  const pane = document.getElementById('admin-form-pane');
  const inputs = Array.from(pane.querySelectorAll('input[type="url"]'));
  let firstInvalid = null;
  inputs.forEach(input => {
    const ok = input._playbookValidate ? input._playbookValidate() : true;
    if (!ok && !firstInvalid) firstInvalid = input;
  });
  if (firstInvalid) {
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstInvalid.focus();
  }
  return !firstInvalid;
}

// ---------------------------------------------------------------- Conflict modal

function showConflictModal(onReload) {
  const modal = document.getElementById('conflict-modal');
  modal.hidden = false;
  const btn = document.getElementById('conflict-modal-reload');
  const handler = async () => {
    btn.disabled = true;
    await onReload();
    modal.hidden = true;
    btn.disabled = false;
    btn.removeEventListener('click', handler);
  };
  btn.addEventListener('click', handler);
}

// ---------------------------------------------------------------- Save flow

async function handleSave() {
  if (!validateActiveTabUrls()) {
    showToast('Corrige los enlaces marcados en rojo antes de guardar.', 'error');
    setStatus('Hay campos con errores', 'error');
    return;
  }

  const btn = document.getElementById('save-btn');
  btn.disabled = true;
  try {
    if (state.activeTab === 'articles') {
      const result = await apiSave('articles', state.articles, state.articlesSha);
      state.articlesDirty = false;
      state.articlesSha = result.sha;
      state.articlesBaseline = JSON.parse(JSON.stringify(state.articles));
      setStatus('Artículos guardados', 'ok');
      showToast('Guardado. El sitio se actualiza en 1-2 min.');
    } else {
      const result = await apiSave('content', state.content, state.contentSha);
      state.contentDirty = false;
      state.contentSha = result.sha;
      state.contentBaseline = JSON.parse(JSON.stringify(state.content));
      setStatus('Contenido guardado', 'ok');
      showToast('Guardado. El sitio se actualiza en 1-2 min.');
      renderPreview();
      if (!document.getElementById('preview-col-baseline').hidden) renderBaselinePreview();
    }
    updateDirtyIndicator();
  } catch (err) {
    if (err.conflict) {
      setStatus('Conflicto al guardar', 'error');
      showConflictModal(async () => {
        try {
          if (state.activeTab === 'articles') {
            const fresh = await apiLoad('articles');
            state.articles = fresh.json;
            state.articlesSha = fresh.sha;
            state.articlesBaseline = JSON.parse(JSON.stringify(fresh.json));
            state.articlesDirty = false;
          } else {
            const fresh = await apiLoad('content');
            state.content = fresh.json;
            state.contentSha = fresh.sha;
            state.contentBaseline = JSON.parse(JSON.stringify(fresh.json));
            state.contentDirty = false;
            renderPreview();
          }
          updateDirtyIndicator();
          renderActiveForm();
          setStatus('Se recargó la última versión. Vuelve a hacer tus cambios.', 'error');
        } catch (reloadErr) {
          setStatus('No se pudo recargar: ' + reloadErr.message, 'error');
          showToast('No se pudo recargar la última versión.', 'error');
        }
      });
    } else {
      setStatus('Error al guardar', 'error');
      showToast('Error al guardar: ' + err.message, 'error');
    }
  } finally {
    btn.disabled = false;
  }
}

// ---------------------------------------------------------------- Auth / boot

function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USERNAME_KEY);
  window.location.replace('/admin');
}

function initCompareToggle() {
  const toggle = document.getElementById('compare-toggle');
  const baselineCol = document.getElementById('preview-col-baseline');
  const body = document.getElementById('admin-preview-body');
  toggle.addEventListener('change', () => {
    baselineCol.hidden = !toggle.checked;
    body.classList.toggle('is-comparing', toggle.checked);
    if (toggle.checked) renderBaselinePreview();
  });
}

async function enterEditor() {
  const whoEl = document.getElementById('admin-whoami');
  if (whoEl) whoEl.textContent = state.username ? `Sesión: ${state.username}` : '';

  loadTabOrder();
  state.activeTab = state.tabOrder[0];

  const [content, articles] = await Promise.all([apiLoad('content'), apiLoad('articles')]);
  state.content = content.json;
  state.contentSha = content.sha;
  state.contentBaseline = JSON.parse(JSON.stringify(content.json));
  state.articles = articles.json;
  state.articlesSha = articles.sha;
  state.articlesBaseline = JSON.parse(JSON.stringify(articles.json));

  renderTabs();
  renderActiveForm();
  renderPreview();
  setStatus('Listo', 'ok');
  updateDirtyIndicator();

  document.getElementById('save-btn').addEventListener('click', handleSave);
  document.getElementById('logout-btn').addEventListener('click', logout);
  initCompareToggle();
  updateSaveButtonLabel();

  window.addEventListener('beforeunload', (e) => {
    if (state.contentDirty || state.articlesDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

function init() {
  if (!state.token) return;
  enterEditor().catch(err => {
    console.error('[Playbook admin] No se pudo iniciar el panel:', err);
    logout();
  });
}

init();
