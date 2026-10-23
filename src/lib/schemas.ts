// Content schemas (SPEC 9.2). Kept free of astro:content so the Node tests can check them directly.
import { z } from 'astro/zod';

// Paths a role slug may not take: each is a page or folder of its own (SPEC 3).
const RESERVED = ['work', 'about', 'cv', 'styleguide', 'fonts', '404'];

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lower-case words joined by hyphens');

export const siteSchema = z.object({
  name: z.string(),
  rootLine: z.string(),
  rootIntro: z.string(),
  // SPEC 4.0: the root page's "Selected work" row of 3 case study slugs, in display order.
  selectedWork: z.array(slug).length(3),
  email: z.email(),
  linkedin: z.url(),
  github: z.url(),
  substack: z.url(),
  location: z.string(),
  defaultCv: z.string().startsWith('/cv/'),
  headshot: z.object({ show: z.boolean(), src: z.string() }),
});

const publishedRole = z.object({
  slug: slug.refine((s) => !RESERVED.includes(s), 'this path is taken by another page'),
  published: z.literal(true),
  title: z.string(),
  positioning: z.string(),
  supporting: z.string(),
  // SPEC 4.1 item 2: at most 5 items, figure first (v3.1).
  proofStrip: z.array(z.object({ figure: z.string(), text: z.string() })).min(1).max(5),
  // SPEC 4.1 item 4: 4 to 6 steps; example is an optional case study slug (v3.1).
  howIWork: z
    .array(z.object({ step: z.string(), line: z.string(), artefacts: z.string().optional(), example: slug.optional() }))
    .min(4)
    .max(6),
  tools: z.string(),
  featuredWork: z.array(slug).min(1),
  cvFile: z.string().regex(/^\/cv\/[a-z0-9-]+\.pdf$/, 'a PDF in /cv/'),
  contactLine: z.string(),
});

// An unpublished role needs nothing but its slug until its spec addendum and CV exist (SPEC 10, phases 6 and 7).
const unpublishedRole = z.object({ slug, published: z.literal(false) });

export const roleSchema = z.discriminatedUnion('published', [publishedRole, unpublishedRole]);
export type PublishedRole = z.infer<typeof publishedRole>;

export const TAGS = ['Banking', 'AI product', 'Requirements', 'Process', 'Data', 'AI governance'] as const;
export const ROLE_SLUGS = ['business-analyst', 'project-manager', 'product-manager'] as const;

// Case study frontmatter (SPEC 9.2). P2 uses the card fields; P3 adds the bodies and pages.
export const workSchema = z.object({
  title: z.string(),
  slug,
  summary: z.string(),
  role: z.string(),
  organisation: z.string(),
  period: z.string(),
  tags: z.array(z.enum(TAGS)).min(1),
  roles: z.array(z.enum(ROLE_SLUGS)).min(1),
  // Optional: Performance Buddy has no outcome figure (SPEC 5.2). Any figure must be in SPEC 6.2.
  headlineFigure: z.string().optional(),
  order: z.number(),
  draft: z.boolean().default(false),
});

export const experienceSchema = z.object({
  id: z.string(),
  // Set by the loader from the item's place in the YAML list (src/content.config.ts).
  position: z.number().int().default(0),
  role: z.string(),
  organisation: z.string(),
  dates: z.string(),
  highlights: z.array(z.string()).min(2).max(3),
});

export const certificationSchema = z.object({
  id: z.string(),
  // Set by the loader from the item's place in the YAML list (src/content.config.ts).
  position: z.number().int().default(0),
  name: z.string(),
  issuer: z.string().optional(),
  url: z.url().optional(),
});

export const writingGroupSchema = z.object({
  id: z.string(),
  // Set by the loader from the item's place in the YAML list (src/content.config.ts).
  position: z.number().int().default(0),
  title: z.string(),
  note: z.string().optional(),
  seriesUrl: z.url(),
  posts: z
    .array(z.object({ title: z.string(), description: z.string(), date: z.coerce.date(), url: z.url() }))
    .min(1),
});

export const aboutSchema = z.object({
  title: z.string(),
  description: z.string(),
  howBuilt: z.string(),
  repo: z.url(),
  spec: z.url(),
  education: z.array(z.string()).min(1),
});
