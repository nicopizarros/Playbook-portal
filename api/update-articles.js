// api/update-articles.js
// Webhook: recibe datos de artículo nuevo desde Make y actualiza articles.json

import { constantTimeEqual } from '../lib/auth.js';
import { readFile, writeFile } from '../lib/github.js';
import { SPORT_OPTIONS } from '../js/taxonomy.js';

// Hard cap so articles.json can't grow without bound — fetched in full on
// every homepage load and every admin session, so unbounded growth is a
// real, gradual cost/latency problem, not just a theoretical one.
const MAX_ARTICLES = 500;

// Retry budget for a write that loses the optimistic-concurrency race (see
// the retry loop below) — same attempt/backoff shape as lib/github.js's
// withRetry, kept separate because retrying here is only safe due to this
// endpoint's own dedupe check, which withRetry has no way to know about.
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 300;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(str) {
  return String(str || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

// Backfills `sport` tags for articles ingested without a usable tags object
// — the normal case from Make/RSS, which has no concept of this taxonomy.
// Sport names ("NFL", "NBA", "Tenis"...) often appear literally in a title,
// making a safe, cheap substring match worthwhile. `scope` and `vertical`
// are deliberately left empty: neither can be inferred from article text
// with enough confidence to beat a blank field an editor fills in by hand
// via the CMS — a wrong auto-tag is worse than an honest gap.
function inferTags(article) {
  const haystack = normalizeText(`${article.title || ''} ${article.excerpt || article.description || ''}`);
  if (!haystack.trim()) return { scope: [], sport: [], vertical: [] };

  const sport = SPORT_OPTIONS.filter(option => {
    if (option === 'Multi-deporte / Otros') return false; // catch-all, not a real signal
    const pattern = new RegExp(`\\b${escapeRegExp(normalizeText(option))}\\b`);
    return pattern.test(haystack);
  });

  return { scope: [], sport, vertical: [] };
}

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

  // 1. Limpiar HTML del excerpt si viene con tags
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

  // 2. Detectar publicación desde el título
  function detectPublication(title) {
    if (/industry shots/i.test(title)) return { publication: 'Industry Shots', source: 'industry-shots' };
    if (/lana/i.test(title))           return { publication: 'La Lana del Mundial', source: 'la-lana' };
    if (/infinitas/i.test(title))      return { publication: 'Infinitas', source: 'infinitas' };
    return { publication: 'Playbook', source: 'playbook' };
  }

  // 3. Campos derivados del payload — no dependen de articles.json, así que
  // se calculan una sola vez, fuera del loop de reintento de abajo.
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

  // Make/RSS casi nunca manda un objeto tags con contenido real (RSS no
  // conoce esta taxonomía) — un objeto presente pero vacío cuenta igual
  // que ausente, así que en ambos casos se completa con inferTags().
  const hasUsableTags = article.tags && (
    (article.tags.scope && article.tags.scope.length) ||
    (article.tags.sport && article.tags.sport.length) ||
    (article.tags.vertical && article.tags.vertical.length)
  );
  const tags = hasUsableTags ? article.tags : inferTags(article);

  // 4. Leer, deduplicar y escribir — reintentado contra datos frescos si la
  // escritura pierde la carrera de concurrencia optimista (409). Reintentar
  // acá es seguro porque la deduplicación por substack_url vuelve a correr
  // contra los datos recién leídos en cada intento (a diferencia de un
  // conflicto de guardado humano en /admin, que debe mostrarse al editor en
  // vez de reintentarse solo — ver el modal de conflicto en admin/dashboard.js
  // y por qué lib/github.js nunca reintenta un 409 por su cuenta).
  let current, sha;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const result = await readFile('articles.json');
      current = result.json;
      sha = result.sha;
    } catch (err) {
      return res.status(err.status || 500).json({ error: 'Could not read articles.json from GitHub' });
    }

    if (current.articles.some(a => a.substack_url === article.url)) {
      return res.status(200).json({ status: 'duplicate', url: article.url });
    }

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
      tags:          tags,
      priority:      priority,
      featured:      article.featured === true,
      mostrar_autor: article.mostrar_autor === true,
      reading_time:  Number.isFinite(article.reading_time) ? article.reading_time : 1,
      substack_url:  article.substack_url || article.url,
      imageUrl:      article.imageUrl    || ''
    };

    const updated = {
      lastUpdated: new Date().toISOString(),
      articles: [newArticle, ...current.articles].slice(0, MAX_ARTICLES)
    };

    try {
      await writeFile('articles.json', updated, sha, `[Auto] ${newArticle.publication}: ${newArticle.title}`,
        { name: 'Playbook Bot', email: 'bot@playbook.la' });
      return res.status(200).json({ status: 'ok', article: newArticle.title });
    } catch (err) {
      const isConflict = err.status === 409;
      if (!isConflict) {
        return res.status(err.status || 500).json({ error: err.message });
      }
      if (attempt === MAX_ATTEMPTS - 1) {
        return res.status(409).json({
          error: 'No se pudo guardar articles.json tras varios intentos por conflictos de escritura concurrente',
          status: 'conflict'
        });
      }
      await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
    }
  }
}
