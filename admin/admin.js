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
  footerContentTemplate, footerCopyrightTemplate
} from '../js/templates.js';

const TOKEN_KEY = 'playbook_admin_token';
const USERNAME_KEY = 'playbook_admin_username';
const KNOWN_SOURCES = ['industry-shots', 'la-lana', 'infinitas', 'playbook'];

const state = {
  token: sessionStorage.getItem(TOKEN_KEY) || null,
  username: sessionStorage.getItem(USERNAME_KEY) || '',
  content: null, contentSha: null, contentDirty: false,
  articles: null, articlesSha: null, articlesDirty: false,
  activeTab: 'nav'
};

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

function labeledField(labelText, inputEl) {
  return el('label', { class: 'field' }, [el('span', { class: 'field-label', text: labelText }), inputEl]);
}

function textField(obj, key, labelText, opts = {}) {
  const input = el(opts.multiline ? 'textarea' : 'input', {
    class: 'input',
    type: opts.type || 'text'
  });
  input.value = obj[key] || '';
  input.addEventListener('input', () => {
    obj[key] = input.value;
    onDirty();
  });
  return labeledField(labelText, input);
}

function selectField(obj, key, labelText, options) {
  const select = el('select', { class: 'input' });
  options.forEach(o => select.appendChild(el('option', { value: o.value, text: o.label })));
  select.value = obj[key] || options[0].value;
  select.addEventListener('change', () => {
    obj[key] = select.value;
    onDirty();
  });
  return labeledField(labelText, select);
}

function arrayEditor(arr, opts) {
  const wrap = el('div', { class: 'array-editor' });
  function rerender() {
    wrap.innerHTML = '';
    arr.forEach((item, i) => {
      const box = el('div', { class: 'array-item' });
      const actions = [];
      if (opts.movable && i > 0) {
        actions.push(el('button', {
          type: 'button', class: 'btn-mini', text: '↑',
          onclick: () => { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; rerender(); onDirty(); }
        }));
      }
      if (opts.movable && i < arr.length - 1) {
        actions.push(el('button', {
          type: 'button', class: 'btn-mini', text: '↓',
          onclick: () => { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; rerender(); onDirty(); }
        }));
      }
      if (opts.removable) {
        actions.push(el('button', {
          type: 'button', class: 'btn-mini btn-danger', text: 'Eliminar',
          onclick: () => { arr.splice(i, 1); rerender(); onDirty(); }
        }));
      }
      box.appendChild(el('div', { class: 'array-item-header' }, [
        el('span', { class: 'array-item-title', text: opts.itemTitle ? opts.itemTitle(item, i) : `#${i + 1}` }),
        el('div', { class: 'array-item-actions' }, actions)
      ]));
      opts.renderItem(item, i).forEach(f => box.appendChild(f));
      wrap.appendChild(box);
    });
    if (opts.addable) {
      wrap.appendChild(el('button', {
        type: 'button', class: 'btn-add', text: opts.addLabel || '+ Agregar',
        onclick: () => { arr.push(opts.newItem()); rerender(); onDirty(); }
      }));
    }
  }
  rerender();
  return wrap;
}

// ---------------------------------------------------------------- Dirty / preview / status

let previewTimer = null;
function onDirty() {
  setStatus('Cambios sin guardar', 'warn');
  if (state.activeTab === 'articles') {
    state.articlesDirty = true;
    return;
  }
  state.contentDirty = true;
  clearTimeout(previewTimer);
  previewTimer = setTimeout(renderPreview, 120);
}

function setStatus(text, kind) {
  const elStatus = document.getElementById('admin-status');
  elStatus.textContent = text;
  elStatus.className = 'admin-status' + (kind === 'ok' ? ' is-ok' : kind === 'error' ? ' is-error' : '');
}

function mount(id, html) {
  const target = document.getElementById(id);
  if (target) target.innerHTML = html;
}

