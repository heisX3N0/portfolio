# Portfolio

Source for [boluwatife.olapade.site](https://boluwatife.olapade.site): a static Astro site built from [SPEC.md](SPEC.md). This README is the owner guide: edit content, add a case study, publish a role page, replace a CV, turn on the headshot, deploy, and the one-off domain and Search Console setup.

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
- **Role pages:** a role file with `published: false` is not built, linked or listed. See "Publish a role page" below. Role pages never link to each other.
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

## Publish a role page

The Project Manager and Product Manager pages (`src/content/roles/project-manager.md`, `product-manager.md`) wait for their spec addendum and CV (SPEC 10, phases 6 and 7). When you have both:

1. **Add the CV** as `public/cv/<slug>.pdf` (for example `public/cv/project-manager.pdf`).
2. **Approve any new numbers first.** Every figure on the page must be in the SPEC 6.2 table in `SPEC.md`; add new ones there (the figures check reads that table).
3. **Fill in the role file.** Copy the fields from `business-analyst.md` into the role's file, below its `slug`, and write that role's content: `title` exactly as on its CV, then `positioning`, `supporting`, `proofStrip`, `howIWork`, `tools`, `featured` (case study file names), `cvFile` (`/cv/<slug>.pdf`) and `contactLine`. `shortTitle` and `shareDescription` are optional.
4. **Set `published: true`** and push to a branch. The build fails, naming the file and field, if anything is missing or wrong.
5. **Check the preview** (Cloudflare comments the link on the PR): the page at `/<slug>/`, its card on the root page, and its share image at `/og/<slug>.png`. The sitemap and the root page pick it up on their own. Merge when CI is green.

To unpublish a role, set `published: false` again: the page, its card, its share image and its sitemap entry go on the next deploy.

## Replace a CV

Each role's CV is `public/cv/<role>.pdf` (the BA one is `public/cv/business-analyst.pdf`). Replace the file, keeping its name, and push: links never change. CVs open in the browser and are kept out of search results (`public/_headers`). If a role's CV file is missing, its page shows a `TODO(owner)` line and the build output lists it.

The CV PDF contains your phone number. The repository is public, so the file (and every earlier version of it, in the git history) can be downloaded from GitHub as well as from the site.

## Turn on the headshot

The hero on the root and role pages has a headshot slot, off in v1 (SPEC 8).

1. **Prepare the photo:** square, at least 320 by 320 pixels (it shows at 160 pixels on desktop, so 320 keeps it sharp on high-resolution screens), saved as WebP and small (aim for under about 40 KB, an estimate: the 200 KB page budget in SPEC 9.4 leaves the headshot out, but a large file still slows the first screen).
2. **Add it** as `public/headshot.webp`.
3. **Turn it on** in `src/content/site.yaml`:

   ```yaml
   headshot:
     show: true
     src: /headshot.webp
   ```

4. **Push to a branch and check the preview** on a phone and a laptop. The browser test checks the "on" layout with a test image at 360, 390 and 1366 pixels wide, but not your photo. With the headshot on, the BA hero is taller: at 1366x768 the bottom of the proof strip moves about 26 pixels below the first screen (measured in P5, see `docs/launch-qa.md`). Decide whether that is acceptable before merging.

The image must be a file on this site: the security policy (`img-src 'self'` in `public/_headers`) blocks images from other sites. To turn it off, set `show: false`.

## Deploy

Every push builds on Cloudflare Pages; you never deploy by hand.

1. **Make the change on a branch.** In GitHub's web editor, choose "Create a new branch for this commit and start a pull request".
2. **Open the pull request.** CI runs (type check, build, tests, links, Lighthouse) and Cloudflare posts a preview link. Check the preview.
3. **Merge** when CI is green. Cloudflare builds `main` and the live site updates a minute or two later (Workers & Pages, the project, Deployments lists each build).
4. **Undo a bad deploy:** in Deployments, open an earlier production deployment and choose "Rollback to this deployment". Then fix or revert the change on GitHub, or the next merge brings it back.

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

## Custom domain and Search Console (owner steps)

One-off steps for launch (SPEC 10 phase 5). Claude Code has no Cloudflare, Namecheap or Google access, so they are yours. `boluwatife-portfolio.pages.dev` keeps serving the site; its canonical tags point search engines at the domain, so there is no redirect (owner decision 2026-10-23).

1. **Add the domain in Cloudflare.** Workers & Pages, the `boluwatife-portfolio` project, the Custom domains tab, "Set up a custom domain". Type `boluwatife.olapade.site` and continue. Because the DNS is at Namecheap, Cloudflare shows a CNAME record to add, and the domain stays "Pending" until it sees it.
2. **Add the CNAME at Namecheap.** Domain List, "Manage" next to `olapade.site`, the Advanced DNS tab, "Add new record": type `CNAME Record`, host `boluwatife`, value `boluwatife-portfolio.pages.dev`, TTL Automatic, then the green tick to save. Don't change the nameservers.
3. **Wait for the certificate.** Back in Custom domains, the status turns "Active" once Cloudflare sees the CNAME and issues the certificate (usually minutes, sometimes a few hours). Then open `https://boluwatife.olapade.site`: the page loads with a padlock.
4. **Search Console.** At search.google.com/search-console, "Add property", choose **Domain** (the left box), type `boluwatife.olapade.site` and continue. Google shows a TXT record (`google-site-verification=...`). At Namecheap, Advanced DNS, "Add new record": type `TXT Record`, host `boluwatife`, value the whole text Google gave, then save. Back in Google, click "Verify" (DNS can take a while; if it fails, try again later). Then open the property, Sitemaps in the left menu, enter `https://boluwatife.olapade.site/sitemap-index.xml` and Submit. The status shows "Success" once Google has read it. Nothing goes in the repo for this (owner decision 2026-10-23).
5. **Web Analytics.** Cloudflare, Analytics & Logs, Web Analytics, this site. Visit the domain once, wait a few minutes, and check the visit shows with host `boluwatife.olapade.site`. If it doesn't, open the site's settings there and add `boluwatife.olapade.site` as a hostname (it was set up under the `pages.dev` name).
6. **Run the launch check** (below).

## Launch check

`scripts/launch-check.mjs` checks what only exists on the live domain: HTTPS, the `http://` to `https://` redirect, the security headers as served (they must match `public/_headers`), every sitemap page answering 200 with its own canonical URL and no `noindex`, and the `pages.dev` copy's canonical pointing at the domain. Run it after connecting the domain, and after any change to `_headers` or the hosting:

```bash
node scripts/launch-check.mjs
```

It prints `OK`, or one `FAIL` line per problem and exits 1. It makes 14 requests to the live site (counted, 2026-10-23), needs no build, and never runs in CI. `--site` and `--mirror` point it at other addresses, for example a preview URL.
