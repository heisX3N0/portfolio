# Portfolio

Source for `boluwatife.olapade.site`: a static Astro site built from [SPEC.md](SPEC.md). Editing content, adding a case study and replacing a CV are below; the rest of the owner guide (the headshot, deploying) arrives in P5.

## Run it locally

Needs Node 24 (`.nvmrc`) and corepack (ships with Node).

```bash
corepack pnpm install
corepack pnpm dev        # http://localhost:4321
corepack pnpm check      # type check
corepack pnpm build      # static site in dist/
corepack pnpm test       # checks against dist/ (build first)
corepack pnpm lhci       # Lighthouse, mobile then desktop (needs Chrome)
```

The style guide is at `/styleguide/`.

## Editing content

Every word on the site lives in `src/content/`. Edit a file, push, and the site rebuilds. The build fails with a message naming the file and field if something doesn't fit its schema (`src/lib/schemas.ts`), so a typo can't publish a broken page.

| File | What it holds | Shown on |
| --- | --- | --- |
| `site.yaml` | Name, root line and introduction, the root page's 3 selected case studies, email, LinkedIn, GitHub, Substack, location, default CV, headshot switch | Every page |
| `roles/business-analyst.md` | The BA role page: title (must match the CV), short title and share description for search results and link previews, positioning and supporting lines, proof strip, "How I work", tools, featured case studies, CV file, contact line | `/business-analyst/` |
| `roles/project-manager.md`, `roles/product-manager.md` | `published: false` until each role's spec addendum and CV exist | Nowhere |
| `work/*.md` | One case study each: the card (title, one-line outcome, tags, figure) and the page (metadata, At a glance, the body, artefacts, outcome, build notes, lessons, further reading) | `/work/<slug>/`, `/work/`, role page and `/` cards |
| `about.md` | The bio (below the `---` lines), "How this site was built", education | `/about/` |
| `experience.yaml` | The timeline: role, organisation, dates, 2 to 3 highlights | `/about/` |
| `certifications.yaml` | Name, issuer and badge link | `/about/` |
| `writing.yaml` | Substack groups and posts | Role page (3 newest per group), `/about/` (all) |

Rules the content must follow (SPEC.md): every number must be in SPEC 6.2; no em or en dashes (write "Mar 2024 to Present"); British spelling; never the phone number.

- **Order:** lists show in the order they are in the file. Move an entry up or down to reorder it.
- **YAML text with a colon and a space** (`like: this`) must go in quotes, or on the next line after `>-` as in `about.md`.
- **Role pages:** a role file with `published: false` is not built, linked or listed. To publish one, fill in every field as in `business-analyst.md` (the build says which are missing) and set `published: true`. Role pages never link to each other.
- **Search and share text (role pages):** `shortTitle` replaces the CV title in the browser tab, search results and link previews ("Boluwatife Olapade | Business Analyst"). It must be the first part or parts of `title`, split at " | ", and at most 60 characters. `shareDescription` (at most 160 characters) replaces `supporting` in the same places. Both are optional: leave them out and the page uses `title` and `supporting`. The hero, OG image and JSON-LD always show the full `title`.
- **"How I work" examples:** a step's `example` is a case study file name (without `.md`). Its "Example:" line shows only while that case study is published.
- **Case studies:** `draft: true` keeps one out of the live site. `order` sets the order on `/work/` and the previous and next links. See "Add a case study" below.

## Add a case study

Copy a file in `src/content/work/` (`closa-cbn-compliance.md` is a short one), rename it to the new slug, and edit it. Above the second `---` line is the frontmatter; below it is the body.

