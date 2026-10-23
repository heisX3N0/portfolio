# Infrastructure capacity and low-overhead design

The portfolio site runs entirely on free plans until the owner decides otherwise. This doc records where each free limit runs out, what each user action costs, and the principles that keep those costs low. Read it before adding anything that uses a limited resource (a build, CI minutes, page weight, a third-party request), and use the checklist at the end in the pull request.

Last reviewed: 2026-10-23 (branch `feat/p2-role-page`, P2). Each number says whether it was measured (with the sample) or estimated (from what). Re-check against real usage (see [Measuring](#measuring)) and update this doc in the same PR whenever the infrastructure changes.

This site uses its **own Cloudflare account**, separate from the X3N0 account that hosts Aimery and Merge X (SPEC 9.1), so its Cloudflare limits are not shared. The repository is public, so its GitHub Actions runs on standard Linux runners are free and do not count against the owner's shared 2,000 minutes (agent-vault `skills/infra-capacity/shared-quotas.md`).

## When each piece hits its limit

A typical visit: a recruiter opens a role page, maybe a case study and the CV. Every response is a static file from Cloudflare's network. That is about **0 builds, 0 Functions requests and 0 Actions minutes per visit**. Builds and CI minutes only grow with the owner's own pushes.

| Service | Free limit | What we use | Breaks at about |
| --- | --- | --- | --- |
| Cloudflare Pages static requests and bandwidth | No limit listed (Pages limits page, read 2026-10-23) | Every page view (estimate: about 5 to 10 files per page) | Not a wall |
| Cloudflare Pages builds | 500 a month, 1 at a time, 20 minute timeout (same source) | 1 per push to any branch (estimate, from Git integration behaviour) | About 500 pushes a month; the owner's own work, not users |
| Cloudflare Pages files | 20,000 per site, 25 MiB per file (same source) | 17 files in `dist/` after P2, counted (the CV PDF is one) | Not near |
| `_headers` rules | 100 rules, 2,000 characters per header (same source) | 1 rule after P1; about 3 to 5 after P4 (estimate) | Not near |
| GitHub Actions minutes | Free and uncounted for public repos on standard runners | About 4 to 6 minutes per CI run (estimate: install, build, tests including the headless Chrome layout checks, link check, Lighthouse on 3 pages; not measured yet) | Not a wall while the repo is public |
| Cloudflare Web Analytics (from P4) | Free; cookieless | 1 beacon request per page view (from Cloudflare's docs) | Not a wall |

**In user terms:** no free limit caps visitors. A static Pages site has no listed request or bandwidth limit, so the number of users supported is not limited by any free quota. The only wall is the owner's own: Pages builds (500 a month).

### What each action costs

| Action | Pages builds | Actions minutes | Bytes to visitor |
| --- | --- | --- | --- |
| Visitor opens a page | 0 | 0 | About 106 to 115 KB on a first visit (measured, gzip, one load each of `/`, `/business-analyst/`, `/about/`, `/styleguide/` and `/404.html` at 390x844, P2); the browser test fails any page over 200 KB (SPEC 9.4) |
| Visitor opens the CV | 0 | 0 | 60,495 bytes (the PDF; outside the 200 KB page budget, SPEC 9.4) |
| Owner pushes to a PR branch | 1 | 1 CI run (0 minutes counted: public repo) | 0 |
| Owner merges to `main` | 1 | 0 (CI runs on PRs only) | 0 |

## Known overheads to fix

None open. (The repo was private until P1; it is now public, so CI minutes no longer count.)

### Page weight, first visit (measured P2, one load each, gzip on a local server, 390x844)

| File | Bytes | Notes |
| --- | --- | --- |
| `inter-latin.woff2` | 48,556 | Preloaded; every page |
| `source-serif-4-latin.woff2` | 51,236 | Preloaded from P1.5 (the h1 is serif); every page |
| `inter-naira.woff2`, `source-serif-4-naira.woff2` | about 1,550 each (1,260 and 1,232 on disk) | Only on a page that shows ₦ in that family (P2) |
| Site CSS (`BaseLayout` bundle) | 3,436 | Every page |
| Card CSS | 1,740 | Pages with cards |
| Style guide CSS | 2,098 | `/styleguide/` only |
| HTML | 2,620 to 8,760 | `/404.html` smallest, `/styleguide/` largest; `/business-analyst/` 5,828, `/about/` 6,186 |

Fonts are about 88% to 94% of a first visit and are cached for a year after it (`_headers`). The positioning line uses the regular serif rather than a third, italic file (about 50 KB, estimate), and `₦` comes from a naira-only file per family (about 1.2 KB) rather than the latin-ext subset (85 KB for Inter, 42 KB for the serif), so the BA page (serif ₦ in the proof strip) loads about 41 KB less and `/about/` (Inter ₦ in the timeline) about 84 KB less (computed from the file sizes on disk, not measured per page).

## Upgrade order

Nothing here is expected to need paid capacity. If builds ever ran out, the first step would be fewer pushes (batch commits), not a paid plan. Every paid step is an owner decision.

## Principles

1. **Price every change before building it.** Per visit: files and bytes. Per push: builds and CI minutes.
2. **The scarcest resource is the visitor's first screen and page weight.** Fonts are the largest asset: at most 2 self-hosted families, subset by `unicode-range`. No client-side libraries; diagrams render at build time.
3. **No runtime.** No Functions, Workers, forms or databases (SPEC 9.1). Anything dynamic is a content edit and a rebuild.
4. **CI earns its minutes.** One workflow per PR, cached pnpm store, Lighthouse on a few representative pages, not every page.
5. **Free limits are per account, not per user.** Previews, production and the owner's experiments share the 500 builds.

## Measuring

- Pages builds: Cloudflare dashboard, Workers and Pages, the project, Deployments (count per month). Works on a phone.
- Actions minutes: not counted while the repo is public (GitHub, Settings, Billing and plans, Usage, to confirm).
- Page weight: `pnpm test` (the browser test sums each page's transfer and fails over 200 KB); Lighthouse reports in CI give the same per page.

## PR checklist (infrastructure cost)

- [ ] Listed per visit and per push: builds, CI minutes and bytes
- [ ] Page weight stays under 200 KB per page (SPEC 9.4)
- [ ] No new third-party script or runtime
- [ ] CI changes don't add a job that runs on every push without need
- [ ] The capacity effect is stated: users supported unchanged, or the new first wall
- [ ] This doc updated if a number changed

## Sources

Free-plan figures checked on 2026-10-23: [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/). Actions minutes: agent-vault `skills/infra-capacity/shared-quotas.md` (owner's billing screenshot, 2026-10-21).
