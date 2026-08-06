// Builds the Substack archive backlog: everything ever published on the two
// Playbook Substacks, diffed against what is already live in the articles
// table, so we can see exactly how much of the archive is still missing from
// playbook.la.
//
// Usage: POSTGRES_URL=... node scripts/build-substack-backlog.mjs
// Writes: docs/SUBSTACK-ARCHIVE-BACKLOG.md
//         scripts/data/substack-archive-backlog.json
//
// Network: uses Substack's public JSON API. /api/v1/archive paginates oddly
// (the first page returns fewer rows than `limit`), so we advance the offset
// by however many rows actually came back and dedupe on post id. Full bodies
// come from /api/v1/posts/<slug>, which returns un-paywalled HTML for every
// post on both publications.

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

const PUBS = ['playbookmedia', 'soninfinitas'];
const CACHE = path.join(process.cwd(), '.cache', 'substack');
const ROOT = process.cwd();

// ---------------------------------------------------------------- fetching

async function getJSON(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } });
      if (res.ok) return await res.json();
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
  throw new Error(`failed to fetch ${url}`);
}

async function cached(key, fn) {
  const file = path.join(CACHE, `${key}.json`);
  if (existsSync(file)) return JSON.parse(await readFile(file, 'utf8'));
  const data = await fn();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data));
  return data;
}

async function archive(pub) {
  const seen = new Map();
  let offset = 0;
  let empties = 0;
  while (offset < 2000) {
    const page = await getJSON(
      `https://${pub}.substack.com/api/v1/archive?sort=new&search=&offset=${offset}&limit=50`,
    );
    if (!page.length) {
      if (++empties >= 2) break;
      offset += 20;
      continue;
    }
    empties = 0;
    for (const p of page) if (!seen.has(p.id)) seen.set(p.id, p);
    offset += page.length;
  }
  return [...seen.values()].sort((a, b) => b.post_date.localeCompare(a.post_date));
}

// ------------------------------------------------------------ html parsing

const strip = (h) =>
  (h || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

function bodyHtml(post) {
  return (post.body_html || '')
    .replace(/<figure[\s\S]*?<\/figure>/g, '')
    .replace(
      /<div class="(subscription-widget|button|captioned-image|digest-post|poll|pullquote)[^"]*"[\s\S]*?<\/div>/g,
      '',
    );
}

const headings = (post) =>
  [...bodyHtml(post).matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/g)]
    .map((m) => strip(m[1]))
    .filter(Boolean);

// A paragraph counts as a headline when essentially all of its visible text
// sits inside <strong> — that is how the digest format marks a news item,
// versus the plain supporting bullets used for stats.
function isBoldOnly(pHtml) {
  const txt = strip(pHtml);
  if (!txt) return false;
  const bold = strip([...pHtml.matchAll(/<strong[^>]*>([\s\S]*?)<\/strong>/g)].map((m) => m[1]).join(' '));
  return bold.length >= 0.85 * txt.length;
}

const QM = /¿?Qu[eé] m[aá]s debes saber/i;