function renderPreview() {
  const c = state.content;
  if (!c) return;
  mount('preview-opinion-head', opinionSectionHeadTemplate(c.opinionSection));
  mount('preview-opinion-grid', opinionGridTemplate(c.opinionSection));
  mount('preview-products-head', productsSectionHeadTemplate(c.productsSection));
  mount('preview-products-grid', productsGridTemplate(c.productsSection));
  mount('preview-mid-cta', midCtaTemplate(c.midCta));
  mount('preview-video-head', videoSectionHeadTemplate(c.videoSection));
  mount('preview-video-feature', videoFeatureTemplate(c.videoSection.featured));
  mount('preview-video-feature-copy', videoFeatureCopyTemplate(c.videoSection.featured));
  mount('preview-video-clips', videoClipsTemplate(c.videoSection));
  mount('preview-infinitas-head', infinitasSectionHeadTemplate(c.infinitasSection));
  mount('preview-infinitas-wrap', infinitasWrapTemplate(c.infinitasSection));
  mount('preview-stats-heading', statsHeadingTemplate(c.statsSection));
  mount('preview-stats-grid', statsGridTemplate(c.statsSection));
  mount('preview-testimonials-head', testimonialsSectionHeadTemplate(c.testimonialsSection));
  mount('preview-testimonials-grid', testimonialsGridTemplate(c.testimonialsSection));
  mount('preview-about-card', aboutCardTemplate(c.aboutSection));
  mount('preview-footer-content', footerContentTemplate(c.footer));
  mount('preview-footer-copyright', footerCopyrightTemplate(c.footer));
}

// ---------------------------------------------------------------- API calls

async function apiLogin(username, password) {
  const res = await fetch('/api/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'No se pudo iniciar sesión');
  return body;
}

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
  container.appendChild(textField(nav, 'ctaLabel', 'Texto del botón de suscripción'));
  container.appendChild(textField(nav, 'ctaUrl', 'URL del botón de suscripción', { type: 'url' }));
  container.appendChild(el('h3', { class: 'admin-section-title', text: 'Enlaces del menú (texto y URL, sin agregar/quitar)' }));
  container.appendChild(arrayEditor(nav.links, {
    movable: false, removable: false, addable: false,
    itemTitle: (item) => item.label || 'Enlace',
    renderItem: (item) => [
      textField(item, 'label', 'Texto'),
      textField(item, 'href', 'Enlace (ej. #analisis)')
    ]
  }));
}

function buildOpinionTab(container) {
  const s = state.content.opinionSection;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'Artículos de opinión' }));
  container.appendChild(textField(s, 'heading', 'Título de la sección'));
  container.appendChild(textField(s, 'archiveLinkLabel', 'Texto del enlace "Ver archivo"'));
  container.appendChild(textField(s, 'archiveLinkUrl', 'URL del enlace "Ver archivo"', { type: 'url' }));
  container.appendChild(arrayEditor(s.cards, {
    movable: true, removable: true, addable: true, addLabel: '+ Agregar artículo',
    itemTitle: (item) => item.title || 'Artículo',
    newItem: () => ({ variant: 'standard', masthead: '', title: '', excerpt: '', url: '', image: '', imageAlt: '' }),
    renderItem: (item) => [
      selectField(item, 'variant', 'Formato', [{ value: 'standard', label: 'Estándar (texto)' }, { value: 'banner', label: 'Banner (con imagen)' }]),
      textField(item, 'masthead', 'Publicación (ej. La Lana del Mundial)'),
      textField(item, 'title', 'Título'),
      textField(item, 'excerpt', 'Extracto', { multiline: true }),
      textField(item, 'url', 'URL', { type: 'url' }),
      textField(item, 'image', 'Imagen (URL, solo para formato banner)', { type: 'url' })
    ]
  }));
}

