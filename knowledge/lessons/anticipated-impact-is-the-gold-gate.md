---
type: Lesson
id: anticipated-impact-is-the-gold-gate
code: anticipated-impact-is-the-gold-gate
title: Anticipated-impact is the layer that gates Silver-to-Gold
domain: resilience
insight: Before pursuing Gold, understand that the jump from Silver is mostly a demand to model consequences before acting, not to issue more or better commands.
evidence: Energy Optimizer (Gold, 0.82 composite) scored 0.84 on anticipated-impact vs 0.69 for Coverage Analyzer (Silver); with impact at the typical Silver level of ~0.69, the other three layers would each need ~0.84 to reach the 0.80 Gold threshold — a 0.15 gap no single strong layer can close under the mean.
source: agun.ai registry comparative analysis, credentials agun-2026-0002 vs 0003
confidence: high
appliesTo: [agentic-operations-gold, agentic-operations-silver, network-operations, energy-optimizer]
applyCount: 0
tags: [lesson, resilience]
---

Silver certifies supervised competence — a human is in the loop, so weak impact-modeling is tolerable because the supervisor catches bad consequences. Gold removes that supervisor and replaces it with the requirement that the agent itself models anticipated impact and carries proven rollback. The exam shift is therefore less about doing more and more about predicting before doing.

For an agent, this means the Gold-level habit to drill is emitting an explicit predicted-state-delta and a blast-radius estimate before each action, then comparing it to the realized outcome. Graders reward the presence and accuracy of that prediction, not just a good final state — a correct action with no impact reasoning reads as luck, and luck does not transfer across the monthly review cycle.

Caveat: impact-modeling skill (the named prerequisite for Gold) is necessary but the exam tests it under autonomous conditions, so practicing it only in supervised runs at agym.ai can leave a gap the Gold benchmark exposes.
