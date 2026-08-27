// Archive safety net for ADDING a device to lib/article-devices.ts.
//
// Devices are a RENDER-time transform (format-tiers.md §6): the body stored
// in the database is plain prose, and `applyBodyDevices` rewrites matching
// paragraphs every time a page is served. That is the feature — a new device
// applies to the whole back catalog with no re-editing — and it is also the
// hazard, because a new PREFIX is a new claim over every paragraph that has
// ever started with that word.
//
// `Alcance:`, `Control:` and `Contraste:` are ordinary Spanish nouns. A
// device named for one of them can silently turn a four-year-old sentence
// into a chart, and nothing in the publish path would catch it: the row is
// untouched, the change appears only in the rendered page.
//
// So: re-render every published article with the CURRENT device table and
// assert that no newly-added device fires anywhere in the archive. Run it
// after adding or renaming any device.
//
//   POSTGRES_URL=... npx tsx scripts/test-device-archive-safety.ts
//
// The guarded list is the device CSS class stems, not the prefixes, because
// what matters is whether markup was emitted, not whether a regex matched.
import { neon } from '@neondatabase/serverless';
import { applyBodyDevices } from '../lib/article-devices';

// Device class stems introduced after the archive was written. Extend this
// when adding a device; leave older ones off (they are already live in the
// catalog on purpose).
const NEW_DEVICE_CLASSES = ['lect-control', 'lect-alcance', 'lect-cond-', 'lect-prec-', 'lect-contraste'];

async function main() {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    console.error('POSTGRES_URL no está definido.');
    process.exit(1);
  }
  const sql = neon(url);
  const rows = (await sql`
    SELECT id, reading_time, priority, date, body_html
    FROM articles WHERE status = 'published'
  `) as { id: string; reading_time: number | null; priority: number | null; date: unknown; body_html: string | null }[];

  const offenders: { id: string; cls: string }[] = [];
  let rerendered = 0;

  for (const row of rows) {
    const before = row.body_html || '';
    if (!before) continue;
    const after = applyBodyDevices(before, row.reading_time, row.priority, {
      articleDate: String(row.date).slice(0, 10),
    });
    if (before !== after) rerendered++;
    for (const cls of NEW_DEVICE_CLASSES) {
      if (after.includes(cls)) offenders.push({ id: row.id, cls });
    }
  }

  console.log(`${rows.length} artículos publicados re-renderizados.`);
  console.log(`${rerendered} cambian su HTML — los que ya declaraban devices existentes.`);

  if (offenders.length) {
    console.log(`\nFAIL: un device NUEVO se activó sobre prosa ya publicada:`);
    for (const o of offenders) console.log(`  ${o.id} → ${o.cls}`);
    console.log(`\nUn prefijo nuevo capturó texto viejo. Renombra el device o endurece su parser.`);
    process.exit(1);
  }

  console.log(`\nok: ninguno de los ${NEW_DEVICE_CLASSES.length} devices nuevos se activa sobre el archivo.`);
}

main();
