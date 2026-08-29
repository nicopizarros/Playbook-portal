// The brand palette registry + the contrast guard that makes it safe to
// print an arbitrary club's colours on Playbook's paper.
//
// Every device before this one draws from --lect-accent: ONE curated colour
// per product, paired with a hand-picked --lect-ink-accent because the
// house green is unreadable as text (styles/lectura.css). That pairing was
// chosen by a person, once, for four products. `Venta` and `Cadena` can't
// work that way — the whole point of those two devices is that the asset
// changing hands wears its OWN colours, so the palette arrives from the
// story and nobody gets to eyeball it before it ships.
//
// Which means every colour has to survive four surfaces automatically:
//   fill  — a solid block (needs to be visible against the page)
//   on    — text printed ON that block (needs 4.5:1 against the fill)
//   ink   — the brand colour used as TEXT on paper (needs 4.5:1 vs paper)
//   alt   — the secondary, as a rule/underline (a graphic, so a lower bar)
// …in BOTH themes, which is why every value below is computed twice.
//
// Without this guard the failure is not subtle-but-tolerable, it is a
// shipped article nobody can read: Lakers gold (#FDB927) as text on cream
// paper is ~1.6:1, and Nets black as a fill on the dark theme's #121316 is
// invisible. Both are resolved here, at build time, by darkening or
// lightening along the same hue until the ratio passes.
//
// Containment is the other half of the contract. Nothing here writes
// --lect-accent. The device root gets its own --pb-brand-* properties and
// styles/lectura.css reads them with PLAYBOOK'S OWN palette as the
// fallback, so a story about a sale stays a Playbook page with one foreign
// object on it, and an unregistered asset degrades to the house green
// rather than to a blank — or, as it did until 2026-08-12, to whichever
// product accent happened to apply, which gave the same "no brand here"
// state three different looks across La Lana, Infinitas and TFBR.

export type BrandPalette = {
  name: string;
  primary: string;
  secondary: string;
};

// The two page grounds, straight from styles/tokens.css. Every ratio below
// is computed against one of these; if the tokens ever move, these move.
const PAPER_LIGHT = '#FAF8F5';
const PAPER_DARK = '#121316';

// WCAG AA for normal text. The `ink` and `on` roles are text and must clear
// it. `fill` and `alt` are graphics — a block and a 3px rule — so they use
// GRAPHIC_MIN, roughly WCAG's 3:1 non-text bar relaxed a little, because a
// large solid block reads at a lower ratio than a glyph does and forcing
// 3:1 on it would wash every dark navy in the registry to the same slate.
const TEXT_MIN = 4.5;
const GRAPHIC_MIN = 2.2;
// The `on` role has exactly one consumer — the Venta crest's wordmark,
// which styles/lectura.css sets at clamp(26px,4.4vw,40px) and never below
// 26px. That clears WCAG's large-text threshold at every viewport, so it
// takes the 3:1 large-text bar. This is not a relaxation of convenience:
// `on` can only ever be the page's near-black or white, so when a brand
// red sits between them (Arsenal's #EF0107 tops out at 4.49:1 against
// white) there is no better answer to pick, and holding it to 4.5 would
// only mean failing a check nothing could satisfy.
const LARGE_TEXT_MIN = 3.0;

// ————————————————————————————————————————————————— Colour math