function buildProductsTab(container) {
  const s = state.content.productsSection;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'Productos editoriales' }));
  container.appendChild(textField(s, 'heading', 'Título de la sección'));
  container.appendChild(arrayEditor(s.products, {
    movable: true, removable: true, addable: true, addLabel: '+ Agregar producto',
    itemTitle: (item) => item.wordmark || item.description || 'Producto',
    newItem: () => ({ variant: 'banner', glyph: '', wordmark: '', description: '', meta: '', url: '', image: '', imageAlt: '' }),
    renderItem: (item) => [
      selectField(item, 'variant', 'Formato', [{ value: 'banner', label: 'Banner (con imagen)' }, { value: 'glyph', label: 'Ícono + texto' }]),
      textField(item, 'glyph', 'Ícono (emoji, solo para formato ícono)'),
      textField(item, 'wordmark', 'Nombre del producto (solo para formato ícono)'),
      textField(item, 'image', 'Imagen (URL, solo para formato banner)', { type: 'url' }),
      textField(item, 'description', 'Descripción'),
      textField(item, 'meta', 'Frecuencia (ej. Martes / Jueves)'),
      textField(item, 'url', 'URL', { type: 'url' })
    ]
  }));
}

function buildMidCtaTab(container) {
  const s = state.content.midCta;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'CTA secundario' }));
  container.appendChild(textField(s, 'headingMain', 'Título (parte normal)'));
  container.appendChild(textField(s, 'headingEm', 'Título (parte destacada)'));
  container.appendChild(textField(s, 'body', 'Texto', { multiline: true }));
  container.appendChild(textField(s, 'buttonLabel', 'Texto del botón'));
  container.appendChild(textField(s, 'formUrl', 'URL del formulario', { type: 'url' }));
  container.appendChild(textField(s, 'successMessage', 'Mensaje de éxito al suscribirse'));
}

function buildVideoTab(container) {
  const s = state.content.videoSection;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'Video Playbook' }));
  container.appendChild(textField(s, 'heading', 'Título de la sección'));
  container.appendChild(textField(s, 'sub', 'Subtítulo'));
  container.appendChild(textField(s, 'channelLinkLabel', 'Texto del enlace al canal'));
  container.appendChild(textField(s, 'channelLinkUrl', 'URL del canal', { type: 'url' }));

  container.appendChild(el('h3', { class: 'admin-section-title', text: 'Video destacado' }));
  const f = s.featured;
  container.appendChild(textField(f, 'embedId', 'ID de video de YouTube (ej. ihHFQ30NE5c)'));
  container.appendChild(textField(f, 'embedTitle', 'Título del embed (accesibilidad)'));
  container.appendChild(textField(f, 'eyebrow', 'Etiqueta (ej. Al Banquillo)'));
  container.appendChild(textField(f, 'title', 'Título'));
  container.appendChild(el('div', { class: 'field' }, [
    el('span', { class: 'field-label', text: 'Párrafos (uno por línea)' }),
    (() => {
      const ta = el('textarea', { class: 'input' });
      ta.value = (f.paragraphs || []).join('\n');
      ta.addEventListener('input', () => { f.paragraphs = ta.value.split('\n').filter(l => l.trim() !== ''); onDirty(); });
      return ta;
    })()
  ]));
  container.appendChild(arrayEditor(f.episodeLinks, {
    movable: true, removable: true, addable: true, addLabel: '+ Agregar episodio',
    itemTitle: (item) => item.label || 'Episodio',
    newItem: () => ({ label: '', url: '' }),
    renderItem: (item) => [textField(item, 'label', 'Texto'), textField(item, 'url', 'URL', { type: 'url' })]
  }));

  container.appendChild(el('h3', { class: 'admin-section-title', text: 'Clips cortos' }));
  container.appendChild(arrayEditor(s.clips, {
    movable: true, removable: true, addable: true, addLabel: '+ Agregar clip',
    itemTitle: (item) => item.title || 'Clip',
    newItem: () => ({ platform: 'youtube', url: '', thumbnail: '', title: '', handle: '', igText: '', variant: '' }),
    renderItem: (item) => [
      selectField(item, 'platform', 'Plataforma', [{ value: 'youtube', label: 'YouTube' }, { value: 'instagram', label: 'Instagram' }]),
      textField(item, 'url', 'URL', { type: 'url' }),
      textField(item, 'thumbnail', 'Miniatura (URL, solo YouTube)', { type: 'url' }),
      textField(item, 'igText', 'Texto de la tarjeta (solo Instagram)'),
      textField(item, 'title', 'Título'),
      textField(item, 'handle', 'Cuenta (ej. @playbook.la)')
    ]
  }));
}

