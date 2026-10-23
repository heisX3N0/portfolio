# Backlog

Open work only. Done items move to `docs/backlog-done.md`. Phases come from SPEC.md Section 10; the owner approves each phase before the next starts.

- [ ] **P1.5 Visual identity** (L)
  - **Why:** the owner's design review of P1 (2026-10-23) found the site bland: every element has the same weight, colour appears only as thin lines, and the proof strip (the "10 seconds" test in SPEC 1.1) is five small equal-weight sentences. Measured on the live P1 site at 390×844: the header wraps to two rows (about 115px) before any content. Estimated from current spacing, not built: the BA hero as specced (header, name, title, positioning, supporting line, actions, 5-item proof strip) needs about 900px against 844, so P2 would fail the depth rule (SPEC 1.4). Settling the look once, before P2 builds three pages on it, is cheaper than restyling them later. Owner chose direction B (Statement) from two mock-ups: https://claude.ai/artifact/Lpwb5idcDP1jiF7mcKPXtm (private canvas).
  - **Do:** rebuild the design system in `tokens.css`, `global.css`, the components and `/styleguide/` to direction B. No new pages; P2 assembles these parts.
    - Tokens: ochre gold accent (light text `#7a5300`, tint `#f6ebcf`, on-navy `#e8c26a`, dark text `#e8c26a`, dark tint `#33290f`) replacing burnt orange; a deep navy hero surface `#172c49` with on-navy text (`#faf8f4`) and muted (`#c9d3e1`) tokens; the dark-mode hero band and proof panel (owner decisions below); `palette.ts` and its sync test updated to match.
    - Type: larger display scale for the hero h1 (about 62px desktop, 36px mobile); serif figures for proof numbers; small-caps gold title line; positioning line in the regular serif at weight 400 (no italic file).
    - Hero component (`Hero.astro`): navy band holding the header, name as h1, title line, positioning line, supporting line, "View my work" (gold, primary) and "Download CV" (outline), email and LinkedIn; on desktop a right-hand contact block with the role's contact line, email and LinkedIn; on mobile the supporting line moves below the proof strip. Headshot slot (SPEC 8) designed in both states, flag off by default.
    - Proof strip component: figure first (large serif, tabular figures), description underneath; desktop is a white panel overlapping the bottom of the hero band, 5 columns; mobile is a 5-row list with the figure on the left. Items come from content, so P2 only supplies data.
    - Header: one row at 360px wide (monogram "BO" on mobile); CV shown as the emphasised item, labelled "CV (PDF)" on desktop; theme toggle becomes an icon button whose accessible name says what it does ("Switch to dark theme" / "Switch to light theme") and whose state is not shown by colour alone; "Contact" links to `#contact`.
    - Contact section component (`#contact`), on every page via the layout: contact line, email shown as text, LinkedIn, Download CV. Replaces the header's mailto (owner decision).
    - Card: figure first, title, one-line outcome, tags, and a slot for an artefact thumbnail that P3 fills.
    - Layout: footer sits at the bottom on short pages (min-height layout); fix the footer separator that dangles at the end of a line on mobile.
    - Fonts: preload the serif (the h1 is the largest text above the fold) as well as Inter; fix the `/fonts/*` immutable-cache comment (rule: never change a file's content without changing its name) and give any replaced font file a new name.
    - `/styleguide/` shows every part above in light and dark, at desktop and mobile widths, using approved copy only.
    - Update `docs/infra-capacity.md`: the repo is public (no Actions minutes), font bytes per page, remove the "repo still private" overhead.
  - **Tests:** negative first:
    - a text and background pair under 4.5:1 (3:1 for large text and UI parts) in either theme, including on-navy and gold pairs, fails the palette test;
    - at 1366×768 and 390×844, the h1, the proof strip and "Download CV" each sit inside the first screen of `/styleguide/`'s hero sample, or the check fails (headless Chrome; tool chosen in the build);
    - the header wraps to a second row at 360px wide: fails;
    - the theme toggle with no accessible name, or a name that does not change with the theme: fails;
    - a page whose "Contact" link has no `#contact` target: fails;
    - horizontal page scroll at 360px on any built page: fails;
    - a page over 200 KB total transfer (SPEC 9.4): fails;
    - the existing dash, phone and sitemap checks still pass.
    Then the happy path: hero, proof strip, card, contact and header render in both themes; the theme toggle still works when `localStorage` throws; Lighthouse 95 in all four categories, mobile and desktop.
  - **Docs:** `SPEC.md` v3.1 (owner decisions below), `CLAUDE.md` (accent usage rule: what gold may and may not be used for; the hero dark-mode rule), `/styleguide/` as the living reference, `docs/infra-capacity.md`.
  - **Cost:** per page view: 0 builds, 0 Functions requests. Bytes: fonts stay at two files, Inter 48 KB and Source Serif 51 KB per first visit (measured, file sizes in `public/fonts/`), because the positioning line uses the regular serif rather than a third, italic file (about 50 KB whole, estimate). CSS grows by a few KB (estimate). Per push: 1 Pages build of 500 a month; about 5 to 10 pushes for this item (estimate). CI: 0 Actions minutes (repo is public). Users supported: unchanged (static assets have no request limit).
  - **Depends on:** nothing (P1 is merged and deployed).
  - **Owner decisions (2026-10-23):**
    - Dark mode keeps the hero band the same navy (`#172c49`) on the dark page, with a 1px bottom edge (`#4a6890`, 3.2:1 against the page) so the band keeps its shape; the proof panel becomes a dark surface with a light-navy top rule. Reason: a lighter navy band measured only 1.25:1 against a dark page (computed), so luminance alone cannot separate them.
    - The positioning line uses the regular serif at weight 400, not italic: no third font file (an italic file is about 50 KB whole, estimate), one fewer request on the first screen. An italic subset can come later as a small change if the owner misses it.
    - SPEC goes to v3.1 in this PR, with a dated changelog line: SPEC 3 (Contact links to `#contact` on every page), SPEC 8 (gold is for the title line, the primary action, rules, highlights and tags; never body text or large fills), SPEC 4.1 (on mobile the supporting line may sit below the proof strip), SPEC 9.2 (the `howIWork` example field below).
    - "How I work" steps may each link to one case study that shows the step: an optional slug per step, shown as one small "Example:" line, rendered only when that case study is published. P2 adds the field; P3 fills it.
    - Direction B (Statement) from the two mock-ups; ochre gold as the warm accent (over burnt orange, which sits close to Access Bank's brand orange (Claude's reading, not checked against their brand guidelines), and over reds, which read as errors in test-result tables); on mobile the supporting line may drop below the proof strip to pass the depth rule; a contact section on every page, with the header's "Contact" jumping to it instead of opening a mail app; an admin editor (`/system` or a hosted Git-based editor) is parked until after launch, not on this backlog.

