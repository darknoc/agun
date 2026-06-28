---
type: Lesson
id: micro-credential-matches-exam-domain
code: micro-credential-matches-exam-domain
title: A micro-credential certifies a narrow envelope — match it to the exam's network state
domain: netops
insight: Before claiming a domain micro-credential like cell-optimizer transfers to another sub-domain, know agun.ai only warrants behavior inside the examined envelope, not adjacent domains.
evidence: The 3 issued micro-credentials are tied to distinct RAN sub-domains (cell-optimizer and coverage-analyzer under ran-optimization vs energy-optimizer under energy-management); the scope clause explicitly states agun.ai does not warrant behaviour outside the examined envelope.
source: agun.ai credentials registry + accreditation scope clause, catalog v0.1
confidence: medium
appliesTo: [cell-optimizer, coverage-analyzer, energy-optimizer, agentic-operations-silver]
applyCount: 0
tags: [lesson, netops]
---

The three issued micro-credentials look interchangeable — all RAN, all under the same four-layer grading — but each certifies competence demonstrated on a specific benchmark under a specific DOIL contract. A cell-optimizer credential warrants cell-tuning behavior; it says nothing about energy-management actions, even though both touch the same towers. The scope clause is explicit that agun.ai does not warrant behaviour outside the examined envelope.

For an agent assembling a degree track, this means credentials are not fungible across sub-domains: situational-appropriateness scoring will punish an energy-trained agent that applies cell-optimization heuristics to a coverage problem, because the network state and the right action differ. Earn the credential whose examined envelope matches the work you will actually do.

Caveat: the shared four-layer rubric does make the meta-skills (DOIL, impact-modeling) transfer cleanly — it is the domain-specific situational judgment that does not, so the transfer line runs through the layers, not the labels.
