// One-off verification: does scoreFromBoleta(), as it stands in lib/rank.ts,
// reproduce the spec's own eight worked examples (docs/jerarquia-editorial-playbook.html,
// "Un día completo" table) from the stored answers in scripts/data/rank-boletas.json?
import { readFileSync } from 'node:fs';
import { scoreFromBoleta, type Boleta } from '../lib/rank';

const EXPECTED: Record<string, number> = {
  'kevin-lamour-sale-de-la-fifa-17-dias-despues-de-criticar-a-infantino': 87,
  'fox-sports-mexico-pierde-a-izzi-y-sky-y-tambien-el-nombre': 85,
  'jeanie-buss-impugna-la-venta-del-17-8-de-los-lakers': 73,
  'mlb-aprueba-la-venta-de-los-padres-a-jose-feliciano-en-us-3-900-millones-record-de-la-liga': 67,
  'mexico-asegura-su-lugar-en-la28-tras-ganar-el-bronce-del-mundial-de-flag-football': 55,
  'mark-walter-y-boehly-negocian-venderle-a-clearlake-su-parte-del-chelsea': 53,
  'liv-golf-cancela-su-ultima-fecha-y-acumula-proveedores-sin-cobrar': 45,
  'oceania-apoya-a-infantino-y-nueva-zelanda-rompe-filas': 33,
};

const boletas: (Boleta & { id: string })[] = JSON.parse(
  readFileSync(new URL('./data/rank-boletas.json', import.meta.url), 'utf8'),
);

let mismatches = 0;
for (const id of Object.keys(EXPECTED)) {
  const b = boletas.find(x => x.id === id);
  if (!b) {
    console.log(`MISSING: ${id}`);
    continue;
  }
  const result = scoreFromBoleta(b);
  const expected = EXPECTED[id];
  const ok = result.score === expected;
  if (!ok) mismatches++;
  console.log(
    `${ok ? 'OK  ' : 'DIFF'} ${id.slice(0, 55).padEnd(55)} expected=${expected} got=${result.score} (decena=${result.decena} unit=${result.unit})`,
  );
}
console.log(`\n${8 - mismatches}/8 exact, ${mismatches} mismatched.`);
