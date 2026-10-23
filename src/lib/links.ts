// Markdown-style links in one-line content fields. Kept free of astro:content for the Node tests.

export interface LinkPart {
  text: string;
  href?: string;
}

/** "See [the demo](https://x.test)." as text and link parts. Only https links count; anything else stays text. */
export function linkParts(text: string): LinkPart[] {
  const parts: LinkPart[] = [];
  let last = 0;
  for (const m of text.matchAll(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    parts.push({ text: m[1], href: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
