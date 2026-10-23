// Colour tokens as data, for the style guide's swatches and contrast ratios.
// tokens.css is the source the site uses; a test checks these values match it.
export const palette = {
  light: {
    bg: '#faf8f4',
    surface: '#ffffff',
    text: '#1a1d23',
    muted: '#4b5361',
    accent: '#1f3a5f',
    border: '#d9d4ca',
    warm: '#9a4419',
    'warm-bg': '#f7e9de',
  },
  dark: {
    bg: '#12161d',
    surface: '#1a2029',
    text: '#e9e7e2',
    muted: '#aab1bd',
    accent: '#a9c2e4',
    border: '#313a47',
    warm: '#f2b48c',
    'warm-bg': '#3a261b',
  },
} as const;

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
