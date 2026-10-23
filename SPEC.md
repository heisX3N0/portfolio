# Portfolio Website: Build Specification

**Owner:** Boluwatife Olapade
**Builder:** Claude Code
**Status:** v3.1, approved by the owner (v2 added role pages, the domain, the Merge X case study and the depth rule; v3 added the hero copy approval, GitHub, the Substack writing list and the DNS setup)
**Changelog:** v3.1 (23 October 2026, backlog item P1.5 Visual identity, owner decisions of the same date): the header's Contact jumps to a contact section on every page (Section 3); the proof strip puts the figure first, and on mobile the supporting line may sit below it (4.1); "How I work" steps may link to one case study each (4.1, 9.2); ochre gold replaces the unnamed warm accent, with a navy hero band that keeps its shape in dark mode (8).
**Domain:** `boluwatife.olapade.site` (owned)
**Last updated:** 23 October 2026

> **Claude Code: read this whole file before writing any code.** It is the single source of truth for scope, content and quality. Where it is silent, choose the simplest option that meets the goals. Where it conflicts with your defaults, this file wins. Never invent facts, figures, employers, clients or results. Every claim on the site must trace to Section 6 (Content source of truth).

---

## 1. Why this site exists

The owner applies for three kinds of role: **Business Analyst**, **Project Manager** and **Product Manager**. Each has its own CV, and each CV links to its own **role page** on this site (for example, the BA CV links to `boluwatife.olapade.site/business-analyst`). The role pages share one library of case studies.

A role page is usually the first page a recruiter or hiring manager opens after reading the CV, so it must:

1. **Confirm the CV in 10 seconds.** The same title, the same numbers and the same story, with nothing that contradicts it.
2. **Show the work the CV can only describe.** These are the case studies and the sanitised artefacts: process flows, decision logic, requirements excerpts and test results.
3. **Make contact effortless.** Email, LinkedIn and the CV download are never more than one click away.

The current portfolio (a Gamma page reached through a bit.ly link-in-bio) fails on all three. It uses an old title ("Product Manager") and old numbers, it is hidden from search engines, and it takes two extra clicks to reach.

### 1.1 Success criteria

- A recruiter can state the owner's role, seniority, domain and strongest proof point within 10 seconds of landing on a role page.
- Every number on the site matches the current CV (Section 6.2).
- A hiring manager can open a case study and see real artefacts (a diagram, requirements excerpt or test result), not just prose.
- Lighthouse scores of 95 or higher for Performance, Accessibility, Best Practices and SEO on both mobile and desktop.
- The owner can change any text, add a case study or swap the CV PDF by editing one Markdown file and pushing, without touching code.

### 1.2 Audiences, in priority order

1. **Hiring managers for Senior BA, AI Business Analyst and digital BA roles** (banking, telecoms, fintech). They want evidence of requirements quality, process modelling, stakeholder management, Agile delivery and an understanding of AI and its limits.
2. **Recruiters and HR screeners.** They skim for title, years, certifications and employer names.
3. **Product and founder contacts.** They are interested in the AI products and the Version Phi studio.

### 1.3 Out of scope (v1)

- Blog engine or CMS. Writing lives on Substack; the site links to it.
- Contact form, newsletter sign-up or any backend.
- Multi-language support.
- Testimonials (unless the owner supplies real, attributable ones later).
- The Project Manager and Product Manager role pages. They are planned (Phases 6 and 7) but need their own CVs and fact sheets first. **v1 launches with the Business Analyst role page only**, and the architecture must make adding the other two a content task, not a code task.

### 1.4 The depth rule

The site is **not** constrained like the CV. Case studies can go deep: trade-offs, build numbers, lessons learned and supporting artefacts. But **the first screen of every page must be as tight as the CV.** A reader who never scrolls should still get the title, the strongest proof and a way to make contact. Depth goes down the page, never up front.

- First screen (at 1366×768 and at 390×844): title, one-line outcome or positioning, at most 5 proof points, and the primary actions.
- Below the fold: full narrative, artefacts, build notes and lessons learned.
- Long sections use clear subheadings and an "At a glance" box so skimmers can stop at any point.

---

## 2. Positioning

Positioning is set **per role page**. Each role page's title must match the CV that links to it.

### 2.1 Business Analyst (v1)

**Title (must match the BA CV):** Business Analyst | AI & Digital Solutions | CBAP | PSPO II

**Positioning line:** *Business Analyst who builds with AI.*

**Supporting line (approved by the owner):**
> I turn regulatory deadlines, tangled processes and AI ideas into requirements that banks and product teams can build, then test that what ships is what was needed. CBAP-certified, with 4 years across banking, payments and AI products.

### 2.2 Project Manager and Product Manager (later phases)

To be defined in a spec addendum when each CV is final. Placeholders only; do not build these pages in v1.

### 2.3 Root page

**Line (approved):** *I work where business, delivery and product meet.* A Business Analyst and Project Manager at Access Bank who also builds AI products through Version Phi. The root page introduces the owner and links to the live role pages. It does not repeat a role page's proof strip.

### 2.4 Keeping the roles distinct

Showing three roles on one site can read as a lack of focus. To avoid this:

- Role pages **never link to each other** in the header, body or footer.
- Only the root page and the About page mention all three roles.
- Case study pages link back to "All work", not to a role page.

**Tone of voice:**
- First person, plain British English (organisation, prioritise, modelling).
- Concrete over clever. Use numbers and nouns, not adjectives. Avoid "passionate", "innovative", "results-driven", "superpower" and "leveraged".
- Confident but checkable. Every claim either has a number or can be explained in an interview.
- Keep em-dashes to a minimum. Use colons, commas or full stops.

