// api/update-articles.js
// Webhook: recibe datos de artículo nuevo desde Make y actualiza articles.json

import { constantTimeEqual } from '../lib/auth.js';
import { readFile, writeFile } from '../lib/github.js';

// Hard cap so articles.json can't grow without bound — fetched in full on
// every homepage load and every admin session, so unbounded growth is a
// real, gradual cost/latency problem, not just a theoretical one.
const MAX_ARTICLES = 500;

export default async function handler(req, res) {

  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar clave secreta (comparación en tiempo constante)
  const secret = req.headers['x-playbook-secret'];
  if (!process.env.PLAYBOOK_SECRET || !constantTimeEqual(secret, process.env.PLAYBOOK_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const article = req.body;

  // Validación mínima
  if (!article || !article.url || !article.title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 1. Leer archivo actual
  let current, sha;
  try {
    const result = await readFile('articles.json');
    current = result.json;
    sha = result.sha;
  } catch (err) {
    return res.status(err.status || 500).json({ error: 'Could not read articles.json from GitHub' });
  }

  // 2. Deduplicación por URL
  if (current.articles.some(a => a.substack_url === article.url)) {
    return res.status(200).json({ status: 'duplicate', url: article.url });
  }

  // 3. Limpiar HTML del excerpt si viene con tags
  function stripHtml(str) {
    return (str || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()
      .slice(0, 300);
  }

  // 4. Detectar publicación desde el título
  function detectPublication(title) {
    if (/industry shots/i.test(title)) return { publication: 'Industry Shots', source: 'industry-shots' };
    if (/lana/i.test(title))           return { publication: 'La Lana del Mundial', source: 'la-lana' };
    if (/infinitas/i.test(title))      return { publication: 'Infinitas', source: 'infinitas' };
    return { publication: 'Playbook', source: 'playbook' };
  }

  // 5. Construir objeto artículo
  const pubInfo = detectPublication(article.title);
  const slug    = (article.url || '').replace(/.*\/p\//, '').replace(/[^a-z0-9-]/g, '-');
  const dateObj = new Date(article.pubDate || Date.now());
  const months  = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const dateFormatted = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  const dateISO = dateObj.toISOString().slice(0, 10);

  // Prioridad: si no viene explícita en el payload, el artículo entra con una
  // prioridad neutral (3). Antes esto era "maxPriority + 1", que crecía sin
  // límite en cada artículo nuevo y eventualmente pasaba de 5 — rompiendo en
  // silencio la señal de "5 estrellas = hero" que usa la portada.
  const priority = Number.isFinite(article.priority) ? article.priority : 3;

  // Dedupe id contra lo ya existente por si el slug derivado del URL choca.
  let id = slug;
  if (current.articles.some(a => a.id === id)) {
    id = `${slug}-${Date.now().toString(36)}`;
  }

  const newArticle = {
    id,
    title:         article.title,
    excerpt:       stripHtml(article.excerpt || article.description || ''),
    teaser:        stripHtml(article.teaser || article.excerpt || article.description || ''),
    author:        article.author || 'Guillermo Mejía',
    date:          dateISO,
    dateFormatted: dateFormatted,
    publication:   article.publication || pubInfo.publication,
    source:        article.source      || pubInfo.source,
    tags:          article.tags        || { scope: [], sport: [], vertical: [] },
    priority:      priority,
    featured:      article.featured === true,
    mostrar_autor: article.mostrar_autor === true,
    reading_time:  Number.isFinite(article.reading_time) ? article.reading_time : 1,
    substack_url:  article.substack_url || article.url,
    imageUrl:      article.imageUrl    || ''
  };

  // 6. Prepend al array, recortar al límite y actualizar
  const updated = {
    lastUpdated: new Date().toISOString(),
    articles: [newArticle, ...current.articles].slice(0, MAX_ARTICLES)
  };

  try {
    await writeFile('articles.json', updated, sha, `[Auto] ${newArticle.publication}: ${newArticle.title}`,
      { name: 'Playbook Bot', email: 'bot@playbook.la' });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }

  return res.status(200).json({ status: 'ok', article: newArticle.title });
}
