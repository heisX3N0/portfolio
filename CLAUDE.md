# Portfolio site (boluwatife.olapade.site)

Static Astro site built from `SPEC.md`. The spec is the source of truth for scope, content and quality. The owner's global rules (agent-vault `CLAUDE.md`, rules version 2026-10-22) apply on top; this file adds project rules and takes precedence where they differ.

## Commands

- Install: `corepack pnpm install` (pnpm is pinned in `package.json` `packageManager`; Node in `.nvmrc`)
- Dev server: `corepack pnpm dev`
- Type check: `corepack pnpm check`
- Build: `corepack pnpm build` (output in `dist/`)
- Tests: `corepack pnpm test` (runs the checks in `scripts/` against `dist/`; build first)
- Lighthouse: `corepack pnpm lhci` (needs Chrome; CI runs it on every PR)
- Gates before every commit: `check`, `build`, `test`.

## Content rules (from SPEC.md, enforced in review)

- Never invent facts, figures, employers, clients or results. Every claim traces to SPEC Section 6. Numbers: only those in SPEC 6.2. Missing content gets a visible `TODO(owner): ...` marker and goes in the build report.
- No em or en dashes anywhere, including content from the spec: write "Mar 2024 to Present", "76 to 79" (owner decision 2026-10-23).
- British English in site copy (organisation, prioritise, modelling).
- The phone number never appears on the site. No Access Bank internal material in the repo.
- Role pages never link to each other. Unpublished roles are not built, linked or listed. No "coming soon".
- Style-guide sample text uses approved copy from the spec only, so the figures check never trips on made-up numbers.

## Design rules (direction B, P1.5; SPEC 8 v3.1)

- `/styleguide/` is the living reference: build pages from its parts (`Hero`, `ProofStrip`, `Card`, `ContactSection`), not new one-off styles.
- Colours come from `tokens.css` only. Every foreground and background pair goes in `pairs` in `src/lib/palette.ts`; the palette test fails any pair under 4.5:1 (3:1 for UI parts) in either theme.
- Ochre gold (`--gold`, `--on-hero-gold`) is for the title line, the one primary action on the navy band, rules, highlights and tags. Never body text or large fills.
- The header and hero band are the same navy (`--hero-bg`) in both themes. In dark mode the band keeps its shape through the 1px `--hero-edge`, not a lighter band (a lighter navy is only 1.25:1 against the dark page).
- The browser test (`scripts/tests/browser.test.mjs`) needs Chrome or Edge; set `CHROME_PATH` if neither is in a standard place. It checks the first screen at 1366x768 and 390x844, the one-row header at 360px, no sideways scroll, the toggle's name, `#contact` and the 200 KB budget.

## Gotchas

- On the owner's Windows machine, Application Control blocks Astro's native compiler (`astro.win32-x64-msvc.node`). Don't change that setting. Run locally with the official WebAssembly build instead: install `@astrojs/compiler-binding-wasm32-wasi` (same version as `@astrojs/compiler-binding`) with npm in a folder outside the repo, then set `NAPI_RS_FORCE_WASI=1` and `NODE_PATH=<that folder>/node_modules` for `check`, `build` and `dev`. CI and Cloudflare use the native binary.
- `astro check` doesn't support TypeScript 7 yet: TypeScript stays on 6.
- The theme toggle is an inline script in `BaseLayout.astro` (it must run before paint to avoid a flash). When the CSP lands (P4), its hash must be in `script-src`.
- `₦` is outside the fonts' basic Latin subset; the latin-ext subset is loaded on demand by `unicode-range`. Check it renders after any font change.
- `/styleguide/` must stay out of the sitemap (a test checks this).
- Link check: `/business-analyst/`, `/work/`, `/about/` and `/cv/business-analyst.pdf` are excluded until P2 and P3 build them (`PENDING_PATHS` in `scripts/lib/checks.mjs`). Remove each in the PR that builds it. Internal links are checked by `pnpm test`; lychee in CI checks external links only.
- The figures check (P4) must exempt `/styleguide/`: it shows hex codes and contrast ratios.

## Workflow

- Backlog: `BACKLOG.md` (open work only). Done archive: `docs/backlog-done.md`.
- Review: this repo can't call agent-vault's private shared review workflow once it is public, so run `/code-review` on the diff before opening each PR and put the findings in the PR.
- Hosting: Cloudflare Pages on its own Cloudflare account (not the X3N0 account), Git integration, preview deploy per PR. No Functions or Workers.

## Infrastructure cost

Read `docs/infra-capacity.md` before adding anything that uses a limited resource (builds, CI minutes, page weight). Every backlog item and PR has a Cost line that cites it.
