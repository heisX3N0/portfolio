# Backlog

Open work only. Done items move to `docs/backlog-done.md`. Phases come from SPEC.md Section 10; the owner approves each phase before the next starts.

- [ ] **P1 Scaffold and design system** (M)
  - **Why:** SPEC Section 10, phase 1. Every later page needs the layout, tokens, dark mode, CI and a preview deploy first.
  - **Do:** Astro static project (pnpm, `.nvmrc`), base layout, header and footer (SPEC 3), type scale, colour tokens, dark mode with a manual toggle (SPEC 8), skip link, 404 (SPEC 4.6), `/styleguide/` showing type, colours, cards, tags, figure and table styles (kept out of the sitemap), minimal `/` with the approved root line, CI (install, type check, build, link check, Lighthouse 95 budgets), Cloudflare Pages preview.
  - **Tests:** negative first: a broken internal link fails the link check; `/styleguide/` in the sitemap fails; a phone number pattern in built HTML fails; an em or en dash in visible text fails; the theme toggle still works when `localStorage` throws; a Lighthouse score under 95 fails CI. Then: 404 renders with links to Home, Work and the BA page; every page has one `main`, a skip link and a unique title; no horizontal scroll at 360px.
  - **Docs:** `CLAUDE.md`, `BACKLOG.md`, `docs/infra-capacity.md`, README Cloudflare setup steps.
  - **Cost:** per page view: 0 builds, 0 Functions requests (static). Per push to a PR branch: 1 Pages build of 500 a month on the new account. CI: 0 Actions minutes if the repo is public; about 4 to 6 minutes a run if it stays private (estimate, not measured). Users supported: not limited by any free quota (static assets have no request limit). $0.
  - **Depends on:** nothing.
  - **Owner decisions (2026-10-23):** create `BACKLOG.md`, `CLAUDE.md` and `docs/infra-capacity.md` in this PR; make the repo public before CI first runs, after the owner reviews `SPEC.md`; no em or en dashes (global rule wins over the spec's en dashes); keep header links to `/work/`, `/about/` and the CV, excluded from the link check until P2 and P3; `/` shows name and root line only; Lighthouse runs against `dist` served locally in CI; style-guide samples use approved copy only; the warm accent is proposed on `/styleguide/` for approval; GitHub shows in the footer (SPEC 6.4 wins); "Last updated" comes from the last commit date.

- [ ] **P2 Root, BA role page and About** (L)
  - **Why:** SPEC 10 phase 2; sections 4.0, 4.1, 4.4 and the content model in 9.2.
  - **Do:** content collections and Zod schemas for `site.yaml`, `about.md`, `experience.yaml`, `certifications.yaml`, `writing.yaml`, `roles/*.md`; role page template generated from content files; root page; About; BA CV link and inline serving; remove the P1 link-check exclusions (`PENDING_PATHS`) for `/business-analyst/`, `/about/` and the CV; add a naira-only font subset (a few KB) so `₦` renders in Inter without loading the 85 KB latin-ext file (found in P1).
  - **Tests:** negative first: a role with `published: false` is not built, linked or in the sitemap; a role page linking to another role page fails; a proof strip with more than 5 items fails the schema; a missing CV file shows a `TODO(owner)` and the build report lists it. Then the happy path for each section.
  - **Docs:** README content editing notes.
  - **Cost:** to be written when scoped.
  - **Depends on:** P1.
  - **Open questions for the owner:** the BA CV PDF (`public/cv/business-analyst.pdf`) must be added by the owner.

- [ ] **P3 Case studies** (L)
  - **Why:** SPEC 10 phase 3; sections 4.2, 4.3, 5 and 7.
  - **Do:** `/work/` index with filter chips that work without JS, case study template, the 6 fact sheets, all artefacts as build-time SVG or HTML tables.
  - **Tests:** to be written when scoped (negative first: Performance Buddy described as live fails; projected aggregator figures unlabelled fails).
  - **Depends on:** P2.

- [ ] **P4 SEO, analytics and hardening** (M)
  - **Why:** SPEC 10 phase 4; sections 9.3 to 9.5.
  - **Do:** sitemap, robots, canonical and OG tags, JSON-LD, OG images per role page, Cloudflare Web Analytics, security headers and CSP (include the theme script hash), the figures check in CI.
  - **Depends on:** P3.

- [ ] **P5 Launch (v1)** (M)
  - **Why:** SPEC 10 phase 5 and the Section 11 checklist.
  - **Do:** connect the domain (owner applies the Namecheap CNAME), Search Console, final QA, full README.
  - **Depends on:** P4.

P6 (Project Manager role page) and P7 (Product Manager role page) are not on the backlog until the owner supplies each spec addendum and CV (SPEC 10).
