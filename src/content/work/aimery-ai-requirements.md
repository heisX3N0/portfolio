---
# Case study (SPEC 4.3 and 5.3). Written only from its fact sheet and SPEC 6. Numbers: SPEC 6.2 only.
title: "Specifying an AI assistant, then trying to break it"
slug: aimery-ai-requirements
summary: "Specified a two-step Gemini flow, then tested it for prompt injection: after the fix, injected postings scored back in the clean range."
role: "Founder, Product & BA Lead"
organisation: "Version Phi"
period: "Sep 2026 to Present"
team: "Solo, directing AI coding agents (Claude Code)"
tags: [AI product, AI governance]
roles: [business-analyst]
headlineFigure: "79 to 80"
order: 3
draft: false
glance:
  problem: "An assistant that rewrites a resume must not claim what the user hasn't done, and the job postings it reads can carry hidden instructions."
  role: "Founder, Product & BA Lead, Version Phi."
  produced: "The solution specification, a two-step Gemini flow, a prompt injection test with before and after scores, and monitoring and privacy controls."
  outcome: "After the fix, injected postings scored 79 to 80, back in the clean range of 76 to 79."
artefacts:
  - kind: flow
    id: aimery-flow
    label: "Simplified"
    caption: "The two-step Gemini flow: parse and screen the posting, tailor from the user's own accomplishments, then the user reviews anything stretched."
    steps:
      - label: "Job posting"
        note: "Treated as untrusted data"
      - label: "Parse and screen"
        note: "Structured JSON; deal-breakers quoted from the exact line"
      - label: "Tailor"
        note: "Only from the user's own accomplishments, within length budgets"
      - label: "User review"
        note: "Any stretch is flagged for the user"
  - kind: table
    id: aimery-injection
    caption: "Prompt injection test: fit scores for a job posting."
    columns: ["Posting", "Fit score"]
    rows:
      - ["Clean posting", "76 to 79"]
      - ["Injected, before the fix", "83 to 84"]
      - ["Injected, after the fix", "79 to 80"]
  - kind: table
    id: aimery-criteria
    label: "Illustrative"
    caption: "Two acceptance criteria, written from the requirements above."
    columns: ["Scenario", "Given", "When", "Then"]
    rows:
      - ["Hidden instructions in a posting", "a job posting with hidden text that tries to raise its own fit verdict", "Aimery parses and screens the posting", "the hidden text is treated as data, and the fit score stays in the clean range"]
      - ["A deal-breaker in a posting", "a posting that states a work authorisation requirement", "Aimery parses and screens the posting", "the requirement is flagged as a deal-breaker, quoting the exact line it came from"]
outcome:
  - "Before the fix, hidden text in a posting raised its own fit verdict from Good to Strong, scoring 83 to 84 against 76 to 79 for a clean posting. After all user input was treated as untrusted data, injected postings scored 79 to 80: back in the clean range."
  - "The daily model check proved its worth on its first run, when it caught a retired Gemini model."
buildNotes:
  - "147 merged pull requests and 793 automated tests, built solo with AI coding agents."
learned:
  - "Treat every user input to an LLM as untrusted, including text that looks like content, such as a job posting."
  - "Measure guardrails with before and after numbers. \"We fixed prompt injection\" means little; \"83 to 84 fell to 79 to 80\" can be checked."
  - "Keep a human in the loop for anything the model stretches. Here that human is the user, who knows what they have actually done."
---

## Context

Aimery is an AI assistant that tailors a user's resume to a specific job posting. I founded it under Version Phi in September 2026 as Founder and Product and BA Lead. It is live at [aimery.versionphi.com](https://aimery.versionphi.com), with a one-click public demo.

I wrote the solution specification first, then directed the build with AI coding agents (Claude Code). The specification covers use cases, user journeys, the data model, and functional, non-functional and security requirements.

## The problem

A resume tool built on a language model carries two risks that a normal form-filling app does not.

- **It writes on the user's behalf.** If the model invents a skill or inflates a result, the user sends a false claim to an employer under their own name.
- **It reads text it doesn't control.** A job posting comes from outside. Text hidden inside one can try to steer the model, for example by telling it the user is a perfect fit. This is prompt injection.

Both risks are requirements problems before they are engineering problems. The specification has to say what the model may use, what it must refuse, and how anyone would know whether a guardrail works.

## What I did

1. **Split the work into two Gemini calls.** The first parses a posting into structured JSON and screens it for deal-breakers (work authorisation, clearance, language and experience), quoting the exact line it found each one in. The second tailors the resume only from the user's own accomplishments, within strict length budgets, and flags any stretch for the user's review. Splitting the calls means each has one job and one set of rules to test.
2. **Tried to break it.** I tested the flow for prompt injection. Hidden text in a posting raised its own fit verdict from Good to Strong, with scores of 83 to 84 against 76 to 79 for a clean posting. The fix was a requirement, not a patch: all user input is treated as untrusted data. After it, injected postings scored 79 to 80, back in the clean range. The last table below writes two of these guardrails as acceptance criteria, in Given, When, Then form.
3. **Set up monitoring and privacy controls.** A daily live check calls every Gemini model the product uses; its first run caught a retired model. Error reports are scrubbed of personal data, and users can delete their own account.

Techniques: use cases, user journeys, non-functional and security requirements, test design with before and after measurement, and acceptance criteria.