function buildInfinitasTab(container) {
  const s = state.content.infinitasSection;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'Infinitas' }));
  container.appendChild(textField(s, 'heading', 'Título de la sección'));
  container.appendChild(textField(s, 'sub', 'Subtítulo'));
  container.appendChild(textField(s, 'linkLabel', 'Texto del enlace'));
  container.appendChild(textField(s, 'linkUrl', 'URL del enlace', { type: 'url' }));

  container.appendChild(el('h3', { class: 'admin-section-title', text: 'Artículo destacado' }));
  const feat = s.featured;
  container.appendChild(textField(feat, 'image', 'Imagen (URL)', { type: 'url' }));
  container.appendChild(textField(feat, 'eyebrow', 'Etiqueta'));
  container.appendChild(textField(feat, 'title', 'Título'));
  container.appendChild(textField(feat, 'body', 'Texto', { multiline: true }));
  container.appendChild(textField(feat, 'url', 'URL', { type: 'url' }));

  container.appendChild(el('h3', { class: 'admin-section-title', text: 'Artículos secundarios' }));
  container.appendChild(arrayEditor(s.sideCards, {
    movable: true, removable: true, addable: true, addLabel: '+ Agregar artículo',
    itemTitle: (item) => item.title || 'Artículo',
    newItem: () => ({ image: '', eyebrow: '', title: '', url: '' }),
    renderItem: (item) => [
      textField(item, 'image', 'Imagen (URL)', { type: 'url' }),
      textField(item, 'eyebrow', 'Etiqueta'),
      textField(item, 'title', 'Título'),
      textField(item, 'url', 'URL', { type: 'url' })
    ]
  }));
}

function buildStatsTab(container) {
  const s = state.content.statsSection;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'Playbook en números' }));
  container.appendChild(textField(s, 'heading', 'Título de la sección'));
  container.appendChild(arrayEditor(s.stats, {
    movable: true, removable: true, addable: true, addLabel: '+ Agregar cifra',
    itemTitle: (item) => item.value || 'Cifra',
    newItem: () => ({ value: '', label: '' }),
    renderItem: (item) => [textField(item, 'value', 'Cifra (ej. 3.5M+)'), textField(item, 'label', 'Descripción')]
  }));
}

function buildTestimonialsTab(container) {
  const s = state.content.testimonialsSection;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'Testimonios' }));
  container.appendChild(textField(s, 'heading', 'Título de la sección'));
  container.appendChild(arrayEditor(s.testimonials, {
    movable: true, removable: true, addable: true, addLabel: '+ Agregar testimonio',
    itemTitle: (item) => item.name || 'Testimonio',
    newItem: () => ({ quote: '', name: '', role: '' }),
    renderItem: (item) => [
      textField(item, 'quote', 'Cita', { multiline: true }),
      textField(item, 'name', 'Nombre'),
      textField(item, 'role', 'Cargo')
    ]
  }));
}

function buildAboutTab(container) {
  const s = state.content.aboutSection;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'Acerca de Playbook' }));
  container.appendChild(textField(s, 'image', 'Imagen (URL)', { type: 'url' }));
  container.appendChild(textField(s, 'imageAlt', 'Texto alternativo de la imagen'));
  container.appendChild(textField(s, 'videoUrl', 'URL de video (al hacer clic en la imagen)', { type: 'url' }));
  container.appendChild(textField(s, 'badgeEyebrow', 'Etiqueta pequeña sobre la imagen'));
  container.appendChild(textField(s, 'badgeTitle', 'Texto grande sobre la imagen'));
  container.appendChild(textField(s, 'eyebrow', 'Etiqueta de sección'));
  container.appendChild(textField(s, 'pullQuoteMain', 'Frase destacada (parte normal)'));
  container.appendChild(textField(s, 'pullQuoteEm', 'Frase destacada (parte cursiva)'));
  container.appendChild(textField(s, 'body', 'Texto', { multiline: true }));
  container.appendChild(textField(s, 'productsLine', 'Línea de productos'));
  container.appendChild(textField(s, 'productsLineNote', 'Nota junto a la línea de productos'));
  container.appendChild(arrayEditor(s.actions, {
    movable: true, removable: true, addable: true, addLabel: '+ Agregar botón',
    itemTitle: (item) => item.label || 'Botón',
    newItem: () => ({ label: '', url: '', style: 'light' }),
    renderItem: (item) => [
      textField(item, 'label', 'Texto'),
      textField(item, 'url', 'URL', { type: 'url' }),
      selectField(item, 'style', 'Estilo', [{ value: 'light', label: 'Claro' }, { value: 'accent', label: 'Destacado' }])
    ]
  }));
}