---

## 3. Information architecture

```
/                         Root: short introduction + links to live role pages
/business-analyst/        BA role page (v1)
/project-manager/         PM role page (Phase 6; not built in v1)
/product-manager/         Product role page (Phase 7; not built in v1)
/work/                    Case studies index (all case studies)
/work/<slug>/             Individual case study (6 at launch)
/about/                   About, experience timeline, certifications, education
/cv/business-analyst.pdf  BA CV (stable file name; owner replaces the file to update)
/cv/project-manager.pdf   later
/cv/product-manager.pdf   later
/404                      Not found
```

- Role pages are generated from **content files** (Section 9.2), one per role, so adding a role is a content task.
- A role page whose content file has `published: false` must not be built, linked or listed in the sitemap.
- The root page lists only published role pages. **Never show "coming soon" placeholders.**

Global header: name (links to `/`; a "BO" monogram on mobile) · Work · About · Contact · CV · theme toggle, on one row from 360px wide. Contact jumps to the contact section (`#contact`) that ends every page: the role's contact line where there is one, the email address as text, LinkedIn and Download CV (v3.1; it no longer opens a mail app). The CV link opens the CV for the role page the visitor is on; elsewhere it opens the BA CV until other roles are live.
Global footer: email · LinkedIn · "Last updated <month year>" · small "Built from a spec with Claude Code" credit linking to `/about/#how-this-site-was-built`.

---

## 4. Page requirements

### 4.0 Root page (`/`)

A short, calm page that fits mostly on one screen:

- Name and the root line (Section 2.3).
- 2–3 sentences of introduction.
- One card per **published** role page, with title, one line and a link. In v1 that is the Business Analyst card only.
- A "Selected work" row of 3 case study cards (Aimery, Closa CBN compliance, Merge X).
- Contact links.
- Headshot slot (Section 8, off by default).

### 4.1 Business Analyst role page (`/business-analyst/`)

In order:

1. **Hero**
   - Name, title line, positioning line and supporting line (Section 2.1).
   - Primary actions: "View my work" (anchors to the case studies) and "Download CV" (`/cv/business-analyst.pdf`).
   - Secondary actions: Email and LinkedIn as icon links with visible text labels on desktop.
   - Headshot slot (Section 8, off by default). No stock imagery.
   - On mobile the supporting line may sit below the proof strip, so the name, the proof strip and Download CV fit the first screen (Section 1.4; v3.1).

2. **Proof strip.** Five short, factual items, each a figure followed by a short description. On desktop a single row of five, overlapping the bottom of the hero band; on mobile a 5-row list with the figure on the left (v3.1):
   - 4 weeks: First bank to comply with a new CBN limits circular
   - ₦268.36M: Deposits mobilised in 6 months (Beta 2.0)
   - 10,000+: App downloads (GPT Investor)
   - Live: Prompt-injection tested AI product (Aimery)
   - CBAP: and PSPO II certified

3. **Selected work.** Cards for the case studies tagged for this role (Section 5), in the order set in the role's content file. Each card shows:
   - Title
   - One-line outcome
   - Context tags (Banking / AI product · Requirements / Process / Data / AI governance)
   - The single most relevant figure

   BA order: Closa CBN compliance, Performance Buddy access control, Aimery, Merge X, Aggregator onboarding redesign, GPT Investor.

4. **How I work.** A 5-step horizontal flow (vertical on mobile) mapping to the BA lifecycle, each step with one line and the artefacts produced:
   1. Discover: stakeholder interviews, workshops, current-state mapping
   2. Model: BPMN and swimlane diagrams, customer journeys, data and access rules
   3. Specify: solution requirements documents, user stories, acceptance criteria, Definition of Ready
   4. Deliver: backlog refinement, sprint planning, vendor and dev coordination
   5. Validate: SIT/UAT, sign-off, production readiness, monitoring

   The flow is HTML and CSS, not a diagram, so it never scrolls sideways. Each step may link to one case study that shows it, as one small "Example:" line, shown only when that case study is published (v3.1).

   Below it, one line: "Tools: Jira, Confluence, Azure DevOps, Linear, Draw.io, Lucidchart, Miro, Mixpanel, SQL, Gemini, Claude."

5. **Writing.** Two short groups linking to Substack, with title, one-line description and date. Show at most 3 posts per group on the role page, newest first, and put the full list on About. Data lives in `writing.yaml` (Section 9.2).

   **Building GPT Investor** (co-written with my co-founder), series page `https://xmusings.substack.com/s/gpt-investor`:

   | Title | Description | Date | URL |
   |---|---|---|---|
   | Rebuilding the Engine for Retail Investing | Inside Phase 1 of the new GPT Investor, and the roadmap for what comes next | 30 May 2026 | `https://xmusings.substack.com/p/rebuilding-the-engine-for-retail` |
   | Say Hello to Tidbits | Your shortcut to smarter financial literacy | 5 Oct 2025 | `https://xmusings.substack.com/p/say-hello-to-tidbits` |
   | A Fresh Look for a Smarter You | Inside our new app redesign | 25 Jun 2025 | `https://xmusings.substack.com/p/a-fresh-look-for-a-smarter-you` |
   | Introducing Top Picks | Your shortcut to smarter investing | 23 Mar 2025 | `https://xmusings.substack.com/p/introducing-top-picks` |
   | The Problem with Retail Investing | Why we built GPT Investor | 4 Jan 2025 | `https://xmusings.substack.com/p/the-problem-with-retail-investing` |

   **Side Quests (building in public)**, series page `https://xmusings.substack.com/s/x3n0s-learning-journey`:

   | Title | Description | Date | URL |
   |---|---|---|---|
   | Side Quest 3 | Building my custom mail merge tool (the prototype behind Merge X) | 6 Oct 2025 | `https://xmusings.substack.com/p/side-quest-3` |
   | Side Quest 1 | Self-hosting n8n on GCP | 20 Jul 2025 | `https://xmusings.substack.com/p/side-quest-1` |

   **Notes:**
   - Use the post URLs exactly as listed. **Do not guess or change slugs.**
   - Leave out the 2022–23 newsletter issues and Side Quest 2 (it describes the old portfolio site this one replaces).
   - Each group ends with a "More on Substack" link to `https://xmusings.substack.com/`.