- [ ] **P2 Root, BA role page and About** (L)
  - **Why:** SPEC 10 phase 2; sections 4.0, 4.1, 4.4 and the content model in 9.2.
  - **Do:** content collections and Zod schemas for `site.yaml`, `about.md`, `experience.yaml`, `certifications.yaml`, `writing.yaml`, `roles/*.md`; role page template generated from content files; root page; About; BA CV link and inline serving; remove the P1 link-check exclusions (`PENDING_PATHS`) for `/business-analyst/`, `/about/` and the CV; add a naira-only font subset (a few KB) so `₦` renders in Inter without loading the 85 KB latin-ext file (found in P1). Pages are assembled from the P1.5 parts (hero, proof strip, cards, contact section), not restyled. "How I work" is an HTML and CSS flow (vertical on mobile), not an SVG, so it never scrolls sideways; each step takes an optional case study slug (SPEC 9.2 v3.1) and shows one "Example:" line only when that case study is published.
  - **Tests:** negative first: a role with `published: false` is not built, linked or in the sitemap; a role page linking to another role page fails; a proof strip with more than 5 items fails the schema; a missing CV file shows a `TODO(owner)` and the build report lists it. Then the happy path for each section.
  - **Docs:** README content editing notes.
  - **Cost:** to be written when scoped.
  - **Depends on:** P1.5.
  - **Open questions for the owner:** the BA CV PDF (`public/cv/business-analyst.pdf`) must be added by the owner.

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