// Industry Shots (and Industry Shots | Players): a "Para iniciar conversación"
// block of full news items, then a "¿Qué más debes saber?" list of quick hits,
// then — on the Players editions — the interview, whose bullets are questions
// rather than news and must not be counted.
function digestItems(post) {
  const html = bodyHtml(post);
  const parts = html.split(QM);
  const head = parts[0];
  let tail = parts[1] || '';
  tail = tail.split(/<h[1-6][^>]*>(?:(?!<\/h)[\s\S])*?Players(?:(?!<\/h)[\s\S])*?<\/h[1-6]>/i)[0];

  const news = [];
  for (const li of head.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) {
    const ps = [...li[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
    if (ps.length >= 2 && isBoldOnly(ps[0])) {
      const h = strip(ps[0]);
      if (h.length > 5 && h.length < 160) news.push(h);
    }
  }
  const quick = [...tail.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)]
    .map((m) => strip(m[1]))
    .filter((q) => q.length > 5 && q.length < 200);
  return { news, quick };
}

const normalize = (s) =>
  (s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

// Infinitas uses <h> headings rather than bullets: a run of short news items,
// then the deep dive whose own heading repeats the post title. When the title
// isn't reused as a heading, fall back to "short sections are news items".
function infinitasItems(post) {
  const html = bodyHtml(post);
  const chunks = html.split(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/);
  const secs = [];
  for (let i = 1; i < chunks.length; i += 2) {
    const h = strip(chunks[i]);
    if (!h || /^(Encuesta|Compartir|Suscr[ií]bete)/i.test(h)) continue;
    secs.push({ h, len: strip(chunks[i + 1] || '').length });
  }
  const all = secs.map((s) => s.h);
  const nt = normalize(post.title);
  const idx = all.findIndex((h) => normalize(h) && (normalize(h).includes(nt) || nt.includes(normalize(h))));

  let news;
  if (idx >= 1 && idx <= 8) {
    news = all.slice(0, idx);
  } else {
    news = [];
    for (const s of secs) {
      if (s.len < 520 && s.h.length < 150) news.push(s.h);
      else break;
    }
    news = news.slice(0, 8);
  }
  return { news, deepDive: secs.length > news.length };
}

// --------------------------------------------------------- classification

function seriesOf(post, pub) {
  const t = (post.title || '').toLowerCase();
  if (t.includes('voces infinitas')) return 'Voces Infinitas';
  if (pub === 'soninfinitas') return 'Infinitas';
  if (t.includes('industry shots') && t.includes('player')) return 'Industry Shots | Players';
  if (t.includes('industry shots')) return 'Industry Shots';
  if (/f[uú]tbol business|football business/.test(t)) return 'The Futbol Business Review';
  if (t.includes('infinitas')) return 'Infinitas';
  if (t.includes('la lana')) return 'La Lana';
  if (t.includes('weekly playbook') || t.includes('playbook semanal')) return 'Weekly Playbook / Semanal';
  if (t.includes('off the field')) return 'Off the Field';
  if (t.includes('player de la semana')) return 'Player de la Semana';
  if (/sin m[aá]scaras/.test(t)) return 'Sin Máscaras';
  if (t.includes('beyond bounds')) return 'Beyond Bounds Arena';
  if (t.includes('playbook news')) return 'Playbook News';
  if (/\bgarra\b/.test(t)) return 'Garra (podcast)';
  if (t.includes('apellidos del deporte')) return 'Los Apellidos del Deporte';
  return 'Ensayo / one-off';
}

// Launch notes and event invites that carry no article. Several real editions
// also wear an announcement in the title ("Infinitas / ¡Nuevo Lanzamiento!",
// "Nueva sección / ¿Quién es el verdadero beneficiado...?"), so the title alone
// is not enough — a post only counts as housekeeping when it is short and has
// no digest items behind the announcement.
const ANNOUNCEMENT =
  /coming soon|evolucionamos\.? nace|es hora de irnos conoci|te queremos invitar|tienes un asiento|welcome to the futbol business|desde vestidores evoluciona/i;

function isHousekeeping({ series, title, subtitle, words, items, quickHits }) {
  if (series === 'Garra (podcast)') return true; // show notes for an audio episode
  const announced = ANNOUNCEMENT.test(title) || ANNOUNCEMENT.test(subtitle);
  return announced && words < 800 && items.length === 0 && quickHits.length === 0;
}

const FOCUS = new Set([
  'The Futbol Business Review',
  'Infinitas',
  'Voces Infinitas',
  'Industry Shots',
  'Industry Shots | Players',
]);

// -------------------------------------------------------------------- main

async function main() {
  const sql = neon(process.env.POSTGRES_URL);
  const live = await sql`select id, title, date, source, substack_url, source_url from articles`;
  const covered = new Set();
  for (const row of live) {
    for (const u of [row.substack_url || '', row.source_url || '']) {
      const m = u.match(/\/p\/([a-z0-9-]+)/);
      if (m) covered.add(m[1]);
    }
  }

  const liveIds = new Set(live.map((r) => r.id));
  const entries = [];
  for (const pub of PUBS) {
    const list = await cached(`${pub}__archive`, () => archive(pub));
    for (const stub of list) {
      const post = await cached(`${pub}__${stub.slug}`, () =>
        getJSON(`https://${pub}.substack.com/api/v1/posts/${stub.slug}`),
      );
      const series = seriesOf(post, pub);
      const title = (post.title || '').trim();
      const subtitle = (post.subtitle || '').trim();
      const hs = headings(post);
      const deepDive = hs.some((h) => /deep dive/i.test(h));

      let kind = 'essay';
      let items = [];
      let quickHits = [];
      let estArticles = 1;

      if (series === 'Industry Shots' || series === 'Industry Shots | Players') {
        kind = 'digest';
        const { news, quick } = digestItems(post);
        items = news;
        quickHits = quick;
        // the Deep Dive essay, and on Players editions the interview, are each
        // their own article on top of the news items
        const extra = (deepDive ? 1 : 0) + (series === 'Industry Shots | Players' ? 1 : 0);
        estArticles = news.length + quick.length + extra || 1;
      } else if (series === 'Infinitas') {
        kind = 'digest';
        const { news, deepDive: dd } = infinitasItems(post);
        items = news;
        estArticles = news.length + (dd ? 1 : 0) || 1;
      }

      const housekeeping = isHousekeeping({
        series,
        title,
        subtitle,
        words: post.wordcount || 0,
        items,
        quickHits,
      });

      // Recent editions link each item back to its published article; when every
      // link resolves to a live row the edition is done, whatever its own
      // substack_url says (items usually store the third-party source instead).
      const backlinks = [
        ...new Set([...(post.body_html || '').matchAll(/playbook\.la\/articulo\?id=([a-z0-9-]+)/g)].map((m) => m[1])),
      ];
      const liveBacklinks = backlinks.filter((id) => liveIds.has(id));

      entries.push({
        pub,
        date: post.post_date.slice(0, 10),
        series,
        kind,
        title,
        subtitle,
        slug: post.slug,
        url: post.canonical_url,
        words: post.wordcount || 0,
        covered:
          covered.has(post.slug) ||
          (backlinks.length > 0 && liveBacklinks.length === backlinks.length && liveBacklinks.length >= estArticles - 3),
        backlinks: liveBacklinks.length,
        deepDive,
        items,
        quickHits,
        estArticles,
        housekeeping,
        tier: housekeeping ? 3 : FOCUS.has(series) ? 1 : 2,
        // week-of news loses its news value; the deep dives and essays don't
        perishable: kind === 'digest' && post.post_date.slice(0, 10) < '2026-01-01',
      });
    }
  }
  entries.sort((a, b) => b.date.localeCompare(a.date));

  await mkdir(path.join(ROOT, 'scripts', 'data'), { recursive: true });
  await writeFile(
    path.join(ROOT, 'scripts', 'data', 'substack-archive-backlog.json'),
    JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), liveArticles: live.length, entries }, null, 1),
  );

  await writeFile(path.join(ROOT, 'docs', 'SUBSTACK-ARCHIVE-BACKLOG.md'), render(entries, live));
  const pending = entries.filter((e) => !e.covered && !e.housekeeping);
  console.log(
    `posts ${entries.length} | live ${live.length} | pending posts ${pending.length} | est. articles ${pending.reduce((n, e) => n + e.estArticles, 0)}`,
  );
}