function buildFooterTab(container) {
  const s = state.content.footer;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'Footer' }));
  container.appendChild(textField(s, 'brandBlurb', 'Descripción de Playbook', { multiline: true }));
  container.appendChild(textField(s, 'infinitasLinkLabel', 'Texto del enlace a Infinitas'));
  container.appendChild(textField(s, 'infinitasLinkUrl', 'URL de Infinitas', { type: 'url' }));
  container.appendChild(textField(s, 'copyrightText', 'Texto de copyright'));
  container.appendChild(el('h3', { class: 'admin-section-title', text: 'Redes sociales' }));
  container.appendChild(arrayEditor(s.socialLinks, {
    movable: true, removable: true, addable: true, addLabel: '+ Agregar red social',
    itemTitle: (item) => item.label || 'Red social',
    newItem: () => ({ label: '', url: '' }),
    renderItem: (item) => [textField(item, 'label', 'Nombre'), textField(item, 'url', 'URL', { type: 'url' })]
  }));
}

function buildArticlesTab(container) {
  if (!state.articles) {
    container.appendChild(el('p', { text: 'Cargando artículos…' }));
    return;
  }
  const list = state.articles.articles;
  container.appendChild(el('h2', { class: 'admin-section-title', text: 'Artículos (Noticias)' }));
  container.appendChild(el('p', { class: 'field-label', text: 'Las automatizaciones (Make.com) pueden seguir agregando artículos aquí. Este panel es para correcciones manuales: editar, eliminar o ajustar la prioridad.' }));
  container.appendChild(arrayEditor(list, {
    movable: false, removable: true, addable: true, addLabel: '+ Agregar artículo',
    itemTitle: (item) => item.title || 'Artículo',
    newItem: () => ({
      id: '', title: '', excerpt: '', author: '', date: '', dateFormatted: '',
      publication: 'Playbook', source: 'playbook', tag: '', priority: 0, url: '', imageUrl: ''
    }),
    renderItem: (item) => [
      textField(item, 'title', 'Título'),
      textField(item, 'excerpt', 'Extracto', { multiline: true }),
      textField(item, 'author', 'Autor'),
      textField(item, 'publication', 'Publicación'),
      selectField(item, 'source', 'Fuente', KNOWN_SOURCES.map(v => ({ value: v, label: v }))),
      textField(item, 'tag', 'Etiqueta'),
      textField(item, 'date', 'Fecha (AAAA-MM-DD)'),
      textField(item, 'dateFormatted', 'Fecha (texto, ej. 9 jul 2026)'),
      textField(item, 'priority', 'Prioridad (mayor = más arriba)', { type: 'number' }),
      textField(item, 'url', 'URL', { type: 'url' }),
      textField(item, 'imageUrl', 'Imagen (URL, opcional)', { type: 'url' })
    ]
  }));
}

// ---------------------------------------------------------------- Tabs / shell

const TABS = [
  { key: 'nav', label: 'Navegación', build: buildNavTab },
  { key: 'opinion', label: 'Opinión', build: buildOpinionTab },
  { key: 'products', label: 'Productos', build: buildProductsTab },
  { key: 'midCta', label: 'CTA', build: buildMidCtaTab },
  { key: 'video', label: 'Video', build: buildVideoTab },
  { key: 'infinitas', label: 'Infinitas', build: buildInfinitasTab },
  { key: 'stats', label: 'Números', build: buildStatsTab },
  { key: 'testimonials', label: 'Testimonios', build: buildTestimonialsTab },
  { key: 'about', label: 'Acerca', build: buildAboutTab },
  { key: 'footer', label: 'Footer', build: buildFooterTab },
  { key: 'articles', label: 'Artículos', build: buildArticlesTab }
];

