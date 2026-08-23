// ————————————————————————————————————————————————————————— El Mapa
// Authoring convention (2026-08-10): a paragraph that reads
//
//   Mapa: Concacaf · En el comunicado — resto · Sin firmar — MEX
//
// renders as a map — the frame's countries drawn as real geography, split
// into labelled groups, with a legend that counts each group for itself.
//
// Built deliberately as a GENERAL device rather than one illustration.
// The geometry behind it is the whole world (lib/data/world-map.json, see
// scripts/build-world-map.ts), so any story that divides a set of
// countries into camps can draw itself: who signed and who did not, who
// hosts and who bid, which markets a rights deal covers, where a league is
// broadcast. The first item picks the frame (what gets drawn and where the
// map is centred), every item after it is a group.
//
//   Frame:   mundo · concacaf · conmebol · uefa · ofc · caf · afc ·
//            europa · áfrica · asia · oceanía · norteamérica ·
//            sudamérica · auto
//            ("auto" frames exactly the countries the groups name, which
//            is what to use for a set that is not one of the above.)
//            An optional PALETTE follows the frame: `Mapa: mundo bandos`.
//   Groups:  "Etiqueta — MEX, USA, CAN" with ISO3 codes, or a
//            confederation name that expands to its federations
//            ("Respaldan — CAF, CONMEBOL, OFC"), or "Etiqueta — resto"
//            for every framed country no other group claimed. One to
//            FIVE groups.
//
// A group may name a confederation because that is the unit a governance
// story actually splits on, and spelling one out is 41 to 55 ISO3 codes
// in a paragraph. Two rules make the expansion trustworthy:
//
//   1. A confederation named in a GROUP expands to its FIFA MEMBERS, not
//      its full roster. The six confederations have 218 members between
//      them and FIFA has 211: nine associations play in a confederation
//      without holding a FIFA seat. A legend counting an electorate has
//      to count votes, so those nine are dropped here, along with any
//      member whose vote is suspended. Framing is untouched — `Mapa:
//      concacaf` still draws all 41, because drawing a region should
//      show the whole region.
//   2. A country named EXPLICITLY in any group outranks the same country
//      arriving via its confederation, whatever the group order. That is
//      what lets "the bloc, minus the one that broke ranks" be written
//      as two groups without the defector being counted twice.
//
// Frame names win over ISO3 codes inside a group. Exactly one collision
// exists in the whole vocabulary: CAF is both the confederation and the
// Central African Republic. In a group it means the confederation; the
// country is still drawn by the `caf`, `áfrica` and `mundo` frames and
// by any `resto` group, which is the only way it has ever come up.
//
// The groups render in a fixed visual order that encodes the most common
// shape of these stories: the FIRST group is the filled mass, the SECOND
// is hollow with a heavy outline (the exception, the holdout, the one that
// is missing — it NEEDS that outline, its fill is transparent and would
// vanish into the background without one), the third is a mid tint. So
// "everyone except X" is written as `Grupo — resto · X — MEX`, and X reads
// as the hole in the map.
//
// A FOURTH group (2026-08-15) takes the accent side. At four groups the
// ramp reads as two variables rather than an order: the fill hue says
// which side, group 4's TEXTURE says the country spoke in its own name
// instead of inheriting its bloc's position. So g1 and g3 are the two
// silent masses, g2 is whoever broke away from their own side, and g4 is
// whoever said it out loud on the same side. Declare them in that order
// and the map explains itself.
//
// g4's texture (2026-08-23, was a heavy black outline over g1's own fill
// until a design review): a diagonal hatch of the SAME hue, not a border.
// A reader has to decode a stroke weight against every other border on the
// map; a solid-vs-hatched fill reads before the legend is even glanced at.
// See the `bandos` palette below, which carries the identical fix for its
// two hatch-eligible groups and is the fuller writeup of why.
//
// Countries too small to draw at this scale (half of Concacaf is Caribbean
// islands) are dots rather than shapes — see the build script's comment.
// Same contract as every other device: plain text, parsed server-side,
// null when malformed so the paragraph stays readable prose.

import world from './data/world-map.json';
// Shared with the other device modules — see lib/html-entities.ts for the
// decode-then-escape contract this module now follows.
import { escapeHtml as esc, decodeEntities } from './html-entities';