6. **Contact band.** One sentence ("Hiring for a BA or AI BA role? I'd like to hear about it."), plus email, LinkedIn and Download CV.

### 4.2 Case studies index (`/work/`)

A grid of all case study cards, as on the role page, with filter chips: All · Banking · AI products. Filtering must work without JavaScript; all cards show by default and the chips can be anchor links or progressive enhancement.

### 4.3 Case study page (`/work/<slug>/`)

Every case study uses the same template so a reader can scan any of them the same way:

1. **Header:** title, one-line outcome, and a metadata row (role · organisation or product · period · team or stakeholders · tags).
2. **At a glance:** a 3–4 item summary box covering problem, my role, what I produced and the outcome.
3. **Context:** 1–2 short paragraphs.
4. **The problem:** what was wrong or at stake, in business terms.
5. **What I did:** the analysis and requirements work, in steps. Name the techniques used (interviews, current/future-state mapping, BPMN, user stories, acceptance criteria, decision tables, test design).
6. **Artefact(s):** at least one per case study. These are sanitised diagrams or excerpts rendered as accessible SVG or HTML tables, each with a caption and a text alternative (Section 7).
7. **Outcome:** figures from Section 6.2 only. Projected figures must be labelled as projected.
8. **What I'd do differently / what I learned:** 2–3 bullets. This shows judgement, and hiring managers value it.
9. **Footer navigation:** previous / next case study, and "Back to all work".

Target length: 600–900 words of prose per case study, plus artefacts. Use short paragraphs and descriptive subheadings.

### 4.4 About (`/about/`)

1. **Short bio (about 120 words).** Banking BA and PM at Access Bank, CBAP, builds AI products on the side through Version Phi, and is doing an MBA. First person.
2. **Experience timeline.** The same roles, titles and dates as the CV (Section 6.1), each with 2–3 highlights, not the full CV bullets.
3. **Certifications.** Each one links to its badge (Section 6.3).
4. **Education.** As on the CV.
5. **How this site was built** (anchor `#how-this-site-was-built`). About 100 words: the owner wrote this specification, Claude Code built the site, and the owner reviewed every page against the spec. Link to the public GitHub repository and to `SPEC.md` in it.
6. **Writing.** The full writing list from `writing.yaml` (both groups).

### 4.5 CVs (`/cv/<role>.pdf`)

