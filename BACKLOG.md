# Backlog

Open work only. Done items move to `docs/backlog-done.md`. Phases come from SPEC.md Section 10; the owner approves each phase before the next starts.

- [ ] **P4.5 Shorter search and share titles** (S)
  - **Why:** an OpenGraph check of `/business-analyst/` on 2026-10-23 (owner, opengraph.xyz) warned that `og:title` is 79 characters, the page title 83 and the description 234. Search results and link previews cut titles at about 60 characters and descriptions at about 125, so the BA page shows as "Boluwatife Olapade | Business Analyst | AI & Digital Solutions ..." and its description is cut mid-sentence. Today the title is the name plus the full CV title (`[role].astro`) and the description is the role's `supporting` paragraph.
  - **Do:**
    - Role files get two optional fields: a short title for `<title>` and `og:title` ("Business Analyst" on the BA page, giving "Boluwatife Olapade | Business Analyst"), and a short share description for `meta description` and `og:description`. Without them a role page behaves as today.
    - The hero, the OG image and the JSON-LD `jobTitle` keep the full CV title (SPEC 9.2: the title must match the CV).
    - Apply the same to case studies if the owner decides so (open question 2).
    - SPEC 9.2's role schema gains the two fields; README content notes say what each is for.
  - **Tests:**
    - Refused: a short title or share description over its limit (60 and 160 characters) fails the schema; a short title that is not a leading part of the CV title fails (so it never says something the CV does not); a share description with a number not in SPEC 6.2 fails the figures check (already scanned since P4).
    - Refused: the hero or JSON-LD `jobTitle` ever showing the short title instead of the full CV title.
    - Fallback: a role file without the new fields builds exactly as today (title, description and `og:*` unchanged).
    - Happy path: `/business-analyst/` has `<title>` and `og:title` "Boluwatife Olapade | Business Analyst", the agreed short description in `description` and `og:description`, and the full CV title in the hero and JSON-LD; titles stay unique on every page.
  - **Docs:** SPEC 9.2 role schema, README content notes, `CLAUDE.md` content rules (where the full CV title must appear and where the short one may).
  - **Cost:** per page view about 0 bytes (a few hundred bytes less HTML on the BA page: shorter title and description, measured after the change). Per push: 1 Pages build, unchanged. Users supported: unchanged. $0. Dev only: no new CI step.
  - **Depends on:** P4 (merged, `9b6444b`).
  - **Open questions for the owner:**
    1. Share description wording, from approved copy only: (a) the positioning line, "Business Analyst who builds with AI." (36 characters); (b) the first clause of the supporting paragraph, "I turn regulatory deadlines, tangled processes and AI ideas into requirements that banks and product teams can build." (about 117); or the owner's own words.
    2. Case studies: their titles run to about 80 characters ("Turning a prototype's failures into a product's requirements | Boluwatife Olapade"). Shorten them too (for example, drop "| Boluwatife Olapade" from the share title only), or leave them?
    3. Order: build this before P5, or fold it into P5's final QA?
  - **Owner decisions (2026-10-23):** a shorter page and share title is fine, as long as the hero keeps the full CV title.

- [ ] **P5 Launch (v1)** (M)
  - **Why:** SPEC 10 phase 5 and the Section 11 checklist.
  - **Do:** connect the domain (owner applies the Namecheap CNAME), Search Console, final QA, full README.
  - **Depends on:** P4.

P6 (Project Manager role page) and P7 (Product Manager role page) are not on the backlog until the owner supplies each spec addendum and CV (SPEC 10).
