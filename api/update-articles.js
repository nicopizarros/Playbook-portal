// api/update-articles.js
// Webhook: recibe datos de artículo nuevo desde Make y actualiza articles.json

export default async function handler(req, res) {

  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar clave secreta
  const secret = req.headers['x-playbook-secret'];
  if (!process.env.PLAYBOOK_SECRET || secret !== process.env.PLAYBOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const article = req.body;

  // Validación mínima
  if (!article || !article.url || !article.title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO        = 'nicopizarros/Playbook-portal';
  const FILE_PATH   = 'articles.json';
  const API_BASE    = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
  const HEADERS     = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };

  // 1. Leer archivo actual
  const getRes = await fetch(API_BASE, { headers: HEADERS });
  if (!getRes.ok) {
    return res.status(500).json({ error: 'Could not read articles.json from GitHub' });
  }
  const fileData = await getRes.json();
  const sha      = fileData.sha;
  const current  = JSON.parse(
    Buffer.from(fileData.content.replace(/\n/g, ''), 'base64').toString('utf-8')
  );

  // 2. Deduplicación por URL
  if (current.articles.some(a => a.url === article.url)) {
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

  const newArticle = {
    id:            slug,
    title:         article.title,
    excerpt:       stripHtml(article.excerpt || article.description || ''),
    author:        article.author || 'Guillermo Mejía',
    date:          dateISO,
    dateFormatted: dateFormatted,
    publication:   article.publication || pubInfo.publication,
    source:        article.source      || pubInfo.source,
    tag:           article.tag         || '',
    url:           article.url,
    imageUrl:      article.imageUrl    || ''
  };

  // 6. Prepend al array y actualizar
  const updated = {
    lastUpdated: new Date().toISOString(),
    articles: [newArticle, ...current.articles]
  };

  const newContent = Buffer.from(JSON.stringify(updated, null, 2)).toString('base64');

  const putRes = await fetch(API_BASE, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify({
      message:   `[Auto] ${newArticle.publication}: ${newArticle.title}`,
      content:   newContent,
      sha:       sha,
      committer: { name: 'Playbook Bot', email: 'bot@playbook.la' }
    })
  });

  if (!putRes.ok) {
    const err = await putRes.json();
    return res.status(500).json({ error: err });
  }

  return res.status(200).json({ status: 'ok', article: newArticle.title });
}
