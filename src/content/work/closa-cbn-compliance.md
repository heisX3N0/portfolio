---
# Case study (SPEC 4.3 and 5.1). Written only from its fact sheet and SPEC 6. Numbers: SPEC 6.2 only.
title: "From CBN circular to live limits in 4 weeks"
slug: closa-cbn-compliance
summary: "Turned a new CBN circular into requirements and went live in 4 weeks, making the Bank the first to comply."
role: "Business Analyst & Project Manager, Financial Inclusion"
organisation: "Access Bank Plc"
period: "2024 to Present"
team: "The platform vendor and internal teams"
tags: [Banking, Requirements]
roles: [business-analyst]
headlineFigure: "4 weeks"
order: 1
draft: false
glance:
  problem: "A new Central Bank of Nigeria circular set new transaction limits for agent banking, and the Bank had to enforce them on its agent network."
  role: "Business Analyst & Project Manager, Financial Inclusion."
  produced: "Functional requirements built from the circular, and delivery coordinated with the vendor and internal teams."
  outcome: "Live in 4 weeks, making the Bank the first to comply."
artefacts:
  - kind: table
    id: closa-traceability
    label: "Illustrative, simplified"
    caption: "From circular to test: how each limit traces from the regulation to a test case."
    columns: ["Circular clause (paraphrased)", "Business rule", "Functional requirement", "Acceptance criterion", "Test case"]
    rows:
      - ["Cap what one agent can process in a day", "Each agent has a daily cap of ₦1.2M", "The platform keeps a running daily total per agent and declines a transaction that would take it over ₦1.2M", "Given an agent's total for the day is near ₦1.2M, when a transaction would exceed it, then it is declined and the agent is told why", "A transaction that would take an agent over ₦1.2M for the day is declined"]
      - ["Cap what one customer can do through agents in a day", "Each customer has a daily limit of ₦100,000", "The platform keeps a running daily total per customer and declines a transaction that would take it over ₦100,000", "Given a customer's total for the day is near ₦100,000, when a transaction would exceed it, then it is declined and the agent is told why", "A transaction that would take a customer over ₦100,000 for the day is declined"]
      - ["Apply both limits per day", "Both limits count only the current day's transactions", "Daily totals start again each day", "Given yesterday's totals reached a limit, when a new day starts, then transactions are accepted again up to the limit", "Transactions from the previous day do not count towards today's totals"]
outcome:
  - "Both limits went live on Closa 2.0 in 4 weeks. That made the Bank the first to comply with the circular, and it avoided potential multi-billion-naira penalties."
  - "In numbers: a ₦1.2M daily cap per agent and a ₦100,000 daily limit per customer, enforced by the platform rather than by policy alone."
learned:
  - "Treat regulatory text as requirements input. Tracing each clause to a rule, a requirement and a test shows the gaps before the build starts, not after the deadline."
  - "Agree acceptance criteria with compliance before the build starts, so that \"done\" means compliant, not just built."
---

## Context

Access Closa is Access Bank's agent banking network: agents serve customers on the Bank's behalf, and the network runs on the Closa 2.0 platform. I work on it as Business Analyst and Project Manager in Financial Inclusion.

The Central Bank of Nigeria (CBN) issued a new circular that set new transaction limits for agent banking. Every bank with an agent network had to enforce them. For Access Bank, that meant Closa 2.0 had to know the limits, count against them and refuse transactions that broke them.

## The problem

A circular is written for compliance officers, not for a build team. It says what must be true; it does not say how a platform should behave when a transaction arrives. Someone has to turn each clause into rules a system can enforce and a tester can check. If that translation is loose, the Bank ships something that looks compliant but leaves gaps.

The stakes were high on both sides. A gap between the circular and the platform was a compliance exposure, with potential multi-billion-naira penalties. And the work had to move fast, with a vendor and several internal teams involved in getting any change specified, built and released.

## What I did

I treated the circular as a requirements source, and the build as something to coordinate, not just hand over.

1. **Read the circular as requirements.** I took the clauses on agent banking limits and restated each one in business terms, without the legal wording, so that everyone on the project read the same rule the same way.
2. **Wrote the business rules and functional requirements.** Two limits mattered: a ₦1.2M daily cap per agent and a ₦100,000 daily limit per customer. For each, the requirements say what the platform counts, when it counts it and what happens when a transaction would break the limit.
3. **Made the requirements testable.** A rule is only useful if someone can check it. The table below shows the approach in a simplified form: each limit traced from the clause to a business rule, a functional requirement, an acceptance criterion and a test case.
4. **Coordinated delivery.** As Project Manager I worked with the vendor and the Bank's internal teams to get the change specified, built and released.

Techniques: requirements elicitation from a regulatory source, business rules, functional requirements, acceptance criteria, test design and clause-level traceability.
