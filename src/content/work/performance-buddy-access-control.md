---
# Case study (SPEC 4.3 and 5.2). Written only from its fact sheet and SPEC 6.
# In progress: never describe it as live, launched or in pilot, and give no timelines (a test checks the words).
# Strict sanitisation: no names, emails, IDs, real region, branch or division names, or database, table or column
# names. Artefacts use fictional placeholders only ("Region A", "Branch 001"). No links to internal documents.
title: "Making a KPI dashboard show each user only their own patch"
slug: performance-buddy-access-control
summary: "A single, testable access model from Account Officer to executive, separating who you are from what you can see."
role: "Project Manager and Business Analyst"
organisation: "Access Bank Plc"
period: "2026"
team: "Data Management Office; Financial Control (FINCON)"
tags: [Banking, Data]
roles: [business-analyst]
order: 2
draft: false
glance:
  problem: "The company directory confirms who a user is, but it cannot say which part of the Bank they should see."
  role: "Took over the project as Project Manager and Business Analyst in 2026."
  produced: "Authorisation requirements, an architectural brief for developers, a four-step access check and a decision table."
  outcome: "A single, testable access model from Account Officer to executive. The project is in progress."
artefacts:
  - kind: decision
    id: buddy-access-check
    label: "Illustrative"
    caption: "The access check: tried in order, and the first step that matches decides what the user sees. Generic labels only."
    checks:
      - question: "Is the user's email in the leadership mapping table?"
        yes: "Their region, group or division; bank-wide for executives"
      - question: "Is the user's job title branch manager?"
        yes: "Their own branch only"
      - question: "Is the user an account or relationship officer?"
        yes: "Their own portfolio, by staff code"
    otherwise: "No access: the default for everyone else"
  - kind: table
    id: buddy-decision-table
    label: "Illustrative"
    caption: "Sample decision table, with fictional placeholder values."
    columns: ["Role type", "Source of truth", "Data filter", "What they see"]
    rows:
      - ["Executive", "Leadership mapping table", "None: bank-wide", "The whole bank"]
      - ["Regional leader", "Leadership mapping table", "Region is Region A", "Region A and every level below it"]
      - ["Branch manager", "Job title in the directory", "Branch is Branch 001", "Branch 001 only"]
      - ["Account or relationship officer", "Staff code in the directory", "Portfolio belongs to their staff code", "Their own portfolio"]
      - ["Anyone else", "None", "No match", "Nothing: no access by default"]
outcome:
  - "The project now has a single, testable access model that runs from Account Officer to executive. It separates authentication (who you are) from authorisation (what you can see), and each step of the check can be tested on its own."
  - "There are no outcome figures yet: the project is still in progress."
learned:
  - "Separate identity from authorisation early. The directory is good at saying who someone is; it was never designed to say what they should see."
  - "The riskiest bugs sit in data quality at the boundaries. A stray space in a code can empty a dashboard as surely as a wrong rule."
  - "Make the business own the data that changes most often. Leadership moves are a table update, not a release."
---

## Context

Performance Buddy is a near real-time Retail Banking KPI dashboard. It replaces manual Excel reports and brings data-warehouse and Pi360 metrics into one role-based view, so each user sees the performance figures for the part of the Bank they are responsible for.

Two teams shape what it shows. The Data Management Office supplies the data sources. Financial Control (FINCON) owns the targets and the financial metric definitions, and validates the figures against FinTrak data. I took over the project as Project Manager and Business Analyst in 2026, and it is still in progress.

## The problem

A role-based view is only as good as the rule that decides each user's role. The obvious source for that rule was the company directory (Active Directory). But the directory confirms who a user is; it cannot express the Bank's business hierarchy, such as who leads which region, group or division.

That gap showed up in two ways:

- **Senior leaders defaulted to bank-wide visibility.** With nothing in the directory to narrow their view, the simplest rule gave them everything.
- **Leaders' branch codes pointed to the wrong place.** In the directory, a leader's branch code reflected their HR cost centre, not the area they actually manage. A rule built on it would show a leader someone else's patch.

For a dashboard of performance figures, either outcome is a problem. Users need to see their own area, all of it, and nothing they shouldn't.

## What I did

I wrote the authorisation requirements and an architectural brief for the developers. The core of both is one idea: keep authentication and authorisation apart. The directory answers "who is this?"; business data answers "what may they see?".

1. **Defined a cascading access check.** Four steps, tried in order, and the first that matches decides:
   1. The leadership mapping table, looked up by the user's email. It gives a region, group or division, or bank-wide for executives.
   2. Branch managers, identified by job title and restricted to their branch.
   3. Account and relationship officers, restricted to their own portfolio by staff code.
   4. Everyone else gets no access by default.
2. **Put the changing data with the people who change it.** The hierarchy data comes from the Data Management Office, and the business maintains the leader table. When a leader moves, someone updates a table; no one changes code.
3. **Found a data quality fault before it reached users.** Branch and staff codes from the directory carried stray spaces. Those would break the data joins and return empty dashboards. I specified trimming at the point of capture, so the codes are clean before any join uses them.
4. **Added a "drill down only" rule.** Users can view only the levels below their own.

Techniques: authorisation requirements, decision logic and decision tables, data quality analysis and an architectural brief.
