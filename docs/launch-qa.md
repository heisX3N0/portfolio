# Launch QA (v1)

Final QA against every item in SPEC 11, done for backlog item P5 on 2026-10-23, against `main` at `a2b39c4` plus this branch (`feat/p5-launch`). Each item says how it was checked: **automated** (the test name in `pnpm test`, or command output) or **manual** (what was checked, at which width, in which browser). Items the owner still has to check are marked **owner**.

The domain was already connected when this QA ran: `https://boluwatife.olapade.site/` answered 200 over HTTPS and `http://` answered 301 to `https://` (curl, 2026-10-23, one request each).

## Summary

| SPEC 11 item | Result | How |
| --- | --- | --- |
| Title, dates and figures match the CV and Section 6; the figures check passes | Pass | Automated |
| BA title matches the BA CV; no "Product Manager" title on the BA page | Pass | Automated |
| Unpublished roles not built, linked or in the sitemap; no "coming soon" | Pass | Automated |
| Role pages don't link to each other | Pass | Automated |
| First screen of root, BA and every case study passes the depth rule at 1366x768 and 390x844 | Pass | Automated |
| Performance Buddy not live, launched or piloted; no internal details | Pass | Automated |
| Projected aggregator figures labelled as projected | Pass | Automated |
| Every case study has an artefact with a caption and a text alternative | Pass | Automated |
| All certification links open the right badge | Pass | Manual |
| `/cv/business-analyst.pdf` opens the current BA CV | Pass (file); **owner**: confirm the PDF is the CV you want live | Manual |
| Headshot off: hero complete; on (test image): layout holds at all widths | Pass, with one finding (below) | Automated |
| Lighthouse 95+ mobile and desktop on root, BA, one case study, About | Pass | Automated (local run; CI on the PR) |
| Keyboard-only walkthrough of all pages | Pass | Manual (scripted key presses) |
| Screen-reader spot check on the BA page and one case study | **owner** (not done) | Manual |
| No horizontal scroll at 360px; dark mode readable everywhere | Pass | Automated and manual |
| `robots.txt`, `sitemap.xml`, canonical tags, OG image and JSON-LD present; no `noindex` | Pass | Automated and launch check |
| securityheaders.com grade A | Pass (A+) | Manual |
| The README lets the owner update content without help | **owner** to judge | README |

## Evidence

### Content and figures

- **Title, dates and figures.** `pnpm test`: "figures check: every number on every page except /styleguide/ is in SPEC 6.2", "About: timeline titles and dates as on the CV, certifications linked, education, how built, full writing list", "Person JSON-LD: name, LinkedIn, CBAP and PSPO II, both universities; jobTitle only on role pages".
- **BA title.** "BA page: CV title, five proof items in order, six featured cards in order" and "the BA page: short title and description in search and sharing, the full CV title in the hero, image alt and JSON-LD". The first of these checks the CV title and fails if "Product Manager" appears anywhere in the BA page's visible text.
- **Unpublished roles.** "a role with published: false is not built, linked or in the sitemap", "no OG image is built for an unpublished role". No "coming soon" text: none of the 12 built pages contains it (`grep -ril "coming soon" dist/` returned nothing, 2026-10-23).
- **Role pages don't link to each other.** "role pages never link to another role page".
- **Performance Buddy.** "Performance Buddy is never described as live, launched or piloted, on any page" and "Performance Buddy shows no internal detail: fictional placeholders only, no email address".
- **Projected figures.** "projected aggregator figures are labelled as projected on every page".
- **Artefacts.** "every case study has an artefact; each diagram has a caption and a text alternative, each table a caption and th scope", "tables are never inside a role=\"img\" wrapper, which hides them from screen readers".

### Layout

