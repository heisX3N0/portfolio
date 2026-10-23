---
# Case study (SPEC 4.3 and 5.6). Written only from its fact sheet and SPEC 6. Numbers: SPEC 6.2 only.
title: "Turning a prototype's failures into a product's requirements"
slug: merge-x-requirements-from-failure
summary: "300 test emails sent with 0 errors; $0 running cost."
role: "Founder, Product & BA Lead"
organisation: "Version Phi"
period: "Oct 2026 to Present"
team: "Solo, directing AI coding agents (Claude Code)"
tags: [AI product, Requirements, AI governance]
roles: [business-analyst]
headlineFigure: "100+ backlog items"
order: 4
draft: false
glance:
  problem: "A working prototype failed in ways real users would hit: broken non-Latin names, sending quota limits and a fragile setup."
  role: "Founder, Product & BA Lead, Version Phi."
  produced: "A requirements document and 100+ backlog items, with privacy and compliance designed in from day one."
  outcome: "300 test emails sent with 0 errors; $0 running cost."
artefacts:
  - kind: table
    id: mergex-failures
    label: "Simplified"
    caption: "Failure to requirement: each of the prototype's failures became a requirement with a way to verify it."
    columns: ["Failure observed", "Requirement", "How it's verified"]
    rows:
      - ["Non-Latin names came out broken", "Names in any script are sent exactly as they appear in the spreadsheet", "Automated tests send merges with non-Latin names and compare the result"]
      - ["Sending hit quota limits", "Sending works within the account's sending quota", "Automated tests at the quota limit"]
      - ["Setup was fragile", "Setup is signing in and choosing a spreadsheet, with no script to install", "An end-to-end test of the setup"]
  - kind: table
    id: mergex-permissions
    caption: "Permissions: what Merge X asks Google for, and what it ruled out. A build check blocks any broader permission."
    columns: ["Permission requested", "Why it's needed", "What was ruled out"]
    rows:
      - ["Gmail: send only", "To send each merged email from the user's own Gmail", "Reading or managing the user's mailbox"]
      - ["Drive: per-file access", "To read only the spreadsheet the user chooses", "Access to the rest of the user's Drive"]
outcome:
  - "300 test emails sent with 0 errors, at $0 running cost. The full sending loop shipped in 6 days."
  - "Merge X is in private beta at [mergex.versionphi.com](https://mergex.versionphi.com)."
buildNotes:
  - "129 merged pull requests, 1,176 automated tests, 99.7% core coverage, and 6 days to the full sending loop."
learned:
  - "A prototype's failures are the best requirements source you'll get: each one is a real user problem you have already seen."
  - "Permissions and unsubscribe are requirements, not afterthoughts."
  - "Measure before you scale. A profile or a capacity model beats an estimate."
---

## Context

Merge X is a mail merge web app: it sends personalised emails from a user's Gmail account, using a spreadsheet for the names and details. I founded it under Version Phi in October 2026, and it is in private beta.

It is a rebuild. I first built a prototype in Google Sheets and Apps Script, and wrote about it in [Side Quest 3](https://xmusings.substack.com/p/side-quest-3). The prototype worked, and the ways it failed became the rebuild's requirements.

## The problem

The prototype worked for me, but it failed in ways that real users would hit:

- **Broken non-Latin names.** Names outside the Latin alphabet didn't survive the merge.
- **Sending quota limits.** Gmail limits how much an account can send, and the prototype ran into those limits.
- **A fragile setup.** Getting it running was easy to get wrong.

A product built on the same assumptions would fail the same way. The job was to turn each failure into a requirement before writing any new code.

## What I did

1. **Turned the failures into requirements.** I wrote a requirements document and broke it into 100+ backlog items. The first table below shows the three failures, simplified.
2. **Directed the build with AI coding agents.** Working with Claude Code, I shipped the full sending loop in 6 days.
3. **Designed privacy and compliance in from day one:**
   - Access is limited to Gmail sending and per-file Drive access, and a build check blocks any broader permission.
   - Tokens are encrypted.
   - Every email has a signed one-click unsubscribe, backed by a suppression list.
   - Users can export their data or delete their account in one step.
4. **Replaced estimates with measurements.** I profiled CPU usage on Cloudflare Workers, closed a double-send risk after crashes, modelled the free-tier capacity limits, and logged every decision with its trade-offs.

Techniques: requirements from observed failures, backlog writing, privacy and permission requirements, and measurement in place of estimates.
