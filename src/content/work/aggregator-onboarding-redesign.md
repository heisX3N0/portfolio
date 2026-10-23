---
# Case study (SPEC 4.3 and 5.4). Written only from its fact sheet and SPEC 6. Numbers: SPEC 6.2 only.
# Projected figures (2M+ transactions, ₦100M+ revenue) must share a sentence with "projected" (a test checks this).
# Never use the old portfolio's "25% increase in aggregator engagement" (owner decision: CV figures only).
title: "Scaling an agent network without adding operations staff"
slug: aggregator-onboarding-redesign
summary: "Redesigned staff-led agent onboarding as an aggregator-led model, so the network can grow without extra operations headcount."
role: "Business Analyst & Project Manager, Financial Inclusion"
organisation: "Access Bank Plc"
period: "Mar 2024 to Present"
team: "Bank operations; the platform vendor, CEVA Software"
tags: [Banking, Process]
roles: [business-analyst]
headlineFigure: "99.9% uptime"
order: 5
draft: false
glance:
  problem: "Agent onboarding was staff-led, so the Bank's own operations team became a bottleneck as the network grew."
  role: "Business Analyst & Project Manager, Financial Inclusion."
  produced: "A map of the current process, an aggregator-led future design on Closa 2.0, and refined requirements and backlog with the vendor."
  outcome: "The network can grow without extra operations headcount, and the portal runs at 99.9% uptime."
artefacts:
  - kind: swimlane
    id: aggregator-swimlane
    label: "Simplified"
    caption: "Agent onboarding before and after: staff-led today, aggregator-led on Closa 2.0, with the controls kept by the Bank."
    lanes: ["Prospective agent", "Bank operations", "Aggregator", "Platform"]
    states:
      - title: "Current state: staff-led"
        steps:
          - { lane: "Prospective agent", label: "Applies to the Bank" }
          - { lane: "Bank operations", label: "Reviews the application" }
          - { lane: "Bank operations", label: "Checks the documents" }
          - { lane: "Bank operations", label: "Sets up the agent" }
          - { lane: "Platform", label: "Activates the agent" }
          - { lane: "Bank operations", label: "Supports the agent" }
      - title: "Future state: aggregator-led"
        steps:
          - { lane: "Bank operations", label: "Sets the controls" }
          - { lane: "Prospective agent", label: "Applies to an aggregator" }
          - { lane: "Aggregator", label: "Onboards the agent" }
          - { lane: "Platform", label: "Checks against Bank controls" }
          - { lane: "Platform", label: "Activates the agent" }
          - { lane: "Aggregator", label: "Manages the agent" }
outcome:
  - "The business can scale its agent network without extra operations headcount, and the portal runs at 99.9% uptime."
  - "Projected for year one, not yet achieved: 2M+ transactions and ₦100M+ revenue."
learned:
  - "Process redesign is a lever for scale: changing who does the work can do more than adding people to do it."
  - "Push the work to the party with the incentive, and keep the controls with the Bank."
---

## Context

Access Closa is Access Bank's agent banking network, and it runs on the Closa 2.0 platform. The network grows by onboarding new agents: people and businesses who serve customers on the Bank's behalf.

Agent onboarding was staff-led. The Bank's own operations team handled each new agent, so the team's capacity set the pace at which the network could grow. I worked on this as Business Analyst and Project Manager in Financial Inclusion.

## The problem

A staff-led process scales with headcount. Every new agent added work for the same operations team, and as the network grew that team became the bottleneck. The alternative to hiring more operations staff was to change who does the work.

The question was how to keep growing the network without the Bank's operations team sitting in the middle of every onboarding, while keeping the Bank in control of who joins and on what terms.

## What I did

1. **Mapped the current process.** I mapped the staff-led onboarding process as it ran, lane by lane, to show where the work landed: most of it sat with Bank operations.
2. **Redesigned it around aggregators.** In the future-state design on Closa 2.0, third-party aggregators onboard and manage their own agents, within controls the Bank sets. The Bank moves from doing every onboarding to setting the rules that every onboarding follows.
3. **Ran requirements and backlog refinement with the vendor.** I worked with the platform vendor, CEVA Software, to turn the design into requirements and a refined backlog for Closa 2.0.

The swimlane below compares the two states. It is simplified: generic lanes and steps, not the Bank's real procedure.

Techniques: current-state and future-state process mapping, swimlane diagrams, requirements elicitation and backlog refinement with a vendor.
