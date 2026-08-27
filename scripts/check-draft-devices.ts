// Asserts every device declaration in a draft actually RENDERS.
//
// Devices fail loud but late: a malformed declaration ships as visible plain
// text on the live page, which is a mistake a reader sees. The publish path
// does not check, because devices are a render-time transform — so this is
// the check that belongs before publishing, not after.
//
// It also reports the per-article budget against the number of declarations,
// since an over-budget device degrades to plain text exactly the same way a
// malformed one does.
//
//   npx tsx scripts/check-draft-devices.ts <draft.json>
import { readFileSync } from 'node:fs';
import { deviceFromParagraph, deviceBudgetFor } from '../lib/article-devices';

// Every device prefix, so a paragraph that LOOKS like a declaration but does
// not parse is reported rather than silently passing as prose.
const PREFIXES =
  /^\s*(?:La\s+|El\s+|Los\s+)?(Cifra clave|Jugada|Cronolog[íi]a|Recibo|Ecuaci[óo]n|Salto|Reparto|Alineaci[óo]n|Cotizaci[óo]n|Resultados|Duelo|Serie|Mapa|Venta|Cadena|Contrato|Calendario|Votaci[óo]n|Ranking|Cascada|Perfil|Escenarios|Tablero|Pir[áa]mide|Control|Alcance|Condiciones|Precedentes|Contraste)\s*:/i;

const path = process.argv[2];
if (!path) {
  console.error('uso: npx tsx scripts/check-draft-devices.ts <draft.json>');
  process.exit(1);
}

const raw = JSON.parse(readFileSync(path, 'utf8'));
const articles = Array.isArray(raw) ? raw : [raw];

let failures = 0;

for (const a of articles) {
  const budget = deviceBudgetFor(a.readingTime ?? null, a.priority ?? null);
  const paragraphs: string[] = String(a.bodyMarkdown || '').split(/\n\n+/);
  const declared: { text: string; ok: boolean; name: string | null }[] = [];

  for (const p of paragraphs) {
    const t = p.trim();
    // A bold prose lead-in is not a declaration (voice-and-style.md §5).
    if (/^\*\*/.test(t)) continue;
    if (!PREFIXES.test(t)) continue;
    const d = deviceFromParagraph(t);
    declared.push({ text: t, ok: !!d, name: d?.name ?? null });
  }

  console.log(`\n── ${a.title}`);
  console.log(`   readingTime ${a.readingTime} · priority ${a.priority} → presupuesto ${budget} device(s)`);

  if (!declared.length) {
    console.log('   sin devices declarados');
    continue;
  }

  const names = new Set<string>();
  declared.forEach((d, i) => {
    const overBudget = i >= budget;
    const repeat = d.name ? names.has(d.name) : false;
    if (d.name) names.add(d.name);
    const bad = !d.ok || overBudget || repeat;
    if (bad) failures++;
    const flag = !d.ok
      ? 'NO PARSEA → saldría como texto plano'
      : overBudget
        ? 'FUERA DE PRESUPUESTO → saldría como texto plano'
        : repeat
          ? 'TIPO REPETIDO → saldría como texto plano'
          : `ok (${d.name})`;
    console.log(`   ${bad ? 'FALLA' : '  ok '}  ${flag}`);
    console.log(`          ${d.text.slice(0, 108)}`);
  });
}

console.log(
  failures ? `\n${failures} declaración(es) NO renderizarían. Corrige antes de publicar.` : '\nTodas las declaraciones renderizan dentro de presupuesto.',
);
process.exit(failures ? 1 : 0);
