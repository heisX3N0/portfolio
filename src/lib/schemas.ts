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

// Artefacts (SPEC 4.3 item 6 and 7): data in the case study file, drawn at build time as an HTML table or an SVG
// diagram (src/lib/diagrams.ts) with a text walk-through generated from the same data.
const artefactBase = {
  id: slug,
  caption: z.string(),
  // SPEC 7: sanitised artefacts say so.
  label: z.enum(['Illustrative', 'Simplified', 'Illustrative, simplified']).optional(),
};
const diagramStep = z.object({ label: z.string(), note: z.string().optional(), highlight: z.boolean().default(false) });

const tableArtefact = z.object({
  kind: z.literal('table'),
  ...artefactBase,
  columns: z.array(z.string()).min(2),
  // The first cell of each row is its row header.
  rows: z.array(z.array(z.string())).min(1),
});
// Steps in order: a row of boxes on wide screens, a column on narrow ones.
const flowArtefact = z.object({ kind: z.literal('flow'), ...artefactBase, steps: z.array(diagramStep).min(2).max(7) });
// Steps narrowing down the page; a highlighted step marks where something was found.
const funnelArtefact = z.object({ kind: z.literal('funnel'), ...artefactBase, steps: z.array(diagramStep).min(2).max(7) });
// Checks tried in order: the first that matches decides; otherwise the last box applies.
const decisionArtefact = z.object({
  kind: z.literal('decision'),
  ...artefactBase,
  checks: z.array(z.object({ question: z.string(), yes: z.string() })).min(1).max(6),
  otherwise: z.string(),
});
// SPEC 5.4: one swimlane per state (current, future), 5 to 7 steps each, every step in a listed lane.
const swimlaneArtefact = z.object({
  kind: z.literal('swimlane'),
  ...artefactBase,
  lanes: z.array(z.string()).min(2).max(5),
  states: z
    .array(z.object({ title: z.string(), steps: z.array(z.object({ lane: z.string(), label: z.string() })).min(5).max(7) }))
    .min(1)
    .max(2),
});

const artefact = z.discriminatedUnion('kind', [tableArtefact, flowArtefact, funnelArtefact, decisionArtefact, swimlaneArtefact]);
export type Artefact = z.infer<typeof artefact>;
export type DiagramArtefact = Exclude<Artefact, { kind: 'table' }>;

// Case study frontmatter (SPEC 9.2, plus the page fields SPEC 4.3 needs). The body holds Context, The problem
// and What I did; the template places the artefacts, outcome and lessons after it.
export const workSchema = z
  .object({
    title: z.string(),
    slug,
    // The one-line outcome, on cards and under the page title.
    summary: z.string(),
    role: z.string(),
    organisation: z.string(),
    period: z.string(),
    // The metadata row's "team or stakeholders" (SPEC 4.3 item 1).
    team: z.string().optional(),
    tags: z.array(z.enum(TAGS)).min(1),
    roles: z.array(z.enum(ROLE_SLUGS)).min(1),
    // Optional: Performance Buddy has no outcome figure (SPEC 5.2). Any figure must be in SPEC 6.2.
    headlineFigure: z.string().optional(),
    order: z.number(),
    draft: z.boolean().default(false),
    glance: z.object({ problem: z.string(), role: z.string(), produced: z.string(), outcome: z.string() }),
    artefacts: z.array(artefact).min(1),
    // Paragraphs. SPEC 4.3 item 7: figures from SPEC 6.2 only, projected ones labelled.
    outcome: z.array(z.string()).min(1).max(3),
    // The "Build notes" box (SPEC 5.3 and 5.6).
    buildNotes: z.array(z.string()).min(1).optional(),
    learned: z.array(z.string()).min(2).max(3),
    furtherReading: z.array(z.object({ title: z.string(), url: z.url() })).min(1).optional(),
  })
  .superRefine((w, ctx) => {
    const ids = new Set<string>();
    w.artefacts.forEach((a, i) => {
      if (ids.has(a.id)) ctx.addIssue({ code: 'custom', path: ['artefacts', i, 'id'], message: `duplicate artefact id "${a.id}"` });
      ids.add(a.id);
      if (a.kind === 'table') {
        a.rows.forEach((row, r) => {
          if (row.length !== a.columns.length)
            ctx.addIssue({ code: 'custom', path: ['artefacts', i, 'rows', r], message: `${row.length} cells for ${a.columns.length} columns` });
        });
      }
      if (a.kind === 'swimlane') {
        a.states.forEach((s, si) =>
          s.steps.forEach((step, st) => {
            if (!a.lanes.includes(step.lane))
              ctx.addIssue({ code: 'custom', path: ['artefacts', i, 'states', si, 'steps', st, 'lane'], message: `"${step.lane}" is not in lanes` });
          }),
        );
      }
    });
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
