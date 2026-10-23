// Colour tokens as data, for the style guide's swatches and contrast table and for the palette test.
// tokens.css is the source the site uses; a test checks these values match it.
const hero = {
  'hero-bg': '#172c49',
  'on-hero': '#faf8f4',
  'on-hero-muted': '#c9d3e1',
  'on-hero-gold': '#e8c26a',
  'hero-rule': '#2e4566',
} as const;

export const palette = {
  light: {
    bg: '#faf8f4',
    surface: '#ffffff',
    text: '#1a1d23',
    muted: '#4b5361',
    accent: '#1f3a5f',
    'accent-contrast': '#ffffff',
    border: '#d9d4ca',
    rule: '#e6e1d8',
    focus: '#1f3a5f',
    gold: '#7a5300',
    'gold-bg': '#f6ebcf',
    ...hero,
    'hero-edge': '#172c49',
  },
  dark: {
    bg: '#12161d',
    surface: '#1a2029',
    text: '#e9e7e2',
    muted: '#aab1bd',
    accent: '#a9c2e4',
    'accent-contrast': '#12161d',
    border: '#313a47',
    rule: '#313a47',
    focus: '#a9c2e4',
    gold: '#e8c26a',
    'gold-bg': '#33290f',
    ...hero,
    'hero-edge': '#4a6890',
  },
} as const;

export interface Pair {
  fg: string;
  bg: string;
  /** 4.5 for text, 3 for large text and UI parts (SPEC 8), 1 for decoration with no meaning. */
  min: number;
  use: string;
}

// Every foreground and background pair the site uses. The palette test fails if any is under its minimum in either theme.
export const pairs: Pair[] = [
  { fg: 'text', bg: 'bg', min: 4.5, use: 'Body text' },
  { fg: 'muted', bg: 'bg', min: 4.5, use: 'Secondary text' },
  { fg: 'muted', bg: 'surface', min: 4.5, use: 'Proof and card text' },
  { fg: 'accent', bg: 'bg', min: 4.5, use: 'Links, proof figures' },
  { fg: 'accent', bg: 'surface', min: 4.5, use: 'Links and figures on cards and panels' },
  { fg: 'accent-contrast', bg: 'accent', min: 4.5, use: 'Primary button, skip link' },
  { fg: 'gold', bg: 'bg', min: 4.5, use: 'Gold text on the page' },
  { fg: 'gold', bg: 'surface', min: 4.5, use: 'Gold text on cards' },
  { fg: 'gold', bg: 'gold-bg', min: 4.5, use: 'Tags' },
  { fg: 'on-hero', bg: 'hero-bg', min: 4.5, use: 'Hero and header text' },
  { fg: 'on-hero-muted', bg: 'hero-bg', min: 4.5, use: 'Hero secondary text' },
  { fg: 'on-hero-gold', bg: 'hero-bg', min: 4.5, use: 'Title line, CV link, focus ring on navy' },
  { fg: 'hero-bg', bg: 'on-hero-gold', min: 4.5, use: 'Gold button label' },
  { fg: 'focus', bg: 'bg', min: 3, use: 'Focus ring on the page' },
  { fg: 'hero-edge', bg: 'bg', min: 3, use: 'Hero band edge (dark theme)' },
  { fg: 'border', bg: 'bg', min: 1, use: 'Decorative borders (no meaning)' },
  { fg: 'rule', bg: 'surface', min: 1, use: 'Proof strip dividers (no meaning)' },
];

type Theme = Record<string, string>;

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colours. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Pairs under their minimum, or naming a colour the theme lacks, in either theme. */
export function contrastFailures(themes: { light: Theme; dark: Theme }, list: Pair[]): string[] {
  const failures: string[] = [];
  for (const [mode, colours] of Object.entries(themes)) {
    for (const p of list) {
      const fg = colours[p.fg];
      const bg = colours[p.bg];
      if (!fg || !bg) {
        failures.push(`${mode}: ${p.use} (${p.fg} on ${p.bg}) names a missing colour`);
        continue;
      }
      const ratio = contrast(fg, bg);
      if (ratio < p.min) failures.push(`${mode}: ${p.use} (${p.fg} on ${p.bg}) ${ratio.toFixed(2)}:1, needs ${p.min}:1`);
    }
  }
  return failures;
}
