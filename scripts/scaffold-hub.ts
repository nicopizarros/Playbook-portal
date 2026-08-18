// Scaffold a new coverage hub from config alone.
//
// THIS SCRIPT IS THE ABSTRACTION TEST. If adding a hub ever needs more
// than what this writes — a config file, a token file, an asset folder and
// two registrations — then lib/hubs/ has failed its contract and the fix
// is to generalise the shared code, NOT to hand-write the new hub.
//
//   npx tsx scripts/scaffold-hub.ts <slug> "<Name>" "<Full name>"
//
// Writes:
//   lib/hubs/<slug>.ts              config (typed; won't compile if wrong)
//   styles/hubs/<slug>.tokens.css   palette, scoped to [data-hub="<slug>"]
//   public/hubs/<slug>/             asset folder (logo slot, .gitkeep)
// Registers:
//   lib/hubs/index.ts               import + HUBS entry
//   app/layout.tsx                  the token stylesheet import
//   lib/taxonomy.ts                 PROPERTY_OPTIONS vocabulary entry
//
// It deliberately does NOT invent facts. The generated config ships with
// EMPTY commercialState/plazas/season and no chain: a hub's numbers have
// to come from sourced reporting, and a scaffold that pre-filled them with
// plausible placeholders would be manufacturing provenance.
import fs from 'node:fs';
import path from 'node:path';

const [slug, name, fullName] = process.argv.slice(2);
if (!slug || !name) {
  console.error('Uso: npx tsx scripts/scaffold-hub.ts <slug> "<Nombre>" "<Nombre completo>"');
  process.exit(1);
}
if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error(`Slug inválido: "${slug}". Solo minúsculas, números y guiones (va en la URL).`);
  process.exit(1);
}

const root = process.cwd();
const configPath = path.join(root, 'lib/hubs', `${slug}.ts`);
if (fs.existsSync(configPath)) {
  console.error(`Ya existe lib/hubs/${slug}.ts — nada que hacer.`);
  process.exit(1);
}
const CONST = slug.toUpperCase().replace(/-/g, '_');

fs.writeFileSync(configPath, `import type { Hub } from './types';

// ${name} — hub scaffolded by scripts/scaffold-hub.ts.
//
// Every factual field is EMPTY on purpose. Fill them only from sourced
// reporting: HubFigure cannot be constructed without a HubSource, so an
// unsourced number is a compile error rather than a review catch. A figure
// whose source has no public URL renders with a visible "sin cita pública"
// marker — that is the honest state, not a bug to hide.
export const ${CONST}_HUB: Hub = {
  slug: '${slug}',
  name: ${JSON.stringify(name)},
  // Starts UNLISTED: the route works, but nothing advertises it until a
  // human flips this. Never scaffold straight into the nav.
  listed: false,
  fullName: ${JSON.stringify(fullName || name)},
  thesis: 'PENDIENTE: en una frase, por qué esta propiedad merece un destino permanente.',
  description: 'PENDIENTE: descripción SEO, una o dos frases.',

  identity: {
    tokens: '${slug}',
    wordmark: ${JSON.stringify(name)},
    // Nominative-reference slot. Leave commented until rights are
    // confirmed — the wordmark above always renders, so the masthead
    // degrades to type rather than to a hole.
    // logo: { src: '/hubs/${slug}/lockup.svg', alt: ${JSON.stringify(name)}, width: 96, height: 96 },
  },

  tag: '${CONST}',
  relatedSources: [],
  backfillTerms: [${JSON.stringify(name)}],

  // Sin cifras todavía: 'La Cadena' solo se dibuja con un valor actual Y
  // una meta, ambos con fuente. Sin eso, el módulo no existe.
  commercialState: [],
  plazas: [],
  season: [],

  sponsor: {
    kicker: 'Presentado por',
    pitch: 'PENDIENTE: qué acompaña este espacio y ante qué audiencia.',
    contactUrl: '/#contacto',
  },

  emptyState: {
    heading: 'La cobertura empieza aquí',
    body: 'Todavía no publicamos una pieza etiquetada como ${name}. Esta página ya está lista para recibirlas.',
  },
};
`);

