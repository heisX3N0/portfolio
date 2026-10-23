---
# Case study (SPEC 4.3 and 5.5). Written only from its fact sheet and SPEC 6. Numbers: SPEC 6.2 only.
# Never use the old portfolio's "1000+ installs in 2 months" or "25% MoM increase in monthly active users".
title: "From user interviews to a 25% retention lift"
slug: gpt-investor-discovery
summary: "15+ user interviews and Mixpanel funnel analysis behind data-driven iterations that improved retention by 25%."
role: "Product Lead"
organisation: "GPT Investor"
period: "Mar 2024 to Present"
team: "Retail investors, the app's users"
tags: [AI product, Requirements, Data]
roles: [business-analyst]
headlineFigure: "10,000+ downloads"
order: 6
draft: false
glance:
  problem: "To give retail investors useful AI stock digests, the product had to learn what they needed and where they dropped out."
  role: "Product Lead, GPT Investor."
  produced: "Requirements from 15+ user interviews, a funnel analysis that traced a drop-off to a bug, and requirements for a document-intelligence MVP."
  outcome: "10,000+ downloads, and data-driven iterations that improved retention by 25%."
artefacts:
  - kind: funnel
    id: gpt-funnel
    label: "Simplified"
    caption: "Where the drop-off was: the sign-up funnel, step names only."
    steps:
      - label: "Download the app"
      - label: "Sign up"
      - label: "Verify"
        note: "Drop-off found here: a routing bug"
        highlight: true
      - label: "Receive personalised digests"
  - kind: table
    id: gpt-docintel
    label: "Illustrative"
    caption: "An excerpt of the document-intelligence MVP requirements."
    columns: ["Requirement", "Statement"]
    rows:
      - ["Extract", "The system extracts transactions from the user's bank SMS and email alerts."]
      - ["Deduplicate", "The system removes duplicate transactions, so each one is counted once."]
      - ["Categorise", "The system assigns each transaction a category and a confidence score."]
      - ["Correct", "The user can correct any extracted transaction or category (human in the loop)."]
      - ["Success metric", "Accuracy: the share of extracted transactions that need no correction from the user."]
outcome:
  - "GPT Investor passed 10,000+ downloads ([evidence](https://drive.google.com/file/d/1gtJ2aahlK2RXt7cBx8niqJJawBmuKB5Y/view?usp=sharing))."
  - "Data-driven iterations improved retention by 25%."
learned:
  - "Analytics finds where users drop off; only talking to users finds why."
  - "Check the plumbing before redesigning the experience: the drop-off at verification had a routing bug behind it."
furtherReading:
  - title: "The Problem with Retail Investing"
    url: "https://xmusings.substack.com/p/the-problem-with-retail-investing"
  - title: "Introducing Top Picks"
    url: "https://xmusings.substack.com/p/introducing-top-picks"
---

## Context

GPT Investor is an AI-powered investment research app. It gives retail investors personalised AI stock digests, and it was accepted into Anthropic's Claude for Startups programme. I have led the product since March 2024; it is at [gptinvestorapp.com](https://gptinvestorapp.com).

A digest only helps if it is about the right stocks, at the right depth, for the person reading it. That makes knowing the user the core of the product.

## The problem

Two questions sat under every product decision. What do retail investors actually need from an AI digest? And when people downloaded the app but didn't stay, where and why did they leave?

Guessing at either would have meant building for an imagined user.

## What I did

1. **Ran requirements elicitation and user analysis.** I led 15+ user interviews and used what I heard to define the personalised AI stock digests.
2. **Followed the numbers to a bug.** A funnel shows each step of a flow and how many people make it to the next one. Using Mixpanel funnel analysis, I traced a drop-off at verification to a routing bug. With the bug found, I simplified the flow. The funnel below shows where the drop-off was, with step names only.
3. **Drafted requirements for a document-intelligence MVP.** The MVP extracts transactions from bank SMS and email alerts, removes duplicates and categorises them. The requirements include three things that make an AI feature testable:
   - **Confidence scores**, so the product can treat an uncertain extraction differently from a certain one.
   - **Human-in-the-loop corrections**, so the user can fix what the model gets wrong.
   - **Accuracy success metrics**, so "good enough" is defined before the build, not argued about after it.

Techniques: user interviews, requirements elicitation, funnel analysis, requirements with success metrics, and human-in-the-loop design.
