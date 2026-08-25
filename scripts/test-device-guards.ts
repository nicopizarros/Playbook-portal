// Regression cases for the two scale bases and the device/lead-in boundary
// in lib/article-devices.ts.
//
// Added 2026-08-25 after the incoherence audit found a correct `Ecuación`
// shipping as a bare label: `magnitudeOf` is denominated in millions (a
// relative comparator) and `parseEquation`'s self-check was using it as an
// absolute evaluator, so any equation mixing a bare term with a scale-worded
// result was rejected as bad arithmetic and degraded to plain text.
//
// The lesson the cases are shaped around: a guard that FAILS CLOSED needs
// accept-case coverage as much as reject-case coverage. The old check had
// neither, so a silent false negative sat in production for a week.
//
//   npx tsx scripts/test-device-guards.ts
import { deviceFromParagraph } from '../lib/article-devices';

type Case = { text: string; render: boolean; why: string };

const CASES: Case[] = [
  // ——— Ecuación: must ACCEPT correct arithmetic across scale bases
  {
    text: 'Ecuación: 832 spots × US$300,000 por spot = US$249.6 millones',
    render: true,
    why: 'the live FIFA case: bare terms, scale-worded result, arithmetic correct',
  },
  { text: 'Ecuación: 832 spots × US$300,000 por spot = US$249.6 M', render: true, why: 'same, with the M spelling' },
  { text: 'Ecuación: 832 × 300,000 = 249,600,000', render: true, why: 'same equation with no scale words at all' },
  { text: 'Ecuación: 100 millones + 100 millones = 200 millones', render: true, why: 'all terms scaled' },
  { text: 'Ecuación: 2 mil millones / 4 mercados = 500 millones', render: true, why: 'mixed scale words, correct' },

  // ——— Ecuación: must still REJECT arithmetic that is actually wrong
  {
    text: 'Ecuación: 832 spots × US$300,000 por spot = US$500 millones',
    render: false,
    why: 'wrong by 2x — the self-check has to keep catching this',
  },
  { text: 'Ecuación: 100 millones + 100 millones = 500 millones', render: false, why: 'wrong, all scaled' },

  // ——— Duelo / Serie: a mixed scale basis draws a bar 1e6 out, so refuse it
  {
    text: 'Duelo: A vs B · Ingresos — US$300,000 vs US$1.7 millones',
    render: false,
    why: 'mixed basis: one bar would be 176,000x too long',
  },
  {
    text: 'Duelo: UEFA vs FIFA · Ingresos — €3,861 millones vs US$1,748 millones · Reservas — €600 millones vs US$4,000 millones',
    render: true,
    why: 'every row scaled — the normal case, must not regress',
  },
  {
    text: 'Duelo: A vs B · Partidos — 38 vs 34 · Sedes — 12 vs 9',
    render: true,
    why: 'bare counts under 1,000 are not amounts someone dropped a scale word from',
  },
  {
    text: 'Serie: UEFA vs FIFA · 2022 — €4,052 millones vs US$5,769 millones · 2023 — €4,321 millones vs US$1,170 millones · 2024 — €4,600 millones vs US$1,300 millones',
    render: true,
    why: 'the live Serie — every point scaled',
  },

  // ——— A bold prose lead-in is not a device declaration, even when its
  //     sentence is item-shaped. The archive's real collisions are
  //     `**El calendario:**` and `**El perfil:**`.
  {
    text: '**El calendario:** Las federaciones tienen hasta el 19 de septiembre — y luego vota el Congreso',
    render: false,
    why: 'bold label + prose outside it is a lead-in, however item-shaped the sentence',
  },
  {
    text: '**El perfil:** Iturbide entró como becario — y ascendió · hasta la presidencia',
    render: false,
    why: 'same collision, with separators that would otherwise parse',
  },
  {
    text: 'Calendario: 19 sep 2026 — Congreso de la FIFA · 18 mar 2027 — Elección presidencial',
    render: true,
    why: 'the plain-paragraph declaration every real device uses must still render',
  },
  {
    text: 'Perfil: Victor Montagliani · Cargo — Presidente de Concacaf · Desde — 2016',
    render: true,
    why: 'the live Perfil — must not be caught by the lead-in guard',
  },
];

let failed = 0;
for (const c of CASES) {
  const got = deviceFromParagraph(c.text) !== null;
  const ok = got === c.render;
  if (!ok) failed++;
  console.log(
    `${ok ? '  ok  ' : 'FAIL  '}${c.render ? 'renders' : 'refuses'}  ${c.why}\n        ${c.text.slice(0, 96)}`,
  );
}
console.log(`\n${CASES.length - failed}/${CASES.length} device cases pass`);
process.exit(failed ? 1 : 0);
