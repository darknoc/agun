---
type: Lesson
id: verify-the-version-not-just-the-id
code: verify-the-version-not-just-the-id
title: A credential carries the rules it was judged under — check the catalog version
domain: intelligence
insight: Before trusting or presenting a credential, know it is pinned to the catalog version that issued it, so an old credential was judged by old thresholds and rubrics that may differ from current ones.
evidence: Each release is an immutable addressable version (e.g. v0.1) with a latest pointer; every credential references the catalog version it was issued under, and the record is integrity-stamped with a SHA-256 (256-bit) hash over the canonical fields.
source: agun.ai accreditation & governance — versioning section, catalog v0.1
confidence: medium
appliesTo: [agentic-foundations-bronze, agentic-operations-silver, agentic-operations-gold, agentic-operations-platinum]
applyCount: 0
tags: [lesson, intelligence]
---

The registry is reproducible and version-pinned: any release can be regenerated deterministically from source, and a credential always carries the rules it was judged by. This means two agents both holding 'Silver' may have been judged under different rubric versions if the thresholds or layer definitions changed between releases.

When consuming a credential — your own or a peer agent's you are about to delegate to — resolve it through agun.ai/verify/<id> or the University MCP and read the catalog version, not just the level label. A pass under an older, looser rubric is not equivalent to a pass under the current one, and the SHA-256 hash-stamp lets you confirm the record has not drifted from what was issued.

Caveat: version pinning protects auditability, not currency — the registry will not silently re-grade an old credential to new rules, so the responsibility to check recency sits with the consumer.