- **Depth rule (first screen).** Browser test, headless Chrome: "/business-analyst/ hero: h1, proof strip and Download CV in the first screen" and "root hero: name, root line and Download CV in the first screen", each at 1366x768 and 390x844, both themes for the BA page; "case study title, outcome and metadata in the first screen" at both sizes for all 6 case studies.
- **No horizontal scroll at 360px.** "no horizontal page scroll at 360px on any page, in either theme", "no figure scrolls sideways at 360px", "the header stays on one row at 360px on every page".
- **Headshot.** Off: the hero tests above run with the flag off (`site.yaml` has `show: false`). On: "headshot on: the hero neither overflows nor overlaps" at 360x740, 390x844 and 1366x768, on `/` and `/business-analyst/`, in both themes. The test makes a 320x320 PNG in memory, serves it from the test server, and turns the slot on in the page the way `Hero.astro` does ("the headshot test turns it on the way Hero.astro does" fails if the component's markup changes). It fails when the page scrolls sideways, any hero part is past the viewport, hero text is wider than its box, the image leaves the intro, the image covers hero text, or two hero parts overlap. Seen failing first: with the built CSS changed to a 30rem image (phones) and a 60rem image (desktop), all three sizes failed ("headshot overlaps H1", "text wider than its box: H1", "headshot outside the intro").
  - **Finding for the owner (not fixed here):** with the headshot on, the BA hero is taller. At 1366x768 the bottom of the proof strip moves from 670px to 794px, 26px below the first screen (measured in headless Chrome, one load). The h1 and Download CV stay in the first screen. At 390x844 everything stays in the first screen (proof strip bottom 798px). The depth rule test runs with the flag off, so it does not catch this. If you turn the headshot on, a smaller desktop image (for example 8rem instead of 10rem) or less space above the intro would bring the strip back; that is a design change for its own item.

### Performance and Lighthouse

`corepack pnpm lhci` on this branch, local build, one run per page (2026-10-23). This PR adds `/about/` to both Lighthouse configs: SPEC 11 names it and CI did not run it before.

| Page | Mobile (perf, a11y, best practices, SEO) | Desktop |
| --- | --- | --- |
| `/` | 100, 100, 100, 100 | 100, 100, 100, 100 |
| `/business-analyst/` | 97, 100, 100, 100 | 100, 100, 100, 100 |
| `/about/` | 100, 100, 100, 100 | 100, 100, 100, 100 |
| `/work/aggregator-onboarding-redesign/` | 100, 100, 100, 100 | 100, 100, 100, 100 |
| `/work/`, `/styleguide/`, `/404.html` | 100 in every category | 100 in every category |

Page weight: "every page transfers 200 KB or less (SPEC 9.4)".

### Keyboard (manual, scripted)

In the Claude desktop app's built-in browser (Chromium), on the live domain at the pane's default desktop width, 2026-10-23: on each page, real Tab key presses (90 per page) while a listener logged each focused element. For every page: the first stop is "Skip to content", every visible link and button was reached, and every focused element showed a focus ring (its own outline, or the card's 3px `:focus-within` outline for case study cards).

| Page | Focusable | Reached |
| --- | --- | --- |
| `/` | 23 | 23 |
| `/about/` | 35 | 35 |
| `/business-analyst/` | 38 | 38 |
| `/work/` | 23 | 23 |
| `/work/closa-cbn-compliance/` | 18 | 18 |
| `/work/performance-buddy-access-control/` | 19 | 19 |
| `/work/aimery-ai-requirements/` | 20 | 20 |
| `/work/aggregator-onboarding-redesign/` | 18 | 18 |
| `/work/gpt-investor-discovery/` | 21 | 21 |
| `/work/merge-x-requirements-from-failure/` | 20 | 20 |
| `/styleguide/` | 26 | 26 |
| 404 (`/not-a-page/`) | 17 | 17 |

Not covered: Enter on each link (only focus order and visibility were checked), and Shift+Tab. Automated support: "every page has one main landmark, a skip link, lang and a unique title", "every same-page link has a target, and Contact jumps to #contact", "the theme toggle has a name that says what it does and changes with the theme".

### Screen reader (owner)

Not done: Claude Code cannot run or listen to Windows Narrator. **Owner:** with Narrator on (Ctrl + Windows + Enter), open `/business-analyst/` and one case study (for example `/work/aggregator-onboarding-redesign/`) in Edge, press Caps Lock + Down arrow to read from the top, and check that the headings, the proof strip, each diagram's text alternative and the table read in a sensible order. Record the result here.

### Dark mode

- Automated: "every pair passes in both themes" (each colour pair 4.5:1, 3:1 for UI parts), "no horizontal page scroll at 360px on any page, in either theme", "the CSP blocks nothing on any page" (both themes).
- Manual, built-in browser, live domain, 1366x768, dark scheme emulated, 2026-10-23: on all 12 pages, a script compared every visible HTML element that holds text with the nearest painted background behind it. No element was under 4.5:1 (3:1 for large text). SVG diagram text was not part of that script; its colours are palette pairs, and a screenshot of the aggregator swimlanes in dark mode was readable.

### Certifications (manual)

Each link on `/about/` opened in the built-in browser, 2026-10-23. Every page names Boluwatife Olapade and the certificate listed:

| Listed as | Opened |
| --- | --- |
| CBAP (IIBA) | badges.iiba.org: "Certified Business Analysis Professional", issued 3 Nov 2023 |
| PSPO II (Scrum.org) | Credly: "Professional Scrum Product Owner II (PSPO II)", Scrum.org |
| Prompt Design in Vertex AI (Google Cloud) | Credly: "Prompt Design in Vertex AI Skill Badge", Google Cloud |
| AI for Product Management (Pendo) | Credly: "AI for Product Management", Pendo |
| Business Analytics Nanodegree (Udacity) | udacity.com: Business Analytics Nanodegree certificate |
| Product Analytics (Product School and Mixpanel) | Google Drive: "Product Analytics Micro-Certification by Product School.pdf" |
| Fundamentals of Agile Project Management (PMI) | Credly: same title, Project Management Institute |
| Fundamentals of Predictive Project Management (PMI) | Credly: same title, Project Management Institute |
| ITIL 4 (training) | No link, by design (`certifications.yaml`) |

### CV (manual)

`https://boluwatife.olapade.site/cv/business-analyst.pdf` returns 200, `Content-Type: application/pdf`, `Content-Disposition: inline`, `X-Robots-Tag: noindex`, and its SHA-256 equals `public/cv/business-analyst.pdf` in the repo (last changed in `8b5515e`, 2026-10-23). **Owner:** open it and confirm it is the CV you want live (SPEC 12 asks you to update its portfolio link to `boluwatife.olapade.site/business-analyst` after launch).

### SEO files and headers

- Automated: "robots.txt allows everything and points at the sitemap", "styleguide is built but not in the sitemap", "canonical matches each page, and the 404 page has none", "every page with a canonical URL has Open Graph and Twitter card tags that match it", "every OG image is a 1200x630 PNG under 150 KB", "JSON-LD appears only where SPEC 9.3 puts it, and every block parses", "no page emits noindex", "every page gets HSTS, nosniff, the referrer policy, a permissions policy and frame denial".
- Launch check against the live site (`node scripts/launch-check.mjs`, 2026-10-23, 14 requests):

  ```text
  Launch check: https://boluwatife.olapade.site (copy: https://boluwatife-portfolio.pages.dev), 14 requests
    OK: HTTPS, http:// redirect, headers, sitemap pages, canonicals, no noindex, pages.dev canonical
  ```

- The launch check's refused cases run in `pnpm test` (`scripts/tests/launch-check.test.mjs`) against a local server serving a broken copy of the built site: no HTTPS, an `http://` site, no `http://` redirect, each of the five SPEC 9.5 headers missing, a sitemap page returning 404, a `noindex` meta tag (robots or googlebot), an `X-Robots-Tag: noindex` header, a wrong canonical, a `pages.dev` copy whose canonical is not the domain, a redirect with no Location, and a sitemap loc that is not a URL (the last two must be reported, not crash the run). All 14 first cases failed against a stub before the check was written; the 3 added after code review failed against the first version. Run by hand against a plain local server (no HTTPS, no headers), the CLI exits 1 and lists "not HTTPS" and every missing header on each page.

### securityheaders.com (manual)

`https://securityheaders.com/?q=https%3A%2F%2Fboluwatife.olapade.site%2F&hide=on&followRedirects=on`, 2026-10-23 16:45 UTC: **A+**, with Strict-Transport-Security, Content-Security-Policy, Permissions-Policy, Referrer-Policy, X-Content-Type-Options and X-Frame-Options all present. Results were hidden from the site's public list.

## Owner steps still to confirm

Claude Code has no Cloudflare, Namecheap or Google access, so these are not verified here (README "Custom domain and Search Console"):

1. Search Console Domain property verified by DNS TXT, and the sitemap submitted.
2. Web Analytics counts visits on `boluwatife.olapade.site` (add the hostname if it does not).
3. The screen-reader spot check above.
4. The CV is the current one, and the README is clear enough to edit content without help.
