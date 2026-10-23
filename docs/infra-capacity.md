# Infrastructure capacity and low-overhead design

The portfolio site runs entirely on free plans until the owner decides otherwise. This doc records where each free limit runs out, what each user action costs, and the principles that keep those costs low. Read it before adding anything that uses a limited resource (a build, CI minutes, page weight, a third-party request), and use the checklist at the end in the pull request.

Last reviewed: 2026-10-23 (branch `feat/p1-scaffold`, before first merge). Each number says whether it was measured (with the sample) or estimated (from what). Re-check against real usage (see [Measuring](#measuring)) and update this doc in the same PR whenever the infrastructure changes.

This site uses its **own Cloudflare account**, separate from the X3N0 account that hosts Aimery and Merge X (SPEC 9.1), so its Cloudflare limits are not shared. GitHub Actions minutes are shared with the owner's other private repos while this repo is private (agent-vault `skills/infra-capacity/shared-quotas.md`); once it is public, its Actions runs are free and not counted.

## When each piece hits its limit

A typical visit: a recruiter opens a role page, maybe a case study and the CV. Every response is a static file from Cloudflare's network. That is about **0 builds, 0 Functions requests and 0 Actions minutes per visit**. Builds and CI minutes only grow with the owner's own pushes.

| Service | Free limit | What we use | Breaks at about |
| --- | --- | --- | --- |
| Cloudflare Pages static requests and bandwidth | No limit listed (Pages limits page, read 2026-10-23) | Every page view (estimate: about 5 to 10 files per page) | Not a wall |
| Cloudflare Pages builds | 500 a month, 1 at a time, 20 minute timeout (same source) | 1 per push to any branch (estimate, from Git integration behaviour) | About 500 pushes a month; the owner's own work, not users |
| Cloudflare Pages files | 20,000 per site, 25 MiB per file (same source) | Under 100 files after P1 (estimate) | Not near |
| `_headers` rules | 100 rules, 2,000 characters per header (same source) | 1 rule after P1; about 3 to 5 after P4 (estimate) | Not near |
| GitHub Actions minutes (shared while private) | 2,000 a month across private repos; Linux runners | About 4 to 6 minutes per CI run (estimate: install, build, link check, Lighthouse on 3 pages; not measured yet) | While private: about 15 to 25 CI runs eat 100 minutes of a quota already near 70% (shared-quotas.md, 21 Oct). Public: no limit |
| Cloudflare Web Analytics (from P4) | Free; cookieless | 1 beacon request per page view (from Cloudflare's docs) | Not a wall |

**In user terms:** no free limit caps visitors. A static Pages site has no listed request or bandwidth limit, so the number of users supported is not limited by any free quota. The only walls are the owner's own: Pages builds (500 a month) and, while the repo is private, shared Actions minutes.

### What each action costs

| Action | Pages builds | Actions minutes | Bytes to visitor |
| --- | --- | --- | --- |
| Visitor opens a page | 0 | 0 | Under 200 KB per page (SPEC 9.4 budget; measured per phase in the build report) |
| Owner pushes to a PR branch | 1 | 1 CI run (about 4 to 6 if private, 0 if public; estimate) | 0 |
| Owner merges to `main` | 1 | 0 (CI runs on PRs only) | 0 |

## Known overheads to fix

| Overhead | Cost today | Fix | Backlog ID |
| --- | --- | --- | --- |
| Repo still private | CI minutes count against the shared 2,000 | Owner makes the repo public after reviewing `SPEC.md` | P1 owner decision |

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
- Actions minutes: GitHub, Settings, Billing and plans, Usage (only matters while private).
- Page weight: the build report lists transfer size per page from Lighthouse (`lhci` output).

## PR checklist (infrastructure cost)

- [ ] Listed per visit and per push: builds, CI minutes and bytes
- [ ] Page weight stays under 200 KB per page (SPEC 9.4)
- [ ] No new third-party script or runtime
- [ ] CI changes don't add a job that runs on every push without need
- [ ] The capacity effect is stated: users supported unchanged, or the new first wall
- [ ] This doc updated if a number changed

## Sources

Free-plan figures checked on 2026-10-23: [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/). Actions minutes: agent-vault `skills/infra-capacity/shared-quotas.md` (owner's billing screenshot, 2026-10-21).