- **The body** has three `##` sections, in this order: `Context`, `The problem`, `What I did`. The page adds the rest (At a glance, Artefacts, Outcome, What I learned, previous and next).
- **`glance`:** the four At a glance lines: `problem`, `role`, `produced`, `outcome`.
- **`outcome`** (1 to 3 paragraphs), **`learned`** (2 to 3 bullets), and the optional **`buildNotes`** and **`furtherReading`**. In `outcome`, `buildNotes` and `learned`, `[text](https://...)` becomes a link.
- **`artefacts`** (at least one). Each has an `id` (unique in the file), a `caption`, and a `label` (`Illustrative`, `Simplified` or `Illustrative, simplified`) when it is sanitised. The first artefact's kind sets the card's thumbnail. The kinds:
  - `table`: `columns` and `rows`; the first cell of each row is its heading. Four or more columns scroll sideways on a phone.
  - `flow`: 2 to 7 `steps` in order, each a `label` with an optional `note` and `highlight: true`.
  - `funnel`: the same kind of steps, drawn narrowing down the page.
  - `decision`: `checks` (each a `question` and what happens if `yes`), tried in order, then `otherwise`.
  - `swimlane`: `lanes`, then one or two `states`, each a `title` and 5 to 7 steps that name their `lane`.

Diagrams are drawn at build time, wide and narrow, with a text description written from the same data, so there is nothing to draw by hand. Keep step labels to a few words: `pnpm test` fails a label that doesn't fit its box.

## Replace a CV

Each role's CV is `public/cv/<role>.pdf` (the BA one is `public/cv/business-analyst.pdf`). Replace the file, keeping its name, and push: links never change. CVs open in the browser and are kept out of search results (`public/_headers`). If a role's CV file is missing, its page shows a `TODO(owner)` line and the build output lists it.

The CV PDF contains your phone number. The repository is public, so the file (and every earlier version of it, in the git history) can be downloaded from GitHub as well as from the site.

## Fonts

Inter and Source Serif 4 are self-hosted Latin files in `public/fonts/`. The naira sign is not in them, so each family has a naira-only file (`inter-naira.woff2`, `source-serif-4-naira.woff2`, about 1.2 KB each) that a browser downloads only on a page that shows ₦. To regenerate them after a font upgrade, cut U+20A6 from the fontsource `latin-ext-wght-normal` files with [subset-font](https://www.npmjs.com/package/subset-font) (WOFF2 output, keeping the weight axis), outside the repo.

## Cloudflare Pages setup (owner steps)

The site needs its own Cloudflare account, separate from the one that hosts Aimery and Merge X (SPEC 9.1). Claude Code can't create accounts or grant GitHub access, so these steps are yours.

1. **Create the account.** Sign up at dash.cloudflare.com with the email you want for this site. You land on an empty account home page.
2. **Create the Pages project.** In the left sidebar, open Workers & Pages, then Create, then the Pages tab, then "Import an existing Git repository". You see a "Connect GitHub" button.
3. **Connect GitHub.** Click it. GitHub asks which repositories the Cloudflare Pages app may access: choose "Only select repositories" and pick `heisX3N0/portfolio` only. Back in Cloudflare, the repository appears in the list; select it and click "Begin setup".
4. **Build settings.** On the "Set up builds and deployments" page:
   - Project name: `boluwatife-portfolio` (this becomes `boluwatife-portfolio.pages.dev`; any name works, but tell Claude Code which one you chose)
   - Production branch: `main`
   - Framework preset: Astro
   - Build command: `pnpm build`
   - Build output directory: `dist`
   - Environment variables (expand "Environment variables (advanced)"): `PNPM_VERSION` = `12.15.0`. Node 24 is read from `.nvmrc`.
5. **Save and deploy.** Click "Save and Deploy". The first build log streams on screen and ends with a `*.pages.dev` link. Production deploys come from `main`.
6. **Preview deploys.** Under the project's Settings, then Builds, check that preview deployments are on for all non-production branches (the default). Each PR then gets a comment and a check from Cloudflare with its own preview URL.

The custom domain (`boluwatife.olapade.site`, CNAME at Namecheap) is set up in P5 and documented then.
