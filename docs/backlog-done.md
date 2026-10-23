# Done archive

Finished backlog items, newest first, with what shipped, owner decisions (dated) and deviations.

- [x] **P4 SEO, analytics and hardening** (M). Merged 2026-10-23 in `9b6444b` ([PR #6](https://github.com/heisX3N0/portfolio/pull/6); commits `7edac54`, `a067a75`).
  - **Shipped:**
    - Open Graph and Twitter card tags on every page with a canonical URL (none on 404). Person JSON-LD on the root page, About and each role page (`jobTitle` on role pages only, the CV title); Article JSON-LD on each case study. `robots.txt` generated from the site URL.
    - OG images drawn at build (satori, WebAssembly resvg): `/og/business-analyst.png` and `/og/site.png`. Unpublished roles get none.
    - `public/_headers`: CSP (self, the theme script's hash, Cloudflare Web Analytics; no `'unsafe-inline'`), HSTS, nosniff, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. The CV PDFs drop the CSP. Stylesheets are never inlined; no element has a style attribute.
    - Cloudflare Web Analytics beacon on every page. The browser test and Lighthouse block its report URL, so CI visits never count.
    - Figures check (SPEC 9.4): visible text, meta descriptions, `og:image:alt` and JSON-LD text against an allow-list parsed from the SPEC 6.2 table.
    - The browser test serves every page with the real CSP and fails on any violation; it caught the theme script's hash being taken over Windows CRLF bytes. Lighthouse now also runs on the BA page.
    - 140 tests (24 new). CI green on `a067a75`. Lighthouse 100 in every category on 6 pages, mobile and desktop (local, one run each). The production deploy of `9b6444b` succeeded: I checked all six security headers and the CSP hash, robots.txt, both OG images (41,542 and 35,794 bytes as built on Linux; 37,332 and 30,830 locally on Windows), the CV rule (`noindex`, no CSP), and in a browser the BA page on `boluwatife-portfolio.pages.dev`: theme script ran, beacon sent its report, no console errors.
  - **Owner decisions (2026-10-23):**
    - Analytics as a snippet in code, token in `site.yaml`. The Web Analytics site was created for `boluwatife-portfolio.pages.dev`; check the custom domain reports after P5.
    - OG images generated at build.
    - One site-wide OG image for every page that is not a role page.
  - **Deviations:**
    - 4 new packages, not the 2 first described: the woff fonts come from `@fontsource/inter` and `@fontsource/source-serif-4`.
    - Figures check exemptions beyond SPEC 9.4: sequence labels, zero-padded identifiers, digits after a letter. Years are exempt only in a year context.
    - Role slugs `og` and `site` are reserved.
    - The P4 item had no Tests or Cost line when picked up; the PR wrote both (negative cases first).
    - `/code-review` (high) found 10 issues: 9 fixed before the PR, the 10th (beacon untested under the CSP) fixed once the token arrived.

- [x] **P3 Case studies** (L). Merged 2026-10-23 in `266b19f` ([PR #5](https://github.com/heisX3N0/portfolio/pull/5); commits `a3e5f4c`, `dec15d1`, `9eb89fb`).
  - **Shipped:**
    - Six case study pages from one template (SPEC 4.3), written only from the SPEC 5 fact sheets: header and metadata, At a glance, Context, The problem, What I did, Artefacts, Outcome, build notes, What I learned, further reading, previous and next.
    - `/work/` with All, Banking and AI products filters: plain links and CSS `:target`, so they work without JavaScript.
    - Artefacts as frontmatter data (`table`, `flow`, `funnel`, `decision`, `swimlane`), drawn at build time by `src/lib/diagrams.ts`. Each diagram is drawn wide and narrow, the figure shows the one that fits, and the text alternative is generated from the same data.
    - The P1 design review fix: `Figure` no longer scrolls sideways, and tables have their own `ArtefactTable` outside `role="img"`.
    - Artefact thumbnails on every case study card (`WorkCard`).
    - Checks: `findLiveClaims` (Performance Buddy) and `findUnlabelledProjections` (aggregator). `PENDING_PATHS` is empty.
    - 116 tests, 43 of them new. CI green on `9eb89fb`. Lighthouse 100 in every category on `/work/` and the aggregator case study, mobile and desktop (local, one run each). The production deploy of `266b19f` succeeded; I checked all eight new pages, the sitemap (10 URLs) and the projected-figures sentence on the live site.
  - **Owner decisions (2026-10-23):**
    - Copy approved as written, including the parts beyond the fact sheets' own words: the GPT Investor funnel steps, success metric and second lesson; the aggregator swimlane steps; the Merge X failure table; the Closa "Apply both limits per day" row; the Performance Buddy "Regional leader" row; the Aimery acceptance criteria; the Team fields; the `/work/` introduction.
    - Shorter case studies accepted: aggregator (478 words), Merge X (510) and GPT Investor (about 480) stay under SPEC 4.3's 600-word target. The test floor is 450.
  - **Deviations:**
    - Case study files stay `.md`, not SPEC 9.2's `.mdx`: artefacts are data, not components in the body.
    - The P3 item had no Tests or Cost line when picked up; the PR wrote both (negative cases first).
    - The fact sheet's lesson "the riskiest bugs live in data quality" became "sit in", so the live-claim check needs no exception.
    - Lighthouse gained `/work/` and one case study. The BA page and About are still not in the Lighthouse list (that predates P3).
    - `/code-review` (high) found 8 issues: 5 fixed, 2 settled by the owner, 1 left (the projection check can't judge meaning).

- [x] **P2 Root, BA role page and About** (L). Merged 2026-10-23 in `6a321a6` ([PR #4](https://github.com/heisX3N0/portfolio/pull/4); commit `8b5515e`).
  - **Shipped:**
    - Content collections with Zod schemas in `src/lib/schemas.ts`: site, roles, work (card fields only), about, experience, certifications, writing.
    - Role pages generated from `roles/*.md`. The PM and Product files are `published: false`, so they are not built, linked or listed.
    - Root page (hero without a proof strip, role cards, 3 selected case studies from `site.yaml`) and About (bio, timeline in CV order, certifications, education, `#how-this-site-was-built`, full writing list).
    - "How I work" as an HTML list with "Example:" links, and the Writing part.
    - The BA CV at `/cv/business-analyst.pdf` (served inline and noindex), with a visible `TODO(owner)` and a build report line if it goes missing.
    - Naira-only font files (1,260 and 1,232 bytes) instead of the latin-ext subsets.
    - YAML lists keep file order through a loader `position`.
    - `PENDING_PATHS` now lists only `/work/` and the six case study pages.
    - 73 tests, 26 of them new. CI green on `8b5515e`, including Lighthouse. The production deploy of `6a321a6` succeeded; I checked the live pages, CV headers and sitemap.
  - **Owner decisions (2026-10-23):**
    - CV: use the CV attached in chat, and keep it in the public repo as SPEC 4.5 says, phone number and git history included.
    - Copy approved as written: the About bio, "How this site was built", the six card summaries and figures ("79 to 80" for Aimery), the timeline highlights, and the root introduction's second sentence (from the BA supporting line).
    - "How I work": examples mapped as Discover to GPT Investor, Model to Aggregator, Specify to Performance Buddy, Deliver to Closa and Validate to Aimery, with one line per step and no artefacts line.
    - Performance Buddy role label: "Project Manager and Business Analyst".
  - **Deviations:**
    - P2 added the six case study files (card fields only) so Selected work and the examples could render. Their `/work/<slug>/` links 404 until P3.
    - `headlineFigure` and `artefacts` are optional (SPEC 9.2 lists both as required).
    - `yaml` 2.9.1 became a direct dependency; it was already installed through Astro.
    - A test caught the missing-CV check resolving `public/` from the bundle path; it now uses `process.cwd()`.
    - `/code-review` (high) found 9 issues: 5 fixed, 1 settled by the owner (the CV), 3 left as low risk (listed in the PR).

- [x] **P1.5 Visual identity** (L). Merged 2026-10-23 in `c20cf05` ([PR #3](https://github.com/heisX3N0/portfolio/pull/3); commits `8cf055c`, `9c993fe`).
  - **Shipped:** direction B design system. Ochre gold accent and a navy header and hero band, the same navy in dark mode with a 1px `#4a6890` edge. New components: `Hero`, `ProofStrip` (figure first; a 5-column panel overlapping the band on desktop, a 5-row list on mobile), `ContactSection` on every page (the header's Contact jumps to `#contact`) and `Icon`. The header fits one row from 360px, with a "BO" monogram on mobile and an icon theme toggle named for its action. Cards lead with the figure and have a thumbnail slot. Also: a min-height layout, a footer with no dangling separator, the serif preloaded, and `/styleguide/` opening with the BA first screen. Checks: `pairs` and `contrastFailures` in `palette.ts` (every pair at WCAG AA in both themes), and headless Chrome layout checks in `pnpm test` (first screen at 1366x768 and 390x844, a one-row header at 360px, no sideways scroll, the toggle name, `#contact`, the 200 KB budget). 47 tests in all, 20 of them new. SPEC v3.1. CI green on `9c993fe`, including Lighthouse 95 assertions on mobile and desktop.
  - **Owner decisions (2026-10-23):** direction B; ochre gold over burnt orange and reds; the same navy band in dark mode with a visible edge; the positioning line in the regular serif, so no italic file; the supporting line below the proof strip on mobile; a contact section on every page; SPEC v3.1 in the same PR; optional "How I work" example links (P2 adds the field); the admin editor parked until after launch. This also settles P1's open question on the warm accent.
  - **Deviations:** proof items became `{ figure, text }`, using the approved words reordered (SPEC 4.1 and 9.2 v3.1); the mobile proof strip is a 5-row list, not the 2-column grid in SPEC v3; the style guide shows the headshot "on" state as a placeholder mock, because there is no image yet; the first-screen check was strengthened mid-build to require visibility (`elementFromPoint`) after it missed the band covering the hero text; Lighthouse was not run locally (Edge would not launch under `lhci`), so CI was its first run.

- [x] **P1 Scaffold and design system** (M). Merged 2026-10-23 in `bcef963` ([PR #1](https://github.com/heisX3N0/portfolio/pull/1)).
  - **Shipped:** Astro static project (pnpm 12.15.0, Node 24), base layout, header and footer, type scale and colour tokens, dark mode with a manual toggle that follows OS changes while no choice is stored, skip link, 404, `/styleguide/` (kept out of the sitemap), minimal `/`, sitemap. CI: install, type check, build, `pnpm test` (27 checks), external link check (lychee), Lighthouse 95 budgets. Cloudflare Pages on its own account, project `boluwatife-portfolio`, preview deploy per PR (owner set up 2026-10-23).
  - **Owner decisions (2026-10-23):** create `BACKLOG.md`, `CLAUDE.md` and `docs/infra-capacity.md` in this PR; make the repo public before CI first runs, after the owner reviews `SPEC.md`; no em or en dashes (global rule wins over the spec's en dashes); keep header links to `/work/`, `/about/` and the CV, excluded from the link check until P2 and P3; `/` shows name and root line only; Lighthouse runs against `dist` served locally in CI; style-guide samples use approved copy only; the warm accent is proposed on `/styleguide/` for approval; GitHub shows in the footer (SPEC 6.4 wins); "Last updated" comes from the last commit date; Cloudflare Pages project name `boluwatife-portfolio`.
  - **Deviations:** sitemap added now rather than in P4 (a test keeps `/styleguide/` out of it); fonts self-hosted as Latin-only files, so `₦` falls back to a system font until P2 adds a naira-only subset; TypeScript pinned to 6 (`astro check` doesn't support 7); README carries the Cloudflare setup steps now; the theme `localStorage` test was seen failing only after review (finding 7); lychee excludes `https://xmusings.substack.com/` because Substack returns 403 to GitHub's runners (`6041568`), so Substack links are checked by hand.
  - **Still open for the owner:** approve the warm accent on `/styleguide/` (PR #1 manual test 2).
