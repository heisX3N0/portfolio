# Backlog

Open work only. Done items move to `docs/backlog-done.md`. Phases come from SPEC.md Section 10; the owner approves each phase before the next starts.

- [ ] **P3 Case studies** (L)
  - **Why:** SPEC 10 phase 3; sections 4.2, 4.3, 5 and 7.
  - **Do:** `/work/` index with filter chips that work without JS, case study template, the 6 fact sheets, all artefacts as build-time SVG or HTML tables. Fix the `Figure` component first (found in the P1 design review): its `role="img"` wrapper hides anything inside it from screen readers, so tables need their own wrapper; and its 36rem minimum width makes every diagram scroll sideways on a phone, so the swimlane and decision flow get a vertical layout at narrow widths. Each case study card gets an artefact thumbnail (the P1.5 card slot).
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