- Each role has one PDF in `public/cv/` with a stable file name (`business-analyst.pdf` and later `project-manager.pdf` and `product-manager.pdf`). The owner replaces the file to update it, so links never break.
- Serve with `Content-Disposition: inline` so the CV opens in the browser.
- The owner supplies the PDFs. For v1, the owner adds the current Senior Business Analyst CV to the repo as `public/cv/business-analyst.pdf` (source: "Boluwatife Olapade - Senior Business Analyst, AI.pdf" in the owner's Google Drive). Claude Code has no Drive access, so if the file is missing, leave a `TODO(owner)` and keep building.
- The CV PDFs contain the owner's phone number, so they must **not be indexed by search engines**. Send `X-Robots-Tag: noindex` for `/cv/*` via `_headers`, and leave CV files out of the sitemap. They stay downloadable from the site.

### 4.6 404

A friendly one-liner, plus links to Home, Work and the BA role page.

---

## 5. Case studies: approved fact sheets

**Rule:** write each case study only from its fact sheet and Section 6. Do not add facts, figures, tools, stakeholders or outcomes. If prose needs a fact that isn't here, leave a visible `TODO(owner): …` marker and list it in the build report.

Each fact sheet lists the role pages it is tagged for. All six are tagged `business-analyst` in v1. Role tags for project manager and product manager are added in later phases.

### 5.1 `closa-cbn-compliance`: From CBN circular to live limits in 4 weeks

- **Role / period:** Business Analyst & Project Manager, Financial Inclusion, Access Bank Plc · 2024–present role.
- **Context:** Access Closa is the Bank's agent banking network. A new Central Bank of Nigeria (CBN) circular set new transaction limits for agent banking.
- **What I did:**
  - Turned the circular into functional requirements.
  - Enforced a ₦1.2M daily cap per agent and a ₦100,000 daily limit per customer on Closa 2.0.
  - Coordinated delivery with the vendor and internal teams.
- **Outcome:** live in 4 weeks, making the Bank the first to comply and avoiding potential multi-billion-naira penalties.
- **Artefact:** a generic "regulation to requirement" traceability table, with columns for circular clause (paraphrased, no quotes), business rule, functional requirement, acceptance criterion and test case. Use 3–4 illustrative rows built only from the two limits above. Label it "Illustrative, simplified."
- **Learned (draft):** treat regulatory text as requirements input, with clause-level traceability; agree acceptance criteria with compliance before build starts.

### 5.2 `performance-buddy-access-control`: Making a KPI dashboard show each user only their own patch

- **Role / period:** took over as PM/BA, 2026. The project is in progress; do **not** describe it as live, launched or in pilot, and do not mention timelines.
- **Context:**
  - Performance Buddy is a near real-time Retail Banking KPI dashboard, replacing manual Excel reports.
  - It brings data-warehouse and Pi360 metrics into one role-based view.
  - Teams involved: the Data Management Office (data sources) and Financial Control, FINCON (targets, financial metric definitions, validation against FinTrak data).
- **The problem:**
  - The company directory (Active Directory) confirms who a user is, but it cannot express the Bank's business hierarchy.
  - Senior leaders defaulted to bank-wide visibility.
  - Leaders' directory branch codes reflected their HR cost centre, not the area they actually manage.
- **What I did:**
  - Wrote the authorisation requirements and an architectural brief for developers.
  - Defined a cascading access check:
    1. Leadership mapping table, looked up by the user's email: a region, group or division, or bank-wide for executives.
    2. Branch managers, identified by job title and restricted to their branch.
    3. Account and relationship officers, restricted to their own portfolio by staff code.
    4. Everyone else gets no access by default.
  - Hierarchy data comes from the Data Management Office. The business maintains the leader table, so leadership changes need a table update, not a code change.
  - Found that directory branch and staff codes carried stray spaces that would break the data joins and return empty dashboards, and specified trimming at the point of capture.
  - Added a "drill down only" rule: users can only view levels below their own.
- **Outcome:**
  - A single, testable access model from Account Officer to executive.
  - Separates authentication (who you are) from authorisation (what you can see).
  - No outcome figures; the project isn't live.
- **Artefacts:**
  - (a) A decision flow diagram of the 4-step check, using only generic labels.
  - (b) A sample decision table with columns Role type → Source of truth → Data filter → What they see, using fictional placeholder values ("Region A", "Branch 001").
- **Strict sanitisation:**
  - No staff names, emails, phone numbers or employee IDs.
  - No real region, branch or division names, and no database, table or column names.
  - No directory payloads, screenshots, slides, timelines or internal document titles.
  - Do not link to any internal document.
- **Learned (draft):** separate identity from authorisation early; the riskiest bugs live in data quality at the boundaries; make the business own the data that changes most often.

### 5.3 `aimery-ai-requirements`: Specifying an AI assistant, then trying to break it

- **Role / period:** Founder, Product & BA Lead, Version Phi · Sep 2026–present. Live at `https://aimery.versionphi.com` with a one-click public demo.
- **Context:** Aimery is an AI assistant that tailors a user's resume to a specific job posting.
- **What I did:**
  - Wrote the solution specification (use cases, user journeys, data model, functional, non-functional and security requirements) and directed the build with AI coding agents (Claude Code).
  - Defined a two-step Gemini flow:
    - The first call parses a posting into structured JSON and screens for deal-breakers (work authorisation, clearance, language, experience), quoting the exact line found.
    - The second tailors only from the user's own accomplishments, within strict length budgets, and flags any stretch for the user's review.
  - Tested for prompt injection:
    - Hidden text in a posting raised its own fit verdict from Good to Strong (scores 83–84, against 76–79 for a clean posting).
    - After all user input was treated as untrusted data, injected postings scored 79–80, back in the clean range.
  - Set up monitoring and privacy controls:
    - A daily live check of every Gemini model (its first run caught a retired model).
    - Error reports scrubbed of personal data.
    - Self-service account deletion.
- **Build notes** (a small secondary box): 147 merged pull requests and 793 automated tests, built solo with AI coding agents.
- **Artefacts:**
  - (a) A two-step flow diagram (posting → parse and screen → tailor → user review).
  - (b) A small results table for the injection test: clean posting 76–79; injected, before fix 83–84; injected, after fix 79–80.
  - (c) One or two example acceptance criteria in Given/When/Then form, written from the facts above.
- **Learned (draft):** treat every user input to an LLM as untrusted; measure guardrails with before/after numbers; keep a human, here the user, in the loop for anything the model stretches.

### 5.4 `aggregator-onboarding-redesign`: Scaling an agent network without adding operations staff

- **Role / period:** Business Analyst & Project Manager, Financial Inclusion, Access Bank Plc.
- **Context:** agent onboarding for the Closa network was staff-led, which made the Bank's own operations team a bottleneck as the network grew.
- **What I did:**
  - Mapped the current staff-led onboarding process.
  - Redesigned it as an aggregator-led model on Closa 2.0, in which third-party aggregators onboard and manage their agents within Bank controls.
  - Ran requirements and backlog refinement with the vendor (CEVA Software).
- **Outcome:**
  - The business can scale its agent network without extra operations headcount.
  - The portal runs at 99.9% uptime.
  - **Projected:** 2M+ transactions and ₦100M+ revenue in year one. This must be labelled as projected.
- **Artefacts:** a current-state vs future-state swimlane diagram with generic lanes (Prospective agent · Bank operations · Aggregator · Platform) and 5–7 steps each. Label it "Simplified."
- **Do not use** the old portfolio's "25% increase in aggregator engagement" figure. The owner decided the site uses CV figures only.
- **Learned (draft):** process redesign is a lever for scale; push work to the party with the incentive, and keep controls with the Bank.

### 5.5 `gpt-investor-discovery`: From user interviews to a 25% retention lift

- **Role / period:** Product Lead · Mar 2024–present · `https://gptinvestorapp.com`. Accepted into Anthropic's Claude for Startups programme.
- **Context:** GPT Investor is an AI-powered investment research app that gives retail investors personalised AI stock digests.
- **What I did:**
  - Led requirements elicitation and user analysis, including 15+ user interviews, to define personalised AI stock digests.
  - Used Mixpanel funnel analysis to trace a verification drop-off to a routing bug, then simplified the flow.
  - Drafted requirements for a document-intelligence MVP to extract, deduplicate and categorise transactions from bank SMS and email alerts, with confidence scores, human-in-the-loop corrections and accuracy success metrics.
- **Outcome:**
  - 10,000+ downloads (evidence: `https://drive.google.com/file/d/1gtJ2aahlK2RXt7cBx8niqJJawBmuKB5Y/view?usp=sharing`).
  - Data-driven iterations improved retention by 25%.
- **Artefacts:**
  - (a) A simplified funnel diagram showing where the drop-off was found. Use step names only, with no numbers unless the owner supplies them.
  - (b) An excerpt of the document-intelligence requirements: 3–4 requirement statements and one success metric definition, written from the facts above.
- **Do not use** "1000+ installs in 2 months" or "25% MoM increase in monthly active users" from the old portfolio. The owner decided the site uses CV figures only.
- **Learned (draft):** analytics finds where users drop off; only talking to users finds why.
- **Further reading** (end of the case study): "The Problem with Retail Investing" and "Introducing Top Picks" from the GPT Investor series on Substack (Section 4.1, item 5).

### 5.6 `merge-x-requirements-from-failure`: Turning a prototype's failures into a product's requirements

- **Role / period:** Founder, Product & BA Lead, Version Phi · Oct 2026–present. In private beta at `https://mergex.versionphi.com`. The owner has approved listing it publicly.
- **Context:**
  - Merge X is a mail merge web app for sending personalised emails from Gmail using a spreadsheet.
  - It is a rebuild of the owner's earlier Google Sheets and Apps Script prototype, written up in Side Quest 3: `https://xmusings.substack.com/p/side-quest-3`.
- **The problem:** the prototype worked but failed in ways real users would hit:
  - broken non-Latin names
  - sending quota limits
  - a fragile setup
- **What I did:**
  - Turned the prototype's failures into a requirements document and 100+ backlog items.
  - Directed AI coding agents (Claude Code) to ship the full sending loop in 6 days.
  - Designed privacy and compliance in from day one:
    - Access limited to Gmail sending and per-file Drive access, with a build check that blocks broader permissions.
    - Encrypted tokens.
    - Signed one-click unsubscribe with a suppression list.
    - One-step data export and account deletion.
  - Replaced estimates with measurements:
    - Profiled CPU usage on Cloudflare Workers.
    - Closed a double-send risk after crashes.
    - Modelled free-tier capacity limits.
    - Logged every decision with its trade-offs.
- **Outcome:** 300 test emails sent with 0 errors; $0 running cost.
- **Build notes** (secondary box): 129 merged pull requests, 1,176 automated tests, 99.7% core coverage, 6 days to the full sending loop.
- **Artefacts:**
  - (a) A "failure → requirement" table: 3 rows built only from the three prototype failures above, with columns Failure observed · Requirement · How it's verified. Label it "Simplified."
  - (b) A short permissions table: Permission requested · Why it's needed · What was ruled out. Build it from the access facts above.
- **Learned (draft):** a prototype's failures are the best requirements source you'll get; permissions and unsubscribe are requirements, not afterthoughts; measure before you scale.
- **Tags:** AI product · Requirements · AI governance (privacy).

---

## 6. Content source of truth

### 6.1 Experience (titles and dates must match the CV exactly)

The site may include more than the BA CV, since it isn't bound by the CV's length (Section 1.4). Merge X is on the site but not on the BA CV. Anything that appears in both must match exactly.

| Role | Organisation | Dates |
|---|---|---|
| Business Analyst & Project Manager, Financial Inclusion | Access Bank Plc, Lagos | Mar 2024 – Present |
| Business Analyst, Partnerships & Digital Capabilities | Access Bank Plc, Lagos | Jun 2023 – Feb 2024 |
| Curator / Product Manager | AU-Startups | Sep 2022 – May 2023 |
| Founder, Product & BA Lead: Aimery | Version Phi | Sep 2026 – Present |
| Founder, Product & BA Lead: Merge X | Version Phi | Oct 2026 – Present |
| Product Lead: GPT Investor | GPT Investor | Mar 2024 – Present |

Timeline highlights for the earlier roles (use as written):

- **Partnerships & Digital Capabilities:**
  - Turned ambiguous needs into 10+ requirements documents with end-to-end process flows for partner initiatives with MoMo PSB (MTN's payment service bank), TeamApt and Paystack.
  - Led requirements for the Access Switch Fee Module enhancement and the DCIR Web Merchant Manager and Dispute Resolution Portal, modelling the DCIR processes in BPMN.
- **AU-Startups:** grew an African startup publication 9x; managed partnerships with GITEX Africa and IATF.

Current-role extras for the timeline:

- Led the launch of the Beta 2.0 digital onboarding app and portal.
- Integration requirements with NIBSS, UPSL, Interswitch, CoralPay and Hydrogen.
- Contributed to initiatives that grew agency banking channel revenue by 64%.
- Promoted in 2026.
- Presented "Managing Stress in High-Pressure Projects" to the Bank's project management community (2026).
- Onboard and coach new BAs, PMs and interns.

### 6.2 Approved figures (the only numbers allowed on the site)

| Figure | Where it's used |
|---|---|
| 4 years in banking, payments and AI products | Hero, About |
| ₦268.36M deposits, 2,210 savings accounts, 403 field agents, 6 months | Beta 2.0 (proof strip, timeline) |
| ₦1.2M daily agent cap, ₦100,000 customer daily limit, 4 weeks, first bank to comply | Closa CBN case study |
| 99.9% portal uptime; **projected** 2M+ transactions and ₦100M+ revenue in year one | Aggregator case study |
| 64% agency banking channel revenue growth (contributed to) | Timeline |
| 10+ requirements documents | Timeline |
| Scores 76–79 / 83–84 / 79–80; 147 merged PRs; 793 automated tests | Aimery |
| 15+ user interviews; 10,000+ downloads; 25% retention improvement | GPT Investor |
| 100+ backlog items; 6 days; 129 merged PRs; 1,176 automated tests; 99.7% core coverage; 300 test emails, 0 errors; $0 running cost | Merge X (from the owner's build reports and AI BA CV) |
| 9x publication growth | AU-Startups |

Any other number needs the owner's written approval first. Where the old Gamma portfolio and the CV disagree, **the CV wins** (owner decision).

### 6.3 Certifications and links

| Certification | Issuer | Link |
|---|---|---|
| Certified Business Analysis Professional (CBAP) | IIBA | https://badges.iiba.org/5710c675-386a-4529-976c-604c7296e83e |
| Professional Scrum Product Owner II (PSPO II) | Scrum.org | https://www.credly.com/badges/16628871-8a74-490d-9094-c876af65cc75/public_url |
| Prompt Design in Vertex AI | Google Cloud | https://www.credly.com/badges/38921c86-50ae-44b5-8e9a-1a07a9809ae3 |
| AI for Product Management | Pendo | https://www.credly.com/badges/b940e1ff-71d0-48f7-b1cf-98bee032349d/public_url |
| Business Analytics Nanodegree | Udacity | https://www.udacity.com/certificate/e/ce684c50-2841-11ee-bf5d-4f286504c77c |
| Product Analytics | Product School & Mixpanel | https://drive.google.com/file/d/1QbhY4rhmJ2FwIUoj7FCW0N0jN6yZTZEi/view?usp=sharing |
| Fundamentals of Agile Project Management | PMI | https://www.credly.com/badges/30605f10-6e6f-402d-a4c5-700ffddded1e |
| Fundamentals of Predictive Project Management | PMI | https://www.credly.com/badges/7f756916-06d0-453e-92b1-14ce2c7d9ce0/public_url |
| ITIL 4 (training) | – | no link |

**Education:**
- MBA, Strategic Management, Babcock University (expected 2027)
- BSc, University of Ibadan (2021)

### 6.4 Contact and profiles

- Email: olapadeben@gmail.com
- LinkedIn: https://www.linkedin.com/in/boluwatife-olapade
- Substack: https://xmusings.substack.com/
- GitHub: https://github.com/heisX3N0. Show it in the footer and on the About page. **This site's repository is public.** All other repositories stay private unless the owner says otherwise. Never link to a private repo.
- Phone and WhatsApp: **do not publish** on the site (the phone number stays on the CV only).
- Location: Lagos, Nigeria

---

## 7. Artefact and diagram requirements

- Render all diagrams **at build time** to inline SVG, with no client-side diagram libraries. Mermaid rendered at build time, or hand-authored SVG components, are both fine.
- Every diagram has:
  - a `<figure>` with a `<figcaption>`
  - an `aria-describedby` text alternative that walks through the steps in words
  - readable text at 360px wide, or horizontal scroll inside the figure only, never page-level scroll
- Use the site's palette and type in diagrams, not default Mermaid colours.
- Tables are real HTML `<table>` elements with `<th scope>` and a caption, never images of tables.
- Label sanitised artefacts "Illustrative" or "Simplified", and use fictional placeholder values.

---

## 8. Design direction

- **Feel:** editorial and calm, like a well-typeset report rather than a startup landing page. Generous whitespace, strong typographic hierarchy, few colours.
- **Colour:**
  - Deep navy accent `#1F3A5F` (matches the CV) on an off-white background.
  - The header and the role page hero sit on a deeper navy band (`#172C49`) with off-white text (v3.1).
  - One warm secondary accent: ochre gold (v3.1; `#7A5300` as text on light backgrounds, `#E8C26A` on navy and in dark mode). Gold is for the title line, the primary action, rules, highlights and tags; never body text or large fills.
  - Text contrast at least 4.5:1, and 3:1 for large text and UI elements.
- **Dark mode:** follow `prefers-color-scheme`, with a manual toggle. Store the choice in `localStorage` wrapped in try/catch. The toggle is an icon button whose accessible name says what it does ("Switch to dark theme"). The hero band stays the same navy on the dark page, with a 1px lighter bottom edge (`#4A6890`, at least 3:1 against the page) so it keeps its shape (v3.1).
- **Type:**
  - A readable serif for headings and a clean sans for body text, or one variable sans with strong weight contrast.
  - Self-host fonts with `font-display: swap`, at most 2 families.
- **Layout:**
  - Single column for reading, max line length about 70 characters.
  - Cards in a responsive grid.
  - Mobile-first from 360px; no horizontal page scroll at any width.
- **Motion:** minimal, and none when `prefers-reduced-motion` is set.
- **Avoid:**
  - gradients on text
  - glassmorphism
  - emoji as icons
  - "Hi, I'm…" waving-hand clichés
  - skill percentage bars
  - logos of companies the owner did not work for
- **Favicon and social card:**
  - Favicon: simple initials monogram "BO".
  - Social card: a 1200×630 Open Graph image with name, title and positioning line, generated at build time. Each role page gets its own card with its own title.
- **Headshot slot:**
  - v1 is text-only, but the hero on the root and role pages has a reserved headshot position controlled by `headshot.show` (default `false`) and `headshot.src` in the site config.
  - With the flag off, the layout must look complete with no gap or placeholder.
  - With the flag on, show a circular or soft-cornered image (at least 320px source, served at 2x) beside the name on desktop and above it on mobile, with alt text "Boluwatife Olapade".
  - The OG image can use the headshot when the flag is on.

---

## 9. Technical requirements

### 9.1 Stack

- **Framework:** Astro (latest stable), static output. Content in Markdown or MDX via content collections with typed frontmatter (Zod schema).
- **Styling:** plain CSS with custom properties, or Tailwind. Builder's choice, but no CSS-in-JS runtime.
- **JavaScript:** zero by default. Islands only where needed (theme toggle, optional filter enhancement).
- **Package manager:** pnpm. Pin the Node version in `.nvmrc`.
- **Hosting:** Cloudflare Pages on a **new, separate Cloudflare account** created for this site. Keep it apart from the account that hosts Aimery and Merge X, so that build quotas, usage and access stay separate. Deploy from the public GitHub repo's `main` branch, with preview deploys on PRs. No Pages Functions or Workers; the site is fully static.
- **Domain:** `boluwatife.olapade.site`. DNS stays at **Namecheap**; do not move the nameservers.
  1. In the new Cloudflare account, add `boluwatife.olapade.site` as a custom domain on the Pages project.
  2. At Namecheap (Advanced DNS for `olapade.site`), add a `CNAME` record with host `boluwatife` pointing to `<project-name>.pages.dev`.
  3. Wait for Cloudflare to verify the domain and issue the certificate, then enforce HTTPS.
  - The `*.pages.dev` URL must carry a canonical tag pointing at the custom domain.
  - Write these steps, with screenshots described in words, into the README for the owner to apply. Claude Code does not have Namecheap access.
- **Analytics:** Cloudflare Web Analytics. It is cookieless, so no consent banner is needed. No Google Analytics and no third-party trackers.

### 9.2 Content model

```
src/content/
  site.yaml               # name, contact links, github (hidden), headshot flag, root page copy
  about.md                # bio + how this site was built
  experience.yaml         # timeline (Section 6.1)
  certifications.yaml     # Section 6.3
  writing.yaml            # Substack groups, posts and series links (Section 4.1, item 5)
  roles/
    business-analyst.md   # published: true (v1)
    project-manager.md    # published: false (Phase 6)
    product-manager.md    # published: false (Phase 7)
  work/
    closa-cbn-compliance.mdx
    performance-buddy-access-control.mdx
    aimery-ai-requirements.mdx
    merge-x-requirements-from-failure.mdx
    aggregator-onboarding-redesign.mdx
    gpt-investor-discovery.mdx
```

Role page frontmatter schema:

```yaml
slug: string               # e.g. business-analyst (becomes /business-analyst/)
published: boolean         # unpublished roles are not built, linked or listed
title: string              # must match that role's CV
positioning: string
supporting: string
proofStrip:                # max 5; numbers must be in Section 6.2 (v3.1: figure first)
  - { figure: string, text: string }
howIWork:                  # 4-6 steps; example is an optional case study slug (v3.1)
  - { step: string, line: string, artefacts: string, example?: string }
tools: string
featuredWork: string[]     # case study slugs, in display order
cvFile: string             # e.g. /cv/business-analyst.pdf
contactLine: string
```

Case study frontmatter schema:

```yaml
title: string
slug: string
summary: string            # one-line outcome for cards
role: string
organisation: string
period: string
tags: [Banking | AI product, Requirements | Process | Data | AI governance]
roles: [business-analyst | project-manager | product-manager]
headlineFigure: string     # must appear in Section 6.2
order: number
draft: boolean             # drafts are excluded from production builds
```

### 9.3 SEO and sharing

- Unique `<title>` and meta description on every page.
- Canonical URLs.
- Open Graph and Twitter card tags.
- `robots.txt` allowing all, plus `sitemap.xml`. **Never** emit `noindex` in production.
- JSON-LD `Person` schema on the root page, each role page and About (jobTitle per role page):
  - name, jobTitle, `sameAs` (LinkedIn)
  - `hasCredential` for CBAP and PSPO II
  - `alumniOf` for the University of Ibadan and Babcock University
- JSON-LD `Article` schema on each case study.

### 9.4 Performance, accessibility and quality

- Lighthouse 95+ in all four categories, mobile and desktop.
- Total transfer per page under 200 KB excluding the CV PDF and optional headshot.
- Images:
  - Astro `<Image>`, AVIF or WebP, explicit width and height.
  - Lazy-load below the fold.
  - Meaningful alt text; empty alt for decorative images.
- Accessibility, WCAG 2.2 AA:
  - semantic landmarks
  - a skip-to-content link
  - visible focus states
  - keyboard-navigable throughout
  - no information conveyed by colour alone
- Validation:
  - HTML validates.
  - No console errors.
  - A link checker passes in CI.
- **CI (GitHub Actions)**, on every PR:
  - Steps:
    - install
    - type check
    - build
    - link check (internal plus external, with retries)
    - Lighthouse CI against the preview build, with the 95 budgets above
    - a **figures check**: a script that scans the visible text of built HTML for numbers and fails if any appear that are not in an allow-list derived from Section 6.2. Years, dates, step numbers in lists and the "Last updated" stamp are exempt.
  - PRs only merge when CI passes.

### 9.5 Privacy and security

- No cookies, forms or third-party scripts beyond Cloudflare Web Analytics.
- Security headers via `_headers`: Content-Security-Policy (self plus the analytics host), `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin` and `Permissions-Policy`. Aim for an A on securityheaders.com.
- The phone number never appears on the site.
- No Access Bank internal material in the repo, even in unpublished folders.

---

## 10. Build phases

Each phase ends with a PR, a preview URL and a short build report: what was done, what's left, and any `TODO(owner)` items. The owner approves each phase before the next starts.

1. **Scaffold and design system:**
   - Astro project, layout, header and footer, typography, colour tokens and dark mode
   - 404 page, CI pipeline and Cloudflare Pages preview
   - A style-guide page at `/styleguide/` (excluded from the sitemap) showing type, colours, cards, figure and table styles
2. **Root, BA role page and About:**
   - Sections 4.0, 4.1 and 4.4.
   - The content files and role-page system from 9.2, built so that a second role only needs a new content file.
   - The BA CV file.
3. **Case studies:** template from 4.3, the 6 fact sheets from Section 5, and all artefacts per Section 7.
4. **SEO, analytics and hardening:** Section 9.3–9.5, OG image generation (one per role page), security headers, the figures check.
5. **Launch (v1):**
   - Connect `boluwatife.olapade.site` and verify HTTPS.
   - Submit the sitemap to Google Search Console.
   - Run the final QA (Section 11).
   - Write `README.md` covering how to edit content, add a case study, add or publish a role page, replace a CV, turn on the headshot and deploy.
6. **Project Manager role page:** needs a spec addendum (positioning, proof strip, delivery lifecycle, featured work, fact sheets for any new case studies such as Geotagging or Angola Forex) and the PM CV. **Not started until the owner supplies the addendum.**
7. **Product Manager role page:** same as Phase 6, for product roles.

---

## 11. Acceptance checklist (launch gate)

- [ ] Title, dates and figures match the CV and Section 6 exactly; the figures check passes.
- [ ] The BA role page's title matches the BA CV exactly; no "Product Manager" title appears on it.
- [ ] Unpublished role pages are not built, linked or in the sitemap; there are no "coming soon" placeholders.
- [ ] Role pages don't link to each other.
- [ ] The first screen of the root page, the BA role page and every case study passes the depth rule (Section 1.4) at 1366×768 and 390×844.
- [ ] Performance Buddy is not described as live, launched or piloted, and has no internal details.
- [ ] Projected aggregator figures are labelled as projected.
- [ ] Every case study has at least one artefact with a caption and a text alternative.
- [ ] All certification links open the right badge.
- [ ] `/cv/business-analyst.pdf` opens the current BA CV.
- [ ] With the headshot flag off, the hero looks complete; with it on (test image), the layout holds at all widths.
- [ ] Lighthouse 95+ (mobile and desktop) on the root page, the BA role page, one case study and About.
- [ ] Keyboard-only walkthrough of all pages works; screen-reader spot check on the BA role page and one case study.
- [ ] No horizontal scroll at 360px; dark mode is readable everywhere.
- [ ] `robots.txt`, `sitemap.xml`, canonical tags, OG image and JSON-LD are present; no `noindex`.
- [ ] securityheaders.com grade A.
- [ ] The README lets the owner update content without help.

---

## 12. After launch (owner actions)

1. **CV link:** replace `bit.ly/m/boluwatife` on the BA CV with `boluwatife.olapade.site/business-analyst`. Each future CV links to its own role page.
2. **bit.ly link-in-bio:** keep it for social profiles, since older CVs still point to it, but update it:
   - Tagline: change "Building innovative products that solves real-world problems" (grammar error, and product framing) to the root line from Section 2.3, or "Business Analyst · Builder · Writer".
   - "Review my portfolio": point it to `https://boluwatife.olapade.site` instead of the Gamma page, and move it to the top.
   - Remove the WhatsApp icon unless you want your number public to anyone with the link.
   - Keep Substack and GPT Investor.
3. **Gamma portfolio:** unpublish it or replace its content with a link to the new site, so search results and old links don't show outdated numbers.
4. **LinkedIn:** update the "Website" field and the featured section.

---

## 13. Open questions for the owner

**Resolved:**
- Old portfolio figures: dropped; CV figures only.
- Domain: `boluwatife.olapade.site`, with DNS at Namecheap and hosting on a new Cloudflare account.
- Headshot: text-only for now, with a hidden slot.
- Merge X: listed publicly as a full case study.
- Hero copy: approved (Sections 2.1 and 2.3).
- GitHub: profile linked; this repo is public; other repos stay private.
- Substack: two groups, GPT Investor and Side Quests (Section 4.1, item 5).

- GitHub profile: https://github.com/heisX3N0.
- GPT Investor post URLs: supplied (Section 4.1, item 5).
- BA CV: supplied; the owner adds it to `public/cv/business-analyst.pdf`.

**No open questions block the build.** After launch, the owner updates the CV's portfolio link (Section 12) and replaces the PDF in the repo.

---

## 14. Kickoff prompt for Claude Code

Paste this into Claude Code in an empty folder that contains this file:

> Read SPEC.md in full. Then build **Phase 1 only** (Section 10). Before writing code, reply with: (1) your understanding of the goals in 5 bullets, (2) the exact stack and folder structure you'll use, (3) any conflicts or gaps you see in the spec. Don't invent content. Use `TODO(owner)` markers for anything missing. Finish with a PR, a preview URL and a build report.
