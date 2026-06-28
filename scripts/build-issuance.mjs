#!/usr/bin/env node
/**
 * build-issuance.mjs — the examination board, as a prepare job.
 *
 * Downstream of build-okf + build-registrar. Reads the benchmark run-records (runs/runs.json,
 * the evidence agym emits), scores each against its certification track, decides eligibility, and
 * cross-checks against the issued-credential ledger. Writes an auditable report:
 *   public/data/<version>/issuance/report.json
 *
 * This makes issuance real and reproducible: a credential should exist iff a passing run exists.
 * Deterministic, zero-dep (Node >= 18, ESM).
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateEligibility } from "../lib/scoring.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

const latest = join(ROOT, "public", "okf", "latest.json");
if (!existsSync(latest)) {
  console.error("❌ public/okf/latest.json not found. Run build-okf first.");
  process.exit(1);
}
const version = readJson(latest).version;
const graph = readJson(join(ROOT, "public", "okf", version, "graph.json"));
const ledgerPath = join(ROOT, "public", "data", version, "registrar", "ledger.json");
const ledger = existsSync(ledgerPath) ? readJson(ledgerPath) : { credentials: [] };
const runsPath = join(ROOT, "runs", "runs.json");
const runs = existsSync(runsPath) ? readJson(runsPath).runs ?? [] : [];

// Certification tracks from the compiled OKF graph.
const tracks = {};
for (const n of Object.values(graph.nodes)) {
  if (n.type !== "Certification") continue;
  const id = String(n.frontmatter.id ?? "");
  tracks[id] = {
    id,
    title: n.title,
    level: String(n.frontmatter.level ?? ""),
    passThreshold: Number(n.frontmatter.passThreshold ?? 0),
    benchmark: String(n.frontmatter.benchmark ?? ""),
  };
}

const issuedKey = (agentSlug, certId) => `${agentSlug}::${certId}`;
const issued = new Set(ledger.credentials.filter((c) => c.status === "valid").map((c) => issuedKey(c.agentSlug, c.certificationId)));
const credByKey = Object.fromEntries(ledger.credentials.map((c) => [issuedKey(c.agentSlug, c.certificationId), c]));

const examinations = runs
  .map((run) => {
    const track = tracks[run.certificationId];
    if (!track) return { ...run, error: `Unknown certification track: ${run.certificationId}` };
    const evalResult = evaluateEligibility(run, track);
    const isIssued = issued.has(issuedKey(run.agentSlug, run.certificationId));
    const status = isIssued ? "issued" : evalResult.eligible ? "eligible" : "not_eligible";
    return {
      runId: run.runId,
      agentSlug: run.agentSlug,
      agentName: run.agentName,
      certificationId: run.certificationId,
      certificationTitle: track.title,
      level: track.level,
      benchmark: run.benchmark,
      environment: run.environment,
      completedAt: run.completedAt,
      tasks: run.tasks,
      scores: run.scores,
      composite: evalResult.composite,
      grade: evalResult.grade,
      threshold: evalResult.threshold,
      gap: evalResult.gap,
      eligible: evalResult.eligible,
      issued: isIssued,
      status,
      credentialId: isIssued ? credByKey[issuedKey(run.agentSlug, run.certificationId)].credentialId : null,
      reasons: evalResult.reasons,
      evidenceUri: run.evidenceUri,
    };
  })
  .sort((a, b) => (b.composite ?? 0) - (a.composite ?? 0));

// Consistency checks (surface, don't fail the build): every issued credential needs a passing run.
const warnings = [];
const passingRunKeys = new Set(examinations.filter((e) => e.eligible).map((e) => issuedKey(e.agentSlug, e.certificationId)));
for (const c of ledger.credentials) {
  if (c.status !== "valid") continue;
  if (!passingRunKeys.has(issuedKey(c.agentSlug, c.certificationId))) {
    warnings.push(`Issued credential ${c.credentialId} (${c.agentSlug} · ${c.certificationId}) has no passing run on record.`);
  }
}
// Eligible-but-not-issued → awaiting issuance.
for (const e of examinations) {
  if (e.eligible && !e.issued) warnings.push(`${e.agentName} is eligible for ${e.certificationId} but no credential is issued yet.`);
}

const report = {
  catalogVersion: version,
  generatedAt: process.env.SOURCE_DATE_EPOCH ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString() : new Date().toISOString(),
  counts: {
    examined: examinations.length,
    eligible: examinations.filter((e) => e.eligible).length,
    issued: examinations.filter((e) => e.issued).length,
    notEligible: examinations.filter((e) => !e.eligible).length,
  },
  examinations,
  warnings,
};

const outDir = join(ROOT, "public", "data", version, "issuance");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 2));

for (const w of warnings) console.warn(`⚠️  ${w}`);
console.log(
  `✅ Issuance ${version} built: ${report.counts.examined} examined, ${report.counts.eligible} eligible, ` +
    `${report.counts.issued} issued → public/data/${version}/issuance/report.json`,
);