type CountryEntry = { n: string; c: [number, number]; p?: number[][][]; r?: string };
const COUNTRIES = world.countries as unknown as Record<string, CountryEntry>;
const FRAMES = world.frames as unknown as Record<string, string[]>;
// The nine confederation members FIFA has not admitted, plus any member
// whose vote is currently suspended (scripts/build-world-map.ts). Both
// mean the same thing to a map of an electorate: drawn, never counted.
const NO_VOTE = new Set([
  ...((world as { nonFifa?: string[] }).nonFifa || []),
  ...((world as { suspended?: string[] }).suspended || []),
]);
// The frames that are electorates rather than geography: only these get
// filtered to FIFA membership when a group names one.
const CONFEDERATIONS = new Set(['concacaf', 'conmebol', 'uefa', 'ofc', 'caf', 'afc']);

// Spanish (and a couple of English) names for the frames, mapped onto the
// dataset's own keys. Continent keys come from Natural Earth, so they are
// English; nobody authoring in Spanish should have to know that.
const FRAME_ALIASES: Record<string, string[]> = {
  mundo: ['mundo'],
  world: ['mundo'],
  global: ['mundo'],
  concacaf: ['concacaf'],
  conmebol: ['conmebol'],
  uefa: ['uefa'],
  ofc: ['ofc'],
  caf: ['caf'],
  afc: ['afc'],
  oceania: ['oceania'],
  europa: ['europe'],
  europe: ['europe'],
  africa: ['africa'],
  asia: ['asia'],
  norteamerica: ['north america'],
  'america del norte': ['north america'],
  sudamerica: ['south america'],
  'america del sur': ['south america'],
  latinoamerica: ['south america', 'north america'],
  america: ['north america', 'south america'],
};

export type MapGroup = { label: string; codes: string[] };
export type ArticleMap = {
  frame: string;
  groups: MapGroup[];
  codes: string[];
  palette: Palette;
  headline: string | null;
  subhead: string | null;
};

// ————————————————————————————————————————————————————————— Palettes
// The default ramp is one hue: the product accent, its tint, and a hollow
// outline for the exception. That is right for "who signed and who did
// not", where one camp is the subject and the other is its absence.
//
// It is wrong for a map of two camps that are equally the story. A single
// hue makes one side look like a weaker version of the other, and on a
// Noticias article the accent is Playbook's green, which reads as the
// affirmative wherever it lands. `bandos` (2026-08-15) answers that with
// two opposed hues, the house green against the Noticias blue, plus a
// neutral for whoever has not chosen. Both hues are theme-adaptive
// tokens, so the contrast survives the dark theme.
//
// Declared on the frame item, after the frame name: `Mapa: mundo bandos`.
// Opt-in on purpose — every published map keeps the ramp it shipped with.
export type Palette = 'default' | 'bandos';
const PALETTES = new Set<Palette>(['default', 'bandos']);

// Raised from 3 on 2026-08-15. Three groups cover a story with two camps
// and an outlier. A fourth is what a story needs when the SAME split has
// to be shown twice, once for the bloc and once for whoever inside it
// spoke in their own name; a fifth carries the ones who have not chosen,
// which is a real camp on any map of an election in progress and reads as
// nothing at all if it is left to the unclaimed base tint.
const MAX_GROUPS = 5;

// Accent-insensitive key for frame lookup: "áfrica" and "africa" are the
// same frame, and an editor should not have to think about it.
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function codesFrom(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map(code => code.trim().toUpperCase())
    .filter(code => /^[A-Z]{3}$/.test(code));
}

// A group's countries, split by how they got there: `named` is what the
// editor wrote as an ISO3 code, `viaFrame` is what a confederation
// expanded into. Keeping them apart is what lets an explicitly-named
// country be lifted out of its own confederation's group below.
type GroupCodes = { named: string[]; viaFrame: string[] };

function resolveGroupValue(raw: string): GroupCodes | null {
  const named: string[] = [];
  const viaFrame: string[] = [];
  // Split on separators only — a frame alias may contain a space
  // ("america del norte"), so whitespace cannot be a token boundary here.
  // codesFrom still splits on it, which keeps "MEX USA CAN" working.
  for (const token of raw.split(/[,;·]+/).map(part => part.trim()).filter(Boolean)) {
    const frameKeys = FRAME_ALIASES[fold(token)];
    if (frameKeys) {
      for (const key of frameKeys) {
        const isElectorate = CONFEDERATIONS.has(key);
        for (const code of FRAMES[key] || []) {
          if (isElectorate && NO_VOTE.has(code)) continue;
          if (COUNTRIES[code]) viaFrame.push(code);
        }
      }
      continue;
    }
    for (const code of codesFrom(token)) if (COUNTRIES[code]) named.push(code);
  }
  if (!named.length && !viaFrame.length) return null;
  return { named: [...new Set(named)], viaFrame: [...new Set(viaFrame)] };
}

