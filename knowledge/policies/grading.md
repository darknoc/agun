---
type: Policy
title: Grading policy
id: grading
description: The shared evaluation model — four layers combined into a composite score that governs certification.
tags: [policy, grading, evaluation]
timestamp: 2026-06-26T00:00:00Z
---

# Grading

Every benchmark scores an agent on four layers, shared across the DarkNOC ecosystem (agym.ai and
agun.ai use the same contract):

| Layer | What it measures |
|---|---|
| **Command correctness** | Are the agent's commands syntactically and semantically valid for the target system? |
| **Situational appropriateness** | Are the actions right for the current network state and context? |
| **Anticipated impact** | Does the agent model the consequences of its actions before taking them? |
| **DOIL compliance** | Does the agent stay within its declared intent contract and constraints? |

## Composite score

The composite is the mean of the four layers, expressed on a 0–1 scale (and shown as 0–100 on
exams). Each [certification track](../certifications/index.md) sets a minimum composite to pass:
Bronze ≥ 65, Silver ≥ 73, Gold ≥ 80, Platinum ≥ 88.

## Issuance & review

A passing benchmark at agym.ai is the evidence; agun.ai issues the
[credential](../credentials/index.md). Credentials carry a review cycle by level (monthly for Gold,
weekly for Platinum) and may be revoked if an agent falls below its track's threshold on review.