// ------------------------------------------------------------------ render

function render(entries, live) {
  const pending = entries.filter((e) => !e.covered && !e.housekeeping);
  const est = (list) => list.reduce((n, e) => n + e.estArticles, 0);
  const bySeries = new Map();
  for (const e of pending) {
    if (!bySeries.has(e.series)) bySeries.set(e.series, []);
    bySeries.get(e.series).push(e);
  }
  const ordered = [...bySeries.entries()].sort((a, b) => est(b[1]) - est(a[1]));
  const range = (list) => {
    const d = list.map((e) => e.date).sort();
    return `${d[0]} → ${d[d.length - 1]}`;
  };
  const liveDates = live.map((r) => r.date).sort();

  const L = [];
  L.push('# Backlog del archivo Substack → playbook.la');
  L.push('');
  L.push(`_Generado el ${new Date().toISOString().slice(0, 10)} por \`scripts/build-substack-backlog.mjs\`._`);
  L.push('');
  L.push('Inventario completo de todo lo publicado en las dos newsletters de Substack');
  L.push('(`playbookmedia.substack.com` y `soninfinitas.substack.com`) contrastado contra');
  L.push('lo que ya está vivo en la base de datos del portal. Todo lo que aparece abajo');
  L.push('**está en Substack y no está en el sitio**.');
  L.push('');
  L.push('## Resumen');
  L.push('');
  L.push('| | |');
  L.push('|---|---|');
  L.push(`| Ediciones en Substack | **${entries.length}** (${entries.filter((e) => e.pub === 'playbookmedia').length} Playbook Media, ${entries.filter((e) => e.pub === 'soninfinitas').length} Son Infinitas) |`);
  L.push(`| Rango del archivo | ${entries[entries.length - 1].date} → ${entries[0].date} |`);
  L.push(`| Artículos vivos hoy en playbook.la | ${live.length} (${liveDates[0]} → ${liveDates[liveDates.length - 1]}) |`);
  L.push(`| Ediciones ya procesadas | ${entries.filter((e) => e.covered).length} |`);
  L.push(`| Avisos / lanzamientos / podcast (sin artículo) | ${entries.filter((e) => e.housekeeping).length} |`);
  L.push(`| **Ediciones pendientes** | **${pending.length}** |`);
  L.push(`| **Artículos estimados por publicar** | **~${est(pending)}** |`);
  L.push('');
  L.push('### Dónde están los huecos');
  L.push('');
  const launch = liveDates[0];
  const preSite = pending.filter((e) => e.date < launch);
  const inWindow = entries.filter((e) => e.date >= launch && !e.housekeeping);
  const windowPending = inWindow.filter((e) => !e.covered);
  L.push(`**Archivo previo al portal (antes del ${launch}).** ${preSite.length} ediciones,`);
  L.push(`~${est(preSite)} artículos. Más de tres años y medio de newsletter que no existe`);
  L.push('en el sitio: es el grueso del backlog.');
  L.push('');
  L.push(`**Huecos dentro de la ventana ya cubierta (desde el ${launch}).** De las`);
  L.push(`${inWindow.length} ediciones publicadas desde entonces, ${inWindow.length - windowPending.length} ya se procesaron y`);
  L.push(`**${windowPending.length} siguen sin procesar** (~${est(windowPending)} artículos). Estas son las más`);
  L.push('urgentes: son noticia todavía vigente y rompen la continuidad del sitio.');
  L.push('');
  for (const e of windowPending.sort((a, b) => b.date.localeCompare(a.date))) {
    L.push(`- ${e.date} — ${e.series} — [${e.title || '(sin título)'}](${e.url}) — ~${e.estArticles} art.`);
  }
  L.push('');
  L.push('> Nota sobre la detección: una edición se marca como procesada cuando alguna');
  L.push('> fila de `articles` guarda su URL de Substack, o cuando todos los enlaces');
  L.push('> "(Acá más info)" de la edición apuntan a artículos que ya existen. Los ítems');
  L.push('> de Industry Shots suelen guardar la fuente original (ESPN, Reuters) en vez del');
  L.push('> Substack, así que alguna edición reciente podría estar más completa de lo que');
  L.push('> indica este conteo. Para el archivo previo al portal no hay ambigüedad: no hay');
  L.push('> ningún artículo vivo con fecha anterior al ' + launch + '.');
  L.push('');
  L.push('### Por serie');
  L.push('');
  L.push('| Serie | Prio | Ediciones | Artículos est. | Rango |');
  L.push('|---|---|---:|---:|---|');
  for (const [s, list] of ordered) {
    L.push(
      `| ${s.replace(/\|/g, '\\|')} | ${list[0].tier === 1 ? 'P1' : 'P2'} | ${list.length} | ~${est(list)} | ${range(list)} |`,
    );
  }
  L.push('');
  L.push('**P1** = las tres series que pediste priorizar (Futbol Business Review,');
  L.push('Infinitas, Industry Shots). **P2** = el resto del archivo, valioso pero');
  L.push('fuera del foco inmediato.');
  L.push('');
  L.push('### Cómo leer las estimaciones');
  L.push('');
  L.push('Industry Shots e Infinitas son **digests**: cada edición contiene varias');
  L.push('noticias que en el portal se publican como artículos separados. La estimación');
  L.push('cuenta, por edición:');
  L.push('');
  L.push('- Industry Shots → notas de "Para iniciar conversación" + "¿Qué más debes saber?" + el Deep Dive cuando existe.');
  L.push('- Industry Shots | Players → lo anterior + la entrevista de la sección Players.');
  L.push('- Infinitas → las notas breves de apertura + el análisis de fondo.');
  L.push('- Todo lo demás (ensayos, La Lana, Futbol Business Review, Voces Infinitas) → 1 artículo por edición.');
  L.push('');
  L.push('El desglose por edición viene con los titulares reales de cada nota, así que');
  L.push('no hay que abrir Substack para saber qué contiene cada una.');
  L.push('');
  L.push('### Contenido perecedero vs. permanente');
  L.push('');
  const per = pending.filter((e) => e.perishable);
  L.push(`${per.length} ediciones de digest son anteriores a 2026 (~${est(per)} artículos).`);
  L.push('Sus notas breves eran noticia de la semana y hoy sólo tienen valor de archivo;');
  L.push('los Deep Dives, entrevistas y análisis de esas mismas ediciones sí siguen');
  L.push('vigentes. Recomendación: de 2024–2025 recuperar el análisis y saltarse las');
  L.push('notas de coyuntura, salvo que se quiera el archivo completo por SEO.');
  L.push('');
  L.push('### Orden sugerido de ataque');
  L.push('');
  // disjoint batches, so the numbers add up rather than double-counting 2026
  const taken = new Set();
  const batch = (fn) => {
    const out = pending.filter((e) => !taken.has(e) && fn(e));
    for (const e of out) taken.add(e);
    return out;
  };
  const b1 = batch((e) => e.series === 'The Futbol Business Review');
  const b2 = batch((e) => e.series.includes('Infinitas') && e.date >= '2026-01-01');
  const b3 = batch((e) => e.series.startsWith('Industry Shots') && e.date >= '2026-01-01');
  const b4 = batch((e) => e.date >= '2026-01-01');
  const b5 = batch((e) => e.kind === 'essay');
  const b6 = batch(() => true);
  const infLive = live.filter((r) => r.source === 'infinitas').length;
  const rows = [
    ['Futbol Business Review completo', b1, 'Serie corta, en inglés, análisis puro: cero contenido perecedero y hoy no hay una sola pieza de ella en el sitio.'],
    ['Infinitas 2026', b2, `El vertical femenil tiene ${infLive} artículos vivos frente a un archivo de casi 90 ediciones.`],
    ['Industry Shots 2026', b3, `Cierra el hueco entre enero y el arranque del portal el ${liveDates[0]}.`],
    ['Resto de 2026', b4, 'La Lana y ensayos del año en curso: deja 2026 completo antes de bajar al archivo histórico.'],
    ['Ensayos y análisis 2023–2025', b5, 'Evergreen: siguen vigentes como contenido de fondo y como base de SEO.'],
    ['Digests 2024–2025', b6, 'Sólo si se quiere el archivo literal; la mayoría es noticia de coyuntura ya vencida.'],
  ];
  L.push('| # | Lote | Ediciones | Artículos est. | Por qué |');
  L.push('|---|---|---:|---:|---|');
  rows.forEach(([name, list, why], i) =>
    L.push(`| ${i + 1} | ${name} | ${list.length} | ~${est(list)} | ${why} |`),
  );
  L.push('');
  const first4 = [b1, b2, b3, b4].flat();
  L.push(
    `Los lotes 1 a 4 son disjuntos: ${first4.length} ediciones, ~${est(first4)} artículos, y dejan el sitio al día con todo 2026 más la serie en inglés.`,
  );
  L.push('');
  L.push('### Lo que se puede ignorar');
  L.push('');
  L.push('Estas ediciones no llevan artículo (avisos de lanzamiento, invitaciones a');
  L.push('eventos, episodios de podcast):');
  L.push('');
  for (const e of entries.filter((x) => x.housekeeping)) {
    L.push(`- ${e.date} — ${e.title || '(sin título)'} — [Substack](${e.url})`);
  }
  L.push('');
  L.push('---');
  L.push('');
  L.push('## Detalle por serie');

  for (const [s, list] of ordered) {
    L.push('');
    L.push(`### ${s}`);
    L.push('');
    L.push(`${list.length} ediciones pendientes · ~${est(list)} artículos · ${range(list)}`);
    L.push('');
    for (const e of list.sort((a, b) => b.date.localeCompare(a.date))) {
      const flags = [];
      if (e.perishable) flags.push('perecedero');
      if (e.deepDive) flags.push('Deep Dive');
      L.push(
        `- **${e.date}** — [${e.title || '(sin título)'}](${e.url}) — ~${e.estArticles} art.${flags.length ? ` _(${flags.join(', ')})_` : ''}`,
      );
      if (e.subtitle) L.push(`  - ${e.subtitle}`);
      for (const i of e.items) L.push(`  - ▸ ${i}`);
      for (const q of e.quickHits) L.push(`  - · ${q}`);
    }
  }
  L.push('');
  return L.join('\n');
}

main();