const ITEM_SEP = /\s+·\s+/;
const KV_RE = /^(.*?)\s+[—–-]\s+([\s\S]+)$/;

export function parseMap(raw: string): ArticleMap | null {
  // Decode after tag-stripping (lib/html-entities.ts): captured body HTML
  // carries generateHTML's entities, and esc() below would double-escape
  // them into visible &amp;apos; in labels.
  const items = decodeEntities(raw.replace(/<[^>]+>/g, ''))
    .split(ITEM_SEP)
    .map(item => item.trim())
    .filter(Boolean);
  if (items.length < 2) return null;

  const [rawFrameItem, ...groupItems] = items;
  // Optional headline/subhead (2026-08-23): `frame palette | Headline | Bajada`.
  // Pipe rather than the item separator (·) so this stays entirely inside
  // the frame item — every group after it still parses exactly as before,
  // untouched by whether a headline is present. Both parts are optional and
  // independent (a headline with no subhead is fine), so an older map with
  // no `|` at all is unaffected: frameItem === rawFrameItem, headline and
  // subhead stay null, nothing renders where they would have gone.
  const [frameItem, rawHeadline, rawSubhead] = rawFrameItem.split('|').map(part => part.trim());
  const headline = rawHeadline || null;
  const subhead = rawSubhead || null;
  // The frame item may carry a palette name after the frame: "mundo bandos".
  // Only strip the last word when it actually names a palette, so a
  // multi-word frame ("america del norte") is untouched.
  const frameWords = fold(frameItem).split(/\s+/);
  const maybePalette = frameWords[frameWords.length - 1] as Palette;
  const palette: Palette = frameWords.length > 1 && PALETTES.has(maybePalette) ? maybePalette : 'default';
  const frameKey = palette === 'default' ? fold(frameItem) : frameWords.slice(0, -1).join(' ');
  const isAuto = frameKey === 'auto';
  const frameKeys = FRAME_ALIASES[frameKey];
  if (!isAuto && !frameKeys) return null;

  const groups: MapGroup[] = [];
  const resolved: (GroupCodes | null)[] = [];
  let restIndex = -1;
  for (const item of groupItems.slice(0, MAX_GROUPS)) {
    const kv = item.match(KV_RE);
    if (!kv) return null;
    const label = kv[1].trim();
    const value = kv[2].trim();
    if (!label) return null;
    if (fold(value) === 'resto') {
      // Two "resto" groups would each claim what the other left over;
      // there is no sensible reading, so the paragraph stays text.
      if (restIndex !== -1 || isAuto) return null;
      restIndex = groups.length;
      groups.push({ label, codes: [] });
      resolved.push(null);
      continue;
    }
    const parts = resolveGroupValue(value);
    if (!parts) return null;
    groups.push({ label, codes: [...parts.named, ...parts.viaFrame] });
    resolved.push(parts);
  }
  if (!groups.length) return null;

  // Rule 2 from the header: a country the editor named outright is not
  // also a member of whatever confederation another group expanded. New
  // Zealand written into "rompen filas" leaves the OFC's own count, so
  // the two legend numbers stay disjoint and still sum to the electorate.
  const namedAnywhere = new Set(resolved.flatMap(part => part?.named || []));
  for (let index = 0; index < groups.length; index++) {
    const parts = resolved[index];
    if (!parts) continue; // the "resto" group, filled in below
    const own = new Set(parts.named);
    const kept = parts.viaFrame.filter(code => own.has(code) || !namedAnywhere.has(code));
    groups[index].codes = [...new Set([...parts.named, ...kept])];
    // A confederation group emptied entirely by explicit names elsewhere
    // means the declaration contradicts itself; stay plain text.
    if (!groups[index].codes.length) return null;
  }

  const framed = isAuto
    ? [...new Set(groups.flatMap(group => group.codes))]
    : [...new Set(frameKeys!.flatMap(key => FRAMES[key] || []))];
  if (framed.length < 2) return null;

  if (restIndex !== -1) {
    const claimed = new Set(groups.flatMap(group => group.codes));
    groups[restIndex].codes = framed.filter(code => !claimed.has(code));
    if (!groups[restIndex].codes.length) return null;
  }

  // A group naming countries outside the frame would draw them off-canvas;
  // widening the frame to fit is the friendlier reading, and it is what
  // "auto" does anyway.
  const codes = [...new Set([...framed, ...groups.flatMap(group => group.codes)])];
  return { frame: isAuto ? 'auto' : frameKey, groups, codes, palette, headline, subhead };
}

