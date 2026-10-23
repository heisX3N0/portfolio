# Backlog

Open work only. Done items move to `docs/backlog-done.md`. Phases come from SPEC.md Section 10; the owner approves each phase before the next starts.

- [ ] **P5 Launch (v1)** (M)
  - **Why:** SPEC 10 phase 5 and the Section 11 launch gate. The site is only on `boluwatife-portfolio.pages.dev` today, while every canonical, `og:url` and sitemap URL already points at `boluwatife.olapade.site` (`astro.config.mjs` `site`), which doesn't resolve yet.
  - **Do:**
    - **Owner steps** (Claude Code has no Cloudflare dashboard, Namecheap or Google access), written into the README "Cloudflare Pages setup" section with each screen described in words (SPEC 9.1):
      1. Cloudflare Pages project, Custom domains: add `boluwatife.olapade.site`.
      2. Namecheap, Advanced DNS for `olapade.site`: `CNAME` host `boluwatife` to `boluwatife-portfolio.pages.dev`. Don't move the nameservers.
      3. Wait for the certificate and check HTTPS.
      4. Google Search Console: add a **Domain** property for `boluwatife.olapade.site`, add the TXT record it gives at Namecheap, verify, then submit `https://boluwatife.olapade.site/sitemap-index.xml`.
      5. Web Analytics: check that visits to the domain show up (the site was set up under the `pages.dev` hostname). Add the domain as a hostname if they don't.
    - **Claude Code:**
      - A post-launch check script (`scripts/launch-check.mjs`, run by hand against the live URL, not in CI) for the parts that only exist once the domain does: HTTPS, the `http` redirect, security headers as served, every sitemap URL returning 200 on the domain, canonical tags, and the `pages.dev` copy pointing its canonical at the domain.
      - Final QA against every SPEC 11 item, written up in `docs/launch-qa.md` with evidence: automated (test name or command output) or manual (what was checked, at which width, in which browser).
      - The headshot "on" check (SPEC 11): a browser test case with a test image, built only in the test, so no image is committed.
      - README completed to SPEC 10 phase 5's list: edit content, add a case study, add or publish a role page, replace a CV, turn on the headshot, deploy. Most sections exist; fill the gaps (publish a role, headshot, deploy, the domain and Search Console steps).
  - **Tests:**
    - Refused: the launch check fails when a page serves without HTTPS, when `http://` doesn't redirect to `https://`, when any SPEC 9.5 header is missing as served, when a sitemap URL isn't 200, when any page has `noindex`, and when the `pages.dev` copy's canonical isn't the domain. Each case is run once against a local server serving a broken copy, to see it fail.
    - Refused: the headshot test fails if, with the flag on, the hero overflows or overlaps at 360px, 390x844 or 1366x768.
    - Happy path: the launch check passes against `https://boluwatife.olapade.site`; securityheaders.com grades A; Lighthouse 95+ on mobile and desktop for `/`, `/business-analyst/`, one case study and `/about/` (CI already runs these on previews).
    - Manual, recorded in `docs/launch-qa.md`: a keyboard-only walk through every page; a screen-reader spot check (Windows Narrator) of the BA page and one case study; every certification link opens the right badge; `/cv/business-analyst.pdf` opens the current CV; dark mode readable on every page.
  - **Docs:** README (owner steps, publish a role, headshot, deploy), `docs/launch-qa.md` (new), SPEC 11 boxes ticked with a link to the QA doc, `docs/infra-capacity.md` (the launch check costs nothing in CI).
  - **Cost:** per page view unchanged (no page changes, apart from the headshot test, which builds only in the test). Per push: 1 Pages build, unchanged. The launch check runs by hand from the owner's machine: 0 CI minutes, about 20 requests to the live site per run (estimate: 12 pages, plus the sitemap, headers and the `pages.dev` copy). Search Console and the custom domain are free. Users supported: unchanged. $0. Dev only: the headshot case adds a few seconds to the browser test (estimate).
  - **Depends on:** P4.5 (merged, `6e3b134`).
  - **Open questions for the owner:** none blocking. The owner steps above have to happen before the happy-path launch check can pass; everything else can be built and tested first.
  - **Owner decisions (2026-10-23):**
    - Search Console uses a Domain property verified by a DNS TXT record at Namecheap, so the repo gets no verification tag.
    - `boluwatife-portfolio.pages.dev` keeps serving the site; the canonical tags send search engines to the domain. No redirect rule.
    - P5 is built in a fresh session.

P6 (Project Manager role page) and P7 (Product Manager role page) are not on the backlog until the owner supplies each spec addendum and CV (SPEC 10).
