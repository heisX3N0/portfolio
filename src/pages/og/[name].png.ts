// Share images (SPEC 10 phase 4): one 1200x630 PNG per published role page, plus one site-wide image for every other
// page (owner decision 2026-10-23), drawn at build time from the content files so they never go stale. Satori lays
// out the card as SVG; the WebAssembly build of resvg turns it into a PNG (Application Control on the owner's
// machine blocks native binaries, CLAUDE.md). Unpublished roles get no image.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import type { APIRoute, GetStaticPaths } from 'astro';
import satori from 'satori';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import { getPublishedRoles } from '../../lib/content';
import { getSite } from '../../lib/site';
import { palette } from '../../lib/palette';
import { SITE_OG } from '../../lib/seo';

// Build code runs from a bundle, so packages are found from the project root, not import.meta.url (CLAUDE.md).
const require = createRequire(join(process.cwd(), 'package.json'));
const file = (path: string) => readFileSync(require.resolve(path));

// Loaded once per build, on the first image.
let wasm: Promise<void> | undefined;
let fontData: ReturnType<typeof readFonts> | undefined;
const readFonts = () => [
  { name: 'Source Serif 4', weight: 600 as const, style: 'normal' as const, data: file('@fontsource/source-serif-4/files/source-serif-4-latin-600-normal.woff') },
  { name: 'Source Serif 4', weight: 400 as const, style: 'normal' as const, data: file('@fontsource/source-serif-4/files/source-serif-4-latin-400-normal.woff') },
  { name: 'Inter', weight: 600 as const, style: 'normal' as const, data: file('@fontsource/inter/files/inter-latin-600-normal.woff') },
  { name: 'Inter', weight: 400 as const, style: 'normal' as const, data: file('@fontsource/inter/files/inter-latin-400-normal.woff') },
];

export const getStaticPaths = (async () => {
  const roles = await getPublishedRoles();
  return [
    { params: { name: SITE_OG }, props: { title: undefined, line: undefined } },
    ...roles.map((r) => ({ params: { name: r.slug }, props: { title: r.title, line: r.positioning } })),
  ];
}) satisfies GetStaticPaths;

interface Props {
  /** The role's CV title, as the gold line on the role page's hero. */
  title?: string;
  /** The role's positioning line; the site image uses the root line. */
  line?: string;
}

type Node = { type: string; props: { style: Record<string, string | number>; children?: (Node | string)[] | string } };
const el = (style: Node['props']['style'], children?: Node['props']['children']): Node => ({ type: 'div', props: { style, children } });

export const GET: APIRoute<Props> = async ({ props, site: origin }) => {
  const site = await getSite();
  const colour = palette.light;
  const card = el(
    {
      width: 1200,
      height: 630,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '72px 80px',
      backgroundColor: colour['hero-bg'],
      borderLeft: `16px solid ${colour['on-hero-gold']}`,
      color: colour['on-hero'],
    },
    [
      el({ display: 'flex', flexDirection: 'column' }, [
        el({ fontFamily: 'Source Serif 4', fontWeight: 600, fontSize: 80, lineHeight: 1.05, letterSpacing: '-0.015em' }, site.name),
        ...(props.title
          ? [el({ marginTop: 28, fontFamily: 'Inter', fontWeight: 600, fontSize: 26, letterSpacing: '0.075em', textTransform: 'uppercase', color: colour['on-hero-gold'] }, props.title)]
          : []),
        el({ marginTop: 36, fontFamily: 'Source Serif 4', fontWeight: 400, fontSize: 44, lineHeight: 1.2 }, props.line ?? site.rootLine),
      ]),
      el(
        { display: 'flex', paddingTop: 24, borderTop: `1px solid ${colour['hero-rule']}`, fontFamily: 'Inter', fontSize: 26, color: colour['on-hero-muted'] },
        new URL(origin!).host,
      ),
    ],
  );
  const svg = await satori(card as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts: (fontData ??= readFonts()) });
  wasm ??= initWasm(file('@resvg/resvg-wasm/index_bg.wasm'));
  await wasm;
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