fs.writeFileSync(path.join(root, 'styles/hubs', `${slug}.tokens.css`), `/* ${name} — hub token file.  ONE FILE PER HUB.
   styles/hubs/hub.css owns structure and speaks only in --hub-*; this is
   the only place a palette value for this hub appears.

   PENDIENTE: replace the placeholder values below with a palette grounded
   in THIS property's material world. Do not reuse another hub's. Read the
   anti-pattern list in the hub-builder skill before choosing:
   no cream+serif+terracotta, no near-black+one-acid-accent, and never a
   tint washing the reading surface — the plane is capped at the signature
   module and the table header. */

[data-hub='${slug}'] {
  --hub-plane: #23262B;
  --hub-plane-edge: #34383F;
  --hub-chalk: #F2F0EA;
  --hub-accent: #E8590C;
  /* Text-on-paper variant. A colour that works as a 3px marker on the dark
     plane fails WCAG AA as 11px type on the paper surface — keep the two
     separate and never swap them. */
  --hub-accent-ink: #B8430A;
  --hub-hash: #8C9098;
  --hub-grid: rgba(242, 240, 234, 0.13);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) [data-hub='${slug}'] {
    --hub-plane: #2A2E34;
    --hub-plane-edge: #3C424A;
    --hub-accent: #FF7A2F;
    --hub-accent-ink: #FF9455;
    --hub-hash: #9AA0A9;
    --hub-grid: rgba(242, 240, 234, 0.15);
  }
}

[data-theme='dark'] [data-hub='${slug}'] {
  --hub-plane: #2A2E34;
  --hub-plane-edge: #3C424A;
  --hub-accent: #FF7A2F;
  --hub-accent-ink: #FF9455;
  --hub-hash: #9AA0A9;
  --hub-grid: rgba(242, 240, 234, 0.15);
}
`);

fs.mkdirSync(path.join(root, 'public/hubs', slug), { recursive: true });
fs.writeFileSync(path.join(root, 'public/hubs', slug, '.gitkeep'), '');

// ---- registrations (three one-line edits, done here so they can't be forgotten)
// `marker` is what proves the registration ALREADY happened, and it must
// be unique to the NEW content. An earlier version guarded on the first
// line of `replace` — which is the anchor itself, already present by
// definition — so the import registration silently no-op'd and the build
// broke on an undefined symbol. Caught by the abstraction test, which is
// exactly what that test is for.
function patch(file: string, find: string, replace: string, marker: string) {
  const p = path.join(root, file);
  const s = fs.readFileSync(p, 'utf8');
  if (s.includes(marker)) return;
  if (!s.includes(find)) throw new Error(`No pude registrar en ${file}: no encontré el ancla.`);
  fs.writeFileSync(p, s.replace(find, replace));
}

patch(
  'lib/hubs/index.ts',
  "import { LFA_HUB } from './lfa';",
  `import { LFA_HUB } from './lfa';\nimport { ${CONST}_HUB } from './${slug}';`,
  `import { ${CONST}_HUB } from './${slug}';`,
);
patch(
  'lib/hubs/index.ts',
  'export const HUBS: Hub[] = [LFA_HUB',
  `export const HUBS: Hub[] = [LFA_HUB, ${CONST}_HUB`,
  `, ${CONST}_HUB`,
);
patch(
  'app/layout.tsx',
  "import '../styles/hubs/lfa.tokens.css';",
  `import '../styles/hubs/lfa.tokens.css';\nimport '../styles/hubs/${slug}.tokens.css';`,
  `styles/hubs/${slug}.tokens.css`,
);
patch(
  'lib/taxonomy.ts',
  "export const PROPERTY_OPTIONS = ['LFA'",
  `export const PROPERTY_OPTIONS = ['LFA', '${CONST}'`,
  `'${CONST}'`,
);

console.log(`\n✓ Hub "${slug}" scaffolded.

  lib/hubs/${slug}.ts
  styles/hubs/${slug}.tokens.css
  public/hubs/${slug}/
  registrado en lib/hubs/index.ts, app/layout.tsx y lib/taxonomy.ts

Ruta lista: /coberturas/${slug}

Siguiente (el scaffold NO lo hace, a propósito):
  1. Llena thesis/description y el token file con una paleta propia.
  2. Agrega cifras SOLO con fuente. Sin fuente no compila.
  3. Corre la regla de frontera y el backfill:
       npx tsx scripts/backfill-hub-tags.ts ${slug}
  4. Documenta la regla de frontera del tag en
     .claude/playbook-editorial/fields-and-taxonomy.md
`);