function renderTabs() {
  const nav = document.getElementById('admin-tabs');
  nav.innerHTML = '';
  TABS.forEach(tab => {
    nav.appendChild(el('button', {
      type: 'button',
      class: 'admin-tab' + (state.activeTab === tab.key ? ' is-active' : ''),
      text: tab.label,
      onclick: () => { state.activeTab = tab.key; renderTabs(); renderActiveForm(); }
    }));
  });
}

function renderActiveForm() {
  const pane = document.getElementById('admin-form-pane');
  pane.innerHTML = '';
  const tab = TABS.find(t => t.key === state.activeTab);
  if (!tab) return;
  tab.build(pane);
}

function updateSaveButtonLabel() {
  const btn = document.getElementById('save-btn');
  btn.textContent = state.activeTab === 'articles' ? 'Guardar artículos' : 'Guardar contenido';
}

// ---------------------------------------------------------------- Save flow

async function handleSave() {
  const btn = document.getElementById('save-btn');
  btn.disabled = true;
  try {
    if (state.activeTab === 'articles') {
      await apiSave('articles', state.articles, state.articlesSha);
      state.articlesDirty = false;
      const fresh = await apiLoad('articles');
      state.articles = fresh.json;
      state.articlesSha = fresh.sha;
      setStatus('Artículos guardados. El sitio se actualizará en 1-2 min.', 'ok');
    } else {
      await apiSave('content', state.content, state.contentSha);
      state.contentDirty = false;
      const fresh = await apiLoad('content');
      state.content = fresh.json;
      state.contentSha = fresh.sha;
      setStatus('Contenido guardado. El sitio se actualizará en 1-2 min.', 'ok');
      renderPreview();
    }
  } catch (err) {
    if (err.conflict) {
      setStatus('Alguien más guardó cambios primero. Recargando la última versión…', 'error');
      try {
        if (state.activeTab === 'articles') {
          const fresh = await apiLoad('articles');
          state.articles = fresh.json;
          state.articlesSha = fresh.sha;
        } else {
          const fresh = await apiLoad('content');
          state.content = fresh.json;
          state.contentSha = fresh.sha;
          renderPreview();
        }
        renderActiveForm();
        setStatus('Se recargó la última versión. Vuelve a hacer tus cambios.', 'error');
      } catch (reloadErr) {
        setStatus('No se pudo recargar: ' + reloadErr.message, 'error');
      }
    } else {
      setStatus('Error al guardar: ' + err.message, 'error');
    }
  } finally {
    btn.disabled = false;
  }
}

// ---------------------------------------------------------------- Auth / boot

function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USERNAME_KEY);
  state.token = null;
  document.getElementById('editor-screen').hidden = true;
  document.getElementById('login-screen').hidden = false;
}

async function enterEditor() {
  document.getElementById('login-screen').hidden = true;
  document.getElementById('editor-screen').hidden = false;
  const whoEl = document.getElementById('admin-whoami');
  if (whoEl) whoEl.textContent = state.username ? `Sesión: ${state.username}` : '';

  const [content, articles] = await Promise.all([apiLoad('content'), apiLoad('articles')]);
  state.content = content.json;
  state.contentSha = content.sha;
  state.articles = articles.json;
  state.articlesSha = articles.sha;

  renderTabs();
  renderActiveForm();
  renderPreview();
  setStatus('Listo', 'ok');

  document.getElementById('save-btn').addEventListener('click', handleSave);
  document.getElementById('logout-btn').addEventListener('click', logout);

  const tabsNav = document.getElementById('admin-tabs');
  tabsNav.addEventListener('click', updateSaveButtonLabel);
  updateSaveButtonLabel();
}

function initLogin() {
  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorEl.textContent = '';
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit');
    submitBtn.disabled = true;
    try {
      const { token, name } = await apiLogin(username, password);
      state.token = token;
      state.username = name || username;
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(USERNAME_KEY, state.username);
      await enterEditor();
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function init() {
  initLogin();
  if (state.token) {
    enterEditor().catch(() => logout());
  }
}

init();
