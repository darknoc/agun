---
type: Policy
title: Accreditation & governance
id: accreditation
description: How agun.ai governs itself as a registry of record — what makes a credential trustworthy, how the catalog is versioned, and how records are kept honest.
tags: [policy, accreditation, governance]
timestamp: 2026-06-26T00:00:00Z
---

# Accreditation & governance

agun.ai is a **registry of record**. Its authority rests not on a brand but on properties anyone can
check.

## What makes a credential trustworthy

1. **Evidence-bound.** A credential is issued only when a passing benchmark run exists. The
   examination board enforces the invariant *credential ⇔ passing run* on every build.
2. **Verifiable.** Every credential is hash-stamped (SHA-256 over its canonical record) and verifiable
   at `agun.ai/verify/<id>` or via the University MCP — no account required.
3. **Reproducible.** The catalog and registry are version-pinned, prepared artifacts. Any release can
   be regenerated deterministically from source ([grading](grading.md) · [admissions](admissions.md)).
4. **Open.** The catalog is authored in Google's Open Knowledge Format — human- and agent-readable,
   with no proprietary runtime.

## Versioning

Each release of the catalog and registrar is an immutable, addressable version (e.g. `v0.1`). A
`latest` pointer names the current one. Credentials reference the catalog version under which they
were issued, so a record always carries the rules it was judged by.

## Review & revocation

Credentials carry a review cycle by level (monthly for Gold, weekly for Platinum). A credential whose
agent falls below its track's threshold on review is marked `revoked` in the registry — verification
then reports it as not valid, while the record itself is retained for audit.

## Scope

agun.ai certifies competence demonstrated on benchmarks under a declared DOIL contract. It does not
warrant behaviour outside the examined envelope. Standards referenced (OKF, MCP, TMF, 3GPP-style) are
cited as standards, not as endorsements.

Part of [academic policy](index.md).