// ————————————————————————————————————————————————————————— Projection
// Equirectangular with a standard parallel at the frame's mid-latitude:
// x = lon·cos(lat0), y = -lat. Simple, dependency-free, and honest at the
// scale of a single confederation, which is what this device is for. A
// world frame degenerates to plain plate carrée, the projection every
// reader has already seen on a wall.
const VIEW_W = 1000;
const MIN_H = 420;
const MAX_H = 760;
const PAD = 26;

type Projected = { x: number; y: number };

function projector(lat0: number, shift: boolean) {
  const k = Math.cos((lat0 * Math.PI) / 180) || 1;
  return ([lon, lat]: number[]): Projected => ({
    x: (shift && lon < 0 ? lon + 360 : lon) * k,
    y: -lat,
  });
}

// A frame that straddles the antimeridian (Oceania) has a raw longitude
// span of nearly 360° and would draw the entire planet to fit Fiji and
// Samoa in the same picture. Shifting negatives by +360 makes that frame
// contiguous.
//
// The shift is only correct for a frame clustered AROUND the antimeridian,
// and it is actively wrong for any other: it tears apart every country
// that straddles the prime meridian instead (the United Kingdom becomes a
// black bar across the whole canvas, measured), and it silently rotates a
// world map by 180°. Requiring the shifted span to fit inside a hemisphere
// rules both out — a frame that compact cannot also contain longitudes
// near zero, since those stay near zero under the shift.
function needsShift(lons: number[]): boolean {
  const span = (values: number[]) => Math.max(...values) - Math.min(...values);
  const shifted = span(lons.map(lon => (lon < 0 ? lon + 360 : lon)));
  return shifted < span(lons) && shifted <= 180;
}

function pointsOf(code: string): number[][] {
  const entry = COUNTRIES[code];
  if (!entry) return [];
  return entry.p ? entry.p.flat() : [entry.c];
}

function pathFor(rings: number[][][], project: (p: number[]) => Projected, sx: number, sy: number, ox: number, oy: number): string {
  return rings
    .map(ring => {
      const d = ring
        .map((point, i) => {
          const p = project(point);
          return `${i ? 'L' : 'M'}${(p.x * sx + ox).toFixed(1)} ${(p.y * sy + oy).toFixed(1)}`;
        })
        .join('');
      return `${d}Z`;
    })
    .join('');
}