function parseHex(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace(/^#/, '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map(c => c + c)
          .join('')
      : clean;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function toHex(rgb: [number, number, number]): string {
  return (
    '#' +
    rgb
      .map(c => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(c => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function mix(from: [number, number, number], to: [number, number, number], amount: number): [number, number, number] {
  return [
    from[0] + (to[0] - from[0]) * amount,
    from[1] + (to[1] - from[1]) * amount,
    from[2] + (to[2] - from[2]) * amount,
  ];
}

// Walk `color` toward black (on a light ground) or white (on a dark one)
// until it clears `min` against that ground, in 4% steps. Mixing toward a
// neutral keeps the hue, so Lakers gold darkens into a deep ochre that is
// still recognisably the Lakers' gold rather than snapping to a generic
// brown — which is what a "pick the nearest accessible colour" approach
// would do and why this isn't one.
//
// The loop is bounded and the final step is pure black/white, so the worst
// case terminates at a colour that trivially passes against its ground.
function toContrast(color: string, ground: string, min: number): string {
  const rgb = parseHex(color);
  const bg = parseHex(ground);
  if (!rgb || !bg) return color;
  if (contrast(rgb, bg) >= min) return toHex(rgb);
  const target: [number, number, number] = relativeLuminance(bg) > 0.5 ? [0, 0, 0] : [255, 255, 255];
  for (let step = 1; step <= 25; step += 1) {
    // Round to the 8-bit channel FIRST, then measure. Testing the float
    // and returning toHex() of it shipped colours up to 0.01 below the
    // target, because the rounding that happens on the way out moves the
    // luminance after the check has already passed (caught by the
    // per-palette contrast test, 2026-08-12).
    const candidate = parseHex(toHex(mix(rgb, target, step * 0.04)));
    if (candidate && contrast(candidate, bg) >= min) return toHex(candidate);
  }
  return toHex(target);
}

// Text printed on a solid brand block. Only two answers are ever right —
// the page's near-black or white — so this picks between them rather than
// manufacturing a third colour nobody chose.
//
// WHITE WINS TIES, and "tie" means both options clear the large-text bar.
// Picking the mathematically-higher ratio alone put black on Wrexham's red
// (5.25:1 against white's 4.0:1), which is legible and still wrong: a
// wordmark on a saturated club colour is white essentially everywhere in
// sport, and a device whose whole purpose is to look like the asset should
// not spend its one aesthetic decision contradicting the asset. Contrast
// is a floor to clear here, not a score to maximise — when both answers
// are safe, convention picks.
function onFill(fill: string): string {
  const rgb = parseHex(fill);
  if (!rgb) return '#0a0a0a';
  const dark = contrast(rgb, [10, 10, 10]);
  const light = contrast(rgb, [255, 255, 255]);
  if (light >= LARGE_TEXT_MIN && dark >= LARGE_TEXT_MIN) return '#FFFFFF';
  return light >= dark ? '#FFFFFF' : '#0a0a0a';
}

// The one case onFill cannot solve on its own: a fill so mid-toned that
// neither near-black nor white clears the large-text bar against it. Push
// the FILL away from the text instead — the block is decoration, the
// wordmark on it is the content, so the fill is the one that gives way.
function fillForLegibleText(fill: string, ground: string, min: number): string {
  const corrected = toContrast(fill, ground, min);
  const rgb = parseHex(corrected);
  if (!rgb) return corrected;
  const best = Math.max(contrast(rgb, [10, 10, 10]), contrast(rgb, [255, 255, 255]));
  if (best >= LARGE_TEXT_MIN) return corrected;
  // Darken toward black so white text on it passes; a mid-tone that fails
  // both directions is always closer to rescuing the white option.
  for (let step = 1; step <= 25; step += 1) {
    const candidate = parseHex(toHex(mix(rgb, [0, 0, 0], step * 0.04)));
    if (candidate && contrast(candidate, [255, 255, 255]) >= LARGE_TEXT_MIN) return toHex(candidate);
  }
  return '#0a0a0a';
}

// ————————————————————————————————————————————————— The registry
//
// Seeded with the leagues Playbook actually covers. Colours are the clubs'
// published primaries; where a club's real primary is white (Real Madrid,
// Jets, Sevilla) the entry uses the colour that can carry a block and
// keeps white as the secondary, because a white fill on cream paper is not
// a design choice, it is a missing element.
//
// `keys` are matched after normalization (lowercased, unaccented, stripped
// of everything but a-z0-9), so "L.A. Lakers", "Lakers" and "lakers" all
// land on the same row. Add spellings to `keys` rather than adding rows.
const BRAND_TABLE: (BrandPalette & { keys: string[] })[] = [
  // NBA
  { keys: ['lakers', 'losangeleslakers', 'lalakers'], name: 'Lakers', primary: '#552583', secondary: '#FDB927' },
  { keys: ['celtics', 'bostonceltics'], name: 'Celtics', primary: '#007A33', secondary: '#BA9653' },
  { keys: ['warriors', 'goldenstatewarriors'], name: 'Warriors', primary: '#1D428A', secondary: '#FFC72C' },
  { keys: ['knicks', 'newyorkknicks'], name: 'Knicks', primary: '#006BB6', secondary: '#F58426' },
  { keys: ['bulls', 'chicagobulls'], name: 'Bulls', primary: '#CE1141', secondary: '#000000' },
  { keys: ['heat', 'miamiheat'], name: 'Heat', primary: '#98002E', secondary: '#F9A01B' },
  { keys: ['nets', 'brooklynnets'], name: 'Nets', primary: '#000000', secondary: '#FFFFFF' },
  { keys: ['mavericks', 'mavs', 'dallasmavericks'], name: 'Mavericks', primary: '#00538C', secondary: '#B8C4CA' },
  { keys: ['suns', 'phoenixsuns'], name: 'Suns', primary: '#1D1160', secondary: '#E56020' },
  { keys: ['clippers', 'laclippers'], name: 'Clippers', primary: '#C8102E', secondary: '#1D428A' },
  { keys: ['spurs', 'sanantoniospurs'], name: 'Spurs', primary: '#000000', secondary: '#C4CED4' },
  { keys: ['bucks', 'milwaukeebucks'], name: 'Bucks', primary: '#00471B', secondary: '#EEE1C6' },
  { keys: ['sixers', '76ers', 'philadelphia76ers'], name: '76ers', primary: '#006BB6', secondary: '#ED174C' },
  { keys: ['nuggets', 'denvernuggets'], name: 'Nuggets', primary: '#0E2240', secondary: '#FEC524' },
  { keys: ['grizzlies', 'memphisgrizzlies'], name: 'Grizzlies', primary: '#5D76A9', secondary: '#12173F' },
  { keys: ['rockets', 'houstonrockets'], name: 'Rockets', primary: '#CE1141', secondary: '#000000' },
  { keys: ['blazers', 'trailblazers', 'portlandtrailblazers'], name: 'Trail Blazers', primary: '#E03A3E', secondary: '#000000' },
  { keys: ['kings', 'sacramentokings'], name: 'Kings', primary: '#5A2D81', secondary: '#63727A' },
  { keys: ['jazz', 'utahjazz'], name: 'Jazz', primary: '#002B5C', secondary: '#F9A01B' },
  { keys: ['thunder', 'oklahomacitythunder', 'okc'], name: 'Thunder', primary: '#007AC1', secondary: '#EF3B24' },
  { keys: ['timberwolves', 'wolves', 'minnesotatimberwolves'], name: 'Timberwolves', primary: '#0C2340', secondary: '#78BE20' },
  { keys: ['pelicans', 'neworleanspelicans'], name: 'Pelicans', primary: '#0C2340', secondary: '#C8102E' },
  { keys: ['magic', 'orlandomagic'], name: 'Magic', primary: '#0077C0', secondary: '#C4CED4' },
  { keys: ['hawks', 'atlantahawks'], name: 'Hawks', primary: '#E03A3E', secondary: '#C1D32F' },
  { keys: ['hornets', 'charlottehornets'], name: 'Hornets', primary: '#1D1160', secondary: '#00788C' },
  { keys: ['pistons', 'detroitpistons'], name: 'Pistons', primary: '#C8102E', secondary: '#1D42BA' },
  { keys: ['pacers', 'indianapacers'], name: 'Pacers', primary: '#002D62', secondary: '#FDBB30' },
  { keys: ['cavaliers', 'cavs', 'clevelandcavaliers'], name: 'Cavaliers', primary: '#860038', secondary: '#FDBB30' },
  { keys: ['raptors', 'torontoraptors'], name: 'Raptors', primary: '#CE1141', secondary: '#000000' },
  { keys: ['wizards', 'washingtonwizards'], name: 'Wizards', primary: '#002B5C', secondary: '#E31837' },

  // NFL
  { keys: ['cowboys', 'dallascowboys'], name: 'Cowboys', primary: '#041E42', secondary: '#869397' },
  { keys: ['patriots', 'newenglandpatriots'], name: 'Patriots', primary: '#002244', secondary: '#C60C30' },
  { keys: ['packers', 'greenbaypackers'], name: 'Packers', primary: '#203731', secondary: '#FFB612' },
  { keys: ['steelers', 'pittsburghsteelers'], name: 'Steelers', primary: '#101820', secondary: '#FFB612' },
  { keys: ['49ers', 'niners', 'sanfrancisco49ers'], name: '49ers', primary: '#AA0000', secondary: '#B3995D' },
  { keys: ['chiefs', 'kansascitychiefs'], name: 'Chiefs', primary: '#E31837', secondary: '#FFB81C' },
  { keys: ['eagles', 'philadelphiaeagles'], name: 'Eagles', primary: '#004C54', secondary: '#A5ACAF' },
  { keys: ['giants', 'newyorkgiants'], name: 'Giants', primary: '#0B2265', secondary: '#A71930' },
  { keys: ['commanders', 'washingtoncommanders'], name: 'Commanders', primary: '#5A1414', secondary: '#FFB612' },
  { keys: ['rams', 'losangelesrams'], name: 'Rams', primary: '#003594', secondary: '#FFA300' },
  { keys: ['dolphins', 'miamidolphins'], name: 'Dolphins', primary: '#008E97', secondary: '#FC4C02' },
  { keys: ['bills', 'buffalobills'], name: 'Bills', primary: '#00338D', secondary: '#C60C30' },
  { keys: ['broncos', 'denverbroncos'], name: 'Broncos', primary: '#FB4F14', secondary: '#002244' },
  { keys: ['raiders', 'lasvegasraiders'], name: 'Raiders', primary: '#000000', secondary: '#A5ACAF' },
  { keys: ['seahawks', 'seattleseahawks'], name: 'Seahawks', primary: '#002244', secondary: '#69BE28' },
  { keys: ['jets', 'newyorkjets'], name: 'Jets', primary: '#125740', secondary: '#FFFFFF' },
  { keys: ['bengals', 'cincinnatibengals'], name: 'Bengals', primary: '#FB4F14', secondary: '#000000' },

  // WNBA
  { keys: ['sparks', 'lasparks', 'losangelessparks'], name: 'Sparks', primary: '#702F8A', secondary: '#FFC72C' },

  // MLB
  { keys: ['yankees', 'newyorkyankees'], name: 'Yankees', primary: '#0C2340', secondary: '#C4CED4' },
  { keys: ['dodgers', 'losangelesdodgers'], name: 'Dodgers', primary: '#005A9C', secondary: '#EF3E42' },
  { keys: ['redsox', 'bostonredsox'], name: 'Red Sox', primary: '#BD3039', secondary: '#0C2340' },
  { keys: ['cubs', 'chicagocubs'], name: 'Cubs', primary: '#0E3386', secondary: '#CC3433' },
  { keys: ['mets', 'newyorkmets'], name: 'Mets', primary: '#002D72', secondary: '#FF5910' },

  // Liga MX
  //
  // Corrected and completed 2026-08-29 (publisher review of the streaming-guide
  // Liga MX grid): six of the eleven original rows collapsed into just three
  // literal hex values (Tigres === Pumas' navy, Cruz Azul === Monterrey's blue,
  // and Chivas === Toluca === Necaxa === Atlas' red), which reads as one crest
  // repeated in six colours instead of six identities. Tigres was also backwards
  // — its own #FFB81C gold sat in `secondary` while the shared navy led, when gold
  // is the club's dominant, recognisable colour. Every row below is now a
  // distinct hex, and the six clubs this registry never covered (Atlante,
  // Atlético San Luis, FC Juárez, Puebla, Querétaro, Tijuana) are added rather
  // than left to the neutral-accent fallback, since all eighteen Apertura 2026
  // clubs needed to read apart on one grid.
  { keys: ['america', 'clubamerica'], name: 'América', primary: '#12284C', secondary: '#FFE800' },
  { keys: ['atlante'], name: 'Atlante', primary: '#0B3D7A', secondary: '#7B1E3A' },
  { keys: ['atlas'], name: 'Atlas', primary: '#A6192E', secondary: '#000000' },
  { keys: ['atleticosanluis', 'sanluis'], name: 'Atlético San Luis', primary: '#1B2A4A', secondary: '#E4032E' },
  { keys: ['chivas', 'guadalajara', 'clubdeportivoguadalajara'], name: 'Chivas', primary: '#C8102E', secondary: '#002F6C' },
  { keys: ['cruzazul'], name: 'Cruz Azul', primary: '#0F52A0', secondary: '#FFFFFF' },
  { keys: ['fcjuarez', 'juarez', 'bravos'], name: 'FC Juárez', primary: '#00843D', secondary: '#000000' },
  { keys: ['leon', 'clubleon'], name: 'León', primary: '#046A38', secondary: '#FFFFFF' },
  { keys: ['monterrey', 'rayados'], name: 'Monterrey', primary: '#002B5C', secondary: '#FFFFFF' },
  { keys: ['necaxa'], name: 'Necaxa', primary: '#E4572E', secondary: '#FFFFFF' },
  { keys: ['pachuca'], name: 'Pachuca', primary: '#002F6C', secondary: '#FFFFFF' },
  { keys: ['puebla', 'clubpuebla'], name: 'Puebla', primary: '#0093D0', secondary: '#1B3668' },
  { keys: ['pumas', 'pumasunam', 'unam'], name: 'Pumas', primary: '#00205B', secondary: '#FFB81C' },
  { keys: ['queretaro', 'gallosblancos'], name: 'Querétaro', primary: '#0C2340', secondary: '#000000' },
  { keys: ['santos', 'santoslaguna'], name: 'Santos Laguna', primary: '#6F263D', secondary: '#009639' },
  { keys: ['tigres', 'tigresuanl', 'uanl'], name: 'Tigres', primary: '#FFB81C', secondary: '#00205B' },
  { keys: ['tijuana', 'xolos', 'clubtijuana'], name: 'Tijuana', primary: '#8C1B24', secondary: '#000000' },
  { keys: ['toluca'], name: 'Toluca', primary: '#7A1F2B', secondary: '#000000' },

  // LaLiga
  { keys: ['realmadrid', 'madrid'], name: 'Real Madrid', primary: '#00529F', secondary: '#FEBE10' },
  { keys: ['barcelona', 'barca', 'fcbarcelona'], name: 'Barcelona', primary: '#A50044', secondary: '#004D98' },
  { keys: ['atletico', 'atleticodemadrid', 'atleti'], name: 'Atlético', primary: '#CB3524', secondary: '#262E62' },
  { keys: ['sevilla', 'sevillafc'], name: 'Sevilla', primary: '#D91A21', secondary: '#FFFFFF' },
  { keys: ['valencia', 'valenciacf'], name: 'Valencia', primary: '#FF7F00', secondary: '#000000' },
  { keys: ['athletic', 'athleticclub', 'athleticbilbao'], name: 'Athletic Club', primary: '#EE2523', secondary: '#FFFFFF' },

  // Premier League
  { keys: ['manchesterunited', 'manunited', 'manutd', 'united'], name: 'Manchester United', primary: '#DA291C', secondary: '#FBE122' },
  { keys: ['manchestercity', 'mancity', 'city'], name: 'Manchester City', primary: '#6CABDD', secondary: '#1C2C5B' },
  { keys: ['liverpool', 'liverpoolfc'], name: 'Liverpool', primary: '#C8102E', secondary: '#00B2A9' },
  { keys: ['arsenal', 'arsenalfc'], name: 'Arsenal', primary: '#EF0107', secondary: '#063672' },
  { keys: ['chelsea', 'chelseafc'], name: 'Chelsea', primary: '#034694', secondary: '#FFFFFF' },
  { keys: ['tottenham', 'spurshotspur', 'tottenhamhotspur'], name: 'Tottenham', primary: '#132257', secondary: '#FFFFFF' },
  { keys: ['newcastle', 'newcastleunited'], name: 'Newcastle', primary: '#241F20', secondary: '#FFFFFF' },
  { keys: ['astonvilla', 'villa'], name: 'Aston Villa', primary: '#670E36', secondary: '#95BFE5' },
  { keys: ['everton', 'evertonfc'], name: 'Everton', primary: '#003399', secondary: '#FFFFFF' },
  { keys: ['wrexham', 'wrexhamafc'], name: 'Wrexham', primary: '#FF0000', secondary: '#FFFFFF' },

  // Serie A / Bundesliga / Ligue 1
  { keys: ['juventus', 'juve'], name: 'Juventus', primary: '#000000', secondary: '#FFFFFF' },
  { keys: ['milan', 'acmilan'], name: 'Milan', primary: '#FB090B', secondary: '#000000' },
  { keys: ['inter', 'internazionale', 'intermilan'], name: 'Inter', primary: '#0068A8', secondary: '#000000' },
  { keys: ['napoli', 'sscnapoli'], name: 'Napoli', primary: '#12A0D7', secondary: '#FFFFFF' },
  { keys: ['roma', 'asroma'], name: 'Roma', primary: '#8E1F2F', secondary: '#F0BC42' },
  { keys: ['bayern', 'bayernmunich', 'bayernmunchen'], name: 'Bayern', primary: '#DC052D', secondary: '#0066B2' },
  { keys: ['dortmund', 'borussiadortmund', 'bvb'], name: 'Dortmund', primary: '#FDE100', secondary: '#000000' },
  { keys: ['psg', 'parissaintgermain'], name: 'PSG', primary: '#004170', secondary: '#DA291C' },

  // MLS
  { keys: ['intermiami', 'intermiamicf'], name: 'Inter Miami', primary: '#F7B5CD', secondary: '#000000' },
  { keys: ['lafc', 'losangelesfc'], name: 'LAFC', primary: '#000000', secondary: '#C39E6D' },
  { keys: ['galaxy', 'lagalaxy'], name: 'LA Galaxy', primary: '#00245D', secondary: '#FFD200' },
  { keys: ['atlantaunited'], name: 'Atlanta United', primary: '#A5122B', secondary: '#221F1F' },

  // Listed sportswear. These arrive through the market devices rather than
  // the transfer ones: a `Cotización` track wears the ticker's own brand the
  // same way a `Venta` deed wears the club's. Several of these identities
  // are genuinely black-and-white, which is not a placeholder — the
  // contrast guard lifts black to a readable grey on the dark theme, so the
  // minimal ones stay minimal instead of being invented into a colour.
  { keys: ['onholding', 'onrunning', 'on', 'onon'], name: 'On Holding', primary: '#000000', secondary: '#FFFFFF' },
  { keys: ['nike'], name: 'Nike', primary: '#000000', secondary: '#FFFFFF' },
  { keys: ['adidas'], name: 'Adidas', primary: '#000000', secondary: '#FFFFFF' },
  { keys: ['puma'], name: 'Puma', primary: '#000000', secondary: '#E4002B' },
  { keys: ['underarmour', 'ua'], name: 'Under Armour', primary: '#1D1D1D', secondary: '#E31837' },
  { keys: ['newbalance'], name: 'New Balance', primary: '#CF0A2C', secondary: '#000000' },
  { keys: ['lululemon'], name: 'Lululemon', primary: '#D31334', secondary: '#000000' },
  { keys: ['asics'], name: 'Asics', primary: '#002855', secondary: '#FFFFFF' },

  // Leagues and bodies — a sale can be of a stake in the competition
  // itself, not only of a club.
  { keys: ['nba'], name: 'NBA', primary: '#17408B', secondary: '#C9082A' },
  { keys: ['nfl'], name: 'NFL', primary: '#013369', secondary: '#D50A0A' },
  { keys: ['mlb'], name: 'MLB', primary: '#041E42', secondary: '#BF0D3E' },
  { keys: ['nhl'], name: 'NHL', primary: '#000000', secondary: '#FFFFFF' },
  { keys: ['mls'], name: 'MLS', primary: '#001F5B', secondary: '#B0985F' },
  { keys: ['ligamx'], name: 'Liga MX', primary: '#00A94F', secondary: '#E4002B' },
  { keys: ['laliga'], name: 'LaLiga', primary: '#EE2A24', secondary: '#0B1A3C' },
  { keys: ['premierleague'], name: 'Premier League', primary: '#3D195B', secondary: '#00FF87' },
  { keys: ['fifa'], name: 'FIFA', primary: '#326295', secondary: '#FFFFFF' },
  { keys: ['uefa'], name: 'UEFA', primary: '#003366', secondary: '#00A0E1' },
  { keys: ['conmebol'], name: 'Conmebol', primary: '#0B4EA2', secondary: '#FFCC00' },
  { keys: ['concacaf'], name: 'Concacaf', primary: '#0A2240', secondary: '#00A94F' },
  { keys: ['f1', 'formula1', 'formulauno'], name: 'Fórmula 1', primary: '#E10600', secondary: '#15151E' },

  // Racing teams. Cadillac's 2026 debut livery is a deliberate black-to-white
  // split (the gradient is the Cadillac chevron repeated), so this row is
  // monochrome for the same reason On Holding and the NHL are: it is the
  // identity, not a missing value waiting to be filled in with a guess.
  { keys: ['cadillacf1', 'cadillac', 'cadillacformula1'], name: 'Cadillac F1', primary: '#000000', secondary: '#FFFFFF' },
];

const BRANDS = new Map<string, BrandPalette>();
for (const row of BRAND_TABLE) {
  for (const key of row.keys) {
    BRANDS.set(key, { name: row.name, primary: row.primary, secondary: row.secondary });
  }
}

// "L.A. Lakers" → "lalakers"; "Atlético" → "atletico". Unicode-normalized
// first so the accented and unaccented spellings of a Liga MX or LaLiga
// club collide onto one key instead of silently missing.
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// The inline escape hatch: `Wrexham #FF0000 #FFFFFF`. Deliberately strict —
// two full hex triplets, nothing else — because these two values are
// interpolated into a style attribute, and "validated by a regex that only
// admits hex digits" is the property that keeps that safe. A malformed
// override is not silently dropped: it leaves the asset name carrying the
// literal hex text, which fails the device's own name-length check and so
// renders the whole declaration as visible plain text, the way every other
// malformed device does.
const HEX_OVERRIDE_RE = /^([\s\S]+?)\s+(#[0-9a-f]{3}(?:[0-9a-f]{3})?)\s+(#[0-9a-f]{3}(?:[0-9a-f]{3})?)\s*$/i;

export type ResolvedBrand = {
  /** The asset name as it should be printed (override text or registry name). */
  label: string;
  /** Present only when a palette was found or supplied. */
  palette: BrandPalette | null;
};

// Resolve an asset name to a palette. Three outcomes, in priority order:
// an explicit hex override, a registry hit, or a plain label with no
// palette at all — the last of which is a first-class result, not a
// failure. An unregistered asset ("los derechos de la Bundesliga", a
// stadium, a media package) emits no custom properties and renders in
// Playbook's house palette (see the fallback chain in styles/lectura.css),
// which is why `Venta` and `Cadena` can be declared for ANY asset worth
// the beat and not only for clubs whose colours someone remembered to add
// here.
export function resolveBrand(rawAsset: string): ResolvedBrand {
  const override = rawAsset.match(HEX_OVERRIDE_RE);
  if (override) {
    const label = override[1].trim();
    const primary = parseHex(override[2]);
    const secondary = parseHex(override[3]);
    if (label && primary && secondary) {
      return { label, palette: { name: label, primary: toHex(primary), secondary: toHex(secondary) } };
    }
  }
  const label = rawAsset.trim();
  const hit = BRANDS.get(slugify(label));
  return { label, palette: hit ? { ...hit, name: label } : null };
}

// The eight custom properties a branded device carries, already contrast-
// corrected for both themes. Returned as a ready-to-interpolate style
// attribute value — every value is a hex string this module produced, so
// there is nothing author-supplied left in it to escape.
//
// Returns '' when there is no palette, which is what makes the CSS
// fallback chain (var(--pb-brand-fill, var(--lect-accent))) do the work
// instead of a second code path here.
export function brandStyleAttr(palette: BrandPalette | null): string {
  if (!palette) return '';
  const fillLight = fillForLegibleText(palette.primary, PAPER_LIGHT, GRAPHIC_MIN);
  const fillDark = fillForLegibleText(palette.primary, PAPER_DARK, GRAPHIC_MIN);
  const altLight = toContrast(palette.secondary, PAPER_LIGHT, GRAPHIC_MIN);
  const altDark = toContrast(palette.secondary, PAPER_DARK, GRAPHIC_MIN);
  const props = [
    `--pb-brand-fill:${fillLight}`,
    `--pb-brand-fill-dark:${fillDark}`,
    // Computed from the CORRECTED fill, not the raw primary: the text has
    // to be legible on the block that actually ships, and on a colour that
    // was lightened for the dark theme those two can disagree.
    `--pb-brand-on:${onFill(fillLight)}`,
    `--pb-brand-on-dark:${onFill(fillDark)}`,
    `--pb-brand-ink:${toContrast(palette.primary, PAPER_LIGHT, TEXT_MIN)}`,
    `--pb-brand-ink-dark:${toContrast(palette.primary, PAPER_DARK, TEXT_MIN)}`,
    `--pb-brand-alt:${altLight}`,
    `--pb-brand-alt-dark:${altDark}`,
  ];
  return props.join(';');
}
