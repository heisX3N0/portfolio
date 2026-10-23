# Portfolio

Source for `boluwatife.olapade.site`: a static Astro site built from [SPEC.md](SPEC.md). The full owner guide (editing content, adding a case study, publishing a role page, replacing a CV, the headshot) arrives in P5.

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

## Add the BA CV

TODO(owner): add the current BA CV as `public/cv/business-analyst.pdf` (source: "Boluwatife Olapade - Senior Business Analyst, AI.pdf" in your Google Drive). Keep that file name; replace the file to update it.

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