export function buildMap(map: ArticleMap): string | null {
  const drawn = map.codes.filter(code => COUNTRIES[code]);
  if (drawn.length < 2) return null;

  const all = drawn.flatMap(pointsOf);
  if (!all.length) return null;
  const shift = needsShift(all.map(p => p[0]));
  const lats = all.map(p => p[1]);
  const lat0 = (Math.min(...lats) + Math.max(...lats)) / 2;
  const project = projector(lat0, shift);

  const projected = all.map(project);
  const minX = Math.min(...projected.map(p => p.x));
  const maxX = Math.max(...projected.map(p => p.x));
  const minY = Math.min(...projected.map(p => p.y));
  const maxY = Math.max(...projected.map(p => p.y));
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const height = Math.min(MAX_H, Math.max(MIN_H, ((VIEW_W - PAD * 2) * spanY) / spanX + PAD * 2));
  const scale = Math.min((VIEW_W - PAD * 2) / spanX, (height - PAD * 2) / spanY);
  const offsetX = (VIEW_W - spanX * scale) / 2 - minX * scale;
  const offsetY = (height - spanY * scale) / 2 - minY * scale;

  // Group index per country; anything framed but unclaimed renders as
  // context so the reader can see the whole region, not only the camps.
  const groupOf = new Map<string, number>();
  map.groups.forEach((group, index) => {
    for (const code of group.codes) if (!groupOf.has(code)) groupOf.set(code, index);
  });

  // Dots after shapes, and the marked groups after the unmarked ones, so a
  // highlighted island is never hidden under a neighbour's landmass.
  const ordered = drawn
    .slice()
    .sort((a, b) => (groupOf.get(a) ?? -1) - (groupOf.get(b) ?? -1));

  // bandos-only: "declared individually" needs to read as an EXCEPTION
  // inside its bloc, not a fifth category — 2026-08-23, publisher review
  // after the pattern-only version still read as "a country with a
  // different texture" rather than "a country that broke from its side."
  // g2/g4 add the OPPOSITE side's hue as a thin, clearly-visible outline
  // (navy on a green fill, green on a navy fill) on top of the hatch, so
  // fill=this country's own stance, outline=the stance its bloc actually
  // took. See styles/lectura.css for the colours themselves.
  const HALO_CLASSES = new Set(['lect-map-g2', 'lect-map-g4']);

  const shapes: string[] = [];
  const dots: string[] = [];
  for (const code of ordered) {
    const entry = COUNTRIES[code];
    const index = groupOf.get(code);
    const cls = index === undefined ? 'lect-map-base' : `lect-map-g${index + 1}`;
    const title = `<title>${esc(entry.n)}</title>`;
    const needsHalo = map.palette === 'bandos' && HALO_CLASSES.has(cls);
    if (entry.p) {
      const d = pathFor(entry.p, project, scale, scale, offsetX, offsetY);
      // A thin paper-coloured "halo" drawn first, wider than the colour
      // outline that follows, so a sliver of it still shows on the OUTSIDE
      // of that outline once the real shape's fill covers its inside —
      // that sliver is the fine white separator the outline needs to stay
      // legible against a same- or similar-toned neighbour. Same technique
      // election-result choropleths use to keep a highlighted region's
      // outline from fusing into whatever sits next to it.
      if (needsHalo) shapes.push(`<path class="lect-map-halo ${cls}" d="${d}" fill="none"></path>`);
      shapes.push(`<path class="lect-map-area ${cls}" d="${d}">${title}</path>`);
    } else {
      const p = project(entry.c);
      // r=4.2, down from 5.5 (2026-08-23, editorial-polish pass): island
      // and micro-state dots were reading with more visual weight than
      // full countries nearby, worst in the Caribbean and the Baltics/Gulf,
      // where several sit close enough to nearly touch at the old radius.
      dots.push(
        `<circle class="lect-map-dot ${cls}" cx="${(p.x * scale + offsetX).toFixed(1)}" cy="${(p.y * scale + offsetY).toFixed(1)}" r="4.2">${title}</circle>`,
      );
    }
  }

  // The counts tick up (2026-08-13): each camp's tally is the map's actual
  // finding ("11 sedes contra 3"), so it gets the same count-up treatment
  // as every other computed figure — data-lect-countup on a plain integer,
  // handled by the shared primitive with zero layout shift.
  const keyFor = (group: MapGroup, index: number) =>
    `<span class="lect-map-key lect-map-g${index + 1}">` +
    `<span class="lect-map-swatch" aria-hidden="true"></span>` +
    `<span class="lect-map-key-label">${esc(group.label)}</span>` +
    `<span class="lect-map-key-count" data-lect-countup>${group.codes.length}</span></span>`;

  // bandos legend (2026-08-23, editorial-polish pass): a flat run of five
  // keys reads as "five independent categories" when really there are two
  // questions — which side (colour: g1/g3 solid, g5 grey) and how it got
  // there (texture: g2/g4 hatched). The palette's own fixed declaration
  // order (1 bloc A, 2 declared A, 3 bloc B, 4 declared B, 5 undecided,
  // documented in the module header above) is exactly a colour/texture
  // alternation, so splitting on group INDEX PARITY — no new data, no
  // guessed label — recovers that structure: every solid slot (0, 2, 4 —
  // g1, g3, g5) under "POSTURA", every hatched slot (1, 3 — g2, g4) under
  // "CÓMO LO DECLARAN". Each group keeps its own author-written label and
  // exact count; nothing is merged or invented. Holds for any group count
  // from 2 to 5 since the alternation is positional, not tied to exactly
  // five groups being present. The default (non-bandos) ramp keeps the
  // single flat row: it doesn't share this colour/texture structure (g2 is
  // a hollow exception, not a hatched variant of g1).
  const legend =
    map.palette === 'bandos'
      ? (() => {
          const postura = map.groups.filter((_, i) => i % 2 === 0);
          const declaran = map.groups.filter((_, i) => i % 2 === 1);
          const posturaHtml = map.groups
            .map((g, i) => (i % 2 === 0 ? keyFor(g, i) : ''))
            .join('');
          const declPart = map.groups
            .map((g, i) => (i % 2 === 1 ? keyFor(g, i) : ''))
            .join('');
          return (
            (postura.length
              ? `<div class="lect-map-legend-group"><span class="lect-map-legend-kicker">Postura</span><div class="lect-map-legend-row">${posturaHtml}</div></div>`
              : '') +
            (declaran.length
              ? `<div class="lect-map-legend-group"><span class="lect-map-legend-kicker">Cómo lo declaran</span><div class="lect-map-legend-row">${declPart}</div></div>`
              : '')
          );
        })()
      : map.groups.map(keyFor).join('');

  const described = map.groups.map(group => `${group.label}: ${group.codes.length}`).join('. ');
  const headHtml = map.headline
    ? `<figcaption class="lect-map-head">${esc(map.headline)}</figcaption>`
    : '';
  const subHtml = map.subhead
    ? `<p class="lect-map-sub">${esc(map.subhead)}</p>`
    : '';

  // Diagonal-hatch defs (2026-08-23, publisher directive after a design
  // review of the bandos map): "declared in its own name" used to be a
  // heavy black outline over the SAME fill as its bloc, which read as
  // noise rather than signal at map scale. A reader shouldn't have to
  // decode a border weight; the Axios/Datawrapper convention this follows
  // instead is a solid colour for the bloc and that SAME colour hatched
  // (a pattern overlay) for whoever declared individually, so the base hue
  // still says "which side" at a glance and the texture is the only thing
  // that changes. Three patterns, one per hatch-eligible fill: the bandos
  // green side, the bandos blue side, and the single-hue default ramp's
  // own accent (whichever product's --lect-accent is active). Emitted
  // unconditionally, they cost nothing when a given map's groups never
  // reference them (an unused <pattern> in <defs> draws nothing).
  // Tile widened 7→10 and the line itself thinned/lowered in opacity in
  // CSS (2026-08-23, editorial-polish pass): a reader's first read should
  // be the solid colour, the hatch is confirmation on a second look, not a
  // competing signal — Datawrapper's own pattern-overlay guidance is to
  // keep the overlay light enough that it doesn't fight the base fill.
  const hatchDefs =
    `<defs>` +
    `<pattern id="lect-map-hatch-a" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">` +
    `<rect width="10" height="10" class="lect-map-hatch-bg-a"/><line x1="0" y1="0" x2="0" y2="10" class="lect-map-hatch-line-a"/>` +
    `</pattern>` +
    `<pattern id="lect-map-hatch-b" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">` +
    `<rect width="10" height="10" class="lect-map-hatch-bg-b"/><line x1="0" y1="0" x2="0" y2="10" class="lect-map-hatch-line-b"/>` +
    `</pattern>` +
    `<pattern id="lect-map-hatch-accent" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">` +
    `<rect width="10" height="10" class="lect-map-hatch-bg-accent"/><line x1="0" y1="0" x2="0" y2="10" class="lect-map-hatch-line-accent"/>` +
    `</pattern>` +
    `</defs>`;

  return (
    `<figure class="lect-device lect-map reveal"${map.palette === 'default' ? '' : ` data-palette="${esc(map.palette)}"`} role="group" aria-label="Mapa. ${esc(described)}">` +
    `<span class="lect-device-label">El mapa</span>` +
    headHtml +
    subHtml +
    `<svg class="lect-map-svg" viewBox="0 0 ${VIEW_W} ${height.toFixed(0)}" role="img" ` +
    `aria-label="${esc(described)}" preserveAspectRatio="xMidYMid meet">` +
    hatchDefs +
    `<g class="lect-map-shapes">${shapes.join('')}</g>` +
    // data-lect-stagger (2026-08-13): the city-state dots pop in sequence
    // (shared staggerIn primitive; gsap animates SVG children fine). The
    // landmasses deliberately don't move — terrain shifting reads as an
    // error, markers arriving reads as data.
    `<g class="lect-map-dots" data-lect-stagger>${dots.join('')}</g>` +
    `</svg>` +
    `<div class="lect-map-legend">${legend}</div>` +
    `</figure>`
  );
}
